// Конзолата (docs/console/) - скрита страница, не е част от сайта: не се линква отникъде и не влиза
// в sitemap, търсенето и llms.txt. Тук е стартирането: файловата система, обвивката, поздравът,
// ~/.nvorc и цикълът за командите.

import { Terminal, EOF, INT } from './term.js';
import { Shell, ExitSignal } from './shell.js';
import { Vfs, HOME } from './vfs.js';
import { buildSystem, motdText } from './system.js';
import { palette } from './ansi.js';
import { dateLong } from './commands/util.js';
import './commands/files.js';
import './commands/text.js';
import './commands/awk.js';
import './commands/jq.js';
import './commands/sys.js';
import './commands/net.js';
import './commands/browser.js';
import './commands/fun.js';
import './nvo/index.js';
import { mountNvo } from './nvo/fs.js';
import { BufferStream } from './shell.js';

const LAST_LOGIN_KEY = 'nvo-console-last-login';

/** На телефон клавиатурата смалява видимата част - приложението следва visualViewport. */
function fitViewport(app) {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => {
    app.style.setProperty('--app-h', vv.height + 'px');
    app.style.transform = vv.offsetTop ? 'translateY(' + vv.offsetTop + 'px)' : '';
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}

const app = document.getElementById('app');
fitViewport(app);
const term = new Terminal(app);
const fs = new Vfs();
let sh = null;
buildSystem(fs, { get startedAt() { return sh ? sh.startedAt : Date.now(); } }, term);
// Файловете в /nvo са изходът на nvo команди; при грешка съдържанието е съобщението за нея.
mountNvo(fs, async (line) => {
  const err = new BufferStream();
  const out = await sh.captureOutput(line, { stdin: '', stdout: null, stderr: err });
  return out ? out + '\n' : err.text();
});

async function start() {
  sh = new Shell({ term, fs });
  window.nvoConsole = { term, fs, sh };
  sh.updateTitle();
  let last = null;
  try {
    last = localStorage.getItem(LAST_LOGIN_KEY);
    localStorage.setItem(LAST_LOGIN_KEY, dateLong());
  } catch {
    last = null;
  }
  term.write(motdText(palette(true), last));
  if (fs.warning) term.write('\x1b[33m' + fs.warning + '\x1b[0m\n\n');
  if (await fs.exists(HOME + '/.nvorc')) {
    sh.controller = new AbortController();
    try {
      await sh.runSource(String(await fs.readFile(HOME + '/.nvorc')), { ...sh.ttyIo(), stdin: '' });
    } catch (e) {
      term.write('nvo-sh: ~/.nvorc: ' + (e && e.message) + '\n');
    } finally {
      sh.controller = null;
    }
  }
  const prefill = new URLSearchParams(location.search).get('c');
  if (prefill) term.capture.value = prefill;
  loop();
}

async function loop() {
  for (;;) {
    const line = await term.readLine(sh.prompt(), { history: true, complete: (l, c) => sh.complete(l, c), freshLine: true });
    if (line === INT) {
      sh.status = 130;
      continue;
    }
    if (line === EOF) {
      term.write('exit\n');
      end();
      return;
    }
    if (!line.trim()) continue;
    try {
      await sh.runInteractive(line);
    } catch (e) {
      if (e instanceof ExitSignal) {
        end();
        return;
      }
      term.write('nvo-sh: ' + (e && e.message) + '\n');
    }
  }
}

function end() {
  term.write('logout\n\n\x1b[90m[Сесията приключи. Натиснете Enter за нова сесия.]\x1b[0m\n');
  term.mode = 'ended';
  term.onRestart = () => {
    term.onRestart = null;
    term.clear();
    start();
  };
}

start();
