let numSchools = 800;

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

let tracesm = [];
let tracesb = [];

function recalculate() {
  tracesm = [];
  tracesb = [];
  
  for(let i = 1; i <= numSchools; i++) {
    let b = document.getElementById('b' + i);
    if(buttonEnabled(i)) {
      let tracem = {
        x: ['2017 г.', '2018 г.', '2019 г.', '2020 г.'],
        y: s[i].m,
        mode: 'lines+markers',
        name: s[i].n
      };
      let traceb = {
        x: ['2017 г.', '2018 г.', '2019 г.', '2020 г.'],
        y: s[i].b,
        mode: 'lines+markers',
        name: s[i].n
      };
      
      tracesm.push(tracem);
      tracesb.push(traceb);
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

function replot() {
  let opts = {
    displayModeBar: false,
    displaylogo: false,
    responsive: true,
    staticPlot: true
  }

  let layoutm = {
    title: 'НВО - Математика',
    showlegend: true,
    legend: {
      orientation: 'h',
      x: 0.01,
      y: -0.1
    }
  }

  let layoutb = {
    title: 'НВО - Български език',
    showlegend: true,
    legend: {
      orientation: 'h',
      x: 0.01,
      y: -0.1
    }
  }

  Plotly.newPlot('chartm', tracesm, layoutm, opts);
  Plotly.newPlot('chartb', tracesb, layoutb, opts);
}

function loadButtons(begin, end) {
  let scripts = document.getElementsByTagName('script');
  let div = scripts[scripts.length - 1].parentNode;
  for(let i = begin; i <= end; i++) {
    school = s[i];
    if(!school) {
      continue;
    }
    let button = document.createElement('button');
    button.id = 'b' + i;
    button.appendChild(document.createTextNode(s[i].l));
    div.appendChild(button);
    div.appendChild(document.createTextNode(' '));
  }
}

function setChartsButton() {
  let btnTop = document.createElement('button');

  btnTop.id = 'btnTop';
  btnTop.classList.add('button-primary');
  btnTop.style.position = 'fixed';
  btnTop.style.bottom = '1%';
  btnTop.style.right = '1%';
  btnTop.style.zIndex = '99';
  btnTop.style.display = 'block';
  btnTop.appendChild(document.createTextNode('↑'));
  
  btnTop.onclick = function() {
    document.getElementById('chartm').scrollIntoView();
  }
  
  document.body.appendChild(btnTop);
}

function onLoad() {
  for(let i = 1; i <= numSchools; i++) {
    let b = document.getElementById('b' + i);
    if(b) {
      b.onclick = function() {toggleButton('' + i)};
      
      // Fix for year 2018 (max base is 65, rebase it to 100)
      if(s[i].m[1] != null) {
        s[i].m[1] = s[i].m[1] * 100 / 65;
      }
      if(s[i].b[1] != null) {
        s[i].b[1] = s[i].b[1] * 100 / 65;
      }
    }
  }
  
  document.getElementById('chartm').style.width = '100%';
  document.getElementById('chartm').style.height = '100%';
  document.getElementById('chartb').style.width = '100%';
  document.getElementById('chartb').style.height = '100%';

  setButtonState(20, true);
  setButtonState(201, true);
  
  document.getElementsByTagName('html')[0].style.scrollBehavior = 'smooth';
  
  setChartsButton();
  
  recalculate();
  replot();
}
