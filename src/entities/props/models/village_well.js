import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  beamBetween,
  bolt,
  chamferedBox,
  finishHeroProp,
  gablePrismGeometry,
  makePropRoot,
  registerNode,
  surfaceMaterial,
  torus,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-well-v2-pbr';

function barrelTileGeometry(length, width, thickness = 0.035, crown = 0.065, segments = 8) {
  const positions = [];
  const indices = [];
  for (const x of [-length * 0.5, length * 0.5]) {
    for (let segment = 0; segment <= segments; segment += 1) {
      const t = segment / segments;
      const z = THREE.MathUtils.lerp(-width * 0.5, width * 0.5, t);
      const arch = Math.sin(t * Math.PI);
      positions.push(x, thickness + crown * arch, z);
    }
  }
  const topStride = segments + 1;
  for (let segment = 0; segment < segments; segment += 1) {
    const a = segment;
    const b = segment + 1;
    const c = topStride + segment;
    const d = topStride + segment + 1;
    indices.push(a, c, b, b, c, d);
  }

  const bottomStart = positions.length / 3;
  positions.push(
    -length * 0.5, 0, -width * 0.5,
    length * 0.5, 0, -width * 0.5,
    -length * 0.5, 0, width * 0.5,
    length * 0.5, 0, width * 0.5,
  );
  indices.push(
    bottomStart, bottomStart + 2, bottomStart + 1,
    bottomStart + 1, bottomStart + 2, bottomStart + 3,
  );

  for (const side of [0, segments]) {
    const topA = side;
    const topB = topStride + side;
    const bottomA = bottomStart + (side === 0 ? 0 : 2);
    const bottomB = bottomStart + (side === 0 ? 1 : 3);
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }
  for (const end of [0, 1]) {
    const topBase = end * topStride;
    const bottomLeft = bottomStart + end;
    const bottomRight = bottomStart + 2 + end;
    for (let segment = 0; segment < segments; segment += 1) {
      indices.push(
        topBase + segment,
        bottomLeft,
        topBase + segment + 1,
        topBase + segment + 1,
        bottomLeft,
        bottomRight,
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildStoneRing(root, materials) {
  const group = registerNode(root, 'well.stone-ring', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 1.12, height: 1.08, offset: [0, 0.54, 0] },
    destructionGroup: 'masonry',
  });
  root.add(group);

  const courseCount = 4;
  const blockCount = 14;
  for (let course = 0; course < courseCount; course += 1) {
    const stagger = (course % 2) * (Math.PI * 2 / blockCount) * 0.5;
    for (let index = 0; index < blockCount; index += 1) {
      const angle = index * Math.PI * 2 / blockCount + stagger;
      const radius = 0.92 + ((index + course) % 3 - 1) * 0.015;
      const block = chamferedBox(
        0.43 + ((index * 7 + course) % 4) * 0.018,
        0.24,
        0.34,
        materials.stone[(index + course * 3) % materials.stone.length],
        0.055,
      );
      block.name = `stone.course-${course}.${index}`;
      block.position.set(
        Math.cos(angle) * radius,
        0.12 + course * 0.235,
        Math.sin(angle) * radius,
      );
      block.rotation.y = -angle + Math.PI * 0.5;
      block.rotation.z = ((index * 13 + course * 5) % 5 - 2) * 0.004;
      group.add(block);
    }
  }

  const rim = registerNode(root, 'well.rim-blocks', new THREE.Group(), {
    destructionGroup: 'masonry',
  });
  root.add(rim);
  for (let index = 0; index < blockCount; index += 1) {
    const angle = index * Math.PI * 2 / blockCount;
    const block = chamferedBox(
      0.47,
      0.26,
      0.52,
      materials.stone[(index + 2) % materials.stone.length],
      0.065,
    );
    block.name = `stone.rim.${index}`;
    block.position.set(Math.cos(angle) * 0.93, 1.045, Math.sin(angle) * 0.93);
    block.rotation.y = -angle + Math.PI * 0.5;
    rim.add(block);
  }

  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.74, 0.95, 36, 1, true),
    materials.innerStone,
  );
  innerWall.name = 'well.inner-shaft';
  innerWall.material.side = THREE.BackSide;
  innerWall.position.y = 0.58;
  group.add(innerWall);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.69, 32),
    materials.water,
  );
  water.name = 'well.water';
  water.rotation.x = -Math.PI * 0.5;
  water.position.y = 0.28;
  group.add(water);
}

function buildTimberFrame(root, materials) {
  const frame = registerNode(root, 'well.timber-frame', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [
        { size: [0.22, 2.08, 0.24], offset: [-0.84, 2.08, 0] },
        { size: [0.22, 2.08, 0.24], offset: [0.84, 2.08, 0] },
      ],
    },
    destructionGroup: 'timber-frame',
  });
  root.add(frame);

  for (const side of [-1, 1]) {
    const post = chamferedBox(0.22, 2.05, 0.24, materials.oak[side < 0 ? 0 : 1], 0.035);
    post.name = `frame.post.${side < 0 ? 'left' : 'right'}`;
    post.position.set(side * 0.84, 2.08, 0);
    frame.add(post);

    const foot = chamferedBox(0.38, 0.28, 0.42, materials.oak[2], 0.05);
    foot.name = `frame.flared-foot.${side < 0 ? 'left' : 'right'}`;
    foot.position.set(side * 0.84, 1.18, 0);
    frame.add(foot);

    const frontBrace = beamBetween(
      new THREE.Vector3(side * 0.82, 2.52, 0.02),
      new THREE.Vector3(side * 0.48, 2.9, 0.02),
      0.075,
      materials.oak[3],
      7,
    );
    frontBrace.name = `frame.knee-brace.${side < 0 ? 'left' : 'right'}`;
    frame.add(frontBrace);

    for (const z of [-0.135, 0.135]) {
      const plate = chamferedBox(0.28, 0.14, 0.035, materials.iron, 0.025);
      plate.name = `frame.iron-plate.${side}.${z}`;
      plate.position.set(side * 0.84, 1.37, z);
      plate.rotation.y = side < 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      frame.add(plate);
      for (const y of [-0.035, 0.035]) {
        const fastener = bolt(0.026, 0.045, materials.brass);
        fastener.name = 'frame.bolt';
        fastener.rotation.z = Math.PI * 0.5;
        fastener.position.set(side * 0.965, 1.37 + y, z);
        frame.add(fastener);
      }
    }
  }

  const topBeam = chamferedBox(2.16, 0.2, 0.22, materials.oak[2], 0.035);
  topBeam.name = 'frame.top-beam';
  topBeam.position.y = 3.02;
  frame.add(topBeam);

  for (const z of [-1.03, 1.03]) {
    for (const side of [-1, 1]) {
      const rafter = beamBetween(
        new THREE.Vector3(side * 1.1, 3.02, z),
        new THREE.Vector3(0, 3.72, z),
        0.085,
        materials.oak[1],
        7,
      );
      rafter.name = `frame.gable-rafter.${z}.${side}`;
      frame.add(rafter);
    }
    const tie = chamferedBox(2.18, 0.11, 0.11, materials.oak[2], 0.025);
    tie.name = `frame.gable-tie.${z}`;
    tie.position.set(0, 3.04, z);
    frame.add(tie);
  }

  addSocket(root, frame, 'socket.windlass.left', new THREE.Vector3(-0.84, 2.18, 0));
  addSocket(root, frame, 'socket.windlass.right', new THREE.Vector3(0.84, 2.18, 0));
  addSocket(root, frame, 'socket.roof', new THREE.Vector3(0, 3.03, 0));
  return frame;
}

function buildRoof(root, materials) {
  const roof = registerNode(root, 'well.roof', new THREE.Group(), {
    collider: { type: 'box', size: [2.82, 0.78, 2.05], offset: [0, 3.37, 0] },
    destructionGroup: 'roof',
  });
  root.add(roof);
  for (const material of materials.clay) {
    material.side = THREE.DoubleSide;
  }

  const shell = new THREE.Mesh(
    gablePrismGeometry(2.72, 1.96, 0.07, 0.7),
    materials.clay[2],
  );
  shell.name = 'roof.closed-shell';
  shell.position.y = 3.0;
  roof.add(shell);

  const halfWidth = 1.36;
  const rise = 0.7;
  const slopeLength = Math.hypot(halfWidth, rise);
  const rows = 5;
  const columns = 8;
  const tileLength = slopeLength / rows + 0.145;
  const tileWidth = 0.29;
  const tileGeometry = barrelTileGeometry(tileLength, tileWidth);
  const slopeAngle = Math.atan2(rise, halfWidth);
  for (const side of [-1, 1]) {
    for (let row = 0; row < rows; row += 1) {
      const t = (row + 0.5) / rows;
      for (let column = 0; column < columns; column += 1) {
        const tile = new THREE.Mesh(
          tileGeometry,
          materials.clay[(row + column + (side > 0 ? 1 : 0)) % materials.clay.length],
        );
        tile.name = `roof.tile.${side}.${row}.${column}`;
        const x = side * halfWidth * t;
        const y = 2.98 + rise * (1 - t) + 0.055;
        const z = -0.875 + column * 0.25;
        tile.position.set(x, y, z);
        tile.rotation.z = -side * slopeAngle;
        roof.add(tile);
      }
    }
  }

  for (let column = 0; column < 7; column += 1) {
    const ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.34, 10, 1, false, 0, Math.PI),
      materials.clay[(column + 1) % materials.clay.length],
    );
    ridge.name = `roof.ridge-tile.${column}`;
    ridge.rotation.x = Math.PI * 0.5;
    ridge.position.set(0, 3.735, -0.92 + column * 0.305);
    roof.add(ridge);
  }
  return roof;
}

function buildWindlass(root, materials) {
  const windlass = registerNode(root, 'well.windlass', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.23, height: 1.9, axis: 'x', offset: [0, 2.18, 0] },
    destructionGroup: 'windlass',
  });
  root.add(windlass);

  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.23, 1.68, 16),
    materials.oak[1],
  );
  drum.name = 'windlass.drum';
  drum.rotation.z = Math.PI * 0.5;
  drum.position.y = 2.18;
  windlass.add(drum);

  for (const x of [-0.69, 0.69]) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.255, 0.255, 0.13, 16),
      materials.iron,
    );
    band.name = `windlass.band.${x}`;
    band.rotation.z = Math.PI * 0.5;
    band.position.set(x, 2.18, 0);
    windlass.add(band);
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI * 0.25;
      const rivet = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 7, 5),
        materials.ironEdge,
      );
      rivet.name = 'windlass.rivet';
      rivet.position.set(
        x,
        2.18 + Math.cos(angle) * 0.25,
        Math.sin(angle) * 0.25,
      );
      windlass.add(rivet);
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const coil = torus(0.235, 0.024, materials.rope, 7, 24);
    coil.name = `windlass.rope-coil.${i}`;
    coil.rotation.y = Math.PI * 0.5;
    coil.position.set(-0.16 + i * 0.052, 2.18, 0);
    windlass.add(coil);
  }

  const hangingRope = tubeFromPoints([
    new THREE.Vector3(0.02, 2.18, 0),
    new THREE.Vector3(0.02, 1.78, 0.015),
    new THREE.Vector3(0.015, 1.42, 0.01),
  ], 0.025, materials.rope, { tubularSegments: 12, radialSegments: 7 });
  hangingRope.name = 'windlass.hanging-rope';
  windlass.add(hangingRope);

  const crank = tubeFromPoints([
    new THREE.Vector3(0.84, 2.18, 0),
    new THREE.Vector3(1.08, 2.18, 0),
    new THREE.Vector3(1.08, 1.86, 0),
    new THREE.Vector3(1.3, 1.86, 0),
  ], 0.035, materials.iron, { tubularSegments: 18, radialSegments: 7 });
  crank.name = 'windlass.crank';
  windlass.add(crank);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.26, 10),
    materials.oak[3],
  );
  grip.name = 'windlass.crank-grip';
  grip.rotation.z = Math.PI * 0.5;
  grip.position.set(1.39, 1.86, 0);
  windlass.add(grip);

  const bucket = registerNode(root, 'well.bucket', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.19, height: 0.34, offset: [0.02, 1.23, 0] },
    destructionGroup: 'bucket',
  });
  root.add(bucket);
  const bucketBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.145, 0.34, 14, 1, true),
    materials.iron,
  );
  bucketBody.name = 'bucket.body';
  bucketBody.position.set(0.02, 1.23, 0);
  bucket.add(bucketBody);
  for (const y of [1.08, 1.37]) {
    const band = torus(y > 1.2 ? 0.18 : 0.148, 0.018, materials.ironEdge, 7, 18);
    band.name = 'bucket.band';
    band.rotation.x = Math.PI * 0.5;
    band.position.set(0.02, y, 0);
    bucket.add(band);
  }
  const handle = torus(0.2, 0.018, materials.ironEdge, 7, 18, Math.PI);
  handle.name = 'bucket.handle';
  handle.position.set(0.02, 1.4, 0);
  bucket.add(handle);
  addSocket(root, bucket, 'socket.bucket-grip', new THREE.Vector3(0.02, 1.6, 0));
}

export function createVillageWellModel() {
  const root = makePropRoot('prop.village-well', VERSION);
  const materials = {
    stone: PROP_PALETTE.limestone.map((color, index) => surfaceMaterial('stone', color, {
      name: `stone-${index}`,
    })),
    innerStone: surfaceMaterial('inner-stone', PROP_PALETTE.limestoneDark, {
      name: 'inner-stone',
    }),
    oak: PROP_PALETTE.oak.map((color, index) => surfaceMaterial('wood', color, {
      name: `oak-${index}`,
    })),
    clay: PROP_PALETTE.terracotta.map((color, index) => surfaceMaterial('clay', color, {
      name: `clay-${index}`,
    })),
    iron: surfaceMaterial('forged-iron', PROP_PALETTE.iron, {
      name: 'forged-iron',
    }),
    ironEdge: surfaceMaterial('worn-iron', PROP_PALETTE.ironEdge, {
      name: 'worn-iron-edge',
    }),
    brass: surfaceMaterial('brass', PROP_PALETTE.brass, {
      name: 'brass-fastener',
    }),
    rope: surfaceMaterial('rope', PROP_PALETTE.rope, { name: 'rope' }),
    water: new THREE.MeshPhysicalMaterial({
      name: 'deep-water',
      color: 0x385b62,
      roughness: 0.16,
      metalness: 0,
      transparent: true,
      opacity: 0.72,
      transmission: 0.16,
      ior: 1.333,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
    }),
  };

  buildStoneRing(root, materials);
  buildTimberFrame(root, materials);
  buildRoof(root, materials);
  buildWindlass(root, materials);

  root.userData.materialFamilies = ['stone', 'oak', 'terracotta', 'forged-iron', 'rope', 'water'];
  root.userData.referenceViews = {
    main: 'docs/references/props/village_well/ref_main.png',
    front: 'docs/references/props/village_well/ref_front.png',
    side: 'docs/references/props/village_well/ref_side.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createVillageWellModel;
