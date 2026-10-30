// /nvo - данните на сайта като файлова система само за четене. Всеки файл е изходът на съответната
// nvo команда (създава се при четене), а /nvo/api/v1/ са суровите JSON файлове на API-то.
// Големите директории са "heavy": grep -r, find, tree и du не влизат в тях, ако не са изрично началото.

import { DISPLAY_FROM } from '../../core/config.js';
import { searchIndex, apiIndex, baloveIndex, blogPosts, getText } from './data.js';
import { STATS_KEYS } from './stats.js';

const GRADES = ['4', '7', '10', '12'];

const README = [
  'Данните на сайта "НВО и ДЗИ" като файлове (само за четене).',
  'Всеки файл е изходът на nvo команда - създава се, когато го прочетете.',
  '',
  '  /nvo/КЛАС/ГРАД/ranking     nvo rank КЛАС ГРАД      класацията в града',
  '  /nvo/КЛАС/ГРАД/averages    nvo avg КЛАС ГРАД       средните резултати',
  '  /nvo/КЛАС/ГРАД/data.csv    nvo export csv ...      данните (CSV, всички години)',
  '  /nvo/КЛАС/years/ГОДИНА     nvo rank КЛАС -y ГОДИНА класацията в страната',
  '  /nvo/school/КОД            nvo school КОД          профил на училище',
  '  /nvo/balove/ГРАД           nvo balove ГРАД         топ паралелките',
  '  /nvo/blog/SLUG             nvo blog SLUG --read    текстът на поста',
  '  /nvo/stats/КЛАС/АНАЛИЗ     nvo stats КЛАС АНАЛИЗ   обобщената статистика',
  '  /nvo/api/v1/...            суровият JSON на API-то',
  '',
  'Примери:',
  '  ls /nvo/7',
  '  cat /nvo/7/sofia/ranking | head',
  '  grep -i смг /nvo/7/*/ranking',
  '  jq .grades /nvo/api/v1/index.json',
  '',
].join('\n');

const now = Date.now();

function file(read) {
  return { type: 'file', mode: 0o444, mtime: now, owner: 'root', read };
}

/** Динамична директория: names() → имена, make(name) → възел или null. Списъкът се кешира. */
function dir(names, make, opts = {}) {
  let cache = null;
  const made = new Map();
  const list = () => {
    if (!cache) {
      cache = Promise.resolve(names()).catch((e) => {
        cache = null;
        throw e;
      });
    }
    return cache;
  };
  return {
    type: 'dir',
    mode: 0o555,
    mtime: now,
    owner: 'root',
    ...opts,
    provider: {
      list,
      get: async (name) => {
        if (!(await list()).includes(name)) return null;
        if (!made.has(name)) made.set(name, make(name));
        return made.get(name);
      },
    },
  };
}

function staticDir(entries, opts = {}) {
  return dir(() => Object.keys(entries), (name) => entries[name](), opts);
}

/** run(cmd) → текстът, който командата извежда в pipe. */
export function mountNvo(fs, run) {
  const cmd = (line) => file(() => run(line));

  const gradeDir = (g) => dir(
    async () => {
      const index = await searchIndex();
      return ['years', ...index.cities.filter((c) => c.grades.includes(Number(g))).map((c) => c.slug)];
    },
    (name) => {
      if (name === 'years') {
        return dir(async () => {
          const info = (await apiIndex()).grades.find((x) => String(x.grade) === g);
          return info.yearsRange.filter((y) => y >= DISPLAY_FROM[g]).map(String);
        }, (y) => cmd('nvo rank ' + g + ' -y ' + y));
      }
      return staticDir({
        ranking: () => cmd('nvo rank ' + g + ' ' + name),
        averages: () => cmd('nvo avg ' + g + ' ' + name),
        'data.csv': () => cmd('nvo export csv ' + g + ' ' + name + ' -o -'),
      });
    },
  );

  const apiFile = (path) => file(() => getText('api/v1/' + path));
  const jsonFiles = (names) => names.map((n) => n + '.json');
  const apiDir = () => dir(
    () => ['index.json', 'schools.json', 'schools-index.json', 'cities.json', 'schools', 'cities', ...GRADES, 'rankings', 'balove'],
    (name) => {
      if (name.endsWith('.json')) return apiFile(name);
      if (name === 'schools') return dir(async () => jsonFiles((await searchIndex()).schools.map((s) => s.code)), (n) => apiFile('schools/' + n), { heavy: true });
      if (name === 'cities') return dir(async () => jsonFiles((await searchIndex()).cities.map((c) => c.slug)), (n) => apiFile('cities/' + n), { heavy: true });
      if (GRADES.includes(name)) {
        return dir(async () => ['data.json', ...(await searchIndex()).cities.filter((c) => c.grades.includes(Number(name))).map((c) => c.slug)], (n) => {
          if (n === 'data.json') return apiFile(name + '/data.json');
          return dir(async () => ['data.json', ...jsonFiles((await searchIndex()).schools.filter((s) => s.city && s.city.slug === n && s.grades.includes(Number(name))).map((s) => s.code))], (f) => apiFile(name + '/' + n + '/' + f));
        }, { heavy: true });
      }
      if (name === 'rankings') {
        const yearsOf = async (g, from) => jsonFiles((await apiIndex()).grades.find((x) => String(x.grade) === g).yearsRange.filter((y) => y >= from).map(String));
        return dir(() => [...GRADES, 'median'], (g) => {
          if (g === 'median') return dir(() => GRADES, (gg) => dir(() => yearsOf(gg, 2020), (f) => apiFile('rankings/median/' + gg + '/' + f)));
          return dir(() => yearsOf(g, 2018), (f) => apiFile('rankings/' + g + '/' + f));
        });
      }
      if (name === 'balove') return dir(async () => ['index.json', 'data.json', ...jsonFiles((await baloveIndex()).cities.map((c) => c.slug))], (n) => apiFile('balove/' + n), { heavy: true });
      return null;
    },
    { heavy: true },
  );

  const root = staticDir({
    README: () => file(async () => README),
    ...Object.fromEntries(GRADES.map((g) => [g, () => gradeDir(g)])),
    school: () => dir(async () => (await searchIndex()).schools.map((s) => s.code), (code) => cmd('nvo school ' + code), { heavy: true }),
    balove: () => dir(async () => (await baloveIndex()).cities.map((c) => c.slug), (slug) => cmd('nvo balove ' + slug), { heavy: true }),
    blog: () => dir(async () => (await blogPosts()).posts.map((p) => p.slug), (slug) => cmd('nvo blog ' + slug + ' --read')),
    stats: () => staticDir(Object.fromEntries(GRADES.map((g) => [g, () => dir(() => STATS_KEYS, (key) => cmd('nvo stats ' + g + ' ' + key))]))),
    api: () => staticDir({ v1: apiDir }, { heavy: true }),
  });
  fs.mount('/nvo', root);
}
