// Системните директории на файловата система: /etc, /bin, /usr, /proc, /dev, /root, /tmp и началните
// файлове в ~ при първо отваряне.

import { dirNode, fileNode, HOME, USER } from './vfs.js';
import { uniqueSpecs, commands, manPage } from './registry.js';
import { palette } from './ansi.js';
import { OS_NAME, OS_VERSION, KERNEL, uptimeSeconds } from './commands/sys.js';

const SITE = 'https://ivandavidov.github.io/nvo/';

export const DEFAULT_NVORC = [
  '# ~/.nvorc - изпълнява се при всяко отваряне на конзолата (като ~/.bashrc).',
  '# Редактирайте с "nano ~/.nvorc" и заредете наново със "source ~/.nvorc".',
  '',
  '# Псевдоними',
  "alias ..='cd ..'",
  "alias h='history 20'",
  '',
  '# Подкана: export PS1=\'\\w\\$ \' дава по-кратка подкана.',
  '# export PS1=\'\\[\\e[1;32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ \'',
  '',
  '# Тема: theme light или theme dark',
  '',
].join('\n');

export const DEFAULT_README = [
  'Добре дошли в конзолата на "НВО и ДЗИ".',
  '',
  'Това е обвивка, подобна на bash, която работи изцяло в браузъра.',
  'Файловете в ~ се пазят в този браузър; /tmp изчезва при затваряне на таба.',
  '',
  'Първи стъпки:',
  '  help            всички команди',
  '  man intro       как работи конзолата (клавиши, синтаксис, мрежа)',
  '  man КОМАНДА     ръководство за команда',
  '  ls -la /        какво има във файловата система',
  '  nano ~/.nvorc   настройки и псевдоними при старт',
  '',
  'Данните на сайта - командата nvo:',
  '  nvo help                    подкомандите',
  '  nvo search пмг              търсене на училище',
  '  nvo school 2216306          профил на училище',
  '  nvo rank 7 sofia -n 10      класацията в града',
  '  nvo export csv 7 sofia      изтегляне (като "Изтегли" на сайта)',
  '',
  'Примери:',
  "  nvo rank 7 sofia --tsv | cut -f2,3 | head",
  "  curl api/v1/index.json | jq '.grades[] | {grade, yearsRange}'",
  "  dig github.com +short",
  '',
].join('\n');

function elf(name) {
  return fileNode('\x7fELF (вградена команда на nvo-sh: ' + name + ')\n', { mode: 0o755, elf: true, size: 14720 + name.length * 512 });
}

function dynamicFile(read, opts = {}) {
  return { type: 'file', mode: 0o444, mtime: Date.now(), owner: 'root', read, ...opts };
}

/** Динамична директория с команди (от регистъра на командите). */
function binDir(filter) {
  return {
    type: 'dir',
    mode: 0o755,
    mtime: Date.now(),
    owner: 'root',
    provider: {
      list: async () => Array.from(commands.entries()).filter(([, spec]) => filter(spec)).map(([n]) => n),
      get: async (name) => {
        const spec = commands.get(name);
        return spec && filter(spec) ? elf(name) : null;
      },
    },
  };
}

export function buildSystem(fs, sh, term) {
  const now = Date.now();
  fs.ensureDir('/home');
  fs.ensureDir(HOME, { owner: USER });
  fs.mount('/tmp', dirNode({ mode: 0o1777 }));
  fs.mount('/root', dirNode({ mode: 0o700, noAccess: true }));
  fs.ensureDir('/var/log');

  fs.mount('/etc/hostname', fileNode('nvo\n'));
  fs.mount('/etc/os-release', fileNode([
    'NAME="' + OS_NAME + '"',
    'VERSION="' + OS_VERSION + '"',
    'ID=nvo',
    'PRETTY_NAME="' + OS_NAME + ' ' + OS_VERSION + '"',
    'HOME_URL="' + SITE + '"',
    'BUG_REPORT_URL="https://github.com/ivandavidov/nvo/issues"',
    '',
  ].join('\n')));
  fs.mount('/etc/passwd', fileNode([
    'root:x:0:0:root:/root:/bin/nvo-sh',
    USER + ':x:1000:1000:Иван Давидов:' + HOME + ':/bin/nvo-sh',
    'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
    '',
  ].join('\n')));
  fs.mount('/etc/group', fileNode('root:x:0:\nusers:x:100:' + USER + '\n' + USER + ':x:1000:\n'));
  fs.mount('/etc/shells', fileNode('/bin/sh\n/bin/bash\n/bin/nvo-sh\n'));
  fs.mount('/etc/issue', fileNode(OS_NAME + ' ' + OS_VERSION + ' \\n \\l\n\n'));
  fs.mount('/etc/motd', dynamicFile(async () => motdText(palette(false))));

  fs.mount('/bin', binDir((s) => s.group !== 'nvo'));
  fs.mount('/usr/bin', binDir((s) => s.group !== 'nvo'));
  fs.mount('/usr/local/bin', binDir((s) => s.group === 'nvo'));
  fs.mount('/usr/share/man/man1', {
    type: 'dir',
    mode: 0o755,
    mtime: now,
    owner: 'root',
    provider: {
      list: async () => uniqueSpecs().map((s) => s.name + '.1'),
      get: async (name) => {
        const spec = commands.get(name.replace(/\.1$/, ''));
        return spec && name.endsWith('.1') ? dynamicFile(async () => manPage(spec, palette(false))) : null;
      },
    },
  });

  fs.mount('/proc/uptime', dynamicFile(async () => uptimeSeconds(sh) + '.00 ' + uptimeSeconds(sh) + '.00\n'));
  fs.mount('/proc/version', dynamicFile(async () => 'Linux version ' + KERNEL + ' (' + USER + '@nvo) (' + navigator.userAgent + ') #2026 SMP PREEMPT_DYNAMIC\n'));
  fs.mount('/proc/cpuinfo', dynamicFile(async () => {
    const n = navigator.hardwareConcurrency || 1;
    let out = '';
    for (let i = 0; i < n; i++) out += 'processor\t: ' + i + '\nmodel name\t: ядро на браузъра\n\n';
    return out;
  }));
  fs.mount('/proc/meminfo', dynamicFile(async () => {
    const mem = performance.memory;
    const total = navigator.deviceMemory ? navigator.deviceMemory * 1024 * 1024 : 0;
    return 'MemTotal:       ' + String(total).padStart(10) + ' kB\n' +
      (mem ? 'JSHeapUsed:     ' + String(Math.round(mem.usedJSHeapSize / 1024)).padStart(10) + ' kB\nJSHeapLimit:    ' + String(Math.round(mem.jsHeapSizeLimit / 1024)).padStart(10) + ' kB\n' : '');
  }));
  fs.mount('/proc/loadavg', dynamicFile(async () => '0.00 0.00 0.00 1/1 4242\n'));

  fs.mount('/dev/null', { type: 'file', mode: 0o666, mtime: now, owner: 'root', dev: true, read: async () => '', write: async () => {}, size: 0 });
  fs.mount('/dev/zero', { type: 'file', mode: 0o666, mtime: now, owner: 'root', dev: true, read: async () => new Uint8Array(4096), write: async () => {}, size: 0 });
  fs.mount('/dev/urandom', { type: 'file', mode: 0o666, mtime: now, owner: 'root', dev: true, read: async () => crypto.getRandomValues(new Uint8Array(4096)), write: async () => {}, size: 0 });
  fs.mount('/dev/tty', { type: 'file', mode: 0o666, mtime: now, owner: USER, dev: true, read: async () => '', write: async (data) => term.write(String(data)), size: 0 });

  const restored = fs.restore();
  const home = fs.ensureDir(HOME);
  home.owner = USER;
  if (!restored) {
    home.children.set('.nvorc', fileNode(DEFAULT_NVORC, { owner: USER }));
    home.children.set('README', fileNode(DEFAULT_README, { owner: USER }));
    try {
      fs.commit(HOME + '/README', () => {});
    } catch {
      // ~ не може да се запише (няма localStorage) - файловете остават за сесията
    }
  }
  const historyText = () => (term.history.length ? term.history.join('\n') + '\n' : '');
  home.children.set('.bash_history', dynamicFile(async () => historyText(), { mode: 0o600, owner: USER, size: () => new TextEncoder().encode(historyText()).length }));
}

/** Поздравът при влизане (и /etc/motd). */
export function motdText(c, lastLogin) {
  const lines = [
    c.bold(OS_NAME + ' ' + OS_VERSION) + ' (nvo-sh) - конзолата на "НВО и ДЗИ"',
    '',
    ' * ' + c.cyan('nvo help') + '     данните на сайта: търсене, училища, класации, балове',
    ' * ' + c.cyan('help') + '         всички команди',
    ' * ' + c.cyan('man intro') + '    как работи конзолата',
    ' * ' + c.cyan('cat README') + '   първи стъпки',
    ' * Tab, ↑/↓, Ctrl+R и Ctrl+C работят като в истински терминал',
    '',
  ];
  if (lastLogin) lines.push('Последно влизане: ' + lastLogin + ' от браузъра', '');
  return lines.join('\n') + '\n';
}
