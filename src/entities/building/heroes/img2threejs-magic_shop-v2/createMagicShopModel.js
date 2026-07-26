import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Magic shop — img2threejs v2
 *
 * Quality bar: inn-v3 / guild-v2 (failed v1 review: "质量太差")
 * Identity: purple cone tower + gold finial, crystal-ball hanging sign with
 * arm/chains, deep potion display bay + emissive bottles, purple arched door,
 * dense half-timber / stone courses / readable purple tile rows.
 * Warm countryside timber/plaster — not rounded-box spam.
 *
 * Contract:
 * - gen=img2threejs-magic_shop-v2, name=hero.shop.magic.v2
 * - sole y=0, facade +Z
 * - solid gable prism + solid cone tower (no dual rotated-box roofs)
 */

const DIMS = Object.freeze({
  width: 5.8,
  depth: 5.2,
  lowerHeight: 2.95,
  upperHeight: 1.7,
  eaveY: 4.65,
  roofWidth: 6.55,
  roofDepth: 5.85,
  roofRise: 2.05,
  frontZ: 2.6,
  towerX: -1.05,
  towerZ: 0.45,
});

const PALETTE = Object.freeze({
  plaster: 0xf5ede2,
  plasterShade: 0xe6d9c8,
  plasterDeep: 0xd5c5b2,
  timberDark: 0x4a2a16,
  timber: 0x7c4e2c,
  timberLight: 0xaa6c3c,
  roofDark: 0x6a4898,
  roof: 0x8a62b8,
  roofLight: 0xa67dcc,
  stoneDark: 0x7a7268,
  stone: 0x9a9186,
  stoneLight: 0xb4aba0,
  mortar: 0x625c56,
  sageDark: 0x5e7a56,
  sage: 0x86a072,
  sageLight: 0xa8c090,
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
      emissiveIntensity: 1.45,
    }),
    potionCyan: standard(PALETTE.potionCyan, 0.16, 0, {
      emissive: PALETTE.potionCyan,
      emissiveIntensity: 1.35,
    }),
    potionTeal: standard(PALETTE.potionTeal, 0.18, 0, {
      emissive: PALETTE.potionTeal,
      emissiveIntensity: 1.2,
    }),
    potionAmber: standard(PALETTE.potionAmber, 0.2, 0, {
      emissive: PALETTE.potionAmber,
      emissiveIntensity: 1.3,
    }),
    potionGold: standard(PALETTE.potionGold, 0.22, 0, {
      emissive: PALETTE.potionGold,
      emissiveIntensity: 1.15,
    }),
    sparkle: standard(PALETTE.sparkle, 0.15, 0, {
      emissive: PALETTE.sparkle,
      emissiveIntensity: 1.7,
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
    glassGlow: standard(0x7060a0, 0.28, 0, {
      emissive: 0x6040a0,
      emissiveIntensity: 0.65,
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
 * Closed solid gable prism with ridge along DEPTH (Z).
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
    [DIMS.width + 0.65, 0.34, DIMS.depth + 0.65],
    [0, 0.17, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.055,
  );

  // Multi-course ashlar — front
  for (let course = 0; course < 2; course += 1) {
    for (let index = 0; index < 7; index += 1) {
      const stagger = course % 2 ? 0.42 : 0;
      addBlock(
        group,
        `foundation.front-stone.c${course}.${index}`,
        [0.82, 0.22, 0.2],
        [-2.55 + index * 0.86 + stagger * 0.15, 0.14 + course * 0.22, DIMS.frontZ + 0.16],
        [materials.stoneDark, materials.stone, materials.stoneLight][(index + course) % 3],
        [0, 0, 0],
        0.028,
      );
    }
  }
  // Right / left side courses
  for (const side of [-1, 1]) {
    for (let course = 0; course < 2; course += 1) {
      for (let index = 0; index < 6; index += 1) {
        addBlock(
          group,
          `foundation.side-stone.${side > 0 ? 'R' : 'L'}.c${course}.${index}`,
          [0.18, 0.2, 0.82],
          [
            side * (DIMS.width / 2 + 0.2),
            0.14 + course * 0.2,
            -2.15 + index * 0.86 + (course % 2) * 0.2,
          ],
          [materials.stone, materials.stoneLight, materials.stoneDark][(index + course) % 3],
          [0, 0, 0],
          0.025,
        );
      }
    }
  }
  // Rear course
  for (let index = 0; index < 6; index += 1) {
    addBlock(
      group,
      `foundation.rear-stone.${index}`,
      [0.9, 0.24, 0.16],
      [-2.3 + index * 0.92, 0.16, -DIMS.frontZ - 0.1],
      [materials.stoneLight, materials.stoneDark, materials.stone][index % 3],
      [0, 0, 0],
      0.025,
    );
  }
  // Sage water-table belt
  addBlock(
    group,
    'foundation.sage-belt',
    [DIMS.width + 0.35, 0.13, DIMS.depth + 0.35],
    [0, 0.4, 0],
    materials.sage,
    [0, 0, 0],
    0.03,
  );
  // Corner stones proud
  for (const [sx, sz] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    addBlock(
      group,
      `foundation.corner.${sx}.${sz}`,
      [0.32, 0.38, 0.32],
      [sx * (DIMS.width / 2 + 0.12), 0.2, sz * (DIMS.depth / 2 + 0.12)],
      materials.stoneDark,
      [0, 0, 0],
      0.04,
    );
  }
}

function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'building-core');
  // Deeply inset core so facade timber/panels never z-fight
  const coreW = DIMS.width - 0.55;
  const coreD = DIMS.depth - 0.55;
  addBlock(
    group,
    'shell.ground-storey',
    [coreW, DIMS.lowerHeight, coreD],
    [0, 0.34 + DIMS.lowerHeight / 2, 0],
    materials.plasterDeep,
    [0, 0, 0],
    0.04,
  );
  addBlock(
    group,
    'shell.upper-storey',
    [coreW * 0.96, DIMS.upperHeight, coreD * 0.9],
    [0, 0.34 + DIMS.lowerHeight + DIMS.upperHeight / 2 - 0.06, -0.06],
    materials.plasterShade,
    [0, 0, 0],
    0.04,
  );
  nodes['ground-floor-shell'] = group;
  nodes['upper-storey-shell'] = group;
}

function addPlasterPanel(parent, name, width, height, x, y, z, materials, materialKey = 'plaster', depth = 0.1) {
  return addBlock(
    parent,
    name,
    [width, height, depth],
    [x, y, z],
    materials[materialKey] || materials.plaster,
    [0, 0, 0],
    0.02,
  );
}

/**
 * Dense half-timber front facade (panelized plaster + posts + rails + braces).
 * Door bay left, potion bay right — remaining bays filled.
 */
function addFrontFacade(root, materials, nodes) {
  const group = createNode(root, nodes, 'front-facade');
  const timberZ = DIMS.frontZ + 0.14;
  const panelZ = timberZ - 0.08;
  const halfW = DIMS.width / 2 - 0.08;
  const postsX = [-halfW, -1.95, -0.55, 0.55, 1.85, halfW];
  const railsY = [
    [0.48, 0.16],
    [1.55, 0.14],
    [2.65, 0.18],
    [3.45, 0.14],
    [4.35, 0.16],
  ];

  for (const x of postsX) {
    addBlock(
      group,
      `front.post.${x.toFixed(2)}`,
      [0.2, 4.15, 0.22],
      [x, 2.35, timberZ],
      Math.abs(x) > halfW - 0.2 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.035,
    );
  }
  for (const [y, h] of railsY) {
    addBlock(
      group,
      `front.rail.${y}`,
      [DIMS.width - 0.2, h, 0.18],
      [0, y, timberZ],
      y === 2.65 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.03,
    );
  }

  // Panelized plaster in free bays (skip door left + bay right lower)
  const bayXs = [
    [-halfW, -1.95],
    [-1.95, -0.55],
    [-0.55, 0.55],
    [0.55, 1.85],
    [1.85, halfW],
  ];
  const storeys = [
    { y0: 0.58, y1: 1.48, mat: 'plaster' },
    { y0: 1.65, y1: 2.55, mat: 'plasterShade' },
    { y0: 2.78, y1: 3.35, mat: 'plaster' },
    { y0: 3.55, y1: 4.2, mat: 'plasterShade' },
  ];
  let panelIndex = 0;
  for (const [x0, x1] of bayXs) {
    const cx = (x0 + x1) / 2;
    for (const storey of storeys) {
      const skipDoor = cx < -0.6 && cx > -2.2 && storey.y0 < 2.7;
      const skipBay = cx > 0.4 && storey.y0 < 2.7;
      if (skipDoor || skipBay) {
        if (storey.y0 >= 2.78) {
          addPlasterPanel(
            group,
            `front.panel.${panelIndex}`,
            x1 - x0 - 0.28,
            storey.y1 - storey.y0,
            cx,
            (storey.y0 + storey.y1) / 2,
            panelZ,
            materials,
            storey.mat,
          );
          panelIndex += 1;
        }
        continue;
      }
      addPlasterPanel(
        group,
        `front.panel.${panelIndex}`,
        x1 - x0 - 0.28,
        storey.y1 - storey.y0,
        cx,
        (storey.y0 + storey.y1) / 2,
        panelZ,
        materials,
        storey.mat,
      );
      panelIndex += 1;
    }
  }

  // Curved braces + chevrons (proud timber identity)
  addCurvedBrace(
    group,
    'front.brace.lower-left',
    [-halfW + 0.15, 0.55],
    [-2.0, 1.35],
    [-1.95, 2.55],
    timberZ + 0.05,
    materials.timberLight,
    0.065,
  );
  addCurvedBrace(
    group,
    'front.brace.lower-right',
    [halfW - 0.15, 0.55],
    [2.0, 1.35],
    [1.85, 2.55],
    timberZ + 0.05,
    materials.timberLight,
    0.065,
  );
  addBeamXY(
    group,
    'front.chevron.l',
    [-1.7, 2.75],
    [-0.2, 3.35],
    0.12,
    0.12,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    'front.chevron.r',
    [0.2, 3.35],
    [1.7, 2.75],
    0.12,
    0.12,
    materials.timber,
    timberZ + 0.04,
  );

  // Gable triangle plaster + truss
  const gableRise = 1.85;
  const gableShell = createMesh(
    createGableInfillGeometry(DIMS.width * 0.88, gableRise, 0.14),
    materials.plaster,
    'front.gable.plaster-infill',
  );
  gableShell.position.set(0.05, DIMS.eaveY - 0.08, panelZ - 0.02);
  group.add(gableShell);

  addBeamXY(
    group,
    'front.gable.rafter-l',
    [-2.55, DIMS.eaveY - 0.05],
    [0.05, DIMS.eaveY + gableRise - 0.1],
    0.18,
    0.16,
    materials.timberDark,
    timberZ + 0.05,
    0.03,
  );
  addBeamXY(
    group,
    'front.gable.rafter-r',
    [0.05, DIMS.eaveY + gableRise - 0.1],
    [2.55, DIMS.eaveY - 0.05],
    0.18,
    0.16,
    materials.timberDark,
    timberZ + 0.05,
    0.03,
  );
  addBlock(
    group,
    'front.gable.king-post',
    [0.18, gableRise * 0.92, 0.14],
    [0.05, DIMS.eaveY + gableRise * 0.42, timberZ + 0.04],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'front.gable.collar',
    [1.6, 0.12, 0.12],
    [0.05, DIMS.eaveY + 0.85, timberZ + 0.04],
    materials.timberLight,
    [0, 0, 0],
    0.025,
  );
  addCurvedBrace(
    group,
    'front.gable.brace-l',
    [-2.1, DIMS.eaveY],
    [-1.2, DIMS.eaveY + 0.7],
    [-0.25, DIMS.eaveY + 1.5],
    timberZ + 0.06,
    materials.timberLight,
    0.06,
  );
  addCurvedBrace(
    group,
    'front.gable.brace-r',
    [2.1, DIMS.eaveY],
    [1.2, DIMS.eaveY + 0.7],
    [0.25, DIMS.eaveY + 1.5],
    timberZ + 0.06,
    materials.timberLight,
    0.06,
  );

  // Sage belt trim at mid-floor
  addBlock(
    group,
    'front.sage-mid-belt',
    [DIMS.width - 0.15, 0.1, 0.14],
    [0, 2.65, timberZ + 0.02],
    materials.sageLight,
    [0, 0, 0],
    0.02,
  );
}

function addSideFacade(root, materials, nodes, side) {
  const label = side > 0 ? 'right' : 'left';
  const group = createNode(root, nodes, `side-facade-${label}`);
  group.position.x = side * (DIMS.width / 2 + 0.02);
  group.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;

  const timberZ = 0.1;
  const panelZ = 0.02;
  const halfD = DIMS.depth / 2 - 0.1;
  const posts = [-halfD, -1.3, 0, 1.3, halfD];

  for (const x of posts) {
    addBlock(
      group,
      `side.${label}.post.${x.toFixed(2)}`,
      [0.18, 4.1, 0.18],
      [x, 2.35, timberZ],
      materials.timber,
      [0, 0, 0],
      0.03,
    );
  }
  for (const [y, h] of [
    [0.48, 0.14],
    [1.55, 0.12],
    [2.65, 0.16],
    [3.55, 0.12],
    [4.35, 0.14],
  ]) {
    addBlock(
      group,
      `side.${label}.rail.${y}`,
      [DIMS.depth - 0.3, h, 0.14],
      [0, y, timberZ],
      y === 2.65 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.025,
    );
  }

  // Panelized plaster
  const bayXs = [
    [-halfD, -1.3],
    [-1.3, 0],
    [0, 1.3],
    [1.3, halfD],
  ];
  const storeys = [
    { y0: 0.58, y1: 1.48, mat: 'plaster' },
    { y0: 1.65, y1: 2.55, mat: 'plasterShade' },
    { y0: 2.78, y1: 3.45, mat: 'plaster' },
    { y0: 3.65, y1: 4.2, mat: 'plasterShade' },
  ];
  let i = 0;
  for (const [x0, x1] of bayXs) {
    for (const storey of storeys) {
      // Right side leaves a bay open for the arched window + planter around z~0.35 (local x)
      const cx = (x0 + x1) / 2;
      if (side > 0 && Math.abs(cx - 0.35) < 0.7 && storey.y0 < 2.7) {
        continue;
      }
      addPlasterPanel(
        group,
        `side.${label}.panel.${i}`,
        x1 - x0 - 0.26,
        storey.y1 - storey.y0,
        cx,
        (storey.y0 + storey.y1) / 2,
        panelZ,
        materials,
        storey.mat,
        0.09,
      );
      i += 1;
    }
  }

  addCurvedBrace(
    group,
    `side.${label}.brace.front`,
    [halfD - 0.2, 0.55],
    [1.0, 1.4],
    [1.3, 2.55],
    timberZ + 0.04,
    materials.timberLight,
    0.055,
  );
  addCurvedBrace(
    group,
    `side.${label}.brace.rear`,
    [-halfD + 0.2, 0.55],
    [-1.0, 1.4],
    [-1.3, 2.55],
    timberZ + 0.04,
    materials.timberLight,
    0.055,
  );
  addBlock(
    group,
    `side.${label}.sage-belt`,
    [DIMS.depth - 0.25, 0.09, 0.12],
    [0, 2.65, timberZ + 0.01],
    materials.sage,
    [0, 0, 0],
    0.02,
  );
}

function addRearFacade(root, materials, nodes) {
  const group = createNode(root, nodes, 'rear-facade');
  const timberZ = -(DIMS.frontZ + 0.12);
  const panelZ = timberZ + 0.08;
  const halfW = DIMS.width / 2 - 0.1;
  for (const x of [-halfW, -1.4, 0, 1.4, halfW]) {
    addBlock(
      group,
      `rear.post.${x.toFixed(2)}`,
      [0.18, 4.0, 0.18],
      [x, 2.3, timberZ],
      materials.timberDark,
      [0, 0, 0],
      0.03,
    );
  }
  for (const [y, h] of [
    [0.5, 0.14],
    [1.7, 0.12],
    [2.7, 0.14],
    [3.6, 0.12],
    [4.3, 0.14],
  ]) {
    addBlock(
      group,
      `rear.rail.${y}`,
      [DIMS.width - 0.25, h, 0.14],
      [0, y, timberZ],
      materials.timber,
      [0, 0, 0],
      0.025,
    );
  }
  let i = 0;
  for (const [x0, x1] of [
    [-halfW, -1.4],
    [-1.4, 0],
    [0, 1.4],
    [1.4, halfW],
  ]) {
    for (const storey of [
      { y0: 0.6, y1: 1.6, mat: 'plasterShade' },
      { y0: 1.8, y1: 2.6, mat: 'plaster' },
      { y0: 2.85, y1: 3.5, mat: 'plasterShade' },
      { y0: 3.7, y1: 4.2, mat: 'plaster' },
    ]) {
      addPlasterPanel(
        group,
        `rear.panel.${i}`,
        x1 - x0 - 0.26,
        storey.y1 - storey.y0,
        (x0 + x1) / 2,
        (storey.y0 + storey.y1) / 2,
        panelZ,
        materials,
        storey.mat,
      );
      i += 1;
    }
  }
  const gable = createMesh(
    createGableInfillGeometry(DIMS.width * 0.85, 1.7, 0.12),
    materials.plasterShade,
    'rear.gable.infill',
  );
  gable.position.set(0, DIMS.eaveY - 0.05, panelZ);
  group.add(gable);
  addBeamXY(
    group,
    'rear.gable.rafter-l',
    [-2.4, DIMS.eaveY],
    [0, DIMS.eaveY + 1.55],
    0.14,
    0.12,
    materials.timberDark,
    timberZ - 0.03,
  );
  addBeamXY(
    group,
    'rear.gable.rafter-r',
    [0, DIMS.eaveY + 1.55],
    [2.4, DIMS.eaveY],
    0.14,
    0.12,
    materials.timberDark,
    timberZ - 0.03,
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
  group.add(roof);

  // Sage fascia
  addBlock(
    group,
    'roof.fascia-front',
    [DIMS.roofWidth * 0.98, 0.14, 0.13],
    [0, DIMS.eaveY - 0.02, DIMS.roofDepth / 2 + 0.01],
    materials.sage,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-back',
    [DIMS.roofWidth * 0.98, 0.14, 0.13],
    [0, DIMS.eaveY - 0.02, -DIMS.roofDepth / 2 - 0.01],
    materials.sageDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    'roof.fascia-right',
    [0.12, 0.12, DIMS.roofDepth * 0.94],
    [DIMS.roofWidth / 2 - 0.02, DIMS.eaveY - 0.01, 0],
    materials.sage,
    [0, 0, 0],
    0.02,
  );
  addBlock(
    group,
    'roof.fascia-left',
    [0.12, 0.12, DIMS.roofDepth * 0.94],
    [-DIMS.roofWidth / 2 + 0.02, DIMS.eaveY - 0.01, 0],
    materials.sage,
    [0, 0, 0],
    0.02,
  );

  // Dense tile rows (inn-v3 density)
  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 8;
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
      const stagger = row % 2 ? tileDepth * 0.4 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.12;
        if (Math.abs(z) > DIMS.roofDepth / 2 + 0.12) continue;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 3];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.12, 0.1, tileDepth * 1.04],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.022,
        );
      }
    }
  }

  // Ridge caps
  for (let index = 0; index < 12; index += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 12) * (index + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${index}`,
      [0.36, 0.26, DIMS.roofDepth / 12.5],
      [0, DIMS.eaveY + DIMS.roofRise + 0.02, z],
      index % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.04,
      3,
    );
  }

  addTowerSpire(group, materials, nodes);
  addSideDormer(group, materials, nodes);
}

function addTowerSpire(parent, materials, nodes) {
  const group = createNode(parent, nodes, 'tower-spire');
  const baseY = DIMS.eaveY + 0.12;
  const cx = DIMS.towerX;
  const cz = DIMS.towerZ;

  // Drum under cone
  addCylinder(group, 'tower.collar', 1.0, 1.12, 0.38, [cx, baseY + 0.12, cz], materials.roof, 18);
  addCylinder(group, 'tower.collar-ring', 1.08, 1.1, 0.1, [cx, baseY - 0.02, cz], materials.sageLight, 16);
  addBlock(
    group,
    'tower.sage-band',
    [2.2, 0.1, 2.2],
    [cx, baseY - 0.08, cz],
    materials.sage,
    [0, 0, 0],
    0.03,
  );

  // Solid pointed cone
  const cone = createMesh(
    new THREE.ConeGeometry(1.22, 2.55, 20, 1, false),
    materials.roofLight,
    'tower.pointed-cone',
  );
  cone.position.set(cx, baseY + 1.45, cz);
  cone.userData.structuralRoof = true;
  cone.userData.construction = 'solid-cone-pointed-tip';
  group.add(cone);

  // Soft shade bands + tile-like rings on cone
  addCylinder(group, 'tower.band-low', 0.95, 1.05, 0.1, [cx, baseY + 0.55, cz], materials.roof, 16);
  addCylinder(group, 'tower.band-mid', 0.68, 0.82, 0.1, [cx, baseY + 1.05, cz], materials.roofDark, 14);
  addCylinder(group, 'tower.band-upper', 0.4, 0.52, 0.09, [cx, baseY + 1.7, cz], materials.roof, 12);
  addCylinder(group, 'tower.band-tip', 0.18, 0.28, 0.08, [cx, baseY + 2.2, cz], materials.roofDark, 10);

  // Gold finial
  addSphere(group, 'tower.finial-ball', 0.13, [cx, baseY + 2.85, cz], materials.gold, 12);
  addCylinder(
    group,
    'tower.finial-spike',
    0.022,
    0.05,
    0.32,
    [cx, baseY + 3.08, cz],
    materials.goldLight,
    8,
  );
  addSphere(group, 'tower.finial-tip', 0.055, [cx, baseY + 3.28, cz], materials.goldLight, 8);

  // Small plaster lantern neck under tower
  addCylinder(
    group,
    'tower.neck-plaster',
    0.55,
    0.7,
    0.55,
    [cx, baseY - 0.35, cz],
    materials.plaster,
    14,
  );
  // Mini arched window in tower neck facing +Z
  addBlock(
    group,
    'tower.neck-window-frame',
    [0.42, 0.48, 0.1],
    [cx, baseY - 0.32, cz + 0.55],
    materials.timberLight,
    [0, 0, 0],
    0.025,
  );
  addCylinder(
    group,
    'tower.neck-window-arch',
    0.2,
    0.2,
    0.08,
    [cx, baseY - 0.12, cz + 0.56],
    materials.timberLight,
    12,
    [Math.PI / 2, 0, 0],
  );
  addBlock(
    group,
    'tower.neck-window-glass',
    [0.3, 0.32, 0.05],
    [cx, baseY - 0.35, cz + 0.58],
    materials.glassDark,
    [0, 0, 0],
    0.015,
  );
}

function addSideDormer(parent, materials, nodes) {
  const group = createNode(parent, nodes, 'side-dormer');
  const x = 1.65;
  const y = DIMS.eaveY + 0.9;
  const z = -0.1;

  addBlock(group, 'dormer.body', [0.58, 0.75, 1.0], [x, y, z], materials.plaster, [0, 0, 0], 0.04);
  addBlock(group, 'dormer.sill-sage', [0.62, 0.08, 1.05], [x, y - 0.38, z], materials.sage, [0, 0, 0], 0.02);
  const cap = createMesh(
    createSolidGableGeometry(1.05, 0.75, 0.48),
    materials.roof,
    'dormer.roof-prism',
  );
  cap.rotation.y = Math.PI / 2;
  cap.position.set(x + 0.06, y + 0.35, z);
  group.add(cap);
  // Tile nubs on dormer roof
  for (let i = 0; i < 3; i += 1) {
    addBlock(
      group,
      `dormer.tile.${i}`,
      [0.12, 0.08, 0.28],
      [x + 0.22, y + 0.55 + i * 0.05, z - 0.25 + i * 0.25],
      materials.roofLight,
      [0, 0, -0.35],
      0.02,
    );
  }

  addCylinder(
    group,
    'dormer.window-frame',
    0.3,
    0.3,
    0.1,
    [x + 0.3, y + 0.05, z],
    materials.timberLight,
    16,
    [0, 0, Math.PI / 2],
  );
  addCylinder(
    group,
    'dormer.window-glass',
    0.23,
    0.23,
    0.06,
    [x + 0.34, y + 0.05, z],
    materials.glassDark,
    14,
    [0, 0, Math.PI / 2],
  );
  addBlock(group, 'dormer.muntin-v', [0.04, 0.42, 0.04], [x + 0.36, y + 0.05, z], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'dormer.muntin-h', [0.04, 0.04, 0.42], [x + 0.36, y + 0.05, z], materials.timber, [0, 0, 0], 0.01);
}

function addDoor(root, materials, nodes, sockets) {
  const assembly = createNode(root, nodes, 'door-system');
  const fz = DIMS.frontZ + 0.2;
  const doorX = -1.5;
  const doorW = 1.18;
  const doorH = 2.2;

  // Deep timber portal (proud of plaster)
  addBlock(assembly, 'door.frame-left', [0.24, 2.55, 0.36], [doorX - doorW / 2 - 0.1, 1.5, fz], materials.timber, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-right', [0.24, 2.55, 0.36], [doorX + doorW / 2 + 0.1, 1.5, fz], materials.timber, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-lintel', [doorW + 0.6, 0.28, 0.4], [doorX, 2.8, fz], materials.timberDark, [0, 0, 0], 0.045);
  addCylinder(
    assembly,
    'door.arch',
    doorW / 2 + 0.14,
    doorW / 2 + 0.14,
    0.24,
    [doorX, 2.62, fz + 0.02],
    materials.timber,
    18,
    [Math.PI / 2, 0, 0],
  );
  // Arch inner reveal
  addCylinder(
    assembly,
    'door.arch-inner',
    doorW / 2 + 0.02,
    doorW / 2 + 0.02,
    0.12,
    [doorX, 2.62, fz + 0.08],
    materials.timberDark,
    16,
    [Math.PI / 2, 0, 0],
  );

  // Outer porch posts + header
  addBlock(assembly, 'door.post-left', [0.3, 2.85, 0.3], [doorX - doorW / 2 - 0.38, 1.6, fz + 0.1], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.post-right', [0.3, 2.85, 0.3], [doorX + doorW / 2 + 0.38, 1.6, fz + 0.1], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.header-beam', [doorW + 1.15, 0.22, 0.3], [doorX, 3.05, fz + 0.08], materials.timber, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.header-cap', [doorW + 1.25, 0.1, 0.34], [doorX, 3.18, fz + 0.08], materials.sage, [0, 0, 0], 0.025);

  // Door leaf
  const hinge = new THREE.Group();
  hinge.name = 'door.hinge-pivot';
  hinge.position.set(doorX - doorW / 2 + 0.04, 0.4, fz + 0.05);
  assembly.add(hinge);
  sockets.doorHinge = hinge;

  addBlock(hinge, 'door.leaf', [doorW - 0.08, doorH, 0.12], [doorW / 2 - 0.04, doorH / 2, 0], materials.doorPurple, [0, 0, 0], 0.04);
  // Arched top of leaf
  addCylinder(
    hinge,
    'door.leaf-arch',
    doorW / 2 - 0.06,
    doorW / 2 - 0.06,
    0.12,
    [doorW / 2 - 0.04, doorH - 0.05, 0],
    materials.doorPurple,
    16,
    [Math.PI / 2, 0, 0],
  );
  // Gold filigree panels
  addBlock(hinge, 'door.panel-upper', [doorW * 0.58, 0.52, 0.04], [doorW / 2 - 0.04, doorH * 0.7, 0.08], materials.doorPurpleDark, [0, 0, 0], 0.03);
  addBlock(hinge, 'door.panel-lower', [doorW * 0.58, 0.52, 0.04], [doorW / 2 - 0.04, doorH * 0.32, 0.08], materials.doorPurpleDark, [0, 0, 0], 0.03);
  addTorus(hinge, 'door.filigree-u', 0.26, 0.018, [doorW / 2 - 0.04, doorH * 0.7, 0.1], materials.gold, [0, 0, 0], 16, Math.PI * 1.6);
  addTorus(hinge, 'door.filigree-l', 0.26, 0.018, [doorW / 2 - 0.04, doorH * 0.32, 0.1], materials.gold, [0, 0, 0], 16, Math.PI * 1.6);
  // Micro gold dots on filigree
  for (const [py, px] of [
    [doorH * 0.7, 0.18],
    [doorH * 0.7, -0.18],
    [doorH * 0.32, 0.18],
    [doorH * 0.32, -0.18],
  ]) {
    addSphere(hinge, `door.filigree-dot.${py}.${px}`, 0.03, [doorW / 2 - 0.04 + px, py, 0.12], materials.goldLight, 6);
  }
  addSphere(hinge, 'door.knob', 0.075, [doorW - 0.24, doorH * 0.5, 0.12], materials.goldLight, 10);
  addCylinder(hinge, 'door.knob-stem', 0.025, 0.025, 0.08, [doorW - 0.24, doorH * 0.5, 0.08], materials.gold, 8, [Math.PI / 2, 0, 0]);
  for (const y of [0.35, 1.0, 1.65]) {
    addBlock(hinge, `door.strap.${y}`, [0.3, 0.1, 0.05], [0.16, y, 0.1], materials.gold, [0, 0, 0], 0.02);
    addCylinder(hinge, `door.strap-rivet.${y}`, 0.025, 0.025, 0.04, [0.08, y, 0.14], materials.goldLight, 6, [Math.PI / 2, 0, 0]);
  }

  addBlock(assembly, 'door.reveal', [doorW * 0.9, doorH * 0.92, 0.1], [doorX, 1.5, fz - 0.14], materials.interior, [0, 0, 0], 0.02);
  addBlock(assembly, 'door.threshold', [doorW + 0.3, 0.1, 0.4], [doorX, 0.42, fz + 0.05], materials.timberDark, [0, 0, 0], 0.03);

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
    addSphere(group, `${name}.body`, 0.18, [0, 0.14, 0], liquid, 12, [1.15, 0.85, 1.15]);
    addCylinder(group, `${name}.neck`, 0.05, 0.07, 0.12, [0, 0.32, 0], materials.glass, 9);
  }
  addCylinder(
    group,
    `${name}.cork`,
    0.06,
    0.05,
    0.08,
    [0, style === 'tall' ? 0.58 : style === 'squat' ? 0.4 : 0.52, 0],
    materials.timberLight,
    8,
  );
  // Liquid meniscus highlight
  addSphere(
    group,
    `${name}.highlight`,
    0.06,
    [0.06, style === 'tall' ? 0.28 : 0.22, 0.12],
    materials.sparkle,
    6,
    [1, 0.6, 0.5],
  );
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    addSphere(
      group,
      `${name}.sparkle.${i}`,
      0.022,
      [Math.cos(a) * 0.18, 0.16 + i * 0.06, Math.sin(a) * 0.14],
      materials.sparkle,
      5,
    );
  }
  return group;
}

function addDisplayBay(root, materials, nodes) {
  const group = createNode(root, nodes, 'display-bay');
  const wallZ = DIMS.frontZ + 0.12;
  const bayX = 1.15;
  const bayY = 1.65;
  const bayW = 2.25;
  const bayH = 1.7;
  const frontZ = DIMS.frontZ + 0.78;

  // Deep projected bay body
  addBlock(group, 'bay.lower-wood', [bayW + 0.2, 1.0, 0.9], [bayX, 0.78, wallZ + 0.4], materials.timber, [0, 0, 0], 0.05);
  // Vertical plank relief
  for (let i = 0; i < 6; i += 1) {
    addBlock(
      group,
      `bay.plank.${i}`,
      [0.2, 0.92, 0.08],
      [bayX - bayW * 0.42 + i * 0.38, 0.78, frontZ - 0.05],
      i % 2 === 0 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.02,
    );
  }
  // Angled side returns of bay base
  addBlock(
    group,
    'bay.lower-return-l',
    [0.35, 0.95, 0.55],
    [bayX - bayW / 2 - 0.05, 0.76, wallZ + 0.25],
    materials.timberDark,
    [0, 0.35, 0],
    0.04,
  );
  addBlock(
    group,
    'bay.lower-return-r',
    [0.35, 0.95, 0.55],
    [bayX + bayW / 2 + 0.05, 0.76, wallZ + 0.25],
    materials.timberDark,
    [0, -0.35, 0],
    0.04,
  );

  addBlock(group, 'bay.sill', [bayW + 0.35, 0.16, 0.95], [bayX, 1.3, wallZ + 0.42], materials.timberDark, [0, 0, 0], 0.03);
  addBlock(group, 'bay.header', [bayW + 0.4, 0.2, 0.95], [bayX, bayY + bayH / 2 + 0.08, wallZ + 0.4], materials.timberDark, [0, 0, 0], 0.035);
  addBlock(group, 'bay.header-sage', [bayW + 0.45, 0.08, 0.98], [bayX, bayY + bayH / 2 + 0.2, wallZ + 0.4], materials.sage, [0, 0, 0], 0.02);

  // Corner posts of bay
  const posts = [
    [bayX - bayW / 2 - 0.05, wallZ + 0.15],
    [bayX - bayW / 2 + 0.15, frontZ - 0.05],
    [bayX + bayW / 2 - 0.15, frontZ - 0.05],
    [bayX + bayW / 2 + 0.05, wallZ + 0.15],
  ];
  posts.forEach(([px, pz], index) => {
    addBlock(
      group,
      `bay.post.${index}`,
      [0.16, bayH + 0.25, 0.16],
      [px, bayY, pz],
      index === 0 || index === 3 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.03,
    );
  });

  // Glass panes — front + angled returns (real depth)
  addBlock(group, 'bay.glass.front', [bayW * 0.88, bayH * 0.88, 0.06], [bayX, bayY, frontZ], materials.glassGlow, [0, 0, 0], 0.02);
  addBlock(
    group,
    'bay.glass.left',
    [0.08, bayH * 0.88, 0.65],
    [bayX - bayW / 2 + 0.08, bayY, wallZ + 0.38],
    materials.glassDark,
    [0, 0.25, 0],
    0.02,
  );
  addBlock(
    group,
    'bay.glass.right',
    [0.08, bayH * 0.88, 0.65],
    [bayX + bayW / 2 - 0.08, bayY, wallZ + 0.38],
    materials.glassDark,
    [0, -0.25, 0],
    0.02,
  );

  // Muntin lattice
  addBlock(group, 'bay.muntin-v1', [0.06, bayH * 0.86, 0.05], [bayX - 0.35, bayY, frontZ + 0.03], materials.timberDark, [0, 0, 0], 0.012);
  addBlock(group, 'bay.muntin-v2', [0.06, bayH * 0.86, 0.05], [bayX + 0.35, bayY, frontZ + 0.03], materials.timberDark, [0, 0, 0], 0.012);
  addBlock(group, 'bay.muntin-h', [bayW * 0.85, 0.06, 0.05], [bayX, bayY + 0.12, frontZ + 0.03], materials.timberDark, [0, 0, 0], 0.012);
  addBlock(group, 'bay.muntin-h2', [bayW * 0.85, 0.05, 0.05], [bayX, bayY - 0.35, frontZ + 0.03], materials.timber, [0, 0, 0], 0.01);

  // Interior depth + shelves
  addBlock(group, 'bay.interior-back', [bayW * 0.88, bayH * 0.9, 0.1], [bayX, bayY, wallZ + 0.02], materials.interior, [0, 0, 0], 0.02);
  addBlock(group, 'bay.shelf-main', [bayW * 0.82, 0.08, 0.5], [bayX, bayY - 0.2, wallZ + 0.38], materials.timber, [0, 0, 0], 0.02);
  addBlock(group, 'bay.shelf-upper', [bayW * 0.55, 0.06, 0.35], [bayX + 0.2, bayY + 0.48, wallZ + 0.32], materials.timberDark, [0, 0, 0], 0.02);
  addBlock(group, 'bay.shelf-side', [0.35, 0.06, 0.4], [bayX - 0.55, bayY + 0.35, wallZ + 0.35], materials.timber, [0, 0, 0], 0.02);

  // Emissive potions
  const potionGroup = createNode(group, nodes, 'potions');
  createPotion(potionGroup, materials, 'potion.magenta', [bayX - 0.58, bayY - 0.08, wallZ + 0.52], 'potionMagenta', 1.1, 'round');
  createPotion(potionGroup, materials, 'potion.cyan', [bayX + 0.05, bayY - 0.15, wallZ + 0.58], 'potionCyan', 0.95, 'squat');
  createPotion(potionGroup, materials, 'potion.amber', [bayX + 0.58, bayY - 0.1, wallZ + 0.5], 'potionAmber', 0.9, 'squat');
  createPotion(potionGroup, materials, 'potion.gold-upper', [bayX + 0.22, bayY + 0.55, wallZ + 0.42], 'potionGold', 0.75, 'tall');
  createPotion(potionGroup, materials, 'potion.teal-side', [bayX - 0.35, bayY + 0.42, wallZ + 0.45], 'potionTeal', 0.68, 'tall');

  // Floating sparkles in glass volume
  for (let i = 0; i < 10; i += 1) {
    addSphere(
      potionGroup,
      `bay.sparkle-float.${i}`,
      0.028,
      [
        bayX - 0.7 + (i % 5) * 0.32,
        bayY + 0.1 + (i % 3) * 0.22 + (i > 4 ? 0.15 : 0),
        wallZ + 0.55 + (i % 2) * 0.08,
      ],
      materials.sparkle,
      5,
    );
  }
}

function addFrontUpperWindow(root, materials, nodes) {
  const group = createNode(root, nodes, 'front-upper-window');
  const fz = DIMS.frontZ + 0.16;
  const y = 4.15;
  addBlock(group, 'upper.frame', [0.9, 1.0, 0.16], [0.05, y, fz], materials.timberLight, [0, 0, 0], 0.03);
  addCylinder(group, 'upper.arch', 0.45, 0.45, 0.14, [0.05, y + 0.38, fz + 0.02], materials.timberLight, 16, [Math.PI / 2, 0, 0]);
  addBlock(group, 'upper.glass', [0.68, 0.72, 0.06], [0.05, y - 0.02, fz + 0.05], materials.glassDark, [0, 0, 0], 0.02);
  addBlock(group, 'upper.muntin-v', [0.05, 0.68, 0.05], [0.05, y - 0.02, fz + 0.08], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'upper.muntin-h', [0.62, 0.05, 0.05], [0.05, y - 0.02, fz + 0.08], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'upper.sage-sill', [1.05, 0.1, 0.18], [0.05, y - 0.55, fz + 0.02], materials.sage, [0, 0, 0], 0.02);
  addBlock(group, 'upper.sill-cap', [1.1, 0.06, 0.2], [0.05, y - 0.62, fz + 0.03], materials.timberLight, [0, 0, 0], 0.015);
}

function addSideWindow(root, materials, nodes) {
  const group = createNode(root, nodes, 'side-window');
  const x = DIMS.width / 2 + 0.12;
  const y = 1.9;
  const z = 0.35;

  addBlock(group, 'side.frame', [0.16, 1.2, 1.0], [x, y, z], materials.timberLight, [0, 0, 0], 0.03);
  addCylinder(group, 'side.arch', 0.44, 0.44, 0.12, [x + 0.02, y + 0.42, z], materials.timberLight, 16, [0, 0, Math.PI / 2]);
  addBlock(group, 'side.glass', [0.06, 0.9, 0.75], [x + 0.06, y - 0.05, z], materials.glassDark, [0, 0, 0], 0.02);
  addBlock(group, 'side.muntin-v', [0.04, 0.85, 0.05], [x + 0.08, y - 0.05, z], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'side.muntin-h', [0.04, 0.05, 0.7], [x + 0.08, y - 0.05, z], materials.timber, [0, 0, 0], 0.01);
  addBlock(group, 'side.sage-sill', [0.18, 0.1, 1.15], [x + 0.02, y - 0.65, z], materials.sage, [0, 0, 0], 0.02);

  // Flower box + lavender
  addBlock(group, 'flower.box', [0.34, 0.24, 1.2], [x + 0.2, y - 0.82, z], materials.sageLight, [0, 0, 0], 0.035);
  addBlock(group, 'flower.box-purple-band', [0.1, 0.12, 0.75], [x + 0.34, y - 0.82, z], materials.doorPurple, [0, 0, 0], 0.02);
  addBlock(group, 'flower.box-rim', [0.36, 0.06, 1.22], [x + 0.2, y - 0.7, z], materials.sage, [0, 0, 0], 0.015);
  for (let i = 0; i < 9; i += 1) {
    const ox = ((i % 3) - 1) * 0.07;
    const oz = -0.48 + i * 0.12;
    addCylinder(
      group,
      `lavender.stem.${i}`,
      0.015,
      0.02,
      0.28 + (i % 3) * 0.05,
      [x + 0.24 + ox, y - 0.58, z + oz],
      materials.foliageDark,
      5,
    );
    addSphere(
      group,
      `lavender.bloom.${i}`,
      0.055,
      [x + 0.24 + ox, y - 0.4 + (i % 2) * 0.04, z + oz],
      i % 2 === 0 ? materials.lavender : materials.lavenderLight,
      8,
      [0.7, 1.45, 0.7],
    );
    if (i % 3 === 0) {
      addSphere(
        group,
        `lavender.leaf.${i}`,
        0.04,
        [x + 0.2 + ox, y - 0.52, z + oz + 0.04],
        materials.foliage,
        6,
        [1.2, 0.5, 0.8],
      );
    }
  }
}

function addChainRun(parent, materials, name, x, topY, bottomY, z) {
  const count = 5;
  for (let index = 0; index < count; index += 1) {
    const y = THREE.MathUtils.lerp(topY, bottomY, (index + 0.5) / count);
    addTorus(
      parent,
      `${name}.link.${index}`,
      0.055,
      0.016,
      [x, y, z],
      materials.iron,
      index % 2 === 0 ? [0, 0, 0] : [0, Math.PI / 2, 0],
      10,
    );
  }
}

function addSign(root, materials, nodes, sockets) {
  const rig = createNode(root, nodes, 'sign-rig');
  const wallX = 0.65;
  const wallY = 3.65;
  const wallZ = DIMS.frontZ + 0.18;

  // Wall mount + black iron arm
  addBlock(rig, 'sign.wall-plate', [0.2, 0.4, 0.16], [wallX, wallY + 0.18, wallZ], materials.iron, [0, 0, 0], 0.03);
  addBlock(rig, 'sign.wall-bolt-l', [0.06, 0.06, 0.08], [wallX, wallY + 0.3, wallZ + 0.08], materials.ironLight, [0, 0, 0], 0.015);
  addBlock(rig, 'sign.wall-bolt-r', [0.06, 0.06, 0.08], [wallX, wallY + 0.06, wallZ + 0.08], materials.ironLight, [0, 0, 0], 0.015);

  // Arm projects toward -X / +Z over the bay
  addCylinderBetween(
    rig,
    'sign.arm',
    [wallX, wallY + 0.25, wallZ + 0.05],
    [wallX - 0.15, wallY + 0.28, wallZ + 0.95],
    0.045,
    materials.iron,
    10,
  );
  addCylinderBetween(
    rig,
    'sign.arm-brace',
    [wallX, wallY + 0.05, wallZ + 0.05],
    [wallX - 0.05, wallY + 0.22, wallZ + 0.55],
    0.03,
    materials.ironLight,
    8,
  );
  // Arm tip upright
  addBlock(rig, 'sign.arm-tip', [0.08, 0.35, 0.08], [wallX - 0.15, wallY + 0.35, wallZ + 0.95], materials.iron, [0, 0, 0], 0.02);
  addSphere(rig, 'sign.arm-ball', 0.06, [wallX - 0.15, wallY + 0.55, wallZ + 0.95], materials.ironLight, 8);

  // Chains
  addChainRun(rig, materials, 'sign.chain-left', wallX - 0.4, wallY + 0.22, wallY - 0.15, wallZ + 0.72);
  addChainRun(rig, materials, 'sign.chain-right', wallX + 0.1, wallY + 0.22, wallY - 0.15, wallZ + 0.78);
  // Rope wraps as alternative hangers
  for (const sx of [-0.38, 0.12]) {
    addCylinder(
      rig,
      `sign.rope-wrap.${sx}`,
      0.022,
      0.022,
      0.22,
      [wallX + sx, wallY + 0.05, wallZ + 0.75],
      materials.rope,
      6,
    );
  }

  const swing = new THREE.Group();
  swing.name = 'sign.swing-pivot';
  swing.position.set(wallX - 0.15, wallY - 0.12, wallZ + 0.75);
  rig.add(swing);
  sockets.signSwing = swing;

  // Wooden plate
  addBlock(swing, 'sign.plate', [1.1, 1.32, 0.1], [0, -0.6, 0], materials.signWood, [0, 0, 0], 0.04);
  addBlock(swing, 'sign.plate-border', [1.18, 1.4, 0.06], [0, -0.6, -0.02], materials.signWoodDark, [0, 0, 0], 0.03);
  addBlock(swing, 'sign.plate-edge-top', [1.14, 0.06, 0.08], [0, 0.04, 0.02], materials.signWoodDark, [0, 0, 0], 0.015);
  addBlock(swing, 'sign.plate-edge-bot', [1.14, 0.06, 0.08], [0, -1.24, 0.02], materials.signWoodDark, [0, 0, 0], 0.015);

  // Crystal ball emblem
  addSphere(swing, 'sign.crystal-ball', 0.24, [0, -0.48, 0.1], materials.crystalDeep, 16);
  addSphere(swing, 'sign.crystal-highlight', 0.09, [-0.07, -0.4, 0.24], materials.crystal, 10);
  addSphere(swing, 'sign.crystal-core', 0.08, [0.02, -0.5, 0.14], materials.sparkle, 8);
  addCylinder(swing, 'sign.crystal-stand', 0.04, 0.12, 0.1, [0, -0.7, 0.1], materials.ink, 10);
  addTorus(swing, 'sign.crystal-ring', 0.14, 0.02, [0, -0.48, 0.1], materials.gold, [Math.PI / 2, 0, 0], 14);
  // Stars
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    addSphere(
      swing,
      `sign.star.${i}`,
      0.03,
      [Math.cos(a) * 0.36, -0.48 + Math.sin(a) * 0.3, 0.12],
      materials.sparkle,
      5,
    );
  }

  // Title bars
  addBlock(swing, 'sign.title-bar-top', [0.78, 0.13, 0.04], [0, -0.08, 0.08], materials.ink, [0, 0, 0], 0.015);
  addBlock(swing, 'sign.title-bar-mid', [0.62, 0.11, 0.04], [0, -0.22, 0.08], materials.doorPurpleDark, [0, 0, 0], 0.015);
  // Purple ribbon tag
  addBlock(swing, 'sign.ribbon', [1.0, 0.18, 0.05], [0, -1.12, 0.08], materials.doorPurple, [0, 0, 0], 0.02);
  addBlock(swing, 'sign.ribbon-text', [0.78, 0.06, 0.03], [0, -1.12, 0.11], materials.goldLight, [0, 0, 0], 0.01);
  // Corner nubs on plate
  for (const [cx, cy] of [
    [-0.48, -0.12],
    [0.48, -0.12],
    [-0.48, -1.08],
    [0.48, -1.08],
  ]) {
    addSphere(swing, `sign.plate-nub.${cx}.${cy}`, 0.04, [cx, cy, 0.08], materials.gold, 6);
  }

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.sign-interaction';
  interaction.position.set(wallX - 0.15, wallY - 0.55, wallZ + 1.15);
  root.add(interaction);
  sockets.signInteraction = interaction;
}

function addFloorBelt(root, materials, nodes) {
  const group = createNode(root, nodes, 'floor-belt');
  // Continuous proud timber belt around mid-floor
  addBlock(
    group,
    'belt.front',
    [DIMS.width + 0.1, 0.2, 0.2],
    [0, 3.0, DIMS.frontZ + 0.18],
    materials.timberDark,
    [0, 0, 0],
    0.035,
  );
  addBlock(
    group,
    'belt.rear',
    [DIMS.width + 0.1, 0.18, 0.16],
    [0, 3.0, -DIMS.frontZ - 0.12],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'belt.right',
    [0.18, 0.18, DIMS.depth + 0.1],
    [DIMS.width / 2 + 0.1, 3.0, 0],
    materials.timber,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'belt.left',
    [0.18, 0.18, DIMS.depth + 0.1],
    [-DIMS.width / 2 - 0.1, 3.0, 0],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  // Sage accent under belt
  addBlock(
    group,
    'belt.sage-front',
    [DIMS.width - 0.2, 0.08, 0.12],
    [0, 2.88, DIMS.frontZ + 0.16],
    materials.sageLight,
    [0, 0, 0],
    0.02,
  );
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
        center: [0, 0.17, 0],
        size: [DIMS.width + 0.65, 0.34, DIMS.depth + 0.65],
        isTrigger: false,
      },
      building: {
        type: 'box',
        center: [0, 2.5, 0],
        size: [DIMS.width, 4.4, DIMS.depth],
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
        center: [DIMS.towerX, DIMS.eaveY + 1.6, DIMS.towerZ],
        size: [2.4, 2.8, 2.4],
        isTrigger: false,
      },
      displayBay: {
        type: 'box',
        center: [1.15, 1.5, DIMS.frontZ + 0.45],
        size: [2.6, 2.6, 1.2],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [0.5, 3.2, DIMS.frontZ + 1.0],
        size: [1.8, 1.9, 1.3],
        isTrigger: true,
      },
      doorInteraction: {
        type: 'box',
        center: [-1.5, 1.35, DIMS.frontZ + 0.85],
        size: [1.7, 2.5, 1.3],
        isTrigger: true,
      },
    },
    destructionGroups: {
      plaster: [
        ...collectMeshes(nodes['building-core']),
        ...collectMeshes(nodes['front-facade']),
        ...collectMeshes(nodes['rear-facade']),
        ...collectMeshes(nodes['side-facade-right']),
        ...collectMeshes(nodes['side-facade-left']),
      ],
      timberFrame: [
        ...collectMeshes(nodes['front-facade']).filter((m) => /post|rail|brace|chevron|timber|rafter|king|collar/.test(m.name)),
        ...collectMeshes(nodes['floor-belt']),
      ],
      roof: [
        ...collectMeshes(nodes.roof),
        ...collectMeshes(nodes['tower-spire']),
        ...collectMeshes(nodes['side-dormer']),
        ...collectMeshes(nodes['roof-relief']),
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
      'rounded-box-template-spam',
    ],
    qualityUpgradesFromV1: [
      'panelized half-timber every face (front/sides/rear)',
      'dense purple tile rows (8x10 + ridge caps)',
      'deep bay with angled returns + 5 emissive potions',
      'crystal sign with iron arm + chain links + rope',
      'multi-course ashlar foundation + corner stones',
      'gable truss with braces/king-post/collar',
      'floor belt + sage trim continuity',
    ],
  };
}

/**
 * Procedural Magic Shop v2 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism main roof + solid pointed cone tower
 * - purple roof identity, crystal-ball hanging sign, glowing potion bay
 * - dense half-timber / stone / tile density competitive with inn-v3
 */
export function createMagicShopModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.shop.magic.v2';
  root.userData.assetId = 'img2threejs-magic_shop-v2';
  root.userData.gen = 'img2threejs-magic_shop-v2';
  root.userData.heroVersion = 'img2threejs-magic_shop-v2';
  root.userData.generator = 'img2threejs-forge-authored-v2';
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
  addFrontFacade(root, materials, nodes);
  addSideFacade(root, materials, nodes, 1);
  addSideFacade(root, materials, nodes, -1);
  addRearFacade(root, materials, nodes);
  addFloorBelt(root, materials, nodes);
  addRoof(root, materials, nodes);
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
