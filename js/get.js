// /get: page language (the same pick as the other pages) and the background: a contour
// map drifting slowly, the whistle's rings leaving the app icon. The store block for the device is picked in the head.
let saved = null;
try { saved = localStorage.getItem('lang'); } catch (e) {}
function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('section[lang]').forEach(e => { e.hidden = e.lang !== lang; });
  document.querySelectorAll('.lang-switch button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
  document.title = document.querySelector(`section[lang="${lang}"]`).dataset.title;
}
setLang(/^fr\b/i.test(new URLSearchParams(location.search).get('lang') || saved || navigator.language || '') ? 'fr' : 'en');
// Saved for every page, and kept in the address for a shared link.
document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem('lang', b.dataset.lang); } catch (e) {}
  const url = new URL(location.href);
  url.searchParams.set('lang', b.dataset.lang);
  history.replaceState(null, '', url);
  setLang(b.dataset.lang);
  draw(t);
}));


// Small value noise, and its contour lines (marching squares) drawn once into an offscreen canvas.
function noise2(seed) {
  const h = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return s - Math.floor(s); };
  const sm = v => v * v * (3 - 2 * v);
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y) => n(x, y) * .6 + n(x * 2.1, y * 2.1) * .28 + n(x * 4.3, y * 4.3) * .12;
}
function contours(w, h, dpr) {
  const step = 9, levels = 11, scale = .0042, f = noise2(7);
  const cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1, v = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = f(i * step * scale, j * step * scale);
  const off = document.createElement('canvas');
  off.width = Math.ceil(w * dpr); off.height = Math.ceil(h * dpr);
  const c = off.getContext('2d');
  c.scale(dpr, dpr); c.strokeStyle = 'rgba(255,196,160,.075)'; c.lineWidth = 1;
  const lerp = (p, q, t) => (t - p) / (q - p);
  for (let k = 1; k <= levels; k++) {
    const t = .18 + k * (.64 / levels);
    c.beginPath();
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const a = v[j * cols + i], b = v[j * cols + i + 1], d = v[(j + 1) * cols + i], e = v[(j + 1) * cols + i + 1];
      const x = i * step, y = j * step, pts = [];
      if ((a < t) !== (b < t)) pts.push([x + step * lerp(a, b, t), y]);
      if ((b < t) !== (e < t)) pts.push([x + step, y + step * lerp(b, e, t)]);
      if ((d < t) !== (e < t)) pts.push([x + step * lerp(d, e, t), y + step]);
      if ((a < t) !== (d < t)) pts.push([x, y + step * lerp(a, d, t)]);
      for (let p = 0; p + 1 < pts.length; p += 2) { c.moveTo(...pts[p]); c.lineTo(...pts[p + 1]); }
    }
    c.stroke();
  }
  return off;
}

// The canvas is as tall as the largest viewport (100lvh), so a phone's address bar coming and going does not resize it;
// the map is only redrawn when the window outgrows it, and drawn at its own size (it overflows, never stretches).
const cv = document.getElementById('bg'), ctx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)');
const PAD = 60;
let W = 0, H = 0, D = 0, map = null, mapW = 0, mapH = 0, raf = 0, t = 1.2;
function size() {
  const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  if (w === W && h === H && dpr === D) return;
  W = w; H = h;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!map || dpr !== D || w + 2 * PAD > mapW || h + 2 * PAD > mapH) {
    mapW = w + 2 * PAD; mapH = h + 2 * PAD;
    map = contours(mapW, mapH, dpr);
  }
  D = dpr;
}
function draw(time) {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(map, -PAD + Math.sin(time * .05) * 40, -PAD + Math.cos(time * .04) * 30, mapW, mapH);
  const r = document.querySelector('section:not([hidden]) .mark img').getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const p = (time / 1.8 + k / 4) % 1, rad = 46 + p * Math.max(W, 420) * .55;
    ctx.beginPath(); ctx.arc(cx, cy, rad, -0.9, 0.9);
    ctx.strokeStyle = `rgba(255,138,61,${(1 - p) * .55})`; ctx.lineWidth = 2.2 * (1 - p) + .4; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,138,61,${(1 - p) * .07})`; ctx.lineWidth = 1; ctx.stroke();
  }
}
function frame(ms) {
  t = ms / 1000;
  draw(t);
  raf = requestAnimationFrame(frame);
}
// Paused while the tab is hidden; one still frame when the visitor asks for less motion.
function play() {
  cancelAnimationFrame(raf);
  if (document.hidden) return;
  if (still.matches) draw(t); else raf = requestAnimationFrame(frame);
}
// The observer also catches a phone's viewport settling after the script ran, which fires no resize event.
function resize() { size(); draw(t); }
size();
play();
new ResizeObserver(resize).observe(cv);
addEventListener('resize', resize);
addEventListener('scroll', () => { if (still.matches) draw(t); }, { passive: true });
document.addEventListener('visibilitychange', play);
still.addEventListener('change', play);
