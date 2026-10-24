// Последно избраният град — общ за страниците 4/7/10/12, класациите по град и
// баловете (localStorage nvo-city). Без достъп до хранилището (частен прозорец,
// блокирани данни) просто няма запомнен град и страницата показва София.
const KEY = 'nvo-city';

export function readRememberedCity() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch (e) {
    return '';
  }
}

export function rememberCity(slug) {
  if (!slug) {
    return;
  }
  try {
    localStorage.setItem(KEY, slug);
  } catch (e) {
    // няма къде да се запомни — следващото отваряне показва София
  }
}
