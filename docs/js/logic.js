let chartBelInstance = null;
let chartMatInstance = null;
let resizeRedrawTimeout = null;
let pendingSelectedButtonIds = null;
let rankingTableBuilders = {};
let selectedSchoolIndices = new Set();
let pdfFontBase64Promise = null;

function getAppBasePath() {
  let pathname = window.location.pathname || '/';
  let match = pathname.match(/^(.*\/)(?:4|7|10|12|stats)(?:\/|$)/);
  if(match && match[1]) {
    return match[1];
  }
  if(pathname.endsWith('/')) {
    return pathname;
  }
  let lastSlash = pathname.lastIndexOf('/');
  return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : '/';
}

function resolveAssetPath(pathFromAppRoot) {
  if(!pathFromAppRoot) {
    return pathFromAppRoot;
  }
  if(/^(?:[a-z]+:)?\/\//i.test(pathFromAppRoot) || pathFromAppRoot.startsWith('data:') || pathFromAppRoot.startsWith('/')) {
    return pathFromAppRoot;
  }
  let normalized = pathFromAppRoot.replace(/^\.?\//, '');
  return new URL(normalized, window.location.origin + getAppBasePath()).toString();
}

function getCurrentGradeFromPath() {
  let pathname = window.location.pathname || '';
  let match = pathname.match(/\/(4|7|10|12)(?:\/|$)/);
  return match ? Number.parseInt(match[1], 10) : 7;
}

function getGradePagePath(grade) {
  let parsed = Number.parseInt(grade, 10);
  if(![4, 7, 10, 12].includes(parsed)) {
    return resolveAssetPath('7/');
  }
  return resolveAssetPath(parsed + '/');
}

function getStatsPagePath(grade) {
  let parsed = Number.parseInt(grade, 10);
  let safeGrade = [4, 7, 10, 12].includes(parsed) ? parsed : 7;
  return resolveAssetPath('stats/?grade=' + safeGrade);
}

function applyNavigationPaths() {
  let currentGrade = getCurrentGradeFromPath();

  let gradeTabs = document.querySelectorAll('.grade-tabs a[data-grade]');
  gradeTabs.forEach((a) => {
    let grade = Number.parseInt(a.getAttribute('data-grade'), 10);
    if(!Number.isInteger(grade)) {
      return;
    }
    a.href = getGradePagePath(grade);
    a.classList.toggle('active', grade === currentGrade);
  });

  let gradeLinks = document.querySelectorAll('a[data-grade-link]');
  gradeLinks.forEach((a) => {
    let grade = Number.parseInt(a.getAttribute('data-grade-link'), 10);
    if(!Number.isInteger(grade)) {
      return;
    }
    a.href = getGradePagePath(grade);
  });

  let statsLinks = document.querySelectorAll('a[data-stats-grade]');
  statsLinks.forEach((a) => {
    let grade = Number.parseInt(a.getAttribute('data-stats-grade'), 10);
    a.href = getStatsPagePath(grade);
  });
}

function toggleOtherCities() {
  let content = document.getElementById('other-cities-content');
  let toggle = document.getElementById('other-cities-toggle');
  if(!content || !toggle) {
    return;
  }
  if(content.classList.contains('other-cities-collapsed')) {
    content.classList.remove('other-cities-collapsed');
    toggle.textContent = 'Затвори \u25B2';
  } else {
    content.classList.add('other-cities-collapsed');
    toggle.textContent = 'Отвори \u25BC';
  }
}

function safeDivide(numerator, denominator, fallback = 0) {
  return denominator ? numerator / denominator : fallback;
}

function button(id) {
  return document.getElementById('b' + id);
}

function buttonEnabled(id) {
  let btn = button(id);
  if(btn) {
    return btn.classList.contains('button-primary');
  }
  return false;
}

function setButtonState(id, state) {
  let btn = button(id);
  if(btn === null) {
    return;
  }
  if(state === true) {
    btn.classList.add('button-primary');
    selectedSchoolIndices.add(Number(id));
  } else {
    btn.classList.remove('button-primary');
    selectedSchoolIndices.delete(Number(id));
  }
}

function getDefaultClickedButtonIds() {
  let url = new URL(window.location.href);
  let indices = url.searchParams.get(cookieName);
  if(indices) {
    return indices.split(',').map((i) => i.split('#')[0]).filter((i) => i !== '');
  }
  let cookieMatch = (document.cookie + ';').match(new RegExp(cookieName + '=.*;'));
  if(cookieMatch) {
    let cookieIndices = cookieMatch[0].split(/=|;/)[1].split('#')[0];
    if(cookieIndices) {
      return cookieIndices.split(',').filter((i) => i !== '');
    }
  }
  return [String(baseSchoolIndex), String(refSchoolIndex)];
}

function applyPendingSelectedButtons() {
  if(!pendingSelectedButtonIds || pendingSelectedButtonIds.size === 0) {
    return false;
  }
  let changed = false;
  [...pendingSelectedButtonIds].forEach((id) => {
    if(button(id)) {
      setButtonState(id, true);
      pendingSelectedButtonIds.delete(id);
      changed = true;
    }
  });
  if(pendingSelectedButtonIds.size === 0) {
    pendingSelectedButtonIds = null;
  }
  return changed;
}

function cityContainsSchoolIndex(cityName, schoolIndex) {
  let schoolGroups = getCitySchoolGroups(cityName);
  if(!schoolGroups) {
    return false;
  }
  let pu = schoolGroups.puSchools;
  if(pu && schoolIndex >= pu[0] && schoolIndex <= pu[1]) {
    return true;
  }
  let pr = schoolGroups.prSchools;
  if(pr && schoolIndex >= pr[0] && schoolIndex <= pr[1]) {
    return true;
  }
  return false;
}

function findCityForSchool(schoolIndex) {
  let cityNames = Object.keys(si);
  for(let c = 0; c < cityNames.length; c++) {
    let cityName = cityNames[c];
    let groups = getCitySchoolGroups(cityName);
    if(!groups) { continue; }
    let pu = groups.puSchools;
    if(pu && schoolIndex >= pu[0] && schoolIndex <= pu[1]) {
      return { cityName: cityName, isPrivate: false };
    }
    let pr = groups.prSchools;
    if(pr && schoolIndex >= pr[0] && schoolIndex <= pr[1]) {
      return { cityName: cityName, isPrivate: true };
    }
  }
  return null;
}

function calculateNationalAverages() {
  let totalYears = s[baseSchoolIndex].b.length;
  let natB = [];
  let natM = [];
  for(let y = 0; y < totalYears; y++) {
    let sumB = 0, countB = 0, sumM = 0, countM = 0;
    s.forEach((o) => {
      if(o && o.b[y]) { sumB += o.b[y]; countB++; }
      if(o && o.m[y]) { sumM += o.m[y]; countM++; }
    });
    natB.push(countB > 0 ? sumB / countB : 0);
    natM.push(countM > 0 ? sumM / countM : 0);
  }
  return { b: natB, m: natM };
}

function renderChartToImage(containerDiv, chartConfig) {
  return new Promise((resolve) => {
    let chart = Highcharts.chart(containerDiv, chartConfig);
    let svg = chart.getSVG({ chart: { width: 520, height: 260 } });
    chart.destroy();
    let canvas = document.createElement('canvas');
    canvas.width = 1040;
    canvas.height = 520;
    let ctx = canvas.getContext('2d');
    let img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1040, 520);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
  });
}

function getSchoolRankInCity(schoolIndex, cityName) {
  let groups = getCitySchoolGroups(cityName);
  if(!groups) { return { rank: null, total: 0 }; }
  let schools = [];
  for(let i = groups.puSchools[0]; i <= groups.puSchools[1]; i++) {
    if(s[i] && (s[i].mb || s[i].mm)) { schools.push(i); }
  }
  if(groups.prSchools) {
    for(let i = groups.prSchools[0]; i <= groups.prSchools[1]; i++) {
      if(s[i] && (s[i].mb || s[i].mm)) { schools.push(i); }
    }
  }
  schools.sort((a, b) => (s[b].mb + s[b].mm) / 2 - (s[a].mb + s[a].mm) / 2);
  let rank = schools.indexOf(schoolIndex);
  return { rank: rank >= 0 ? rank + 1 : null, total: schools.length };
}

async function generateSchoolReportPdf(schoolIndex, linkEl) {
  let jsPdfNs = window.jspdf;
  if(!jsPdfNs || !jsPdfNs.jsPDF || !jsPdfNs.jsPDF.API || typeof jsPdfNs.jsPDF.API.autoTable !== 'function') {
    return;
  }
  let school = s[schoolIndex];
  if(!school) { return; }
  setPdfLinkBusyState(linkEl, true);
  try {
    let cityInfo = findCityForSchool(schoolIndex);
    let cityName = cityInfo ? cityInfo.cityName : '';
    let schoolType = cityInfo ? (cityInfo.isPrivate ? 'Частно' : 'Държавно') : '';
    let totalYears = school.b.length;
    let fontBase64 = await getPdfFontBase64();
    let doc = new jsPdfNs.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    doc.addFileToVFS(TABLE_PDF_FONT_FILE, fontBase64);
    doc.addFont(TABLE_PDF_FONT_FILE, TABLE_PDF_FONT_NAME, 'normal');
    doc.setFont(TABLE_PDF_FONT_NAME, 'normal');
    let pageW = doc.internal.pageSize.getWidth();
    let margin = 40;

    // Page 1: Overview
    doc.setFontSize(18);
    doc.text(school.n, pageW / 2, 45, { align: 'center' });
    doc.setFontSize(12);
    let subtitle = tableTitleType + '  |  ' + cityName + '  |  ' + schoolType;
    doc.text(subtitle, pageW / 2, 70, { align: 'center' });

    // Compute stats
    let rankInfo = getSchoolRankInCity(schoolIndex, cityName);
    let natAvg = calculateNationalAverages();
    let cityAvgB = cityInfo && !cityInfo.isPrivate && si[cityName].mnbs ? si[cityName].mnbs : (cityInfo && cityInfo.isPrivate && si[cityName].mpbs ? si[cityName].mpbs : null);
    let cityAvgM = cityInfo && !cityInfo.isPrivate && si[cityName].mnms ? si[cityName].mnms : (cityInfo && cityInfo.isPrivate && si[cityName].mpms ? si[cityName].mpms : null);

    let validB = school.b.filter(v => v !== null && v !== undefined);
    let validM = school.m.filter(v => v !== null && v !== undefined);
    let validBu = school.bu.filter((v, i) => v && school.b[i] !== null);
    let validMu = school.mu.filter((v, i) => v && school.m[i] !== null);

    let avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    let stddev = (arr) => {
      if(arr.length < 2) { return 0; }
      let m = avg(arr);
      return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) * (v - m), 0) / (arr.length - 1));
    };
    let bestYearB = null, worstYearB = null, bestYearM = null, worstYearM = null;
    for(let y = 0; y < totalYears; y++) {
      if(school.b[y] !== null) {
        if(bestYearB === null || school.b[y] > school.b[bestYearB]) { bestYearB = y; }
        if(worstYearB === null || school.b[y] < school.b[worstYearB]) { worstYearB = y; }
      }
      if(school.m[y] !== null) {
        if(bestYearM === null || school.m[y] > school.m[bestYearM]) { bestYearM = y; }
        if(worstYearM === null || school.m[y] < school.m[worstYearM]) { worstYearM = y; }
      }
    }

    // Percentile in city
    let citySchoolAvgs = [];
    let groups = getCitySchoolGroups(cityName);
    if(groups) {
      let addRange = (range) => {
        if(!range) { return; }
        for(let i = range[0]; i <= range[1]; i++) {
          if(s[i] && (s[i].mb || s[i].mm)) { citySchoolAvgs.push((s[i].mb + s[i].mm) / 2); }
        }
      };
      addRange(groups.puSchools);
      addRange(groups.prSchools);
    }
    citySchoolAvgs.sort((a, b) => a - b);
    let schoolAvg = (school.mb + school.mm) / 2;
    let percentile = 0;
    if(citySchoolAvgs.length > 0) {
      let below = citySchoolAvgs.filter(v => v < schoolAvg).length;
      percentile = Math.round(below / citySchoolAvgs.length * 100);
    }

    // Trend (linear regression slope)
    let calcTrend = (arr) => {
      let pts = [];
      for(let i = 0; i < arr.length; i++) { if(arr[i] !== null && arr[i] !== undefined) { pts.push({ x: i, y: arr[i] }); } }
      if(pts.length < 2) { return null; }
      let mx = avg(pts.map(p => p.x));
      let my = avg(pts.map(p => p.y));
      let num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
      let den = pts.reduce((s, p) => s + (p.x - mx) * (p.x - mx), 0);
      return den !== 0 ? num / den : 0;
    };
    let trendB = calcTrend(school.b);
    let trendM = calcTrend(school.m);

    // Summary stats box
    let summaryData = [
      [csvHeaderBel + ' средна (3г.)', school.mb ? school.mb.toFixed(2) : '-', csvHeaderMat + ' средна (3г.)', school.mm ? school.mm.toFixed(2) : '-'],
      [csvHeaderBel + ' средна (всички)', validB.length > 0 ? avg(validB).toFixed(2) : '-', csvHeaderMat + ' средна (всички)', validM.length > 0 ? avg(validM).toFixed(2) : '-'],
      [csvHeaderBel + ' станд. отклонение', validB.length > 1 ? stddev(validB).toFixed(2) : '-', csvHeaderMat + ' станд. отклонение', validM.length > 1 ? stddev(validM).toFixed(2) : '-'],
      [csvHeaderBel + ' тренд (наклон)', trendB !== null ? (trendB >= 0 ? '+' : '') + trendB.toFixed(2) + '/г.' : '-', csvHeaderMat + ' тренд (наклон)', trendM !== null ? (trendM >= 0 ? '+' : '') + trendM.toFixed(2) + '/г.' : '-'],
      [csvHeaderBel + ' най-добра', bestYearB !== null ? school.b[bestYearB] + ' (' + (firstYear + bestYearB) + ')' : '-', csvHeaderMat + ' най-добра', bestYearM !== null ? school.m[bestYearM] + ' (' + (firstYear + bestYearM) + ')' : '-'],
      [csvHeaderBel + ' най-слаба', worstYearB !== null ? school.b[worstYearB] + ' (' + (firstYear + worstYearB) + ')' : '-', csvHeaderMat + ' най-слаба', worstYearM !== null ? school.m[worstYearM] + ' (' + (firstYear + worstYearM) + ')' : '-'],
      ['Ранг в града', rankInfo.rank ? rankInfo.rank + ' / ' + rankInfo.total : '-', 'Перцентил в града', percentile + '%'],
      ['Средно ученици ' + csvHeaderBel, validBu.length > 0 ? Math.round(avg(validBu)) : '-', 'Средно ученици ' + csvHeaderMat, validMu.length > 0 ? Math.round(avg(validMu)) : '-']
    ];

    // 1. Изчисляваме общата ширина на таблицата (сумата от всички cellWidth)
    const tableWidth = 120 + 80 + 120 + 80; // = 400
    // 2. Взимаме ширината на PDF страницата
    const pageWidth = doc.internal.pageSize.getWidth();
    // 3. Изчисляваме левия маржин за центриране
    const marginLeft = (pageWidth - tableWidth) / 2;
    doc.autoTable({
      body: summaryData,
      startY: 95,
      // 4. Прилагаме изчисления маржин
      margin: { left: marginLeft }, 
      tableWidth: tableWidth, // Добре е да се дефинира изрично
      theme: 'plain',
      styles: { font: TABLE_PDF_FONT_NAME, fontSize: 10, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 120 },
        1: { halign: 'center', cellWidth: 80 },
        2: { fontStyle: 'bold', cellWidth: 120 },
        3: { halign: 'center', cellWidth: 80 }
      },
      didParseCell: (data) => {
        if(data.section === 'body' && (data.column.index === 1 || data.column.index === 3)) {
          let text = String(data.cell.raw);
          if(text.startsWith('+')) { data.cell.styles.textColor = [22, 163, 74]; }
          else if(text.startsWith('-') && text !== '-') { data.cell.styles.textColor = [220, 38, 38]; }
        }
      }
    });

    // Scores table
    let scoresY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(12);
    doc.text('Резултати по години', pageW / 2, scoresY, { align: 'center' });
    let scoreHeaders = ['Година', csvHeaderBel, csvHeaderMat, csvHeaderBel + ' уч.', csvHeaderMat + ' уч.', '\u0394 ' + csvHeaderB, '\u0394 ' + csvHeaderM];
    let scoreRows = [];
    for(let y = 0; y < totalYears; y++) {
      let year = firstYear + y;
      let dB = (y > 0 && school.b[y] !== null && school.b[y - 1] !== null) ? (school.b[y] - school.b[y - 1]).toFixed(2) : '';
      let dM = (y > 0 && school.m[y] !== null && school.m[y - 1] !== null) ? (school.m[y] - school.m[y - 1]).toFixed(2) : '';
      scoreRows.push([
        String(year),
        school.b[y] !== null && school.b[y] !== undefined ? String(school.b[y]) : '-',
        school.m[y] !== null && school.m[y] !== undefined ? String(school.m[y]) : '-',
        school.bu[y] ? String(school.bu[y]) : '-',
        school.mu[y] ? String(school.mu[y]) : '-',
        dB, dM
      ]);
    }
    doc.autoTable({
      head: [scoreHeaders],
      body: scoreRows,
      startY: scoresY + 12,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { font: TABLE_PDF_FONT_NAME, fontSize: 10, cellPadding: 3, halign: 'center' },
      headStyles: { font: TABLE_PDF_FONT_NAME, fillColor: [30, 64, 175], textColor: 255 },
      didParseCell: (data) => {
        if(data.section === 'body' && (data.column.index === 5 || data.column.index === 6)) {
          let val = parseFloat(data.cell.raw);
          if(!isNaN(val)) {
            if(val > 0) { data.cell.styles.textColor = [22, 163, 74]; }
            else if(val < 0) { data.cell.styles.textColor = [220, 38, 38]; }
          }
        }
      }
    });

    // Comparison table: school vs city vs national (last 3 years) with deltas
    let compY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(12);
    doc.text('Сравнение с град и нация (последни 3 години)', pageW / 2, compY, { align: 'center' });
    let compHeaders = ['Година', 'Уч. ' + csvHeaderB, 'Град ' + csvHeaderB, '\u0394 град', 'Нация ' + csvHeaderB, '\u0394 нация', 'Уч. ' + csvHeaderM, 'Град ' + csvHeaderM, '\u0394 град', 'Нация ' + csvHeaderM, '\u0394 нация'];
    let compRows = [];
    for(let i = 0; i < 3; i++) {
      let y = totalYears - 1 - i;
      if(y < 0) { continue; }
      let year = firstYear + y;
      let sB = school.b[y];
      let cB = cityAvgB && cityAvgB[y] ? cityAvgB[y] : null;
      let nB = natAvg.b[y] ? natAvg.b[y] : null;
      let sM = school.m[y];
      let cM = cityAvgM && cityAvgM[y] ? cityAvgM[y] : null;
      let nM = natAvg.m[y] ? natAvg.m[y] : null;
      let dCB = (sB !== null && cB !== null) ? (sB - cB).toFixed(2) : '-';
      let dNB = (sB !== null && nB !== null) ? (sB - nB).toFixed(2) : '-';
      let dCM = (sM !== null && cM !== null) ? (sM - cM).toFixed(2) : '-';
      let dNM = (sM !== null && nM !== null) ? (sM - nM).toFixed(2) : '-';
      compRows.push([
        String(year),
        sB !== null ? String(sB) : '-',
        cB !== null ? cB.toFixed(2) : '-',
        dCB, nB !== null ? nB.toFixed(2) : '-', dNB,
        sM !== null ? String(sM) : '-',
        cM !== null ? cM.toFixed(2) : '-',
        dCM, nM !== null ? nM.toFixed(2) : '-', dNM
      ]);
    }
    doc.autoTable({
      head: [compHeaders],
      body: compRows,
      startY: compY + 12,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { font: TABLE_PDF_FONT_NAME, fontSize: 10, cellPadding: 2.5, halign: 'center' },
      headStyles: { font: TABLE_PDF_FONT_NAME, fillColor: [30, 64, 175], textColor: 255, fontSize: 6.5 },
      didParseCell: (data) => {
        if(data.section === 'body' && (data.column.index === 3 || data.column.index === 5 || data.column.index === 8 || data.column.index === 10)) {
          let val = parseFloat(data.cell.raw);
          if(!isNaN(val)) {
            if(val > 0) { data.cell.styles.textColor = [22, 163, 74]; }
            else if(val < 0) { data.cell.styles.textColor = [220, 38, 38]; }
          }
        }
      }
    });

    // Page 2: Charts
    doc.addPage();
    doc.setFontSize(13);
    doc.text(school.n + ' - Графики', pageW / 2, 35, { align: 'center' });

    let hiddenDiv = document.createElement('div');
    hiddenDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:520px;height:260px;';
    document.body.appendChild(hiddenDiv);

    let years = [];
    for(let y = 0; y < totalYears; y++) { years.push(String(firstYear + y)); }

    // BEL chart
    let belSeries = [
      { name: school.l, data: school.b.slice(), color: '#1e40af' },
      { name: 'Средна за ' + cityName, data: cityAvgB ? cityAvgB.slice() : [], dashStyle: 'Dash', color: '#9ca3af' }
    ];
    if(natAvg.b.length > 0) {
      belSeries.push({ name: 'Национална средна', data: natAvg.b.slice(), dashStyle: 'Dot', color: '#f59e0b' });
    }
    let belConfig = {
      chart: { type: 'line', animation: false, height: 260, width: 520 },
      title: { text: chartBTitle, style: { fontSize: '12px' } },
      xAxis: { categories: years, labels: { style: { fontSize: '9px' } } },
      yAxis: { title: { text: null }, floor: chartFloor, ceiling: chartCeiling, labels: { style: { fontSize: '9px' } } },
      legend: { itemStyle: { fontSize: '9px' } },
      credits: { enabled: false },
      exporting: { enabled: false },
      plotOptions: { series: { animation: false, connectNulls: true } },
      series: belSeries
    };
    let belPng = await renderChartToImage(hiddenDiv, belConfig);
    if(belPng) {
      doc.addImage(belPng, 'PNG', margin, 50, pageW - margin * 2, (pageW - margin * 2) * 0.5);
    }

    // MAT chart
    let matSeries = [
      { name: school.l, data: school.m.slice(), color: '#1e40af' },
      { name: 'Средна за ' + cityName, data: cityAvgM ? cityAvgM.slice() : [], dashStyle: 'Dash', color: '#9ca3af' }
    ];
    if(natAvg.m.length > 0) {
      matSeries.push({ name: 'Национална средна', data: natAvg.m.slice(), dashStyle: 'Dot', color: '#f59e0b' });
    }
    let matConfig = {
      chart: { type: 'line', animation: false, height: 260, width: 520 },
      title: { text: chartMTitle, style: { fontSize: '12px' } },
      xAxis: { categories: years, labels: { style: { fontSize: '9px' } } },
      yAxis: { title: { text: null }, floor: chartFloor, ceiling: chartCeiling, labels: { style: { fontSize: '9px' } } },
      legend: { itemStyle: { fontSize: '9px' } },
      credits: { enabled: false },
      exporting: { enabled: false },
      plotOptions: { series: { animation: false, connectNulls: true } },
      series: matSeries
    };
    let matChartY = belPng ? 50 + (pageW - margin * 2) * 0.5 + 25 : 50;
    let matPng = await renderChartToImage(hiddenDiv, matConfig);
    if(matPng) {
      doc.addImage(matPng, 'PNG', margin, matChartY, pageW - margin * 2, (pageW - margin * 2) * 0.5);
    }

    document.body.removeChild(hiddenDiv);

    // Footer on each page
    let totalPages = doc.internal.getNumberOfPages();
    for(let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('ivandavidov.github.io/nvo', pageW / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
      doc.text(p + ' / ' + totalPages, pageW - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
      doc.setTextColor(0);
    }

    let safeCity = cityName.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '-').replace(/-+/g, '-');
    let safeLabel = school.l.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '-').replace(/-+/g, '-');
    doc.save(exportPrefix + '-report-' + safeCity + '-' + safeLabel + '.pdf');
  } catch(err) {
    console.error(err);
    alert('Грешка при генериране на PDF доклад. Моля опитайте отново.');
  } finally {
    setPdfLinkBusyState(linkEl, false);
  }
}

function getCitySchoolGroups(cityName) {
  let cityData = si[cityName];
  if(!cityData) {
    return null;
  }
  if(!Array.isArray(cityData.n) || cityData.n.length < 2) {
    return null;
  }
  return {
    puSchools: cityData.n,
    prSchools: Array.isArray(cityData.p) && cityData.p.length >= 2 ? cityData.p : null
  };
}

function hasSchoolsWithLatestYearData(schoolRange) {
  if(!Array.isArray(schoolRange) || schoolRange.length < 2) {
    return false;
  }
  let start = schoolRange[0];
  let end = schoolRange[1];
  if(!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    return false;
  }
  for(let i = start; i <= end; i++) {
    if(s[i] && s[i].b[s[i].b.length - 1] && s[i].m[s[i].m.length - 1]) {
      return true;
    }
  }
  return false;
}

function hasRenderableCitySchools(puSchools, prSchools) {
  return hasSchoolsWithLatestYearData(puSchools) || hasSchoolsWithLatestYearData(prSchools);
}

function fallbackCityHrefName(cityName) {
  return String(cityName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function cityMenuOrderPosition(value) {
  let parsed = Number.parseInt(value, 10);
  if(Number.isInteger(parsed) && parsed >= 1 && parsed <= 3) {
    return parsed;
  }
  return 3;
}

function cityRenderOrderIndex(value) {
  let parsed = Number.parseInt(value, 10);
  if(Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }
  return null;
}

function getRenderableCitiesFromData() {
  let cities = [];
  Object.keys(si).forEach((name) => {
    let cityData = si[name] || {};
    let renderOrderIndex = cityRenderOrderIndex(cityData.i);
    if(renderOrderIndex === null) {
      console.warn('Skipping city "' + name + '" because render index "i" is missing in schools data.');
      return;
    }
    let cityCsvData = generateCityData(name);
    if(!cityCsvData) {
      return;
    }
    cities.push({
      name: name,
      hrName: cityData.h ? String(cityData.h) : fallbackCityHrefName(name),
      btName: cityData.l ? String(cityData.l) : String(name),
      btPos: cityMenuOrderPosition(cityData.o),
      i: renderOrderIndex,
      data: cityCsvData
    });
  });
  cities.sort((c1, c2) => c1.i - c2.i);
  return cities;
}

function recalculate() {
  let tracesBel = [];
  let tracesMat = [];
  let indices = [];
  let dataNoSchool = [];
  for(let i = 0; i < numYears; i++) {
    dataNoSchool.push(chartNoSchool);
  }
  let noSchool = {name: 'Изберете поне едно училище', data: dataNoSchool};
  selectedSchoolIndices.forEach((i) => {
    if(s[i]) {
      indices.push(i);
      tracesBel.push({name: s[i].n, data: s[i].b, schoolIndex: i, subject: 'b'});
      tracesMat.push({name: s[i].n, data: s[i].m, schoolIndex: i, subject: 'm'});
    }
  });
  if(tracesBel.length === 0 || tracesMat.length === 0) {
    tracesBel.push(noSchool);
    tracesMat.push(noSchool);
  }
  let sortFunc = (t1, t2) => (t1.data[t1.data.length - 1]) < (t2.data[t2.data.length - 1]) ? 1 : -1;
  tracesBel.sort(sortFunc);
  tracesMat.sort(sortFunc);
  return {b: tracesBel, m: tracesMat, i: indices};
}

function toggleButton(id) {
  if(!s[id]) {
    return;
  }
  if(buttonEnabled(id)) {
    setButtonState(id, false);
  } else {
    setButtonState(id, true);        
  }
  redraw();
}

function normalizeSeries(series) {
  for(let i = 0; i < series.length; i++) {
    series[i].data = series[i].data.slice(series[i].data.length - numYears, series[i].data.length);
  }
  let hasAnyValues = () => series.some((s) => s.data && s.data.length > 0);
  while(hasAnyValues() && !series.some(s => s.data[0])) {
    for(let i = 0; i < series.length; i++) {
      series[i].data = series[i].data.slice(1);
    }
  }
  let counter = 0;
  while(hasAnyValues() && !series.some(s => s.data[s.data.length - 1])) {
    for(let i = 0; i < series.length; i++) {
      series[i].data = series[i].data.slice(0, series[i].data.length - 1);
    }
    ++counter;
  }
  return counter;
}

function getLayout(title, series, exportPrefix) {
  let removedYears = normalizeSeries(series);
  let lastYear = firstYear - 1 + s[baseSchoolIndex].b.length - removedYears;
  let categories = [];
  for(let i = 0; i < series[0].data.length; i++) {
    categories.push(lastYear - (series[0].data.length - i - 1) + '');
  }
  return {
    title: {
      text: title,
      style: {
        fontSize: '1.50em'
      }
    },
    xAxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '1.25em'
        }
      }
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        style: {
          fontSize: '1.25em'
        }
      },
      floor: chartFloor,
      ceiling: chartCeiling
    },
    legend: {
      layout: 'horizontal',
      align: 'left',
      itemStyle: {
        fontSize: '1.25em'
      }
    },
    chart: {
      animation: false,
      height: Math.max(Math.floor(Math.min(window.innerWidth, window.innerHeight) * CHART_HEIGHT_PERCENT), CHART_MIN_HEIGHT_PX)
    },
    plotOptions: {
      series: {
        animation:false
      }
    },
    credits: {
      enabled: true
    },
    tooltip: {
      animation: false,
      style: {
        fontSize: '1.25em'
      },
      formatter: function() {
        let options = this.series && this.series.userOptions ? this.series.userOptions : {};
        let yearValue = this.category;
        if(yearValue === undefined || yearValue === null || yearValue === '') {
          yearValue = this.x;
        }
        if((yearValue === undefined || yearValue === null || yearValue === '') && this.series && this.series.xAxis && this.point && Number.isInteger(this.point.x)) {
          let categories = this.series.xAxis.categories || [];
          if(categories[this.point.x] !== undefined) {
            yearValue = categories[this.point.x];
          }
        }
        let yearText = yearValue === undefined || yearValue === null || yearValue === '' ? '-' : String(yearValue);
        let year = Number.parseInt(yearText, 10);
        let students = null;
        if(Number.isInteger(options.schoolIndex)) {
          if(!Number.isFinite(year) && this.series && this.series.xAxis && this.point && Number.isInteger(this.point.x)) {
            let categories = this.series.xAxis.categories || [];
            if(categories[this.point.x] !== undefined) {
              yearText = String(categories[this.point.x]);
              year = Number.parseInt(yearText, 10);
            }
          }
          let yearIndex = Number.isFinite(year) ? year - firstYear : -1;
          let school = s[options.schoolIndex];
          if(school && yearIndex >= 0) {
            let counts = options.subject === 'b' ? school.bu : school.mu;
            if(counts && yearIndex < counts.length) {
              students = counts[yearIndex];
            }
          }
        }
        let valueText = this.y === null || this.y === undefined ? '-' : Highcharts.numberFormat(this.y, 2, '.', '');
        let points = '<b>' + this.series.name + '</b>';
        points += '<br/>Година: <b>' + yearText + '</b>';
        points += '<br/>Резултат: <b>' + valueText + '</b>';
        if(students !== null && students !== undefined && students !== '') {
          points += '<br/>Ученици: <b>' + students + '</b>';
        }
        return points;
      }
    },
    exporting: {
      enabled: true,
      allowHTML: true,
      sourceWidth: CHART_EXPORT_WIDTH,
      sourceHeight: CHART_EXPORT_HEIGHT,
      scale: CHART_EXPORT_SCALE,
      filename: exportPrefix + '-chart',
      buttons: {
        contextButton: {
          menuItems: ['printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG']
        }
      }
    },
    series: series
  }
}

function handleURL(indices) {
  let url = new URL(window.location.href);
  let anchor = url.hash.replace('#', '');
  let baseURL = url.origin + url.pathname;
  if(indices.length === 0) {
    document.cookie = cookieName + '=;path=/;max-age=-1';
    window.history.replaceState(indices, null, anchor ? baseURL + '#' + anchor : baseURL);
  } else {
    let endURL = indices.join(',');
    document.cookie = cookieName + '=' + endURL + ';path=/;max-age=' + COOKIE_MAX_AGE_SECONDS;
    if(anchor) {
      endURL += '#' + anchor;
    }
    window.history.replaceState(indices, null, baseURL + '?' + cookieName + '=' + endURL);
  }
}

function redraw() {
  let traces = recalculate();
  handleURL(traces.i);
  let belLayout = getLayout(chartBTitle, traces.b, exportPrefixBel);
  let matLayout = getLayout(chartMTitle, traces.m, exportPrefixMat);
  if(chartBelInstance) {
    chartBelInstance.update(belLayout, true, true, false);
  } else {
    chartBelInstance = Highcharts.chart('chartb', belLayout);
  }
  if(chartMatInstance) {
    chartMatInstance.update(matLayout, true, true, false);
  } else {
    chartMatInstance = Highcharts.chart('chartm', matLayout);
  }
}

function debounceRedrawOnResize() {
  if(resizeRedrawTimeout) {
    clearTimeout(resizeRedrawTimeout);
  }
  resizeRedrawTimeout = setTimeout(() => {
    resizeRedrawTimeout = null;
    redraw();
  }, RESIZE_REDRAW_DEBOUNCE_MS);
}

function getSchoolCounts(schools) {
  let topCount = 0;
  let secondCount = 0;
  const count = schools[1] - schools[0];
  if(count >= SCHOOL_THRESHOLD_SMALL)  { topCount = SCHOOL_TOP_COUNT_SMALL; }
  if(count >= SCHOOL_THRESHOLD_MEDIUM) { topCount = SCHOOL_TOP_COUNT_MEDIUM; }
  if(count >= SCHOOL_THRESHOLD_LARGE)  { topCount = SCHOOL_TOP_COUNT_LARGE; }
  if(count >= SCHOOL_THRESHOLD_XLARGE) { secondCount = SCHOOL_SECOND_COUNT; }
  return { topCount, secondCount };
}

function generateSchoolButtons(div, slices, topCount, secondCount) {
  let schools = null;
  let topBtn = null;
  let secondBtn = null;
  let sortFunc = (i1, i2) => (s[i1].mb + s[i1].mm) / 2 < (s[i2].mb + s[i2].mm) / 2 ? 1 : -1;  
  if(topCount && topCount > 0) {
    schools = [];
    topBtn = document.createElement('button');
    topBtn.classList.add('mbtn');
    topBtn.textContent = 'Топ ' + topCount;
    div.appendChild(topBtn);
  }
  if(secondCount && secondCount > 0) {
    schools = [];
    secondBtn = document.createElement('button');
    secondBtn.classList.add('mbtn');
    secondBtn.textContent = 'Топ ' + (topCount + 1) + ' - ' + (topCount + secondCount);
    div.appendChild(secondBtn);
  }
  for(let j = slices[0]; j <= slices[1]; j++) {
    if(!s[j]) {
      continue;
    }
    if(schools) {
      schools.push(j);
    }
    let b = document.createElement('button');
    b.id = 'b' + j;
    b.textContent = s[j].l;
    b.title = s[j].n;
    b.onclick = function() {toggleButton('' + j)};
    div.appendChild(b);
  }
  let setSchoolButtons = (start, count, state) => {
    let selected = 0;
    for(let i = start; i < schools.length && selected < count; i++) {
      if(!schools[i] || !s[schools[i]] || s[schools[i]].b[s[schools[i]].b.length - 1] === null) {
        continue;
      }
      setButtonState(schools[i], state);
      ++selected;
    }
  }
  let handleGroupBtnClick = (btn, start, count) => {
    schools.sort(sortFunc);
    if(btn.classList.contains('button-primary')) {
      setSchoolButtons(start, count, false);
      btn.classList.remove('button-primary');
    } else {
      setSchoolButtons(start, count, true);
      btn.classList.add('button-primary');
    }
    redraw();
  }
  if(topCount && topCount > 0) {
    topBtn.onclick = () => handleGroupBtnClick(topBtn, 0, topCount);
  }
  if(secondCount && secondCount > 0) {
    secondBtn.onclick = () => handleGroupBtnClick(secondBtn, topCount, secondCount);
  }
}

function generateDownloadForCity(city, schools, type) {
  let data = '';
  for(let i = schools[0]; i <= schools[1]; i++) {
    if(!s[i]) {
      continue;
    }
    let row = city + ',"' + s[i].n + '",' + type
    for(let j = firstYear; j < firstYear + s[baseSchoolIndex].b.length; j++) {
      row += ',' + (s[i].b[j - firstYear] ? s[i].b[j - firstYear] : '');
      row += ',' + (s[i].m[j - firstYear] ? s[i].m[j - firstYear] : '');
      row += ',' + (s[i].bu[j - firstYear] ? s[i].bu[j - firstYear] : '');
      row += ',' + (s[i].mu[j - firstYear] ? s[i].mu[j - firstYear] : '');
    }
    data += row + '\r\n';
  }
  return data;
}

function generateRow(el) {
  let div = document.createElement('div');
  div.classList.add('row');
  el.appendChild(div);
  return div;
}

function generateRowWithHr(el, hrId) {
  let div = document.createElement('div');
  div.classList.add('row');
  let hr = document.createElement('hr');
  hr.id = hrId;
  div.appendChild(hr);
  el.appendChild(div);
}

function generateRowWithStrong(el, txt) {
  let div = document.createElement('div');
  div.classList.add('row');
  let strong = document.createElement('strong');
  strong.textContent = txt;
  div.appendChild(strong);
  el.appendChild(div);
  return div;
}

function generateRowWithText(el, txt) {
  let div = document.createElement('div');
  div.classList.add('row');
  div.appendChild(document.createTextNode(txt));
  el.appendChild(div);
  return div;
}

function generateCityMenu(pos, name, href) {
  let a = document.createElement('a');
  a.classList.add('button');
  a.href = '#' + href;
  a.textContent = name;
  let g = document.getElementById('g' + pos);
  if(g) { g.appendChild(a); }
}

function generateDownloadCSVHeader() {
  let header = 'Град,Училище,Тип';
  for(let j = firstYear; j < firstYear + s[baseSchoolIndex].b.length; j++) {
    header += ',' + csvHeaderBel + ' ' + (j -2000) + ',' + csvHeaderMat + ' ' + (j -2000);
    header += ',' + csvHeaderBel + '-УЧ. ' + (j -2000) + ',' + csvHeaderMat + '-УЧ. ' + (j -2000);
  }
  header += '\r\n';
  return header;
}

function generateYearNavigation() {
  let fallbackLatestYear = firstYear + s[baseSchoolIndex].b.length - 1;
  let navItems = document.querySelectorAll('.years-nav[data-year-grade]');
  navItems.forEach((el) => {
    let grade = Number.parseInt(el.getAttribute('data-year-grade'), 10);
    if(!Number.isInteger(grade)) {
      el.textContent = '';
      return;
    }
    let configuredLastYear = typeof latestYearByGrade !== 'undefined' ? latestYearByGrade[grade] : null;
    let latestYear = Number.isFinite(configuredLastYear) ? configuredLastYear : fallbackLatestYear;
    let endYear = latestYear - 1;
    if(endYear < NAV_FIRST_YEAR) {
      el.textContent = '';
      return;
    }
    let baseHref = getGradePagePath(grade) + '?year=';
    el.textContent = '';
    el.appendChild(document.createTextNode('('));
    for(let year = endYear; year >= NAV_FIRST_YEAR; year--) {
      if(year < endYear) {
        el.appendChild(document.createTextNode(', '));
      }
      let a = document.createElement('a');
      a.href = baseHref + year;
      a.textContent = year;
      el.appendChild(a);
    }
    el.appendChild(document.createTextNode(')'));
  });
}

function setCsvDownloadLink(link, filename, csvContent) {
  if(!link) {
    return;
  }
  link.setAttribute('download', filename);
  if(window.Blob && window.URL && window.URL.createObjectURL) {
    let oldUrl = link.dataset.csvObjectUrl;
    if(oldUrl) {
      window.URL.revokeObjectURL(oldUrl);
    }
    let blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    let objectUrl = window.URL.createObjectURL(blob);
    link.setAttribute('href', objectUrl);
    link.dataset.csvObjectUrl = objectUrl;
    return;
  }
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
}

function getVisibleRankingTableRows(table) {
  if(!table || !table.tBodies || table.tBodies.length === 0) {
    return [];
  }
  let rows = [];
  let trs = table.tBodies[0].rows;
  for(let i = 0; i < trs.length; i++) {
    if(trs[i].style.display === 'none') {
      continue;
    }
    let cells = [];
    for(let j = 0; j < trs[i].cells.length; j++) {
      cells.push(trs[i].cells[j].textContent.trim());
    }
    rows.push(cells);
  }
  return rows;
}

function getRankingTableHeaders(table) {
  if(!table || !table.tHead || table.tHead.rows.length === 0) {
    return [];
  }
  let headers = [];
  let ths = table.tHead.rows[0].cells;
  for(let i = 0; i < ths.length; i++) {
    headers.push((ths[i].dataset.baseText || ths[i].textContent || '').trim());
  }
  return headers;
}

function setPdfLinkBusyState(link, busy) {
  if(!link) {
    return;
  }
  link.style.pointerEvents = busy ? 'none' : 'auto';
  link.style.opacity = busy ? '0.55' : '1';
}

function getRankingTableElement(tableDiv, cityName) {
  if(!tableDiv) {
    return null;
  }
  if(si[cityName] && si[cityName].n) {
    let rankingBody = document.getElementById('tbl-' + si[cityName].n[0]);
    if(rankingBody) {
      let rankingTable = rankingBody.closest('table');
      if(rankingTable && tableDiv.contains(rankingTable)) {
        return rankingTable;
      }
    }
  }
  let tables = tableDiv.getElementsByTagName('table');
  if(tables.length > 0) {
    return tables[tables.length - 1];
  }
  return null;
}

function convertArrayBufferToBase64(buffer) {
  let bytes = new Uint8Array(buffer);
  let chunkSize = 0x8000;
  let binary = '';
  for(let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return window.btoa(binary);
}

function getPdfFontBase64() {
  if(pdfFontBase64Promise) {
    return pdfFontBase64Promise;
  }
  pdfFontBase64Promise = (async () => {
    let fontUrl = resolveAssetPath('fonts/' + TABLE_PDF_FONT_FILE);
    let response = await fetch(fontUrl);
    if(!response.ok) {
      throw new Error('Font download failed: ' + response.status + ' (' + fontUrl + ')');
    }
    let buffer = await response.arrayBuffer();
    return convertArrayBufferToBase64(buffer);
  })();
  return pdfFontBase64Promise;
}

async function exportRankingTableToPdf(tableKey, cityName, linkEl) {
  let jsPdfNs = window.jspdf;
  if(!jsPdfNs || !jsPdfNs.jsPDF || !jsPdfNs.jsPDF.API || typeof jsPdfNs.jsPDF.API.autoTable !== 'function') {
    return;
  }
  setPdfLinkBusyState(linkEl, true);
  try {
    let tableDiv = document.getElementById('t' + tableKey);
    if(!tableDiv) {
      return;
    }
    if(tableDiv.dataset.tableBuilt !== '1' && rankingTableBuilders[tableKey]) {
      rankingTableBuilders[tableKey]();
    }
    let table = getRankingTableElement(tableDiv, cityName);
    if(!table) {
      return;
    }
    let headers = getRankingTableHeaders(table);
    let bodyRows = getVisibleRankingTableRows(table);
    if(headers.length === 0 || bodyRows.length === 0) {
      return;
    }
    let doc = new jsPdfNs.jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
    let fontBase64 = await getPdfFontBase64();
    doc.addFileToVFS(TABLE_PDF_FONT_FILE, fontBase64);
    doc.addFont(TABLE_PDF_FONT_FILE, TABLE_PDF_FONT_NAME, 'normal');
    doc.setFont(TABLE_PDF_FONT_NAME, 'normal');
    let title = tableTitleName + ' - ' + cityName + ' - ' + tableTitleType;
    doc.setFontSize(12);
    doc.text(title, TABLE_PDF_PAGE_MARGIN_PT, TABLE_PDF_TITLE_Y_PT);
    doc.autoTable({
      head: [headers],
      body: bodyRows,
      startY: TABLE_PDF_TABLE_START_Y_PT,
      margin: { left: TABLE_PDF_PAGE_MARGIN_PT, right: TABLE_PDF_PAGE_MARGIN_PT },
      theme: 'grid',
      styles: {
        font: TABLE_PDF_FONT_NAME,
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        font: TABLE_PDF_FONT_NAME,
        fillColor: [230, 230, 230],
        textColor: 20
      }
    });
    doc.save(exportPrefix + '-ranking-' + tableKey + '.pdf');
  } finally {
    setPdfLinkBusyState(linkEl, false);
  }
}

function createMedianTableHeader(tHead, hasPrivate) {
  if(hasPrivate) {
    let headTrMedian = document.createElement('tr');
    tHead.appendChild(headTrMedian);
    let th = document.createElement('th');
    th.style.borderBottom = 'none';
    th.appendChild(document.createTextNode('\u00A0'));
    headTrMedian.appendChild(th);
    th = document.createElement('th');
    th.style.borderBottom = 'none';
    th.colSpan = 2;
    th.style.textAlign = 'center';
    th.appendChild(document.createTextNode('Държавни'));
    headTrMedian.appendChild(th);
    th = document.createElement('th');
    th.style.borderBottom = 'none';
    th.colSpan = 2;
    th.style.textAlign = 'center';
    th.appendChild(document.createTextNode('Частни'));
    headTrMedian.appendChild(th);
  }
  let headers = hasPrivate
    ? ['Година', csvHeaderBel, csvHeaderMat, csvHeaderBel, csvHeaderMat]
    : ['Година', csvHeaderBel, csvHeaderMat];
  let headTrMedian = document.createElement('tr');
  tHead.appendChild(headTrMedian);
  headers.forEach((header) => {
    let th = document.createElement('th');
    th.style.overflow = 'hidden';
    th.style.whiteSpace = 'nowrap';
    th.appendChild(document.createTextNode(header));
    headTrMedian.appendChild(th);
  });
}

function createMedianTableBody(tBody, name, hasPrivate, pubBelKey, pubMatKey, priBelKey, priMatKey) {
  for(let i = s[baseSchoolIndex].b.length - numYears; i < s[baseSchoolIndex].b.length; i++) {
    let tr = document.createElement('tr');
    tBody.appendChild(tr);
    let td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode(firstYear + i));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name][pubBelKey][i] * 100) / 100).toFixed(2)));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name][pubMatKey][i] * 100) / 100).toFixed(2)));
    if(hasPrivate) {
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name][priBelKey][i] * 100) / 100).toFixed(2)));
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name][priMatKey][i] * 100) / 100).toFixed(2)));
    }
  }
}

function generateCityMedianTables(el, name) {
  let medianMenu = generateRow(el);
  medianMenu.style.display = 'flex';
  medianMenu.style.alignItems = 'center';
  medianMenu.style.justifyContent = 'center';
  let medianTextSchools = document.createElement('span');
  medianTextSchools.textContent = 'Училища';
  medianTextSchools.id = 'medianTextSchools'+ si[name].n[0];
  medianTextSchools.style.display = 'block';
  medianMenu.appendChild(medianTextSchools);
  let aSchools = document.createElement('a');
  medianMenu.appendChild(aSchools);
  aSchools.id = 'medianMenuSchools' + si[name].n[0];
  aSchools.style.display = 'none';
  aSchools.style.cursor = 'pointer';
  aSchools.appendChild(document.createTextNode('Училища'));
  aSchools.onclick = () => {
    tableMedianSchools.style.display = 'block';
    tableMedianAttendees.style.display = 'none';
    aSchools.style.display = 'none';
    medianTextSchools.style.display = 'block';
    aAttendees.style.display = 'block';
    medianTextAttendees.style.display = 'none';
  }
  medianMenu.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  let medianTextAttendees = document.createElement('span');
  medianTextAttendees.textContent = 'Ученици';
  medianTextAttendees.id = 'medianTextAttendees'+ si[name].n[0];
  medianTextAttendees.style.display = 'none';
  medianMenu.appendChild(medianTextAttendees);
  let aAttendees = document.createElement('a');
  medianMenu.appendChild(aAttendees);
  aAttendees.id = 'medianMenuAttendees' + si[name].n[0];
  aAttendees.style.cursor = 'pointer';
  aAttendees.style.display = 'block';
  aAttendees.appendChild(document.createTextNode('Ученици'));
  aAttendees.onclick = () => {
    tableMedianSchools.style.display = 'none';
    tableMedianAttendees.style.display = 'block';
    aSchools.style.display = 'block';
    medianTextSchools.style.display = 'none';
    aAttendees.style.display = 'none';
    medianTextAttendees.style.display = 'block';
  }
  generateRowWithText(el, '\u00A0');
  let titleDiv = generateRowWithStrong(el, 'Средни резултати' + ' - ' + name + ' - ' + tableTitleType);
  titleDiv.style.textAlign = 'center';
  generateRowWithText(el, '\u00A0');
  let tableMedianDiv = document.createElement('div');
  tableMedianDiv.style.display = 'flex';
  tableMedianDiv.style.alignItems = 'center';
  tableMedianDiv.style.justifyContent = 'center';
  let tableMedianSchools = document.createElement('table');
  tableMedianDiv.appendChild(tableMedianSchools);
  tableMedianSchools.id = 'tableMedianSchools' + si[name].n[0];
  tableMedianSchools.style.display = 'block';
  let tHeadMedian = document.createElement('thead');
  tableMedianSchools.appendChild(tHeadMedian);
  createMedianTableHeader(tHeadMedian, !!si[name].mpbs);
  let tBodyMedian = document.createElement('tbody');
  tableMedianSchools.appendChild(tBodyMedian);
  createMedianTableBody(tBodyMedian, name, !!si[name].mpbs, 'mnbs', 'mnms', 'mpbs', 'mpms');
  el.appendChild(tableMedianDiv);
  let tableMedianAttendees = document.createElement('table');
  tableMedianAttendees.id = 'tableMedianAttendees' + si[name].n[0];
  tableMedianAttendees.style.display = 'none';
  tHeadMedian = document.createElement('thead');
  tableMedianAttendees.appendChild(tHeadMedian);
  createMedianTableHeader(tHeadMedian, !!si[name].mpba);
  tBodyMedian = document.createElement('tbody');
  tableMedianAttendees.appendChild(tBodyMedian);
  createMedianTableBody(tBodyMedian, name, !!si[name].mpbs, 'mnba', 'mnma', 'mpba', 'mpma');
  tableMedianDiv.appendChild(tableMedianAttendees);
}

function calculateAdjustedRankData(rank, topRank) {
  let adjustedRank = normalizeRankValue(safeDivide(rank * 100, topRank, 0));
  let redHex = '00';
  let greenHex = '00';
  let blueHex = '30';
  if(adjustedRank >= (100 - rankRangeTop)) {
    let red = Math.floor(255 - ((adjustedRank - (100 - rankRangeTop)) * 255) / rankRangeTop);
    redHex = red.toString(16).padStart(2, '0');
    greenHex = 'ff';
  } else if(adjustedRank < (100 - rankRangeTop) && adjustedRank >= rankRangeBottom) {
    let green = Math.floor(127 + ((adjustedRank - rankRangeBottom) * 127) / (100 - rankRangeTop - rankRangeBottom));
    redHex = 'ff';
    greenHex = green.toString(16).padStart(2, '0');
  } else {
    let green = Math.floor((adjustedRank * 127) / rankRangeBottom);
    let red = Math.floor(191 + green / 2);
    redHex = red.toString(16).padStart(2, '0');
    greenHex = green.toString(16).padStart(2, '0');
  }
  return { adjustedRank, redHex, greenHex, blueHex };
}

function normalizeRankValue(value) {
  if(!Number.isFinite(value)) {
    return 0;
  }
  let clamped = Math.min(100, Math.max(0, value));
  return Math.round((clamped + Number.EPSILON) * 100) / 100;
}

function formatRankValue(value) {
  if(!Number.isFinite(value)) {
    return '';
  }
  if(Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function calculateTopRanks(schools, hasPrivate) {
  let topRankAll = (s[schools[0].i].mb + s[schools[0].i].mm - rankBase * 2) / 2;
  let topRankPu = null;
  let topRankPr = null;
  if(hasPrivate) {
    for(let i = 0; i < schools.length; i++) {
      if(schools[i].t === 'Д') {
        topRankPu = (s[schools[i].i].mb + s[schools[i].i].mm - rankBase * 2) / 2;
        break;
      }
    }
    for(let i = 0; i < schools.length; i++) {
      if(schools[i].t === 'Ч') {
        topRankPr = (s[schools[i].i].mb + s[schools[i].i].mm - rankBase * 2) / 2;
        break;
      }
    }
  }
  return { topRankAll, topRankPu, topRankPr };
}

function generateTableFilterMenu(div, name, fn) {
  let menuTitleDiv = generateRow(div);
  menuTitleDiv.style.display = 'flex';
  menuTitleDiv.style.alignItems = 'center';
  menuTitleDiv.style.justifyContent = 'center';
  let aAll = document.createElement('a');
  aAll.id = 'menu-all-a-' + si[name].n[0];
  aAll.style.display = 'none';
  aAll.style.cursor = 'pointer';
  aAll.appendChild(document.createTextNode('Всички'));
  aAll.onclick = () => {
    aAll.style.display = 'none';
    txtAll.style.display = 'block';
    aPu.style.display = 'block';
    txtPu.style.display = 'none';
    aPr.style.display = 'block';
    txtPr.style.display = 'none';
    fn(null);
  }
  menuTitleDiv.appendChild(aAll);
  let txtAll = document.createElement('span');
  txtAll.textContent = 'Всички';
  txtAll.id = 'menu-all-txt-' + si[name].n[0];
  txtAll.style.display = 'block';
  menuTitleDiv.appendChild(txtAll);
  let aPu = document.createElement('a');
  aPu.id = 'menu-pu-a-' + si[name].n[0];
  aPu.style.display = 'block';
  aPu.style.cursor = 'pointer';
  aPu.appendChild(document.createTextNode('Държавни'));
  aPu.onclick = () => {
    aAll.style.display = 'block';
    txtAll.style.display = 'none';
    aPu.style.display = 'none';
    txtPu.style.display = 'block';
    aPr.style.display = 'block';
    txtPr.style.display = 'none';
    fn('Д');
  }
  menuTitleDiv.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  menuTitleDiv.appendChild(aPu);
  let txtPu = document.createElement('span');
  txtPu.textContent = 'Държавни';
  txtPu.id = 'menu-pu-txt-' + si[name].n[0];
  txtPu.style.display = 'none';
  menuTitleDiv.appendChild(txtPu);
  let aPr = document.createElement('a');
  aPr.id = 'menu-pr-a-' + si[name].n[0];
  aPr.style.display = 'block';
  aPr.style.cursor = 'pointer';
  aPr.appendChild(document.createTextNode('Частни'));
  aPr.onclick = () => {
    aAll.style.display = 'block';
    txtAll.style.display = 'none';
    aPu.style.display = 'block';
    txtPu.style.display = 'none';
    aPr.style.display = 'none';
    txtPr.style.display = 'block';
    fn('Ч');
  }
  menuTitleDiv.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  menuTitleDiv.appendChild(aPr);
  let txtPr = document.createElement('span');
  txtPr.textContent = 'Частни';
  txtPr.id = 'menu-pr-txt-' + si[name].n[0];
  txtPr.style.display = 'none';
  menuTitleDiv.appendChild(txtPr);
}

function getRankValueForFilter(td, filterLabel) {
  if(!td) {
    return Number.NEGATIVE_INFINITY;
  }
  let value = null;
  if(filterLabel === 'Д') {
    value = td.rankPu;
  } else if(filterLabel === 'Ч') {
    value = td.rankPr;
  } else {
    value = td.rankAll;
  }
  let parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function updateRankCellForFilter(td, filterLabel) {
  if(!td) {
    return;
  }
  if(filterLabel === 'Д') {
    td.style.backgroundColor = td.bgPu;
    td.textContent = formatRankValue(td.rankPu);
  } else if(filterLabel === 'Ч') {
    td.style.backgroundColor = td.bgPr;
    td.textContent = formatRankValue(td.rankPr);
  } else {
    td.style.backgroundColor = td.bgAll;
    td.textContent = formatRankValue(td.rankAll);
  }
}

function getYearCellSortValue(td) {
  if(!td) {
    return { hasValue: false, value: 0 };
  }
  let text = td.textContent.trim();
  if(!text) {
    return { hasValue: false, value: 0 };
  }
  let match = text.match(/-?\d+(?:[.,]\d+)?/);
  if(!match) {
    return { hasValue: false, value: 0 };
  }
  let parsed = Number.parseFloat(match[0].replace(',', '.'));
  if(!Number.isFinite(parsed)) {
    return { hasValue: false, value: 0 };
  }
  return { hasValue: true, value: parsed };
}

function compareRowsByColumn(tds1, tds2, sortColumn, sortDirection, filterLabel) {
  let cmp = 0;
  if(sortColumn === 1) {
    let n1 = tds1[1] ? tds1[1].textContent.trim() : '';
    let n2 = tds2[1] ? tds2[1].textContent.trim() : '';
    let m1 = n1.match(/^\s*(\d+)/);
    let m2 = n2.match(/^\s*(\d+)/);
    if(m1 && m2) {
      let c1 = Number.parseInt(m1[1], 10);
      let c2 = Number.parseInt(m2[1], 10);
      cmp = c1 - c2;
      if(cmp === 0) {
        cmp = n1.localeCompare(n2, 'bg');
      }
    } else {
      cmp = n1.localeCompare(n2, 'bg');
    }
  } else if(sortColumn === 2) {
    let m1 = tds1[2] ? tds1[2].textContent.match(/^(\S+)\s*\/\s*(\d+)/) : null;
    let m2 = tds2[2] ? tds2[2].textContent.match(/^(\S+)\s*\/\s*(\d+)/) : null;
    let typeOrder = {'Д': 0, 'Ч': 1};
    let t1 = m1 && m1[1] ? (typeOrder[m1[1]] !== undefined ? typeOrder[m1[1]] : 2) : 2;
    let t2 = m2 && m2[1] ? (typeOrder[m2[1]] !== undefined ? typeOrder[m2[1]] : 2) : 2;
    cmp = t1 - t2;
    if(cmp === 0) {
      let ord1 = m1 ? Number.parseInt(m1[2], 10) : Number.MAX_SAFE_INTEGER;
      let ord2 = m2 ? Number.parseInt(m2[2], 10) : Number.MAX_SAFE_INTEGER;
      cmp = ord1 - ord2;
    }
  } else if(sortColumn === 3) {
    let r1v = getRankValueForFilter(tds1[3], filterLabel);
    let r2v = getRankValueForFilter(tds2[3], filterLabel);
    cmp = r1v - r2v;
  } else {
    let y1 = getYearCellSortValue(tds1[sortColumn]);
    let y2 = getYearCellSortValue(tds2[sortColumn]);
    if(!y1.hasValue && !y2.hasValue) {
      let r1v = getRankValueForFilter(tds1[3], filterLabel);
      let r2v = getRankValueForFilter(tds2[3], filterLabel);
      if(r1v !== r2v) {
        let rankCmp = r1v - r2v;
        return sortDirection === 'asc' ? rankCmp : -rankCmp;
      }
      let n1 = tds1[1] ? tds1[1].textContent.trim() : '';
      let n2 = tds2[1] ? tds2[1].textContent.trim() : '';
      return n1.localeCompare(n2, 'bg');
    } else if(!y1.hasValue) {
      return 1;
    } else if(!y2.hasValue) {
      return -1;
    } else {
      cmp = y1.value - y2.value;
    }
  }
  if(cmp === 0) {
    let n1 = tds1[1] ? tds1[1].textContent.trim() : '';
    let n2 = tds2[1] ? tds2[1].textContent.trim() : '';
    cmp = n1.localeCompare(n2, 'bg');
  }
  return sortDirection === 'asc' ? cmp : -cmp;
}

function renumberVisibleRows(tBody) {
  let rows = tBody.getElementsByTagName('tr');
  let counter = 0;
  for(let i = 0; i < rows.length; i++) {
    if(rows[i].style.display === 'none') {
      continue;
    }
    let tds = rows[i].getElementsByTagName('td');
    if(tds[0]) {
      tds[0].textContent = ++counter;
    }
  }
}

function updateNoDataSeparator(tBody, state) {
  let rows = tBody.getElementsByTagName('tr');
  for(let i = 0; i < rows.length; i++) {
    let tds = rows[i].getElementsByTagName('td');
    for(let j = 0; j < tds.length; j++) {
      tds[j].style.borderTop = '';
    }
  }
  if(state.sortColumn <= 3) {
    return;
  }
  for(let i = 0; i < rows.length; i++) {
    if(rows[i].style.display === 'none') {
      continue;
    }
    let tds = rows[i].getElementsByTagName('td');
    let yearCell = tds[state.sortColumn];
    let yearValue = getYearCellSortValue(yearCell);
    if(!yearValue.hasValue) {
      for(let j = 0; j < tds.length; j++) {
        tds[j].style.borderTop = '3px solid #555';
      }
      return;
    }
  }
}

function updateSortHeaders(table, sortColumn, sortDirection) {
  let ths = table.querySelectorAll('thead th');
  for(let i = 0; i < ths.length; i++) {
    let th = ths[i];
    if(th.dataset.sortable !== '1') {
      continue;
    }
    let baseText = th.dataset.baseText || th.textContent;
    if(i === sortColumn) {
      th.textContent = baseText + (sortDirection === 'asc' ? ' ▲' : ' ▼');
    } else {
      th.textContent = baseText;
    }
  }
}

function applyRankingTableState(table, tBody, state) {
  let rows = Array.from(tBody.getElementsByTagName('tr'))
    .map(row => ({ row, tds: row.getElementsByTagName('td') }));
  rows.sort((a, b) => compareRowsByColumn(a.tds, b.tds, state.sortColumn, state.sortDirection, state.filterLabel));
  rows.forEach(({ row, tds }) => {
    let visible = !state.filterLabel || (tds[2] && tds[2].textContent.startsWith(state.filterLabel));
    row.style.display = visible ? 'table-row' : 'none';
    updateRankCellForFilter(tds[3], state.filterLabel);
    tBody.appendChild(row);
  });
  renumberVisibleRows(tBody);
  updateNoDataSeparator(tBody, state);
  updateSortHeaders(table, state.sortColumn, state.sortDirection);
}

function enableRankingTableSorting(table, tBody, state) {
  let ths = table.querySelectorAll('thead th');
  for(let i = 0; i < ths.length; i++) {
    let th = ths[i];
    th.dataset.baseText = th.textContent;
    if(i === 0) {
      continue;
    }
    th.dataset.sortable = '1';
    th.style.cursor = 'pointer';
    th.onclick = () => {
      if(state.sortColumn === i) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = i;
        state.sortDirection = (i === 1 || i === 2) ? 'asc' : 'desc';
      }
      applyRankingTableState(table, tBody, state);
    };
  }
}

function buildRankingTable(div, name, puSchools, prSchools, rankingState) {
  if(div.dataset.tableBuilt === '1') {
    return;
  }
  let table = document.createElement('table');
  table.style.marginLeft = 'auto';
  table.style.marginRight = 'auto';
  let tHead = document.createElement('thead');
  table.appendChild(tHead);
  let headTr = document.createElement('tr');
  tHead.appendChild(headTr);
  let headers = ['№', 'Училище', 'Тип / №', 'Ранг'];
  for(let i = 0; i < 3; i++) {
    headers.push((firstYear - 2001 + s[baseSchoolIndex].b.length - i) + ' ' + csvHeaderB + ' / уч.');
    headers.push((firstYear - 2001 + s[baseSchoolIndex].b.length - i) + ' ' + csvHeaderM + ' / уч.');
  }
  headers.push('Доклад');
  headers.forEach((header) => {
    let th = document.createElement('th');
    th.appendChild(document.createTextNode(header));
    th.style.overflow = 'hidden';
    th.style.whiteSpace = 'nowrap';
    headTr.appendChild(th);
  });
  let tBody = document.createElement('tbody');
  tBody.id = 'tbl-' + si[name].n[0];
  table.appendChild(tBody);
  let schools = [];
  for(let i = puSchools[0]; i <= puSchools[1]; i++) {
    if(!s[i] || s[i].b[s[i].b.length - 1] === null) { continue; }
    schools.push({i: i, t: 'Д'});
  }
  if(prSchools) {
    for(let i = prSchools[0]; i <= prSchools[1]; i++) {
      if(!s[i] || s[i].b[s[i].b.length - 1] === null) { continue; }
      schools.push({i: i, t: 'Ч'});
    }
  }
  let sortFunc = (o1, o2) => (s[o1.i].mb + s[o1.i].mm) / 2 < (s[o2.i].mb + s[o2.i].mm) / 2 ? 1 : -1;
  schools.sort(sortFunc);
  const { topRankAll, topRankPu, topRankPr } = calculateTopRanks(schools, !!prSchools);
  let counter = 0;
  let counterPu = 0;
  let counterPr = 0;
  let topRankDone = false;
  schools.forEach((o) => {
    let tr = document.createElement('tr');
    tBody.appendChild(tr);
    let td = document.createElement('td');
    td.appendChild(document.createTextNode(++counter));
    tr.appendChild(td);
    td = document.createElement('td');
    if(s[o.i].w) {
      let a = document.createElement('a');
      a.appendChild(document.createTextNode(s[o.i].l));
      a.href = s[o.i].w;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      td.appendChild(a);
    } else {
      td.appendChild(document.createTextNode(s[o.i].l));
    }
    td.title = s[o.i].n;
    tr.appendChild(td);
    td = document.createElement('td');
    td.appendChild(document.createTextNode(o.t + ' / ' + (o.t === 'Д' ? ++counterPu : ++counterPr)));
    tr.appendChild(td);
    td = document.createElement('td');
    if(!topRankDone) {
      td.appendChild(document.createTextNode('100'));
      td.title = 'Среден резултат = ' + (topRankAll + rankBase).toFixed(2);
      td.bgAll = '#00ff30';
      td.rankAll = 100;
      td.rankPu = o.t === 'Д' ? 100 : null;
      td.rankPr = o.t === 'Ч' ? 100 : null;
      td.bgPu = o.t === 'Д' ? '#00ff30': 'none';
      td.bgPr = o.t === 'Ч' ? '#00ff30': 'none';
      td.style.backgroundColor = td.bgAll;
      topRankDone = true;
    } else {
      let rank = (s[o.i].mb + s[o.i].mm - rankBase * 2) / 2;
      td.title = 'Среден резултат = ' + (rank + rankBase).toFixed(2);
      let ardAll = calculateAdjustedRankData(rank, topRankAll);
      td.bgAll = '#' + ardAll.redHex + ardAll.greenHex + ardAll.blueHex;
      td.rankAll = normalizeRankValue(ardAll.adjustedRank);
      let ardPu = calculateAdjustedRankData(rank, topRankPu);
      td.bgPu = '#' + ardPu.redHex + ardPu.greenHex + ardPu.blueHex;
      td.rankPu = normalizeRankValue(ardPu.adjustedRank);
      if(topRankPr) {
        let ardPr = calculateAdjustedRankData(rank, topRankPr);
        td.bgPr = '#' + ardPr.redHex + ardPr.greenHex + ardPr.blueHex;
        td.rankPr = normalizeRankValue(ardPr.adjustedRank);
      } else {
        td.bgPr = 'none';
        td.rankPr = null;
      }
      td.style.backgroundColor = td.bgAll;
      td.textContent = formatRankValue(td.rankAll);
    }
    tr.appendChild(td);
    let totalYears = s[o.i].b.length;
    for(let j = 0; j < 3; j++) {
      td = document.createElement('td');
      td.style.overflow = 'hidden';
      td.style.whiteSpace = 'nowrap';
      td.appendChild(document.createTextNode(s[o.i].b[totalYears - j - 1] ? s[o.i].b[totalYears - j - 1] + ' / ' + s[o.i].bu[totalYears - j - 1] : ''));
      tr.appendChild(td);
      td = document.createElement('td');
      td.style.overflow = 'hidden';
      td.style.whiteSpace = 'nowrap';
      td.appendChild(document.createTextNode(s[o.i].m[totalYears - j - 1] ? s[o.i].m[totalYears - j - 1] + ' / ' + s[o.i].mu[totalYears - j - 1] : ''));
      tr.appendChild(td);
    }
    td = document.createElement('td');
    let pdfLink = document.createElement('a');
    pdfLink.href = '#';
    pdfLink.className = 'school-report-link';
    pdfLink.title = 'PDF доклад за ' + s[o.i].n;
    pdfLink.appendChild(document.createTextNode('PDF'));
    let schoolIdx = o.i;
    pdfLink.onclick = async (e) => {
      e.preventDefault();
      try {
        await generateSchoolReportPdf(schoolIdx, e.currentTarget);
      } catch(err) {
        console.error(err);
        alert('Грешка при генериране на PDF доклад. Моля опитайте отново.');
      }
    };
    td.appendChild(pdfLink);
    tr.appendChild(td);
  });
  div.appendChild(table);
  enableRankingTableSorting(table, tBody, rankingState);
  applyRankingTableState(table, tBody, rankingState);
  div.dataset.tableBuilt = '1';
}

function generateHTMLTable(el, hrName, puSchools, prSchools, name) {
  let div = document.createElement('div');
  let rankingState = { sortColumn: 3, sortDirection: 'desc', filterLabel: null };
  if(prSchools) {
    let fn = (lbl) => {
      rankingState.filterLabel = lbl;
      let tBody = document.getElementById('tbl-' + si[name].n[0]);
      if(!tBody) { return; }
      let table = tBody.closest('table');
      if(!table) {
        return;
      }
      applyRankingTableState(table, tBody, rankingState);
    }
    generateRowWithText(div, '\u00A0');
    generateTableFilterMenu(div, name, fn);
  }
  generateRowWithText(div, '\u00A0');
  let titleDiv = generateRowWithStrong(div, tableTitleName + ' - ' + name + ' - ' + tableTitleType);
  titleDiv.style.textAlign = 'center';
  generateRowWithText(div, '\u00A0');
  div.classList.add('row');
  div.id = 't' + hrName;
  div.style.display = 'none';
  rankingTableBuilders[hrName] = () => {
    buildRankingTable(div, name, puSchools, prSchools, rankingState);
    generateRowWithText(div, '\u00A0');
    generateCityMedianTables(div, name);
  }
  el.appendChild(div);
}

function generateDownloadCSVLink(el, tableKey, cityName, data) {
  let span = document.createElement('span');
  span.classList.add('u-pull-right');
  el.appendChild(span);
  let header = generateDownloadCSVHeader();
  let a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('Класация'));
  a.onclick = (e) => {
    let tableDiv = document.getElementById('t' + tableKey);
    if(!tableDiv) { return; }
    if(tableDiv.style.display === 'none') {
      if(rankingTableBuilders[tableKey]) {
        rankingTableBuilders[tableKey]();
      }
      tableDiv.style.display = 'block';
      e.currentTarget.innerText = 'Затвори'
    } else {
      tableDiv.style.display = 'none';
      e.currentTarget.innerText = 'Класация'
    }
  }
  span.appendChild(a);
  span.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('CSV'));
  setCsvDownloadLink(a, exportPrefix + '-data-' + tableKey + '.csv', header + data);
  span.appendChild(a);
  span.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.href = '#';
  a.appendChild(document.createTextNode('PDF'));
  a.onclick = async (e) => {
    e.preventDefault();
    try {
      await exportRankingTableToPdf(tableKey, cityName, e.currentTarget);
    } catch(err) {
      // Keep UI responsive and surface a clear message instead of an unhandled rejection.
      console.error(err);
      alert('Грешка при генериране на PDF. Моля опитайте отново.');
    }
  };
  span.appendChild(a);
}

function generateCityData(name) {
  let schoolGroups = getCitySchoolGroups(name);
  if(!schoolGroups) {
    return '';
  }
  let puSchools = schoolGroups.puSchools;
  let prSchools = schoolGroups.prSchools;
  if(!hasRenderableCitySchools(puSchools, prSchools)) {
    return '';
  }
  let data = generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
    data += generateDownloadForCity(name, prSchools, 'Ч');
  }
  return data;
}

function createCityPlaceholder(hrName) {
  let schoolsDiv = document.getElementById('schools');
  if(!schoolsDiv) {
    return;
  }
  let placeholder = document.createElement('div');
  placeholder.classList.add('row');
  placeholder.id = 'ph-' + hrName;
  placeholder.dataset.hrName = hrName;
  schoolsDiv.appendChild(placeholder);
}

function renderLazyCitySection(entry) {
  if(!entry || entry.rendered) {
    return;
  }
  let placeholder = document.getElementById('ph-' + entry.hrName);
  generateCitySection(entry.name, entry.hrName, entry.btName, entry.btPos, true, entry.data, placeholder);
  if(placeholder) {
    placeholder.remove();
  }
  entry.rendered = true;
  let changed = applyPendingSelectedButtons();
  if(changed && chartBelInstance && chartMatInstance) {
    redraw();
  }
}

function initLazyCitySections(entries) {
  if(!entries || entries.length === 0) {
    return;
  }
  let byHrName = {};
  entries.forEach((entry) => {
    byHrName[entry.hrName] = entry;
  });
  let scrollToAnchor = (hrName) => {
    let anchor = document.getElementById(hrName);
    if(anchor) {
      anchor.scrollIntoView();
    }
  };
  let renderByHash = () => {
    let hrName = window.location.hash.replace('#', '');
    if(hrName && byHrName[hrName]) {
      let targetIndex = entries.findIndex((entry) => entry.hrName === hrName);
      if(targetIndex < 0) {
        return;
      }
      for(let i = 0; i <= targetIndex; i++) {
        renderLazyCitySection(entries[i]);
      }
      requestAnimationFrame(() => scrollToAnchor(hrName));
    }
  };
  renderByHash();
  window.addEventListener('hashchange', renderByHash);
  if(typeof window.IntersectionObserver !== 'function') {
    entries.forEach((entry) => renderLazyCitySection(entry));
    return;
  }
  let observer = new window.IntersectionObserver((rows) => {
    rows.forEach((row) => {
      if(!row.isIntersecting) {
        return;
      }
      let hrName = row.target.dataset.hrName;
      if(!hrName || !byHrName[hrName]) {
        return;
      }
      renderLazyCitySection(byHrName[hrName]);
      observer.unobserve(row.target);
    });
  }, { rootMargin: '400px 0px' });
  entries.forEach((entry) => {
    let placeholder = document.getElementById('ph-' + entry.hrName);
    if(placeholder) {
      observer.observe(placeholder);
    }
  });
}

function generateCitySection(name, hrName, btName, btPos, skipMenu, precomputedData, mountBeforeNode) {
  let schoolGroups = getCitySchoolGroups(name);
  if(!schoolGroups) {
    return '';
  }
  let puSchools = schoolGroups.puSchools;
  let prSchools = schoolGroups.prSchools;
  if(!precomputedData && !hasRenderableCitySchools(puSchools, prSchools)) {
    return '';
  }
  const { topCount: topPuCount, secondCount: secondPuCount } = getSchoolCounts(puSchools);
  if(!skipMenu) {
    generateCityMenu(btPos, btName, hrName);
  }
  let schoolsDivFragment = document.createDocumentFragment();
  generateRowWithHr(schoolsDivFragment, hrName);
  let cityDiv = generateRowWithStrong(schoolsDivFragment, name);
  generateHTMLTable(schoolsDivFragment, hrName, puSchools, prSchools, name);
  generateRowWithText(schoolsDivFragment, '\u00A0');
  generateRowWithText(schoolsDivFragment, 'Държавни училища');
  generateRowWithText(schoolsDivFragment, '\u00A0');
  let puDiv = generateRow(schoolsDivFragment);
  generateSchoolButtons(puDiv, puSchools, topPuCount, secondPuCount);
  let data = precomputedData ? precomputedData : generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
    const { topCount: topPrCount, secondCount: secondPrCount } = getSchoolCounts(prSchools);
    generateRowWithText(schoolsDivFragment, '\u00A0');
    generateRowWithText(schoolsDivFragment, 'Частни училища');
    generateRowWithText(schoolsDivFragment, '\u00A0');
    let prDiv = generateRow(schoolsDivFragment);
    generateSchoolButtons(prDiv, prSchools, topPrCount, secondPrCount);
    if(!precomputedData) {
      data += generateDownloadForCity(name, prSchools, 'Ч');
    }
  }
  generateDownloadCSVLink(cityDiv, hrName, name, data);
  let schoolsDiv = document.getElementById('schools');
  if(schoolsDiv) {
    if(mountBeforeNode && mountBeforeNode.parentNode === schoolsDiv) {
      schoolsDiv.insertBefore(schoolsDivFragment, mountBeforeNode);
    } else {
      schoolsDiv.appendChild(schoolsDivFragment);
    }
  }
  return data;
}

function fixForYear2018() {
  if(!fix2018) {
    return;
  }
  let i = 2018 - firstYear;
  if(i < 0) {
    return;
  }
  s.forEach((o) => {
    if(o.b[i] !== null) {
      o.b[i] = Math.floor(o.b[i] * 10000 / 65 + Number.EPSILON) / 100;
    }
    if(o.m[i] !== null) {
      o.m[i] = Math.floor(o.m[i] * 10000 / 65 + Number.EPSILON) / 100;
    }
  });  
}

function fixForMissingYears() {
  s.forEach((o) => {
    for(let i = o.b.length; i < s[baseSchoolIndex].b.length; i++) {
      o.b.push(null);
      o.m.push(null);
    }
    for(let i = o.bu.length; i < s[baseSchoolIndex].b.length; i++) {
      o.bu.push(0);
      o.mu.push(0);
    }
  });
}

function calculateSchoolMedians() {
  s.forEach((o) => {
    let mb = 0;
    let mm = 0;
    let numYears = 3;
    let dividerB = numYears;
    let dividerM = numYears;
    for(let i = 1; i <= numYears; i++) {
      if(!o.b[o.b.length - i]) {
        --dividerB;
      } else {
        mb += o.b[o.b.length - i];
      }
      if(!o.m[o.m.length - i]) {
        --dividerM;
      } else {
        mm += o.m[o.m.length - i];
      }
    }
    o.mb = dividerB > 0 ? mb / dividerB : 0;
    o.mm = dividerM > 0 ? mm / dividerM : 0;
  });
}

function calculateCityMediansBySchool() {
  Object.keys(si).forEach((o) => {
    si[o].mnbs = [];
    si[o].mnms = [];
    si[o].mpbs = null;
    si[o].mpms = null;
    for(let i = 0; i < s[baseSchoolIndex].b.length; i++) {
      let sumNB = 0;
      let nullNB = 0;
      let sumNM = 0;
      let nullNM = 0;
      for(let j = si[o].n[0]; j <= si[o].n[1]; j++) {
        if(s[j].b[i]) {
          sumNB += s[j].b[i];
        } else {
          ++nullNB;
        }
        if(s[j].m[i]) {
          sumNM += s[j].m[i];
        } else {
          ++nullNM;
        }
      }
      si[o].mnbs[i] = safeDivide(sumNB, si[o].n[1] - si[o].n[0] + 1 - nullNB, 0);
      si[o].mnms[i] = safeDivide(sumNM, si[o].n[1] - si[o].n[0] + 1 - nullNM, 0);
    }
    if(si[o].p) {
      si[o].mpbs = [];
      si[o].mpms = [];
      for(let i = 0; i < s[baseSchoolIndex].m.length; i++) {
        let sumPB = 0;
        let nullPB = 0;
        let sumPM = 0;
        let nullPM = 0;
        for(let j = si[o].p[0]; j <= si[o].p[1]; j++) {
          if(s[j].b[i]) {
            sumPB += s[j].b[i];
          } else {
            ++nullPB;
          }
          if(s[j].m[i]) {
            sumPM += s[j].m[i];
          } else {
            ++nullPM;
          }
        }
        si[o].mpbs[i] = safeDivide(sumPB, si[o].p[1] - si[o].p[0] + 1 - nullPB, 0);
        si[o].mpms[i] = safeDivide(sumPM, si[o].p[1] - si[o].p[0] + 1 - nullPM, 0);
      }
    }
  });
}

function calculateCityMediansByAttendees() {
  Object.keys(si).forEach((o) => {
    si[o].mnba = [];
    si[o].mnma = [];
    si[o].mpba = null;
    si[o].mpma = null;
    for(let i = 0; i < s[baseSchoolIndex].b.length; i++) {
      let sumNB = 0;
      let attendeesNB = 0;
      let sumNM = 0;
      let attendeesNM = 0;
      for(let j = si[o].n[0]; j <= si[o].n[1]; j++) {
        if(s[j].b[i]) {
          sumNB += s[j].b[i] * s[j].bu[i];
          attendeesNB += s[j].bu[i];
        }
        if(s[j].m[i]) {
          sumNM += s[j].m[i] * s[j].mu[i];
          attendeesNM += s[j].mu[i];
        }
      }
      si[o].mnba[i] = safeDivide(sumNB, attendeesNB, 0);
      si[o].mnma[i] = safeDivide(sumNM, attendeesNM, 0);
    }
    if(si[o].p) {
      si[o].mpba = [];
      si[o].mpma = [];
      for(let i = 0; i < s[baseSchoolIndex].m.length; i++) {
        let sumPB = 0;
        let attendeesPB = 0;
        let sumPM = 0;
        let attendeesPM = 0;
        for(let j = si[o].p[0]; j <= si[o].p[1]; j++) {
          if(s[j].b[i]) {
            sumPB += s[j].b[i] * s[j].bu[i];
            attendeesPB += s[j].bu[i];
          }
          if(s[j].m[i]) {
            sumPM += s[j].m[i] * s[j].mu[i];
            attendeesPM += s[j].mu[i];
          }
        }
        si[o].mpba[i] = safeDivide(sumPB, attendeesPB, 0);
        si[o].mpma[i] = safeDivide(sumPM, attendeesPM, 0);
        }
    }
  });
}

function setDefaultClickedButtons() {
  let indices = getDefaultClickedButtonIds();
  pendingSelectedButtonIds = new Set();
  indices.forEach((id) => {
    if(button(id)) {
      setButtonState(id, true);
    } else {
      pendingSelectedButtonIds.add(id);
    }
  });
  applyPendingSelectedButtons();
}

function enableFixedButtons() {
  let divFixedButtons = document.getElementById('divFixedButtons');
  if(divFixedButtons) {
    divFixedButtons.style.display = 'flex';
    divFixedButtons.style.flexWrap = 'wrap';
  }
  let btnClear = document.getElementById('btnClear');
  if(btnClear) {
    btnClear.style.display = 'block';
    btnClear.onclick = () => {
      [...selectedSchoolIndices].forEach((i) => setButtonState(i, false));
      pendingSelectedButtonIds = null;
      let mBtns = document.getElementsByClassName('mbtn');
      for(let mBtn of mBtns) {
        mBtn.classList.remove('button-primary');
      }
      redraw();
    };
  }
  let btnTop = document.getElementById('btnTop');
  if(btnTop) {
    btnTop.style.display = 'block';
    let hrCharts = document.getElementById('hrCharts');
    btnTop.onclick = () => { if(hrCharts) { hrCharts.scrollIntoView(); } };
  }
}


function generateCitySections() {
  let data = '';
  let lazyEntries = [];
  let cities = getRenderableCitiesFromData();
  let selectedIndices = getDefaultClickedButtonIds()
    .map((i) => Number.parseInt(i, 10))
    .filter((i) => Number.isInteger(i));
  cities.forEach((city) => {
    data += city.data;
    generateCityMenu(city.btPos, city.btName, city.hrName);
    createCityPlaceholder(city.hrName);
    lazyEntries.push({
      name: city.name,
      hrName: city.hrName,
      btName: city.btName,
      btPos: city.btPos,
      data: city.data,
      rendered: false
    });
  });
  let header = generateDownloadCSVHeader();
  let a = document.getElementById('csvAll');
  if(a) {
    setCsvDownloadLink(a, exportPrefix + '-data-all.csv', header + data);
  }
  if(lazyEntries.length > 0) {
    renderLazyCitySection(lazyEntries[0]);
    lazyEntries.forEach((entry) => {
      if(entry.rendered) {
        return;
      }
      if(selectedIndices.some((i) => cityContainsSchoolIndex(entry.name, i))) {
        renderLazyCitySection(entry);
      }
    });
  }
  initLazyCitySections(lazyEntries);
}

function initializeHighcharts() {
  window.addEventListener('resize', debounceRedrawOnResize);
  Highcharts.setOptions({
    lang: {
      downloadPNG: 'Свали като PNG',
      downloadJPEG: 'Свали като JPG',
      downloadPDF: 'Свали като PDF',
      downloadSVG: 'Свали като SVG',
      downloadCSV: 'Свали данните (CSV)',
      downloadXLS: 'Свали данните (XLS)',
      viewData: 'Покажи данните',
      viewFullscreen: 'Цял екран',
      hideData: 'Скрий данните',
      printChart: 'Отпечатай',
      contextButtonTitle: null
    }
  });
}

function calculateTimeTravel() {
  let url = new URL(window.location.href);
  let yearParam = url.searchParams.get('year');
  if(!yearParam) {
    return;
  }
  let parsedYear = Number.parseInt(yearParam, 10);
  if(!Number.isInteger(parsedYear)) {
    return;
  }
  let currentYear = firstYear + s[baseSchoolIndex].b.length - 1;
  let minYear = Math.max(NAV_FIRST_YEAR, firstYear);
  let maxYear = currentYear - 1;
  if(maxYear < minYear) {
    return;
  }
  let targetYear = Math.min(Math.max(parsedYear, minYear), maxYear);
  removeYears(currentYear - targetYear);
  numYears = 3;
}

function disableEntries() {
  if(!disabledEntries) {
    return;
  }
  for(let i = 0; i < disabledEntries.length; i++) {
    let school = s[disabledEntries[i]];
    school.b[school.b.length - 1] = null;
    school.m[school.m.length - 1] = null;
    school.bu[school.bu.length - 1] = null;
    school.mu[school.mu.length - 1] = null;
  }
}

function removeYears(numYears) {
  for(let i = 0; i < numYears; i++) {
    for(let j = 0; j < s.length; j++) {
      if(!s[j]) {
        continue;
      }
      s[j].b.pop();
      s[j].m.pop();
      s[j].bu.pop();
      s[j].mu.pop();
    }
  }
}

function generateJoke() {
  let j = randomJoke();
  let divJoke = document.getElementById('jokeQuote');
  let divAuthor = document.getElementById('jokeAuthor');
  if(divJoke) { divJoke.innerText = '"' + j.q + '"'; }
  if(divAuthor) { divAuthor.innerText = j.a; }
}

function onLoad() {
  applyNavigationPaths();
  generateJoke();
  generateYearNavigation();
  calculateTimeTravel();
  fixForYear2018();
  fixForMissingYears();
  disableEntries();
  calculateSchoolMedians();
  calculateCityMediansBySchool();
  calculateCityMediansByAttendees();
  generateCitySections();
  enableFixedButtons();
  setDefaultClickedButtons();
  initializeHighcharts();
  redraw();
}

if(!window.__NVO_TEST_MODE__) {
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoad);
  } else {
    onLoad();
  }
}
