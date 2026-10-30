// jq - подмножество: пътища (.a.b, .[n], .[], .[a:b], ..), |, запетая, сравнения, and/or/not, //,
// if/then/elif/else/end, конструиране на масиви и обекти, "\(...)" и най-ползваните функции.

import { define } from '../registry.js';
import { palette } from '../ansi.js';
import { FsError } from '../vfs.js';
import { asText } from './util.js';

export class JqError extends Error {}

function tokenize(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '#') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '"') {
      // Низ с интерполация "\(израз)": частите са низове и под-програми.
      const parts = [];
      let s = '';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') {
          const n = src[i + 1];
          if (n === '(') {
            let depth = 1;
            let j = i + 2;
            for (; j < src.length && depth; j++) {
              if (src[j] === '(') depth++;
              else if (src[j] === ')') depth--;
            }
            if (s) parts.push(s);
            s = '';
            parts.push({ expr: src.slice(i + 2, j - 1) });
            i = j;
            continue;
          }
          const map = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f' };
          if (n === 'u') {
            s += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16));
            i += 6;
            continue;
          }
          s += map[n] !== undefined ? map[n] : n;
          i += 2;
          continue;
        }
        s += src[i++];
      }
      if (src[i] !== '"') throw new JqError('незатворен низ');
      i++;
      if (s || !parts.length) parts.push(s);
      out.push({ t: 'str', parts });
      continue;
    }
    let m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(src.slice(i));
    if (m && !(ch === '.' && /[A-Za-z_]/.test(src[i + 1] || ''))) {
      if (ch !== '.' || /\d/.test(src[i + 1])) {
        out.push({ t: 'num', v: Number(m[0]) });
        i += m[0].length;
        continue;
      }
    }
    m = /^@[a-z0-9]+/.exec(src.slice(i));
    if (m) {
      out.push({ t: 'format', v: m[0] });
      i += m[0].length;
      continue;
    }
    m = /^\$?[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
    if (m) {
      out.push({ t: 'ident', v: m[0] });
      i += m[0].length;
      continue;
    }
    m = /^(\.\.|\/\/|==|!=|<=|>=|\?\/\/|[.|,()[\]{}:;<>+\-*/%?])/.exec(src.slice(i));
    if (!m) throw new JqError("синтактична грешка при '" + ch + "'");
    out.push({ t: 'op', v: m[0] });
    i += m[0].length;
  }
  return out;
}

class Parser {
  constructor(tokens) {
    this.t = tokens;
    this.p = 0;
  }

  peek(k = 0) {
    return this.t[this.p + k];
  }

  isOp(v) {
    const x = this.peek();
    return !!x && x.t === 'op' && x.v === v;
  }

  isIdent(v) {
    const x = this.peek();
    return !!x && x.t === 'ident' && x.v === v;
  }

  eat(v) {
    if (!this.isOp(v) && !this.isIdent(v)) {
      const x = this.peek();
      throw new JqError("синтактична грешка: очаква се '" + v + "'" + (x ? ", а е '" + (x.v || x.t) + "'" : ''));
    }
    return this.t[this.p++];
  }

  parse() {
    const e = this.pipe();
    if (this.p < this.t.length) throw new JqError("синтактична грешка при '" + (this.peek().v || this.peek().t) + "'");
    return e;
  }

  pipe() {
    let left = this.comma();
    if (this.isIdent('as')) {
      this.p++;
      const name = this.t[this.p++].v;
      this.eat('|');
      return { k: 'as', src: left, name, body: this.pipe() };
    }
    while (this.isOp('|')) {
      this.p++;
      left = { k: 'pipe', a: left, b: this.comma() };
    }
    return left;
  }

  comma() {
    let left = this.alt();
    while (this.isOp(',')) {
      this.p++;
      left = { k: 'comma', a: left, b: this.alt() };
    }
    return left;
  }

  alt() {
    let left = this.or();
    while (this.isOp('//')) {
      this.p++;
      left = { k: 'alt', a: left, b: this.or() };
    }
    return left;
  }

  or() {
    let left = this.and();
    while (this.isIdent('or')) {
      this.p++;
      left = { k: 'or', a: left, b: this.and() };
    }
    return left;
  }

  and() {
    let left = this.cmp();
    while (this.isIdent('and')) {
      this.p++;
      left = { k: 'and', a: left, b: this.cmp() };
    }
    return left;
  }

  cmp() {
    const left = this.add();
    const x = this.peek();
    if (x && x.t === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(x.v)) {
      this.p++;
      return { k: 'cmp', op: x.v, a: left, b: this.add() };
    }
    return left;
  }

  add() {
    let left = this.mul();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.t[this.p++].v;
      left = { k: 'arith', op, a: left, b: this.mul() };
    }
    return left;
  }

  mul() {
    let left = this.postfix();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.t[this.p++].v;
      left = { k: 'arith', op, a: left, b: this.postfix() };
    }
    return left;
  }

  postfix() {
    let e = this.primary();
    for (;;) {
      if (this.isOp('.') && this.peek(1) && (this.peek(1).t === 'ident' || this.peek(1).t === 'str') && !this.spaceBefore(1)) {
        this.p++;
        const key = this.t[this.p++];
        e = { k: 'pipe', a: e, b: { k: 'field', name: key.t === 'ident' ? key.v : key.parts.join('') } };
      } else if (this.isOp('.') && this.peek(1) && this.peek(1).t === 'op' && this.peek(1).v === '[') {
        this.p++;
      } else if (this.isOp('[')) {
        e = { k: 'pipe', a: e, b: this.bracket() };
      } else if (this.isOp('?')) {
        this.p++;
        e = { k: 'try', a: e };
      } else {
        return e;
      }
    }
  }

  spaceBefore() {
    return false;
  }

  bracket() {
    this.eat('[');
    if (this.isOp(']')) {
      this.p++;
      return { k: 'iter' };
    }
    let from = null;
    if (!this.isOp(':')) from = this.pipe();
    if (this.isOp(':')) {
      this.p++;
      const to = this.isOp(']') ? null : this.pipe();
      this.eat(']');
      return { k: 'slice', from, to };
    }
    this.eat(']');
    return { k: 'index', idx: from };
  }

  primary() {
    const x = this.peek();
    if (!x) throw new JqError('неочакван край на филтъра');
    if (x.t === 'num') {
      this.p++;
      return { k: 'lit', v: x.v };
    }
    if (x.t === 'str') {
      this.p++;
      return { k: 'str', parts: x.parts.map((part) => (typeof part === 'string' ? part : new Parser(tokenize(part.expr)).parse())) };
    }
    if (x.t === 'format') {
      this.p++;
      return { k: 'format', name: x.v };
    }
    if (x.t === 'op') {
      if (x.v === '..') {
        this.p++;
        return { k: 'recurse' };
      }
      if (x.v === '.') {
        this.p++;
        const n = this.peek();
        if (n && n.t === 'ident' && !['and', 'or', 'as', 'then', 'else', 'elif', 'end'].includes(n.v)) {
          this.p++;
          return { k: 'field', name: n.v };
        }
        if (n && n.t === 'str') {
          this.p++;
          return { k: 'field', name: n.parts.join('') };
        }
        if (n && n.t === 'op' && n.v === '[') return this.bracket();
        return { k: 'identity' };
      }
      if (x.v === '(') {
        this.p++;
        const e = this.pipe();
        this.eat(')');
        return e;
      }
      if (x.v === '[') {
        this.p++;
        if (this.isOp(']')) {
          this.p++;
          return { k: 'array', e: null };
        }
        const e = this.pipe();
        this.eat(']');
        return { k: 'array', e };
      }
      if (x.v === '{') return this.object();
      if (x.v === '-') {
        this.p++;
        return { k: 'neg', a: this.postfix() };
      }
    }
    if (x.t === 'ident') {
      if (x.v === 'if') return this.ifExpr();
      if (x.v.startsWith('$')) {
        this.p++;
        return { k: 'var', name: x.v };
      }
      this.p++;
      if (x.v === 'true') return { k: 'lit', v: true };
      if (x.v === 'false') return { k: 'lit', v: false };
      if (x.v === 'null') return { k: 'lit', v: null };
      const args = [];
      if (this.isOp('(')) {
        this.p++;
        args.push(this.pipe());
        while (this.isOp(';')) {
          this.p++;
          args.push(this.pipe());
        }
        this.eat(')');
      }
      return { k: 'call', name: x.v, args };
    }
    throw new JqError("синтактична грешка при '" + (x.v || x.t) + "'");
  }

  ifExpr() {
    this.eat('if');
    const cond = this.pipe();
    this.eat('then');
    const then = this.pipe();
    let otherwise = null;
    if (this.isIdent('elif')) {
      this.t[this.p] = { t: 'ident', v: 'if' };
      otherwise = this.ifExpr();
      return { k: 'if', cond, then, else: otherwise };
    }
    if (this.isIdent('else')) {
      this.p++;
      otherwise = this.pipe();
    }
    this.eat('end');
    return { k: 'if', cond, then, else: otherwise };
  }

  object() {
    this.eat('{');
    const fields = [];
    while (!this.isOp('}')) {
      const x = this.peek();
      let key;
      let value = null;
      if (x.t === 'ident') {
        this.p++;
        key = { k: 'lit', v: x.v.replace(/^\$/, '') };
        if (x.v.startsWith('$')) value = { k: 'var', name: x.v };
        else value = { k: 'field', name: x.v };
      } else if (x.t === 'str') {
        this.p++;
        key = { k: 'str', parts: x.parts.map((part) => (typeof part === 'string' ? part : new Parser(tokenize(part.expr)).parse())) };
        value = { k: 'field', name: x.parts.join('') };
      } else if (x.t === 'op' && x.v === '(') {
        this.p++;
        key = this.pipe();
        this.eat(')');
      } else {
        throw new JqError('невалиден ключ на обект');
      }
      if (this.isOp(':')) {
        this.p++;
        value = this.alt();
      }
      fields.push({ key, value });
      if (this.isOp(',')) this.p++;
      else break;
    }
    this.eat('}');
    return { k: 'object', fields };
  }
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v === 'object' ? 'object' : typeof v;
}

const ORDER = { null: 0, boolean: 1, number: 3, string: 4, array: 5, object: 6 };

export function compareJson(a, b) {
  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb) return ORDER[ta] - ORDER[tb];
  if (ta === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
  if (ta === 'number') return a - b;
  if (ta === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (ta === 'array') {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const d = compareJson(a[i], b[i]);
      if (d) return d;
    }
    return a.length - b.length;
  }
  if (ta === 'object') {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    const d = compareJson(ka, kb);
    if (d) return d;
    for (const k of ka) {
      const dd = compareJson(a[k], b[k]);
      if (dd) return dd;
    }
  }
  return 0;
}

const truthy = (v) => v !== null && v !== false;

function csvCell(v) {
  if (typeof v === 'string') return '"' + v.replace(/"/g, '""') + '"';
  if (v === null) return '';
  if (typeof v === 'object') throw new JqError('@csv приема само прости стойности');
  return String(v);
}

function tsvCell(v) {
  if (typeof v === 'string') return v.replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  if (v === null) return '';
  if (typeof v === 'object') throw new JqError('@tsv приема само прости стойности');
  return String(v);
}

function applyFormat(name, v) {
  switch (name) {
    case '@csv':
      if (!Array.isArray(v)) throw new JqError('@csv приема масив');
      return v.map(csvCell).join(',');
    case '@tsv':
      if (!Array.isArray(v)) throw new JqError('@tsv приема масив');
      return v.map(tsvCell).join('\t');
    case '@json': return JSON.stringify(v);
    case '@text': return typeof v === 'string' ? v : JSON.stringify(v);
    case '@html': return (typeof v === 'string' ? v : JSON.stringify(v)).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));
    case '@uri': return encodeURIComponent(typeof v === 'string' ? v : JSON.stringify(v));
    case '@base64': return btoa(unescape(encodeURIComponent(typeof v === 'string' ? v : JSON.stringify(v))));
    default: throw new JqError('непознат формат ' + name);
  }
}

class Jq {
  constructor(vars = {}) {
    this.vars = vars;
  }

  run(node, input, env = this.vars) {
    const ev = (n, x, e = env) => this.run(n, x, e);
    const one = (n, x) => {
      const r = ev(n, x);
      return r;
    };
    switch (node.k) {
      case 'identity': return [input];
      case 'lit': return [node.v];
      case 'var': {
        if (!(node.name in env)) throw new JqError(node.name + ' не е дефинирана');
        return [env[node.name]];
      }
      case 'str': {
        let outs = [''];
        for (const part of node.parts) {
          if (typeof part === 'string') {
            outs = outs.map((s) => s + part);
          } else {
            const vals = ev(part, input);
            const next = [];
            for (const s of outs) for (const v of vals) next.push(s + (typeof v === 'string' ? v : JSON.stringify(v)));
            outs = next;
          }
        }
        return outs;
      }
      case 'format': return [applyFormat(node.name, input)];
      case 'field': {
        if (input === null) return [null];
        if (typeOf(input) !== 'object') throw new JqError('не може да се вземе поле "' + node.name + '" от ' + typeOf(input));
        return [input[node.name] === undefined ? null : input[node.name]];
      }
      case 'index': {
        const out = [];
        for (const idx of ev(node.idx, input)) {
          if (input === null) out.push(null);
          else if (typeof idx === 'number' && Array.isArray(input)) {
            const i = idx < 0 ? input.length + idx : Math.floor(idx);
            out.push(input[i] === undefined ? null : input[i]);
          } else if (typeof idx === 'string' && typeOf(input) === 'object') {
            out.push(input[idx] === undefined ? null : input[idx]);
          } else {
            throw new JqError('не може да се индексира ' + typeOf(input) + ' с ' + typeOf(idx));
          }
        }
        return out;
      }
      case 'slice': {
        if (input === null) return [null];
        if (!Array.isArray(input) && typeof input !== 'string') throw new JqError('не може да се реже ' + typeOf(input));
        const from = node.from ? ev(node.from, input)[0] : 0;
        const to = node.to ? ev(node.to, input)[0] : input.length;
        return [input.slice(from === null ? 0 : from, to === null ? input.length : to)];
      }
      case 'iter': {
        if (Array.isArray(input)) return input.slice();
        if (typeOf(input) === 'object') return Object.values(input);
        throw new JqError('не може да се обходи ' + typeOf(input));
      }
      case 'recurse': {
        const out = [];
        const walk = (v) => {
          out.push(v);
          if (Array.isArray(v)) v.forEach(walk);
          else if (typeOf(v) === 'object') Object.values(v).forEach(walk);
        };
        walk(input);
        return out;
      }
      case 'pipe': {
        const out = [];
        for (const v of ev(node.a, input)) out.push(...ev(node.b, v));
        return out;
      }
      case 'comma': return [...ev(node.a, input), ...ev(node.b, input)];
      case 'try': {
        try {
          return ev(node.a, input);
        } catch (e) {
          if (e instanceof JqError) return [];
          throw e;
        }
      }
      case 'alt': {
        let vals;
        try {
          vals = ev(node.a, input).filter(truthy);
        } catch (e) {
          if (!(e instanceof JqError)) throw e;
          vals = [];
        }
        return vals.length ? vals : ev(node.b, input);
      }
      case 'or': {
        const out = [];
        for (const a of ev(node.a, input)) {
          if (truthy(a)) out.push(true);
          else for (const b of ev(node.b, input)) out.push(truthy(b));
        }
        return out;
      }
      case 'and': {
        const out = [];
        for (const a of ev(node.a, input)) {
          if (!truthy(a)) out.push(false);
          else for (const b of ev(node.b, input)) out.push(truthy(b));
        }
        return out;
      }
      case 'cmp': {
        const out = [];
        for (const b of ev(node.b, input)) {
          for (const a of ev(node.a, input)) {
            const d = compareJson(a, b);
            out.push(node.op === '==' ? d === 0 : node.op === '!=' ? d !== 0 : node.op === '<' ? d < 0 : node.op === '<=' ? d <= 0 : node.op === '>' ? d > 0 : d >= 0);
          }
        }
        return out;
      }
      case 'arith': {
        const out = [];
        for (const b of ev(node.b, input)) for (const a of ev(node.a, input)) out.push(this.arith(node.op, a, b));
        return out;
      }
      case 'neg': return ev(node.a, input).map((v) => {
        if (typeof v !== 'number') throw new JqError('не може да се смени знакът на ' + typeOf(v));
        return -v;
      });
      case 'array': return [node.e ? ev(node.e, input) : []];
      case 'object': {
        let outs = [{}];
        for (const f of node.fields) {
          const keys = ev(f.key, input);
          const vals = ev(f.value, input);
          const next = [];
          for (const o of outs) {
            for (const k of keys) {
              if (typeof k !== 'string') throw new JqError('ключът на обект трябва да е низ');
              for (const v of vals) next.push({ ...o, [k]: v });
            }
          }
          outs = next;
        }
        return outs;
      }
      case 'if': {
        const out = [];
        for (const c of ev(node.cond, input)) {
          if (truthy(c)) out.push(...ev(node.then, input));
          else if (node.else) out.push(...ev(node.else, input));
          else out.push(input);
        }
        return out;
      }
      case 'as': {
        const out = [];
        for (const v of ev(node.src, input)) out.push(...ev(node.body, input, { ...env, [node.name]: v }));
        return out;
      }
      case 'call': return this.call(node, input, env, one);
      default: throw new JqError('непознат филтър');
    }
  }

  arith(op, a, b) {
    if (op === '+') {
      if (a === null) return b;
      if (b === null) return a;
      if (typeof a === 'number' && typeof b === 'number') return a + b;
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      if (typeOf(a) === 'object' && typeOf(b) === 'object') return { ...a, ...b };
    } else if (op === '-') {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      if (Array.isArray(a) && Array.isArray(b)) return a.filter((x) => !b.some((y) => compareJson(x, y) === 0));
    } else if (typeof a === 'number' && typeof b === 'number') {
      if ((op === '/' || op === '%') && b === 0) throw new JqError('деление на нула');
      return op === '*' ? a * b : op === '/' ? a / b : a % b;
    } else if (op === '/' && typeof a === 'string' && typeof b === 'string') {
      return a.split(b);
    }
    throw new JqError(typeOf(a) + ' и ' + typeOf(b) + " не могат да се комбинират с '" + op + "'");
  }

  call(node, input, env) {
    const a = node.args;
    const ev = (n, x = input) => this.run(n, x, env);
    const first = (n, x = input) => ev(n, x)[0];
    const need = (t) => {
      if (typeOf(input) !== t) throw new JqError(node.name + ' не приема ' + typeOf(input));
    };
    const iterable = () => {
      if (Array.isArray(input)) return input;
      if (typeOf(input) === 'object') return Object.values(input);
      throw new JqError(node.name + ' не приема ' + typeOf(input));
    };
    switch (node.name) {
      case 'empty': return [];
      case 'not': return [!truthy(input)];
      case 'length':
        if (input === null) return [0];
        if (typeof input === 'number') return [Math.abs(input)];
        if (typeof input === 'string') return [Array.from(input).length];
        if (Array.isArray(input)) return [input.length];
        if (typeOf(input) === 'object') return [Object.keys(input).length];
        throw new JqError('boolean няма дължина');
      case 'keys':
      case 'keys_unsorted':
        if (Array.isArray(input)) return [input.map((_, i) => i)];
        need('object');
        return [node.name === 'keys' ? Object.keys(input).sort() : Object.keys(input)];
      case 'values': return truthy(input) ? [input] : [];
      case 'has': {
        const k = first(a[0]);
        if (Array.isArray(input)) return [k >= 0 && k < input.length];
        need('object');
        return [Object.prototype.hasOwnProperty.call(input, k)];
      }
      case 'in': {
        const obj = first(a[0]);
        return [Array.isArray(obj) ? input >= 0 && input < obj.length : Object.prototype.hasOwnProperty.call(obj, input)];
      }
      case 'map': return [iterable().flatMap((x) => ev(a[0], x))];
      case 'map_values': {
        if (Array.isArray(input)) return [input.map((x) => ev(a[0], x)[0])];
        need('object');
        const o = {};
        for (const [k, v] of Object.entries(input)) {
          const r = ev(a[0], v);
          if (r.length) o[k] = r[0];
        }
        return [o];
      }
      case 'select': return ev(a[0]).some(truthy) ? [input] : [];
      case 'recurse': return this.run({ k: 'recurse' }, input, env);
      case 'sort': need('array'); return [input.slice().sort(compareJson)];
      case 'sort_by': need('array'); return [input.map((x) => ({ x, k: ev(a[0], x) })).sort((p, q) => compareJson(p.k, q.k)).map((p) => p.x)];
      case 'group_by': {
        need('array');
        const sorted = input.map((x) => ({ x, k: ev(a[0], x) })).sort((p, q) => compareJson(p.k, q.k));
        const groups = [];
        for (const item of sorted) {
          const last = groups[groups.length - 1];
          if (last && compareJson(last.k, item.k) === 0) last.items.push(item.x);
          else groups.push({ k: item.k, items: [item.x] });
        }
        return [groups.map((g) => g.items)];
      }
      case 'unique': need('array'); return [input.slice().sort(compareJson).filter((x, i, arr) => i === 0 || compareJson(arr[i - 1], x) !== 0)];
      case 'unique_by': {
        need('array');
        const sorted = input.map((x) => ({ x, k: ev(a[0], x) })).sort((p, q) => compareJson(p.k, q.k));
        return [sorted.filter((p, i, arr) => i === 0 || compareJson(arr[i - 1].k, p.k) !== 0).map((p) => p.x)];
      }
      case 'min': case 'max': {
        need('array');
        if (!input.length) return [null];
        const s = input.slice().sort(compareJson);
        return [node.name === 'min' ? s[0] : s[s.length - 1]];
      }
      case 'min_by': case 'max_by': {
        need('array');
        if (!input.length) return [null];
        const s = input.map((x) => ({ x, k: ev(a[0], x) })).sort((p, q) => compareJson(p.k, q.k));
        return [node.name === 'min_by' ? s[0].x : s[s.length - 1].x];
      }
      case 'add': {
        const items = iterable();
        return [items.reduce((acc, v) => (acc === undefined ? v : this.arith('+', acc, v)), undefined) ?? null];
      }
      case 'any': return [a.length ? iterable().some((x) => ev(a[0], x).some(truthy)) : iterable().some(truthy)];
      case 'all': return [a.length ? iterable().every((x) => ev(a[0], x).some(truthy)) : iterable().every(truthy)];
      case 'flatten': {
        need('array');
        const depth = a.length ? first(a[0]) : Infinity;
        return [input.flat(depth)];
      }
      case 'range': {
        const from = a.length > 1 ? first(a[0]) : 0;
        const to = a.length > 1 ? first(a[1]) : first(a[0]);
        const out = [];
        for (let i = from; i < to && out.length < 1e6; i++) out.push(i);
        return out;
      }
      case 'first': return a.length ? ev(a[0]).slice(0, 1) : [Array.isArray(input) ? input[0] ?? null : null];
      case 'last': {
        if (a.length) {
          const r = ev(a[0]);
          return r.length ? [r[r.length - 1]] : [];
        }
        return [Array.isArray(input) ? input[input.length - 1] ?? null : null];
      }
      case 'limit': {
        const n = first(a[0]);
        return ev(a[1]).slice(0, Math.max(0, n));
      }
      case 'reverse': return [typeof input === 'string' ? Array.from(input).reverse().join('') : input === null ? [] : input.slice().reverse()];
      case 'to_entries': need('object'); return [Object.entries(input).map(([key, value]) => ({ key, value }))];
      case 'from_entries': need('array'); return [Object.fromEntries(input.map((e) => [String(e.key ?? e.k ?? e.name), e.value ?? e.v ?? null]))];
      case 'with_entries': {
        need('object');
        const entries = Object.entries(input).map(([key, value]) => ({ key, value })).flatMap((e) => ev(a[0], e));
        return [Object.fromEntries(entries.map((e) => [String(e.key), e.value]))];
      }
      case 'type': return [typeOf(input)];
      case 'tostring': return [typeof input === 'string' ? input : JSON.stringify(input)];
      case 'tonumber': {
        if (typeof input === 'number') return [input];
        const n = Number(input);
        if (typeof input !== 'string' || Number.isNaN(n)) throw new JqError('не може да се превърне в число: ' + JSON.stringify(input));
        return [n];
      }
      case 'tojson': return [JSON.stringify(input)];
      case 'fromjson': {
        try {
          return [JSON.parse(input)];
        } catch {
          throw new JqError('невалиден JSON');
        }
      }
      case 'ascii_downcase': need('string'); return [input.toLowerCase()];
      case 'ascii_upcase': need('string'); return [input.toUpperCase()];
      case 'ltrimstr': { const s = first(a[0]); return [typeof input === 'string' && input.startsWith(s) ? input.slice(s.length) : input]; }
      case 'rtrimstr': { const s = first(a[0]); return [typeof input === 'string' && input.endsWith(s) && s ? input.slice(0, -s.length) : input]; }
      case 'startswith': need('string'); return [input.startsWith(first(a[0]))];
      case 'endswith': need('string'); return [input.endsWith(first(a[0]))];
      case 'contains': {
        const b = first(a[0]);
        const contains = (x, y) => {
          if (typeof x === 'string' && typeof y === 'string') return x.includes(y);
          if (Array.isArray(x) && Array.isArray(y)) return y.every((yy) => x.some((xx) => contains(xx, yy)));
          if (typeOf(x) === 'object' && typeOf(y) === 'object') return Object.keys(y).every((k) => k in x && contains(x[k], y[k]));
          return compareJson(x, y) === 0;
        };
        return [contains(input, b)];
      }
      case 'join': {
        need('array');
        const sep = first(a[0]);
        return [input.map((x) => (x === null ? '' : typeof x === 'string' ? x : JSON.stringify(x))).join(sep)];
      }
      case 'split': need('string'); return [input.split(first(a[0]))];
      case 'test': case 'match': {
        need('string');
        const re = new RegExp(first(a[0]), a.length > 1 ? String(first(a[1])).replace(/[^gimsuy]/g, '') : '');
        if (node.name === 'test') return [re.test(input)];
        const m = re.exec(input);
        return m ? [{ offset: m.index, length: m[0].length, string: m[0], captures: m.slice(1).map((s) => ({ string: s ?? null })) }] : [];
      }
      case 'sub': case 'gsub': {
        need('string');
        const re = new RegExp(first(a[0]), node.name === 'gsub' ? 'g' : '');
        return [input.replace(re, first(a[1]))];
      }
      case 'floor': return [Math.floor(input)];
      case 'ceil': return [Math.ceil(input)];
      case 'round': return [Math.round(input)];
      case 'sqrt': return [Math.sqrt(input)];
      case 'fabs': case 'abs': return [Math.abs(input)];
      case 'paths': {
        const out = [];
        const walk = (v, path) => {
          if (path.length) out.push(path);
          if (Array.isArray(v)) v.forEach((x, i) => walk(x, path.concat(i)));
          else if (typeOf(v) === 'object') Object.entries(v).forEach(([k, x]) => walk(x, path.concat(k)));
        };
        walk(input, []);
        return out;
      }
      case 'getpath': {
        let v = input;
        for (const k of first(a[0])) v = v === null || v === undefined ? null : v[k] ?? null;
        return [v];
      }
      case 'error': throw new JqError(a.length ? String(first(a[0])) : JSON.stringify(input));
      case 'now': return [Date.now() / 1000];
      case 'input': case 'inputs': return [];
      case 'env': case '$ENV': return [{}];
      case 'splits': need('string'); return input.split(new RegExp(first(a[0])));
      case 'indices': case 'index': case 'rindex': {
        const s = first(a[0]);
        const idx = [];
        if (typeof input === 'string') {
          for (let i = input.indexOf(s); i >= 0; i = input.indexOf(s, i + 1)) idx.push(i);
        } else if (Array.isArray(input)) {
          input.forEach((x, i) => compareJson(x, s) === 0 && idx.push(i));
        }
        if (node.name === 'index') return [idx.length ? idx[0] : null];
        if (node.name === 'rindex') return [idx.length ? idx[idx.length - 1] : null];
        return [idx];
      }
      default: throw new JqError(node.name + '/' + a.length + ' не е дефинирана');
    }
  }
}

/** Компилира и изпълнява jq филтър върху стойност; връща масив от резултати. */
export function jqRun(filter, input, vars = {}) {
  const ast = new Parser(tokenize(filter)).parse();
  return new Jq(vars).run(ast, input);
}

/** JSON с цветове като в jq: ключове в синьо, низове в зелено, null в сиво. */
export function formatJson(v, { c, compact = false, indent = 2 }) {
  const pad = (n) => (compact ? '' : '\n' + ' '.repeat(n * indent));
  const fmt = (x, d) => {
    if (x === null) return c.gray('null');
    if (typeof x === 'string') return c.green(JSON.stringify(x));
    if (typeof x === 'number' || typeof x === 'boolean') return String(x);
    if (Array.isArray(x)) {
      if (!x.length) return c.bold('[]');
      return c.bold('[') + x.map((y) => pad(d + 1) + fmt(y, d + 1)).join(c.bold(',')) + pad(d) + c.bold(']');
    }
    const keys = Object.keys(x);
    if (!keys.length) return c.bold('{}');
    return c.bold('{') + keys.map((k) => pad(d + 1) + c.boldBlue(JSON.stringify(k)) + c.bold(':') + (compact ? '' : ' ') + fmt(x[k], d + 1)).join(c.bold(',')) + pad(d) + c.bold('}');
  };
  return fmt(v, 0);
}

/** Чете една или няколко JSON стойности (JSON lines) от текст. */
export function parseJsonStream(text) {
  const t = text.trim();
  if (!t) return [];
  try {
    return [JSON.parse(t)];
  } catch {
    const out = [];
    for (const line of t.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line));
      } catch (e) {
        throw new JqError('невалиден JSON на вход: ' + e.message);
      }
    }
    return out;
  }
}

define({
  name: 'jq',
  group: 'text',
  summary: 'обработва JSON (подмножество на jq)',
  usage: "jq [-r] [-c] [-s] [-n] 'ФИЛТЪР' [ФАЙЛ]...",
  description: 'Филтри: . (входът), .ключ, .[N], .[], .[A:B], .., |, запетая, сравнения, and/or/not, //, if-then-else-end, [..], {..}, "\\(израз)", "as $x |".\nФункции: length, keys, values, has, map, select, sort, sort_by, group_by, unique, unique_by, min, max, min_by, max_by, add, any, all, first, last, limit, range, reverse, to_entries, from_entries, with_entries, type, tostring, tonumber, join, split, test, sub, gsub, startswith, endswith, ascii_downcase, floor, round, paths, @csv, @tsv, @json.',
  options: [['-r', 'низовете без кавички'], ['-c', 'компактно, по един резултат на ред'], ['-s', 'всички входове като един масив'], ['-n', 'без вход (null)'], ['-S', 'подрежда ключовете'], ['--arg ИМЕ СТОЙНОСТ', 'променлива $ИМЕ']],
  examples: [["curl api/v1/index.json | jq '.grades[] | {grade, yearsRange}'", ''], ["jq -r '.schools | keys | length' файл.json", ''], ["jq -r '.[] | [.code, .name] | @tsv'", 'таблица за cut/sort']],
  async run(ctx) {
    const args = ctx.args.slice();
    const vars = {};
    const flags = new Set();
    const rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--arg' || a === '--argjson') {
        if (i + 2 >= args.length) return ctx.fail(a + ' изисква ИМЕ и СТОЙНОСТ', 2);
        const name = args[i + 1];
        const value = args[i + 2];
        try {
          vars['$' + name] = a === '--arg' ? value : JSON.parse(value);
        } catch {
          return ctx.fail('--argjson: невалиден JSON', 2);
        }
        i += 2;
      } else if (/^-[rcsnSMCj]+$/.test(a)) {
        for (const ch of a.slice(1)) flags.add(ch);
      } else if (a === '--raw-output') flags.add('r');
      else if (a === '--compact-output') flags.add('c');
      else if (a === '--slurp') flags.add('s');
      else if (a === '--null-input') flags.add('n');
      else if (a === '--sort-keys') flags.add('S');
      else rest.push(a);
    }
    const filter = rest.length ? rest.shift() : '.';
    let ast;
    try {
      ast = new Parser(tokenize(filter)).parse();
    } catch (e) {
      if (e instanceof JqError) return ctx.fail('грешка: ' + e.message, 3);
      throw e;
    }
    let inputs = [];
    if (!flags.has('n')) {
      const texts = [];
      if (rest.length) {
        for (const f of rest) {
          try {
            texts.push(asText(await ctx.fs.readFile(ctx.resolve(f))));
          } catch (e) {
            if (!(e instanceof FsError)) throw e;
            return ctx.fail(f + ': ' + e.message, 2);
          }
        }
      } else {
        texts.push(await ctx.readAll());
      }
      try {
        for (const t of texts) inputs.push(...parseJsonStream(t));
      } catch (e) {
        if (e instanceof JqError) return ctx.fail('грешка (на вход): ' + e.message, 2);
        throw e;
      }
      if (flags.has('s')) inputs = [inputs];
    } else {
      inputs = [null];
    }
    const c = flags.has('M') ? palette(false) : flags.has('C') ? palette(true) : ctx.c;
    const sortKeys = (v) => {
      if (Array.isArray(v)) return v.map(sortKeys);
      if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
      return v;
    };
    let out = '';
    const engine = new Jq(vars);
    try {
      for (const input of inputs) {
        for (let v of engine.run(ast, input)) {
          if (flags.has('S')) v = sortKeys(v);
          if ((flags.has('r') || flags.has('j')) && typeof v === 'string') out += v;
          else out += formatJson(v, { c, compact: flags.has('c') });
          if (!flags.has('j')) out += '\n';
        }
      }
    } catch (e) {
      ctx.out(out);
      if (e instanceof JqError || e instanceof SyntaxError) return ctx.fail('грешка: ' + e.message, 5);
      throw e;
    }
    ctx.out(out);
    return 0;
  },
});
