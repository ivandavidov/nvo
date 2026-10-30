// Изчисленията на "Обобщена статистика" (/stats/) - без DOM и без графики, за да се ползват и
// от страницата (logic.js рисува графиките), и от конзолата (nvo stats).
// Вход: data/grade-{g}.json, подготвен с prepareGradeData (прозорецът с години на сайта, градове, видове).
import { gradeConfig, displayRange } from '../js/core/config.js';
import { SCHOOL_TYPES } from '../js/core/school-types.js';

export const TABLE_ROWS        = 15;
export const STABLE_MIN_SCORES = 4;
export const TREND_YEARS       = 5;
export const ALL_CITIES_VALUE  = '__all__';

/** Данните за статистиката от суровия data/grade-{g}.json (нов обект - суровият не се променя). */
export function prepareGradeData(grade, raw) {
  const cfg = gradeConfig(grade);
  const data = {
    s: raw.s.map(o => (o ? { l: o.l, n: o.n, w: o.w, c: o.c, t: o.t, b: o.b.slice(), m: o.m.slice(), bu: o.bu.slice(), mu: o.mu.slice() } : o)),
    si: raw.si,
    grade: cfg.grade,
    firstYear: cfg.firstYear,
    chartBTitle: cfg.chartBTitle,
    chartMTitle: cfg.chartMTitle,
    chartFloor: cfg.chartFloor,
    chartCeiling: cfg.chartCeiling
  };

  // Визуализира се прозорецът на сайта (displayRange: от DISPLAY_FROM, до MAX_YEARS
  // години), броено назад от последната налична година с данни.
  applyConfiguredYearWindow(data);

  // Изгражда map: индекс на училище → град
  data.cityMap = buildCityMap(data.si);

  // Изгражда map: индекс на училище → вид ('s' държавно, 'm' общинско, 'p' частно, 'r' духовно)
  data.typeMap = buildTypeMap(data.s, data.si);
  return data;
}

export function applyConfiguredYearWindow(data) {
  let maxLen = 0;
  eachSchool(data.s, sch => {
    maxLen = Math.max(maxLen, (sch.b && sch.b.length) || 0, (sch.m && sch.m.length) || 0);
  });
  if (maxLen === 0) return;

  let last = -1;
  outer: for (let yr = maxLen - 1; yr >= 0; yr--) {
    for (let i = 0; i < data.s.length; i++) {
      const sch = data.s[i];
      if (sch && (sch.b[yr] != null || sch.m[yr] != null)) { last = yr; break outer; }
    }
  }
  if (last < 0) return;

  const start = displayRange(data.grade, data.firstYear + last).from - data.firstYear;
  const end = last + 1;
  const newNumYears = end - start;

  eachSchool(data.s, sch => {
    sch.b = (sch.b || []).slice(start, end);
    sch.m = (sch.m || []).slice(start, end);
    sch.bu = (sch.bu || []).slice(start, end);
    sch.mu = (sch.mu || []).slice(start, end);
  });

  data.firstYear += start;
  data.numYears = newNumYears;
}

// Итерира само реалните записи на sparse масива s[] с техния индекс
export function eachSchool(s, fn) {
  s.forEach((sch, idx) => { if (sch) fn(sch, idx); });
}

// Кратко ime + "(град)" - автоматично работи с всяко ново училище
export function schoolLabel(sch, idx, cityMap) {
  const city = cityMap[idx];
  return sch.l + (city ? ' (' + city + ')' : '');
}

// Изгражда map от индекс на училище към название на град
export function buildCityMap(si) {
  const map = {};
  for (const city of Object.keys(si)) {
    const r = si[city];
    if (!r) continue;
    if (r.n) { for (let i = r.n[0]; i <= r.n[1]; i++) map[i] = city; }
    if (r.p) { for (let i = r.p[0]; i <= r.p[1]; i++) map[i] = city; }
  }
  return map;
}

// Изгражда map от индекс на училище към вида му (полето t; стари данни без него -
// частните по диапазона p, останалите - общински)
export function buildTypeMap(s, si) {
  const map = {};
  for (const city of Object.keys(si)) {
    const r = si[city];
    if (!r) continue;
    if (r.n) { for (let i = r.n[0]; i <= r.n[1]; i++) map[i] = (s[i] && s[i].t) || 'm'; }
    if (r.p) { for (let i = r.p[0]; i <= r.p[1]; i++) map[i] = (s[i] && s[i].t) || 'p'; }
  }
  return map;
}

export function avg(arr) {
  const v = arr.filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function stdDev(arr) {
  const v = arr.filter(x => x != null);
  if (v.length < 2) return null;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length);
}

// Връща x-оста като масив от години, като премахва trailing null години
// (аналогично на normalizeSeries() в основния logic.js)
export function buildYears(data) {
  const { s, firstYear, numYears } = data;
  let last = numYears - 1;
  outer: for (let yr = numYears - 1; yr >= 0; yr--) {
    for (let i = 0; i < s.length; i++) {
      const sch = s[i];
      if (sch && (sch.b[yr] != null || sch.m[yr] != null)) { last = yr; break outer; }
    }
  }
  const years = [];
  for (let yr = 0; yr <= last; yr++) years.push(String(firstYear + yr));
  return years;
}

export function filterDataByCity(data, city) {
  if (!city || city === ALL_CITIES_VALUE) return data;
  const filteredSchools = [];
  eachSchool(data.s, (sch, idx) => {
    if (data.cityMap[idx] === city) filteredSchools[idx] = sch;
  });
  return Object.assign({}, data, { s: filteredSchools });
}

export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function combinedScoreAtYear(sch, yr) {
  const b = sch.b[yr];
  const m = sch.m[yr];
  if (b != null && m != null) return (b + m) / 2;
  if (b != null) return b;
  if (m != null) return m;
  return null;
}

export function combinedSeries(sch, yearsCount) {
  const vals = [];
  for (let yr = 0; yr < yearsCount; yr++) {
    vals.push(combinedScoreAtYear(sch, yr));
  }
  return vals;
}

export function movingAverage(arr, window) {
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const from = Math.max(0, i - window + 1);
    const part = arr.slice(from, i + 1).filter(v => v != null);
    res.push(part.length ? +avg(part).toFixed(2) : null);
  }
  return res;
}

export function computeParticipation(data) {
  const years = buildYears(data);
  const schoolCount = [], belStudents = [], matStudents = [];
  for (let yr = 0; yr < years.length; yr++) {
    let schools = 0, bS = 0, mS = 0;
    eachSchool(data.s, sch => {
      if (sch.b[yr] != null || sch.m[yr] != null) schools++;
      if (sch.bu && sch.bu[yr] > 0) bS += sch.bu[yr];
      if (sch.mu && sch.mu[yr] > 0) mS += sch.mu[yr];
    });
    schoolCount.push(schools);
    belStudents.push(bS > 0 ? bS : null);
    matStudents.push(mS > 0 ? mS : null);
  }
  return { years, schoolCount, belStudents, matStudents };
}

export function computeNationalAverage(data) {
  const years = buildYears(data);
  const bel = [], mat = [];
  for (let yr = 0; yr < years.length; yr++) {
    let bS = 0, bW = 0, mS = 0, mW = 0;
    eachSchool(data.s, sch => {
      if (sch.b[yr] != null) {
        const w = (sch.bu && sch.bu[yr]) || 1;
        bS += sch.b[yr] * w; bW += w;
      }
      if (sch.m[yr] != null) {
        const w = (sch.mu && sch.mu[yr]) || 1;
        mS += sch.m[yr] * w; mW += w;
      }
    });
    bel.push(bW > 0 ? +(bS / bW).toFixed(2) : null);
    mat.push(mW > 0 ? +(mS / mW).toFixed(2) : null);
  }
  return { years, bel, mat };
}

// Промяна на националната средна от година в година
export function computeYearOverYear(data) {
  const { years, bel, mat } = computeNationalAverage(data);
  if (years.length < 2) return { years: [], bel: [], mat: [] };
  const displayYears = [], belChanges = [], matChanges = [];
  for (let i = 1; i < years.length; i++) {
    displayYears.push(years[i - 1] + '→' + years[i]);
    belChanges.push(bel[i] != null && bel[i-1] != null ? +(bel[i] - bel[i-1]).toFixed(2) : null);
    matChanges.push(mat[i] != null && mat[i-1] != null ? +(mat[i] - mat[i-1]).toFixed(2) : null);
  }
  return { years: displayYears, bel: belChanges, mat: matChanges };
}

// Перцентилен фан: P10, P25, P50, P75, P90 по години
export function computePercentileFan(data) {
  const years = buildYears(data);
  function pctile(sorted, p) {
    if (!sorted.length) return null;
    const i = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(i), hi = Math.ceil(i);
    return +(sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)).toFixed(2);
  }
  const p10 = [], p25 = [], p50 = [], p75 = [], p90 = [];
  for (let yr = 0; yr < years.length; yr++) {
    const scores = [];
    eachSchool(data.s, sch => {
      const b = sch.b[yr], m = sch.m[yr];
      if (b != null && m != null) scores.push((b + m) / 2);
      else if (b != null) scores.push(b);
      else if (m != null) scores.push(m);
    });
    scores.sort((a, b) => a - b);
    p10.push(pctile(scores, 10));
    p25.push(pctile(scores, 25));
    p50.push(pctile(scores, 50));
    p75.push(pctile(scores, 75));
    p90.push(pctile(scores, 90));
  }
  return { years, p10, p25, p50, p75, p90 };
}

export function computeInequalityTrend(data) {
  const years = buildYears(data);
  const values = [];
  for (let yr = 0; yr < years.length; yr++) {
    const scores = [];
    eachSchool(data.s, sch => {
      const b = sch.b[yr], m = sch.m[yr];
      if (b != null && m != null) scores.push((b + m) / 2);
      else if (b != null) scores.push(b);
      else if (m != null) scores.push(m);
    });
    const sd = stdDev(scores);
    values.push(sd != null ? +sd.toFixed(2) : null);
  }
  return { years, values };
}

// Средният резултат (претеглен с учениците, (БЕЛ + МАТ) / 2) за всеки вид училище по години
export function computeByType(data) {
  const years = buildYears(data);
  const byType = {};
  SCHOOL_TYPES.forEach(t => { byType[t.key] = []; });
  for (let yr = 0; yr < years.length; yr++) {
    const acc = {};
    SCHOOL_TYPES.forEach(t => { acc[t.key] = { bS: 0, bW: 0, mS: 0, mW: 0 }; });
    eachSchool(data.s, (sch, idx) => {
      const a = acc[data.typeMap[idx]];
      if (!a) return;
      if (sch.b[yr] != null) {
        const w = (sch.bu && sch.bu[yr]) || 1;
        a.bS += sch.b[yr] * w; a.bW += w;
      }
      if (sch.m[yr] != null) {
        const w = (sch.mu && sch.mu[yr]) || 1;
        a.mS += sch.m[yr] * w; a.mW += w;
      }
    });
    SCHOOL_TYPES.forEach(t => {
      const a = acc[t.key];
      byType[t.key].push(a.bW > 0 && a.mW > 0 ? +((a.bS / a.bW + a.mS / a.mW) / 2).toFixed(2) : null);
    });
  }
  return { years, byType };
}

export function computeCityRankings(data) {
  const acc = {};
  eachSchool(data.s, (sch, idx) => {
    const city = data.cityMap[idx];
    if (!city) return;
    if (!acc[city]) acc[city] = { bS: 0, bW: 0, mS: 0, mW: 0 };
    const a = acc[city];
    sch.b.forEach((v, yr) => {
      if (v == null) return;
      const w = (sch.bu && sch.bu[yr]) || 1;
      a.bS += v * w; a.bW += w;
    });
    sch.m.forEach((v, yr) => {
      if (v == null) return;
      const w = (sch.mu && sch.mu[yr]) || 1;
      a.mS += v * w; a.mW += w;
    });
  });
  const rows = [];
  for (const city of Object.keys(acc)) {
    const a = acc[city];
    if (!a.bW || !a.mW) continue;
    rows.push({ city, avg: +((a.bS / a.bW + a.mS / a.mW) / 2).toFixed(2) });
  }
  return rows.sort((a, b) => b.avg - a.avg);
}

// Брой от топ TABLE_ROWS училища по населено място
export function computeTopCityConcentration(data) {
  const allSchools = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    allSchools.push({ city: data.cityMap[idx] || '(без град)', avg: (b + m) / 2 });
  });
  allSchools.sort((a, b) => b.avg - a.avg);
  const acc = {};
  allSchools.slice(0, TABLE_ROWS).forEach(s => { acc[s.city] = (acc[s.city] || 0) + 1; });
  return Object.entries(acc).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
}

export function computeBelMatScatter(data) {
  const pts = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    pts.push({ x: +b.toFixed(2), y: +m.toFixed(2), name: schoolLabel(sch, idx, data.cityMap) });
  });
  return pts;
}

export function computeBelMatGap(data) {
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    rows.push({
      name: schoolLabel(sch, idx, data.cityMap),
      b: +b.toFixed(2),
      m: +m.toFixed(2),
      gap: +(b - m).toFixed(2)
    });
  });
  const belLeads = rows.filter(r => r.gap > 0).sort((x, y) => y.gap - x.gap).slice(0, TABLE_ROWS);
  const matLeads = rows.filter(r => r.gap < 0).sort((x, y) => x.gap - y.gap).slice(0, TABLE_ROWS);
  return { belLeads, matLeads };
}

// Квадрантен анализ: средна оценка (X) × тренд (Y)
export function computeQuadrantScatter(data) {
  // Изчислява median на средните оценки за вертикалния separator
  const allAvgs = [];
  eachSchool(data.s, sch => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b != null && m != null) allAvgs.push((b + m) / 2);
  });
  allAvgs.sort((a, b) => a - b);
  const mid = Math.floor(allAvgs.length / 2);
  const medianAvg = allAvgs.length === 0 ? 0
    : allAvgs.length % 2 === 0 ? (allAvgs[mid - 1] + allAvgs[mid]) / 2
    : allAvgs[mid];

  const champions = [], rising = [], declining = [], struggling = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    const overallAvg = +((b + m) / 2).toFixed(2);

    const bv = sch.b.slice(-TREND_YEARS).filter(v => v != null);
    const mv = sch.m.slice(-TREND_YEARS).filter(v => v != null);
    if (bv.length < 2 || mv.length < 2) return;
    const change = +((bv[bv.length-1] + mv[mv.length-1]) / 2 - (bv[0] + mv[0]) / 2).toFixed(2);

    const pt = { x: overallAvg, y: change, name: schoolLabel(sch, idx, data.cityMap) };
    if (overallAvg >= medianAvg && change >= 0) champions.push(pt);
    else if (overallAvg < medianAvg && change >= 0) rising.push(pt);
    else if (overallAvg >= medianAvg) declining.push(pt);
    else struggling.push(pt);
  });
  return { champions, rising, declining, struggling, medianAvg: +medianAvg.toFixed(2) };
}

export function computeSizeScatter(data) {
  const pts = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    const counts = (sch.bu || []).concat(sch.mu || []).filter(v => v > 0);
    if (b == null || m == null || !counts.length) return;
    const size = Math.round(avg(counts));
    if (size < 5) return;
    pts.push({ x: size, y: +((b + m) / 2).toFixed(2), name: schoolLabel(sch, idx, data.cityMap) });
  });
  return pts;
}

// Scatter: размер на училище (X) × стабилност / стандартно отклонение (Y)
export function computeStabilityVsSize(data) {
  const pts = [];
  eachSchool(data.s, (sch, idx) => {
    const all = sch.b.slice(-TREND_YEARS).concat(sch.m.slice(-TREND_YEARS)).filter(v => v != null);
    if (all.length < STABLE_MIN_SCORES) return;
    const sd = stdDev(all);
    if (sd == null) return;
    const counts = (sch.bu || []).concat(sch.mu || []).filter(v => v > 0);
    if (!counts.length) return;
    const size = Math.round(avg(counts));
    if (size < 5) return;
    pts.push({ x: size, y: +sd.toFixed(2), name: schoolLabel(sch, idx, data.cityMap) });
  });
  return pts;
}

export function computeDistribution(data) {
  const bucket = data.chartCeiling <= 10 ? 0.5 : 5;
  const counts = {};
  eachSchool(data.s, sch => {
    sch.b.concat(sch.m).forEach(v => {
      if (v == null) return;
      const k = Math.floor(v / bucket) * bucket;
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  const keys = Object.keys(counts).map(Number).sort((a, b) => a - b);
  const fmt = bucket < 1 ? 1 : 0;
  return {
    categories: keys.map(k => k.toFixed(fmt) + '-' + (k + bucket).toFixed(fmt)),
    values: keys.map(k => counts[k])
  };
}

// Разпределение на размерите на училищата (брой ученици)
export function computeSizeDistribution(data) {
  const BUCKETS = [
    { label: '1-9',   min: 1,   max: 9   },
    { label: '10-19', min: 10,  max: 19  },
    { label: '20-29', min: 20,  max: 29  },
    { label: '30-49', min: 30,  max: 49  },
    { label: '50-74', min: 50,  max: 74  },
    { label: '75-99', min: 75,  max: 99  },
    { label: '100-149', min: 100, max: 149 },
    { label: '150-199', min: 150, max: 199 },
    { label: '200-299', min: 200, max: 299 },
    { label: '300+',  min: 300, max: Infinity }
  ];
  const acc = {};
  BUCKETS.forEach(b => { acc[b.label] = 0; });
  eachSchool(data.s, sch => {
    const counts = (sch.bu || []).concat(sch.mu || []).filter(v => v > 0);
    if (!counts.length) return;
    const size = Math.round(avg(counts));
    if (size < 1) return;
    const bucket = BUCKETS.find(b => size >= b.min && size <= b.max);
    if (bucket) acc[bucket.label]++;
  });
  const used = BUCKETS.filter(b => acc[b.label] > 0);
  return { categories: used.map(b => b.label), values: used.map(b => acc[b.label]) };
}

export function computeTopSchools(data) {
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    rows.push({
      name: schoolLabel(sch, idx, data.cityMap),
      b: +b.toFixed(2),
      m: +m.toFixed(2),
      avg: +((b + m) / 2).toFixed(2)
    });
  });
  return rows.sort((a, b) => b.avg - a.avg).slice(0, TABLE_ROWS);
}

// Топ TABLE_ROWS при минимум среден размер (≥ медианата)
export function computeTopLargeSchools(data) {
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    const counts = (sch.bu || []).concat(sch.mu || []).filter(v => v > 0);
    if (!counts.length) return;
    const size = Math.round(avg(counts));
    if (size < 5) return;
    rows.push({ name: schoolLabel(sch, idx, data.cityMap), b: +b.toFixed(2), m: +m.toFixed(2), avg: +((b+m)/2).toFixed(2), size });
  });
  // Праг = медиана на размерите
  const sorted = rows.map(r => r.size).sort((a, b) => a - b);
  const threshold = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 50;
  return rows.filter(r => r.size >= threshold).sort((a, b) => b.avg - a.avg).slice(0, TABLE_ROWS);
}

export function computeTrend(data) {
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const bv = sch.b.slice(-TREND_YEARS).filter(v => v != null);
    const mv = sch.m.slice(-TREND_YEARS).filter(v => v != null);
    if (bv.length < 2 || mv.length < 2) return;
    const first  = +((bv[0] + mv[0]) / 2).toFixed(2);
    const last   = +((bv[bv.length - 1] + mv[mv.length - 1]) / 2).toFixed(2);
    const change = +(last - first).toFixed(2);
    rows.push({ name: schoolLabel(sch, idx, data.cityMap), first, last, change });
  });
  rows.sort((a, b) => b.change - a.change);
  return {
    improved: rows.slice(0, TABLE_ROWS),
    declined: rows.slice(-TABLE_ROWS).reverse()
  };
}

// Процент подобряващи се / стабилни / влошаващи се за всяка година
export function computeImprovementRate(data) {
  const years = buildYears(data);
  if (years.length < 2) return { years: [], improved: [], stable: [], declined: [] };
  const threshold = data.chartCeiling <= 10 ? 0.05 : 0.5;
  const displayYears = [], improved = [], stable = [], declined = [];
  for (let yr = 1; yr < years.length; yr++) {
    let imp = 0, stab = 0, dec = 0;
    eachSchool(data.s, sch => {
      const pb = sch.b[yr-1], pm = sch.m[yr-1];
      const cb = sch.b[yr],   cm = sch.m[yr];
      if (pb == null || pm == null || cb == null || cm == null) return;
      const diff = (cb + cm) / 2 - (pb + pm) / 2;
      if (diff > threshold) imp++;
      else if (diff < -threshold) dec++;
      else stab++;
    });
    const total = imp + stab + dec;
    displayYears.push(years[yr - 1] + '→' + years[yr]);
    if (total === 0) {
      improved.push(null); stable.push(null); declined.push(null);
    } else {
      improved.push(+(imp  / total * 100).toFixed(1));
      stable.push(+(stab / total * 100).toFixed(1));
      declined.push(+(dec  / total * 100).toFixed(1));
    }
  }
  return { years: displayYears, improved, stable, declined };
}

// Монотонно подобряващи се: всяка ненулева стойност е по-добра от предишната
export function computeConsistentlyImproving(data) {
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const combined = sch.b.slice(-TREND_YEARS).map((b, i) => {
      const m = sch.m.slice(-TREND_YEARS)[i];
      return (b != null && m != null) ? (b + m) / 2 : null;
    }).filter(v => v != null);
    if (combined.length < 4) return;
    for (let i = 1; i < combined.length; i++) {
      if (combined[i] <= combined[i - 1]) return;
    }
    rows.push({
      name: schoolLabel(sch, idx, data.cityMap),
      first: +combined[0].toFixed(2),
      last:  +combined[combined.length - 1].toFixed(2),
      change: +(combined[combined.length - 1] - combined[0]).toFixed(2),
      count: combined.length
    });
  });
  return rows.sort((a, b) => b.change - a.change).slice(0, TABLE_ROWS);
}

export function computeStable(data) {
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const all = sch.b.slice(-TREND_YEARS).concat(sch.m.slice(-TREND_YEARS)).filter(v => v != null);
    if (all.length < STABLE_MIN_SCORES) return;
    rows.push({
      name: schoolLabel(sch, idx, data.cityMap),
      avg: +avg(all).toFixed(2),
      std: +stdDev(all).toFixed(2)
    });
  });
  return rows.sort((a, b) => a.std - b.std).slice(0, TABLE_ROWS);
}

export function computeRankStability(data) {
  const years = buildYears(data);
  const ranksBySchool = {};
  for (let yr = 0; yr < years.length; yr++) {
    const rows = [];
    eachSchool(data.s, (sch, idx) => {
      const v = combinedScoreAtYear(sch, yr);
      if (v != null) rows.push({ idx, v });
    });
    rows.sort((a, b) => b.v - a.v);
    rows.forEach((r, i) => {
      if (!ranksBySchool[r.idx]) ranksBySchool[r.idx] = [];
      ranksBySchool[r.idx].push(i + 1);
    });
  }
  const points = [];
  Object.keys(ranksBySchool).forEach(k => {
    const idx = +k;
    const ranks = ranksBySchool[idx];
    if (ranks.length < 3) return;
    points.push({
      x: +avg(ranks).toFixed(2),
      y: +stdDev(ranks).toFixed(2),
      name: schoolLabel(data.s[idx], idx, data.cityMap)
    });
  });
  return points;
}

export function computeSmoothedNationalTrend(data) {
  const { years, bel, mat } = computeNationalAverage(data);
  return {
    years,
    belRaw: bel,
    matRaw: mat,
    belSmooth: movingAverage(bel, 3),
    matSmooth: movingAverage(mat, 3)
  };
}

export function computeConfidenceVsSize(data) {
  const years = buildYears(data);
  const points = [];
  eachSchool(data.s, (sch, idx) => {
    const scores = [];
    const counts = [];
    for (let yr = 0; yr < years.length; yr++) {
      const score = combinedScoreAtYear(sch, yr);
      if (score == null) continue;
      const participants = Math.max((sch.bu && sch.bu[yr]) || 0, (sch.mu && sch.mu[yr]) || 0);
      if (participants <= 0) continue;
      scores.push(score);
      counts.push(participants);
    }
    if (scores.length < 3) return;
    const sd = stdDev(scores);
    if (sd == null) return;
    const ci95 = 1.96 * sd / Math.sqrt(scores.length);
    points.push({
      x: +avg(counts).toFixed(0),
      y: +ci95.toFixed(2),
      name: schoolLabel(sch, idx, data.cityMap)
    });
  });
  return points;
}

export function computeDeltaFromBenchmarks(data) {
  const cityAgg = {};
  let bS = 0, bW = 0, mS = 0, mW = 0;
  eachSchool(data.s, (sch, idx) => {
    const city = data.cityMap[idx];
    if (!cityAgg[city]) cityAgg[city] = { bS: 0, bW: 0, mS: 0, mW: 0 };
    const c = cityAgg[city];
    sch.b.forEach((v, yr) => {
      if (v == null) return;
      const w = (sch.bu && sch.bu[yr]) || 1;
      bS += v * w; bW += w;
      c.bS += v * w; c.bW += w;
    });
    sch.m.forEach((v, yr) => {
      if (v == null) return;
      const w = (sch.mu && sch.mu[yr]) || 1;
      mS += v * w; mW += w;
      c.mS += v * w; c.mW += w;
    });
  });
  const nationalAvg = (bW > 0 && mW > 0) ? (bS / bW + mS / mW) / 2 : null;
  if (nationalAvg == null) return { over: [], under: [] };

  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b);
    const m = avg(sch.m);
    if (b == null || m == null) return;
    const city = data.cityMap[idx];
    const c = cityAgg[city];
    const cityAvg = c && c.bW > 0 && c.mW > 0 ? (c.bS / c.bW + c.mS / c.mW) / 2 : null;
    rows.push({
      name: schoolLabel(sch, idx, data.cityMap),
      schoolAvg: +((b + m) / 2).toFixed(2),
      deltaNational: +(((b + m) / 2 - nationalAvg).toFixed(2)),
      deltaCity: cityAvg == null ? null : +(((b + m) / 2 - cityAvg).toFixed(2))
    });
  });
  rows.sort((a, b) => b.deltaNational - a.deltaNational);
  return {
    over: rows.slice(0, TABLE_ROWS),
    under: rows.slice(-TABLE_ROWS).reverse()
  };
}

export function computeCityConvergence(data) {
  const years = buildYears(data);
  const spread = [];
  const p90p10 = [];
  for (let yr = 0; yr < years.length; yr++) {
    const cityAcc = {};
    eachSchool(data.s, (sch, idx) => {
      const score = combinedScoreAtYear(sch, yr);
      if (score == null) return;
      const city = data.cityMap[idx] || '(без град)';
      if (!cityAcc[city]) cityAcc[city] = { s: 0, w: 0 };
      const w = Math.max((sch.bu && sch.bu[yr]) || 0, (sch.mu && sch.mu[yr]) || 0, 1);
      cityAcc[city].s += score * w;
      cityAcc[city].w += w;
    });
    const cityVals = Object.values(cityAcc).filter(v => v.w > 0).map(v => v.s / v.w).sort((a, b) => a - b);
    if (cityVals.length < 2) {
      spread.push(null);
      p90p10.push(null);
      continue;
    }
    spread.push(+(cityVals[cityVals.length - 1] - cityVals[0]).toFixed(2));
    p90p10.push(+(percentile(cityVals, 90) - percentile(cityVals, 10)).toFixed(2));
  }
  return { years, spread, p90p10 };
}

export function computeSubjectProfileStability(data) {
  const years = buildYears(data);
  const points = [];
  eachSchool(data.s, (sch, idx) => {
    const gaps = [];
    for (let yr = 0; yr < years.length; yr++) {
      if (sch.b[yr] != null && sch.m[yr] != null) gaps.push(sch.b[yr] - sch.m[yr]);
    }
    if (gaps.length < 3) return;
    points.push({
      x: +avg(gaps).toFixed(2),
      y: +stdDev(gaps).toFixed(2),
      name: schoolLabel(sch, idx, data.cityMap)
    });
  });
  return points;
}

export function computeQuadrantMigration(data) {
  const years = buildYears(data);
  const quadrantNames = ['Шампиони', 'Изгряващи', 'В упадък', 'Проблемни'];
  if (years.length < 3) return { quadrantNames, matrix: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] };

  const yearMedians = [];
  for (let yr = 0; yr < years.length; yr++) {
    const scores = [];
    eachSchool(data.s, sch => {
      const s = combinedScoreAtYear(sch, yr);
      if (s != null) scores.push(s);
    });
    scores.sort((a, b) => a - b);
    yearMedians[yr] = percentile(scores, 50);
  }

  const matrix = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  function quadrant(score, change, median) {
    if (score >= median && change >= 0) return 0;
    if (score < median && change >= 0) return 1;
    if (score >= median && change < 0) return 2;
    return 3;
  }

  eachSchool(data.s, sch => {
    for (let yr = 2; yr < years.length; yr++) {
      const y0 = combinedScoreAtYear(sch, yr - 2);
      const y1 = combinedScoreAtYear(sch, yr - 1);
      const y2 = combinedScoreAtYear(sch, yr);
      if (y0 == null || y1 == null || y2 == null) continue;
      const prevQ = quadrant(y1, y1 - y0, yearMedians[yr - 1]);
      const currQ = quadrant(y2, y2 - y1, yearMedians[yr]);
      matrix[prevQ][currQ]++;
    }
  });
  return { quadrantNames, matrix };
}

export function computeCityInequalityIndex(data) {
  const byCity = {};
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    const city = data.cityMap[idx];
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push((b + m) / 2);
  });
  const rows = [];
  Object.keys(byCity).forEach(city => {
    const vals = byCity[city].sort((a, b) => a - b);
    if (vals.length < 5) return;
    rows.push({
      city,
      spread: +(percentile(vals, 90) - percentile(vals, 10)).toFixed(2)
    });
  });
  return rows.sort((a, b) => b.spread - a.spread);
}

export function computePersistentDeciles(data) {
  const years = buildYears(data);
  const topCnt = {}, bottomCnt = {}, seenCnt = {};
  for (let yr = 0; yr < years.length; yr++) {
    const rows = [];
    eachSchool(data.s, (sch, idx) => {
      const v = combinedScoreAtYear(sch, yr);
      if (v == null) return;
      rows.push({ idx, v });
      seenCnt[idx] = (seenCnt[idx] || 0) + 1;
    });
    rows.sort((a, b) => b.v - a.v);
    if (!rows.length) continue;
    const n = Math.max(1, Math.ceil(rows.length * 0.1));
    rows.slice(0, n).forEach(r => { topCnt[r.idx] = (topCnt[r.idx] || 0) + 1; });
    rows.slice(-n).forEach(r => { bottomCnt[r.idx] = (bottomCnt[r.idx] || 0) + 1; });
  }
  function mkRows(counter) {
    return Object.keys(counter).map(k => {
      const idx = +k;
      const count = counter[idx];
      const seen = seenCnt[idx] || 1;
      return {
        name: schoolLabel(data.s[idx], idx, data.cityMap),
        count,
        seen,
        ratio: +((count / seen) * 100).toFixed(1)
      };
    }).sort((a, b) => b.count - a.count || b.ratio - a.ratio).slice(0, TABLE_ROWS);
  }
  return { top: mkRows(topCnt), bottom: mkRows(bottomCnt) };
}

export function computeCompositeScore(data) {
  const years = buildYears(data);
  const rows = [];
  eachSchool(data.s, (sch, idx) => {
    const series = combinedSeries(sch, years.length).filter(v => v != null);
    const recent = combinedSeries(sch, years.length).slice(-TREND_YEARS).filter(v => v != null);
    if (series.length < 3 || recent.length < 2) return;
    const level = avg(series);
    const stability = stdDev(recent);
    if (level == null || stability == null) return;
    const trend = recent[recent.length - 1] - recent[0];
    rows.push({
      name: schoolLabel(sch, idx, data.cityMap),
      level,
      stability,
      trend
    });
  });
  if (!rows.length) return [];

  const lvlVals = rows.map(r => r.level);
  const stabVals = rows.map(r => r.stability);
  const trVals = rows.map(r => r.trend);
  const minMax = vals => ({ min: Math.min(...vals), max: Math.max(...vals) });
  const lvlMM = minMax(lvlVals), stabMM = minMax(stabVals), trMM = minMax(trVals);
  const norm = (v, mm) => mm.max === mm.min ? 0.5 : (v - mm.min) / (mm.max - mm.min);

  rows.forEach(r => {
    const lvl = norm(r.level, lvlMM);
    const st = 1 - norm(r.stability, stabMM);
    const tr = norm(r.trend, trMM);
    r.score = +(100 * (0.5 * lvl + 0.25 * st + 0.25 * tr)).toFixed(2);
    r.level = +r.level.toFixed(2);
    r.stability = +r.stability.toFixed(2);
    r.trend = +r.trend.toFixed(2);
  });
  return rows.sort((a, b) => b.score - a.score).slice(0, TABLE_ROWS);
}
