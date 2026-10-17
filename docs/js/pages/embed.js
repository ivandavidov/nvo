// Вградими графики (/{клас}/embed.html) — за iframe на други сайтове.
// Параметри: s=кодове (стабилни) или i{клас}=индекси, chart=b|m, theme=dark|light
// (обработва се от theme.js), year=година. Височината се съобщава на родителя
// с postMessage({ type: 'nvo-embed-resize', height }).
import { fetchGradeData, buildModel, chartSeries, findSchoolIndexByCode } from '../core/model.js';
import { whenHighcharts, lineOptions, createChart, seriesColor, onThemeChange } from '../ui/chart-theme.js';

const grade = Number(document.body.dataset.grade);
const params = new URL(window.location.href).searchParams;
const only = params.get('chart') === 'b' || params.get('chart') === 'm' ? params.get('chart') : null;
const charts = { b: null, m: null };
let model = null;
let selection = [];

function readSelection() {
  const out = [];
  const add = (i) => {
    if (Number.isInteger(i) && i >= 0 && model.s[i] && !out.includes(i)) {
      out.push(i);
    }
  };
  const codes = params.get('s');
  if (codes) {
    codes.split(',').forEach((c) => add(findSchoolIndexByCode(model, c.trim())));
  }
  const ids = params.get(model.cfg.cookieName);
  if (!out.length && ids) {
    ids.split(',').filter((x) => x !== '').forEach((x) => add(Number(x)));
  }
  if (!out.length) {
    add(model.cfg.baseSchoolIndex);
    add(model.cfg.refSchoolIndex);
  }
  return out;
}

function chartHeight() {
  const footer = document.getElementById('embed-footer');
  const titles = document.querySelectorAll('.embed__frame:not([hidden]) .chart-title');
  let used = footer ? footer.offsetHeight : 30;
  titles.forEach((t) => { used += t.offsetHeight + 8; });
  const available = window.innerHeight - used - 16;
  return only ? Math.max(available, 250) : Math.max(Math.floor(available / 2), 200);
}

function postHeight() {
  const height = document.body.scrollHeight;
  if (height > 0 && window.parent !== window) {
    window.parent.postMessage({ type: 'nvo-embed-resize', height }, '*');
  }
}

function render() {
  ['b', 'm'].forEach((subj) => {
    if (only && only !== subj) {
      return;
    }
    const { categories, series } = chartSeries(model, selection, subj);
    const options = lineOptions({ height: chartHeight(), min: model.cfg.chartFloor, max: model.cfg.chartCeiling, categories });
    options.legend = {
      enabled: true,
      align: 'left',
      itemStyle: { color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(), fontWeight: '500', fontSize: '12px' }
    };
    options.tooltip.shared = false;
    options.tooltip.useHTML = false;
    options.tooltip.formatter = function() {
      const idx = this.series.userOptions.schoolIndex;
      const yIdx = Number.parseInt(this.x, 10) - model.firstYear;
      const counts = subj === 'b' ? model.s[idx].bu : model.s[idx].mu;
      const students = counts && yIdx >= 0 ? counts[yIdx] : null;
      return '<b>' + this.series.name + '</b><br/>Година: <b>' + this.x + '</b><br/>Резултат: <b>'
        + window.Highcharts.numberFormat(this.y, 2, '.', '') + '</b>' + (students ? '<br/>Ученици: <b>' + students + '</b>' : '');
    };
    options.series = series.map((x, k) => ({ name: x.name, data: x.data, color: seriesColor(selection.indexOf(x.index) + 1), schoolIndex: x.index }));
    if (charts[subj]) {
      charts[subj].destroy();
    }
    charts[subj] = createChart(document.getElementById('chart-' + subj), options);
  });
  postHeight();
}

async function init() {
  if (only) {
    document.querySelector('.embed__frame[data-subject="' + (only === 'b' ? 'm' : 'b') + '"]').hidden = true;
  }
  const raw = await fetchGradeData(grade, new URL('../../data/grade-' + grade + '.json', import.meta.url).toString());
  model = buildModel(grade, raw, { year: params.get('year') });
  selection = readSelection();
  await whenHighcharts();
  render();
  let timer = null;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      ['b', 'm'].forEach((subj) => {
        if (charts[subj]) {
          charts[subj].setSize(null, chartHeight(), false);
        }
      });
      postHeight();
    }, 150);
  });
  onThemeChange(render);
}

init().catch((err) => console.error(err));
