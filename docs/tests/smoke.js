(function () {
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function runTest(name, fn, results) {
    try {
      fn();
      results.push({ name: name, ok: true });
    } catch (err) {
      results.push({ name: name, ok: false, error: err && err.message ? err.message : String(err) });
    }
  }

  function renderResults(results) {
    var el = document.getElementById("results");
    var passed = results.filter(function (r) { return r.ok; }).length;
    var failed = results.length - passed;
    var html = [];
    html.push("<p><strong>Lightweight smoke suite</strong></p>");
    html.push("<p><strong>" + passed + " passed</strong>, <strong>" + failed + " failed</strong></p>");
    results.forEach(function (r) {
      if (r.ok) {
        html.push("<div class=\"ok\">PASS: " + r.name + "</div>");
      } else {
        html.push("<div class=\"fail\">FAIL: " + r.name + " - " + r.error + "</div>");
      }
    });
    el.innerHTML = html.join("");
    document.title = failed === 0 ? "Smoke tests passed" : "Smoke tests failed";
  }

  function withCleanState(fn) {
    var originalPath = window.location.pathname + window.location.search + window.location.hash;
    var original = {
      s: window.s,
      firstYear: window.firstYear,
      numYears: window.numYears,
      baseSchoolIndex: window.baseSchoolIndex,
      chartNoSchool: window.chartNoSchool,
      rankRangeTop: window.rankRangeTop,
      rankRangeBottom: window.rankRangeBottom,
      cookieName: window.cookieName,
      URL: window.URL,
      setTimeout: window.setTimeout,
      clearTimeout: window.clearTimeout,
      historyReplaceState: window.history.replaceState
    };
    var nodes = [];
    try {
      window.firstYear = 2020;
      window.numYears = 3;
      window.baseSchoolIndex = 0;
      window.chartNoSchool = 50;
      window.rankRangeTop = 25;
      window.rankRangeBottom = 50;
      window.cookieName = "ix";
      window.s = [{ b: [10, 20, 30], m: [11, 21, 31], n: "A" }];
      fn(function register(node) { nodes.push(node); });
    } finally {
      nodes.forEach(function (n) {
        if (n && n.parentNode) {
          n.parentNode.removeChild(n);
        }
      });
      window.history.replaceState = original.historyReplaceState;
      window.history.replaceState({}, "", originalPath);
      window.s = original.s;
      window.firstYear = original.firstYear;
      window.numYears = original.numYears;
      window.baseSchoolIndex = original.baseSchoolIndex;
      window.chartNoSchool = original.chartNoSchool;
      window.rankRangeTop = original.rankRangeTop;
      window.rankRangeBottom = original.rankRangeBottom;
      window.cookieName = original.cookieName;
      window.URL = original.URL;
      window.setTimeout = original.setTimeout;
      window.clearTimeout = original.clearTimeout;
    }
  }

  var results = [];

  runTest("year navigation excludes latest year", function () {
    withCleanState(function (registerNode) {
      window.s = [{ b: [1, 2, 3, 4, 5, 6] }]; // firstYear=2020 => latest 2025
      var nav = document.createElement("span");
      nav.className = "years-nav";
      nav.setAttribute("data-year-base", "?year=");
      document.body.appendChild(nav);
      registerNode(nav);
      generateYearNavigation();
      var years = Array.prototype.map.call(nav.querySelectorAll("a"), function (a) {
        return Number(a.textContent);
      });
      assert(years.join(",") === "2024,2023,2022,2021,2020", "Unexpected years: " + years.join(","));
    });
  }, results);

  runTest("calculateAdjustedRankData stays finite when topRank is 0", function () {
    withCleanState(function () {
      var out = calculateAdjustedRankData(10, 0);
      assert(Number.isFinite(out.adjustedRank), "adjustedRank should be finite");
      assert(out.adjustedRank === 0, "adjustedRank should fallback to 0");
    });
  }, results);

  runTest("setCsvDownloadLink uses blob and revokes old URL", function () {
    withCleanState(function (registerNode) {
      var link = document.createElement("a");
      document.body.appendChild(link);
      registerNode(link);
      var revoked = [];
      var id = 0;
      var originalURL = window.URL;
      try {
        window.URL = {
          createObjectURL: function () {
            id += 1;
            return "blob:test-" + id;
          },
          revokeObjectURL: function (url) {
            revoked.push(url);
          }
        };
        setCsvDownloadLink(link, "x.csv", "a,b\n1,2\n");
        setCsvDownloadLink(link, "x.csv", "a,b\n3,4\n");
        assert(link.getAttribute("download") === "x.csv", "download attr mismatch");
        assert(link.getAttribute("href") === "blob:test-2", "Expected second blob URL");
        assert(revoked.length === 1 && revoked[0] === "blob:test-1", "Expected revoke of old URL");
      } finally {
        window.URL = originalURL;
      }
    });
  }, results);

  runTest("calculateTimeTravel ignores invalid year and clamps future year", function () {
    withCleanState(function () {
      function len() {
        return window.s[0].b.length;
      }
      window.s = [{
        b: [1, 2, 3, 4, 5, 6],
        m: [1, 2, 3, 4, 5, 6],
        bu: [1, 1, 1, 1, 1, 1],
        mu: [1, 1, 1, 1, 1, 1]
      }];
      window.history.replaceState({}, "", "?year=abc");
      calculateTimeTravel();
      assert(len() === 6, "Invalid year should not alter length");
      window.history.replaceState({}, "", "?year=2099");
      calculateTimeTravel();
      assert(len() === 5, "Future year should clamp to latest-1");
    });
  }, results);

  runTest("recalculate returns fallback series when no buttons are enabled", function () {
    withCleanState(function () {
      var out = recalculate();
      assert(out.b.length === 1 && out.m.length === 1, "Expected single fallback series");
      assert(out.i.length === 0, "Expected no selected indices");
      assert(out.b[0].name.indexOf("Изберете") >= 0, "Expected fallback text");
    });
  }, results);

  runTest("debounceRedrawOnResize executes redraw once for burst", function () {
    withCleanState(function () {
      var originalRedraw = window.redraw;
      var calls = 0;
      var queue = [];
      var active = {};
      var tid = 0;
      window.redraw = function () { calls += 1; };
      window.setTimeout = function (fn) {
        tid += 1;
        queue.push({ id: tid, fn: fn });
        active[tid] = true;
        return tid;
      };
      window.clearTimeout = function (id) {
        delete active[id];
      };
      debounceRedrawOnResize();
      debounceRedrawOnResize();
      queue.forEach(function (t) {
        if (active[t.id]) {
          t.fn();
        }
      });
      window.redraw = originalRedraw;
      assert(calls === 1, "Expected one redraw call");
    });
  }, results);

  renderResults(results);
})();
