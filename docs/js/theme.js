/* Theme initialization - loaded synchronously (no defer) to prevent FOUC */

/* ------------------------------------------------------------------------
   Цветови теми ("skins") по календар.
   Всички теми са компилирани в css/skins.css под html[data-skin="..."];
   тук само избираме коя да е активна и слагаме атрибута на <html>.

   AUTO_SKIN = false изключва всичко (календар + селектор) и сайтът се
   рисува само с css/theme.css. Превключва се с ./theme.sh auto on|off.
   ------------------------------------------------------------------------ */
var AUTO_SKIN = true;

/* Календар: [тема, от, до, описание]; първото съвпадение печели.
   Граници: "ММ-ДД" или "EASTER±N" (православен Великден).
   Единствен източник — theme.sh го чете оттук; трябва да е валиден JSON. */
/* CALENDAR-START */
var SKIN_CALENDAR = [
  ["newyear",       "01-01",     "01-07",     "Нова година"],
  ["shevitsa",      "01-21",     "01-21",     "Бабинден"],
  ["trifon",        "02-12",     "02-15",     "Трифон Зарезан / Св. Валентин"],
  ["levski",        "02-19",     "02-19",     "Обесването на Васил Левски"],
  ["mother-tongue", "02-21",     "02-21",     "Ден на майчиния език"],
  ["martenitsa",    "03-01",     "03-02",     "Баба Марта"],
  ["bg",            "03-03",     "03-03",     "Ден на Освобождението"],
  ["martenitsa",    "03-04",     "03-07",     "Баба Марта"],
  ["women",         "03-08",     "03-08",     "Ден на жената"],
  ["pi-day",        "03-14",     "03-14",     "Ден на числото π"],
  ["gabrovo",       "04-01",     "04-01",     "Ден на хумора и шегата"],
  ["kukeri",        "EASTER-50", "EASTER-48", "Сирни Заговезни / Кукери"],
  ["easter",        "EASTER-8",  "EASTER+7",  "Лазаровден, Цветница, Великден"],
  ["book-day",      "04-23",     "04-23",     "Ден на книгата"],
  ["winter",        "01-08",     "02-29",     "Зима"],
  ["spring",        "03-09",     "EASTER-9",  "Първа пролет"],
  ["gergiovden",    "05-04",     "05-07",     "Гергьовден / Ден на храбростта"],
  ["europe",        "05-09",     "05-09",     "Ден на Европа"],
  ["24may",         "05-20",     "05-24",     "24 май"],
  ["graduation",    "05-25",     "05-29",     "Абитуриенти / ДЗИ"],
  ["children",      "05-30",     "06-01",     "Ден на детето"],
  ["botev",         "06-02",     "06-02",     "Ден на Ботев"],
  ["enyovden",      "06-23",     "06-25",     "Еньовден"],
  ["ilinden",       "08-02",     "08-02",     "Илинден"],
  ["summer",        "07-01",     "08-31",     "Лятна ваканция"],
  ["bg",            "09-06",     "09-06",     "Ден на Съединението"],
  ["school-start",  "09-15",     "09-21",     "Първи учебен ден"],
  ["bg",            "09-22",     "09-22",     "Ден на Независимостта"],
  ["teachers",      "10-05",     "10-05",     "Ден на учителя"],
  ["autumn",        "10-01",     "10-27",     "Есен"],
  ["halloween",     "10-28",     "10-31",     "Хелоуин"],
  ["buditeli",      "11-01",     "11-05",     "Ден на народните будители"],
  ["late-autumn",   "11-06",     "12-02",     "Късна есен"],
  ["nikulden",      "12-03",     "12-07",     "Никулден"],
  ["christmas",     "12-15",     "12-27",     "Коледа"],
  ["newyear",       "12-28",     "12-31",     "Нова година"]
];
/* CALENDAR-END */

/* Имена за селектора (темите, които не са в календара, също са тук). */
var SKIN_NAMES = {
  "default": "Стандартна", "contrast": "Висок контраст",
  "newyear": "Нова година", "winter": "Зима", "shevitsa": "Шевица", "trifon": "Трифон Зарезан",
  "levski": "Левски", "mother-tongue": "Майчин език", "martenitsa": "Баба Марта", "bg": "Трибагреник",
  "women": "8 март", "pi-day": "Ден на π", "spring": "Пролет", "kukeri": "Кукери", "gabrovo": "Ден на хумора",
  "easter": "Великден", "book-day": "Ден на книгата", "gergiovden": "Гергьовден", "europe": "Ден на Европа",
  "24may": "24 май", "graduation": "Абитуриенти", "children": "Ден на детето", "botev": "2 юни",
  "enyovden": "Еньовден", "summer": "Лято", "ilinden": "Илинден", "school-start": "15 септември",
  "teachers": "Ден на учителя", "autumn": "Есен", "halloween": "Хелоуин", "buditeli": "Будители",
  "late-autumn": "Късна есен", "nikulden": "Никулден", "christmas": "Коледа"
};

function orthodoxEaster(y) {
  // Meeus (юлиански календар) + 13 дни за григориански (валидно 1900–2099)
  var a = y % 4, b = y % 7, c = y % 19;
  var d = (19 * c + 15) % 30;
  var e = (2 * a + 4 * b - d + 34) % 7;
  var month = Math.floor((d + e + 114) / 31);
  var day = ((d + e + 114) % 31) + 1;
  var dt = new Date(y, month - 1, day);
  dt.setDate(dt.getDate() + 13);
  return dt;
}

function skinForDate(date) {
  var y = date.getFullYear();
  var t = new Date(y, date.getMonth(), date.getDate()).getTime();
  var easter = orthodoxEaster(y);
  function bound(spec) {
    if (spec.indexOf('EASTER') === 0) {
      var dt = new Date(easter.getTime());
      dt.setDate(dt.getDate() + (parseInt(spec.slice(6), 10) || 0));
      return dt.getTime();
    }
    return new Date(y, parseInt(spec.slice(0, 2), 10) - 1, parseInt(spec.slice(3, 5), 10)).getTime();
  }
  for (var i = 0; i < SKIN_CALENDAR.length; i++) {
    var r = SKIN_CALENDAR[i];
    if (bound(r[1]) <= t && t <= bound(r[2])) return r[0];
  }
  return 'default';
}

/* Кой skin да се приложи: ?skin= (само за този изглед) > избор от селектора
   (localStorage 'nvo-skin': 'auto' | име) > календар. null = без атрибут. */
function resolveSkin() {
  var q = null;
  try { q = new URLSearchParams(window.location.search).get('skin'); } catch (e) {}
  if (q) return q === 'off' ? 'default' : q;
  if (!AUTO_SKIN) return null;
  var saved = null;
  try { saved = localStorage.getItem('nvo-skin'); } catch (e) {}
  if (saved && saved !== 'auto') return saved;
  return skinForDate(new Date());
}

function applySkin(name) {
  if (name) document.documentElement.setAttribute('data-skin', name);
  else document.documentElement.removeAttribute('data-skin');
}

(function() {
  var saved = localStorage.getItem('nvo-theme');
  if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    saved = 'dark';
  }
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  applySkin(resolveSkin());
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
  setTimeout(function() {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }, 50);
}

/* Селектор "Тема" във footer-а (само когато AUTO_SKIN е включен). */
document.addEventListener('DOMContentLoaded', function() {
  if (!AUTO_SKIN) return;
  var host = document.querySelector('.site-footer .footer-content');
  if (!host) return;

  var saved = null;
  try { saved = localStorage.getItem('nvo-skin'); } catch (e) {}
  var forced = null;
  try { forced = new URLSearchParams(window.location.search).get('skin'); } catch (e) {}
  var current = forced ? (forced === 'off' ? 'default' : forced) : (saved || 'auto');

  var label = document.createElement('label');
  label.className = 'skin-picker';
  label.appendChild(document.createTextNode('Тема '));
  var sel = document.createElement('select');
  sel.setAttribute('aria-label', 'Цветова тема');

  function opt(value, text) {
    var o = document.createElement('option');
    o.value = value; o.textContent = text;
    if (value === current) o.selected = true;
    sel.appendChild(o);
  }
  opt('auto', 'Автоматична (' + (SKIN_NAMES[skinForDate(new Date())] || 'Стандартна') + ')');
  opt('default', SKIN_NAMES['default']);
  opt('contrast', SKIN_NAMES['contrast']);
  var seen = { 'default': true, 'contrast': true };
  for (var i = 0; i < SKIN_CALENDAR.length; i++) {
    var n = SKIN_CALENDAR[i][0];
    if (seen[n]) continue;
    seen[n] = true;
    opt(n, SKIN_NAMES[n] || n);
  }
  if (!seen[current] && current !== 'auto') opt(current, SKIN_NAMES[current] || current);

  sel.addEventListener('change', function() {
    var v = sel.value;
    try { localStorage.setItem('nvo-skin', v); } catch (e) {}
    if (forced) {
      // махаме ?skin= от адреса, за да важи изборът от селектора
      try {
        var u = new URL(window.location.href);
        u.searchParams.delete('skin');
        history.replaceState(null, '', u.toString());
      } catch (e) {}
      forced = null;
    }
    applySkin(v === 'auto' ? skinForDate(new Date()) : v);
    if (typeof redraw === 'function') {
      try { redraw(); } catch (e) {}
    }
  });

  label.appendChild(sel);
  host.appendChild(label);
});
