// Данните за nvo: същите файлове, които ползва сайтът (data/grade-{g}.json, data/search-index.json,
// api/v1/…), с кеш за сесията, и разпознаването на град и училище от аргумент.

import { fetchGradeData, buildModel, renderableCities } from '../../core/model.js';
import { loadIndex, search } from '../../ui/search-core.js';
import { searchKey } from '../../ui/search-text.js';
import { siteUrl } from '../commands/util.js';
import { NvoError, GRADE_LABEL } from './core.js';

const jsonCache = new Map();
const modelCache = new Map();

/** JSON от сайта (път спрямо docs/), кеширан за сесията. */
export function getJson(path) {
  if (!jsonCache.has(path)) {
    const p = fetch(siteUrl(path)).then((r) => {
      if (!r.ok) throw new NvoError(r.status === 404 ? 'няма данни (' + path + ')' : 'грешка ' + r.status + ' при зареждане на ' + path);
      return r.json();
    });
    p.catch(() => jsonCache.delete(path));
    jsonCache.set(path, p);
  }
  return jsonCache.get(path);
}

export async function getText(path) {
  const r = await fetch(siteUrl(path));
  if (!r.ok) throw new NvoError('няма страница ' + path + ' (HTTP ' + r.status + ')');
  return r.text();
}

/** Моделът на сайта за клас (като на страницата по клас); year = исторически изглед (?year=). */
export async function gradeModel(grade, year = null) {
  const key = grade + ':' + (year || '');
  if (!modelCache.has(key)) {
    const p = fetchGradeData(grade, siteUrl('data/grade-' + grade + '.json')).then((raw) => buildModel(grade, raw, { year }));
    p.catch(() => modelCache.delete(key));
    modelCache.set(key, p);
  }
  return modelCache.get(key);
}

const rawCache = new Map();

/**
 * Суровите стойности по код: БЕЛ и МАТ от data/grade-{g}.json (при ДЗИ - с 3 знака, както ги ползват
 * страниците /КЛАС/ГОДИНА/ и /КЛАС/ГРАД/; API-то ги закръгля до 2). → (code, year) → {b, m} | null
 */
export async function rawScores(grade) {
  if (!rawCache.has(grade)) {
    const p = fetchGradeData(grade, siteUrl('data/grade-' + grade + '.json')).then((raw) => {
      const first = Number(raw.firstYear) || 2018;
      const byCode = new Map();
      raw.s.forEach((o) => {
        if (o) byCode.set(o.c, o);
      });
      return (code, year) => {
        const o = byCode.get(code);
        const k = year - first;
        return o && k >= 0 && o.b[k] !== null && o.b[k] !== undefined ? { b: o.b[k], m: o.m[k] } : null;
      };
    });
    p.catch(() => rawCache.delete(grade));
    rawCache.set(grade, p);
  }
  return rawCache.get(grade);
}

export const searchIndex = () => loadIndex();
export const apiIndex = () => getJson('api/v1/index.json');
export const schoolDoc = (code) => getJson('api/v1/schools/' + code + '.json');
export const yearRanking = (g, y) => getJson('api/v1/rankings/' + g + '/' + y + '.json');
export const medianRanking = (g, y) => getJson('api/v1/rankings/median/' + g + '/' + y + '.json');
export const baloveIndex = () => getJson('api/v1/balove/index.json');
export const baloveCity = (slug) => getJson('api/v1/balove/' + slug + '.json');
export const blogPosts = () => getJson('blog/posts.json');

/** Последната година с данни за клас (от данните, както на сайта). */
export async function latestYear(grade) {
  return (await gradeModel(grade)).dataLatestYear;
}

function cityCandidates(index, arg) {
  const raw = String(arg).trim();
  const slugish = raw.toLowerCase().replace(/\s+/g, '-');
  const key = searchKey(raw);
  const exact = index.cities.filter((c) => c.slug === slugish || c._k === key);
  if (exact.length) return exact;
  return index.cities.filter((c) => c.slug.startsWith(slugish) || c._k.startsWith(key));
}

/** Град по slug (sofia), име (София) или латиница (stara zagora). */
export async function resolveCity(arg) {
  if (!arg) throw new NvoError('липсва град', 2);
  const index = await searchIndex();
  const found = cityCandidates(index, arg);
  if (found.length === 1) return found[0];
  if (!found.length) throw new NvoError("няма град '" + arg + "' (nvo cities изрежда градовете)");
  throw new NvoError("'" + arg + "' съвпада с няколко града: " + found.slice(0, 8).map((c) => c.slug).join(', ') + (found.length > 8 ? ', ...' : ''));
}

/** Градът в модела на клас (с диапазоните на училищата) или грешка, ако няма данни. */
export function modelCity(model, city) {
  const c = renderableCities(model).find((x) => x.slug === city.slug);
  if (!c) throw new NvoError('няма резултати за ' + GRADE_LABEL[model.grade] + ' в ' + city.name + (model.timeTravelYear ? ' за ' + model.latestYear : ''));
  return c;
}

/** Училище по код или по име ("пмг пловдив"). При няколко съвпадения - грешка със списък. */
export async function resolveSchool(arg) {
  const q = String(arg || '').trim();
  if (!q) throw new NvoError('липсва училище (код или име)', 2);
  const index = await searchIndex();
  if (/^\d{5,7}$/.test(q)) {
    const s = index.schools.find((x) => x.code === q);
    if (!s) throw new NvoError('няма училище с код ' + q);
    return s;
  }
  const res = search(index, q, { maxSchools: 5000 });
  if (res.schoolsTotal === 1) return res.schools[0];
  if (!res.schoolsTotal) throw new NvoError("няма училище за '" + q + "' (nvo search " + q + ')');
  const key = searchKey(q);
  const exact = res.schools.filter((s) => s._ks === key || s._kf === key);
  if (exact.length === 1) return exact[0];
  const lines = res.schools.slice(0, 10).map((s) => '  ' + s.code.padEnd(8) + s.shortName + (s.city ? ' (' + s.city.name + ')' : ''));
  throw new NvoError("'" + q + "' съвпада с " + res.schoolsTotal + ' училища - уточнете с кода или добавете града:\n' + lines.join('\n') + (res.schoolsTotal > 10 ? '\n  ... и още ' + (res.schoolsTotal - 10) : ''));
}

/** Кандидатите за Tab: градове (slug). */
export async function citySlugs(prefix = '') {
  const index = await searchIndex();
  return index.cities.filter((c) => c.slug.startsWith(prefix)).map((c) => ({ value: c.slug, desc: c.name }));
}

/** Кандидатите за Tab: кодове на училища (с името за описание). */
export async function schoolCodes(prefix = '') {
  if (!/^\d+$/.test(prefix)) return [];
  const index = await searchIndex();
  return index.schools.filter((s) => s.code.startsWith(prefix)).slice(0, 300).map((s) => ({ value: s.code, desc: s.shortName + (s.city ? ' (' + s.city.name + ')' : '') }));
}
