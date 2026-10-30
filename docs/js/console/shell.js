// nvo-sh: лексер, парсер и изпълнение (pipes, пренасочвания, променливи, $(...), $((...)), globs,
// псевдоними, история с !!) + вградените команди, които пипат състоянието на обвивката.
//
// Командите в pipeline се изпълняват една след друга: stdout на всяка се събира като текст и става stdin
// на следващата. Последната пише направо в терминала (или във файл при пренасочване).

import { define, lookup, commandNames, UsageError, ExitCode, helpText, getopt } from './registry.js';
import { palette } from './ansi.js';
import { FsError, normalize, HOME, USER, basename, isBinary } from './vfs.js';
import { EOF, INT } from './term.js';
import { evaluate, CalcError } from './calc.js';

export const DEFAULT_PS1 = '\\[\\e[1;32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ ';
export const DEFAULT_ALIASES = [['ll', 'ls -l'], ['la', 'ls -A'], ['l', 'ls -CF'], ['..', 'cd ..'], ['cls', 'clear']];

export class ShellSyntaxError extends Error {}

export class ExitSignal extends Error {
  constructor(code) {
    super('exit');
    this.code = code;
  }
}

export function abortError() {
  return new DOMException('Прекъснато', 'AbortError');
}

export function isAbort(e) {
  return !!e && e.name === 'AbortError';
}

// ─── Потоци ─────────────────────────────────────────────────────────────────────

export class BufferStream {
  constructor() {
    this.chunks = [];
    this.size = 0;
    this.isTTY = false;
  }

  write(s) {
    s = String(s);
    this.size += s.length;
    if (this.size > 64 * 1024 * 1024) throw new Error('изходът е твърде голям');
    this.chunks.push(s);
  }

  text() {
    return this.chunks.join('');
  }
}

class TermStream {
  constructor(term) {
    this.term = term;
    this.isTTY = true;
  }

  write(s) {
    this.term.write(s);
  }
}

const NULL_STREAM = { isTTY: false, write() {} };

// ─── Лексер ─────────────────────────────────────────────────────────────────────

function syntaxError(msg) {
  return new ShellSyntaxError(msg);
}

function unexpected(t) {
  let what = 'край на реда';
  if (t) what = t.type === 'op' ? (t.value === '\n' ? 'нов ред' : t.value) : t.type === 'redir' ? t.text : t.raw;
  return syntaxError("синтактична грешка близо до неочаквания знак '" + what + "'");
}

/** Индексът на ")", която затваря "(" преди start (с внимание към кавичките). */
function matchParen(src, start) {
  let depth = 1;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\') {
      i++;
    } else if (ch === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) break;
      i = end;
    } else if (ch === '"') {
      for (i++; i < src.length && src[i] !== '"'; i++) if (src[i] === '\\') i++;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw syntaxError("неочакван край на реда при търсене на съответстваща ')'");
}

function lexDollar(src, i, quoted) {
  if (src[i] === '`') {
    const end = src.indexOf('`', i + 1);
    if (end < 0) throw syntaxError("неочакван край на реда при търсене на съответстваща '`'");
    return { part: { t: 'cmd', src: src.slice(i + 1, end), q: quoted }, end: end + 1 };
  }
  const next = src[i + 1];
  if (next === '(' && src[i + 2] === '(') {
    let depth = 0;
    for (let j = i + 3; j < src.length; j++) {
      if (src[j] === '(') depth++;
      else if (src[j] === ')') {
        if (depth === 0) {
          if (src[j + 1] !== ')') break;
          return { part: { t: 'arith', src: src.slice(i + 3, j), q: quoted }, end: j + 2 };
        }
        depth--;
      }
    }
    throw syntaxError("неочакван край на реда при търсене на съответстващи '))'");
  }
  if (next === '(') {
    const end = matchParen(src, i + 2);
    return { part: { t: 'cmd', src: src.slice(i + 2, end), q: quoted }, end: end + 1 };
  }
  if (next === '{') {
    const end = src.indexOf('}', i + 2);
    if (end < 0) throw syntaxError("неочакван край на реда при търсене на съответстваща '}'");
    const body = src.slice(i + 2, end);
    let m = /^#([A-Za-z_]\w*)$/.exec(body);
    if (m) return { part: { t: 'var', name: m[1], len: true, q: quoted }, end: end + 1 };
    m = /^([A-Za-z_]\w*|\d+|[?#@*$!])(?::?([-=+])(.*))?$/s.exec(body);
    if (!m) throw syntaxError('${' + body + '}: лошо заместване');
    return { part: { t: 'var', name: m[1], op: m[2], word: m[3], q: quoted }, end: end + 1 };
  }
  if (next !== undefined && /[?#@*$!0-9]/.test(next)) {
    return { part: { t: 'var', name: next, q: quoted }, end: i + 2 };
  }
  const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1, i + 200));
  if (m) return { part: { t: 'var', name: m[0], q: quoted }, end: i + 1 + m[0].length };
  return null;
}

function lexWord(src, i) {
  const start = i;
  const parts = [];
  const pushLit = (v, q) => {
    const last = parts[parts.length - 1];
    if (last && last.t === 'lit' && last.q === q) last.v += v;
    else parts.push({ t: 'lit', v, q });
  };
  while (i < src.length) {
    const ch = src[i];
    if (' \t\n;|&<>()'.includes(ch)) break;
    if (ch === '\\') {
      if (src[i + 1] === '\n') {
        i += 2;
      } else if (i + 1 < src.length) {
        pushLit(src[i + 1], 'e');
        i += 2;
      } else {
        pushLit('\\', 'e');
        i++;
      }
      continue;
    }
    if (ch === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw syntaxError("неочакван край на реда при търсене на съответстваща \"'\"");
      pushLit(src.slice(i + 1, end), 's');
      i = end + 1;
      continue;
    }
    if (ch === '"') {
      pushLit('', 'd');
      i++;
      let closed = false;
      while (i < src.length) {
        const c = src[i];
        if (c === '"') {
          closed = true;
          i++;
          break;
        }
        if (c === '\\' && '$`"\\\n'.includes(src[i + 1] || '')) {
          if (src[i + 1] !== '\n') pushLit(src[i + 1], 'd');
          i += 2;
          continue;
        }
        if (c === '$' || c === '`') {
          const r = lexDollar(src, i, true);
          if (r) {
            parts.push(r.part);
            i = r.end;
            continue;
          }
        }
        pushLit(c, 'd');
        i++;
      }
      if (!closed) throw syntaxError('неочакван край на реда при търсене на съответстваща \'"\'');
      continue;
    }
    if (ch === '$' || ch === '`') {
      const r = lexDollar(src, i, false);
      if (r) {
        parts.push(r.part);
        i = r.end;
        continue;
      }
    }
    pushLit(ch, '');
    i++;
  }
  return { type: 'word', parts, raw: src.slice(start, i), end: i };
}

export function lex(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\\' && src[i + 1] === '\n') {
      i += 2;
      continue;
    }
    if (ch === '#') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    const rest = src.slice(i, i + 6);
    if (rest.startsWith('<<<')) {
      tokens.push({ type: 'redir', op: '<<<', fd: 0, text: '<<<' });
      i += 3;
      continue;
    }
    if (rest.startsWith('<<')) throw syntaxError('heredoc (<<КРАЙ) не се поддържа - ползвайте <<< "текст" или файл');
    let m = /^&>>?/.exec(rest);
    if (m) {
      tokens.push({ type: 'redir', op: m[0], fd: 'both', text: m[0] });
      i += m[0].length;
      continue;
    }
    m = /^(\d)?(>>|>|<)(?:&(\d))?/.exec(rest);
    if (m && (m[1] === undefined || /[<>]/.test(rest[1]))) {
      tokens.push({ type: 'redir', op: m[2], fd: m[1] !== undefined ? Number(m[1]) : m[2] === '<' ? 0 : 1, dup: m[3] !== undefined ? Number(m[3]) : undefined, text: m[0] });
      i += m[0].length;
      continue;
    }
    m = /^(&&|\|\||[;|&()\n])/.exec(rest);
    if (m) {
      tokens.push({ type: 'op', value: m[0] });
      i += m[0].length;
      continue;
    }
    const w = lexWord(src, i);
    tokens.push(w);
    i = w.end;
  }
  return tokens;
}

// ─── Парсер ─────────────────────────────────────────────────────────────────────

function plainLiteral(t) {
  if (t.type === 'word' && t.parts.length === 1 && t.parts[0].t === 'lit' && t.parts[0].q === '') return t.parts[0].v;
  return null;
}

function assignment(t) {
  const first = t.parts[0];
  if (!first || first.t !== 'lit' || first.q !== '') return null;
  const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(first.v);
  if (!m) return null;
  const parts = [{ ...first, v: first.v.slice(m[0].length) }, ...t.parts.slice(1)];
  return { name: m[1], word: { type: 'word', parts, raw: t.raw.slice(m[0].length) } };
}

class Parser {
  constructor(tokens, aliases) {
    this.tokens = tokens;
    this.pos = 0;
    this.aliases = aliases;
  }

  peek() {
    return this.tokens[this.pos];
  }

  isOp(v) {
    const t = this.peek();
    return !!t && t.type === 'op' && t.value === v;
  }

  skipNewlines() {
    while (this.isOp('\n')) this.pos++;
  }

  parseProgram() {
    const list = this.parseList();
    if (this.pos < this.tokens.length) throw unexpected(this.peek());
    return list;
  }

  parseList() {
    const items = [];
    for (;;) {
      this.skipNewlines();
      const t = this.peek();
      if (!t) break;
      if (t.type === 'op' && t.value !== '(') {
        if (t.value === ')') break;
        throw unexpected(t);
      }
      items.push(this.parseAndOr());
      const sep = this.peek();
      if (!sep) break;
      if (sep.type === 'op' && (sep.value === ';' || sep.value === '\n')) {
        this.pos++;
        continue;
      }
      if (sep.type === 'op' && sep.value === '&') throw syntaxError('фоновите задачи (&) не се поддържат');
      throw unexpected(sep);
    }
    return { type: 'list', items };
  }

  parseAndOr() {
    const first = this.parsePipeline();
    const rest = [];
    while (this.isOp('&&') || this.isOp('||')) {
      const op = this.peek().value;
      this.pos++;
      this.skipNewlines();
      rest.push({ op, node: this.parsePipeline() });
    }
    return { type: 'andor', first, rest };
  }

  parsePipeline() {
    let negate = false;
    const t = this.peek();
    if (t && plainLiteral(t) === '!') {
      negate = true;
      this.pos++;
    }
    const cmds = [this.parseSimple()];
    while (this.isOp('|')) {
      this.pos++;
      this.skipNewlines();
      cmds.push(this.parseSimple());
    }
    return { type: 'pipeline', negate, cmds };
  }

  parseSimple() {
    const assigns = [];
    const words = [];
    const redirs = [];
    const expanding = new Set();
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.type === 'op' && t.value === '(') throw syntaxError('подобвивките ( ... ) не се поддържат');
      if (t.type === 'redir') {
        this.pos++;
        let target = null;
        if (t.dup === undefined) {
          const w = this.peek();
          if (!w || w.type !== 'word') throw unexpected(w);
          target = w;
          this.pos++;
        }
        redirs.push({ fd: t.fd, op: t.op, dup: t.dup, target });
        continue;
      }
      if (t.type !== 'word') break;
      if (!words.length) {
        const name = plainLiteral(t);
        if (name !== null && this.aliases.has(name) && !expanding.has(name)) {
          expanding.add(name);
          this.tokens.splice(this.pos, 1, ...lex(this.aliases.get(name)));
          continue;
        }
        const a = assignment(t);
        if (a) {
          assigns.push(a);
          this.pos++;
          continue;
        }
      }
      words.push(t);
      this.pos++;
    }
    if (!words.length && !assigns.length && !redirs.length) throw unexpected(this.peek());
    return { type: 'simple', assigns, words, redirs };
  }
}

export function parse(src, aliases = new Map()) {
  return new Parser(lex(src), aliases).parseProgram();
}

// ─── Помощни ────────────────────────────────────────────────────────────────────

/** Разгъване на фигурни скоби: a{b,c}d → abd acd, {1..3} → 1 2 3, {a..c} → a b c. */
export function braceExpand(str) {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}' && depth > 0) {
      depth--;
      if (depth === 0) {
        const body = str.slice(start + 1, i);
        const pre = str.slice(0, start);
        const post = str.slice(i + 1);
        let alts = null;
        const range = /^(-?\d+)\.\.(-?\d+)(?:\.\.(\d+))?$|^([A-Za-z])\.\.([A-Za-z])$/.exec(body);
        if (range) {
          alts = [];
          if (range[1] !== undefined) {
            const a = Number(range[1]);
            const b = Number(range[2]);
            const step = Math.max(1, Number(range[3] || 1));
            const width = /^-?0\d/.test(range[1]) || /^-?0\d/.test(range[2]) ? Math.max(range[1].length, range[2].length) : 0;
            for (let x = a; a <= b ? x <= b : x >= b; x += a <= b ? step : -step) {
              alts.push(width ? String(x).padStart(width, '0') : String(x));
              if (alts.length > 10000) break;
            }
          } else {
            const a = range[4].charCodeAt(0);
            const b = range[5].charCodeAt(0);
            for (let x = a; a <= b ? x <= b : x >= b; x += a <= b ? 1 : -1) alts.push(String.fromCharCode(x));
          }
        } else {
          const parts = [];
          let d = 0;
          let cur = '';
          for (const c of body) {
            if (c === '{') d++;
            if (c === '}') d--;
            if (c === ',' && d === 0) {
              parts.push(cur);
              cur = '';
            } else cur += c;
          }
          parts.push(cur);
          if (parts.length > 1) alts = parts;
        }
        if (!alts) return braceExpand(post).map((p) => pre + '{' + body + '}' + p);
        const out = [];
        for (const alt of alts) for (const rest of braceExpand(alt + post)) out.push(pre + rest);
        return out;
      }
    }
  }
  return [str];
}

function escapeGlob(s) {
  return s.replace(/[*?[\\]/g, '\\$&');
}

/** Екранира име за командния ред (за Tab допълването). ~ в началото остава. */
export function escapeArg(s) {
  const esc = (x) => x.replace(/([ \t'"\\$`!&|;<>()*?[\]#{}])/g, '\\$1');
  if (s === '~' || s.startsWith('~/')) return '~' + esc(s.slice(1));
  return esc(s);
}

const decoder = new TextDecoder();

function asText(content) {
  return isBinary(content) ? decoder.decode(content) : String(content);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// ─── Обвивката ──────────────────────────────────────────────────────────────────

export class Shell {
  constructor({ term, fs }) {
    this.term = term;
    this.fs = fs;
    this.env = {
      HOME,
      USER,
      LOGNAME: USER,
      HOSTNAME: 'nvo',
      SHELL: '/bin/nvo-sh',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      PWD: HOME,
      OLDPWD: HOME,
      LANG: 'bg_BG.UTF-8',
      TERM: 'xterm-256color',
      EDITOR: 'nano',
      PAGER: 'less',
      PS1: DEFAULT_PS1,
      COLUMNS: String(term.cols),
      LINES: String(term.rows),
    };
    this.aliases = new Map(DEFAULT_ALIASES);
    this.status = 0;
    this.frames = [{ argv0: 'nvo-sh', args: [] }];
    this.controller = null;
    this.jobs = [];
    this.startedAt = Date.now();
    term.onResize = (cols, rows) => {
      this.env.COLUMNS = String(cols);
      this.env.LINES = String(rows);
    };
    term.onInterrupt = () => {
      if (this.controller) this.controller.abort();
    };
  }

  get cwd() {
    return this.env.PWD;
  }

  get frame() {
    return this.frames[this.frames.length - 1];
  }

  resolve(path) {
    const p = String(path);
    if (p === '~') return HOME;
    if (p.startsWith('~/')) return normalize(HOME + p.slice(1));
    return normalize(p, this.cwd);
  }

  displayPath(p) {
    if (p === HOME) return '~';
    if (p.startsWith(HOME + '/')) return '~' + p.slice(HOME.length);
    return p;
  }

  updateTitle() {
    this.term.setTitle(USER + '@' + this.env.HOSTNAME + ': ' + this.displayPath(this.cwd));
  }

  prompt() {
    const now = new Date();
    return String(this.env.PS1 === undefined ? '' : this.env.PS1)
      .replace(/\\033|\\x1b/g, '\x1b')
      .replace(/\\(.)/g, (m, c) => {
        switch (c) {
          case 'u': return USER;
          case 'h': return String(this.env.HOSTNAME || 'nvo').split('.')[0];
          case 'H': return String(this.env.HOSTNAME || 'nvo');
          case 'w': return this.displayPath(this.cwd);
          case 'W': {
            const d = this.displayPath(this.cwd);
            return d === '~' || d === '/' ? d : basename(this.cwd);
          }
          case '$': return '$';
          case 'n': return '\n';
          case 't': return pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
          case 'A': return pad2(now.getHours()) + ':' + pad2(now.getMinutes());
          case 'e': return '\x1b';
          case '[': case ']': return '';
          case '\\': return '\\';
          default: return m;
        }
      });
  }

  check() {
    if (this.controller && this.controller.signal.aborted) throw abortError();
  }

  // ─── История (!!, !n, !префикс, !$) ──────────────────────────────────────────

  expandHistory(line) {
    if (!line.includes('!')) return line;
    const base = this.term.history.slice();
    if (base[base.length - 1] === line) base.pop();
    let out = '';
    let inSingle = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'") inSingle = !inSingle;
      if (ch === '\\' && line[i + 1] === '!') {
        out += '\\!';
        i++;
        continue;
      }
      if (ch !== '!' || inSingle) {
        out += ch;
        continue;
      }
      const rest = line.slice(i + 1);
      let ev;
      let len;
      let m;
      if (rest.startsWith('!')) {
        ev = base[base.length - 1];
        len = 1;
      } else if (rest.startsWith('$')) {
        const last = base[base.length - 1];
        ev = last === undefined ? undefined : last.trim().split(/\s+/).pop();
        len = 1;
      } else if ((m = /^-?\d+/.exec(rest))) {
        const n = Number(m[0]);
        ev = n < 0 ? base[base.length + n] : base[n - 1];
        len = m[0].length;
      } else if ((m = /^[^\s!;|&<>()="'$]+/.exec(rest))) {
        for (let k = base.length - 1; k >= 0; k--) {
          if (base[k].startsWith(m[0])) {
            ev = base[k];
            break;
          }
        }
        len = m[0].length;
      } else {
        out += ch;
        continue;
      }
      if (ev === undefined) throw new Error('!' + rest.slice(0, len) + ': събитието не е намерено');
      out += ev;
      i += len;
    }
    return out;
  }

  // ─── Изпълнение ──────────────────────────────────────────────────────────────

  ttyIo() {
    const out = new TermStream(this.term);
    return { stdin: null, stdout: out, stderr: out };
  }

  /** Изпълнява ред, въведен от потребителя. ExitSignal излиза навън (край на сесията). */
  async runInteractive(line) {
    let src = line;
    try {
      const expanded = this.expandHistory(line);
      if (expanded !== line) {
        this.term.write(expanded + '\n');
        const h = this.term.history;
        if (h[h.length - 1] === line) {
          h[h.length - 1] = expanded;
          this.term.saveHistory();
        }
        src = expanded;
      }
    } catch (e) {
      this.term.write('nvo-sh: ' + e.message + '\n');
      this.status = 1;
      return;
    }
    this.controller = new AbortController();
    try {
      await this.runSource(src, this.ttyIo());
    } catch (e) {
      if (e instanceof ExitSignal) throw e;
      if (isAbort(e)) {
        this.status = 130;
        this.term.write('\n');
      } else {
        this.term.write('nvo-sh: ' + (e && e.message ? e.message : e) + '\n');
        console.error(e);
        this.status = 1;
      }
    } finally {
      this.controller = null;
      this.term.resetStyle();
    }
  }

  async runSource(src, io) {
    let ast;
    try {
      ast = parse(src, this.aliases);
    } catch (e) {
      if (e instanceof ShellSyntaxError) {
        io.stderr.write('nvo-sh: ' + e.message + '\n');
        this.status = 2;
        return 2;
      }
      throw e;
    }
    for (const item of ast.items) {
      this.check();
      await this.execAndOr(item, io);
    }
    return this.status;
  }

  async execAndOr(node, io) {
    let st = await this.execPipeline(node.first, io);
    for (const { op, node: p } of node.rest) {
      if ((op === '&&' && st === 0) || (op === '||' && st !== 0)) st = await this.execPipeline(p, io);
    }
    return st;
  }

  async execPipeline(pl, io) {
    let st = 0;
    let input = io.stdin;
    for (let i = 0; i < pl.cmds.length; i++) {
      this.check();
      const last = i === pl.cmds.length - 1;
      const out = last ? io.stdout : new BufferStream();
      st = await this.execSimple(pl.cmds[i], { stdin: input, stdout: out, stderr: io.stderr });
      if (!last) input = out.text();
    }
    if (pl.negate) st = st === 0 ? 1 : 0;
    this.status = st;
    return st;
  }

  async execSimple(cmd, io) {
    let argv = [];
    const assigns = {};
    try {
      for (const w of cmd.words) argv.push(...(await this.expandWord(w, io)));
      for (const a of cmd.assigns) assigns[a.name] = (await this.expandWord(a.word, io, { noSplit: true, noGlob: true })).join(' ');
    } catch (e) {
      if (e instanceof CalcError) {
        io.stderr.write('nvo-sh: ' + e.message + '\n');
        return (this.status = 1);
      }
      throw e;
    }

    let stdin = io.stdin;
    let stdout = io.stdout;
    let stderr = io.stderr;
    const files = [];
    for (const r of cmd.redirs) {
      let path = null;
      if (r.target) {
        const t = await this.expandWord(r.target, io, { noSplit: true });
        if (t.length !== 1) {
          io.stderr.write('nvo-sh: ' + r.target.raw + ': двусмислено пренасочване\n');
          return (this.status = 1);
        }
        path = t[0];
      }
      try {
        if (r.dup !== undefined) {
          const dst = r.dup === 2 ? stderr : stdout;
          if (r.fd === 2) stderr = dst;
          else stdout = dst;
        } else if (r.op === '<<<') {
          stdin = path + '\n';
        } else if (r.op === '<') {
          stdin = asText(await this.fs.readFile(this.resolve(path)));
        } else {
          const stream = await this.fileStream(path, r.op === '>>' || r.op === '&>>');
          files.push(stream);
          if (r.fd === 'both') {
            stdout = stream;
            stderr = stream;
          } else if (r.fd === 2) {
            stderr = stream;
          } else {
            stdout = stream;
          }
        }
      } catch (e) {
        if (e instanceof FsError) {
          io.stderr.write('nvo-sh: ' + path + ': ' + e.message + '\n');
          return (this.status = 1);
        }
        throw e;
      }
    }

    if (!argv.length) {
      Object.assign(this.env, assigns);
      for (const f of files) await f.flush();
      return (this.status = 0);
    }
    const env = Object.keys(assigns).length ? { ...this.env, ...assigns } : this.env;
    let st;
    try {
      st = await this.runArgv(argv, { stdin, stdout, stderr }, env);
    } finally {
      for (const f of files) {
        try {
          await f.flush();
        } catch (e) {
          io.stderr.write('nvo-sh: ' + f.shown + ': ' + e.message + '\n');
          st = 1;
        }
      }
    }
    return (this.status = st);
  }

  async fileStream(path, append) {
    const abs = this.resolve(path);
    if (abs === '/dev/null') return { ...NULL_STREAM, flush: async () => {}, shown: path };
    // Като bash: ">" изпразва файла още при отварянето.
    if (!append) await this.fs.writeFile(abs, '');
    else if (!(await this.fs.exists(abs))) await this.fs.writeFile(abs, '');
    const buf = new BufferStream();
    const fs = this.fs;
    return {
      isTTY: false,
      shown: path,
      write: (s) => buf.write(s),
      flush: async () => {
        const text = buf.text();
        if (text) await fs.writeFile(abs, text, { append: true });
      },
    };
  }

  async runArgv(argv, io, env = this.env) {
    const name = argv[0];
    if (name.includes('/')) return this.runScriptPath(name, argv, io);
    const spec = lookup(name);
    if (!spec) {
      for (const dir of String(env.PATH || '').split(':')) {
        if (!dir || dir === '/bin' || dir === '/usr/bin' || dir === '/usr/local/bin') continue;
        const p = normalize(name, this.resolve(dir));
        try {
          const node = await this.fs.lookup(p);
          if (node.type === 'file') return this.runScriptPath(p, argv, io);
        } catch {
          // няма такъв файл в тази директория
        }
      }
      io.stderr.write(name + ': командата не е намерена\n');
      return 127;
    }
    if (!spec.rawArgs && argv.slice(1).includes('--help')) {
      io.stdout.write(helpText(spec));
      return 0;
    }
    const ctx = this.makeCtx(spec, argv, io, env);
    this.jobs.push(name);
    try {
      const r = await spec.run(ctx);
      return typeof r === 'number' ? r : 0;
    } catch (e) {
      return this.handleError(e, ctx, io);
    } finally {
      this.jobs.pop();
    }
  }

  handleError(e, ctx, io) {
    if (e instanceof ExitSignal || isAbort(e)) throw e;
    if (e instanceof ExitCode) return e.code;
    if (e instanceof UsageError) {
      ctx.err(e.message);
      io.stderr.write("Опитайте '" + ctx.name + " --help' за повече информация.\n");
      return 2;
    }
    if (e instanceof FsError) {
      ctx.err((e.shown || e.path) + ': ' + e.message);
      return 1;
    }
    ctx.err(e && e.message ? e.message : String(e));
    if (!(e instanceof CalcError)) console.error(e);
    return 1;
  }

  makeCtx(spec, argv, io, env) {
    const sh = this;
    const c = palette(io.stdout.isTTY && !('NO_COLOR' in env));
    const prefix = spec.builtin ? 'nvo-sh: ' + argv[0] : argv[0];
    let lastTick = performance.now();
    const signal = this.controller ? this.controller.signal : new AbortController().signal;
    const ctx = {
      spec,
      name: argv[0],
      argv,
      args: argv.slice(1),
      env,
      sh,
      fs: this.fs,
      term: this.term,
      stdin: io.stdin,
      stdout: io.stdout,
      stderr: io.stderr,
      io,
      c,
      signal,
      isTTY: io.stdout.isTTY,
      get cols() {
        return io.stdout.isTTY ? sh.term.cols : Infinity;
      },
      out(s) {
        io.stdout.write(s);
      },
      print(s = '') {
        io.stdout.write(s + '\n');
      },
      err(msg) {
        io.stderr.write(prefix + ': ' + msg + '\n');
      },
      fail(msg, code = 1) {
        ctx.err(msg);
        return code;
      },
      resolve(p) {
        return sh.resolve(p);
      },
      check() {
        if (signal.aborted) throw abortError();
      },
      /** Пуска браузъра да диша при дълги цикли (и Ctrl+C да работи). */
      async tick() {
        if (performance.now() - lastTick > 25) {
          await new Promise((r) => setTimeout(r, 0));
          lastTick = performance.now();
          ctx.check();
        }
      },
      sleep(ms) {
        return new Promise((resolve, reject) => {
          const t = setTimeout(resolve, ms);
          signal.addEventListener('abort', () => {
            clearTimeout(t);
            reject(abortError());
          }, { once: true });
        });
      },
      /** Целият stdin: от pipe/файл или от терминала до Ctrl+D. */
      async readAll() {
        if (io.stdin !== null) return io.stdin;
        let text = '';
        for await (const line of ctx.lines()) text += line + '\n';
        return text;
      },
      async *lines() {
        if (io.stdin !== null) {
          const arr = io.stdin.split('\n');
          if (arr[arr.length - 1] === '') arr.pop();
          yield* arr;
          return;
        }
        for (;;) {
          const line = await sh.term.readLine('', { stdin: true });
          if (line === EOF) return;
          if (line === INT) throw abortError();
          yield line;
        }
      },
      /** Чете файловете от аргументите ("-" или нищо = stdin). Грешките се печатат; ctx.failed става true. */
      async readInputs(files) {
        const out = [];
        if (!files.length) files = ['-'];
        for (const f of files) {
          if (f === '-') {
            out.push({ name: '-', text: await ctx.readAll() });
            continue;
          }
          try {
            out.push({ name: f, text: asText(await sh.fs.readFile(sh.resolve(f))) });
          } catch (e) {
            if (!(e instanceof FsError)) throw e;
            ctx.err(f + ': ' + e.message);
            ctx.failed = true;
          }
        }
        return out;
      },
      failed: false,
      getopt(spec2) {
        return getopt(ctx.args, spec2);
      },
    };
    return ctx;
  }

  async runScriptPath(path, argv, io) {
    const abs = this.resolve(path);
    let node;
    try {
      node = await this.fs.lookup(abs);
    } catch (e) {
      io.stderr.write('nvo-sh: ' + path + ': ' + e.message + '\n');
      return 127;
    }
    if (node.type === 'dir') {
      io.stderr.write('nvo-sh: ' + path + ': Е директория\n');
      return 126;
    }
    if (!(node.mode & 0o111)) {
      io.stderr.write('nvo-sh: ' + path + ': Отказан достъп\n');
      return 126;
    }
    const text = asText(await this.fs.readFile(abs));
    return this.runScript(text, path, argv.slice(1), io);
  }

  async runScript(text, argv0, args, io) {
    this.frames.push({ argv0, args });
    try {
      return await this.runSource(text, io);
    } catch (e) {
      if (e instanceof ExitSignal) return (this.status = e.code);
      throw e;
    } finally {
      this.frames.pop();
    }
  }

  // ─── Разгъване на думите ──────────────────────────────────────────────────────

  async expandWord(word, io, { noSplit = false, noGlob = false } = {}) {
    // {a,b} и {1..5} - само в думи без кавички и без $ (най-честият случай).
    if (!noSplit && word.parts.length === 1 && word.parts[0].t === 'lit' && word.parts[0].q === '' && /\{[^{}]*(,|\.\.)[^{}]*\}/.test(word.parts[0].v)) {
      const words = braceExpand(word.parts[0].v);
      if (words.length > 1) {
        const out = [];
        for (const w of words) out.push(...(await this.expandWord({ type: 'word', parts: [{ t: 'lit', v: w, q: '' }], raw: w }, io, { noGlob })));
        return out;
      }
    }
    const fields = [];
    let cur = '';
    let pat = '';
    let has = false;
    let globbable = false;
    const push = () => {
      fields.push({ text: cur, pat, globbable });
      cur = '';
      pat = '';
      has = false;
      globbable = false;
    };
    const parts = word.parts;
    for (let idx = 0; idx < parts.length; idx++) {
      const p = parts[idx];
      if (p.t === 'lit') {
        let v = p.v;
        if (p.q === '' && idx === 0 && (v === '~' || v.startsWith('~/'))) {
          cur += HOME;
          pat += escapeGlob(HOME);
          v = v.slice(1);
          has = true;
        }
        cur += v;
        has = true;
        if (p.q === '') {
          pat += v;
          if (/[*?[]/.test(v)) globbable = true;
        } else {
          pat += escapeGlob(v);
        }
        continue;
      }
      const value = await this.expandPart(p, io);
      if (p.q || noSplit) {
        cur += value;
        pat += escapeGlob(value);
        has = true;
        continue;
      }
      if (value === '') continue;
      const pieces = value.split(/[ \t\n]+/);
      pieces.forEach((piece, k) => {
        if (k > 0 && has) push();
        if (piece !== '') {
          cur += piece;
          pat += piece;
          has = true;
          if (/[*?[]/.test(piece)) globbable = true;
        }
      });
    }
    if (has) push();
    const out = [];
    for (const f of fields) {
      if (f.globbable && !noGlob) {
        const matches = await this.fs.glob(f.pat, this.cwd);
        if (matches.length) {
          out.push(...matches);
          continue;
        }
      }
      out.push(f.text);
    }
    return out;
  }

  async expandString(text, io) {
    const w = lexWord('"' + text.replace(/["\\]/g, '\\$&') + '"', 0);
    return (await this.expandWord(w, io, { noSplit: true, noGlob: true })).join(' ');
  }

  async expandPart(p, io) {
    if (p.t === 'cmd') return this.captureOutput(p.src, io);
    if (p.t === 'arith') {
      const expr = await this.expandString(p.src, io);
      return String(evaluate(expr, { vars: this.env, mode: 'shell' }));
    }
    const name = p.name;
    const frame = this.frame;
    let v;
    if (name === '?') v = String(this.status);
    else if (name === '$') v = '4242';
    else if (name === '!') v = '';
    else if (name === '#') v = String(frame.args.length);
    else if (name === '@' || name === '*') v = frame.args.join(' ');
    else if (/^\d+$/.test(name)) v = name === '0' ? frame.argv0 : frame.args[Number(name) - 1] || '';
    else v = this.env[name] === undefined ? '' : String(this.env[name]);
    if (p.len) return String(Array.from(v).length);
    if (p.op === '-') return v === '' ? this.expandString(p.word || '', io) : v;
    if (p.op === '=') {
      if (v === '') {
        v = await this.expandString(p.word || '', io);
        this.env[name] = v;
      }
      return v;
    }
    if (p.op === '+') return v !== '' ? this.expandString(p.word || '', io) : '';
    return v;
  }

  async captureOutput(src, io) {
    const out = new BufferStream();
    try {
      await this.runSource(src, { stdin: io.stdin, stdout: out, stderr: io.stderr });
    } catch (e) {
      if (!(e instanceof ExitSignal)) throw e;
    }
    return out.text().replace(/\n+$/, '');
  }

  // ─── Tab допълване ──────────────────────────────────────────────────────────

  async complete(line, cursor) {
    const left = line.slice(0, cursor);
    const tokens = [];
    let t = null;
    let inS = false;
    let inD = false;
    for (let i = 0; i < left.length; i++) {
      const ch = left[i];
      if (inS) {
        if (ch === "'") inS = false;
        else t.text += ch;
        continue;
      }
      if (inD) {
        if (ch === '"') inD = false;
        else if (ch === '\\' && i + 1 < left.length) t.text += left[++i];
        else t.text += ch;
        continue;
      }
      if (ch === ' ' || ch === '\t') {
        if (t) tokens.push(t);
        t = null;
        continue;
      }
      if ('|;&<>()'.includes(ch)) {
        if (t) tokens.push(t);
        t = null;
        tokens.push({ op: ch, start: i });
        continue;
      }
      if (!t) t = { text: '', start: i };
      if (ch === "'") inS = true;
      else if (ch === '"') inD = true;
      else if (ch === '\\' && i + 1 < left.length) t.text += left[++i];
      else t.text += ch;
    }
    const current = t || { text: '', start: left.length };
    // Думите на текущата команда преди думата под курсора.
    const words = [];
    let afterRedirect = false;
    for (let k = tokens.length - 1; k >= 0; k--) {
      const tok = tokens[k];
      if (tok.op) {
        if (tok.op === '<' || tok.op === '>') {
          if (k === tokens.length - 1) afterRedirect = true;
          continue;
        }
        break;
      }
      words.unshift(tok.text);
    }
    while (words.length && /^[A-Za-z_]\w*=/.test(words[0])) words.shift();
    const word = current.text;
    let candidates = [];

    if (word.startsWith('$') && !word.includes('/')) {
      const prefix = word.slice(1).replace(/^\{/, '');
      candidates = Object.keys(this.env).filter((k) => k.startsWith(prefix)).sort().map((k) => ({ value: '$' + k, raw: true }));
    } else if (!words.length && !afterRedirect && !word.includes('/')) {
      const names = new Set([...commandNames(), ...this.aliases.keys()]);
      candidates = Array.from(names).filter((n) => n.startsWith(word)).sort().map((n) => ({ value: n }));
    } else {
      let cmdName = words[0];
      if (cmdName && this.aliases.has(cmdName)) cmdName = this.aliases.get(cmdName).trim().split(/\s+/)[0];
      const spec = !afterRedirect && cmdName ? lookup(cmdName) : null;
      let res = null;
      if (spec && typeof spec.complete === 'function') {
        res = await spec.complete({ word, args: words.slice(1), sh: this, fs: this.fs });
      } else if (spec && spec.complete === 'commands' && words.length === 1) {
        res = commandNames().filter((n) => n.startsWith(word)).map((n) => ({ value: n }));
      }
      if (res) {
        candidates = res.map((r) => (typeof r === 'string' ? { value: r } : r)).filter((r) => r.value.startsWith(word) || r.match);
      } else {
        candidates = await this.completePath(word, spec && spec.complete === 'dirs');
      }
    }
    candidates = candidates.map((cand) => ({
      ...cand,
      display: cand.display || cand.value,
      value: cand.raw ? cand.value : escapeArg(cand.value),
    }));
    return { start: current.start, candidates };
  }

  async completePath(word, dirsOnly) {
    const slash = word.lastIndexOf('/');
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
    const base = word.slice(dirPart.length);
    const absDir = dirPart ? this.resolve(dirPart) : this.cwd;
    let names = [];
    try {
      names = await this.fs.readdir(absDir);
    } catch {
      return [];
    }
    const out = [];
    for (const name of names) {
      if (!name.startsWith(base)) continue;
      if (name.startsWith('.') && !base.startsWith('.')) continue;
      let isDir = false;
      try {
        isDir = (await this.fs.lookup(normalize(name, absDir))).type === 'dir';
      } catch {
        continue;
      }
      if (dirsOnly && !isDir) continue;
      out.push({ value: dirPart + name, display: name + (isDir ? '/' : ''), suffix: isDir ? '/' : ' ' });
    }
    return out;
  }
}

// ─── Вградени команди ─────────────────────────────────────────────────────────────

define({
  name: 'cd',
  group: 'shell',
  builtin: true,
  summary: 'смяна на текущата директория',
  usage: 'cd [ДИРЕКТОРИЯ]',
  description: 'Без аргумент отива в домашната директория (~). "cd -" се връща в предишната директория.',
  examples: [['cd /etc', 'отива в /etc'], ['cd -', 'обратно в предишната директория'], ['cd', 'в ~']],
  complete: 'dirs',
  async run(ctx) {
    const sh = ctx.sh;
    if (ctx.args.length > 1) return ctx.fail('твърде много аргументи');
    let target = ctx.args[0];
    let print = false;
    if (target === undefined || target === '') target = sh.env.HOME || HOME;
    if (target === '-') {
      target = sh.env.OLDPWD || sh.cwd;
      print = true;
    }
    const abs = sh.resolve(target);
    let node;
    try {
      node = await ctx.fs.lookup(abs);
    } catch (e) {
      return ctx.fail(target + ': ' + e.message);
    }
    if (node.type !== 'dir') return ctx.fail(target + ': Не е директория');
    if (node.noAccess) return ctx.fail(target + ': Отказан достъп');
    sh.env.OLDPWD = sh.cwd;
    sh.env.PWD = abs;
    sh.updateTitle();
    if (print) ctx.print(abs);
    return 0;
  },
});

define({
  name: 'export',
  group: 'shell',
  builtin: true,
  summary: 'задава променлива на средата',
  usage: 'export [ИМЕ[=СТОЙНОСТ]]...',
  description: 'Без аргументи изрежда всички променливи. Всички променливи в nvo-sh са експортирани.',
  examples: [['export EDITOR=nano', ''], ['export PS1="\\w\\$ "', 'по-кратка подкана']],
  run(ctx) {
    const args = ctx.args.filter((a) => a !== '-p');
    if (!args.length) {
      for (const k of Object.keys(ctx.sh.env).sort()) ctx.print('declare -x ' + k + '="' + String(ctx.sh.env[k]).replace(/["\\$`]/g, '\\$&') + '"');
      return 0;
    }
    let st = 0;
    for (const a of args) {
      const m = /^([A-Za-z_]\w*)(?:=(.*))?$/s.exec(a);
      if (!m) {
        ctx.err("'" + a + "': невалиден идентификатор");
        st = 1;
        continue;
      }
      if (m[2] !== undefined) ctx.sh.env[m[1]] = m[2];
      else if (ctx.sh.env[m[1]] === undefined) ctx.sh.env[m[1]] = '';
    }
    return st;
  },
  complete: ({ sh }) => Object.keys(sh.env).sort(),
});

define({
  name: 'unset',
  group: 'shell',
  builtin: true,
  summary: 'премахва променлива',
  usage: 'unset ИМЕ...',
  run(ctx) {
    for (const a of ctx.args) if (a !== '-v') delete ctx.sh.env[a];
    return 0;
  },
  complete: ({ sh }) => Object.keys(sh.env).sort(),
});

define({
  name: 'alias',
  group: 'shell',
  builtin: true,
  summary: 'задава или показва псевдоними',
  usage: 'alias [ИМЕ[=СТОЙНОСТ]]...',
  description: 'Псевдонимът замества първата дума на командата. Пази се до края на сесията; за постоянни псевдоними ги запишете в ~/.nvorc.',
  examples: [["alias ll='ls -l'", ''], ["alias top7='nvo rank 7 sofia -n 10'", '']],
  run(ctx) {
    const sh = ctx.sh;
    const show = (k) => ctx.print('alias ' + k + "='" + sh.aliases.get(k).replace(/'/g, "'\\''") + "'");
    if (!ctx.args.length || (ctx.args.length === 1 && ctx.args[0] === '-p')) {
      for (const k of Array.from(sh.aliases.keys()).sort()) show(k);
      return 0;
    }
    let st = 0;
    for (const a of ctx.args) {
      const eq = a.indexOf('=');
      if (eq > 0) {
        sh.aliases.set(a.slice(0, eq), a.slice(eq + 1));
      } else if (sh.aliases.has(a)) {
        show(a);
      } else {
        ctx.err(a + ': не е намерен');
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'unalias',
  group: 'shell',
  builtin: true,
  summary: 'премахва псевдоним',
  usage: 'unalias [-a] ИМЕ...',
  run(ctx) {
    if (ctx.args.includes('-a')) {
      ctx.sh.aliases.clear();
      return 0;
    }
    let st = 0;
    for (const a of ctx.args) {
      if (!ctx.sh.aliases.delete(a)) {
        ctx.err(a + ': не е намерен');
        st = 1;
      }
    }
    return st;
  },
  complete: ({ sh }) => Array.from(sh.aliases.keys()).sort(),
});

define({
  name: 'source',
  aliases: ['.'],
  group: 'shell',
  builtin: true,
  summary: 'изпълнява команди от файл в текущата обвивка',
  usage: 'source ФАЙЛ [АРГУМЕНТИ]...',
  description: 'Командите променят текущата обвивка (cd, export, alias), за разлика от "sh ФАЙЛ".',
  examples: [['source ~/.nvorc', 'презарежда настройките']],
  async run(ctx) {
    if (!ctx.args.length) return ctx.fail('изисква се име на файл', 2);
    const file = ctx.args[0];
    let text;
    try {
      text = asText(await ctx.fs.readFile(ctx.resolve(file)));
    } catch (e) {
      return ctx.fail(file + ': ' + e.message);
    }
    const sh = ctx.sh;
    if (ctx.args.length > 1) sh.frames.push({ argv0: sh.frame.argv0, args: ctx.args.slice(1) });
    try {
      return await sh.runSource(text, ctx.io);
    } finally {
      if (ctx.args.length > 1) sh.frames.pop();
    }
  },
});

define({
  name: 'sh',
  aliases: ['bash', 'nvo-sh'],
  group: 'shell',
  summary: 'изпълнява скрипт или команда в нова обвивка',
  usage: 'sh [-c КОМАНДА | ФАЙЛ] [АРГУМЕНТИ]...',
  description: 'Скриптът е текстов файл с команди (по една на ред). Поддържат се pipes, пренасочвания, &&, ||, $1..$9, $#, $@.\nНяма if, while и функции - за повтаряне ползвайте xargs.',
  options: [['-c КОМАНДА', 'изпълнява КОМАНДА']],
  examples: [["sh -c 'ls | wc -l'", ''], ['sh ~/report.sh 7', 'скрипт с аргумент $1=7'], ['echo ls | sh', 'команди от stdin']],
  async run(ctx) {
    const sh = ctx.sh;
    const args = ctx.args;
    if (args[0] === '-c') {
      if (args.length < 2) return ctx.fail('-c: опцията изисква аргумент', 2);
      return sh.runScript(args[1], args[2] || ctx.name, args.slice(3), ctx.io);
    }
    if (args.length) {
      let text;
      try {
        text = asText(await ctx.fs.readFile(ctx.resolve(args[0])));
      } catch (e) {
        return ctx.fail(args[0] + ': ' + e.message, 127);
      }
      return sh.runScript(text, args[0], args.slice(1), ctx.io);
    }
    if (ctx.stdin === null) {
      ctx.print('Вече сте в nvo-sh.');
      return 0;
    }
    return sh.runScript(ctx.stdin, ctx.name, [], { ...ctx.io, stdin: '' });
  },
});

define({
  name: 'exit',
  aliases: ['logout'],
  group: 'shell',
  builtin: true,
  summary: 'излиза от обвивката',
  usage: 'exit [КОД]',
  description: 'В скрипт прекратява скрипта. В конзолата затваря сесията; Enter отваря нова.',
  run(ctx) {
    const code = ctx.args.length ? Number(ctx.args[0]) : ctx.sh.status;
    if (Number.isNaN(code)) return ctx.fail(ctx.args[0] + ': изисква се числов аргумент', 2);
    throw new ExitSignal(code & 255);
  },
});

define({
  name: 'history',
  group: 'shell',
  builtin: true,
  summary: 'показва историята на командите',
  usage: 'history [-c] [N]',
  description: 'Историята се пази в браузъра (до 1000 реда). !! повтаря последната команда, !N - команда номер N, !текст - последната, която започва с текст, !$ - последния аргумент.',
  options: [['-c', 'изчиства историята'], ['N', 'само последните N реда']],
  run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'c' });
    const term = ctx.term;
    if (opts.c) {
      term.clearHistory();
      return 0;
    }
    const h = term.history;
    const n = rest.length ? Number(rest[0]) : h.length;
    if (Number.isNaN(n)) return ctx.fail(rest[0] + ': изисква се числов аргумент');
    const from = Math.max(0, h.length - n);
    let out = '';
    for (let i = from; i < h.length; i++) out += String(i + 1).padStart(5) + '  ' + h[i] + '\n';
    ctx.out(out);
    return 0;
  },
});

define({
  name: 'type',
  group: 'shell',
  builtin: true,
  summary: 'показва какво е дадено име (псевдоним, вградена команда, файл)',
  usage: 'type ИМЕ...',
  complete: 'commands',
  run(ctx) {
    let st = 0;
    for (const name of ctx.args) {
      const spec = lookup(name);
      if (ctx.sh.aliases.has(name)) ctx.print(name + " е псевдоним на '" + ctx.sh.aliases.get(name) + "'");
      else if (spec && spec.builtin) ctx.print(name + ' е вградена команда на обвивката');
      else if (spec) ctx.print(name + ' е ' + (spec.group === 'nvo' ? '/usr/local/bin/' : '/bin/') + name);
      else {
        ctx.err(name + ': не е намерен');
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'shift',
  group: 'shell',
  builtin: true,
  summary: 'измества позиционните аргументи ($1 изчезва, $2 става $1)',
  usage: 'shift [N]',
  run(ctx) {
    const n = ctx.args.length ? Number(ctx.args[0]) : 1;
    const frame = ctx.sh.frame;
    if (Number.isNaN(n) || n > frame.args.length) return 1;
    frame.args = frame.args.slice(n);
    return 0;
  },
});

define({
  name: 'eval',
  group: 'shell',
  builtin: true,
  summary: 'изпълнява аргументите като команда',
  usage: 'eval [АРГУМЕНТ]...',
  rawArgs: true,
  run(ctx) {
    return ctx.sh.runSource(ctx.args.join(' '), ctx.io);
  },
});

define({
  name: 'time',
  group: 'shell',
  builtin: true,
  summary: 'измерва времето за изпълнение на команда',
  usage: 'time КОМАНДА [АРГУМЕНТИ]...',
  rawArgs: true,
  complete: 'commands',
  async run(ctx) {
    const t0 = performance.now();
    const st = ctx.args.length ? await ctx.sh.runArgv(ctx.args, ctx.io) : 0;
    const secs = (performance.now() - t0) / 1000;
    const fmtT = (s) => Math.floor(s / 60) + 'm' + (s % 60).toFixed(3).replace('.', ',') + 's';
    ctx.io.stderr.write('\nreal\t' + fmtT(secs) + '\nuser\t' + fmtT(0) + '\nsys\t' + fmtT(0) + '\n');
    return st;
  },
});

function splitXargs(text) {
  const items = [];
  let cur = '';
  let has = false;
  let q = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      has = true;
    } else if (ch === '\\' && i + 1 < text.length) {
      cur += text[++i];
      has = true;
    } else if (/\s/.test(ch)) {
      if (has) items.push(cur);
      cur = '';
      has = false;
    } else {
      cur += ch;
      has = true;
    }
  }
  if (has) items.push(cur);
  return items;
}

define({
  name: 'xargs',
  group: 'shell',
  summary: 'изпълнява команда с аргументи от stdin',
  usage: 'xargs [ОПЦИЯ]... [КОМАНДА [АРГУМЕНТИ]...]',
  description: 'Чете думи от stdin и ги добавя като аргументи на КОМАНДА (по подразбиране echo). Заменя циклите в скриптовете.',
  options: [['-n N', 'най-много N аргумента на едно изпълнение'], ['-I НИЗ', 'по един ред наведнъж; НИЗ в командата се заменя с реда'], ['-d РАЗДЕЛИТЕЛ', 'разделител вместо интервалите (напр. -d \'\\n\')'], ['-t', 'печата всяка команда преди изпълнението'], ['-r', 'не изпълнява нищо при празен вход']],
  examples: [['find ~ -name "*.txt" | xargs wc -l', ''], ["printf '1\\n2\\n' | xargs -I{} echo ред {}", '']],
  complete: 'commands',
  async run(ctx) {
    const { opts, rest } = getopt(ctx.args, { short: 'n:I:d:tr0', stopAtFirst: true });
    const cmd = rest.length ? rest : ['echo'];
    const input = await ctx.readAll();
    let items;
    if (opts.I !== undefined) {
      items = input.split('\n').filter((l) => l.trim() !== '');
    } else if (opts.d !== undefined || opts['0']) {
      const d = opts['0'] ? '\0' : opts.d.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      items = input.split(d);
      if (items.length && items[items.length - 1].replace(/\n$/, '') === '') items.pop();
      items = items.map((s) => s.replace(/\n$/, ''));
    } else {
      items = splitXargs(input);
    }
    if (!items.length && (opts.r || opts.I !== undefined)) return 0;
    const batches = [];
    if (opts.I !== undefined) {
      for (const it of items) batches.push(cmd.map((a) => a.split(opts.I).join(it)));
    } else {
      const n = opts.n ? Math.max(1, Number(opts.n)) : items.length || 1;
      for (let i = 0; i < Math.max(1, items.length); i += n) batches.push([...cmd, ...items.slice(i, i + n)]);
    }
    let st = 0;
    for (const argv of batches) {
      ctx.check();
      if (opts.t) ctx.io.stderr.write(argv.join(' ') + '\n');
      const r = await ctx.sh.runArgv(argv, { stdin: '', stdout: ctx.stdout, stderr: ctx.stderr });
      if (r === 127) return 127;
      if (r !== 0) st = 123;
    }
    return st;
  },
});
