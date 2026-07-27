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
  rotateMaterialMaps,
  surfaceMaterial,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-village-bench-v1-pbr';

function rectangularMemberBetween(start, end, width, depth, material, chamfer = 0.025) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = chamferedBox(width, direction.length(), depth, material, chamfer);
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return mesh;
}

function addIronPlate(parent, materials, x, y, z, {
  width = 0.16,
  height = 0.34,
  rotationZ = 0,
  prefix = 'bench.plate',
} = {}) {
  const plate = chamferedBox(width, height, 0.035, materials.iron, 0.018);
  plate.name = prefix;
  plate.position.set(x, y, z);
  plate.rotation.z = rotationZ;
  parent.add(plate);
  for (const localY of [-height * 0.28, height * 0.28]) {
    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 7, 5),
      materials.ironEdge,
    );
    rivet.name = `${prefix}.rivet`;
    rivet.position.set(
      x - Math.sin(rotationZ) * localY,
      y + Math.cos(rotationZ) * localY,
      z + 0.024,
    );
    parent.add(rivet);
  }
}

function buildSeat(root, materials) {
  const seat = registerNode(root, 'bench.seat', new THREE.Group(), {
    collider: { type: 'box', size: [2.65, 0.2, 0.68], offset: [0, 0.86, 0.08] },
    destructionGroup: 'seat',
  });
  root.add(seat);

  for (let index = 0; index < 3; index += 1) {
    const plank = chamferedBox(2.7, 0.13, 0.21, materials.oak[index % 4], 0.036);
    plank.name = `seat.plank.${index}`;
    plank.position.set(0, 0.87, -0.14 + index * 0.22);
    plank.rotation.y = (index - 1) * 0.004;
    seat.add(plank);
  }
  for (const side of [-1, 1]) {
    const endCap = chamferedBox(0.17, 0.16, 0.72, materials.oakCross[2], 0.038);
    endCap.name = `seat.end-cap.${side < 0 ? 'left' : 'right'}`;
    endCap.position.set(side * 1.36, 0.87, 0.08);
    seat.add(endCap);
  }

  const frontApron = chamferedBox(2.62, 0.22, 0.12, materials.oak[2], 0.036);
  frontApron.name = 'seat.front-apron';
  frontApron.position.set(0, 0.7, 0.39);
  seat.add(frontApron);
  const backApron = chamferedBox(2.62, 0.18, 0.1, materials.oak[3], 0.032);
  backApron.name = 'seat.back-apron';
  backApron.position.set(0, 0.72, -0.25);
  seat.add(backApron);

  for (const side of [-1, 1]) {
    addIronPlate(seat, materials, side * 1.12, 0.72, 0.458, {
      width: 0.15,
      height: 0.34,
      prefix: `seat.apron-strap.${side}`,
    });
  }
  addSocket(root, seat, 'socket.bench-seat', new THREE.Vector3(0, 0.1, 0.08));
}

function buildLegs(root, materials) {
  const legs = registerNode(root, 'bench.legs', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [
        { size: [0.28, 0.82, 0.28], offset: [-1.12, 0.41, 0.08] },
        { size: [0.28, 0.82, 0.28], offset: [1.12, 0.41, 0.08] },
      ],
    },
    destructionGroup: 'frame',
  });
  root.add(legs);

  for (const side of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      const top = new THREE.Vector3(side * 1.14, 0.83, 0.07 + zSide * 0.23);
      const bottom = new THREE.Vector3(side * 1.22, 0.08, 0.08 + zSide * 0.31);
      const leg = rectangularMemberBetween(
        bottom,
        top,
        0.19,
        0.2,
        materials.oak[(side > 0 ? 1 : 0) + (zSide > 0 ? 1 : 0)],
        0.035,
      );
      leg.name = `leg.${side < 0 ? 'left' : 'right'}.${zSide < 0 ? 'back' : 'front'}`;
      legs.add(leg);
    }

    const brace = rectangularMemberBetween(
      new THREE.Vector3(side * 1.2, 0.28, 0.04),
      new THREE.Vector3(side * 0.67, 0.72, 0.04),
      0.12,
      0.12,
      materials.oak[3],
      0.026,
    );
    brace.name = `frame.diagonal-brace.${side}`;
    legs.add(brace);
    addIronPlate(legs, materials, side * 1.15, 0.48, 0.44, {
      width: 0.17,
      height: 0.42,
      prefix: `leg.iron-strap.${side}`,
    });
  }

  const stretcher = chamferedBox(2.14, 0.12, 0.13, materials.oak[1], 0.03);
  stretcher.name = 'frame.long-stretcher';
  stretcher.position.set(0, 0.31, 0.02);
  legs.add(stretcher);
  for (const side of [-1, 1]) {
    const peg = bolt(0.038, 0.16, materials.oakCross[0]);
    peg.name = 'frame.stretcher-peg';
    peg.rotation.z = Math.PI * 0.5;
    peg.position.set(side * 1.03, 0.31, 0.02);
    legs.add(peg);
  }
}

function addLeafMotif(back, materials) {
  const vine = tubeFromPoints([
    new THREE.Vector3(-0.58, 1.94, 0.13),
    new THREE.Vector3(-0.28, 2.0, 0.135),
    new THREE.Vector3(0, 1.95, 0.14),
    new THREE.Vector3(0.28, 2.0, 0.135),
    new THREE.Vector3(0.58, 1.94, 0.13),
  ], 0.014, materials.carving, { tubularSegments: 28, radialSegments: 6 });
  vine.name = 'back.carved-vine';
  back.add(vine);

  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index += 1) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 10, 6),
        materials.carving,
      );
      leaf.name = 'back.carved-leaf';
      leaf.scale.set(1.35, 0.42, 0.12);
      leaf.position.set(side * (0.16 + index * 0.18), 1.99 - (index % 2) * 0.055, 0.145);
      leaf.rotation.z = side * (0.32 + index * 0.08) + (index % 2 ? 0.38 : -0.18);
      back.add(leaf);
    }
  }
}

function buildBack(root, materials) {
  const back = registerNode(root, 'bench.back', new THREE.Group(), {
    collider: { type: 'box', size: [2.8, 1.25, 0.2], offset: [0, 1.54, -0.27] },
    destructionGroup: 'back',
  });
  root.add(back);

  for (const side of [-1, 1]) {
    const post = rectangularMemberBetween(
      new THREE.Vector3(side * 1.32, 0.72, -0.25),
      new THREE.Vector3(side * 1.38, 2.24, -0.25),
      0.2,
      0.2,
      materials.oak[side > 0 ? 1 : 0],
      0.038,
    );
    post.name = `back.post.${side < 0 ? 'left' : 'right'}`;
    back.add(post);
    const cap = chamferedBox(0.28, 0.18, 0.28, materials.oakCross[side > 0 ? 0 : 2], 0.07);
    cap.name = `back.post-cap.${side}`;
    cap.position.set(side * 1.39, 2.27, -0.25);
    back.add(cap);
    addIronPlate(back, materials, side * 1.36, 1.84, -0.135, {
      width: 0.18,
      height: 0.48,
      prefix: `back.post-strap.${side}`,
    });
  }

  const topRail = chamferedBox(2.58, 0.33, 0.15, materials.oak[2], 0.05);
  topRail.name = 'back.top-rail';
  topRail.position.set(0, 2.0, -0.25);
  back.add(topRail);
  const lowerRail = chamferedBox(2.5, 0.14, 0.13, materials.oak[3], 0.03);
  lowerRail.name = 'back.lower-rail';
  lowerRail.position.set(0, 1.08, -0.25);
  back.add(lowerRail);

  const slatCount = 10;
  for (let index = 0; index < slatCount; index += 1) {
    const x = -1.08 + index * (2.16 / (slatCount - 1));
    const slat = chamferedBox(0.105, 0.77, 0.105, materials.oakCross[index % 4], 0.025);
    slat.name = `back.slat.${index}`;
    slat.position.set(x, 1.51, -0.25);
    slat.rotation.z = ((index % 3) - 1) * 0.007;
    back.add(slat);
  }
  addLeafMotif(back, materials);
  addSocket(root, back, 'socket.bench-back', new THREE.Vector3(0, 1.28, -0.25));
}

function buildArmrests(root, materials) {
  const arms = registerNode(root, 'bench.armrests', new THREE.Group(), {
    destructionGroup: 'ironwork',
  });
  root.add(arms);

  for (const side of [-1, 1]) {
    const x = side * 1.36;
    const arm = tubeFromPoints([
      new THREE.Vector3(x, 1.82, -0.24),
      new THREE.Vector3(x, 1.57, -0.12),
      new THREE.Vector3(x, 1.4, 0.12),
      new THREE.Vector3(x, 1.38, 0.38),
      new THREE.Vector3(x, 1.22, 0.48),
      new THREE.Vector3(x, 1.06, 0.39),
    ], 0.055, materials.iron, {
      tubularSegments: 30,
      radialSegments: 8,
    });
    arm.name = `armrest.${side < 0 ? 'left' : 'right'}.scroll`;
    arms.add(arm);

    const support = rectangularMemberBetween(
      new THREE.Vector3(x, 0.88, 0.34),
      new THREE.Vector3(x, 1.1, 0.4),
      0.11,
      0.11,
      materials.oak[1],
      0.028,
    );
    support.name = `armrest.${side}.support`;
    arms.add(support);
    addIronPlate(arms, materials, x, 1.75, -0.13, {
      width: 0.14,
      height: 0.32,
      prefix: `armrest.${side}.mount`,
    });
  }
}

function addMoss(root, materials) {
  for (const side of [-1, 1]) {
    for (let index = 0; index < 4; index += 1) {
      const tuft = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.045 + index * 0.007, 1),
        materials.moss[index % 2],
      );
      tuft.name = 'bench.foot-moss';
      tuft.scale.set(1.8, 0.55, 1.15);
      tuft.position.set(side * (1.19 + index * 0.018), 0.055, 0.33 - index * 0.035);
      root.add(tuft);
    }
  }
}

export function createVillageBenchModel() {
  const root = makePropRoot('prop.village-bench', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `bench-oak-${index}` }),
    {
      offset: [index * 0.19, index * 0.123],
      repeatScale: [0.76 + index * 0.045, 0.88 + (index % 2) * 0.07],
    },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material) => rotateMaterialMaps(material, Math.PI * 0.5)),
    carving: surfaceMaterial('wood', 0x2c180f, { name: 'bench-recess-carving' }),
    iron: surfaceMaterial('forged-iron', 0x2d2b29, { name: 'bench-forged-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x56504a, { name: 'bench-worn-fastener' }),
    moss: [
      surfaceMaterial('moss', 0x40552a, { name: 'bench-moss-dark' }),
      surfaceMaterial('moss', 0x65743b, { name: 'bench-moss-light' }),
    ],
  };

  buildSeat(root, materials);
  buildLegs(root, materials);
  buildBack(root, materials);
  buildArmrests(root, materials);
  addMoss(root, materials);

  root.userData.materialFamilies = ['aged-oak', 'forged-iron', 'moss'];
  root.userData.referenceViews = {
    main: 'docs/references/props/village_bench/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createVillageBenchModel;
