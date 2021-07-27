let numSchools = 800;
let tracesm = [];
let tracesb = [];

function button(id) {
  return document.getElementById('b' + id);
}

function buttonEnabled(id) {
  if(document.getElementById('b' + id)) {
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

function getTrace(tName, tValues) {
  return {
    x: ['2017 г.', '2018 г.', '2019 г.', '2020 г.'],
    y: tValues,
    mode: 'lines+markers',
    connectgaps: true,
    name: tName
  }
}

function recalculate() {
  tracesm = [];
  tracesb = [];
  
  for(let i = 1; i <= numSchools; i++) {
    let b = document.getElementById('b' + i);
    if(buttonEnabled(i)) {
      let traceb = getTrace(s[i].n, s[i].b);
      let tracem = getTrace(s[i].n, s[i].m);
      
      tracesb.push(traceb);
      tracesm.push(tracem);
    }
  }
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
  
  recalculate();
  replot();
}

function getLayout(title) {
  return {
    title: title,
    showlegend: true,
    legend: {
      orientation: 'h',
      x: 0.01,
      y: -0.1
    },
    margin: {
      l: 30,
      r: 10,
      t: 25,
      b: 10
    }, annotations: [
      {
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: -0.05,
        xanchor: 'center',
        yanchor: 'top',
        showarrow: false,
        text: 'ivandavidov.github.io/nvo',
        font: {
          color: 'rgb(240,240,240)'
        }
      }
    ]
  }
}

function replot() {
  let opts = {
    displayModeBar: false,
    displaylogo: false,
    responsive: true,
    staticPlot: true
  }

  Plotly.newPlot('chartm', tracesm, getLayout('НВО - Математика'), opts);
  Plotly.newPlot('chartb', tracesb, getLayout('НВО - Български език'), opts);
}

function generateSchoolButtons(div, slices) {
  for(let i = 0; i < slices.length; i++) {
    for(let j = slices[i][0]; j <= slices[i][1]; j++) {
      if(!s[j]) {
        continue;
      }
      let b = document.createElement('button');
      b.id = 'b' + j;
      b.textContent = s[j].l;
      b.onclick = function() {toggleButton('' + j)};
      div.appendChild(b);
      div.appendChild(document.createTextNode('\u00A0'));
    }
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
  g.appendChild(document.createTextNode('\u00A0'));
}

function generateCitySection(name, hrName, btName, btPos, puSchools, prSchools) {
  generateCityMenu(btPos, btName, hrName);

  let schoolsDiv = document.getElementById('schools');
  generateRowWithHr(schoolsDiv, hrName);
  generateRowWithStrong(schoolsDiv, name);
  generateRowWithText(schoolsDiv, '\u00A0');
  generateRowWithText(schoolsDiv, 'Държавни училища');
  generateRowWithText(schoolsDiv, '\u00A0');
  let puDiv = generateRow(schoolsDiv);
  generateSchoolButtons(puDiv, puSchools);

  if(!prSchools) {
    return;
  }

  generateRowWithText(schoolsDiv, '\u00A0');
  generateRowWithText(schoolsDiv, 'Частни училища');
  generateRowWithText(schoolsDiv, '\u00A0');
  let prDiv = generateRow(schoolsDiv);
  generateSchoolButtons(prDiv, prSchools);
}

function fix2018() {
  for(let i = 1; i <= numSchools; i++) {
    if(!s[i]) {
      continue;
    }
    if(s[i].b[1] != null) {
      s[i].b[1] = s[i].b[1] * 100 / 65;
    }
    if(s[i].m[1] != null) {
      s[i].m[1] = s[i].m[1] * 100 / 65;
    }
  }
}

function onLoad() {
  fix2018();

  generateCitySection('София', 'sofia', 'София', 1, [[201, 210], [1, 200]], [[211, 250]]);
  generateCitySection('Пловдив', 'plovdiv', 'Пловдив', 1, [[251, 280]], [[281, 290]]);
  generateCitySection('Варна', 'varna', 'Варна', 1, [[291, 320]], [[321, 330]]);
  generateCitySection('Бургас', 'burgas', 'Бургас', 1, [[331, 350]], [[351, 360]]);

  generateCitySection('Добрич', 'dobrich', 'Добрич', 2, [[441, 455]], [[456, 460]]);
  generateCitySection('Плевен', 'pleven', 'Плевен', 2, [[401, 420]], null);
  generateCitySection('Русе', 'ruse', 'Русе', 2, [[361, 370]], [[376, 380]]);
  generateCitySection('Сливен', 'sliven', 'Сливен', 2, [[421, 435]], null);
  generateCitySection('Стара Загора', 'stara-zagora', 'Ст. Загора', 2, [[381, 390]], [[396, 400]]);

  setButtonState(20, true);
  setButtonState(201, true);

  document.getElementById('btnTop').onclick = function() {
    document.getElementById('hrCharts').scrollIntoView();
  }

  recalculate();
  replot();
}
