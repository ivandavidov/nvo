function getRenderableCitiesFromData() {
  let cities = [];
  Object.keys(si).forEach((name) => {
    let cityData = si[name] || {};
    let renderOrderIndex = cityRenderOrderIndex(cityData.i);
    if(renderOrderIndex === null) {
      console.warn('Skipping city "' + name + '" because render index "i" is missing in schools data.');
      return;
    }
    let cityCsvData = generateCityData(name);
    if(!cityCsvData) {
      return;
    }
    cities.push({
      name: name,
      hrName: cityData.h ? String(cityData.h) : fallbackCityHrefName(name),
      btName: cityData.l ? String(cityData.l) : String(name),
      btPos: cityMenuOrderPosition(cityData.o),
      i: renderOrderIndex,
      data: cityCsvData
    });
  });
  cities.sort((c1, c2) => c1.i - c2.i);
  return cities;
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
    let selected = 0;
    for(let i = start; i < schools.length && selected < count; i++) {
      if(!schools[i] || !s[schools[i]] || s[schools[i]].b[s[schools[i]].b.length - 1] === null) {
        continue;
      }
      setButtonState(schools[i], state);
      ++selected;
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

function generateCityData(name) {
  let schoolGroups = getCitySchoolGroups(name);
  if(!schoolGroups) {
    return '';
  }
  let puSchools = schoolGroups.puSchools;
  let prSchools = schoolGroups.prSchools;
  if(!hasRenderableCitySchools(puSchools, prSchools)) {
    return '';
  }
  let data = generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
    data += generateDownloadForCity(name, prSchools, 'Ч');
  }
  return data;
}

function createCityPlaceholder(hrName) {
  let schoolsDiv = document.getElementById('schools');
  if(!schoolsDiv) {
    return;
  }
  let placeholder = document.createElement('div');
  placeholder.classList.add('row');
  placeholder.id = 'ph-' + hrName;
  placeholder.dataset.hrName = hrName;
  schoolsDiv.appendChild(placeholder);
}

function renderLazyCitySection(entry) {
  if(!entry || entry.rendered) {
    return;
  }
  let placeholder = document.getElementById('ph-' + entry.hrName);
  generateCitySection(entry.name, entry.hrName, entry.btName, entry.btPos, true, entry.data, placeholder);
  if(placeholder) {
    placeholder.remove();
  }
  entry.rendered = true;
  let changed = applyPendingSelectedButtons();
  if(changed && chartBelInstance && chartMatInstance) {
    redraw();
  }
}

function initLazyCitySections(entries) {
  if(!entries || entries.length === 0) {
    return;
  }
  let byHrName = {};
  entries.forEach((entry) => {
    byHrName[entry.hrName] = entry;
  });
  let scrollToAnchor = (hrName) => {
    let anchor = document.getElementById(hrName);
    if(anchor) {
      anchor.scrollIntoView();
    }
  };
  let renderByHash = () => {
    let hrName = window.location.hash.replace('#', '');
    if(hrName && byHrName[hrName]) {
      let targetIndex = entries.findIndex((entry) => entry.hrName === hrName);
      if(targetIndex < 0) {
        return;
      }
      for(let i = 0; i <= targetIndex; i++) {
        renderLazyCitySection(entries[i]);
      }
      requestAnimationFrame(() => scrollToAnchor(hrName));
    }
  };
  renderByHash();
  window.addEventListener('hashchange', renderByHash);
  if(typeof window.IntersectionObserver !== 'function') {
    entries.forEach((entry) => renderLazyCitySection(entry));
    return;
  }
  let observer = new window.IntersectionObserver((rows) => {
    rows.forEach((row) => {
      if(!row.isIntersecting) {
        return;
      }
      let hrName = row.target.dataset.hrName;
      if(!hrName || !byHrName[hrName]) {
        return;
      }
      renderLazyCitySection(byHrName[hrName]);
      observer.unobserve(row.target);
    });
  }, { rootMargin: '400px 0px' });
  entries.forEach((entry) => {
    let placeholder = document.getElementById('ph-' + entry.hrName);
    if(placeholder) {
      observer.observe(placeholder);
    }
  });
}

function generateCitySection(name, hrName, btName, btPos, skipMenu, precomputedData, mountBeforeNode) {
  let schoolGroups = getCitySchoolGroups(name);
  if(!schoolGroups) {
    return '';
  }
  let puSchools = schoolGroups.puSchools;
  let prSchools = schoolGroups.prSchools;
  if(!precomputedData && !hasRenderableCitySchools(puSchools, prSchools)) {
    return '';
  }
  const { topCount: topPuCount, secondCount: secondPuCount } = getSchoolCounts(puSchools);
  if(!skipMenu) {
    generateCityMenu(btPos, btName, hrName);
  }
  let schoolsDivFragment = document.createDocumentFragment();
  generateRowWithHr(schoolsDivFragment, hrName);
  let cityDiv = generateRowWithStrong(schoolsDivFragment, name);
  generateHTMLTable(schoolsDivFragment, hrName, puSchools, prSchools, name);
  generateRowWithText(schoolsDivFragment, '\u00A0');
  generateRowWithText(schoolsDivFragment, 'Държавни училища');
  generateRowWithText(schoolsDivFragment, '\u00A0');
  let puDiv = generateRow(schoolsDivFragment);
  generateSchoolButtons(puDiv, puSchools, topPuCount, secondPuCount);
  let data = precomputedData ? precomputedData : generateDownloadForCity(name, puSchools, 'Д');
  if(prSchools) {
    const { topCount: topPrCount, secondCount: secondPrCount } = getSchoolCounts(prSchools);
    generateRowWithText(schoolsDivFragment, '\u00A0');
    generateRowWithText(schoolsDivFragment, 'Частни училища');
    generateRowWithText(schoolsDivFragment, '\u00A0');
    let prDiv = generateRow(schoolsDivFragment);
    generateSchoolButtons(prDiv, prSchools, topPrCount, secondPrCount);
    if(!precomputedData) {
      data += generateDownloadForCity(name, prSchools, 'Ч');
    }
  }
  generateDownloadCSVLink(cityDiv, hrName, name, data);
  let schoolsDiv = document.getElementById('schools');
  if(schoolsDiv) {
    if(mountBeforeNode && mountBeforeNode.parentNode === schoolsDiv) {
      schoolsDiv.insertBefore(schoolsDivFragment, mountBeforeNode);
    } else {
      schoolsDiv.appendChild(schoolsDivFragment);
    }
  }
  return data;
}

function generateCitySections() {
  let data = '';
  let lazyEntries = [];
  let cities = getRenderableCitiesFromData();
  let selectedIndices = getDefaultClickedButtonIds()
    .map((i) => Number.parseInt(i, 10))
    .filter((i) => Number.isInteger(i));
  cities.forEach((city) => {
    data += city.data;
    generateCityMenu(city.btPos, city.btName, city.hrName);
    createCityPlaceholder(city.hrName);
    lazyEntries.push({
      name: city.name,
      hrName: city.hrName,
      btName: city.btName,
      btPos: city.btPos,
      data: city.data,
      rendered: false
    });
  });
  let header = generateDownloadCSVHeader();
  let a = document.getElementById('csvAll');
  if(a) {
    setCsvDownloadLink(a, exportPrefix + '-data-all.csv', header + data);
  }
  if(lazyEntries.length > 0) {
    renderLazyCitySection(lazyEntries[0]);
    lazyEntries.forEach((entry) => {
      if(entry.rendered) {
        return;
      }
      if(selectedIndices.some((i) => cityContainsSchoolIndex(entry.name, i))) {
        renderLazyCitySection(entry);
      }
    });
  }
  initLazyCitySections(lazyEntries);
}
