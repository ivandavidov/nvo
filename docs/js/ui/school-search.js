// Търсене на училище в модела на един клас (за полетата „Добави училище“).
import { normalize } from './dom.js';

/** Индекс за търсене: всички училища в градовете с данни (вкл. без резултат за последната година). */
export function buildSchoolIndex(model, cities) {
  const items = [];
  cities.forEach((c) => {
    [[c.pu, 'Д'], [c.pr, 'Ч']].forEach(([range, type]) => {
      if (!range) {
        return;
      }
      for (let i = range[0]; i <= range[1]; i++) {
        const o = model.s[i];
        if (!o) {
          continue;
        }
        items.push({
          i,
          city: c,
          type,
          inactive: o.b[o.b.length - 1] === null,
          nl: normalize(o.l),
          nn: normalize(o.n),
          hay: normalize(o.n + ' ' + o.l + ' ' + c.name + ' ' + (o.c || ''))
        });
      }
    });
  });
  return items;
}

function tier(it, nq) {
  let best = 2;
  [it.nn, it.nl].forEach((name) => {
    const pos = name.indexOf(nq);
    if (pos >= 0) {
      best = Math.min(best, pos === 0 || name.charAt(pos - 1) === ' ' ? 0 : 1);
    }
  });
  return best;
}

/**
 * Групи за combobox-а (по град): [{ label: град, items: [{ id, title, meta, checked }] }].
 * Подредба: съвпадение в началото на име/дума → реда на градовете → азбучно.
 */
export function searchSchools(model, index, query, { isSelected = () => false, limit = 40 } = {}) {
  const nq = normalize(query);
  const terms = nq.split(' ').filter(Boolean);
  const latest = model.latestYear;
  const found = index.filter((it) => terms.every((t) => it.hay.includes(t)))
    .sort((a, b) => tier(a, nq) - tier(b, nq) || a.city.order - b.city.order || a.nl.localeCompare(b.nl, 'bg'))
    .slice(0, limit);
  const groups = [];
  const byCity = new Map();
  found.forEach((it) => {
    if (!byCity.has(it.city.name)) {
      const g = { label: it.city.name, items: [] };
      byCity.set(it.city.name, g);
      groups.push(g);
    }
    byCity.get(it.city.name).items.push({
      id: it.i,
      title: model.s[it.i].n,
      meta: (it.type === 'Ч' ? 'частно' : 'държавно') + (it.inactive ? ' · без данни за ' + latest : ''),
      checked: isSelected(it.i)
    });
  });
  return groups;
}
