// Регистърът на командите: един източник за изпълнението, help, man, --help и Tab допълването.

export const commands = new Map();

export const GROUPS = [
  ['shell', 'Shell'],
  ['files', 'Файлове'],
  ['text', 'Текст'],
  ['system', 'Система'],
  ['browser', 'Браузър'],
  ['net', 'Мрежа'],
  ['fun', 'Забавни'],
  ['nvo', 'Данните на сайта'],
];

/**
 * spec: { name, aliases?, group, summary, usage, description?, options?: [[флаг, текст]],
 *         examples?: [[команда, текст]], seeAlso?: [], builtin?: true, rawArgs?: true,
 *         run(ctx), complete?(info) }
 * rawArgs - командата сама решава какво е --help (echo, printf, test).
 */
export function define(spec) {
  commands.set(spec.name, spec);
  for (const alias of spec.aliases || []) {
    commands.set(alias, spec);
  }
  return spec;
}

export function lookup(name) {
  return commands.get(name) || null;
}

/** Всички имена (с псевдонимите на командите), подредени. */
export function commandNames() {
  return Array.from(commands.keys()).sort();
}

/** Уникалните команди (по едно на spec), подредени по име. */
export function uniqueSpecs() {
  const seen = new Set();
  const out = [];
  for (const spec of commands.values()) {
    if (!seen.has(spec)) {
      seen.add(spec);
      out.push(spec);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export class UsageError extends Error {}

/** Грешка с код на изход, без съобщение за употреба (съобщението вече е отпечатано). */
export class ExitCode extends Error {
  constructor(code) {
    super('exit ' + code);
    this.code = code;
  }
}

/**
 * Разбор на опции като GNU getopt.
 * spec.short: 'alhn:t:' (":" = изисква стойност), spec.long: ['help', 'color=?', 'max-depth='],
 * spec.multi: 'e' (стойностите се събират в масив), spec.numeric: '-5' → opts.n = '5',
 * spec.stopAtFirst: опциите свършват при първия аргумент (xargs, time, env).
 */
export function getopt(args, spec = {}) {
  const shortSpec = spec.short || '';
  const shortArg = new Set();
  const shortFlag = new Set();
  for (let i = 0; i < shortSpec.length; i++) {
    const ch = shortSpec[i];
    if (shortSpec[i + 1] === ':') {
      shortArg.add(ch);
      i++;
    } else {
      shortFlag.add(ch);
    }
  }
  const longSpec = new Map();
  for (const item of spec.long || []) {
    if (item.endsWith('=?')) longSpec.set(item.slice(0, -2), 'optional');
    else if (item.endsWith('=')) longSpec.set(item.slice(0, -1), 'required');
    else longSpec.set(item, 'none');
  }
  const multi = new Set((spec.multi || '').split(''));
  const opts = {};
  const rest = [];
  const set = (key, value) => {
    if (multi.has(key)) {
      (opts[key] = opts[key] || []).push(value);
    } else {
      opts[key] = value;
    }
  };
  let i = 0;
  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') {
      i++;
      break;
    }
    if (arg.startsWith('--') && arg.length > 2) {
      const eq = arg.indexOf('=');
      const name = eq >= 0 ? arg.slice(2, eq) : arg.slice(2);
      const kind = longSpec.get(name);
      if (!kind) {
        // Уникален префикс на дълга опция (--he → --help), както в GNU.
        const matches = Array.from(longSpec.keys()).filter((k) => k.startsWith(name));
        if (matches.length !== 1) {
          throw new UsageError("неразпозната опция '--" + name + "'");
        }
        args = args.slice();
        args[i] = '--' + matches[0] + (eq >= 0 ? arg.slice(eq) : '');
        i--;
        continue;
      }
      if (kind === 'none') {
        if (eq >= 0) throw new UsageError("опцията '--" + name + "' не приема аргумент");
        set(name, true);
      } else if (eq >= 0) {
        set(name, arg.slice(eq + 1));
      } else if (kind === 'required') {
        if (i + 1 >= args.length) throw new UsageError("опцията '--" + name + "' изисква аргумент");
        set(name, args[++i]);
      } else {
        set(name, true);
      }
      continue;
    }
    if (arg.startsWith('-') && arg.length > 1) {
      if (spec.numeric && /^-\d+$/.test(arg)) {
        set(spec.numeric, arg.slice(1));
        continue;
      }
      for (let j = 1; j < arg.length; j++) {
        const ch = arg[j];
        if (shortArg.has(ch)) {
          const value = arg.slice(j + 1);
          if (value) {
            set(ch, value);
          } else {
            if (i + 1 >= args.length) throw new UsageError("опцията изисква аргумент -- '" + ch + "'");
            set(ch, args[++i]);
          }
          break;
        }
        if (!shortFlag.has(ch)) {
          throw new UsageError("невалидна опция -- '" + ch + "'");
        }
        set(ch, true);
      }
      continue;
    }
    rest.push(arg);
    if (spec.stopAtFirst) {
      i++;
      break;
    }
  }
  for (; i < args.length; i++) rest.push(args[i]);
  return { opts, rest };
}

function alignPairs(pairs, indent) {
  const w = Math.min(28, Math.max(...pairs.map(([a]) => Array.from(a).length)));
  return pairs.map(([a, b]) => {
    const len = Array.from(a).length;
    return len > w
      ? indent + a + '\n' + indent + ' '.repeat(w + 2) + b
      : indent + a + ' '.repeat(w - len + 2) + b;
  }).join('\n');
}

/** Кратката помощ за `команда --help` и `help команда`. */
export function helpText(spec) {
  const parts = ['Употреба: ' + spec.usage, spec.summary];
  if (spec.description) parts.push('', spec.description);
  if (spec.options && spec.options.length) parts.push('', 'Опции:', alignPairs(spec.options, '  '));
  if (spec.examples && spec.examples.length) parts.push('', 'Примери:', alignPairs(spec.examples, '  '));
  return parts.join('\n') + '\n';
}

/** Пълната man страница. */
export function manPage(spec, c) {
  const h = (s) => c.bold(s);
  const out = [];
  const title = spec.name.toUpperCase() + '(1)';
  out.push(title + ' '.repeat(Math.max(1, 52 - title.length * 2)) + 'Ръководство на NVO Linux' + ' '.repeat(4) + title);
  out.push('');
  out.push(h('ИМЕ'));
  out.push('       ' + [spec.name, ...(spec.aliases || [])].join(', ') + ' - ' + spec.summary);
  out.push('');
  out.push(h('СИНОПСИС'));
  out.push('       ' + spec.usage);
  if (spec.description) {
    out.push('');
    out.push(h('ОПИСАНИЕ'));
    for (const line of spec.description.split('\n')) out.push(line ? '       ' + line : '');
  }
  if (spec.options && spec.options.length) {
    out.push('');
    out.push(h('ОПЦИИ'));
    for (const [flag, text] of spec.options) {
      out.push('       ' + c.bold(flag));
      out.push('              ' + text);
    }
  }
  if (spec.examples && spec.examples.length) {
    out.push('');
    out.push(h('ПРИМЕРИ'));
    for (const [cmd, text] of spec.examples) {
      out.push('       ' + c.bold(cmd));
      if (text) out.push('              ' + text);
    }
  }
  if (spec.builtin) {
    out.push('');
    out.push(h('БЕЛЕЖКА'));
    out.push('       ' + spec.name + ' е вградена команда на обвивката nvo-sh.');
  }
  if (spec.seeAlso && spec.seeAlso.length) {
    out.push('');
    out.push(h('ВИЖ СЪЩО'));
    out.push('       ' + spec.seeAlso.map((s) => s + '(1)').join(', '));
  }
  out.push('');
  out.push('NVO Linux 2.0' + ' '.repeat(30) + '2026' + ' '.repeat(20) + title);
  return out.join('\n') + '\n';
}
