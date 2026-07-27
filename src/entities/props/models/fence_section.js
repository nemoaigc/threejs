import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  extrudedSilhouette,
  finishHeroProp,
  makePropRoot,
  rectangularMemberBetween,
  registerNode,
  surfaceMaterial,
  transformMaterialMaps,
} from './shared.js';

const VERSION = 'img2threejs-fence-section-v1-pbr';

function addStoneFoot(parent, materials, x, variant) {
  const lower = chamferedBox(0.42, 0.2, 0.45, materials.stone[variant], 0.055);
  lower.name = `fence.foot.${variant}.lower`;
  lower.position.set(x, 0.1, 0);
  lower.rotation.y = (variant ? -1 : 1) * 0.018;
  parent.add(lower);

  const upper = chamferedBox(0.35, 0.19, 0.38, materials.stone[(variant + 1) % 3], 0.05);
  upper.name = `fence.foot.${variant}.upper`;
  upper.position.set(x + (variant ? -0.012 : 0.014), 0.285, 0.006);
  upper.rotation.y = (variant ? 1 : -1) * 0.026;
  parent.add(upper);

  for (let index = 0; index < 3; index += 1) {
    const moss = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.035 + index * 0.008, 1),
      materials.moss[index % 2],
    );
    moss.name = 'fence.foot.moss';
    moss.scale.set(1.8, 0.45, 1.1);
    moss.position.set(
      x + (index - 1) * 0.09,
      0.035,
      0.19 - index * 0.012,
    );
    parent.add(moss);
  }
}

function addPost(parent, materials, x, side) {
  const post = chamferedBox(0.22, 1.33, 0.22, materials.oak[side > 0 ? 1 : 0], 0.035);
  post.name = `fence.post.${side < 0 ? 'left' : 'right'}`;
  post.position.set(x, 0.99, 0);
  post.rotation.z = side * 0.008;
  parent.add(post);

  const collar = chamferedBox(0.26, 0.16, 0.255, materials.iron, 0.025);
  collar.name = 'fence.post.lower-collar';
  collar.position.set(x, 0.52, 0);
  parent.add(collar);

  const neck = chamferedBox(0.25, 0.12, 0.25, materials.oakCross[side > 0 ? 2 : 1], 0.04);
  neck.name = 'fence.post.cap-neck';
  neck.position.set(x, 1.665, 0);
  parent.add(neck);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.185, 0.24, 4),
    materials.oakCross[side > 0 ? 0 : 3],
  );
  cap.name = 'fence.post.faceted-cap';
  cap.position.set(x, 1.84, 0);
  cap.rotation.y = Math.PI * 0.25;
  parent.add(cap);
}

function addIronStrap(parent, materials, x, y, width = 0.34) {
  const strap = chamferedBox(width, 0.17, 0.045, materials.iron, 0.022);
  strap.name = 'fence.iron.strap';
  strap.position.set(x, y, 0.145);
  parent.add(strap);
  for (const dx of [-width * 0.32, width * 0.32]) {
    const rivet = bolt(0.026, 0.055, materials.ironEdge);
    rivet.name = 'fence.iron.square-rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(x + dx, y, 0.183);
    parent.add(rivet);
  }
}

function addPicket(parent, materials, x, index) {
  const width = 0.17 + (index % 3) * 0.012;
  const bodyHeight = 0.82 + ((index * 7) % 4) * 0.055;
  const leftShoulder = bodyHeight - (index % 2 ? 0.12 : 0.18);
  const points = index % 3 === 1
    ? [
      [-width * 0.5, 0],
      [width * 0.5, 0],
      [width * 0.5, bodyHeight - 0.09],
      [width * 0.25, bodyHeight],
      [-width * 0.25, bodyHeight],
      [-width * 0.5, bodyHeight - 0.09],
    ]
    : [
      [-width * 0.5, 0],
      [width * 0.5, 0],
      [width * 0.5, leftShoulder],
      [index % 2 ? -width * 0.05 : width * 0.08, bodyHeight],
      [-width * 0.5, leftShoulder + 0.025],
    ];
  const picket = extrudedSilhouette(points, 0.1, materials.oak[index % 4], { bevel: 0.018 });
  picket.name = `fence.picket.${index}`;
  picket.position.set(x, 0.31 + (index % 2) * 0.012, -0.015);
  picket.rotation.z = ((index % 4) - 1.5) * 0.007;
  parent.add(picket);
}

export function createFenceSectionModel() {
  const root = makePropRoot('prop.fence-section', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `fence-oak-${index}` }),
    {
      offset: [index * 0.173, index * 0.117],
      repeatScale: [0.72 + index * 0.06, 0.92 + (index % 2) * 0.08],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.09, 0.04],
    })),
    stone: PROP_PALETTE.limestone.slice(0, 3).map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `fence-stone-${index}` }),
      { offset: [index * 0.21, index * 0.14], repeatScale: [0.82, 0.82] },
    )),
    iron: surfaceMaterial('forged-iron', 0x282624, { name: 'fence-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x56504a, { name: 'fence-worn-rivets' }),
    moss: [
      surfaceMaterial('moss', 0x3d5127, { name: 'fence-moss-dark' }),
      surfaceMaterial('moss', 0x68743b, { name: 'fence-moss-light' }),
    ],
  };

  const foundations = registerNode(root, 'fence.foundations', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [
        { size: [0.45, 0.39, 0.48], offset: [-1.07, 0.195, 0] },
        { size: [0.45, 0.39, 0.48], offset: [1.07, 0.195, 0] },
      ],
    },
    destructionGroup: 'foundations',
  });
  root.add(foundations);
  addStoneFoot(foundations, materials, -1.07, 0);
  addStoneFoot(foundations, materials, 1.07, 1);

  const frame = registerNode(root, 'fence.timber-frame', new THREE.Group(), {
    collider: { type: 'box', size: [2.34, 1.55, 0.26], offset: [0, 1.05, 0] },
    destructionGroup: 'timber-frame',
  });
  root.add(frame);
  addPost(frame, materials, -1.07, -1);
  addPost(frame, materials, 1.07, 1);

  for (const [y, height, materialIndex] of [[0.66, 0.17, 1], [1.18, 0.19, 2]]) {
    const rail = chamferedBox(2.16, height, 0.13, materials.oakCross[materialIndex], 0.032);
    rail.name = `fence.rail.${y > 1 ? 'upper' : 'lower'}`;
    rail.position.set(0, y, 0);
    frame.add(rail);
  }

  const pickets = registerNode(root, 'fence.pickets', new THREE.Group(), {
    destructionGroup: 'pickets',
  });
  root.add(pickets);
  for (let index = 0; index < 7; index += 1) {
    addPicket(pickets, materials, -0.73 + index * 0.245, index);
  }

  const brace = rectangularMemberBetween(
    new THREE.Vector3(-0.81, 0.55, 0.095),
    new THREE.Vector3(0.94, 1.28, 0.095),
    0.15,
    0.12,
    materials.oakCross[3],
    0.03,
  );
  brace.name = 'fence.diagonal-brace';
  frame.add(brace);

  const hardware = registerNode(root, 'fence.hardware', new THREE.Group(), {
    destructionGroup: 'hardware',
  });
  root.add(hardware);
  addIronStrap(hardware, materials, -1.03, 0.68, 0.31);
  addIronStrap(hardware, materials, 1.03, 0.68, 0.31);
  addIronStrap(hardware, materials, -1.03, 1.18, 0.31);
  addIronStrap(hardware, materials, 1.03, 1.18, 0.31);
  addIronStrap(hardware, materials, -0.72, 0.59, 0.29);
  addIronStrap(hardware, materials, 0.88, 1.24, 0.29);

  addSocket(root, frame, 'socket.fence-left', new THREE.Vector3(-1.18, 0.45, 0));
  addSocket(root, frame, 'socket.fence-right', new THREE.Vector3(1.18, 0.45, 0));
  addSocket(root, frame, 'socket.fence-center', new THREE.Vector3(0, 0.82, 0.16));

  root.userData.materialFamilies = ['aged-oak', 'limestone', 'forged-iron', 'moss'];
  root.userData.referenceViews = {
    main: 'docs/references/props/fence_section/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createFenceSectionModel;
