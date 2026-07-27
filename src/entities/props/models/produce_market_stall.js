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
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-produce-market-stall-v1-pbr';

function addStoneFeet(parent, materials) {
  for (const [index, x, z, yaw] of [
    [0, -1.19, -0.46, -0.04],
    [1, 1.19, -0.46, 0.05],
    [2, -1.19, 0.46, 0.035],
    [3, 1.19, 0.46, -0.055],
  ]) {
    const foot = chamferedBox(0.36, 0.19, 0.35, materials.stone[index % 3], 0.065);
    foot.name = 'market-stall.foundation.limestone-foot';
    foot.position.set(x, 0.095, z);
    foot.rotation.y = yaw;
    parent.add(foot);

    const moss = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 9, 5),
      materials.moss,
    );
    moss.name = 'market-stall.foundation.moss';
    moss.scale.set(1.5, 0.2, 0.7);
    moss.position.set(x + (index % 2 ? -0.1 : 0.1), 0.19, z + (index > 1 ? -0.08 : 0.08));
    parent.add(moss);
  }
}

function addTimberFrame(parent, materials) {
  const posts = [
    [-1.17, -0.46],
    [1.17, -0.46],
    [-1.17, 0.46],
    [1.17, 0.46],
  ];
  posts.forEach(([x, z], index) => {
    const post = chamferedBox(0.14, 2.15, 0.14, materials.oak[index % 4], 0.03);
    post.name = 'market-stall.frame.post';
    post.position.set(x, 1.22, z);
    post.rotation.y = (index - 1.5) * 0.008;
    parent.add(post);

    const ironFoot = chamferedBox(0.19, 0.14, 0.19, materials.iron, 0.022);
    ironFoot.name = 'market-stall.frame.post-shoe';
    ironFoot.position.set(x, 0.28, z);
    parent.add(ironFoot);
    for (const side of [-1, 1]) {
      const rivet = bolt(0.014, 0.025, materials.ironEdge);
      rivet.name = 'market-stall.frame.post-shoe-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x + side * 0.05, 0.32, z + 0.098);
      parent.add(rivet);
    }
  });

  for (const z of [-0.49, 0.49]) {
    const lintel = chamferedBox(2.62, 0.14, 0.16, materials.oak[z > 0 ? 2 : 1], 0.03);
    lintel.name = 'market-stall.frame.lintel';
    lintel.position.set(0, 2.24, z);
    parent.add(lintel);
  }
  for (const x of [-1.2, 1.2]) {
    const sideRail = chamferedBox(0.15, 0.13, 1.14, materials.oak[x > 0 ? 3 : 0], 0.028);
    sideRail.name = 'market-stall.frame.side-rail';
    sideRail.position.set(x, 2.25, 0);
    parent.add(sideRail);

    const brace = rectangularMemberBetween(
      new THREE.Vector3(x, 1.57, -0.47),
      new THREE.Vector3(x, 2.15, 0.29),
      0.09,
      0.08,
      materials.oak[x > 0 ? 1 : 2],
      0.02,
    );
    brace.name = 'market-stall.frame.diagonal-brace';
    parent.add(brace);
  }

  const ridge = chamferedBox(2.82, 0.11, 0.12, materials.oak[0], 0.025);
  ridge.name = 'market-stall.frame.canopy-ridge';
  ridge.position.set(0, 2.49, 0);
  parent.add(ridge);

  for (const x of [-0.78, 0, 0.78]) {
    const roofRib = tubeFromPoints([
      new THREE.Vector3(x, 2.18, -0.68),
      new THREE.Vector3(x, 2.42, -0.22),
      new THREE.Vector3(x, 2.49, 0),
      new THREE.Vector3(x, 2.4, 0.27),
      new THREE.Vector3(x, 2.14, 0.69),
    ], 0.022, materials.iron, {
      tubularSegments: 24,
      radialSegments: 6,
    });
    roofRib.name = 'market-stall.frame.canopy-rib';
    parent.add(roofRib);
  }
}

function addCounter(parent, materials) {
  for (let index = 0; index < 7; index += 1) {
    const x = -1.08 + index * 0.36;
    const plank = chamferedBox(0.33, 0.09, 0.86, materials.oakCross[index % 4], 0.024);
    plank.name = 'market-stall.counter.top-plank';
    plank.position.set(x, 1.02 + (index % 3) * 0.004, 0.02);
    plank.rotation.y = ((index % 3) - 1) * 0.007;
    parent.add(plank);
  }
  const frontApron = chamferedBox(2.48, 0.25, 0.11, materials.oak[3], 0.035);
  frontApron.name = 'market-stall.counter.front-apron';
  frontApron.position.set(0, 0.88, 0.43);
  parent.add(frontApron);

  for (const x of [-1.06, 1.06]) {
    const support = chamferedBox(0.13, 0.77, 0.13, materials.oak[x > 0 ? 1 : 2], 0.025);
    support.name = 'market-stall.counter.support';
    support.position.set(x, 0.64, 0.18);
    parent.add(support);
  }
  for (let index = 0; index < 6; index += 1) {
    const x = -0.98 + index * 0.39;
    const shelf = chamferedBox(0.34, 0.07, 0.66, materials.oakCross[(index + 1) % 4], 0.022);
    shelf.name = 'market-stall.counter.lower-shelf';
    shelf.position.set(x, 0.48, -0.02);
    parent.add(shelf);
  }

  for (const x of [-1.05, -0.35, 0.35, 1.05]) {
    const peg = bolt(0.018, 0.065, materials.ironEdge);
    peg.name = 'market-stall.counter.apron-nail';
    peg.rotation.x = Math.PI * 0.5;
    peg.position.set(x, 0.9, 0.49);
    parent.add(peg);
  }
}

function canopyHeight(z) {
  const normalized = Math.min(1, Math.abs(z) / 0.72);
  return 2.49 - Math.pow(normalized, 1.42) * 0.34;
}

function createCanopyStrip(x0, x1, material) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const steps = 10;
  for (let zIndex = 0; zIndex <= steps; zIndex += 1) {
    const t = zIndex / steps;
    const z = -0.72 + t * 1.44;
    const y = canopyHeight(z) + Math.sin(t * Math.PI * 3) * 0.005;
    positions.push(x0, y, z, x1, y, z);
    uvs.push(0, t, 1, t);
    if (zIndex < steps) {
      const base = zIndex * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function addCanopy(parent, materials) {
  const stripeCount = 11;
  const width = 2.86;
  for (let index = 0; index < stripeCount; index += 1) {
    const x0 = -width * 0.5 + (index / stripeCount) * width;
    const x1 = -width * 0.5 + ((index + 1) / stripeCount) * width;
    const strip = createCanopyStrip(x0, x1, index % 2 ? materials.canvasCream : materials.canvasRed);
    strip.name = 'market-stall.canopy.strip';
    parent.add(strip);
  }

  for (const side of [-1, 1]) {
    const rope = tubeFromPoints([
      new THREE.Vector3(side * 1.41, 2.14, 0.69),
      new THREE.Vector3(side * 1.4, 1.95, 0.7),
      new THREE.Vector3(side * 1.37, 1.79, 0.68),
    ], 0.014, materials.rope, {
      tubularSegments: 14,
      radialSegments: 5,
    });
    rope.name = 'market-stall.canopy.tie-rope';
    parent.add(rope);
  }

  const scallopCount = 11;
  for (let index = 0; index < scallopCount; index += 1) {
    const segmentWidth = width / scallopCount;
    const panel = extrudedSilhouette([
      [-segmentWidth * 0.5, 0.07],
      [segmentWidth * 0.5, 0.07],
      [segmentWidth * 0.48, -0.08],
      [segmentWidth * 0.28, -0.14],
      [0, -0.17],
      [-segmentWidth * 0.28, -0.14],
      [-segmentWidth * 0.48, -0.08],
    ], 0.018, index % 2 ? materials.canvasCream : materials.canvasRed, {
      bevel: 0.006,
    });
    panel.name = 'market-stall.canopy.scalloped-valance';
    panel.position.set(-width * 0.5 + segmentWidth * (index + 0.5), 2.08, 0.725);
    parent.add(panel);

    if (index % 2 === 0) {
      const grommet = torus(0.015, 0.004, materials.brass, 5, 12);
      grommet.name = 'market-stall.canopy.brass-grommet';
      grommet.position.set(panel.position.x, 2.11, 0.738);
      parent.add(grommet);
    }
  }
}

function addCrate(parent, materials, {
  name,
  x,
  z,
  yaw = 0,
  materialIndex = 0,
}) {
  const group = new THREE.Group();
  group.name = `market-stall.produce.${name}-crate`;
  group.position.set(x, 1.09, z);
  group.rotation.y = yaw;
  parent.add(group);

  const wood = materials.crateWood[materialIndex % materials.crateWood.length];
  const dark = materials.oak[(materialIndex + 2) % 4];
  const base = chamferedBox(0.68, 0.055, 0.42, dark, 0.02);
  base.name = `${name}-crate.base`;
  base.position.y = 0.03;
  group.add(base);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row += 1) {
      const slat = chamferedBox(0.68, 0.075, 0.045, wood, 0.018);
      slat.name = `${name}-crate.front-back-slat`;
      slat.position.set(0, 0.12 + row * 0.095, side * 0.205);
      group.add(slat);
    }
    const end = chamferedBox(0.045, 0.22, 0.42, dark, 0.018);
    end.name = `${name}-crate.end-post`;
    end.position.set(side * 0.325, 0.14, 0);
    group.add(end);
  }
  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const nail = bolt(0.011, 0.024, materials.ironEdge);
      nail.name = `${name}-crate.nail`;
      nail.rotation.x = Math.PI * 0.5;
      nail.position.set(xSide * 0.27, 0.2, zSide * 0.23);
      group.add(nail);
    }
  }
  return group;
}

function addApples(parent, materials) {
  const crate = addCrate(parent, materials, {
    name: 'apple',
    x: -0.78,
    z: 0.03,
    yaw: -0.035,
  });
  for (let index = 0; index < 12; index += 1) {
    const row = index < 7 ? 0 : 1;
    const local = row === 0 ? index : index - 7;
    const apple = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 9),
      materials.apple[index % 3],
    );
    apple.name = 'market-stall.produce.apple';
    apple.scale.set(1, 0.9, 1);
    apple.position.set(
      -0.25 + local * (row ? 0.125 : 0.085),
      0.23 + row * 0.12,
      (row ? -0.04 : 0.055) + ((index % 2) - 0.5) * 0.06,
    );
    crate.add(apple);
    const stem = rectangularMemberBetween(
      new THREE.Vector3(apple.position.x, apple.position.y + 0.075, apple.position.z),
      new THREE.Vector3(apple.position.x + 0.012, apple.position.y + 0.12, apple.position.z - 0.008),
      0.012,
      0.012,
      materials.stem,
      0.002,
    );
    stem.name = 'market-stall.produce.apple-stem';
    crate.add(stem);
  }
}

function addCabbages(parent, materials) {
  const crate = addCrate(parent, materials, {
    name: 'cabbage',
    x: 0,
    z: -0.02,
    yaw: 0.025,
    materialIndex: 1,
  });
  for (let index = 0; index < 5; index += 1) {
    const cabbage = new THREE.Group();
    cabbage.name = 'market-stall.produce.cabbage';
    cabbage.position.set(
      -0.24 + (index % 3) * 0.22,
      0.28 + (index > 2 ? 0.12 : 0),
      index > 2 ? -0.03 : 0.04,
    );
    cabbage.rotation.y = index * 0.87;
    crate.add(cabbage);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.13, 2),
      materials.cabbage[(index + 1) % 3],
    );
    core.name = 'market-stall.produce.cabbage-core';
    core.scale.y = 0.9;
    cabbage.add(core);
    for (let leafIndex = 0; leafIndex < 6; leafIndex += 1) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 9, 6, 0, Math.PI),
        materials.cabbage[leafIndex % 3],
      );
      leaf.name = 'market-stall.produce.cabbage-leaf';
      const angle = (leafIndex / 6) * Math.PI * 2;
      leaf.scale.set(0.82, 0.35, 1.15);
      leaf.position.set(Math.cos(angle) * 0.085, -0.005, Math.sin(angle) * 0.085);
      leaf.rotation.y = -angle + Math.PI * 0.5;
      cabbage.add(leaf);
    }
  }
}

function addCarrots(parent, materials) {
  const crate = addCrate(parent, materials, {
    name: 'carrot',
    x: 0.78,
    z: 0.02,
    yaw: -0.02,
    materialIndex: 2,
  });
  for (let index = 0; index < 10; index += 1) {
    const carrot = new THREE.Group();
    carrot.name = 'market-stall.produce.carrot';
    carrot.position.set(
      -0.25 + (index % 5) * 0.12,
      0.23 + Math.floor(index / 5) * 0.09,
      ((index * 7) % 5 - 2) * 0.035,
    );
    carrot.rotation.z = -0.85 + (index % 4) * 0.11;
    carrot.rotation.y = index * 0.39;
    crate.add(carrot);

    const root = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.27, 10, 2),
      materials.carrot[index % 2],
    );
    root.name = 'market-stall.produce.carrot-root';
    root.position.y = -0.05;
    carrot.add(root);
    for (let leafIndex = 0; leafIndex < 3; leafIndex += 1) {
      const leaf = rectangularMemberBetween(
        new THREE.Vector3(0, 0.09, 0),
        new THREE.Vector3((leafIndex - 1) * 0.035, 0.22 + (leafIndex % 2) * 0.03, (leafIndex % 2) * 0.025),
        0.02,
        0.012,
        materials.carrotLeaf[leafIndex % 2],
        0.004,
      );
      leaf.name = 'market-stall.produce.carrot-leaf';
      carrot.add(leaf);
    }
  }
}

function addBalanceScale(parent, materials) {
  const group = new THREE.Group();
  group.name = 'market-stall.scale';
  group.position.set(0.92, 1.08, -0.26);
  parent.add(group);

  const base = chamferedBox(0.36, 0.06, 0.26, materials.brassDark, 0.025);
  base.name = 'market-stall.scale.base';
  base.position.y = 0.035;
  group.add(base);
  const post = rectangularMemberBetween(
    new THREE.Vector3(0, 0.06, 0),
    new THREE.Vector3(0, 0.62, 0),
    0.04,
    0.04,
    materials.brass,
    0.009,
  );
  post.name = 'market-stall.scale.post';
  group.add(post);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 7), materials.brass);
  finial.name = 'market-stall.scale.finial';
  finial.position.y = 0.66;
  group.add(finial);

  const beam = rectangularMemberBetween(
    new THREE.Vector3(-0.42, 0.58, 0),
    new THREE.Vector3(0.42, 0.6, 0),
    0.035,
    0.028,
    materials.brass,
    0.008,
  );
  beam.name = 'market-stall.scale.balance-beam';
  group.add(beam);
  for (const side of [-1, 1]) {
    for (const z of [-0.07, 0.07]) {
      const chain = tubeFromPoints([
        new THREE.Vector3(side * 0.38, 0.58, 0),
        new THREE.Vector3(side * 0.42, 0.38, z),
        new THREE.Vector3(side * 0.39, 0.24, z * 1.35),
      ], 0.007, materials.ironEdge, {
        tubularSegments: 12,
        radialSegments: 4,
      });
      chain.name = 'market-stall.scale.pan-chain';
      group.add(chain);
    }
    const pan = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 7, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.42),
      materials.brass,
    );
    pan.name = 'market-stall.scale.brass-pan';
    pan.scale.y = 0.32;
    pan.rotation.x = Math.PI;
    pan.position.set(side * 0.4, 0.2, 0);
    group.add(pan);
  }
}

export function createProduceMarketStallModel() {
  const root = makePropRoot('prop.produce-market-stall', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `market-stall-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.72, 0.88] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08 + index * 0.03, 0.12],
    })),
    crateWood: [0x6b4226, 0x795034, 0x5a351f].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `market-stall-crate-wood-${index}` }),
      { offset: [index * 0.13, index * 0.07], repeatScale: [0.8, 0.9] },
    )),
    stone: [0x9b825f, 0x806b4f, 0xb09a73].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `market-stall-limestone-${index}` }),
      { offset: [index * 0.18, index * 0.11], repeatScale: [0.8, 0.8] },
    )),
    moss: surfaceMaterial('moss', 0x445c2b, { name: 'market-stall-foot-moss' }),
    iron: surfaceMaterial('forged-iron', 0x242321, { name: 'market-stall-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x55504a, { name: 'market-stall-worn-iron' }),
    brass: surfaceMaterial('brass', 0x9a7036, { name: 'market-stall-aged-brass' }),
    brassDark: surfaceMaterial('brass', 0x6f4d27, { name: 'market-stall-aged-brass-dark' }),
    rope: surfaceMaterial('rope', 0x8b693a, { name: 'market-stall-hemp-rope' }),
    canvasCream: surfaceMaterial('burlap', 0xd2c2a1, {
      name: 'market-stall-cream-canvas',
      side: THREE.DoubleSide,
    }),
    canvasRed: surfaceMaterial('burlap', 0x8f443d, {
      name: 'market-stall-dusty-red-canvas',
      side: THREE.DoubleSide,
    }),
    apple: [0x9c3228, 0xb84432, 0x7d2824].map((color, index) => surfaceMaterial('fruit', color, {
      name: `market-stall-apple-${index}`,
    })),
    stem: surfaceMaterial('bark', 0x3d2c1a, { name: 'market-stall-fruit-stem' }),
    cabbage: [0x6f873b, 0x879b4c, 0x536f34].map((color, index) => surfaceMaterial('leaf', color, {
      name: `market-stall-cabbage-${index}`,
      side: THREE.DoubleSide,
    })),
    carrot: [
      surfaceMaterial('fruit', 0xc5682f, { name: 'market-stall-carrot-orange' }),
      surfaceMaterial('fruit', 0xa94f27, { name: 'market-stall-carrot-dark' }),
    ],
    carrotLeaf: [
      surfaceMaterial('leaf', 0x3f6c34, { name: 'market-stall-carrot-leaf' }),
      surfaceMaterial('leaf', 0x587c3b, { name: 'market-stall-carrot-leaf-light' }),
    ],
  };

  const foundation = registerNode(root, 'market-stall.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [2.75, 0.24, 1.18], offset: [0, 0.12, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addStoneFeet(foundation, materials);

  const frame = registerNode(root, 'market-stall.frame', new THREE.Group(), {
    collider: { type: 'box', size: [2.58, 2.42, 1.12], offset: [0, 1.34, 0] },
    destructionGroup: 'frame',
  });
  root.add(frame);
  addTimberFrame(frame, materials);

  const counter = registerNode(root, 'market-stall.counter', new THREE.Group(), {
    collider: { type: 'box', size: [2.52, 0.92, 0.9], offset: [0, 0.66, 0.02] },
    destructionGroup: 'counter',
  });
  root.add(counter);
  addCounter(counter, materials);

  const canopy = registerNode(root, 'market-stall.canopy', new THREE.Group(), {
    destructionGroup: 'canopy',
  });
  root.add(canopy);
  addCanopy(canopy, materials);

  const produce = registerNode(root, 'market-stall.produce', new THREE.Group(), {
    destructionGroup: 'produce',
  });
  root.add(produce);
  addApples(produce, materials);
  addCabbages(produce, materials);
  addCarrots(produce, materials);

  const scale = registerNode(root, 'market-stall.scale', new THREE.Group(), {
    destructionGroup: 'scale',
  });
  root.add(scale);
  addBalanceScale(scale, materials);

  addSocket(root, counter, 'socket.market-stall-counter', new THREE.Vector3(0, 1.11, 0));
  addSocket(root, frame, 'socket.market-stall-hanging-sign', new THREE.Vector3(-0.92, 2.08, 0.51));

  root.userData.materialFamilies = [
    'aged-oak',
    'striped-woven-canvas',
    'limestone',
    'blackened-iron',
    'aged-brass',
    'fresh-produce',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/produce_market_stall/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createProduceMarketStallModel;
