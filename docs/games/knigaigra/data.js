/* Книга-игра „Балът на Гроздомир: Мисия Елит“ — Мост към данните за баловете */
var KIData = (function () {
  'use strict';

  var cache = {};

  function load(city) {
    if (cache[city]) { return Promise.resolve(cache[city]); }
    return fetch('../../js/ruo-' + city + '.js')
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.text();
      })
      .then(function (src) {
        var f = new Function(src + '\n;return { years: ruoYears, schools: ruoSchools };');
        var d = f();
        if (!d || !d.years || !d.schools) { throw new Error('Невалидни данни'); }
        var processed = processCityData(d, city);
        cache[city] = processed;
        return processed;
      })
      .catch(function (e) {
        cache[city] = null;
        throw e;
      });
  }

  function roundScore(n) { return Math.round(n * 100) / 100; }

  function processCityData(d, city) {
    var profiles = [];
    var code, sc, pcode, pr, yi, k;

    for (code in d.schools) {
      sc = d.schools[code];
      if (!sc || !sc.p || sc.c) { continue; } // пропускаме частните
      for (pcode in sc.p) {
        pr = sc.p[pcode];
        if (!pr || !pr.d) { continue; }
        // търсим най-новата година с валидни данни
        for (yi = pr.d.length - 1; yi >= 0; yi--) {
          k = pr.d[yi] && pr.d[yi][0]; // 1-во класиране
          if (k && k[0] > 50 && k[3] >= k[0]) {
            profiles.push({
              code: code,
              school: sc.n || sc.f,
              fullSchool: sc.f || sc.n,
              profile: pr.n,
              year: d.years[yi],
              min: roundScore(k[0]),
              max: roundScore(k[3])
            });
            break;
          }
        }
      }
    }

    if (!profiles.length) {
      return fallbackData(city);
    }

    // Сортираме по минимален бал низходящо
    profiles.sort(function (a, b) { return b.min - a.min; });

    var topP = profiles[0];
    var midIdx = Math.floor(profiles.length / 2);
    var midP = profiles[midIdx] || profiles[0];
    var lowIdx = Math.max(0, profiles.length - 1);
    var lowP = profiles[lowIdx] || profiles[0];

    // Намираме характерно професионално/техническо училище (ако има)
    var techP = null;
    for (var i = profiles.length - 1; i >= 0; i--) {
      var name = profiles[i].school.toLowerCase() + ' ' + profiles[i].profile.toLowerCase();
      if (name.indexOf('пг') > -1 || name.indexOf('професионална') > -1 || name.indexOf('техникум') > -1 ||
          name.indexOf('транспорт') > -1 || name.indexOf('туризъм') > -1 || name.indexOf('механо') > -1 ||
          name.indexOf('електро') > -1 || name.indexOf('кулинар') > -1 || name.indexOf('строител') > -1) {
        techP = profiles[i];
        break;
      }
    }
    if (!techP) { techP = lowP; }

    return {
      years: d.years,
      profiles: profiles,
      top: topP,
      mid: midP,
      low: lowP,
      tech: techP,
      pickRumor: function () {
        // Избира профил от топ 40% за Вайбър слуховете на майките
        var pool = profiles.slice(0, Math.max(1, Math.ceil(profiles.length * 0.45)));
        var item = pool[Math.floor(Math.random() * pool.length)];
        var copy = Object.assign({}, item);
        var r = Math.random();
        if (r < 0.45) {
          // слухът завишава бала
          copy.claim = roundScore(copy.min * (1.08 + Math.random() * 0.08));
          copy.truth = 'lower';
        } else if (r < 0.8) {
          // слухът подценява бала
          copy.claim = roundScore(copy.min * (0.85 + Math.random() * 0.08));
          copy.truth = 'higher';
        } else {
          // близък до реалния
          copy.claim = roundScore(copy.min + (Math.random() * 4 - 2));
          copy.truth = 'same';
        }
        if (Math.abs(copy.claim - copy.min) < 2) { copy.truth = 'same'; }
        return copy;
      }
    };
  }

  function fallbackData(city) {
    var dummy = {
      code: "0000",
      school: "Математическа гимназия",
      fullSchool: "Математическа гимназия",
      profile: "Математика и информатика",
      year: 2026,
      min: 440.5,
      max: 495.0
    };
    var techDummy = {
      code: "0001",
      school: "ПГ по транспорт и технологии",
      fullSchool: "ПГ по транспорт и технологии",
      profile: "Автотранспортна техника",
      year: 2026,
      min: 195.0,
      max: 320.0
    };
    return {
      years: [2026],
      profiles: [dummy, techDummy],
      top: dummy,
      mid: dummy,
      low: techDummy,
      tech: techDummy,
      pickRumor: function () {
        var c = Object.assign({}, dummy);
        c.claim = 478.5;
        c.truth = 'lower';
        return c;
      }
    };
  }

  return {
    load: load
  };
})();
