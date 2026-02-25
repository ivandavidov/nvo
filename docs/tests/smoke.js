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

  // Helper: build an array of <td> elements for compareRowsByColumn tests.
  // Each entry is { text, props } where props are extra JS properties on the element.
  function makeTds(cells) {
    return cells.map(function (c) {
      var td = document.createElement('td');
      td.textContent = c.text || '';
      if (c.props) {
        Object.keys(c.props).forEach(function (k) { td[k] = c.props[k]; });
      }
      return td;
    });
  }

  var results = [];

  // ── Original tests ────────────────────────────────────────────────────────

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

  // ── New tests ─────────────────────────────────────────────────────────────

  runTest("safeDivide handles zero denominator with default and custom fallback", function () {
    assert(safeDivide(10, 2) === 5, "10/2 should be 5");
    assert(safeDivide(10, 0) === 0, "10/0 should fallback to 0");
    assert(safeDivide(10, 0, -1) === -1, "10/0 with custom fallback should be -1");
    assert(safeDivide(0, 0) === 0, "0/0 should fallback to 0");
  }, results);

  runTest("normalizeRankValue clamps to [0, 100] and rounds to 2 decimal places", function () {
    assert(normalizeRankValue(76.543) === 76.54, "should round to 2 decimal places, got: " + normalizeRankValue(76.543));
    assert(normalizeRankValue(100.5) === 100, "should clamp to 100");
    assert(normalizeRankValue(-5) === 0, "should clamp to 0");
    assert(normalizeRankValue(Infinity) === 0, "Infinity should return 0");
    assert(normalizeRankValue(NaN) === 0, "NaN should return 0");
  }, results);

  runTest("formatRankValue formats integers and strips trailing zeros", function () {
    assert(formatRankValue(100) === '100', "integer should not have decimals");
    assert(formatRankValue(76.5) === '76.5', "single decimal should be kept");
    assert(formatRankValue(76.12) === '76.12', "two decimals should be kept");
    assert(formatRankValue(Infinity) === '', "Infinity should return empty string");
    assert(formatRankValue(NaN) === '', "NaN should return empty string");
  }, results);

  runTest("getSchoolCounts applies thresholds correctly", function () {
    // count = schools[1] - schools[0]
    var r = getSchoolCounts([0, 2]); // count=2, below SMALL(4)
    assert(r.topCount === 0 && r.secondCount === 0, "count=2: topCount should be 0, got " + r.topCount);
    r = getSchoolCounts([0, 5]); // count=5, >= SMALL(4)
    assert(r.topCount === 3 && r.secondCount === 0, "count=5: topCount should be 3, got " + r.topCount);
    r = getSchoolCounts([0, 10]); // count=10, >= MEDIUM(9)
    assert(r.topCount === 5 && r.secondCount === 0, "count=10: topCount should be 5, got " + r.topCount);
    r = getSchoolCounts([0, 20]); // count=20, >= LARGE(19)
    assert(r.topCount === 10 && r.secondCount === 0, "count=20: topCount should be 10, got " + r.topCount);
    r = getSchoolCounts([0, 30]); // count=30, >= XLARGE(29)
    assert(r.topCount === 10 && r.secondCount === 10, "count=30: secondCount should be 10, got " + r.secondCount);
  }, results);

  runTest("getYearCellSortValue parses score from text content", function () {
    var td = document.createElement('td');
    td.textContent = '89.5 / 102';
    var result = getYearCellSortValue(td);
    assert(result.hasValue === true, "should have value");
    assert(result.value === 89.5, "value should be 89.5, got: " + result.value);

    td.textContent = '';
    result = getYearCellSortValue(td);
    assert(result.hasValue === false, "empty cell should not have value");
    assert(result.value === 0, "empty cell value should be 0");

    result = getYearCellSortValue(null);
    assert(result.hasValue === false, "null td should not have value");

    td.textContent = '   ';
    result = getYearCellSortValue(td);
    assert(result.hasValue === false, "whitespace-only cell should not have value");
  }, results);

  runTest("normalizeSeries trims leading and trailing null entries", function () {
    withCleanState(function () {
      // Leading nulls trimmed
      var series = [{ data: [null, null, 85] }];
      normalizeSeries(series);
      assert(series[0].data.length === 1, "leading nulls should be trimmed, length=" + series[0].data.length);
      assert(series[0].data[0] === 85, "remaining value should be 85");

      // Trailing nulls trimmed; return value = count removed
      series = [{ data: [85, null, null] }];
      var removed = normalizeSeries(series);
      assert(removed === 2, "should return 2 removed trailing entries, got " + removed);
      assert(series[0].data.length === 1, "only one element should remain");
      assert(series[0].data[0] === 85, "remaining value should be 85");

      // Multiple series: leading null preserved when another series has data at that position
      series = [{ data: [null, 80, null] }, { data: [70, 75, null] }];
      normalizeSeries(series);
      assert(series[0].data.length === 2, "both trailing nulls removed, length=" + series[0].data.length);
      assert(series[0].data[0] === null, "leading null in series[0] preserved (series[1] has data)");
      assert(series[1].data[0] === 70, "series[1] first value preserved");
    });
  }, results);

  runTest("setButtonState updates selectedSchoolIndices Set", function () {
    withCleanState(function (registerNode) {
      selectedSchoolIndices.clear();

      var btn = document.createElement('button');
      btn.id = 'b42';
      document.body.appendChild(btn);
      registerNode(btn);

      setButtonState(42, true);
      assert(selectedSchoolIndices.has(42), "Set should contain 42 after enable");
      assert(btn.classList.contains('button-primary'), "button should gain button-primary class");

      setButtonState(42, false);
      assert(!selectedSchoolIndices.has(42), "Set should not contain 42 after disable");
      assert(!btn.classList.contains('button-primary'), "button should lose button-primary class");

      // Non-existent button should be a no-op
      var sizeBefore = selectedSchoolIndices.size;
      setButtonState(999, true);
      assert(selectedSchoolIndices.size === sizeBefore, "missing button should not modify Set");

      selectedSchoolIndices.clear();
    });
  }, results);

  runTest("cityContainsSchoolIndex respects public and private ranges", function () {
    withCleanState(function () {
      var originalSi = window.si;
      window.si = { 'TestCity': { n: [10, 20], p: [21, 25] } };

      assert(cityContainsSchoolIndex('TestCity', 10) === true, "start of public range");
      assert(cityContainsSchoolIndex('TestCity', 15) === true, "middle of public range");
      assert(cityContainsSchoolIndex('TestCity', 20) === true, "end of public range");
      assert(cityContainsSchoolIndex('TestCity', 21) === true, "start of private range");
      assert(cityContainsSchoolIndex('TestCity', 25) === true, "end of private range");
      assert(cityContainsSchoolIndex('TestCity', 9) === false, "before public range");
      assert(cityContainsSchoolIndex('TestCity', 26) === false, "after private range");
      assert(cityContainsSchoolIndex('UnknownCity', 10) === false, "unknown city");

      window.si = originalSi;
    });
  }, results);

  runTest("compareRowsByColumn sorts by rank column descending and ascending", function () {
    withCleanState(function () {
      var row1 = makeTds([
        { text: '1' },
        { text: 'Алфа' },
        { text: 'Д / 1' },
        { text: '80', props: { rankAll: 80, rankPu: 80, rankPr: null } },
        { text: '85.0 / 50' }
      ]);
      var row2 = makeTds([
        { text: '2' },
        { text: 'Бета' },
        { text: 'Д / 2' },
        { text: '60', props: { rankAll: 60, rankPu: 60, rankPr: null } },
        { text: '70.0 / 50' }
      ]);

      var cmp = compareRowsByColumn(row1, row2, 3, 'desc', null);
      assert(cmp < 0, "higher rank first in desc, got: " + cmp);

      cmp = compareRowsByColumn(row1, row2, 3, 'asc', null);
      assert(cmp > 0, "lower rank first in asc, got: " + cmp);
    });
  }, results);

  runTest("compareRowsByColumn puts rows without year data last", function () {
    withCleanState(function () {
      var withData = makeTds([
        { text: '1' }, { text: 'Алфа' }, { text: 'Д / 1' },
        { text: '80', props: { rankAll: 80, rankPu: 80, rankPr: null } },
        { text: '85.0 / 50' }
      ]);
      var noData = makeTds([
        { text: '2' }, { text: 'Бета' }, { text: 'Д / 2' },
        { text: '60', props: { rankAll: 60, rankPu: 60, rankPr: null } },
        { text: '' }
      ]);

      // Column 4 is a year column; rows without data should sort last
      var cmp = compareRowsByColumn(withData, noData, 4, 'desc', null);
      assert(cmp < 0, "row with data before row without data, got: " + cmp);

      cmp = compareRowsByColumn(noData, withData, 4, 'desc', null);
      assert(cmp > 0, "row without data after row with data, got: " + cmp);
    });
  }, results);

  runTest("compareRowsByColumn sorts by school name for column 1", function () {
    withCleanState(function () {
      function nameRow(name) {
        var tds = [0, 1, 2, 3].map(function () { return document.createElement('td'); });
        tds[1].textContent = name;
        tds[3].rankAll = 50;
        return tds;
      }

      var rowA = nameRow('Алфа');
      var rowB = nameRow('Бета');

      var cmpAsc = compareRowsByColumn(rowA, rowB, 1, 'asc', null);
      assert(cmpAsc < 0, "Алфа before Бета ascending, got: " + cmpAsc);

      var cmpDesc = compareRowsByColumn(rowA, rowB, 1, 'desc', null);
      assert(cmpDesc > 0, "Алфа after Бета descending, got: " + cmpDesc);
    });
  }, results);

  runTest("compareRowsByColumn respects filter label for rank column", function () {
    withCleanState(function () {
      var row1 = makeTds([
        { text: '1' }, { text: 'Алфа' }, { text: 'Д / 1' },
        { text: '80', props: { rankAll: 80, rankPu: 70, rankPr: 90 } },
        { text: '85.0 / 50' }
      ]);
      var row2 = makeTds([
        { text: '2' }, { text: 'Бета' }, { text: 'Ч / 1' },
        { text: '60', props: { rankAll: 60, rankPu: 85, rankPr: 40 } },
        { text: '70.0 / 50' }
      ]);

      // Filter by public (Д): row2.rankPu=85 > row1.rankPu=70, so row2 comes first desc
      var cmp = compareRowsByColumn(row1, row2, 3, 'desc', 'Д');
      assert(cmp > 0, "with Д filter row2(rankPu=85) before row1(rankPu=70), got: " + cmp);

      // Filter by private (Ч): row1.rankPr=90 > row2.rankPr=40, so row1 comes first desc
      cmp = compareRowsByColumn(row1, row2, 3, 'desc', 'Ч');
      assert(cmp < 0, "with Ч filter row1(rankPr=90) before row2(rankPr=40), got: " + cmp);
    });
  }, results);

  runTest("renumberVisibleRows skips hidden rows", function () {
    withCleanState(function (registerNode) {
      var tBody = document.createElement('tbody');
      document.body.appendChild(tBody);
      registerNode(tBody);

      [1, 2, 3].forEach(function (n) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.textContent = String(n);
        tr.appendChild(td);
        if (n === 2) {
          tr.style.display = 'none';
        }
        tBody.appendChild(tr);
      });

      renumberVisibleRows(tBody);

      var rows = tBody.getElementsByTagName('tr');
      assert(rows[0].getElementsByTagName('td')[0].textContent === '1', "first visible row should be 1");
      assert(rows[1].getElementsByTagName('td')[0].textContent === '2', "hidden row keeps original value");
      assert(rows[2].getElementsByTagName('td')[0].textContent === '2', "second visible row should be 2");
    });
  }, results);

  runTest("handleURL builds query string with selected indices", function () {
    withCleanState(function () {
      var capturedURL = null;
      window.history.replaceState = function (state, title, url) {
        capturedURL = url;
      };

      handleURL([1, 2, 3]);
      assert(capturedURL !== null, "replaceState should have been called");
      assert(capturedURL.indexOf('ix=1,2,3') >= 0, "URL should contain indices, got: " + capturedURL);

      handleURL([]);
      assert(capturedURL.indexOf('ix=') < 0, "empty indices should clear URL, got: " + capturedURL);
    });
  }, results);

  runTest("generateDownloadCSVHeader contains year columns for each year", function () {
    withCleanState(function () {
      var originalBel = window.csvHeaderBel;
      var originalMat = window.csvHeaderMat;
      window.csvHeaderBel = 'BEL';
      window.csvHeaderMat = 'MAT';
      // firstYear=2020, s[0].b.length=3 → years 2020, 2021, 2022
      var header = generateDownloadCSVHeader();
      assert(header.indexOf('Град') >= 0, "header should contain Град");
      assert(header.indexOf('BEL 20') >= 0, "header should contain BEL 20");
      assert(header.indexOf('MAT 20') >= 0, "header should contain MAT 20");
      assert(header.indexOf('BEL 22') >= 0, "header should contain BEL 22");
      assert(header.indexOf('MAT 22') >= 0, "header should contain MAT 22");
      assert(header.indexOf('\r\n') >= 0, "header should end with CRLF");
      window.csvHeaderBel = originalBel;
      window.csvHeaderMat = originalMat;
    });
  }, results);

  renderResults(results);
})();
