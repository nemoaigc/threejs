import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Carriage rest stop / OPEN pavilion — img2threejs v2
 *
 * Quality bar: inn-v3 roof tile craft + guild-v2 timber structure.
 * v1 failed user quality — read as closed box / fake openings.
 *
 * Identity (must hold from every angle):
 * - OPEN timber posts + beams + braces (see-through — no wall shell / no gable infill)
 * - Closed solid gable prism roof (ridge along depth / Z) + dense terracotta tile rows
 * - Plank deck, dual hitching rails + rope wraps, outer hitch post
 * - Green water trough + leaves, barrel, hanging REST STOP sign, warm iron lantern
 * - Facade +Z, sole y=0
 */

const DIMS = Object.freeze({
  width: 5.5,
  depth: 4.4,
  platformH: 0.2,
  postH: 3.2,
  postSize: 0.34,
  railY: 1.08,
  railYLower: 0.68,
  eaveY: 3.28,
  roofWidth: 6.7,
  roofDepth: 5.25,
  roofRise: 1.78,
  frontZ: 2.2,
});

const PALETTE = Object.freeze({
  timberDark: 0x4a2c18,
  timber: 0x7a4a28,
  timberLight: 0xa86636,
  timberWarm: 0xb87842,
  timberMid: 0x8f5a30,
  plank: 0x8b5a32,
  plankLight: 0xa67042,
  plankDark: 0x6a3e20,
  roofDark: 0xb03a22,
  roof: 0xd14a2e,
  roofLight: 0xe85c3c,
  roofDeep: 0x8f2e1c,
  iron: 0x2a2826,
  ironLight: 0x45413c,
  rope: 0xc4a06a,
  ropeDark: 0x9a7a4a,
  troughGreen: 0x2f6b3a,
  troughGreenDark: 0x24522c,
  troughGreenLight: 0x3d8a4a,
  troughWood: 0x5c3a20,
  water: 0x5a9ec4,
  waterDeep: 0x3d7a9e,
  barrel: 0x8a5a32,
  barrelDark: 0x6a4020,
  barrelBand: 0x3a3834,
  signBoard: 0xd8c49a,
  signBoardDark: 0xb8a078,
  signInk: 0x2a2018,
  lanternGlow: 0xffb848,
  lanternGlass: 0xffc878,
  leaf: 0xc9a23a,
  leafDark: 0x8a7028,
});

const roundedGeometryCache = new Map();

function standard(color, roughness, metalness = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    ...extra,
  });
}

function createMaterials() {
  return {
    timberDark: standard(PALETTE.timberDark, 0.78),
    timber: standard(PALETTE.timber, 0.72),
    timberLight: standard(PALETTE.timberLight, 0.66),
    timberWarm: standard(PALETTE.timberWarm, 0.64),
    timberMid: standard(PALETTE.timberMid, 0.7),
    plank: standard(PALETTE.plank, 0.82),
    plankLight: standard(PALETTE.plankLight, 0.78),
    plankDark: standard(PALETTE.plankDark, 0.86),
    roofDark: standard(PALETTE.roofDark, 0.78),
    roof: standard(PALETTE.roof, 0.72),
    roofLight: standard(PALETTE.roofLight, 0.66),
    roofDeep: standard(PALETTE.roofDeep, 0.82),
    iron: standard(PALETTE.iron, 0.38, 0.7),
    ironLight: standard(PALETTE.ironLight, 0.32, 0.62),
    rope: standard(PALETTE.rope, 0.9),
    ropeDark: standard(PALETTE.ropeDark, 0.92),
    troughGreen: standard(PALETTE.troughGreen, 0.7),
    troughGreenDark: standard(PALETTE.troughGreenDark, 0.76),
    troughGreenLight: standard(PALETTE.troughGreenLight, 0.64),
    troughWood: standard(PALETTE.troughWood, 0.8),
    water: standard(PALETTE.water, 0.18, 0.05, {
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 0.6,
    }),
    waterDeep: standard(PALETTE.waterDeep, 0.22, 0.05, {
      transparent: true,
      opacity: 0.88,
    }),
    barrel: standard(PALETTE.barrel, 0.76),
    barrelDark: standard(PALETTE.barrelDark, 0.82),
    barrelBand: standard(PALETTE.barrelBand, 0.4, 0.55),
    signBoard: standard(PALETTE.signBoard, 0.86),
    signBoardDark: standard(PALETTE.signBoardDark, 0.88),
    signInk: standard(PALETTE.signInk, 0.9),
    lanternGlow: standard(PALETTE.lanternGlow, 0.28, 0, {
      emissive: PALETTE.lanternGlow,
      emissiveIntensity: 1.15,
    }),
    lanternGlass: standard(PALETTE.lanternGlass, 0.22, 0, {
      emissive: 0xffa040,
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.92,
    }),
    leaf: standard(PALETTE.leaf, 0.72),
    leafDark: standard(PALETTE.leafDark, 0.78),
  };
}

function roundedGeometry(size, radius = 0.04, segments = 2) {
  const safeRadius = Math.min(radius, ...size.map((value) => value * 0.24));
  const key = [...size, safeRadius, segments]
    .map((value) => Number(value).toFixed(4))
    .join(':');
  if (!roundedGeometryCache.has(key)) {
    roundedGeometryCache.set(
      key,
      new RoundedBoxGeometry(size[0], size[1], size[2], segments, safeRadius),
    );
  }
  return roundedGeometryCache.get(key);
}

function createMesh(geometry, material, name) {
  const result = new THREE.Mesh(geometry, material);
  result.name = name;
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function addBlock(
  parent,
  name,
  size,
  position,
  material,
  rotation = [0, 0, 0],
  radius = 0.035,
  segments = 2,
) {
  const result = createMesh(roundedGeometry(size, radius, segments), material, name);
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function addCylinder(
  parent,
  name,
  radiusTop,
  radiusBottom,
  height,
  position,
  material,
  radialSegments = 12,
  rotation = [0, 0, 0],
) {
  const result = createMesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function addSphere(parent, name, radius, position, material, segments = 10, scale = [1, 1, 1]) {
  const result = createMesh(
    new THREE.SphereGeometry(radius, segments, Math.max(6, Math.floor(segments * 0.66))),
    material,
    name,
  );
  result.position.set(...position);
  result.scale.set(...scale);
  parent.add(result);
  return result;
}

function addTorus(
  parent,
  name,
  radius,
  tube,
  position,
  material,
  rotation = [0, 0, 0],
  tubularSegments = 14,
  arc = Math.PI * 2,
) {
  const result = createMesh(
    new THREE.TorusGeometry(radius, tube, 6, tubularSegments, arc),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

/** Straight beam in XY plane at fixed Z (guild/inn craft). */
function addBeamXY(parent, name, start, end, thickness, depth, material, z, radius = 0.025) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  return addBlock(
    parent,
    name,
    [Math.hypot(dx, dy), thickness, depth],
    [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, z],
    material,
    [0, 0, Math.atan2(dy, dx)],
    radius,
  );
}

/** Straight beam in YZ plane at fixed X. */
function addBeamYZ(parent, name, start, end, thickness, depth, material, x, radius = 0.025) {
  const dz = end[0] - start[0];
  const dy = end[1] - start[1];
  return addBlock(
    parent,
    name,
    [depth, thickness, Math.hypot(dz, dy)],
    [x, (start[1] + end[1]) / 2, (start[0] + end[0]) / 2],
    material,
    [Math.atan2(dy, dz), 0, 0],
    radius,
  );
}

/** Curved timber brace (guild-style knee / chevron). */
function addTube(parent, name, points, radius, material, tubularSegments = 14) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    'centripetal',
  );
  const result = createMesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, 7, false),
    material,
    name,
  );
  parent.add(result);
  return result;
}

function addCurvedBrace(parent, name, start, control, end, material, radius = 0.055) {
  return addTube(
    parent,
    name,
    [
      [start[0], start[1], start[2]],
      [control[0], control[1], control[2]],
      [end[0], end[1], end[2]],
    ],
    radius,
    material,
    16,
  );
}

function createNode(parent, nodes, id) {
  const group = new THREE.Group();
  group.name = `node.${id}`;
  group.userData.sculptComponentId = id;
  parent.add(group);
  nodes[id] = group;
  return group;
}

/**
 * Closed solid gable prism — ridge along DEPTH (Z).
 * Gable triangles face front (+Z) / rear (-Z). Not dual rotated box slabs.
 */
function createSolidGableGeometry(width, depth, rise) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const vertices = [
    -halfWidth, 0, -halfDepth,
    halfWidth, 0, -halfDepth,
    halfWidth, 0, halfDepth,
    -halfWidth, 0, halfDepth,
    0, rise, -halfDepth,
    0, rise, halfDepth,
  ];
  const indices = [
    0, 4, 5, 0, 5, 3,
    1, 2, 5, 1, 5, 4,
    0, 1, 4,
    3, 5, 2,
    0, 3, 2, 0, 2, 1,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.closedSolid = true;
  geometry.userData.construction = 'single-indexed-triangular-prism-ridge-along-depth';
  return geometry;
}

function createSignTexture() {
  // Headless-safe: Node smoke / SSR has no DOM canvas.
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return null;
  }
  const canvas = document.createElement('canvas');
  if (!canvas || typeof canvas.getContext !== 'function') {
    return null;
  }
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d8c49a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(120, 90, 50, 0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const y = 18 + i * 22 + (i % 2) * 4;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.bezierCurveTo(140, y + 4, 360, y - 3, 500, y + 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#6a4a28';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.strokeStyle = '#a08050';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
  ctx.fillStyle = '#2a2018';
  ctx.font = 'bold 92px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('REST STOP', canvas.width / 2, canvas.height / 2 + 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function addRopeWrap(parent, name, x, y, z, radius = 0.2, material) {
  addTorus(parent, `${name}.a`, radius, 0.028, [x, y - 0.04, z], material, [Math.PI / 2, 0, 0], 12);
  addTorus(parent, `${name}.b`, radius * 0.92, 0.024, [x, y + 0.04, z], material, [Math.PI / 2, 0.22, 0], 12);
  addTorus(parent, `${name}.c`, radius * 0.86, 0.02, [x, y + 0.1, z], material, [Math.PI / 2, -0.15, 0], 10);
}

// ─── platform (open deck only — never a wall mass) ───────────────────────────

function addPlatform(root, materials, nodes) {
  const group = createNode(root, nodes, 'platform');
  const W = DIMS.width;
  const D = DIMS.depth;
  const H = DIMS.platformH;

  // low sill mass under deck (ground contact) — sole strictly >= 0
  addBlock(
    group,
    'platform.sill-mass',
    [W + 0.18, H * 0.85, D + 0.14],
    [0, (H * 0.85) / 2 + 0.01, 0],
    materials.plankDark,
    [0, 0, 0],
    0.03,
  );

  // individual floor planks (readable deck grain)
  const plankCount = 13;
  const plankDepth = (D - 0.1) / plankCount;
  const plankMats = [materials.plank, materials.plankLight, materials.plankDark, materials.timberMid];
  for (let i = 0; i < plankCount; i += 1) {
    const z = -D / 2 + 0.05 + plankDepth * (i + 0.5);
    const wiggle = ((i % 3) - 1) * 0.012;
    addBlock(
      group,
      `platform.plank.${i}`,
      [W - 0.12 + wiggle, 0.065, plankDepth * 0.88],
      [wiggle * 2, H + 0.02, z],
      plankMats[i % 4],
      [0, 0, 0],
      0.018,
    );
  }

  // edge boards
  addBlock(group, 'platform.edge.front', [W + 0.1, 0.12, 0.1], [0, H + 0.04, D / 2 + 0.02], materials.timber, [0, 0, 0], 0.025);
  addBlock(group, 'platform.edge.back', [W + 0.1, 0.12, 0.1], [0, H + 0.04, -D / 2 - 0.02], materials.timber, [0, 0, 0], 0.025);
  addBlock(group, 'platform.edge.left', [0.1, 0.12, D + 0.1], [-W / 2 - 0.02, H + 0.04, 0], materials.timberDark, [0, 0, 0], 0.025);
  addBlock(group, 'platform.edge.right', [0.1, 0.12, D + 0.1], [W / 2 + 0.02, H + 0.04, 0], materials.timberDark, [0, 0, 0], 0.025);

  // corner sill pads under posts
  for (const [sx, sz, name] of [
    [-1, -1, 'sw'],
    [1, -1, 'se'],
    [-1, 1, 'nw'],
    [1, 1, 'ne'],
  ]) {
    addBlock(
      group,
      `platform.sill.${name}`,
      [0.62, 0.14, 0.62],
      [(W / 2 - 0.14) * sx, 0.07, (D / 2 - 0.14) * sz],
      materials.timberDark,
      [0, 0, 0],
      0.04,
    );
  }
}

// ─── open timber frame (identity: posts only — no wall panels) ───────────────

function addPostsAndFrame(root, materials, nodes) {
  const group = createNode(root, nodes, 'timber-frame');
  group.userData.openStructure = true;
  group.userData.noWallShell = true;

  const W = DIMS.width;
  const D = DIMS.depth;
  const postH = DIMS.postH;
  const ps = DIMS.postSize;
  const baseY = DIMS.platformH;
  const topY = baseY + postH;
  const halfW = W / 2 - 0.14;
  const halfD = D / 2 - 0.14;

  const corners = [
    { name: 'sw', x: -halfW, z: -halfD },
    { name: 'se', x: halfW, z: -halfD },
    { name: 'nw', x: -halfW, z: halfD },
    { name: 'ne', x: halfW, z: halfD },
  ];

  for (const c of corners) {
    // multi-part post (guild craft): foot / shaft / collar / capital
    addBlock(
      group,
      `frame.post-foot.${c.name}`,
      [ps + 0.22, 0.24, ps + 0.22],
      [c.x, baseY + 0.12, c.z],
      materials.timberDark,
      [0, 0, 0],
      0.045,
    );
    addBlock(
      group,
      `frame.post.${c.name}`,
      [ps, postH - 0.28, ps],
      [c.x, baseY + 0.14 + (postH - 0.28) / 2, c.z],
      materials.timber,
      [0, 0, 0],
      0.045,
    );
    // vertical grain bevel strips (readable timber)
    addBlock(
      group,
      `frame.post-bevel.${c.name}`,
      [ps + 0.04, postH * 0.55, 0.04],
      [c.x, baseY + postH * 0.45, c.z + ps * 0.48],
      materials.timberMid,
      [0, 0, 0],
      0.015,
    );
    addBlock(
      group,
      `frame.post-collar.${c.name}`,
      [ps + 0.14, 0.12, ps + 0.14],
      [c.x, topY - 0.28, c.z],
      materials.timberLight,
      [0, 0, 0],
      0.03,
    );
    addBlock(
      group,
      `frame.post-cap.${c.name}`,
      [ps + 0.18, 0.14, ps + 0.18],
      [c.x, topY - 0.08, c.z],
      materials.timberDark,
      [0, 0, 0],
      0.035,
    );
  }

  // top ring beams (open frame — no cladding)
  addBlock(group, 'frame.beam.front', [W - 0.05, 0.26, 0.26], [0, topY, halfD], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(group, 'frame.beam.back', [W - 0.05, 0.26, 0.26], [0, topY, -halfD], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(group, 'frame.beam.left', [0.26, 0.26, D - 0.05], [-halfW, topY, 0], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(group, 'frame.beam.right', [0.26, 0.26, D - 0.05], [halfW, topY, 0], materials.timberDark, [0, 0, 0], 0.04);

  // secondary tie beams under gable (still open)
  addBlock(group, 'frame.tie.front', [W - 0.4, 0.16, 0.16], [0, topY - 0.58, halfD - 0.02], materials.timber, [0, 0, 0], 0.03);
  addBlock(group, 'frame.tie.back', [W - 0.4, 0.16, 0.16], [0, topY - 0.58, -halfD + 0.02], materials.timber, [0, 0, 0], 0.03);

  // mid-span purlin across depth (under ridge support)
  addBlock(
    group,
    'frame.purlin.mid',
    [0.18, 0.16, D - 0.35],
    [0, topY - 0.12, 0],
    materials.timberMid,
    [0, 0, 0],
    0.03,
  );

  // curved knee braces at every corner (upper) — guild craft, OPEN silhouette
  const braceY0 = topY - 0.95;
  const braceY1 = topY - 0.08;
  const kneeSpecs = [
    // front-left
    {
      name: 'fl-x',
      start: [-halfW + 0.05, braceY0, halfD],
      control: [-halfW + 0.55, braceY0 + 0.15, halfD],
      end: [-halfW + 0.95, braceY1, halfD],
    },
    {
      name: 'fl-z',
      start: [-halfW, braceY0, halfD - 0.05],
      control: [-halfW, braceY0 + 0.15, halfD - 0.55],
      end: [-halfW, braceY1, halfD - 0.95],
    },
    // front-right
    {
      name: 'fr-x',
      start: [halfW - 0.05, braceY0, halfD],
      control: [halfW - 0.55, braceY0 + 0.15, halfD],
      end: [halfW - 0.95, braceY1, halfD],
    },
    {
      name: 'fr-z',
      start: [halfW, braceY0, halfD - 0.05],
      control: [halfW, braceY0 + 0.15, halfD - 0.55],
      end: [halfW, braceY1, halfD - 0.95],
    },
    // back-left
    {
      name: 'bl-x',
      start: [-halfW + 0.05, braceY0, -halfD],
      control: [-halfW + 0.55, braceY0 + 0.15, -halfD],
      end: [-halfW + 0.95, braceY1, -halfD],
    },
    {
      name: 'bl-z',
      start: [-halfW, braceY0, -halfD + 0.05],
      control: [-halfW, braceY0 + 0.15, -halfD + 0.55],
      end: [-halfW, braceY1, -halfD + 0.95],
    },
    // back-right
    {
      name: 'br-x',
      start: [halfW - 0.05, braceY0, -halfD],
      control: [halfW - 0.55, braceY0 + 0.15, -halfD],
      end: [halfW - 0.95, braceY1, -halfD],
    },
    {
      name: 'br-z',
      start: [halfW, braceY0, -halfD + 0.05],
      control: [halfW, braceY0 + 0.15, -halfD + 0.55],
      end: [halfW, braceY1, -halfD + 0.95],
    },
  ];
  for (const b of kneeSpecs) {
    addCurvedBrace(group, `frame.knee.${b.name}`, b.start, b.control, b.end, materials.timberLight, 0.052);
  }

  // straight secondary braces (readable chevrons at ties)
  const chevronLen = 0.85;
  const chevronY = topY - 0.58;
  const chevrons = [
    { name: 'fl', pos: [-halfW + chevronLen * 0.42, chevronY, halfD], size: [chevronLen, 0.11, 0.11], rot: [0, 0, -0.52] },
    { name: 'fr', pos: [halfW - chevronLen * 0.42, chevronY, halfD], size: [chevronLen, 0.11, 0.11], rot: [0, 0, 0.52] },
    { name: 'bl', pos: [-halfW + chevronLen * 0.42, chevronY, -halfD], size: [chevronLen, 0.11, 0.11], rot: [0, 0, -0.52] },
    { name: 'br', pos: [halfW - chevronLen * 0.42, chevronY, -halfD], size: [chevronLen, 0.11, 0.11], rot: [0, 0, 0.52] },
  ];
  for (const b of chevrons) {
    addBlock(group, `frame.chevron.${b.name}`, b.size, b.pos, materials.timberMid, b.rot, 0.022);
  }

  // gable king posts + rafters + collar (OPEN — no gable infill panel)
  const rise = DIMS.roofRise;
  const ridgeY = DIMS.eaveY + rise;
  for (const side of [-1, 1]) {
    const z = side * halfD;
    const tag = side > 0 ? 'front' : 'back';

    // vertical king post under ridge
    addBlock(
      group,
      `frame.king.${tag}`,
      [0.17, rise * 0.9, 0.17],
      [0, DIMS.eaveY + rise * 0.45, z],
      materials.timber,
      [0, 0, 0],
      0.03,
    );

    // rafters on gable face
    const rafterLen = Math.hypot(DIMS.roofWidth * 0.48, rise);
    const angle = Math.atan2(rise, DIMS.roofWidth * 0.48);
    addBlock(
      group,
      `frame.rafter.L.${tag}`,
      [rafterLen, 0.15, 0.15],
      [-DIMS.roofWidth * 0.22, DIMS.eaveY + rise * 0.48, z + side * 0.03],
      materials.timberDark,
      [0, 0, angle],
      0.03,
    );
    addBlock(
      group,
      `frame.rafter.R.${tag}`,
      [rafterLen, 0.15, 0.15],
      [DIMS.roofWidth * 0.22, DIMS.eaveY + rise * 0.48, z + side * 0.03],
      materials.timberDark,
      [0, 0, -angle],
      0.03,
    );

    // collar / gable cross
    addBlock(
      group,
      `frame.collar.${tag}`,
      [DIMS.roofWidth * 0.58, 0.13, 0.13],
      [0, DIMS.eaveY + rise * 0.36, z + side * 0.05],
      materials.timberLight,
      [0, 0, 0],
      0.025,
    );

    // small curved braces under collar
    addCurvedBrace(
      group,
      `frame.gable-knee.L.${tag}`,
      [-DIMS.roofWidth * 0.22, DIMS.eaveY + 0.1, z],
      [-DIMS.roofWidth * 0.1, DIMS.eaveY + rise * 0.22, z + side * 0.02],
      [-0.08, DIMS.eaveY + rise * 0.34, z + side * 0.04],
      materials.timberMid,
      0.045,
    );
    addCurvedBrace(
      group,
      `frame.gable-knee.R.${tag}`,
      [DIMS.roofWidth * 0.22, DIMS.eaveY + 0.1, z],
      [DIMS.roofWidth * 0.1, DIMS.eaveY + rise * 0.22, z + side * 0.02],
      [0.08, DIMS.eaveY + rise * 0.34, z + side * 0.04],
      materials.timberMid,
      0.045,
    );
  }

  // ridge beam running depth
  addBlock(
    group,
    'frame.ridge-beam',
    [0.24, 0.22, DIMS.roofDepth * 0.94],
    [0, ridgeY + 0.02, 0],
    materials.timberWarm,
    [0, 0, 0],
    0.04,
  );

  // chunky decorative ridge end caps (ref identity)
  for (const side of [-1, 1]) {
    const tag = side > 0 ? 'front' : 'back';
    addBlock(
      group,
      `frame.ridge-end.${tag}`,
      [0.42, 0.48, 0.62],
      [0, ridgeY + 0.2, side * (DIMS.roofDepth / 2 - 0.06)],
      materials.timberWarm,
      [0, 0, 0],
      0.065,
      3,
    );
    addBlock(
      group,
      `frame.ridge-nub.${tag}`,
      [0.24, 0.24, 0.3],
      [0, ridgeY + 0.52, side * (DIMS.roofDepth / 2 - 0.04)],
      materials.timberLight,
      [0, 0, 0],
      0.04,
    );
    // small iron pin
    addCylinder(
      group,
      `frame.ridge-pin.${tag}`,
      0.03,
      0.03,
      0.18,
      [0, ridgeY + 0.68, side * (DIMS.roofDepth / 2 - 0.04)],
      materials.iron,
      6,
    );
  }

  // under-roof purlins (readable open truss from below)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const t = (i + 1) / 4;
      const x = side * (DIMS.roofWidth * 0.5 * t);
      const y = DIMS.eaveY + DIMS.roofRise * (1 - t) - 0.08;
      addBlock(
        group,
        `frame.purlin.${side < 0 ? 'L' : 'R'}.${i}`,
        [0.12, 0.1, DIMS.roofDepth * 0.88],
        [x, y, 0],
        materials.timberDark,
        [0, 0, 0],
        0.02,
      );
    }
  }

  // outer hitch post (left-front, freestanding) — ref identity
  const hitchX = -halfW - 0.42;
  const hitchZ = halfD + 0.22;
  addBlock(group, 'frame.hitch-post', [0.18, 1.22, 0.18], [hitchX, 0.61, hitchZ], materials.timber, [0, 0, 0], 0.03);
  addBlock(group, 'frame.hitch-post-cap', [0.26, 0.12, 0.26], [hitchX, 1.24, hitchZ], materials.timberDark, [0, 0, 0], 0.025);
  addBlock(group, 'frame.hitch-post-foot', [0.28, 0.1, 0.28], [hitchX, 0.05, hitchZ], materials.timberDark, [0, 0, 0], 0.03);
  addRopeWrap(group, 'frame.hitch-rope', hitchX, 0.98, hitchZ, 0.15, materials.rope);
}

// ─── hitching rails (open mid-height rails only) ─────────────────────────────

function addHitchingRails(root, materials, nodes) {
  const group = createNode(root, nodes, 'hitching-rails');
  const W = DIMS.width;
  const D = DIMS.depth;
  const halfW = W / 2 - 0.14;
  const halfD = D / 2 - 0.14;
  const y = DIMS.railY;
  const yL = DIMS.railYLower;
  const railT = 0.145;

  // dual rails all four sides — open above / below (NOT a solid wall)
  addBlock(group, 'rail.front.upper', [W - 0.55, railT, railT], [0, y, halfD - 0.02], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.front.lower', [W - 0.72, railT * 0.92, railT * 0.92], [0, yL, halfD - 0.02], materials.timber, [0, 0, 0], 0.035);
  addBlock(group, 'rail.back.upper', [W - 0.55, railT, railT], [0, y, -halfD + 0.02], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.back.lower', [W - 0.72, railT * 0.92, railT * 0.92], [0, yL, -halfD + 0.02], materials.timber, [0, 0, 0], 0.035);
  addBlock(group, 'rail.left.upper', [railT, railT, D - 0.55], [-halfW + 0.02, y, 0], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.left.lower', [railT * 0.92, railT * 0.92, D - 0.72], [-halfW + 0.02, yL, 0], materials.timber, [0, 0, 0], 0.035);
  addBlock(group, 'rail.right.upper', [railT, railT, D - 0.55], [halfW - 0.02, y, 0], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.right.lower', [railT * 0.92, railT * 0.92, D - 0.72], [halfW - 0.02, yL, 0], materials.timber, [0, 0, 0], 0.035);

  // short mid balusters on long rails (still open — gaps between)
  for (const side of [-1, 1]) {
    for (const t of [-0.28, 0.28]) {
      const x = halfW * t * 2.2 * 0.35;
      addBlock(
        group,
        `rail.baluster.front.${side}.${t}`,
        [0.08, y - yL + 0.08, 0.08],
        [x * side, (y + yL) / 2, halfD - 0.02],
        materials.timberMid,
        [0, 0, 0],
        0.02,
      );
      addBlock(
        group,
        `rail.baluster.back.${side}.${t}`,
        [0.08, y - yL + 0.08, 0.08],
        [x * side, (y + yL) / 2, -halfD + 0.02],
        materials.timberMid,
        [0, 0, 0],
        0.02,
      );
    }
  }

  // rope wraps at rail/post junctions (identity detail)
  const ropePoints = [
    [-halfW, y, halfD - 0.04],
    [halfW, y, halfD - 0.04],
    [-halfW, y, -halfD + 0.04],
    [halfW, y, -halfD + 0.04],
    [-halfW * 0.12, y, halfD - 0.02],
    [halfW * 0.12, y, halfD - 0.02],
    [-halfW * 0.12, y, -halfD + 0.02],
    [halfW * 0.12, y, -halfD + 0.02],
    [-halfW, yL, halfD - 0.04],
    [halfW, yL, halfD - 0.04],
    [-halfW, yL + 0.02, 0],
    [halfW, yL + 0.02, 0],
  ];
  ropePoints.forEach((p, i) => {
    addRopeWrap(
      group,
      `rail.rope.${i}`,
      p[0],
      p[1],
      p[2],
      0.155,
      i % 2 ? materials.ropeDark : materials.rope,
    );
  });
}

// ─── roof: solid prism + inn-v3 density tile rows ─────────────────────────────

function addRoof(root, materials, nodes) {
  const group = createNode(root, nodes, 'roof');
  const eaveY = DIMS.eaveY;

  // single closed gable prism (structure only — NOT a wall shell)
  const solid = createMesh(
    createSolidGableGeometry(DIMS.roofWidth, DIMS.roofDepth, DIMS.roofRise),
    materials.roofDeep,
    'roof.structural-solid-gable-prism',
  );
  solid.position.y = eaveY;
  solid.userData.structuralRoof = true;
  solid.userData.prohibitedConstruction = 'paired-rotated-box-slabs';
  group.add(solid);

  // under-eave fascia boards
  addBlock(
    group,
    'roof.fascia.front',
    [DIMS.roofWidth + 0.08, 0.15, 0.13],
    [0, eaveY + 0.02, DIMS.roofDepth / 2 + 0.03],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia.back',
    [DIMS.roofWidth + 0.08, 0.15, 0.13],
    [0, eaveY + 0.02, -DIMS.roofDepth / 2 - 0.03],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  // side fascias along eaves
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `roof.fascia.side.${side < 0 ? 'L' : 'R'}`,
      [0.12, 0.12, DIMS.roofDepth + 0.05],
      [side * (DIMS.roofWidth / 2 + 0.01), eaveY + 0.04, 0],
      materials.timberDark,
      [0, 0, 0],
      0.02,
    );
  }

  // ── inn-v3 style dense terracotta tile relief ──
  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  // denser than v1 (7×10) → inn-like 9×12
  const rows = 9;
  const columns = 12;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [materials.roof, materials.roofLight, materials.roofDark];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.52);
      const x = side * distanceFromRidge;
      const y = eaveY + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.1;
      const stagger = row % 2 ? tileDepth * 0.42 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.14;
        if (Math.abs(z) > DIMS.roofDepth / 2 + 0.1) continue;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 3];
        // slightly barrel-like curved tile profile
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.18, 0.125, tileDepth * 1.1],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.048,
          3,
        );
      }
    }
  }

  // ridge caps (dense row)
  for (let i = 0; i < 14; i += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 14) * (i + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${i}`,
      [0.4, 0.3, DIMS.roofDepth / 13.2],
      [0, eaveY + DIMS.roofRise + 0.09, z],
      i % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.05,
      3,
    );
  }

  // eave scallop row (front overhang identity)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 11; i += 1) {
      const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 11) * (i + 0.5);
      addBlock(
        tileGroup,
        `roof.eave.${side < 0 ? 'L' : 'R'}.${i}`,
        [0.24, 0.11, tileDepth * 0.92],
        [side * (halfWidth - 0.04), eaveY + 0.13, z],
        tileMats[i % 3],
        [0, 0, side < 0 ? 0.38 : -0.38],
        0.04,
        3,
      );
    }
  }

  // gable edge rake tiles (front/back slope edges)
  for (const face of [-1, 1]) {
    for (const side of [-1, 1]) {
      for (let r = 0; r < 5; r += 1) {
        const t = (r + 0.5) / 5;
        const x = side * halfWidth * t;
        const y = eaveY + DIMS.roofRise * (1 - t) + 0.06;
        addBlock(
          tileGroup,
          `roof.rake.${face > 0 ? 'f' : 'b'}.${side < 0 ? 'L' : 'R'}.${r}`,
          [0.22, 0.1, 0.18],
          [x, y, face * (DIMS.roofDepth / 2 - 0.05)],
          tileMats[r % 3],
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.03,
          2,
        );
      }
    }
  }
}

// ─── REST STOP hanging sign ──────────────────────────────────────────────────

function addSign(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'sign-rig');
  const halfD = DIMS.depth / 2 - 0.14;
  const hangY = DIMS.eaveY - 0.12;
  const z = halfD + 0.1;

  // iron hangers from front beam
  for (const x of [-0.58, 0.58]) {
    addBlock(group, `sign.hook.${x < 0 ? 'L' : 'R'}`, [0.07, 0.2, 0.07], [x, hangY, z], materials.iron, [0, 0, 0], 0.015);
    addCylinder(group, `sign.chain.${x < 0 ? 'L' : 'R'}`, 0.028, 0.028, 0.45, [x, hangY - 0.3, z], materials.ironLight, 8);
    // chain links as torus accents
    addTorus(
      group,
      `sign.link.${x < 0 ? 'L' : 'R'}`,
      0.05,
      0.012,
      [x, hangY - 0.12, z],
      materials.iron,
      [0, 0, Math.PI / 2],
      8,
    );
  }

  const pivot = new THREE.Group();
  pivot.name = 'sign.swing-pivot';
  pivot.position.set(0, hangY - 0.55, z);
  group.add(pivot);
  sockets.signSwing = pivot;

  const board = addBlock(pivot, 'sign.board', [1.62, 0.6, 0.09], [0, 0, 0], materials.signBoard, [0, 0, 0], 0.04);
  addBlock(pivot, 'sign.board-back', [1.7, 0.66, 0.05], [0, 0, -0.045], materials.signBoardDark, [0, 0, 0], 0.035);
  addBlock(pivot, 'sign.frame', [1.76, 0.72, 0.04], [0, 0, -0.065], materials.timberDark, [0, 0, 0], 0.03);

  const texture = createSignTexture();
  if (texture) {
    const faceMat = standard(0xffffff, 0.88, 0, { map: texture });
    const face = createMesh(roundedGeometry([1.52, 0.54, 0.02], 0.02), faceMat, 'sign.face-texture');
    face.position.set(0, 0, 0.055);
    pivot.add(face);
  } else {
    // geometric lettering for headless
    addBlock(pivot, 'sign.ink-bar', [1.25, 0.09, 0.03], [0, 0.08, 0.055], materials.signInk, [0, 0, 0], 0.01);
    addBlock(pivot, 'sign.ink-bar2', [1.1, 0.09, 0.03], [0, -0.1, 0.055], materials.signInk, [0, 0, 0], 0.01);
    // letter stubs
    for (const [lx, lw] of [
      [-0.55, 0.12],
      [-0.35, 0.1],
      [-0.15, 0.1],
      [0.05, 0.12],
      [0.3, 0.1],
      [0.5, 0.12],
    ]) {
      addBlock(pivot, `sign.letter.${lx}`, [lw, 0.22, 0.025], [lx, 0, 0.06], materials.signInk, [0, 0, 0], 0.008);
    }
  }

  // corner nails
  for (const [sx, sy] of [
    [-0.72, 0.24],
    [0.72, 0.24],
    [-0.72, -0.24],
    [0.72, -0.24],
  ]) {
    addCylinder(pivot, `sign.nail.${sx}.${sy}`, 0.032, 0.032, 0.06, [sx, sy, 0.055], materials.iron, 6, [Math.PI / 2, 0, 0]);
  }

  board.userData.hasSignText = true;

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.sign-interaction';
  interaction.position.set(0, hangY - 0.52, z + 0.42);
  group.add(interaction);
  sockets.signInteraction = interaction;
}

// ─── warm iron lantern ───────────────────────────────────────────────────────

function addLantern(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'lantern');
  const halfW = DIMS.width / 2 - 0.14;
  const halfD = DIMS.depth / 2 - 0.14;
  // hang from left-front post area (ref)
  const ax = -halfW + 0.02;
  const az = halfD - 0.12;
  const ay = DIMS.postH + DIMS.platformH - 0.5;

  // iron arm + bracket
  addBlock(group, 'lantern.bracket', [0.14, 0.2, 0.14], [ax, ay, az], materials.ironLight, [0, 0, 0], 0.02);
  addBlock(group, 'lantern.arm', [0.07, 0.07, 0.58], [ax, ay, az + 0.22], materials.iron, [0, 0, 0], 0.018);
  addTorus(group, 'lantern.hook', 0.13, 0.026, [ax, ay - 0.04, az + 0.52], materials.iron, [0, 0, Math.PI * 0.5], 10, Math.PI);
  addCylinder(group, 'lantern.ring', 0.04, 0.04, 0.08, [ax, ay - 0.14, az + 0.52], materials.ironLight, 8);

  const lampPivot = new THREE.Group();
  lampPivot.name = 'lantern.swing-pivot';
  lampPivot.position.set(ax, ay - 0.28, az + 0.52);
  group.add(lampPivot);
  sockets.lanternSwing = lampPivot;

  // cage
  addBlock(lampPivot, 'lantern.top', [0.3, 0.09, 0.3], [0, 0.2, 0], materials.iron, [0, 0, 0], 0.02);
  addBlock(lampPivot, 'lantern.bottom', [0.28, 0.07, 0.28], [0, -0.22, 0], materials.iron, [0, 0, 0], 0.02);
  addBlock(lampPivot, 'lantern.cap', [0.18, 0.12, 0.18], [0, 0.3, 0], materials.ironLight, [0, 0, 0], 0.02);
  addCylinder(lampPivot, 'lantern.finial', 0.03, 0.02, 0.1, [0, 0.4, 0], materials.iron, 6);
  for (const [sx, sz] of [
    [-0.11, -0.11],
    [0.11, -0.11],
    [-0.11, 0.11],
    [0.11, 0.11],
  ]) {
    addBlock(lampPivot, `lantern.post.${sx}.${sz}`, [0.038, 0.4, 0.038], [sx, 0, sz], materials.iron, [0, 0, 0], 0.01);
  }
  // glass / glow
  addBlock(lampPivot, 'lantern.glass', [0.22, 0.3, 0.22], [0, 0, 0], materials.lanternGlass, [0, 0, 0], 0.03);
  addSphere(lampPivot, 'lantern.flame', 0.075, [0, 0.02, 0], materials.lanternGlow, 8, [1, 1.35, 1]);

  const lightSocket = new THREE.Object3D();
  lightSocket.name = 'socket.lantern-light';
  lightSocket.position.set(0, 0, 0);
  lampPivot.add(lightSocket);
  sockets.lanternLight = lightSocket;
}

// ─── green water trough ──────────────────────────────────────────────────────

function addTrough(root, materials, nodes) {
  const group = createNode(root, nodes, 'water-trough');
  // front of platform, slightly right of center (main/front refs)
  const z = DIMS.depth / 2 + 0.78;
  const y = 0.34;
  const x = 0.12;

  // wooden base + legs
  addBlock(group, 'trough.base', [2.45, 0.2, 0.78], [x, 0.1, z], materials.troughWood, [0, 0, 0], 0.04);
  addBlock(group, 'trough.leg.L', [0.14, 0.3, 0.55], [x - 0.95, 0.15, z], materials.troughWood, [0, 0, 0], 0.03);
  addBlock(group, 'trough.leg.R', [0.14, 0.3, 0.55], [x + 0.95, 0.15, z], materials.troughWood, [0, 0, 0], 0.03);
  addBlock(group, 'trough.leg.mid', [0.1, 0.22, 0.5], [x, 0.12, z], materials.troughWood, [0, 0, 0], 0.025);

  // green painted body
  addBlock(group, 'trough.body', [2.28, 0.4, 0.66], [x, y, z], materials.troughGreen, [0, 0, 0], 0.045);
  addBlock(group, 'trough.lip', [2.36, 0.1, 0.74], [x, y + 0.22, z], materials.troughGreenLight, [0, 0, 0], 0.03);
  // panel seams on green body
  for (const px of [-0.7, 0, 0.7]) {
    addBlock(group, `trough.seam.${px}`, [0.04, 0.32, 0.68], [x + px, y, z], materials.troughGreenDark, [0, 0, 0], 0.01);
  }
  // inner hollow dark
  addBlock(group, 'trough.inner', [2.02, 0.24, 0.44], [x, y + 0.06, z], materials.troughGreenDark, [0, 0, 0], 0.03);
  // water surface
  addBlock(group, 'trough.water', [1.95, 0.05, 0.4], [x, y + 0.14, z], materials.water, [0, 0, 0], 0.02);
  addBlock(group, 'trough.water-deep', [1.75, 0.04, 0.3], [x, y + 0.1, z], materials.waterDeep, [0, 0, 0], 0.015);

  // floating leaves
  const leaves = [
    [-0.6, 0.16],
    [-0.15, -0.1],
    [0.35, 0.1],
    [0.7, -0.06],
    [0.05, 0.05],
  ];
  leaves.forEach((p, i) => {
    addBlock(
      group,
      `trough.leaf.${i}`,
      [0.15, 0.02, 0.09],
      [x + p[0], y + 0.18, z + p[1]],
      i % 2 ? materials.leafDark : materials.leaf,
      [0, i * 0.65, 0.12],
      0.01,
    );
  });
}

// ─── barrel prop ─────────────────────────────────────────────────────────────

function addBarrel(root, materials, nodes) {
  const group = createNode(root, nodes, 'barrel');
  const x = 1.62;
  const z = DIMS.depth / 2 + 0.9;
  const y = 0.5;

  addCylinder(group, 'barrel.body', 0.34, 0.29, 0.9, [x, y, z], materials.barrel, 14);
  addCylinder(group, 'barrel.bulge', 0.36, 0.36, 0.38, [x, y + 0.02, z], materials.barrelDark, 14);
  for (const dy of [-0.3, -0.04, 0.24]) {
    addTorus(group, `barrel.band.${dy}`, 0.35, 0.032, [x, y + dy, z], materials.barrelBand, [Math.PI / 2, 0, 0], 16);
  }
  addCylinder(group, 'barrel.lid', 0.31, 0.31, 0.06, [x, y + 0.47, z], materials.timberLight, 12);
  addBlock(group, 'barrel.lid-cross', [0.52, 0.04, 0.08], [x, y + 0.51, z], materials.timberDark, [0, 0.35, 0], 0.015);
  addBlock(group, 'barrel.lid-cross2', [0.08, 0.04, 0.52], [x, y + 0.51, z], materials.timberDark, [0, 0.35, 0], 0.015);
}

// ─── runtime ─────────────────────────────────────────────────────────────────

function collectMeshes(node) {
  const list = [];
  if (!node) return list;
  node.traverse((object) => {
    if (object.isMesh || object.isInstancedMesh) list.push(object);
  });
  return list;
}

function addRuntimeMetadata(root, nodes, sockets) {
  const meshes = {};
  root.traverse((object) => {
    if (object.isMesh || object.isInstancedMesh) {
      meshes[object.name || object.uuid] = object;
    }
  });

  root.userData.sculptRuntime = {
    nodes,
    meshes,
    sockets,
    meta: {
      soleY: 0,
      facadeNormal: '+Z',
      structureType: 'open-pavilion',
      gen: 'img2threejs-carriage_stop-v2',
      name: 'hero.carriage_stop.v2',
    },
    colliders: {
      platform: {
        type: 'box',
        center: [0, DIMS.platformH / 2, 0],
        size: [DIMS.width + 0.2, DIMS.platformH, DIMS.depth + 0.2],
        isTrigger: false,
      },
      posts: {
        type: 'compound-posts',
        center: [0, DIMS.platformH + DIMS.postH / 2, 0],
        size: [DIMS.width, DIMS.postH, DIMS.depth],
        isTrigger: false,
      },
      roof: {
        type: 'closed-gable-prism',
        center: [0, DIMS.eaveY + DIMS.roofRise * 0.45, 0],
        size: [DIMS.roofWidth, DIMS.roofRise, DIMS.roofDepth],
        isTrigger: false,
      },
      trough: {
        type: 'box',
        center: [0.12, 0.34, DIMS.depth / 2 + 0.78],
        size: [2.5, 0.6, 0.85],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [0, DIMS.eaveY - 0.55, DIMS.depth / 2 + 0.55],
        size: [2.0, 1.0, 1.0],
        isTrigger: true,
      },
    },
    destructionGroups: {
      timberFrame: collectMeshes(nodes['timber-frame']),
      platform: collectMeshes(nodes.platform),
      roof: collectMeshes(nodes.roof),
      rails: collectMeshes(nodes['hitching-rails']),
      props: [
        ...collectMeshes(nodes['water-trough']),
        ...collectMeshes(nodes.barrel),
        ...collectMeshes(nodes['sign-rig']),
        ...collectMeshes(nodes.lantern),
      ],
    },
    animation: {
      hangingSign: {
        node: sockets.signSwing,
        axis: [0, 0, 1],
        range: [-0.08, 0.08],
      },
      lantern: {
        node: sockets.lanternSwing,
        axis: [1, 0, 0],
        range: [-0.06, 0.06],
      },
    },
    sources: [
      'public/content/buildings/carriage_stop/ref_main.png',
      'public/content/buildings/carriage_stop/ref_front.png',
      'public/content/buildings/carriage_stop/ref_side.png',
    ],
    buildPasses: [
      'blockout',
      'structural-pass',
      'form-refinement',
      'material-pass',
      'surface-pass',
      'interaction-pass',
      'optimization-pass',
    ],
    approximation: 'clean stylized multi-view procedural open-pavilion reconstruction (v2)',
    prohibitedTechniques: [
      'photo-billboard',
      'projected-reference-photo',
      'paired-rotated-box-roof-slabs',
      'closed-solid-house-box',
      'fake-opening-on-wall-shell',
      'gable-infill-panel',
    ],
  };
}

/**
 * Procedural carriage rest stop / OPEN pavilion (img2threejs v2).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - OPEN timber frame (4 posts + beams + curved knees) — never a closed building box
 * - one closed indexed triangular prism roof, ridge along depth (Z)
 * - inn-v3 dense terracotta tile relief, hitching rails + rope, trough, barrel, sign, lantern
 * - sculptRuntime with sockets / colliders / destruction groups
 */
export function createCarriageStopModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.carriage_stop.v2';
  root.userData.assetId = 'img2threejs-carriage_stop-v2';
  root.userData.gen = 'img2threejs-carriage_stop-v2';
  root.userData.heroVersion = 'img2threejs-carriage_stop-v2';
  root.userData.generator = 'img2threejs-forge-authored-v2';
  root.userData.facadeNormal = '+Z';
  root.userData.soleY = 0;
  root.userData.structureType = 'open-pavilion';
  root.userData.referenceViews = ['three-quarter-front', 'straight-front', 'right-side'];
  root.userData.approximation = 'stylized multi-view procedural reconstruction';
  root.userData.usesPhotoBillboard = false;
  root.userData.openSeeThrough = true;
  root.userData.noWallShell = true;

  const materials = createMaterials();
  const nodes = { root };
  const sockets = {};

  addPlatform(root, materials, nodes);
  addPostsAndFrame(root, materials, nodes);
  addHitchingRails(root, materials, nodes);
  addRoof(root, materials, nodes);
  addSign(root, materials, nodes, sockets);
  addLantern(root, materials, nodes, sockets);
  addTrough(root, materials, nodes);
  addBarrel(root, materials, nodes);

  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;
  const wireframe = options.wireframe ?? false;
  root.traverse((object) => {
    if (!object.isMesh && !object.isInstancedMesh) return;
    object.castShadow = castShadow;
    object.receiveShadow = receiveShadow;
    if (!wireframe || !object.material) return;
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => {
        material.wireframe = true;
      });
    } else {
      object.material.wireframe = true;
    }
  });

  addRuntimeMetadata(root, nodes, sockets);
  return root;
}

export const createCarriageStopHero = createCarriageStopModel;
export default createCarriageStopModel;
