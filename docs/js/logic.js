const CHART_HEIGHT_PERCENT = 85 / 100;
const CHART_MIN_HEIGHT_PX = 500;
const CHART_EXPORT_WIDTH = 960;
const CHART_EXPORT_HEIGHT = 540;
const CHART_EXPORT_SCALE = 2;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
const SCHOOL_THRESHOLD_SMALL = 4;
const SCHOOL_THRESHOLD_MEDIUM = 9;
const SCHOOL_THRESHOLD_LARGE = 19;
const SCHOOL_THRESHOLD_XLARGE = 29;
const SCHOOL_TOP_COUNT_SMALL = 3;
const SCHOOL_TOP_COUNT_MEDIUM = 5;
const SCHOOL_TOP_COUNT_LARGE = 10;
const SCHOOL_SECOND_COUNT = 10;

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
  } else {
    btn.classList.remove('button-primary');
  }
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
  s.forEach((o, i) => {
    if(buttonEnabled(i)) {
      indices.push(i);
      tracesBel.push({name: o.n, data: o.b});
      tracesMat.push({name: o.n, data: o.m});
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
  while(!series.some(s => s.data[0])) {
    for(let i = 0; i < series.length; i++) {
      series[i].data = series[i].data.slice(1);
    }
  }
  let counter = 0;
  while(!series.some(s => s.data[s.data.length - 1])) {
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
    window.history.pushState(indices, null, anchor ? baseURL + '#' + anchor : baseURL);
  } else {
    let endURL = indices.join(',');
    document.cookie = cookieName + '=' + endURL + ';path=/;max-age=' + COOKIE_MAX_AGE_SECONDS;
    if(anchor) {
      endURL += '#' + anchor;
    }
    window.history.pushState(indices, null, baseURL + '?' + cookieName + '=' + endURL);
  }
}

function redraw() {
  let traces = recalculate();
  handleURL(traces.i);
  Highcharts.chart(chartb, getLayout(chartBTitle, traces.b, exportPrefixBel));
  Highcharts.chart(chartm, getLayout(chartMTitle, traces.m, exportPrefixMat));
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
    let skipped = 0;
    for(let i = start; i < (start + count + skipped); i++) {
      if(!schools[i] || s[schools[i]].b[s[schools[i]].b.length - 1] === null) {
        ++skipped;
        continue;
      }
      setButtonState(schools[i], state);
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
  let headersMedian = [];
  if(si[name].mpbs) {
    let headTrMedian = document.createElement('tr');
    tHeadMedian.appendChild(headTrMedian);
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
    headersMedian = ['Година', csvHeaderBel, csvHeaderMat, csvHeaderBel, csvHeaderMat];
  } else {
    headersMedian = ['Година', csvHeaderBel, csvHeaderMat];
  }
  let headTrMedian = document.createElement('tr');
  tHeadMedian.appendChild(headTrMedian);
  headersMedian.forEach((header) => {
    let th = document.createElement('th');
    th.style.overflow = 'hidden';
    th.style.whiteSpace = 'nowrap';
    th.appendChild(document.createTextNode(header));
    headTrMedian.appendChild(th);
  });
  let tBodyMedian = document.createElement('tbody');
  tableMedianSchools.appendChild(tBodyMedian);
  for(let i = s[baseSchoolIndex].b.length - numYears; i < s[baseSchoolIndex].b.length; i++) {
    let tr = document.createElement('tr');
    tBodyMedian.appendChild(tr);
    let td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode(firstYear + i));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name].mnbs[i] * 100) / 100).toFixed(2)));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name].mnms[i] * 100) / 100).toFixed(2)));
    if(si[name].mpbs) {
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name].mpbs[i] * 100) / 100).toFixed(2)));
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name].mpms[i] * 100) / 100).toFixed(2)));
    }
  }
  el.appendChild(tableMedianDiv);
  let tableMedianAttendees = document.createElement('table');
  tableMedianAttendees.id = 'tableMedianAttendees' + si[name].n[0];
  tableMedianAttendees.style.display = 'none';
  tHeadMedian = document.createElement('thead');
  tableMedianAttendees.appendChild(tHeadMedian);
  headersMedian = [];
  if(si[name].mpba) {
    let headTrMedian = document.createElement('tr');
    tHeadMedian.appendChild(headTrMedian);
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
    headersMedian = ['Година', csvHeaderBel, csvHeaderMat, csvHeaderBel, csvHeaderMat];
  } else {
    headersMedian = ['Година', csvHeaderBel, csvHeaderMat];
  }
  headTrMedian = document.createElement('tr');
  tHeadMedian.appendChild(headTrMedian);
  headersMedian.forEach((header) => {
    let th = document.createElement('th');
    th.style.overflow = 'hidden';
    th.style.whiteSpace = 'nowrap';
    th.appendChild(document.createTextNode(header));
    headTrMedian.appendChild(th);
  });
  tBodyMedian = document.createElement('tbody');
  tableMedianAttendees.appendChild(tBodyMedian);
  for(let i = s[baseSchoolIndex].b.length - numYears; i < s[baseSchoolIndex].b.length; i++) {
    let tr = document.createElement('tr');
    tBodyMedian.appendChild(tr);
    let td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode(firstYear + i));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name].mnba[i] * 100) / 100).toFixed(2)));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name].mnma[i] * 100) / 100).toFixed(2)));
    if(si[name].mpbs) {
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name].mpba[i] * 100) / 100).toFixed(2)));
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name].mpma[i] * 100) / 100).toFixed(2)));
    }
  }
  tableMedianDiv.appendChild(tableMedianAttendees);
}

function generateHTMLTable(el, hrName, puSchools, prSchools, name) {
  let div = document.createElement('div');
  generateRowWithText(div, '\u00A0');
  generateCityMedianTables(div, name);
  generateRowWithText(div, '\u00A0');
  if(prSchools) {
    let fn = (lbl) => {
      let tBody = document.getElementById('tbl-' + si[name].n[0]);
      if(!tBody) { return; }
      let trs = tBody.getElementsByTagName('tr');
      let counter = 0;
      for(let i = 0; i < trs.length; i++) {
        let tds = trs[i].getElementsByTagName('td');
        if(!lbl || tds[2].textContent.startsWith(lbl) ) {
          trs[i].style.display = 'table-row';
          tds[0].textContent = ++counter;
          let color = null;
          let rank = 0;
          if(!lbl) {
            color = tds[3].bgAll;
            rank = tds[3].rankAll;
          } else if(lbl === 'Д') {
            color = tds[3].bgPu;
            rank = tds[3].rankPu;
          } else {
            color = tds[3].bgPr;
            rank = tds[3].rankPr;
          }
          tds[3].style.backgroundColor = color;
          tds[3].textContent = rank;
        } else {
          trs[i].style.display = 'none';
        }
      }
    }
    let menuTitleDiv = generateRow(div);
    menuTitleDiv.style.display = 'flex';
    menuTitleDiv.style.alignItems = 'center';
    menuTitleDiv.style.justifyContent = 'center';
    let aAll = document.createElement('a');
    aAll.id = 'menu-all-a-' + si[name].n[0];
    aAll.style.display = 'none';
    aAll.style.cursor = 'pointer';
    aAll.appendChild(document.createTextNode('Всички'));
    aAll.onclick = (e) => {
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
    aPu.onclick = (e) => {
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
    aPr.onclick = (e) => {
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
  generateRowWithText(div, '\u00A0');
  let titleDiv = generateRowWithStrong(div, tableTitleName + ' - ' + name + ' - ' + tableTitleType);
  titleDiv.style.textAlign = 'center';
  generateRowWithText(div, '\u00A0');
  div.classList.add('row');
  div.id = 't' + hrName;
  div.style.display = 'none';
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
  if(hide2019TableFix) { // Remove this when 2022 results are available.
    headers.pop();
  }
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
    if(!s[i] || s[i].b[s[i].b.length - 1] === null) {
      continue;
    }
    schools.push({i: i, t: 'Д'});
  }
  if(prSchools) {
    for(let i = prSchools[0]; i <= prSchools[1]; i++) {
      if(!s[i] || s[i].b[s[i].b.length - 1] === null) {
        continue;
      }
      schools.push({i: i, t: 'Ч'});
    }
  }
  let sortFunc = (o1, o2) => (s[o1.i].mb + s[o1.i].mm) / 2 < (s[o2.i].mb + s[o2.i].mm) / 2 ? 1 : -1;
  schools.sort(sortFunc);
  let topRankAll = (s[schools[0].i].mb + s[schools[0].i].mm - rankBase * 2) / 2;
  let topRankPu = null;
  let topRankPr = null;
  if(prSchools) {
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
      td.appendChild(document.createTextNode(100));
      td.title = 'Среден резултат = ' + (topRankAll + rankBase).toFixed(2);
      td.bgAll = '#00ff30';
      td.rankAll = '100';
      td.rankPu = o.t === 'Д' ? '100' : 'none';
      td.rankPr = o.t === 'Ч' ? '100' : 'none';
      td.bgPu = o.t === 'Д' ? '#00ff30': 'none';
      td.bgPr = o.t === 'Ч' ? '#00ff30': 'none';
      td.style.backgroundColor = td.bgAll;
      topRankDone = true;
    } else {
      let calculateAdjustedRankData = (topRank) => {
        let adjustedRank = (rank * 100) / topRank;
        if(adjustedRank > 100) {
          adjustedRank = 100;
        }
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
        return {
          'adjustedRank': adjustedRank,
          'redHex': redHex,
          'greenHex': greenHex,
          'blueHex': blueHex
        }
      }
      let rank = (s[o.i].mb + s[o.i].mm - rankBase * 2) / 2;
      td.title = 'Среден резултат = ' + (rank + rankBase).toFixed(2);
      let ardAll = calculateAdjustedRankData(topRankAll);
      td.bgAll = '#' + ardAll.redHex + ardAll.greenHex + ardAll.blueHex;
      td.rankAll = (Math.round(ardAll.adjustedRank * 100) / 100).toFixed(2);
      let ardPu = calculateAdjustedRankData(topRankPu);
      td.bgPu = '#' + ardPu.redHex + ardPu.greenHex + ardPu.blueHex;
      td.rankPu = ardPu.adjustedRank === 100 ? '100' : (Math.round(ardPu.adjustedRank * 100) / 100).toFixed(2);
      if(topRankPr) {
        let ardPr = calculateAdjustedRankData(topRankPr);
        td.bgPr = '#' + ardPr.redHex + ardPr.greenHex + ardPr.blueHex;
        td.rankPr = ardPr.adjustedRank === 100 ? '100' : (Math.round(ardPr.adjustedRank * 100) / 100).toFixed(2);
      } else {
        td.bgPr = 'none';
        td.rankPr = 0;
      }
      td.style.backgroundColor = td.bgAll;
      td.textContent = td.rankAll;
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
    if(hide2019TableFix) { // Remove this when 2022 results are available.
      tr.removeChild(tr.lastChild);
    }
  });
  div.appendChild(table);
  el.appendChild(div);
}

function generateDownloadCSVLink(el, name, data) {
  let span = document.createElement('span');
  span.classList.add('u-pull-right');
  el.appendChild(span);
  let header = generateDownloadCSVHeader();
  let a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('Класация'));
  a.onclick = (e) => {
    let tableDiv = document.getElementById('t' + name);
    if(!tableDiv) { return; }
    if(tableDiv.style.display === 'none') {
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
  a.setAttribute('download', exportPrefix + '-data-' + name +'.csv');
  a.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + data));
  span.appendChild(a);    
}

function generateCitySection(name, hrName, btName, btPos) {
  if(!si[name]) {
    return '';
  }
  if(!si[name].n && !si[name[p]]) {
    return '';
  }
  let puSchools = si[name].n;
  let prSchools = si[name].p;
  let hasSchools = false;
  for(let i = puSchools[0]; i <= puSchools[1]; i++) {
    if(s[i].b[s[i].b.length - 1] && s[i].m[s[i].m.length - 1]) {
      hasSchools = true;
      break;
    }
  }
  if(prSchools) {
    for(let i = prSchools[0]; i <= prSchools[1]; i++) {
      if(s[i].b[s[i].b.length - 1] && s[i].m[s[i].m.length - 1]) {
        hasSchools = true;
        break;
      }
    }
  }
  if(!hasSchools) {
    return '';
  }
  const { topCount: topPuCount, secondCount: secondPuCount } = getSchoolCounts(puSchools);
  generateCityMenu(btPos, btName, hrName);
  let schoolsDivFragment = document.createDocumentFragment();
  generateRowWithHr(schoolsDivFragment, hrName);
  let cityDiv = generateRowWithStrong(schoolsDivFragment, name);
  generateHTMLTable(schoolsDivFragment, hrName, puSchools, prSchools, name);
  generateRowWithText(schoolsDivFragment, '\u00A0');
  generateRowWithText(schoolsDivFragment, 'Държавни училища');
  generateRowWithText(schoolsDivFragment, '\u00A0');
  let puDiv = generateRow(schoolsDivFragment);
  generateSchoolButtons(puDiv, puSchools, topPuCount, secondPuCount);
  let data = generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
    const { topCount: topPrCount, secondCount: secondPrCount } = getSchoolCounts(prSchools);
    generateRowWithText(schoolsDivFragment, '\u00A0');
    generateRowWithText(schoolsDivFragment, 'Частни училища');
    generateRowWithText(schoolsDivFragment, '\u00A0');
    let prDiv = generateRow(schoolsDivFragment);
    generateSchoolButtons(prDiv, prSchools, topPrCount, secondPrCount);
    data += generateDownloadForCity(name, prSchools, 'Ч');
  }
  generateDownloadCSVLink(cityDiv, hrName, data);
  let schoolsDiv = document.getElementById('schools');
  if(schoolsDiv) { schoolsDiv.appendChild(schoolsDivFragment); }
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
      si[o].mnbs[i] = sumNB / (si[o].n[1] - si[o].n[0] + 1 - nullNB);
      si[o].mnms[i] = sumNM / (si[o].n[1] - si[o].n[0] + 1 - nullNM);
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
        si[o].mpbs[i] = sumPB / (si[o].p[1] - si[o].p[0] + 1 - nullPB);
        si[o].mpms[i] = sumPM / (si[o].p[1] - si[o].p[0] + 1 - nullPM);
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
      si[o].mnba[i] = sumNB / attendeesNB;
      si[o].mnma[i] = sumNM / attendeesNM;
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
        si[o].mpba[i] = sumPB / attendeesPB;
        si[o].mpma[i] = sumPM / attendeesPM;
        }
    }
  });
}

function setDefaultClickedButtons() {
  let url = new URL(window.location.href);
  let i = url.searchParams.get(cookieName);
  if(i) {
    i.split(',').forEach((i) => {
      setButtonState(i, true);
    });
    return;
  }
  i = (document.cookie + ';').match(new RegExp(cookieName + '=.*;'));
  if(i) {
    i = i[0].split(/=|;/)[1].split('#')[0];
  }
  if(i) {
    i.split(',').forEach((i) => {
      setButtonState(i, true);
    });
    return;
  }
  setButtonState(baseSchoolIndex, true);
  setButtonState(refSchoolIndex, true);
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
      s.forEach((_, i) => {
        setButtonState(i, false);
      });
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
  let data = generateCitySection('София', 'sofia', 'София', 1);
  data += generateCitySection('Пловдив', 'plovdiv', 'Пловдив', 1);
  data += generateCitySection('Варна', 'varna', 'Варна', 1);
  data += generateCitySection('Бургас', 'burgas', 'Бургас', 1);
  data += generateCitySection('Благоевград', 'blagoevgrad', 'Благоевград', 2);
  data += generateCitySection('Велико Търново', 'veliko-turnovo', 'В. Търново', 2);
  data += generateCitySection('Видин', 'vidin', 'Видин', 2);
  data += generateCitySection('Враца', 'vratsa', 'Враца', 2);
  data += generateCitySection('Габрово', 'gabrovo', 'Габрово', 2);
  data += generateCitySection('Добрич', 'dobrich', 'Добрич', 2);
  data += generateCitySection('Кърджали', 'kurdzhali', 'Кърджали', 2);
  data += generateCitySection('Кюстендил', 'kiustendil', 'Кюстендил', 2);
  data += generateCitySection('Ловеч', 'lovech', 'Ловеч', 2);
  data += generateCitySection('Монтана', 'montana', 'Монтана', 2);
  data += generateCitySection('Пазарджик', 'pazardzhik', 'Пазарджик', 2);
  data += generateCitySection('Перник', 'pernik', 'Перник', 2);
  data += generateCitySection('Плевен', 'pleven', 'Плевен', 2);
  data += generateCitySection('Разград', 'razgrad', 'Разград', 2);
  data += generateCitySection('Русе', 'ruse', 'Русе', 2);
  data += generateCitySection('Силистра', 'silistra', 'Силистра', 2);
  data += generateCitySection('Сливен', 'sliven', 'Сливен', 2);
  data += generateCitySection('Смолян', 'smolian', 'Смолян', 2);
  data += generateCitySection('Стара Загора', 'stara-zagora', 'Ст. Загора', 2);
  data += generateCitySection('Търговище', 'turgovishte', 'Търговище', 2);
  data += generateCitySection('Хасково', 'haskovo', 'Хасково', 2);
  data += generateCitySection('Шумен', 'shumen', 'Шумен', 2);
  data += generateCitySection('Ямбол', 'iambol', 'Ямбол', 2);
  if(fixForMissingCities2023) {
    let otherCities = document.getElementById('other-cities');
    if(otherCities) { otherCities.style.display = 'none'; }
  } else {
    data += generateCitySection('Айтос', 'aitos', 'Айтос', 3);
    data += generateCitySection('Асеновград', 'asenovgrad', 'Асеновград', 3);
    data += generateCitySection('Банкя', 'bankia', 'Банкя', 3);
    data += generateCitySection('Берковица', 'berkovitsa', 'Берковица', 3);
    data += generateCitySection('Ботевград', 'botevgrad', 'Ботевград', 3);
    data += generateCitySection('Велинград', 'velingrad', 'Велинград', 3);
    data += generateCitySection('Горна Оряховица', 'gorna-oryahovitsa', 'Г. Оряховица', 3);
    data += generateCitySection('Гоце Делчев', 'gotse-delchev', 'Гоце Делчев', 3);
    data += generateCitySection('Димитровград', 'dimitrovgrad', 'Димитровград', 3);
    data += generateCitySection('Дупница', 'dupnitsa', 'Дупница', 3);
    data += generateCitySection('Ихтиман', 'ihtiman', 'Ихтиман', 3);
    data += generateCitySection('Каварна', 'kavarna', 'Каварна', 3);
    data += generateCitySection('Казанлък', 'kazanluk', 'Казанлък', 3);
    data += generateCitySection('Карлово', 'karlovo', 'Карлово', 3);
    data += generateCitySection('Карнобат', 'karnobat', 'Карнобат', 3);
    data += generateCitySection('Костинброд', 'kostinbrod', 'Костинброд', 3);
    data += generateCitySection('Лом', 'lom', 'Лом', 3);
    data += generateCitySection('Луковит', 'lukovit', 'Луковит', 3);
    data += generateCitySection('Несебър', 'nesebar', 'Несебър', 3);
    data += generateCitySection('Нова Загора', 'nova-zagora', 'Нова Загора', 3);
    data += generateCitySection('Нови Искър', 'novi-iskar', 'Нови Искър', 3);
    data += generateCitySection('Нови пазар', 'novi-pazar', 'Нови пазар', 3);
    data += generateCitySection('Обзор', 'obzor', 'Обзор', 3);
    data += generateCitySection('Панагюрище', 'panagiurishte', 'Панагюрище', 3);
    data += generateCitySection('Петрич', 'petrich', 'Петрич', 3);
    data += generateCitySection('Пещера', 'peshtera', 'Пещера', 3);
    data += generateCitySection('Поморие', 'pomorie', 'Поморие', 3);
    data += generateCitySection('Попово', 'popovo', 'Попово', 3);
    data += generateCitySection('Правец', 'pravets', 'Правец', 3);
    data += generateCitySection('Провадия', 'provadia', 'Провадия', 3);
    data += generateCitySection('Първомай', 'purvomai', 'Първомай', 3);
    data += generateCitySection('Раднево', 'radnevo', 'Раднево', 3);
    data += generateCitySection('Радомир', 'radomir', 'Радомир', 3);
    data += generateCitySection('Раковски', 'rakovski', 'Раковски', 3);
    data += generateCitySection('Самоков', 'samokov', 'Самоков', 3);
    data += generateCitySection('Сандански', 'sandanski', 'Сандански', 3);
    data += generateCitySection('Свиленград', 'svilengrad', 'Свиленград', 3);
    data += generateCitySection('Свищов', 'svishtov', 'Свищов', 3);
    data += generateCitySection('Своге', 'svoge', 'Своге', 3);
    data += generateCitySection('Севлиево', 'sevlievo', 'Севлиево', 3);
    data += generateCitySection('Стамболийски', 'stanbiliiski', 'Стамболийски', 3);
    data += generateCitySection('Троян', 'troyan', 'Троян', 3);
    data += generateCitySection('Харманли', 'harmanli', 'Харманли', 3);
    data += generateCitySection('Червен бряг', 'cherven-briag', 'Червен бряг', 3);
    data += generateCitySection('Чирпан', 'chirpan', 'Чирпан', 3);
  }
  let header = generateDownloadCSVHeader();
  let a = document.getElementById('csvAll');
  if(a) {
    a.setAttribute('download', exportPrefix + '-data-all.csv');
    a.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + data));
  }
}

function initializeHighcharts() {
  window.onresize = redraw;
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
  let yearStr = window.location.search.split('year=')[1];
  if(yearStr && yearStr.length >= 4) {
    let year = yearStr.slice(0, 4);
    currentYear = firstYear + s[baseSchoolIndex].b.length - 1
    removeYears(currentYear - year);
    numYears = 3;
  }
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
  generateJoke();
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
