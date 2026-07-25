import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DIMS = Object.freeze({
  width: 8,
  depth: 6.5,
  lowerHeight: 3.05,
  upperHeight: 3.1,
  eaveY: 6.2,
  roofWidth: 8.6,
  roofDepth: 7.1,
  roofRise: 2.65,
  frontZ: 3.25,
});

const PALETTE = Object.freeze({
  plaster: 0xf1e7d1,
  plasterShade: 0xe4d5bb,
  timberDark: 0x613719,
  timber: 0x86522d,
  timberLight: 0xa76838,
  roofDark: 0x963728,
  roof: 0xb64534,
  roofLight: 0xc95642,
  stoneDark: 0x777269,
  stone: 0x908a80,
  stoneLight: 0xaaa398,
  mortar: 0x5f5b55,
  glass: 0xf5b85a,
  glassLight: 0xffd98d,
  iron: 0x2f2c29,
  ironLight: 0x4b4540,
  shutter: 0xe8ddc6,
  shutterShade: 0xd0c4ac,
  burgundy: 0x7d2035,
  burgundyLight: 0xa93e59,
  gold: 0xc59a4b,
  goldLight: 0xe0ba69,
  foliageDark: 0x236a35,
  foliage: 0x3e9b4c,
  foliageLight: 0x6bbc59,
  flowerDark: 0xa91f2c,
  flower: 0xd63b3b,
  flowerLight: 0xf05b4e,
  interior: 0x24170e,
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
    plaster: standard(PALETTE.plaster, 0.88),
    plasterShade: standard(PALETTE.plasterShade, 0.92),
    timberDark: standard(PALETTE.timberDark, 0.72),
    timber: standard(PALETTE.timber, 0.66),
    timberLight: standard(PALETTE.timberLight, 0.6),
    roofDark: standard(PALETTE.roofDark, 0.8),
    roof: standard(PALETTE.roof, 0.74),
    roofLight: standard(PALETTE.roofLight, 0.68),
    stoneDark: standard(PALETTE.stoneDark, 0.9),
    stone: standard(PALETTE.stone, 0.84),
    stoneLight: standard(PALETTE.stoneLight, 0.78),
    mortar: standard(PALETTE.mortar, 0.96),
    glass: standard(PALETTE.glass, 0.28, 0, {
      emissive: PALETTE.glass,
      emissiveIntensity: 0.82,
    }),
    glassLight: standard(PALETTE.glassLight, 0.24, 0, {
      emissive: 0xffb84a,
      emissiveIntensity: 1.05,
    }),
    iron: standard(PALETTE.iron, 0.32, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.27, 0.65),
    shutter: standard(PALETTE.shutter, 0.72),
    shutterShade: standard(PALETTE.shutterShade, 0.78),
    burgundy: standard(PALETTE.burgundy, 0.6),
    burgundyLight: standard(PALETTE.burgundyLight, 0.54),
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

function createSolidGableGeometry(width, depth, rise) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const vertices = [
    -halfWidth, 0, -halfDepth,
    halfWidth, 0, -halfDepth,
    halfWidth, 0, halfDepth,
    -halfWidth, 0, halfDepth,
    -halfWidth, rise, 0,
    halfWidth, rise, 0,
  ];
  const indices = [
    0, 1, 5, 0, 5, 4,
    3, 4, 5, 3, 5, 2,
    0, 4, 3,
    1, 2, 5,
    0, 3, 2, 0, 2, 1,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.closedSolid = true;
  geometry.userData.construction = 'single-indexed-triangular-prism';
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
    [8.25, 0.28, 6.75],
    [0, 0.14, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.055,
  );

  for (let index = 0; index < 8; index += 1) {
    addBlock(
      group,
      `foundation.front-stone.${index}`,
      [1.01, 0.25, 0.18],
      [-3.55 + index * 1.01, 0.15, 3.43],
      [materials.stoneDark, materials.stone, materials.stoneLight][index % 3],
      [0, 0, 0],
      0.035,
    );
  }
}

function addShell(root, materials, nodes) {
  const group = createNode(root, nodes, 'building-core');
  // Keep plaster volume *inside* facade planes so front/back timber never z-fights
  // into a blank wall (shell z was ±3.2 while facade sat at ~3.25 → coplanar mud).
  const shellDepth = 5.7;
  addBlock(
    group,
    'shell.ground-storey',
    [7.55, DIMS.lowerHeight, shellDepth],
    [0, 0.28 + DIMS.lowerHeight / 2, 0],
    materials.plaster,
    [0, 0, 0],
    0.055,
  );
  addBlock(
    group,
    'shell.upper-storey',
    [7.55, DIMS.upperHeight, shellDepth],
    [0, 3.25 + DIMS.upperHeight / 2, 0],
    materials.plasterShade,
    [0, 0, 0],
    0.055,
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
  roof.position.y = DIMS.eaveY - 0.12;
  roof.userData.structuralRoof = true;
  roof.userData.prohibitedConstruction = 'paired-rotated-box-slabs';
  group.add(roof);

  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = DIMS.roofWidth / 2;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const rowWidth = halfWidth / 9;
  const tileDepth = DIMS.roofDepth / 11;

  for (const side of [-1, 1]) {
    for (let row = 0; row < 9; row += 1) {
      const distanceFromRidge = rowWidth * (row + 0.56);
      const x = side * distanceFromRidge;
      const y =
        DIMS.eaveY -
        0.12 +
        DIMS.roofRise * (1 - distanceFromRidge / halfWidth) +
        0.095;
      for (let column = 0; column < 11; column += 1) {
        const z = -DIMS.roofDepth / 2 + tileDepth * (column + 0.5);
        const material = [materials.roof, materials.roofLight, materials.roofDark][
          (row * 3 + column + (side > 0 ? 1 : 0)) % 3
        ];
        addBlock(
          tileGroup,
          `roof.tile.${side < 0 ? 'left' : 'right'}.${row}.${column}`,
          [rowWidth * 1.14, 0.12, tileDepth * 1.06],
          [x, y, z],
          material,
          [0, 0, side < 0 ? slopeAngle : -slopeAngle],
          0.028,
        );
      }
    }
  }

  for (let index = 0; index < 13; index += 1) {
    const z = -DIMS.roofDepth / 2 + (DIMS.roofDepth / 13) * (index + 0.5);
    addBlock(
      tileGroup,
      `roof.ridge-cap.${index}`,
      [0.48, 0.38, DIMS.roofDepth / 12.6],
      [0, DIMS.eaveY + DIMS.roofRise + 0.02, z],
      index % 3 === 0 ? materials.roofLight : materials.roof,
      [0, 0, Math.PI / 4],
      0.055,
      3,
    );
  }
}

function createShutterWindow(materials, name, width = 1.15, height = 1.2) {
  const group = new THREE.Group();
  group.name = name;

  addBlock(group, `${name}.recess`, [width + 0.22, height + 0.22, 0.08], [0, 0, -0.03], materials.interior, [0, 0, 0], 0.025);
  addBlock(group, `${name}.glass`, [width, height, 0.07], [0, 0, 0.03], materials.glass, [0, 0, 0], 0.018);
  addBlock(group, `${name}.frame-top`, [width + 0.22, 0.14, 0.14], [0, height / 2 + 0.07, 0.08], materials.timberDark, [0, 0, 0], 0.025);
  addBlock(group, `${name}.frame-bottom`, [width + 0.28, 0.16, 0.18], [0, -height / 2 - 0.08, 0.09], materials.timber, [0, 0, 0], 0.025);
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
    addBlock(shutter, `${shutter.name}.body`, [0.56, height + 0.18, 0.11], [0, 0, 0], materials.shutter, [0, 0, 0], 0.035);
    addBlock(shutter, `${shutter.name}.inset`, [0.36, height - 0.08, 0.045], [0, 0, 0.07], materials.shutterShade, [0, 0, 0], 0.02);
    addBlock(shutter, `${shutter.name}.rail-top`, [0.43, 0.075, 0.045], [0, height * 0.28, 0.1], materials.shutter, [0, 0, 0], 0.012);
    addBlock(shutter, `${shutter.name}.rail-bottom`, [0.43, 0.075, 0.045], [0, -height * 0.28, 0.1], materials.shutter, [0, 0, 0], 0.012);
  }
  return group;
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

/**
 * Full half-timber face on +Z (and optional rear on -Z).
 * Posts/rails sit proud of the plaster shell so the middle never reads empty.
 */
function addFacadeTimber(root, materials, nodes, { faceZ, label, withOpenings = true }) {
  const group = createNode(root, nodes, label);
  // Proud of shell max |z|≈2.85 so no coplanar blank wall
  const z = faceZ;
  const postT = 0.28;
  const railT = 0.22;

  // Outer frame + mid posts — full height both storeys
  for (const x of [-3.72, -1.85, 0, 1.85, 3.72]) {
    addBlock(
      group,
      `${label}.post.${x}`,
      [postT, 5.95, 0.26],
      [x, 3.2, z],
      materials.timber,
      [0, 0, 0],
      0.04,
    );
  }
  // Horizontal rails: sill, mid belt, upper rail, wall plate
  for (const [y, h] of [
    [0.42, 0.26],
    [1.85, 0.2],
    [3.28, 0.36],
    [4.55, 0.22],
    [6.05, 0.26],
  ]) {
    addBlock(
      group,
      `${label}.rail.${y}`,
      [7.7, h, railT],
      [0, y, z],
      y === 3.28 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.04,
    );
  }

  // Lower braces (fill the previously blank ground storey)
  addCurvedBrace(group, `${label}.brace.lower-left`, [-3.35, 0.55], [-2.55, 1.35], [-2.0, 3.05], z + 0.04, materials.timberLight);
  addCurvedBrace(group, `${label}.brace.lower-right`, [3.35, 0.55], [2.55, 1.35], [2.0, 3.05], z + 0.04, materials.timberLight);
  addBeamXY(group, `${label}.brace.lower-chevron-l`, [-1.55, 0.55], [-0.2, 1.75], 0.16, 0.15, materials.timber, z + 0.03);
  addBeamXY(group, `${label}.brace.lower-chevron-r`, [0.2, 1.75], [1.55, 0.55], 0.16, 0.15, materials.timber, z + 0.03);

  // Upper braces
  addCurvedBrace(group, `${label}.brace.upper-left`, [-3.45, 3.42], [-2.85, 4.55], [-2.48, 5.92], z + 0.05, materials.timberLight);
  addCurvedBrace(group, `${label}.brace.upper-right`, [3.45, 3.42], [2.85, 4.55], [2.48, 5.92], z + 0.05, materials.timberLight);
  addBeamXY(group, `${label}.brace.chevron-left`, [-1.9, 3.38], [-0.15, 4.35], 0.17, 0.16, materials.timber, z + 0.04);
  addBeamXY(group, `${label}.brace.chevron-right`, [0.15, 4.35], [1.9, 3.38], 0.17, 0.16, materials.timber, z + 0.04);

  // Gable triangle timber (only on the front gable elevation)
  if (withOpenings) {
    const gableShell = createMesh(
      createGableInfillGeometry(7.45, 2.38, 0.18),
      materials.plaster,
      `${label}.gable.plaster-infill`,
    );
    gableShell.position.set(0, 6.06, z - 0.08);
    group.add(gableShell);

    addBeamXY(group, `${label}.gable.rafter-left`, [-3.78, 6.1], [0, 8.52], 0.24, 0.2, materials.timberDark, z + 0.04, 0.035);
    addBeamXY(group, `${label}.gable.rafter-right`, [0, 8.52], [3.78, 6.1], 0.24, 0.2, materials.timberDark, z + 0.04, 0.035);
    addBlock(group, `${label}.gable.king-post`, [0.25, 2.38, 0.2], [0, 7.28, z + 0.04], materials.timber, [0, 0, 0], 0.035);
    addCurvedBrace(group, `${label}.gable.curved-brace-left`, [-3.1, 6.22], [-2.0, 6.7], [-0.5, 8.1], z + 0.06, materials.timberLight, 0.095);
    addCurvedBrace(group, `${label}.gable.curved-brace-right`, [3.1, 6.22], [2.0, 6.7], [0.5, 8.1], z + 0.06, materials.timberLight, 0.095);

    const frontWindow = createShutterWindow(materials, 'window.front-upper', 1.18, 1.18);
    frontWindow.position.set(0, 4.96, z + 0.18);
    group.add(frontWindow);
    nodes['upper-windows'] = frontWindow;

    // Extra upper side windows so facade is not empty beside center window
    for (const x of [-2.55, 2.55]) {
      const w = createShutterWindow(materials, `window.front-upper.side.${x}`, 0.95, 1.05);
      w.position.set(x, 4.9, z + 0.18);
      group.add(w);
    }
  } else {
    // Rear: simpler gable timber + two windows so the back is never blank plaster
    addBeamXY(group, `${label}.gable.rafter-left`, [-3.5, 6.05], [0, 8.4], 0.22, 0.18, materials.timberDark, z + 0.04, 0.035);
    addBeamXY(group, `${label}.gable.rafter-right`, [0, 8.4], [3.5, 6.05], 0.22, 0.18, materials.timberDark, z + 0.04, 0.035);
    addBlock(group, `${label}.gable.king-post`, [0.22, 2.2, 0.18], [0, 7.15, z + 0.04], materials.timber, [0, 0, 0], 0.03);
    for (const x of [-1.9, 1.9]) {
      const w = createShutterWindow(materials, `window.rear.${x}`, 1.0, 1.1);
      w.position.set(x, 4.85, z + 0.16);
      group.add(w);
    }
    const lower = createShutterWindow(materials, 'window.rear.lower', 1.1, 1.15);
    lower.position.set(0, 1.85, z + 0.16);
    group.add(lower);
  }

  return group;
}

function addFrontTimber(root, materials, nodes) {
  // Sit clearly outside shell (±2.85)
  addFacadeTimber(root, materials, nodes, {
    faceZ: DIMS.frontZ + 0.12,
    label: 'front-facade',
    withOpenings: true,
  });
  addFacadeTimber(root, materials, nodes, {
    faceZ: -(DIMS.frontZ + 0.12),
    label: 'rear-facade',
    withOpenings: false,
  });
}

function addSideSurface(root, materials, nodes, side) {
  const label = side > 0 ? 'right' : 'left';
  const group = createNode(root, nodes, `side-wall-${label}`);
  group.position.x = side * (DIMS.width / 2 + 0.01);
  group.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  const z = 0.05;

  for (const x of [-3.08, 0, 3.08]) {
    addBlock(group, `side.${label}.post.${x}`, [0.24, 5.95, 0.18], [x, 3.2, z], materials.timber, [0, 0, 0], 0.035);
  }
  for (const y of [0.35, 3.28, 4.42, 6.08]) {
    addBlock(group, `side.${label}.rail.${y}`, [6.28, y === 3.28 ? 0.34 : 0.22, 0.18], [0, y, z], materials.timber, [0, 0, 0], 0.035);
  }
  addCurvedBrace(group, `side.${label}.lower-brace-a`, [-2.85, 0.45], [-2.05, 1.32], [-1.5, 3.05], z + 0.04, materials.timberLight);
  addCurvedBrace(group, `side.${label}.lower-brace-b`, [1.5, 0.45], [2.05, 1.32], [2.85, 3.05], z + 0.04, materials.timberLight);
  addBeamXY(group, `side.${label}.upper-chevron-a`, [-2.7, 3.4], [-0.2, 4.32], 0.17, 0.16, materials.timber, z + 0.04);
  addBeamXY(group, `side.${label}.upper-chevron-b`, [0.2, 4.32], [2.7, 3.4], 0.17, 0.16, materials.timber, z + 0.04);
  addCurvedBrace(group, `side.${label}.upper-end-brace-a`, [-2.95, 3.42], [-2.65, 4.65], [-2.35, 5.95], z + 0.04, materials.timberLight);
  addCurvedBrace(group, `side.${label}.upper-end-brace-b`, [2.95, 3.42], [2.65, 4.65], [2.35, 5.95], z + 0.04, materials.timberLight);

  for (const [index, x] of [-1.55, 1.45].entries()) {
    const window = createShutterWindow(materials, `window.${label}-upper-${index + 1}`, 1.02, 1.12);
    window.position.set(x, 4.95, z + 0.14);
    group.add(window);
  }
  if (side > 0) {
    const lowerWindow = createShutterWindow(materials, 'window.right-lower', 0.92, 1.05);
    lowerWindow.position.set(1.35, 1.85, z + 0.14);
    group.add(lowerWindow);
  }

  if (side > 0) {
    nodes['side-walls'] = group;
    nodes['side-window-system'] = group;
  }
}

function addFloorBelt(root, materials, nodes) {
  const group = createNode(root, nodes, 'floor-belt');
  const fz = DIMS.frontZ + 0.18;
  addBlock(group, 'belt.front', [8.3, 0.4, 0.38], [0, 3.22, fz], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'belt.back', [8.3, 0.4, 0.38], [0, 3.22, -fz], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'belt.right', [0.38, 0.4, 6.55], [4.14, 3.22, 0], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'belt.left', [0.38, 0.4, 6.55], [-4.14, 3.22, 0], materials.timberDark, [0, 0, 0], 0.055);

  for (const x of [-3.55, -1.2, 1.2, 3.55]) {
    addBlock(group, `belt.front-corbel.${x}`, [0.32, 0.55, 0.48], [x, 2.88, fz], materials.timber, [0, 0, 0], 0.045);
    addBlock(group, `belt.back-corbel.${x}`, [0.32, 0.55, 0.48], [x, 2.88, -fz], materials.timber, [0, 0, 0], 0.045);
  }
  for (const z of [-2.65, -0.9, 0.9, 2.65]) {
    addBlock(group, `belt.side-corbel.${z}`, [0.48, 0.55, 0.32], [4.14, 2.88, z], materials.timber, [0, 0, 0], 0.045);
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
  add((-halfHeight - intercept) / slope, -halfHeight);
  add((halfHeight - intercept) / slope, halfHeight);
  return candidates.length >= 2 ? [candidates[0], candidates[1]] : null;
}

function createDiamondPane(materials, name, width, height) {
  const group = new THREE.Group();
  group.name = name;
  addBlock(group, `${name}.glass`, [width, height, 0.07], [0, 0, 0], materials.glassLight, [0, 0, 0], 0.018);

  for (const slope of [-1.35, 1.35]) {
    const interceptLimit = height / 2 + Math.abs(slope) * width / 2;
    for (let intercept = -interceptLimit; intercept <= interceptLimit + 0.01; intercept += 0.42) {
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
  const frontZ = DIMS.frontZ + 1.05;
  const leftWall = [0.0, wallZ];
  const leftFront = [0.46, frontZ];
  const rightFront = [3.08, frontZ];
  const rightWall = [3.54, wallZ];

  addBlock(group, 'bay.lower-plaster', [3.45, 0.82, 0.78], [1.77, 0.48, 3.65], materials.plaster, [0, 0, 0], 0.055);
  addBlock(group, 'bay.header', [3.75, 0.38, 0.92], [1.77, 3.02, 3.69], materials.timberDark, [0, 0, 0], 0.055);
  addBlock(group, 'bay.sill', [3.62, 0.28, 0.94], [1.77, 0.91, 3.7], materials.timber, [0, 0, 0], 0.05);
  addBlock(group, 'bay.front-lintel', [2.88, 0.22, 0.2], [1.77, 2.91, frontZ + 0.04], materials.timberLight, [0, 0, 0], 0.035);
  addBlock(group, 'bay.front-sill', [2.88, 0.22, 0.24], [1.77, 0.95, frontZ + 0.04], materials.timber, [0, 0, 0], 0.035);

  addBayPane(group, materials, 'bay.pane.front', leftFront, rightFront, yCenter, paneHeight);
  addBayPane(group, materials, 'bay.pane.left-return', leftWall, leftFront, yCenter, paneHeight);
  addBayPane(group, materials, 'bay.pane.right-return', rightFront, rightWall, yCenter, paneHeight);

  for (const [index, point] of [leftWall, leftFront, rightFront, rightWall].entries()) {
    addBlock(
      group,
      `bay.post.${index}`,
      [0.2, 2.1, 0.2],
      [point[0], yCenter, point[1]],
      index === 0 || index === 3 ? materials.timberDark : materials.timber,
      [0, 0, 0],
      0.035,
    );
  }
  for (const x of [0.05, 1.77, 3.49]) {
    addBlock(group, `bay.lower-post.${x}`, [0.24, 0.92, 0.24], [x, 0.46, 3.64], materials.timber, [0, 0, 0], 0.035);
  }

  nodes['bay-frame'] = group;
  nodes['bay-glazing'] = group;
  nodes['bay-lattice'] = group;
}

function addDoor(root, materials, nodes, sockets) {
  const assembly = createNode(root, nodes, 'door-system');
  const hinge = new THREE.Group();
  hinge.name = 'door.left-hinge-pivot';
  hinge.position.set(-2.78, 0.31, DIMS.frontZ + 0.22);
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
    addCylinder(hinge, `door.hinge-rivet.${y}`, 0.055, 0.055, 0.045, [0.08, y, 0.17], materials.ironLight, 10, [Math.PI / 2, 0, 0]);
  }
  addBlock(hinge, 'door.pull-plate', [0.16, 0.44, 0.07], [1.23, 1.32, 0.14], materials.iron, [0, 0, 0], 0.035);
  addTorus(hinge, 'door.pull', 0.13, 0.032, [1.23, 1.31, 0.23], materials.ironLight, [0, 0, 0], 14, Math.PI * 1.55);

  addBlock(assembly, 'door.frame-left', [0.25, 2.95, 0.32], [-2.9, 1.77, DIMS.frontZ + 0.16], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-right', [0.25, 2.95, 0.32], [-0.98, 1.77, DIMS.frontZ + 0.16], materials.timberDark, [0, 0, 0], 0.04);
  addBlock(assembly, 'door.frame-lintel', [2.17, 0.28, 0.34], [-1.94, 3.12, DIMS.frontZ + 0.16], materials.timber, [0, 0, 0], 0.045);

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
  createBarrel(group, materials, 'barrel.front-left', [-3.48, 0.28, DIMS.frontZ + 0.5]);
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
  addBlock(rig, 'sign.wall-plate', [0.24, 0.75, 0.18], [-3.88, 4.82, DIMS.frontZ + 0.14], materials.iron, [0, 0, 0], 0.04);
  addCylinderBetween(
    rig,
    'sign.bracket-arm',
    [-3.88, 5.04, DIMS.frontZ + 0.2],
    [-5.85, 5.04, DIMS.frontZ + 0.2],
    0.075,
    materials.iron,
    10,
  );
  const spear = createMesh(
    new THREE.ConeGeometry(0.16, 0.42, 8),
    materials.iron,
    'sign.bracket-spear-tip',
  );
  spear.position.set(-6.04, 5.04, DIMS.frontZ + 0.2);
  spear.rotation.z = Math.PI / 2;
  rig.add(spear);
  for (const x of [-4.55, -5.45]) {
    addTorus(rig, `sign.bracket-collar.${x}`, 0.12, 0.035, [x, 5.04, DIMS.frontZ + 0.2], materials.ironLight, [0, Math.PI / 2, 0], 14);
  }

  addChainRun(rig, materials, 'sign.chain-left', -4.62, 4.93, 4.28, DIMS.frontZ + 0.22);
  addChainRun(rig, materials, 'sign.chain-right', -5.42, 4.93, 4.28, DIMS.frontZ + 0.22);

  const signPivot = new THREE.Group();
  signPivot.name = 'sign.swing-pivot';
  signPivot.position.set(-5.02, 4.26, DIMS.frontZ + 0.22);
  rig.add(signPivot);
  sockets.signSwing = signPivot;

  const goldPlate = createMesh(
    createSignPlateGeometry(2.25, 2.3, 0.17),
    materials.gold,
    'sign.gold-border-plate',
  );
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
  addTorus(signPivot, 'sign.mug.handle', 0.24, 0.075, [0.28, -1.12, 0.25], materials.iron, [0, 0, 0], 18, Math.PI * 1.55);
  for (const [index, x] of [-0.33, -0.12, 0.1].entries()) {
    addSphere(signPivot, `sign.mug.foam.${index}`, 0.18, [x, -0.7 + (index % 2) * 0.03, 0.26], materials.iron, 12, [1.1, 0.75, 0.45]);
  }
  addBlock(signPivot, 'sign.mug.base', [0.75, 0.09, 0.08], [-0.1, -1.53, 0.26], materials.iron, [0, 0, 0], 0.02);
  for (const [index, width] of [0.9, 0.68, 0.82].entries()) {
    addBlock(signPivot, `sign.caption-mark.${index}`, [width, 0.08, 0.055], [0, -1.75 - index * 0.14, 0.25], materials.goldLight, [0, 0, 0], 0.015);
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
  group.position.set(1.3, 1.05, DIMS.frontZ + 1.28);

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
        [
          centerX + Math.cos(angle) * 0.08,
          centerY + Math.sin(angle) * 0.08,
          centerZ,
        ],
        flowerMaterials[(index + petal) % flowerMaterials.length],
        9,
        [1, 0.72, 0.5],
      );
    }
    addSphere(group, `planter.flower.${index}.center`, 0.055, [centerX, centerY, centerZ + 0.035], materials.goldLight, 8);
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
  group.position.set(1.62, 7.18, -0.82);
  addBlock(group, 'chimney.mortar-core', [1.02, 2.95, 0.98], [0, 1.35, 0], materials.mortar, [0, 0, 0], 0.035);

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
          [x, y, face * 0.52],
          [materials.stoneDark, materials.stone, materials.stoneLight][(course + column + (face > 0 ? 1 : 0)) % 3],
          [0, 0, 0],
          0.065,
          3,
        );
      }
      addBlock(
        group,
        `chimney.block.side.${course}.${face}`,
        [0.16, 0.42, 0.78],
        [face * 0.52, y, 0],
        [materials.stone, materials.stoneLight, materials.stoneDark][(course + (face > 0 ? 1 : 0)) % 3],
        [0, 0, 0],
        0.065,
        3,
      );
    }
  }

  for (const [index, x] of [-0.34, 0.34].entries()) {
    addBlock(group, `chimney.cap.${index}`, [0.72, 0.34, 1.25], [x, 3.18, 0], materials.stoneLight, [0, 0, 0], 0.075, 3);
  }
  const socket = new THREE.Object3D();
  socket.name = 'socket.chimney-smoke';
  socket.position.set(1.62, 10.55, -0.82);
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
        center: [0, 0.14, 0],
        size: [8.25, 0.28, 6.75],
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
        center: [0, 7.4, 0],
        size: [8.6, 2.65, 7.1],
        isTrigger: false,
      },
      bay: {
        type: 'compound-faceted-box',
        center: [1.77, 1.58, 3.72],
        size: [3.65, 3.15, 1.05],
        isTrigger: false,
      },
      chimney: {
        type: 'box',
        center: [1.62, 8.7, -0.82],
        size: [1.25, 3.35, 1.25],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [-5.05, 3.05, 4.15],
        size: [2.5, 2.6, 1.6],
        isTrigger: true,
      },
      doorInteraction: {
        type: 'box',
        center: [-1.95, 1.45, 3.95],
        size: [2.2, 3, 1.4],
        isTrigger: true,
      },
    },
    destructionGroups: {
      plaster: collectMeshes(nodes['building-core']),
      timberFrame: [
        ...collectMeshes(nodes['upper-gable']),
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
    ],
  };
}

/**
 * Procedural Inn v2.
 *
 * Contract:
 * - returns a THREE.Group with facade facing +Z and visible sole at y=0
 * - uses one closed indexed triangular prism as the structural gable roof
 * - keeps timber, glazing, sign, door, barrel, flowers, and chimney as real geometry
 * - exposes stable action, collider, socket, and destruction metadata
 */
export function createInnModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.inn.img2threejs-v2';
  root.userData.assetId = 'img2threejs-inn-v2';
  root.userData.gen = 'img2threejs-inn-v2';
  root.userData.heroVersion = 'img2threejs-inn-v2';
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
  addRoof(root, materials, nodes);
  addFrontTimber(root, materials, nodes);
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

export const createInnV2Model = createInnModel;

export default createInnModel;
