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
  s.forEach((o, i) => {
    if(buttonEnabled(i)) {
      tracesBel.push({name: o.n, data: o.b});
      tracesMat.push({name: o.n, data: o.m});
    }
  });
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
  return {
    title: {
      text: title
    },
    xAxis: {
      categories: ['2017', '2018', '2019', '2020']
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
      animation: false
    },
    plotOptions: {
      series: {
        animation:false
      }
    },
    credits: {
      enabled: false
    },
    tooltip: {
      animation: false
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
    let divider = o.b.length;
    for(let i = 0; i < 4; i++) {
      if(!o.b[i] || !o.m[i]) {
        --divider;
        continue;
      }
      mb += o.b[i];
      mm += o.m[i];
    }
    o.mb = mb / divider;
    o.mm = mm / divider;
  });
}

function useFixedColors() {
  let colors = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC'];
  let counter = 0;
  s.forEach((o) => {o.c = colors[++counter % colors.length];});
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

function onLoad() {
  fixForYear2018();
  calculateMedians();
  //useFixedColors(); // Използваемостта е под въпрс, защото графиките се променят динамично.
  generateCitySections();
  enableScrollButton();
  setDefaultClickedButtons();
  redraw();
}
