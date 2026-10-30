// Връзка с браузъра: open (нов таб), download (файл от конзолата към компютъра), клипборд.

import { define } from '../registry.js';
import { FsError, basename, isBinary } from '../vfs.js';
import { resolveUrl } from './net.js';

define({
  name: 'open',
  aliases: ['xdg-open'],
  group: 'browser',
  summary: 'отваря адрес в нов таб',
  usage: 'open АДРЕС...',
  description: 'АДРЕС е път в сайта (7/sofia/, school/2207/) или https:// адрес.',
  examples: [['open 7/', 'страницата за 7 клас'], ['open https://github.com/ivandavidov/nvo', '']],
  run(ctx) {
    if (!ctx.args.length) return ctx.fail('липсва адрес');
    let st = 0;
    for (const a of ctx.args) {
      let url;
      try {
        url = resolveUrl(a);
      } catch (e) {
        ctx.err(e.message);
        st = 1;
        continue;
      }
      window.open(url.href, '_blank', 'noopener');
      ctx.print('Отваря се ' + url.href);
    }
    return st;
  },
});

function mimeFor(name, binary) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = { json: 'application/json', csv: 'text/csv', tsv: 'text/tab-separated-values', txt: 'text/plain', html: 'text/html', md: 'text/markdown', pdf: 'application/pdf', png: 'image/png', svg: 'image/svg+xml', sh: 'text/x-sh' };
  return (map[ext] || (binary ? 'application/octet-stream' : 'text/plain')) + (binary ? '' : ';charset=utf-8');
}

export function saveToComputer(name, content) {
  const binary = isBinary(content);
  const blob = new Blob([content], { type: mimeFor(name, binary) });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

define({
  name: 'download',
  group: 'browser',
  summary: 'сваля файл от конзолата на компютъра',
  usage: 'download ФАЙЛ [ИМЕ]',
  description: 'Без ФАЙЛ сваля stdin: "nvo rank 7 sofia | download класация.txt".',
  examples: [['download ~/бележка.txt', ''], ['cat данни.csv | download данни.csv', '']],
  async run(ctx) {
    if (!ctx.args.length) return ctx.fail('употреба: download ФАЙЛ [ИМЕ]');
    if (ctx.stdin !== null && ctx.args.length === 1 && !(await ctx.fs.exists(ctx.resolve(ctx.args[0])))) {
      saveToComputer(ctx.args[0], ctx.stdin);
      ctx.io.stderr.write('Сваля се ' + ctx.args[0] + '\n');
      return 0;
    }
    const [file, name] = ctx.args;
    try {
      const abs = ctx.resolve(file);
      const node = await ctx.fs.lookup(abs);
      if (node.type === 'dir') return ctx.fail(file + ': Е директория (свалят се само файлове)');
      const content = await ctx.fs.readFile(abs);
      const target = name || basename(abs);
      saveToComputer(target, content);
      ctx.io.stderr.write('Сваля се ' + target + '\n');
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      return ctx.fail(file + ': ' + e.message);
    }
    return 0;
  },
});

define({
  name: 'pbcopy',
  aliases: ['xclip', 'xsel', 'wl-copy', 'clip'],
  group: 'browser',
  summary: 'копира stdin в клипборда',
  usage: 'КОМАНДА | pbcopy',
  description: 'С "xclip -o" или "xsel -o" работи като pbpaste.',
  examples: [['nvo embed 7 2207 | pbcopy', ''], ['pwd | pbcopy', '']],
  async run(ctx) {
    if ((ctx.name === 'xclip' || ctx.name === 'xsel') && (ctx.args.includes('-o') || ctx.args.includes('--output'))) return paste(ctx);
    const text = await ctx.readAll();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return ctx.fail('клипбордът не е достъпен (браузърът не разреши запис)');
    }
    if (ctx.isTTY) ctx.io.stderr.write('Копирани ' + Array.from(text).length + ' знака.\n');
    return 0;
  },
});

async function paste(ctx) {
  try {
    ctx.out(await navigator.clipboard.readText());
  } catch {
    return ctx.fail('клипбордът не е достъпен (разрешете четенето в браузъра)');
  }
  return 0;
}

define({
  name: 'pbpaste',
  aliases: ['wl-paste'],
  group: 'browser',
  summary: 'извежда съдържанието на клипборда',
  usage: 'pbpaste',
  run: (ctx) => paste(ctx),
});
