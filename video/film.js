// Film overlay: titles, transitions, real app screens and end card, drawn over the 3D acts.
// render.py injects it in ?capture mode and calls window.__film.frame(t) before each frame,
// so everything is a pure function of the film time t (seconds).
(() => {
  const FR = document.documentElement.lang === 'fr';
  const L = FR ? 'fr' : 'en';
  const T = FR ? {
    s1: { k: 'Canyon · spéléo · escalade', l: ['Restez en contact,', 'même sans réseau.'] },
    s2: { k: 'Au fond du canyon', l: ['Le coup de sifflet', 'se noie dans la cascade.'] },
    s3: { k: 'Avec Siflo', l: ['Le message, lui,', 'passe de téléphone en téléphone.'] },
    s4: { k: 'Les signaux', l: ['Un STOP d’une seule touche,', 'rien que pour Marc.'], chips: [['✓', 'Marc · reçu', 'ok'], ['✓✓', 'Marc · vu', 'ok']] },
    s5: { k: 'Même hors ligne', l: ['Et pour tout le reste,', 'une vraie messagerie de groupe.'], chips: [['•', 'Photos et messages vocaux'], ['•', 'Sondage pour l’heure du départ'], ['•', 'Topo consultable sans réseau']] },
    s6: { k: 'Sans réseau mobile', l: ['De proche en proche,', 'même en zone blanche.'], chips: [['•', 'Bluetooth : 25 à 300 m entre deux téléphones'], ['•', 'Internet, si un membre a du réseau'], ['•', 'Radio LoRa : jusqu’à plusieurs km']] },
    s7: { k: 'SOS', l: ['Un SOS en deux secondes,', 'tous ceux à portée sont alertés.'] },
    s8: { k: 'Chiffrement de bout en bout', l: ['Vos messages restent entre vous.', 'Tout est expliqué sur siflo.app/labs'] },
    s9: { k: 'Et plus encore', l: ['Aussi pour les festivals', 'et les grands rassemblements.'], chips: [['•', 'Android et iPhone dans le même groupe'], ['•', 'Position partagée'], ['•', 'Invitation par QR code']] },
    card: 'Vidéo de présentation du chiffrement',
    end: { tag: ['La communication de groupe', 'en pleine nature.'], facts: 'Gratuite · sans compte · sans annonces', play: ['Disponible sur', 'Google Play'], apple: ['Télécharger dans', 'l’App Store'], watch: 'Et sur votre montre : Wear OS, Garmin, Amazfit, Apple Watch' },
  } : {
    s1: { k: 'Canyoning · caving · climbing', l: ['Stay in touch,', 'even with no signal.'] },
    s2: { k: 'Deep in the canyon', l: ['The whistle gets lost', 'in the roar of the water.'] },
    s3: { k: 'With Siflo', l: ['The message hops', 'from phone to phone.'] },
    s4: { k: 'Signals', l: ['STOP in one tap,', 'sent to Marc only.'], chips: [['✓', 'Marc · received', 'ok'], ['✓✓', 'Marc · seen', 'ok']] },
    s5: { k: 'Even offline', l: ['And for everything else,', 'a real group messenger.'], chips: [['•', 'Photos and voice notes'], ['•', 'A poll for the start time'], ['•', 'Route notes, readable offline']] },
    s6: { k: 'No signal', l: ['Hop by hop,', 'even in dead zones.'], chips: [['•', 'Bluetooth: 25 to 300 m between two phones'], ['•', 'Internet, if someone has signal'], ['•', 'LoRa radio: up to several km']] },
    s7: { k: 'SOS', l: ['SOS in two seconds,', 'reaching everyone in range.'] },
    s8: { k: 'End-to-end encryption', l: ['Your messages stay between you.', 'It’s all explained at siflo.app/labs'] },
    s9: { k: 'And more', l: ['Also for festivals', 'and big gatherings.'], chips: [['•', 'Android and iPhone in one group'], ['•', 'Shared location'], ['•', 'QR code invitations']] },
    card: 'Encryption explainer video',
    end: { tag: ['Group communication', 'for the outdoors.'], facts: 'Free · no account · no ads', play: ['Get it on', 'Google Play'], apple: ['Download on the', 'App Store'], watch: 'And on your watch: Wear OS, Garmin, Amazfit, Apple Watch' },
  };
  const scr = (n) => (/^(09|10|11|12)/.test(n) ? `video/screens/${n}-${L}.webp` : `assets/screens/${n}-${L}.webp`);

  // Cuts on the bar lines of the score (95.7 BPM, one bar = 2.53 s).
  const CUTS = [5.18, 10.24, 17.81, 22.85, 30.42, 35.48, 40.54, 45.56, 50.62];
  const END = 50.62, DUR = 60;
  const SCENES = [
    { id: 's1', t0: 0.6, t1: 4.7 },
    { id: 's2', t0: 5.6, t1: 9.8 },
    { id: 's3', t0: 10.7, t1: 17.3 },
    { id: 's4', t0: 18.2, t1: 22.4, chipsAt: [20.5, 21.4] },
    { id: 's5', t0: 23.2, t1: 30.0, chipsAt: [24.9, 26.9, 27.9] },
    { id: 's6', t0: 30.9, t1: 35.0, chipsAt: [31.7, 32.7, 33.7], cls: 'stack' },
    { id: 's7', t0: 35.9, t1: 40.1, cls: 'sos' },
    { id: 's8', t0: 41.0, t1: 45.1 },
    { id: 's9', t0: 45.9, t1: 50.2, chipsAt: [47.6, 48.2, 48.8] },
  ];
  // Boards of real screens over a darkened 3D background.
  // A phone: screen, left/top/width in viewport px (540 × 960), rotation, and either a window height
  // with a pan (fraction of the screen's height shown at the top, from → to) or the whole screen.
  const BOARDS = [
    { t0: 22.85, t1: 26.7, phones: [{ s: '02-group-chat', x: 120, y: 54, w: 300, win: 470, pan: [0.04, 0.26], in: 0 }] },
    { t0: 26.5, t1: 30.42, phones: [
      { s: '04-topo', x: 22, y: 98, w: 176, rot: -8, in: 0.25 },
      { s: '05-before-you-go', x: 342, y: 98, w: 176, rot: 8, in: 0.4 },
      { s: '10-ski-poll', x: 170, y: 52, w: 200, in: 0, top: true }] },
    { t0: 40.54, t1: 45.56, labs: true },
    { t0: 45.56, t1: 50.62, phones: [
      { s: '09-festival-chat', x: 22, y: 98, w: 176, rot: -8, in: 0.15 },
      { s: '08-member-distances', x: 342, y: 98, w: 176, rot: 8, in: 0.35 },
      { s: '11-iphone-chat', x: 170, y: 52, w: 200, in: 0, top: true, iphone: true }] },
  ];
  const LABS_FRAMES = 60, LABS_FPS = 15;

  const clamp = (x) => Math.max(0, Math.min(1, x));
  const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const inOut = (x) => x * x * (3 - 2 * x);
  const ramp = (t, a, b) => clamp((t - a) / (b - a));

  const root = document.createElement('div');
  root.id = 'film';
  const words = (s) => s.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
  const phone = (p) => `<div class="phone${p.iphone ? ' iphone' : ''}${p.win ? ' win' : ''}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;${p.win ? `height:${p.win}px` : ''};z-index:${p.top ? 2 : 1}"><div class="glass"><img src="${scr(p.s)}" alt=""></div></div>`;
  const board = (b) => `<div class="board">${b.labs
    ? `<div class="labs-card"><div class="labs-frames">${Array.from({ length: LABS_FRAMES }, (_, i) => `<img src="video/labs/c${String(i + 1).padStart(2, '0')}.jpg" alt="">`).join('')}</div><p class="labs-cap">${T.card}</p></div>`
    : b.phones.map(phone).join('')}</div>`;
  const play = '<svg viewBox="0 0 24 24"><path fill="#00d7fe" d="M3.6 2.2c-.3.3-.4.7-.4 1.2v17.2c0 .5.2.9.4 1.2l9.7-9.8z"/><path fill="#ffce00" d="m18.3 15.2-3.9-3.9 3.9-3.9 3.6 2c1 .6 1 1.6 0 2.2z"/><path fill="#ff3a44" d="m14.4 11.3-10.8 10.9c.4.4 1 .4 1.7.1l12.9-7.3z"/><path fill="#00f076" d="M14.4 11.3 18.2 7.4 5.3.2C4.6-.2 4 0 3.6.4z"/></svg>';
  const apple = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.6-1-2.6-4zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"/></svg>';
  root.innerHTML = `
    <div class="scrim"></div>
    ${BOARDS.map(board).join('')}
    ${SCENES.map((s) => { const c = T[s.id]; return `
      <div class="scene ${s.cls || ''}" data-id="${s.id}">
        <p class="kicker">${c.k}</p>
        <h2 class="title"><span class="ln">${words(c.l[0])}</span><span class="ln glow">${words(c.l[1])}</span></h2>
        ${c.chips ? `<ul class="chips">${c.chips.map(([i, x, k]) => `<li class="${k || ''}"><i>${i}</i>${x}</li>`).join('')}</ul>` : ''}
      </div>`; }).join('')}
    <div class="end"><div class="bg"></div>
      <div class="mark"><svg viewBox="18 19 70 70"><path fill="#fff" d="M23,46h22a12,12 0,1 1,0 24h-6a16,16 0,0 1,-16 -16z"/><path class="arc" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" d="M61,44a14,14 0,0 1,0 20"/><path class="arc" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" d="M67,38a22,22 0,0 1,0 32"/><path class="arc" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" d="M73,32a30,30 0,0 1,0 44"/></svg></div>
      <h2>Siflo</h2>
      <p class="tag">${T.end.tag[0]}<br><b>${T.end.tag[1]}</b></p>
      <p class="facts">${T.end.facts}</p>
      <div class="stores">
        <span class="store">${play}<span><small>${T.end.play[0]}</small><b>${T.end.play[1]}</b></span></span>
        <span class="store">${apple}<span><small>${T.end.apple[0]}</small><b>${T.end.apple[1]}</b></span></span>
      </div>
      <p class="watch">${T.end.watch}</p>
      <p class="url">siflo.app</p>
    </div>
    <div class="vignette"></div>
    <div class="flash"></div>
    <div class="dip"></div>`;
  document.body.appendChild(root);

  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const scenes = SCENES.map((s) => ({ ...s, el: $(`.scene[data-id="${s.id}"]`) }));
  const boards = BOARDS.map((b, i) => ({ ...b, el: $$('.board')[i], ph: $$('.phone', $$('.board')[i]), frames: $$('.labs-frames img', $$('.board')[i]) }));
  const arcs = $$('.end .mark .arc');

  function scene(s, t) {
    const vis = t > s.t0 - 0.05 && t < s.t1 + 0.5;
    s.el.style.opacity = vis ? 1 - inOut(ramp(t, s.t1, s.t1 + 0.45)) : 0;
    if (!vis) return;
    s.el.style.filter = `blur(${8 * ramp(t, s.t1, s.t1 + 0.45)}px)`;
    const kick = outExpo(ramp(t, s.t0, s.t0 + 0.7));
    const k = $('.kicker', s.el);
    k.style.opacity = kick;
    k.style.transform = `translateX(${(1 - kick) * -24}px)`;
    $$('.ln', s.el).forEach((ln, li) => $$('.w', ln).forEach((w, wi) => {
      const e = outExpo(ramp(t, s.t0 + 0.12 + li * 0.32 + wi * 0.07, s.t0 + 1.0 + li * 0.32 + wi * 0.07));
      w.style.transform = `translateY(${(1 - e) * 110}%) rotate(${(1 - e) * 4}deg)`;
    }));
    $$('.chips li', s.el).forEach((li, i) => {
      const e = outExpo(ramp(t, s.chipsAt[i], s.chipsAt[i] + 0.6));
      li.style.opacity = e;
      li.style.transform = `translateY(${(1 - e) * 14}px) scale(${0.92 + 0.08 * e})`;
    });
  }

  function boardFrame(b, t) {
    const a = ramp(t, b.t0, b.t0 + 0.3) * (1 - ramp(t, b.t1 - 0.25, b.t1));
    b.el.style.opacity = a;
    if (a <= 0) return;
    const lt = t - b.t0, d = b.t1 - b.t0;
    if (b.labs) {
      const card = $('.labs-card', b.el), e = outExpo(ramp(lt, 0.05, 1.0));
      card.style.transform = `translateY(${(1 - e) * 120 - lt * 4}px) scale(${0.94 + 0.06 * e})`;
      const i = Math.min(LABS_FRAMES - 1, Math.floor(Math.max(0, lt - 0.3) * LABS_FPS));
      b.frames.forEach((im, k) => { im.style.opacity = k === i ? 1 : 0; });
      return;
    }
    b.ph.forEach((el, i) => {
      const p = b.phones[i], e = outExpo(ramp(lt, p.in, p.in + 1.0));
      el.style.transform = `translateY(${(1 - e) * 380 - lt * 5}px) rotate(${(p.rot || 0) * e}deg)`;
      if (p.pan) {
        const img = $('img', el), f = p.pan[0] + (p.pan[1] - p.pan[0]) * inOut(ramp(lt, 0.5, d - 0.3));
        img.style.transform = `translateY(${-f * 100}%)`;
      }
    });
  }

  function frame(t) {
    scenes.forEach((s) => scene(s, t));
    boards.forEach((b) => boardFrame(b, t));
    // A short dip to black on each cut, and a warm flash on the beat right after it.
    let dip = 0, flash = 0;
    for (const c of CUTS) {
      dip = Math.max(dip, 1 - clamp(Math.abs(t - c) / 0.16));
      flash = Math.max(flash, t >= c ? Math.exp(-(t - c) * 7) * 0.5 : 0);
    }
    dip = Math.max(dip, ramp(t, DUR - 0.9, DUR));
    $('.dip').style.opacity = dip;
    $('.flash').style.opacity = flash;
    $('.scrim').style.opacity = t < END ? 1 : 0;

    const end = $('.end');
    const eIn = ramp(t, END, END + 0.6);
    end.style.opacity = eIn;
    if (eIn > 0) {
      const lt = t - END;
      const pop = outExpo(ramp(lt, 0.1, 1.0));
      $('.mark', end).style.transform = `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -12}deg)`;
      arcs.forEach((a, i) => { a.style.opacity = 0.15 + 0.85 * clamp((lt - 0.7 - i * 0.22) / 0.2); });
      [['h2', 1.0], ['.tag', 1.4], ['.facts', 2.0], ['.stores', 2.5], ['.watch', 3.0], ['.url', 3.4]].forEach(([sel, at]) => {
        const e = outExpo(ramp(lt, at, at + 0.8));
        const el = $(sel, end);
        el.style.opacity = e;
        el.style.transform = `translateY(${(1 - e) * 22}px)`;
      });
    }
  }
  window.__film = { frame, CUTS, END };
})();
