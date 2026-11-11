// Act · hero for caving — a shaft with a waterfall dropping into a chamber, and a passage with
// an underground river, lit only by headlamps. Julie, on a ledge at the top of the shaft,
// whistles into the roar of the water; then her message (the rope is rubbing, don't come up)
// hops to Marc at the foot of the shaft, then along the passage to Léa and Tom, each in range
// of the next. The cave is drawn from the inside (back faces), so from outside it opens like a
// cutaway: the opening view and the overview; the first card dives into the shaft.
import * as THREE from 'three';
import { smooth, QUALITY } from '../kit/fx.js';
import { theme } from '../activity.js';
import { fbm2, noise2, glowMap, panelPos } from '../world/common.js';
import { Story, cameraAt } from '../world/story.js';

const big = (z) => smooth(-22, -6, z);
const px = (z) => (z < -10 ? 5 * Math.sin((z + 10) * 0.07) : 0);
const cy = (z) => 4 - 2.5 * smooth(-10, -60, z);
const rw = (z) => 4.2 + 6 * big(z);
const rh = (z) => 3.4 + 4.4 * big(z);
const floorY = (z) => cy(z) - rh(z) * 0.62;
const SHAFT = new THREE.Vector3(0, 0, -2);
const SHAFT_R = 3.2, SHAFT_TOP = 34;
const shaftR = (y, a) => SHAFT_R + 0.5 * noise2(a * 1.5, y * 0.3) + 0.25 * noise2(a * 5, y * 1.1);

const LIME = new THREE.Color('#7b7163'), LIME2 = new THREE.Color('#5a5348'), MUD = new THREE.Color('#3b3026'), FLOW = new THREE.Color('#8a7a5e');

function faceColours(geo, floorOf) {
  const q = geo.attributes.position, col = new Float32Array(q.count * 3), c = new THREE.Color();
  for (let i = 0; i < q.count; i += 3) {
    const x = (q.getX(i) + q.getX(i + 1) + q.getX(i + 2)) / 3, y = (q.getY(i) + q.getY(i + 1) + q.getY(i + 2)) / 3, z = (q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)) / 3;
    c.copy(LIME2).lerp(LIME, 0.5 + 0.5 * noise2(x * 0.8 + z * 0.3, y * 0.8));
    if (noise2(x * 0.25, y * 0.6 + z * 0.25) > 0.45) c.lerp(FLOW, 0.6);
    if (floorOf && y < floorOf(z) + 0.35) c.copy(MUD).multiplyScalar(0.85 + 0.3 * noise2(x * 2, z * 2));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

const rockMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, flatShading: true, side: THREE.BackSide });

/** The chamber and the passage: elliptical rings along z, a flat muddy floor, a hole under the shaft. */
function buildGallery() {
  const N = QUALITY.tier >= 1.5 ? 220 : 150, M = QUALITY.tier >= 1.5 ? 48 : 34;
  const z0 = 14, z1 = -74, pos = [];
  for (let i = 0; i <= N; i++) {
    const z = z0 + (z1 - z0) * (i / N);
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      const n = 1 + 0.16 * fbm2(z * 0.12 + Math.cos(a) * 2, Math.sin(a) * 2 + 5) + 0.05 * noise2(z * 0.7, a * 4);
      let x = px(z) + Math.cos(a) * rw(z) * n, y = cy(z) + Math.sin(a) * rh(z) * n;
      y = Math.max(y, floorY(z) + 0.15 * noise2(x * 0.8, z * 0.8));
      pos.push(x, y, z);
    }
  }
  const idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + M + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  // Leave out the ceiling faces under the shaft.
  const keep = [];
  for (let t = 0; t < idx.length; t += 3) {
    let x = 0, y = 0, z = 0;
    for (let k = 0; k < 3; k++) { x += pos[idx[t + k] * 3]; y += pos[idx[t + k] * 3 + 1]; z += pos[idx[t + k] * 3 + 2]; }
    x /= 3; y /= 3; z /= 3;
    if (y > cy(z) + 2 && Math.hypot(x - SHAFT.x, z - SHAFT.z) < SHAFT_R + 0.2) continue;
    keep.push(idx[t], idx[t + 1], idx[t + 2]);
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(keep);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  faceColours(geo, floorY);
  return new THREE.Mesh(geo, rockMat());
}

/** The shaft: a rough vertical tube from the chamber ceiling up to Julie's ledge and beyond. */
function buildShaft() {
  const N = 60, M = 28, y0 = cy(SHAFT.z) + rh(SHAFT.z) * 0.8, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const y = y0 + (SHAFT_TOP - y0) * (i / N);
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2, r = shaftR(y, a);
      pos.push(SHAFT.x + Math.cos(a) * r, y, SHAFT.z + Math.sin(a) * r);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + M + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  faceColours(geo, null);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, rockMat()));
  const cap = new THREE.Mesh(new THREE.CircleGeometry(SHAFT_R + 1, 20), new THREE.MeshStandardMaterial({ color: '#2a2620', roughness: 1 }));
  cap.rotation.x = Math.PI / 2;
  cap.position.set(SHAFT.x, SHAFT_TOP, SHAFT.z);
  g.add(cap);
  return g;
}

/** Stalactites from the ceiling, a few stalagmites on the floor. */
function buildFormations(count) {
  const cone = new THREE.ConeGeometry(0.22, 1, 6);
  cone.translate(0, -0.5, 0);
  const mesh = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ color: '#7d6f5a', roughness: 0.5, flatShading: true }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const up = rnd() > 0.18, z = (up ? 8 : -8) - rnd() * (up ? 78 : 64);
    const a = up ? Math.PI / 2 + (rnd() - 0.5) * 1.6 : 0;
    if (up && Math.hypot(px(z) + Math.cos(a) * rw(z) * 0.85 - SHAFT.x, z - SHAFT.z) < SHAFT_R + 1) continue;
    const len = 0.4 + Math.pow(rnd(), 2) * (2.2 + 1.5 * big(z));
    if (up) {
      p.set(px(z) + Math.cos(a) * rw(z) * 0.82, cy(z) + Math.sin(a) * rh(z) * 0.86, z);
      q.identity();
    } else {
      p.set(px(z) + (rnd() - 0.5) * rw(z) * 1.4, floorY(z), z);
      q.copy(flip);
    }
    s.set(0.7 + len * 0.12, len, 0.7 + len * 0.12);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  }
  return mesh;
}

const WATER_FRAG = /* glsl */`
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }`;

/** The underground river along the passage floor, from the pool under the shaft. */
function buildRiver() {
  const N = 160, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const z = 2 + (-74 - 2) * (i / N), w = 0.9 + 1.2 * big(z), y = floorY(z) + 0.12, x = px(z) + 0.8;
    pos.push(x - w, y, z, x + w, y, z);
    uv.push(0, z, 1, z);
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform float uTime; varying vec2 vUv;
      ${WATER_FRAG}
      void main() {
        vec2 p = vec2(vUv.x * 4.0, vUv.y * 0.8 + uTime * 1.2);
        float n = vn(p) * 0.6 + vn(p * 2.3 + 4.0) * 0.4;
        float edge = smoothstep(0.38, 0.5, abs(vUv.x - 0.5));
        vec3 col = mix(vec3(0.002, 0.02, 0.018), vec3(0.01, 0.06, 0.05), n) + vec3(0.06, 0.14, 0.12) * smoothstep(0.65, 0.9, n) * 0.5;
        gl_FragColor = vec4(col, 1.0 - edge * 0.6);
        #include <fog_fragment>
      }`,
    transparent: true,
  });
  return new THREE.Mesh(geo, mat);
}

/** The waterfall down the shaft wall, and the spray at its foot. */
function buildFall() {
  const W = 10, Hs = 40, pos = [], uv = [], idx = [];
  const top = SHAFT_TOP - 1, bottom = floorY(SHAFT.z) + 0.1;
  for (let j = 0; j <= Hs; j++) {
    const v = j / Hs, y = top - (top - bottom) * v;
    for (let i = 0; i <= W; i++) {
      const u = i / W, a = -0.55 + u * 1.1;
      const r = (y > cy(SHAFT.z) + rh(SHAFT.z) * 0.8 ? shaftR(y, a) - 0.35 : SHAFT_R - 0.4 + v * 0.6);
      pos.push(SHAFT.x + Math.cos(a) * r, y, SHAFT.z + Math.sin(a) * r);
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
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv;
      ${WATER_FRAG}
      void main() {
        float n = vn(vec2(vUv.x * 8.0, vUv.y * 6.0 - uTime * 4.0)) * 0.65 + vn(vec2(vUv.x * 19.0, vUv.y * 11.0 - uTime * 6.0)) * 0.35;
        float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
        float a = smoothstep(0.5, 0.9, n) * edge;
        gl_FragColor = vec4(vec3(0.5, 0.5, 0.46) * a * 0.55, 1.0);
      }`,
  });
  return new THREE.Mesh(geo, mat);
}

function buildMist(count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) seed[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const c = new THREE.Vector3(SHAFT.x + 2.4, floorY(SHAFT.z), SHAFT.z);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMap: { value: glowMap() }, uC: { value: c }, uPx: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uPx; uniform vec3 uC; varying float vA;
      void main() {
        float k = fract(aSeed * 7.13 + uTime * (0.1 + aSeed * 0.08));
        vec3 p = uC + vec3((aSeed - 0.5) * 4.0, k * 5.0, (fract(aSeed * 13.7) - 0.5) * 4.0);
        vA = sin(k * 3.1416) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * (80.0 + 140.0 * k) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform sampler2D uMap; varying float vA; void main() { float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vec3(0.6, 0.55, 0.45) * a * vA * 0.22, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

/** A headlamp: a spot light and a faint beam through the damp air. */
function headlamp(scene, from, to) {
  const spot = new THREE.SpotLight('#ffe3b3', 26, 34, 0.5, 0.75, 1.4);
  spot.position.copy(from);
  spot.target.position.copy(to);
  scene.add(spot, spot.target);
  const len = from.distanceTo(to);
  const geo = new THREE.ConeGeometry(len * 0.38, len, 20, 1, true);
  geo.translate(0, -len / 2, 0);
  const beam = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uLen: { value: len } },
    vertexShader: /* glsl */`varying float vD; varying vec3 vN; varying vec3 vV;
      void main() { vD = -position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform float uLen; varying float vD; varying vec3 vN; varying vec3 vV;
      void main() { float k = vD / uLen; float side = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
        float a = (1.0 - k) * (1.0 - k) * side * side * 0.06;
        gl_FragColor = vec4(vec3(1.0, 0.85, 0.6) * a, 1.0); }`,
  }));
  beam.position.copy(from);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  scene.add(beam);
}

function headlampGear(g) {
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.08), new THREE.MeshBasicMaterial({ color: '#fff4dc' }));
  lamp.position.set(0, 1.6, 0.19);
  g.add(lamp);
}

export class HeroAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.05, 400);
    this.look = { bloom: 0.7, bloomRadius: 0.55, threshold: 0.86, exposure: 1.1, fade: 1, fadeColor: '#000000', vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.background = new THREE.Color('#050404');
    s.fog = new THREE.FogExp2('#070605', 0.009);
    s.add(new THREE.HemisphereLight('#6b604c', '#15110d', 0.32));
    // Warm bounce of the headlamps on the wet rock, where the team is.
    const glow = (x, y, z, i, d) => { const l = new THREE.PointLight('#ffc77a', i, d, 1.3); l.position.set(x, y, z); s.add(l); };
    glow(0, 5, -1, 40, 26); glow(0, 29, -2, 14, 12); glow(px(-30), cy(-30) + 1, -30, 22, 18); glow(px(-44), cy(-44) + 1, -44, 22, 18);

    s.add(buildGallery(), buildShaft(), buildFormations(Math.round(90 * QUALITY.particles + 40)));
    this.river = buildRiver();
    this.fall = buildFall();
    this.mist = buildMist(Math.round(200 * QUALITY.particles + 50));
    s.add(this.river, this.fall, this.mist);

    const ledgeY = 27.5;
    const ledge = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#6a6052', roughness: 0.9, flatShading: true }));
    ledge.scale.set(1.6, 0.45, 1.5);
    ledge.position.set(SHAFT.x - 2.3, ledgeY - 0.42, SHAFT.z - 0.4);
    s.add(ledge);
    const at = (x, z) => new THREE.Vector3(x, floorY(z), z);
    const spots = {
      julie: new THREE.Vector3(SHAFT.x - 1.9, ledgeY, SHAFT.z - 0.3),
      marc: at(SHAFT.x - 1.5, SHAFT.z + 2.2),
      lea: at(px(-30) - 1.2, -30),
      tom: at(px(-44) + 0.4, -44),
    };
    const face = { julie: new THREE.Vector3(SHAFT.x + 3, ledgeY, SHAFT.z), marc: new THREE.Vector3(px(-20), 0, -20), lea: new THREE.Vector3(px(-60), 0, -60), tom: new THREE.Vector3(px(-70), 0, -70) };
    this.story = new Story(s, labels, {
      spots, face, gear: headlampGear,
      noise: new THREE.Vector3(SHAFT.x + 2.4, 16, SHAFT.z), lifts: [0.5, 2.2, 1.4], ring: '#ffe6bf', ringSize: 3.6,
      sides: { noise: 'right', julie: 'left', whistle: 'left' },
    });
    // Headlamps: Julie looks down the shaft, Marc up at her, Léa and Tom along the passage.
    const head = (k) => spots[k].clone().add(new THREE.Vector3(0, 1.6, 0));
    headlamp(s, head('julie'), new THREE.Vector3(SHAFT.x + 0.8, 12, SHAFT.z + 0.4));
    headlamp(s, head('marc'), new THREE.Vector3(SHAFT.x, 18, SHAFT.z));
    headlamp(s, head('lea'), new THREE.Vector3(px(-48), floorY(-48) + 1, -48));
    headlamp(s, head('tom'), new THREE.Vector3(px(-62), floorY(-62) + 1.5, -62));

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const J = head('julie');
    this.keys = [
      { p: -1, k: [V(44, 34, 40), V(-19, 12, -22)] },
      { p: 0, k: [V(38, 28, 32), V(-19, 12, -20)] },
      { p: 0.5, k: [V(18, 32, 14), V(-3, 22, -6)] },
      { p: 1, k: [V(8.5, 30.5, 6), V(-1.6, 25.6, -2.2)] },
      { p: 1.5, k: [V(26, 20, -6), V(0, 8, -20)] },
      { p: 2, k: [V(50, 22, 6), V(-8, 13, -22)] },
      { p: 3, k: [V(56, 26, 8), V(-8, 13, -24)] },
    ];
    this.tmpP = new THREE.Vector3();
    this.tmpT = new THREE.Vector3();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 66 : 48;
    this.camera.updateProjectionMatrix();
    this.mist.material.uniforms.uPx.value = h / 900;
  }

  setProgress(p) { this.progress = p; }
  enter() { this.story.enter(); }
  leave() { this.story.leave(); }

  update(dt, t) {
    this.t0 ??= performance.now();
    const it = (performance.now() - this.t0) / 1000;
    const p = panelPos(this.progress, this.marks);
    this.look.fade = 1 - smooth(0, 1.6, it);
    this.look.fadeColor = theme().bg;
    this.river.material.uniforms.uTime.value = t;
    this.fall.material.uniforms.uTime.value = t;
    this.mist.material.uniforms.uTime.value = t;

    cameraAt(this.keys, p, this.tmpP, this.tmpT);
    this.tmpP.x += Math.sin(t * 0.17) * 0.2;
    this.tmpP.y += Math.sin(t * 0.23) * 0.12 + (1 - smooth(0, 3.5, it)) * 6;
    this.camera.position.copy(this.tmpP);
    this.camera.lookAt(this.tmpT);

    this.story.update(p, t, this.camera);
    this.labels.update(this.camera, innerWidth, innerHeight);
  }
}
