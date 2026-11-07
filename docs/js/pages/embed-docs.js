// Генераторът на код на страницата /embed/: клас, училища (и средни за градове), графики,
// тема и година → готов iframe код и преглед на живо.
import { navFirstYear } from '../core/config.js';
import { fetchGradeData, buildModel, renderableCities, defaultSelection, defaultAverages, cityAverageName } from '../core/model.js';
import { embedCode, embedQuery } from '../core/embed.js';
import { createCombobox } from '../ui/combobox.js';
import { buildSchoolIndex, searchSchools, withCityAverages } from '../ui/school-search.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { copyText, toast, siteUrl } from '../site.js';

const state = { grade: 7, model: null, cities: [], index: [], selection: [], avg: [], chart: '', theme: '', year: '' };
const el = {
  chips: document.getElementById('gen-chips'),
  add: document.getElementById('gen-add'),
  year: document.getElementById('gen-year'),
  code: document.getElementById('gen-code'),
  copy: document.getElementById('gen-copy'),
  open: document.getElementById('gen-open'),
  preview: document.getElementById('gen-preview')
};

function selected(i) {
  return state.selection.includes(i);
}

function renderChips() {
  const chip = (attr, label) => '<li class="chip" ' + attr + '><span class="chip__label">' + esc(label)
    + '</span><button type="button" class="chip__x" aria-label="Премахнете">' + icon('x') + '</button></li>';
  el.chips.innerHTML = state.selection.map((i) => chip('data-i="' + i + '"', state.model.s[i].n)).join('')
    + state.avg.map((slug) => chip('data-avg="' + esc(slug) + '"', cityAverageName(state.cities.find((c) => c.slug === slug)))).join('');
}

function update() {
  const { model } = state;
  const opts = { chart: state.chart, theme: state.theme, year: state.year, avg: state.avg };
  el.code.value = state.selection.length || state.avg.length ? embedCode(model, state.selection, opts) : '';
  const local = siteUrl(state.grade + '/embed.html?' + embedQuery(model, state.selection, opts));
  el.open.href = local;
  el.preview.style.height = (state.chart ? 600 : 1000) + 'px';
  if (el.preview.dataset.src !== local) {
    el.preview.dataset.src = local;
    el.preview.src = local;
  }
}

async function loadGrade(grade) {
  state.grade = grade;
  state.model = buildModel(grade, await fetchGradeData(grade, siteUrl('data/grade-' + grade + '.json')), {});
  state.cities = renderableCities(state.model);
  state.index = buildSchoolIndex(state.model, state.cities);
  state.selection = defaultSelection(state.model);
  state.avg = defaultAverages(state.model, state.cities);
  const latest = state.model.dataLatestYear;
  let options = '<option value="">' + latest + ' - актуални данни</option>';
  for (let y = latest - 1; y >= navFirstYear(state.grade); y--) {
    options += '<option value="' + y + '">' + y + '</option>';
  }
  el.year.innerHTML = options;
  state.year = '';
  renderChips();
  update();
}

document.querySelectorAll('[data-gen]').forEach((seg) => {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) {
      return;
    }
    seg.querySelectorAll('[data-v]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const key = seg.dataset.gen;
    if (key === 'grade') {
      loadGrade(Number(b.dataset.v)).catch(loadFailed);
    } else {
      state[key] = b.dataset.v;
      update();
    }
  });
});

el.year.addEventListener('change', () => {
  state.year = el.year.value;
  update();
});

el.chips.addEventListener('click', (e) => {
  const li = e.target.closest('[data-i], [data-avg]');
  if (li && e.target.closest('.chip__x')) {
    if (li.dataset.avg) {
      state.avg = state.avg.filter((slug) => slug !== li.dataset.avg);
    } else {
      state.selection = state.selection.filter((i) => i !== Number(li.dataset.i));
    }
    renderChips();
    update();
  }
});

el.copy.addEventListener('click', async () => {
  if (el.code.value && await copyText(el.code.value)) {
    toast('Кодът е копиран');
  }
});

window.addEventListener('message', (e) => {
  if (e.source === el.preview.contentWindow && e.data && e.data.type === 'nvo-embed-resize') {
    // Докладваната височина е на съдържанието; добавяме рамката на iframe-а (border-box),
    // иначе всяко оразмеряване го смалява с няколко пиксела.
    const frame = el.preview.offsetHeight - el.preview.clientHeight;
    el.preview.style.height = Math.max(300, e.data.height + frame) + 'px';
  }
});

createCombobox({
  input: el.add,
  host: el.add.closest('.combo'),
  minChars: 2,
  hint: 'Напишете поне 2 букви от името на училището или града.',
  emptyText: 'Няма такова училище',
  // Търсене на град дава и "Средно за {град}" (параметър avg=).
  search: (q) => withCityAverages(searchSchools(state.model, state.index, q, { isSelected: selected }), state.cities, q,
    { isAvgSelected: (slug) => state.avg.includes(slug), name: cityAverageName }),
  onSelect(item) {
    if (typeof item.id === 'string' && item.id.startsWith('c:')) {
      const slug = item.id.slice(2);
      state.avg = state.avg.includes(slug) ? state.avg.filter((x) => x !== slug) : state.avg.concat(slug);
    } else if (selected(item.id)) {
      state.selection = state.selection.filter((i) => i !== item.id);
    } else {
      state.selection.push(item.id);
    }
    renderChips();
    update();
  }
});

function loadFailed(err) {
  console.error(err);
  el.code.textContent = 'Данните не можаха да се заредят. Опитайте да презаредите страницата.';
}

loadGrade(7).catch(loadFailed);
