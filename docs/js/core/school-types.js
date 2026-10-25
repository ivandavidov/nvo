// Видовете училища според финансирането в регистъра на МОН - същото като SchoolType.java.
// key е полето t в data/grade-{g}.json и 8-ият елемент в data/search-index.json,
// api е полето financing в API-то. Редът е навсякъде един и същ.

export const SCHOOL_TYPES = [
  { key: 's', letter: 'Д', api: 'state', label: 'Държавно', plural: 'Държавни', lower: 'държавно', lowerPlural: 'държавни', definite: 'държавните' },
  { key: 'm', letter: 'О', api: 'municipal', label: 'Общинско', plural: 'Общински', lower: 'общинско', lowerPlural: 'общински', definite: 'общинските' },
  { key: 'p', letter: 'Ч', api: 'private', label: 'Частно', plural: 'Частни', lower: 'частно', lowerPlural: 'частни', definite: 'частните' },
  { key: 'r', letter: 'ДУ', api: 'religious', label: 'Духовно', plural: 'Духовни', lower: 'духовно', lowerPlural: 'духовни', definite: 'духовните' }
];

export const TYPE_KEYS = SCHOOL_TYPES.map((t) => t.key);

const BY_KEY = {};
SCHOOL_TYPES.forEach((t) => { BY_KEY[t.key] = t; });

/** Описанието на вид по ключ ('s' | 'm' | 'p' | 'r'); непознат ключ - общинско. */
export function schoolType(key) {
  return BY_KEY[key] || BY_KEY.m;
}

/** Мястото на вида в общия ред (за сортиране). */
export function typeOrder(key) {
  const k = TYPE_KEYS.indexOf(key);
  return k < 0 ? TYPE_KEYS.length : k;
}

/** Ключът от API документ (financing; стари документи - по isPrivate). */
export function typeKeyFromApi(financing, isPrivate) {
  const t = SCHOOL_TYPES.find((x) => x.api === financing);
  return t ? t.key : (isPrivate ? 'p' : null);
}

/** Ключовете в общия ред, без повторения. */
export function sortTypes(keys) {
  return TYPE_KEYS.filter((k) => keys.includes(k));
}

/** "държавни", "държавни и частни", "държавни, общински и частни". */
export function joinTypes(keys) {
  const words = sortTypes(keys).map((k) => BY_KEY[k].lowerPlural);
  return words.length < 2 ? words.join('') : words.slice(0, -1).join(', ') + ' и ' + words[words.length - 1];
}

/** Цветната буква (Д / О / Ч / ДУ) с пълната дума за подсказка и екранни четци. */
export function typeBadgeHtml(key) {
  const t = schoolType(key);
  return '<span class="type-badge type-badge--' + t.key + '" title="' + t.label + '"><span aria-hidden="true">' + t.letter
    + '</span><span class="sr-only">' + t.lower + '</span></span>';
}
