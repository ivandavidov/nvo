// ANSI помощници на конзолата: цветове (само когато изходът е терминал), ширина на текст,
// подравняване и колони. Командите пишат обикновен текст с SGR последователности; term.js ги рисува.

export const ESC = '\x1b';

const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;

export function sgr(...codes) {
  return ESC + '[' + codes.join(';') + 'm';
}

/** Премахва всички ANSI последователности (цветове, линкове). */
export function strip(text) {
  return String(text).replace(ANSI_RE, '');
}

/** Видимата ширина в знаци (кирилицата и латиницата са по един знак в моноширинния шрифт). */
export function width(text) {
  return Array.from(strip(text)).length;
}

export function padEnd(text, n) {
  const w = width(text);
  return w >= n ? text : text + ' '.repeat(n - w);
}

export function padStart(text, n) {
  const w = width(text);
  return w >= n ? text : ' '.repeat(n - w) + text;
}

/** Съкращава обикновен текст (без ANSI) до n знака с "…" накрая. */
export function truncate(text, n) {
  const chars = Array.from(String(text));
  if (n <= 0) return '';
  return chars.length <= n ? String(text) : chars.slice(0, Math.max(0, n - 1)).join('') + '…';
}

/**
 * Палитра: функции, които оцветяват само когато `on` е true (изходът е терминал и няма NO_COLOR).
 * Семантичните имена (dir, exec, match, …) държат един и същ вид навсякъде.
 */
export function palette(on) {
  const wrap = (...codes) => (s) => (on ? sgr(...codes) + s + sgr(0) : String(s));
  return {
    on,
    bold: wrap(1),
    dim: wrap(2),
    italic: wrap(3),
    underline: wrap(4),
    inverse: wrap(7),
    red: wrap(31),
    green: wrap(32),
    yellow: wrap(33),
    blue: wrap(34),
    magenta: wrap(35),
    cyan: wrap(36),
    gray: wrap(90),
    boldRed: wrap(1, 31),
    boldGreen: wrap(1, 32),
    boldYellow: wrap(1, 33),
    boldBlue: wrap(1, 34),
    boldMagenta: wrap(1, 35),
    boldCyan: wrap(1, 36),
    dir: wrap(1, 34),
    exec: wrap(1, 32),
    special: wrap(1, 33),
    match: wrap(1, 31),
    head: wrap(1),
    muted: wrap(90),
    error: wrap(31),
    ok: wrap(32),
    warn: wrap(33),
    /** OSC 8 линк - кликаем в терминала, обикновен текст в pipe. */
    link: (url, text = url) => (on ? ESC + ']8;;' + url + ESC + '\\' + text + ESC + ']8;;' + ESC + '\\' : String(text)),
  };
}

/**
 * Подрежда имена в колони като `ls` (запълва колоните отгоре надолу).
 * items: [{text, plain}] - text е оцветеният вариант, plain - за ширината.
 */
export function columns(items, cols) {
  if (!items.length) return '';
  const widths = items.map((it) => Array.from(it.plain).length);
  const max = Math.max(...widths) + 2;
  const perRow = Math.max(1, Math.floor((cols + 2) / max));
  const rows = Math.ceil(items.length / perRow);
  // Тесните колони - по ширината на най-дългото име в колоната (както GNU ls).
  const colCount = Math.ceil(items.length / rows);
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let w = 0;
    for (let r = 0; r < rows; r++) {
      const i = c * rows + r;
      if (i < items.length) w = Math.max(w, widths[i]);
    }
    colWidths.push(w + 2);
  }
  const total = colWidths.reduce((a, b) => a + b, 0) - 2;
  if (total > cols && perRow > 1) {
    // Ако по-тесните колони все пак не се събират - по едно на ред.
    return items.map((it) => it.text).join('\n') + '\n';
  }
  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < colCount; c++) {
      const i = c * rows + r;
      if (i >= items.length) continue;
      const last = c === colCount - 1 || (c + 1) * rows + r >= items.length;
      line += last ? items[i].text : items[i].text + ' '.repeat(colWidths[c] - widths[i]);
    }
    lines.push(line);
  }
  return lines.join('\n') + '\n';
}
