// What changes with the activity (js/activity.js): colours of the 3D acts, texts, the order of the
// field cases, and each identity's own page. Pure data, so that tools/activities.py reads it too.
/** Colours of the 3D acts: the phones' glow, the signal close-up and the contour map (a ridge for the mountain, a cave survey and a festival site plan for caving and gatherings). */
export const THEMES = {
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
  mountain: {
    cases: [5, 4, 1, 2, 3],
    // No whistle and no shouting here: on skis the group spreads out one at a time, often out of
    // sight, and the voice is lost in the wind, the whiteout and the distance (js/acts/mountain.js).
    fr: {
      'hero.t1': 'Restez en contact', 'hero.t2': 'en montagne,', 'hero.t3': 'même hors ligne.',
      'hero.eyebrow': 'Ski de rando, alpinisme, escalade',
      'c1.h': 'En haut de la pente, les autres sont déjà loin.',
      'c1.p': 'On descend un par un et on s’attend plus bas, souvent hors de vue. Le vent couvre la voix, le jour blanc efface les silhouettes, et crier d’un bout à l’autre de la combe ne sert pas à grand-chose. Quand la neige craque sous les skis de Julie, ceux d’en bas n’en savent rien.',
      'c2.p': `Julie écrit ${q('Ça craque, un par un')}. Le téléphone de Marc, à mi-pente, transmet le message à Léa et Tom, plus bas dans la combe, hors de vue de Julie. Avec une radio LoRa en option, il porte jusqu’à quelques kilomètres.`,
      's1.h': 'Les consignes du groupe, en une touche.',
      's1.p': 'Quatre grosses touches, faciles à viser avec des gants. Plus besoin de crier dans le vent&#8239;: la consigne arrive sur le téléphone, avec le nom de celui qui l’envoie. Chaque club peut y mettre ses propres codes, même les plus ésotériques.',
      'sig.release': 'Un par un', 'sig.pull': 'Regroupement',
      's2.p': 'Julie, en haut du couloir, envoie STOP à Marc, qui s’apprête à s’y engager. Son téléphone vibre au rythme du code, sonne et affiche l’alerte en plein écran, même verrouillé. Le reste du groupe continue de manger ses barres.',
      'm1.p': 'Sur l’arête, chaque téléphone de la cordée transmet les messages au suivant par Bluetooth&#8239;: environ 25&nbsp;m en poche, une centaine de mètres en main et à vue, jusqu’à 300&nbsp;m entre deux Android compatibles longue portée, et jusqu’à 12 sauts. Pour les grandes distances, une radio LoRa en option porte à plusieurs kilomètres (estimations). Pas besoin d’antenne&#8239;: chaque téléphone du groupe en devient une.',
      'ch.av': 'BL', 'ch.group': 'Belledonne · ski de rando', 'ch.place': 'Parking du départ', 'ch.m2': 'J’apporte le DVA de rechange. Et les croissants.',
    },
    en: {
      'hero.t1': 'Stay in touch', 'hero.t2': 'in the mountains,', 'hero.t3': 'even offline.',
      'hero.eyebrow': 'Ski touring, mountaineering, climbing',
      'c1.h': 'At the top of the slope, the others are already far away.',
      'c1.p': 'You ski down one at a time and wait further down, often out of sight. The wind swallows the voice, a whiteout wipes out the silhouettes, and shouting across the bowl does not get you far. When the snow cracks under Julie’s skis, those below have no idea.',
      'c2.p': 'Julie types “It’s cracking, one at a time”. Marc’s phone, halfway down the slope, passes the message on to Léa and Tom, further down the bowl and out of Julie’s sight. With an optional LoRa radio, it carries up to a few kilometres.',
      's1.h': 'The group’s calls, one tap away.',
      's1.p': 'Four big buttons, easy to hit with gloves on. No more shouting into the wind: the call lands on the phone, with the name of whoever sent it. Each club can put in its own codes, even the most obscure ones.',
      'sig.release': 'One at a time', 'sig.pull': 'Regroup',
      's2.p': 'Julie, at the top of the couloir, sends STOP to Marc, about to drop in. His phone vibrates to the rhythm of the code, rings and shows a full-screen alert, even when locked. The rest of the group carries on with their snack bars.',
      'm1.p': 'On the ridge, every phone of the rope team passes the messages on to the next over Bluetooth: about 25&nbsp;m in a pocket, about a hundred metres in hand with a clear line of sight, up to 300&nbsp;m between two Android phones with long-range Bluetooth, and up to 12 hops. For long distances, an optional LoRa radio carries several kilometres (estimates). No cell tower needed: every phone in the group becomes one.',
      'ch.av': 'BL', 'ch.group': 'Belledonne ski tour', 'ch.place': 'Trailhead car park', 'ch.m2': 'I’ll bring the spare transceiver. And the croissants.',
    },
    ui: {
      fr: {
        'phone.group': 'Belledonne', 'phone.release': 'Un par un', 'phone.pull': 'Regroupement',
        'label.whistle': 'Ça craque sous les skis', 'label.waterfall': 'Jour blanc · plus personne en vue', 'label.julie': `Julie${NNBSP}: ${q('Ça craque, un par un')}`,
        'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, plus bas dans la combe', 'label.icefall': 'Cascade de glace', 'label.icecave': 'Grotte de glace',
        'label.behind': 'Resté en arrière sur l’arête',
        'label.lea': 'Léa · vachée au relais', 'label.tom': 'Tom ne la voit plus', 'label.next': 'Cordée voisine',
        'label.wind': 'Vent · les annonces se perdent', 'label.safe': `Léa${NNBSP}: ${q('Vaché')}`, 'label.tomok': 'Tom · reçu, puis vu', 'label.nothing': 'Cordée voisine · rien reçu',
      },
      en: {
        'phone.group': 'Belledonne', 'phone.release': 'One at\na time', 'phone.pull': 'Regroup',
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
      'm2.p': 'Sous terre, personne ne capte. Mais un équipier resté à l’entrée fait le lien&#8239;: ce qui l’atteint de téléphone en téléphone part par internet vers ceux qui attendent dehors, via nos serveurs relais, qui gardent les messages 48&nbsp;h sans pouvoir les lire.',
      'hero.t1': 'Restez en contact', 'hero.t2': 'sous terre,', 'hero.t3': 'même hors ligne.',
      'hero.eyebrow': 'Spéléologie',
      'c1.h': 'Le sifflet, c’est bien. Quand le puits le laisse remonter.',
      'c1.p': 'Quatre codes seulement, qui changent d’un club à l’autre. Sous terre, l’écho les brouille et la moindre cascade les couvre. Quand la corde frotte au fractionnement, ceux d’en bas n’en savent rien. Ceux partis devant dans la galerie, encore moins.',
      'c2.p': `Julie écrit ${q('La corde frotte, ne montez pas')}. Le téléphone de Marc, au pied du puits, transmet le message à Léa et Tom, plus loin dans la galerie. Tant que chacun reste à portée du suivant, le message suit l’équipe.`,
      's1.p': 'Quatre grosses touches, faciles à viser avec des doigts pleins de boue. Les points rappellent le nombre de coups de sifflet. Chaque club peut y mettre ses propres codes, même les plus ésotériques.',
      's2.p': 'Julie, en haut du puits, envoie STOP à Marc, en pleine remontée sur la corde. Son téléphone vibre au rythme du code, siffle et affiche l’alerte en plein écran, même verrouillé. Le reste de l’équipe continue de manger ses barres.',
      'ch.av': 'GB', 'ch.group': 'Gouffre Berger', 'ch.place': 'Entrée du gouffre', 'ch.m2': 'J’apporte le kit de secours. Et les croissants.',
    },
    en: {
      'm2.h': 'The surface team? The internet bridges the gap.',
      'm2.p': 'Underground, nobody has signal. But a teammate who stayed at the entrance bridges the gap: whatever reaches them from phone to phone goes over the internet to those waiting outside, through our relay servers, which keep messages for 48 hours without being able to read them.',
      'hero.t1': 'Stay in touch', 'hero.t2': 'underground,', 'hero.t3': 'even offline.',
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
        'label.4g': '4G · resté à l’entrée', 
        'phone.group': 'Gouffre Berger',
        'label.waterfall': 'Cascade du puits · le son se perd', 'label.julie': `Julie${NNBSP}: ${q('La corde frotte, ne montez pas')}`,
        'label.relay': 'Marc relaie le message', 'label.ahead': 'Léa et Tom, dans la galerie',
      },
      en: {
        'label.4g': '4G · at the entrance', 
        'phone.group': 'Gouffre Berger',
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
      'hero.eyebrow': 'Festivals, événements, bénévoles',
      'c1.h': 'Des milliers de téléphones, une seule antenne.',
      'c1.p': 'Le soir du concert, des milliers de téléphones se partagent les mêmes antennes&#8239;: les messages restent bloqués, les appels ne passent plus, et tout le monde n’a pas de talkie-walkie. Quand quelqu’un fait un malaise au premier rang, le poste de secours n’en sait rien.',
      'c2.p': `Julie, bénévole devant la scène, écrit ${q('Malaise au premier rang, côté gauche')}. Le téléphone de Marc, au milieu de la foule, transmet le message à Léa et Tom, au poste de secours, sans passer par l’antenne.`,
      's1.h': 'Les consignes de l’équipe, en une touche.',
      's1.p': 'Quatre grosses touches, faciles à viser dans la foule. Les points donnent le nombre de vibrations&#8239;: on les sent même quand on n’entend plus rien. Chaque équipe peut y mettre ses propres codes.',
      'sig.stop': 'Attends', 'sig.ok': 'OK', 'sig.release': 'Viens', 'sig.pull': 'J’arrive',
      's2.p': `Julie envoie ${q('Attends')} à Marc, de l’autre côté de la fosse. Son téléphone vibre au rythme du code, sonne et affiche l’alerte en plein écran, même verrouillé. Le reste de l’équipe continue de danser.`,
      'ch.av': 'FB', 'ch.group': 'Festival · bénévoles', 'ch.place': 'Poste de secours', 'ch.m2': 'J’apporte les gilets. Et les croissants.',
    },
    en: {
      'hero.t1': 'Stay in touch,', 'hero.t2': 'even when', 'hero.t3': 'the network jams.',
      'hero.eyebrow': 'Festivals, events, volunteers',
      'c1.h': 'Thousands of phones, one cell tower.',
      'c1.p': 'On concert night, thousands of phones share the same towers: messages get stuck, calls fail, and not everyone has a radio. When someone collapses in the front row, the first-aid post has no idea.',
      'c2.p': 'Julie, volunteering by the stage, types “Someone collapsed, front row, left side”. Marc’s phone, in the middle of the crowd, passes the message on to Léa and Tom at the first-aid post, without going through the tower.',
      's1.h': 'The team’s calls, one tap away.',
      's1.p': 'Four big buttons, easy to hit in a crowd. The dots give the number of vibrations: you feel them even when you can hear nothing. Each team can put in its own codes.',
      'sig.stop': 'Wait', 'sig.ok': 'OK', 'sig.release': 'Come', 'sig.pull': 'Coming',
      's2.p': 'Julie sends “Wait” to Marc, on the other side of the pit. His phone vibrates to the rhythm of the code, rings and shows a full-screen alert, even when locked. The rest of the team keeps dancing.',
      'ch.av': 'FB', 'ch.group': 'Festival volunteers', 'ch.place': 'First-aid post', 'ch.m2': 'I’ll bring the vests. And the croissants.',
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
 * en/index.html) with its title and descriptions; canyon is the home page itself.
 */
export const PAGES = {
  canyon: { fr: { path: '/' }, en: { path: '/en/' } },
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
