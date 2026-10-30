// Общото за подкомандите на nvo: регистър, грешки, класове, видове училища, адреси към сайта.

import { GRADES } from '../../core/config.js';
import { SCHOOL_TYPES } from '../../core/school-types.js';
import { searchKey } from '../../ui/search-text.js';
import { siteUrl } from '../commands/util.js';

export const SUBS = new Map();

/**
 * spec: { name, aliases?, summary, usage, description?, options?: [[флаг, текст]], examples?,
 *         opts?: { short, long, multi } (освен общите), run(ctx, opts, rest), complete?(info) }
 */
export function defineSub(spec) {
  SUBS.set(spec.name, spec);
  for (const a of spec.aliases || []) SUBS.set(a, spec);
  return spec;
}

export function uniqueSubs() {
  const seen = new Set();
  return Array.from(SUBS.values()).filter((s) => !seen.has(s) && seen.add(s));
}

/** Грешка на nvo: печата се като "nvo: съобщение"; code 2 = грешна употреба. */
export class NvoError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
}

export const GRADE_LABEL = { 4: 'НВО 4 клас', 7: 'НВО 7 клас', 10: 'НВО 10 клас', 12: 'ДЗИ 12 клас' };

export function parseGrade(value) {
  const g = Number(String(value || '').replace(/[^\d]/g, ''));
  if (!GRADES.includes(g)) throw new NvoError("невалиден клас '" + (value ?? '') + "' - 4, 7, 10 или 12", 2);
  return g;
}

export function isGrade(value) {
  return GRADES.includes(Number(value)) && /^\d+$/.test(String(value));
}

export function parseYear(value) {
  const y = Number(value);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) throw new NvoError("невалидна година '" + value + "'", 2);
  return y;
}

const TYPE_WORDS = {};
for (const t of SCHOOL_TYPES) {
  for (const w of [t.key, t.api, t.letter, t.label, t.plural, t.lower, t.lowerPlural, t.definite]) TYPE_WORDS[searchKey(w)] = t.key;
}

/** "д,о,ч,ду" / "s,m,p,r" / "частни" → ['s', 'p', …] в общия ред. */
export function parseTypes(value) {
  if (!value) return null;
  const keys = [];
  for (const part of String(value).split(/[,\s]+/).filter(Boolean)) {
    const k = TYPE_WORDS[searchKey(part)];
    if (!k) throw new NvoError("непознат вид училище '" + part + "' - д, о, ч, ду (или s, m, p, r)", 2);
    if (!keys.includes(k)) keys.push(k);
  }
  return SCHOOL_TYPES.map((t) => t.key).filter((k) => keys.includes(k));
}

/** Адрес към страница от сайта (на същия адрес, от който е отворена конзолата). */
export function link(path) {
  return siteUrl(path);
}

export const PATHS = {
  grade: (g) => g + '/',
  city: (g, slug) => g + '/#' + slug,
  cityPage: (g, slug) => g + '/' + slug + '/',
  yearPage: (g, y) => g + '/' + y + '/',
  compare: (g, codes, slug) => g + '/?s=' + codes.join(',') + (slug ? '#' + slug : ''),
  history: (g, y, slug) => g + '/?year=' + y + (slug ? '#' + slug : ''),
  school: (code) => 'school/' + code + '/',
  balove: (slug, school, profile, gender) => '7/balove/' + (slug ? slug + '/' : '') + (school ? '?school=' + school + (profile ? '&profile=' + profile : '') + (gender ? '&gender=true' : '') : ''),
  stats: (g) => 'stats/' + (g ? '?grade=' + g : ''),
  blog: (slug) => 'blog/' + (slug ? slug + '/' : ''),
  api: () => 'api/v1/',
  embed: () => 'embed/',
  about: (section) => 'za-proekta/' + (section ? '#' + section : ''),
};
