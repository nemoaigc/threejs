import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PALETTE = Object.freeze({
  stone: 0xf1efe7,
  stoneLight: 0xf8f6ef,
  stoneShade: 0xc8cbc7,
  stoneDeep: 0xaeb3b1,
  mortar: 0xb8bdbb,
  slate: 0x283447,
  slateDark: 0x202a3a,
  slateLight: 0x3d4c61,
  gold: 0xe3ac35,
  goldLight: 0xffd36b,
  goldDark: 0xc58b26,
  lead: 0x25282e,
  interior: 0x17191d,
  wood: 0x392a22,
  woodLight: 0x513a2b,
  red: 0xc93243,
  orange: 0xe8912e,
  yellow: 0xf1b934,
  blue: 0x286bc1,
  blueDark: 0x24458e,
  cyan: 0x1b9fbb,
  green: 0x17a47d,
  violet: 0x7d3aa8,
});

const DIMS = Object.freeze({
  naveWidth: 13,
  naveDepth: 18.4,
  foundationTop: 0.58,
  wallTop: 8.8,
  roofRise: 3.4,
  frontZ: 9.2,
  towerX: 3.25,
  towerZ: -7.05,
});

const roundedGeometryCache = new Map();

function toon(color, roughness = 0.75) {
  const material = new THREE.MeshToonMaterial({ color });
  material.userData.roughnessIntent = roughness;
  material.userData.toonCompatible = true;
  return material;
}

function standard(color, roughness, metalness = 0, extra = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    ...extra,
  });
  material.userData.toonCompatible = true;
  return material;
}

function createMaterials() {
  return {
    stone: toon(PALETTE.stone, 0.78),
    stoneLight: toon(PALETTE.stoneLight, 0.72),
    stoneShade: toon(PALETTE.stoneShade, 0.84),
    stoneDeep: toon(PALETTE.stoneDeep, 0.88),
    mortar: toon(PALETTE.mortar, 0.92),
    slate: toon(PALETTE.slate, 0.68),
    slateDark: toon(PALETTE.slateDark, 0.72),
    slateLight: toon(PALETTE.slateLight, 0.63),
    gold: standard(PALETTE.gold, 0.36, 0.72),
    goldLight: standard(PALETTE.goldLight, 0.27, 0.7),
    goldDark: standard(PALETTE.goldDark, 0.43, 0.7),
    lead: standard(PALETTE.lead, 0.48, 0.46),
    interior: toon(PALETTE.interior, 1),
    wood: toon(PALETTE.wood, 0.66),
    woodLight: toon(PALETTE.woodLight, 0.58),
    red: standard(PALETTE.red, 0.31),
    orange: standard(PALETTE.orange, 0.3),
    yellow: standard(PALETTE.yellow, 0.28),
    blue: standard(PALETTE.blue, 0.31),
    blueDark: standard(PALETTE.blueDark, 0.34),
    cyan: standard(PALETTE.cyan, 0.3),
    green: standard(PALETTE.green, 0.32),
    violet: standard(PALETTE.violet, 0.31),
  };
}

function roundedGeometry(size, radius = 0.04, segments = 2) {
  const safeRadius = Math.min(radius, ...size.map((value) => value * 0.22));
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

function mesh(geometry, material, name) {
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
) {
  const result = mesh(roundedGeometry(size, radius, 2), material, name);
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
  radialSegments = 14,
  rotation = [0, 0, 0],
) {
  const result = mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, false),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function addSphere(parent, name, radius, position, material, segments = 16) {
  const result = mesh(
    new THREE.SphereGeometry(radius, segments, Math.max(8, Math.floor(segments * 0.66))),
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
) {
  const result = mesh(
    new THREE.TorusGeometry(radius, tube, 8, 32),
    material,
    name,
  );
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function addCylinderBetween(parent, name, start, end, radius, material, segments = 9) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const result = mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), segments, 1, false),
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

function createNode(parent, nodes, id) {
  const result = new THREE.Group();
  result.name = `temple.${id}`;
  result.userData.componentId = id;
  parent.add(result);
  nodes[id] = result;
  return result;
}

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
    0, 3, 5, 0, 5, 4,
    1, 4, 5, 1, 5, 2,
    0, 4, 1,
    3, 2, 5,
    0, 1, 2, 0, 2, 3,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.closedSolid = true;
  geometry.userData.construction = 'single-indexed-gable-prism';
  geometry.userData.structuralRoof = true;
  return geometry;
}

function createGabledWallGeometry(width, wallHeight, totalHeight, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, wallHeight);
  shape.lineTo(0, totalHeight);
  shape.lineTo(-width / 2, wallHeight);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 1,
    steps: 1,
  });
  geometry.computeVertexNormals();
  geometry.userData.closedSolid = true;
  geometry.userData.construction = 'closed-extruded-gable-wall';
  return geometry;
}

function createPointedShape(width, height) {
  const shoulderY = height - width * 0.58;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, shoulderY);
  shape.quadraticCurveTo(width * 0.46, height * 0.94, 0, height);
  shape.quadraticCurveTo(-width * 0.46, height * 0.94, -width / 2, shoulderY);
  shape.closePath();
  return shape;
}

function createPointedGeometry(width, height, depth = 0.08, bevel = 0) {
  return new THREE.ExtrudeGeometry(createPointedShape(width, height), {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 1,
    steps: 1,
  });
}

function createTriangleGeometry(width, height, depth = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
  });
}

function createDiamondGeometry(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, height / 2);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, -height / 2);
  shape.lineTo(-width / 2, 0);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function addFoundation(root, materials, nodes) {
  const group = createNode(root, nodes, 'foundation');
  addBlock(group, 'foundation.lower', [14.2, 0.22, 19.8], [0, 0.11, 0], materials.stoneDeep, [0, 0, 0], 0.025);
  addBlock(group, 'foundation.middle', [13.8, 0.2, 19.35], [0, 0.31, 0], materials.stoneShade, [0, 0, 0], 0.025);
  addBlock(group, 'foundation.upper', [13.45, 0.22, 18.9], [0, 0.51, 0], materials.stone, [0, 0, 0], 0.025);
  return group;
}

function addNave(root, materials, nodes) {
  const group = createNode(root, nodes, 'nave-shell');
  addBlock(
    group,
    'nave.wall-volume',
    [DIMS.naveWidth, DIMS.wallTop - DIMS.foundationTop, DIMS.naveDepth],
    [0, (DIMS.wallTop + DIMS.foundationTop) / 2, 0],
    materials.stone,
    [0, 0, 0],
    0.055,
  );
  addBlock(group, 'nave.base-course', [13.35, 0.62, 18.75], [0, 0.9, 0], materials.stoneShade, [0, 0, 0], 0.045);
  addBlock(group, 'nave.eave-course', [13.45, 0.28, 18.75], [0, 8.62, 0], materials.stoneLight, [0, 0, 0], 0.035);

  const frontGable = mesh(
    createGabledWallGeometry(8.25, 8.2, 11.62, 0.72),
    materials.stone,
    'facade.raised-gable-solid',
  );
  frontGable.position.set(0, DIMS.foundationTop, 8.92);
  group.add(frontGable);
  nodes['raised-front-gable'] = frontGable;
  return group;
}

function addAshlarPlaneXY(parent, materials, name, width, height, y0, z, rows, depth = 0.055) {
  const course = height / rows;
  const matrices = [];
  for (let row = 0; row < rows; row += 1) {
    const columns = row % 2 === 0 ? Math.ceil(width / 1.05) : Math.ceil(width / 1.05) + 1;
    const blockWidth = width / (columns - 0.08);
    for (let column = 0; column < columns; column += 1) {
      const x = -width / 2 + blockWidth * (column + 0.5) - (row % 2 ? blockWidth * 0.5 : 0);
      if (x < -width / 2 - 0.03 || x > width / 2 + 0.03) continue;
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x, y0 + course * (row + 0.5), z),
        new THREE.Quaternion(),
        new THREE.Vector3(blockWidth * 0.94, course * 0.87, depth),
      );
      matrices.push(matrix);
    }
  }
  const result = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    materials.stoneLight,
    matrices.length,
  );
  result.name = name;
  matrices.forEach((matrix, index) => result.setMatrixAt(index, matrix));
  result.castShadow = true;
  result.receiveShadow = true;
  result.instanceMatrix.needsUpdate = true;
  parent.add(result);
  return result;
}

function addAshlarPlaneZY(parent, materials, name, depth, height, y0, x, rows, facing) {
  const course = height / rows;
  const matrices = [];
  for (let row = 0; row < rows; row += 1) {
    const columns = Math.ceil(depth / 1.08) + (row % 2);
    const blockDepth = depth / (columns - 0.05);
    for (let column = 0; column < columns; column += 1) {
      const z = -depth / 2 + blockDepth * (column + 0.5) - (row % 2 ? blockDepth * 0.5 : 0);
      if (z < -depth / 2 - 0.03 || z > depth / 2 + 0.03) continue;
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x, y0 + course * (row + 0.5), z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
        new THREE.Vector3(blockDepth * 0.94, course * 0.87, 0.055),
      );
      matrices.push(matrix);
    }
  }
  const result = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    materials.stoneLight,
    matrices.length,
  );
  result.name = name;
  matrices.forEach((matrix, index) => result.setMatrixAt(index, matrix));
  result.castShadow = true;
  result.receiveShadow = true;
  result.instanceMatrix.needsUpdate = true;
  parent.add(result);
  return result;
}

function addMasonryRelief(root, materials, nodes) {
  const group = createNode(root, nodes, 'masonry-relief');
  addAshlarPlaneXY(group, materials, 'ashlar.front', 12.65, 7.65, 0.68, 9.235, 15);
  addAshlarPlaneXY(group, materials, 'ashlar.front-gable-lower', 8.05, 7.8, 0.7, 9.675, 15, 0.045);
  addAshlarPlaneZY(group, materials, 'ashlar.right', 18.05, 7.6, 0.68, 6.53, 15, 1);
  addAshlarPlaneZY(group, materials, 'ashlar.left', 18.05, 7.6, 0.68, -6.53, 15, -1);
  return group;
}

function addMainRoof(root, materials, nodes) {
  const group = createNode(root, nodes, 'main-roof');
  const solid = mesh(
    createSolidGableGeometry(13.8, 19.2, DIMS.roofRise),
    materials.slateDark,
    'roof.structural-solid-gable',
  );
  solid.position.y = DIMS.wallTop - 0.08;
  solid.userData.isSolidGableRoof = true;
  solid.userData.noDualSlabConstruction = true;
  group.add(solid);

  addBlock(
    group,
    'roof.ridge-cap',
    [0.22, 0.18, 19.45],
    [0, DIMS.wallTop + DIMS.roofRise + 0.01, 0],
    materials.slateLight,
    [0, 0, 0],
    0.035,
  );
  addBlock(group, 'roof.eave-gold-right', [0.15, 0.2, 19.35], [6.93, 8.73, 0], materials.goldDark, [0, 0, 0], 0.025);
  addBlock(group, 'roof.eave-gold-left', [0.15, 0.2, 19.35], [-6.93, 8.73, 0], materials.goldDark, [0, 0, 0], 0.025);

  const tileGroup = createNode(group, nodes, 'roof-relief');
  const halfWidth = 6.9;
  const rows = 8;
  const columns = 20;
  const slopeAngle = Math.atan2(DIMS.roofRise, halfWidth);
  const tileGeometry = roundedGeometry([0.92, 0.075, 0.86], 0.025, 1);
  const matricesDark = [];
  const matricesLight = [];
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const x = side * (halfWidth - ((row + 0.52) / rows) * halfWidth);
      const y = DIMS.wallTop + DIMS.roofRise * (1 - Math.abs(x) / halfWidth) + 0.05;
      for (let column = 0; column < columns; column += 1) {
        const z = -9.1 + column * 0.96 + (row % 2 ? 0.42 : 0);
        if (z > 9.18) continue;
        const matrix = new THREE.Matrix4();
        matrix.compose(
          new THREE.Vector3(x, y, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -side * slopeAngle)),
          new THREE.Vector3(1, 1, 1),
        );
        ((row + column) % 4 === 0 ? matricesLight : matricesDark).push(matrix);
      }
    }
  }
  for (const [name, matrices, material] of [
    ['roof.slate-courses', matricesDark, materials.slate],
    ['roof.slate-course-highlights', matricesLight, materials.slateLight],
  ]) {
    const tiles = new THREE.InstancedMesh(tileGeometry, material, matrices.length);
    tiles.name = name;
    matrices.forEach((matrix, index) => tiles.setMatrixAt(index, matrix));
    tiles.castShadow = true;
    tiles.receiveShadow = true;
    tiles.instanceMatrix.needsUpdate = true;
    tiles.userData.surfaceReliefOnly = true;
    tileGroup.add(tiles);
  }
  return group;
}

function createLancetWindow(materials, name, width = 1.18, height = 5.25) {
  const group = new THREE.Group();
  group.name = name;

  const outer = mesh(
    createPointedGeometry(width + 0.28, height + 0.28, 0.14, 0.025),
    materials.stoneShade,
    `${name}.stone-surround`,
  );
  outer.position.set(0, -0.14, 0);
  group.add(outer);

  const recess = mesh(
    createPointedGeometry(width, height, 0.16, 0),
    materials.lead,
    `${name}.lead-recess`,
  );
  recess.position.z = 0.13;
  group.add(recess);

  const glass = mesh(
    createPointedGeometry(width - 0.18, height - 0.22, 0.07, 0),
    materials.blueDark,
    `${name}.blue-glass`,
  );
  glass.position.set(0, 0.04, 0.29);
  group.add(glass);

  const lowerDiamond = mesh(
    createDiamondGeometry(width * 0.38, 1.1),
    materials.red,
    `${name}.red-diamond`,
  );
  lowerDiamond.position.set(0, 0.72, 0.375);
  group.add(lowerDiamond);

  addBlock(group, `${name}.green-chevron-left`, [0.62, 0.18, 0.06], [-0.2, 1.75, 0.38], materials.green, [0, 0, -0.52], 0.02);
  addBlock(group, `${name}.green-chevron-right`, [0.62, 0.18, 0.06], [0.2, 1.75, 0.38], materials.green, [0, 0, 0.52], 0.02);
  addBlock(group, `${name}.violet-field-left`, [0.35, 1.4, 0.055], [-0.24, 2.72, 0.382], materials.violet, [0, 0, -0.18], 0.015);
  addBlock(group, `${name}.blue-field-right`, [0.35, 1.45, 0.055], [0.24, 2.7, 0.382], materials.blue, [0, 0, 0.18], 0.015);

  const sunY = height - 1.12;
  const sun = mesh(
    new THREE.CircleGeometry(width * 0.22, 18),
    materials.yellow,
    `${name}.sun-disc`,
  );
  sun.position.set(0, sunY, 0.39);
  group.add(sun);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const ray = mesh(
      createTriangleGeometry(0.13, 0.33, 0.035),
      materials.goldLight,
      `${name}.sun-ray-${index + 1}`,
    );
    ray.position.set(
      Math.cos(angle) * width * 0.33,
      sunY + Math.sin(angle) * width * 0.33,
      0.39,
    );
    ray.rotation.z = angle - Math.PI / 2;
    group.add(ray);
  }

  addBlock(group, `${name}.center-came`, [0.055, height - 0.65, 0.045], [0, (height - 0.5) / 2, 0.405], materials.lead, [0, 0, 0], 0.012);
  addBlock(group, `${name}.lower-came`, [width * 0.77, 0.055, 0.045], [0, 1.28, 0.405], materials.lead, [0, 0, 0], 0.012);
  return group;
}

function addLancets(root, materials, nodes) {
  const group = createNode(root, nodes, 'lancets');
  const frontY = 1.55;
  for (const x of [-5.02, 5.02]) {
    const lancet = createLancetWindow(materials, `lancet.front.${x < 0 ? 'left' : 'right'}`, 1.16, 5.35);
    lancet.position.set(x, frontY, 9.34);
    group.add(lancet);
  }

  const sideZ = [6.55, 3.28, 0, -3.28, -6.55];
  for (const side of [-1, 1]) {
    sideZ.forEach((z, index) => {
      const lancet = createLancetWindow(
        materials,
        `lancet.${side > 0 ? 'right' : 'left'}.${index + 1}`,
        1.08,
        5.25,
      );
      lancet.position.set(side * 6.34, 1.55, z);
      lancet.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(lancet);
    });
  }
  nodes['stained-glass'] = group;
  nodes['window-surrounds'] = group;
  return group;
}

function addButtresses(root, materials, nodes) {
  const group = createNode(root, nodes, 'buttresses');
  const zValues = [8.35, 4.92, 1.64, -1.64, -4.92, -8.35];
  for (const side of [-1, 1]) {
    zValues.forEach((z, index) => {
      addBlock(
        group,
        `buttress.${side > 0 ? 'right' : 'left'}.${index + 1}`,
        [0.42, 7.6, 0.52],
        [side * 6.67, 4.55, z],
        index % 2 === 0 ? materials.stoneLight : materials.stone,
        [0, 0, 0],
        0.045,
      );
      addBlock(
        group,
        `buttress.${side > 0 ? 'right' : 'left'}.${index + 1}.foot`,
        [0.58, 0.65, 0.7],
        [side * 6.7, 0.92, z],
        materials.stoneShade,
        [0, 0, 0],
        0.04,
      );
    });
  }
  return group;
}

function addRoseWindow(root, materials, nodes) {
  const group = createNode(root, nodes, 'rose-window');
  group.position.set(0, 8.34, 9.71);

  const back = mesh(
    new THREE.CylinderGeometry(2.18, 2.18, 0.16, 48),
    materials.lead,
    'rose.dark-recess',
  );
  back.rotation.x = Math.PI / 2;
  group.add(back);

  const colors = [
    materials.red,
    materials.orange,
    materials.blue,
    materials.cyan,
    materials.violet,
    materials.green,
    materials.red,
    materials.blueDark,
  ];
  const count = 16;
  for (let index = 0; index < count; index += 1) {
    const sector = mesh(
      new THREE.CircleGeometry(
        1.88,
        12,
        (index / count) * Math.PI * 2 + 0.018,
        (Math.PI * 2) / count - 0.036,
      ),
      colors[index % colors.length],
      `rose.glass-sector-${index + 1}`,
    );
    sector.position.z = 0.12;
    group.add(sector);
    addCylinderBetween(
      group,
      `rose.lead-spoke-${index + 1}`,
      [0, 0, 0.155],
      [Math.cos((index / count) * Math.PI * 2) * 1.9, Math.sin((index / count) * Math.PI * 2) * 1.9, 0.155],
      0.026,
      materials.lead,
      7,
    );
  }

  addTorus(group, 'rose.outer-stone-ring', 2.17, 0.18, [0, 0, 0.18], materials.stoneLight);
  addTorus(group, 'rose.inner-lead-ring', 1.91, 0.065, [0, 0, 0.19], materials.lead);

  const sun = mesh(
    new THREE.CylinderGeometry(0.64, 0.64, 0.17, 28),
    materials.goldLight,
    'rose.sun-core',
  );
  sun.rotation.x = Math.PI / 2;
  sun.position.z = 0.25;
  group.add(sun);
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const ray = mesh(
      createTriangleGeometry(index % 2 === 0 ? 0.22 : 0.17, index % 2 === 0 ? 0.66 : 0.52, 0.055),
      index % 2 === 0 ? materials.goldLight : materials.gold,
      `rose.sun-ray-${index + 1}`,
    );
    ray.position.set(Math.cos(angle) * 0.92, Math.sin(angle) * 0.92, 0.23);
    ray.rotation.z = angle - Math.PI / 2;
    group.add(ray);
  }
  return group;
}

function addFacadeSun(root, materials, nodes) {
  const group = createNode(root, nodes, 'facade-sun');
  group.position.set(0, 5.18, 9.78);
  const disc = mesh(
    new THREE.CylinderGeometry(0.78, 0.78, 0.2, 28),
    materials.gold,
    'facade-sun.disc',
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  addTorus(group, 'facade-sun.center-ring-outer', 0.48, 0.055, [0, 0, 0.12], materials.goldLight);
  addTorus(group, 'facade-sun.center-ring-inner', 0.28, 0.04, [0, 0, 0.14], materials.goldDark);
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const length = index % 2 === 0 ? 0.72 : 0.55;
    const ray = mesh(
      createTriangleGeometry(index % 2 === 0 ? 0.26 : 0.2, length, 0.09),
      index % 2 === 0 ? materials.goldLight : materials.gold,
      `facade-sun.ray-${index + 1}`,
    );
    ray.position.set(
      Math.cos(angle) * (0.78 + length * 0.38),
      Math.sin(angle) * (0.78 + length * 0.38),
      0.02,
    );
    ray.rotation.z = angle - Math.PI / 2;
    group.add(ray);
  }
  return group;
}

function addEntry(root, materials, nodes, sockets) {
  const steps = createNode(root, nodes, 'entry-steps');
  const stepData = [
    [9.5, 0.24, 4.2, 0.12, 11.15],
    [8.7, 0.24, 3.45, 0.34, 10.82],
    [7.9, 0.24, 2.75, 0.56, 10.5],
    [7.15, 0.24, 2.05, 0.78, 10.2],
  ];
  stepData.forEach(([width, height, depth, y, z], index) => {
    addBlock(
      steps,
      `entry.step-${index + 1}`,
      [width, height, depth],
      [0, y, z],
      index === 0 ? materials.stoneShade : materials.stoneLight,
      [0, 0, 0],
      0.035,
    );
  });

  const doors = createNode(root, nodes, 'door-system');
  addBlock(doors, 'door.recess', [3.05, 3.55, 0.22], [0, 2.37, 9.68], materials.interior, [0, 0, 0], 0.025);
  const leftPivot = new THREE.Group();
  leftPivot.name = 'door.left.hinge-pivot';
  leftPivot.position.set(-1.38, 0.78, 9.82);
  doors.add(leftPivot);
  addBlock(leftPivot, 'door.left.leaf', [1.32, 3.18, 0.15], [0.66, 1.59, 0], materials.wood, [0, 0, 0], 0.025);
  const rightPivot = new THREE.Group();
  rightPivot.name = 'door.right.hinge-pivot';
  rightPivot.position.set(1.38, 0.78, 9.82);
  doors.add(rightPivot);
  addBlock(rightPivot, 'door.right.leaf', [1.32, 3.18, 0.15], [-0.66, 1.59, 0], materials.woodLight, [0, 0, 0], 0.025);
  sockets['left-door-hinge'] = leftPivot;
  sockets['right-door-hinge'] = rightPivot;

  const portico = createNode(root, nodes, 'portico');
  const columnX = [-2.72, -0.92, 0.92, 2.72];
  columnX.forEach((x, index) => {
    addBlock(portico, `portico.column-${index + 1}.plinth`, [0.72, 0.26, 0.72], [x, 1.08, 11.75], materials.stoneShade, [0, 0, 0], 0.035);
    addCylinder(portico, `portico.column-${index + 1}.shaft`, 0.28, 0.34, 3.12, [x, 2.74, 11.75], materials.stoneLight, 16);
    addCylinder(portico, `portico.column-${index + 1}.neck`, 0.36, 0.36, 0.16, [x, 4.3, 11.75], materials.stoneShade, 16);
    addBlock(portico, `portico.column-${index + 1}.capital`, [0.72, 0.24, 0.72], [x, 4.48, 11.75], materials.stoneLight, [0, 0, 0], 0.035);
  });
  addBlock(portico, 'portico.entablature', [7.55, 0.48, 3.55], [0, 4.72, 11.15], materials.stoneLight, [0, 0, 0], 0.045);
  addBlock(portico, 'portico.gold-frieze', [7.25, 0.16, 3.62], [0, 4.89, 11.18], materials.gold, [0, 0, 0], 0.02);

  const roofGroup = createNode(portico, nodes, 'portico-roof');
  const roof = mesh(
    createSolidGableGeometry(7.9, 3.85, 1.28),
    materials.slateDark,
    'portico.structural-solid-gable',
  );
  roof.position.set(0, 4.94, 11.15);
  roof.userData.isSolidGableRoof = true;
  roof.userData.noDualSlabConstruction = true;
  roofGroup.add(roof);
  const pediment = mesh(
    createTriangleGeometry(7.32, 1.13, 0.14),
    materials.stoneLight,
    'portico.pediment-face',
  );
  pediment.position.set(0, 4.98, 13.1);
  roofGroup.add(pediment);
  addCylinderBetween(roofGroup, 'portico.pediment-gold-left', [-3.62, 5.02, 13.27], [0, 6.12, 13.27], 0.055, materials.gold, 8);
  addCylinderBetween(roofGroup, 'portico.pediment-gold-right', [0, 6.12, 13.27], [3.62, 5.02, 13.27], 0.055, materials.gold, 8);
  addBlock(roofGroup, 'portico.pediment-gold-base', [7.25, 0.1, 0.12], [0, 5.03, 13.27], materials.gold, [0, 0, 0], 0.015);
  return portico;
}

function addArchedPanel(parent, materials, name, position, rotationY = 0) {
  const frame = mesh(
    createPointedGeometry(1.18, 2.12, 0.12, 0.02),
    materials.stoneShade,
    `${name}.frame`,
  );
  frame.position.set(...position);
  frame.rotation.y = rotationY;
  parent.add(frame);
  const recess = mesh(
    createPointedGeometry(0.86, 1.82, 0.14, 0),
    materials.interior,
    `${name}.recess`,
  );
  recess.position.set(position[0], position[1] + 0.06, position[2]);
  recess.rotation.y = rotationY;
  recess.translateZ(0.11);
  parent.add(recess);
}

function addTower(root, materials, nodes, sockets) {
  const tower = createNode(root, nodes, 'tower-base');
  tower.position.set(DIMS.towerX, 0, DIMS.towerZ);
  addBlock(tower, 'tower.masonry-core', [3.85, 6.9, 3.85], [0, 10.68, 0], materials.stone, [0, 0, 0], 0.055);
  for (let row = 0; row < 10; row += 1) {
    const y = 7.55 + row * 0.62;
    const width = row % 2 ? 0.82 : 0.94;
    for (let column = -1; column <= 1; column += 1) {
      addBlock(tower, `tower.ashlar-front-${row}-${column}`, [width, 0.52, 0.055], [column * 1.05, y, 1.955], materials.stoneLight, [0, 0, 0], 0.02);
      addBlock(tower, `tower.ashlar-side-${row}-${column}`, [0.055, 0.52, width], [1.955, y, column * 1.05], materials.stoneLight, [0, 0, 0], 0.02);
    }
  }
  addBlock(tower, 'tower.lower-band', [4.18, 0.3, 4.18], [0, 7.42, 0], materials.stoneShade, [0, 0, 0], 0.035);
  addBlock(tower, 'tower.belfry-sill', [4.3, 0.32, 4.3], [0, 14.12, 0], materials.stoneLight, [0, 0, 0], 0.035);
  addBlock(tower, 'tower.belfry-sill-gold', [4.18, 0.13, 4.18], [0, 14.27, 0], materials.gold, [0, 0, 0], 0.02);

  const belfry = createNode(tower, nodes, 'belfry');
  for (const x of [-1.64, 1.64]) {
    for (const z of [-1.64, 1.64]) {
      addBlock(belfry, `belfry.pier.${x}.${z}`, [0.48, 2.75, 0.48], [x, 15.65, z], materials.stoneLight, [0, 0, 0], 0.045);
    }
  }
  addArchedPanel(belfry, materials, 'belfry.front-arch', [0, 14.58, 1.88], 0);
  addArchedPanel(belfry, materials, 'belfry.back-arch', [0, 14.58, -1.88], Math.PI);
  addArchedPanel(belfry, materials, 'belfry.right-arch', [1.88, 14.58, 0], Math.PI / 2);
  addArchedPanel(belfry, materials, 'belfry.left-arch', [-1.88, 14.58, 0], -Math.PI / 2);
  addBlock(belfry, 'belfry.cap', [4.45, 0.36, 4.45], [0, 17.05, 0], materials.stoneShade, [0, 0, 0], 0.04);
  addBlock(belfry, 'belfry.cap-gold', [4.32, 0.14, 4.32], [0, 17.22, 0], materials.goldDark, [0, 0, 0], 0.02);

  const spire = createNode(tower, nodes, 'steeple-spire');
  const spireMesh = mesh(
    new THREE.ConeGeometry(2.22, 6.8, 8, 1, false),
    materials.slateDark,
    'spire.structural-octagonal-solid',
  );
  spireMesh.position.y = 20.62;
  spireMesh.rotation.y = Math.PI / 8;
  spireMesh.userData.closedSolid = true;
  spireMesh.userData.structuralRoof = true;
  spire.add(spireMesh);
  addCylinder(spire, 'spire.base-gold-band', 2.25, 2.25, 0.18, [0, 17.29, 0], materials.gold, 8, [0, Math.PI / 8, 0]);
  addCylinder(spire, 'spire.lower-slate-band', 2.13, 2.13, 0.24, [0, 17.45, 0], materials.slateLight, 8, [0, Math.PI / 8, 0]);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
    const start = [Math.cos(angle) * 2.08, 17.48, Math.sin(angle) * 2.08];
    const end = [Math.cos(angle) * 0.09, 23.96, Math.sin(angle) * 0.09];
    addCylinderBetween(spire, `spire.gold-rib-${index + 1}`, start, end, 0.026, materials.goldDark, 7);
  }
  const lowerY = 18.12;
  const upperY = 19.42;
  for (let index = 0; index < 8; index += 1) {
    const a0 = (index / 8) * Math.PI * 2 + Math.PI / 8;
    const a1 = ((index + 1) / 8) * Math.PI * 2 + Math.PI / 8;
    const aMid = (a0 + a1) / 2;
    addCylinderBetween(
      spire,
      `spire.lattice-up-${index + 1}`,
      [Math.cos(a0) * 1.88, lowerY, Math.sin(a0) * 1.88],
      [Math.cos(aMid) * 1.5, upperY, Math.sin(aMid) * 1.5],
      0.025,
      materials.gold,
      7,
    );
    addCylinderBetween(
      spire,
      `spire.lattice-down-${index + 1}`,
      [Math.cos(aMid) * 1.5, upperY, Math.sin(aMid) * 1.5],
      [Math.cos(a1) * 1.88, lowerY, Math.sin(a1) * 1.88],
      0.025,
      materials.gold,
      7,
    );
  }

  const finial = createNode(tower, nodes, 'finial');
  addCylinder(finial, 'finial.cap-cone', 0, 0.48, 0.8, [0, 24.36, 0], materials.goldLight, 12);
  addCylinder(finial, 'finial.stem', 0.065, 0.065, 1.08, [0, 25.22, 0], materials.gold, 10);
  addSphere(finial, 'finial.collar', 0.13, [0, 25.76, 0], materials.goldLight, 12);
  addSphere(finial, 'finial.sun-core', 0.45, [0, 26.35, 0], materials.goldLight, 18);
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const length = index % 2 === 0 ? 0.72 : 0.52;
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const ray = mesh(
      new THREE.ConeGeometry(index % 2 === 0 ? 0.11 : 0.08, length, 6),
      index % 2 === 0 ? materials.goldLight : materials.gold,
      `finial.sun-ray-${index + 1}`,
    );
    ray.position.copy(direction).multiplyScalar(0.48 + length / 2);
    ray.position.y += 26.35;
    ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    finial.add(ray);
  }
  const finialSocket = new THREE.Object3D();
  finialSocket.name = 'socket.finial-effect';
  finialSocket.position.set(DIMS.towerX, 27.15, DIMS.towerZ);
  root.add(finialSocket);
  sockets['finial-effect'] = finialSocket;
  nodes['tower-trim'] = belfry;
  return tower;
}

function addGoldTrim(root, materials, nodes) {
  const group = createNode(root, nodes, 'gold-trim');
  addBlock(group, 'trim.front-left-shoulder', [2.32, 0.14, 0.12], [-5.33, 8.52, 9.42], materials.gold, [0, 0, 0], 0.02);
  addBlock(group, 'trim.front-right-shoulder', [2.32, 0.14, 0.12], [5.33, 8.52, 9.42], materials.gold, [0, 0, 0], 0.02);
  nodes['roof-ridge'] = nodes['main-roof'];
  return group;
}

function addRuntimeMetadata(root, nodes, sockets) {
  const meshes = {};
  const destructionGroups = {
    foundationStone: [],
    naveMasonry: [],
    naveRoof: [],
    towerMasonry: [],
    spireSlate: [],
    stainedGlass: [],
    solarGold: [],
    entryDoors: [],
  };
  root.traverse((object) => {
    if (!object.isMesh && !object.isInstancedMesh) return;
    meshes[object.name] = object;
    if (/foundation|step/.test(object.name)) destructionGroups.foundationStone.push(object);
    if (/nave|ashlar|buttress|facade/.test(object.name)) destructionGroups.naveMasonry.push(object);
    if (/roof\.|portico\.structural/.test(object.name)) destructionGroups.naveRoof.push(object);
    if (/tower\.|belfry/.test(object.name)) destructionGroups.towerMasonry.push(object);
    if (/spire/.test(object.name)) destructionGroups.spireSlate.push(object);
    if (/rose\.glass|lancet.*glass|diamond|field|chevron/.test(object.name)) destructionGroups.stainedGlass.push(object);
    if (/sun|gold|finial/.test(object.name)) destructionGroups.solarGold.push(object);
    if (/door\./.test(object.name)) destructionGroups.entryDoors.push(object);
  });

  root.userData.sculptRuntime = {
    nodes,
    meshes,
    sockets,
    colliders: {
      foundation: { type: 'box', size: [14.2, 0.58, 19.8], center: [0, 0.29, 0] },
      nave: { type: 'box', size: [13, 8.3, 18.4], center: [0, 4.7, 0] },
      tower: { type: 'box', size: [3.85, 9.7, 3.85], center: [DIMS.towerX, 12.2, DIMS.towerZ] },
      portico: { type: 'compound', size: [7.9, 6.25, 4.1], center: [0, 3.1, 11.2] },
      steps: { type: 'stair-boxes', size: [9.5, 1.0, 4.2], center: [0, 0.5, 11.2] },
    },
    destructionGroups,
  };
}

/**
 * Procedural fantasy village sun temple.
 *
 * Coordinate contract:
 * - facade faces +Z
 * - up is +Y
 * - visible sole sits at y=0
 * - structural roofs are closed solids; repeated slate meshes are relief only
 */
export function createTempleModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'hero.temple.img2threejs-v2';
  root.userData.assetId = 'img2threejs-temple-v2';
  root.userData.gen = 'img2threejs-temple-v2';
  root.userData.heroVersion = 'img2threejs-temple-v2';
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
  addNave(root, materials, nodes);
  addMasonryRelief(root, materials, nodes);
  addMainRoof(root, materials, nodes);
  addButtresses(root, materials, nodes);
  addLancets(root, materials, nodes);
  addRoseWindow(root, materials, nodes);
  addFacadeSun(root, materials, nodes);
  addEntry(root, materials, nodes, sockets);
  addTower(root, materials, nodes, sockets);
  addGoldTrim(root, materials, nodes);

  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;
  const wireframe = options.wireframe ?? false;
  root.traverse((object) => {
    if (!object.isMesh && !object.isInstancedMesh) return;
    object.castShadow = castShadow;
    object.receiveShadow = receiveShadow;
    if (wireframe && object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => {
          material.wireframe = true;
        });
      } else {
        object.material.wireframe = true;
      }
    }
  });

  addRuntimeMetadata(root, nodes, sockets);
  return root;
}

export default createTempleModel;
