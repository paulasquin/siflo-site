// Page wiring: strings, the activity (its texts and switches), plain sections (screens,
// film, encryption), the stage and its three acts (the activity's hero, signal, mesh), then the reveal.
import { registerStrings, applyStatic, LANG, t } from './kit/i18n.js';
import { STRINGS } from './strings.js';
import { activity, applyActivity, setupActivitySwitch } from './activity.js';
import {
  $, $$, capture, debug, lenis, setupAnchors, webglOK, setupStage, bindActs, setupPanels, setupReveals,
  setupNav, setupLightbox, finishBoot,
} from './kit/page.js';

registerStrings(STRINGS);

const SCREENS = {
  fr: [
    ['01-home', 'L’accueil : vos groupes et vos conversations privées'],
    ['02-group-chat', 'La discussion du groupe : photos, vocaux, réponses, réactions'],
    ['03-signals', 'Un signal à tout le groupe : reçu, puis vu'],
    ['04-topo', 'Le topo du groupe, gardé sur chaque téléphone'],
    ['05-before-you-go', 'Avant de partir : la liste à cocher du canyon'],
    ['06-sos-countdown', 'Le SOS : le compte à rebours et les destinataires'],
    ['07-invite-qr', 'Le QR code du groupe, à scanner sans réseau'],
    ['08-member-distances', 'La distance et la direction de chaque membre'],
  ],
  en: [
    ['01-home', 'Home: your groups and private chats'],
    ['02-group-chat', 'The group chat: photos, voice notes, replies, reactions'],
    ['03-signals', 'A signal to the whole group: received, then seen'],
    ['04-topo', 'The group’s topo, kept on every phone'],
    ['05-before-you-go', 'Before you go: the canyoning checklist'],
    ['06-sos-countdown', 'The SOS: the countdown and who gets it'],
    ['07-invite-qr', 'The group’s QR code, to scan with no signal'],
    ['08-member-distances', 'How far away each member is, and in which direction'],
  ],
};

// Relative to this script, so that /en/ finds them too.
const SHOTS = new URL('../assets/screens/', import.meta.url).href;

// The checklist screenshot is the canyon's: other activities say so.
const CHECKLIST = { fr: 'Avant de partir\u00a0: une liste à cocher par activité (ici, le canyon)', en: 'Before you go: a checklist per activity (here, canyoning)' };

function renderScreens() {
  const caption = (f, cap) => (f === '05-before-you-go' && activity() !== 'canyon' ? CHECKLIST[LANG] : cap);
  $('#screens').innerHTML = SCREENS[LANG].map(([f, c]) => [f, caption(f, c)]).map(([f, cap]) => `
    <figure data-lightbox="screens"><div class="shot"><img src="${SHOTS}${f}-${LANG}.webp" data-full="${SHOTS}${f}-${LANG}.webp" alt="${cap}" loading="lazy" width="720" height="1600"></div><figcaption>${cap}</figcaption></figure>`).join('');
}

/** Self-hosted film (no third-party request): the source is attached on the first click. */
function setupFilm() {
  const box = $('#film-player'), video = $('#film-video');
  if (LANG !== 'fr') video.poster = video.dataset.posterEn;
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
      ['title', 'description'].forEach((k) => $(`meta[property="og:${k}"]`).setAttribute('content', STRINGS.static[`meta.og.${k}`]));
    },
  });
  setupActivitySwitch();
  setupAnchors();
  renderScreens();
  setupLightbox();
  setupNav();
  setupFilm();

  const onProgress = loaderArcs();
  onProgress(0.2);
  applyActivity();
  // Sections of another identity (data-only) leave the page before the stage and the panels count them.
  $$('[data-only]').forEach((el) => { if (el.dataset.only !== activity()) el.remove(); });
  let bundle = null;
  if (webglOK()) {
    try {
      await document.fonts.ready;
      bundle = await setupStage(async ({ labelsFor }) => {
        const climb = $('section[data-act="climb"]');
        const [hero, { SignalAct }, { MeshAct }, extra] = await Promise.all([
          import(`./acts/${activity()}.js`), import('./acts/signal.js'), import('./acts/mesh.js'), climb ? import('./acts/climb.js') : null,
        ]);
        onProgress(0.6);
        return {
          hero: new hero.HeroAct({ labels: labelsFor() }),
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
    const marks = () => $$('section.act').forEach((sec) => {
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
