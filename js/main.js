// Page wiring: strings, the activity (its texts and chips), plain sections (screens, the hero film,
// encryption), the stage and its acts (the activity's hero, none for the general identity; signal,
// mesh), then the reveal.
import { registerStrings, applyStatic, LANG, t } from './kit/i18n.js';
import { STRINGS } from './strings.js?v=partout';
import { activity, applyActivity, setupActivitySwitch } from './activity.js';
import { setupIdMerge } from './idmerge.js?v=partout';
import {
  $, $$, capture, debug, lenis, setupAnchors, webglOK, setupStage, bindActs, setupPanels, setupReveals,
  setupNav, setupLightbox, finishBoot,
} from './kit/page.js?v=partout';

registerStrings(STRINGS);

// The presentation film in the hero, on YouTube. English: the current English Short until the new one is up.
const HERO_FILM = { fr: '6FA-N-e3nms', en: 'SSMs3xLIuFo' };

// The 0.37.0 store captures, without their captions: Android or iPhone after the visitor's phone (Android on a computer).
const SCREENS = {
  fr: [
    ['01-offgrid', 'La carte et le groupe, sans réseau'],
    ['02-chat', 'La discussion du groupe'],
    ['03-talkie', 'Le talkie-walkie'],
    ['04-film', 'La sortie en film 3D'],
    ['05-light', 'Ombre et soleil sur l’itinéraire'],
    ['06-point', 'Un point du terrain'],
    ['07-signals', 'Les signaux du groupe'],
    ['08-sos', 'Le SOS'],
  ],
  en: [
    ['01-offgrid', 'The map and the group, with no signal'],
    ['02-chat', 'The group chat'],
    ['03-talkie', 'The walkie-talkie'],
    ['04-film', 'Your outing as a 3D film'],
    ['05-light', 'Shade and sun on your route'],
    ['06-point', 'A point on the terrain'],
    ['07-signals', 'The group’s signals'],
    ['08-sos', 'The SOS'],
  ],
};
// The map section shows three of them.
const MAP_SHOTS = ['05-light', '06-point', '04-film'];

// Relative to this script, so that /en/ finds them too.
const SHOTS = new URL('../assets/screens/037/', import.meta.url).href;

function renderScreens() {
  const os = document.documentElement.dataset.os === 'ios' ? 'ios' : 'android';
  const [w, h] = os === 'ios' ? [640, 1391] : [640, 1422];
  const fig = ([f, cap], group) => `
    <figure data-lightbox="${group}"><div class="shot"><img src="${SHOTS}${f}-${os}-${LANG}.webp" data-full="${SHOTS}${f}-${os}-${LANG}.webp" alt="${cap}" loading="lazy" width="${w}" height="${h}"></div><figcaption>${cap}</figcaption></figure>`;
  $('#screens').innerHTML = SCREENS[LANG].map((e) => fig(e, 'screens')).join('');
  const map = $('#map-shots');
  if (map) map.innerHTML = MAP_SHOTS.map((f) => fig(SCREENS[LANG].find(([g]) => g === f), 'map')).join('');
}

/** The hero's film: the self-hosted poster until a click, then the YouTube player in its place (no request to YouTube before). */
function setupHeroFilm() {
  const box = $('.hero-film');
  if (!box) return;
  const img = $('img', box);
  if (LANG === 'en' && img.getAttribute('src') !== img.dataset.enSrc) img.src = img.dataset.enSrc;
  $('.hf-play', box).addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${HERO_FILM[LANG]}?autoplay=1&playsinline=1&rel=0`;
    f.title = t('hero.film.title');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    box.replaceChildren(f);
    box.classList.add('playing');
  }, { once: true });
}

/** The hero's range: members drift, a link shows between two of them when they are within reach (100 to 300 m), one
 *  LoRa link spans the gap between two clusters, and a message hops from the first member to the last. A still drawing
 *  for reduced motion; paused off screen. */
function setupRangeNet() {
  const svg = $('.hr-net');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg', REACH = 74;
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  // Two clusters joined by a LoRa link: members 0 to 4 on the left, 5 to 8 on the right.
  const base = [[10, 40], [52, 22], [70, 52], [112, 34], [150, 50], [206, 30], [244, 50], [272, 24], [310, 42]];
  const ph = base.map((_, i) => i * 1.7);
  const lora = [4, 5];
  const gLinks = el('g', {}), gNodes = el('g', {});
  const loraPath = el('path', { class: 'lora' }, gLinks);
  const links = [];
  for (let i = 0; i < base.length; i++) for (let j = i + 1; j < base.length; j++) if (!(i === lora[0] && j === lora[1])) links.push([i, j, el('line', { class: 'lk' }, gLinks)]);
  const nodes = base.map(() => { const g = el('g', {}, gNodes); return [el('circle', { class: 'halo', r: 14 }, g), el('circle', { class: 'nd', r: 3.4 }, g)]; });
  const msg = el('circle', { class: 'msg', r: 2.6 });
  const pos = (t) => base.map(([x, y], i) => [x + 3 * Math.sin(t * 0.0007 + ph[i]), y + 5 * Math.sin(t * 0.0009 + ph[i] * 1.3)]);
  const HOPS = base.length - 1, HOP = 420, PAUSE = 1400;
  const draw = (t) => {
    const p = pos(t), k = (t % (base.length * HOP + PAUSE)) / HOP, hop = Math.min(Math.floor(k), HOPS);
    for (const [i, j, l] of links) {
      const d = Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]);
      l.setAttribute('x1', p[i][0]); l.setAttribute('y1', p[i][1]); l.setAttribute('x2', p[j][0]); l.setAttribute('y2', p[j][1]);
      l.style.opacity = d < REACH ? Math.min(1, (REACH - d) / 16) : 0;
      l.classList.toggle('on', j === i + 1 && j <= hop);
    }
    const [a, b] = [p[lora[0]], p[lora[1]]];
    loraPath.setAttribute('d', `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${Math.min(a[1], b[1]) - 26} ${b[0]},${b[1]}`);
    nodes.forEach(([h, c], i) => { for (const e of [h, c]) { e.setAttribute('cx', p[i][0]); e.setAttribute('cy', p[i][1]); } c.classList.toggle('on', i <= hop); });
    if (k < HOPS) {
      const f = k - hop, [x0, y0] = p[hop], [x1, y1] = p[hop + 1];
      // Over the LoRa link the message follows the arc (a quadratic Bézier).
      const cy = Math.min(y0, y1) - 26, y = hop === lora[0] ? (1 - f) * (1 - f) * y0 + 2 * f * (1 - f) * cy + f * f * y1 : y0 + (y1 - y0) * f;
      msg.setAttribute('cx', x0 + (x1 - x0) * f); msg.setAttribute('cy', y); msg.style.opacity = 1;
    } else msg.style.opacity = 0;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(0); return; }
  let on = false, raf = 0;
  const loop = (t) => { draw(t); if (on) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(loop); }).observe(svg);
}

/** Loader: the three arcs of the whistle icon light up with the loading progress. */
function loaderArcs() {
  const arcs = $$('.loader-mark .lm-arc');
  return (f) => arcs.forEach((a, i) => a.classList.toggle('on', f > (i + 0.5) / 3.2));
}

async function boot() {
  applyStatic({
    onApplied: () => {
      // English page: privacy links go to the top of the policy (English first), badge text.
      $$('a[href="privacy/#francais"]').forEach((a) => a.setAttribute('href', 'privacy/'));
      $$('[data-i18n-badge]').forEach((el) => el.setAttribute('data-badge', STRINGS.static[el.dataset.i18nBadge]));
      ['title', 'description'].forEach((k) => $(`meta[property="og:${k}"]`).setAttribute('content', STRINGS.static[`meta.og.${k}`]));
    },
  });
  setupActivitySwitch();
  setupAnchors();
  renderScreens();
  setupLightbox();
  setupNav();
  setupHeroFilm();
  setupRangeNet();

  const onProgress = loaderArcs();
  onProgress(0.2);
  applyActivity();
  setupIdMerge();
  // The general identity has no 3D behind the hero's two cards: they follow the hero as a plain row, revealed like a section.
  if (activity() === 'general') $$('#top .panel:not(.panel-hero)').forEach((pn) => { pn.classList.add('panel-flat'); $('.card', pn).classList.add('reveal'); });
  // Sections of other identities (data-only, a list) leave the page before the stage and the panels count them.
  $$('[data-only]').forEach((el) => { if (!el.dataset.only.split(' ').includes(activity())) el.remove(); });
  let bundle = null;
  if (webglOK()) {
    try {
      await document.fonts.ready;
      bundle = await setupStage(async ({ labelsFor }) => {
        const climb = $('section[data-act="climb"]');
        const [hero, { SignalAct }, { MeshAct }, extra] = await Promise.all([
          activity() === 'general' ? null : import(`./acts/${activity()}.js`), import('./acts/signal.js'), import('./acts/mesh.js'), climb ? import('./acts/climb.js') : null,
        ]);
        onProgress(0.6);
        return {
          ...(hero && { hero: new hero.HeroAct({ labels: labelsFor() }) }),
          signal: new SignalAct({ labels: labelsFor() }),
          ...(extra && { climb: new extra.ClimbAct({ labels: labelsFor() }) }),
          mesh: new MeshAct({ labels: labelsFor() }),
        };
      }, onProgress);
    } catch (e) { console.error('3D stage disabled:', e); }
  }
  if (!bundle) document.body.classList.add('no-webgl');
  onProgress(1);
  setupPanels();
  setupReveals();
  if (bundle) {
    bindActs(bundle);
    // Each act learns at which progress its cards are centred (layout differs on phones).
    const marks = () => $$('section.act').filter((sec) => bundle.acts[sec.dataset.act]).forEach((sec) => {
      const range = sec.offsetHeight - innerHeight;
      bundle.acts[sec.dataset.act].marks = $$('.panel', sec).map((pn) => (pn.offsetTop + pn.offsetHeight / 2 - innerHeight / 2) / range);
    });
    marks();
    ScrollTrigger.addEventListener('refresh', marks);
  }
  if (debug || capture) window.__kit = { ...bundle, lenis };
  await finishBoot();
  import('./cipher.js').then(({ mountCipher }) => mountCipher($('#cipher'), { cut: 'short' }));
}

boot();
