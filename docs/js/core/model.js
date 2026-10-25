// Модел на данните за един клас: зареждане на data/grade-{g}.json, нормализация
// (прозорецът с години, липсващи години, исторически изглед) и всички изчисления за
// класациите, средните, CSV и графиките.
import { gradeConfig, displayRange, navFirstYear } from './config.js';
import { schoolType, typeOrder, sortTypes } from './school-types.js';

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
    l: o.l, n: o.n, w: o.w, c: o.c, t: o.t,
    b: o.b.slice(), m: o.m.slice(), bu: o.bu.slice(), mu: o.mu.slice()
  } : o));
}

/** Видът (t) липсва само в стари данни: частните са в диапазона p, останалите - общински. */
function fillTypes(s, si) {
  Object.keys(si).forEach((name) => {
    [[si[name].n, 'm'], [si[name].p, 'p']].forEach(([range, type]) => {
      if (!Array.isArray(range)) {
        return;
      }
      for (let i = range[0]; i <= range[1]; i++) {
        if (s[i] && !s[i].t) {
          s[i].t = type;
        }
      }
    });
  });
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
  fillTypes(s, si);
  const base = cfg.baseSchoolIndex;
  const dataFirstYear = cfg.firstYear;
  const dataYears = s[base].b.length;
  const dataLatestYear = dataFirstYear + dataYears - 1;
  let lastYear = dataLatestYear;
  let timeTravelYear = null;

  // calculateTimeTravel
  if (opts.year !== undefined && opts.year !== null && opts.year !== '') {
    const parsed = Number.parseInt(opts.year, 10);
    if (Number.isInteger(parsed)) {
      const minYear = navFirstYear(cfg.grade);
      const maxYear = dataLatestYear - 1;
      if (maxYear >= minYear) {
        timeTravelYear = Math.min(Math.max(parsed, minYear), maxYear);
        lastYear = timeTravelYear;
      }
    }
  }

  // fixForMissingYears
  s.forEach((o) => {
    if (!o) {
      return;
    }
    for (let i = o.b.length; i < dataYears; i++) {
      o.b.push(null);
      o.m.push(null);
    }
    for (let i = o.bu.length; i < dataYears; i++) {
      o.bu.push(0);
      o.mu.push(0);
    }
  });

  // Експортът (CSV) е със суровите данни от началото на масивите до lastYear.
  const exportEnd = lastYear - dataFirstYear + 1;
  const exportData = {
    firstYear: dataFirstYear,
    years: exportEnd,
    s: s.map((o) => (o ? { b: o.b.slice(0, exportEnd), m: o.m.slice(0, exportEnd), bu: o.bu.slice(0, exportEnd), mu: o.mu.slice(0, exportEnd) } : o))
  };

  // Всичко останало вижда само прозореца DISPLAY_FROM…lastYear (до MAX_YEARS години);
  // графиките и "Средни резултати" в исторически изглед - последните HISTORY_YEARS.
  const firstYear = displayRange(cfg.grade, lastYear).from;
  const start = firstYear - dataFirstYear;
  s.forEach((o) => {
    if (!o) {
      return;
    }
    o.b = o.b.slice(start, exportEnd);
    o.m = o.m.slice(start, exportEnd);
    o.bu = o.bu.slice(start, exportEnd);
    o.mu = o.mu.slice(start, exportEnd);
  });
  const totalYears = exportEnd - start;
  const numYears = timeTravelYear ? lastYear - displayRange(cfg.grade, lastYear, true).from + 1 : totalYears;

  // disableEntries
  (cfg.disabledEntries || []).forEach((idx) => {
    const school = s[idx];
    school.b[school.b.length - 1] = null;
    school.m[school.m.length - 1] = null;
    school.bu[school.bu.length - 1] = null;
    school.mu[school.mu.length - 1] = null;
  });

  computeSchoolMedians(s);

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
    timeTravelYear,
    exportData
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

/**
 * Средните по БЕЛ и МАТ за всяка година на училищата от дадените видове в града -
 * по училища (средно аритметично) или претеглени с броя на учениците. null = няма данни.
 */
export function typeAverages(model, city, types, weighted) {
  const { s, totalYears } = model;
  const indices = cityIndices(city).filter((i) => s[i] && types.includes(s[i].t));
  const bel = [];
  const mat = [];
  for (let y = 0; y < totalYears; y++) {
    let sumB = 0;
    let sumM = 0;
    let divB = 0;
    let divM = 0;
    indices.forEach((i) => {
      const o = s[i];
      if (o.b[y]) {
        sumB += weighted ? o.b[y] * o.bu[y] : o.b[y];
        divB += weighted ? o.bu[y] : 1;
      }
      if (o.m[y]) {
        sumM += weighted ? o.m[y] * o.mu[y] : o.m[y];
        divM += weighted ? o.mu[y] : 1;
      }
    });
    bel.push(divB ? sumB / divB : null);
    mat.push(divM ? sumM / divM : null);
  }
  return { bel, mat };
}

/** Средна за страната (по училища) за всяка година - за PDF доклада. */
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

/** Индексите на училищата в града (диапазоните n и p - в реда от данните). */
export function cityIndices(city) {
  const out = [];
  [city.pu, city.pr].forEach((range) => {
    if (range) {
      for (let i = range[0]; i <= range[1]; i++) {
        out.push(i);
      }
    }
  });
  return out;
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
 * Всеки: { name, slug, label, tier (1..3), order, pu, pr, types, hasBalove };
 * types = видовете училища в града (с или без резултат за последната година), в общия ред.
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
    const types = new Set();
    [groups.pu, groups.pr].forEach((range) => {
      if (range) {
        for (let i = range[0]; i <= range[1]; i++) {
          if (s[i]) {
            types.add(s[i].t);
          }
        }
      }
    });
    out.push({
      name,
      slug: c.h ? String(c.h) : String(name).trim().toLowerCase().replace(/\s+/g, '-'),
      label: c.l ? String(c.l) : String(name),
      tier: Number.isInteger(tier) && tier >= 1 && tier <= 3 ? tier : 3,
      order,
      pu: groups.pu,
      pr: groups.pr,
      types: sortTypes([...types]),
      hasBalove: !!c.r
    });
  });
  out.sort((a, b) => a.order - b.order);
  return out;
}

/** Градът и видът на училище по индекс. */
export function findCityForSchool(model, index) {
  const { s, si } = model;
  const names = Object.keys(si);
  for (let k = 0; k < names.length; k++) {
    const groups = cityGroups(si, names[k]);
    if (!groups) {
      continue;
    }
    if ((index >= groups.pu[0] && index <= groups.pu[1]) || (groups.pr && index >= groups.pr[0] && index <= groups.pr[1])) {
      return { cityName: names[k], type: s[index].t };
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

/** Филтърът по вид: null = всички, иначе масив от ключове ('s', 'm', 'p', 'r'). */
const inTypes = (types) => (r) => !types || types.includes(r.type);

/**
 * Редовете на класацията за град (училищата с резултат за последната година),
 * в подредбата по подразбиране (средно за 3 г. низходящо), с ранга за всички видове.
 * Ред: { i, type ('s'|'m'|'p'|'r'), typeNo (място сред същия вид), value, avg, rank, years: [{year, b, bu, m, mu}] }
 */
export function cityRanking(model, city) {
  const { s, cfg, totalYears, firstYear } = model;
  const rows = [];
  cityIndices(city).forEach((i) => {
    if (s[i] && s[i].b[s[i].b.length - 1] !== null) {
      rows.push({ i, type: s[i].t });
    }
  });
  rows.sort(avgSort(s));
  const rb = cfg.rankBase;
  const counters = {};
  rows.forEach((r) => {
    const o = s[r.i];
    r.value = (o.mb + o.mm - rb * 2) / 2;
    r.avg = r.value + rb;
    counters[r.type] = (counters[r.type] || 0) + 1;
    r.typeNo = counters[r.type];
    r.years = [];
    for (let j = 0; j < 3; j++) {
      const y = totalYears - j - 1;
      r.years.push({ year: firstYear + y, b: o.b[y], bu: o.bu[y], m: o.m[y], mu: o.mu[y] });
    }
  });
  rankRows(rows, null);
  return rows;
}

/**
 * Рангът спрямо първото показано училище: средният успех (над rankBase) като процент от този
 * на първото училище от показаните видове. Редовете извън филтъра получават null.
 */
export function rankRows(rows, types) {
  const shown = inTypes(types);
  const first = rows.find(shown);
  const top = first ? first.value : null;
  rows.forEach((r) => {
    if (r === first) {
      r.rank = 100;
    } else {
      r.rank = shown(r) ? normalizeRankValue(normalizeRankValue(safeDivide(r.value * 100, top, 0))) : null;
    }
  });
  return rows;
}

/** Училищата в града без резултат за последната година (не влизат в класацията). */
export function cityInactiveSchools(model, city) {
  const { s } = model;
  return cityIndices(city)
    .filter((i) => s[i] && s[i].b[s[i].b.length - 1] === null)
    .map((i) => ({ i, type: s[i].t }));
}

/** Рангът на реда (след cityRanking / sortRanking). */
export function rankFor(row) {
  return row.rank;
}

/* ---------------- Средни за града (таблицата) ---------------- */

/**
 * "Средни резултати" за показаните видове: по една колона за всеки вид и "Общо" (всички
 * показани заедно) при два и повече вида; редовете са от последната година назад (numYears).
 * mode: 'schools' (по училища) | 'students' (по ученици)
 * → { columns: [{ key: 'all'|'s'|'m'|'p'|'r' }], rows: [{ year, b: [число|null…], m: […] }] }
 */
export function cityAverages(model, city, mode, types) {
  const { totalYears, firstYear, numYears } = model;
  const keys = sortTypes(types);
  const columns = (keys.length > 1 ? [{ key: 'all', types: keys }] : []).concat(keys.map((k) => ({ key: k, types: [k] })));
  const series = columns.map((c) => typeAverages(model, city, c.types, mode === 'students'));
  const rows = [];
  for (let i = totalYears - 1; i >= totalYears - numYears; i--) {
    rows.push({ year: firstYear + i, b: series.map((x) => x.bel[i]), m: series.map((x) => x.mat[i]) });
  }
  return { columns: columns.map((c) => ({ key: c.key })), rows };
}

/* ---------------- CSV ---------------- */

// CSV-ът е експорт: всички години от началото на данните, без прозореца на сайта.
export function csvHeader(model) {
  const { cfg } = model;
  const { firstYear, years } = model.exportData;
  let header = 'Град,Училище,Тип';
  for (let j = firstYear; j < firstYear + years; j++) {
    header += ',' + cfg.csvHeaderBel + ' ' + (j - 2000) + ',' + cfg.csvHeaderMat + ' ' + (j - 2000);
    header += ',' + cfg.csvHeaderBel + '-УЧ. ' + (j - 2000) + ',' + cfg.csvHeaderMat + '-УЧ. ' + (j - 2000);
  }
  return header + '\r\n';
}

/** Редовете за един град (без заглавния ред); "Тип" е буквата на вида: Д, О, Ч, ДУ. */
export function cityCsvRows(model, city) {
  const { s } = model;
  const { years, s: raw } = model.exportData;
  let data = '';
  for (const i of cityIndices(city)) {
    if (!s[i]) {
      continue;
    }
    const o = raw[i];
    let row = city.name + ',"' + s[i].n + '",' + schoolType(s[i].t).letter;
    for (let y = 0; y < years; y++) {
      row += ',' + (o.b[y] ? o.b[y] : '');
      row += ',' + (o.m[y] ? o.m[y] : '');
      row += ',' + (o.bu[y] ? o.bu[y] : '');
      row += ',' + (o.mu[y] ? o.mu[y] : '');
    }
    data += row + '\r\n';
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

function rankValue(row) {
  const v = Number.parseFloat(rankFor(row));
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
 * Филтрира по вид (null = всички | масив от ключове), смята ранга спрямо първото показано
 * училище и сортира редовете на класацията - 1:1 със стария compareRowsByColumn: празните
 * годишни клетки са винаги най-отдолу, равенствата се решават по ранг и име.
 */
export function sortRanking(model, rows, column, dir, types) {
  rankRows(rows, types);
  const visible = rows.filter(inTypes(types));
  const plainName = (r1, r2) => model.s[r1.i].l.trim().localeCompare(model.s[r2.i].l.trim(), 'bg');
  visible.sort((r1, r2) => {
    let cmp = 0;
    if (column === 'name') {
      cmp = compareNames(model, r1, r2);
    } else if (column === 'type') {
      cmp = typeOrder(r1.type) - typeOrder(r2.type);
      if (cmp === 0) {
        cmp = r1.typeNo - r2.typeNo;
      }
    } else if (column === 'rank') {
      cmp = rankValue(r1) - rankValue(r2);
    } else {
      const y1 = yearValue(r1, column);
      const y2 = yearValue(r2, column);
      if (y1 === null && y2 === null) {
        const a = rankValue(r1);
        const b = rankValue(r2);
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
