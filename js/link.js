// Landing pages of the app links: page language, and on a phone a button that hands the link to the app (siflo:// on
// iPhone, an intent on Android: the page shows when a camera or scanner app opens the link in a browser instead of Siflo).
// The invitation or identity card sits in the fragment, which the browser never sends to the server.
const en = !/^fr\b/i.test(new URLSearchParams(location.search).get('lang') || navigator.language || '');
document.documentElement.lang = en ? 'en' : 'fr';
document.querySelectorAll('[lang="fr"]').forEach(e => { e.hidden = en; });
document.querySelectorAll('[lang="en"]').forEach(e => { e.hidden = !en; });
document.title = document.querySelector(`section[lang="${document.documentElement.lang}"] h1`).textContent + ' · Siflo';

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
