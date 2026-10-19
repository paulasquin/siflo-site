// Act · mesh — a contour map of the gorge. Signals hop from phone to phone over
// Bluetooth, a member on the ridge bridges a distant subgroup through the blind
// relay, a member who fell behind upstream gets the stored message back in range,
// then an SOS reaches every Siflo phone around, even from another group.
import * as THREE from 'three';
import { smooth, clamp01, frameOpposite, QUALITY } from '../kit/fx.js';
import { t as tr } from '../kit/i18n.js';
import { fbm2, glowSprite, Beacon, Rings, Arc, Packets, Schedule, panelPos, ORANGE, OK_GREEN, SOS_RED } from '../world/common.js';

const rx = (z) => 6 * Math.sin(z * 0.07) + 2 * Math.sin(z * 0.17 + 0.4);
const R = 7.5; // drawn radio range
const height = (x, z) => {
  const d = Math.abs(x - rx(z));
  return 3 + 7 * fbm2(x * 0.035 + 3, z * 0.035) + Math.min(d, 14) * 0.45 - 6 * Math.exp(-(d * d) / 10);
};
const GREY = new THREE.Color('#b9a99c');
const AMBER = new THREE.Color('#ffc46a');

function buildTerrain() {
  const seg = QUALITY.tier >= 1.5 ? 200 : 130;
  const geo = new THREE.PlaneGeometry(110, 120, seg, seg);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -8);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    uniforms: { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3() } },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uFocus; varying vec3 vW; varying vec3 vN;
      float line(float v, float w) { float d = abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4); return 1.0 - min(d / w, 1.0); }
      void main() {
        vec3 n = normalize(vN);
        float dif = clamp(dot(n, normalize(vec3(-0.5, 0.8, 0.3))), 0.0, 1.0);
        vec3 base = mix(vec3(0.004, 0.003, 0.0025), vec3(0.03, 0.019, 0.012), dif);
        float minor = line(vW.y / 0.8, 1.0);
        float major = line(vW.y / 4.0, 1.4);
        float dist = length(vW.xz - uFocus.xz);
        float near = 0.35 + 0.65 * exp(-dist * dist / 900.0);
        vec3 col = base + vec3(1.0, 0.45, 0.18) * (minor * 0.028 + major * 0.1) * near;
        float edge = smoothstep(62.0, 40.0, length(vW.xz - vec2(0.0, -8.0)));
        gl_FragColor = vec4(col * edge, 1.0);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

function buildRiver() {
  const pts = [];
  for (let z = 44; z >= -60; z -= 1) pts.push(new THREE.Vector3(rx(z), height(rx(z), z) + 0.15, z));
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.22, 5);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fa8cc'), toneMapped: false, transparent: true, opacity: 0.7 }));
}

/** Soft disc showing a phone's radio range. */
function rangeDisc(color) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uA: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uA; varying vec2 vUv;
      void main() { float r = length(vUv); float a = (smoothstep(1.0, 0.985, r) * smoothstep(0.95, 0.99, r) * 0.8 + (1.0 - r) * 0.08) * step(r, 1.0); gl_FragColor = vec4(uColor * a * uA, 1.0); }`,
  });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(2 * R, 2 * R), m);
  d.rotation.x = -Math.PI / 2;
  d.renderOrder = 2;
  return d;
}

export class MeshAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    this.look = { bloom: 0.8, bloomRadius: 0.5, threshold: 0.8, exposure: 1, fade: 0, fadeColor: '#0e0b09', vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.background = new THREE.Color('#0b0907');
    this.terrain = buildTerrain();
    s.add(this.terrain, buildRiver());

    const at = (x, z, lift = 0.9) => new THREE.Vector3(x, height(x, z) + lift, z);
    const P = {
      a0: at(rx(20), 20), a1: at(rx(13) + 0.6, 13), a2: at(rx(6) - 0.5, 6), a3: at(rx(-1) + 5.5, -1),
      b0: at(rx(-24) - 5.5, -24), b1: at(rx(-30), -30), b2: at(rx(-36) + 0.4, -36),
      s1: at(rx(-31) + 7.5, -32), s2: at(rx(-41) - 6, -42),
    };
    this.lateFrom = at(rx(36) + 0.5, 36);
    this.lateTo = at(rx(26) - 0.4, 26);
    this.P = P;
    this.nodes = {};
    this.discs = {};
    const add = (k, pos, color = ORANGE) => {
      const b = new Beacon({ color, size: 1.1, halo: 2.6 });
      b.position.copy(pos);
      s.add(b);
      this.nodes[k] = b;
      const d = rangeDisc(color);
      d.position.copy(pos);
      s.add(d);
      this.discs[k] = d;
    };
    for (const k of ['a0', 'a1', 'a2', 'a3', 'b0', 'b1', 'b2']) add(k, P[k]);
    add('s1', P.s1, GREY); add('s2', P.s2, GREY);
    add('late', this.lateFrom);

    this.relayPos = new THREE.Vector3(16, 26, -10);
    this.relay = new THREE.Group();
    const oct = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#95d4a9').multiplyScalar(1.4), wireframe: true, toneMapped: false }));
    this.relay.add(oct, glowSprite(OK_GREEN, 5, 0.35));
    this.relay.position.copy(this.relayPos);
    this.relayOct = oct;
    s.add(this.relay);

    const arc = (a, b, o = {}) => { const x = new Arc(a, b, { lift: 1.6, ...o }); s.add(x); return x; };
    this.arcs = {
      a01: arc(P.a0, P.a1), a12: arc(P.a1, P.a2), a23: arc(P.a2, P.a3, { color: AMBER, dashed: true }),
      b01: arc(P.b0, P.b1), b12: arc(P.b1, P.b2),
      up: arc(P.a3, this.relayPos, { lift: 3, color: OK_GREEN, dashed: true }),
      down: arc(this.relayPos, P.b0, { lift: 3, color: OK_GREEN, dashed: true }),
      late: arc(P.a0, this.lateTo, { lift: 1.2 }),
    };
    this.rings = new Rings(10);
    s.add(this.rings);
    this.packets = new Packets(14);
    s.add(this.packets);
    this.loopA = new Schedule([0, 0.7, 1.4], 3.4);
    this.loopB = new Schedule([0, 1.0, 2.0, 2.7], 4.2);
    this.loopL = new Schedule([0], 2.2);
    this.loopS = new Schedule([0], 1.6);

    const mid = (a, b, y = 2) => a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, y, 0));
    this.lab = {
      bt: labels.add(tr('label.bt'), mid(P.a0, P.a1)),
      wifi: labels.add(tr('label.wifi'), mid(P.a2, P.a3), { side: 'left' }),
      g4: labels.add(tr('label.4g'), P.a3.clone().add(new THREE.Vector3(0, 1.2, 0)), { warm: true }),
      relay: labels.add(tr('label.relaysrv'), this.relayPos.clone().add(new THREE.Vector3(0, 1.6, 0)), { warm: true }),
      far: labels.add(tr('label.far'), P.b1.clone().add(new THREE.Vector3(0, 1.2, 0))),
      behind: labels.add(tr('label.behind'), this.lateFrom.clone().add(new THREE.Vector3(0, 1.2, 0))),
      late: labels.add(tr('label.late'), this.lateTo.clone().add(new THREE.Vector3(0, 1.2, 0))),
      sos: labels.add(tr('label.sos'), P.b2.clone().add(new THREE.Vector3(0, 1.2, 0)), { side: 'left' }),
      stranger: labels.add(tr('label.stranger'), P.s1.clone().add(new THREE.Vector3(0, 1.2, 0))),
    };

    const K = (tx, tz, dist, yaw, pitch) => ({ t: new THREE.Vector3(tx, 2, tz), dist, yaw, pitch });
    this.keys = [
      K(rx(11) + 2, 9, 50, 0.5, 0.95),
      K(4, -6, 88, 0.15, 1.12),
      K(rx(24) + 1, 22, 44, 0.75, 0.92),
      K(rx(-33) + 2, -33, 50, 0.3, 0.98),
    ];
    this.cam = { t: new THREE.Vector3(), dist: 0, yaw: 0, pitch: 0 };
    this.v = new THREE.Vector3();
  }

  resize(w, h) {
    this.w_ = w; this.h_ = h;
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 58 : 40;
    this.camera.updateProjectionMatrix();
  }

  setProgress(p) { this.progress = p; }
  enter() { [this.loopA, this.loopB, this.loopL, this.loopS].forEach((l) => l.reset()); }
  leave() { this.labels.hideAll(); this.rings.clear(); this.packets.clear(); }

  update(dt, t) {
    const p = panelPos(this.progress, this.marks);
    this.terrain.material.uniforms.uTime.value = t;

    // Camera between keys, with a slow orbit.
    const ks = this.keys, c = this.cam;
    const i = Math.max(0, Math.min(ks.length - 2, Math.floor(p)));
    const f = smooth(0.15, 0.85, p - i);
    const a = ks[i], b = ks[i + 1];
    c.t.lerpVectors(a.t, b.t, f);
    c.dist = a.dist + (b.dist - a.dist) * f;
    c.yaw = a.yaw + (b.yaw - a.yaw) * f + Math.sin(t * 0.08) * 0.08;
    c.pitch = a.pitch + (b.pitch - a.pitch) * f;
    this.camera.position.set(
      c.t.x + Math.sin(c.yaw) * Math.cos(c.pitch) * c.dist,
      c.t.y + Math.sin(c.pitch) * c.dist,
      c.t.z + Math.cos(c.yaw) * Math.cos(c.pitch) * c.dist,
    );
    this.camera.lookAt(c.t);
    frameOpposite(this.camera, clamp01((p + 0.5) / 4), [1, -1, 1, -1], this.w_, this.h_, 0.1);
    this.terrain.material.uniforms.uFocus.value.copy(c.t);

    const N = this.nodes, A = this.arcs, P = this.P;
    // Phase weights on the panel coordinate.
    const w1 = smooth(-0.6, -0.1, p);
    const w2 = smooth(0.45, 0.85, p);
    const w3 = smooth(1.45, 1.85, p);
    const w4 = smooth(2.45, 2.85, p);

    for (const k of ['a01', 'a12', 'a23']) A[k].show = w1;
    const bridge = w2 * (1 - smooth(2.2, 2.6, p));
    A.up.show = bridge; A.down.show = bridge; A.b01.show = w2; A.b12.show = w2;
    const lu = smooth(1.5, 2.05, p);
    N.late.position.lerpVectors(this.lateFrom, this.lateTo, lu);
    this.discs.late.position.copy(N.late.position);
    const lateIn = lu > 0.9;
    A.late.show = lateIn ? 1 : 0;
    for (const x of Object.values(A)) x.tick(t);
    for (const k of ['a0', 'a1', 'a2', 'a3']) this.discs[k].material.uniforms.uA.value = 0.3 * w1;
    for (const k of ['b0', 'b1', 'b2']) this.discs[k].material.uniforms.uA.value = 0.3 * w2;
    this.discs.late.material.uniforms.uA.value = 0.3 * smooth(1.2, 1.6, p);
    for (const k of ['s1', 's2']) this.discs[k].material.uniforms.uA.value = 0.22 * w4;
    this.relay.visible = bridge > 0.02;
    this.relay.scale.setScalar(Math.max(0.001, bridge));
    this.relayOct.rotation.y = t * 0.6;
    this.relayOct.rotation.x = t * 0.3;

    // 1 · Bluetooth hops through group A (keeps running underneath the later phases).
    if (p < 1.5) this.loopA.tick((s) => {
      if (s === 0) { N.a0.flash('#ffffff'); this.rings.emit(P.a0, { size: 3, dur: 0.9 }); this.packets.send(A.a01.curve, { dur: 0.6, onArrive: () => N.a1.flash() }); }
      if (s === 1) this.packets.send(A.a12.curve, { dur: 0.6, onArrive: () => N.a2.flash() });
      if (s === 2) this.packets.send(A.a23.curve, { color: AMBER, dur: 0.6, onArrive: () => N.a3.flash() });
    });
    // 2 · The ridge member's 4G bridges the far subgroup through the relay.
    if (p > 0.6 && p < 2.4) this.loopB.tick((s) => {
      if (s === 0) { N.a3.flash(OK_GREEN); this.packets.send(A.up.curve, { color: OK_GREEN, dur: 0.95 }); }
      if (s === 1) this.packets.send(A.down.curve, { color: OK_GREEN, dur: 0.95, onArrive: () => N.b0.flash() });
      if (s === 2) this.packets.send(A.b01.curve, { dur: 0.6, onArrive: () => N.b1.flash() });
      if (s === 3) this.packets.send(A.b12.curve, { dur: 0.6, onArrive: () => N.b2.flash() });
    });
    // 3 · Back in range: the stored message reaches the member who fell behind.
    if (lateIn && p < 2.6) this.loopL.tick(() => this.packets.send(A.late.curve, { dur: 0.7, onArrive: () => { N.late.flash('#ffffff'); this.rings.emit(N.late.position, { size: 3.5, dur: 0.9 }); } }));
    // 4 · SOS: red rings from Marc's phone, every phone in range flashes, other group included.
    const sos = w4 > 0.5;
    if (sos) this.loopS.tick(() => {
      this.rings.emit(P.b2, { color: SOS_RED, size: 2.4 * R, dur: 1.5, width: 0.025 });
      N.b2.flash(SOS_RED);
      for (const k of ['b0', 'b1', 's1', 's2']) setTimeout(() => N[k].flash(SOS_RED), 250 + N[k].position.distanceTo(P.b2) * 40);
    });
    N.b2.setColor(sos ? SOS_RED : ORANGE);
    for (const n of Object.values(N)) n.update(this.camera.quaternion);
    this.rings.update(this.camera);
    this.packets.update();

    const L = this.lab, lb = this.labels;
    lb.show(L.bt, w1 > 0.5 && p < 0.5);
    lb.show(L.wifi, w1 > 0.5 && p < 0.5);
    lb.show(L.g4, w2 > 0.5 && p < 1.5);
    lb.show(L.relay, w2 > 0.5 && p < 1.5);
    lb.show(L.far, w2 > 0.5 && p < 1.4);
    lb.show(L.behind, p > 1.2 && lu < 0.5);
    lb.show(L.late, lateIn && p < 2.5);
    lb.show(L.sos, sos);
    lb.show(L.stranger, sos);
    lb.update(this.camera, innerWidth, innerHeight);
  }
}
