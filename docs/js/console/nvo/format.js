// Изходът на nvo: таблици по ширината на терминала, --json/--csv/--tsv, числа, разлики и спарклайни.

import { width, padEnd, padStart, truncate } from '../ansi.js';
import { formatJson } from '../commands/jq.js';

const SPARK = '▁▂▃▄▅▆▇█';

/** Мини-тенденция от текст; null → интервал. */
export function spark(values) {
  const nums = values.filter((v) => v !== null && v !== undefined && Number.isFinite(v));
  if (!nums.length) return ' '.repeat(values.length);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return values.map((v) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return ' ';
    if (max === min) return SPARK[3];
    return SPARK[Math.round(((v - min) / (max - min)) * (SPARK.length - 1))];
  }).join('');
}

/**
 * Число с 2 знака като в страниците от Java (String.format "%.2f"): закръгляне нагоре на половинката
 * от най-краткия десетичен запис (92.615 → 92.62), не от двоичната стойност (toFixed дава 92.61).
 */
export function score(v, digits = 2) {
  if (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) return '';
  const n = Number(v);
  const s = String(Math.abs(n));
  if (s.includes('e')) return n.toFixed(digits);
  const [int, frac = ''] = s.split('.');
  let scaled = BigInt(int + frac.slice(0, digits).padEnd(digits, '0'));
  if ((frac[digits] || '0') >= '5') scaled += 1n;
  const t = scaled.toString().padStart(digits + 1, '0');
  const out = t.slice(0, t.length - digits) + (digits ? '.' + t.slice(-digits) : '');
  return (n < 0 && scaled !== 0n ? '-' : '') + out;
}

/** +1.23 / -0.50 (оцветено в терминала). */
export function delta(v, c, digits = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '';
  const s = (v > 0 ? '+' : '') + v.toFixed(digits);
  if (!c) return s;
  return v > 0 ? c.green(s) : v < 0 ? c.red(s) : s;
}

export function outputMode(opts) {
  if (opts.json) return 'json';
  if (opts.csv) return 'csv';
  if (opts.tsv) return 'tsv';
  return 'table';
}

export function printJson(ctx, data) {
  ctx.out(formatJson(data, { c: ctx.c }) + '\n');
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function tsvCell(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\t\n\r]/g, ' ');
}

/**
 * Таблица. columns: [{ key, label, align ('left'|'right'), get(row) → сурова стойност,
 *   text?(value, row) → текст, color?(text, row) → оцветен текст, flex? (името - съкращава се),
 *   drop? (по-голямото число се скрива първо на тесен екран) }]
 * В терминала: заглавие, цветове, съобразяване с ширината ($COLUMNS) и бележка за скритите колони.
 * В pipe: само заглавният ред и редовете, без цветове и съкращения. --json/--csv/--tsv - данни.
 */
export function renderTable(ctx, { columns, rows, title = '', notes = [], mode = 'table', json = null, wide = false }) {
  if (mode === 'json') {
    printJson(ctx, json ? json(rows) : rows.map((r) => Object.fromEntries(columns.map((col) => [col.key, col.get(r)]))));
    return;
  }
  if (mode === 'csv' || mode === 'tsv') {
    const cell = mode === 'csv' ? csvCell : tsvCell;
    const sep = mode === 'csv' ? ',' : '\t';
    const lines = [columns.map((col) => cell(col.label)).join(sep)];
    for (const r of rows) lines.push(columns.map((col) => cell(col.get(r))).join(sep));
    ctx.out(lines.join(mode === 'csv' ? '\r\n' : '\n') + (mode === 'csv' ? '\r\n' : '\n'));
    return;
  }
  const c = ctx.c;
  let cols = columns.slice();
  const textOf = (col, r) => {
    const v = col.get(r);
    return col.text ? col.text(v, r) : v === null || v === undefined ? '' : String(v);
  };
  const cells = rows.map((r) => cols.map((col) => textOf(col, r)));
  let widths = cols.map((col, k) => Math.max(width(col.label), ...cells.map((row) => width(row[k]))));
  const hidden = [];
  if (ctx.isTTY && !wide) {
    const total = () => widths.reduce((a, b) => a + b, 0) + 2 * (widths.length - 1);
    const flexIdx = cols.findIndex((col) => col.flex);
    const minFlex = flexIdx >= 0 ? Math.min(widths[flexIdx], Math.max(14, width(cols[flexIdx].label))) : 0;
    // Първо се съкращава името (до 28 знака), после се скриват колони, накрая името до минимума.
    if (flexIdx >= 0 && total() > ctx.cols) widths[flexIdx] = Math.max(Math.min(widths[flexIdx], 28), widths[flexIdx] - (total() - ctx.cols));
    while (total() > ctx.cols) {
      let pick = -1;
      cols.forEach((col, k) => {
        if (col.drop && (pick < 0 || col.drop > cols[pick].drop)) pick = k;
      });
      if (pick < 0) break;
      hidden.push(cols[pick].label);
      cols.splice(pick, 1);
      widths.splice(pick, 1);
      cells.forEach((row) => row.splice(pick, 1));
    }
    const fi = cols.findIndex((col) => col.flex);
    if (fi >= 0 && total() > ctx.cols) widths[fi] = Math.max(minFlex, widths[fi] - (total() - ctx.cols));
  }
  const fit = (s, k) => {
    const w = widths[k];
    if (width(s) <= w) return s;
    return truncate(s.replace(/\x1b\[[0-9;]*m/g, ''), w);
  };
  const align = (s, k, last) => (cols[k].align === 'right' ? padStart(s, widths[k]) : last ? s : padEnd(s, widths[k]));
  let out = '';
  if (ctx.isTTY && title) out += c.bold(title) + '\n';
  out += cols.map((col, k) => c.bold(align(col.label, k, k === cols.length - 1))).join('  ').replace(/\s+$/, '') + '\n';
  rows.forEach((r, i) => {
    out += cols.map((col, k) => {
      let s = fit(cells[i][k], k);
      if (col.color && c.on) s = col.color(s, r);
      return align(s, k, k === cols.length - 1);
    }).join('  ').replace(/\s+$/, '') + '\n';
  });
  if (ctx.isTTY) {
    const all = notes.slice();
    if (hidden.length) all.push('Скрити заради ширината: ' + hidden.join(', ') + ' (-w показва всички колони)');
    if (all.length) out += all.map((n) => c.muted(n)).join('\n') + '\n';
  }
  ctx.out(out);
}

/** Двойки "етикет: стойност", подравнени (за профила на училище). */
export function keyValues(ctx, pairs, indent = '  ') {
  const w = Math.max(...pairs.map(([k]) => width(k)));
  return pairs.map(([k, v]) => indent + ctx.c.muted(padEnd(k, w)) + '  ' + v).join('\n') + '\n';
}
