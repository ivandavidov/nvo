// nvo export, pdf, embed, link, open - изтеглянето (като менюто "Изтегли ▾"), PDF профилът на
// училище, кодът за вграждане и адресите към страниците на сайта.

import { GRADES } from '../../core/config.js';
import { cityCsv, allCsv, cityRanking, sortRanking } from '../../core/model.js';
import { rankingPdf, allRankingsPdf } from '../../core/pdf.js';
import { schoolBrochureByCode } from '../../core/brochure.js';
import { fetchBaloveCity, fetchBaloveIndex, fetchBaloveAll, baloveCsv, balovePdf } from '../../core/balove-export.js';
import { embedCode, embedSrc } from '../../core/embed.js';
import { defineSub, NvoError, parseGrade, parseYear, parseTypes, link, PATHS, isGrade } from './core.js';
import { gradeModel, resolveCity, modelCity, resolveSchool, getText, citySlugs, schoolCodes, baloveIndex } from './data.js';
import { compareIndices } from './rank.js';
import { saveToComputer } from '../commands/browser.js';

/** Записва изтегленото: в браузъра (по подразбиране), на stdout (-o -) или във файл в конзолата. */
async function deliver(ctx, opts, filename, content) {
  if (opts.o === '-') {
    ctx.out(content);
    return;
  }
  if (opts.o) {
    await ctx.fs.writeFile(ctx.resolve(opts.o), content);
    if (ctx.isTTY) ctx.io.stderr.write('Записано в ' + opts.o + '\n');
    return;
  }
  saveToComputer(filename, content);
  ctx.io.stderr.write('Сваля се ' + filename + '\n');
}

async function exportBalove(ctx, opts, format, cityArg) {
  const all = opts.all || !cityArg;
  if (!all && !cityArg) throw new NvoError('липсва град (или --all)', 2);
  let slug = null;
  if (!all) {
    const city = await resolveCity(cityArg);
    const idx = await baloveIndex();
    if (!idx.cities.some((c) => c.slug === city.slug)) throw new NvoError('няма балове за ' + city.name + ' (nvo balove изрежда градовете)');
    slug = city.slug;
  }
  const name = 'balove-7-' + (all ? 'all' : slug);
  if (format === 'json') {
    await deliver(ctx, opts, name + '.json', await getText('api/v1/balove/' + (all ? 'data' : slug) + '.json'));
    return 0;
  }
  if (ctx.isTTY) ctx.io.stderr.write(all ? 'Подготвя се ' + format.toUpperCase() + ' за всички градове - до минута...\n' : '');
  const [index, data] = await Promise.all([fetchBaloveIndex(), all ? fetchBaloveAll() : fetchBaloveCity(slug)]);
  const docs = all ? data.cities : [data];
  if (format === 'csv') {
    await deliver(ctx, opts, name + '.csv', baloveCsv(docs));
  } else {
    if (opts.o) throw new NvoError('PDF се сваля само в браузъра (без -o)', 2);
    await balovePdf(docs, name + '.pdf', index.years);
    ctx.io.stderr.write('Сваля се ' + name + '.pdf\n');
  }
  return 0;
}

defineSub({
  name: 'export',
  aliases: ['download', 'dl'],
  summary: 'изтегля CSV, JSON или PDF (като менюто "Изтегли" на сайта)',
  usage: 'nvo export csv|json|pdf КЛАС [ГРАД | --all] [-t ВИДОВЕ] [-y ГОДИНА] [-o ФАЙЛ|-o -]\n       nvo export balove csv|json|pdf [ГРАД | --all] [-o ФАЙЛ|-o -]',
  description: 'CSV и JSON са данните (всички години, сурови стойности); PDF е отчетът - класацията, както я показва сайтът (с -t - само тези видове).\nПо подразбиране файлът се сваля на компютъра; -o - го пише на stdout (за pipe), -o ФАЙЛ - във файловата система на конзолата.',
  options: [['--all', 'всички градове'], ['-t ВИДОВЕ', 'PDF: само тези видове'], ['-y ГОДИНА', 'исторически изглед'], ['-o ФАЙЛ', 'запис в конзолата; "-" = stdout']],
  examples: [['nvo export csv 7 sofia', 'сваля nvo-7-data-sofia.csv'], ['nvo export pdf 7 --all', 'класациите на всички градове'], ['nvo export csv 7 sofia -o - | grep СМГ', ''], ['nvo export balove pdf varna', ''], ['nvo export json 12 --all -o ~/dzi.json', '']],
  opts: { short: 't:y:o:', long: ['all'] },
  positional: ['format', 'grade', 'city'],
  async run(ctx, opts, rest) {
    if (rest[0] === 'balove') {
      const format = String(rest[1] || '').toLowerCase();
      if (!['csv', 'json', 'pdf'].includes(format)) throw new NvoError('формат: csv, json или pdf (nvo export balove csv ГРАД)', 2);
      return exportBalove(ctx, opts, format, rest.slice(2).join(' '));
    }
    const format = String(rest[0] || '').toLowerCase();
    if (!['csv', 'json', 'pdf'].includes(format)) throw new NvoError('формат: csv, json или pdf (nvo export csv 7 sofia)', 2);
    if (!rest[1]) throw new NvoError('липсва клас', 2);
    const g = parseGrade(rest[1]);
    const cityArg = rest.slice(2).join(' ');
    const all = opts.all || !cityArg;
    const model = await gradeModel(g, opts.y ? parseYear(opts.y) : null);
    const city = all ? null : modelCity(model, await resolveCity(cityArg));
    if (format === 'csv') {
      const file = all ? allCsv(model) : cityCsv(model, city);
      await deliver(ctx, opts, file.filename, file.content);
    } else if (format === 'json') {
      const path = 'api/v1/' + g + '/' + (all ? '' : city.slug + '/') + 'data.json';
      await deliver(ctx, opts, model.cfg.exportPrefix + '-data-' + (all ? 'all' : city.slug) + '.json', await getText(path));
    } else {
      if (opts.o) throw new NvoError('PDF се сваля само в браузъра (без -o)', 2);
      if (all) {
        if (ctx.isTTY) ctx.io.stderr.write('Подготвя се PDF с класациите на всички градове...\n');
        await allRankingsPdf(model);
        ctx.io.stderr.write('Сваля се ' + model.cfg.exportPrefix + '-ranking-all.pdf\n');
      } else {
        const types = parseTypes(opts.t);
        const rows = sortRanking(model, cityRanking(model, city), 'rank', 'desc', types);
        if (!rows.length) throw new NvoError('няма училища за класацията');
        await rankingPdf(model, city, rows, types);
        ctx.io.stderr.write('Сваля се ' + model.cfg.exportPrefix + '-ranking-' + city.slug + '.pdf\n');
      }
    }
    return 0;
  },
  complete: async ({ word, prev, pos, args }) => {
    if (prev === '-t') return ['д', 'о', 'ч', 'ду'];
    if (pos === 0) return ['csv', 'json', 'pdf', 'balove'];
    if (args[0] === 'balove') return pos === 1 ? ['csv', 'json', 'pdf'] : citySlugs(word);
    if (pos === 1) return GRADES.map(String);
    return citySlugs(word);
  },
});

defineSub({
  name: 'pdf',
  aliases: ['brochure', 'report'],
  summary: 'PDF профил на училище (като "Изтегли PDF" и "Доклад")',
  usage: 'nvo pdf КОД|ИМЕ',
  description: 'Същият PDF като на страницата на училището: корица с местата в класациите, страница за всеки изпит, баловете, близките по успех и как да се четат данните.',
  examples: [['nvo pdf 2216306', ''], ['nvo search смг --codes | xargs -n1 nvo pdf', 'по един PDF за всяко намерено училище']],
  positional: ['school'],
  async run(ctx, opts, rest) {
    const s = await resolveSchool(rest.join(' '));
    ctx.io.stderr.write('Подготвя се PDF профилът на ' + s.shortName + '...\n');
    await schoolBrochureByCode(s.code);
    ctx.io.stderr.write('Готово.\n');
    return 0;
  },
  complete: async ({ word }) => schoolCodes(word),
});

defineSub({
  name: 'embed',
  summary: 'код за вграждане на графиката в друг сайт (iframe)',
  usage: 'nvo embed КЛАС КОД|ИМЕ... [--top N -c ГРАД] [--chart b|m] [--theme light|dark] [-y ГОДИНА] [--src]',
  description: 'Същият код като бутона "Вгради" и страницата /embed/. С | pbcopy отива в клипборда.',
  options: [['--chart b|m', 'само БЕЛ или само МАТ'], ['--theme light|dark', 'тема на графиката'], ['-y ГОДИНА', 'исторически изглед'], ['--top N -c ГРАД', 'водещите N училища в града'], ['--src', 'само адресът на iframe-а']],
  examples: [['nvo embed 7 2216306 2216213', ''], ['nvo embed 7 --top 5 -c sofia --chart m | pbcopy', '']],
  opts: { short: 'y:c:t:', long: ['chart=', 'theme=', 'top=', 'src'] },
  positional: ['grade', 'school', 'school', 'school'],
  async run(ctx, opts, rest) {
    if (!rest.length) throw new NvoError('липсва клас', 2);
    const g = parseGrade(rest[0]);
    const year = opts.y ? parseYear(opts.y) : null;
    const model = await gradeModel(g, year);
    const indices = await compareIndices(model, rest.slice(1), opts);
    const chart = opts.chart ? String(opts.chart).toLowerCase() : '';
    if (chart && !['b', 'm'].includes(chart)) throw new NvoError('--chart приема b или m', 2);
    const theme = opts.theme ? String(opts.theme).toLowerCase() : '';
    if (theme && !['light', 'dark'].includes(theme)) throw new NvoError('--theme приема light или dark', 2);
    const o = { chart, theme, year: model.timeTravelYear };
    ctx.print(opts.src ? embedSrc(model, indices, o) : embedCode(model, indices, o));
    return 0;
  },
  complete: async ({ word, prev, pos }) => {
    if (prev === '--chart') return ['b', 'm'];
    if (prev === '--theme') return ['light', 'dark'];
    if (prev === '-c') return citySlugs(word);
    if (pos === 0) return GRADES.map(String);
    return schoolCodes(word);
  },
});

const ABOUT_SECTIONS = ['metodologia', 'danni', 'obhvat', 'kontakti', 'podkrepa', 'vrazki'];
const TARGETS = ['home', 'school', 'compare', 'balove', 'stats', 'blog', 'api', 'embed', 'about', '4', '7', '10', '12'];

/** Път в сайта по описание: "school 2207", "7 sofia", "7 2025", "balove sofia --school X", ... */
async function targetPath(args, opts) {
  const [what, ...rest] = args;
  if (!what || what === 'home') return '';
  if (isGrade(what)) {
    const g = Number(what);
    if (opts.y && rest.length) return PATHS.history(g, parseYear(opts.y), (await resolveCity(rest.join(' '))).slug);
    if (opts.y) return PATHS.history(g, parseYear(opts.y));
    if (!rest.length) return PATHS.grade(g);
    if (/^\d{4}$/.test(rest[0])) return PATHS.yearPage(g, rest[0]);
    const city = await resolveCity(rest.join(' '));
    return opts.page ? PATHS.cityPage(g, city.slug) : PATHS.city(g, city.slug);
  }
  switch (what) {
    case 'school': return PATHS.school((await resolveSchool(rest.join(' '))).code);
    case 'compare': {
      if (!rest.length) throw new NvoError('compare КЛАС КОДОВЕ...', 2);
      const g = parseGrade(rest[0]);
      const codes = [];
      for (const a of rest.slice(1)) codes.push((await resolveSchool(a)).code);
      return PATHS.compare(g, codes);
    }
    case 'balove': {
      if (!rest.length) return PATHS.balove();
      const city = await resolveCity(rest[0]);
      const school = opts.school ? (await resolveSchool(opts.school)).code : null;
      return PATHS.balove(city.slug, school, opts.p || opts.profile || null, !!opts.gender);
    }
    case 'stats': return PATHS.stats(rest[0] ? parseGrade(rest[0]) : null);
    case 'blog': return PATHS.blog(rest[0] || '');
    case 'api': return PATHS.api() + (rest[0] ? rest[0].replace(/^\/+/, '') : '');
    case 'embed': return PATHS.embed();
    case 'about': {
      if (rest[0] && !ABOUT_SECTIONS.includes(rest[0])) throw new NvoError('раздели: ' + ABOUT_SECTIONS.join(', '), 2);
      return PATHS.about(rest[0]);
    }
    default: throw new NvoError("непозната цел '" + what + "' - " + TARGETS.join(', '), 2);
  }
}

const LINK_HELP = {
  usage: 'nvo link ЦЕЛ... | nvo open ЦЕЛ...',
  description: 'Цели: home; КЛАС [ГРАД] (графиката и класацията на града); КЛАС ГОДИНА (страницата за годината); КЛАС ГРАД --page (класацията на града); КЛАС [ГРАД] -y ГОДИНА (исторически изглед); school КОД|ИМЕ; compare КЛАС КОДОВЕ...; balove [ГРАД] [--school КОД] [-p ПРОФИЛ] [--gender]; stats [КЛАС]; blog [SLUG]; api [ПЪТ]; embed; about [РАЗДЕЛ].',
  options: [['--page', 'класацията на града (/КЛАС/ГРАД/), не графиката'], ['-y ГОДИНА', 'исторически изглед'], ['--school КОД', 'за balove: избраното училище'], ['-p ПРОФИЛ', 'за balove: паралелката'], ['--gender', 'за balove: по пол']],
  opts: { short: 'y:p:', long: ['page', 'school=', 'profile=', 'gender'] },
  complete: async ({ word, pos, args }) => {
    if (pos === 0) return TARGETS;
    if (args[0] === 'school') return schoolCodes(word);
    if (args[0] === 'about') return ABOUT_SECTIONS;
    if (args[0] === 'stats') return GRADES.map(String);
    if (isGrade(args[0]) || args[0] === 'balove') return citySlugs(word);
    return [];
  },
};

defineSub({
  name: 'link',
  aliases: ['url'],
  summary: 'адресът на страница от сайта',
  ...LINK_HELP,
  examples: [['nvo link school смг', ''], ['nvo link 7 sofia', ''], ['nvo link balove sofia --school 2216306 | pbcopy', '']],
  async run(ctx, opts, rest) {
    ctx.print(link(await targetPath(rest, opts)));
    return 0;
  },
});

defineSub({
  name: 'open',
  aliases: ['go'],
  summary: 'отваря страница от сайта в нов таб',
  ...LINK_HELP,
  examples: [['nvo open school 2216306', ''], ['nvo open 7 plovdiv', ''], ['nvo open 12 2025', ''], ['nvo open stats 12', '']],
  async run(ctx, opts, rest) {
    const url = link(await targetPath(rest, opts));
    window.open(url, '_blank', 'noopener');
    ctx.print('Отваря се ' + url);
    return 0;
  },
});

