// Страница по клас (/4/, /7/, /10/, /12/): сравнение на училища в графики,
// класации по градове и средни резултати. Данните и изчисленията са в core/model.js.
import {
  fetchGradeData, buildModel, renderableCities, cityRanking, cityInactiveSchools, sortRanking,
  defaultSortDir, firstEmptyRow, rankFor, cityAverages, cityCsv, allCsv,
  chartSeries, findCityForSchool
} from '../core/model.js';
import { initialSelection, linkedSchools, writeSelection, shareUrl, readYearParam, readCityHash } from '../core/url-state.js';
import { readRememberedCity, rememberCity } from '../core/city-memory.js';
import { schoolType, joinTypes, typeBadgeHtml } from '../core/school-types.js';
import { icon } from '../ui/icons.js';
import { esc, download, fmt, showModal } from '../ui/dom.js';
import { searchKey } from '../ui/search-text.js';
import { createCombobox } from '../ui/combobox.js';
import { buildSchoolIndex, searchSchools } from '../ui/school-search.js';
import { exportMenuHtml, menuButtonOf } from '../ui/export-menu.js';
import { stickyTopOffset } from '../ui/sticky-head.js';
import { embedCode } from '../core/embed.js';
import { whenHighcharts, lineOptions, createChart, seriesColor, onThemeChange, PALETTE_SIZE } from '../ui/chart-theme.js';
import { copyText, toast, siteUrl } from '../site.js';

const grade = Number(document.body.dataset.grade);
/** "Добави водещите училища в града" (празната графика) - колко от върха на класацията. */
const SUGGEST_COUNT = 5;

const state = {
  model: null,
  cities: [],
  bySlug: {},
  cityOf: {},          // индекс → град
  selection: [],       // индексите в реда на добавяне
  slots: new Map(),    // индекс → номер на цвета (1..10)
  hidden: new Set(),   // скрити серии
  city: null,
  cityChosen: false,   // градът е избран изрично (клик или #град) → пазим го в адреса
  tab: 'ranking',
  types: [],           // избраните видове ('s', 'm', 'p', 'r'); празно = всички
  sortCol: 'rank',
  sortDir: 'desc',
  showInactive: false,
  subject: 'b',
  charts: { b: null, m: null },
  hcReady: false
};

const el = {
  chips: document.getElementById('selected-chips'),
  add: document.getElementById('school-add'),
  charts: document.getElementById('charts'),
  empty: document.getElementById('compare-empty'),
  subjectSeg: document.getElementById('subject-seg'),
  panel: document.getElementById('city-panel'),
  status: document.getElementById('city-status'),
  switcher: document.getElementById('city-switch'),
  cityFilter: document.getElementById('city-filter'),
  other: document.getElementById('other-cities'),
  yearSelect: document.getElementById('year-select'),
  history: document.getElementById('history-slot'),
  tray: document.getElementById('tray'),
  compare: document.getElementById('compare')
};

/* ------------------------------------------------------------------ избор */

function school(i) {
  return state.model.s[i];
}

function assignSlot(i) {
  if (state.slots.has(i)) {
    return;
  }
  const used = new Set(state.selection.filter((x) => x !== i).map((x) => state.slots.get(x)));
  let slot = 1;
  while (used.has(slot) && slot < PALETTE_SIZE) {
    slot++;
  }
  if (used.has(slot)) {
    slot = (state.selection.length % PALETTE_SIZE) + 1;
  }
  state.slots.set(i, slot);
}

function isSelected(i) {
  return state.selection.includes(i);
}

function setSelected(indices, on) {
  let changed = false;
  indices.forEach((i) => {
    if (on && !isSelected(i) && school(i)) {
      state.selection.push(i);
      assignSlot(i);
      changed = true;
    } else if (!on && isSelected(i)) {
      state.selection = state.selection.filter((x) => x !== i);
      state.slots.delete(i);
      state.hidden.delete(i);
      changed = true;
    }
  });
  if (changed) {
    selectionChanged();
  }
}

function toggleSelected(i) {
  setSelected([i], !isSelected(i));
}

function currentHash() {
  return state.cityChosen && state.city ? state.city.slug : '';
}

function selectionChanged() {
  writeSelection(state.model, state.selection, currentHash());
  renderChips();
  renderCharts();
  syncTableSelection();
  updateTray();
}

/* ------------------------------------------------------------------ чипове */

/** Позиция на всяко избрано училище в каноничната класация на града му (по ранг, низходящо).
 *  Използва се за подреждане на чиповете над графиката спрямо реда в таблицата.
 *  Класацията на всеки град се смята веднъж, а не при всяко сравнение в sort. */
function chipCityOrders(selection) {
  const NONE = Number.MAX_SAFE_INTEGER;
  const rankings = new Map();
  const orders = new Map();
  selection.forEach((i) => {
    const city = state.cityOf[i];
    if (!city) {
      orders.set(i, { cityOrder: NONE, pos: NONE });
      return;
    }
    if (!rankings.has(city.slug)) {
      rankings.set(city.slug, {
        cityOrder: state.cities.findIndex((c) => c.slug === city.slug),
        rows: cityRanking(state.model, city),
      });
    }
    const { cityOrder, rows } = rankings.get(city.slug);
    const pos = rows.findIndex((r) => r.i === i);
    orders.set(i, { cityOrder: cityOrder < 0 ? NONE : cityOrder, pos: pos < 0 ? NONE : pos });
  });
  return orders;
}

function renderChips() {
  const multiCity = new Set(state.selection.map((i) => state.cityOf[i] && state.cityOf[i].name)).size > 1;
  const orders = chipCityOrders(state.selection);
  const ordered = state.selection.slice().sort((a, b) => {
    const ca = orders.get(a);
    const cb = orders.get(b);
    if (ca.cityOrder !== cb.cityOrder) {
      return ca.cityOrder - cb.cityOrder;
    }
    if (ca.pos !== cb.pos) {
      return ca.pos - cb.pos;
    }
    return a - b;
  });
  el.chips.innerHTML = ordered.map((i) => {
    const o = school(i);
    const c = state.cityOf[i];
    const hidden = state.hidden.has(i);
    const label = o.n + (multiCity && c ? ' · ' + c.label : '');
    return '<li class="chip' + (hidden ? ' chip--muted' : '') + '" data-i="' + i + '">'
      + '<button type="button" class="chip__toggle" aria-pressed="' + (!hidden) + '" title="' + esc(o.n + (c ? ', ' + c.name : '') + ' - покажи/скрий в графиката') + '">'
      + '<span class="dot" style="--dot:var(--chart-' + state.slots.get(i) + ')"></span>'
      + '<span class="chip__label">' + esc(label) + '</span></button>'
      + '<button type="button" class="chip__x" aria-label="Премахни ' + esc(o.n) + '">' + icon('x') + '</button></li>';
  }).join('');
  el.chips.hidden = state.selection.length === 0;
}

el.chips.addEventListener('click', (e) => {
  const li = e.target.closest('[data-i]');
  if (!li) {
    return;
  }
  const i = Number(li.dataset.i);
  if (e.target.closest('.chip__x')) {
    setSelected([i], false);
  } else if (e.target.closest('.chip__toggle')) {
    if (state.hidden.has(i)) {
      state.hidden.delete(i);
    } else {
      state.hidden.add(i);
    }
    renderChips();
    ['b', 'm'].forEach((subj) => {
      const chart = state.charts[subj];
      const series = chart && chart.get(String(i));
      if (series) {
        series.setVisible(!state.hidden.has(i), true);
      }
    });
  }
});

/* ------------------------------------------------------------------ графики */

function chartHeight() {
  return window.innerWidth < 640 ? 300 : 360;
}

function tooltipFormatter(subj) {
  const { model } = state;
  return function() {
    const year = String(this.x !== undefined ? this.x : (this.points && this.points[0] && this.points[0].key));
    const yIdx = Number.parseInt(year, 10) - model.firstYear;
    const points = (this.points || []).slice().sort((a, b) => b.y - a.y);
    let html = '<div class="tt"><div class="tt__year">' + esc(year) + '</div>';
    points.forEach((p) => {
      const idx = p.series.userOptions.schoolIndex;
      const o = school(idx);
      const counts = subj === 'b' ? o.bu : o.mu;
      const students = counts && yIdx >= 0 ? counts[yIdx] : null;
      html += '<div class="tt__row"><span class="dot" style="background:' + p.color + '"></span>'
        + '<span class="tt__name">' + esc(o.l) + '</span>'
        + '<span class="tt__val">' + window.Highcharts.numberFormat(p.y, 2, '.', '') + '</span>'
        + '<span class="tt__sub">' + (students ? students + ' уч.' : '') + '</span></div>';
    });
    return html + '</div>';
  };
}

function renderCharts() {
  const empty = state.selection.length === 0;
  el.empty.hidden = !empty;
  el.charts.hidden = empty;
  if (el.subjectSeg) {
    el.subjectSeg.hidden = empty;
  }
  if (empty || !state.hcReady) {
    ['b', 'm'].forEach((subj) => {
      if (state.charts[subj]) {
        state.charts[subj].destroy();
        state.charts[subj] = null;
      }
    });
    return;
  }
  const { model } = state;
  ['b', 'm'].forEach((subj) => {
    const { categories, series } = chartSeries(model, state.selection, subj);
    const options = lineOptions({
      height: chartHeight(),
      min: model.cfg.chartFloor,
      max: model.cfg.chartCeiling,
      categories
    });
    options.tooltip.formatter = tooltipFormatter(subj);
    options.series = series.map((x) => ({
      id: String(x.index),
      name: x.name,
      data: x.data,
      color: seriesColor(state.slots.get(x.index)),
      visible: !state.hidden.has(x.index),
      schoolIndex: x.index
    }));
    if (state.charts[subj]) {
      state.charts[subj].destroy();
    }
    state.charts[subj] = createChart(document.getElementById('chart-' + subj), options);
  });
}

if (el.subjectSeg) {
  el.subjectSeg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-subject]');
    if (!b) {
      return;
    }
    state.subject = b.dataset.subject;
    el.subjectSeg.querySelectorAll('[data-subject]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    el.charts.dataset.show = state.subject;
    const chart = state.charts[state.subject];
    if (chart) {
      chart.reflow();
    }
  });
}

/* ------------------------------------------------------------------ добавяне на училище */

function setupAddCombobox() {
  const index = buildSchoolIndex(state.model, state.cities);
  createCombobox({
    input: el.add,
    host: el.add.closest('.combo'),
    minChars: 2,
    hint: 'Напиши поне 2 букви от името на училището или града.',
    emptyText: 'Няма такова училище за ' + state.model.cfg.short,
    search: (q) => searchSchools(state.model, index, q, { isSelected }),
    onSelect(item) {
      const was = isSelected(item.id);
      toggleSelected(item.id);
      toast(was ? 'Премахнато от графиката' : 'Добавено в графиката');
    }
  });
}

/* ------------------------------------------------------------------ градове */

function cityBySlug(slug) {
  // Само собствени ключове: #constructor или запомнен "toString" не са град.
  return Object.prototype.hasOwnProperty.call(state.bySlug, slug) ? state.bySlug[slug] : null;
}

function selectCity(city, { scroll = false, keepTab = false, explicit = true, push = false } = {}) {
  if (!city) {
    return;
  }
  if (push && state.city && state.city.slug !== city.slug) {
    // Нов запис в историята - "Назад" връща предишния град, както при старите котви #град.
    try {
      window.history.pushState(null, '', window.location.pathname + window.location.search + '#' + city.slug);
    } catch (e) {
      // Safari ограничава pushState до 100 пъти за 10 s - адресът изостава, но страницата работи.
    }
  }
  if (explicit) {
    state.cityChosen = true;
    rememberCity(city.slug);
  }
  const changed = !state.city || state.city.slug !== city.slug;
  state.city = city;
  if (changed) {
    // Изборът на вид остава при смяна на града; отпадат видовете, които новият град няма.
    state.types = state.types.filter((t) => city.types.includes(t));
    state.sortCol = 'rank';
    state.sortDir = 'desc';
    state.showInactive = false;
    if (!keepTab) {
      state.tab = 'ranking';
    }
  }
  el.switcher.querySelectorAll('[data-city]').forEach((a) => {
    if (a.dataset.city === city.slug) {
      a.setAttribute('aria-current', 'true');
      revealChip(a);
    } else {
      a.removeAttribute('aria-current');
    }
  });
  if (city.tier === 3 && el.other) {
    el.other.open = true;
  }
  writeSelection(state.model, state.selection, currentHash());
  renderCityPanel();
  if (scroll) {
    setTimeout(() => document.getElementById('cities-section').scrollIntoView({ block: 'start', behavior: 'instant' }), 60);
  }
}

/** На телефон областните градове са хоризонтален ред - превъртаме го до избрания град (без вертикален скрол). */
function revealChip(chip) {
  const row = chip.parentElement;
  if (!row || row.scrollWidth <= row.clientWidth) {
    return;
  }
  const target = chip.offsetLeft - row.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
  row.scrollLeft = Math.max(0, target);
}

function setupCitySwitcher() {
  // Скриваме градовете без данни в текущия изглед (напр. исторически години).
  el.switcher.querySelectorAll('[data-city]').forEach((a) => {
    a.hidden = !cityBySlug(a.dataset.city);
  });
  el.switcher.addEventListener('click', (e) => {
    const a = e.target.closest('[data-city]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    const city = cityBySlug(a.dataset.city);
    if (city) {
      e.preventDefault();
      selectCity(city, { push: true });
    }
  });
  if (el.cityFilter) {
    el.cityFilter.addEventListener('input', () => {
      const q = searchKey(el.cityFilter.value);
      let visibleOther = 0;
      el.switcher.querySelectorAll('[data-city]').forEach((a) => {
        const city = cityBySlug(a.dataset.city);
        const match = !!city && (!q || searchKey(city.name + ' ' + city.label).includes(q));
        a.hidden = !match;
        if (match && city.tier === 3) {
          visibleOther++;
        }
      });
      el.switcher.querySelectorAll('.city-switch__group').forEach((g) => {
        g.hidden = !g.querySelector('[data-city]:not([hidden])');
      });
      if (el.other) {
        if (q) {
          el.other.open = visibleOther > 0;
        }
        el.other.hidden = visibleOther === 0 && !!q;
      }
    });
    el.cityFilter.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = el.switcher.querySelector('[data-city]:not([hidden])');
        if (first) {
          e.preventDefault();
          selectCity(cityBySlug(first.dataset.city), { push: true });
        }
      }
    });
  }
  window.addEventListener('hashchange', () => {
    const city = cityBySlug(readCityHash());
    if (city) {
      selectCity(city, { scroll: true });
    }
  });
}

/* ------------------------------------------------------------------ панел на града */

/** Показаните видове: избраните, ако в града има поне два вида; null = всички. */
function shownTypes() {
  const city = state.city;
  if (!city || city.types.length < 2) {
    return null;
  }
  const sel = state.types.filter((t) => city.types.includes(t));
  // Избрани всички видове в града = всички.
  return sel.length && sel.length < city.types.length ? sel : null;
}

function cityStats(city) {
  const { model } = state;
  const rows = cityRanking(model, city);
  const counts = {};
  rows.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
  return { rows, total: rows.length, counts };
}

/**
 * Броят до името на града: "156 училища с резултати за 2026", "64 от 156 училища с резултати за
 * 2026 · държавни и частни", "12 общински училища с резултати за 2026". На телефон опашката
 * (.count__long) се скрива - годината е в "Класация 2026", а видовете - в чиповете.
 */
function countHtml(city, total) {
  const word = (n, prefix) => n + ' ' + (prefix ? prefix + ' ' : '') + (n === 1 ? 'училище' : 'училища');
  const tail = (extra) => '<span class="count__long"> с резултати за ' + state.model.latestYear + (extra ? ' · ' + extra : '') + '</span>';
  const types = shownTypes();
  if (city.types.length === 1) {
    return word(total, total === 1 ? schoolType(city.types[0]).lower : schoolType(city.types[0]).lowerPlural) + tail();
  }
  if (!types) {
    return word(total) + tail();
  }
  const shown = cityRanking(state.model, city).filter((r) => types.includes(r.type)).length;
  return shown + ' от ' + word(total) + tail(joinTypes(types));
}

/**
 * "Покажи само": по един чип за всеки вид в града (с броя училища с резултати). Нищо избрано =
 * всички; натискане добавя или маха вида. Само за градове с поне два вида. Филтърът е общ за
 * двата таба, затова стои вдясно в реда с табовете.
 */
function typeFilterHtml(city, counts) {
  if (city.types.length < 2) {
    return '';
  }
  return '<div class="type-filter city-panel__types" role="group" aria-label="Покажи само училищата от избраните видове" data-n="' + city.types.length + '">'
    + '<span class="type-filter__label" aria-hidden="true">Покажи само</span>'
    + city.types.map((k) => {
      const t = schoolType(k);
      return '<button type="button" class="chip type-chip" data-school-type="' + k + '" aria-pressed="' + state.types.includes(k) + '">'
        + '<span class="type-badge type-badge--' + k + '" aria-hidden="true">' + t.letter + '</span>'
        + '<span class="type-chip__name">' + t.plural + '</span>'
        + '<span class="type-chip__count"><span class="sr-only">, </span>' + (counts[k] || 0) + '</span></button>';
    }).join('')
    + '</div>';
}

/** След натискане на чип: състоянието на чиповете и редът с броя (без да се прерисува главата). */
function syncTypeFilter() {
  el.panel.querySelectorAll('[data-school-type]').forEach((b) => {
    b.setAttribute('aria-pressed', String(state.types.includes(b.dataset.schoolType)));
  });
  const line = el.panel.querySelector('.city-panel__count');
  if (line) {
    line.innerHTML = countHtml(state.city, cityStats(state.city).total);
  }
}

/** "Класация на училищата" → на телефон само "Класация" (двата таба да се събират на 320 px). */
function tabLabel(name) {
  const k = name.indexOf(' ');
  return k < 0 ? esc(name) : esc(name.slice(0, k)) + '<span class="tabs__long">' + esc(name.slice(k)) + '</span>';
}

function renderCityPanel() {
  const { model } = state;
  const city = state.city;
  const { total, counts } = cityStats(city);
  const actions = [
    '<a class="btn btn--sm" href="' + esc(city.slug) + '/" title="Класацията на училищата в ' + esc(city.name) + ' за ' + model.dataLatestYear + ' на отделна страница">' + icon('external') + ' Класация ' + model.dataLatestYear + '</a>'
  ];
  if (city.hasBalove) {
    actions.push('<a class="btn btn--sm" href="balove/' + esc(city.slug) + '/" title="Минимални и максимални балове по паралелки - ' + esc(city.name) + '">' + icon('target') + ' Балове</a>');
  }
  // Експортът е отделно меню вдясно: CSV и JSON - данните (всички години), PDF - класацията, както се вижда.
  const exportMenu = exportMenuHtml({
    title: 'Данни за ' + city.name,
    cls: 'city-panel__export',
    items: [
      { kind: 'csv', hint: 'Таблица за Excel · всички години', action: 'city-csv' },
      { kind: 'json', hint: 'Данните от API-то · всички години', href: siteUrl('api/v1/' + model.grade + '/' + city.slug + '/data.json'), download: model.cfg.exportPrefix + '-data-' + city.slug + '.json' },
      { kind: 'pdf', hint: 'Класацията за печат', action: 'city-pdf' }
    ]
  });

  el.panel.innerHTML = '<div class="card__head city-panel__head">'
    // Името и броят са на един ред, с разделител; ако не се съберат, броят минава отдолу (без разделител).
    + '<div class="city-panel__heading"><div class="city-panel__heading-row"><h3 class="city-panel__title">' + esc(city.name) + '</h3>'
    + '<p class="city-panel__count">' + countHtml(city, total) + '</p></div></div>'
    + '<div class="cluster city-panel__actions">' + actions.join('') + exportMenu + '</div></div>'
    + '<div class="city-panel__bar" data-types="' + (city.types.length > 1 ? city.types.length : 0) + '"><div class="city-panel__barrow">'
    + '<div class="tabs city-panel__tabs" role="tablist">'
    + '<button role="tab" type="button" data-tab="ranking" aria-selected="' + (state.tab === 'ranking') + '">' + tabLabel(model.cfg.tableTitleName) + '</button>'
    + '<button role="tab" type="button" data-tab="averages" aria-selected="' + (state.tab === 'averages') + '">Средни резултати</button>'
    + '</div><div class="city-panel__view">' + typeFilterHtml(city, counts) + '</div></div></div>'
    + '<div class="city-panel__body" role="tabpanel"></div>';
  renderTab();
}

function renderTab() {
  const body = el.panel.querySelector('.city-panel__body');
  if (!body) {
    return;
  }
  body.innerHTML = state.tab === 'averages' ? averagesHtml() : rankingHtml();
  if (state.tab === 'ranking') {
    syncTableSelection();
  }
  announce();
}

const SORT_LABELS = { name: 'име', type: 'тип', rank: 'ранг' };

/** Кратко съобщение за екранните четци след смяна на град, таб, филтър или подредба. */
function announce() {
  if (!el.status) {
    return;
  }
  const { cfg, latestYear } = state.model;
  const name = state.city.name;
  const types = shownTypes();
  if (state.tab === 'averages') {
    el.status.textContent = 'Средни резултати за ' + name + (types ? ' (' + joinTypes(types) + ')' : '');
    return;
  }
  const n = el.panel.querySelectorAll('.data-table.ranking tbody:first-of-type tr').length;
  const col = state.sortCol;
  const label = SORT_LABELS[col] || ((col[2] === 'b' ? cfg.subjectB : cfg.subjectM) + ' ' + (latestYear - Number(col[1])));
  el.status.textContent = name + ': ' + n + ' училища' + (types ? ' (' + joinTypes(types) + ')' : '')
    + ', подредени по ' + label + (state.sortDir === 'asc' ? ', възходящо' : ', низходящо');
}

function rankingHtml() {
  const { model } = state;
  const city = state.city;
  const cfg = model.cfg;
  const types = shownTypes();
  const rows = sortRanking(model, cityRanking(model, city), state.sortCol, state.sortDir, types);
  const inactive = cityInactiveSchools(model, city);
  const inactiveFiltered = inactive.filter((r) => !types || types.includes(r.type));
  const years = rows.length ? rows[0].years.map((y) => y.year) : [model.latestYear, model.latestYear - 1, model.latestYear - 2];

  const sortTh = (col, label, cls, title) => {
    const sorted = state.sortCol === col;
    return '<th' + (cls ? ' class="' + cls + '"' : '') + ' aria-sort="' + (sorted ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none') + '"'
      + (title ? ' title="' + esc(title) + '"' : '') + '>'
      + '<button type="button" class="th-sort" data-sort="' + col + '">' + label + icon('sort') + '</button></th>';
  };
  // Заглавието е един ред: всяка колона има свой надпис ("БЕЛ 26" - предметът и годината с две цифри;
  // "20" е само за екранните четци, пълната година е и в подсказката),
  // без групиращи клетки над тях. Ранг е веднага след името - основната стойност се вижда и на
  // телефон без хоризонтален скрол. Разделителите отделят групите: ранг | тип | години | доклад.
  const yearTh = (k, subj, y, first) => sortTh('y' + k + subj, esc(subj === 'b' ? cfg.subjectB : cfg.subjectM) + ' <span class="th-qual"><span class="sr-only">' + String(y).slice(0, 2) + '</span>' + String(y).slice(-2) + '</span>',
    'yv' + (first ? ' group-start' : ''), (subj === 'b' ? cfg.subjectBLong : cfg.subjectMLong) + ' ' + y);
  let head = '<thead><tr>'
    + '<th class="center col-pos">№</th>'
    + sortTh('name', 'Училище', 'col-name')
    + sortTh('rank', 'Ранг', 'center col-rank', 'Средният резултат за последните 3 години като процент от този на първото училище')
    + sortTh('type', 'Тип / №', 'center col-type group-start', 'Държавно (Д), общинско (О), частно (Ч) или духовно (ДУ) и място сред училищата от същия вид в града');
  years.forEach((y, k) => {
    head += yearTh(k, 'b', y, true) + yearTh(k, 'm', y, false);
  });
  head += '<th class="center group-start col-report" title="PDF доклад за училището">PDF</th></tr></thead>';

  const divider = firstEmptyRow(rows, state.sortCol);
  const rowHtml = (r, pos, isInactive) => {
    const o = model.s[r.i];
    const rank = isInactive ? null : rankFor(r);
    let cells = '<td class="center col-pos muted">' + (isInactive ? '-' : pos) + '</td>'
      + '<td class="col-name"><div class="school-cell">'
      + '<button type="button" class="add-toggle ci" data-add="' + r.i + '" aria-pressed="false" aria-label="Покажи ' + esc(o.n) + ' в графиката"></button>'
      + (o.c ? '<a href="../school/' + esc(o.c) + '/" title="' + esc('Профил на ' + o.n) + '">' + esc(o.l) + '</a>' : '<span title="' + esc(o.n) + '">' + esc(o.l) + '</span>')
      + (o.w ? '<a class="web-link ci" href="' + esc(o.w) + '" target="_blank" rel="noopener noreferrer" title="' + esc('Уебсайт на ' + o.n) + '" aria-label="Уебсайт"></a>' : '')
      + '</div></td>'
      + '<td class="center col-rank">' + (rank === null || rank === undefined ? '<span class="muted">-</span>'
        : '<span class="rank" title="Среден резултат = ' + r.avg.toFixed(2) + '">' + rank.toFixed(2) + '<span class="rank__bar" style="--v:' + rank + '"></span></span>') + '</td>'
      // Буквата и мястото - блок с еднаква геометрия на всеки ред (значки и номера една под друга).
      + '<td class="center nowrap col-type group-start"><span class="type-no">' + typeBadgeHtml(r.type)
      + '<span class="type-no__n">' + (isInactive ? '' : r.typeNo) + '</span></span></td>';
    r.years.forEach((y) => {
      cells += '<td class="yv group-start"' + (y.b ? ' title="' + esc(cfg.subjectB + ' ' + y.year + ': ' + fmt(y.b) + ' · ' + y.bu + ' ученици') + '"' : '') + '>'
        + (y.b ? '<span class="v">' + fmt(y.b) + '</span><span class="sub">/' + y.bu + '</span>' : '') + '</td>'
        + '<td class="yv"' + (y.m ? ' title="' + esc(cfg.subjectM + ' ' + y.year + ': ' + fmt(y.m) + ' · ' + y.mu + ' ученици') + '"' : '') + '>'
        + (y.m ? '<span class="v">' + fmt(y.m) + '</span><span class="sub">/' + y.mu + '</span>' : '') + '</td>';
    });
    cells += '<td class="center group-start col-report"><button type="button" class="icon-btn icon-btn--sm ci ci--file" data-report="' + r.i + '" title="' + esc('PDF доклад за ' + o.n) + '" aria-label="PDF доклад"></button></td>';
    const divide = !isInactive && divider >= 0 && pos - 1 === divider;
    return '<tr data-row="' + r.i + '"' + (divide ? ' class="divider-top"' : '') + '>' + cells + '</tr>';
  };

  let body = '<tbody>' + rows.map((r, k) => rowHtml(r, k + 1, false)).join('') + '</tbody>';
  if (state.showInactive && inactiveFiltered.length) {
    const lastYears = years;
    const inactiveRows = inactiveFiltered
      .map((r) => {
        const o = model.s[r.i];
        const t = o.b.length;
        r.years = lastYears.map((year, k) => ({ year, b: o.b[t - k - 1], bu: o.bu[t - k - 1], m: o.m[t - k - 1], mu: o.mu[t - k - 1] }));
        return rowHtml(r, 0, true);
      }).join('');
    body += '<tbody class="ranking__inactive"><tr class="ranking__subhead"><td colspan="' + (5 + years.length * 2) + '">Без резултат за ' + model.latestYear + ' - не участват в класацията</td></tr>' + inactiveRows + '</tbody>';
  }

  const notes = '<div class="ranking__foot">'
    + (inactiveFiltered.length ? '<label class="switch"><input type="checkbox" data-action="toggle-inactive"' + (state.showInactive ? ' checked' : '') + '> Покажи и училищата без резултат за ' + model.latestYear + ' (' + inactiveFiltered.length + ')</label>' : '<span></span>')
    + '<details class="disclosure disclosure--plain"><summary>Как се изчислява рангът?</summary><div class="disclosure__body prose">'
    + '<p>Училищата са подредени по общия среден успех по ' + esc(cfg.subjectB) + ' и ' + esc(cfg.subjectM) + ' за последните три години. '
    + 'Рангът е този среден успех като процент от успеха на първото показано училище - на първото в града или, ако е избран вид, на първото от избраните видове.</p>'
    + '<p>Видът е според финансирането в регистъра на МОН: държавно (Д), общинско (О), частно (Ч) или духовно (ДУ). До буквата е мястото сред училищата от същия вид в града.</p>'
    + '<p>Училищата без резултат за последната година не участват в класацията. До всяка стойност е броят на учениците.</p>'
    + '</div></details></div>';

  return (rows.length ? '<div class="table-wrap table-wrap--tall"><table class="data-table ranking">' + head + body + '</table></div>'
    : '<div class="empty"><p class="empty__title">Няма училища с резултати</p></div>')
    + notes;
}

/**
 * "Средни резултати": четири малки таблици - за всеки предмет по училища и по ученици, без
 * превключвател. Всяка е Година · Общо (при два и повече вида) · по колона за всеки показан вид.
 * Колко таблици са в ред (4, 2 или 1) зависи от ширината и от броя колони (data-n, site.css),
 * така че таблиците не се разтягат празни; на телефон видовете в заглавието са буквите от чиповете.
 */
function averagesHtml() {
  const { model } = state;
  const cfg = model.cfg;
  const city = state.city;
  const types = shownTypes() || city.types;
  const byMode = { schools: cityAverages(model, city, 'schools', types), students: cityAverages(model, city, 'students', types) };
  const columns = byMode.schools.columns;
  // "Общо" е отделено с разделител от колоните по видове.
  const cls = (k) => 'num' + (k === 1 && columns[0].key === 'all' ? ' group-start' : '');
  const colHead = (c, k) => {
    if (c.key === 'all') {
      return '<th class="' + cls(k) + '" title="Всички показани училища заедно">Общо</th>';
    }
    const t = schoolType(c.key);
    return '<th class="' + cls(k) + ' avg-type" title="' + t.plural + '"><span class="avg-type__name">' + t.plural + '</span>'
      + typeBadgeHtml(c.key) + '</th>';
  };
  const cell = (v, k) => '<td class="' + cls(k) + '">'
    + (v === null || v === undefined ? '<span class="muted">-</span>' : (Math.round(v * 100) / 100).toFixed(2)) + '</td>';
  const head = '<thead><tr><th>Година</th>' + columns.map(colHead).join('') + '</tr></thead>';
  const table = (mode, subject, title, modeLabel) => '<div class="averages__subject">'
    + '<h4 class="averages__title">' + esc(title) + ' <span class="averages__mode">' + modeLabel + '</span></h4>'
    + '<div class="table-wrap averages"><table class="data-table">' + head + '<tbody>'
    + byMode[mode].rows.map((r) => '<tr><td>' + r.year + '</td>' + r[subject].map(cell).join('') + '</tr>').join('')
    + '</tbody></table></div></div>';
  const what = shownTypes() ? ' Показани са ' + joinTypes(types) + ' училища.' : '';
  return '<p class="averages__note muted text-sm"><strong>По училища</strong> - средно аритметично от резултатите на училищата; '
    + '<strong>по ученици</strong> - претеглено с броя на учениците.' + what + '</p>'
    + '<div class="averages__box"><div class="averages__grid" data-n="' + columns.length + '">'
    + table('schools', 'b', cfg.subjectBLong, 'по училища') + table('schools', 'm', cfg.subjectMLong, 'по училища')
    + table('students', 'b', cfg.subjectBLong, 'по ученици') + table('students', 'm', cfg.subjectMLong, 'по ученици')
    + '</div></div>';
}

function syncTableSelection() {
  if (!el.panel) {
    return;
  }
  el.panel.querySelectorAll('[data-add]').forEach((b) => {
    const i = Number(b.dataset.add);
    const on = isSelected(i);
    b.setAttribute('aria-pressed', String(on));
    b.style.setProperty('--dot', on ? 'var(--chart-' + state.slots.get(i) + ')' : '');
    b.title = on ? 'Махни от графиката' : 'Покажи в графиката';
    const tr = b.closest('tr');
    if (tr) {
      tr.classList.toggle('is-selected', on);
    }
  });
}

function currentRows() {
  return sortRanking(state.model, cityRanking(state.model, state.city), state.sortCol, state.sortDir, shownTypes());
}

async function runBusy(btn, fn, errorText) {
  if (btn) {
    btn.classList.add('is-busy');
    btn.setAttribute('aria-busy', 'true');
  }
  try {
    await fn();
  } catch (err) {
    console.error(err);
    toast(errorText);
  } finally {
    if (btn) {
      btn.classList.remove('is-busy');
      btn.removeAttribute('aria-busy');
    }
  }
}

el.panel.addEventListener('click', (e) => {
  const t = e.target;
  const tab = t.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    el.panel.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === tab)));
    renderTab();
    return;
  }
  const add = t.closest('[data-add]');
  if (add) {
    toggleSelected(Number(add.dataset.add));
    return;
  }
  const typeChip = t.closest('[data-school-type]');
  if (typeChip) {
    // Нищо избрано = всички; натискане добавя или маха вида.
    const k = typeChip.dataset.schoolType;
    state.types = state.types.includes(k) ? state.types.filter((x) => x !== k) : state.types.concat(k);
    syncTypeFilter();
    renderTab();
    return;
  }
  const sort = t.closest('[data-sort]');
  if (sort) {
    const col = sort.dataset.sort;
    if (state.sortCol === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortCol = col;
      state.sortDir = defaultSortDir(col);
    }
    renderTab();
    const btn = el.panel.querySelector('[data-sort="' + col + '"]');
    if (btn) {
      btn.focus();
    }
    return;
  }
  const report = t.closest('[data-report]');
  if (report) {
    runBusy(report, () => import('../core/pdf.js').then((m) => m.schoolReportPdf(state.model, Number(report.dataset.report))),
      'Грешка при генериране на PDF доклада. Опитай отново.');
    return;
  }
  const action = t.closest('[data-action]');
  if (action && action.dataset.action === 'city-csv') {
    const csv = cityCsv(state.model, state.city);
    download(csv.filename, csv.content);
  } else if (action && action.dataset.action === 'city-pdf') {
    runBusy(menuButtonOf(action), () => import('../core/pdf.js').then((m) => m.rankingPdf(state.model, state.city, currentRows(), shownTypes())),
      'Грешка при генериране на PDF. Опитай отново.');
  }
});

el.panel.addEventListener('change', (e) => {
  if (e.target.matches('[data-action="toggle-inactive"]')) {
    const wrap = el.panel.querySelector('.table-wrap--tall');
    const prevScroll = wrap ? wrap.scrollTop : 0;
    state.showInactive = e.target.checked;
    renderTab();
    const newWrap = el.panel.querySelector('.table-wrap--tall');
    if (newWrap) {
      if (state.showInactive && newWrap.scrollHeight > newWrap.clientHeight) {
        // Показваме неактивните училища в дъното - превъртаме таблицата там.
        newWrap.scrollTop = newWrap.scrollHeight;
      } else if (state.showInactive) {
        // На телефон таблицата няма собствен скрол - превъртаме страницата до първите
        // неактивни училища, под горните ленти и плаващото заглавие на таблицата.
        const sub = newWrap.querySelector('.ranking__subhead');
        if (sub) {
          window.scrollTo({ top: window.scrollY + sub.getBoundingClientRect().top - stickyTopOffset() - newWrap.querySelector('thead').offsetHeight });
        }
      } else {
        // При скриване не местим таблицата - възстановяваме предишната позиция.
        newWrap.scrollTop = Math.min(prevScroll, newWrap.scrollHeight);
      }
    }
  }
});

/* ------------------------------------------------------------------ действия горе */

function openEmbedDialog(opener) {
  let dlg = document.getElementById('embed-dialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'embed-dialog';
    dlg.className = 'dialog';
    dlg.innerHTML = '<div class="dialog__head"><h2 class="dialog__title">Вграждане на графиката</h2>'
      + '<button type="button" class="icon-btn" data-close aria-label="Затвори">' + icon('x') + '</button></div>'
      + '<div class="dialog__body stack">'
      + '<p class="muted text-sm">Постави кода в HTML-а на своя сайт. Графиката показва избраните училища и се обновява с новите данни.</p>'
      + '<div class="cluster"><span class="field__label">Графики</span><div class="seg" data-embed="chart">'
      + '<button type="button" data-v="" aria-pressed="true">Двете</button><button type="button" data-v="b" aria-pressed="false">' + esc(state.model.cfg.subjectB) + '</button>'
      + '<button type="button" data-v="m" aria-pressed="false">' + esc(state.model.cfg.subjectM) + '</button></div></div>'
      + '<div class="cluster"><span class="field__label">Тема</span><div class="seg" data-embed="theme">'
      + '<button type="button" data-v="" aria-pressed="true">Според браузъра</button><button type="button" data-v="light" aria-pressed="false">Светла</button>'
      + '<button type="button" data-v="dark" aria-pressed="false">Тъмна</button></div></div>'
      + '<textarea class="input code-box" rows="5" readonly aria-label="HTML код"></textarea>'
      + '<p class="text-sm"><a href="' + siteUrl('embed/') + '">Документация за вграждането →</a></p></div>'
      + '<div class="dialog__foot"><a class="btn" data-preview target="_blank" rel="noopener">' + icon('external') + ' Преглед</a>'
      + '<button type="button" class="btn btn--primary" data-copy-code>' + icon('copy') + ' Копирай кода</button></div>';
    document.body.appendChild(dlg);
    const update = () => {
      const chart = dlg.querySelector('[data-embed="chart"] [aria-pressed="true"]').dataset.v;
      const theme = dlg.querySelector('[data-embed="theme"] [aria-pressed="true"]').dataset.v;
      const code = embedCode(state.model, state.selection, { chart, theme, year: state.model.timeTravelYear });
      dlg.querySelector('textarea').value = code;
      dlg.querySelector('[data-preview]').href = code.match(/src="([^"]+)"/)[1];
    };
    dlg.addEventListener('click', async (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) {
        dlg.close();
        return;
      }
      const opt = e.target.closest('[data-embed] [data-v]');
      if (opt) {
        opt.parentElement.querySelectorAll('[data-v]').forEach((b) => b.setAttribute('aria-pressed', String(b === opt)));
        update();
      }
      if (e.target.closest('[data-copy-code]') && await copyText(dlg.querySelector('textarea').value)) {
        toast('Кодът е копиран');
      }
    });
    dlg._update = update;
  }
  dlg._update();
  showModal(dlg, opener);
}

document.addEventListener('click', async (e) => {
  const action = e.target.closest('[data-action]');
  if (!action || el.panel.contains(action)) {
    return;
  }
  const name = action.dataset.action;
  if (name === 'clear') {
    setSelected(state.selection.slice(), false);
  } else if (name === 'share') {
    const url = shareUrl(state.model, state.selection, currentHash());
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (err) {
        // потребителят е отказал - копираме
      }
    }
    if (await copyText(url)) {
      toast('Връзката е копирана');
    }
  } else if (name === 'embed') {
    openEmbedDialog(action);
  } else if (name === 'csv-all') {
    const csv = allCsv(state.model);
    download(csv.filename, csv.content);
  } else if (name === 'pdf-all') {
    toast('Подготвя се PDF с класациите на всички градове…');
    runBusy(menuButtonOf(action), () => import('../core/pdf.js').then((m) => m.allRankingsPdf(state.model)),
      'Грешка при генериране на PDF. Опитай отново.');
  } else if (name === 'to-chart') {
    el.compare.scrollIntoView({ block: 'start' });
  } else if (name === 'suggest') {
    // Водещите училища в града - първите в класацията от показаните видове (както в таблицата).
    const city = state.city || state.cities[0];
    const types = city === state.city ? shownTypes() : null;
    const top = cityRanking(state.model, city).filter((r) => !types || types.includes(r.type)).slice(0, SUGGEST_COUNT);
    setSelected(top.map((r) => r.i), true);
    if (types && top.length) {
      toast('Добавени ' + top.length + ' водещи ' + joinTypes(types) + ' училища');
    }
  }
});

/* ------------------------------------------------------------------ година и исторически изглед */

function setupYear() {
  const { model } = state;
  if (el.yearSelect) {
    el.yearSelect.value = model.timeTravelYear ? String(model.timeTravelYear) : '';
    el.yearSelect.addEventListener('change', () => {
      const url = new URL(window.location.href);
      if (el.yearSelect.value) {
        url.searchParams.set('year', el.yearSelect.value);
      } else {
        url.searchParams.delete('year');
      }
      window.location.href = url.toString().replace(/%2C/g, ',');
    });
  }
  if (model.timeTravelYear && el.history) {
    const exit = new URL(window.location.href);
    exit.searchParams.delete('year');
    el.history.innerHTML = '<div class="banner history-banner" role="status">' + icon('history')
      + '<span><strong>Исторически изглед</strong> - всички данни и графики по-долу са към ' + model.timeTravelYear + ' г.</span>'
      + '<a class="banner__action" href="' + esc(exit.pathname + exit.search + exit.hash) + '">Покажи актуалните данни →</a></div>';
  }
  const national = document.querySelector('[data-national]');
  if (national && model.timeTravelYear) {
    national.href = model.timeTravelYear + '/';
    national.querySelector('[data-national-year]').textContent = model.timeTravelYear;
  }
}

/* ------------------------------------------------------------------ мобилна лента */

let compareVisible = true;

function updateTray() {
  if (!el.tray) {
    return;
  }
  const n = state.selection.length;
  el.tray.classList.toggle('is-visible', n > 0 && !compareVisible);
  const count = el.tray.querySelector('[data-count]');
  if (count) {
    count.textContent = (n === 1 ? '1 училище' : n + ' училища') + ' в графиката';
  }
}

function setupTray() {
  if (!el.tray || !('IntersectionObserver' in window)) {
    return;
  }
  // По-стар HTML от кеша още има hidden - видимостта вече е само чрез .is-visible.
  el.tray.hidden = false;
  // Лентата се показва, след като графиката е останала над видимата част.
  new IntersectionObserver((entries) => {
    const e = entries[0];
    compareVisible = e.isIntersecting || e.boundingClientRect.top > 0;
    updateTray();
  }).observe(el.compare);
}

/* ------------------------------------------------------------------ старт */

async function init() {
  const deepLinkSchool = new URL(window.location.href).searchParams.get('school');
  const raw = await fetchGradeData(grade, siteUrl('data/grade-' + grade + '.json'));
  const model = buildModel(grade, raw, { year: readYearParam() });
  state.model = model;
  state.cities = renderableCities(model);
  state.cities.forEach((c) => {
    state.bySlug[c.slug] = c;
    [c.pu, c.pr].forEach((range) => {
      if (range) {
        for (let i = range[0]; i <= range[1]; i++) {
          state.cityOf[i] = c;
        }
      }
    });
  });

  state.selection = initialSelection(model);
  state.selection.forEach(assignSlot);
  document.body.classList.add('is-ready');

  setupYear();
  setupCitySwitcher();
  setupAddCombobox();
  setupTray();
  renderChips();

  // Градът на таблицата: #град → градът на училище от линка (?school=, ?s=) →
  // последно избраният град (общ за 4/7/10/12) → градът на първото училище в
  // графиката (бисквитката, както преди запомнянето) → първият град (София).
  // Град без училища за този клас/година не е в state.cities и се прескача.
  // Градът от линка се пази в адреса (#град) и се запомня: ?school= изчезва от
  // адреса след зареждането и иначе презареждането би показало друг град.
  const cityOfFirst = () => {
    const found = state.selection.length ? findCityForSchool(model, state.selection[0]) : null;
    return found ? state.cities.find((c) => c.name === found.cityName) || null : null;
  };
  const hashCity = cityBySlug(readCityHash());
  const linkedCity = linkedSchools(model) ? cityOfFirst() : null;
  const city = hashCity
    || linkedCity
    || cityBySlug(readRememberedCity())
    || cityOfFirst()
    || state.cities[0];
  selectCity(city, { scroll: !!hashCity, explicit: !!(hashCity || linkedCity) });

  renderCharts();
  whenHighcharts().then(() => {
    state.hcReady = true;
    renderCharts();
    if (deepLinkSchool && !hashCity) {
      // След като графиките са с реалната си височина, за да не "отскочи" превъртането.
      setTimeout(() => el.compare.scrollIntoView({ block: 'start', behavior: 'instant' }), 60);
    }
  }).catch((err) => console.error(err));

  onThemeChange(() => renderCharts());
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if ((lastW < 640) !== (window.innerWidth < 640)) {
      renderCharts();
    }
    lastW = window.innerWidth;
  });
}

init().catch((err) => {
  console.error(err);
  el.panel.innerHTML = '<div class="empty"><p class="empty__title">Данните не можаха да се заредят</p><p>Опитай да презаредиш страницата.</p></div>';
});
