// The hero's story, shared by the activity scenes (mountain, cave; canyon keeps its own copy):
// Julie whistles and the rings tear apart in the noise (first card; the mountain has a whiteout instead), then her message hops
// Julie → Marc → Léa → Tom and the acknowledgements come back (second card). Each scene builds
// its terrain, places the four members and calls update() with the panel coordinate.
import * as THREE from 'three';
import { smooth } from '../kit/fx.js';
import { t as tr } from '../kit/i18n.js';
import { Beacon, Rings, Arc, Packets, Schedule, SIGNAL, OK_GREEN } from './common.js';

export const HELMETS = { lea: '#3d8bd4', julie: '#ff6a00', marc: '#e8d046', tom: '#c94a6a' };

/** A member: body and helmet; `gear(group)` adds the activity's kit (skis, headlamp…). */
export function person(color, gear) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.9, 4, 8), new THREE.MeshStandardMaterial({ color: '#1d1a19', roughness: 0.8 }));
  body.position.y = 0.75;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  helmet.position.y = 1.55;
  g.add(body, helmet);
  gear?.(g);
  return g;
}

export class Story {
  /**
   * spots: {julie, marc, lea, tom} ground positions; face: point they look towards (or per member);
   * noise: where the noise label sits; lifts: arc heights julie→marc, marc→lea, lea→tom.
   */
  constructor(scene, labels, { spots, face, gear, noise, lifts = [2.2, 1.6, 1.8], ring = '#ffd9bf', ringSize = 9, chestY = 1.15, sides = {}, call = true, callLabel = true }) {
    this.call = call; // false: no whistle rings in the first card (the scene shows its own problem)
    this.callLabel = callLabel; // false: no label on Julie in the first card either
    this.labels = labels;
    this.beacons = {};
    this.chest = {};
    this.members = {};
    for (const [k, p] of Object.entries(spots)) {
      const man = person(HELMETS[k], gear);
      man.position.copy(p);
      const f = face[k] ?? face;
      man.rotation.y = Math.atan2(f.x - p.x, f.z - p.z);
      scene.add(man);
      this.members[k] = man;
      const b = new Beacon({ size: 1.1, halo: 2.6 });
      b.position.copy(p).add(new THREE.Vector3(0, chestY, 0));
      scene.add(b);
      this.beacons[k] = b;
      this.chest[k] = b.position.clone();
    }
    const c = this.chest;
    this.rings = new Rings(10, { billboard: true });
    this.ring = { color: ring, size: ringSize };
    this.arcs = {
      jm: new Arc(c.julie, c.marc, { lift: lifts[0] }),
      ml: new Arc(c.marc, c.lea, { lift: lifts[1] }),
      lt: new Arc(c.lea, c.tom, { lift: lifts[2] }),
    };
    this.packets = new Packets(12);
    scene.add(this.rings, this.packets, ...Object.values(this.arcs));
    this.whistle = new Schedule([0, 0.5], 2.4);
    this.relay = new Schedule([0, 0.9, 1.9], 3.6);
    const up = (v, y) => v.clone().add(new THREE.Vector3(0, y, 0));
    this.lab = {
      whistle: labels.add(tr('label.whistle'), up(c.julie, 0.7), { side: sides.whistle ?? 'left' }),
      noise: labels.add(tr('label.waterfall'), noise, { side: sides.noise }),
      julie: labels.add(tr('label.julie'), up(c.julie, 0.5), { side: sides.julie }),
      marc: labels.add(tr('label.relay'), up(c.marc, 0.4), { side: sides.marc }),
      ahead: labels.add(tr('label.ahead'), up(c.tom, 0.5), { side: sides.ahead }),
    };
  }

  enter() { this.whistle.reset(); this.relay.reset(); }
  leave() { this.labels.hideAll(); this.rings.clear(); this.packets.clear(); }

  update(p, t, camera) {
    // Phase 1 (problem): Julie whistles, the rings tear apart in the noise.
    const ph1 = smooth(0.55, 0.8, p) * (1 - smooth(1.35, 1.55, p));
    if (this.call && ph1 > 0.5) this.whistle.tick(() => {
      this.rings.emit(this.chest.julie, { color: this.ring.color, size: this.ring.size, dur: 2.2, alpha: 0.55, brokenFrom: 0.2, width: 0.025 });
    });
    // Phase 2 (answer): the message hops Julie → Marc → Léa → Tom; acknowledgements come back.
    const ph2 = smooth(1.4, 1.65, p);
    const A = this.arcs, B = this.beacons;
    A.jm.show = ph2; A.ml.show = smooth(1.45, 1.7, p); A.lt.show = smooth(1.5, 1.8, p);
    for (const a of Object.values(A)) { a.alpha = 0.35 + 0.25 * ph2; a.tick(t); }
    if (ph2 > 0.6) this.relay.tick((i) => {
      if (i === 0) {
        B.julie.flash('#ffffff');
        this.rings.emit(this.chest.julie, { color: SIGNAL, size: 3, dur: 0.9, alpha: 1, width: 0.08 });
        this.packets.send(A.jm.curve, { dur: 0.8, onArrive: () => {
          B.marc.flash();
          this.packets.send(A.ml.curve, { dur: 0.6, onArrive: () => { B.lea.flash(); this.packets.send(A.lt.curve, { dur: 0.6, onArrive: () => B.tom.flash() }); } });
        } });
      } else if (i === 2) {
        const back = (a) => ({ getPoint: (k, out) => a.curve.getPoint(1 - k, out) });
        const ack = { color: OK_GREEN, size: 0.8 };
        this.packets.send(back(A.lt), { ...ack, dur: 0.6, onArrive: () => this.packets.send(back(A.ml), { ...ack, dur: 0.6 }) });
        this.packets.send(back(A.jm), { ...ack, dur: 0.8, onArrive: () => B.julie.flash(OK_GREEN) });
      }
    });
    for (const b of Object.values(B)) b.update(camera.quaternion);
    this.rings.update(camera);
    this.packets.update();

    const L = this.lab, lb = this.labels;
    lb.show(L.whistle, this.callLabel && ph1 > 0.5 && p < 1.3);
    lb.show(L.noise, ph1 > 0.5 && p < 1.3);
    lb.show(L.julie, ph2 > 0.6);
    lb.show(L.marc, ph2 > 0.6);
    lb.show(L.ahead, ph2 > 0.6);
    return { ph1, ph2 };
  }
}

/** Camera keys [{p, k: [position, target]}] read at panel coordinate p, eased between keys. */
export function cameraAt(keys, p, outP, outT) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const a = keys[i], b = keys[i + 1];
  const f = smooth(a.p, b.p, p);
  outP.lerpVectors(a.k[0], b.k[0], f);
  outT.lerpVectors(a.k[1], b.k[1], f);
}

/** Wind-blown particles (spindrift, cloud wisps) streaming along `dir` through a box around `center`. */
export function windParticles(count, { center, size, dir = new THREE.Vector3(1, 0, 0), speed = 0.35, color = [0.75, 0.82, 0.9], px = 60, alpha = 0.35 }) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) seed[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uC: { value: center.clone() }, uS: { value: size.clone() }, uDir: { value: dir.clone().normalize() },
      uSpeed: { value: speed }, uCol: { value: new THREE.Vector3(...color) }, uPx: { value: 1 }, uSize: { value: px }, uAlpha: { value: alpha },
    },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uSpeed, uPx, uSize; uniform vec3 uC, uS, uDir; varying float vA;
      void main() {
        float k = fract(aSeed * 5.31 + uTime * uSpeed * (0.6 + aSeed * 0.8));
        vec3 side = normalize(cross(uDir, vec3(0.0, 1.0, 0.0)));
        vec3 p = uC + uDir * (k - 0.5) * uS.x + side * (fract(aSeed * 17.3) - 0.5) * uS.z
          + vec3(0.0, (fract(aSeed * 31.7) - 0.5) * uS.y + sin(k * 9.0 + aSeed * 20.0) * 0.4, 0.0);
        vA = sin(k * 3.1416);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * uSize * (0.4 + fract(aSeed * 7.7)) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uAlpha; varying float vA;
      void main() { vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(uCol * a * vA * uAlpha, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}
