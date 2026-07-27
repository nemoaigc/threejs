import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  beamBetween,
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

const VERSION = 'img2threejs-barrel-cluster-v1-pbr';

function barrelStaveGeometry(index, count, height, endRadius, bellyRadius, thickness = 0.025) {
  const gap = 0.012;
  const start = index * Math.PI * 2 / count + gap;
  const end = (index + 1) * Math.PI * 2 / count - gap;
  const levels = 6;
  const positions = [];
  const indices = [];

  for (const shell of [0, 1]) {
    for (let level = 0; level < levels; level += 1) {
      const t = level / (levels - 1);
      const y = (t - 0.5) * height;
      const bulge = Math.sin(t * Math.PI);
      const radius = THREE.MathUtils.lerp(endRadius, bellyRadius, bulge) - shell * thickness;
      for (const angle of [start, end]) {
        positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      }
    }
  }

  const shellStride = levels * 2;
  for (let level = 0; level < levels - 1; level += 1) {
    const a = level * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
    const ia = shellStride + a;
    const ib = shellStride + b;
    const ic = shellStride + c;
    const id = shellStride + d;
    indices.push(ia, ib, ic, ib, id, ic);
  }

  for (const edge of [0, 1]) {
    for (let level = 0; level < levels - 1; level += 1) {
      const outerA = level * 2 + edge;
      const outerB = (level + 1) * 2 + edge;
      const innerA = shellStride + outerA;
      const innerB = shellStride + outerB;
      indices.push(outerA, innerA, outerB, outerB, innerA, innerB);
    }
  }

  for (const level of [0, levels - 1]) {
    const outerA = level * 2;
    const outerB = outerA + 1;
    const innerA = shellStride + outerA;
    const innerB = innerA + 1;
    if (level === 0) indices.push(outerA, outerB, innerA, outerB, innerB, innerA);
    else indices.push(outerA, innerA, outerB, outerB, innerA, innerB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addHoopRivets(parent, y, radius, materials, name) {
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI * 0.25;
    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 7, 5),
      index % 3 ? materials.ironEdge : materials.brass,
    );
    rivet.name = `${name}.rivet.${index}`;
    rivet.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    parent.add(rivet);
  }
}

function createBarrel(materials, {
  name,
  height,
  endRadius,
  bellyRadius,
  staveCount = 18,
  tap = false,
} = {}) {
  const group = new THREE.Group();
  group.name = name;

  for (let index = 0; index < staveCount; index += 1) {
    const stave = new THREE.Mesh(
      barrelStaveGeometry(index, staveCount, height, endRadius, bellyRadius),
      materials.oak[index % materials.oak.length],
    );
    stave.name = `${name}.stave.${index}`;
    group.add(stave);
  }

  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(
      new THREE.CircleGeometry(endRadius * 0.9, 32),
      materials.oakCross[side > 0 ? 1 : 3],
    );
    head.name = `${name}.head.${side < 0 ? 'bottom' : 'top'}`;
    head.rotation.x = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    head.position.y = side * (height * 0.5 + 0.006);
    group.add(head);

    const headRim = torus(endRadius * 0.94, 0.024, materials.iron, 7, 32);
    headRim.name = `${name}.head-rim.${side}`;
    headRim.rotation.x = Math.PI * 0.5;
    headRim.position.y = side * (height * 0.5 + 0.012);
    group.add(headRim);
  }

  const hoopLevels = [-0.43, -0.25, 0, 0.25, 0.43];
  for (let index = 0; index < hoopLevels.length; index += 1) {
    const level = hoopLevels[index];
    const y = level * height;
    const t = level + 0.5;
    const radius = THREE.MathUtils.lerp(endRadius, bellyRadius, Math.sin(t * Math.PI)) + 0.018;
    const hoop = torus(radius, 0.035, index % 2 ? materials.iron : materials.ironEdge, 8, 40);
    hoop.name = `${name}.hoop.${index}`;
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    group.add(hoop);
    addHoopRivets(group, y, radius + 0.026, materials, `${name}.hoop.${index}`);
  }

  const bung = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.062, 0.045, 12),
    materials.oakCross[2],
  );
  bung.name = `${name}.bung`;
  bung.position.set(bellyRadius + 0.012, height * 0.08, 0);
  bung.rotation.z = Math.PI * 0.5;
  group.add(bung);

  if (tap) {
    const tapBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.22, 10),
      materials.oakCross[0],
    );
    tapBody.name = `${name}.tap.body`;
    tapBody.position.y = -height * 0.5 - 0.12;
    group.add(tapBody);
    const handle = chamferedBox(0.22, 0.055, 0.055, materials.oakCross[3], 0.018);
    handle.name = `${name}.tap.handle`;
    handle.position.y = -height * 0.5 - 0.24;
    group.add(handle);
    const collar = torus(0.065, 0.018, materials.brass, 7, 16);
    collar.name = `${name}.tap.collar`;
    collar.rotation.x = Math.PI * 0.5;
    collar.position.y = -height * 0.5 - 0.02;
    group.add(collar);
  }
  return group;
}

function addChock(parent, materials, x, z, yaw) {
  const chock = chamferedBox(0.42, 0.24, 0.3, materials.oak[2], 0.04);
  chock.name = 'barrel.horizontal-chock';
  chock.position.set(x, 0.12, z);
  chock.rotation.y = yaw;
  parent.add(chock);
  for (const dx of [-0.13, 0.13]) {
    const peg = bolt(0.026, 0.045, materials.ironEdge);
    peg.name = 'barrel.chock-peg';
    peg.position.set(x + dx * Math.cos(yaw), 0.245, z - dx * Math.sin(yaw));
    parent.add(peg);
  }
}

export function createBarrelClusterModel() {
  const root = makePropRoot('prop.barrel-cluster', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `barrel-oak-${index}` }),
    {
      offset: [index * 0.173, index * 0.117],
      repeatScale: [0.72 + index * 0.04, 0.86 + (index % 2) * 0.09],
    },
  ));
  oak.forEach((material) => material.color.multiplyScalar(0.68));
  const materials = {
    oak,
    oakCross: oak.map((material) => {
      const clone = material.clone();
      clone.name = `${material.name}.cross`;
      return clone;
    }),
    iron: surfaceMaterial('forged-iron', 0x2c2a28, { name: 'barrel-forged-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x514a42, { name: 'barrel-worn-iron' }),
    brass: surfaceMaterial('brass', 0x76502b, { name: 'barrel-aged-fastener' }),
    rope: surfaceMaterial('rope', 0x9c7743, { name: 'barrel-rope' }),
  };

  const large = registerNode(root, 'barrel.large', createBarrel(materials, {
    name: 'barrel.large',
    height: 1.38,
    endRadius: 0.48,
    bellyRadius: 0.58,
    staveCount: 20,
  }), {
    collider: { type: 'cylinder', radius: 0.58, height: 1.38, offset: [-0.42, 0.69, -0.08] },
    destructionGroup: 'barrels',
  });
  large.position.set(-0.42, 0.69, -0.08);
  large.rotation.y = -0.08;
  root.add(large);

  const small = registerNode(root, 'barrel.small', createBarrel(materials, {
    name: 'barrel.small',
    height: 1.12,
    endRadius: 0.38,
    bellyRadius: 0.46,
    staveCount: 18,
  }), {
    collider: { type: 'cylinder', radius: 0.46, height: 1.12, offset: [0.56, 0.56, -0.2] },
    destructionGroup: 'barrels',
  });
  small.position.set(0.56, 0.56, -0.2);
  small.rotation.y = 0.13;
  root.add(small);

  addChock(root, materials, 0.22, 0.53, -0.12);
  addChock(root, materials, 1.03, 0.53, -0.12);
  const horizontal = registerNode(root, 'barrel.horizontal', createBarrel(materials, {
    name: 'barrel.horizontal',
    height: 1.18,
    endRadius: 0.39,
    bellyRadius: 0.46,
    staveCount: 18,
    tap: true,
  }), {
    collider: {
      type: 'cylinder',
      radius: 0.46,
      height: 1.18,
      axis: 'x',
      offset: [0.62, 0.68, 0.53],
    },
    destructionGroup: 'barrels',
  });
  horizontal.position.set(0.62, 0.68, 0.53);
  horizontal.rotation.z = Math.PI * 0.5;
  horizontal.rotation.x = -0.06;
  root.add(horizontal);

  const rope = tubeFromPoints([
    new THREE.Vector3(0.48, 1.12, 0.72),
    new THREE.Vector3(0.66, 1.18, 0.8),
    new THREE.Vector3(0.88, 1.13, 0.75),
    new THREE.Vector3(0.78, 1.02, 0.68),
    new THREE.Vector3(0.56, 1.03, 0.7),
    new THREE.Vector3(0.48, 1.12, 0.72),
  ], 0.022, materials.rope, {
    tubularSegments: 32,
    radialSegments: 7,
    closed: true,
  });
  rope.name = 'barrel.horizontal.rope-loop';
  root.add(rope);

  const tapSocket = addSocket(
    root,
    horizontal,
    'socket.barrel-tap',
    new THREE.Vector3(0, -0.78, 0),
  );
  tapSocket.userData.action = 'pour';
  addSocket(root, large, 'socket.barrel-large-lid', new THREE.Vector3(0, 0.69, 0));
  addSocket(root, small, 'socket.barrel-small-lid', new THREE.Vector3(0, 0.56, 0));

  root.userData.materialFamilies = ['aged-oak', 'forged-iron', 'aged-brass', 'rope'];
  root.userData.referenceViews = {
    main: 'docs/references/props/barrel_cluster/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createBarrelClusterModel;
