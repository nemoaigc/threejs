/**
 * Flat village environment — ground / roads / plaza craft.
 * Spec: countryside Buena-Roa slice; cel-friendly, readable materials.
 * Ground is not a freebie plane: texture + shoulders + aprons + micro props.
 */
import * as THREE from 'three';
import { makeToon } from '../entities/building/toon.js';
import {
  makeGrassTexture,
  makeDirtRoadTexture,
  makeCobbleTexture,
  makeShoulderTexture,
  makeWornEarthApronTexture,
} from './textures.js';

// Lazy singleton textures (built once on first flat world)
let _tex = null;
function textures() {
  if (_tex) return _tex;
  _tex = {
    grass: makeGrassTexture(512),
    road: makeDirtRoadTexture(512),
    cobble: makeCobbleTexture(512),
    shoulder: makeShoulderTexture(256),
    apron: makeWornEarthApronTexture(256),
  };
  return _tex;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noOutline(o) {
  o.userData.noOutline = true;
  o.traverse?.((c) => {
    c.userData.noOutline = true;
  });
  return o;
}

/** Meadow ground — textured toon grass, subtle shader patching. */
export function createMeadowGround(size = 200) {
  const t = textures();
  const mat = makeToon(0x6bb84f);
  mat.map = t.grass;
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       #ifdef USE_MAP
         // Keep meadow lively under cel + posterize
         vec3 lush = vec3(0.38, 0.62, 0.30);
         vec3 dry = vec3(0.52, 0.58, 0.32);
         float n = fract(sin(dot(vMapUv * 12.0, vec2(12.9898, 78.233))) * 43758.5453);
         vec3 tint = mix(lush, dry, n * 0.35);
         diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * tint + tint * 0.08, 0.35);
       #endif`,
    );
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return noOutline(mesh);
}

/**
 * Dirt road segment — dual ruts + soft shoulders.
 * Local +X = along road, +Z = across width. Sole at y=0.
 */
export function createDirtRoadTile(length, width) {
  const t = textures();
  const g = new THREE.Group();

  // wider soft shoulder (grass→dirt)
  const shoulderMat = makeToon(0x8a9a58);
  shoulderMat.map = t.shoulder;
  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.03, width * 1.45),
    shoulderMat,
  );
  shoulder.position.y = 0.012;
  shoulder.receiveShadow = true;
  g.add(shoulder);

  // main packed dirt
  const roadMat = makeToon(0xa89070);
  roadMat.map = t.road;
  // stretch road texture along length
  const roadMap = t.road.clone();
  roadMap.repeat.set(1, Math.max(1, length / width));
  roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;
  roadMat.map = roadMap;

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.98, 0.045, width),
    roadMat,
  );
  road.position.y = 0.028;
  road.receiveShadow = true;
  g.add(road);

  // thin edge stones (optional curb feel)
  const curbMat = makeToon(0x8a8070);
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.96, 0.06, 0.12),
      curbMat,
    );
    curb.position.set(0, 0.04, side * (width * 0.5 + 0.02));
    curb.receiveShadow = true;
    g.add(curb);
  }

  noOutline(g);
  return g;
}

/**
 * Cobble plaza pad with warm rim and packed cross paths.
 * Sole at y=0, centered.
 */
export function createCobblePlaza(size = 14) {
  const t = textures();
  const g = new THREE.Group();

  // earth base under stones
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(size + 1.2, 0.04, size + 1.2),
    makeToon(0x8a7858),
  );
  base.position.y = 0.015;
  base.receiveShadow = true;
  g.add(base);

  const cobbleMat = makeToon(0xb8a890);
  cobbleMat.map = t.cobble;
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.07, size),
    cobbleMat,
  );
  pad.position.y = 0.045;
  pad.receiveShadow = true;
  g.add(pad);

  // rim of slightly darker cobbles
  const rimMat = makeToon(0x9a8a72);
  const rimH = 0.09;
  const rimT = 0.35;
  // four rim segments
  for (const [w, d, x, z] of [
    [size + 0.5, rimT, 0, size / 2 + rimT * 0.4],
    [size + 0.5, rimT, 0, -size / 2 - rimT * 0.4],
    [rimT, size + 0.5, size / 2 + rimT * 0.4, 0],
    [rimT, size + 0.5, -size / 2 - rimT * 0.4, 0],
  ]) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, rimH, d), rimMat);
    rim.position.set(x, rimH / 2, z);
    rim.receiveShadow = true;
    g.add(rim);
  }

  // packed-earth cross through plaza (roads continue visually)
  const pathMat = makeToon(0xa89070);
  pathMat.map = t.road;
  const pathW = 2.4;
  const pathEW = new THREE.Mesh(
    new THREE.BoxGeometry(size * 0.85, 0.02, pathW),
    pathMat,
  );
  pathEW.position.y = 0.085;
  pathEW.receiveShadow = true;
  g.add(pathEW);
  const pathNS = new THREE.Mesh(
    new THREE.BoxGeometry(pathW, 0.02, size * 0.85),
    pathMat,
  );
  pathNS.position.y = 0.086;
  pathNS.receiveShadow = true;
  g.add(pathNS);

  noOutline(g);
  return g;
}

/** Re-export for world.js road plant. */
export function createRoadTile(length, width) {
  return createDirtRoadTile(length, width);
}

export function createPlazaPad(size = 14) {
  return createCobblePlaza(size);
}

/**
 * Soft dirt rings under key landmarks.
 * Radial worn-earth with baked alpha — grass peeks at the rim, not a hard disc.
 */
export function createBuildingDirtApron(radius = 8) {
  const t = textures();
  const mat = makeToon(0xffffff);
  mat.map = t.apron;
  mat.transparent = true;
  mat.opacity = 1;
  mat.depthWrite = false;
  // avoid double-tinting: map already carries earth color
  mat.color.set(0xffffff);
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.018;
  m.receiveShadow = true;
  return noOutline(m);
}

/** Tiny grass clump — readable at ground scale, no outline. */
function createGrassTuft(scale = 1) {
  const g = new THREE.Group();
  const mat = makeToon(0x5faa42);
  const blades = 5 + Math.floor(hash2(scale * 17, 3) * 4);
  for (let i = 0; i < blades; i++) {
    const h = (0.18 + hash2(i, scale) * 0.22) * scale;
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.04 * scale, h, 3),
      mat,
    );
    blade.position.set(
      (hash2(i, 1) - 0.5) * 0.22 * scale,
      h * 0.45,
      (hash2(i, 2) - 0.5) * 0.22 * scale,
    );
    blade.rotation.z = (hash2(i, 3) - 0.5) * 0.35;
    blade.rotation.x = (hash2(i, 4) - 0.5) * 0.25;
    blade.castShadow = false;
    blade.receiveShadow = true;
    g.add(blade);
  }
  return noOutline(g);
}

/** Small roadside pebble cluster. */
function createPebble(scale = 1) {
  const mat = makeToon(0x9a9080);
  const m = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.08 * scale, 0),
    mat,
  );
  m.scale.set(1, 0.55 + hash2(scale, 9) * 0.3, 0.85);
  m.position.y = 0.03 * scale;
  m.rotation.y = hash2(scale, 10) * Math.PI;
  m.castShadow = false;
  m.receiveShadow = true;
  return noOutline(m);
}

/**
 * Scatter micro ground props along main axes so roads don't float on plastic lawn.
 * Call once from createFlatWorld after roads/landmarks are planted.
 */
export function scatterGroundMicroDetail(parent, { half = 32 } = {}) {
  const group = new THREE.Group();
  group.name = 'groundMicro';

  // Tufts along road shoulders (main cross + side streets)
  const roadLines = [
    // main E-W, N-S
    { axis: 'x', fixed: 0, from: -half, to: half, offset: 3.1 },
    { axis: 'z', fixed: 0, from: -half, to: half, offset: 3.1 },
    { axis: 'x', fixed: -18, from: -24, to: 24, offset: 2.2 },
    { axis: 'x', fixed: 18, from: -24, to: 24, offset: 2.2 },
    { axis: 'z', fixed: -18, from: -28, to: 28, offset: 2.2 },
    { axis: 'z', fixed: 18, from: -28, to: 28, offset: 2.2 },
  ];

  let seed = 0;
  for (const line of roadLines) {
    const span = line.to - line.from;
    const n = Math.max(4, Math.floor(Math.abs(span) / 3.2));
    for (let i = 0; i <= n; i++) {
      seed++;
      const t = i / n;
      const along = line.from + span * t;
      // skip plaza centre
      const px = line.axis === 'x' ? along : line.fixed;
      const pz = line.axis === 'z' ? along : line.fixed;
      if (Math.hypot(px, pz) < 6) continue;

      for (const side of [-1, 1]) {
        if (hash2(seed, side + 2) < 0.28) continue; // sparse
        const off = line.offset + (hash2(seed, side + 5) - 0.5) * 0.6;
        const x = line.axis === 'x' ? along : line.fixed + side * off;
        const z = line.axis === 'z' ? along : line.fixed + side * off;
        const tuft = createGrassTuft(0.75 + hash2(seed, 7) * 0.55);
        tuft.position.set(x, 0, z);
        tuft.rotation.y = hash2(seed, 8) * Math.PI * 2;
        group.add(tuft);

        if (hash2(seed, 11) > 0.62) {
          const pebble = createPebble(0.7 + hash2(seed, 12) * 0.8);
          pebble.position.set(
            x + (hash2(seed, 13) - 0.5) * 0.5,
            0,
            z + (hash2(seed, 14) - 0.5) * 0.5,
          );
          group.add(pebble);
        }
      }
    }
  }

  // A few free meadow tufts off the roads (sparse, far from buildings)
  for (let i = 0; i < 28; i++) {
    const ang = hash2(i, 80) * Math.PI * 2;
    const r = 14 + hash2(i, 81) * 22;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    // keep off main road bands
    if (Math.abs(x) < 4 || Math.abs(z) < 4) continue;
    const tuft = createGrassTuft(0.9 + hash2(i, 82) * 0.6);
    tuft.position.set(x, 0, z);
    tuft.rotation.y = hash2(i, 83) * Math.PI * 2;
    group.add(tuft);
  }

  noOutline(group);
  parent.add(group);
  return group;
}
