import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  finishHeroProp,
  makePropRoot,
  registerNode,
  rotateMaterialMaps,
  surfaceMaterial,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-crate-stack-v1-pbr';

function addNail(parent, materials, x, y, z, axis = 'z') {
  const nail = bolt(0.022, 0.045, materials.ironEdge);
  nail.name = 'crate.nail';
  if (axis === 'z') nail.rotation.x = Math.PI * 0.5;
  else nail.rotation.z = Math.PI * 0.5;
  nail.position.set(x, y, z);
  parent.add(nail);
}

function addDiagonalBrace(parent, material, {
  width,
  height,
  depth,
  z,
  reverse = false,
} = {}) {
  const length = Math.hypot(width, height);
  const brace = chamferedBox(length, 0.105, depth, material, 0.025);
  brace.name = 'crate.diagonal-brace';
  brace.position.set(0, height * 0.5, z);
  brace.rotation.z = (reverse ? -1 : 1) * Math.atan2(height, width);
  parent.add(brace);
  return brace;
}

function addRopeHandle(parent, material, side, width, height, depth) {
  const x = side * (width * 0.5 + 0.035);
  const handle = tubeFromPoints([
    new THREE.Vector3(x, height * 0.64, -depth * 0.18),
    new THREE.Vector3(x + side * 0.045, height * 0.51, -depth * 0.09),
    new THREE.Vector3(x + side * 0.055, height * 0.47, depth * 0.09),
    new THREE.Vector3(x, height * 0.64, depth * 0.18),
  ], 0.024, material, {
    tubularSegments: 22,
    radialSegments: 7,
  });
  handle.name = `crate.rope-handle.${side < 0 ? 'left' : 'right'}`;
  parent.add(handle);
}

function buildCrate(materials, {
  name,
  width,
  height,
  depth,
  open = false,
  braceReverse = false,
  handles = true,
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  const plankRows = open ? 3 : 4;
  const plankHeight = (height - 0.16) / plankRows;

  for (const zSide of [-1, 1]) {
    for (let row = 0; row < plankRows; row += 1) {
      const plank = chamferedBox(
        width - 0.15,
        plankHeight - 0.018,
        0.075,
        materials.oak[(row + (zSide > 0 ? 1 : 0)) % 4],
        0.026,
      );
      plank.name = `${name}.face.${zSide < 0 ? 'back' : 'front'}.plank.${row}`;
      plank.position.set(
        0,
        0.09 + plankHeight * (row + 0.5),
        zSide * (depth * 0.5 - 0.035),
      );
      group.add(plank);
    }
  }

  for (const xSide of [-1, 1]) {
    for (let row = 0; row < plankRows; row += 1) {
      const plank = chamferedBox(
        0.075,
        plankHeight - 0.018,
        depth - 0.14,
        materials.oakCross[(row + (xSide > 0 ? 2 : 0)) % 4],
        0.026,
      );
      plank.name = `${name}.side.${xSide < 0 ? 'left' : 'right'}.plank.${row}`;
      plank.position.set(
        xSide * (width * 0.5 - 0.035),
        0.09 + plankHeight * (row + 0.5),
        0,
      );
      group.add(plank);
    }
  }

  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const corner = chamferedBox(
        0.14,
        height + 0.02,
        0.14,
        materials.oakCross[(xSide > 0 ? 1 : 0) + (zSide > 0 ? 1 : 0)],
        0.032,
      );
      corner.name = `${name}.corner-cleat`;
      corner.position.set(
        xSide * (width * 0.5 - 0.055),
        height * 0.5,
        zSide * (depth * 0.5 - 0.055),
      );
      group.add(corner);
      for (const y of [height * 0.22, height * 0.78]) {
        addNail(
          group,
          materials,
          xSide * (width * 0.5 - 0.055),
          y,
          zSide * (depth * 0.5 + 0.018),
        );
      }
    }
  }

  const lowerBand = chamferedBox(width + 0.035, 0.1, 0.105, materials.oak[2], 0.028);
  lowerBand.name = `${name}.front-lower-band`;
  lowerBand.position.set(0, 0.08, depth * 0.5 + 0.005);
  group.add(lowerBand);
  const upperBand = chamferedBox(width + 0.035, 0.1, 0.105, materials.oak[1], 0.028);
  upperBand.name = `${name}.front-upper-band`;
  upperBand.position.set(0, height - 0.08, depth * 0.5 + 0.005);
  group.add(upperBand);

  addDiagonalBrace(group, materials.oak[3], {
    width: width * 0.73,
    height: height * 0.62,
    depth: 0.085,
    z: depth * 0.5 + 0.065,
    reverse: braceReverse,
  });

  const cavity = chamferedBox(width * 0.23, 0.105, 0.026, materials.void, 0.045);
  cavity.name = `${name}.finger-slot`;
  cavity.position.set(0, height * 0.7, depth * 0.5 + 0.092);
  group.add(cavity);

  if (!open) {
    const topRows = 4;
    for (let index = 0; index < topRows; index += 1) {
      const top = chamferedBox(
        width - 0.12,
        0.065,
        (depth - 0.12) / topRows - 0.012,
        materials.oak[index % 4],
        0.02,
      );
      top.name = `${name}.lid-plank.${index}`;
      top.position.set(
        0,
        height + 0.02,
        -depth * 0.5 + 0.1 + index * ((depth - 0.12) / topRows),
      );
      group.add(top);
    }
  } else {
    for (const zSide of [-1, 1]) {
      const rim = chamferedBox(width + 0.03, 0.11, 0.13, materials.oak[1], 0.032);
      rim.name = `${name}.open-rim.${zSide}`;
      rim.position.set(0, height, zSide * (depth * 0.5 - 0.035));
      group.add(rim);
    }
    for (const xSide of [-1, 1]) {
      const rim = chamferedBox(0.13, 0.11, depth - 0.14, materials.oakCross[2], 0.032);
      rim.name = `${name}.open-side-rim.${xSide}`;
      rim.position.set(xSide * (width * 0.5 - 0.035), height, 0);
      group.add(rim);
    }
  }

  if (handles) {
    addRopeHandle(group, materials.rope, -1, width, height, depth);
    addRopeHandle(group, materials.rope, 1, width, height, depth);
  }
  return group;
}

function addProduce(crate, materials, width, height, depth) {
  const positions = [
    [-0.26, 0.03, -0.12],
    [-0.08, 0.06, -0.16],
    [0.12, 0.04, -0.14],
    [0.28, 0.02, -0.09],
    [-0.2, 0.08, 0.06],
    [0, 0.11, 0.04],
    [0.2, 0.07, 0.08],
    [-0.08, 0.17, -0.02],
    [0.11, 0.16, -0.01],
  ];
  for (let index = 0; index < positions.length; index += 1) {
    const [x, y, z] = positions[index];
    const apple = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 10),
      materials.fruit[index % materials.fruit.length],
    );
    apple.name = `crate.apple.${index}`;
    apple.scale.set(1, 0.92, 1);
    apple.position.set(x * width / 0.9, height + 0.08 + y, z * depth / 0.62);
    crate.add(apple);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.011, 0.07, 6),
      materials.oak[3],
    );
    stem.name = `crate.apple-stem.${index}`;
    stem.position.copy(apple.position).add(new THREE.Vector3(0.01, 0.115, 0));
    stem.rotation.z = (index % 3 - 1) * 0.18;
    crate.add(stem);
  }
}

function burlapDrapeGeometry(width = 0.5, height = 0.58, segmentsX = 8, segmentsY = 12) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let yIndex = 0; yIndex <= segmentsY; yIndex += 1) {
    const v = yIndex / segmentsY;
    for (let xIndex = 0; xIndex <= segmentsX; xIndex += 1) {
      const u = xIndex / segmentsX;
      const x = (u - 0.5) * width;
      const y = -v * height;
      const z = Math.sin(v * Math.PI) * 0.075 + Math.sin(u * Math.PI * 3) * 0.012;
      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }
  const row = segmentsX + 1;
  for (let yIndex = 0; yIndex < segmentsY; yIndex += 1) {
    for (let xIndex = 0; xIndex < segmentsX; xIndex += 1) {
      const a = yIndex * row + xIndex;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addBurlap(crate, materials, width, height, depth) {
  const cloth = new THREE.Mesh(
    burlapDrapeGeometry(width * 0.52, height * 0.9),
    materials.burlap,
  );
  cloth.name = 'crate.burlap-drape';
  cloth.position.set(width * 0.22, height + 0.14, depth * 0.5 + 0.045);
  cloth.rotation.z = -0.08;
  crate.add(cloth);
  for (let index = 0; index < 8; index += 1) {
    const fringe = tubeFromPoints([
      new THREE.Vector3(
        width * 0.22 - width * 0.24 + index * width * 0.064,
        height * 0.1,
        depth * 0.5 + 0.07,
      ),
      new THREE.Vector3(
        width * 0.21 - width * 0.24 + index * width * 0.064,
        height * 0.03 - (index % 2) * 0.025,
        depth * 0.5 + 0.075,
      ),
    ], 0.006, materials.burlap, { tubularSegments: 4, radialSegments: 5 });
    fringe.name = 'crate.burlap-fringe';
    crate.add(fringe);
  }
}

export function createCrateStackModel() {
  const root = makePropRoot('prop.crate-stack', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `crate-oak-${index}` }),
    {
      offset: [index * 0.211, index * 0.137],
      repeatScale: [0.78 + index * 0.035, 0.82 + (index % 2) * 0.08],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => rotateMaterialMaps(material, Math.PI * 0.5)),
    ironEdge: surfaceMaterial('worn-iron', 0x4a4540, { name: 'crate-worn-nails' }),
    rope: surfaceMaterial('rope', 0xb18c50, { name: 'crate-rope' }),
    burlap: surfaceMaterial('burlap', 0xad8c5e, {
      name: 'crate-burlap',
      side: THREE.DoubleSide,
    }),
    fruit: [
      surfaceMaterial('fruit', 0x8e251f, { name: 'apple-deep-red', clearcoat: 0.16 }),
      surfaceMaterial('fruit', 0xb43a2d, { name: 'apple-warm-red', clearcoat: 0.16 }),
      surfaceMaterial('fruit', 0x74301f, { name: 'apple-russet', clearcoat: 0.12 }),
    ],
    void: new THREE.MeshBasicMaterial({ name: 'crate-slot-void', color: 0x17120f }),
  };

  const crates = [
    {
      id: 'crate.bottom-left',
      position: [-0.58, 0, 0.1],
      rotation: -0.025,
      width: 1.1,
      height: 0.72,
      depth: 0.72,
      reverse: false,
    },
    {
      id: 'crate.bottom-right',
      position: [0.58, 0, 0.08],
      rotation: 0.018,
      width: 1.08,
      height: 0.72,
      depth: 0.72,
      reverse: true,
    },
    {
      id: 'crate.middle',
      position: [0, 0.73, -0.03],
      rotation: -0.05,
      width: 1.02,
      height: 0.74,
      depth: 0.69,
      reverse: true,
    },
  ];

  for (const config of crates) {
    const crate = registerNode(root, config.id, buildCrate(materials, {
      name: config.id,
      width: config.width,
      height: config.height,
      depth: config.depth,
      braceReverse: config.reverse,
    }), {
      collider: {
        type: 'box',
        size: [config.width, config.height, config.depth],
        offset: [
          config.position[0],
          config.position[1] + config.height * 0.5,
          config.position[2],
        ],
      },
      destructionGroup: 'crates',
    });
    crate.position.set(...config.position);
    crate.rotation.y = config.rotation;
    root.add(crate);
  }

  const topConfig = {
    width: 0.92,
    height: 0.55,
    depth: 0.64,
  };
  const top = registerNode(root, 'crate.top-produce', buildCrate(materials, {
    name: 'crate.top-produce',
    ...topConfig,
    open: true,
    braceReverse: false,
    handles: false,
  }), {
    collider: {
      type: 'box',
      size: [topConfig.width, topConfig.height, topConfig.depth],
      offset: [0.08, 1.75, -0.02],
    },
    destructionGroup: 'crates',
  });
  top.position.set(0.08, 1.48, -0.02);
  top.rotation.y = 0.045;
  addProduce(top, materials, topConfig.width, topConfig.height, topConfig.depth);
  addBurlap(top, materials, topConfig.width, topConfig.height, topConfig.depth);
  root.add(top);

  addSocket(root, top, 'socket.crate-produce', new THREE.Vector3(0, topConfig.height, 0));
  addSocket(root, root.userData.sculptRuntime.nodes['crate.middle'], 'socket.crate-top', new THREE.Vector3(0, 0.74, 0));

  root.userData.materialFamilies = ['aged-oak', 'worn-iron', 'rope', 'burlap', 'fruit'];
  root.userData.referenceViews = {
    main: 'docs/references/props/crate_stack/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createCrateStackModel;
