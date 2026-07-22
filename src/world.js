import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createNoise3D } from 'simplex-noise';
import groundUrl from './assets/ground.png';
import { LINKON_SLICE_P0 } from './layouts/linkon-slice-p0.js';

// Toy planet large enough for a readable town pad, small enough to read as a globe.
export const PLANET_RADIUS = 2.6;
export const OCEAN_RADIUS = PLANET_RADIUS;

// Flat-authoring units → sphere. Buildings keep flat bottoms (local Y-up, sole at 0);
// only the *plant adapter* changes between plane and planet.
// Town authored ~±36m; map that to ~±55° of arc so it sits on the upper hemisphere.
export const TOWN_PROP_SCALE = 0.12;
export const TOWN_FLAT_TO_ARC = 0.038;

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

/** Framed windows — glass + sill + thin mullion (reads sharper under outline). */
function addFramedWindows(g, {
  w, h, d, rows, cols,
  y0 = 0.2, yStep = 0.22, xSpread = 0.78,
  glass = 0x8eb8d0, paneW = 0.11, paneH = 0.13,
  frame = 0xe8e4dc, zFace = null,
} = {}) {
  const z = zFace ?? d / 2 + 0.02;
  const fw = w * paneW;
  const fh = h * paneH;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols - 0.5) * w * xSpread;
      const y = h * (y0 + r * yStep);
      boxAt(g, fw * 1.18, fh * 1.18, 0.035, x, y, z, frame);
      boxAt(g, fw, fh, 0.04, x, y, z + 0.015, glass);
      // sill lip
      boxAt(g, fw * 1.25, 0.04, 0.08, x, y - fh * 0.55, z + 0.03, frame);
      // mullion cross
      boxAt(g, 0.03, fh * 0.9, 0.02, x, y, z + 0.03, frame);
      boxAt(g, fw * 0.9, 0.03, 0.02, x, y, z + 0.03, frame);
    }
  }
}

function addPlinth(g, w, d, h = 0.35, color = 0xc8c0b4) {
  boxAt(g, w * 1.06, h, d * 1.06, 0, h / 2, 0, color);
}

function addRoofCap(g, w, d, y, color = 0x6a7a88, thick = 0.18) {
  boxAt(g, w * 1.08, thick, d * 1.1, 0, y + thick / 2, 0, color);
  // thin eave lip
  boxAt(g, w * 1.14, thick * 0.35, d * 1.16, 0, y + thick * 0.15, 0, color);
}

function addDoorFrame(g, x, y, z, dw, dh, frame = 0xd8d0c4, door = 0x3d3530, glass = null) {
  boxAt(g, dw * 1.12, dh * 1.06, 0.06, x, y, z, frame);
  boxAt(g, dw, dh, 0.05, x, y, z + 0.02, door);
  if (glass != null) {
    boxAt(g, dw * 0.55, dh * 0.35, 0.04, x, y + dh * 0.18, z + 0.05, glass);
  }
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

// —— 医院（阿克索向）：大、白、翼楼、门廊、红十字 —— 绝不是小卖部
function createHospital() {
  const g = new THREE.Group();
  const mw = 9.5;
  const md = 4.2;
  const mh = 4.8;
  addPlinth(g, mw + 1.2, md + 0.6, 0.32, 0xd8d2c8);
  boxAt(g, mw, mh, md, 0, 0.32 + mh / 2, 0, 0xf2f0ea);
  const ww = 3.5;
  const wh = 3.4;
  const wd = 3.3;
  boxAt(g, ww, wh, wd, -mw * 0.52, 0.32 + wh / 2, 0.12, 0xefeae0);
  boxAt(g, ww, wh, wd, mw * 0.52, 0.32 + wh / 2, 0.12, 0xefeae0);
  addRoofCap(g, mw, md, 0.32 + mh, 0x8aa0a8, 0.16);
  addRoofCap(g, ww, wd, 0.32 + wh, 0x8aa0a8, 0.12);
  // floor belt lines
  for (let i = 1; i <= 3; i++) {
    boxAt(g, mw * 1.01, 0.06, 0.08, 0, 0.32 + mh * (i / 4), md / 2 + 0.01, 0xe0dcd4);
  }
  // porte-cochère
  boxAt(g, 3.6, 0.16, 2.2, 0, 2.0, md / 2 + 0.95, 0xe8e4dc);
  boxAt(g, 3.7, 0.08, 2.3, 0, 2.1, md / 2 + 0.95, 0xd0ccc4);
  for (const sx of [-1.35, 1.35]) {
    boxAt(g, 0.2, 2.0, 0.2, sx, 1.0, md / 2 + 1.65, 0xd8d4cc);
    boxAt(g, 0.28, 0.12, 0.28, sx, 0.12, md / 2 + 1.65, 0xc8c4bc);
  }
  // steps + rail
  boxAt(g, 3.0, 0.14, 1.1, 0, 0.12, md / 2 + 0.7, 0xcfc8bc);
  boxAt(g, 3.0, 0.1, 0.7, 0, 0.22, md / 2 + 0.45, 0xcfc8bc);
  addDoorFrame(g, 0, 1.15, md / 2 + 0.04, 1.7, 1.7, 0xe8e4dc, 0x9ecce0, 0xb8dce8);
  addFramedWindows(g, {
    w: mw, h: mh, d: md, rows: 4, cols: 7,
    y0: 0.18, yStep: 0.2, paneW: 0.075, paneH: 0.1,
    glass: 0x8ebfd4, frame: 0xe8e4dc,
    zFace: md / 2 + 0.03,
  });
  // wing facades (manual X offset — framed helper is group-centered)
  for (const wx of [-mw * 0.52, mw * 0.52]) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const x = wx + ((c + 0.5) / 3 - 0.5) * ww * 0.7;
        const y = 0.32 + wh * (0.28 + r * 0.26);
        const z = 0.12 + wd / 2 + 0.03;
        boxAt(g, 0.55, 0.48, 0.03, x, y, z, 0xe8e4dc);
        boxAt(g, 0.42, 0.36, 0.04, x, y, z + 0.015, 0x8ebfd4);
      }
    }
  }
  // facade cross plaque
  boxAt(g, 1.4, 1.1, 0.08, 0, 0.32 + mh * 0.78, md / 2 + 0.06, 0xffffff);
  addRedCross(g, 0, 0.32 + mh * 0.78, md / 2 + 0.12, 0.75);
  addRedCross(g, 0, 0.32 + mh + 0.75, 0, 1.1);
  // ambulance bay
  boxAt(g, 2.4, 0.04, 3.6, mw * 0.35, 0.04, md / 2 + 1.8, 0xd94a3d);
  boxAt(g, 2.0, 0.03, 3.2, mw * 0.35, 0.05, md / 2 + 1.8, 0xf2f0ea);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 2.8, 8), makeToon(0xb0a89c));
  stack.position.set(-mw * 0.2, 0.32 + mh + 1.1, -md * 0.2);
  g.add(stack);
  boxAt(g, 0.5, 0.15, 0.5, -mw * 0.2, 0.32 + mh + 2.4, -md * 0.2, 0x8a8078);
  return finishProp(g);
}

// —— 猎人协会门脸：青蓝体量 + 门廊 + 竖旗 + 轻通讯碟 ——
function createHunterHq() {
  const g = new THREE.Group();
  const w = 9.5;
  const d = 7.0;
  const h = 15.5;
  addPlinth(g, w, d, 0.4, 0x4a6578);
  boxAt(g, w, h, d, 0, 0.4 + h / 2, 0, 0x5b7c99);
  // vertical fins
  for (const sx of [-w * 0.42, -w * 0.28, w * 0.28, w * 0.42]) {
    boxAt(g, 0.22, h * 0.94, 0.1, sx, 0.4 + h * 0.5, d / 2 + 0.05, 0xa8c4d8);
  }
  addRoofCap(g, w, d, 0.4 + h, 0x3d5a72, 0.28);
  // white cornice band under roof
  boxAt(g, w * 1.02, 0.35, 0.18, 0, 0.4 + h * 0.92, d / 2 + 0.06, 0xe8f0ff);
  // mid belt
  boxAt(g, w * 1.01, 0.22, 0.12, 0, 0.4 + h * 0.48, d / 2 + 0.04, 0xa8c4d8);
  // portico
  boxAt(g, 5.6, 0.24, 2.6, 0, 3.7, d / 2 + 1.1, 0xa8c4d8);
  boxAt(g, 5.8, 0.1, 2.8, 0, 3.85, d / 2 + 1.1, 0xe8f0ff);
  for (const sx of [-2.0, 0, 2.0]) {
    boxAt(g, 0.32, 3.5, 0.32, sx, 1.85, d / 2 + 1.9, 0x7a9bb8);
    boxAt(g, 0.42, 0.18, 0.42, sx, 0.15, d / 2 + 1.9, 0x4a6578);
  }
  addDoorFrame(g, 0, 1.7, d / 2 + 0.05, 2.2, 2.5, 0x2a4058, 0x1a2838, 0x8eb8d0);
  addFramedWindows(g, {
    w, h, d, rows: 5, cols: 5,
    y0: 0.12, yStep: 0.155, paneW: 0.09, paneH: 0.09,
    glass: 0x8eb8d0, frame: 0xa8c4d8,
    zFace: d / 2 + 0.04,
  });
  // steps
  boxAt(g, 5.0, 0.14, 1.2, 0, 0.12, d / 2 + 0.7, 0x8a9aab);
  boxAt(g, 4.6, 0.12, 0.8, 0, 0.24, d / 2 + 0.45, 0x8a9aab);
  // twin flags
  for (const sx of [-w * 0.22, w * 0.22]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.5, 6), makeToon(0x8a9098));
    pole.position.set(sx, 0.4 + h + 1.9, d * 0.15);
    g.add(pole);
    boxAt(g, 1.2, 0.7, 0.05, sx + 0.6, 0.4 + h + 3.6, d * 0.15, 0xe8f0ff);
    boxAt(g, 0.4, 0.7, 0.06, sx + 0.22, 0.4 + h + 3.6, d * 0.15 + 0.02, 0x3d8ec9);
  }
  // rooftop dish
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    makeToon(0xc8d4e0),
  );
  dish.position.set(0, 0.4 + h + 0.5, -d * 0.15);
  dish.rotation.x = Math.PI;
  g.add(dish);
  boxAt(g, 0.12, 1.3, 0.12, 0, 0.4 + h + 1.15, -d * 0.15, 0x8a9098);
  // entrance sign plaque
  boxAt(g, 2.8, 0.55, 0.1, 0, 0.4 + h * 0.78, d / 2 + 0.12, 0x2a4058);
  boxAt(g, 2.4, 0.35, 0.08, 0, 0.4 + h * 0.78, d / 2 + 0.16, 0xe8f0ff);
  return finishProp(g);
}

// —— 猫咖：奶油体 + 条纹雨棚 + 猫耳招牌 ——
function createMeowCafe() {
  const g = new THREE.Group();
  const w = 5.8;
  const d = 4.6;
  const h = 5.8;
  addPlinth(g, w, d, 0.22, 0xd4b896);
  boxAt(g, w, h, d, 0, 0.22 + h / 2, 0, 0xf5e6d3);
  addRoofCap(g, w, d, 0.22 + h, 0xc4a882, 0.18);
  // second-floor stringcourse
  boxAt(g, w * 1.02, 0.12, 0.1, 0, 0.22 + h * 0.55, d / 2 + 0.03, 0xe8d4bc);
  addStripedAwning(g, w * 0.95, (0.22 + h) * 0.55, d, [0xf2a0b0, 0xf5f0e6]);
  // big shop window with frame + cross
  boxAt(g, w * 0.62, h * 0.4, 0.06, -w * 0.08, 0.22 + h * 0.32, d / 2 + 0.03, 0x8b5e3c);
  boxAt(g, w * 0.55, h * 0.34, 0.05, -w * 0.08, 0.22 + h * 0.32, d / 2 + 0.05, 0xb8dcec);
  boxAt(g, 0.04, h * 0.32, 0.03, -w * 0.08, 0.22 + h * 0.32, d / 2 + 0.07, 0x8b5e3c);
  boxAt(g, w * 0.5, 0.04, 0.03, -w * 0.08, 0.22 + h * 0.32, d / 2 + 0.07, 0x8b5e3c);
  // warm light
  boxAt(g, w * 0.4, h * 0.18, 0.03, -w * 0.08, 0.22 + h * 0.3, d / 2 + 0.08, 0xffe8b0);
  // door
  addDoorFrame(g, w * 0.32, 0.22 + h * 0.28, d / 2 + 0.03, 0.75, h * 0.48, 0x8b5e3c, 0x6a4030, 0xd4e8f0);
  // hanging sign + cat ears
  boxAt(g, 0.08, 0.7, 0.08, 0, 0.22 + h * 0.72, d / 2 + 0.55, 0x5a4030);
  boxAt(g, 1.5, 0.85, 0.1, 0, 0.22 + h * 0.85, d / 2 + 0.55, 0x5a4030);
  boxAt(g, 1.25, 0.65, 0.08, 0, 0.22 + h * 0.85, d / 2 + 0.6, 0xf2a0b0);
  // paw pad
  boxAt(g, 0.28, 0.22, 0.05, 0, 0.22 + h * 0.82, d / 2 + 0.66, 0xffffff);
  const earMat = makeToon(0xf2a0b0);
  for (const sx of [-0.4, 0.4]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.4, 4), earMat);
    ear.position.set(sx, 0.22 + h * 0.85 + 0.55, d / 2 + 0.6);
    g.add(ear);
  }
  addFramedWindows(g, {
    w, h, d, rows: 1, cols: 3,
    y0: 0.72, yStep: 0.2, paneW: 0.12, paneH: 0.12,
    glass: 0xa8c8d8, frame: 0xd4b896,
    zFace: d / 2 + 0.03,
  });
  // outdoor bench
  boxAt(g, 1.6, 0.12, 0.4, -w * 0.15, 0.4, d / 2 + 0.85, 0xc4a070);
  boxAt(g, 0.12, 0.35, 0.12, -w * 0.15 - 0.6, 0.22, d / 2 + 0.85, 0x8b5e3c);
  boxAt(g, 0.12, 0.35, 0.12, -w * 0.15 + 0.6, 0.22, d / 2 + 0.85, 0x8b5e3c);
  // planter
  boxAt(g, 0.55, 0.35, 0.45, w * 0.35, 0.28, d / 2 + 0.9, 0xc4a070);
  boxAt(g, 0.45, 0.2, 0.35, w * 0.35, 0.5, d / 2 + 0.9, 0x5bb87a);
  return finishProp(g);
}

// —— 远景天际塔剪影（低面数但带窗带节奏）——
function createSkylineTower(variant = 0) {
  const g = new THREE.Group();
  const configs = [
    { w: 6.5, d: 6.5, h: 34, top: 'spire' },
    { w: 5.5, d: 5.5, h: 28, top: 'step' },
    { w: 7.5, d: 5.5, h: 38, top: 'antenna' },
  ];
  const c = configs[variant % configs.length];
  addPlinth(g, c.w, c.d, 0.5, 0x556678);
  boxAt(g, c.w, c.h, c.d, 0, 0.5 + c.h / 2, 0, 0x6a7a8c);
  // dark floor bands + glass strips (cheap “curtain wall” read)
  const floors = Math.floor(c.h / 3.2);
  for (let i = 0; i < floors; i++) {
    const y = 0.5 + 2.2 + i * 3.0;
    boxAt(g, c.w * 1.01, 0.2, c.d * 1.01, 0, y, 0, 0x556678);
    boxAt(g, c.w * 0.92, 1.4, 0.06, 0, y + 0.9, c.d / 2 + 0.02, 0x7a9ab0);
  }
  if (c.top === 'spire') {
    boxAt(g, c.w * 0.5, c.h * 0.1, c.d * 0.5, 0, 0.5 + c.h + c.h * 0.05, 0, 0x7a8a9c);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3.5, 6), makeToon(0x8a9aac));
    spire.position.y = 0.5 + c.h + c.h * 0.16;
    g.add(spire);
  } else if (c.top === 'step') {
    boxAt(g, c.w * 0.72, c.h * 0.09, c.d * 0.72, 0, 0.5 + c.h + c.h * 0.04, 0, 0x7a8a9c);
    boxAt(g, c.w * 0.42, c.h * 0.07, c.d * 0.42, 0, 0.5 + c.h + c.h * 0.11, 0, 0x8a9aac);
  } else {
    boxAt(g, 0.22, 5.0, 0.22, 0, 0.5 + c.h + 2.4, 0, 0x8a9aac);
    boxAt(g, 1.4, 0.35, 0.35, 0, 0.5 + c.h + 4.2, 0, 0xa0b0c0);
  }
  return finishProp(g);
}

function createPlazaPad(size = 14) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, 0.06, size), makeToon(0xc9c2b4));
  m.position.y = 0.03;
  m.receiveShadow = true;
  m.castShadow = false;
  m.userData.noOutline = true;
  g.add(m);
  // subtle cross walk rings
  boxAt(g, size * 0.7, 0.02, 0.35, 0, 0.055, 0, 0xb8b0a0);
  boxAt(g, 0.35, 0.02, size * 0.7, 0, 0.055, 0, 0xb8b0a0);
  g.userData.noOutline = true;
  g.traverse((o) => {
    o.userData.noOutline = true;
  });
  return g;
}

function createObelisk() {
  const g = new THREE.Group();
  boxAt(g, 1.0, 0.25, 1.0, 0, 0.12, 0, 0xa8b0b8);
  boxAt(g, 0.55, 3.2, 0.55, 0, 1.85, 0, 0xc8d4dc);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 4), makeToon(0xe8f4ff));
  tip.position.y = 3.85;
  g.add(tip);
  // soft cyan band
  boxAt(g, 0.6, 0.2, 0.6, 0, 2.4, 0, 0x7ec8e8);
  return finishProp(g);
}

function createHunterBoard() {
  const g = new THREE.Group();
  boxAt(g, 0.12, 2.1, 0.12, -0.4, 1.05, 0, 0x6a7078);
  boxAt(g, 0.12, 2.1, 0.12, 0.4, 1.05, 0, 0x6a7078);
  boxAt(g, 1.2, 1.1, 0.08, 0, 1.55, 0, 0x3d5a72);
  boxAt(g, 1.0, 0.85, 0.05, 0, 1.55, 0.05, 0xa8c4d8);
  boxAt(g, 0.7, 0.18, 0.06, 0, 2.2, 0.06, 0xe8f0ff);
  return finishProp(g);
}

function createApartmentSilhouette() {
  const g = new THREE.Group();
  const w = 9.5;
  const d = 6.5;
  const h = 14;
  boxAt(g, w, h, d, 0, h / 2, 0, 0xc8d0d8);
  boxAt(g, w * 1.04, 0.3, d * 1.04, 0, h + 0.12, 0, 0x7a8a98);
  for (let f = 0; f < 5; f++) {
    const y = 1.6 + f * 2.4;
    boxAt(g, w * 0.92, 0.12, 0.25, 0, y, d / 2 + 0.1, 0xb0b8c0);
    for (let c = 0; c < 4; c++) {
      const x = ((c + 0.5) / 4 - 0.5) * w * 0.75;
      boxAt(g, 0.9, 1.1, 0.05, x, y + 0.7, d / 2 + 0.04, 0x88a8c0);
    }
  }
  return finishProp(g);
}

function createBoutiqueShop() {
  const g = new THREE.Group();
  const w = 3.8;
  const d = 3.6;
  const h = 4.4;
  addPlinth(g, w, d, 0.18, 0xc8b8d0);
  boxAt(g, w, h, d, 0, 0.18 + h / 2, 0, 0xe8d8f0);
  addRoofCap(g, w, d, 0.18 + h, 0x9a7ab0, 0.14);
  addStripedAwning(g, w, (0.18 + h) * 0.55, d, [0x9a7ab0, 0xf5f0e6]);
  boxAt(g, w * 0.7, h * 0.38, 0.05, -0.05, 0.18 + h * 0.34, d / 2 + 0.03, 0x7a5a90);
  boxAt(g, w * 0.6, h * 0.32, 0.05, -0.05, 0.18 + h * 0.34, d / 2 + 0.05, 0xb8dcec);
  addDoorFrame(g, w * 0.28, 0.18 + h * 0.28, d / 2 + 0.03, 0.55, h * 0.48, 0x5a4030, 0x4a3020, 0xd0e8f0);
  boxAt(g, 0.95, 0.5, 0.08, -w * 0.12, 0.18 + h * 0.72, d / 2 + 0.25, 0x6a4080);
  return finishProp(g);
}

function createConvenienceShop() {
  const g = new THREE.Group();
  const w = 4.2;
  const d = 3.6;
  const h = 4.0;
  addPlinth(g, w, d, 0.18, 0xc8d4c0);
  boxAt(g, w, h, d, 0, 0.18 + h / 2, 0, 0xeef4e6);
  addRoofCap(g, w, d, 0.18 + h, 0x5bb87a, 0.14);
  addStripedAwning(g, w, (0.18 + h) * 0.55, d, [0x5bb87a, 0xf5f0e6]);
  boxAt(g, w * 0.72, h * 0.4, 0.05, -0.1, 0.18 + h * 0.36, d / 2 + 0.03, 0x3d7a50);
  boxAt(g, w * 0.62, h * 0.34, 0.05, -0.1, 0.18 + h * 0.36, d / 2 + 0.05, 0xb8dcec);
  addDoorFrame(g, w * 0.3, 0.18 + h * 0.28, d / 2 + 0.03, 0.55, h * 0.5, 0x3d5a40, 0x2a4030, 0xc8e0d0);
  boxAt(g, 1.2, 0.4, 0.08, 0, 0.18 + h * 0.78, d / 2 + 0.22, 0xe8b84a);
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
  const mat = makeToon(0xf2f8fc);
  mat.transparent = true;
  mat.opacity = 0.94;
  mat.depthWrite = false;

  for (let i = 0; i < 22; i++) {
    const cloud = new THREE.Group();
    const n = 4 + (i % 4);
    for (let j = 0; j < n; j++) {
      const r = 0.22 + Math.random() * 0.28;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      puff.position.set((j - n * 0.5) * 0.26 + Math.random() * 0.08, Math.random() * 0.1, (Math.random() - 0.5) * 0.16);
      puff.scale.y = 0.5 + Math.random() * 0.22;
      cloud.add(puff);
    }
    const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    // more clouds around mid-latitudes for silhouette against blue sky
    dir.y = Math.abs(dir.y) * 0.45 + 0.2;
    dir.normalize();
    const radius = PLANET_RADIUS * (1.65 + Math.random() * 0.45);
    cloud.position.copy(dir).multiplyScalar(radius);
    orientTo(cloud, dir);
    cloud.rotateY(Math.random() * Math.PI * 2);
    cloud.scale.setScalar(0.85 + Math.random() * 1.1);
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
  // Clear cel blue — zenith must read blue, not washed white
  const geo = new THREE.SphereGeometry(80, 48, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(0x4a9fd4) },
      uMid: { value: new THREE.Color(0x7ec4e8) },
      uHorizon: { value: new THREE.Color(0xb8dff0) },
      uGround: { value: new THREE.Color(0xa8d4c0) },
      uSunDir: { value: new THREE.Vector3(0.42, 0.72, 0.38).normalize() },
      uSunColor: { value: new THREE.Color(0xfff0c8) },
      uCloud: { value: new THREE.Color(0xe8f4fc) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uZenith, uMid, uHorizon, uGround, uSunDir, uSunColor, uCloud;
      // cheap hash for soft cloud bands (fills empty sky without mesh clouds alone)
      float hash(vec2 p){
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p){
        float v = 0.0; float a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
        return v;
      }
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        // three-stop blue gradient — stays blue from zenith through mid sky
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.35, h));
        col = mix(col, uZenith, smoothstep(0.25, 0.95, h));
        col = mix(uGround, col, smoothstep(-0.5, 0.08, h));

        // soft painted cloud bands (upper half only)
        if (h > 0.05) {
          vec2 cuv = vec2(atan(d.z, d.x) * 1.2, h * 3.2);
          float c = fbm(cuv * 1.8 + 2.4);
          c = smoothstep(0.48, 0.72, c) * smoothstep(0.05, 0.35, h) * smoothstep(0.95, 0.45, h);
          col = mix(col, uCloud, c * 0.55);
        }

        // small sun disc — limited glow so sky doesn't bleach white
        float nd = max(dot(d, uSunDir), 0.0);
        float sun = pow(nd, 220.0);
        float glow = pow(nd, 14.0) * 0.12;
        col += uSunColor * (sun * 0.9 + glow);

        // keep a touch of cool haze only near horizon (not white wash)
        col = mix(col, uHorizon, exp(-max(h, 0.0) * 4.0) * 0.12);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.userData.noOutline = true;
  mesh.renderOrder = -1000;
  return mesh;
}

// ---- surface plant adapters (flat bottoms stay flat; only placement changes) -
//
// Asset contract for every prop (procedural + glTF wrapper):
//   • local +Y is "up"
//   • the sole / foundation sits at local y = 0
//   • footprint is centered on XZ ≈ 0
//
// plantOnFlat  → identity up, y from bbox
// plantOnPlanet → orient +Y to surface normal, sink by sphere curvature under footprint
//
// Town layout is authored once in flat (x, z) metres, then the active adapter
// projects those coordinates onto the current surface.

const _tangent = new THREE.Vector3();
const _bitangent = new THREE.Vector3();
const _sampleDir = new THREE.Vector3();
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _qYaw = new THREE.Quaternion();
const _qOrient = new THREE.Quaternion();
// Town centre = north pole so the walk pad and plaza meet at spawn.
const _townOrigin = new THREE.Vector3(0, 1, 0);
const _townEast = new THREE.Vector3(1, 0, 0);
const _townNorth = new THREE.Vector3(0, 0, -1);

function townFrame() {
  return { origin: _townOrigin, east: _townEast, north: _townNorth };
}

/** Safe curve bury for a flat sole of radius halfW on a sphere of radius h. */
function curveBury(h, halfW) {
  // Never let halfW exceed ~35% of radius — long roads must be segmented, not NaN'd.
  const r = Math.min(Math.max(halfW, 0), h * 0.35);
  return h - Math.sqrt(Math.max(h * h - r * r, 0));
}

/** Flat town (x,z) → unit direction on the sphere (great-circle offset from town origin). */
export function flatToDir(x, z, out = _dir) {
  const { origin, east, north } = townFrame();
  const arc = Math.hypot(x, z) * TOWN_FLAT_TO_ARC;
  if (arc < 1e-8) return out.copy(origin);
  const ang = arc / PLANET_RADIUS;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const ux = x / Math.hypot(x, z);
  const uz = z / Math.hypot(x, z);
  // move from origin toward (ux*east + uz*north)
  out
    .copy(origin)
    .multiplyScalar(cos)
    .addScaledVector(east, ux * sin)
    .addScaledVector(north, uz * sin)
    .normalize();
  return out;
}

function surfaceBasis(dir, east = _tangent, north = _bitangent) {
  east.set(0, 1, 0).cross(dir);
  if (east.lengthSq() < 1e-8) east.set(1, 0, 0).cross(dir);
  east.normalize();
  north.crossVectors(dir, east).normalize();
  return { east, north };
}

/** Lowest terrain height under a circular footprint (prevents corner float). */
function footprintMinHeight(dir, radius, samples = 12) {
  let minH = terrainHeight(dir);
  if (radius < 1e-4) return minH;
  surfaceBasis(dir);
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
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

/**
 * Measure sole after scale+yaw (before world orient). Props should already be feet-at-0;
 * we still read bbox so glTF / future assets stay safe.
 */
function measureSole(obj) {
  obj.position.set(0, 0, 0);
  obj.rotation.set(0, 0, 0);
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj);
  _box.getSize(_size);
  return {
    soleY: _box.min.y,
    halfW: 0.5 * Math.hypot(_size.x, _size.z),
  };
}

/** Flat ground: yaw only, sole on y=0. */
export function plantOnFlat(obj, x, z, yaw = 0, scale = 1, { sink = 0.012 } = {}) {
  obj.scale.set(1, 1, 1);
  if (scale !== 1) obj.scale.multiplyScalar(scale);
  obj.rotation.set(0, yaw, 0);
  obj.position.set(0, 0, 0);
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj);
  obj.position.set(x, -_box.min.y - sink, z);
  return obj;
}

/**
 * Sphere ground: same (x,z,yaw) authoring space as flat.
 * Flat-bottom buildings stay rigid boxes — we do NOT bend meshes.
 * Flexibility = how deep we bury the flat sole into the curved dirt
 * (curveSink from footprint width + optional extraSink).
 */
export function plantOnPlanet(
  obj,
  x,
  z,
  yaw = 0,
  scale = 1,
  { propScale = TOWN_PROP_SCALE, extraSink = 0.018, minElev = 0.02 } = {},
) {
  const dir = flatToDir(x, z, new THREE.Vector3());
  const s = propScale * scale;
  obj.scale.setScalar(s);
  obj.position.set(0, 0, 0);
  obj.rotation.set(0, 0, 0);
  obj.quaternion.identity();

  // measure sole while still Y-up (flat-bottom contract)
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj);
  _box.getSize(_size);
  const soleY = _box.min.y;
  const halfW = 0.5 * Math.hypot(_size.x, _size.z);

  // local +Y → surface radial, then yaw around local up
  _qOrient.setFromUnitVectors(_up, dir);
  _qYaw.setFromAxisAngle(_up, yaw);
  obj.quaternion.copy(_qOrient).multiply(_qYaw);

  // footprint sample uses a capped radius so huge assets don't explode
  const sampleR = Math.min(Math.max(halfW * 0.9, 0.03), PLANET_RADIUS * 0.25);
  const h = footprintMinHeight(dir, sampleR, 12);
  const elev = h - OCEAN_RADIUS;
  const wetPenalty = elev < minElev * PLANET_RADIUS ? (minElev * PLANET_RADIUS - elev) * 0.4 : 0;

  // soleY / halfW already include prop scale (from world bbox)
  const bury = extraSink + curveBury(h, halfW) + Math.max(0, -soleY) + wetPenalty;
  obj.position.copy(dir).multiplyScalar(Math.max(h - bury, OCEAN_RADIUS * 0.92));
  return obj;
}

/** Random scatter on sphere (forests / rocks — not the authored town grid). */
function scatterOnPlanet(
  group,
  factory,
  count,
  { minElev = 0.03, scale = [0.85, 1.2], extraSink = 0.025, maxSlope = 0.55, propScale = 1 } = {},
) {
  const dir = new THREE.Vector3();
  let placed = 0;
  let tries = 0;
  while (placed < count && tries < count * 80) {
    tries++;
    dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (dir.lengthSq() < 0.02) continue;
    dir.normalize();
    if (dir.y > 0.92) continue; // clear north-pole walk pad
    // keep clear of town disc
    if (dir.dot(_townOrigin) > 0.72) continue;

    const hCenter = terrainHeight(dir);
    if (hCenter - OCEAN_RADIUS < minElev * PLANET_RADIUS) continue;

    const obj = typeof factory === 'function' ? factory() : factory.clone(true);
    const s = (scale[0] + Math.random() * (scale[1] - scale[0])) * propScale;
    obj.scale.set(1, 1, 1);
    obj.scale.multiplyScalar(s);
    obj.rotation.set(0, 0, 0);
    obj.position.set(0, 0, 0);
    obj.updateMatrixWorld(true);
    _box.setFromObject(obj);
    _box.getSize(_size);
    const halfW = 0.5 * Math.hypot(_size.x, _size.z);
    const soleY = _box.min.y;

    surfaceBasis(dir);
    const h1 = terrainHeight(_sampleDir.copy(dir).addScaledVector(_tangent, 0.05).normalize());
    if (Math.abs(h1 - hCenter) / 0.05 > maxSlope) continue;

    const h = footprintMinHeight(dir, Math.max(halfW * 0.95, 0.04), 14);
    if (h - OCEAN_RADIUS < minElev * PLANET_RADIUS * 0.6) continue;

    _qOrient.setFromUnitVectors(_up, dir);
    _qYaw.setFromAxisAngle(_up, Math.random() * Math.PI * 2);
    obj.quaternion.copy(_qOrient).multiply(_qYaw);

    const bury = extraSink + curveBury(h, halfW) + Math.max(0, -soleY);
    obj.position.copy(dir).multiplyScalar(Math.max(h - bury, OCEAN_RADIUS * 0.92));
    group.add(obj);
    placed++;
  }
  return placed;
}

/** Build a plant(fn) that parents into `group`. mode: 'flat' | 'planet'. */
export function makePlant(group, mode = 'flat', opts = {}) {
  return (obj, x, z, yaw = 0, scale = 1) => {
    if (mode === 'planet') plantOnPlanet(obj, x, z, yaw, scale, opts);
    else plantOnFlat(obj, x, z, yaw, scale, opts);
    group.add(obj);
    return obj;
  };
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

async function loadTownAssets() {
  // Authoring scale: buildings are ~1.5–9m tall; glTF matched to that.
  // plantOnPlanet multiplies TOWN_PROP_SCALE so the same assets fit the sphere.
  const [trees, gltfHouses] = await Promise.all([
    Promise.all(
      ['common', 'pine', 'birch', 'maple', 'twisted', 'common2'].map((n) =>
        loadTemplate(`${BASE}models/tree-${n}.glb`, 3.2),
      ),
    ),
    Promise.all(['0', '1', '2', '3'].map((n) => loadTemplate(`${BASE}models/house-${n}.glb`, 2.2))),
  ]);
  return {
    treePick: () => trees[Math.floor(Math.random() * trees.length)].clone(true),
    gltfHouse: () => gltfHouses[Math.floor(Math.random() * gltfHouses.length)].clone(true),
  };
}

function placeStreetRow(plant, factories, { x0, z, count, spacing, faceYaw = 0, jitter = 0.15 }) {
  for (let i = 0; i < count; i++) {
    const factory = factories[i % factories.length];
    const obj = typeof factory === 'function' ? factory() : factory.clone(true);
    const x = x0 + i * spacing + rnd(-jitter, jitter);
    const zz = z + rnd(-jitter * 0.5, jitter * 0.5);
    plant(obj, x, zz, faceYaw, rnd(0.92, 1.08));
  }
}

function scatterAround(plant, factory, count, { minR = 5, maxR = 28, scale = [0.85, 1.2] } = {}) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const t = Math.sqrt(Math.random());
    const r = minR + t * (maxR - minR);
    const obj = typeof factory === 'function' ? factory() : factory.clone(true);
    const s = scale[0] + Math.random() * (scale[1] - scale[0]);
    plant(obj, Math.cos(a) * r, Math.sin(a) * r, Math.random() * Math.PI * 2, s);
  }
}

/**
 * Build a mesh from a declarative placeable `type`.
 * Layout data lives in src/layouts/* — change coords there, not scatter math.
 */
function buildByType(type, place, assets) {
  switch (type) {
    case 'plaza':
      return createPlazaPad(place.footprintWxD?.[0] ?? LINKON_SLICE_P0.meta.plazaSize);
    case 'obelisk':
      return createObelisk();
    case 'hunterHq':
      return createHunterHq();
    case 'hospital':
      return createHospital();
    case 'cafe':
      return createMeowCafe();
    case 'shopBoutique':
      return createBoutiqueShop();
    case 'shopConvenience':
      return createConvenienceShop();
    case 'busStop':
      return createBusStop();
    case 'hunterBoard':
      return createHunterBoard();
    case 'skylineTower':
      return createSkylineTower(place.variant ?? 0);
    case 'apartmentSilhouette':
      return createApartmentSilhouette();
    case 'streetLight':
      return createStreetLight();
    case 'tree':
      return assets?.treePick ? assets.treePick() : createBush();
    default:
      console.warn(`[layout] unknown type: ${type}`);
      return null;
  }
}

/**
 * Declarative town: roads + places from a layout table.
 * `plant(obj, x, z, yaw, scale)` is flat or planet adapter from makePlant().
 * No random dense building scatter — that caused the "everything piled at center" look.
 */
function populateFromLayout(plant, layout, assets = {}, { maxR = 55 } = {}) {
  const inRange = (x, z) => Math.hypot(x, z) <= maxR;

  for (const road of layout.roads ?? []) {
    if (!inRange(road.x0, road.z0) && !inRange(road.x1, road.z1)) continue;
    plantRoadLine(plant, {
      x0: road.x0,
      z0: road.z0,
      x1: road.x1,
      z1: road.z1,
      width: road.width ?? 5.2,
      step: road.step ?? 5,
    });
  }

  for (const place of layout.places ?? []) {
    if (!inRange(place.x, place.z)) continue;
    // Keep plaza free of tall masses even if a bad row sneaks into the table.
    if (
      place.type !== 'plaza' &&
      place.type !== 'obelisk' &&
      place.type !== 'streetLight' &&
      place.type !== 'hunterBoard' &&
      (place.heightHint === 'L' || place.heightHint === 'XL') &&
      Math.hypot(place.x, place.z) < 8
    ) {
      console.warn(`[layout] skipped tall place too close to plaza: ${place.id}`);
      continue;
    }
    const obj = buildByType(place.type, place, assets);
    if (!obj) continue;
    const scale = place.scale ?? 1;
    plant(obj, place.x, place.z, place.yaw ?? 0, scale);
  }
}

/** @deprecated dense 90s town — kept only as reference; prefer populateFromLayout */
function populateTown(plant, { treePick, gltfHouse }, { density = 1, maxR = 55 } = {}) {
  populateFromLayout(plant, LINKON_SLICE_P0, { treePick, gltfHouse }, { maxR });
  if (density < 0.5) return;
  // Optional light vegetation outside landmarks only (still sparse, no housing blocks).
  scatterAround(plant, createBush, Math.round(6 * density), {
    minR: 20,
    maxR: Math.min(maxR, 34),
    scale: [0.7, 1.1],
  });
}

/** Short road tile (sole at y=0). Long roads must be built from tiles — a 90m slab breaks the sphere. */
function createRoadTile(length, width, color = ROAD) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, width), makeToon(color));
  m.position.y = 0.025;
  m.receiveShadow = true;
  m.castShadow = false;
  m.userData.noOutline = true;
  g.add(m);
  g.userData.noOutline = true;
  g.traverse((o) => {
    o.userData.noOutline = true;
  });
  return g;
}

/** Segment a long road into short flat tiles so each sole can bury into the sphere. */
function plantRoadLine(plant, { x0, z0, x1, z1, width = 5.2, step = 5.5, color = ROAD }) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) return;
  const yaw = Math.atan2(dx, dz); // tile local Z along the road? Box is length on X
  // Our tile length is along local X; face so local X follows the line.
  const faceYaw = Math.atan2(dz, dx);
  const n = Math.max(1, Math.ceil(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + dx * t;
    const z = z0 + dz * t;
    // keep a small clear pad at plaza centre for the character
    if (Math.hypot(x, z) < 3.2) continue;
    plant(createRoadTile(step * 1.05, width, color), x, z, faceYaw, 1);
  }
}

function populateRoads(plant) {
  // main cross — segmented
  plantRoadLine(plant, { x0: -34, z0: 0, x1: 34, z1: 0, width: 5.2, step: 5 });
  plantRoadLine(plant, { x0: 0, z0: -34, x1: 0, z1: 34, width: 5.2, step: 5 });
  // side streets
  for (const z of [-18, 18]) {
    plantRoadLine(plant, { x0: -28, z0: z, x1: 28, z1: z, width: 3.4, step: 5 });
  }
  for (const x of [-18, 18]) {
    plantRoadLine(plant, { x0: x, z0: -24, x1: x, z1: 24, width: 3.4, step: 5 });
  }
  // plaza ring of sidewalk tiles
  plant(createRoadTile(12, 12, SIDEWALK), 0, 0, 0, 1);
}

function makeRoadPlane(w, d, color = ROAD) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), makeToon(color));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.008;
  m.receiveShadow = true;
  m.userData.noOutline = true;
  return m;
}

// Linkon hunter-slice: flat authoring stage — declarative layout, plant = flat
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
  for (let i = 0; i < 18; i++) {
    const cloud = new THREE.Group();
    const n = 3 + (i % 3);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.6, 10, 8), cloudMat);
      puff.position.set((j - n * 0.5) * 0.8, Math.random() * 0.25, (Math.random() - 0.5) * 0.45);
      puff.scale.y = 0.5;
      cloud.add(puff);
    }
    cloud.position.set((Math.random() - 0.5) * 100, 12 + Math.random() * 6, (Math.random() - 0.5) * 100);
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

  const assets = await loadTownAssets();
  const plant = makePlant(group, 'flat');
  // Roads + landmarks from the same table (segmented tiles, sole@y=0).
  populateFromLayout(plant, LINKON_SLICE_P0, assets, {
    maxR: LINKON_SLICE_P0.meta.playableHalfExtent + 8,
  });

  return {
    ground,
    group,
    sky,
    clouds,
    mode: 'flat',
    layout: LINKON_SLICE_P0,
  };
}

/**
 * Planet mode: same town layout + flat-bottom buildings, planted with plantOnPlanet.
 * Character walk rotates the planet group under a fixed north-pole pad.
 */
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

  const townGroup = new THREE.Group();
  planetGroup.add(townGroup);

  const assets = await loadTownAssets();
  // Same declarative layout as flat; plantOnPlanet sinks flat soles into the curve.
  const plant = makePlant(townGroup, 'planet', {
    propScale: TOWN_PROP_SCALE,
    extraSink: 0.016,
    minElev: 0.01,
  });
  populateFromLayout(plant, LINKON_SLICE_P0, assets, { maxR: 30 });

  // Sparse non-town props only — never scatter buildings onto the sphere.
  scatterOnPlanet(planetGroup, assets.treePick, 10, {
    minElev: 0.04,
    scale: [0.5, 0.9],
    extraSink: 0.025,
    maxSlope: 0.5,
    propScale: TOWN_PROP_SCALE,
  });
  scatterOnPlanet(planetGroup, createRock, 12, {
    minElev: 0.0,
    scale: [0.45, 1.1],
    extraSink: 0.025,
    maxSlope: 0.85,
  });
  scatterOnPlanet(planetGroup, createBush, 14, {
    minElev: 0.02,
    scale: [0.55, 1.0],
    extraSink: 0.018,
    maxSlope: 0.65,
  });

  const clouds = createClouds();
  planetGroup.add(clouds);
  scene.add(planetGroup);

  const sky = createSky();
  sky.scale.setScalar(1.15);
  scene.add(sky);

  return { planetGroup, townGroup, sky, clouds, mode: 'planet' };
}
