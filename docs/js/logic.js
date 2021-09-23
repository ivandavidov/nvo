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
  let noSchool = {name: 'Изберете поне едно училище', data: [50, 50, 50, 50, 50]};
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
  let lastYear = 2016 + s[201].b.length - removedYears;
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
      filename: 'nvo-chart',
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
    window.history.pushState(indices, null, baseURL);
  } else {
    window.history.pushState(indices, null, baseURL + '?i=' + indices.join(','));
  }
}

function redraw() {
  let traces = recalculate();
  handleURL(traces.i);
  Highcharts.chart(chartb, getLayout('НВО - Български език', traces.b));
  Highcharts.chart(chartm, getLayout('НВО - Математика', traces.m));
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
      b.title = s[j].n;      
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
      let row = city + ',' + s[i].n + ',' + type
      for(let j = 2017; j < 2017 + s[201].b.length; j++) {
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
  for(let j = 2017; j < 2017 + s[201].b.length; j++) {
    header += ',БЕЛ ' + (j -2000) + ',МАТ ' + (j -2000);
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
    headers.push((16 + s[201].b.length - i) + ' Б');
    headers.push((16 + s[201].b.length - i) + ' М');
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
  a.setAttribute('download', 'nvo-data-' + name +'.csv');
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
    let divider = numYears;
    for(let i = 1; i <= numYears; i++) {
      if(!o.b[o.b.length - i] || !o.m[o.m.length - i]) {
        --divider;
        continue;
      }
      mb += o.b[o.b.length - i];
      mm += o.m[o.m.length - i];
    }
    o.mb = divider > 0 ? mb / divider : 0;
    o.mm = divider > 0 ? mm / divider : 0;
  });
}

function setDefaultClickedButtons() {
  let i = window.location.search.split('?i=')[1];
  if(i) {
    i.split(',').forEach((i) => {
      setButtonState(i, true);
    });
  } else {
    setButtonState(20, true);
    setButtonState(201, true);
  }
}

function enableScrollButton() {
  let btnTop = document.getElementById('btnTop');
  btnTop.style.display = 'block';
  btnTop.onclick = () => document.getElementById('hrCharts').scrollIntoView();
}

function generateCitySections() {
  let data = generateCitySection('София', 'sofia', 'София', 1, [[201, 210], [1, 200]], [[211, 250]], 10, 10);
  data += generateCitySection('Пловдив', 'plovdiv', 'Пловдив', 1, [[251, 285]], [[286, 290]], 10, 0);
  data += generateCitySection('Варна', 'varna', 'Варна', 1, [[291, 320]], [[321, 330]], 10, 0);
  data += generateCitySection('Бургас', 'burgas', 'Бургас', 1, [[331, 350]], [[351, 360]], 10, 0);
  data += generateCitySection('Благоевград', 'blagoevgrad', 'Благоевград', 2, [[511, 520]], null, 5, 0);
  data += generateCitySection('Велико Търново', 'veliko-turnovo', 'В. Търново', 2, [[521, 530]], null, 5, 0);
  data += generateCitySection('Видин', 'vidin', 'Видин', 2, [[551, 560]], null, 5, 0);
  data += generateCitySection('Враца', 'vratsa', 'Враца', 2, [[531, 540]], null, 5, 0);
  data += generateCitySection('Габрово', 'gabrovo', 'Габрово', 2, [[541, 550]], null, 5, 0);
  data += generateCitySection('Добрич', 'dobrich', 'Добрич', 2, [[441, 455]], [[456, 460]], 5, 0);
  data += generateCitySection('Кърджали', 'kurdzhali', 'Кърджали', 2, [[581, 590]], null, 5, 0);
  data += generateCitySection('Кюстендил', 'kiustendil', 'Кюстендил', 2, [[571, 580]], null, 5, 0);
  data += generateCitySection('Ловеч', 'lovech', 'Ловеч', 2, [[601, 610]], null, 5, 0);
  data += generateCitySection('Монтана', 'montana', 'Монтана', 2, [[561, 570]], null, 5, 0);
  data += generateCitySection('Пазарджик', 'pazardzhik', 'Пазарджик', 2, [[501, 510 ]], null, 5, 0);
  data += generateCitySection('Перник', 'pernik', 'Перник', 2, [[471, 480]], null, 5, 0);
  data += generateCitySection('Плевен', 'pleven', 'Плевен', 2, [[401, 420]], null, 10, 0);
  data += generateCitySection('Разград', 'razgrad', 'Разград', 2, [[621, 630]], null, 5, 0);
  data += generateCitySection('Русе', 'ruse', 'Русе', 2, [[361, 378]], [[379, 380]], 10, 0);
  data += generateCitySection('Силистра', 'silistra', 'Силистра', 2, [[611, 620]], null, 5, 0);
  data += generateCitySection('Сливен', 'sliven', 'Сливен', 2, [[421, 435]], null, 5, 0);
  data += generateCitySection('Смолян', 'smolian', 'Смолян', 2, [[631, 640]], null, 5, 0);
  data += generateCitySection('Стара Загора', 'stara-zagora', 'Ст. Загора', 2, [[381, 395]], [[396, 400]], 10, 0);
  data += generateCitySection('Търговище', 'turgovishte', 'Търговище', 2, [[591, 600]], null, 5, 0);
  data += generateCitySection('Хасково', 'haskovo', 'Хасково', 2, [[481, 490]], null, 5, 0);
  data += generateCitySection('Шумен', 'shumen', 'Шумен', 2, [[461, 470]], null, 5, 0);
  data += generateCitySection('Ямбол', 'iambol', 'Ямбол', 2, [[491, 500]], null, 5, 0);
  let header = generateDownloadCSVHeader();
  let a = document.getElementById('csvAll');
  a.setAttribute('download', 'nvo-data-all.csv');
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
  fixForYear2021();
  calculateMedians();
  generateCitySections();
  enableScrollButton();
  setDefaultClickedButtons();
  initializeHighcharts();
  redraw();
}
