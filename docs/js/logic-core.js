var chartBelInstance = null;
var chartMatInstance = null;
var resizeRedrawTimeout = null;
var pendingSelectedButtonIds = null;
var rankingTableBuilders = {};
var selectedSchoolIndices = new Set();
var pdfFontBase64Promise = null;

function getAppBasePath() {
  let pathname = window.location.pathname || '/';
  let match = pathname.match(/^(.*\/)(?:4|7|10|12|stats)(?:\/|$)/);
  if(match && match[1]) {
    return match[1];
  }
  if(pathname.endsWith('/')) {
    return pathname;
  }
  let lastSlash = pathname.lastIndexOf('/');
  return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : '/';
}

function resolveAssetPath(pathFromAppRoot) {
  if(!pathFromAppRoot) {
    return pathFromAppRoot;
  }
  if(/^(?:[a-z]+:)?\/\//i.test(pathFromAppRoot) || pathFromAppRoot.startsWith('data:') || pathFromAppRoot.startsWith('/')) {
    return pathFromAppRoot;
  }
  let normalized = pathFromAppRoot.replace(/^\.?\//, '');
  return new URL(normalized, window.location.origin + getAppBasePath()).toString();
}

function getCurrentGradeFromPath() {
  let pathname = window.location.pathname || '';
  let match = pathname.match(/\/(4|7|10|12)(?:\/|$)/);
  return match ? Number.parseInt(match[1], 10) : 7;
}

function getGradePagePath(grade) {
  let parsed = Number.parseInt(grade, 10);
  if(![4, 7, 10, 12].includes(parsed)) {
    return resolveAssetPath('7/');
  }
  return resolveAssetPath(parsed + '/');
}

function getStatsPagePath(grade) {
  let parsed = Number.parseInt(grade, 10);
  let safeGrade = [4, 7, 10, 12].includes(parsed) ? parsed : 7;
  return resolveAssetPath('stats/?grade=' + safeGrade);
}

function toggleOtherCities() {
  let content = document.getElementById('other-cities-content');
  let toggle = document.getElementById('other-cities-toggle');
  if(!content || !toggle) {
    return;
  }
  if(content.classList.contains('other-cities-collapsed')) {
    content.classList.remove('other-cities-collapsed');
    toggle.textContent = 'Затвори \u25B2';
  } else {
    content.classList.add('other-cities-collapsed');
    toggle.textContent = 'Отвори \u25BC';
  }
}

function safeDivide(numerator, denominator, fallback = 0) {
  return denominator ? numerator / denominator : fallback;
}

function cityContainsSchoolIndex(cityName, schoolIndex) {
  let schoolGroups = getCitySchoolGroups(cityName);
  if(!schoolGroups) {
    return false;
  }
  let pu = schoolGroups.puSchools;
  if(pu && schoolIndex >= pu[0] && schoolIndex <= pu[1]) {
    return true;
  }
  let pr = schoolGroups.prSchools;
  if(pr && schoolIndex >= pr[0] && schoolIndex <= pr[1]) {
    return true;
  }
  return false;
}

function findCityForSchool(schoolIndex) {
  let cityNames = Object.keys(si);
  for(let c = 0; c < cityNames.length; c++) {
    let cityName = cityNames[c];
    let groups = getCitySchoolGroups(cityName);
    if(!groups) { continue; }
    let pu = groups.puSchools;
    if(pu && schoolIndex >= pu[0] && schoolIndex <= pu[1]) {
      return { cityName: cityName, isPrivate: false };
    }
    let pr = groups.prSchools;
    if(pr && schoolIndex >= pr[0] && schoolIndex <= pr[1]) {
      return { cityName: cityName, isPrivate: true };
    }
  }
  return null;
}

function calculateNationalAverages() {
  let totalYears = s[baseSchoolIndex].b.length;
  let natB = [];
  let natM = [];
  for(let y = 0; y < totalYears; y++) {
    let sumB = 0, countB = 0, sumM = 0, countM = 0;
    s.forEach((o) => {
      if(o && o.b[y]) { sumB += o.b[y]; countB++; }
      if(o && o.m[y]) { sumM += o.m[y]; countM++; }
    });
    natB.push(countB > 0 ? sumB / countB : 0);
    natM.push(countM > 0 ? sumM / countM : 0);
  }
  return { b: natB, m: natM };
}

function getCitySchoolGroups(cityName) {
  let cityData = si[cityName];
  if(!cityData) {
    return null;
  }
  if(!Array.isArray(cityData.n) || cityData.n.length < 2) {
    return null;
  }
  return {
    puSchools: cityData.n,
    prSchools: Array.isArray(cityData.p) && cityData.p.length >= 2 ? cityData.p : null
  };
}

function hasSchoolsWithLatestYearData(schoolRange) {
  if(!Array.isArray(schoolRange) || schoolRange.length < 2) {
    return false;
  }
  let start = schoolRange[0];
  let end = schoolRange[1];
  if(!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    return false;
  }
  for(let i = start; i <= end; i++) {
    if(s[i] && s[i].b[s[i].b.length - 1] && s[i].m[s[i].m.length - 1]) {
      return true;
    }
  }
  return false;
}

function hasRenderableCitySchools(puSchools, prSchools) {
  return hasSchoolsWithLatestYearData(puSchools) || hasSchoolsWithLatestYearData(prSchools);
}

function fallbackCityHrefName(cityName) {
  return String(cityName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function cityMenuOrderPosition(value) {
  let parsed = Number.parseInt(value, 10);
  if(Number.isInteger(parsed) && parsed >= 1 && parsed <= 3) {
    return parsed;
  }
  return 3;
}

function cityRenderOrderIndex(value) {
  let parsed = Number.parseInt(value, 10);
  if(Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }
  return null;
}

function setCsvDownloadLink(link, filename, csvContent) {
  if(!link) {
    return;
  }
  link.setAttribute('download', filename);
  if(window.Blob && window.URL && window.URL.createObjectURL) {
    let oldUrl = link.dataset.csvObjectUrl;
    if(oldUrl) {
      window.URL.revokeObjectURL(oldUrl);
    }
    let blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    let objectUrl = window.URL.createObjectURL(blob);
    link.setAttribute('href', objectUrl);
    link.dataset.csvObjectUrl = objectUrl;
    return;
  }
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
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
      si[o].mnbs[i] = safeDivide(sumNB, si[o].n[1] - si[o].n[0] + 1 - nullNB, 0);
      si[o].mnms[i] = safeDivide(sumNM, si[o].n[1] - si[o].n[0] + 1 - nullNM, 0);
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
        si[o].mpbs[i] = safeDivide(sumPB, si[o].p[1] - si[o].p[0] + 1 - nullPB, 0);
        si[o].mpms[i] = safeDivide(sumPM, si[o].p[1] - si[o].p[0] + 1 - nullPM, 0);
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
      si[o].mnba[i] = safeDivide(sumNB, attendeesNB, 0);
      si[o].mnma[i] = safeDivide(sumNM, attendeesNM, 0);
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
        si[o].mpba[i] = safeDivide(sumPB, attendeesPB, 0);
        si[o].mpma[i] = safeDivide(sumPM, attendeesPM, 0);
        }
    }
  });
}

function calculateTimeTravel() {
  let url = new URL(window.location.href);
  let yearParam = url.searchParams.get('year');
  if(!yearParam) {
    return;
  }
  let parsedYear = Number.parseInt(yearParam, 10);
  if(!Number.isInteger(parsedYear)) {
    return;
  }
  let currentYear = firstYear + s[baseSchoolIndex].b.length - 1;
  let minYear = Math.max(NAV_FIRST_YEAR, firstYear);
  let maxYear = currentYear - 1;
  if(maxYear < minYear) {
    return;
  }
  let targetYear = Math.min(Math.max(parsedYear, minYear), maxYear);
  removeYears(currentYear - targetYear);
  numYears = 3;
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
