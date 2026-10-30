// Терминалът: екран с ANSI изход, ред за въвеждане (история, Ctrl+R, Tab допълване), четене на stdin
// (cat > файл), less и nano. Изходът се рисува само с textContent - никога през innerHTML.
//
// Редът за въвеждане е скрито <textarea> (то поема клавиатурата, поставянето, IME и клавиатурата на
// телефона); видимият ред с курсора се рисува отделно от стойността му.

import { columns } from './ansi.js';

const MAX_LINES = 5000;
const HISTORY_KEY = 'nvo-console-history';
const HISTORY_MAX = 1000;
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const EOF = Symbol('eof');
export const INT = Symbol('int');

function newStyle() {
  return { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false, link: null };
}

function applySgr(style, params) {
  const codes = params === '' ? [0] : params.split(';').map((x) => Number(x) || 0);
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === 0) Object.assign(style, newStyle(), { link: style.link });
    else if (c === 1) style.bold = true;
    else if (c === 2) style.dim = true;
    else if (c === 3) style.italic = true;
    else if (c === 4) style.underline = true;
    else if (c === 7) style.inverse = true;
    else if (c === 22) style.bold = style.dim = false;
    else if (c === 23) style.italic = false;
    else if (c === 24) style.underline = false;
    else if (c === 27) style.inverse = false;
    else if (c >= 30 && c <= 37) style.fg = c - 30;
    else if (c >= 90 && c <= 97) style.fg = c - 90 + 8;
    else if (c === 39) style.fg = null;
    else if (c >= 40 && c <= 47) style.bg = c - 40;
    else if (c >= 100 && c <= 107) style.bg = c - 100 + 8;
    else if (c === 49) style.bg = null;
    else if (c === 38 || c === 48) {
      // 256 цвята: първите 16 са ANSI палитрата, останалите се пропускат; 24-битовите - също.
      if (codes[i + 1] === 5) {
        const n = codes[i + 2];
        if (n < 16) {
          if (c === 38) style.fg = n;
          else style.bg = n;
        }
        i += 2;
      } else if (codes[i + 1] === 2) {
        i += 4;
      }
    }
  }
}

function styleClasses(s) {
  const cls = [];
  if (s.inverse) {
    cls.push(s.fg === null ? 'bfg' : 'b' + s.fg);
    cls.push(s.bg === null ? 'fbg' : 'f' + s.bg);
  } else {
    if (s.fg !== null) cls.push('f' + s.fg);
    if (s.bg !== null) cls.push('b' + s.bg);
  }
  if (s.bold) cls.push('a-b');
  if (s.dim) cls.push('a-d');
  if (s.italic) cls.push('a-i');
  if (s.underline) cls.push('a-u');
  return cls.join(' ');
}

function safeLink(url) {
  try {
    const u = new URL(url, location.href);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

function appendText(parent, text, style) {
  const cls = styleClasses(style);
  let node;
  if (cls) {
    node = document.createElement('span');
    node.className = cls;
    node.textContent = text;
  } else {
    node = document.createTextNode(text);
  }
  if (style.link) {
    const a = document.createElement('a');
    a.href = style.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.append(node);
    node = a;
  }
  parent.append(node);
}

const SEQ_RE = /\x1b\[([0-9;?]*)([A-Za-z])|\x1b\]8;[^;\x07\x1b]*;([^\x07\x1b]*)(?:\x07|\x1b\\)|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\r\n|\n|\r|\x07|\x1b/g;

/** ANSI текст → DocumentFragment (за подканата и за редовете в less). */
export function ansiFragment(text, style = newStyle()) {
  const frag = document.createDocumentFragment();
  let last = 0;
  SEQ_RE.lastIndex = 0;
  let m;
  const s = String(text);
  while ((m = SEQ_RE.exec(s))) {
    if (m.index > last) appendText(frag, s.slice(last, m.index), style);
    last = SEQ_RE.lastIndex;
    if (m[2] === 'm') applySgr(style, m[1]);
    else if (m[3] !== undefined) style.link = m[3] ? safeLink(m[3]) : null;
  }
  if (last < s.length) appendText(frag, s.slice(last), style);
  return frag;
}

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function commonPrefix(values) {
  if (!values.length) return '';
  let p = values[0];
  for (const v of values) {
    while (!v.startsWith(p)) p = p.slice(0, -1);
  }
  return p;
}

const isWordChar = (ch) => /[\p{L}\p{N}_]/u.test(ch);

export class Terminal {
  constructor(app) {
    this.app = app;
    this.root = app.querySelector('.term');
    this.screen = app.querySelector('.term__screen');
    this.lineEl = app.querySelector('.term__line');
    this.stage = app.querySelector('.stage');
    this.keybar = app.querySelector('.keybar');

    const cap = document.createElement('textarea');
    cap.className = 'term__capture';
    cap.rows = 1;
    cap.setAttribute('autocapitalize', 'off');
    cap.setAttribute('autocomplete', 'off');
    cap.setAttribute('autocorrect', 'off');
    cap.setAttribute('spellcheck', 'false');
    cap.setAttribute('enterkeyhint', 'enter');
    cap.setAttribute('aria-label', 'Команден ред');
    this.root.append(cap);
    this.capture = cap;

    this.style = newStyle();
    this.cur = null;
    this.cr = false;
    this.atLineStart = true;
    this.mode = 'idle';
    this.queue = [];
    this.pendingEof = false;
    this.history = loadHistory();
    this.histIndex = this.history.length;
    this.draft = '';
    this.killRing = '';
    this.search = null;
    this.lastTabValue = null;
    this.completeToken = 0;
    this.stickyCtrl = false;
    this.overlay = null;
    this.onInterrupt = null;
    this.promptFrag = document.createDocumentFragment();
    this.promptText = '';
    this.lineOpts = {};
    this.scrollPending = false;

    cap.addEventListener('keydown', (e) => this.onKeyDown(e));
    cap.addEventListener('input', (e) => this.onInput(e));
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === cap && this.mode === 'input') this.render();
    });
    this.root.addEventListener('mouseup', (e) => {
      if (e.target.closest('a')) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      this.focus();
    });
    window.addEventListener('focus', () => this.focus());
    new ResizeObserver(() => this.measure()).observe(this.root);
    this.initKeybar();
    this.measure();
  }

  // ─── Размери ─────────────────────────────────────────────────────────────────

  measure() {
    if (!this.root.clientWidth) return;
    const probe = document.createElement('span');
    probe.className = 'term__probe';
    probe.textContent = 'M'.repeat(100);
    this.screen.append(probe);
    const rect = probe.getBoundingClientRect();
    probe.remove();
    this.charW = rect.width / 100 || 8;
    this.lineH = rect.height || 18;
    this.cols = Math.max(20, Math.floor(this.screen.clientWidth / this.charW));
    this.rows = Math.max(5, Math.floor(this.root.clientHeight / this.lineH));
    if (this.onResize) this.onResize(this.cols, this.rows);
  }

  // ─── Изход ───────────────────────────────────────────────────────────────────

  write(text) {
    if (text === undefined || text === null || text === '') return;
    let s = String(text);
    // Огромен изход: на екрана остават само последните MAX_LINES реда.
    if (s.length > 200000) {
      let pos = s.length;
      for (let n = 0; n < MAX_LINES && pos > 0; n++) pos = s.lastIndexOf('\n', pos - 1);
      if (pos > 0) s = s.slice(pos + 1);
    }
    let last = 0;
    SEQ_RE.lastIndex = 0;
    let m;
    while ((m = SEQ_RE.exec(s))) {
      if (m.index > last) this.emit(s.slice(last, m.index));
      last = SEQ_RE.lastIndex;
      const seq = m[0];
      if (m[2] !== undefined) {
        if (m[2] === 'm') applySgr(this.style, m[1]);
        else if (m[2] === 'J' && (m[1] === '2' || m[1] === '3')) this.clear();
        else if (m[2] === 'K' && this.cur) this.cur.textContent = '';
      } else if (m[3] !== undefined) {
        this.style.link = m[3] ? safeLink(m[3]) : null;
      } else if (seq === '\n' || seq === '\r\n') {
        this.newLine();
      } else if (seq === '\r') {
        this.cr = true;
      } else if (seq === '\x07') {
        this.bell();
      }
    }
    if (last < s.length) this.emit(s.slice(last));
    this.trim();
    this.scrollToBottom();
  }

  emit(text) {
    if (!text) return;
    if (!this.cur) {
      this.cur = document.createElement('div');
      this.cur.className = 'ln';
      this.screen.append(this.cur);
    } else if (this.cr) {
      this.cur.textContent = '';
    }
    this.cr = false;
    appendText(this.cur, text, this.style);
    this.atLineStart = false;
  }

  newLine() {
    if (!this.cur) {
      const ln = document.createElement('div');
      ln.className = 'ln';
      this.screen.append(ln);
    }
    this.cur = null;
    this.cr = false;
    this.atLineStart = true;
  }

  trim() {
    const extra = this.screen.childElementCount - MAX_LINES;
    if (extra > 0) {
      const range = document.createRange();
      range.setStartBefore(this.screen.firstChild);
      range.setEndAfter(this.screen.children[extra - 1]);
      range.deleteContents();
    }
  }

  clear() {
    this.screen.textContent = '';
    this.cur = null;
    this.atLineStart = true;
    this.root.scrollTop = 0;
  }

  resetStyle() {
    this.style = newStyle();
  }

  scrollToBottom() {
    if (this.scrollPending) return;
    this.scrollPending = true;
    requestAnimationFrame(() => {
      this.scrollPending = false;
      this.root.scrollTop = this.root.scrollHeight;
    });
  }

  bell() {
    this.root.classList.add('is-bell');
    setTimeout(() => this.root.classList.remove('is-bell'), 120);
  }

  focus() {
    if (this.overlay && this.overlay.input) {
      this.overlay.input.focus({ preventScroll: true });
    } else {
      this.capture.focus({ preventScroll: true });
    }
  }

  setTitle(title) {
    document.title = title;
  }

  // ─── История ─────────────────────────────────────────────────────────────────

  addHistory(line) {
    if (!line.trim() || line.startsWith(' ')) return;
    if (this.history[this.history.length - 1] !== line) this.history.push(line);
    if (this.history.length > HISTORY_MAX) this.history.splice(0, this.history.length - HISTORY_MAX);
    this.saveHistory();
  }

  saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {
      // Без localStorage историята живее само до затваряне на таба.
    }
  }

  clearHistory() {
    this.history = [];
    this.histIndex = 0;
    this.saveHistory();
  }

  // ─── Въвеждане ───────────────────────────────────────────────────────────────

  /**
   * Чете един ред. opts: { history, complete(line, cursor), stdin, freshLine }.
   * Връща низа, EOF (Ctrl+D на празен ред) или INT (Ctrl+C).
   */
  readLine(prompt = '', opts = {}) {
    if (opts.freshLine && !this.atLineStart) this.write('\n');
    this.promptText = prompt;
    this.promptFrag = ansiFragment(prompt);
    this.lineOpts = opts;
    this.histIndex = this.history.length;
    this.draft = '';
    this.search = null;
    this.lastTabValue = null;
    return new Promise((resolve) => {
      this.resolveLine = resolve;
      this.mode = 'input';
      if (this.pendingEof) {
        this.pendingEof = false;
        this.finish(EOF);
        return;
      }
      if (this.queue.length) {
        this.capture.value = this.queue.shift();
        this.submit();
        return;
      }
      this.lineEl.hidden = false;
      this.render();
      this.focus();
      this.scrollToBottom();
    });
  }

  finish(value) {
    this.mode = 'running';
    this.lineEl.hidden = true;
    this.lineEl.textContent = '';
    const resolve = this.resolveLine;
    this.resolveLine = null;
    if (resolve) resolve(value);
  }

  /** Записва реда с подканата в екрана (както остава в истински терминал). */
  commitLine(suffix = '\n') {
    const text = this.capture.value.replace(/\x1b/g, '^[');
    this.write(this.promptText + text + suffix);
  }

  submit() {
    if (this.search) this.acceptSearch();
    const text = this.capture.value;
    this.commitLine();
    if (this.lineOpts.history) this.addHistory(text);
    this.capture.value = '';
    this.finish(text);
  }

  setLine(value, cursor = value.length) {
    this.capture.value = value;
    this.capture.setSelectionRange(cursor, cursor);
    this.render();
  }

  render() {
    if (this.mode !== 'input') return;
    const el = this.lineEl;
    el.textContent = '';
    let value = this.capture.value;
    let pos = this.capture.selectionStart;
    if (this.search) {
      const label = (this.search.failed ? '(неуспешно reverse-i-search)' : '(reverse-i-search)') + "'" + this.search.query + "': ";
      el.append(document.createTextNode(label));
      value = this.search.match;
      pos = this.search.matchPos;
    } else {
      el.append(this.promptFrag.cloneNode(true));
    }
    const chars = Array.from(value.slice(0, pos));
    const rest = Array.from(value.slice(pos));
    el.append(document.createTextNode(chars.join('')));
    const cursor = document.createElement('span');
    cursor.className = 'term__cursor';
    cursor.textContent = rest.length ? rest[0] : ' ';
    el.append(cursor, document.createTextNode(rest.slice(1).join('')));
    // offsetTop на курсора вече е спрямо .term (най-близкият позициониран родител).
    this.capture.style.top = cursor.offsetTop + 'px';
    this.capture.style.left = Math.min(cursor.offsetLeft, this.root.clientWidth - 24) + 'px';
  }

  onInput(e) {
    if (this.overlay) return;
    const cap = this.capture;
    if (this.stickyCtrl && e.data && e.data.length === 1 && /[a-z]/i.test(e.data)) {
      // Ctrl от лентата + буква от клавиатурата на телефона.
      const pos = cap.selectionStart;
      cap.value = cap.value.slice(0, pos - 1) + cap.value.slice(pos);
      cap.setSelectionRange(pos - 1, pos - 1);
      this.setSticky(false);
      this.onKeyDown(this.synthetic(e.data.toLowerCase(), { ctrlKey: true }));
      return;
    }
    if (/[\r\n]/.test(cap.value)) {
      // Поставен текст с няколко реда: всеки ред е отделна команда.
      const parts = cap.value.replace(/\r\n?/g, '\n').split('\n');
      const tail = parts.pop();
      if (this.mode === 'input') {
        cap.value = parts.shift();
        this.queue.push(...parts);
        this.submit();
        cap.value = tail;
      } else {
        this.queue.push(...parts);
        cap.value = tail;
      }
      return;
    }
    if (this.search) {
      this.search.query = cap.value;
      this.runSearch(this.history.length - 1);
    }
    this.render();
  }

  synthetic(key, mods = {}) {
    return { key, code: '', ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, synthetic: true, preventDefault() {}, ...mods };
  }

  onKeyDown(e) {
    if (this.overlay) {
      if (this.overlay.key(e)) e.preventDefault();
      return;
    }
    if (e.isComposing || e.keyCode === 229) return;
    const key = e.key;
    const ctrl = e.ctrlKey && !e.metaKey && !e.altKey;
    // С кирилска подредба Ctrl+C дава key "с" - буквата се взима от физическия клавиш.
    const lower = e.code && e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : key.length === 1 ? key.toLowerCase() : key;

    if (ctrl && lower === 'c') {
      const sel = window.getSelection();
      if (!IS_MAC && sel && !sel.isCollapsed && !e.synthetic) return;
      e.preventDefault();
      this.interrupt();
      return;
    }

    if (this.mode === 'running') {
      if (key === 'Enter') {
        e.preventDefault();
        this.queue.push(this.capture.value);
        this.capture.value = '';
      }
      return;
    }
    if (this.mode === 'ended') {
      if (key === 'Enter') {
        e.preventDefault();
        if (this.onRestart) this.onRestart();
      }
      return;
    }
    if (this.mode !== 'input') return;

    const cap = this.capture;
    const v = cap.value;
    const pos = cap.selectionStart;
    const alt = e.altKey && !e.ctrlKey && !e.metaKey;
    const code = e.code || '';

    if (this.search) {
      if (ctrl && lower === 'r') {
        e.preventDefault();
        this.runSearch(this.search.index - 1);
        this.render();
        return;
      }
      if ((ctrl && lower === 'g') || key === 'Escape') {
        e.preventDefault();
        this.cancelSearch();
        return;
      }
      if (key === 'Enter') {
        e.preventDefault();
        this.submit();
        return;
      }
      if (key === 'Backspace' || (key.length === 1 && !ctrl && !alt && !e.metaKey)) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'].includes(key) || ctrl) {
        e.preventDefault();
        this.acceptSearch();
        this.render();
        return;
      }
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      this.submit();
      return;
    }
    if (key === 'Tab') {
      e.preventDefault();
      if (this.lineOpts.complete) {
        this.doComplete();
      } else {
        cap.setRangeText('\t', pos, cap.selectionEnd, 'end');
        this.render();
      }
      return;
    }
    if (key === 'ArrowUp' || (ctrl && lower === 'p')) {
      e.preventDefault();
      this.historyMove(-1);
      return;
    }
    if (key === 'ArrowDown' || (ctrl && lower === 'n')) {
      e.preventDefault();
      this.historyMove(1);
      return;
    }
    if (key === 'PageUp' || key === 'PageDown') {
      e.preventDefault();
      this.root.scrollTop += (key === 'PageUp' ? -1 : 1) * (this.root.clientHeight - this.lineH);
      return;
    }
    if (e.synthetic && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      const p = key === 'ArrowLeft' ? Math.max(0, pos - 1) : Math.min(v.length, pos + 1);
      this.setLine(v, p);
      return;
    }
    if (e.synthetic && key === 'Escape') return;

    if (ctrl) {
      const handled = this.ctrlKey(lower || code, v, pos);
      if (handled) e.preventDefault();
      return;
    }
    if (alt) {
      const letter = code.startsWith('Key') ? code.slice(3).toLowerCase() : '';
      if (letter === 'b' || key === 'ArrowLeft') {
        e.preventDefault();
        this.setLine(v, this.wordLeft(v, pos));
      } else if (letter === 'f' || key === 'ArrowRight') {
        e.preventDefault();
        this.setLine(v, this.wordRight(v, pos));
      } else if (letter === 'd') {
        e.preventDefault();
        const end = this.wordRight(v, pos);
        this.killRing = v.slice(pos, end);
        this.setLine(v.slice(0, pos) + v.slice(end), pos);
      } else if (key === 'Backspace') {
        e.preventDefault();
        const start = this.wordLeft(v, pos);
        this.killRing = v.slice(start, pos);
        this.setLine(v.slice(0, start) + v.slice(pos), start);
      }
    }
  }

  ctrlKey(k, v, pos) {
    switch (k) {
      case 'a': this.setLine(v, 0); return true;
      case 'e': this.setLine(v, v.length); return true;
      case 'b': this.setLine(v, Math.max(0, pos - 1)); return true;
      case 'f': this.setLine(v, Math.min(v.length, pos + 1)); return true;
      case 'h':
        if (pos > 0) this.setLine(v.slice(0, pos - 1) + v.slice(pos), pos - 1);
        return true;
      case 'u':
        this.killRing = v.slice(0, pos);
        this.setLine(v.slice(pos), 0);
        return true;
      case 'k':
        this.killRing = v.slice(pos);
        this.setLine(v.slice(0, pos), pos);
        return true;
      case 'w': {
        let start = pos;
        while (start > 0 && /\s/.test(v[start - 1])) start--;
        while (start > 0 && !/\s/.test(v[start - 1])) start--;
        this.killRing = v.slice(start, pos);
        this.setLine(v.slice(0, start) + v.slice(pos), start);
        return true;
      }
      case 'y':
        this.setLine(v.slice(0, pos) + this.killRing + v.slice(pos), pos + this.killRing.length);
        return true;
      case 'l': this.clear(); this.render(); return true;
      case 'r': this.startSearch(); return true;
      case 'd':
        if (v === '') {
          if (!this.lineOpts.stdin) this.commitLine('');
          this.capture.value = '';
          this.finish(EOF);
        } else if (this.lineOpts.stdin) {
          this.pendingEof = true;
          this.submit();
        } else {
          this.setLine(v.slice(0, pos) + v.slice(pos + 1), pos);
        }
        return true;
      case 'j': case 'm': this.submit(); return true;
      case 'g': this.bell(); return true;
      case 's': case 'o': case 't': case 'q': case 'i': case 'z': case 'x': case 'v': return k !== 'v' && k !== 'x';
      default: return false;
    }
  }

  wordLeft(v, pos) {
    let i = pos;
    while (i > 0 && !isWordChar(v[i - 1])) i--;
    while (i > 0 && isWordChar(v[i - 1])) i--;
    return i;
  }

  wordRight(v, pos) {
    let i = pos;
    while (i < v.length && !isWordChar(v[i])) i++;
    while (i < v.length && isWordChar(v[i])) i++;
    return i;
  }

  historyMove(dir) {
    if (!this.lineOpts.history) return;
    const next = this.histIndex + dir;
    if (next < 0 || next > this.history.length) {
      this.bell();
      return;
    }
    if (this.histIndex === this.history.length) this.draft = this.capture.value;
    this.histIndex = next;
    this.setLine(next === this.history.length ? this.draft : this.history[next]);
  }

  interrupt() {
    if (this.mode === 'input') {
      if (this.search) this.cancelSearch();
      this.commitLine('^C\n');
      this.capture.value = '';
      this.finish(INT);
    } else if (this.mode === 'running') {
      this.write('^C');
      if (this.onInterrupt) this.onInterrupt();
    }
  }

  // ─── Ctrl+R ──────────────────────────────────────────────────────────────────

  startSearch() {
    if (!this.lineOpts.history) return;
    this.search = { query: '', index: this.history.length, match: this.capture.value, matchPos: this.capture.selectionStart, original: this.capture.value, failed: false };
    this.capture.value = '';
    this.render();
  }

  runSearch(from) {
    const q = this.search.query;
    if (!q) {
      this.search.failed = false;
      return;
    }
    for (let i = Math.min(from, this.history.length - 1); i >= 0; i--) {
      const idx = this.history[i].lastIndexOf(q);
      if (idx >= 0) {
        Object.assign(this.search, { index: i, match: this.history[i], matchPos: idx, failed: false });
        return;
      }
    }
    this.search.failed = true;
    this.bell();
  }

  acceptSearch() {
    const s = this.search;
    this.search = null;
    this.capture.value = s.match;
    this.capture.setSelectionRange(s.matchPos, s.matchPos);
  }

  cancelSearch() {
    const s = this.search;
    this.search = null;
    this.setLine(s.original);
  }

  // ─── Tab ─────────────────────────────────────────────────────────────────────

  async doComplete() {
    const value = this.capture.value;
    const pos = this.capture.selectionStart;
    const again = this.lastTabValue === value + '\u0000' + pos;
    this.lastTabValue = value + '\u0000' + pos;
    const token = ++this.completeToken;
    let res = null;
    try {
      res = await this.lineOpts.complete(value, pos);
    } catch {
      res = null;
    }
    if (token !== this.completeToken || this.mode !== 'input' || this.capture.value !== value) return;
    if (!res || !res.candidates.length) {
      this.bell();
      return;
    }
    const { start, candidates } = res;
    const word = value.slice(start, pos);
    if (candidates.length === 1) {
      const c = candidates[0];
      const text = c.value + (c.suffix === undefined ? ' ' : c.suffix);
      this.setLine(value.slice(0, start) + text + value.slice(pos), start + text.length);
      this.lastTabValue = null;
      return;
    }
    const prefix = commonPrefix(candidates.map((c) => c.value));
    if (prefix.length > word.length) {
      const next = value.slice(0, start) + prefix + value.slice(pos);
      this.setLine(next, start + prefix.length);
      // Като в bash: след частично допълване следващото Tab веднага изрежда възможностите.
      this.lastTabValue = next + '\u0000' + (start + prefix.length);
      return;
    }
    if (!again) {
      this.bell();
      return;
    }
    this.listCandidates(candidates);
  }

  listCandidates(candidates) {
    this.commitLine();
    const shown = candidates.slice(0, 400);
    let out;
    if (shown.some((c) => c.desc)) {
      const w = Math.min(24, Math.max(...shown.map((c) => Array.from(c.display || c.value).length)));
      out = shown.map((c) => {
        const d = c.display || c.value;
        const pad = ' '.repeat(Math.max(1, w - Array.from(d).length + 1));
        return d + (c.desc ? pad + '\x1b[90m-- ' + c.desc + '\x1b[0m' : '');
      }).join('\n') + '\n';
    } else {
      out = columns(shown.map((c) => ({ text: c.display || c.value, plain: c.display || c.value })), this.cols);
    }
    if (candidates.length > shown.length) out += '... и още ' + (candidates.length - shown.length) + '\n';
    this.write(out);
    this.render();
  }

  // ─── Лента с клавиши (телефон) ───────────────────────────────────────────────

  initKeybar() {
    if (!this.keybar) return;
    this.keybar.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.preventDefault();
      this.pressKey(btn.dataset.key);
    });
    this.keybar.addEventListener('click', (e) => e.preventDefault());
  }

  setSticky(on) {
    this.stickyCtrl = on;
    const btn = this.keybar && this.keybar.querySelector('[data-key="Ctrl"]');
    if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  pressKey(key) {
    if (key === 'Ctrl') {
      this.setSticky(!this.stickyCtrl);
      return;
    }
    const target = this.overlay && this.overlay.input ? this.overlay.input : this.capture;
    if (this.overlay && !this.overlay.input) {
      this.overlay.key(this.synthetic(key === '^C' ? 'c' : key, { ctrlKey: key === '^C' }));
      return;
    }
    if (key === '^C') {
      this.onKeyDown(this.synthetic('c', { ctrlKey: true }));
      this.focus();
      return;
    }
    const ctrl = this.stickyCtrl;
    this.setSticky(false);
    if (key.length === 1 && !ctrl) {
      target.setRangeText(key, target.selectionStart, target.selectionEnd, 'end');
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const evt = this.synthetic(key, { ctrlKey: ctrl });
      if (this.overlay && this.overlay.input) {
        this.overlay.key(evt);
      } else {
        this.onKeyDown(evt);
      }
    }
    this.focus();
  }

  // ─── less ────────────────────────────────────────────────────────────────────

  pager(text, { title = '' } = {}) {
    return new Promise((resolve) => {
      const prevMode = this.mode;
      this.mode = 'overlay';
      const el = document.createElement('div');
      el.className = 'overlay pager';
      const body = document.createElement('div');
      body.className = 'pager__body';
      const status = document.createElement('div');
      status.className = 'pager__status';
      const statusText = document.createElement('span');
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'pager__close';
      closeBtn.textContent = 'q - изход';
      status.append(statusText, closeBtn);
      const lines = String(text).replace(/\n$/, '').split('\n');
      const style = newStyle();
      const frag = document.createDocumentFragment();
      const lineEls = lines.map((line) => {
        const ln = document.createElement('div');
        ln.className = 'ln';
        ln.append(ansiFragment(line, style));
        frag.append(ln);
        return ln;
      });
      body.append(frag);
      el.append(body, status);
      this.stage.append(el);

      let searching = false;
      let query = '';
      let term = '';
      let lastMatch = -1;
      const page = () => Math.max(this.lineH, body.clientHeight - this.lineH);
      const update = () => {
        if (searching) {
          statusText.textContent = '/' + query;
          return;
        }
        const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
        const topLine = Math.floor(body.scrollTop / this.lineH) + 1;
        const pct = body.scrollHeight > body.clientHeight ? Math.round(((body.scrollTop + body.clientHeight) / body.scrollHeight) * 100) : 100;
        statusText.textContent = atEnd ? '(END)' : (title ? title + ' ' : '') + 'ред ' + topLine + ' (' + pct + '%)';
      };
      const find = (dir) => {
        if (!term) return;
        const needle = term.toLowerCase();
        const start = lastMatch >= 0 ? lastMatch + dir : Math.floor(body.scrollTop / this.lineH) + (dir > 0 ? 0 : -1);
        for (let i = start, n = 0; n < lines.length; n++, i += dir) {
          if (i < 0 || i >= lines.length) break;
          if (lineEls[i].textContent.toLowerCase().includes(needle)) {
            if (lastMatch >= 0) lineEls[lastMatch].classList.remove('is-match');
            lastMatch = i;
            lineEls[i].classList.add('is-match');
            body.scrollTop = lineEls[i].offsetTop;
            return;
          }
        }
        statusText.textContent = 'Няма съвпадение';
      };
      const close = () => {
        el.remove();
        this.overlay = null;
        this.mode = prevMode;
        this.focus();
        resolve();
      };
      closeBtn.addEventListener('click', close);
      body.addEventListener('scroll', update);
      this.overlay = {
        key: (e) => {
          const k = e.key;
          if (searching) {
            if (k === 'Enter') {
              searching = false;
              term = query || term;
              lastMatch = -1;
              find(1);
              if (statusText.textContent !== 'Няма съвпадение') update();
            } else if (k === 'Escape' || (e.ctrlKey && k.toLowerCase() === 'c')) {
              searching = false;
              update();
            } else if (k === 'Backspace') {
              query = query.slice(0, -1);
              update();
            } else if (k.length === 1 && !e.ctrlKey && !e.metaKey) {
              query += k;
              update();
            }
            return true;
          }
          if (e.metaKey) return false;
          if (k === 'q' || k === 'Q' || e.code === 'KeyQ' || k === 'Escape' || (e.ctrlKey && k.toLowerCase() === 'c')) close();
          else if (k === ' ' || k === 'f' || k === 'z' || k === 'PageDown') body.scrollTop += page();
          else if (k === 'b' || k === 'w' || k === 'PageUp') body.scrollTop -= page();
          else if (k === 'j' || k === 'e' || k === 'ArrowDown' || k === 'Enter') body.scrollTop += this.lineH;
          else if (k === 'k' || k === 'y' || k === 'ArrowUp') body.scrollTop -= this.lineH;
          else if (k === 'g' || k === '<' || k === 'Home') body.scrollTop = 0;
          else if (k === 'G' || k === '>' || k === 'End') body.scrollTop = body.scrollHeight;
          else if (k === 'd') body.scrollTop += page() / 2;
          else if (k === 'u') body.scrollTop -= page() / 2;
          else if (k === '/') {
            searching = true;
            query = '';
            update();
          } else if (k === 'n') find(1);
          else if (k === 'N') find(-1);
          else return k.length === 1;
          return true;
        },
      };
      update();
      this.focus();
    });
  }

  // ─── nano ────────────────────────────────────────────────────────────────────

  /** Прост редактор на целия екран. onSave(text) записва (може да хвърли грешка). */
  editor({ title, content = '', onSave }) {
    return new Promise((resolve) => {
      const prevMode = this.mode;
      this.mode = 'overlay';
      const el = document.createElement('div');
      el.className = 'overlay nano';
      const head = document.createElement('div');
      head.className = 'nano__head';
      const text = document.createElement('textarea');
      text.className = 'nano__text';
      text.value = content;
      text.setAttribute('spellcheck', 'false');
      text.setAttribute('autocapitalize', 'off');
      text.setAttribute('autocorrect', 'off');
      text.setAttribute('aria-label', 'Редактор: ' + title);
      const status = document.createElement('div');
      status.className = 'nano__status';
      const keys = document.createElement('div');
      keys.className = 'nano__keys';
      const shortcuts = [['s', '^S', 'Запиши'], ['x', '^X', 'Изход'], ['k', '^K', 'Изрежи ред'], ['u', '^U', 'Постави'], ['c', '^C', 'Позиция']];
      for (const [k, label, desc] of shortcuts) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.ctrl = k;
        const kbd = document.createElement('b');
        kbd.textContent = label;
        b.append(kbd, ' ' + desc);
        keys.append(b);
      }
      el.append(head, text, status, keys);
      this.stage.append(el);

      let modified = false;
      let confirming = false;
      let cut = '';
      const setHead = () => {
        head.textContent = '  nano 1.0' + '    ' + title + (modified ? '    Променен' : '');
      };
      const say = (msg) => {
        status.textContent = msg ? '[ ' + msg + ' ]' : '';
      };
      const close = () => {
        el.remove();
        this.overlay = null;
        this.mode = prevMode;
        this.focus();
        resolve();
      };
      const save = async () => {
        try {
          await onSave(text.value);
          modified = false;
          setHead();
          const n = text.value ? text.value.split('\n').length - (text.value.endsWith('\n') ? 1 : 0) : 0;
          say('Записани ' + n + ' реда');
          return true;
        } catch (err) {
          say('Грешка при запис: ' + err.message);
          return false;
        }
      };
      const lineBounds = () => {
        const v = text.value;
        const pos = text.selectionStart;
        const start = v.lastIndexOf('\n', pos - 1) + 1;
        let end = v.indexOf('\n', pos);
        end = end < 0 ? v.length : end + 1;
        return { start, end };
      };
      const action = async (k) => {
        if (confirming) return;
        if (k === 's' || k === 'o') {
          await save();
        } else if (k === 'x') {
          if (!modified) {
            close();
            return;
          }
          confirming = true;
          status.textContent = 'Да запиша ли промените? (Д - да, Н - не, ^C - отказ)';
        } else if (k === 'k') {
          const { start, end } = lineBounds();
          cut = text.value.slice(start, end);
          text.setRangeText('', start, end, 'start');
          modified = true;
          setHead();
        } else if (k === 'u') {
          text.setRangeText(cut, text.selectionStart, text.selectionEnd, 'end');
          modified = true;
          setHead();
        } else if (k === 'c') {
          const before = text.value.slice(0, text.selectionStart);
          const line = before.split('\n').length;
          const col = before.length - before.lastIndexOf('\n');
          const total = text.value.split('\n').length;
          say('ред ' + line + '/' + total + ', колона ' + col);
        }
      };
      const onKey = (e) => {
        const k = (e.key || '').toLowerCase();
        if (confirming) {
          if (k === 'y' || k === 'д') {
            confirming = false;
            save().then((ok) => ok && close());
          } else if (k === 'n' || k === 'н') {
            confirming = false;
            close();
          } else if (k === 'escape' || (e.ctrlKey && k === 'c')) {
            confirming = false;
            say('Отказано');
          }
          return true;
        }
        if (e.ctrlKey && !e.metaKey && !e.altKey && ['s', 'o', 'x', 'k', 'u', 'c'].includes(k)) {
          action(k);
          return true;
        }
        if (e.key === 'Tab') {
          text.setRangeText('\t', text.selectionStart, text.selectionEnd, 'end');
          modified = true;
          setHead();
          return true;
        }
        if (e.synthetic) {
          const pos = text.selectionStart;
          if (e.key === 'ArrowLeft') text.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
          else if (e.key === 'ArrowRight') text.setSelectionRange(pos + 1, pos + 1);
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const v = text.value;
            const start = v.lastIndexOf('\n', pos - 1) + 1;
            const col = pos - start;
            if (e.key === 'ArrowUp') {
              if (start === 0) return true;
              const prevStart = v.lastIndexOf('\n', start - 2) + 1;
              text.setSelectionRange(Math.min(prevStart + col, start - 1), Math.min(prevStart + col, start - 1));
            } else {
              const next = v.indexOf('\n', pos);
              if (next < 0) return true;
              let nextEnd = v.indexOf('\n', next + 1);
              if (nextEnd < 0) nextEnd = v.length;
              const p = Math.min(next + 1 + col, nextEnd);
              text.setSelectionRange(p, p);
            }
          }
          return true;
        }
        return false;
      };
      text.addEventListener('keydown', (e) => {
        if (onKey(e)) e.preventDefault();
      });
      // Клавиатурата на телефона (и вмъкнатият текст) не праща истински keydown - отговорът на
      // "Да запиша ли?" идва като въведен знак.
      text.addEventListener('beforeinput', (e) => {
        if (!confirming || !e.data) return;
        e.preventDefault();
        onKey({ key: e.data.slice(-1) });
      });
      text.addEventListener('input', () => {
        if (!modified) {
          modified = true;
          setHead();
        }
      });
      keys.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        e.preventDefault();
        if (confirming && b.dataset.ctrl === 'c') {
          onKey({ key: 'c', ctrlKey: true });
          return;
        }
        action(b.dataset.ctrl);
      });
      this.overlay = { input: text, key: (e) => onKey(e) };
      setHead();
      say(content ? '' : 'Нов файл');
      text.setSelectionRange(0, 0);
      this.focus();
    });
  }
}
