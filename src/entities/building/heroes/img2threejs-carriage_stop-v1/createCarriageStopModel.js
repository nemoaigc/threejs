import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Carriage rest stop / open pavilion — img2threejs v1
 *
 * Quality bar: guild-v2 / temple-v2 / inn-v3
 * Identity: OPEN timber frame (not a closed house box), terracotta curved tile
 * gable roof, plank platform, hitching rails + rope wraps, green water trough,
 * barrel, hanging "REST STOP" sign, warm lantern. Facade +Z, sole y=0.
 */

const DIMS = Object.freeze({
  width: 5.4,
  depth: 4.35,
  platformH: 0.18,
  postH: 3.15,
  postSize: 0.32,
  railY: 1.05,
  eaveY: 3.22,
  roofWidth: 6.55,
  roofDepth: 5.15,
  roofRise: 1.72,
  frontZ: 2.175,
});

const PALETTE = Object.freeze({
  timberDark: 0x4a2c18,
  timber: 0x7a4a28,
  timberLight: 0xa86636,
  timberWarm: 0xb87842,
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
      emissiveIntensity: 1.1,
    }),
    lanternGlass: standard(PALETTE.lanternGlass, 0.22, 0, {
      emissive: 0xffa040,
      emissiveIntensity: 1.25,
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
  // wood grain hints
  ctx.strokeStyle = 'rgba(120, 90, 50, 0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const y = 18 + i * 22 + (i % 2) * 4;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.bezierCurveTo(140, y + 4, 360, y - 3, 500, y + 2);
    ctx.stroke();
  }
  // border
  ctx.strokeStyle = '#6a4a28';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.strokeStyle = '#a08050';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
  // text
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
  addTorus(parent, `${name}.b`, radius * 0.92, 0.024, [x, y + 0.04, z], material, [Math.PI / 2, 0.2, 0], 12);
}

// ─── structure ─────────────────────────────────────────────────────────────

function addPlatform(root, materials, nodes) {
  const group = createNode(root, nodes, 'platform');
  const W = DIMS.width;
  const D = DIMS.depth;
  const H = DIMS.platformH;

  // raised deck mass
  addBlock(group, 'platform.deck', [W + 0.15, H, D + 0.12], [0, H / 2, 0], materials.plankDark, [0, 0, 0], 0.03);

  // individual floor planks (readable deck)
  const plankCount = 11;
  const plankDepth = (D - 0.08) / plankCount;
  const plankMats = [materials.plank, materials.plankLight, materials.plankDark];
  for (let i = 0; i < plankCount; i += 1) {
    const z = -D / 2 + 0.04 + plankDepth * (i + 0.5);
    addBlock(
      group,
      `platform.plank.${i}`,
      [W - 0.08, 0.06, plankDepth * 0.9],
      [0, H + 0.02, z],
      plankMats[i % 3],
      [0, 0, 0],
      0.02,
    );
  }

  // edge boards
  addBlock(group, 'platform.edge.front', [W + 0.08, 0.12, 0.1], [0, H + 0.04, D / 2 + 0.02], materials.timber, [0, 0, 0], 0.025);
  addBlock(group, 'platform.edge.back', [W + 0.08, 0.12, 0.1], [0, H + 0.04, -D / 2 - 0.02], materials.timber, [0, 0, 0], 0.025);
  addBlock(group, 'platform.edge.left', [0.1, 0.12, D + 0.08], [-W / 2 - 0.02, H + 0.04, 0], materials.timberDark, [0, 0, 0], 0.025);
  addBlock(group, 'platform.edge.right', [0.1, 0.12, D + 0.08], [W / 2 + 0.02, H + 0.04, 0], materials.timberDark, [0, 0, 0], 0.025);

  // low ground sill under posts
  for (const [sx, sz, name] of [
    [-1, -1, 'sw'],
    [1, -1, 'se'],
    [-1, 1, 'nw'],
    [1, 1, 'ne'],
  ]) {
    addBlock(
      group,
      `platform.sill.${name}`,
      [0.55, 0.16, 0.55],
      [(W / 2 - 0.12) * sx, 0.08, (D / 2 - 0.12) * sz],
      materials.timberDark,
      [0, 0, 0],
      0.04,
    );
  }
}

function addPostsAndFrame(root, materials, nodes) {
  const group = createNode(root, nodes, 'timber-frame');
  const W = DIMS.width;
  const D = DIMS.depth;
  const postH = DIMS.postH;
  const ps = DIMS.postSize;
  const baseY = DIMS.platformH;
  const topY = baseY + postH;
  const halfW = W / 2 - 0.12;
  const halfD = D / 2 - 0.12;

  const corners = [
    { name: 'sw', x: -halfW, z: -halfD },
    { name: 'se', x: halfW, z: -halfD },
    { name: 'nw', x: -halfW, z: halfD },
    { name: 'ne', x: halfW, z: halfD },
  ];

  for (const c of corners) {
    // main post
    addBlock(
      group,
      `frame.post.${c.name}`,
      [ps, postH, ps],
      [c.x, baseY + postH / 2, c.z],
      materials.timber,
      [0, 0, 0],
      0.045,
    );
    // base block
    addBlock(
      group,
      `frame.post-base.${c.name}`,
      [ps + 0.18, 0.22, ps + 0.18],
      [c.x, baseY + 0.11, c.z],
      materials.timberDark,
      [0, 0, 0],
      0.04,
    );
    // capital pad under beam
    addBlock(
      group,
      `frame.post-cap.${c.name}`,
      [ps + 0.12, 0.12, ps + 0.12],
      [c.x, topY - 0.06, c.z],
      materials.timberLight,
      [0, 0, 0],
      0.03,
    );
  }

  // top ring beams
  addBlock(group, 'frame.beam.front', [W - 0.08, 0.24, 0.24], [0, topY, halfD], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(group, 'frame.beam.back', [W - 0.08, 0.24, 0.24], [0, topY, -halfD], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(group, 'frame.beam.left', [0.24, 0.24, D - 0.08], [-halfW, topY, 0], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(group, 'frame.beam.right', [0.24, 0.24, D - 0.08], [halfW, topY, 0], materials.timberDark, [0, 0, 0], 0.04);

  // mid cross beams under gable
  addBlock(group, 'frame.tie.front', [W - 0.35, 0.16, 0.16], [0, topY - 0.55, halfD - 0.02], materials.timber, [0, 0, 0], 0.03);
  addBlock(group, 'frame.tie.back', [W - 0.35, 0.16, 0.16], [0, topY - 0.55, -halfD + 0.02], materials.timber, [0, 0, 0], 0.03);

  // diagonal braces at each corner (upper)
  const braceLen = 0.95;
  const braceY = topY - 0.55;
  const braceSpecs = [
    // front-left: brace to +X and -Z inward
    { name: 'fl-x', pos: [-halfW + braceLen * 0.42, braceY, halfD], size: [braceLen, 0.12, 0.12], rot: [0, 0, -0.55] },
    { name: 'fl-z', pos: [-halfW, braceY, halfD - braceLen * 0.42], size: [0.12, 0.12, braceLen], rot: [0.55, 0, 0] },
    { name: 'fr-x', pos: [halfW - braceLen * 0.42, braceY, halfD], size: [braceLen, 0.12, 0.12], rot: [0, 0, 0.55] },
    { name: 'fr-z', pos: [halfW, braceY, halfD - braceLen * 0.42], size: [0.12, 0.12, braceLen], rot: [0.55, 0, 0] },
    { name: 'bl-x', pos: [-halfW + braceLen * 0.42, braceY, -halfD], size: [braceLen, 0.12, 0.12], rot: [0, 0, -0.55] },
    { name: 'bl-z', pos: [-halfW, braceY, -halfD + braceLen * 0.42], size: [0.12, 0.12, braceLen], rot: [-0.55, 0, 0] },
    { name: 'br-x', pos: [halfW - braceLen * 0.42, braceY, -halfD], size: [braceLen, 0.12, 0.12], rot: [0, 0, 0.55] },
    { name: 'br-z', pos: [halfW, braceY, -halfD + braceLen * 0.42], size: [0.12, 0.12, braceLen], rot: [-0.55, 0, 0] },
  ];
  for (const b of braceSpecs) {
    addBlock(group, `frame.brace.${b.name}`, b.size, b.pos, materials.timberLight, b.rot, 0.025);
  }

  // gable king posts + rafters (front & rear)
  const rise = DIMS.roofRise;
  const ridgeY = DIMS.eaveY + rise;
  for (const side of [-1, 1]) {
    const z = side * halfD;
    // vertical king post under ridge
    addBlock(
      group,
      `frame.king.${side > 0 ? 'front' : 'back'}`,
      [0.16, rise * 0.92, 0.16],
      [0, DIMS.eaveY + rise * 0.46, z],
      materials.timber,
      [0, 0, 0],
      0.03,
    );
    // left / right rafters on gable face
    const rafterLen = Math.hypot(DIMS.roofWidth * 0.48, rise);
    const angle = Math.atan2(rise, DIMS.roofWidth * 0.48);
    addBlock(
      group,
      `frame.rafter.L.${side > 0 ? 'f' : 'b'}`,
      [rafterLen, 0.14, 0.14],
      [-DIMS.roofWidth * 0.22, DIMS.eaveY + rise * 0.48, z + side * 0.02],
      materials.timberDark,
      [0, 0, angle],
      0.03,
    );
    addBlock(
      group,
      `frame.rafter.R.${side > 0 ? 'f' : 'b'}`,
      [rafterLen, 0.14, 0.14],
      [DIMS.roofWidth * 0.22, DIMS.eaveY + rise * 0.48, z + side * 0.02],
      materials.timberDark,
      [0, 0, -angle],
      0.03,
    );
    // collar / gable cross
    addBlock(
      group,
      `frame.collar.${side > 0 ? 'front' : 'back'}`,
      [DIMS.roofWidth * 0.55, 0.12, 0.12],
      [0, DIMS.eaveY + rise * 0.38, z + side * 0.04],
      materials.timberLight,
      [0, 0, 0],
      0.025,
    );
  }

  // ridge beam running depth
  addBlock(
    group,
    'frame.ridge-beam',
    [0.22, 0.2, DIMS.roofDepth * 0.92],
    [0, ridgeY + 0.02, 0],
    materials.timberWarm,
    [0, 0, 0],
    0.04,
  );

  // decorative ridge end caps (chunky timber)
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `frame.ridge-end.${side > 0 ? 'front' : 'back'}`,
      [0.38, 0.42, 0.55],
      [0, ridgeY + 0.18, side * (DIMS.roofDepth / 2 - 0.08)],
      materials.timberWarm,
      [0, 0, 0],
      0.06,
      3,
    );
    // small top nub
    addBlock(
      group,
      `frame.ridge-nub.${side > 0 ? 'front' : 'back'}`,
      [0.22, 0.22, 0.28],
      [0, ridgeY + 0.48, side * (DIMS.roofDepth / 2 - 0.05)],
      materials.timberLight,
      [0, 0, 0],
      0.04,
    );
  }

  // interior mid posts (front rail supports look from refs — optional center posts on sides)
  // short outer hitch post left front
  addBlock(
    group,
    'frame.hitch-post.left',
    [0.16, 1.15, 0.16],
    [-halfW - 0.35, 0.58, halfD + 0.15],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'frame.hitch-post.left-cap',
    [0.22, 0.1, 0.22],
    [-halfW - 0.35, 1.18, halfD + 0.15],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addRopeWrap(group, 'frame.hitch-rope.left', -halfW - 0.35, 0.95, halfD + 0.15, 0.14, materials.rope);
}

function addHitchingRails(root, materials, nodes) {
  const group = createNode(root, nodes, 'hitching-rails');
  const W = DIMS.width;
  const D = DIMS.depth;
  const halfW = W / 2 - 0.12;
  const halfD = D / 2 - 0.12;
  const y = DIMS.railY;
  const railT = 0.14;

  // front rail (open but with mid rail — refs show mid rail across front)
  addBlock(group, 'rail.front', [W - 0.55, railT, railT], [0, y, halfD - 0.02], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.front.lower', [W - 0.7, railT * 0.9, railT * 0.9], [0, y - 0.38, halfD - 0.02], materials.timber, [0, 0, 0], 0.035);

  // back rail
  addBlock(group, 'rail.back', [W - 0.55, railT, railT], [0, y, -halfD + 0.02], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.back.lower', [W - 0.7, railT * 0.9, railT * 0.9], [0, y - 0.38, -halfD + 0.02], materials.timber, [0, 0, 0], 0.035);

  // left / right rails
  addBlock(group, 'rail.left', [railT, railT, D - 0.55], [-halfW + 0.02, y, 0], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.left.lower', [railT * 0.9, railT * 0.9, D - 0.7], [-halfW + 0.02, y - 0.38, 0], materials.timber, [0, 0, 0], 0.035);
  addBlock(group, 'rail.right', [railT, railT, D - 0.55], [halfW - 0.02, y, 0], materials.timberLight, [0, 0, 0], 0.04);
  addBlock(group, 'rail.right.lower', [railT * 0.9, railT * 0.9, D - 0.7], [halfW - 0.02, y - 0.38, 0], materials.timber, [0, 0, 0], 0.035);

  // rope wraps at rail/post junctions (identity detail)
  const ropePoints = [
    [-halfW, y, halfD - 0.05],
    [halfW, y, halfD - 0.05],
    [-halfW, y, -halfD + 0.05],
    [halfW, y, -halfD + 0.05],
    [-halfW * 0.15, y, halfD - 0.02],
    [halfW * 0.15, y, halfD - 0.02],
    [-halfW * 0.15, y, -halfD + 0.02],
    [halfW * 0.15, y, -halfD + 0.02],
  ];
  ropePoints.forEach((p, i) => {
    addRopeWrap(group, `rail.rope.${i}`, p[0], p[1], p[2], 0.16, i % 2 ? materials.ropeDark : materials.rope);
  });
}

function addRoof(root, materials, nodes) {
  const group = createNode(root, nodes, 'roof');
  const eaveY = DIMS.eaveY;

  const solid = createMesh(
    createSolidGableGeometry(DIMS.roofWidth, DIMS.roofDepth, DIMS.roofRise),
    materials.roofDeep,
    'roof.structural-solid-gable-prism',
  );
  solid.position.y = eaveY;
  solid.userData.structuralRoof = true;
  solid.userData.prohibitedConstruction = 'paired-rotated-box-slabs';
  group.add(solid);

  // under-eave fascia
  addBlock(
    group,
    'roof.fascia.front',
    [DIMS.roofWidth + 0.05, 0.14, 0.12],
    [0, eaveY + 0.02, DIMS.roofDepth / 2 + 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia.back',
    [DIMS.roofWidth + 0.05, 0.14, 0.12],
    [0, eaveY + 0.02, -DIMS.roofDepth / 2 - 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // tile relief — curved terracotta look via rounded blocks on slopes
  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 7;
  const columns = 10;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [materials.roof, materials.roofLight, materials.roofDark];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.55);
      const x = side * distanceFromRidge;
      const y = eaveY + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.09;
      const stagger = row % 2 ? tileDepth * 0.4 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.12;
        if (Math.abs(z) > DIMS.roofDepth / 2 + 0.08) continue;
        const material = tileMats[(row * 2 + column + (side > 0 ? 1 : 0)) % 3];
        // slightly barrel-like tile profile via taller rounded box
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.15, 0.13, tileDepth * 1.08],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.05,
          3,
        );
      }
    }
  }

  // ridge caps
  for (let i = 0; i < 12; i += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 12) * (i + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${i}`,
      [0.38, 0.28, DIMS.roofDepth / 11.5],
      [0, eaveY + DIMS.roofRise + 0.08, z],
      i % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.05,
      3,
    );
  }

  // eave edge tiles (front overhang scallop row)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i += 1) {
      const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 9) * (i + 0.5);
      addBlock(
        tileGroup,
        `roof.eave.${side < 0 ? 'L' : 'R'}.${i}`,
        [0.22, 0.1, tileDepth * 0.95],
        [side * (halfWidth - 0.05), eaveY + 0.12, z],
        tileMats[i % 3],
        [0, 0, side < 0 ? 0.35 : -0.35],
        0.04,
        3,
      );
    }
  }
}

function addSign(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'sign-rig');
  const halfD = DIMS.depth / 2 - 0.12;
  const hangY = DIMS.eaveY - 0.15;
  const z = halfD + 0.08;

  // iron hangers from front beam
  for (const x of [-0.55, 0.55]) {
    addBlock(group, `sign.hook.${x < 0 ? 'L' : 'R'}`, [0.06, 0.18, 0.06], [x, hangY, z], materials.iron, [0, 0, 0], 0.015);
    addCylinder(group, `sign.chain.${x < 0 ? 'L' : 'R'}`, 0.025, 0.025, 0.42, [x, hangY - 0.28, z], materials.ironLight, 8);
  }

  const pivot = new THREE.Group();
  pivot.name = 'sign.swing-pivot';
  pivot.position.set(0, hangY - 0.52, z);
  group.add(pivot);
  sockets.signSwing = pivot;

  // board
  const board = addBlock(pivot, 'sign.board', [1.55, 0.58, 0.08], [0, 0, 0], materials.signBoard, [0, 0, 0], 0.04);
  addBlock(pivot, 'sign.board-back', [1.62, 0.64, 0.05], [0, 0, -0.04], materials.signBoardDark, [0, 0, 0], 0.035);
  addBlock(pivot, 'sign.frame', [1.68, 0.7, 0.04], [0, 0, -0.06], materials.timberDark, [0, 0, 0], 0.03);

  // try canvas text; always add 3D letter blocks as readable fallback / detail
  const texture = createSignTexture();
  if (texture) {
    const faceMat = standard(0xffffff, 0.88, 0, { map: texture });
    const face = createMesh(roundedGeometry([1.48, 0.52, 0.02], 0.02), faceMat, 'sign.face-texture');
    face.position.set(0, 0, 0.05);
    pivot.add(face);
  } else {
    // geometric lettering approximation for headless
    addBlock(pivot, 'sign.ink-bar', [1.2, 0.08, 0.03], [0, 0.05, 0.05], materials.signInk, [0, 0, 0], 0.01);
    addBlock(pivot, 'sign.ink-bar2', [1.05, 0.08, 0.03], [0, -0.12, 0.05], materials.signInk, [0, 0, 0], 0.01);
  }

  // decorative corner nails
  for (const [sx, sy] of [
    [-0.7, 0.22],
    [0.7, 0.22],
    [-0.7, -0.22],
    [0.7, -0.22],
  ]) {
    addCylinder(pivot, `sign.nail.${sx}.${sy}`, 0.03, 0.03, 0.06, [sx, sy, 0.05], materials.iron, 6, [Math.PI / 2, 0, 0]);
  }

  board.userData.hasSignText = true;

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.sign-interaction';
  interaction.position.set(0, hangY - 0.5, z + 0.4);
  group.add(interaction);
  sockets.signInteraction = interaction;
}

function addLantern(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'lantern');
  const halfW = DIMS.width / 2 - 0.12;
  const halfD = DIMS.depth / 2 - 0.12;
  // hang from left-front post area
  const ax = -halfW + 0.05;
  const az = halfD - 0.15;
  const ay = DIMS.postH + DIMS.platformH - 0.55;

  // iron arm
  addBlock(group, 'lantern.arm', [0.08, 0.08, 0.55], [ax, ay, az + 0.2], materials.iron, [0, 0, 0], 0.02);
  addBlock(group, 'lantern.bracket', [0.12, 0.18, 0.12], [ax, ay, az], materials.ironLight, [0, 0, 0], 0.02);
  // curved hook
  addTorus(group, 'lantern.hook', 0.12, 0.025, [ax, ay - 0.05, az + 0.48], materials.iron, [0, 0, Math.PI * 0.5], 10, Math.PI);

  const lampPivot = new THREE.Group();
  lampPivot.name = 'lantern.swing-pivot';
  lampPivot.position.set(ax, ay - 0.22, az + 0.48);
  group.add(lampPivot);
  sockets.lanternSwing = lampPivot;

  // cage
  addBlock(lampPivot, 'lantern.top', [0.28, 0.08, 0.28], [0, 0.18, 0], materials.iron, [0, 0, 0], 0.02);
  addBlock(lampPivot, 'lantern.bottom', [0.26, 0.06, 0.26], [0, -0.2, 0], materials.iron, [0, 0, 0], 0.02);
  addBlock(lampPivot, 'lantern.cap', [0.16, 0.1, 0.16], [0, 0.28, 0], materials.ironLight, [0, 0, 0], 0.02);
  // posts of cage
  for (const [sx, sz] of [
    [-0.1, -0.1],
    [0.1, -0.1],
    [-0.1, 0.1],
    [0.1, 0.1],
  ]) {
    addBlock(lampPivot, `lantern.post.${sx}.${sz}`, [0.035, 0.36, 0.035], [sx, 0, sz], materials.iron, [0, 0, 0], 0.01);
  }
  // glass / glow body
  addBlock(lampPivot, 'lantern.glass', [0.2, 0.28, 0.2], [0, 0, 0], materials.lanternGlass, [0, 0, 0], 0.03);
  addSphere(lampPivot, 'lantern.flame', 0.07, [0, 0.02, 0], materials.lanternGlow, 8, [1, 1.3, 1]);

  // point light proxy (optional at runtime)
  const lightSocket = new THREE.Object3D();
  lightSocket.name = 'socket.lantern-light';
  lightSocket.position.set(0, 0, 0);
  lampPivot.add(lightSocket);
  sockets.lanternLight = lightSocket;
}

function addTrough(root, materials, nodes) {
  const group = createNode(root, nodes, 'water-trough');
  // front of platform, slightly right of center per main ref (green long box)
  const z = DIMS.depth / 2 + 0.72;
  const y = 0.32;
  const x = 0.15;

  // wooden base
  addBlock(group, 'trough.base', [2.35, 0.22, 0.72], [x, 0.12, z], materials.troughWood, [0, 0, 0], 0.04);
  // green painted body
  addBlock(group, 'trough.body', [2.2, 0.38, 0.62], [x, y, z], materials.troughGreen, [0, 0, 0], 0.045);
  addBlock(group, 'trough.lip', [2.28, 0.1, 0.7], [x, y + 0.2, z], materials.troughGreenLight, [0, 0, 0], 0.03);
  // inner hollow dark
  addBlock(group, 'trough.inner', [1.95, 0.22, 0.42], [x, y + 0.05, z], materials.troughGreenDark, [0, 0, 0], 0.03);
  // water surface
  addBlock(group, 'trough.water', [1.88, 0.05, 0.38], [x, y + 0.12, z], materials.water, [0, 0, 0], 0.02);
  addBlock(group, 'trough.water-deep', [1.7, 0.04, 0.28], [x, y + 0.08, z], materials.waterDeep, [0, 0, 0], 0.015);

  // floating leaves (identity sparkle from refs)
  const leaves = [
    [-0.55, 0.18],
    [-0.1, -0.08],
    [0.45, 0.12],
    [0.75, -0.05],
  ];
  leaves.forEach((p, i) => {
    addBlock(
      group,
      `trough.leaf.${i}`,
      [0.14, 0.02, 0.08],
      [x + p[0], y + 0.16, z + p[1]],
      i % 2 ? materials.leafDark : materials.leaf,
      [0, i * 0.7, 0.15],
      0.01,
    );
  });

  // side braces under trough
  addBlock(group, 'trough.leg.L', [0.12, 0.28, 0.5], [x - 0.9, 0.14, z], materials.troughWood, [0, 0, 0], 0.03);
  addBlock(group, 'trough.leg.R', [0.12, 0.28, 0.5], [x + 0.9, 0.14, z], materials.troughWood, [0, 0, 0], 0.03);
}

function addBarrel(root, materials, nodes) {
  const group = createNode(root, nodes, 'barrel');
  const x = 1.55;
  const z = DIMS.depth / 2 + 0.85;
  const y = 0.48;

  // staves as tapered cylinder
  addCylinder(group, 'barrel.body', 0.32, 0.28, 0.85, [x, y, z], materials.barrel, 14);
  addCylinder(group, 'barrel.bulge', 0.34, 0.34, 0.35, [x, y + 0.02, z], materials.barrelDark, 14);
  // metal bands
  for (const dy of [-0.28, -0.05, 0.22]) {
    addTorus(group, `barrel.band.${dy}`, 0.33, 0.03, [x, y + dy, z], materials.barrelBand, [Math.PI / 2, 0, 0], 16);
  }
  // lid
  addCylinder(group, 'barrel.lid', 0.3, 0.3, 0.06, [x, y + 0.44, z], materials.timberLight, 12);
  addBlock(group, 'barrel.lid-cross', [0.5, 0.04, 0.08], [x, y + 0.48, z], materials.timberDark, [0, 0.4, 0], 0.015);
}

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
      gen: 'img2threejs-carriage_stop-v1',
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
        center: [0.15, 0.32, DIMS.depth / 2 + 0.72],
        size: [2.4, 0.55, 0.8],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [0, DIMS.eaveY - 0.55, DIMS.depth / 2 + 0.5],
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
    approximation: 'clean stylized multi-view procedural open-pavilion reconstruction',
    prohibitedTechniques: [
      'photo-billboard',
      'projected-reference-photo',
      'paired-rotated-box-roof-slabs',
      'closed-solid-house-box',
    ],
  };
}

/**
 * Procedural carriage rest stop / open pavilion (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - OPEN timber frame (4 posts + beams + braces) — not a closed building box
 * - one closed indexed triangular prism roof, ridge along depth (Z)
 * - terracotta tile relief, hitching rails + rope, trough, barrel, sign, lantern
 * - sculptRuntime with sockets / colliders / destruction groups
 */
export function createCarriageStopModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.carriage_stop.v1';
  root.userData.assetId = 'img2threejs-carriage_stop-v1';
  root.userData.gen = 'img2threejs-carriage_stop-v1';
  root.userData.heroVersion = 'img2threejs-carriage_stop-v1';
  root.userData.generator = 'img2threejs-forge-authored-v1';
  root.userData.facadeNormal = '+Z';
  root.userData.soleY = 0;
  root.userData.structureType = 'open-pavilion';
  root.userData.referenceViews = ['three-quarter-front', 'straight-front', 'right-side'];
  root.userData.approximation = 'stylized multi-view procedural reconstruction';
  root.userData.usesPhotoBillboard = false;

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
