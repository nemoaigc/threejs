/**
 * Village ground — **loud volumetric Three.js** (must not read as textured paper).
 *
 * Design for hero camera (~6–12 m high): edge height must be obvious.
 * - Road: embankment + raised bed + vertical side walls + carved ruts
 * - Plaza: thick instanced stones with deep dark joints
 * - Meadow: real hills outside play pad
 * - Apron: chunky dirt mound
 *
 * Local road: +X along length, +Z across width.
 */
import * as THREE from 'three';
import { makeToon } from '../entities/building/toon.js';
import {
  ensureEnvTextures,
  makeGrassTexture,
  makeDirtRoadTexture,
  makeCobbleTexture,
  makeShoulderTexture,
  makeWornEarthApronTexture,
} from './textures.js';

export { ensureEnvTextures };

let _tex = null;
function textures() {
  if (_tex) return _tex;
  _tex = {
    grass: makeGrassTexture(),
    road: makeDirtRoadTexture(),
    cobble: makeCobbleTexture(),
    shoulder: makeShoulderTexture(),
    apron: makeWornEarthApronTexture(),
  };
  return _tex;
}

function noOutline(o) {
  o.userData.noOutline = true;
  o.traverse?.((c) => {
    c.userData.noOutline = true;
  });
  return o;
}

function mat(color, map = null, opts = {}) {
  const m = makeToon(color, opts);
  if (map) m.map = map;
  return m;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function boxMesh(parent, name, sx, sy, sz, x, y, z, material, { cast = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

// ─── Meadow ────────────────────────────────────────────────────────────────

/**
 * Rolling meadow with clear height — outer hills strong, centre gentler.
 * Play corridors (roads / plaza) are forced flat & below road sole so grass
 * never coplanar-fights volumetric road/plaza tops (z-fighting flash).
 */
export function createMeadowGround(size = 200, opts = {}) {
  const t = textures();
  const segs = 128;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const playR = 36;
  // Must stay under road embankment (~0) / bed top (~0.28)
  const flatY = -0.12;
  const roadHalf = opts.roadHalf ?? 3.4; // width/2 + shoulder bleed
  const ewHalfLen = opts.ewHalfLen ?? 24;
  const nsZ0 = opts.nsZ0 ?? -38;
  const nsZ1 = opts.nsZ1 ?? 20;
  const plazaR = opts.plazaR ?? 9.5;
  const blend = 1.6; // soft edge so no cliff seam

  // Three.js: MathUtils.smoothstep(x, min, max) — NOT GLSL (edge0, edge1, x)
  const sm = (x, a, b) => THREE.MathUtils.smoothstep(x, a, b);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    // 0 centre → 1 far field
    const far = sm(r, playR * 0.35, playR * 1.5);
    // Additive waves (not products) so hills actually reach full amplitude
    const n =
      Math.sin(x * 0.028 + 0.6) * 0.45 +
      Math.sin(z * 0.033 + 1.3) * 0.4 +
      Math.sin((x + z) * 0.055 + 0.2) * 0.35 +
      Math.sin(x * 0.09 - z * 0.07) * 0.22 +
      Math.sin(z * 0.12 + x * 0.04) * 0.15;
    // Outer hills only — play pad stays low so roads read thick
    const amp = 0.08 + far * 1.55;
    const h = n * amp;
    const micro = (hash2((x * 1.2) | 0, (z * 1.2) | 0) - 0.5) * (0.02 + far * 0.12);
    const yHill = h + micro - 0.08;

    // Corridor mask: 1 = fully flattened under roads/plaza (kills grass↔road z-fight)
    let mask = 0;
    // plaza disk
    mask = Math.max(mask, 1 - sm(r, plazaR - blend * 0.5, plazaR + blend));
    // EW road strip (z≈0)
    if (Math.abs(x) <= ewHalfLen + blend) {
      const along = 1 - sm(Math.abs(x), ewHalfLen, ewHalfLen + blend);
      const across = 1 - sm(Math.abs(z), roadHalf, roadHalf + blend);
      mask = Math.max(mask, along * across);
    }
    // NS road strip (x≈0)
    if (z >= nsZ0 - blend && z <= nsZ1 + blend) {
      const along = sm(z, nsZ0 - blend, nsZ0) * (1 - sm(z, nsZ1, nsZ1 + blend));
      const across = 1 - sm(Math.abs(x), roadHalf, roadHalf + blend);
      mask = Math.max(mask, along * across);
    }

    pos.setY(i, THREE.MathUtils.lerp(yHill, flatY, THREE.MathUtils.clamp(mask, 0, 1)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 12, uv.getY(i) * 12);
  uv.needsUpdate = true;

  const grassMat = mat(0x7ec85a, t.grass);
  // Push grass slightly behind coplanar props in the depth buffer
  grassMat.polygonOffset = true;
  grassMat.polygonOffsetFactor = 1;
  grassMat.polygonOffsetUnits = 4;

  const mesh = new THREE.Mesh(geo, grassMat);
  mesh.name = 'meadow_ground';
  mesh.receiveShadow = true;
  // No cast — large wavy plane self-shadows / acne-flickers under the sun cascade
  mesh.castShadow = false;
  mesh.userData.volumetric = true;
  return noOutline(mesh);
}

// ─── Road (chunky multi-mesh — impossible to mistake for a plane) ───────────

/**
 * Volumetric dirt road.
 * Embankment + thick bed + vertical side walls + two real rut trenches.
 * Top of bed ≈ 0.22 m so camera reads thickness against grass.
 */
export function createDirtRoadTile(length, width) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'dirt_road_tile';
  g.userData.volumetric = true;

  const dirtTop = mat(0xd8c49a, t.road);
  const dirtSide = mat(0xa89068); // darker sides = volume cue
  const dirtDeep = mat(0x8a7350); // rut floor
  const grassEdge = mat(0x8fbc5c, t.shoulder);

  if (dirtTop.map) {
    const m = dirtTop.map.clone();
    m.wrapS = m.wrapT = THREE.RepeatWrapping;
    m.repeat.set(Math.max(1.5, length / Math.max(width * 0.7, 1)), 1);
    m.needsUpdate = true;
    dirtTop.map = m;
  }
  if (grassEdge.map) {
    const m = grassEdge.map.clone();
    m.wrapS = m.wrapT = THREE.RepeatWrapping;
    m.repeat.set(Math.max(1, length / 3), 1);
    m.needsUpdate = true;
    grassEdge.map = m;
  }

  const L = length;
  const W = width;
  const embankH = 0.12; // lower fill
  const bedH = 0.16; // main pavement thickness
  const topY = embankH + bedH; // ~0.28
  const wallH = topY; // full vertical face height

  // Slight depth bias on coplanar-ish top faces (adjacent tiles / apron)
  dirtTop.polygonOffset = true;
  dirtTop.polygonOffsetFactor = -1;
  dirtTop.polygonOffsetUnits = -1;

  // 1) Wide embankment (earth under road) — inset so consecutive tiles don't coplanar-fight
  boxMesh(g, 'embankment', L * 0.99, embankH, W * 1.65, 0, embankH * 0.5, 0, dirtSide, {
    cast: true,
    receive: true,
  });

  // 2) Main raised bed (lighter top) — length already gapped by plantRoadLine
  boxMesh(g, 'bed', L, bedH, W, 0, embankH + bedH * 0.5, 0, dirtTop, {
    cast: true,
    receive: true,
  });

  // 3) Vertical side walls (darker) — the #1 "this is 3D" cue from oblique cam
  const wallT = 0.1;
  for (const side of [-1, 1]) {
    boxMesh(
      g,
      `wall_${side > 0 ? 'r' : 'l'}`,
      L * 0.995,
      wallH,
      wallT,
      0,
      wallH * 0.5,
      side * (W * 0.5 + wallT * 0.35),
      dirtSide,
      { cast: true, receive: true },
    );
  }

  // 4) Dual rut trenches carved into bed (real holes in the top)
  const rutW = W * 0.16;
  const rutD = 0.07; // depth of trench
  const rutY = topY - rutD * 0.5;
  for (const side of [-1, 1]) {
    const z = side * W * 0.28;
    // sunken floor
    boxMesh(g, `rut_floor_${side > 0 ? 'r' : 'l'}`, L * 0.96, rutD, rutW, 0, rutY, z, dirtDeep, {
      cast: false,
      receive: true,
    });
    // inner/outer vertical faces of the groove
    const faceT = 0.04;
    for (const inner of [-1, 1]) {
      boxMesh(
        g,
        `rut_face_${side > 0 ? 'r' : 'l'}_${inner > 0 ? 'o' : 'i'}`,
        L * 0.96,
        rutD,
        faceT,
        0,
        rutY,
        z + inner * (rutW * 0.5 + faceT * 0.2),
        dirtSide,
        { cast: true, receive: true },
      );
    }
  }

  // 5) Grass shoulders — lower ramps on both sides
  const shW = W * 0.38;
  for (const side of [-1, 1]) {
    // stepped ramp (two boxes) so it looks 3D not a thin strip
    boxMesh(
      g,
      `shoulder_low_${side > 0 ? 'r' : 'l'}`,
      L * 0.99,
      0.06,
      shW,
      0,
      0.03,
      side * (W * 0.5 + wallT + shW * 0.45),
      grassEdge,
      { cast: false, receive: true },
    );
    boxMesh(
      g,
      `shoulder_mid_${side > 0 ? 'r' : 'l'}`,
      L * 0.99,
      0.09,
      shW * 0.55,
      0,
      embankH * 0.45,
      side * (W * 0.5 + wallT * 0.5 + shW * 0.15),
      grassEdge,
      { cast: true, receive: true },
    );
  }

  return noOutline(g);
}

// ─── Plaza: fat cobbles ────────────────────────────────────────────────────

/** Thick 3D stones with deep joints — reads as masonry, not a decal. */
export function createCobblePlaza(size = 14) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'cobble_plaza';
  g.userData.volumetric = true;

  // Deep dark joint bed (visible between stones)
  const jointMat = mat(0x6a5c4a);
  boxMesh(g, 'joint_bed', size + 0.5, 0.1, size + 0.5, 0, 0.05, 0, jointMat, {
    cast: false,
    receive: true,
  });

  // Packed earth under
  boxMesh(g, 'plaza_earth', size + 0.9, 0.14, size + 0.9, 0, -0.02, 0, mat(0xb0a080, t.road), {
    cast: false,
    receive: true,
  });

  const cols = Math.max(7, Math.round(size / 1.05));
  const rows = Math.max(7, Math.round(size / 1.05));
  const cellW = size / cols;
  const cellH = size / rows;
  const gap = 0.14; // wide joints so dark bed shows
  const maxCount = (cols + 1) * (rows + 1);
  const stoneGeo = new THREE.BoxGeometry(1, 1, 1);
  const stoneMat = mat(0xe6d8c0, t.cobble);
  const inst = new THREE.InstancedMesh(stoneGeo, stoneMat, maxCount);
  inst.castShadow = true;
  inst.receiveShadow = true;
  inst.name = 'plaza_stones';

  const dummy = new THREE.Object3D();
  const palette = [
    new THREE.Color(0xefe2cc),
    new THREE.Color(0xe0d2b8),
    new THREE.Color(0xf2e6d0),
    new THREE.Color(0xd4c6ac),
    new THREE.Color(0xe8dcc4),
  ];
  let i = 0;
  const half = size * 0.5;
  const baseTop = 0.1;

  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (cellW * 0.42);
    for (let col = 0; col < cols; col++) {
      const cx = -half + cellW * (col + 0.5) + xOff;
      const cz = -half + cellH * (row + 0.5);
      if (cx < -half + 0.12 || cx > half - 0.12) continue;

      const sw = cellW - gap * (0.9 + hash2(col, row) * 0.4);
      const sd = cellH - gap * (0.9 + hash2(col + 2, row + 1) * 0.4);
      // FAT stones — 18–28 cm high
      const sh = 0.18 + hash2(col * 3, row * 2) * 0.12;
      const yaw = (hash2(col + 5, row + 8) - 0.5) * 0.15;
      const jx = (hash2(col, row + 11) - 0.5) * gap * 0.5;
      const jz = (hash2(row, col + 13) - 0.5) * gap * 0.5;

      dummy.position.set(cx + jx, baseTop + sh * 0.5, cz + jz);
      dummy.rotation.set(
        (hash2(col, 3) - 0.5) * 0.04,
        yaw,
        (hash2(row, 5) - 0.5) * 0.04,
      );
      dummy.scale.set(Math.max(0.25, sw), sh, Math.max(0.25, sd));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      inst.setColorAt(i, palette[Math.floor(hash2(col, row + 17) * palette.length)]);
      i++;
    }
  }
  inst.count = i;
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);

  // Chunky curb wall (~35 cm)
  const curbMat = mat(0xc2b49c);
  const curbH = 0.34;
  const curbT = 0.42;
  const curbY = curbH * 0.5;
  const outs = [
    [size + 0.55, curbT, 0, half + curbT * 0.4],
    [size + 0.55, curbT, 0, -half - curbT * 0.4],
    [curbT, size + 0.55, half + curbT * 0.4, 0],
    [curbT, size + 0.55, -half - curbT * 0.4, 0],
  ];
  for (const [w, d, x, z] of outs) {
    boxMesh(g, 'curb', w, curbH, d, x, curbY, z, curbMat, { cast: true, receive: true });
  }

  return noOutline(g);
}

export function createRoadTile(length, width) {
  return createDirtRoadTile(length, width);
}

export function createPlazaPad(size = 14) {
  return createCobblePlaza(size);
}

// ─── Apron: chunky dirt mound ──────────────────────────────────────────────

/** Dirt mound under landmarks — clear dome, not a sticker. */
export function createBuildingDirtApron(radius = 8) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'dirt_apron';
  g.userData.volumetric = true;

  const dirt = mat(0xc4a878, t.road);
  const dirtDark = mat(0xa88860);

  // Main dome via lathe — height up to ~22 cm
  const pts = [];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const r = radius * u;
    const h = 0.22 * Math.pow(1 - u, 1.35);
    pts.push(new THREE.Vector2(Math.max(0.001, r), h));
  }
  pts.push(new THREE.Vector2(radius * 1.04, 0));
  const dome = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), dirt);
  dome.name = 'apron_dome';
  dome.position.y = 0.01;
  dome.castShadow = true;
  dome.receiveShadow = true;
  g.add(dome);

  // Ring lip — hard shadow catcher
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.92, 0.06, 8, 40),
    dirtDark,
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.04;
  lip.castShadow = true;
  lip.receiveShadow = true;
  lip.name = 'apron_lip';
  g.add(lip);

  return noOutline(g);
}

export function scatterGroundMicroDetail() {
  return null;
}
