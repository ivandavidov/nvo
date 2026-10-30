// nvo blog, about, api, joke, version - текстовете на сайта (четат се от самите страници),
// суровото API и дребните.

import { randomJoke } from '../../core/jokes.js';
import { defineSub, NvoError, GRADE_LABEL, link, PATHS } from './core.js';
import { blogPosts, getText, apiIndex } from './data.js';
import { renderTable, outputMode, printJson } from './format.js';
import { jqRun, formatJson, JqError } from '../commands/jq.js';
import { width } from '../ansi.js';

/** Пренася текст на думи до w знака. */
function wrap(text, w, indent = '') {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = indent;
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (width(line) + word.length + 1 > w && line.trim()) {
        out.push(line.replace(/\s+$/, ''));
        line = indent;
      }
      line += (line.trim() ? ' ' : '') + word;
    }
    out.push(line.replace(/\s+$/, ''));
  }
  return out.join('\n');
}

/** HTML на статия → текст за терминала: заглавия, абзаци, списъци, таблици; графиките - като "[графика]". */
export function htmlToText(root, c, cols) {
  const w = Math.min(cols, 100);
  const parts = [];
  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const walk = (el) => {
    for (const node of el.children) {
      const tag = node.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'template', 'button', 'nav', 'svg'].includes(tag)) continue;
      if (node.matches('.article-toc, .article-end, .share, [aria-hidden="true"], .copy-btn')) continue;
      if (node.matches('.chart-card, figure, canvas, [id^="chart"], .highcharts-container') || node.querySelector(':scope > canvas')) {
        const cap = node.querySelector('h3, h4, figcaption, .chart-card__title');
        parts.push(c.muted('[графика' + (cap ? ': ' + clean(cap.textContent) : '') + ']'));
        continue;
      }
      if (/^h[1-6]$/.test(tag)) {
        const t = clean(node.textContent);
        if (t) parts.push((tag === 'h1' || tag === 'h2' ? '\n' : '') + c.bold(t));
      } else if (tag === 'p' || tag === 'blockquote') {
        const t = clean(node.textContent);
        if (t) parts.push(wrap(t, w, tag === 'blockquote' ? '  | ' : ''));
      } else if (tag === 'ul' || tag === 'ol') {
        let k = 0;
        for (const li of node.querySelectorAll(':scope > li')) {
          k++;
          parts.push(wrap((tag === 'ol' ? k + '. ' : '- ') + clean(li.textContent), w, '').replace(/\n/g, '\n  '));
        }
      } else if (tag === 'table') {
        const rows = Array.from(node.querySelectorAll('tr')).map((tr) => Array.from(tr.children).map((td) => clean(td.textContent)));
        const n = Math.max(...rows.map((r) => r.length));
        const ws = [];
        for (let i = 0; i < n; i++) ws.push(Math.max(...rows.map((r) => width(r[i] || ''))));
        parts.push(rows.map((r, i) => {
          const line = r.map((cell, k) => cell + ' '.repeat(Math.max(0, ws[k] - width(cell)))).join('  ').replace(/\s+$/, '');
          return i === 0 ? c.bold(line) : line;
        }).join('\n'));
      } else if (node.children.length) {
        walk(node);
      } else {
        const t = clean(node.textContent);
        if (t && ['div', 'span', 'a', 'strong', 'em', 'small'].includes(tag)) parts.push(wrap(t, w));
      }
    }
  };
  walk(root);
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

async function postsSorted() {
  const data = await blogPosts();
  return data.posts.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

defineSub({
  name: 'blog',
  aliases: ['posts'],
  summary: 'постовете в блога; --read чете поста в конзолата',
  usage: 'nvo blog [SLUG|N] [--read] [--tag ТЕКСТ]',
  description: 'Без аргумент - списък (най-новите първо). С номер от списъка или slug - резюмето; с --read - целият текст (графиките остават на сайта).',
  options: [['--read', 'целият текст на поста (в less)'], ['--tag ТЕКСТ', 'само постовете с етикет, който съдържа текста']],
  examples: [['nvo blog', ''], ['nvo blog 1 --read', 'най-новият пост'], ['nvo blog --tag балове', '']],
  opts: { short: 'r', long: ['read', 'tag='] },
  positional: ['post'],
  async run(ctx, opts, rest) {
    let posts = await postsSorted();
    if (opts.tag) posts = posts.filter((p) => p.tag.toLowerCase().includes(String(opts.tag).toLowerCase()));
    const mode = outputMode(opts);
    if (!rest.length) {
      renderTable(ctx, {
        mode, wide: opts.wide || opts.w,
        title: 'Блог - ' + posts.length + ' поста',
        rows: posts.map((p, i) => ({ ...p, n: i + 1 })),
        notes: ['nvo blog N - резюмето, nvo blog N --read - целият текст'],
        columns: [
          { key: 'n', label: '№', align: 'right', get: (p) => p.n },
          { key: 'date', label: 'Дата', get: (p) => p.date },
          { key: 'title', label: 'Заглавие', get: (p) => p.title, flex: true },
          { key: 'tag', label: 'Етикет', get: (p) => p.tag, drop: 1 },
          { key: 'slug', label: 'slug', get: (p) => p.slug, drop: 2 },
        ],
        json: (rows) => rows.map((p) => ({ ...p, url: link(PATHS.blog(p.slug)) })),
      });
      return 0;
    }
    const key = rest[0];
    const post = /^\d+$/.test(key) ? posts[Number(key) - 1] : posts.find((p) => p.slug === key || p.slug.startsWith(key));
    if (!post) throw new NvoError("няма пост '" + key + "' (nvo blog изрежда постовете)");
    const url = link(PATHS.blog(post.slug));
    if (mode === 'json') {
      printJson(ctx, { ...post, url });
      return 0;
    }
    const c = ctx.c;
    let out = c.bold(post.title) + '\n' + c.muted(post.dateLabel + ' · ' + post.tag + ' · ' + post.info) + '\n\n';
    if (!(opts.read || opts.r)) {
      out += wrap(post.excerpt, Math.min(ctx.cols, 100)) + '\n\n' + c.muted('Целият текст: nvo blog ' + post.slug + ' --read') + '\n' + c.link(url) + '\n';
      ctx.out(out);
      return 0;
    }
    const html = await getText(PATHS.blog(post.slug));
    const docEl = new DOMParser().parseFromString(html, 'text/html');
    const article = docEl.querySelector('article, .article, main') || docEl.body;
    const h1 = article.querySelector('h1');
    if (h1) h1.remove();
    out += htmlToText(article, c, Number.isFinite(ctx.cols) ? ctx.cols : 100) + '\n' + c.link(url) + '\n';
    if (ctx.isTTY) await ctx.term.pager(out, { title: post.slug });
    else ctx.out(out);
    return 0;
  },
  complete: async ({ word }) => (await postsSorted()).map((p) => ({ value: p.slug, desc: p.title })).filter((p) => p.value.startsWith(word)),
});

const ABOUT = { metodologia: 'Методология', danni: 'Данни', obhvat: 'Обхват и корекции', kontakti: 'Контакти', podkrepa: 'Подкрепа', vrazki: 'Връзки' };

defineSub({
  name: 'about',
  summary: 'текстът на "За проекта" - методология, данни, обхват, контакти',
  usage: 'nvo about [РАЗДЕЛ | --all]',
  description: 'Чете страницата /za-proekta/. Раздели: ' + Object.keys(ABOUT).join(', ') + '.',
  examples: [['nvo about', 'разделите'], ['nvo about metodologia', ''], ['nvo about --all | less', '']],
  opts: { short: '', long: ['all'] },
  positional: ['section'],
  async run(ctx, opts, rest) {
    const html = await getText(PATHS.about());
    const docEl = new DOMParser().parseFromString(html, 'text/html');
    const sections = Array.from(docEl.querySelectorAll('section[id], [id].za-section, main [id]')).filter((el) => ABOUT[el.id]);
    const c = ctx.c;
    if (!rest.length && !opts.all) {
      renderTable(ctx, {
        mode: outputMode(opts),
        title: 'За проекта - ' + link(PATHS.about()),
        rows: sections.map((s) => ({ id: s.id, title: (s.querySelector('h2, h3') || {}).textContent || ABOUT[s.id] })),
        notes: ['nvo about РАЗДЕЛ - текстът на раздела'],
        columns: [
          { key: 'id', label: 'Раздел', get: (r) => r.id, color: (t) => c.cyan(t) },
          { key: 'title', label: 'Заглавие', get: (r) => r.title.replace(/\s+/g, ' ').trim(), flex: true },
        ],
      });
      return 0;
    }
    const chosen = opts.all ? sections : sections.filter((s) => s.id === rest[0]);
    if (!chosen.length) throw new NvoError("няма раздел '" + rest[0] + "' - " + Object.keys(ABOUT).join(', '), 2);
    const cols = Number.isFinite(ctx.cols) ? ctx.cols : 100;
    const out = chosen.map((s) => htmlToText(s, c, cols)).join('\n') + '\n' + c.link(link(PATHS.about(chosen.length === 1 ? chosen[0].id : ''))) + '\n';
    if (ctx.isTTY && out.split('\n').length > ctx.term.rows) await ctx.term.pager(out, { title: 'За проекта' });
    else ctx.out(out);
    return 0;
  },
  complete: async () => Object.keys(ABOUT),
});

const ENDPOINTS = [
  ['index.json', 'описание на API-то: изпитите, годините, години без изпит'],
  ['schools.json', 'всички училища: имена, вид, град, статус, сайт'],
  ['schools-index.json', 'кратък списък на училищата (за търсене)'],
  ['schools/{код}.json', 'профил на училище по изпити: резултати, места, медиана'],
  ['cities.json', 'всички градове'],
  ['cities/{град}.json', 'един град'],
  ['{клас}/data.json', 'резултатите на всички училища за клас'],
  ['{клас}/{град}/data.json', 'резултатите в един град'],
  ['{клас}/{град}/{код}.json', 'резултатите на едно училище'],
  ['rankings/{клас}/{година}.json', 'класацията за година'],
  ['rankings/median/{клас}/{година}.json', 'класацията по медиана за 3 години'],
  ['balove/index.json', 'градовете с балове след 7 клас'],
  ['balove/{град}.json', 'баловете в един град'],
  ['balove/data.json', 'баловете във всички градове (голям файл)'],
];

defineSub({
  name: 'api',
  summary: 'суровият JSON от API-то на сайта (с jq филтър)',
  usage: 'nvo api [ПЪТ] [JQ-ФИЛТЪР]',
  description: 'Без ПЪТ - списъкът на адресите. ПЪТ е спрямо api/v1/ (".json" може да се пропусне). ФИЛТЪР е като в jq.',
  options: [['-r', 'низовете без кавички (като jq -r)'], ['-c', 'компактно']],
  examples: [['nvo api', ''], ['nvo api index .grades[0]', ''], ["nvo api schools/2216306 '.grades[\"7\"].nationalRanks'", ''], ['nvo api rankings/7/2026 ".schools[:3] | .[].fullName" -r', '']],
  opts: { short: 'rc', long: ['raw'] },
  positional: ['path'],
  async run(ctx, opts, rest) {
    if (!rest.length) {
      renderTable(ctx, {
        mode: outputMode(opts),
        title: 'JSON API - ' + link(PATHS.api()),
        rows: ENDPOINTS,
        notes: ['nvo api ПЪТ [ФИЛТЪР] - съдържанието; curl api/v1/ПЪТ също работи'],
        columns: [
          { key: 'path', label: 'Адрес (api/v1/...)', get: (e) => e[0], color: (t) => ctx.c.cyan(t) },
          { key: 'desc', label: 'Съдържание', get: (e) => e[1], flex: true },
        ],
      });
      return 0;
    }
    let path = rest[0].replace(/^\/+/, '').replace(/^(nvo\/)?api\/v1\//, '');
    if (!/\.[a-z]+$/i.test(path)) path += '.json';
    const text = await getText('api/v1/' + path);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      ctx.out(text);
      return 0;
    }
    const filter = rest.slice(1).join(' ') || '.';
    let results;
    try {
      results = jqRun(filter, data);
    } catch (e) {
      if (e instanceof JqError) throw new NvoError('филтър: ' + e.message, 2);
      throw e;
    }
    const raw = opts.r || opts.raw;
    ctx.out(results.map((v) => (raw && typeof v === 'string' ? v : formatJson(v, { c: ctx.c, compact: !!opts.c }))).join('\n') + '\n');
    return 0;
  },
  complete: async ({ word }) => ['index', 'schools', 'schools-index', 'schools/', 'cities', 'cities/', '4/', '7/', '10/', '12/', 'rankings/', 'rankings/median/', 'balove/index', 'balove/'].filter((p) => p.startsWith(word)).map((p) => ({ value: p, suffix: p.endsWith('/') ? '' : ' ' })),
});

defineSub({
  name: 'joke',
  aliases: ['fortune'],
  summary: 'виц (същите като във футъра)',
  usage: 'nvo joke',
  run(ctx) {
    const j = randomJoke();
    ctx.print(j.q + '\n\t\t-- ' + j.a);
    return 0;
  },
});

defineSub({
  name: 'version',
  summary: 'версията и последните данни',
  usage: 'nvo version',
  async run(ctx) {
    const index = await apiIndex();
    ctx.print('nvo 2.0 - конзолата на "НВО и ДЗИ"');
    ctx.print('Данни: ' + index.grades.map((g) => GRADE_LABEL[g.grade] + ' ' + g.yearsRange[g.yearsRange.length - 1]).join(', '));
    ctx.print('Сайт: ' + link(''));
    return 0;
  },
});
