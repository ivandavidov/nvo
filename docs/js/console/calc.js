// Безопасен калкулатор на изрази (без eval) - за $(( )) в shell и за bc.
// mode 'shell': цели числа, ^ е XOR, ** е степен. mode 'bc': дробни числа, ^ е степен, функции на bc -l.

const BINARY = {
  '||': [1, (a, b) => (a || b ? 1 : 0)],
  '&&': [2, (a, b) => (a && b ? 1 : 0)],
  '|': [3, (a, b) => a | b],
  'xor': [4, (a, b) => a ^ b],
  '&': [5, (a, b) => a & b],
  '==': [6, (a, b) => (a === b ? 1 : 0)],
  '!=': [6, (a, b) => (a !== b ? 1 : 0)],
  '<': [7, (a, b) => (a < b ? 1 : 0)],
  '<=': [7, (a, b) => (a <= b ? 1 : 0)],
  '>': [7, (a, b) => (a > b ? 1 : 0)],
  '>=': [7, (a, b) => (a >= b ? 1 : 0)],
  '<<': [8, (a, b) => a << b],
  '>>': [8, (a, b) => a >> b],
  '+': [9, (a, b) => a + b],
  '-': [9, (a, b) => a - b],
  '*': [10, (a, b) => a * b],
  '/': [10, null],
  '%': [10, null],
  '**': [11, (a, b) => a ** b],
};

const FUNCS = {
  sqrt: Math.sqrt,
  s: Math.sin,
  c: Math.cos,
  a: Math.atan,
  l: Math.log,
  e: Math.exp,
  abs: Math.abs,
  length: (x) => String(Math.trunc(Math.abs(x))).length,
};

export class CalcError extends Error {}

function tokenize(src, mode) {
  const out = [];
  const re = /\s*(?:(\d+(?:\.\d*)?|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(\*\*|<<|>>|<=|>=|==|!=|&&|\|\||[-+*/%^()<>!&|~?:,]))/y;
  let i = 0;
  src = String(src);
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) throw new CalcError('синтактична грешка в израза (неочакван знак "' + src.slice(i).trim()[0] + '")');
    i = re.lastIndex;
    if (m[1] !== undefined) out.push({ t: 'num', v: Number(m[1]) });
    else if (m[2] !== undefined) out.push({ t: 'id', v: m[2] });
    else {
      let op = m[3];
      if (op === '^') op = mode === 'bc' ? '**' : 'xor';
      out.push({ t: 'op', v: op });
    }
  }
  return out;
}

export function evaluate(src, { vars = {}, mode = 'shell', scale = 0 } = {}) {
  const tokens = tokenize(src, mode);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (v) => {
    const t = next();
    if (!t || t.v !== v) throw new CalcError('синтактична грешка в израза (очаква се "' + v + '")');
  };
  const intMode = mode === 'shell';
  const fix = (x) => (intMode ? Math.trunc(x) : x);

  function primary() {
    const t = next();
    if (!t) throw new CalcError('синтактична грешка в израза (очаква се операнд)');
    if (t.t === 'num') return t.v;
    if (t.t === 'id') {
      if (peek() && peek().v === '(' && mode === 'bc') {
        next();
        const arg = ternary();
        expect(')');
        const fn = FUNCS[t.v];
        if (!fn) throw new CalcError('непозната функция "' + t.v + '"');
        return fn(arg);
      }
      const raw = vars[t.v];
      if (raw === undefined || raw === '') return 0;
      const n = Number(raw);
      if (Number.isNaN(n)) throw new CalcError(t.v + ': стойността не е число');
      return n;
    }
    if (t.v === '(') {
      const v = ternary();
      expect(')');
      return v;
    }
    if (t.v === '-') return -unary();
    if (t.v === '+') return unary();
    if (t.v === '!') return unary() ? 0 : 1;
    if (t.v === '~') return ~unary();
    throw new CalcError('синтактична грешка в израза (неочакван "' + t.v + '")');
  }

  function unary() {
    return primary();
  }

  function binary(minPrec) {
    let left = unary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || !BINARY[t.v]) break;
      const [prec, fn] = BINARY[t.v];
      if (prec < minPrec) break;
      next();
      const right = t.v === '**' ? binary(prec) : binary(prec + 1);
      if (t.v === '/' || t.v === '%') {
        if (right === 0) throw new CalcError('деление на нула');
        // bc със scale=0 (по подразбиране) дели цели числа като shell.
        left = t.v === '/' ? (intMode || scale === 0 ? Math.trunc(left / right) : left / right) : left % right;
      } else {
        left = fn(left, right);
      }
      left = fix(left);
    }
    return left;
  }

  function ternary() {
    const cond = binary(1);
    if (peek() && peek().v === '?') {
      next();
      const a = ternary();
      expect(':');
      const b = ternary();
      return cond ? a : b;
    }
    return cond;
  }

  if (!tokens.length) return 0;
  const value = ternary();
  if (pos < tokens.length) throw new CalcError('синтактична грешка в израза (неочакван "' + tokens[pos].v + '")');
  if (mode === 'bc' && scale >= 0 && !Number.isInteger(value)) {
    return Number(value.toFixed(scale));
  }
  return value;
}

/** Число във вида на bc (без излишни нули, точка за десетичен знак). */
export function formatNumber(value, scale = 0) {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value)) return String(value);
  const s = scale > 0 ? value.toFixed(scale) : String(Math.trunc(value));
  return s.replace(/^(-?)0\./, '$1.');
}
