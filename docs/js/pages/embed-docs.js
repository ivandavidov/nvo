// Генераторът на код на страницата /embed/: клас, училища, графики, тема и година
// → готов iframe код и преглед на живо.
import { NAV_FIRST_YEAR } from '../core/config.js';
import { fetchGradeData, buildModel, renderableCities } from '../core/model.js';
import { embedCode, embedQuery } from '../core/embed.js';
import { createCombobox } from '../ui/combobox.js';
import { buildSchoolIndex, searchSchools } from '../ui/school-search.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { copyText, toast, siteUrl } from '../site.js';

const state = { grade: 7, model: null, index: [], selection: [], chart: '', theme: '', year: '' };
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
  el.chips.innerHTML = state.selection.map((i) => '<li class="chip" data-i="' + i + '"><span class="chip__label">'
    + esc(state.model.s[i].n) + '</span><button type="button" class="chip__x" aria-label="Премахни">' + icon('x') + '</button></li>').join('');
}

function update() {
  const { model } = state;
  const opts = { chart: state.chart, theme: state.theme, year: state.year };
  el.code.value = state.selection.length ? embedCode(model, state.selection, opts) : '';
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
  state.index = buildSchoolIndex(state.model, renderableCities(state.model));
  state.selection = [state.model.cfg.baseSchoolIndex, state.model.cfg.refSchoolIndex].filter((i) => state.model.s[i]);
  const latest = state.model.dataLatestYear;
  let options = '<option value="">' + latest + ' — актуални данни</option>';
  for (let y = latest - 1; y >= NAV_FIRST_YEAR; y--) {
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
  const li = e.target.closest('[data-i]');
  if (li && e.target.closest('.chip__x')) {
    state.selection = state.selection.filter((i) => i !== Number(li.dataset.i));
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
  hint: 'Напиши поне 2 букви от името на училището или града.',
  emptyText: 'Няма такова училище',
  search: (q) => searchSchools(state.model, state.index, q, { isSelected: selected }),
  onSelect(item) {
    if (selected(item.id)) {
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
  el.code.textContent = 'Данните не можаха да се заредят. Опитай да презаредиш страницата.';
}

loadGrade(7).catch(loadFailed);
