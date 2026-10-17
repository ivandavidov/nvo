// Конфигурация по клас — единственият източник за новия фронтенд.
// Стойностите съвпадат 1:1 със старите config-global.js + config-{4,7,10,12}.js.

export const GRADES = [4, 7, 10, 12];

/** Последната година с данни за всеки клас (ДЗИ излиза преди НВО). */
export const LATEST_YEAR_BY_GRADE = { 4: 2026, 7: 2026, 10: 2026, 12: 2026 };

/** Колко последни години показват графиките (прозорецът по подразбиране). */
export const NUM_YEARS_BY_GRADE = { 4: 8, 7: 8, 10: 6, 12: 8 };

/** Най-ранната година за исторически изглед (?year=). */
export const NAV_FIRST_YEAR = 2020;

export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Групите „Топ N“ според броя на училищата в града (старите SCHOOL_THRESHOLD_*). */
export const TOP_GROUPS = {
  thresholdSmall: 4,
  thresholdMedium: 9,
  thresholdLarge: 19,
  thresholdXLarge: 29,
  topSmall: 3,
  topMedium: 5,
  topLarge: 10,
  second: 10
};

const DEFAULTS = {
  firstYear: 2018,
  rankBase: 0,
  rankRangeTop: 25,
  rankRangeBottom: 50,
  fix2018: false,
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
    fix2018: true,
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
  cfg.numYears = NUM_YEARS_BY_GRADE[g];
  cfg.latestYear = LATEST_YEAR_BY_GRADE[g];
  cfg.disabledEntries = cfg.disabledEntries.slice();
  cfg.exportPrefixBel = cfg.exportPrefixBel || cfg.exportPrefix + '-bel';
  cfg.exportPrefixMat = cfg.exportPrefixMat || cfg.exportPrefix + '-mat';
  cfg.title = cfg.exam + ' след ' + g + ' клас';
  cfg.short = cfg.exam + ' ' + g + ' клас';
  return cfg;
}
