/* Книга-игра „Приемът на Гроздомир: Мисия Елит“ — Игрови Енджин
   Без външни библиотеки, състояние в localStorage. */
(function () {
  'use strict';

  var KEY = 'nvo-knigaigra-v2';

  var CITIES = [
    ['sofia', 'София'], ['plovdiv', 'Пловдив'], ['varna', 'Варна'], ['burgas', 'Бургас'],
    ['blagoevgrad', 'Благоевград'], ['veliko-turnovo', 'Велико Търново'], ['vidin', 'Видин'],
    ['vratsa', 'Враца'], ['gabrovo', 'Габрово'], ['dobrich', 'Добрич'], ['kurdzhali', 'Кърджали'],
    ['kiustendil', 'Кюстендил'], ['lovech', 'Ловеч'], ['montana', 'Монтана'], ['pazardzhik', 'Пазарджик'],
    ['pernik', 'Перник'], ['pleven', 'Плевен'], ['razgrad', 'Разград'], ['ruse', 'Русе'],
    ['silistra', 'Силистра'], ['sliven', 'Сливен'], ['smolian', 'Смолян'], ['stara-zagora', 'Стара Загора'],
    ['turgovishte', 'Търговище'], ['haskovo', 'Хасково'], ['shumen', 'Шумен'], ['iambol', 'Ямбол']
  ];

  var STATS = [
    { k: 'stress', n: 'Стрес / Кръвно', e: '💊', desc: 'Колко близо си до викане на бърза помощ' },
    { k: 'child', n: 'Гроздомир', e: '🎒', desc: 'Търпението на сина ти преди да избяга през прозореца' },
    { k: 'ambition', n: 'Елитна Амбиция', e: '🎓', desc: 'Мечти за СМГ, Оксфорд и международна кариера' },
    { k: 'viber', n: 'Вайбър Репутация', e: '📱', desc: 'Авторитет сред останалите майки във випуска' }
  ];

  var S = null;
  var cityData = null;
  var rumor = null;
  var el = {};

  /* ---------- Състояние ---------- */

  function fresh(city, cityName) {
    return {
      city: city,
      cityName: cityName,
      ep: 'ch1-01',
      st: { stress: 6, child: 5, ambition: 6, viber: 5 },
      flags: {},
      steps: 0
    };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* частен браузър */ }
  }

  function loadSave() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) { return null; }
      var s = JSON.parse(raw);
      return (s && s.ep && s.st && KI_STORY[s.ep]) ? s : null;
    } catch (e) { return null; }
  }

  function clamp(n) { return Math.max(0, Math.min(10, n)); }

  function applyFx(fx) {
    var out = [];
    if (!fx) { return out; }
    Object.keys(fx).forEach(function (k) {
      if (typeof S.st[k] !== 'undefined') {
        var before = S.st[k];
        S.st[k] = clamp(before + fx[k]);
        var d = S.st[k] - before;
        if (d !== 0) { out.push({ k: k, d: d }); }
      }
    });
    return out;
  }

  /* ---------- Изглед (HUD и Текст) ---------- */

  function hud() {
    if (!el.hud) { return; }
    el.hud.innerHTML = STATS.map(function (s) {
      var v = S.st[s.k];
      var cls = '';
      if (s.k === 'stress') {
        cls = v >= 8 ? ' ki-low' : (v <= 3 ? ' ki-high' : '');
      } else {
        cls = v <= 3 ? ' ki-low' : (v >= 8 ? ' ki-high' : '');
      }
      return '<div class="ki-stat' + cls + '" title="' + s.n + ': ' + v + ' от 10 (' + s.desc + ')">' +
        '<span class="ki-stat-e">' + s.e + '</span>' +
        '<span class="ki-stat-n">' + s.n + '</span>' +
        '<span class="ki-bar"><i style="width:' + (v * 10) + '%"></i></span>' +
        '</div>';
    }).join('');
  }

  function showDeltas(list) {
    if (!list || !list.length) { el.delta.innerHTML = ''; return; }
    el.delta.innerHTML = list.map(function (d) {
      var s = STATS.filter(function (x) { return x.k === d.k; })[0];
      var isPositiveForPlayer = (d.k === 'stress') ? (d.d < 0) : (d.d > 0);
      var cls = isPositiveForPlayer ? 'up' : 'down';
      return '<span class="ki-delta ' + cls + '">' +
        s.e + ' ' + s.n + ' ' + (d.d > 0 ? '+' : '−') + Math.abs(d.d) + '</span>';
    }).join('');
  }

  function num(n) {
    if (typeof n !== 'number') { return n || ''; }
    return String(Math.round(n * 100) / 100).replace('.', ',');
  }

  /* Правописно правило: предлогът „в“ става „във“ пред дума, започваща с „в“ или „ф“
     (във Варна, във Враца, във Велико Търново, във Варненска морска гимназия).
     Прилага се след заместването на плейсхолдърите, защото имената на градовете и
     училищата идват от данните и не се знаят предварително. Пропуска HTML таговете
     между предлога и думата, за да работи и при „в <strong>{city}</strong>“. */
  function fixPrepositions(txt) {
    return txt.replace(
      /(^|[\s(\[„"'>\u2014\u2013-])([\u0412\u0432])(?:\u044a\u0432)?(\s+(?:<[^>]+>\s*)*)(?=([\u0410-\u042f\u0430-\u044f]))/g,
      function (m, pre, v, gap, next) {
        return pre + v + (/[\u0412\u0424\u0432\u0444]/.test(next) ? '\u044a\u0432' : '') + gap;
      }
    );
  }

  function fill(txt) {
    if (!txt) { return ''; }
    var top = (cityData && cityData.top) || { school: 'Математическата гимназия', profile: 'Математика и АЕ', min: 450, max: 498 };
    var mid = (cityData && cityData.mid) || { school: '7 СУ с езиков профил', profile: 'Английски и ИТ', min: 340, max: 410 };
    var tech = (cityData && cityData.tech) || { school: 'ПГ по транспорт и туризъм', profile: 'Компютърна техника и кулинария', min: 210, max: 320 };
    var rm = rumor || (cityData && cityData.pickRumor && cityData.pickRumor()) || { school: top.school, profile: top.profile, claim: 485, min: top.min, max: top.max, truth: 'lower' };

    return fixPrepositions(txt
      .replace(/\{city\}/g, S.cityName)
      .replace(/\{topSchool\}/g, top.school)
      .replace(/\{topProfile\}/g, top.profile)
      .replace(/\{topMin\}/g, num(top.min))
      .replace(/\{topMax\}/g, num(top.max))
      .replace(/\{midSchool\}/g, mid.school)
      .replace(/\{midProfile\}/g, mid.profile)
      .replace(/\{midMin\}/g, num(mid.min))
      .replace(/\{midMax\}/g, num(mid.max))
      .replace(/\{techSchool\}/g, tech.school)
      .replace(/\{techProfile\}/g, tech.profile)
      .replace(/\{techMin\}/g, num(tech.min))
      .replace(/\{techMax\}/g, num(tech.max))
      .replace(/\{rumorSchool\}/g, rm.school)
      .replace(/\{rumorProfile\}/g, rm.profile)
      .replace(/\{rumorClaim\}/g, num(rm.claim))
      .replace(/\{rumorMin\}/g, num(rm.min))
      .replace(/\{rumorMax\}/g, num(rm.max)));
  }

  function paint(ep) {
    el.chapter.textContent = fill(ep.ch || '');
    el.time.textContent = fill(ep.time || '');
    var body = ep.t || [];
    el.text.innerHTML = body.map(function (p) { return '<p>' + fill(p) + '</p>'; }).join('');
    el.widget.innerHTML = '';
    el.choices.innerHTML = '';
    hud();
  }

  function choices(ep) {
    el.choices.innerHTML = '';
    (ep.c || []).forEach(function (c, i) {
      var locked = c.req && !c.req(S);
      var b = document.createElement('button');
      b.className = 'button ki-choice' + (locked ? ' ki-locked' : '');
      b.innerHTML = '<span class="ki-num">' + (i + 1) + '</span>' +
        '<span class="ki-ct">' + fill(c.t) +
        (locked && c.reqTxt ? '<em class="ki-req">' + c.reqTxt + '</em>'
          : (c.note ? '<em class="ki-req">' + c.note + '</em>' : '')) +
        '</span>';
      if (locked) {
        b.disabled = true;
      } else {
        b.onclick = function () { choose(c); };
      }
      el.choices.appendChild(b);
    });
  }

  function choose(c) {
    var d = applyFx(c.fx);
    if (c.f) {
      if (c.f.indexOf(':') > -1) {
        var kv = c.f.split(':');
        S.flags[kv[0]] = kv[1];
      } else {
        S.flags[c.f] = true;
      }
    }
    S.steps++;
    showDeltas(d);
    go(c.to);
  }

  function go(id) {
    S.ep = id;
    save();
    var ep = KI_STORY[id];
    if (!ep) { return; }
    if (ep.end) { return ending(); }

    if (!cityData) {
      el.chapter.textContent = fill(ep.ch || '');
      el.time.textContent = fill(ep.time || '');
      el.text.innerHTML = '<p class="ki-loading">Зареждам училищата и баловете за ' + S.cityName + '…</p>';
      el.widget.innerHTML = '';
      el.choices.innerHTML = '';
      KIData.load(S.city).then(function (data) {
        cityData = data;
        if (!rumor && cityData.pickRumor) { rumor = cityData.pickRumor(); }
        render(ep);
      }).catch(function () {
        render(ep);
      });
      return;
    }

    if (ep.prep === 'rumor' && !rumor && cityData.pickRumor) {
      rumor = cityData.pickRumor();
    }

    render(ep);
  }

  function render(ep) {
    paint(ep);
    if (ep.w === 'balGuess') {
      widgetBalGuess();
    } else {
      choices(ep);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Джаджа: „Слухът на г-жа Калоянова“ ---------- */

  function widgetBalGuess() {
    var rm = rumor || (cityData && cityData.pickRumor && cityData.pickRumor()) || {
      school: 'Математическата гимназия', profile: 'ИТ и Английски', claim: 485, min: 452.5, max: 496, truth: 'lower'
    };
    rumor = rm;

    var opts = [
      ['lower', 'Вайбър преувеличава! Реалният минимален бал е по-нисък.'],
      ['same', 'Точно толкова е — отличниците от цялата област се бутат там!'],
      ['higher', 'Г-жа Калоянова си няма идея — балът е дори още по-висок!']
    ];

    el.widget.innerHTML =
      '<div class="ki-widget">' +
      '<div class="ki-w-head">📱 Слухът в групата на майките</div>' +
      '<div class="ki-w-claim">' + rm.school + ' &middot; ' + rm.profile +
      '<strong>' + num(rm.claim) + ' т.</strong></div>' +
      '<div class="ki-w-q">Според теб какъв е бил истинският минимален бал от 1-во класиране (' + rm.year + ' г.)?</div>' +
      '<div class="ki-w-opts"></div>' +
      '</div>';

    var box = el.widget.querySelector('.ki-w-opts');
    opts.forEach(function (o, i) {
      var b = document.createElement('button');
      b.className = 'button ki-choice';
      b.innerHTML = '<span class="ki-num">' + (i + 1) + '</span><span class="ki-ct">' + o[1] + '</span>';
      b.onclick = function () { revealBal(o[0]); };
      box.appendChild(b);
    });
  }

  function revealBal(guess) {
    var rm = rumor;
    var ok = guess === rm.truth;
    var fx = ok ? { stress: -2, viber: 2 } : { stress: 1, viber: -1 };
    var d = applyFx(fx);
    showDeltas(d);
    hud();
    save();

    var comment = '';
    if (ok) {
      comment = 'Позна! Вайбър слухът пак е бил по-голям от истината. Реалният минимален бал от първо класиране е <strong>' + num(rm.min) + ' точки</strong>.';
    } else {
      comment = 'Не съвсем, но поне проверихме. Златното правило остава: на съобщение от Вайбър в 23:00 ч. се вярва колкото на хороскоп. Реалният минимален бал е <strong>' + num(rm.min) + ' точки</strong>.';
    }

    el.widget.innerHTML =
      '<div class="ki-widget ' + (ok ? 'ki-ok' : 'ki-no') + '">' +
      '<div class="ki-w-head">' + (ok ? '🎉 Позна!' : '🧐 Не съвсем!') + '</div>' +
      '<div class="ki-w-claim">' + rm.school + ' &middot; <em>' + rm.profile + '</em></div>' +
      '<table class="ki-w-tbl"><tbody>' +
      '<tr><td>Слухът на г-жа Калоянова</td><td><strong>' + num(rm.claim) + ' т.</strong></td></tr>' +
      '<tr><td>Официален минимален бал (' + rm.year + ' г., I класиране)</td><td><strong style="color:var(--color-primary-dark)">' + num(rm.min) + ' т.</strong></td></tr>' +
      '<tr><td>Официален максимален бал (' + rm.year + ' г., I класиране)</td><td>' + num(rm.max) + ' т.</td></tr>' +
      '</tbody></table>' +
      '<a class="ki-w-link" href="../../7/balove/' + S.city + '/" target="_blank">🔍 Отвори пълната таблица с баловете за ' + S.cityName + ' &rarr;</a>' +
      '</div>';

    el.text.innerHTML = '<p>' + comment + '</p>' +
      '<p>Вече имаш числата и можеш да прецениш шансовете на Гроздомир без да даваш власт на главните букви в чата.</p>';

    el.choices.innerHTML = '';
    var b = document.createElement('button');
    b.className = 'button ki-choice';
    b.innerHTML = '<span class="ki-num">1</span><span class="ki-ct">Продължи напред към пресмятането на желанията &rarr;</span>';
    b.onclick = function () { S.steps++; go('ch3-after-bal'); };
    el.choices.appendChild(b);
  }

  /* ---------- Финални Развръзки (Endings) ---------- */

  function ending() {
    var st = S.st;
    var f = S.flags;
    var top = (cityData && cityData.top) || { school: 'Математическата гимназия' };
    var mid = (cityData && cityData.mid) || { school: '7 СУ с езиков профил' };
    var tech = (cityData && cityData.tech) || { school: 'ПГ по транспорт и туризъм' };

    var endTitle = '';
    var endBadge = '';
    var p = [];

    // Определяне на финала според изборите и показателите:
    if (f.secretRewrite || (st.ambition >= 8 && st.stress >= 7)) {
      // Край 1: Елитният кошмар
      endTitle = '🏆 Финал: „Гроздомир в елита — мама на преглед“';
      endBadge = 'Медал за свръхамбициозна майка';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Става чудо: след тайните ти среднощни корекции Гроздомир е приет по първо желание в <strong>' + top.school + '</strong>.');
      p.push('Пускаш във Вайбър 27 снимки и съобщение: <em>„Който учи, той сполучва! Честито на приетите. За останалите също има добри училища! 🎓✨🍷“</em> Г-жа Хаджиева те блокира почти веднага.');
      p.push('На 15 септември идва и реалността: 14 учебника по немски, четири тетрадки на квадратчета и избираем предмет по термодинамика. Пламен смята колко ще струват уроците, а Гроздомир още на първия ден пита дали може доброволно да се върне в 7. клас.');
    } else if (f.respectChild || (st.ambition <= 4 && st.child >= 6)) {
      // Край 2: Прагматичният успех
      endTitle = '🍕 Финал: „Прагматичният избор на Гроздомир“';
      endBadge = 'Орден за мъдро родителство';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир е приет по първо желание в избраното от него училище — <strong>' + mid.school + '</strong>.');
      p.push('Пламен е доволен: <em>„Видя ли? Избра нещо, което му харесва, и никой не получи нервна криза.“</em>');
      p.push('Училището е близо, Гроздомир има време за спорт и приятели, а сутрин не тръгва с физиономията на човек, изпратен на каторга. Баба Румяна първо се мръщи, но после се примирява — особено като вижда, че е доволен.');
    } else if (f.peaceTreaty || (st.stress <= 4 && st.child >= 6)) {
      // Край 3: Дзен Мама и спокойният баланс
      endTitle = '🧘 Финал: „Дзен Мама и Златната среда“';
      endBadge = 'Купа за семейна хармония';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир е класиран в <strong>' + mid.school + '</strong> — точно там, за което се разбрахте над филийките в кухнята.');
      p.push('Профилът е софтуерен, има и сериозен чужд език. Гроздомир става в 7:25, ходи пеша и се справя добре по предметите, които всъщност го интересуват.');
      p.push('Прибираш валериана, записваш се на пилатес и за първи път от три години спиш по осем часа. Когато кварталните майки започнат да обсъждат кандидатстването, само отпиваш от капучиното и казваш: <em>„Гледайте данните.“</em>');
    } else if (st.viber >= 8) {
      // Край 4: Вайбър Инфлуенсърът на випуска
      endTitle = '📱 Финал: „Майка на годината във Вайбър“';
      endBadge = 'Трофей „Главен администратор на випуска“';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир е приет в добро училище. Но в чата всички говорят за теб.');
      p.push('След точните ти проверки и няколко добре премерени иронии вече си човекът, когото питат в ' + S.cityName + '. Правиш нова Вайбър група: <em>„Оцеляване след 7. клас с хумор и здрав разум“</em>. Скоро има 4500 души и три правила срещу паника.');
      p.push('Пишеш кратък наръчник, а Гроздомир обяснява на приятелите си: <em>„Майка ми стана инфлуенсърка заради моя анализ на „Серафим“.“</em>');
    } else if (st.stress >= 9 && st.child <= 3) {
      // Край 5: Паника и Агротехникума
      endTitle = '🚜 Финал: „Служебно разпределение в агротехникума“';
      endBadge = 'Антистрес диплом „Оцеляла на косъм“';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('От стрес, недоспиване и билкови капки в четири сутринта си разменяла две цифри в кода на последното желание.');
      p.push('Гроздомир е класиран в специалност <em>„Механизация на селското стопанство и агроекология“</em> в съседната община!');
      p.push('В осем баба Румяна звъни: <em>„Скъпа, това някаква европейска програма за биоземеделие ли е?“</em> Гроздомир те гледа философски: <em>„Е, мамо. Поне въздухът ще е чист и няма да има интеграли.“</em>');
    } else {
      // Край 6: IT Крипто-Милионерът
      endTitle = '💻 Финал: „ИТ стартъпът на Гроздомир“';
      endBadge = 'Сертификат за неочакван гений';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир влиза в квартално училище с разширена информатика. Основният му аргумент е, че е най-близо до леглото му.');
      p.push('Вместо да решава уравнения за домашно, той прави скрипт за попълване на заявления. В 10. клас някакъв фонд купува проекта му и Пламен най-сетне спира да обяснява, че програмирането не е само „цъкане“.');
      p.push('На 18 Гроздомир ти подарява кросоувър и казва: <em>„Мамо, помниш ли трапеца? Не ми потрябва, но ми беше полезно, че ми вярваше.“</em>');
    }

    el.chapter.textContent = fill('Епилог — Развръзката');
    el.time.textContent = '10 юли (Официални резултати)';
    el.text.innerHTML = p.map(function (x) { return '<p>' + fill(x) + '</p>'; }).join('');
    hud();

    var statSummary = STATS.map(function (s) {
      return '<tr><td>' + s.e + ' ' + s.n + '</td><td><strong>' + S.st[s.k] + '</strong> / 10</td></tr>';
    }).join('');

    el.widget.innerHTML =
      '<div class="ki-widget ki-endcard">' +
      '<div class="ki-w-head">' + endTitle + '</div>' +
      '<div class="ki-w-claim" style="font-size:1.05rem;font-weight:700;color:var(--color-primary-dark);margin-bottom:0.8rem">🏅 Получена значка: ' + endBadge + '</div>' +
      '<table class="ki-w-tbl"><tbody>' + statSummary + '</tbody></table>' +
      '<p class="ki-end-note">Изиграни стъпки: <strong>' + S.steps + '</strong>. Град: <strong>' + S.cityName + '</strong>.<br>' +
      'Помни: балът е важен за кандидатстването, но не е мярка за човека. Спокойствието и доверието у дома са по-ценни. ❤️</p>' +
      '<a class="ki-w-link" href="../../7/balove/' + S.city + '/">📊 Разгледай всички реални минимални балове за ' + S.cityName + ' &rarr;</a>' +
      '</div>';

    el.choices.innerHTML = '';
    var b1 = document.createElement('button');
    b1.className = 'button ki-choice';
    b1.innerHTML = '<span class="ki-num">1</span><span class="ki-ct">🔄 Изиграй кандидатстването отново с друга тактика</span>';
    b1.onclick = restart;
    el.choices.appendChild(b1);

    var b2 = document.createElement('button');
    b2.className = 'button ki-choice';
    b2.innerHTML = '<span class="ki-num">2</span><span class="ki-ct">🏙️ Смени града и изживей драмата другаде</span>';
    b2.onclick = function () { reset(); };
    el.choices.appendChild(b2);

    try { localStorage.removeItem(KEY); } catch (e) { /* ok */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Екрани и Навигация ---------- */

  function start(city, cityName) {
    S = fresh(city, cityName);
    cityData = null;
    rumor = null;
    el.start.style.display = 'none';
    el.game.style.display = '';
    el.delta.innerHTML = '';
    go(S.ep);
  }

  function restart() {
    start(S.city, S.cityName);
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ok */ }
    S = null;
    cityData = null;
    rumor = null;
    el.game.style.display = 'none';
    el.start.style.display = '';
    buildStart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildStart() {
    var sel = el.citySel;
    if (!sel.options.length) {
      CITIES.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c[0];
        o.textContent = c[1];
        sel.appendChild(o);
      });
      sel.value = 'sofia';
    }
    var saved = loadSave();
    el.resume.hidden = !saved;
    if (saved) {
      el.resume.querySelector('.ki-ct').textContent =
        'Продължи започнатото с Гроздомир (' + saved.cityName + ')';
    }
  }

  window.KIreset = reset;

  /* ---------- Инициализация ---------- */

  function init() {
    ['start', 'game', 'hud', 'delta', 'chapter', 'time', 'text', 'widget', 'choices', 'citySel', 'resume', 'begin']
      .forEach(function (id) { el[id] = document.getElementById('ki-' + id); });

    buildStart();

    el.begin.onclick = function () {
      var v = el.citySel.value;
      var n = el.citySel.options[el.citySel.selectedIndex].textContent;
      start(v, n);
    };

    el.resume.onclick = function () {
      var saved = loadSave();
      if (!saved) { return; }
      S = saved;
      cityData = null;
      rumor = null;
      el.start.style.display = 'none';
      el.game.style.display = '';
      go(S.ep);
    };

    document.addEventListener('keydown', function (e) {
      if (el.game.style.display === 'none') { return; }
      var n = parseInt(e.key, 10);
      if (!n || n < 1 || n > 9) { return; }
      var btns = el.widget.querySelectorAll('button:not(:disabled)');
      if (!btns.length) { btns = el.choices.querySelectorAll('button:not(:disabled)'); }
      if (btns[n - 1]) { btns[n - 1].click(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
