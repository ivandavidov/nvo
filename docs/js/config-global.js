const latestYearByGrade = {
  4: 2025,
  7: 2025,
  10: 2025,
  12: 2025
};

const CHART_HEIGHT_PERCENT = 85 / 100;
const CHART_MIN_HEIGHT_PX = 500;
const CHART_EXPORT_WIDTH = 960;
const CHART_EXPORT_HEIGHT = 540;
const CHART_EXPORT_SCALE = 2;
const TABLE_PDF_PAGE_MARGIN_PT = 30;
const TABLE_PDF_TITLE_Y_PT = 28;
const TABLE_PDF_TABLE_START_Y_PT = 40;
const TABLE_PDF_FONT_FILE = 'NotoSans-Regular.ttf';
const TABLE_PDF_FONT_NAME = 'NotoSans';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const RESIZE_REDRAW_DEBOUNCE_MS = 150;
const NAV_FIRST_YEAR = 2020;
const SCHOOL_THRESHOLD_SMALL = 4;
const SCHOOL_THRESHOLD_MEDIUM = 9;
const SCHOOL_THRESHOLD_LARGE = 19;
const SCHOOL_THRESHOLD_XLARGE = 29;
const SCHOOL_TOP_COUNT_SMALL = 3;
const SCHOOL_TOP_COUNT_MEDIUM = 5;
const SCHOOL_TOP_COUNT_LARGE = 10;
const SCHOOL_SECOND_COUNT = 10;

const GRADE_CONFIG_DEFAULTS = {
  firstYear: 2018,
  numYears: 8,
  rankBase: 0,
  rankRangeTop: 25,
  rankRangeBottom: 50,
  fix2018: false,
  tableTitleName: 'Класация на училищата',
  tableTitleType: '',
  cookieName: 'i7',
  exportPrefix: 'nvo-7',
  chartFloor: 0,
  chartCeiling: 100,
  chartNoSchool: 50,
  chartBTitle: '7 клас - НВО - Български език',
  chartMTitle: '7 клас - НВО - Математика',
  csvHeaderBel: 'БЕЛ',
  csvHeaderMat: 'МАТ',
  csvHeaderB: 'Б',
  csvHeaderM: 'М',
  baseSchoolIndex: 167,
  refSchoolIndex: 39,
  disabledEntries: []
}

function applyGradeConfig(overrides) {
  let config = Object.assign({}, GRADE_CONFIG_DEFAULTS, overrides || {})
  if(!config.exportPrefixBel) {
    config.exportPrefixBel = config.exportPrefix + '-bel'
  }
  if(!config.exportPrefixMat) {
    config.exportPrefixMat = config.exportPrefix + '-mat'
  }
  window.firstYear = config.firstYear
  window.numYears = config.numYears
  window.rankBase = config.rankBase
  window.rankRangeTop = config.rankRangeTop
  window.rankRangeBottom = config.rankRangeBottom
  window.fix2018 = config.fix2018
  window.tableTitleName = config.tableTitleName
  window.tableTitleType = config.tableTitleType
  window.cookieName = config.cookieName
  window.exportPrefix = config.exportPrefix
  window.exportPrefixBel = config.exportPrefixBel
  window.exportPrefixMat = config.exportPrefixMat
  window.chartFloor = config.chartFloor
  window.chartCeiling = config.chartCeiling
  window.chartNoSchool = config.chartNoSchool
  window.chartBTitle = config.chartBTitle
  window.chartMTitle = config.chartMTitle
  window.csvHeaderBel = config.csvHeaderBel
  window.csvHeaderMat = config.csvHeaderMat
  window.csvHeaderB = config.csvHeaderB
  window.csvHeaderM = config.csvHeaderM
  window.baseSchoolIndex = config.baseSchoolIndex
  window.refSchoolIndex = config.refSchoolIndex
  window.disabledEntries = config.disabledEntries.slice()
}
