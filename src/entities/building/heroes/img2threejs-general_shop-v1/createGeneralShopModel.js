import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Village general store — img2threejs v1
 *
 * Quality bar: guild-v2 / temple-v2 / inn-v3
 * Identity: cream plaster, yellow-wood hanging "GENERAL STORE" sign,
 * red clay gable (solid closed prism, ridge along depth / Z),
 * porch crates + flour barrel, striped awning, teal door, cozy shop window.
 */

const DIMS = Object.freeze({
  width: 5.6,
  depth: 4.6,
  lowerHeight: 2.75,
  upperHeight: 2.45,
  eaveY: 5.55,
  roofWidth: 6.35,
  roofDepth: 5.25,
  roofRise: 2.05,
  frontZ: 2.3,
  porchDepth: 1.55,
  porchY: 0.28,
});

const PALETTE = Object.freeze({
  plaster: 0xf3e8d4,
  plasterShade: 0xe5d8c2,
  plasterDeep: 0xd6c7ae,
  plasterCrack: 0xc9b79a,
  timberDark: 0x4a2c18,
  timber: 0x7a4a28,
  timberLight: 0xa86a3a,
  yellowWood: 0xe0b040,
  yellowWoodLight: 0xf0c85a,
  yellowWoodDark: 0xb88828,
  roofDark: 0xa03228,
  roof: 0xc24434,
  roofLight: 0xd85a46,
  stoneDark: 0x7a7064,
  stone: 0x9a9084,
  stoneLight: 0xb4aa9c,
  brickDark: 0x8a4034,
  brick: 0xa85040,
  brickLight: 0xc06854,
  door: 0x3a8a9a,
  doorDark: 0x2a6a78,
  doorLight: 0x5aadb8,
  iron: 0x2c2926,
  ironLight: 0x4a4440,
  gold: 0xd0a24f,
  glass: 0xb8d0e0,
  glassWarm: 0xf0d090,
  curtain: 0xf0c860,
  curtainShade: 0xd8a848,
  awningRed: 0xc83a2c,
  awningYellow: 0xecc040,
  awningEdge: 0x2a5a38,
  foliageDark: 0x1f6a32,
  foliage: 0x3fa34c,
  flower: 0xe03d3d,
  flowerLight: 0xf65d50,
  produceRed: 0xd44a3a,
  produceGreen: 0x4a9a3a,
  produceYellow: 0xe8c040,
  producePurple: 0x7a4a8a,
  sack: 0xc8b070,
  ink: 0x2a2018,
  interior: 0x1a120c,
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
    plasterCrack: standard(PALETTE.plasterCrack, 0.96),
    timberDark: standard(PALETTE.timberDark, 0.74),
    timber: standard(PALETTE.timber, 0.68),
    timberLight: standard(PALETTE.timberLight, 0.62),
    yellowWood: standard(PALETTE.yellowWood, 0.58),
    yellowWoodLight: standard(PALETTE.yellowWoodLight, 0.52),
    yellowWoodDark: standard(PALETTE.yellowWoodDark, 0.64),
    roofDark: standard(PALETTE.roofDark, 0.8),
    roof: standard(PALETTE.roof, 0.74),
    roofLight: standard(PALETTE.roofLight, 0.68),
    stoneDark: standard(PALETTE.stoneDark, 0.9),
    stone: standard(PALETTE.stone, 0.84),
    stoneLight: standard(PALETTE.stoneLight, 0.78),
    brickDark: standard(PALETTE.brickDark, 0.88),
    brick: standard(PALETTE.brick, 0.82),
    brickLight: standard(PALETTE.brickLight, 0.76),
    door: standard(PALETTE.door, 0.55),
    doorDark: standard(PALETTE.doorDark, 0.6),
    doorLight: standard(PALETTE.doorLight, 0.5),
    iron: standard(PALETTE.iron, 0.34, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.28, 0.65),
    gold: standard(PALETTE.gold, 0.26, 0.62),
    glass: standard(PALETTE.glass, 0.22, 0, {
      transparent: true,
      opacity: 0.72,
      emissive: 0x88aacc,
      emissiveIntensity: 0.12,
    }),
    glassWarm: standard(PALETTE.glassWarm, 0.28, 0, {
      emissive: 0xffb84a,
      emissiveIntensity: 0.55,
    }),
    curtain: standard(PALETTE.curtain, 0.72),
    curtainShade: standard(PALETTE.curtainShade, 0.78),
    awningRed: standard(PALETTE.awningRed, 0.62),
    awningYellow: standard(PALETTE.awningYellow, 0.58),
    awningEdge: standard(PALETTE.awningEdge, 0.7),
    foliageDark: standard(PALETTE.foliageDark, 0.76),
    foliage: standard(PALETTE.foliage, 0.7),
    flower: standard(PALETTE.flower, 0.68),
    flowerLight: standard(PALETTE.flowerLight, 0.63),
    produceRed: standard(PALETTE.produceRed, 0.7),
    produceGreen: standard(PALETTE.produceGreen, 0.68),
    produceYellow: standard(PALETTE.produceYellow, 0.66),
    producePurple: standard(PALETTE.producePurple, 0.7),
    sack: standard(PALETTE.sack, 0.88),
    ink: standard(PALETTE.ink, 0.9),
    interior: standard(PALETTE.interior, 1),
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
 * Triangular gables face front (+Z) / rear (-Z). Not dual rotated slabs.
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
    [DIMS.width + 0.45, 0.28, DIMS.depth + 0.4],
    [0, 0.14, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.05,
  );
  for (let i = 0; i < 6; i += 1) {
    addBlock(
      group,
      `foundation.front-course.${i}`,
      [0.95, 0.22, 0.18],
      [-2.45 + i * 0.98, 0.14, DIMS.frontZ + 0.12],
      [materials.stoneDark, materials.stone, materials.stoneLight][i % 3],
      [0, 0, 0],
      0.03,
    );
  }
  for (let i = 0; i < 5; i += 1) {
    addBlock(
      group,
      `foundation.side-course.${i}`,
      [0.16, 0.2, 0.9],
      [DIMS.width / 2 + 0.18, 0.13, -1.8 + i * 0.95],
      [materials.stone, materials.stoneLight, materials.stoneDark][i % 3],
      [0, 0, 0],
      0.028,
    );
  }
}

function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'building-core');
  const coreW = DIMS.width - 0.35;
  const coreD = DIMS.depth - 0.35;
  addBlock(
    group,
    'shell.ground-storey',
    [coreW, DIMS.lowerHeight, coreD],
    [0, 0.28 + DIMS.lowerHeight / 2, 0],
    materials.plasterDeep,
    [0, 0, 0],
    0.04,
  );
  addBlock(
    group,
    'shell.upper-storey',
    [coreW, DIMS.upperHeight, coreD],
    [0, 0.28 + DIMS.lowerHeight + DIMS.upperHeight / 2, 0],
    materials.plasterShade,
    [0, 0, 0],
    0.04,
  );
  // Floor belt between storeys (subtle timber line)
  addBlock(
    group,
    'shell.floor-belt',
    [DIMS.width - 0.1, 0.16, DIMS.depth - 0.1],
    [0, 0.28 + DIMS.lowerHeight, 0],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
}

function addPlasterSkin(root, materials, nodes) {
  const group = createNode(root, nodes, 'plaster-skin');
  const fz = DIMS.frontZ + 0.02;
  const halfW = DIMS.width / 2;
  const halfD = DIMS.depth / 2;

  // Front plaster panels (proud of core, leave openings for door/window)
  addBlock(
    group,
    'skin.front.upper',
    [DIMS.width - 0.08, DIMS.upperHeight - 0.12, 0.12],
    [0, 0.28 + DIMS.lowerHeight + DIMS.upperHeight / 2 + 0.02, fz],
    materials.plaster,
    [0, 0, 0],
    0.03,
  );
  // Front lower left of door
  addBlock(
    group,
    'skin.front.lower-left',
    [1.15, DIMS.lowerHeight - 0.2, 0.12],
    [-halfW + 0.72, 0.28 + DIMS.lowerHeight / 2, fz],
    materials.plaster,
    [0, 0, 0],
    0.03,
  );
  // Front lower right of shop window area
  addBlock(
    group,
    'skin.front.lower-right',
    [1.05, DIMS.lowerHeight - 0.2, 0.12],
    [halfW - 0.7, 0.28 + DIMS.lowerHeight / 2, fz],
    materials.plaster,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'skin.front.mid-under-window',
    [1.9, 0.55, 0.12],
    [0.55, 0.55, fz],
    materials.plasterShade,
    [0, 0, 0],
    0.025,
  );

  // Side skins
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `skin.side.${side < 0 ? 'L' : 'R'}.lower`,
      [0.12, DIMS.lowerHeight - 0.1, DIMS.depth - 0.2],
      [side * (halfW + 0.01), 0.28 + DIMS.lowerHeight / 2, 0],
      materials.plaster,
      [0, 0, 0],
      0.03,
    );
    addBlock(
      group,
      `skin.side.${side < 0 ? 'L' : 'R'}.upper`,
      [0.12, DIMS.upperHeight - 0.1, DIMS.depth - 0.2],
      [side * (halfW + 0.01), 0.28 + DIMS.lowerHeight + DIMS.upperHeight / 2, 0],
      materials.plasterShade,
      [0, 0, 0],
      0.03,
    );
  }

  // Rear skin
  addBlock(
    group,
    'skin.rear',
    [DIMS.width - 0.1, DIMS.lowerHeight + DIMS.upperHeight - 0.15, 0.12],
    [0, 0.28 + (DIMS.lowerHeight + DIMS.upperHeight) / 2, -halfD - 0.01],
    materials.plasterShade,
    [0, 0, 0],
    0.03,
  );

  // Subtle cracks / wear patches
  const cracks = [
    [-1.8, 1.4, fz + 0.04, 0.55, 0.08, 0.04],
    [1.9, 2.1, fz + 0.04, 0.35, 0.06, 0.04],
    [-2.2, 4.0, fz + 0.04, 0.45, 0.07, 0.04],
    [2.0, 3.8, fz + 0.04, 0.3, 0.06, 0.04],
    [-halfW - 0.04, 1.8, 0.6, 0.06, 0.5, 0.04],
    [-halfW - 0.04, 3.6, -0.4, 0.05, 0.4, 0.04],
  ];
  cracks.forEach((c, i) => {
    addBlock(
      group,
      `skin.crack.${i}`,
      [c[3], c[4], c[5]],
      [c[0], c[1], c[2]],
      materials.plasterCrack,
      [0, 0, i % 2 ? 0.2 : -0.15],
      0.015,
    );
  });

  // Corner timber posts (subtle, not full half-timber)
  for (const [sx, sz] of [
    [-halfW + 0.08, fz - 0.02],
    [halfW - 0.08, fz - 0.02],
    [-halfW + 0.08, -halfD + 0.08],
    [halfW - 0.08, -halfD + 0.08],
  ]) {
    addBlock(
      group,
      `skin.corner.${sx > 0 ? 'R' : 'L'}.${sz > 0 ? 'F' : 'B'}`,
      [0.16, DIMS.lowerHeight + DIMS.upperHeight - 0.1, 0.16],
      [sx, 0.28 + (DIMS.lowerHeight + DIMS.upperHeight) / 2, sz],
      materials.timberDark,
      [0, 0, 0],
      0.03,
    );
  }

  // Eave timber band
  addBlock(
    group,
    'skin.eave-front',
    [DIMS.width + 0.1, 0.2, 0.18],
    [0, DIMS.eaveY - 0.08, fz + 0.04],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'skin.eave-back',
    [DIMS.width + 0.1, 0.2, 0.18],
    [0, DIMS.eaveY - 0.08, -halfD - 0.04],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
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
  roof.userData.isSolidGableRoof = true;
  group.add(roof);
  nodes.roofSolid = roof;

  addBlock(
    group,
    'roof.fascia-front',
    [DIMS.roofWidth + 0.08, 0.14, 0.12],
    [0, DIMS.eaveY - 0.02, DIMS.roofDepth / 2 + 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-back',
    [DIMS.roofWidth + 0.08, 0.14, 0.12],
    [0, DIMS.eaveY - 0.02, -DIMS.roofDepth / 2 - 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Gable infill plaster under eaves (front/rear triangles visible at ends)
  for (const face of [-1, 1]) {
    const infill = createMesh(
      createGableInfillGeometry(DIMS.width - 0.2, DIMS.roofRise * 0.92, 0.14),
      materials.plaster,
      `roof.gable-infill.${face > 0 ? 'front' : 'rear'}`,
    );
    infill.position.set(0, DIMS.eaveY - 0.05, face * (DIMS.depth / 2 - 0.05));
    group.add(infill);
  }

  // Tile relief rows
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
      const y =
        DIMS.eaveY - 0.08 + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.09;
      const stagger = row % 2 ? tileDepth * 0.35 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.12;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 3];
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

  for (let index = 0; index < 11; index += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 11) * (index + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${index}`,
      [0.36, 0.28, DIMS.roofDepth / 11.5],
      [0, DIMS.eaveY + DIMS.roofRise - 0.02, z],
      index % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.045,
      3,
    );
  }
}

function addChimney(root, materials, nodes) {
  const group = createNode(root, nodes, 'chimney');
  const cx = 1.55;
  const cz = -0.55;
  const baseY = DIMS.eaveY + 0.35;

  addBlock(group, 'chimney.base', [0.72, 0.55, 0.72], [cx, baseY, cz], materials.brickDark, [0, 0, 0], 0.04);
  addBlock(group, 'chimney.shaft', [0.58, 1.35, 0.58], [cx, baseY + 0.9, cz], materials.brick, [0, 0, 0], 0.04);
  addBlock(group, 'chimney.cap', [0.72, 0.16, 0.72], [cx, baseY + 1.65, cz], materials.brickLight, [0, 0, 0], 0.03);
  addBlock(group, 'chimney.lip', [0.42, 0.18, 0.42], [cx, baseY + 1.82, cz], materials.brickDark, [0, 0, 0], 0.025);

  // Brick course details
  for (let i = 0; i < 4; i += 1) {
    addBlock(
      group,
      `chimney.course.${i}`,
      [0.62, 0.08, 0.62],
      [cx, baseY + 0.35 + i * 0.32, cz],
      i % 2 ? materials.brickLight : materials.brickDark,
      [0, 0, 0],
      0.02,
    );
  }
  nodes.chimneyTop = group;
}

function createMullionWindow(materials, name, width, height, cols = 2, rows = 2, warm = false) {
  const group = new THREE.Group();
  group.name = name;

  addBlock(
    group,
    `${name}.recess`,
    [width + 0.18, height + 0.18, 0.08],
    [0, 0, -0.02],
    materials.interior,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    `${name}.glass`,
    [width, height, 0.05],
    [0, 0, 0.02],
    warm ? materials.glassWarm : materials.glass,
    [0, 0, 0],
    0.015,
  );
  addBlock(
    group,
    `${name}.frame`,
    [width + 0.2, height + 0.2, 0.12],
    [0, 0, 0.04],
    materials.timber,
    [0, 0, 0],
    0.025,
  );
  // Hollow frame look: keep frame as border blocks instead of solid covering glass
  // top/bottom/sides already implied by outer frame thickness via overlay strips:
  addBlock(group, `${name}.sill`, [width + 0.28, 0.1, 0.16], [0, -height / 2 - 0.06, 0.06], materials.timberDark, [0, 0, 0], 0.02);
  addBlock(group, `${name}.lintel`, [width + 0.24, 0.1, 0.14], [0, height / 2 + 0.06, 0.05], materials.timberDark, [0, 0, 0], 0.02);

  // Mullions
  for (let c = 1; c < cols; c += 1) {
    const x = -width / 2 + (width * c) / cols;
    addBlock(group, `${name}.mullion.v.${c}`, [0.05, height, 0.06], [x, 0, 0.05], materials.timberDark, [0, 0, 0], 0.012);
  }
  for (let r = 1; r < rows; r += 1) {
    const y = -height / 2 + (height * r) / rows;
    addBlock(group, `${name}.mullion.h.${r}`, [width, 0.05, 0.06], [0, y, 0.05], materials.timberDark, [0, 0, 0], 0.012);
  }

  return group;
}

function createShopWindow(materials, name) {
  const group = new THREE.Group();
  group.name = name;
  const width = 1.85;
  const height = 1.45;

  addBlock(group, `${name}.recess`, [width + 0.22, height + 0.22, 0.1], [0, 0, -0.03], materials.interior, [0, 0, 0], 0.02);
  addBlock(group, `${name}.glass`, [width, height, 0.06], [0, 0, 0.02], materials.glassWarm, [0, 0, 0], 0.015);

  // Outer frame
  addBlock(group, `${name}.frame.top`, [width + 0.22, 0.12, 0.14], [0, height / 2 + 0.05, 0.05], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, `${name}.frame.bot`, [width + 0.22, 0.12, 0.14], [0, -height / 2 - 0.05, 0.05], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, `${name}.frame.left`, [0.12, height, 0.14], [-width / 2 - 0.05, 0, 0.05], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, `${name}.frame.right`, [0.12, height, 0.14], [width / 2 + 0.05, 0, 0.05], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, `${name}.sill`, [width + 0.35, 0.12, 0.22], [0, -height / 2 - 0.14, 0.08], materials.timberDark, [0, 0, 0], 0.025);

  // 3x3 mullions
  for (let c = 1; c < 3; c += 1) {
    const x = -width / 2 + (width * c) / 3;
    addBlock(group, `${name}.mullion.v.${c}`, [0.055, height, 0.07], [x, 0, 0.05], materials.timberDark, [0, 0, 0], 0.012);
  }
  for (let r = 1; r < 3; r += 1) {
    const y = -height / 2 + (height * r) / 3;
    addBlock(group, `${name}.mullion.h.${r}`, [width, 0.055, 0.07], [0, y, 0.05], materials.timberDark, [0, 0, 0], 0.012);
  }

  // Yellow curtains behind glass (two panels)
  addBlock(group, `${name}.curtain.L`, [0.42, height * 0.85, 0.04], [-width * 0.28, 0.02, -0.01], materials.curtain, [0, 0, 0], 0.02);
  addBlock(group, `${name}.curtain.R`, [0.42, height * 0.85, 0.04], [width * 0.28, 0.02, -0.01], materials.curtainShade, [0, 0, 0], 0.02);
  addBlock(group, `${name}.curtain.rod`, [width * 0.92, 0.04, 0.04], [0, height * 0.42, 0], materials.timberDark, [0, 0, 0], 0.01);

  return group;
}

function addWindows(root, materials, nodes) {
  const group = createNode(root, nodes, 'windows');
  const fz = DIMS.frontZ + 0.12;

  const shop = createShopWindow(materials, 'window.shop');
  shop.position.set(0.72, 1.55, fz);
  group.add(shop);
  nodes.shopWindow = shop;

  const upperFront = createMullionWindow(materials, 'window.upper-front', 0.85, 0.95, 2, 2, false);
  upperFront.position.set(0.15, 4.15, fz);
  group.add(upperFront);

  // Left side windows
  const sideX = -DIMS.width / 2 - 0.08;
  const upperSide = createMullionWindow(materials, 'window.side-upper', 0.72, 0.85, 2, 2, false);
  upperSide.position.set(sideX, 4.05, -0.15);
  upperSide.rotation.y = -Math.PI / 2;
  group.add(upperSide);

  const lowerSide = createMullionWindow(materials, 'window.side-lower', 0.65, 0.78, 2, 2, false);
  lowerSide.position.set(sideX, 1.55, -0.55);
  lowerSide.rotation.y = -Math.PI / 2;
  group.add(lowerSide);

  // Right side small upper
  const rightX = DIMS.width / 2 + 0.08;
  const rightUpper = createMullionWindow(materials, 'window.right-upper', 0.7, 0.8, 2, 2, false);
  rightUpper.position.set(rightX, 4.1, 0.2);
  rightUpper.rotation.y = Math.PI / 2;
  group.add(rightUpper);
}

function addDoor(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'door-system');
  const fz = DIMS.frontZ + 0.1;
  const doorW = 1.05;
  const doorH = 2.05;
  const doorX = -1.15;
  const doorY = 0.28 + doorH / 2 + 0.02;

  const hinge = new THREE.Group();
  hinge.name = 'socket.doorHinge';
  hinge.position.set(doorX - doorW / 2 + 0.04, doorY, fz);
  group.add(hinge);
  sockets.doorHinge = hinge;

  const leaf = new THREE.Group();
  leaf.name = 'door.leaf';
  leaf.position.set(doorW / 2 - 0.04, 0, 0);
  hinge.add(leaf);

  addBlock(leaf, 'door.panel', [doorW, doorH, 0.1], [0, 0, 0], materials.door, [0, 0, 0], 0.035);
  addBlock(leaf, 'door.panel-inset', [doorW * 0.72, doorH * 0.55, 0.04], [0, -0.15, 0.04], materials.doorDark, [0, 0, 0], 0.02);

  // Circular cross window
  addCylinder(leaf, 'door.round-frame', 0.28, 0.28, 0.08, [0, 0.45, 0.06], materials.doorLight, 16, [Math.PI / 2, 0, 0]);
  addCylinder(leaf, 'door.round-glass', 0.22, 0.22, 0.05, [0, 0.45, 0.08], materials.glass, 14, [Math.PI / 2, 0, 0]);
  addBlock(leaf, 'door.cross-v', [0.05, 0.44, 0.04], [0, 0.45, 0.1], materials.timberDark, [0, 0, 0], 0.01);
  addBlock(leaf, 'door.cross-h', [0.44, 0.05, 0.04], [0, 0.45, 0.1], materials.timberDark, [0, 0, 0], 0.01);

  // Knob
  addSphere(leaf, 'door.knob', 0.07, [doorW * 0.32, -0.05, 0.1], materials.gold, 10);
  addCylinder(leaf, 'door.knob-stem', 0.025, 0.025, 0.08, [doorW * 0.32, -0.05, 0.05], materials.iron, 8, [Math.PI / 2, 0, 0]);

  // Frame + green-ish jamb accent
  addBlock(group, 'door.frame.left', [0.12, doorH + 0.15, 0.14], [doorX - doorW / 2 - 0.05, doorY, fz], materials.timberDark, [0, 0, 0], 0.02);
  addBlock(group, 'door.frame.right', [0.12, doorH + 0.15, 0.14], [doorX + doorW / 2 + 0.05, doorY, fz], materials.awningEdge, [0, 0, 0], 0.02);
  addBlock(group, 'door.frame.top', [doorW + 0.3, 0.14, 0.14], [doorX, doorY + doorH / 2 + 0.08, fz], materials.timberDark, [0, 0, 0], 0.02);
}

function addPorch(root, materials, nodes) {
  const group = createNode(root, nodes, 'porch');
  const deckZ = DIMS.frontZ + DIMS.porchDepth / 2 + 0.05;
  const deckY = DIMS.porchY;
  const deckW = DIMS.width * 0.98;
  const deckD = DIMS.porchDepth;

  // Deck boards
  addBlock(group, 'porch.deck', [deckW, 0.12, deckD], [0, deckY, deckZ], materials.timberLight, [0, 0, 0], 0.03);
  addBlock(group, 'porch.skirt', [deckW + 0.08, 0.22, 0.12], [0, deckY - 0.12, deckZ + deckD / 2 - 0.02], materials.timberDark, [0, 0, 0], 0.025);
  for (let i = 0; i < 8; i += 1) {
    addBlock(
      group,
      `porch.board-line.${i}`,
      [deckW * 0.96, 0.02, 0.03],
      [0, deckY + 0.065, deckZ - deckD / 2 + 0.12 + i * (deckD / 8)],
      materials.timberDark,
      [0, 0, 0],
      0.008,
    );
  }

  // Steps (center-front)
  addBlock(group, 'porch.step.lower', [1.15, 0.12, 0.38], [0.35, 0.08, deckZ + deckD / 2 + 0.15], materials.timber, [0, 0, 0], 0.025);
  addBlock(group, 'porch.step.upper', [1.0, 0.1, 0.28], [0.35, 0.18, deckZ + deckD / 2 + 0.02], materials.timberLight, [0, 0, 0], 0.022);

  // Posts
  const postY = deckY + 1.15;
  const postH = 2.15;
  const postZ = deckZ + deckD / 2 - 0.12;
  for (const x of [-deckW * 0.42, deckW * 0.42]) {
    addBlock(group, `porch.post.${x > 0 ? 'R' : 'L'}`, [0.16, postH, 0.16], [x, postY, postZ], materials.timber, [0, 0, 0], 0.03);
    addBlock(group, `porch.post-base.${x > 0 ? 'R' : 'L'}`, [0.22, 0.12, 0.22], [x, deckY + 0.1, postZ], materials.timberDark, [0, 0, 0], 0.02);
    addBlock(group, `porch.post-cap.${x > 0 ? 'R' : 'L'}`, [0.22, 0.1, 0.22], [x, postY + postH / 2 - 0.02, postZ], materials.timberDark, [0, 0, 0], 0.02);
  }
  // Rear porch posts against facade
  const rearPostZ = DIMS.frontZ + 0.2;
  for (const x of [-deckW * 0.42, deckW * 0.42]) {
    addBlock(group, `porch.post-rear.${x > 0 ? 'R' : 'L'}`, [0.14, postH * 0.95, 0.14], [x, postY - 0.05, rearPostZ], materials.timberDark, [0, 0, 0], 0.025);
  }

  // Beam
  addBlock(
    group,
    'porch.beam',
    [deckW * 0.92, 0.14, 0.14],
    [0, postY + postH / 2 - 0.05, postZ - 0.15],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Striped awning (red / yellow)
  const awningGroup = createNode(group, nodes, 'awning');
  const awningY = postY + postH / 2 + 0.08;
  const awningZ = deckZ + 0.05;
  const stripeCount = 8;
  const stripeW = (deckW * 0.95) / stripeCount;
  for (let i = 0; i < stripeCount; i += 1) {
    const x = -deckW * 0.95 / 2 + stripeW * (i + 0.5);
    addBlock(
      awningGroup,
      `awning.stripe.${i}`,
      [stripeW * 0.98, 0.08, deckD * 0.95],
      [x, awningY, awningZ],
      i % 2 === 0 ? materials.awningRed : materials.awningYellow,
      [0.08, 0, 0],
      0.02,
    );
  }
  // Green edge binding
  addBlock(
    awningGroup,
    'awning.edge-front',
    [deckW * 0.96, 0.1, 0.1],
    [0, awningY - 0.02, awningZ + deckD * 0.45],
    materials.awningEdge,
    [0.08, 0, 0],
    0.02,
  );
  addBlock(
    awningGroup,
    'awning.edge-left',
    [0.1, 0.1, deckD * 0.95],
    [-deckW * 0.47, awningY, awningZ],
    materials.awningEdge,
    [0.08, 0, 0],
    0.02,
  );
  addBlock(
    awningGroup,
    'awning.edge-right',
    [0.1, 0.1, deckD * 0.95],
    [deckW * 0.47, awningY, awningZ],
    materials.awningEdge,
    [0.08, 0, 0],
    0.02,
  );
  // Slight slope: tilt whole awning
  awningGroup.rotation.x = -0.12;
}

function addBarrel(parent, materials, name, position, scale = 1) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.scale.setScalar(scale);

  addCylinder(group, `${name}.body`, 0.28, 0.3, 0.72, [0, 0.36, 0], materials.timber, 14);
  addCylinder(group, `${name}.bulge`, 0.32, 0.32, 0.22, [0, 0.38, 0], materials.timberLight, 14);
  addCylinder(group, `${name}.lid`, 0.27, 0.27, 0.06, [0, 0.74, 0], materials.timberDark, 12);
  addCylinder(group, `${name}.hoop.top`, 0.31, 0.31, 0.04, [0, 0.62, 0], materials.iron, 14);
  addCylinder(group, `${name}.hoop.mid`, 0.33, 0.33, 0.04, [0, 0.38, 0], materials.iron, 14);
  addCylinder(group, `${name}.hoop.bot`, 0.31, 0.31, 0.04, [0, 0.14, 0], materials.iron, 14);
  // FLOUR label plate
  addBlock(group, `${name}.label`, [0.28, 0.14, 0.04], [0, 0.36, 0.31], materials.sack, [0, 0, 0], 0.015);
  addBlock(group, `${name}.label-ink`, [0.2, 0.05, 0.02], [0, 0.36, 0.34], materials.ink, [0, 0, 0], 0.008);

  parent.add(group);
  return group;
}

function addCrate(parent, materials, name, position, size = [0.55, 0.45, 0.5], produce = true) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  const [w, h, d] = size;

  addBlock(group, `${name}.box`, [w, h, d], [0, h / 2, 0], materials.timberLight, [0, 0, 0], 0.03);
  addBlock(group, `${name}.rim`, [w + 0.04, 0.06, d + 0.04], [0, h - 0.02, 0], materials.timber, [0, 0, 0], 0.015);
  // slat lines
  for (let i = 0; i < 3; i += 1) {
    addBlock(
      group,
      `${name}.slat.${i}`,
      [0.03, h * 0.85, d * 0.95],
      [-w * 0.3 + i * w * 0.3, h / 2, 0.01],
      materials.timberDark,
      [0, 0, 0],
      0.008,
    );
  }

  if (produce) {
    const produceMats = [
      materials.produceRed,
      materials.produceGreen,
      materials.produceYellow,
      materials.producePurple,
    ];
    for (let i = 0; i < 6; i += 1) {
      const px = ((i % 3) - 1) * w * 0.22;
      const pz = (Math.floor(i / 3) - 0.5) * d * 0.28;
      addSphere(
        group,
        `${name}.produce.${i}`,
        0.08 + (i % 3) * 0.015,
        [px, h + 0.06, pz],
        produceMats[i % produceMats.length],
        8,
        [1, 0.85, 1],
      );
    }
  }

  parent.add(group);
  return group;
}

function addPorchProps(root, materials, nodes) {
  const group = createNode(root, nodes, 'porch-props');
  const deckZ = DIMS.frontZ + DIMS.porchDepth / 2 + 0.05;
  const deckY = DIMS.porchY + 0.06;

  const barrel = addBarrel(group, materials, 'prop.flour-barrel', [-2.0, deckY, deckZ + 0.15], 0.95);
  nodes.barrel = barrel;

  const crateStack = createNode(group, nodes, 'crate-stack');
  addCrate(crateStack, materials, 'prop.crate.low-front', [1.35, deckY, deckZ + 0.25], [0.5, 0.38, 0.48], true);
  addCrate(crateStack, materials, 'prop.crate.low-back', [1.85, deckY, deckZ - 0.15], [0.48, 0.36, 0.46], true);
  addCrate(crateStack, materials, 'prop.crate.stack-top', [1.85, deckY + 0.38, deckZ - 0.1], [0.52, 0.42, 0.5], true);
  addCrate(crateStack, materials, 'prop.crate.side-small', [2.2, deckY, deckZ + 0.35], [0.38, 0.3, 0.36], false);
}

function addFlowerBox(root, materials, nodes) {
  const group = createNode(root, nodes, 'flower-box');
  const sideX = -DIMS.width / 2 - 0.02;
  // Under upper side window
  addBlock(group, 'planter.box', [0.28, 0.22, 0.75], [sideX, 3.35, -0.15], materials.timber, [0, 0, 0], 0.03);
  addBlock(group, 'planter.soil', [0.22, 0.08, 0.65], [sideX - 0.02, 3.48, -0.15], materials.timberDark, [0, 0, 0], 0.02);
  addSphere(group, 'planter.foliage.a', 0.16, [sideX - 0.05, 3.6, -0.3], materials.foliage, 8, [1.2, 0.9, 1]);
  addSphere(group, 'planter.foliage.b', 0.14, [sideX - 0.05, 3.58, 0], materials.foliageDark, 8, [1.1, 0.85, 1]);
  for (let i = 0; i < 5; i += 1) {
    addSphere(
      group,
      `planter.flower.${i}`,
      0.06,
      [sideX - 0.08, 3.68, -0.35 + i * 0.15],
      i % 2 ? materials.flowerLight : materials.flower,
      7,
    );
  }
}

function addSign(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'sign-rig');
  const fz = DIMS.frontZ + 0.15;
  // Bracket on upper front-right
  const anchorX = 1.55;
  const anchorY = 4.35;

  addBlock(group, 'sign.bracket-plate', [0.18, 0.28, 0.08], [anchorX, anchorY, fz], materials.iron, [0, 0, 0], 0.02);
  addBlock(group, 'sign.arm', [0.1, 0.1, 0.85], [anchorX, anchorY + 0.08, fz + 0.4], materials.iron, [0, 0, 0], 0.02);
  addBlock(group, 'sign.arm-brace', [0.06, 0.35, 0.06], [anchorX, anchorY - 0.05, fz + 0.15], materials.ironLight, [0.6, 0, 0], 0.015);

  const swing = new THREE.Group();
  swing.name = 'socket.signSwing';
  swing.position.set(anchorX, anchorY + 0.02, fz + 0.78);
  group.add(swing);
  sockets.signSwing = swing;

  // Yellow wood board (slightly irregular / multi-plank)
  addBlock(swing, 'sign.board', [0.12, 1.15, 0.95], [0, -0.55, 0], materials.yellowWood, [0, 0, 0], 0.04);
  addBlock(swing, 'sign.board.plank-top', [0.06, 0.35, 0.9], [0.05, -0.25, 0], materials.yellowWoodLight, [0, 0, 0], 0.025);
  addBlock(swing, 'sign.board.plank-bot', [0.06, 0.4, 0.88], [0.05, -0.85, 0], materials.yellowWoodDark, [0, 0, 0], 0.025);
  addBlock(swing, 'sign.border', [0.08, 1.25, 1.05], [-0.02, -0.55, 0], materials.timberDark, [0, 0, 0], 0.03);

  // Text bars (GENERAL / STORE as simple black blocks)
  addBlock(swing, 'sign.text.general', [0.05, 0.1, 0.72], [0.1, -0.22, 0], materials.ink, [0, 0, 0], 0.01);
  addBlock(swing, 'sign.text.store', [0.05, 0.1, 0.55], [0.1, -0.42, 0], materials.ink, [0, 0, 0], 0.01);

  // Icon: crate + sack
  addBlock(swing, 'sign.icon.crate', [0.08, 0.22, 0.22], [0.1, -0.75, -0.18], materials.timber, [0, 0, 0], 0.02);
  addSphere(swing, 'sign.icon.produce', 0.06, [0.14, -0.62, -0.18], materials.produceRed, 6);
  addBlock(swing, 'sign.icon.sack', [0.1, 0.26, 0.18], [0.1, -0.78, 0.2], materials.sack, [0, 0, 0], 0.025);
  addBlock(swing, 'sign.icon.sack-tie', [0.06, 0.06, 0.1], [0.12, -0.62, 0.2], materials.timberDark, [0, 0, 0], 0.01);

  // Chains / hangers
  addCylinder(swing, 'sign.chain.L', 0.02, 0.02, 0.18, [0, -0.02, -0.28], materials.iron, 6);
  addCylinder(swing, 'sign.chain.R', 0.02, 0.02, 0.18, [0, -0.02, 0.28], materials.iron, 6);
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
        center: [0, 0.14, 0],
        size: [DIMS.width + 0.45, 0.28, DIMS.depth + 0.4],
        isTrigger: false,
      },
      building: {
        type: 'box',
        center: [0, 2.9, 0],
        size: [DIMS.width, 5.4, DIMS.depth],
        isTrigger: false,
      },
      roof: {
        type: 'closed-gable-prism',
        center: [0, DIMS.eaveY + DIMS.roofRise / 2, 0],
        size: [DIMS.roofWidth, DIMS.roofRise, DIMS.roofDepth],
        isTrigger: false,
      },
      porch: {
        type: 'box',
        center: [0, DIMS.porchY, DIMS.frontZ + DIMS.porchDepth / 2],
        size: [DIMS.width, 0.35, DIMS.porchDepth],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [1.55, 3.8, DIMS.frontZ + 0.9],
        size: [1.2, 1.6, 1.0],
        isTrigger: true,
      },
      doorInteraction: {
        type: 'box',
        center: [-1.15, 1.3, DIMS.frontZ + 0.3],
        size: [1.4, 2.4, 1.0],
        isTrigger: true,
      },
    },
    destructionGroups: {
      plaster: [
        ...collectMeshes(nodes['building-core']),
        ...collectMeshes(nodes['plaster-skin']),
      ],
      roof: collectMeshes(nodes.roof),
      chimney: collectMeshes(nodes.chimney),
      porch: collectMeshes(nodes.porch),
      glazing: collectMeshes(nodes.windows).filter((m) => /glass|curtain/.test(m.name)),
      sign: collectMeshes(nodes['sign-rig']),
      props: [
        ...collectMeshes(nodes['porch-props']),
        ...collectMeshes(nodes['flower-box']),
        ...collectMeshes(nodes['door-system']),
      ],
    },
    animation: {
      door: {
        node: sockets.doorHinge,
        axis: [0, 1, 0],
        range: [-Math.PI * 0.45, 0],
      },
      hangingSign: {
        node: sockets.signSwing,
        axis: [1, 0, 0],
        range: [-0.1, 0.1],
      },
    },
    sources: [
      'public/content/buildings/general_shop/ref_main.png',
      'public/content/buildings/general_shop/ref_front.png',
      'public/content/buildings/general_shop/ref_side.png',
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
 * Procedural General Store v1 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism roof, ridge along depth (Z)
 * - cream plaster shell, red clay tiles, yellow hanging sign
 * - porch with striped awning, crates, flour barrel
 * - teal door, shop window, flower box, chimney
 * - sculptRuntime with sockets / colliders / destruction groups
 * - gen = img2threejs-general_shop-v1, name = hero.shop.general.v1
 */
export function createGeneralShopModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.shop.general.v1';
  root.userData.assetId = 'img2threejs-general_shop-v1';
  root.userData.gen = 'img2threejs-general_shop-v1';
  root.userData.heroVersion = 'img2threejs-general_shop-v1';
  root.userData.generator = 'img2threejs-forge-authored-v1';
  root.userData.heroMode = 'agent-gen';
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
  addPlasterSkin(root, materials, nodes);
  addRoof(root, materials, nodes);
  addChimney(root, materials, nodes);
  addWindows(root, materials, nodes);
  addDoor(root, materials, nodes, sockets);
  addPorch(root, materials, nodes);
  addPorchProps(root, materials, nodes);
  addFlowerBox(root, materials, nodes);
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

export const createGeneralShopHero = createGeneralShopModel;
export default createGeneralShopModel;
