function button(id) {
  return document.getElementById('b' + id);
}

function buttonEnabled(id) {
  let btn = button(id);
  if(btn) {
    return btn.classList.contains('button-primary');
  }
  return false;
}

function setButtonState(id, state) {
  let btn = button(id);
  if(btn === null) {
    return;
  }
  if(state === true) {
    btn.classList.add('button-primary');
    selectedSchoolIndices.add(Number(id));
  } else {
    btn.classList.remove('button-primary');
    selectedSchoolIndices.delete(Number(id));
  }
}

function getDefaultClickedButtonIds() {
  let url = new URL(window.location.href);
  let indices = url.searchParams.get(cookieName);
  if(indices) {
    return indices.split(',').map((i) => i.split('#')[0]).filter((i) => i !== '');
  }
  let cookieMatch = (document.cookie + ';').match(new RegExp(cookieName + '=.*;'));
  if(cookieMatch) {
    let cookieIndices = cookieMatch[0].split(/=|;/)[1].split('#')[0];
    if(cookieIndices) {
      return cookieIndices.split(',').filter((i) => i !== '');
    }
  }
  return [String(baseSchoolIndex), String(refSchoolIndex)];
}

function applyPendingSelectedButtons() {
  if(!pendingSelectedButtonIds || pendingSelectedButtonIds.size === 0) {
    return false;
  }
  let changed = false;
  [...pendingSelectedButtonIds].forEach((id) => {
    if(button(id)) {
      setButtonState(id, true);
      pendingSelectedButtonIds.delete(id);
      changed = true;
    }
  });
  if(pendingSelectedButtonIds.size === 0) {
    pendingSelectedButtonIds = null;
  }
  return changed;
}

function recalculate() {
  let tracesBel = [];
  let tracesMat = [];
  let indices = [];
  let dataNoSchool = [];
  for(let i = 0; i < numYears; i++) {
    dataNoSchool.push(chartNoSchool);
  }
  let noSchool = {name: 'Изберете поне едно училище', data: dataNoSchool};
  selectedSchoolIndices.forEach((i) => {
    if(s[i]) {
      indices.push(i);
      tracesBel.push({name: s[i].n, data: s[i].b, schoolIndex: i, subject: 'b'});
      tracesMat.push({name: s[i].n, data: s[i].m, schoolIndex: i, subject: 'm'});
    }
  });
  if(tracesBel.length === 0 || tracesMat.length === 0) {
    tracesBel.push(noSchool);
    tracesMat.push(noSchool);
  }
  let sortFunc = (t1, t2) => (t1.data[t1.data.length - 1]) < (t2.data[t2.data.length - 1]) ? 1 : -1;
  tracesBel.sort(sortFunc);
  tracesMat.sort(sortFunc);
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
  let hasAnyValues = () => series.some((s) => s.data && s.data.length > 0);
  while(hasAnyValues() && !series.some(s => s.data[0])) {
    for(let i = 0; i < series.length; i++) {
      series[i].data = series[i].data.slice(1);
    }
  }
  let counter = 0;
  while(hasAnyValues() && !series.some(s => s.data[s.data.length - 1])) {
    for(let i = 0; i < series.length; i++) {
      series[i].data = series[i].data.slice(0, series[i].data.length - 1);
    }
    ++counter;
  }
  return counter;
}

function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function getLayout(title, series, exportPrefix) {
  let removedYears = normalizeSeries(series);
  let lastYear = firstYear - 1 + s[baseSchoolIndex].b.length - removedYears;
  let categories = [];
  for(let i = 0; i < series[0].data.length; i++) {
    categories.push(lastYear - (series[0].data.length - i - 1) + '');
  }
  let dark = isDarkTheme();
  let textColor = dark ? '#e2e8f0' : '#1e293b';
  let mutedColor = dark ? '#94a3b8' : '#64748b';
  let gridColor = dark ? '#334155' : '#e2e8f0';
  let tooltipBg = dark ? '#1e293b' : '#ffffff';
  let tooltipBorder = dark ? '#334155' : '#e2e8f0';
  return {
    title: {
      text: title,
      style: {
        fontSize: '1.50em',
        color: textColor
      }
    },
    xAxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '1.25em',
          color: mutedColor
        }
      },
      lineColor: gridColor,
      tickColor: gridColor
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        style: {
          fontSize: '1.25em',
          color: mutedColor
        }
      },
      gridLineColor: gridColor,
      floor: chartFloor,
      ceiling: chartCeiling
    },
    legend: {
      layout: 'horizontal',
      align: 'left',
      itemStyle: {
        fontSize: '1.25em',
        color: textColor
      },
      itemHoverStyle: {
        color: dark ? '#ffffff' : '#000000'
      }
    },
    chart: {
      animation: false,
      height: Math.max(Math.floor(Math.min(window.innerWidth, window.innerHeight) * CHART_HEIGHT_PERCENT), CHART_MIN_HEIGHT_PX),
      backgroundColor: 'transparent'
    },
    plotOptions: {
      series: {
        animation:false
      }
    },
    credits: {
      enabled: true,
      style: {
        color: mutedColor
      }
    },
    tooltip: {
      animation: false,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      style: {
        fontSize: '1.25em',
        color: textColor
      },
      formatter: function() {
        let options = this.series && this.series.userOptions ? this.series.userOptions : {};
        let yearValue = this.category;
        if(yearValue === undefined || yearValue === null || yearValue === '') {
          yearValue = this.x;
        }
        if((yearValue === undefined || yearValue === null || yearValue === '') && this.series && this.series.xAxis && this.point && Number.isInteger(this.point.x)) {
          let categories = this.series.xAxis.categories || [];
          if(categories[this.point.x] !== undefined) {
            yearValue = categories[this.point.x];
          }
        }
        let yearText = yearValue === undefined || yearValue === null || yearValue === '' ? '-' : String(yearValue);
        let year = Number.parseInt(yearText, 10);
        let students = null;
        if(Number.isInteger(options.schoolIndex)) {
          if(!Number.isFinite(year) && this.series && this.series.xAxis && this.point && Number.isInteger(this.point.x)) {
            let categories = this.series.xAxis.categories || [];
            if(categories[this.point.x] !== undefined) {
              yearText = String(categories[this.point.x]);
              year = Number.parseInt(yearText, 10);
            }
          }
          let yearIndex = Number.isFinite(year) ? year - firstYear : -1;
          let school = s[options.schoolIndex];
          if(school && yearIndex >= 0) {
            let counts = options.subject === 'b' ? school.bu : school.mu;
            if(counts && yearIndex < counts.length) {
              students = counts[yearIndex];
            }
          }
        }
        let valueText = this.y === null || this.y === undefined ? '-' : Highcharts.numberFormat(this.y, 2, '.', '');
        let points = '<b>' + this.series.name + '</b>';
        points += '<br/>Година: <b>' + yearText + '</b>';
        points += '<br/>Резултат: <b>' + valueText + '</b>';
        if(students !== null && students !== undefined && students !== '') {
          points += '<br/>Ученици: <b>' + students + '</b>';
        }
        return points;
      }
    },
    exporting: {
      enabled: false
    },
    series: series
  }
}

function handleURL(indices) {
  let url = new URL(window.location.href);
  let anchor = url.hash.replace('#', '');
  let baseURL = url.origin + url.pathname;
  if(indices.length === 0) {
    document.cookie = cookieName + '=;path=/;max-age=-1';
    window.history.replaceState(indices, null, anchor ? baseURL + '#' + anchor : baseURL);
  } else {
    let endURL = indices.join(',');
    document.cookie = cookieName + '=' + endURL + ';path=/;max-age=' + COOKIE_MAX_AGE_SECONDS;
    if(anchor) {
      endURL += '#' + anchor;
    }
    window.history.replaceState(indices, null, baseURL + '?' + cookieName + '=' + endURL);
  }
}

function redraw() {
  let traces = recalculate();
  handleURL(traces.i);
  let belLayout = getLayout(chartBTitle, traces.b, exportPrefixBel);
  let matLayout = getLayout(chartMTitle, traces.m, exportPrefixMat);
  if(chartBelInstance) {
    chartBelInstance.update(belLayout, true, true, false);
  } else {
    chartBelInstance = Highcharts.chart('chartb', belLayout);
  }
  if(chartMatInstance) {
    chartMatInstance.update(matLayout, true, true, false);
  } else {
    chartMatInstance = Highcharts.chart('chartm', matLayout);
  }
}

function debounceRedrawOnResize() {
  if(resizeRedrawTimeout) {
    clearTimeout(resizeRedrawTimeout);
  }
  resizeRedrawTimeout = setTimeout(() => {
    resizeRedrawTimeout = null;
    redraw();
  }, RESIZE_REDRAW_DEBOUNCE_MS);
}

function initializeHighcharts() {
  window.addEventListener('resize', debounceRedrawOnResize);
}
