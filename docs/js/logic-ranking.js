function createMedianTableHeader(tHead, hasPrivate) {
  if(hasPrivate) {
    let headTrMedian = document.createElement('tr');
    tHead.appendChild(headTrMedian);
    let th = document.createElement('th');
    th.style.borderBottom = 'none';
    th.appendChild(document.createTextNode('\u00A0'));
    headTrMedian.appendChild(th);
    th = document.createElement('th');
    th.style.borderBottom = 'none';
    th.colSpan = 2;
    th.style.textAlign = 'center';
    th.appendChild(document.createTextNode('Държавни'));
    headTrMedian.appendChild(th);
    th = document.createElement('th');
    th.style.borderBottom = 'none';
    th.colSpan = 2;
    th.style.textAlign = 'center';
    th.appendChild(document.createTextNode('Частни'));
    headTrMedian.appendChild(th);
  }
  let headers = hasPrivate
    ? ['Година', csvHeaderBel, csvHeaderMat, csvHeaderBel, csvHeaderMat]
    : ['Година', csvHeaderBel, csvHeaderMat];
  let headTrMedian = document.createElement('tr');
  tHead.appendChild(headTrMedian);
  headers.forEach((header) => {
    let th = document.createElement('th');
    th.style.overflow = 'hidden';
    th.style.whiteSpace = 'nowrap';
    th.appendChild(document.createTextNode(header));
    headTrMedian.appendChild(th);
  });
}

function createMedianTableBody(tBody, name, hasPrivate, pubBelKey, pubMatKey, priBelKey, priMatKey) {
  for(let i = s[baseSchoolIndex].b.length - 1; i >= s[baseSchoolIndex].b.length - numYears; i--) {
    let tr = document.createElement('tr');
    tBody.appendChild(tr);
    let td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode(firstYear + i));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name][pubBelKey][i] * 100) / 100).toFixed(2)));
    td = document.createElement('td');
    tr.appendChild(td);
    td.appendChild(document.createTextNode((Math.round(si[name][pubMatKey][i] * 100) / 100).toFixed(2)));
    if(hasPrivate) {
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name][priBelKey][i] * 100) / 100).toFixed(2)));
      td = document.createElement('td');
      tr.appendChild(td);
      td.appendChild(document.createTextNode((Math.round(si[name][priMatKey][i] * 100) / 100).toFixed(2)));
    }
  }
}

function generateCityMedianTables(el, name) {
  let medianMenu = generateRow(el);
  medianMenu.style.display = 'flex';
  medianMenu.style.alignItems = 'center';
  medianMenu.style.justifyContent = 'center';
  let medianTextSchools = document.createElement('span');
  medianTextSchools.textContent = 'Училища';
  medianTextSchools.id = 'medianTextSchools'+ si[name].n[0];
  medianTextSchools.style.display = 'block';
  medianMenu.appendChild(medianTextSchools);
  let aSchools = document.createElement('a');
  medianMenu.appendChild(aSchools);
  aSchools.id = 'medianMenuSchools' + si[name].n[0];
  aSchools.style.display = 'none';
  aSchools.style.cursor = 'pointer';
  aSchools.appendChild(document.createTextNode('Училища'));
  aSchools.onclick = () => {
    tableMedianSchools.style.display = 'block';
    tableMedianAttendees.style.display = 'none';
    aSchools.style.display = 'none';
    medianTextSchools.style.display = 'block';
    aAttendees.style.display = 'block';
    medianTextAttendees.style.display = 'none';
  }
  medianMenu.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  let medianTextAttendees = document.createElement('span');
  medianTextAttendees.textContent = 'Ученици';
  medianTextAttendees.id = 'medianTextAttendees'+ si[name].n[0];
  medianTextAttendees.style.display = 'none';
  medianMenu.appendChild(medianTextAttendees);
  let aAttendees = document.createElement('a');
  medianMenu.appendChild(aAttendees);
  aAttendees.id = 'medianMenuAttendees' + si[name].n[0];
  aAttendees.style.cursor = 'pointer';
  aAttendees.style.display = 'block';
  aAttendees.appendChild(document.createTextNode('Ученици'));
  aAttendees.onclick = () => {
    tableMedianSchools.style.display = 'none';
    tableMedianAttendees.style.display = 'block';
    aSchools.style.display = 'block';
    medianTextSchools.style.display = 'none';
    aAttendees.style.display = 'none';
    medianTextAttendees.style.display = 'block';
  }
  generateRowWithText(el, '\u00A0');
  let titleDiv = generateRowWithStrong(el, 'Средни резултати' + ' - ' + name + ' - ' + tableTitleType);
  titleDiv.style.textAlign = 'center';
  generateRowWithText(el, '\u00A0');
  let tableMedianDiv = document.createElement('div');
  tableMedianDiv.style.display = 'flex';
  tableMedianDiv.style.alignItems = 'center';
  tableMedianDiv.style.justifyContent = 'center';
  let tableMedianSchools = document.createElement('table');
  tableMedianDiv.appendChild(tableMedianSchools);
  tableMedianSchools.id = 'tableMedianSchools' + si[name].n[0];
  tableMedianSchools.style.display = 'block';
  let tHeadMedian = document.createElement('thead');
  tableMedianSchools.appendChild(tHeadMedian);
  createMedianTableHeader(tHeadMedian, !!si[name].mpbs);
  let tBodyMedian = document.createElement('tbody');
  tableMedianSchools.appendChild(tBodyMedian);
  createMedianTableBody(tBodyMedian, name, !!si[name].mpbs, 'mnbs', 'mnms', 'mpbs', 'mpms');
  el.appendChild(tableMedianDiv);
  let tableMedianAttendees = document.createElement('table');
  tableMedianAttendees.id = 'tableMedianAttendees' + si[name].n[0];
  tableMedianAttendees.style.display = 'none';
  tHeadMedian = document.createElement('thead');
  tableMedianAttendees.appendChild(tHeadMedian);
  createMedianTableHeader(tHeadMedian, !!si[name].mpba);
  tBodyMedian = document.createElement('tbody');
  tableMedianAttendees.appendChild(tBodyMedian);
  createMedianTableBody(tBodyMedian, name, !!si[name].mpbs, 'mnba', 'mnma', 'mpba', 'mpma');
  tableMedianDiv.appendChild(tableMedianAttendees);
}

function calculateAdjustedRankData(rank, topRank) {
  let adjustedRank = normalizeRankValue(safeDivide(rank * 100, topRank, 0));
  let redHex = '00';
  let greenHex = '00';
  let blueHex = '30';
  if(adjustedRank >= (100 - rankRangeTop)) {
    let red = Math.floor(255 - ((adjustedRank - (100 - rankRangeTop)) * 255) / rankRangeTop);
    redHex = red.toString(16).padStart(2, '0');
    greenHex = 'ff';
  } else if(adjustedRank < (100 - rankRangeTop) && adjustedRank >= rankRangeBottom) {
    let green = Math.floor(127 + ((adjustedRank - rankRangeBottom) * 127) / (100 - rankRangeTop - rankRangeBottom));
    redHex = 'ff';
    greenHex = green.toString(16).padStart(2, '0');
  } else {
    let green = Math.floor((adjustedRank * 127) / rankRangeBottom);
    let red = Math.floor(191 + green / 2);
    redHex = red.toString(16).padStart(2, '0');
    greenHex = green.toString(16).padStart(2, '0');
  }
  return { adjustedRank, redHex, greenHex, blueHex };
}

function normalizeRankValue(value) {
  if(!Number.isFinite(value)) {
    return 0;
  }
  let clamped = Math.min(100, Math.max(0, value));
  return Math.round((clamped + Number.EPSILON) * 100) / 100;
}

function formatRankValue(value) {
  if(!Number.isFinite(value)) {
    return '';
  }
  if(Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function calculateTopRanks(schools, hasPrivate) {
  let topRankAll = (s[schools[0].i].mb + s[schools[0].i].mm - rankBase * 2) / 2;
  let topRankPu = null;
  let topRankPr = null;
  if(hasPrivate) {
    for(let i = 0; i < schools.length; i++) {
      if(schools[i].t === 'Д') {
        topRankPu = (s[schools[i].i].mb + s[schools[i].i].mm - rankBase * 2) / 2;
        break;
      }
    }
    for(let i = 0; i < schools.length; i++) {
      if(schools[i].t === 'Ч') {
        topRankPr = (s[schools[i].i].mb + s[schools[i].i].mm - rankBase * 2) / 2;
        break;
      }
    }
  }
  return { topRankAll, topRankPu, topRankPr };
}

function generateTableFilterMenu(div, name, fn) {
  let menuTitleDiv = generateRow(div);
  menuTitleDiv.style.display = 'flex';
  menuTitleDiv.style.alignItems = 'center';
  menuTitleDiv.style.justifyContent = 'center';
  let aAll = document.createElement('a');
  aAll.id = 'menu-all-a-' + si[name].n[0];
  aAll.style.display = 'none';
  aAll.style.cursor = 'pointer';
  aAll.appendChild(document.createTextNode('Всички'));
  aAll.onclick = () => {
    aAll.style.display = 'none';
    txtAll.style.display = 'block';
    aPu.style.display = 'block';
    txtPu.style.display = 'none';
    aPr.style.display = 'block';
    txtPr.style.display = 'none';
    fn(null);
  }
  menuTitleDiv.appendChild(aAll);
  let txtAll = document.createElement('span');
  txtAll.textContent = 'Всички';
  txtAll.id = 'menu-all-txt-' + si[name].n[0];
  txtAll.style.display = 'block';
  menuTitleDiv.appendChild(txtAll);
  let aPu = document.createElement('a');
  aPu.id = 'menu-pu-a-' + si[name].n[0];
  aPu.style.display = 'block';
  aPu.style.cursor = 'pointer';
  aPu.appendChild(document.createTextNode('Държавни'));
  aPu.onclick = () => {
    aAll.style.display = 'block';
    txtAll.style.display = 'none';
    aPu.style.display = 'none';
    txtPu.style.display = 'block';
    aPr.style.display = 'block';
    txtPr.style.display = 'none';
    fn('Д');
  }
  menuTitleDiv.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  menuTitleDiv.appendChild(aPu);
  let txtPu = document.createElement('span');
  txtPu.textContent = 'Държавни';
  txtPu.id = 'menu-pu-txt-' + si[name].n[0];
  txtPu.style.display = 'none';
  menuTitleDiv.appendChild(txtPu);
  let aPr = document.createElement('a');
  aPr.id = 'menu-pr-a-' + si[name].n[0];
  aPr.style.display = 'block';
  aPr.style.cursor = 'pointer';
  aPr.appendChild(document.createTextNode('Частни'));
  aPr.onclick = () => {
    aAll.style.display = 'block';
    txtAll.style.display = 'none';
    aPu.style.display = 'block';
    txtPu.style.display = 'none';
    aPr.style.display = 'none';
    txtPr.style.display = 'block';
    fn('Ч');
  }
  menuTitleDiv.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  menuTitleDiv.appendChild(aPr);
  let txtPr = document.createElement('span');
  txtPr.textContent = 'Частни';
  txtPr.id = 'menu-pr-txt-' + si[name].n[0];
  txtPr.style.display = 'none';
  menuTitleDiv.appendChild(txtPr);
}

function getRankValueForFilter(td, filterLabel) {
  if(!td) {
    return Number.NEGATIVE_INFINITY;
  }
  let value = null;
  if(filterLabel === 'Д') {
    value = td.rankPu;
  } else if(filterLabel === 'Ч') {
    value = td.rankPr;
  } else {
    value = td.rankAll;
  }
  let parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function updateRankCellForFilter(td, filterLabel) {
  if(!td) {
    return;
  }
  if(filterLabel === 'Д') {
    td.style.backgroundColor = td.bgPu;
    td.textContent = formatRankValue(td.rankPu);
  } else if(filterLabel === 'Ч') {
    td.style.backgroundColor = td.bgPr;
    td.textContent = formatRankValue(td.rankPr);
  } else {
    td.style.backgroundColor = td.bgAll;
    td.textContent = formatRankValue(td.rankAll);
  }
}

function getYearCellSortValue(td) {
  if(!td) {
    return { hasValue: false, value: 0 };
  }
  let text = td.textContent.trim();
  if(!text) {
    return { hasValue: false, value: 0 };
  }
  let match = text.match(/-?\d+(?:[.,]\d+)?/);
  if(!match) {
    return { hasValue: false, value: 0 };
  }
  let parsed = Number.parseFloat(match[0].replace(',', '.'));
  if(!Number.isFinite(parsed)) {
    return { hasValue: false, value: 0 };
  }
  return { hasValue: true, value: parsed };
}

function compareRowsByColumn(tds1, tds2, sortColumn, sortDirection, filterLabel) {
  let cmp = 0;
  if(sortColumn === 1) {
    let n1 = tds1[1] ? tds1[1].textContent.trim() : '';
    let n2 = tds2[1] ? tds2[1].textContent.trim() : '';
    let m1 = n1.match(/^\s*(\d+)/);
    let m2 = n2.match(/^\s*(\d+)/);
    if(m1 && m2) {
      let c1 = Number.parseInt(m1[1], 10);
      let c2 = Number.parseInt(m2[1], 10);
      cmp = c1 - c2;
      if(cmp === 0) {
        cmp = n1.localeCompare(n2, 'bg');
      }
    } else {
      cmp = n1.localeCompare(n2, 'bg');
    }
  } else if(sortColumn === 2) {
    let m1 = tds1[2] ? tds1[2].textContent.match(/^(\S+)\s*\/\s*(\d+)/) : null;
    let m2 = tds2[2] ? tds2[2].textContent.match(/^(\S+)\s*\/\s*(\d+)/) : null;
    let typeOrder = {'Д': 0, 'Ч': 1};
    let t1 = m1 && m1[1] ? (typeOrder[m1[1]] !== undefined ? typeOrder[m1[1]] : 2) : 2;
    let t2 = m2 && m2[1] ? (typeOrder[m2[1]] !== undefined ? typeOrder[m2[1]] : 2) : 2;
    cmp = t1 - t2;
    if(cmp === 0) {
      let ord1 = m1 ? Number.parseInt(m1[2], 10) : Number.MAX_SAFE_INTEGER;
      let ord2 = m2 ? Number.parseInt(m2[2], 10) : Number.MAX_SAFE_INTEGER;
      cmp = ord1 - ord2;
    }
  } else if(sortColumn === 3) {
    let r1v = getRankValueForFilter(tds1[3], filterLabel);
    let r2v = getRankValueForFilter(tds2[3], filterLabel);
    cmp = r1v - r2v;
  } else {
    let y1 = getYearCellSortValue(tds1[sortColumn]);
    let y2 = getYearCellSortValue(tds2[sortColumn]);
    if(!y1.hasValue && !y2.hasValue) {
      let r1v = getRankValueForFilter(tds1[3], filterLabel);
      let r2v = getRankValueForFilter(tds2[3], filterLabel);
      if(r1v !== r2v) {
        let rankCmp = r1v - r2v;
        return sortDirection === 'asc' ? rankCmp : -rankCmp;
      }
      let n1 = tds1[1] ? tds1[1].textContent.trim() : '';
      let n2 = tds2[1] ? tds2[1].textContent.trim() : '';
      return n1.localeCompare(n2, 'bg');
    } else if(!y1.hasValue) {
      return 1;
    } else if(!y2.hasValue) {
      return -1;
    } else {
      cmp = y1.value - y2.value;
    }
  }
  if(cmp === 0) {
    let n1 = tds1[1] ? tds1[1].textContent.trim() : '';
    let n2 = tds2[1] ? tds2[1].textContent.trim() : '';
    cmp = n1.localeCompare(n2, 'bg');
  }
  return sortDirection === 'asc' ? cmp : -cmp;
}

function renumberVisibleRows(tBody) {
  let rows = tBody.getElementsByTagName('tr');
  let counter = 0;
  for(let i = 0; i < rows.length; i++) {
    if(rows[i].style.display === 'none') {
      continue;
    }
    let tds = rows[i].getElementsByTagName('td');
    if(tds[0]) {
      tds[0].textContent = ++counter;
    }
  }
}

function updateNoDataSeparator(tBody, state) {
  let rows = tBody.getElementsByTagName('tr');
  for(let i = 0; i < rows.length; i++) {
    let tds = rows[i].getElementsByTagName('td');
    for(let j = 0; j < tds.length; j++) {
      tds[j].style.borderTop = '';
    }
  }
  if(state.sortColumn <= 3) {
    return;
  }
  for(let i = 0; i < rows.length; i++) {
    if(rows[i].style.display === 'none') {
      continue;
    }
    let tds = rows[i].getElementsByTagName('td');
    let yearCell = tds[state.sortColumn];
    let yearValue = getYearCellSortValue(yearCell);
    if(!yearValue.hasValue) {
      for(let j = 0; j < tds.length; j++) {
        tds[j].style.borderTop = '3px solid #555';
      }
      return;
    }
  }
}

function updateSortHeaders(table, sortColumn, sortDirection) {
  let ths = table.querySelectorAll('thead th');
  for(let i = 0; i < ths.length; i++) {
    let th = ths[i];
    if(th.dataset.sortable !== '1') {
      continue;
    }
    let baseText = th.dataset.baseText || th.textContent;
    if(i === sortColumn) {
      th.textContent = baseText + (sortDirection === 'asc' ? ' ▲' : ' ▼');
    } else {
      th.textContent = baseText;
    }
  }
}

function applyRankingTableState(table, tBody, state) {
  let rows = Array.from(tBody.getElementsByTagName('tr'))
    .map(row => ({ row, tds: row.getElementsByTagName('td') }));
  rows.sort((a, b) => compareRowsByColumn(a.tds, b.tds, state.sortColumn, state.sortDirection, state.filterLabel));
  rows.forEach(({ row, tds }) => {
    let visible = !state.filterLabel || (tds[2] && tds[2].textContent.startsWith(state.filterLabel));
    row.style.display = visible ? 'table-row' : 'none';
    updateRankCellForFilter(tds[3], state.filterLabel);
    tBody.appendChild(row);
  });
  renumberVisibleRows(tBody);
  updateNoDataSeparator(tBody, state);
  updateSortHeaders(table, state.sortColumn, state.sortDirection);
}

function enableRankingTableSorting(table, tBody, state) {
  let ths = table.querySelectorAll('thead th');
  for(let i = 0; i < ths.length; i++) {
    let th = ths[i];
    th.dataset.baseText = th.textContent;
    if(i === 0) {
      continue;
    }
    th.dataset.sortable = '1';
    th.style.cursor = 'pointer';
    th.onclick = () => {
      if(state.sortColumn === i) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = i;
        state.sortDirection = (i === 1 || i === 2) ? 'asc' : 'desc';
      }
      applyRankingTableState(table, tBody, state);
    };
  }
}

function buildRankingTable(div, name, puSchools, prSchools, rankingState) {
  if(div.dataset.tableBuilt === '1') {
    return;
  }
  let table = document.createElement('table');
  table.style.marginLeft = 'auto';
  table.style.marginRight = 'auto';
  let tHead = document.createElement('thead');
  table.appendChild(tHead);
  let headTr = document.createElement('tr');
  tHead.appendChild(headTr);
  let headers = ['№', 'Училище', 'Тип / №', 'Ранг'];
  for(let i = 0; i < 3; i++) {
    headers.push((firstYear - 2001 + s[baseSchoolIndex].b.length - i) + ' ' + csvHeaderB + ' / уч.');
    headers.push((firstYear - 2001 + s[baseSchoolIndex].b.length - i) + ' ' + csvHeaderM + ' / уч.');
  }
  headers.push('Доклад');
  headers.forEach((header) => {
    let th = document.createElement('th');
    th.appendChild(document.createTextNode(header));
    th.style.overflow = 'hidden';
    th.style.whiteSpace = 'nowrap';
    headTr.appendChild(th);
  });
  let tBody = document.createElement('tbody');
  tBody.id = 'tbl-' + si[name].n[0];
  table.appendChild(tBody);
  let schools = [];
  for(let i = puSchools[0]; i <= puSchools[1]; i++) {
    if(!s[i] || s[i].b[s[i].b.length - 1] === null) { continue; }
    schools.push({i: i, t: 'Д'});
  }
  if(prSchools) {
    for(let i = prSchools[0]; i <= prSchools[1]; i++) {
      if(!s[i] || s[i].b[s[i].b.length - 1] === null) { continue; }
      schools.push({i: i, t: 'Ч'});
    }
  }
  let sortFunc = (o1, o2) => (s[o1.i].mb + s[o1.i].mm) / 2 < (s[o2.i].mb + s[o2.i].mm) / 2 ? 1 : -1;
  schools.sort(sortFunc);
  const { topRankAll, topRankPu, topRankPr } = calculateTopRanks(schools, !!prSchools);
  let counter = 0;
  let counterPu = 0;
  let counterPr = 0;
  let topRankDone = false;
  schools.forEach((o) => {
    let tr = document.createElement('tr');
    tBody.appendChild(tr);
    let td = document.createElement('td');
    td.appendChild(document.createTextNode(++counter));
    tr.appendChild(td);
    td = document.createElement('td');
    if(s[o.i].w) {
      let a = document.createElement('a');
      a.appendChild(document.createTextNode(s[o.i].l));
      a.href = s[o.i].w;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      td.appendChild(a);
    } else {
      td.appendChild(document.createTextNode(s[o.i].l));
    }
    td.title = s[o.i].n;
    tr.appendChild(td);
    td = document.createElement('td');
    td.appendChild(document.createTextNode(o.t + ' / ' + (o.t === 'Д' ? ++counterPu : ++counterPr)));
    tr.appendChild(td);
    td = document.createElement('td');
    if(!topRankDone) {
      td.appendChild(document.createTextNode('100'));
      td.title = 'Среден резултат = ' + (topRankAll + rankBase).toFixed(2);
      td.bgAll = '#00ff30';
      td.rankAll = 100;
      td.rankPu = o.t === 'Д' ? 100 : null;
      td.rankPr = o.t === 'Ч' ? 100 : null;
      td.bgPu = o.t === 'Д' ? '#00ff30': 'none';
      td.bgPr = o.t === 'Ч' ? '#00ff30': 'none';
      td.style.backgroundColor = td.bgAll;
      topRankDone = true;
    } else {
      let rank = (s[o.i].mb + s[o.i].mm - rankBase * 2) / 2;
      td.title = 'Среден резултат = ' + (rank + rankBase).toFixed(2);
      let ardAll = calculateAdjustedRankData(rank, topRankAll);
      td.bgAll = '#' + ardAll.redHex + ardAll.greenHex + ardAll.blueHex;
      td.rankAll = normalizeRankValue(ardAll.adjustedRank);
      let ardPu = calculateAdjustedRankData(rank, topRankPu);
      td.bgPu = '#' + ardPu.redHex + ardPu.greenHex + ardPu.blueHex;
      td.rankPu = normalizeRankValue(ardPu.adjustedRank);
      if(topRankPr) {
        let ardPr = calculateAdjustedRankData(rank, topRankPr);
        td.bgPr = '#' + ardPr.redHex + ardPr.greenHex + ardPr.blueHex;
        td.rankPr = normalizeRankValue(ardPr.adjustedRank);
      } else {
        td.bgPr = 'none';
        td.rankPr = null;
      }
      td.style.backgroundColor = td.bgAll;
      td.textContent = formatRankValue(td.rankAll);
    }
    tr.appendChild(td);
    let totalYears = s[o.i].b.length;
    for(let j = 0; j < 3; j++) {
      td = document.createElement('td');
      td.style.overflow = 'hidden';
      td.style.whiteSpace = 'nowrap';
      td.appendChild(document.createTextNode(s[o.i].b[totalYears - j - 1] ? s[o.i].b[totalYears - j - 1] + ' / ' + s[o.i].bu[totalYears - j - 1] : ''));
      tr.appendChild(td);
      td = document.createElement('td');
      td.style.overflow = 'hidden';
      td.style.whiteSpace = 'nowrap';
      td.appendChild(document.createTextNode(s[o.i].m[totalYears - j - 1] ? s[o.i].m[totalYears - j - 1] + ' / ' + s[o.i].mu[totalYears - j - 1] : ''));
      tr.appendChild(td);
    }
    td = document.createElement('td');
    let pdfLink = document.createElement('a');
    pdfLink.href = '#';
    pdfLink.className = 'school-report-link';
    pdfLink.title = 'PDF доклад за ' + s[o.i].n;
    pdfLink.appendChild(document.createTextNode('PDF'));
    let schoolIdx = o.i;
    pdfLink.onclick = async (e) => {
      e.preventDefault();
      try {
        await generateSchoolReportPdf(schoolIdx, e.currentTarget);
      } catch(err) {
        console.error(err);
        alert('Грешка при генериране на PDF доклад. Моля опитайте отново.');
      }
    };
    td.appendChild(pdfLink);
    tr.appendChild(td);
  });
  div.appendChild(table);
  enableRankingTableSorting(table, tBody, rankingState);
  applyRankingTableState(table, tBody, rankingState);
  div.dataset.tableBuilt = '1';
}

function generateHTMLTable(el, hrName, puSchools, prSchools, name) {
  let div = document.createElement('div');
  let rankingState = { sortColumn: 3, sortDirection: 'desc', filterLabel: null };
  if(prSchools) {
    let fn = (lbl) => {
      rankingState.filterLabel = lbl;
      let tBody = document.getElementById('tbl-' + si[name].n[0]);
      if(!tBody) { return; }
      let table = tBody.closest('table');
      if(!table) {
        return;
      }
      applyRankingTableState(table, tBody, rankingState);
    }
    generateRowWithText(div, '\u00A0');
    generateTableFilterMenu(div, name, fn);
  }
  generateRowWithText(div, '\u00A0');
  let titleDiv = generateRowWithStrong(div, tableTitleName + ' - ' + name + ' - ' + tableTitleType);
  titleDiv.style.textAlign = 'center';
  generateRowWithText(div, '\u00A0');
  div.classList.add('row');
  div.id = 't' + hrName;
  div.style.display = 'none';
  rankingTableBuilders[hrName] = () => {
    buildRankingTable(div, name, puSchools, prSchools, rankingState);
    generateRowWithText(div, '\u00A0');
    generateCityMedianTables(div, name);
  }
  el.appendChild(div);
}

function generateDownloadCSVLink(el, tableKey, cityName, data) {
  let span = document.createElement('span');
  span.classList.add('u-pull-right');
  el.appendChild(span);
  let header = generateDownloadCSVHeader();
  let a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('Класация'));
  a.onclick = (e) => {
    let tableDiv = document.getElementById('t' + tableKey);
    if(!tableDiv) { return; }
    if(tableDiv.style.display === 'none') {
      if(rankingTableBuilders[tableKey]) {
        rankingTableBuilders[tableKey]();
      }
      tableDiv.style.display = 'block';
      e.currentTarget.innerText = 'Затвори'
    } else {
      tableDiv.style.display = 'none';
      e.currentTarget.innerText = 'Класация'
    }
  }
  span.appendChild(a);
  span.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.appendChild(document.createTextNode('CSV'));
  setCsvDownloadLink(a, exportPrefix + '-data-' + tableKey + '.csv', header + data);
  span.appendChild(a);
  span.appendChild(document.createTextNode('\u00A0\u00A0\u00A0|\u00A0\u00A0\u00A0'));
  a = document.createElement('a');
  a.style.cursor = 'pointer';
  a.href = '#';
  a.appendChild(document.createTextNode('PDF'));
  a.onclick = async (e) => {
    e.preventDefault();
    try {
      await exportRankingTableToPdf(tableKey, cityName, e.currentTarget);
    } catch(err) {
      // Keep UI responsive and surface a clear message instead of an unhandled rejection.
      console.error(err);
      alert('Грешка при генериране на PDF. Моля опитайте отново.');
    }
  };
  span.appendChild(a);
}
