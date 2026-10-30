// Системни команди: help, man, whatis, apropos, which, clear, reset, date, cal, uptime, whoami, id,
// hostname, uname, sleep, true, false, test/[, theme, tput, env, printenv, ps, df, free, who, reboot.

import { define, lookup, uniqueSpecs, GROUPS, helpText, manPage } from '../registry.js';
import { palette, padEnd } from '../ansi.js';
import { normalize, HOME, USER } from '../vfs.js';
import { DAYS, DAYS_SHORT, MONTHS, MONTHS_SHORT, pad2, tzName, tzOffset, dateLong, humanSize } from './util.js';

const THEME_KEY = 'nvo-console-theme';
export const OS_NAME = 'NVO Linux';
export const OS_VERSION = '2.0';
export const KERNEL = '6.8.0-nvo';

const INTRO = {
  name: 'intro',
  summary: 'как работи конзолата',
  usage: 'man intro',
  description: [
    'Конзолата е скрита страница на сайта "НВО и ДЗИ": обвивка (nvo-sh), подобна на bash, с файлова система в браузъра.',
    'Не е свързана към истински компютър - всичко работи в този таб.',
    '',
    'ФАЙЛОВЕ',
    '    ~ (/home/ivan) се пази в браузъра (до 1 MB), /tmp - до затваряне на таба. Останалото е само за четене.',
    '    "download ФАЙЛ" сваля файл на компютъра, "nano ФАЙЛ" го редактира.',
    '',
    'ОБВИВКА',
    '    Pipes (|), ;, &&, ||, пренасочвания (> >> < 2> 2>&1 &>), променливи ($HOME, ${X:-стойност}, $?),',
    '    $(команда), $((1+2)), globs (*.txt), кавички и \\, псевдоними (alias), !! и !N от историята.',
    '    ~/.nvorc се изпълнява при всяко отваряне (като .bashrc).',
    '    Няма if, while, функции и фонови задачи (&) - за повтаряне има xargs.',
    '',
    'КЛАВИШИ',
    '    Tab - допълва (двоен Tab изрежда възможностите), ↑/↓ - история, Ctrl+R - търсене в историята,',
    '    Ctrl+C - прекъсва, Ctrl+L - изчиства екрана, Ctrl+A/E - начало/край на реда,',
    '    Ctrl+U/K - изтрива до началото/края, Ctrl+W или Alt+Backspace - изтрива думата, Ctrl+Y - поставя,',
    '    Ctrl+D на празен ред - изход. PgUp/PgDn - превърта.',
    '    На Windows и Linux Ctrl+W затваря таба на браузъра - ползвайте Alt+Backspace.',
    '    На телефон лентата отдолу дава Tab, стрелките, Ctrl, ^C, Esc и знаците | - / ~.',
    '',
    'МРЕЖА',
    '    curl и wget работят с адресите на сайта и с услуги, които позволяват достъп от браузър (CORS).',
    '    dig, nslookup и host питат DNS през HTTPS, ping мери времето за HTTP заявка.',
    '    ssh, telnet и nc не са възможни: браузърът не позволява директни TCP връзки.',
    '',
    'ПОМОЩ',
    '    help - всички команди, man КОМАНДА - ръководство, КОМАНДА --help - кратка помощ, apropos ДУМА - търсене.',
  ].join('\n'),
  seeAlso: ['help', 'sh', 'bash'],
};

export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'light' ? '#f5f7fb' : '#0a0e16');
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // без localStorage темата не се запомня
  }
  return t;
}

export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function uptimeSeconds(sh) {
  return Math.floor((Date.now() - sh.startedAt) / 1000);
}

function uptimeText(secs, long) {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (long) {
    const parts = [];
    if (d) parts.push(d + (d === 1 ? ' ден' : ' дни'));
    if (h) parts.push(h + (h === 1 ? ' час' : ' часа'));
    parts.push(m + (m === 1 ? ' минута' : ' минути'));
    return 'работи ' + parts.join(', ');
  }
  if (d) return d + (d === 1 ? ' ден, ' : ' дни, ') + h + ':' + pad2(m);
  if (h) return h + ':' + pad2(m);
  return m + ' мин';
}

define({
  name: 'help',
  group: 'shell',
  builtin: true,
  summary: 'списък с командите',
  usage: 'help [КОМАНДА]',
  complete: 'commands',
  run(ctx) {
    if (ctx.args.length) {
      let st = 0;
      for (const name of ctx.args) {
        const spec = lookup(name);
        if (spec) ctx.out(helpText(spec));
        else {
          ctx.err("няма помощ за '" + name + "'. Опитайте 'help' или 'man -k " + name + "'.");
          st = 1;
        }
      }
      return st;
    }
    const c = ctx.c;
    const specs = uniqueSpecs();
    let out = c.bold('nvo-sh ' + OS_VERSION) + ' - обвивката на конзолата на "НВО и ДЗИ"\n';
    out += 'man КОМАНДА - подробно ръководство, КОМАНДА --help - кратка помощ, man intro - как работи конзолата.\n';
    const nameW = 13;
    for (const [group, label] of GROUPS) {
      const list = specs.filter((s) => s.group === group);
      if (!list.length) continue;
      out += '\n' + c.bold(label) + '\n';
      for (const s of list) {
        const names = [s.name, ...(s.aliases || [])].join(', ');
        const shown = names.length > nameW ? s.name : names;
        out += '  ' + c.cyan(padEnd(shown, nameW)) + ' ' + s.summary + '\n';
      }
    }
    out += '\nКлавиши: Tab допълва, ↑/↓ история, Ctrl+R търси в историята, Ctrl+C прекъсва, Ctrl+L изчиства екрана.\n';
    ctx.out(out);
    return 0;
  },
});

define({
  name: 'man',
  group: 'system',
  summary: 'ръководство за команда',
  usage: 'man [-k ДУМА] [КОМАНДА]...',
  description: 'Показва ръководството в less (q - изход). "man -k ДУМА" търси в кратките описания.',
  options: [['-k ДУМА', 'търси команди по дума (като apropos)']],
  examples: [['man intro', 'как работи конзолата'], ['man grep', ''], ['man -k файл', '']],
  complete: (info) => [...uniqueSpecs().map((s) => s.name), 'intro'],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'k:f' });
    if (opts.k !== undefined) return apropos(ctx, [opts.k, ...rest]);
    if (opts.f) return whatis(ctx, rest);
    if (!rest.length) {
      ctx.err('Коя страница искате? Например: man ls, man intro');
      return 1;
    }
    let st = 0;
    const pages = [];
    for (const name of rest.filter((r) => !/^\d$/.test(r))) {
      const spec = name === 'intro' ? INTRO : lookup(name);
      if (!spec) {
        ctx.err('няма страница за ' + name);
        st = 16;
        continue;
      }
      pages.push(manPage(spec, palette(ctx.isTTY)));
    }
    if (!pages.length) return st;
    const text = pages.join('\n');
    if (ctx.isTTY) await ctx.term.pager(text, { title: 'man ' + rest.join(' ') });
    else ctx.out(text.replace(/\x1b\[[0-9;]*m/g, ''));
    return st;
  },
});

function apropos(ctx, words) {
  const needle = words.join(' ').toLowerCase();
  const found = uniqueSpecs().filter((s) => (s.name + ' ' + (s.aliases || []).join(' ') + ' ' + s.summary).toLowerCase().includes(needle));
  if (!found.length) {
    ctx.print(needle + ': нищо подходящо.');
    return 1;
  }
  const w = Math.max(...found.map((s) => s.name.length));
  for (const s of found) ctx.print(padEnd(s.name + ' (1)', w + 4) + ' - ' + s.summary);
  return 0;
}

function whatis(ctx, names) {
  let st = 0;
  for (const n of names) {
    const s = n === 'intro' ? INTRO : lookup(n);
    if (s) ctx.print(s.name + ' (1) - ' + s.summary);
    else {
      ctx.print(n + ': нищо подходящо.');
      st = 16;
    }
  }
  return st;
}

define({
  name: 'apropos',
  group: 'system',
  summary: 'търси команди по дума в описанията',
  usage: 'apropos ДУМА',
  run(ctx) {
    if (!ctx.args.length) return ctx.fail('какво да търся?');
    return apropos(ctx, ctx.args);
  },
});

define({
  name: 'whatis',
  group: 'system',
  summary: 'едноредово описание на команда',
  usage: 'whatis КОМАНДА...',
  complete: 'commands',
  run(ctx) {
    return whatis(ctx, ctx.args);
  },
});

define({
  name: 'which',
  aliases: ['command'],
  group: 'system',
  summary: 'къде е командата',
  usage: 'which КОМАНДА...',
  complete: 'commands',
  async run(ctx) {
    let st = 0;
    for (const name of ctx.args.filter((a) => a !== '-v' && a !== '-a')) {
      const spec = lookup(name);
      if (spec && spec.builtin) {
        if (ctx.name === 'command') ctx.print(name);
        else st = 1;
        continue;
      }
      if (spec) {
        ctx.print((spec.group === 'nvo' ? '/usr/local/bin/' : '/bin/') + name);
        continue;
      }
      let found = false;
      for (const dir of String(ctx.env.PATH || '').split(':')) {
        if (!dir) continue;
        const p = normalize(name, ctx.resolve(dir));
        try {
          const node = await ctx.fs.lookup(p);
          if (node.type === 'file' && node.mode & 0o111) {
            ctx.print(p);
            found = true;
            break;
          }
        } catch {
          // няма го в тази директория
        }
      }
      if (!found) st = 1;
    }
    return st;
  },
});

define({
  name: 'clear',
  group: 'system',
  summary: 'изчиства екрана',
  usage: 'clear',
  run(ctx) {
    ctx.out('\x1b[H\x1b[2J');
  },
});

define({
  name: 'reset',
  group: 'system',
  summary: 'връща терминала в начално състояние (екран, цветове)',
  usage: 'reset',
  run(ctx) {
    ctx.term.clear();
    ctx.term.resetStyle();
    ctx.term.measure();
  },
});

function formatDate(fmt, d, utc) {
  const get = {
    Y: () => (utc ? d.getUTCFullYear() : d.getFullYear()),
    m: () => (utc ? d.getUTCMonth() : d.getMonth()) + 1,
    d: () => (utc ? d.getUTCDate() : d.getDate()),
    H: () => (utc ? d.getUTCHours() : d.getHours()),
    M: () => (utc ? d.getUTCMinutes() : d.getMinutes()),
    S: () => (utc ? d.getUTCSeconds() : d.getSeconds()),
    w: () => (utc ? d.getUTCDay() : d.getDay()),
  };
  return fmt.replace(/%([a-zA-Z%+])/g, (m, ch) => {
    switch (ch) {
      case 'Y': return String(get.Y());
      case 'y': return pad2(get.Y() % 100);
      case 'm': return pad2(get.m());
      case 'd': return pad2(get.d());
      case 'e': return String(get.d()).padStart(2);
      case 'H': return pad2(get.H());
      case 'I': return pad2(((get.H() + 11) % 12) + 1);
      case 'M': return pad2(get.M());
      case 'S': return pad2(get.S());
      case 'a': return DAYS_SHORT[get.w()];
      case 'A': return DAYS[get.w()];
      case 'b': case 'h': return MONTHS_SHORT[get.m() - 1];
      case 'B': return MONTHS[get.m() - 1];
      case 'u': return String(get.w() || 7);
      case 'w': return String(get.w());
      case 'j': {
        const start = utc ? Date.UTC(get.Y(), 0, 1) : new Date(get.Y(), 0, 1).getTime();
        return String(Math.floor((d.getTime() - start) / 86400000) + 1).padStart(3, '0');
      }
      case 's': return String(Math.floor(d.getTime() / 1000));
      case 'F': return get.Y() + '-' + pad2(get.m()) + '-' + pad2(get.d());
      case 'T': return pad2(get.H()) + ':' + pad2(get.M()) + ':' + pad2(get.S());
      case 'R': return pad2(get.H()) + ':' + pad2(get.M());
      case 'D': return pad2(get.m()) + '/' + pad2(get.d()) + '/' + pad2(get.Y() % 100);
      case 'Z': return utc ? 'UTC' : tzName(d);
      case 'z': return utc ? '+0000' : tzOffset(d);
      case 'p': return get.H() < 12 ? 'AM' : 'PM';
      case 'n': return '\n';
      case 't': return '\t';
      case '%': return '%';
      default: return m;
    }
  });
}

define({
  name: 'date',
  group: 'system',
  summary: 'показва датата и часа',
  usage: 'date [-u] [-I] [-d ДАТА] [+ФОРМАТ]',
  description: 'ФОРМАТ: %Y година, %m месец, %d ден, %H:%M:%S час, %a/%A ден от седмицата, %b/%B месец с думи, %F = %Y-%m-%d, %T = %H:%M:%S, %s секунди от 1970, %j ден от годината, %Z зона.',
  options: [['-u', 'в UTC'], ['-I', 'ISO 8601 (2026-10-31)'], ['-R', 'RFC 5322'], ['-d ДАТА', 'показва дадена дата вместо сегашната']],
  examples: [['date +%F', ''], ["date '+%A, %d %B %Y'", ''], ['date -d 2026-06-17 +%A', 'ден от седмицата']],
  run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'uIRd:', long: ['utc', 'iso-8601=?', 'rfc-email', 'date='] });
    const utc = opts.u || opts.utc;
    let d = new Date();
    const when = opts.d ?? opts.date;
    if (when !== undefined) {
      d = /^@\d+$/.test(when) ? new Date(Number(when.slice(1)) * 1000) : new Date(when);
      if (Number.isNaN(d.getTime())) return ctx.fail("невалидна дата '" + when + "'");
    }
    const fmt = rest.find((r) => r.startsWith('+'));
    if (fmt) ctx.print(formatDate(fmt.slice(1), d, utc));
    else if (opts.I || opts['iso-8601']) ctx.print(formatDate('%F', d, utc));
    else if (opts.R || opts['rfc-email']) ctx.print(d.toUTCString());
    else if (utc) ctx.print(formatDate('%a %e %b %Y %T UTC', d, true).replace(/ {2,}/g, ' '));
    else ctx.print(dateLong(d));
    return 0;
  },
});

function monthLines(year, month, today, c, withYear = true) {
  const title = MONTHS[month] + (withYear ? ' ' + year : '');
  const w = 20;
  const left = Math.floor((w - Array.from(title).length) / 2);
  const lines = [' '.repeat(Math.max(0, left)) + title, 'пн вт ср чт пт сб нд'];
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  let line = '   '.repeat(first);
  for (let day = 1; day <= days; day++) {
    const s = String(day).padStart(2);
    const isToday = today && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    line += (isToday ? c.inverse(s) : s) + ((first + day) % 7 === 0 ? '' : ' ');
    if ((first + day) % 7 === 0) {
      lines.push(line);
      line = '';
    }
  }
  if (line) lines.push(line.replace(/ $/, ''));
  while (lines.length < 8) lines.push('');
  return lines;
}

define({
  name: 'cal',
  aliases: ['ncal'],
  group: 'system',
  summary: 'календар',
  usage: 'cal [[МЕСЕЦ] ГОДИНА] [-3] [-y]',
  options: [['-3', 'предишния, текущия и следващия месец'], ['-y', 'цялата година']],
  examples: [['cal', 'текущия месец'], ['cal 6 2026', 'юни 2026'], ['cal -y', '']],
  run(ctx) {
    const { opts, rest } = ctx.getopt({ short: '3y' });
    const now = new Date();
    const c = ctx.c;
    let year = now.getFullYear();
    let month = now.getMonth();
    if (rest.length === 1) {
      year = Number(rest[0]);
      if (!Number.isInteger(year) || year < 1 || year > 9999) return ctx.fail("невалидна година '" + rest[0] + "'");
      if (!opts['3']) opts.y = true;
    } else if (rest.length >= 2) {
      month = Number(rest[0]) - 1;
      year = Number(rest[1]);
      if (!(month >= 0 && month < 12)) return ctx.fail("невалиден месец '" + rest[0] + "'");
    }
    const join = (blocks) => {
      const out = [];
      for (let i = 0; i < 8; i++) out.push(blocks.map((b) => padEnd(b[i] || '', 20)).join('  ').replace(/\s+$/, ''));
      return out.filter((l, i) => l || i < 7).join('\n') + '\n';
    };
    if (opts.y) {
      let out = ' '.repeat(28) + year + '\n\n';
      for (let q = 0; q < 12; q += 3) out += join([0, 1, 2].map((k) => monthLines(year, q + k, now, c, false))) + '\n';
      ctx.out(out);
    } else if (opts['3']) {
      const blocks = [-1, 0, 1].map((k) => {
        const d = new Date(year, month + k, 1);
        return monthLines(d.getFullYear(), d.getMonth(), now, c);
      });
      ctx.out(join(blocks));
    } else {
      ctx.out(monthLines(year, month, now, c).join('\n').replace(/\n+$/, '') + '\n');
    }
    return 0;
  },
});

define({
  name: 'uptime',
  group: 'system',
  summary: 'откога работи системата (откога е отворен табът)',
  usage: 'uptime [-p]',
  run(ctx) {
    const { opts } = ctx.getopt({ short: 'ps' });
    const secs = uptimeSeconds(ctx.sh);
    if (opts.s) {
      const d = new Date(ctx.sh.startedAt);
      ctx.print(d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()));
      return 0;
    }
    if (opts.p) {
      ctx.print(uptimeText(secs, true));
      return 0;
    }
    const d = new Date();
    ctx.print(' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) + ' работи ' + uptimeText(secs, false) + ', 1 потребител, средно натоварване: 0,00, 0,00, 0,00');
    return 0;
  },
});

define({ name: 'whoami', group: 'system', summary: 'текущият потребител', usage: 'whoami', run: (ctx) => ctx.print(USER) });
define({ name: 'hostname', group: 'system', summary: 'името на машината', usage: 'hostname', run: (ctx) => ctx.print(ctx.sh.env.HOSTNAME || 'nvo') });
define({ name: 'id', group: 'system', summary: 'потребител и групи', usage: 'id', run: (ctx) => ctx.print('uid=1000(' + USER + ') gid=1000(' + USER + ') групи=1000(' + USER + '),100(users)') });
define({ name: 'true', group: 'shell', summary: 'нищо, успешно', usage: 'true', rawArgs: true, run: () => 0 });
define({ name: 'false', group: 'shell', summary: 'нищо, неуспешно', usage: 'false', rawArgs: true, run: () => 1 });

define({
  name: 'uname',
  group: 'system',
  summary: 'информация за системата',
  usage: 'uname [-a] [-s] [-n] [-r] [-m] [-o]',
  options: [['-a', 'всичко'], ['-s', 'ядрото'], ['-n', 'името на машината'], ['-r', 'версията на ядрото'], ['-m', 'архитектурата'], ['-o', 'операционната система']],
  run(ctx) {
    const { opts } = ctx.getopt({ short: 'asnrvmpio' });
    const arch = /arm|aarch64/i.test(navigator.userAgent) ? 'aarch64' : 'x86_64';
    const parts = [];
    if (opts.a || opts.s || Object.keys(opts).length === 0) parts.push('Linux');
    if (opts.a || opts.n) parts.push(ctx.sh.env.HOSTNAME || 'nvo');
    if (opts.a || opts.r) parts.push(KERNEL);
    if (opts.a || opts.v) parts.push('#2026 SMP PREEMPT_DYNAMIC');
    if (opts.a || opts.m) parts.push(arch);
    if (opts.a || opts.o) parts.push('GNU/Linux');
    ctx.print(parts.join(' '));
    return 0;
  },
});

define({
  name: 'sleep',
  group: 'system',
  summary: 'изчаква',
  usage: 'sleep ЧИСЛО[smhd]',
  examples: [['sleep 2', '2 секунди'], ['sleep 0.5', '']],
  async run(ctx) {
    if (!ctx.args.length) return ctx.fail('липсва операнд', 1);
    let ms = 0;
    for (const a of ctx.args) {
      const m = /^(\d+(?:[.,]\d+)?)([smhd]?)$/.exec(a);
      if (!m) return ctx.fail("невалиден интервал от време '" + a + "'", 1);
      ms += Number(m[1].replace(',', '.')) * { '': 1000, s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
    }
    await ctx.sleep(ms);
    return 0;
  },
});

async function testExpr(ctx, args) {
  const fileTest = async (op, f) => {
    let node;
    try {
      node = await ctx.fs.lookup(ctx.resolve(f));
    } catch {
      return false;
    }
    const size = await ctx.fs.size(node);
    switch (op) {
      case '-e': return true;
      case '-f': return node.type === 'file';
      case '-d': return node.type === 'dir';
      case '-s': return size > 0;
      case '-r': return !node.noAccess;
      case '-w': return ctx.fs.writable(ctx.resolve(f)) && !node.read;
      case '-x': return !!(node.mode & 0o111);
      case '-L': case '-h': return false;
      default: return false;
    }
  };
  const num = (s) => {
    if (!/^\s*-?\d+\s*$/.test(s)) throw new Error(s + ': очаква се цяло число');
    return Number(s);
  };
  const primary = async (a) => {
    if (a.length === 0) return false;
    if (a[0] === '!') return !(await primary(a.slice(1)));
    if (a.length === 1) return a[0] !== '';
    if (a.length === 2) {
      if (a[0] === '-z') return a[1] === '';
      if (a[0] === '-n') return a[1] !== '';
      if (/^-[efdsrwxLh]$/.test(a[0])) return fileTest(a[0], a[1]);
      throw new Error(a[0] + ': очаква се унарен оператор');
    }
    if (a.length === 3) {
      const [x, op, y] = a;
      switch (op) {
        case '=': case '==': return x === y;
        case '!=': return x !== y;
        case '<': return x < y;
        case '>': return x > y;
        case '-eq': return num(x) === num(y);
        case '-ne': return num(x) !== num(y);
        case '-lt': return num(x) < num(y);
        case '-le': return num(x) <= num(y);
        case '-gt': return num(x) > num(y);
        case '-ge': return num(x) >= num(y);
        default: throw new Error(op + ': очаква се бинарен оператор');
      }
    }
    throw new Error('твърде много аргументи');
  };
  // -o е с по-нисък приоритет от -a
  const orParts = [];
  let cur = [];
  for (const a of args) {
    if (a === '-o') {
      orParts.push(cur);
      cur = [];
    } else cur.push(a);
  }
  orParts.push(cur);
  for (const part of orParts) {
    const ands = [];
    let c2 = [];
    for (const a of part) {
      if (a === '-a') {
        ands.push(c2);
        c2 = [];
      } else c2.push(a);
    }
    ands.push(c2);
    let ok = true;
    for (const x of ands) {
      if (!(await primary(x))) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

define({
  name: 'test',
  aliases: ['['],
  group: 'shell',
  summary: 'проверява условие (за && и ||)',
  usage: 'test ИЗРАЗ | [ ИЗРАЗ ]',
  rawArgs: true,
  description: 'Файлове: -e съществува, -f файл, -d директория, -s не е празен, -x изпълним. Низове: -z празен, -n непразен, =, !=. Числа: -eq, -ne, -lt, -le, -gt, -ge. ! - отрицание, -a - и, -o - или.',
  examples: [['[ -f ~/.nvorc ] && echo има', ''], ['test "$USER" = ivan || echo друг', '']],
  async run(ctx) {
    let args = ctx.args;
    if (ctx.name === '[') {
      if (args[args.length - 1] !== ']') return ctx.fail("липсва ']'", 2);
      args = args.slice(0, -1);
    }
    try {
      return (await testExpr(ctx, args)) ? 0 : 1;
    } catch (e) {
      return ctx.fail(e.message, 2);
    }
  },
});

define({
  name: 'theme',
  group: 'system',
  summary: 'тъмна или светла тема на конзолата',
  usage: 'theme [light|dark|toggle]',
  description: 'Без аргумент показва текущата тема. Изборът се пази в браузъра.',
  examples: [['theme light', ''], ['theme toggle', '']],
  complete: () => ['light', 'dark', 'toggle'],
  run(ctx) {
    const arg = ctx.args[0];
    if (!arg) {
      ctx.print(currentTheme());
      return 0;
    }
    if (arg === 'toggle') applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    else if (arg === 'light' || arg === 'dark') applyTheme(arg);
    else return ctx.fail("непозната тема '" + arg + "' (light, dark или toggle)", 2);
    return 0;
  },
});

define({
  name: 'tput',
  group: 'system',
  summary: 'възможности на терминала (cols, lines, цветове)',
  usage: 'tput cols|lines|clear|bold|sgr0|rev|smul|setaf N|setab N',
  run(ctx) {
    const [cap, arg] = ctx.args;
    switch (cap) {
      case 'cols': ctx.print(String(ctx.term.cols)); return 0;
      case 'lines': ctx.print(String(ctx.term.rows)); return 0;
      case 'colors': ctx.print('16'); return 0;
      case 'clear': ctx.out('\x1b[H\x1b[2J'); return 0;
      case 'bold': ctx.out('\x1b[1m'); return 0;
      case 'dim': ctx.out('\x1b[2m'); return 0;
      case 'smul': ctx.out('\x1b[4m'); return 0;
      case 'rmul': ctx.out('\x1b[24m'); return 0;
      case 'rev': ctx.out('\x1b[7m'); return 0;
      case 'sgr0': ctx.out('\x1b[0m'); return 0;
      case 'setaf': ctx.out('\x1b[' + (Number(arg) < 8 ? 30 + Number(arg) : 90 + Number(arg) - 8) + 'm'); return 0;
      case 'setab': ctx.out('\x1b[' + (Number(arg) < 8 ? 40 + Number(arg) : 100 + Number(arg) - 8) + 'm'); return 0;
      default: return ctx.fail('непозната възможност ' + (cap || ''), 3);
    }
  },
});

define({
  name: 'env',
  group: 'system',
  summary: 'променливите на средата; или пуска команда с променени променливи',
  usage: 'env [ИМЕ=СТОЙНОСТ]... [КОМАНДА [АРГУМЕНТИ]...]',
  rawArgs: true,
  complete: 'commands',
  async run(ctx) {
    const args = ctx.args.slice();
    const extra = {};
    while (args.length && /^[A-Za-z_]\w*=/.test(args[0])) {
      const a = args.shift();
      const eq = a.indexOf('=');
      extra[a.slice(0, eq)] = a.slice(eq + 1);
    }
    if (args.length) return ctx.sh.runArgv(args, ctx.io, { ...ctx.env, ...extra });
    const env = { ...ctx.env, ...extra };
    ctx.out(Object.keys(env).sort().map((k) => k + '=' + env[k]).join('\n') + '\n');
    return 0;
  },
});

define({
  name: 'printenv',
  group: 'system',
  summary: 'стойността на променлива',
  usage: 'printenv [ИМЕ]...',
  run(ctx) {
    if (!ctx.args.length) {
      ctx.out(Object.keys(ctx.env).sort().map((k) => k + '=' + ctx.env[k]).join('\n') + '\n');
      return 0;
    }
    let st = 0;
    for (const k of ctx.args) {
      if (ctx.env[k] === undefined) st = 1;
      else ctx.print(String(ctx.env[k]));
    }
    return st;
  },
  complete: ({ sh }) => Object.keys(sh.env).sort(),
});

define({
  name: 'ps',
  group: 'system',
  summary: 'текущите процеси',
  usage: 'ps',
  run(ctx) {
    const lines = ['    PID TTY          TIME CMD', '   4242 pts/0    00:00:00 nvo-sh'];
    ctx.sh.jobs.forEach((j, i) => lines.push(String(4243 + i).padStart(7) + ' pts/0    00:00:00 ' + j));
    ctx.out(lines.join('\n') + '\n');
  },
});

define({
  name: 'df',
  group: 'system',
  summary: 'заетото място',
  usage: 'df [-h]',
  async run(ctx) {
    const { opts } = ctx.getopt({ short: 'hT' });
    const fmt = (b) => (opts.h ? humanSize(b) : String(Math.ceil(b / 1024)));
    const used = ctx.fs.usage();
    const limit = ctx.fs.limit;
    let rows = [['Файлова система', opts.h ? 'Размер' : '1K-блокове', 'Използвани', 'Налични', 'Изп%', 'Монтирана на']];
    rows.push(['localstorage', fmt(limit), fmt(used), fmt(Math.max(0, limit - used)), Math.ceil((used / limit) * 100) + '%', HOME]);
    rows.push(['tmpfs', '-', '-', '-', '-', '/tmp']);
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) rows.push(['браузър', fmt(est.quota), fmt(est.usage || 0), fmt(Math.max(0, est.quota - (est.usage || 0))), Math.ceil(((est.usage || 0) / est.quota) * 100) + '%', '/']);
      } catch {
        // оценката не е налична
      }
    }
    const w = rows[0].map((_, i) => Math.max(...rows.map((r) => Array.from(r[i]).length)));
    ctx.out(rows.map((r) => r.map((cell, i) => (i === 0 || i === 5 ? padEnd(cell, w[i]) : cell.padStart(w[i]))).join(' ').trimEnd()).join('\n') + '\n');
  },
});

define({
  name: 'free',
  group: 'system',
  summary: 'паметта',
  usage: 'free [-h]',
  run(ctx) {
    const { opts } = ctx.getopt({ short: 'hmgk' });
    const mem = performance.memory;
    const total = navigator.deviceMemory ? navigator.deviceMemory * 1024 ** 3 : mem ? mem.jsHeapSizeLimit : 0;
    const used = mem ? mem.usedJSHeapSize : 0;
    const fmt = (b) => (opts.h ? humanSize(b) : String(Math.round(b / 1024)));
    if (!total) {
      ctx.print('Браузърът не съобщава колко памет има.');
      return 0;
    }
    const cols = ['', 'общо', 'използвана', 'свободна'];
    const row = ['Памет:', fmt(total), fmt(used), fmt(Math.max(0, total - used))];
    ctx.out(cols.map((c2, i) => (i ? c2.padStart(12) : c2.padEnd(7))).join('') + '\n' + row.map((c2, i) => (i ? c2.padStart(12) : c2.padEnd(7))).join('') + '\n');
  },
});

define({
  name: 'who',
  aliases: ['w', 'users'],
  group: 'system',
  summary: 'кой е влязъл',
  usage: 'who',
  run(ctx) {
    const d = new Date(ctx.sh.startedAt);
    if (ctx.name === 'users') ctx.print(USER);
    else ctx.print(USER.padEnd(9) + 'pts/0        ' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ' (браузър)');
  },
});

define({
  name: 'reboot',
  aliases: ['shutdown', 'poweroff', 'halt'],
  group: 'system',
  summary: 'презарежда конзолата',
  usage: 'reboot',
  description: 'Презарежда страницата. Файловете в ~ и историята остават.',
  async run(ctx) {
    ctx.print('Системата се рестартира...');
    await ctx.sleep(400);
    location.reload();
  },
});

