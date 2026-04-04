package nvo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

public class RuoPage {

    private static final String OUTPUT_BASE = ProjectConfig.DOCS_DIR + "7/" + ProjectConfig.RUO_DIR_NAME + "/";
    private static final int YEARS_TO_SHOW = 3;

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: city hrefName (e.g. sofia)");
            System.exit(1);
        }
        new RuoPage().generate(args[0]);
    }

    private void generate(String hrefName) throws Exception {
        Cities.City city = Cities.ORDERED.stream()
                .filter(c -> c.hrefName().equals(hrefName))
                .findFirst()
                .orElse(null);

        if (city == null) {
            System.err.println("City not found in Cities.ORDERED: " + hrefName);
            System.exit(1);
        }

        Path dir = Path.of(OUTPUT_BASE, hrefName);
        if (Files.exists(dir)) {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.delete(p); } catch (IOException e) { throw new RuntimeException(e); }
                    });
        }
        Files.createDirectories(dir);

        Files.writeString(dir.resolve("index.html"), buildHtml(city));
        System.out.println("Written: " + dir.resolve("index.html"));
    }

    // ── HTML assembly ─────────────────────────────────────────────────────

    private String buildHtml(Cities.City city) {
        String cityName = city.fullName();
        String hrefName = city.hrefName();
        String title = "Минимални и максимални балове по паралелки след 7 клас – " + cityName + " | Иван Давидов";
        String description = "Минимални и максимални балове по паралелки след 7 клас в "
                + cityName + ". Таблици и графики за всички класирания.";
        String canonical = ProjectConfig.SITE_BASE_URL + "7/" + ProjectConfig.RUO_DIR_NAME + "/" + hrefName + "/";

        return buildHead(title, description, canonical)
                + buildBody(city)
                + buildFooter();
    }

    private String buildHead(String title, String description, String canonical) {
        return """
                <!DOCTYPE html>
                <html lang="bg">
                <head>
                  <meta charset="utf-8">
                  <title>%s</title>
                  <meta name="description" content="%s">
                  <meta name="author" content="Иван Давидов">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <link rel="stylesheet" href="../../../css/normalize.css">
                  <link rel="stylesheet" href="../../../css/custom.css">
                  <link rel="icon" type="image/png" href="../../../images/favicon-7.png">
                  <link rel="canonical" href="%s">
                  <meta property="og:type" content="website">
                  <meta property="og:url" content="%s">
                  <meta property="og:title" content="%s">
                  <meta property="og:description" content="%s">
                  <meta property="og:image" content="%simages/social-preview.png">
                  <meta property="og:locale" content="bg_BG">
                  <meta property="og:site_name" content="НВО и ДЗИ – Иван Давидов">
                  <script src="../../../js/theme.js"></script>
                  <style>
                    #detail-school-name { text-align: center; }
                    .ruo-section-title { margin-top: 2rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--color-border); }
                    .ruo-filters { display: flex; gap: 1.25rem; flex-wrap: wrap; margin: 1rem 0; align-items: flex-end; }
                    .ruo-select-group { display: flex; flex-direction: column; gap: 0.25rem; }
                    .ruo-select-group label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
                    .ruo-gender-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer; padding-bottom: 0.3rem; }
                    .ruo-table-wrap { overflow-x: auto; }
                    .ruo-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
                    .ruo-chart-box { background: var(--color-surface); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }
                    .trend-up   { color: var(--color-success); font-weight: 700; }
                    .trend-down { color: var(--color-danger);  font-weight: 700; }
                    .trend-same { color: var(--color-text-muted); }
                    .ruo-search { width: 100%%; max-width: 380px; background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-size: 0.9rem; }
                    .ruo-search:focus { outline: none; border-color: var(--color-primary); }
                    #overview-tbody tr { cursor: pointer; }
                    .sort-arrow { color: var(--color-primary); margin-left: 0.25em; }
                    @media (max-width: 700px) { .ruo-charts { grid-template-columns: 1fr; } }
                  </style>
                </head>
                <body>
                """.formatted(
                escHtml(title), escHtml(description), canonical, canonical,
                escHtml(title), escHtml(description), ProjectConfig.SITE_BASE_URL);
    }

    private String buildBody(Cities.City city) {
        String cityName = city.fullName();
        String hrefName = city.hrefName();

        return """
                  <header class="site-header">
                    <div class="header-inner">
                      <a class="site-brand" href="../../../" aria-label="Начало">
                        <svg class="site-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span class="site-name">НВО и ДЗИ</span>
                      </a>
                      <nav class="grade-tabs">
                        <a href="../../../4/" class="grade-tab">4 клас</a>
                        <a href="../../" class="grade-tab active">7 клас</a>
                        <a href="../../../10/" class="grade-tab">10 клас</a>
                        <a href="../../../12/" class="grade-tab">12 клас</a>
                      </nav>
                      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Смяна на тема">
                        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      </button>
                    </div>
                  </header>
                  <main>
                    <div class="container">
                      <h1>Минимални и максимални балове по паралелки след 7 клас &ndash; %s</h1>
                      <p><a href="../../">&larr; Към 7 клас</a></p>

                      <!-- ── Section 1: Detail selectors ──────────────── -->
                      <h2 class="ruo-section-title">Детайли за паралелка</h2>
                      <div class="ruo-filters">
                        <div class="ruo-select-group">
                          <label for="school-select">Училище</label>
                          <select id="school-select">
                            <option value="">— Избери училище —</option>
                          </select>
                        </div>
                        <div class="ruo-select-group">
                          <label for="profile-select">Паралелка</label>
                          <select id="profile-select" disabled>
                            <option value="">— Избери паралелка —</option>
                          </select>
                        </div>
                        <label class="ruo-gender-label">
                          <input type="checkbox" id="gender-toggle"> Разбивка по пол за последната година
                        </label>
                      </div>

                      <!-- ── Section 2+3: Detail table + charts ────────── -->
                      <div id="detail-section" style="display:none">
                        <h3 id="detail-school-name"></h3>
                        <div class="ruo-table-wrap">
                          <table id="detail-table"></table>
                        </div>
                        <div class="ruo-charts">
                          <div class="ruo-chart-box"><div id="trend-chart" style="height:280px"></div></div>
                          <div class="ruo-chart-box"><div id="klasirane-chart" style="height:280px"></div></div>
                        </div>

                      </div>

                      <!-- ── Section 5: Overview table ─────────────────── -->
                      <h2 class="ruo-section-title">Топ паралелки по минимален бал (1-во класиране)</h2>
                      <input type="text" id="overview-search" class="ruo-search"
                             placeholder="Търси по училище или паралелка&hellip;">
                      <div class="ruo-table-wrap">
                        <table id="overview-table">
                          <thead id="overview-thead"></thead>
                          <tbody id="overview-tbody"></tbody>
                        </table>
                      </div>

                    </div>
                  </main>
                """.formatted(escHtml(cityName))
                + buildScript(hrefName);
    }

    private String buildScript(String hrefName) {
        return """
                  <script src="../../../js/highcharts.js"></script>
                  <script src="../../../js/ruo-%s.js"></script>
                  <script>
                (function () {
                  'use strict';

                  // ── Shared state ──────────────────────────────────────────

                  var yearsToShow = %d;
                  var firstVisibleYi = Math.max(0, ruoYears.length - yearsToShow);
                  var pageYears = ruoYears.slice(firstVisibleYi);
                  var latestYi  = pageYears.length - 1;
                  var overviewRows = [];
                  var sortCol   = latestYi >= 0 ? 'year-' + latestYi : 'school';
                  var sortDir   = -1;   // -1 = desc, 1 = asc
                  var trendChart, klasiraneChart;

                  // ── Utilities ─────────────────────────────────────────────

                  function esc(s) {
                    return String(s)
                      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                  }

                  function fmt(v) {
                    return (v !== null && v !== undefined && v !== 0) ? v : '\\u2014';
                  }

                  function isDark() {
                    return document.documentElement.dataset.theme === 'dark';
                  }

                  function getVisibleData(d) {
                    return d.slice(firstVisibleYi);
                  }

                  function getSortValue(row, col) {
                    if (col.indexOf('year-') === 0) {
                      return row.yearMins[parseInt(col.substring(5), 10)];
                    }
                    return row[col];
                  }

                  // ── Overview: build rows ──────────────────────────────────

                  function buildOverviewRows() {
                    var rows = [];
                    Object.keys(ruoSchools).forEach(function (code) {
                      var school = ruoSchools[code];
                      Object.keys(school.p).forEach(function (pcode) {
                        var d = getVisibleData(school.p[pcode].d);
                        var yearMins = d.map(function (yearData) {
                          var k1 = yearData && yearData[0];
                          return k1 ? k1[0] : null;
                        });
                        var minLatest = latestYi >= 0 ? yearMins[latestYi] : null;
                        var minPrev   = latestYi >= 1 ? yearMins[latestYi - 1] : null;
                        var trend = '';
                        if (minLatest !== null && minPrev !== null) {
                          trend = minLatest > minPrev + 0.5 ? 'up'
                                : minLatest < minPrev - 0.5 ? 'down' : 'same';
                        }
                        rows.push({ code: code, pcode: pcode,
                          school: school.n, profile: school.p[pcode].n,
                          yearMins: yearMins,
                          trend: trend });
                      });
                    });
                    return rows;
                  }

                  function sortRows(rows) {
                    return rows.slice().sort(function (a, b) {
                      var va = getSortValue(a, sortCol), vb = getSortValue(b, sortCol);
                      if (va === null && vb === null) return 0;
                      if (va === null) return 1;
                      if (vb === null) return -1;
                      if (typeof va === 'string') return sortDir * va.localeCompare(vb, 'bg');
                      return sortDir * (va - vb);
                    });
                  }

                  function updateSortIndicators() {
                    document.querySelectorAll('#overview-table th[data-sortable="1"]').forEach(function (th) {
                      var arrow = th.querySelector('.sort-arrow');
                      if (arrow) arrow.remove();
                      if (th.dataset.col === sortCol) {
                        var span = document.createElement('span');
                        span.className = 'sort-arrow';
                        span.textContent = sortDir === -1 ? '\\u2193' : '\\u2191';
                        th.appendChild(span);
                      }
                    });
                  }

                  function renderOverviewHeader() {
                    var html = '<tr>'
                      + '<th>#</th>'
                      + '<th data-sortable="1" data-col="school">Училище</th>'
                      + '<th data-sortable="1" data-col="profile">Паралелка</th>';
                    for (var yi = latestYi; yi >= 0; yi--) {
                      html += '<th data-sortable="1" data-col="year-' + yi + '">Мин. ' + pageYears[yi] + '</th>';
                    }
                    html += '<th>Тренд</th></tr>';
                    document.getElementById('overview-thead').innerHTML = html;
                  }

                  function renderOverviewTable(filter) {
                    var rows = overviewRows;
                    if (filter) {
                      var f = filter.toLowerCase();
                      rows = rows.filter(function (r) {
                        return r.school.toLowerCase().indexOf(f) !== -1
                            || r.profile.toLowerCase().indexOf(f) !== -1;
                      });
                    }
                    rows = sortRows(rows);
                    var html = '';
                    rows.forEach(function (r, i) {
                      var tHtml = r.trend === 'up'   ? '<span class="trend-up">&#8593;</span>'
                                : r.trend === 'down' ? '<span class="trend-down">&#8595;</span>'
                                : r.trend === 'same' ? '<span class="trend-same">&#8594;</span>' : '';
                      html += '<tr data-code="' + r.code + '" data-pcode="' + r.pcode + '">'
                        + '<td>' + (i + 1) + '</td>'
                        + '<td>' + esc(r.school)  + '</td>'
                        + '<td>' + esc(r.profile) + '</td>';
                      for (var yi = latestYi; yi >= 0; yi--) {
                        var minScore = r.yearMins[yi];
                        html += '<td>' + (minScore !== null ? minScore : '\\u2014') + '</td>';
                      }
                      html += '<td>' + tHtml + '</td>'
                        + '</tr>';
                    });
                    document.getElementById('overview-tbody').innerHTML = html;
                    document.querySelectorAll('#overview-tbody tr').forEach(function (tr) {
                      tr.addEventListener('click', function () {
                        selectSchoolProfile(tr.dataset.code, tr.dataset.pcode);
                        document.getElementById('detail-section')
                                .scrollIntoView({ behavior: 'smooth', block: 'start' });
                      });
                    });
                  }

                  // ── School / Profile selectors ────────────────────────────

                  function populateSchoolSelect() {
                    var sel = document.getElementById('school-select');
                    var schools = Object.keys(ruoSchools).map(function (c) {
                      return { code: c, name: ruoSchools[c].n };
                    }).sort(function (a, b) {
                      var aIsNum = /^\\d/.test(a.name);
                      var bIsNum = /^\\d/.test(b.name);
                      if (aIsNum && bIsNum) return parseInt(a.name, 10) - parseInt(b.name, 10);
                      if (aIsNum) return -1;
                      if (bIsNum) return 1;
                      return a.name.localeCompare(b.name, 'bg');
                    });
                    schools.forEach(function (s) {
                      var opt = document.createElement('option');
                      opt.value = s.code; opt.textContent = s.name;
                      sel.appendChild(opt);
                    });
                  }

                  function populateProfileSelect(schoolCode) {
                    var sel = document.getElementById('profile-select');
                    sel.innerHTML = '';
                    if (!schoolCode) {
                      var ph = document.createElement('option');
                      ph.value = ''; ph.textContent = '\\u2014 Избери паралелка \\u2014';
                      sel.appendChild(ph);
                      sel.disabled = true; return;
                    }
                    var allOpt = document.createElement('option');
                    allOpt.value = ''; allOpt.textContent = 'Всички паралелки';
                    sel.appendChild(allOpt);
                    Object.keys(ruoSchools[schoolCode].p).forEach(function (pcode) {
                      var opt = document.createElement('option');
                      opt.value = pcode;
                      opt.textContent = ruoSchools[schoolCode].p[pcode].n;
                      sel.appendChild(opt);
                    });
                    sel.disabled = false;
                  }

                  function selectSchoolProfile(code, pcode) {
                    document.getElementById('school-select').value = code;
                    populateProfileSelect(code);
                    document.getElementById('profile-select').value = pcode;
                    showDetail(code, pcode);
                  }

                  // ── Aggregation (all profiles) ────────────────────────────

                  function minOf(entries, idx) {
                    var vals = entries.map(function (e) { return e[idx]; }).filter(function (v) { return v > 0; });
                    return vals.length ? Math.min.apply(null, vals) : 0;
                  }

                  function maxOf(entries, idx) {
                    var vals = entries.map(function (e) { return e[idx]; }).filter(function (v) { return v > 0; });
                    return vals.length ? Math.max.apply(null, vals) : 0;
                  }

                  function aggregateAllProfiles(code) {
                    var pcodes = Object.keys(ruoSchools[code].p);
                    var result = [];
                    for (var yi = 0; yi < pageYears.length; yi++) {
                      var sourceYi = firstVisibleYi + yi;
                      var yearData = [];
                      for (var ki = 0; ki < 4; ki++) {
                        var entries = [];
                        pcodes.forEach(function (pc) {
                          var d = ruoSchools[code].p[pc].d;
                          var k = d[sourceYi] ? d[sourceYi][ki] : null;
                          if (k) entries.push(k);
                        });
                        if (entries.length === 0) {
                          yearData.push(null);
                        } else {
                          yearData.push([
                            minOf(entries, 0), minOf(entries, 1), minOf(entries, 2),
                            maxOf(entries, 3), maxOf(entries, 4), maxOf(entries, 5)
                          ]);
                        }
                      }
                      result.push(yearData);
                    }
                    return result;
                  }

                  // ── Detail table ──────────────────────────────────────────

                  function showDetail(code, pcode) {
                    var showGender = document.getElementById('gender-toggle').checked;
                    document.getElementById('detail-section').style.display = '';
                    document.getElementById('detail-school-name').textContent = ruoSchools[code].f;
                    var d = pcode ? getVisibleData(ruoSchools[code].p[pcode].d) : aggregateAllProfiles(code);
                    var label = pcode ? ruoSchools[code].p[pcode].n : 'Всички паралелки';
                    renderDetailTable(d, showGender);
                    renderCharts(d, label);
                  }

                  function renderDetailTable(d, showGender) {
                    var klassNames = ['1-во', '2-ро', '3-то', '4-то'];
                    var colsPerYear = showGender ? 6 : 2;
                    var subHeaders  = showGender
                      ? '<th>Мин</th><th>Мин М</th><th>Мин Ж</th><th>Макс</th><th>Макс М</th><th>Макс Ж</th>'
                      : '<th>Мин</th><th>Макс</th>';
                    var yis = showGender
                      ? [latestYi]
                      : pageYears.map(function (y, i) { return i; });

                    var thead = '<thead><tr><th>Класиране</th>';
                    yis.forEach(function (yi) {
                      thead += '<th colspan="' + colsPerYear + '">' + pageYears[yi] + '</th>';
                    });
                    thead += '</tr><tr><th></th>';
                    yis.forEach(function () { thead += subHeaders; });
                    thead += '</tr></thead>';

                    var tbody = '<tbody>';
                    klassNames.forEach(function (kname, ki) {
                      tbody += '<tr><td>' + kname + '</td>';
                      yis.forEach(function (yi) {
                        var k = d[yi] ? d[yi][ki] : null;
                        if (showGender) {
                          for (var si = 0; si < 6; si++) {
                            tbody += '<td>' + (k ? fmt(k[si]) : '\\u2014') + '</td>';
                          }
                        } else {
                          tbody += '<td>' + (k ? fmt(k[0]) : '\\u2014') + '</td>';
                          tbody += '<td>' + (k ? fmt(k[3]) : '\\u2014') + '</td>';
                        }
                      });
                      tbody += '</tr>';
                    });
                    tbody += '</tbody>';

                    document.getElementById('detail-table').innerHTML = thead + tbody;
                  }

                  // ── Highcharts helpers ────────────────────────────────────

                  function chartColors() {
                    var dark = isDark();
                    return {
                      bg:        dark ? '#1e293b' : '#ffffff',
                      text:      dark ? '#e2e8f0' : '#1e293b',
                      muted:     dark ? '#94a3b8' : '#64748b',
                      grid:      dark ? '#334155' : '#e2e8f0',
                      tooltipBg: dark ? '#0f172a' : '#ffffff'
                    };
                  }

                  function baseChartOpts(c, titleText, categories) {
                    return {
                      chart: { backgroundColor: c.bg, style: { fontFamily: 'system-ui,-apple-system,sans-serif' } },
                      title: { text: titleText, style: { color: c.text, fontSize: '13px', fontWeight: '600' } },
                      xAxis: { categories: categories, labels: { style: { color: c.muted } },
                               lineColor: c.grid, tickColor: c.grid },
                      yAxis: { title: { text: 'Бал', style: { color: c.muted } },
                               labels: { style: { color: c.muted } },
                               gridLineColor: c.grid, startOnTick: false, endOnTick: false },
                      legend: { itemStyle: { color: c.text, fontWeight: 'normal', fontSize: '12px' },
                                itemHoverStyle: { color: c.text } },
                      tooltip: { backgroundColor: c.tooltipBg, style: { color: c.text },
                                 borderColor: c.grid, shared: true },
                      credits: { enabled: false },
                      plotOptions: { series: { connectNulls: false } }
                    };
                  }

                  // ── Charts ────────────────────────────────────────────────

                  function renderCharts(d, label) {
                    var c = chartColors();

                    // Chart 1: Min/max trend across years (K1 only)
                    var minTrend = [], maxTrend = [];
                    pageYears.forEach(function (y, yi) {
                      var k1 = d[yi] ? d[yi][0] : null;
                      minTrend.push(k1 ? k1[0] : null);
                      maxTrend.push(k1 ? k1[3] : null);
                    });
                    var opts1 = baseChartOpts(c, label + ' \u2014 1-во класиране, тренд по години',
                                              pageYears.map(String));
                    opts1.chart.type = 'line';
                    opts1.series = [
                      { name: 'Мин. бал', data: minTrend, color: '#3b82f6',
                        marker: { enabled: true, radius: 4 } },
                      { name: 'Макс. бал', data: maxTrend, color: '#f59e0b',
                        dashStyle: 'ShortDash', marker: { enabled: true, radius: 4 } }
                    ];
                    if (trendChart) trendChart.destroy();
                    trendChart = Highcharts.chart('trend-chart', opts1);

                    // Chart 2: Min/max per klasirane (latest year)
                    var minKlas = [], maxKlas = [];
                    for (var ki = 0; ki < 4; ki++) {
                      var k = d[latestYi] ? d[latestYi][ki] : null;
                      minKlas.push(k ? k[0] : null);
                      maxKlas.push(k ? k[3] : null);
                    }
                    var opts2 = baseChartOpts(c,
                        'Балове по класирания (' + pageYears[latestYi] + ')',
                        ['1-во', '2-ро', '3-то', '4-то']);
                    opts2.chart.type = 'column';
                    opts2.series = [
                      { name: 'Мин. бал', data: minKlas, color: '#3b82f6' },
                      { name: 'Макс. бал', data: maxKlas, color: '#f59e0b' }
                    ];
                    if (klasiraneChart) klasiraneChart.destroy();
                    klasiraneChart = Highcharts.chart('klasirane-chart', opts2);
                  }

                  // ── Init ──────────────────────────────────────────────────

                  document.addEventListener('DOMContentLoaded', function () {
                    renderOverviewHeader();
                    overviewRows = buildOverviewRows();
                    renderOverviewTable('');
                    updateSortIndicators();

                    // Overview table — sortable headers
                    document.querySelectorAll('#overview-table th[data-sortable="1"]').forEach(function (th) {
                      th.addEventListener('click', function () {
                        var col = th.dataset.col;
                        sortDir = (sortCol === col) ? -sortDir : -1;
                        sortCol = col;
                        renderOverviewTable(document.getElementById('overview-search').value);
                        updateSortIndicators();
                      });
                    });

                    // Overview table — text search
                    document.getElementById('overview-search').addEventListener('input', function () {
                      renderOverviewTable(this.value);
                    });

                    // School select
                    populateSchoolSelect();
                    document.getElementById('school-select').addEventListener('change', function () {
                      var code = this.value;
                      populateProfileSelect(code);
                      if (code) showDetail(code, '');
                      else document.getElementById('detail-section').style.display = 'none';
                    });

                    // Profile select
                    document.getElementById('profile-select').addEventListener('change', function () {
                      var code = document.getElementById('school-select').value;
                      if (code) showDetail(code, this.value);
                    });

                    // Gender toggle
                    document.getElementById('gender-toggle').addEventListener('change', function () {
                      var code  = document.getElementById('school-select').value;
                      var pcode = document.getElementById('profile-select').value;
                      if (code) {
                        var d = pcode ? getVisibleData(ruoSchools[code].p[pcode].d) : aggregateAllProfiles(code);
                        renderDetailTable(d, this.checked);
                      }
                    });
                  });

                })();
                  </script>
                """.formatted(hrefName, YEARS_TO_SHOW);
    }

    private String buildFooter() {
        return """
                  <footer class="site-footer">
                    <div class="container">
                      <p class="footer-minimal">&copy; Иван Давидов – НВО и ДЗИ</p>
                    </div>
                  </footer>
                </body>
                </html>
                """;
    }

    private static String escHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
