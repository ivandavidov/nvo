// Ядрото на глобалното търсене: страниците, индексът data/search-index.json и съвпадението
// (латиница = кирилица, разписани съкращения). Без DOM - ползва се от палитрата (search-palette.js)
// и от всяка друга страница, която търси същото.
import { searchKey, toCyrillic, expandAbbreviations } from './search-text.js';

// Много училища носят едно и също име ("Христо Ботев" - 70+), затова връщаме много резултати,
// а общия брой - отделно.
export const MAX_SCHOOLS = 100;
export const MAX_CITIES = 6;

export const PAGES = [
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

const INDEX_URL = new URL('../../data/search-index.json', import.meta.url).toString();

let indexPromise = null;
let loaded = false;

export function normalize(str) {
  return (str || '').toString().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

/** Индексът (зарежда се веднъж): { cities: [...], schools: [...] } с ключовете за търсене. */
export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(INDEX_URL)
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
        const schools = data.schools.map(([code, shortName, fullName, citySlug, isPrivate, grades, officialName, type]) => {
          const city = bySlug[citySlug];
          const s = {
            code, shortName, fullName, city, isPrivate: !!isPrivate, grades, officialName: officialName || null,
            // видът (8-ият елемент); стар индекс без него - по isPrivate
            type: type || (isPrivate ? 'p' : null),
            _kf: searchKey(fullName), _ks: searchKey(shortName)
          };
          // Името, градът, кодът, разписаните съкращения (МГ → математическа гимназия …) и официалното име от МОН.
          s._h = [s._kf, s._ks, city ? city._k : '', code, searchKey(expandAbbreviations(fullName + ' ' + shortName)),
            searchKey(String(officialName || '').replace(/"/g, ' '))].join(' ');
          return s;
        });
        loaded = true;
        return { cities, schools };
      })
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

/** Дали индексът вече е зареден (палитрата показва "Зареждане…" дотогава). */
export function indexLoaded() {
  return loaded;
}

// 0 = началото на името или на дума в него, 1 = вътре в дума, 2 = само чрез други полета.
function nameTier(name, q) {
  const idx = name.indexOf(q);
  if (idx < 0) {
    return 2;
  }
  return idx === 0 || name.charAt(idx - 1) === ' ' ? 0 : 1;
}

/**
 * Търсене в индекса (null = само страниците). Връща { pages, cities, schools (първите
 * MAX_SCHOOLS), schoolsTotal, terms } - terms са думите на кирилица за оцветяването.
 */
export function search(index, raw, { maxSchools = MAX_SCHOOLS, maxCities = MAX_CITIES } = {}) {
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
    .slice(0, maxCities);
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
  return { pages, cities, schools: matched.slice(0, maxSchools), schoolsTotal: matched.length, terms };
}
