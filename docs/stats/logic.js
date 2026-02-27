'use strict';

const TABLE_ROWS        = 15;
const STABLE_MIN_SCORES = 4;
const ALL_CITIES_VALUE  = '__all__';
const CITY_SEPARATOR_LABEL = '────';
const FEATURED_CITIES   = ['София', 'Пловдив', 'Варна', 'Бургас'];
const OBLAST_CITIES     = [
  'Благоевград', 'Бургас', 'Варна', 'Велико Търново', 'Видин', 'Враца', 'Габрово',
  'Добрич', 'Кърджали', 'Кюстендил', 'Ловеч', 'Монтана', 'Пазарджик', 'Перник',
  'Плевен', 'Пловдив', 'Разград', 'Русе', 'Силистра', 'Сливен', 'Смолян', 'София',
  'Стара Загора', 'Търговище', 'Хасково', 'Шумен', 'Ямбол'
];

let _cache  = {};
let _charts = {};
let _activeData = null;
let _citySelects = {};
let _activeGrade = 7;

// ─── Зареждане на данни ───────────────────────────────────────────────────────
//
// Всяко ниво се зарежда с fetch() и се изпълнява в изолиран скоуп чрез
// new Function(), за да се избегнат конфликти при `let s` / `let si`.
// Fix-ът за 2018 г. (само 7 клас) се прилага веднъж при зареждане.

async function loadGrade(grade) {
  if (_cache[grade]) return _cache[grade];

  const [cfgText, schoolsText] = await Promise.all([
    fetch('../js/config-' + grade + '.js').then(r => r.text()),
    fetch('../js/schools-' + grade + '.js').then(r => r.text())
  ]);

  const data = new Function(
    cfgText + '\n' + schoolsText + '\n' +
    'return {s,si,firstYear,numYears,chartBTitle,chartMTitle,chartFloor,chartCeiling,fix2018};'
  )();

  // 2018: резултатите са по 65-точкова скала → нормализиране към 0-100
  // (идентична логика с fixForYear2018() в основния logic.js)
  if (data.fix2018) {
    const i2018 = 2018 - data.firstYear;
    if (i2018 >= 0) {
      data.s.forEach(sch => {
        if (!sch) return;
        if (sch.b[i2018] != null) {
          sch.b[i2018] = Math.floor(sch.b[i2018] * 10000 / 65 + Number.EPSILON) / 100;
        }
        if (sch.m[i2018] != null) {
          sch.m[i2018] = Math.floor(sch.m[i2018] * 10000 / 65 + Number.EPSILON) / 100;
        }
      });
    }
  }

  // Визуализира се прозорец от последните `numYears` години,
  // броено назад от последната налична година с данни.
  applyConfiguredYearWindow(data);

  // Изгражда map: индекс на училище → град
  data.cityMap = buildCityMap(data.si);

  // Изгражда map: индекс на училище → тип ('n' публично / 'p' частно)
  data.typeMap = buildTypeMap(data.si);

  _cache[grade] = data;
  return data;
}

function applyConfiguredYearWindow(data) {
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

  const span = Math.max(1, data.numYears || 1);
  const start = Math.max(0, last - span + 1);
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

// ─── Помощни функции ──────────────────────────────────────────────────────────

// Итерира само реалните записи на sparse масива s[] с техния индекс
function eachSchool(s, fn) {
  s.forEach((sch, idx) => { if (sch) fn(sch, idx); });
}

// Кратко ime + "(град)" — автоматично работи с всяко ново училище
function schoolLabel(sch, idx, cityMap) {
  const city = cityMap[idx];
  return sch.l + (city ? ' (' + city + ')' : '');
}

// Изгражда map от индекс на училище към название на град
function buildCityMap(si) {
  const map = {};
  for (const city of Object.keys(si)) {
    const r = si[city];
    if (!r) continue;
    if (r.n) { for (let i = r.n[0]; i <= r.n[1]; i++) map[i] = city; }
    if (r.p) { for (let i = r.p[0]; i <= r.p[1]; i++) map[i] = city; }
  }
  return map;
}

// Изгражда map от индекс на училище към тип: 'n' (публично) или 'p' (частно)
function buildTypeMap(si) {
  const map = {};
  for (const city of Object.keys(si)) {
    const r = si[city];
    if (!r) continue;
    if (r.n) { for (let i = r.n[0]; i <= r.n[1]; i++) map[i] = 'n'; }
    if (r.p) { for (let i = r.p[0]; i <= r.p[1]; i++) map[i] = 'p'; }
  }
  return map;
}

function avg(arr) {
  const v = arr.filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function stdDev(arr) {
  const v = arr.filter(x => x != null);
  if (v.length < 2) return null;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length);
}

// Връща x-оста като масив от години, като премахва trailing null години
// (аналогично на normalizeSeries() в основния logic.js)
function buildYears(data) {
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

// Изчислява границите на оста от конкретно визуализираните стойности
function axisBounds(values, data) {
  const v = values.filter(x => x != null);
  if (!v.length) return { min: data.chartFloor, max: data.chartCeiling };
  const bucket = data.chartCeiling <= 10 ? 0.5 : 5;
  return {
    min: Math.max(data.chartFloor, Math.floor(Math.min(...v) / bucket) * bucket),
    max: Math.min(data.chartCeiling, Math.ceil(Math.max(...v)  / bucket) * bucket)
  };
}

function filterDataByCity(data, city) {
  if (!city || city === ALL_CITIES_VALUE) return data;
  const filteredSchools = [];
  eachSchool(data.s, (sch, idx) => {
    if (data.cityMap[idx] === city) filteredSchools[idx] = sch;
  });
  return Object.assign({}, data, { s: filteredSchools });
}

function sortBg(a, b) {
  return a.localeCompare(b, 'bg');
}

function buildOrderedCityOptions(si) {
  const allCities = Object.keys(si);
  const citySet = new Set(allCities);

  const featured = FEATURED_CITIES.filter(city => citySet.has(city));
  const oblast = OBLAST_CITIES
    .filter(city => citySet.has(city) && !FEATURED_CITIES.includes(city))
    .sort(sortBg);
  const other = allCities
    .filter(city => !FEATURED_CITIES.includes(city) && !OBLAST_CITIES.includes(city))
    .sort(sortBg);

  return { featured, oblast, other };
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function combinedScoreAtYear(sch, yr) {
  const b = sch.b[yr];
  const m = sch.m[yr];
  if (b != null && m != null) return (b + m) / 2;
  if (b != null) return b;
  if (m != null) return m;
  return null;
}

function combinedSeries(sch, yearsCount) {
  const vals = [];
  for (let yr = 0; yr < yearsCount; yr++) {
    vals.push(combinedScoreAtYear(sch, yr));
  }
  return vals;
}

function movingAverage(arr, window) {
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const from = Math.max(0, i - window + 1);
    const part = arr.slice(from, i + 1).filter(v => v != null);
    res.push(part.length ? +avg(part).toFixed(2) : null);
  }
  return res;
}

function isDziGrade() {
  return _activeGrade === 12;
}

function gradeLabel() {
  if (_activeGrade === 4) return 'НВО 4 клас';
  if (_activeGrade === 7) return 'НВО 7 клас';
  if (_activeGrade === 10) return 'НВО 10 клас';
  return 'ДЗИ 12 клас';
}

function setSectionBaseTitle(id, title) {
  const el = document.getElementById(id);
  if (el) el.dataset.baseTitle = title;
}

function applyGradeSuffixToSectionTitles() {
  const prefix = gradeLabel() + ' - ';
  document.querySelectorAll('#stats-content .stat-section h5').forEach(h => {
    if (!h.dataset.baseTitle) {
      h.dataset.baseTitle = h.textContent.replace(/\s+-\s+(НВО 4 клас|НВО 7 клас|НВО 10 клас|ДЗИ 12 клас)$/, '');
    }
    h.textContent = prefix + h.dataset.baseTitle;
  });
}

function subjectTerms(data) {
  const bRaw = data.chartBTitle.split(' - ').pop();
  const mRaw = data.chartMTitle.split(' - ').pop();
  if (isDziGrade()) {
    return {
      bAxis: 'БЕЛ (средна)',
      mAxis: 'ДЗИ-2 (средна)',
      bShort: 'БЕЛ',
      mShort: 'ДЗИ-2',
      bTooltip: 'БЕЛ',
      mTooltip: 'ДЗИ-2'
    };
  }
  return {
    bAxis: 'БЕЛ (средна)',
    mAxis: 'МАТ (средна)',
    bShort: bRaw,
    mShort: mRaw,
    bTooltip: 'БЕЛ',
    mTooltip: 'МАТ'
  };
}

function updateTerminologyUI() {
  const noteBelMat = document.getElementById('note-bel-mat');
  const detailGap = document.getElementById('detail-bel-mat-gap');

  if (isDziGrade()) {
    setSectionBaseTitle('title-bel-mat', 'Матура по БЕЛ спрямо ДЗИ-2');
    if (noteBelMat) noteBelMat.textContent = 'Всяка точка е училище със среден резултат по двете матури.';
    setSectionBaseTitle('title-bel-mat-gap', 'Най-голяма разлика между двете матури');
    if (detailGap) detailGap.textContent = 'Таблиците показват училища с ясно изразен превес в едната матура. Лявата е за по-силен резултат на матурата по БЕЛ, дясната за по-силен резултат на ДЗИ-2.';
    setSectionBaseTitle('title-profile-stability', 'Стабилност на профила (БЕЛ спрямо ДЗИ-2)');
  } else {
    setSectionBaseTitle('title-bel-mat', 'БЕЛ спрямо МАТ');
    if (noteBelMat) noteBelMat.textContent = 'Всяка точка е училище със среден резултат по двата предмета.';
    setSectionBaseTitle('title-bel-mat-gap', 'Най-голяма разлика между двата предмета');
    if (detailGap) detailGap.textContent = 'Таблиците са полезни, ако търсите училище с по-изразен профил. Лявата е за превес на БЕЛ, дясната за превес на МАТ.';
    setSectionBaseTitle('title-profile-stability', 'Стабилност на предметния профил (БЕЛ-МАТ)');
  }

  applyGradeSuffixToSectionTitles();
}

// ─── Изчисления ───────────────────────────────────────────────────────────────

function computeParticipation(data) {
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

function computeNationalAverage(data) {
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
function computeYearOverYear(data) {
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
function computePercentileFan(data) {
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

function computeInequalityTrend(data) {
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

function computePublicPrivate(data) {
  const years = buildYears(data);
  const pub = [], priv = [];
  for (let yr = 0; yr < years.length; yr++) {
    let bSn = 0, bWn = 0, mSn = 0, mWn = 0;
    let bSp = 0, bWp = 0, mSp = 0, mWp = 0;
    eachSchool(data.s, (sch, idx) => {
      const t = data.typeMap[idx];
      if (sch.b[yr] != null) {
        const w = (sch.bu && sch.bu[yr]) || 1;
        if (t === 'n') { bSn += sch.b[yr] * w; bWn += w; }
        else if (t === 'p') { bSp += sch.b[yr] * w; bWp += w; }
      }
      if (sch.m[yr] != null) {
        const w = (sch.mu && sch.mu[yr]) || 1;
        if (t === 'n') { mSn += sch.m[yr] * w; mWn += w; }
        else if (t === 'p') { mSp += sch.m[yr] * w; mWp += w; }
      }
    });
    pub.push(bWn > 0 && mWn > 0 ? +((bSn / bWn + mSn / mWn) / 2).toFixed(2) : null);
    priv.push(bWp > 0 && mWp > 0 ? +((bSp / bWp + mSp / mWp) / 2).toFixed(2) : null);
  }
  return { years, pub, priv };
}

function computeCityRankings(data) {
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
function computeTopCityConcentration(data) {
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

function computeBelMatScatter(data) {
  const pts = [];
  eachSchool(data.s, (sch, idx) => {
    const b = avg(sch.b), m = avg(sch.m);
    if (b == null || m == null) return;
    pts.push({ x: +b.toFixed(2), y: +m.toFixed(2), name: schoolLabel(sch, idx, data.cityMap) });
  });
  return pts;
}

function computeBelMatGap(data) {
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
function computeQuadrantScatter(data) {
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

function computeSizeScatter(data) {
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
function computeStabilityVsSize(data) {
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

function computeDistribution(data) {
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
    categories: keys.map(k => k.toFixed(fmt) + '–' + (k + bucket).toFixed(fmt)),
    values: keys.map(k => counts[k])
  };
}

// Разпределение на размерите на училищата (брой ученици)
function computeSizeDistribution(data) {
  const BUCKETS = [
    { label: '1–9',   min: 1,   max: 9   },
    { label: '10–19', min: 10,  max: 19  },
    { label: '20–29', min: 20,  max: 29  },
    { label: '30–49', min: 30,  max: 49  },
    { label: '50–74', min: 50,  max: 74  },
    { label: '75–99', min: 75,  max: 99  },
    { label: '100–149', min: 100, max: 149 },
    { label: '150–199', min: 150, max: 199 },
    { label: '200–299', min: 200, max: 299 },
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

function computeTopSchools(data) {
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
function computeTopLargeSchools(data) {
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

const TREND_YEARS = 5;

function computeTrend(data) {
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
function computeImprovementRate(data) {
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
function computeConsistentlyImproving(data) {
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

function computeStable(data) {
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

function computeRankStability(data) {
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

function computeSmoothedNationalTrend(data) {
  const { years, bel, mat } = computeNationalAverage(data);
  return {
    years,
    belRaw: bel,
    matRaw: mat,
    belSmooth: movingAverage(bel, 3),
    matSmooth: movingAverage(mat, 3)
  };
}

function computeConfidenceVsSize(data) {
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

function computeDeltaFromBenchmarks(data) {
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

function computeCityConvergence(data) {
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

function computeSubjectProfileStability(data) {
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

function computeQuadrantMigration(data) {
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

function computeCityInequalityIndex(data) {
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

function computePersistentDeciles(data) {
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

function computeCompositeScore(data) {
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

// ─── Рендиране на графики ─────────────────────────────────────────────────────

function chart(id, config) {
  if (_charts[id]) _charts[id].destroy();
  config.chart      = Object.assign({ animation: false, height: 430 }, config.chart || {});
  config.title      = Object.assign({ text: null }, config.title || {});
  config.credits    = { enabled: false };
  config.tooltip    = Object.assign({ animation: false, style: { fontSize: '1.25em' } }, config.tooltip || {});
  config.plotOptions = Object.assign({ series: { animation: false } }, config.plotOptions || {});
  _charts[id] = Highcharts.chart(id, config);
}

function renderParticipation(data) {
  const { years, schoolCount, belStudents, matStudents } = computeParticipation(data);
  const bLabel = data.chartBTitle.split(' - ').pop();
  const mLabel = data.chartMTitle.split(' - ').pop();
  const hasBel = belStudents.some(v => v != null);
  const hasMat = matStudents.some(v => v != null);

  const yAxisArr = [{ title: { text: 'Брой училища' }, min: 0 }];
  const seriesArr = [{ name: 'Брой училища', data: schoolCount, yAxis: 0, color: '#2980b9' }];
  if (hasBel || hasMat) {
    yAxisArr.push({ title: { text: 'Брой ученици' }, min: 0, opposite: true });
    if (hasBel) seriesArr.push({ name: bLabel, data: belStudents, yAxis: 1, color: '#27ae60' });
    if (hasMat) seriesArr.push({ name: mLabel, data: matStudents, yAxis: 1, color: '#e67e22' });
  }
  chart('chart-participation', {
    chart: { height: 360 },
    xAxis: { categories: years },
    yAxis: yAxisArr,
    tooltip: { shared: true, valueDecimals: 0 },
    series: seriesArr
  });
}

function renderNationalAverage(data) {
  const { years, bel, mat } = computeNationalAverage(data);
  const yb = axisBounds(bel.concat(mat), data);
  chart('chart-national', {
    xAxis: { categories: years },
    yAxis: { title: { text: null }, min: yb.min, max: yb.max },
    tooltip: { valueDecimals: 2 },
    series: [
      { name: data.chartBTitle.split(' - ').pop(), data: bel },
      { name: data.chartMTitle.split(' - ').pop(), data: mat }
    ]
  });
}

function renderYearOverYear(data) {
  const { years, bel, mat } = computeYearOverYear(data);
  const bLabel = data.chartBTitle.split(' - ').pop();
  const mLabel = data.chartMTitle.split(' - ').pop();
  chart('chart-yoy', {
    chart: { type: 'column', height: 360 },
    xAxis: { categories: years },
    yAxis: { title: { text: 'Промяна' }, plotLines: [{ value: 0, color: '#666', width: 1, zIndex: 3 }] },
    tooltip: { valueDecimals: 2, shared: true },
    plotOptions: { column: { grouping: true } },
    series: [
      { name: bLabel, data: bel, color: 'rgba(39,174,96,0.75)', negativeColor: 'rgba(192,57,43,0.75)' },
      { name: mLabel, data: mat, color: 'rgba(52,152,219,0.75)', negativeColor: 'rgba(230,126,34,0.75)' }
    ]
  });
}

function renderPercentileFan(data) {
  const { years, p10, p25, p50, p75, p90 } = computePercentileFan(data);
  const allVals = p10.concat(p90).filter(v => v != null);
  const yb = axisBounds(allVals, data);
  chart('chart-percentile-fan', {
    xAxis: { categories: years },
    yAxis: { title: { text: null }, min: yb.min, max: yb.max },
    tooltip: { valueDecimals: 2, shared: true },
    series: [
      { name: 'P90', data: p90, color: '#2980b9', dashStyle: 'ShortDash',   lineWidth: 1 },
      { name: 'P75', data: p75, color: '#2980b9', dashStyle: 'ShortDot',    lineWidth: 1.5 },
      { name: 'P50 (медиана)', data: p50, color: '#2980b9', dashStyle: 'Solid', lineWidth: 3 },
      { name: 'P25', data: p25, color: '#2980b9', dashStyle: 'ShortDot',    lineWidth: 1.5 },
      { name: 'P10', data: p10, color: '#2980b9', dashStyle: 'ShortDash',   lineWidth: 1 }
    ]
  });
}

function renderInequalityTrend(data) {
  const { years, values } = computeInequalityTrend(data);
  chart('chart-inequality', {
    chart: { height: 300 },
    xAxis: { categories: years },
    yAxis: { title: { text: 'Стандартно отклонение' }, min: 0 },
    tooltip: { valueDecimals: 2 },
    series: [{ name: 'Стандартно отклонение', data: values, color: '#8e44ad', showInLegend: false }]
  });
}

function renderPublicPrivate(data) {
  const { years, pub, priv } = computePublicPrivate(data);
  const yb = axisBounds(pub.concat(priv), data);
  const hasPrivate = priv.some(v => v != null);
  const series = [{ name: 'Публични', data: pub, color: '#27ae60' }];
  if (hasPrivate) series.push({ name: 'Частни', data: priv, color: '#e74c3c' });
  chart('chart-pubpriv', {
    xAxis: { categories: years },
    yAxis: { title: { text: null }, min: yb.min, max: yb.max },
    tooltip: { valueDecimals: 2 },
    series
  });
}

function renderCityRankings(data) {
  const rows = computeCityRankings(data);
  const height = Math.max(360, rows.length * 22 + 80);
  const yb = axisBounds(rows.map(r => r.avg), data);
  chart('chart-city', {
    chart: { type: 'bar', height },
    xAxis: { categories: rows.map(r => r.city) },
    yAxis: { title: { text: null }, min: yb.min, max: yb.max },
    tooltip: { valueDecimals: 2 },
    series: [{ name: 'Средна оценка', data: rows.map(r => r.avg), showInLegend: false, color: 'rgba(52,152,219,0.75)' }]
  });
}

function renderTopCityConcentration(data) {
  const rows = computeTopCityConcentration(data);
  chart('chart-city-concentration', {
    chart: { type: 'bar', height: Math.max(260, rows.length * 30 + 80) },
    xAxis: { categories: rows.map(r => r.city) },
    yAxis: { title: { text: 'Брой училища' }, allowDecimals: false, min: 0 },
    tooltip: { valueDecimals: 0 },
    series: [{ name: 'Брой в топ ' + TABLE_ROWS, data: rows.map(r => r.count), showInLegend: false, color: 'rgba(230,126,34,0.75)' }]
  });
}

function renderDistribution(data) {
  const { categories, values } = computeDistribution(data);
  chart('chart-dist', {
    chart: { type: 'column', height: 360 },
    xAxis: { categories, title: { text: 'Резултат' }, labels: { rotation: -45 } },
    yAxis: { title: { text: 'Брой записи' } },
    plotOptions: {
      column: { groupPadding: 0, pointPadding: 0.02, borderWidth: 0.5, animation: false }
    },
    series: [{ name: 'Брой записи', data: values, showInLegend: false, color: 'rgba(80,160,80,0.7)' }]
  });
}

function renderSizeDistribution(data) {
  const { categories, values } = computeSizeDistribution(data);
  chart('chart-size-dist', {
    chart: { type: 'column', height: 360 },
    xAxis: { categories, title: { text: 'Среден брой ученици на изпит' }, labels: { rotation: -30 } },
    yAxis: { title: { text: 'Брой училища' } },
    plotOptions: {
      column: { groupPadding: 0, pointPadding: 0.02, borderWidth: 0.5, animation: false }
    },
    series: [{ name: 'Брой училища', data: values, showInLegend: false, color: 'rgba(155,89,182,0.7)' }]
  });
}

function renderBelMatScatter(data) {
  const pts = computeBelMatScatter(data);
  const xb = axisBounds(pts.map(p => p.x), data);
  const yb = axisBounds(pts.map(p => p.y), data);
  const t = subjectTerms(data);
  chart('chart-bel-mat', {
    chart: { type: 'scatter' },
    xAxis: { title: { text: t.bAxis }, min: xb.min, max: xb.max },
    yAxis: { title: { text: t.mAxis }, min: yb.min, max: yb.max },
    tooltip: {
      formatter() {
        return '<b>' + this.point.name + '</b><br>' + t.bTooltip + ': ' + this.x + '<br>' + t.mTooltip + ': ' + this.y;
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [{ name: 'Училища', color: 'rgba(30,120,200,0.35)', data: pts }]
  });
}

function renderBelMatGap(data) {
  const t = subjectTerms(data);
  const bLabel = t.bShort;
  const mLabel = t.mShort;
  document.getElementById('lbl-bel-leads').textContent = bLabel + ' > ' + mLabel;
  document.getElementById('lbl-mat-leads').textContent = mLabel + ' > ' + bLabel;

  const { belLeads, matLeads } = computeBelMatGap(data);

  let h1 = '<thead><tr><th>#</th><th>Училище</th><th>' + bLabel + '</th><th>' + mLabel + '</th><th>Δ</th></tr></thead><tbody>';
  belLeads.forEach((r, i) => {
    h1 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.b + '</td><td>' + r.m + '</td><td class="pos">+' + r.gap.toFixed(2) + '</td></tr>';
  });
  document.getElementById('tbl-bel-leads').innerHTML = h1 + '</tbody>';

  let h2 = '<thead><tr><th>#</th><th>Училище</th><th>' + mLabel + '</th><th>' + bLabel + '</th><th>Δ</th></tr></thead><tbody>';
  matLeads.forEach((r, i) => {
    h2 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.m + '</td><td>' + r.b + '</td><td class="pos">+' + (-r.gap).toFixed(2) + '</td></tr>';
  });
  document.getElementById('tbl-mat-leads').innerHTML = h2 + '</tbody>';
}

function renderQuadrantScatter(data) {
  const { champions, rising, declining, struggling, medianAvg } = computeQuadrantScatter(data);
  const allPts = [...champions, ...rising, ...declining, ...struggling];
  const xb = axisBounds(allPts.map(p => p.x), data);
  const yVals = allPts.map(p => p.y).filter(v => v != null);
  const yAbs = yVals.length ? Math.ceil(Math.max(...yVals.map(Math.abs)) * 10) / 10 + 0.5 : 5;
  chart('chart-quadrant', {
    chart: { type: 'scatter' },
    xAxis: {
      title: { text: 'Средна оценка (всички години)' },
      min: xb.min, max: xb.max,
      plotLines: [{ value: medianAvg, color: '#999', dashStyle: 'Dot', width: 1, zIndex: 3,
        label: {
          text: 'Медиана',
          rotation: 0,
          align: 'center',
          y: 14,
          style: { color: '#666', fontSize: '0.9em', textOutline: 'none' }
        } }]
    },
    yAxis: {
      title: { text: 'Промяна (последни ' + TREND_YEARS + ' год.)' },
      min: -yAbs, max: yAbs,
      plotLines: [{ value: 0, color: '#999', dashStyle: 'Dot', width: 1, zIndex: 3 }],
      plotBands: [
        {
          from: 0,
          to: yAbs,
          color: 'rgba(39,174,96,0.04)',
          label: { text: 'Подобрение (↑)', align: 'right', x: -10, y: 16, style: { color: '#27ae60', fontSize: '0.9em' } }
        },
        {
          from: -yAbs,
          to: 0,
          color: 'rgba(192,57,43,0.04)',
          label: { text: 'Влошаване (↓)', align: 'right', x: -10, y: -8, style: { color: '#c0392b', fontSize: '0.9em' } }
        }
      ]
    },
    tooltip: {
      formatter() {
        const direction = this.y > 0 ? 'подобрение' : this.y < 0 ? 'влошаване' : 'без промяна';
        const sign = this.y > 0 ? '+' : '';
        return '<b>' + this.point.name + '</b><br>Средна: ' + this.x + '<br>Промяна: ' + sign + this.y + ' (' + direction + ')';
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [
      { name: 'Шампиони ↗',  color: 'rgba(39,174,96,0.5)',   data: champions  },
      { name: 'Изгряващи ↖', color: 'rgba(52,152,219,0.5)',  data: rising     },
      { name: 'В упадък ↘',  color: 'rgba(230,126,34,0.5)',  data: declining  },
      { name: 'Проблемни ↙', color: 'rgba(192,57,43,0.5)',   data: struggling }
    ]
  });
}

function renderSizeScatter(data) {
  const pts = computeSizeScatter(data);
  const yb = axisBounds(pts.map(p => p.y), data);
  chart('chart-size', {
    chart: { type: 'scatter' },
    xAxis: { title: { text: 'Среден брой ученици' } },
    yAxis: { title: { text: 'Среден резултат' }, min: yb.min, max: yb.max },
    tooltip: {
      formatter() {
        return '<b>' + this.point.name + '</b><br>Ученици: ' + this.x + '<br>Резултат: ' + this.y;
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [{ name: 'Училища', color: 'rgba(200,80,30,0.35)', data: pts, showInLegend: false }]
  });
}

function renderStabilityVsSize(data) {
  const pts = computeStabilityVsSize(data);
  chart('chart-stability-size', {
    chart: { type: 'scatter' },
    xAxis: { title: { text: 'Среден брой ученици' } },
    yAxis: { title: { text: 'Стандартно отклонение' }, min: 0 },
    tooltip: {
      formatter() {
        return '<b>' + this.point.name + '</b><br>Ученици: ' + this.x + '<br>σ: ' + this.y;
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [{ name: 'Училища', color: 'rgba(142,68,173,0.35)', data: pts, showInLegend: false }]
  });
}

function renderImprovementRate(data) {
  const { years, improved, stable, declined } = computeImprovementRate(data);
  chart('chart-improvement-rate', {
    chart: { type: 'column', height: 360 },
    xAxis: { categories: years },
    yAxis: { title: { text: '%' }, min: 0, max: 100 },
    tooltip: {
      shared: true,
      pointFormatter() {
        return '<span style="color:' + this.color + '">●</span> ' +
          this.series.name + ': <b>' + this.y + '%</b><br>';
      }
    },
    plotOptions: { column: { stacking: 'normal', borderWidth: 0 } },
    series: [
      { name: 'Подобрили се', data: improved, color: 'rgba(39,174,96,0.8)'   },
      { name: 'Стабилни',     data: stable,   color: 'rgba(150,150,150,0.6)' },
      { name: 'Влошили се',   data: declined, color: 'rgba(192,57,43,0.8)'   }
    ]
  });
}

function renderRankStability(data) {
  const pts = computeRankStability(data);
  chart('chart-rank-stability', {
    chart: { type: 'scatter' },
    xAxis: { title: { text: 'Среден ранг (по-ниско = по-добре)' }, reversed: true, min: 1 },
    yAxis: { title: { text: 'σ на ранга' }, min: 0 },
    tooltip: {
      formatter() {
        return '<b>' + this.point.name + '</b><br>Среден ранг: ' + this.x + '<br>σ: ' + this.y;
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [{ name: 'Училища', color: 'rgba(41,128,185,0.35)', data: pts, showInLegend: false }]
  });
}

function renderSmoothedNationalTrend(data) {
  const { years, belRaw, matRaw, belSmooth, matSmooth } = computeSmoothedNationalTrend(data);
  const yb = axisBounds(belRaw.concat(matRaw), data);
  const bLabel = data.chartBTitle.split(' - ').pop();
  const mLabel = data.chartMTitle.split(' - ').pop();
  chart('chart-smoothed-trend', {
    xAxis: { categories: years },
    yAxis: { title: { text: null }, min: yb.min, max: yb.max },
    tooltip: { valueDecimals: 2, shared: true },
    series: [
      { name: bLabel + ' (сурова)', data: belRaw, color: 'rgba(39,174,96,0.35)', dashStyle: 'ShortDot' },
      { name: bLabel + ' (MA3)', data: belSmooth, color: '#27ae60', lineWidth: 3 },
      { name: mLabel + ' (сурова)', data: matRaw, color: 'rgba(52,152,219,0.35)', dashStyle: 'ShortDot' },
      { name: mLabel + ' (MA3)', data: matSmooth, color: '#2980b9', lineWidth: 3 }
    ]
  });
}

function renderConfidenceVsSize(data) {
  const pts = computeConfidenceVsSize(data);
  chart('chart-confidence-size', {
    chart: { type: 'scatter' },
    xAxis: { title: { text: 'Среден брой ученици' }, min: 0 },
    yAxis: { title: { text: '95% интервал (± точки)' }, min: 0 },
    tooltip: {
      formatter() {
        return '<b>' + this.point.name + '</b><br>Ученици: ' + this.x + '<br>CI95: ±' + this.y;
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [{ name: 'Училища', color: 'rgba(192,57,43,0.35)', data: pts, showInLegend: false }]
  });
}

function renderCityConvergence(data) {
  const { years, spread, p90p10 } = computeCityConvergence(data);
  chart('chart-city-convergence', {
    xAxis: { categories: years },
    yAxis: { title: { text: 'Точки' }, min: 0 },
    tooltip: { valueDecimals: 2, shared: true },
    series: [
      { name: 'Разлика лидер-изоставащ', data: spread, color: '#8e44ad' },
      { name: 'P90-P10 между градовете', data: p90p10, color: '#16a085', dashStyle: 'ShortDot' }
    ]
  });
}

function renderSubjectProfileStability(data) {
  const pts = computeSubjectProfileStability(data);
  const t = subjectTerms(data);
  chart('chart-profile-stability', {
    chart: { type: 'scatter' },
    xAxis: {
      title: { text: 'Средна разлика ' + t.bShort + ' - ' + t.mShort },
      plotLines: [{ value: 0, color: '#999', dashStyle: 'Dot', width: 1, zIndex: 3 }]
    },
    yAxis: { title: { text: 'σ на разликата' }, min: 0 },
    tooltip: {
      formatter() {
        return '<b>' + this.point.name + '</b><br>Средна разлика: ' + this.x + '<br>σ: ' + this.y;
      }
    },
    plotOptions: { scatter: { marker: { radius: 3, symbol: 'circle' } } },
    series: [{ name: 'Училища', color: 'rgba(52,73,94,0.35)', data: pts, showInLegend: false }]
  });
}

function renderCityInequalityIndex(data) {
  const rows = computeCityInequalityIndex(data);
  chart('chart-city-inequality-index', {
    chart: { type: 'bar', height: Math.max(320, rows.length * 22 + 80) },
    xAxis: { categories: rows.map(r => r.city) },
    yAxis: { title: { text: 'P90-P10' }, min: 0 },
    tooltip: { valueDecimals: 2 },
    series: [{ name: 'Неравенство', data: rows.map(r => r.spread), showInLegend: false, color: 'rgba(142,68,173,0.7)' }]
  });
}

// ─── Рендиране на таблици ─────────────────────────────────────────────────────

function topTable(rows, data) {
  const bLabel = data.chartBTitle.split(' - ').pop();
  const mLabel = data.chartMTitle.split(' - ').pop();
  let html = '<thead><tr><th>#</th><th>Училище</th><th>' + bLabel + '</th><th>' + mLabel + '</th><th>Средна</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.b + '</td><td>' + r.m + '</td><td>' + r.avg + '</td></tr>';
  });
  document.getElementById('tbl-top').innerHTML = html + '</tbody>';
}

function largeSchoolsTable(rows, data) {
  const bLabel = data.chartBTitle.split(' - ').pop();
  const mLabel = data.chartMTitle.split(' - ').pop();
  let html = '<thead><tr><th>#</th><th>Училище</th><th>' + bLabel + '</th><th>' + mLabel + '</th><th>Средна</th><th>Ученици</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.b + '</td><td>' + r.m + '</td><td>' + r.avg + '</td><td>' + r.size + '</td></tr>';
  });
  document.getElementById('tbl-large-schools').innerHTML = html + '</tbody>';
}

function trendTable(id, rows) {
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Начало</th><th>Край</th><th>Δ</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    const sign = r.change > 0 ? '+' : '';
    const cls  = r.change > 0 ? 'pos' : r.change < 0 ? 'neg' : '';
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.first + '</td><td>' + r.last +
      '</td><td class="' + cls + '">' + sign + r.change + '</td></tr>';
  });
  document.getElementById(id).innerHTML = html + '</tbody>';
}

function consistentTable(rows) {
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Начало</th><th>Край</th><th>Δ</th><th>Год.</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.first + '</td><td>' + r.last +
      '</td><td class="pos">+' + r.change + '</td><td>' + r.count + '</td></tr>';
  });
  document.getElementById('tbl-consistent').innerHTML = html + '</tbody>';
}

function stableTable(rows) {
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Средна</th><th>σ</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.avg + '</td><td>' + r.std + '</td></tr>';
  });
  document.getElementById('tbl-stable').innerHTML = html + '</tbody>';
}

function deltaBenchmarkTables(data) {
  const { over, under } = computeDeltaFromBenchmarks(data);
  let h1 = '<thead><tr><th>#</th><th>Училище</th><th>Средна</th><th>Δ нац.</th><th>Δ град</th></tr></thead><tbody>';
  over.forEach((r, i) => {
    const dCity = r.deltaCity == null ? '—' : (r.deltaCity > 0 ? '+' : '') + r.deltaCity.toFixed(2);
    const dNat = (r.deltaNational > 0 ? '+' : '') + r.deltaNational.toFixed(2);
    const cls = r.deltaNational >= 0 ? 'pos' : 'neg';
    h1 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.schoolAvg.toFixed(2) + '</td><td class="' + cls + '">' + dNat +
      '</td><td>' + dCity + '</td></tr>';
  });
  document.getElementById('tbl-delta-over').innerHTML = h1 + '</tbody>';

  let h2 = '<thead><tr><th>#</th><th>Училище</th><th>Средна</th><th>Δ нац.</th><th>Δ град</th></tr></thead><tbody>';
  under.forEach((r, i) => {
    const dCity = r.deltaCity == null ? '—' : (r.deltaCity > 0 ? '+' : '') + r.deltaCity.toFixed(2);
    const dNat = (r.deltaNational > 0 ? '+' : '') + r.deltaNational.toFixed(2);
    const cls = r.deltaNational >= 0 ? 'pos' : 'neg';
    h2 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.schoolAvg.toFixed(2) + '</td><td class="' + cls + '">' + dNat +
      '</td><td>' + dCity + '</td></tr>';
  });
  document.getElementById('tbl-delta-under').innerHTML = h2 + '</tbody>';
}

function quadrantMigrationTable(data) {
  const { quadrantNames, matrix } = computeQuadrantMigration(data);
  let allTransitions = 0;
  let stableTransitions = 0;
  matrix.forEach((row, i) => {
    row.forEach((v, j) => {
      allTransitions += v;
      if (i === j) stableTransitions += v;
    });
  });
  const stablePct = allTransitions > 0 ? +(stableTransitions / allTransitions * 100).toFixed(1) : 0;
  const summary = document.getElementById('quadrant-migration-summary');
  if (summary) {
    summary.textContent = allTransitions > 0
      ? 'Общо преходи: ' + allTransitions + '. Останали в същата група: ' + stableTransitions + ' (' + stablePct + '%).'
      : 'Няма достатъчно данни за преходи между групите.';
  }

  let html = '<thead><tr><th>От група \\ Към група</th>';
  quadrantNames.forEach(name => { html += '<th>Към: ' + name + '</th>'; });
  html += '<th>Общо</th></tr></thead><tbody>';
  matrix.forEach((row, i) => {
    const total = row.reduce((a, b) => a + b, 0);
    html += '<tr><td><strong>От: ' + quadrantNames[i] + '</strong></td>';
    row.forEach((v, j) => {
      const pct = total > 0 ? +(v / total * 100).toFixed(1) : 0;
      const cls = i === j ? ' class="pos"' : '';
      html += '<td' + cls + '>' + v + ' <span style="color:#666">(' + pct + '%)</span></td>';
    });
    html += '<td><strong>' + total + '</strong></td></tr>';
  });
  html += '</tbody>';
  document.getElementById('tbl-quadrant-migration').innerHTML = html;
}

function persistentDecilesTables(data) {
  const { top, bottom } = computePersistentDeciles(data);
  let h1 = '<thead><tr><th>#</th><th>Училище</th><th>Топ 10%</th><th>Години</th><th>%</th></tr></thead><tbody>';
  top.forEach((r, i) => {
    h1 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.count + '</td><td>' + r.seen + '</td><td>' + r.ratio.toFixed(1) + '%</td></tr>';
  });
  document.getElementById('tbl-persistent-top').innerHTML = h1 + '</tbody>';

  let h2 = '<thead><tr><th>#</th><th>Училище</th><th>Дъно 10%</th><th>Години</th><th>%</th></tr></thead><tbody>';
  bottom.forEach((r, i) => {
    h2 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.count + '</td><td>' + r.seen + '</td><td>' + r.ratio.toFixed(1) + '%</td></tr>';
  });
  document.getElementById('tbl-persistent-bottom').innerHTML = h2 + '</tbody>';
}

function compositeScoreTable(data) {
  const rows = computeCompositeScore(data);
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Индекс</th><th>Ниво</th><th>Стабилност (σ)</th><th>Тренд</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    const tr = (r.trend > 0 ? '+' : '') + r.trend.toFixed(2);
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td><strong>' + r.score.toFixed(2) + '</strong></td><td>' + r.level.toFixed(2) +
      '</td><td>' + r.stability.toFixed(2) + '</td><td>' + tr + '</td></tr>';
  });
  document.getElementById('tbl-composite').innerHTML = html + '</tbody>';
}

const SECTION_DEFS = [
  { key: 'participation', anchorId: 'chart-participation', filterable: true, render: d => renderParticipation(d) },
  { key: 'national', anchorId: 'chart-national', filterable: true, render: d => renderNationalAverage(d) },
  { key: 'smoothed-trend', anchorId: 'chart-smoothed-trend', filterable: true, render: d => renderSmoothedNationalTrend(d) },
  { key: 'yoy', anchorId: 'chart-yoy', filterable: true, render: d => renderYearOverYear(d) },
  { key: 'improvement-rate', anchorId: 'chart-improvement-rate', filterable: true, render: d => renderImprovementRate(d) },
  { key: 'percentile', anchorId: 'chart-percentile-fan', filterable: true, render: d => renderPercentileFan(d) },
  { key: 'inequality', anchorId: 'chart-inequality', filterable: true, render: d => renderInequalityTrend(d) },
  { key: 'pubpriv', anchorId: 'chart-pubpriv', filterable: true, render: d => renderPublicPrivate(d) },
  { key: 'city-rank', anchorId: 'chart-city', filterable: false, render: d => renderCityRankings(d) },
  { key: 'city-inequality-index', anchorId: 'chart-city-inequality-index', filterable: false, render: d => renderCityInequalityIndex(d) },
  { key: 'city-convergence', anchorId: 'chart-city-convergence', filterable: false, render: d => renderCityConvergence(d) },
  { key: 'city-concentration', anchorId: 'chart-city-concentration', filterable: false, render: d => renderTopCityConcentration(d) },
  { key: 'distribution', anchorId: 'chart-dist', filterable: true, render: d => renderDistribution(d) },
  { key: 'size-distribution', anchorId: 'chart-size-dist', filterable: true, render: d => renderSizeDistribution(d) },
  { key: 'bel-mat', anchorId: 'chart-bel-mat', filterable: true, render: d => renderBelMatScatter(d) },
  { key: 'bel-mat-gap', anchorId: 'tbl-bel-leads', filterable: true, render: d => renderBelMatGap(d) },
  { key: 'profile-stability', anchorId: 'chart-profile-stability', filterable: true, render: d => renderSubjectProfileStability(d) },
  { key: 'size', anchorId: 'chart-size', filterable: true, render: d => renderSizeScatter(d) },
  { key: 'stability-size', anchorId: 'chart-stability-size', filterable: true, render: d => renderStabilityVsSize(d) },
  { key: 'confidence-size', anchorId: 'chart-confidence-size', filterable: true, render: d => renderConfidenceVsSize(d) },
  { key: 'quadrant', anchorId: 'chart-quadrant', filterable: true, render: d => renderQuadrantScatter(d) },
  { key: 'quadrant-migration', anchorId: 'tbl-quadrant-migration', filterable: true, render: d => quadrantMigrationTable(d) },
  {
    key: 'trend',
    anchorId: 'tbl-improved',
    filterable: true,
    render: d => {
      const tr = computeTrend(d);
      trendTable('tbl-improved', tr.improved);
      trendTable('tbl-declined', tr.declined);
    }
  },
  { key: 'consistent', anchorId: 'tbl-consistent', filterable: true, render: d => consistentTable(computeConsistentlyImproving(d)) },
  { key: 'stable', anchorId: 'tbl-stable', filterable: true, render: d => stableTable(computeStable(d)) },
  { key: 'rank-stability', anchorId: 'chart-rank-stability', filterable: true, render: d => renderRankStability(d) },
  { key: 'top', anchorId: 'tbl-top', filterable: true, render: d => topTable(computeTopSchools(d), d) },
  { key: 'large-schools', anchorId: 'tbl-large-schools', filterable: true, render: d => largeSchoolsTable(computeTopLargeSchools(d), d) },
  { key: 'delta-benchmark', anchorId: 'tbl-delta-over', filterable: true, render: d => deltaBenchmarkTables(d) },
  { key: 'persistent-deciles', anchorId: 'tbl-persistent-top', filterable: true, render: d => persistentDecilesTables(d) },
  { key: 'composite', anchorId: 'tbl-composite', filterable: true, render: d => compositeScoreTable(d) }
];

function ensureCitySelectors() {
  SECTION_DEFS.filter(def => def.filterable).forEach(def => {
    if (_citySelects[def.key]) return;
    const anchor = document.getElementById(def.anchorId);
    if (!anchor) return;
    const section = anchor.closest('.stat-section');
    if (!section) return;
    const title = section.querySelector('h5');
    if (!title) return;

    const wrap = document.createElement('div');
    wrap.className = 'section-city-filter';
    wrap.innerHTML =
      '<label for="city-filter-' + def.key + '">Град:</label>' +
      '<select id="city-filter-' + def.key + '" class="city-filter-select"></select>';
    title.insertAdjacentElement('afterend', wrap);

    const sel = wrap.querySelector('select');
    _citySelects[def.key] = sel;
    sel.addEventListener('change', () => renderSection(def.key));
  });
}

function syncCitySelectors(data) {
  const { featured, oblast, other } = buildOrderedCityOptions(data.si);
  const allSortedCities = Object.keys(data.si).sort(sortBg);
  Object.keys(_citySelects).forEach(key => {
    const sel = _citySelects[key];
    const prev = sel.value;
    sel.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = ALL_CITIES_VALUE;
    allOpt.textContent = 'Всички градове';
    sel.appendChild(allOpt);

    if (featured.length || oblast.length || other.length) {
      const sep0 = document.createElement('option');
      sep0.disabled = true;
      sep0.textContent = CITY_SEPARATOR_LABEL;
      sel.appendChild(sep0);
    }

    featured.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      sel.appendChild(opt);
    });

    if (oblast.length || other.length) {
      const sep1 = document.createElement('option');
      sep1.disabled = true;
      sep1.textContent = CITY_SEPARATOR_LABEL;
      sel.appendChild(sep1);
    }

    oblast.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      sel.appendChild(opt);
    });

    if (oblast.length && other.length) {
      const sep2 = document.createElement('option');
      sep2.disabled = true;
      sep2.textContent = CITY_SEPARATOR_LABEL;
      sel.appendChild(sep2);
    }

    other.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      sel.appendChild(opt);
    });

    if (prev && (prev === ALL_CITIES_VALUE || allSortedCities.includes(prev))) sel.value = prev;
    else sel.value = ALL_CITIES_VALUE;
  });
}

function renderSection(sectionKey) {
  if (!_activeData) return;
  const def = SECTION_DEFS.find(s => s.key === sectionKey);
  if (!def) return;
  const selectedCity = def.filterable && _citySelects[def.key] ? _citySelects[def.key].value : ALL_CITIES_VALUE;
  const dataForSection = def.filterable ? filterDataByCity(_activeData, selectedCity) : _activeData;
  def.render(dataForSection);
}

function renderAllSections() {
  SECTION_DEFS.forEach(def => renderSection(def.key));
}

function updateBackLink(grade) {
  const backLink = document.getElementById('back-link');
  if (!backLink) return;
  const target = grade === 4 ? '../4'
    : grade === 10 ? '../10'
    : grade === 12 ? '../12'
    : '../';
  backLink.href = target;
}

function gradeFromUrl() {
  const g = +(new URLSearchParams(window.location.search).get('grade'));
  return [4, 7, 10, 12].includes(g) ? g : 7;
}

// ─── Главна функция ───────────────────────────────────────────────────────────

async function activate(grade) {
  _activeGrade = grade;
  updateBackLink(grade);
  history.replaceState(null, '', '?grade=' + grade);

  document.querySelectorAll('.grade-btn').forEach(b => {
    b.classList.toggle('active', +b.dataset.grade === grade);
  });

  document.getElementById('loading').style.display = 'block';
  document.getElementById('stats-content').style.display = 'none';

  try {
    const data = await loadGrade(grade);
    _activeData = data;
    updateTerminologyUI();
    ensureCitySelectors();
    syncCitySelectors(data);

    renderAllSections();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('stats-content').style.display = '';

    // Prefetch на останалите нива в background
    [7, 4, 10, 12].filter(g => g !== grade).forEach(g => loadGrade(g).catch(() => {}));
  } catch (err) {
    document.getElementById('loading').textContent = 'Грешка при зареждане: ' + err.message;
  }
}

// ─── Инит ─────────────────────────────────────────────────────────────────────

Highcharts.setOptions({
  xAxis: {
    labels: { style: { fontSize: '1.25em' } },
    title:  { style: { fontSize: '1.25em' } }
  },
  yAxis: {
    labels: { style: { fontSize: '1.25em' } },
    title:  { style: { fontSize: '1.25em' } }
  },
  legend: { itemStyle: { fontSize: '1.25em' } }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => activate(+btn.dataset.grade));
  });
  activate(gradeFromUrl());
});
