// Film overlay: titles, transitions, feature montage and end card, drawn over the 3D acts.
// render.py injects it in ?capture mode and calls window.__film.frame(t) before each frame,
// so everything is a pure function of the film time t (seconds).
(() => {
  const FR = document.documentElement.lang === 'fr';
  const T = FR ? {
    s1: { k: 'Communication outdoor', l: ['Restez en contact dehors,', 'même hors ligne.'] },
    s2: { k: 'Au fond du canyon', l: ['Le sifflet se perd', 'dans le bruit de l’eau.'] },
    s3: { k: 'Avec Siflo', l: ['Le message passe', 'de téléphone en téléphone.'] },
    s4: { k: 'Les signaux', l: ['STOP d’une touche,', 'pour Marc seulement.'], chips: [['✓', 'Marc · reçu', 'ok'], ['✓✓', 'Marc · vu', 'ok']] },
    s5: { k: 'Sans réseau mobile', l: ['De proche en proche,', 'même en zone blanche.'], chips: [['•', 'Bluetooth'], ['•', 'Internet, si un membre a du réseau'], ['•', 'Messages reçus au retour à portée']] },
    s6: { k: 'SOS', l: ['SOS en deux secondes,', 'reçu par tous à portée.'] },
    s7: { k: 'Et aussi', l: ['Messages, photos, vocaux.', 'Invitation par QR code.'] },
    end: { tag: ['La communication de groupe', 'dehors, même hors ligne.'], facts: 'Gratuite · sans compte · sans publicité', store: 'Disponible sur Google Play · bientôt sur iPhone' },
    screens: ['01-fr-signals', '03-fr-group', '02-fr-home'],
  } : {
    s1: { k: 'Outdoor communication', l: ['Stay in touch outdoors,', 'even offline.'] },
    s2: { k: 'Deep in the canyon', l: ['The whistle gets lost', 'in the roar of the water.'] },
    s3: { k: 'With Siflo', l: ['The message hops', 'from phone to phone.'] },
    s4: { k: 'Signals', l: ['STOP in one tap,', 'sent to Marc only.'], chips: [['✓', 'Marc · received', 'ok'], ['✓✓', 'Marc · seen', 'ok']] },
    s5: { k: 'No signal', l: ['Relayed phone to phone,', 'even with no signal.'], chips: [['•', 'Bluetooth'], ['•', 'Internet, if someone has signal'], ['•', 'Catch up when back in range']] },
    s6: { k: 'SOS', l: ['SOS in two seconds,', 'reaching everyone in range.'] },
    s7: { k: 'And more', l: ['Texts, photos, voice notes.', 'Invite with a QR code.'] },
    end: { tag: ['Group communication', 'outdoors, even offline.'], facts: 'Free · no account · no ads', store: 'Get it on Google Play · coming soon to iPhone' },
    screens: ['03-chat', '04-invite', '01-signals'],
  };
  // Scene timing on the 96 BPM grid of the score (one bar = 2.5 s). chipsAt: when each chip appears.
  const SCENES = [
    { id: 's1', t0: 0.9, t1: 4.8 },
    { id: 's2', t0: 5.5, t1: 9.8 },
    { id: 's3', t0: 10.4, t1: 17.3 },
    { id: 's4', t0: 18.0, t1: 24.8, chipsAt: [22.5, 23.6] },
    { id: 's5', t0: 25.4, t1: 32.3, chipsAt: [26.2, 28.3, 30.9] },
    { id: 's6', t0: 33.0, t1: 37.3, cls: 'sos' },
    { id: 's7', t0: 38.2, t1: 42.3 },
  ];
  const CUTS = [5, 10, 17.5, 25, 32.5, 37.5, 42.5];
  const MONTAGE = [37.5, 42.5];
  const END = 42.5;

  const clamp = (x) => Math.max(0, Math.min(1, x));
  const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const inOut = (x) => x * x * (3 - 2 * x);
  const ramp = (t, a, b) => clamp((t - a) / (b - a));

  const root = document.createElement('div');
  root.id = 'film';
  const words = (s) => s.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
  root.innerHTML = `
    <div class="scrim"></div>
    <div class="montage"><div class="glow"></div>${Array.from({ length: 14 }, (_, i) => `<span class="dot" data-i="${i}"></span>`).join('')}
      ${T.screens.map((f) => `<div class="phone"><img src="assets/screens/${f}.webp" alt=""></div>`).join('')}</div>
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
      <p class="store">${T.end.store}</p>
      <p class="url">siflo.app</p>
    </div>
    <div class="vignette"></div>
    <div class="flash"></div>
    <div class="dip"></div>`;
  document.body.appendChild(root);

  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const scenes = SCENES.map((s) => ({ ...s, el: $(`.scene[data-id="${s.id}"]`) }));
  const dots = $$('.montage .dot').map((el, i) => {
    const r = (k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
    const size = 20 + r(1) * 70;
    Object.assign(el.style, { width: `${size}px`, height: `${size}px`, left: `${r(2) * 100}%`, top: `${r(3) * 100}%` });
    return { el, sp: 6 + r(4) * 14, ph: r(5) * 6 };
  });
  const phones = $$('.montage .phone');
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

  function frame(t) {
    scenes.forEach((s) => scene(s, t));
    // A short dip to black on each cut, and a warm flash on the beat right after it.
    let dip = 0, flash = 0;
    for (const c of CUTS) {
      dip = Math.max(dip, 1 - clamp(Math.abs(t - c) / 0.16));
      flash = Math.max(flash, t >= c ? Math.exp(-(t - c) * 7) * 0.5 : 0);
    }
    dip = Math.max(dip, ramp(t, 47.2, 48));
    $('.dip').style.opacity = dip;
    $('.flash').style.opacity = flash;
    $('.scrim').style.opacity = t < END ? 1 : 0;

    const m = $('.montage');
    const mIn = ramp(t, MONTAGE[0], MONTAGE[0] + 0.25) * (1 - ramp(t, MONTAGE[1] - 0.2, MONTAGE[1]));
    m.style.opacity = mIn;
    if (mIn > 0) {
      const lt = t - MONTAGE[0];
      dots.forEach((d) => { d.el.style.transform = `translateY(${-lt * d.sp}px)`; d.el.style.opacity = 0.35 + 0.25 * Math.sin(lt * 1.3 + d.ph); });
      phones.forEach((ph, i) => {
        const e = outExpo(ramp(lt, 0.15 + i * 0.22, 1.25 + i * 0.22));
        const x = [-0.31, 0, 0.31][i], rot = [-9, 0, 9][i], y = [46, 0, 46][i];
        ph.style.left = `calc(50% - 95px + ${x * 540}px)`;
        ph.style.zIndex = i === 1 ? 2 : 1;
        ph.style.transform = `translateY(${(1 - e) * 420 + y - lt * 7}px) rotate(${rot * e}deg) scale(${i === 1 ? 1.08 : 0.94})`;
      });
    }

    const end = $('.end');
    const eIn = ramp(t, END, END + 0.6);
    end.style.opacity = eIn;
    if (eIn > 0) {
      const lt = t - END;
      const pop = outExpo(ramp(lt, 0.1, 1.0));
      $('.mark', end).style.transform = `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -12}deg)`;
      arcs.forEach((a, i) => { a.style.opacity = 0.15 + 0.85 * clamp((lt - 0.7 - i * 0.22) / 0.2); });
      [['h2', 1.0], ['.tag', 1.4], ['.facts', 2.0], ['.store', 2.4], ['.url', 2.7]].forEach(([sel, at]) => {
        const e = outExpo(ramp(lt, at, at + 0.8));
        const el = $(sel, end);
        el.style.opacity = e;
        el.style.transform = `translateY(${(1 - e) * 22}px)`;
      });
    }
  }
  window.__film = { frame, CUTS, END };
})();
