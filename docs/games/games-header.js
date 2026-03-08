/* Theme init for games pages (no separate theme.js loaded) */
(function() {
  var saved = localStorage.getItem('nvo-theme');
  if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    saved = 'dark';
  }
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

window.toggleTheme = window.toggleTheme || function() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('nvo-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('nvo-theme', 'dark');
  }
  if (document.activeElement) {
    document.activeElement.blur();
  }
};

(function () {
  'use strict';

  var path = window.location.pathname || '';
  var isGamesHub = /\/games(?:\/index\.html)?\/?$/.test(path);
  var rootPrefix = isGamesHub ? '../' : '../../';

  var header = document.createElement('header');
  header.className = 'site-header games-site-header';
  header.innerHTML = [
    '<div class="header-inner">',
    '<a class="site-brand" href="' + rootPrefix + '" aria-label="Начало">',
    '<svg class="site-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
    '<span class="site-name">НВО и ДЗИ</span>',
    '</a>',
    '<nav class="grade-tabs">',
    '<a class="grade-tab" href="' + rootPrefix + '4/">4 клас</a>',
    '<a class="grade-tab" href="' + rootPrefix + '7/">7 клас</a>',
    '<a class="grade-tab" href="' + rootPrefix + '10/">10 клас</a>',
    '<a class="grade-tab" href="' + rootPrefix + '12/">12 клас</a>',
    '<a class="grade-tab active" href="' + (isGamesHub ? './' : '../') + '">Игри</a>',
    '</nav>',
    '<button class="theme-toggle" onclick="toggleTheme()" aria-label="Смяна на тема">',
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    '</button>',
    '</div>'
  ].join('');

  document.body.insertBefore(header, document.body.firstChild);

  if (isGamesHub) {
    document.body.classList.add('games-hub');
  } else {
    document.body.classList.add('games-detail');
  }
})();
