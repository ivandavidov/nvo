// Страници по град и година (/{клас}/{град}/, /{клас}/{година}/): сортиране по
// колона, търсене и (за годишната класация) филтър по град. Таблицата е статична HTML.
import { searchKey, expandAbbreviations } from '../ui/search-text.js';
import { rememberCity } from '../core/city-memory.js';

// Страница по град → този град се показва и на страниците 4/7/10/12 (годишната е без data-city).
rememberCity(document.body.dataset.city);

const table = document.querySelector('table[data-sortable]');
const filter = document.querySelector('[data-filter]');
const citySelect = document.querySelector('[data-city-filter]');
const countEl = document.querySelector('[data-count]');

if (table) {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows).map((tr) => ({
    tr,
    cells: Array.from(tr.cells).map((td) => td.textContent.trim()),
    hay: searchKey(tr.textContent + ' ' + expandAbbreviations(tr.textContent))
  }));
  const ths = Array.from(table.tHead.rows[0].cells);
  const cityCol = ths.findIndex((th) => th.textContent.trim().startsWith('Град'));

  if (citySelect && cityCol >= 0) {
    const cities = [...new Set(rows.map((r) => r.cells[cityCol]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bg'));
    citySelect.insertAdjacentHTML('beforeend', cities.map((c) => '<option>' + c.replace(/</g, '&lt;') + '</option>').join(''));
  }

  const apply = () => {
    const q = filter ? searchKey(filter.value) : '';
    const city = citySelect ? citySelect.value : '';
    let visible = 0;
    rows.forEach((r) => {
      const show = (!q || q.split(' ').every((t) => r.hay.includes(t))) && (!city || r.cells[cityCol] === city);
      r.tr.hidden = !show;
      if (show) {
        visible++;
      }
    });
    if (countEl) {
      countEl.textContent = visible === rows.length ? rows.length + ' училища' : visible + ' от ' + rows.length + ' училища';
    }
  };
  if (filter) {
    filter.addEventListener('input', apply);
  }
  if (citySelect) {
    citySelect.addEventListener('change', apply);
  }

  ths.forEach((th, col) => {
    const btn = th.querySelector('.th-sort');
    if (!btn) {
      return;
    }
    btn.addEventListener('click', () => {
      const current = th.getAttribute('aria-sort');
      const isNum = th.dataset.type === 'num';
      // Числата (без №) започват низходящо, текстът — възходящо.
      const first = isNum && col > 0 ? 'descending' : 'ascending';
      const dir = current === 'none' ? first : (current === 'ascending' ? 'descending' : 'ascending');
      ths.forEach((x) => x.setAttribute('aria-sort', x === th ? dir : 'none'));
      const sign = dir === 'ascending' ? 1 : -1;
      rows.sort((a, b) => {
        const x = a.cells[col];
        const y = b.cells[col];
        const cmp = isNum ? Number.parseFloat(x) - Number.parseFloat(y) : x.localeCompare(y, 'bg');
        return cmp !== 0 ? sign * cmp : Number.parseInt(a.cells[0], 10) - Number.parseInt(b.cells[0], 10);
      });
      rows.forEach((r) => tbody.appendChild(r.tr));
    });
  });
}
