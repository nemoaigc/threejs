/**
 * Procedural Blacksmith / Smithy — img2threejs-smithy-v1
 *
 * Identity (from ref_main / ref_front / ref_side):
 * - near-black dark timber posts with stone feet
 * - open two-bay forge mouth, warm interior glow
 * - solid single-prism red clay tile roof (NO paired rotated boxes)
 * - brick chimney + terracotta pot + smoke
 * - hanging FORGE sign (horseshoe + hammer)
 * - anvil, workbench, tongs, horseshoe props
 * - sole y=0 · facade +Z · gen=img2threejs-smithy-v1
 *
 * Quality bar: guild-v2 / temple-v2 / inn-v3
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PALETTE = Object.freeze({
  timberBlack: 0x1a1410,
  timberDark: 0x241c16,
  timber: 0x2e241c,
  timberWarm: 0x3a2c20,
  timberGrain: 0x4a3728,
  stoneDark: 0x4a4640,
  stone: 0x6a655c,
  stoneLight: 0x8a8478,
  stoneFoot: 0x555048,
  roofDark: 0x8a2e1c,
  roof: 0xb03a24,
  roofLight: 0xc84a30,
  roofMid: 0xa83422,
  brickDark: 0x6a3428,
  brick: 0x8c4534,
  brickLight: 0xa85a42,
  brickMort: 0x5a4038,
  pot: 0xc45a2e,
  potDark: 0x9a4220,
  iron: 0x1c1c1c,
  ironMid: 0x2a2a2a,
  ironLight: 0x3a3a38,
  anvil: 0x181818,
  gold: 0xd4a020,
  goldLight: 0xefc040,
  signRed: 0x6a1810,
  signRedDark: 0x4a1008,
  cream: 0xe8d8b8,
  creamDark: 0xc8b090,
  moss: 0x3a6a28,
  mossLight: 0x4a8a34,
  mossDark: 0x2a4a1c,
  smoke: 0x8a8a90,
  smokeLight: 0xa8a8b0,
  forgeGlow: 0xff6a18,
  forgeCore: 0xffa030,
  fireBrick: 0xe89040,
  fireBrickHot: 0xffc060,
  interior: 0x0e0a08,
  plank: 0x1e1812,
  plankLight: 0x2a2218,
  woodBench: 0x4a3424,
  woodBenchDark: 0x352418,
});

const DIMS = Object.freeze({
  width: 5.6,
  depth: 5.0,
  wallTop: 3.05,
  eaveY: 3.05,
  roofWidth: 6.4,
  roofDepth: 5.7,
  roofRise: 1.85,
  plinthH: 0.28,
  frontZ: 2.5,
  postFoot: 0.55,
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
    timberBlack: standard(PALETTE.timberBlack, 0.86),
    timberDark: standard(PALETTE.timberDark, 0.84),
    timber: standard(PALETTE.timber, 0.8),
    timberWarm: standard(PALETTE.timberWarm, 0.76),
    timberGrain: standard(PALETTE.timberGrain, 0.74),
    stoneDark: standard(PALETTE.stoneDark, 0.94),
    stone: standard(PALETTE.stone, 0.9),
    stoneLight: standard(PALETTE.stoneLight, 0.86),
    stoneFoot: standard(PALETTE.stoneFoot, 0.92),
    roofDark: standard(PALETTE.roofDark, 0.88),
    roof: standard(PALETTE.roof, 0.82),
    roofLight: standard(PALETTE.roofLight, 0.78),
    roofMid: standard(PALETTE.roofMid, 0.84),
    brickDark: standard(PALETTE.brickDark, 0.94),
    brick: standard(PALETTE.brick, 0.9),
    brickLight: standard(PALETTE.brickLight, 0.86),
    brickMort: standard(PALETTE.brickMort, 0.96),
    pot: standard(PALETTE.pot, 0.72),
    potDark: standard(PALETTE.potDark, 0.78),
    iron: standard(PALETTE.iron, 0.48, 0.72),
    ironMid: standard(PALETTE.ironMid, 0.42, 0.7),
    ironLight: standard(PALETTE.ironLight, 0.36, 0.68),
    anvil: standard(PALETTE.anvil, 0.4, 0.78),
    gold: standard(PALETTE.gold, 0.34, 0.7),
    goldLight: standard(PALETTE.goldLight, 0.28, 0.72),
    signRed: standard(PALETTE.signRed, 0.62),
    signRedDark: standard(PALETTE.signRedDark, 0.7),
    cream: standard(PALETTE.cream, 0.88),
    creamDark: standard(PALETTE.creamDark, 0.9),
    moss: standard(PALETTE.moss, 0.95),
    mossLight: standard(PALETTE.mossLight, 0.92),
    mossDark: standard(PALETTE.mossDark, 0.96),
    smoke: standard(PALETTE.smoke, 1, 0, { transparent: true, opacity: 0.72, depthWrite: false }),
    smokeLight: standard(PALETTE.smokeLight, 1, 0, {
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
    forgeGlow: standard(PALETTE.forgeGlow, 0.35, 0, {
      emissive: PALETTE.forgeGlow,
      emissiveIntensity: 1.35,
    }),
    forgeCore: standard(PALETTE.forgeCore, 0.28, 0, {
      emissive: PALETTE.forgeCore,
      emissiveIntensity: 1.8,
    }),
    fireBrick: standard(PALETTE.fireBrick, 0.55, 0, {
      emissive: PALETTE.fireBrick,
      emissiveIntensity: 0.55,
    }),
    fireBrickHot: standard(PALETTE.fireBrickHot, 0.4, 0, {
      emissive: PALETTE.fireBrickHot,
      emissiveIntensity: 0.95,
    }),
    interior: standard(PALETTE.interior, 1),
    plank: standard(PALETTE.plank, 0.88),
    plankLight: standard(PALETTE.plankLight, 0.84),
    woodBench: standard(PALETTE.woodBench, 0.78),
    woodBenchDark: standard(PALETTE.woodBenchDark, 0.82),
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

function addSphere(parent, name, radius, position, material, segments = 12) {
  const result = createMesh(
    new THREE.SphereGeometry(radius, segments, Math.max(6, Math.floor(segments * 0.66))),
    material,
    name,
  );
  result.position.set(...position);
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
) {
  const result = createMesh(
    new THREE.TorusGeometry(radius, tube, 7, tubularSegments),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
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

// ─── Foundation / plinth ─────────────────────────────────────────────────────

function addFoundation(root, materials, nodes) {
  const group = createNode(root, nodes, 'foundation');
  addBlock(
    group,
    'foundation.plinth',
    [DIMS.width + 0.55, DIMS.plinthH, DIMS.depth + 0.45],
    [0, DIMS.plinthH / 2, 0],
    materials.stoneDark,
    [0, 0, 0],
    0.05,
  );
  for (let i = 0; i < 7; i += 1) {
    addBlock(
      group,
      `foundation.front-course.${i}`,
      [0.88, 0.22, 0.18],
      [-2.55 + i * 0.9, 0.14, DIMS.frontZ + 0.12],
      [materials.stoneDark, materials.stone, materials.stoneLight][i % 3],
      [0, 0, 0],
      0.03,
    );
  }
  for (let i = 0; i < 5; i += 1) {
    addBlock(
      group,
      `foundation.side-course.${i}`,
      [0.16, 0.2, 0.92],
      [DIMS.width / 2 + 0.18, 0.13, -1.9 + i * 0.95],
      [materials.stone, materials.stoneLight, materials.stoneDark][i % 3],
      [0, 0, 0],
      0.028,
    );
  }
}

// ─── Timber frame shell ──────────────────────────────────────────────────────

function addPost(parent, name, x, z, materials, height = DIMS.wallTop - 0.15) {
  const footH = 0.42;
  addBlock(
    parent,
    `${name}.foot`,
    [0.52, footH, 0.52],
    [x, DIMS.plinthH + footH / 2, z],
    materials.stoneFoot,
    [0, 0, 0],
    0.05,
  );
  addBlock(
    parent,
    `${name}.shaft`,
    [0.34, height - footH, 0.34],
    [x, DIMS.plinthH + footH + (height - footH) / 2, z],
    materials.timberBlack,
    [0, 0, 0],
    0.04,
  );
  // grain highlight strip
  addBlock(
    parent,
    `${name}.grain`,
    [0.06, height - footH - 0.2, 0.36],
    [x + 0.16, DIMS.plinthH + footH + (height - footH) / 2, z],
    materials.timber,
    [0, 0, 0],
    0.015,
  );
  addBlock(
    parent,
    `${name}.capital`,
    [0.42, 0.16, 0.42],
    [x, DIMS.plinthH + height - 0.05, z],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
}

function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'timber-frame');
  const fz = DIMS.frontZ - 0.08;
  const bz = -DIMS.depth / 2 + 0.18;
  const lx = -DIMS.width / 2 + 0.22;
  const rx = DIMS.width / 2 - 0.22;

  // Four main corner posts + mid posts for two-bay open front
  const posts = [
    ['post.fl', lx, fz],
    ['post.fr', rx, fz],
    ['post.bl', lx, bz],
    ['post.br', rx, bz],
    ['post.fm', 0, fz],
    ['post.bm', 0, bz],
  ];
  for (const [name, x, z] of posts) {
    addPost(group, name, x, z, materials);
  }

  // Side mid posts
  addPost(group, 'post.lm', lx, 0, materials);
  addPost(group, 'post.rm', rx, 0, materials);

  // Front lintel / header beam across open mouth
  addBlock(
    group,
    'frame.front-lintel',
    [DIMS.width - 0.15, 0.28, 0.32],
    [0, DIMS.wallTop - 0.05, fz],
    materials.timberBlack,
    [0, 0, 0],
    0.04,
  );
  addBlock(
    group,
    'frame.front-lintel-mid',
    [DIMS.width - 0.4, 0.18, 0.22],
    [0, DIMS.wallTop - 0.32, fz + 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );

  // Front plate / top gable plate
  addBlock(
    group,
    'frame.front-plate',
    [DIMS.width + 0.1, 0.22, 0.28],
    [0, DIMS.wallTop + 0.12, fz - 0.05],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );

  // Rear plate
  addBlock(
    group,
    'frame.rear-plate',
    [DIMS.width - 0.1, 0.22, 0.28],
    [0, DIMS.wallTop + 0.1, bz],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );

  // Side plates
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `frame.side-plate.${side > 0 ? 'R' : 'L'}`,
      [0.28, 0.2, DIMS.depth - 0.35],
      [side * (DIMS.width / 2 - 0.2), DIMS.wallTop + 0.08, 0],
      materials.timberDark,
      [0, 0, 0],
      0.03,
    );
  }

  // Front lower knee / sill
  addBlock(
    group,
    'frame.front-sill',
    [DIMS.width - 0.3, 0.22, 0.28],
    [0, DIMS.plinthH + 0.55, fz],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  // Front mid rail across bays
  addBlock(
    group,
    'frame.front-mid-rail',
    [DIMS.width - 0.5, 0.14, 0.2],
    [0, 1.55, fz + 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Diagonal braces on front posts
  for (const side of [-1, 1]) {
    const px = side * (DIMS.width / 2 - 0.22);
    addBlock(
      group,
      `frame.brace.front.${side > 0 ? 'R' : 'L'}`,
      [0.9, 0.12, 0.14],
      [px - side * 0.4, 2.55, fz + 0.04],
      materials.timber,
      [0, 0, side * 0.55],
      0.02,
    );
  }

  // Interior dark core (set back so open mouth reads)
  addBlock(
    group,
    'shell.interior-core',
    [DIMS.width - 0.7, DIMS.wallTop - 0.5, DIMS.depth - 0.85],
    [0, DIMS.plinthH + (DIMS.wallTop - 0.5) / 2 + 0.15, -0.15],
    materials.interior,
    [0, 0, 0],
    0.04,
  );
}

// ─── Rear + side walls (planks / masonry) ────────────────────────────────────

function addWalls(root, materials, nodes) {
  const group = createNode(root, nodes, 'walls');
  const bz = -DIMS.depth / 2 + 0.22;
  const plankW = 0.55;
  const plankCount = 9;
  const wallH = DIMS.wallTop - 0.35;
  const wallY = DIMS.plinthH + wallH / 2 + 0.08;

  // Rear vertical planks
  for (let i = 0; i < plankCount; i += 1) {
    const x = -DIMS.width / 2 + 0.45 + i * plankW;
    addBlock(
      group,
      `wall.rear-plank.${i}`,
      [plankW * 0.9, wallH, 0.1],
      [x, wallY, bz],
      i % 3 === 0 ? materials.plankLight : materials.plank,
      [0, 0, 0],
      0.02,
    );
  }

  // Rear lower skirt
  addBlock(
    group,
    'wall.rear-skirt',
    [DIMS.width - 0.5, 0.55, 0.14],
    [0, DIMS.plinthH + 0.35, bz + 0.04],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  // Rear mid rail
  addBlock(
    group,
    'wall.rear-mid-rail',
    [DIMS.width - 0.6, 0.14, 0.12],
    [0, 1.55, bz + 0.05],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );
  // Rear top rail
  addBlock(
    group,
    'wall.rear-top-rail',
    [DIMS.width - 0.4, 0.16, 0.12],
    [0, DIMS.wallTop - 0.2, bz + 0.05],
    materials.timberBlack,
    [0, 0, 0],
    0.02,
  );

  // Left side (closed-ish planks, open workshop character is front)
  const lx = -DIMS.width / 2 + 0.18;
  for (let i = 0; i < 6; i += 1) {
    addBlock(
      group,
      `wall.left-plank.${i}`,
      [0.1, wallH * 0.95, 0.7],
      [lx, wallY, -1.7 + i * 0.72],
      i % 2 === 0 ? materials.plank : materials.plankLight,
      [0, 0, 0],
      0.02,
    );
  }
  addBlock(
    group,
    'wall.left-top-rail',
    [0.12, 0.14, DIMS.depth - 0.5],
    [lx + 0.02, DIMS.wallTop - 0.18, 0],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'wall.left-mid-rail',
    [0.12, 0.12, DIMS.depth - 0.6],
    [lx + 0.02, 1.5, 0],
    materials.timber,
    [0, 0, 0],
    0.02,
  );

  // Right side: mixed timber + masonry stack toward chimney
  const rx = DIMS.width / 2 - 0.18;
  for (let i = 0; i < 4; i += 1) {
    addBlock(
      group,
      `wall.right-plank.${i}`,
      [0.1, wallH * 0.9, 0.72],
      [rx, wallY, -1.85 + i * 0.72],
      materials.plank,
      [0, 0, 0],
      0.02,
    );
  }

  // Masonry stack on right rear (chimney base wall)
  const brickRows = 8;
  const brickCols = 3;
  for (let row = 0; row < brickRows; row += 1) {
    const stagger = row % 2 ? 0.18 : 0;
    for (let col = 0; col < brickCols; col += 1) {
      const mat =
        [materials.brick, materials.brickLight, materials.brickDark, materials.stoneLight][
          (row + col) % 4
        ];
      addBlock(
        group,
        `wall.right-masonry.${row}.${col}`,
        [0.22, 0.28, 0.42],
        [rx + 0.08, DIMS.plinthH + 0.2 + row * 0.3, 0.55 + col * 0.45 + stagger * 0.2],
        mat,
        [0, 0, 0],
        0.025,
      );
    }
  }
}

// ─── Open forge bay + glow ───────────────────────────────────────────────────

function addForgeBay(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'forge-bay');
  const fz = DIMS.frontZ - 0.15;

  // Back firebox wall (glowing bricks)
  const brickCols = 6;
  const brickRows = 5;
  for (let row = 0; row < brickRows; row += 1) {
    for (let col = 0; col < brickCols; col += 1) {
      const hot = row < 2 && col > 1 && col < 5;
      addBlock(
        group,
        `forge.firebrick.${row}.${col}`,
        [0.42, 0.32, 0.1],
        [-1.1 + col * 0.44, 0.95 + row * 0.34, -0.55],
        hot ? materials.fireBrickHot : materials.fireBrick,
        [0, 0, 0],
        0.02,
      );
    }
  }

  // Hearth slab
  addBlock(
    group,
    'forge.hearth-slab',
    [2.4, 0.18, 1.6],
    [0.15, 0.72, 0.35],
    materials.ironMid,
    [0, 0, 0],
    0.03,
  );
  // Hot coal bed
  addBlock(
    group,
    'forge.coal-bed',
    [0.95, 0.14, 0.7],
    [-0.35, 0.88, 0.2],
    materials.forgeCore,
    [0, 0, 0],
    0.04,
  );
  addSphere(group, 'forge.ember.0', 0.12, [-0.2, 0.98, 0.15], materials.forgeGlow, 8);
  addSphere(group, 'forge.ember.1', 0.09, [-0.45, 0.96, 0.28], materials.forgeCore, 8);
  addSphere(group, 'forge.ember.2', 0.07, [-0.15, 0.97, 0.35], materials.forgeGlow, 8);

  // Left + right recess frames (open mouth reading)
  addBlock(
    group,
    'forge.left-reveal',
    [0.18, 1.9, 0.8],
    [-2.15, 1.55, fz - 0.4],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'forge.right-reveal',
    [0.18, 1.9, 0.8],
    [2.15, 1.55, fz - 0.4],
    materials.timberBlack,
    [0, 0, 0],
    0.03,
  );

  // Ambient bay glow planes (emissive cards set inside mouth)
  addBlock(
    group,
    'forge.bay-glow-left',
    [1.6, 1.35, 0.06],
    [-0.85, 1.55, 0.85],
    materials.forgeGlow,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'forge.bay-glow-right',
    [1.5, 1.25, 0.06],
    [0.95, 1.5, 0.75],
    materials.fireBrick,
    [0, 0, 0],
    0.02,
  );

  // Sparks (tiny emissive spheres)
  for (let i = 0; i < 14; i += 1) {
    const t = seededUnit(i * 17 + 3);
    const u = seededUnit(i * 31 + 9);
    const v = seededUnit(i * 47 + 5);
    addSphere(
      group,
      `forge.spark.${i}`,
      0.025 + t * 0.03,
      [-0.5 + u * 0.9, 1.0 + v * 1.1, 0.4 + t * 0.5],
      materials.forgeCore,
      5,
    );
  }

  // Point light for forge warmth
  const light = new THREE.PointLight(0xff6a20, 2.4, 8, 1.6);
  light.name = 'forge.point-light';
  light.position.set(-0.2, 1.15, 0.4);
  light.castShadow = false;
  group.add(light);
  sockets.forgeLight = light;

  // Floor boards inside
  for (let i = 0; i < 7; i += 1) {
    addBlock(
      group,
      `forge.floor-plank.${i}`,
      [0.7, 0.08, 2.8],
      [-2.1 + i * 0.72, DIMS.plinthH + 0.08, 0.15],
      i % 2 === 0 ? materials.woodBenchDark : materials.woodBench,
      [0, 0, 0],
      0.015,
    );
  }
}

// ─── Anvil + workbench props ─────────────────────────────────────────────────

function addAnvil(parent, materials, x, y, z) {
  const g = new THREE.Group();
  g.name = 'prop.anvil';
  g.position.set(x, y, z);
  addBlock(g, 'anvil.base', [0.55, 0.28, 0.38], [0, 0.14, 0], materials.anvil, [0, 0, 0], 0.04);
  addBlock(g, 'anvil.leg-l', [0.14, 0.32, 0.14], [-0.16, 0.16, 0.1], materials.iron, [0, 0, 0], 0.02);
  addBlock(g, 'anvil.leg-r', [0.14, 0.32, 0.14], [0.16, 0.16, 0.1], materials.iron, [0, 0, 0], 0.02);
  addBlock(g, 'anvil.horn', [0.55, 0.18, 0.22], [-0.12, 0.42, 0], materials.anvil, [0, 0, 0.12], 0.04);
  addBlock(g, 'anvil.face', [0.72, 0.2, 0.32], [0.08, 0.48, 0], materials.ironMid, [0, 0, 0], 0.035);
  addBlock(g, 'anvil.heel', [0.18, 0.16, 0.28], [0.4, 0.42, 0], materials.anvil, [0, 0, 0], 0.03);
  parent.add(g);
  return g;
}

function addWorkbench(parent, materials, x, y, z) {
  const g = new THREE.Group();
  g.name = 'prop.workbench';
  g.position.set(x, y, z);
  // legs
  for (const [lx, lz] of [
    [-0.55, -0.22],
    [0.55, -0.22],
    [-0.55, 0.22],
    [0.55, 0.22],
  ]) {
    addBlock(g, `bench.leg.${lx}.${lz}`, [0.12, 0.7, 0.12], [lx, 0.35, lz], materials.woodBenchDark, [0, 0, 0], 0.02);
  }
  addBlock(g, 'bench.top', [1.35, 0.12, 0.6], [0, 0.74, 0], materials.woodBench, [0, 0, 0], 0.03);
  addBlock(g, 'bench.apron', [1.25, 0.14, 0.08], [0, 0.62, 0.22], materials.woodBenchDark, [0, 0, 0], 0.02);

  // tongs
  addBlock(g, 'tongs.handle-a', [0.55, 0.04, 0.04], [-0.15, 0.84, 0.08], materials.iron, [0, 0, 0.35], 0.01);
  addBlock(g, 'tongs.handle-b', [0.55, 0.04, 0.04], [-0.1, 0.84, 0.14], materials.iron, [0, 0, 0.2], 0.01);
  addBlock(g, 'tongs.jaw', [0.18, 0.06, 0.1], [0.2, 0.84, 0.1], materials.ironMid, [0, 0, 0], 0.015);

  // horseshoe
  addTorus(g, 'horseshoe', 0.12, 0.035, [0.35, 0.84, -0.08], materials.gold, [Math.PI / 2, 0, 0.4], 12);
  // small ring
  addTorus(g, 'bench.ring', 0.08, 0.02, [0.05, 0.82, -0.15], materials.ironLight, [Math.PI / 2, 0, 0], 10);

  parent.add(g);
  return g;
}

function addProps(root, materials, nodes) {
  const group = createNode(root, nodes, 'props');
  nodes.anvil = addAnvil(group, materials, 1.15, DIMS.plinthH + 0.08, 0.85);
  nodes.workbench = addWorkbench(group, materials, -1.45, DIMS.plinthH + 0.02, 1.05);

  // wood billets near forge
  addCylinder(group, 'billet.0', 0.08, 0.09, 0.55, [1.7, 0.55, 0.2], materials.woodBench, 8, [0, 0, 1.2]);
  addCylinder(group, 'billet.1', 0.07, 0.08, 0.48, [1.85, 0.52, 0.35], materials.woodBenchDark, 8, [0, 0.2, 1.0]);

  // hanging tools on left post interior
  addBlock(group, 'tool.hammer-haft', [0.05, 0.45, 0.05], [-2.0, 1.7, 1.9], materials.woodBenchDark, [0, 0, 0.3], 0.01);
  addBlock(group, 'tool.hammer-head', [0.22, 0.12, 0.1], [-2.0, 1.9, 1.9], materials.iron, [0, 0, 0.3], 0.02);
}

// ─── Roof (solid prism + tiles + moss) ───────────────────────────────────────

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

  // Gable ridge beam (dark timber, slightly concave character via multi-segment)
  for (let i = 0; i < 5; i += 1) {
    const z = -DIMS.roofDepth / 2 + 0.35 + i * ((DIMS.roofDepth - 0.5) / 4);
    const droop = Math.sin((i / 4) * Math.PI) * 0.12;
    addBlock(
      group,
      `roof.ridge-beam.${i}`,
      [0.55, 0.28, DIMS.roofDepth / 4.2],
      [0, DIMS.eaveY + DIMS.roofRise + 0.08 - droop, z],
      materials.timberBlack,
      [0, 0, 0],
      0.04,
    );
  }

  // Front + rear barge boards
  const bargeRise = DIMS.roofRise + 0.1;
  for (const side of [-1, 1]) {
    const angle = Math.atan2(DIMS.roofRise, DIMS.roofWidth / 2);
    const len = Math.hypot(DIMS.roofWidth / 2, DIMS.roofRise);
    addBlock(
      group,
      `roof.barge.front.${side > 0 ? 'R' : 'L'}`,
      [len, 0.16, 0.14],
      [side * (DIMS.roofWidth / 4), DIMS.eaveY + DIMS.roofRise / 2, DIMS.roofDepth / 2 + 0.02],
      materials.timberBlack,
      [0, 0, side < 0 ? angle : -angle],
      0.025,
    );
    addBlock(
      group,
      `roof.barge.rear.${side > 0 ? 'R' : 'L'}`,
      [len, 0.14, 0.12],
      [side * (DIMS.roofWidth / 4), DIMS.eaveY + DIMS.roofRise / 2, -DIMS.roofDepth / 2 - 0.02],
      materials.timberDark,
      [0, 0, side < 0 ? angle : -angle],
      0.025,
    );
  }

  // Front gable infill (dark timber boards under peak)
  const gableInfill = createMesh(
    createGableInfillGeometry(DIMS.width - 0.2, DIMS.roofRise * 0.92, 0.12),
    materials.timberBlack,
    'roof.gable-infill-front',
  );
  gableInfill.position.set(0, DIMS.eaveY - 0.05, DIMS.frontZ - 0.22);
  group.add(gableInfill);

  // Decorative gable X braces
  addBlock(
    group,
    'roof.gable-brace-l',
    [1.4, 0.1, 0.1],
    [-0.55, DIMS.eaveY + 0.7, DIMS.frontZ - 0.14],
    materials.timber,
    [0, 0, 0.55],
    0.02,
  );
  addBlock(
    group,
    'roof.gable-brace-r',
    [1.4, 0.1, 0.1],
    [0.55, DIMS.eaveY + 0.7, DIMS.frontZ - 0.14],
    materials.timber,
    [0, 0, -0.55],
    0.02,
  );
  addBlock(
    group,
    'roof.gable-collar',
    [2.2, 0.12, 0.1],
    [0, DIMS.eaveY + 0.45, DIMS.frontZ - 0.12],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );

  // Clay tiles on both slopes
  const tileGroup = createNode(group, nodes, 'roof-tiles');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 7;
  const columns = 10;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [materials.roof, materials.roofLight, materials.roofDark, materials.roofMid];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.55);
      const x = side * distanceFromRidge;
      const y =
        DIMS.eaveY - 0.08 + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.09;
      const stagger = row % 2 ? tileDepth * 0.4 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.12;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 4];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.1, 0.1, tileDepth * 1.02],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.024,
        );
      }
    }
  }

  // Ridge caps
  for (let i = 0; i < 11; i += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 11) * (i + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${i}`,
      [0.38, 0.28, DIMS.roofDepth / 10.5],
      [0, DIMS.eaveY + DIMS.roofRise + 0.02, z],
      i % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.04,
      3,
    );
  }

  // Moss patches (identity detail from refs)
  const mossSpots = [
    [1.1, DIMS.eaveY + 0.85, 0.6, 0.55, 0.08, 0.4],
    [0.7, DIMS.eaveY + 1.15, -0.4, 0.4, 0.07, 0.35],
    [1.6, DIMS.eaveY + 0.55, 1.2, 0.45, 0.06, 0.3],
    [-0.9, DIMS.eaveY + 0.95, 0.2, 0.35, 0.07, 0.28],
    [1.3, DIMS.eaveY + 0.7, -1.4, 0.5, 0.08, 0.42],
    [0.4, DIMS.eaveY + 1.35, 1.5, 0.3, 0.06, 0.25],
  ];
  mossSpots.forEach((spot, i) => {
    const [x, y, z, sx, sy, sz] = spot;
    addBlock(
      tileGroup,
      `roof.moss.${i}`,
      [sx, sy, sz],
      [x, y, z],
      i % 2 === 0 ? materials.moss : materials.mossLight,
      [0, seededUnit(i + 2) * 0.4, 0.35],
      0.04,
    );
  });
  addBlock(
    tileGroup,
    'roof.moss.dark-0',
    [0.35, 0.06, 0.3],
    [1.5, DIMS.eaveY + 0.6, -0.8],
    materials.mossDark,
    [0, 0.2, 0.4],
    0.03,
  );
}

// ─── Brick chimney + pot + smoke ─────────────────────────────────────────────

function addChimney(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'chimney');
  const cx = 1.55;
  const cz = -0.85;
  const baseY = DIMS.eaveY + 0.15;

  // Core stack
  addBlock(group, 'chimney.core', [0.85, 2.35, 0.75], [cx, baseY + 1.15, cz], materials.brickMort, [0, 0, 0], 0.03);

  // Brick courses
  const rows = 8;
  const cols = 2;
  for (let row = 0; row < rows; row += 1) {
    const y = baseY + 0.18 + row * 0.28;
    const stagger = row % 2 ? 0.12 : 0;
    for (let col = 0; col < cols; col += 1) {
      const mat = [materials.brick, materials.brickLight, materials.brickDark, materials.stoneLight][
        (row + col) % 4
      ];
      // front face
      addBlock(
        group,
        `chimney.brick.f.${row}.${col}`,
        [0.38, 0.24, 0.14],
        [cx - 0.2 + col * 0.4 + stagger * 0.15, y, cz + 0.38],
        mat,
        [0, 0, 0],
        0.02,
      );
      // back face
      addBlock(
        group,
        `chimney.brick.b.${row}.${col}`,
        [0.38, 0.24, 0.14],
        [cx - 0.2 + col * 0.4, y, cz - 0.38],
        mat,
        [0, 0, 0],
        0.02,
      );
    }
    // side bricks
    for (const side of [-1, 1]) {
      addBlock(
        group,
        `chimney.brick.s.${row}.${side > 0 ? 'R' : 'L'}`,
        [0.14, 0.24, 0.32],
        [cx + side * 0.42, y, cz + (row % 2 ? 0.08 : -0.08)],
        [materials.brickDark, materials.brick, materials.brickLight][row % 3],
        [0, 0, 0],
        0.02,
      );
    }
  }

  // Shoulder / base flare
  addBlock(
    group,
    'chimney.shoulder',
    [1.05, 0.28, 0.95],
    [cx, baseY + 0.05, cz],
    materials.brickDark,
    [0, 0, 0],
    0.04,
  );

  // Cap course
  addBlock(
    group,
    'chimney.cap',
    [1.0, 0.18, 0.9],
    [cx, baseY + 2.35, cz],
    materials.brickLight,
    [0, 0, 0],
    0.03,
  );

  // Terracotta pot
  addCylinder(group, 'chimney.pot-body', 0.32, 0.38, 0.42, [cx, baseY + 2.62, cz], materials.pot, 12);
  addCylinder(group, 'chimney.pot-rim', 0.4, 0.36, 0.12, [cx, baseY + 2.88, cz], materials.potDark, 12);
  addCylinder(group, 'chimney.pot-lip', 0.42, 0.42, 0.06, [cx, baseY + 2.96, cz], materials.pot, 12);

  // Smoke plumes (stylized soft spheres)
  const smokeY = baseY + 3.15;
  addSphere(group, 'smoke.0', 0.38, [cx + 0.05, smokeY + 0.2, cz], materials.smoke, 10);
  addSphere(group, 'smoke.1', 0.48, [cx + 0.15, smokeY + 0.65, cz + 0.05], materials.smokeLight, 10);
  addSphere(group, 'smoke.2', 0.42, [cx - 0.05, smokeY + 1.05, cz + 0.1], materials.smoke, 10);
  addSphere(group, 'smoke.3', 0.32, [cx + 0.2, smokeY + 1.4, cz - 0.05], materials.smokeLight, 8);
  addSphere(group, 'smoke.4', 0.22, [cx + 0.35, smokeY + 1.7, cz + 0.08], materials.smoke, 8);
  addSphere(group, 'smoke.5', 0.14, [cx + 0.5, smokeY + 1.95, cz], materials.smokeLight, 6);

  sockets.smoke = group;
}

// ─── Hanging FORGE sign ──────────────────────────────────────────────────────

function addSign(root, materials, nodes, sockets) {
  const rig = createNode(root, nodes, 'sign-rig');
  const armZ = DIMS.frontZ + 0.05;
  const armY = 2.75;
  const armX = -DIMS.width / 2 + 0.15;

  // wall plate
  addBlock(rig, 'sign.wall-plate', [0.16, 0.4, 0.28], [armX, armY, armZ - 0.15], materials.iron, [0, 0, 0], 0.02);
  // projecting arm
  addBlock(rig, 'sign.arm', [1.35, 0.1, 0.1], [armX - 0.55, armY + 0.05, armZ + 0.05], materials.iron, [0, 0, 0], 0.02);
  addCylinder(
    rig,
    'sign.arm-finial',
    0.08,
    0.08,
    0.16,
    [armX - 1.2, armY + 0.05, armZ + 0.05],
    materials.ironLight,
    8,
    [0, 0, Math.PI / 2],
  );
  // hang links
  addCylinder(
    rig,
    'sign.link.0',
    0.03,
    0.03,
    0.22,
    [armX - 1.0, armY - 0.12, armZ + 0.05],
    materials.ironMid,
    6,
  );
  addCylinder(
    rig,
    'sign.link.1',
    0.03,
    0.03,
    0.22,
    [armX - 0.55, armY - 0.12, armZ + 0.05],
    materials.ironMid,
    6,
  );

  // sign board pivot
  const pivot = new THREE.Group();
  pivot.name = 'pivot.forge-sign';
  pivot.position.set(armX - 0.78, armY - 0.55, armZ + 0.08);
  rig.add(pivot);
  nodes.signPivot = pivot;
  sockets.signSwing = pivot;

  // board
  addBlock(pivot, 'sign.board', [0.95, 1.15, 0.1], [0, 0, 0], materials.signRed, [0, 0, 0], 0.03);
  addBlock(pivot, 'sign.border', [1.05, 1.25, 0.06], [0, 0, -0.03], materials.timberBlack, [0, 0, 0], 0.025);
  // cream name plate
  addBlock(pivot, 'sign.name-plate', [0.78, 0.28, 0.04], [0, -0.38, 0.07], materials.cream, [0, 0, 0], 0.015);
  // FORGE letters as blocks (stylized)
  const letterY = -0.38;
  const letterZ = 0.1;
  // F
  addBlock(pivot, 'sign.L.F.v', [0.05, 0.18, 0.03], [-0.28, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.F.h1', [0.1, 0.04, 0.03], [-0.22, letterY + 0.07, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.F.h2', [0.08, 0.04, 0.03], [-0.23, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  // O
  addTorus(pivot, 'sign.L.O', 0.07, 0.025, [-0.08, letterY, letterZ], materials.signRedDark, [0, 0, 0], 10);
  // R
  addBlock(pivot, 'sign.L.R.v', [0.05, 0.18, 0.03], [0.06, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.R.h', [0.08, 0.04, 0.03], [0.12, letterY + 0.07, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.R.leg', [0.08, 0.04, 0.03], [0.12, letterY - 0.04, letterZ], materials.signRedDark, [0, 0, 0.5], 0.008);
  // G
  addTorus(pivot, 'sign.L.G', 0.07, 0.025, [0.26, letterY, letterZ], materials.signRedDark, [0, 0, 0], 10);
  addBlock(pivot, 'sign.L.G.bar', [0.06, 0.04, 0.03], [0.3, letterY - 0.02, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  // E
  addBlock(pivot, 'sign.L.E.v', [0.05, 0.18, 0.03], [0.4, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.E.h1', [0.1, 0.035, 0.03], [0.47, letterY + 0.07, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.E.h2', [0.08, 0.035, 0.03], [0.46, letterY, letterZ], materials.signRedDark, [0, 0, 0], 0.008);
  addBlock(pivot, 'sign.L.E.h3', [0.1, 0.035, 0.03], [0.47, letterY - 0.07, letterZ], materials.signRedDark, [0, 0, 0], 0.008);

  // Horseshoe + hammer icon
  addTorus(pivot, 'sign.horseshoe', 0.22, 0.05, [0, 0.22, 0.08], materials.gold, [0, 0, 0], 14);
  // open bottom of horseshoe (mask with red patch)
  addBlock(pivot, 'sign.horseshoe-gap', [0.18, 0.12, 0.06], [0, 0.02, 0.09], materials.signRed, [0, 0, 0], 0.02);
  // hammer
  addBlock(pivot, 'sign.hammer-haft', [0.07, 0.42, 0.07], [0, 0.18, 0.12], materials.timberWarm, [0, 0, 0.4], 0.015);
  addBlock(pivot, 'sign.hammer-head', [0.28, 0.14, 0.14], [0.05, 0.32, 0.12], materials.ironLight, [0, 0, 0.4], 0.02);
  // gold studs
  addSphere(pivot, 'sign.stud.0', 0.035, [-0.38, 0.48, 0.08], materials.goldLight, 6);
  addSphere(pivot, 'sign.stud.1', 0.035, [0.38, 0.48, 0.08], materials.goldLight, 6);
  addSphere(pivot, 'sign.stud.2', 0.035, [-0.38, -0.1, 0.08], materials.goldLight, 6);
  addSphere(pivot, 'sign.stud.3', 0.035, [0.38, -0.1, 0.08], materials.goldLight, 6);
}

// ─── Runtime metadata ────────────────────────────────────────────────────────

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
    colliders: {
      sole: { type: 'box', center: [0, 0.14, 0], size: [DIMS.width + 0.6, 0.28, DIMS.depth + 0.5] },
      shell: {
        type: 'box',
        center: [0, DIMS.wallTop / 2, 0],
        size: [DIMS.width, DIMS.wallTop, DIMS.depth],
      },
    },
    destructionGroups: {
      frame: [nodes['timber-frame'], nodes.foundation],
      roof: [nodes.roof, nodes.chimney],
      props: [nodes.props, nodes['sign-rig']],
      forge: [nodes['forge-bay']],
    },
    animation: {
      hangingSign: {
        node: sockets.signSwing,
        axis: [0, 0, 1],
        range: [-0.1, 0.1],
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
  };
}

/**
 * Procedural Smithy / Blacksmith v1 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism roof (ridge along depth)
 * - dark timber open forge, brick chimney, FORGE sign, anvil
 * - gen = img2threejs-smithy-v1 · name = hero.shop.smithy.v1
 */
export function createSmithyModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.shop.smithy.v1';
  root.userData.assetId = 'img2threejs-smithy-v1';
  root.userData.gen = 'img2threejs-smithy-v1';
  root.userData.heroVersion = 'img2threejs-smithy-v1';
  root.userData.generator = 'img2threejs-forge-authored-v1';
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
