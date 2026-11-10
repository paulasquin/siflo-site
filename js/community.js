// /communaute and /community: short links to the community groups (« Siflo sur Siflo », "Siflo on Siflo"). The group's
// invitation is the `data-link` of the page's body (a /j link, regenerate qr.svg with tools/community_qr.py when it
// changes). On a phone: a button that hands it to Siflo (an intent on Android, siflo:// on iPhone), and store buttons
// that copy it first, for the first-launch Paste card. Elsewhere: its QR code.
const link = document.body.dataset.link;
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const android = /Android/.test(navigator.userAgent);
const phone = ios || android;

if (!link) {
  document.querySelectorAll('.phone, .desk').forEach(e => { e.hidden = true; });
  document.querySelectorAll('.soon').forEach(e => { e.hidden = false; });
} else {
  const path = link.replace(/^https:\/\/siflo\.app/, '');
  document.querySelectorAll('.phone').forEach(e => { e.hidden = !phone; });
  document.querySelectorAll('.desk').forEach(e => { e.hidden = phone; });
  document.querySelectorAll('.open').forEach(a => {
    a.href = android ? `intent://siflo.app${path}#Intent;scheme=https;package=app.siflo;end` : 'siflo:/' + path;
  });
  document.querySelectorAll('button.copy').forEach(b => b.addEventListener('click', () => {
    const open = () => { location.href = b.dataset.store; };
    Promise.resolve().then(() => navigator.clipboard.writeText(link)).then(open, open);
  }));
}
