// The three identities of the page. The inline script in index.html <head> picks the activity
// before first paint (?activite= / ?activity=, then the visitor's saved choice; canyon for
// crawlers) and sets <html data-activity>, which the stylesheet themes. A first visit gets the
// chooser (#chooser) before the 3D stage loads; the switch in the top bar changes it later.
// The canyon copy is the page itself; the other activities replace a few texts below.
import { LANG, registerStrings } from './kit/i18n.js';

export const ACTIVITIES = ['canyon', 'mountain', 'cave'];
export const activity = () => (ACTIVITIES.includes(document.documentElement.dataset.activity) ? document.documentElement.dataset.activity : 'canyon');

/** Colours of the 3D acts: the phones' glow, the signal close-up and the contour map. */
export const THEMES = {
  canyon: {
    signal: '#ff6a00', bg: '#0e0b09',
    close: { bg: '#110c09', key: '#ffd9bd', rim: '#ff7a2e', ambient: '#3a2a22', bokeh: ['#ff6a00', '#ff9a5a', '#ffd2a8', '#4d7f9a', '#7fc4e6'], body: '#2a221d' },
    map: { bg: '#0b0907', lo: [0.004, 0.003, 0.0025], hi: [0.03, 0.019, 0.012], line: [1.0, 0.45, 0.18], river: '#5fa8cc', amber: '#ffc46a', grey: '#b9a99c' },
  },
  mountain: {
    signal: '#3fc3ff', bg: '#060a10',
    close: { bg: '#070c13', key: '#dff1ff', rim: '#3aa8ff', ambient: '#1c2a3a', bokeh: ['#3fc3ff', '#9fe0ff', '#e6f6ff', '#5d7dc4', '#b9c8ff'], body: '#1d2630' },
    map: { bg: '#05080d', lo: [0.006, 0.009, 0.014], hi: [0.05, 0.07, 0.095], line: [0.45, 0.8, 1.0], river: '#e8f4ff', amber: '#c9b6ff', grey: '#9fb3c6' },
  },
  cave: {
    signal: '#f5b324', bg: '#090908',
    close: { bg: '#0a0907', key: '#fff1d2', rim: '#f5a524', ambient: '#2a2620', bokeh: ['#f5b324', '#ffd27a', '#fff3d6', '#3f6f68', '#7fb8a8'], body: '#25221d' },
    map: { bg: '#080706', lo: [0.004, 0.0035, 0.003], hi: [0.028, 0.024, 0.017], line: [1.0, 0.72, 0.2], river: '#4fb3a6', amber: '#9fe0c8', grey: '#b3aa98' },
  },
};
export const theme = () => THEMES[activity()];

const NNBSP = ' ';
const q = (s) => `«${NNBSP}${s}${NNBSP}»`;

/**
 * Texts that change with the activity, keyed like data-i18n (static) and t() (ui). `cases` is the
 * order of the field cases (#terrain), the activity's own first.
 */
const COPY = {
  mountain: {
    cases: [4, 1, 2, 3],
    fr: {
      'hero.eyebrow': 'Ski de rando, alpinisme, escalade',
      'c1.h': 'Le sifflet, c’est bien. Quand le vent le laisse passer.',
      'c1.p': 'Quatre codes seulement, qui changent d’un club à l’autre. Une rafale sur l’arête suffit à les couvrir. Quand la neige craque sous les skis en haut du couloir, ceux d’en bas n’en savent rien. Ceux déjà au fond du vallon, encore moins.',
      'c2.p': `Julie écrit ${q('Ça craque, un par un')}. Le téléphone de Marc, à mi-pente, transmet le message à Léa et Tom, déjà au fond du vallon.`,
      's1.p': 'Quatre grosses touches, faciles à viser avec des gants. Les points rappellent le nombre de coups de sifflet. Chaque club peut y mettre ses propres codes, même les plus ésotériques.',
      'sig.release': 'Un par un', 'sig.pull': 'Regroupement',
      's2.p': 'Julie, en haut du couloir, envoie STOP à Marc, qui s’apprête à s’y engager. Son téléphone vibre au rythme du code, siffle et affiche l’alerte en plein écran, même verrouillé. Le reste du groupe continue de manger ses barres.',
      'ch.av': 'BL', 'ch.group': 'Belledonne · ski de rando', 'ch.place': 'Parking du départ', 'ch.m2': 'J’apporte le DVA de rechange. Et les croissants.',
    },
    en: {
      'hero.eyebrow': 'Ski touring, mountaineering, climbing',
      'c1.h': 'A whistle is great. When the wind lets it through.',
      'c1.p': 'Only four codes, which change from club to club. One gust on the ridge is enough to drown them out. When the snow cracks under the skis at the top of the couloir, those below have no idea. And those already down in the valley have even less.',
      'c2.p': 'Julie types “It’s cracking, one at a time”. Marc’s phone, halfway down the slope, passes the message on to Léa and Tom, already down in the valley.',
      's1.p': 'Four big buttons, easy to hit with gloves on. The dots match the number of whistle blasts. Each club can put in its own codes, even the most obscure ones.',
      'sig.release': 'One at a time', 'sig.pull': 'Regroup',
      's2.p': 'Julie, at the top of the couloir, sends STOP to Marc, about to drop in. His phone vibrates to the rhythm of the code, whistles and shows a full-screen alert, even when locked. The rest of the group carries on with their snack bars.',
      'ch.av': 'BL', 'ch.group': 'Belledonne ski tour', 'ch.place': 'Trailhead car park', 'ch.m2': 'I’ll bring the spare transceiver. And the croissants.',
    },
    ui: {
      fr: {
        'phone.group': 'Belledonne', 'phone.release': 'Un par un', 'phone.pull': 'Regroupement',
        'label.waterfall': 'Rafales · le son se perd', 'label.julie': `Julie${NNBSP}: ${q('Ça craque, un par un')}`,
        'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, au fond du vallon', 'label.icefall': 'Cascade de glace', 'label.icecave': 'Grotte de glace',
      },
      en: {
        'phone.group': 'Belledonne', 'phone.release': 'One at\na time', 'phone.pull': 'Regroup',
        'label.waterfall': 'Gusts · sound is lost', 'label.julie': 'Julie: “It’s cracking, one at a time”',
        'label.relay': 'Marc relays the message', 'label.ahead': 'Léa and Tom, down in the valley', 'label.icefall': 'Frozen waterfall', 'label.icecave': 'Ice cave',
      },
    },
  },
  cave: {
    cases: [3, 1, 2, 4],
    fr: {
      'hero.eyebrow': 'Spéléologie',
      'c1.h': 'Le sifflet, c’est bien. Quand le puits le laisse remonter.',
      'c1.p': 'Quatre codes seulement, qui changent d’un club à l’autre. Sous terre, l’écho les brouille et la moindre cascade les couvre. Quand la corde frotte au fractionnement, ceux d’en bas n’en savent rien. Ceux partis devant dans la galerie, encore moins.',
      'c2.p': `Julie écrit ${q('La corde frotte, ne montez pas')}. Le téléphone de Marc, au pied du puits, transmet le message à Léa et Tom, plus loin dans la galerie. Tant que chacun reste à portée du suivant, le message suit l’équipe.`,
      's1.p': 'Quatre grosses touches, faciles à viser avec des doigts pleins de boue. Les points rappellent le nombre de coups de sifflet. Chaque club peut y mettre ses propres codes, même les plus ésotériques.',
      's2.p': 'Julie, en haut du puits, envoie STOP à Marc, en pleine remontée sur la corde. Son téléphone vibre au rythme du code, siffle et affiche l’alerte en plein écran, même verrouillé. Le reste de l’équipe continue de manger ses barres.',
      'ch.av': 'GB', 'ch.group': 'Gouffre Berger', 'ch.place': 'Entrée du gouffre', 'ch.m2': 'J’apporte le kit de secours. Et les croissants.',
    },
    en: {
      'hero.eyebrow': 'Caving',
      'c1.h': 'A whistle is great. When the shaft lets it back up.',
      'c1.p': 'Only four codes, which change from club to club. Underground, echoes blur them and the smallest waterfall drowns them out. When the rope rubs at the rebelay, those at the bottom have no idea. And those who went ahead down the passage have even less.',
      'c2.p': 'Julie types “Rope is rubbing, don’t come up”. Marc’s phone, at the foot of the shaft, passes the message on to Léa and Tom, further down the passage. As long as each one stays in range of the next, the message follows the team.',
      's1.p': 'Four big buttons, easy to hit with muddy fingers. The dots match the number of whistle blasts. Each club can put in its own codes, even the most obscure ones.',
      's2.p': 'Julie, at the top of the shaft, sends STOP to Marc, halfway up the rope. His phone vibrates to the rhythm of the code, whistles and shows a full-screen alert, even when locked. The rest of the team carries on with their snack bars.',
      'ch.av': 'GB', 'ch.group': 'Gouffre Berger', 'ch.place': 'Cave entrance', 'ch.m2': 'I’ll bring the rescue kit. And the croissants.',
    },
    ui: {
      fr: {
        'phone.group': 'Gouffre Berger',
        'label.waterfall': 'Cascade du puits · le son se perd', 'label.julie': `Julie${NNBSP}: ${q('La corde frotte, ne montez pas')}`,
        'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, dans la galerie',
      },
      en: {
        'phone.group': 'Gouffre Berger',
        'label.waterfall': 'Shaft waterfall · sound is lost', 'label.julie': 'Julie: “Rope is rubbing, don’t come up”',
        'label.relay': 'Marc relays the message', 'label.ahead': 'Léa and Tom, down the passage',
      },
    },
  },
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function save(a) {
  try { localStorage.setItem('activity', a); } catch (e) { /* private mode */ }
}

/** Write the activity's texts, field-case order, switch and browser colour into the page. */
export function applyActivity() {
  const a = activity(), c = COPY[a];
  $('meta[name="theme-color"]')?.setAttribute('content', THEMES[a].bg);
  const cur = $(`.act-menu [data-activity="${a}"]`);
  if (cur) {
    $('.act-current .act-ico use')?.setAttribute('href', `#act-${a}`);
    $('.act-current .act-name').innerHTML = $('.act-n', cur).innerHTML;
    $$('.act-menu [data-activity]').forEach((b) => b.setAttribute('aria-checked', b === cur));
  }
  if (!c) return;
  registerStrings({ ui: c.ui });
  for (const [k, v] of Object.entries(c[LANG] || {})) $$(`[data-i18n="${k}"]`).forEach((el) => { el.innerHTML = v; });
  const box = $('.features.cases');
  if (box) {
    const cards = $$('.case', box);
    c.cases.forEach((i) => box.appendChild(cards[i - 1]));
  }
}

/** First visit: show the chooser and resolve once an activity is picked (at once otherwise). */
export function chooseActivity() {
  const root = document.documentElement, box = $('#chooser');
  if (!root.classList.contains('choose-activity') || !box) return Promise.resolve(activity());
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add('on'));
  return new Promise((resolve) => {
    const pick = (a) => {
      root.dataset.activity = a;
      save(a);
      root.classList.remove('choose-activity');
      box.classList.remove('on');
      document.removeEventListener('keydown', esc);
      setTimeout(() => { box.hidden = true; }, 700);
      resolve(a);
    };
    const esc = (e) => { if (e.key === 'Escape') pick(activity()); };
    document.addEventListener('keydown', esc);
    $$('[data-activity]', box).forEach((b) => {
      b.addEventListener('click', () => pick(b.dataset.activity));
      // Preview the identity on hover and focus: the page behind recolours.
      const preview = () => { root.dataset.activity = b.dataset.activity; };
      b.addEventListener('pointerenter', preview);
      b.addEventListener('focus', preview);
    });
    $('[data-activity]', box)?.focus({ preventScroll: true });
  });
}

/** The switch in the top bar: another activity reloads the page in its identity, from the top. */
export function setupActivitySwitch() {
  const sw = $('.act-switch');
  if (!sw) return;
  const btn = $('.act-current', sw), menu = $('.act-menu', sw);
  const open = (on) => {
    menu.hidden = !on;
    btn.setAttribute('aria-expanded', on);
    sw.classList.toggle('open', on);
  };
  btn.addEventListener('click', (e) => { e.stopPropagation(); open(menu.hidden); });
  document.addEventListener('click', (e) => { if (!sw.contains(e.target)) open(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
  $$('[data-activity]', menu).forEach((b) => b.addEventListener('click', () => {
    open(false);
    const a = b.dataset.activity;
    if (a === activity()) return;
    save(a);
    document.documentElement.dataset.activity = a;
    document.body.classList.add('switching');
    const url = new URL(location.href);
    url.searchParams.delete('activite'); url.searchParams.delete('activity');
    url.hash = '';
    setTimeout(() => { scrollTo(0, 0); location.replace(url); }, 450);
  }));
}
