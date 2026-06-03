/* Per-school page: hydrates the БЕЛ/МАТ charts from the inlined #school-data JSON.
   Self-contained — does not depend on the grade-page logic-*.js globals. */
(function() {
  var el = document.getElementById('school-data');
  if (!el) {
    return;
  }
  var data;
  try {
    data = JSON.parse(el.textContent);
  } catch (e) {
    return;
  }

  // floor/ceiling mirror the main grade pages (config-global.js + config-12.js): the y-axis
  // auto-scales to the data and is only clamped so it never crosses these bounds.
  var GRADE_META = {
    '4':  { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 },
    '7':  { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 },
    '10': { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 },
    '12': { bel: 'ДЗИ-БЕЛ', mat: 'ДЗИ-2', floor: 0, ceiling: 6 }
  };

  // Number of most-recent years per grade. Single source of truth is numYearsByGrade in
  // config-global.js (loaded alongside this script); falls back to 8 if unavailable.
  function numYearsForGrade(grade) {
    if (typeof numYearsByGrade !== 'undefined' && numYearsByGrade[grade]) {
      return numYearsByGrade[grade];
    }
    return 8;
  }

  var years = data.yearsRange || [];
  var charts = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function buildConfig(grade, g) {
    var meta = GRADE_META[grade] || { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 };
    var bel = g.belScore || [];
    var mat = g.matScore || [];

    // Build the last `numYears` years — the same configurable window as the main grade pages
    // (numYearsByGrade in config-global.js: 8 for 4/7/12, 5 for 10). The data arrays stay
    // aligned with this full window; the leading/trailing years without data are trimmed
    // purely via Highcharts config (xAxis.min/max below), not by slicing the data.
    var startIdx = Math.max(0, years.length - numYearsForGrade(grade));
    var cats = [], belData = [], matData = [];
    var firstIdx = -1, lastIdx = -1;
    for (var j = startIdx; j < years.length; j++) {
      var k = cats.length;
      cats.push(String(years[j]));
      var bv = bel[j] == null ? null : bel[j];
      var mv = mat[j] == null ? null : mat[j];
      belData.push(bv);
      matData.push(mv);
      if (bv != null || mv != null) {
        if (firstIdx < 0) { firstIdx = k; }
        lastIdx = k;
      }
    }
    if (firstIdx < 0) {
      return null;
    }

    var dark = isDark();
    var textColor = dark ? '#e2e8f0' : '#1e293b';
    var muted = dark ? '#94a3b8' : '#64748b';
    var grid = dark ? '#334155' : '#e2e8f0';
    var tooltipBg = dark ? '#1e293b' : '#ffffff';

    return {
      chart: { type: 'line', backgroundColor: 'transparent', height: 360, animation: false },
      title: { text: null },
      credits: { enabled: false },
      xAxis: {
        categories: cats,
        // Trim leading/trailing years with no data for this school via the axis range,
        // keeping the data aligned with the full numYears window (Highcharts config,
        // no data slicing). startOnTick/endOnTick:false so the axis ends exactly on the
        // first/last year that has data.
        min: firstIdx,
        max: lastIdx,
        startOnTick: false,
        endOnTick: false,
        labels: { style: { color: muted } },
        lineColor: grid,
        tickColor: grid
      },
      yAxis: {
        title: { text: null },
        floor: meta.floor,
        ceiling: meta.ceiling,
        labels: { style: { color: muted } },
        gridLineColor: grid
      },
      legend: { itemStyle: { color: textColor } },
      tooltip: {
        shared: true,
        backgroundColor: tooltipBg,
        borderColor: grid,
        style: { color: textColor }
      },
      plotOptions: {
        series: { animation: false, connectNulls: false, marker: { enabled: true, radius: 4 } }
      },
      series: [
        { name: meta.bel, data: belData, color: '#3b82f6' },
        { name: meta.mat, data: matData, color: '#f59e0b' }
      ]
    };
  }

  var optionsApplied = false;
  function render() {
    if (typeof Highcharts === 'undefined' || !data.grades) {
      return;
    }
    if (!optionsApplied) {
      // Match the rest of the site (config-global.js) and silence the a11y console warning.
      Highcharts.setOptions({ accessibility: { enabled: false } });
      optionsApplied = true;
    }
    charts = [];
    Object.keys(data.grades).forEach(function(grade) {
      var container = document.getElementById('chart-' + grade);
      if (!container) {
        return;
      }
      var cfg = buildConfig(grade, data.grades[grade]);
      if (!cfg) {
        container.style.display = 'none';
        return;
      }
      charts.push(Highcharts.chart(container, cfg));
    });
  }

  /* ---- PDF report (a single cross-grade document, deps lazy-loaded on click) ---- */

  function gradeHeading(grade) {
    return grade === '12' ? 'ДЗИ 12 клас' : 'НВО ' + grade + ' клас';
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var sc = document.createElement('script');
      sc.src = src;
      sc.onload = resolve;
      sc.onerror = function() { reject(new Error('load ' + src)); };
      document.head.appendChild(sc);
    });
  }

  var jsPdfReady = null;
  function ensureJsPdf() {
    if (jsPdfReady) {
      return jsPdfReady;
    }
    jsPdfReady = (async function() {
      if (!(window.jspdf && window.jspdf.jsPDF)) {
        await loadScript('../../js/jspdf.umd.min.js');
      }
      var api = window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API;
      if (!api || typeof api.autoTable !== 'function') {
        await loadScript('../../js/jspdf.plugin.autotable.min.js');
      }
    })();
    return jsPdfReady;
  }

  var fontReady = null;
  function loadFontBase64() {
    if (fontReady) {
      return fontReady;
    }
    fontReady = fetch('../../fonts/NotoSans-Regular.ttf').then(function(r) {
      if (!r.ok) { throw new Error('font ' + r.status); }
      return r.arrayBuffer();
    }).then(function(buf) {
      var bytes = new Uint8Array(buf);
      var binary = '';
      for (var i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
      return window.btoa(binary);
    });
    return fontReady;
  }

  function renderToImage(container, cfg) {
    return new Promise(function(resolve) {
      var chart = Highcharts.chart(container, cfg);
      var svg = chart.getSVG({ chart: { width: 520, height: 260 } });
      chart.destroy();
      var canvas = document.createElement('canvas');
      canvas.width = 1040;
      canvas.height = 520;
      var ctx = canvas.getContext('2d');
      var img = new Image();
      img.onload = function() { ctx.drawImage(img, 0, 0, 1040, 520); resolve(canvas.toDataURL('image/png')); };
      img.onerror = function() { resolve(null); };
      img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
    });
  }

  function pdfChartImage(grade, g) {
    var cfg = buildConfig(grade, g);
    if (!cfg) {
      return Promise.resolve(null);
    }
    // Force a light theme for the printed chart, regardless of the page theme.
    var dark = '#1e293b', muted = '#64748b', grid = '#e2e8f0';
    cfg.chart.backgroundColor = '#ffffff';
    cfg.xAxis.labels = { style: { color: muted } };
    cfg.xAxis.lineColor = grid;
    cfg.xAxis.tickColor = grid;
    cfg.yAxis.labels = { style: { color: muted } };
    cfg.yAxis.gridLineColor = grid;
    cfg.legend = { itemStyle: { color: dark } };
    cfg.title = { text: gradeHeading(grade), style: { color: dark, fontSize: '13px' } };
    cfg.credits = { enabled: false };
    var tmp = document.createElement('div');
    tmp.style.position = 'absolute';
    tmp.style.left = '-9999px';
    tmp.style.top = '0';
    tmp.style.width = '520px';
    tmp.style.height = '260px';
    document.body.appendChild(tmp);
    return renderToImage(tmp, cfg).then(function(img) {
      tmp.remove();
      return img;
    }, function() {
      tmp.remove();
      return null;
    });
  }

  function rankLine(g) {
    var parts = [];
    if (g.latestYear != null) { parts.push('Последна година: ' + g.latestYear); }
    if (g.nationalRank != null && g.nationalTotal != null) { parts.push('Национален ранг: ' + g.nationalRank + ' / ' + g.nationalTotal); }
    if (g.cityRank != null && g.cityTotal != null) { parts.push('В града: ' + g.cityRank + ' / ' + g.cityTotal); }
    if (g.medianRank != null && g.medianTotal != null) { parts.push('Медианен ранг: ' + g.medianRank + ' / ' + g.medianTotal); }
    return parts.join('   ·   ');
  }

  function tableRows(g) {
    var rows = [];
    var bel = g.belScore || [], mat = g.matScore || [], bu = g.belStudents || [], mu = g.matStudents || [];
    for (var i = years.length - 1; i >= 0; i--) {
      if (bel[i] == null && mat[i] == null) { continue; }
      rows.push([
        String(years[i]),
        bel[i] == null ? '' : bel[i].toFixed(2),
        bu[i] == null ? '' : String(bu[i]),
        mat[i] == null ? '' : mat[i].toFixed(2),
        mu[i] == null ? '' : String(mu[i])
      ]);
    }
    return rows;
  }

  async function generatePdf(btn) {
    var prev = btn ? btn.textContent : null;
    if (btn) { btn.disabled = true; btn.textContent = 'Генериране…'; }
    try {
      await ensureJsPdf();
      var fontBase64 = await loadFontBase64();
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64);
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      doc.setFont('NotoSans', 'normal');
      var pageW = doc.internal.pageSize.getWidth();
      var pageH = doc.internal.pageSize.getHeight();
      var margin = 40;

      doc.setFontSize(16);
      doc.text(String(data.fullName || ''), margin, 50, { maxWidth: pageW - 2 * margin });
      var sub = data.isPrivate ? 'Частно' : 'Държавно';
      if (data.city && data.city.name) { sub += ' · ' + data.city.name; }
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(sub, margin, 68);
      doc.setTextColor(0);

      var y = 90;
      var keys = ['4', '7', '10', '12'].filter(function(k) { return data.grades && data.grades[k]; });
      for (var gi = 0; gi < keys.length; gi++) {
        var grade = keys[gi];
        var g = data.grades[grade];
        if (y > pageH - 230) { doc.addPage(); y = 50; }
        doc.setFontSize(13);
        doc.text(gradeHeading(grade), margin, y);
        y += 14;
        doc.setFontSize(8.5);
        doc.setTextColor(100);
        doc.text(rankLine(g), margin, y);
        doc.setTextColor(0);
        y += 8;
        var img = await pdfChartImage(grade, g);
        if (img) {
          var imgW = pageW - 2 * margin;
          var imgH = imgW * (260 / 520);
          doc.addImage(img, 'PNG', margin, y, imgW, imgH);
          y += imgH + 8;
        }
        var meta = GRADE_META[grade] || { bel: 'БЕЛ', mat: 'МАТ' };
        doc.autoTable({
          head: [['Година', meta.bel, 'уч.', meta.mat, 'уч.']],
          body: tableRows(g),
          startY: y,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { font: 'NotoSans', fontSize: 9, cellPadding: 3, halign: 'center' },
          headStyles: { font: 'NotoSans', fillColor: [30, 64, 175], textColor: 255 }
        });
        y = doc.lastAutoTable.finalY + 26;
      }

      doc.save('nvo-dzi-' + (data.code || 'school') + '.pdf');
    } catch (e) {
      alert('Грешка при генериране на PDF. Моля опитайте отново.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }
  }

  // theme.js calls redraw() after toggling the theme.
  window.redraw = render;

  // Keep the sticky class-nav and section scroll offsets aligned with the ACTUAL header
  // height. On mobile the header wraps to two rows and is taller than --header-height (60px),
  // so a fixed offset would tuck the nav (and the targeted sections) under it. We expose the
  // measured heights as CSS vars consumed by the page's inline <style>:
  //   --sticky-top    -> .school-section-nav { top }
  //   --sticky-offset -> .school-grade { scroll-margin-top }  (header + nav + small gap)
  function updateStickyOffsets() {
    var header = document.querySelector('.site-header');
    if (!header) {
      return;
    }
    var nav = document.querySelector('.school-section-nav');
    var h = Math.round(header.getBoundingClientRect().height);
    var n = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    var style = document.documentElement.style;
    style.setProperty('--sticky-top', h + 'px');
    style.setProperty('--sticky-offset', (h + n + 12) + 'px');
  }

  function init() {
    updateStickyOffsets();
    render();
    var pdfBtn = document.getElementById('schoolPdfBtn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', function() { generatePdf(pdfBtn); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', updateStickyOffsets);
  window.addEventListener('orientationchange', updateStickyOffsets);

  window.addEventListener('resize', function() {
    updateStickyOffsets();
    charts.forEach(function(c) {
      try { c.reflow(); } catch (e) {}
    });
  });
})();
