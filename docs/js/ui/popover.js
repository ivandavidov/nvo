// Падащите менюта <details data-popover> ("Изтегли ▾", "Класации по години"): отварят се
// от <summary> (работят и без JS); тук - затваряне при клик навън, Esc и избор,
// стрелки ↑/↓ между елементите и панел, който не излиза извън екрана.

const ITEMS = 'a[href], button:not([disabled])';
const EDGE = 16;

function panelOf(details) {
  return details.querySelector(':scope > :not(summary)');
}

function items(details) {
  const panel = panelOf(details);
  return panel ? Array.from(panel.querySelectorAll(ITEMS)) : [];
}

function close(details, focusSummary) {
  if (!details.open) {
    return;
  }
  details.open = false;
  if (focusSummary) {
    details.querySelector('summary').focus();
  }
}

/** Мести панела хоризонтално, за да е изцяло в екрана (с отстъп EDGE). */
function fit(details) {
  const panel = panelOf(details);
  if (!panel) {
    return;
  }
  panel.style.transform = '';
  const r = panel.getBoundingClientRect();
  const max = document.documentElement.clientWidth - EDGE;
  let dx = 0;
  if (r.right > max) {
    dx = max - r.right;
  }
  if (r.left + dx < EDGE) {
    dx = EDGE - r.left;
  }
  if (dx) {
    panel.style.transform = 'translateX(' + Math.round(dx) + 'px)';
  }
}

export function initPopovers() {
  // toggle не изплува - слушаме във фазата на прихващане.
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.matches('[data-popover]') || !d.open) {
      return;
    }
    document.querySelectorAll('details[data-popover][open]').forEach((o) => {
      if (o !== d) {
        o.open = false;
      }
    });
    fit(d);
  }, true);

  document.addEventListener('click', (e) => {
    document.querySelectorAll('details[data-popover][open]').forEach((d) => {
      if (!d.contains(e.target)) {
        close(d, false);
      } else if (e.target.closest(ITEMS) && panelOf(d).contains(e.target)) {
        // изборът е направен - действието се обработва от страницата
        setTimeout(() => close(d, false), 0);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    const d = e.target.closest && e.target.closest('details[data-popover]');
    if (!d) {
      return;
    }
    if (e.key === 'Escape' && d.open) {
      e.preventDefault();
      close(d, true);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
      return;
    }
    const list = items(d);
    if (!list.length) {
      return;
    }
    e.preventDefault();
    if (!d.open) {
      d.open = true;
    }
    const i = list.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown'
      ? list[i < 0 ? 0 : (i + 1) % list.length]
      : list[i < 0 ? list.length - 1 : (i - 1 + list.length) % list.length];
    next.focus();
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('details[data-popover][open]').forEach(fit);
  });
}
