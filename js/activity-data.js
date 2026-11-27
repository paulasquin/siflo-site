// What changes with the activity (js/activity.js): colours of the 3D acts, texts, the order of the
// field cases, and each identity's own page. Pure data, so that tools/activities.py reads it too.
// The page itself (index.html, js/strings.js) speaks for the general identity, « Partout »; every
// other identity writes its own texts over it, canyon included.
/** Colours of the 3D acts: the phones' glow, the signal close-up and the contour map (a ridge for the mountain, a cave survey and a festival site plan for caving and gatherings). */
export const THEMES = {
  // No hero act for the general identity (a still dusk sky in css/style.css), only these colours for the later acts.
  general: {
    signal: '#ff9a5a', bg: '#11151d',
    close: { bg: '#12151c', key: '#ffe6d2', rim: '#ff9a5a', ambient: '#2c2a2a', bokeh: ['#ff9a5a', '#ffb27a', '#ffe2cc', '#8f7b60', '#b89b74'], body: '#24221f' },
    map: { bg: '#0b0d11', lo: [0.004, 0.0038, 0.004], hi: [0.03, 0.025, 0.019], line: [1.0, 0.58, 0.32], river: '#7fb0cc', amber: '#ffc46a', grey: '#b9ad9c' },
  },
  canyon: {
    signal: '#ff6a00', bg: '#0e0b09',
    close: { bg: '#110c09', key: '#ffd9bd', rim: '#ff7a2e', ambient: '#3a2a22', bokeh: ['#ff6a00', '#ff9a5a', '#ffd2a8', '#4d7f9a', '#7fc4e6'], body: '#2a221d' },
    map: { bg: '#0b0907', lo: [0.004, 0.003, 0.0025], hi: [0.03, 0.019, 0.012], line: [1.0, 0.45, 0.18], river: '#5fa8cc', amber: '#ffc46a', grey: '#b9a99c' },
  },
  mountain: {
    signal: '#3fc3ff', bg: '#060a10',
    close: { bg: '#070c13', key: '#dff1ff', rim: '#3aa8ff', ambient: '#1c2a3a', bokeh: ['#3fc3ff', '#9fe0ff', '#e6f6ff', '#5d7dc4', '#b9c8ff'], body: '#1d2630' },
    map: { ridge: true, bg: '#05080d', lo: [0.006, 0.009, 0.014], hi: [0.05, 0.07, 0.095], line: [0.45, 0.8, 1.0], river: '#e8f4ff', amber: '#c9b6ff', grey: '#9fb3c6' },
  },
  cave: {
    signal: '#f5b324', bg: '#090908',
    close: { bg: '#0a0907', key: '#fff1d2', rim: '#f5a524', ambient: '#2a2620', bokeh: ['#f5b324', '#ffd27a', '#fff3d6', '#3f6f68', '#7fb8a8'], body: '#25221d' },
    map: { plan: 'cave', bg: '#080706', lo: [0.004, 0.0035, 0.003], hi: [0.028, 0.024, 0.017], line: [1.0, 0.72, 0.2], river: '#4fb3a6', amber: '#9fe0c8', grey: '#b3aa98' },
  },
  gathering: {
    signal: '#d946ef', bg: '#0b0812',
    close: { bg: '#0c0812', key: '#f3e6ff', rim: '#c03cff', ambient: '#2a1f3a', bokeh: ['#d946ef', '#f0abfc', '#fdf4ff', '#6d5bd0', '#38bdf8'], body: '#231d2c' },
    map: { plan: 'festival', bg: '#08060c', lo: [0.004, 0.003, 0.006], hi: [0.03, 0.02, 0.04], line: [0.85, 0.35, 1.0], river: '#7c6cf0', amber: '#ffd36a', grey: '#b3a8c4' },
  },
};
const NNBSP = ' ';
const q = (s) => `«${NNBSP}${s}${NNBSP}»`;

/**
 * Texts that change with the activity, keyed like data-i18n (static) and t() (ui). `cases` is the
 * order of the field cases (#terrain), the activity's own first.
 */
export const COPY = {
  canyon: {
    cases: [1, 2, 3, 4],
    // The whistle drowned by the waterfall, the rope signals (js/acts/canyon.js).
    fr: {
      'hero.t2': 'dehors,',
      'c1.h': 'Le sifflet, c’est bien. Quand on l’entend.',
      'c1.p': 'Quatre codes, qui changent d’un club à l’autre, et une cascade suffit à les couvrir. Corde coincée en haut du rappel&#8239;: ceux d’en bas n’en savent rien.',
      'c2.p': 'Julie écrit «&#8239;Corde coincée, attendez-moi&#8239;». Le téléphone de Marc, au pied de la cascade, le passe à Léa et Tom, partis devant.',
      's1.h': 'Les codes du sifflet, en une touche.',
      's1.p': 'Quatre grosses touches, faciles avec des doigts mouillés. Les points rappellent les coups de sifflet. Et vos propres codes.',
      'sig.stop': 'STOP', 'sig.release': 'Débraye la corde', 'sig.pull': 'Remonte la corde',
      's2.p': 'Julie, au relais, envoie STOP à Marc, dans la cascade. Son téléphone vibre, siffle et s’affiche en plein écran, même verrouillé. Les autres continuent de manger leurs barres.',
      'ch.av': 'CF', 'ch.group': 'Canyon du Furon', 'ch.place': 'Parking du canyon', 'ch.m2': 'J’apporte la deuxième corde. Et les croissants.',
    },
    en: {
      'hero.t2': 'outdoors,',
      'c1.h': 'A whistle is great. When you can hear it.',
      'c1.p': 'Four codes that change from club to club, and one waterfall drowns them out. Rope stuck at the top of a rappel: those below have no idea.',
      'c2.p': 'Julie types “Rope stuck, wait for me”. Marc’s phone, at the foot of the waterfall, passes it on to Léa and Tom, who went ahead.',
      's1.h': 'Whistle codes, one tap away.',
      's1.p': 'Four big buttons, easy with wet fingers. The dots match the whistle blasts. And your own codes.',
      'sig.stop': 'STOP', 'sig.release': 'Release the rope', 'sig.pull': 'Pull up the rope',
      's2.p': 'Julie, at the anchor, sends STOP to Marc, in the waterfall. His phone vibrates, whistles and shows full screen, even when locked. The others carry on with their snack bars.',
      'ch.av': 'CF', 'ch.group': 'Furon Canyon', 'ch.place': 'Canyon car park', 'ch.m2': 'I’ll bring the second rope. And the croissants.',
    },
    ui: {
      fr: { 'phone.group': 'Canyon du Furon', 'phone.stop': 'STOP', 'phone.release': 'Débraye\nla corde', 'phone.pull': 'Remonte\nla corde', 'label.press': 'Appui sur STOP' },
      en: { 'phone.group': 'Furon Canyon', 'phone.stop': 'STOP', 'phone.release': 'Release\nthe rope', 'phone.pull': 'Pull up\nthe rope', 'label.press': 'STOP pressed' },
    },
  },
  mountain: {
    cases: [5, 4, 1, 2, 3],
    // No whistle and no shouting here: on skis the group spreads out one at a time, often out of
    // sight, and the voice is lost in the wind, the whiteout and the distance (js/acts/mountain.js).
    fr: {
      'hero.t1': 'Restez en contact', 'hero.t2': 'en montagne,', 'hero.t3': 'même hors ligne.',
      'c1.h': 'En haut de la pente, les autres sont déjà loin.',
      'c1.p': 'On descend un par un, souvent hors de vue. Le vent couvre la voix, le jour blanc efface les silhouettes. Quand la neige craque sous Julie, ceux d’en bas n’en savent rien.',
      'c2.p': 'Julie écrit «&#8239;Ça craque, un par un&#8239;». Le téléphone de Marc, à mi-pente, le passe à Léa et Tom, hors de vue plus bas. Avec une radio LoRa, jusqu’à 7&nbsp;km.',
      's1.h': 'Les consignes du groupe, en une touche.',
      's1.p': 'Quatre grosses touches, faciles avec des gants. La consigne arrive sur le téléphone, avec le nom de l’expéditeur. Et vos propres codes.',
      'sig.stop': 'STOP', 'sig.release': 'Un par un', 'sig.pull': 'Regroupement',
      's2.p': 'Julie, en haut du couloir, envoie STOP à Marc, prêt à s’y engager. Son téléphone vibre, sonne et s’affiche en plein écran, même verrouillé. Les autres continuent de manger leurs barres.',
      'm1.p': 'Sur l’arête, chaque téléphone passe le message au suivant, de 100 à 300&nbsp;m en main et à vue. Jusqu’à 12 sauts, et 7&nbsp;km avec une radio LoRa.',
      'ch.av': 'BL', 'ch.group': 'Belledonne · ski de rando', 'ch.place': 'Parking du départ', 'ch.m2': 'J’apporte le DVA de rechange. Et les croissants.',
    },
    en: {
      'hero.t1': 'Stay in touch', 'hero.t2': 'in the mountains,', 'hero.t3': 'even offline.',
      'c1.h': 'At the top of the slope, the others are already far away.',
      'c1.p': 'You ski down one at a time, often out of sight. The wind swallows voices, the whiteout erases silhouettes. When the snow cracks under Julie, those below have no idea.',
      'c2.p': 'Julie types “It’s cracking, one at a time”. Marc’s phone, halfway down, passes it on to Léa and Tom, out of sight below. With a LoRa radio, up to 7&nbsp;km.',
      's1.h': 'The group’s calls, one tap away.',
      's1.p': 'Four big buttons, easy with gloves on. The call lands on the phone, with the sender’s name. And your own codes.',
      'sig.stop': 'STOP', 'sig.release': 'One at a time', 'sig.pull': 'Regroup',
      's2.p': 'Julie, at the top of the couloir, sends STOP to Marc, about to drop in. His phone vibrates, rings and shows full screen, even when locked. The others carry on with their snack bars.',
      'm1.p': 'On the ridge, each phone passes the message on to the next, 100 to 300&nbsp;m in hand with a clear line of sight. Up to 12 hops, and 7&nbsp;km with a LoRa radio.',
      'ch.av': 'BL', 'ch.group': 'Belledonne ski tour', 'ch.place': 'Trailhead car park', 'ch.m2': 'I’ll bring the spare transceiver. And the croissants.',
    },
    ui: {
      fr: {
        'phone.group': 'Belledonne', 'phone.stop': 'STOP', 'phone.release': 'Un par un', 'phone.pull': 'Regroupement', 'label.press': 'Appui sur STOP',
        'label.whistle': 'Ça craque sous les skis', 'label.waterfall': 'Jour blanc · plus personne en vue', 'label.julie': `Julie${NNBSP}: ${q('Ça craque, un par un')}`,
        'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, plus bas dans la combe', 'label.icefall': 'Cascade de glace', 'label.icecave': 'Grotte de glace',
        'label.behind': 'Resté en arrière sur l’arête',
        'label.lea': 'Léa · vachée au relais', 'label.tom': 'Tom ne la voit plus', 'label.next': 'Cordée voisine',
        'label.wind': 'Vent · les annonces se perdent', 'label.safe': `Léa${NNBSP}: ${q('Vaché')}`, 'label.tomok': 'Tom · reçu, puis vu', 'label.nothing': 'Cordée voisine · rien reçu',
      },
      en: {
        'phone.group': 'Belledonne', 'phone.stop': 'STOP', 'phone.release': 'One at\na time', 'phone.pull': 'Regroup', 'label.press': 'STOP pressed',
        'label.whistle': 'Snow cracking under the skis', 'label.waterfall': 'Whiteout · nobody in sight', 'label.julie': 'Julie: “It’s cracking, one at a time”',
        'label.relay': 'Marc relays the message', 'label.ahead': 'Léa and Tom, further down the bowl', 'label.icefall': 'Frozen waterfall', 'label.icecave': 'Ice cave',
        'label.behind': 'Left behind on the ridge',
        'label.lea': 'Léa · safe at the anchor', 'label.tom': 'Tom can’t see her', 'label.next': 'Next rope team',
        'label.wind': 'Wind · calls get lost', 'label.safe': 'Léa: “Safe”', 'label.tomok': 'Tom · received, then seen', 'label.nothing': 'Next rope team · nothing received',
      },
    },
  },
  cave: {
    cases: [3, 1, 2, 4],
    fr: {
      'm2.h': 'L’équipe de surface&#8239;? Internet fait le lien.',
      'm2.p': 'Sous terre, personne ne capte. Un équipier resté à l’entrée fait le lien&#8239;: ce qui l’atteint part par internet vers ceux du dehors, via nos relais, qui ne peuvent rien lire.',
      'hero.t1': 'Restez en contact', 'hero.t2': 'sous terre,', 'hero.t3': 'même hors ligne.',
      'c1.h': 'Le sifflet, c’est bien. Quand le puits le laisse remonter.',
      'c1.p': 'Quatre codes, qui changent d’un club à l’autre, que l’écho brouille et que la moindre cascade couvre. Quand la corde frotte au fractionnement, ceux d’en bas n’en savent rien.',
      'c2.p': 'Julie écrit «&#8239;La corde frotte, ne montez pas&#8239;». Le téléphone de Marc, au pied du puits, le passe à Léa et Tom, plus loin dans la galerie.',
      's1.h': 'Les codes du sifflet, en une touche.',
      'sig.stop': 'STOP', 'sig.release': 'Débraye la corde', 'sig.pull': 'Remonte la corde',
      's1.p': 'Quatre grosses touches, faciles avec des doigts pleins de boue. Les points rappellent les coups de sifflet. Et vos propres codes.',
      's2.p': 'Julie, en haut du puits, envoie STOP à Marc, sur la corde. Son téléphone vibre, siffle et s’affiche en plein écran, même verrouillé. Les autres continuent de manger leurs barres.',
      'ch.av': 'GB', 'ch.group': 'Gouffre Berger', 'ch.place': 'Entrée du gouffre', 'ch.m2': 'J’apporte le kit de secours. Et les croissants.',
    },
    en: {
      'm2.h': 'The surface team? The internet bridges the gap.',
      'm2.p': 'Underground, nobody has signal. A teammate at the entrance bridges the gap: whatever reaches them goes out over the internet to those outside, through our relays, which can read nothing.',
      'hero.t1': 'Stay in touch', 'hero.t2': 'underground,', 'hero.t3': 'even offline.',
      'c1.h': 'A whistle is great. When the shaft lets it back up.',
      'c1.p': 'Four codes that change from club to club, blurred by echoes and drowned by the smallest waterfall. When the rope rubs at the rebelay, those below have no idea.',
      'c2.p': 'Julie types “Rope is rubbing, don’t come up”. Marc’s phone, at the foot of the shaft, passes it on to Léa and Tom, further down the passage.',
      's1.h': 'Whistle codes, one tap away.',
      'sig.stop': 'STOP', 'sig.release': 'Release the rope', 'sig.pull': 'Pull up the rope',
      's1.p': 'Four big buttons, easy with muddy fingers. The dots match the whistle blasts. And your own codes.',
      's2.p': 'Julie, at the top of the shaft, sends STOP to Marc, on the rope. His phone vibrates, whistles and shows full screen, even when locked. The others carry on with their snack bars.',
      'ch.av': 'GB', 'ch.group': 'Gouffre Berger', 'ch.place': 'Cave entrance', 'ch.m2': 'I’ll bring the rescue kit. And the croissants.',
    },
    ui: {
      fr: {
        'label.4g': '4G · resté à l’entrée',
        'phone.group': 'Gouffre Berger', 'phone.stop': 'STOP', 'phone.release': 'Débraye\nla corde', 'phone.pull': 'Remonte\nla corde', 'label.press': 'Appui sur STOP',
        'label.waterfall': 'Cascade du puits · le son se perd', 'label.julie': `Julie${NNBSP}: ${q('La corde frotte, ne montez pas')}`,
        'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, dans la galerie',
      },
      en: {
        'label.4g': '4G · at the entrance',
        'phone.group': 'Gouffre Berger', 'phone.stop': 'STOP', 'phone.release': 'Release\nthe rope', 'phone.pull': 'Pull up\nthe rope', 'label.press': 'STOP pressed',
        'label.waterfall': 'Shaft waterfall · sound is lost', 'label.julie': 'Julie: “Rope is rubbing, don’t come up”',
        'label.relay': 'Marc relays the message', 'label.ahead': 'Léa and Tom, down the passage',
      },
    },
  },
  gathering: {
    // A volunteers' team at a festival: the network is saturated, the music covers the voice, and a
    // message reaches the first-aid post from phone to phone (js/acts/gathering.js).
    cases: [6, 1, 2, 3, 4],
    fr: {
      'hero.t1': 'Restez en contact,', 'hero.t2': 'même quand', 'hero.t3': 'le réseau sature.',
      'c1.h': 'Des milliers de téléphones, une seule antenne.',
      'c1.p': 'Le soir du concert, des milliers de téléphones saturent les antennes&#8239;: plus rien ne passe. Quand quelqu’un fait un malaise au premier rang, le poste de secours n’en sait rien.',
      'c2.p': 'Julie, bénévole, écrit «&#8239;Malaise au premier rang, côté gauche&#8239;». Le téléphone de Marc, dans la foule, le passe à Léa et Tom, au poste de secours, sans l’antenne.',
      's1.h': 'Les consignes de l’équipe, en une touche.',
      's1.p': 'Quatre grosses touches, faciles à viser dans la foule. Une vibration par point&#8239;: on sent le code sans l’entendre. Et vos propres codes.',
      'sig.stop': 'Attends', 'sig.ok': 'OK', 'sig.release': 'Viens', 'sig.pull': 'J’arrive',
      's2.p': 'Julie envoie «&#8239;Attends&#8239;» à Marc, de l’autre côté de la fosse. Son téléphone vibre, sonne et s’affiche en plein écran, même verrouillé. Les autres continuent de danser.',
      'ch.av': 'FB', 'ch.group': 'Festival · bénévoles', 'ch.place': 'Poste de secours', 'ch.m2': 'J’apporte les gilets. Et les croissants.',
      'wd.foot': 'Et aucune grande plateforme derrière. Siflo n’est pas conçu pour échapper à une surveillance organisée.',
    },
    en: {
      'hero.t1': 'Stay in touch,', 'hero.t2': 'even when', 'hero.t3': 'the network jams.',
      'c1.h': 'Thousands of phones, one cell tower.',
      'c1.p': 'On concert night, thousands of phones saturate the towers: nothing gets through. When someone collapses in the front row, the first-aid post has no idea.',
      'c2.p': 'Julie, a volunteer, types “Someone collapsed, front row, left side”. Marc’s phone, in the crowd, passes it on to Léa and Tom at the first-aid post, without the tower.',
      's1.h': 'The team’s calls, one tap away.',
      's1.p': 'Four big buttons, easy to hit in a crowd. One vibration per dot: you feel the code without hearing it. And your own codes.',
      'sig.stop': 'Wait', 'sig.ok': 'OK', 'sig.release': 'Come', 'sig.pull': 'Coming',
      's2.p': 'Julie sends “Wait” to Marc, on the other side of the pit. His phone vibrates, rings and shows full screen, even when locked. The others keep dancing.',
      'ch.av': 'FB', 'ch.group': 'Festival volunteers', 'ch.place': 'First-aid post', 'ch.m2': 'I’ll bring the vests. And the croissants.',
      'wd.foot': 'And no big platform behind it. Siflo is not designed to escape organised surveillance.',
    },
    ui: {
      fr: {
        'phone.group': 'Festival · bénévoles', 'phone.stop': 'Attends', 'phone.ok': 'OK', 'phone.release': 'Viens', 'phone.pull': 'J’arrive',
        'label.press': 'Appui sur Attends',
'label.waterfall': 'Antenne saturée · plus rien ne passe',
        'label.julie': `Julie${NNBSP}: ${q('Malaise au premier rang')}`, 'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, au poste de secours',
      },
      en: {
        'phone.group': 'Festival volunteers', 'phone.stop': 'Wait', 'phone.ok': 'OK', 'phone.release': 'Come', 'phone.pull': 'Coming',
        'label.press': 'Wait pressed',
'label.waterfall': 'Tower saturated · nothing gets through',
        'label.julie': 'Julie: “Someone collapsed, front row”', 'label.relay': 'Marc relays the message', 'label.ahead': 'Léa and Tom, at the first-aid post',
      },
    },
  },
};

/**
 * The address of each identity's own page (built by tools/activities.py from index.html and
 * en/index.html) with its title and descriptions; the general identity is the home page itself.
 */
export const PAGES = {
  general: { fr: { path: '/' }, en: { path: '/en/' } },
  canyon: {
    fr: {
      path: '/canyon/',
      title: 'Siflo — communication de groupe en canyon, même sans réseau',
      description: 'Canyonisme\u202f: messages, signaux et SOS de téléphone en téléphone, même sous la cascade et sans réseau. Application gratuite, chiffrée, sans compte.',
      og: 'Siflo — Restez en contact dehors, même hors ligne.',
    },
    en: {
      path: '/en/canyon/',
      title: 'Siflo — group communication for canyoning, even with no signal',
      description: 'Canyoning: messages, signals and SOS from phone to phone, even under the waterfall and with no signal. Free, encrypted app, no account.',
      og: 'Siflo — Stay in touch outdoors, even offline.',
    },
  },
  mountain: {
    fr: {
      path: '/montagne/',
      title: 'Siflo — communication de groupe en montagne, même sans réseau',
      description: 'Ski de rando, alpinisme, escalade\u202f: messages, signaux et SOS pour votre groupe, même hors de vue et sans réseau. Application gratuite, chiffrée, sans compte.',
      og: 'Siflo — Restez en contact en montagne, même hors ligne.',
    },
    en: {
      path: '/en/mountain/',
      title: 'Siflo — group communication in the mountains, even with no signal',
      description: 'Ski touring, mountaineering, climbing: messages, signals and SOS for your group, even out of sight and with no signal. Free, encrypted app, no account.',
      og: 'Siflo — Stay in touch in the mountains, even offline.',
    },
  },
  cave: {
    fr: {
      path: '/speleo/',
      title: 'Siflo — communication de groupe en spéléo, même sans réseau',
      description: 'Spéléologie\u202f: messages, signaux et SOS de téléphone en téléphone dans les puits et les galeries, sans réseau. Application gratuite, chiffrée, sans compte.',
      og: 'Siflo — Restez en contact sous terre, même hors ligne.',
    },
    en: {
      path: '/en/caving/',
      title: 'Siflo — group communication for caving, even with no signal',
      description: 'Caving: messages, signals and SOS from phone to phone down shafts and along passages, with no signal. Free, encrypted app, no account.',
      og: 'Siflo — Stay in touch underground, even offline.',
    },
  },
  gathering: {
    fr: {
      path: '/festival/',
      title: 'Siflo — communication en festival, même quand le réseau sature',
      description: 'Festivals, événements, équipes de bénévoles\u202f: messages, signaux et SOS de téléphone en téléphone quand les antennes saturent. Application gratuite, chiffrée, sans compte.',
      og: 'Siflo — Restez en contact, même quand le réseau sature.',
    },
    en: {
      path: '/en/festival/',
      title: 'Siflo — communication at festivals, even when the network jams',
      description: 'Festivals, events, volunteer teams: messages, signals and SOS from phone to phone when the cell towers saturate. Free, encrypted app, no account.',
      og: 'Siflo — Stay in touch, even when the network jams.',
    },
  },
};
