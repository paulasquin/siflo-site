// Landing pages of the app links: page language, and on a phone a button that hands the link to the app (siflo:// on
// iPhone, an intent on Android: the page shows when a camera or scanner app opens the link in a browser instead of Siflo).
// The invitation or identity card sits in the fragment, which the browser never sends to the server.
let saved = null;
try { saved = localStorage.getItem('lang'); } catch (e) {}
function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('section[lang]').forEach(e => { e.hidden = e.lang !== lang; });
  document.querySelectorAll('.lang-switch button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
  document.title = document.querySelector(`section[lang="${lang}"] h1`).textContent + ' · Siflo';
}
setLang(/^fr\b/i.test(new URLSearchParams(location.search).get('lang') || saved || navigator.language || '') ? 'fr' : 'en');
// The same choice as the main site's switch: saved for every page, and kept in the address for a shared link.
document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem('lang', b.dataset.lang); } catch (e) {}
  const url = new URL(location.href);
  url.searchParams.set('lang', b.dataset.lang);
  history.replaceState(null, '', url);
  setLang(b.dataset.lang);
}));

const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
const android = /Android/.test(navigator.userAgent);
if (location.hash && (ios || android)) {
  const link = location.pathname.replace(/\/$/, '') + location.hash;
  document.querySelectorAll('.open').forEach(a => {
    // Android: this very link, handed to Siflo whatever its version, or to Google Play when it is not installed.
    a.href = android ? `intent://siflo.app${link}#Intent;scheme=https;package=app.siflo;end` : 'siflo:/' + link;
    a.hidden = a.closest('[lang]').hidden;
  });
}
