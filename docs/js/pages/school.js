// Страница на училище (/school/{код}/): графиките по клас и PDF профилът.
// Данните са вградени в страницата (#school-data) — същият документ като в API-то.
import { NUM_YEARS_BY_GRADE } from '../core/config.js';
import { whenHighcharts, lineOptions, createChart, token, onThemeChange } from '../ui/chart-theme.js';
import { toast } from '../site.js';

const GRADE_META = {
  4: { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 },
  7: { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 },
  10: { bel: 'БЕЛ', mat: 'МАТ', floor: 0, ceiling: 100 },
  12: { bel: 'ДЗИ-БЕЛ', mat: 'ДЗИ-2', floor: 0, ceiling: 6 }
};

const dataEl = document.getElementById('school-data');
const data = dataEl ? JSON.parse(dataEl.textContent) : null;
const charts = [];

/**
 * Прозорецът от последните numYears години; празните години в началото и края се
 * изрязват чрез xAxis.min/max (данните остават подравнени с прозореца).
 */
export function seriesForGrade(grade, g) {
  const years = (g && g.yearsRange) || data.yearsRange || [];
  const start = Math.max(0, years.length - (NUM_YEARS_BY_GRADE[grade] || 8));
  const out = { categories: [], bel: [], mat: [], belU: [], matU: [], first: -1, last: -1 };
  for (let j = start; j < years.length; j++) {
    const k = out.categories.length;
    out.categories.push(String(years[j]));
    const b = g.belScore[j] == null ? null : g.belScore[j];
    const m = g.matScore[j] == null ? null : g.matScore[j];
    out.bel.push(b);
    out.mat.push(m);
    out.belU.push(g.belStudents ? g.belStudents[j] : null);
    out.matU.push(g.matStudents ? g.matStudents[j] : null);
    if (b != null || m != null) {
      if (out.first < 0) {
        out.first = k;
      }
      out.last = k;
    }
  }
  return out;
}

function render() {
  charts.splice(0).forEach((c) => c.destroy());
  Object.keys(data.grades).forEach((grade) => {
    const container = document.getElementById('chart-' + grade);
    if (!container) {
      return;
    }
    const meta = GRADE_META[grade];
    const s = seriesForGrade(grade, data.grades[grade]);
    if (s.first < 0) {
      container.closest('.chart-frame').hidden = true;
      return;
    }
    const options = lineOptions({ height: 320, min: meta.floor, max: meta.ceiling, categories: s.categories });
    options.xAxis.min = s.first;
    options.xAxis.max = s.last;
    options.xAxis.startOnTick = false;
    options.xAxis.endOnTick = false;
    options.legend = {
      enabled: true,
      align: 'left',
      verticalAlign: 'top',
      margin: 4,
      itemStyle: { color: token('--text-2', '#3a465c'), fontWeight: '600', fontSize: '12px' }
    };
    options.tooltip.formatter = function() {
      const k = this.points && this.points[0] ? this.points[0].point.index : 0;
      let html = '<div class="tt"><div class="tt__year">' + this.x + '</div>';
      this.points.forEach((p) => {
        const students = p.series.index === 0 ? s.belU[k] : s.matU[k];
        html += '<div class="tt__row"><span class="dot" style="background:' + p.color + '"></span><span class="tt__name">'
          + p.series.name + '</span><span class="tt__val">' + window.Highcharts.numberFormat(p.y, 2, '.', '')
          + '</span><span class="tt__sub">' + (students ? students + ' уч.' : '') + '</span></div>';
      });
      return html + '</div>';
    };
    options.series = [
      { name: meta.bel, data: s.bel, color: token('--chart-bel', '#2f54e0') },
      { name: meta.mat, data: s.mat, color: token('--chart-mat', '#e8850c') }
    ];
    charts.push(createChart(container, options));
  });
}

if (data && data.grades) {
  whenHighcharts().then(render).catch((err) => console.error(err));
  onThemeChange(render);
}

const pdfBtn = document.getElementById('school-pdf');
if (pdfBtn && data) {
  pdfBtn.addEventListener('click', async () => {
    pdfBtn.classList.add('is-busy');
    try {
      const m = await import('../core/pdf.js');
      await m.schoolProfilePdf(data, GRADE_META, seriesForGrade);
    } catch (err) {
      console.error(err);
      toast('Грешка при генериране на PDF. Опитай отново.');
    } finally {
      pdfBtn.classList.remove('is-busy');
    }
  });
}

// Лепкавата навигация по класове: маркира класа, който се вижда в момента.
const navLinks = Array.from(document.querySelectorAll('.school-nav a[href^="#grade-"]'));
if (navLinks.length && 'IntersectionObserver' in window) {
  const visible = new Map();
  const mark = () => {
    let best = null;
    visible.forEach((ratio, id) => {
      if (!best || ratio > best.ratio) {
        best = { id, ratio };
      }
    });
    navLinks.forEach((a) => a.classList.toggle('is-active', !!best && a.getAttribute('href') === '#' + best.id));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        visible.set(e.target.id, e.intersectionRatio);
      } else {
        visible.delete(e.target.id);
      }
    });
    mark();
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  navLinks.forEach((a) => {
    const section = document.querySelector(a.getAttribute('href'));
    if (section) {
      io.observe(section);
    }
  });
}
