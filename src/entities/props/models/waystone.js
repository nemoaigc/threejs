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

const VERSION = 'img2threejs-waystone-v1-pbr';

function addBaseBlocks(parent, materials) {
  const lower = [
    [-0.31, -0.24, 0],
    [0, -0.25, 1],
    [0.31, -0.24, 2],
    [-0.31, 0.23, 2],
    [0, 0.24, 0],
    [0.31, 0.23, 1],
  ];
  lower.forEach(([x, z, variant], index) => {
    const block = chamferedBox(0.33, 0.2, 0.39, materials.baseStone[variant], 0.06);
    block.name = `waystone.base.lower.${index}`;
    block.position.set(x, 0.1, z);
    block.rotation.y = ((index % 3) - 1) * 0.035;
    parent.add(block);
  });

  const upper = [
    [-0.23, -0.17, 1],
    [0.22, -0.17, 0],
    [-0.23, 0.17, 2],
    [0.22, 0.17, 1],
  ];
  upper.forEach(([x, z, variant], index) => {
    const block = chamferedBox(0.43, 0.2, 0.32, materials.baseStone[variant], 0.055);
    block.name = `waystone.base.upper.${index}`;
    block.position.set(x, 0.29, z);
    block.rotation.y = (index - 1.5) * 0.018;
    parent.add(block);
  });
}

function addMoss(parent, materials) {
  const places = [
    [-0.42, 0.045, 0.29, 1.7],
    [0.34, 0.055, 0.31, 1.4],
    [-0.18, 0.22, 0.23, 1.6],
    [0.2, 0.225, -0.22, 1.25],
    [0.02, 0.4, 0.18, 1.3],
  ];
  places.forEach(([x, y, z, scale], index) => {
    const tuft = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.045 + (index % 2) * 0.012, 1),
      materials.moss[index % 2],
    );
    tuft.name = 'waystone.moss';
    tuft.scale.set(scale, 0.42, 1.1);
    tuft.position.set(x, y, z);
    parent.add(tuft);
  });
}

function addIronBand(parent, materials) {
  const front = chamferedBox(0.69, 0.16, 0.045, materials.iron, 0.025);
  front.name = 'waystone.band.front';
  front.position.set(0, 0.57, 0.205);
  parent.add(front);
  const back = front.clone();
  back.name = 'waystone.band.back';
  back.position.z = -0.205;
  parent.add(back);
  for (const side of [-1, 1]) {
    const sideBand = chamferedBox(0.045, 0.16, 0.39, materials.iron, 0.02);
    sideBand.name = `waystone.band.side.${side}`;
    sideBand.position.set(side * 0.348, 0.57, 0);
    parent.add(sideBand);
  }
  for (const x of [-0.24, 0, 0.24]) {
    const rivet = bolt(0.032, 0.06, materials.ironEdge);
    rivet.name = 'waystone.band.rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(x, 0.57, 0.245);
    parent.add(rivet);
  }
}

function addCrack(parent, material, points) {
  const crack = tubeFromPoints(points, 0.008, material, {
    tubularSegments: 18,
    radialSegments: 5,
  });
  crack.name = 'waystone.surface-crack';
  parent.add(crack);
}

function addRune(parent, materials) {
  const z = 0.225;
  const addStroke = (name, points, radius, {
    closed = false,
    tubularSegments = 28,
  } = {}) => {
    const groove = tubeFromPoints(
      points.map((point) => new THREE.Vector3(point.x, point.y, z - 0.012)),
      radius + 0.007,
      materials.runeGroove,
      {
        tubularSegments,
        radialSegments: 8,
        closed,
      },
    );
    groove.name = `${name}.carved-groove`;
    parent.add(groove);
    const light = tubeFromPoints(points, radius, materials.rune, {
      tubularSegments,
      radialSegments: 8,
      closed,
    });
    light.name = name;
    parent.add(light);
  };
  const diamondPoints = [
    new THREE.Vector3(0, 1.5, z),
    new THREE.Vector3(0.16, 1.33, z),
    new THREE.Vector3(0, 1.17, z),
    new THREE.Vector3(-0.16, 1.33, z),
  ];
  addStroke('waystone.rune.diamond', diamondPoints, 0.02, {
    tubularSegments: 30,
    closed: true,
  });
  addStroke('waystone.rune.stem', [
    new THREE.Vector3(0, 1.17, z),
    new THREE.Vector3(-0.12, 1.02, z),
    new THREE.Vector3(0.04, 0.86, z),
    new THREE.Vector3(0.04, 0.69, z),
  ], 0.019, { tubularSegments: 30 });
  addStroke('waystone.rune.branch', [
    new THREE.Vector3(0.04, 0.87, z),
    new THREE.Vector3(0.18, 1.03, z),
    new THREE.Vector3(0.22, 1.18, z),
  ], 0.017, { tubularSegments: 22 });
  addStroke('waystone.rune.tail-diamond', [
    new THREE.Vector3(0.04, 0.75, z),
    new THREE.Vector3(0.1, 0.69, z),
    new THREE.Vector3(0.04, 0.62, z),
    new THREE.Vector3(-0.02, 0.69, z),
  ], 0.016, {
    tubularSegments: 22,
    closed: true,
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 12), materials.runeCore);
  core.name = 'waystone.rune.core';
  core.scale.z = 0.35;
  core.position.set(0, 1.33, 0.238);
  parent.add(core);
  const halo = torus(0.083, 0.013, materials.runeGlass, 8, 28);
  halo.name = 'waystone.rune.core-ring';
  halo.position.set(0, 1.33, 0.244);
  parent.add(halo);
}

function addOfferings(parent, materials) {
  [-0.08, 0.045].forEach((x, index) => {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.012, 18),
      materials.brass[index],
    );
    coin.name = `waystone.offering.coin.${index}`;
    coin.position.set(x, 0.43 + index * 0.004, 0.27);
    coin.rotation.y = index ? 0.12 : -0.05;
    parent.add(coin);
  });
}

export function createWaystoneModel() {
  const root = makePropRoot('prop.waystone', VERSION);
  const materials = {
    monolith: transformMaterialMaps(
      surfaceMaterial('stone', 0xa17f51, { name: 'waystone-warm-limestone' }),
      { offset: [0.17, 0.08], repeatScale: [0.75, 0.9] },
    ),
    baseStone: [0x594838, 0x6c543e, 0x4c4035].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `waystone-base-stone-${index}` }),
      { offset: [index * 0.2, index * 0.13], repeatScale: [0.84, 0.84] },
    )),
    crack: surfaceMaterial('inner-stone', 0x271f1a, { name: 'waystone-deep-cracks' }),
    iron: surfaceMaterial('forged-iron', 0x292725, { name: 'waystone-blackened-band' }),
    ironEdge: surfaceMaterial('worn-iron', 0x59534d, { name: 'waystone-band-rivets' }),
    brass: [
      surfaceMaterial('brass', 0x9a7134, { name: 'waystone-offering-brass' }),
      surfaceMaterial('brass', 0x6e4e25, { name: 'waystone-offering-brass-dark' }),
    ],
    moss: [
      surfaceMaterial('moss', 0x3a4d27, { name: 'waystone-moss-dark' }),
      surfaceMaterial('moss', 0x66733b, { name: 'waystone-moss-light' }),
    ],
    rune: new THREE.MeshStandardMaterial({
      name: 'waystone-rune-mineral',
      color: 0x39c7eb,
      emissive: 0x159fcf,
      emissiveIntensity: 1.65,
      roughness: 0.26,
      metalness: 0.04,
    }),
    runeGroove: surfaceMaterial('inner-stone', 0x17262c, {
      name: 'waystone-rune-carved-groove',
    }),
    runeGlass: new THREE.MeshPhysicalMaterial({
      name: 'waystone-rune-glass',
      color: 0x44b8d8,
      emissive: 0x188fbd,
      emissiveIntensity: 1.05,
      roughness: 0.18,
      metalness: 0,
      transmission: 0.06,
      thickness: 0.04,
    }),
    runeCore: new THREE.MeshStandardMaterial({
      name: 'waystone-rune-core',
      color: 0x73d9ef,
      emissive: 0x1fa8d2,
      emissiveIntensity: 1.45,
      roughness: 0.16,
      metalness: 0,
    }),
  };

  const foundation = registerNode(root, 'waystone.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [1.02, 0.4, 0.86], offset: [0, 0.2, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addBaseBlocks(foundation, materials);
  addMoss(foundation, materials);

  const monument = registerNode(root, 'waystone.monolith', new THREE.Group(), {
    collider: { type: 'box', size: [0.72, 1.35, 0.4], offset: [0, 1.03, 0] },
    destructionGroup: 'monolith',
  });
  root.add(monument);
  const stone = extrudedSilhouette([
    [-0.31, 0],
    [0.31, 0],
    [0.34, 0.72],
    [0.29, 1.08],
    [0.15, 1.31],
    [-0.08, 1.39],
    [-0.27, 1.25],
    [-0.34, 0.82],
  ], 0.4, materials.monolith, { bevel: 0.055, bevelSegments: 2 });
  stone.name = 'waystone.irregular-monolith';
  stone.position.set(0, 0.4, 0);
  stone.rotation.z = -0.014;
  monument.add(stone);

  addCrack(monument, materials.crack, [
    new THREE.Vector3(-0.16, 1.63, 0.218),
    new THREE.Vector3(-0.07, 1.48, 0.22),
    new THREE.Vector3(-0.12, 1.31, 0.22),
  ]);
  addCrack(monument, materials.crack, [
    new THREE.Vector3(0.26, 1.4, 0.218),
    new THREE.Vector3(0.15, 1.25, 0.222),
    new THREE.Vector3(0.18, 1.06, 0.222),
  ]);
  addCrack(monument, materials.crack, [
    new THREE.Vector3(-0.28, 1.03, 0.218),
    new THREE.Vector3(-0.12, 0.92, 0.222),
    new THREE.Vector3(-0.2, 0.72, 0.222),
  ]);

  const band = registerNode(root, 'waystone.iron-band', new THREE.Group(), {
    destructionGroup: 'iron-band',
  });
  root.add(band);
  addIronBand(band, materials);

  const rune = registerNode(root, 'waystone.magic-rune', new THREE.Group(), {
    destructionGroup: 'rune',
  });
  root.add(rune);
  addRune(rune, materials);
  addSocket(root, rune, 'socket.waystone-rune', new THREE.Vector3(0, 1.32, 0.25));

  const offerings = registerNode(root, 'waystone.offerings', new THREE.Group(), {
    destructionGroup: 'offerings',
  });
  root.add(offerings);
  addOfferings(offerings, materials);
  addSocket(root, offerings, 'socket.waystone-offering', new THREE.Vector3(0, 0.43, 0.28));

  root.userData.materialFamilies = [
    'warm-limestone',
    'base-stone',
    'forged-iron',
    'aged-brass',
    'moss',
    'emissive-rune-mineral',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/waystone/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createWaystoneModel;
