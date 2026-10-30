// Виртуалната файлова система на конзолата: дърво в паметта. ~ (/home/ivan) се пази в localStorage,
// /tmp живее до затваряне на таба, останалото е само за четене. Динамичните директории (/bin, /proc,
// /usr/share/man, по-късно /nvo) създават съдържанието си при четене.

export const HOME = '/home/ivan';
export const USER = 'ivan';

const STORE_KEY = 'nvo-console-home';
const LIMIT = 1024 * 1024;

export const MESSAGES = {
  ENOENT: 'Няма такъв файл или директория',
  ENOTDIR: 'Не е директория',
  EISDIR: 'Е директория',
  EEXIST: 'Файлът съществува',
  EACCES: 'Отказан достъп',
  EROFS: 'Файловата система е само за четене',
  ENOSPC: 'Няма място на устройството',
  ENOTEMPTY: 'Директорията не е празна',
  EINVAL: 'Невалиден аргумент',
};

export class FsError extends Error {
  constructor(code, path) {
    super(MESSAGES[code] || code);
    this.code = code;
    this.path = path;
  }
}

export function dirNode(opts = {}) {
  return { type: 'dir', children: new Map(), mode: 0o755, mtime: Date.now(), owner: 'root', ...opts };
}

export function fileNode(content = '', opts = {}) {
  return { type: 'file', content, mode: 0o644, mtime: Date.now(), owner: 'root', ...opts };
}

/** Нормализира пътя спрямо cwd: махат се ".", "..", двойните "/". */
export function normalize(path, cwd = '/') {
  const abs = String(path).startsWith('/') ? String(path) : cwd.replace(/\/+$/, '') + '/' + path;
  const out = [];
  for (const seg of abs.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return '/' + out.join('/');
}

export function basename(path) {
  const p = String(path).replace(/\/+$/, '');
  if (!p) return '/';
  return p.slice(p.lastIndexOf('/') + 1);
}

export function dirname(path) {
  const p = String(path).replace(/\/+$/, '');
  const i = p.lastIndexOf('/');
  if (i < 0) return '.';
  if (i === 0) return '/';
  return p.slice(0, i);
}

const encoder = new TextEncoder();

export function byteLength(content) {
  if (content instanceof Uint8Array) return content.length;
  return encoder.encode(String(content)).length;
}

export function isBinary(content) {
  return content instanceof Uint8Array;
}

function toBytes(content) {
  return content instanceof Uint8Array ? content : encoder.encode(String(content));
}

function concat(a, b) {
  if (!isBinary(a) && !isBinary(b)) return String(a) + String(b);
  const x = toBytes(a);
  const y = toBytes(b);
  const out = new Uint8Array(x.length + y.length);
  out.set(x, 0);
  out.set(y, x.length);
  return out;
}

function b64encode(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function b64decode(text) {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Glob шаблон за едно име → RegExp (* ? [..]). Скритите файлове - само с изрична точка. */
export function globToRegExp(pattern) {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\' && i + 1 < pattern.length) {
      re += pattern[++i].replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    } else if (ch === '*') {
      re += '[^/]*';
    } else if (ch === '?') {
      re += '[^/]';
    } else if (ch === '[') {
      const end = pattern.indexOf(']', i + 2);
      if (end < 0) {
        re += '\\[';
      } else {
        let body = pattern.slice(i + 1, end);
        if (body.startsWith('!')) body = '^' + body.slice(1);
        re += '[' + body.replace(/\\/g, '\\\\') + ']';
        i = end;
      }
    } else {
      re += ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    }
  }
  return new RegExp(re + '$');
}

export function hasGlob(pattern) {
  return /(^|[^\\])[*?[]/.test(pattern);
}

export class Vfs {
  constructor() {
    this.root = dirNode();
    this.persistent = true;
    this.warning = null;
  }

  /** Създава директориите по пътя (без проверка за права) - за изграждане на системата. */
  ensureDir(path, opts = {}) {
    let node = this.root;
    for (const seg of path.split('/').filter(Boolean)) {
      let child = node.children.get(seg);
      if (!child) {
        child = dirNode(opts);
        node.children.set(seg, child);
      }
      node = child;
    }
    return node;
  }

  /** Поставя готов възел (статичен файл, динамична директория) на пътя. */
  mount(path, node) {
    const parent = this.ensureDir(dirname(path));
    parent.children.set(basename(path), node);
    return node;
  }

  async child(dir, name) {
    if (dir.provider) return (await dir.provider.get(name)) || null;
    return dir.children.get(name) || null;
  }

  async names(dir) {
    if (dir.provider) return (await dir.provider.list()).slice().sort(compareNames);
    return Array.from(dir.children.keys()).sort(compareNames);
  }

  async lookup(path) {
    let node = this.root;
    if (path === '/') return node;
    const segs = path.split('/').filter(Boolean);
    for (const seg of segs) {
      if (node.type !== 'dir') throw new FsError('ENOTDIR', path);
      if (node.noAccess) throw new FsError('EACCES', path);
      const child = await this.child(node, seg);
      if (!child) throw new FsError('ENOENT', path);
      node = child;
    }
    return node;
  }

  async exists(path) {
    try {
      await this.lookup(path);
      return true;
    } catch {
      return false;
    }
  }

  async readdir(path) {
    const node = await this.lookup(path);
    if (node.type !== 'dir') throw new FsError('ENOTDIR', path);
    if (node.noAccess) throw new FsError('EACCES', path);
    return this.names(node);
  }

  async readFile(path) {
    const node = await this.lookup(path);
    if (node.type === 'dir') throw new FsError('EISDIR', path);
    if (node.noAccess) throw new FsError('EACCES', path);
    if (node.read) return await node.read();
    return node.content;
  }

  async size(node) {
    if (node.type === 'dir') return 4096;
    if (node.size !== undefined) return typeof node.size === 'function' ? node.size() : node.size;
    if (node.read) return 0;
    return byteLength(node.content);
  }

  writable(path) {
    return path === HOME || path.startsWith(HOME + '/') || path === '/tmp' || path.startsWith('/tmp/');
  }

  denied(path) {
    return new FsError(path === '/nvo' || path.startsWith('/nvo/') ? 'EROFS' : 'EACCES', path);
  }

  async writeFile(path, data, { append = false } = {}) {
    const parent = await this.lookup(dirname(path));
    if (parent.type !== 'dir') throw new FsError('ENOTDIR', path);
    const name = basename(path);
    const existing = await this.child(parent, name);
    if (existing && existing.type === 'dir') throw new FsError('EISDIR', path);
    if (existing && existing.write) {
      await existing.write(data, append);
      return;
    }
    if (!this.writable(path) || (existing && existing.read)) throw this.denied(path);
    if (existing) {
      const old = { content: existing.content, mtime: existing.mtime };
      existing.content = append ? concat(existing.content, data) : data;
      existing.mtime = Date.now();
      this.commit(path, () => Object.assign(existing, old));
    } else {
      parent.children.set(name, fileNode(data, { owner: USER }));
      parent.mtime = Date.now();
      this.commit(path, () => parent.children.delete(name));
    }
  }

  async touch(path) {
    const parent = await this.lookup(dirname(path));
    if (parent.type !== 'dir') throw new FsError('ENOTDIR', path);
    const existing = await this.child(parent, basename(path));
    if (existing) {
      if (this.writable(path) && !existing.read) {
        existing.mtime = Date.now();
        this.commit(path, () => {});
      }
      return;
    }
    await this.writeFile(path, '');
  }

  async mkdir(path, { parents = false } = {}) {
    if (await this.exists(path)) {
      const node = await this.lookup(path);
      if (parents && node.type === 'dir') return;
      throw new FsError('EEXIST', path);
    }
    const parentPath = dirname(path);
    if (!(await this.exists(parentPath))) {
      if (!parents) throw new FsError('ENOENT', path);
      await this.mkdir(parentPath, { parents: true });
    }
    const parent = await this.lookup(parentPath);
    if (parent.type !== 'dir') throw new FsError('ENOTDIR', path);
    if (!this.writable(path)) throw this.denied(path);
    const name = basename(path);
    parent.children.set(name, dirNode({ owner: USER }));
    parent.mtime = Date.now();
    this.commit(path, () => parent.children.delete(name));
  }

  async remove(path, { recursive = false, dirOnly = false } = {}) {
    const node = await this.lookup(path);
    if (!this.writable(dirname(path)) || !this.writable(path) || node.read || node.write) throw this.denied(path);
    if (node.type === 'dir') {
      if (!recursive && !dirOnly) throw new FsError('EISDIR', path);
      if (dirOnly && node.children.size) throw new FsError('ENOTEMPTY', path);
    } else if (dirOnly) {
      throw new FsError('ENOTDIR', path);
    }
    const parent = await this.lookup(dirname(path));
    const name = basename(path);
    parent.children.delete(name);
    this.commit(path, () => parent.children.set(name, node));
  }

  async rename(src, dst) {
    if (dst === src) return;
    if (dst.startsWith(src + '/')) throw new FsError('EINVAL', dst);
    const node = await this.lookup(src);
    if (!this.writable(src) || !this.writable(dirname(src)) || node.read) throw this.denied(src);
    if (!this.writable(dst)) throw this.denied(dst);
    const dstParent = await this.lookup(dirname(dst));
    if (dstParent.type !== 'dir') throw new FsError('ENOTDIR', dst);
    const existing = dstParent.children.get(basename(dst));
    if (existing && existing.type === 'dir') throw new FsError('EISDIR', dst);
    const srcParent = await this.lookup(dirname(src));
    srcParent.children.delete(basename(src));
    dstParent.children.set(basename(dst), node);
    node.mtime = Date.now();
    this.commit(dst, () => {
      dstParent.children.delete(basename(dst));
      if (existing) dstParent.children.set(basename(dst), existing);
      srcParent.children.set(basename(src), node);
    });
  }

  /** Дълбоко копие на възел; динамичните файлове се прочитат. */
  async cloneNode(node) {
    if (node.type === 'dir') {
      const copy = dirNode({ owner: USER, mode: node.mode });
      for (const name of await this.names(node)) {
        copy.children.set(name, await this.cloneNode(await this.child(node, name)));
      }
      return copy;
    }
    const content = node.read ? await node.read() : node.content;
    return fileNode(isBinary(content) ? content.slice() : content, { owner: USER, mode: node.mode & 0o777 });
  }

  async copy(src, dst) {
    const node = await this.lookup(src);
    if (!this.writable(dst)) throw this.denied(dst);
    const parent = await this.lookup(dirname(dst));
    if (parent.type !== 'dir') throw new FsError('ENOTDIR', dst);
    const existing = parent.children.get(basename(dst));
    if (existing && existing.type === 'dir' && node.type !== 'dir') throw new FsError('EISDIR', dst);
    const copy = await this.cloneNode(node);
    parent.children.set(basename(dst), copy);
    this.commit(dst, () => {
      if (existing) parent.children.set(basename(dst), existing);
      else parent.children.delete(basename(dst));
    });
  }

  async chmod(path, mode) {
    const node = await this.lookup(path);
    if (!this.writable(path) || node.read) throw this.denied(path);
    const old = node.mode;
    node.mode = mode;
    this.commit(path, () => { node.mode = old; });
  }

  /** Записва ~ в localStorage; при надвишен лимит връща промяната и хвърля ENOSPC. */
  commit(path, undo) {
    if (!(path === HOME || path.startsWith(HOME + '/'))) return;
    if (!this.persistent) return;
    let json;
    try {
      json = JSON.stringify(this.serialize());
    } catch {
      return;
    }
    if (json.length > LIMIT) {
      undo();
      throw new FsError('ENOSPC', path);
    }
    try {
      localStorage.setItem(STORE_KEY, json);
    } catch (e) {
      undo();
      if (e && e.name === 'QuotaExceededError') throw new FsError('ENOSPC', path);
      this.persistent = false;
      this.warning = 'localStorage не е достъпен - файловете в ~ няма да се запазят.';
    }
  }

  serialize() {
    const out = [];
    const walk = (node, path) => {
      for (const [name, child] of node.children) {
        if (child.read || child.write || child.provider) continue;
        const p = path + '/' + name;
        if (child.type === 'dir') {
          out.push({ p, t: 'd', m: child.mode, mt: child.mtime });
          walk(child, p);
        } else if (isBinary(child.content)) {
          out.push({ p, t: 'f', m: child.mode, mt: child.mtime, b: b64encode(child.content) });
        } else {
          out.push({ p, t: 'f', m: child.mode, mt: child.mtime, c: child.content });
        }
      }
    };
    walk(this.ensureDir(HOME), HOME);
    return out;
  }

  /** Възстановява ~ от localStorage; връща false, ако няма запазено състояние. */
  restore() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch {
      this.persistent = false;
      this.warning = 'localStorage не е достъпен - файловете в ~ няма да се запазят.';
      return false;
    }
    if (!raw) return false;
    let entries;
    try {
      entries = JSON.parse(raw);
    } catch {
      return false;
    }
    const home = this.ensureDir(HOME);
    for (const e of entries) {
      if (!e.p || !e.p.startsWith(HOME + '/')) continue;
      const parent = this.ensureDir(dirname(e.p), { owner: USER });
      const name = basename(e.p);
      if (e.t === 'd') {
        const node = parent.children.get(name) || dirNode({ owner: USER });
        node.mode = e.m;
        node.mtime = e.mt;
        parent.children.set(name, node);
      } else {
        parent.children.set(name, fileNode(e.b !== undefined ? b64decode(e.b) : e.c, { owner: USER, mode: e.m, mtime: e.mt }));
      }
    }
    home.owner = USER;
    return true;
  }

  usage() {
    try {
      return (localStorage.getItem(STORE_KEY) || '').length;
    } catch {
      return 0;
    }
  }

  get limit() {
    return LIMIT;
  }

  /**
   * Разгръща glob шаблон (относителен или абсолютен) спрямо cwd.
   * Връща съвпаденията във вида, в който е написан шаблонът; [] когато няма.
   */
  async glob(pattern, cwd) {
    const absolute = pattern.startsWith('/');
    const segs = pattern.split('/').filter((s, i) => s || i === 0);
    let paths = [{ abs: absolute ? '/' : cwd, shown: absolute ? '/' : '' }];
    const parts = absolute ? segs.slice(1) : segs;
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      const last = i === parts.length - 1;
      const next = [];
      for (const p of paths) {
        if (!hasGlob(seg)) {
          const literal = seg.replace(/\\(.)/g, '$1');
          const abs = normalize(literal, p.abs);
          if (await this.exists(abs)) next.push({ abs, shown: p.shown + literal + (last ? '' : '/') });
          continue;
        }
        let node;
        try {
          node = await this.lookup(p.abs);
        } catch {
          continue;
        }
        if (node.type !== 'dir' || node.noAccess) continue;
        const re = globToRegExp(seg);
        for (const name of await this.names(node)) {
          if (name.startsWith('.') && !seg.startsWith('.')) continue;
          if (!re.test(name)) continue;
          const abs = normalize(name, p.abs);
          if (!last) {
            const child = await this.child(node, name);
            if (!child || child.type !== 'dir') continue;
          }
          next.push({ abs, shown: p.shown + name + (last ? '' : '/') });
        }
      }
      paths = next;
      if (!paths.length) break;
    }
    return paths.map((p) => p.shown).sort(compareNames);
  }
}

const collator = new Intl.Collator('bg', { sensitivity: 'base', numeric: true });

/** Подредба като ls в bg_BG: без значение на главни/малки букви и водещите точки. */
export function compareNames(a, b) {
  const x = a.replace(/^\.+/, '');
  const y = b.replace(/^\.+/, '');
  return collator.compare(x, y) || (a < b ? -1 : a > b ? 1 : 0);
}

/** "drwxr-xr-x" за ls -l. */
export function modeString(node) {
  const m = node.mode || 0;
  const t = node.type === 'dir' ? 'd' : node.dev ? 'c' : '-';
  let s = t;
  for (const shift of [6, 3, 0]) {
    const bits = (m >> shift) & 7;
    s += (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + (bits & 1 ? 'x' : '-');
  }
  return s;
}
