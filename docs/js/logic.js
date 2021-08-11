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
  let noSchool = {name: 'Изберете поне едно училище', data: [50, 50, 50, 50]};
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

function getLayout(title, series) {
  let categories = [];
  let first = 2017;
  for(let i = 0; i < s[1].b.length; i++) {
    categories.push((first + i) + '');
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

function redraw() {
  let traces = recalculate();
  Highcharts.chart(chartb, getLayout('НВО - Български език', traces.b));
  Highcharts.chart(chartm, getLayout('НВО - Математика', traces.m));
}

function generateSchoolButtons(div, slices, topCount) {
  let schools = null;
  let topBtn = null;
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
    let sortFunc = (i1, i2) => (s[i1].mb + s[i1].mm) / 2 < (s[i2].mb + s[i2].mm) / 2 ? 1 : -1;
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

function generateCitySection(name, hrName, btName, btPos, puSchools, prSchools, topPuCount, topPrCount) {
  generateCityMenu(btPos, btName, hrName);
  let schoolsDiv = document.getElementById('schools');
  generateRowWithHr(schoolsDiv, hrName);
  generateRowWithStrong(schoolsDiv, name);
  generateRowWithText(schoolsDiv, '\u00A0');
  generateRowWithText(schoolsDiv, 'Държавни училища');
  generateRowWithText(schoolsDiv, '\u00A0');
  let puDiv = generateRow(schoolsDiv);
  generateSchoolButtons(puDiv, puSchools, topPuCount);
  if(!prSchools) {
    return;
  }
  generateRowWithText(schoolsDiv, '\u00A0');
  generateRowWithText(schoolsDiv, 'Частни училища');
  generateRowWithText(schoolsDiv, '\u00A0');
  let prDiv = generateRow(schoolsDiv);
  generateSchoolButtons(prDiv, prSchools, topPrCount);
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
  setButtonState(20, true);
  setButtonState(201, true);
}

function enableScrollButton() {
  let btnTop = document.getElementById('btnTop');
  btnTop.style.display = 'block';
  btnTop.onclick = () => document.getElementById('hrCharts').scrollIntoView();
}

function generateCitySections() {
  generateCitySection('София', 'sofia', 'София', 1, [[201, 210], [1, 200]], [[211, 250]], 10, 10);
  generateCitySection('Пловдив', 'plovdiv', 'Пловдив', 1, [[251, 280]], [[281, 290]], 10, 0);
  generateCitySection('Варна', 'varna', 'Варна', 1, [[291, 320]], [[321, 330]], 5, 0);
  generateCitySection('Бургас', 'burgas', 'Бургас', 1, [[331, 350]], [[351, 360]], 5, 0);
  generateCitySection('Благоевград', 'blagoevgrad', 'Благоевград', 2, [[511, 520]], null, 5, 0);
  generateCitySection('Велико Търново', 'veliko-turnovo', 'В. Търново', 2, [[521, 530]], null, 5, 0);
  generateCitySection('Видин', 'vidin', 'Видин', 2, [[551, 560]], null, 5, 0);
  generateCitySection('Враца', 'vratsa', 'Враца', 2, [[531, 540]], null, 5, 0);
  generateCitySection('Габрово', 'gabrovo', 'Габрово', 2, [[541, 550]], null, 5, 0);
  generateCitySection('Добрич', 'dobrich', 'Добрич', 2, [[441, 455]], [[456, 460]], 5, 0);
  generateCitySection('Кърджали', 'kurdzhali', 'Кърджали', 2, [[581, 590]], null, 5, 0);
  generateCitySection('Кюстендил', 'kiustendil', 'Кюстендил', 2, [[571, 580]], null, 5, 0);
  generateCitySection('Ловеч', 'lovech', 'Ловеч', 2, [[601, 610]], null, 5, 0);
  generateCitySection('Монтана', 'montana', 'Монтана', 2, [[561, 570]], null, 5, 0);
  generateCitySection('Пазарджик', 'pazardzhik', 'Пазарджик', 2, [[501, 510 ]], null, 5, 0);
  generateCitySection('Перник', 'pernik', 'Перник', 2, [[471, 480]], null, 5, 0);
  generateCitySection('Плевен', 'pleven', 'Плевен', 2, [[401, 420]], null, 5, 0);
  generateCitySection('Разград', 'razgrad', 'Разград', 2, [[621, 630]], null, 5, 0);
  generateCitySection('Русе', 'ruse', 'Русе', 2, [[361, 370]], [[376, 380]], 5, 0);
  generateCitySection('Силистра', 'silistra', 'Силистра', 2, [[611, 620]], null, 5, 0);
  generateCitySection('Сливен', 'sliven', 'Сливен', 2, [[421, 435]], null, 5, 0);
  generateCitySection('Смолян', 'smolian', 'Смолян', 2, [[631, 640]], null, 5, 0);
  generateCitySection('Стара Загора', 'stara-zagora', 'Ст. Загора', 2, [[381, 390]], [[396, 400]], 5, 0);
  generateCitySection('Търговище', 'turgovishte', 'Търговище', 2, [[591, 600]], null, 5, 0);
  generateCitySection('Хасково', 'haskovo', 'Хасково', 2, [[481, 490]], null, 5, 0);
  generateCitySection('Шумен', 'shumen', 'Шумен', 2, [[461, 470]], null, 5, 0);
  generateCitySection('Ямбол', 'iambol', 'Ямбол', 2, [[491, 500]], null, 5, 0);
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
  calculateMedians();
  generateCitySections();
  enableScrollButton();
  setDefaultClickedButtons();
  initializeHighcharts();
  redraw();
}
