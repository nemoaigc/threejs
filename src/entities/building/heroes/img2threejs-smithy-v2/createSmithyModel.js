/**
 * Procedural Blacksmith / Smithy — img2threejs-smithy-v2
 *
 * Quality bar: inn-v3 / guild-v2 (v1 failed review — rebuild)
 *
 * Identity (ref_main / ref_front / ref_side):
 * - near-black dark timber posts + stone feet, open two-bay forge mouth
 * - strong emissive firebox + coal bed + sparks + point light
 * - solid single-prism red clay tile roof (NO paired rotated boxes)
 * - tall brick chimney + terracotta pot + smoke
 * - hanging FORGE sign (horseshoe + hammer)
 * - anvil, workbench, tongs, horseshoe props
 * - sole y=0 · facade +Z · gen=img2threejs-smithy-v2 · name=hero.shop.smithy.v2
 *
 * v2 vs v1 fixes:
 * - forge mouth deeper + hotter firebrick volume (not flat glow cards)
 * - thicker multi-part posts / sill / lintel silhouette punch
 * - denser tile relief + curved ridge beam + more moss
 * - taller chimney stack with denser brick courses
 * - clearer anvil horn silhouette + bolder sign iconography
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PALETTE = Object.freeze({
  timberBlack: 0x14100c,
  timberDark: 0x1e1712,
  timber: 0x2a2018,
  timberWarm: 0x3a2c20,
  timberGrain: 0x4a3728,
  timberEdge: 0x5a4430,
  stoneDark: 0x4a4640,
  stone: 0x6a655c,
  stoneLight: 0x8a8478,
  stoneFoot: 0x555048,
  mortar: 0x3a3630,
  roofDark: 0x8a2a18,
  roof: 0xb03820,
  roofLight: 0xcc4c30,
  roofMid: 0xa4321e,
  roofHot: 0xd85a38,
  brickDark: 0x5e2e24,
  brick: 0x8a4030,
  brickLight: 0xa85440,
  brickWarm: 0xb8684a,
  brickMort: 0x4a3830,
  pot: 0xc45a2e,
  potDark: 0x9a4220,
  potLight: 0xd87040,
  iron: 0x141414,
  ironMid: 0x242424,
  ironLight: 0x3a3a38,
  anvil: 0x101010,
  gold: 0xd4a020,
  goldLight: 0xefc040,
  goldDark: 0xa87818,
  signRed: 0x6a1810,
  signRedDark: 0x4a1008,
  signRedLight: 0x8a2820,
  cream: 0xe8d8b8,
  creamDark: 0xc8b090,
  moss: 0x3a6a28,
  mossLight: 0x4a8a34,
  mossDark: 0x2a4a1c,
  smoke: 0x8a8a90,
  smokeLight: 0xa8a8b0,
  smokeDark: 0x6a6a70,
  forgeGlow: 0xff6a18,
  forgeCore: 0xffa030,
  forgeWhite: 0xffd080,
  fireBrick: 0xe89040,
  fireBrickHot: 0xffb050,
  fireBrickDeep: 0xc06020,
  interior: 0x0a0806,
  plank: 0x18140f,
  plankLight: 0x261e16,
  plankWarm: 0x322618,
  woodBench: 0x4a3424,
  woodBenchDark: 0x352418,
  woodBenchLight: 0x5c4430,
});

const DIMS = Object.freeze({
  width: 5.9,
  depth: 5.15,
  wallTop: 3.15,
  eaveY: 3.15,
  roofWidth: 6.7,
  roofDepth: 5.9,
  roofRise: 2.05,
  plinthH: 0.3,
  frontZ: 2.55,
  postFoot: 0.48,
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
    timberBlack: standard(PALETTE.timberBlack, 0.88),
    timberDark: standard(PALETTE.timberDark, 0.84),
    timber: standard(PALETTE.timber, 0.8),
    timberWarm: standard(PALETTE.timberWarm, 0.76),
    timberGrain: standard(PALETTE.timberGrain, 0.74),
    timberEdge: standard(PALETTE.timberEdge, 0.7),
    stoneDark: standard(PALETTE.stoneDark, 0.94),
    stone: standard(PALETTE.stone, 0.9),
    stoneLight: standard(PALETTE.stoneLight, 0.86),
    stoneFoot: standard(PALETTE.stoneFoot, 0.92),
    mortar: standard(PALETTE.mortar, 0.97),
    roofDark: standard(PALETTE.roofDark, 0.88),
    roof: standard(PALETTE.roof, 0.82),
    roofLight: standard(PALETTE.roofLight, 0.78),
    roofMid: standard(PALETTE.roofMid, 0.84),
    roofHot: standard(PALETTE.roofHot, 0.74),
    brickDark: standard(PALETTE.brickDark, 0.94),
    brick: standard(PALETTE.brick, 0.9),
    brickLight: standard(PALETTE.brickLight, 0.86),
    brickWarm: standard(PALETTE.brickWarm, 0.84),
    brickMort: standard(PALETTE.brickMort, 0.96),
    pot: standard(PALETTE.pot, 0.72),
    potDark: standard(PALETTE.potDark, 0.78),
    potLight: standard(PALETTE.potLight, 0.68),
    iron: standard(PALETTE.iron, 0.48, 0.78),
    ironMid: standard(PALETTE.ironMid, 0.42, 0.74),
    ironLight: standard(PALETTE.ironLight, 0.36, 0.7),
    anvil: standard(PALETTE.anvil, 0.38, 0.82),
    gold: standard(PALETTE.gold, 0.32, 0.72),
    goldLight: standard(PALETTE.goldLight, 0.26, 0.74),
    goldDark: standard(PALETTE.goldDark, 0.4, 0.68),
    signRed: standard(PALETTE.signRed, 0.6),
    signRedDark: standard(PALETTE.signRedDark, 0.68),
    signRedLight: standard(PALETTE.signRedLight, 0.55),
    cream: standard(PALETTE.cream, 0.88),
    creamDark: standard(PALETTE.creamDark, 0.9),
    moss: standard(PALETTE.moss, 0.95),
    mossLight: standard(PALETTE.mossLight, 0.92),
    mossDark: standard(PALETTE.mossDark, 0.96),
    smoke: standard(PALETTE.smoke, 1, 0, { transparent: true, opacity: 0.7, depthWrite: false }),
    smokeLight: standard(PALETTE.smokeLight, 1, 0, {
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    }),
    smokeDark: standard(PALETTE.smokeDark, 1, 0, {
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
    forgeGlow: standard(PALETTE.forgeGlow, 0.32, 0, {
      emissive: PALETTE.forgeGlow,
      emissiveIntensity: 1.55,
    }),
    forgeCore: standard(PALETTE.forgeCore, 0.24, 0, {
      emissive: PALETTE.forgeCore,
      emissiveIntensity: 2.05,
    }),
    forgeWhite: standard(PALETTE.forgeWhite, 0.18, 0, {
      emissive: PALETTE.forgeWhite,
      emissiveIntensity: 2.4,
    }),
    fireBrick: standard(PALETTE.fireBrick, 0.5, 0, {
      emissive: PALETTE.fireBrick,
      emissiveIntensity: 0.7,
    }),
    fireBrickHot: standard(PALETTE.fireBrickHot, 0.36, 0, {
      emissive: PALETTE.fireBrickHot,
      emissiveIntensity: 1.15,
    }),
    fireBrickDeep: standard(PALETTE.fireBrickDeep, 0.58, 0, {
      emissive: PALETTE.fireBrickDeep,
      emissiveIntensity: 0.45,
    }),
    interior: standard(PALETTE.interior, 1),
    plank: standard(PALETTE.plank, 0.88),
    plankLight: standard(PALETTE.plankLight, 0.84),
    plankWarm: standard(PALETTE.plankWarm, 0.82),
    woodBench: standard(PALETTE.woodBench, 0.78),
    woodBenchDark: standard(PALETTE.woodBenchDark, 0.82),
    woodBenchLight: standard(PALETTE.woodBenchLight, 0.74),
  };
}

function roundedGeometry(size, radius = 0.04, segments = 2) {
  const safeRadius = Math.min(radius, ...size.map((value) => value * 0.24));
  const key = [...size, safeRadius, segments].map((value) => Number(value).toFixed(4)).join(':');
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
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, false),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function addSphere(parent, name, radius, position, material, segments = 12, scale = [1, 1, 1]) {
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
  tubularSegments = 16,
  arc = Math.PI * 2,
) {
  const result = createMesh(
    new THREE.TorusGeometry(radius, tube, 7, tubularSegments, arc),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

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

function addBeamXY(parent, name, start, end, thickness, depth, material, z, radius = 0.02) {
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

function seededUnit(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
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
 * Front/rear gable triangles face ±Z. NOT dual rotated box slabs.
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

function createGableInfillGeometry(width, rise, thickness) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();
  return geometry;
}

// ─── Foundation ──────────────────────────────────────────────────────────────

function addFoundation(root, materials, nodes) {
  const group = createNode(root, nodes, 'foundation');
  addBlock(
    group,
    'foundation.plinth',
    [DIMS.width + 0.7, DIMS.plinthH, DIMS.depth + 0.55],
    [0, DIMS.plinthH / 2, 0],
    materials.stoneDark,
    [0, 0, 0],
    0.055,
  );
  // stepped apron lip for silhouette punch
  addBlock(
    group,
    'foundation.apron',
    [DIMS.width + 0.95, 0.12, DIMS.depth + 0.8],
    [0, 0.06, 0.02],
    materials.mortar,
    [0, 0, 0],
    0.03,
  );
  for (let i = 0; i < 8; i += 1) {
    addBlock(
      group,
      `foundation.front-course.${i}`,
      [0.82, 0.24, 0.2],
      [-2.85 + i * 0.82, 0.15, DIMS.frontZ + 0.16],
      [materials.stoneDark, materials.stone, materials.stoneLight][i % 3],
      [0, 0, 0],
      0.03,
    );
  }
  for (let i = 0; i < 6; i += 1) {
    addBlock(
      group,
      `foundation.side-course-r.${i}`,
      [0.18, 0.22, 0.88],
      [DIMS.width / 2 + 0.22, 0.14, -2.0 + i * 0.88],
      [materials.stone, materials.stoneLight, materials.stoneDark][i % 3],
      [0, 0, 0],
      0.028,
    );
    addBlock(
      group,
      `foundation.side-course-l.${i}`,
      [0.16, 0.2, 0.86],
      [-DIMS.width / 2 - 0.2, 0.13, -2.0 + i * 0.88],
      [materials.stoneDark, materials.stone, materials.stoneLight][i % 3],
      [0, 0, 0],
      0.026,
    );
  }
  // rear course
  for (let i = 0; i < 7; i += 1) {
    addBlock(
      group,
      `foundation.rear-course.${i}`,
      [0.84, 0.2, 0.16],
      [-2.5 + i * 0.84, 0.13, -DIMS.depth / 2 - 0.12],
      [materials.stone, materials.stoneDark, materials.stoneLight][i % 3],
      [0, 0, 0],
      0.025,
    );
  }
}

// ─── Multi-part posts (silhouette punch) ─────────────────────────────────────

function addPost(parent, name, x, z, materials, height = DIMS.wallTop - 0.12) {
  const footH = DIMS.postFoot;
  // chunky stone foot
  addBlock(
    parent,
    `${name}.foot`,
    [0.58, footH, 0.58],
    [x, DIMS.plinthH + footH / 2, z],
    materials.stoneFoot,
    [0, 0, 0],
    0.055,
  );
  addBlock(
    parent,
    `${name}.foot-cap`,
    [0.48, 0.1, 0.48],
    [x, DIMS.plinthH + footH + 0.02, z],
    materials.stoneDark,
    [0, 0, 0],
    0.03,
  );
  const shaftH = height - footH - 0.12;
  const shaftY = DIMS.plinthH + footH + 0.05 + shaftH / 2;
  // main shaft
  addBlock(
    parent,
    `${name}.shaft`,
    [0.38, shaftH, 0.38],
    [x, shaftY, z],
    materials.timberBlack,
    [0, 0, 0],
    0.04,
  );
  // proud grain face strip (reads as hewn timber)
  addBlock(
    parent,
    `${name}.grain-front`,
    [0.08, shaftH - 0.25, 0.4],
    [x, shaftY, z + 0.18],
    materials.timber,
    [0, 0, 0],
    0.015,
  );
  addBlock(
    parent,
    `${name}.grain-side`,
    [0.4, shaftH - 0.3, 0.07],
    [x + 0.18, shaftY, z],
    materials.timberWarm,
    [0, 0, 0],
    0.014,
  );
  // iron bands
  addBlock(
    parent,
    `${name}.band-low`,
    [0.44, 0.08, 0.44],
    [x, DIMS.plinthH + footH + 0.28, z],
    materials.ironMid,
    [0, 0, 0],
    0.015,
  );
  addBlock(
    parent,
    `${name}.band-mid`,
    [0.44, 0.07, 0.44],
    [x, shaftY, z],
    materials.iron,
    [0, 0, 0],
    0.014,
  );
  // capital
  addBlock(
    parent,
    `${name}.capital`,
    [0.48, 0.18, 0.48],
    [x, DIMS.plinthH + height - 0.02, z],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    parent,
    `${name}.capital-lip`,
    [0.54, 0.07, 0.54],
    [x, DIMS.plinthH + height + 0.08, z],
    materials.timberBlack,
    [0, 0, 0],
    0.02,
  );
}

// ─── Timber shell / frame ────────────────────────────────────────────────────

function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'timber-frame');
  const fz = DIMS.frontZ - 0.05;
  const bz = -DIMS.depth / 2 + 0.2;
  const lx = -DIMS.width / 2 + 0.24;
  const rx = DIMS.width / 2 - 0.24;

  const posts = [
    ['post.fl', lx, fz],
    ['post.fr', rx, fz],
    ['post.bl', lx, bz],
    ['post.br', rx, bz],
    ['post.fm', 0, fz],
    ['post.bm', 0, bz],
    ['post.lm', lx, 0],
    ['post.rm', rx, 0],
  ];
  for (const [name, x, z] of posts) {
    addPost(group, name, x, z, materials);
  }

  // Front header stack (deep multi-layer lintel — silhouette punch)
  addBlock(
    group,
    'frame.front-lintel',
    [DIMS.width - 0.1, 0.34, 0.4],
    [0, DIMS.wallTop - 0.02, fz + 0.02],
    materials.timberBlack,
    [0, 0, 0],
    0.045,
  );
  addBlock(
    group,
    'frame.front-lintel-under',
    [DIMS.width - 0.35, 0.2, 0.28],
    [0, DIMS.wallTop - 0.35, fz + 0.04],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'frame.front-lintel-face',
    [DIMS.width - 0.5, 0.12, 0.1],
    [0, DIMS.wallTop - 0.18, fz + 0.2],
    materials.timberWarm,
    [0, 0, 0],
    0.02,
  );

  // Top plate / wall plate
  addBlock(
    group,
    'frame.front-plate',
    [DIMS.width + 0.15, 0.24, 0.32],
    [0, DIMS.wallTop + 0.14, fz - 0.04],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'frame.rear-plate',
    [DIMS.width - 0.05, 0.22, 0.3],
    [0, DIMS.wallTop + 0.12, bz],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `frame.side-plate.${side > 0 ? 'R' : 'L'}`,
      [0.3, 0.2, DIMS.depth - 0.3],
      [side * (DIMS.width / 2 - 0.2), DIMS.wallTop + 0.1, 0],
      materials.timberDark,
      [0, 0, 0],
      0.03,
    );
  }

  // Front sill / knee rail (open mouth lower edge)
  addBlock(
    group,
    'frame.front-sill',
    [DIMS.width - 0.25, 0.26, 0.34],
    [0, DIMS.plinthH + 0.58, fz + 0.02],
    materials.timberBlack,
    [0, 0, 0],
    0.035,
  );
  addBlock(
    group,
    'frame.front-sill-face',
    [DIMS.width - 0.45, 0.12, 0.1],
    [0, DIMS.plinthH + 0.68, fz + 0.18],
    materials.timber,
    [0, 0, 0],
    0.02,
  );

  // Front mid horizontal rails (two-bay reading)
  addBlock(
    group,
    'frame.front-mid-rail',
    [DIMS.width - 0.55, 0.16, 0.22],
    [0, 1.65, fz + 0.04],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Cross beam at mid post (bay divider)
  addBlock(
    group,
    'frame.bay-divider',
    [0.22, DIMS.wallTop - 0.95, 0.28],
    [0, DIMS.plinthH + 0.55 + (DIMS.wallTop - 0.95) / 2, fz - 0.02],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'frame.bay-divider-grain',
    [0.08, DIMS.wallTop - 1.15, 0.3],
    [0, DIMS.plinthH + 0.7 + (DIMS.wallTop - 1.15) / 2, fz + 0.1],
    materials.timber,
    [0, 0, 0],
    0.015,
  );

  // Curved knee braces (tube) at front corners — silhouette punch
  for (const side of [-1, 1]) {
    const px = side * (DIMS.width / 2 - 0.24);
    addTube(
      group,
      `frame.knee-brace.front.${side > 0 ? 'R' : 'L'}`,
      [
        [px - side * 0.05, 1.0, fz + 0.08],
        [px - side * 0.45, 1.7, fz + 0.1],
        [px - side * 0.75, 2.55, fz + 0.08],
      ],
      0.055,
      materials.timberWarm,
      12,
    );
    addBeamXY(
      group,
      `frame.brace.bar.${side > 0 ? 'R' : 'L'}`,
      [px - side * 0.15, 2.35],
      [px - side * 0.95, 2.85],
      0.12,
      0.14,
      materials.timber,
      fz + 0.08,
    );
  }

  // Upper chevron braces under lintel
  addBeamXY(
    group,
    'frame.chevron-l',
    [-2.4, 2.4],
    [-0.35, 2.95],
    0.12,
    0.12,
    materials.timberGrain,
    fz + 0.06,
  );
  addBeamXY(
    group,
    'frame.chevron-r',
    [0.35, 2.95],
    [2.4, 2.4],
    0.12,
    0.12,
    materials.timberGrain,
    fz + 0.06,
  );

  // Iron corner brackets
  for (const [sx, sz, label] of [
    [lx, fz, 'fl'],
    [rx, fz, 'fr'],
    [lx, bz, 'bl'],
    [rx, bz, 'br'],
  ]) {
    addBlock(
      group,
      `frame.bracket.${label}`,
      [0.22, 0.08, 0.22],
      [sx, DIMS.wallTop - 0.45, sz],
      materials.ironLight,
      [0, 0, 0],
      0.015,
    );
  }

  // Interior dark core (set deep so open mouth reads as cavity)
  addBlock(
    group,
    'shell.interior-core',
    [DIMS.width - 0.85, DIMS.wallTop - 0.55, DIMS.depth - 1.05],
    [0, DIMS.plinthH + (DIMS.wallTop - 0.55) / 2 + 0.18, -0.22],
    materials.interior,
    [0, 0, 0],
    0.04,
  );
  // ceiling slab inside
  addBlock(
    group,
    'shell.ceiling',
    [DIMS.width - 0.7, 0.12, DIMS.depth - 0.9],
    [0, DIMS.wallTop - 0.25, -0.1],
    materials.plank,
    [0, 0, 0],
    0.02,
  );
}

// ─── Rear + side walls ───────────────────────────────────────────────────────

function addWalls(root, materials, nodes) {
  const group = createNode(root, nodes, 'walls');
  const bz = -DIMS.depth / 2 + 0.24;
  const plankW = 0.52;
  const plankCount = 10;
  const wallH = DIMS.wallTop - 0.4;
  const wallY = DIMS.plinthH + wallH / 2 + 0.1;

  // Rear vertical planks (volumetric facade)
  for (let i = 0; i < plankCount; i += 1) {
    const x = -DIMS.width / 2 + 0.42 + i * plankW;
    const mat =
      i % 4 === 0
        ? materials.plankLight
        : i % 3 === 0
          ? materials.plankWarm
          : materials.plank;
    addBlock(
      group,
      `wall.rear-plank.${i}`,
      [plankW * 0.88, wallH, 0.12],
      [x, wallY, bz],
      mat,
      [0, 0, 0],
      0.02,
    );
    // micro reveal groove
    if (i < plankCount - 1) {
      addBlock(
        group,
        `wall.rear-groove.${i}`,
        [0.04, wallH * 0.92, 0.06],
        [x + plankW * 0.45, wallY, bz + 0.04],
        materials.timberBlack,
        [0, 0, 0],
        0.01,
      );
    }
  }

  addBlock(
    group,
    'wall.rear-skirt',
    [DIMS.width - 0.4, 0.6, 0.16],
    [0, DIMS.plinthH + 0.38, bz + 0.05],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'wall.rear-mid-rail',
    [DIMS.width - 0.55, 0.15, 0.14],
    [0, 1.6, bz + 0.06],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'wall.rear-top-rail',
    [DIMS.width - 0.35, 0.18, 0.14],
    [0, DIMS.wallTop - 0.18, bz + 0.06],
    materials.timberBlack,
    [0, 0, 0],
    0.02,
  );

  // Left side closed planks
  const lx = -DIMS.width / 2 + 0.16;
  for (let i = 0; i < 7; i += 1) {
    addBlock(
      group,
      `wall.left-plank.${i}`,
      [0.12, wallH * 0.96, 0.68],
      [lx, wallY, -1.9 + i * 0.7],
      i % 2 === 0 ? materials.plank : materials.plankLight,
      [0, 0, 0],
      0.02,
    );
  }
  addBlock(
    group,
    'wall.left-top-rail',
    [0.14, 0.15, DIMS.depth - 0.45],
    [lx + 0.03, DIMS.wallTop - 0.16, 0],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'wall.left-mid-rail',
    [0.14, 0.13, DIMS.depth - 0.55],
    [lx + 0.03, 1.55, 0],
    materials.timber,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'wall.left-skirt',
    [0.16, 0.45, DIMS.depth - 0.5],
    [lx + 0.04, DIMS.plinthH + 0.35, 0],
    materials.timberBlack,
    [0, 0, 0],
    0.025,
  );

  // Right side: planks toward front + masonry stack toward chimney
  const rx = DIMS.width / 2 - 0.16;
  for (let i = 0; i < 4; i += 1) {
    addBlock(
      group,
      `wall.right-plank.${i}`,
      [0.12, wallH * 0.92, 0.7],
      [rx, wallY, -2.0 + i * 0.7],
      materials.plank,
      [0, 0, 0],
      0.02,
    );
  }
  addBlock(
    group,
    'wall.right-top-rail',
    [0.14, 0.14, 2.6],
    [rx + 0.02, DIMS.wallTop - 0.16, -0.7],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );

  // Masonry stack on right (chimney wall identity)
  const brickRows = 10;
  const brickCols = 4;
  for (let row = 0; row < brickRows; row += 1) {
    const stagger = row % 2 ? 0.14 : 0;
    for (let col = 0; col < brickCols; col += 1) {
      const mat = [
        materials.brick,
        materials.brickLight,
        materials.brickDark,
        materials.stoneLight,
        materials.brickWarm,
      ][(row + col) % 5];
      addBlock(
        group,
        `wall.right-masonry.${row}.${col}`,
        [0.24, 0.26, 0.4],
        [rx + 0.1, DIMS.plinthH + 0.22 + row * 0.28, 0.35 + col * 0.42 + stagger * 0.15],
        mat,
        [0, 0, 0],
        0.025,
      );
    }
  }
  // mortar core behind masonry
  addBlock(
    group,
    'wall.right-masonry-core',
    [0.2, wallH * 0.95, 1.85],
    [rx + 0.02, wallY, 0.95],
    materials.brickMort,
    [0, 0, 0],
    0.03,
  );
}

// ─── Open forge bay + emissive volume ────────────────────────────────────────

function addForgeBay(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'forge-bay');
  const fz = DIMS.frontZ - 0.2;

  // Deep firebox back wall — volumetric brick grid (identity)
  const brickCols = 7;
  const brickRows = 6;
  for (let row = 0; row < brickRows; row += 1) {
    for (let col = 0; col < brickCols; col += 1) {
      const cx = col / (brickCols - 1);
      const cy = row / (brickRows - 1);
      const hot = row <= 2 && col >= 1 && col <= 5;
      const whiteHot = row === 0 && col >= 2 && col <= 4;
      const mat = whiteHot
        ? materials.forgeWhite
        : hot
          ? materials.fireBrickHot
          : row < 4
            ? materials.fireBrick
            : materials.fireBrickDeep;
      addBlock(
        group,
        `forge.firebrick.${row}.${col}`,
        [0.4, 0.3, 0.12],
        [-1.25 + col * 0.42, 0.9 + row * 0.32, -0.72],
        mat,
        [0, 0, 0],
        0.018,
      );
      // slight depth variation for volume
      if ((row + col) % 3 === 0) {
        addBlock(
          group,
          `forge.firebrick.proud.${row}.${col}`,
          [0.36, 0.26, 0.06],
          [-1.25 + col * 0.42, 0.9 + row * 0.32, -0.62],
          hot ? materials.fireBrickHot : materials.fireBrick,
          [0, 0, 0],
          0.015,
        );
      }
    }
  }

  // Side firebox returns (create a real cavity mouth)
  for (const side of [-1, 1]) {
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        addBlock(
          group,
          `forge.sidebox.${side > 0 ? 'R' : 'L'}.${row}.${col}`,
          [0.12, 0.28, 0.38],
          [side * 1.45, 0.95 + row * 0.3, -0.35 + col * 0.35],
          row < 2 ? materials.fireBrickHot : materials.fireBrickDeep,
          [0, 0, 0],
          0.015,
        );
      }
    }
  }

  // Hearth slab + raised forge table
  addBlock(
    group,
    'forge.hearth-slab',
    [2.7, 0.2, 1.75],
    [0.1, 0.7, 0.25],
    materials.ironMid,
    [0, 0, 0],
    0.035,
  );
  addBlock(
    group,
    'forge.hearth-lip',
    [2.85, 0.08, 1.9],
    [0.1, 0.58, 0.25],
    materials.iron,
    [0, 0, 0],
    0.02,
  );
  // Hot coal bed (layered emissive)
  addBlock(
    group,
    'forge.coal-bed',
    [1.15, 0.16, 0.85],
    [-0.35, 0.88, 0.15],
    materials.forgeCore,
    [0, 0, 0],
    0.045,
  );
  addBlock(
    group,
    'forge.coal-core',
    [0.7, 0.14, 0.5],
    [-0.3, 0.98, 0.12],
    materials.forgeWhite,
    [0, 0, 0],
    0.04,
  );
  addSphere(group, 'forge.ember.0', 0.14, [-0.15, 1.05, 0.1], materials.forgeGlow, 8);
  addSphere(group, 'forge.ember.1', 0.11, [-0.48, 1.02, 0.25], materials.forgeCore, 8);
  addSphere(group, 'forge.ember.2', 0.09, [-0.25, 1.08, 0.32], materials.forgeWhite, 8);
  addSphere(group, 'forge.ember.3', 0.08, [-0.55, 1.0, 0.05], materials.forgeGlow, 8);
  addSphere(group, 'forge.ember.4', 0.07, [-0.1, 1.04, 0.28], materials.forgeCore, 8);

  // Open mouth reveals (thick timber returns)
  addBlock(
    group,
    'forge.left-reveal',
    [0.22, 2.05, 0.95],
    [-2.35, 1.6, fz - 0.35],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'forge.right-reveal',
    [0.22, 2.05, 0.95],
    [2.35, 1.6, fz - 0.35],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'forge.top-reveal',
    [4.6, 0.18, 0.9],
    [0, 2.7, fz - 0.3],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Ambient bay glow volumes (slightly thicker than cards)
  addBlock(
    group,
    'forge.bay-glow-left',
    [1.75, 1.45, 0.1],
    [-0.9, 1.6, 0.7],
    materials.forgeGlow,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'forge.bay-glow-right',
    [1.6, 1.35, 0.1],
    [1.0, 1.55, 0.6],
    materials.fireBrick,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'forge.bay-glow-floor',
    [2.8, 0.08, 1.4],
    [0.1, 0.95, 0.5],
    materials.forgeGlow,
    [0, 0, 0],
    0.02,
  );

  // Sparks
  for (let i = 0; i < 22; i += 1) {
    const t = seededUnit(i * 17 + 3);
    const u = seededUnit(i * 31 + 9);
    const v = seededUnit(i * 47 + 5);
    addSphere(
      group,
      `forge.spark.${i}`,
      0.02 + t * 0.035,
      [-0.55 + u * 1.0, 1.0 + v * 1.25, 0.25 + t * 0.65],
      t > 0.55 ? materials.forgeWhite : materials.forgeCore,
      5,
    );
  }

  // Point light
  const light = new THREE.PointLight(0xff6a20, 3.1, 9.5, 1.45);
  light.name = 'forge.point-light';
  light.position.set(-0.25, 1.2, 0.35);
  light.castShadow = false;
  group.add(light);
  sockets.forgeLight = light;

  // Secondary warm fill
  const fill = new THREE.PointLight(0xff9030, 1.1, 6, 1.8);
  fill.name = 'forge.fill-light';
  fill.position.set(0.8, 1.4, 1.0);
  fill.castShadow = false;
  group.add(fill);
  sockets.forgeFill = fill;

  // Floor boards inside mouth
  for (let i = 0; i < 8; i += 1) {
    addBlock(
      group,
      `forge.floor-plank.${i}`,
      [0.68, 0.08, 2.95],
      [-2.25 + i * 0.68, DIMS.plinthH + 0.09, 0.2],
      i % 2 === 0 ? materials.woodBenchDark : materials.woodBench,
      [0, 0, 0],
      0.015,
    );
  }

  // Bellows silhouette (right rear of hearth)
  addBlock(
    group,
    'forge.bellows-body',
    [0.55, 0.35, 0.7],
    [1.55, 1.05, -0.15],
    materials.woodBenchDark,
    [0, 0.2, 0],
    0.04,
  );
  addBlock(
    group,
    'forge.bellows-nozzle',
    [0.35, 0.1, 0.1],
    [1.15, 1.05, -0.15],
    materials.ironMid,
    [0, 0, 0],
    0.02,
  );
}

// ─── Anvil + workbench props ─────────────────────────────────────────────────

function addAnvil(parent, materials, x, y, z) {
  const g = new THREE.Group();
  g.name = 'prop.anvil';
  g.position.set(x, y, z);
  // stout base stump
  addBlock(g, 'anvil.stump', [0.55, 0.32, 0.42], [0, 0.16, 0], materials.woodBenchDark, [0, 0, 0], 0.04);
  addBlock(g, 'anvil.stump-cap', [0.6, 0.08, 0.46], [0, 0.34, 0], materials.woodBench, [0, 0, 0], 0.02);
  // legs
  addBlock(g, 'anvil.leg-l', [0.16, 0.28, 0.16], [-0.16, 0.48, 0.08], materials.iron, [0, 0, 0], 0.02);
  addBlock(g, 'anvil.leg-r', [0.16, 0.28, 0.16], [0.16, 0.48, 0.08], materials.iron, [0, 0, 0], 0.02);
  // body
  addBlock(g, 'anvil.body', [0.55, 0.22, 0.3], [0.05, 0.7, 0], materials.anvil, [0, 0, 0], 0.035);
  // face (top working surface)
  addBlock(g, 'anvil.face', [0.78, 0.16, 0.34], [0.08, 0.86, 0], materials.ironMid, [0, 0, 0], 0.03);
  // horn (tapered via stacked boxes)
  addBlock(g, 'anvil.horn.0', [0.28, 0.14, 0.2], [-0.35, 0.82, 0], materials.anvil, [0, 0, 0.08], 0.03);
  addBlock(g, 'anvil.horn.1', [0.22, 0.11, 0.14], [-0.55, 0.8, 0], materials.iron, [0, 0, 0.12], 0.025);
  addBlock(g, 'anvil.horn.2', [0.16, 0.08, 0.1], [-0.7, 0.78, 0], materials.ironMid, [0, 0, 0.16], 0.02);
  // heel / hardy hole end
  addBlock(g, 'anvil.heel', [0.2, 0.18, 0.3], [0.45, 0.78, 0], materials.anvil, [0, 0, 0], 0.03);
  addCylinder(g, 'anvil.hardy-pin', 0.03, 0.03, 0.12, [0.42, 0.96, 0], materials.ironLight, 6);
  // cast iron sheen strip
  addBlock(g, 'anvil.sheen', [0.7, 0.03, 0.28], [0.08, 0.95, 0.02], materials.ironLight, [0, 0, 0], 0.01);
  parent.add(g);
  return g;
}

function addWorkbench(parent, materials, x, y, z) {
  const g = new THREE.Group();
  g.name = 'prop.workbench';
  g.position.set(x, y, z);
  for (const [lx, lz] of [
    [-0.58, -0.24],
    [0.58, -0.24],
    [-0.58, 0.24],
    [0.58, 0.24],
  ]) {
    addBlock(g, `bench.leg.${lx}.${lz}`, [0.13, 0.72, 0.13], [lx, 0.36, lz], materials.woodBenchDark, [0, 0, 0], 0.02);
  }
  addBlock(g, 'bench.stretcher-x', [1.1, 0.08, 0.08], [0, 0.22, 0], materials.woodBench, [0, 0, 0], 0.015);
  addBlock(g, 'bench.top', [1.4, 0.14, 0.65], [0, 0.78, 0], materials.woodBenchLight, [0, 0, 0], 0.03);
  addBlock(g, 'bench.apron-f', [1.3, 0.14, 0.08], [0, 0.66, 0.26], materials.woodBenchDark, [0, 0, 0], 0.02);
  addBlock(g, 'bench.apron-b', [1.3, 0.12, 0.08], [0, 0.66, -0.26], materials.woodBenchDark, [0, 0, 0], 0.02);

  // tongs
  addBlock(g, 'tongs.handle-a', [0.58, 0.04, 0.04], [-0.18, 0.9, 0.08], materials.iron, [0, 0, 0.35], 0.01);
  addBlock(g, 'tongs.handle-b', [0.58, 0.04, 0.04], [-0.12, 0.9, 0.14], materials.iron, [0, 0, 0.2], 0.01);
  addBlock(g, 'tongs.jaw', [0.2, 0.07, 0.12], [0.22, 0.9, 0.1], materials.ironMid, [0, 0, 0], 0.015);
  // horseshoe
  addTorus(g, 'horseshoe', 0.13, 0.035, [0.38, 0.9, -0.1], materials.gold, [Math.PI / 2, 0, 0.4], 14);
  addBlock(g, 'horseshoe.gap', [0.1, 0.08, 0.06], [0.38, 0.9, -0.02], materials.woodBenchLight, [0, 0, 0], 0.015);
  // ring + nail
  addTorus(g, 'bench.ring', 0.08, 0.02, [0.02, 0.88, -0.18], materials.ironLight, [Math.PI / 2, 0, 0], 10);
  addCylinder(g, 'bench.nail', 0.015, 0.015, 0.12, [-0.4, 0.9, -0.12], materials.iron, 5, [1.2, 0, 0]);
  // hammer on bench
  addBlock(g, 'bench.hammer-haft', [0.42, 0.05, 0.05], [-0.35, 0.92, 0.15], materials.woodBenchDark, [0, 0, 0.2], 0.01);
  addBlock(g, 'bench.hammer-head', [0.16, 0.1, 0.1], [-0.12, 0.94, 0.18], materials.ironLight, [0, 0, 0.2], 0.02);

  parent.add(g);
  return g;
}

function addProps(root, materials, nodes) {
  const group = createNode(root, nodes, 'props');
  nodes.anvil = addAnvil(group, materials, 1.2, DIMS.plinthH + 0.08, 0.9);
  nodes.workbench = addWorkbench(group, materials, -1.5, DIMS.plinthH + 0.02, 1.15);

  // wood billets near forge
  addCylinder(group, 'billet.0', 0.09, 0.1, 0.58, [1.75, 0.55, 0.15], materials.woodBench, 8, [0, 0, 1.15]);
  addCylinder(group, 'billet.1', 0.08, 0.09, 0.5, [1.95, 0.52, 0.32], materials.woodBenchDark, 8, [0, 0.25, 1.0]);
  addCylinder(group, 'billet.2', 0.07, 0.08, 0.42, [1.65, 0.48, 0.4], materials.woodBenchLight, 8, [0.15, 0, 0.9]);

  // hanging tools on left front interior
  addBlock(group, 'tool.hammer-haft', [0.055, 0.5, 0.055], [-2.1, 1.75, 1.95], materials.woodBenchDark, [0, 0, 0.35], 0.01);
  addBlock(group, 'tool.hammer-head', [0.24, 0.13, 0.12], [-2.1, 1.98, 1.95], materials.iron, [0, 0, 0.35], 0.02);
  addBlock(group, 'tool.tongs-hang', [0.04, 0.55, 0.04], [-1.95, 1.7, 1.85], materials.ironMid, [0, 0, -0.25], 0.01);

  // quench barrel
  addCylinder(group, 'quench.barrel', 0.28, 0.3, 0.55, [-2.15, 0.55, 0.35], materials.woodBenchDark, 12);
  addCylinder(group, 'quench.hoop.0', 0.31, 0.31, 0.05, [-2.15, 0.4, 0.35], materials.iron, 12);
  addCylinder(group, 'quench.hoop.1', 0.31, 0.31, 0.05, [-2.15, 0.7, 0.35], materials.iron, 12);
  addCylinder(group, 'quench.water', 0.24, 0.24, 0.08, [-2.15, 0.78, 0.35], materials.ironLight, 10);

  // scrap metal pile
  for (let i = 0; i < 5; i += 1) {
    addBlock(
      group,
      `scrap.${i}`,
      [0.18 + seededUnit(i) * 0.15, 0.05, 0.1 + seededUnit(i + 3) * 0.1],
      [2.0 + seededUnit(i + 1) * 0.25, 0.42 + i * 0.04, 1.2 + seededUnit(i + 5) * 0.2],
      i % 2 === 0 ? materials.iron : materials.ironMid,
      [0, seededUnit(i + 7) * 1.5, seededUnit(i + 2) * 0.5],
      0.015,
    );
  }
}

// ─── Roof ────────────────────────────────────────────────────────────────────

function addRoof(root, materials, nodes) {
  const group = createNode(root, nodes, 'roof');
  const roof = createMesh(
    createSolidGableGeometry(DIMS.roofWidth, DIMS.roofDepth, DIMS.roofRise),
    materials.roofDark,
    'roof.structural-solid-gable-prism',
  );
  roof.position.y = DIMS.eaveY - 0.08;
  roof.userData.structuralRoof = true;
  roof.userData.prohibitedConstruction = 'paired-rotated-box-slabs';
  group.add(roof);

  // Curved multi-segment ridge beam (slight sag — matches ref)
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const z = -DIMS.roofDepth / 2 + 0.3 + t * (DIMS.roofDepth - 0.55);
    const droop = Math.sin(t * Math.PI) * 0.16;
    addBlock(
      group,
      `roof.ridge-beam.${i}`,
      [0.62, 0.32, DIMS.roofDepth / 6.2],
      [0, DIMS.eaveY + DIMS.roofRise + 0.12 - droop, z],
      i % 2 === 0 ? materials.timberBlack : materials.timberDark,
      [0, 0, 0],
      0.045,
    );
  }
  // ridge beam end caps
  addBlock(
    group,
    'roof.ridge-end.front',
    [0.72, 0.38, 0.28],
    [0, DIMS.eaveY + DIMS.roofRise + 0.1, DIMS.roofDepth / 2 - 0.05],
    materials.timberBlack,
    [0, 0, 0],
    0.05,
  );
  addBlock(
    group,
    'roof.ridge-end.rear',
    [0.68, 0.34, 0.24],
    [0, DIMS.eaveY + DIMS.roofRise + 0.1, -DIMS.roofDepth / 2 + 0.05],
    materials.timberDark,
    [0, 0, 0],
    0.045,
  );

  // Barge boards
  const angle = Math.atan2(DIMS.roofRise, DIMS.roofWidth / 2);
  const len = Math.hypot(DIMS.roofWidth / 2, DIMS.roofRise);
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `roof.barge.front.${side > 0 ? 'R' : 'L'}`,
      [len, 0.18, 0.16],
      [side * (DIMS.roofWidth / 4), DIMS.eaveY + DIMS.roofRise / 2, DIMS.roofDepth / 2 + 0.04],
      materials.timberBlack,
      [0, 0, side < 0 ? angle : -angle],
      0.028,
    );
    addBlock(
      group,
      `roof.barge.rear.${side > 0 ? 'R' : 'L'}`,
      [len, 0.15, 0.14],
      [side * (DIMS.roofWidth / 4), DIMS.eaveY + DIMS.roofRise / 2, -DIMS.roofDepth / 2 - 0.04],
      materials.timberDark,
      [0, 0, side < 0 ? angle : -angle],
      0.025,
    );
  }

  // Fascia
  addBlock(
    group,
    'roof.fascia-front',
    [DIMS.roofWidth + 0.15, 0.16, 0.14],
    [0, DIMS.eaveY - 0.02, DIMS.roofDepth / 2 + 0.03],
    materials.timberBlack,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-back',
    [DIMS.roofWidth + 0.1, 0.14, 0.12],
    [0, DIMS.eaveY - 0.02, -DIMS.roofDepth / 2 - 0.03],
    materials.timberDark,
    [0, 0, 0],
    0.022,
  );

  // Front gable infill + truss
  const gableInfill = createMesh(
    createGableInfillGeometry(DIMS.width - 0.15, DIMS.roofRise * 0.94, 0.14),
    materials.timberBlack,
    'roof.gable-infill-front',
  );
  gableInfill.position.set(0, DIMS.eaveY - 0.04, DIMS.frontZ - 0.2);
  group.add(gableInfill);

  // Gable X braces + collar
  addBlock(
    group,
    'roof.gable-brace-l',
    [1.55, 0.12, 0.12],
    [-0.6, DIMS.eaveY + 0.8, DIMS.frontZ - 0.1],
    materials.timber,
    [0, 0, 0.58],
    0.02,
  );
  addBlock(
    group,
    'roof.gable-brace-r',
    [1.55, 0.12, 0.12],
    [0.6, DIMS.eaveY + 0.8, DIMS.frontZ - 0.1],
    materials.timber,
    [0, 0, -0.58],
    0.02,
  );
  addBlock(
    group,
    'roof.gable-collar',
    [2.4, 0.14, 0.12],
    [0, DIMS.eaveY + 0.5, DIMS.frontZ - 0.08],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'roof.gable-king',
    [0.14, 1.35, 0.12],
    [0, DIMS.eaveY + 1.0, DIMS.frontZ - 0.08],
    materials.timberWarm,
    [0, 0, 0],
    0.02,
  );

  // Rear gable infill (side view identity)
  const rearInfill = createMesh(
    createGableInfillGeometry(DIMS.width - 0.3, DIMS.roofRise * 0.9, 0.12),
    materials.timberDark,
    'roof.gable-infill-rear',
  );
  rearInfill.position.set(0, DIMS.eaveY - 0.04, -DIMS.depth / 2 + 0.18);
  group.add(rearInfill);

  // Clay tiles — denser volumetric relief (inn-v3 style density)
  const tileGroup = createNode(group, nodes, 'roof-tiles');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 9;
  const columns = 11;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [
    materials.roof,
    materials.roofLight,
    materials.roofDark,
    materials.roofMid,
    materials.roofHot,
  ];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.55);
      const x = side * distanceFromRidge;
      const y =
        DIMS.eaveY - 0.08 + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.1;
      const stagger = row % 2 ? tileDepth * 0.42 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.12;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 5];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.12, 0.11, tileDepth * 1.04],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.024,
        );
      }
    }
  }

  // Ridge caps
  for (let i = 0; i < 13; i += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 13) * (i + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${i}`,
      [0.4, 0.3, DIMS.roofDepth / 12.5],
      [0, DIMS.eaveY + DIMS.roofRise + 0.02, z],
      i % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.04,
      3,
    );
  }

  // Moss patches (identity from refs — right slope near chimney)
  const mossSpots = [
    [1.15, DIMS.eaveY + 0.95, 0.55, 0.6, 0.09, 0.45],
    [0.75, DIMS.eaveY + 1.25, -0.35, 0.42, 0.08, 0.38],
    [1.7, DIMS.eaveY + 0.6, 1.15, 0.5, 0.07, 0.32],
    [-0.95, DIMS.eaveY + 1.05, 0.25, 0.38, 0.08, 0.3],
    [1.35, DIMS.eaveY + 0.78, -1.35, 0.55, 0.09, 0.45],
    [0.45, DIMS.eaveY + 1.45, 1.45, 0.32, 0.07, 0.28],
    [1.55, DIMS.eaveY + 0.55, -0.6, 0.4, 0.08, 0.35],
    [0.95, DIMS.eaveY + 1.1, 1.8, 0.35, 0.07, 0.28],
    [1.2, DIMS.eaveY + 0.85, -1.8, 0.48, 0.08, 0.4],
  ];
  mossSpots.forEach((spot, i) => {
    const [x, y, z, sx, sy, sz] = spot;
    addBlock(
      tileGroup,
      `roof.moss.${i}`,
      [sx, sy, sz],
      [x, y, z],
      i % 3 === 0 ? materials.mossLight : i % 2 === 0 ? materials.moss : materials.mossDark,
      [0, seededUnit(i + 2) * 0.5, 0.35 + seededUnit(i) * 0.2],
      0.04,
    );
  });
}

// ─── Tall brick chimney ──────────────────────────────────────────────────────

function addChimney(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'chimney');
  const cx = 1.65;
  const cz = -0.9;
  const baseY = DIMS.eaveY + 0.2;

  // Tall core (v2: taller stack for silhouette punch)
  addBlock(
    group,
    'chimney.core',
    [0.92, 2.85, 0.82],
    [cx, baseY + 1.4, cz],
    materials.brickMort,
    [0, 0, 0],
    0.035,
  );

  // Brick courses — denser
  const rows = 10;
  const cols = 2;
  for (let row = 0; row < rows; row += 1) {
    const y = baseY + 0.16 + row * 0.27;
    const stagger = row % 2 ? 0.12 : 0;
    for (let col = 0; col < cols; col += 1) {
      const mat = [
        materials.brick,
        materials.brickLight,
        materials.brickDark,
        materials.stoneLight,
        materials.brickWarm,
      ][(row + col) % 5];
      addBlock(
        group,
        `chimney.brick.f.${row}.${col}`,
        [0.4, 0.24, 0.15],
        [cx - 0.22 + col * 0.42 + stagger * 0.12, y, cz + 0.42],
        mat,
        [0, 0, 0],
        0.02,
      );
      addBlock(
        group,
        `chimney.brick.b.${row}.${col}`,
        [0.4, 0.24, 0.15],
        [cx - 0.22 + col * 0.42, y, cz - 0.42],
        mat,
        [0, 0, 0],
        0.02,
      );
    }
    for (const side of [-1, 1]) {
      addBlock(
        group,
        `chimney.brick.s.${row}.${side > 0 ? 'R' : 'L'}`,
        [0.15, 0.24, 0.36],
        [cx + side * 0.46, y, cz + (row % 2 ? 0.08 : -0.08)],
        [materials.brickDark, materials.brick, materials.brickLight][row % 3],
        [0, 0, 0],
        0.02,
      );
    }
  }

  // Shoulder flare at roof penetration
  addBlock(
    group,
    'chimney.shoulder',
    [1.15, 0.32, 1.05],
    [cx, baseY + 0.02, cz],
    materials.brickDark,
    [0, 0, 0],
    0.045,
  );
  addBlock(
    group,
    'chimney.flashing',
    [1.25, 0.1, 1.15],
    [cx, baseY - 0.05, cz],
    materials.ironMid,
    [0, 0, 0],
    0.02,
  );

  // Cap course
  addBlock(
    group,
    'chimney.cap',
    [1.08, 0.2, 0.98],
    [cx, baseY + 2.85, cz],
    materials.brickLight,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'chimney.cap-lip',
    [1.18, 0.08, 1.08],
    [cx, baseY + 2.98, cz],
    materials.brickWarm,
    [0, 0, 0],
    0.02,
  );

  // Terracotta pot
  addCylinder(group, 'chimney.pot-body', 0.34, 0.4, 0.48, [cx, baseY + 3.28, cz], materials.pot, 14);
  addCylinder(group, 'chimney.pot-rim', 0.42, 0.38, 0.12, [cx, baseY + 3.56, cz], materials.potDark, 14);
  addCylinder(group, 'chimney.pot-lip', 0.45, 0.45, 0.07, [cx, baseY + 3.65, cz], materials.potLight, 14);
  addCylinder(group, 'chimney.pot-inner', 0.28, 0.28, 0.15, [cx, baseY + 3.55, cz], materials.interior, 10);

  // Smoke plumes
  const smokeY = baseY + 3.85;
  addSphere(group, 'smoke.0', 0.4, [cx + 0.05, smokeY + 0.2, cz], materials.smoke, 10, [1, 1.15, 1]);
  addSphere(group, 'smoke.1', 0.52, [cx + 0.18, smokeY + 0.7, cz + 0.05], materials.smokeLight, 10, [1.1, 1.2, 1]);
  addSphere(group, 'smoke.2', 0.45, [cx - 0.05, smokeY + 1.15, cz + 0.12], materials.smoke, 10, [1, 1.1, 1]);
  addSphere(group, 'smoke.3', 0.36, [cx + 0.22, smokeY + 1.55, cz - 0.05], materials.smokeLight, 8, [1.15, 1, 1]);
  addSphere(group, 'smoke.4', 0.28, [cx + 0.4, smokeY + 1.9, cz + 0.1], materials.smokeDark, 8);
  addSphere(group, 'smoke.5', 0.2, [cx + 0.55, smokeY + 2.2, cz], materials.smokeLight, 6);
  addSphere(group, 'smoke.6', 0.14, [cx + 0.7, smokeY + 2.45, cz + 0.05], materials.smoke, 6);

  const socket = new THREE.Object3D();
  socket.name = 'socket.chimney-smoke';
  socket.position.set(cx, smokeY + 2.6, cz);
  group.add(socket);
  sockets.chimneySmoke = socket;
  sockets.smoke = group;
}

// ─── Hanging FORGE sign ──────────────────────────────────────────────────────

function addSign(root, materials, nodes, sockets) {
  const rig = createNode(root, nodes, 'sign-rig');
  const armZ = DIMS.frontZ + 0.08;
  const armY = 2.85;
  const armX = -DIMS.width / 2 + 0.12;

  addBlock(rig, 'sign.wall-plate', [0.18, 0.45, 0.32], [armX, armY, armZ - 0.18], materials.iron, [0, 0, 0], 0.02);
  addBlock(rig, 'sign.arm', [1.5, 0.11, 0.11], [armX - 0.62, armY + 0.05, armZ + 0.06], materials.iron, [0, 0, 0], 0.02);
  addBlock(rig, 'sign.arm-brace', [0.7, 0.07, 0.07], [armX - 0.25, armY - 0.15, armZ + 0.04], materials.ironMid, [0, 0, 0.45], 0.015);
  addCylinder(
    rig,
    'sign.arm-finial',
    0.09,
    0.09,
    0.18,
    [armX - 1.35, armY + 0.05, armZ + 0.06],
    materials.ironLight,
    8,
    [0, 0, Math.PI / 2],
  );
  // hang links
  for (const [dx, label] of [
    [-1.1, '0'],
    [-0.55, '1'],
  ]) {
    addCylinder(rig, `sign.link.${label}`, 0.032, 0.032, 0.24, [armX + dx, armY - 0.14, armZ + 0.06], materials.ironMid, 6);
    addTorus(
      rig,
      `sign.ring.${label}`,
      0.05,
      0.015,
      [armX + dx, armY - 0.28, armZ + 0.06],
      materials.ironLight,
      [Math.PI / 2, 0, 0],
      8,
    );
  }

  const pivot = new THREE.Group();
  pivot.name = 'pivot.forge-sign';
  pivot.position.set(armX - 0.82, armY - 0.62, armZ + 0.1);
  rig.add(pivot);
  nodes.signPivot = pivot;
  sockets.signSwing = pivot;

  // Board
  addBlock(pivot, 'sign.board', [1.05, 1.25, 0.12], [0, 0, 0], materials.signRed, [0, 0, 0], 0.035);
  addBlock(pivot, 'sign.border', [1.16, 1.36, 0.07], [0, 0, -0.04], materials.timberBlack, [0, 0, 0], 0.028);
  addBlock(pivot, 'sign.face-inset', [0.92, 1.1, 0.04], [0, 0.02, 0.06], materials.signRedLight, [0, 0, 0], 0.02);

  // Cream name plate
  addBlock(pivot, 'sign.name-plate', [0.85, 0.32, 0.05], [0, -0.4, 0.08], materials.cream, [0, 0, 0], 0.015);
  addBlock(pivot, 'sign.name-plate-edge', [0.9, 0.36, 0.03], [0, -0.4, 0.05], materials.creamDark, [0, 0, 0], 0.012);

  // FORGE letters (block glyphs)
  const letterY = -0.4;
  const letterZ = 0.12;
  // F
  addBlock(pivot, 'sign.L.F.v', [0.055, 0.2, 0.035], [-0.32, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.F.h1', [0.12, 0.045, 0.035], [-0.25, letterY + 0.08, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.F.h2', [0.1, 0.04, 0.035], [-0.26, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  // O
  addTorus(pivot, 'sign.L.O', 0.075, 0.028, [-0.1, letterY, letterZ], materials.signRedDark, [0, 0, 0], 12);
  // R
  addBlock(pivot, 'sign.L.R.v', [0.055, 0.2, 0.035], [0.08, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.R.h', [0.1, 0.045, 0.035], [0.15, letterY + 0.08, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.R.leg', [0.1, 0.04, 0.035], [0.15, letterY - 0.05, letterZ], materials.signRedDark, [0, 0, 0.55], 0.008);
  // G
  addTorus(pivot, 'sign.L.G', 0.075, 0.028, [0.3, letterY, letterZ], materials.signRedDark, [0, 0, 0], 12);
  addBlock(pivot, 'sign.L.G.bar', [0.07, 0.04, 0.035], [0.35, letterY - 0.02, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  // E
  addBlock(pivot, 'sign.L.E.v', [0.055, 0.2, 0.035], [0.46, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.E.h1', [0.11, 0.04, 0.035], [0.54, letterY + 0.08, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.E.h2', [0.09, 0.04, 0.035], [0.53, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.E.h3', [0.11, 0.04, 0.035], [0.54, letterY - 0.08, letterZ], materials.signRedDark, [0, 0, 0], 0.008);

  // Horseshoe + hammer icon (bolder than v1)
  addTorus(pivot, 'sign.horseshoe', 0.26, 0.055, [0, 0.28, 0.1], materials.gold, [0, 0, 0], 16);
  addTorus(pivot, 'sign.horseshoe-inner', 0.18, 0.02, [0, 0.28, 0.11], materials.goldDark, [0, 0, 0], 12);
  // open bottom gap
  addBlock(pivot, 'sign.horseshoe-gap', [0.22, 0.14, 0.08], [0, 0.05, 0.11], materials.signRedLight, [0, 0, 0], 0.02);
  // hammer across horseshoe
  addBlock(pivot, 'sign.hammer-haft', [0.08, 0.48, 0.08], [0, 0.22, 0.14], materials.timberWarm, [0, 0, 0.45], 0.015);
  addBlock(pivot, 'sign.hammer-head', [0.32, 0.16, 0.16], [0.06, 0.4, 0.14], materials.ironLight, [0, 0, 0.45], 0.025);
  addBlock(pivot, 'sign.hammer-face', [0.08, 0.14, 0.14], [0.2, 0.42, 0.14], materials.ironMid, [0, 0, 0.45], 0.02);

  // gold corner studs
  for (const [sx, sy] of [
    [-0.42, 0.52],
    [0.42, 0.52],
    [-0.42, -0.12],
    [0.42, -0.12],
    [-0.42, -0.55],
    [0.42, -0.55],
  ]) {
    addSphere(pivot, `sign.stud.${sx}.${sy}`, 0.04, [sx, sy, 0.1], materials.goldLight, 6);
  }
}

// ─── Runtime metadata ────────────────────────────────────────────────────────

function collectMeshes(group) {
  const result = [];
  group?.traverse((object) => {
    if (object.isMesh || object.isInstancedMesh) result.push(object);
  });
  return result;
}

function addRuntimeMetadata(root, nodes, sockets) {
  const meshes = {};
  root.traverse((object) => {
    if (object.isMesh || object.isInstancedMesh) {
      meshes[object.name || object.uuid] = object;
    }
  });

  root.userData.sculptRuntime = {
    coordinateFrame: {
      front: '+Z',
      up: '+Y',
      right: '+X',
      soleY: 0,
    },
    nodes,
    meshes,
    sockets,
    colliders: {
      sole: {
        type: 'box',
        center: [0, 0.15, 0],
        size: [DIMS.width + 0.8, 0.3, DIMS.depth + 0.6],
        isTrigger: false,
      },
      shell: {
        type: 'box',
        center: [0, DIMS.wallTop / 2, 0],
        size: [DIMS.width, DIMS.wallTop, DIMS.depth],
        isTrigger: false,
      },
      roof: {
        type: 'closed-gable-prism',
        center: [0, DIMS.eaveY + DIMS.roofRise / 2, 0],
        size: [DIMS.roofWidth, DIMS.roofRise, DIMS.roofDepth],
        isTrigger: false,
      },
      forgeBay: {
        type: 'box',
        center: [0, 1.5, 0.8],
        size: [4.8, 2.4, 2.2],
        isTrigger: true,
      },
      chimney: {
        type: 'box',
        center: [1.65, DIMS.eaveY + 1.8, -0.9],
        size: [1.3, 3.8, 1.2],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [-3.6, 2.2, 2.7],
        size: [1.8, 2.0, 1.2],
        isTrigger: true,
      },
    },
    destructionGroups: {
      frame: collectMeshes(nodes['timber-frame']),
      foundation: collectMeshes(nodes.foundation),
      walls: collectMeshes(nodes.walls),
      roof: collectMeshes(nodes.roof),
      chimney: collectMeshes(nodes.chimney),
      forge: collectMeshes(nodes['forge-bay']),
      props: collectMeshes(nodes.props),
      sign: collectMeshes(nodes['sign-rig']),
    },
    animation: {
      hangingSign: {
        node: sockets.signSwing,
        axis: [0, 0, 1],
        range: [-0.12, 0.12],
      },
      forgeGlow: {
        light: sockets.forgeLight,
        intensityRange: [2.4, 3.6],
      },
    },
    soleY: 0,
    sources: [
      'public/content/buildings/smithy/ref_main.png',
      'public/content/buildings/smithy/ref_front.png',
      'public/content/buildings/smithy/ref_side.png',
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
    approximation: 'clean stylized multi-view procedural game-prop reconstruction',
    prohibitedTechniques: [
      'photo-billboard',
      'projected-reference-photo',
      'paired-rotated-box-roof-slabs',
    ],
    identity: [
      'dark-timber-open-forge',
      'emissive-firebox',
      'solid-gable-prism-roof',
      'tall-brick-chimney',
      'forge-horseshoe-hammer-sign',
      'anvil',
    ],
  };
}

/**
 * Procedural Smithy / Blacksmith v2 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism roof (ridge along depth)
 * - dark timber open forge, tall brick chimney, FORGE sign, anvil
 * - gen = img2threejs-smithy-v2 · name = hero.shop.smithy.v2
 */
export function createSmithyModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.shop.smithy.v2';
  root.userData.assetId = 'img2threejs-smithy-v2';
  root.userData.gen = 'img2threejs-smithy-v2';
  root.userData.heroVersion = 'img2threejs-smithy-v2';
  root.userData.generator = 'img2threejs-forge-authored-v2';
  root.userData.facadeNormal = '+Z';
  root.userData.soleY = 0;
  root.userData.referenceViews = ['three-quarter-front', 'straight-front', 'right-side'];
  root.userData.approximation = 'stylized multi-view procedural reconstruction';
  root.userData.usesPhotoBillboard = false;
  root.userData.heroMode = 'agent-gen';

  const materials = createMaterials();
  const nodes = { root };
  const sockets = {};

  addFoundation(root, materials, nodes);
  addShell(root, materials, nodes);
  addWalls(root, materials, nodes);
  addForgeBay(root, materials, nodes, sockets);
  addProps(root, materials, nodes);
  addRoof(root, materials, nodes);
  addChimney(root, materials, nodes, sockets);
  addSign(root, materials, nodes, sockets);

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

export const createSmithyHero = createSmithyModel;
export default createSmithyModel;
