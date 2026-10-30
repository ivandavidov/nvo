// Общи помощници на командите: дати и размери във вида на bg_BG локала, четене на файлове.

import { isBinary } from '../vfs.js';

/** Коренът на сайта (docs/) - конзолата е в docs/console/, модулите - в docs/js/console/commands/. */
export const SITE_ROOT = new URL('../../../', import.meta.url);

export function siteUrl(path) {
  return new URL(String(path).replace(/^\/+/, ''), SITE_ROOT).toString();
}

export const MONTHS_SHORT = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
export const MONTHS = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
export const DAYS_SHORT = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export const DAYS = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];

export const pad2 = (n) => String(n).padStart(2, '0');

/** Часовата зона като EET/EEST за България, иначе UTC+N. */
export function tzName(d = new Date()) {
  const off = -d.getTimezoneOffset();
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    tz = '';
  }
  if (tz === 'Europe/Sofia') return off === 180 ? 'EEST' : 'EET';
  if (off === 0) return 'UTC';
  const h = Math.floor(Math.abs(off) / 60);
  const m = Math.abs(off) % 60;
  return 'UTC' + (off < 0 ? '-' : '+') + h + (m ? ':' + pad2(m) : '');
}

export function tzOffset(d = new Date()) {
  const off = -d.getTimezoneOffset();
  return (off < 0 ? '-' : '+') + pad2(Math.floor(Math.abs(off) / 60)) + pad2(Math.abs(off) % 60);
}

/** "пт 31 окт 2026 14:03:12 EET" - видът на date в bg_BG. */
export function dateLong(d = new Date()) {
  return DAYS_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
    pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) + ' ' + tzName(d);
}

/** Датата в ls -l: "31 окт 14:03" (до половин година) или "31 окт  2025". */
export function dateLs(ms) {
  const d = new Date(ms);
  const recent = Math.abs(Date.now() - ms) < 182 * 24 * 3600 * 1000;
  const day = String(d.getDate()).padStart(2);
  return day + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + (recent ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : ' ' + d.getFullYear());
}

export function dateIso(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

/** 1536 → "1,5K" (като ls -h в bg_BG: десетична запетая). */
export function humanSize(n) {
  const units = ['K', 'M', 'G', 'T'];
  if (n < 1024) return String(n);
  let v = n;
  let u = -1;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  if (v < 10) return (Math.ceil(v * 10) / 10).toFixed(1).replace('.', ',') + units[u];
  return Math.ceil(v) + units[u];
}

const decoder = new TextDecoder();

export function asText(content) {
  return isBinary(content) ? decoder.decode(content) : String(content);
}

/** Разделя текст на редове без последния празен (след крайния \n). */
export function splitLines(text) {
  const lines = String(text).split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export function joinLines(lines) {
  return lines.length ? lines.join('\n') + '\n' : '';
}

/** Число от аргумент или UsageError-подобно съобщение. */
export function toInt(value, what) {
  const n = Number(value);
  if (!Number.isInteger(n)) throw new Error("невалиден брой " + what + ": '" + value + "'");
  return n;
}

/** Обработва \n, \t, \e, \\, \xHH, \0NNN (echo -e, printf). */
export function unescapeC(s) {
  return s.replace(/\\(x[0-9a-fA-F]{1,2}|0[0-7]{0,3}|[0-7]{1,3}|u[0-9a-fA-F]{4}|.)/g, (m, e) => {
    switch (e[0]) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case 'e': case 'E': return '\x1b';
      case 'a': return '\x07';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'v': return '\v';
      case '\\': return '\\';
      case 'x': return String.fromCharCode(parseInt(e.slice(1), 16));
      case 'u': return String.fromCharCode(parseInt(e.slice(1), 16));
      case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7':
        return String.fromCharCode(parseInt(e.replace(/^0/, '') || '0', 8));
      default: return m;
    }
  });
}
