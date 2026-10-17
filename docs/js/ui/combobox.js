// Combobox с търсене: поле + падащ списък с групи, навигация с клавиатура.
//   createCombobox({ input, host, search(query) → [{ label, items: [{ id, title, meta, checked }] }],
//                    onSelect(item), emptyText, minChars })
import { esc } from './dom.js';
import { icon } from './icons.js';

let uid = 0;

export function createCombobox({ input, host, search, onSelect, emptyText = 'Няма резултати', hint = '', minChars = 1 }) {
  const id = 'combo-' + (++uid);
  const list = document.createElement('div');
  list.className = 'combo__list';
  list.id = id;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  host.appendChild(list);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', id);
  input.setAttribute('autocomplete', 'off');

  let items = [];
  let active = -1;

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function setActive(i) {
    active = i;
    list.querySelectorAll('.combo__opt').forEach((el) => {
      const on = Number(el.dataset.i) === i;
      el.classList.toggle('is-active', on);
      if (on) {
        input.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function render() {
    const q = input.value.trim();
    if (q.length < minChars) {
      if (hint) {
        list.innerHTML = '<div class="combo__empty">' + esc(hint) + '</div>';
        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      } else {
        close();
      }
      items = [];
      return;
    }
    const groups = search(q) || [];
    items = [];
    const html = [];
    groups.forEach((g) => {
      if (!g.items.length) {
        return;
      }
      if (g.label) {
        html.push('<div class="combo__group" role="presentation">' + esc(g.label) + '</div>');
      }
      g.items.forEach((item) => {
        const i = items.push(item) - 1;
        html.push('<div class="combo__opt" role="option" id="' + id + '-' + i + '" data-i="' + i + '"'
          + ' aria-selected="false"' + (item.checked ? ' aria-checked="true"' : '') + '>'
          + '<span class="combo__opt-main">' + (item.html || esc(item.title)) + '</span>'
          + (item.meta ? '<span class="combo__opt-meta">' + esc(item.meta) + '</span>' : '')
          + icon('check', 'combo__check') + '</div>');
      });
    });
    if (!items.length) {
      html.push('<div class="combo__empty">' + esc(emptyText) + '</div>');
    }
    list.innerHTML = html.join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(items.length ? 0 : -1);
  }

  function choose(i) {
    const item = items[i];
    if (!item) {
      return;
    }
    onSelect(item);
    input.value = '';
    close();
  }

  input.addEventListener('input', render);
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= minChars || hint) {
      render();
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (list.hidden) {
        render();
      } else if (items.length) {
        setActive((active + 1) % items.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) {
        setActive((active - 1 + items.length) % items.length);
      }
    } else if (e.key === 'Enter') {
      if (!list.hidden && active >= 0) {
        e.preventDefault();
        choose(active);
      }
    } else if (e.key === 'Escape') {
      if (!list.hidden) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    }
  });
  list.addEventListener('mousedown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const opt = e.target.closest('.combo__opt');
    if (opt) {
      choose(Number(opt.dataset.i));
    }
  });
  list.addEventListener('mousemove', (e) => {
    const opt = e.target.closest('.combo__opt');
    if (opt && Number(opt.dataset.i) !== active) {
      setActive(Number(opt.dataset.i));
    }
  });
  document.addEventListener('click', (e) => {
    if (!host.contains(e.target)) {
      close();
    }
  });

  return { close, refresh: render };
}
