// Encryption in 3D: Julie's group message is signed, padded to a fixed size, encrypted with a key drawn from
// the key of the day, wrapped in its header, carried by phones and the internet relay that cannot open it,
// then opened on Marc's phone. One tile per byte, laid out like the packet of docs/protocol.md
// (paulasquin/siflo): header, then the encrypted content and its 16-byte tag.
// Two cuts of one timeline: `full` (Labs page, eight steps) and `short` (home page, four).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LANG } from './kit/i18n.js';
import { QUALITY, glowTexture, clamp01, lerp, easeInOut } from './kit/fx.js';

const L = (v) => (Array.isArray(v) ? v[LANG === 'fr' ? 0 : 1] : v);
const N = ' ';

const TEXT = {
  msg: [`Corde coincée, attendez-moi`, 'Rope stuck, wait for me'],
  ui: {
    pause: ['Mettre en pause', 'Pause'], play: ['Lire', 'Play'], step: ['Étape', 'Step'],
  },
};

// Steps: name on the rail, then the caption. `short` replaces the caption in the home page's cut.
const CHAPTERS = {
  msg: {
    name: ['Le message', 'The message'],
    h: ['Julie écrit au groupe', 'Julie writes to the group'],
    p: [`Au fond du canyon, sans réseau, Julie écrit «${N}Corde coincée, attendez-moi${N}». C'est son téléphone qui va le protéger, sans passer par un serveur.`,
      'At the bottom of the canyon, with no network, Julie writes “Rope stuck, wait for me”. Her phone protects it by itself, with no server involved.'],
  },
  sig: {
    name: ['Signature', 'Signature'],
    h: ['Signé par Julie', 'Signed by Julie'],
    p: [`Le téléphone de Julie signe le message avec sa clé privée (Ed25519), qui ne quitte jamais l'appareil${N}: personne ne pourra le modifier ni écrire en son nom.`,
      "Julie’s phone signs the message with her private key (Ed25519), which never leaves the device: nobody can change the message or write in her name."],
  },
  pad: {
    name: ['Taille fixe', 'Fixed size'],
    h: ['Complété à taille fixe', 'Padded to a fixed size'],
    p: [`Le message est complété pour atteindre 256, 512, 1${N}024 ou 2${N}048 octets${N}: sa longueur ne trahit pas ce qu'il contient.`,
      'The message is padded to 256, 512, 1,024 or 2,048 bytes: its length does not give away what it says.'],
  },
  key: {
    name: ['Clé du jour', 'Key of the day'],
    h: ['Une clé par jour, une clé par message', 'A key per day, a key per message'],
    p: [`La clé du groupe change chaque jour par une fonction à sens unique${N}: la clé d'aujourd'hui ne permet pas de retrouver celle d'hier, et les clés de plus de deux jours sont effacées. Chaque message en tire sa propre clé.`,
      "The group key changes every day through a one-way function: today’s key cannot bring back yesterday’s, and keys more than two days old are erased. Each message derives its own key from it."],
  },
  enc: {
    name: ['Chiffrement', 'Encryption'],
    h: ['Chiffré', 'Encrypted'],
    p: [`Texte, signature et remplissage sont chiffrés ensemble (ChaCha20-Poly1305). Un sceau de 16 octets révèle la moindre modification en route.`,
      'Text, signature and padding are encrypted together (ChaCha20-Poly1305). A 16-byte authentication tag reveals the slightest change on the way.'],
    short: [`Signé par Julie, complété à taille fixe, puis chiffré avec la clé du groupe, qui change chaque jour. Sans cette clé, on ne voit que des octets d'apparence aléatoire.`,
      "Signed by Julie, padded to a fixed size, then encrypted with the group key, which changes every day. Without that key, it looks like random bytes."],
  },
  hdr: {
    name: ['En-tête', 'Header'],
    h: ["L’enveloppe", 'The envelope'],
    p: [`Seul l'en-tête reste lisible${N}: l'heure, un identifiant d'expéditeur tiré au hasard et une étiquette qui change chaque jour, que seuls les membres du groupe reconnaissent. Rien n'y indique qui écrit, ni à quel groupe.`,
      'Only the header can be read: the time, a sender id drawn at random and a tag that changes every day, which only the members of the group recognise. Nothing in it shows who is writing, or to which group.'],
  },
  hop: {
    name: ['Le trajet', 'The journey'],
    h: ['De proche en proche', 'From phone to phone'],
    p: [`Le message passe par Bluetooth de téléphone en téléphone, puis par internet dès qu'un membre capte le réseau. Le téléphone d'un inconnu et nos relais le transmettent sans pouvoir l'ouvrir.`,
      "The message goes over Bluetooth from phone to phone, then over the internet as soon as a member has signal. A stranger’s phone and our relays pass it on without being able to open it."],
  },
  open: {
    name: ['Lecture', 'Reading'],
    h: ['Ouvert par Marc', 'Opened by Marc'],
    p: [`Le téléphone de Marc reconnaît l'étiquette du jour, retrouve la clé, déchiffre et vérifie la signature${N}: le message vient bien de Julie et n'a pas été modifié.`,
      "Marc’s phone recognises the tag of the day, finds the key, decrypts and checks the signature: the message is indeed from Julie, and unchanged."],
  },
};

// Seconds per step; a third item hides the step (played fast, no caption).
const CUTS = {
  full: [['msg', 4.2], ['sig', 4.2], ['pad', 3.4], ['key', 6], ['enc', 4.4], ['hdr', 5], ['hop', 9], ['open', 6]],
  short: [['msg', 3.6], ['sig', 1, 1], ['pad', 0.9, 1], ['key', 0, 1], ['enc', 4], ['hdr', 1.1, 1], ['hop', 8], ['open', 5.5]],
};

const LABELS = {
  julie: ['Sur le téléphone de Julie', "On Julie’s phone"],
  marc: ['Sur le téléphone de Marc', "On Marc’s phone"],
  text: ['Texte', 'Text'],
  sig: ['Signature · 64 octets', 'Signature · 64 bytes'],
  jkey: ['Clé privée de Julie', "Julie’s private key"],
  pad: ['Remplissage', 'Padding'],
  kprev: ["Clé d’hier", "Yesterday’s key"],
  kday: ['Clé du jour', 'Key of the day'],
  kdf: ['à sens unique', 'one-way'],
  erased: ['effacée après deux jours', 'erased after two days'],
  mid: ['Identifiant du message', 'Message id'],
  kmsg: ['Clé de ce message', 'Key of this message'],
  aead: ['ChaCha20-Poly1305', 'ChaCha20-Poly1305'],
  mac: ['Sceau · 16 octets', 'Auth tag · 16 bytes'],
  h0: ['Type · sauts restants · heure', 'Type · hops left · time'],
  h1: ['Identifiant du message', 'Message id'],
  h2: ["Identifiant d’expéditeur aléatoire", 'Random sender id'],
  h3: ['Étiquette du jour', 'Tag of the day'],
  clear: ['Lisible par tous', 'Readable by anyone'],
  sealed: ['Illisible sans la clé du groupe', 'Unreadable without the group key'],
  n0: ['Julie · sans réseau', 'Julie · no network'],
  n1: ["Téléphone d’un inconnu · relaie sans pouvoir lire", "A stranger’s phone · relays, cannot read"],
  n2: ['Léa · du groupe, capte la 4G', 'Léa · in the group, has 4G'],
  n3: ["Relais internet · ne voit que l’en-tête", 'Internet relay · sees only the header'],
  n4: ['Marc · plus loin, avec du réseau', 'Marc · further away, with signal'],
  bt: ['Bluetooth', 'Bluetooth'],
  net: ['Internet', 'Internet'],
  ttl: ['Sauts restants 12 → 11', 'Hops left 12 → 11'],
  otag: ['Étiquette reconnue', 'Tag recognised'],
  osig: ['Signature de Julie vérifiée ✓', "Julie’s signature verified ✓"],
  omac: ['Sceau intact ✓', 'Auth tag intact ✓'],
};

/* ---------------- bytes ---------------- */

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const hex = (b) => b.toString(16).padStart(2, '0');
const randBytes = (n) => Array.from({ length: n }, () => (rnd() * 256) | 0);

const S = 1.14; // tile pitch
const NB = 256, NM = 16;
const HEADER = [ // [field, bytes]: version, type GROUP_MSG, TTL 12, flags (normal priority, group tag), timestamp, then ids
  ['meta', [1]], ['meta', [2]], ['ttl', [12]], ['meta', [0x12]],
  ['time', (() => { let v = BigInt(Date.UTC(2026, 10, 6, 13, 2)); const b = []; for (let i = 0; i < 8; i++) { b.unshift(Number(v & 255n)); v >>= 8n; } return b; })()],
  ['id', randBytes(16)], ['from', randBytes(8)], ['tag', randBytes(16)],
];
const HROWS = [['meta', 'ttl', 'time'], ['id'], ['from'], ['tag']];

function buildTiles() {
  const msg = [...L(TEXT.msg)];
  const sig = randBytes(64), cipher = randBytes(NB), mac = randBytes(NM);
  const tiles = [];
  const top = (4 + 16 + 1) * S / 2 + 0.95 / 2;
  const hy = (r) => top - S / 2 - r * S;
  const by = (r) => hy(3) - S - 0.5 - r * S;
  const x = (c) => (c - 7.5) * S;
  for (let i = 0; i < NB; i++) {
    const kind = i < msg.length ? 'msg' : i < msg.length + 64 ? 'sig' : 'pad';
    const front = kind === 'msg' ? msg[i] : kind === 'sig' ? hex(sig[i - msg.length]) : hex(i === msg.length + 64 ? 0x80 : 0);
    const r = (i / 16) | 0, c = i % 16;
    tiles.push({ kind, front, back: hex(cipher[i]), pos: new THREE.Vector3(x(c), by(r), 0), row: r, col: c, k: i - (kind === 'sig' ? msg.length : kind === 'pad' ? msg.length + 64 : 0) });
  }
  for (let i = 0; i < NM; i++) tiles.push({ kind: 'mac', front: hex(mac[i]), back: hex(mac[i]), pos: new THREE.Vector3(x(i), by(15) - S - 0.45, 0), row: 16, col: i, k: i });
  let h = 0;
  HROWS.forEach((fields, r) => {
    let c = 0;
    for (const [name, bytes] of HEADER.filter(([n]) => fields.includes(n))) for (const b of bytes) {
      tiles.push({ kind: 'hdr', field: name, front: hex(b), back: hex(b), pos: new THREE.Vector3(x(c++), hy(r), 0), row: r, col: c - 1, k: h++ });
    }
  });
  // Travel shape: a 7×7×7 cube of small tiles, filled from the centre out.
  const cells = [];
  for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) for (let d = 0; d < 7; d++) cells.push(new THREE.Vector3(a - 3, b - 3, d - 3));
  cells.sort((p, q) => p.length() - q.length() || rnd() - 0.5);
  const order = tiles.map((_, i) => i).sort(() => rnd() - 0.5);
  order.forEach((ti, n) => { tiles[ti].cube = cells[n].multiplyScalar(0.42); tiles[ti].jit = rnd(); });
  const msgLen = msg.length;
  return { tiles, msgLen, top, hy, by, x };
}

function glyphAtlas(chars) {
  const cols = Math.ceil(Math.sqrt(chars.length)), cell = Math.floor(2048 / cols);
  const c = document.createElement('canvas');
  c.width = c.height = 2048;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 2048, 2048);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const index = new Map();
  chars.forEach((ch, i) => {
    const cx = i % cols, cy = (i / cols) | 0;
    g.font = `500 ${Math.round(cell * (ch.length > 1 ? 0.46 : 0.6))}px "JetBrains Mono", ui-monospace, monospace`;
    g.fillText(ch, (cx + 0.5) * cell, (cy + 0.54) * cell);
    index.set(ch, i);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  return { tex, index, cols, k: cell / 2048 };
}

/* ---------------- tile material ---------------- */

const tileVert = /* glsl */`
  attribute vec2 aGlyph; attribute vec3 aColF; attribute vec3 aColB; attribute vec3 aState;
  varying vec2 vUv; varying vec3 vN; varying float vFace; varying vec2 vGlyph; varying vec3 vColF; varying vec3 vColB; varying vec3 vState; varying vec3 vView;
  void main() {
    float a = aState.x * 3.14159265;
    mat3 R = mat3(1.0, 0.0, 0.0, 0.0, cos(a), sin(a), 0.0, -sin(a), cos(a));
    vec3 p = R * position;
    vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * (R * normal));
    vFace = normal.z; vUv = uv; vGlyph = aGlyph; vColF = aColF; vColB = aColB; vState = aState;
    vView = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const tileFrag = /* glsl */`
  uniform sampler2D uAtlas; uniform float uCols; uniform float uK;
  varying vec2 vUv; varying vec3 vN; varying float vFace; varying vec2 vGlyph; varying vec3 vColF; varying vec3 vColB; varying vec3 vState; varying vec3 vView;
  void main() {
    bool isF = vFace > 0.5, isB = vFace < -0.5;
    vec3 ink = isB ? vColB : vColF;
    vec3 col;
    if (isF || isB) {
      vec2 uv = isB ? 1.0 - vUv : vUv;
      float gi = isB ? vGlyph.y : vGlyph.x;
      vec2 cell = vec2(mod(gi, uCols), floor(gi / uCols));
      float g = texture2D(uAtlas, vec2((cell.x + uv.x) * uK, 1.0 - (cell.y + 1.0 - uv.y) * uK)).r;
      vec2 e = min(uv, 1.0 - uv);
      float rim = 1.0 - smoothstep(0.0, 0.08, min(e.x, e.y));
      col = vec3(0.010, 0.008, 0.006) + ink * (0.03 + rim * 0.10) + ink * g * (0.55 + vState.y * 1.6);
    } else {
      col = vec3(0.006, 0.005, 0.004) + ink * 0.04;
    }
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 3.0);
    col = col * vState.z + ink * (fres * 0.12 + vState.y * 0.18) * vState.z;
    gl_FragColor = vec4(col, 1.0);
  }`;

/* ---------------- helpers ---------------- */

const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
const COL = {
  msg: C('#ffdbc9'), sig: C('#95d4a9'), pad: C('#8a7b70', 0.7), mac: C('#ff8a3d'),
  meta: C('#9c8d82'), ttl: C('#7fc4e6'), time: C('#ffb37a'), id: C('#d2c4b9'), from: C('#b9a99d'), tag: C('#ff8a3d'),
  cipherA: C('#ff6a00', 0.75), cipherB: C('#ffb37a', 0.6),
};
const ok = C('#95d4a9'), sos = C('#ff5a52');
const easeOutBack = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const span = (t, a, d) => clamp01((t - a) / Math.max(d, 1e-3));
const bump = (x) => Math.sin(Math.PI * clamp01(x));

function arc(a, b, lift) {
  const m = a.clone().lerp(b, 0.5); m.y += lift;
  return new THREE.QuadraticBezierCurve3(a, m, b);
}

function hexToken(color, r = 1.5) {
  const g = new THREE.Group();
  const prism = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.45, 6), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(0.55) }));
  prism.rotation.x = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.12, 0.06, 8, 6), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.6) }));
  ring.rotation.z = Math.PI / 6;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW(), color, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(r * 6);
  g.add(halo, prism, ring);
  g.userData.mats = [prism.material, ring.material, halo.material];
  return g;
}
let glowTex = null;
const GLOW = () => glowTex ??= glowTexture();

function fadeGroup(g, v) {
  g.visible = v > 0.01;
  g.scale.setScalar(Math.max(0.001, v));
}

/* ---------------- the animation ---------------- */

export async function mountCipher(root, { cut = 'full' } = {}) {
  const plan = CUTS[cut];
  let start = 0;
  const steps = plan.map(([id, dur, hidden]) => { const s = { id, dur, hidden: !!hidden, start }; start += dur; return s; });
  const total = start + 1.2;
  const step = Object.fromEntries(steps.map((s) => [s.id, s]));
  const at = (id, f) => step[id].start + step[id].dur * f;
  const len = (id, base, frac) => Math.min(base, step[id].dur * frac);
  const shown = steps.filter((s) => !s.hidden);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('cx', `cx-${cut}`);
  root.innerHTML = `
    <div class="cx-stage"><canvas></canvas><div class="cx-labels" aria-hidden="true"></div></div>
    <div class="cx-ui">
      <ol class="cx-steps">${shown.map((s, i) => `<li><button type="button" data-step="${s.id}"><span class="cx-n">${String(i + 1).padStart(2, '0')}</span><span class="cx-t">${L(CHAPTERS[s.id].name)}</span><i></i></button></li>`).join('')}</ol>
      <div class="cx-cap" aria-live="polite"><h3></h3><p></p></div>
      <button type="button" class="cx-play" aria-label="${L(TEXT.ui.pause)}"><span></span></button>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const canvas = $('canvas'), labelsEl = $('.cx-labels'), stageEl = $('.cx-stage');
  const capH = $('.cx-cap h3'), capP = $('.cx-cap p'), playBtn = $('.cx-play');
  const stepBtns = [...root.querySelectorAll('.cx-steps button')];

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    root.classList.add('cx-flat');
  }

  // Caption and rail work without WebGL too.
  let current = null;
  const setCaption = (id) => {
    if (id === current) return;
    current = id;
    const ch = CHAPTERS[id];
    capH.textContent = L(ch.h);
    capP.textContent = L(cut === 'short' && ch.short ? ch.short : ch.p);
    stepBtns.forEach((b) => b.classList.toggle('on', b.dataset.step === id));
  };
  let t = 0, playing = !reduce, inView = false, jump = true;
  const seek = (id) => {
    const s = step[id];
    t = reduce ? s.start + s.dur * 0.999 : s.start;
    jump = true;
    if (!reduce) setPlaying(true);
  };
  const setPlaying = (p) => {
    playing = p;
    playBtn.classList.toggle('paused', !p);
    playBtn.setAttribute('aria-label', L(p ? TEXT.ui.pause : TEXT.ui.play));
  };
  stepBtns.forEach((b) => b.addEventListener('click', () => seek(b.dataset.step)));
  playBtn.addEventListener('click', () => setPlaying(!playing));
  setPlaying(playing);
  if (reduce) t = shown[0].start + shown[0].dur * 0.999;

  if (!renderer) {
    setCaption(shown[0].id);
    const tick = () => {
      if (playing && inView) { t = (t + 1 / 60) % total; }
      const s = [...shown].reverse().find((x) => x.start <= t) || shown[0];
      setCaption(s.id);
      stepBtns.forEach((b) => b.style.setProperty('--p', b.dataset.step === s.id ? clamp01((t - s.start) / s.dur) : 0));
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(root);
    tick();
    return;
  }

  await document.fonts.load('500 40px "JetBrains Mono"').catch(() => {});
  const { tiles, msgLen, top, hy, by, x } = buildTiles();
  const chars = [...new Set(tiles.flatMap((tl) => [tl.front, tl.back]).concat(['0b']))];
  const atlas = glyphAtlas(chars);

  renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY.tier >= 1.5 ? 2 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  scene.background = C('#0e0b09');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 600);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 0.2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Tiles
  const NT = tiles.length;
  const geo = new THREE.BoxGeometry(0.94, 0.94, 0.2);
  const aGlyph = new Float32Array(NT * 2), aColF = new Float32Array(NT * 3), aColB = new Float32Array(NT * 3), aState = new Float32Array(NT * 3);
  tiles.forEach((tl, i) => {
    aGlyph[i * 2] = atlas.index.get(tl.front);
    aGlyph[i * 2 + 1] = atlas.index.get(tl.back);
    const f = tl.kind === 'hdr' ? COL[tl.field] : COL[tl.kind];
    const b = tl.kind === 'mac' || tl.kind === 'hdr' ? f : COL.cipherA.clone().lerp(COL.cipherB, rnd());
    f.toArray(aColF, i * 3);
    b.toArray(aColB, i * 3);
  });
  geo.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(aGlyph, 2));
  geo.setAttribute('aColF', new THREE.InstancedBufferAttribute(aColF, 3));
  geo.setAttribute('aColB', new THREE.InstancedBufferAttribute(aColB, 3));
  const stateAttr = new THREE.InstancedBufferAttribute(aState, 3);
  stateAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aState', stateAttr);
  const mat = new THREE.ShaderMaterial({
    vertexShader: tileVert, fragmentShader: tileFrag,
    uniforms: { uAtlas: { value: atlas.tex }, uCols: { value: atlas.cols }, uK: { value: atlas.k } },
  });
  const mesh = new THREE.InstancedMesh(geo, mat, NT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const ttlTile = tiles.findIndex((tl) => tl.kind === 'hdr' && tl.field === 'ttl');

  // Keys
  const jKey = hexToken(COL.sig, 1.3);
  const kPrev = hexToken(COL.time, 1.35), kDay = hexToken(COL.mac, 1.5), mId = hexToken(COL.id, 1.1), kMsg = hexToken(COL.msg, 1.3);
  const P = {
    jKey: new THREE.Vector3(-15.5, by(1), 2.5),
    kPrev: new THREE.Vector3(-35, 4, 0), kDay: new THREE.Vector3(-23.5, 4, 0),
    mId: new THREE.Vector3(-35, -4.5, 0), kMsg: new THREE.Vector3(-23.5, -4.5, 0),
  };
  [jKey, kPrev, kDay, mId, kMsg].forEach((g) => scene.add(g));
  kPrev.position.copy(P.kPrev); kDay.position.copy(P.kDay); mId.position.copy(P.mId);
  const line = (pts, color) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.35, transparent: true }));
    l.computeLineDistances();
    scene.add(l);
    return l;
  };
  const keyLines = [
    line([P.kPrev.clone().setX(P.kPrev.x + 2), P.kDay.clone().setX(P.kDay.x - 2)], COL.time),
    line([P.kDay.clone().setY(P.kDay.y - 2), P.kMsg.clone().setY(P.kMsg.y + 2)], COL.mac),
    line([P.mId.clone().setX(P.mId.x + 1.8), P.kMsg.clone().setX(P.kMsg.x - 2)], COL.id),
  ];

  // Journey: Julie, a phone from another group, Léa (4G), the relay, Marc.
  const NODES = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(34, -2, -10), new THREE.Vector3(66, 1, -2), new THREE.Vector3(98, 11, -14), new THREE.Vector3(132, 0, 0)];
  const LEGS = [[0.13, 0.27], [0.33, 0.47], [0.53, 0.67], [0.72, 0.85]];
  const paths = NODES.slice(1).map((b, i) => arc(NODES[i], b, i === 2 ? 4 : 6));
  const devices = NODES.map((p, i) => {
    const g = new THREE.Group();
    if (i === 3) {
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.07, 12, 96), new THREE.MeshBasicMaterial({ color: C('#7fc4e6', 1.2) }));
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.03, 8, 96), new THREE.MeshBasicMaterial({ color: C('#7fc4e6', 0.5) }));
      g.add(r1, r2);
      g.userData.spin = r2;
      g.position.copy(p);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.4, 0.3), new THREE.MeshBasicMaterial({ color: C('#221d19') }));
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 3.75), new THREE.MeshBasicMaterial({ color: i === 1 ? C('#9c8d82', 0.12) : C('#ff6a00', 0.18) }));
      screen.position.z = 0.16;
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: i === 1 ? C('#9c8d82', 0.8) : C('#ff8a3d', 1.1) }));
      g.add(body, screen, edge);
      g.position.copy(p).add(new THREE.Vector3(0, -5, 0));
    }
    scene.add(g);
    return g;
  });
  const links = paths.map((c, i) => {
    const l = line(c.getPoints(48), i < 2 ? C('#ff8a3d', 0.8) : C('#7fc4e6', 0.8));
    l.material.dashSize = 0.6; l.material.gapSize = 0.6;
    return l;
  });
  const probe = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 8, 64), new THREE.MeshBasicMaterial({ color: ok, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(probe);

  // Dust
  const nd = Math.round(700 * QUALITY.particles);
  const dpos = new Float32Array(nd * 3);
  for (let i = 0; i < nd; i++) { dpos[i * 3] = lerp(-60, 170, Math.random()); dpos[i * 3 + 1] = lerp(-25, 30, Math.random()); dpos[i * 3 + 2] = lerp(-50, 12, Math.random()); }
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dpos, 3)),
    new THREE.PointsMaterial({ size: 0.22, map: GLOW(), color: C('#ffb37a', 0.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // Labels
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  const bodyMidY = (r0, r1) => (by(r0) + by(r1)) / 2;
  const sigRow0 = (msgLen / 16) | 0, sigRow1 = ((msgLen + 63) / 16) | 0, padRow = ((msgLen + 64) / 16) | 0;
  const lbl = [];
  const label = (key, pos, vis, cls = '') => {
    const el = document.createElement('span');
    el.className = `cx-l ${cls}`;
    el.textContent = L(LABELS[key]);
    labelsEl.appendChild(el);
    lbl.push({ el, pos, vis });
  };
  const win = (a, b, fin = 0.4, fout = 0.4) => (tt) => Math.min(span(tt, a, fin), 1 - span(tt, b - fout, fout));
  const anchor = new THREE.Vector3();
  const rel = (v) => () => v.clone().add(anchor);
  const end = (id) => step[id].start + step[id].dur;
  const hopAt = (f) => at('hop', f);
  label('julie', rel(V(0, top + 1.1, 0)), win(0, hopAt(0.1)), 'cx-top');
  label('text', rel(V(x(0) - 1.1, by(0), 0)), win(at('msg', 0.15), at('key', 0.1)), 'cx-left');
  label('sig', rel(V(x(15) + 1.1, bodyMidY(sigRow0, sigRow1), 0)), win(at('sig', 0.3), at('key', 0.1)), 'cx-right');
  label('jkey', () => P.jKey.clone().add(V(0, -2.4, 0)), win(at('sig', 0.05), end('sig') + 0.2), 'cx-under');
  label('pad', rel(V(x(15) + 1.1, bodyMidY(padRow + 1, 15), 0)), win(at('pad', 0.3), at('key', 0.1)), 'cx-right');
  if (step.key.dur) {
    label('kprev', () => P.kPrev.clone().add(V(0, 2.5, 0)), win(at('key', 0.05), at('key', 0.6)), 'cx-top');
    label('erased', () => P.kPrev.clone().add(V(0, -2.4, 0)), win(at('key', 0.42), end('key')), 'cx-under cx-warn');
    label('kday', () => P.kDay.clone().add(V(0, 2.5, 0)), win(at('key', 0.2), end('key')), 'cx-top');
    label('kdf', () => P.kPrev.clone().lerp(P.kDay, 0.5).add(V(0, 0.9, 0)), win(at('key', 0.25), at('key', 0.6)), 'cx-top cx-small');
    label('mid', () => P.mId.clone().add(V(0, -2.2, 0)), win(at('key', 0.5), end('key')), 'cx-under');
    label('kmsg', () => P.kMsg.clone().add(V(0, -2.4, 0)), win(at('key', 0.62), at('key', 0.85)), 'cx-under');
  }
  label('aead', rel(V(x(0) - 1.1, bodyMidY(5, 9), 0)), win(at('enc', 0.25), at('hdr', 0.15)), 'cx-left');
  label('mac', rel(V(x(15) + 1.1, by(15) - S - 0.45, 0)), win(at('enc', 0.75), hopAt(0.08)), 'cx-right');
  ['h0', 'h1', 'h2', 'h3'].forEach((k, r) => label(k, rel(V(x(0) - 1.1, hy(r), 0)), win(at('hdr', 0.25 + r * 0.1), hopAt(0.08)), 'cx-left'));
  label('clear', rel(V(x(15) + 1.1, (hy(0) + hy(3)) / 2, 0)), win(at('hdr', 0.65), hopAt(0.08)), 'cx-right cx-hi');
  label('sealed', rel(V(x(15) + 1.1, bodyMidY(0, 2), 0)), win(at('hdr', 0.72), hopAt(0.08)), 'cx-right cx-hi');
  const nodeLabelPos = (i) => () => NODES[i].clone().add(V(0, i === 3 ? -4 : -7.9, 0));
  NODES.forEach((_, i) => label(`n${i}`, nodeLabelPos(i), win(hopAt(i ? LEGS[i - 1][1] - 0.04 : 0.06), hopAt(0.92)), 'cx-under'));
  paths.forEach((c, i) => label(i < 2 ? 'bt' : 'net', () => c.getPoint(0.5).add(V(0, 0.9, 0)), win(hopAt(LEGS[i][0]), hopAt(0.92)), 'cx-top cx-small'));
  label('ttl', () => NODES[1].clone().add(V(0, 3.2, 0)), win(hopAt(0.27), hopAt(0.4)), 'cx-top cx-hi');
  label('marc', rel(V(0, top + 1.1, 0)), win(hopAt(0.9), total), 'cx-top');
  label('otag', rel(V(x(0) - 1.1, hy(3), 0)), win(at('open', 0.05), at('open', 0.45)), 'cx-left cx-ok');
  label('osig', rel(V(x(15) + 1.1, bodyMidY(sigRow0, sigRow1), 0)), win(at('open', 0.7), total), 'cx-right cx-ok');
  label('omac', rel(V(x(15) + 1.1, by(15) - S - 0.45, 0)), win(at('open', 0.55), total), 'cx-right cx-ok');

  // Camera shots: [target, offset] relative to the packet's anchor.
  // [target, direction, world width to show in the full cut, in the short one, height]: the distance follows the canvas shape.
  const SHOTS = {
    msg: [V(0, by(1) - 0.3, 0), V(0, -0.08, 1), 22, 20, 8],
    sig: [V(-5.5, by(3), 0), V(-0.06, -0.03, 1), 34, 34, 14],
    pad: [V(0, -2, 0), V(0.22, -0.07, 1), 32, 32, 25],
    key: [V(-27, 0, 0), V(0.19, 0.06, 1), 33, 33, 15],
    enc: [V(0, -2.3, 0), V(-0.28, 0.1, 1), 32, 23, 25],
    hdr: [V(0, hy(2) - 1.5, 0), V(0.17, 0.07, 1), 37, 37, 18],
    hop: [V(5, 0, 0), V(-0.15, 0.18, 1), 30, 22, 14],
    open: [V(0, 0, 0), V(0, -0.02, 1), 38, 28, 30],
  };
  // On a phone the side labels are hidden, so the shots only need the packet itself.
  const NARROW = { msg: 20, sig: 32, pad: 21, key: 33, enc: 21, hdr: 21, hop: 22, open: 21 };
  const FOV = 2 * Math.tan(THREE.MathUtils.degToRad(17.5));
  let narrow = false;
  const camPos = new THREE.Vector3(0, 0, 60), camTarget = new THREE.Vector3(), goalPos = new THREE.Vector3(), goalTarget = new THREE.Vector3();
  let aspect = 1;

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qId = new THREE.Quaternion(), spinQ = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), yAxis = V(0, 1, 0), xAxis = V(1, 0, 0);
  const tokenFly = new THREE.Vector3();

  function anchorAt(tt) {
    const hs = step.hop.start, hd = step.hop.dur;
    if (tt < hs + hd * LEGS[0][0]) return anchor.copy(NODES[0]);
    for (let i = 0; i < LEGS.length; i++) {
      const [a, b] = LEGS[i];
      if (tt < hs + hd * b) return anchor.copy(paths[i].getPoint(easeInOut(span(tt, hs + hd * a, hd * (b - a)))));
      if (i + 1 < LEGS.length && tt < hs + hd * LEGS[i + 1][0]) return anchor.copy(NODES[i + 1]);
    }
    return anchor.copy(NODES[4]);
  }

  function update(tt, dt) {
    anchorAt(tt);
    const hop = step.hop;
    const travel = span(tt, hop.start + hop.dur * LEGS[0][0], hop.dur * (LEGS[3][1] - LEGS[0][0]));
    spinQ.setFromAxisAngle(yAxis, travel * Math.PI * 2.5).multiply(new THREE.Quaternion().setFromAxisAngle(xAxis, -0.35 * bump(travel * 4)));

    for (let i = 0; i < NT; i++) {
      const tl = tiles[i];
      let show = 1, flip = 0, glow = 0, bright = 1;
      p.copy(tl.pos);
      if (tl.kind === 'msg') {
        const a = span(tt, at('msg', 0.08 + 0.62 * tl.k / msgLen), len('msg', 0.45, 0.2));
        show = easeOutBack(a);
        p.z += (1 - a) * 3;
        glow = bump(a) * 0.8;
      } else if (tl.kind === 'sig') {
        const a = span(tt, at('sig', 0.12 + 0.55 * tl.k / 64), len('sig', 0.8, 0.3));
        const e = easeInOut(a);
        if (a < 1) {
          tokenFly.copy(P.jKey).lerp(tl.pos, e);
          tokenFly.z += Math.sin(Math.PI * e) * 4;
          p.copy(tokenFly);
        }
        show = a > 0 ? 0.35 + 0.65 * e : 0;
        glow = bump(a);
      } else if (tl.kind === 'pad') {
        const n = NB - msgLen - 64;
        const a = span(tt, at('pad', 0.1 + 0.6 * tl.k / n), len('pad', 0.35, 0.2));
        show = easeOutBack(a);
        glow = bump(a) * 0.6;
      } else if (tl.kind === 'mac') {
        const a = span(tt, at('enc', 0.68 + 0.22 * tl.k / NM), len('enc', 0.4, 0.15));
        show = easeOutBack(a);
        glow = bump(a) * 1.4 + bump(span(tt, at('open', 0.5), len('open', 0.8, 0.15))) * 1.2;
        bright = 1 - 0.55 * span(tt, at('open', 0.72), 0.6);
      } else {
        const a = span(tt, at('hdr', 0.05 + 0.45 * tl.k / 52), len('hdr', 0.5, 0.2));
        show = a > 0 ? easeOutBack(a) : 0;
        p.y += (1 - easeInOut(a)) * 6;
        glow = bump(a);
        if (tl.field === 'tag') glow += bump(span(tt, at('open', 0.04), len('open', 1, 0.2))) * 2;
        if (tl.field === 'ttl') glow += bump(span(tt, hopAt(0.27), 0.9)) * 2;
        bright = 1 - 0.5 * span(tt, at('open', 0.55), 0.8);
      }
      if (tl.kind === 'msg' || tl.kind === 'sig' || tl.kind === 'pad') {
        const d = (tl.row + tl.col) / 30;
        const f = span(tt, at('enc', 0.06 + 0.5 * d), len('enc', 0.55, 0.15));
        const u = span(tt, at('open', 0.22 + 0.4 * d), len('open', 0.55, 0.12));
        flip = easeInOut(f) * (1 - easeInOut(u));
        glow += bump(f) * 1.6 + bump(u) * 1.2;
        if (tl.kind === 'sig') glow += bump(span(tt, at('open', 0.66), 1)) * 1.6;
        if (tl.kind === 'pad') bright = 1 - 0.6 * span(tt, at('open', 0.65), 0.8);
      }
      // Packing into a cube for the journey, and unpacking at Marc's.
      const pack = easeInOut(span(tt, hop.start + hop.dur * (0.01 + tl.jit * 0.07), len('hop', 0.8, 0.06)))
        * (1 - easeInOut(span(tt, hop.start + hop.dur * (0.86 + tl.jit * 0.07), len('hop', 0.8, 0.06))));
      if (pack > 0) {
        sc.copy(tl.cube).applyQuaternion(spinQ);
        p.lerp(sc, pack);
        q.copy(qId).slerp(spinQ, pack);
      } else q.copy(qId);
      p.add(anchor);
      sc.setScalar(Math.max(0.0001, show * lerp(1, 0.36, pack)));
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);
      aState[i * 3] = flip; aState[i * 3 + 1] = glow; aState[i * 3 + 2] = bright;
    }
    aGlyph[ttlTile * 2] = aGlyph[ttlTile * 2 + 1] = atlas.index.get(tt > hopAt(0.29) ? '0b' : '0c');
    mesh.geometry.attributes.aGlyph.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
    stateAttr.needsUpdate = true;

    // Keys
    const kv = (a, b) => step.key.dur ? Math.min(span(tt, a, 0.4), 1 - span(tt, b, 0.4)) : 0;
    fadeGroup(jKey, Math.min(span(tt, at('sig', 0), 0.4), 1 - span(tt, end('sig'), 0.4)));
    jKey.position.copy(P.jKey);
    fadeGroup(kPrev, kv(at('key', 0.05), at('key', 0.42)));
    fadeGroup(kDay, kv(at('key', 0.2), end('key')));
    fadeGroup(mId, kv(at('key', 0.5), end('key')));
    const fly = easeInOut(span(tt, at('key', 0.8), len('key', 1.2, 0.2)));
    fadeGroup(kMsg, kv(at('key', 0.62), end('key')) * (1 - 0.7 * fly));
    kMsg.position.copy(P.kMsg).lerp(V(x(0), by(0), 1), fly);
    [kPrev, kDay, mId, kMsg, jKey].forEach((g, i) => { g.rotation.z = Math.sin(tt * 0.8 + i) * 0.12; });
    keyLines[0].material.opacity = kv(at('key', 0.22), at('key', 0.45));
    keyLines[1].material.opacity = kv(at('key', 0.62), end('key'));
    keyLines[2].material.opacity = keyLines[1].material.opacity;
    keyLines.forEach((l) => { l.visible = l.material.opacity > 0.01; });

    // Journey
    const nodeVis = Math.min(span(tt, hopAt(0.04), 0.5), 1 - span(tt, hopAt(0.9), 0.5));
    devices.forEach((g, i) => {
      const v = i === 4 ? Math.min(nodeVis, 1 - span(tt, hopAt(0.86), 0.4)) : nodeVis;
      g.visible = v > 0.01;
      g.scale.setScalar(Math.max(0.001, v));
    });
    devices[3].userData.spin.rotation.y = tt * 0.8;
    links.forEach((l, i) => {
      l.material.opacity = Math.min(span(tt, hopAt(LEGS[i][0] - 0.04), 0.4), 1 - span(tt, hopAt(0.9), 0.5)) * 0.9;
      l.visible = l.material.opacity > 0.01;
    });
    // At each stop, a ring around the packet: green where it opens (Léa, Marc), red where it cannot.
    let pv = 0, pc = ok;
    for (let i = 0; i < 3; i++) {
      const a = hopAt(LEGS[i][1]), b = hopAt(LEGS[i + 1][0]);
      const v = bump(span(tt, a, b - a));
      if (v > pv) { pv = v; pc = i === 1 ? ok : sos; }
    }
    const pm = bump(span(tt, hopAt(LEGS[3][1]), len('hop', 1, 0.1)));
    if (pm > pv) { pv = pm; pc = ok; }
    probe.visible = pv > 0.01;
    probe.material.color.copy(pc).multiplyScalar(1.5);
    probe.material.opacity = pv;
    probe.position.copy(anchor);
    probe.scale.setScalar(0.6 + 0.6 * pv);
    probe.lookAt(camera.position);

    // Camera: the shot of the last visible step, eased; a narrow canvas steps back.
    const s = [...steps].reverse().find((x) => x.start <= tt && !x.hidden) || steps[0];
    const [tg, dir, wFull, wShort, hh] = SHOTS[s.id];
    const dist = Math.max(hh / FOV, (narrow ? NARROW[s.id] : cut === 'short' ? wShort : wFull) / (FOV * aspect));
    goalTarget.copy(tg).add(anchor);
    goalPos.copy(dir).normalize().multiplyScalar(dist).add(goalTarget);
    const k = dt < 0 ? 1 : 1 - Math.exp(-dt * (s.id === 'hop' ? 3.2 : 1.9));
    camTarget.lerp(goalTarget, k);
    camPos.lerp(goalPos, k);
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    dust.rotation.y = Math.sin(tt * 0.05) * 0.02;

    // Labels
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    for (const l of lbl) {
      const v = l.vis(tt);
      if (v < 0.02) { l.el.style.opacity = 0; continue; }
      p.copy(l.pos()).project(camera);
      if (p.z > 1) { l.el.style.opacity = 0; continue; }
      l.el.style.opacity = v.toFixed(3);
      l.el.style.transform = `translate(${((p.x + 1) / 2 * w).toFixed(1)}px, ${((1 - p.y) / 2 * h).toFixed(1)}px)`;
    }

    setCaption(s.id);
    stepBtns.forEach((b) => {
      const st = step[b.dataset.step];
      b.style.setProperty('--p', st === s ? clamp01((tt - st.start) / st.dur).toFixed(3) : tt > st.start ? 1 : 0);
    });
  }

  function resize() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (!w || !h) return;
    aspect = w / h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    narrow = w < 560;
    root.classList.toggle('cx-narrow', narrow);
  }
  new ResizeObserver(resize).observe(stageEl);
  resize();

  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!inView || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (playing) {
      t += dt;
      if (t >= total) {
        t = 0;
        stageEl.classList.add('cx-cut');
        setTimeout(() => stageEl.classList.remove('cx-cut'), 60);
        jump = true;
      }
    }
    update(t, jump ? -1 : dt);
    jump = false;
    composer.render();
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: '80px' }).observe(root);
  if (location.search.includes('debug')) window.__cipher = { seek: (v) => { t = v; jump = true; }, play: setPlaying, steps, scene, camera, keys: { jKey, kPrev, kDay, mId, kMsg } };
  update(t, -1);
  composer.render();
  requestAnimationFrame(frame);
}
