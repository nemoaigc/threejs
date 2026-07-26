import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Magic shop — img2threejs v1
 *
 * Quality bar: guild-v2 / temple-v2 / inn-v3
 * Identity: purple roof accent + pointed tower tip, crystal-ball hanging sign,
 * glowing potion display bay, plaster + timber, solid prism roof (no dual rotated
 * box slabs), sole y=0, gen=img2threejs-magic_shop-v1, name=hero.shop.magic.v1
 */

const DIMS = Object.freeze({
  width: 5.6,
  depth: 5.0,
  lowerHeight: 2.85,
  upperHeight: 1.55,
  eaveY: 4.55,
  roofWidth: 6.25,
  roofDepth: 5.55,
  roofRise: 1.85,
  frontZ: 2.5,
  towerX: -0.95,
  towerZ: 0.55,
});

const PALETTE = Object.freeze({
  plaster: 0xf3ebe0,
  plasterShade: 0xe4d8c8,
  plasterDeep: 0xd4c6b4,
  timberDark: 0x4a2c18,
  timber: 0x7a4e2e,
  timberLight: 0xa86a3c,
  roofDark: 0x6b4a9a,
  roof: 0x8a64b8,
  roofLight: 0xa27dcc,
  stoneDark: 0x7a7268,
  stone: 0x9a9186,
  stoneLight: 0xb4aba0,
  mortar: 0x625c56,
  sageDark: 0x6a8460,
  sage: 0x8a9e78,
  sageLight: 0xa8b894,
  doorPurple: 0x8a6ab0,
  doorPurpleLight: 0xa484c4,
  doorPurpleDark: 0x6a4a8e,
  signWood: 0xc49a5c,
  signWoodDark: 0x9a7240,
  iron: 0x2a2826,
  ironLight: 0x45413c,
  gold: 0xd4a84a,
  goldLight: 0xe8c66a,
  crystal: 0x88e8ff,
  crystalDeep: 0x3a70a8,
  potionMagenta: 0xe040d0,
  potionCyan: 0x40e8e0,
  potionTeal: 0x38d0b8,
  potionAmber: 0xf0a030,
  potionGold: 0xf0c848,
  sparkle: 0xfff6c8,
  glass: 0xb8d8f0,
  glassDark: 0x3a4860,
  interior: 0x1a1420,
  lavender: 0x9a7ec8,
  lavenderLight: 0xbca0e0,
  foliage: 0x3a8a48,
  foliageDark: 0x1f6a32,
  rope: 0xb89868,
  ink: 0x2a1838,
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
    plaster: standard(PALETTE.plaster, 0.9),
    plasterShade: standard(PALETTE.plasterShade, 0.93),
    plasterDeep: standard(PALETTE.plasterDeep, 0.95),
    timberDark: standard(PALETTE.timberDark, 0.74),
    timber: standard(PALETTE.timber, 0.68),
    timberLight: standard(PALETTE.timberLight, 0.62),
    roofDark: standard(PALETTE.roofDark, 0.78),
    roof: standard(PALETTE.roof, 0.72),
    roofLight: standard(PALETTE.roofLight, 0.66),
    stoneDark: standard(PALETTE.stoneDark, 0.9),
    stone: standard(PALETTE.stone, 0.84),
    stoneLight: standard(PALETTE.stoneLight, 0.78),
    mortar: standard(PALETTE.mortar, 0.96),
    sageDark: standard(PALETTE.sageDark, 0.72),
    sage: standard(PALETTE.sage, 0.68),
    sageLight: standard(PALETTE.sageLight, 0.64),
    doorPurple: standard(PALETTE.doorPurple, 0.55),
    doorPurpleLight: standard(PALETTE.doorPurpleLight, 0.5),
    doorPurpleDark: standard(PALETTE.doorPurpleDark, 0.6),
    signWood: standard(PALETTE.signWood, 0.7),
    signWoodDark: standard(PALETTE.signWoodDark, 0.74),
    iron: standard(PALETTE.iron, 0.34, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.28, 0.65),
    gold: standard(PALETTE.gold, 0.26, 0.62),
    goldLight: standard(PALETTE.goldLight, 0.22, 0.66),
    crystal: standard(PALETTE.crystal, 0.12, 0.15, {
      emissive: PALETTE.crystal,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.92,
    }),
    crystalDeep: standard(PALETTE.crystalDeep, 0.2, 0.2, {
      emissive: 0x204080,
      emissiveIntensity: 0.35,
    }),
    potionMagenta: standard(PALETTE.potionMagenta, 0.18, 0, {
      emissive: PALETTE.potionMagenta,
      emissiveIntensity: 1.35,
    }),
    potionCyan: standard(PALETTE.potionCyan, 0.16, 0, {
      emissive: PALETTE.potionCyan,
      emissiveIntensity: 1.25,
    }),
    potionTeal: standard(PALETTE.potionTeal, 0.18, 0, {
      emissive: PALETTE.potionTeal,
      emissiveIntensity: 1.1,
    }),
    potionAmber: standard(PALETTE.potionAmber, 0.2, 0, {
      emissive: PALETTE.potionAmber,
      emissiveIntensity: 1.2,
    }),
    potionGold: standard(PALETTE.potionGold, 0.22, 0, {
      emissive: PALETTE.potionGold,
      emissiveIntensity: 1.05,
    }),
    sparkle: standard(PALETTE.sparkle, 0.15, 0, {
      emissive: PALETTE.sparkle,
      emissiveIntensity: 1.6,
    }),
    glass: standard(PALETTE.glass, 0.22, 0.05, {
      transparent: true,
      opacity: 0.42,
      emissive: 0x6080a0,
      emissiveIntensity: 0.15,
    }),
    glassDark: standard(PALETTE.glassDark, 0.35, 0, {
      emissive: 0x203040,
      emissiveIntensity: 0.25,
    }),
    glassGlow: standard(0x7060a0, 0.3, 0, {
      emissive: 0x6040a0,
      emissiveIntensity: 0.55,
    }),
    interior: standard(PALETTE.interior, 1),
    lavender: standard(PALETTE.lavender, 0.7),
    lavenderLight: standard(PALETTE.lavenderLight, 0.65),
    foliage: standard(PALETTE.foliage, 0.72),
    foliageDark: standard(PALETTE.foliageDark, 0.78),
    rope: standard(PALETTE.rope, 0.85),
    ink: standard(PALETTE.ink, 0.9),
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
  radius = 0.04,
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

function addCylinderBetween(parent, name, start, end, radius, material, radialSegments = 10) {
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endV, startV);
  const length = direction.length();
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const result = createMesh(
    new THREE.CylinderGeometry(radius, radius, length, radialSegments),
    material,
    name,
  );
  result.position.copy(mid);
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
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
 * Closed solid gable prism with ridge along DEPTH (Z).
 * Triangular gable ends face front (+Z) and rear (-Z).
 * NOT dual rotated box slabs.
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

function createGableInfillGeometry(width, rise, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addFoundation(root, materials, nodes) {
  const group = createNode(root, nodes, 'foundation');
  addBlock(
    group,
    'foundation.stone-plinth',
    [DIMS.width + 0.55, 0.32, DIMS.depth + 0.55],
    [0, 0.16, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.05,
  );
  // Front ashlar course
  for (let index = 0; index < 6; index += 1) {
    addBlock(
      group,
      `foundation.front-stone.${index}`,
      [0.95, 0.28, 0.18],
      [-2.4 + index * 0.96, 0.17, DIMS.frontZ + 0.12],
      [materials.stoneDark, materials.stone, materials.stoneLight][index % 3],
      [0, 0, 0],
      0.03,
    );
  }
  // Right side ashlar
  for (let index = 0; index < 5; index += 1) {
    addBlock(
      group,
      `foundation.right-stone.${index}`,
      [0.16, 0.26, 0.95],
      [DIMS.width / 2 + 0.18, 0.16, -2.0 + index * 0.98],
      [materials.stone, materials.stoneLight, materials.stoneDark][index % 3],
      [0, 0, 0],
      0.028,
    );
  }
  // Left side ashlar
  for (let index = 0; index < 5; index += 1) {
    addBlock(
      group,
      `foundation.left-stone.${index}`,
      [0.16, 0.26, 0.95],
      [-DIMS.width / 2 - 0.18, 0.16, -2.0 + index * 0.98],
      [materials.stoneLight, materials.stoneDark, materials.stone][index % 3],
      [0, 0, 0],
      0.028,
    );
  }
  // Sage water-table trim
  addBlock(
    group,
    'foundation.sage-belt',
    [DIMS.width + 0.28, 0.12, DIMS.depth + 0.28],
    [0, 0.38, 0],
    materials.sage,
    [0, 0, 0],
    0.03,
  );
}

function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'building-core');
  const coreW = DIMS.width - 0.35;
  const coreD = DIMS.depth - 0.4;
  addBlock(
    group,
    'shell.ground-storey',
    [coreW, DIMS.lowerHeight, coreD],
    [0, 0.32 + DIMS.lowerHeight / 2, 0],
    materials.plasterDeep,
    [0, 0, 0],
    0.04,
  );
  addBlock(
    group,
    'shell.upper-storey',
    [coreW * 0.98, DIMS.upperHeight, coreD * 0.92],
    [0, 0.32 + DIMS.lowerHeight + DIMS.upperHeight / 2 - 0.05, -0.05],
    materials.plasterShade,
    [0, 0, 0],
    0.04,
  );
  nodes['ground-floor-shell'] = group;
  nodes['upper-storey-shell'] = group;
}

function addFacadePlaster(root, materials, nodes) {
  const group = createNode(root, nodes, 'facade-plaster');
  const fz = DIMS.frontZ + 0.02;
  // Front plaster panels
  addBlock(
    group,
    'facade.front.lower',
    [DIMS.width - 0.15, DIMS.lowerHeight - 0.2, 0.12],
    [0, 0.45 + (DIMS.lowerHeight - 0.2) / 2, fz],
    materials.plaster,
    [0, 0, 0],
    0.035,
  );
  addBlock(
    group,
    'facade.front.upper',
    [DIMS.width * 0.72, 1.35, 0.12],
    [0.15, 3.85, fz - 0.05],
    materials.plaster,
    [0, 0, 0],
    0.035,
  );
  // Right wall
  addBlock(
    group,
    'facade.right',
    [0.12, DIMS.lowerHeight + 0.3, DIMS.depth - 0.3],
    [DIMS.width / 2 + 0.02, 0.45 + (DIMS.lowerHeight + 0.3) / 2, 0],
    materials.plaster,
    [0, 0, 0],
    0.035,
  );
  // Left wall
  addBlock(
    group,
    'facade.left',
    [0.12, DIMS.lowerHeight + 0.3, DIMS.depth - 0.3],
    [-DIMS.width / 2 - 0.02, 0.45 + (DIMS.lowerHeight + 0.3) / 2, 0],
    materials.plasterShade,
    [0, 0, 0],
    0.035,
  );
  // Rear
  addBlock(
    group,
    'facade.rear',
    [DIMS.width - 0.2, DIMS.lowerHeight + 0.2, 0.12],
    [0, 0.5 + (DIMS.lowerHeight + 0.2) / 2, -DIMS.frontZ + 0.05],
    materials.plasterShade,
    [0, 0, 0],
    0.035,
  );
  // Front gable infill triangle
  const gable = createMesh(
    createGableInfillGeometry(DIMS.width * 0.78, 1.55, 0.14),
    materials.plaster,
    'facade.front-gable-infill',
  );
  gable.position.set(0.1, DIMS.eaveY - 0.05, fz - 0.08);
  group.add(gable);
}

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

  // Fascia / green eave trim
  addBlock(
    group,
    'roof.fascia-front',
    [DIMS.roofWidth * 0.98, 0.14, 0.12],
    [0, DIMS.eaveY - 0.02, DIMS.roofDepth / 2 + 0.01],
    materials.sage,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-back',
    [DIMS.roofWidth * 0.98, 0.14, 0.12],
    [0, DIMS.eaveY - 0.02, -DIMS.roofDepth / 2 - 0.01],
    materials.sageDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-right',
    [0.12, 0.12, DIMS.roofDepth * 0.92],
    [DIMS.roofWidth / 2 - 0.02, DIMS.eaveY - 0.01, 0],
    materials.sage,
    [0, 0, 0],
    0.022,
  );
  addBlock(
    group,
    'roof.fascia-left',
    [0.12, 0.12, DIMS.roofDepth * 0.92],
    [-DIMS.roofWidth / 2 + 0.02, DIMS.eaveY - 0.01, 0],
    materials.sage,
    [0, 0, 0],
    0.022,
  );

  // Soft tile relief (rotated along slope, not structural dual-slab roof)
  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 6;
  const columns = 8;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [materials.roof, materials.roofLight, materials.roofDark];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.55);
      const x = side * distanceFromRidge;
      const y =
        DIMS.eaveY - 0.08 + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.08;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5);
        const material = tileMats[(row * 2 + column + (side > 0 ? 1 : 0)) % 3];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.1, 0.09, tileDepth * 1.02],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.022,
        );
      }
    }
  }

  // Ridge caps
  for (let index = 0; index < 10; index += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 10) * (index + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${index}`,
      [0.32, 0.22, DIMS.roofDepth / 10.5],
      [0, DIMS.eaveY + DIMS.roofRise - 0.02, z],
      index % 2 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.04,
      3,
    );
  }

  // Pointed tower / conical tip (identity accent)
  addTowerSpire(group, materials, nodes);
  // Side dormer
  addSideDormer(group, materials, nodes);
}

function addTowerSpire(parent, materials, nodes) {
  const group = createNode(parent, nodes, 'tower-spire');
  const baseY = DIMS.eaveY + 0.15;
  const cx = DIMS.towerX;
  const cz = DIMS.towerZ;

  // Drum / collar under cone
  addCylinder(
    group,
    'tower.collar',
    0.95,
    1.05,
    0.35,
    [cx, baseY + 0.1, cz],
    materials.roof,
    16,
  );
  addBlock(
    group,
    'tower.sage-band',
    [2.05, 0.1, 2.05],
    [cx, baseY - 0.05, cz],
    materials.sageLight,
    [0, 0, 0],
    0.03,
  );

  // Solid pointed cone (closed volume, not dual slabs)
  const cone = createMesh(
    new THREE.ConeGeometry(1.15, 2.35, 18, 1, false),
    materials.roofLight,
    'tower.pointed-cone',
  );
  cone.position.set(cx, baseY + 1.35, cz);
  cone.userData.structuralRoof = true;
  cone.userData.construction = 'solid-cone-pointed-tip';
  group.add(cone);

  // Soft cone shade bands
  addCylinder(
    group,
    'tower.band-mid',
    0.72,
    0.88,
    0.12,
    [cx, baseY + 0.85, cz],
    materials.roof,
    14,
  );
  addCylinder(
    group,
    'tower.band-upper',
    0.38,
    0.48,
    0.1,
    [cx, baseY + 1.75, cz],
    materials.roofDark,
    12,
  );

  // Gold finial
  addSphere(group, 'tower.finial-ball', 0.12, [cx, baseY + 2.62, cz], materials.gold, 10);
  addCylinder(
    group,
    'tower.finial-spike',
    0.025,
    0.05,
    0.28,
    [cx, baseY + 2.82, cz],
    materials.goldLight,
    8,
  );
  addSphere(group, 'tower.finial-tip', 0.05, [cx, baseY + 2.98, cz], materials.goldLight, 8);
}

function addSideDormer(parent, materials, nodes) {
  const group = createNode(parent, nodes, 'side-dormer');
  // Dormer sits on right roof slope, facing +X
  const x = 1.55;
  const y = DIMS.eaveY + 0.85;
  const z = -0.15;

  addBlock(group, 'dormer.body', [0.55, 0.7, 0.95], [x, y, z], materials.plaster, [0, 0, 0], 0.04);
  // Small gable cap
  const cap = createMesh(
    createSolidGableGeometry(0.95, 0.7, 0.42),
    materials.roof,
    'dormer.roof-prism',
  );
  cap.rotation.y = Math.PI / 2;
  cap.position.set(x + 0.05, y + 0.32, z);
  group.add(cap);

  // Round window
  addCylinder(
    group,
    'dormer.window-frame',
    0.28,
    0.28,
    0.1,
    [x + 0.28, y + 0.05, z],
    materials.timberLight,
    16,
    [0, 0, Math.PI / 2],
  );
  addCylinder(
    group,
    'dormer.window-glass',
    0.22,
    0.22,
    0.06,
    [x + 0.32, y + 0.05, z],
    materials.glassDark,
    14,
    [0, 0, Math.PI / 2],
  );
  addBlock(group, 'dormer.muntin-v', [0.04, 0.4, 0.04], [x + 0.34, y + 0.05, z], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'dormer.muntin-h', [0.04, 0.04, 0.4], [x + 0.34, y + 0.05, z], materials.timber, [0, 0, 0], 0.01);
}

function addDoor(root, materials, nodes, sockets) {
  const assembly = createNode(root, nodes, 'door-system');
  const fz = DIMS.frontZ + 0.18;
  const doorX = -1.45;
  const doorW = 1.15;
  const doorH = 2.15;

  // Timber portal
  addBlock(assembly, 'door.frame-left', [0.22, 2.45, 0.32], [doorX - doorW / 2 - 0.08, 1.45, fz], materials.timber, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-right', [0.22, 2.45, 0.32], [doorX + doorW / 2 + 0.08, 1.45, fz], materials.timber, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-lintel', [doorW + 0.55, 0.28, 0.36], [doorX, 2.72, fz], materials.timberDark, [0, 0, 0], 0.045);
  // Arched header
  addCylinder(
    assembly,
    'door.arch',
    doorW / 2 + 0.12,
    doorW / 2 + 0.12,
    0.22,
    [doorX, 2.55, fz + 0.02],
    materials.timber,
    16,
    [Math.PI / 2, 0, 0],
  );

  // Outer posts / porch posts
  addBlock(assembly, 'door.post-left', [0.28, 2.7, 0.28], [doorX - doorW / 2 - 0.32, 1.55, fz + 0.08], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.post-right', [0.28, 2.7, 0.28], [doorX + doorW / 2 + 0.32, 1.55, fz + 0.08], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.header-beam', [doorW + 1.05, 0.22, 0.28], [doorX, 2.95, fz + 0.06], materials.timber, [0, 0, 0], 0.04);

  // Door leaf (hinge pivot for animation)
  const hinge = new THREE.Group();
  hinge.name = 'door.hinge-pivot';
  hinge.position.set(doorX - doorW / 2 + 0.04, 0.38, fz + 0.04);
  assembly.add(hinge);
  sockets.doorHinge = hinge;

  addBlock(hinge, 'door.leaf', [doorW - 0.08, doorH, 0.12], [doorW / 2 - 0.04, doorH / 2, 0], materials.doorPurple, [0, 0, 0], 0.04);
  // Gold filigree panels
  addBlock(hinge, 'door.panel-upper', [doorW * 0.62, 0.55, 0.04], [doorW / 2 - 0.04, doorH * 0.72, 0.08], materials.doorPurpleDark, [0, 0, 0], 0.03);
  addBlock(hinge, 'door.panel-lower', [doorW * 0.62, 0.55, 0.04], [doorW / 2 - 0.04, doorH * 0.32, 0.08], materials.doorPurpleDark, [0, 0, 0], 0.03);
  // Filigree curves as gold tori arcs
  addTorus(hinge, 'door.filigree-u', 0.28, 0.02, [doorW / 2 - 0.04, doorH * 0.72, 0.1], materials.gold, [0, 0, 0], 14, Math.PI * 1.6);
  addTorus(hinge, 'door.filigree-l', 0.28, 0.02, [doorW / 2 - 0.04, doorH * 0.32, 0.1], materials.gold, [0, 0, 0], 14, Math.PI * 1.6);
  // Knob
  addSphere(hinge, 'door.knob', 0.07, [doorW - 0.22, doorH * 0.5, 0.12], materials.goldLight, 10);
  addCylinder(hinge, 'door.knob-stem', 0.025, 0.025, 0.08, [doorW - 0.22, doorH * 0.5, 0.08], materials.gold, 8, [Math.PI / 2, 0, 0]);
  // Hinge straps
  for (const y of [0.35, 1.55]) {
    addBlock(hinge, `door.strap.${y}`, [0.28, 0.1, 0.05], [0.16, y, 0.1], materials.gold, [0, 0, 0], 0.02);
  }

  // Interior reveal
  addBlock(assembly, 'door.reveal', [doorW * 0.9, doorH * 0.92, 0.08], [doorX, 1.45, fz - 0.12], materials.interior, [0, 0, 0], 0.02);

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.door-interaction';
  interaction.position.set(doorX, 1.3, fz + 0.7);
  root.add(interaction);
  sockets.doorInteraction = interaction;
}

function createPotion(parent, materials, name, position, colorKey, scale = 1, style = 'round') {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.scale.setScalar(scale);
  parent.add(group);

  const liquid = materials[colorKey] || materials.potionCyan;
  if (style === 'round') {
    addSphere(group, `${name}.body`, 0.22, [0, 0.18, 0], liquid, 14, [1, 1.05, 1]);
    addCylinder(group, `${name}.neck`, 0.055, 0.08, 0.16, [0, 0.42, 0], materials.glass, 10);
  } else if (style === 'tall') {
    addSphere(group, `${name}.body`, 0.16, [0, 0.22, 0], liquid, 12, [0.9, 1.35, 0.9]);
    addCylinder(group, `${name}.neck`, 0.04, 0.06, 0.14, [0, 0.48, 0], materials.glass, 9);
  } else {
    // squat
    addSphere(group, `${name}.body`, 0.18, [0, 0.14, 0], liquid, 12, [1.15, 0.85, 1.15]);
    addCylinder(group, `${name}.neck`, 0.05, 0.07, 0.12, [0, 0.32, 0], materials.glass, 9);
  }
  // Cork
  addCylinder(group, `${name}.cork`, 0.06, 0.05, 0.08, [0, style === 'tall' ? 0.58 : style === 'squat' ? 0.4 : 0.52, 0], materials.timberLight, 8);
  // Sparkles
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    addSphere(
      group,
      `${name}.sparkle.${i}`,
      0.025,
      [Math.cos(a) * 0.2, 0.18 + i * 0.08, Math.sin(a) * 0.15],
      materials.sparkle,
      6,
    );
  }
  return group;
}

function addDisplayBay(root, materials, nodes) {
  const group = createNode(root, nodes, 'display-bay');
  const fz = DIMS.frontZ;
  const bayX = 1.05;
  const bayY = 1.55;
  const bayW = 2.15;
  const bayH = 1.65;

  // Bay projection (angled box base)
  addBlock(group, 'bay.lower-wood', [bayW + 0.15, 0.95, 0.72], [bayX, 0.72, fz + 0.28], materials.timber, [0, 0, 0], 0.05);
  // Vertical plank relief on bay base
  for (let i = 0; i < 5; i += 1) {
    addBlock(
      group,
      `bay.plank.${i}`,
      [0.18, 0.88, 0.08],
      [bayX - bayW * 0.4 + i * 0.42, 0.72, fz + 0.62],
      i % 2 === 0 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.02,
    );
  }
  addBlock(group, 'bay.sill', [bayW + 0.25, 0.14, 0.78], [bayX, 1.22, fz + 0.3], materials.timberDark, [0, 0, 0], 0.03);
  addBlock(group, 'bay.header', [bayW + 0.3, 0.18, 0.78], [bayX, bayY + bayH / 2 + 0.05, fz + 0.28], materials.timberDark, [0, 0, 0], 0.035);

  // Posts
  for (const [label, x] of [
    ['L', bayX - bayW / 2 - 0.05],
    ['R', bayX + bayW / 2 + 0.05],
  ]) {
    addBlock(group, `bay.post.${label}`, [0.16, bayH + 0.2, 0.18], [x, bayY, fz + 0.45], materials.timberDark, [0, 0, 0], 0.03);
  }

  // Glass panes (3 front + slight angle feel)
  addBlock(group, 'bay.glass.front', [bayW * 0.92, bayH * 0.9, 0.06], [bayX, bayY, fz + 0.55], materials.glassGlow, [0, 0, 0], 0.02);
  addBlock(group, 'bay.glass.left', [0.08, bayH * 0.9, 0.55], [bayX - bayW / 2 + 0.02, bayY, fz + 0.28], materials.glassDark, [0, 0, 0], 0.02);
  addBlock(group, 'bay.glass.right', [0.08, bayH * 0.9, 0.55], [bayX + bayW / 2 - 0.02, bayY, fz + 0.28], materials.glassDark, [0, 0, 0], 0.02);

  // Muntins
  addBlock(group, 'bay.muntin-v', [0.06, bayH * 0.88, 0.05], [bayX - 0.15, bayY, fz + 0.58], materials.timberDark, [0, 0, 0], 0.012);
  addBlock(group, 'bay.muntin-h', [bayW * 0.88, 0.06, 0.05], [bayX, bayY + 0.15, fz + 0.58], materials.timberDark, [0, 0, 0], 0.012);

  // Interior shelf + dark back
  addBlock(group, 'bay.interior-back', [bayW * 0.85, bayH * 0.85, 0.08], [bayX, bayY, fz + 0.05], materials.interior, [0, 0, 0], 0.02);
  addBlock(group, 'bay.shelf', [bayW * 0.8, 0.08, 0.4], [bayX, bayY - 0.15, fz + 0.32], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, 'bay.shelf-upper', [bayW * 0.55, 0.06, 0.28], [bayX + 0.15, bayY + 0.45, fz + 0.28], materials.timberDark, [0, 0, 0], 0.02);

  // Glowing potions (identity)
  const potionGroup = createNode(group, nodes, 'potions');
  createPotion(potionGroup, materials, 'potion.magenta', [bayX - 0.55, bayY - 0.05, fz + 0.42], 'potionMagenta', 1.05, 'round');
  createPotion(potionGroup, materials, 'potion.cyan', [bayX + 0.05, bayY - 0.12, fz + 0.48], 'potionCyan', 0.92, 'squat');
  createPotion(potionGroup, materials, 'potion.amber', [bayX + 0.55, bayY - 0.08, fz + 0.4], 'potionAmber', 0.88, 'squat');
  createPotion(potionGroup, materials, 'potion.gold-upper', [bayX + 0.2, bayY + 0.55, fz + 0.35], 'potionGold', 0.72, 'tall');

  // Soft sparkle points floating in glass
  for (let i = 0; i < 6; i += 1) {
    addSphere(
      potionGroup,
      `bay.sparkle-float.${i}`,
      0.03,
      [bayX - 0.6 + i * 0.28, bayY + 0.2 + (i % 3) * 0.15, fz + 0.5],
      materials.sparkle,
      5,
    );
  }
}

function addFrontUpperWindow(root, materials, nodes) {
  const group = createNode(root, nodes, 'front-upper-window');
  const fz = DIMS.frontZ + 0.08;
  const y = 4.05;
  // Arched upper window on gable
  addBlock(group, 'upper.frame', [0.85, 0.95, 0.14], [0.05, y, fz], materials.timberLight, [0, 0, 0], 0.03);
  addCylinder(group, 'upper.arch', 0.42, 0.42, 0.12, [0.05, y + 0.35, fz + 0.02], materials.timberLight, 14, [Math.PI / 2, 0, 0]);
  addBlock(group, 'upper.glass', [0.65, 0.7, 0.06], [0.05, y - 0.02, fz + 0.04], materials.glassDark, [0, 0, 0], 0.02);
  addBlock(group, 'upper.muntin-v', [0.05, 0.65, 0.05], [0.05, y - 0.02, fz + 0.07], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'upper.muntin-h', [0.6, 0.05, 0.05], [0.05, y - 0.02, fz + 0.07], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'upper.sage-sill', [1.0, 0.1, 0.16], [0.05, y - 0.52, fz + 0.02], materials.sage, [0, 0, 0], 0.02);
}

function addSideWindow(root, materials, nodes) {
  const group = createNode(root, nodes, 'side-window');
  const x = DIMS.width / 2 + 0.08;
  const y = 1.85;
  const z = 0.35;

  addBlock(group, 'side.frame', [0.14, 1.15, 0.95], [x, y, z], materials.timberLight, [0, 0, 0], 0.03);
  addCylinder(group, 'side.arch', 0.42, 0.42, 0.12, [x + 0.02, y + 0.4, z], materials.timberLight, 14, [0, 0, Math.PI / 2]);
  addBlock(group, 'side.glass', [0.06, 0.85, 0.72], [x + 0.05, y - 0.05, z], materials.glassDark, [0, 0, 0], 0.02);
  addBlock(group, 'side.muntin-v', [0.04, 0.8, 0.05], [x + 0.07, y - 0.05, z], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'side.muntin-h', [0.04, 0.05, 0.68], [x + 0.07, y - 0.05, z], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'side.sage-sill', [0.16, 0.1, 1.1], [x + 0.02, y - 0.62, z], materials.sage, [0, 0, 0], 0.02);

  // Flower box + lavender
  addBlock(group, 'flower.box', [0.32, 0.22, 1.15], [x + 0.18, y - 0.78, z], materials.sageLight, [0, 0, 0], 0.035);
  addBlock(group, 'flower.box-purple-band', [0.1, 0.12, 0.7], [x + 0.32, y - 0.78, z], materials.doorPurple, [0, 0, 0], 0.02);
  for (let i = 0; i < 7; i += 1) {
    const ox = ((i % 3) - 1) * 0.06;
    const oz = -0.42 + i * 0.14;
    addCylinder(
      group,
      `lavender.stem.${i}`,
      0.015,
      0.02,
      0.28 + (i % 3) * 0.05,
      [x + 0.22 + ox, y - 0.55, z + oz],
      materials.foliageDark,
      5,
    );
    addSphere(
      group,
      `lavender.bloom.${i}`,
      0.06,
      [x + 0.22 + ox, y - 0.38 + (i % 2) * 0.04, z + oz],
      i % 2 === 0 ? materials.lavender : materials.lavenderLight,
      8,
      [0.7, 1.4, 0.7],
    );
  }
}

function addSign(root, materials, nodes, sockets) {
  const rig = createNode(root, nodes, 'sign-rig');
  const wallX = 0.55;
  const wallY = 3.55;
  const wallZ = DIMS.frontZ + 0.15;

  // Wall mount + iron arm
  addBlock(rig, 'sign.wall-plate', [0.18, 0.35, 0.14], [wallX, wallY + 0.15, wallZ], materials.iron, [0, 0, 0], 0.03);
  addBlock(rig, 'sign.arm', [1.55, 0.09, 0.09], [wallX - 0.55, wallY + 0.22, wallZ + 0.35], materials.iron, [0, 0.15, 0], 0.02);
  addBlock(rig, 'sign.arm-brace', [0.7, 0.07, 0.07], [wallX - 0.15, wallY + 0.05, wallZ + 0.18], materials.ironLight, [0, 0.2, -0.45], 0.015);

  // Rope hangers
  const swing = new THREE.Group();
  swing.name = 'sign.swing-pivot';
  swing.position.set(wallX - 1.15, wallY + 0.05, wallZ + 0.55);
  rig.add(swing);
  sockets.signSwing = swing;

  for (const sx of [-0.32, 0.32]) {
    addCylinder(swing, `sign.rope.${sx}`, 0.018, 0.018, 0.28, [sx, 0.05, 0], materials.rope, 6);
  }

  // Wooden plate
  addBlock(swing, 'sign.plate', [1.05, 1.25, 0.1], [0, -0.55, 0], materials.signWood, [0, 0, 0], 0.04);
  addBlock(swing, 'sign.plate-border', [1.12, 1.32, 0.06], [0, -0.55, -0.02], materials.signWoodDark, [0, 0, 0], 0.03);

  // Crystal ball emblem (identity)
  addSphere(swing, 'sign.crystal-ball', 0.22, [0, -0.42, 0.08], materials.crystalDeep, 14);
  addSphere(swing, 'sign.crystal-highlight', 0.08, [-0.06, -0.34, 0.22], materials.crystal, 8);
  // Swirl stand
  addCylinder(swing, 'sign.crystal-stand', 0.04, 0.1, 0.08, [0, -0.62, 0.08], materials.ink, 8);
  // Stars around crystal
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    addSphere(
      swing,
      `sign.star.${i}`,
      0.03,
      [Math.cos(a) * 0.32, -0.42 + Math.sin(a) * 0.28, 0.1],
      materials.sparkle,
      5,
    );
  }

  // Title bars (simplified lettering blocks)
  addBlock(swing, 'sign.title-bar-top', [0.72, 0.12, 0.04], [0, -0.05, 0.07], materials.ink, [0, 0, 0], 0.015);
  addBlock(swing, 'sign.title-bar-mid', [0.58, 0.1, 0.04], [0, -0.18, 0.07], materials.doorPurpleDark, [0, 0, 0], 0.015);
  // Purple ribbon tag
  addBlock(swing, 'sign.ribbon', [0.95, 0.16, 0.05], [0, -1.05, 0.07], materials.doorPurple, [0, 0, 0], 0.02);
  addBlock(swing, 'sign.ribbon-text', [0.72, 0.06, 0.03], [0, -1.05, 0.1], materials.goldLight, [0, 0, 0], 0.01);

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.sign-interaction';
  interaction.position.set(wallX - 1.15, wallY - 0.5, wallZ + 1.0);
  root.add(interaction);
  sockets.signInteraction = interaction;
}

function addTimberAccents(root, materials, nodes) {
  const group = createNode(root, nodes, 'timber-accents');
  const fz = DIMS.frontZ + 0.1;
  // Front corner posts
  addBlock(group, 'timber.front-left-post', [0.18, 3.0, 0.18], [-DIMS.width / 2 + 0.1, 1.85, fz], materials.timberDark, [0, 0, 0], 0.03);
  addBlock(group, 'timber.front-right-post', [0.18, 3.0, 0.18], [DIMS.width / 2 - 0.1, 1.85, fz], materials.timber, [0, 0, 0], 0.03);
  // Mid rails
  addBlock(group, 'timber.front-rail-low', [DIMS.width - 0.4, 0.12, 0.12], [0, 0.55, fz], materials.timber, [0, 0, 0], 0.025);
  addBlock(group, 'timber.front-rail-mid', [DIMS.width * 0.55, 0.12, 0.12], [0.9, 2.55, fz], materials.timberDark, [0, 0, 0], 0.025);
  // Side rails
  addBlock(group, 'timber.right-rail', [0.12, 0.12, DIMS.depth - 0.5], [DIMS.width / 2 + 0.04, 2.55, 0], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, 'timber.left-rail', [0.12, 0.12, DIMS.depth - 0.5], [-DIMS.width / 2 - 0.04, 2.55, 0], materials.timberDark, [0, 0, 0], 0.02);
}

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
      meshes[object.name] = object;
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
      foundation: {
        type: 'box',
        center: [0, 0.16, 0],
        size: [DIMS.width + 0.55, 0.32, DIMS.depth + 0.55],
        isTrigger: false,
      },
      building: {
        type: 'box',
        center: [0, 2.4, 0],
        size: [DIMS.width, 4.2, DIMS.depth],
        isTrigger: false,
      },
      roof: {
        type: 'closed-gable-prism',
        center: [0, DIMS.eaveY + DIMS.roofRise / 2, 0],
        size: [DIMS.roofWidth, DIMS.roofRise, DIMS.roofDepth],
        isTrigger: false,
      },
      tower: {
        type: 'cone',
        center: [DIMS.towerX, DIMS.eaveY + 1.5, DIMS.towerZ],
        size: [2.3, 2.5, 2.3],
        isTrigger: false,
      },
      displayBay: {
        type: 'box',
        center: [1.05, 1.4, DIMS.frontZ + 0.35],
        size: [2.4, 2.4, 1.0],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [-0.6, 3.1, DIMS.frontZ + 0.9],
        size: [1.6, 1.8, 1.2],
        isTrigger: true,
      },
      doorInteraction: {
        type: 'box',
        center: [-1.45, 1.3, DIMS.frontZ + 0.8],
        size: [1.6, 2.4, 1.2],
        isTrigger: true,
      },
    },
    destructionGroups: {
      plaster: [
        ...collectMeshes(nodes['building-core']),
        ...collectMeshes(nodes['facade-plaster']),
      ],
      timberFrame: collectMeshes(nodes['timber-accents']),
      roof: [
        ...collectMeshes(nodes.roof),
        ...collectMeshes(nodes['tower-spire']),
        ...collectMeshes(nodes['side-dormer']),
      ],
      glazing: collectMeshes(nodes['display-bay']).filter((m) => /glass|potion|sparkle/.test(m.name)),
      potions: collectMeshes(nodes.potions),
      sign: collectMeshes(nodes['sign-rig']),
      entranceProps: collectMeshes(nodes['door-system']),
      flora: collectMeshes(nodes['side-window']).filter((m) => /lavender|flower/.test(m.name)),
    },
    animation: {
      door: {
        node: sockets.doorHinge,
        axis: [0, 1, 0],
        range: [-Math.PI * 0.45, 0],
      },
      hangingSign: {
        node: sockets.signSwing,
        axis: [0, 0, 1],
        range: [-0.1, 0.1],
      },
    },
    sources: [
      'public/content/buildings/magic_shop/ref_main.png',
      'public/content/buildings/magic_shop/ref_front.png',
      'public/content/buildings/magic_shop/ref_side.png',
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
      'blank-plaster-slab-facade',
    ],
  };
}

/**
 * Procedural Magic Shop v1 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism main roof + solid pointed cone tower
 * - purple roof identity, crystal-ball hanging sign, glowing potion bay
 * - plaster + timber + sage trim, stone foundation
 * - sculptRuntime with sockets / colliders / destruction groups
 */
export function createMagicShopModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.shop.magic.v1';
  root.userData.assetId = 'img2threejs-magic_shop-v1';
  root.userData.gen = 'img2threejs-magic_shop-v1';
  root.userData.heroVersion = 'img2threejs-magic_shop-v1';
  root.userData.generator = 'img2threejs-forge-authored-v1';
  root.userData.facadeNormal = '+Z';
  root.userData.soleY = 0;
  root.userData.referenceViews = ['three-quarter-front', 'straight-front', 'right-side'];
  root.userData.approximation = 'stylized multi-view procedural reconstruction';
  root.userData.usesPhotoBillboard = false;

  const materials = createMaterials();
  const nodes = { root };
  const sockets = {};

  addFoundation(root, materials, nodes);
  addShell(root, materials, nodes);
  addFacadePlaster(root, materials, nodes);
  addRoof(root, materials, nodes);
  addTimberAccents(root, materials, nodes);
  addDoor(root, materials, nodes, sockets);
  addDisplayBay(root, materials, nodes);
  addFrontUpperWindow(root, materials, nodes);
  addSideWindow(root, materials, nodes);
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

export const createMagicShopHero = createMagicShopModel;
export default createMagicShopModel;
