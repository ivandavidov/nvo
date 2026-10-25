// Конфигурация по клас за фронтенда. Последната година идва от самите данни
// (data/grade-{g}.json), затова тук я няма.

export const GRADES = [4, 7, 10, 12];

/**
 * От коя година сайтът показва данни (графики, таблици, доклади). По-ранните години
 * са само в експорта (CSV, API): НВО 7 клас за 2018 г. е по 65-точкова скала,
 * а НВО 10 клас за 2018-2020 г. са копия.
 */
export const DISPLAY_FROM = { 4: 2019, 7: 2019, 10: 2021, 12: 2019 };

/** Най-много толкова последни години в графиките и таблиците. */
export const MAX_YEARS = 8;

/** Години в исторически изглед (?year=). */
export const HISTORY_YEARS = 3;

/** Годините за показване до lastYear: {from, to} (историческият изглед е по-къс). */
export function displayRange(grade, lastYear, historical = false) {
  const span = historical ? HISTORY_YEARS : MAX_YEARS;
  return { from: Math.max(DISPLAY_FROM[grade], lastYear - span + 1), to: lastYear };
}

/** Най-ранната година за исторически изглед - такава, че има пълни HISTORY_YEARS години. */
export function navFirstYear(grade) {
  return DISPLAY_FROM[grade] + HISTORY_YEARS - 1;
}

export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const DEFAULTS = {
  firstYear: 2018, // началото на масивите в data/grade-{g}.json
  rankBase: 0,
  rankRangeTop: 25,
  rankRangeBottom: 50,
  tableTitleName: 'Класация на училищата',
  chartFloor: 0,
  chartCeiling: 100,
  csvHeaderBel: 'БЕЛ',
  csvHeaderMat: 'МАТ',
  csvHeaderB: 'Б',
  csvHeaderM: 'М',
  disabledEntries: [],
  exam: 'НВО',
  subjectB: 'БЕЛ',
  subjectM: 'МАТ',
  subjectBLong: 'Български език',
  subjectMLong: 'Математика',
  scale: 'точки'
};

const OVERRIDES = {
  4: {
    tableTitleType: 'НВО след 4 клас',
    cookieName: 'i4',
    exportPrefix: 'nvo-4',
    chartBTitle: '4 клас - НВО - Български език',
    chartMTitle: '4 клас - НВО - Математика',
    baseSchoolIndex: 135,
    refSchoolIndex: 39
  },
  7: {
    tableTitleType: 'НВО след 7 клас',
    cookieName: 'i7',
    exportPrefix: 'nvo-7',
    chartBTitle: '7 клас - НВО - Български език',
    chartMTitle: '7 клас - НВО - Математика',
    baseSchoolIndex: 167,
    refSchoolIndex: 39
  },
  10: {
    tableTitleType: 'НВО след 10 клас',
    cookieName: 'i10',
    exportPrefix: 'nvo-10',
    chartBTitle: '10 клас - НВО - Български език',
    chartMTitle: '10 клас - НВО - Математика',
    baseSchoolIndex: 1,
    refSchoolIndex: 51
  },
  12: {
    rankBase: 2,
    tableTitleName: 'Класация на гимназиите',
    tableTitleType: 'ДЗИ след 12 клас',
    cookieName: 'i12',
    exportPrefix: 'dzi-12',
    exportPrefixMat: 'dzi-12-dzi-2',
    chartCeiling: 6,
    chartBTitle: '12 клас - ДЗИ - Български език',
    chartMTitle: '12 клас - ДЗИ - Втора матура',
    csvHeaderBel: 'ДЗИ-Б',
    csvHeaderMat: 'ДЗИ-2',
    csvHeaderM: '2',
    baseSchoolIndex: 1,
    refSchoolIndex: 51,
    exam: 'ДЗИ',
    subjectM: 'ДЗИ-2',
    subjectMLong: 'Втора матура',
    scale: 'оценка'
  }
};

/** Пълната конфигурация за клас (нов обект при всяко извикване). */
export function gradeConfig(grade) {
  const g = Number(grade);
  if (!OVERRIDES[g]) {
    throw new Error('Unknown grade: ' + grade);
  }
  const cfg = Object.assign({}, DEFAULTS, OVERRIDES[g]);
  cfg.grade = g;
  cfg.disabledEntries = cfg.disabledEntries.slice();
  cfg.exportPrefixBel = cfg.exportPrefixBel || cfg.exportPrefix + '-bel';
  cfg.exportPrefixMat = cfg.exportPrefixMat || cfg.exportPrefix + '-mat';
  cfg.title = cfg.exam + ' след ' + g + ' клас';
  cfg.short = cfg.exam + ' ' + g + ' клас';
  return cfg;
}
