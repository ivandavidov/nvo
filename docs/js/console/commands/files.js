// Команди за файлове: ls, cat, less, head, tail, touch, mkdir, rmdir, rm, cp, mv, find, tree, du,
// file, stat, chmod, basename, dirname, realpath, nano.

import { define } from '../registry.js';
import { palette, columns } from '../ansi.js';
import { FsError, normalize, basename, dirname, modeString, globToRegExp, compareNames, isBinary, HOME } from '../vfs.js';
import { dateLs, dateIso, humanSize, asText, splitLines, toInt } from './util.js';

const colorOn = (ctx, value) => {
  if (value === 'always' || value === 'yes' || value === 'force') return true;
  if (value === 'never' || value === 'no' || value === 'none') return false;
  return ctx.isTTY && !('NO_COLOR' in ctx.env);
};

function nameColor(c, node, name) {
  if (node.type === 'dir') return c.dir(name);
  if (node.dev) return c.special(name);
  if (node.mode & 0o111) return c.exec(name);
  return name;
}

async function entry(ctx, abs, shown) {
  const node = await ctx.fs.lookup(abs);
  return { name: shown, abs, node, size: await ctx.fs.size(node) };
}

function sortEntries(list, opts) {
  if (opts.t) list.sort((a, b) => b.node.mtime - a.node.mtime || compareNames(a.name, b.name));
  else if (opts.S) list.sort((a, b) => b.size - a.size || compareNames(a.name, b.name));
  else list.sort((a, b) => compareNames(a.name, b.name));
  if (opts.r) list.reverse();
  return list;
}

define({
  name: 'ls',
  aliases: ['dir'],
  group: 'files',
  summary: 'изрежда съдържанието на директория',
  usage: 'ls [ОПЦИЯ]... [ФАЙЛ]...',
  options: [
    ['-a', 'показва и скритите файлове (започват с ".")'],
    ['-A', 'като -a, но без . и ..'],
    ['-l', 'дълъг формат: права, собственик, размер, дата'],
    ['-h', 'размерите в K, M, G (с -l)'],
    ['-1', 'по едно име на ред'],
    ['-R', 'рекурсивно'],
    ['-d', 'самите директории, не съдържанието им'],
    ['-t', 'по време на промяна (най-новите първо)'],
    ['-S', 'по размер (най-големите първо)'],
    ['-r', 'обратен ред'],
    ['-F', 'добавя / след директориите и * след изпълнимите'],
    ['--color=КОГА', 'always, never или auto (по подразбиране)'],
  ],
  examples: [['ls -la ~', 'всичко в домашната директория'], ['ls -lhS /tmp', 'по размер']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'alhAR1dtSrFC', long: ['color=?', 'all', 'almost-all', 'human-readable'] });
    const c = palette(colorOn(ctx, opts.color === true ? 'always' : opts.color));
    const showAll = opts.a || opts.all;
    const almost = opts.A || opts['almost-all'];
    const human = opts.h || opts['human-readable'];
    const one = opts['1'] || (!ctx.isTTY && !opts.C);
    let status = 0;

    const fmtName = (e) => {
      let s = nameColor(c, e.node, e.name);
      if (opts.F) s += e.node.type === 'dir' ? '/' : e.node.mode & 0o111 ? '*' : '';
      return s;
    };
    const plainName = (e) => e.name + (opts.F ? (e.node.type === 'dir' ? '/' : e.node.mode & 0o111 ? '*' : '') : '');

    const render = (list, withTotal) => {
      if (!list.length) return withTotal && opts.l ? 'общо 0\n' : '';
      if (opts.l) {
        const sizes = list.map((e) => (human ? humanSize(e.size) : String(e.size)));
        const sw = Math.max(...sizes.map((s) => s.length));
        const ow = Math.max(...list.map((e) => (e.node.owner || 'root').length));
        let out = withTotal ? 'общо ' + list.reduce((a, e) => a + Math.ceil(e.size / 1024), 0) + '\n' : '';
        list.forEach((e, i) => {
          const owner = e.node.owner || 'root';
          out += modeString(e.node) + ' ' + (e.node.type === 'dir' ? 2 : 1) + ' ' + owner.padEnd(ow) + ' ' + owner.padEnd(ow) + ' ' +
            sizes[i].padStart(sw) + ' ' + dateLs(e.node.mtime || Date.now()) + ' ' + fmtName(e) + '\n';
        });
        return out;
      }
      if (one) return list.map(fmtName).join('\n') + '\n';
      return columns(list.map((e) => ({ text: fmtName(e), plain: plainName(e) })), ctx.cols);
    };

    const listDir = async (abs) => {
      const names = await ctx.fs.readdir(abs);
      const list = [];
      if (showAll) {
        list.push({ name: '.', abs, node: await ctx.fs.lookup(abs), size: 4096 });
        list.push({ name: '..', abs: dirname(abs), node: await ctx.fs.lookup(dirname(abs)), size: 4096 });
      }
      for (const name of names) {
        if (name.startsWith('.') && !showAll && !almost) continue;
        ctx.check();
        try {
          list.push(await entry(ctx, normalize(name, abs), name));
        } catch {
          // изчезнал динамичен файл
        }
      }
      return sortEntries(list, opts);
    };

    const targets = rest.length ? rest : ['.'];
    const files = [];
    const dirs = [];
    for (const t of targets) {
      try {
        const e = await entry(ctx, ctx.resolve(t), t);
        if (e.node.type === 'dir' && !opts.d) dirs.push(e);
        else files.push(e);
      } catch (err) {
        if (!(err instanceof FsError)) throw err;
        ctx.err("не може да се достъпи '" + t + "': " + err.message);
        status = 2;
      }
    }
    let out = render(sortEntries(files, opts), false);
    const many = targets.length > 1 || opts.R;
    const queue = sortEntries(dirs, opts).map((d) => ({ shown: d.name, abs: d.abs }));
    let first = !files.length;
    while (queue.length) {
      const d = queue.shift();
      let list;
      try {
        list = await listDir(d.abs);
      } catch (err) {
        if (!(err instanceof FsError)) throw err;
        ctx.err("не може да се отвори директория '" + d.shown + "': " + err.message);
        status = 2;
        continue;
      }
      if (many) out += (first ? '' : '\n') + d.shown + ':\n';
      first = false;
      out += render(list, true);
      if (opts.R) {
        const subs = list.filter((e) => e.node.type === 'dir' && e.name !== '.' && e.name !== '..' && !e.node.provider)
          .map((e) => ({ shown: (d.shown === '/' ? '' : d.shown.replace(/\/$/, '')) + '/' + e.name, abs: e.abs }));
        queue.unshift(...subs);
      }
      ctx.check();
    }
    ctx.out(out);
    return status;
  },
});

define({
  name: 'pwd',
  group: 'files',
  builtin: true,
  summary: 'показва текущата директория',
  usage: 'pwd',
  run(ctx) {
    ctx.print(ctx.sh.cwd);
  },
});

define({
  name: 'cat',
  group: 'files',
  summary: 'извежда съдържанието на файлове',
  usage: 'cat [ОПЦИЯ]... [ФАЙЛ]...',
  description: 'Без файл чете stdin; в терминала - редовете, които въвеждате, до Ctrl+D. Така "cat > бележка.txt" създава файл.',
  options: [['-n', 'номерира всички редове'], ['-b', 'номерира непразните редове'], ['-s', 'слива поредните празни редове'], ['-E', 'показва $ в края на всеки ред']],
  examples: [['cat ~/.nvorc', ''], ['cat > бележка.txt', 'пишете, Ctrl+D завършва']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'nbsEA' });
    let n = 0;
    let lastBlank = false;
    const emit = (line) => {
      const blank = line === '';
      if (opts.s && blank && lastBlank) return '';
      lastBlank = blank;
      let s = line + (opts.E || opts.A ? '$' : '');
      if (opts.b ? !blank : opts.n) s = String(++n).padStart(6) + '\t' + s;
      return s + '\n';
    };
    const plain = !opts.n && !opts.b && !opts.s && !opts.E && !opts.A;
    const files = rest.length ? rest : ['-'];
    for (const f of files) {
      if (f === '-' && ctx.stdin === null) {
        for await (const line of ctx.lines()) ctx.out(emit(line));
        continue;
      }
      const [input] = await ctx.readInputs([f]);
      if (!input) continue;
      if (plain) {
        ctx.out(input.text);
        continue;
      }
      let out = '';
      const lines = input.text.split('\n');
      const endsNl = input.text.endsWith('\n');
      if (endsNl) lines.pop();
      lines.forEach((l, i) => {
        const s = emit(l);
        out += i === lines.length - 1 && !endsNl ? s.replace(/\n$/, '') : s;
      });
      ctx.out(out);
    }
    return ctx.failed ? 1 : 0;
  },
});

define({
  name: 'less',
  aliases: ['more', 'pager'],
  group: 'files',
  summary: 'разглежда текст страница по страница',
  usage: 'less [ФАЙЛ]...',
  description: 'Интервал/b - страница напред/назад, ↑/↓ или j/k - ред, g/G - начало/край, /текст - търсене, n/N - следващо/предишно, q - изход.\nКогато изходът не е терминал, работи като cat.',
  examples: [['less ~/README', ''], ['ls -l /bin | less', '']],
  async run(ctx) {
    const inputs = await ctx.readInputs(ctx.args.filter((a) => !a.startsWith('-') || a === '-'));
    const text = inputs.map((i) => i.text).join('');
    if (!ctx.isTTY) {
      ctx.out(text);
      return ctx.failed ? 1 : 0;
    }
    if (text) {
      const title = ctx.args.length === 1 && ctx.args[0] !== '-' ? ctx.args[0] : '';
      await ctx.term.pager(text, { title });
    }
    return ctx.failed ? 1 : 0;
  },
});

function headTailOpts(ctx) {
  const { opts, rest } = ctx.getopt({ short: 'n:c:qv', numeric: 'n', long: ['lines=', 'bytes='] });
  const lines = opts.n !== undefined ? opts.n : opts.lines;
  const bytes = opts.c !== undefined ? opts.c : opts.bytes;
  return { opts, rest, lines, bytes };
}

define({
  name: 'head',
  group: 'files',
  summary: 'първите редове на файл',
  usage: 'head [-n N] [ФАЙЛ]...',
  options: [['-n N', 'първите N реда (по подразбиране 10); -n -N - всички без последните N'], ['-c N', 'първите N знака'], ['-N', 'същото като -n N']],
  examples: [['head -3 /etc/passwd', ''], ['nvo search гимназия | head -n 5', '']],
  async run(ctx) {
    const { opts, rest, lines, bytes } = headTailOpts(ctx);
    const inputs = await ctx.readInputs(rest);
    inputs.forEach((input, i) => {
      if (inputs.length > 1 && !opts.q) ctx.out((i ? '\n' : '') + '==> ' + (input.name === '-' ? 'стандартен вход' : input.name) + ' <==\n');
      if (bytes !== undefined) {
        const n = toInt(bytes, 'знаци');
        const chars = Array.from(input.text);
        ctx.out((n < 0 ? chars.slice(0, n) : chars.slice(0, n)).join(''));
        return;
      }
      const n = lines === undefined ? 10 : toInt(lines, 'редове');
      const all = splitLines(input.text);
      const part = n < 0 ? all.slice(0, Math.max(0, all.length + n)) : all.slice(0, n);
      const trailing = part.length === all.length && !input.text.endsWith('\n');
      ctx.out(part.join('\n') + (part.length && !trailing ? '\n' : ''));
    });
    return ctx.failed ? 1 : 0;
  },
});

define({
  name: 'tail',
  group: 'files',
  summary: 'последните редове на файл',
  usage: 'tail [-n N] [ФАЙЛ]...',
  options: [['-n N', 'последните N реда (по подразбиране 10)'], ['-n +N', 'от ред N до края'], ['-c N', 'последните N знака']],
  examples: [['tail -n 3 ~/.bash_history', ''], ['nvo rank 7 sofia | tail -n +3', 'без заглавните редове']],
  async run(ctx) {
    const { opts, rest, lines, bytes } = headTailOpts(ctx);
    const inputs = await ctx.readInputs(rest);
    inputs.forEach((input, i) => {
      if (inputs.length > 1 && !opts.q) ctx.out((i ? '\n' : '') + '==> ' + (input.name === '-' ? 'стандартен вход' : input.name) + ' <==\n');
      if (bytes !== undefined) {
        const chars = Array.from(input.text);
        const s = String(bytes);
        ctx.out(s.startsWith('+') ? chars.slice(toInt(s.slice(1), 'знаци') - 1).join('') : chars.slice(-toInt(s, 'знаци') || chars.length).join(''));
        return;
      }
      const all = splitLines(input.text);
      const s = lines === undefined ? '10' : String(lines);
      let part;
      if (s.startsWith('+')) part = all.slice(Math.max(0, toInt(s.slice(1), 'редове') - 1));
      else {
        const n = Math.abs(toInt(s, 'редове'));
        part = n === 0 ? [] : all.slice(-n);
      }
      ctx.out(part.length ? part.join('\n') + (input.text.endsWith('\n') || part.length < all.length ? '\n' : '') : '');
    });
    return ctx.failed ? 1 : 0;
  },
});

define({
  name: 'touch',
  group: 'files',
  summary: 'създава празен файл или обновява времето на промяна',
  usage: 'touch ФАЙЛ...',
  async run(ctx) {
    if (!ctx.args.length) return ctx.fail('липсва файл', 1);
    let st = 0;
    for (const f of ctx.args) {
      try {
        await ctx.fs.touch(ctx.resolve(f));
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("не може да се докосне '" + f + "': " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'mkdir',
  group: 'files',
  summary: 'създава директории',
  usage: 'mkdir [-p] [-v] ДИРЕКТОРИЯ...',
  options: [['-p', 'създава и липсващите родители, без грешка ако съществува'], ['-v', 'съобщава за всяка създадена директория']],
  complete: 'dirs',
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'pv', long: ['parents'] });
    if (!rest.length) return ctx.fail('липсва операнд', 1);
    let st = 0;
    for (const d of rest) {
      try {
        await ctx.fs.mkdir(ctx.resolve(d), { parents: opts.p || opts.parents });
        if (opts.v) ctx.print("mkdir: създадена е директория '" + d + "'");
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("не може да се създаде директория '" + d + "': " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'rmdir',
  group: 'files',
  summary: 'премахва празни директории',
  usage: 'rmdir ДИРЕКТОРИЯ...',
  complete: 'dirs',
  async run(ctx) {
    let st = 0;
    for (const d of ctx.args) {
      try {
        await ctx.fs.remove(ctx.resolve(d), { dirOnly: true });
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("неуспешно премахване на '" + d + "': " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'rm',
  group: 'files',
  summary: 'премахва файлове и директории',
  usage: 'rm [-r] [-f] [-v] ФАЙЛ...',
  description: 'Изтрива окончателно (няма кошче). Може да се трият само файлове в ~ и /tmp.',
  options: [['-r, -R', 'рекурсивно (директории)'], ['-f', 'без грешка за липсващи файлове'], ['-v', 'съобщава за всеки изтрит файл']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'rRfvid', long: ['recursive', 'force'] });
    const recursive = opts.r || opts.R || opts.recursive;
    const force = opts.f || opts.force;
    if (!rest.length) return force ? 0 : ctx.fail('липсва операнд', 1);
    let st = 0;
    for (const f of rest) {
      const abs = ctx.resolve(f);
      if (abs === '/' || abs === '/nvo') {
        ctx.err("опасно е да се работи рекурсивно върху '" + abs + "'");
        st = 1;
        continue;
      }
      if (abs === HOME) {
        ctx.err("отказвам да изтрия домашната директория '" + f + "'");
        st = 1;
        continue;
      }
      try {
        await ctx.fs.remove(abs, { recursive });
        if (opts.v) ctx.print("премахнат '" + f + "'");
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        if (force && e.code === 'ENOENT') continue;
        ctx.err("не може да се премахне '" + f + "': " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

async function copyOrMove(ctx, move) {
  const { opts, rest } = ctx.getopt({ short: 'rRvfn', long: ['recursive'] });
  const recursive = opts.r || opts.R || opts.recursive;
  if (rest.length < 2) return ctx.fail(rest.length ? "липсва целеви файл след '" + rest[0] + "'" : 'липсва операнд', 1);
  const target = rest[rest.length - 1];
  const sources = rest.slice(0, -1);
  const tAbs = ctx.resolve(target);
  let tIsDir = false;
  try {
    tIsDir = (await ctx.fs.lookup(tAbs)).type === 'dir';
  } catch {
    tIsDir = false;
  }
  if (sources.length > 1 && !tIsDir) return ctx.fail("целта '" + target + "' не е директория");
  let st = 0;
  for (const s of sources) {
    const sAbs = ctx.resolve(s);
    const dAbs = tIsDir ? normalize(basename(sAbs), tAbs) : tAbs;
    try {
      const node = await ctx.fs.lookup(sAbs);
      if (!move && node.type === 'dir' && !recursive) {
        ctx.err("не е зададено -r; директорията '" + s + "' се пропуска");
        st = 1;
        continue;
      }
      if (dAbs === sAbs) {
        ctx.err("'" + s + "' и '" + target + "' са един и същ файл");
        st = 1;
        continue;
      }
      if (opts.n && (await ctx.fs.exists(dAbs))) continue;
      if (move) await ctx.fs.rename(sAbs, dAbs);
      else await ctx.fs.copy(sAbs, dAbs);
      if (opts.v) ctx.print("'" + s + "' -> '" + (tIsDir ? normalize(basename(sAbs), target) : target) + "'");
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      ctx.err((move ? "не може да се премести '" : "не може да се копира '") + s + "': " + e.message);
      st = 1;
    }
  }
  return st;
}

define({
  name: 'cp',
  group: 'files',
  summary: 'копира файлове и директории',
  usage: 'cp [-r] [-v] ИЗТОЧНИК... ЦЕЛ',
  options: [['-r', 'копира директории рекурсивно'], ['-n', 'не презаписва съществуващи файлове'], ['-v', 'показва всяко копиране']],
  examples: [['cp /etc/motd ~/motd.txt', ''], ['cp -r ~/скриптове /tmp/', '']],
  run: (ctx) => copyOrMove(ctx, false),
});

define({
  name: 'mv',
  group: 'files',
  summary: 'премества или преименува файлове',
  usage: 'mv [-v] ИЗТОЧНИК... ЦЕЛ',
  options: [['-n', 'не презаписва съществуващи файлове'], ['-v', 'показва всяко преместване']],
  run: (ctx) => copyOrMove(ctx, true),
});

/** Обхожда дърво (динамичните директории като /nvo - само ако са изрично начало). */
async function* walk(ctx, abs, shown, depth, maxDepth, budget) {
  const node = await ctx.fs.lookup(abs);
  yield { abs, shown, node, depth };
  if (node.type !== 'dir' || depth >= maxDepth || node.noAccess) return;
  if (node.heavy && depth > 0) return;
  let names;
  try {
    names = await ctx.fs.readdir(abs);
  } catch {
    return;
  }
  for (const name of names) {
    if (--budget.left < 0) throw new Error('твърде много файлове - стеснете търсенето (напр. -maxdepth)');
    await ctx.tick();
    yield* walk(ctx, normalize(name, abs), shown === '/' ? '/' + name : shown.replace(/\/$/, '') + '/' + name, depth + 1, maxDepth, budget);
  }
}

define({
  name: 'find',
  group: 'files',
  summary: 'търси файлове в дърво от директории',
  usage: 'find [ПЪТ]... [-name ШАБЛОН] [-iname ШАБЛОН] [-type f|d] [-maxdepth N] [-mindepth N] [-empty]',
  description: 'Условията се комбинират с "и". Шаблоните са glob (*, ?, [..]) - сложете ги в кавички, за да не ги разгъне обвивката.',
  options: [['-name ШАБЛОН', 'името съвпада с шаблона'], ['-iname ШАБЛОН', 'същото, без значение на главни/малки букви'], ['-path ШАБЛОН', 'целият път съвпада'], ['-type f|d', 'само файлове / само директории'], ['-maxdepth N', 'най-много N нива надолу'], ['-mindepth N', 'поне N нива надолу'], ['-empty', 'празни файлове и директории']],
  examples: [['find ~ -name "*.txt"', ''], ['find / -maxdepth 1 -type d', '']],
  async run(ctx) {
    const args = ctx.args.slice();
    const paths = [];
    while (args.length && !args[0].startsWith('-')) paths.push(args.shift());
    if (!paths.length) paths.push('.');
    const tests = [];
    let maxDepth = Infinity;
    let minDepth = 0;
    while (args.length) {
      const a = args.shift();
      const need = () => {
        if (!args.length) throw new Error("липсва аргумент на '" + a + "'");
        return args.shift();
      };
      if (a === '-name' || a === '-iname') {
        const re = globToRegExp(need());
        const rx = a === '-iname' ? new RegExp(re.source, 'i') : re;
        tests.push((e) => rx.test(basename(e.shown)));
      } else if (a === '-path' || a === '-wholename') {
        const p = need().replace(/\*/g, '\u0001');
        const rx = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\u0001/g, '.*') + '$');
        tests.push((e) => rx.test(e.shown));
      } else if (a === '-type') {
        const t = need();
        if (t !== 'f' && t !== 'd') throw new Error("непознат аргумент на -type: " + t);
        tests.push((e) => (t === 'd' ? e.node.type === 'dir' : e.node.type === 'file'));
      } else if (a === '-maxdepth') {
        maxDepth = toInt(need(), 'нива');
      } else if (a === '-mindepth') {
        minDepth = toInt(need(), 'нива');
      } else if (a === '-empty') {
        tests.push((e) => (e.node.type === 'dir' ? (e.node.children ? e.node.children.size === 0 : false) : !e.node.read && !String(e.node.content || '').length));
      } else if (a === '-print') {
        // по подразбиране
      } else {
        throw new Error("неизвестен предикат '" + a + "'");
      }
    }
    let st = 0;
    const budget = { left: 20000 };
    for (const p of paths) {
      try {
        for await (const e of walk(ctx, ctx.resolve(p), p, 0, maxDepth, budget)) {
          if (e.depth >= minDepth && tests.every((t) => t(e))) ctx.print(e.shown);
        }
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("'" + p + "': " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'tree',
  group: 'files',
  summary: 'показва директориите като дърво',
  usage: 'tree [-a] [-d] [-L НИВА] [ДИРЕКТОРИЯ]...',
  options: [['-a', 'и скритите файлове'], ['-d', 'само директориите'], ['-L N', 'най-много N нива']],
  complete: 'dirs',
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'adL:' });
    const c = ctx.c;
    const maxLevel = opts.L ? toInt(opts.L, 'нива') : Infinity;
    let dirs = 0;
    let files = 0;
    let budget = 5000;
    let out = '';
    const draw = async (abs, prefix, level) => {
      let names = await ctx.fs.readdir(abs);
      if (!opts.a) names = names.filter((n) => !n.startsWith('.'));
      const items = [];
      for (const name of names) {
        const node = await ctx.fs.lookup(normalize(name, abs));
        if (opts.d && node.type !== 'dir') continue;
        items.push({ name, node });
      }
      for (let i = 0; i < items.length; i++) {
        if (--budget < 0) throw new Error('твърде много файлове - ползвайте -L');
        await ctx.tick();
        const { name, node } = items[i];
        const last = i === items.length - 1;
        out += prefix + (last ? '└── ' : '├── ') + nameColor(c, node, name) + '\n';
        if (node.type === 'dir') {
          dirs++;
          if (level + 1 < maxLevel && !node.noAccess && !node.heavy) await draw(normalize(name, abs), prefix + (last ? '    ' : '│   '), level + 1);
        } else {
          files++;
        }
      }
    };
    const targets = rest.length ? rest : ['.'];
    for (const t of targets) {
      const abs = ctx.resolve(t);
      try {
        const node = await ctx.fs.lookup(abs);
        out += c.dir(t) + '\n';
        if (node.type === 'dir') await draw(abs, '', 0);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        out += t + ' [' + e.message + ']\n';
      }
    }
    out += '\n' + dirs + (dirs === 1 ? ' директория' : ' директории') + (opts.d ? '' : ', ' + files + (files === 1 ? ' файл' : ' файла')) + '\n';
    ctx.out(out);
    return 0;
  },
});

define({
  name: 'du',
  group: 'files',
  summary: 'показва заетото място',
  usage: 'du [-s] [-h] [-a] [-c] [ФАЙЛ]...',
  options: [['-s', 'само общото за всеки аргумент'], ['-h', 'в K, M, G'], ['-a', 'и за отделните файлове'], ['-c', 'общ сбор накрая']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'shac' });
    const fmt = (bytes) => (opts.h ? humanSize(bytes) : String(Math.ceil(bytes / 1024)));
    let total = 0;
    let out = '';
    const sizeOf = async (abs, shown, depth) => {
      const node = await ctx.fs.lookup(abs);
      if (node.type !== 'dir') {
        const s = await ctx.fs.size(node);
        if (opts.a && !opts.s && depth > 0) out += fmt(s) + '\t' + shown + '\n';
        return s;
      }
      let sum = 4096;
      if (!node.heavy || depth === 0) {
        for (const name of await ctx.fs.readdir(abs)) {
          await ctx.tick();
          sum += await sizeOf(normalize(name, abs), shown.replace(/\/$/, '') + '/' + name, depth + 1);
        }
      }
      if (!opts.s || depth === 0) out += fmt(sum) + '\t' + shown + '\n';
      return sum;
    };
    let st = 0;
    for (const t of rest.length ? rest : ['.']) {
      try {
        total += await sizeOf(ctx.resolve(t), t, 0);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("не може да се достъпи '" + t + "': " + e.message);
        st = 1;
      }
    }
    if (opts.c) out += fmt(total) + '\tобщо\n';
    ctx.out(out);
    return st;
  },
});

function describe(node, content) {
  if (node.type === 'dir') return 'директория';
  if (node.elf) return 'ELF 64-битов LSB изпълним файл, x86-64 (вградена команда на nvo-sh)';
  if (node.dev) return 'символно специално устройство';
  if (isBinary(content)) {
    const b = content;
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'PDF документ';
    if (b[0] === 0x89 && b[1] === 0x50) return 'PNG изображение';
    if (b[0] === 0xff && b[1] === 0xd8) return 'JPEG изображение';
    return 'данни';
  }
  const text = String(content);
  if (!text) return 'празен';
  if (text.startsWith('#!')) return 'скрипт за nvo-sh, UTF-8 текст' + (node.mode & 0o111 ? ', изпълним' : '');
  const t = text.trim();
  if ((t.startsWith('{') || t.startsWith('[')) && (() => { try { JSON.parse(t); return true; } catch { return false; } })()) return 'JSON текст';
  if (/^<!doctype html|^<html/i.test(t)) return 'HTML документ, UTF-8 текст';
  return /^[\x00-\x7f]*$/.test(text) ? 'ASCII текст' : 'UTF-8 текст';
}

define({
  name: 'file',
  group: 'files',
  summary: 'определя вида на файл',
  usage: 'file ФАЙЛ...',
  async run(ctx) {
    let st = 0;
    for (const f of ctx.args) {
      try {
        const abs = ctx.resolve(f);
        const node = await ctx.fs.lookup(abs);
        const content = node.type === 'file' && !node.elf && !node.dev ? await ctx.fs.readFile(abs) : '';
        ctx.print(f + ': ' + describe(node, content));
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.print(f + ': не може да се отвори (' + e.message + ')');
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'stat',
  group: 'files',
  summary: 'подробности за файл',
  usage: 'stat ФАЙЛ...',
  async run(ctx) {
    let st = 0;
    for (const f of ctx.args) {
      try {
        const node = await ctx.fs.lookup(ctx.resolve(f));
        const size = await ctx.fs.size(node);
        const kind = node.type === 'dir' ? 'директория' : node.dev ? 'символно специално устройство' : size ? 'обикновен файл' : 'обикновен празен файл';
        const owner = node.owner || 'root';
        const uid = owner === 'root' ? 0 : 1000;
        ctx.out('  Файл: ' + f + '\n  Размер: ' + size + '\tБлокове: ' + Math.ceil(size / 512) + '\tВид: ' + kind + '\n' +
          'Достъп: (0' + (node.mode & 0o777).toString(8) + '/' + modeString(node) + ')  Собственик: (' + String(uid).padStart(4) + '/' + owner.padEnd(8) + ')  Група: (' + String(uid).padStart(4) + '/' + owner.padEnd(8) + ')\n' +
          'Промяна: ' + dateIso(node.mtime || Date.now()) + '\n');
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("не може да се получи информация за '" + f + "': " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

function applyMode(mode, spec) {
  if (/^[0-7]{1,4}$/.test(spec)) return parseInt(spec, 8);
  let m = mode;
  for (const clause of spec.split(',')) {
    const r = /^([ugoa]*)([-+=])([rwx]*)$/.exec(clause);
    if (!r) return null;
    const who = r[1] || 'a';
    let bits = 0;
    if (r[3].includes('r')) bits |= 4;
    if (r[3].includes('w')) bits |= 2;
    if (r[3].includes('x')) bits |= 1;
    let mask = 0;
    let set = 0;
    for (const w of who === 'a' ? 'ugo' : who) {
      const shift = w === 'u' ? 6 : w === 'g' ? 3 : 0;
      mask |= 7 << shift;
      set |= bits << shift;
    }
    if (r[2] === '+') m |= set;
    else if (r[2] === '-') m &= ~set;
    else m = (m & ~mask) | set;
  }
  return m;
}

define({
  name: 'chmod',
  group: 'files',
  summary: 'сменя правата на файл',
  usage: 'chmod РЕЖИМ ФАЙЛ...',
  description: 'РЕЖИМ е осмично число (755) или символен запис (+x, u+rw, go-w). С +x скриптът може да се пуска с ./скрипт.',
  examples: [['chmod +x ~/report.sh', ''], ['chmod 644 бележка.txt', '']],
  async run(ctx) {
    if (ctx.args.length < 2) return ctx.fail('липсва операнд', 1);
    const [spec, ...files] = ctx.args;
    let st = 0;
    for (const f of files) {
      try {
        const abs = ctx.resolve(f);
        const node = await ctx.fs.lookup(abs);
        const mode = applyMode(node.mode, spec);
        if (mode === null) return ctx.fail("невалиден режим: '" + spec + "'");
        await ctx.fs.chmod(abs, mode);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        ctx.err("промяната на правата на '" + f + "' е невъзможна: " + e.message);
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'basename',
  group: 'files',
  summary: 'името на файла без директорията',
  usage: 'basename ПЪТ [СУФИКС]',
  run(ctx) {
    if (!ctx.args.length) return ctx.fail('липсва операнд', 1);
    let b = basename(ctx.args[0]);
    if (ctx.args[1] && b.endsWith(ctx.args[1]) && b !== ctx.args[1]) b = b.slice(0, -ctx.args[1].length);
    ctx.print(b);
  },
});

define({
  name: 'dirname',
  group: 'files',
  summary: 'директорията от пътя',
  usage: 'dirname ПЪТ...',
  run(ctx) {
    if (!ctx.args.length) return ctx.fail('липсва операнд', 1);
    for (const p of ctx.args) ctx.print(dirname(p));
  },
});

define({
  name: 'realpath',
  aliases: ['readlink'],
  group: 'files',
  summary: 'пълният път до файл',
  usage: 'realpath ПЪТ...',
  async run(ctx) {
    let st = 0;
    for (const p of ctx.args.filter((a) => !a.startsWith('-'))) {
      const abs = ctx.resolve(p);
      if (await ctx.fs.exists(abs)) ctx.print(abs);
      else {
        ctx.err(p + ': Няма такъв файл или директория');
        st = 1;
      }
    }
    return st;
  },
});

define({
  name: 'nano',
  aliases: ['edit'],
  group: 'files',
  summary: 'прост текстов редактор',
  usage: 'nano ФАЙЛ',
  description: 'Отваря файла на целия екран. ^S записва, ^X излиза (пита, ако има незаписани промени), ^K изрязва реда, ^U го поставя, ^C показва позицията.\nНа телефон бутоните отдолу правят същото.',
  examples: [['nano ~/.nvorc', 'псевдоними и настройки при старт'], ['nano ~/report.sh', 'нов скрипт']],
  async run(ctx) {
    const file = ctx.args.find((a) => !a.startsWith('-'));
    if (!file) return ctx.fail('изисква се име на файл (nano ФАЙЛ)');
    if (!ctx.isTTY) return ctx.fail('изходът не е терминал');
    const abs = ctx.resolve(file);
    let content = '';
    try {
      const node = await ctx.fs.lookup(abs);
      if (node.type === 'dir') return ctx.fail(file + ' е директория');
      content = asText(await ctx.fs.readFile(abs));
    } catch (e) {
      if (!(e instanceof FsError) || e.code !== 'ENOENT') throw e;
      if (!(await ctx.fs.exists(dirname(abs)))) return ctx.fail(file + ': ' + e.message);
    }
    await ctx.term.editor({
      title: file,
      content,
      onSave: (text) => ctx.fs.writeFile(abs, text),
    });
    return 0;
  },
});

