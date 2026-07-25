import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Village inn — img2threejs v3
 *
 * Quality bar: guild-v2 / temple-v2
 * Identity: panelized half-timber EVERY face (front, rear, sides + both gables),
 * solid closed gable prism (ridge along depth / Z), readable red tile rows,
 * hanging burgundy mug sign, warm bay + shutter windows, door, barrel,
 * flower box, stone chimney. Facade timber/panels proud of any core shell.
 */

const DIMS = Object.freeze({
  width: 8,
  depth: 6.5,
  lowerHeight: 3.05,
  upperHeight: 3.1,
  eaveY: 6.15,
  roofWidth: 8.7,
  roofDepth: 7.2,
  roofRise: 2.7,
  frontZ: 3.25,
});

const PALETTE = Object.freeze({
  plaster: 0xf4ebda,
  plasterShade: 0xe8dcc6,
  plasterDeep: 0xd9cbb3,
  timberDark: 0x5a3016,
  timber: 0x8a552c,
  timberLight: 0xb06e3a,
  roofDark: 0xa33a28,
  roof: 0xc24a34,
  roofLight: 0xd85d45,
  stoneDark: 0x7a756c,
  stone: 0x968f84,
  stoneLight: 0xb0a99d,
  mortar: 0x625e58,
  glass: 0xf6bc5e,
  glassLight: 0xffd98d,
  iron: 0x2c2926,
  ironLight: 0x4a4440,
  shutter: 0xf0e6d2,
  shutterShade: 0xd8ccb4,
  burgundy: 0x8a243c,
  burgundyLight: 0xb54562,
  gold: 0xd0a24f,
  goldLight: 0xe8c36d,
  foliageDark: 0x1f6a32,
  foliage: 0x3fa34c,
  foliageLight: 0x6fc45d,
  flowerDark: 0xb01f2c,
  flower: 0xe03d3d,
  flowerLight: 0xf65d50,
  interior: 0x1c120c,
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
    roofDark: standard(PALETTE.roofDark, 0.8),
    roof: standard(PALETTE.roof, 0.74),
    roofLight: standard(PALETTE.roofLight, 0.68),
    stoneDark: standard(PALETTE.stoneDark, 0.9),
    stone: standard(PALETTE.stone, 0.84),
    stoneLight: standard(PALETTE.stoneLight, 0.78),
    mortar: standard(PALETTE.mortar, 0.96),
    glass: standard(PALETTE.glass, 0.28, 0, {
      emissive: PALETTE.glass,
      emissiveIntensity: 0.9,
    }),
    glassLight: standard(PALETTE.glassLight, 0.22, 0, {
      emissive: 0xffb84a,
      emissiveIntensity: 1.15,
    }),
    iron: standard(PALETTE.iron, 0.34, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.28, 0.65),
    shutter: standard(PALETTE.shutter, 0.72),
    shutterShade: standard(PALETTE.shutterShade, 0.78),
    burgundy: standard(PALETTE.burgundy, 0.58),
    burgundyLight: standard(PALETTE.burgundyLight, 0.52),
    gold: standard(PALETTE.gold, 0.26, 0.62),
    goldLight: standard(PALETTE.goldLight, 0.22, 0.66),
    foliageDark: standard(PALETTE.foliageDark, 0.76),
    foliage: standard(PALETTE.foliage, 0.7),
    foliageLight: standard(PALETTE.foliageLight, 0.65),
    flowerDark: standard(PALETTE.flowerDark, 0.74),
    flower: standard(PALETTE.flower, 0.68),
    flowerLight: standard(PALETTE.flowerLight, 0.63),
    interior: standard(PALETTE.interior, 1),
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
  tubularSegments = 18,
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

function addCylinderBetween(parent, name, start, end, radius, material, radialSegments = 9) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const result = createMesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments),
    material,
    name,
  );
  result.position.copy(a).add(b).multiplyScalar(0.5);
  result.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
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
 * Triangular gable ends face front (+Z) and rear (-Z) — matches references.
 * NOT dual rotated box slabs.
 */
function createSolidGableGeometry(width, depth, rise) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  // base rectangle, then ridge line at x=0 running along Z
  const vertices = [
    -halfWidth, 0, -halfDepth, // 0
    halfWidth, 0, -halfDepth, // 1
    halfWidth, 0, halfDepth, // 2
    -halfWidth, 0, halfDepth, // 3
    0, rise, -halfDepth, // 4 ridge rear
    0, rise, halfDepth, // 5 ridge front
  ];
  const indices = [
    // left slope (-X)
    0, 4, 5, 0, 5, 3,
    // right slope (+X)
    1, 2, 5, 1, 5, 4,
    // rear gable triangle (-Z)
    0, 1, 4,
    // front gable triangle (+Z)
    3, 5, 2,
    // bottom
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

function addCurvedBrace(parent, name, start, control, end, z, material, radius = 0.085) {
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
    18,
  );
}

function addFoundation(root, materials, nodes) {
  const group = createNode(root, nodes, 'foundation');
  addBlock(
    group,
    'foundation.stone-plinth',
    [8.35, 0.3, 6.85],
    [0, 0.15, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.055,
  );
  for (let index = 0; index < 8; index += 1) {
    addBlock(
      group,
      `foundation.front-stone.${index}`,
      [1.02, 0.26, 0.2],
      [-3.57 + index * 1.02, 0.16, 3.48],
      [materials.stoneDark, materials.stone, materials.stoneLight][index % 3],
      [0, 0, 0],
      0.035,
    );
  }
  for (let index = 0; index < 6; index += 1) {
    addBlock(
      group,
      `foundation.side-stone.${index}`,
      [0.18, 0.24, 1.05],
      [4.12, 0.15, -2.6 + index * 1.05],
      [materials.stone, materials.stoneLight, materials.stoneDark][index % 3],
      [0, 0, 0],
      0.03,
    );
  }
}

/**
 * Thin interior core only — never a coplanar plaster slab on the facade.
 * Visible plaster is added as inset panels between timber on each face.
 */
function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'building-core');
  // Deeply inset so facade timber/panels never z-fight
  const coreW = 7.15;
  const coreD = 5.45;
  addBlock(
    group,
    'shell.ground-storey',
    [coreW, DIMS.lowerHeight, coreD],
    [0, 0.3 + DIMS.lowerHeight / 2, 0],
    materials.plasterDeep,
    [0, 0, 0],
    0.04,
  );
  addBlock(
    group,
    'shell.upper-storey',
    [coreW, DIMS.upperHeight, coreD],
    [0, 3.28 + DIMS.upperHeight / 2, 0],
    materials.plasterShade,
    [0, 0, 0],
    0.04,
  );
  nodes['ground-floor-shell'] = group;
  nodes['upper-storey-shell'] = group;
}

function addRoof(root, materials, nodes) {
  const group = createNode(root, nodes, 'roof');
  const roof = createMesh(
    createSolidGableGeometry(DIMS.roofWidth, DIMS.roofDepth, DIMS.roofRise),
    materials.roofDark,
    'roof.structural-solid-gable-prism',
  );
  roof.position.y = DIMS.eaveY - 0.1;
  roof.userData.structuralRoof = true;
  roof.userData.prohibitedConstruction = 'paired-rotated-box-slabs';
  group.add(roof);

  // Fascia boards along front/rear eaves
  addBlock(
    group,
    'roof.fascia-front',
    [DIMS.roofWidth + 0.1, 0.16, 0.14],
    [0, DIMS.eaveY - 0.02, DIMS.roofDepth / 2 + 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );
  addBlock(
    group,
    'roof.fascia-back',
    [DIMS.roofWidth + 0.1, 0.16, 0.14],
    [0, DIMS.eaveY - 0.02, -DIMS.roofDepth / 2 - 0.02],
    materials.timberDark,
    [0, 0, 0],
    0.03,
  );

  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rows = 9;
  const columns = 12;
  const rowWidth = halfWidth / rows;
  const tileDepth = DIMS.roofDepth / columns;
  const tileMats = [materials.roof, materials.roofLight, materials.roofDark];

  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.55);
      const x = side * distanceFromRidge;
      const y =
        DIMS.eaveY -
        0.1 +
        DIMS.roofRise * (1 - distanceFromRidge / halfWidth) +
        0.1;
      const stagger = row % 2 ? tileDepth * 0.45 : 0;
      for (let column = 0; column < columns; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5) + stagger * 0.15;
        if (Math.abs(z) > DIMS.roofDepth / 2 + 0.1) continue;
        const material = tileMats[(row * 3 + column + (side > 0 ? 1 : 0)) % 3];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'L' : 'R'}.${row}.${column}`,
          [rowWidth * 1.12, 0.11, tileDepth * 1.05],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.026,
        );
      }
    }
  }

  for (let index = 0; index < 14; index += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 14) * (index + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${index}`,
      [0.42, 0.34, DIMS.roofDepth / 13.5],
      [0, DIMS.eaveY + DIMS.roofRise + 0.04, z],
      index % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.05,
      3,
    );
  }
}

function createShutterWindow(materials, name, width = 1.15, height = 1.2) {
  const group = new THREE.Group();
  group.name = name;

  addBlock(
    group,
    `${name}.recess`,
    [width + 0.22, height + 0.22, 0.08],
    [0, 0, -0.03],
    materials.interior,
    [0, 0, 0],
    0.025,
  );
  addBlock(group, `${name}.glass`, [width, height, 0.07], [0, 0, 0.03], materials.glass, [0, 0, 0], 0.018);
  addBlock(
    group,
    `${name}.frame-top`,
    [width + 0.22, 0.14, 0.14],
    [0, height / 2 + 0.07, 0.08],
    materials.timberDark,
    [0, 0, 0],
    0.025,
  );
  addBlock(
    group,
    `${name}.frame-bottom`,
    [width + 0.28, 0.16, 0.18],
    [0, -height / 2 - 0.08, 0.09],
    materials.timber,
    [0, 0, 0],
    0.025,
  );
  for (const side of [-1, 1]) {
    addBlock(
      group,
      `${name}.frame-side.${side}`,
      [0.14, height + 0.12, 0.14],
      [side * (width / 2 + 0.07), 0, 0.08],
      materials.timberDark,
      [0, 0, 0],
      0.025,
    );
  }
  addBlock(group, `${name}.muntin-v`, [0.075, height, 0.07], [0, 0, 0.09], materials.timberDark, [0, 0, 0], 0.012);
  addBlock(group, `${name}.muntin-h`, [width, 0.075, 0.07], [0, 0, 0.09], materials.timberDark, [0, 0, 0], 0.012);

  for (const side of [-1, 1]) {
    const shutter = new THREE.Group();
    shutter.name = `${name}.shutter.${side < 0 ? 'left' : 'right'}`;
    shutter.position.set(side * (width / 2 + 0.42), 0, 0.1);
    group.add(shutter);
    addBlock(
      shutter,
      `${shutter.name}.body`,
      [0.56, height + 0.18, 0.11],
      [0, 0, 0],
      materials.shutter,
      [0, 0, 0],
      0.035,
    );
    addBlock(
      shutter,
      `${shutter.name}.inset`,
      [0.36, height - 0.08, 0.045],
      [0, 0, 0.07],
      materials.shutterShade,
      [0, 0, 0],
      0.02,
    );
    addBlock(
      shutter,
      `${shutter.name}.rail-top`,
      [0.43, 0.075, 0.045],
      [0, height * 0.28, 0.1],
      materials.shutter,
      [0, 0, 0],
      0.012,
    );
    addBlock(
      shutter,
      `${shutter.name}.rail-bottom`,
      [0.43, 0.075, 0.045],
      [0, -height * 0.28, 0.1],
      materials.shutter,
      [0, 0, 0],
      0.012,
    );
  }
  return group;
}

/**
 * Inset plaster panel inside a timber bay (sits BEHIND proud posts/rails).
 */
function addPlasterPanel(parent, name, width, height, x, y, z, materials, materialKey = 'plaster') {
  return addBlock(
    parent,
    name,
    [width, height, 0.1],
    [x, y, z],
    materials[materialKey] || materials.plaster,
    [0, 0, 0],
    0.02,
  );
}

/**
 * Full half-timber elevation on ±Z (front/rear).
 * Panelized plaster in every bay; gable truss on both ends.
 */
function addGableFacade(root, materials, nodes, { faceZ, label, isFront }) {
  const group = createNode(root, nodes, label);
  const z = faceZ;
  const panelZ = z - Math.sign(faceZ || 1) * 0.08;
  const timberZ = z;
  const postT = 0.28;
  const railT = 0.24;
  const halfW = 3.78;
  const postsX = [-halfW, -1.9, 0, 1.9, halfW];
  const railsY = [
    [0.42, 0.26],
    [1.9, 0.2],
    [3.25, 0.38],
    [4.55, 0.22],
    [6.05, 0.28],
  ];

  // Outer frame posts
  for (const x of postsX) {
    addBlock(
      group,
      `${label}.post.${x}`,
      [postT, 5.95, 0.28],
      [x, 3.2, timberZ],
      Math.abs(x) > 3 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.04,
    );
  }
  // Horizontal rails
  for (const [y, h] of railsY) {
    addBlock(
      group,
      `${label}.rail.${y}`,
      [7.7, h, railT],
      [0, y, timberZ],
      y === 3.25 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.04,
    );
  }

  // Panelized plaster — every storey bay (never one blank slab)
  const bayXs = [
    [-halfW, -1.9],
    [-1.9, 0],
    [0, 1.9],
    [1.9, halfW],
  ];
  const storeys = [
    { y0: 0.55, y1: 1.8, mat: 'plaster' },
    { y0: 2.0, y1: 3.05, mat: 'plasterShade' },
    { y0: 3.48, y1: 4.44, mat: 'plaster' },
    { y0: 4.7, y1: 5.9, mat: 'plasterShade' },
  ];
  let panelIndex = 0;
  for (const [x0, x1] of bayXs) {
    for (const storey of storeys) {
      const width = x1 - x0 - 0.34;
      const height = storey.y1 - storey.y0;
      const cx = (x0 + x1) / 2;
      const cy = (storey.y0 + storey.y1) / 2;
      // Skip some bays that hold windows/door/bay for cleaner overlap
      const skipDoor = isFront && cx < -0.8 && cx > -3.0 && storey.y0 < 3.0;
      const skipBay = isFront && cx > 0.5 && storey.y0 < 3.0;
      if (skipDoor || skipBay) {
        // still place thin upper remnant panels so wall never empties
        if (storey.y0 >= 3.48) {
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

  // Lower curved braces + chevrons
  addCurvedBrace(
    group,
    `${label}.brace.lower-left`,
    [-3.4, 0.55],
    [-2.55, 1.4],
    [-2.05, 3.05],
    timberZ + 0.05,
    materials.timberLight,
  );
  addCurvedBrace(
    group,
    `${label}.brace.lower-right`,
    [3.4, 0.55],
    [2.55, 1.4],
    [2.05, 3.05],
    timberZ + 0.05,
    materials.timberLight,
  );
  addBeamXY(
    group,
    `${label}.brace.lower-chevron-l`,
    [-1.55, 0.55],
    [-0.22, 1.78],
    0.16,
    0.16,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    `${label}.brace.lower-chevron-r`,
    [0.22, 1.78],
    [1.55, 0.55],
    0.16,
    0.16,
    materials.timber,
    timberZ + 0.04,
  );

  // Upper braces
  addCurvedBrace(
    group,
    `${label}.brace.upper-left`,
    [-3.45, 3.42],
    [-2.85, 4.55],
    [-2.48, 5.95],
    timberZ + 0.05,
    materials.timberLight,
  );
  addCurvedBrace(
    group,
    `${label}.brace.upper-right`,
    [3.45, 3.42],
    [2.85, 4.55],
    [2.48, 5.95],
    timberZ + 0.05,
    materials.timberLight,
  );
  addBeamXY(
    group,
    `${label}.brace.chevron-left`,
    [-1.9, 3.4],
    [-0.15, 4.38],
    0.17,
    0.16,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    `${label}.brace.chevron-right`,
    [0.15, 4.38],
    [1.9, 3.4],
    0.17,
    0.16,
    materials.timber,
    timberZ + 0.04,
  );

  // Gable triangle — plaster infill + full truss (front AND rear)
  const gableRise = 2.42;
  const gableShell = createMesh(
    createGableInfillGeometry(7.5, gableRise, 0.16),
    materials.plaster,
    `${label}.gable.plaster-infill`,
  );
  gableShell.position.set(0, 6.08, panelZ - Math.sign(faceZ || 1) * 0.02);
  group.add(gableShell);

  // Subdivide gable plaster with extra micro panels feel via timber
  addBeamXY(
    group,
    `${label}.gable.rafter-left`,
    [-3.8, 6.1],
    [0, 8.55],
    0.24,
    0.22,
    materials.timberDark,
    timberZ + 0.05,
    0.035,
  );
  addBeamXY(
    group,
    `${label}.gable.rafter-right`,
    [0, 8.55],
    [3.8, 6.1],
    0.24,
    0.22,
    materials.timberDark,
    timberZ + 0.05,
    0.035,
  );
  addBlock(
    group,
    `${label}.gable.king-post`,
    [0.26, gableRise, 0.2],
    [0, 6.08 + gableRise / 2, timberZ + 0.05],
    materials.timber,
    [0, 0, 0],
    0.035,
  );
  addBlock(
    group,
    `${label}.gable.collar`,
    [2.6, 0.16, 0.16],
    [0, 7.15, timberZ + 0.05],
    materials.timberLight,
    [0, 0, 0],
    0.03,
  );
  addCurvedBrace(
    group,
    `${label}.gable.curved-brace-left`,
    [-3.15, 6.22],
    [-2.05, 6.75],
    [-0.45, 8.15],
    timberZ + 0.07,
    materials.timberLight,
    0.095,
  );
  addCurvedBrace(
    group,
    `${label}.gable.curved-brace-right`,
    [3.15, 6.22],
    [2.05, 6.75],
    [0.45, 8.15],
    timberZ + 0.07,
    materials.timberLight,
    0.095,
  );
  // Extra gable struts so triangle is never empty
  addBeamXY(
    group,
    `${label}.gable.strut-l`,
    [-2.4, 6.2],
    [-0.9, 7.5],
    0.12,
    0.12,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    `${label}.gable.strut-r`,
    [2.4, 6.2],
    [0.9, 7.5],
    0.12,
    0.12,
    materials.timber,
    timberZ + 0.04,
  );

  if (isFront) {
    const frontWindow = createShutterWindow(materials, 'window.front-upper', 1.18, 1.18);
    frontWindow.position.set(0, 4.96, timberZ + 0.2);
    group.add(frontWindow);
    nodes['upper-windows'] = frontWindow;
    nodes['upper-gable'] = group;
    nodes['front-gable-shell'] = group;
  } else {
    // Rear upper windows so back never reads blank
    for (const x of [-1.9, 1.9]) {
      const w = createShutterWindow(materials, `window.rear.upper.${x}`, 1.0, 1.08);
      w.position.set(x, 4.9, timberZ + Math.sign(faceZ) * 0.18);
      // windows face outward: rear faceZ is negative so flip
      if (faceZ < 0) w.rotation.y = Math.PI;
      group.add(w);
    }
    const lower = createShutterWindow(materials, 'window.rear.lower', 1.1, 1.15);
    lower.position.set(0, 1.85, timberZ + Math.sign(faceZ) * 0.18);
    if (faceZ < 0) lower.rotation.y = Math.PI;
    group.add(lower);
  }

  return group;
}

function addFrontAndRearTimber(root, materials, nodes) {
  addGableFacade(root, materials, nodes, {
    faceZ: DIMS.frontZ + 0.14,
    label: 'front-facade',
    isFront: true,
  });
  addGableFacade(root, materials, nodes, {
    faceZ: -(DIMS.frontZ + 0.14),
    label: 'rear-facade',
    isFront: false,
  });
}

function addSideSurface(root, materials, nodes, side) {
  const label = side > 0 ? 'right' : 'left';
  const group = createNode(root, nodes, `side-wall-${label}`);
  // Local frame: +Z is outward after rotation
  group.position.x = side * (DIMS.width / 2 + 0.02);
  group.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;

  const timberZ = 0.08;
  const panelZ = 0.0;
  const halfD = 3.1;
  const postsZ = [-halfD, -1.55, 0, 1.55, halfD]; // local X after rotation = world Z

  for (const x of postsZ) {
    addBlock(
      group,
      `side.${label}.post.${x}`,
      [0.26, 5.95, 0.22],
      [x, 3.2, timberZ],
      materials.timber,
      [0, 0, 0],
      0.035,
    );
  }
  for (const [y, h] of [
    [0.4, 0.24],
    [1.9, 0.18],
    [3.25, 0.36],
    [4.5, 0.2],
    [6.08, 0.24],
  ]) {
    addBlock(
      group,
      `side.${label}.rail.${y}`,
      [6.35, h, 0.2],
      [0, y, timberZ],
      y === 3.25 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.035,
    );
  }

  // Panelized plaster on side bays
  const bayPairs = [
    [-halfD, -1.55],
    [-1.55, 0],
    [0, 1.55],
    [1.55, halfD],
  ];
  const storeys = [
    { y0: 0.55, y1: 1.8, mat: 'plaster' },
    { y0: 2.0, y1: 3.05, mat: 'plasterShade' },
    { y0: 3.48, y1: 4.4, mat: 'plaster' },
    { y0: 4.68, y1: 5.92, mat: 'plasterShade' },
  ];
  let i = 0;
  for (const [a, b] of bayPairs) {
    for (const s of storeys) {
      addPlasterPanel(
        group,
        `side.${label}.panel.${i}`,
        b - a - 0.32,
        s.y1 - s.y0,
        (a + b) / 2,
        (s.y0 + s.y1) / 2,
        panelZ,
        materials,
        s.mat,
      );
      i += 1;
    }
  }

  addCurvedBrace(
    group,
    `side.${label}.lower-brace-a`,
    [-2.85, 0.48],
    [-2.05, 1.35],
    [-1.55, 3.05],
    timberZ + 0.04,
    materials.timberLight,
  );
  addCurvedBrace(
    group,
    `side.${label}.lower-brace-b`,
    [1.55, 0.48],
    [2.05, 1.35],
    [2.85, 3.05],
    timberZ + 0.04,
    materials.timberLight,
  );
  addBeamXY(
    group,
    `side.${label}.upper-chevron-a`,
    [-2.7, 3.4],
    [-0.2, 4.35],
    0.17,
    0.16,
    materials.timber,
    timberZ + 0.04,
  );
  addBeamXY(
    group,
    `side.${label}.upper-chevron-b`,
    [0.2, 4.35],
    [2.7, 3.4],
    0.17,
    0.16,
    materials.timber,
    timberZ + 0.04,
  );
  addCurvedBrace(
    group,
    `side.${label}.upper-end-brace-a`,
    [-2.95, 3.42],
    [-2.65, 4.7],
    [-2.35, 5.95],
    timberZ + 0.04,
    materials.timberLight,
  );
  addCurvedBrace(
    group,
    `side.${label}.upper-end-brace-b`,
    [2.95, 3.42],
    [2.65, 4.7],
    [2.35, 5.95],
    timberZ + 0.04,
    materials.timberLight,
  );

  // Windows — two upper; right side also has lower (matches ref_side)
  for (const [index, x] of [-1.55, 1.45].entries()) {
    const window = createShutterWindow(materials, `window.${label}-upper-${index + 1}`, 1.02, 1.12);
    window.position.set(x, 4.95, timberZ + 0.16);
    group.add(window);
  }
  if (side > 0) {
    const lowerWindow = createShutterWindow(materials, 'window.right-lower', 0.92, 1.05);
    lowerWindow.position.set(1.35, 1.85, timberZ + 0.16);
    group.add(lowerWindow);
    nodes['side-walls'] = group;
    nodes['side-window-system'] = group;
  }
}

function addFloorBelt(root, materials, nodes) {
  const group = createNode(root, nodes, 'floor-belt');
  const fz = DIMS.frontZ + 0.2;
  addBlock(group, 'belt.front', [8.35, 0.42, 0.4], [0, 3.22, fz], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'belt.back', [8.35, 0.42, 0.4], [0, 3.22, -fz], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'belt.right', [0.4, 0.42, 6.6], [4.18, 3.22, 0], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'belt.left', [0.4, 0.42, 6.6], [-4.18, 3.22, 0], materials.timberDark, [0, 0, 0], 0.055);

  for (const x of [-3.55, -1.2, 1.2, 3.55]) {
    addBlock(group, `belt.front-corbel.${x}`, [0.32, 0.55, 0.5], [x, 2.88, fz], materials.timber, [0, 0, 0], 0.045);
    addBlock(group, `belt.back-corbel.${x}`, [0.32, 0.55, 0.5], [x, 2.88, -fz], materials.timber, [0, 0, 0], 0.045);
  }
  for (const z of [-2.65, -0.9, 0.9, 2.65]) {
    addBlock(group, `belt.side-corbel-r.${z}`, [0.5, 0.55, 0.32], [4.18, 2.88, z], materials.timber, [0, 0, 0], 0.045);
    addBlock(group, `belt.side-corbel-l.${z}`, [0.5, 0.55, 0.32], [-4.18, 2.88, z], materials.timber, [0, 0, 0], 0.045);
  }
}

function diagonalSegment(width, height, slope, intercept) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const candidates = [];
  const add = (x, y) => {
    if (
      x >= -halfWidth - 1e-6 &&
      x <= halfWidth + 1e-6 &&
      y >= -halfHeight - 1e-6 &&
      y <= halfHeight + 1e-6
    ) {
      if (!candidates.some((point) => Math.hypot(point[0] - x, point[1] - y) < 1e-5)) {
        candidates.push([x, y]);
      }
    }
  };
  add(-halfWidth, slope * -halfWidth + intercept);
  add(halfWidth, slope * halfWidth + intercept);
  if (Math.abs(slope) > 1e-6) {
    add((-halfHeight - intercept) / slope, -halfHeight);
    add((halfHeight - intercept) / slope, halfHeight);
  }
  return candidates.length >= 2 ? [candidates[0], candidates[1]] : null;
}

function createDiamondPane(materials, name, width, height) {
  const group = new THREE.Group();
  group.name = name;
  addBlock(group, `${name}.glass`, [width, height, 0.07], [0, 0, 0], materials.glassLight, [0, 0, 0], 0.018);

  for (const slope of [-1.35, 1.35]) {
    const interceptLimit = height / 2 + (Math.abs(slope) * width) / 2;
    for (let intercept = -interceptLimit; intercept <= interceptLimit + 0.01; intercept += 0.4) {
      const segment = diagonalSegment(width - 0.05, height - 0.05, slope, intercept);
      if (!segment) continue;
      addBeamXY(
        group,
        `${name}.lattice.${slope > 0 ? 'up' : 'down'}.${intercept.toFixed(2)}`,
        segment[0],
        segment[1],
        0.035,
        0.055,
        materials.iron,
        0.065,
        0.008,
      );
    }
  }
  return group;
}

function addBayPane(parent, materials, name, start, end, centerY, height) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const width = Math.hypot(dx, dz);
  const pane = createDiamondPane(materials, name, width, height);
  pane.position.set((start[0] + end[0]) / 2, centerY, (start[1] + end[1]) / 2);
  pane.rotation.y = Math.atan2(-dz, dx);
  parent.add(pane);
  return pane;
}

function addBayWindow(root, materials, nodes) {
  const group = createNode(root, nodes, 'bay-window');
  const yCenter = 1.92;
  const paneHeight = 1.82;
  const wallZ = DIMS.frontZ + 0.14;
  const frontZ = DIMS.frontZ + 1.08;
  const leftWall = [0.05, wallZ];
  const leftFront = [0.48, frontZ];
  const rightFront = [3.1, frontZ];
  const rightWall = [3.55, wallZ];

  addBlock(group, 'bay.lower-plaster', [3.5, 0.85, 0.82], [1.8, 0.48, 3.68], materials.plaster, [0, 0, 0], 0.055);
  addBlock(group, 'bay.header', [3.8, 0.4, 0.95], [1.8, 3.04, 3.72], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'bay.sill', [3.65, 0.28, 0.96], [1.8, 0.92, 3.74], materials.timber, [0, 0, 0], 0.05);
  addBlock(group, 'bay.front-lintel', [2.9, 0.22, 0.2], [1.8, 2.92, frontZ + 0.04], materials.timberLight, [0, 0, 0], 0.035);
  addBlock(group, 'bay.front-sill', [2.9, 0.22, 0.24], [1.8, 0.96, frontZ + 0.04], materials.timber, [0, 0, 0], 0.035);

  addBayPane(group, materials, 'bay.pane.front', leftFront, rightFront, yCenter, paneHeight);
  addBayPane(group, materials, 'bay.pane.left-return', leftWall, leftFront, yCenter, paneHeight);
  addBayPane(group, materials, 'bay.pane.right-return', rightFront, rightWall, yCenter, paneHeight);

  for (const [index, point] of [leftWall, leftFront, rightFront, rightWall].entries()) {
    addBlock(
      group,
      `bay.post.${index}`,
      [0.2, 2.12, 0.2],
      [point[0], yCenter, point[1]],
      index === 0 || index === 3 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.035,
    );
  }
  for (const x of [0.1, 1.8, 3.5]) {
    addBlock(group, `bay.lower-post.${x}`, [0.24, 0.92, 0.24], [x, 0.46, 3.68], materials.timber, [0, 0, 0], 0.035);
  }

  nodes['bay-frame'] = group;
  nodes['bay-glazing'] = group;
  nodes['bay-lattice'] = group;
}

function addDoor(root, materials, nodes, sockets) {
  const assembly = createNode(root, nodes, 'door-system');
  const hinge = new THREE.Group();
  hinge.name = 'door.left-hinge-pivot';
  hinge.position.set(-2.78, 0.31, DIMS.frontZ + 0.24);
  assembly.add(hinge);
  sockets.doorHinge = hinge;

  const width = 1.56;
  const height = 2.72;
  for (let index = 0; index < 6; index += 1) {
    const plankWidth = width / 6;
    addBlock(
      hinge,
      `door.plank.${index}`,
      [plankWidth * 0.94, height, 0.16],
      [plankWidth * (index + 0.5), height / 2, 0],
      [materials.timberDark, materials.timber, materials.timberLight][index % 3],
      [0, 0, 0],
      0.025,
    );
  }
  for (const y of [0.62, 2.08]) {
    addBlock(hinge, `door.strap.${y}`, [0.88, 0.11, 0.08], [0.44, y, 0.13], materials.iron, [0, 0, 0], 0.025);
    addBlock(hinge, `door.strap-tip.${y}`, [0.36, 0.16, 0.08], [0.86, y, 0.13], materials.iron, [0, 0, Math.PI / 4], 0.025);
    addCylinder(
      hinge,
      `door.hinge-rivet.${y}`,
      0.055,
      0.055,
      0.045,
      [0.08, y, 0.17],
      materials.ironLight,
      10,
      [Math.PI / 2, 0, 0],
    );
  }
  addBlock(hinge, 'door.pull-plate', [0.16, 0.44, 0.07], [1.23, 1.32, 0.14], materials.iron, [0, 0, 0], 0.035);
  addTorus(hinge, 'door.pull', 0.13, 0.032, [1.23, 1.31, 0.23], materials.ironLight, [0, 0, 0], 14, Math.PI * 1.55);

  addBlock(assembly, 'door.frame-left', [0.26, 2.95, 0.34], [-2.9, 1.77, DIMS.frontZ + 0.18], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-right', [0.26, 2.95, 0.34], [-0.98, 1.77, DIMS.frontZ + 0.18], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-lintel', [2.2, 0.28, 0.36], [-1.94, 3.12, DIMS.frontZ + 0.18], materials.timber, [0, 0, 0], 0.045);

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.door-interaction';
  interaction.position.set(-1.55, 1.35, DIMS.frontZ + 1.0);
  root.add(interaction);
  sockets.doorInteraction = interaction;
}

function createBarrel(parent, materials, name, position) {
  const barrel = new THREE.Group();
  barrel.name = name;
  barrel.position.set(...position);
  parent.add(barrel);

  const profile = [
    new THREE.Vector2(0.4, 0),
    new THREE.Vector2(0.46, 0.12),
    new THREE.Vector2(0.51, 0.52),
    new THREE.Vector2(0.49, 0.96),
    new THREE.Vector2(0.41, 1.2),
  ];
  const body = createMesh(new THREE.LatheGeometry(profile, 18), materials.timber, `${name}.body`);
  barrel.add(body);

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    addBlock(
      barrel,
      `${name}.stave.${index}`,
      [0.055, 1.03, 0.035],
      [Math.cos(angle) * 0.5, 0.59, Math.sin(angle) * 0.5],
      index % 3 === 0 ? materials.timberLight : materials.timberDark,
      [0, -angle, 0],
      0.012,
      1,
    );
  }
  for (const y of [0.16, 0.58, 1.02]) {
    addTorus(barrel, `${name}.hoop.${y}`, 0.5, 0.035, [0, y, 0], materials.iron, [Math.PI / 2, 0, 0], 20);
  }
  addCylinder(barrel, `${name}.top`, 0.41, 0.41, 0.055, [0, 1.2, 0], materials.timberDark, 18);
  return barrel;
}

function addBarrel(root, materials, nodes) {
  const group = createNode(root, nodes, 'barrel');
  createBarrel(group, materials, 'barrel.front-left', [-3.48, 0.28, DIMS.frontZ + 0.52]);
}

function createSignPlateGeometry(width, height, depth) {
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w * 0.68, h);
  shape.lineTo(w * 0.68, h);
  shape.lineTo(w * 0.76, h * 0.88);
  shape.lineTo(w * 0.95, h * 0.8);
  shape.lineTo(w * 0.95, h * 0.52);
  shape.lineTo(w, h * 0.42);
  shape.lineTo(w, -h * 0.64);
  shape.lineTo(w * 0.88, -h * 0.7);
  shape.quadraticCurveTo(w * 0.7, -h, 0, -h);
  shape.quadraticCurveTo(-w * 0.7, -h, -w * 0.88, -h * 0.7);
  shape.lineTo(-w, -h * 0.64);
  shape.lineTo(-w, h * 0.42);
  shape.lineTo(-w * 0.95, h * 0.52);
  shape.lineTo(-w * 0.95, h * 0.8);
  shape.lineTo(-w * 0.76, h * 0.88);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: Math.min(width, height) * 0.025,
    bevelThickness: depth * 0.18,
    bevelSegments: 2,
    curveSegments: 8,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addChainRun(parent, materials, name, x, topY, bottomY, z) {
  const count = 6;
  for (let index = 0; index < count; index += 1) {
    const y = THREE.MathUtils.lerp(topY, bottomY, (index + 0.5) / count);
    addTorus(
      parent,
      `${name}.link.${index}`,
      0.105,
      0.026,
      [x, y, z],
      materials.iron,
      index % 2 === 0 ? [0, 0, 0] : [0, Math.PI / 2, 0],
      12,
    );
  }
}

function addSign(root, materials, nodes, sockets) {
  const rig = createNode(root, nodes, 'sign-rig');
  addBlock(rig, 'sign.wall-plate', [0.24, 0.75, 0.18], [-3.9, 4.82, DIMS.frontZ + 0.16], materials.iron, [0, 0, 0], 0.04);
  addCylinderBetween(
    rig,
    'sign.bracket-arm',
    [-3.9, 5.04, DIMS.frontZ + 0.22],
    [-5.9, 5.04, DIMS.frontZ + 0.22],
    0.075,
    materials.iron,
    10,
  );
  const spear = createMesh(new THREE.ConeGeometry(0.16, 0.42, 8), materials.iron, 'sign.bracket-spear-tip');
  spear.position.set(-6.1, 5.04, DIMS.frontZ + 0.22);
  spear.rotation.z = Math.PI / 2;
  rig.add(spear);
  for (const x of [-4.55, -5.5]) {
    addTorus(
      rig,
      `sign.bracket-collar.${x}`,
      0.12,
      0.035,
      [x, 5.04, DIMS.frontZ + 0.22],
      materials.ironLight,
      [0, Math.PI / 2, 0],
      14,
    );
  }

  addChainRun(rig, materials, 'sign.chain-left', -4.65, 4.93, 4.28, DIMS.frontZ + 0.24);
  addChainRun(rig, materials, 'sign.chain-right', -5.45, 4.93, 4.28, DIMS.frontZ + 0.24);

  const signPivot = new THREE.Group();
  signPivot.name = 'sign.swing-pivot';
  signPivot.position.set(-5.05, 4.26, DIMS.frontZ + 0.24);
  rig.add(signPivot);
  sockets.signSwing = signPivot;

  const goldPlate = createMesh(createSignPlateGeometry(2.25, 2.3, 0.17), materials.gold, 'sign.gold-border-plate');
  goldPlate.position.y = -1.18;
  signPivot.add(goldPlate);
  const burgundyPlate = createMesh(
    createSignPlateGeometry(2.05, 2.1, 0.12),
    materials.burgundy,
    'sign.burgundy-face',
  );
  burgundyPlate.position.set(0, -1.18, 0.13);
  signPivot.add(burgundyPlate);

  addBlock(signPivot, 'sign.mug.body', [0.64, 0.72, 0.1], [-0.12, -1.12, 0.25], materials.iron, [0, 0, 0], 0.09, 3);
  addTorus(
    signPivot,
    'sign.mug.handle',
    0.24,
    0.075,
    [0.28, -1.12, 0.25],
    materials.iron,
    [0, 0, 0],
    18,
    Math.PI * 1.55,
  );
  for (const [index, x] of [-0.33, -0.12, 0.1].entries()) {
    addSphere(
      signPivot,
      `sign.mug.foam.${index}`,
      0.18,
      [x, -0.7 + (index % 2) * 0.03, 0.26],
      materials.iron,
      12,
      [1.1, 0.75, 0.45],
    );
  }
  addBlock(signPivot, 'sign.mug.base', [0.75, 0.09, 0.08], [-0.1, -1.53, 0.26], materials.iron, [0, 0, 0], 0.02);
  for (const [index, width] of [0.9, 0.68, 0.82].entries()) {
    addBlock(
      signPivot,
      `sign.caption-mark.${index}`,
      [width, 0.08, 0.055],
      [0, -1.75 - index * 0.14, 0.25],
      materials.goldLight,
      [0, 0, 0],
      0.015,
    );
  }

  const interaction = new THREE.Object3D();
  interaction.name = 'socket.sign-interaction';
  interaction.position.set(-5.05, 3.05, DIMS.frontZ + 1.2);
  root.add(interaction);
  sockets.signInteraction = interaction;
  nodes['inn-sign'] = signPivot;
  nodes['sign-system'] = rig;
}

function addFlowerBox(root, materials, nodes) {
  const group = createNode(root, nodes, 'flower-box');
  group.position.set(1.3, 1.05, DIMS.frontZ + 1.32);

  addBlock(group, 'planter.body', [2.35, 0.48, 0.56], [0, 0, 0], materials.timberDark, [0, 0, 0], 0.045);
  addBlock(group, 'planter.front-board', [2.16, 0.3, 0.08], [0, 0, 0.32], materials.timber, [0, 0, 0], 0.03);
  for (const x of [-1.05, 1.05]) {
    addBlock(group, `planter.corner-band.${x}`, [0.13, 0.5, 0.1], [x, 0, 0.34], materials.timberLight, [0, 0, 0], 0.02);
  }
  addBlock(group, 'planter.soil', [2.08, 0.12, 0.43], [0, 0.28, 0], materials.interior, [0, 0, 0], 0.025);

  const foliageMaterials = [materials.foliageDark, materials.foliage, materials.foliageLight];
  for (let index = 0; index < 48; index += 1) {
    const column = index % 12;
    const row = Math.floor(index / 12);
    const x = -1.02 + column * 0.185 + Math.sin(index * 2.1) * 0.035;
    const y = 0.32 + row * 0.14 + Math.sin(index * 1.7) * 0.04;
    const z = -0.18 + (index % 4) * 0.12;
    const leaf = addSphere(
      group,
      `planter.leaf.${index}`,
      0.12,
      [x, y, z],
      foliageMaterials[index % foliageMaterials.length],
      9,
      [1.45, 0.58, 0.38],
    );
    leaf.rotation.z = Math.sin(index * 0.9) * 0.65;
  }

  const flowerMaterials = [materials.flowerDark, materials.flower, materials.flowerLight];
  for (let index = 0; index < 12; index += 1) {
    const centerX = -0.92 + index * 0.17 + Math.sin(index) * 0.035;
    const centerY = 0.87 + (index % 3) * 0.08;
    const centerZ = 0.02 + Math.cos(index * 1.4) * 0.12;
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2;
      addSphere(
        group,
        `planter.flower.${index}.petal.${petal}`,
        0.085,
        [centerX + Math.cos(angle) * 0.08, centerY + Math.sin(angle) * 0.08, centerZ],
        flowerMaterials[(index + petal) % flowerMaterials.length],
        9,
        [1, 0.72, 0.5],
      );
    }
    addSphere(
      group,
      `planter.flower.${index}.center`,
      0.055,
      [centerX, centerY, centerZ + 0.035],
      materials.goldLight,
      8,
    );
  }

  for (let index = 0; index < 7; index += 1) {
    const x = -0.95 + index * 0.32;
    const length = 0.55 + (index % 3) * 0.18;
    addTube(
      group,
      `planter.vine.${index}`,
      [
        [x, 0.4, 0.23],
        [x + Math.sin(index) * 0.12, 0.08, 0.34],
        [x + Math.cos(index) * 0.14, -length, 0.28],
      ],
      0.025,
      materials.foliageDark,
      12,
    );
    for (let leafIndex = 0; leafIndex < 3; leafIndex += 1) {
      const y = 0.12 - (length * leafIndex) / 3;
      const leaf = addSphere(
        group,
        `planter.vine.${index}.leaf.${leafIndex}`,
        0.09,
        [x + (leafIndex % 2 ? 0.1 : -0.08), y, 0.3],
        foliageMaterials[(index + leafIndex) % foliageMaterials.length],
        8,
        [1.35, 0.52, 0.35],
      );
      leaf.rotation.z = leafIndex % 2 ? 0.65 : -0.65;
    }
  }
}

function addChimney(root, materials, nodes, sockets) {
  const group = createNode(root, nodes, 'chimney');
  // Sit on right roof slope (matches refs)
  group.position.set(1.55, 7.2, -0.75);
  addBlock(group, 'chimney.mortar-core', [1.05, 2.95, 1.0], [0, 1.35, 0], materials.mortar, [0, 0, 0], 0.035);

  const courseHeight = 0.48;
  for (let course = 0; course < 6; course += 1) {
    const y = 0.22 + course * courseHeight;
    const offset = course % 2 ? 0.22 : -0.22;
    for (const face of [-1, 1]) {
      for (let column = 0; column < 2; column += 1) {
        const x = -0.25 + column * 0.5 + offset * 0.25;
        addBlock(
          group,
          `chimney.block.front-back.${course}.${face}.${column}`,
          [0.5, 0.42, 0.16],
          [x, y, face * 0.54],
          [materials.stoneDark, materials.stone, materials.stoneLight][
            (course + column + (face > 0 ? 1 : 0)) % 3
          ],
          [0, 0, 0],
          0.065,
          3,
        );
      }
      addBlock(
        group,
        `chimney.block.side.${course}.${face}`,
        [0.16, 0.42, 0.8],
        [face * 0.54, y, 0],
        [materials.stone, materials.stoneLight, materials.stoneDark][(course + (face > 0 ? 1 : 0)) % 3],
        [0, 0, 0],
        0.065,
        3,
      );
    }
  }

  for (const [index, x] of [-0.34, 0.34].entries()) {
    addBlock(
      group,
      `chimney.cap.${index}`,
      [0.72, 0.34, 1.28],
      [x, 3.18, 0],
      materials.stoneLight,
      [0, 0, 0],
      0.075,
      3,
    );
  }
  const socket = new THREE.Object3D();
  socket.name = 'socket.chimney-smoke';
  socket.position.set(1.55, 10.55, -0.75);
  root.add(socket);
  sockets.chimneySmoke = socket;
  nodes['chimney-blocks'] = group;
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
        center: [0, 0.15, 0],
        size: [8.35, 0.3, 6.85],
        isTrigger: false,
      },
      building: {
        type: 'box',
        center: [0, 3.2, 0],
        size: [7.9, 6.1, 6.4],
        isTrigger: false,
      },
      roof: {
        type: 'closed-gable-prism',
        center: [0, 7.45, 0],
        size: [8.7, 2.7, 7.2],
        isTrigger: false,
      },
      bay: {
        type: 'compound-faceted-box',
        center: [1.8, 1.58, 3.75],
        size: [3.7, 3.15, 1.1],
        isTrigger: false,
      },
      chimney: {
        type: 'box',
        center: [1.55, 8.7, -0.75],
        size: [1.3, 3.4, 1.3],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [-5.05, 3.05, 4.2],
        size: [2.5, 2.6, 1.6],
        isTrigger: true,
      },
      doorInteraction: {
        type: 'box',
        center: [-1.95, 1.45, 4.0],
        size: [2.2, 3, 1.4],
        isTrigger: true,
      },
    },
    destructionGroups: {
      plaster: [
        ...collectMeshes(nodes['building-core']),
        ...collectMeshes(nodes['front-facade']).filter((m) => /panel|plaster/.test(m.name)),
        ...collectMeshes(nodes['rear-facade']).filter((m) => /panel|plaster/.test(m.name)),
      ],
      timberFrame: [
        ...collectMeshes(nodes['front-facade']).filter((m) => /post|rail|brace|gable|beam/.test(m.name)),
        ...collectMeshes(nodes['rear-facade']).filter((m) => /post|rail|brace|gable|beam/.test(m.name)),
        ...collectMeshes(nodes['side-wall-right']),
        ...collectMeshes(nodes['side-wall-left']),
        ...collectMeshes(nodes['floor-belt']),
      ],
      roof: collectMeshes(nodes.roof),
      chimney: collectMeshes(nodes.chimney),
      glazing: collectMeshes(nodes['bay-window']).filter((mesh) => /pane|glass|lattice/.test(mesh.name)),
      sign: collectMeshes(nodes['sign-rig']),
      entranceProps: [
        ...collectMeshes(nodes['door-system']),
        ...collectMeshes(nodes.barrel),
        ...collectMeshes(nodes['flower-box']),
      ],
    },
    animation: {
      door: {
        node: sockets.doorHinge,
        axis: [0, 1, 0],
        range: [-Math.PI * 0.4, 0],
      },
      hangingSign: {
        node: sockets.signSwing,
        axis: [0, 0, 1],
        range: [-0.09, 0.09],
      },
    },
    sources: [
      'public/content/buildings/inn/ref_main.png',
      'public/content/buildings/inn/ref_front.png',
      'public/content/buildings/inn/ref_side.png',
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
 * Procedural Inn v3 (img2threejs).
 *
 * Contract:
 * - THREE.Group, facade +Z, sole y=0
 * - one closed indexed triangular prism roof, ridge along depth (Z)
 * - panelized half-timber on front, rear, and both sides (no blank plaster slabs)
 * - bay, mug sign, door, barrel, flowers, chimney as real geometry
 * - sculptRuntime with sockets / colliders / destruction groups
 */
export function createInnModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.inn.img2threejs-v3';
  root.userData.assetId = 'img2threejs-inn-v3';
  root.userData.gen = 'img2threejs-inn-v3';
  root.userData.heroVersion = 'img2threejs-inn-v3';
  root.userData.generator = 'img2threejs-forge-authored-v3';
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
  addRoof(root, materials, nodes);
  addFrontAndRearTimber(root, materials, nodes);
  addSideSurface(root, materials, nodes, 1);
  addSideSurface(root, materials, nodes, -1);
  addFloorBelt(root, materials, nodes);
  addBayWindow(root, materials, nodes);
  addDoor(root, materials, nodes, sockets);
  addBarrel(root, materials, nodes);
  addSign(root, materials, nodes, sockets);
  addFlowerBox(root, materials, nodes);
  addChimney(root, materials, nodes, sockets);

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

export const createInnV3Model = createInnModel;
export default createInnModel;
