import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Village general store — img2threejs v2
 *
 * Quality bar: inn-v3 / guild-v2 density.
 * v1 failed user QA: blank walls, weak porch/awning, weak yellow sign,
 * missing crate/barrel presence, flat door/window frames.
 *
 * Identity: cream plaster panelized half-timber EVERY face, red clay gable
 * (solid closed prism, ridge along Z), proud multi-plank yellow "GENERAL STORE"
 * sign, thick striped red/yellow awning porch, teal door with round cross
 * window, shop bay window + curtains, dense crates + flour barrel, flower box,
 * brick chimney, readable tile rows.
 */

const DIMS = Object.freeze({
  width: 5.8,
  depth: 4.8,
  lowerHeight: 2.85,
  upperHeight: 2.55,
  eaveY: 5.75,
  roofWidth: 6.55,
  roofDepth: 5.45,
  roofRise: 2.15,
  frontZ: 2.4,
  porchDepth: 1.85,
  porchY: 0.32,
});

const PALETTE = Object.freeze({
  plaster: 0xf4ead6,
  plasterShade: 0xe6d9c3,
  plasterDeep: 0xd5c6ae,
  plasterCrack: 0xc8b598,
  timberDark: 0x4a2a16,
  timber: 0x7a4a28,
  timberLight: 0xb0703c,
  yellowWood: 0xe8b838,
  yellowWoodLight: 0xf6d05a,
  yellowWoodDark: 0xb88824,
  roofDark: 0x9c2e24,
  roof: 0xc24434,
  roofLight: 0xdc5e48,
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
  goldLight: 0xe8c36d,
  glass: 0xb8d0e0,
  glassWarm: 0xf0d090,
  curtain: 0xf0c860,
  curtainShade: 0xd8a848,
  awningRed: 0xd03828,
  awningYellow: 0xf0c838,
  awningEdge: 0x2a5a38,
  awningEdgeLight: 0x3a7a4a,
  foliageDark: 0x1f6a32,
  foliage: 0x3fa34c,
  foliageLight: 0x6fc45d,
  flower: 0xe03d3d,
  flowerLight: 0xf65d50,
  produceRed: 0xd44a3a,
  produceGreen: 0x4a9a3a,
  produceYellow: 0xe8c040,
  producePurple: 0x7a4a8a,
  produceOrange: 0xe07830,
  sack: 0xc8b070,
  sackDark: 0xa89050,
  ink: 0x1e1812,
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
    yellowWood: standard(PALETTE.yellowWood, 0.55),
    yellowWoodLight: standard(PALETTE.yellowWoodLight, 0.48),
    yellowWoodDark: standard(PALETTE.yellowWoodDark, 0.62),
    roofDark: standard(PALETTE.roofDark, 0.8),
    roof: standard(PALETTE.roof, 0.74),
    roofLight: standard(PALETTE.roofLight, 0.68),
    stoneDark: standard(PALETTE.stoneDark, 0.9),
    stone: standard(PALETTE.stone, 0.84),
    stoneLight: standard(PALETTE.stoneLight, 0.78),
    brickDark: standard(PALETTE.brickDark, 0.88),
    brick: standard(PALETTE.brick, 0.82),
    brickLight: standard(PALETTE.brickLight, 0.76),
    door: standard(PALETTE.door, 0.52),
    doorDark: standard(PALETTE.doorDark, 0.58),
    doorLight: standard(PALETTE.doorLight, 0.48),
    iron: standard(PALETTE.iron, 0.34, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.28, 0.65),
    gold: standard(PALETTE.gold, 0.26, 0.62),
    goldLight: standard(PALETTE.goldLight, 0.22, 0.66),
    glass: standard(PALETTE.glass, 0.22, 0, {
      transparent: true,
      opacity: 0.72,
      emissive: 0x88aacc,
      emissiveIntensity: 0.14,
    }),
    glassWarm: standard(PALETTE.glassWarm, 0.26, 0, {
      emissive: 0xffb84a,
      emissiveIntensity: 0.7,
    }),
    curtain: standard(PALETTE.curtain, 0.72),
    curtainShade: standard(PALETTE.curtainShade, 0.78),
    awningRed: standard(PALETTE.awningRed, 0.58),
    awningYellow: standard(PALETTE.awningYellow, 0.52),
    awningEdge: standard(PALETTE.awningEdge, 0.7),
    awningEdgeLight: standard(PALETTE.awningEdgeLight, 0.66),
    foliageDark: standard(PALETTE.foliageDark, 0.76),
    foliage: standard(PALETTE.foliage, 0.7),
    foliageLight: standard(PALETTE.foliageLight, 0.65),
    flower: standard(PALETTE.flower, 0.68),
    flowerLight: standard(PALETTE.flowerLight, 0.63),
    produceRed: standard(PALETTE.produceRed, 0.7),
    produceGreen: standard(PALETTE.produceGreen, 0.68),
    produceYellow: standard(PALETTE.produceYellow, 0.66),
    producePurple: standard(PALETTE.producePurple, 0.7),
    produceOrange: standard(PALETTE.produceOrange, 0.68),
    sack: standard(PALETTE.sack, 0.88),
    sackDark: standard(PALETTE.sackDark, 0.9),
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

function addTube(parent, name, points, radius, material, tubularSegments = 16) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    'centripetal',
  );
  const result = createMesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false),
    material,
    name,
  );
  parent.add(result);
  return result;
}

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

function addCurvedBrace(parent, name, start, control, end, z, material, radius = 0.07) {
  return addTube(
    parent,
    name,
    [
      [start[0], start[1], z],
      [control[0], control[1], z],
      [end[0], end[1], z],
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

function addPlasterPanel(parent, name, width, height, x, y, z, materials, materialKey = 'plaster') {
  return addBlock(
    parent,
    name,
    [width, height, 0.11],
    [x, y, z],
    materials[materialKey] || materials.plaster,
    [0, 0, 0],
    0.02,
  );
}

function addFoundation(root, materials, nodes) {
  const group = createNode(root, nodes, 'foundation');
  addBlock(
    group,
    'foundation.stone-plinth',
    [DIMS.width + 0.55, 0.32, DIMS.depth + 0.5],
    [0, 0.16, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.055,
  );
  for (let i = 0; i < 7; i += 1) {
    addBlock(
      group,
      `foundation.front-course.${i}`,
      [0.9, 0.24, 0.2],
      [-2.7 + i * 0.9, 0.16, DIMS.frontZ + 0.14],
      [materials.stoneDark, materials.stone, materials.stoneLight][i % 3],
      [0, 0, 0],
      0.03,
    );
  }
  for (let i = 0; i < 6; i += 1) {
    addBlock(
      group,
      `foundation.side-course.${i}`,
      [0.18, 0.22, 0.85],
      [DIMS.width / 2 + 0.2, 0.15, -2.0 + i * 0.85],
      [materials.stone, materials.stoneLight, materials.stoneDark][i % 3],
      [0, 0, 0],
      0.028,
    );
    addBlock(
      group,
      `foundation.side-course.L.${i}`,
      [0.18, 0.22, 0.85],
      [-(DIMS.width / 2 + 0.2), 0.15, -2.0 + i * 0.85],
      [materials.stoneLight, materials.stoneDark, materials.stone][i % 3],
      [0, 0, 0],
      0.028,
    );
  }
  for (let i = 0; i < 6; i += 1) {
    addBlock(
      group,
      `foundation.rear-course.${i}`,
      [0.95, 0.22, 0.18],
      [-2.4 + i * 0.95, 0.15, -DIMS.depth / 2 - 0.14],
      [materials.stoneDark, materials.stoneLight, materials.stone][i % 3],
      [0, 0, 0],
      0.028,
    );
  }
}

/**
 * Thin interior core only — never a coplanar plaster slab on the facade.
 * Visible plaster is panelized between timber on each face.
 */
function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'building-core');
  const coreW = DIMS.width - 0.55;
  const coreD = DIMS.depth - 0.55;
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
    [coreW, DIMS.upperHeight, coreD],
    [0, 0.32 + DIMS.lowerHeight + DIMS.upperHeight / 2, 0],
    materials.plasterShade,
    [0, 0, 0],
    0.04,
  );
  addBlock(
    group,
    'shell.floor-belt',
    [DIMS.width - 0.2, 0.2, DIMS.depth - 0.2],
    [0, 0.32 + DIMS.lowerHeight, 0],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
}

/**
 * Full half-timber elevation on ±Z (front/rear).
 * Panelized plaster in every bay; gable truss on both ends.
 */
function addGableFacade(root, materials, nodes, { faceZ, label, isFront }) {
  const group = createNode(root, nodes, label);
  const z = faceZ;
  const panelZ = z - Math.sign(faceZ || 1) * 0.09;
  const timberZ = z;
  const postT = 0.24;
  const railT = 0.2;
  const halfW = DIMS.width / 2 - 0.08;
  const postsX = [-halfW, -halfW * 0.5, 0, halfW * 0.5, halfW];
  const totalH = DIMS.lowerHeight + DIMS.upperHeight + 0.15;
  const railsY = [
    [0.48, 0.22],
    [1.7, 0.16],
    [0.32 + DIMS.lowerHeight, 0.28],
    [0.32 + DIMS.lowerHeight + 1.15, 0.16],
    [DIMS.eaveY - 0.18, 0.22],
  ];

  for (const x of postsX) {
    addBlock(
      group,
      `${label}.post.${x.toFixed(2)}`,
      [postT, totalH, 0.24],
      [x, 0.32 + totalH / 2, timberZ],
      Math.abs(x) > halfW * 0.9 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.035,
    );
  }
  for (const [y, h] of railsY) {
    addBlock(
      group,
      `${label}.rail.${y}`,
      [DIMS.width - 0.12, h, railT],
      [0, y, timberZ],
      y > 2.8 && y < 3.5 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.03,
    );
  }

  // Panelized plaster — every bay (never one blank slab)
  const bayXs = [
    [-halfW, -halfW * 0.5],
    [-halfW * 0.5, 0],
    [0, halfW * 0.5],
    [halfW * 0.5, halfW],
  ];
  const storeys = [
    { y0: 0.62, y1: 1.55, mat: 'plaster' },
    { y0: 1.85, y1: 0.32 + DIMS.lowerHeight - 0.15, mat: 'plasterShade' },
    { y0: 0.32 + DIMS.lowerHeight + 0.18, y1: 0.32 + DIMS.lowerHeight + 1.05, mat: 'plaster' },
    { y0: 0.32 + DIMS.lowerHeight + 1.28, y1: DIMS.eaveY - 0.35, mat: 'plasterShade' },
  ];
  let panelIndex = 0;
  for (const [x0, x1] of bayXs) {
    for (const storey of storeys) {
      const width = x1 - x0 - 0.28;
      const height = storey.y1 - storey.y0;
      if (width < 0.2 || height < 0.2) continue;
      const cx = (x0 + x1) / 2;
      const cy = (storey.y0 + storey.y1) / 2;
      // Leave openings for door / shop window on front lower
      const skipDoor =
        isFront && cx < -0.4 && cx > -2.0 && storey.y0 < 0.32 + DIMS.lowerHeight;
      const skipShop =
        isFront && cx > 0.15 && cx < 1.9 && storey.y0 < 0.32 + DIMS.lowerHeight;
      if (skipDoor || skipShop) {
        // thin remnant panels above openings so wall never empties
        if (storey.y0 >= 0.32 + DIMS.lowerHeight + 0.15) {
          addPlasterPanel(
            group,
            `${label}.panel.${panelIndex}`,
            width,
            height,
            cx,
            cy,
            panelZ,
            materials,
            storey.mat,
          );
          panelIndex += 1;
        } else if (skipDoor && storey.y0 < 1.0) {
          // small patch under sill left of door
          addPlasterPanel(
            group,
            `${label}.panel.remnant.${panelIndex}`,
            width * 0.55,
            0.35,
            cx - 0.15,
            0.75,
            panelZ,
            materials,
            'plasterShade',
          );
          panelIndex += 1;
        }
        continue;
      }
      addPlasterPanel(
        group,
        `${label}.panel.${panelIndex}`,
        width,
        height,
        cx,
        cy,
        panelZ,
        materials,
        storey.mat,
      );
      panelIndex += 1;
    }
  }

  // Wear / crack patches for plaster read
  const crackSeed = isFront ? 1 : 3;
  for (let i = 0; i < 5; i += 1) {
    const cx = -halfW * 0.7 + ((i * 1.7 + crackSeed) % 5) * 0.55;
    const cy = 1.1 + (i % 3) * 1.35;
    addBlock(
      group,
      `${label}.crack.${i}`,
      [0.38 + (i % 2) * 0.15, 0.06, 0.04],
      [cx, cy, panelZ + 0.04],
      materials.plasterCrack,
      [0, 0, i % 2 ? 0.18 : -0.12],
      0.012,
    );
  }

  // Curved braces + chevrons
  addCurvedBrace(
    group,
    `${label}.brace.lower-left`,
    [-halfW + 0.15, 0.55],
    [-halfW * 0.55, 1.35],
    [-halfW * 0.35, 0.32 + DIMS.lowerHeight - 0.1],
    timberZ + 0.05,
    materials.timberLight,
  );
  addCurvedBrace(
    group,
    `${label}.brace.lower-right`,
    [halfW - 0.15, 0.55],
    [halfW * 0.55, 1.35],
    [halfW * 0.35, 0.32 + DIMS.lowerHeight - 0.1],
    timberZ + 0.05,
    materials.timberLight,
  );
  addBeamXY(
    group,
    `${label}.brace.chevron-l`,
    [-halfW * 0.45, 0.55],
    [-0.12, 1.55],
    0.13,
    0.13,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    `${label}.brace.chevron-r`,
    [0.12, 1.55],
    [halfW * 0.45, 0.55],
    0.13,
    0.13,
    materials.timber,
    timberZ + 0.04,
  );
  addCurvedBrace(
    group,
    `${label}.brace.upper-left`,
    [-halfW + 0.12, 0.32 + DIMS.lowerHeight + 0.15],
    [-halfW * 0.6, 0.32 + DIMS.lowerHeight + 1.2],
    [-halfW * 0.4, DIMS.eaveY - 0.3],
    timberZ + 0.05,
    materials.timberLight,
    0.065,
  );
  addCurvedBrace(
    group,
    `${label}.brace.upper-right`,
    [halfW - 0.12, 0.32 + DIMS.lowerHeight + 0.15],
    [halfW * 0.6, 0.32 + DIMS.lowerHeight + 1.2],
    [halfW * 0.4, DIMS.eaveY - 0.3],
    timberZ + 0.05,
    materials.timberLight,
    0.065,
  );

  // Gable triangle plaster + truss (front AND rear)
  const gableRise = DIMS.roofRise * 0.95;
  const gableShell = createMesh(
    createGableInfillGeometry(DIMS.width - 0.25, gableRise, 0.15),
    materials.plaster,
    `${label}.gable.plaster-infill`,
  );
  gableShell.position.set(0, DIMS.eaveY - 0.08, panelZ - Math.sign(faceZ || 1) * 0.02);
  group.add(gableShell);

  addBeamXY(
    group,
    `${label}.gable.rafter-left`,
    [-halfW - 0.05, DIMS.eaveY - 0.05],
    [0, DIMS.eaveY + gableRise - 0.05],
    0.2,
    0.18,
    materials.timberDark,
    timberZ + 0.05,
    0.03,
  );
  addBeamXY(
    group,
    `${label}.gable.rafter-right`,
    [0, DIMS.eaveY + gableRise - 0.05],
    [halfW + 0.05, DIMS.eaveY - 0.05],
    0.2,
    0.18,
    materials.timberDark,
    timberZ + 0.05,
    0.03,
  );
  addBlock(
    group,
    `${label}.gable.king-post`,
    [0.2, gableRise * 0.92, 0.16],
    [0, DIMS.eaveY - 0.05 + (gableRise * 0.92) / 2, timberZ + 0.05],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    `${label}.gable.collar`,
    [halfW * 0.9, 0.12, 0.14],
    [0, DIMS.eaveY + gableRise * 0.42, timberZ + 0.05],
    materials.timberLight,
    [0, 0, 0],
    0.025,
  );
  addBeamXY(
    group,
    `${label}.gable.strut-l`,
    [-halfW * 0.7, DIMS.eaveY],
    [-0.25, DIMS.eaveY + gableRise * 0.65],
    0.1,
    0.1,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    `${label}.gable.strut-r`,
    [halfW * 0.7, DIMS.eaveY],
    [0.25, DIMS.eaveY + gableRise * 0.65],
    0.1,
    0.1,
    materials.timber,
    timberZ + 0.04,
  );

  return group;
}

function addFrontAndRearTimber(root, materials, nodes) {
  addGableFacade(root, materials, nodes, {
    faceZ: DIMS.frontZ + 0.12,
    label: 'front-facade',
    isFront: true,
  });
  addGableFacade(root, materials, nodes, {
    faceZ: -(DIMS.frontZ + 0.08),
    label: 'rear-facade',
    isFront: false,
  });
}

function addSideSurface(root, materials, nodes, side) {
  const label = side > 0 ? 'right' : 'left';
  const group = createNode(root, nodes, `side-wall-${label}`);
  group.position.x = side * (DIMS.width / 2 + 0.02);
  group.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;

  const timberZ = 0.08;
  const panelZ = 0.0;
  const halfD = DIMS.depth / 2 - 0.08;
  const postsX = [-halfD, -halfD * 0.33, halfD * 0.33, halfD];
  const totalH = DIMS.lowerHeight + DIMS.upperHeight + 0.1;

  for (const x of postsX) {
    addBlock(
      group,
      `side.${label}.post.${x.toFixed(2)}`,
      [0.22, totalH, 0.2],
      [x, 0.32 + totalH / 2, timberZ],
      materials.timber,
      [0, 0, 0],
      0.03,
    );
  }
  for (const [y, h] of [
    [0.48, 0.2],
    [1.7, 0.14],
    [0.32 + DIMS.lowerHeight, 0.26],
    [0.32 + DIMS.lowerHeight + 1.15, 0.14],
    [DIMS.eaveY - 0.18, 0.2],
  ]) {
    addBlock(
      group,
      `side.${label}.rail.${y}`,
      [DIMS.depth - 0.2, h, 0.18],
      [0, y, timberZ],
      y > 2.8 && y < 3.5 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.028,
    );
  }

  const bayXs = [
    [-halfD, -halfD * 0.33],
    [-halfD * 0.33, halfD * 0.33],
    [halfD * 0.33, halfD],
  ];
  const storeys = [
    { y0: 0.62, y1: 1.55, mat: 'plaster' },
    { y0: 1.85, y1: 0.32 + DIMS.lowerHeight - 0.15, mat: 'plasterShade' },
    { y0: 0.32 + DIMS.lowerHeight + 0.18, y1: 0.32 + DIMS.lowerHeight + 1.05, mat: 'plaster' },
    { y0: 0.32 + DIMS.lowerHeight + 1.28, y1: DIMS.eaveY - 0.35, mat: 'plasterShade' },
  ];
  let panelIndex = 0;
  for (const [x0, x1] of bayXs) {
    for (const storey of storeys) {
      const width = x1 - x0 - 0.26;
      const height = storey.y1 - storey.y0;
      if (width < 0.18 || height < 0.18) continue;
      const cx = (x0 + x1) / 2;
      const cy = (storey.y0 + storey.y1) / 2;
      // leave room for side windows (left wall mainly)
      const skipLowerWin =
        side < 0 && Math.abs(cx + halfD * 0.15) < 0.7 && storey.y0 < 0.32 + DIMS.lowerHeight;
      const skipUpperWin =
        side < 0 && Math.abs(cx - 0.1) < 0.55 && storey.y0 > 0.32 + DIMS.lowerHeight;
      if (skipLowerWin || skipUpperWin) {
        // remnant strips so bay never blanks
        addPlasterPanel(
          group,
          `side.${label}.panel.remnant.${panelIndex}`,
          width * 0.35,
          height,
          cx + (skipLowerWin ? 0.35 : -0.25),
          cy,
          panelZ,
          materials,
          storey.mat,
        );
        panelIndex += 1;
        continue;
      }
      addPlasterPanel(
        group,
        `side.${label}.panel.${panelIndex}`,
        width,
        height,
        cx,
        cy,
        panelZ,
        materials,
        storey.mat,
      );
      panelIndex += 1;
    }
  }

  // Side braces
  addBeamXY(
    group,
    `side.${label}.brace.lower`,
    [-halfD + 0.2, 0.55],
    [-0.15, 1.55],
    0.11,
    0.11,
    materials.timberLight,
    timberZ + 0.03,
  );
  addBeamXY(
    group,
    `side.${label}.brace.upper`,
    [halfD - 0.2, 0.32 + DIMS.lowerHeight + 0.2],
    [0.2, DIMS.eaveY - 0.4],
    0.11,
    0.11,
    materials.timberLight,
    timberZ + 0.03,
  );

  // Crack patches
  for (let i = 0; i < 3; i += 1) {
    addBlock(
      group,
      `side.${label}.crack.${i}`,
      [0.32, 0.05, 0.035],
      [-halfD * 0.5 + i * 0.7, 1.2 + i * 1.1, panelZ + 0.04],
      materials.plasterCrack,
      [0, 0, 0.1 * (i % 2 ? 1 : -1)],
      0.01,
    );
  }
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
    [DIMS.roofWidth + 0.1, 0.16, 0.14],
    [0, DIMS.eaveY - 0.02, DIMS.roofDepth / 2 + 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-back',
    [DIMS.roofWidth + 0.1, 0.16, 0.14],
    [0, DIMS.eaveY - 0.02, -DIMS.roofDepth / 2 - 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  // Side barge boards
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `roof.barge.${side > 0 ? 'R' : 'L'}`,
      [0.12, 0.14, DIMS.roofDepth + 0.08],
      [side * (DIMS.roofWidth / 2 + 0.02), DIMS.eaveY + 0.05, 0],
      materials.timberDark,
      [0, 0, side > 0 ? -0.35 : 0.35],
      0.025,
    );
  }

  // Dense tile relief rows (inn-v3 density)
  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 9;
  const columns = 11;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [materials.roof, materials.roofLight, materials.roofDark];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.55);
      const x = side * distanceFromRidge;
      const y =
        DIMS.eaveY - 0.08 + DIMS.roofRise * (1 - distanceFromRidge / halfWidth) + 0.1;
      const stagger = row % 2 ? tileDepth * 0.4 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.12;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 3];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.12, 0.1, tileDepth * 1.04],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.024,
        );
      }
    }
  }

  for (let index = 0; index < 13; index += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 13) * (index + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${index}`,
      [0.4, 0.3, DIMS.roofDepth / 13.2],
      [0, DIMS.eaveY + DIMS.roofRise + 0.02, z],
      index % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.045,
      3,
    );
  }
}

function addChimney(root, materials, nodes) {
  const group = createNode(root, nodes, 'chimney');
  const cx = 1.65;
  const cz = -0.55;
  const baseY = DIMS.eaveY + 0.4;

  addBlock(group, 'chimney.base', [0.78, 0.55, 0.78], [cx, baseY, cz], materials.brickDark, [0, 0, 0], 0.04);
  addBlock(group, 'chimney.shaft', [0.62, 1.4, 0.62], [cx, baseY + 0.95, cz], materials.brick, [0, 0, 0], 0.04);
  addBlock(group, 'chimney.cap', [0.78, 0.16, 0.78], [cx, baseY + 1.72, cz], materials.brickLight, [0, 0, 0], 0.03);
  addBlock(group, 'chimney.lip', [0.45, 0.18, 0.45], [cx, baseY + 1.9, cz], materials.brickDark, [0, 0, 0], 0.025);

  for (let i = 0; i < 5; i += 1) {
    addBlock(
      group,
      `chimney.course.${i}`,
      [0.66, 0.08, 0.66],
      [cx, baseY + 0.35 + i * 0.28, cz],
      i % 2 ? materials.brickLight : materials.brickDark,
      [0, 0, 0],
      0.02,
    );
  }
  // mortar joints as thin bands
  for (let i = 0; i < 4; i += 1) {
    addBlock(
      group,
      `chimney.mortar.${i}`,
      [0.68, 0.03, 0.68],
      [cx, baseY + 0.48 + i * 0.28, cz],
      materials.stoneDark,
      [0, 0, 0],
      0.01,
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
    [width + 0.22, height + 0.22, 0.1],
    [0, 0, -0.03],
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

  // Proud multi-piece frame (not a flat slab covering glass)
  addBlock(
    group,
    `${name}.frame.top`,
    [width + 0.28, 0.14, 0.16],
    [0, height / 2 + 0.07, 0.07],
    materials.timber,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    `${name}.frame.bot`,
    [width + 0.28, 0.14, 0.16],
    [0, -height / 2 - 0.07, 0.07],
    materials.timber,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    `${name}.frame.left`,
    [0.14, height + 0.08, 0.16],
    [-width / 2 - 0.07, 0, 0.07],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    `${name}.frame.right`,
    [0.14, height + 0.08, 0.16],
    [width / 2 + 0.07, 0, 0.07],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    `${name}.sill`,
    [width + 0.38, 0.12, 0.22],
    [0, -height / 2 - 0.16, 0.1],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    `${name}.lintel`,
    [width + 0.32, 0.1, 0.16],
    [0, height / 2 + 0.16, 0.08],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );

  for (let c = 1; c < cols; c += 1) {
    const x = -width / 2 + (width * c) / cols;
    addBlock(
      group,
      `${name}.mullion.v.${c}`,
      [0.06, height, 0.07],
      [x, 0, 0.06],
      materials.timberDark,
      [0, 0, 0],
      0.012,
    );
  }
  for (let r = 1; r < rows; r += 1) {
    const y = -height / 2 + (height * r) / rows;
    addBlock(
      group,
      `${name}.mullion.h.${r}`,
      [width, 0.06, 0.07],
      [0, y, 0.06],
      materials.timberDark,
      [0, 0, 0],
      0.012,
    );
  }

  return group;
}

function createShopWindow(materials, name) {
  const group = new THREE.Group();
  group.name = name;
  const width = 1.95;
  const height = 1.55;

  addBlock(
    group,
    `${name}.recess`,
    [width + 0.28, height + 0.28, 0.12],
    [0, 0, -0.04],
    materials.interior,
    [0, 0, 0],
    0.02,
  );
  addBlock(group, `${name}.glass`, [width, height, 0.06], [0, 0, 0.02], materials.glassWarm, [0, 0, 0], 0.015);

  // Proud outer frame
  addBlock(
    group,
    `${name}.frame.top`,
    [width + 0.3, 0.16, 0.18],
    [0, height / 2 + 0.07, 0.07],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    `${name}.frame.bot`,
    [width + 0.3, 0.16, 0.18],
    [0, -height / 2 - 0.07, 0.07],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    `${name}.frame.left`,
    [0.16, height + 0.1, 0.18],
    [-width / 2 - 0.07, 0, 0.07],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    `${name}.frame.right`,
    [0.16, height + 0.1, 0.18],
    [width / 2 + 0.07, 0, 0.07],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    `${name}.sill`,
    [width + 0.45, 0.14, 0.28],
    [0, -height / 2 - 0.18, 0.12],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    `${name}.lintel`,
    [width + 0.38, 0.12, 0.18],
    [0, height / 2 + 0.18, 0.08],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  // outer casing lips (proud of wall)
  addBlock(
    group,
    `${name}.casing.outer`,
    [width + 0.48, height + 0.5, 0.08],
    [0, 0, 0.02],
    materials.timber,
    [0, 0, 0],
    0.03,
  );

  // 3x3 mullions
  for (let c = 1; c < 3; c += 1) {
    const x = -width / 2 + (width * c) / 3;
    addBlock(
      group,
      `${name}.mullion.v.${c}`,
      [0.065, height, 0.08],
      [x, 0, 0.06],
      materials.timberDark,
      [0, 0, 0],
      0.012,
    );
  }
  for (let r = 1; r < 3; r += 1) {
    const y = -height / 2 + (height * r) / 3;
    addBlock(
      group,
      `${name}.mullion.h.${r}`,
      [width, 0.065, 0.08],
      [0, y, 0.06],
      materials.timberDark,
      [0, 0, 0],
      0.012,
    );
  }

  // Yellow curtains
  addBlock(
    group,
    `${name}.curtain.L`,
    [0.48, height * 0.88, 0.05],
    [-width * 0.28, 0.02, -0.01],
    materials.curtain,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    `${name}.curtain.R`,
    [0.48, height * 0.88, 0.05],
    [width * 0.28, 0.02, -0.01],
    materials.curtainShade,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    `${name}.curtain.rod`,
    [width * 0.94, 0.05, 0.05],
    [0, height * 0.44, 0],
    materials.timberDark,
    [0, 0, 0],
    0.01,
  );
  addBlock(
    group,
    `${name}.curtain.fold.L`,
    [0.12, height * 0.75, 0.04],
    [-width * 0.38, -0.05, 0.01],
    materials.curtainShade,
    [0, 0, 0],
    0.015,
  );
  addBlock(
    group,
    `${name}.curtain.fold.R`,
    [0.12, height * 0.75, 0.04],
    [width * 0.38, -0.05, 0.01],
    materials.curtain,
    [0, 0, 0],
    0.015,
  );

  return group;
}

function addWindows(root, materials, nodes) {
  const group = createNode(root, nodes, 'windows');
  const fz = DIMS.frontZ + 0.22;

  const shop = createShopWindow(materials, 'window.shop');
  shop.position.set(0.78, 1.62, fz);
  group.add(shop);
  nodes.shopWindow = shop;

  const upperFront = createMullionWindow(materials, 'window.upper-front', 0.9, 1.0, 2, 2, false);
  upperFront.position.set(0.1, 4.25, fz);
  group.add(upperFront);

  // Left side windows
  const sideX = -DIMS.width / 2 - 0.12;
  const upperSide = createMullionWindow(materials, 'window.side-upper', 0.78, 0.9, 2, 2, false);
  upperSide.position.set(sideX, 4.15, -0.1);
  upperSide.rotation.y = -Math.PI / 2;
  group.add(upperSide);

  const lowerSide = createMullionWindow(materials, 'window.side-lower', 0.7, 0.82, 2, 2, false);
  lowerSide.position.set(sideX, 1.58, -0.55);
  lowerSide.rotation.y = -Math.PI / 2;
  group.add(lowerSide);

  // Right side small upper + lower
  const rightX = DIMS.width / 2 + 0.12;
  const rightUpper = createMullionWindow(materials, 'window.right-upper', 0.72, 0.85, 2, 2, false);
  rightUpper.position.set(rightX, 4.18, 0.15);
  rightUpper.rotation.y = Math.PI / 2;
  group.add(rightUpper);

  const rightLower = createMullionWindow(materials, 'window.right-lower', 0.65, 0.75, 2, 2, false);
  rightLower.position.set(rightX, 1.5, -0.35);
  rightLower.rotation.y = Math.PI / 2;
  group.add(rightLower);

  // Rear windows so rear never blanks
  const rearZ = -DIMS.frontZ - 0.05;
  for (const x of [-1.3, 1.3]) {
    const rear = createMullionWindow(materials, `window.rear.${x > 0 ? 'R' : 'L'}`, 0.8, 0.9, 2, 2, false);
    rear.position.set(x, 4.15, rearZ);
    rear.rotation.y = Math.PI;
    group.add(rear);
  }
}

function addDoor(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'door-system');
  const fz = DIMS.frontZ + 0.18;
  const doorW = 1.12;
  const doorH = 2.15;
  const doorX = -1.2;
  const doorY = 0.32 + doorH / 2 + 0.02;

  const hinge = new THREE.Group();
  hinge.name = 'socket.doorHinge';
  hinge.position.set(doorX - doorW / 2 + 0.04, doorY, fz);
  group.add(hinge);
  sockets.doorHinge = hinge;

  const leaf = new THREE.Group();
  leaf.name = 'door.leaf';
  leaf.position.set(doorW / 2 - 0.04, 0, 0);
  hinge.add(leaf);

  addBlock(leaf, 'door.panel', [doorW, doorH, 0.12], [0, 0, 0], materials.door, [0, 0, 0], 0.04);
  addBlock(
    leaf,
    'door.panel-inset',
    [doorW * 0.7, doorH * 0.48, 0.05],
    [0, -0.22, 0.05],
    materials.doorDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    leaf,
    'door.panel-mid-rail',
    [doorW * 0.78, 0.1, 0.05],
    [0, 0.12, 0.05],
    materials.doorLight,
    [0, 0, 0],
    0.02,
  );

  // Circular cross window — proud
  addCylinder(
    leaf,
    'door.round-frame',
    0.32,
    0.32,
    0.1,
    [0, 0.48, 0.07],
    materials.doorLight,
    18,
    [Math.PI / 2, 0, 0],
  );
  addCylinder(
    leaf,
    'door.round-glass',
    0.24,
    0.24,
    0.06,
    [0, 0.48, 0.1],
    materials.glass,
    16,
    [Math.PI / 2, 0, 0],
  );
  addBlock(leaf, 'door.cross-v', [0.06, 0.48, 0.05], [0, 0.48, 0.12], materials.timberDark, [0, 0, 0], 0.01);
  addBlock(leaf, 'door.cross-h', [0.48, 0.06, 0.05], [0, 0.48, 0.12], materials.timberDark, [0, 0, 0], 0.01);

  // Knob + plate
  addBlock(
    leaf,
    'door.knob-plate',
    [0.14, 0.22, 0.03],
    [doorW * 0.34, -0.05, 0.08],
    materials.ironLight,
    [0, 0, 0],
    0.01,
  );
  addSphere(leaf, 'door.knob', 0.08, [doorW * 0.34, -0.05, 0.14], materials.gold, 12);
  addCylinder(
    leaf,
    'door.knob-stem',
    0.028,
    0.028,
    0.1,
    [doorW * 0.34, -0.05, 0.08],
    materials.iron,
    8,
    [Math.PI / 2, 0, 0],
  );

  // Proud frame + green-ish jamb accent
  addBlock(
    group,
    'door.frame.left',
    [0.16, doorH + 0.22, 0.18],
    [doorX - doorW / 2 - 0.08, doorY, fz],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'door.frame.right',
    [0.16, doorH + 0.22, 0.18],
    [doorX + doorW / 2 + 0.08, doorY, fz],
    materials.awningEdge,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'door.frame.top',
    [doorW + 0.4, 0.18, 0.18],
    [doorX, doorY + doorH / 2 + 0.1, fz],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'door.threshold',
    [doorW + 0.35, 0.1, 0.22],
    [doorX, 0.36, fz + 0.04],
    materials.timber,
    [0, 0, 0],
    0.02,
  );
  // outer casing
  addBlock(
    group,
    'door.casing.outer-top',
    [doorW + 0.55, 0.1, 0.1],
    [doorX, doorY + doorH / 2 + 0.22, fz + 0.02],
    materials.timber,
    [0, 0, 0],
    0.02,
  );
}

function addPorch(root, materials, nodes) {
  const group = createNode(root, nodes, 'porch');
  const deckZ = DIMS.frontZ + DIMS.porchDepth / 2 + 0.08;
  const deckY = DIMS.porchY;
  const deckW = DIMS.width * 1.02;
  const deckD = DIMS.porchDepth;

  // Thick deck + individual board slats
  addBlock(group, 'porch.deck', [deckW, 0.14, deckD], [0, deckY, deckZ], materials.timberLight, [0, 0, 0], 0.03);
  addBlock(
    group,
    'porch.skirt',
    [deckW + 0.12, 0.28, 0.14],
    [0, deckY - 0.14, deckZ + deckD / 2 - 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'porch.skirt.left',
    [0.12, 0.28, deckD],
    [-deckW / 2 - 0.02, deckY - 0.14, deckZ],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'porch.skirt.right',
    [0.12, 0.28, deckD],
    [deckW / 2 + 0.02, deckY - 0.14, deckZ],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Individual deck boards (presence)
  const boardCount = 10;
  for (let i = 0; i < boardCount; i += 1) {
    const z = deckZ - deckD / 2 + 0.1 + i * (deckD / boardCount);
    addBlock(
      group,
      `porch.board.${i}`,
      [deckW * 0.96, 0.04, deckD / boardCount - 0.02],
      [0, deckY + 0.08, z],
      i % 2 ? materials.timber : materials.timberLight,
      [0, 0, 0],
      0.01,
    );
  }
  // Gap lines
  for (let i = 0; i < boardCount - 1; i += 1) {
    const z = deckZ - deckD / 2 + 0.1 + (i + 1) * (deckD / boardCount);
    addBlock(
      group,
      `porch.board-gap.${i}`,
      [deckW * 0.94, 0.015, 0.025],
      [0, deckY + 0.095, z],
      materials.timberDark,
      [0, 0, 0],
      0.006,
    );
  }

  // Steps (center-front, two-tread proud)
  addBlock(
    group,
    'porch.step.lower',
    [1.35, 0.14, 0.42],
    [0.4, 0.1, deckZ + deckD / 2 + 0.18],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'porch.step.upper',
    [1.15, 0.12, 0.32],
    [0.4, 0.22, deckZ + deckD / 2 + 0.02],
    materials.timberLight,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'porch.step.riser',
    [1.2, 0.1, 0.06],
    [0.4, 0.16, deckZ + deckD / 2 + 0.28],
    materials.timberDark,
    [0, 0, 0],
    0.015,
  );

  // Thick porch posts
  const postY = deckY + 1.25;
  const postH = 2.35;
  const postZ = deckZ + deckD / 2 - 0.14;
  for (const x of [-deckW * 0.42, deckW * 0.42]) {
    addBlock(
      group,
      `porch.post.${x > 0 ? 'R' : 'L'}`,
      [0.22, postH, 0.22],
      [x, postY, postZ],
      materials.timber,
      [0, 0, 0],
      0.04,
    );
    addBlock(
      group,
      `porch.post-base.${x > 0 ? 'R' : 'L'}`,
      [0.3, 0.16, 0.3],
      [x, deckY + 0.12, postZ],
      materials.timberDark,
      [0, 0, 0],
      0.025,
    );
    addBlock(
      group,
      `porch.post-cap.${x > 0 ? 'R' : 'L'}`,
      [0.28, 0.12, 0.28],
      [x, postY + postH / 2 - 0.02, postZ],
      materials.timberDark,
      [0, 0, 0],
      0.025,
    );
    // mid ring detail
    addBlock(
      group,
      `porch.post-ring.${x > 0 ? 'R' : 'L'}`,
      [0.26, 0.08, 0.26],
      [x, postY + 0.15, postZ],
      materials.timberLight,
      [0, 0, 0],
      0.02,
    );
  }
  // Rear porch posts against facade
  const rearPostZ = DIMS.frontZ + 0.22;
  for (const x of [-deckW * 0.42, deckW * 0.42]) {
    addBlock(
      group,
      `porch.post-rear.${x > 0 ? 'R' : 'L'}`,
      [0.18, postH * 0.95, 0.18],
      [x, postY - 0.05, rearPostZ],
      materials.timberDark,
      [0, 0, 0],
      0.03,
    );
  }

  // Beams
  addBlock(
    group,
    'porch.beam.front',
    [deckW * 0.95, 0.18, 0.18],
    [0, postY + postH / 2 - 0.05, postZ - 0.08],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'porch.beam.rear',
    [deckW * 0.95, 0.16, 0.14],
    [0, postY + postH / 2 - 0.08, rearPostZ + 0.05],
    materials.timber,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'porch.beam.side.L',
    [0.14, 0.14, deckD * 0.85],
    [-deckW * 0.42, postY + postH / 2 - 0.08, deckZ],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'porch.beam.side.R',
    [0.14, 0.14, deckD * 0.85],
    [deckW * 0.42, postY + postH / 2 - 0.08, deckZ],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );

  // Corner braces under beam
  for (const x of [-deckW * 0.42, deckW * 0.42]) {
    addBeamXY(
      group,
      `porch.brace.${x > 0 ? 'R' : 'L'}`,
      [x + (x > 0 ? -0.05 : 0.05), postY + postH / 2 - 0.35],
      [x * 0.55, postY + postH / 2 - 0.05],
      0.1,
      0.1,
      materials.timberLight,
      postZ - 0.1,
    );
  }

  // Striped awning — thicker, more stripes, green edge binding
  const awningGroup = createNode(group, nodes, 'awning');
  const awningY = postY + postH / 2 + 0.12;
  const awningZ = deckZ + 0.08;
  const stripeCount = 10;
  const stripeW = (deckW * 0.98) / stripeCount;
  for (let i = 0; i < stripeCount; i += 1) {
    const x = (-deckW * 0.98) / 2 + stripeW * (i + 0.5);
    addBlock(
      awningGroup,
      `awning.stripe.${i}`,
      [stripeW * 0.98, 0.12, deckD * 1.02],
      [x, awningY, awningZ],
      i % 2 === 0 ? materials.awningRed : materials.awningYellow,
      [0.1, 0, 0],
      0.025,
    );
    // wood-grain stripe lip
    addBlock(
      awningGroup,
      `awning.stripe-lip.${i}`,
      [stripeW * 0.9, 0.04, 0.06],
      [x, awningY + 0.05, awningZ + deckD * 0.48],
      i % 2 === 0 ? materials.awningRed : materials.awningYellow,
      [0.1, 0, 0],
      0.01,
    );
  }
  // Green edge binding — full surround
  addBlock(
    awningGroup,
    'awning.edge-front',
    [deckW * 0.99, 0.14, 0.14],
    [0, awningY - 0.02, awningZ + deckD * 0.5],
    materials.awningEdge,
    [0.1, 0, 0],
    0.025,
  );
  addBlock(
    awningGroup,
    'awning.edge-front-lip',
    [deckW * 0.99, 0.08, 0.08],
    [0, awningY - 0.08, awningZ + deckD * 0.52],
    materials.awningEdgeLight,
    [0.1, 0, 0],
    0.015,
  );
  addBlock(
    awningGroup,
    'awning.edge-left',
    [0.14, 0.14, deckD * 1.02],
    [-deckW * 0.49, awningY, awningZ],
    materials.awningEdge,
    [0.1, 0, 0],
    0.025,
  );
  addBlock(
    awningGroup,
    'awning.edge-right',
    [0.14, 0.14, deckD * 1.02],
    [deckW * 0.49, awningY, awningZ],
    materials.awningEdge,
    [0.1, 0, 0],
    0.025,
  );
  addBlock(
    awningGroup,
    'awning.edge-rear',
    [deckW * 0.99, 0.12, 0.1],
    [0, awningY + 0.02, awningZ - deckD * 0.48],
    materials.awningEdge,
    [0.1, 0, 0],
    0.02,
  );
  // Support rafters under awning
  for (let i = 0; i < 5; i += 1) {
    const x = -deckW * 0.4 + i * (deckW * 0.2);
    addBlock(
      awningGroup,
      `awning.rafter.${i}`,
      [0.08, 0.08, deckD * 0.95],
      [x, awningY - 0.1, awningZ],
      materials.timberDark,
      [0.1, 0, 0],
      0.015,
    );
  }
  awningGroup.rotation.x = -0.14;
}

function addBarrel(parent, materials, name, position, scale = 1) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.scale.setScalar(scale);

  addCylinder(group, `${name}.body`, 0.3, 0.32, 0.78, [0, 0.39, 0], materials.timber, 16);
  addCylinder(group, `${name}.bulge`, 0.35, 0.35, 0.26, [0, 0.4, 0], materials.timberLight, 16);
  addCylinder(group, `${name}.lid`, 0.29, 0.29, 0.07, [0, 0.8, 0], materials.timberDark, 14);
  addCylinder(group, `${name}.bottom`, 0.3, 0.3, 0.05, [0, 0.04, 0], materials.timberDark, 12);
  addCylinder(group, `${name}.hoop.top`, 0.34, 0.34, 0.05, [0, 0.66, 0], materials.iron, 16);
  addCylinder(group, `${name}.hoop.mid`, 0.36, 0.36, 0.05, [0, 0.4, 0], materials.iron, 16);
  addCylinder(group, `${name}.hoop.bot`, 0.34, 0.34, 0.05, [0, 0.16, 0], materials.iron, 16);
  // stave lines
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    addBlock(
      group,
      `${name}.stave.${i}`,
      [0.03, 0.7, 0.03],
      [Math.cos(a) * 0.31, 0.4, Math.sin(a) * 0.31],
      materials.timberDark,
      [0, a, 0],
      0.008,
    );
  }
  // FLOUR label
  addBlock(group, `${name}.label`, [0.32, 0.16, 0.05], [0, 0.4, 0.34], materials.sack, [0, 0, 0], 0.015);
  addBlock(group, `${name}.label-ink`, [0.24, 0.06, 0.025], [0, 0.4, 0.37], materials.ink, [0, 0, 0], 0.008);
  addBlock(group, `${name}.label-bar`, [0.2, 0.02, 0.02], [0, 0.34, 0.37], materials.ink, [0, 0, 0], 0.006);

  parent.add(group);
  return group;
}

function addCrate(parent, materials, name, position, size = [0.55, 0.45, 0.5], produce = true) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  const [w, h, d] = size;

  addBlock(group, `${name}.box`, [w, h, d], [0, h / 2, 0], materials.timberLight, [0, 0, 0], 0.03);
  addBlock(group, `${name}.rim`, [w + 0.05, 0.07, d + 0.05], [0, h - 0.01, 0], materials.timber, [0, 0, 0], 0.015);
  addBlock(group, `${name}.bottom-rim`, [w + 0.04, 0.05, d + 0.04], [0, 0.04, 0], materials.timberDark, [0, 0, 0], 0.012);
  // slat lines (both faces)
  for (let i = 0; i < 3; i += 1) {
    addBlock(
      group,
      `${name}.slat.front.${i}`,
      [0.035, h * 0.85, 0.03],
      [-w * 0.3 + i * w * 0.3, h / 2, d / 2 + 0.01],
      materials.timberDark,
      [0, 0, 0],
      0.008,
    );
    addBlock(
      group,
      `${name}.slat.side.${i}`,
      [0.03, h * 0.85, 0.035],
      [w / 2 + 0.01, h / 2, -d * 0.3 + i * d * 0.3],
      materials.timberDark,
      [0, 0, 0],
      0.008,
    );
  }
  // corner uprights
  for (const [sx, sz] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]) {
    addBlock(
      group,
      `${name}.corner.${sx}.${sz}`,
      [0.05, h, 0.05],
      [sx * (w / 2 - 0.02), h / 2, sz * (d / 2 - 0.02)],
      materials.timberDark,
      [0, 0, 0],
      0.01,
    );
  }

  if (produce) {
    const produceMats = [
      materials.produceRed,
      materials.produceGreen,
      materials.produceYellow,
      materials.producePurple,
      materials.produceOrange,
    ];
    for (let i = 0; i < 8; i += 1) {
      const px = ((i % 3) - 1) * w * 0.24;
      const pz = (Math.floor(i / 3) - 0.5) * d * 0.26;
      addSphere(
        group,
        `${name}.produce.${i}`,
        0.075 + (i % 3) * 0.015,
        [px, h + 0.07, pz],
        produceMats[i % produceMats.length],
        8,
        [1, 0.85, 1],
      );
    }
  }

  parent.add(group);
  return group;
}

function addSack(parent, materials, name, position, scale = 1) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.scale.setScalar(scale);
  addCylinder(group, `${name}.body`, 0.16, 0.2, 0.42, [0, 0.22, 0], materials.sack, 10);
  addSphere(group, `${name}.top`, 0.14, [0, 0.44, 0], materials.sackDark, 8, [1, 0.7, 1]);
  addBlock(group, `${name}.tie`, [0.12, 0.06, 0.08], [0, 0.48, 0], materials.timberDark, [0, 0, 0], 0.015);
  addBlock(group, `${name}.label`, [0.14, 0.1, 0.03], [0, 0.22, 0.18], materials.sackDark, [0, 0, 0], 0.01);
  parent.add(group);
  return group;
}

function addPorchProps(root, materials, nodes) {
  const group = createNode(root, nodes, 'porch-props');
  const deckZ = DIMS.frontZ + DIMS.porchDepth / 2 + 0.08;
  const deckY = DIMS.porchY + 0.1;

  const barrel = addBarrel(group, materials, 'prop.flour-barrel', [-2.15, deckY, deckZ + 0.2], 1.05);
  nodes.barrel = barrel;

  // Extra small barrel for presence
  addBarrel(group, materials, 'prop.side-barrel', [-2.35, deckY, deckZ - 0.35], 0.72);

  const crateStack = createNode(group, nodes, 'crate-stack');
  addCrate(crateStack, materials, 'prop.crate.low-front', [1.45, deckY, deckZ + 0.35], [0.55, 0.4, 0.52], true);
  addCrate(crateStack, materials, 'prop.crate.low-mid', [1.95, deckY, deckZ + 0.05], [0.5, 0.38, 0.48], true);
  addCrate(crateStack, materials, 'prop.crate.low-back', [1.55, deckY, deckZ - 0.35], [0.48, 0.36, 0.46], true);
  addCrate(
    crateStack,
    materials,
    'prop.crate.stack-top',
    [1.95, deckY + 0.4, deckZ - 0.05],
    [0.54, 0.44, 0.52],
    true,
  );
  addCrate(
    crateStack,
    materials,
    'prop.crate.stack-top2',
    [1.5, deckY + 0.38, deckZ + 0.25],
    [0.48, 0.36, 0.45],
    true,
  );
  addCrate(crateStack, materials, 'prop.crate.side-small', [2.35, deckY, deckZ + 0.4], [0.4, 0.32, 0.38], false);
  addCrate(crateStack, materials, 'prop.crate.side-tall', [2.4, deckY, deckZ - 0.25], [0.36, 0.5, 0.36], true);

  // Goods sacks
  addSack(group, materials, 'prop.sack.a', [2.0, deckY, deckZ + 0.55], 0.9);
  addSack(group, materials, 'prop.sack.b', [1.15, deckY, deckZ + 0.5], 0.75);
  addSack(group, materials, 'prop.sack.c', [-1.55, deckY, deckZ + 0.35], 0.8);

  // Loose produce pile near crates
  const produceMats = [
    materials.produceRed,
    materials.produceGreen,
    materials.produceYellow,
    materials.produceOrange,
  ];
  for (let i = 0; i < 6; i += 1) {
    addSphere(
      group,
      `prop.loose-produce.${i}`,
      0.07 + (i % 3) * 0.015,
      [1.1 + (i % 3) * 0.12, deckY + 0.08, deckZ + 0.55 + Math.floor(i / 3) * 0.1],
      produceMats[i % produceMats.length],
      7,
      [1, 0.85, 1],
    );
  }
}

function addFlowerBox(root, materials, nodes) {
  const group = createNode(root, nodes, 'flower-box');
  const sideX = -DIMS.width / 2 - 0.05;
  // Under upper side window
  addBlock(group, 'planter.box', [0.32, 0.26, 0.85], [sideX, 3.45, -0.1], materials.timber, [0, 0, 0], 0.03);
  addBlock(
    group,
    'planter.box-lip',
    [0.36, 0.06, 0.9],
    [sideX, 3.58, -0.1],
    materials.timberDark,
    [0, 0, 0],
    0.015,
  );
  addBlock(
    group,
    'planter.soil',
    [0.26, 0.1, 0.75],
    [sideX - 0.02, 3.58, -0.1],
    materials.timberDark,
    [0, 0, 0],
    0.02,
  );
  addSphere(group, 'planter.foliage.a', 0.18, [sideX - 0.06, 3.72, -0.28], materials.foliage, 8, [1.25, 0.9, 1]);
  addSphere(group, 'planter.foliage.b', 0.16, [sideX - 0.06, 3.7, 0.05], materials.foliageDark, 8, [1.15, 0.85, 1]);
  addSphere(group, 'planter.foliage.c', 0.14, [sideX - 0.04, 3.68, -0.12], materials.foliageLight, 8, [1.1, 0.8, 1]);
  for (let i = 0; i < 7; i += 1) {
    addSphere(
      group,
      `planter.flower.${i}`,
      0.065,
      [sideX - 0.1, 3.8, -0.38 + i * 0.12],
      i % 2 ? materials.flowerLight : materials.flower,
      7,
    );
  }

  // Small front planter under side of porch (left)
  addBlock(
    group,
    'planter.front.box',
    [0.55, 0.22, 0.28],
    [-2.5, 0.55, DIMS.frontZ + 0.15],
    materials.timber,
    [0, 0, 0],
    0.025,
  );
  addSphere(
    group,
    'planter.front.foliage',
    0.14,
    [-2.5, 0.75, DIMS.frontZ + 0.15],
    materials.foliage,
    8,
    [1.3, 0.8, 1],
  );
  for (let i = 0; i < 3; i += 1) {
    addSphere(
      group,
      `planter.front.flower.${i}`,
      0.05,
      [-2.65 + i * 0.15, 0.82, DIMS.frontZ + 0.18],
      materials.flower,
      6,
    );
  }
}

function addSign(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'sign-rig');
  const fz = DIMS.frontZ + 0.18;
  // Bracket on upper front-right — larger, prouder
  const anchorX = 1.7;
  const anchorY = 4.55;

  addBlock(group, 'sign.bracket-plate', [0.22, 0.36, 0.1], [anchorX, anchorY, fz], materials.iron, [0, 0, 0], 0.025);
  addBlock(
    group,
    'sign.bracket-plate.bolt.L',
    [0.06, 0.06, 0.04],
    [anchorX - 0.05, anchorY + 0.1, fz + 0.06],
    materials.ironLight,
    [0, 0, 0],
    0.01,
  );
  addBlock(
    group,
    'sign.bracket-plate.bolt.R',
    [0.06, 0.06, 0.04],
    [anchorX + 0.05, anchorY - 0.1, fz + 0.06],
    materials.ironLight,
    [0, 0, 0],
    0.01,
  );
  addBlock(
    group,
    'sign.arm',
    [0.12, 0.12, 1.05],
    [anchorX, anchorY + 0.1, fz + 0.52],
    materials.iron,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'sign.arm-tip',
    [0.14, 0.14, 0.14],
    [anchorX, anchorY + 0.1, fz + 1.05],
    materials.ironLight,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'sign.arm-brace',
    [0.07, 0.42, 0.07],
    [anchorX, anchorY - 0.08, fz + 0.2],
    materials.ironLight,
    [0.55, 0, 0],
    0.015,
  );
  addCylinder(
    group,
    'sign.arm-scroll',
    0.04,
    0.04,
    0.18,
    [anchorX, anchorY + 0.1, fz + 1.12],
    materials.iron,
    8,
    [0, 0, Math.PI / 2],
  );

  const swing = new THREE.Group();
  swing.name = 'socket.signSwing';
  swing.position.set(anchorX, anchorY + 0.02, fz + 0.95);
  group.add(swing);
  sockets.signSwing = swing;

  // Thick multi-plank yellow wood board — face +X (readable from street)
  // Board is vertical plane facing roughly +Z / slightly out
  addBlock(swing, 'sign.board.core', [0.16, 1.35, 1.15], [0, -0.65, 0], materials.yellowWood, [0, 0, 0], 0.05);
  // Horizontal planks for wood read
  addBlock(
    swing,
    'sign.board.plank.0',
    [0.08, 0.38, 1.08],
    [0.08, -0.22, 0],
    materials.yellowWoodLight,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    swing,
    'sign.board.plank.1',
    [0.08, 0.38, 1.06],
    [0.08, -0.62, 0],
    materials.yellowWood,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    swing,
    'sign.board.plank.2',
    [0.08, 0.4, 1.08],
    [0.08, -1.02, 0],
    materials.yellowWoodDark,
    [0, 0, 0],
    0.03,
  );
  // Dark timber border frame
  addBlock(swing, 'sign.border.outer', [0.1, 1.48, 1.28], [-0.03, -0.65, 0], materials.timberDark, [0, 0, 0], 0.035);
  addBlock(swing, 'sign.border.top', [0.12, 0.1, 1.22], [0.05, 0.05, 0], materials.timberDark, [0, 0, 0], 0.02);
  addBlock(swing, 'sign.border.bot', [0.12, 0.1, 1.22], [0.05, -1.32, 0], materials.timberDark, [0, 0, 0], 0.02);
  addBlock(swing, 'sign.border.L', [0.12, 1.4, 0.1], [0.05, -0.65, -0.58], materials.timberDark, [0, 0, 0], 0.02);
  addBlock(swing, 'sign.border.R', [0.12, 1.4, 0.1], [0.05, -0.65, 0.58], materials.timberDark, [0, 0, 0], 0.02);

  // "GENERAL" / "STORE" as bold ink bars (lettering mass)
  addBlock(swing, 'sign.text.general', [0.06, 0.14, 0.88], [0.13, -0.2, 0], materials.ink, [0, 0, 0], 0.012);
  addBlock(swing, 'sign.text.general.serif', [0.05, 0.05, 0.92], [0.13, -0.1, 0], materials.ink, [0, 0, 0], 0.01);
  addBlock(swing, 'sign.text.store', [0.06, 0.14, 0.7], [0.13, -0.45, 0], materials.ink, [0, 0, 0], 0.012);
  addBlock(swing, 'sign.text.store.serif', [0.05, 0.05, 0.74], [0.13, -0.55, 0], materials.ink, [0, 0, 0], 0.01);
  // letter stubs for more glyph mass
  for (let i = 0; i < 7; i += 1) {
    addBlock(
      swing,
      `sign.text.glyph.g.${i}`,
      [0.04, 0.1, 0.06],
      [0.14, -0.2, -0.35 + i * 0.12],
      materials.ink,
      [0, 0, 0],
      0.008,
    );
  }
  for (let i = 0; i < 5; i += 1) {
    addBlock(
      swing,
      `sign.text.glyph.s.${i}`,
      [0.04, 0.1, 0.06],
      [0.14, -0.45, -0.25 + i * 0.12],
      materials.ink,
      [0, 0, 0],
      0.008,
    );
  }

  // Icon: crate + sack + produce (bottom of board)
  addBlock(swing, 'sign.icon.crate', [0.1, 0.28, 0.28], [0.14, -0.95, -0.22], materials.timber, [0, 0, 0], 0.025);
  addBlock(
    swing,
    'sign.icon.crate.rim',
    [0.08, 0.05, 0.3],
    [0.16, -0.82, -0.22],
    materials.timberDark,
    [0, 0, 0],
    0.012,
  );
  addSphere(swing, 'sign.icon.produce.a', 0.07, [0.18, -0.78, -0.28], materials.produceRed, 6);
  addSphere(swing, 'sign.icon.produce.b', 0.06, [0.18, -0.78, -0.16], materials.produceGreen, 6);
  addSphere(swing, 'sign.icon.produce.c', 0.055, [0.18, -0.72, -0.22], materials.produceYellow, 6);
  addBlock(swing, 'sign.icon.sack', [0.12, 0.32, 0.22], [0.14, -0.98, 0.24], materials.sack, [0, 0, 0], 0.03);
  addBlock(swing, 'sign.icon.sack-tie', [0.08, 0.07, 0.12], [0.16, -0.8, 0.24], materials.timberDark, [0, 0, 0], 0.012);
  addBlock(swing, 'sign.icon.sack-label', [0.05, 0.08, 0.14], [0.18, -0.98, 0.24], materials.ink, [0, 0, 0], 0.01);

  // Chains / hangers
  addCylinder(swing, 'sign.chain.L', 0.025, 0.025, 0.22, [0, -0.02, -0.32], materials.iron, 6);
  addCylinder(swing, 'sign.chain.R', 0.025, 0.025, 0.22, [0, -0.02, 0.32], materials.iron, 6);
  addSphere(swing, 'sign.chain.ring.L', 0.04, [0, 0.08, -0.32], materials.ironLight, 6);
  addSphere(swing, 'sign.chain.ring.R', 0.04, [0, 0.08, 0.32], materials.ironLight, 6);
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
        size: [DIMS.width + 0.55, 0.32, DIMS.depth + 0.5],
        isTrigger: false,
      },
      building: {
        type: 'box',
        center: [0, 3.0, 0],
        size: [DIMS.width, 5.6, DIMS.depth],
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
        size: [DIMS.width, 0.4, DIMS.porchDepth],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [1.7, 3.9, DIMS.frontZ + 1.0],
        size: [1.4, 1.8, 1.2],
        isTrigger: true,
      },
      doorInteraction: {
        type: 'box',
        center: [-1.2, 1.35, DIMS.frontZ + 0.35],
        size: [1.5, 2.5, 1.1],
        isTrigger: true,
      },
    },
    destructionGroups: {
      plaster: [
        ...collectMeshes(nodes['building-core']),
        ...collectMeshes(nodes['front-facade']),
        ...collectMeshes(nodes['rear-facade']),
        ...collectMeshes(nodes['side-wall-left']),
        ...collectMeshes(nodes['side-wall-right']),
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
      'blank-plaster-slab-facade',
    ],
  };
}

/**
 * Procedural General Store v2 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism roof, ridge along depth (Z)
 * - full half-timber faces (front/rear/sides) with panelized plaster bays
 * - dense red clay tile rows, thick striped awning porch
 * - proud yellow multi-plank GENERAL STORE sign
 * - teal door, shop window, dense crates + flour barrels + sacks
 * - flower box, brick chimney
 * - sculptRuntime with sockets / colliders / destruction groups
 * - gen = img2threejs-general_shop-v2, name = hero.shop.general.v2
 */
export function createGeneralShopModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.shop.general.v2';
  root.userData.assetId = 'img2threejs-general_shop-v2';
  root.userData.gen = 'img2threejs-general_shop-v2';
  root.userData.heroVersion = 'img2threejs-general_shop-v2';
  root.userData.generator = 'img2threejs-forge-authored-v2';
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
  addFrontAndRearTimber(root, materials, nodes);
  addSideSurface(root, materials, nodes, -1);
  addSideSurface(root, materials, nodes, 1);
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
