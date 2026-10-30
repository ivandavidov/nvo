// nvo search, school, near, cities, grades, types - търсенето, профилът на училище и справочниците.

import { gradeConfig, displayRange, noExamSource, GRADES } from '../../core/config.js';
import { nationalAverages, renderableCities, cityIndices } from '../../core/model.js';
import { SCHOOL_TYPES, schoolType, typeKeyFromApi } from '../../core/school-types.js';
import { search } from '../../ui/search-core.js';
import { defineSub, NvoError, GRADE_LABEL, parseGrade, parseTypes, link, PATHS } from './core.js';
import { searchIndex, resolveCity, resolveSchool, schoolDoc, gradeModel, yearRanking, baloveIndex, baloveCity, apiIndex, citySlugs, schoolCodes } from './data.js';
import { renderTable, outputMode, score, delta, spark, printJson, keyValues } from './format.js';

const typeLetter = (key) => (key ? schoolType(key).letter : '');

defineSub({
  name: 'search',
  aliases: ['find', 's'],
  summary: 'търси училища, градове и страници (като Ctrl+K на сайта)',
  usage: 'nvo search ТЕКСТ... [-g КЛАС] [-c ГРАД] [-t ВИДОВЕ] [--codes]',
  description: 'Същото търсене като на сайта: латиница = кирилица (pmg = пмг), разписани съкращения (ПМГ, СУ, ОУ), официалните имена от МОН и кодовете.',
  options: [['-g КЛАС', 'само училищата с резултати за класа'], ['-c ГРАД', 'само в града'], ['-t ВИДОВЕ', 'само тези видове: д, о, ч, ду'], ['--codes', 'само кодовете (по един на ред, за xargs)']],
  examples: [['nvo search пмг', ''], ['nvo search ботев -c plovdiv', ''], ['nvo search гимназия -c sofia -t ч --codes | head', '']],
  opts: { short: 'g:c:t:', long: ['codes'] },
  positional: ['text'],
  async run(ctx, opts, rest) {
    const query = rest.join(' ').trim();
    if (!query) throw new NvoError('какво да търся? (nvo search ТЕКСТ)', 2);
    const index = await searchIndex();
    const res = search(index, query, { maxSchools: 100000, maxCities: 50 });
    let schools = res.schools;
    const grade = opts.g ? parseGrade(opts.g) : null;
    const city = opts.c ? await resolveCity(opts.c) : null;
    const types = parseTypes(opts.t);
    if (grade) schools = schools.filter((s) => s.grades.includes(grade));
    if (city) schools = schools.filter((s) => s.city && s.city.slug === city.slug);
    if (types) schools = schools.filter((s) => types.includes(s.type));
    const total = schools.length;
    if (opts.n) schools = schools.slice(0, Number(opts.n));
    if (opts.codes) {
      ctx.out(schools.map((s) => s.code + '\n').join(''));
      return schools.length ? 0 : 1;
    }
    const mode = outputMode(opts);
    const notes = [];
    if (mode === 'table' && !grade && !city && !types) {
      if (res.cities.length) notes.push('Градове: ' + res.cities.map((c) => c.name + ' (' + c.slug + ')').join(', '));
      if (res.pages.length && res.pages.length < 6) notes.push('Страници: ' + res.pages.map((p) => p.title + ' - ' + link(p.href)).join(', '));
    }
    if (total > schools.length) notes.push('Показани са ' + schools.length + ' от ' + total + ' училища.');
    if (!schools.length && mode === 'table') {
      if (ctx.isTTY && notes.length) ctx.out(notes.map((n) => ctx.c.muted(n)).join('\n') + '\n');
      ctx.err("няма училища за '" + query + "'");
      return 1;
    }
    renderTable(ctx, {
      mode,
      wide: opts.wide || opts.w,
      title: total + (total === 1 ? ' училище' : ' училища') + " за '" + query + "'",
      notes,
      rows: schools,
      columns: [
        { key: 'code', label: 'Код', get: (s) => s.code, color: (t) => ctx.c.cyan(t) },
        { key: 'name', label: 'Училище', get: (s) => s.fullName, flex: true },
        { key: 'city', label: 'Град', get: (s) => (s.city ? s.city.name : ''), drop: 2 },
        { key: 'type', label: 'Вид', get: (s) => typeLetter(s.type), drop: 1 },
        { key: 'grades', label: 'Изпити', get: (s) => s.grades.slice().sort((a, b) => a - b).join(' '), drop: 3 },
      ],
      json: (rows) => rows.map((s) => ({
        code: s.code, shortName: s.shortName, fullName: s.fullName, officialName: s.officialName,
        city: s.city ? s.city.slug : null, cityName: s.city ? s.city.name : null,
        financing: s.type ? schoolType(s.type).api : null, grades: s.grades, url: link(PATHS.school(s.code)),
      })),
    });
    return 0;
  },
  complete: async ({ prev }) => (prev === '-c' ? citySlugs() : prev === '-g' ? GRADES.map(String) : null),
});

function rankText(rank, total) {
  return rank ? rank + ' от ' + total : '-';
}

/** Годините на изпит от документа на училището в прозореца на сайта (правило 9). */
function examYears(ge, grade, allYears) {
  const latest = ge.latestYear || ge.yearsRange[ge.yearsRange.length - 1];
  const from = allYears ? ge.yearsRange[0] : displayRange(grade, latest).from;
  return ge.yearsRange.map((year, k) => ({ year, k })).filter((y) => y.year >= from && y.year <= latest);
}

async function baloveLine(doc) {
  try {
    const idx = await baloveIndex();
    const city = idx.cities.find((c) => c.slug === doc.city.slug);
    if (!city) return null;
    const bdoc = await baloveCity(doc.city.slug);
    const s = bdoc.schools.find((x) => x.code === doc.code);
    if (!s || !s.profiles.length) return { city, profiles: 0 };
    return { city, profiles: s.profiles.length };
  } catch {
    return null;
  }
}

defineSub({
  name: 'school',
  aliases: ['info', 'profile'],
  summary: 'профил на училище: места в класациите и резултати по години',
  usage: 'nvo school КОД|ИМЕ [-g КЛАС] [--spark] [--all-years]',
  description: 'Като страницата на училището: имената, видът, градът, статусът; за всеки изпит - мястото в страната и в града (и сред същия вид), 3-годишната медиана и таблица по години с разликата от средната за страната. Накрая - баловете след 7 клас.',
  options: [['-g КЛАС', 'само един изпит'], ['--spark', 'мини-тенденции на БЕЛ и МАТ'], ['--all-years', 'и годините преди прозореца на сайта'], ['--json', 'документът от API (schools/КОД.json)']],
  examples: [['nvo school 2216306', ''], ['nvo school смг', 'по име'], ['nvo school пмг пловдив -g 12 --spark', '']],
  opts: { short: 'g:', long: [] },
  positional: ['school'],
  async run(ctx, opts, rest) {
    const s = await resolveSchool(rest.join(' '));
    const doc = await schoolDoc(s.code);
    if (outputMode(opts) === 'json') {
      printJson(ctx, { ...doc, url: link(PATHS.school(doc.code)) });
      return 0;
    }
    const c = ctx.c;
    const typeKey = typeKeyFromApi(doc.financing, doc.isPrivate);
    const type = typeKey ? schoolType(typeKey) : null;
    let out = c.bold(doc.shortName) + c.muted(' - ' + doc.city.name) + '\n';
    if (doc.officialName && doc.officialName !== doc.shortName) out += doc.officialName + '\n';
    if (doc.monName && doc.monName !== doc.officialName) out += c.muted('В регистъра на МОН: ' + doc.monName) + '\n';
    out += '\n' + keyValues(ctx, [
      ['Код', doc.code],
      ['Вид', type ? type.label + ' (' + type.letter + ')' : 'няма данни'],
      ['Град', doc.city.name + ' (' + doc.city.slug + ')'],
      ['Статус', doc.registerStatus || 'няма данни'],
      ['Сайт', doc.website ? c.link(doc.website) : '-'],
      ['Профил', c.link(link(PATHS.school(doc.code)))],
    ]);
    const grades = Object.keys(doc.grades).map(Number).sort((a, b) => a - b).filter((g) => !opts.g || g === parseGrade(opts.g));
    if (!grades.length) throw new NvoError('няма резултати за ' + (opts.g ? GRADE_LABEL[parseGrade(opts.g)] : 'нито един изпит'));
    ctx.out(out);
    for (const g of grades) {
      const ge = doc.grades[g];
      const cfg = gradeConfig(g);
      const model = await gradeModel(g);
      const nat = nationalAverages(model);
      const natFor = (year, subj) => {
        const k = year - model.firstYear;
        const v = k >= 0 && k < nat[subj].length ? nat[subj][k] : null;
        return v || null;
      };
      const typeWord = type ? type.definite : 'същия вид';
      const cityHasOthers = ge.cityTypeTotal !== null && ge.cityTypeTotal !== undefined && ge.cityTypeTotal < ge.cityTotal;
      const kv = [
        ['В страната', rankText(ge.nationalRank, ge.nationalTotal) + c.muted(' (' + ge.latestYear + ')')],
        ['Сред ' + typeWord, rankText(ge.nationalTypeRank, ge.nationalTypeTotal)],
        ['В града', rankText(ge.cityRank, ge.cityTotal)],
      ];
      if (cityHasOthers) kv.push(['Сред ' + typeWord + ' в града', rankText(ge.cityTypeRank, ge.cityTypeTotal)]);
      if (ge.medianRank) kv.push(['Медиана 3 г.', rankText(ge.medianRank, ge.medianTotal) + c.muted(' (' + (ge.medianEndYear - 2) + '-' + ge.medianEndYear + (ge.medianAdjustedRank && ge.medianAdjustedRank !== ge.medianRank ? ', коригирано ' + ge.medianAdjustedRank : '') + ')')]);
      let block = '\n' + c.bold(GRADE_LABEL[g]) + c.muted(' - ' + link(PATHS.compare(g, [doc.code], doc.city.slug))) + '\n' + keyValues(ctx, kv);
      const years = examYears(ge, g, opts['all-years']);
      if (opts.spark) {
        const ok = (y) => !noExamSource(g, y.year);
        block += '  ' + c.muted(cfg.subjectB) + ' ' + spark(years.map((y) => (ok(y) ? ge.belScore[y.k] : null))) + '   ' + c.muted(cfg.subjectM) + ' ' + spark(years.map((y) => (ok(y) ? ge.matScore[y.k] : null))) + c.muted('  ' + years[0].year + '-' + years[years.length - 1].year) + '\n';
      }
      ctx.out(block + '\n');
      const rows = years.slice().reverse().map((y) => {
        const noExam = noExamSource(g, y.year);
        const b = noExam ? null : ge.belScore[y.k];
        const m = noExam ? null : ge.matScore[y.k];
        const nb = natFor(y.year, 'b');
        const nm = natFor(y.year, 'm');
        return {
          year: y.year, noExam,
          bel: b, mat: m,
          belStudents: noExam ? null : ge.belStudents[y.k], matStudents: noExam ? null : ge.matStudents[y.k],
          belDelta: b && nb ? b - nb : null, matDelta: m && nm ? m - nm : null,
          nationalRank: noExam ? null : ge.nationalRanks[y.k], nationalTotal: ge.nationalTotals[y.k],
          cityRank: noExam ? null : ge.cityRanks[y.k], cityTotal: ge.cityTotals[y.k],
        };
      });
      const notes = rows.filter((r) => r.noExam).map((r) => r.year + ': изпитът не е провеждан (в данните се повтаря ' + r.noExam + ')');
      notes.push('Δ - разлика от средната за страната (по училища)');
      renderTable(ctx, {
        mode: 'table',
        wide: opts.wide || opts.w,
        notes,
        rows,
        columns: [
          { key: 'year', label: 'Година', get: (r) => r.year + (r.noExam ? '*' : '') },
          { key: 'bel', label: cfg.subjectB, align: 'right', get: (r) => r.bel, text: (v, r) => (r.noExam ? '-' : score(v)) },
          { key: 'mat', label: cfg.subjectM, align: 'right', get: (r) => r.mat, text: (v, r) => (r.noExam ? '-' : score(v)) },
          { key: 'belDelta', label: 'Δ ' + cfg.subjectB, align: 'right', get: (r) => r.belDelta, text: (v) => delta(v, null), color: (t) => (t.startsWith('+') ? c.green(t) : t.startsWith('-') ? c.red(t) : t), drop: 3 },
          { key: 'matDelta', label: 'Δ ' + cfg.subjectM, align: 'right', get: (r) => r.matDelta, text: (v) => delta(v, null), color: (t) => (t.startsWith('+') ? c.green(t) : t.startsWith('-') ? c.red(t) : t), drop: 4 },
          { key: 'students', label: 'Ученици', align: 'right', get: (r) => r.belStudents, text: (v, r) => (r.noExam || !v ? '' : r.belStudents + (r.matStudents !== r.belStudents ? '/' + r.matStudents : '')), drop: 5 },
          { key: 'national', label: 'Страна', align: 'right', get: (r) => r.nationalRank, text: (v, r) => (v ? v + '/' + r.nationalTotal : ''), drop: 2 },
          { key: 'city', label: 'Град', align: 'right', get: (r) => r.cityRank, text: (v, r) => (v ? v + '/' + r.cityTotal : ''), drop: 1 },
        ],
      });
    }
    const b = await baloveLine(doc);
    if (b && b.profiles) {
      ctx.out('\n' + c.bold('Балове след 7 клас') + ': ' + b.profiles + (b.profiles === 1 ? ' паралелка' : ' паралелки') + c.muted(' - nvo balove ' + doc.city.slug + ' ' + doc.code) + '\n' + '  ' + c.link(link(PATHS.balove(doc.city.slug, doc.code))) + '\n');
    }
    return 0;
  },
  complete: async ({ word, prev }) => (prev === '-g' ? GRADES.map(String) : schoolCodes(word)),
});

/** Близките по успех в града - като SchoolPageGenerator.cityNeighbors (6 около училището). */
export function cityNeighbors(ranking, citySlug, code, count = 6) {
  const inCity = ranking.schools.filter((e) => (e.cities || []).includes(citySlug));
  const self = inCity.findIndex((e) => e.code === code);
  if (self < 0 || inCity.length <= 1) return { rows: [], self: -1 };
  const total = inCity.length;
  let start = Math.max(0, self - Math.floor(count / 2));
  const end = Math.min(total, start + count + 1);
  start = Math.max(0, end - (count + 1));
  return { rows: inCity.slice(start, end).map((e, k) => ({ ...e, place: start + k + 1, self: start + k === self })), total };
}

defineSub({
  name: 'near',
  aliases: ['neighbors'],
  summary: 'близки по успех училища в същия град',
  usage: 'nvo near КОД|ИМЕ [-g КЛАС]',
  description: 'Като "Близки по успех" на страницата на училището: училищата около него в класацията на града за последната година (самото училище е отбелязано с >).',
  examples: [['nvo near 2216306', ''], ['nvo near смг -g 7', '']],
  opts: { short: 'g:', long: [] },
  positional: ['school'],
  async run(ctx, opts, rest) {
    const s = await resolveSchool(rest.join(' '));
    const doc = await schoolDoc(s.code);
    const grades = Object.keys(doc.grades).map(Number).sort((a, b) => a - b).filter((g) => !opts.g || g === parseGrade(opts.g));
    const mode = outputMode(opts);
    const data = [];
    let printed = 0;
    for (const g of grades) {
      const ge = doc.grades[g];
      const ranking = await yearRanking(g, ge.latestYear);
      const { rows, total } = cityNeighbors(ranking, doc.city.slug, doc.code);
      if (!rows.length) continue;
      if (mode !== 'table') {
        data.push(...rows.map((r) => ({ grade: g, year: ge.latestYear, place: r.place, cityTotal: total, code: r.code, name: r.shortName || r.fullName, bel: r.belScore, mat: r.matScore, score: r.score, self: r.self })));
        continue;
      }
      const cfg = gradeConfig(g);
      if (printed++) ctx.out('\n');
      renderTable(ctx, {
        title: GRADE_LABEL[g] + ' - ' + ge.latestYear + ' - близки по успех в ' + doc.city.name,
        rows,
        wide: opts.wide || opts.w,
        columns: [
          { key: 'place', label: '№', align: 'right', get: (r) => r.place, text: (v, r) => (r.self ? '> ' : '') + v },
          { key: 'code', label: 'Код', get: (r) => r.code, drop: 1 },
          { key: 'name', label: 'Училище', get: (r) => r.shortName || r.fullName, flex: true, color: (t, r) => (r.self ? ctx.c.bold(t) : t) },
          { key: 'bel', label: cfg.subjectB, align: 'right', get: (r) => r.belScore, text: (v) => score(v) },
          { key: 'mat', label: cfg.subjectM, align: 'right', get: (r) => r.matScore, text: (v) => score(v) },
          { key: 'score', label: 'Общо', align: 'right', get: (r) => r.score, text: (v) => score(v) },
        ],
        notes: ['№ - мястото в класацията на града (' + total + ' училища)'],
      });
    }
    if (mode !== 'table') {
      renderTable(ctx, { mode, rows: data, columns: ['grade', 'year', 'place', 'cityTotal', 'code', 'name', 'bel', 'mat', 'score', 'self'].map((k) => ({ key: k, label: k, get: (r) => r[k] })) });
    } else if (!printed) {
      throw new NvoError('няма други училища в класацията на ' + doc.city.name);
    }
    return 0;
  },
  complete: async ({ word, prev }) => (prev === '-g' ? GRADES.map(String) : schoolCodes(word)),
});

defineSub({
  name: 'cities',
  aliases: ['city'],
  summary: 'градовете - с брой училища по вид за изпит',
  usage: 'nvo cities [КЛАС] [--tier 1|2|3] [--balove]',
  description: 'Без клас - всички градове с изпитите, за които има данни, и дали има балове. С клас - училищата с резултат за последната година по вид (Д, О, Ч, ДУ).',
  options: [['--tier N', '1 - големите, 2 - областните, 3 - другите градове'], ['--balove', 'само градовете с балове след 7 клас']],
  examples: [['nvo cities', ''], ['nvo cities 7 --tier 2', ''], ['nvo cities --balove | wc -l', '']],
  opts: { short: '', long: ['tier=', 'balove'] },
  positional: ['grade'],
  async run(ctx, opts, rest) {
    const index = await searchIndex();
    const mode = outputMode(opts);
    const wide = opts.wide || opts.w;
    if (rest[0]) {
      const g = parseGrade(rest[0]);
      const model = await gradeModel(g);
      let cities = renderableCities(model);
      if (opts.tier) cities = cities.filter((x) => String(x.tier) === String(opts.tier));
      if (opts.balove) cities = cities.filter((x) => x.hasBalove);
      const rows = cities.map((city) => {
        const counts = {};
        let total = 0;
        for (const i of cityIndices(city)) {
          const o = model.s[i];
          if (o && o.b[o.b.length - 1] !== null) {
            counts[o.t] = (counts[o.t] || 0) + 1;
            total++;
          }
        }
        return { slug: city.slug, name: city.name, tier: city.tier, total, counts, balove: city.hasBalove };
      });
      renderTable(ctx, {
        mode, wide,
        title: GRADE_LABEL[g] + ' - ' + model.latestYear + ' - ' + rows.length + ' града',
        rows,
        columns: [
          { key: 'name', label: 'Град', get: (r) => r.name, flex: true },
          { key: 'slug', label: 'slug', get: (r) => r.slug, color: (t) => ctx.c.cyan(t) },
          { key: 'schools', label: 'Училища', align: 'right', get: (r) => r.total },
          ...SCHOOL_TYPES.map((t, k) => ({ key: t.api, label: t.letter, align: 'right', get: (r) => r.counts[t.key] || 0, text: (v) => (v ? String(v) : '-'), drop: 4 - k })),
          { key: 'balove', label: 'Балове', get: (r) => r.balove, text: (v) => (v ? 'да' : ''), drop: 5 },
        ],
      });
      return 0;
    }
    let cities = index.cities;
    if (opts.tier) cities = cities.filter((x) => String(x.order) === String(opts.tier));
    if (opts.balove) cities = cities.filter((x) => x.balove);
    renderTable(ctx, {
      mode, wide,
      title: cities.length + ' града',
      rows: cities,
      columns: [
        { key: 'name', label: 'Град', get: (r) => r.name, flex: true },
        { key: 'slug', label: 'slug', get: (r) => r.slug, color: (t) => ctx.c.cyan(t) },
        { key: 'grades', label: 'Изпити', get: (r) => r.grades.slice().sort((a, b) => a - b).join(' '), drop: 2 },
        { key: 'balove', label: 'Балове', get: (r) => r.balove, text: (v) => (v ? 'да' : ''), drop: 1 },
      ],
    });
    return 0;
  },
  complete: async () => GRADES.map(String),
});

defineSub({
  name: 'grades',
  aliases: ['exams'],
  summary: 'изпитите: години, скали, последна година, години без изпит',
  usage: 'nvo grades',
  async run(ctx, opts) {
    const index = await apiIndex();
    const rows = index.grades.map((gr) => ({
      grade: gr.grade,
      label: gr.label,
      from: gr.yearsRange[0],
      to: gr.yearsRange[gr.yearsRange.length - 1],
      shown: displayRange(gr.grade, gr.yearsRange[gr.yearsRange.length - 1]).from,
      scale: gr.scaleMin + '-' + gr.scaleMax,
      noExam: (gr.noExamYears || []).map((x) => x.year + ' (= ' + x.copyOf + ')').join(', '),
    }));
    renderTable(ctx, {
      mode: outputMode(opts),
      wide: opts.wide || opts.w,
      title: 'Изпитите в данните',
      rows,
      notes: ['На сайта се виждат годините от "Показва", в CSV, JSON и API - всички. Източник: data.egov.bg'],
      columns: [
        { key: 'grade', label: 'Клас', align: 'right', get: (r) => r.grade },
        { key: 'label', label: 'Изпит', get: (r) => r.label },
        { key: 'years', label: 'Данни', get: (r) => r.from + '-' + r.to },
        { key: 'shown', label: 'Показва', get: (r) => r.shown + '-' + r.to },
        { key: 'scale', label: 'Скала', get: (r) => r.scale, drop: 1 },
        { key: 'noExam', label: 'Без изпит', get: (r) => r.noExam, drop: 2 },
      ],
    });
    return 0;
  },
});

defineSub({
  name: 'types',
  summary: 'видовете училища: Д, О, Ч, ДУ',
  usage: 'nvo types',
  run(ctx, opts) {
    renderTable(ctx, {
      mode: outputMode(opts),
      title: 'Видове училища (по финансирането в регистъра на МОН)',
      rows: SCHOOL_TYPES,
      notes: ['В опциите -t се пишат буквите (д, о, ч, ду), латинските ключове (s, m, p, r) или думите (частни).'],
      columns: [
        { key: 'letter', label: 'Буква', get: (t) => t.letter },
        { key: 'label', label: 'Вид', get: (t) => t.label },
        { key: 'key', label: 'Ключ', get: (t) => t.key },
        { key: 'api', label: 'API (financing)', get: (t) => t.api },
      ],
    });
    return 0;
  },
});
