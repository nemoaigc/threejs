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

const VERSION = 'img2threejs-grain-sack-pile-v1-pbr';

function createSoftSackGeometry({
  height = 0.68,
  width = 0.58,
  depth = 0.42,
  seed = 0,
  open = false,
} = {}) {
  const ringCount = 12;
  const segments = 24;
  const profile = open
    ? [0.62, 0.83, 0.96, 1.02, 1.05, 1.04, 1.0, 0.96, 0.92, 0.9, 0.88, 0.87, 0.86]
    : [0.58, 0.82, 0.96, 1.03, 1.06, 1.04, 1.0, 0.94, 0.82, 0.66, 0.48, 0.34, 0.28];
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= ringCount; ring += 1) {
    const t = ring / ringCount;
    const y = (t - 0.5) * height;
    const ringProfile = profile[ring];
    const centerX = Math.sin(t * Math.PI * 1.6 + seed * 0.73) * width * 0.026;
    const centerZ = Math.cos(t * Math.PI * 1.3 + seed * 0.41) * depth * 0.02;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const irregularity = 1
        + Math.sin(angle * 3 + seed * 1.7 + t * 2.2) * 0.035
        + Math.sin(angle * 7 - seed * 0.9 + t * 4.1) * 0.014;
      const shoulderCollapse = 1 - Math.max(0, t - 0.72) * (0.07 + Math.cos(angle * 2 + seed) * 0.025);
      positions.push(
        centerX + Math.cos(angle) * width * 0.5 * ringProfile * irregularity,
        y + Math.sin(angle * 2.0 + seed) * 0.006 * Math.sin(t * Math.PI),
        centerZ + Math.sin(angle) * depth * 0.5 * ringProfile * irregularity * shoulderCollapse,
      );
      uvs.push(segment / segments, t);
      if (ring < ringCount) {
        const next = ring * segments + (segment + 1) % segments;
        const current = ring * segments + segment;
        const upper = (ring + 1) * segments + segment;
        const upperNext = (ring + 1) * segments + (segment + 1) % segments;
        indices.push(current, next, upper, next, upperNext, upper);
      }
    }
  }
  const bottomCenter = positions.length / 3;
  positions.push(0, -height * 0.5, 0);
  uvs.push(0.5, 0.5);
  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    indices.push(bottomCenter, next, segment);
  }
  if (!open) {
    const topCenter = positions.length / 3;
    positions.push(0, height * 0.5, 0);
    uvs.push(0.5, 0.5);
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const top = ringCount * segments + segment;
      const topNext = ringCount * segments + next;
      indices.push(topCenter, top, topNext);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createGatheredNeckGeometry(seed = 0) {
  const rings = [
    { y: 0, radius: 0.085 },
    { y: 0.055, radius: 0.105 },
    { y: 0.12, radius: 0.118 },
    { y: 0.17, radius: 0.075 },
    { y: 0.205, radius: 0.025 },
  ];
  const segments = 12;
  const positions = [];
  const uvs = [];
  const indices = [];
  rings.forEach((ring, ringIndex) => {
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const lobe = 1 + Math.sin(angle * 5 + seed) * 0.15 + Math.sin(angle * 2 - seed) * 0.06;
      positions.push(
        Math.cos(angle) * ring.radius * lobe,
        ring.y + (ringIndex === rings.length - 1 ? Math.sin(angle * 3 + seed) * 0.012 : 0),
        Math.sin(angle) * ring.radius * lobe * 0.72,
      );
      uvs.push(segment / segments, ringIndex / (rings.length - 1));
      if (ringIndex < rings.length - 1) {
        const current = ringIndex * segments + segment;
        const next = ringIndex * segments + (segment + 1) % segments;
        const upper = (ringIndex + 1) * segments + segment;
        const upperNext = (ringIndex + 1) * segments + (segment + 1) % segments;
        indices.push(current, next, upper, next, upperNext, upper);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addPallet(parent, materials) {
  for (const z of [-0.42, 0, 0.42]) {
    const runner = chamferedBox(1.86, 0.15, 0.15, materials.oak[1], 0.035);
    runner.name = 'grain-sacks.pallet.runner';
    runner.position.set(0, 0.14, z);
    parent.add(runner);
  }
  for (let index = 0; index < 7; index += 1) {
    const x = -0.8 + index * 0.265;
    const plank = chamferedBox(0.225, 0.075, 1.03, materials.oakCross[index % 4], 0.024);
    plank.name = 'grain-sacks.pallet.plank';
    plank.position.set(x, 0.245, 0);
    parent.add(plank);
    for (const z of [-0.38, 0.38]) {
      const nail = bolt(0.016, 0.045, materials.iron);
      nail.name = 'grain-sacks.pallet.nail';
      nail.position.set(x, 0.292, z);
      parent.add(nail);
    }
  }
  for (const x of [-0.72, 0, 0.72]) {
    for (const z of [-0.36, 0.36]) {
      const foot = chamferedBox(0.24, 0.11, 0.22, materials.oak[(Math.round((x + 1) * 8) + (z > 0 ? 1 : 0)) % 4], 0.032);
      foot.name = 'grain-sacks.pallet.foot';
      foot.position.set(x, 0.055, z);
      parent.add(foot);
    }
  }
}

function addSeam(group, materials, {
  height,
  width,
  depth,
  id,
  side = -1,
}) {
  const z = depth * 0.46;
  const seam = tubeFromPoints([
    new THREE.Vector3(side * width * 0.32, -height * 0.4, z * 0.84),
    new THREE.Vector3(side * width * 0.48, -height * 0.12, z),
    new THREE.Vector3(side * width * 0.4, height * 0.2, z),
    new THREE.Vector3(side * width * 0.18, height * 0.42, z * 0.86),
  ], 0.0065, materials.thread, {
    tubularSegments: 24,
    radialSegments: 5,
  });
  seam.name = `grain-sacks.sack.${id}.side-seam`;
  group.add(seam);
  for (let index = 0; index < 9; index += 1) {
    const t = (index + 0.5) / 9;
    const y = -height * 0.37 + t * height * 0.7;
    const x = side * width * (0.24 + Math.sin(t * Math.PI) * 0.18);
    const stitch = chamferedBox(0.026, 0.005, 0.006, materials.thread, 0.002);
    stitch.name = `grain-sacks.sack.${id}.stitch`;
    stitch.position.set(x, y, z + 0.008);
    stitch.rotation.z = side * (0.28 + (index % 2) * 0.08);
    group.add(stitch);
  }
}

function addWheatMark(group, materials, {
  y = 0.29,
  z = 0.235,
  scale = 1,
}) {
  const stem = tubeFromPoints([
    new THREE.Vector3(0, y - 0.1 * scale, z),
    new THREE.Vector3(0, y + 0.11 * scale, z),
  ], 0.008 * scale, materials.mark, { tubularSegments: 8, radialSegments: 4 });
  stem.name = 'grain-sacks.wheat-mark.stem';
  group.add(stem);
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index += 1) {
      const cy = y - 0.02 * scale + index * 0.055 * scale;
      const branch = tubeFromPoints([
        new THREE.Vector3(0, cy, z),
        new THREE.Vector3(side * (0.045 + index * 0.006) * scale, cy + 0.04 * scale, z + 0.002),
      ], 0.0065 * scale, materials.mark, { tubularSegments: 6, radialSegments: 4 });
      branch.name = 'grain-sacks.wheat-mark.ear';
      group.add(branch);
    }
  }
}

function addPatch(group, materials, width, depth, height, id) {
  const patch = chamferedBox(0.15, 0.12, 0.009, materials.patch, 0.018);
  patch.name = `grain-sacks.sack.${id}.repair-patch`;
  patch.position.set(-width * 0.12, -height * 0.06, depth * 0.49);
  patch.rotation.z = -0.1;
  group.add(patch);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const stitch = chamferedBox(0.026, 0.006, 0.008, materials.thread, 0.002);
    stitch.name = `grain-sacks.sack.${id}.patch-stitch`;
    stitch.position.set(
      -width * 0.12 + Math.cos(angle) * 0.07,
      -height * 0.06 + Math.sin(angle) * 0.052,
      depth * 0.5,
    );
    stitch.rotation.z = angle;
    group.add(stitch);
  }
}

function addClosedSack(parent, materials, {
  id,
  position,
  rotationY = 0,
  rotationZ = 0,
  scale = 1,
  materialIndex = 0,
  mark = false,
  patch = false,
}) {
  const group = new THREE.Group();
  group.name = `grain-sacks.sack.${id}`;
  group.position.copy(position);
  group.rotation.y = rotationY;
  group.rotation.z = rotationZ;
  group.scale.set(scale, scale, scale);
  parent.add(group);

  const height = 0.68;
  const width = 0.58;
  const depth = 0.42;
  const body = new THREE.Mesh(
    createSoftSackGeometry({
      height,
      width,
      depth,
      seed: id.length * 0.73 + materialIndex * 1.9,
    }),
    materials.burlap[materialIndex % materials.burlap.length],
  );
  body.name = `grain-sacks.sack.${id}.body`;
  group.add(body);

  const neck = new THREE.Mesh(
    createGatheredNeckGeometry(id.length * 0.87 + materialIndex),
    materials.burlap[(materialIndex + 1) % materials.burlap.length],
  );
  neck.name = `grain-sacks.sack.${id}.gathered-neck`;
  neck.position.y = height * 0.44;
  group.add(neck);

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const fold = tubeFromPoints([
      new THREE.Vector3(Math.cos(angle) * 0.075, height * 0.43, Math.sin(angle) * 0.055),
      new THREE.Vector3(Math.cos(angle) * 0.1, height * 0.51, Math.sin(angle) * 0.072),
      new THREE.Vector3(Math.cos(angle + 0.12) * 0.045, height * 0.68, Math.sin(angle + 0.12) * 0.035),
    ], 0.003, materials.burlap[materialIndex % materials.burlap.length], {
      tubularSegments: 10,
      radialSegments: 4,
    });
    fold.name = `grain-sacks.sack.${id}.neck-crease`;
    group.add(fold);
  }

  const tie = torus(0.1, 0.014, materials.rope, 7, 24);
  tie.name = `grain-sacks.sack.${id}.neck-tie`;
  tie.rotation.x = Math.PI * 0.5;
  tie.scale.z = 0.72;
  tie.position.y = height * 0.44;
  group.add(tie);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 5), materials.rope);
  knot.name = `grain-sacks.sack.${id}.tie-knot`;
  knot.position.set(0.09, height * 0.44, 0.045);
  group.add(knot);
  for (const side of [-1, 1]) {
    const tail = tubeFromPoints([
      new THREE.Vector3(0.09, height * 0.44, 0.045),
      new THREE.Vector3(0.11 + side * 0.02, height * 0.37 - (side > 0 ? 0.02 : 0), 0.07),
      new THREE.Vector3(0.14 + side * 0.035, height * 0.3 - (side > 0 ? 0.025 : 0), 0.075),
    ], 0.0065, materials.rope, { tubularSegments: 10, radialSegments: 5 });
    tail.name = `grain-sacks.sack.${id}.tie-tail`;
    group.add(tail);
  }

  for (let index = 0; index < 3; index += 1) {
    const side = index - 1;
    const crease = tubeFromPoints([
      new THREE.Vector3(side * width * 0.18, -height * 0.42, depth * 0.47),
      new THREE.Vector3(side * width * 0.16 + (index % 2 ? 0.025 : -0.015), -height * 0.25, depth * 0.5),
      new THREE.Vector3(side * width * 0.12, -height * 0.08, depth * 0.49),
    ], 0.003, materials.crease, {
      tubularSegments: 12,
      radialSegments: 4,
    });
    crease.name = `grain-sacks.sack.${id}.compression-crease`;
    group.add(crease);
  }
  if (id.startsWith('bottom')) {
    addSeam(group, materials, {
      height,
      width,
      depth,
      id,
      side: id.length % 2 ? -1 : 1,
    });
  }
  if (mark) addWheatMark(group, materials, { y: -0.02, z: depth * 0.5, scale: 0.9 });
  if (patch) addPatch(group, materials, width, depth, height, id);
}

function addOpenSack(parent, materials) {
  const group = new THREE.Group();
  group.name = 'grain-sacks.open-sack';
  group.position.set(0.02, 0.56, 0.34);
  parent.add(group);

  const body = new THREE.Mesh(
    createSoftSackGeometry({
      height: 0.5,
      width: 0.58,
      depth: 0.44,
      seed: 4.6,
      open: true,
    }),
    materials.burlap[1],
  );
  body.name = 'grain-sacks.open-sack.body';
  group.add(body);

  const rimPoints = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    rimPoints.push(new THREE.Vector3(
      Math.cos(angle) * (0.255 + Math.sin(angle * 3) * 0.008),
      0.25 + Math.sin(angle * 2 + 0.7) * 0.012,
      Math.sin(angle) * 0.19,
    ));
  }
  const rim = tubeFromPoints(rimPoints, 0.021, materials.burlapEdge, {
    tubularSegments: 44,
    radialSegments: 7,
    closed: true,
  });
  rim.name = 'grain-sacks.open-sack.folded-rim';
  group.add(rim);

  const grainSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.245, 0.035, 22),
    materials.grain,
  );
  grainSurface.name = 'grain-sacks.open-sack.grain-surface';
  grainSurface.position.y = 0.235;
  grainSurface.scale.z = 0.72;
  group.add(grainSurface);
  for (let index = 0; index < 24; index += 1) {
    const angle = index * 2.39996;
    const radius = 0.04 + (index % 6) * 0.028;
    const kernel = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 7, 5),
      materials.grainKernel[index % 2],
    );
    kernel.name = 'grain-sacks.open-sack.kernel';
    kernel.scale.set(0.55, 0.38, 1.15);
    kernel.rotation.y = angle;
    kernel.position.set(
      Math.cos(angle) * radius,
      0.265 + (index % 3) * 0.003,
      Math.sin(angle) * radius * 0.68,
    );
    group.add(kernel);
  }
}

function addScoopAndSpill(parent, materials) {
  const scoop = new THREE.Group();
  scoop.name = 'grain-sacks.spill.iron-scoop';
  scoop.position.set(0.7, 0.11, 0.62);
  scoop.rotation.y = -0.35;
  parent.add(scoop);

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 20, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    materials.scoop,
  );
  bowl.name = 'grain-sacks.spill.scoop-bowl';
  bowl.scale.set(0.8, 0.46, 1.15);
  bowl.position.y = 0.085;
  scoop.add(bowl);
  const rim = torus(0.19, 0.012, materials.scoopEdge, 6, 30);
  rim.name = 'grain-sacks.spill.scoop-rim';
  rim.rotation.x = Math.PI * 0.5;
  rim.scale.set(0.8, 1.15, 1);
  rim.position.y = 0.085;
  scoop.add(rim);
  const handle = tubeFromPoints([
    new THREE.Vector3(0, 0.08, -0.16),
    new THREE.Vector3(0.03, 0.1, -0.31),
    new THREE.Vector3(0.055, 0.12, -0.48),
  ], 0.025, materials.scoop, {
    tubularSegments: 16,
    radialSegments: 7,
  });
  handle.name = 'grain-sacks.spill.scoop-handle';
  scoop.add(handle);

  for (let index = 0; index < 46; index += 1) {
    const angle = index * 2.39996;
    const radius = 0.04 + (index % 10) * 0.025;
    const kernel = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 7, 5),
      materials.grainKernel[index % 2],
    );
    kernel.name = 'grain-sacks.spill.kernel';
    kernel.scale.set(0.5, 0.34, 1.12);
    kernel.rotation.y = angle * 1.7;
    kernel.position.set(
      0.55 + Math.cos(angle) * radius * 1.4,
      0.018 + (index % 4) * 0.002,
      0.65 + Math.sin(angle) * radius * 0.72,
    );
    parent.add(kernel);
  }
}

export function createGrainSackPileModel() {
  const root = makePropRoot('prop.grain-sack-pile', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `grain-sacks-pallet-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.76, 0.9] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08, 0.12],
    })),
    burlap: [0xa98759, 0xb89b6d, 0x8d704c].map((color, index) => transformMaterialMaps(
      surfaceMaterial('burlap', color, { name: `grain-sacks-burlap-${index}` }),
      { offset: [index * 0.19, index * 0.13], repeatScale: [0.85, 0.85] },
    )),
    burlapEdge: surfaceMaterial('burlap', 0x9f8057, { name: 'grain-sacks-folded-rim' }),
    thread: surfaceMaterial('rope', 0x6f4f30, { name: 'grain-sacks-thick-thread' }),
    rope: surfaceMaterial('rope', 0x76552f, { name: 'grain-sacks-hemp-ties' }),
    patch: surfaceMaterial('burlap', 0x5a402d, { name: 'grain-sacks-dark-repair-patch' }),
    mark: surfaceMaterial('burlap', 0x59432d, { name: 'grain-sacks-wheat-stencil' }),
    crease: surfaceMaterial('burlap', 0x7b603f, { name: 'grain-sacks-fabric-crease' }),
    grain: surfaceMaterial('grain', 0xb78537, { name: 'grain-sacks-grain-mass' }),
    grainKernel: [
      surfaceMaterial('grain', 0xc69a4b, { name: 'grain-sacks-golden-kernel' }),
      surfaceMaterial('grain', 0xa9752e, { name: 'grain-sacks-dark-kernel' }),
    ],
    scoop: surfaceMaterial('worn-iron', 0x4b4640, {
      name: 'grain-sacks-worn-scoop',
      side: THREE.DoubleSide,
    }),
    scoopEdge: surfaceMaterial('worn-iron', 0x726a5e, {
      name: 'grain-sacks-polished-scoop-edge',
    }),
    iron: surfaceMaterial('forged-iron', 0x2a2825, { name: 'grain-sacks-pallet-nails' }),
  };

  const pallet = registerNode(root, 'grain-sacks.pallet', new THREE.Group(), {
    collider: { type: 'box', size: [1.98, 0.3, 1.15], offset: [0, 0.15, 0] },
    destructionGroup: 'pallet',
  });
  root.add(pallet);
  addPallet(pallet, materials);

  const sacks = registerNode(root, 'grain-sacks.closed-sacks', new THREE.Group(), {
    collider: { type: 'box', size: [1.65, 1.25, 0.95], offset: [0, 0.86, -0.05] },
    destructionGroup: 'closed-sacks',
  });
  root.add(sacks);
  addClosedSack(sacks, materials, {
    id: 'bottom-left',
    position: new THREE.Vector3(-0.43, 0.66, 0.02),
    rotationY: -0.08,
    scale: 1.02,
    materialIndex: 0,
    mark: true,
    patch: true,
  });
  addClosedSack(sacks, materials, {
    id: 'bottom-right',
    position: new THREE.Vector3(0.46, 0.65, -0.01),
    rotationY: 0.07,
    scale: 0.98,
    materialIndex: 2,
    patch: true,
  });
  addClosedSack(sacks, materials, {
    id: 'rear-left',
    position: new THREE.Vector3(-0.42, 0.92, -0.28),
    rotationY: 0.04,
    rotationZ: -0.12,
    scale: 0.9,
    materialIndex: 1,
  });
  addClosedSack(sacks, materials, {
    id: 'rear-right',
    position: new THREE.Vector3(0.43, 0.91, -0.3),
    rotationY: -0.06,
    rotationZ: 0.1,
    scale: 0.88,
    materialIndex: 0,
  });
  addClosedSack(sacks, materials, {
    id: 'top',
    position: new THREE.Vector3(0.02, 1.28, -0.16),
    rotationY: 0.03,
    rotationZ: Math.PI * 0.5,
    scale: 0.84,
    materialIndex: 1,
    mark: true,
  });
  addSocket(root, sacks, 'socket.grain-sacks-top', new THREE.Vector3(0, 1.63, -0.16));

  const openSack = registerNode(root, 'grain-sacks.open-sack', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.34, height: 0.58, offset: [0.02, 0.57, 0.34] },
    destructionGroup: 'open-sack',
  });
  root.add(openSack);
  addOpenSack(openSack, materials);
  addSocket(root, openSack, 'socket.grain-sacks-grain', new THREE.Vector3(0.02, 0.83, 0.34));

  const spill = registerNode(root, 'grain-sacks.spill', new THREE.Group(), {
    destructionGroup: 'grain-spill',
  });
  root.add(spill);
  addScoopAndSpill(spill, materials);

  root.userData.materialFamilies = [
    'woven-burlap',
    'thick-thread',
    'hemp-rope',
    'golden-grain',
    'aged-oak',
    'worn-iron',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/grain_sack_pile/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createGrainSackPileModel;
