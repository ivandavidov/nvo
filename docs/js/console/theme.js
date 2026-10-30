// Темата на конзолата преди първото рисуване (класически скрипт): тъмна по подразбиране, светла с "theme light".
(function () {
  var theme = 'dark';
  try {
    theme = localStorage.getItem('nvo-console-theme') === 'light' ? 'light' : 'dark';
  } catch (e) {
    theme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'light') {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#f5f7fb');
  }
})();
