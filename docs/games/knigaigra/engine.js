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

  function fill(txt) {
    if (!txt) { return ''; }
    var top = (cityData && cityData.top) || { school: 'Математическата гимназия', profile: 'Математика и АЕ', min: 450, max: 498 };
    var mid = (cityData && cityData.mid) || { school: '7 СУ с езиков профил', profile: 'Английски и ИТ', min: 340, max: 410 };
    var tech = (cityData && cityData.tech) || { school: 'ПГ по транспорт и туризъм', profile: 'Компютърна техника и кулинария', min: 210, max: 320 };
    var rm = rumor || (cityData && cityData.pickRumor && cityData.pickRumor()) || { school: top.school, profile: top.profile, claim: 485, min: top.min, max: top.max, truth: 'lower' };

    return txt
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
      .replace(/\{rumorMax\}/g, num(rm.max));
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
      comment = 'Браво! Твоята майчина интуиция не те подведе — Вайбър слуховете отново се оказаха силно раздути! Реалният минимален бал от първо класиране е бил <strong>' + num(rm.min) + ' точки</strong>.';
    } else {
      comment = 'Е, не позна съвсем, но това доказва златното правило: никога не вярвай на 100% на това, което пишат другите майки в 23:00 ч.! Реалният минимален бал е бил <strong>' + num(rm.min) + ' точки</strong>.';
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
      '<p>Сега разполагаш с истинските числа и можеш да прецениш реалния шанс на Гроздомир, без да изпадаш в излишна истерия!</p>';

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
      endTitle = '🏆 Финал: „Гроздомир в Елита — Мама в кардиологията“';
      endBadge = 'Медал за Свръхамбициозна Майка';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Чудото става! Благодарение на твоите тайни среднощни корекции и размествания Гроздомир е класиран по първо желание в <strong>' + top.school + '</strong>!');
      p.push('Ти пускаш 27 триумфални снимки във Вайбър групата на класа с надпис: <em>„Който учи, той сполучва! Честито на приетите, а за останалите — има прекрасни техникуми! 🎓✨🍷“</em>. Г-жа Хаджиева те блокира моментално.');
      p.push('На 15 септември обаче пристига реалността: Гроздомир получава списък от 14 учебника по немски, 4 тетрадки с решетка и задължителен СИП по термодинамика. Пламен се чуди откъде ще намери пари за частни уроци през следващите 5 години, а Гроздомир още в първия учебен ден пита дали в 8. клас може да се повтаря по собствено желание.');
    } else if (f.respectChild || (st.ambition <= 4 && st.child >= 6)) {
      // Край 2: Прагматичният успех
      endTitle = '🍕 Финал: „Прагматичният избор на Гроздомир“';
      endBadge = 'Орден за Мъдро Родителство';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир е приет с лекота по първо желание в избраното от него училище — <strong>' + mid.school + '</strong>!');
      p.push('Пламен е изключително доволен от трезвото мислене на сина си: <em>„Видя ли, скъпа? Момчето избра точно това, което му харесва, без излишен стрес и паника!“</em>.');
      p.push('Училището е близко, учителите са мотивирани, а Гроздомир има време за спорт, приятели и истински интереси. Ти първоначално леко се притесняваше какво ще каже баба Румяна, но когато видя спокойното и усмихнато лице на сина си всяка сутрин, разбра, че това е най-добрият избор!');
    } else if (f.peaceTreaty || (st.stress <= 4 && st.child >= 6)) {
      // Край 3: Дзен Мама и спокойният баланс
      endTitle = '🧘 Финал: „Дзен Мама и Златната среда“';
      endBadge = 'Купа за Семейна Хармония';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир е класиран в <strong>' + mid.school + '</strong> — точно там, където и двамата се съгласихте по време на среднощните преговори над препечените филийки!');
      p.push('Паралелката съчетава модерен софтуерен профил с интензивен чужд език. Гроздомир става в 7:25, ходи пеша на училище и изкарва стабилни шестици по специалните предмети.');
      p.push('Ти изхвърляш шишенцата с валериан, записваш се на пилатес и за първи път от три години спиш по 8 часа на нощ. Когато мамите от квартала се съберат да се оплакват от кандидатстването, ти само се усмихваш загадъчно и отпиваш капучино.');
    } else if (st.viber >= 8) {
      // Край 4: Вайбър Инфлуенсърът на випуска
      endTitle = '📱 Финал: „Майка на годината в БГ-Мама“';
      endBadge = 'Трофей „Главен Администратор на Випуска“';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир е приет в добро училище, но истинският победител в тази кампания си ТИ!');
      p.push('Твоите точни анализи, светкавични проверки на баловете и иронични отговори срещу г-жа Хаджиева те превърнаха в неоспорим лидер на родителското тяло в ' + S.cityName + '. Създаваш нова Вайбър общност: <em>„Оцеляване след 7. клас с хумор и здрав разум“</em> с над 4 500 последователи.');
      p.push('Издаваш наръчник за кандидатстване, а Гроздомир гордо разказва на приятелите си: <em>„Майка ми стана инфлуенсърка благодарение на моя екоанализ на „Серафим“!“</em>.');
    } else if (st.stress >= 9 && st.child <= 3) {
      // Край 5: Паника и Агротехникума
      endTitle = '🚜 Финал: „Служебно разпределение в Агротехникума“';
      endBadge = 'Антистрес Диплом „Оцеляла на косъм“';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('От стрес, недоспиване и предозиране с билкови капки в 4:00 ч. сутринта си разменила цифрите в кода на последното желание.');
      p.push('Гроздомир е класиран в специалност <em>„Механизация на селското стопанство и агроекология“</em> в съседната община!');
      p.push('Баба Румяна звъни изумена в 08:00 ч.: <em>„Скъпа, това някаква нова европейска програма за устойчиво биоземеделие ли е?!“</em>. Гроздомир те поглежда философски: <em>„Е, мамо... поне има чист въздух и няма интеграли.“</em>');
    } else {
      // Край 6: IT Крипто-Милионерът
      endTitle = '💻 Финал: „ИТ Стартъпът на Гроздомир“';
      endBadge = 'Сертификат за Неочакван Гений';
      p.push('<strong>10 ЮЛИ — ИЗЛИЗА ПЪРВО КЛАСИРАНЕ:</strong>');
      p.push('Гроздомир влиза в квартално училище с разширено изучаване на информатика, просто защото беше най-близо до леглото му.');
      p.push('Вместо да решава скучни уравнения за домашно, Гроздомир започва да програмира скриптове за автоматично попълване на заявления за класиране. Още в 10. клас неговият софтуер е закупен от чуждестранен технологичен фонд!');
      p.push('На 18 години Гроздомир ти подарява чисто нов кросоувър с думите: <em>„Мамо, помниш ли как се притесняваше за трапеца в 7. клас? Трапецът не ми потрябва, но твоята подкрепа ме научи да вярвам в себе си!“</em>.');
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
      'Помни: Оценките и баловете са само един етап от живота, а спокойствието, доверието и любовта в семейството са безценни! ❤️</p>' +
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
