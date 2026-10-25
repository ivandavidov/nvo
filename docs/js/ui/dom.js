// Малки помощници за DOM - без зависимости.

export function esc(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Нормализиране за търсене: малки букви, ё → е, единични интервали. */
export function normalize(str) {
  return String(str || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/** Изтегляне на текстов файл (CSV и др.) през Blob. */
export function download(filename, content, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Числа с точка и фиксиран брой знаци (както в таблиците досега). */
export function fmt(value, digits = 2) {
  return value === null || value === undefined || value === '' ? '' : Number(value).toFixed(digits);
}

/**
 * Отваря модален <dialog> и връща фокуса на елемента, който го е отворил, при затваряне.
 * Chrome го прави сам, Safari - не (фокусът пада на <body>; там и кликът не фокусира бутона,
 * затова бутонът се подава изрично).
 */
export function showModal(dialog, opener = document.activeElement) {
  dialog.showModal();
  dialog.addEventListener('close', () => {
    if (opener && opener.isConnected && typeof opener.focus === 'function') {
      opener.focus();
    }
  }, { once: true });
}
