// PDF брошура за училище (бутонът на /school/{код}/ и "Доклад" в класациите): корица с
// обобщение, по една страница за всеки изпит, прием след 7 клас и как да се четат данните.
// Векторна - jsPDF + AutoTable, без Highcharts. Данни: документът на училището от API-то
// (с ранговете по години), data/grade-{g}.json (средните за страната и за вида в града,
// съседите в класацията на града) и баловете на РУО за града.
import { displayRange, MAX_YEARS, isNoExamYear } from './config.js';
import { fetchGradeData, buildModel, nationalAverages, typeAverages, findSchoolIndexByCode, findCityForSchool, cityIndices } from './model.js';
import { schoolType, typeKeyFromApi } from './school-types.js';
import { loadScript, fetchBase64 } from './pdf.js';

const ASSETS = new URL('../../', import.meta.url); // коренът на сайта
const SITE = 'ivandavidov.github.io/nvo';
const SITE_URL = 'https://' + SITE + '/';

// A4 в точки
const W = 595.28;
const H = 841.89;
const M = 40;
const CW = W - 2 * M;
const TOP = 58; // съдържанието на вътрешните страници започва под горния колонтитул
const BOTTOM = H - 52; // и свършва над долния

const FONT = 'Inter';
const FONTS = [['Inter-Regular.ttf', 'normal'], ['Inter-Medium.ttf', 'medium'], ['Inter-SemiBold.ttf', 'bold']];

// Печатни цветове - светлата тема на сайта.
const C = {
  ink: [13, 20, 36],
  text2: [58, 70, 92],
  muted: [92, 104, 125],
  faint: [150, 160, 176],
  line: [225, 230, 238],
  surface: [245, 247, 251],
  track: [230, 235, 243],
  primary: [47, 84, 224],
  primarySoft: [236, 241, 255],
  primarySoft2: [217, 227, 255],
  bel: [47, 84, 224],
  mat: [232, 133, 12],
  city: [150, 160, 176],
  nation: [58, 70, 92],
  up: [11, 112, 105],
  down: [180, 35, 24],
  closed: [180, 35, 24],
  closedSoft: [254, 235, 233],
  white: [255, 255, 255]
};
// [текст, фон] на значката за вида - като .type-badge--{key} на сайта
const TYPE_COLORS = {
  s: [[11, 112, 105], [226, 243, 241]],
  m: [[58, 70, 92], [230, 235, 243]],
  p: [[180, 83, 9], [255, 243, 226]],
  r: [[122, 79, 214], [241, 235, 253]]
};

const NVO = { long: 'Национално външно оценяване', bel: 'БЕЛ', mat: 'МАТ', min: 0, max: 100, steps: [5, 10, 20, 25] };
const EXAMS = {
  4: Object.assign({ heading: 'НВО 4 клас' }, NVO),
  7: Object.assign({ heading: 'НВО 7 клас' }, NVO),
  10: Object.assign({ heading: 'НВО 10 клас' }, NVO),
  12: { heading: 'ДЗИ 12 клас', long: 'Държавни зрелостни изпити', bel: 'БЕЛ', mat: 'ДЗИ-2', min: 2, max: 6, steps: [0.25, 0.5, 1] }
};
const GRADES = ['4', '7', '10', '12'];

// Статусът в регистъра на МОН - като SchoolPageGenerator.
const CLOSED = {
  'закрита': ['Закрито', 'Училището е закрито според регистъра на МОН.'],
  'преобразувана (закрита)': ['Преобразувано', 'Според регистъра на МОН училището е преобразувано и вече не съществува под този код.'],
  'отписана': ['Отписано', 'Училището е отписано от регистъра на МОН.'],
  'заличена': ['Заличено', 'Училището е заличено от регистъра на МОН.']
};

const KLASIRANE = ['1-во', '2-ро', '3-то', '4-то'];

/* ---------------- малки помощници ---------------- */

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const fmt = (v, d = 2) => (isNum(v) ? v.toFixed(d) : '-');
const round2 = (v) => Math.round(v * 100) / 100;
const signed = (v) => (isNum(v) ? (round2(v) > 0 ? '+' : '') + (round2(v) || 0).toFixed(2) : '-');
const deltaColor = (v) => (!isNum(v) || Math.abs(round2(v)) < 0.005 ? C.muted : v > 0 ? C.up : C.down);
const plain = (s) => String(s).toLowerCase().replace(/[^0-9a-zа-я]/g, '');
const span = (a, b) => (a === b ? String(a) : a + '-' + b);
const today = () => {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
};

function font(doc, style, size, color = C.ink) {
  doc.setFont(FONT, style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

function fill(doc, c) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function stroke(doc, c, w) {
  doc.setDrawColor(c[0], c[1], c[2]);
  doc.setLineWidth(w);
}

function hline(doc, x1, x2, y, c = C.line, w = 0.6) {
  stroke(doc, c, w);
  doc.line(x1, y, x2, y);
}

/** Текст в зададена ширина: по-малък шрифт до minSize, после съкратен с "...". */
function fit(doc, str, width, style, size, minSize = size - 1.5) {
  let s = size;
  font(doc, style, s);
  while (doc.getTextWidth(str) > width && s > minSize) {
    s -= 0.5;
    font(doc, style, s);
  }
  let out = str;
  while (doc.getTextWidth(out) > width && out.length > 4) {
    out = out.slice(0, -4).trimEnd() + '...';
  }
  return { text: out, size: s };
}

/** Парчета текст с различен стил на един ред: [[текст, стил, размер, цвят], ...]. */
function runsWidth(doc, parts) {
  let w = 0;
  parts.forEach(([t, st, sz]) => {
    font(doc, st, sz);
    w += doc.getTextWidth(t);
  });
  return w;
}

function runs(doc, x, y, parts, align = 'left') {
  let cx = align === 'right' ? x - runsWidth(doc, parts) : x;
  parts.forEach(([t, st, sz, col]) => {
    font(doc, st, sz, col || C.ink);
    doc.text(t, cx, y);
    cx += doc.getTextWidth(t);
  });
  return cx;
}

/** Абзац; връща базовата линия след последния ред. */
function paragraph(doc, str, x, y, width, size = 9, color = C.text2, lead = 1.42) {
  font(doc, 'normal', size, color);
  const lines = doc.splitTextToSize(str, width);
  lines.forEach((l, k) => doc.text(l, x, y + k * size * lead));
  return y + lines.length * size * lead;
}

/** Хапче с текст; връща ширината. */
function chip(doc, x, y, label, fg, bg, url) {
  font(doc, 'medium', 8.5, fg);
  const w = doc.getTextWidth(label) + 16;
  fill(doc, bg);
  doc.roundedRect(x, y, w, 18, 9, 9, 'F');
  doc.text(label, x + 8, y + 12.2);
  if (url) {
    doc.link(x, y, w, 18, { url });
  }
  return w;
}

/** Заглавие на блок: удебелено вляво, пояснение вдясно. */
function blockTitle(doc, y, title, note) {
  font(doc, 'bold', 10.5, C.ink);
  doc.text(title, M, y);
  if (note) {
    const left = M + doc.getTextWidth(title) + 16;
    const f = fit(doc, note, W - M - left, 'normal', 8, 7);
    font(doc, 'normal', f.size, C.muted);
    doc.text(f.text, W - M, y, { align: 'right' });
  }
}

/** QR кодът - векторни квадратчета (редовете се сливат в правоъгълници). */
function qrCode(doc, url, x, y, size) {
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const cell = size / n;
  fill(doc, C.ink);
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!qr.isDark(r, c)) {
        c++;
        continue;
      }
      let e = c;
      while (e + 1 < n && qr.isDark(r, e + 1)) {
        e++;
      }
      doc.rect(x + c * cell, y + r * cell, (e - c + 1) * cell, cell + 0.05, 'F');
      c = e + 1;
    }
  }
}

/** Скала с "кръгли" деления за стойностите (поне малко въздух над и под линиите). */
function niceScale(values, min, max, steps) {
  const vals = values.filter(isNum);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.08, steps[0] / 2);
  lo -= pad;
  hi += pad;
  const step = steps.find((s) => (hi - lo) / s <= 5) || steps[steps.length - 1];
  lo = Math.max(min, Math.floor(lo / step) * step);
  hi = Math.min(max, Math.ceil(hi / step) * step);
  if (hi <= lo) {
    hi = lo + step;
  }
  return { lo, hi, step };
}

/**
 * Линейна графика в box {x, y, w, h}. series: [{data, color, width, dash, markers}];
 * axis: {lo, hi, step, format} - деления вляво; invert - по-малкото е горе (място);
 * labels: {series, format, all} - стойностите над точките (all: всички, иначе последната).
 */
function lineChart(doc, box, o) {
  const left = box.x + (o.axis ? 24 : 10);
  const right = box.x + box.w - 10;
  const top = box.y + (o.labels ? 12 : 4);
  const bottom = box.y + box.h;
  const n = o.years.length;
  const xAt = (i) => (n === 1 ? (left + right) / 2 : left + (right - left) * i / (n - 1));
  const yAt = (v) => {
    const t = (v - o.lo) / (o.hi - o.lo);
    return o.invert ? top + (bottom - top) * t : bottom - (bottom - top) * t;
  };
  // Години без изпит (o.noExam - индекси): сива ивица, пунктир между съседните години и надпис
  // "Няма изпит" - като графиките на сайта (markNoExamYears).
  const gaps = o.noExam || [];
  const step = n > 1 ? (right - left) / (n - 1) : right - left;
  gaps.forEach((i) => {
    fill(doc, C.surface);
    doc.rect(xAt(i) - step / 2, top, step, bottom - top, 'F');
  });
  if (o.axis) {
    for (let v = o.lo; v <= o.hi + 1e-9; v += o.axis.step) {
      const y = yAt(v);
      hline(doc, left, right, y, C.line, 0.5);
      font(doc, 'normal', 7, C.faint);
      doc.text(o.axis.format(v), left - 5, y + 2.4, { align: 'right' });
    }
  } else {
    hline(doc, left - 6, right + 6, bottom + 2, C.line, 0.5);
  }
  font(doc, 'normal', 7.5, C.muted);
  o.years.forEach((year, i) => doc.text(String(year), xAt(i), bottom + 13, { align: 'center' }));

  doc.setLineCap('round');
  doc.setLineJoin('round');
  o.series.forEach((s) => {
    stroke(doc, s.color, s.width || 1.7);
    doc.setLineDashPattern(s.dash || [], 0);
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        const d = run.slice(1).map((p, k) => [p[0] - run[k][0], p[1] - run[k][1]]);
        doc.lines(d, run[0][0], run[0][1], [1, 1], 'S', false);
      } else if (run.length === 1 && !s.markers) {
        fill(doc, s.color);
        doc.circle(run[0][0], run[0][1], 1.2, 'F');
      }
      run = [];
    };
    s.data.forEach((v, i) => {
      if (isNum(v)) {
        run.push([xAt(i), yAt(v)]);
      } else {
        flush();
      }
    });
    flush();
    doc.setLineDashPattern([0.1, 2.6], 0);
    gaps.forEach((i) => {
      if (gaps.includes(i - 1)) {
        return;
      }
      let j = i;
      while (gaps.includes(j + 1)) {
        j++;
      }
      const a = s.data[i - 1];
      const b = s.data[j + 1];
      if (isNum(a) && isNum(b)) {
        doc.line(xAt(i - 1), yAt(a), xAt(j + 1), yAt(b));
      }
    });
    doc.setLineDashPattern([], 0);
    if (s.markers) {
      s.data.forEach((v, i) => {
        if (isNum(v)) {
          fill(doc, s.color);
          stroke(doc, C.white, 0.9);
          doc.circle(xAt(i), yAt(v), 2.4, 'FD');
        }
      });
    }
  });
  // Надписът е над линиите, с фона на ивицата - пунктирът минава под него.
  gaps.forEach((i) => {
    const size = 6.5;
    font(doc, 'normal', size, C.faint);
    const t = 'Няма изпит';
    const w = doc.getTextWidth(t);
    const mid = (top + bottom) / 2;
    fill(doc, C.surface);
    doc.rect(xAt(i) - size * 0.6, mid - w / 2 - 2, size * 1.2, w + 4, 'F');
    doc.text(t, xAt(i) + size * 0.35, mid + w / 2, { angle: 90 });
  });
  if (o.labels) {
    const s = o.series[o.labels.series];
    let lastIdx = -1;
    s.data.forEach((v, i) => {
      if (isNum(v)) {
        lastIdx = i;
      }
    });
    s.data.forEach((v, i) => {
      if (isNum(v) && (o.labels.all || i === lastIdx)) {
        const t = o.labels.format(v);
        font(doc, 'medium', 7.5, o.labels.color || s.color);
        const w = doc.getTextWidth(t);
        fill(doc, C.white);
        doc.rect(xAt(i) - w / 2 - 1.5, yAt(v) - 12.5, w + 3, 9, 'F');
        doc.text(t, xAt(i), yAt(v) - 6, { align: 'center' });
      }
    });
  }
}

/** Мини легенда: [{swatch: fn(x, y), label}]; връща крайното x. */
function legend(doc, x, y, items) {
  let cx = x;
  items.forEach((it) => {
    it.swatch(cx, y - 2.6);
    cx += 22;
    font(doc, 'normal', 7.5, C.muted);
    doc.text(it.label, cx, y);
    cx += doc.getTextWidth(it.label) + 16;
  });
  return cx;
}

function swatchLine(doc, color, dash, width = 1.6) {
  return (x, y) => {
    stroke(doc, color, width);
    doc.setLineCap('round');
    doc.setLineDashPattern(dash || [], 0);
    doc.line(x, y, x + 16, y);
    doc.setLineDashPattern([], 0);
  };
}

/** Общите стилове на таблиците (AutoTable): тънки линии, без запълване. */
function tableOptions(extra) {
  return Object.assign({
    theme: 'plain',
    margin: { left: M, right: M, top: TOP + 4, bottom: H - BOTTOM + 6 },
    styles: {
      font: FONT, fontStyle: 'normal', fontSize: 8.5, textColor: C.ink, halign: 'center', valign: 'middle',
      cellPadding: { top: 3.8, bottom: 3.8, left: 4, right: 4 }, lineColor: C.line, lineWidth: { bottom: 0.5 }
    },
    headStyles: { fontStyle: 'medium', fontSize: 7.5, textColor: C.muted, lineColor: C.faint, lineWidth: { bottom: 0.8 } }
  }, extra);
}

/* ---------------- данни ---------------- */

function siteJson(path) {
  return fetch(new URL(path, ASSETS).toString()).then((r) => {
    if (!r.ok) {
      throw new Error('HTTP ' + r.status + ' for ' + path);
    }
    return r.json();
  });
}

/**
 * Училищата в града в годината k (по средното от двата предмета) - мястото и съседите.
 * self - училището от API-то, ако го няма в data/grade-{g}.json (напр. закрито).
 */
function cityList(model, city, k, self) {
  const seen = new Set();
  const list = [];
  cityIndices(city).forEach((i) => {
    const o = model.s[i];
    if (!o || seen.has(o.c) || !o.b[k] || !o.m[k]) {
      return;
    }
    seen.add(o.c);
    list.push({ code: o.c, name: o.n || o.l, type: o.t, bel: o.b[k], mat: o.m[k], avg: (o.b[k] + o.m[k]) / 2 });
  });
  if (self && !seen.has(self.code) && isNum(self.bel) && isNum(self.mat)) {
    list.push(Object.assign({ avg: (self.bel + self.mat) / 2 }, self));
  }
  list.sort((a, b) => b.avg - a.avg);
  list.forEach((x, i) => { x.place = i + 1; });
  return list;
}

/** Данните за един изпит в показвания прозорец (празните години в началото и края - без тях). */
async function examData(data, grade, typeKey) {
  const g = data.grades[grade];
  const meta = EXAMS[grade];
  const years = g.yearsRange || data.yearsRange || [];
  if (!years.length) {
    return null;
  }
  const from = displayRange(grade, years[years.length - 1]).from;
  const at = (arr, i) => (arr && isNum(arr[i]) ? arr[i] : null);
  let rows = [];
  years.forEach((year, i) => {
    if (year < from) {
      return;
    }
    // Години без изпит (копие на съседна година в данните) - брошурата ги показва като празни.
    const skip = isNoExamYear(grade, year);
    rows.push(skip ? { year, skip } : {
      year,
      bel: at(g.belScore, i), mat: at(g.matScore, i), bu: at(g.belStudents, i), mu: at(g.matStudents, i),
      natRank: at(g.nationalRanks, i), natTotal: at(g.nationalTotals, i),
      cityRank: at(g.cityRanks, i), cityTotal: at(g.cityTotals, i)
    });
  });
  const has = (r) => isNum(r.bel) || isNum(r.mat);
  const first = rows.findIndex(has);
  if (first < 0) {
    return null;
  }
  let last = rows.length - 1;
  while (!has(rows[last])) {
    last--;
  }
  rows = rows.slice(first, last + 1);

  const model = buildModel(Number(grade), await fetchGradeData(grade, new URL('data/grade-' + grade + '.json', ASSETS).toString()), {});
  const nat = nationalAverages(model);
  const idx = findSchoolIndexByCode(model, data.code);
  const info = idx >= 0 ? findCityForSchool(model, idx) : null;
  let cityName = info ? info.cityName : null;
  // Закритите училища ги няма в данните на класа - градът е по адреса му.
  if (!cityName && data.city && data.city.slug) {
    cityName = Object.keys(model.si).find((name) => model.si[name].h === data.city.slug) || null;
  }
  const si = cityName ? model.si[cityName] : null;
  const city = si && Array.isArray(si.n) ? { pu: si.n, pr: si.p } : null;
  const type = idx >= 0 && model.s[idx].t ? model.s[idx].t : typeKey;
  const slot = (year) => {
    const k = year - model.firstYear;
    return k >= 0 && k < model.totalYears ? k : -1;
  };
  // Средното за вида в града - само ако в града има и други училища от този вид.
  let typeAvg = null;
  if (city) {
    const peers = new Set();
    cityIndices(city).forEach((i) => {
      const o = model.s[i];
      if (o && o.t === type && o.c !== data.code && (o.b.some(Boolean) || o.m.some(Boolean))) {
        peers.add(o.c);
      }
    });
    if (peers.size) {
      typeAvg = typeAverages(model, city, [type], false);
    }
  }
  rows.forEach((r) => {
    const k = r.skip ? -1 : slot(r.year);
    r.natB = k >= 0 && nat.b[k] ? nat.b[k] : null;
    r.natM = k >= 0 && nat.m[k] ? nat.m[k] : null;
    r.cityB = k >= 0 && typeAvg && isNum(typeAvg.bel[k]) ? typeAvg.bel[k] : null;
    r.cityM = k >= 0 && typeAvg && isNum(typeAvg.mat[k]) ? typeAvg.mat[k] : null;
  });
  const latest = rows.find((r) => r.year === g.latestYear) || rows[rows.length - 1];
  const k = slot(latest.year);
  const self = { code: data.code, name: data.fullName, type, bel: latest.bel, mat: latest.mat };
  const list = city && k >= 0 ? cityList(model, city, k, self) : [];
  return {
    grade, meta, rows, latest, g, type,
    cityName: cityName || (data.city ? data.city.name : null),
    hasCityAvg: !!typeAvg,
    city: list.some((x) => x.code === data.code) && list.length > 1 ? list : null
  };
}

/** Баловете на училището: паралелките с мин./макс. бал по години (null - градът няма балове). */
async function baloveData(data) {
  const slug = data.city && data.city.slug;
  if (!slug) {
    return null;
  }
  const index = await siteJson('api/v1/balove/index.json');
  if (!index.cities || !index.cities.some((c) => c.slug === slug)) {
    return null;
  }
  const doc = await siteJson('api/v1/balove/' + slug + '.json');
  const school = (doc.schools || []).find((s) => s.code === data.code);
  if (!school || !school.profiles || !school.profiles.length) {
    return null;
  }
  const years = doc.years;
  const profiles = school.profiles.map((p) => ({
    name: p.name,
    per: years.map((y) => {
      const slots = p.years && p.years[y];
      if (!slots) {
        return null;
      }
      const firstNo = slots.findIndex(Boolean);
      if (firstNo < 0) {
        return null;
      }
      let lastNo = slots.length - 1;
      while (!slots[lastNo]) {
        lastNo--;
      }
      return { min: slots[firstNo].min, max: slots[firstNo].max, firstNo, lastMin: slots[lastNo].min, lastNo };
    })
  })).filter((p) => p.per.some(Boolean));
  if (!profiles.length) {
    return null;
  }
  let li = years.length - 1;
  while (li > 0 && !profiles.some((p) => p.per[li])) {
    li--;
  }
  const latestYear = years[li];
  const active = profiles.filter((p) => p.per[li]).sort((a, b) => b.per[li].min - a.per[li].min);
  const lastYearIdx = (p) => p.per.reduce((acc, v, i) => (v ? i : acc), -1);
  const rest = profiles.filter((p) => !p.per[li]).sort((a, b) => lastYearIdx(b) - lastYearIdx(a)
    || b.per[lastYearIdx(b)].min - a.per[lastYearIdx(a)].min);
  const firstYear = years[profiles.reduce((acc, p) => Math.min(acc, p.per.findIndex(Boolean)), years.length - 1)];
  return { cityName: doc.city ? doc.city.name : data.city.name, years, li, latestYear, firstYear, active, rest };
}

/* ---------------- изводи за корицата ---------------- */

/** "Пред X% от училищата" - делът на училищата с по-ниско място. */
function aheadShare(rank, total) {
  return total > 1 ? Math.round((total - rank) / (total - 1) * 100) : 100;
}

/**
 * Факти по строги правила - само силни страни, спокоен тон, по един за изпит (без такива секцията липсва).
 * {text, apart}: text може да е списък от варианти - първият, който се събира на един ред; apart - с празен ред преди него.
 */
function highlights(ctx) {
  const out = [];
  ctx.exams.forEach((ex) => {
    const h = ex.meta.heading;
    const L = ex.latest;
    const ranked = ex.rows.filter((r) => isNum(r.natRank));
    const share = isNum(L.natRank) ? L.natRank / L.natTotal : null;
    if (share !== null && share <= 0.1) {
      let years = 0;
      for (let y = L.year; ranked.some((r) => r.year === y && r.natRank / r.natTotal <= 0.1); y--) {
        years++;
      }
      out.push({ ex, score: 100 - share * 100, text: h + ': място ' + L.natRank + ' от ' + L.natTotal + ' в страната - сред първите '
        + Math.max(1, Math.ceil(share * 100)) + '%' + (years >= 2 ? ', ' + years + ' поредни години в първите 10%' : '') });
    }
    if (isNum(L.cityRank) && L.cityRank === 1 && L.cityTotal >= 3) {
      out.push({ ex, score: 90, text: h + ': най-високият резултат в ' + ex.cityName + ' сред ' + L.cityTotal + ' училища през ' + L.year + ' г.' });
    } else if (isNum(L.cityRank) && L.cityRank <= 3 && L.cityTotal >= 8) {
      out.push({ ex, score: 55, text: h + ': място ' + L.cityRank + ' от ' + L.cityTotal + ' в ' + ex.cityName + ' през ' + L.year + ' г.' });
    }
    if (ranked.length >= 4 && isNum(L.natRank) && share > 0.1 && ranked.every((r) => r.natRank >= L.natRank)) {
      out.push({ ex, score: 70, text: h + ': най-доброто място в страната за последните ' + ranked.length + ' години - ' + L.natRank + ' от ' + L.natTotal });
    }
    const real = ex.rows.filter((r) => !r.skip);
    if (real.length >= 4 && isNum(L.bel) && isNum(L.mat) && real.every((r) => !isNum(r.bel) || r.bel <= L.bel) && real.every((r) => !isNum(r.mat) || r.mat <= L.mat)) {
      out.push({ ex, score: 65, text: h + ': най-високите резултати за последните ' + real.length + ' години - ' + ex.meta.bel + ' ' + fmt(L.bel) + ' и ' + ex.meta.mat + ' ' + fmt(L.mat) });
    }
    let above = 0;
    for (let i = real.length - 1; i >= 0; i--) {
      const r = real[i];
      if (isNum(r.bel) && isNum(r.mat) && isNum(r.natB) && isNum(r.natM) && r.bel > r.natB && r.mat > r.natM) {
        above++;
      } else {
        break;
      }
    }
    if (above >= 3) {
      out.push({ ex, score: 40 + above, text: h + ': над средното за страната и по двата предмета '
        + (above === real.length ? 'всяка година от ' + real[0].year + ' г.' : above + ' поредни години') });
    }
    const back = ranked.filter((r) => r.year <= L.year - 3).pop();
    if (back && isNum(L.natRank) && back.natRank - L.natRank >= Math.max(50, 0.1 * L.natTotal)) {
      out.push({ ex, score: 60, text: h + ': от място ' + back.natRank + ' (' + back.year + ') до място ' + L.natRank + ' (' + L.year + ') в страната' });
    }
    const g = ex.g;
    if (ctx.typeKey !== 'm' && isNum(g.nationalTypeRank) && g.nationalTypeTotal < g.nationalTotal && g.nationalTypeRank / g.nationalTypeTotal <= 0.25) {
      out.push({ ex, score: 35, text: h + ': място ' + g.nationalTypeRank + ' от ' + g.nationalTypeTotal + ' сред ' + ctx.type.definite + ' училища в страната' });
    }
  });
  out.sort((a, b) => b.score - a.score);
  // Най-силният факт за всеки изпит, после втори (по сила), докато фактите от изпитите са до 4.
  const picked = [];
  ctx.exams.forEach((ex) => {
    const best = out.find((h) => h.ex === ex);
    if (best) {
      picked.push(best);
    }
  });
  out.forEach((h) => {
    if (picked.length < 4 && !picked.includes(h) && picked.filter((p) => p.ex === h.ex).length < 2) {
      picked.push(h);
    }
  });
  // Показани по изпит (НВО 4 ... ДЗИ 12), по-силният първи; приемът след 7 клас - последен.
  picked.sort((a, b) => ctx.exams.indexOf(a.ex) - ctx.exams.indexOf(b.ex));
  const b = ctx.balove;
  if (b) {
    const mins = b.active.map((p) => p.per[b.li].min);
    const n = b.active.length;
    const count = n + (n === 1 ? ' паралелка' : ' паралелки');
    const range = n === 1 ? fmt(mins[0]) : fmt(Math.min(...mins)) + ' - ' + fmt(Math.max(...mins));
    picked.push({ apart: true, text: [
      'Прием след 7 клас: ' + count + ' през ' + b.latestYear + ' г., мин. бал на 1-во класиране ' + (n === 1 ? range : 'от ' + fmt(Math.min(...mins)) + ' до ' + fmt(Math.max(...mins))),
      'Прием след 7 клас: ' + count + ' през ' + b.latestYear + ' г., мин. бал на 1-во класиране ' + range,
      'Прием след 7 клас ' + b.latestYear + ': ' + count + ', мин. бал на 1-во класиране ' + range
    ] });
  }
  return picked;
}

/* ---------------- страници ---------------- */

function startSection(ctx, title, kind) {
  const page = ctx.doc.internal.getNumberOfPages();
  ctx.sections.push({ title, kind, page });
  ctx.doc.outline.add(null, title, { pageNumber: page });
}

/** Заглавието на вътрешна страница. */
function pageTitle(doc, title, sub) {
  font(doc, 'bold', 20, C.ink);
  doc.text(title, M, 78);
  if (sub) {
    const f = fit(doc, sub, CW, 'normal', 9.5, 8);
    font(doc, 'normal', f.size, C.muted);
    doc.text(f.text, M, 94);
  }
}

function drawCover(ctx) {
  const { doc, data, type } = ctx;
  startSection(ctx, 'Накратко', 'cover');
  fill(doc, C.primary);
  doc.rect(0, 0, W, 6, 'F');
  runs(doc, M, 34, [['НВО и ДЗИ', 'bold', 9, C.primary], ['   Профил на училище', 'normal', 9, C.muted]]);
  font(doc, 'normal', 9, C.muted);
  doc.text('Данни до ' + ctx.dataYear + ' г.', W - M, 34, { align: 'right' });

  // Името: до два реда, при нужда с по-малък шрифт.
  let size = 26;
  let lines;
  for (;;) {
    font(doc, 'bold', size, C.ink);
    lines = doc.splitTextToSize(data.fullName, CW);
    if (lines.length <= 2 || size <= 18) {
      break;
    }
    size -= 2;
  }
  let y = 84;
  lines.forEach((l, k) => doc.text(l, M, y + k * size * 1.12));
  y += (lines.length - 1) * size * 1.12;
  if (data.officialName && plain(data.officialName) !== plain(data.fullName)) {
    y = paragraph(doc, data.officialName, M, y + 25, CW, 11.5, C.text2, 1.3) - 11.5 * 1.3;
  }

  // Значки: вид, град, код, статус, уебсайт.
  y += 14;
  const [tfg, tbg] = TYPE_COLORS[ctx.typeKey] || TYPE_COLORS.m;
  const chips = [[type.label, tfg, tbg]];
  if (data.city && data.city.name) {
    chips.push([data.city.name, C.text2, C.surface]);
  }
  chips.push(['Код ' + data.code, C.text2, C.surface]);
  const closed = data.registerStatus && data.registerStatus !== 'действаща' ? (CLOSED[data.registerStatus] || CLOSED['закрита']) : null;
  if (closed) {
    chips.push([closed[0], C.closed, C.closedSoft]);
  }
  if (data.website) {
    chips.push([data.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), C.primary, C.primarySoft, data.website]);
  }
  let cx = M;
  chips.forEach(([label, fg, bg, url]) => {
    font(doc, 'medium', 8.5);
    if (cx > M && cx + doc.getTextWidth(label) + 16 > W - M) {
      cx = M;
      y += 24;
    }
    cx += chip(doc, cx, y, label, fg, bg, url) + 6;
  });
  y += 18;
  if (closed) {
    y = paragraph(doc, closed[1] + ' Резултатите са от годините, в които е работило.', M, y + 16, CW, 9, C.text2) - 9 * 1.42;
  }

  // Място в страната - ред за всеки изпит.
  y += 40;
  blockTitle(doc, y, 'Място в страната', 'последната година с резултати · разликата е от средното за страната');
  y += 12;
  hline(doc, M, W - M, y, C.faint, 0.8);
  ctx.exams.forEach((ex) => {
    const L = ex.latest;
    const top = y;
    font(doc, 'bold', 11.5, C.ink);
    doc.text(ex.meta.heading, M, top + 19);
    const students = L.bu || L.mu;
    font(doc, 'normal', 8.5, C.muted);
    doc.text(L.year + ' г.' + (students ? ' · ' + students + ' ученици' : ''), M, top + 32);

    const bx = M + 128;
    const bw = 200;
    if (isNum(L.natRank)) {
      const ahead = aheadShare(L.natRank, L.natTotal);
      fill(doc, C.track);
      doc.roundedRect(bx, top + 12, bw, 6, 3, 3, 'F');
      fill(doc, C.primary);
      doc.roundedRect(bx, top + 12, Math.max(6, bw * ahead / 100), 6, 3, 3, 'F');
      font(doc, 'normal', 8, C.muted);
      doc.text('пред ' + ahead + '% от училищата в страната', bx, top + 31);
    }
    const parts = [];
    [[ex.meta.bel, L.bel, L.natB], [ex.meta.mat, L.mat, L.natM]].forEach(([label, v, n], k) => {
      if (k) {
        parts.push(['     ', 'normal', 8.5]);
      }
      parts.push([label + ' ', 'normal', 8.5, C.muted], [fmt(v), 'medium', 8.5, C.ink]);
      if (isNum(v) && isNum(n)) {
        parts.push(['  ' + signed(v - n), 'medium', 8.5, deltaColor(v - n)]);
      }
    });
    runs(doc, bx, top + 44, parts);

    if (isNum(L.natRank)) {
      runs(doc, W - M, top + 22, [[String(L.natRank), 'bold', 19, C.ink], [' / ' + L.natTotal, 'normal', 10, C.muted]], 'right');
    } else {
      font(doc, 'normal', 9, C.muted);
      doc.text('без място - липсва предмет', W - M, top + 22, { align: 'right' });
    }
    const sub = [];
    if (isNum(L.cityRank) && ex.cityName) {
      sub.push('в ' + ex.cityName + ' ' + L.cityRank + ' / ' + L.cityTotal);
    }
    if (isNum(ex.g.medianRank) && ex.g.medianEndYear === L.year) {
      sub.push('за 3 г. ' + ex.g.medianRank + ' / ' + ex.g.medianTotal);
    }
    sub.forEach((t, k) => {
      const f = fit(doc, t, 150, 'normal', 8, 7);
      font(doc, 'normal', f.size, C.muted);
      doc.text(f.text, W - M, top + 34 + k * 10.5, { align: 'right' });
    });
    y = top + 58;
    hline(doc, M, W - M, y);
  });

  // Долу: съдържанието вляво и QR кодът вдясно, над долния колонтитул.
  const last = H - 56;
  ctx.tocY = last - (ctx.tocCount - 1) * 13.5 - 15;
  const q = 74;
  const qy = Math.min(last + 3 - q, ctx.tocY - 9);

  // Акценти - докъдето има място над долния блок.
  const facts = highlights(ctx);
  const limit = Math.min(ctx.tocY, qy) - 28;
  if (facts.length && y + 60 < limit) {
    y += 34;
    blockTitle(doc, y, 'Акценти');
    y += 10;
    font(doc, 'normal', 9.5, C.ink);
    const blocks = [];
    let h = 12;
    facts.forEach((f, k) => {
      const variants = [].concat(f.text);
      const text = variants.find((t) => doc.getTextWidth(t) <= CW - 40) || variants[variants.length - 1];
      const ls = doc.splitTextToSize(text, CW - 40);
      const gap = f.apart && k > 0 ? 13 : 0;
      if (y + h + gap + ls.length * 13 + 12 <= limit) {
        blocks.push({ ls, gap });
        h += gap + ls.length * 13 + 6;
      }
    });
    fill(doc, C.primarySoft);
    doc.roundedRect(M, y, CW, h + 6, 8, 8, 'F');
    let ty = y + 21;
    blocks.forEach(({ ls, gap }) => {
      ty += gap;
      fill(doc, C.primary);
      doc.circle(M + 18, ty - 3.2, 2, 'F');
      font(doc, 'normal', 9.5, C.ink);
      ls.forEach((l, k) => doc.text(l, M + 30, ty + k * 13));
      ty += ls.length * 13 + 6;
    });
  }

  // QR код към страницата на училището.
  const url = SITE_URL + 'school/' + data.code + '/';
  qrCode(doc, url, W - M - q, qy, q);
  const tx = W - M - q - 14;
  font(doc, 'bold', 9, C.ink);
  doc.text('Пълният профил', tx, qy + 18, { align: 'right' });
  font(doc, 'normal', 8, C.muted);
  ['интерактивни графики, класации', 'и сравнение с други училища'].forEach((l, k) => doc.text(l, tx, qy + 31 + k * 10.5, { align: 'right' }));
  const link = SITE + '/school/' + data.code + '/';
  font(doc, 'medium', 8, C.primary);
  doc.text(link, tx, qy + 60, { align: 'right' });
  doc.link(tx - doc.getTextWidth(link), qy + 52, doc.getTextWidth(link), 11, { url });
}

/** Съдържанието на корицата (номерата на страниците се знаят накрая). */
function drawToc(ctx) {
  const { doc } = ctx;
  doc.setPage(1);
  let y = ctx.tocY;
  font(doc, 'bold', 9, C.ink);
  doc.text('Съдържание', M, y);
  y += 15;
  const right = M + 230;
  ctx.sections.filter((s) => s.kind !== 'cover').forEach((s) => {
    font(doc, 'normal', 8.5, C.text2);
    doc.text(s.title, M, y);
    const tw = doc.getTextWidth(s.title);
    font(doc, 'medium', 8.5, C.ink);
    doc.text(String(s.page), right, y, { align: 'right' });
    const nw = doc.getTextWidth(String(s.page));
    stroke(doc, C.faint, 0.7);
    doc.setLineCap('round');
    doc.setLineDashPattern([0.1, 2.6], 0);
    doc.line(M + tw + 5, y - 1, right - nw - 5, y - 1);
    doc.setLineDashPattern([], 0);
    doc.link(M, y - 9, right - M, 12, { pageNumber: s.page });
    y += 13.5;
  });
}

function drawExam(ctx, ex) {
  const { doc, type } = ctx;
  const { meta, rows, latest: L, g } = ex;
  const real = rows.filter((r) => !r.skip);
  pageTitle(doc, meta.heading, [meta.long, span(rows[0].year, rows[rows.length - 1].year), ex.cityName].filter(Boolean).join(' · '));

  // KPI плочки
  let y = 108;
  const tw = (CW - 3 * 8) / 4;
  const th = 66;
  const prev = real.filter((r) => r.year === L.year - 1)[0];
  const tile = (k, label, value, lines) => {
    const x = M + k * (tw + 8);
    fill(doc, C.surface);
    doc.roundedRect(x, y, tw, th, 6, 6, 'F');
    const f = fit(doc, label, tw - 20, 'medium', 7.5, 6.5);
    font(doc, 'medium', f.size, C.muted);
    doc.text(f.text, x + 10, y + 15);
    runs(doc, x + 10, y + 35, value);
    lines.forEach((parts, i) => {
      // по-малък шрифт, ако редът не се събира
      let k = 1;
      const scaled = () => parts.map(([t, st, sz, col]) => [t, st, sz * k, col]);
      while (runsWidth(doc, scaled()) > tw - 18 && k > 0.8) {
        k -= 0.04;
      }
      runs(doc, x + 10, y + 48 + i * 10.5, scaled());
    });
  };
  [[meta.bel, L.bel, L.natB, prev && prev.bel], [meta.mat, L.mat, L.natM, prev && prev.mat]].forEach(([label, v, n, p], k) => {
    const lines = [];
    if (isNum(v) && isNum(n)) {
      lines.push([[signed(v - n), 'medium', 8, deltaColor(v - n)], [' от страната', 'normal', 8, C.muted]]);
    }
    if (isNum(v) && isNum(p)) {
      lines.push([[signed(v - p), 'medium', 8, deltaColor(v - p)], [' от ' + prev.year + ' г.', 'normal', 8, C.muted]]);
    }
    tile(k, label + ' ' + L.year, [[fmt(v), 'bold', 17, C.ink]], lines);
  });
  const rankValue = (r, t) => (isNum(r) ? [[String(r), 'bold', 17, C.ink], [' / ' + t, 'normal', 9, C.muted]] : [['-', 'bold', 17, C.muted]]);
  const small = (label, r, t) => [[label + ' ', 'normal', 8, C.muted], [r + ' / ' + t, 'medium', 8, C.text2]];
  const natLines = [];
  if (isNum(g.nationalTypeRank) && g.nationalTypeTotal > 1 && g.nationalTypeTotal !== g.nationalTotal && g.latestYear === L.year) {
    natLines.push(small('сред ' + type.definite, g.nationalTypeRank, g.nationalTypeTotal));
  }
  if (isNum(g.medianRank) && g.medianEndYear === L.year) {
    natLines.push(small('за 3 г.', g.medianRank, g.medianTotal));
  }
  tile(2, 'Място в страната', rankValue(L.natRank, L.natTotal), natLines);
  const cityLines = [];
  if (isNum(g.cityTypeRank) && g.cityTypeTotal > 1 && g.cityTypeTotal !== g.cityTotal && g.latestYear === L.year) {
    cityLines.push(small('сред ' + type.definite, g.cityTypeRank, g.cityTypeTotal));
  }
  const students = L.bu || L.mu;
  if (students) {
    cityLines.push([[String(students), 'medium', 8, C.text2], [' ученици', 'normal', 8, C.muted]]);
  }
  tile(3, ex.cityName ? 'Място в ' + ex.cityName : 'Място в града', rankValue(L.cityRank, L.cityTotal), cityLines);

  // Лента с обобщение: средно за 3 г., най-добро място, най-високи резултати.
  y += th + 12;
  const cells = [];
  const last3 = real.filter((r) => r.year > L.year - 3 && r.year <= L.year);
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const avgB = mean(last3.map((r) => r.bel).filter(isNum));
  const avgM = mean(last3.map((r) => r.mat).filter(isNum));
  if (last3.length >= 2) {
    cells.push(['Средно за последните 3 г.', meta.bel + ' ' + fmt(avgB) + ' · ' + meta.mat + ' ' + fmt(avgM)]);
  }
  const ranked = real.filter((r) => isNum(r.natRank));
  if (ranked.length >= 2) {
    const best = ranked.reduce((a, b) => (b.natRank < a.natRank ? b : a));
    cells.push(['Най-добро място в страната', best.natRank + ' от ' + best.natTotal + ' (' + best.year + ')']);
  }
  [[meta.bel, 'bel'], [meta.mat, 'mat']].forEach(([label, key]) => {
    const vals = real.filter((r) => isNum(r[key]));
    if (vals.length >= 2) {
      const best = vals.reduce((a, b) => (b[key] > a[key] ? b : a));
      cells.push(['Най-висок резултат ' + label, fmt(best[key]) + ' (' + best.year + ')']);
    }
  });
  if (cells.length) {
    const cw = CW / cells.length;
    cells.forEach(([label, value], k) => {
      const x = M + k * cw;
      if (k) {
        stroke(doc, C.line, 0.6);
        doc.line(x, y + 2, x, y + 26);
      }
      const px = k ? x + 12 : x;
      const fl = fit(doc, label, cw - 16, 'normal', 7.5, 6.5);
      font(doc, 'normal', fl.size, C.muted);
      doc.text(fl.text, px, y + 10);
      const fv = fit(doc, value, cw - 16, 'medium', 9.5, 8);
      font(doc, 'medium', fv.size, C.ink);
      doc.text(fv.text, px, y + 24);
    });
    y += 34;
  }

  // Графики БЕЛ / МАТ: училището, средното за вида в града, средното за страната (поне 2 години).
  const years = rows.map((r) => r.year);
  const gaps = rows.map((r, i) => (r.skip ? i : -1)).filter((i) => i >= 0);
  if (real.filter((r) => isNum(r.bel) || isNum(r.mat)).length >= 2) {
    y += 22;
    const pw = (CW - 20) / 2;
    [[meta.bel, 'bel', 'natB', 'cityB', C.bel], [meta.mat, 'mat', 'natM', 'cityM', C.mat]].forEach(([label, key, natKey, cityKey, color], k) => {
      const x = M + k * (pw + 20);
      font(doc, 'bold', 10, C.ink);
      doc.text(label, x, y);
      font(doc, 'normal', 8, C.muted);
      doc.text(ex.grade === '12' ? 'оценка (2-6)' : 'точки (0-100)', x + pw, y, { align: 'right' });
      const own = rows.map((r) => (isNum(r[key]) ? r[key] : null));
      const nat = rows.map((r) => r[natKey]);
      const cty = rows.map((r) => r[cityKey]);
      const sc = niceScale([...own, ...nat, ...cty], meta.min, meta.max, meta.steps);
      const dec = sc.step < 1 ? 2 : 0;
      lineChart(doc, { x, y: y + 8, w: pw, h: 112 }, {
        years, lo: sc.lo, hi: sc.hi, noExam: gaps,
        axis: { step: sc.step, format: (v) => v.toFixed(dec) },
        series: [
          ...(ex.hasCityAvg ? [{ data: cty, color: C.city, width: 1.2, dash: [3.5, 2.5] }] : []),
          { data: nat, color: C.nation, width: 1.3, dash: [0.1, 2.6] },
          { data: own, color, width: 1.9, markers: true }
        ],
        labels: { series: ex.hasCityAvg ? 2 : 1, format: (v) => fmt(v) }
      });
    });
    y += 8 + 112 + 30;
    legend(doc, M, y, [
      { swatch: (x, sy) => { swatchLine(doc, C.bel)(x, sy); stroke(doc, C.mat, 1.6); doc.line(x + 9, sy, x + 16, sy); }, label: 'Училището (' + meta.bel + ' / ' + meta.mat + ')' },
      ...(ex.hasCityAvg ? [{ swatch: swatchLine(doc, C.city, [3.5, 2.5], 1.2), label: 'Средно за ' + type.definite + ' в ' + ex.cityName }] : []),
      { swatch: swatchLine(doc, C.nation, [0.1, 2.6], 1.4), label: 'Средно за страната' }
    ]);
  }

  // Мястото в страната по години (обърната ос - горе е по-доброто място).
  const rankData = rows.map((r) => (isNum(r.natRank) ? r.natRank : null));
  if (rankData.filter(isNum).length >= 2) {
    y += 32;
    blockTitle(doc, y, 'Място в страната по години', 'по средното от ' + meta.bel + ' и ' + meta.mat + ' · 1 = най-високият резултат');
    const vals = rankData.filter(isNum);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = Math.max((hi - lo) * 0.12, 5);
    lineChart(doc, { x: M, y: y + 8, w: CW, h: 62 }, {
      years, lo: Math.max(1, lo - pad), hi: hi + pad, invert: true, noExam: gaps,
      series: [{ data: rankData, color: C.primary, width: 1.9, markers: true }],
      labels: { series: 0, all: true, format: (v) => String(v), color: C.ink }
    });
    y += 8 + 62 + 14;
  }

  // Таблица по години
  y += 30;
  blockTitle(doc, y, 'Резултати по години', 'разлика от средното за страната · място в страната и в града');
  const body = [];
  const noExam = [];
  rows.slice().reverse().forEach((r) => {
    if (r.skip) {
      noExam.push(r.year);
      body.push([String(r.year), { content: meta.heading + ' не е провеждано през ' + r.year + ' г.', colSpan: 7, styles: { halign: 'left', textColor: C.muted } }]);
      return;
    }
    const students = isNum(r.bu) && isNum(r.mu) && r.bu !== r.mu ? r.bu + ' / ' + r.mu : String(r.bu || r.mu || '-');
    body.push([
      String(r.year),
      fmt(r.bel), isNum(r.bel) && isNum(r.natB) ? signed(r.bel - r.natB) : '-',
      fmt(r.mat), isNum(r.mat) && isNum(r.natM) ? signed(r.mat - r.natM) : '-',
      students,
      isNum(r.natRank) ? r.natRank + ' / ' + r.natTotal : '-',
      isNum(r.cityRank) ? r.cityRank + ' / ' + r.cityTotal : '-'
    ]);
  });
  doc.autoTable(tableOptions({
    head: [['Година', meta.bel, 'Δ страна', meta.mat, 'Δ страна', 'Ученици', 'В страната', ex.cityName ? 'В ' + ex.cityName : 'В града']],
    body,
    startY: y + 8,
    columnStyles: { 0: { halign: 'left', cellWidth: 46 } },
    didParseCell: (d) => {
      if (d.section === 'head' && d.column.index === 0) {
        d.cell.styles.halign = 'left';
      }
      if (d.section !== 'body') {
        return;
      }
      if (d.row.index === 0) {
        d.cell.styles.fontStyle = 'medium';
      }
      if ((d.column.index === 2 || d.column.index === 4) && typeof d.cell.raw === 'string') {
        d.cell.styles.textColor = d.cell.raw === '-' ? C.faint : deltaColor(parseFloat(d.cell.raw));
      } else if (d.cell.raw === '-') {
        d.cell.styles.textColor = C.faint;
      }
    }
  }));
}

/** Близки по успех в града: за всеки изпит училищата около това в класацията на града. */
function drawNeighbors(ctx) {
  const { doc, data } = ctx;
  const exams = ctx.exams.filter((ex) => ex.city);
  const cityName = exams[0].cityName;
  pageTitle(doc, 'Близки по успех в ' + cityName, 'Училищата около ' + data.fullName + ' в класацията на града');
  let y = 124;
  const rowH = 15.8;
  const nameW = CW - 46 - 40 - 3 * 60 - 8; // колоната "Училище" без отстъпите
  const per = Math.floor((BOTTOM - 30 - y) / exams.length);
  exams.forEach((ex) => {
    const list = ex.city;
    const L = ex.latest;
    let n = Math.min(list.length, 7, Math.max(2, Math.floor((per - 44) / rowH)));
    if (list.length > n && n % 2 === 0) {
      n--; // нечетен брой - училището е по средата
    }
    const pos = list.findIndex((x) => x.code === data.code);
    const start = Math.min(Math.max(0, pos - Math.floor(n / 2)), list.length - n);
    const part = list.slice(start, start + n);
    blockTitle(doc, y, ex.meta.heading + ', ' + L.year, (n === list.length ? 'всички ' + list.length + ' училища в града' : 'място в града от ' + list.length + ' училища')
      + ' · по средното от ' + ex.meta.bel + ' и ' + ex.meta.mat);
    const selfRow = part.findIndex((x) => x.code === data.code);
    doc.autoTable(tableOptions({
      head: [['Място', 'Училище', 'Вид', ex.meta.bel, ex.meta.mat, 'Средно']],
      body: part.map((x) => [String(x.place), x.name, schoolType(x.type).letter, fmt(x.bel), fmt(x.mat), fmt(x.avg)]),
      startY: y + 8,
      styles: Object.assign(tableOptions().styles, { cellPadding: { top: 3.4, bottom: 3.4, left: 4, right: 4 } }),
      columnStyles: { 0: { cellWidth: 46 }, 1: { halign: 'left' }, 2: { cellWidth: 40 }, 3: { cellWidth: 60 }, 4: { cellWidth: 60 }, 5: { cellWidth: 60 } },
      didParseCell: (d) => {
        if (d.column.index === 1) {
          d.cell.styles.halign = 'left';
        }
        if (d.section === 'body' && d.row.index === selfRow) {
          d.cell.styles.fillColor = C.primarySoft;
          d.cell.styles.fontStyle = 'bold';
        }
        // дългите имена - с по-малък шрифт, за да остане редът на един ред
        if (d.section === 'body' && d.column.index === 1) {
          const f = fit(doc, String(d.cell.raw), nameW, d.cell.styles.fontStyle, 8.5, 7);
          d.cell.styles.fontSize = f.size;
        }
      }
    }));
    y = doc.lastAutoTable.finalY + 32;
  });
  if (y - 14 < BOTTOM) {
    font(doc, 'normal', 8, C.muted);
    doc.text('Вид: ' + ['s', 'm', 'p', 'r'].map((k) => schoolType(k).letter + ' - ' + schoolType(k).lower).join(', '), M, y - 14);
  }
}

function drawBalove(ctx) {
  const { doc } = ctx;
  const b = ctx.balove;
  pageTitle(doc, 'Прием след 7 клас', ['Балове от класиранията на РУО', b.cityName, span(b.firstYear, b.latestYear)].join(' · '));
  let y = paragraph(doc, 'Минималният бал е най-ниският бал, с който е приет ученик в паралелката, а максималният - най-високият. '
    + 'На следващите класирания се освобождават места и минималният бал обикновено пада.', M, 118, CW, 9, C.text2);

  // Паралелките от последната година: от минималния до максималния бал на първото класиране.
  y += 26;
  blockTitle(doc, y, 'Паралелки през ' + b.latestYear + ' г.', 'от минималния до максималния бал на 1-во класиране');
  y += 14;
  const li = b.li;
  const lo = Math.floor(Math.min(...b.active.map((p) => p.per[li].min)) / 10) * 10;
  const hi = Math.ceil(Math.max(...b.active.map((p) => p.per[li].max)) / 10) * 10;
  const labelW = 214;
  const ax0 = M + labelW + 40;
  const ax1 = W - M - 40;
  const xAt = (v) => (hi > lo ? ax0 + (ax1 - ax0) * (v - lo) / (hi - lo) : (ax0 + ax1) / 2);
  const step = [5, 10, 20, 25, 50, 100].find((s) => (hi - lo) / s <= 6) || 100;
  const gridTop = y;
  b.active.forEach((p) => {
    font(doc, 'normal', 8, C.ink);
    const ls = doc.splitTextToSize(p.name, labelW).slice(0, 2);
    const rh = ls.length > 1 ? 24 : 17;
    const cy = y + rh / 2;
    ls.forEach((l, k) => doc.text(l, M, cy + 2.8 - (ls.length - 1) * 4.6 + k * 9.2));
    const v = p.per[li];
    const x1 = xAt(v.min);
    const x2 = xAt(v.max);
    fill(doc, C.primarySoft2);
    doc.roundedRect(x1 - 3.5, cy - 3.5, Math.max(7, x2 - x1 + 7), 7, 3.5, 3.5, 'F');
    fill(doc, C.primary);
    doc.circle(x1, cy, 3, 'F');
    if (x2 - x1 > 1) {
      doc.circle(x2, cy, 3, 'F');
    }
    font(doc, 'medium', 7.5, C.ink);
    doc.text(fmt(v.min), x1 - 7, cy + 2.6, { align: 'right' });
    font(doc, 'normal', 7.5, C.muted);
    doc.text(fmt(v.max), x2 + 7, cy + 2.6);
    y += rh;
  });
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    stroke(doc, C.line, 0.5);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(xAt(v), gridTop - 4, xAt(v), y + 2);
    doc.setLineDashPattern([], 0);
    font(doc, 'normal', 7, C.faint);
    doc.text(String(v), xAt(v), y + 12, { align: 'center' });
  }
  y += 14;

  // История по години (активните паралелки първо).
  y += 30;
  if (y > BOTTOM - 80) {
    doc.addPage();
    y = TOP + 26;
  }
  blockTitle(doc, y, 'Минимален бал на 1-во класиране по години', '"-" - паралелката не е обявена или няма данни');
  const head = ['Паралелка', ...b.years.map(String), 'Последно класиране ' + b.latestYear];
  const body = [...b.active, ...b.rest].map((p) => {
    const lastV = p.per[li];
    return [p.name, ...p.per.map((v) => (v ? fmt(v.min) : '-')),
      lastV ? fmt(lastV.lastMin) + ' (' + KLASIRANE[lastV.lastNo] + ')' : '-'];
  });
  const restFrom = b.active.length;
  doc.autoTable(tableOptions({
    head: [head],
    body,
    startY: y + 8,
    rowPageBreak: 'avoid',
    columnStyles: { 0: { halign: 'left', cellWidth: 200 }, [b.years.length + 1]: { cellWidth: 96 } },
    didParseCell: (d) => {
      if (d.column.index === 0) {
        d.cell.styles.halign = 'left';
      }
      if (d.section !== 'body') {
        return;
      }
      if (d.row.index >= restFrom && d.column.index === 0) {
        d.cell.styles.textColor = C.muted;
      }
      if (d.cell.raw === '-') {
        d.cell.styles.textColor = C.faint;
      } else if (d.column.index === b.years.length && d.row.index < restFrom) {
        d.cell.styles.fontStyle = 'medium';
      }
    }
  }));
  const fy = doc.lastAutoTable.finalY + 16;
  if (fy < BOTTOM - 10) {
    paragraph(doc, 'Последно класиране - минималният бал на последното класиране с данни (в скоби - кое е то). '
      + 'Имената на паралелките са както в класиранията на РУО.', M, fy, CW, 8, C.muted);
  }
}

function drawMethod(ctx) {
  const { doc, type } = ctx;
  pageTitle(doc, 'Как да четем данните', 'Обяснения на понятията и източници');
  const items = [
    ['Място в страната', 'Всяка година училищата се подреждат по средното от двата предмета - БЕЛ и МАТ (за ДЗИ - БЕЛ и ДЗИ-2). '
      + 'Участват само училищата с резултат и по двата предмета. Място 1 е най-високият резултат. '
      + '"Пред 76% от училищата" означава, че 76% от училищата в страната са на по-ниско място.'],
    ['Място в града и сред ' + type.definite, 'Същата подредба само за училищата в града или само за училищата от същия вид - '
      + 'държавни, общински, частни или духовни, според регистъра на МОН.'],
    ['Място за 3 години', 'Подредба по средните резултати от последните 3 години - една по-слаба или по-силна година тежи по-малко. '
      + 'На сайта е "Медианен ранг (3 г.)".'],
    ['Разлика от средното за страната', 'Средното за страната е средното на всички училища с резултат по предмета - '
      + 'всяко училище тежи еднакво, независимо от броя на учениците. +5.00 означава 5 точки над това средно (при ДЗИ - единици от оценката).'],
    ['Защо мястото, а не само точките', 'Изпитите са различни всяка година и средните резултати в страната се променят. '
      + 'Затова 70 точки през една година не са непременно повече от 65 точки през друга. Мястото сравнява училището с всички останали в една и съща година.']
  ];
  if (ctx.exams.some((ex) => ex.hasCityAvg)) {
    items.push(['Средно за ' + type.definite + ' в града', 'Средното на училищата от същия вид в същия град - за сравнение с най-близките училища.']);
  }
  if (ctx.balove) {
    items.push(['Прием след 7 клас', 'Баловете са от класиранията на РУО - минималният и максималният бал на приетите ученици за всяка паралелка. '
      + 'Балът се образува от резултатите от НВО 7 клас и оценки от свидетелството по правила, определени за всяка паралелка.']);
  }
  const from = ctx.exams.map((ex) => ex.meta.heading + ' - от ' + displayRange(ex.grade, ex.rows[ex.rows.length - 1].year).from + ' г.');
  const gap = ctx.exams.some((ex) => ex.rows.some((r) => r.skip)) ? ' НВО 4 клас не е провеждано през 2020 г.' : '';
  items.push(['Кои години', 'За всеки изпит са показани последните до ' + MAX_YEARS + ' години (' + from.join(', ') + ').' + gap
    + ' По-старите години са в CSV и JSON API на сайта.']);
  items.push(['Източници', 'Резултатите от НВО и ДЗИ са от Портала за отворени данни (data.egov.bg, МОН). Баловете са от РУО. '
    + 'Видът и статусът на училището са от Регистъра на институциите на МОН.']);

  let y = 128;
  items.forEach(([title, text]) => {
    font(doc, 'bold', 10, C.ink);
    doc.text(title, M, y);
    y = paragraph(doc, text, M, y + 15, CW, 9, C.text2) + 12;
  });

  // Бележка и сайтът
  y += 6;
  const note = 'Резултатите от изпитите показват само част от работата на едно училище и не измерват всичко, което то дава на учениците си. '
    + 'Затова профилът е добре да се допълни с други източници - разговор с училището, мнения на родители и ученици.';
  const about = SITE + ' - безплатен сайт с отворени данни: интерактивни графики, класации по градове, сравнение на училища и балове. '
    + 'Профилът е създаден на ' + today() + ' г.';
  font(doc, 'normal', 9);
  const h = (doc.splitTextToSize(note, CW - 32).length + doc.splitTextToSize(about, CW - 32).length) * 9 * 1.42 + 40;
  if (y + h < BOTTOM) {
    fill(doc, C.primarySoft);
    doc.roundedRect(M, y, CW, h, 8, 8, 'F');
    let ty = paragraph(doc, note, M + 16, y + 22, CW - 32, 9, C.ink);
    ty = paragraph(doc, about, M + 16, ty + 8, CW - 32, 9, C.text2);
    doc.link(M, y, CW, h, { url: SITE_URL });
  }
}

/** Горен и долен колонтитул на всяка страница (накрая - тогава се знае броят им). */
function drawChrome(ctx) {
  const { doc, data } = ctx;
  const pages = doc.internal.getNumberOfPages();
  const url = SITE_URL + 'school/' + data.code + '/';
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const sec = ctx.sections.filter((s) => s.page <= p).pop();
    if (p > 1) {
      font(doc, 'medium', 7.5, C.muted);
      doc.text(sec.title, M, 32);
      const f = fit(doc, data.fullName, CW - doc.getTextWidth(sec.title) - 40, 'normal', 7.5, 6.5);
      font(doc, 'normal', f.size, C.muted);
      doc.text(f.text, W - M, 32, { align: 'right' });
      hline(doc, M, W - M, 40);
    }
    hline(doc, M, W - M, H - 38);
    font(doc, 'normal', 7.5, C.muted);
    const link = SITE + '/school/' + data.code + '/';
    doc.text(link, M, H - 25);
    doc.link(M, H - 33, doc.getTextWidth(link), 11, { url });
    const source = sec.kind === 'exam' || sec.kind === 'city' ? 'Източник: МОН, data.egov.bg' : sec.kind === 'balove' ? 'Източник: РУО ' + ctx.balove.cityName : '';
    if (source) {
      doc.text(source, W / 2, H - 25, { align: 'center' });
    }
    font(doc, 'medium', 7.5, C.text2);
    doc.text(p + ' / ' + pages, W - M, H - 25, { align: 'right' });
  }
}

/* ---------------- вход ---------------- */

async function newBrochureDoc() {
  await loadScript('js/jspdf.umd.min.js');
  await Promise.all([loadScript('js/jspdf.plugin.autotable.min.js'), loadScript('js/qrcode.min.js')]);
  const ns = window.jspdf;
  if (!ns || !ns.jsPDF || typeof ns.jsPDF.API.autoTable !== 'function' || typeof window.qrcode !== 'function') {
    throw new Error('jsPDF is not available');
  }
  const files = await Promise.all(FONTS.map(([f]) => fetchBase64('fonts/inter-pdf/' + f)));
  const doc = new ns.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  FONTS.forEach(([f, style], k) => {
    doc.addFileToVFS(f, files[k]);
    doc.addFont(f, FONT, style);
  });
  doc.setFont(FONT, 'normal');
  return doc;
}

/** Брошурата като jsPDF документ (без запис) - за schoolBrochurePdf и за проверки. */
export async function buildSchoolBrochure(data) {
  const typeKey = typeKeyFromApi(data.financing, data.isPrivate) || 'm';
  const grades = GRADES.filter((g) => data.grades && data.grades[g]);
  const [doc, exams, balove] = await Promise.all([
    newBrochureDoc(),
    Promise.all(grades.map((g) => examData(data, g, typeKey))),
    baloveData(data).catch(() => null)
  ]);
  const ctx = { doc, data, typeKey, type: schoolType(typeKey), exams: exams.filter(Boolean), balove, sections: [] };
  ctx.dataYear = Math.max(...ctx.exams.map((ex) => ex.latest.year), balove ? balove.latestYear : 0);
  const neighbors = ctx.exams.some((ex) => ex.city);
  ctx.tocCount = ctx.exams.length + (neighbors ? 1 : 0) + (balove ? 1 : 0) + 1;
  drawCover(ctx);
  ctx.exams.forEach((ex) => {
    doc.addPage();
    startSection(ctx, ex.meta.heading, 'exam');
    drawExam(ctx, ex);
  });
  if (balove) {
    doc.addPage();
    startSection(ctx, 'Прием след 7 клас', 'balove');
    drawBalove(ctx);
  }
  if (neighbors) {
    doc.addPage();
    startSection(ctx, 'Близки по успех в ' + ctx.exams.find((ex) => ex.city).cityName, 'city');
    drawNeighbors(ctx);
  }
  doc.addPage();
  startSection(ctx, 'Как да четем данните', 'method');
  drawMethod(ctx);
  drawToc(ctx);
  drawChrome(ctx);
  doc.setProperties({
    title: data.fullName + (data.city && data.city.name ? ' (' + data.city.name + ')' : '') + ' - профил на училище',
    subject: 'Резултати от НВО и ДЗИ, места в класациите и балове',
    author: 'Иван Давидов - ' + SITE,
    keywords: 'НВО, ДЗИ, ' + data.fullName + ', ' + data.code,
    creator: SITE
  });
  return doc;
}

/** Изтегля брошурата за училище по документа му от API-то (schools/{code}.json). */
export async function schoolBrochurePdf(data) {
  const doc = await buildSchoolBrochure(data);
  const safe = String(data.fullName || '').replace(/[^a-zA-Z0-9Ѐ-ӿ]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  doc.save('nvo-dzi-' + data.code + (safe ? '-' + safe : '') + '.pdf');
}

/** Същото по код (страниците по класове нямат документа на училището). */
export async function schoolBrochureByCode(code) {
  return schoolBrochurePdf(await siteJson('api/v1/schools/' + code + '.json'));
}

