// Плаващо заглавие на таблиците на телефон.
//
// На телефон (и на всяко устройство с докосване) таблиците нямат собствен вертикален скрол
// (виж „Таблиците на телефон“ в site.css): плъзгането нагоре и надолу върху таблица скролва
// страницата, а настрани — колоните. Тогава обаче thead (position: sticky вътре в .table-wrap)
// не може да остане видим, затова, докато таблицата минава под горните ленти, показваме копие
// на заглавието, закрепено под тях и плъзгащо се настрани заедно с колоните.
// Копието е само за окото (aria-hidden): натискане в него натиска същия бутон в истинското
// заглавие, което остава единственото за клавиатурата и екранните четци.

/** Същото медийно условие като в site.css („Таблиците на телефон“). */
export const TOUCH_TABLES = '(max-width: 767px), (hover: none) and (pointer: coarse)';

// Ленти, закрепени в горния край на страницата; копието застава под най-долната от тях.
const TOP_BARS = '.site-header, .school-nav, .stats-toc';
const CONTROLS = 'a, button, input, select';

let media = null;
let float = null;       // div.table-float с копието
let source = null;      // .table-wrap, чието заглавие е копирано
let sourceHead = null;  // thead, от който е направено копието
let sourceKey = '';     // ширините на колоните, с които е направено копието
let frame = 0;

/** Долният край на закрепените горни ленти (лентата на сайта, навигацията на училището…). */
export function stickyTopOffset() {
  let bottom = 0;
  document.querySelectorAll(TOP_BARS).forEach((bar) => {
    const cs = getComputedStyle(bar);
    if (cs.position !== 'sticky' && cs.position !== 'fixed') {
      return;
    }
    const r = bar.getBoundingClientRect();
    // Само ленти през цялата ширина, които в момента са закрепени — не и съдържанието
    // в страничната колона на статистиките на широк екран.
    if (r.height && r.width >= window.innerWidth * 0.6 && Math.abs(r.top - (parseFloat(cs.top) || 0)) < 2) {
      bottom = Math.max(bottom, r.bottom);
    }
  });
  return bottom;
}

function headCells(thead) {
  return thead.querySelectorAll('th, td');
}

function widthsKey(table, thead) {
  let key = table.offsetWidth + ':';
  headCells(thead).forEach((cell) => {
    key += cell.offsetWidth + ',';
  });
  return key;
}

function onFloatClick(e) {
  const hit = e.target.closest(CONTROLS);
  if (!hit || !source || !sourceHead) {
    return;
  }
  const k = Array.from(float.querySelectorAll(CONTROLS)).indexOf(hit);
  const original = sourceHead.querySelectorAll(CONTROLS)[k];
  if (!original) {
    return;
  }
  e.preventDefault();
  const top = window.scrollY + source.getBoundingClientRect().top - stickyTopOffset();
  original.click();
  // След подреждане таблицата се показва отначало — както на компютър, където вътрешният
  // ѝ скрол се връща горе при прерисуването.
  window.scrollTo({ top, behavior: 'instant' });
  schedule();
}

function build(table, thead) {
  if (!float) {
    float = document.createElement('div');
    float.className = 'table-float';
    float.setAttribute('aria-hidden', 'true');
    float.hidden = true;
    float.addEventListener('click', onFloatClick);
    document.body.appendChild(float);
  }
  const head = thead.cloneNode(true);
  head.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  head.querySelectorAll(CONTROLS).forEach((n) => n.setAttribute('tabindex', '-1'));
  // Ширините се копират клетка по клетка, за да съвпадат колоните с тези на таблицата.
  const copies = headCells(head);
  headCells(thead).forEach((cell, k) => {
    const s = copies[k].style;
    s.boxSizing = 'border-box';
    s.width = s.minWidth = s.maxWidth = cell.getBoundingClientRect().width + 'px';
  });
  const copy = document.createElement('table');
  copy.className = table.className;
  copy.style.width = copy.style.minWidth = table.getBoundingClientRect().width + 'px';
  copy.appendChild(head);
  float.replaceChildren(copy);
}

function hide() {
  if (float && !float.hidden) {
    float.hidden = true;
  }
  source = null;
}

function update() {
  frame = 0;
  if (!media.matches) {
    hide();
    return;
  }
  const offset = stickyTopOffset();
  let wrap = null;
  let rect = null;
  for (const w of document.querySelectorAll('.table-wrap')) {
    const r = w.getBoundingClientRect();
    // Истинското заглавие е минало под горните ленти, а таблицата още не е свършила.
    if (r.height && r.top + w.clientTop < offset && r.bottom > offset && w.querySelector(':scope > table > thead')) {
      wrap = w;
      rect = r;
      break;
    }
  }
  if (!wrap) {
    hide();
    return;
  }
  const table = wrap.querySelector(':scope > table');
  const thead = table.tHead;
  const key = widthsKey(table, thead);
  if (wrap !== source || thead !== sourceHead || key !== sourceKey) {
    build(table, thead);
    source = wrap;
    sourceHead = thead;
    sourceKey = key;
  }
  float.style.left = (rect.left + wrap.clientLeft) + 'px';
  float.style.width = wrap.clientWidth + 'px';
  float.hidden = false;
  // В края на таблицата копието се изтегля нагоре заедно с последния ред.
  float.style.top = Math.min(offset, rect.bottom - float.offsetHeight) + 'px';
  float.scrollLeft = wrap.scrollLeft;
}

function schedule() {
  if (!frame && (media.matches || source)) {
    frame = requestAnimationFrame(update);
  }
}

export function initStickyHeads() {
  media = window.matchMedia(TOUCH_TABLES);
  // capture: така идват и хоризонталните скролове на самите таблици.
  document.addEventListener('scroll', schedule, { capture: true, passive: true });
  window.addEventListener('resize', schedule);
  media.addEventListener('change', schedule);
  // Таблиците се прерисуват (подреждане, филтър, смяна на града) — копието се обновява
  // при следващия кадър, ако заглавието или ширините са други.
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
}
