// Адрес и HTML код за вграждане на графиките (/{клас}/embed.html).
export const PROD_BASE = 'https://ivandavidov.github.io/nvo/';

/** Параметрите: предпочитаме стабилните кодове (s=), иначе индексите (i{g}=). */
export function embedQuery(model, indices, { chart = '', theme = '', year = null } = {}) {
  const params = new URLSearchParams();
  const codes = indices.map((i) => model.s[i] && model.s[i].c);
  if (codes.length && codes.every(Boolean)) {
    params.set('s', codes.join(','));
  } else if (indices.length) {
    params.set(model.cfg.cookieName, indices.join(','));
  }
  if (chart) {
    params.set('chart', chart);
  }
  if (theme) {
    params.set('theme', theme);
  }
  if (year) {
    params.set('year', String(year));
  }
  return params.toString().replace(/%2C/g, ',');
}

export function embedSrc(model, indices, opts = {}, base = PROD_BASE) {
  return base + model.grade + '/embed.html?' + embedQuery(model, indices, opts);
}

export function embedCode(model, indices, opts = {}) {
  return '<iframe src="' + embedSrc(model, indices, opts) + '" width="100%" height="' + (opts.chart ? 600 : 1100) + '"'
    + ' frameborder="0" scrolling="no" style="border:none;max-width:100%" loading="lazy"'
    + ' title="' + model.cfg.short + ' - графики"></iframe>'
    // Видим линк към източника: линковете в iframe-а не се броят от търсачките за сайта, който вгражда.
    + '\n<p style="margin:4px 0 0;font-size:13px">Източник: <a href="' + PROD_BASE + model.grade + '/">'
    + model.cfg.short + ' - резултати и класации на училищата</a></p>';
}
