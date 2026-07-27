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

const VERSION = 'img2threejs-flower-planter-v1-pbr';
const LEAF_UP = new THREE.Vector3(0, 1, 0);

function makeLeaf(length, width, material) {
  const right = [
    [0, 0],
    [width * 0.48, length * 0.1],
    [width * 0.72, length * 0.2],
    [width * 0.6, length * 0.28],
    [width, length * 0.39],
    [width * 0.78, length * 0.5],
    [width * 0.88, length * 0.61],
    [width * 0.58, length * 0.73],
    [width * 0.47, length * 0.84],
    [width * 0.24, length * 0.93],
    [0, length],
  ];
  const left = right.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  return extrudedSilhouette([...right, ...left], 0.014, material, {
    bevel: 0.004,
    bevelSegments: 2,
  });
}

function orientLeaf(leaf, direction, roll = 0) {
  leaf.quaternion.setFromUnitVectors(LEAF_UP, direction.clone().normalize());
  leaf.rotateY(roll);
}

function makePetal(length, width, material) {
  return extrudedSilhouette([
    [0, 0],
    [width * 0.72, length * 0.14],
    [width, length * 0.45],
    [width * 0.82, length * 0.76],
    [width * 0.38, length],
    [0, length * 1.08],
    [-width * 0.38, length],
    [-width * 0.82, length * 0.76],
    [-width, length * 0.45],
    [-width * 0.72, length * 0.14],
  ], 0.01, material, { bevel: 0.004, bevelSegments: 2 });
}

function addPlanterBox(parent, materials) {
  for (let index = 0; index < 3; index += 1) {
    const y = 0.19 + index * 0.13;
    for (const zSide of [-1, 1]) {
      const plank = chamferedBox(1.22, 0.115, 0.065, materials.oakCross[(index + (zSide > 0 ? 1 : 0)) % 4], 0.025);
      plank.name = `planter.wall.${zSide > 0 ? 'front' : 'rear'}.plank.${index}`;
      plank.position.set(0, y, zSide * 0.31);
      parent.add(plank);
    }
    for (const xSide of [-1, 1]) {
      const plank = chamferedBox(0.065, 0.115, 0.57, materials.oak[index % 4], 0.023);
      plank.name = `planter.wall.${xSide > 0 ? 'right' : 'left'}.plank.${index}`;
      plank.position.set(xSide * 0.615, y, 0);
      parent.add(plank);
    }
  }

  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const post = chamferedBox(0.11, 0.47, 0.11, materials.oak[xSide > 0 ? 1 : 0], 0.03);
      post.name = 'planter.corner-post';
      post.position.set(xSide * 0.62, 0.27, zSide * 0.315);
      parent.add(post);
      const strap = chamferedBox(0.14, 0.24, 0.12, materials.iron, 0.022);
      strap.name = 'planter.corner-strap';
      strap.position.set(xSide * 0.625, 0.23, zSide * 0.325);
      parent.add(strap);
      for (const y of [0.16, 0.3]) {
        const rivet = bolt(0.023, 0.052, materials.ironEdge);
        rivet.name = 'planter.corner-rivet';
        rivet.rotation.x = Math.PI * 0.5;
        rivet.position.set(xSide * 0.625, y, zSide * 0.395);
        parent.add(rivet);
      }
    }
  }

  for (const zSide of [-1, 1]) {
    const rim = chamferedBox(1.34, 0.1, 0.11, materials.oakCross[zSide > 0 ? 1 : 2], 0.032);
    rim.name = 'planter.top-rim.long';
    rim.position.set(0, 0.52, zSide * 0.335);
    parent.add(rim);
  }
  for (const xSide of [-1, 1]) {
    const rim = chamferedBox(0.11, 0.1, 0.63, materials.oak[xSide > 0 ? 2 : 3], 0.032);
    rim.name = 'planter.top-rim.side';
    rim.position.set(xSide * 0.65, 0.52, 0);
    parent.add(rim);
  }
  const soil = chamferedBox(1.16, 0.1, 0.5, materials.soil, 0.035);
  soil.name = 'planter.soil-bed';
  soil.position.set(0, 0.51, 0);
  parent.add(soil);
}

function addFoundation(parent, materials) {
  let index = 0;
  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const foot = chamferedBox(0.22, 0.14, 0.2, materials.stone[index % 3], 0.045);
      foot.name = 'planter.foundation.stone-foot';
      foot.position.set(xSide * 0.56, 0.07, zSide * 0.25);
      foot.rotation.y = (index - 1.5) * 0.025;
      parent.add(foot);
      index += 1;
    }
  }
}

function addBroadFoliage(parent, materials) {
  const center = new THREE.Vector3(-0.1, 0.54, -0.04);
  for (let index = 0; index < 28; index += 1) {
    const angle = (index / 28) * Math.PI * 2 + (index % 4) * 0.065;
    const length = 0.3 + (index % 5) * 0.028;
    const width = 0.082 + (index % 4) * 0.01;
    const base = center.clone().add(new THREE.Vector3(
      Math.cos(angle * 1.7) * 0.055,
      (index % 3) * 0.008,
      Math.sin(angle * 1.4) * 0.045,
    ));
    const tip = base.clone().add(new THREE.Vector3(
      Math.cos(angle) * length * (0.58 + (index % 3) * 0.06),
      length * (0.62 + (index % 4) * 0.05),
      Math.sin(angle) * length * (0.48 + (index % 2) * 0.08),
    ));
    const leaf = makeLeaf(length, width, materials.leaves[index % 3]);
    leaf.name = 'planter.foliage.broad-leaf';
    leaf.position.copy(base);
    orientLeaf(leaf, tip.clone().sub(base), ((index % 5) - 2) * 0.12);
    parent.add(leaf);

    const midrib = tubeFromPoints([
      base,
      base.clone().lerp(tip, 0.55).add(new THREE.Vector3(0, 0.018, 0)),
      tip,
    ], 0.006, materials.stem, { tubularSegments: 10, radialSegments: 4 });
    midrib.name = 'planter.foliage.leaf-midrib';
    parent.add(midrib);
  }

  for (let index = 0; index < 8; index += 1) {
    const x = -0.4 + index * 0.105;
    const base = new THREE.Vector3(x, 0.55 + (index % 2) * 0.012, 0.08);
    const direction = new THREE.Vector3(
      (index - 3.5) * 0.028,
      0.2 + (index % 3) * 0.025,
      0.16 + (index % 2) * 0.035,
    );
    const leaf = makeLeaf(0.28 + (index % 3) * 0.025, 0.082, materials.leaves[(index + 1) % 3]);
    leaf.name = 'planter.foliage.front-broad-leaf';
    leaf.position.copy(base);
    orientLeaf(leaf, direction, ((index % 3) - 1) * 0.12);
    parent.add(leaf);
  }
}

function addStemLeaves(parent, materials, base, top, index) {
  const stem = tubeFromPoints([
    base,
    base.clone().lerp(top, 0.45).add(new THREE.Vector3((index % 2 ? 1 : -1) * 0.025, 0, 0)),
    top,
  ], 0.009, materials.stem, { tubularSegments: 20, radialSegments: 6 });
  stem.name = 'planter.flower.stem';
  parent.add(stem);

  for (const t of [0.38, 0.62]) {
    const position = base.clone().lerp(top, t);
    for (const side of [-1, 1]) {
      const leaf = makeLeaf(0.12, 0.035, materials.leaves[(index + (side > 0 ? 1 : 0)) % 3]);
      leaf.name = 'planter.flower.stem-leaf';
      leaf.position.copy(position);
      const spreadAngle = index * 0.73 + side * 0.9;
      orientLeaf(leaf, new THREE.Vector3(
        Math.cos(spreadAngle) * 0.09,
        0.07,
        Math.sin(spreadAngle) * 0.075,
      ), side * 0.18);
      parent.add(leaf);
    }
  }
}

function addDaisyBloom(parent, materials, position, colorIndex, scale = 1) {
  const group = new THREE.Group();
  group.name = 'planter.flower.daisy-bloom';
  group.position.copy(position);
  group.rotation.x = -0.18;
  group.rotation.y = 0.12;
  parent.add(group);
  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2;
    const petal = makePetal(0.075 * scale, 0.025 * scale, materials.petals[colorIndex]);
    petal.name = 'planter.flower.outer-petal';
    petal.position.set(Math.cos(angle) * 0.024 * scale, Math.sin(angle) * 0.024 * scale, 0);
    petal.rotation.z = angle - Math.PI * 0.5;
    petal.rotation.y = ((index % 3) - 1) * 0.08;
    group.add(petal);
  }
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2 + 0.24;
    const petal = makePetal(0.047 * scale, 0.02 * scale, materials.petals[colorIndex]);
    petal.name = 'planter.flower.inner-petal';
    petal.position.set(Math.cos(angle) * 0.015 * scale, Math.sin(angle) * 0.015 * scale, 0.012);
    petal.rotation.z = angle - Math.PI * 0.5;
    group.add(petal);
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.034 * scale, 14, 9),
    materials.flowerCenter,
  );
  center.name = 'planter.flower.center';
  center.scale.z = 0.52;
  center.position.z = 0.034;
  group.add(center);
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const pollen = new THREE.Mesh(
      new THREE.SphereGeometry(0.006 * scale, 6, 4),
      materials.pollen,
    );
    pollen.name = 'planter.flower.pollen-grain';
    pollen.position.set(
      Math.cos(angle) * 0.025 * scale,
      Math.sin(angle) * 0.025 * scale,
      0.05,
    );
    group.add(pollen);
  }
}

function addBellBloom(parent, materials, position, index) {
  const profile = [
    new THREE.Vector2(0.018, 0.055),
    new THREE.Vector2(0.022, 0.025),
    new THREE.Vector2(0.032, -0.005),
    new THREE.Vector2(0.052, -0.045),
    new THREE.Vector2(0.06, -0.055),
  ];
  const bell = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 16),
    materials.petals[0],
  );
  bell.name = 'planter.flower.cream-bell';
  bell.position.copy(position);
  bell.rotation.z = index % 2 ? 0.12 : -0.12;
  parent.add(bell);
  for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
    const angle = (petalIndex / 5) * Math.PI * 2;
    const lip = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 5),
      materials.petals[0],
    );
    lip.name = 'planter.flower.bell-lip';
    lip.scale.set(1.4, 0.5, 0.8);
    lip.position.copy(position).add(new THREE.Vector3(
      Math.cos(angle) * 0.045,
      -0.055,
      Math.sin(angle) * 0.045,
    ));
    parent.add(lip);
  }
  const stamen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6),
    materials.pollen,
  );
  stamen.name = 'planter.flower.bell-stamen';
  stamen.position.copy(position).add(new THREE.Vector3(0, -0.07, 0));
  parent.add(stamen);
}

function addFlowers(parent, materials) {
  const roseTops = [
    new THREE.Vector3(0.34, 0.98, -0.02),
    new THREE.Vector3(0.49, 0.87, 0.08),
    new THREE.Vector3(0.21, 0.84, 0.14),
    new THREE.Vector3(0.46, 0.76, -0.12),
  ];
  roseTops.forEach((top, index) => {
    addStemLeaves(parent, materials, new THREE.Vector3(0.2 + index * 0.055, 0.55, 0), top, index);
    addDaisyBloom(parent, materials, top, 1, index === 0 ? 1.05 : 0.82 + (index % 2) * 0.08);
  });

  const yellowTops = [
    new THREE.Vector3(-0.08, 0.76, 0.23),
    new THREE.Vector3(0.04, 0.8, 0.2),
    new THREE.Vector3(0.14, 0.72, 0.25),
  ];
  yellowTops.forEach((top, index) => {
    addStemLeaves(parent, materials, new THREE.Vector3(0.02, 0.55, 0.12), top, index + 4);
    addDaisyBloom(parent, materials, top, 2, 0.67);
  });

  const bellTops = [
    new THREE.Vector3(-0.5, 0.93, 0.02),
    new THREE.Vector3(-0.39, 0.86, 0.13),
    new THREE.Vector3(-0.55, 0.78, 0.15),
    new THREE.Vector3(-0.32, 0.75, -0.06),
  ];
  bellTops.forEach((top, index) => {
    const stemTop = top.clone().add(new THREE.Vector3(0, 0.07, 0));
    addStemLeaves(parent, materials, new THREE.Vector3(-0.36, 0.55, 0.05), stemTop, index + 7);
    const hook = tubeFromPoints([
      stemTop,
      stemTop.clone().add(new THREE.Vector3((index % 2 ? 1 : -1) * 0.025, 0.02, 0)),
      top,
    ], 0.008, materials.stem, { tubularSegments: 12, radialSegments: 5 });
    hook.name = 'planter.flower.bell-hook';
    parent.add(hook);
    addBellBloom(parent, materials, top, index);
  });
}

function addIvy(parent, materials) {
  const path = [
    new THREE.Vector3(-0.48, 0.59, 0.365),
    new THREE.Vector3(-0.58, 0.46, 0.385),
    new THREE.Vector3(-0.52, 0.3, 0.39),
    new THREE.Vector3(-0.62, 0.1, 0.37),
    new THREE.Vector3(-0.55, -0.02, 0.35),
  ];
  const vine = tubeFromPoints(path, 0.008, materials.stem, {
    tubularSegments: 28,
    radialSegments: 5,
  });
  vine.name = 'planter.ivy.vine';
  parent.add(vine);
  for (let index = 0; index < 11; index += 1) {
    const t = index / 10;
    const segment = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
    const localT = (t * (path.length - 1)) - segment;
    const position = path[segment].clone().lerp(path[segment + 1], localT);
    const leaf = makeLeaf(0.08, 0.032, materials.ivy[index % 2]);
    leaf.name = 'planter.ivy.leaf';
    leaf.position.copy(position);
    orientLeaf(leaf, new THREE.Vector3(
      index % 2 ? 0.08 : -0.08,
      -0.035,
      0.025,
    ), index * 0.37);
    parent.add(leaf);
  }
}

function addBrassEmblem(parent, materials) {
  const medallion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.025, 20),
    materials.brass,
  );
  medallion.name = 'planter.brass-watering-emblem';
  medallion.rotation.x = Math.PI * 0.5;
  medallion.position.set(0, 0.31, 0.367);
  parent.add(medallion);
  const handle = torus(0.04, 0.008, materials.brassDark, 6, 20, Math.PI * 1.45);
  handle.name = 'planter.emblem.handle';
  handle.position.set(0.025, 0.33, 0.386);
  parent.add(handle);
  const spout = tubeFromPoints([
    new THREE.Vector3(-0.035, 0.31, 0.387),
    new THREE.Vector3(-0.075, 0.33, 0.387),
    new THREE.Vector3(-0.095, 0.35, 0.387),
  ], 0.009, materials.brassDark, { tubularSegments: 12, radialSegments: 5 });
  spout.name = 'planter.emblem.spout';
  parent.add(spout);
}

export function createFlowerPlanterModel() {
  const root = makePropRoot('prop.flower-planter', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `planter-oak-${index}` }),
    {
      offset: [index * 0.171, index * 0.107],
      repeatScale: [0.73 + index * 0.045, 0.9 + (index % 2) * 0.08],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08, 0.11],
    })),
    stone: PROP_PALETTE.limestone.slice(0, 3).map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `planter-stone-${index}` }),
      { offset: [index * 0.19, index * 0.13], repeatScale: [0.8, 0.8] },
    )),
    iron: surfaceMaterial('forged-iron', 0x292725, { name: 'planter-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x56514b, { name: 'planter-worn-rivets' }),
    soil: surfaceMaterial('soil', 0x241811, { name: 'planter-damp-soil' }),
    leaves: [
      surfaceMaterial('leaf', 0x52613b, { name: 'planter-sage-leaf' }),
      surfaceMaterial('leaf', 0x364b2d, { name: 'planter-deep-green-leaf' }),
      surfaceMaterial('leaf', 0x6f7745, { name: 'planter-light-leaf' }),
    ],
    ivy: [
      surfaceMaterial('leaf', 0x31472b, { name: 'planter-ivy-dark' }),
      surfaceMaterial('leaf', 0x58633c, { name: 'planter-ivy-light' }),
    ],
    stem: surfaceMaterial('leaf', 0x39492b, { name: 'planter-flower-stem' }),
    petals: [
      surfaceMaterial('petal', 0xe7ddbd, {
        name: 'planter-cream-petal',
        side: THREE.DoubleSide,
      }),
      surfaceMaterial('petal', 0xa85f64, {
        name: 'planter-dusty-rose-petal',
        side: THREE.DoubleSide,
      }),
      surfaceMaterial('petal', 0xd9a72f, {
        name: 'planter-golden-petal',
        side: THREE.DoubleSide,
      }),
    ],
    flowerCenter: surfaceMaterial('petal', 0x6f431d, { name: 'planter-flower-center' }),
    pollen: surfaceMaterial('petal', 0xc89428, { name: 'planter-flower-pollen' }),
    brass: surfaceMaterial('brass', 0x96703b, { name: 'planter-brass-emblem' }),
    brassDark: surfaceMaterial('brass', 0x5c431f, { name: 'planter-brass-emblem-dark' }),
  };

  const foundation = registerNode(root, 'planter.foundation', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [-1, 1].flatMap((xSide) => [-1, 1].map((zSide) => ({
        size: [0.22, 0.14, 0.2],
        offset: [xSide * 0.56, 0.07, zSide * 0.25],
      }))),
    },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addFoundation(foundation, materials);

  const box = registerNode(root, 'planter.box', new THREE.Group(), {
    collider: { type: 'box', size: [1.38, 0.48, 0.73], offset: [0, 0.32, 0] },
    destructionGroup: 'box',
  });
  root.add(box);
  addPlanterBox(box, materials);
  addBrassEmblem(box, materials);
  addSocket(root, box, 'socket.planter-soil', new THREE.Vector3(0, 0.56, 0));

  const foliage = registerNode(root, 'planter.foliage', new THREE.Group(), {
    collider: { type: 'box', size: [1.15, 0.58, 0.62], offset: [-0.04, 0.78, 0] },
    destructionGroup: 'foliage',
  });
  root.add(foliage);
  addBroadFoliage(foliage, materials);

  const flowers = registerNode(root, 'planter.flowers', new THREE.Group(), {
    destructionGroup: 'flowers',
  });
  root.add(flowers);
  addFlowers(flowers, materials);
  addSocket(root, flowers, 'socket.planter-flowers', new THREE.Vector3(0, 0.86, 0.06));

  const ivy = registerNode(root, 'planter.ivy', new THREE.Group(), {
    destructionGroup: 'ivy',
  });
  root.add(ivy);
  addIvy(ivy, materials);

  root.userData.materialFamilies = [
    'aged-oak',
    'limestone',
    'forged-iron',
    'damp-soil',
    'waxy-leaf',
    'matte-petal',
    'stem',
    'aged-brass',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/flower_planter/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createFlowerPlanterModel;
