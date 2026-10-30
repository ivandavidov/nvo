// awk - подмножество на езика: BEGIN/END, шаблон { действие }, полета $N, NR/NF/FS/OFS, масиви,
// if/else, while, for, for (k in масив), print/printf, next, exit и основните функции.

import { define } from '../registry.js';
import { FsError } from '../vfs.js';
import { splitLines, unescapeC } from './util.js';
import { sprintf } from './text.js';

class AwkError extends Error {}
class NextSignal {}
class ExitAwk {
  constructor(code) {
    this.code = code;
  }
}
class BreakSignal {}
class ContinueSignal {}

const KEYWORDS = new Set(['BEGIN', 'END', 'if', 'else', 'while', 'for', 'do', 'in', 'print', 'printf', 'next', 'exit', 'break', 'continue', 'delete', 'getline', 'function', 'return']);
const BUILTINS = new Set(['length', 'substr', 'index', 'split', 'sub', 'gsub', 'match', 'tolower', 'toupper', 'sprintf', 'int', 'sqrt', 'exp', 'log', 'sin', 'cos', 'atan2', 'rand', 'srand']);

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const prevAllowsRegex = () => {
    const t = tokens[tokens.length - 1];
    if (!t) return true;
    if (t.t === 'num' || t.t === 'str' || t.t === 'name' || t.t === 'builtin' || t.t === 'regex') return false;
    if (t.t === 'op' && (t.v === ')' || t.v === ']' || t.v === '$' || t.v === '++' || t.v === '--')) return false;
    return true;
  };
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
    if (ch === '\n') {
      tokens.push({ t: 'nl' });
      i++;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1]))) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(src.slice(i));
      tokens.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (ch === '"') {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length) {
          s += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        s += src[i++];
      }
      if (src[i] !== '"') throw new AwkError('незатворен низ');
      i++;
      tokens.push({ t: 'str', v: unescapeC(s.replace(/\\"/g, '"').replace(/\\\//g, '/')) });
      continue;
    }
    if (ch === '/' && prevAllowsRegex()) {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '/') {
        if (src[i] === '\\' && src[i + 1] === '/') {
          s += '/';
          i += 2;
          continue;
        }
        if (src[i] === '\\' && i + 1 < src.length) {
          s += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        s += src[i++];
      }
      if (src[i] !== '/') throw new AwkError('незатворен регулярен израз');
      i++;
      tokens.push({ t: 'regex', v: s });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      const v = m[0];
      i += v.length;
      if (KEYWORDS.has(v)) tokens.push({ t: 'kw', v });
      else if (BUILTINS.has(v)) tokens.push({ t: 'builtin', v });
      else tokens.push({ t: 'name', v });
      continue;
    }
    const m = /^(\+\+|--|\+=|-=|\*=|\/=|%=|\^=|==|!=|<=|>=|&&|\|\||!~|[-+*/%^!<>~=(){}[\],;?:$])/.exec(src.slice(i));
    if (!m) throw new AwkError("синтактична грешка при '" + ch + "'");
    tokens.push({ t: 'op', v: m[0] });
    i += m[0].length;
  }
  return tokens;
}

class AwkParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(k = 0) {
    return this.tokens[this.pos + k];
  }

  is(t, v) {
    const x = this.peek();
    return !!x && x.t === t && (v === undefined || x.v === v);
  }

  isOp(v) {
    return this.is('op', v);
  }

  eat(t, v) {
    if (!this.is(t, v)) {
      const x = this.peek();
      throw new AwkError('синтактична грешка: очаква се ' + (v || t) + (x ? ", а е '" + (x.v ?? x.t) + "'" : ' преди края'));
    }
    return this.tokens[this.pos++];
  }

  skipNl() {
    while (this.is('nl')) this.pos++;
  }

  skipTerms() {
    while (this.is('nl') || this.isOp(';')) this.pos++;
  }

  program() {
    const prog = { begin: [], end: [], rules: [] };
    this.skipTerms();
    while (this.peek()) {
      if (this.is('kw', 'BEGIN')) {
        this.pos++;
        this.skipNl();
        prog.begin.push(this.block());
      } else if (this.is('kw', 'END')) {
        this.pos++;
        this.skipNl();
        prog.end.push(this.block());
      } else if (this.isOp('{')) {
        prog.rules.push({ pattern: null, action: this.block() });
      } else {
        const pattern = this.expr();
        if (this.isOp('{')) prog.rules.push({ pattern, action: this.block() });
        else prog.rules.push({ pattern, action: null });
      }
      this.skipTerms();
    }
    return prog;
  }

  block() {
    this.eat('op', '{');
    const stmts = [];
    this.skipTerms();
    while (!this.isOp('}')) {
      if (!this.peek()) throw new AwkError("липсва '}'");
      stmts.push(this.statement());
      this.skipTerms();
    }
    this.eat('op', '}');
    return { type: 'block', stmts };
  }

  simpleOrBlock() {
    this.skipNl();
    if (this.isOp('{')) return this.block();
    const s = this.statement();
    if (this.isOp(';')) this.pos++;
    return s;
  }

  statement() {
    if (this.isOp('{')) return this.block();
    if (this.is('kw', 'if')) {
      this.pos++;
      this.eat('op', '(');
      const cond = this.expr();
      this.eat('op', ')');
      const then = this.simpleOrBlock();
      let save = this.pos;
      this.skipTerms();
      if (this.is('kw', 'else')) {
        this.pos++;
        return { type: 'if', cond, then, else: this.simpleOrBlock() };
      }
      this.pos = save;
      return { type: 'if', cond, then, else: null };
    }
    if (this.is('kw', 'while')) {
      this.pos++;
      this.eat('op', '(');
      const cond = this.expr();
      this.eat('op', ')');
      return { type: 'while', cond, body: this.simpleOrBlock() };
    }
    if (this.is('kw', 'for')) {
      this.pos++;
      this.eat('op', '(');
      if (this.is('name') && this.peek(1) && this.peek(1).t === 'kw' && this.peek(1).v === 'in' && this.peek(2) && this.peek(2).t === 'name' && this.peek(3) && this.peek(3).v === ')') {
        const key = this.eat('name').v;
        this.pos++;
        const arr = this.eat('name').v;
        this.eat('op', ')');
        return { type: 'forin', key, arr, body: this.simpleOrBlock() };
      }
      const init = this.isOp(';') ? null : this.expr();
      this.eat('op', ';');
      const cond = this.isOp(';') ? null : this.expr();
      this.eat('op', ';');
      const incr = this.isOp(')') ? null : this.expr();
      this.eat('op', ')');
      return { type: 'for', init, cond, incr, body: this.simpleOrBlock() };
    }
    if (this.is('kw', 'print') || this.is('kw', 'printf')) {
      const kind = this.tokens[this.pos++].v;
      const args = [];
      if (!this.endOfSimple()) {
        if (this.isOp('(')) {
          // print(a, b) или print (a)(b) - пробваме списък в скоби.
          const save = this.pos;
          try {
            this.pos++;
            const list = [this.expr()];
            while (this.isOp(',')) {
              this.pos++;
              this.skipNl();
              list.push(this.expr());
            }
            this.eat('op', ')');
            if (this.endOfSimple()) {
              args.push(...list);
              return { type: kind, args };
            }
          } catch {
            // не е списък в скоби
          }
          this.pos = save;
        }
        args.push(this.expr(true));
        while (this.isOp(',')) {
          this.pos++;
          this.skipNl();
          args.push(this.expr(true));
        }
      }
      return { type: kind, args };
    }
    if (this.is('kw', 'next')) {
      this.pos++;
      return { type: 'next' };
    }
    if (this.is('kw', 'exit')) {
      this.pos++;
      return { type: 'exit', value: this.endOfSimple() ? null : this.expr() };
    }
    if (this.is('kw', 'break')) {
      this.pos++;
      return { type: 'break' };
    }
    if (this.is('kw', 'continue')) {
      this.pos++;
      return { type: 'continue' };
    }
    if (this.is('kw', 'delete')) {
      this.pos++;
      const name = this.eat('name').v;
      let index = null;
      if (this.isOp('[')) {
        this.pos++;
        index = this.exprList();
        this.eat('op', ']');
      }
      return { type: 'delete', name, index };
    }
    return { type: 'expr', expr: this.expr() };
  }

  endOfSimple() {
    const t = this.peek();
    return !t || t.t === 'nl' || (t.t === 'op' && (t.v === ';' || t.v === '}'));
  }

  exprList() {
    const list = [this.expr()];
    while (this.isOp(',')) {
      this.pos++;
      list.push(this.expr());
    }
    return list;
  }

  expr(noGt = false) {
    const left = this.ternary(noGt);
    const t = this.peek();
    if (t && t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '^='].includes(t.v)) {
      if (!['var', 'field', 'index'].includes(left.type)) throw new AwkError('присвояване на нещо, което не е променлива');
      this.pos++;
      this.skipNl();
      return { type: 'assign', op: t.v, target: left, value: this.expr(noGt) };
    }
    return left;
  }

  ternary(noGt) {
    const cond = this.or(noGt);
    if (this.isOp('?')) {
      this.pos++;
      this.skipNl();
      const a = this.expr(noGt);
      this.skipNl();
      this.eat('op', ':');
      this.skipNl();
      const b = this.expr(noGt);
      return { type: 'cond', cond, a, b };
    }
    return cond;
  }

  or(noGt) {
    let left = this.and(noGt);
    while (this.isOp('||')) {
      this.pos++;
      this.skipNl();
      left = { type: 'or', a: left, b: this.and(noGt) };
    }
    return left;
  }

  and(noGt) {
    let left = this.inExpr(noGt);
    while (this.isOp('&&')) {
      this.pos++;
      this.skipNl();
      left = { type: 'and', a: left, b: this.inExpr(noGt) };
    }
    return left;
  }

  inExpr(noGt) {
    let left = this.matchExpr(noGt);
    while (this.is('kw', 'in')) {
      this.pos++;
      left = { type: 'in', key: [left], arr: this.eat('name').v };
    }
    return left;
  }

  matchExpr(noGt) {
    let left = this.cmp(noGt);
    while (this.isOp('~') || this.isOp('!~')) {
      const neg = this.tokens[this.pos++].v === '!~';
      left = { type: 'match', neg, a: left, re: this.cmp(noGt) };
    }
    return left;
  }

  cmp(noGt) {
    const left = this.concat();
    const t = this.peek();
    if (t && t.t === 'op' && ['<', '<=', '==', '!=', '>=', '>'].includes(t.v) && !(noGt && t.v === '>')) {
      this.pos++;
      return { type: 'cmp', op: t.v, a: left, b: this.concat() };
    }
    return left;
  }

  startsPrimary() {
    const t = this.peek();
    if (!t) return false;
    if (t.t === 'num' || t.t === 'str' || t.t === 'regex' || t.t === 'name' || t.t === 'builtin') return true;
    return t.t === 'op' && ['$', '!', '(', '++', '--'].includes(t.v);
  }

  concat() {
    let left = this.additive();
    while (this.startsPrimary() && !(this.is('kw', 'in'))) {
      left = { type: 'concat', a: left, b: this.additive() };
    }
    return left;
  }

  additive() {
    let left = this.mul();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.tokens[this.pos++].v;
      left = { type: 'bin', op, a: left, b: this.mul() };
    }
    return left;
  }

  mul() {
    let left = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.tokens[this.pos++].v;
      left = { type: 'bin', op, a: left, b: this.unary() };
    }
    return left;
  }

  unary() {
    if (this.isOp('!')) {
      this.pos++;
      return { type: 'not', a: this.unary() };
    }
    if (this.isOp('-')) {
      this.pos++;
      return { type: 'neg', a: this.unary() };
    }
    if (this.isOp('+')) {
      this.pos++;
      return { type: 'pos', a: this.unary() };
    }
    return this.power();
  }

  power() {
    const base = this.postfix();
    if (this.isOp('^')) {
      this.pos++;
      return { type: 'bin', op: '^', a: base, b: this.unary() };
    }
    return base;
  }

  postfix() {
    const p = this.primary();
    if ((this.isOp('++') || this.isOp('--')) && ['var', 'field', 'index'].includes(p.type)) {
      const op = this.tokens[this.pos++].v;
      return { type: 'postinc', op, target: p };
    }
    return p;
  }

  primary() {
    const t = this.peek();
    if (!t) throw new AwkError('неочакван край на програмата');
    if (t.t === 'num') {
      this.pos++;
      return { type: 'num', v: t.v };
    }
    if (t.t === 'str') {
      this.pos++;
      return { type: 'str', v: t.v };
    }
    if (t.t === 'regex') {
      this.pos++;
      return { type: 'regex', v: t.v };
    }
    if (t.t === 'op' && t.v === '$') {
      this.pos++;
      return { type: 'field', index: this.primaryForField() };
    }
    if (t.t === 'op' && (t.v === '++' || t.v === '--')) {
      this.pos++;
      const target = this.primary();
      return { type: 'preinc', op: t.v, target };
    }
    if (t.t === 'op' && t.v === '(') {
      this.pos++;
      const e = this.expr();
      if (this.isOp(',')) {
        const keys = [e];
        while (this.isOp(',')) {
          this.pos++;
          keys.push(this.expr());
        }
        this.eat('op', ')');
        this.eat('kw', 'in');
        return { type: 'in', key: keys, arr: this.eat('name').v };
      }
      this.eat('op', ')');
      return { type: 'group', a: e };
    }
    if (t.t === 'builtin') {
      this.pos++;
      const args = [];
      if (this.isOp('(')) {
        this.pos++;
        if (!this.isOp(')')) {
          args.push(this.expr());
          while (this.isOp(',')) {
            this.pos++;
            args.push(this.expr());
          }
        }
        this.eat('op', ')');
      }
      return { type: 'call', name: t.v, args };
    }
    if (t.t === 'name') {
      this.pos++;
      if (this.isOp('[')) {
        this.pos++;
        const index = this.exprList();
        this.eat('op', ']');
        return { type: 'index', name: t.v, index };
      }
      return { type: 'var', name: t.v };
    }
    throw new AwkError("синтактична грешка при '" + (t.v ?? t.t) + "'");
  }

  primaryForField() {
    if (this.isOp('-')) {
      this.pos++;
      return { type: 'neg', a: this.primaryForField() };
    }
    if (this.isOp('++') || this.isOp('--')) return this.primary();
    return this.primary();
  }
}

const NUM_RE = /^\s*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/;

function toNum(v) {
  if (typeof v === 'number') return v;
  const m = /^\s*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(String(v));
  return m ? Number(m[0]) : 0;
}

function toStr(v, fmt = '%.6g') {
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v);
    return sprintf(fmt, [String(v)]);
  }
  return v === undefined ? '' : String(v);
}

function toBool(v) {
  if (typeof v === 'number') return v !== 0;
  if (v instanceof StrNum) return toNum(v) !== 0;
  return v !== '' && v !== undefined;
}

function looksNumeric(v) {
  return typeof v === 'number' || (v instanceof StrNum);
}

/** Низ от входа, който изглежда като число - сравнява се числово (като в awk). */
class StrNum extends String {}

function strnum(s) {
  return NUM_RE.test(s) ? new StrNum(s) : s;
}

class Interp {
  constructor(prog, ctx, vars) {
    this.prog = prog;
    this.ctx = ctx;
    this.vars = { FS: ' ', OFS: ' ', ORS: '\n', NR: 0, NF: 0, FNR: 0, FILENAME: '', RSTART: 0, RLENGTH: -1, SUBSEP: '\x1c', OFMT: '%.6g', CONVFMT: '%.6g', ...vars };
    this.arrays = {};
    this.fields = [''];
    this.out = [];
    this.reCache = new Map();
    this.steps = 0;
  }

  regex(src) {
    let re = this.reCache.get(src);
    if (!re) {
      try {
        re = new RegExp(src);
      } catch {
        throw new AwkError('невалиден регулярен израз /' + src + '/');
      }
      this.reCache.set(src, re);
    }
    return re;
  }

  setRecord(line) {
    this.fields = [line];
    this.splitRecord();
  }

  splitRecord() {
    const line = String(this.fields[0]);
    const fs = String(this.vars.FS);
    let parts;
    if (fs === ' ') parts = line.trim() === '' ? [] : line.trim().split(/[ \t\n]+/);
    else if (fs.length === 1 && fs !== '\\') parts = line === '' ? [] : line.split(fs);
    else parts = line === '' ? [] : line.split(this.regex(fs));
    this.fields = [line, ...parts.map(strnum)];
    this.vars.NF = parts.length;
  }

  getField(i) {
    i = Math.trunc(toNum(i));
    if (i < 0) throw new AwkError('опит за достъп до поле ' + i);
    const v = this.fields[i];
    return v === undefined ? '' : v;
  }

  setField(i, v) {
    i = Math.trunc(toNum(i));
    if (i === 0) {
      this.fields[0] = toStr(v);
      this.splitRecord();
      return;
    }
    while (this.fields.length <= i) this.fields.push('');
    this.fields[i] = v;
    this.vars.NF = this.fields.length - 1;
    this.fields[0] = this.fields.slice(1).map((x) => toStr(x)).join(toStr(this.vars.OFS));
  }

  key(list) {
    return list.map((e) => toStr(this.eval(e))).join(toStr(this.vars.SUBSEP));
  }

  arr(name) {
    if (!this.arrays[name]) this.arrays[name] = new Map();
    return this.arrays[name];
  }

  assignTo(target, value) {
    if (target.type === 'var') {
      if (target.name === 'NF') {
        const n = Math.trunc(toNum(value));
        this.fields = this.fields.slice(0, n + 1);
        while (this.fields.length < n + 1) this.fields.push('');
        this.vars.NF = n;
        this.fields[0] = this.fields.slice(1).map((x) => toStr(x)).join(toStr(this.vars.OFS));
      } else {
        this.vars[target.name] = value;
      }
    } else if (target.type === 'field') {
      this.setField(this.eval(target.index), value);
    } else {
      this.arr(target.name).set(this.key(target.index), value);
    }
    return value;
  }

  current(target) {
    if (target.type === 'var') return this.vars[target.name] ?? '';
    if (target.type === 'field') return this.getField(this.eval(target.index));
    const v = this.arr(target.name).get(this.key(target.index));
    return v === undefined ? '' : v;
  }

  compare(a, b) {
    if ((looksNumeric(a) || a === '') && (looksNumeric(b) || b === '') && !(a === '' && b === '')) {
      return toNum(a) - toNum(b);
    }
    if (looksNumeric(a) && looksNumeric(b)) return toNum(a) - toNum(b);
    const x = toStr(a);
    const y = toStr(b);
    return x < y ? -1 : x > y ? 1 : 0;
  }

  eval(n) {
    if (++this.steps % 20000 === 0) this.ctx.check();
    switch (n.type) {
      case 'num': return n.v;
      case 'str': return n.v;
      case 'regex': return this.regex(n.v).test(toStr(this.fields[0])) ? 1 : 0;
      case 'group': return this.eval(n.a);
      case 'field': return this.getField(this.eval(n.index));
      case 'var': return n.name === 'NF' ? this.vars.NF : this.vars[n.name] ?? '';
      case 'index': {
        const v = this.arr(n.name).get(this.key(n.index));
        return v === undefined ? '' : v;
      }
      case 'assign': {
        let v = this.eval(n.value);
        if (n.op !== '=') {
          const cur = toNum(this.current(n.target));
          const r = toNum(v);
          const op = n.op[0];
          v = op === '+' ? cur + r : op === '-' ? cur - r : op === '*' ? cur * r : op === '/' ? this.div(cur, r) : op === '%' ? cur % r : cur ** r;
        }
        return this.assignTo(n.target, v);
      }
      case 'preinc': {
        const v = toNum(this.current(n.target)) + (n.op === '++' ? 1 : -1);
        return this.assignTo(n.target, v);
      }
      case 'postinc': {
        const old = toNum(this.current(n.target));
        this.assignTo(n.target, old + (n.op === '++' ? 1 : -1));
        return old;
      }
      case 'cond': return toBool(this.eval(n.cond)) ? this.eval(n.a) : this.eval(n.b);
      case 'or': return toBool(this.eval(n.a)) || toBool(this.eval(n.b)) ? 1 : 0;
      case 'and': return toBool(this.eval(n.a)) && toBool(this.eval(n.b)) ? 1 : 0;
      case 'not': return toBool(this.eval(n.a)) ? 0 : 1;
      case 'neg': return -toNum(this.eval(n.a));
      case 'pos': return toNum(this.eval(n.a));
      case 'in': return this.arr(n.arr).has(this.key(n.key)) ? 1 : 0;
      case 'match': {
        const re = n.re.type === 'regex' ? this.regex(n.re.v) : this.regex(toStr(this.eval(n.re)));
        const r = re.test(toStr(this.eval(n.a)));
        return r !== n.neg ? 1 : 0;
      }
      case 'cmp': {
        const d = this.compare(this.eval(n.a), this.eval(n.b));
        switch (n.op) {
          case '<': return d < 0 ? 1 : 0;
          case '<=': return d <= 0 ? 1 : 0;
          case '>': return d > 0 ? 1 : 0;
          case '>=': return d >= 0 ? 1 : 0;
          case '==': return d === 0 ? 1 : 0;
          default: return d !== 0 ? 1 : 0;
        }
      }
      case 'concat': return toStr(this.eval(n.a), this.vars.CONVFMT) + toStr(this.eval(n.b), this.vars.CONVFMT);
      case 'bin': {
        const a = toNum(this.eval(n.a));
        const b = toNum(this.eval(n.b));
        switch (n.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return this.div(a, b);
          case '%': return a % b;
          default: return a ** b;
        }
      }
      case 'call': return this.call(n);
      default: throw new AwkError('непознат израз');
    }
  }

  div(a, b) {
    if (b === 0) throw new AwkError('деление на нула');
    return a / b;
  }

  call(n) {
    const a = n.args;
    const s = (i) => toStr(this.eval(a[i]));
    const num = (i) => toNum(this.eval(a[i]));
    switch (n.name) {
      case 'length':
        if (!a.length) return Array.from(toStr(this.fields[0])).length;
        if (a[0].type === 'var' && this.arrays[a[0].name]) return this.arrays[a[0].name].size;
        return Array.from(s(0)).length;
      case 'substr': {
        const chars = Array.from(s(0));
        let start = Math.round(num(1));
        let len = a.length > 2 ? Math.round(num(2)) : Infinity;
        if (start < 1) {
          len += start - 1;
          start = 1;
        }
        if (len <= 0) return '';
        return chars.slice(start - 1, len === Infinity ? undefined : start - 1 + len).join('');
      }
      case 'index': {
        const i = s(0).indexOf(s(1));
        return i < 0 ? 0 : Array.from(s(0).slice(0, i)).length + 1;
      }
      case 'split': {
        const str = s(0);
        const name = a[1].name;
        const sep = a.length > 2 ? (a[2].type === 'regex' ? this.regex(a[2].v) : toStr(this.eval(a[2]))) : toStr(this.vars.FS);
        let parts;
        if (sep === ' ') parts = str.trim() === '' ? [] : str.trim().split(/[ \t\n]+/);
        else if (typeof sep === 'string' && sep.length === 1) parts = str === '' ? [] : str.split(sep);
        else parts = str === '' ? [] : str.split(typeof sep === 'string' ? this.regex(sep) : sep);
        const arr = new Map();
        parts.forEach((p, i) => arr.set(String(i + 1), strnum(p)));
        this.arrays[name] = arr;
        return parts.length;
      }
      case 'sub':
      case 'gsub': {
        const re = a[0].type === 'regex' ? this.regex(a[0].v) : this.regex(s(0));
        const target = a.length > 2 ? a[2] : { type: 'field', index: { type: 'num', v: 0 } };
        const repl = s(1);
        const cur = toStr(this.current(target));
        let count = 0;
        const g = new RegExp(re.source, n.name === 'gsub' ? 'g' : '');
        const out = cur.replace(g, (m) => {
          count++;
          return repl.replace(/\\\\|\\&|&/g, (x) => (x === '&' ? m : x === '\\&' ? '&' : '\\'));
        });
        if (count) this.assignTo(target, out);
        return count;
      }
      case 'match': {
        const re = a[1].type === 'regex' ? this.regex(a[1].v) : this.regex(s(1));
        const str = s(0);
        const m = re.exec(str);
        this.vars.RSTART = m ? Array.from(str.slice(0, m.index)).length + 1 : 0;
        this.vars.RLENGTH = m ? Array.from(m[0]).length : -1;
        return this.vars.RSTART;
      }
      case 'tolower': return s(0).toLowerCase();
      case 'toupper': return s(0).toUpperCase();
      case 'sprintf': return sprintf(s(0), a.slice(1).map((x) => toStr(this.eval(x))));
      case 'int': return Math.trunc(num(0));
      case 'sqrt': return Math.sqrt(num(0));
      case 'exp': return Math.exp(num(0));
      case 'log': return Math.log(num(0));
      case 'sin': return Math.sin(num(0));
      case 'cos': return Math.cos(num(0));
      case 'atan2': return Math.atan2(num(0), num(1));
      case 'rand': return Math.random();
      case 'srand': return 0;
      default: throw new AwkError('непозната функция ' + n.name);
    }
  }

  exec(s) {
    switch (s.type) {
      case 'block':
        for (const st of s.stmts) this.exec(st);
        return;
      case 'expr':
        this.eval(s.expr);
        return;
      case 'print': {
        const vals = s.args.length ? s.args.map((e) => toStr(this.eval(e), this.vars.OFMT)) : [toStr(this.fields[0])];
        this.out.push(vals.join(toStr(this.vars.OFS)) + toStr(this.vars.ORS));
        return;
      }
      case 'printf': {
        if (!s.args.length) throw new AwkError('printf без формат');
        const vals = s.args.map((e) => toStr(this.eval(e)));
        this.out.push(sprintf(vals[0], vals.slice(1)));
        return;
      }
      case 'if':
        if (toBool(this.eval(s.cond))) this.exec(s.then);
        else if (s.else) this.exec(s.else);
        return;
      case 'while':
        while (toBool(this.eval(s.cond))) {
          try {
            this.exec(s.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (!(e instanceof ContinueSignal)) throw e;
          }
          if (++this.steps % 20000 === 0) this.ctx.check();
        }
        return;
      case 'for':
        if (s.init) this.eval(s.init);
        while (!s.cond || toBool(this.eval(s.cond))) {
          try {
            this.exec(s.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (!(e instanceof ContinueSignal)) throw e;
          }
          if (s.incr) this.eval(s.incr);
          if (++this.steps % 20000 === 0) this.ctx.check();
        }
        return;
      case 'forin':
        for (const k of Array.from(this.arr(s.arr).keys())) {
          this.vars[s.key] = strnum(k);
          try {
            this.exec(s.body);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (!(e instanceof ContinueSignal)) throw e;
          }
        }
        return;
      case 'next': throw new NextSignal();
      case 'exit': throw new ExitAwk(s.value ? Math.trunc(toNum(this.eval(s.value))) : 0);
      case 'break': throw new BreakSignal();
      case 'continue': throw new ContinueSignal();
      case 'delete':
        if (s.index) this.arr(s.name).delete(this.key(s.index));
        else this.arrays[s.name] = new Map();
        return;
      default: throw new AwkError('непозната команда');
    }
  }
}

define({
  name: 'awk',
  aliases: ['gawk', 'mawk'],
  group: 'text',
  summary: 'обработва текст по полета (подмножество на awk)',
  usage: "awk [-F РАЗДЕЛИТЕЛ] [-v ПРОМ=СТОЙНОСТ] 'ПРОГРАМА' [ФАЙЛ]...",
  description: 'Програмата е от правила "шаблон { действие }", плюс BEGIN и END. $0 е редът, $1..$NF - полетата, NR - номерът на реда.\nПоддържат се променливи, масиви (a[$1] += $2), for (k in a), if/else, while, for, print, printf, next, exit и функциите length, substr, index, split, sub, gsub, match, tolower, toupper, sprintf, int, sqrt.\nНяма потребителски функции, getline и пренасочване на изхода от print.',
  options: [['-F РАЗДЕЛИТЕЛ', 'разделител на полетата (знак или регулярен израз; \\t за табулация)'], ['-v ПРОМ=СТОЙНОСТ', 'задава променлива преди BEGIN']],
  examples: [["awk -F, '{print $1, $3}' данни.csv", ''], ["awk '$3 > 80' таблица.txt", 'редовете с трето поле над 80'], ["awk -F'\\t' '{s[$2]+=$3} END {for (k in s) print k, s[k]}' f.tsv", 'сбор по група'], ["awk 'NR>1 {s+=$2; n++} END {printf \"%.2f\\n\", s/n}'", 'средна']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'F:v:f:', multi: 'v' });
    let source;
    if (opts.f) {
      try {
        source = String(await ctx.fs.readFile(ctx.resolve(opts.f)));
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        return ctx.fail(opts.f + ': ' + e.message, 2);
      }
    } else {
      if (!rest.length) return ctx.fail("употреба: awk [-F РАЗДЕЛИТЕЛ] [-v ПРОМ=СТОЙНОСТ] 'ПРОГРАМА' [ФАЙЛ]...", 2);
      source = rest.shift();
    }
    const vars = {};
    if (opts.F !== undefined) vars.FS = opts.F === 't' || opts.F === '\\t' ? '\t' : unescapeC(opts.F);
    for (const v of opts.v || []) {
      const eq = v.indexOf('=');
      if (eq <= 0) return ctx.fail("-v: невалидно присвояване '" + v + "'", 2);
      vars[v.slice(0, eq)] = strnum(unescapeC(v.slice(eq + 1)));
    }
    let prog;
    try {
      prog = new AwkParser(tokenize(source)).program();
    } catch (e) {
      if (e instanceof AwkError) return ctx.fail(e.message, 2);
      throw e;
    }
    const it = new Interp(prog, ctx, vars);
    const flush = () => {
      if (it.out.length) {
        ctx.out(it.out.join(''));
        it.out = [];
      }
    };
    let code = 0;
    try {
      try {
        for (const b of prog.begin) it.exec(b);
        const files = [];
        for (const r of rest) {
          const m = /^([A-Za-z_]\w*)=(.*)$/.exec(r);
          if (m) files.push({ assign: [m[1], m[2]] });
          else files.push({ name: r });
        }
        const needInput = prog.rules.length || prog.end.length;
        if (needInput) {
          const realFiles = files.filter((f) => f.name);
          const inputs = realFiles.length ? null : [{ name: '', text: await ctx.readAll() }];
          const list = inputs || files;
          for (const f of list) {
            if (f.assign) {
              it.vars[f.assign[0]] = strnum(f.assign[1]);
              continue;
            }
            let text = f.text;
            if (text === undefined) {
              const [input] = await ctx.readInputs([f.name]);
              if (!input) continue;
              text = input.text;
            }
            it.vars.FILENAME = f.name === '-' ? '' : f.name;
            it.vars.FNR = 0;
            for (const line of splitLines(text)) {
              it.vars.NR++;
              it.vars.FNR++;
              it.setRecord(line);
              try {
                for (const rule of prog.rules) {
                  if (rule.pattern && !toBool(it.eval(rule.pattern))) continue;
                  if (rule.action) it.exec(rule.action);
                  else it.out.push(toStr(it.fields[0]) + toStr(it.vars.ORS));
                }
              } catch (e) {
                if (!(e instanceof NextSignal)) throw e;
              }
              if (it.vars.NR % 5000 === 0) {
                flush();
                await ctx.tick();
              }
            }
          }
        }
      } catch (e) {
        if (!(e instanceof ExitAwk)) throw e;
        code = e.code;
      }
      try {
        for (const b of prog.end) it.exec(b);
      } catch (e) {
        if (!(e instanceof ExitAwk)) throw e;
        code = e.code;
      }
    } catch (e) {
      flush();
      if (e instanceof AwkError) return ctx.fail(e.message, 2);
      if (e instanceof NextSignal || e instanceof BreakSignal || e instanceof ContinueSignal) return ctx.fail('next/break/continue на неправилно място', 2);
      throw e;
    }
    flush();
    return code || (ctx.failed ? 2 : 0);
  },
});
