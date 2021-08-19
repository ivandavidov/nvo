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
  if(state === true) {
    button(id).classList.add('button-primary');
  } else {
    button(id).classList.remove('button-primary');      
  }
}

function recalculate() {
  let tracesBel = [];
  let tracesMat = [];
  let noSchool = {name: 'Изберете поне едно училище', data: [50, 50, 50, 50, 50]};
  s.forEach((o, i) => {
    if(buttonEnabled(i)) {
      tracesBel.push({name: o.n, data: o.b});
      tracesMat.push({name: o.n, data: o.m});
    }
  });
  if(tracesBel.length === 0 || tracesMat.length === 0) {
    tracesBel.push(noSchool);
    tracesMat.push(noSchool);
  }
  return {b: tracesBel, m: tracesMat};
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

function getLayout(title, series) {
  let removedYears = normalizeSeries(series);
  let lastYear = 2016 + s[1].b.length - removedYears;
  let categories = [];
  for(let i = 0; i < series[0].data.length; i++) {
    categories.push(lastYear - (series[0].data.length - i - 1) + '');
  }
  return {
    title: {
      text: title
    },
    xAxis: {
      categories: categories
    },
    yAxis: {
      title: {
        text: null
      }
    },
    legend: {
      layout: 'horizontal',
      align: 'left'
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
      animation: false
    },
    exporting: {
      enabled: true,
      sourceWidth: 960,
      sourceHeight: 540,
      scale: 2,
      filename: 'dzi-chart',
      buttons: {
        contextButton: {
          menuItems: ['printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG']
        }
      }
    },
    series: series
  }
}

function redraw() {
  let traces = recalculate();
  Highcharts.chart(chartb, getLayout('ДЗИ - Български език', traces.b));
  Highcharts.chart(chartm, getLayout('ДЗИ - Втора матура', traces.m));
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
  for(let i = 0; i < slices.length; i++) {
    for(let j = slices[i][0]; j <= slices[i][1]; j++) {
      if(!s[j]) {
        continue;
      }
      if(schools) {
        schools.push(j);
      }
      let b = document.createElement('button');
      b.id = 'b' + j;
      b.textContent = s[j].l;
      b.onclick = function() {toggleButton('' + j)};
      div.appendChild(b);
    }
  }
  let topBtnClicked = () => {
    let setTopSchoolButtons = (state) => {
      for(let i = 0; i < topCount; i++) {
        if(!schools[i]) {
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
  schools.forEach((range) => {
    for(let i = range[0]; i <= range[1]; i++) {
      if(!s[i]) {
        continue;
      }
      let row = city + ',"' + s[i].n + '",' + type
      for(let j = 2017; j < 2017 + s[1].b.length; j++) {
        row += ',' + (s[i].b[j - 2017] ? s[i].b[j - 2017] : '');
        row += ',' + (s[i].m[j - 2017] ? s[i].m[j - 2017] : '');
      }
      data += row + '\r\n';
    }
  });
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
  for(let j = 2017; j < 2017 + s[1].b.length; j++) {
    header += ',БЕЛ ' + (j -2000) + ',ДЗИ-2 ' + (j -2000);
  }
  header += '\r\n';
  return header;
}

function generateHTMLTable(el, hrName, puSchools, prSchools) {
  let div = document.createElement('div');
  generateRowWithText(div, '\u00A0');
  div.classList.add('row');
  div.id = 't' + hrName;
  div.style.display = 'none';
  let table = document.createElement('table');
  //table.classList.add('u-full-width');
  let tHead = document.createElement('thead');
  table.appendChild(tHead);
  let headTr = document.createElement('tr');
  tHead.appendChild(headTr);
  let headers = ['№', 'Училище', 'Тип'];
  for(let i = 0; i < 3; i++) {
    headers.push((16 + s[1].b.length - i) + '-Б');
    headers.push((16 + s[1].b.length - i) + '-2');
  }
  headers.forEach((header) => {
    let th = document.createElement('th');
    th.appendChild(document.createTextNode(header));
    headTr.appendChild(th);
  });
  let tBody = document.createElement('tbody');
  table.appendChild(tBody);
  let schools = [];
  puSchools.forEach((slice) => {
    for(let i = slice[0]; i <= slice[1]; i++) {
      if(!s[i]) {
        continue;
      }
      schools.push({i: i, t: 'Д'});
    }
  });
  if(prSchools) {
    prSchools.forEach((slice) => {
      for(let i = slice[0]; i <= slice[1]; i++) {
        if(!s[i]) {
          continue;
        }
        schools.push({i: i, t: 'Ч'});
      }
    });
  }
  let sortFunc = (o1, o2) => (s[o1.i].mb + s[o1.i].mm) / 2 < (s[o2.i].mb + s[o2.i].mm) / 2 ? 1 : -1;
  schools.sort(sortFunc);
  let counter = 0;
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
    let totalYears = s[o.i].b.length;
    for(let j = 0; j < 3; j++) {
      td = document.createElement('td');
      td.appendChild(document.createTextNode(s[o.i].b[totalYears - j - 1] ? s[o.i].b[totalYears - j - 1] : ''));
      tr.appendChild(td);
      td = document.createElement('td');
      td.appendChild(document.createTextNode(s[o.i].m[totalYears - j - 1] ? s[o.i].m[totalYears - j - 1] : ''));
      tr.appendChild(td);
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
  a.appendChild(document.createTextNode('Таблица'));
  a.onclick = (e) => {
    tableDiv = document.getElementById('t' + name);
    if(tableDiv.style.display === 'none') {
      tableDiv.style.display = 'block';
      e.currentTarget.innerText = 'Затвори'
    } else {
      tableDiv.style.display = 'none';
      e.currentTarget.innerText = 'Таблица'
    }
  }
  span.appendChild(a);
  span.appendChild(document.createTextNode(' | '));
  a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('CSV'));
  a.setAttribute('download', 'dzi-data-' + name +'.csv');
  a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(header + data));
  span.appendChild(a);    
}

function generateCitySection(name, hrName, btName, btPos, puSchools, prSchools, topPuCount, topPrCount) {
  generateCityMenu(btPos, btName, hrName);
  let schoolsDivFragment = new DocumentFragment();
  generateRowWithHr(schoolsDivFragment, hrName);
  let cityDiv = generateRowWithStrong(schoolsDivFragment, name);
  generateHTMLTable(schoolsDivFragment, hrName, puSchools, prSchools);
  generateRowWithText(schoolsDivFragment, '\u00A0');
  generateRowWithText(schoolsDivFragment, 'Държавни училища');
  generateRowWithText(schoolsDivFragment, '\u00A0');
  let puDiv = generateRow(schoolsDivFragment);
  generateSchoolButtons(puDiv, puSchools, topPuCount);
  let data = generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
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
  s.forEach((o) => {
    if(o.b[1] !== null) {
      o.b[1] = Math.floor(o.b[1] * 10000 / 65 + Number.EPSILON) / 100;
    }
    if(o.m[1] !== null) {
      o.m[1] = Math.floor(o.m[1] * 10000 / 65 + Number.EPSILON) / 100;
    }
  });  
}

function fixForYear2021() {
  s.forEach((o) => {
    if(o.b.length === 4) {
      o.b.push(null);
    }
    if(o.m.length === 4) {
      o.m.push(null);
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
  setButtonState(2, true);
  setButtonState(5, true);
}

function enableScrollButton() {
  let btnTop = document.getElementById('btnTop');
  btnTop.style.display = 'block';
  btnTop.onclick = () => document.getElementById('hrCharts').scrollIntoView();
}

function generateCitySections() {
  let data = generateCitySection('София', 'sofia', 'София', 1, [[0, 100]], null, 10, 0);
  data += generateCitySection('Пловдив', 'plovdiv', 'Пловдив', 1, [[101, 140]], null, 10, 0);
  data += generateCitySection('Варна', 'varna', 'Варна', 1, [[141, 170]], null, 10, 0);
  data += generateCitySection('Бургас', 'burgas', 'Бургас', 1, [[171, 199]], null, 10, 0);
  data += generateCitySection('Благоевград', 'blagoevgrad', 'Благоевград', 2, [[391, 402]], null, 5, 0);
  data += generateCitySection('Велико Търново', 'veliko-turnovo', 'В. Търново', 2, [[405, 420]], null, 5, 0);
  data += generateCitySection('Видин', 'vidin', 'Видин', 2, [[441, 448]], null, 3, 0);
  data += generateCitySection('Враца', 'vratsa', 'Враца', 2, [[421, 432]], null, 5, 0);
  data += generateCitySection('Габрово', 'gabrovo', 'Габрово', 2, [[435, 440]], null, 3, 0);
  data += generateCitySection('Добрич', 'dobrich', 'Добрич', 2, [[291, 306]], null, 5, 0);
  data += generateCitySection('Кюстендил', 'kiustendil', 'Кюстендил', 2, [[461, 468]], null, 3, 0);
  data += generateCitySection('Кърджали', 'kurdjali', 'Кърджали', 2, [[471, 482]], null, 5, 0);
  data += generateCitySection('Ловеч', 'lovech', 'Ловеч', 2, [[495, 502]], null, 3, 0);
  data += generateCitySection('Монтана', 'montana', 'Монтана', 2, [[451, 460]], null, 5, 0);
  data += generateCitySection('Пазарджик', 'pazardjik', 'Пазарджик', 2, [[371, 385]], null, 5, 0);
  data += generateCitySection('Перник', 'pernik', 'Перник', 2, [[325, 335]], null, 5, 0);
  data += generateCitySection('Плевен', 'pleven', 'Плевен', 2, [[245, 266]], null, 10, 0);
  data += generateCitySection('Разград', 'razgrad', 'Разград', 2, [[515, 524]], null, 5, 0);
  data += generateCitySection('Русе', 'ruse', 'Русе', 2, [[201, 224]], null, 10, 0);
  data += generateCitySection('Силистра', 'silistra', 'Силистра', 2, [[505, 514]], null, 5, 0);
  data += generateCitySection('Сливен', 'sliven', 'Сливен', 2, [[271, 286]], null, 5, 0);
  data += generateCitySection('Смолян', 'smolian', 'Смолян', 2, [[525, 532]], null, 3, 0);
  data += generateCitySection('Стара Загора', 'stara-zagora', 'Ст. Загора', 2, [[225, 244]], null, 10, 0);
  data += generateCitySection('Търговище', 'targovishte', 'Търговище', 2, [[485, 494]], null, 5, 0);
  data += generateCitySection('Хасково', 'haskovo', 'Хасково', 2, [[341, 351]], null, 5, 0);
  data += generateCitySection('Шумен', 'shumen', 'Шумен', 2, [[311, 323]], null, 5, 0);
  data += generateCitySection('Ямбол', 'iambol', 'Ямбол', 2, [[355, 366]], null, 5, 0);
  let header = generateDownloadCSVHeader();
  let a = document.getElementById('csvAll');
  a.setAttribute('download', 'dzi-data-all.csv');
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
  //fixForYear2018();
  //fixForYear2021();
  calculateMedians();
  generateCitySections();
  enableScrollButton();
  setDefaultClickedButtons();
  initializeHighcharts();
  redraw();
}
