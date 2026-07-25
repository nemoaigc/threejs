import * as THREE from 'three';

const PALETTE = Object.freeze({
  stoneDark: 0x716b61,
  stone: 0x9d988e,
  stoneLight: 0xb7b0a3,
  mortar: 0x555149,
  timberDark: 0x382217,
  timber: 0x5b3924,
  timberLight: 0x795237,
  plaster: 0xe2d5be,
  plasterShade: 0xc9b99e,
  roofDark: 0x682a20,
  roof: 0x973727,
  roofLight: 0xb24a36,
  moss: 0x556c37,
  brick: 0x7c4131,
  brickDark: 0x613529,
  signGreen: 0x1f4236,
  signEdge: 0x17342b,
  gold: 0xd6ae53,
  goldDark: 0xb48a37,
  iron: 0x343431,
  ironLight: 0x4a4842,
  paper: 0xe6d7b8,
  paperWarm: 0xcdbb96,
  paperLight: 0xf3e8d0,
  cork: 0xa77c4e,
  interior: 0x15100c,
});

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
    stoneDark: standard(PALETTE.stoneDark, 0.95),
    stone: standard(PALETTE.stone, 0.9),
    stoneLight: standard(PALETTE.stoneLight, 0.86),
    mortar: standard(PALETTE.mortar, 1),
    timberDark: standard(PALETTE.timberDark, 0.86),
    timber: standard(PALETTE.timber, 0.79),
    timberLight: standard(PALETTE.timberLight, 0.72),
    plaster: standard(PALETTE.plaster, 0.94),
    plasterShade: standard(PALETTE.plasterShade, 0.96),
    roofDark: standard(PALETTE.roofDark, 0.9),
    roof: standard(PALETTE.roof, 0.84),
    roofLight: standard(PALETTE.roofLight, 0.8),
    moss: standard(PALETTE.moss, 1),
    brick: standard(PALETTE.brick, 0.9),
    brickDark: standard(PALETTE.brickDark, 0.94),
    signGreen: standard(PALETTE.signGreen, 0.58),
    signEdge: standard(PALETTE.signEdge, 0.7),
    gold: standard(PALETTE.gold, 0.42, 0.56),
    goldDark: standard(PALETTE.goldDark, 0.5, 0.46),
    iron: standard(PALETTE.iron, 0.55, 0.72),
    ironLight: standard(PALETTE.ironLight, 0.4, 0.68),
    paper: standard(PALETTE.paper, 0.94),
    paperWarm: standard(PALETTE.paperWarm, 0.96),
    paperLight: standard(PALETTE.paperLight, 0.92),
    cork: standard(PALETTE.cork, 0.96),
    interior: standard(PALETTE.interior, 1),
    glass: standard(0x89a9a0, 0.24, 0, {
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
    }),
    ink: standard(0x4a3527, 0.88),
    redWax: standard(0x8f2f28, 0.56),
    blueWax: standard(0x315c72, 0.5),
  };
}

function mesh(geometry, material, name) {
  const result = new THREE.Mesh(geometry, material);
  result.name = name;
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function box(parent, name, size, position, material, rotation = [0, 0, 0]) {
  const result = mesh(new THREE.BoxGeometry(...size), material, name);
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function cylinder(
  parent,
  name,
  radiusTop,
  radiusBottom,
  height,
  position,
  material,
  segments = 12,
  rotation = [0, 0, 0],
) {
  const result = mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
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

function materialByIndex(materials, index) {
  return [materials.stoneDark, materials.stone, materials.stoneLight][index % 3];
}

/**
 * Closed triangular-prism roof. Ridge follows `axis`; the mesh contains both
 * slopes, both triangular gable ends, and a closed underside.
 */
function createSolidGableGeometry(length, depth, rise, axis = 'x') {
  const halfLength = length / 2;
  const halfDepth = depth / 2;
  let vertices;
  let indices;

  if (axis === 'x') {
    vertices = [
      -halfLength, 0, -halfDepth,
      halfLength, 0, -halfDepth,
      halfLength, 0, halfDepth,
      -halfLength, 0, halfDepth,
      -halfLength, rise, 0,
      halfLength, rise, 0,
    ];
    indices = [
      0, 1, 5, 0, 5, 4,
      3, 4, 5, 3, 5, 2,
      0, 4, 3,
      1, 2, 5,
      0, 3, 2, 0, 2, 1,
    ];
  } else {
    vertices = [
      -halfDepth, 0, -halfLength,
      halfDepth, 0, -halfLength,
      halfDepth, 0, halfLength,
      -halfDepth, 0, halfLength,
      0, rise, -halfLength,
      0, rise, halfLength,
    ];
    indices = [
      0, 4, 5, 0, 5, 3,
      1, 2, 5, 1, 5, 4,
      0, 1, 4,
      3, 5, 2,
      0, 3, 2, 0, 2, 1,
    ];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function addBeam2D(parent, name, start, end, thickness, depth, material, z) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  return box(
    parent,
    name,
    [length, thickness, depth],
    [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, z],
    material,
    [0, 0, Math.atan2(dy, dx)],
  );
}

function addSideBeam(parent, name, start, end, thickness, depth, material, x) {
  const dz = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dz, dy);
  return box(
    parent,
    name,
    [depth, thickness, length],
    [x, (start[1] + end[1]) / 2, (start[0] + end[0]) / 2],
    material,
    [Math.atan2(-dy, dz), 0, 0],
  );
}

function addStoneCourses(parent, materials, {
  width,
  height,
  centerX,
  baseY,
  z,
  columns,
  rows,
  namePrefix,
}) {
  const blockWidth = width / columns;
  const blockHeight = height / rows;
  const geometry = new THREE.BoxGeometry(blockWidth * 0.92, blockHeight * 0.86, 0.2);

  for (let row = 0; row < rows; row += 1) {
    const courseOffset = row % 2 ? blockWidth * 0.43 : 0;
    for (let column = -1; column < columns + 1; column += 1) {
      const x = centerX - width / 2 + blockWidth * (column + 0.5) + courseOffset;
      if (x < centerX - width / 2 - 0.04 || x > centerX + width / 2 + 0.04) continue;
      const seed = row * 47 + column * 19 + 11;
      const result = mesh(
        geometry,
        materialByIndex(materials, Math.floor(seededUnit(seed) * 3)),
        `${namePrefix}.r${row}.c${column}`,
      );
      result.position.set(
        x,
        baseY + blockHeight * (row + 0.5) + (seededUnit(seed + 1) - 0.5) * 0.035,
        z + seededUnit(seed + 2) * 0.025,
      );
      result.scale.x = 0.92 + seededUnit(seed + 3) * 0.1;
      result.scale.y = 0.93 + seededUnit(seed + 4) * 0.08;
      parent.add(result);
    }
  }
}

function addSideStoneCourses(parent, materials, {
  depth,
  height,
  x,
  baseY,
  rows,
  columns,
  namePrefix,
}) {
  const blockDepth = depth / columns;
  const blockHeight = height / rows;
  const geometry = new THREE.BoxGeometry(0.2, blockHeight * 0.86, blockDepth * 0.92);

  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 ? blockDepth * 0.4 : 0;
    for (let column = -1; column < columns + 1; column += 1) {
      const z = -depth / 2 + blockDepth * (column + 0.5) + offset;
      if (z < -depth / 2 - 0.04 || z > depth / 2 + 0.04) continue;
      const seed = row * 53 + column * 13 + 7;
      const result = mesh(
        geometry,
        materialByIndex(materials, Math.floor(seededUnit(seed) * 3)),
        `${namePrefix}.r${row}.c${column}`,
      );
      result.position.set(
        x - seededUnit(seed + 2) * 0.025,
        baseY + blockHeight * (row + 0.5),
        z,
      );
      result.scale.z = 0.93 + seededUnit(seed + 4) * 0.08;
      parent.add(result);
    }
  }
}

function addTimberFacade(parent, materials, {
  width,
  height,
  centerX,
  centerY,
  z,
  bays,
  namePrefix,
}) {
  const bayWidth = width / bays;
  box(parent, `${namePrefix}.plaster`, [width, height, 0.22], [centerX, centerY, z], materials.plaster);

  for (let index = 0; index <= bays; index += 1) {
    const x = centerX - width / 2 + bayWidth * index;
    box(
      parent,
      `${namePrefix}.post.${index}`,
      [0.24, height + 0.08, 0.24],
      [x, centerY, z + 0.15],
      index % 2 ? materials.timber : materials.timberLight,
    );
  }

  for (const ratio of [0.04, 0.52, 0.96]) {
    box(
      parent,
      `${namePrefix}.rail.${ratio}`,
      [width + 0.1, 0.22, 0.24],
      [centerX, centerY - height / 2 + ratio * height, z + 0.16],
      materials.timber,
    );
  }

  for (let bay = 0; bay < bays; bay += 1) {
    const x0 = centerX - width / 2 + bay * bayWidth + 0.08;
    const x1 = x0 + bayWidth - 0.16;
    const bottom = centerY - height / 2 + 0.3;
    const middle = centerY;
    const top = centerY + height / 2 - 0.28;
    addBeam2D(
      parent,
      `${namePrefix}.brace.lower.${bay}`,
      [x0, bottom],
      [x1, middle - 0.08],
      0.16,
      0.18,
      materials.timberDark,
      z + 0.19,
    );
    addBeam2D(
      parent,
      `${namePrefix}.brace.upper.${bay}`,
      [x1, middle + 0.08],
      [x0, top],
      0.16,
      0.18,
      materials.timberDark,
      z + 0.19,
    );
  }
}

function addTimberSide(parent, materials, {
  depth,
  height,
  x,
  centerY,
  bays,
  namePrefix,
}) {
  const bayDepth = depth / bays;
  box(parent, `${namePrefix}.plaster`, [0.22, height, depth], [x, centerY, 0], materials.plaster);

  for (let index = 0; index <= bays; index += 1) {
    const z = -depth / 2 + bayDepth * index;
    box(
      parent,
      `${namePrefix}.post.${index}`,
      [0.24, height + 0.08, 0.24],
      [x - 0.15, centerY, z],
      materials.timber,
    );
  }

  for (const ratio of [0.04, 0.52, 0.96]) {
    box(
      parent,
      `${namePrefix}.rail.${ratio}`,
      [0.24, 0.22, depth + 0.1],
      [x - 0.16, centerY - height / 2 + ratio * height, 0],
      materials.timber,
    );
  }

  for (let bay = 0; bay < bays; bay += 1) {
    const z0 = -depth / 2 + bay * bayDepth + 0.08;
    const z1 = z0 + bayDepth - 0.16;
    const bottom = centerY - height / 2 + 0.3;
    const top = centerY + height / 2 - 0.3;
    addSideBeam(
      parent,
      `${namePrefix}.brace.${bay}`,
      [z0, bottom],
      [z1, top],
      0.16,
      0.18,
      materials.timberDark,
      x - 0.19,
    );
  }
}

function addRoofTiles(parent, materials, {
  width,
  depth,
  baseY,
  rise,
  rows,
  columns,
  namePrefix,
}) {
  const angle = Math.atan2(rise, depth / 2);
  const slopeLength = Math.hypot(depth / 2, rise);
  const tileWidth = width / columns * 0.96;
  const tileDepth = slopeLength / rows * 1.08;
  const tileGeometry = new THREE.BoxGeometry(tileWidth, 0.095, tileDepth);

  for (const side of [1, -1]) {
    for (let row = 0; row < rows; row += 1) {
      const t = (row + 0.48) / rows;
      const z = side * (depth / 2) * (1 - t);
      const y = baseY + rise * t + 0.08;
      const stagger = row % 2 ? tileWidth / 2 : 0;

      for (let column = -1; column < columns + 1; column += 1) {
        const x = -width / 2 + tileWidth * (column + 0.5) + stagger;
        if (x < -width / 2 - 0.05 || x > width / 2 + 0.05) continue;
        const seed = row * 97 + column * 31 + (side > 0 ? 17 : 43);
        const tileMaterial = [materials.roofDark, materials.roof, materials.roofLight][
          Math.floor(seededUnit(seed) * 3)
        ];
        const tile = mesh(tileGeometry, tileMaterial, `${namePrefix}.${side > 0 ? 'front' : 'back'}.${row}.${column}`);
        tile.position.set(x, y, z);
        tile.rotation.x = side * angle;
        tile.rotation.z = (seededUnit(seed + 1) - 0.5) * 0.015;
        parent.add(tile);
      }
    }
  }

  cylinder(
    parent,
    `${namePrefix}.ridge`,
    0.13,
    0.13,
    width + 0.28,
    [0, baseY + rise + 0.11, 0],
    materials.roofDark,
    10,
    [0, 0, Math.PI / 2],
  );

  for (let index = 0; index < 7; index += 1) {
    const x = -width * 0.36 + (index / 6) * width * 0.72;
    const z = depth * 0.27 + (index % 2) * 0.05;
    const y = baseY + rise * (1 - Math.abs(z) / (depth / 2)) + 0.16;
    box(
      parent,
      `${namePrefix}.moss.${index}`,
      [0.34 + seededUnit(index + 90) * 0.3, 0.045, 0.1],
      [x, y, z],
      materials.moss,
      [Math.atan2(rise, depth / 2), 0, 0],
    );
  }
}

function addArcade(parent, materials, nodes) {
  const arcade = new THREE.Group();
  arcade.name = 'structural.arcade';
  parent.add(arcade);
  nodes.arcade = arcade;

  const postXs = [-5.35, -2.75, -0.2, 2.35, 5.25];
  for (let index = 0; index < postXs.length; index += 1) {
    const x = postXs[index];
    const postGroup = new THREE.Group();
    postGroup.name = `arcade.post.${index}`;
    arcade.add(postGroup);

    box(postGroup, 'stone-foot', [0.72, 0.36, 0.72], [x, 0.48, 3.18], materials.stoneDark);
    box(postGroup, 'timber-shaft', [0.5, 2.65, 0.5], [x, 1.93, 3.22], materials.timber);
    box(postGroup, 'capital-lower', [0.72, 0.22, 0.68], [x, 3.29, 3.22], materials.timberLight);
    box(postGroup, 'capital-upper', [0.88, 0.18, 0.74], [x, 3.48, 3.22], materials.timberDark);

    const peg = cylinder(
      postGroup,
      'joinery-peg',
      0.075,
      0.075,
      0.08,
      [x, 3.47, 3.63],
      materials.timberLight,
      10,
      [Math.PI / 2, 0, 0],
    );
    peg.rotation.x = Math.PI / 2;

    if (index < postXs.length - 1) {
      addBeam2D(
        postGroup,
        'knee-brace-right',
        [x + 0.06, 2.95],
        [x + 0.62, 3.5],
        0.16,
        0.28,
        materials.timberDark,
        3.3,
      );
    }
    if (index > 0) {
      addBeam2D(
        postGroup,
        'knee-brace-left',
        [x - 0.06, 2.95],
        [x - 0.62, 3.5],
        0.16,
        0.28,
        materials.timberDark,
        3.3,
      );
    }
  }

  box(arcade, 'arcade-header', [12.3, 0.46, 0.7], [0, 3.55, 3.18], materials.timberDark);
  box(arcade, 'jetty-ledge', [12.7, 0.2, 0.82], [0, 3.82, 3.22], materials.timberLight);

  for (let index = 0; index < 9; index += 1) {
    const x = -5.15 + index * 1.29;
    box(arcade, `carved-joint.${index}`, [0.35, 0.28, 0.1], [x, 3.58, 3.58], materials.timber);
    const peg = cylinder(
      arcade,
      `carved-joint-peg.${index}`,
      0.055,
      0.055,
      0.08,
      [x, 3.58, 3.66],
      materials.timberLight,
      8,
      [Math.PI / 2, 0, 0],
    );
    peg.rotation.x = Math.PI / 2;
  }
}

function addDoor(parent, materials, nodes, sockets) {
  const entrance = new THREE.Group();
  entrance.name = 'form.entrance';
  parent.add(entrance);
  nodes.entrance = entrance;

  box(entrance, 'doorway-void', [2.25, 2.85, 0.52], [1.7, 1.62, 3.18], materials.interior);
  box(entrance, 'left-jamb', [0.38, 3.0, 0.5], [0.42, 1.67, 3.48], materials.timberDark);
  box(entrance, 'right-jamb', [0.38, 3.0, 0.5], [2.98, 1.67, 3.48], materials.timberDark);
  box(entrance, 'carved-lintel', [3.0, 0.48, 0.56], [1.7, 3.12, 3.47], materials.timberLight);

  const doorPivot = new THREE.Group();
  doorPivot.name = 'pivot.door';
  doorPivot.position.set(0.62, 0.32, 3.69);
  doorPivot.rotation.y = -0.48;
  entrance.add(doorPivot);
  nodes.door = doorPivot;
  sockets.doorHinge = doorPivot;

  box(doorPivot, 'door-panel', [0.96, 2.62, 0.16], [0.48, 1.31, 0], materials.timber);
  for (const x of [0.17, 0.48, 0.79]) {
    box(doorPivot, `door-plank-groove.${x}`, [0.035, 2.5, 0.02], [x, 1.31, 0.095], materials.timberDark);
  }
  for (const y of [0.65, 1.95]) {
    box(doorPivot, `iron-strap.${y}`, [0.74, 0.12, 0.06], [0.37, y, 0.13], materials.iron);
    for (const x of [0.08, 0.6]) {
      cylinder(
        doorPivot,
        `strap-rivet.${x}.${y}`,
        0.04,
        0.04,
        0.045,
        [x, y, 0.18],
        materials.ironLight,
        8,
        [Math.PI / 2, 0, 0],
      );
    }
  }
  cylinder(doorPivot, 'door-handle', 0.07, 0.07, 0.1, [0.78, 1.32, 0.2], materials.ironLight, 10, [Math.PI / 2, 0, 0]);
}

function createSwordRelief(materials, name) {
  const sword = new THREE.Group();
  sword.name = name;

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.095, -0.38);
  bladeShape.lineTo(-0.12, 0.8);
  bladeShape.lineTo(0, 1.18);
  bladeShape.lineTo(0.12, 0.8);
  bladeShape.lineTo(0.095, -0.38);
  bladeShape.closePath();
  const blade = mesh(
    new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.018,
      bevelSegments: 1,
      steps: 1,
    }),
    materials.gold,
    `${name}.blade`,
  );
  blade.position.z = 0.01;
  sword.add(blade);

  box(sword, `${name}.guard`, [0.62, 0.12, 0.13], [0, -0.46, 0.06], materials.goldDark);
  box(sword, `${name}.grip`, [0.16, 0.44, 0.13], [0, -0.71, 0.06], materials.gold);
  for (let index = 0; index < 4; index += 1) {
    box(
      sword,
      `${name}.grip-ring.${index}`,
      [0.2, 0.035, 0.145],
      [0, -0.56 - index * 0.1, 0.06],
      materials.goldDark,
    );
  }
  const pommel = mesh(new THREE.SphereGeometry(0.13, 10, 8), materials.goldDark, `${name}.pommel`);
  pommel.position.set(0, -0.98, 0.07);
  sword.add(pommel);
  return sword;
}

function addSign(parent, materials, nodes, sockets) {
  const signRig = new THREE.Group();
  signRig.name = 'structural.sign-rig';
  parent.add(signRig);
  nodes.signRig = signRig;

  box(signRig, 'wall-bracket', [0.5, 1.0, 0.52], [0.6, 7.98, 3.35], materials.timberDark);
  box(signRig, 'projecting-arm', [5.2, 0.34, 0.4], [3.05, 8.24, 3.65], materials.timber);
  box(signRig, 'arm-end-cap', [0.25, 0.5, 0.5], [5.63, 8.24, 3.65], materials.timberLight);
  addBeam2D(signRig, 'arm-brace', [0.75, 7.55], [2.05, 8.2], 0.22, 0.34, materials.timberDark, 3.61);

  const signPivot = new THREE.Group();
  signPivot.name = 'pivot.hanging-sign';
  signPivot.position.set(3.1, 7.64, 4.12);
  signRig.add(signPivot);
  nodes.hangingSign = signPivot;
  sockets.signSwing = signPivot;

  const linkGeometry = new THREE.TorusGeometry(0.095, 0.025, 6, 10);
  for (const chainX of [-1.65, 1.65]) {
    for (let index = 0; index < 6; index += 1) {
      const link = mesh(linkGeometry, materials.iron, `chain.${chainX}.${index}`);
      link.position.set(chainX, 0.27 - index * 0.17, 0);
      link.rotation.y = index % 2 ? Math.PI / 2 : 0;
      signPivot.add(link);
    }
  }

  box(signPivot, 'sign-outer-board', [4.65, 2.8, 0.26], [0, -1.95, 0], materials.timberDark);
  box(signPivot, 'sign-green-face', [4.32, 2.48, 0.12], [0, -1.95, 0.19], materials.signGreen);

  box(signPivot, 'frame-top', [4.15, 0.1, 0.08], [0, -0.82, 0.3], materials.gold);
  box(signPivot, 'frame-bottom', [4.15, 0.1, 0.08], [0, -3.08, 0.3], materials.goldDark);
  box(signPivot, 'frame-left', [0.1, 2.36, 0.08], [-2.02, -1.95, 0.3], materials.goldDark);
  box(signPivot, 'frame-right', [0.1, 2.36, 0.08], [2.02, -1.95, 0.3], materials.gold);

  const swordA = createSwordRelief(materials, 'sword-left');
  swordA.position.set(-0.03, -1.86, 0.36);
  swordA.rotation.z = -0.7;
  signPivot.add(swordA);
  const swordB = createSwordRelief(materials, 'sword-right');
  swordB.position.set(0.03, -1.86, 0.48);
  swordB.rotation.z = 0.7;
  signPivot.add(swordB);
}

function addQuestBoard(parent, materials, nodes) {
  const board = new THREE.Group();
  board.name = 'form.quest-board';
  board.position.set(-2.05, 0, 4.25);
  board.rotation.y = 0.03;
  parent.add(board);
  nodes.questBoard = board;

  box(board, 'left-leg', [0.18, 2.2, 0.2], [-1.05, 1.1, 0], materials.timber);
  box(board, 'right-leg', [0.18, 2.2, 0.2], [1.05, 1.1, 0], materials.timber);
  box(board, 'left-foot', [0.65, 0.18, 0.5], [-1.05, 0.09, 0], materials.timberDark);
  box(board, 'right-foot', [0.65, 0.18, 0.5], [1.05, 0.09, 0], materials.timberDark);
  box(board, 'outer-frame', [2.55, 1.68, 0.2], [0, 1.54, 0], materials.timberDark);
  box(board, 'cork-face', [2.25, 1.38, 0.09], [0, 1.54, 0.15], materials.cork);

  const papers = [
    [-0.78, 1.82, 0.5, 0.58, -0.08, materials.paperLight],
    [-0.25, 1.74, 0.47, 0.5, 0.06, materials.paper],
    [0.32, 1.88, 0.55, 0.6, -0.05, materials.paperWarm],
    [0.84, 1.71, 0.43, 0.52, 0.09, materials.paperLight],
    [-0.62, 1.25, 0.56, 0.47, 0.05, materials.paperWarm],
    [0.0, 1.24, 0.5, 0.55, -0.07, materials.paperLight],
    [0.62, 1.21, 0.55, 0.44, 0.04, materials.paper],
  ];

  for (let index = 0; index < papers.length; index += 1) {
    const [x, y, width, height, rotation, paperMaterial] = papers[index];
    box(board, `notice.${index}`, [width, height, 0.025], [x, y, 0.215 + index * 0.002], paperMaterial, [0, 0, rotation]);
    box(board, `notice-line.${index}.a`, [width * 0.55, 0.025, 0.015], [x, y + height * 0.12, 0.238 + index * 0.002], materials.ink, [0, 0, rotation]);
    box(board, `notice-line.${index}.b`, [width * 0.42, 0.018, 0.015], [x, y - height * 0.03, 0.239 + index * 0.002], materials.ink, [0, 0, rotation]);
    const pin = mesh(new THREE.SphereGeometry(0.045, 8, 6), index % 3 ? materials.redWax : materials.blueWax, `pin.${index}`);
    pin.position.set(x, y + height * 0.38, 0.26 + index * 0.002);
    board.add(pin);
  }

  const scrollMaterial = materials.paperLight;
  for (let index = 0; index < 3; index += 1) {
    cylinder(
      board,
      `scroll.${index}`,
      0.055,
      0.055,
      0.58 + index * 0.08,
      [0.55 + index * 0.15, 0.45, 0.2 + index * 0.05],
      scrollMaterial,
      10,
      [0, 0, -0.12 + index * 0.15],
    );
  }
  box(board, 'scroll-crate', [0.75, 0.42, 0.55], [0.72, 0.21, 0.12], materials.timberLight);
  box(board, 'crate-top-slat', [0.79, 0.06, 0.59], [0.72, 0.4, 0.12], materials.timberDark);
}

function addBarrel(parent, materials, name, position, scale = 1, rotationZ = 0) {
  const barrel = new THREE.Group();
  barrel.name = name;
  barrel.position.set(...position);
  barrel.rotation.z = rotationZ;
  barrel.scale.setScalar(scale);
  parent.add(barrel);

  const profile = [
    new THREE.Vector2(0.31, 0),
    new THREE.Vector2(0.35, 0.12),
    new THREE.Vector2(0.39, 0.42),
    new THREE.Vector2(0.4, 0.68),
    new THREE.Vector2(0.36, 0.94),
    new THREE.Vector2(0.31, 1.04),
  ];
  const body = mesh(new THREE.LatheGeometry(profile, 14), materials.timberLight, `${name}.body`);
  barrel.add(body);

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const stave = box(
      barrel,
      `${name}.stave.${index}`,
      [0.055, 0.92, 0.04],
      [Math.cos(angle) * 0.382, 0.52, Math.sin(angle) * 0.382],
      index % 3 ? materials.timber : materials.timberLight,
      [0, -angle, 0],
    );
    stave.rotation.y = -angle;
  }

  for (const y of [0.16, 0.5, 0.88]) {
    const hoop = mesh(new THREE.TorusGeometry(0.385, 0.035, 7, 18), materials.iron, `${name}.hoop.${y}`);
    hoop.position.y = y;
    hoop.rotation.x = Math.PI / 2;
    barrel.add(hoop);
  }

  const top = cylinder(barrel, `${name}.top`, 0.31, 0.31, 0.055, [0, 1.035, 0], materials.timberDark, 14);
  top.position.y = 1.035;
  return barrel;
}

function addBarrels(parent, materials, nodes) {
  const barrels = new THREE.Group();
  barrels.name = 'form.barrel-cluster';
  parent.add(barrels);
  nodes.barrelCluster = barrels;
  addBarrel(barrels, materials, 'barrel.large', [5.2, 0, 4.04], 1.15);
  addBarrel(barrels, materials, 'barrel.middle', [5.92, 0, 4.22], 0.93);
  addBarrel(barrels, materials, 'barrel.small', [4.63, 0, 4.48], 0.79);

  const horizontal = addBarrel(barrels, materials, 'barrel.horizontal', [5.4, 1.78, 3.62], 0.78, Math.PI / 2);
  horizontal.rotation.x = Math.PI / 2;
  horizontal.rotation.z = Math.PI / 2;
}

function addChimney(parent, materials, nodes) {
  const chimney = new THREE.Group();
  chimney.name = 'form.chimney';
  parent.add(chimney);
  nodes.chimney = chimney;

  const courseHeight = 0.27;
  for (let row = 0; row < 9; row += 1) {
    const y = 7.9 + row * courseHeight;
    const offset = row % 2 ? 0.18 : 0;
    for (let column = -1; column <= 1; column += 1) {
      const x = -1.8 + column * 0.31 + offset;
      if (x > -1.25) continue;
      box(
        chimney,
        `brick.${row}.${column}`,
        [0.34, 0.24, 0.76],
        [x, y, -0.58],
        (row + column) % 3 ? materials.brick : materials.brickDark,
      );
    }
  }
  box(chimney, 'chimney-cap-lower', [1.05, 0.24, 1.0], [-1.64, 10.35, -0.58], materials.brickDark);
  box(chimney, 'chimney-cap-upper', [1.18, 0.18, 1.1], [-1.64, 10.54, -0.58], materials.brick);
}

function addWindows(parent, materials) {
  for (const x of [-3.5, 4.5]) {
    const windowGroup = new THREE.Group();
    windowGroup.name = `structural.window.${x}`;
    parent.add(windowGroup);
    box(windowGroup, 'window-recess', [1.2, 1.45, 0.16], [x, 5.45, 3.44], materials.timberDark);
    box(windowGroup, 'glass', [0.92, 1.18, 0.05], [x, 5.45, 3.55], materials.glass);
    box(windowGroup, 'vertical-mullion', [0.08, 1.12, 0.08], [x, 5.45, 3.61], materials.timber);
    box(windowGroup, 'horizontal-mullion', [0.86, 0.08, 0.08], [x, 5.45, 3.61], materials.timber);
  }
}

function buildBlockoutPass(root, materials, nodes) {
  const group = new THREE.Group();
  group.name = 'pass.blockout';
  root.add(group);
  nodes.blockout = group;

  box(group, 'stone-plinth', [12.8, 0.36, 7.0], [0, 0.18, 0], materials.stoneDark);
  box(group, 'ground-storey-core', [12.0, 3.35, 6.4], [0, 1.98, 0], materials.mortar);
  box(group, 'upper-storey-core', [12.3, 3.95, 6.68], [0, 5.72, 0], materials.plasterShade);

  const roof = mesh(createSolidGableGeometry(13.0, 7.55, 3.05, 'x'), materials.roofDark, 'roof.main-solid-prism');
  roof.position.set(0, 7.62, 0);
  group.add(roof);
  nodes.mainRoof = roof;

  const frontGable = mesh(
    createSolidGableGeometry(3.9, 4.7, 1.9, 'z'),
    materials.roofDark,
    'roof.front-gable-solid-prism',
  );
  frontGable.position.set(2.25, 7.58, 1.52);
  group.add(frontGable);
  nodes.frontGable = frontGable;
}

function buildStructuralPass(root, materials, nodes) {
  const group = new THREE.Group();
  group.name = 'pass.structural';
  root.add(group);
  nodes.structural = group;

  addStoneCourses(group, materials, {
    width: 11.8,
    height: 3.0,
    centerX: 0,
    baseY: 0.38,
    z: 3.28,
    columns: 11,
    rows: 6,
    namePrefix: 'masonry.front',
  });
  addSideStoneCourses(group, materials, {
    depth: 6.2,
    height: 3.0,
    x: -6.08,
    baseY: 0.38,
    rows: 6,
    columns: 7,
    namePrefix: 'masonry.left',
  });

  addArcade(group, materials, nodes);
  addTimberFacade(group, materials, {
    width: 12.08,
    height: 3.78,
    centerX: 0,
    centerY: 5.72,
    z: 3.45,
    bays: 5,
    namePrefix: 'half-timber.front',
  });
  addTimberSide(group, materials, {
    depth: 6.4,
    height: 3.78,
    x: -6.19,
    centerY: 5.72,
    bays: 4,
    namePrefix: 'half-timber.left',
  });
  addWindows(group, materials);
}

function buildFormRefinementPass(root, materials, nodes, sockets) {
  const group = new THREE.Group();
  group.name = 'pass.form-refinement';
  root.add(group);
  nodes.formRefinement = group;

  addRoofTiles(group, materials, {
    width: 13.15,
    depth: 7.7,
    baseY: 7.62,
    rise: 3.08,
    rows: 11,
    columns: 18,
    namePrefix: 'roof-tile',
  });
  addChimney(group, materials, nodes);
  addDoor(group, materials, nodes, sockets);
  addSign(group, materials, nodes, sockets);
  addQuestBoard(group, materials, nodes);
  addBarrels(group, materials, nodes);

  box(group, 'front-gable-plaster', [3.36, 1.45, 0.22], [2.25, 8.2, 3.75], materials.plaster);
  box(group, 'front-gable-post', [0.22, 1.65, 0.24], [2.25, 8.23, 3.88], materials.timber);
  addBeam2D(group, 'front-gable-brace-left', [0.72, 7.72], [2.25, 9.05], 0.17, 0.2, materials.timberDark, 3.89);
  addBeam2D(group, 'front-gable-brace-right', [3.78, 7.72], [2.25, 9.05], 0.17, 0.2, materials.timberDark, 3.89);

  box(group, 'entry-crate', [0.68, 0.45, 0.62], [0.55, 0.23, 4.05], materials.timberLight);
  for (let index = 0; index < 3; index += 1) {
    cylinder(
      group,
      `entry-scroll.${index}`,
      0.055,
      0.055,
      0.48 + index * 0.08,
      [0.35 + index * 0.14, 0.68, 4.1],
      index % 2 ? materials.paper : materials.paperLight,
      10,
      [0, 0, -0.18 + index * 0.17],
    );
  }
}

function buildMaterialPass(root, materials, nodes) {
  const group = new THREE.Group();
  group.name = 'pass.material';
  root.add(group);
  nodes.material = group;

  for (let index = 0; index < 13; index += 1) {
    const x = -5.5 + index * 0.9;
    box(
      group,
      `jetty-grain.${index}`,
      [0.54, 0.035, 0.04],
      [x, 3.7 + (index % 2) * 0.06, 3.63],
      index % 3 ? materials.timberLight : materials.timberDark,
      [0, 0, (seededUnit(index + 200) - 0.5) * 0.12],
    );
  }

  for (let index = 0; index < 8; index += 1) {
    const x = -5.25 + index * 1.45;
    const y = 1.1 + (index % 3) * 0.58;
    box(
      group,
      `plaster-hairline.${index}`,
      [0.025, 0.42 + seededUnit(index + 300) * 0.4, 0.018],
      [x, y + 4.05, 3.585],
      materials.plasterShade,
      [0, 0, (seededUnit(index + 320) - 0.5) * 0.6],
    );
  }
}

function annotateRuntime(root, nodes, sockets) {
  const colliders = {
    building: {
      type: 'box',
      center: [0, 4.05, 0],
      size: [12.8, 8.1, 7.0],
    },
    sign: {
      type: 'box',
      center: [3.1, 5.69, 4.12],
      size: [4.65, 2.8, 0.4],
      trigger: true,
    },
  };

  root.userData.sculptRuntime = {
    coordinateFrame: {
      front: '+Z',
      up: '+Y',
      soleY: 0,
    },
    nodes,
    sockets,
    colliders,
    destructionGroups: {
      masonry: [nodes.blockout, nodes.structural],
      roof: [nodes.mainRoof, nodes.frontGable],
      facadeProps: [nodes.questBoard, nodes.barrelCluster],
    },
    animation: {
      door: { node: nodes.door, axis: [0, 1, 0], range: [-0.95, 0.05] },
      hangingSign: { node: nodes.hangingSign, axis: [0, 0, 1], range: [-0.08, 0.08] },
    },
    buildPasses: ['blockout', 'structural-pass', 'form-refinement', 'material-pass'],
    source: 'public/content/buildings/adventurers_guild/ref_main.png',
    approximation: 'single-view stylized procedural reconstruction',
  };
}

/**
 * Code-only Adventurers Guild reconstruction.
 *
 * Coordinate contract:
 * - sole rests at y=0
 * - facade faces +Z
 * - ridge follows X
 * - no image planes, projected photos, or dual-slab roof geometry
 */
export function createAdventurersGuildModel() {
  const root = new THREE.Group();
  root.name = 'AdventurersGuild';
  root.userData.assetId = 'img2threejs-guild';
  root.userData.generator = 'img2threejs-forge-authored';
  root.userData.facadeDirection = '+Z';
  root.userData.soleY = 0;

  const materials = createMaterials();
  const nodes = { root };
  const sockets = {};

  buildBlockoutPass(root, materials, nodes);
  buildStructuralPass(root, materials, nodes);
  buildFormRefinementPass(root, materials, nodes, sockets);
  buildMaterialPass(root, materials, nodes);

  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  annotateRuntime(root, nodes, sockets);
  return root;
}

export default createAdventurersGuildModel;
