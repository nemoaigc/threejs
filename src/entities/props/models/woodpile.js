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

const VERSION = 'img2threejs-woodpile-v1-pbr';

function halfLogPoints(radius, segments = 10) {
  const points = [[-radius, 0]];
  for (let index = 0; index <= segments; index += 1) {
    const angle = Math.PI - (index / segments) * Math.PI;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  points.push([radius, 0]);
  return points;
}

function addLog(parent, materials, {
  x,
  y,
  z,
  radius,
  length,
  rotationZ = 0,
  index,
}) {
  const points = halfLogPoints(radius);
  const body = extrudedSilhouette(points, length, materials.bark[index % 3], {
    bevel: 0.012,
  });
  body.name = `woodpile.log.${index}.bark`;
  body.position.set(x, y, z);
  body.rotation.z = rotationZ;
  parent.add(body);

  const faceShape = new THREE.Shape();
  faceShape.moveTo(points[0][0], points[0][1]);
  for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
    faceShape.lineTo(points[pointIndex][0], points[pointIndex][1]);
  }
  faceShape.closePath();
  const face = new THREE.Mesh(
    new THREE.ShapeGeometry(faceShape, 4),
    materials.split[index % 3],
  );
  face.name = `woodpile.log.${index}.split-face`;
  face.position.set(x, y, z + length * 0.5 + 0.014);
  face.rotation.z = rotationZ;
  parent.add(face);

  for (let ringIndex = 0; ringIndex < 2; ringIndex += 1) {
    const ringRadius = radius * (0.35 + ringIndex * 0.28);
    const ringPoints = [];
    for (let pointIndex = 0; pointIndex <= 12; pointIndex += 1) {
      const angle = Math.PI - (pointIndex / 12) * Math.PI;
      const localX = Math.cos(angle) * ringRadius;
      const localY = Math.sin(angle) * ringRadius * 0.86;
      const cos = Math.cos(rotationZ);
      const sin = Math.sin(rotationZ);
      ringPoints.push(new THREE.Vector3(
        x + localX * cos - localY * sin,
        y + localX * sin + localY * cos,
        z + length * 0.5 + 0.021,
      ));
    }
    const ring = tubeFromPoints(ringPoints, 0.004, materials.ring, {
      tubularSegments: 24,
      radialSegments: 4,
    });
    ring.name = `woodpile.log.${index}.growth-ring`;
    parent.add(ring);
  }

  if (index % 3 === 0) {
    const crack = chamferedBox(radius * 0.7, 0.009, 0.008, materials.ring, 0.003);
    crack.name = `woodpile.log.${index}.radial-crack`;
    crack.position.set(x, y + radius * 0.42, z + length * 0.5 + 0.023);
    crack.rotation.z = rotationZ + (index % 2 ? 0.55 : -0.45);
    parent.add(crack);
  }
}

function addRackFrame(parent, materials) {
  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const bottom = new THREE.Vector3(xSide * 0.78, 0.14, zSide * 0.3);
      const top = new THREE.Vector3(xSide * 0.7, 1.08, zSide * 0.27);
      const post = rectangularMemberBetween(
        bottom,
        top,
        0.12,
        0.12,
        materials.oak[xSide > 0 ? 1 : 0],
        0.028,
      );
      post.name = `woodpile.frame.post.${xSide}.${zSide}`;
      parent.add(post);
      const cap = chamferedBox(0.15, 0.11, 0.15, materials.oakCross[(xSide + zSide + 2) % 3], 0.04);
      cap.name = 'woodpile.frame.post-cap';
      cap.position.copy(top).add(new THREE.Vector3(0, 0.055, 0));
      parent.add(cap);
    }
  }

  for (const [y, z, name] of [
    [0.22, 0.3, 'front-lower'],
    [0.22, -0.3, 'rear-lower'],
    [0.96, 0.28, 'front-upper'],
    [0.96, -0.28, 'rear-upper'],
  ]) {
    const rail = chamferedBox(1.48, 0.12, 0.11, materials.oakCross[y > 0.5 ? 2 : 3], 0.028);
    rail.name = `woodpile.frame.${name}-rail`;
    rail.position.set(0, y, z);
    parent.add(rail);
  }
  for (const side of [-1, 1]) {
    const sideRail = chamferedBox(0.11, 0.11, 0.58, materials.oak[2], 0.025);
    sideRail.name = 'woodpile.frame.side-lower-rail';
    sideRail.position.set(side * 0.75, 0.26, 0);
    parent.add(sideRail);
    const strap = chamferedBox(0.16, 0.16, 0.13, materials.iron, 0.02);
    strap.name = 'woodpile.frame.corner-strap';
    strap.position.set(side * 0.71, 0.96, 0.285);
    parent.add(strap);
    const rivet = bolt(0.026, 0.06, materials.ironEdge);
    rivet.name = 'woodpile.frame.corner-rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(side * 0.71, 0.96, 0.365);
    parent.add(rivet);
  }
}

function addCover(parent, materials) {
  const roll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 1.3, 16),
    materials.canvas,
  );
  roll.name = 'woodpile.cover.rolled-canvas';
  roll.rotation.z = Math.PI * 0.5;
  roll.position.set(0, 1.09, -0.25);
  parent.add(roll);

  const flap = chamferedBox(1.18, 0.025, 0.25, materials.canvas, 0.012);
  flap.name = 'woodpile.cover.folded-flap';
  flap.position.set(-0.04, 1.02, -0.16);
  flap.rotation.x = -0.18;
  parent.add(flap);

  for (const x of [-0.56, -0.3, -0.05, 0.2, 0.46]) {
    const wrinkle = torus(0.097, 0.006, materials.canvasDark, 5, 22);
    wrinkle.name = 'woodpile.cover.roll-wrinkle';
    wrinkle.rotation.y = Math.PI * 0.5;
    wrinkle.position.set(x, 1.09 + Math.sin(x * 13) * 0.004, -0.25);
    wrinkle.scale.set(1, 0.96 + Math.abs(x) * 0.025, 1);
    parent.add(wrinkle);
  }

  for (const x of [-0.42, 0.42]) {
    const tie = torus(0.105, 0.012, materials.rope, 7, 24);
    tie.name = 'woodpile.cover.rope-tie';
    tie.rotation.y = Math.PI * 0.5;
    tie.position.set(x, 1.09, -0.25);
    parent.add(tie);
    const tail = tubeFromPoints([
      new THREE.Vector3(x, 1.01, -0.17),
      new THREE.Vector3(x + 0.025, 0.94, -0.13),
      new THREE.Vector3(x - 0.01, 0.88, -0.1),
    ], 0.011, materials.rope, { tubularSegments: 14, radialSegments: 5 });
    tail.name = 'woodpile.cover.rope-tail';
    parent.add(tail);
  }
}

function addHatchet(parent, materials) {
  const sheath = extrudedSilhouette([
    [-0.07, 0.2],
    [0.08, 0.2],
    [0.09, -0.2],
    [0.02, -0.33],
    [-0.07, -0.24],
  ], 0.055, materials.leather, { bevel: 0.018 });
  sheath.name = 'woodpile.tools.hatchet-sheath';
  sheath.position.set(-0.88, 0.53, 0.37);
  sheath.rotation.z = -0.06;
  parent.add(sheath);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.036, 0.45, 9),
    materials.handle,
  );
  handle.name = 'woodpile.tools.hatchet-handle';
  handle.position.set(-0.88, 0.73, 0.39);
  handle.rotation.z = -0.05;
  parent.add(handle);

  const head = extrudedSilhouette([
    [-0.12, -0.08],
    [0.12, -0.06],
    [0.08, 0.08],
    [-0.08, 0.11],
  ], 0.08, materials.ironEdge, { bevel: 0.025 });
  head.name = 'woodpile.tools.hatchet-head';
  head.position.set(-0.88, 0.96, 0.39);
  head.rotation.z = -0.05;
  parent.add(head);
}

export function createWoodpileModel() {
  const root = makePropRoot('prop.woodpile', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `woodpile-rack-oak-${index}` }),
    {
      offset: [index * 0.17, index * 0.113],
      repeatScale: [0.72 + index * 0.05, 0.9 + (index % 2) * 0.08],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.1, 0.04],
    })),
    bark: [0x2e2016, 0x3c281a, 0x4a3020].map((color, index) => transformMaterialMaps(
      surfaceMaterial('bark', color, { name: `woodpile-bark-${index}` }),
      { offset: [index * 0.21, index * 0.12], repeatScale: [0.86, 0.96] },
    )),
    split: [0xa97b42, 0xc09252, 0x8f6738].map((color, index) => transformMaterialMaps(
      surfaceMaterial('split-wood', color, { name: `woodpile-split-face-${index}` }),
      { offset: [index * 0.18, index * 0.08], repeatScale: [0.92, 0.92] },
    )),
    ring: surfaceMaterial('split-wood', 0x5f3c22, { name: 'woodpile-growth-rings' }),
    iron: surfaceMaterial('forged-iron', 0x292725, { name: 'woodpile-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x56514c, { name: 'woodpile-worn-iron' }),
    canvas: surfaceMaterial('burlap', 0x514b40, { name: 'woodpile-waxed-canvas' }),
    canvasDark: surfaceMaterial('burlap', 0x342f29, { name: 'woodpile-canvas-fold-shadow' }),
    rope: surfaceMaterial('rope', 0x93764b, { name: 'woodpile-hemp-ties' }),
    leather: surfaceMaterial('leather', 0x532c1d, { name: 'woodpile-hatchet-sheath' }),
    handle: surfaceMaterial('wood', 0x754925, { name: 'woodpile-hatchet-handle' }),
    stone: PROP_PALETTE.limestone.slice(0, 3).map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `woodpile-foot-stone-${index}` }),
      { offset: [index * 0.19, index * 0.13], repeatScale: [0.78, 0.78] },
    )),
  };

  const foundation = registerNode(root, 'woodpile.foundation', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [-1, 1].flatMap((xSide) => [-1, 1].map((zSide) => ({
        size: [0.25, 0.13, 0.23],
        offset: [xSide * 0.8, 0.065, zSide * 0.3],
      }))),
    },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  let stoneIndex = 0;
  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const foot = chamferedBox(0.25, 0.13, 0.23, materials.stone[stoneIndex % 3], 0.045);
      foot.name = 'woodpile.foundation.foot';
      foot.position.set(xSide * 0.8, 0.065, zSide * 0.3);
      foot.rotation.y = (stoneIndex - 1.5) * 0.025;
      foundation.add(foot);
      stoneIndex += 1;
    }
  }

  const frame = registerNode(root, 'woodpile.frame', new THREE.Group(), {
    collider: { type: 'box', size: [1.72, 1.1, 0.72], offset: [0, 0.58, 0] },
    destructionGroup: 'frame',
  });
  root.add(frame);
  addRackFrame(frame, materials);

  const logs = registerNode(root, 'woodpile.logs', new THREE.Group(), {
    collider: { type: 'box', size: [1.35, 0.72, 0.58], offset: [0, 0.55, 0] },
    destructionGroup: 'logs',
  });
  root.add(logs);
  const rowCounts = [7, 6, 5, 4];
  let logIndex = 0;
  rowCounts.forEach((count, row) => {
    const spacing = row === 0 ? 0.198 : 0.205;
    const rowWidth = spacing * (count - 1);
    for (let index = 0; index < count; index += 1) {
      const x = -rowWidth * 0.5 + index * spacing + (row % 2 ? 0.025 : -0.012);
      addLog(logs, materials, {
        x,
        y: 0.235 + row * 0.17 + (index % 2) * 0.009,
        z: 0.015 - (index % 3) * 0.012,
        radius: 0.103 + ((logIndex * 7) % 4) * 0.007,
        length: 0.5 + (logIndex % 3) * 0.025,
        rotationZ: ((logIndex % 5) - 2) * 0.025,
        index: logIndex,
      });
      logIndex += 1;
    }
  });
  addSocket(root, logs, 'socket.woodpile-restock', new THREE.Vector3(0, 0.92, 0.05));

  const cover = registerNode(root, 'woodpile.cover', new THREE.Group(), {
    destructionGroup: 'cover',
  });
  root.add(cover);
  addCover(cover, materials);

  const tools = registerNode(root, 'woodpile.tools', new THREE.Group(), {
    destructionGroup: 'tools',
  });
  root.add(tools);
  addHatchet(tools, materials);
  addSocket(root, tools, 'socket.woodpile-hatchet', new THREE.Vector3(-0.88, 0.72, 0.39));

  root.userData.materialFamilies = [
    'aged-oak',
    'bark',
    'split-wood',
    'limestone',
    'forged-iron',
    'waxed-canvas',
    'hemp-rope',
    'leather',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/woodpile/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createWoodpileModel;
