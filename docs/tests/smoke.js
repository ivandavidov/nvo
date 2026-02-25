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

  function resetDom() {
    var years = document.getElementById("years");
    if (years) {
      years.remove();
    }
  }

  var results = [];

  runTest("year navigation excludes latest year and starts at 2020", function () {
    resetDom();
    window.firstYear = 2018;
    window.baseSchoolIndex = 0;
    window.s = [{ b: [0, 0, 0, 0, 0, 0, 0, 0] }]; // latest = 2025
    var yearsNav = document.createElement("span");
    yearsNav.id = "years";
    yearsNav.className = "years-nav";
    yearsNav.setAttribute("data-year-base", "?year=");
    document.body.appendChild(yearsNav);
    generateYearNavigation();
    var values = Array.prototype.map.call(
      yearsNav.querySelectorAll("a"),
      function (a) { return Number(a.textContent); }
    );
    assert(values.length === 5, "Expected 5 links");
    assert(values[0] === 2024, "Expected first year 2024");
    assert(values[values.length - 1] === 2020, "Expected last year 2020");
  }, results);

  runTest("ranking handles zero top rank without NaN/Infinity", function () {
    window.rankRangeTop = 25;
    window.rankRangeBottom = 50;
    var rank = calculateAdjustedRankData(10, 0);
    assert(Number.isFinite(rank.adjustedRank), "adjustedRank must be finite");
    assert(rank.adjustedRank === 0, "adjustedRank should fallback to 0");
  }, results);

  runTest("CSV export link uses blob URL and revokes previous URL", function () {
    var link = document.createElement("a");
    document.body.appendChild(link);
    var originalURL = window.URL;
    var revoked = [];
    var id = 0;
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
      assert(link.getAttribute("download") === "x.csv", "download attr mismatch");
      assert(link.getAttribute("href") === "blob:test-1", "first blob url mismatch");
      setCsvDownloadLink(link, "x.csv", "a,b\n3,4\n");
      assert(link.getAttribute("href") === "blob:test-2", "second blob url mismatch");
      assert(revoked.length === 1 && revoked[0] === "blob:test-1", "old blob URL not revoked");
    } finally {
      window.URL = originalURL;
    }
  }, results);

  renderResults(results);
})();
