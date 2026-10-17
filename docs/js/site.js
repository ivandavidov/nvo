// Общото поведение на всяка страница: меню „Още“, глобално търсене,
// копиране на адреси за дарения и вицът във футъра.
// ES модул — пътищата до останалите модули и до данните са спрямо този файл.

export const SITE_ROOT = new URL('../', import.meta.url);

export function siteUrl(path) {
  return new URL(path, SITE_ROOT).toString();
}

function initMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.getElementById('site-menu');
  if (!toggle || !panel) {
    return;
  }
  const close = (focusToggle) => {
    if (panel.hidden) {
      return;
    }
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) {
      toggle.focus();
    }
  };
  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      const first = panel.querySelector('a');
      if (first) {
        first.focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) {
      close(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close(panel.contains(document.activeElement));
    }
  });
}

let paletteModule = null;

function loadPalette() {
  if (!paletteModule) {
    paletteModule = import('./ui/search-palette.js');
  }
  return paletteModule;
}

function openSearch(query) {
  loadPalette().then((m) => m.openPalette(query));
}

function isTypingTarget(el) {
  if (!el) {
    return false;
  }
  const tag = el.tagName;
  return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function initSearch() {
  document.querySelectorAll('[data-search-open]').forEach((btn) => {
    btn.addEventListener('click', () => openSearch(btn.getAttribute('data-search-query') || ''));
    // Индексът се тегли още при посочване, за да са готови резултатите при писане.
    const warm = () => loadPalette().then((m) => m.preloadIndex());
    btn.addEventListener('pointerenter', warm, { once: true });
    btn.addEventListener('focus', warm, { once: true });
  });
  // Самият модул е малък — зареждаме го, щом браузърът е свободен, за да не губим
  // първите натиснати букви след „/“.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => loadPalette());
  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if ((k === 'k' || k === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openSearch('');
    } else if (k === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(document.activeElement)) {
      e.preventDefault();
      openSearch('');
    }
  });
  // Полета, които при писане отварят търсачката (напр. на началната страница).
  document.querySelectorAll('[data-search-input]').forEach((input) => {
    input.addEventListener('focus', () => loadPalette().then((m) => m.preloadIndex()));
    input.addEventListener('input', () => {
      const q = input.value;
      input.value = '';
      openSearch(q);
    });
  });
}

export async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // ще опитаме по стария начин
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  ta.remove();
  return ok;
}

function initCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!btn) {
      return;
    }
    if (await copyText(btn.getAttribute('data-copy'))) {
      btn.classList.add('is-copied');
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => btn.classList.remove('is-copied'), 1600);
    }
  });
}

function initJoke() {
  const el = document.querySelector('[data-joke]');
  if (!el) {
    return;
  }
  import('./core/jokes.js').then(({ randomJoke }) => {
    const j = randomJoke();
    el.textContent = '„' + j.q + '“ ';
    const author = document.createElement('span');
    author.className = 'joke__author';
    author.textContent = '— ' + j.a;
    el.appendChild(author);
  });
}

let toastHost = null;

export function toast(message) {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastHost);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  toastHost.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

initMenu();
initSearch();
initCopyButtons();
initJoke();
