import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  finishHeroProp,
  makePropRoot,
  rectangularMemberBetween,
  registerNode,
  surfaceMaterial,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-hay-bale-stack-v1-pbr';

function addPallet(parent, materials) {
  for (const z of [-0.36, 0, 0.36]) {
    const runner = chamferedBox(2.0, 0.15, 0.16, materials.oak[1], 0.035);
    runner.name = 'hay-stack.pallet.runner';
    runner.position.set(0, 0.15, z);
    parent.add(runner);
  }
  for (let index = 0; index < 7; index += 1) {
    const x = -0.9 + index * 0.3;
    const plank = chamferedBox(0.25, 0.085, 0.92, materials.oakCross[index % 4], 0.026);
    plank.name = 'hay-stack.pallet.top-plank';
    plank.position.set(x, 0.267, 0);
    plank.rotation.y = ((index % 3) - 1) * 0.012;
    parent.add(plank);
    for (const z of [-0.34, 0.34]) {
      const nail = bolt(0.018, 0.055, materials.iron);
      nail.name = 'hay-stack.pallet.nail';
      nail.position.set(x, 0.32, z);
      parent.add(nail);
    }
  }
  for (const x of [-0.82, 0, 0.82]) {
    for (const z of [-0.32, 0.32]) {
      const foot = chamferedBox(0.25, 0.12, 0.24, materials.oak[(Math.round(x * 10) + (z > 0 ? 1 : 0) + 8) % 4], 0.035);
      foot.name = 'hay-stack.pallet.foot';
      foot.position.set(x, 0.06, z);
      parent.add(foot);
    }
  }
}

function addTwineLoop(group, material, x, height, depth, id) {
  const halfH = height * 0.51;
  const halfD = depth * 0.51;
  const loop = tubeFromPoints([
    new THREE.Vector3(x, -halfH + 0.04, -halfD),
    new THREE.Vector3(x, halfH - 0.04, -halfD),
    new THREE.Vector3(x, halfH, -halfD * 0.55),
    new THREE.Vector3(x, halfH, halfD * 0.55),
    new THREE.Vector3(x, halfH - 0.04, halfD),
    new THREE.Vector3(x, -halfH + 0.04, halfD),
    new THREE.Vector3(x, -halfH, halfD * 0.55),
    new THREE.Vector3(x, -halfH, -halfD * 0.55),
  ], 0.012, material, {
    tubularSegments: 40,
    radialSegments: 7,
    closed: true,
  });
  loop.name = `hay-stack.bale.${id}.twine-loop`;
  group.add(loop);

  const knot = new THREE.Mesh(
    new THREE.SphereGeometry(0.027, 9, 6),
    material,
  );
  knot.name = `hay-stack.bale.${id}.twine-knot`;
  knot.scale.set(1.12, 0.74, 0.86);
  knot.position.set(x, 0.02, halfD + 0.025);
  group.add(knot);
  for (const side of [-1, 1]) {
    const tail = tubeFromPoints([
      new THREE.Vector3(x + side * 0.012, 0.02, halfD + 0.03),
      new THREE.Vector3(x + side * 0.025, -0.025, halfD + 0.052),
      new THREE.Vector3(x + side * 0.038, -0.075 - (side > 0 ? 0.012 : 0), halfD + 0.06),
    ], 0.0055, material, { tubularSegments: 10, radialSegments: 5 });
    tail.name = `hay-stack.bale.${id}.twine-tail`;
    group.add(tail);
  }
}

function addBale(parent, materials, {
  id,
  position,
  rotationY = 0,
  width = 1.0,
  height = 0.52,
  depth = 0.62,
  materialIndex = 0,
}) {
  const group = new THREE.Group();
  group.name = `hay-stack.bale.${id}`;
  group.position.copy(position);
  group.rotation.y = rotationY;
  parent.add(group);

  const body = chamferedBox(width, height, depth, materials.hay[materialIndex % materials.hay.length], 0.095);
  body.name = `hay-stack.bale.${id}.compressed-body`;
  group.add(body);

  for (const x of [-width * 0.28, width * 0.28]) {
    addTwineLoop(group, materials.rope, x, height, depth, id);
  }

  for (let index = 0; index < 48; index += 1) {
    const x0 = -width * 0.46 + ((index * 37) % 97) / 97 * width * 0.92;
    const y0 = -height * 0.43 + ((index * 53) % 89) / 89 * height * 0.86;
    const length = 0.11 + (index % 6) * 0.022;
    const slope = ((index % 7) - 3) * 0.025;
    const strand = tubeFromPoints([
      new THREE.Vector3(x0 - length * 0.5, y0 - slope, depth * 0.505),
      new THREE.Vector3(x0, y0 + Math.sin(index * 1.7) * 0.012, depth * 0.515),
      new THREE.Vector3(x0 + length * 0.5, y0 + slope, depth * 0.508),
    ], 0.0045 + (index % 3) * 0.0008, materials.straw[index % 3], {
      tubularSegments: 8,
      radialSegments: 4,
    });
    strand.name = `hay-stack.bale.${id}.front-straw`;
    group.add(strand);
  }

  for (let index = 0; index < 28; index += 1) {
    const x0 = -width * 0.44 + ((index * 29) % 83) / 83 * width * 0.88;
    const z0 = -depth * 0.4 + ((index * 47) % 79) / 79 * depth * 0.8;
    const strand = tubeFromPoints([
      new THREE.Vector3(x0 - 0.06, height * 0.51, z0 - 0.015),
      new THREE.Vector3(x0, height * 0.525 + (index % 2) * 0.006, z0),
      new THREE.Vector3(x0 + 0.075, height * 0.51, z0 + 0.02),
    ], 0.0045, materials.straw[(index + 1) % 3], {
      tubularSegments: 7,
      radialSegments: 4,
    });
    strand.name = `hay-stack.bale.${id}.top-straw`;
    group.add(strand);
  }

  for (let index = 0; index < 16; index += 1) {
    const side = index % 2 ? 1 : -1;
    const y = -height * 0.38 + (index / 9) * height * 0.76;
    const z = -depth * 0.3 + ((index * 17) % 9) / 9 * depth * 0.6;
    const tuft = tubeFromPoints([
      new THREE.Vector3(side * width * 0.49, y, z),
      new THREE.Vector3(side * (width * 0.55 + (index % 3) * 0.015), y + 0.01, z + 0.02),
      new THREE.Vector3(side * (width * 0.59 + (index % 2) * 0.02), y - 0.02, z + 0.04),
    ], 0.004, materials.straw[index % 3], {
      tubularSegments: 7,
      radialSegments: 4,
    });
    tuft.name = `hay-stack.bale.${id}.edge-tuft`;
    group.add(tuft);
  }
}

function addPitchfork(parent, materials) {
  const handle = tubeFromPoints([
    new THREE.Vector3(-1.17, 0.2, 0.42),
    new THREE.Vector3(-1.11, 0.78, 0.29),
    new THREE.Vector3(-1.03, 1.5, 0.12),
    new THREE.Vector3(-0.98, 1.78, 0.05),
  ], 0.037, materials.handle, {
    tubularSegments: 34,
    radialSegments: 9,
  });
  handle.name = 'hay-stack.pitchfork.wood-handle';
  parent.add(handle);

  const crossbar = rectangularMemberBetween(
    new THREE.Vector3(-1.34, 0.22, 0.44),
    new THREE.Vector3(-1.02, 0.22, 0.44),
    0.065,
    0.07,
    materials.iron,
    0.018,
  );
  crossbar.name = 'hay-stack.pitchfork.socket-bar';
  parent.add(crossbar);

  for (let index = 0; index < 4; index += 1) {
    const x = -1.34 + index * 0.105;
    const tine = tubeFromPoints([
      new THREE.Vector3(x, 0.21, 0.44),
      new THREE.Vector3(x - 0.012, 0.1, 0.45),
      new THREE.Vector3(x - 0.04, -0.035, 0.475),
    ], 0.016, materials.ironEdge, {
      tubularSegments: 12,
      radialSegments: 6,
    });
    tine.name = 'hay-stack.pitchfork.tine';
    parent.add(tine);
  }
  for (const x of [-1.32, -1.04]) {
    const rivet = bolt(0.018, 0.075, materials.ironEdge);
    rivet.name = 'hay-stack.pitchfork.rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(x, 0.22, 0.485);
    parent.add(rivet);
  }
  const ferrule = tubeFromPoints([
    new THREE.Vector3(-1.2, 0.24, 0.42),
    new THREE.Vector3(-1.18, 0.38, 0.39),
  ], 0.047, materials.iron, {
    tubularSegments: 10,
    radialSegments: 8,
  });
  ferrule.name = 'hay-stack.pitchfork.iron-ferrule';
  parent.add(ferrule);
}

function addLooseStraw(parent, materials) {
  for (let index = 0; index < 14; index += 1) {
    const x = -0.35 + index * 0.055;
    const z = 0.5 + ((index * 7) % 5) * 0.025;
    const stem = tubeFromPoints([
      new THREE.Vector3(x - 0.08, 0.018, z),
      new THREE.Vector3(x, 0.02 + (index % 3) * 0.004, z + 0.02),
      new THREE.Vector3(x + 0.1 + (index % 4) * 0.015, 0.018, z + ((index % 2) - 0.5) * 0.045),
    ], 0.0035, materials.straw[index % 3], {
      tubularSegments: 8,
      radialSegments: 4,
    });
    stem.name = 'hay-stack.loose-straw';
    parent.add(stem);
  }
}

export function createHayBaleStackModel() {
  const root = makePropRoot('prop.hay-bale-stack', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `hay-stack-pallet-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.75, 0.92] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08, 0.12],
    })),
    hay: [0xa97527, 0xb98835, 0x93621f].map((color, index) => transformMaterialMaps(
      surfaceMaterial('hay', color, { name: `hay-stack-compressed-hay-${index}` }),
      { offset: [index * 0.19, index * 0.13], repeatScale: [0.78, 0.9] },
    )),
    straw: [0xd0a249, 0xb77d27, 0xddb45b].map((color, index) => surfaceMaterial('hay', color, {
      name: `hay-stack-loose-straw-${index}`,
    })),
    rope: surfaceMaterial('rope', 0x9a7846, { name: 'hay-stack-hemp-twine' }),
    handle: surfaceMaterial('wood', 0x56351f, { name: 'hay-stack-pitchfork-handle' }),
    iron: surfaceMaterial('forged-iron', 0x292725, { name: 'hay-stack-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x56514b, { name: 'hay-stack-worn-tines' }),
  };

  const pallet = registerNode(root, 'hay-stack.pallet', new THREE.Group(), {
    collider: { type: 'box', size: [2.15, 0.33, 1.0], offset: [0, 0.165, 0] },
    destructionGroup: 'pallet',
  });
  root.add(pallet);
  addPallet(pallet, materials);

  const bales = registerNode(root, 'hay-stack.bales', new THREE.Group(), {
    collider: { type: 'box', size: [2.1, 1.12, 0.72], offset: [0, 0.87, 0] },
    destructionGroup: 'bales',
  });
  root.add(bales);
  addBale(bales, materials, {
    id: 'left',
    position: new THREE.Vector3(-0.52, 0.61, 0),
    rotationY: -0.018,
    materialIndex: 0,
  });
  addBale(bales, materials, {
    id: 'right',
    position: new THREE.Vector3(0.52, 0.61, 0.015),
    rotationY: 0.025,
    materialIndex: 2,
  });
  addBale(bales, materials, {
    id: 'top',
    position: new THREE.Vector3(0.03, 1.13, -0.025),
    rotationY: 0.055,
    width: 1.06,
    height: 0.5,
    depth: 0.6,
    materialIndex: 1,
  });
  addSocket(root, bales, 'socket.hay-stack-top', new THREE.Vector3(0.03, 1.4, -0.02));

  const pitchfork = registerNode(root, 'hay-stack.pitchfork', new THREE.Group(), {
    destructionGroup: 'pitchfork',
  });
  root.add(pitchfork);
  addPitchfork(pitchfork, materials);
  addSocket(root, pitchfork, 'socket.hay-stack-pitchfork', new THREE.Vector3(-1.05, 1.3, 0.16));

  const spill = registerNode(root, 'hay-stack.spill', new THREE.Group(), {
    destructionGroup: 'straw-spill',
  });
  root.add(spill);
  addLooseStraw(spill, materials);

  root.userData.materialFamilies = [
    'compressed-hay',
    'loose-straw',
    'hemp-twine',
    'aged-oak',
    'blackened-iron',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/hay_bale_stack/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createHayBaleStackModel;
