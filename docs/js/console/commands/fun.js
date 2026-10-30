// Забавните: fortune (вицовете от футъра на сайта), cowsay, neofetch, sudo, vim/emacs.

import { define } from '../registry.js';
import { width, padEnd } from '../ansi.js';
import { USER as USERNAME } from '../vfs.js';
import { randomJoke } from '../../core/jokes.js';
import { OS_NAME, OS_VERSION, KERNEL, currentTheme, uptimeSeconds } from './sys.js';

define({
  name: 'fortune',
  group: 'fun',
  summary: 'случаен виц (същите като във футъра на сайта)',
  usage: 'fortune',
  examples: [['fortune | cowsay', '']],
  run(ctx) {
    const j = randomJoke();
    ctx.print(j.q + '\n\t\t-- ' + j.a);
  },
});

function wrap(text, w) {
  const lines = [];
  for (const para of text.replace(/\t/g, '    ').split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (line && Array.from(line + ' ' + word).length > w) {
        lines.push(line);
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
      while (Array.from(line).length > w) {
        lines.push(Array.from(line).slice(0, w).join(''));
        line = Array.from(line).slice(w).join('');
      }
    }
    lines.push(line);
  }
  return lines;
}

define({
  name: 'cowsay',
  group: 'fun',
  summary: 'кравата казва текст',
  usage: 'cowsay [ТЕКСТ]',
  async run(ctx) {
    const text = ctx.args.length ? ctx.args.join(' ') : (await ctx.readAll()).replace(/\n$/, '');
    const lines = wrap(text || '...', 40);
    const w = Math.max(...lines.map((l) => width(l)));
    let out = ' ' + '_'.repeat(w + 2) + '\n';
    if (lines.length === 1) {
      out += '< ' + lines[0] + ' >\n';
    } else {
      lines.forEach((l, i) => {
        const [a, b] = i === 0 ? ['/', '\\'] : i === lines.length - 1 ? ['\\', '/'] : ['|', '|'];
        out += a + ' ' + padEnd(l, w) + ' ' + b + '\n';
      });
    }
    out += ' ' + '-'.repeat(w + 2) + '\n';
    out += '        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||\n';
    ctx.out(out);
  },
});

function browserName() {
  const ua = navigator.userAgent;
  const m = /(Edg|OPR|Firefox|Chrome|Version)\/(\d+)/.exec(ua);
  if (!m) return 'браузър';
  const names = { Edg: 'Edge', OPR: 'Opera', Firefox: 'Firefox', Chrome: 'Chrome', Version: 'Safari' };
  return names[m[1]] + ' ' + m[2];
}

define({
  name: 'neofetch',
  aliases: ['fastfetch'],
  group: 'fun',
  summary: 'информация за системата с лого',
  usage: 'neofetch',
  run(ctx) {
    const c = ctx.c;
    const secs = uptimeSeconds(ctx.sh);
    const logo = [
      '  _   ___     ______  ',
      ' | \\ | \\ \\   / / __ \\ ',
      ' |  \\| |\\ \\ / / |  | |',
      ' | . ` | \\ \\/ /| |  | |',
      ' | |\\  |  \\  / | |__| |',
      ' |_| \\_|   \\/   \\____/ ',
      '                       ',
      '   НВО и ДЗИ - 2026    ',
    ];
    const title = USERNAME + '@' + (ctx.sh.env.HOSTNAME || 'nvo');
    const info = [
      c.boldGreen(USERNAME) + '@' + c.boldGreen(ctx.sh.env.HOSTNAME || 'nvo'),
      '-'.repeat(title.length),
      c.boldGreen('ОС') + ': ' + OS_NAME + ' ' + OS_VERSION + ' x86_64',
      c.boldGreen('Хост') + ': ' + browserName(),
      c.boldGreen('Ядро') + ': ' + KERNEL,
      c.boldGreen('Работи') + ': ' + Math.floor(secs / 60) + ' мин',
      c.boldGreen('Обвивка') + ': nvo-sh ' + OS_VERSION,
      c.boldGreen('Екран') + ': ' + screen.width + 'x' + screen.height,
      c.boldGreen('Терминал') + ': nvo-term ' + ctx.term.cols + 'x' + ctx.term.rows,
      c.boldGreen('Тема') + ': ' + (currentTheme() === 'dark' ? 'тъмна' : 'светла'),
      c.boldGreen('Процесор') + ': ' + (navigator.hardwareConcurrency || '?') + ' ядра',
      c.boldGreen('Памет') + ': ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GiB' : 'неизвестна'),
      c.boldGreen('Език') + ': ' + (navigator.language || 'bg'),
      '',
      c.on ? [0, 1, 2, 3, 4, 5, 6, 7].map((n) => '\x1b[4' + n + 'm   ').join('') + '\x1b[0m' : '',
    ];
    const narrow = ctx.cols < 60;
    let out = '';
    if (narrow) {
      out = logo.map((l) => c.boldGreen(l)).join('\n') + '\n\n' + info.join('\n') + '\n';
    } else {
      const n = Math.max(logo.length, info.length);
      for (let i = 0; i < n; i++) out += c.boldGreen(logo[i] || ' '.repeat(23)) + '   ' + (info[i] || '') + '\n';
    }
    ctx.out(out);
  },
});


define({
  name: 'sudo',
  aliases: ['su', 'doas'],
  group: 'fun',
  summary: 'права на администратор (няма да стане)',
  usage: 'sudo КОМАНДА',
  rawArgs: true,
  run(ctx) {
    ctx.err(USERNAME + ' не е във файла sudoers. Този инцидент ще бъде докладван.');
    return 1;
  },
});

define({
  name: 'vim',
  aliases: ['vi', 'nvim', 'emacs', 'ed', 'pico'],
  group: 'fun',
  summary: 'не е инсталиран - ползвайте nano',
  usage: 'vim ФАЙЛ',
  rawArgs: true,
  run(ctx) {
    if (ctx.name === 'emacs') ctx.err('не е инсталиран. Добра операционна система, само ѝ липсва добър редактор - ползвайте "nano ФАЙЛ".');
    else ctx.err('не е инсталиран в ' + OS_NAME + ". Ползвайте 'nano " + (ctx.args[0] || 'ФАЙЛ') + "' (а за изход от vim никога не е късно да се научи :q!).");
    return 1;
  },
});
