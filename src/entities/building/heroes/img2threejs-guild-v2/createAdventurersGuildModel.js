import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PALETTE = Object.freeze({
  stoneDark: 0x6f685b,
  stone: 0x827a6b,
  stoneLight: 0x9d9584,
  mortar: 0x4f4a42,
  timberDark: 0x352319,
  timber: 0x4c3222,
  timberLight: 0x684831,
  plaster: 0xe2d8c3,
  plasterShade: 0xd2c6af,
  roofDark: 0x7b2e24,
  roof: 0x9d3b2b,
  roofLight: 0xb84b37,
  brickDark: 0x66362b,
  brick: 0x844433,
  brickLight: 0x985643,
  signGreen: 0x184833,
  signGreenDark: 0x123a2a,
  gold: 0xcfa53e,
  goldLight: 0xe2bf60,
  iron: 0x2d2e2b,
  ironLight: 0x42423d,
  parchment: 0xe2d3af,
  parchmentWarm: 0xcbb98f,
  parchmentLight: 0xefe3c8,
  cork: 0x8f6744,
  ink: 0x49372b,
  redWax: 0x9b3128,
  bluePaper: 0x8db6c2,
  interior: 0x17120e,
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
    stoneDark: standard(PALETTE.stoneDark, 0.94),
    stone: standard(PALETTE.stone, 0.9),
    stoneLight: standard(PALETTE.stoneLight, 0.86),
    mortar: standard(PALETTE.mortar, 0.98),
    timberDark: standard(PALETTE.timberDark, 0.84),
    timber: standard(PALETTE.timber, 0.78),
    timberLight: standard(PALETTE.timberLight, 0.71),
    plaster: standard(PALETTE.plaster, 0.92),
    plasterShade: standard(PALETTE.plasterShade, 0.95),
    roofDark: standard(PALETTE.roofDark, 0.88),
    roof: standard(PALETTE.roof, 0.82),
    roofLight: standard(PALETTE.roofLight, 0.78),
    brickDark: standard(PALETTE.brickDark, 0.94),
    brick: standard(PALETTE.brick, 0.9),
    brickLight: standard(PALETTE.brickLight, 0.87),
    signGreen: standard(PALETTE.signGreen, 0.56),
    signGreenDark: standard(PALETTE.signGreenDark, 0.68),
    gold: standard(PALETTE.gold, 0.38, 0.62),
    goldLight: standard(PALETTE.goldLight, 0.3, 0.68),
    iron: standard(PALETTE.iron, 0.52, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.36, 0.68),
    parchment: standard(PALETTE.parchment, 0.92),
    parchmentWarm: standard(PALETTE.parchmentWarm, 0.95),
    parchmentLight: standard(PALETTE.parchmentLight, 0.9),
    cork: standard(PALETTE.cork, 0.94),
    ink: standard(PALETTE.ink, 0.9),
    redWax: standard(PALETTE.redWax, 0.56),
    bluePaper: standard(PALETTE.bluePaper, 0.88),
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
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    1,
    false,
  );
  const result = createMesh(geometry, material, name);
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

function addBeamXY(parent, name, start, end, thickness, depth, material, z, radius = 0.025) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  return addBlock(
    parent,
    name,
    [length, thickness, depth],
    [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, z],
    material,
    [0, 0, Math.atan2(dy, dx)],
    radius,
  );
}

function addBeamYZ(parent, name, start, end, thickness, depth, material, x, radius = 0.025) {
  const dz = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dz, dy);
  return addBlock(
    parent,
    name,
    [depth, thickness, length],
    [x, (start[1] + end[1]) / 2, (start[0] + end[0]) / 2],
    material,
    [-Math.atan2(dy, dz), 0, 0],
    radius,
  );
}

function addCylinderBetween(parent, name, start, end, radius, material, radialSegments = 10) {
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

function seededUnit(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
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

function createGableInfillGeometry(depth, rise, thickness) {
  const shape = new THREE.Shape();
  shape.moveTo(-depth / 2, 0);
  shape.lineTo(depth / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.computeVertexNormals();
  return geometry;
}

function addFoundation(root, materials, nodes) {
  const foundation = new THREE.Group();
  foundation.name = 'macro.foundation';
  root.add(foundation);
  nodes.foundation = foundation;

  addBlock(
    foundation,
    'foundation.plinth',
    [12.8, 0.36, 7.0],
    [0, 0.18, 0],
    materials.stoneLight,
    [0, 0, 0],
    0.055,
  );

  for (let index = 0; index < 7; index += 1) {
    addBlock(
      foundation,
      `foundation.front-block.${index}`,
      [1.74, 0.34, 0.72],
      [-5.25 + index * 1.75, 0.18, 3.5],
      [materials.stoneDark, materials.stone, materials.stoneLight][index % 3],
      [0, 0, 0],
      0.045,
    );
  }

  for (const [name, x] of [['left', -3.82], ['center', -0.12]]) {
    addBlock(
      foundation,
      `foundation.step.${name}.lower`,
      [2.65, 0.24, 0.85],
      [x, 0.12, 4.05],
      materials.stoneLight,
      [0, 0, 0],
      0.04,
    );
    addBlock(
      foundation,
      `foundation.step.${name}.upper`,
      [2.25, 0.2, 0.62],
      [x, 0.3, 3.8],
      materials.stone,
      [0, 0, 0],
      0.035,
    );
  }
}

function createStoneInstances(root, materials, nodes) {
  const masonry = new THREE.Group();
  masonry.name = 'structural.masonry-courses';
  root.add(masonry);
  nodes.masonry = masonry;

  addBlock(
    masonry,
    'masonry.core',
    [12.0, 3.35, 6.4],
    [0, 2.02, 0],
    materials.mortar,
    [0, 0, 0],
    0.035,
  );

  const matrices = [[], [], []];
  const dummy = new THREE.Object3D();
  const pushStone = (position, scale, materialIndex) => {
    dummy.position.set(...position);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(...scale);
    dummy.updateMatrix();
    matrices[materialIndex].push(dummy.matrix.clone());
  };

  const rows = 7;
  const frontColumns = 13;
  const frontBlockWidth = 11.8 / frontColumns;
  const blockHeight = 3.05 / rows;
  const doorCenters = [-3.82, -0.12];

  for (let row = 0; row < rows; row += 1) {
    const stagger = row % 2 ? frontBlockWidth * 0.47 : 0;
    for (let column = -1; column <= frontColumns; column += 1) {
      const x = -5.9 + frontBlockWidth * (column + 0.5) + stagger;
      if (x < -5.98 || x > 5.98) continue;
      const y = 0.45 + blockHeight * (row + 0.5);
      const inDoor = doorCenters.some((center) => Math.abs(x - center) < 1.28) && y < 3.24;
      if (inDoor) continue;
      const seed = row * 61 + column * 17 + 9;
      pushStone(
        [x, y, 3.24 + seededUnit(seed + 2) * 0.018],
        [
          frontBlockWidth * (0.91 + seededUnit(seed) * 0.05),
          blockHeight * (0.82 + seededUnit(seed + 1) * 0.07),
          0.2,
        ],
        Math.floor(seededUnit(seed + 3) * 3),
      );
    }
  }

  const sideColumns = 7;
  const sideBlockDepth = 6.2 / sideColumns;
  for (const x of [-6.06, 6.06]) {
    for (let row = 0; row < rows; row += 1) {
      const stagger = row % 2 ? sideBlockDepth * 0.45 : 0;
      for (let column = -1; column <= sideColumns; column += 1) {
        const z = -3.1 + sideBlockDepth * (column + 0.5) + stagger;
        if (z < -3.18 || z > 3.18) continue;
        const seed = row * 73 + column * 23 + (x > 0 ? 37 : 13);
        pushStone(
          [x, 0.45 + blockHeight * (row + 0.5), z],
          [
            0.2,
            blockHeight * (0.82 + seededUnit(seed + 1) * 0.07),
            sideBlockDepth * (0.91 + seededUnit(seed) * 0.05),
          ],
          Math.floor(seededUnit(seed + 3) * 3),
        );
      }
    }
  }

  const backColumns = 13;
  const backBlockWidth = 11.8 / backColumns;
  for (let row = 0; row < rows; row += 1) {
    const stagger = row % 2 ? backBlockWidth * 0.47 : 0;
    for (let column = -1; column <= backColumns; column += 1) {
      const x = -5.9 + backBlockWidth * (column + 0.5) + stagger;
      if (x < -5.98 || x > 5.98) continue;
      const seed = row * 83 + column * 29 + 47;
      pushStone(
        [x, 0.45 + blockHeight * (row + 0.5), -3.24],
        [backBlockWidth * 0.92, blockHeight * 0.84, 0.2],
        Math.floor(seededUnit(seed) * 3),
      );
    }
  }

  const stoneMaterials = [materials.stoneDark, materials.stone, materials.stoneLight];
  const unitStone = new RoundedBoxGeometry(1, 1, 1, 1, 0.075);
  for (let materialIndex = 0; materialIndex < matrices.length; materialIndex += 1) {
    const instances = new THREE.InstancedMesh(
      unitStone,
      stoneMaterials[materialIndex],
      matrices[materialIndex].length,
    );
    instances.name = `masonry.instances.${materialIndex}`;
    instances.castShadow = true;
    instances.receiveShadow = true;
    matrices[materialIndex].forEach((matrix, index) => instances.setMatrixAt(index, matrix));
    instances.instanceMatrix.needsUpdate = true;
    masonry.add(instances);
  }
}

function addArcade(root, materials, nodes) {
  const arcade = new THREE.Group();
  arcade.name = 'structural.front-arcade';
  root.add(arcade);
  nodes.arcade = arcade;

  const postXs = [-5.72, -1.92, 1.68, 5.72];
  for (let index = 0; index < postXs.length; index += 1) {
    const x = postXs[index];
    const post = new THREE.Group();
    post.name = `arcade.post.${index}`;
    arcade.add(post);
    addBlock(post, 'stone-foot', [0.72, 0.32, 0.72], [x, 0.52, 3.38], materials.stoneDark, [0, 0, 0], 0.045);
    addBlock(post, 'timber-shaft', [0.48, 2.65, 0.48], [x, 1.97, 3.42], materials.timber, [0, 0, 0], 0.04);
    addBlock(post, 'shaft-collar', [0.62, 0.18, 0.6], [x, 2.72, 3.42], materials.timberLight, [0, 0, 0], 0.035);
    addBlock(post, 'capital-lower', [0.7, 0.2, 0.68], [x, 3.26, 3.42], materials.timber, [0, 0, 0], 0.04);
    addBlock(post, 'capital-upper', [0.88, 0.18, 0.76], [x, 3.46, 3.42], materials.timberDark, [0, 0, 0], 0.04);
  }

  addBlock(arcade, 'arcade-header', [12.35, 0.38, 0.68], [0, 3.58, 3.37], materials.timberDark, [0, 0, 0], 0.05);
  addBlock(arcade, 'jetty-ledge', [12.65, 0.2, 0.82], [0, 3.78, 3.37], materials.timberLight, [0, 0, 0], 0.04);

  for (let index = 0; index < postXs.length - 1; index += 1) {
    addBeamXY(
      arcade,
      `arcade.knee-left.${index}`,
      [postXs[index] + 0.06, 3.05],
      [postXs[index] + 0.68, 3.55],
      0.15,
      0.3,
      materials.timberDark,
      3.46,
    );
    addBeamXY(
      arcade,
      `arcade.knee-right.${index}`,
      [postXs[index + 1] - 0.06, 3.05],
      [postXs[index + 1] - 0.68, 3.55],
      0.15,
      0.3,
      materials.timberDark,
      3.46,
    );
  }
}

function addUpperStructure(root, materials, nodes) {
  const upper = new THREE.Group();
  upper.name = 'structural.half-timber-upper';
  root.add(upper);
  nodes.upper = upper;

  addBlock(upper, 'upper.core', [12.15, 3.45, 6.5], [0, 5.44, 0], materials.plaster, [0, 0, 0], 0.025);

  const frontZ = 3.34;
  const backZ = -3.34;
  const baseY = 3.74;
  const topY = 7.08;
  const midY = 5.4;
  const frontBays = 6;
  const bayWidth = 12 / frontBays;

  for (const [sideName, z, frontMaterial] of [
    ['front', frontZ, materials.timber],
    ['back', backZ, materials.timberDark],
  ]) {
    for (let index = 0; index <= frontBays; index += 1) {
      const x = -6 + index * bayWidth;
      addBlock(
        upper,
        `${sideName}.post.${index}`,
        [0.22, 3.42, 0.24],
        [x, 5.41, z],
        index % 2 ? frontMaterial : materials.timberLight,
        [0, 0, 0],
        0.028,
      );
    }
    for (const [railName, y] of [['sill', baseY], ['middle', midY], ['top', topY]]) {
      addBlock(
        upper,
        `${sideName}.rail.${railName}`,
        [12.2, 0.22, 0.24],
        [0, y, z],
        railName === 'middle' ? materials.timber : materials.timberDark,
        [0, 0, 0],
        0.028,
      );
    }
    for (let bay = 0; bay < frontBays; bay += 1) {
      const x0 = -5.88 + bay * bayWidth;
      const x1 = x0 + bayWidth - 0.24;
      const rising = bay % 2 === 0;
      addBeamXY(
        upper,
        `${sideName}.brace.${bay}`,
        rising ? [x0, baseY + 0.15] : [x1, baseY + 0.15],
        rising ? [x1, topY - 0.15] : [x0, topY - 0.15],
        0.16,
        0.2,
        materials.timberDark,
        z + (z > 0 ? 0.02 : -0.02),
        0.022,
      );
    }
  }

  const sideBays = 4;
  const bayDepth = 6.4 / sideBays;
  for (const x of [-6.18, 6.18]) {
    const outward = x > 0 ? 1 : -1;
    for (let index = 0; index <= sideBays; index += 1) {
      const z = -3.2 + index * bayDepth;
      addBlock(
        upper,
        `side.${outward}.post.${index}`,
        [0.24, 3.42, 0.22],
        [x, 5.41, z],
        index % 2 ? materials.timber : materials.timberLight,
        [0, 0, 0],
        0.028,
      );
    }
    for (const [railName, y] of [['sill', baseY], ['middle', midY], ['top', topY]]) {
      addBlock(
        upper,
        `side.${outward}.rail.${railName}`,
        [0.24, 0.22, 6.55],
        [x, y, 0],
        railName === 'middle' ? materials.timber : materials.timberDark,
        [0, 0, 0],
        0.028,
      );
    }
    for (let bay = 0; bay < sideBays; bay += 1) {
      const z0 = -3.08 + bay * bayDepth;
      const z1 = z0 + bayDepth - 0.24;
      const rising = bay % 2 === 0;
      addBeamYZ(
        upper,
        `side.${outward}.brace.${bay}`,
        rising ? [z0, baseY + 0.15] : [z1, baseY + 0.15],
        rising ? [z1, topY - 0.15] : [z0, topY - 0.15],
        0.16,
        0.2,
        materials.timberDark,
        x + outward * 0.02,
        0.022,
      );
    }
  }

  const gableGeometry = createGableInfillGeometry(6.45, 2.88, 0.16);
  for (const side of [-1, 1]) {
    const gable = createMesh(gableGeometry, materials.plaster, `gable.infill.${side}`);
    gable.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    gable.position.set(side * 6.09, 7.05, 0);
    upper.add(gable);
    const x = side * 6.22;
    addBeamYZ(upper, `gable.${side}.left-rake`, [-3.08, 7.08], [0, 9.86], 0.2, 0.22, materials.timberDark, x, 0.024);
    addBeamYZ(upper, `gable.${side}.right-rake`, [0, 9.86], [3.08, 7.08], 0.2, 0.22, materials.timberDark, x, 0.024);
    addBlock(upper, `gable.${side}.collar`, [0.24, 0.2, 3.8], [x, 8.35, 0], materials.timber, [0, 0, 0], 0.025);
    addBlock(upper, `gable.${side}.king-post`, [0.24, 2.72, 0.22], [x, 8.45, 0], materials.timber, [0, 0, 0], 0.025);
    addBeamYZ(upper, `gable.${side}.brace-left`, [-2.3, 7.18], [0, 8.35], 0.16, 0.2, materials.timberDark, x, 0.02);
    addBeamYZ(upper, `gable.${side}.brace-right`, [0, 8.35], [2.3, 7.18], 0.16, 0.2, materials.timberDark, x, 0.02);
  }
}

function addRoof(root, materials, nodes) {
  const roofGroup = new THREE.Group();
  roofGroup.name = 'macro.single-solid-gable-roof';
  root.add(roofGroup);
  nodes.roof = roofGroup;

  const width = 13.1;
  const depth = 7.5;
  const rise = 3.05;
  const baseY = 7.03;
  const solid = createMesh(
    createSolidGableGeometry(width, depth, rise),
    materials.roofDark,
    'roof.closed-solid-prism',
  );
  solid.position.y = baseY;
  solid.userData.isSolidGableRoof = true;
  roofGroup.add(solid);
  nodes.roofSolid = solid;

  addBlock(roofGroup, 'roof.front-fascia', [13.25, 0.18, 0.2], [0, baseY + 0.01, depth / 2], materials.timberDark, [0, 0, 0], 0.025);
  addBlock(roofGroup, 'roof.back-fascia', [13.25, 0.18, 0.2], [0, baseY + 0.01, -depth / 2], materials.timberDark, [0, 0, 0], 0.025);

  const rows = 10;
  const columns = 22;
  const angle = Math.atan2(rise, depth / 2);
  const slopeLength = Math.hypot(depth / 2, rise);
  const cellWidth = width / columns;
  const tileWidth = cellWidth * 0.97;
  const tileDepth = (slopeLength / rows) * 1.12;
  const tileMatrices = [[], [], []];
  const dummy = new THREE.Object3D();

  for (const side of [1, -1]) {
    for (let row = 0; row < rows; row += 1) {
      const t = (row + 0.47) / rows;
      const z = side * (depth / 2) * (1 - t);
      const y = baseY + rise * t + 0.065;
      const stagger = row % 2 ? cellWidth * 0.5 : 0;
      for (let column = -1; column <= columns; column += 1) {
        const x = -width / 2 + cellWidth * (column + 0.5) + stagger;
        if (x < -width / 2 - 0.04 || x > width / 2 + 0.04) continue;
        const seed = row * 101 + column * 31 + (side > 0 ? 19 : 47);
        const variant = Math.floor(seededUnit(seed) * 3);
        dummy.position.set(x, y, z);
        dummy.rotation.set(side * angle, 0, 0);
        dummy.scale.set(tileWidth, 0.105, tileDepth);
        dummy.updateMatrix();
        tileMatrices[variant].push(dummy.matrix.clone());
      }
    }
  }

  const tileGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.09);
  const tileMaterials = [materials.roofDark, materials.roof, materials.roofLight];
  for (let variant = 0; variant < tileMatrices.length; variant += 1) {
    const instances = new THREE.InstancedMesh(
      tileGeometry,
      tileMaterials[variant],
      tileMatrices[variant].length,
    );
    instances.name = `roof.tile-instances.${variant}`;
    instances.castShadow = true;
    instances.receiveShadow = true;
    tileMatrices[variant].forEach((matrix, index) => instances.setMatrixAt(index, matrix));
    instances.instanceMatrix.needsUpdate = true;
    roofGroup.add(instances);
  }

  const capCount = 22;
  for (let index = 0; index < capCount; index += 1) {
    const x = -width / 2 + ((index + 0.5) / capCount) * width;
    addCylinder(
      roofGroup,
      `roof.ridge-cap.${index}`,
      0.14,
      0.14,
      width / capCount * 1.04,
      [x, baseY + rise + 0.1, 0],
      index % 3 === 0 ? materials.roofDark : materials.roof,
      10,
      [0, 0, Math.PI / 2],
    );
  }
}

function addChimney(root, materials, nodes) {
  const chimney = new THREE.Group();
  chimney.name = 'form.chimney';
  root.add(chimney);
  nodes.chimney = chimney;

  const x = 2.65;
  const z = -0.35;
  addBlock(chimney, 'chimney.shadow-core', [0.9, 2.25, 0.82], [x, 9.85, z], materials.brickDark, [0, 0, 0], 0.025);
  addBlock(chimney, 'chimney.stone-shoulder', [1.12, 0.32, 1.02], [x, 9.52, z], materials.stone, [0, 0, 0], 0.04);

  const courseHeight = 0.27;
  const brickWidth = 0.4;
  for (let row = 0; row < 8; row += 1) {
    const offset = row % 2 ? brickWidth * 0.5 : 0;
    for (let column = -1; column <= 1; column += 1) {
      const bx = x + column * brickWidth + offset;
      if (bx > x + 0.48) continue;
      const material = [materials.brickDark, materials.brick, materials.brickLight][
        (row + column + 6) % 3
      ];
      addBlock(
        chimney,
        `chimney.front-brick.${row}.${column}`,
        [0.37, 0.235, 0.14],
        [bx, 9.0 + row * courseHeight, z + 0.47],
        material,
        [0, 0, 0],
        0.018,
        1,
      );
      addBlock(
        chimney,
        `chimney.back-brick.${row}.${column}`,
        [0.37, 0.235, 0.14],
        [bx, 9.0 + row * courseHeight, z - 0.47],
        material,
        [0, 0, 0],
        0.018,
        1,
      );
    }
    for (const side of [-1, 1]) {
      addBlock(
        chimney,
        `chimney.side-brick.${row}.${side}`,
        [0.14, 0.235, 0.64],
        [x + side * 0.5, 9.0 + row * courseHeight, z],
        row % 2 ? materials.brick : materials.brickLight,
        [0, 0, 0],
        0.018,
        1,
      );
    }
  }
  addBlock(chimney, 'chimney.cap-lower', [1.16, 0.22, 1.04], [x, 10.98, z], materials.stone, [0, 0, 0], 0.035);
  addBlock(chimney, 'chimney.cap-upper', [1.28, 0.2, 1.14], [x, 11.17, z], materials.stoneLight, [0, 0, 0], 0.04);
}

function addDoorBay(root, materials, nodes, sockets, centerX, bayName) {
  const bay = new THREE.Group();
  bay.name = `form.door-bay.${bayName}`;
  root.add(bay);
  nodes[`door${bayName}`] = bay;

  addBlock(bay, 'door-recess', [2.45, 2.9, 0.28], [centerX, 1.82, 3.3], materials.interior, [0, 0, 0], 0.035);
  addBlock(bay, 'left-jamb', [0.34, 3.05, 0.42], [centerX - 1.36, 1.85, 3.39], materials.stone, [0, 0, 0], 0.035);
  addBlock(bay, 'right-jamb', [0.34, 3.05, 0.42], [centerX + 1.36, 1.85, 3.39], materials.stone, [0, 0, 0], 0.035);
  addBlock(bay, 'stone-lintel', [3.05, 0.4, 0.44], [centerX, 3.25, 3.39], materials.stoneDark, [0, 0, 0], 0.04);

  for (const leafSide of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = `pivot.door.${bayName}.${leafSide < 0 ? 'left' : 'right'}`;
    pivot.position.set(centerX + leafSide * 1.13, 0.4, 3.5);
    bay.add(pivot);
    sockets[`door${bayName}${leafSide < 0 ? 'Left' : 'Right'}Hinge`] = pivot;

    const localCenterX = -leafSide * 0.55;
    addBlock(pivot, 'door-leaf', [1.08, 2.62, 0.18], [localCenterX, 1.31, 0], materials.timber, [0, 0, 0], 0.025);
    for (let plank = 1; plank < 4; plank += 1) {
      const px = localCenterX - 0.54 + plank * 0.27;
      addBlock(pivot, `plank-groove.${plank}`, [0.025, 2.48, 0.025], [px, 1.31, 0.105], materials.timberDark, [0, 0, 0], 0.008, 1);
    }
    for (const y of [0.74, 2.02]) {
      addBlock(pivot, `iron-strap.${y}`, [0.78, 0.105, 0.055], [localCenterX + leafSide * 0.08, y, 0.13], materials.iron, [0, 0, 0], 0.018, 1);
      for (const rivetX of [-0.3, 0.3]) {
        addCylinder(
          pivot,
          `strap-rivet.${y}.${rivetX}`,
          0.036,
          0.036,
          0.045,
          [localCenterX + rivetX, y, 0.17],
          materials.ironLight,
          8,
          [Math.PI / 2, 0, 0],
        );
      }
    }
    addTorus(
      pivot,
      'ring-pull',
      0.12,
      0.027,
      [localCenterX - leafSide * 0.27, 1.35, 0.18],
      materials.ironLight,
      [0, 0, 0],
      12,
    );
    addSphere(
      pivot,
      'ring-mount',
      0.055,
      [localCenterX - leafSide * 0.27, 1.5, 0.17],
      materials.iron,
      9,
    );
  }
}

function createShieldGeometry(width, height, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, -height * 0.68);
  shape.lineTo(width * 0.3, -height * 0.88);
  shape.lineTo(0, -height);
  shape.lineTo(-width * 0.3, -height * 0.88);
  shape.lineTo(-width / 2, -height * 0.68);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
}

function createSwordRelief(materials, name) {
  const sword = new THREE.Group();
  sword.name = name;

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.055, -0.28);
  bladeShape.lineTo(-0.075, 0.46);
  bladeShape.lineTo(0, 0.68);
  bladeShape.lineTo(0.075, 0.46);
  bladeShape.lineTo(0.055, -0.28);
  bladeShape.closePath();
  const blade = createMesh(
    new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.06,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
    }),
    materials.goldLight,
    `${name}.blade`,
  );
  sword.add(blade);
  addBlock(sword, `${name}.guard`, [0.36, 0.075, 0.1], [0, -0.33, 0.05], materials.gold, [0, 0, 0], 0.02, 1);
  addBlock(sword, `${name}.grip`, [0.095, 0.31, 0.095], [0, -0.52, 0.05], materials.gold, [0, 0, 0], 0.018, 1);
  addSphere(sword, `${name}.pommel`, 0.085, [0, -0.72, 0.05], materials.gold, 10);
  return sword;
}

function addGuildSign(root, materials, nodes, sockets) {
  const rig = new THREE.Group();
  rig.name = 'structural.perpendicular-sign-rig';
  root.add(rig);
  nodes.signRig = rig;

  addBlock(rig, 'sign.wall-plate', [0.18, 0.95, 0.55], [5.48, 6.5, 3.43], materials.iron, [0, 0, 0], 0.025);
  addCylinderBetween(rig, 'sign.projecting-arm', [5.48, 6.72, 3.48], [5.48, 6.72, 5.92], 0.09, materials.iron, 10);
  addCylinder(rig, 'sign.arm-finial', 0.13, 0.13, 0.22, [5.48, 6.72, 5.98], materials.ironLight, 10, [Math.PI / 2, 0, 0]);
  addCylinderBetween(rig, 'sign.diagonal-brace', [5.48, 6.08, 3.48], [5.48, 6.67, 4.25], 0.055, materials.iron, 9);

  const signPivot = new THREE.Group();
  signPivot.name = 'pivot.guild-sign';
  signPivot.position.set(5.48, 6.72, 5.05);
  signPivot.rotation.y = Math.PI / 2;
  rig.add(signPivot);
  nodes.guildSign = signPivot;
  sockets.signSwing = signPivot;

  const linkGeometry = new THREE.TorusGeometry(0.075, 0.021, 6, 10);
  for (const chainX of [-0.48, 0.48]) {
    for (let index = 0; index < 6; index += 1) {
      const link = createMesh(linkGeometry, materials.gold, `sign.chain.${chainX}.${index}`);
      link.position.set(chainX, -0.08 - index * 0.15, 0);
      link.rotation.y = index % 2 ? Math.PI / 2 : 0;
      signPivot.add(link);
    }
  }

  const outer = createMesh(
    createShieldGeometry(1.72, 2.18, 0.13),
    materials.gold,
    'sign.outer-gold-shield',
  );
  outer.position.set(0, -0.9, -0.065);
  signPivot.add(outer);

  const inner = createMesh(
    createShieldGeometry(1.48, 1.94, 0.12),
    materials.signGreen,
    'sign.inner-green-shield',
  );
  inner.position.set(0, -1.01, 0.075);
  signPivot.add(inner);

  const swordLeft = createSwordRelief(materials, 'sign.sword-left');
  swordLeft.position.set(-0.02, -1.93, 0.23);
  swordLeft.rotation.z = -0.58;
  signPivot.add(swordLeft);
  const swordRight = createSwordRelief(materials, 'sign.sword-right');
  swordRight.position.set(0.02, -1.93, 0.31);
  swordRight.rotation.z = 0.58;
  signPivot.add(swordRight);
}

function addQuestBoard(root, materials, nodes) {
  const board = new THREE.Group();
  board.name = 'form.quest-board';
  board.position.set(3.68, 0, 3.63);
  root.add(board);
  nodes.questBoard = board;

  addBlock(board, 'board.back', [2.45, 1.6, 0.17], [0, 1.73, 0], materials.timberDark, [0, 0, 0], 0.03);
  addBlock(board, 'board.cork', [2.14, 1.3, 0.08], [0, 1.73, 0.13], materials.cork, [0, 0, 0], 0.018);
  addBlock(board, 'board.left-leg', [0.18, 2.5, 0.2], [-1.16, 1.25, 0], materials.timber, [0, 0, 0], 0.025);
  addBlock(board, 'board.right-leg', [0.18, 2.5, 0.2], [1.16, 1.25, 0], materials.timber, [0, 0, 0], 0.025);
  addBlock(board, 'board.top-rail', [2.65, 0.16, 0.24], [0, 2.5, 0.02], materials.timberLight, [0, 0, 0], 0.03);
  addBlock(board, 'board.bottom-rail', [2.65, 0.16, 0.24], [0, 0.96, 0.02], materials.timberLight, [0, 0, 0], 0.03);
  addBlock(board, 'board.left-foot', [0.58, 0.16, 0.52], [-1.16, 0.08, 0], materials.timberDark, [0, 0, 0], 0.025);
  addBlock(board, 'board.right-foot', [0.58, 0.16, 0.52], [1.16, 0.08, 0], materials.timberDark, [0, 0, 0], 0.025);

  const papers = [
    [-0.72, 1.95, 0.48, 0.58, -0.08, materials.parchmentLight],
    [-0.18, 2.0, 0.5, 0.5, 0.06, materials.parchment],
    [0.45, 2.03, 0.55, 0.58, -0.04, materials.bluePaper],
    [0.82, 1.65, 0.42, 0.5, 0.08, materials.parchmentLight],
    [-0.58, 1.45, 0.56, 0.48, 0.04, materials.parchmentWarm],
    [0.05, 1.45, 0.48, 0.52, -0.06, materials.parchmentLight],
  ];
  for (let index = 0; index < papers.length; index += 1) {
    const [x, y, width, height, rotation, material] = papers[index];
    addBlock(board, `notice.${index}`, [width, height, 0.025], [x, y, 0.205 + index * 0.002], material, [0, 0, rotation], 0.008, 1);
    addBlock(board, `notice-line.${index}.a`, [width * 0.56, 0.024, 0.012], [x, y + height * 0.12, 0.225 + index * 0.002], materials.ink, [0, 0, rotation], 0.004, 1);
    addBlock(board, `notice-line.${index}.b`, [width * 0.4, 0.018, 0.012], [x, y - height * 0.04, 0.226 + index * 0.002], materials.ink, [0, 0, rotation], 0.004, 1);
    addSphere(board, `notice-pin.${index}`, 0.038, [x, y + height * 0.38, 0.245 + index * 0.002], index === 3 ? materials.redWax : materials.ironLight, 8);
  }
}

function createBarrel(parent, materials, name, position, scale = 1) {
  const barrel = new THREE.Group();
  barrel.name = name;
  barrel.position.set(...position);
  barrel.scale.setScalar(scale);
  parent.add(barrel);

  const profile = [
    new THREE.Vector2(0.31, 0),
    new THREE.Vector2(0.35, 0.1),
    new THREE.Vector2(0.39, 0.36),
    new THREE.Vector2(0.4, 0.62),
    new THREE.Vector2(0.37, 0.9),
    new THREE.Vector2(0.31, 1.02),
  ];
  const body = createMesh(new THREE.LatheGeometry(profile, 16), materials.timberLight, `${name}.body`);
  barrel.add(body);

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    addBlock(
      barrel,
      `${name}.stave.${index}`,
      [0.052, 0.88, 0.035],
      [Math.cos(angle) * 0.39, 0.51, Math.sin(angle) * 0.39],
      index % 3 === 0 ? materials.timberLight : materials.timber,
      [0, -angle, 0],
      0.012,
      1,
    );
  }
  for (const y of [0.16, 0.5, 0.86]) {
    addTorus(barrel, `${name}.hoop.${y}`, 0.39, 0.032, [0, y, 0], materials.iron, [Math.PI / 2, 0, 0], 18);
  }
  addCylinder(barrel, `${name}.top`, 0.31, 0.31, 0.05, [0, 1.02, 0], materials.timberDark, 16);
  return barrel;
}

function addBarrels(root, materials, nodes) {
  const cluster = new THREE.Group();
  cluster.name = 'form.barrel-cluster';
  root.add(cluster);
  nodes.barrels = cluster;

  createBarrel(cluster, materials, 'barrel.large', [-4.72, 0, 4.1], 1.18);
  createBarrel(cluster, materials, 'barrel.medium', [-5.42, 0, 4.38], 0.96);
  createBarrel(cluster, materials, 'barrel.small', [-4.0, 0, 4.43], 0.82);

  addCylinder(
    cluster,
    'barrel.leaning-lid',
    0.36,
    0.36,
    0.08,
    [-4.15, 0.78, 4.75],
    materials.timber,
    16,
    [Math.PI / 2, 0.18, 0],
  );
  addTorus(cluster, 'barrel.leaning-lid-rim', 0.36, 0.026, [-4.15, 0.78, 4.79], materials.iron, [0, 0.18, 0], 18);
}

function addRuntimeMetadata(root, nodes, sockets) {
  const signInteractionSocket = new THREE.Object3D();
  signInteractionSocket.name = 'socket.sign-interaction';
  signInteractionSocket.position.set(5.85, 4.95, 5.05);
  root.add(signInteractionSocket);
  sockets.signInteraction = signInteractionSocket;

  const questInteractionSocket = new THREE.Object3D();
  questInteractionSocket.name = 'socket.quest-board-interaction';
  questInteractionSocket.position.set(3.68, 1.55, 4.0);
  root.add(questInteractionSocket);
  sockets.questBoardInteraction = questInteractionSocket;

  root.userData.sculptRuntime = {
    coordinateFrame: {
      front: '+Z',
      up: '+Y',
      soleY: 0,
    },
    nodes,
    sockets,
    colliders: {
      building: {
        type: 'box',
        center: [0, 4.0, 0],
        size: [12.8, 8.0, 7.0],
        isTrigger: false,
      },
      roof: {
        type: 'compound-gable-prism',
        center: [0, 8.55, 0],
        size: [13.1, 3.05, 7.5],
        isTrigger: false,
      },
      signInteraction: {
        type: 'box',
        center: [5.6, 5.15, 5.05],
        size: [0.7, 2.5, 2.0],
        isTrigger: true,
      },
      questBoardInteraction: {
        type: 'box',
        center: [3.68, 1.55, 3.9],
        size: [2.8, 2.8, 1.0],
        isTrigger: true,
      },
    },
    destructionGroups: {
      masonry: [nodes.foundation, nodes.masonry],
      timberFrame: [nodes.arcade, nodes.upper],
      roof: [nodes.roof, nodes.chimney],
      facadeProps: [nodes.questBoard, nodes.barrels, nodes.guildSign],
    },
    animation: {
      doorLeftA: { node: sockets.doorLeftLeftHinge, axis: [0, 1, 0], range: [-1.15, 0] },
      doorRightA: { node: sockets.doorLeftRightHinge, axis: [0, 1, 0], range: [0, 1.15] },
      doorLeftB: { node: sockets.doorCenterLeftHinge, axis: [0, 1, 0], range: [-1.15, 0] },
      doorRightB: { node: sockets.doorCenterRightHinge, axis: [0, 1, 0], range: [0, 1.15] },
      hangingSign: { node: nodes.guildSign, axis: [0, 0, 1], range: [-0.08, 0.08] },
    },
    buildPasses: [
      'blockout',
      'structural-pass',
      'form-refinement',
      'material-pass',
      'surface-pass',
      'interaction-pass',
      'optimization-pass',
    ],
    sources: [
      'public/content/buildings/adventurers_guild/ref_main.png',
      'public/content/buildings/adventurers_guild/ref_front.png',
      'public/content/buildings/adventurers_guild/ref_side.png',
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
 * Procedural Adventurers Guild v2.
 *
 * Contract:
 * - returns a THREE.Group
 * - visible sole rests at y=0
 * - facade faces +Z
 * - roof is one closed indexed triangular prism with separate relief tiles
 * - all visible materials are MeshStandardMaterial
 * - no image plane, facade billboard, or projected photo is used
 */
export function createAdventurersGuildModel() {
  const root = new THREE.Group();
  root.name = 'AdventurersGuildV2';
  root.userData.assetId = 'img2threejs-guild-v2';
  root.userData.generator = 'img2threejs-forge-authored-v2';
  root.userData.facadeDirection = '+Z';
  root.userData.soleY = 0;
  root.userData.style = 'clean-stylized-fantasy-game-prop';

  const materials = createMaterials();
  const nodes = { root };
  const sockets = {};

  addFoundation(root, materials, nodes);
  createStoneInstances(root, materials, nodes);
  addArcade(root, materials, nodes);
  addUpperStructure(root, materials, nodes);
  addRoof(root, materials, nodes);
  addChimney(root, materials, nodes);
  addDoorBay(root, materials, nodes, sockets, -3.82, 'Left');
  addDoorBay(root, materials, nodes, sockets, -0.12, 'Center');
  addGuildSign(root, materials, nodes, sockets);
  addQuestBoard(root, materials, nodes);
  addBarrels(root, materials, nodes);

  root.traverse((object) => {
    if (object.isMesh || object.isInstancedMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  addRuntimeMetadata(root, nodes, sockets);
  return root;
}

export default createAdventurersGuildModel;
