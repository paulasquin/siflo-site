// Research page: the ways a Siflo phone reaches another one, drawn from one table of data in both
// languages ([fr, en] pairs). French static copy lives in research/index.html, its English below.
import { registerStrings, applyStatic, LANG, t } from './kit/i18n.js';

const L = (v) => (Array.isArray(v) ? v[LANG === 'fr' ? 0 : 1] : v);

const PHONES = [
  ['ios', ['iPhone', 'iPhone'], ['iPhone 15 à 18, version de Siflo en préparation', 'iPhone 15 to 18, Siflo app on its way']],
  ['old', ['Android milieu de gamme ou ancien', 'Mid-range or older Android'], ['Galaxy A, Redmi, téléphones de 2017 à 2020', 'Galaxy A, Redmi, phones from 2017 to 2020']],
  ['a16', ['Android récent, 15 ou 16', 'Recent Android, 15 or 16'], ['Pixel 8 et 9, Galaxy S24 et S25', 'Pixel 8 and 9, Galaxy S24 and S25']],
  ['a17', ['Android 17', 'Android 17'], ['Pixel 10 Pro XL, Galaxy S26 Ultra', 'Pixel 10 Pro XL, Galaxy S26 Ultra']],
];
const FEATS = [['Signaux', 'Signals'], ['SOS', 'SOS'], ['Messages', 'Messages'], ['Photos, vocaux', 'Photos, voice']];

// range: [on body min, max, in hand min, max] in metres (link-budget estimates), or null for no distance limit.
// phones: y / p (limited) / n per PHONES key; feats: y / p / n per FEATS entry.
const ROWS = [
  {
    group: 'app', name: ['Bluetooth standard', 'Standard Bluetooth'], sub: ['débit normal (1M), connexion dans les deux sens', 'normal rate (1M), two-way connection'],
    range: [5, 25, 50, 150],
    phones: { ios: 'y', old: 'y', a16: 'y', a17: 'y' },
    feats: ['y', 'y', 'y', 'y'], speed: ['30 à 100 ko/s', '30–100 kB/s'], battery: ['faible, toujours actif', 'low, always on'],
  },
  {
    group: 'app', name: ['Bluetooth longue portée', 'Long-range Bluetooth'], sub: ['mode longue portée du Bluetooth (Coded PHY), quand un message ne passe plus', "Bluetooth's long-range mode (Coded PHY), when a message does not get through"],
    range: [15, 50, 150, 300],
    phones: { ios: 'n', old: 'p', a16: 'y', a17: 'y' }, phoneNotes: { old: ['selon la puce', 'depends on the chip'] },
    feats: ['y', 'y', 'y', 'p'], featNotes: { 3: ['lents', 'slow'] },
    speed: ['5 à 12 ko/s', '5–12 kB/s'], battery: ['moyenne, seulement quand il le faut', 'medium, only when needed'],
  },
  {
    group: 'app', name: ['Wi-Fi de proximité', 'Nearby Wi-Fi'], sub: ['pour le débit, pas pour la portée', 'for throughput, not range'],
    range: [5, 25, 50, 150], rangeNote: ['même portée que le Bluetooth standard', 'same range as standard Bluetooth'],
    phones: { ios: 'n', old: 'y', a16: 'y', a17: 'y' }, phoneNotes: { old: ['Wi-Fi allumé', 'Wi-Fi on'], a16: ['Wi-Fi allumé', 'Wi-Fi on'], a17: ['Wi-Fi allumé', 'Wi-Fi on'] },
    feats: ['y', 'y', 'y', 'y'], speed: ['1 à 6 Mo/s', '1–6 MB/s'], battery: ['élevée : médias et SOS seulement', 'high: media and SOS only'],
  },
  {
    group: 'app', name: ['Relais internet', 'Internet relay'], sub: ['réseau mobile ou Wi-Fi', 'mobile data or Wi-Fi'],
    range: null, reach: ['avec réseau', 'coverage'], rangeNote: ['là où il y a du réseau mobile ou du Wi-Fi', 'wherever there is mobile or Wi-Fi coverage'],
    phones: { ios: 'y', old: 'y', a16: 'y', a17: 'y' },
    feats: ['y', 'p', 'y', 'y'], featNotes: { 1: ['groupe seulement', 'group only'] },
    speed: ["élevé, 0,2 à 2 s d'attente", 'high, 0.2–2 s delay'], battery: ['faible, réveil par notification', 'low, push wake-ups'],
    note: ['Un SOS envoyé à tous les téléphones proches, même inconnus, ne passe que par radio.', 'An SOS sent to every phone nearby, even unknown ones, goes by radio only.'],
  },
  {
    group: 'next', name: ["Balise d'alerte", 'Alert beacon'], sub: ['signal Bluetooth émis à pleine puissance, à sens unique', 'Bluetooth signal sent at full power, one-way'],
    tag: ['Prototype en test', 'Prototype in testing'],
    range: [25, 80, 250, 500], rangeNote: ['depuis Android 17 ; moins loin depuis Android 16 ou plus ancien', 'sent from Android 17; shorter from Android 16 or older'],
    phones: { ios: 'n', old: 'p', a16: 'p', a17: 'y' },
    phoneNotes: { old: ['si la puce le permet, 1 dBm', 'if the chip allows, 1 dBm'], a16: ['émet à 1 dBm', 'sends at 1 dBm'], a17: ['émet à environ 10 dBm', 'sends at about 10 dBm'] },
    feats: ['y', 'y', 'p', 'n'], featNotes: { 2: ['courts', 'short'] },
    speed: ['1 alerte toutes les 2 s, sans réponse', '1 alert every 2 s, no reply'], battery: ["2 à 11 % du temps radio, pendant l'alerte seulement", '2–11% of radio time, during an alert only'],
  },
  {
    group: 'next', name: ['Satellite', 'Satellite'], sub: ['réseaux satellite des opérateurs', "carriers' satellite networks"],
    tag: ['En préparation', 'In preparation'],
    range: null, reach: ['ciel ouvert', 'open sky'], rangeNote: ['partout à ciel ouvert, jamais en grotte', 'anywhere under open sky, never in caves'],
    phones: { ios: 'n', old: 'n', a16: 'p', a17: 'p' },
    phoneNotes: { ios: ["réservé aux fonctions d'Apple", "reserved for Apple's own features"], a16: ["Pixel 9 et plus, selon l'opérateur", 'Pixel 9 and later, depending on the carrier'], a17: ["selon l'opérateur", 'depending on the carrier'] },
    feats: ['y', 'y', 'p', 'n'], featNotes: { 2: ['courts', 'short'] },
    speed: ['quelques ko/s, plusieurs dizaines de secondes par message', 'a few kB/s, tens of seconds per message'], battery: ["élevée pendant l'envoi", 'high while sending'],
  },
];

registerStrings({
  ui: {
    fr: {
      'rs.method': 'Liaison', 'rs.range': 'Portée', 'rs.phones': 'Téléphones', 'rs.carries': 'Ce qui passe',
      'rs.body': 'sur soi', 'rs.hand': 'en main', 'rs.nolimit': 'sans limite', 'rs.speed': 'Débit', 'rs.battery': 'Consommation',
      'rs.y': 'oui', 'rs.p': 'limité', 'rs.n': 'non',
      'rs.app': "Dans l'application", 'rs.next': "Pas encore dans l'application",
    },
    en: {
      'rs.method': 'Link', 'rs.range': 'Range', 'rs.phones': 'Phones', 'rs.carries': 'What gets through',
      'rs.body': 'on body', 'rs.hand': 'in hand', 'rs.nolimit': 'no limit', 'rs.speed': 'Throughput', 'rs.battery': 'Battery use',
      'rs.y': 'yes', 'rs.p': 'limited', 'rs.n': 'no',
      'rs.app': 'In the app', 'rs.next': 'Not in the app yet',
    },
  },
  static: {
    'meta.title': 'Radio range · How Siflo phones reach each other',
    'meta.description': 'Standard and long-range Bluetooth, nearby Wi-Fi, internet relay, alert beacon and satellite: the estimated range of each Siflo link, the phones that can use it and what gets through.',
    'nav.aria': 'Main navigation', 'nav.back': 'About Siflo',
    'rs.k': 'Research · radio range',
    'rs.h': 'Six ways<br><em>to reach each other.</em>',
    'rs.lead': 'How a Siflo phone reaches another one: over Bluetooth, Wi-Fi, the internet and, later, satellite. For each link, the estimated range, the phones that can use it and what gets through.',
    'rs.p1': 'The ranges are estimated by calculation, not yet measured in the field. The scale is logarithmic: from one mark to the next, the distance is multiplied by ten. The first four links are in the app; the alert beacon is a prototype in testing and satellite is in preparation.',
    'rs.lg.body': 'On body: in a pocket or the pack', 'rs.lg.hand': 'In hand, line of sight, open ground',
    'rs.lg.y': 'Yes', 'rs.lg.p': 'Limited', 'rs.lg.n': 'No',
    'rs.n.k': 'Reading these figures', 'rs.n.h': 'A range is not a promise:<br><em>the terrain decides.</em>',
    'rs.n1h': 'One hop, then the next',
    'rs.n1p': 'Each range covers a single hop, from one phone to the next. Every phone in the group relays the others\' messages, up to 12&nbsp;hops: the chain reaches much further than a single hop.',
    'rs.n2h': 'Long range takes two',
    'rs.n2p': 'It only works between two compatible phones. On iPhone, Siflo will stay on standard Bluetooth, but a nearby Android will be able to relay for it over long range.',
    'rs.n3h': 'Terrain matters more than the link',
    'rs.n3p': 'Rock blocks everything: in a cave, messages go from phone to phone, in line of sight. Wet foliage divides the range by two or three, by our estimates. Nothing gets through under water.',
    'rs.n4h': 'Estimates, not yet measurements',
    'rs.n4p': 'They are calculated from the transmit power, the receivers\' sensitivity and the losses due to the body and the terrain. We will measure them in the field and update this page.',
    'rs.n5h': 'The alert beacon is one-way',
    'rs.n5p': 'The distant phone receives the alert but cannot answer along this path: there is no acknowledgement, and the alert is repeated every two seconds. It is a prototype in testing, not in the app yet.',
    'rs.n6h': 'Satellite, in preparation',
    'rs.n6p': 'Some recent Android phones send short messages by satellite, depending on the carrier; on iPhone, Apple keeps satellite for its own features. We are working on sending Siflo\'s SOS and signals by satellite; nothing is available yet.',
    'rs.sp1': 'Measured a range in the field?', 'rs.sp2': 'Write to us: your measurements help us correct these estimates.',
    'foot.aria': 'Links', 'foot.home': 'About', 'foot.research': 'Radio range', 'foot.privacy': 'Privacy', 'foot.contact': 'Contact',
  },
});

const $ = (s) => document.querySelector(s);
const pos = (m) => Math.log10(m) / 3 * 100; // 1 m → 1 km
const TICKS = [[1, '1 m'], [10, '10 m'], [100, '100 m'], [1000, '1 km']];
const STATE = { y: 'rs.y', p: 'rs.p', n: 'rs.n' };
const dot = (s) => `<i class="dot ${s}"></i><span class="sr">${t(STATE[s])} : </span>`;

const scale = `<div class="rs-trk rs-scale" aria-hidden="true"><span></span><div>${TICKS.map(([m, txt]) => `<span style="left:${pos(m)}%">${txt}</span>`).join('')}</div><span></span></div>`;

function rangeCell(r) {
  const trk = (who, bar, val) => `<div class="rs-trk"><span class="who">${who}</span><div class="rs-bar" aria-hidden="true">${bar}</div><span class="val">${val}</span></div>`;
  const note = r.rangeNote ? `<p class="rs-note">${L(r.rangeNote)}</p>` : '';
  if (!r.range) return scale + trk(L(r.reach), '<i class="inf"></i>', t('rs.nolimit')) + note;
  const [a, b, c, d] = r.range;
  const bar = (cls, lo, hi) => `<i class="${cls}" style="left:${pos(lo)}%;width:${pos(hi) - pos(lo)}%"></i>`;
  return scale
    + trk(t('rs.body'), bar('body', a, b), `~${a}–${b} m`)
    + trk(t('rs.hand'), bar('hand', c, d), `~${c}–${d} m`) + note;
}

const phonesCell = (r) => `<ul class="rs-chips">${PHONES.map(([k, name]) => {
  const s = r.phones[k], note = r.phoneNotes?.[k];
  return `<li class="rs-chip ${s}">${dot(s)}<span>${L(name)}${note ? `<small>${L(note)}</small>` : ''}</span></li>`;
}).join('')}</ul>`;

const carriesCell = (r) => `<ul class="rs-feats">${FEATS.map((f, i) => {
  const s = r.feats[i], note = r.featNotes?.[i];
  return `<li class="${s}">${dot(s)}<span>${L(f)}${note ? `<small>${L(note)}</small>` : ''}</span></li>`;
}).join('')}</ul>
  <p class="rs-specs"><span><b>${t('rs.speed')}</b> ${L(r.speed)}</span><span><b>${t('rs.battery')}</b> ${L(r.battery)}</span></p>
  ${r.note ? `<p class="rs-note">${L(r.note)}</p>` : ''}`;

function render() {
  $('#phone-legend').innerHTML = PHONES.map(([, name, ex]) => `<div><dt>${L(name)}</dt><dd>${L(ex)}</dd></div>`).join('');
  const head = `<div class="rs-row rs-head" aria-hidden="true"><span>${t('rs.method')}</span><div><span>${t('rs.range')}</span>${scale}</div><span>${t('rs.phones')}</span><span>${t('rs.carries')}</span></div>`;
  let group = null;
  $('#links').innerHTML = head + ROWS.map((r) => {
    const sep = r.group !== group ? `<p class="rs-group ${r.group}">${t(`rs.${(group = r.group)}`)}</p>` : '';
    return `${sep}
    <article class="rs-row">
      <div class="rs-method"><h3>${L(r.name)}</h3><p>${L(r.sub)}</p>${r.tag ? `<span class="rs-tag">${L(r.tag)}</span>` : ''}</div>
      <div class="rs-range" data-label="${t('rs.range')}">${rangeCell(r)}</div>
      <div data-label="${t('rs.phones')}">${phonesCell(r)}</div>
      <div data-label="${t('rs.carries')}">${carriesCell(r)}</div>
    </article>`;
  }).join('');
}

applyStatic({
  onApplied: () => document.querySelectorAll('a[href="../privacy/#francais"]').forEach((a) => a.setAttribute('href', '../privacy/')),
});
render();
