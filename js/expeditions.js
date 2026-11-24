// /expeditions: the mountain-film series. One entry per episode, newest last; texts are [fr, en] HTML.
// Videos stay on YouTube: the card shows the self-hosted poster, and nothing from YouTube loads before the visitor clicks.
const EPISODES = [
  {
    n: '01', yt: 'TAhiUHu_9Xw', poster: 'mont-blanc.jpg',
    date: ['8 août 1786', '8 August 1786'],
    title: ['Mont Blanc', 'Mont Blanc'],
    sub: ['La première ascension', 'The first ascent'],
    text: ['Personne n’était jamais monté là-haut. Partis de Chamonix sans corde ni crampons, Michel-Gabriel Paccard et Jacques Balmat atteignent le sommet le 8 août 1786 à 18&nbsp;h&nbsp;23, suivis à la longue-vue depuis la vallée.',
      'Nobody had ever been up there. Leaving Chamonix without rope or crampons, Michel-Gabriel Paccard and Jacques Balmat reach the summit on 8 August 1786 at 6:23 pm, watched through a telescope from the valley.'],
    credits: ['Relief et image&nbsp;: IGN (LiDAR HD, BD ORTHO). Tracé indicatif&nbsp;: itinéraire de 1786 par la montagne de la Côte et les Grands Mulets, d’après Wikipédia («&nbsp;Michel-Gabriel Paccard&nbsp;»). Musique&nbsp;: Grieg, «&nbsp;Au matin&nbsp;» (<i>Peer Gynt</i>), Musopen Symphony, domaine public.',
      'Terrain and imagery: IGN (LiDAR HD, BD ORTHO). Indicative route: the 1786 route by the Montagne de la Côte and the Grands Mulets, after Wikipedia (“Michel-Gabriel Paccard”). Music: Grieg, “Morning Mood” (<i>Peer Gynt</i>), Musopen Symphony, public domain.'],
    also: {
      Instagram: 'https://www.instagram.com/siflo.app/reel/Df7CO6DhgYw/',
      X: 'https://x.com/sifloapp/status/2123076193109029349',
      Bluesky: 'https://bsky.app/profile/siflo.app/post/3n2lv6z3pak2g',
      Threads: 'https://www.threads.com/@siflo.app/post/Df44MFujFCb',
    },
  },
  {
    n: '02', yt: 'kI0ZGB8_91E', poster: 'cervin.jpg',
    date: ['14 juillet 1865', '14 July 1865'],
    title: ['Le Cervin', 'The Matterhorn'],
    sub: ['La première, par l’arête du Hörnli', 'The first ascent, by the Hörnli ridge'],
    text: ['Sept hommes, une arête, un sommet encore vierge. Partis de Zermatt le 13 juillet 1865, Edward Whymper, le guide chamoniard Michel Croz et cinq compagnons remontent l’arête du Hörnli. Le 14 à 13&nbsp;h&nbsp;40, Whymper et Croz atteignent les premiers le sommet. Michel Croz, Charles Hudson, Douglas Hadow et Francis Douglas ne redescendront pas&nbsp;; des milliers de cordées ont suivi leur trace.',
      'Seven men, one ridge, a summit no one had reached. Leaving Zermatt on 13 July 1865, Edward Whymper, the Chamonix guide Michel Croz and five companions climb the Hörnli ridge. On the 14th at 1:40 pm, Whymper and Croz are the first on the summit. Michel Croz, Charles Hudson, Douglas Hadow and Francis Douglas will not come back down; thousands of rope teams have followed in their steps.'],
    credits: ['Relief et image&nbsp;: swisstopo (swissALTI3D, SWISSIMAGE). Tracé&nbsp;: l’arête du Hörnli, suivie sur le relief. Gravure&nbsp;: Edward Whymper, «&nbsp;Scrambles Amongst the Alps&nbsp;», 1871, domaine public. Musique&nbsp;: Mahler, Symphonie n°&nbsp;5, «&nbsp;Adagietto&nbsp;», Peabody, CC0.',
      'Terrain and imagery: swisstopo (swissALTI3D, SWISSIMAGE). Route: the Hörnli ridge, followed on the terrain. Engraving: Edward Whymper, <i>Scrambles Amongst the Alps</i>, 1871, public domain. Music: Mahler, Symphony No. 5, “Adagietto”, Peabody, CC0.'],
    also: {
      Instagram: 'https://www.instagram.com/siflo.app/reel/DgAKDw2Mtnn/',
      TikTok: 'https://www.tiktok.com/@siflo.app/video/7710591037206678816',
      X: 'https://x.com/sifloapp/status/2124109828939203001',
      Bluesky: 'https://bsky.app/profile/siflo.app/post/3n2t2h33j3k2f',
      Threads: 'https://www.threads.com/@siflo.app/post/DgAL2IijEh3',
    },
  },
  {
    n: '03', yt: 'O7rdNWv_w-8', poster: 'jorasses.jpg',
    date: ['4-6 août 1938', '4-6 August 1938'],
    title: ['Les Grandes Jorasses', 'The Grandes Jorasses'],
    sub: ['La première de l’éperon Walker', 'The first ascent of the Walker Spur'],
    text: ['Deux nuits dans 1&nbsp;200&nbsp;m de paroi. Le 4 août 1938, Riccardo Cassin, Gino Esposito et Ugo Tizzoni attaquent l’éperon Walker, l’un des derniers grands problèmes des Alpes. Trois jours d’escalade et deux bivouacs plus tard, ils sortent dans la tempête au sommet de la pointe Walker (4&nbsp;208&nbsp;m), le 6 août vers 15&nbsp;h. Leur voie est devenue l’une des grandes classiques des Alpes.',
      'Two nights on a 1,200&nbsp;m wall. On 4 August 1938, Riccardo Cassin, Gino Esposito and Ugo Tizzoni set off up the Walker Spur, one of the last great problems of the Alps. After three days of climbing and two bivouacs, they top out in a storm on the Pointe Walker (4,208&nbsp;m) around 3 pm on 6 August. Their route has become one of the great classics of the Alps.'],
    credits: ['Relief et image&nbsp;: IGN (LiDAR HD, BD ORTHO), Copernicus Sentinel-2 côté italien. Tracé&nbsp;: l’éperon Walker, calé sur «&nbsp;Grandes Jorasses - Tracé des voies&nbsp;» (Michmuch38, L. Besson, Wikimedia Commons, CC BY-SA 3.0). Musique&nbsp;: Brahms, Symphonie n°&nbsp;3, «&nbsp;Poco allegretto&nbsp;», Musopen, domaine public.',
      'Terrain and imagery: IGN (LiDAR HD, BD ORTHO), Copernicus Sentinel-2 on the Italian side. Route: the Walker Spur, fitted to “Grandes Jorasses - Tracé des voies” (Michmuch38, L. Besson, Wikimedia Commons, CC BY-SA 3.0). Music: Brahms, Symphony No. 3, “Poco allegretto”, Musopen, public domain.'],
    also: {
      Instagram: 'https://www.instagram.com/siflo.app/reel/DgDX8iMsfgR/',
      TikTok: 'https://www.tiktok.com/@siflo.app/video/7711055293987179808',
      X: 'https://x.com/sifloapp/status/2124570900100227451',
      Bluesky: 'https://bsky.app/profile/siflo.app/post/3n2war6yfsc2j',
      Threads: 'https://www.threads.com/@siflo.app/post/DgDdO2gDABh',
    },
  },
  {
    n: '04', yt: 'mADAASTI__I', poster: 'meije.jpg',
    date: ['16 août 1877', '16 August 1877'],
    title: ['La Meije', 'La Meije'],
    sub: ['Le dernier grand sommet des Alpes', 'The last great summit of the Alps'],
    text: ['Tous les grands sommets des Alpes sont gravis. Sauf un. Depuis des années, les meilleures cordées tentent la Meije sans atteindre le Grand Pic. Emmanuel Boileau de Castelnau, 20&nbsp;ans, s’y engage avec deux guides de Saint-Christophe-en-Oisans, Pierre Gaspard et son fils. Le 4 août, au-dessus du Promontoire, une dalle lisse les arrête&nbsp;: les clous des chaussures glissent, Gaspard la passe pieds nus. Le 16 août 1877, ils atteignent le Grand Pic (3&nbsp;983&nbsp;m). Sceptique, Coolidge refera leur voie un an plus tard et reconnaîtra leur réussite. Leur itinéraire est devenu la voie normale.',
      'Every great summit in the Alps has been climbed. All but one. For years the best climbers have tried the Meije without reaching the Grand Pic. Emmanuel Boileau de Castelnau, aged 20, sets off with two guides from Saint-Christophe-en-Oisans, Pierre Gaspard and his son. On 4 August, above the Promontoire, a smooth slab stops them: their nailed boots slip, so Gaspard climbs it barefoot. On 16 August 1877 they reach the Grand Pic (3,983&nbsp;m). Doubtful, Coolidge will repeat their route a year later and acknowledge their success. Their line has become the normal route.'],
    credits: ['Relief et image&nbsp;: IGN (LiDAR HD, BD ORTHO). Tracé&nbsp;: voie normale du Grand Pic, calée sur «&nbsp;Meije - South face - Routes&nbsp;» (Krist@f, Camptocamp, Wikimedia Commons, CC BY-SA 2.0 fr). Musique&nbsp;: Brahms, Danse hongroise n°&nbsp;1, US Air Force Band, domaine public.',
      'Terrain and imagery: IGN (LiDAR HD, BD ORTHO). Route: the normal route on the Grand Pic, fitted to “Meije - South face - Routes” (Krist@f, Camptocamp, Wikimedia Commons, CC BY-SA 2.0 fr). Music: Brahms, Hungarian Dance No. 1, US Air Force Band, public domain.'],
    also: {
      X: 'https://x.com/sifloapp/status/2125289977672323092',
      Bluesky: 'https://bsky.app/profile/siflo.app/post/3n33acyr24k2p',
      Threads: 'https://www.threads.com/@siflo.app/post/DgIjo_3jPAl',
    },
  },
];

const UI = {
  fr: { no: 'N°&nbsp;', play: t => `Lire «&nbsp;${t}&nbsp;» sur YouTube`, from: 'La vidéo se lit depuis YouTube, seulement après votre clic.', also: 'Aussi sur' },
  en: { no: 'No.&nbsp;', play: t => `Play “${t}” on YouTube`, from: 'The video plays from YouTube, only once you click.', also: 'Also on' },
};

document.querySelectorAll('section[lang]').forEach(section => {
  const lang = section.lang, i = lang === 'fr' ? 0 : 1, ui = UI[lang];
  section.querySelector('.episodes').innerHTML = EPISODES.slice().reverse().map(e => `
    <article class="episode">
      <div class="media">
        <div class="player">
          <a class="poster" href="https://www.youtube.com/shorts/${e.yt}" data-yt="${e.yt}" data-title="${e.title[i]} · ${e.sub[i]}" aria-label="${ui.play(e.title[i])}">
            <img src="${e.poster}" alt="" width="540" height="960" loading="lazy">
            <span class="play" aria-hidden="true"></span>
          </a>
        </div>
        <p class="from">${ui.from}</p>
      </div>
      <div class="text">
        <p class="eyebrow">${ui.no}${e.n} · ${e.date[i]}</p>
        <h2>${e.title[i]}</h2>
        <p class="sub">${e.sub[i]}</p>
        <p>${e.text[i]}</p>
        <p class="also">${ui.also} ${Object.entries(e.also).map(([name, url]) => `<a href="${url}">${name}</a>`).join(' · ')}</p>
        <p class="credits">${e.credits[i]}</p>
      </div>
    </article>`).join('');
});

document.addEventListener('click', ev => {
  const a = ev.target.closest('a[data-yt]');
  if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  ev.preventDefault();
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1&playsinline=1&rel=0`;
  frame.title = a.dataset.title;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  a.replaceWith(frame);
  frame.focus();
});

// Same language pick as the other pages: ?lang=, then the saved choice, then the browser.
let saved = null;
try { saved = localStorage.getItem('lang'); } catch (e) {}
function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('section[lang]').forEach(e => { e.hidden = e.lang !== lang; });
  document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  document.title = document.querySelector(`section[lang="${lang}"]`).dataset.title;
}
setLang(/^fr\b/i.test(new URLSearchParams(location.search).get('lang') || saved || navigator.language || '') ? 'fr' : 'en');
document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem('lang', b.dataset.lang); } catch (e) {}
  const url = new URL(location.href);
  url.searchParams.set('lang', b.dataset.lang);
  history.replaceState(null, '', url);
  setLang(b.dataset.lang);
}));
