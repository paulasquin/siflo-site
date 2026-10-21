// Landing pages of the app links: page language, and on iPhone a button that hands the link to the app through siflo://.
// The invitation or identity card sits in the fragment, which the browser never sends to the server.
const en = !/^fr\b/i.test(new URLSearchParams(location.search).get('lang') || navigator.language || '');
document.documentElement.lang = en ? 'en' : 'fr';
document.querySelectorAll('[lang="fr"]').forEach(e => { e.hidden = en; });
document.querySelectorAll('[lang="en"]').forEach(e => { e.hidden = !en; });
document.title = document.querySelector(`section[lang="${document.documentElement.lang}"] h1`).textContent + ' · Siflo';

if (location.hash && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
  document.querySelectorAll('.open').forEach(a => {
    a.href = 'siflo:/' + location.pathname.replace(/\/$/, '') + location.hash;
    a.hidden = a.closest('[lang]').hidden;
  });
}
