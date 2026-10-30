// Мрежа без сървър: curl, wget (адресите на сайта и услуги с CORS), dig/nslookup/host (DNS през HTTPS),
// myip, ping (HTTP ping). ssh, telnet, nc и подобните само обясняват защо не могат да работят в браузър.

import { define } from '../registry.js';
import { basename, normalize, isBinary } from '../vfs.js';
import { SITE_ROOT, dateLong, humanSize, pad2 } from './util.js';
import { abortError, isAbort } from '../shell.js';

const MAX_BYTES = 5 * 1024 * 1024;
const FILE_LIKE = /\.(json|html?|csv|tsv|txt|js|mjs|css|xml|md|pdf|png|svg|jpe?g|gif|ico|webp|woff2?|ttf)$/i;

export class NetError extends Error {
  constructor(message, code = 7) {
    super(message);
    this.code = code;
  }
}

/** Адрес от аргумент: https://…, хост (example.com/път) или път в сайта (api/v1/index.json, /7/sofia/). */
export function resolveUrl(arg) {
  const s = String(arg).trim();
  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s);
    if (u.protocol === 'http:' && location.protocol === 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(u.hostname)) {
      throw new NetError('само https:// - браузърът блокира http:// от защитена страница', 1);
    }
    return u;
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) throw new NetError('протоколът "' + s.split(':')[0] + '" не се поддържа (само https)', 1);
  const first = s.split('/')[0];
  if (!s.startsWith('/') && !s.startsWith('.') && /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(first) && !FILE_LIKE.test(first)) {
    return new URL('https://' + s);
  }
  return new URL(s.replace(/^\/+/, ''), SITE_ROOT);
}

function linkedSignal(parent, ms) {
  const c = new AbortController();
  const onAbort = () => c.abort();
  parent.addEventListener('abort', onAbort, { once: true });
  const t = ms ? setTimeout(() => c.abort(new DOMException('timeout', 'TimeoutError')), ms) : null;
  return { signal: c.signal, done: () => { clearTimeout(t); parent.removeEventListener('abort', onAbort); }, timedOut: () => c.signal.reason && c.signal.reason.name === 'TimeoutError' };
}

/** fetch с лимит на размера и ясни грешки (CORS, мрежа, Ctrl+C). */
export async function fetchLimited(ctx, url, init = {}, { maxBytes = MAX_BYTES, timeout = 30000 } = {}) {
  const link = linkedSignal(ctx.signal, timeout);
  let res;
  try {
    res = await fetch(url, { ...init, signal: link.signal, referrerPolicy: 'no-referrer', credentials: 'omit' });
  } catch (e) {
    link.done();
    if (ctx.signal.aborted) throw abortError();
    if (link.timedOut()) throw new NetError('времето за връзка с ' + url.host + ' изтече', 28);
    if (url.origin === location.origin) throw new NetError('неуспешна връзка с ' + url.host + ' (няма мрежа?)');
    throw new NetError('неуспешна връзка с ' + url.host + ': сървърът е недостъпен или не позволява достъп от браузър (CORS)');
  }
  const len = Number(res.headers.get('content-length') || 0);
  if (len > maxBytes) {
    link.done();
    throw new NetError('файлът е твърде голям (' + humanSize(len) + ', най-много ' + humanSize(maxBytes) + ')', 63);
  }
  const chunks = [];
  let total = 0;
  try {
    if (res.body && res.body.getReader) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) {
          reader.cancel();
          throw new NetError('файлът е твърде голям (над ' + humanSize(maxBytes) + ')', 63);
        }
        chunks.push(value);
      }
    } else {
      const buf = new Uint8Array(await res.arrayBuffer());
      chunks.push(buf);
      total = buf.length;
    }
  } catch (e) {
    if (e instanceof NetError) throw e;
    if (ctx.signal.aborted) throw abortError();
    throw new NetError('връзката прекъсна: ' + e.message, 56);
  } finally {
    link.done();
  }
  const bytes = new Uint8Array(total);
  let off = 0;
  for (const ch of chunks) {
    bytes.set(ch, off);
    off += ch.length;
  }
  return { res, bytes };
}

export function isTextType(type) {
  return !type || /^text\/|json|xml|javascript|csv|svg|x-sh|yaml|ecmascript/i.test(type);
}

export function decodeBody(bytes, type) {
  return isTextType(type) ? new TextDecoder().decode(bytes) : bytes;
}

function statusLine(res) {
  return 'HTTP/1.1 ' + res.status + (res.statusText ? ' ' + res.statusText : '');
}

function headerLines(res) {
  const out = [];
  res.headers.forEach((v, k) => out.push(k + ': ' + v));
  return out;
}

async function freeName(ctx, abs) {
  if (!(await ctx.fs.exists(abs))) return abs;
  for (let i = 1; ; i++) {
    if (!(await ctx.fs.exists(abs + '.' + i))) return abs + '.' + i;
  }
}

function remoteName(url) {
  const b = basename(decodeURIComponent(url.pathname));
  return b && b !== '/' ? b : 'index.html';
}

define({
  name: 'curl',
  group: 'net',
  summary: 'HTTP заявка (сайтът и услуги с CORS)',
  usage: 'curl [ОПЦИЯ]... АДРЕС',
  description: 'АДРЕС може да е път в сайта (api/v1/index.json, /7/sofia/) или https:// адрес. Външни сайтове работят само ако позволяват достъп от браузър (CORS) - иначе curl казва това.\nБраузърът показва само част от заглавките на чужди сайтове. Няма http:// (само https), бисквитки и собствен User-Agent.',
  options: [['-o ФАЙЛ', 'записва в ~ (или където посочите)'], ['-O', 'записва с името от адреса'], ['-s', 'без съобщения за грешки'], ['-S', 'с -s: все пак показва грешките'], ['-f', 'грешка (код 22) при HTTP 400 и нагоре'], ['-i', 'заглавките преди тялото'], ['-I', 'само заглавките (HEAD)'], ['-L', 'следва пренасочванията (винаги е така)'], ['-X МЕТОД', 'GET, POST, ...'], ['-H "Име: стойност"', 'заглавка (може няколко)'], ['-d ДАННИ', 'тяло на заявката (POST)'], ['-v', 'подробно']],
  examples: [['curl api/v1/index.json | jq .grades', ''], ['curl -O api/v1/balove/sofia.json', 'в текущата директория'], ['curl -I https://raw.githubusercontent.com/ivandavidov/nvo/main/README.md', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'o:OsSfiIlLX:H:d:vkA:w:', multi: 'Hd', long: ['output=', 'remote-name', 'silent', 'fail', 'include', 'head', 'location', 'request=', 'header=', 'data=', 'verbose', 'compressed', 'insecure'] });
    const silent = opts.s || opts.silent;
    const showErr = !silent || opts.S;
    const say = (code, msg) => {
      if (showErr) ctx.io.stderr.write('curl: (' + code + ') ' + msg + '\n');
      return code;
    };
    if (!rest.length) return say(2, 'липсва адрес. Опитайте "curl --help".');
    let url;
    try {
      url = resolveUrl(rest[0]);
    } catch (e) {
      return say(e.code || 3, e.message);
    }
    const headers = {};
    for (const h of [...(opts.H || []), ...(opts.header ? [opts.header] : [])]) {
      const i = h.indexOf(':');
      if (i > 0) headers[h.slice(0, i).trim()] = h.slice(i + 1).trim();
    }
    const data = [...(opts.d || []), ...(opts.data ? [opts.data] : [])];
    const head = opts.I || opts.head;
    const method = (opts.X || opts.request || (head ? 'HEAD' : data.length ? 'POST' : 'GET')).toUpperCase();
    const init = { method, headers, cache: 'no-store' };
    if (data.length) {
      init.body = data.join('&');
      if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    if (opts.v || opts.verbose) {
      ctx.io.stderr.write('* Заявка към ' + url.href + ' (през браузъра)\n> ' + method + ' ' + url.pathname + url.search + '\n> Host: ' + url.host + '\n' + Object.entries(headers).map(([k, v]) => '> ' + k + ': ' + v + '\n').join('') + '>\n');
    }
    let res;
    let bytes;
    try {
      ({ res, bytes } = await fetchLimited(ctx, url, init));
    } catch (e) {
      if (isAbort(e)) throw e;
      return say(e.code || 7, e.message);
    }
    const type = res.headers.get('content-type') || '';
    if (opts.v || opts.verbose) ctx.io.stderr.write('< ' + statusLine(res) + '\n' + headerLines(res).map((l) => '< ' + l + '\n').join('') + '<\n');
    if ((opts.f || opts.fail) && res.status >= 400) return say(22, 'Заявката върна грешка: ' + res.status);
    let headText = '';
    if (head || opts.i || opts.include) headText = statusLine(res) + '\n' + headerLines(res).join('\n') + '\n\n';
    const outFile = opts.o ?? opts.output ?? (opts.O || opts['remote-name'] ? remoteName(url) : null);
    if (outFile !== null && outFile !== '-') {
      const abs = ctx.resolve(outFile);
      try {
        await ctx.fs.writeFile(abs, head ? headText : isTextType(type) ? new TextDecoder().decode(bytes) : bytes);
      } catch (e) {
        return say(23, 'неуспешен запис в ' + outFile + ': ' + e.message);
      }
      if (!silent && ctx.isTTY) ctx.io.stderr.write('Записани ' + bytes.length + ' байта в ' + outFile + '\n');
      return 0;
    }
    ctx.out(headText);
    if (head) return 0;
    const body = decodeBody(bytes, type);
    if (isBinary(body)) {
      if (ctx.isTTY) {
        ctx.io.stderr.write('Предупреждение: двоичният изход може да развали терминала.\nПредупреждение: ползвайте "-o ФАЙЛ" или "-O", за да го запишете.\n');
        return 23;
      }
      ctx.out(new TextDecoder().decode(body));
      return 0;
    }
    ctx.out(body);
    return 0;
  },
});

define({
  name: 'wget',
  group: 'net',
  summary: 'изтегля файл в конзолата (сайтът и услуги с CORS)',
  usage: 'wget [-O ФАЙЛ] [-q] [-P ДИРЕКТОРИЯ] АДРЕС...',
  description: 'Записва файла във файловата система на конзолата (по подразбиране в текущата директория). За сваляне на компютъра: "download ФАЙЛ". Ограниченията са като при curl.',
  options: [['-O ФАЙЛ', 'име на файла ("-" = stdout)'], ['-q', 'без съобщения'], ['-P ДИРЕКТОРИЯ', 'къде да запише']],
  examples: [['wget api/v1/cities.json', ''], ['wget -O - api/v1/index.json | jq .grades', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'O:qP:nc', long: ['output-document=', 'quiet', 'directory-prefix='] });
    const quiet = opts.q || opts.quiet;
    const log = (s) => {
      if (!quiet) ctx.io.stderr.write(s);
    };
    if (!rest.length) return ctx.fail('липсва адрес\nУпотреба: wget [ОПЦИЯ]... [АДРЕС]...');
    let st = 0;
    for (const arg of rest) {
      let url;
      try {
        url = resolveUrl(arg);
      } catch (e) {
        ctx.err(e.message);
        st = 1;
        continue;
      }
      const now = new Date();
      const stamp = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()) + ' ' + pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
      log('--' + stamp + '--  ' + url.href + '\n');
      log('Свързване с ' + url.host + ' (' + url.protocol.replace(':', '').toUpperCase() + ')... ');
      const t0 = performance.now();
      let res;
      let bytes;
      try {
        ({ res, bytes } = await fetchLimited(ctx, url, { cache: 'no-store' }));
      } catch (e) {
        if (isAbort(e)) throw e;
        log('неуспех.\n');
        ctx.err(e.message);
        st = 4;
        continue;
      }
      log('свързан.\nHTTP заявката е изпратена, чакане на отговор... ' + res.status + ' ' + (res.statusText || '') + '\n');
      if (res.status >= 400) {
        log(stamp + ' ГРЕШКА ' + res.status + ': ' + (res.statusText || 'неуспех') + '.\n\n');
        st = 8;
        continue;
      }
      const type = res.headers.get('content-type') || '';
      log('Дължина: ' + bytes.length + ' (' + humanSize(bytes.length) + ')' + (type ? ' [' + type.split(';')[0] + ']' : '') + '\n');
      const target = opts.O ?? opts['output-document'];
      const content = isTextType(type) ? new TextDecoder().decode(bytes) : bytes;
      if (target === '-') {
        ctx.out(isBinary(content) ? new TextDecoder().decode(content) : content);
        continue;
      }
      const dir = opts.P ?? opts['directory-prefix'];
      let abs = target !== undefined ? ctx.resolve(target) : normalize(remoteName(url), dir ? ctx.resolve(dir) : ctx.sh.cwd);
      if (target === undefined) abs = await freeName(ctx, abs);
      const shown = target !== undefined ? target : ctx.sh.displayPath(abs).replace(ctx.sh.displayPath(ctx.sh.cwd) + '/', '');
      log("Запазване в: '" + shown + "'\n\n");
      try {
        await ctx.fs.writeFile(abs, content);
      } catch (e) {
        ctx.err(shown + ': ' + e.message);
        st = 3;
        continue;
      }
      const secs = Math.max(0.001, (performance.now() - t0) / 1000);
      log(stamp + ' (' + humanSize(Math.round(bytes.length / secs)).replace(/([KMG])$/, ' $1B') + '/s) - ' + "'" + shown + "' е записан [" + bytes.length + '/' + bytes.length + ']\n\n');
    }
    return st;
  },
});

// ─── DNS през HTTPS ──────────────────────────────────────────────────────────────

const TYPES = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 12: 'PTR', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 43: 'DS', 46: 'RRSIG', 48: 'DNSKEY', 64: 'SVCB', 65: 'HTTPS', 257: 'CAA' };
const TYPE_NAMES = new Set(Object.values(TYPES).concat(['ANY']));
const RCODES = { 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 4: 'NOTIMP', 5: 'REFUSED' };
const PROVIDERS = {
  google: { name: 'dns.google', addr: '8.8.8.8', url: (n, t) => 'https://dns.google/resolve?name=' + encodeURIComponent(n) + '&type=' + t },
  cloudflare: { name: 'cloudflare-dns.com', addr: '1.1.1.1', url: (n, t) => 'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(n) + '&type=' + t },
};

function pickProvider(server) {
  if (!server) return null;
  if (/^(1\.1\.1\.1|1\.0\.0\.1|cloudflare)/i.test(server)) return 'cloudflare';
  return 'google';
}

/** DNS заявка през DoH JSON (dns.google, резервно cloudflare-dns.com). */
export async function dohQuery(ctx, name, type, server) {
  const order = server ? [pickProvider(server)] : ['google', 'cloudflare'];
  let lastErr = null;
  for (const key of order) {
    const p = PROVIDERS[key];
    const t0 = performance.now();
    try {
      const { res, bytes } = await fetchLimited(ctx, new URL(p.url(name, type)), { headers: { accept: 'application/dns-json' }, cache: 'no-store' }, { timeout: 10000 });
      if (!res.ok) throw new NetError(p.name + ' върна HTTP ' + res.status);
      const json = JSON.parse(new TextDecoder().decode(bytes));
      return { json, provider: p, ms: Math.round(performance.now() - t0) };
    } catch (e) {
      if (isAbort(e)) throw e;
      lastErr = e;
    }
  }
  throw new NetError('няма връзка с DNS през HTTPS: ' + (lastErr ? lastErr.message : ''), 9);
}

function reverseName(ip) {
  if (ip.includes(':')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const full = [...left, ...Array(8 - left.length - right.length).fill('0'), ...right].map((h) => h.padStart(4, '0')).join('');
    return full.split('').reverse().join('.') + '.ip6.arpa';
  }
  return ip.split('.').reverse().join('.') + '.in-addr.arpa';
}

const fqdn = (n) => (n.endsWith('.') ? n : n + '.');
const typeName = (t) => TYPES[t] || 'TYPE' + t;

define({
  name: 'dig',
  group: 'net',
  summary: 'DNS заявка (през HTTPS)',
  usage: 'dig [@СЪРВЪР] ИМЕ [ВИД] [+short] | dig -x IP',
  description: 'Пита DNS през HTTPS (dns.google или cloudflare-dns.com с @1.1.1.1). ВИД: A, AAAA, MX, TXT, NS, CNAME, SOA, CAA, PTR, ...',
  options: [['+short', 'само отговорите'], ['-x IP', 'обратна заявка (PTR)'], ['@1.1.1.1', 'през Cloudflare вместо Google']],
  examples: [['dig ivandavidov.github.io', ''], ['dig github.com MX +short', ''], ['dig -x 8.8.8.8', '']],
  async run(ctx) {
    let server = null;
    let short = false;
    let name = null;
    let type = 'A';
    const args = ctx.args.slice();
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a.startsWith('@')) server = a.slice(1);
      else if (a === '+short') short = true;
      else if (a.startsWith('+')) continue;
      else if (a === '-x') {
        name = reverseName(args[++i] || '');
        type = 'PTR';
      } else if (a === '-t') type = (args[++i] || 'A').toUpperCase();
      else if (TYPE_NAMES.has(a.toUpperCase()) && name !== null) type = a.toUpperCase();
      else if (name === null) name = a;
      else if (TYPE_NAMES.has(a.toUpperCase())) type = a.toUpperCase();
    }
    if (!name) name = '.';
    let r;
    try {
      r = await dohQuery(ctx, name, type, server);
    } catch (e) {
      if (isAbort(e)) throw e;
      ctx.print(';; ' + e.message);
      return 9;
    }
    const { json, provider, ms } = r;
    const answers = json.Answer || [];
    if (short) {
      ctx.out(answers.filter((a) => typeName(a.type) === type || type === 'ANY').map((a) => a.data + '\n').join('') || answers.map((a) => a.data + '\n').join(''));
      return 0;
    }
    const rec = (a) => fqdn(a.name).padEnd(24) + ' ' + String(a.TTL ?? '').padEnd(6) + ' IN\t' + typeName(a.type) + '\t' + a.data;
    const lines = [
      '; <<>> DiG 9.18 (DNS през HTTPS) <<>> ' + ctx.args.join(' '),
      ';; ->>HEADER<<- opcode: QUERY, status: ' + (RCODES[json.Status] || json.Status),
      ';; flags: qr' + (json.RD ? ' rd' : '') + (json.RA ? ' ra' : '') + (json.AD ? ' ad' : '') + '; QUERY: 1, ANSWER: ' + answers.length + ', AUTHORITY: ' + (json.Authority || []).length,
      '',
      ';; QUESTION SECTION:',
      ';' + fqdn(name).padEnd(23) + '        IN\t' + type,
    ];
    if (answers.length) lines.push('', ';; ANSWER SECTION:', ...answers.map(rec));
    if (json.Authority && json.Authority.length) lines.push('', ';; AUTHORITY SECTION:', ...json.Authority.map(rec));
    lines.push('', ';; Query time: ' + ms + ' msec', ';; SERVER: ' + provider.addr + '#443(' + provider.name + ') (HTTPS)', ';; WHEN: ' + dateLong(), '');
    ctx.out(lines.join('\n') + '\n');
    return 0;
  },
});

define({
  name: 'nslookup',
  group: 'net',
  summary: 'адресите на хост (DNS през HTTPS)',
  usage: 'nslookup ИМЕ [СЪРВЪР]',
  examples: [['nslookup github.com', '']],
  async run(ctx) {
    const name = ctx.args.find((a) => !a.startsWith('-'));
    if (!name) return ctx.fail('употреба: nslookup ИМЕ [СЪРВЪР]');
    const server = ctx.args.filter((a) => !a.startsWith('-'))[1] || null;
    try {
      const a = await dohQuery(ctx, name, 'A', server);
      const aaaa = await dohQuery(ctx, name, 'AAAA', server);
      let out = 'Server:\t\t' + a.provider.name + '\nAddress:\t' + a.provider.addr + '#443 (HTTPS)\n\n';
      if (a.json.Status === 3) {
        ctx.out(out + '** сървърът не може да намери ' + name + ': NXDOMAIN\n');
        return 1;
      }
      out += 'Неавторитетен отговор:\n';
      for (const rec of [...(a.json.Answer || []), ...(aaaa.json.Answer || [])]) {
        if (rec.type === 5) out += fqdn(rec.name).replace(/\.$/, '') + '\tканоничното име = ' + rec.data + '\n';
        else if (rec.type === 1 || rec.type === 28) out += 'Name:\t' + rec.name.replace(/\.$/, '') + '\nAddress: ' + rec.data + '\n';
      }
      ctx.out(out);
      return 0;
    } catch (e) {
      if (isAbort(e)) throw e;
      return ctx.fail(e.message);
    }
  },
});

define({
  name: 'host',
  group: 'net',
  summary: 'кратка DNS справка (през HTTPS)',
  usage: 'host [-t ВИД] ИМЕ',
  examples: [['host github.com', ''], ['host -t TXT github.com', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 't:a' });
    const name = rest[0];
    if (!name) return ctx.fail('употреба: host [-t ВИД] ИМЕ');
    const isIp = /^[\d.]+$/.test(name) || name.includes(':');
    const types = opts.t ? [opts.t.toUpperCase()] : isIp ? ['PTR'] : ['A', 'AAAA', 'MX'];
    let out = '';
    try {
      for (const t of types) {
        const q = isIp ? reverseName(name) : name;
        const { json } = await dohQuery(ctx, q, t);
        if (json.Status === 3) {
          ctx.out('Хостът ' + name + ' не е намерен: 3(NXDOMAIN)\n');
          return 1;
        }
        for (const rec of json.Answer || []) {
          const n = rec.name.replace(/\.$/, '');
          if (rec.type === 5 && t !== 'CNAME') out += n + ' е псевдоним на ' + rec.data + '\n';
          else if (rec.type === 1) out += n + ' има адрес ' + rec.data + '\n';
          else if (rec.type === 28) out += n + ' има IPv6 адрес ' + rec.data + '\n';
          else if (rec.type === 15) out += 'пощата за ' + n + ' се обработва от ' + rec.data + '\n';
          else if (rec.type === 12) out += n + ' сочи към ' + rec.data + '\n';
          else out += n + ' ' + typeName(rec.type) + ' ' + rec.data + '\n';
        }
      }
    } catch (e) {
      if (isAbort(e)) throw e;
      return ctx.fail(e.message);
    }
    ctx.out(out || name + ' няма записи от вид ' + types.join(', ') + '\n');
    return 0;
  },
});

define({
  name: 'myip',
  group: 'net',
  summary: 'външният IP адрес на този компютър',
  usage: 'myip',
  description: 'Пита публична услуга с CORS (api.ipify.org, резервно ifconfig.co).',
  async run(ctx) {
    const sources = [
      ['https://api.ipify.org?format=json', (t) => JSON.parse(t).ip],
      ['https://api64.ipify.org?format=json', (t) => JSON.parse(t).ip],
      ['https://ifconfig.co/json', (t) => JSON.parse(t).ip],
    ];
    for (const [u, parse] of sources) {
      try {
        const { res, bytes } = await fetchLimited(ctx, new URL(u), { cache: 'no-store' }, { timeout: 8000 });
        if (!res.ok) continue;
        const ip = parse(new TextDecoder().decode(bytes));
        if (ip) {
          ctx.print(ip);
          return 0;
        }
      } catch (e) {
        if (isAbort(e)) throw e;
      }
    }
    return ctx.fail('нито една услуга не отговори');
  },
});

define({
  name: 'ping',
  group: 'net',
  summary: 'HTTP ping: време за HTTP заявка до хост',
  usage: 'ping [-c БРОЙ] [-i СЕКУНДИ] [-W СЕКУНДИ] ХОСТ',
  description: 'Браузърът не може да праща ICMP пакети, затова ping мери времето за HTTPS заявка до хоста (първата включва DNS и TLS). В терминала продължава до Ctrl+C; в pipe прави 4 опита.',
  options: [['-c БРОЙ', 'брой опити'], ['-i СЕКУНДИ', 'интервал (по подразбиране 1)'], ['-W СЕКУНДИ', 'изчакване на отговор (по подразбиране 5)']],
  examples: [['ping -c 3 github.com', ''], ['ping ivandavidov.github.io', '']],
  async run(ctx) {
    const { opts, rest } = ctx.getopt({ short: 'c:i:W:qn' });
    if (!rest.length) return ctx.fail('липсва адрес\nУпотреба: ping [-c БРОЙ] ХОСТ', 2);
    let url;
    try {
      url = resolveUrl(/^https?:\/\//.test(rest[0]) ? rest[0] : 'https://' + rest[0].replace(/\/.*$/, '') + '/');
    } catch (e) {
      return ctx.fail(e.message, 2);
    }
    const host = url.host;
    const count = opts.c !== undefined ? Math.max(1, Number(opts.c)) : ctx.isTTY ? Infinity : 4;
    const interval = Math.max(0.2, Number(opts.i || 1)) * 1000;
    const wait = Math.max(1, Number(opts.W || 5)) * 1000;
    ctx.print('PING ' + host + ' (HTTP ping към ' + url.origin + '/)');
    const times = [];
    let sent = 0;
    const t0 = performance.now();
    const stats = () => {
      const lost = sent - times.length;
      let s = '\n--- ' + host + ' статистика (HTTP ping) ---\n' + sent + ' изпратени, ' + times.length + ' получени, ' + (sent ? Math.round((lost / sent) * 100) : 0) + '% загуба, време ' + Math.round(performance.now() - t0) + ' ms\n';
      if (times.length) {
        const min = Math.min(...times);
        const max = Math.max(...times);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const f = (x) => x.toFixed(1).replace('.', ',');
        s += 'rtt мин/сред/макс = ' + f(min) + '/' + f(avg) + '/' + f(max) + ' ms\n';
      }
      return s;
    };
    try {
      while (sent < count) {
        sent++;
        const link = linkedSignal(ctx.signal, wait);
        const start = performance.now();
        try {
          await fetch(url.origin + '/?nvo-ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: link.signal, referrerPolicy: 'no-referrer', credentials: 'omit' });
          const ms = performance.now() - start;
          times.push(ms);
          if (!opts.q) ctx.print('отговор от ' + host + ': seq=' + sent + ' време=' + ms.toFixed(1).replace('.', ',') + ' ms');
        } catch {
          if (ctx.signal.aborted) throw abortError();
          if (!opts.q) ctx.print('няма отговор от ' + host + ': seq=' + sent + (link.timedOut() ? ' (изтекло време)' : ' (недостъпен)'));
        } finally {
          link.done();
        }
        if (sent < count) await ctx.sleep(interval);
      }
    } catch (e) {
      if (!isAbort(e)) throw e;
      ctx.out(stats());
      return times.length ? 0 : 1;
    }
    ctx.out(stats());
    return times.length ? 0 : 1;
  },
});

const NO_TCP = 'браузърът не позволява директни TCP връзки от уеб страница.';

for (const [name, summary, extra, code] of [
  ['ssh', 'SSH връзка (не е възможна в браузър)', 'SSH от уеб страница изисква релей - сървър, който приема WebSocket и сам отваря SSH връзката (напр. ttyd или wetty на собствен сървър, защитен с парола). Конзолата няма такъв.', 255],
  ['telnet', 'telnet (не е възможен в браузър)', '', 1],
  ['nc', 'netcat (не е възможен в браузър)', '', 1],
  ['ftp', 'FTP (не е възможен в браузър)', 'За файлове по HTTPS ползвайте wget или curl.', 1],
  ['traceroute', 'маршрут до хост (не е възможен в браузър)', 'За време до хост ползвайте ping (HTTP ping).', 1],
]) {
  define({
    name,
    aliases: name === 'nc' ? ['netcat', 'ncat'] : name === 'ssh' ? ['scp', 'sftp', 'rsync', 'mosh'] : name === 'traceroute' ? ['tracepath', 'mtr'] : [],
    group: 'net',
    summary,
    usage: name + ' ...',
    description: 'Не работи в конзолата: ' + NO_TCP + (extra ? '\n' + extra : ''),
    run(ctx) {
      const target = ctx.args.filter((a) => !a.startsWith('-')).pop();
      const where = target ? ' ' + target.replace(/^.*@/, '') : '';
      ctx.err((name === 'ssh' ? 'connect to host' + where + ' port 22: ' : '') + NO_TCP + (extra ? '\n' + extra : '') + "\nВиж 'man " + name + "'.");
      return code;
    },
  });
}
