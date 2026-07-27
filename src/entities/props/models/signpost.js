import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  extrudedSilhouette,
  finishHeroProp,
  makePropRoot,
  registerNode,
  surfaceMaterial,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-signpost-v1-pbr';

function addStoneBase(parent, materials) {
  const lowerPositions = [
    [-0.2, -0.17, 0],
    [0.2, -0.17, 1],
    [-0.2, 0.17, 2],
    [0.2, 0.17, 0],
  ];
  for (const [x, z, variant] of lowerPositions) {
    const block = chamferedBox(0.41, 0.2, 0.35, materials.stone[variant], 0.06);
    block.name = 'signpost.base.lower-block';
    block.position.set(x, 0.1, z);
    block.rotation.y = (x + z) * 0.04;
    parent.add(block);
  }
  const upper = chamferedBox(0.54, 0.24, 0.48, materials.stone[1], 0.065);
  upper.name = 'signpost.base.upper-plinth';
  upper.position.set(0, 0.32, 0);
  upper.rotation.y = -0.02;
  parent.add(upper);
}

function makeArrowBoard(length, height, material, jag = 0) {
  const halfH = height * 0.5;
  return extrudedSilhouette([
    [0, -halfH + 0.018],
    [length - 0.21, -halfH],
    [length - 0.21 + jag, -height * 0.34],
    [length, 0],
    [length - 0.21, height * 0.36],
    [length - 0.23 - jag, halfH],
    [0.04, halfH - 0.012],
  ], 0.105, material, { bevel: 0.025 });
}

function addIronMount(group, materials, y, length) {
  const vertical = chamferedBox(0.17, 0.36, 0.045, materials.iron, 0.022);
  vertical.name = 'signpost.board.vertical-bracket';
  vertical.position.set(0.02, 0, 0.082);
  group.add(vertical);

  const horizontal = chamferedBox(Math.min(0.32, length * 0.34), 0.1, 0.05, materials.iron, 0.018);
  horizontal.name = 'signpost.board.horizontal-bracket';
  horizontal.position.set(0.14, 0, 0.086);
  group.add(horizontal);
  for (const x of [0.025, 0.22]) {
    const rivet = bolt(0.027, 0.06, materials.ironEdge);
    rivet.name = 'signpost.board.rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(x, x > 0.1 ? 0 : y * 0, 0.12);
    group.add(rivet);
  }
}

function addMedallion(group, materials, x, emblemIndex) {
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.028, 20),
    materials.brass,
  );
  coin.name = `signpost.medallion.${emblemIndex}`;
  coin.rotation.x = Math.PI * 0.5;
  coin.position.set(x, 0, 0.085);
  group.add(coin);
  const inset = torus(0.06, 0.009, materials.brassDark, 6, 20);
  inset.name = 'signpost.medallion.inset';
  inset.position.set(x, 0, 0.104);
  group.add(inset);
}

function addEmblem(group, materials, length, type) {
  const z = 0.085;
  const centerX = length * 0.61;
  const curves = [];
  if (type === 'mountain') {
    curves.push([
      new THREE.Vector3(centerX - 0.24, -0.045, z),
      new THREE.Vector3(centerX - 0.12, 0.085, z),
      new THREE.Vector3(centerX - 0.02, -0.015, z),
      new THREE.Vector3(centerX + 0.09, 0.11, z),
      new THREE.Vector3(centerX + 0.25, -0.045, z),
    ]);
  } else if (type === 'wheat') {
    curves.push([
      new THREE.Vector3(centerX - 0.2, -0.07, z),
      new THREE.Vector3(centerX - 0.05, -0.01, z),
      new THREE.Vector3(centerX + 0.1, 0.04, z),
      new THREE.Vector3(centerX + 0.22, 0.09, z),
    ]);
    for (let index = 0; index < 4; index += 1) {
      const x = centerX - 0.08 + index * 0.07;
      curves.push([
        new THREE.Vector3(x, 0.005 + index * 0.02, z),
        new THREE.Vector3(x - 0.04, 0.075 + index * 0.016, z),
      ]);
      curves.push([
        new THREE.Vector3(x + 0.015, 0.018 + index * 0.02, z),
        new THREE.Vector3(x + 0.055, -0.045 + index * 0.012, z),
      ]);
    }
  } else {
    curves.push([
      new THREE.Vector3(centerX - 0.24, -0.06, z),
      new THREE.Vector3(centerX - 0.18, 0.03, z),
      new THREE.Vector3(centerX - 0.08, 0.075, z),
      new THREE.Vector3(centerX + 0.03, 0.078, z),
      new THREE.Vector3(centerX + 0.14, 0.03, z),
      new THREE.Vector3(centerX + 0.21, -0.06, z),
    ]);
    curves.push([
      new THREE.Vector3(centerX - 0.28, -0.06, z),
      new THREE.Vector3(centerX + 0.26, -0.06, z),
    ]);
  }
  for (const points of curves) {
    const line = tubeFromPoints(points, 0.012, materials.carving, {
      tubularSegments: 18,
      radialSegments: 5,
    });
    line.name = `signpost.carving.${type}`;
    group.add(line);
  }
}

function addBoard(root, parent, materials, {
  id,
  y,
  yaw,
  length,
  height,
  emblem,
  materialIndex,
}) {
  const group = new THREE.Group();
  group.name = `signpost.board.${id}`;
  group.position.set(0, y, 0);
  group.rotation.y = yaw;
  parent.add(group);

  const board = makeArrowBoard(length, height, materials.oakCross[materialIndex], (materialIndex - 1) * 0.016);
  board.name = `signpost.board.${id}.timber`;
  board.position.x = 0.06;
  group.add(board);
  addIronMount(group, materials, y, length);
  addMedallion(group, materials, 0.29, materialIndex);
  addEmblem(group, materials, length, emblem);
  addSocket(root, group, `socket.signpost-${id}`, new THREE.Vector3(length + 0.04, 0, 0));
}

function addClothCharm(parent, materials) {
  const ring = torus(0.055, 0.012, materials.ironEdge, 7, 20);
  ring.name = 'signpost.charm.ring';
  ring.position.set(-0.22, 1.44, 0.09);
  parent.add(ring);
  const cord = tubeFromPoints([
    new THREE.Vector3(-0.22, 1.39, 0.09),
    new THREE.Vector3(-0.21, 1.31, 0.09),
    new THREE.Vector3(-0.2, 1.25, 0.09),
  ], 0.012, materials.rope, { tubularSegments: 12, radialSegments: 5 });
  cord.name = 'signpost.charm.cord';
  parent.add(cord);
  const cloth = extrudedSilhouette([
    [-0.07, 0.13],
    [0.065, 0.13],
    [0.052, -0.05],
    [0.015, -0.17],
    [-0.02, -0.11],
    [-0.062, -0.19],
  ], 0.018, materials.cloth, { bevel: 0.008 });
  cloth.name = 'signpost.charm.cloth';
  cloth.position.set(-0.2, 1.11, 0.09);
  cloth.rotation.z = -0.05;
  parent.add(cloth);
}

export function createSignpostModel() {
  const root = makePropRoot('prop.signpost', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `signpost-oak-${index}` }),
    {
      offset: [index * 0.17, index * 0.101],
      repeatScale: [0.72 + index * 0.055, 0.9 + (index % 2) * 0.08],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.07, 0.12],
    })),
    stone: PROP_PALETTE.limestone.slice(0, 3).map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `signpost-stone-${index}` }),
      { offset: [index * 0.19, index * 0.13], repeatScale: [0.8, 0.8] },
    )),
    iron: surfaceMaterial('forged-iron', 0x292725, { name: 'signpost-forged-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x58524d, { name: 'signpost-worn-rivets' }),
    brass: surfaceMaterial('brass', 0x9b7134, { name: 'signpost-aged-brass' }),
    brassDark: surfaceMaterial('brass', 0x5f421f, { name: 'signpost-brass-inset' }),
    carving: surfaceMaterial('wood', 0x1d100b, { name: 'signpost-recess-carving' }),
    rope: surfaceMaterial('rope', 0x806542, { name: 'signpost-charm-cord' }),
    cloth: surfaceMaterial('burlap', 0x73382c, {
      name: 'signpost-red-brown-cloth',
      side: THREE.DoubleSide,
    }),
  };

  const foundation = registerNode(root, 'signpost.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [0.84, 0.44, 0.72], offset: [0, 0.22, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addStoneBase(foundation, materials);

  const mast = registerNode(root, 'signpost.mast', new THREE.Group(), {
    collider: { type: 'box', size: [0.3, 2.1, 0.3], offset: [0, 1.45, 0] },
    destructionGroup: 'mast',
  });
  root.add(mast);
  const post = chamferedBox(0.27, 2.05, 0.27, materials.oak[0], 0.045);
  post.name = 'signpost.chamfered-oak-post';
  post.position.y = 1.455;
  mast.add(post);
  const baseCollar = chamferedBox(0.33, 0.18, 0.33, materials.iron, 0.028);
  baseCollar.name = 'signpost.base-collar';
  baseCollar.position.y = 0.55;
  mast.add(baseCollar);
  for (const side of [-1, 1]) {
    const rivet = bolt(0.03, 0.05, materials.ironEdge);
    rivet.name = 'signpost.base-collar.rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(side * 0.1, 0.55, 0.19);
    mast.add(rivet);
  }
  const capNeck = chamferedBox(0.3, 0.14, 0.3, materials.oakCross[2], 0.05);
  capNeck.name = 'signpost.cap-neck';
  capNeck.position.y = 2.53;
  mast.add(capNeck);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 4), materials.oakCross[1]);
  cap.name = 'signpost.faceted-cap';
  cap.position.y = 2.73;
  cap.rotation.y = Math.PI * 0.25;
  mast.add(cap);

  const boards = registerNode(root, 'signpost.direction-boards', new THREE.Group(), {
    collider: { type: 'sphere', radius: 1.08, offset: [0, 2.1, 0] },
    destructionGroup: 'direction-boards',
  });
  root.add(boards);
  addBoard(root, boards, materials, {
    id: 'mountain',
    y: 2.34,
    yaw: 3.75,
    length: 0.98,
    height: 0.27,
    emblem: 'mountain',
    materialIndex: 0,
  });
  addBoard(root, boards, materials, {
    id: 'wheat',
    y: 2.04,
    yaw: 0.5,
    length: 1.05,
    height: 0.28,
    emblem: 'wheat',
    materialIndex: 1,
  });
  addBoard(root, boards, materials, {
    id: 'bridge',
    y: 1.72,
    yaw: 4.55,
    length: 0.88,
    height: 0.26,
    emblem: 'bridge',
    materialIndex: 3,
  });

  const charm = registerNode(root, 'signpost.charm', new THREE.Group(), {
    destructionGroup: 'charm',
  });
  root.add(charm);
  addClothCharm(charm, materials);
  addSocket(root, mast, 'socket.signpost-base', new THREE.Vector3(0, 0.43, 0));

  root.userData.materialFamilies = [
    'aged-oak',
    'limestone',
    'forged-iron',
    'aged-brass',
    'woven-cloth',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/signpost/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createSignpostModel;
