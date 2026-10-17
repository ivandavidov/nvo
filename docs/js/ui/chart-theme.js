// Обща визия за всички Highcharts графики: цветовете идват от CSS токените,
// така че светлата и тъмната тема се сменят без отделни настройки.

export function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v && v.trim() ? v.trim() : fallback;
}

export const PALETTE_SIZE = 10;

/** Цветът на серия по пореден номер в палитрата (1..10). */
export function seriesColor(slot) {
  return token('--chart-' + (((slot - 1) % PALETTE_SIZE) + 1), '#2f54e0');
}

export function whenHighcharts() {
  if (window.Highcharts) {
    return Promise.resolve(window.Highcharts);
  }
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.Highcharts) {
        clearInterval(timer);
        resolve(window.Highcharts);
      } else if (Date.now() - started > 15000) {
        clearInterval(timer);
        reject(new Error('Highcharts did not load'));
      }
    }, 30);
  });
}

let configured = false;

function configureOnce(H) {
  if (configured) {
    return;
  }
  configured = true;
  H.setOptions({
    accessibility: { enabled: false },
    lang: {
      decimalPoint: '.',
      thousandsSep: ' ',
      loading: 'Зареждане…',
      noData: 'Няма данни'
    }
  });
}

/** Базовите опции (без серии) за линейна графика по години. */
export function lineOptions({ height = 380, min, max, categories = [] } = {}) {
  const text = token('--text', '#0d1424');
  const muted = token('--chart-axis', '#5f6b82');
  const grid = token('--chart-grid', '#e8ecf2');
  const surface = token('--surface', '#ffffff');
  const border = token('--border', '#e1e6ee');
  const font = token('--font-sans', 'Inter, system-ui, sans-serif');
  return {
    chart: {
      type: 'line',
      height,
      backgroundColor: 'transparent',
      animation: false,
      spacing: [8, 4, 4, 0],
      style: { fontFamily: font }
    },
    title: { text: null },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories,
      lineColor: border,
      tickColor: border,
      tickLength: 0,
      labels: { style: { color: muted, fontSize: '12px' } },
      crosshair: { color: grid, width: 1 }
    },
    yAxis: {
      title: { text: null },
      floor: min,
      ceiling: max,
      gridLineColor: grid,
      labels: { style: { color: muted, fontSize: '12px' } }
    },
    tooltip: {
      shared: true,
      useHTML: true,
      animation: false,
      backgroundColor: surface,
      borderColor: border,
      borderRadius: 10,
      shadow: { color: 'rgba(16,24,40,0.12)', offsetX: 0, offsetY: 6, opacity: 1, width: 18 },
      padding: 10,
      style: { color: text, fontSize: '13px' }
    },
    plotOptions: {
      series: {
        animation: false,
        lineWidth: 2.25,
        connectNulls: false,
        marker: { enabled: true, radius: 3.5, symbol: 'circle', lineWidth: 0 },
        states: { hover: { lineWidthPlus: 1 }, inactive: { opacity: 0.25 } }
      }
    }
  };
}

export function createChart(container, options) {
  const H = window.Highcharts;
  configureOnce(H);
  const chart = H.chart(container, options);
  labelChart(chart);
  return chart;
}

/** Име за екранните четци на SVG-то на графиката — по заглавието на картата/секцията. */
export function labelChart(chart) {
  const box = chart.renderTo;
  const scope = box.closest('figure, .chart-card, .stat-section, .card, section');
  const heading = scope && scope.querySelector('figcaption, .chart-title, .chart-frame__title, h2, h3');
  const title = (heading && heading.textContent.trim()) || (chart.options.title && chart.options.title.text) || '';
  const svg = box.querySelector('svg');
  if (svg) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Графика' + (title ? ': ' + title : ''));
  }
}

/** Извиква fn при смяна на темата (за прерисуване на графиките). */
export function onThemeChange(fn) {
  document.addEventListener('nvo:themechange', fn);
}
