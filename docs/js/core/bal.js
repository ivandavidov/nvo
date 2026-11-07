// "Моят бал" на страниците с балове: балът, който посетителят въвежда (или смята от точките
// си), и докъде стига спрямо минималните балове на паралелките. Без DOM.
//
// Сайтът не знае формулата на никоя паралелка (в данните от РУО я няма). Формулата избира
// посетителят (FORMULAS), а сравнението е само по крайния резултат - едно число срещу
// минималните балове.
// Проверени факти (РУО Русе, "Балообразуване" за прием 2026): максималният бал е 500, точките
// от НВО по БЕЛ и по математика са до 100, оценките от свидетелството се превръщат в точки по
// скалата долу.

export const MAX_BAL = 500;
/** Най-ниският възможен бал: 0 точки от НВО и две оценки среден (3) - 2 × 15 по скалата долу. */
export const MIN_BAL = 30;
export const MAX_NVO = 100;

/** Формулите, от които посетителят избира в "Изчисли бала": коефициент за БЕЛ и за математика. */
export const FORMULAS = [
  { key: '2-2', bel: 2, mat: 2, label: '2 × БЕЛ + 2 × МАТ' },
  { key: '1-3', bel: 1, mat: 3, label: '1 × БЕЛ + 3 × МАТ' },
  { key: '3-1', bel: 3, mat: 1, label: '3 × БЕЛ + 1 × МАТ' }
];

/** Оценките от свидетелството в точки (скалата за прием след 7 клас). */
export const GRADE_POINTS = [
  { grade: 6, points: 50, name: 'отличен' },
  { grade: 5, points: 39, name: 'много добър' },
  { grade: 4, points: 26, name: 'добър' },
  { grade: 3, points: 15, name: 'среден' }
];

/** "412,5" и "412.5" → 412.5; празно → null; извън min-max или не число → NaN. */
export function parseScore(text, max, min = 0) {
  const s = String(text || '').trim().replace(/\s+/g, '').replace(',', '.');
  if (!s) {
    return null;
  }
  if (!/^\d+(\.\d*)?$/.test(s)) {   // "412." докато се пише
    return Number.NaN;
  }
  const v = Number(s);
  return v >= min && v <= max ? v : Number.NaN;
}

/** Бал от частите (точките от НВО по избраната формула + точките от двете оценки) или null, ако нещо липсва. */
export function balFromParts({ bel, mat, formula, grade1, grade2 }) {
  const f = FORMULAS.find((x) => x.key === formula);
  const g1 = GRADE_POINTS.find((g) => g.grade === grade1);
  const g2 = GRADE_POINTS.find((g) => g.grade === grade2);
  if (!f || !g1 || !g2 || !Number.isFinite(bel) || !Number.isFinite(mat)) {
    return null;
  }
  return Math.round((f.bel * bel + f.mat * mat + g1.points + g2.points) * 100) / 100;
}

/**
 * Докъде стига балът за една паралелка през една година. `d` е масивът по години от
 * ruo-{град}.js (всяка година има 4 класирания, всяко [мин, …] или null), yi - годината.
 *  - mins: минималният бал на всяко класиране (null - няма такъв в данните);
 *  - klass: първото класиране, чийто минимум е до бала (0 = 1-во), или -1 - не стига за никое;
 *  - lowest: класирането с най-нисък минимум, или -1 - няма данни за годината.
 */
export function reach(d, bal, yi) {
  const mins = [0, 1, 2, 3].map((ki) => {
    const k = d[yi] ? d[yi][ki] : null;
    return k && k[0] > 0 ? k[0] : null;
  });
  const klass = mins.findIndex((m) => m !== null && bal >= m);
  let lowest = -1;
  mins.forEach((m, ki) => {
    if (m !== null && (lowest < 0 || m < mins[lowest])) {
      lowest = ki;
    }
  });
  return { mins, klass, lowest };
}

/* ---------- Запомненият бал (само на това устройство, никога в адреса) ---------- */

const KEY = 'nvo-bal';

export function readSavedBal() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && typeof v === 'object' ? v : null;
  } catch (e) {
    return null;
  }
}

export function saveBal(value) {
  try {
    if (value) {
      localStorage.setItem(KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch (e) {
    // няма хранилище (частен прозорец) - балът важи до затварянето на страницата
  }
}
