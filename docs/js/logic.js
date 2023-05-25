function button(id) {
  return document.getElementById('b' + id);
}

function buttonEnabled(id) {
  if(button(id)) {
    return button(id).classList.contains('button-primary');
  }
  return false;
}

function setButtonState(id, state) {
  if(button(id) === null) {
    return;
  }
  if(state === true) {
    button(id).classList.add('button-primary');
  } else {
    button(id).classList.remove('button-primary');      
  }
}

function recalculate() {
  let tracesBel = [];
  let tracesMat = [];
  let indices = [];
  data50 = [];
  for(let i = 0; i < numYears; i++) {
    data50.push(50);
  }
  let noSchool = {name: 'Изберете поне едно училище', data: data50};
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
  while(true) {
    let exitFlag = false;
    for(let i = 0; i < series.length; i++) {
      if(series[i].data[0]) {
        exitFlag = true;
        break;
      }
    }
    if(exitFlag) {
      break;
    }
    for(let i = 0; i < series.length; i++) {
      series[i].data = series[i].data.slice(1);
    }
  }
  let counter = 0;
  while(true) {
    for(let i = 0; i < series.length; i++) {
      if(series[i].data[series[i].data.length - 1]) {
        return counter;
      }
    }
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
      }
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
      height: Math.max(Math.floor(Math.min(window.innerWidth, window.innerHeight) * 85 / 100), 500)
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
      sourceWidth: 960,
      sourceHeight: 540,
      scale: 2,
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
  let baseURL = window.location.href.split('?')[0].split('#')[0];
  if(indices.length === 0) {
    document.cookie = cookieName + '=;path=/;max-age=-1';
    window.history.pushState(indices, null, baseURL);
  } else {
    let endURL = indices.join(',');
    document.cookie = cookieName + '=' + endURL + ';path=/;max-age=' + 60 * 60 * 24 * 365;
    window.history.pushState(indices, null, baseURL + '?' + cookieName + '=' + endURL);
  }
}

function redraw() {
  let traces = recalculate();
  handleURL(traces.i);
  Highcharts.chart(chartb, getLayout(chartBTitle, traces.b, exportPrefixBel));
  Highcharts.chart(chartm, getLayout(chartMTitle, traces.m, exportPrefixMat));
}

function generateSchoolButtons(div, slices, topCount) {
  let schools = null;
  let topBtn = null;
  let sortFunc = (i1, i2) => (s[i1].mb + s[i1].mm) / 2 < (s[i2].mb + s[i2].mm) / 2 ? 1 : -1;  
  if(topCount && topCount > 0) {
    schools = [];
    topBtn = document.createElement('button');
    topBtn.textContent = 'Топ ' + topCount;
    div.appendChild(topBtn);
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
  let topBtnClicked = () => {
    let setTopSchoolButtons = (state) => {
      let skipped = 0;
      for(let i = 0; i < (topCount + skipped); i++) {
        if(!schools[i] || s[schools[i]].b[s[schools[i]].b.length - 1] === null) {
          ++skipped;
          continue;
        }
        setButtonState(schools[i], state);
      }
    }
    schools.sort(sortFunc);
    if(topBtn.classList.contains('button-primary')) {
    setTopSchoolButtons(false);
      topBtn.classList.remove('button-primary');
    } else {
      setTopSchoolButtons(true);
      topBtn.classList.add('button-primary');    
    }
    redraw();
  }
  if(topCount && topCount > 0) {
    topBtn.onclick = () => topBtnClicked();
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
  g.appendChild(a);
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

function generateHTMLTable(el, hrName, puSchools, prSchools, name) {
  let div = document.createElement('div');
  generateRowWithText(div, '\u00A0');
  titleDiv = generateRowWithStrong(div, tableTitleName + ' - ' + name + ' - ' + tableTitleType);
  titleDiv.style.textAlign = 'center';
  generateRowWithText(div, '\u00A0');
  div.classList.add('row');
  div.id = 't' + hrName;
  div.style.display = 'none';
  let table = document.createElement('table');
  let tHead = document.createElement('thead');
  table.appendChild(tHead);
  let headTr = document.createElement('tr');
  tHead.appendChild(headTr);
  let headers = ['№', 'Училище', 'Тип', 'Ранг'];
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
    headTr.appendChild(th);
  });
  let tBody = document.createElement('tbody');
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
  let topRank = (s[schools[0].i].mb + s[schools[0].i].mm - rankBase * 2) / 2;
  let counter = 0;
  let topRankDone = false;
  schools.forEach((o) => {
    let tr = document.createElement('tr');
    tBody.appendChild(tr);
    let td = document.createElement('td');
    td.appendChild(document.createTextNode(++counter));
    tr.appendChild(td);
    td = document.createElement('td');
    td.appendChild(document.createTextNode(s[o.i].l));
    tr.appendChild(td);
    td = document.createElement('td');
    td.appendChild(document.createTextNode(o.t));
    tr.appendChild(td);
    td = document.createElement('td');
    if(!topRankDone) {
      td.appendChild(document.createTextNode(100));
      td.style.backgroundColor = "#00ff30";
      topRankDone = true;
    } else {
      let rank = (s[o.i].mb + s[o.i].mm - rankBase * 2) / 2;
      let adjustedRank = (rank * 100) / topRank;
      let redHex = "00";
      let greenHex = "00";
      let blueHex = "30";
      if(adjustedRank >= (100 - rankRangeTop)) {
        let red = Math.floor(255 - ((adjustedRank - (100 - rankRangeTop)) * 255) / rankRangeTop);
        redHex = red.toString(16).padStart(2, '0');
        greenHex = "ff";
      } else if(adjustedRank < (100 - rankRangeTop) && adjustedRank >= rankRangeBottom) {
        let green = Math.floor(127 + ((adjustedRank - rankRangeBottom) * 127) / (100 - rankRangeTop - rankRangeBottom));
        redHex = "ff";
        greenHex = green.toString(16).padStart(2, '0');
      } else {
        let green = Math.floor((adjustedRank * 127) / rankRangeBottom);
        let red = Math.floor(191 + green / 2);
        redHex = red.toString(16).padStart(2, '0');
        greenHex = green.toString(16).padStart(2, '0');
      }
      td.style.backgroundColor = "#" + redHex + greenHex + blueHex;
      td.appendChild(document.createTextNode((Math.round(adjustedRank * 100) / 100).toFixed(2)));
    }
    tr.appendChild(td);
    let totalYears = s[o.i].b.length;
    for(let j = 0; j < 3; j++) {
      td = document.createElement('td');
      td.appendChild(document.createTextNode(s[o.i].b[totalYears - j - 1] ? s[o.i].b[totalYears - j - 1] + ' / ' + s[o.i].bu[totalYears - j - 1] : ''));
      tr.appendChild(td);
      td = document.createElement('td');
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
  span = document.createElement('span');
  span.classList.add('u-pull-right');
  el.appendChild(span);
  let header = generateDownloadCSVHeader();
  let a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('Класация'));
  a.onclick = (e) => {
    tableDiv = document.getElementById('t' + name);
    if(tableDiv.style.display === 'none') {
      tableDiv.style.display = 'block';
      e.currentTarget.innerText = 'Затвори'
    } else {
      tableDiv.style.display = 'none';
      e.currentTarget.innerText = 'Класация'
    }
  }
  span.appendChild(a);
  span.appendChild(document.createTextNode(' | '));
  a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('CSV'));
  a.setAttribute('download', exportPrefix + '-data-' + name +'.csv');
  a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(header + data));
  span.appendChild(a);    
}

function generateCitySection(name, hrName, btName, btPos) {
  let puSchools = si[name].n;
  let prSchools = si[name].p;
  let topPuCount = 0;
  if(puSchools[1] - puSchools[0] >= 4) {
    topPuCount = 3;
  }
  if(puSchools[1] - puSchools[0] >= 9) {
    topPuCount = 5;
  }
  if(puSchools[1] - puSchools[0] >= 19) {
    topPuCount = 10;
  }
  generateCityMenu(btPos, btName, hrName);
  let schoolsDivFragment = new DocumentFragment();
  generateRowWithHr(schoolsDivFragment, hrName);
  let cityDiv = generateRowWithStrong(schoolsDivFragment, name);
  generateHTMLTable(schoolsDivFragment, hrName, puSchools, prSchools, name);
  generateRowWithText(schoolsDivFragment, '\u00A0');
  generateRowWithText(schoolsDivFragment, 'Държавни училища');
  generateRowWithText(schoolsDivFragment, '\u00A0');
  let puDiv = generateRow(schoolsDivFragment);
  generateSchoolButtons(puDiv, puSchools, topPuCount);
  let data = generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
    let topPrCount = 0;
    if(prSchools[1] - prSchools[0] >= 5) {
      topPrCount = 3;
    }
    if(prSchools[1] - prSchools[0] >= 10) {
      topPrCount = 5;
    }
    if(prSchools[1] - prSchools[0] >= 20) {
      topPrCount = 10;
    }
    generateRowWithText(schoolsDivFragment, '\u00A0');
    generateRowWithText(schoolsDivFragment, 'Частни училища');
    generateRowWithText(schoolsDivFragment, '\u00A0');
    let prDiv = generateRow(schoolsDivFragment);
    generateSchoolButtons(prDiv, prSchools, topPrCount);
    data += generateDownloadForCity(name, prSchools, 'Ч');
  }
  generateDownloadCSVLink(cityDiv, hrName, data);
  let schoolsDiv = document.getElementById('schools');
  schoolsDiv.appendChild(schoolsDivFragment);
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

function calculateMedians() {
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

function setDefaultClickedButtons() {
  let i = window.location.search.split('?' + cookieName + '=')[1];
  if(i) {
    i.split(',').forEach((i) => {
      setButtonState(i, true);
    });
    return;
  }
  i = (document.cookie + ';').match(new RegExp(cookieName + '=.*;'));
  if(i) {
    i = i[0].split(/=|;/)[1];
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

function enableScrollButton() {
  let btnTop = document.getElementById('btnTop');
  btnTop.style.display = 'block';
  btnTop.onclick = () => document.getElementById('hrCharts').scrollIntoView();
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
  let header = generateDownloadCSVHeader();
  let a = document.getElementById('csvAll');
  a.setAttribute('download', exportPrefix + '-data-all.csv');
  a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(header + data));  
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

function onLoad() {
  fixForYear2018();
  fixForMissingYears();
  calculateMedians();
  generateCitySections();
  enableScrollButton();
  setDefaultClickedButtons();
  initializeHighcharts();
  redraw();
}
