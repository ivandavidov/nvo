function generateYearRankingLinks() {
  let container = document.getElementById('yearRankings');
  if(!container) {
    return;
  }
  let pathname = window.location.pathname || '/';
  let gradeMatch = pathname.match(/\/(?:4|7|10|12)(?:\/|$)/);
  if(!gradeMatch) {
    return;
  }
  let grade = gradeMatch[0].replace(/\//g, '');
  let latestYear = firstYear + s[baseSchoolIndex].b.length - 1;
  container.textContent = '';
  for(let year = latestYear; year >= firstYear; year--) {
    if(year < latestYear) {
      container.appendChild(document.createTextNode(' '));
    }
    let a = document.createElement('a');
    a.href = year + '/';
    a.textContent = year;
    container.appendChild(a);
  }
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
    let baseHref = '../' + grade + '/?year=';
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

function generateJoke() {
  let j = randomJoke();
  let divJoke = document.getElementById('jokeQuote');
  let divAuthor = document.getElementById('jokeAuthor');
  if(divJoke) { divJoke.innerText = '"' + j.q + '"'; }
  if(divAuthor) { divAuthor.innerText = j.a; }
}

function onLoad() {
  generateJoke();
  generateYearRankingLinks();
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
