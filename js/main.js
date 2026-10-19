// Page wiring: strings, plain sections (screens, cipher, film), the stage and its
// three acts (canyon, signal, mesh), then the reveal.
import { registerStrings, applyStatic, LANG, t } from './kit/i18n.js';
import { STRINGS } from './strings.js';
import {
  $, $$, capture, debug, lenis, setupAnchors, webglOK, setupStage, bindActs, setupPanels, setupReveals,
  setupNav, setupLightbox, finishBoot,
} from './kit/page.js';

registerStrings(STRINGS);

const SCREENS = {
  fr: [
    ['01-fr-signals', 'Les quatre signaux et le SOS'],
    ['02-fr-home', "L'accueil : vos groupes et les personnes à proximité"],
    ['03-fr-group', 'Le QR code du groupe, à scanner sans réseau'],
  ],
  en: [
    ['01-signals', 'The four signals and the SOS'],
    ['02-sent', 'A signal sent, with its acknowledgements'],
    ['03-chat', 'The group chat, encrypted'],
    ['04-invite', "The group's QR code, to scan, no network needed"],
    ['05-create', 'Creating a group: activity, duration, quick signals'],
    ['06-identity', 'Your identity, verified in person'],
    ['07-dark', 'Settings, in the dark theme'],
  ],
};

function renderScreens() {
  $('#screens').innerHTML = SCREENS[LANG].map(([f, cap]) => `
    <figure data-lightbox="screens"><div class="shot"><img src="assets/screens/${f}.webp" data-full="assets/screens/${f}.webp" alt="${cap}" loading="lazy" width="540" height="1080"></div><figcaption>${cap}</figcaption></figure>`).join('');
}

/** The relay row scrambles: a message, its ciphertext as seen by the relay, the same message decrypted. */
function setupCipher() {
  const msgs = LANG === 'fr'
    ? ['STOP · de Julie', 'OK · de Marc', 'Rappel en place', 'On se retrouve au pied du 3ᵉ rappel']
    : ['STOP · from Julie', 'OK · from Marc', 'Rope rigged', 'Meet at the foot of the 3rd rappel'];
  const plain = $('#cipher-plain'), noise = $('#cipher-noise'), out = $('#cipher-out');
  const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[(Math.random() * 16) | 0]).join('');
  let i = 0, timer = null;
  const step = () => {
    const m = msgs[i++ % msgs.length];
    plain.textContent = m;
    out.textContent = '';
    let k = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      noise.textContent = hex(24 + m.length) .replace(/(.{8})/g, '$1 ');
      if (++k === 14) { clearInterval(timer); out.textContent = m; }
    }, 70);
  };
  step();
  let loop = null;
  ScrollTrigger.create({
    trigger: '#confidentialite', start: 'top 80%', end: 'bottom 20%',
    onToggle: (s) => { clearInterval(loop); if (s.isActive) loop = setInterval(step, 3200); },
  });
}

/** Self-hosted film (no third-party request): the source is attached on the first click. */
function setupFilm() {
  const box = $('#film-player'), video = $('#film-video');
  $('.film-play', box).addEventListener('click', () => {
    if (!video.src) {
      video.src = video.dataset[LANG === 'fr' ? 'srcFr' : 'srcEn'];
      video.textContent = t('film.unsupported');
    }
    video.controls = true;
    video.play();
    box.classList.add('playing');
  });
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
    },
  });
  setupAnchors();
  renderScreens();
  setupLightbox();
  setupNav();
  setupFilm();

  const onProgress = loaderArcs();
  onProgress(0.2);
  let bundle = null;
  if (webglOK()) {
    try {
      await document.fonts.ready;
      bundle = await setupStage(async ({ labelsFor }) => {
        const [{ CanyonAct }, { SignalAct }, { MeshAct }] = await Promise.all([
          import('./acts/canyon.js'), import('./acts/signal.js'), import('./acts/mesh.js'),
        ]);
        onProgress(0.6);
        return {
          canyon: new CanyonAct({ labels: labelsFor() }),
          signal: new SignalAct({ labels: labelsFor() }),
          mesh: new MeshAct({ labels: labelsFor() }),
        };
      }, onProgress);
    } catch (e) { console.error('3D stage disabled:', e); }
  }
  if (!bundle) document.body.classList.add('no-webgl');
  onProgress(1);
  setupPanels();
  setupReveals();
  setupCipher();
  if (bundle) {
    bindActs(bundle);
    // Each act learns at which progress its cards are centred (layout differs on phones).
    const marks = () => $$('section.act').forEach((sec) => {
      const range = sec.offsetHeight - innerHeight;
      bundle.acts[sec.dataset.act].marks = $$('.panel', sec).map((pn) => (pn.offsetTop + pn.offsetHeight / 2 - innerHeight / 2) / range);
    });
    marks();
    ScrollTrigger.addEventListener('refresh', marks);
  }
  if (debug || capture) window.__kit = { ...bundle, lenis };
  await finishBoot();
}

boot();
