// The four identities of the page. The inline script in index.html <head> picks the activity
// before first paint (an activity's own page, ?activite= / ?activity=, then the visitor's saved
// choice, else canyon) and sets <html data-activity>, which the stylesheet themes. The selector in
// the hero (.hero-acts) and the switch in the top bar go to the other identity's page.
// The canyon copy is the page itself; the other activities replace a few texts below.
import { LANG, registerStrings } from './kit/i18n.js';
import { THEMES, COPY, PAGES } from './activity-data.js';

export { THEMES };

export const ACTIVITIES = ['canyon', 'mountain', 'cave', 'gathering'];
export const activity = () => (ACTIVITIES.includes(document.documentElement.dataset.activity) ? document.documentElement.dataset.activity : 'canyon');

export const theme = () => THEMES[activity()];

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
    $('.ha-current use')?.setAttribute('href', `#act-${a}`);
    const name = $('.ha-name');
    if (name) name.innerHTML = $('.act-n', cur).innerHTML;
    $$('.ha-list [data-activity]').forEach((b) => b.toggleAttribute('aria-current', b.dataset.activity === a));
  }
  if (!c) return;
  registerStrings({ ui: c.ui });
  for (const [k, v] of Object.entries(c[LANG] || {})) $$(`[data-i18n="${k}"]`).forEach((el) => { el.innerHTML = v; });
  const box = $('.features.cases');
  if (box) {
    c.cases.forEach((i) => { const card = $(`[data-case="${i}"]`, box); if (card) box.appendChild(card); });
  }
}

/** The hero's selector and the top bar's switch: another activity reloads the page in its identity, from the top. */
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
  // The hero: the current terrain's logo; a tap fans out the three, a tap on one switches.
  const hero = $('.hero-acts'), logo = $('.ha-current');
  const fan = (on) => { hero?.classList.toggle('open', on); logo?.setAttribute('aria-expanded', on); };
  logo?.addEventListener('click', (e) => { e.stopPropagation(); fan(!hero.classList.contains('open')); });
  document.addEventListener('click', (e) => { if (hero && !hero.contains(e.target)) fan(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fan(false); });
  $$('.act-menu [data-activity], .hero-acts [data-activity]').forEach((b) => b.addEventListener('click', () => {
    open(false);
    fan(false);
    const a = b.dataset.activity;
    if (a === activity()) return;
    save(a);
    document.documentElement.dataset.activity = a;
    document.body.classList.add('switching');
    // Each identity has its own address (PAGES): /montagne/, /en/caving/… and / for canyon.
    const url = new URL(PAGES[a][LANG].path, location.origin);
    setTimeout(() => { scrollTo(0, 0); location.assign(url); }, 450);
  }));
}
