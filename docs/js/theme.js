/* Светла / тъмна тема. Зарежда се синхронно (без defer) от всяка страница,
   за да сложи html[data-theme] преди първото рисуване.
   Ред на избора: ?theme=dark|light (само за този изглед, напр. вграждане)
   → запомнен избор (localStorage nvo-theme) → системната настройка. */
(function() {
  var KEY = 'nvo-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var forced = null;
  try {
    forced = new URLSearchParams(window.location.search).get('theme');
  } catch (e) {}
  if (forced !== 'dark' && forced !== 'light') {
    forced = null;
  }

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function current() {
    return forced || stored() || (media && media.matches ? 'dark' : 'light');
  }

  function apply(theme, notify) {
    root.setAttribute('data-theme', theme);
    if (!notify) {
      return;
    }
    try {
      document.dispatchEvent(new CustomEvent('nvo:themechange', { detail: { theme: theme } }));
    } catch (e) {}
    // Старите страници (блог статиите) прерисуват графиките си през window.redraw.
    if (typeof window.redraw === 'function') {
      try { window.redraw(); } catch (e) {}
    }
  }

  apply(current(), false);

  // Почистване на остатъци от премахнатите сезонни теми.
  try { localStorage.removeItem('nvo-skin'); } catch (e) {}

  if (media) {
    var onSystemChange = function() {
      if (!forced && !stored()) {
        apply(current(), true);
      }
    };
    if (media.addEventListener) {
      media.addEventListener('change', onSystemChange);
    } else if (media.addListener) {
      media.addListener(onSystemChange);
    }
  }

  window.isDarkTheme = function() {
    return root.getAttribute('data-theme') === 'dark';
  };

  window.toggleTheme = function() {
    var next = window.isDarkTheme() ? 'light' : 'dark';
    forced = null;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply(next, true);
  };
})();
