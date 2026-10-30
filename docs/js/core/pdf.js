// PDF на класацията на град (и на всички градове) + общите части на PDF-ите (jsPDF, шрифт, долен колонтитул).
// jsPDF и AutoTable се зареждат едва при първото генериране (по-лека страница).
// Брошурата за училище е в brochure.js.
import { formatRankValue, rankFor, renderableCities, cityRanking, sortRanking } from './model.js';
import { noExamSource } from './config.js';
import { SCHOOL_TYPES, schoolType, joinTypes } from './school-types.js';

const FONT_FILE = 'NotoSans-Regular.ttf';
const FONT_NAME = 'NotoSans';
const PAGE_MARGIN_PT = 30;
const TITLE_Y_PT = 28;
const TABLE_START_Y_PT = 40;

const ASSETS = new URL('../../', import.meta.url); // коренът на сайта
const scripts = {};
const files = {};

export function loadScript(path) {
  if (!scripts[path]) {
    scripts[path] = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = new URL(path, ASSETS).toString();
      el.onload = resolve;
      el.onerror = () => {
        delete scripts[path];
        reject(new Error('Failed to load ' + path));
      };
      document.head.appendChild(el);
    });
  }
  return scripts[path];
}

export async function ensurePdfLibs() {
  await loadScript('js/jspdf.umd.min.js');
  await loadScript('js/jspdf.plugin.autotable.min.js');
  const ns = window.jspdf;
  if (!ns || !ns.jsPDF || !ns.jsPDF.API || typeof ns.jsPDF.API.autoTable !== 'function') {
    throw new Error('jsPDF is not available');
  }
  return ns;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return window.btoa(binary);
}

/** Файл от сайта (шрифт) като base64 - веднъж за страницата. */
export function fetchBase64(path) {
  if (!files[path]) {
    files[path] = fetch(new URL(path, ASSETS).toString()).then((r) => {
      if (!r.ok) {
        throw new Error('Download failed: ' + path + ' ' + r.status);
      }
      return r.arrayBuffer();
    }).then(toBase64).catch((e) => {
      delete files[path];
      throw e;
    });
  }
  return files[path];
}

export async function newDoc(ns, orientation) {
  const doc = new ns.jsPDF({ orientation, unit: 'pt', format: 'a4', compress: true });
  doc.addFileToVFS(FONT_FILE, await fetchBase64('fonts/' + FONT_FILE));
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  doc.setFont(FONT_NAME, 'normal');
  return doc;
}

/** Адресът на сайта и "стр. / общо" в долния край на всяка страница. */
export function addPageFooters(doc, margin = PAGE_MARGIN_PT) {
  const pageW = doc.internal.pageSize.getWidth();
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('ivandavidov.github.io/nvo', pageW / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    doc.text(p + ' / ' + pages, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
    doc.setTextColor(0);
  }
}

/** Шрифтът и отстъпите на таблиците в PDF-ите (за модула на баловете). */
export const PDF_FONT = FONT_NAME;
export const PDF_MARGIN = PAGE_MARGIN_PT;

/** Колоните на класацията (същите заглавия като в таблицата на сайта). */
export function rankingHeaders(model) {
  const { cfg, firstYear, totalYears } = model;
  const headers = ['№', 'Училище', 'Ранг', 'Тип / №'];
  for (let k = 0; k < 3; k++) {
    const yy = firstYear - 2001 + totalYears - k;
    const mark = noExamSource(model.grade, 2000 + yy) ? '*' : '';
    headers.push(yy + mark + ' ' + cfg.csvHeaderB + ' / уч.');
    headers.push(yy + mark + ' ' + cfg.csvHeaderM + ' / уч.');
  }
  return headers;
}

/** Бележка за година без изпит сред колоните (исторически изглед) - в данните повтаря съседна година. */
function noExamNote(model) {
  const { cfg, firstYear, totalYears } = model;
  const notes = [];
  for (let k = 2; k >= 0; k--) {
    const year = firstYear - 1 + totalYears - k;
    const source = noExamSource(model.grade, year);
    if (source) {
      notes.push('* ' + year + ' г.: ' + cfg.tableTitleType + ' не е провеждано - в колоните за ' + year
        + ' са повторени резултатите от ' + source + ' г.');
    }
  }
  return notes.join(' ');
}

/** Текстът на клетките за един ред (както се вижда в таблицата). */
export function rankingCells(model, row, position) {
  const { s } = model;
  const o = s[row.i];
  const cells = [String(position), o.l, formatRankValue(rankFor(row)), schoolType(row.type).letter + ' / ' + row.typeNo];
  row.years.forEach((y) => {
    cells.push(y.b ? y.b + ' / ' + y.bu : '');
    cells.push(y.m ? y.m + ' / ' + y.mu : '');
  });
  return cells;
}

/** Заглавието (с показаните видове) и таблицата на класацията на един град, от текущата страница на doc. */
function addRankingTable(doc, model, city, rows, types) {
  const { cfg } = model;
  doc.setFontSize(12);
  doc.text(cfg.tableTitleName + ' - ' + city.name + (types ? ' - ' + joinTypes(types) + ' училища' : '') + ' - ' + cfg.tableTitleType,
    PAGE_MARGIN_PT, TITLE_Y_PT);
  // Легендата на колоната "Тип / №" - вдясно на заглавието.
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Тип: ' + SCHOOL_TYPES.map((t) => t.letter + ' - ' + t.lower).join(', '), doc.internal.pageSize.getWidth() - PAGE_MARGIN_PT, TITLE_Y_PT, { align: 'right' });
  const note = noExamNote(model);
  if (note) {
    doc.text(note, PAGE_MARGIN_PT, TITLE_Y_PT + 12);
  }
  doc.setTextColor(0);
  doc.autoTable({
    head: [rankingHeaders(model)],
    body: rows.map((row, k) => rankingCells(model, row, k + 1)),
    startY: TABLE_START_Y_PT + (note ? 12 : 0),
    margin: { left: PAGE_MARGIN_PT, right: PAGE_MARGIN_PT },
    theme: 'grid',
    styles: { font: FONT_NAME, fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { font: FONT_NAME, fillColor: [230, 230, 230], textColor: 20 }
  });
}

/** PDF на класацията на град - видимите редове в текущата подредба и с показаните видове (null = всички). */
export async function rankingPdf(model, city, rows, types) {
  const ns = await ensurePdfLibs();
  if (!rows.length) {
    return;
  }
  const doc = await newDoc(ns, 'landscape');
  addRankingTable(doc, model, city, rows, types);
  doc.save(model.cfg.exportPrefix + '-ranking-' + city.slug + '.pdf');
}

/**
 * PDF с класациите на всички градове: раздел (от нова страница, с отметка в съдържанието)
 * на град в реда на чиповете, всеки като PDF-а за един град в изгледа по подразбиране.
 */
export async function allRankingsPdf(model) {
  const ns = await ensurePdfLibs();
  const doc = await newDoc(ns, 'landscape');
  let first = true;
  for (const city of renderableCities(model)) {
    // като таблицата на сайта по подразбиране (колона "Ранг" низходящо, всички видове)
    const rows = sortRanking(model, cityRanking(model, city), 'rank', 'desc', null);
    if (!rows.length) {
      continue;
    }
    if (!first) {
      doc.addPage();
    }
    first = false;
    doc.outline.add(null, city.name, { pageNumber: doc.internal.getNumberOfPages() });
    addRankingTable(doc, model, city, rows, null);
    await new Promise((r) => setTimeout(r, 0)); // страницата да не замръзва
  }
  addPageFooters(doc);
  doc.save(model.cfg.exportPrefix + '-ranking-all.pdf');
}
