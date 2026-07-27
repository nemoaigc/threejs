import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  finishHeroProp,
  makePropRoot,
  registerNode,
  surfaceMaterial,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-crystal-crate-v1-pbr';

function addPlankedCrate(parent, materials) {
  for (let index = 0; index < 3; index += 1) {
    const y = 0.17 + index * 0.17;
    for (const zSide of [-1, 1]) {
      const plank = chamferedBox(0.88, 0.145, 0.075, materials.oakCross[(index + (zSide > 0 ? 1 : 0)) % 4], 0.028);
      plank.name = `crystal-crate.wall.${zSide > 0 ? 'front' : 'back'}.plank.${index}`;
      plank.position.set(0, y, zSide * 0.355);
      parent.add(plank);
    }
    for (const xSide of [-1, 1]) {
      const side = chamferedBox(0.075, 0.145, 0.65, materials.oak[index % 4], 0.026);
      side.name = `crystal-crate.wall.${xSide > 0 ? 'right' : 'left'}.plank.${index}`;
      side.position.set(xSide * 0.445, y, 0);
      parent.add(side);
    }
  }

  const floor = chamferedBox(0.82, 0.08, 0.62, materials.oakCross[3], 0.03);
  floor.name = 'crystal-crate.floor';
  floor.position.set(0, 0.08, 0);
  parent.add(floor);

  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const post = chamferedBox(0.11, 0.62, 0.11, materials.oak[xSide > 0 ? 1 : 0], 0.03);
      post.name = 'crystal-crate.corner-post';
      post.position.set(xSide * 0.44, 0.31, zSide * 0.35);
      parent.add(post);
      for (const y of [0.08, 0.52]) {
        const corner = chamferedBox(0.135, 0.14, 0.13, materials.iron, 0.025);
        corner.name = 'crystal-crate.iron-corner';
        corner.position.set(xSide * 0.445, y, zSide * 0.36);
        parent.add(corner);
        const rivet = bolt(0.026, 0.055, materials.ironEdge);
        rivet.name = 'crystal-crate.corner-rivet';
        rivet.rotation.x = Math.PI * 0.5;
        rivet.position.set(xSide * 0.445, y, zSide * 0.435);
        parent.add(rivet);
      }
    }
  }

  const frontBrace = chamferedBox(0.84, 0.09, 0.045, materials.iron, 0.02);
  frontBrace.name = 'crystal-crate.front-diagonal-brace';
  frontBrace.position.set(0, 0.3, 0.415);
  frontBrace.rotation.z = -0.42;
  frontBrace.scale.x = 0.92;
  parent.add(frontBrace);
  for (const x of [-0.32, 0.32]) {
    const rivet = bolt(0.025, 0.055, materials.ironEdge);
    rivet.name = 'crystal-crate.front-brace-rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(x, 0.3 - x * 0.43, 0.45);
    parent.add(rivet);
  }
}

function addLid(parent, materials) {
  const lid = new THREE.Group();
  lid.name = 'crystal-crate.lid-pivot';
  lid.position.set(0, 0.52, -0.34);
  lid.rotation.x = -0.27;
  parent.add(lid);

  for (let index = 0; index < 4; index += 1) {
    const plank = chamferedBox(0.84, 0.13, 0.075, materials.oakCross[index % 4], 0.028);
    plank.name = `crystal-crate.lid.plank.${index}`;
    plank.position.set(0, 0.1 + index * 0.13, 0);
    lid.add(plank);
  }
  for (const x of [-0.36, 0.36]) {
    const rail = chamferedBox(0.1, 0.58, 0.09, materials.oak[2], 0.026);
    rail.name = 'crystal-crate.lid.vertical-rail';
    rail.position.set(x, 0.29, 0.015);
    lid.add(rail);
    for (const y of [0.05, 0.53]) {
      const cap = chamferedBox(0.15, 0.13, 0.11, materials.iron, 0.023);
      cap.name = 'crystal-crate.lid.iron-corner';
      cap.position.set(x, y, 0.02);
      lid.add(cap);
    }
  }
  const topRail = chamferedBox(0.86, 0.1, 0.1, materials.oakCross[1], 0.03);
  topRail.name = 'crystal-crate.lid.top-rail';
  topRail.position.set(0, 0.58, 0);
  lid.add(topRail);

  const latch = chamferedBox(0.16, 0.18, 0.05, materials.iron, 0.025);
  latch.name = 'crystal-crate.lid.latch';
  latch.position.set(0, 0.56, 0.075);
  lid.add(latch);

  for (const x of [-0.36, 0.36]) {
    const chain = tubeFromPoints([
      new THREE.Vector3(x, 0.52, -0.28),
      new THREE.Vector3(x * 1.04, 0.76, -0.38),
      new THREE.Vector3(x, 1.0, -0.47),
    ], 0.015, materials.ironEdge, {
      tubularSegments: 28,
      radialSegments: 6,
    });
    chain.name = 'crystal-crate.lid.support-chain';
    parent.add(chain);
    for (let index = 0; index < 7; index += 1) {
      const t = index / 6;
      const link = torus(0.032, 0.008, materials.ironEdge, 5, 14);
      link.name = 'crystal-crate.lid.chain-link';
      link.position.set(
        x * (1 + Math.sin(t * Math.PI) * 0.04),
        THREE.MathUtils.lerp(0.55, 0.98, t),
        THREE.MathUtils.lerp(-0.29, -0.46, t),
      );
      link.rotation.y = index % 2 ? Math.PI * 0.5 : 0;
      parent.add(link);
    }
  }
}

function createCrystalAssembly(materials, {
  x,
  z,
  height,
  radius,
  material,
  id,
  lean = 0,
}) {
  const group = new THREE.Group();
  group.name = `crystal-crate.crystal.${id}`;
  group.position.set(x, 0.19, z);
  group.rotation.z = lean;

  const prismHeight = height * 0.68;
  const prism = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.9, radius * 1.08, prismHeight, 7, 3),
    material,
  );
  prism.name = `${group.name}.prism`;
  prism.position.y = prismHeight * 0.5 + 0.05;
  prism.rotation.y = id === 'cyan' ? 0.17 : id === 'violet' ? -0.11 : 0.08;
  group.add(prism);

  const point = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.92, height * 0.34, 7, 3),
    material,
  );
  point.name = `${group.name}.point`;
  point.position.y = prismHeight + height * 0.16 + 0.05;
  point.rotation.y = prism.rotation.y;
  group.add(point);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.16, radius * 0.2, height * 0.48, 7),
    materials.crystalCore[id],
  );
  core.name = `${group.name}.inner-core`;
  core.position.y = height * 0.34;
  group.add(core);

  for (const [offset, angle, length] of [[-0.34, -0.12, 0.38], [0.23, 0.18, 0.25]]) {
    const glint = chamferedBox(
      radius * 0.055,
      height * length,
      radius * 0.025,
      materials.crystalGlint[id],
      0.004,
    );
    glint.name = `${group.name}.facet-glint`;
    glint.position.set(
      radius * offset,
      height * (0.38 + length * 0.22),
      radius * 1.02,
    );
    glint.rotation.z = angle;
    group.add(glint);
  }

  const clampRing = torus(radius * 1.22, 0.022, materials.brass, 7, 28);
  clampRing.name = `${group.name}.clamp-ring`;
  clampRing.rotation.x = Math.PI * 0.5;
  clampRing.position.y = 0.11;
  group.add(clampRing);
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const brace = chamferedBox(0.045, 0.22, 0.035, materials.brassDark, 0.012);
    brace.name = `${group.name}.clamp-brace`;
    brace.position.set(Math.cos(angle) * radius * 1.08, 0.12, Math.sin(angle) * radius * 1.08);
    brace.rotation.y = -angle;
    group.add(brace);
    const rivet = bolt(0.018, 0.042, materials.brass);
    rivet.name = `${group.name}.clamp-rivet`;
    rivet.position.set(Math.cos(angle) * radius * 1.1, 0.06, Math.sin(angle) * radius * 1.1);
    group.add(rivet);
  }
  return group;
}

function addCrystals(parent, materials) {
  const cyan = createCrystalAssembly(materials, {
    x: -0.08,
    z: -0.04,
    height: 0.72,
    radius: 0.13,
    material: materials.crystals.cyan,
    id: 'cyan',
    lean: -0.02,
  });
  parent.add(cyan);

  const amber = createCrystalAssembly(materials, {
    x: 0.22,
    z: 0.14,
    height: 0.4,
    radius: 0.09,
    material: materials.crystals.amber,
    id: 'amber',
    lean: 0.03,
  });
  parent.add(amber);

  const violetBase = createCrystalAssembly(materials, {
    x: -0.3,
    z: 0.13,
    height: 0.43,
    radius: 0.09,
    material: materials.crystals.violet,
    id: 'violet',
    lean: -0.04,
  });
  parent.add(violetBase);
  for (const [dx, dz, height, lean] of [[-0.075, 0.025, 0.27, -0.16], [0.07, 0.035, 0.31, 0.14]]) {
    const side = createCrystalAssembly(materials, {
      x: -0.3 + dx,
      z: 0.13 + dz,
      height,
      radius: 0.055,
      material: materials.crystals.violet,
      id: 'violet',
      lean,
    });
    side.name = 'crystal-crate.crystal.violet-side';
    parent.add(side);
  }
}

function addQuiltedLining(parent, materials) {
  const cushion = chamferedBox(0.75, 0.12, 0.52, materials.cloth, 0.055);
  cushion.name = 'crystal-crate.lining.cushion';
  cushion.position.set(-0.05, 0.17, 0.01);
  parent.add(cushion);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const tuft = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 6),
        materials.clothDark,
      );
      tuft.name = 'crystal-crate.lining.tuft';
      tuft.scale.set(1, 0.45, 1);
      tuft.position.set(-0.33 + column * 0.12, 0.238, -0.2 + row * 0.13);
      parent.add(tuft);
    }
  }
}

function addBottle(parent, materials, {
  x,
  z,
  color,
  id,
  profile = 0,
}) {
  const bottleMaterial = new THREE.MeshPhysicalMaterial({
    name: `crystal-crate-bottle-${id}`,
    color,
    roughness: 0.2,
    metalness: 0,
    transmission: 0.28,
    thickness: 0.03,
    transparent: true,
    opacity: 0.86,
    envMapIntensity: 0.7,
  });
  const body = new THREE.Mesh(
    profile === 2
      ? new THREE.BoxGeometry(0.1, 0.14, 0.1)
      : new THREE.CylinderGeometry(0.045 + profile * 0.008, 0.06, 0.14, 10),
    bottleMaterial,
  );
  body.name = `crystal-crate.bottle.${id}.body`;
  body.position.set(x, 0.39, z);
  parent.add(body);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.027, 0.032, 0.08, 10),
    bottleMaterial,
  );
  neck.name = `crystal-crate.bottle.${id}.neck`;
  neck.position.set(x, 0.5, z);
  parent.add(neck);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.055, 9), materials.cork);
  cork.name = `crystal-crate.bottle.${id}.cork`;
  cork.position.set(x, 0.565, z);
  parent.add(cork);
}

function addBottleRack(parent, materials) {
  const rackBack = chamferedBox(0.31, 0.23, 0.045, materials.oak[2], 0.018);
  rackBack.name = 'crystal-crate.bottle-rack.back';
  rackBack.position.set(0.29, 0.36, -0.16);
  parent.add(rackBack);
  const rackBase = chamferedBox(0.34, 0.055, 0.25, materials.oakCross[2], 0.018);
  rackBase.name = 'crystal-crate.bottle-rack.base';
  rackBase.position.set(0.29, 0.275, -0.05);
  parent.add(rackBase);
  const rackFront = chamferedBox(0.34, 0.055, 0.04, materials.oakCross[1], 0.014);
  rackFront.name = 'crystal-crate.bottle-rack.front-rail';
  rackFront.position.set(0.29, 0.365, 0.075);
  parent.add(rackFront);
  for (const x of [0.19, 0.29, 0.39]) {
    const divider = chamferedBox(0.022, 0.17, 0.23, materials.oakCross[1], 0.009);
    divider.name = 'crystal-crate.bottle-rack.divider';
    divider.position.set(x, 0.37, -0.035);
    parent.add(divider);
  }
  addBottle(parent, materials, { x: 0.2, z: -0.01, color: 0x5b2b8b, id: 'violet', profile: 0 });
  addBottle(parent, materials, { x: 0.31, z: -0.02, color: 0x1f6b54, id: 'green', profile: 1 });
  addBottle(parent, materials, { x: 0.41, z: -0.02, color: 0x1c668e, id: 'blue', profile: 2 });
}

function addSideAttachments(parent, materials) {
  const handle = tubeFromPoints([
    new THREE.Vector3(-0.48, 0.42, 0.16),
    new THREE.Vector3(-0.6, 0.42, 0.13),
    new THREE.Vector3(-0.64, 0.31, 0.04),
    new THREE.Vector3(-0.58, 0.23, -0.04),
    new THREE.Vector3(-0.48, 0.25, -0.08),
  ], 0.025, materials.rope, {
    tubularSegments: 30,
    radialSegments: 8,
  });
  handle.name = 'crystal-crate.rope-handle';
  parent.add(handle);

  const scroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.28, 12),
    materials.parchment,
  );
  scroll.name = 'crystal-crate.scroll-tag';
  scroll.position.set(-0.55, 0.18, 0.23);
  scroll.rotation.z = 0.16;
  parent.add(scroll);
  for (const y of [0.08, 0.27]) {
    const tie = torus(0.058, 0.01, materials.rope, 6, 18);
    tie.name = 'crystal-crate.scroll-tie';
    tie.rotation.x = Math.PI * 0.5;
    tie.position.set(-0.55, y, 0.23);
    parent.add(tie);
  }
}

export function createCrystalCrateModel() {
  const root = makePropRoot('prop.crystal-crate', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `crystal-crate-oak-${index}` }),
    {
      offset: [index * 0.181, index * 0.097],
      repeatScale: [0.72 + index * 0.05, 0.9 + (index % 2) * 0.08],
    },
  ));
  const makeCrystalMaterial = (name, color, emissive, attenuationColor) => new THREE.MeshPhysicalMaterial({
    name,
    color,
    emissive,
    emissiveIntensity: 0.62,
    roughness: 0.1,
    metalness: 0,
    transmission: 0.5,
    thickness: 0.24,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    ior: 1.52,
    attenuationColor,
    attenuationDistance: 0.55,
    envMapIntensity: 1.15,
    clearcoat: 0.72,
    clearcoatRoughness: 0.08,
  });
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08, 0.12],
    })),
    iron: surfaceMaterial('forged-iron', 0x282624, { name: 'crystal-crate-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5a554f, { name: 'crystal-crate-worn-iron' }),
    brass: surfaceMaterial('brass', 0x9d7436, { name: 'crystal-crate-aged-brass' }),
    brassDark: surfaceMaterial('brass', 0x5d421f, { name: 'crystal-crate-dark-brass' }),
    rope: surfaceMaterial('rope', 0x8d7047, { name: 'crystal-crate-hemp-rope' }),
    cloth: surfaceMaterial('burlap', 0x6e1f2d, { name: 'crystal-crate-wine-cloth' }),
    clothDark: surfaceMaterial('burlap', 0x321018, { name: 'crystal-crate-cloth-tufts' }),
    cork: surfaceMaterial('cork', 0x9a7043, { name: 'crystal-crate-bottle-corks' }),
    parchment: surfaceMaterial('parchment', 0xc9a978, { name: 'crystal-crate-scroll-tag' }),
    crystals: {
      cyan: makeCrystalMaterial('crystal-crate-cyan-mineral', 0x0c91b4, 0x075f78, 0x0aa9ca),
      violet: makeCrystalMaterial('crystal-crate-violet-mineral', 0x6031bc, 0x2e176f, 0x6b3bc4),
      amber: makeCrystalMaterial('crystal-crate-amber-mineral', 0xc67b19, 0x7a3a0b, 0xd5912b),
    },
    crystalCore: {
      cyan: new THREE.MeshStandardMaterial({ color: 0x7de7f5, emissive: 0x168da9, emissiveIntensity: 0.85, roughness: 0.12, transparent: true, opacity: 0.38, depthWrite: false }),
      violet: new THREE.MeshStandardMaterial({ color: 0xb593ef, emissive: 0x4a2999, emissiveIntensity: 0.78, roughness: 0.14, transparent: true, opacity: 0.4, depthWrite: false }),
      amber: new THREE.MeshStandardMaterial({ color: 0xf3bf68, emissive: 0x9e5812, emissiveIntensity: 0.75, roughness: 0.14, transparent: true, opacity: 0.4, depthWrite: false }),
    },
    crystalGlint: {
      cyan: new THREE.MeshBasicMaterial({ color: 0xc6faff, transparent: true, opacity: 0.48, depthWrite: false }),
      violet: new THREE.MeshBasicMaterial({ color: 0xe7d8ff, transparent: true, opacity: 0.42, depthWrite: false }),
      amber: new THREE.MeshBasicMaterial({ color: 0xffe7ad, transparent: true, opacity: 0.42, depthWrite: false }),
    },
  };

  const crate = registerNode(root, 'crystal-crate.body', new THREE.Group(), {
    collider: { type: 'box', size: [0.98, 0.62, 0.78], offset: [0, 0.31, 0] },
    destructionGroup: 'crate',
  });
  root.add(crate);
  addPlankedCrate(crate, materials);

  const lid = registerNode(root, 'crystal-crate.lid', new THREE.Group(), {
    collider: { type: 'box', size: [0.92, 0.66, 0.1], offset: [0, 0.84, -0.43] },
    destructionGroup: 'lid',
  });
  root.add(lid);
  addLid(lid, materials);
  addSocket(root, lid, 'socket.crystal-crate-lid-hinge', new THREE.Vector3(0, 0.52, -0.34));

  const contents = registerNode(root, 'crystal-crate.contents', new THREE.Group(), {
    collider: { type: 'box', size: [0.76, 0.76, 0.55], offset: [-0.04, 0.54, 0.02] },
    destructionGroup: 'contents',
  });
  root.add(contents);
  addQuiltedLining(contents, materials);
  addCrystals(contents, materials);
  addSocket(root, contents, 'socket.crystal-crate-cyan', new THREE.Vector3(-0.08, 0.72, -0.04));
  addSocket(root, contents, 'socket.crystal-crate-violet', new THREE.Vector3(-0.3, 0.48, 0.13));
  addSocket(root, contents, 'socket.crystal-crate-amber', new THREE.Vector3(0.22, 0.45, 0.14));

  const bottles = registerNode(root, 'crystal-crate.bottle-rack', new THREE.Group(), {
    destructionGroup: 'bottles',
  });
  root.add(bottles);
  addBottleRack(bottles, materials);

  const attachments = registerNode(root, 'crystal-crate.attachments', new THREE.Group(), {
    destructionGroup: 'attachments',
  });
  root.add(attachments);
  addSideAttachments(attachments, materials);

  root.userData.materialFamilies = [
    'aged-oak',
    'forged-iron',
    'aged-brass',
    'hemp-rope',
    'quilted-cloth',
    'cork',
    'colored-glass',
    'emissive-crystal-mineral',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/crystal_crate/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createCrystalCrateModel;
