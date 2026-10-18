// Act · canyon — hero. A procedural gorge at dusk: the camera glides in from above,
// Julie whistles at the top of a waterfall and the rings tear apart in the roar,
// then the phones of the group relay the signal from one to the next.
import * as THREE from 'three';
import { smooth, clamp01, QUALITY } from '../kit/fx.js';
import { t as tr } from '../kit/i18n.js';
import { fbm2, noise2, createSky, glowMap, Beacon, Rings, Arc, Packets, Schedule, panelPos, ORANGE, OK_GREEN } from '../world/common.js';

const cx = (z) => 4 * Math.sin(z * 0.055) + 1.5 * Math.sin(z * 0.13 + 0.7);
const halfW = (z) => 4.4 + 1.3 * Math.sin(z * 0.09 + 1.2);
const FALL_Z = -10;
const floorY = (z) => (z > FALL_Z ? 5.6 : -0.4);
const H = 30;

const PALETTE = [
  [0.0, '#21180f'], [0.05, '#4a3022'], [0.25, '#7d4c31'], [0.55, '#a7693f'], [0.85, '#cf8b55'], [1.0, '#e2a46b'],
].map(([k, c]) => [k, new THREE.Color(c)]);
const rockColor = (t, out) => {
  for (let i = 1; i < PALETTE.length; i++) {
    if (t <= PALETTE[i][0]) {
      const [k0, c0] = PALETTE[i - 1], [k1, c1] = PALETTE[i];
      return out.copy(c0).lerp(c1, (t - k0) / (k1 - k0));
    }
  }
  return out.copy(PALETTE[PALETTE.length - 1][1]);
};

function buildWalls() {
  const N = QUALITY.tier >= 1.5 ? 240 : 150, M = QUALITY.tier >= 1.5 ? 46 : 30;
  const z0 = 48, z1 = -78;
  const geo = new THREE.BufferGeometry();
  const pos = [], col = [], idx = [];
  const c = new THREE.Color(), plateau = new THREE.Color('#33361f'), plateau2 = new THREE.Color('#5c4a30');
  for (const side of [-1, 1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const z = z0 + (z1 - z0) * (i / N);
      for (let j = 0; j <= M; j++) {
        const v = (j / M) * 1.3;
        let y, o;
        if (v <= 1) {
          y = -1 + v * (H + 1);
          o = halfW(z) + 0.4 + Math.pow(v, 1.9) * 7;
        } else {
          y = H + fbm2(z * 0.05 + side * 9, v * 3) * 1.6;
          o = halfW(z) + 7.4 + Math.pow((v - 1) / 0.3, 1.4) * 40;
        }
        const n = fbm2(z * 0.11 + side * 31, y * 0.09) * 2.2 + noise2(z * 0.5 + side * 7, y * 0.45) * 0.45;
        const ledge = Math.sin(y * 1.5 + n * 1.3) * 0.32;
        if (v <= 1) o += n + ledge;
        pos.push(cx(z) + side * o, y, z);
        if (v <= 1) {
          rockColor(clamp01(y / H + noise2(z * 0.3, y * 0.2) * 0.05), c);
          c.multiplyScalar(0.86 + 0.28 * (0.5 + 0.5 * noise2(z * 0.9 + side * 3, y * 1.7)));
          if (y < floorY(z) + 1.2) c.multiplyScalar(0.55);
        } else {
          c.copy(plateau).lerp(plateau2, 0.5 + 0.5 * noise2(z * 0.2, v * 6 + side));
        }
        col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        const a = base + i * (M + 1) + j, b = a + M + 1;
        if (side < 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
        else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: true }));
}

/** River ribbon between z0 and z1 at the floor height, with a flowing-water shader. */
function buildRiver(z0, z1, y, foamAt) {
  const N = 120, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const z = z0 + (z1 - z0) * (i / N), w = halfW(z) + 0.6;
    pos.push(cx(z) - w, y, z, cx(z) + w, y, z);
    uv.push(0, z, 1, z);
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uFoam: { value: foamAt } }]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec2 vUv; varying vec3 vW;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform float uTime, uFoam; varying vec2 vUv; varying vec3 vW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vec2(vUv.x * 6.0, vUv.y * 0.9 + uTime * 1.6);
        float n = vn(p) * 0.6 + vn(p * 2.3 + 4.0) * 0.4;
        float streak = smoothstep(0.62, 0.9, n);
        float edge = smoothstep(0.42, 0.5, abs(vUv.x - 0.5));
        float foam = exp(-abs(vW.z - uFoam) * 0.35) * smoothstep(0.35, 0.75, vn(p * 1.7 - uTime * 0.5));
        vec3 deep = vec3(0.004, 0.016, 0.022), sky = vec3(0.9, 0.38, 0.16);
        vec3 col = mix(deep, vec3(0.018, 0.05, 0.06), n);
        col += sky * streak * 0.07 + vec3(0.6, 0.65, 0.68) * (foam * 0.5 + edge * 0.05);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

/** The waterfall: a sheet that leaves the ledge and falls along a parabola, with streaks running down. */
function buildFall() {
  const W = 18, Hs = 24, pos = [], uv = [], idx = [];
  const zc = FALL_Z, top = 5.75, w = halfW(zc) - 1.2;
  for (let j = 0; j <= Hs; j++) {
    const v = j / Hs, drop = v * (top + 0.4);
    const zz = zc - 0.35 - Math.sqrt(drop) * 0.75;
    for (let i = 0; i <= W; i++) {
      const u = i / W;
      pos.push(cx(zc) - w + 2 * w * u, top - drop, zz);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < Hs; j++) for (let i = 0; i < W; i++) {
    const a = j * (W + 1) + i, b = a + W + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9, 78.2))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float n = vn(vec2(vUv.x * 9.0, vUv.y * 2.5 - uTime * 3.2)) * 0.65 + vn(vec2(vUv.x * 21.0, vUv.y * 5.0 - uTime * 4.5)) * 0.35;
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        float a = (0.08 + 0.55 * smoothstep(0.5, 0.9, n)) * edge * (0.5 + 0.5 * vUv.y);
        vec3 col = mix(vec3(0.08, 0.14, 0.17), vec3(0.75, 0.74, 0.72), smoothstep(0.55, 0.95, n));
        gl_FragColor = vec4(col, a);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

/** Spray at the foot of the fall: soft additive sprites rising and fading. */
function buildMist(count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) seed[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMap: { value: glowMap() }, uC: { value: new THREE.Vector3(cx(FALL_Z - 1.4), 0, FALL_Z - 1.4) }, uW: { value: halfW(FALL_Z) - 1 }, uPx: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uW, uPx; uniform vec3 uC; varying float vA;
      void main() {
        float k = fract(aSeed * 7.13 + uTime * (0.12 + aSeed * 0.1));
        vec3 p = uC + vec3((aSeed - 0.5) * 2.0 * uW, k * 4.5, (fract(aSeed * 13.7) - 0.5) * 4.0 - k * 2.5);
        vA = sin(k * 3.1416) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * (90.0 + 160.0 * k) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform sampler2D uMap; varying float vA; void main() { float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vec3(0.7, 0.68, 0.66) * a * vA * 0.3, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function person(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.9, 4, 8), new THREE.MeshStandardMaterial({ color: '#1d1714', roughness: 0.8 }));
  body.position.y = 0.75;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  helmet.position.y = 1.55;
  g.add(body, helmet);
  return g;
}

export class CanyonAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);
    this.look = { bloom: 0.75, bloomRadius: 0.55, threshold: 0.85, exposure: 1.05, fade: 1, fadeColor: '#000000', vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.fog = new THREE.FogExp2('#3a2228', 0.0075);
    this.sky = createSky({ sunDir: new THREE.Vector3(-0.35, 0.06, -1) });
    s.add(this.sky);

    s.add(new THREE.HemisphereLight('#ffc29c', '#2a1a22', 1.25));
    const sun = new THREE.DirectionalLight('#ff9554', 3.2);
    sun.position.set(-30, 26, -60);
    s.add(sun);
    const fill = new THREE.DirectionalLight('#7f9ee0', 0.55);
    fill.position.set(25, 10, 30);
    s.add(fill);

    s.add(buildWalls());
    const ledge = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: '#4a3326', roughness: 1 }));
    ledge.rotation.x = -Math.PI / 2;
    ledge.position.set(cx(20), floorY(0) - 0.3, 20);
    const lower = ledge.clone();
    lower.position.set(cx(-45), -0.7, -45);
    lower.scale.y = 1.2;
    const step = new THREE.Mesh(new THREE.PlaneGeometry(40, 7), new THREE.MeshStandardMaterial({ color: '#2e2219', roughness: 1, flatShading: true }));
    step.position.set(cx(FALL_Z), 2.6, FALL_Z - 0.1);
    step.rotation.y = Math.PI;
    s.add(ledge, lower, step);
    this.rivers = [buildRiver(48, FALL_Z + 0.05, floorY(0) + 0.15, 99), buildRiver(FALL_Z - 0.2, -78, -0.25, FALL_Z - 1.5)];
    this.rivers.forEach((r) => s.add(r));
    this.fall = buildFall();
    s.add(this.fall);
    this.mist = buildMist(Math.round(260 * QUALITY.particles + 60));
    s.add(this.mist);

    // The group: Julie at the top of the fall, Marc at the bottom, Léa and Tom further down.
    const spots = {
      lea: new THREE.Vector3(cx(-21) + 2.6, -0.4, -21),
      julie: new THREE.Vector3(cx(-8.6) - 1.4, floorY(0), -8.6),
      marc: new THREE.Vector3(cx(-15.5) + 1.8, -0.4, -15.5),
      tom: new THREE.Vector3(cx(-27) - 1.6, -0.4, -27),
    };
    const helmets = { lea: '#3d8bd4', julie: '#ff6a00', marc: '#e8d046', tom: '#c94a6a' };
    this.beacons = {};
    this.chest = {};
    for (const [k, p] of Object.entries(spots)) {
      const man = person(helmets[k]);
      man.position.copy(p);
      man.rotation.y = Math.atan2(cx(-20) - p.x, -20 - p.z);
      s.add(man);
      const b = new Beacon({ size: 1.1, halo: 2.6 });
      b.position.copy(p).add(new THREE.Vector3(0, 1.15, 0));
      s.add(b);
      this.beacons[k] = b;
      this.chest[k] = b.position.clone();
    }
    // Rope from Julie's anchor down the fall to Marc.
    const ropePts = [
      spots.julie.clone().add(new THREE.Vector3(0.3, 0.9, -0.1)),
      new THREE.Vector3(cx(FALL_Z) - 1.6, floorY(0) + 0.1, FALL_Z - 0.3),
      new THREE.Vector3(cx(FALL_Z) - 1.4, 2.6, FALL_Z - 1.2),
      spots.marc.clone().add(new THREE.Vector3(-0.4, 0.9, 0.3)),
    ];
    const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePts), 40, 0.035, 5), new THREE.MeshStandardMaterial({ color: '#ffd04a', emissive: '#6a4a00', roughness: 0.6 }));
    s.add(rope);

    this.rings = new Rings(10, { billboard: true });
    s.add(this.rings);
    const c = this.chest;
    this.arcs = {
      jm: new Arc(c.julie, c.marc, { lift: 2.2 }),
      ml: new Arc(c.marc, c.lea, { lift: 1.6 }),
      lt: new Arc(c.lea, c.tom, { lift: 1.8 }),
    };
    Object.values(this.arcs).forEach((a) => s.add(a));
    this.packets = new Packets(12);
    s.add(this.packets);
    this.whistle = new Schedule([0, 0.5], 2.4);
    this.relay = new Schedule([0, 0.9, 1.9], 3.6);

    this.lab = {
      whistle: labels.add(tr('label.whistle'), c.julie.clone().add(new THREE.Vector3(0, 0.7, 0)), { side: 'left' }),
      fall: labels.add(tr('label.waterfall'), new THREE.Vector3(cx(FALL_Z) + 1.5, 2.4, FALL_Z - 1.4)),
      julie: labels.add(tr('label.julie'), c.julie.clone().add(new THREE.Vector3(0, 0.5, 0)), { side: 'left' }),
      marc: labels.add(tr('label.relay'), c.marc.clone().add(new THREE.Vector3(0, 0.4, 0))),
    };

    // Camera keys (position, target), held while their card is on screen.
    const K = (z, dx, y, tz, ty, tdx = 0) => [new THREE.Vector3(cx(z) + dx, y, z), new THREE.Vector3(cx(tz) + tdx, ty, tz)];
    // Keys sit on the panel coordinate (0 = hero, 1 = first card, 2 = second card).
    this.keys = [
      { p: -1, k: K(46, 4, 44, -40, 2) },
      { p: 0, k: K(40, 4, 40, -40, 2) },
      { p: 0.5, k: K(18, 1, 20, -14, 3) },
      { p: 1, k: K(3, 1, 11.5, -13, 0.5) },
      { p: 1.5, k: K(-3, 1.5, 22, -14, 0) },
      { p: 2, k: K(1, 2, 37, -15, 0) },
      { p: 3, k: K(4, 2, 42, -16, 0) },
    ];
    this.tmpP = new THREE.Vector3();
    this.tmpT = new THREE.Vector3();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 42;
    this.camera.updateProjectionMatrix();
    this.mist.material.uniforms.uPx.value = h / 900;
  }

  setProgress(p) { this.progress = p; }
  enter() { this.whistle.reset(); this.relay.reset(); }
  leave() { this.labels.hideAll(); this.rings.clear(); this.packets.clear(); }

  cameraAt(p) {
    const ks = this.keys;
    let i = 0;
    while (i < ks.length - 2 && p > ks[i + 1].p) i++;
    const a = ks[i], b = ks[i + 1];
    const f = smooth(a.p, b.p, p);
    this.tmpP.lerpVectors(a.k[0], b.k[0], f);
    this.tmpT.lerpVectors(a.k[1], b.k[1], f);
  }

  update(dt, t) {
    this.t0 ??= performance.now();
    const it = (performance.now() - this.t0) / 1000;
    const p = panelPos(this.progress, this.marks);
    this.look.fade = 1 - smooth(0, 1.6, it);
    this.look.fadeColor = '#0e0b09';

    this.sky.userData.update(t);
    this.rivers.forEach((r) => { r.material.uniforms.uTime.value = t; });
    this.fall.material.uniforms.uTime.value = t;
    this.mist.material.uniforms.uTime.value = t;

    // Camera: keys plus a slow breathing drift; the hero starts a little higher on load.
    this.cameraAt(p);
    this.tmpP.x += Math.sin(t * 0.17) * 0.6;
    this.tmpP.y += Math.sin(t * 0.23) * 0.3 + (1 - smooth(0, 3.5, it)) * 8;
    this.camera.position.copy(this.tmpP);
    this.camera.lookAt(this.tmpT);

    // Phase 1 (problem): Julie whistles, the rings tear apart over the fall.
    const ph1 = smooth(0.55, 0.8, p) * (1 - smooth(1.35, 1.55, p));
    if (ph1 > 0.5) this.whistle.tick(() => {
      this.rings.emit(this.chest.julie, { color: '#ffd9bf', size: 9, dur: 2.2, alpha: 0.55, brokenFrom: 0.2, width: 0.025 });
    });
    // Phase 2 (answer): the signal hops Julie → Léa and Marc, then Marc → Tom; acknowledgements come back.
    const ph2 = smooth(1.4, 1.65, p);
    const A = this.arcs;
    A.jm.show = ph2; A.ml.show = smooth(1.45, 1.7, p); A.lt.show = smooth(1.5, 1.8, p);
    for (const a of Object.values(A)) { a.alpha = 0.35 + 0.25 * ph2; a.tick(t); }
    const B = this.beacons;
    if (ph2 > 0.6) this.relay.tick((i) => {
      if (i === 0) {
        B.julie.flash('#ffffff');
        this.rings.emit(this.chest.julie, { color: ORANGE, size: 3, dur: 0.9, alpha: 1, width: 0.08 });
        this.packets.send(A.jm.curve, { dur: 0.8, onArrive: () => {
          B.marc.flash();
          this.packets.send(A.ml.curve, { dur: 0.6, onArrive: () => { B.lea.flash(); this.packets.send(A.lt.curve, { dur: 0.6, onArrive: () => B.tom.flash() }); } });
        } });
      } else if (i === 2) {
        // Acknowledgements travel back to Julie in green.
        this.packets.send({ getPoint: (k, out) => A.jm.curve.getPoint(1 - k, out) }, { color: OK_GREEN, size: 0.8, dur: 0.8, onArrive: () => B.julie.flash(OK_GREEN) });
      }
    });
    for (const b of Object.values(B)) b.update(this.camera.quaternion);
    this.rings.update(this.camera);
    this.packets.update();

    const L = this.lab, lb = this.labels;
    lb.show(L.whistle, ph1 > 0.5 && p < 1.3);
    lb.show(L.fall, ph1 > 0.5 && p < 1.3);
    lb.show(L.julie, ph2 > 0.6);
    lb.show(L.marc, ph2 > 0.6);
    lb.update(this.camera, innerWidth, innerHeight);
  }
}
