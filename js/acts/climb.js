// Act · climb (mountain identity only) — a multi-pitch route on a granite face at blue hour.
// Léa has pulled over an overhang and clipped into the anchor; Tom, belaying below, can no longer
// see her, the wind carries the calls away and the next rope team shouts its own (first card).
// Then her « Vaché » signal reaches Tom's phone alone, the acknowledgement comes back, and the
// next rope team's phones stay dark (second card).
import * as THREE from 'three';
import { smooth, QUALITY } from '../kit/fx.js';
import { t as tr } from '../kit/i18n.js';
import { theme } from '../activity.js';
import { fbm2, noise2, createSky, Beacon, Rings, Arc, Packets, Schedule, panelPos, OK_GREEN } from '../world/common.js';
import { person, cameraAt, windParticles } from '../world/story.js';

const LIP = 34; // height of the overhang's lip
/** Depth of the face (towards +z) at (x, y): slabs, cracks, and the overhang that hides Léa from Tom. */
const face = (x, y) => -5 * fbm2(x * 0.06 + 2, y * 0.05) - 1.6 * Math.abs(noise2(x * 0.3, y * 0.14)) - 0.5 * noise2(x * 0.9, y * 0.7)
  + 3.6 * Math.exp(-((y - LIP) ** 2) / 5) * smooth(-24, -8, x) * (1 - smooth(14, 26, x)) - 0.04 * Math.abs(x) ** 1.4 * 0.2;

function buildFace() {
  const sx = QUALITY.tier >= 1.5 ? 170 : 110, sy = QUALITY.tier >= 1.5 ? 190 : 120;
  let geo = new THREE.PlaneGeometry(120, 110, sx, sy);
  geo.translate(0, 34, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, face(p.getX(i), p.getY(i)));
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  const q = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(q.count * 3);
  const g1 = new THREE.Color('#4a5262'), g2 = new THREE.Color('#6b7383'), snow = new THREE.Color('#d6e3f3'), c = new THREE.Color();
  for (let i = 0; i < q.count; i += 3) {
    const x = (q.getX(i) + q.getX(i + 1) + q.getX(i + 2)) / 3, y = (q.getY(i) + q.getY(i + 1) + q.getY(i + 2)) / 3;
    c.copy(g1).lerp(g2, 0.5 + 0.5 * noise2(x * 0.18, y * 0.22));
    if (n.getY(i) > 0.82 + 0.08 * noise2(x, y)) c.copy(snow).multiplyScalar(0.9 + 0.1 * noise2(x * 3, y * 3));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true, side: THREE.DoubleSide }));
}

/** The sea of clouds far below, drifting. */
function buildClouds() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec3 vW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vW.xz * 0.02 + vec2(uTime * 0.01, 0.0);
        float n = vn(p) * 0.5 + vn(p * 2.1) * 0.3 + vn(p * 4.3) * 0.2;
        float edge = smoothstep(260.0, 120.0, length(vW.xz));
        vec3 col = mix(vec3(0.05, 0.08, 0.14), vec3(0.22, 0.3, 0.42), smoothstep(0.35, 0.8, n));
        gl_FragColor = vec4(col, edge * smoothstep(0.25, 0.55, n));
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(560, 560), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -18;
  return m;
}

export class ClimbAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 900);
    this.look = { bloom: 0.4, bloomRadius: 0.45, threshold: 0.97, exposure: 0.95, fade: 0, fadeColor: theme().bg, vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.fog = new THREE.FogExp2('#1a2a44', 0.006);
    this.sky = createSky({ zenith: '#040917', mid: '#1b2f52', horizon: '#7a9ccc', sunDir: new THREE.Vector3(0.6, 0.02, 1), stars: 0.8 });
    s.add(this.sky);
    s.add(new THREE.HemisphereLight('#a9c6ff', '#1a2233', 1.0));
    const key = new THREE.DirectionalLight('#dbe7ff', 1.8);
    key.position.set(70, 30, 25);
    const rim = new THREE.DirectionalLight('#7fa0e8', 0.5);
    rim.position.set(-50, 20, -20);
    s.add(key, rim, buildFace());
    this.clouds = buildClouds();
    s.add(this.clouds);

    const on = (x, y, out = 0.45) => new THREE.Vector3(x, y, face(x, y) + out);
    const P = {
      lea: on(3, LIP + 5.5), tom: on(-1, LIP - 9),
      n1: on(-15, LIP - 2), n2: on(-16.5, LIP - 11),
    };
    // Climbers stand against the face, looking at it; the anchors are ledges of snow-dusted rock.
    const ledge = (v) => {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#59616f', flatShading: true }));
      m.scale.set(1.5, 0.35, 1.0);
      m.position.copy(v).add(new THREE.Vector3(0, -0.2, 0.1));
      s.add(m);
    };
    const helmets = { lea: '#3d8bd4', tom: '#c94a6a', n1: '#9aa3ad', n2: '#9aa3ad' };
    this.beacons = {};
    this.chest = {};
    for (const [k, v] of Object.entries(P)) {
      ledge(v);
      const man = person(helmets[k]);
      man.scale.setScalar(0.9);
      man.position.copy(v);
      man.rotation.y = Math.PI;
      s.add(man);
      const b = new Beacon({ size: 1, halo: 2.4, color: k.startsWith('n') ? '#7b8696' : undefined });
      b.position.copy(v).add(new THREE.Vector3(0, 1.0, 0.25));
      s.add(b);
      this.beacons[k] = b;
      this.chest[k] = b.position.clone();
    }
    // Ropes: Léa's runs from Tom over the lip; the next team's runs between them.
    const rope = (pts, color) => s.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.05, 5), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15, roughness: 0.6 })));
    rope([P.tom.clone().add(new THREE.Vector3(0.2, 0.8, 0.2)), on(0, LIP - 4, 0.3), on(1, LIP, 3.9), on(2, LIP + 2.5, 0.3), P.lea.clone().add(new THREE.Vector3(-0.2, 0.8, 0.2))], '#ffd04a');
    rope([P.n2.clone().add(new THREE.Vector3(0.2, 0.8, 0.2)), on(-15.8, LIP - 6, 0.3), P.n1.clone().add(new THREE.Vector3(0, 0.8, 0.2))], '#c45ad8');

    this.wind = windParticles(Math.round(300 * QUALITY.particles + 60), {
      center: new THREE.Vector3(-4, LIP, 6), size: new THREE.Vector3(60, 22, 10), dir: new THREE.Vector3(1, 0.08, 0.1), speed: 0.4, color: [0.5, 0.6, 0.78], px: 16, alpha: 0.5,
    });
    s.add(this.wind);

    const c = this.chest;
    this.rings = new Rings(10, { billboard: true });
    this.arc = new Arc(c.lea, c.tom, { lift: 0.4 });
    this.packets = new Packets(8);
    s.add(this.rings, this.arc, this.packets);
    this.calls = new Schedule([0, 0.9, 1.6], 2.6);
    this.send = new Schedule([0, 1.4], 3.4);

    const up = (v, y) => v.clone().add(new THREE.Vector3(0, y, 0));
    this.lab = {
      lea: labels.add(tr('label.lea'), up(c.lea, 0.7)),
      tom: labels.add(tr('label.tom'), up(c.tom, 0.6)),
      next: labels.add(tr('label.next'), up(c.n1, 0.6), { side: 'left' }),
      wind: labels.add(tr('label.wind'), new THREE.Vector3(12, LIP - 3, 5)),
      safe: labels.add(tr('label.safe'), up(c.lea, 0.7)),
      tomok: labels.add(tr('label.tomok'), up(c.tom, 0.6), { warm: true }),
      nothing: labels.add(tr('label.nothing'), up(c.n1, 0.6)),
    };

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    this.keys = [
      { p: -1, k: [V(48, LIP + 12, 60), V(-4, LIP - 2, 0)] },
      { p: 0, k: [V(36, LIP + 6, 36), V(3, LIP - 2, 0)] },
      { p: 1, k: [V(24, LIP + 8, 46), V(-14, LIP - 3, 0)] },
      { p: 2, k: [V(28, LIP + 12, 58), V(-14, LIP - 3, 0)] },
    ];
    this.tmpP = new THREE.Vector3();
    this.tmpT = new THREE.Vector3();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 40;
    this.portrait = w < h;
    this.camera.updateProjectionMatrix();
    this.wind.material.uniforms.uPx.value = h / 900;
  }

  setProgress(p) { this.progress = p; }
  enter() { this.calls.reset(); this.send.reset(); }
  leave() { this.labels.hideAll(); this.rings.clear(); this.packets.clear(); }

  update(dt, t) {
    const p = panelPos(this.progress, this.marks);
    this.sky.userData.update(t);
    this.wind.material.uniforms.uTime.value = t;
    this.clouds.material.uniforms.uTime.value = t;

    cameraAt(this.keys, p, this.tmpP, this.tmpT);
    // Portrait: the cards cover the lower half, so step back and keep the climbers in the upper half.
    if (this.portrait) { this.tmpP.sub(this.tmpT).multiplyScalar(1.6).add(this.tmpT); this.tmpT.y -= 20; }
    this.tmpP.x += Math.sin(t * 0.17) * 0.5;
    this.tmpP.y += Math.sin(t * 0.23) * 0.25;
    this.camera.position.copy(this.tmpP);
    this.camera.lookAt(this.tmpT);

    // First card: calls from Léa and from the next rope team tear apart in the wind.
    const ph1 = smooth(-0.6, -0.1, p) * (1 - smooth(0.45, 0.65, p));
    const B = this.beacons, C = this.chest;
    if (ph1 > 0.5) this.calls.tick((i) => {
      const from = i === 1 ? C.n1 : i === 2 ? C.n2 : C.lea;
      this.rings.emit(from, { color: i ? '#b9c3cf' : '#dbeaff', size: 7, dur: 2, alpha: 0.5, brokenFrom: 0.15, width: 0.025 });
    });
    // Second card: « Vaché » reaches Tom alone, the acknowledgement comes back; the next team stays dark.
    const ph2 = smooth(0.6, 0.9, p);
    this.arc.show = ph2;
    this.arc.alpha = 0.6 * ph2;
    this.arc.tick(t);
    if (ph2 > 0.6) this.send.tick((i) => {
      if (i === 0) {
        B.lea.flash('#ffffff');
        this.packets.send(this.arc.curve, { dur: 0.7, onArrive: () => B.tom.flash() });
      } else {
        this.packets.send({ getPoint: (k, out) => this.arc.curve.getPoint(1 - k, out) }, { color: OK_GREEN, size: 0.8, dur: 0.7, onArrive: () => B.lea.flash(OK_GREEN) });
      }
    });
    for (const b of Object.values(B)) b.update(this.camera.quaternion);
    this.rings.update(this.camera);
    this.packets.update();

    const L = this.lab, lb = this.labels;
    lb.show(L.lea, ph1 > 0.5);
    lb.show(L.tom, ph1 > 0.5);
    lb.show(L.next, ph1 > 0.5);
    lb.show(L.wind, ph1 > 0.5);
    lb.show(L.safe, ph2 > 0.6);
    lb.show(L.tomok, ph2 > 0.6);
    lb.show(L.nothing, ph2 > 0.6);
    lb.update(this.camera, innerWidth, innerHeight);
  }
}
