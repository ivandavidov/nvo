// Обобщена статистика (/stats/) - ES модул: графиките и таблиците. Данните идват от
// data/grade-{g}.json; изчисленията са в compute.js (същите ползва и конзолата).
import { labelChart, token, markNoExamYears } from '../js/ui/chart-theme.js';
import { SCHOOL_TYPES } from '../js/core/school-types.js';
import {
  TABLE_ROWS, TREND_YEARS, ALL_CITIES_VALUE, prepareGradeData, avg, filterDataByCity, percentile,
  computeParticipation, computeNationalAverage, computeYearOverYear, computePercentileFan,
  computeInequalityTrend, computeByType, computeCityRankings, computeTopCityConcentration,
  computeBelMatScatter, computeBelMatGap, computeQuadrantScatter, computeSizeScatter,
  computeStabilityVsSize, computeDistribution, computeSizeDistribution, computeTopSchools,
  computeTopLargeSchools, computeTrend, computeImprovementRate, computeConsistentlyImproving,
  computeStable, computeRankStability, computeSmoothedNationalTrend, computeConfidenceVsSize,
  computeDeltaFromBenchmarks, computeCityConvergence, computeSubjectProfileStability,
  computeQuadrantMigration, computeCityInequalityIndex, computePersistentDeciles,
  computeCompositeScore
} from './compute.js';
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

async function loadGrade(grade) {
  if (_cache[grade]) return _cache[grade];

  const res = await fetch('../data/grade-' + grade + '.json');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = prepareGradeData(grade, await res.json());
  _cache[grade] = data;
  return data;
}


// ─── Помощни функции ──────────────────────────────────────────────────────────








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

// Класът се показва над заглавието на всяка секция (вместо като префикс в него).
function applyGradeSuffixToSectionTitles() {
  const label = gradeLabel();
  document.querySelectorAll('#stats-content .stat-section h2').forEach(h => {
    if (!h.dataset.baseTitle) {
      h.dataset.baseTitle = h.textContent;
    }
    h.textContent = h.dataset.baseTitle;
  });
  document.querySelectorAll('#stats-content [data-grade-label]').forEach(el => {
    el.textContent = label;
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
    setSectionBaseTitle('title-bel-mat', 'Зрелостен изпит по БЕЛ спрямо ДЗИ-2');
    if (noteBelMat) noteBelMat.textContent = 'Всяка точка е училище със среден резултат по двата зрелостни изпита.';
    setSectionBaseTitle('title-bel-mat-gap', 'Най-голяма разлика между двата зрелостни изпита');
    if (detailGap) detailGap.textContent = 'Таблиците показват училища с ясно изразен превес в единия зрелостен изпит. Лявата е за по-силен резултат на зрелостния изпит по БЕЛ, дясната за по-силен резултат на ДЗИ-2.';
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
































// ─── Рендиране на графики ─────────────────────────────────────────────────────

function _isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function _themeColors() {
  const dark = _isDark();
  function getThemeColor(varName, fallback) {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName);
      if (val && val.trim()) return val.trim();
    }
    return fallback;
  }
  return {
    text:    getThemeColor('--color-text', dark ? '#e2e8f0' : '#1e293b'),
    muted:   getThemeColor('--color-text-muted', dark ? '#94a3b8' : '#64748b'),
    grid:    getThemeColor('--color-border', dark ? '#334155' : '#e2e8f0'),
    tipBg:   getThemeColor('--color-surface', dark ? '#1e293b' : '#ffffff'),
    tipBord: getThemeColor('--color-border', dark ? '#334155' : '#e2e8f0')
  };
}

function chart(id, config) {
  if (_charts[id]) _charts[id].destroy();
  // Графиките по години: година без изпит (копие на съседна в данните) - "Няма изпит".
  markNoExamYears(config, _activeGrade);
  const tc = _themeColors();
  config.chart      = Object.assign({ animation: false, height: 400, backgroundColor: 'transparent' }, config.chart || {});
  config.title      = Object.assign({ text: null }, config.title || {});
  config.credits    = { enabled: false };
  config.tooltip    = Object.assign({ animation: false, backgroundColor: tc.tipBg, borderColor: tc.tipBord, borderRadius: 10, style: { fontSize: '13px', color: tc.text } }, config.tooltip || {});
  config.plotOptions = Object.assign({ series: { animation: false } }, config.plotOptions || {});
  // Apply theme-aware axis defaults
  const axisDefaults = { labels: { style: { color: tc.muted } }, title: { style: { color: tc.muted } }, gridLineColor: tc.grid, lineColor: tc.grid, tickColor: tc.grid };
  if (Array.isArray(config.yAxis)) {
    config.yAxis = config.yAxis.map(y => Object.assign({}, axisDefaults, y));
  } else {
    config.yAxis = Object.assign({}, axisDefaults, config.yAxis || {});
  }
  config.xAxis = Object.assign({}, axisDefaults, config.xAxis || {});
  config.legend = Object.assign({ itemStyle: { fontSize: '12px', fontWeight: '600', color: tc.text }, itemHoverStyle: { color: tc.text } }, config.legend || {});
  _charts[id] = Highcharts.chart(id, config);
  labelChart(_charts[id]);
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
    yAxis: { title: { text: 'Промяна' }, plotLines: [{ value: 0, color: _themeColors().muted, width: 1, zIndex: 3 }] },
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

function renderByType(data) {
  const { years, byType } = computeByType(data);
  // Линия за всеки вид с данни в класа (духовните са само в 10. и 12. клас) - в цветовете на значките.
  const series = SCHOOL_TYPES
    .filter(t => byType[t.key].some(v => v != null))
    .map(t => ({ name: t.plural, data: byType[t.key], color: token('--type-' + t.key) }));
  const yb = axisBounds(series.flatMap(x => x.data), data);
  chart('chart-pubpriv', {
    xAxis: { categories: years },
    yAxis: { title: { text: null }, min: yb.min, max: yb.max },
    tooltip: { valueDecimals: 2, shared: true },
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
      '</td><td>' + f2(r.b) + '</td><td>' + f2(r.m) + '</td><td class="pos">+' + r.gap.toFixed(2) + '</td></tr>';
  });
  document.getElementById('tbl-bel-leads').innerHTML = h1 + '</tbody>';

  let h2 = '<thead><tr><th>#</th><th>Училище</th><th>' + mLabel + '</th><th>' + bLabel + '</th><th>Δ</th></tr></thead><tbody>';
  matLeads.forEach((r, i) => {
    h2 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + f2(r.m) + '</td><td>' + f2(r.b) + '</td><td class="pos">+' + (-r.gap).toFixed(2) + '</td></tr>';
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
          style: { color: _themeColors().muted, fontSize: '0.9em', textOutline: 'none' }
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
      '</td><td>' + f2(r.b) + '</td><td>' + f2(r.m) + '</td><td>' + f2(r.avg) + '</td></tr>';
  });
  document.getElementById('tbl-top').innerHTML = html + '</tbody>';
}

function largeSchoolsTable(rows, data) {
  const bLabel = data.chartBTitle.split(' - ').pop();
  const mLabel = data.chartMTitle.split(' - ').pop();
  let html = '<thead><tr><th>#</th><th>Училище</th><th>' + bLabel + '</th><th>' + mLabel + '</th><th>Средна</th><th>Ученици</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + f2(r.b) + '</td><td>' + f2(r.m) + '</td><td>' + f2(r.avg) + '</td><td>' + r.size + '</td></tr>';
  });
  document.getElementById('tbl-large-schools').innerHTML = html + '</tbody>';
}

function trendTable(id, rows) {
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Начало</th><th>Край</th><th>Δ</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    const sign = r.change > 0 ? '+' : '';
    const cls  = r.change > 0 ? 'pos' : r.change < 0 ? 'neg' : '';
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + f2(r.first) + '</td><td>' + f2(r.last) +
      '</td><td class="' + cls + '">' + sign + f2(r.change) + '</td></tr>';
  });
  document.getElementById(id).innerHTML = html + '</tbody>';
}

function consistentTable(rows) {
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Начало</th><th>Край</th><th>Δ</th><th>Год.</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + f2(r.first) + '</td><td>' + f2(r.last) +
      '</td><td class="pos">+' + f2(r.change) + '</td><td>' + r.count + '</td></tr>';
  });
  document.getElementById('tbl-consistent').innerHTML = html + '</tbody>';
}

function stableTable(rows) {
  let html = '<thead><tr><th>#</th><th>Училище</th><th>Средна</th><th>σ</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + f2(r.avg) + '</td><td>' + f2(r.std) + '</td></tr>';
  });
  document.getElementById('tbl-stable').innerHTML = html + '</tbody>';
}

function deltaBenchmarkTables(data) {
  const { over, under } = computeDeltaFromBenchmarks(data);
  let h1 = '<thead><tr><th>#</th><th>Училище</th><th>Средна</th><th>Δ нац.</th><th>Δ град</th></tr></thead><tbody>';
  over.forEach((r, i) => {
    const dCity = r.deltaCity == null ? '-' : (r.deltaCity > 0 ? '+' : '') + r.deltaCity.toFixed(2);
    const dNat = (r.deltaNational > 0 ? '+' : '') + r.deltaNational.toFixed(2);
    const cls = r.deltaNational >= 0 ? 'pos' : 'neg';
    h1 += '<tr><td>' + (i + 1) + '</td><td>' + r.name +
      '</td><td>' + r.schoolAvg.toFixed(2) + '</td><td class="' + cls + '">' + dNat +
      '</td><td>' + dCity + '</td></tr>';
  });
  document.getElementById('tbl-delta-over').innerHTML = h1 + '</tbody>';

  let h2 = '<thead><tr><th>#</th><th>Училище</th><th>Средна</th><th>Δ нац.</th><th>Δ град</th></tr></thead><tbody>';
  under.forEach((r, i) => {
    const dCity = r.deltaCity == null ? '-' : (r.deltaCity > 0 ? '+' : '') + r.deltaCity.toFixed(2);
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
      const pct = total > 0 ? (v / total * 100).toFixed(1) : '0.0';
      const cls = i === j ? ' class="pos"' : '';
      html += '<td' + cls + '>' + v + ' <span style="color:var(--text-3)">(' + pct + '%)</span></td>';
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

/** Число с 2 знака след точката за таблиците (63.80, не 63.8 - колоните остават подравнени). */
function f2(v) {
  return typeof v === 'number' ? v.toFixed(2) : v;
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
  { key: 'pubpriv', anchorId: 'chart-pubpriv', filterable: true, render: d => renderByType(d) },
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
    const title = section.querySelector('h2');
    if (!title) return;

    const wrap = document.createElement('div');
    wrap.className = 'section-city-filter';
    wrap.innerHTML =
      '<label class="sr-only" for="city-filter-' + def.key + '">Град</label>' +
      '<select id="city-filter-' + def.key + '" class="select city-filter-select"></select>';
    const tools = section.querySelector('.stat-tools');
    if (tools) tools.appendChild(wrap);
    else title.insertAdjacentElement('afterend', wrap);

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
  const target = grade === 4 ? '../4/'
    : grade === 10 ? '../10/'
    : grade === 12 ? '../12/'
    : '../7/';
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
    b.setAttribute('aria-pressed', String(+b.dataset.grade === grade));
  });

  document.getElementById('loading').hidden = false;
  document.getElementById('stats-content').hidden = true;

  try {
    const data = await loadGrade(grade);
    _activeData = data;
    updateTerminologyUI();
    ensureCitySelectors();
    syncCitySelectors(data);

    renderAllSections();

    document.getElementById('loading').hidden = true;
    document.getElementById('stats-content').hidden = false;

    // Prefetch на останалите нива в background
    [7, 4, 10, 12].filter(g => g !== grade).forEach(g => loadGrade(g).catch(() => {}));
  } catch (err) {
    document.getElementById('loading').textContent = 'Грешка при зареждане: ' + err.message;
  }
}

// ─── Инит ─────────────────────────────────────────────────────────────────────

Highcharts.setOptions({
  accessibility: { enabled: false },
  chart: { style: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' } },
  xAxis: {
    labels: { style: { fontSize: '12px' } },
    title:  { style: { fontSize: '12px' } }
  },
  yAxis: {
    labels: { style: { fontSize: '12px' } },
    title:  { style: { fontSize: '12px' } }
  },
  legend: { itemStyle: { fontSize: '12px' } }
});

// Прерисуване при смяна на светла/тъмна тема (бутон или системна настройка).
document.addEventListener('nvo:themechange', () => {
  if (_activeData) renderAllSections();
});

// Съдържанието: маркира главата, която се вижда в момента.
function setupToc() {
  const links = Array.from(document.querySelectorAll('[data-toc]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  const visible = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    const first = links.find(a => visible.has(a.dataset.toc));
    links.forEach(a => a.classList.toggle('is-active', a === first));
  }, { rootMargin: '-20% 0px -60% 0px' });
  links.forEach(a => {
    const ch = document.getElementById(a.dataset.toc);
    if (ch) io.observe(ch);
  });
}

document.querySelectorAll('.grade-btn').forEach(btn => {
  btn.addEventListener('click', () => activate(+btn.dataset.grade));
});
setupToc();
activate(gradeFromUrl());
