// Състоянието на страница по клас в адреса — същият договор като преди:
//   ?i{g}=индекси (избраните училища), ?school=код (deep link), ?year=година
//   (исторически изглед), #град; изборът се помни и в бисквитка i{g}.
import { COOKIE_MAX_AGE_SECONDS } from './config.js';
import { findSchoolIndexByCode } from './model.js';

export function readYearParam() {
  return new URL(window.location.href).searchParams.get('year');
}

export function readSchoolParam() {
  return new URL(window.location.href).searchParams.get('school');
}

export function readCityHash() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ''));
}

/** Началният избор: ?school= → ?s=кодове → ?i{g}= → бисквитка → базовите училища на класа. */
export function initialSelection(model) {
  const { cfg, s } = model;
  const url = new URL(window.location.href);
  let ids = null;
  const code = url.searchParams.get('school');
  if (code) {
    const idx = findSchoolIndexByCode(model, code);
    if (idx >= 0) {
      ids = [String(idx)];
    }
  }
  if (!ids && url.searchParams.get('s')) {
    // Стабилни кодове на училища (ползват се от вграждането): ?s=2216306,2211304
    const fromCodes = url.searchParams.get('s').split(',')
      .map((c) => findSchoolIndexByCode(model, c.trim()))
      .filter((i) => i >= 0)
      .map(String);
    if (fromCodes.length) {
      ids = fromCodes;
    }
  }
  if (!ids) {
    const param = url.searchParams.get(cfg.cookieName);
    if (param) {
      ids = param.split(',').map((i) => i.split('#')[0]).filter((i) => i !== '');
    }
  }
  if (!ids) {
    const m = (document.cookie + ';').match(new RegExp('(?:^|;\\s*)' + cfg.cookieName + '=([^;]*);'));
    if (m && m[1]) {
      const fromCookie = m[1].split('#')[0];
      if (fromCookie) {
        ids = fromCookie.split(',').filter((i) => i !== '');
      }
    }
  }
  if (!ids) {
    ids = [String(cfg.baseSchoolIndex), String(cfg.refSchoolIndex)];
  }
  const out = [];
  ids.forEach((id) => {
    const n = Number(id);
    if (Number.isInteger(n) && s[n] && !out.includes(n)) {
      out.push(n);
    }
  });
  return out;
}

/** Записва избора в адреса (replaceState) и в бисквитката — като стария handleURL. */
/** history.replaceState, който не чупи страницата, ако браузърът го ограничи (Safari: 100 пъти за 10 s). */
function replaceUrl(url) {
  try {
    window.history.replaceState(null, '', url);
  } catch (e) {
    // адресът ще се обнови при следващата промяна
  }
}

export function writeSelection(model, indices, cityHash) {
  const { cfg, timeTravelYear } = model;
  const url = new URL(window.location.href);
  const anchor = cityHash !== undefined ? cityHash : url.hash.replace(/^#/, '');
  const base = url.origin + url.pathname;
  const yearQuery = timeTravelYear ? 'year=' + timeTravelYear : '';
  if (indices.length === 0) {
    document.cookie = cfg.cookieName + '=;path=/;max-age=-1';
    const query = yearQuery ? '?' + yearQuery : '';
    replaceUrl(base + query + (anchor ? '#' + anchor : ''));
  } else {
    const list = indices.join(',');
    document.cookie = cfg.cookieName + '=' + list + ';path=/;max-age=' + COOKIE_MAX_AGE_SECONDS;
    const query = (yearQuery ? yearQuery + '&' : '') + cfg.cookieName + '=' + list;
    replaceUrl(base + '?' + query + (anchor ? '#' + anchor : ''));
  }
}

/** Пълният адрес за споделяне на текущия избор. */
export function shareUrl(model, indices, cityHash) {
  const { cfg, timeTravelYear } = model;
  const url = new URL(window.location.origin + window.location.pathname);
  if (timeTravelYear) {
    url.searchParams.set('year', String(timeTravelYear));
  }
  if (indices.length) {
    url.searchParams.set(cfg.cookieName, indices.join(','));
  }
  let href = url.toString().replace(/%2C/g, ',');
  if (cityHash) {
    href += '#' + cityHash;
  }
  return href;
}
