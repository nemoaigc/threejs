import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  beamBetween,
  bolt,
  chamferedBox,
  finishHeroProp,
  makePropRoot,
  registerNode,
  rotateMaterialMaps,
  surfaceMaterial,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-quest-board-v1-pbr';

function roofTileGeometry(length, width, thickness = 0.03, crown = 0.055, segments = 8) {
  const positions = [];
  const indices = [];
  for (const x of [-length * 0.5, length * 0.5]) {
    for (let segment = 0; segment <= segments; segment += 1) {
      const t = segment / segments;
      positions.push(
        x,
        thickness + Math.sin(t * Math.PI) * crown,
        THREE.MathUtils.lerp(-width * 0.5, width * 0.5, t),
      );
    }
  }
  const stride = segments + 1;
  for (let segment = 0; segment < segments; segment += 1) {
    const a = segment;
    const b = segment + 1;
    const c = stride + segment;
    const d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const base = positions.length / 3;
  positions.push(
    -length * 0.5, 0, -width * 0.5,
    length * 0.5, 0, -width * 0.5,
    -length * 0.5, 0, width * 0.5,
    length * 0.5, 0, width * 0.5,
  );
  indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  for (const edge of [0, segments]) {
    const topA = edge;
    const topB = stride + edge;
    const bottomA = base + (edge === 0 ? 0 : 2);
    const bottomB = base + (edge === 0 ? 1 : 3);
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function parchmentGeometry(width, height, curl = 0.05, seed = 0) {
  const segmentsX = 8;
  const segmentsY = 10;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let iy = 0; iy <= segmentsY; iy += 1) {
    const v = iy / segmentsY;
    for (let ix = 0; ix <= segmentsX; ix += 1) {
      const u = ix / segmentsX;
      const edgeX = Math.pow(Math.abs(u - 0.5) * 2, 4);
      const edgeY = Math.pow(Math.abs(v - 0.5) * 2, 5);
      const wave = Math.sin((u * 2.4 + v * 1.7 + seed) * Math.PI) * 0.008;
      positions.push(
        (u - 0.5) * width,
        (v - 0.5) * height,
        edgeX * curl + edgeY * curl * 0.6 + wave,
      );
      uvs.push(u, v);
    }
  }
  const row = segmentsX + 1;
  for (let iy = 0; iy < segmentsY; iy += 1) {
    for (let ix = 0; ix < segmentsX; ix += 1) {
      const a = iy * row + ix;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function shieldGeometry(width = 0.42, height = 0.5, depth = 0.065) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, height * 0.32);
  shape.quadraticCurveTo(0, height * 0.58, width * 0.5, height * 0.32);
  shape.lineTo(width * 0.43, -height * 0.18);
  shape.quadraticCurveTo(width * 0.22, -height * 0.42, 0, -height * 0.55);
  shape.quadraticCurveTo(-width * 0.22, -height * 0.42, -width * 0.43, -height * 0.18);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.018,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function buildStoneFeet(root, materials) {
  const masonry = registerNode(root, 'quest-board.stone-feet', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [
        { size: [0.58, 0.52, 0.58], offset: [-0.92, 0.26, 0] },
        { size: [0.58, 0.52, 0.58], offset: [0.92, 0.26, 0] },
      ],
    },
    destructionGroup: 'masonry',
  });
  root.add(masonry);
  for (const side of [-1, 1]) {
    const x = side * 0.92;
    const blocks = [
      [-0.14, 0.12, -0.12, 0.34, 0.24, 0.32],
      [0.15, 0.12, -0.08, 0.31, 0.24, 0.34],
      [-0.12, 0.12, 0.17, 0.35, 0.24, 0.31],
      [0.16, 0.12, 0.16, 0.3, 0.24, 0.3],
      [0, 0.36, -0.08, 0.48, 0.23, 0.36],
      [0, 0.36, 0.18, 0.44, 0.23, 0.28],
    ];
    blocks.forEach(([dx, y, z, w, h, d], index) => {
      const block = chamferedBox(
        w,
        h,
        d,
        materials.stone[(index + (side > 0 ? 1 : 0)) % materials.stone.length],
        0.055,
      );
      block.name = `stone-foot.${side}.${index}`;
      block.position.set(x + dx, y, z);
      block.rotation.y = ((index % 3) - 1) * 0.035;
      masonry.add(block);
    });
  }
}

function addFrameBracket(parent, materials, x, y, z, side) {
  const vertical = chamferedBox(0.12, 0.35, 0.035, materials.iron, 0.018);
  vertical.name = 'board.corner-bracket.vertical';
  vertical.position.set(x, y, z);
  parent.add(vertical);
  const horizontal = chamferedBox(0.34, 0.12, 0.035, materials.iron, 0.018);
  horizontal.name = 'board.corner-bracket.horizontal';
  horizontal.position.set(x - side * 0.11, y + (y > 1.6 ? 0.115 : -0.115), z);
  parent.add(horizontal);
  for (const [dx, dy] of [[0, -0.1], [0, 0.1], [-side * 0.16, y > 1.6 ? 0.115 : -0.115]]) {
    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 7, 5),
      materials.ironEdge,
    );
    rivet.name = 'board.corner-bracket.rivet';
    rivet.position.set(x + dx, y + dy, z + 0.028);
    parent.add(rivet);
  }
}

function buildTimberBoard(root, materials) {
  const board = registerNode(root, 'quest-board.frame', new THREE.Group(), {
    collider: { type: 'box', size: [2.35, 1.65, 0.22], offset: [0, 1.72, 0] },
    destructionGroup: 'timber-frame',
  });
  root.add(board);

  for (const side of [-1, 1]) {
    const post = chamferedBox(0.22, 2.5, 0.24, materials.oak[side > 0 ? 1 : 0], 0.045);
    post.name = `frame.post.${side < 0 ? 'left' : 'right'}`;
    post.position.set(side * 0.92, 1.7, 0);
    board.add(post);
    const tenon = chamferedBox(0.29, 0.16, 0.3, materials.oakCross[2], 0.035);
    tenon.name = `frame.post-collar.${side}`;
    tenon.position.set(side * 0.92, 0.58, 0);
    board.add(tenon);
  }

  const panel = chamferedBox(1.86, 1.26, 0.105, materials.cork, 0.035);
  panel.name = 'board.cork-panel';
  panel.position.set(0, 1.72, 0.035);
  board.add(panel);
  const rearPanel = chamferedBox(2.0, 1.38, 0.09, materials.oakCross[3], 0.035);
  rearPanel.name = 'board.rear-panel';
  rearPanel.position.set(0, 1.72, -0.075);
  board.add(rearPanel);

  const rails = [
    ['top', 2.16, 0.19, 0.17, 0, 2.45],
    ['bottom', 2.16, 0.19, 0.17, 0, 0.99],
    ['left', 0.19, 1.62, 0.17, -1.02, 1.72],
    ['right', 0.19, 1.62, 0.17, 1.02, 1.72],
  ];
  for (let index = 0; index < rails.length; index += 1) {
    const [label, w, h, d, x, y] = rails[index];
    const rail = chamferedBox(w, h, d, materials.oak[index % 4], 0.038);
    rail.name = `board.frame-rail.${label}`;
    rail.position.set(x, y, 0.08);
    board.add(rail);
  }

  for (const side of [-1, 1]) {
    for (const y of [1.08, 2.36]) {
      addFrameBracket(board, materials, side * 0.94, y, 0.185, side);
    }
  }
  addSocket(root, board, 'socket.notice-panel', new THREE.Vector3(0, 1.72, 0.145));
  addSocket(root, board, 'socket.guild-crest', new THREE.Vector3(0, 2.57, 0.18));
}

function addPaper(board, materials, {
  name,
  x,
  y,
  width,
  height,
  rotation,
  material,
  seal = false,
  lines = 4,
} = {}) {
  const paperGroup = new THREE.Group();
  paperGroup.name = name;
  paperGroup.position.set(x, y, 0.185);
  paperGroup.rotation.z = rotation;
  board.add(paperGroup);

  const paper = new THREE.Mesh(
    parchmentGeometry(width, height, 0.045, x * 3 + y),
    material,
  );
  paper.name = `${name}.sheet`;
  paper.material.side = THREE.DoubleSide;
  paperGroup.add(paper);

  for (let index = 0; index < lines; index += 1) {
    const lineWidth = width * (0.45 + ((index * 7 + lines) % 5) * 0.08);
    const line = chamferedBox(lineWidth, 0.009, 0.008, materials.ink, 0.003);
    line.name = `${name}.ink-line.${index}`;
    line.position.set(
      -width * 0.16 + (index % 2) * width * 0.06,
      height * 0.2 - index * height * 0.13,
      0.05,
    );
    paperGroup.add(line);
  }

  const pin = new THREE.Mesh(
    new THREE.SphereGeometry(0.024, 8, 6),
    materials.ironEdge,
  );
  pin.name = `${name}.pin`;
  pin.position.set(0, height * 0.38, 0.072);
  paperGroup.add(pin);

  if (seal) {
    const wax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.07, 0.022, 18),
      materials.wax,
    );
    wax.name = `${name}.wax-seal`;
    wax.rotation.x = Math.PI * 0.5;
    wax.position.set(width * 0.22, -height * 0.28, 0.07);
    paperGroup.add(wax);
    const imprint = new THREE.Mesh(
      new THREE.TorusGeometry(0.031, 0.007, 5, 14),
      materials.waxDark,
    );
    imprint.name = `${name}.wax-imprint`;
    imprint.position.set(width * 0.22, -height * 0.28, 0.085);
    paperGroup.add(imprint);
  }
}

function buildNotices(root, materials) {
  const notices = registerNode(root, 'quest-board.notices', new THREE.Group(), {
    destructionGroup: 'notices',
  });
  root.add(notices);
  const specs = [
    [-0.56, 2.05, 0.48, 0.62, -0.035, 0, true, 5],
    [0.02, 2.08, 0.38, 0.52, 0.025, 1, false, 4],
    [0.56, 2.02, 0.46, 0.6, 0.055, 0, true, 5],
    [-0.58, 1.43, 0.38, 0.34, 0.045, 2, false, 3],
    [-0.1, 1.5, 0.45, 0.4, -0.055, 1, true, 3],
    [0.45, 1.45, 0.34, 0.42, 0.03, 2, false, 4],
    [-0.35, 1.12, 0.46, 0.25, -0.02, 0, false, 2],
    [0.3, 1.13, 0.52, 0.28, 0.03, 1, false, 2],
  ];
  specs.forEach(([x, y, width, height, rotation, materialIndex, seal, lines], index) => {
    addPaper(notices, materials, {
      name: `notice.${index}`,
      x,
      y,
      width,
      height,
      rotation,
      material: materials.parchment[materialIndex],
      seal,
      lines,
    });
  });
  addSocket(root, notices, 'socket.notice-new', new THREE.Vector3(0.72, 1.28, 0.2));
}

function buildCanopy(root, materials) {
  const roof = registerNode(root, 'quest-board.canopy', new THREE.Group(), {
    collider: { type: 'box', size: [2.65, 0.58, 1.1], offset: [0, 2.95, 0] },
    destructionGroup: 'roof',
  });
  root.add(roof);
  const slope = 0.45;
  for (const side of [-1, 1]) {
    const shell = chamferedBox(2.58, 0.1, 0.7, materials.clay[2], 0.035);
    shell.name = `canopy.shell.${side}`;
    shell.position.set(0, 2.89, side * 0.28);
    shell.rotation.x = side * slope;
    roof.add(shell);
  }

  const columns = 9;
  const rows = 3;
  const tileGeometry = roofTileGeometry(0.34, 0.36);
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tile = new THREE.Mesh(
          tileGeometry,
          materials.clay[(row + column + (side > 0 ? 1 : 0)) % materials.clay.length],
        );
        tile.name = `canopy.tile.${side}.${row}.${column}`;
        tile.position.set(
          -1.2 + column * 0.3,
          3.08 - row * 0.14,
          side * (0.1 + row * 0.25),
        );
        tile.rotation.x = side * slope;
        roof.add(tile);
      }
    }
  }
  for (let index = 0; index < 8; index += 1) {
    const ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.36, 10, 1, false, 0, Math.PI),
      materials.clay[(index + 1) % materials.clay.length],
    );
    ridge.name = `canopy.ridge-cap.${index}`;
    ridge.rotation.z = Math.PI * 0.5;
    ridge.position.set(-1.08 + index * 0.31, 3.14, 0);
    roof.add(ridge);
  }
  for (const side of [-1, 1]) {
    const brace = beamBetween(
      new THREE.Vector3(side * 0.92, 2.52, 0),
      new THREE.Vector3(side * 1.16, 2.84, 0),
      0.075,
      materials.oak[2],
      8,
    );
    brace.name = `canopy.knee-brace.${side}`;
    roof.add(brace);
  }
  addSocket(root, roof, 'socket.canopy', new THREE.Vector3(0, 3.05, 0));
}

function buildCrest(root, materials) {
  const crest = registerNode(root, 'quest-board.guild-crest', new THREE.Group(), {
    destructionGroup: 'signage',
  });
  root.add(crest);
  crest.position.set(0, 2.64, 0.27);

  const shieldBack = new THREE.Mesh(shieldGeometry(0.48, 0.52, 0.08), materials.ironEdge);
  shieldBack.name = 'crest.iron-shield';
  crest.add(shieldBack);
  const shieldFace = new THREE.Mesh(shieldGeometry(0.39, 0.43, 0.04), materials.guildGreen);
  shieldFace.name = 'crest.green-face';
  shieldFace.position.z = 0.065;
  crest.add(shieldFace);

  for (const side of [-1, 1]) {
    const blade = beamBetween(
      new THREE.Vector3(side * -0.11, -0.15, 0.105),
      new THREE.Vector3(side * 0.12, 0.16, 0.105),
      0.018,
      materials.ironBright,
      6,
    );
    blade.name = `crest.crossed-blade.${side}`;
    crest.add(blade);
    const guard = chamferedBox(0.14, 0.025, 0.025, materials.brass, 0.008);
    guard.name = `crest.blade-guard.${side}`;
    guard.position.set(side * -0.08, -0.12, 0.105);
    guard.rotation.z = side * -0.65;
    crest.add(guard);
  }
}

function buildSideDetails(root, materials) {
  const details = registerNode(root, 'quest-board.side-details', new THREE.Group(), {
    destructionGroup: 'attachments',
  });
  root.add(details);
  for (const side of [-1, 1]) {
    const x = side * 1.12;
    const hook = tubeFromPoints([
      new THREE.Vector3(x, 1.92, 0.08),
      new THREE.Vector3(x + side * 0.16, 1.92, 0.08),
      new THREE.Vector3(x + side * 0.22, 1.82, 0.08),
      new THREE.Vector3(x + side * 0.18, 1.72, 0.08),
    ], 0.028, materials.iron, {
      tubularSegments: 16,
      radialSegments: 7,
    });
    hook.name = `board.side-hook.${side}`;
    details.add(hook);
  }

  for (let loopIndex = 0; loopIndex < 3; loopIndex += 1) {
    const points = [];
    for (let index = 0; index <= 24; index += 1) {
      const angle = index * Math.PI * 2 / 24;
      points.push(new THREE.Vector3(
        -1.2 + Math.cos(angle) * (0.13 + loopIndex * 0.022),
        1.46 + Math.sin(angle) * (0.28 - loopIndex * 0.018),
        0.12 + loopIndex * 0.018,
      ));
    }
    const loop = tubeFromPoints(points, 0.018, materials.rope, {
      tubularSegments: 28,
      radialSegments: 6,
      closed: true,
    });
    loop.name = `board.rope-loop.${loopIndex}`;
    details.add(loop);
  }

  const scroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.42, 14),
    materials.parchment[1],
  );
  scroll.name = 'board.rolled-notice';
  scroll.position.set(-1.19, 1.25, 0.13);
  details.add(scroll);
  for (const y of [1.09, 1.41]) {
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.012, 6, 16),
      materials.rope,
    );
    tie.name = 'board.scroll-tie';
    tie.rotation.x = Math.PI * 0.5;
    tie.position.set(-1.19, y, 0.13);
    details.add(tie);
  }
  addSocket(root, details, 'socket.side-hook-left', new THREE.Vector3(-1.32, 1.78, 0.08));
  addSocket(root, details, 'socket.side-hook-right', new THREE.Vector3(1.32, 1.78, 0.08));
}

export function createQuestBoardModel() {
  const root = makePropRoot('prop.quest-board', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `quest-board-oak-${index}` }),
    {
      offset: [index * 0.181, index * 0.149],
      repeatScale: [0.8 + index * 0.04, 0.9 + (index % 2) * 0.06],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => rotateMaterialMaps(material, Math.PI * 0.5)),
    stone: PROP_PALETTE.limestone.map((color, index) => surfaceMaterial('stone', color, {
      name: `quest-board-stone-${index}`,
    })),
    clay: PROP_PALETTE.terracotta.map((color, index) => surfaceMaterial('clay', color, {
      name: `quest-board-clay-${index}`,
    })),
    cork: surfaceMaterial('cork', 0x73523a, { name: 'quest-board-cork' }),
    parchment: [
      surfaceMaterial('parchment', 0xd8b980, { name: 'parchment-cream', side: THREE.DoubleSide }),
      surfaceMaterial('parchment', 0xb8925d, { name: 'parchment-aged', side: THREE.DoubleSide }),
      surfaceMaterial('parchment', 0xe3c997, { name: 'parchment-light', side: THREE.DoubleSide }),
    ],
    iron: surfaceMaterial('forged-iron', 0x2e2b29, { name: 'quest-board-forged-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5c544b, { name: 'quest-board-worn-iron' }),
    ironBright: surfaceMaterial('worn-iron', 0x77716a, { name: 'quest-board-crest-steel' }),
    brass: surfaceMaterial('brass', 0x826037, { name: 'quest-board-brass' }),
    rope: surfaceMaterial('rope', 0x927043, { name: 'quest-board-rope' }),
    wax: surfaceMaterial('wax', 0x7e211d, { name: 'quest-board-sealing-wax', clearcoat: 0.12 }),
    waxDark: surfaceMaterial('wax', 0x46100f, { name: 'quest-board-wax-imprint' }),
    guildGreen: surfaceMaterial('generic', 0x294b39, {
      name: 'quest-board-guild-green',
      roughness: 0.58,
      clearcoat: 0.08,
    }),
    ink: new THREE.MeshBasicMaterial({ name: 'quest-board-ink', color: 0x4b3425 }),
  };

  buildStoneFeet(root, materials);
  buildTimberBoard(root, materials);
  buildNotices(root, materials);
  buildCanopy(root, materials);
  buildCrest(root, materials);
  buildSideDetails(root, materials);

  root.userData.materialFamilies = [
    'limestone',
    'aged-oak',
    'terracotta',
    'cork',
    'parchment',
    'forged-iron',
    'rope',
    'wax',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/quest_board/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createQuestBoardModel;
