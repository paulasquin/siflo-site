// /groupe: the link of a partner site (siflo.app/groupe#v=1&n=...&j=1) when Siflo is not installed. Reads the fragment in the
// browser only, shows the place's name, and builds the Google Play link that carries the whole link as install referrer.
const raw = location.hash.slice(1);
const params = new Map();
if (raw.length <= 2048) {
  for (const part of raw.split('&')) {
    const i = part.indexOf('=');
    const key = part.slice(0, i);
    if (i < 1 || params.has(key)) continue;
    try { params.set(key, decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' ')).normalize('NFC')); } catch (e) {}
  }
}
const newer = params.has('v') && params.get('v') !== '1';
const join = !newer && params.get('j') === '1';
const clean = s => [...s.replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim()].slice(0, 120).join('');
const name = newer ? '' : clean(params.get('n') || '');
const link = 'https://siflo.app/groupe' + (raw.length <= 2048 && raw ? '#' + raw : '');

document.querySelectorAll('.only-create').forEach(e => { e.hidden = join; });
document.querySelectorAll('.only-join').forEach(e => { e.hidden = !join; });
document.querySelectorAll('.newer').forEach(e => { e.hidden = !newer; });
document.querySelectorAll('.at').forEach(e => { e.hidden = !name; });
document.querySelectorAll('.name').forEach(e => { e.textContent = name; });
document.querySelectorAll('h1').forEach(h => {
  const own = h.querySelector(join ? '.only-join' : '.only-create');
  h.dataset.title = own.textContent;
});
document.querySelectorAll('a.play').forEach(a => {
  if (link.includes('#')) a.href += '&referrer=' + encodeURIComponent(link);
});
document.querySelectorAll('button.copy').forEach(b => b.addEventListener('click', () => {
  const open = () => { location.href = 'https://apps.apple.com/app/id6827630745'; };
  Promise.resolve().then(() => navigator.clipboard.writeText(link)).then(open, open);
}));
