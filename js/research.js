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
    group: 'app', name: ["Balise d'alerte", 'Alert beacon'], sub: ['signal Bluetooth émis à pleine puissance, à sens unique', 'Bluetooth signal sent at full power, one-way'],
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

// Formal verification (formal/RESULTS.md and THREAT_MODEL.md in the Siflo repository, results of 2026-10-28).
// Fields: name, tool, covers, proved, found, bound (a caveat that stays attached to the result).
const MODELS = [
  {
    name: ['Lien de contact', 'Contact link'], tool: 'ProVerif, Tamarin',
    covers: ["La demande de contact, l'acceptation, puis le REVEAL qui envoie la carte d'identité.", 'The contact request, the accept, then the REVEAL that sends the identity card.'],
    proved: ["Secret de la demande (tant que le secret du lien ne fuit pas) et de l'acceptation, authentification des deux côtés, REVEAL lié à sa conversation. Deux demandes ne se relient pas entre elles : vrai par construction.", "Secrecy of the request (until the link secret leaks) and of the accept, authentication on both sides, REVEAL bound to its conversation. Two requests cannot be linked to each other: true by construction."],
    found: ["Avant #129, un détenteur du secret du lien pouvait relire une demande et la resceller. Corrigé : la demande signe la clé du ratchet.", 'Before #129, a holder of the link secret could read a request and seal it again. Fixed: the request now signs the ratchet key.'],
    bound: ["L'échange complet en un seul modèle ne termine pas : il est coupé en trois parties. Deux propriétés ne sont prouvées que dans ProVerif, leur version Tamarin n'a pas abouti.", 'The whole exchange in one model does not terminate: it is cut in three parts. Two properties are proved in ProVerif only; their Tamarin version did not finish.'],
  },
  {
    name: ['Sessions privées', 'Private sessions'], tool: 'ProVerif, Tamarin',
    covers: ["Le début d'une conversation privée : premier message, réponse, jusqu'à 5 sessions par personne.", 'The start of a private conversation: first message, answer, up to 5 sessions per person.'],
    proved: ["Un premier message n'est lisible que si la clé statique ou de signature du destinataire fuit. Aucun contenu ne peut être falsifié. À partir de la première réponse, le secret résiste à une fuite ultérieure de toutes les clés à long terme.", "A first message is readable only if the recipient's static or signing key leaks. No content can be forged. From the first answer on, secrecy survives a later leak of every long-term key."],
    found: ["#144 : une seule clé statique volée suffit à un attaquant actif pour s'interposer entre deux téléphones, lire et relayer leurs sessions (sans rien falsifier). Corrigé en 0.20 par un en-tête signé, pour deux téléphones à jour. #146 : une annonce rejouée lève la règle des 48 h, encore ouvert.", '#144: one stolen static key lets an active attacker sit in the middle of two phones, reading and relaying their sessions (without forging anything). Fixed in 0.20 by a signed header, for two up-to-date phones. #146: a replayed announcement lifts the 48 h rule, still open.'],
    bound: ["Pas de confidentialité persistante pour le premier message, avant la réponse : limite documentée. La compromission de l'état d'une session n'est pas modélisée.", 'No forward secrecy for the first message, before the answer: a documented limit. Compromise of a session state is not modelled.'],
  },
  {
    name: ['Enveloppe des messages', 'Message envelope'], tool: 'ProVerif',
    covers: ["L'étiquette et l'enveloppe d'un paquet de message privé.", 'The tag and the envelope of a private message packet.'],
    proved: ["Un observateur passif ne relie un paquet ni à sa conversation ni à sa session. Seuls les deux téléphones de la paire fabriquent une étiquette valide.", 'A passive observer cannot tie a packet to its conversation or its session. Only the two phones of a pair can make a valid tag.'],
    found: ["#145 : la copie radio et la copie relais d'un même message portent le même horodatage, qui permet de les relier. Encore ouvert.", '#145: the radio copy and the relay copy of one message carry the same timestamp, which lets an observer tie them. Still open.'],
    bound: ["Observateur passif seulement. Le minutage des paquets est hors modèle.", 'Passive observer only. Packet timing is out of the model.'],
  },
  {
    name: ['Boîtes scellées', 'Sealed boxes'], tool: 'ProVerif, Tamarin',
    covers: ["Les corps de REKEY et de SOS_ANSWER, scellés pour la clé statique d'un téléphone.", "The bodies of REKEY and SOS_ANSWER, sealed to a phone's static key."],
    proved: ["Secrets pour tous sauf le détenteur de la clé visée. La signature intérieure authentifie l'expéditeur, le destinataire, le groupe et l'époque. Une boîte n'est prise que par son destinataire.", 'Secret to everyone but the holder of the addressed key. The inner signature authenticates the sender, the recipient, the group and the epoch. A box is taken only by its recipient.'],
    found: ["#161 : une boîte n'était pas liée au message qui la porte, un membre pouvait la glisser dans un message de lui. Corrigé en 0.20 pour un expéditeur à jour.", '#161: a box was not bound to the message that carries it; a member could slip it into a message of their own. Fixed in 0.20 for an up-to-date sender.'],
    bound: ["Pas de confidentialité persistante, documenté : une clé statique prise plus tard ouvre une boîte captée avant.", 'No forward secrecy, documented: a static key taken later opens a box captured earlier.'],
  },
  {
    name: ['Clés de groupe', 'Group keys'], tool: 'Tamarin, ProVerif',
    covers: ["La distribution des clés dans les groupes avec administrateurs : retrait, arrivée tardive, commit de clé.", 'Key distribution in groups with admins: removal, late joining, the key commit.'],
    proved: ["Un membre retiré n'obtient aucune clé d'une époque ultérieure. Un nouvel arrivant n'obtient aucune clé antérieure au jour de son invitation. Personne ne peut faire prendre une autre clé que celle désignée par le commit de l'administrateur.", "A removed member never gets a key of a later epoch. A newcomer gets no key older than the day of their invitation. Nobody can make a member take a key other than the one the admin's commit names."],
    found: ["Aucune attaque sur le code dans ce modèle.", 'No attack on the code in this model.'],
    bound: ["Limites reproduites : un lien donne les clés de tous les jours suivants, le nouvel arrivant lit le jour de son arrivée et les deux précédents, un membre pas encore à jour écrit sous l'ancienne clé, que le membre retiré lit. Groupes sans administrateurs hors modèle.", 'Limits reproduced: a link gives the keys of every later day, a newcomer reads the day they join and the two before, a member not yet up to date writes under the old key, which the removed member reads. Groups without admins are out of the model.'],
  },
  {
    name: ['Chaîne des administrateurs', 'Admin chain'], tool: 'TLA+ (TLC)',
    covers: ["Les commits des administrateurs : qui peut signer, forks, passation, points de contrôle.", 'The admins\' commits: who may sign, forks, handover, checkpoints.'],
    proved: ["Un commit n'est valide que signé par un administrateur de son état parent. Le groupe garde un administrateur, le créateur n'est pas retiré tant qu'il est premier en rang. Les téléphones partis de la même base convergent, une fois les règles corrigées.", "A commit is valid only if an admin of its parent's state signed it. The group keeps one admin; the creator is not removed while first in rank. Phones that start from the same base converge, once the rules were fixed."],
    found: ["Sept failles (#154 à #159, #164) : un ancien administrateur qui gagne un fork ou une égalité, qui annule son propre retrait, dont le point de contrôle prend au piège un téléphone en retard. Corrigées en 0.20 ; les téléphones 0.15 à 0.19 y restent exposés.", 'Seven findings (#154 to #159, #164): a former admin who wins a fork or a tie, who voids their own removal, whose checkpoint catches a phone that is behind. Fixed in 0.20; phones on 0.15 to 0.19 stay exposed.'],
    bound: ["Borné : 3 téléphones et 3 commits, exhaustif ; 4 commits ou 4 téléphones jusqu'à la profondeur 11. Quelques configurations ont atteint leur limite de temps (900 s) sans violation : ce n'est pas une preuve.", 'Bounded: 3 phones and 3 commits, exhaustive; 4 commits or 4 phones to depth 11. A few configurations reached their time limit (900 s) without a violation: that is not a proof.'],
  },
  {
    name: ['Membres et époques de clé', 'Membership and key epochs'], tool: 'TLA+ (TLC)',
    covers: ["Qui est membre, quelle clé à quelle époque : retrait, arrivée tardive, départ d'un administrateur, groupes sans administrateurs.", 'Who is a member and which key at which epoch: removal, late joining, an admin leaving, groups without admins.'],
    proved: ["Avec administrateurs, un membre retiré ne lit rien après l'époque perdue (scénarios exhaustifs). Sans administrateurs, un changement de clé n'est accepté que selon la règle de l'époque suivante.", 'With admins, a removed member reads nothing after the epoch they lost (exhaustive scenarios). Without admins, a key change is accepted only under the next-epoch rule.'],
    found: ["Six failles (#148 à #153), par exemple : un nouvel arrivant dont le code précède un retrait ne reçoit jamais la nouvelle clé (#152) ; un membre réadmis se retire lui-même au changement de clé suivant (#153). Certaines sont corrigées, d'autres encore ouvertes.", 'Six findings (#148 to #153), for example: a newcomer whose code predates a removal never gets the new key (#152); a readmitted member removes themselves at the next key change (#153). Some are fixed, others still open.'],
    bound: ["Les scénarios sont exhaustifs, les grandes configurations ne le sont pas. Le partage documenté des groupes sans administrateurs (deux retraits simultanés) est reproduit, pas corrigé.", 'The scenarios are exhaustive, the large configurations are not. The documented split of groups without admins (two removals at once) is reproduced, not fixed.'],
  },
];

const FINDINGS = [
  ['#144, #161', ["Sessions privées et boîtes scellées : un attaquant actif avec une seule clé statique s'interpose, une boîte est transférable. Corrigés en 0.20 (versions 2) ; une paire dont un téléphone est antérieur à la 0.20 reste en version 1, donc ouverte.", 'Private sessions and sealed boxes: an active attacker with one static key sits in the middle, a box can be moved. Fixed in 0.20 (v2 forms); a pair with a phone older than 0.20 stays in v1, so open.']],
  ['#145, #146', ["Enveloppe et annonces : horodatage identique entre copie radio et copie relais, annonce rejouée qui lève la règle des 48 h. Ouverts.", 'Envelope and announcements: one timestamp on the radio and relay copies, a replayed announcement that lifts the 48 h rule. Open.']],
  ['#154 – #159, #164', ["Chaîne des administrateurs : sept failles où un ancien administrateur, ou la copie d'un ancien téléphone, fait diverger les téléphones ou capture un téléphone en retard. Corrigées en 0.20.", 'Admin chain: seven findings where a former admin, or a copy of an old phone, splits phones or captures one that is behind. Fixed in 0.20.']],
  ['#148 – #153', ["Membres et clés : un retrait raté, une clé jamais reçue, un administrateur sortant qui le reste. Mélange de corrigés (#148, #149) et d'ouverts (#150 à #153).", 'Membership and keys: a removal that does not stick, a key never received, a leaving admin who stays admin. A mix of fixed (#148, #149) and open (#150 to #153).']],
];

registerStrings({
  ui: {
    fr: {
      'rs.method': 'Liaison', 'rs.range': 'Portée', 'rs.phones': 'Téléphones', 'rs.carries': 'Ce qui passe',
      'rs.body': 'sur soi', 'rs.hand': 'en main', 'rs.nolimit': 'sans limite', 'rs.speed': 'Débit', 'rs.battery': 'Consommation',
      'rs.y': 'oui', 'rs.p': 'limité', 'rs.n': 'non',
      'rs.app': "Dans l'application", 'rs.next': "Pas encore dans l'application",
      'fv.model': 'Modèle', 'fv.proved': 'Prouvé', 'fv.found': 'Trouvé', 'fv.bound': 'Bornes et limites',
    },
    en: {
      'rs.method': 'Link', 'rs.range': 'Range', 'rs.phones': 'Phones', 'rs.carries': 'What gets through',
      'rs.body': 'on body', 'rs.hand': 'in hand', 'rs.nolimit': 'no limit', 'rs.speed': 'Throughput', 'rs.battery': 'Battery use',
      'rs.y': 'yes', 'rs.p': 'limited', 'rs.n': 'no',
      'rs.app': 'In the app', 'rs.next': 'Not in the app yet',
      'fv.model': 'Model', 'fv.proved': 'Proved', 'fv.found': 'Found', 'fv.bound': 'Bounds and limits',
    },
  },
  static: {
    'meta.title': 'Radio range · How Siflo phones reach each other',
    'meta.description': 'Standard and long-range Bluetooth, nearby Wi-Fi, internet relay, alert beacon and satellite: the estimated range of each Siflo link, the phones that can use it and what gets through.',
    'nav.aria': 'Main navigation', 'nav.back': 'About Siflo',
    'rs.k': 'Research · radio range',
    'rs.h': 'Six ways<br><em>to reach each other.</em>',
    'rs.lead': 'How a Siflo phone reaches another one: over Bluetooth, Wi-Fi, the internet and, later, satellite. For each link, the estimated range, the phones that can use it and what gets through.',
    'rs.p1': 'The ranges are estimated by calculation, not yet measured in the field. The scale is logarithmic: from one mark to the next, the distance is multiplied by ten. The first five links are in the app, including the alert beacon (Android only); satellite is in preparation.',
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
    'rs.n5p': 'The distant phone receives the alert but cannot answer along this path: there is no acknowledgement, and the alert is repeated every two seconds. The alert beacon has been in the Android app since version 0.5; its range is yet to be measured in the field.',
    'rs.n6h': 'Satellite, in preparation',
    'rs.n6p': 'Some recent Android phones send short messages by satellite, depending on the carrier; on iPhone, Apple keeps satellite for its own features. We are working on sending Siflo\'s SOS and signals by satellite; nothing is available yet.',
    'rs.sp1': 'Measured a range in the field?', 'rs.sp2': 'Write to us: your measurements help us correct these estimates.',

    'rs.jump': 'Formal verification of the protocol',
    'fv.k': 'Research · formal verification',
    'fv.h': 'The protocol,<br><em>checked by machine.</em>',
    'fv.lead': "Seven models of Siflo's protocol, checked with Tamarin, ProVerif and TLA+. What is proved, under which bounds, what the verification found and got fixed, and what stays a limit.",
    'fv.p1': "Each model faces an attacker who controls the whole network: the packets of the mesh and of the relay, which it reads, drops, replays and modifies, plus the leak of a long-term key at a given moment, or a former admin or removed member. Cryptography is assumed perfect: what is checked is the design of the protocol, not the primitives, the radio or traffic analysis.",
    'fv.p2': "This is not an independent audit: it is our own verification, published so that it can be rerun. The results are those of 28&nbsp;October 2026. Of 47 properties, 22 are proved, 5 are true by construction (said so, never presented as proofs), 5 are documented limits and 2 are not modelled; the others were successfully attacked, and those attacks are the findings below.",
    'fv.f.h': 'What the verification found',
    'fv.f.p': 'Seventeen findings were filed as issues against the code, each one shown by a model as an attack trace or a counterexample.',
    'fv.c1h': 'A bounded result stays bounded',
    'fv.c1p': 'The TLA+ models are explored for 3 phones and 3 commits (exhaustive for the admin chain), sometimes 4 commits or 4 phones to depth&nbsp;11. When the exploration stops at its time limit without finding a violation, that is not a proof. A few runs did not finish within their limit (two properties of the contact link in Tamarin, one equivalence in ProVerif): they are reported as such.',
    'fv.c2h': 'A documented limit is a limit',
    'fv.c2p': "No forward secrecy for the first message of a private conversation, before the answer; one group key per day, not per message; a member reads their group by construction; an admin in the role stays out of the model. The relay reads nothing, but its metadata (who reads which mailbox, IP addresses) is not covered.",
    'fv.c3h': 'What is not modelled',
    'fv.c3p': "The Double Ratchet after the first exchange, taken from its published proofs (Cohn-Gordon et al. 2016, Alwen-Coretti-Dodis 2019). Attacks on primitives, the radio layer, traffic analysis, packet parser bugs. Groups without admins, for group keys.",
    'fv.r.h': 'Rerun it yourself',
    'fv.r.p': "The models, the expected results and the checking script are in the <code>formal/</code> folder of Siflo's repository. <code>formal/README.md</code> explains the install (Tamarin 1.12.0, ProVerif 2.05, TLC 1.8.0 with Java 17); <code>formal/RESULTS.md</code> gives every run, its variant and its time; <code>formal/THREAT_MODEL.md</code> the attacker and the properties. The script replays every run and exits with an error if a result differs from the expected one.",
    'fv.r.code': 'python3 formal/check.py              # all runs\npython3 formal/check.py --fast 30    # under 30 s\npython3 formal/check.py sealed_box   # by keyword',
    'foot.verif': 'Formal verification',
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

function renderVerification() {
  $('#models').innerHTML = `<div class="fv-row fv-head" aria-hidden="true"><span>${t('fv.model')}</span><span>${t('fv.proved')}</span><span>${t('fv.found')}</span><span>${t('fv.bound')}</span></div>`
    + MODELS.map((m, i) => `<article class="fv-row">
      <div class="fv-model"><span class="fv-n">${i + 1}</span><h3>${L(m.name)}</h3><span class="fv-tool">${m.tool}</span><p>${L(m.covers)}</p></div>
      <div data-label="${t('fv.proved')}"><p>${L(m.proved)}</p></div>
      <div data-label="${t('fv.found')}"><p>${L(m.found)}</p></div>
      <div data-label="${t('fv.bound')}"><p>${L(m.bound)}</p></div>
    </article>`).join('');
  $('#findings').innerHTML = FINDINGS.map(([ids, txt]) => `<li><b>${ids}</b><span>${L(txt)}</span></li>`).join('');
}

applyStatic({
  onApplied: () => document.querySelectorAll('a[href="../privacy/#francais"]').forEach((a) => a.setAttribute('href', '../privacy/')),
});
render();
renderVerification();
