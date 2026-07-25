/**
 * Village ground — **volumetric Three.js geometry**, not paper planes.
 *
 * Layers:
 *   grass   — subdivided meadow with gentle height field
 *   road    — extruded profile: shoulders + raised bed + dual ruts (real dips)
 *   plaza   — instanced stone blocks with thickness + rim stones
 *   apron   — low dirt mound under landmarks (not a flat disc)
 *
 * Textures only tint; form comes from mesh volume.
 * Local road: +X along length, +Z across width. Tops sit near y≈0.
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

function groundMat(color, map, opts = {}) {
  const mat = makeToon(color, opts);
  if (map) mat.map = map;
  return mat;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ─── Meadow: real 3D height field ──────────────────────────────────────────

/**
 * Soft rolling meadow — subdivided plane with vertex displacement.
 * Amplitude kept small so flat-walk (y=0) still reads correct.
 */
export function createMeadowGround(size = 200) {
  const t = textures();
  const segs = 96;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const half = size * 0.5;
  // Playable pad stays flatter; outer meadow rolls more (volume without tripping walk)
  const playR = 40;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const edge = THREE.MathUtils.smoothstep(playR * 0.55, playR * 1.35, r);
    // Multi-scale gentle hills (metres)
    const n1 = Math.sin(x * 0.045 + 1.2) * Math.cos(z * 0.038);
    const n2 = Math.sin(x * 0.11 + z * 0.09) * 0.35;
    const n3 = Math.sin(x * 0.22 - z * 0.17 + 2.1) * 0.18;
    const h = (n1 * 0.55 + n2 * 0.4 + n3 * 0.35) * (0.12 + edge * 0.55);
    // Micro undulation everywhere so it never reads as a sheet of paper
    const micro = (hash2(Math.floor(x * 2), Math.floor(z * 2)) - 0.5) * 0.04;
    pos.setY(i, h + micro);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  // UV scale for grass map
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * 14, uv.getY(i) * 14);
  }
  uv.needsUpdate = true;

  const mat = groundMat(0x8ed86a, t.grass);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'meadow_ground';
  mesh.userData.volumetric = true;
  return noOutline(mesh);
}

// ─── Road: extruded volumetric profile ─────────────────────────────────────

/**
 * Build a road cross-section shape in the ZY plane (Z = across, Y = height),
 * extruded along +X (length). Includes dual ruts as real geometry dips.
 */
function createRoadProfileShape(halfW) {
  // halfW = half of road bed width (dirt only, not shoulder)
  const shape = new THREE.Shape();
  const bedH = 0.09; // raised bed top
  const shoulderH = 0.028;
  const shoulderOut = halfW * 0.42; // extra each side
  const rutHalf = halfW * 0.1;
  const rutDepth = 0.028;
  const rutC0 = -halfW * 0.32;
  const rutC1 = halfW * 0.32;

  // Left shoulder outer → left road edge → ruts → right edge → right shoulder
  // Walk outer left (lowest)
  shape.moveTo(-halfW - shoulderOut, 0);
  shape.lineTo(-halfW - shoulderOut * 0.35, shoulderH * 0.55);
  shape.lineTo(-halfW, bedH * 0.85);

  // left bed to first rut
  shape.lineTo(rutC0 - rutHalf * 1.2, bedH);
  // rut 0 dip
  shape.lineTo(rutC0 - rutHalf * 0.35, bedH - rutDepth);
  shape.lineTo(rutC0 + rutHalf * 0.35, bedH - rutDepth);
  shape.lineTo(rutC0 + rutHalf * 1.2, bedH);

  // crown
  shape.lineTo(0, bedH + 0.006);

  // rut 1
  shape.lineTo(rutC1 - rutHalf * 1.2, bedH);
  shape.lineTo(rutC1 - rutHalf * 0.35, bedH - rutDepth);
  shape.lineTo(rutC1 + rutHalf * 0.35, bedH - rutDepth);
  shape.lineTo(rutC1 + rutHalf * 1.2, bedH);

  // right edge + shoulder
  shape.lineTo(halfW, bedH * 0.85);
  shape.lineTo(halfW + shoulderOut * 0.35, shoulderH * 0.55);
  shape.lineTo(halfW + shoulderOut, 0);

  // close along ground
  shape.lineTo(-halfW - shoulderOut, 0);
  return shape;
}

/**
 * Dirt road segment — solid extruded volume with dual ruts + soft shoulders.
 * Local +X along length, +Z across width. Sole near y=0.
 */
export function createDirtRoadTile(length, width) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'dirt_road_tile';
  g.userData.volumetric = true;

  const halfW = width * 0.5;
  const shape = createRoadProfileShape(halfW);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 1,
  });
  // Extrude goes +Z by default from XY shape — we built shape in XZ... wait
  // Shape is in XY: X=across (our Z), Y=height. Extrude along Z = length.
  // We need: local X = length, Z = across, Y = height.
  // So: after extrude, map: (sx, sy, sz) → (sz - length/2, sy, sx)
  geo.translate(0, 0, -length / 2);
  geo.rotateY(-Math.PI / 2); // Z length → X length; X across → -Z... need fix

  // After rotateY(-90): old X→-Z, old Z→X, Y→Y
  // shape X (across) becomes -Z (across), extrude Z (length) becomes X (length). Good if we flip Z.
  // Actually rotateY(-π/2): (x,y,z) → (z, y, -x). So across x→-z, length z→x. Perfect.

  geo.computeVertexNormals();

  // UVs roughly along length/across for dirt tint
  const roadMat = groundMat(0xdcc4a0, t.road);
  if (roadMat.map) {
    const map = roadMat.map.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(Math.max(1, length / Math.max(width, 1)), 1);
    map.needsUpdate = true;
    roadMat.map = map;
  }

  const road = new THREE.Mesh(geo, roadMat);
  road.receiveShadow = true;
  road.castShadow = true;
  road.name = 'dirt_road_volume';
  g.add(road);

  // Soft grass shoulder slabs sitting under/beside volume edges (extra read)
  const shoulderMat = groundMat(0xb8d888, t.shoulder);
  if (shoulderMat.map) {
    const sm = shoulderMat.map.clone();
    sm.wrapS = sm.wrapT = THREE.RepeatWrapping;
    sm.repeat.set(Math.max(1, length / 4), 1);
    sm.needsUpdate = true;
    shoulderMat.map = sm;
  }
  const shW = width * 0.22;
  for (const side of [-1, 1]) {
    const sh = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.99, 0.035, shW),
      shoulderMat,
    );
    sh.position.set(0, 0.012, side * (halfW + shW * 0.55));
    sh.receiveShadow = true;
    sh.castShadow = false;
    sh.name = `shoulder_${side > 0 ? 'r' : 'l'}`;
    g.add(sh);
  }

  return noOutline(g);
}

// ─── Plaza: real stone blocks ──────────────────────────────────────────────

/**
 * Cobble plaza — each stone is a short 3D block (instanced), not a painted plane.
 */
export function createCobblePlaza(size = 14) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'cobble_plaza';
  g.userData.volumetric = true;

  // Thin packed earth base under stones
  const baseMat = groundMat(0xc8b898, t.road);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(size + 0.6, 0.04, size + 0.6),
    baseMat,
  );
  base.position.y = 0.015;
  base.receiveShadow = true;
  base.castShadow = false;
  base.name = 'plaza_base';
  g.add(base);

  const cols = Math.max(6, Math.round(size / 1.15));
  const rows = Math.max(6, Math.round(size / 1.15));
  const cellW = size / cols;
  const cellH = size / rows;
  const gap = 0.08;
  const stoneH = 0.07;
  const count = cols * rows + cols; // row stagger may add extras — allocate enough
  const stoneGeo = new THREE.BoxGeometry(1, 1, 1);
  const stoneMat = groundMat(0xe4d8c4, t.cobble);
  const inst = new THREE.InstancedMesh(stoneGeo, stoneMat, count + 8);
  inst.castShadow = true;
  inst.receiveShadow = true;
  inst.name = 'plaza_stones';

  const dummy = new THREE.Object3D();
  const colors = [
    new THREE.Color(0xe8dcc8),
    new THREE.Color(0xddd0ba),
    new THREE.Color(0xefe4d0),
    new THREE.Color(0xd5c8b2),
    new THREE.Color(0xe2d6c0),
  ];
  let i = 0;
  const half = size * 0.5;

  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (cellW * 0.45);
    for (let col = 0; col < cols; col++) {
      if (i >= count + 8) break;
      const cx = -half + cellW * (col + 0.5) + xOff;
      const cz = -half + cellH * (row + 0.5);
      // clip stagger overflow
      if (cx < -half + 0.15 || cx > half - 0.15) continue;

      const jx = (hash2(col, row) - 0.5) * gap * 0.8;
      const jz = (hash2(row, col) - 0.5) * gap * 0.6;
      const sw = cellW - gap * (0.85 + hash2(col + 1, row) * 0.35);
      const sd = cellH - gap * (0.85 + hash2(col, row + 2) * 0.35);
      const sh = stoneH * (0.85 + hash2(col * 2, row * 3) * 0.45);
      const yaw = (hash2(col + 9, row + 4) - 0.5) * 0.12;

      dummy.position.set(cx + jx, 0.04 + sh * 0.5, cz + jz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(Math.max(0.2, sw), sh, Math.max(0.2, sd));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      inst.setColorAt(i, colors[Math.floor(hash2(col, row + 7) * colors.length)]);
      i++;
    }
  }
  inst.count = i;
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);

  // Raised rim stones (solid blocks)
  const rimMat = groundMat(0xcfc2ae);
  const rimH = 0.11;
  const rimT = 0.38;
  const rimY = rimH * 0.5;
  const outs = [
    [size + 0.35, rimT, 0, half + rimT * 0.35],
    [size + 0.35, rimT, 0, -half - rimT * 0.35],
    [rimT, size + 0.35, half + rimT * 0.35, 0],
    [rimT, size + 0.35, -half - rimT * 0.35, 0],
  ];
  for (const [w, d, x, z] of outs) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, rimH, d), rimMat);
    rim.position.set(x, rimY, z);
    rim.receiveShadow = true;
    rim.castShadow = true;
    g.add(rim);
  }

  return noOutline(g);
}

export function createRoadTile(length, width) {
  return createDirtRoadTile(length, width);
}

export function createPlazaPad(size = 14) {
  return createCobblePlaza(size);
}

// ─── Apron: low dirt mound ─────────────────────────────────────────────────

/**
 * Dirt under landmarks — low 3D mound (lathe / torus-ish), not a flat alpha disc.
 */
export function createBuildingDirtApron(radius = 8) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'dirt_apron';
  g.userData.volumetric = true;

  // Profile: raised centre → soft fall to ground (lathe around Y)
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = i / n; // 0 centre → 1 rim
    const r = radius * u;
    // smooth dome-ish falloff
    const h = 0.07 * Math.pow(1 - u, 1.65);
    pts.push(new THREE.Vector2(r, h));
  }
  // tuck under ground at outer edge
  pts.push(new THREE.Vector2(radius * 1.02, 0));

  const geo = new THREE.LatheGeometry(pts, 28);
  geo.computeVertexNormals();

  const mat = groundMat(0xc8b090, t.apron || t.road);
  if (mat.map) {
    mat.map = mat.map.clone();
    mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
    mat.map.repeat.set(2, 2);
    mat.map.needsUpdate = true;
  }
  // slight transparency near rim via opacity is optional; volume already fades height
  mat.transparent = false;

  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.002;
  m.receiveShadow = true;
  m.castShadow = false;
  m.name = 'dirt_apron_mound';
  g.add(m);

  return noOutline(g);
}

/**
 * @deprecated cheap micro tufts — kept as no-op.
 */
export function scatterGroundMicroDetail() {
  return null;
}
