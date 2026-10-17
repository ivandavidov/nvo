// PDF доклад за училище и PDF на класацията на град — съдържанието е като в
// стария logic-pdf.js. jsPDF, AutoTable и Highcharts exporting се зареждат
// едва при първото генериране (по-лека страница).
import { findCityForSchool, nationalAverages, formatRankValue, rankFor } from './model.js';

const FONT_FILE = 'NotoSans-Regular.ttf';
const FONT_NAME = 'NotoSans';
const PAGE_MARGIN_PT = 30;
const TITLE_Y_PT = 28;
const TABLE_START_Y_PT = 40;

const ASSETS = new URL('../../', import.meta.url); // коренът на сайта
const scripts = {};
let fontPromise = null;

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
  if (!window.Highcharts) {
    await loadScript('js/highcharts.js');
  }
  await loadScript('js/exporting.js');
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

function fontBase64() {
  if (!fontPromise) {
    const url = new URL('fonts/' + FONT_FILE, ASSETS).toString();
    fontPromise = fetch(url).then((r) => {
      if (!r.ok) {
        throw new Error('Font download failed: ' + r.status);
      }
      return r.arrayBuffer();
    }).then(toBase64).catch((e) => {
      fontPromise = null;
      throw e;
    });
  }
  return fontPromise;
}

async function newDoc(ns, orientation) {
  const doc = new ns.jsPDF({ orientation, unit: 'pt', format: 'a4' });
  doc.addFileToVFS(FONT_FILE, await fontBase64());
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  doc.setFont(FONT_NAME, 'normal');
  return doc;
}

function renderChartToImage(container, config) {
  return new Promise((resolve) => {
    const chart = window.Highcharts.chart(container, config);
    const svg = chart.getSVG({ chart: { width: 520, height: 260 } });
    chart.destroy();
    const canvas = document.createElement('canvas');
    canvas.width = 1040;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1040, 520);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
  });
}

function schoolRankInCity(model, index, cityName) {
  const { s, si } = model;
  const c = si[cityName];
  if (!c || !c.n) {
    return { rank: null, total: 0 };
  }
  const list = [];
  const add = (range) => {
    if (!range) {
      return;
    }
    for (let i = range[0]; i <= range[1]; i++) {
      if (s[i] && (s[i].mb || s[i].mm)) {
        list.push(i);
      }
    }
  };
  add(c.n);
  add(c.p);
  list.sort((a, b) => (s[b].mb + s[b].mm) / 2 - (s[a].mb + s[a].mm) / 2);
  const rank = list.indexOf(index);
  return { rank: rank >= 0 ? rank + 1 : null, total: list.length };
}

/** PDF доклад за едно училище (2 страници: статистики и графики). */
export async function schoolReportPdf(model, index) {
  const ns = await ensurePdfLibs();
  const { s, si, cfg, firstYear } = model;
  const school = s[index];
  if (!school) {
    return;
  }
  const cityInfo = findCityForSchool(model, index);
  const cityName = cityInfo ? cityInfo.cityName : '';
  const schoolType = cityInfo ? (cityInfo.isPrivate ? 'Частно' : 'Държавно') : '';
  const totalYears = school.b.length;
  const doc = await newDoc(ns, 'portrait');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const H = { bel: cfg.csvHeaderBel, mat: cfg.csvHeaderMat, b: cfg.csvHeaderB, m: cfg.csvHeaderM };

  doc.setFontSize(18);
  doc.text(school.n, pageW / 2, 45, { align: 'center' });
  doc.setFontSize(12);
  doc.text(cfg.tableTitleType + '  |  ' + cityName + '  |  ' + schoolType, pageW / 2, 70, { align: 'center' });

  const rankInfo = schoolRankInCity(model, index, cityName);
  const nat = nationalAverages(model);
  const city = si[cityName];
  const cityAvgB = cityInfo && !cityInfo.isPrivate && city.mnbs ? city.mnbs : (cityInfo && cityInfo.isPrivate && city.mpbs ? city.mpbs : null);
  const cityAvgM = cityInfo && !cityInfo.isPrivate && city.mnms ? city.mnms : (cityInfo && cityInfo.isPrivate && city.mpms ? city.mpms : null);

  const validB = school.b.filter((v) => v !== null && v !== undefined);
  const validM = school.m.filter((v) => v !== null && v !== undefined);
  const validBu = school.bu.filter((v, i) => v && school.b[i] !== null);
  const validMu = school.mu.filter((v, i) => v && school.m[i] !== null);
  const avg = (arr) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const stddev = (arr) => {
    if (arr.length < 2) {
      return 0;
    }
    const mean = avg(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / (arr.length - 1));
  };
  const recentStart = Math.max(0, totalYears - 5);
  let bestB = null;
  let worstB = null;
  let bestM = null;
  let worstM = null;
  let countB = 0;
  let countM = 0;
  for (let y = recentStart; y < totalYears; y++) {
    if (school.b[y] !== null) {
      if (bestB === null || school.b[y] > school.b[bestB]) { bestB = y; }
      if (worstB === null || school.b[y] < school.b[worstB]) { worstB = y; }
      countB++;
    }
    if (school.m[y] !== null) {
      if (bestM === null || school.m[y] > school.m[bestM]) { bestM = y; }
      if (worstM === null || school.m[y] < school.m[worstM]) { worstM = y; }
      countM++;
    }
  }
  const labelB = '(' + countB + 'г.)';
  const labelM = '(' + countM + 'г.)';

  const cityAvgs = [];
  [city && city.n, city && city.p].forEach((range) => {
    if (!range) {
      return;
    }
    for (let i = range[0]; i <= range[1]; i++) {
      if (s[i] && (s[i].mb || s[i].mm)) {
        cityAvgs.push((s[i].mb + s[i].mm) / 2);
      }
    }
  });
  cityAvgs.sort((a, b) => a - b);
  const schoolAvg = (school.mb + school.mm) / 2;
  let percentile = 0;
  if (cityAvgs.length > 1) {
    percentile = Math.round(cityAvgs.filter((v) => v < schoolAvg).length / (cityAvgs.length - 1) * 100);
  } else if (cityAvgs.length === 1) {
    percentile = 100;
  }

  const trend = (arr, start) => {
    const pts = [];
    for (let i = start; i < arr.length; i++) {
      if (arr[i] !== null && arr[i] !== undefined) {
        pts.push({ x: i, y: arr[i] });
      }
    }
    if (pts.length < 2) {
      return null;
    }
    const mx = avg(pts.map((p) => p.x));
    const my = avg(pts.map((p) => p.y));
    const num = pts.reduce((acc, p) => acc + (p.x - mx) * (p.y - my), 0);
    const den = pts.reduce((acc, p) => acc + (p.x - mx) * (p.x - mx), 0);
    return den !== 0 ? num / den : 0;
  };
  const trendB = trend(school.b, recentStart);
  const trendM = trend(school.m, recentStart);
  const fmtTrend = (t) => (t !== null ? (t >= 0 ? '+' : '') + t.toFixed(2) + '/г.' : '-');

  const summary = [
    [H.bel + ' средна (3г.)', school.mb ? school.mb.toFixed(2) : '-', H.mat + ' средна (3г.)', school.mm ? school.mm.toFixed(2) : '-'],
    [H.bel + ' средна (всички)', validB.length > 0 ? avg(validB).toFixed(2) : '-', H.mat + ' средна (всички)', validM.length > 0 ? avg(validM).toFixed(2) : '-'],
    [H.bel + ' станд. отклонение', validB.length > 1 ? stddev(validB).toFixed(2) : '-', H.mat + ' станд. отклонение', validM.length > 1 ? stddev(validM).toFixed(2) : '-'],
    [H.bel + ' тренд ' + labelB, fmtTrend(trendB), H.mat + ' тренд ' + labelM, fmtTrend(trendM)],
    [H.bel + ' най-добра ' + labelB, bestB !== null ? school.b[bestB] + ' (' + (firstYear + bestB) + ')' : '-', H.mat + ' най-добра ' + labelM, bestM !== null ? school.m[bestM] + ' (' + (firstYear + bestM) + ')' : '-'],
    [H.bel + ' най-слаба ' + labelB, worstB !== null ? school.b[worstB] + ' (' + (firstYear + worstB) + ')' : '-', H.mat + ' най-слаба ' + labelM, worstM !== null ? school.m[worstM] + ' (' + (firstYear + worstM) + ')' : '-'],
    ['Ранг в града', rankInfo.rank ? rankInfo.rank + ' / ' + rankInfo.total : '-', 'Перцентил в града', percentile + '%'],
    ['Средно ученици ' + H.bel, validBu.length > 0 ? Math.round(avg(validBu)) : '-', 'Средно ученици ' + H.mat, validMu.length > 0 ? Math.round(avg(validMu)) : '-']
  ];
  const tableWidth = 400;
  const signColor = (data, cols) => {
    if (data.section === 'body' && cols.includes(data.column.index)) {
      const val = parseFloat(data.cell.raw);
      if (!isNaN(val)) {
        if (val > 0) { data.cell.styles.textColor = [22, 163, 74]; }
        else if (val < 0) { data.cell.styles.textColor = [220, 38, 38]; }
      }
    }
  };
  doc.autoTable({
    body: summary,
    startY: 95,
    margin: { left: (pageW - tableWidth) / 2 },
    tableWidth,
    theme: 'plain',
    styles: { font: FONT_NAME, fontSize: 10, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'center', cellWidth: 80 },
      2: { fontStyle: 'bold', cellWidth: 120 },
      3: { halign: 'center', cellWidth: 80 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 3)) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) { data.cell.styles.textColor = [22, 163, 74]; }
        else if (text.startsWith('-') && text !== '-') { data.cell.styles.textColor = [220, 38, 38]; }
      }
    }
  });

  const scoresY = doc.lastAutoTable.finalY + 30;
  doc.setFontSize(12);
  doc.text('Резултати по години', pageW / 2, scoresY, { align: 'center' });
  const scoreRows = [];
  for (let y = totalYears - 1; y >= 0; y--) {
    const dB = y > 0 && school.b[y] !== null && school.b[y - 1] !== null ? (school.b[y] - school.b[y - 1]).toFixed(2) : '';
    const dM = y > 0 && school.m[y] !== null && school.m[y - 1] !== null ? (school.m[y] - school.m[y - 1]).toFixed(2) : '';
    scoreRows.push([
      String(firstYear + y),
      school.b[y] !== null && school.b[y] !== undefined ? String(school.b[y]) : '-',
      school.m[y] !== null && school.m[y] !== undefined ? String(school.m[y]) : '-',
      school.bu[y] ? String(school.bu[y]) : '-',
      school.mu[y] ? String(school.mu[y]) : '-',
      dB, dM
    ]);
  }
  doc.autoTable({
    head: [['Година', H.bel, H.mat, H.bel + ' уч.', H.mat + ' уч.', 'Δ ' + H.b, 'Δ ' + H.m]],
    body: scoreRows,
    startY: scoresY + 12,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { font: FONT_NAME, fontSize: 10, cellPadding: 3, halign: 'center' },
    headStyles: { font: FONT_NAME, fillColor: [47, 84, 224], textColor: 255 },
    didParseCell: (data) => signColor(data, [5, 6])
  });

  const compY = doc.lastAutoTable.finalY + 30;
  doc.setFontSize(12);
  doc.text('Сравнение с град и нация (последни 3 години)', pageW / 2, compY, { align: 'center' });
  const compRows = [];
  for (let k = 0; k < 3; k++) {
    const y = totalYears - 1 - k;
    if (y < 0) {
      continue;
    }
    const sB = school.b[y];
    const cB = cityAvgB && cityAvgB[y] ? cityAvgB[y] : null;
    const nB = nat.b[y] ? nat.b[y] : null;
    const sM = school.m[y];
    const cM = cityAvgM && cityAvgM[y] ? cityAvgM[y] : null;
    const nM = nat.m[y] ? nat.m[y] : null;
    compRows.push([
      String(firstYear + y),
      sB !== null ? String(sB) : '-',
      cB !== null ? cB.toFixed(2) : '-',
      sB !== null && cB !== null ? (sB - cB).toFixed(2) : '-',
      nB !== null ? nB.toFixed(2) : '-',
      sB !== null && nB !== null ? (sB - nB).toFixed(2) : '-',
      sM !== null ? String(sM) : '-',
      cM !== null ? cM.toFixed(2) : '-',
      sM !== null && cM !== null ? (sM - cM).toFixed(2) : '-',
      nM !== null ? nM.toFixed(2) : '-',
      sM !== null && nM !== null ? (sM - nM).toFixed(2) : '-'
    ]);
  }
  doc.autoTable({
    head: [['Година', 'Уч. ' + H.b, 'Град ' + H.b, 'Δ град', 'Нация ' + H.b, 'Δ нация', 'Уч. ' + H.m, 'Град ' + H.m, 'Δ град', 'Нация ' + H.m, 'Δ нация']],
    body: compRows,
    startY: compY + 12,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { font: FONT_NAME, fontSize: 10, cellPadding: 2.5, halign: 'center' },
    headStyles: { font: FONT_NAME, fillColor: [47, 84, 224], textColor: 255, fontSize: 6.5 },
    didParseCell: (data) => signColor(data, [3, 5, 8, 10])
  });

  doc.addPage();
  doc.setFontSize(13);
  doc.text(school.n + ' - Графики', pageW / 2, 35, { align: 'center' });
  const hidden = document.createElement('div');
  hidden.style.cssText = 'position:absolute;left:-9999px;top:0;width:520px;height:260px;';
  document.body.appendChild(hidden);
  const years = [];
  for (let y = 0; y < totalYears; y++) {
    years.push(String(firstYear + y));
  }
  const chartConfig = (title, own, cityAvg, natAvg) => ({
    chart: { type: 'line', animation: false, height: 260, width: 520 },
    title: { text: title, style: { fontSize: '12px' } },
    xAxis: { categories: years, labels: { style: { fontSize: '9px' } } },
    yAxis: { title: { text: null }, floor: cfg.chartFloor, ceiling: cfg.chartCeiling, labels: { style: { fontSize: '9px' } } },
    legend: { itemStyle: { fontSize: '9px' } },
    credits: { enabled: false },
    exporting: { enabled: false },
    accessibility: { enabled: false },
    plotOptions: { series: { animation: false, connectNulls: true } },
    series: [
      { name: school.l, data: own.slice(), color: '#2f54e0' },
      { name: 'Средна за ' + cityName, data: cityAvg ? cityAvg.slice() : [], dashStyle: 'Dash', color: '#9ca3af' }
    ].concat(natAvg.length > 0 ? [{ name: 'Национална средна', data: natAvg.slice(), dashStyle: 'Dot', color: '#e8850c' }] : [])
  });
  try {
    const w = pageW - margin * 2;
    const belPng = await renderChartToImage(hidden, chartConfig(cfg.chartBTitle, school.b, cityAvgB, nat.b));
    if (belPng) {
      doc.addImage(belPng, 'PNG', margin, 50, w, w * 0.5);
    }
    const matY = belPng ? 50 + w * 0.5 + 25 : 50;
    const matPng = await renderChartToImage(hidden, chartConfig(cfg.chartMTitle, school.m, cityAvgM, nat.m));
    if (matPng) {
      doc.addImage(matPng, 'PNG', margin, matY, w, w * 0.5);
    }
  } finally {
    hidden.remove();
  }

  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('ivandavidov.github.io/nvo', pageW / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    doc.text(p + ' / ' + pages, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
    doc.setTextColor(0);
  }
  const safe = (str) => str.replace(/[^a-zA-Z0-9Ѐ-ӿ]/g, '-').replace(/-+/g, '-');
  doc.save(cfg.exportPrefix + '-report-' + safe(cityName) + '-' + safe(school.l) + '.pdf');
}

/** Колоните на класацията (същите заглавия като в таблицата на сайта). */
export function rankingHeaders(model) {
  const { cfg, firstYear, totalYears } = model;
  const headers = ['№', 'Училище', 'Тип / №', 'Ранг'];
  for (let k = 0; k < 3; k++) {
    const yy = firstYear - 2001 + totalYears - k;
    headers.push(yy + ' ' + cfg.csvHeaderB + ' / уч.');
    headers.push(yy + ' ' + cfg.csvHeaderM + ' / уч.');
  }
  return headers;
}

/** Текстът на клетките за един ред (както се вижда в таблицата). */
export function rankingCells(model, row, position, filter) {
  const { s } = model;
  const o = s[row.i];
  const cells = [String(position), o.l, row.type + ' / ' + row.typeNo, formatRankValue(rankFor(row, filter))];
  row.years.forEach((y) => {
    cells.push(y.b ? y.b + ' / ' + y.bu : '');
    cells.push(y.m ? y.m + ' / ' + y.mu : '');
  });
  return cells;
}

/** PDF на класацията на град — видимите редове в текущата подредба и филтър. */
export async function rankingPdf(model, city, rows, filter) {
  const ns = await ensurePdfLibs();
  const { cfg } = model;
  if (!rows.length) {
    return;
  }
  const doc = await newDoc(ns, 'landscape');
  doc.setFontSize(12);
  doc.text(cfg.tableTitleName + ' - ' + city.name + ' - ' + cfg.tableTitleType, PAGE_MARGIN_PT, TITLE_Y_PT);
  doc.autoTable({
    head: [rankingHeaders(model)],
    body: rows.map((row, k) => rankingCells(model, row, k + 1, filter)),
    startY: TABLE_START_Y_PT,
    margin: { left: PAGE_MARGIN_PT, right: PAGE_MARGIN_PT },
    theme: 'grid',
    styles: { font: FONT_NAME, fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { font: FONT_NAME, fillColor: [230, 230, 230], textColor: 20 }
  });
  doc.save(cfg.exportPrefix + '-ranking-' + city.slug + '.pdf');
}

/* ---------------- PDF профил на училище (страницата /school/{код}/) ---------------- */

function gradeHeading(grade) {
  return String(grade) === '12' ? 'ДЗИ 12 клас' : 'НВО ' + grade + ' клас';
}

/** Един PDF за всички класове на училището — като стария logic-school.js. */
export async function schoolProfilePdf(data, gradeMeta, seriesForGrade) {
  const ns = await ensurePdfLibs();
  const doc = await newDoc(ns, 'portrait');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  doc.setFontSize(16);
  doc.text(String(data.fullName || ''), margin, 50, { maxWidth: pageW - 2 * margin });
  let sub = data.isPrivate ? 'Частно' : 'Държавно';
  if (data.city && data.city.name) {
    sub += ' · ' + data.city.name;
  }
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(sub, margin, 68);
  doc.setTextColor(0);

  const hidden = document.createElement('div');
  hidden.style.cssText = 'position:absolute;left:-9999px;top:0;width:520px;height:260px;';
  document.body.appendChild(hidden);
  let y = 90;
  try {
    const keys = ['4', '7', '10', '12'].filter((k) => data.grades && data.grades[k]);
    for (const grade of keys) {
      const g = data.grades[grade];
      const meta = gradeMeta[grade];
      if (y > pageH - 230) {
        doc.addPage();
        y = 50;
      }
      doc.setFontSize(13);
      doc.text(gradeHeading(grade), margin, y);
      y += 14;
      const parts = [];
      if (g.latestYear != null) { parts.push('Последна година: ' + g.latestYear); }
      if (g.nationalRank != null && g.nationalTotal != null) { parts.push('Национален ранг: ' + g.nationalRank + ' / ' + g.nationalTotal); }
      if (g.cityRank != null && g.cityTotal != null) { parts.push('В града: ' + g.cityRank + ' / ' + g.cityTotal); }
      if (g.medianRank != null && g.medianTotal != null) { parts.push('Медианен ранг: ' + g.medianRank + ' / ' + g.medianTotal); }
      doc.setFontSize(8.5);
      doc.setTextColor(100);
      doc.text(parts.join('   ·   '), margin, y);
      doc.setTextColor(0);
      y += 8;

      const s = seriesForGrade(grade, g);
      if (s.first >= 0) {
        const img = await renderChartToImage(hidden, {
          chart: { type: 'line', animation: false, height: 260, width: 520, backgroundColor: '#ffffff' },
          title: { text: gradeHeading(grade), style: { color: '#1e293b', fontSize: '13px' } },
          credits: { enabled: false },
          exporting: { enabled: false },
          accessibility: { enabled: false },
          xAxis: { categories: s.categories, min: s.first, max: s.last, startOnTick: false, endOnTick: false,
            labels: { style: { color: '#64748b' } }, lineColor: '#e2e8f0', tickColor: '#e2e8f0' },
          yAxis: { title: { text: null }, floor: meta.floor, ceiling: meta.ceiling, labels: { style: { color: '#64748b' } }, gridLineColor: '#e2e8f0' },
          legend: { itemStyle: { color: '#1e293b' } },
          plotOptions: { series: { animation: false, connectNulls: false, marker: { enabled: true, radius: 4 } } },
          series: [
            { name: meta.bel, data: s.bel, color: '#2f54e0' },
            { name: meta.mat, data: s.mat, color: '#e8850c' }
          ]
        });
        if (img) {
          const imgW = pageW - 2 * margin;
          const imgH = imgW * (260 / 520);
          doc.addImage(img, 'PNG', margin, y, imgW, imgH);
          y += imgH + 8;
        }
      }
      const years = g.yearsRange || data.yearsRange || [];
      const rows = [];
      for (let i = years.length - 1; i >= 0; i--) {
        const b = g.belScore[i];
        const m = g.matScore[i];
        if (b == null && m == null) {
          continue;
        }
        const bu = g.belStudents ? g.belStudents[i] : null;
        const mu = g.matStudents ? g.matStudents[i] : null;
        rows.push([String(years[i]), b == null ? '' : b.toFixed(2), bu == null ? '' : String(bu), m == null ? '' : m.toFixed(2), mu == null ? '' : String(mu)]);
      }
      doc.autoTable({
        head: [['Година', meta.bel, 'уч.', meta.mat, 'уч.']],
        body: rows,
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { font: FONT_NAME, fontSize: 9, cellPadding: 3, halign: 'center' },
        headStyles: { font: FONT_NAME, fillColor: [47, 84, 224], textColor: 255 }
      });
      y = doc.lastAutoTable.finalY + 26;
    }
  } finally {
    hidden.remove();
  }
  doc.save('nvo-dzi-' + (data.code || 'school') + '.pdf');
}
