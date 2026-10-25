// Страници по град и година (/{клас}/{град}/, /{клас}/{година}/): сортиране по
// колона, търсене, "Покажи само" (видовете училища) и (за годишната класация) филтър
// по град. Таблицата е статична HTML.
// Видът и градът правят нова класация: "#" брои отначало сред показаните училища, а
// "Тип / №" - сред същия вид в избрания град. Търсенето само скрива редове (търси се
// конкретно училище и мястото му), без да преномерира.
import { searchKey, expandAbbreviations } from '../ui/search-text.js';
import { rememberCity } from '../core/city-memory.js';

// Страница по град → този град се показва и на страниците 4/7/10/12 (годишната е без data-city).
rememberCity(document.body.dataset.city);

const table = document.querySelector('table[data-sortable]');
const filter = document.querySelector('[data-filter]');
const citySelect = document.querySelector('[data-city-filter]');
const countEl = document.querySelector('[data-count]');
const typeChips = Array.from(document.querySelectorAll('[data-school-type]:not(tr)'));
// Избраните видове; нищо избрано = всички.
const types = new Set();

if (table) {
  const tbody = table.tBodies[0];
  const ths = Array.from(table.tHead.rows[0].cells);
  const cityCol = ths.findIndex((th) => th.textContent.trim().startsWith('Град'));
  const typeCol = ths.findIndex((th) => th.textContent.trim().startsWith('Тип'));
  const rows = Array.from(tbody.rows).map((tr) => {
    // data-sort - стойността за подреждане, когато текстът не става (вида: Д, О, Ч, ДУ, после №)
    const cells = Array.from(tr.cells).map((td) => (td.dataset.sort !== undefined ? td.dataset.sort : td.textContent.trim()));
    return {
      tr,
      cells,
      type: tr.dataset.schoolType,
      rank: Number.parseInt(cells[0], 10),
      typeNoEl: tr.querySelector('.type-no__n'),
      typeBase: typeCol >= 0 ? Math.floor(Number(cells[typeCol]) / 10000) * 10000 : 0,
      hay: searchKey(tr.textContent + ' ' + expandAbbreviations(tr.textContent))
    };
  });
  // Редовете в реда на класацията (сортирането по колони не го променя).
  const byRank = rows.slice().sort((a, b) => a.rank - b.rank);

  if (citySelect && cityCol >= 0) {
    const cities = [...new Set(rows.map((r) => r.cells[cityCol]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bg'));
    citySelect.insertAdjacentHTML('beforeend', cities.map((c) => '<option>' + c.replace(/</g, '&lt;') + '</option>').join(''));
  }

  const apply = () => {
    const q = filter ? searchKey(filter.value) : '';
    const city = citySelect ? citySelect.value : '';
    let visible = 0;
    const counts = {};
    let place = 0;
    const typePlace = {};
    byRank.forEach((r) => {
      if (city && r.cells[cityCol] !== city) {
        return;
      }
      typePlace[r.type] = (typePlace[r.type] || 0) + 1;
      if (r.typeNoEl) {
        r.typeNoEl.textContent = String(typePlace[r.type]);
        r.cells[typeCol] = String(r.typeBase + typePlace[r.type]);
      }
      if (!types.size || types.has(r.type)) {
        r.tr.cells[0].textContent = String(++place);
      }
    });
    rows.forEach((r) => {
      const match = (!q || q.split(' ').every((t) => r.hay.includes(t))) && (!city || r.cells[cityCol] === city);
      // Броят в чиповете следва търсенето и града, но не и самия избор на вид.
      if (match) {
        counts[r.type] = (counts[r.type] || 0) + 1;
      }
      const show = match && (!types.size || types.has(r.type));
      r.tr.hidden = !show;
      if (show) {
        visible++;
      }
    });
    typeChips.forEach((b) => {
      b.setAttribute('aria-pressed', String(types.has(b.dataset.schoolType)));
      const n = b.querySelector('[data-type-count]');
      if (n) {
        n.textContent = String(counts[b.dataset.schoolType] || 0);
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
  typeChips.forEach((b) => {
    b.addEventListener('click', () => {
      const k = b.dataset.schoolType;
      if (types.has(k)) {
        types.delete(k);
      } else {
        types.add(k);
      }
      apply();
    });
  });

  ths.forEach((th, col) => {
    const btn = th.querySelector('.th-sort');
    if (!btn) {
      return;
    }
    btn.addEventListener('click', () => {
      const current = th.getAttribute('aria-sort');
      const isNum = th.dataset.type === 'num';
      // Числата (без №) започват низходящо, текстът - възходящо; data-first го променя (вида).
      const first = th.dataset.first || (isNum && col > 0 ? 'descending' : 'ascending');
      const dir = current === 'none' ? first : (current === 'ascending' ? 'descending' : 'ascending');
      ths.forEach((x) => x.setAttribute('aria-sort', x === th ? dir : 'none'));
      const sign = dir === 'ascending' ? 1 : -1;
      rows.sort((a, b) => {
        // "#" се подрежда по мястото в класацията (показаното число е мястото сред показаните).
        const x = col === 0 ? a.rank : a.cells[col];
        const y = col === 0 ? b.rank : b.cells[col];
        const cmp = isNum ? Number.parseFloat(x) - Number.parseFloat(y) : x.localeCompare(y, 'bg');
        return cmp !== 0 ? sign * cmp : a.rank - b.rank;
      });
      rows.forEach((r) => tbody.appendChild(r.tr));
    });
  });
}
