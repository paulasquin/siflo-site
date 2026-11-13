// Labs page: the ways a Siflo phone reaches another one, drawn from one table of data in both
// languages ([fr, en] pairs), and the encryption animation (cipher.js). French static copy lives in labs/index.html, its English in labs-strings.js.
import { registerStrings, applyStatic, LANG, t, nf } from './kit/i18n.js';
import { mountCipher } from './cipher.js';
import { LABS_STRINGS } from './labs-strings.js';

const L = (v) => (Array.isArray(v) ? v[LANG === 'fr' ? 0 : 1] : v);

const PHONES = [
  ['ios', ['iPhone', 'iPhone'], ['iOS 17 ou plus récent, sur l’App Store', 'iOS 17 or later, on the App Store']],
  ['old', ['Android milieu de gamme ou ancien', 'Mid-range or older Android'], ['Galaxy A, Redmi, téléphones de 2017 à 2020', 'Galaxy A, Redmi, phones from 2017 to 2020']],
  ['a16', ['Android récent, 15 ou 16', 'Recent Android, 15 or 16'], ['Pixel 8 et 9, Galaxy S24 et S25', 'Pixel 8 and 9, Galaxy S24 and S25']],
  ['a17', ['Android 17', 'Android 17'], ['Pixel 10 Pro XL, Galaxy S26 Ultra', 'Pixel 10 Pro XL, Galaxy S26 Ultra']],
];
const FEATS = [['Signaux', 'Signals'], ['SOS', 'SOS'], ['Messages', 'Messages'], ['Photos, vocaux', 'Photos, voice notes']];

// range: [on body min, max, in hand min, max] in metres (link-budget estimates), or null for no distance limit.
// phones: y / p (limited) / n per PHONES key; feats: y / p / n per FEATS entry.
const ROWS = [
  {
    group: 'app', name: ['Bluetooth standard', 'Standard Bluetooth'], sub: ['débit normal, connexion dans les deux sens', 'normal rate, two-way connection'],
    range: [5, 25, 50, 150],
    phones: { ios: 'y', old: 'y', a16: 'y', a17: 'y' },
    feats: ['y', 'y', 'y', 'y'], speed: ['30 à 100 ko/s', '30–100 kB/s'], battery: ['faible, toujours actif', 'low, always on'],
  },
  {
    group: 'app', name: ['Bluetooth longue portée', 'Long-range Bluetooth'], sub: ['mode longue portée du Bluetooth (Coded PHY), quand un message ne passe plus', "Bluetooth’s long-range mode (Coded PHY), when a message does not get through"],
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
    speed: ["élevé, 0,2 à 2 s d’attente", 'high, 0.2–2 s delay'], battery: ['faible, réveil par notification', 'low, push wake-ups'],
    note: ['Un SOS envoyé à tous les téléphones proches, même inconnus, ne passe que par radio.', 'An SOS sent to every phone nearby, even unknown ones, goes by radio only.'],
  },
  {
    group: 'app', name: ["Balise d’alerte", 'Alert beacon'], sub: ['signal Bluetooth émis à pleine puissance, à sens unique', 'Bluetooth signal sent at full power, one-way'],
    range: [25, 80, 250, 500], rangeNote: ['émis sous Android 17 ; moins loin sous Android 16 ou antérieur', 'sent from Android 17; shorter on Android 16 or older'],
    phones: { ios: 'n', old: 'p', a16: 'p', a17: 'y' },
    phoneNotes: { old: ['si la puce le permet, à puissance réduite (1 dBm)', 'if the chip allows, at reduced power (1 dBm)'], a16: ['émet à puissance réduite (1 dBm)', 'sends at reduced power (1 dBm)'], a17: ['émet environ 8 fois plus fort (10 dBm)', 'sends at about 8 times the power (10 dBm)'] },
    feats: ['y', 'y', 'p', 'n'], featNotes: { 2: ['courts', 'short'] },
    speed: ['1 alerte toutes les 2 s, sans réponse', '1 alert every 2 s, no reply'], battery: ["2 à 11 % du temps radio, pendant l’alerte seulement", '2–11% of radio time, during an alert only'],
  },
  {
    group: 'lora', name: ['Radio LoRa', 'LoRa radio'], sub: ['un boîtier Meshtastic relié au téléphone en Bluetooth : longue portée, bas débit', 'a Meshtastic device paired with the phone over Bluetooth: long range, low rate'],
    range: [500, 2000, 2000, 5000], rangeNote: ['sur soi, radio à la ceinture ou sur le sac ; en main, radio tenue à vue ; posée sur un point haut dégagé, plus de 10 km', 'on body, radio on the belt or pack; in hand, held up in line of sight; on a clear high point, over 10 km'],
    phones: { ios: 'y', old: 'y', a16: 'y', a17: 'y' },
    feats: ['y', 'y', 'y', 'n'],
    speed: ['quelques centaines de trames de 233 octets par heure', 'a few hundred 233-byte frames an hour'], battery: ['faible pour le téléphone : la radio a sa propre batterie', 'low for the phone: the radio has its own battery'],
    note: ["En Europe, une radio ne peut émettre que 10 % du temps : Siflo la réserve aux messages que le Bluetooth et internet ne portent plus.", 'In Europe a radio may only transmit 10% of the time: Siflo reserves it for messages that Bluetooth and the internet no longer carry.'],
  },
  {
    group: 'next', name: ['Satellite', 'Satellite'], sub: ['réseaux satellite des opérateurs, communicateurs Garmin inReach (à l’étude)', "carriers' satellite networks, Garmin inReach satellite communicators (under study)"],
    tag: ['En préparation', 'In preparation'],
    range: null, reach: ['ciel ouvert', 'open sky'], rangeNote: ['partout à ciel ouvert, jamais en grotte', 'anywhere under open sky, never in caves'],
    phones: { ios: 'n', old: 'n', a16: 'p', a17: 'p' },
    phoneNotes: { ios: ["réservé aux fonctions d’Apple", "reserved for Apple’s own features"], a16: ["Pixel 9 et plus, selon l’opérateur", 'Pixel 9 and later, depending on the carrier'], a17: ["selon l’opérateur", 'depending on the carrier'] },
    feats: ['y', 'y', 'p', 'n'], featNotes: { 2: ['courts', 'short'] },
    speed: ['quelques ko/s, plusieurs dizaines de secondes par message', 'a few kB/s, tens of seconds per message'], battery: ["élevée pendant l’envoi", 'high while sending'],
  },
];

// Formal verification: what each model proves, in a line. Tool and files are in formal/ of the Siflo repository.
const MODELS = [
  [['Liens de contact', 'Contact links'], 'ProVerif, Tamarin', ["la demande et l’acceptation restent secrètes&#8239;; personne ne peut s’interposer entre les deux personnes", 'the request and the acceptance stay secret; nobody can step in between the two people']],
  [['Début des conversations privées', 'Start of private conversations'], 'ProVerif, Tamarin', ["premier message secret, contenu infalsifiable, réponses à l’abri même d’une clé volée plus tard", 'first message secret, content that cannot be forged, answers safe even from a key stolen later']],
  [['Enveloppe des messages privés', 'Private message envelope'], 'ProVerif', ["pour qui observe le réseau, rien dans l’enveloppe ne trahit la conversation&#8239;: seule l’adresse du destinataire est visible", "to someone watching the network, nothing in the envelope gives the conversation away: only the recipient’s address shows"]],
  [['Nouvelles clés et réponses SOS', 'New keys and SOS answers'], 'ProVerif, Tamarin', ["chacune ne peut être ouverte que par la personne à qui elle est adressée", 'each can only be opened by the person it is addressed to']],
  [['Clés de groupe', 'Group keys'], 'Tamarin, ProVerif', ["un membre retiré n’obtient aucune clé suivante, un nouvel arrivant aucune clé de plus de deux jours avant son invitation", 'a removed member gets no later key, a newcomer no key from more than two days before their invitation']],
  [['Administrateurs', 'Admins'], 'TLA+', ["une fois tous les messages reçus, tous les téléphones s’accordent sur les administrateurs et les retraits, même face à un ancien administrateur", 'once every message is in, all phones agree on admins and removals, even against a former admin']],
  [['Membres et clés', 'Members and keys'], 'TLA+', ["dès qu’un membre a reçu la nouvelle clé, la personne retirée ne lit plus ce qu’il écrit", 'once a member has the new key, the removed person can no longer read what that member writes']],
];

registerStrings(LABS_STRINGS);

const $ = (s) => document.querySelector(s);
const pos = (m) => Math.log10(m) / 4 * 100; // 1 m → 10 km
const TICKS = [[1, '1 m'], [10, '10 m'], [100, '100 m'], [1000, '1 km'], [10000, '10 km']];
const dist = (a, b) => (b >= 1000 ? `~${nf(a / 1000, a % 1000 ? 1 : 0)}–${nf(b / 1000)} km` : `~${a}–${b} m`);
const STATE = { y: 'rs.y', p: 'rs.p', n: 'rs.n' };
const dot = (s) => `<i class="dot ${s}"></i><span class="sr">${t(STATE[s])} : </span>`;

const scale = `<div class="rs-trk rs-scale" aria-hidden="true"><span></span><div>${TICKS.map(([m, txt], i) => `<span${i % 2 ? ' class="minor"' : ''} style="left:${pos(m)}%">${txt}</span>`).join('')}</div><span></span></div>`;

function rangeCell(r) {
  const trk = (who, bar, val) => `<div class="rs-trk"><span class="who">${who}</span><div class="rs-bar" aria-hidden="true">${bar}</div><span class="val">${val}</span></div>`;
  const note = r.rangeNote ? `<p class="rs-note">${L(r.rangeNote)}</p>` : '';
  if (!r.range) return scale + trk(L(r.reach), '<i class="inf"></i>', t('rs.nolimit')) + note;
  const [a, b, c, d] = r.range;
  const bar = (cls, lo, hi) => `<i class="${cls}" style="left:${pos(lo)}%;width:${pos(hi) - pos(lo)}%"></i>`;
  return scale
    + trk(t('rs.body'), bar('body', a, b), dist(a, b))
    + trk(t('rs.hand'), bar('hand', c, d), dist(c, d)) + note;
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

/** Self-hosted film (no third-party request): the source is attached on the first click. */
function setupFilm() {
  const box = document.getElementById('fv-film'), video = box.querySelector('video');
  if (LANG !== 'fr') video.poster = video.dataset.posterEn;
  box.querySelector('.film-play').addEventListener('click', () => {
    if (!video.src) video.src = video.dataset[LANG === 'fr' ? 'srcFr' : 'srcEn'];
    video.controls = true;
    video.play();
    box.classList.add('playing');
  });
}

function renderVerification() {
  $('#models').innerHTML = MODELS.map(([name, tool, what]) => `<li><b>${L(name)}</b><span class="fv-tool">${tool}</span><p>${L(what)}</p></li>`).join('');
}

applyStatic({
  onApplied: () => document.querySelectorAll('a[href="../privacy/#francais"]').forEach((a) => a.setAttribute('href', '../privacy/')),
});
render();
renderVerification();
setupFilm();
mountCipher(document.getElementById('cipher'), { cut: 'full' });
