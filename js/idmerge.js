// The identity chips (.hero-ids) merge into the nav logo as soon as the page starts scrolling: they break
// into points that fly into the logo, which then wears a five-colour badge. Scrolling back up sends the
// points back to re-form the chips. Once merged, the logo is a button that opens the same chips as a
// column under it, re-formed from points out of the logo; Escape or a click outside sends them back.
// One fixed canvas over the page, idle between transitions. Reduced motion: a plain fade, no points.
import { t } from './kit/i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DUR = 480, STEP = 3;
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

/** The chips' pixels as points, relative to the box's top-left: each pill redrawn from its computed style. */
function sample(box) {
  const dpr = Math.min(2, devicePixelRatio || 1), r0 = box.getBoundingClientRect();
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(r0.width * dpr) + 2; cv.height = Math.ceil(r0.height * dpr) + 2;
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  for (const b of box.querySelectorAll('button')) {
    const r = b.getBoundingClientRect(), cs = getComputedStyle(b), x = r.left - r0.left, y = r.top - r0.top;
    c.beginPath(); c.roundRect(x + 0.5, y + 0.5, r.width - 1, r.height - 1, r.height / 2);
    c.fillStyle = cs.backgroundColor; c.fill();
    c.strokeStyle = cs.borderTopColor; c.lineWidth = 1; c.stroke();
    const ico = b.querySelector('.act-ico'), ir = ico.getBoundingClientRect();
    c.fillStyle = getComputedStyle(ico).color;
    c.beginPath(); c.arc(ir.left - r0.left + ir.width / 2, ir.top - r0.top + ir.height / 2, ir.width * 0.42, 0, 7); c.fill();
    const span = b.querySelector('span'), sr = span.getBoundingClientRect();
    c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; c.textBaseline = 'middle'; c.fillStyle = cs.color;
    c.fillText(span.textContent, sr.left - r0.left, sr.top - r0.top + sr.height / 2);
  }
  const d = c.getImageData(0, 0, cv.width, cv.height).data, pts = [], s = Math.round(STEP * dpr);
  for (let y = 0; y < cv.height; y += s) for (let x = 0; x < cv.width; x += s) {
    const k = (y * cv.width + x) * 4;
    if (d[k + 3] > 90) pts.push({ x: x / dpr, y: y / dpr, col: `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`, d: Math.random() * 0.2, jx: Math.random() * 10 - 5, jy: Math.random() * 10 - 5 });
  }
  return pts;
}

export function setupIdMerge() {
  const chips = $('#top .hero-ids'), brand = $('.topnav .brand'), nav = $('.topnav');
  if (!chips || !brand) return;
  const root = document.documentElement, mark = $('.brand-mark', brand);
  const badge = document.createElement('span');
  badge.className = 'brand-badge';
  badge.setAttribute('aria-hidden', 'true');
  badge.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
  mark.appendChild(badge);

  const menu = chips.cloneNode(true);
  menu.className = 'hero-ids id-menu';
  menu.id = 'id-menu';
  menu.removeAttribute('data-i18n-aria');
  menu.hidden = true;
  document.body.appendChild(menu);
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-activity]');
    if (!b) return;
    if (b.hasAttribute('aria-current')) { close(); return; }
    chips.querySelector(`[data-activity="${b.dataset.activity}"]`).click();
  });

  const cv = document.createElement('canvas');
  cv.className = 'id-particles';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let anim = null, raf = 0;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const logoPt = () => { const r = mark.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  /** Points from (toLogo) or to the box, which may move with the page while they fly. */
  function fly(box, pts, toLogo, done) {
    cancelAnimationFrame(raf);
    const t0 = performance.now(), r0 = box.getBoundingClientRect();
    anim = () => {
      const u = (performance.now() - t0) / DUR, r = box.getBoundingClientRect(), [lx, ly] = logoPt();
      const ox = r0.left + (r.left - r0.left), oy = r0.top + (r.top - r0.top);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of pts) {
        const v = ease((u - p.d) / 0.8), w = toLogo ? v : 1 - v;
        ctx.globalAlpha = 1 - w * w * w;
        ctx.fillStyle = p.col;
        ctx.fillRect(ox + p.x + (lx + p.jx - ox - p.x) * w, oy + p.y + (ly + p.jy - oy - p.y) * w, 2, 2);
      }
      ctx.globalAlpha = 1;
      if (u < 1) raf = requestAnimationFrame(anim);
      else { ctx.clearRect(0, 0, innerWidth, innerHeight); anim = null; done(); }
    };
    raf = requestAnimationFrame(anim);
  }

  // Merged: the chips are hidden, the badge shows and the logo becomes the menu's button.
  let merged = false;
  const setButton = (on) => {
    if (on) {
      brand.setAttribute('role', 'button');
      brand.setAttribute('aria-haspopup', 'true');
      brand.setAttribute('aria-controls', 'id-menu');
      brand.setAttribute('aria-expanded', 'false');
      brand.setAttribute('aria-label', t('ids.change'));
    } else ['role', 'aria-haspopup', 'aria-controls', 'aria-expanded', 'aria-label'].forEach((a) => brand.removeAttribute(a));
  };
  function merge(on, instant) {
    if (on === merged) return;
    merged = on;
    if (!on) close(true);
    setButton(on);
    if (instant || reduced) { root.classList.toggle('ids-merged', on); root.classList.remove('ids-flying'); return; }
    const pts = sample(chips);
    root.classList.add('ids-flying');
    if (on) {
      root.classList.add('ids-merged');
      fly(chips, pts, true, () => root.classList.remove('ids-flying'));
    } else {
      root.classList.remove('ids-merged');
      fly(chips, pts, false, () => root.classList.remove('ids-flying'));
    }
  }

  // The menu under the logo.
  const place = () => {
    const r = mark.getBoundingClientRect();
    menu.style.left = `${Math.max(8, r.left - 6)}px`;
    menu.style.top = `${r.bottom + 12}px`;
  };
  const isOpen = () => !menu.hidden && !menu.classList.contains('closing');
  function open() {
    place();
    menu.hidden = false;
    brand.setAttribute('aria-expanded', 'true');
    const focus = () => (menu.querySelector('[aria-current]') || menu.querySelector('button')).focus({ preventScroll: true });
    if (reduced) { menu.classList.add('shown'); focus(); return; }
    const pts = sample(menu);
    fly(menu, pts, false, () => { menu.classList.add('shown'); });
    focus();
  }
  function close(quiet) {
    if (menu.hidden) return;
    brand.setAttribute('aria-expanded', 'false');
    const end = () => { menu.hidden = true; menu.classList.remove('shown', 'closing'); };
    if (reduced || quiet) { end(); return; }
    const pts = sample(menu);
    menu.classList.add('closing');
    menu.classList.remove('shown');
    fly(menu, pts, true, end);
  }

  document.addEventListener('click', (e) => {
    if (merged && e.target.closest('.topnav .brand')) {
      e.preventDefault();
      e.stopPropagation();
      isOpen() ? close() : open();
    } else if (isOpen() && !e.target.closest('#id-menu')) close();
  }, true);
  brand.addEventListener('keydown', (e) => {
    if (merged && e.key === ' ') { e.preventDefault(); brand.click(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { close(); brand.focus(); }
  });
  menu.addEventListener('focusout', (e) => {
    if (isOpen() && !menu.contains(e.relatedTarget) && e.relatedTarget !== brand) close();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const bs = [...menu.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
    bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length].focus();
  });

  // Merged after a few dozen pixels of scroll (the chips sit at the top of the page), back near the top.
  const check = (instant) => {
    merge(scrollY > (merged ? 12 : 28), instant);
    if (isOpen()) place();
  };
  check(true);
  addEventListener('scroll', () => check(false), { passive: true });
  addEventListener('resize', () => check(true));
}
