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
    '</div>'
  ].join('');

  document.body.insertBefore(header, document.body.firstChild);

  if (isGamesHub) {
    document.body.classList.add('games-hub');
  } else {
    document.body.classList.add('games-detail');
  }
})();
