// Shared pieces of the Siflo acts: value noise, the dusk sky, glow sprites,
// phone beacons, expanding rings and packets travelling along arcs.
import * as THREE from 'three';
import { glowTexture, clamp01 } from '../kit/fx.js';

export const ORANGE = new THREE.Color('#ff6a00');
export const EMBER = new THREE.Color('#ff8a3d');
export const OK_GREEN = new THREE.Color('#95d4a9');
export const SOS_RED = new THREE.Color('#ff4b42');

/* ---------------- noise ---------------- */
const P = new Uint8Array(512);
{
  let s = 1234567;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = (t) => t * t * (3 - 2 * t);
const h2 = (x, y) => P[(P[x & 255] + y) & 511] / 255;
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
export function fbm2(x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}

/* ---------------- sky ---------------- */
/** Dusk gradient dome with a warm glow towards the sun and faint stars at the zenith. */
export function createSky({ zenith = '#140f26', mid = '#5a2f45', horizon = '#ff8a4c', sunDir = new THREE.Vector3(-0.5, 0.08, -1), stars = 0.6 } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(zenith) }, uMid: { value: new THREE.Color(mid) }, uHorizon: { value: new THREE.Color(horizon) },
      uSun: { value: sunDir.clone().normalize() }, uStars: { value: stars }, uTime: { value: 0 },
    },
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith, uMid, uHorizon, uSun; uniform float uStars, uTime; varying vec3 vDir;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.22, h));
        col = mix(col, uZenith, smoothstep(0.18, 0.75, h));
        float s = max(dot(d, uSun), 0.0);
        col += uHorizon * (0.55 * s * s * s * s + 0.25 * s * s) * (1.0 - smoothstep(0.0, 0.5, h));
        vec3 g = floor(d * 260.0);
        float st = step(0.9975, hash(g)) * smoothstep(0.25, 0.8, h) * uStars;
        st *= 0.6 + 0.4 * sin(uTime * 2.0 + hash(g + 3.1) * 40.0);
        col += vec3(st);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), mat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  sky.userData.update = (t) => { mat.uniforms.uTime.value = t; };
  return sky;
}

/* ---------------- glow sprites ---------------- */
let GLOW;
export const glowMap = () => (GLOW ??= glowTexture([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,.6)'], [0.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]));

export function glowSprite(color = ORANGE, size = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowMap(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  s.scale.setScalar(size);
  return s;
}

/**
 * A phone carried by a member: a small emissive slab with a halo. `flash(color)` makes it
 * pulse (signal received); `update(t)` animates the pulse decay with wall-clock time.
 */
export class Beacon extends THREE.Group {
  constructor({ color = ORANGE, size = 1, halo = 2.4 } = {}) {
    super();
    this.base = new THREE.Color(color);
    this.body = new THREE.Mesh(
      new THREE.BoxGeometry(0.32 * size, 0.6 * size, 0.06 * size),
      new THREE.MeshBasicMaterial({ color: this.base.clone().multiplyScalar(1.6), toneMapped: false }),
    );
    this.add(this.body);
    this.halo = glowSprite(this.base, halo * size, 0.55);
    this.add(this.halo);
    this.pulse = glowSprite(this.base, halo * size, 0);
    this.add(this.pulse);
    this.size = size;
    this.haloSize = halo * size;
    this.flashAt = -1e9;
    this.flashColor = new THREE.Color();
  }
  setColor(c) {
    this.base.set(c);
    this.body.material.color.copy(this.base).multiplyScalar(1.6);
    this.halo.material.color.copy(this.base);
  }
  flash(color = this.base) { this.flashAt = performance.now(); this.flashColor.set(color); }
  update(cameraQuat) {
    if (cameraQuat) this.body.quaternion.copy(cameraQuat);
    const k = clamp01(1 - (performance.now() - this.flashAt) / 1100);
    this.pulse.material.opacity = k * 0.95;
    this.pulse.material.color.copy(this.flashColor);
    this.pulse.scale.setScalar(this.haloSize * (1 + (1 - k) * 2.6));
  }
}

/* ---------------- expanding rings ---------------- */
/**
 * Flat expanding rings (sound or radio waves). emit(pos, opts) starts a ring; update() grows
 * and fades them on wall-clock time. `broken` > 0 tears the ring with noise (a drowned sound).
 */
export class Rings extends THREE.Group {
  constructor(max = 12, { billboard = false } = {}) {
    super();
    this.pool = [];
    this.billboard = billboard;
    const geo = new THREE.PlaneGeometry(2, 2);
    for (let i = 0; i < max; i++) {
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        uniforms: { uColor: { value: new THREE.Color() }, uK: { value: 0 }, uAlpha: { value: 0 }, uBroken: { value: 0 }, uWidth: { value: 0.06 }, uSeed: { value: Math.random() * 10 } },
        vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`
          uniform vec3 uColor; uniform float uK, uAlpha, uBroken, uWidth, uSeed; varying vec2 vUv;
          float hash(float n) { return fract(sin(n) * 43758.5453); }
          float vnoise(float x) { float i = floor(x), f = fract(x); return mix(hash(i + uSeed), hash(i + 1.0 + uSeed), f * f * (3.0 - 2.0 * f)); }
          void main() {
            float r = length(vUv);
            float d = abs(r - uK);
            float a = smoothstep(uWidth, 0.0, d) * 0.9 + smoothstep(uWidth * 5.0, 0.0, d) * 0.25;
            float ang = atan(vUv.y, vUv.x);
            float tear = smoothstep(0.35, 0.65, vnoise(ang * 5.0 + uK * 9.0));
            a *= mix(1.0, tear, uBroken);
            a *= step(r, 1.0);
            gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
          }`,
      });
      const mesh = new THREE.Mesh(geo, m);
      mesh.visible = false;
      mesh.frustumCulled = false;
      this.add(mesh);
      this.pool.push({ mesh, t0: 0, dur: 1, size: 1, alpha: 1, brokenFrom: 2, on: false });
    }
    this.i = 0;
  }
  emit(pos, { color = ORANGE, size = 6, dur = 1.6, alpha = 1, normal = null, brokenFrom = 2, width = 0.05 } = {}) {
    const r = this.pool[this.i++ % this.pool.length];
    r.mesh.position.copy(pos);
    if (normal) r.mesh.lookAt(pos.clone().add(normal));
    else r.mesh.rotation.set(-Math.PI / 2, 0, 0);
    r.mesh.scale.setScalar(size);
    r.mesh.material.uniforms.uColor.value.set(color);
    r.mesh.material.uniforms.uWidth.value = width;
    r.t0 = performance.now(); r.dur = dur * 1000; r.alpha = alpha; r.brokenFrom = brokenFrom; r.on = true;
    r.mesh.visible = true;
  }
  update(camera) {
    const now = performance.now();
    for (const r of this.pool) {
      if (!r.on) continue;
      const k = (now - r.t0) / r.dur;
      if (k >= 1) { r.on = false; r.mesh.visible = false; continue; }
      const u = r.mesh.material.uniforms;
      u.uK.value = 0.04 + k * 0.94;
      u.uAlpha.value = r.alpha * (1 - k) * Math.min(1, k * 8);
      u.uBroken.value = clamp01((k - r.brokenFrom) * 3);
      if (this.billboard && camera) r.mesh.quaternion.copy(camera.quaternion);
    }
  }
  clear() { for (const r of this.pool) { r.on = false; r.mesh.visible = false; } }
}

/* ---------------- arcs and packets ---------------- */
/** A raised arc between two points, drawn as a glowing line whose lit share can grow (0-1). */
export class Arc extends THREE.Group {
  constructor(a, b, { lift = 2, color = ORANGE, dashed = false, opacity = 1 } = {}) {
    super();
    const mid = a.clone().lerp(b, 0.5);
    mid.y += lift;
    this.curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
    const pts = this.curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const t = new Float32Array(pts.length);
    for (let i = 0; i < pts.length; i++) t[i] = i / (pts.length - 1);
    geo.setAttribute('aT', new THREE.BufferAttribute(t, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uColor: { value: new THREE.Color(color) }, uShow: { value: 0 }, uFrom: { value: 0 }, uAlpha: { value: opacity }, uDash: { value: dashed ? 1 : 0 }, uTime: { value: 0 } },
      vertexShader: /* glsl */`attribute float aT; varying float vT; void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uShow, uFrom, uAlpha, uDash, uTime; varying float vT;
        void main() {
          float a = step(uFrom, vT) * step(vT, uShow);
          a *= mix(1.0, step(0.45, fract(vT * 18.0 - uTime * 1.5)), uDash);
          gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
        }`,
    });
    this.line = new THREE.Line(geo, this.mat);
    this.line.frustumCulled = false;
    this.add(this.line);
  }
  set show(v) { this.mat.uniforms.uShow.value = v; }
  set alpha(v) { this.mat.uniforms.uAlpha.value = v; }
  tick(t) { this.mat.uniforms.uTime.value = t; }
}

/** Glowing dots that run along curves: send(curve, opts) and update(). */
export class Packets extends THREE.Group {
  constructor(max = 16) {
    super();
    this.pool = Array.from({ length: max }, () => {
      const s = glowSprite(ORANGE, 1.2, 0);
      const core = glowSprite(new THREE.Color('#fff4e8'), 0.4, 0);
      s.add(core);
      s.visible = false;
      this.add(s);
      return { s, core, on: false };
    });
    this.i = 0;
  }
  send(curve, { color = ORANGE, dur = 0.8, size = 1.2, onArrive = null } = {}) {
    const p = this.pool[this.i++ % this.pool.length];
    Object.assign(p, { curve, t0: performance.now(), dur: dur * 1000, onArrive, on: true });
    p.s.material.color.set(color);
    p.s.scale.setScalar(size);
    p.s.visible = true;
  }
  update() {
    const now = performance.now();
    for (const p of this.pool) {
      if (!p.on) continue;
      const k = (now - p.t0) / p.dur;
      if (k >= 1) { p.on = false; p.s.visible = false; p.onArrive?.(); continue; }
      p.curve.getPoint(k, p.s.position);
      const a = Math.min(1, k * 6, (1 - k) * 6);
      p.s.material.opacity = a;
      p.core.material.opacity = a;
    }
  }
  clear() { for (const p of this.pool) { p.on = false; p.s.visible = false; } }
}

/** Fire `fn(i)` for each step of a repeating schedule [t0, t1, …] (seconds) of `period`, on wall-clock time. */
export class Schedule {
  constructor(times, period) { this.times = times; this.period = period; this.reset(); }
  reset() { this.start = performance.now(); this.next = 0; this.cycle = 0; }
  tick(fn) {
    const el = (performance.now() - this.start) / 1000;
    const c = Math.floor(el / this.period);
    if (c !== this.cycle) { this.cycle = c; this.next = 0; }
    const local = el - c * this.period;
    while (this.next < this.times.length && local >= this.times[this.next]) fn(this.next++, c);
  }
}

/**
 * Scroll progress → panel coordinate: 0 when the first card is centred on screen, 1 for the
 * second, and so on. `marks` holds the progress at which each card is centred (set by main.js).
 */
export function panelPos(p, marks) {
  if (!marks || marks.length < 2) return p;
  const n = marks.length;
  if (p <= marks[0]) return (p - marks[0]) / (marks[1] - marks[0]);
  for (let i = 0; i < n - 1; i++) if (p <= marks[i + 1]) return i + (p - marks[i]) / (marks[i + 1] - marks[i]);
  return n - 1 + (p - marks[n - 1]) / (marks[n - 1] - marks[n - 2]);
}

/** A raised quadratic curve between two points (path of a packet). */
export function arcCurve(a, b, lift = 1) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y += lift;
  return new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
}
