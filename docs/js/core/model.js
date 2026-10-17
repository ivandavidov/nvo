// Модел на данните за един клас: зареждане на data/grade-{g}.json и същите
// трансформации и изчисления като старите logic-core.js / logic-city.js /
// logic-ranking.js (пренесени 1:1, включително реда им и крайните случаи).
import { gradeConfig, NAV_FIRST_YEAR, TOP_GROUPS } from './config.js';

const cache = {};

export function fetchGradeData(grade, dataUrl) {
  if (!cache[grade]) {
    cache[grade] = fetch(dataUrl).then((r) => {
      if (!r.ok) {
        throw new Error('HTTP ' + r.status + ' for ' + dataUrl);
      }
      return r.json();
    });
  }
  return cache[grade];
}

function copySchools(raw) {
  return raw.map((o) => (o ? {
    l: o.l, n: o.n, w: o.w, c: o.c,
    b: o.b.slice(), m: o.m.slice(), bu: o.bu.slice(), mu: o.mu.slice()
  } : o));
}

function copyCities(raw) {
  const si = {};
  Object.keys(raw).forEach((name) => {
    const c = raw[name];
    si[name] = Object.assign({}, c, { n: c.n ? c.n.slice() : c.n, p: c.p ? c.p.slice() : c.p });
  });
  return si;
}

function safeDivide(numerator, denominator, fallback = 0) {
  return denominator ? numerator / denominator : fallback;
}

/**
 * @param {number} grade
 * @param {{s: Array, si: Object}} raw съдържанието на data/grade-{g}.json
 * @param {{year?: string|number|null}} opts year = ?year= за исторически изглед
 */
export function buildModel(grade, raw, opts = {}) {
  const cfg = gradeConfig(grade);
  const s = copySchools(raw.s);
  const si = copyCities(raw.si);
  const base = cfg.baseSchoolIndex;
  const firstYear = cfg.firstYear;
  const dataLatestYear = firstYear + s[base].b.length - 1;
  let numYears = cfg.numYears;
  let timeTravelYear = null;

  // calculateTimeTravel
  if (opts.year !== undefined && opts.year !== null && opts.year !== '') {
    const parsed = Number.parseInt(opts.year, 10);
    if (Number.isInteger(parsed)) {
      const minYear = Math.max(NAV_FIRST_YEAR, firstYear);
      const maxYear = dataLatestYear - 1;
      if (maxYear >= minYear) {
        const target = Math.min(Math.max(parsed, minYear), maxYear);
        timeTravelYear = target;
        const remove = dataLatestYear - target;
        for (let k = 0; k < remove; k++) {
          for (let j = 0; j < s.length; j++) {
            if (!s[j]) {
              continue;
            }
            s[j].b.pop();
            s[j].m.pop();
            s[j].bu.pop();
            s[j].mu.pop();
          }
        }
        numYears = 3;
      }
    }
  }

  // fixForYear2018 (7 клас: точките от 2018 са по друга скала)
  if (cfg.fix2018) {
    const i = 2018 - firstYear;
    if (i >= 0) {
      s.forEach((o) => {
        if (!o) {
          return;
        }
        if (o.b[i] !== null) {
          o.b[i] = Math.floor(o.b[i] * 10000 / 65 + Number.EPSILON) / 100;
        }
        if (o.m[i] !== null) {
          o.m[i] = Math.floor(o.m[i] * 10000 / 65 + Number.EPSILON) / 100;
        }
      });
    }
  }

  // fixForMissingYears
  const totalYears = s[base].b.length;
  s.forEach((o) => {
    if (!o) {
      return;
    }
    for (let i = o.b.length; i < totalYears; i++) {
      o.b.push(null);
      o.m.push(null);
    }
    for (let i = o.bu.length; i < totalYears; i++) {
      o.bu.push(0);
      o.mu.push(0);
    }
  });

  // disableEntries
  (cfg.disabledEntries || []).forEach((idx) => {
    const school = s[idx];
    school.b[school.b.length - 1] = null;
    school.m[school.m.length - 1] = null;
    school.bu[school.bu.length - 1] = null;
    school.mu[school.mu.length - 1] = null;
  });

  computeSchoolMedians(s);
  computeCityMediansBySchool(s, si, totalYears);
  computeCityMediansByAttendees(s, si, totalYears);

  return {
    grade: cfg.grade,
    cfg,
    s,
    si,
    firstYear,
    totalYears,
    latestYear: firstYear + totalYears - 1,
    dataLatestYear,
    numYears,
    timeTravelYear
  };
}

/** Средно за последните 3 години (без празните) → o.mb / o.mm. */
export function computeSchoolMedians(s) {
  s.forEach((o) => {
    if (!o) {
      return;
    }
    let mb = 0;
    let mm = 0;
    const n = 3;
    let dividerB = n;
    let dividerM = n;
    for (let i = 1; i <= n; i++) {
      if (!o.b[o.b.length - i]) {
        --dividerB;
      } else {
        mb += o.b[o.b.length - i];
      }
      if (!o.m[o.m.length - i]) {
        --dividerM;
      } else {
        mm += o.m[o.m.length - i];
      }
    }
    o.mb = dividerB > 0 ? mb / dividerB : 0;
    o.mm = dividerM > 0 ? mm / dividerM : 0;
  });
}

function rangeAverages(s, range, totalYears, weighted) {
  const bel = [];
  const mat = [];
  for (let i = 0; i < totalYears; i++) {
    let sumB = 0;
    let sumM = 0;
    let divB = 0;
    let divM = 0;
    let nullB = 0;
    let nullM = 0;
    for (let j = range[0]; j <= range[1]; j++) {
      if (weighted) {
        if (s[j].b[i]) {
          sumB += s[j].b[i] * s[j].bu[i];
          divB += s[j].bu[i];
        }
        if (s[j].m[i]) {
          sumM += s[j].m[i] * s[j].mu[i];
          divM += s[j].mu[i];
        }
      } else {
        if (s[j].b[i]) {
          sumB += s[j].b[i];
        } else {
          ++nullB;
        }
        if (s[j].m[i]) {
          sumM += s[j].m[i];
        } else {
          ++nullM;
        }
      }
    }
    if (!weighted) {
      divB = range[1] - range[0] + 1 - nullB;
      divM = range[1] - range[0] + 1 - nullM;
    }
    bel[i] = safeDivide(sumB, divB, 0);
    mat[i] = safeDivide(sumM, divM, 0);
  }
  return { bel, mat };
}

/** Средни за града по училища: si[c].mnbs/mnms (държавни), mpbs/mpms (частни). */
export function computeCityMediansBySchool(s, si, totalYears) {
  Object.keys(si).forEach((c) => {
    const pub = rangeAverages(s, si[c].n, totalYears, false);
    si[c].mnbs = pub.bel;
    si[c].mnms = pub.mat;
    si[c].mpbs = null;
    si[c].mpms = null;
    if (si[c].p) {
      const pr = rangeAverages(s, si[c].p, totalYears, false);
      si[c].mpbs = pr.bel;
      si[c].mpms = pr.mat;
    }
  });
}

/** Средни за града по ученици (претеглени): mnba/mnma, mpba/mpma. */
export function computeCityMediansByAttendees(s, si, totalYears) {
  Object.keys(si).forEach((c) => {
    const pub = rangeAverages(s, si[c].n, totalYears, true);
    si[c].mnba = pub.bel;
    si[c].mnma = pub.mat;
    si[c].mpba = null;
    si[c].mpma = null;
    if (si[c].p) {
      const pr = rangeAverages(s, si[c].p, totalYears, true);
      si[c].mpba = pr.bel;
      si[c].mpma = pr.mat;
    }
  });
}

/** Средна за страната (по училища) за всяка година — за PDF доклада. */
export function nationalAverages(model) {
  const { s, totalYears } = model;
  const natB = [];
  const natM = [];
  for (let y = 0; y < totalYears; y++) {
    let sumB = 0;
    let countB = 0;
    let sumM = 0;
    let countM = 0;
    s.forEach((o) => {
      if (o && o.b[y]) { sumB += o.b[y]; countB++; }
      if (o && o.m[y]) { sumM += o.m[y]; countM++; }
    });
    natB.push(countB > 0 ? sumB / countB : 0);
    natM.push(countM > 0 ? sumM / countM : 0);
  }
  return { b: natB, m: natM };
}

function hasSchoolsWithLatestYearData(s, range) {
  if (!Array.isArray(range) || range.length < 2) {
    return false;
  }
  const [start, end] = range;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    return false;
  }
  for (let i = start; i <= end; i++) {
    if (s[i] && s[i].b[s[i].b.length - 1] && s[i].m[s[i].m.length - 1]) {
      return true;
    }
  }
  return false;
}

function cityGroups(si, name) {
  const c = si[name];
  if (!c || !Array.isArray(c.n) || c.n.length < 2) {
    return null;
  }
  return { pu: c.n, pr: Array.isArray(c.p) && c.p.length >= 2 ? c.p : null };
}

/**
 * Градовете с поне едно училище с данни за последната година, подредени по `i`.
 * Всеки: { name, slug, label, tier (1..3), order, pu, pr, hasPrivate, hasBalove }.
 */
export function renderableCities(model) {
  const { s, si } = model;
  const out = [];
  Object.keys(si).forEach((name) => {
    const c = si[name] || {};
    const order = Number.parseInt(c.i, 10);
    if (!Number.isInteger(order) || order < 0) {
      return;
    }
    const groups = cityGroups(si, name);
    if (!groups) {
      return;
    }
    if (!hasSchoolsWithLatestYearData(s, groups.pu) && !hasSchoolsWithLatestYearData(s, groups.pr)) {
      return;
    }
    const tier = Number.parseInt(c.o, 10);
    out.push({
      name,
      slug: c.h ? String(c.h) : String(name).trim().toLowerCase().replace(/\s+/g, '-'),
      label: c.l ? String(c.l) : String(name),
      tier: Number.isInteger(tier) && tier >= 1 && tier <= 3 ? tier : 3,
      order,
      pu: groups.pu,
      pr: groups.pr,
      hasPrivate: !!groups.pr,
      hasBalove: !!c.r
    });
  });
  out.sort((a, b) => a.order - b.order);
  return out;
}

/** Градът и типът на училище по индекс. */
export function findCityForSchool(model, index) {
  const { si } = model;
  const names = Object.keys(si);
  for (let k = 0; k < names.length; k++) {
    const groups = cityGroups(si, names[k]);
    if (!groups) {
      continue;
    }
    if (index >= groups.pu[0] && index <= groups.pu[1]) {
      return { cityName: names[k], isPrivate: false };
    }
    if (groups.pr && index >= groups.pr[0] && index <= groups.pr[1]) {
      return { cityName: names[k], isPrivate: true };
    }
  }
  return null;
}

export function findSchoolIndexByCode(model, code) {
  if (!code) {
    return -1;
  }
  const { s } = model;
  for (let i = 0; i < s.length; i++) {
    if (s[i] && s[i].c === code) {
      return i;
    }
  }
  return -1;
}

/* ---------------- Класация на града ---------------- */

export function normalizeRankValue(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const clamped = Math.min(100, Math.max(0, value));
  return Math.round((clamped + Number.EPSILON) * 100) / 100;
}

export function formatRankValue(value) {
  if (!Number.isFinite(value)) {
    return '';
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, '');
}

const avgSort = (s) => (o1, o2) => ((s[o1.i].mb + s[o1.i].mm) / 2 < (s[o2.i].mb + s[o2.i].mm) / 2 ? 1 : -1);

/**
 * Редовете на класацията за град (училищата с резултат за последната година),
 * в подредбата по подразбиране (средно за 3 г. низходящо), с ранговете за трите филтъра.
 * Ред: { i, type: 'Д'|'Ч', typeNo, rankAll, rankPu, rankPr, avg, years: [{year, b, bu, m, mu}] }
 */
export function cityRanking(model, city) {
  const { s, cfg, totalYears, firstYear } = model;
  const rows = [];
  const add = (range, type) => {
    if (!range) {
      return;
    }
    for (let i = range[0]; i <= range[1]; i++) {
      if (!s[i] || s[i].b[s[i].b.length - 1] === null) {
        continue;
      }
      rows.push({ i, type });
    }
  };
  add(city.pu, 'Д');
  add(city.pr, 'Ч');
  rows.sort(avgSort(s));
  if (!rows.length) {
    return rows;
  }
  const rb = cfg.rankBase;
  const value = (r) => (s[r.i].mb + s[r.i].mm - rb * 2) / 2;
  const topAll = value(rows[0]);
  let topPu = null;
  let topPr = null;
  if (city.pr) {
    const firstPu = rows.find((r) => r.type === 'Д');
    const firstPr = rows.find((r) => r.type === 'Ч');
    topPu = firstPu ? value(firstPu) : null;
    topPr = firstPr ? value(firstPr) : null;
  }
  let nPu = 0;
  let nPr = 0;
  rows.forEach((r, k) => {
    const v = value(r);
    r.avg = v + rb;
    r.typeNo = r.type === 'Д' ? ++nPu : ++nPr;
    if (k === 0) {
      r.rankAll = 100;
      r.rankPu = r.type === 'Д' ? 100 : null;
      r.rankPr = r.type === 'Ч' ? 100 : null;
    } else {
      r.rankAll = normalizeRankValue(normalizeRankValue(safeDivide(v * 100, topAll, 0)));
      r.rankPu = normalizeRankValue(normalizeRankValue(safeDivide(v * 100, topPu, 0)));
      r.rankPr = topPr ? normalizeRankValue(normalizeRankValue(safeDivide(v * 100, topPr, 0))) : null;
    }
    r.years = [];
    for (let j = 0; j < 3; j++) {
      const y = totalYears - j - 1;
      const o = s[r.i];
      r.years.push({ year: firstYear + y, b: o.b[y], bu: o.bu[y], m: o.m[y], mu: o.mu[y] });
    }
  });
  return rows;
}

/** Училищата в града без резултат за последната година (не влизат в класацията). */
export function cityInactiveSchools(model, city) {
  const { s } = model;
  const out = [];
  const add = (range, type) => {
    if (!range) {
      return;
    }
    for (let i = range[0]; i <= range[1]; i++) {
      if (s[i] && s[i].b[s[i].b.length - 1] === null) {
        out.push({ i, type });
      }
    }
  };
  add(city.pu, 'Д');
  add(city.pr, 'Ч');
  return out;
}

/** Рангът за избрания филтър (null = всички, 'Д', 'Ч'). */
export function rankFor(row, filter) {
  if (filter === 'Д') {
    return row.rankPu;
  }
  if (filter === 'Ч') {
    return row.rankPr;
  }
  return row.rankAll;
}

/* ---------------- Групи „Топ N“ ---------------- */

export function topCounts(range) {
  let top = 0;
  let second = 0;
  const count = range[1] - range[0];
  if (count >= TOP_GROUPS.thresholdSmall) { top = TOP_GROUPS.topSmall; }
  if (count >= TOP_GROUPS.thresholdMedium) { top = TOP_GROUPS.topMedium; }
  if (count >= TOP_GROUPS.thresholdLarge) { top = TOP_GROUPS.topLarge; }
  if (count >= TOP_GROUPS.thresholdXLarge) { second = TOP_GROUPS.second; }
  return { top, second };
}

/**
 * Училищата, които бутоните „Топ N“ / „Топ N+1–M“ избират за дадена група
 * (държавни или частни) — същият алгоритъм като стария generateSchoolButtons.
 * @returns {{label: string, indices: number[]}[]}
 */
export function topGroups(model, range) {
  const { s } = model;
  if (!range) {
    return [];
  }
  const { top, second } = topCounts(range);
  const schools = [];
  for (let j = range[0]; j <= range[1]; j++) {
    if (s[j]) {
      schools.push(j);
    }
  }
  schools.sort((i1, i2) => ((s[i1].mb + s[i1].mm) / 2 < (s[i2].mb + s[i2].mm) / 2 ? 1 : -1));
  const pick = (start, count) => {
    const picked = [];
    for (let k = start; k < schools.length && picked.length < count; k++) {
      const o = s[schools[k]];
      if (!o || o.b[o.b.length - 1] === null) {
        continue;
      }
      picked.push(schools[k]);
    }
    return picked;
  };
  const groups = [];
  if (top > 0) {
    groups.push({ label: 'Топ ' + top, indices: pick(0, top) });
  }
  if (second > 0) {
    groups.push({ label: 'Топ ' + (top + 1) + '–' + (top + second), indices: pick(top, second) });
  }
  return groups;
}

/* ---------------- Средни за града (таблицата) ---------------- */

/**
 * Редовете за „Средни резултати“ (от последната година назад, numYears реда).
 * mode: 'schools' (по училища) | 'students' (по ученици)
 */
export function cityAverages(model, cityName, mode) {
  const { si, totalYears, firstYear, numYears } = model;
  const c = si[cityName];
  const keys = mode === 'students'
    ? ['mnba', 'mnma', 'mpba', 'mpma']
    : ['mnbs', 'mnms', 'mpbs', 'mpms'];
  // Старият код решава „има ли частни“ по mpbs и за двата изгледа.
  const hasPrivate = !!c.mpbs;
  const round = (v) => (Math.round(v * 100) / 100).toFixed(2);
  const rows = [];
  for (let i = totalYears - 1; i >= totalYears - numYears; i--) {
    const row = { year: firstYear + i, puB: round(c[keys[0]][i]), puM: round(c[keys[1]][i]) };
    if (hasPrivate) {
      row.prB = round(c[keys[2]][i]);
      row.prM = round(c[keys[3]][i]);
    }
    rows.push(row);
  }
  return { hasPrivate, rows };
}

/* ---------------- CSV ---------------- */

export function csvHeader(model) {
  const { cfg, firstYear, totalYears } = model;
  let header = 'Град,Училище,Тип';
  for (let j = firstYear; j < firstYear + totalYears; j++) {
    header += ',' + cfg.csvHeaderBel + ' ' + (j - 2000) + ',' + cfg.csvHeaderMat + ' ' + (j - 2000);
    header += ',' + cfg.csvHeaderBel + '-УЧ. ' + (j - 2000) + ',' + cfg.csvHeaderMat + '-УЧ. ' + (j - 2000);
  }
  return header + '\r\n';
}

function csvRows(model, cityName, range, type) {
  const { s, firstYear, totalYears } = model;
  let data = '';
  for (let i = range[0]; i <= range[1]; i++) {
    if (!s[i]) {
      continue;
    }
    let row = cityName + ',"' + s[i].n + '",' + type;
    for (let j = firstYear; j < firstYear + totalYears; j++) {
      const y = j - firstYear;
      row += ',' + (s[i].b[y] ? s[i].b[y] : '');
      row += ',' + (s[i].m[y] ? s[i].m[y] : '');
      row += ',' + (s[i].bu[y] ? s[i].bu[y] : '');
      row += ',' + (s[i].mu[y] ? s[i].mu[y] : '');
    }
    data += row + '\r\n';
  }
  return data;
}

/** Редовете за един град (без заглавния ред). */
export function cityCsvRows(model, city) {
  let data = csvRows(model, city.name, city.pu, 'Д');
  if (city.pr) {
    data += csvRows(model, city.name, city.pr, 'Ч');
  }
  return data;
}

export function cityCsv(model, city) {
  return {
    filename: model.cfg.exportPrefix + '-data-' + city.slug + '.csv',
    content: csvHeader(model) + cityCsvRows(model, city)
  };
}

export function allCsv(model) {
  const body = renderableCities(model).map((c) => cityCsvRows(model, c)).join('');
  return {
    filename: model.cfg.exportPrefix + '-data-all.csv',
    content: csvHeader(model) + body
  };
}

/* ---------------- Графиките ---------------- */

/**
 * Сериите за графиката на един предмет ('b' | 'm') с прозореца numYears и
 * изрязани празни години отпред и отзад (normalizeSeries).
 * @returns {{categories: string[], series: {index, name, data}[]}}
 */
export function chartSeries(model, indices, subject) {
  const { s, numYears, firstYear, totalYears } = model;
  const series = [];
  indices.forEach((i) => {
    if (s[i]) {
      series.push({ index: i, name: s[i].n, data: s[i][subject].slice(s[i][subject].length - numYears) });
    }
  });
  series.sort((t1, t2) => (t1.data[t1.data.length - 1] < t2.data[t2.data.length - 1] ? 1 : -1));
  const hasAny = () => series.some((x) => x.data && x.data.length > 0);
  while (hasAny() && !series.some((x) => x.data[0])) {
    series.forEach((x) => { x.data = x.data.slice(1); });
  }
  let removed = 0;
  while (hasAny() && !series.some((x) => x.data[x.data.length - 1])) {
    series.forEach((x) => { x.data = x.data.slice(0, x.data.length - 1); });
    ++removed;
  }
  const lastYear = firstYear - 1 + totalYears - removed;
  const len = series.length ? series[0].data.length : 0;
  const categories = [];
  for (let k = 0; k < len; k++) {
    categories.push(String(lastYear - (len - k - 1)));
  }
  return { categories, series };
}

/* ---------------- Сортиране на класацията ---------------- */

/** Колоните, по които може да се сортира. Годишните: 'y0b','y0m','y1b','y1m','y2b','y2m'. */
export const SORT_COLUMNS = ['name', 'type', 'rank', 'y0b', 'y0m', 'y1b', 'y1m', 'y2b', 'y2m'];

/** Посоката по подразбиране при първи клик (като в старата таблица). */
export function defaultSortDir(column) {
  return column === 'name' || column === 'type' ? 'asc' : 'desc';
}

function rankValue(row, filter) {
  const v = Number.parseFloat(rankFor(row, filter));
  return Number.isFinite(v) ? v : Number.NEGATIVE_INFINITY;
}

function yearValue(row, column) {
  const y = row.years[Number(column.charAt(1))];
  const v = column.charAt(2) === 'b' ? y.b : y.m;
  return v ? v : null;
}

function compareNames(model, r1, r2) {
  const n1 = model.s[r1.i].l.trim();
  const n2 = model.s[r2.i].l.trim();
  const m1 = n1.match(/^\s*(\d+)/);
  const m2 = n2.match(/^\s*(\d+)/);
  if (m1 && m2) {
    const c = Number.parseInt(m1[1], 10) - Number.parseInt(m2[1], 10);
    return c !== 0 ? c : n1.localeCompare(n2, 'bg');
  }
  return n1.localeCompare(n2, 'bg');
}

/**
 * Филтрира (null | 'Д' | 'Ч') и сортира редовете на класацията — 1:1 със стария
 * compareRowsByColumn: празните годишни клетки са винаги най-отдолу, равенствата
 * се решават по ранг и име.
 */
export function sortRanking(model, rows, column, dir, filter) {
  const visible = rows.filter((r) => !filter || r.type === filter);
  const plainName = (r1, r2) => model.s[r1.i].l.trim().localeCompare(model.s[r2.i].l.trim(), 'bg');
  visible.sort((r1, r2) => {
    let cmp = 0;
    if (column === 'name') {
      cmp = compareNames(model, r1, r2);
    } else if (column === 'type') {
      cmp = (r1.type === 'Д' ? 0 : 1) - (r2.type === 'Д' ? 0 : 1);
      if (cmp === 0) {
        cmp = r1.typeNo - r2.typeNo;
      }
    } else if (column === 'rank') {
      cmp = rankValue(r1, filter) - rankValue(r2, filter);
    } else {
      const y1 = yearValue(r1, column);
      const y2 = yearValue(r2, column);
      if (y1 === null && y2 === null) {
        const a = rankValue(r1, filter);
        const b = rankValue(r2, filter);
        if (a !== b) {
          return dir === 'asc' ? a - b : b - a;
        }
        return plainName(r1, r2);
      } else if (y1 === null) {
        return 1;
      } else if (y2 === null) {
        return -1;
      }
      cmp = y1 - y2;
    }
    if (cmp === 0) {
      cmp = plainName(r1, r2);
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  return visible;
}

/** Индексът на първия ред без стойност в сортираната годишна колона (за разделителна линия). */
export function firstEmptyRow(rows, column) {
  if (!/^y\d[bm]$/.test(column)) {
    return -1;
  }
  return rows.findIndex((r) => yearValue(r, column) === null);
}
