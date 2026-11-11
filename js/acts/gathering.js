// Act · hero for gatherings — a festival at night: a stage with its light beams sweeping the haze,
// a crowd holding up its phones, a saturated cell tower and the first-aid post at the edge. Julie,
// volunteering by the stage, needs the first-aid post while the saturated tower lets nothing
// through; then her message (someone collapsed in the front row) hops from phone to phone through
// the crowd to Léa and Tom at the first-aid post, and the acknowledgements come back.
import * as THREE from 'three';
import { smooth, QUALITY } from '../kit/fx.js';
import { theme } from '../activity.js';
import { noise2, createSky, glowSprite, panelPos, SOS_RED } from '../world/common.js';
import { Story, cameraAt } from '../world/story.js';

const STAGE_Z = -42;
const TOWER = new THREE.Vector3(24, 0, -56);
const TENT = new THREE.Vector3(27, 0, 3);

function buildGround() {
  let geo = new THREE.PlaneGeometry(320, 320, 90, 90);
  geo.rotateX(-Math.PI / 2);
  geo = geo.toNonIndexed();
  const q = geo.attributes.position, col = new Float32Array(q.count * 3), c = new THREE.Color(), a = new THREE.Color('#141019'), b = new THREE.Color('#1d1a24');
  for (let i = 0; i < q.count; i += 3) {
    const x = q.getX(i), z = q.getZ(i);
    c.copy(a).lerp(b, 0.5 + 0.5 * noise2(x * 0.15, z * 0.15));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
}

/** The stage: deck, truss, speaker stacks and an LED wall playing slow colour waves. */
function buildStage() {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: '#16131c', roughness: 0.7, metalness: 0.3 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(34, 2, 12), dark);
  deck.position.set(0, 1, STAGE_Z);
  g.add(deck);
  const truss = new THREE.MeshStandardMaterial({ color: '#4a4558', roughness: 0.5, metalness: 0.7 });
  for (const x of [-16, 16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 16, 0.6), truss);
    leg.position.set(x, 8, STAGE_Z + 5);
    g.add(leg);
    const stack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 7, 3), dark);
    stack.position.set(x * 1.2, 3.5, STAGE_Z + 6);
    g.add(stack);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(33, 0.6, 0.6), truss);
  top.position.set(0, 16, STAGE_Z + 5);
  g.add(top);
  const wallMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv;
      void main() {
        vec2 px = floor(vUv * vec2(96.0, 36.0)) / vec2(96.0, 36.0);
        float w = sin(px.x * 9.0 + uTime * 1.3) * 0.5 + 0.5;
        float v = sin(px.y * 7.0 - uTime * 0.9 + w * 2.0) * 0.5 + 0.5;
        vec3 col = mix(vec3(0.35, 0.03, 0.4), vec3(0.04, 0.12, 0.45), v) * (0.35 + 0.65 * w);
        col *= 0.75 + 0.25 * step(0.5, fract(vUv.x * 96.0)) * step(0.5, fract(vUv.y * 36.0));
        gl_FragColor = vec4(col * 0.6, 1.0);
      }`,
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 10), wallMat);
  wall.position.set(0, 8, STAGE_Z - 2);
  g.add(wall);
  g.userData.mat = wallMat;
  return g;
}

/** Light beams from the truss, sweeping the haze over the crowd. */
function buildBeams(n) {
  const beams = [];
  const geo = new THREE.ConeGeometry(4.5, 42, 24, 1, true);
  geo.translate(0, -21, 0);
  const colors = ['#d946ef', '#7c6cf0', '#38bdf8', '#f0abfc'];
  for (let i = 0; i < n; i++) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uColor: { value: new THREE.Color(colors[i % colors.length]) }, uA: { value: 0.07 } },
      vertexShader: /* glsl */`varying float vK; varying vec3 vN; varying vec3 vV;
        void main() { vK = -position.y / 42.0; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uA; varying float vK; varying vec3 vN; varying vec3 vV;
        void main() { float side = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); gl_FragColor = vec4(uColor * (1.0 - vK) * side * uA, 1.0); }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(-13 + (26 * i) / (n - 1), 16, STAGE_Z + 5);
    m.userData.phase = i * 1.7;
    beams.push(m);
  }
  return beams;
}

/** The crowd: many people in a fan before the stage, nodding to the beat; phones held up glow. */
function buildCrowd(count) {
  const geo = new THREE.CapsuleGeometry(0.24, 0.95, 3, 6);
  geo.translate(0, 0.72, 0);
  const mat = new THREE.MeshStandardMaterial({ color: '#4a3d5c', roughness: 0.8, emissive: '#1c1328' });
  const time = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nfloat ph = float(gl_InstanceID) * 1.618;\ntransformed.y += max(0.0, sin(uTime * 4.2 + ph)) * 0.12 * step(0.35, fract(ph));');
  };
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const phones = [];
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let n = 0;
  while (n < count) {
    const z = STAGE_Z + 7 + Math.sqrt(rnd()) * 42, half = 13 + (z - STAGE_Z) * 0.32;
    const x = (rnd() * 2 - 1) * half;
    if (Math.hypot(x - TENT.x, z - TENT.z) < 6) continue;
    p.set(x, 0, z);
    const k = 0.9 + rnd() * 0.22;
    s.set(k, k, k);
    m.compose(p, q, s);
    mesh.setMatrixAt(n++, m);
    if (rnd() < 0.22) phones.push(x + 0.15, 1.9 * k + rnd() * 0.25, z - 0.2);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(phones, 3));
  const seeds = new Float32Array(phones.length / 3).map(() => rnd());
  pg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const pmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    vertexShader: /* glsl */`attribute float aSeed; uniform float uTime, uPx; varying float vA; varying float vS;
      void main() { vS = aSeed; vA = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uPx * 160.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`varying float vA; varying float vS;
      void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); vec3 c = mix(vec3(0.85, 0.9, 1.0), vec3(0.85, 0.35, 0.95), step(0.7, vS)); gl_FragColor = vec4(c * a * vA * 0.5, 1.0); }`,
  });
  const pts = new THREE.Points(pg, pmat);
  pts.frustumCulled = false;
  const g = new THREE.Group();
  g.add(mesh, pts);
  g.userData = { time, phones: pmat };
  return g;
}

/** The cell tower beside the field, its red light blinking. */
function buildTower() {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#5b566a', roughness: 0.5, metalness: 0.8 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.8, 28, 6), steel);
  mast.position.y = 14;
  g.add(mast);
  for (let i = 0; i < 3; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.9), steel);
    const a = (i / 3) * Math.PI * 2;
    panel.position.set(Math.cos(a) * 0.9, 25.5, Math.sin(a) * 0.9);
    panel.rotation.y = -a;
    g.add(panel);
  }
  const lamp = glowSprite(SOS_RED, 2.4, 0.9);
  lamp.position.y = 28.4;
  g.add(lamp);
  g.position.copy(TOWER);
  g.userData.lamp = lamp;
  return g;
}

/** The first-aid post: a white tent with a red cross, lit from inside. */
function buildTent() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#d8d3e0', roughness: 0.8, emissive: '#3a3440', emissiveIntensity: 0.4 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, 4.4), white);
  box.position.y = 1.2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.7, 1.6, 4), white);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 0.9);
  roof.position.y = 3.2;
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff4b42').multiplyScalar(1.4), toneMapped: false });
  const c1 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.36), red);
  const c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1.2), red);
  for (const c of [c1, c2]) { c.position.set(0, 1.5, 2.22); g.add(c); }
  const light = new THREE.PointLight('#ffe9d6', 8, 12, 1.5);
  light.position.set(0, 2, 3.5);
  g.add(box, roof, light);
  g.position.copy(TENT);
  g.rotation.y = -0.5;
  return g;
}

export class HeroAct {
  constructor({ labels }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);
    this.look = { bloom: 0.75, bloomRadius: 0.55, threshold: 0.85, exposure: 1.05, fade: 1, fadeColor: '#000000', vignette: 1 };
    this.labels = labels;
    this.progress = 0;
    const s = this.scene;
    s.fog = new THREE.FogExp2('#1a0f2a', 0.007);
    this.sky = createSky({ zenith: '#05030b', mid: '#150b26', horizon: '#40205c', sunDir: new THREE.Vector3(0, 0.05, -1), stars: 0.8 });
    s.add(this.sky);
    s.add(new THREE.HemisphereLight('#8a78e0', '#120c1c', 1.1));
    const wash = new THREE.PointLight('#d946ef', 140, 70, 1.4);
    wash.position.set(0, 14, STAGE_Z + 8);
    const wash2 = new THREE.PointLight('#38bdf8', 70, 60, 1.4);
    wash2.position.set(-12, 10, STAGE_Z + 12);
    s.add(wash, wash2);

    s.add(buildGround());
    this.podium = buildStage();
    s.add(this.podium);
    this.beams = buildBeams(QUALITY.tier >= 1.5 ? 6 : 4);
    this.beams.forEach((b) => s.add(b));
    this.crowd = buildCrowd(Math.round(700 * QUALITY.particles + 250));
    s.add(this.crowd);
    this.tower = buildTower();
    s.add(this.tower, buildTent());

    const at = (x, z) => new THREE.Vector3(x, 0, z);
    const spots = { julie: at(9, STAGE_Z + 9), marc: at(15, -16), lea: at(23.5, 4.5), tom: at(30, 7) };
    this.story = new Story(s, labels, {
      spots, face: { julie: at(9, 0), marc: at(30, 10), lea: at(0, -20), tom: at(0, -20) },
      noise: TOWER.clone().add(new THREE.Vector3(-1, 19, 0)), lifts: [2.4, 2.4, 1.2], sides: { noise: 'left' }, call: false, callLabel: false,
    });
    this.towerTop = TOWER.clone().add(new THREE.Vector3(0, 26, 0));

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const J = spots.julie;
    this.keys = [
      { p: -1, k: [V(-24, 24, 56), V(-12, 6, -20)] },
      { p: 0, k: [V(-20, 19, 48), V(-12, 6, -20)] },
      { p: 0.5, k: [V(-4, 14, 4), J.clone().add(V(0, 2, 0))] },
      { p: 1, k: [J.clone().add(V(-9, 5.5, 17)), J.clone().add(V(7, 6.5, -6))] },
      { p: 1.5, k: [V(-10, 30, 34), V(2, 0, -14)] },
      { p: 2, k: [V(-8, 38, 44), V(2, 0, -14)] },
      { p: 3, k: [V(-8, 44, 54), V(2, 0, -16)] },
    ];
    this.tmpP = new THREE.Vector3();
    this.tmpT = new THREE.Vector3();
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 42;
    this.camera.updateProjectionMatrix();
    this.crowd.userData.phones.uniforms.uPx.value = h / 900;
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

    this.sky.userData.update(t);
    this.podium.userData.mat.uniforms.uTime.value = t;
    this.crowd.userData.time.value = t;
    this.crowd.userData.phones.uniforms.uTime.value = t;
    for (const b of this.beams) {
      const ph = b.userData.phase;
      b.rotation.set(0.55 + 0.25 * Math.sin(t * 0.5 + ph), 0, 0.5 * Math.sin(t * 0.37 + ph * 1.3));
    }
    this.tower.userData.lamp.material.opacity = 0.35 + 0.6 * (Math.sin(t * 3) > 0 ? 1 : 0);

    cameraAt(this.keys, p, this.tmpP, this.tmpT);
    this.tmpP.x += Math.sin(t * 0.17) * 0.6;
    this.tmpP.y += Math.sin(t * 0.23) * 0.3 + (1 - smooth(0, 3.5, it)) * 8;
    this.camera.position.copy(this.tmpP);
    this.camera.lookAt(this.tmpT);

    const { ph1 } = this.story.update(p, t, this.camera);
    // The saturated tower: its waves break apart, red, while the first card is on screen.
    if (ph1 > 0.5) {
      this.towerClock ??= 0;
      if (t - this.towerClock > 1.1) {
        this.towerClock = t;
        this.story.rings.emit(this.towerTop, { color: SOS_RED, size: 16, dur: 1.8, alpha: 0.6, brokenFrom: 0.05, width: 0.02 });
      }
    }
    this.labels.update(this.camera, innerWidth, innerHeight);
  }
}
