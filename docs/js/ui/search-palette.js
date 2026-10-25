// Глобалното търсене (Ctrl/⌘K или "/"): страници, градове и училища.
// Индексът data/search-index.json се зарежда при първото отваряне.
import { icon } from './icons.js';
import { showModal } from './dom.js';
import { searchKey, toCyrillic, expandAbbreviations } from './search-text.js';
import { siteUrl } from '../site.js';

// Много училища носят едно и също име ("Христо Ботев" - 70+), затова показваме много резултати
// в скролиращ се списък, а при повече казваме колко са и как да се стесни търсенето.
const MAX_SCHOOLS = 100;
const MAX_CITIES = 6;
const GRADE_ORDER = [7, 12, 4, 10];
const GRADE_NAMES = { 4: 'НВО 4 клас', 7: 'НВО 7 клас', 10: 'НВО 10 клас', 12: 'ДЗИ 12 клас' };

const PAGES = [
  { title: 'Начало', href: '', icon: 'logo', terms: 'начало home' },
  { title: 'НВО след 4 клас', sub: 'Графики и класации на училищата', href: '4/', icon: 'grad', terms: 'нво 4 клас четвърти' },
  { title: 'НВО след 7 клас', sub: 'Графики и класации на училищата', href: '7/', icon: 'grad', terms: 'нво 7 клас седми' },
  { title: 'НВО след 10 клас', sub: 'Графики и класации на училищата', href: '10/', icon: 'grad', terms: 'нво 10 клас десети' },
  { title: 'ДЗИ след 12 клас', sub: 'Графики и класации на училищата', href: '12/', icon: 'grad', terms: 'дзи 12 клас матура матури дванадесети' },
  { title: 'Балове след 7 клас', sub: 'Минимални и максимални балове по паралелки', href: '7/balove/', icon: 'target', terms: 'балове бал прием паралелки класиране' },
  { title: 'Обобщена статистика', sub: 'Тенденции по класове и години', href: 'stats/', icon: 'pie', terms: 'статистика тенденции' },
  { title: 'Блог', sub: 'Анализи и ръководства', href: 'blog/', icon: 'news', terms: 'блог статии анализи' },
  { title: 'JSON API', sub: 'Отворени данни за разработчици', href: 'api/v1/', icon: 'code', terms: 'api json данни' },
  { title: 'Вграждане на графики', sub: 'iframe за вашия сайт', href: 'embed/', icon: 'layers', terms: 'вграждане embed iframe' },
  { title: 'За проекта и методология', sub: 'Как се изчисляват класациите, контакти, подкрепа', href: 'za-proekta/', icon: 'info', terms: 'за проекта методология контакти подкрепа дарение' }
];

let indexPromise = null;
let dialog = null;
let input = null;
let resultsEl = null;
let items = [];
let active = -1;
let lastQuery = '';

function normalize(str) {
  return (str || '').toString().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function highlight(text, terms) {
  let html = esc(text);
  if (!terms.length) {
    return html;
  }
  const norm = normalize(text);
  const marks = [];
  terms.forEach((t) => {
    let from = 0;
    let idx;
    while (t && (idx = norm.indexOf(t, from)) >= 0) {
      marks.push([idx, idx + t.length]);
      from = idx + t.length;
    }
  });
  if (!marks.length) {
    return html;
  }
  marks.sort((a, b) => a[0] - b[0]);
  let out = '';
  let pos = 0;
  marks.forEach(([s, e]) => {
    if (s < pos) {
      return;
    }
    out += esc(text.slice(pos, s)) + '<mark>' + esc(text.slice(s, e)) + '</mark>';
    pos = e;
  });
  return out + esc(text.slice(pos));
}

function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(siteUrl('data/search-index.json'))
      .then((r) => {
        if (!r.ok) {
          throw new Error('HTTP ' + r.status);
        }
        return r.json();
      })
      .then((data) => {
        const cities = data.cities.map(([slug, name, order, grades, balove], i) => ({
          slug, name, order, grades, balove: !!balove, rank: i, _k: searchKey(name)
        }));
        const bySlug = {};
        cities.forEach((c) => { bySlug[c.slug] = c; });
        const schools = data.schools.map(([code, shortName, fullName, citySlug, isPrivate, grades, officialName]) => {
          const city = bySlug[citySlug];
          const s = {
            code, shortName, fullName, city, isPrivate: !!isPrivate, grades,
            _kf: searchKey(fullName), _ks: searchKey(shortName)
          };
          // Името, градът, кодът, разписаните съкращения (МГ → математическа гимназия …) и официалното име от МОН.
          s._h = [s._kf, s._ks, city ? city._k : '', code, searchKey(expandAbbreviations(fullName + ' ' + shortName)),
            searchKey(String(officialName || '').replace(/"/g, ' '))].join(' ');
          return s;
        });
        return { cities, schools };
      })
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

// 0 = началото на името или на дума в него, 1 = вътре в дума, 2 = само чрез други полета.
function nameTier(name, q) {
  const idx = name.indexOf(q);
  if (idx < 0) {
    return 2;
  }
  return idx === 0 || name.charAt(idx - 1) === ' ' ? 0 : 1;
}

function contextGrade() {
  const g = Number.parseInt(document.body.dataset.grade || '', 10);
  return GRADE_NAMES[g] ? g : null;
}

function cityHref(city) {
  const ctx = contextGrade();
  const grade = ctx && city.grades.includes(ctx) ? ctx : GRADE_ORDER.find((g) => city.grades.includes(g));
  if (grade) {
    return siteUrl(grade + '/#' + city.slug);
  }
  return siteUrl('7/balove/' + city.slug + '/');
}

function search(index, raw) {
  const q = normalize(raw);
  // Сравняваме по общ ключ (латиница = кирилица); за оцветяването - заявката на кирилица.
  const kq = searchKey(raw);
  const keys = kq.split(' ').filter(Boolean);
  const terms = normalize(toCyrillic(raw)).split(' ').filter(Boolean);
  const pages = q
    ? PAGES.filter((p) => keys.every((t) => searchKey(p.title + ' ' + (p.sub || '') + ' ' + p.terms).includes(t)))
    : PAGES.slice(1, 8);
  if (!index || q.length < 2) {
    return { pages, cities: [], schools: [], terms };
  }
  const cities = index.cities
    .filter((c) => keys.every((t) => c._k.includes(t)))
    .sort((a, b) => nameTier(a._k, kq) - nameTier(b._k, kq) || a.rank - b.rank)
    .slice(0, MAX_CITIES);
  const matched = index.schools
    .filter((s) => keys.every((t) => s._h.includes(t)))
    .sort((a, b) => {
      const ra = Math.min(nameTier(a._kf, kq), nameTier(a._ks, kq));
      const rb = Math.min(nameTier(b._kf, kq), nameTier(b._ks, kq));
      if (ra !== rb) {
        return ra - rb;
      }
      const ao = a.city ? a.city.rank : Infinity;
      const bo = b.city ? b.city.rank : Infinity;
      if (ao !== bo) {
        return ao - bo;
      }
      return a.fullName.localeCompare(b.fullName, 'bg');
    });
  return { pages, cities, schools: matched.slice(0, MAX_SCHOOLS), schoolsTotal: matched.length, terms };
}

function render(result, loading) {
  const html = [];
  items = [];
  const push = (href) => {
    items.push(href);
    return items.length - 1;
  };
  if (result.pages.length) {
    html.push('<div class="combo__group">Страници</div>');
    result.pages.forEach((p) => {
      const i = push(siteUrl(p.href));
      html.push('<a class="palette__item" data-i="' + i + '" href="' + esc(items[i]) + '">'
        + '<span class="palette__item-icon">' + icon(p.icon) + '</span>'
        + '<span class="palette__item-main"><span class="palette__item-title">' + highlight(p.title, result.terms) + '</span>'
        + (p.sub ? '<span class="palette__item-sub">' + esc(p.sub) + '</span>' : '') + '</span></a>');
    });
  }
  if (result.cities.length) {
    html.push('<div class="combo__group">Градове</div>');
    result.cities.forEach((c) => {
      const i = push(cityHref(c));
      const links = c.grades.slice().sort((a, b) => a - b)
        .map((g) => '<a class="badge" href="' + esc(siteUrl(g + '/#' + c.slug)) + '" title="' + esc(GRADE_NAMES[g] + ' - ' + c.name) + '">' + g + '</a>');
      if (c.balove) {
        links.push('<a class="badge badge--accent" href="' + esc(siteUrl('7/balove/' + c.slug + '/')) + '" title="Балове - ' + esc(c.name) + '">Балове</a>');
      }
      html.push('<div class="palette__row"><a class="palette__item" data-i="' + i + '" href="' + esc(items[i]) + '">'
        + '<span class="palette__item-icon">' + icon('pin') + '</span>'
        + '<span class="palette__item-main"><span class="palette__item-title">' + highlight(c.name, result.terms) + '</span>'
        + '<span class="palette__item-sub">Класация и сравнение на училищата в града</span></span></a>'
        + '<span class="palette__links">' + links.join('') + '</span></div>');
    });
  }
  if (result.schools.length) {
    html.push('<div class="combo__group">Училища · ' + result.schoolsTotal + '</div>');
    result.schools.forEach((s) => {
      const i = push(siteUrl('school/' + s.code + '/'));
      const links = s.grades.slice().sort((a, b) => a - b)
        .map((g) => '<a class="badge" href="' + esc(siteUrl(g + '/?school=' + s.code)) + '" title="' + esc('Сравни в графиката - ' + GRADE_NAMES[g]) + '">' + g + '</a>');
      html.push('<div class="palette__row"><a class="palette__item" data-i="' + i + '" href="' + esc(items[i]) + '">'
        + '<span class="palette__item-icon">' + icon('school') + '</span>'
        + '<span class="palette__item-main"><span class="palette__item-title">' + highlight(s.fullName, result.terms) + '</span>'
        + '<span class="palette__item-sub">' + esc((s.city ? s.city.name : '') + (s.isPrivate ? ' · частно' : ' · държавно')) + '</span></span></a>'
        + '<span class="palette__links">' + links.join('') + '</span></div>');
    });
  }
  if (result.schoolsTotal > result.schools.length) {
    html.push('<div class="combo__empty">Показани са първите ' + result.schools.length + ' от ' + result.schoolsTotal
      + '. Добави града или още една дума, за да стесниш търсенето - напр. "Ботев Пловдив".</div>');
  }
  if (!items.length) {
    html.push('<div class="combo__empty">' + (loading ? 'Зареждане…' : 'Няма резултати за "' + esc(lastQuery) + '"') + '</div>');
  } else if (loading) {
    html.push('<div class="combo__empty">Зареждане на училищата…</div>');
  } else if (normalize(lastQuery).length < 2) {
    html.push('<div class="combo__empty">Напиши поне 2 букви, за да търсиш сред 1400+ училища и 140+ града.</div>');
  }
  resultsEl.innerHTML = html.join('');
  setActive(items.length ? 0 : -1);
}

function setActive(i) {
  active = i;
  resultsEl.querySelectorAll('.palette__item').forEach((el) => {
    const on = Number(el.dataset.i) === i;
    el.classList.toggle('is-active', on);
    if (on) {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

function update() {
  lastQuery = input.value;
  const q = normalize(lastQuery);
  if (q.length < 2) {
    render(search(null, lastQuery), false);
    return;
  }
  loadIndex()
    .then((index) => {
      if (lastQuery === input.value) {
        render(search(index, lastQuery), false);
      }
    })
    .catch(() => {
      resultsEl.innerHTML = '<div class="combo__empty">Търсенето не можа да се зареди. Опитай отново.</div>';
    });
  if (!indexPromise || !indexPromise._done) {
    render(search(null, lastQuery), true);
  }
}

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'palette';
  dialog.setAttribute('aria-label', 'Търсене');
  dialog.innerHTML = '<div class="palette__field">' + icon('search')
    + '<input class="palette__input" type="search" placeholder="Училище, град или страница…" autocomplete="off" spellcheck="false" aria-label="Търсене" aria-controls="palette-results">'
    + '<button type="button" class="icon-btn" data-close aria-label="Затвори">' + icon('x') + '</button></div>'
    + '<div class="palette__results" id="palette-results" role="listbox"></div>'
    + '<div class="palette__hint"><span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> избор</span>'
    + '<span><kbd class="kbd">Enter</kbd> отвори</span><span><kbd class="kbd">Esc</kbd> затвори</span></div>';
  document.body.appendChild(dialog);
  input = dialog.querySelector('input');
  resultsEl = dialog.querySelector('.palette__results');

  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length) {
        setActive((active + 1) % items.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) {
        setActive((active - 1 + items.length) % items.length);
      }
    } else if (e.key === 'Enter') {
      if (active >= 0 && items[active]) {
        e.preventDefault();
        window.location.href = items[active];
      }
    } else if (e.key === 'Escape') {
      // В поле type=search първото Esc само изчиства текста - затваряме веднага, както казва подсказката.
      e.preventDefault();
      dialog.close();
    }
  });
  resultsEl.addEventListener('mousemove', (e) => {
    const el = e.target.closest('.palette__item');
    if (el && Number(el.dataset.i) !== active) {
      setActive(Number(el.dataset.i));
    }
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });
  loadIndex().then(() => { indexPromise._done = true; }).catch(() => {});
}

export function preloadIndex() {
  loadIndex().then(() => { indexPromise._done = true; }).catch(() => {});
}

export function openPalette(query) {
  if (!dialog) {
    build();
  }
  input.value = query || '';
  if (!dialog.open) {
    showModal(dialog);
  }
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
  update();
}
