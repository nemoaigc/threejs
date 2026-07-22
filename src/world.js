import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createNoise3D } from 'simplex-noise';
import groundUrl from './assets/ground.png';

export const PLANET_RADIUS = 2.15;
export const OCEAN_RADIUS = PLANET_RADIUS;

const noise3 = createNoise3D();

function fbm(x, y, z) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    sum += amp * noise3(x * freq, y * freq, z * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

// domain-warped fbm → organic hills instead of a smooth noise ball
export function terrainHeight(dir) {
  const f = 1.45;
  const wx = fbm(dir.x * f + 1.2, dir.y * f, dir.z * f);
  const wy = fbm(dir.x * f, dir.y * f + 3.4, dir.z * f);
  const base = fbm(dir.x * f + wx * 0.55, dir.y * f + wy * 0.55, dir.z * f);
  // gentle continents: bias toward land so props don't all drown
  const continents = fbm(dir.x * 0.7 + 2.1, dir.y * 0.7, dir.z * 0.7 + 0.4);
  return PLANET_RADIUS * (1 + 0.14 * base + 0.05 * continents);
}

// ---- shared toon look -------------------------------------------------------

function makeGradientMap(steps = 4) {
  const data = new Uint8Array(steps);
  // bright cel bands — shadows stay pastel, never muddy grey
  for (let i = 0; i < steps; i++) data[i] = Math.round(140 + (i / (steps - 1)) * 115);
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
export const gradientMap = makeGradientMap(4);

export function makeToon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap, ...opts });
}

// convert PBR glTF materials → toon while keeping albedo / alpha cutout
function toonifyModel(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const src = o.material;
    const mats = Array.isArray(src) ? src : [src];
    const next = mats.map((m) => {
      const color = m.color ? m.color.clone() : new THREE.Color(0xffffff);
      // lift dark bark / leaf albedo so toon + grade doesn't crush them
      color.offsetHSL(0, 0.04, 0.08);
      const mat = new THREE.MeshToonMaterial({
        color,
        map: m.map || null,
        gradientMap,
        transparent: !!m.transparent,
        opacity: m.opacity ?? 1,
        alphaTest: m.alphaTest > 0 ? m.alphaTest : m.map ? 0.5 : 0,
        side: m.side ?? THREE.FrontSide,
        depthWrite: m.depthWrite !== false,
      });
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        // slightly brighter sampled textures
        mat.color.multiplyScalar(1.08);
      }
      return mat;
    });
    o.material = Array.isArray(src) ? next : next[0];
  });
}

const _up = new THREE.Vector3(0, 1, 0);
function orientTo(obj, dir) {
  obj.quaternion.setFromUnitVectors(_up, dir.clone().normalize());
}

// ---- planet body: unwrapped cube → sphere -----------------------------------

function buildCubeSphere(res) {
  const FACES = [
    { n: [1, 0, 0], r: [0, 0, -1], u: [0, 1, 0] },
    { n: [-1, 0, 0], r: [0, 0, 1], u: [0, 1, 0] },
    { n: [0, 1, 0], r: [1, 0, 0], u: [0, 0, -1] },
    { n: [0, -1, 0], r: [1, 0, 0], u: [0, 0, 1] },
    { n: [0, 0, 1], r: [1, 0, 0], u: [0, 1, 0] },
    { n: [0, 0, -1], r: [-1, 0, 0], u: [0, 1, 0] },
  ];
  const positions = [];
  const indices = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const r = new THREE.Vector3();
  const u = new THREE.Vector3();
  let base = 0;
  for (const f of FACES) {
    n.fromArray(f.n);
    r.fromArray(f.r);
    u.fromArray(f.u);
    for (let y = 0; y <= res; y++) {
      for (let x = 0; x <= res; x++) {
        const sx = (x / res) * 2 - 1;
        const sy = (y / res) * 2 - 1;
        p.copy(n).addScaledVector(r, sx).addScaledVector(u, sy).normalize();
        const h = terrainHeight(p);
        positions.push(p.x * h, p.y * h, p.z * h);
      }
    }
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const a = base + y * (res + 1) + x;
        const b = a + 1;
        const c = a + (res + 1);
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    base += (res + 1) * (res + 1);
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo = mergeVertices(geo);
  geo.computeVertexNormals();
  return geo;
}

function createPlanet(groundTex) {
  const geo = buildCubeSphere(72);
  const mat = makeToon(0xffffff);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tGround = { value: groundTex };
    sh.uniforms.uScale = { value: 0.55 };
    sh.uniforms.uOcean = { value: OCEAN_RADIUS };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n vWNrm = mat3(modelMatrix) * objectNormal;',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D tGround; uniform float uScale; uniform float uOcean;
        varying vec3 vWPos; varying vec3 vWNrm;
        vec3 triplanar(vec3 p, vec3 n){
          vec3 b = pow(abs(n), vec3(6.0)); b /= (b.x + b.y + b.z + 1e-4);
          // low-pass the texture a bit by averaging neighbors → less speckly dirt
          vec2 o = vec2(0.004, 0.0);
          vec3 cx = (texture2D(tGround, p.zy * uScale).rgb
                  + texture2D(tGround, p.zy * uScale + o).rgb
                  + texture2D(tGround, p.zy * uScale - o).rgb) / 3.0;
          vec3 cy = (texture2D(tGround, p.xz * uScale).rgb
                  + texture2D(tGround, p.xz * uScale + o).rgb
                  + texture2D(tGround, p.xz * uScale - o).rgb) / 3.0;
          vec3 cz = (texture2D(tGround, p.xy * uScale).rgb
                  + texture2D(tGround, p.xy * uScale + o).rgb
                  + texture2D(tGround, p.xy * uScale - o).rgb) / 3.0;
          return cx * b.x + cy * b.y + cz * b.z;
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          vec3 tex = triplanar(vWPos, normalize(vWNrm));
          // pull toward clean flat grass — texture is only a soft variation
          vec3 grass = vec3(0.62, 0.84, 0.48);
          vec3 grassDeep = vec3(0.48, 0.74, 0.40);
          float elev = length(vWPos) - uOcean;
          float hMix = smoothstep(0.02, 0.22, elev);
          vec3 baseCol = mix(grass, grassDeep, hMix * 0.45);
          // keep ~25% of texture detail, heavily despeckled + brightened
          vec3 g = mix(baseCol, tex * vec3(0.85, 1.05, 0.70) + 0.18, 0.22);
          g = clamp(g, 0.0, 1.0);

          vec3 sand = vec3(0.96, 0.90, 0.72);
          vec3 land = mix(sand, g, smoothstep(0.0, 0.045, elev));

          // cliffs: soft warm stone, not grey sludge
          float slope = 1.0 - clamp(dot(normalize(vWNrm), normalize(vWPos)), 0.0, 1.0);
          vec3 rock = vec3(0.78, 0.74, 0.66);
          land = mix(land, rock, smoothstep(0.48, 0.78, slope) * 0.85);
          diffuseColor.rgb *= land;
        }`,
      );
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

// ---- ocean ------------------------------------------------------------------

const H_MIN = PLANET_RADIUS * 0.82;
const H_RANGE = PLANET_RADIUS * 0.4;

function bakeHeightMap(w, h) {
  const data = new Uint8Array(w * h);
  const dir = new THREE.Vector3();
  for (let y = 0; y < h; y++) {
    const lat = (y / (h - 1) - 0.5) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = (x / (w - 1)) * Math.PI * 2 - Math.PI;
      dir.set(cl * Math.sin(lon), sl, cl * Math.cos(lon));
      data[y * w + x] = Math.max(0, Math.min(255, ((terrainHeight(dir) - H_MIN) / H_RANGE) * 255));
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RedFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const _oceanStart = performance.now();

function createOcean() {
  const geo = new THREE.IcosahedronGeometry(OCEAN_RADIUS * 0.998, 28);
  const mat = new THREE.ShaderMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      tHeight: { value: bakeHeightMap(512, 256) },
      uOcean: { value: OCEAN_RADIUS },
      uHMin: { value: H_MIN },
      uHRange: { value: H_RANGE },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      varying vec3 vView;
      void main(){
        vDir = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vDir;
      varying vec3 vView;
      uniform sampler2D tHeight;
      uniform float uOcean, uHMin, uHRange, uTime;
      #define PI 3.14159265
      void main(){
        vec3 n = normalize(vDir);
        vec2 uv = vec2(atan(n.x, n.z) / (2.0 * PI) + 0.5, asin(clamp(n.y, -1.0, 1.0)) / PI + 0.5);
        float terr = uHMin + texture2D(tHeight, uv).r * uHRange;
        float depth = uOcean - terr;

        // clean toy-water palette
        vec3 shallow = vec3(0.62, 0.90, 0.92);
        vec3 mid = vec3(0.38, 0.72, 0.86);
        vec3 deep = vec3(0.22, 0.52, 0.74);
        vec3 col = mix(shallow, mid, smoothstep(0.0, 0.10, depth));
        col = mix(col, deep, smoothstep(0.08, 0.26, depth));

        vec3 V = normalize(vView);
        vec3 L = normalize(vec3(0.45, 0.85, 0.25));
        float fres = pow(1.0 - max(dot(n, V), 0.0), 2.8);
        float spec = pow(max(dot(reflect(-L, n), V), 0.0), 64.0) * 0.28;
        col += vec3(1.0) * (spec + fres * 0.10);

        float wave = 0.008 * sin(uv.x * 280.0 + uTime * 1.0)
                   + 0.006 * sin(uv.y * 180.0 - uTime * 0.75);
        float fw = 0.04 + wave;
        float foam = (1.0 - smoothstep(fw * 0.4, fw, depth)) * step(0.0, depth);
        float line = (1.0 - smoothstep(0.004, 0.014, abs(depth - fw - 0.025))) * 0.4;
        col = mix(col, vec3(1.0), max(foam, line) * 0.9);

        float mask = smoothstep(-0.008, 0.01, depth);
        if (mask < 0.02) discard;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = false;
  mesh.userData.noOutline = true;
  mesh.onBeforeRender = () => {
    mat.uniforms.uTime.value = (performance.now() - _oceanStart) * 0.001;
  };
  return mesh;
}

// ---- procedural ground detail ----------------------------------------------

function displace(geo, amp, freq) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + noise3(v.x * freq + 9, v.y * freq + 3, v.z * freq + 5) * amp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

const GREENS = [0x6fbf62, 0x7ed16a, 0x5aa854, 0x8adb72, 0x69c85c];

// 《完美的一天》感：90 年代末北方小镇 —— 粉笔/课本插画式暖色
const WALLS = [0xf3e6d4, 0xe9d5c0, 0xf6efe4, 0xdfc9ae, 0xeee3d4, 0xd8c4a8, 0xc9d4c0];
const ROOFS = [0xb85a48, 0xc46a3a, 0x6a7f8e, 0x8b7355, 0x5e6f5a, 0xa05040];
const AWNINGS = [0xd94a3d, 0x3d8ec9, 0xe8b84a, 0x5bb87a, 0xc45a9a, 0xe07a3a];
const ROAD = 0xb8aea0;
const SIDEWALK = 0xd4ccc0;

function createRock() {
  const m = new THREE.Mesh(
    displace(new THREE.IcosahedronGeometry(0.18, 2), 0.32, 4.2),
    makeToon(0xb0aaa0),
  );
  m.scale.y = 0.62;
  m.castShadow = m.receiveShadow = true;
  return m;
}

function rnd(a, b) {
  return a + Math.random() * (b - a);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- procedural 90s-town buildings (each type has its own massing) ----------
// Inspired by 《完美的一天》: 人教课本/粉蜡笔感的北方小镇公共建筑 + 街边铺

function finishProp(g) {
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

function boxAt(g, w, h, d, x, y, z, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeToon(color));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

function addWindowGrid(g, {
  w, h, d, rows, cols,
  y0 = 0.35, yStep = 0.28, xSpread = 0.72,
  glass = 0x8eb8d0, paneW = 0.14, paneH = 0.16, zFace = null,
} = {}) {
  const glassMat = makeToon(glass);
  const z = zFace ?? d / 2 + 0.016;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols - 0.5) * w * xSpread;
      const y = h * (y0 + r * yStep);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(w * paneW, h * paneH, 0.04), glassMat);
      pane.position.set(x, y, z);
      g.add(pane);
    }
  }
}

function addStripedAwning(g, w, h, d, colors = [0xd94a3d, 0xf0f0f0]) {
  const depth = 0.55;
  const y = h * 0.55;
  const z = d / 2 + depth * 0.35;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(w / n + 0.01, 0.07, depth),
      makeToon(colors[i % colors.length]),
    );
    strip.position.set(((i + 0.5) / n - 0.5) * w, y, z);
    strip.rotation.x = -0.22;
    g.add(strip);
  }
}

function addRedCross(g, x, y, z, size = 0.55) {
  const mat = makeToon(0xd94a3d);
  const hx = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.28, 0.08), mat);
  const hy = new THREE.Mesh(new THREE.BoxGeometry(size * 0.28, size, 0.08), mat);
  hx.position.set(x, y, z);
  hy.position.set(x, y, z);
  g.add(hx, hy);
}

// —— 民居：坡顶小院 ——
function createResidence() {
  const g = new THREE.Group();
  const w = rnd(1.6, 2.3);
  const d = rnd(1.4, 1.9);
  const h = rnd(1.2, 1.55);
  boxAt(g, w, h, d, 0, h / 2, 0, pick(WALLS));
  // gable roof (two slabs) — more "北方平房" than hip cone
  const roofMat = makeToon(pick(ROOFS));
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, 0.1, d * 0.7), roofMat);
  roofL.position.set(0, h + 0.2, -d * 0.16);
  roofL.rotation.x = 0.48;
  g.add(roofL);
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, 0.1, d * 0.7), roofMat);
  roofR.position.set(0, h + 0.2, d * 0.16);
  roofR.rotation.x = -0.48;
  g.add(roofR);
  boxAt(g, w * 0.2, h * 0.42, 0.06, -w * 0.18, h * 0.21, d / 2 + 0.02, 0x5a4030);
  addWindowGrid(g, { w, h, d, rows: 1, cols: 2, y0: 0.48, paneW: 0.16, paneH: 0.18 });
  if (Math.random() > 0.4) {
    boxAt(g, 0.16, 0.4, 0.16, w * 0.3, h + 0.35, -d * 0.1, 0x8a7a6c);
  }
  // low courtyard wall
  boxAt(g, w * 1.15, 0.38, 0.1, 0, 0.19, d / 2 + 0.7, 0xcfc4b4);
  return finishProp(g);
}

// —— 筒子楼 / 单位宿舍：高、横条阳台、密窗 ——
function createApartment() {
  const g = new THREE.Group();
  const w = rnd(2.8, 3.8);
  const d = rnd(1.5, 2.0);
  const floors = 4 + Math.floor(Math.random() * 2);
  const story = 0.78;
  const h = floors * story;
  boxAt(g, w, h, d, 0, h / 2, 0, pick([0xe0d2bc, 0xd0c4b0, 0xc8d0c0, 0xd8c8b4]));
  boxAt(g, w * 1.06, 0.16, d * 1.08, 0, h + 0.08, 0, pick([0x6a7f8e, 0x8b7355]));
  for (let f = 0; f < floors; f++) {
    const y = (f + 0.55) * story;
    // continuous balcony rail
    boxAt(g, w * 0.94, 0.08, 0.2, 0, y - 0.18, d / 2 + 0.12, 0xc8c0b4);
    for (let c = 0; c < 4; c++) {
      const x = ((c + 0.5) / 4 - 0.5) * w * 0.78;
      boxAt(g, w * 0.14, story * 0.38, 0.04, x, y, d / 2 + 0.02, 0x88b0c8);
    }
  }
  boxAt(g, 0.45, 0.85, 0.08, 0, 0.42, d / 2 + 0.03, 0x3d3530);
  return finishProp(g);
}

// —— 小卖部：矮、大橱窗、彩条雨棚、门口台阶 ——
function createStore() {
  const g = new THREE.Group();
  const w = rnd(2.0, 2.5);
  const d = rnd(1.5, 1.8);
  const h = 1.45;
  boxAt(g, w, h, d, 0, h / 2, 0, pick([0xfff6e8, 0xf6efe0, 0xeef4e6]));
  boxAt(g, w * 1.1, 0.12, d * 1.12, 0, h + 0.06, 0, pick(ROOFS));
  addStripedAwning(g, w, h, d, [pick(AWNINGS), 0xf5f0e6]);
  // big glass vitrine
  boxAt(g, w * 0.72, h * 0.42, 0.05, -w * 0.06, h * 0.42, d / 2 + 0.02, 0xb8dcec);
  // goods shelves hint inside glass
  boxAt(g, w * 0.55, 0.12, 0.08, -w * 0.06, h * 0.32, d / 2 + 0.06, pick([0xe8b84a, 0xd94a3d, 0x5bb87a]));
  boxAt(g, 0.34, h * 0.55, 0.06, w * 0.34, h * 0.28, d / 2 + 0.02, 0x6a5040);
  // hanging sign board
  boxAt(g, w * 0.55, 0.28, 0.06, 0, h * 0.88, d / 2 + 0.08, 0xd94a3d);
  boxAt(g, w * 0.5, 0.04, 0.5, 0, 0.02, d / 2 + 0.25, 0xcfc4b4); // step
  return finishProp(g);
}

// —— 理发店：窄面宽、三色转灯、镜面大窗 ——
function createBarber() {
  const g = new THREE.Group();
  const w = 1.7;
  const d = 1.5;
  const h = 1.55;
  boxAt(g, w, h, d, 0, h / 2, 0, 0xf8f4ee);
  boxAt(g, w * 1.08, 0.1, d * 1.1, 0, h + 0.05, 0, 0x3d8ec9);
  addStripedAwning(g, w, h, d, [0xd94a3d, 0xf0f0f0, 0x3d8ec9]);
  boxAt(g, w * 0.75, h * 0.45, 0.05, 0, h * 0.45, d / 2 + 0.02, 0xc8e4f0);
  // classic barber pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.95, 10), makeToon(0xf0f0f0));
  pole.position.set(w * 0.55, 0.7, d / 2 + 0.22);
  g.add(pole);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.02, 6, 12),
      makeToon(i % 2 ? 0xd94a3d : 0x3d8ec9),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(w * 0.55, 0.35 + i * 0.16, d / 2 + 0.22);
    g.add(ring);
  }
  boxAt(g, w * 0.5, 0.22, 0.05, 0, h * 0.88, d / 2 + 0.06, 0x3d8ec9);
  return finishProp(g);
}

// —— 录像厅 / 游戏厅：深色、霓虹、无大窗 ——
function createVideoHall() {
  const g = new THREE.Group();
  const w = 2.8;
  const d = 2.0;
  const h = 2.1;
  boxAt(g, w, h, d, 0, h / 2, 0, 0x2a2838);
  boxAt(g, w * 1.05, 0.14, d * 1.08, 0, h + 0.07, 0, 0x1a1824);
  // neon marquee
  boxAt(g, w * 0.95, 0.35, 0.1, 0, h * 0.82, d / 2 + 0.06, pick([0xff4ad4, 0x4affd4, 0xffe04a]));
  boxAt(g, w * 0.7, 0.12, 0.08, 0, h * 0.82, d / 2 + 0.12, 0x1a1020);
  // dark glass door + poster boxes
  boxAt(g, 0.55, h * 0.55, 0.06, 0, h * 0.3, d / 2 + 0.02, 0x121018);
  boxAt(g, 0.4, 0.7, 0.05, -w * 0.35, h * 0.45, d / 2 + 0.03, 0xd94a3d);
  boxAt(g, 0.4, 0.7, 0.05, w * 0.35, h * 0.45, d / 2 + 0.03, 0x3d8ec9);
  return finishProp(g);
}

// —— 小吃摊 / 煎饼果子铺：半开放柜台 + 油布棚 ——
function createSnackShop() {
  const g = new THREE.Group();
  const w = 2.2;
  const d = 1.4;
  const h = 1.2;
  boxAt(g, w, h * 0.55, d, 0, h * 0.28, 0, 0xc4a070);
  // open upper / poles + tarp
  for (const sx of [-w * 0.42, w * 0.42]) {
    for (const sz of [-d * 0.35, d * 0.35]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 5), makeToon(0x8a8070));
      pole.position.set(sx, 0.95, sz);
      g.add(pole);
    }
  }
  boxAt(g, w * 1.15, 0.08, d * 1.2, 0, 1.75, 0, pick([0xe8b84a, 0xd94a3d, 0x5bb87a]));
  boxAt(g, w * 0.85, 0.2, d * 0.55, 0, 0.75, 0.05, pick([0xffe8a0, 0xf0d0a0]));
  // steam chimney pot
  boxAt(g, 0.25, 0.2, 0.25, w * 0.25, 0.85, -d * 0.15, 0x5a5048);
  return finishProp(g);
}

// —— 邮电局：绿墙、国徽感匾额、比店铺宽 ——
function createPostOffice() {
  const g = new THREE.Group();
  const w = 4.2;
  const d = 2.4;
  const h = 2.3;
  boxAt(g, w, h, d, 0, h / 2, 0, 0xd8e8d4);
  boxAt(g, w * 1.04, 0.18, d * 1.08, 0, h + 0.09, 0, 0x3d7a4a);
  // green cornice band
  boxAt(g, w * 1.02, 0.2, 0.12, 0, h * 0.78, d / 2 + 0.02, 0x2f8a4a);
  // emblem circle + plaque
  const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), makeToon(0xd4a84a));
  emblem.rotation.x = Math.PI / 2;
  emblem.position.set(0, h * 0.88, d / 2 + 0.06);
  g.add(emblem);
  boxAt(g, w * 0.55, 0.28, 0.06, 0, h * 0.72, d / 2 + 0.05, 0x2f6a3a);
  addWindowGrid(g, { w, h, d, rows: 2, cols: 4, y0: 0.28, yStep: 0.28, paneW: 0.12, paneH: 0.14, glass: 0x7aafc0 });
  // double door
  boxAt(g, 0.7, 1.0, 0.08, 0, 0.5, d / 2 + 0.03, 0x3d5a40);
  // mailbox out front
  boxAt(g, 0.35, 0.7, 0.35, w * 0.4, 0.35, d / 2 + 0.55, 0x2f8a4a);
  return finishProp(g);
}

// —— 医院：大、白、翼楼、门廊、红十字顶饰 —— 绝不是小卖部
function createHospital() {
  const g = new THREE.Group();
  // main block (3 floors)
  const mw = 7.5;
  const md = 3.2;
  const mh = 3.4;
  boxAt(g, mw, mh, md, 0, mh / 2, 0, 0xf4f2ec);
  // side wings (lower)
  const ww = 2.8;
  const wh = 2.4;
  const wd = 2.6;
  boxAt(g, ww, wh, wd, -mw * 0.55, wh / 2, 0.2, 0xefeae0);
  boxAt(g, ww, wh, wd, mw * 0.55, wh / 2, 0.2, 0xefeae0);
  // flat roofs + green edge (90s clinic look)
  boxAt(g, mw * 1.04, 0.14, md * 1.08, 0, mh + 0.07, 0, 0x6a9a7a);
  boxAt(g, ww * 1.05, 0.12, wd * 1.08, -mw * 0.55, wh + 0.06, 0.2, 0x6a9a7a);
  boxAt(g, ww * 1.05, 0.12, wd * 1.08, mw * 0.55, wh + 0.06, 0.2, 0x6a9a7a);
  // entrance canopy / porte-cochère
  boxAt(g, 2.4, 0.12, 1.6, 0, 1.55, md / 2 + 0.7, 0xe8e4dc);
  for (const sx of [-0.95, 0.95]) {
    boxAt(g, 0.14, 1.55, 0.14, sx, 0.78, md / 2 + 1.2, 0xd0ccc4);
  }
  // steps
  boxAt(g, 2.2, 0.12, 0.9, 0, 0.06, md / 2 + 0.55, 0xcfc8bc);
  // glass curtain entrance
  boxAt(g, 1.5, 1.3, 0.08, 0, 0.85, md / 2 + 0.04, 0x9ecce0);
  // ward windows — main facade
  addWindowGrid(g, {
    w: mw, h: mh, d: md, rows: 3, cols: 6,
    y0: 0.22, yStep: 0.26, paneW: 0.09, paneH: 0.12, glass: 0x8ebfd4,
  });
  // wing facades (offset in X)
  for (const wx of [-mw * 0.55, mw * 0.55]) {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const x = wx + ((c + 0.5) / 3 - 0.5) * ww * 0.7;
        const y = wh * (0.32 + r * 0.32);
        boxAt(g, ww * 0.16, wh * 0.16, 0.04, x, y, 0.2 + wd / 2 + 0.02, 0x8ebfd4);
      }
    }
  }
  // rooftop red cross (big, readable silhouette)
  addRedCross(g, 0, mh + 0.55, 0, 0.9);
  // facade cross above entrance
  addRedCross(g, 0, mh * 0.78, md / 2 + 0.08, 0.65);
  // ambulance bay stripe on ground
  boxAt(g, 1.8, 0.03, 3.0, mw * 0.35, 0.02, md / 2 + 1.5, 0xd94a3d);
  // chimney / boiler stack behind
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.2, 8), makeToon(0xb0a89c));
  stack.position.set(-mw * 0.2, mh + 0.9, -md * 0.2);
  g.add(stack);
  return finishProp(g);
}

// —— 小学：长教学楼 + 门房 + 旗杆 + 操场感 ——
function createSchool() {
  const g = new THREE.Group();
  // main teaching building (long)
  const w = 9.0;
  const d = 2.4;
  const h = 2.8;
  boxAt(g, w, h, d, 0, h / 2, -1.2, 0xece2d0);
  boxAt(g, w * 1.02, 0.16, d * 1.1, 0, h + 0.08, -1.2, 0xb85a48);
  // corridor strip (lighter band)
  boxAt(g, w * 0.98, 0.35, 0.1, 0, h * 0.48, -1.2 + d / 2 + 0.02, 0xf5efe4);
  addWindowGrid(g, {
    w, h, d, rows: 3, cols: 8,
    y0: 0.2, yStep: 0.26, paneW: 0.08, paneH: 0.14, glass: 0x7aafc8,
    zFace: -1.2 + d / 2 + 0.02,
  });
  // side stair towers
  boxAt(g, 1.3, h + 0.3, 1.5, -w * 0.5 - 0.4, (h + 0.3) / 2, -1.2, 0xe0d4c0);
  boxAt(g, 1.3, h + 0.3, 1.5, w * 0.5 + 0.4, (h + 0.3) / 2, -1.2, 0xe0d4c0);
  // gatehouse
  boxAt(g, 1.4, 1.4, 1.2, -2.2, 0.7, 2.5, 0xe8dcc8);
  boxAt(g, 1.4, 1.4, 1.2, 2.2, 0.7, 2.5, 0xe8dcc8);
  boxAt(g, 5.2, 0.12, 0.35, 0, 1.55, 2.5, 0xb85a48); // gate beam
  // flagpole + flag
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 4.2, 6), makeToon(0x9a9a9a));
  pole.position.set(0, 2.1, 3.6);
  g.add(pole);
  boxAt(g, 0.85, 0.5, 0.04, 0.4, 3.9, 3.6, 0xd94a3d);
  // playground court (no outline)
  const court = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), makeToon(0xc4b8a4));
  court.rotation.x = -Math.PI / 2;
  court.position.set(0, 0.02, 1.2);
  court.receiveShadow = true;
  court.userData.noOutline = true;
  g.add(court);
  return finishProp(g);
}

// —— 铝厂：锯齿厂房 + 高烟囱 + 灰墙 ——
function createFactory() {
  const g = new THREE.Group();
  const w = 8.5;
  const d = 4.0;
  const h = 2.8;
  boxAt(g, w, h, d, 0, h / 2, 0, 0xb0a89c);
  // sawtooth roof bays
  const bays = 5;
  for (let i = 0; i < bays; i++) {
    const x = ((i + 0.5) / bays - 0.5) * w;
    const bay = new THREE.Mesh(new THREE.BoxGeometry(w / bays + 0.08, 0.12, d * 0.95), makeToon(0x8a9088));
    bay.position.set(x, h + 0.35, 0);
    bay.rotation.z = i % 2 === 0 ? 0.4 : -0.15;
    g.add(bay);
    // glass north-light strip
    if (i % 2 === 0) {
      boxAt(g, w / bays * 0.7, 0.35, 0.06, x, h + 0.15, d * 0.35, 0x7a9aaa);
    }
  }
  // office annex
  boxAt(g, 2.5, 2.0, 2.0, -w * 0.4, 1.0, d * 0.55, 0xc8c0b4);
  addWindowGrid(g, {
    w: 2.5, h: 2.0, d: 2.0, rows: 2, cols: 3,
    y0: 0.3, yStep: 0.3, paneW: 0.16, paneH: 0.16,
    zFace: d * 0.55 + 1.0 + 0.02,
  });
  // giant chimney
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 5.5, 10), makeToon(0x8a7a6c));
  stack.position.set(w * 0.35, 2.75, -d * 0.15);
  g.add(stack);
  boxAt(g, 1.0, 0.3, 1.0, w * 0.35, 5.5, -d * 0.15, 0x5a5048);
  // loading door
  boxAt(g, w * 0.28, h * 0.55, 0.1, 0, h * 0.28, d / 2 + 0.04, 0x4a4540);
  return finishProp(g);
}

// —— 市集棚：油布顶排档 ——
function createMarketStall() {
  const g = new THREE.Group();
  const w = rnd(1.5, 2.1);
  const d = rnd(1.1, 1.4);
  boxAt(g, w, 0.7, d, 0, 0.35, 0, 0xc4a882);
  for (const sx of [-w * 0.4, w * 0.4]) {
    for (const sz of [-d * 0.35, d * 0.35]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.55, 5), makeToon(0x8a8070));
      pole.position.set(sx, 0.85, sz);
      g.add(pole);
    }
  }
  boxAt(g, w * 1.12, 0.07, d * 1.18, 0, 1.6, 0, pick(AWNINGS));
  boxAt(g, w * 0.75, 0.22, d * 0.5, 0, 0.85, 0, pick([0xe8b84a, 0xd94a3d, 0x5bb87a, 0x3d8ec9]));
  return finishProp(g);
}

function createKiosk() {
  // 红色报刊亭 — 六角小体量
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 1.7, 6), makeToon(0xd94a3d));
  body.position.y = 0.85;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.45, 6), makeToon(0xf0e8d8));
  roof.position.y = 1.95;
  g.add(roof);
  boxAt(g, 0.7, 0.45, 0.08, 0, 1.0, 0.72, 0xb0d8e8);
  return finishProp(g);
}

function createPhoneBooth() {
  const g = new THREE.Group();
  boxAt(g, 0.55, 1.55, 0.55, 0, 0.78, 0, 0x3d8ec9);
  boxAt(g, 0.4, 0.75, 0.04, 0, 0.95, 0.28, 0xb0d8e8);
  boxAt(g, 0.65, 0.1, 0.65, 0, 1.58, 0, 0x2a5a8a);
  return finishProp(g);
}

function createWaterTower() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 5), makeToon(0x8a8070));
    leg.position.set(Math.cos(a) * 0.55, 1.4, Math.sin(a) * 0.55);
    g.add(leg);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.1, 14), makeToon(0xb8c0b0));
  tank.position.y = 3.0;
  g.add(tank);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.45, 14), makeToon(0x8a9088));
  cap.position.y = 3.75;
  g.add(cap);
  return finishProp(g);
}

function createBusStop() {
  const g = new THREE.Group();
  boxAt(g, 2.6, 0.1, 1.0, 0, 1.55, 0, 0x3d8ec9);
  for (const x of [-1.15, 1.15]) boxAt(g, 0.1, 1.55, 0.1, x, 0.78, -0.35, 0x8a8a8a);
  boxAt(g, 1.8, 0.1, 0.45, 0, 0.48, 0.1, 0xc4a882);
  boxAt(g, 0.55, 0.8, 0.06, 1.45, 1.15, 0.15, 0x3d8ec9);
  return finishProp(g);
}

function createStreetLight() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.8, 6), makeToon(0x6a6a6a));
  pole.position.y = 1.4;
  g.add(pole);
  boxAt(g, 0.55, 0.06, 0.06, 0.22, 2.7, 0, 0x6a6a6a);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), makeToon(0xfff0c0));
  lamp.position.set(0.48, 2.6, 0);
  g.add(lamp);
  return finishProp(g);
}

function createBillboard() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.0, 6), makeToon(0x8a8a8a));
  pole.position.y = 1.5;
  g.add(pole);
  boxAt(g, 2.4, 1.35, 0.1, 0, 2.7, 0, pick([0xd94a3d, 0x3d8ec9, 0xe8b84a, 0x5bb87a]));
  return finishProp(g);
}

function createBush() {
  const g = new THREE.Group();
  const blobs = [
    [0, 0.11, 0, 0.15],
    [-0.12, 0.07, 0.04, 0.11],
    [0.11, 0.06, -0.03, 0.10],
  ];
  blobs.forEach(([x, y, z, r], i) => {
    const b = new THREE.Mesh(
      displace(new THREE.IcosahedronGeometry(r, 2), 0.18, 7),
      makeToon(GREENS[(i + 1) % GREENS.length]),
    );
    b.position.set(x, y, z);
    g.add(b);
  });
  g.traverse((o) => {
    o.castShadow = true;
    o.receiveShadow = true;
  });
  return g;
}

// ---- clouds -----------------------------------------------------------------

function createClouds() {
  const group = new THREE.Group();
  const mat = makeToon(0xffffff);
  mat.transparent = true;
  mat.opacity = 0.95;
  mat.depthWrite = false;

  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const n = 3 + (i % 3);
    for (let j = 0; j < n; j++) {
      const r = 0.18 + Math.random() * 0.22;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      puff.position.set((j - n * 0.5) * 0.22 + Math.random() * 0.06, Math.random() * 0.08, (Math.random() - 0.5) * 0.12);
      puff.scale.y = 0.55 + Math.random() * 0.2;
      cloud.add(puff);
    }
    const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    // bias clouds toward equator / upper hemisphere for nicer silhouette
    dir.y = Math.abs(dir.y) * 0.55 + 0.25;
    dir.normalize();
    const radius = PLANET_RADIUS * (1.55 + Math.random() * 0.35);
    cloud.position.copy(dir).multiplyScalar(radius);
    orientTo(cloud, dir);
    cloud.rotateY(Math.random() * Math.PI * 2);
    cloud.scale.setScalar(0.7 + Math.random() * 0.9);
    cloud.userData.noOutline = true;
    cloud.traverse((o) => {
      o.castShadow = false;
      o.receiveShadow = false;
      o.userData.noOutline = true;
    });
    group.add(cloud);
  }
  group.userData.noOutline = true;
  return group;
}

// ---- sky --------------------------------------------------------------------

function createSky() {
  const geo = new THREE.SphereGeometry(60, 40, 28);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(0x8ec8e8) },
      uHorizon: { value: new THREE.Color(0xeaf7f8) },
      uGround: { value: new THREE.Color(0xd8f0dc) },
      uSunDir: { value: new THREE.Vector3(0.45, 0.75, 0.35).normalize() },
      uSunColor: { value: new THREE.Color(0xfff6d8) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uZenith, smoothstep(-0.05, 0.75, h));
        col = mix(uGround, col, smoothstep(-0.55, 0.05, h));
        // soft sun disc + bloom glow
        float sun = pow(max(dot(d, uSunDir), 0.0), 180.0);
        float glow = pow(max(dot(d, uSunDir), 0.0), 8.0) * 0.22;
        col += uSunColor * (sun * 1.4 + glow);
        // gentle horizon haze
        col = mix(col, uHorizon, exp(-max(h, 0.0) * 3.5) * 0.18);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.userData.noOutline = true;
  return mesh;
}

// ---- scattering helpers -----------------------------------------------------

const _tangent = new THREE.Vector3();
const _bitangent = new THREE.Vector3();
const _sampleDir = new THREE.Vector3();
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

// lowest terrain height under a circular footprint on the sphere
function footprintMinHeight(dir, radius, samples = 10) {
  let minH = terrainHeight(dir);
  if (radius < 1e-4) return minH;
  // stable tangent basis around surface normal `dir`
  _tangent.set(0, 1, 0).cross(dir);
  if (_tangent.lengthSq() < 1e-6) _tangent.set(1, 0, 0).cross(dir);
  _tangent.normalize();
  _bitangent.crossVectors(dir, _tangent).normalize();
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    // angular offset ≈ arc length / radius
    const ang = radius / Math.max(PLANET_RADIUS, 0.01);
    _sampleDir
      .copy(dir)
      .addScaledVector(_tangent, Math.cos(a) * Math.sin(ang))
      .addScaledVector(_bitangent, Math.sin(a) * Math.sin(ang))
      .normalize();
    minH = Math.min(minH, terrainHeight(_sampleDir));
  }
  return minH;
}

function scatterOnPlanet(
  group,
  factory,
  count,
  { minElev = 0.03, scale = [0.85, 1.2], extraSink = 0.025, maxSlope = 0.55 } = {},
) {
  const dir = new THREE.Vector3();
  let placed = 0;
  let tries = 0;
  while (placed < count && tries < count * 80) {
    tries++;
    dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (dir.lengthSq() < 0.02) continue;
    dir.normalize();
    // keep a clear pad at the north pole (character spawn)
    if (dir.y > 0.9) continue;
    const hCenter = terrainHeight(dir);
    if (hCenter - OCEAN_RADIUS < minElev * PLANET_RADIUS) continue;

    const obj = typeof factory === 'function' ? factory() : factory.clone(true);
    const s = scale[0] + Math.random() * (scale[1] - scale[0]);
    obj.scale.multiplyScalar(s);
    orientTo(obj, dir);
    obj.rotateY(Math.random() * Math.PI * 2);

    // measure sole after orientation (local Y up along normal)
    obj.position.set(0, 0, 0);
    obj.updateMatrixWorld(true);
    _box.setFromObject(obj);
    _box.getSize(_size);
    const halfW = 0.5 * Math.hypot(_size.x, _size.z);
    const soleY = _box.min.y; // should be ~0 for our templates

    // slope gate using terrain gradient
    _tangent.set(0, 1, 0).cross(dir);
    if (_tangent.lengthSq() < 1e-6) _tangent.set(1, 0, 0).cross(dir);
    _tangent.normalize();
    const h1 = terrainHeight(_sampleDir.copy(dir).addScaledVector(_tangent, 0.05).normalize());
    if (Math.abs(h1 - hCenter) / 0.05 > maxSlope) continue;

    const h = footprintMinHeight(dir, Math.max(halfW * 0.95, 0.04), 14);
    if (h - OCEAN_RADIUS < minElev * PLANET_RADIUS * 0.6) continue;

    const curveSink = h - Math.sqrt(Math.max(h * h - halfW * halfW, 0));
    // bury the sole slightly into the dirt so no light leaks under
    const bury = extraSink + curveSink + Math.max(0, -soleY) + halfW * 0.04;
    obj.position.copy(dir).multiplyScalar(h - bury);

    group.add(obj);
    placed++;
  }
  return placed;
}

// ---- glTF templates ---------------------------------------------------------

const gltfLoader = new GLTFLoader();
const BASE = import.meta.env.BASE_URL;

async function loadTemplate(url, targetHeight) {
  const gltf = await gltfLoader.loadAsync(url);
  const model = gltf.scene;
  toonifyModel(model);
  let box = new THREE.Box3().setFromObject(model);
  model.scale.setScalar(targetHeight / Math.max(box.getSize(new THREE.Vector3()).y, 0.001));
  box = new THREE.Box3().setFromObject(model);
  const c = box.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  const wrapper = new THREE.Group();
  wrapper.add(model);
  return wrapper;
}

// ---- assemble ---------------------------------------------------------------

export async function createWorld(scene, loader) {
  const planetGroup = new THREE.Group();

  const groundTex = await loader.loadAsync(groundUrl);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.magFilter = THREE.LinearFilter;
  groundTex.minFilter = THREE.LinearMipmapLinearFilter;
  groundTex.generateMipmaps = true;
  groundTex.anisotropy = 16;

  planetGroup.add(createPlanet(groundTex));
  planetGroup.add(createOcean());

  // proportions vs character (~0.75 tall after scale): trees tall, houses mid
  const [trees, houses] = await Promise.all([
    Promise.all(
      ['common', 'pine', 'birch', 'maple', 'twisted', 'common2'].map((n) =>
        loadTemplate(`${BASE}models/tree-${n}.glb`, 0.95),
      ),
    ),
    Promise.all(['0', '1', '2', '3'].map((n) => loadTemplate(`${BASE}models/house-${n}.glb`, 0.58))),
  ]);

  const pick = (arr) => () => arr[Math.floor(Math.random() * arr.length)].clone(true);

  // houses need flatter ground + deeper bury (wide footprint on a tiny sphere)
  scatterOnPlanet(planetGroup, pick(houses), 9, {
    minElev: 0.06,
    scale: [0.75, 1.0],
    extraSink: 0.04,
    maxSlope: 0.35,
  });
  scatterOnPlanet(planetGroup, pick(trees), 24, {
    minElev: 0.05,
    scale: [0.75, 1.15],
    extraSink: 0.03,
    maxSlope: 0.5,
  });
  scatterOnPlanet(planetGroup, createRock, 18, {
    minElev: 0.0,
    scale: [0.55, 1.25],
    extraSink: 0.035,
    maxSlope: 0.85,
  });
  scatterOnPlanet(planetGroup, createBush, 26, {
    minElev: 0.03,
    scale: [0.65, 1.1],
    extraSink: 0.025,
    maxSlope: 0.6,
  });

  const clouds = createClouds();
  planetGroup.add(clouds);

  scene.add(planetGroup);

  const sky = createSky();
  scene.add(sky);

  return { planetGroup, sky, clouds };
}

// plant any object so its lowest point sits on y=0 (flat ground)
function plantOnFlat(obj, x, z, yaw = 0, scale = 1) {
  obj.position.set(0, 0, 0);
  obj.rotation.set(0, 0, 0);
  obj.scale.setScalar(1);
  if (scale !== 1) obj.scale.multiplyScalar(scale);
  obj.rotation.y = yaw;
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj);
  obj.position.set(x, -_box.min.y - 0.012, z);
  return obj;
}

function scatterFlat(group, factory, count, { minR = 5, maxR = 28, scale = [0.85, 1.2] } = {}) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const t = Math.sqrt(Math.random());
    const r = minR + t * (maxR - minR);
    const obj = typeof factory === 'function' ? factory() : factory.clone(true);
    const s = scale[0] + Math.random() * (scale[1] - scale[0]);
    plantOnFlat(obj, Math.cos(a) * r, Math.sin(a) * r, Math.random() * Math.PI * 2, s);
    group.add(obj);
  }
}

function makeRoadPlane(w, d, color = ROAD) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), makeToon(color));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.008;
  m.receiveShadow = true;
  m.userData.noOutline = true;
  return m;
}

// place a row of buildings facing +Z (toward street), along local X
function placeStreetRow(group, factories, { x0, z, count, spacing, faceYaw = 0, jitter = 0.15 }) {
  for (let i = 0; i < count; i++) {
    const factory = factories[i % factories.length];
    const obj = typeof factory === 'function' ? factory() : factory.clone(true);
    const x = x0 + i * spacing + rnd(-jitter, jitter);
    const zz = z + rnd(-jitter * 0.5, jitter * 0.5);
    plantOnFlat(obj, x, zz, faceYaw, rnd(0.92, 1.08));
    group.add(obj);
  }
}

// 《完美的一天》感：90 年代末小镇街区 —— 十字主街 + 住宅巷 + 学校/厂/市集
export async function createFlatWorld(scene, loader) {
  const groundTex = await loader.loadAsync(groundUrl);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(10, 10);
  groundTex.magFilter = THREE.LinearFilter;
  groundTex.minFilter = THREE.LinearMipmapLinearFilter;
  groundTex.generateMipmaps = true;
  groundTex.anisotropy = 16;

  const groundMat = makeToon(0x7ec85a);
  groundMat.map = groundTex;
  groundMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       #ifdef USE_MAP
         vec3 grass = vec3(0.52, 0.74, 0.40);
         diffuseColor.rgb = mix(grass, diffuseColor.rgb * vec3(0.9, 1.05, 0.75) + 0.1, 0.24);
       #endif`,
    );
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.userData.noOutline = true;
  scene.add(ground);

  const sky = createSky();
  scene.add(sky);

  const clouds = new THREE.Group();
  const cloudMat = makeToon(0xffffff);
  cloudMat.transparent = true;
  cloudMat.opacity = 0.92;
  cloudMat.depthWrite = false;
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const n = 3 + (i % 3);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.6 + Math.random() * 0.5, 10, 8), cloudMat);
      puff.position.set((j - n * 0.5) * 0.75, Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
      puff.scale.y = 0.5;
      cloud.add(puff);
    }
    cloud.position.set((Math.random() - 0.5) * 90, 10 + Math.random() * 5, (Math.random() - 0.5) * 90);
    cloud.userData.noOutline = true;
    cloud.traverse((o) => {
      o.castShadow = false;
      o.userData.noOutline = true;
    });
    clouds.add(cloud);
  }
  clouds.userData.noOutline = true;
  scene.add(clouds);

  const group = new THREE.Group();
  scene.add(group);

  // ---- roads: cross main streets + ring sidewalks ----
  const roads = new THREE.Group();
  roads.userData.noOutline = true;
  // E-W main street
  const roadEW = makeRoadPlane(90, 5.5);
  roadEW.position.set(0, 0.008, 0);
  roads.add(roadEW);
  // N-S main street
  const roadNS = makeRoadPlane(5.5, 90);
  roadNS.position.set(0, 0.009, 0);
  roads.add(roadNS);
  // side streets
  for (const z of [-18, 18, -32, 32]) {
    const r = makeRoadPlane(70, 3.6);
    r.position.set(0, 0.008, z);
    roads.add(r);
  }
  for (const x of [-18, 18, -32, 32]) {
    const r = makeRoadPlane(3.6, 50);
    r.position.set(x, 0.008, 0);
    roads.add(r);
  }
  // plaza at center (schoolyard / 广场)
  const plaza = makeRoadPlane(14, 14, SIDEWALK);
  plaza.position.set(0, 0.01, 0);
  roads.add(plaza);
  // road dashes
  for (let i = -40; i <= 40; i += 3.5) {
    if (Math.abs(i) < 6) continue;
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.18), makeToon(0xe8e0d0));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(i, 0.012, 0);
    dash.userData.noOutline = true;
    roads.add(dash);
    const dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.4), makeToon(0xe8e0d0));
    dash2.rotation.x = -Math.PI / 2;
    dash2.position.set(0, 0.012, i);
    dash2.userData.noOutline = true;
    roads.add(dash2);
  }
  scene.add(roads);

  // ---- load glTF accents (mix with procedural for variety) ----
  const [trees, gltfHouses] = await Promise.all([
    Promise.all(
      ['common', 'pine', 'birch', 'maple', 'twisted', 'common2'].map((n) =>
        loadTemplate(`${BASE}models/tree-${n}.glb`, 3.2),
      ),
    ),
    Promise.all(['0', '1', '2', '3'].map((n) => loadTemplate(`${BASE}models/house-${n}.glb`, 2.2))),
  ]);
  const treePick = () => trees[Math.floor(Math.random() * trees.length)].clone(true);
  const gltfHouse = () => gltfHouses[Math.floor(Math.random() * gltfHouses.length)].clone(true);

  // ---- civic landmarks: each gets its own plot & correct facing ----
  // 小学：南侧，面向广场
  {
    const school = createSchool();
    plantOnFlat(school, 0, -14, 0, 1);
    group.add(school);
  }
  // 医院：东北角大地块（体量大，不进商业街）
  {
    const hospital = createHospital();
    plantOnFlat(hospital, 22, 20, Math.PI, 1);
    group.add(hospital);
  }
  // 邮电局：西主街转角
  {
    const post = createPostOffice();
    plantOnFlat(post, -14, 6.5, Math.PI, 1);
    group.add(post);
  }
  // 铝厂：西南远郊
  {
    const factory = createFactory();
    plantOnFlat(factory, -32, -30, Math.PI * 0.15, 1);
    group.add(factory);
  }
  {
    const tower = createWaterTower();
    plantOnFlat(tower, 34, -28, 0, 1);
    group.add(tower);
  }
  {
    const bus = createBusStop();
    plantOnFlat(bus, 9, 3.4, Math.PI, 1);
    group.add(bus);
  }
  {
    const bus2 = createBusStop();
    plantOnFlat(bus2, -10, -3.4, 0, 1);
    group.add(bus2);
  }

  // ---- street shops only (real small commerce, never hospital/post) ----
  // E-W north strip (face south)
  const shopsN = [
    createStore, createSnackShop, createBarber, createVideoHall,
    createStore, createKiosk, createBarber, createSnackShop,
    createVideoHall, createStore, createKiosk, createBarber,
  ];
  placeStreetRow(group, shopsN, { x0: -30, z: 5.4, count: 12, spacing: 4.4, faceYaw: Math.PI, jitter: 0.15 });

  // E-W south strip (face north) — leave gap for school frontage
  const shopsS = [
    createStore, createSnackShop, createKiosk, createVideoHall,
    createBarber, createStore, createSnackShop, createVideoHall,
    createBarber, createStore,
  ];
  placeStreetRow(group, shopsS, { x0: -26, z: -5.4, count: 5, spacing: 4.5, faceYaw: 0, jitter: 0.15 });
  placeStreetRow(group, shopsS, { x0: 8, z: -5.4, count: 5, spacing: 4.5, faceYaw: 0, jitter: 0.15 });

  // N-S street shops
  {
    const kinds = [createStore, createSnackShop, createBarber, createKiosk, createVideoHall, createStore, createBarber, createSnackShop];
    kinds.forEach((f, i) => {
      // skip school zone on south arm
      const z = -22 + i * 4.5;
      if (z > -18 && z < -6) return;
      const obj = f();
      plantOnFlat(obj, -5.4, z, Math.PI / 2, rnd(0.95, 1.06));
      group.add(obj);
    });
    kinds.forEach((f, i) => {
      const z = -20 + i * 4.4;
      if (z > -18 && z < -6) return;
      const obj = f();
      plantOnFlat(obj, 5.4, z, -Math.PI / 2, rnd(0.95, 1.06));
      group.add(obj);
    });
    // north arm of N-S
    kinds.forEach((f, i) => {
      if (i > 4) return;
      const obj = f();
      plantOnFlat(obj, -5.4, 8 + i * 4.4, Math.PI / 2, rnd(0.95, 1.06));
      group.add(obj);
    });
    kinds.forEach((f, i) => {
      if (i > 4) return;
      const obj = f();
      plantOnFlat(obj, 5.4, 10 + i * 4.4, -Math.PI / 2, rnd(0.95, 1.06));
      group.add(obj);
    });
  }

  // residential blocks — keep clear of hospital (22,20), school, factory, post
  const resFactories = [createResidence, createApartment, gltfHouse, createResidence, createApartment];
  const blocks = [
    { cx: -18, cz: 18, face: Math.PI },
    { cx: 14, cz: -22, face: 0 },
    { cx: -18, cz: -22, face: 0 },
    { cx: 30, cz: 6, face: -Math.PI / 2 },
    { cx: -30, cz: 12, face: Math.PI / 2 },
    { cx: 28, cz: -16, face: -Math.PI / 2 },
    { cx: -28, cz: -12, face: Math.PI / 2 },
    { cx: 12, cz: 30, face: Math.PI }, // north of hospital road
  ];
  const keepClear = (x, z) => {
    if (Math.hypot(x, z) < 10) return true; // plaza
    if (Math.abs(x) < 4.2 && Math.abs(z) < 42) return true; // N-S road
    if (Math.abs(z) < 3.8 && Math.abs(x) < 42) return true; // E-W road
    if (Math.hypot(x - 22, z - 20) < 12) return true; // hospital campus
    if (Math.hypot(x - 0, z + 14) < 10) return true; // school yard
    if (Math.hypot(x + 14, z - 6.5) < 5) return true; // post office
    if (Math.hypot(x + 32, z + 30) < 10) return true; // factory
    return false;
  };
  for (const b of blocks) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (Math.random() < 0.12) continue;
        const f = resFactories[(row * 3 + col) % resFactories.length];
        const obj = f();
        const x = b.cx + (col - 1.5) * 4.2 + rnd(-0.3, 0.3);
        const z = b.cz + (row - 1) * 4.5 + rnd(-0.25, 0.25);
        if (keepClear(x, z)) continue;
        plantOnFlat(obj, x, z, b.face + rnd(-0.08, 0.08), rnd(0.9, 1.12));
        group.add(obj);
      }
    }
  }

  // market square (east of center)
  for (let i = 0; i < 10; i++) {
    const stall = createMarketStall();
    const col = i % 5;
    const row = Math.floor(i / 5);
    plantOnFlat(stall, 12 + col * 2.4, 10 + row * 2.6, Math.PI + rnd(-0.1, 0.1), rnd(0.9, 1.1));
    group.add(stall);
  }

  // street furniture
  for (let i = -36; i <= 36; i += 8) {
    if (Math.abs(i) < 5) continue;
    const light1 = createStreetLight();
    plantOnFlat(light1, i, 2.6, 0, 1);
    group.add(light1);
    const light2 = createStreetLight();
    plantOnFlat(light2, i, -2.6, Math.PI, 1);
    group.add(light2);
  }
  for (let i = -30; i <= 30; i += 10) {
    if (Math.abs(i) < 6) continue;
    const light = createStreetLight();
    plantOnFlat(light, 2.6, i, Math.PI / 2, 1);
    group.add(light);
  }
  for (let i = 0; i < 6; i++) {
    const booth = createPhoneBooth();
    plantOnFlat(booth, rnd(-30, 30), rnd(-30, 30) > 0 ? 3.5 : -3.5, rnd(0, Math.PI * 2), 1);
    group.add(booth);
  }
  for (let i = 0; i < 5; i++) {
    const board = createBillboard();
    plantOnFlat(board, rnd(-35, 35), rnd(-35, 35), rnd(0, Math.PI * 2), rnd(0.9, 1.15));
    group.add(board);
  }

  // trees lining streets + fill neighborhoods
  for (let i = -40; i <= 40; i += 5.5) {
    if (Math.abs(i) < 7) continue;
    for (const side of [4.2, -4.2]) {
      if (Math.random() < 0.25) continue;
      const t = treePick();
      plantOnFlat(t, i + rnd(-0.4, 0.4), side + rnd(-0.2, 0.2), rnd(0, Math.PI * 2), rnd(0.75, 1.05));
      group.add(t);
    }
  }
  scatterFlat(group, treePick, 40, { minR: 20, maxR: 55, scale: [0.7, 1.15] });
  scatterFlat(group, createBush, 36, { minR: 8, maxR: 48, scale: [0.8, 1.4] });
  scatterFlat(group, createRock, 16, { minR: 25, maxR: 55, scale: [0.7, 1.3] });

  // outer ring of glTF houses for soft skyline
  scatterFlat(group, gltfHouse, 14, { minR: 36, maxR: 52, scale: [0.85, 1.15] });

  return { ground, group, sky, clouds, roads };
}
