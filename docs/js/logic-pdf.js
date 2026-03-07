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
    let recentWindow = 5;
    let recentStart = Math.max(0, totalYears - recentWindow);
    let bestYearB = null, worstYearB = null, bestYearM = null, worstYearM = null;
    for(let y = recentStart; y < totalYears; y++) {
      if(school.b[y] !== null) {
        if(bestYearB === null || school.b[y] > school.b[bestYearB]) { bestYearB = y; }
        if(worstYearB === null || school.b[y] < school.b[worstYearB]) { worstYearB = y; }
      }
      if(school.m[y] !== null) {
        if(bestYearM === null || school.m[y] > school.m[bestYearM]) { bestYearM = y; }
        if(worstYearM === null || school.m[y] < school.m[worstYearM]) { worstYearM = y; }
      }
    }
    let recentCountB = 0, recentCountM = 0;
    for(let y = recentStart; y < totalYears; y++) {
      if(school.b[y] !== null) { recentCountB++; }
      if(school.m[y] !== null) { recentCountM++; }
    }
    let recentLabelB = '(' + recentCountB + 'г.)';
    let recentLabelM = '(' + recentCountM + 'г.)';

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
    if(citySchoolAvgs.length > 1) {
      let below = citySchoolAvgs.filter(v => v < schoolAvg).length;
      percentile = Math.round(below / (citySchoolAvgs.length - 1) * 100);
    } else if(citySchoolAvgs.length === 1) {
      percentile = 100;
    }

    // Trend (linear regression slope) — last 5 years only
    let calcTrend = (arr, start) => {
      let pts = [];
      for(let i = start; i < arr.length; i++) { if(arr[i] !== null && arr[i] !== undefined) { pts.push({ x: i, y: arr[i] }); } }
      if(pts.length < 2) { return null; }
      let mx = avg(pts.map(p => p.x));
      let my = avg(pts.map(p => p.y));
      let num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
      let den = pts.reduce((s, p) => s + (p.x - mx) * (p.x - mx), 0);
      return den !== 0 ? num / den : 0;
    };
    let trendB = calcTrend(school.b, recentStart);
    let trendM = calcTrend(school.m, recentStart);

    // Summary stats box
    let summaryData = [
      [csvHeaderBel + ' средна (3г.)', school.mb ? school.mb.toFixed(2) : '-', csvHeaderMat + ' средна (3г.)', school.mm ? school.mm.toFixed(2) : '-'],
      [csvHeaderBel + ' средна (всички)', validB.length > 0 ? avg(validB).toFixed(2) : '-', csvHeaderMat + ' средна (всички)', validM.length > 0 ? avg(validM).toFixed(2) : '-'],
      [csvHeaderBel + ' станд. отклонение', validB.length > 1 ? stddev(validB).toFixed(2) : '-', csvHeaderMat + ' станд. отклонение', validM.length > 1 ? stddev(validM).toFixed(2) : '-'],
      [csvHeaderBel + ' тренд ' + recentLabelB, trendB !== null ? (trendB >= 0 ? '+' : '') + trendB.toFixed(2) + '/г.' : '-', csvHeaderMat + ' тренд ' + recentLabelM, trendM !== null ? (trendM >= 0 ? '+' : '') + trendM.toFixed(2) + '/г.' : '-'],
      [csvHeaderBel + ' най-добра ' + recentLabelB, bestYearB !== null ? school.b[bestYearB] + ' (' + (firstYear + bestYearB) + ')' : '-', csvHeaderMat + ' най-добра ' + recentLabelM, bestYearM !== null ? school.m[bestYearM] + ' (' + (firstYear + bestYearM) + ')' : '-'],
      [csvHeaderBel + ' най-слаба ' + recentLabelB, worstYearB !== null ? school.b[worstYearB] + ' (' + (firstYear + worstYearB) + ')' : '-', csvHeaderMat + ' най-слаба ' + recentLabelM, worstYearM !== null ? school.m[worstYearM] + ' (' + (firstYear + worstYearM) + ')' : '-'],
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
    for(let y = totalYears - 1; y >= 0; y--) {
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
