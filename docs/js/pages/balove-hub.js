// Хъбът на баловете (/7/balove/): търсене на град.
import { normalize } from '../ui/dom.js';

const input = document.getElementById('city-search');
const empty = document.getElementById('city-empty');
const items = Array.from(document.querySelectorAll('[data-name]')).map((li) => ({ li, name: normalize(li.dataset.name) }));

if (input) {
  input.addEventListener('input', () => {
    const q = normalize(input.value);
    let shown = 0;
    items.forEach((it) => {
      const show = !q || it.name.includes(q);
      it.li.hidden = !show;
      if (show) {
        shown++;
      }
    });
    document.querySelectorAll('[data-tier]').forEach((tier) => {
      tier.hidden = !tier.querySelector('[data-name]:not([hidden])');
    });
    empty.hidden = shown > 0;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = items.find((it) => !it.li.hidden);
      if (first) {
        window.location.href = first.li.querySelector('a').href;
      }
    }
  });
}
