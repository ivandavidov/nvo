// Балове по паралелки за град (/7/balove/{град}/). Данните са в js/ruo-{град}.js
// (глобални ruoYears и ruoSchools, зареждат се преди този модул).
// Логиката е пренесена 1:1 от стария шаблон на RuoPage; състоянието е в адреса
// (?school=&profile=&gender=true). "Моят бал" (core/bal.js) не е в адреса - пази се само в
// localStorage, за да не стига до анализите.
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { searchKey, expandAbbreviations } from '../ui/search-text.js';
import { createCombobox } from '../ui/combobox.js';
import { whenHighcharts, lineOptions, createChart, token, onThemeChange } from '../ui/chart-theme.js';
import { rememberCity } from '../core/city-memory.js';
import { MIN_BAL, MAX_BAL, MAX_NVO, FORMULAS, GRADE_POINTS, parseScore, balFromParts, reach, readSavedBal, saveBal } from '../core/bal.js';

const YEARS_TO_SHOW = 4;
const OVERVIEW_YEARS_TO_SHOW = 3;
const KLASIRANE_CHARTS = 3;
const KLASS_NAMES = ['1-во', '2-ро', '3-то', '4-то'];
// Под тази ширина (телефон в двата режима, таблет) "Училище" и "Паралелка" са една колона с два
// реда: иначе името на паралелката остава с 90-140 px и се вижда само "Математическ…".
const OVERVIEW_COMPACT = window.matchMedia('(max-width: 1023px)');

/* global ruoYears, ruoSchools */
const years = typeof ruoYears !== 'undefined' ? ruoYears : [];
const schools = typeof ruoSchools !== 'undefined' ? ruoSchools : {};

const firstVisibleYi = Math.max(0, years.length - YEARS_TO_SHOW);
const pageYears = years.slice(firstVisibleYi);
const latestYi = pageYears.length - 1;
const overviewFirstYi = Math.max(0, latestYi - (OVERVIEW_YEARS_TO_SHOW - 1));

const state = {
  school: '',
  profile: '',
  gender: false,
  sortCol: latestYi >= 0 ? 'year-' + latestYi : 'school',
  sortDir: -1,
  filter: '',
  bal: null,          // "Моят бал" (число) или null
  reachOnly: false    // само паралелките в обсега на бала
};
let overviewRows = [];
let trendChart = null;
let klasiraneCharts = [];

const el = {
  schoolInput: document.getElementById('school-input'),
  profile: document.getElementById('profile-select'),
  gender: document.getElementById('gender-toggle'),
  empty: document.getElementById('detail-empty'),
  section: document.getElementById('detail-section'),
  name: document.getElementById('detail-school-name'),
  profileLink: document.getElementById('detail-profile'),
  table: document.getElementById('detail-table'),
  thead: document.getElementById('overview-thead'),
  tbody: document.getElementById('overview-tbody'),
  search: document.getElementById('overview-search'),
  balInput: document.getElementById('bal-input'),
  balClear: document.getElementById('bal-clear'),
  balOnly: document.getElementById('bal-only'),
  balHint: document.getElementById('bal-hint'),
  calcToggle: document.getElementById('bal-calc-toggle'),
  calc: document.getElementById('bal-calc'),
  bel: document.getElementById('bal-bel'),
  mat: document.getElementById('bal-mat'),
  formula: document.getElementById('bal-formula'),
  grade1: document.getElementById('bal-grade1'),
  grade2: document.getElementById('bal-grade2'),
  calcResult: document.getElementById('bal-result')
};

/** Бал с два знака след точката - еднаква ширина, за да са колоните подравнени (490.50, не 490.5). */
function fmt(v) {
  return v !== null && v !== undefined && v !== 0 ? Number(v).toFixed(2) : '-';
}

function visibleData(d) {
  return d.slice(firstVisibleYi);
}

/* ---------------- Адрес ---------------- */

function writeUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('school');
  url.searchParams.delete('profile');
  url.searchParams.delete('gender');
  if (state.school && schools[state.school]) {
    url.searchParams.set('school', state.school);
    if (state.profile && schools[state.school].p[state.profile]) {
      url.searchParams.set('profile', state.profile);
    }
    if (state.gender) {
      url.searchParams.set('gender', 'true');
    }
  }
  const query = url.searchParams.toString();
  try {
    history.replaceState(null, '', url.pathname + (query ? '?' + query : '') + url.hash);
  } catch (e) {
    // Safari ограничава replaceState - адресът ще се обнови при следващата промяна.
  }
}

function readUrl() {
  const params = new URLSearchParams(window.location.search);
  const school = params.get('school') || '';
  let profile = params.get('profile') || '';
  const gender = params.get('gender');
  state.gender = gender === 'true' || gender === '1';
  el.gender.checked = state.gender;
  if (!school || !schools[school]) {
    writeUrl();
    return;
  }
  // По-старите връзки може да са с водещи нули в кода на паралелката ("03909" → "3909").
  if (profile && !schools[school].p[profile]) {
    profile = profile.replace(/^0+(?=.)/, '');
  }
  selectSchool(school, profile && schools[school].p[profile] ? profile : '', false);
  writeUrl();
}

/* ---------------- Обобщение за всички паралелки ---------------- */

function minOf(entries, idx) {
  const vals = entries.map((e) => e[idx]).filter((v) => v > 0);
  return vals.length ? Math.min(...vals) : 0;
}

function maxOf(entries, idx) {
  const vals = entries.map((e) => e[idx]).filter((v) => v > 0);
  return vals.length ? Math.max(...vals) : 0;
}

function aggregateAllProfiles(code) {
  const pcodes = Object.keys(schools[code].p);
  const result = [];
  for (let yi = 0; yi < pageYears.length; yi++) {
    const sourceYi = firstVisibleYi + yi;
    const yearData = [];
    for (let ki = 0; ki < 4; ki++) {
      const entries = [];
      pcodes.forEach((pc) => {
        const d = schools[code].p[pc].d;
        const k = d[sourceYi] ? d[sourceYi][ki] : null;
        if (k) {
          entries.push(k);
        }
      });
      yearData.push(entries.length === 0 ? null : [
        minOf(entries, 0), minOf(entries, 1), minOf(entries, 2),
        maxOf(entries, 3), maxOf(entries, 4), maxOf(entries, 5)
      ]);
    }
    result.push(yearData);
  }
  return result;
}

function currentData() {
  return state.profile ? visibleData(schools[state.school].p[state.profile].d) : aggregateAllProfiles(state.school);
}

/* ---------------- Детайли ---------------- */

function populateProfiles() {
  if (!state.school) {
    el.profile.innerHTML = '<option value="">- Избери паралелка -</option>';
    el.profile.disabled = true;
    return;
  }
  const p = schools[state.school].p;
  el.profile.innerHTML = '<option value="">Всички паралелки</option>'
    + Object.keys(p).map((pc) => '<option value="' + esc(pc) + '">' + esc(p[pc].n) + '</option>').join('');
  el.profile.disabled = false;
  el.profile.value = state.profile;
}

function selectSchool(code, profile, scroll) {
  state.school = code;
  state.profile = profile || '';
  el.schoolInput.value = code ? schools[code].n : '';
  populateProfiles();
  showDetail();
  if (scroll) {
    document.getElementById('detail').scrollIntoView({ block: 'start' });
  }
}

function showDetail() {
  const has = !!state.school;
  el.section.hidden = !has;
  el.empty.hidden = has;
  if (!has) {
    return;
  }
  el.name.textContent = schools[state.school].f;
  // Връзка към профила на училището - само ако има такъв (s; кодовете само от РУО нямат).
  el.profileLink.hidden = !schools[state.school].s;
  el.profileLink.href = '../../../school/' + encodeURIComponent(state.school) + '/';
  const d = currentData();
  renderDetailTable(d);
  renderCharts(d, state.profile ? schools[state.school].p[state.profile].n : 'Всички паралелки');
}

function renderDetailTable(d) {
  const showGender = state.gender;
  const cols = showGender ? 6 : 2;
  const sub = showGender
    ? '<th class="num">Мин</th><th class="num">Мин М</th><th class="num">Мин Ж</th><th class="num">Макс</th><th class="num">Макс М</th><th class="num">Макс Ж</th>'
    : '<th class="num group-start">Мин</th><th class="num">Макс</th>';
  const yis = showGender ? [latestYi] : pageYears.map((y, i) => i).reverse();
  let thead = '<thead><tr><th rowspan="2" class="col-klass">Класиране</th>';
  yis.forEach((yi) => {
    thead += '<th colspan="' + cols + '" class="center group-start">' + pageYears[yi] + '</th>';
  });
  thead += '</tr><tr>';
  yis.forEach(() => { thead += sub; });
  thead += '</tr></thead>';
  let tbody = '<tbody>';
  KLASS_NAMES.forEach((kname, ki) => {
    tbody += '<tr><td class="col-klass">' + kname + '</td>';
    yis.forEach((yi) => {
      const k = d[yi] ? d[yi][ki] : null;
      if (showGender) {
        for (let si = 0; si < 6; si++) {
          tbody += '<td class="num' + (si === 0 ? ' group-start' : '') + '">' + (k ? fmt(k[si]) : '-') + '</td>';
        }
      } else {
        tbody += '<td class="num group-start">' + (k ? fmt(k[0]) : '-') + '</td>';
        tbody += '<td class="num">' + (k ? fmt(k[3]) : '-') + '</td>';
      }
    });
    tbody += '</tr>';
  });
  el.table.innerHTML = thead + tbody + '</tbody>';
}

function chartBase(title, categories, type) {
  const options = lineOptions({ height: 290, categories });
  options.chart.type = type;
  options.title = { text: title, align: 'left', style: { color: token('--text-2', '#3a465c'), fontSize: '13px', fontWeight: '650' } };
  options.legend = { enabled: true, align: 'left', itemStyle: { color: token('--text-2', '#3a465c'), fontWeight: '600', fontSize: '12px' } };
  options.yAxis.title = { text: 'Бал', style: { color: token('--chart-axis', '#5f6b82') } };
  options.yAxis.startOnTick = false;
  options.yAxis.endOnTick = false;
  options.tooltip.useHTML = false;
  options.tooltip.formatter = undefined;
  options.plotOptions.column = { borderRadius: 4, borderWidth: 0, groupPadding: 0.18 };
  if (state.bal !== null) {
    // "Моят бал" - пунктирна линия; оста винаги я побира (и когато балът е над или под всички).
    options.yAxis.plotLines = [balPlotLine()];
    options.yAxis.softMin = state.bal;
    options.yAxis.softMax = state.bal;
  }
  return options;
}

const BAL_LINE_ID = 'my-bal';

/** Линията "Моят бал" - без надпис върху графиката (той закрива стълбовете и точките); името е в легендата. */
function balPlotLine() {
  return { id: BAL_LINE_ID, value: state.bal, color: token('--success', '#0f7a43'), width: 2, dashStyle: 'Dash', zIndex: 4 };
}

/** "Моят бал" в легендата до сериите: празна серия със същия цвят и пунктир; клик скрива/показва линията. */
function balLegendSeries() {
  if (state.bal === null) {
    return [];
  }
  return [{
    name: 'Моят бал ' + state.bal.toFixed(2),
    type: 'line',
    data: [],
    color: token('--success', '#0f7a43'),
    dashStyle: 'Dash',
    marker: { enabled: false },
    enableMouseTracking: false,
    // show/hide идват след смяната на видимостта (legendItemClick в Highcharts 11 - вече след нея).
    events: {
      show() {
        this.chart.yAxis[0].removePlotLine(BAL_LINE_ID);
        this.chart.yAxis[0].addPlotLine(balPlotLine());
      },
      hide() {
        this.chart.yAxis[0].removePlotLine(BAL_LINE_ID);
      }
    }
  }];
}

function renderCharts(d, label) {
  if (!window.Highcharts) {
    return;
  }
  const minColor = token('--chart-bel', '#2f54e0');
  const maxColor = token('--chart-mat', '#e8850c');

  const minTrend = [];
  const maxTrend = [];
  pageYears.forEach((y, yi) => {
    const k1 = d[yi] ? d[yi][0] : null;
    minTrend.push(k1 ? k1[0] : null);
    maxTrend.push(k1 ? k1[3] : null);
  });
  const trend = chartBase(label + ' - 1-во класиране, тренд по години', pageYears.map(String), 'line');
  trend.series = [
    { name: 'Мин. бал', data: minTrend, color: minColor },
    { name: 'Макс. бал', data: maxTrend, color: maxColor, dashStyle: 'ShortDash' },
    ...balLegendSeries()
  ];
  if (trendChart) {
    trendChart.destroy();
  }
  trendChart = createChart('trend-chart', trend);

  const avail = [];
  for (let yi = latestYi; yi >= 0 && avail.length < KLASIRANE_CHARTS; yi--) {
    if (d[yi] && d[yi].some((k) => !!k)) {
      avail.push(yi);
    }
  }
  klasiraneCharts.forEach((ch) => ch && ch.destroy());
  klasiraneCharts = [];
  for (let ci = 0; ci < KLASIRANE_CHARTS; ci++) {
    const box = document.getElementById('klasirane-box-' + ci);
    if (ci >= avail.length) {
      box.hidden = true;
      continue;
    }
    box.hidden = false;
    const yi = avail[ci];
    const minK = [];
    const maxK = [];
    for (let ki = 0; ki < 4; ki++) {
      const k = d[yi] ? d[yi][ki] : null;
      minK.push(k ? k[0] : null);
      maxK.push(k ? k[3] : null);
    }
    const opts = chartBase('Балове по класирания (' + pageYears[yi] + ')', KLASS_NAMES, 'column');
    opts.series = [
      { name: 'Мин. бал', data: minK, color: minColor },
      { name: 'Макс. бал', data: maxK, color: maxColor },
      ...balLegendSeries()
    ];
    klasiraneCharts.push(createChart('klasirane-chart-' + ci, opts));
  }
}

/* ---------------- Класация на паралелките ---------------- */

function buildOverviewRows() {
  const rows = [];
  Object.keys(schools).forEach((code) => {
    const school = schools[code];
    Object.keys(school.p).forEach((pcode) => {
      const d = visibleData(school.p[pcode].d);
      const yearMins = d.map((yearData) => {
        const k1 = yearData && yearData[0];
        return k1 ? k1[0] : null;
      });
      const latest = latestYi >= 0 ? yearMins[latestYi] : null;
      const prev = latestYi >= 1 ? yearMins[latestYi - 1] : null;
      let trend = '';
      if (latest !== null && prev !== null) {
        trend = latest > prev + 0.5 ? 'up' : latest < prev - 0.5 ? 'down' : 'same';
      }
      rows.push({ code, pcode, school: school.n, schoolFull: school.f, profile: school.p[pcode].n, yearMins, trend, d, reach: null,
        hay: searchKey(school.n + ' ' + school.f + ' ' + school.p[pcode].n + ' ' + expandAbbreviations(school.n + ' ' + school.f)) });
    });
  });
  return rows;
}

/** Докъде стига "Моят бал" за всеки ред (null без бал). */
function applyBalToRows() {
  overviewRows.forEach((r) => {
    r.reach = state.bal !== null && latestYi >= 0 ? reach(r.d, state.bal, latestYi) : null;
  });
}

/**
 * Подредбата по "Моят бал" (възходящо): паралелките, за които балът стига, по минимума, който
 * балът преминава - на първото класиране, на което стига - най-високият отгоре; така паралелка,
 * в която се влиза чак на 2-ро класиране, е между тези за 1-во с близък минимум. При равен
 * минимум - първо по-ранното класиране. Накрая "Не стига" - най-малко липсващи точки отгоре.
 * Без данни за годината - null (винаги най-отдолу).
 */
function reachSortKey(row) {
  const x = row.reach;
  if (!x || x.lowest < 0) {
    return null;
  }
  if (x.klass < 0) {
    return 10000 + (x.mins[x.lowest] - state.bal);
  }
  return (MAX_BAL - x.mins[x.klass]) + x.klass / 1000;
}

function sortValue(row, col) {
  if (col === 'reach') {
    return reachSortKey(row);
  }
  return col.indexOf('year-') === 0 ? row.yearMins[Number.parseInt(col.substring(5), 10)] : row[col];
}

function sortRows(rows) {
  return rows.slice().sort((a, b) => {
    const va = sortValue(a, state.sortCol);
    const vb = sortValue(b, state.sortCol);
    if (va === null && vb === null) {
      return 0;
    }
    if (va === null) {
      return 1;
    }
    if (vb === null) {
      return -1;
    }
    if (typeof va === 'string') {
      return state.sortDir * va.localeCompare(vb, 'bg');
    }
    return state.sortDir * (va - vb);
  });
}

/** С въведен бал таблицата е само за последната година - колоните на другите години ги няма. */
function overviewFirstShownYi() {
  return state.bal !== null ? latestYi : overviewFirstYi;
}

function renderOverviewHeader() {
  const withBal = state.bal !== null;
  // Подреждане по колона, която в този изглед я няма (по-стара година) - връщаме се към последната.
  if (withBal && state.sortCol.indexOf('year-') === 0 && state.sortCol !== 'year-' + latestYi) {
    state.sortCol = 'year-' + latestYi;
    state.sortDir = -1;
  }
  const dir = (col) => (state.sortCol === col ? (state.sortDir === 1 ? 'ascending' : 'descending') : 'none');
  const sortBtn = (col, label, own) => '<button type="button" class="th-sort'
    + (own && state.sortCol === col ? ' is-sorted' + (state.sortDir === 1 ? ' is-asc' : '') : '')
    + '" data-col="' + col + '">' + label + icon('sort') + '</button>';
  const th = (col, label, cls, title) => '<th class="' + cls + '" aria-sort="' + dir(col) + '"' + (title ? ' title="' + title + '"' : '') + '>'
    + sortBtn(col, label, false) + '</th>';
  const compact = OVERVIEW_COMPACT.matches;
  const balLabel = 'Моят бал ' + (withBal ? state.bal.toFixed(2) : '');
  let html = '<tr><th class="num col-num">#</th>';
  if (compact) {
    // Една колона, бутоните един под друг - като редовете в клетката (училище, паралелка и с бал -
    // изводът "Моят бал"); всеки подрежда по своята стойност и сам показва, че е активен.
    const own = withBal ? ['school', 'profile', 'reach'] : ['school', 'profile'];
    const on = own.indexOf(state.sortCol) >= 0 ? state.sortCol : '';
    html += '<th class="col-profile" aria-sort="' + (on ? dir(on) : 'none') + '"><span class="ov-sorts">'
      + sortBtn('school', 'Училище', true) + sortBtn('profile', 'Паралелка', true)
      + (withBal ? sortBtn('reach', 'Моят бал', true) : '') + '</span></th>';   // без числото - тясна колона
  } else {
    html += th('school', 'Училище', 'col-school') + th('profile', 'Паралелка', 'col-profile');
    // С бал изводът е веднага след името - заради него е въведен балът.
    if (withBal) {
      html += th('reach', balLabel, 'col-verdict',
        'Подредба: по минимума, който балът преминава (на първото класиране, на което стига) - най-високият отгоре; "Не стига" накрая; клик обръща подредбата');
    }
  }
  // "Мин. 26" - годината с две цифри, както "БЕЛ 26" в класацията; пълната е за екранните четци и в подсказката.
  for (let yi = latestYi; yi >= overviewFirstShownYi(); yi--) {
    const y = String(pageYears[yi]);
    // Надписът е в един span: .num .th-sort е row-reverse и иначе "26" би излязло пред "Мин.".
    html += th('year-' + yi, '<span>Мин. <span class="th-qual"><span class="sr-only">' + y.slice(0, 2) + '</span>' + y.slice(-2) + '</span></span>',
      'num col-score' + (withBal && !compact ? ' group-start' : ''), 'Минимален бал на 1-во класиране, ' + y);
  }
  el.thead.innerHTML = html + (withBal ? '' : '<th class="center col-trend group-start">Тренд</th>') + '</tr>';
}

const TREND = {
  up: '<span class="trend trend--up" title="По-висок бал от предходната година">' + '↑' + '</span>',
  down: '<span class="trend trend--down" title="По-нисък бал от предходната година">' + '↓' + '</span>',
  same: '<span class="trend trend--same" title="Почти без промяна">' + '→' + '</span>'
};

/**
 * Какво значи "Моят бал" за паралелката през последната година - с думи: извод ("Стига за 1-во
 * класиране", "Стига за 3-то класиране", "Не стига") и подробност с точките. HTML без данни от
 * потребителя (само числа и имената на класиранията).
 */
function verdict(r) {
  const x = r.reach;
  const k = (ki) => '<span class="verdict__k">' + KLASS_NAMES[ki] + '</span>';
  if (!x || x.lowest < 0) {
    return { kind: 'none', title: 'Няма данни за ' + pageYears[latestYi], detail: '' };
  }
  if (x.klass >= 0) {
    // Минимумът, който балът преминава - по него е подредбата - и с колко е над него.
    const over = Math.round((state.bal - x.mins[x.klass]) * 100) / 100;
    return { kind: x.klass === 0 ? 'in' : 'later', title: 'Стига за ' + k(x.klass) + ' класиране',
      detail: 'минимумът на ' + k(x.klass) + ' е ' + x.mins[x.klass].toFixed(2) + ' - '
        + (over === 0 ? 'балът е равен на него' : 'с ' + over.toFixed(2) + ' т. над него') };
  }
  const short = Math.round((x.mins[x.lowest] - state.bal) * 100) / 100;
  return { kind: 'out', title: 'Не стига',
    detail: 'липсват ' + short.toFixed(2) + ' т. до минимума на ' + k(x.lowest) + ' класиране' };
}

function verdictHtml(r) {
  const v = verdict(r);
  return '<span class="verdict verdict--' + v.kind + '">' + v.title + '</span>'
    + (v.detail ? '<span class="verdict__detail">' + v.detail + '</span>' : '');
}

function renderOverview() {
  const compact = OVERVIEW_COMPACT.matches;
  const withBal = state.bal !== null;
  const table = el.thead.parentElement;
  table.classList.toggle('balove-overview__table--compact', compact);
  table.classList.toggle('balove-overview__table--bal', withBal);
  const terms = searchKey(state.filter).split(' ').filter(Boolean);
  let rows = terms.length ? overviewRows.filter((r) => terms.every((t) => r.hay.includes(t))) : overviewRows;
  if (withBal) {
    // С бал таблицата е за последната година - паралелките без класиране тогава ги няма (числата в
    // обобщението са само за тези с данни); "Само паралелките, за които балът стига" скрива и "Не стига".
    rows = rows.filter((r) => r.reach && r.reach.lowest >= 0 && (!state.reachOnly || r.reach.klass >= 0));
  }
  rows = sortRows(rows);
  const firstYi = overviewFirstShownYi();
  const cols = (compact ? 2 : 3) + latestYi - firstYi + 1 + (withBal && compact ? 0 : 1);
  if (!rows.length) {
    el.tbody.innerHTML = '<tr><td colspan="' + cols + '" class="muted">'
      + (withBal && state.reachOnly
        ? 'Бал ' + state.bal.toFixed(2) + ' не стига за нито една паралелка' + (terms.length ? ' за "' + esc(state.filter) + '"' : '')
          + ' през ' + pageYears[latestYi] + '. <button type="button" class="btn btn--sm bal__all" data-action="bal-all">Покажи всички</button>'
        : 'Няма паралелки за "' + esc(state.filter) + '".')
      + '</td></tr>';
    return;
  }
  el.tbody.innerHTML = rows.map((r, i) => {
    let html = '<tr tabindex="0" data-code="' + esc(r.code) + '" data-pcode="' + esc(r.pcode) + '">'
      + '<td class="num muted col-num">' + (i + 1) + '</td>'
      + (compact
        ? '<td class="col-profile"><span class="ov-school" title="' + esc(r.schoolFull) + '">' + esc(r.school) + '</span>'
          + '<span class="ov-profile">' + esc(r.profile) + '</span>'
          + (withBal ? '<span class="ov-verdict">' + verdictHtml(r) + '</span>' : '') + '</td>'
        : '<td class="col-school"><span class="clip" title="' + esc(r.schoolFull) + '">' + esc(r.school) + '</span></td>'
          + '<td class="col-profile"><span class="clip" title="' + esc(r.profile) + '">' + esc(r.profile) + '</span></td>'
          + (withBal ? '<td class="col-verdict">' + verdictHtml(r) + '</td>' : ''));
    for (let yi = latestYi; yi >= firstYi; yi--) {
      const v = r.yearMins[yi];
      html += '<td class="num' + (withBal && !compact ? ' group-start' : '') + '">' + fmt(v) + '</td>';
    }
    return html + (withBal ? '' : '<td class="center group-start">' + (TREND[r.trend] || '') + '</td>') + '</tr>';
  }).join('');
}

/* ---------------- Моят бал ---------------- */

const BAL_HINT = el.balHint ? el.balHint.textContent : '';
let reachOnlyPref = false;  // "Само паралелките, за които балът стига" - по подразбиране изключено ("Не стига" се вижда)
let balTimer = 0;

const pl = (n) => (n === 1 ? 'паралелка' : 'паралелки');

/** Обобщението над таблицата: за колко паралелки балът стига на 1-во, на по-късно класиране и за колко не. */
function balSummaryHtml() {
  let active = 0;
  let first = 0;
  let later = 0;
  overviewRows.forEach((r) => {
    if (!r.reach || r.reach.lowest < 0) {
      return;
    }
    active++;
    if (r.reach.klass === 0) {
      first++;
    } else if (r.reach.klass > 0) {
      later++;
    }
  });
  const out = active - first - later;
  const b = (n) => '<strong>' + n + '</strong>';
  const parts = [];
  if (first) {
    parts.push('за ' + b(first) + ' ' + pl(first) + ' на 1-во класиране');
  }
  if (later) {
    parts.push((first ? 'за още ' + b(later) : 'за ' + b(later) + ' ' + pl(later)) + ' на по-късно класиране');
  }
  let line = 'Бал <strong>' + state.bal.toFixed(2) + '</strong> спрямо минималните балове от ' + pageYears[latestYi] + ': '
    + (parts.length ? 'стига ' + parts.join(' и ') + (out ? ', за ' + b(out) + ' не стига' : '') : 'не стига за нито една паралелка')
    + '.';
  // Скритите редове се казват направо - иначе числото "не стига" няма с какво да се сравни в таблицата.
  if (state.reachOnly && out) {
    line += ' Паралелките, за които не стига, са скрити - изключи "Само паралелките, за които балът стига", за да ги видиш.';
  }
  return '<span class="bal__summary">' + line + '</span>'
    + '<span class="bal__note">Минималният бал е балът на последния приет на съответното класиране. Сравнението е по крайния'
    + ' резултат, а не по формулата на всяка паралелка. Балът се пази само на това устройство.</span>';
}

function setBal(value) {
  // Щом се въведе бал, таблицата се подрежда по "Моят бал" (от 1-во класиране); без бал тази
  // колона я няма - връщаме подредбата по последната година.
  if (value !== null && state.bal === null) {
    state.sortCol = 'reach';
    state.sortDir = 1;
  } else if (value === null && state.sortCol === 'reach') {
    state.sortCol = latestYi >= 0 ? 'year-' + latestYi : 'school';
    state.sortDir = -1;
  }
  state.bal = value;
  state.reachOnly = value !== null && reachOnlyPref;
  el.balOnly.disabled = value === null;
  el.balOnly.checked = state.reachOnly;
  applyBalToRows();
  renderOverviewHeader();
  renderOverview();
  if (value === null) {
    el.balHint.textContent = BAL_HINT;
  } else {
    el.balHint.innerHTML = balSummaryHtml();
  }
  el.balHint.classList.remove('is-error');
  if (state.school && window.Highcharts) {
    showDetail();   // линията "Моят бал" в графиките на избраната паралелка
  }
}

function persistBal() {
  const v = {
    bal: el.balInput.value.trim(), bel: el.bel.value.trim(), mat: el.mat.value.trim(),
    formula: el.formula.value, grade1: el.grade1.value, grade2: el.grade2.value
  };
  const empty = !v.bal && !v.bel && !v.mat && !v.grade1 && !v.grade2 && v.formula === FORMULAS[0].key;
  saveBal(empty ? null : v);
}

/** Полето "Моят бал": празно - без бал; невалидно - съобщение, таблицата остава с последния бал. */
function readBalInput(immediate) {
  clearTimeout(balTimer);
  el.balClear.hidden = !el.balInput.value;
  const v = parseScore(el.balInput.value, MAX_BAL, MIN_BAL);
  const invalid = Number.isNaN(v);
  // Докато се пише, "4" е началото на "412" - за число под минимума казваме чак при Enter или
  // напускане на полето; таблицата остава с последния бал.
  if (invalid && !immediate && Number.isFinite(parseScore(el.balInput.value, MAX_BAL))) {
    return;
  }
  el.balInput.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  if (invalid) {
    el.balHint.textContent = 'Балът е число от ' + MIN_BAL + ' до ' + MAX_BAL + ' - например 412.5 или 412,5.';
    el.balHint.classList.add('is-error');
    return;
  }
  const apply = () => {
    setBal(v);
    persistBal();
  };
  if (immediate) {
    apply();
  } else {
    balTimer = setTimeout(apply, 250);
  }
}

function fmtPoints(v) {
  return String(Math.round(v * 100) / 100);
}

const CALC_EMPTY = 'Попълни точките от НВО и двете оценки.';

/** "Изчисли бала": от точките от НВО, избраната формула и двете оценки попълва "Моят бал"
 * (fill = false - само сметката). */
function readCalc(fill) {
  const bel = parseScore(el.bel.value, MAX_NVO);
  const mat = parseScore(el.mat.value, MAX_NVO);
  el.bel.setAttribute('aria-invalid', Number.isNaN(bel) ? 'true' : 'false');
  el.mat.setAttribute('aria-invalid', Number.isNaN(mat) ? 'true' : 'false');
  if (Number.isNaN(bel) || Number.isNaN(mat)) {
    el.calcResult.textContent = 'Точките от НВО са от 0 до ' + MAX_NVO + '.';
    el.calcResult.classList.add('is-error');
    persistBal();
    return;
  }
  el.calcResult.classList.remove('is-error');
  const grade1 = Number(el.grade1.value) || 0;
  const grade2 = Number(el.grade2.value) || 0;
  const bal = balFromParts({ bel, mat, formula: el.formula.value, grade1, grade2 });
  if (bal === null) {
    el.calcResult.textContent = CALC_EMPTY;
    persistBal();
    return;
  }
  const f = FORMULAS.find((x) => x.key === el.formula.value);
  const pts = (g) => GRADE_POINTS.find((x) => x.grade === g).points;
  el.calcResult.innerHTML = 'Бал: <strong>' + bal.toFixed(2) + '</strong> = ' + f.bel + ' × ' + fmtPoints(bel) + ' + '
    + f.mat + ' × ' + fmtPoints(mat) + ' + ' + pts(grade1) + ' + ' + pts(grade2);
  if (fill) {
    el.balInput.value = fmtPoints(bal);
    readBalInput(true);
  }
}

function setupBal() {
  el.formula.innerHTML = FORMULAS.map((f) => '<option value="' + f.key + '">' + esc(f.label) + '</option>').join('');
  const gradeOptions = '<option value="">Избери</option>'
    // Кратко ("6 (50 т.)"), за да се събира в две колони и на 320 px; името на оценката е за екранните четци.
    + GRADE_POINTS.map((g) => '<option value="' + g.grade + '" aria-label="' + esc(g.name) + ' ' + g.grade + ', ' + g.points + ' точки">'
      + g.grade + ' (' + g.points + ' т.)</option>').join('');
  el.grade1.innerHTML = gradeOptions;
  el.grade2.innerHTML = gradeOptions;

  const saved = readSavedBal();
  if (saved) {
    const str = (v) => (typeof v === 'string' ? v : '');
    el.balInput.value = str(saved.bal);
    el.bel.value = str(saved.bel);
    el.mat.value = str(saved.mat);
    if (FORMULAS.some((f) => f.key === saved.formula)) {
      el.formula.value = saved.formula;
    }
    [[el.grade1, saved.grade1], [el.grade2, saved.grade2]].forEach(([sel, v]) => {
      if (GRADE_POINTS.some((g) => String(g.grade) === v)) {
        sel.value = v;
      }
    });
    if ([el.bel, el.mat, el.grade1, el.grade2].some((x) => x.value)) {
      readCalc(false);   // само сметката - балът е запазеният (може да е въведен на ръка)
    }
    readBalInput(true);
  }
  if (!el.calcResult.textContent) {
    el.calcResult.textContent = CALC_EMPTY;
  }

  el.balInput.addEventListener('input', () => readBalInput(false));
  el.balInput.addEventListener('change', () => readBalInput(true));
  el.balInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      readBalInput(true);
    }
  });
  el.balClear.addEventListener('click', () => {
    el.balInput.value = '';
    readBalInput(true);
    el.balInput.focus();
  });
  el.balOnly.addEventListener('change', () => {
    reachOnlyPref = el.balOnly.checked;
    state.reachOnly = state.bal !== null && reachOnlyPref;
    renderOverview();
    if (state.bal !== null) {
      el.balHint.innerHTML = balSummaryHtml();
    }
  });
  el.calcToggle.addEventListener('click', () => {
    const open = el.calc.hidden;
    el.calc.hidden = !open;
    el.calcToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      el.bel.focus();
    }
  });
  [el.bel, el.mat].forEach((inp) => inp.addEventListener('input', () => readCalc(true)));
  [el.formula, el.grade1, el.grade2].forEach((sel) => sel.addEventListener('change', () => readCalc(true)));
}

/* ---------------- Старт ---------------- */

function setupSchoolCombobox() {
  const list = Object.keys(schools).map((code) => ({ code, name: schools[code].n, full: schools[code].f }))
    .sort((a, b) => {
      const an = /^\d/.test(a.name);
      const bn = /^\d/.test(b.name);
      if (an && bn) {
        return Number.parseInt(a.name, 10) - Number.parseInt(b.name, 10);
      }
      if (an) {
        return -1;
      }
      if (bn) {
        return 1;
      }
      return a.name.localeCompare(b.name, 'bg');
    })
    .map((s) => Object.assign(s, { hay: searchKey(s.name + ' ' + s.full + ' ' + s.code + ' ' + expandAbbreviations(s.name + ' ' + s.full)) }));
  createCombobox({
    input: el.schoolInput,
    host: el.schoolInput.closest('.combo'),
    minChars: 0,
    hint: '',
    emptyText: 'Няма такова училище',
    search(q) {
      const terms = searchKey(q).split(' ').filter(Boolean);
      const items = list.filter((s) => terms.every((t) => s.hay.includes(t)))
        .map((s) => ({ id: s.code, title: s.name, meta: s.full !== s.name ? s.full : '', checked: s.code === state.school }));
      return [{ label: '', items }];
    },
    onSelect(item) {
      selectSchool(item.id, '', false);
      writeUrl();
      el.schoolInput.blur();
    }
  });
  // При фокус показваме целия списък (както падащото меню преди).
  el.schoolInput.addEventListener('focus', () => {
    el.schoolInput.value = '';
    el.schoolInput.dispatchEvent(new Event('input'));
  });
  el.schoolInput.addEventListener('blur', () => {
    setTimeout(() => {
      el.schoolInput.value = state.school ? schools[state.school].n : '';
    }, 150);
  });
}

function init() {
  // Баловете на град → този град се показва и на страниците 4/7/10/12.
  rememberCity(document.body.dataset.city);
  if (!years.length) {
    // js/ruo-{град}.js не се е заредил (мрежа, блокиране) - казваме го, вместо празна страница.
    const head = document.querySelector('#main .page-head');
    const html = '<div class="banner" role="alert">' + icon('info')
      + '<span>Данните за баловете не можаха да се заредят. Опитай да презаредиш страницата.</span></div>';
    if (head) {
      head.insertAdjacentHTML('afterend', html);
    }
    return;
  }
  overviewRows = buildOverviewRows();
  renderOverviewHeader();
  renderOverview();
  setupSchoolCombobox();
  setupBal();

  el.thead.addEventListener('click', (e) => {
    const b = e.target.closest('[data-col]');
    if (!b) {
      return;
    }
    const col = b.dataset.col;
    // "Моят бал" започва от 1-во класиране (възходящо), останалите колони - низходящо.
    state.sortDir = state.sortCol === col ? -state.sortDir : (col === 'reach' ? 1 : -1);
    state.sortCol = col;
    renderOverviewHeader();
    renderOverview();
  });
  el.search.addEventListener('input', () => {
    state.filter = el.search.value;
    renderOverview();
  });
  // Завъртане на телефона или смяна на ширината - другият изглед, със същото подреждане и търсене.
  OVERVIEW_COMPACT.addEventListener('change', () => {
    renderOverviewHeader();
    renderOverview();
  });
  const openRow = (tr) => {
    selectSchool(tr.dataset.code, tr.dataset.pcode, true);
    writeUrl();
  };
  el.tbody.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="bal-all"]')) {
      reachOnlyPref = false;
      state.reachOnly = false;
      el.balOnly.checked = false;
      renderOverview();
      el.balHint.innerHTML = balSummaryHtml();
      return;
    }
    const tr = e.target.closest('tr[data-code]');
    if (tr) {
      openRow(tr);
    }
  });
  el.tbody.addEventListener('keydown', (e) => {
    const tr = e.target.closest('tr[data-code]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openRow(tr);
    }
  });
  el.profile.addEventListener('change', () => {
    state.profile = el.profile.value;
    showDetail();
    writeUrl();
  });
  el.gender.addEventListener('change', () => {
    state.gender = el.gender.checked;
    if (state.school) {
      renderDetailTable(currentData());
    }
    writeUrl();
  });

  readUrl();
  whenHighcharts().then(() => {
    if (state.school) {
      showDetail();
    }
  }).catch((err) => console.error(err));
  onThemeChange(() => {
    if (state.school) {
      showDetail();
    }
  });
}

init();

// Менюто "Изтегли ▾" (CSV, PDF; JSON е линк) - модулът се зарежда при първото изтегляне.
document.addEventListener('click', (e) => {
  const item = e.target.closest('[data-action^="balove-"]');
  if (item) {
    import('../core/balove-export.js').then((m) => m.runBaloveExport(item, document.body.dataset.city));
  }
});
