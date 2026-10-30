// Експорт на баловете (CSV, PDF) от документите в api/v1/balove/ - един код за един град
// ({град}.json) и за всички (data.json), затова CSV, JSON и PDF са винаги от едни и същи данни.
// Дупките: година без данни за града я няма в doc.years; coverage.{год}.rankings казва кои
// класирания имат данни; null за класиране = няма данни; полът е null, когато липсва.
import { MAX_YEARS } from './config.js';
import { ensurePdfLibs, newDoc, addPageFooters, PDF_FONT, PDF_MARGIN } from './pdf.js';
import { download } from '../ui/dom.js';
import { menuButtonOf } from '../ui/export-menu.js';
import { schoolType, typeKeyFromApi } from './school-types.js';

const RANKS = ['1-во', '2-ро', '3-то', '4-то'];

// Без статичен import на site.js (той закача менюто и търсенето още при зареждане), за да може
// модулът да се ползва и от страници без общата шапка; toast се зарежда при нужда.
const SITE_ROOT = new URL('../../', import.meta.url);
const siteUrl = (path) => new URL(path, SITE_ROOT).toString();

/** Видът (financing) или null - някои кодове от РУО ги няма в регистъра на МОН. */
const typeOf = (s) => {
  const k = typeKeyFromApi(s.financing, s.isPrivate);
  return k ? schoolType(k) : null;
};
const CSV_HEADER = ['Град', 'Код училище', 'Училище', 'Тип', 'Код паралелка', 'Паралелка', 'Година', 'Класиране',
  'Мин', 'Мин М', 'Мин Ж', 'Макс', 'Макс М', 'Макс Ж'];

async function fetchJson(path) {
  const r = await fetch(siteUrl(path));
  if (!r.ok) {
    throw new Error('HTTP ' + r.status + ' for ' + path);
  }
  return r.json();
}

/** Документът за един град: {city, years, coverage, schools}. */
export function fetchBaloveCity(slug) {
  return fetchJson('api/v1/balove/' + slug + '.json');
}

/** Списъкът на градовете и общите години: {years, cities: [{slug, name, years, …}]}. */
export function fetchBaloveIndex() {
  return fetchJson('api/v1/balove/index.json');
}

/** Всички градове: {years, cities: [документ за град…]}. */
export function fetchBaloveAll() {
  return fetchJson('api/v1/balove/data.json');
}

function csvCell(v) {
  if (v === null || v === undefined) {
    return '';
  }
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** CSV: ред за всяко класиране (град × училище × паралелка × година × класиране). */
export function baloveCsv(docs) {
  const lines = [CSV_HEADER.join(',')];
  docs.forEach((doc) => doc.schools.forEach((s) => s.profiles.forEach((p) => doc.years.forEach((y) => {
    const ranks = p.years[y];
    if (!ranks) {
      return;
    }
    ranks.forEach((e, k) => {
      if (!e) {
        return;
      }
      lines.push([doc.city.name, s.code, s.fullName, typeOf(s) ? typeOf(s).letter : '', p.code, p.name, y, k + 1,
        e.min, e.minMale, e.minFemale, e.max, e.maxMale, e.maxFemale].map(csvCell).join(','));
    });
  }))));
  return lines.join('\r\n') + '\r\n';
}

const num = (v) => (v === null || v === undefined ? '-' : v.toFixed(2));

/**
 * Раздел за един град: заглавие, таблицата "Налични данни" (годините от общия прозорец -
 * и тези без данни за града) и таблицата паралелка × година × класиране.
 */
function addCity(doc, cityDoc, allYears) {
  const shown = (allYears && allYears.length ? allYears : cityDoc.years).slice(-MAX_YEARS);
  const years = cityDoc.years.filter((y) => shown.includes(y));
  const span = shown.length > 1 ? shown[0] + '-' + shown[shown.length - 1] : String(shown[0]);
  doc.setFontSize(14);
  doc.text('Балове след 7 клас - ' + cityDoc.city.name, PDF_MARGIN, 34);
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  doc.text('Минимален и максимален бал на приетите по паралелки и класирания · ' + span
    + ' · източник: РУО · разбивката по пол е в CSV и JSON', PDF_MARGIN, 50);
  doc.setTextColor(0);

  // Налични данни: кои класирания имат данни за всяка година и има ли разбивка по пол.
  doc.autoTable({
    head: [['Налични данни', ...RANKS.map((r) => r + ' класиране'), 'Разбивка по пол']],
    body: shown.map((y) => {
      const c = cityDoc.coverage[y];
      return c
        ? [String(y), ...[1, 2, 3, 4].map((k) => (c.rankings.includes(k) ? 'да' : '-')), c.gender ? 'да' : 'не']
        : [String(y), { content: 'няма данни за годината', colSpan: 5, styles: { textColor: 120 } }];
    }),
    startY: 60,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    tableWidth: 'wrap',
    theme: 'grid',
    styles: { font: PDF_FONT, fontSize: 8, cellPadding: 3, halign: 'center' },
    headStyles: { font: PDF_FONT, fillColor: [230, 230, 230], textColor: 20 }
  });

  const head = [
    [{ content: 'Паралелка', rowSpan: 2 }, { content: 'Година', rowSpan: 2 },
      ...RANKS.map((r) => ({ content: r + ' класиране', colSpan: 2 }))],
    RANKS.flatMap(() => ['мин', 'макс'])
  ];
  const body = [];
  cityDoc.schools.forEach((s) => {
    const rows = [];
    s.profiles.forEach((p) => {
      let first = true;
      years.forEach((y) => {
        const ranks = p.years[y];
        if (!ranks) {
          return;
        }
        rows.push([first ? p.name : '', String(y), ...ranks.flatMap((e) => (e ? [num(e.min), num(e.max)] : ['-', '-']))]);
        first = false;
      });
    });
    if (rows.length) {
      body.push([{ content: s.fullName + (typeOf(s) ? ' (' + typeOf(s).lower + ')' : ''), colSpan: 10,
        styles: { fillColor: [238, 241, 250], textColor: 20, halign: 'left' } }]);
      body.push(...rows);
    }
  });
  doc.autoTable({
    head,
    body,
    startY: doc.lastAutoTable.finalY + 14,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    theme: 'grid',
    styles: { font: PDF_FONT, fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { font: PDF_FONT, fillColor: [230, 230, 230], textColor: 20, halign: 'center' },
    columnStyles: Object.assign({ 0: { cellWidth: 'auto' }, 1: { cellWidth: 36, halign: 'center' } },
      Object.fromEntries([2, 3, 4, 5, 6, 7, 8, 9].map((i) => [i, { cellWidth: 50, halign: 'right' }])))
  });
}

/** PDF за един или за всички градове (всеки град от нова страница, с отметка). */
export async function balovePdf(docs, filename, allYears) {
  const ns = await ensurePdfLibs();
  const doc = await newDoc(ns, 'landscape');
  for (let i = 0; i < docs.length; i++) {
    if (i > 0) {
      doc.addPage();
    }
    if (docs.length > 1) {
      doc.outline.add(null, docs[i].city.name, { pageNumber: doc.internal.getNumberOfPages() });
    }
    addCity(doc, docs[i], allYears);
    await new Promise((r) => setTimeout(r, 0)); // страницата да не замръзва
  }
  addPageFooters(doc);
  doc.save(filename);
}

/**
 * Действие от менюто "Изтегли ▾" на страниците за балове: balove-csv | balove-pdf (градът
 * е slug) и balove-csv-all | balove-pdf-all (хъбът). JSON е статичен файл (линк с download).
 */
export async function runBaloveExport(item, slug) {
  const { toast } = await import('../site.js');
  const action = item.dataset.action;
  const all = action.endsWith('-all');
  const btn = menuButtonOf(item);
  btn.classList.add('is-busy');
  btn.setAttribute('aria-busy', 'true');
  try {
    if (action.startsWith('balove-pdf')) {
      toast(all ? 'Подготвя се PDF за всички градове - до минута…' : 'Подготвя се PDF…');
    }
    const [index, data] = await Promise.all([fetchBaloveIndex(), all ? fetchBaloveAll() : fetchBaloveCity(slug)]);
    const docs = all ? data.cities : [data];
    const name = 'balove-7-' + (all ? 'all' : slug);
    if (action.startsWith('balove-csv')) {
      download(name + '.csv', baloveCsv(docs));
    } else {
      await balovePdf(docs, name + '.pdf', index.years);
    }
  } catch (err) {
    console.error(err);
    toast('Грешка при изтеглянето. Опитай отново.');
  } finally {
    btn.classList.remove('is-busy');
    btn.removeAttribute('aria-busy');
  }
}
