/* Theme initialization - loaded synchronously (no defer) to prevent FOUC */
(function() {
  var saved = localStorage.getItem('nvo-theme');
  if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    saved = 'dark';
  }
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleTheme() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('nvo-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('nvo-theme', 'dark');
  }
  if (typeof redraw === 'function') {
    try { redraw(); } catch(e) {}
  }
}
