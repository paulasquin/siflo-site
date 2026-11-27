// The five identities of the page. The inline script in index.html <head> picks the activity
// before first paint (an activity's own page, ?activite= / ?activity=, then the visitor's saved
// choice, else the general one) and sets <html data-activity>, which the stylesheet themes. The chips
// above the hero title (.hero-ids) go to another identity's page.
// The general copy is the page itself; the other activities replace a few texts below.
import { LANG, registerStrings } from './kit/i18n.js';
import { THEMES, COPY, PAGES } from './activity-data.js';

export { THEMES };

export const ACTIVITIES = ['general', 'canyon', 'mountain', 'cave', 'gathering'];
export const activity = () => (ACTIVITIES.includes(document.documentElement.dataset.activity) ? document.documentElement.dataset.activity : 'general');

export const theme = () => THEMES[activity()];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function save(a) {
  try { localStorage.setItem('activity', a); } catch (e) { /* private mode */ }
}

/** Write the activity's texts, field-case order, chips and browser colour into the page. */
export function applyActivity() {
  const a = activity(), c = COPY[a];
  $('meta[name="theme-color"]')?.setAttribute('content', THEMES[a].bg);
  $$('.hero-ids [data-activity]').forEach((b) => (b.dataset.activity === a ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  if (!c) return;
  registerStrings({ ui: c.ui });
  for (const [k, v] of Object.entries(c[LANG] || {})) $$(`[data-i18n="${k}"]`).forEach((el) => { el.innerHTML = v; });
  const box = $('.features.cases');
  if (box) {
    c.cases.forEach((i) => { const card = $(`[data-case="${i}"]`, box); if (card) box.appendChild(card); });
  }
}

/** The chips above the hero title: another activity reloads the page in its identity, from the top. */
export function setupActivitySwitch() {
  $$('.hero-ids [data-activity]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.activity;
    if (a === activity()) return;
    save(a);
    document.documentElement.dataset.activity = a;
    document.body.classList.add('switching');
    // Each identity has its own address (PAGES): /canyon/, /en/caving/… and / for the general one.
    const url = new URL(PAGES[a][LANG].path, location.origin);
    setTimeout(() => { scrollTo(0, 0); location.assign(url); }, 450);
  }));
}
