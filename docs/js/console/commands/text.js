// Команди за текст: echo, printf, grep, sort, uniq, cut, tr, sed, column, nl, tac, rev, paste, tee,
// seq, wc, base64, yes, sha256sum, bc.

import { define } from '../registry.js';
import { palette, width, padEnd, columns } from '../ansi.js';
import { FsError, normalize, isBinary } from '../vfs.js';
import { splitLines, joinLines, unescapeC, toInt, asText } from './util.js';
import { evaluate, formatNumber } from '../calc.js';

define({
  name: 'echo',
  group: 'text',
  summary: 'извежда текст',
  usage: 'echo [-n] [-e] [ТЕКСТ]...',
  rawArgs: true,
  options: [['-n', 'без нов ред накрая'], ['-e', 'тълкува \\n, \\t, \\e[...m (цветове) и др.']],
  examples: [['echo "Здравей, $USER"', ''], ['echo -e "\\e[32mзелено\\e[0m"', '']],
  run(ctx) {
    const args = ctx.args.slice();
    let newline = true;
    let esc = false;
    while (args.length && /^-[neE]+$/.test(args[0])) {
      const f = args.shift();
      if (f.includes('n')) newline = false;
      if (f.includes('e')) esc = true;
      if (f.includes('E')) esc = false;
    }
    let text = args.join(' ');
    if (esc) {
      const cut = text.indexOf('\\c');
      if (cut >= 0) {
        text = text.slice(0, cut);
        newline = false;
      }
      text = unescapeC(text);
    }
    ctx.out(text + (newline ? '\n' : ''));
  },
});

/** printf форматиране (поддържа %s %d %i %f %e %g %x %X %o %c %b %% с флагове, ширина и точност). */
export function sprintf(format, args) {
  let i = 0;
  let consumed = false;
  const next = () => {
    consumed = true;
    return i < args.length ? args[i++] : undefined;
  };
  const fmtOnce = () => unescapeC(format).replace(/%([-+ 0#]*)(\*|\d+)?(?:\.(\*|\d+))?([sdifeEgGxXocb%])/g, (m, flags, w, p, conv) => {
    if (conv === '%') return '%';
    if (w === '*') w = next();
    if (p === '*') p = next();
    const arg = next();
    let s;
    const num = () => {
      if (arg === undefined || arg === '') return 0;
      const n = Number(String(arg).replace(',', '.'));
      if (Number.isNaN(n)) throw new Error("'" + arg + "': невалидно число");
      return n;
    };
    switch (conv) {
      case 's': s = arg === undefined ? '' : String(arg); if (p !== undefined) s = Array.from(s).slice(0, Number(p)).join(''); break;
      case 'b': s = unescapeC(arg === undefined ? '' : String(arg)); break;
      case 'c': s = arg === undefined ? '' : Array.from(String(arg))[0] || ''; break;
      case 'd': case 'i': s = String(Math.trunc(num())); break;
      case 'f': s = num().toFixed(p === undefined ? 6 : Number(p)); break;
      case 'e': case 'E': s = num().toExponential(p === undefined ? 6 : Number(p)).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); break;
      case 'g': case 'G': s = String(Number(num().toPrecision(p === undefined ? 6 : Math.max(1, Number(p))))); break;
      case 'x': s = Math.trunc(num()).toString(16); break;
      case 'X': s = Math.trunc(num()).toString(16).toUpperCase(); break;
      case 'o': s = Math.trunc(num()).toString(8); break;
      default: s = m;
    }
    if (flags.includes('+') && /[difeEgG]/.test(conv) && !s.startsWith('-')) s = '+' + s;
    else if (flags.includes(' ') && /[difeEgG]/.test(conv) && !s.startsWith('-')) s = ' ' + s;
    const wid = w === undefined ? 0 : Number(w);
    const len = Array.from(s).length;
    if (len < wid) {
      if (flags.includes('-')) s += ' '.repeat(wid - len);
      else if (flags.includes('0') && /[difeEgGxXo]/.test(conv)) {
        const sign = /^[+\- ]/.test(s) ? s[0] : '';
        s = sign + '0'.repeat(wid - len) + s.slice(sign.length);
      } else s = ' '.repeat(wid - len) + s;
    }
    return s;
  });
  let out = fmtOnce();
  // Като в bash: форматът се повтаря, докато не се изчерпат аргументите.
  while (consumed && i < args.length) {
    consumed = false;
    out += fmtOnce();
  }
  return out;
}

define({
  name: 'printf',
  group: 'text',
  summary: 'форматиран изход',
  usage: 'printf ФОРМАТ [АРГУМЕНТ]...',
  rawArgs: true,
  description: 'Форматът е като в C: %s, %d, %f, %.2f, %-10s, %5d, %x, %%. \\n и \\t се тълкуват. Ако аргументите са повече, форматът се повтаря.',
  examples: [['printf "%-10s %5.1f\\n" БЕЛ 81.234', ''], ['printf "%s\\n" a b c', 'по един на ред']],
  run(ctx) {
    if (!ctx.args.length) return ctx.fail('употреба: printf ФОРМАТ [АРГУМЕНТИ]...', 2);
    ctx.out(sprintf(ctx.args[0], ctx.args.slice(1)));
  },
});

// ─── grep ───────────────────────────────────────────────────────────────────────

const POSIX_CLASSES = {
  '[:digit:]': '0-9',
  '[:alpha:]': 'a-zA-Zа-яА-ЯёЁѝЍ',
  '[:alnum:]': '0-9a-zA-Zа-яА-ЯёЁѝЍ',
  '[:upper:]': 'A-ZА-ЯЁЍ',
  '[:lower:]': 'a-zа-яёѝ',
  '[:space:]': '\\s',
  '[:blank:]': ' \\t',
  '[:punct:]': '!-\\/:-@\\[-`{-~',
  '[:xdigit:]': '0-9a-fA-F',
};

function posixClasses(p) {
  return p.replace(/\[:(digit|alpha|alnum|upper|lower|space|blank|punct|xdigit):\]/g, (m) => POSIX_CLASSES[m]);
}

/** Основен регулярен израз (BRE) → разширен: \( \) \| \{ \} \+ \? са специални, голите - буквални. */
export function breToEre(p) {
  let out = '';
  let inBracket = false;
  for (let i = 0; i < p.length; i++) {
    const ch = p[i];
    if (inBracket) {
      out += ch;
      if (ch === ']' && p[i - 1] !== '[' && p[i - 1] !== '^') inBracket = false;
      continue;
    }
    if (ch === '[') {
      inBracket = true;
      out += ch;
      continue;
    }
    if (ch === '\\' && i + 1 < p.length) {
      const n = p[++i];
      out += '(){}|+?'.includes(n) ? n : '\\' + n;
    } else if ('(){}|+?'.includes(ch)) {
      out += '\\' + ch;
    } else {
      out += ch;
    }
  }
  return out;
}

export function buildRegex(patterns, { fixed, extended, ignoreCase, word, line, global = false }) {
  const parts = patterns.map((p) => {
    if (fixed) return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return posixClasses(extended ? p : breToEre(p));
  });
  let body = parts.length === 1 ? parts[0] : parts.map((p) => '(?:' + p + ')').join('|');
  let flags = (ignoreCase ? 'i' : '') + (global ? 'g' : '');
  if (line) body = '^(?:' + body + ')$';
  if (word) {
    try {
      return new RegExp('(?<![\\p{L}\\p{N}_])(?:' + body + ')(?![\\p{L}\\p{N}_])', flags + 'u');
    } catch {
      body = '\\b(?:' + body + ')\\b';
    }
  }
  try {
    return new RegExp(body, flags);
  } catch (e) {
    throw new Error('невалиден регулярен израз: ' + e.message.replace(/^Invalid regular expression: /, ''));
  }
}

async function collectFiles(ctx, paths, recursive) {
  const out = [];
  const visit = async (shown, abs, top) => {
    const node = await ctx.fs.lookup(abs);
    if (node.type === 'dir') {
      if (!recursive) {
        ctx.err(shown + ': Е директория');
        return;
      }
      if (node.heavy && !top) return;
      for (const name of await ctx.fs.readdir(abs)) {
        if (out.length > 2000) throw new Error('твърде много файлове - стеснете търсенето');
        await ctx.tick();
        await visit(shown.replace(/\/$/, '') + '/' + name, normalize(name, abs), false);
      }
      return;
    }
    out.push({ shown, abs, node });
  };
  for (const p of paths) {
    try {
      await visit(p, ctx.resolve(p), true);
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      ctx.err(p + ': ' + e.message);
      ctx.failed = true;
    }
  }
  return out;
}

define({
  name: 'grep',
  aliases: ['egrep', 'fgrep'],
  group: 'text',
  summary: 'търси редове, които съвпадат с шаблон',
  usage: 'grep [ОПЦИЯ]... ШАБЛОН [ФАЙЛ]...',
  description: 'ШАБЛОН е регулярен израз. Без файл чете stdin. Съвпаденията се оцветяват в терминала.',
  options: [
    ['-i', 'без значение на главни/малки букви'],
    ['-v', 'редовете, които НЕ съвпадат'],
    ['-c', 'само броя на редовете'],
    ['-n', 'номерата на редовете'],
    ['-w', 'цели думи'],
    ['-x', 'целият ред'],
    ['-o', 'само съвпадащите части'],
    ['-E', 'разширен регулярен израз (| + ? () без \\)'],
    ['-F', 'шаблонът е обикновен текст'],
    ['-r', 'рекурсивно в директории'],
    ['-l / -L', 'само имената на файловете със / без съвпадения'],
    ['-h / -H', 'без / със имената на файловете'],
    ['-m N', 'спира след N съвпадения'],
    ['-A N, -B N, -C N', 'N реда контекст след / преди / около'],
    ['-q', 'нищо не извежда, само код на изход'],
    ['-e ШАБЛОН', 'още шаблон (може няколко пъти)'],
  ],
  examples: [['grep -i "пмг" файл.txt', ''], ['nvo rank 7 sofia | grep -E "СМГ|НПМГ"', ''], ['grep -rn alias ~', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'ivcnwxoEFrRlLhHqsPe:m:A:B:C:', multi: 'e', long: ['color=?', 'colour=?', 'ignore-case', 'invert-match', 'count'] });
    const patterns = opts.e ? opts.e.slice() : [];
    if (!patterns.length) {
      if (!rest.length) return ctx.fail('употреба: grep [ОПЦИЯ]... ШАБЛОН [ФАЙЛ]...', 2);
      patterns.push(rest.shift());
    }
    const color = opts.color === 'always' || (opts.color !== 'never' && ctx.c.on);
    const c = palette(color);
    const extended = opts.E || opts.P || ctx.name === 'egrep';
    const fixed = opts.F || ctx.name === 'fgrep';
    const ignoreCase = opts.i || opts['ignore-case'];
    const invert = !!(opts.v || opts['invert-match']);
    const test = buildRegex(patterns, { fixed, extended, ignoreCase, word: opts.w, line: opts.x });
    const hl = buildRegex(patterns, { fixed, extended, ignoreCase, word: opts.w, line: opts.x, global: true });
    const recursive = opts.r || opts.R;
    const max = opts.m !== undefined ? toInt(opts.m, 'съвпадения') : Infinity;
    const after = toInt(opts.A ?? opts.C ?? 0, 'редове');
    const before = toInt(opts.B ?? opts.C ?? 0, 'редове');

    let inputs;
    if (!rest.length && recursive) rest.push('.');
    if (rest.length) {
      const files = await collectFiles(ctx, rest, recursive);
      inputs = [];
      for (const f of files) {
        try {
          const content = await ctx.fs.readFile(f.abs);
          if (isBinary(content)) {
            inputs.push({ name: f.shown, text: asText(content), binary: true });
          } else {
            inputs.push({ name: f.shown, text: String(content) });
          }
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          ctx.err(f.shown + ': ' + e.message);
          ctx.failed = true;
        }
      }
    } else {
      inputs = [{ name: '(стандартен вход)', text: await ctx.readAll() }];
    }
    const showNames = opts.H || (!opts.h && (inputs.length > 1 || recursive));
    let matchedAny = false;
    let out = '';
    for (const input of inputs) {
      const lines = splitLines(input.text);
      let count = 0;
      let lastPrinted = -1;
      let pendingAfter = 0;
      const prefix = (n, sep) => (showNames ? c.magenta(input.name) + c.cyan(sep) : '') + (opts.n ? c.green(String(n + 1)) + c.cyan(sep) : '');
      const emitLine = (n, sep, text) => {
        if ((before || after) && lastPrinted >= 0 && n > lastPrinted + 1) out += c.cyan('--') + '\n';
        out += prefix(n, sep) + text + '\n';
        lastPrinted = n;
      };
      for (let n = 0; n < lines.length; n++) {
        const line = lines[n];
        const hit = test.test(line) !== invert;
        if (hit) {
          count++;
          matchedAny = true;
          if (opts.q) return 0;
          if (opts.l || opts.L || opts.c || opts.count) {
            if (count >= max) break;
            continue;
          }
          if (input.binary) {
            out += 'Двоичният файл ' + input.name + ' съвпада\n';
            break;
          }
          for (let b = Math.max(lastPrinted + 1, n - before); b < n; b++) emitLine(b, '-', lines[b]);
          if (opts.o && !invert) {
            hl.lastIndex = 0;
            let m;
            while ((m = hl.exec(line))) {
              if (m[0] === '') {
                hl.lastIndex++;
                continue;
              }
              out += prefix(n, ':') + c.match(m[0]) + '\n';
            }
            lastPrinted = n;
          } else {
            emitLine(n, ':', color && !invert ? line.replace(hl, (s) => c.match(s)) : line);
          }
          pendingAfter = after;
          if (count >= max) break;
        } else if (pendingAfter > 0) {
          emitLine(n, '-', line);
          pendingAfter--;
        }
        if (n % 2000 === 0) await ctx.tick();
      }
      if (opts.c || opts.count) out += (showNames ? c.magenta(input.name) + c.cyan(':') : '') + count + '\n';
      else if (opts.l && count) out += c.magenta(input.name) + '\n';
      else if (opts.L && !count) out += c.magenta(input.name) + '\n';
    }
    ctx.out(out);
    if (ctx.failed && !opts.s) return 2;
    return matchedAny ? 0 : 1;
  },
});

// ─── sort, uniq, cut, tr ─────────────────────────────────────────────────────────

function parseNumber(s) {
  const m = /^\s*([-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+))/.exec(s);
  return m ? Number(m[1].replace(',', '.')) : 0;
}

function parseHuman(s) {
  const m = /^\s*([-+]?\d+(?:[.,]\d+)?)\s*([KMGTP]?)/i.exec(s);
  if (!m) return 0;
  const mult = { '': 1, K: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15 }[m[2].toUpperCase()];
  return Number(m[1].replace(',', '.')) * mult;
}

define({
  name: 'sort',
  group: 'text',
  summary: 'подрежда редове',
  usage: 'sort [ОПЦИЯ]... [ФАЙЛ]...',
  description: 'Подрежда по българската азбука. Полетата се отделят с интервали или със знака от -t.',
  options: [['-n', 'числово (приема и десетична запетая)'], ['-r', 'обратен ред'], ['-k N[,M]', 'по поле N (до M)'], ['-t ЗНАК', 'разделител на полетата'], ['-u', 'без повторения'], ['-f', 'без значение на главни/малки'], ['-h', 'числа с K, M, G'], ['-V', 'естествен ред на числата в текста'], ['-R', 'случаен ред']],
  examples: [['sort -t, -k3 -nr данни.csv', 'по третата колона, низходящо'], ['nvo search гимназия | sort -k2', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'nrufk:t:bhVRso:', multi: 'k' });
    const inputs = await ctx.readInputs(rest);
    let lines = [];
    for (const i of inputs) lines.push(...splitLines(i.text));
    const sep = opts.t !== undefined ? (opts.t === '\\t' ? '\t' : opts.t) : null;
    const keys = (opts.k || []).map((k) => {
      const m = /^(\d+)(?:\.\d+)?([a-zA-Z]*)(?:,(\d+)(?:\.\d+)?([a-zA-Z]*))?$/.exec(k);
      if (!m) throw new Error("невалидно поле: '" + k + "'");
      const fl = m[2] + (m[4] || '');
      return { from: Number(m[1]), to: m[3] ? Number(m[3]) : null, n: fl.includes('n'), r: fl.includes('r'), h: fl.includes('h'), f: fl.includes('f') };
    });
    const fieldsOf = (line) => (sep !== null ? line.split(sep) : line.trim().split(/\s+/));
    const keyText = (line, k) => {
      const f = fieldsOf(line);
      return f.slice(k.from - 1, k.to === null ? f.length : k.to).join(sep !== null ? sep : ' ');
    };
    const coll = new Intl.Collator('bg', { sensitivity: opts.f ? 'base' : 'variant', numeric: !!opts.V });
    const cmp = (a, b, k) => {
      const numeric = (k && k.n) || opts.n;
      const hum = (k && k.h) || opts.h;
      if (numeric) return parseNumber(a) - parseNumber(b);
      if (hum) return parseHuman(a) - parseHuman(b);
      if ((k && k.f) || opts.f) return coll.compare(a.toLowerCase(), b.toLowerCase());
      return coll.compare(a, b);
    };
    if (opts.R) {
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
    } else {
      const decorated = lines.map((line, idx) => ({ line, idx, keys: keys.map((k) => keyText(line, k)) }));
      decorated.sort((x, y) => {
        for (let i = 0; i < keys.length; i++) {
          const d = cmp(x.keys[i], y.keys[i], keys[i]);
          if (d) return keys[i].r ? -d : d;
        }
        if (!keys.length) {
          const d = cmp(x.line, y.line, null);
          if (d) return d;
        }
        if (opts.s || opts.u) return x.idx - y.idx;
        return coll.compare(x.line, y.line) || (x.line < y.line ? -1 : x.line > y.line ? 1 : 0);
      });
      lines = decorated.map((d) => d.line);
      if (opts.r) lines.reverse();
      if (opts.u) {
        const seen = new Set();
        lines = lines.filter((l) => {
          const k = keys.length ? keys.map((kk) => keyText(l, kk)).join('\u0000') : opts.f ? l.toLowerCase() : l;
          const norm = opts.n ? String(parseNumber(k)) : k;
          if (seen.has(norm)) return false;
          seen.add(norm);
          return true;
        });
      }
    }
    const text = joinLines(lines);
    if (opts.o) await ctx.fs.writeFile(ctx.resolve(opts.o), text);
    else ctx.out(text);
    return ctx.failed ? 2 : 0;
  },
});

define({
  name: 'uniq',
  group: 'text',
  summary: 'премахва поредните повтарящи се редове',
  usage: 'uniq [-c] [-d] [-u] [-i] [ФАЙЛ]',
  description: 'Сравнява само съседните редове - обикновено се ползва след sort.',
  options: [['-c', 'брой на повторенията пред всеки ред'], ['-d', 'само повтарящите се'], ['-u', 'само неповтарящите се'], ['-i', 'без значение на главни/малки']],
  examples: [['cut -f3 данни.tsv | sort | uniq -c | sort -nr', 'честота на стойностите']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'cdui' });
    const [input] = await ctx.readInputs(rest.slice(0, 1));
    if (!input) return 1;
    const lines = splitLines(input.text);
    const out = [];
    let i = 0;
    while (i < lines.length) {
      let j = i + 1;
      const key = opts.i ? lines[i].toLowerCase() : lines[i];
      while (j < lines.length && (opts.i ? lines[j].toLowerCase() : lines[j]) === key) j++;
      const n = j - i;
      if ((!opts.d || n > 1) && (!opts.u || n === 1)) out.push(opts.c ? String(n).padStart(7) + ' ' + lines[i] : lines[i]);
      i = j;
    }
    ctx.out(joinLines(out));
    return 0;
  },
});

function parseList(spec) {
  const ranges = [];
  for (const part of String(spec).split(',')) {
    const m = /^(\d*)(-?)(\d*)$/.exec(part);
    if (!m || (!m[1] && !m[3])) throw new Error("невалиден списък: '" + spec + "'");
    const a = m[1] ? Number(m[1]) : 1;
    const b = m[2] ? (m[3] ? Number(m[3]) : Infinity) : a;
    ranges.push([a, b]);
  }
  return (n) => ranges.some(([a, b]) => n >= a && n <= b);
}

define({
  name: 'cut',
  group: 'text',
  summary: 'изрязва колони от редовете',
  usage: 'cut -f СПИСЪК [-d ЗНАК] [ФАЙЛ]... | cut -c СПИСЪК [ФАЙЛ]...',
  options: [['-f СПИСЪК', 'полета: 1,3 или 2-4 или 3-'], ['-d ЗНАК', 'разделител на полетата (по подразбиране табулация)'], ['-c СПИСЪК', 'знаци на позиции'], ['-s', 'пропуска редовете без разделител'], ['--output-delimiter=Н', 'разделител в изхода']],
  examples: [['cut -d, -f1,3 данни.csv', ''], ['cut -d: -f1 /etc/passwd', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'f:d:c:s', long: ['output-delimiter='] });
    if (!opts.f && !opts.c) return ctx.fail('трябва да се зададе списък от полета или знаци', 2);
    const sel = parseList(opts.f || opts.c);
    const d = opts.d === undefined ? '\t' : opts.d === '\\t' ? '\t' : opts.d;
    if (Array.from(d).length !== 1) return ctx.fail('разделителят трябва да е един знак', 2);
    const outD = opts['output-delimiter'] !== undefined ? opts['output-delimiter'] : d;
    const inputs = await ctx.readInputs(rest);
    const out = [];
    for (const input of inputs) {
      for (const line of splitLines(input.text)) {
        if (opts.c) {
          out.push(Array.from(line).filter((_, i) => sel(i + 1)).join(''));
        } else if (!line.includes(d)) {
          if (!opts.s) out.push(line);
        } else {
          out.push(line.split(d).filter((_, i) => sel(i + 1)).join(outD));
        }
      }
    }
    ctx.out(joinLines(out));
    return ctx.failed ? 1 : 0;
  },
});

const LOWER = 'abcdefghijklmnopqrstuvwxyzабвгдежзийклмнопрстуфхцчшщъьюяѝё';
const UPPER = Array.from(LOWER).map((ch) => ch.toUpperCase()).join('');

function expandSet(set) {
  const s = unescapeC(set);
  const out = [];
  const chars = Array.from(s);
  for (let i = 0; i < chars.length; i++) {
    const rest = chars.slice(i).join('');
    const cls = /^\[:(lower|upper|digit|space|alpha|alnum|punct|blank):\]/.exec(rest);
    if (cls) {
      const map = {
        lower: LOWER,
        upper: UPPER,
        digit: '0123456789',
        space: ' \t\n\r\v\f',
        blank: ' \t',
        alpha: LOWER + UPPER,
        alnum: '0123456789' + LOWER + UPPER,
        punct: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
      };
      out.push(...Array.from(map[cls[1]]));
      i += cls[0].length - 1;
      continue;
    }
    if (chars[i + 1] === '-' && i + 2 < chars.length) {
      const a = chars[i].codePointAt(0);
      const b = chars[i + 2].codePointAt(0);
      for (let x = a; x <= b; x++) out.push(String.fromCodePoint(x));
      i += 2;
      continue;
    }
    out.push(chars[i]);
  }
  return out;
}

define({
  name: 'tr',
  group: 'text',
  summary: 'заменя или изтрива знаци',
  usage: 'tr [-d] [-s] [-c] НАБОР1 [НАБОР2]',
  description: 'Наборите приемат интервали (a-z, а-я) и класове ([:lower:], [:upper:], [:digit:], [:space:], [:alpha:]).',
  options: [['-d', 'изтрива знаците от НАБОР1'], ['-s', 'слива повторенията на знаците от последния набор'], ['-c', 'допълнението на НАБОР1']],
  examples: [["tr '[:lower:]' '[:upper:]'", 'главни букви (и на кирилица)'], ["tr -s ' '", 'по един интервал'], ["tr ',' '\\t'", 'CSV към TSV']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'dscC' });
    if (!rest.length) return ctx.fail('липсва операнд', 1);
    const text = await ctx.readAll();
    const set1 = expandSet(rest[0]);
    const set2 = rest[1] !== undefined ? expandSet(rest[1]) : [];
    const in1 = new Set(set1);
    const complement = opts.c || opts.C;
    const member = (ch) => (complement ? !in1.has(ch) : in1.has(ch));
    let out = '';
    const map = new Map();
    if (!opts.d && set2.length) {
      set1.forEach((ch, i) => map.set(ch, set2[Math.min(i, set2.length - 1)]));
    }
    const squeezeSet = new Set(opts.d ? set2 : set2.length ? set2 : set1);
    let last = null;
    for (const ch of Array.from(text)) {
      let o = ch;
      if (opts.d && member(ch)) continue;
      if (!opts.d && set2.length && member(ch)) o = complement ? set2[set2.length - 1] : map.get(ch);
      if (opts.s && o === last && squeezeSet.has(o)) continue;
      out += o;
      last = o;
    }
    ctx.out(out);
    return 0;
  },
});

// ─── sed ────────────────────────────────────────────────────────────────────────

function parseSed(script, extended) {
  const cmds = [];
  let i = 0;
  const s = script;
  const readDelimited = (delim) => {
    let out = '';
    while (i < s.length && s[i] !== delim) {
      if (s[i] === '\\' && i + 1 < s.length) {
        out += s[i + 1] === delim ? delim : s[i] + s[i + 1];
        i += 2;
        continue;
      }
      out += s[i++];
    }
    if (s[i] !== delim) throw new Error('незавършена команда');
    i++;
    return out;
  };
  const toRe = (p, flags = '') => {
    try {
      return new RegExp(posixClasses(extended ? p : breToEre(p)), flags);
    } catch (e) {
      throw new Error('невалиден регулярен израз: ' + p);
    }
  };
  const readAddr = () => {
    if (/\d/.test(s[i])) {
      let n = '';
      while (/\d/.test(s[i])) n += s[i++];
      return { line: Number(n) };
    }
    if (s[i] === '$') {
      i++;
      return { last: true };
    }
    if (s[i] === '/') {
      i++;
      return { re: toRe(readDelimited('/')) };
    }
    return null;
  };
  while (i < s.length) {
    while (i < s.length && /[\s;]/.test(s[i])) i++;
    if (i >= s.length) break;
    const a1 = readAddr();
    let a2 = null;
    if (a1 && s[i] === ',') {
      i++;
      a2 = readAddr();
    }
    while (s[i] === ' ') i++;
    let negate = false;
    if (s[i] === '!') {
      negate = true;
      i++;
    }
    const op = s[i++];
    const cmd = { a1, a2, negate, op, inRange: false };
    if (op === 's') {
      const delim = s[i++];
      const pat = readDelimited(delim);
      const rep = readDelimited(delim);
      let flags = '';
      while (i < s.length && /[gipI0-9]/.test(s[i])) flags += s[i++];
      cmd.global = flags.includes('g');
      cmd.print = flags.includes('p');
      cmd.nth = Number((flags.match(/\d+/) || [0])[0]) || 0;
      cmd.re = toRe(pat, (flags.includes('i') || flags.includes('I') ? 'i' : '') + 'g');
      cmd.rep = rep;
    } else if (op === 'y') {
      const delim = s[i++];
      cmd.from = Array.from(readDelimited(delim));
      cmd.to = Array.from(readDelimited(delim));
    } else if (op === 'a' || op === 'i' || op === 'c') {
      while (s[i] === ' ' || s[i] === '\\') i++;
      let text = '';
      while (i < s.length && s[i] !== '\n' && s[i] !== ';') text += s[i++];
      cmd.text = unescapeC(text);
    } else if (!'dpqP=nN'.includes(op)) {
      throw new Error("непозната команда: '" + op + "'");
    }
    cmds.push(cmd);
  }
  return cmds;
}

function sedReplace(line, cmd) {
  let n = 0;
  cmd.re.lastIndex = 0;
  return line.replace(cmd.re, (...m) => {
    n++;
    const groups = m.slice(1, -2);
    if (cmd.nth && n !== cmd.nth) return m[0];
    if (!cmd.global && !cmd.nth && n > 1) return m[0];
    return cmd.rep.replace(/\\(\d)|\\n|\\t|\\&|&|\\\\/g, (x, d) => {
      if (d !== undefined) return groups[Number(d) - 1] || '';
      if (x === '&') return m[0];
      if (x === '\\&') return '&';
      if (x === '\\n') return '\n';
      if (x === '\\t') return '\t';
      return '\\';
    });
  });
}

function runSed(cmds, text, quiet) {
  const lines = splitLines(text);
  const out = [];
  const matches = (addr, line, n) => (addr.line !== undefined ? n === addr.line : addr.last ? n === lines.length : addr.re.test(line));
  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx];
    const n = idx + 1;
    let deleted = false;
    let quit = false;
    const appendAfter = [];
    for (const cmd of cmds) {
      let selected = true;
      if (cmd.a1) {
        if (cmd.a2) {
          if (!cmd.inRange) {
            if (matches(cmd.a1, line, n)) {
              selected = true;
              cmd.inRange = !(cmd.a2.line !== undefined && cmd.a2.line <= n);
            } else selected = false;
          } else {
            selected = true;
            if (matches(cmd.a2, line, n)) cmd.inRange = false;
          }
        } else selected = matches(cmd.a1, line, n);
      }
      if (cmd.negate) selected = !selected;
      if (!selected) continue;
      if (cmd.op === 's') {
        cmd.re.lastIndex = 0;
        const changed = cmd.re.test(line);
        if (changed) {
          line = sedReplace(line, cmd);
          if (cmd.print) out.push(line);
        }
      } else if (cmd.op === 'y') {
        line = Array.from(line).map((ch) => {
          const k = cmd.from.indexOf(ch);
          return k >= 0 ? cmd.to[k] : ch;
        }).join('');
      } else if (cmd.op === 'd') {
        deleted = true;
        break;
      } else if (cmd.op === 'p') {
        out.push(line);
      } else if (cmd.op === '=') {
        out.push(String(n));
      } else if (cmd.op === 'q') {
        quit = true;
        break;
      } else if (cmd.op === 'a') {
        appendAfter.push(cmd.text);
      } else if (cmd.op === 'i') {
        out.push(cmd.text);
      } else if (cmd.op === 'c') {
        out.push(cmd.text);
        deleted = true;
        break;
      }
    }
    if (!deleted && !quiet) out.push(line);
    out.push(...appendAfter);
    if (quit) break;
  }
  return joinLines(out);
}

define({
  name: 'sed',
  group: 'text',
  summary: 'потоков редактор (замяна на текст)',
  usage: "sed [-n] [-E] [-i] [-e СКРИПТ]... 'СКРИПТ' [ФАЙЛ]...",
  description: 'Команди: s/шаблон/замяна/флагове (g - всички, i - без значение на буквите, p - печат, N - N-тото съвпадение), d - изтрий, p - печат, q - край, = - номер на реда, a/i/c ТЕКСТ, y/abc/xyz/.\nАдреси: N, $, /шаблон/, N,M, /от/,/до/, ! - обратно. Командите се разделят с ;. В замяната & е съвпадението, \\1..\\9 - групите.',
  options: [['-n', 'не печата редовете автоматично (с p)'], ['-E, -r', 'разширени регулярни изрази'], ['-i', 'променя файловете на място'], ['-e СКРИПТ', 'добавя скрипт']],
  examples: [["sed 's/София/СОФИЯ/g' файл", ''], ["sed -n '2,5p' файл", 'редове 2-5'], ["sed '/^#/d' ~/.nvorc", 'без коментарите'], ["sed -i 's/стар/нов/' бележка.txt", 'промяна във файла']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'nEris:e:', multi: 'e', long: ['quiet', 'silent', 'in-place=?', 'regexp-extended'] });
    const scripts = opts.e ? opts.e.slice() : [];
    if (!scripts.length) {
      if (!rest.length) return ctx.fail('употреба: sed [ОПЦИЯ]... СКРИПТ [ФАЙЛ]...', 1);
      scripts.push(rest.shift());
    }
    const extended = opts.E || opts.r || opts['regexp-extended'];
    const quiet = opts.n || opts.quiet || opts.silent;
    const parse = () => parseSed(scripts.join('\n'), extended);
    try {
      parse();
    } catch (e) {
      return ctx.fail('-e израз #1: ' + e.message);
    }
    if (opts.i || opts['in-place']) {
      if (!rest.length) return ctx.fail('няма входни файлове');
      for (const f of rest) {
        const abs = ctx.resolve(f);
        try {
          const text = asText(await ctx.fs.readFile(abs));
          await ctx.fs.writeFile(abs, runSed(parse(), text, quiet));
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          ctx.err(f + ': ' + e.message);
          ctx.failed = true;
        }
      }
      return ctx.failed ? 4 : 0;
    }
    const inputs = await ctx.readInputs(rest);
    ctx.out(runSed(parse(), inputs.map((i) => i.text).join(''), quiet));
    return ctx.failed ? 2 : 0;
  },
});

// ─── Малки текстови команди ──────────────────────────────────────────────────────

define({
  name: 'column',
  group: 'text',
  summary: 'подравнява текст в колони',
  usage: 'column [-t] [-s РАЗДЕЛИТЕЛИ] [-o ИЗХОДЕН] [ФАЙЛ]...',
  options: [['-t', 'таблица: подравнява полетата на всеки ред'], ['-s ЗНАЦИ', 'разделители на полетата (по подразбиране интервали)'], ['-o НИЗ', 'разделител между колоните в изхода (по подразбиране два интервала)'], ['-R СПИСЪК', 'колони, подравнени вдясно (напр. 2,3)']],
  examples: [['column -t -s, данни.csv', 'CSV като таблица']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'ts:o:R:x' });
    const inputs = await ctx.readInputs(rest);
    const lines = [];
    for (const i of inputs) lines.push(...splitLines(i.text));
    if (!opts.t) {
      const items = lines.filter((l) => l.trim()).map((l) => ({ text: l, plain: l }));
      ctx.out(columns(items, Number.isFinite(ctx.cols) ? ctx.cols : 80));
      return 0;
    }
    const seps = opts.s !== undefined ? unescapeC(opts.s) : null;
    const re = seps ? new RegExp('[' + seps.replace(/[\]\\^-]/g, '\\$&') + ']') : /\s+/;
    const rows = lines.filter((l) => l.trim() !== '').map((l) => (seps ? l.split(re) : l.trim().split(re)));
    const right = opts.R ? parseList(opts.R) : () => false;
    const n = Math.max(0, ...rows.map((r) => r.length));
    const widths = [];
    for (let k = 0; k < n; k++) widths.push(Math.max(...rows.map((r) => (r[k] === undefined ? 0 : width(r[k])))));
    const outSep = opts.o !== undefined ? opts.o : '  ';
    ctx.out(rows.map((r) => r.map((cell, k) => {
      if (k === r.length - 1 && !right(k + 1)) return cell;
      return right(k + 1) ? ' '.repeat(widths[k] - width(cell)) + cell : padEnd(cell, widths[k]);
    }).join(outSep)).join('\n') + (rows.length ? '\n' : ''));
    return 0;
  },
});

define({
  name: 'nl',
  group: 'text',
  summary: 'номерира редовете',
  usage: 'nl [-b a] [ФАЙЛ]...',
  options: [['-b a', 'номерира и празните редове']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'b:w:s:' });
    const inputs = await ctx.readInputs(rest);
    let n = 0;
    const w = opts.w ? Number(opts.w) : 6;
    const sep = opts.s !== undefined ? opts.s : '\t';
    const out = [];
    for (const input of inputs) {
      for (const line of splitLines(input.text)) {
        if (line === '' && opts.b !== 'a') out.push('');
        else out.push(String(++n).padStart(w) + sep + line);
      }
    }
    ctx.out(joinLines(out));
    return 0;
  },
});

define({
  name: 'tac',
  group: 'text',
  summary: 'редовете в обратен ред',
  usage: 'tac [ФАЙЛ]...',
  async run(ctx) {
    const inputs = await ctx.readInputs(ctx.args);
    ctx.out(joinLines(inputs.flatMap((i) => splitLines(i.text)).reverse()));
    return 0;
  },
});

define({
  name: 'rev',
  group: 'text',
  summary: 'обръща знаците на всеки ред',
  usage: 'rev [ФАЙЛ]...',
  async run(ctx) {
    const inputs = await ctx.readInputs(ctx.args);
    ctx.out(joinLines(inputs.flatMap((i) => splitLines(i.text)).map((l) => Array.from(l).reverse().join(''))));
    return 0;
  },
});

define({
  name: 'paste',
  group: 'text',
  summary: 'слепва редовете на файлове един до друг',
  usage: 'paste [-d РАЗДЕЛИТЕЛИ] [-s] ФАЙЛ...',
  options: [['-d ЗНАЦИ', 'разделители (по подразбиране табулация)'], ['-s', 'всеки файл на един ред']],
  examples: [['seq 1 6 | paste - - -', 'по три на ред'], ['paste -sd, файл', 'всички редове, разделени със запетая']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'd:s' });
    const delims = Array.from(opts.d !== undefined ? unescapeC(opts.d) : '\t');
    const files = rest.length ? rest : ['-'];
    let stdinLines = null;
    const cols = [];
    let stdinPos = 0;
    for (const f of files) {
      if (f === '-') {
        if (!stdinLines) stdinLines = splitLines(await ctx.readAll());
        cols.push({ stdin: true });
      } else {
        const [input] = await ctx.readInputs([f]);
        cols.push({ lines: input ? splitLines(input.text) : [] });
      }
    }
    const d = (k) => (delims.length ? delims[k % delims.length] : '');
    const out = [];
    if (opts.s) {
      for (const col of cols) {
        const lines = col.stdin ? stdinLines : col.lines;
        out.push(lines.reduce((acc, l, k) => (k ? acc + d(k - 1) + l : l), ''));
      }
    } else if (cols.every((col) => col.stdin)) {
      while (stdinPos < stdinLines.length) {
        const row = [];
        for (let k = 0; k < cols.length; k++) row.push(stdinLines[stdinPos++] ?? '');
        out.push(row.reduce((acc, l, k) => (k ? acc + d(k - 1) + l : l), ''));
      }
    } else {
      const n = Math.max(...cols.map((col) => (col.stdin ? stdinLines.length : col.lines.length)));
      for (let r = 0; r < n; r++) {
        const row = cols.map((col) => (col.stdin ? stdinLines[r] : col.lines[r]) ?? '');
        out.push(row.reduce((acc, l, k) => (k ? acc + d(k - 1) + l : l), ''));
      }
    }
    ctx.out(joinLines(out));
    return 0;
  },
});

define({
  name: 'tee',
  group: 'text',
  summary: 'копира stdin и в stdout, и във файлове',
  usage: 'tee [-a] ФАЙЛ...',
  options: [['-a', 'добавя към файловете, вместо да ги презаписва']],
  examples: [['nvo rank 7 sofia | tee ~/sofia.txt | head', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'a' });
    const text = await ctx.readAll();
    let st = 0;
    for (const f of rest) {
      try {
        await ctx.fs.writeFile(ctx.resolve(f), text, { append: !!opts.a });
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err(f + ': ' + e.message);
        st = 1;
      }
    }
    ctx.out(text);
    return st;
  },
});

define({
  name: 'seq',
  group: 'text',
  summary: 'поредица от числа',
  usage: 'seq [-s РАЗДЕЛИТЕЛ] [-w] [ОТ [СТЪПКА]] ДО',
  options: [['-s НИЗ', 'разделител (по подразбиране нов ред)'], ['-w', 'еднаква ширина с водещи нули']],
  examples: [['seq 5', '1..5'], ['seq 2019 2026', 'годините'], ['seq 0 0.5 2', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 's:w' });
    const nums = rest.map((x) => {
      const n = Number(String(x).replace(',', '.'));
      if (Number.isNaN(n)) throw new Error("невалиден аргумент с плаваща запетая: '" + x + "'");
      return n;
    });
    if (!nums.length || nums.length > 3) return ctx.fail('липсва операнд', 1);
    const [first, step, last] = nums.length === 1 ? [1, 1, nums[0]] : nums.length === 2 ? [nums[0], 1, nums[1]] : nums;
    if (step === 0) return ctx.fail('стъпката не може да е нула', 1);
    const decimals = Math.max(...rest.map((x) => (String(x).split(/[.,]/)[1] || '').length));
    const values = [];
    for (let k = 0, v = first; step > 0 ? v <= last + 1e-9 : v >= last - 1e-9; k++, v = first + k * step) {
      if (values.length >= 1000000) return ctx.fail('твърде много числа');
      values.push(v.toFixed(decimals));
    }
    const w = opts.w ? Math.max(...values.map((v) => v.length)) : 0;
    const sep = opts.s !== undefined ? unescapeC(opts.s) : '\n';
    ctx.out(values.map((v) => (w ? v.padStart(w, '0') : v)).join(sep) + (values.length ? '\n' : ''));
    return 0;
  },
});

define({
  name: 'wc',
  group: 'text',
  summary: 'брои редове, думи и знаци',
  usage: 'wc [-l] [-w] [-c] [-m] [ФАЙЛ]...',
  options: [['-l', 'редове'], ['-w', 'думи'], ['-c', 'байтове'], ['-m', 'знаци']],
  examples: [['nvo search гимназия | wc -l', 'колко резултата']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'lwcmL' });
    const any = opts.l || opts.w || opts.c || opts.m || opts.L;
    const show = { l: !any || opts.l, w: !any || opts.w, m: opts.m, c: !any || opts.c, L: opts.L };
    const inputs = await ctx.readInputs(rest);
    const enc = new TextEncoder();
    const rows = inputs.map((i) => ({
      name: i.name === '-' ? '' : i.name,
      l: (i.text.match(/\n/g) || []).length,
      w: (i.text.match(/\S+/g) || []).length,
      c: enc.encode(i.text).length,
      m: Array.from(i.text).length,
      L: Math.max(0, ...splitLines(i.text).map((x) => Array.from(x).length)),
    }));
    if (rows.length > 1) {
      rows.push({ name: 'общо', l: 0, w: 0, c: 0, m: 0, L: 0 });
      const t = rows[rows.length - 1];
      for (const r of rows.slice(0, -1)) {
        for (const k of ['l', 'w', 'c', 'm']) t[k] += r[k];
        t.L = Math.max(t.L, r.L);
      }
    }
    const keys = ['l', 'w', 'm', 'c', 'L'].filter((k) => show[k]);
    const single = keys.length === 1 && rows.length === 1;
    const wdt = single ? 0 : Math.max(...rows.flatMap((r) => keys.map((k) => String(r[k]).length)));
    ctx.out(rows.map((r) => keys.map((k) => String(r[k]).padStart(wdt)).join(' ') + (r.name ? ' ' + r.name : '')).join('\n') + '\n');
    return ctx.failed ? 1 : 0;
  },
});

define({
  name: 'base64',
  group: 'text',
  summary: 'кодира и декодира base64',
  usage: 'base64 [-d] [-w N] [ФАЙЛ]',
  options: [['-d', 'декодира'], ['-w N', 'пренася на N знака (0 - без пренасяне; по подразбиране 76)']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'dw:i' });
    let bytes;
    if (rest.length) {
      const content = await ctx.fs.readFile(ctx.resolve(rest[0]));
      bytes = isBinary(content) ? content : new TextEncoder().encode(String(content));
    } else {
      bytes = new TextEncoder().encode(await ctx.readAll());
    }
    if (opts.d) {
      const text = new TextDecoder().decode(bytes).replace(/\s+/g, '');
      let bin;
      try {
        bin = atob(text);
      } catch {
        return ctx.fail('невалиден вход');
      }
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      ctx.out(new TextDecoder().decode(out));
      return 0;
    }
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    const enc = btoa(s);
    const w = opts.w !== undefined ? Number(opts.w) : 76;
    ctx.out((w > 0 ? enc.replace(new RegExp('(.{' + w + '})', 'g'), '$1\n').replace(/\n$/, '') : enc) + '\n');
    return 0;
  },
});

define({
  name: 'yes',
  group: 'text',
  summary: 'повтаря низ до прекъсване',
  usage: 'yes [НИЗ]',
  description: 'В терминала спира с Ctrl+C. В pipe дава до 100 000 реда.',
  async run(ctx) {
    const line = (ctx.args.length ? ctx.args.join(' ') : 'y') + '\n';
    if (!ctx.isTTY) {
      ctx.out(line.repeat(100000));
      return 0;
    }
    for (;;) {
      ctx.out(line.repeat(50));
      await ctx.sleep(30);
    }
  },
});

async function digest(ctx, algo, label) {
  const files = ctx.args.length ? ctx.args : ['-'];
  let st = 0;
  for (const f of files) {
    let bytes;
    try {
      if (f === '-') bytes = new TextEncoder().encode(await ctx.readAll());
      else {
        const content = await ctx.fs.readFile(ctx.resolve(f));
        bytes = isBinary(content) ? content : new TextEncoder().encode(String(content));
      }
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      ctx.err(f + ': ' + e.message);
      st = 1;
      continue;
    }
    if (!crypto.subtle) return ctx.fail(label + ' изисква защитена връзка (https)');
    const hash = new Uint8Array(await crypto.subtle.digest(algo, bytes));
    ctx.print(Array.from(hash).map((b) => b.toString(16).padStart(2, '0')).join('') + '  ' + f);
  }
  return st;
}

define({ name: 'sha256sum', group: 'text', summary: 'SHA-256 отпечатък', usage: 'sha256sum [ФАЙЛ]...', run: (ctx) => digest(ctx, 'SHA-256', 'sha256sum') });
define({ name: 'sha1sum', group: 'text', summary: 'SHA-1 отпечатък', usage: 'sha1sum [ФАЙЛ]...', run: (ctx) => digest(ctx, 'SHA-1', 'sha1sum') });

define({
  name: 'bc',
  group: 'text',
  summary: 'калкулатор',
  usage: 'bc [-l] [ФАЙЛ]...',
  description: 'Чете изрази от файл, stdin или от терминала (до Ctrl+D или quit). Поддържа + - * / % ^, скоби, сравнения, променливи (x=5) и scale=N (знаци след точката). С -l: scale=20 и функциите sqrt, s, c, a, l, e.',
  options: [['-l', 'математическа библиотека и scale=20']],
  examples: [["echo '(81.2+79.95)/2' | bc -l", ''], ["echo 'scale=2; 7/3' | bc", '2.33']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'lq' });
    const vars = { scale: opts.l ? 20 : 0 };
    const evalLine = (line) => {
      const results = [];
      for (const stmt of line.split(/[;\n]/)) {
        const s = stmt.replace(/#.*$/, '').trim();
        if (!s) continue;
        if (s === 'quit' || s === 'halt') return { results, quit: true };
        const m = /^([a-z_][a-z0-9_]*)\s*=\s*(.+)$/i.exec(s);
        if (m) {
          vars[m[1]] = evaluate(m[2], { vars, mode: 'bc', scale: Number(vars.scale) });
          continue;
        }
        const v = evaluate(s, { vars, mode: 'bc', scale: Number(vars.scale) });
        results.push(formatNumber(v, Number(vars.scale)));
      }
      return { results, quit: false };
    };
    const run = (line) => {
      try {
        const r = evalLine(line);
        if (r.results.length) ctx.print(r.results.join('\n'));
        return r.quit;
      } catch (e) {
        ctx.io.stderr.write('(standard_in) 1: ' + e.message + '\n');
        return false;
      }
    };
    if (rest.length) {
      for (const input of await ctx.readInputs(rest)) {
        for (const line of splitLines(input.text)) if (run(line)) return 0;
      }
      return 0;
    }
    for await (const line of ctx.lines()) {
      if (run(line)) break;
    }
    return 0;
  },
});

