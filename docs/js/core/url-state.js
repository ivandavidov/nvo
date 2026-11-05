// Състоянието на страница по клас в адреса - същият договор като преди:
//   ?i{g}=индекси (избраните училища), ?school=код (deep link), ?year=година
//   (исторически изглед), #град; изборът се помни и в бисквитка i{g}.
//   ?avg=slug1,slug2 - градовете, чийто среден резултат е в графиката (бисквитка avg{g}).
//   Без избор в адреса и в бисквитките - графиката по подразбиране (defaultSchools +
//   defaultAverages в config.js).
import { COOKIE_MAX_AGE_SECONDS } from './config.js';
import { findSchoolIndexByCode, defaultSelection, defaultAverages } from './model.js';

export function readYearParam() {
  return new URL(window.location.href).searchParams.get('year');
}

export function readSchoolParam() {
  return new URL(window.location.href).searchParams.get('school');
}

export function readCityHash() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ''));
}

/**
 * Училищата, зададени в линка с код (?school= или ?s=), или null. Те определят и
 * града на таблицата, за разлика от ?i{g}= - него страницата сама пише в адреса.
 */
export function linkedSchools(model) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('school');
  if (code) {
    const idx = findSchoolIndexByCode(model, code);
    if (idx >= 0) {
      return [String(idx)];
    }
  }
  if (url.searchParams.get('s')) {
    // Стабилни кодове на училища (ползват се от вграждането): ?s=2216306,2211304
    const fromCodes = url.searchParams.get('s').split(',')
      .map((c) => findSchoolIndexByCode(model, c.trim()))
      .filter((i) => i >= 0)
      .map(String);
    if (fromCodes.length) {
      return fromCodes;
    }
  }
  return null;
}

/** Параметърът (и началото на бисквитката) за средните на градове в графиката. */
export const AVG_PARAM = 'avg';

function avgCookieName(cfg) {
  return AVG_PARAM + cfg.grade;
}

function readCookie(name) {
  const m = (document.cookie + ';').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*);'));
  return m && m[1] ? m[1] : '';
}

/** Познатите градове (slug) от списък "a,b" - в реда от списъка, без повторения. */
function validCities(list, cities) {
  const known = new Set(cities.map((c) => c.slug));
  const out = [];
  String(list || '').split(',').map((x) => x.trim()).forEach((slug) => {
    if (known.has(slug) && !out.includes(slug)) {
      out.push(slug);
    }
  });
  return out;
}

/**
 * Адресът сам описва избора (училища и/или средни на градове) - тогава бисквитките не се четат.
 * Непознат код в ?school= / ?s= не се брои (както досега - тогава изборът идва от бисквитките).
 */
function urlDefinesSelection(model) {
  const p = new URL(window.location.href).searchParams;
  return !!linkedSchools(model) || [model.cfg.cookieName, AVG_PARAM].some((k) => p.get(k));
}

/** Индексите от списък "1,2" (адрес или бисквитка) - само съществуващи училища, без повторения. */
function validSchools(model, list) {
  const out = [];
  list.forEach((id) => {
    const n = Number(id);
    if (Number.isInteger(n) && model.s[n] && !out.includes(n)) {
      out.push(n);
    }
  });
  return out;
}

function splitIds(value) {
  return String(value || '').split(',').map((i) => i.split('#')[0].trim()).filter((i) => i !== '');
}

/**
 * Началният избор в графиката - училищата (индекси) и средните за градове (slug), от едно място:
 *   1. адресът, ако описва избор (?school= / ?s= с познат код, ?i{g}=, ?avg=) - само той
 *      (линкът ?school= показва само училището, ?avg= без училища - само средните);
 *   2. иначе запазеното в бисквитките i{g} и avg{g};
 *   3. иначе - или ако от горното не остане нищо валидно (напр. ?i7=abc) - графиката по
 *      подразбиране от config.js: defaultSchools + defaultAverages.
 * cities - градовете с данни (renderableCities); непознатите градове се пропускат.
 * → { schools: [индекси], averages: [slug] }
 */
export function initialChart(model, cities = []) {
  const { cfg } = model;
  const params = new URL(window.location.href).searchParams;
  const picked = urlDefinesSelection(model)
    ? {
      schools: validSchools(model, linkedSchools(model) || splitIds(params.get(cfg.cookieName))),
      averages: validCities(params.get(AVG_PARAM), cities)
    }
    : {
      schools: validSchools(model, splitIds(readCookie(cfg.cookieName))),
      averages: validCities(readCookie(avgCookieName(cfg)), cities)
    };
  if (picked.schools.length || picked.averages.length) {
    return picked;
  }
  return { schools: defaultSelection(model), averages: defaultAverages(model, cities) };
}

/** Записва избора в адреса (replaceState) и в бисквитката - като стария handleURL. */
/** history.replaceState, който не чупи страницата, ако браузърът го ограничи (Safari: 100 пъти за 10 s). */
function replaceUrl(url) {
  try {
    window.history.replaceState(null, '', url);
  } catch (e) {
    // адресът ще се обнови при следващата промяна
  }
}

function writeCookie(name, value) {
  document.cookie = value ? name + '=' + value + ';path=/;max-age=' + COOKIE_MAX_AGE_SECONDS : name + '=;path=/;max-age=-1';
}

/** avgCities - градовете (slug) със среден резултат в графиката. */
export function writeSelection(model, indices, cityHash, avgCities = []) {
  const { cfg, timeTravelYear } = model;
  const url = new URL(window.location.href);
  const anchor = cityHash !== undefined ? cityHash : url.hash.replace(/^#/, '');
  const base = url.origin + url.pathname;
  const list = indices.join(',');
  const avg = avgCities.join(',');
  writeCookie(cfg.cookieName, list);
  writeCookie(avgCookieName(cfg), avg);
  const query = [
    timeTravelYear ? 'year=' + timeTravelYear : '',
    list ? cfg.cookieName + '=' + list : '',
    avg ? AVG_PARAM + '=' + avg : ''
  ].filter(Boolean).join('&');
  replaceUrl(base + (query ? '?' + query : '') + (anchor ? '#' + anchor : ''));
}

/** Пълният адрес за споделяне на текущия избор. */
export function shareUrl(model, indices, cityHash, avgCities = []) {
  const { cfg, timeTravelYear } = model;
  const url = new URL(window.location.origin + window.location.pathname);
  if (timeTravelYear) {
    url.searchParams.set('year', String(timeTravelYear));
  }
  if (indices.length) {
    url.searchParams.set(cfg.cookieName, indices.join(','));
  }
  if (avgCities.length) {
    url.searchParams.set(AVG_PARAM, avgCities.join(','));
  }
  let href = url.toString().replace(/%2C/g, ',');
  if (cityHash) {
    href += '#' + cityHash;
  }
  return href;
}
