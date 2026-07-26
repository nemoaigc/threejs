import * as THREE from 'three';
import { buildingGradientMap } from '../../building/toon.js';

export const PROP_PALETTE = {
  limestone: [0xb69364, 0xa17f55, 0xc7a574, 0x8d6b49],
  limestoneDark: 0x6e5d49,
  oak: [0x5f351f, 0x744226, 0x4c2c1c, 0x85502e],
  oakDark: 0x3f291d,
  terracotta: [0xa54f3d, 0xb75b45, 0x8d3f34, 0xc46a50],
  iron: 0x3c3936,
  ironEdge: 0x68625b,
  brass: 0x8d6b38,
  rope: 0xb89a64,
  glass: 0xf3b94e,
  ember: 0xffb238,
};

export function toon(color, options = {}) {
  const material = new THREE.MeshToonMaterial({
    color,
    gradientMap: buildingGradientMap,
    ...options,
  });
  material.name = options.name ?? `toon-${new THREE.Color(color).getHexString()}`;
  return material;
}

export function standard(color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0,
    ...options,
  });
  material.name = options.name ?? `standard-${new THREE.Color(color).getHexString()}`;
  return material;
}

export function makePropRoot(name, version) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.kind = 'prop';
  root.userData.gen = version;
  root.userData.heroVersion = version;
  root.userData.sculptRuntime = {
    nodes: {},
    sockets: {},
    colliders: [],
    destructionGroups: {},
  };
  return root;
}

export function registerNode(root, id, node, {
  collider = null,
  destructionGroup = 'body',
} = {}) {
  node.name = id;
  node.userData.sculptId = id;
  root.userData.sculptRuntime.nodes[id] = node;
  if (collider) {
    root.userData.sculptRuntime.colliders.push({ id, ...collider });
  }
  if (!root.userData.sculptRuntime.destructionGroups[destructionGroup]) {
    root.userData.sculptRuntime.destructionGroups[destructionGroup] = [];
  }
  root.userData.sculptRuntime.destructionGroups[destructionGroup].push(id);
  return node;
}

export function addSocket(root, parent, id, position) {
  const socket = new THREE.Object3D();
  socket.name = id;
  socket.position.copy(position);
  parent.add(socket);
  root.userData.sculptRuntime.sockets[id] = socket;
  return socket;
}

export function finishHeroProp(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.material?.transparent) object.castShadow = false;
  });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (Number.isFinite(box.min.y) && Math.abs(box.min.y) > 1e-5) {
    root.position.y -= box.min.y;
  }
  root.updateMatrixWorld(true);
  return root;
}

export function chamferedBoxGeometry(width, height, depth, chamfer = 0.04) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const cut = Math.min(chamfer, halfW * 0.45, halfH * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-halfW + cut, -halfH);
  shape.lineTo(halfW - cut, -halfH);
  shape.lineTo(halfW, -halfH + cut);
  shape.lineTo(halfW, halfH - cut);
  shape.lineTo(halfW - cut, halfH);
  shape.lineTo(-halfW + cut, halfH);
  shape.lineTo(-halfW, halfH - cut);
  shape.lineTo(-halfW, -halfH + cut);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: Math.min(cut * 0.32, depth * 0.08),
    bevelSize: Math.min(cut * 0.22, depth * 0.06),
    bevelSegments: 1,
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

export function chamferedBox(width, height, depth, material, chamfer = 0.04) {
  return new THREE.Mesh(
    chamferedBoxGeometry(width, height, depth, chamfer),
    material,
  );
}

export function taperedBoxGeometry(bottomWidth, bottomDepth, topWidth, topDepth, height) {
  const bw = bottomWidth * 0.5;
  const bd = bottomDepth * 0.5;
  const tw = topWidth * 0.5;
  const td = topDepth * 0.5;
  const positions = [
    -bw, 0, -bd, bw, 0, -bd, bw, 0, bd, -bw, 0, bd,
    -tw, height, -td, tw, height, -td, tw, height, td, -tw, height, td,
  ];
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function beamBetween(start, end, radius, material, segments = 8) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.03, length, segments),
    material,
  );
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return mesh;
}

export function tubeFromPoints(points, radius, material, {
  tubularSegments = 24,
  radialSegments = 7,
  closed = false,
} = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed),
    material,
  );
}

export function torus(radius, tube, material, radialSegments = 8, tubularSegments = 24, arc = Math.PI * 2) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc),
    material,
  );
}

export function bolt(radius, depth, material) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 8),
    material,
  );
  return mesh;
}

export function gablePrismGeometry(width, depth, wallHeight, ridgeHeight) {
  const halfW = width * 0.5;
  const halfD = depth * 0.5;
  const positions = [
    -halfW, 0, -halfD,
    halfW, 0, -halfD,
    halfW, 0, halfD,
    -halfW, 0, halfD,
    0, ridgeHeight, -halfD,
    0, ridgeHeight, halfD,
    -halfW, wallHeight, -halfD,
    halfW, wallHeight, -halfD,
    halfW, wallHeight, halfD,
    -halfW, wallHeight, halfD,
  ];
  const indices = [
    0, 1, 2, 0, 2, 3,
    0, 6, 4, 0, 4, 1,
    3, 2, 5, 3, 5, 9,
    6, 7, 4, 9, 5, 8,
    6, 9, 8, 6, 8, 7,
    7, 8, 5, 7, 5, 4,
    0, 3, 9, 0, 9, 6,
    1, 4, 5, 1, 5, 2,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addWoodGrainRidges(parent, {
  width,
  height,
  depth,
  material,
  count = 4,
  axis = 'y',
} = {}) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 1) / (count + 1);
    const ridge = chamferedBox(
      axis === 'y' ? width * (0.55 + (i % 2) * 0.16) : 0.014,
      axis === 'y' ? 0.014 : height * (0.55 + (i % 2) * 0.16),
      depth + 0.006,
      material,
      0.006,
    );
    if (axis === 'y') {
      ridge.position.set((i % 2 ? -1 : 1) * width * 0.08, -height * 0.5 + t * height, depth * 0.5);
    } else {
      ridge.position.set(-width * 0.5 + t * width, (i % 2 ? -1 : 1) * height * 0.08, depth * 0.5);
    }
    parent.add(ridge);
  }
}
