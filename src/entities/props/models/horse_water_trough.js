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
  taperedBoxGeometry,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-horse-water-trough-v1-pbr';

function addFoundation(parent, materials) {
  for (const [index, x, yaw] of [
    [0, -0.74, -0.045],
    [1, 0.74, 0.035],
  ]) {
    const block = chamferedBox(0.52, 0.32, 0.75, materials.stone[index], 0.09);
    block.name = 'horse-trough.foundation.limestone-block';
    block.position.set(x, 0.16, 0);
    block.rotation.y = yaw;
    parent.add(block);
    for (const z of [-0.24, 0.27]) {
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 5), materials.moss);
      moss.name = 'horse-trough.foundation.moss';
      moss.scale.set(1.3, 0.18, 0.66);
      moss.position.set(x + (index ? -0.12 : 0.12), 0.32, z);
      parent.add(moss);
    }
  }
}

function addEndPanel(parent, materials, side) {
  const panel = extrudedSilhouette([
    [-0.3, 0],
    [0.3, 0],
    [0.43, 0.56],
    [-0.43, 0.56],
  ], 0.14, materials.oak[side > 0 ? 1 : 2], {
    bevel: 0.03,
    bevelSegments: 2,
  });
  panel.name = 'horse-trough.basin.end-panel';
  panel.rotation.y = Math.PI * 0.5;
  panel.position.set(side * 1.29, 0.34, 0);
  parent.add(panel);

  const cap = chamferedBox(0.18, 0.12, 0.94, materials.oak[side > 0 ? 0 : 3], 0.035);
  cap.name = 'horse-trough.basin.end-cap';
  cap.position.set(side * 1.31, 0.9, 0);
  cap.rotation.z = side * 0.015;
  parent.add(cap);
}

function addBasin(parent, materials) {
  const bottom = chamferedBox(2.56, 0.14, 0.62, materials.oakCross[2], 0.035);
  bottom.name = 'horse-trough.basin.bottom';
  bottom.position.set(0, 0.39, 0);
  parent.add(bottom);

  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row += 1) {
      const wall = chamferedBox(2.58, 0.29, 0.145, materials.oak[(row + (side > 0 ? 1 : 0)) % 4], 0.045);
      wall.name = 'horse-trough.basin.side-plank';
      wall.position.set(0, 0.51 + row * 0.275, side * (0.29 + row * 0.065));
      wall.rotation.x = side * (0.11 + row * 0.018);
      wall.rotation.y = ((row + (side > 0 ? 2 : 0)) % 3 - 1) * 0.006;
      parent.add(wall);

      for (const x of [-1.0, 0, 1.0]) {
        const nail = bolt(0.016, 0.035, materials.ironEdge);
        nail.name = 'horse-trough.basin.plank-nail';
        nail.rotation.x = Math.PI * 0.5;
        nail.position.set(x, 0.55 + row * 0.27, side * (0.38 + row * 0.03));
        parent.add(nail);
      }
    }

    const rim = chamferedBox(2.74, 0.14, 0.19, materials.oak[side > 0 ? 3 : 0], 0.04);
    rim.name = 'horse-trough.basin.top-rim';
    rim.position.set(0, 0.91, side * 0.43);
    rim.rotation.y = side * 0.006;
    parent.add(rim);
  }
  addEndPanel(parent, materials, -1);
  addEndPanel(parent, materials, 1);

  const innerBottom = chamferedBox(2.35, 0.04, 0.48, materials.innerWood, 0.02);
  innerBottom.name = 'horse-trough.basin.wet-inner-bottom';
  innerBottom.position.set(0, 0.55, 0);
  parent.add(innerBottom);

  for (const x of [-0.86, 0, 0.86]) {
    const band = tubeFromPoints([
      new THREE.Vector3(x, 0.4, -0.34),
      new THREE.Vector3(x, 0.35, 0),
      new THREE.Vector3(x, 0.4, 0.34),
      new THREE.Vector3(x, 0.68, 0.42),
      new THREE.Vector3(x, 0.94, 0.45),
      new THREE.Vector3(x, 0.94, -0.45),
      new THREE.Vector3(x, 0.68, -0.42),
    ], 0.026, materials.iron, {
      tubularSegments: 42,
      radialSegments: 7,
      closed: true,
    });
    band.name = 'horse-trough.basin.iron-band';
    parent.add(band);
    for (const side of [-1, 1]) {
      const rivet = bolt(0.023, 0.045, materials.ironEdge);
      rivet.name = 'horse-trough.basin.band-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x, 0.7, side * 0.445);
      parent.add(rivet);
    }
  }

  for (const [x, z, sx, yaw] of [
    [-0.9, 0.424, 0.22, -0.14],
    [0.45, 0.426, 0.18, 0.1],
    [0.92, -0.424, 0.24, 0.08],
  ]) {
    const wetStain = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 7),
      materials.wetWood,
    );
    wetStain.name = 'horse-trough.basin.wet-stain';
    wetStain.scale.set(sx / 0.16, 0.7, 0.055);
    wetStain.position.set(x, 0.66, z);
    wetStain.rotation.z = yaw;
    parent.add(wetStain);
  }
}

function addWater(parent, materials) {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(2.42, 0.69, 18, 6),
    materials.water,
  );
  water.name = 'horse-trough.water.surface';
  water.rotation.x = -Math.PI * 0.5;
  water.position.set(0, 0.79, 0);
  parent.add(water);

  for (const [x, z, scale] of [
    [-0.72, 0.08, 1],
    [-0.65, 0.08, 0.62],
    [0.47, -0.14, 0.76],
  ]) {
    const ripple = torus(0.15 * scale, 0.008, materials.ripple, 5, 28);
    ripple.name = 'horse-trough.water.ripple';
    ripple.rotation.x = Math.PI * 0.5;
    ripple.scale.z = 0.58;
    ripple.position.set(x, 0.802, z);
    parent.add(ripple);
  }

  for (let index = 0; index < 7; index += 1) {
    const leaf = extrudedSilhouette([
      [0, 0.055],
      [0.035, 0.018],
      [0.045, -0.03],
      [0, -0.05],
      [-0.045, -0.03],
      [-0.035, 0.018],
    ], 0.006, materials.leaf[index % 2], {
      bevel: 0.002,
    });
    leaf.name = 'horse-trough.water.floating-leaf';
    leaf.rotation.x = Math.PI * 0.5;
    leaf.rotation.z = index * 0.92;
    leaf.position.set(-0.96 + index * 0.31, 0.805, ((index * 7) % 5 - 2) * 0.09);
    parent.add(leaf);
  }
}

function addPump(parent, materials) {
  const group = new THREE.Group();
  group.name = 'horse-trough.pump';
  group.position.set(-1.56, 0, -0.12);
  parent.add(group);

  const footing = chamferedBox(0.48, 0.27, 0.52, materials.stone[2], 0.085);
  footing.name = 'horse-trough.pump.stone-footing';
  footing.position.y = 0.135;
  footing.rotation.y = -0.055;
  group.add(footing);
  const flange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.22, 0.12, 12),
    materials.iron,
  );
  flange.name = 'horse-trough.pump.flange';
  flange.position.y = 0.33;
  group.add(flange);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const boltHead = bolt(0.02, 0.035, materials.ironEdge);
    boltHead.name = 'horse-trough.pump.flange-bolt';
    boltHead.position.set(Math.cos(angle) * 0.15, 0.4, Math.sin(angle) * 0.15);
    group.add(boltHead);
  }

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 1.18, 12, 4),
    materials.iron,
  );
  body.name = 'horse-trough.pump.body';
  body.position.y = 0.96;
  group.add(body);
  const collar = torus(0.145, 0.025, materials.ironEdge, 7, 26);
  collar.name = 'horse-trough.pump.collar';
  collar.rotation.x = Math.PI * 0.5;
  collar.position.y = 1.45;
  group.add(collar);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.55),
    materials.iron,
  );
  cap.name = 'horse-trough.pump.cap';
  cap.position.y = 1.54;
  group.add(cap);

  const spout = tubeFromPoints([
    new THREE.Vector3(0.04, 1.35, 0),
    new THREE.Vector3(0.24, 1.36, 0.015),
    new THREE.Vector3(0.42, 1.27, 0.035),
    new THREE.Vector3(0.52, 1.12, 0.05),
  ], 0.075, materials.iron, {
    tubularSegments: 28,
    radialSegments: 9,
  });
  spout.name = 'horse-trough.pump.spout';
  group.add(spout);
  const lip = torus(0.078, 0.015, materials.ironEdge, 6, 22);
  lip.name = 'horse-trough.pump.spout-lip';
  lip.rotation.y = Math.PI * 0.5;
  lip.position.set(0.52, 1.11, 0.05);
  group.add(lip);

  const pivot = bolt(0.075, 0.25, materials.ironEdge);
  pivot.name = 'horse-trough.pump.handle-pivot';
  pivot.rotation.x = Math.PI * 0.5;
  pivot.position.set(-0.03, 1.52, 0);
  group.add(pivot);
  const handle = rectangularMemberBetween(
    new THREE.Vector3(-0.03, 1.54, 0),
    new THREE.Vector3(-0.78, 1.88, 0.02),
    0.075,
    0.09,
    materials.handle,
    0.022,
  );
  handle.name = 'horse-trough.pump.wood-handle';
  group.add(handle);
  const grip = chamferedBox(0.19, 0.1, 0.14, materials.handleDark, 0.035);
  grip.name = 'horse-trough.pump.handle-grip';
  grip.position.set(-0.82, 1.9, 0.02);
  grip.rotation.z = 1.14;
  group.add(grip);
}

function addBucket(parent, materials) {
  const group = new THREE.Group();
  group.name = 'horse-trough.bucket';
  group.position.set(1.57, 0.05, 0.36);
  group.rotation.z = -0.055;
  group.rotation.y = 0.18;
  parent.add(group);

  const staveCount = 12;
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(
      taperedBoxGeometry(0.115, 0.075, 0.095, 0.065, 0.55),
      materials.bucketWood[index % 3],
    );
    stave.name = 'horse-trough.bucket.stave';
    stave.position.set(Math.cos(angle) * 0.245, 0.06, Math.sin(angle) * 0.245);
    stave.rotation.y = -angle + Math.PI * 0.5;
    group.add(stave);
  }
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.23, 0.055, 16),
    materials.bucketWood[1],
  );
  bottom.name = 'horse-trough.bucket.bottom';
  bottom.position.y = 0.075;
  group.add(bottom);
  for (const y of [0.18, 0.51]) {
    const hoop = torus(y > 0.3 ? 0.255 : 0.23, 0.018, materials.iron, 7, 32);
    hoop.name = 'horse-trough.bucket.iron-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    group.add(hoop);
    for (const side of [-1, 1]) {
      const rivet = bolt(0.012, 0.026, materials.ironEdge);
      rivet.name = 'horse-trough.bucket.hoop-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(side * (y > 0.3 ? 0.255 : 0.23), y, 0);
      group.add(rivet);
    }
  }

  const ropeHandle = tubeFromPoints([
    new THREE.Vector3(-0.25, 0.48, 0),
    new THREE.Vector3(-0.2, 0.76, -0.02),
    new THREE.Vector3(0, 0.88, -0.05),
    new THREE.Vector3(0.2, 0.76, -0.02),
    new THREE.Vector3(0.25, 0.48, 0),
  ], 0.018, materials.rope, {
    tubularSegments: 30,
    radialSegments: 6,
  });
  ropeHandle.name = 'horse-trough.bucket.rope-handle';
  group.add(ropeHandle);
  for (const side of [-1, 1]) {
    const lug = torus(0.04, 0.011, materials.ironEdge, 6, 20);
    lug.name = 'horse-trough.bucket.handle-lug';
    lug.rotation.y = Math.PI * 0.5;
    lug.position.set(side * 0.255, 0.49, 0);
    group.add(lug);
  }
}

export function createHorseWaterTroughModel() {
  const root = makePropRoot('prop.horse-water-trough', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `horse-trough-oak-${index}` }),
    { offset: [index * 0.16, index * 0.1], repeatScale: [0.72, 0.88] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08 + index * 0.025, 0.12],
    })),
    innerWood: transformMaterialMaps(
      surfaceMaterial('wood', 0x251b15, { name: 'horse-trough-wet-inner-wood' }),
      { repeatScale: [0.8, 0.8] },
    ),
    wetWood: surfaceMaterial('wood', 0x201915, {
      name: 'horse-trough-wet-stain',
      roughness: 0.45,
      clearcoat: 0.12,
      clearcoatRoughness: 0.65,
    }),
    bucketWood: [0x6b4328, 0x53321f, 0x795035].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `horse-trough-bucket-wood-${index}` }),
      { offset: [index * 0.18, index * 0.12], repeatScale: [0.75, 0.9] },
    )),
    stone: [0x947b58, 0x7c684e, 0xab9670].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `horse-trough-limestone-${index}` }),
      { offset: [index * 0.17, index * 0.11], repeatScale: [0.8, 0.8] },
    )),
    moss: surfaceMaterial('moss', 0x425a30, { name: 'horse-trough-foundation-moss' }),
    iron: surfaceMaterial('forged-iron', 0x272725, { name: 'horse-trough-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5a5650, { name: 'horse-trough-worn-iron' }),
    handle: surfaceMaterial('wood', 0x674326, { name: 'horse-trough-pump-handle' }),
    handleDark: surfaceMaterial('wood', 0x432a1c, { name: 'horse-trough-pump-grip' }),
    rope: surfaceMaterial('rope', 0x85683d, { name: 'horse-trough-bucket-rope' }),
    leaf: [
      surfaceMaterial('leaf', 0x6d7138, { name: 'horse-trough-floating-leaf-gold' }),
      surfaceMaterial('leaf', 0x3e6539, { name: 'horse-trough-floating-leaf-green' }),
    ],
    water: new THREE.MeshPhysicalMaterial({
      name: 'horse-trough-clear-water',
      color: 0x658d95,
      roughness: 0.18,
      metalness: 0,
      transmission: 0.1,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.82,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    ripple: new THREE.MeshPhysicalMaterial({
      name: 'horse-trough-water-ripple',
      color: 0xa3c2c2,
      roughness: 0.13,
      metalness: 0,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      depthWrite: false,
    }),
  };

  const foundation = registerNode(root, 'horse-trough.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [2.15, 0.34, 0.82], offset: [0, 0.17, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addFoundation(foundation, materials);

  const basin = registerNode(root, 'horse-trough.basin', new THREE.Group(), {
    collider: { type: 'box', size: [2.82, 0.68, 1.02], offset: [0, 0.64, 0] },
    destructionGroup: 'basin',
  });
  root.add(basin);
  addBasin(basin, materials);

  const water = registerNode(root, 'horse-trough.water', new THREE.Group(), {
    destructionGroup: 'water',
  });
  root.add(water);
  addWater(water, materials);

  const pump = registerNode(root, 'horse-trough.pump', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.31, height: 1.95, offset: [-1.56, 0.97, -0.12] },
    destructionGroup: 'pump',
  });
  root.add(pump);
  addPump(pump, materials);

  const bucket = registerNode(root, 'horse-trough.bucket', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.3, height: 0.92, offset: [1.57, 0.46, 0.36] },
    destructionGroup: 'bucket',
  });
  root.add(bucket);
  addBucket(bucket, materials);

  addSocket(root, water, 'socket.horse-trough-water', new THREE.Vector3(0, 0.81, 0));
  addSocket(root, pump, 'socket.horse-trough-pump-handle', new THREE.Vector3(-2.32, 1.9, -0.1));
  addSocket(root, bucket, 'socket.horse-trough-bucket', new THREE.Vector3(1.57, 0.91, 0.36));

  root.userData.materialFamilies = [
    'waterlogged-aged-oak',
    'clear-water',
    'blackened-iron',
    'worn-iron',
    'limestone',
    'hemp-rope',
    'moss',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/horse_water_trough/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createHorseWaterTroughModel;
