// Балове по паралелки за град (/7/balove/{град}/). Данните са в js/ruo-{град}.js
// (глобални ruoYears и ruoSchools, зареждат се преди този модул).
// Логиката е пренесена 1:1 от стария шаблон на RuoPage; състоянието е в адреса
// (?school=&profile=&gender=true).
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { searchKey, expandAbbreviations } from '../ui/search-text.js';
import { createCombobox } from '../ui/combobox.js';
import { whenHighcharts, lineOptions, createChart, token, onThemeChange } from '../ui/chart-theme.js';
import { rememberCity } from '../core/city-memory.js';

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
  filter: ''
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
  search: document.getElementById('overview-search')
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
  return options;
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
    { name: 'Макс. бал', data: maxTrend, color: maxColor, dashStyle: 'ShortDash' }
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
      { name: 'Макс. бал', data: maxK, color: maxColor }
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
      rows.push({ code, pcode, school: school.n, schoolFull: school.f, profile: school.p[pcode].n, yearMins, trend,
        hay: searchKey(school.n + ' ' + school.f + ' ' + school.p[pcode].n + ' ' + expandAbbreviations(school.n + ' ' + school.f)) });
    });
  });
  return rows;
}

function sortValue(row, col) {
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

function renderOverviewHeader() {
  const dir = (col) => (state.sortCol === col ? (state.sortDir === 1 ? 'ascending' : 'descending') : 'none');
  const sortBtn = (col, label, own) => '<button type="button" class="th-sort'
    + (own && state.sortCol === col ? ' is-sorted' + (state.sortDir === 1 ? ' is-asc' : '') : '')
    + '" data-col="' + col + '">' + label + icon('sort') + '</button>';
  const th = (col, label, cls, title) => '<th class="' + cls + '" aria-sort="' + dir(col) + '"' + (title ? ' title="' + title + '"' : '') + '>'
    + sortBtn(col, label, false) + '</th>';
  let html = '<tr><th class="num col-num">#</th>';
  if (OVERVIEW_COMPACT.matches) {
    // Една колона, два бутона един под друг - като двата реда в клетката (училище, паралелка);
    // всеки подрежда по своята стойност и сам показва, че е активен.
    const on = state.sortCol === 'school' ? 'school' : state.sortCol === 'profile' ? 'profile' : '';
    html += '<th class="col-profile" aria-sort="' + (on ? dir(on) : 'none') + '"><span class="ov-sorts">'
      + sortBtn('school', 'Училище', true) + sortBtn('profile', 'Паралелка', true) + '</span></th>';
  } else {
    html += th('school', 'Училище', 'col-school') + th('profile', 'Паралелка', 'col-profile');
  }
  // "Мин. 26" - годината с две цифри, както "БЕЛ 26" в класацията; пълната е за екранните четци и в подсказката.
  for (let yi = latestYi; yi >= overviewFirstYi; yi--) {
    const y = String(pageYears[yi]);
    // Надписът е в един span: .num .th-sort е row-reverse и иначе "26" би излязло пред "Мин.".
    html += th('year-' + yi, '<span>Мин. <span class="th-qual"><span class="sr-only">' + y.slice(0, 2) + '</span>' + y.slice(-2) + '</span></span>',
      'num col-score', 'Минимален бал ' + y);
  }
  el.thead.innerHTML = html + '<th class="center col-trend group-start">Тренд</th></tr>';
}

const TREND = {
  up: '<span class="trend trend--up" title="По-висок бал от предходната година">' + '↑' + '</span>',
  down: '<span class="trend trend--down" title="По-нисък бал от предходната година">' + '↓' + '</span>',
  same: '<span class="trend trend--same" title="Почти без промяна">' + '→' + '</span>'
};

function renderOverview() {
  const compact = OVERVIEW_COMPACT.matches;
  el.thead.parentElement.classList.toggle('balove-overview__table--compact', compact);
  const terms = searchKey(state.filter).split(' ').filter(Boolean);
  const rows = sortRows(terms.length ? overviewRows.filter((r) => terms.every((t) => r.hay.includes(t))) : overviewRows);
  el.tbody.innerHTML = rows.map((r, i) => {
    let html = '<tr tabindex="0" data-code="' + esc(r.code) + '" data-pcode="' + esc(r.pcode) + '">'
      + '<td class="num muted col-num">' + (i + 1) + '</td>'
      + (compact
        ? '<td class="col-profile"><span class="ov-school" title="' + esc(r.schoolFull) + '">' + esc(r.school) + '</span>'
          + '<span class="ov-profile">' + esc(r.profile) + '</span></td>'
        : '<td class="col-school"><span class="clip" title="' + esc(r.schoolFull) + '">' + esc(r.school) + '</span></td>'
          + '<td class="col-profile"><span class="clip" title="' + esc(r.profile) + '">' + esc(r.profile) + '</span></td>');
    for (let yi = latestYi; yi >= overviewFirstYi; yi--) {
      const v = r.yearMins[yi];
      html += '<td class="num">' + fmt(v) + '</td>';
    }
    return html + '<td class="center group-start">' + (TREND[r.trend] || '') + '</td></tr>';
  }).join('') || '<tr><td colspan="' + ((compact ? 3 : 4) + latestYi - overviewFirstYi + 1) + '" class="muted">Няма паралелки за "' + esc(state.filter) + '".</td></tr>';
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

  el.thead.addEventListener('click', (e) => {
    const b = e.target.closest('[data-col]');
    if (!b) {
      return;
    }
    const col = b.dataset.col;
    state.sortDir = state.sortCol === col ? -state.sortDir : -1;
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
