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
