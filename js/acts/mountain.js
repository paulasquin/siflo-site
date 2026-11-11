// Act · hero for the mountain (ski touring, mountaineering, climbing, ice) — a slope at blue hour
// under the moon, a granite ridge, a frozen waterfall on a cliff band and the blue mouth of an ice
// cave at the foot of a glacier. Julie, at the top of the couloir, feels the snow crack as a whiteout
// swallows the slope (no whistle, no shouting on skis); then her message (one at a time) hops down to
// Léa and Tom, further down and out of sight, and the acknowledgements come back.
import * as THREE from 'three';
import { smooth, QUALITY } from '../kit/fx.js';
import { t as tr } from '../kit/i18n.js';
import { theme } from '../activity.js';
import { fbm2, noise2, createSky, glowSprite, panelPos } from '../world/common.js';
import { Story, cameraAt, windParticles } from '../world/story.js';

const gx = (z) => 3 * Math.sin(z * 0.06) - 2;
const ridged = (x, z) => 1 - Math.abs(noise2(x, z));
function height(x, z) {
  const rise = smooth(6, -50, z);
  let h = 1 + 26 * Math.pow(rise, 1.5) + Math.abs(x - gx(z)) * 0.22 * rise;
  h += fbm2(x * 0.045 + 7, z * 0.045) * (1.2 + 4 * rise) + Math.max(0, Math.abs(x - gx(z)) - 18) * 0.35 * rise;
  const d = x - gx(z);
  h -= 2.4 * Math.exp(-(d * d) / 14) * smooth(-4, -30, z);
  // A granite ridge between the couloir and the frozen waterfall, jagged at the crest.
  const r = x - (12 - 0.06 * z);
  h += (3 + 4 * ridged(z * 0.15, 4.2) + 1.5 * noise2(z * 0.6, x * 0.6)) * Math.exp(-(r * r) / 26) * smooth(2, -24, z) * (1 - smooth(-50, -62, z));
  // The range behind: sharp summits fading into the dusk.
  const far = smooth(-62, -125, z);
  h += far * (14 + 34 * ridged(x * 0.022 + 3, 1.7) * (0.6 + 0.4 * ridged(x * 0.06, z * 0.05)));
  return h;
}

function buildSlope() {
  const seg = QUALITY.tier >= 1.5 ? 230 : 150;
  let geo = new THREE.PlaneGeometry(300, 250, seg, seg);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -70);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
  // One colour per facet: snow on the gentle faces, granite on the steep ones, crisp like cut paper.
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  const q = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(q.count * 3);
  const snow = new THREE.Color('#d6e3f3'), shade = new THREE.Color('#a9bdd6'), rock = new THREE.Color('#2f3746'), rock2 = new THREE.Color('#454e5f'), c = new THREE.Color();
  for (let i = 0; i < q.count; i += 3) {
    const x = (q.getX(i) + q.getX(i + 1) + q.getX(i + 2)) / 3, z = (q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)) / 3;
    const ny = n.getY(i) + noise2(x * 0.35, z * 0.35) * 0.05;
    if (ny < 0.6) c.copy(rock).lerp(rock2, 0.5 + 0.5 * noise2(x * 1.7, z * 1.7));
    else c.copy(shade).lerp(snow, 0.6 + 0.4 * noise2(x * 2.3 + 5, z * 2.3));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true }));
}

/** Ice: deep blue inside, pale at grazing angles, with vertical streaks; `glow` lights it from within. */
function iceMaterial(glow = 0) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uGlow: { value: glow }, uTime: { value: 0 } }]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vN; varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform float uGlow, uTime; varying vec3 vN; varying vec3 vW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
        float fr = pow(1.0 - abs(dot(n, v)), 2.2);
        float st = vn(vec2(vW.x * 3.0 + vW.z * 3.0, vW.y * 0.35)) * 0.6 + vn(vec2(vW.x * 9.0, vW.y * 1.2)) * 0.4;
        vec3 deep = vec3(0.004, 0.03, 0.07), pale = vec3(0.16, 0.34, 0.48);
        vec3 col = mix(deep, pale, clamp(fr * 0.9 + st * 0.35, 0.0, 1.0));
        col += vec3(0.015, 0.12, 0.2) * uGlow * (0.75 + 0.25 * sin(uTime * 0.8 + vW.y));
        col += vec3(0.12, 0.15, 0.18) * max(n.y, 0.0) * 0.6;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

/** A cliff band with a frozen waterfall: hanging columns of ice, thick at the top, thin at the foot. */
function buildIcefall(x0, z0) {
  const g = new THREE.Group();
  const base = height(x0, z0);
  const wallGeo = new THREE.IcosahedronGeometry(1, 4);
  const wp = wallGeo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < wp.count; i++) {
    v.fromBufferAttribute(wp, i);
    v.multiplyScalar(1 + 0.35 * fbm2(v.x * 2.4 + 3, v.y * 2.4 + v.z) + 0.08 * noise2(v.x * 7, v.y * 7 - v.z * 3));
    wp.setXYZ(i, v.x, v.y, v.z);
  }
  wallGeo.computeVertexNormals();
  const wall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: '#2b3341', roughness: 0.95, flatShading: true }));
  wall.scale.set(17, 13, 6);
  wall.position.set(x0, base, z0 - 4.5);
  g.add(wall);
  const mat = iceMaterial(0.4);
  const cols = [[-1.6, 1.3, 12.5], [0, 1.8, 14], [1.4, 1.1, 11], [2.7, 0.8, 9], [-3, 0.7, 8], [-0.8, 0.6, 6], [3.8, 0.5, 6.5]];
  for (const [dx, r, h] of cols) {
    const geo = new THREE.CylinderGeometry(r, r * 0.35, h, 9, 12);
    const cp = geo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const y = cp.getY(i), k = 1 + 0.28 * noise2(cp.getX(i) * 2 + dx, y * 0.9);
      cp.setX(i, cp.getX(i) * k); cp.setZ(i, cp.getZ(i) * k);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x0 + dx, base + 12.5 - h / 2, z0 + 1.4 - Math.abs(dx) * 0.3);
    g.add(m);
  }
  g.userData.mat = mat;
  g.userData.label = new THREE.Vector3(x0 + 4.5, base + 8, z0 + 1.5);
  return g;
}

/**
 * The front of a glacier: a wall of blue ice sunk into the slope, cut by the arch of an ice cave
 * whose tunnel glows from within.
 */
function buildIceCave(x0, z0) {
  const g = new THREE.Group();
  const base = height(x0, z0);
  const W = 9, Hh = 7, AW = 2.6, AH = 3.6, D = 8;
  const outer = new THREE.Shape();
  outer.moveTo(-W, -2);
  for (let i = 0; i <= 12; i++) {
    const x = -W + (2 * W * i) / 12;
    outer.lineTo(x, Hh * (0.5 + 0.5 * Math.sin((i / 12) * Math.PI)) + 0.8 * noise2(i * 2.3, 3.1) + (i % 3 === 1 ? 0.6 : 0));
  }
  outer.lineTo(W, -2);
  outer.lineTo(-W, -2);
  const arch = new THREE.Path();
  arch.moveTo(-AW, -2);
  arch.lineTo(-AW, 0.8);
  arch.absellipse(0, 0.8, AW, AH - 0.8, Math.PI, 0, true);
  arch.lineTo(AW, -2);
  arch.lineTo(-AW, -2);
  outer.holes.push(arch);
  let geo = new THREE.ExtrudeGeometry(outer, { depth: D, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 2, curveSegments: 18, steps: 4 });
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const inTunnel = Math.abs(x) < AW + 0.6 && y < AH + 0.6;
    const k = inTunnel ? 0.15 : 0.55;
    p.setXYZ(i, x + k * noise2(y * 0.6 + 2, z * 0.6), y + k * noise2(x * 0.5, z * 0.5 + 4), z + k * 1.4 * noise2(x * 0.4 + 9, y * 0.4));
  }
  geo.computeVertexNormals();
  const mat = iceMaterial(0.2);
  const front = new THREE.Mesh(geo, mat);
  front.position.set(x0, base - 0.3, z0 - D);
  front.rotation.y = 0.18;
  g.add(front);
  // The back of the tunnel: a cold glow fading into the dark.
  const mouthMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv;
      void main() {
        float r = length(vec2(vUv.x, vUv.y * 0.75 + 0.25));
        float a = smoothstep(0.9, 0.0, r) * (0.85 + 0.15 * sin(uTime * 0.7));
        gl_FragColor = vec4(mix(vec3(0.001, 0.006, 0.014), vec3(0.015, 0.1, 0.2), a), 1.0);
      }`,
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(AW * 2.4, AH * 1.6), mouthMat);
  back.position.set(0, 1.0, 2.5);
  front.add(back);
  const glow = glowSprite(new THREE.Color('#3fb6ff'), 10, 0.22);
  glow.position.set(0, 1.4, D + 1.5);
  front.add(glow);
  g.userData.mats = [mat, mouthMat];
  g.userData.label = new THREE.Vector3(x0 + 1.4, base + AH + 0.6, z0 + 0.8);
  return g;
}

function buildTrees(count) {
  const cone = new THREE.ConeGeometry(0.9, 3.4, 7);
  cone.translate(0, 1.7, 0);
  const cap = new THREE.ConeGeometry(0.62, 1.4, 7);
  cap.translate(0, 3.0, 0);
  const trees = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ color: '#0b1716', roughness: 1 }), count);
  const caps = new THREE.InstancedMesh(cap, new THREE.MeshStandardMaterial({ color: '#c9d9ec', roughness: 0.9 }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * (11 + rnd() * 40), z = 4 + rnd() * 40 - Math.abs(x) * 0.25;
    pos.set(x, height(x, z) - 0.2, z);
    const k = 0.7 + rnd() * 0.8;
    s.set(k, k * (0.9 + rnd() * 0.4), k);
    m.compose(pos, q, s);
    trees.setMatrixAt(i, m);
    caps.setMatrixAt(i, m);
  }
  const g = new THREE.Group();
  g.add(trees, caps);
  return g;
}

/** The skin track up the slope: zigzags from the valley to Julie. */
function buildTrack(to) {
  const pts = [];
  let side = 1;
  for (let z = 14; z > to.z + 2; z -= 3.2) {
    const x = gx(z) + side * (3.5 + 1.5 * smooth(0, -30, z));
    pts.push(new THREE.Vector3(x, height(x, z) + 0.06, z));
    side = -side;
  }
  pts.push(to.clone().add(new THREE.Vector3(0, 0.06, 0)));
  const fine = [];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
  for (let i = 0; i <= 400; i++) {
    const v = curve.getPoint(i / 400);
    v.y = height(v.x, v.z) + 0.06;
    fine.push(v);
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fine), 400, 0.07, 4), new THREE.MeshBasicMaterial({ color: '#56708f' }));
}

/** Snow glints: tiny crystals catching the moon as the camera moves. */
function buildGlints(count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const x = (rnd() - 0.5) * 70, z = 20 - rnd() * 60;
    pos.set([x, height(x, z) + 0.05, z], i * 3);
    seed[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uPx; varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = pow(max(0.0, sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 60.0 + mv.x * 0.3)), 24.0);
        gl_PointSize = uPx * 3.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`varying float vA; void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(0.8, 0.9, 1.0) * a * vA, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function skis(g) {
  const ski = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 1.7), new THREE.MeshStandardMaterial({ color: '#d8e2ec', roughness: 0.5 }));
  const a = ski.clone(); a.position.set(-0.13, 0.02, 0.1);
  const b = ski.clone(); b.position.set(0.13, 0.02, 0.1);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.25, 4), new THREE.MeshStandardMaterial({ color: '#9aa6b2' }));
  const p1 = pole.clone(); p1.position.set(-0.42, 0.6, 0.15); p1.rotation.z = 0.12;
  const p2 = pole.clone(); p2.position.set(0.42, 0.6, 0.15); p2.rotation.z = -0.12;
  g.add(a, b, p1, p2);
}

export class HeroAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);
    this.look = { bloom: 0.55, bloomRadius: 0.45, threshold: 0.97, exposure: 0.95, fade: 1, fadeColor: '#000000', vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.fog = new THREE.FogExp2('#1c2d4a', 0.0062);
    this.fogNight = new THREE.Color('#1c2d4a');
    this.fogWhite = new THREE.Color('#8d9fb8');
    this.sky = createSky({ zenith: '#040917', mid: '#16294a', horizon: '#5f86ba', sunDir: new THREE.Vector3(0.25, -0.02, -1), stars: 1.0 });
    s.add(this.sky);
    const moon = glowSprite(new THREE.Color('#dce8ff'), 70, 0.5);
    moon.position.set(-110, 120, -260);
    const disc = glowSprite(new THREE.Color('#ffffff'), 9, 1);
    disc.position.copy(moon.position);
    s.add(moon, disc);

    s.add(new THREE.HemisphereLight('#a9c6ff', '#16233a', 1.05));
    const key = new THREE.DirectionalLight('#d5e4ff', 1.7);
    key.position.set(-50, 70, 45);
    const rim = new THREE.DirectionalLight('#6f8fe0', 0.6);
    rim.position.set(40, 20, -60);
    s.add(key, rim);

    s.add(buildSlope(), buildTrees(Math.round(70 * QUALITY.particles + 20)));
    this.icefall = buildIcefall(23, -24);
    this.icecave = buildIceCave(-27, -16);
    s.add(this.icefall, this.icecave);
    this.glints = buildGlints(Math.round(1400 * QUALITY.particles + 200));
    s.add(this.glints);

    const at = (x, z) => new THREE.Vector3(x, height(x, z), z);
    const spots = {
      julie: at(gx(-31) + 1.2, -31),
      marc: at(gx(-15) - 2.5, -15),
      lea: at(gx(5) + 3, 5),
      tom: at(gx(11) - 3.5, 11),
    };
    s.add(buildTrack(spots.julie));
    const J = spots.julie;
    this.wind = windParticles(Math.round(380 * QUALITY.particles + 80), {
      center: J.clone().add(new THREE.Vector3(2, 2.2, 0)), size: new THREE.Vector3(30, 4, 10), dir: new THREE.Vector3(1, 0.04, 0.35), speed: 0.45, color: [0.55, 0.68, 0.85], px: 14, alpha: 0.5,
    });
    this.plumes = windParticles(Math.round(160 * QUALITY.particles + 40), {
      center: new THREE.Vector3(10, 82, -140), size: new THREE.Vector3(170, 6, 30), dir: new THREE.Vector3(1, 0.05, 0), speed: 0.04, color: [0.45, 0.56, 0.72], px: 160, alpha: 0.1,
    });
    s.add(this.wind, this.plumes);

    this.story = new Story(s, labels, {
      spots, face: new THREE.Vector3(gx(10), 0, 30), gear: skis,
      noise: J.clone().add(new THREE.Vector3(-3.5, 3.2, -1)), lifts: [3, 3.5, 2], sides: { noise: 'left' }, call: false,
    });
    this.lab = {
      icefall: labels.add(tr('label.icefall'), this.icefall.userData.label),
      icecave: labels.add(tr('label.icecave'), this.icecave.userData.label, { side: 'left' }),
    };

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const K = (p, t) => [p, t];
    const j = J.clone();
    this.keys = [
      { p: -1, k: K(V(6, 20, 104), V(-16, 26, -100)) },
      { p: 0, k: K(V(6, 16, 90), V(-16, 24, -100)) },
      { p: 0.5, k: K(V(10, 24, 6), j.clone().add(V(0, 1, 0))) },
      { p: 1, k: K(j.clone().add(V(-7, 4, 11)), j.clone().add(V(3, 2.5, -8))) },
      { p: 1.5, k: K(V(4, 30, 18), V(-2, 8, -14)) },
      { p: 2, k: K(V(14, 34, 42), V(-6, 6, -10)) },
      { p: 3, k: K(V(18, 40, 54), V(-6, 6, -14)) },
    ];
    this.tmpP = new THREE.Vector3();
    this.tmpT = new THREE.Vector3();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 42;
    this.camera.updateProjectionMatrix();
    for (const pts of [this.wind, this.plumes, this.glints]) pts.material.uniforms.uPx.value = h / 900;
  }

  setProgress(p) { this.progress = p; }
  enter() { this.story.enter(); }
  leave() { this.story.leave(); }

  update(dt, t) {
    this.t0 ??= performance.now();
    const it = (performance.now() - this.t0) / 1000;
    const p = panelPos(this.progress, this.marks);
    this.intro = 1 - smooth(0, 1.6, it);

    this.sky.userData.update(t);
    for (const pts of [this.wind, this.plumes, this.glints]) pts.material.uniforms.uTime.value = t;
    this.icefall.userData.mat.uniforms.uTime.value = t;
    this.icecave.userData.mats.forEach((m) => { m.uniforms.uTime.value = t; });

    cameraAt(this.keys, p, this.tmpP, this.tmpT);
    this.tmpP.x += Math.sin(t * 0.17) * 0.6;
    this.tmpP.y += Math.sin(t * 0.23) * 0.3 + (1 - smooth(0, 3.5, it)) * 8;
    this.camera.position.copy(this.tmpP);
    this.camera.lookAt(this.tmpT);

    const { ph1 } = this.story.update(p, t, this.camera);
    // The whiteout of the first card: the fog closes in around Julie and the rest of the group vanishes.
    this.scene.fog.density = 0.0062 + 0.05 * ph1;
    this.scene.fog.color.copy(this.fogNight).lerp(this.fogWhite, ph1);
    this.wind.material.uniforms.uAlpha.value = 0.5 + 0.6 * ph1;
    this.look.fade = Math.max(this.intro, 0.32 * ph1);
    this.look.fadeColor = this.intro > 0.01 ? theme().bg : '#8193ab';
    const lb = this.labels;
    lb.show(this.lab.icefall, p > 0.15 && p < 0.5);
    lb.show(this.lab.icecave, p > 0.15 && p < 0.5);
    lb.update(this.camera, innerWidth, innerHeight);
  }
}
