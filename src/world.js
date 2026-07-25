import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createNoise3D } from 'simplex-noise';
import groundUrl from './assets/ground.png';
import { MUSHOKU_SLICE_P0 } from './layouts/mushoku-slice-p0.js';
import { createHeroBuilding } from './entities/building/heroes/index.js';
import {
  createMeadowGround,
  createRoadTile as createEnvRoadTile,
  createPlazaPad as createEnvPlazaPad,
  createBuildingDirtApron,
  scatterGroundMicroDetail,
} from './environment/flat-env.js';

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

function makeGradientMap(steps = 5) {
  const data = new Uint8Array(steps);
  // Punchier cel: darker shadow band + bright key — avoids washed flat grey
  // steps≈5 → ~72, 118, 168, 214, 250
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    data[i] = Math.round(72 + t * t * 40 + t * 138);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
export const gradientMap = makeGradientMap(5);

export function makeToon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap, ...opts });
}

/** Warm emissive toon (tavern windows, forge, lanterns, stained glass). */
function makeGlow(color, emissive, intensity = 0.55) {
  return makeToon(color, {
    emissive: new THREE.Color(emissive),
    emissiveIntensity: intensity,
  });
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

function boxAt(g, w, h, d, x, y, z, color, matOpts = null) {
  const mat = matOpts
    ? (matOpts.isMaterial ? matOpts : makeToon(color, matOpts))
    : makeToon(color);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

/** Soft self-lit pane — reads as warm interior under cel + grade. */
function glowBox(g, w, h, d, x, y, z, color = 0xffe8b0, emissive = 0xffc878, intensity = 0.65) {
  return boxAt(g, w, h, d, x, y, z, color, makeGlow(color, emissive, intensity));
}

/** Barrel / crate micro-props for density near landmarks. */
function addBarrel(g, x, y, z, scale = 1) {
  const WOOD = 0x8b5e3c;
  const BAND = 0x5a5048;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * scale, 0.32 * scale, 0.55 * scale, 10), makeToon(WOOD));
  body.position.set(x, y + 0.28 * scale, z);
  g.add(body);
  boxAt(g, 0.58 * scale, 0.05 * scale, 0.58 * scale, x, y + 0.12 * scale, z, BAND);
  boxAt(g, 0.58 * scale, 0.05 * scale, 0.58 * scale, x, y + 0.42 * scale, z, BAND);
}

function addCrate(g, x, y, z, sx = 0.55, sy = 0.45, sz = 0.5) {
  const WOOD = 0xa07848;
  const DARK = 0x6a5030;
  boxAt(g, sx, sy, sz, x, y + sy / 2, z, WOOD);
  boxAt(g, sx * 1.02, 0.04, sz * 1.02, x, y + sy * 0.08, z, DARK);
  boxAt(g, sx * 1.02, 0.04, sz * 1.02, x, y + sy * 0.92, z, DARK);
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

/** Fantasy sun disc (Millis-adjacent feel) — not a modern medical cross. */
function addSunSymbol(g, x, y, z, size = 0.7) {
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.38, size * 0.38, 0.08, 16), makeToon(0xe8b84a));
  disc.rotation.x = Math.PI / 2;
  disc.position.set(x, y, z);
  g.add(disc);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    boxAt(g, size * 0.12, size * 0.42, 0.06, x + Math.cos(a) * size * 0.55, y + Math.sin(a) * size * 0.55, z, 0xd4a84a);
  }
}

/** Solid triangular-prism gable roof (not two floating slabs). */
function addGableRoof(g, w, d, y, color = 0xb85a48, rise = 1.1) {
  const overhang = 0.28;
  const hw = w * 0.5 + overhang;
  const hd = d * 0.5 + overhang;
  const v = [
    -hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd,
    -hw, rise, 0, hw, rise, 0,
  ];
  const idx = [
    0, 1, 5, 0, 5, 4,
    3, 4, 5, 3, 5, 2,
    0, 4, 3,
    1, 2, 5,
    0, 3, 2, 0, 2, 1,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, makeToon(color));
  mesh.position.y = y;
  g.add(mesh);
  boxAt(g, w + overhang * 2, 0.1, 0.16, 0, y + rise + 0.04, 0, color);
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

/** Horizontal ribbon windows — institutional / curtain-wall read (cheap, sharp under outline). */
function addRibbonFloors(g, {
  w, d, floors, storyH, y0, zFace,
  glass = 0x8ebfd4, band = 0xe0dcd4, glassH = 0.55, inset = 0.92,
} = {}) {
  const z = zFace ?? d / 2 + 0.03;
  for (let i = 0; i < floors; i++) {
    const y = y0 + i * storyH;
    boxAt(g, w * 1.01, 0.1, 0.08, 0, y, z, band);
    boxAt(g, w * inset, glassH, 0.05, 0, y + storyH * 0.42, z + 0.01, glass);
    // thin mullions
    const cols = Math.max(4, Math.round(w / 1.6));
    for (let c = 1; c < cols; c++) {
      const x = ((c / cols) - 0.5) * w * inset;
      boxAt(g, 0.06, glassH * 0.92, 0.04, x, y + storyH * 0.42, z + 0.03, band);
    }
  }
}

/** Pair of columns under a canopy / portico. */
function addColumns(g, xs, yBottom, height, z, size = 0.28, color = 0xd8d4cc) {
  for (const x of xs) {
    boxAt(g, size, height, size, x, yBottom + height / 2, z, color);
    boxAt(g, size * 1.35, 0.12, size * 1.35, x, yBottom + 0.06, z, color);
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

// —— 神殿 / 教堂：石质中殿 + 钟楼尖顶 + 彩窗 + 太阳徽 —— 绝不是小卖部
// Spec: footprint ~16×10, height L (~14–18m). Shops are ~4m — temple must dwarf them.
function createTemple() {
  const g = new THREE.Group();
  const STONE = 0xf7efe0;
  const STONE_WARM = 0xeadcc4;
  const TRIM = 0xd8c4a0;
  const ROOF = 0x4a5560;
  const WOOD = 0x7a4a2c;
  const PLINTH = 0xb8ac98;
  const STAIN = [0xd45a6e, 0x3a78c8, 0xf0b840, 0x4ab87a, 0x8a52c0];

  const mw = 12.5;
  const md = 7.0;
  const mh = 11.5;
  const plinthH = 0.5;
  const baseY = plinthH;

  addPlinth(g, mw + 1.8, md + 1.4, plinthH, PLINTH);

  // Nave — tall white/stone body + cornice belt for silhouette
  boxAt(g, mw, mh, md, 0, baseY + mh / 2, 0, STONE);
  boxAt(g, mw * 1.04, 0.35, 0.22, 0, baseY + mh * 0.88, md / 2 + 0.06, TRIM);
  addGableRoof(g, mw, md, baseY + mh, ROOF, 2.4);

  // Side aisles (lower)
  const aw = 3.6;
  const ad = 5.2;
  const ah = mh * 0.62;
  for (const sx of [-1, 1]) {
    const x = sx * (mw * 0.5 + aw * 0.42);
    boxAt(g, aw, ah, ad, x, baseY + ah / 2, 0.2, STONE_WARM);
    addGableRoof(g, aw, ad, baseY + ah, ROOF, 1.2);
  }

  // Apse / rear chapel
  boxAt(g, mw * 0.55, mh * 0.75, 3.4, 0, baseY + mh * 0.38, -md * 0.55 - 1.0, STONE_WARM);
  addGableRoof(g, mw * 0.55, 3.4, baseY + mh * 0.75, ROOF, 1.0);

  // Stained-glass rose + lancet windows on facade (emissive = "lit from inside")
  const faceZ = md / 2 + 0.04;
  for (let i = 0; i < 5; i++) {
    const x = ((i + 0.5) / 5 - 0.5) * mw * 0.78;
    const col = STAIN[i % STAIN.length];
    boxAt(g, 1.15, 3.4, 0.08, x, baseY + 5.2, faceZ, TRIM);
    glowBox(g, 0.95, 3.1, 0.06, x, baseY + 5.2, faceZ + 0.04, col, col, 0.45);
    boxAt(g, 0.04, 2.9, 0.03, x, baseY + 5.2, faceZ + 0.06, TRIM);
    boxAt(g, 0.85, 0.04, 0.03, x, baseY + 5.2, faceZ + 0.06, TRIM);
  }
  // Rose window
  const rose = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 0.1, 20),
    makeGlow(0x4a7ab8, 0x6aa0e8, 0.5),
  );
  rose.rotation.x = Math.PI / 2;
  rose.position.set(0, baseY + mh * 0.72, faceZ + 0.05);
  g.add(rose);
  boxAt(g, 0.12, 2.4, 0.06, 0, baseY + mh * 0.72, faceZ + 0.1, TRIM);
  boxAt(g, 2.4, 0.12, 0.06, 0, baseY + mh * 0.72, faceZ + 0.1, TRIM);

  // Portico — stone columns + timber lintel
  const pz = md / 2 + 2.0;
  boxAt(g, 7.0, 0.28, 3.2, 0, baseY + 4.2, pz, TRIM);
  boxAt(g, 7.2, 0.12, 3.4, 0, baseY + 4.4, pz, WOOD);
  addColumns(g, [-2.4, -0.8, 0.8, 2.4], baseY, 4.0, pz + 1.1, 0.38, STONE);

  // Steps + grand double door
  boxAt(g, 5.8, 0.18, 1.5, 0, 0.16, md / 2 + 0.85, PLINTH);
  boxAt(g, 5.2, 0.14, 1.0, 0, 0.3, md / 2 + 0.55, PLINTH);
  addDoorFrame(g, -0.7, baseY + 1.7, md / 2 + 0.05, 1.2, 2.8, WOOD, 0x5a3a28, 0xd4e0f0);
  addDoorFrame(g, 0.7, baseY + 1.7, md / 2 + 0.05, 1.2, 2.8, WOOD, 0x5a3a28, 0xd4e0f0);

  // Facade sun plaque (gold punch)
  boxAt(g, 2.4, 2.0, 0.1, 0, baseY + mh * 0.42, faceZ + 0.08, 0xfff8e8);
  addSunSymbol(g, 0, baseY + mh * 0.42, faceZ + 0.18, 0.95);
  // gold emissive core so Millis sun reads at distance
  glowBox(g, 0.55, 0.55, 0.06, 0, baseY + mh * 0.42, faceZ + 0.22, 0xf0c050, 0xffd060, 0.4);

  // Bell steeple (left front corner of nave)
  const sx = -mw * 0.28;
  const steepleBase = baseY + mh;
  boxAt(g, 3.2, 5.5, 3.2, sx, steepleBase + 2.75, md * 0.15, STONE);
  boxAt(g, 2.6, 1.2, 2.6, sx, steepleBase + 6.0, md * 0.15, TRIM);
  // open bell chamber
  boxAt(g, 1.6, 1.4, 0.08, sx, steepleBase + 6.0, md * 0.15 + 1.35, 0x3a3530);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), makeToon(0xe0b040));
  bell.position.set(sx, steepleBase + 5.7, md * 0.15);
  g.add(bell);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.2, 8), makeToon(ROOF));
  spire.position.set(sx, steepleBase + 8.6, md * 0.15);
  g.add(spire);
  boxAt(g, 0.12, 1.4, 0.12, sx, steepleBase + 11.0, md * 0.15, 0xc8b080);
  addSunSymbol(g, sx, steepleBase + 11.7, md * 0.15, 0.35);

  // Side buttress ribs
  for (const bx of [-mw * 0.48, mw * 0.48]) {
    boxAt(g, 0.7, mh * 0.85, 1.4, bx, baseY + mh * 0.42, md * 0.1, STONE_WARM);
  }

  // Courtyard micro-props — density without cluttering plaza
  addCrate(g, mw * 0.38, 0, md / 2 + 2.8, 0.6, 0.5, 0.55);
  addBarrel(g, -mw * 0.42, 0, md / 2 + 2.5, 1.05);

  return finishProp(g);
}

// —— 冒险者公会：木石大厅 + 大招牌 + 告示板 + 双开门 ——
function createAdventurersGuild() {
  const g = new THREE.Group();
  const WOOD = 0x8b5e3c;
  const WOOD_DARK = 0x4a2e1c;
  const PLASTER = 0xf6ecda;
  const STONE = 0xb8ac98;
  const ACCENT = 0x6a2030; // burgundy — stronger than washed brick
  const GREEN = 0x2f5a38;
  const ROOF = 0xc24a38;
  const GLASS = 0x9ec8a0;

  // footprint ~10×8, height L (~12m timber hall)
  const w = 9.6;
  const d = 7.2;
  const h = 11.2;
  const plinthH = 0.55;
  const baseY = plinthH;

  addPlinth(g, w + 0.8, d + 0.6, plinthH, STONE);
  // Stone ground storey
  boxAt(g, w, h * 0.42, d, 0, baseY + h * 0.21, 0, STONE);
  // Timber / plaster upper
  boxAt(g, w * 0.98, h * 0.58, d * 0.96, 0, baseY + h * 0.42 + h * 0.29, 0, PLASTER);
  // Timber frame beams (thicker = readable under outline)
  for (const sx of [-w * 0.42, 0, w * 0.42]) {
    boxAt(g, 0.32, h * 0.58, 0.16, sx, baseY + h * 0.71, d / 2 + 0.04, WOOD);
  }
  boxAt(g, w * 1.0, 0.26, 0.16, 0, baseY + h * 0.42, d / 2 + 0.05, WOOD);
  boxAt(g, w * 1.0, 0.2, 0.14, 0, baseY + h * 0.72, d / 2 + 0.05, WOOD);
  // diagonal brace — half-timber read
  boxAt(g, 0.18, h * 0.28, 0.12, -w * 0.22, baseY + h * 0.58, d / 2 + 0.05, WOOD);
  boxAt(g, 0.18, h * 0.28, 0.12, w * 0.22, baseY + h * 0.58, d / 2 + 0.05, WOOD);

  addGableRoof(g, w, d, baseY + h, ROOF, 2.2);

  // Upper windows — warm interior glow
  for (let col = 0; col < 4; col++) {
    const x = ((col + 0.5) / 4 - 0.5) * w * 0.72;
    boxAt(g, 1.1, 1.5, 0.06, x, baseY + h * 0.62, d / 2 + 0.04, WOOD);
    glowBox(g, 0.9, 1.25, 0.05, x, baseY + h * 0.62, d / 2 + 0.08, GLASS, 0xffe0a0, 0.35);
  }

  // Portico — timber posts + deep canopy
  const pz = d / 2 + 1.4;
  boxAt(g, 6.4, 0.28, 2.8, 0, baseY + 3.8, pz, WOOD);
  boxAt(g, 6.6, 0.12, 3.0, 0, baseY + 4.0, pz, ACCENT);
  addColumns(g, [-2.1, 0, 2.1], baseY, 3.65, pz + 1.0, 0.32, WOOD_DARK);

  // Steps + double door
  boxAt(g, 5.2, 0.16, 1.3, 0, 0.14, d / 2 + 0.7, STONE);
  boxAt(g, 4.6, 0.14, 0.85, 0, 0.28, d / 2 + 0.45, STONE);
  addDoorFrame(g, -0.65, baseY + 1.7, d / 2 + 0.05, 1.15, 2.7, WOOD_DARK, 0x3a2818, GLASS);
  addDoorFrame(g, 0.65, baseY + 1.7, d / 2 + 0.05, 1.15, 2.7, WOOD_DARK, 0x3a2818, GLASS);

  // Big hanging guild signboard — high-contrast so it reads from plaza
  boxAt(g, 0.14, 1.4, 0.14, 0, baseY + h * 0.55, d / 2 + 1.7, WOOD_DARK);
  boxAt(g, 3.8, 1.7, 0.16, 0, baseY + h * 0.74, d / 2 + 1.7, WOOD_DARK);
  boxAt(g, 3.4, 1.35, 0.12, 0, baseY + h * 0.74, d / 2 + 1.8, GREEN);
  boxAt(g, 2.8, 0.4, 0.1, 0, baseY + h * 0.82, d / 2 + 1.88, 0xfff0d0);
  // crossed-sword hint (lighter metal)
  boxAt(g, 1.9, 0.14, 0.07, 0, baseY + h * 0.68, d / 2 + 1.88, 0xe8d8a8);
  boxAt(g, 0.14, 1.25, 0.07, 0, baseY + h * 0.68, d / 2 + 1.88, 0xe8d8a8);
  // small gold rivets / badge
  glowBox(g, 0.35, 0.35, 0.06, 0, baseY + h * 0.74, d / 2 + 1.92, 0xe8c050, 0xffd060, 0.35);

  // Burgundy banners on posts
  for (const sx of [-w * 0.35, w * 0.35]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.5, 6), makeToon(WOOD));
    pole.position.set(sx, baseY + h + 2.0, d * 0.1);
    g.add(pole);
    boxAt(g, 1.15, 1.55, 0.06, sx + 0.55, baseY + h + 3.2, d * 0.1, ACCENT);
    boxAt(g, 0.9, 0.18, 0.05, sx + 0.55, baseY + h + 3.85, d * 0.1, 0xe8c050);
  }

  // Outdoor notice board (guild signature)
  boxAt(g, 0.1, 1.8, 0.1, w * 0.42, 0.95, d / 2 + 2.2, WOOD);
  boxAt(g, 0.1, 1.8, 0.1, w * 0.42 + 1.3, 0.95, d / 2 + 2.2, WOOD);
  boxAt(g, 1.5, 1.2, 0.08, w * 0.42 + 0.65, 1.35, d / 2 + 2.2, WOOD_DARK);
  boxAt(g, 0.45, 0.5, 0.04, w * 0.42 + 0.35, 1.45, d / 2 + 2.26, 0xf0e8d0);
  boxAt(g, 0.4, 0.45, 0.04, w * 0.42 + 0.95, 1.25, d / 2 + 2.26, 0xe8d8b8);
  boxAt(g, 0.5, 0.28, 0.04, w * 0.42 + 0.65, 1.7, d / 2 + 2.26, 0xd4a84a);

  // Chimney + warm hearth hint on side
  boxAt(g, 1.0, 2.4, 1.0, -w * 0.3, baseY + h + 2.0, -d * 0.2, STONE);
  glowBox(g, 0.55, 0.7, 0.08, -w * 0.48, baseY + 1.4, 0.2, 0xe07040, 0xff8040, 0.4);

  // Yard clutter — crates / barrels sell "adventurer hub"
  addCrate(g, -w * 0.4, 0, d / 2 + 2.6, 0.7, 0.55, 0.6);
  addCrate(g, -w * 0.4 + 0.75, 0, d / 2 + 2.45, 0.5, 0.4, 0.48);
  addBarrel(g, w * 0.38, 0, d / 2 + 2.55, 1.1);
  addBarrel(g, w * 0.52, 0, d / 2 + 2.3, 0.9);

  return finishProp(g);
}

// —— 旅馆 / 旅店：暖木 + 悬挂招牌 + 底楼酒馆窗 ——
function createInn() {
  const g = new THREE.Group();
  const WALL = 0xf6ecda;
  const WOOD = 0x8b5e3c;
  const WOOD_DARK = 0x4a2e1c;
  const ROOF = 0xc24a38;
  const GLOW = 0xffe8b0;
  const PLINTH = 0xd4b896;
  const ACCENT = 0x8a2030;

  const w = 5.8;
  const d = 4.8;
  const h = 7.2;
  const plinthH = 0.25;
  const baseY = plinthH;

  addPlinth(g, w, d, plinthH, PLINTH);
  boxAt(g, w, h, d, 0, baseY + h / 2, 0, WALL);
  // Timber banding
  boxAt(g, w * 1.02, 0.2, 0.14, 0, baseY + h * 0.48, d / 2 + 0.04, WOOD);
  boxAt(g, 0.26, h * 0.95, 0.14, -w * 0.45, baseY + h * 0.5, d / 2 + 0.04, WOOD);
  boxAt(g, 0.26, h * 0.95, 0.14, w * 0.45, baseY + h * 0.5, d / 2 + 0.04, WOOD);
  // mid cross beam
  boxAt(g, w * 0.85, 0.12, 0.1, 0, baseY + h * 0.72, d / 2 + 0.04, WOOD);
  addGableRoof(g, w, d, baseY + h, ROOF, 1.6);

  // Ground tavern bay — warm emissive glow (hero detail)
  boxAt(g, w * 0.7, h * 0.32, 0.45, -0.15, baseY + h * 0.26, d / 2 + 0.18, WOOD);
  glowBox(g, w * 0.6, h * 0.26, 0.1, -0.15, baseY + h * 0.26, d / 2 + 0.42, GLOW, 0xffc060, 0.75);
  boxAt(g, 0.05, h * 0.24, 0.04, -0.15, baseY + h * 0.26, d / 2 + 0.48, WOOD_DARK);
  boxAt(g, w * 0.5, 0.05, 0.04, -0.15, baseY + h * 0.26, d / 2 + 0.48, WOOD_DARK);
  // second mullion for window panes
  boxAt(g, 0.05, h * 0.24, 0.04, -0.15 - w * 0.15, baseY + h * 0.26, d / 2 + 0.48, WOOD_DARK);
  boxAt(g, 0.05, h * 0.24, 0.04, -0.15 + w * 0.15, baseY + h * 0.26, d / 2 + 0.48, WOOD_DARK);

  // Striped tavern awning
  addStripedAwning(g, w * 0.95, baseY + h * 0.48, d + 0.35, [ACCENT, 0xf5f0e6]);

  // Door
  addDoorFrame(g, w * 0.32, baseY + h * 0.24, d / 2 + 0.03, 0.85, h * 0.38, WOOD, WOOD_DARK, 0xd4e8f0);

  // Upper guest windows — soft warm glow
  for (let c = 0; c < 3; c++) {
    const x = ((c + 0.5) / 3 - 0.5) * w * 0.7;
    const y = baseY + h * 0.7;
    const z = d / 2 + 0.03;
    boxAt(g, 0.85, 0.95, 0.05, x, y, z, WOOD);
    glowBox(g, 0.7, 0.75, 0.04, x, y, z + 0.03, 0xc8e0f0, 0xffe0b0, 0.4);
    boxAt(g, 0.04, 0.7, 0.03, x, y, z + 0.05, WOOD);
    boxAt(g, 0.65, 0.04, 0.03, x, y, z + 0.05, WOOD);
  }

  // Hanging inn sign (mug silhouette) — punchier red
  boxAt(g, 0.1, 0.9, 0.1, 0, baseY + h * 0.62, d / 2 + 0.75, WOOD_DARK);
  boxAt(g, 1.7, 1.25, 0.14, 0, baseY + h * 0.84, d / 2 + 0.75, WOOD_DARK);
  boxAt(g, 1.45, 1.0, 0.12, 0, baseY + h * 0.84, d / 2 + 0.84, ACCENT);
  boxAt(g, 0.4, 0.5, 0.07, -0.18, baseY + h * 0.84, d / 2 + 0.92, 0xfff0d0);
  boxAt(g, 0.14, 0.6, 0.06, 0.28, baseY + h * 0.84, d / 2 + 0.92, 0xfff0d0);

  // Bench + planter
  boxAt(g, 1.7, 0.12, 0.42, -w * 0.2, 0.42, d / 2 + 1.05, 0xc4a070);
  boxAt(g, 0.12, 0.38, 0.12, -w * 0.2 - 0.65, 0.24, d / 2 + 1.05, WOOD);
  boxAt(g, 0.12, 0.38, 0.12, -w * 0.2 + 0.65, 0.24, d / 2 + 1.05, WOOD);
  boxAt(g, 0.55, 0.35, 0.45, w * 0.35, 0.28, d / 2 + 1.1, WOOD);
  boxAt(g, 0.45, 0.2, 0.35, w * 0.35, 0.52, d / 2 + 1.1, 0x4ab86a);
  addBarrel(g, -w * 0.42, 0, d / 2 + 1.15, 0.85);

  // Chimney
  boxAt(g, 0.55, 1.4, 0.55, w * 0.28, baseY + h + 1.0, -d * 0.15, 0xa89078);

  return finishProp(g);
}

// —— 远景城堡 / 城塞剪影 ——
function createSkylineKeep(variant = 0) {
  const g = new THREE.Group();
  const configs = [
    { w: 7.0, d: 6.5, h: 22, top: 'keep' },
    { w: 5.5, d: 5.5, h: 18, top: 'tower' },
    { w: 8.0, d: 5.5, h: 26, top: 'wall' },
  ];
  const c = configs[variant % configs.length];
  const STONE = 0xa89880;
  const DARK = 0x8a7a68;
  const ROOF = 0x6a5040;
  addPlinth(g, c.w, c.d, 0.5, DARK);
  boxAt(g, c.w, c.h, c.d, 0, 0.5 + c.h / 2, 0, STONE);
  // battlement teeth
  const teeth = Math.max(4, Math.round(c.w / 1.4));
  for (let i = 0; i < teeth; i++) {
    const x = ((i + 0.5) / teeth - 0.5) * c.w * 0.92;
    boxAt(g, c.w / teeth * 0.55, 1.4, 0.7, x, 0.5 + c.h + 0.7, c.d / 2 - 0.15, STONE);
  }
  // arrow-slit windows
  const floors = Math.floor(c.h / 4.5);
  for (let i = 0; i < floors; i++) {
    const y = 2.5 + i * 4.2;
    for (const x of [-c.w * 0.28, c.w * 0.28]) {
      boxAt(g, 0.35, 1.6, 0.08, x, y, c.d / 2 + 0.03, 0x3a3530);
    }
  }
  if (c.top === 'keep') {
    boxAt(g, c.w * 0.45, c.h * 0.35, c.d * 0.45, -c.w * 0.2, 0.5 + c.h + c.h * 0.15, 0, DARK);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(c.w * 0.28, 4.5, 6), makeToon(ROOF));
    cone.position.set(-c.w * 0.2, 0.5 + c.h + c.h * 0.35 + 1.5, 0);
    g.add(cone);
  } else if (c.top === 'tower') {
    boxAt(g, c.w * 0.55, c.h * 0.22, c.d * 0.55, 0, 0.5 + c.h + c.h * 0.1, 0, DARK);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(c.w * 0.35, 5.0, 8), makeToon(ROOF));
    cone.position.y = 0.5 + c.h + c.h * 0.22 + 2.2;
    g.add(cone);
  } else {
    boxAt(g, c.w * 1.1, 2.2, 1.2, 0, 0.5 + c.h * 0.55, c.d / 2 + 0.4, DARK);
    boxAt(g, 2.2, c.h * 0.4, 2.2, c.w * 0.45, 0.5 + c.h * 0.7, -c.d * 0.1, STONE);
  }
  return finishProp(g);
}

function createPlazaPad(size = 14) {
  // Crafted cobble plaza (environment module)
  return createEnvPlazaPad(size);
}

/** Village well / simple magic-circle plinth for plaza. */
function createWell() {
  const g = new THREE.Group();
  const STONE = 0xa89880;
  const WOOD = 0x8b5e3c;
  // base ring
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.85, 14), makeToon(STONE));
  ring.position.y = 0.42;
  g.add(ring);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 12), makeToon(0x4a6a78));
  inner.position.y = 0.78;
  g.add(inner);
  // posts + roof
  for (const sx of [-0.7, 0.7]) {
    boxAt(g, 0.12, 1.6, 0.12, sx, 1.55, 0, WOOD);
  }
  boxAt(g, 1.8, 0.1, 1.1, 0, 2.4, 0, 0xb85a48);
  // crank beam
  boxAt(g, 1.5, 0.08, 0.08, 0, 2.15, 0, WOOD);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.28, 8), makeToon(WOOD));
  bucket.position.set(0, 1.55, 0.35);
  g.add(bucket);
  // faint magic-circle ring on ground
  const circle = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.05, 6, 24), makeToon(0x7ec8e8));
  circle.rotation.x = Math.PI / 2;
  circle.position.y = 0.04;
  g.add(circle);
  return finishProp(g);
}

function createQuestBoard() {
  const g = new THREE.Group();
  const WOOD = 0x8b5e3c;
  const DARK = 0x5a3a28;
  boxAt(g, 0.12, 2.1, 0.12, -0.45, 1.05, 0, WOOD);
  boxAt(g, 0.12, 2.1, 0.12, 0.45, 1.05, 0, WOOD);
  boxAt(g, 1.3, 1.2, 0.1, 0, 1.55, 0, DARK);
  boxAt(g, 0.4, 0.45, 0.05, -0.28, 1.65, 0.06, 0xf0e8d0);
  boxAt(g, 0.35, 0.4, 0.05, 0.3, 1.4, 0.06, 0xe8d8b8);
  boxAt(g, 0.5, 0.25, 0.05, 0, 1.85, 0.06, 0xd4c4a0);
  boxAt(g, 0.9, 0.2, 0.06, 0, 2.25, 0.06, 0x3d5a40);
  return finishProp(g);
}

function createCottageSilhouette() {
  const g = new THREE.Group();
  const w = 9.0;
  const d = 6.0;
  const h = 8.5;
  const WALL = 0xe8dcc8;
  const WOOD = 0x8b5e3c;
  const ROOF = 0xb85a48;
  boxAt(g, w, h, d, 0, h / 2, 0, WALL);
  addGableRoof(g, w, d, h, ROOF, 2.0);
  // timber frame hint
  for (const sx of [-w * 0.35, 0, w * 0.35]) {
    boxAt(g, 0.25, h * 0.9, 0.12, sx, h * 0.5, d / 2 + 0.04, WOOD);
  }
  for (let f = 0; f < 3; f++) {
    const y = 1.8 + f * 2.2;
    for (let c = 0; c < 4; c++) {
      const x = ((c + 0.5) / 4 - 0.5) * w * 0.7;
      boxAt(g, 0.85, 1.0, 0.05, x, y, d / 2 + 0.04, 0x88a8b0);
    }
  }
  return finishProp(g);
}

function createMagicShop() {
  const g = new THREE.Group();
  const w = 3.8;
  const d = 3.6;
  const h = 5.2;
  const WALL = 0xe8dcf0;
  const WOOD = 0x8b5e3c;
  const ACCENT = 0x6a4080;
  const ROOF = 0x5a4070;
  addPlinth(g, w, d, 0.18, 0xc8b8d0);
  boxAt(g, w, h, d, 0, 0.18 + h / 2, 0, WALL);
  addGableRoof(g, w, d, 0.18 + h, ROOF, 1.8);
  // pointed dormer tip
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 6), makeToon(ACCENT));
  tip.position.set(0, 0.18 + h + 2.4, 0);
  g.add(tip);
  // crystal orb — soft magic glow
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 10, 8),
    makeGlow(0x7ec8e8, 0xa0e0ff, 0.65),
  );
  orb.position.set(0, 0.18 + h + 3.3, 0);
  g.add(orb);
  addStripedAwning(g, w, (0.18 + h) * 0.5, d, [ACCENT, 0xf5f0e6]);
  boxAt(g, w * 0.65, h * 0.32, 0.05, -0.05, 0.18 + h * 0.3, d / 2 + 0.03, WOOD);
  glowBox(g, w * 0.55, h * 0.26, 0.05, -0.05, 0.18 + h * 0.3, d / 2 + 0.05, 0xb8a0e0, 0xd0b0ff, 0.45);
  addDoorFrame(g, w * 0.28, 0.18 + h * 0.26, d / 2 + 0.03, 0.55, h * 0.42, WOOD, 0x4a3020, 0xd0e0f8);
  boxAt(g, 1.1, 0.55, 0.1, -w * 0.1, 0.18 + h * 0.72, d / 2 + 0.3, ACCENT);
  // crystal orb already on roof — boost glow
  return finishProp(g);
}

function createSmithy() {
  const g = new THREE.Group();
  const w = 4.4;
  const d = 3.8;
  const h = 4.2;
  const WALL = 0xc8b8a0;
  const WOOD = 0x5a3a28;
  const ROOF = 0x6a6060;
  addPlinth(g, w, d, 0.2, 0xa89880);
  boxAt(g, w, h, d, 0, 0.2 + h / 2, 0, WALL);
  addGableRoof(g, w, d, 0.2 + h, ROOF, 1.3);
  // open forge mouth — hot emissive
  boxAt(g, w * 0.45, h * 0.4, 0.08, -0.3, 0.2 + h * 0.32, d / 2 + 0.04, WOOD);
  glowBox(g, w * 0.35, h * 0.3, 0.06, -0.3, 0.2 + h * 0.32, d / 2 + 0.08, 0xe07040, 0xff6020, 0.85);
  addDoorFrame(g, w * 0.32, 0.2 + h * 0.28, d / 2 + 0.03, 0.7, h * 0.48, WOOD, 0x3a2818, null);
  // chimney stack
  boxAt(g, 0.9, 2.8, 0.9, w * 0.25, 0.2 + h + 1.2, -d * 0.15, 0x8a8078);
  boxAt(g, 1.1, 0.25, 1.1, w * 0.25, 0.2 + h + 2.6, -d * 0.15, 0x5a5048);
  // hanging horseshoe / tool sign
  boxAt(g, 0.9, 0.55, 0.08, 0, 0.2 + h * 0.78, d / 2 + 0.35, 0x8a9098);
  addCrate(g, w * 0.35, 0, d / 2 + 0.9, 0.5, 0.4, 0.45);
  return finishProp(g);
}

function createGeneralShop() {
  const g = new THREE.Group();
  const w = 3.9;
  const d = 3.6;
  const h = 4.0;
  const WALL = 0xf6ecda;
  const WOOD = 0x8b5e3c;
  const ROOF = 0xc24a38;
  addPlinth(g, w, d, 0.18, 0xd4c4a8);
  boxAt(g, w, h, d, 0, 0.18 + h / 2, 0, WALL);
  addGableRoof(g, w, d, 0.18 + h, ROOF, 1.2);
  addStripedAwning(g, w, (0.18 + h) * 0.52, d, [0x3d5a40, 0xf5f0e6]);
  boxAt(g, w * 0.7, h * 0.36, 0.05, -0.08, 0.18 + h * 0.34, d / 2 + 0.03, WOOD);
  glowBox(g, w * 0.6, h * 0.3, 0.05, -0.08, 0.18 + h * 0.34, d / 2 + 0.05, 0xb8d0c0, 0xffe8c0, 0.3);
  addDoorFrame(g, w * 0.3, 0.18 + h * 0.28, d / 2 + 0.03, 0.55, h * 0.48, WOOD, 0x4a3020, 0xd0e8f0);
  boxAt(g, 1.15, 0.45, 0.08, 0, 0.18 + h * 0.78, d / 2 + 0.25, 0xf0b840);
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

function createCarriageStop() {
  const g = new THREE.Group();
  const WOOD = 0x8b5e3c;
  const ROOF = 0xb85a48;
  // timber posts + shingle shelter
  for (const x of [-1.2, 1.2]) boxAt(g, 0.12, 1.7, 0.12, x, 0.85, -0.25, WOOD);
  boxAt(g, 2.8, 0.12, 1.3, 0, 1.75, 0, ROOF);
  boxAt(g, 2.9, 0.06, 1.4, 0, 1.85, 0, 0x6a5040);
  // bench
  boxAt(g, 1.9, 0.1, 0.45, 0, 0.5, 0.15, WOOD);
  boxAt(g, 0.1, 0.45, 0.1, -0.85, 0.28, 0.15, WOOD);
  boxAt(g, 0.1, 0.45, 0.1, 0.85, 0.28, 0.15, WOOD);
  // roadside post / hitching rail
  boxAt(g, 0.12, 1.1, 0.12, 1.55, 0.55, 0.2, WOOD);
  boxAt(g, 0.45, 0.35, 0.06, 1.55, 1.15, 0.25, 0x3d5a40);
  return finishProp(g);
}

function createStreetLight() {
  const g = new THREE.Group();
  const WOOD = 0x6a5040;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.9, 6), makeToon(WOOD));
  pole.position.y = 1.45;
  g.add(pole);
  // lantern housing + emissive core
  boxAt(g, 0.35, 0.45, 0.35, 0, 2.85, 0, 0x5a4030);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    makeGlow(0xffe8a0, 0xffc060, 0.7),
  );
  lamp.position.set(0, 2.85, 0);
  g.add(lamp);
  boxAt(g, 0.42, 0.06, 0.42, 0, 3.12, 0, WOOD);
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
      // Deeper blues — less washed near zenith (anti washed-out)
      uZenith: { value: new THREE.Color(0x2f84c8) },
      uMid: { value: new THREE.Color(0x5eb0e0) },
      uHorizon: { value: new THREE.Color(0xa8d8f0) },
      uGround: { value: new THREE.Color(0x90c8a8) },
      uSunDir: { value: new THREE.Vector3(0.42, 0.72, 0.38).normalize() },
      uSunColor: { value: new THREE.Color(0xfff0c8) },
      uCloud: { value: new THREE.Color(0xf2f8fc) },
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
      return createPlazaPad(place.footprintWxD?.[0] ?? MUSHOKU_SLICE_P0.meta.plazaSize);
    case 'well':
      return createWell();
    case 'adventurersGuild': {
      // No legacy fallback — if hero fails we want a loud error, not silent old boxes
      const h = createHeroBuilding('adventurersGuild');
      if (!h) throw new Error('[layout] hero adventurersGuild failed');
      return h;
    }
    case 'temple': {
      const h = createHeroBuilding('temple');
      if (!h) throw new Error('[layout] hero temple failed');
      return h;
    }
    case 'inn': {
      const h = createHeroBuilding('inn');
      if (!h) throw new Error('[layout] hero inn failed');
      return h;
    }
    case 'shopMagic':
      return createMagicShop();
    case 'shopSmithy':
      return createSmithy();
    case 'shopGeneral':
      return createGeneralShop();
    case 'carriageStop':
      return createCarriageStop();
    case 'questBoard':
      return createQuestBoard();
    case 'skylineKeep':
      return createSkylineKeep(place.variant ?? 0);
    case 'cottageSilhouette':
      return createCottageSilhouette();
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
  const plantedHeroes = [];

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
      place.type !== 'well' &&
      place.type !== 'streetLight' &&
      place.type !== 'questBoard' &&
      (place.heightHint === 'L' || place.heightHint === 'XL') &&
      Math.hypot(place.x, place.z) < 8
    ) {
      console.warn(`[layout] skipped tall place too close to plaza: ${place.id}`);
      continue;
    }
    const obj = buildByType(place.type, place, assets);
    if (!obj) continue;
    if (obj.name?.startsWith('hero.')) {
      plantedHeroes.push({ id: place.id, type: place.type, name: obj.name, x: place.x, z: place.z });
    }
    const scale = place.scale ?? 1;
    plant(obj, place.x, place.z, place.yaw ?? 0, scale);
  }

  if (plantedHeroes.length) {
    console.info('[layout] hero buildings planted:', plantedHeroes);
    if (typeof window !== 'undefined') window.__heroes = plantedHeroes;
  } else {
    console.warn('[layout] no hero.* buildings planted — still on legacy builders?');
  }
}

/** @deprecated dense 90s town — kept only as reference; prefer populateFromLayout */
function populateTown(plant, { treePick, gltfHouse }, { density = 1, maxR = 55 } = {}) {
  populateFromLayout(plant, MUSHOKU_SLICE_P0, { treePick, gltfHouse }, { maxR });
  if (density < 0.5) return;
  // Optional light vegetation outside landmarks only (still sparse, no housing blocks).
  scatterAround(plant, createBush, Math.round(6 * density), {
    minR: 20,
    maxR: Math.min(maxR, 34),
    scale: [0.7, 1.1],
  });
}

/** Short dirt-road tile (sole at y=0). Long roads = segmented tiles for sphere later. */
function createRoadTile(length, width, _color = ROAD) {
  return createEnvRoadTile(length, width);
}

/** Segment a long road into short flat tiles so each sole can bury into the sphere. */
function plantRoadLine(plant, { x0, z0, x1, z1, width = 5.2, step = 5.5, color = ROAD }) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) return;
  // Tile length along local X; face so local X follows the line.
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

// Mushoku village-slice: flat authoring stage — declarative layout, plant = flat
export async function createFlatWorld(scene, loader) {
  // Crafted meadow (procedural grass canvas) — not a single flat green plastic plane
  const ground = createMeadowGround(200);
  scene.add(ground);

  const sky = createSky();
  scene.add(sky);

  // Fewer, larger soft clouds — countryside air, not random confetti
  const clouds = new THREE.Group();
  const cloudMat = makeToon(0xf4f8fc);
  cloudMat.transparent = true;
  cloudMat.opacity = 0.88;
  cloudMat.depthWrite = false;
  const cloudSlots = [
    [-40, 16, -20], [30, 18, -35], [-25, 14, 30], [45, 17, 15],
    [10, 20, -50], [-50, 15, 5], [20, 19, 40], [-15, 16, -45],
  ];
  for (let i = 0; i < cloudSlots.length; i++) {
    const cloud = new THREE.Group();
    const n = 4 + (i % 3);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(1.1 + (j % 3) * 0.35, 12, 10),
        cloudMat,
      );
      puff.position.set((j - n * 0.5) * 1.1, (j % 2) * 0.2, (j % 3 - 1) * 0.35);
      puff.scale.set(1, 0.45, 0.85);
      cloud.add(puff);
    }
    cloud.position.set(cloudSlots[i][0], cloudSlots[i][1], cloudSlots[i][2]);
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

  // Dirt aprons under main landmarks — grass doesn't read as plastic lawn under feet of buildings
  for (const [x, z, r] of [
    [-11, -10, 9],
    [2, -16, 11],
    [11, -9, 7],
    [0, 0, 10],
  ]) {
    const apron = createBuildingDirtApron(r);
    apron.position.set(x, 0, z);
    group.add(apron);
  }

  const assets = await loadTownAssets();
  const plant = makePlant(group, 'flat');
  // Roads + landmarks from the same table (segmented tiles, sole@y=0).
  populateFromLayout(plant, MUSHOKU_SLICE_P0, assets, {
    maxR: MUSHOKU_SLICE_P0.meta.playableHalfExtent + 8,
  });

  // Roadside grass tufts + pebbles — ground micro-read, not empty lawn
  scatterGroundMicroDetail(group, {
    half: MUSHOKU_SLICE_P0.meta.playableHalfExtent ?? 32,
  });

  return {
    ground,
    group,
    sky,
    clouds,
    mode: 'flat',
    layout: MUSHOKU_SLICE_P0,
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
  populateFromLayout(plant, MUSHOKU_SLICE_P0, assets, { maxR: 30 });

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
