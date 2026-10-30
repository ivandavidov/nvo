// nvo stats - "Обобщена статистика" (/stats/) като текст: 31 анализа в 6 глави, със същите
// изчисления като страницата (stats/compute.js). Редовете по години и класациите са таблици;
// графиките с точки (scatter) - обобщение (корелация, медиани, крайните училища) и --points.

import { fetchGradeData } from '../../core/model.js';
import { gradeConfig, noExamSource, GRADES } from '../../core/config.js';
import { SCHOOL_TYPES } from '../../core/school-types.js';
import * as S from '../../../stats/compute.js';
import { siteUrl } from '../commands/util.js';
import { defineSub, NvoError, GRADE_LABEL, parseGrade, link, PATHS } from './core.js';
import { resolveCity, citySlugs } from './data.js';
import { renderTable, outputMode, printJson, spark } from './format.js';

const CHAPTERS = [
  ['uchastie', 'Участие и национална средна'],
  ['neravenstvo', 'Разпределение и неравенство'],
  ['gradove', 'Градове'],
  ['predmeti', 'Предмети'],
  ['razmer', 'Размер и стабилност'],
  ['trend', 'Тренд и класации'],
];

const f2 = (v) => (typeof v === 'number' ? v.toFixed(2) : v === null || v === undefined ? '-' : String(v));
const f1 = (v) => (typeof v === 'number' ? v.toFixed(1) : '-');
const sign = (v) => (typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) : '-');

const dataCache = new Map();

async function statsData(grade) {
  if (!dataCache.has(grade)) {
    const p = fetchGradeData(grade, siteUrl('data/grade-' + grade + '.json')).then((raw) => S.prepareGradeData(grade, raw));
    p.catch(() => dataCache.delete(grade));
    dataCache.set(grade, p);
  }
  return dataCache.get(grade);
}

/** Годината без изпит в етикета (2020*) и бележката под таблицата. */
function yearMark(grade, year) {
  return noExamSource(grade, Number(year)) ? year + '*' : String(year);
}

function noExamNotes(grade, years) {
  return years.filter((y) => noExamSource(grade, Number(y))).map((y) => y + '*: изпитът не е провеждан - стойностите повтарят ' + noExamSource(grade, Number(y)));
}

function periodNotes(grade, periods) {
  return noExamNotes(grade, Array.from(new Set(periods.flatMap((p) => String(p).split('→')))));
}

/** Таблица по години: колоните са серии; --spark добавя ред с мини-тенденцията на всяка серия. */
function yearTable(ctx, a, { labels, rows, series, notes = [], fmt = f2 }) {
  const extra = ctx.opts.spark ? series.map(([label, values]) => label + ' ' + spark(values.map((v) => (typeof v === 'number' ? v : null)))) : [];
  renderTable(ctx, {
    mode: ctx.mode,
    wide: ctx.wide,
    title: a.heading,
    rows,
    notes: notes.concat(extra.length ? [extra.join('   ')] : []),
    columns: [
      { key: 'year', label: labels[0], get: (r) => r.label },
      ...series.map(([label], k) => ({ key: 's' + k, label, align: 'right', get: (r) => r.values[k], text: (v) => fmt(v) })),
    ],
  });
}

function seriesRows(labels, seriesValues) {
  return labels.map((label, i) => ({ label, values: seriesValues.map((s) => s[i]) }));
}

/** Списък (училища или градове) с номер. */
function listTable(ctx, title, rows, columns, notes = []) {
  renderTable(ctx, {
    mode: ctx.mode,
    wide: ctx.wide,
    title,
    rows: rows.map((r, i) => ({ ...r, _n: i + 1 })),
    notes,
    columns: [{ key: 'n', label: '№', align: 'right', get: (r) => r._n }, ...columns],
  });
}

const nameCol = { key: 'name', label: 'Училище', get: (r) => r.name, flex: true };

function median(vals) {
  const v = vals.slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function pearson(pts) {
  const n = pts.length;
  if (n < 3) return null;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

/** Графика с точки като текст: брой, корелация, медиани, по квадранти, крайните по Y. --points - всички. */
function scatter(ctx, a, pts, { x, y, top = 'Най-високи', bottom = 'Най-ниски', fx = f2, fy = f2 }) {
  if (ctx.mode !== 'table' || ctx.opts.points) {
    renderTable(ctx, {
      mode: ctx.mode === 'table' ? 'table' : ctx.mode,
      wide: ctx.wide,
      title: a.heading + ' - ' + pts.length + ' точки',
      rows: pts.slice().sort((p, q) => q.y - p.y),
      columns: [nameCol, { key: 'x', label: x, align: 'right', get: (p) => p.x, text: fx }, { key: 'y', label: y, align: 'right', get: (p) => p.y, text: fy }],
    });
    return;
  }
  const c = ctx.c;
  const mx = median(pts.map((p) => p.x));
  const my = median(pts.map((p) => p.y));
  const r = pearson(pts);
  const q = [0, 0, 0, 0];
  for (const p of pts) q[(p.x >= mx ? 0 : 1) + (p.y >= my ? 0 : 2)]++;
  let out = c.bold(a.heading) + '\n';
  out += '  Училища: ' + pts.length + (r === null ? '' : '   Корелация r = ' + r.toFixed(2) + ' (' + strength(r) + ')') + '\n';
  out += '  Медиана: ' + x + ' ' + fx(mx) + ', ' + y + ' ' + fy(my) + '\n';
  out += '  По медианите: ' + x + ' ≥ и ' + y + ' ≥: ' + q[0] + ' · ' + x + ' < и ' + y + ' ≥: ' + q[1] + ' · ' + x + ' ≥ и ' + y + ' <: ' + q[2] + ' · ' + x + ' < и ' + y + ' <: ' + q[3] + '\n';
  ctx.out(out);
  const sorted = pts.slice().sort((p, q2) => q2.y - p.y);
  const cols = [nameCol, { key: 'x', label: x, align: 'right', get: (p) => p.x, text: fx }, { key: 'y', label: y, align: 'right', get: (p) => p.y, text: fy }];
  renderTable(ctx, { wide: ctx.wide, title: '\n' + top + ' по "' + y + '"', rows: sorted.slice(0, 5), columns: cols });
  renderTable(ctx, { wide: ctx.wide, title: '\n' + bottom + ' по "' + y + '"', rows: sorted.slice(-5).reverse(), columns: cols, notes: ['--points - всички ' + pts.length + ' училища (с | sort, grep)'] });
}

function strength(r) {
  const a = Math.abs(r);
  const s = a >= 0.7 ? 'силна' : a >= 0.4 ? 'умерена' : a >= 0.2 ? 'слаба' : 'почти няма';
  return s + (a >= 0.2 ? (r > 0 ? ', положителна' : ', отрицателна') : '');
}

function bars(ctx, a, categories, values, label) {
  const max = Math.max(...values, 1);
  renderTable(ctx, {
    mode: ctx.mode,
    wide: ctx.wide,
    title: a.heading,
    rows: categories.map((cat, i) => ({ cat, v: values[i] })),
    columns: [
      { key: 'range', label, get: (r) => r.cat },
      { key: 'count', label: 'Брой', align: 'right', get: (r) => r.v },
      ...(ctx.opts.spark ? [{ key: 'bar', label: '', get: (r) => '█'.repeat(Math.round((r.v / max) * 30)), drop: 9 }] : []),
    ],
  });
}

const ANALYSES = [
  {
    key: 'participation', chapter: 'uchastie', title: 'Брой участващи училища и ученици по години',
    note: 'Колко училища и колко ученици са в данните за всяка година.',
    compute: S.computeParticipation,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), [r.schoolCount, r.belStudents, r.matStudents]), series: [['Училища', r.schoolCount], ['Ученици ' + ctx.cfg.subjectB, r.belStudents], ['Ученици ' + ctx.cfg.subjectM, r.matStudents]], fmt: (v) => (v === null || v === undefined ? '-' : String(v)), notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'national', chapter: 'uchastie', title: 'Национална средна по години',
    note: 'Средният резултат в страната (претеглен с броя на учениците) за всяка година.',
    compute: S.computeNationalAverage,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), [r.bel, r.mat]), series: [[ctx.cfg.subjectB, r.bel], [ctx.cfg.subjectM, r.mat]], notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'smoothed-trend', chapter: 'uchastie', title: 'Национален тренд с изглаждане',
    note: 'Националната средна и плъзгащата средна за 3 години.',
    compute: S.computeSmoothedNationalTrend,
    show(ctx, a, r, d) {
      const b = ctx.cfg.subjectB;
      const m = ctx.cfg.subjectM;
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), [r.belRaw, r.belSmooth, r.matRaw, r.matSmooth]), series: [[b, r.belRaw], [b + ' (3 г.)', r.belSmooth], [m, r.matRaw], [m + ' (3 г.)', r.matSmooth]], notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'yoy', chapter: 'uchastie', title: 'Промяна на националната средна по години',
    note: 'С колко точки се е променила средната за страната спрямо предходната година.',
    compute: S.computeYearOverYear,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Период'], rows: seriesRows(r.years, [r.bel, r.mat]), series: [['Δ ' + ctx.cfg.subjectB, r.bel], ['Δ ' + ctx.cfg.subjectM, r.mat]], fmt: sign, notes: periodNotes(d.grade, r.years) });
    },
  },
  {
    key: 'improvement-rate', chapter: 'uchastie', title: 'Дял на подобряващите се по години',
    note: 'Процентът училища, които са подобрили, запазили или влошили резултата си спрямо предходната година.',
    compute: S.computeImprovementRate,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Период'], rows: seriesRows(r.years, [r.improved, r.stable, r.declined]), series: [['Подобрили %', r.improved], ['Без промяна %', r.stable], ['Влошили %', r.declined]], fmt: f1, notes: periodNotes(d.grade, r.years) });
    },
  },
  {
    key: 'percentile', chapter: 'neravenstvo', title: 'Перцентилен разрез по години',
    note: 'Границите P10, P25, P50 (медиана), P75 и P90 на резултатите на училищата ((БЕЛ + МАТ) / 2).',
    compute: S.computePercentileFan,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), [r.p10, r.p25, r.p50, r.p75, r.p90]), series: [['P10', r.p10], ['P25', r.p25], ['P50', r.p50], ['P75', r.p75], ['P90', r.p90]], notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'inequality', chapter: 'neravenstvo', title: 'Разлика в резултатите между училищата по години',
    note: 'Стандартното отклонение на резултатите на училищата - колкото по-високо, толкова по-голямо разслоение.',
    compute: S.computeInequalityTrend,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), [r.values]), series: [['σ', r.values]], notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'distribution', chapter: 'neravenstvo', title: 'Разпределение на резултатите',
    note: 'Колко резултата (училище × година × предмет) попадат във всеки интервал.',
    compute: S.computeDistribution,
    show(ctx, a, r) {
      bars(ctx, a, r.categories, r.values, 'Интервал');
    },
  },
  {
    key: 'size-distribution', chapter: 'neravenstvo', title: 'Разпределение на размера на училищата',
    note: 'Колко училища имат средно толкова ученици на изпита.',
    compute: S.computeSizeDistribution,
    show(ctx, a, r) {
      bars(ctx, a, r.categories, r.values, 'Ученици');
    },
  },
  {
    key: 'pubpriv', chapter: 'neravenstvo', title: 'Държавни, общински, частни и духовни училища',
    note: 'Средният резултат на учениците от всеки вид училище (претеглен с броя им) за всяка година.',
    compute: S.computeByType,
    show(ctx, a, r, d) {
      const types = SCHOOL_TYPES.filter((t) => r.byType[t.key].some((v) => v !== null));
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), types.map((t) => r.byType[t.key])), series: types.map((t) => [t.plural, r.byType[t.key]]), notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'city-rank', chapter: 'gradove', title: 'Класация по градове', all: true,
    note: 'Средният резултат на училищата в града (претеглен с учениците) за целия период.',
    compute: S.computeCityRankings,
    show(ctx, a, r) {
      listTable(ctx, a.heading, ctx.limit(r), [{ key: 'city', label: 'Град', get: (x) => x.city, flex: true }, { key: 'avg', label: 'Средно', align: 'right', get: (x) => x.avg, text: f2 }]);
    },
  },
  {
    key: 'city-inequality-index', chapter: 'gradove', title: 'Разлика в резултатите между училищата в един град', all: true,
    note: 'P90 - P10 на средните резултати на училищата в града (градовете с поне 5 училища).',
    compute: S.computeCityInequalityIndex,
    show(ctx, a, r) {
      listTable(ctx, a.heading, ctx.limit(r), [{ key: 'city', label: 'Град', get: (x) => x.city, flex: true }, { key: 'spread', label: 'P90 - P10', align: 'right', get: (x) => x.spread, text: f2 }]);
    },
  },
  {
    key: 'city-convergence', chapter: 'gradove', title: 'Сближаване или раздалечаване между градовете', all: true,
    note: 'Разликата между най-силния и най-слабия град (и P90 - P10 на градовете) за всяка година.',
    compute: S.computeCityConvergence,
    show(ctx, a, r, d) {
      yearTable(ctx, a, { labels: ['Година'], rows: seriesRows(r.years.map((y) => yearMark(d.grade, y)), [r.spread, r.p90p10]), series: [['Макс - мин', r.spread], ['P90 - P10', r.p90p10]], notes: noExamNotes(d.grade, r.years) });
    },
  },
  {
    key: 'city-concentration', chapter: 'gradove', title: 'Географска концентрация на топ училищата', all: true,
    note: 'В кои градове са 15-те училища с най-висок среден резултат.',
    compute: S.computeTopCityConcentration,
    show(ctx, a, r) {
      listTable(ctx, a.heading, r, [{ key: 'city', label: 'Град', get: (x) => x.city, flex: true }, { key: 'count', label: 'В топ ' + S.TABLE_ROWS, align: 'right', get: (x) => x.count }]);
    },
  },
  {
    key: 'bel-mat', chapter: 'predmeti', title: 'БЕЛ спрямо МАТ', dziTitle: 'Зрелостен изпит по БЕЛ спрямо ДЗИ-2',
    note: 'Всяко училище със средния си резултат по двата предмета.',
    compute: S.computeBelMatScatter,
    show(ctx, a, r) {
      scatter(ctx, a, r, { x: ctx.cfg.subjectB, y: ctx.cfg.subjectM });
    },
  },
  {
    key: 'bel-mat-gap', chapter: 'predmeti', title: 'Най-голяма разлика между двата предмета', dziTitle: 'Най-голяма разлика между двата зрелостни изпита',
    note: 'Училищата с най-голяма разлика между двата предмета - с превес на първия и с превес на втория.',
    compute: S.computeBelMatGap,
    show(ctx, a, r) {
      // Като таблиците на страницата: първо по-силният предмет, после другият и разликата с "+".
      const b = { key: 'b', label: ctx.cfg.subjectB, align: 'right', get: (x) => x.b, text: f2 };
      const m = { key: 'm', label: ctx.cfg.subjectM, align: 'right', get: (x) => x.m, text: f2 };
      const gap = (k) => ({ key: 'gap', label: 'Δ', align: 'right', get: (x) => k * x.gap, text: (v) => '+' + v.toFixed(2) });
      listTable(ctx, a.heading + ' - ' + ctx.cfg.subjectB + ' > ' + ctx.cfg.subjectM, r.belLeads, [nameCol, b, m, gap(1)]);
      ctx.out('\n');
      listTable(ctx, ctx.cfg.subjectM + ' > ' + ctx.cfg.subjectB, r.matLeads, [nameCol, m, b, gap(-1)]);
    },
  },
  {
    key: 'profile-stability', chapter: 'predmeti', title: 'Стабилност на предметния профил (БЕЛ-МАТ)', dziTitle: 'Стабилност на профила (БЕЛ спрямо ДЗИ-2)',
    note: 'Средната разлика БЕЛ - МАТ на училището (X) и колко се мени от година на година (Y, стандартно отклонение).',
    compute: S.computeSubjectProfileStability,
    show(ctx, a, r) {
      scatter(ctx, a, r, { x: 'Разлика', y: 'σ на разликата', top: 'Най-променлив профил', bottom: 'Най-устойчив профил' });
    },
  },
  {
    key: 'size', chapter: 'razmer', title: 'Размер на училището спрямо резултат',
    note: 'Средният брой ученици (X) и средният резултат (Y) на всяко училище.',
    compute: S.computeSizeScatter,
    show(ctx, a, r) {
      scatter(ctx, a, r, { x: 'Ученици', y: 'Резултат', fx: (v) => String(Math.round(v)) });
    },
  },
  {
    key: 'stability-size', chapter: 'razmer', title: 'Стабилност спрямо размер на училището',
    note: 'Средният брой ученици (X) и колебанието на резултатите за последните 5 години (Y, σ).',
    compute: S.computeStabilityVsSize,
    show(ctx, a, r) {
      scatter(ctx, a, r, { x: 'Ученици', y: 'σ', top: 'Най-променливи', bottom: 'Най-стабилни', fx: (v) => String(Math.round(v)) });
    },
  },
  {
    key: 'confidence-size', chapter: 'razmer', title: 'Доверителност на резултата спрямо размер',
    note: 'Средният брой ученици (X) и половината от 95% доверителния интервал на резултата (Y) - колкото по-малък, толкова по-сигурен.',
    compute: S.computeConfidenceVsSize,
    show(ctx, a, r) {
      scatter(ctx, a, r, { x: 'Ученици', y: '±95%', top: 'Най-несигурни', bottom: 'Най-сигурни', fx: (v) => String(Math.round(v)) });
    },
  },
  {
    key: 'stable', chapter: 'razmer', title: 'Най-стабилни училища',
    note: 'Училищата с най-малко колебание на резултатите за последните 5 години.',
    compute: S.computeStable,
    show(ctx, a, r) {
      listTable(ctx, a.heading, r, [nameCol, { key: 'avg', label: 'Средна', align: 'right', get: (x) => x.avg, text: f2 }, { key: 'std', label: 'σ', align: 'right', get: (x) => x.std, text: f2 }]);
    },
  },
  {
    key: 'rank-stability', chapter: 'razmer', title: 'Стабилност в класацията по години',
    note: 'Средното място на училището в страната (X) и колко се мени от година на година (Y, σ).',
    compute: S.computeRankStability,
    show(ctx, a, r) {
      scatter(ctx, a, r, { x: 'Средно място', y: 'σ на мястото', top: 'Най-променливо място', bottom: 'Най-стабилно място' });
    },
  },
  {
    key: 'quadrant', chapter: 'trend', title: 'Квадрантен анализ: ниво срещу тренд',
    note: 'Средният резултат спрямо медианата и промяната за последните 5 години: шампиони, изгряващи, в упадък, проблемни.',
    compute: S.computeQuadrantScatter,
    show(ctx, a, r) {
      const groups = [['Шампиони', r.champions, 'над медианата и се подобряват'], ['Изгряващи', r.rising, 'под медианата, но се подобряват'], ['В упадък', r.declining, 'над медианата, но се влошават'], ['Проблемни', r.struggling, 'под медианата и се влошават']];
      if (ctx.mode !== 'table' || ctx.opts.points) {
        const rows = groups.flatMap(([g, pts]) => pts.map((p) => ({ group: g, ...p })));
        renderTable(ctx, { mode: ctx.mode, wide: ctx.wide, title: a.heading, rows, columns: [{ key: 'group', label: 'Група', get: (p) => p.group }, nameCol, { key: 'x', label: 'Средна', align: 'right', get: (p) => p.x, text: f2 }, { key: 'y', label: 'Промяна', align: 'right', get: (p) => p.y, text: sign }] });
        return;
      }
      ctx.out(ctx.c.bold(a.heading) + '\n  Медиана на средния резултат: ' + f2(r.medianAvg) + '\n' + groups.map(([g, pts, d]) => '  ' + g.padEnd(10) + String(pts.length).padStart(5) + '  ' + ctx.c.muted(d)).join('\n') + '\n');
      for (const [g, pts] of groups) {
        const sorted = pts.slice().sort((p, q) => Math.abs(q.y) - Math.abs(p.y)).slice(0, 5);
        if (sorted.length) renderTable(ctx, { wide: ctx.wide, title: '\n' + g + ' - с най-голяма промяна', rows: sorted, columns: [nameCol, { key: 'x', label: 'Средна', align: 'right', get: (p) => p.x, text: f2 }, { key: 'y', label: 'Промяна', align: 'right', get: (p) => p.y, text: sign }] });
      }
      ctx.out(ctx.c.muted('--points - всички училища с групата им') + '\n');
    },
  },
  {
    key: 'quadrant-migration', chapter: 'trend', title: 'Миграция между квадранти',
    note: 'Колко училища са сменили групата си (от горния анализ) от една година към следващата.',
    compute: S.computeQuadrantMigration,
    show(ctx, a, r) {
      let all = 0;
      let same = 0;
      r.matrix.forEach((row, i) => row.forEach((v, j) => {
        all += v;
        if (i === j) same += v;
      }));
      const rows = r.matrix.map((row, i) => ({ from: r.quadrantNames[i], row, total: row.reduce((x, y) => x + y, 0) }));
      renderTable(ctx, {
        mode: ctx.mode, wide: ctx.wide,
        title: a.heading,
        rows,
        notes: [all ? 'Общо преходи: ' + all + '. Останали в същата група: ' + same + ' (' + (+(same / all * 100).toFixed(1)) + '%).' : 'Няма достатъчно данни за преходи между групите.'],
        columns: [
          { key: 'from', label: 'От \\ Към', get: (x) => x.from },
          ...r.quadrantNames.map((n, j) => ({ key: 'to' + j, label: n, align: 'right', get: (x) => x.row[j], text: (v, x) => v + ' (' + (x.total ? (v / x.total * 100).toFixed(1) : '0.0') + '%)' })),
          { key: 'total', label: 'Общо', align: 'right', get: (x) => x.total },
        ],
      });
    },
  },
  {
    key: 'trend', chapter: 'trend', title: 'Напредък и спад',
    note: 'Най-голямо подобрение и най-голям спад: резултатът в началото и в края на последните 5 години.',
    compute: S.computeTrend,
    show(ctx, a, r) {
      const cols = [nameCol, { key: 'first', label: 'Начало', align: 'right', get: (x) => x.first, text: f2 }, { key: 'last', label: 'Край', align: 'right', get: (x) => x.last, text: f2 }, { key: 'change', label: 'Δ', align: 'right', get: (x) => x.change, text: sign, color: (t) => (t.startsWith('+') ? ctx.c.green(t) : t.startsWith('-') ? ctx.c.red(t) : t) }];
      listTable(ctx, a.heading + ' - най-голямо подобрение', r.improved, cols);
      ctx.out('\n');
      listTable(ctx, 'Най-голям спад', r.declined, cols);
    },
  },
  {
    key: 'consistent', chapter: 'trend', title: 'Последователно подобряващи се училища',
    note: 'Училища, подобрявали резултата си всяка година (поне 4 години, без спад).',
    compute: S.computeConsistentlyImproving,
    show(ctx, a, r) {
      listTable(ctx, a.heading, r, [nameCol, { key: 'first', label: 'Начало', align: 'right', get: (x) => x.first, text: f2 }, { key: 'last', label: 'Край', align: 'right', get: (x) => x.last, text: f2 }, { key: 'change', label: 'Δ', align: 'right', get: (x) => x.change, text: (v) => '+' + f2(v) }, { key: 'count', label: 'Год.', align: 'right', get: (x) => x.count }]);
    },
  },
  {
    key: 'top', chapter: 'trend', title: 'Топ 15 по средна оценка',
    note: '15-те училища с най-висок среден резултат (двата предмета заедно) за целия период.',
    compute: S.computeTopSchools,
    show(ctx, a, r) {
      listTable(ctx, a.heading, r, [nameCol, { key: 'b', label: ctx.cfg.subjectB, align: 'right', get: (x) => x.b, text: f2 }, { key: 'm', label: ctx.cfg.subjectM, align: 'right', get: (x) => x.m, text: f2 }, { key: 'avg', label: 'Средна', align: 'right', get: (x) => x.avg, text: f2 }]);
    },
  },
  {
    key: 'large-schools', chapter: 'trend', title: 'Топ 15 сред по-достъпните училища',
    note: 'Като горната класация, но само училищата с поне медианния брой ученици.',
    compute: S.computeTopLargeSchools,
    show(ctx, a, r) {
      listTable(ctx, a.heading, r, [nameCol, { key: 'b', label: ctx.cfg.subjectB, align: 'right', get: (x) => x.b, text: f2 }, { key: 'm', label: ctx.cfg.subjectM, align: 'right', get: (x) => x.m, text: f2 }, { key: 'avg', label: 'Средна', align: 'right', get: (x) => x.avg, text: f2 }, { key: 'size', label: 'Ученици', align: 'right', get: (x) => x.size }]);
    },
  },
  {
    key: 'delta-benchmark', chapter: 'trend', title: 'Разлика спрямо национална и градска средна',
    note: 'С колко средният резултат на училището е над или под средната за страната и за града му.',
    compute: S.computeDeltaFromBenchmarks,
    show(ctx, a, r) {
      const cols = [nameCol, { key: 'avg', label: 'Средна', align: 'right', get: (x) => x.schoolAvg, text: f2 }, { key: 'nat', label: 'Δ нац.', align: 'right', get: (x) => x.deltaNational, text: sign }, { key: 'city', label: 'Δ град', align: 'right', get: (x) => x.deltaCity, text: (v) => (v === null ? '-' : sign(v)) }];
      listTable(ctx, a.heading + ' - най-много над средната', r.over, cols);
      ctx.out('\n');
      listTable(ctx, 'Най-много под средната', r.under, cols);
    },
  },
  {
    key: 'persistent-deciles', chapter: 'trend', title: 'Трайно в топ 10% или в дъното 10%',
    note: 'Колко години училището е било в горните или в долните 10% от училищата.',
    compute: S.computePersistentDeciles,
    show(ctx, a, r) {
      const cols = (label) => [nameCol, { key: 'count', label, align: 'right', get: (x) => x.count }, { key: 'seen', label: 'Години', align: 'right', get: (x) => x.seen }, { key: 'ratio', label: '%', align: 'right', get: (x) => x.ratio, text: (v) => v.toFixed(1) + '%' }];
      listTable(ctx, a.heading + ' - топ 10%', r.top, cols('Топ 10%'));
      ctx.out('\n');
      listTable(ctx, 'Дъното 10%', r.bottom, cols('Дъно 10%'));
    },
  },
  {
    key: 'composite', chapter: 'trend', title: 'Обща оценка: ниво + стабилност + тренд',
    note: 'Индекс 0-100: средният резултат (50%), стабилността (25%) и тенденцията (25%), нормализирани.',
    compute: S.computeCompositeScore,
    show(ctx, a, r) {
      listTable(ctx, a.heading, r, [nameCol, { key: 'score', label: 'Индекс', align: 'right', get: (x) => x.score, text: f2 }, { key: 'level', label: 'Ниво', align: 'right', get: (x) => x.level, text: f2 }, { key: 'stability', label: 'σ', align: 'right', get: (x) => x.stability, text: f2 }, { key: 'trend', label: 'Тренд', align: 'right', get: (x) => x.trend, text: sign }]);
    },
  },
];

export const STATS_KEYS = ANALYSES.map((a) => a.key);

function listAnalyses(ctx, grade) {
  const c = ctx.c;
  let out = c.bold('Обобщена статистика - 31 анализа') + (grade ? c.muted(' - ' + GRADE_LABEL[grade]) : '') + '\n';
  for (const [key, title] of CHAPTERS) {
    out += '\n' + c.bold(title) + c.muted(' (' + key + ')') + '\n';
    for (const a of ANALYSES.filter((x) => x.chapter === key)) {
      out += '  ' + c.cyan(a.key.padEnd(22)) + ' ' + (grade === 12 && a.dziTitle ? a.dziTitle : a.title) + (a.all ? c.muted(' (всички градове)') : '') + '\n';
    }
  }
  out += '\n' + c.muted('nvo stats КЛАС АНАЛИЗ [-c ГРАД] - един анализ; nvo stats КЛАС ГЛАВА - цялата глава; --all - всичките') + '\n';
  ctx.out(out);
}

defineSub({
  name: 'stats',
  aliases: ['statistics'],
  summary: 'обобщената статистика: 31 анализа (тенденции, градове, стабилност, топ училища)',
  usage: 'nvo stats [КЛАС] [АНАЛИЗ|ГЛАВА...] [-c ГРАД] [--all] [--points] [-n N]',
  description: 'Същите изчисления като страницата /stats/ (прозорецът с години на сайта). Без анализ - списъкът; с име на глава - всички анализи в нея; --all - всичките 31.\nРедовете по години и класациите са таблици. Анализите с точки (scatter) дават брой, корелация, медиани и крайните училища; --points - всички точки.\n-c ГРАД ограничава анализите до един град (без 4-те анализа за градовете, които сравняват всички).',
  options: [['-c ГРАД', 'само училищата в града'], ['--all', 'всички анализи (в less)'], ['--points', 'при scatter: всички училища със стойностите им'], ['-n N', 'при класациите на градове: най-много N'], ['--spark', 'мини-тенденции и ленти']],
  examples: [['nvo stats', 'списъкът'], ['nvo stats 7 national --spark', ''], ['nvo stats 12 top -c sofia', ''], ['nvo stats 7 gradove', 'цялата глава'], ['nvo stats 4 bel-mat --points | head', ''], ['nvo stats 7 --all | less', '']],
  opts: { short: 'c:', long: ['all', 'points', 'list'] },
  positional: ['grade', 'analysis', 'analysis', 'analysis'],
  async run(ctx, opts, rest) {
    const grade = rest.length && /^\d+$/.test(rest[0]) ? parseGrade(rest.shift()) : null;
    if (!grade || (!rest.length && !opts.all) || opts.list) {
      listAnalyses(ctx, grade);
      return 0;
    }
    const chosen = opts.all ? ANALYSES.slice() : [];
    for (const name of rest) {
      let list = ANALYSES.filter((a) => a.key === name);
      if (!list.length) list = ANALYSES.filter((a) => a.chapter === name);
      if (!list.length) list = ANALYSES.filter((a) => a.key.startsWith(name));
      if (!list.length) throw new NvoError("няма анализ '" + name + "' (nvo stats изрежда анализите)", 2);
      if (list.length > 1 && !CHAPTERS.some(([k]) => k === name)) throw new NvoError("'" + name + "' съвпада с: " + list.map((a) => a.key).join(', '), 2);
      for (const a of list) if (!chosen.includes(a)) chosen.push(a);
    }
    const data = await statsData(grade);
    let cityName = null;
    if (opts.c) {
      const city = await resolveCity(opts.c);
      cityName = Object.keys(data.si).find((k) => data.si[k] && data.si[k].h === city.slug);
      if (!cityName) throw new NvoError('няма данни за ' + GRADE_LABEL[grade] + ' в ' + city.name);
    }
    const mode = outputMode(opts);
    const sctx = Object.create(ctx);
    Object.assign(sctx, {
      opts, mode, wide: opts.wide || opts.w, cfg: gradeConfig(grade),
      limit: (rows) => (opts.n ? rows.slice(0, Number(opts.n)) : rows),
    });
    // --all в терминала: всичко в less (иначе екранът превърта стотици редове).
    let buffer = null;
    if (opts.all && ctx.isTTY && mode === 'table') {
      buffer = [];
      sctx.out = (s) => buffer.push(s);
    }
    const json = {};
    let first = true;
    for (const a of chosen) {
      const filtered = cityName && !a.all;
      const d = filtered ? S.filterDataByCity(data, cityName) : data;
      const result = a.compute(d);
      if (mode === 'json') {
        json[a.key] = result;
        continue;
      }
      const title = grade === 12 && a.dziTitle ? a.dziTitle : a.title;
      a.heading = GRADE_LABEL[grade] + ' - ' + title + (filtered ? ' - ' + cityName : cityName && a.all ? ' - всички градове' : '');
      if (!first) sctx.out('\n' + (ctx.isTTY ? sctx.c.muted('-'.repeat(Math.min(60, Number.isFinite(ctx.cols) ? ctx.cols : 60))) + '\n' : '') + '\n');
      first = false;
      if (ctx.isTTY && mode === 'table') sctx.out(sctx.c.muted(a.note) + '\n');
      a.show(sctx, a, result, d);
    }
    if (mode === 'json') {
      printJson(ctx, chosen.length === 1 ? json[chosen[0].key] : json);
      return 0;
    }
    const url = link(PATHS.stats(grade));
    if (buffer) {
      buffer.push('\n' + url + '\n');
      await ctx.term.pager(buffer.join(''), { title: 'nvo stats ' + grade });
    } else if (ctx.isTTY) {
      ctx.out(ctx.c.muted(url) + '\n');
    }
    return 0;
  },
  complete: async ({ word, prev, pos }) => {
    if (prev === '-c') return citySlugs(word);
    if (pos === 0) return GRADES.map(String);
    return [...CHAPTERS.map(([k, t]) => ({ value: k, desc: 'глава: ' + t })), ...ANALYSES.map((a) => ({ value: a.key, desc: a.title }))];
  },
});

