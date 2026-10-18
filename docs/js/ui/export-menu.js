// Менюто „Изтегли ▾“ (CSV · JSON · PDF) — същата разметка като nvo.site.ExportMenu в Java.
// Поведението (затваряне, стрелки) е в ui/popover.js; действията — в страницата (data-action).
import { icon } from './icons.js';
import { esc } from './dom.js';

const KINDS = { csv: ['table', 'CSV'], json: ['code', 'JSON'], pdf: ['file', 'PDF'] };

/**
 * @param {{title: string, items: {kind: 'csv'|'json'|'pdf', hint: string, action?: string,
 *   href?: string, download?: string}[], note?: string, cls?: string}} o
 */
export function exportMenuHtml(o) {
  let h = '<details class="menu-button' + (o.cls ? ' ' + o.cls : '') + '" data-popover>'
    + '<summary class="btn btn--sm">' + icon('download')
    + '<span class="menu-button__long">Изтегли данните</span><span class="menu-button__short">Изтегли</span>'
    + '<span class="menu-button__caret">' + icon('chevron-down') + '</span></summary>'
    + '<div class="menu-button__panel"><p class="menu-button__title">' + esc(o.title) + '</p>';
  o.items.forEach((it) => {
    const [ic, label] = KINDS[it.kind];
    const body = icon(ic) + '<span><strong>' + label + '</strong><span class="menu-button__hint">' + esc(it.hint) + '</span></span>';
    h += it.href
      ? '<a class="menu-button__item" href="' + esc(it.href) + '"' + (it.download ? ' download="' + esc(it.download) + '"' : '') + '>' + body + '</a>'
      : '<button type="button" class="menu-button__item" data-action="' + esc(it.action) + '">' + body + '</button>';
  });
  if (o.note) {
    h += '<p class="menu-button__note">' + esc(o.note) + '</p>';
  }
  return h + '</div></details>';
}

/** Бутонът (summary) на менюто, в което е елементът — за индикацията „работи…“. */
export function menuButtonOf(el) {
  const d = el && el.closest('details.menu-button');
  return d ? d.querySelector('summary') : el;
}
