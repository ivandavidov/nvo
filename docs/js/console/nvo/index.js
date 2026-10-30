// nvo - "двоичният файл" на конзолата: всичко, което сайтът може, като текстови команди.
// Подкомандите са в отделни модули (defineSub); тук са разборът на опциите, помощта и Tab.

import { define, getopt, UsageError, helpText } from '../registry.js';
import { palette } from '../ansi.js';
import { SUBS, uniqueSubs, NvoError } from './core.js';
import './schools.js';
import './rank.js';
import './export.js';
import './balove.js';
import './stats.js';
import './content.js';

const COMMON = { short: 'n:wh', long: ['json', 'csv', 'tsv', 'spark', 'wide', 'all-years', 'help', 'no-color'] };

const COMMON_OPTIONS = [
  ['--json, --csv, --tsv', 'данни вместо таблица (за jq, cut, sort, awk)'],
  ['-n N', 'най-много N реда'],
  ['-w, --wide', 'без съкращаване и скриване на колони'],
  ['--spark', 'мини-тенденции ▁▃▅▇ (където има години)'],
  ['--no-color', 'без цветове'],
  ['-h, --help', 'помощ за подкомандата'],
];

function specFor(sub) {
  const s = sub.opts || {};
  return { short: COMMON.short + (s.short || ''), long: COMMON.long.concat(s.long || []), multi: s.multi || '' };
}

function subHelp(sub) {
  return helpText({
    usage: sub.usage,
    summary: sub.summary,
    description: sub.description + (sub.aliases && sub.aliases.length ? '\nСиноними: ' + sub.aliases.join(', ') + '.' : ''),
    options: (sub.options || []).concat(COMMON_OPTIONS),
    examples: sub.examples,
  });
}

function overview(c) {
  const subs = uniqueSubs();
  const w = Math.max(...subs.map((s) => s.name.length));
  let out = c.bold('nvo') + ' - данните на сайта "НВО и ДЗИ" в конзолата\n\nУпотреба: nvo ПОДКОМАНДА [АРГУМЕНТИ] [ОПЦИИ]\n\nПодкоманди:\n';
  for (const s of subs) out += '  ' + c.cyan(s.name.padEnd(w)) + '  ' + s.summary + '\n';
  out += '\nАргументи: КЛАС е 4, 7, 10 или 12; ГРАД - slug (sofia), име (София) или латиница (stara zagora);\n';
  out += 'УЧИЛИЩЕ - код или част от името ("пмг пловдив"); ВИДОВЕ - д, о, ч, ду (или s, m, p, r).\n';
  out += '\nОбщи опции:\n' + COMMON_OPTIONS.map(([a, b]) => '  ' + a.padEnd(22) + b).join('\n') + '\n';
  out += '\nnvo help ПОДКОМАНДА или nvo ПОДКОМАНДА --help - подробна помощ. man nvo - всичко на едно място.\n';
  out += '\nПримери:\n  nvo search смг\n  nvo school 2216306 --spark\n  nvo rank 7 sofia -n 10\n  nvo compare 7 --top 5 -c sofia\n  nvo export csv 7 sofia\n  nvo rank 7 sofia --tsv | cut -f2,3 | head\n';
  return out;
}

/** Пълният текст за man nvo: общият преглед и помощта на всяка подкоманда. */
function manText() {
  return uniqueSubs().map((s) => 'nvo ' + s.name + '\n' + subHelp(s).replace(/^/gm, '    ')).join('\n');
}

/** Позицията на думата под курсора сред аргументите на подкомандата (без опциите и стойностите им). */
function positionInfo(sub, args) {
  const spec = specFor(sub);
  const withValue = new Set();
  for (let i = 0; i < spec.short.length; i++) if (spec.short[i + 1] === ':') withValue.add('-' + spec.short[i]);
  for (const l of spec.long) if (l.endsWith('=')) withValue.add('--' + l.slice(0, -1));
  let pos = 0;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (withValue.has(a)) {
      i++;
      continue;
    }
    if (a.startsWith('-') && a.length > 1) continue;
    positional.push(a);
    pos++;
  }
  const prev = args.length ? args[args.length - 1] : '';
  return { pos, prev: withValue.has(prev) ? prev : '', positional };
}

define({
  name: 'nvo',
  group: 'nvo',
  rawArgs: true,
  summary: 'данните на сайта: търсене, училища, класации, средни, сравнение, изтегляне, блог, API',
  usage: 'nvo ПОДКОМАНДА [АРГУМЕНТИ] [ОПЦИИ]',
  get description() {
    return 'Всичко, което сайтът показва, като текст - без графиките (вместо тях: таблици и --spark).\n\n' + manText();
  },
  options: COMMON_OPTIONS,
  examples: [['nvo help', 'подкомандите'], ['nvo search пмг', ''], ['nvo rank 7 sofia -n 10', ''], ['nvo school смг', '']],
  seeAlso: ['jq', 'grep', 'sort', 'cut'],
  async run(ctx) {
    const args = ctx.args.slice();
    const first = args.shift();
    if (!first || first === '-h' || first === '--help' || (first === 'help' && !args.length)) {
      ctx.out(overview(ctx.c));
      return 0;
    }
    if (first === '--version' || first === '-V') return SUBS.get('version').run(ctx, {}, []);
    let sub = SUBS.get(first);
    if (first === 'help') {
      sub = SUBS.get(args[0]);
      if (!sub) {
        ctx.err("непозната подкоманда '" + args[0] + "'. Опитайте 'nvo help'.");
        return 2;
      }
      ctx.out(subHelp(sub));
      return 0;
    }
    if (!sub) {
      ctx.err("непозната подкоманда '" + first + "'. Опитайте 'nvo help'.");
      return 2;
    }
    if (args.includes('--help') || args.includes('-h')) {
      ctx.out(subHelp(sub));
      return 0;
    }
    let parsed;
    try {
      parsed = getopt(args, specFor(sub));
    } catch (e) {
      if (!(e instanceof UsageError)) throw e;
      ctx.err(sub.name + ': ' + e.message);
      ctx.io.stderr.write("Опитайте 'nvo " + sub.name + " --help'.\n");
      return 2;
    }
    if (parsed.opts['no-color']) ctx.c = palette(false);
    if (parsed.opts.n !== undefined && !(Number(parsed.opts.n) > 0)) {
      ctx.err(sub.name + ": -n изисква положително число");
      return 2;
    }
    try {
      const r = await sub.run(ctx, parsed.opts, parsed.rest);
      return typeof r === 'number' ? r : 0;
    } catch (e) {
      if (!(e instanceof NvoError)) throw e;
      ctx.err(sub.name + ': ' + e.message);
      if (e.code === 2) ctx.io.stderr.write("Опитайте 'nvo " + sub.name + " --help'.\n");
      return e.code;
    }
  },
  async complete({ word, args }) {
    if (!args.length) {
      return uniqueSubs().map((s) => ({ value: s.name, desc: s.summary })).filter((s) => s.value.startsWith(word));
    }
    const sub = SUBS.get(args[0]);
    if (!sub) return [];
    const subArgs = args.slice(1);
    if (word.startsWith('-')) {
      const spec = specFor(sub);
      const longs = spec.long.map((l) => '--' + l.replace(/=\??$/, ''));
      return longs.filter((l) => l.startsWith(word));
    }
    if (!sub.complete) return [];
    const info = positionInfo(sub, subArgs);
    const res = await sub.complete({ word, args: info.positional, pos: info.pos, prev: info.prev });
    if (!res) return null;
    return res.map((r) => (typeof r === 'string' ? { value: r } : r)).filter((r) => r.value.startsWith(word));
  },
});
