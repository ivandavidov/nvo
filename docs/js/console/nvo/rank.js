// nvo rank, avg, compare - класациите, средните резултати и сравнението (данните от графиката).

import { gradeConfig, noExamSource, GRADES } from '../../core/config.js';
import { cityRanking, sortRanking, cityInactiveSchools, cityAverages, nationalAverages, chartSeries, findSchoolIndexByCode, findCityForSchool, defaultSortDir } from '../../core/model.js';
import { SCHOOL_TYPES, schoolType, typeKeyFromApi, joinTypes, sortTypes } from '../../core/school-types.js';
import { defineSub, NvoError, GRADE_LABEL, parseGrade, parseYear, parseTypes, link, PATHS } from './core.js';
import { gradeModel, resolveCity, modelCity, resolveSchool, yearRanking, medianRanking, apiIndex, searchIndex, citySlugs, schoolCodes, rawScores } from './data.js';
import { renderTable, outputMode, score, spark, printJson } from './format.js';

const SORT_ALIASES = {
  rank: 'rank', ранг: 'rank', name: 'name', име: 'name', type: 'type', вид: 'type',
  bel: 'y0b', b: 'y0b', бел: 'y0b', mat: 'y0m', m: 'y0m', мат: 'y0m',
  bel1: 'y1b', mat1: 'y1m', bel2: 'y2b', mat2: 'y2m',
  y0b: 'y0b', y0m: 'y0m', y1b: 'y1b', y1m: 'y1m', y2b: 'y2b', y2m: 'y2m',
};

const yy = (year) => String(year).slice(2);

async function cityRankingTable(ctx, opts, g, cityArg) {
  const year = opts.y ? parseYear(opts.y) : null;
  const model = await gradeModel(g, year);
  const city = modelCity(model, await resolveCity(cityArg));
  const types = parseTypes(opts.t);
  const cfg = model.cfg;
  const sortKey = opts.s ? SORT_ALIASES[String(opts.s).toLowerCase()] : 'rank';
  if (!sortKey) throw new NvoError("непозната колона '" + opts.s + "' - rank, name, type, bel, mat, bel1, mat1, bel2, mat2", 2);
  const dir = opts.asc ? 'asc' : opts.desc ? 'desc' : defaultSortDir(sortKey);
  const all = cityRanking(model, city);
  let rows = sortRanking(model, all, sortKey, dir, types).map((r, k) => ({ ...r, position: k + 1 }));
  const shownTotal = rows.length;
  if (opts.all) {
    rows = rows.concat(cityInactiveSchools(model, city).filter((r) => !types || types.includes(r.type)).map((r) => ({ ...r, inactive: true, years: [] })));
  }
  if (opts.n) rows = rows.slice(0, Number(opts.n));
  const years = all.length ? all[0].years.map((y) => y.year) : [model.latestYear, model.latestYear - 1, model.latestYear - 2];
  const o = (r) => model.s[r.i];
  const withStudents = opts.u || opts.students;
  const columns = [
    { key: 'position', label: '№', align: 'right', get: (r) => (r.inactive ? null : r.position) },
    { key: 'name', label: 'Училище', get: (r) => o(r).l, flex: true, color: (t, r) => (r.inactive ? ctx.c.muted(t) : t) },
    { key: 'rank', label: 'Ранг', align: 'right', get: (r) => (r.inactive ? null : r.rank), text: (v) => (v === null || v === undefined ? '' : v.toFixed(2)) },
    { key: 'type', label: 'Тип', get: (r) => schoolType(r.type).letter + (r.inactive ? '' : ' ' + r.typeNo), drop: 1 },
  ];
  years.forEach((year, k) => {
    const mark = noExamSource(g, year) ? '*' : '';
    for (const [subj, label, studentsKey] of [['b', cfg.subjectB, 'bu'], ['m', cfg.subjectM, 'mu']]) {
      columns.push({
        key: (subj === 'b' ? 'bel' : 'mat') + year,
        label: label + ' ' + yy(year) + mark,
        align: 'right',
        get: (r) => (r.years[k] ? r.years[k][subj] : null),
        text: (v, r) => (v ? score(v) + (withStudents && r.years[k][studentsKey] ? '/' + r.years[k][studentsKey] : '') : ''),
        drop: k ? 10 - k * 2 + (subj === 'm' ? 1 : 0) : 0,
      });
    }
  });
  if (opts.spark) {
    columns.push({
      key: 'trend', label: 'Тенденция', get: (r) => {
        const s = o(r);
        return spark(s.b.map((b, k) => (b && s.m[k] && !noExamSource(g, model.firstYear + k) ? (b + s.m[k]) / 2 : null)));
      }, drop: 20,
    });
  }
  const notes = [];
  if (model.timeTravelYear) notes.push('Исторически изглед: класацията към ' + model.latestYear + ' г. (последните данни са за ' + model.dataLatestYear + ')');
  years.forEach((year) => {
    const src = noExamSource(g, year);
    if (src) notes.push(year + '*: изпитът не е провеждан - в данните се повтаря ' + src);
  });
  notes.push('Ранг: средният резултат за 3 години като % от първото показано училище. Тип: Д, О, Ч, ДУ и мястото сред същия вид.');
  notes.push(link(model.timeTravelYear ? PATHS.history(g, model.latestYear, city.slug) : PATHS.city(g, city.slug)));
  renderTable(ctx, {
    mode: outputMode(opts),
    wide: opts.wide || opts.w,
    title: GRADE_LABEL[g] + ' - ' + model.latestYear + ' - ' + city.name + (types ? ' - ' + joinTypes(types) : '') + ' - класация (' + shownTotal + ' училища с резултат)',
    rows,
    columns,
    notes,
    json: (list) => list.map((r) => ({
      position: r.inactive ? null : r.position, code: o(r).c, name: o(r).l, fullName: o(r).n,
      financing: schoolType(r.type).api, typeNo: r.inactive ? null : r.typeNo,
      rank: r.inactive ? null : r.rank, average3y: r.inactive ? null : Number(r.avg.toFixed(4)),
      years: r.years.map((y) => ({ year: y.year, bel: y.b, belStudents: y.bu, mat: y.m, matStudents: y.mu })),
      url: link(PATHS.school(o(r).c)),
    })),
  });
  return 0;
}

async function nationalRankingTable(ctx, opts, g) {
  const index = await apiIndex();
  const info = index.grades.find((x) => x.grade === g);
  const latest = info.yearsRange[info.yearsRange.length - 1];
  const year = opts.y ? parseYear(opts.y) : latest;
  const median = !!opts.median;
  let data;
  try {
    data = median ? await medianRanking(g, year) : await yearRanking(g, year);
  } catch {
    throw new NvoError('няма ' + (median ? 'медианна ' : '') + 'класация за ' + GRADE_LABEL[g] + ' - ' + year + ' (години: ' + (median ? info.yearsRange.filter((y) => y >= 2020) : info.yearsRange).join(', ') + ')');
  }
  const cfg = gradeConfig(g);
  const sindex = await searchIndex();
  const cityName = Object.fromEntries(sindex.cities.map((c) => [c.slug, c.name]));
  const city = opts.c ? await resolveCity(opts.c) : null;
  const types = parseTypes(opts.t);
  const raw = median ? null : await rawScores(g);
  let rows = data.schools.map((e) => {
    const r = raw ? raw(e.code, year) : null;
    // Показваните стойности са от суровите данни - като страниците (при ДЗИ API-то е закръглено).
    return { ...e, type: typeKeyFromApi(e.financing, e.isPrivate), bel: r ? r.b : median ? e.belMedian : e.belScore, mat: r ? r.m : median ? e.matMedian : e.matScore };
  });
  if (city) rows = rows.filter((e) => (e.cities || []).includes(city.slug));
  if (types) rows = rows.filter((e) => types.includes(e.type));
  const counters = {};
  rows = rows.map((e, k) => {
    counters[e.type] = (counters[e.type] || 0) + 1;
    return { ...e, position: k + 1, typeNo: counters[e.type] };
  });
  const total = rows.length;
  if (opts.n) rows = rows.slice(0, Number(opts.n));
  const filtered = city || types;
  const src = noExamSource(g, year);
  const columns = [
    { key: 'position', label: '№', align: 'right', get: (r) => (filtered ? r.position : r.rank) },
  ];
  if (filtered) columns.push({ key: 'rank', label: 'Страна', align: 'right', get: (r) => r.rank, drop: 3 });
  if (median) columns.push({ key: 'adjustedRank', label: 'Коригиран', align: 'right', get: (r) => r.adjustedRank, drop: 4 });
  columns.push(
    { key: 'name', label: 'Училище', get: (r) => r.fullName, flex: true },
    { key: 'city', label: 'Град', get: (r) => (r.cities || []).map((s) => cityName[s] || s).join(', '), drop: city ? 9 : 2 },
    { key: 'type', label: 'Тип', get: (r) => (r.type ? schoolType(r.type).letter + ' ' + r.typeNo : ''), drop: 1 },
    { key: 'bel', label: cfg.subjectB, align: 'right', get: (r) => r.bel, text: (v) => score(v) },
    { key: 'mat', label: cfg.subjectM, align: 'right', get: (r) => r.mat, text: (v) => score(v) },
    { key: 'score', label: 'Общо', align: 'right', get: (r) => (median ? r.score : (r.bel + r.mat) / 2), text: (v) => score(v) },
  );
  const where = city ? city.name + ' - ' : '';
  const title = median
    ? where + GRADE_LABEL[g] + ' - медиана за ' + (year - 2) + '-' + year + ' (' + total + ' училища)'
    : where + GRADE_LABEL[g] + ' - ' + year + ' г.' + (types ? ' - ' + joinTypes(types) : '') + ' (' + total + ' училища)';
  const notes = ['Подредбата е по (' + cfg.subjectB + ' + ' + cfg.subjectM + ') / 2' + (median ? ' - медианите за 3 години' : '') + '; само училища с резултати и по двата предмета.'];
  if (src) notes.push(year + ': изпитът не е провеждан - данните повтарят ' + src);
  if (!median) notes.push(link(city && !types ? PATHS.cityPage(g, city.slug) : PATHS.yearPage(g, year)));
  renderTable(ctx, {
    mode: outputMode(opts), wide: opts.wide || opts.w, title, rows, columns, notes,
    json: (list) => list.map((r) => ({
      position: r.position, rank: r.rank, ...(median ? { adjustedRank: r.adjustedRank } : {}),
      code: r.code, name: r.fullName, shortName: r.shortName, cities: r.cities, financing: r.financing, typeNo: r.typeNo,
      bel: r.bel, mat: r.mat, score: r.score,
      url: link(PATHS.school(r.code)),
    })),
  });
  return 0;
}

defineSub({
  name: 'rank',
  aliases: ['ranking', 'top'],
  summary: 'класация на училищата в град или в страната',
  usage: 'nvo rank КЛАС [ГРАД] [-y ГОДИНА] [-t ВИДОВЕ] [-s КОЛОНА] [--asc] [--all] [-u] [-n N]\n       nvo rank КЛАС [-y ГОДИНА] [-c ГРАД] [--median]',
  description: 'С град - като класацията на страницата по клас: средно за 3 години, ранг като % от първото училище, Тип / №, БЕЛ и МАТ за 3 години. -y ГОДИНА дава историческия изглед (?year=).\nБез град - класацията за една година в страната (страниците /КЛАС/ГОДИНА/); с -c ГРАД - същата в града (страниците /КЛАС/ГРАД/). --median - медианата за 3 години.',
  options: [['-y ГОДИНА', 'година (исторически изглед за град)'], ['-t ВИДОВЕ', 'само тези видове: д, о, ч, ду (ранга се смята спрямо първото от тях)'], ['-s КОЛОНА', 'подредба: rank, name, type, bel, mat, bel1, mat1, bel2, mat2'], ['--asc / --desc', 'посока на подредбата'], ['--all', 'и училищата без резултат за годината'], ['-u', 'и броя на учениците (81.20/54)'], ['-c ГРАД', 'без град като аргумент: класацията за годината в града'], ['--median', 'медианата за 3 години (без град като аргумент)'], ['--spark', 'колона с тенденцията на (БЕЛ + МАТ) / 2']],
  examples: [['nvo rank 7 sofia -n 10', ''], ['nvo rank 7 plovdiv -t ч', 'само частните'], ['nvo rank 12 varna -y 2024', 'исторически изглед'], ['nvo rank 7 -n 20', 'страната, последната година'], ['nvo rank 4 -c burgas -y 2025', ''], ['nvo rank 7 --median -n 10', ''], ['nvo rank 7 sofia --tsv | cut -f2,3', '']],
  opts: { short: 'y:t:s:c:u', long: ['asc', 'desc', 'all', 'median', 'students'] },
  positional: ['grade', 'city'],
  async run(ctx, opts, rest) {
    if (!rest.length) throw new NvoError('липсва клас (nvo rank КЛАС [ГРАД])', 2);
    const g = parseGrade(rest[0]);
    const cityArg = rest.slice(1).join(' ');
    if (cityArg && !opts.median) return cityRankingTable(ctx, opts, g, cityArg);
    if (cityArg) opts.c = cityArg;
    return nationalRankingTable(ctx, opts, g);
  },
  complete: async ({ word, prev, pos }) => {
    if (prev === '-c') return citySlugs(word);
    if (prev === '-t') return ['д', 'о', 'ч', 'ду'];
    if (prev === '-s') return ['rank', 'name', 'type', 'bel', 'mat', 'bel1', 'mat1', 'bel2', 'mat2'];
    if (prev === '-y') return ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
    if (pos === 0) return GRADES.map(String);
    if (pos === 1) return citySlugs(word);
    return [];
  },
});

const COLUMN_LABEL = { all: 'Общо', s: 'Д', m: 'О', p: 'Ч', r: 'ДУ' };

function weightedNational(model, students) {
  if (!students) {
    const n = nationalAverages(model);
    return { b: n.b.map((v) => v || null), m: n.m.map((v) => v || null) };
  }
  const b = [];
  const m = [];
  for (let y = 0; y < model.totalYears; y++) {
    let sb = 0;
    let wb = 0;
    let sm = 0;
    let wm = 0;
    model.s.forEach((o) => {
      if (!o) return;
      if (o.b[y] && o.bu[y]) {
        sb += o.b[y] * o.bu[y];
        wb += o.bu[y];
      }
      if (o.m[y] && o.mu[y]) {
        sm += o.m[y] * o.mu[y];
        wm += o.mu[y];
      }
    });
    b.push(wb ? sb / wb : null);
    m.push(wm ? sm / wm : null);
  }
  return { b, m };
}

defineSub({
  name: 'avg',
  aliases: ['averages'],
  summary: 'средни резултати по години - по училища или по ученици, по вид',
  usage: 'nvo avg КЛАС ГРАД [--by schools|students] [-t ВИДОВЕ] [-y ГОДИНА]\n       nvo avg КЛАС --national [--by schools|students]',
  description: 'Като "Средни резултати" на страницата по клас: по една колона за всеки вид и "Общо" (при два и повече вида). По училища - средно аритметично на училищата; по ученици - претеглено с броя на учениците.',
  options: [['--by schools|students', 'по училища (по подразбиране) или по ученици'], ['-t ВИДОВЕ', 'само тези видове'], ['-y ГОДИНА', 'исторически изглед'], ['--national', 'средната за страната']],
  examples: [['nvo avg 7 sofia', ''], ['nvo avg 7 sofia --by students -t д,ч', ''], ['nvo avg 12 --national --spark', '']],
  opts: { short: 'y:t:', long: ['by=', 'national'] },
  positional: ['grade', 'city'],
  async run(ctx, opts, rest) {
    if (!rest.length) throw new NvoError('липсва клас (nvo avg КЛАС ГРАД)', 2);
    const g = parseGrade(rest[0]);
    const by = opts.by ? String(opts.by) : 'schools';
    if (!['schools', 'students', 'училища', 'ученици'].includes(by)) throw new NvoError("--by приема schools или students", 2);
    const students = by === 'students' || by === 'ученици';
    const model = await gradeModel(g, opts.y ? parseYear(opts.y) : null);
    const cfg = model.cfg;
    const mode = outputMode(opts);
    const byText = students ? 'по ученици' : 'по училища';
    if (opts.national || rest.length < 2) {
      if (!opts.national) throw new NvoError('липсва град (или --national за страната)', 2);
      const nat = weightedNational(model, students);
      const rows = [];
      for (let k = model.totalYears - 1; k >= 0; k--) {
        const year = model.firstYear + k;
        rows.push({ year, noExam: noExamSource(g, year), bel: nat.b[k], mat: nat.m[k] });
      }
      renderTable(ctx, {
        mode, wide: opts.wide || opts.w,
        title: GRADE_LABEL[g] + ' - средно за страната (' + byText + ')',
        rows,
        notes: rows.filter((r) => r.noExam).map((r) => r.year + '*: изпитът не е провеждан (повтаря ' + r.noExam + ')').concat(opts.spark ? [cfg.subjectB + ' ' + spark(rows.slice().reverse().map((r) => (r.noExam ? null : r.bel))) + '   ' + cfg.subjectM + ' ' + spark(rows.slice().reverse().map((r) => (r.noExam ? null : r.mat)))] : []),
        columns: [
          { key: 'year', label: 'Година', get: (r) => r.year + (r.noExam ? '*' : '') },
          { key: 'bel', label: cfg.subjectB, align: 'right', get: (r) => r.bel, text: (v) => score(v) },
          { key: 'mat', label: cfg.subjectM, align: 'right', get: (r) => r.mat, text: (v) => score(v) },
        ],
      });
      return 0;
    }
    const city = modelCity(model, await resolveCity(rest.slice(1).join(' ')));
    const types = parseTypes(opts.t) || city.types;
    const shownTypes = sortTypes(types.filter((t) => city.types.includes(t)));
    if (!shownTypes.length) throw new NvoError('в ' + city.name + ' няма училища от вида ' + joinTypes(types));
    const avg = cityAverages(model, city, students ? 'students' : 'schools', shownTypes);
    const rows = avg.rows.map((r) => ({ ...r, noExam: noExamSource(g, r.year) }));
    if (mode !== 'table') {
      const flat = [];
      for (const r of rows) {
        avg.columns.forEach((col, k) => flat.push({ year: r.year, column: col.key === 'all' ? 'all' : schoolType(col.key).api, bel: r.b[k], mat: r.m[k] }));
      }
      renderTable(ctx, { mode, rows: flat, columns: ['year', 'column', 'bel', 'mat'].map((key) => ({ key, label: key, get: (r) => (typeof r[key] === 'number' && key !== 'year' ? Number(r[key].toFixed(4)) : r[key]) })) });
      return 0;
    }
    const notes = rows.filter((r) => r.noExam).map((r) => r.year + '*: изпитът не е провеждан (повтаря ' + r.noExam + ')');
    notes.push('Видове: ' + SCHOOL_TYPES.filter((t) => shownTypes.includes(t.key)).map((t) => t.letter + ' - ' + t.lower).join(', '));
    let first = true;
    for (const [subj, label] of [['b', cfg.subjectB], ['m', cfg.subjectM]]) {
      if (!first) ctx.out('\n');
      if (!ctx.isTTY) ctx.out(label + '\n');
      renderTable(ctx, {
        mode, wide: opts.wide || opts.w,
        title: (first ? GRADE_LABEL[g] + ' - ' + city.name + ' - средни резултати ' + byText + '\n' : '') + label,
        rows,
        notes: first ? [] : notes,
        columns: [
          { key: 'year', label: 'Година', get: (r) => r.year + (r.noExam ? '*' : '') },
          ...avg.columns.map((col, k) => ({ key: col.key, label: COLUMN_LABEL[col.key], align: 'right', get: (r) => r[subj][k], text: (v) => (v === null || v === undefined ? '-' : score(Math.round(v * 100) / 100)) })),
        ],
      });
      first = false;
    }
    return 0;
  },
  complete: async ({ word, prev, pos }) => {
    if (prev === '--by') return ['schools', 'students'];
    if (prev === '-t') return ['д', 'о', 'ч', 'ду'];
    if (pos === 0) return GRADES.map(String);
    if (pos === 1) return citySlugs(word);
    return [];
  },
});

/** Индексите на училищата за сравнение: кодове/имена или --top N ГРАД (водещите в града). */
export async function compareIndices(model, args, opts) {
  const indices = [];
  if (opts.top) {
    const parts = String(opts.top).split(/\s+/);
    const n = Number(parts[0]);
    if (!Number.isInteger(n) || n < 1) throw new NvoError('--top изисква брой (напр. --top 5 -c sofia)', 2);
    const cityArg = opts.c || args.shift();
    if (!cityArg) throw new NvoError('--top изисква град (-c ГРАД)', 2);
    const city = modelCity(model, await resolveCity(cityArg));
    const rows = sortRanking(model, cityRanking(model, city), 'rank', 'desc', parseTypes(opts.t));
    rows.slice(0, n).forEach((r) => indices.push(r.i));
  }
  for (const a of args) {
    const s = await resolveSchool(a);
    const i = findSchoolIndexByCode(model, s.code);
    if (i < 0) throw new NvoError(s.shortName + ' (' + s.code + ') няма резултати за ' + GRADE_LABEL[model.grade]);
    if (!indices.includes(i)) indices.push(i);
  }
  if (!indices.length) throw new NvoError('няма училища за сравнение (кодове или --top N -c ГРАД)', 2);
  return indices;
}

defineSub({
  name: 'compare',
  aliases: ['chart', 'cmp'],
  summary: 'сравнение на училища по години (данните от графиката)',
  usage: 'nvo compare КЛАС КОД|ИМЕ... [--top N -c ГРАД] [-t ВИДОВЕ] [--bel|--mat] [-y ГОДИНА] [--spark] [--link]',
  description: 'Графиката за сравнение като таблица: училищата по редове, годините по колони (БЕЛ и МАТ поотделно). Имена с интервали - в кавички. --top N -c ГРАД добавя водещите N училища в града (като "Добави водещите училища").',
  options: [['--top N', 'водещите N училища в града от -c'], ['-c ГРАД', 'градът за --top'], ['-t ВИДОВЕ', 'за --top: само тези видове'], ['--bel / --mat', 'само единия предмет'], ['-y ГОДИНА', 'исторически изглед (последните 3 години до нея)'], ['--spark', 'колона с тенденцията'], ['--link', 'само адресът за споделяне (?s=кодове)']],
  examples: [['nvo compare 7 2216306 2216213', ''], ['nvo compare 7 --top 5 -c sofia --spark', ''], ['nvo compare 12 "пмг пловдив" "мг варна" --mat', ''], ['nvo compare 7 --top 3 -c varna --link', '']],
  opts: { short: 'y:t:c:', long: ['top=', 'bel', 'mat', 'link'] },
  positional: ['grade', 'school', 'school', 'school', 'school', 'school'],
  async run(ctx, opts, rest) {
    if (!rest.length) throw new NvoError('липсва клас (nvo compare КЛАС КОД...)', 2);
    const g = parseGrade(rest[0]);
    const model = await gradeModel(g, opts.y ? parseYear(opts.y) : null);
    const indices = await compareIndices(model, rest.slice(1), opts);
    const codes = indices.map((i) => model.s[i].c);
    const fc = findCityForSchool(model, indices[0]);
    const slug = fc && model.si[fc.cityName] ? model.si[fc.cityName].h : '';
    const url = link(model.timeTravelYear ? g + '/?s=' + codes.join(',') + '&year=' + model.latestYear + (slug ? '#' + slug : '') : PATHS.compare(g, codes, slug));
    if (opts.link) {
      ctx.print(url);
      return 0;
    }
    const cfg = model.cfg;
    const subjects = opts.bel ? ['b'] : opts.mat ? ['m'] : ['b', 'm'];
    const mode = outputMode(opts);
    const results = subjects.map((subj) => ({ subj, ...chartSeries(model, indices, subj) }));
    if (mode === 'json') {
      printJson(ctx, { grade: g, url, subjects: results.map((r) => ({ subject: r.subj === 'b' ? 'bel' : 'mat', years: r.categories.map(Number), schools: r.series.map((x) => ({ code: model.s[x.index].c, name: model.s[x.index].l, values: x.data })) })) });
      return 0;
    }
    let first = true;
    for (const r of results) {
      if (!first && mode === 'table') ctx.out('\n');
      const label = r.subj === 'b' ? cfg.subjectB : cfg.subjectM;
      if (mode === 'table' && !ctx.isTTY && results.length > 1) ctx.out(label + '\n');
      const columns = [
        { key: 'code', label: 'Код', get: (x) => model.s[x.index].c, drop: 1 },
        { key: 'name', label: 'Училище', get: (x) => model.s[x.index].l, flex: true },
        ...r.categories.map((year, k) => ({
          key: year,
          label: (mode === 'table' ? yy(year) : year) + (noExamSource(g, Number(year)) ? '*' : ''),
          align: 'right',
          get: (x) => (noExamSource(g, Number(year)) ? null : x.data[k] || null),
          text: (v) => score(v),
          drop: k < r.categories.length - 3 ? 10 + r.categories.length - k : 0,
        })),
      ];
      if (opts.spark) columns.push({ key: 'trend', label: 'Тенденция', get: (x) => spark(x.data.map((v, k) => (noExamSource(g, Number(r.categories[k])) ? null : v))), drop: 30 });
      if (mode !== 'table') columns.unshift({ key: 'subject', label: 'Предмет', get: () => label });
      const notes = r.categories.filter((y) => noExamSource(g, Number(y))).map((y) => y + '*: изпитът не е провеждан');
      if (r === results[results.length - 1]) notes.push('Графиката: ' + url);
      renderTable(ctx, {
        mode, wide: opts.wide || opts.w,
        title: (first ? GRADE_LABEL[g] + (model.timeTravelYear ? ' - към ' + model.latestYear : '') + ' - сравнение\n' : '') + label,
        rows: r.series,
        columns,
        notes,
      });
      first = false;
    }
    return 0;
  },
  complete: async ({ word, prev, pos }) => {
    if (prev === '-c') return citySlugs(word);
    if (prev === '-t') return ['д', 'о', 'ч', 'ду'];
    if (pos === 0) return GRADES.map(String);
    return schoolCodes(word);
  },
});

