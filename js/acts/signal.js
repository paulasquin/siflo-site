// Act · signal — Julie's phone sends STOP, Marc's phone rings full screen and
// vibrates, then the acknowledgements come back member by member. The screens are
// canvases redrawn from the app's dark theme (Theme.kt) in the page language.
import * as THREE from 'three';
import { smooth, clamp01, frameOpposite, studioEnvironment, QUALITY } from '../kit/fx.js';
import { t as tr } from '../kit/i18n.js';
import { glowMap, glowSprite, Rings, Packets, Schedule, panelPos, arcCurve, ORANGE, OK_GREEN } from '../world/common.js';

const SW = 600, SH = 1304; // screen canvas, same ratio as the 0.92 × 2.0 screen
const SCREEN_W = 0.92, SCREEN_H = 2.0;
const C = {
  bg: '#16130f', ink: '#efe9e4', muted: '#a99f97', primary: '#ff8a3d', onPrimary: '#3a1400',
  chip: '#52443c', card: '#2d2722', sos: '#e5413b', ok: '#95d4a9', line: '#3a322c',
};
const F = (w, s) => `${w} ${s}px Inter, system-ui, sans-serif`;

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

const BTN = [[40, 400], [314, 400], [40, 624], [314, 624]]; // top-left of the 4 buttons, 246 × 204
const BW = 246, BHt = 204;

function drawSignals(g, { press = 0, sent = false, acks = 0 }) {
  g.fillStyle = C.bg; g.fillRect(0, 0, SW, SH);
  g.fillStyle = C.ink; g.textBaseline = 'alphabetic';
  // status bar
  g.font = F(500, 24); g.fillText('14:02', 40, 56);
  // header
  g.strokeStyle = C.ink; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(66, 150); g.lineTo(44, 128); g.lineTo(66, 106); g.moveTo(44, 128); g.lineTo(84, 128); g.stroke();
  g.font = F(500, 38); g.fillText(tr('phone.group'), 112, 128);
  g.font = F(400, 22); g.fillStyle = C.muted; g.fillText(tr('phone.members'), 112, 166);
  // tabs
  g.font = F(600, 26); g.textAlign = 'center';
  g.fillStyle = C.primary; g.fillText(tr('phone.tab1'), SW * 0.25, 248);
  g.fillStyle = C.muted; g.fillText(tr('phone.tab2'), SW * 0.75, 248);
  g.fillStyle = C.line; g.fillRect(0, 274, SW, 2);
  g.fillStyle = C.primary; g.fillRect(0, 270, SW / 2, 6);
  // chip
  g.textAlign = 'left';
  roundRect(g, 40, 310, 210, 58, 14); g.fillStyle = C.chip; g.fill();
  g.fillStyle = C.ink; g.font = F(500, 24); g.fillText(tr('phone.all'), 62, 348);
  // buttons
  const labels = ['phone.stop', 'phone.ok', 'phone.release', 'phone.pull'];
  BTN.forEach(([x, y], i) => {
    const k = i === 0 ? press : 0;
    g.save();
    const cxp = x + BW / 2, cyp = y + BHt / 2;
    g.translate(cxp, cyp); g.scale(1 - 0.05 * k, 1 - 0.05 * k); g.translate(-cxp, -cyp);
    if (k > 0) { g.shadowColor = 'rgba(255,170,90,.9)'; g.shadowBlur = 50 * k; }
    roundRect(g, x, y, BW, BHt, 40);
    g.fillStyle = k > 0 ? `rgb(255,${Math.round(138 + 70 * k)},${Math.round(61 + 110 * k)})` : C.primary;
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = C.onPrimary;
    for (let d = 0; d <= i; d++) { g.beginPath(); g.arc(cxp + (d - i / 2) * 26, y + 54, 7, 0, Math.PI * 2); g.fill(); }
    g.textAlign = 'center';
    const lines = tr(labels[i]).split('\n');
    g.font = F(700, lines.length > 1 ? 32 : 40);
    lines.forEach((l, j) => g.fillText(l, cxp, y + (lines.length > 1 ? 118 + j * 38 : 132)));
    g.restore();
  });
  g.textAlign = 'left';
  if (!sent) {
    roundRect(g, 40, 870, SW - 80, 112, 56); g.fillStyle = C.sos; g.fill();
    g.fillStyle = '#fff'; g.font = F(700, 34); g.textAlign = 'center'; g.fillText(tr('phone.sos'), SW / 2, 938);
    g.textAlign = 'left';
    return;
  }
  // status card with acknowledgements
  roundRect(g, 40, 860, SW - 80, 400, 28); g.fillStyle = C.card; g.fill();
  g.fillStyle = C.ink; g.font = F(600, 26); g.fillText(`STOP · ${tr('phone.sent')}`, 70, 912);
  g.fillStyle = C.muted; g.font = F(500, 19); g.fillText(tr('phone.members.h'), 70, 962);
  const rows = [['J', tr('phone.you'), '#ff8a3d', null], ['M', 'Marc', '#e8d046', acks >= 1], ['L', 'Léa', '#3d8bd4', acks >= 2], ['T', 'Tom', '#c94a6a', false]];
  rows.forEach(([ini, name, col, ok], i) => {
    const y = 1010 + i * 62;
    g.beginPath(); g.arc(92, y - 8, 22, 0, Math.PI * 2); g.fillStyle = col; g.fill();
    g.fillStyle = '#1d0a00'; g.font = F(700, 20); g.textAlign = 'center'; g.fillText(ini, 92, y);
    g.textAlign = 'left'; g.fillStyle = C.ink; g.font = F(500, 25); g.fillText(name, 132, y);
    if (ok === null) return;
    g.textAlign = 'right';
    if (ok) { g.fillStyle = C.ok; g.font = F(600, 23); g.fillText(`✓ ${tr('phone.received')}`, SW - 70, y); }
    else { g.fillStyle = C.muted; g.font = F(400, 22); g.fillText(tr('phone.waiting'), SW - 70, y); }
    g.textAlign = 'left';
  });
}

function drawAlert(g, k) {
  if (k <= 0) {
    const grd = g.createLinearGradient(0, 0, 0, SH);
    grd.addColorStop(0, '#1a1410'); grd.addColorStop(1, '#070504');
    g.fillStyle = grd; g.fillRect(0, 0, SW, SH);
    g.fillStyle = C.ink; g.textAlign = 'center';
    g.font = F(300, 132); g.fillText('14:02', SW / 2, 330);
    g.font = F(400, 26); g.fillStyle = C.muted; g.fillText(tr('phone.group'), SW / 2, 384);
    g.textAlign = 'left';
    return;
  }
  g.fillStyle = '#ff6a00'; g.fillRect(0, 0, SW, SH);
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.beginPath(); g.arc(SW / 2, SH * 0.42, 260 + 40 * k, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.beginPath(); g.arc(SW / 2, 470, 12, 0, Math.PI * 2); g.fill();
  g.font = F(800, 150); g.fillText('STOP', SW / 2, 640);
  g.font = F(500, 40); g.fillText(tr('phone.from'), SW / 2, 716);
  g.fillRect(SW / 2 - 90, 736, 180, 4);
  g.font = F(400, 26); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(`${tr('phone.group')} · 14:02`, SW / 2, 1180);
  g.textAlign = 'left';
}

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function makePhone() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedShape(1.0, 2.1, 0.15), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 12 }),
    new THREE.MeshStandardMaterial({ color: '#2a221d', metalness: 0.75, roughness: 0.32 }),
  );
  body.geometry.translate(0, 0, -0.055);
  g.add(body);
  const sg = new THREE.ShapeGeometry(roundedShape(SCREEN_W, SCREEN_H, 0.11), 12);
  const p = sg.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / SCREEN_W + 0.5; uv[i * 2 + 1] = p.getY(i) / SCREEN_H + 0.5; }
  sg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const canvas = document.createElement('canvas');
  canvas.width = SW; canvas.height = SH;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.04;
  g.add(screen);
  g.userData = { ctx: canvas.getContext('2d'), tex, key: '' };
  return g;
}

/** Canvas pixel → local point on the phone's screen. */
const screenPoint = (px, py, z = 0.05) => new THREE.Vector3((px / SW - 0.5) * SCREEN_W, (0.5 - py / SH) * SCREEN_H, z);

function bokeh(count) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count);
  const pal = ['#ff6a00', '#ff9a5a', '#ffd2a8', '#4d7f9a', '#7fc4e6'].map((c) => new THREE.Color(c));
  for (let i = 0; i < count; i++) {
    pos.set([(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, -3 - Math.random() * 7], i * 3);
    const c = pal[(Math.random() * pal.length) | 0];
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = 0.4 + Math.random() * 1.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uMap: { value: glowMap() }, uPx: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSize; uniform float uTime, uPx; varying vec3 vC; varying float vA;
      void main() {
        vC = color;
        vec3 p = position + vec3(sin(uTime * 0.15 + position.y) * 0.3, sin(uTime * 0.2 + position.x * 0.5) * 0.2, 0.0);
        vA = 0.16 + 0.1 * sin(uTime * 0.6 + position.x * 3.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * aSize * 260.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform sampler2D uMap; varying vec3 vC; varying float vA; void main() { float a = texture2D(uMap, gl_PointCoord).a; a = smoothstep(0.05, 0.5, a); gl_FragColor = vec4(vC * a * vA, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

export class SignalAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.look = { bloom: 0.38, bloomRadius: 0.5, threshold: 0.92, exposure: 1, fade: 0, fadeColor: '#0e0b09', vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.background = new THREE.Color('#110c09');
    this.bokeh = bokeh(Math.round(90 * Math.max(0.5, QUALITY.particles)));
    s.add(this.bokeh);
    const key = new THREE.DirectionalLight('#ffd9bd', 2.2);
    key.position.set(-3, 4, 5);
    const rim = new THREE.DirectionalLight('#ff7a2e', 2.6);
    rim.position.set(4, 1, -3);
    s.add(key, rim, new THREE.AmbientLight('#3a2a22', 0.6));

    this.a = makePhone();
    this.b = makePhone();
    s.add(this.a, this.b);
    this.glowA = glowSprite(ORANGE, 4.2, 0.12);
    this.glowA.position.z = -0.3;
    this.a.add(this.glowA);
    this.glowB = glowSprite(ORANGE, 5, 0);
    this.glowB.position.z = -0.3;
    this.b.add(this.glowB);
    this.finger = glowSprite(new THREE.Color('#fff1e4'), 0.5, 0);
    this.a.add(this.finger);
    this.stopPt = screenPoint(BTN[0][0] + BW / 2, BTN[0][1] + BHt / 2, 0.06);

    this.rings = new Rings(10);
    this.waves = new Rings(8, { billboard: true });
    s.add(this.rings, this.waves);
    this.packets = new Packets(8);
    s.add(this.packets);
    this.ripple = new Schedule([0], 1.3);
    this.buzz = new Schedule([0], 1.6);
    this.send = new Schedule([0], 1.6);
    this.acks = 0;

    this.lab = {
      press: labels.add(tr('label.press'), this.stopPt.clone(), { object: this.a, side: 'left' }),
      vibrate: labels.add(tr('label.vibrate'), new THREE.Vector3(0.5, 0.7, 0.05), { object: this.b }),
      acks: labels.add(tr('label.acks'), screenPoint(SW - 60, 1060, 0.06), { object: this.a, warm: true }),
    };
    this.v = new THREE.Vector3();
    this.w = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  init(renderer) {
    this.scene.environment = studioEnvironment(renderer);
    this.scene.environmentIntensity = 0.5;
  }

  resize(w, h) {
    this.w_ = w; this.h_ = h;
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 50 : 30;
    this.camera.updateProjectionMatrix();
    this.bokeh.material.uniforms.uPx.value = h / 900;
  }

  setProgress(p) { this.progress = p; }
  enter() { this.ripple.reset(); this.buzz.reset(); this.send.reset(); }
  leave() { this.labels.hideAll(); this.rings.clear(); this.waves.clear(); this.packets.clear(); }

  redraw(phone, key, fn) {
    if (phone.userData.key === key) return;
    phone.userData.key = key;
    fn(phone.userData.ctx);
    phone.userData.tex.needsUpdate = true;
  }

  update(dt, t) {
    const p = panelPos(this.progress, this.marks);
    const portrait = this.w_ < this.h_;
    this.bokeh.material.uniforms.uTime.value = t;

    // Phone A comes in turning, phone B slides in for the second card, A comes back for the third.
    const inA = smooth(-0.9, -0.1, p);
    const inB = smooth(0.35, 0.9, p);
    const focusA = smooth(1.3, 1.8, p);
    const gap = portrait ? 0.6 : 0.82;
    this.a.position.set(-gap * inB * (1 - focusA * 0.35) - (1 - inA) * 1.5, Math.sin(t * 0.7) * 0.03, focusA * 0.15);
    this.a.rotation.set(-0.08 + Math.sin(t * 0.5) * 0.02, 0.85 * (1 - inA) + 0.18 - 0.12 * inB + 0.1 * focusA, 0.02);
    this.b.position.set(gap * inB + (1 - inB) * 3.4 + focusA * 0.5, 0.05 + Math.sin(t * 0.8 + 1) * 0.03, -0.25 - focusA * 0.6);
    this.b.rotation.set(-0.06, -0.22 - (1 - inB) * 0.6, -0.02);

    // Press STOP (scroll-driven), then the alert on B.
    const press = smooth(-0.15, 0.05, p) * (1 - smooth(0.25, 0.45, p));
    const sent = p > 0.2;
    const alert = smooth(0.75, 0.9, p);
    const acks = p > 1.95 ? 2 : p > 1.65 ? 1 : 0;
    this.redraw(this.a, `${Math.round(press * 8)}|${sent}|${acks}`, (g) => drawSignals(g, { press, sent, acks }));
    this.redraw(this.b, `${Math.round(alert * 6)}`, (g) => drawAlert(g, alert));

    this.finger.position.copy(this.stopPt).add(this.v.set(0.18 * (1 - press), -0.22 * (1 - press), 0.08 * (1 - press)));
    this.finger.material.opacity = smooth(-0.4, -0.1, p) * (1 - smooth(0.25, 0.5, p)) * 0.9;
    this.glowA.material.opacity = 0.12 + press * 0.4;
    this.glowB.material.opacity = alert * (0.35 + 0.15 * Math.sin(t * 6));

    this.a.updateMatrixWorld();
    this.b.updateMatrixWorld();
    const normalA = this.w.set(0, 0, 1).transformDirection(this.a.matrixWorld).clone();
    if (p > -0.05 && p < 0.7) this.ripple.tick(() => {
      const at = this.a.localToWorld(this.stopPt.clone());
      this.rings.emit(at, { color: ORANGE, size: 1.6, dur: 1.2, normal: normalA, width: 0.05 });
    });
    // The signal travels A → B until B shows it.
    const bScreen = this.b.localToWorld(screenPoint(SW / 2, SH * 0.45, 0.06));
    const aStop = this.a.localToWorld(this.stopPt.clone());
    if (p > 0.45 && p < 0.95) this.send.tick(() => {
      this.packets.send(arcCurve(aStop, bScreen, 0.5), { dur: 0.7, size: 0.5 });
    });
    // Vibration: one pulse (STOP = one blast), whistle waves around B.
    let jitter = 0;
    if (alert > 0.5 && p < 1.5) {
      this.buzz.tick(() => this.waves.emit(this.b.localToWorld(this.v.set(0, 0.9, 0.05)), { color: '#ffd2b0', size: 1.8, dur: 1.2, alpha: 0.4, width: 0.03 }));
      const local = ((performance.now() - this.buzz.start) / 1000) % 1.6;
      if (local < 0.38) jitter = Math.sin(t * 95) * 0.014;
    }
    this.b.position.x += jitter;
    this.b.rotation.z += jitter * 1.5;
    // Acknowledgements fly back to A in green.
    if (acks > this.acks) {
      const aCard = this.a.localToWorld(screenPoint(SW - 110, acks === 1 ? 1072 : 1134, 0.06));
      const from = acks === 1 ? bScreen : this.v.set(3.5, 1.2, -1);
      this.packets.send(arcCurve(from, aCard, 0.6), { color: OK_GREEN, size: 0.45, dur: 0.6 });
    }
    this.acks = acks;
    this.rings.update(this.camera);
    this.waves.update(this.camera);
    this.packets.update();

    // Camera: gentle push-in, framed opposite the cards (left, right, left).
    this.camera.position.set(Math.sin(t * 0.2) * 0.08, 0.05 + Math.sin(t * 0.27) * 0.04, (portrait ? 6.2 : 5.4) - focusA * 0.2 - inB * 0.1);
    this.camera.lookAt(this.target.set(focusA * -0.3, 0, 0));
    frameOpposite(this.camera, clamp01((p + 0.5) / 3), [-1, 1, -1], this.w_, this.h_, 0.16);

    const L = this.lab, lb = this.labels;
    lb.show(L.press, p > -0.3 && p < 0.35);
    lb.show(L.vibrate, alert > 0.5 && p < 1.4);
    lb.show(L.acks, acks > 0);
    lb.update(this.camera, innerWidth, innerHeight);
  }
}
