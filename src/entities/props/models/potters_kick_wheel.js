import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
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

const VERSION = 'img2threejs-potters-kick-wheel-v1-pbr';

function latheGeometry(profile, segments = 28) {
  return new THREE.LatheGeometry(
    profile.map(([radius, y]) => new THREE.Vector2(radius, y)),
    segments,
  );
}

function addLathedVessel(parent, material, {
  name,
  x,
  y,
  z,
  scale = 1,
  profile,
  yaw = 0,
  rimMaterial = null,
  handle = false,
}) {
  const vessel = new THREE.Group();
  vessel.name = name;
  vessel.position.set(x, y, z);
  vessel.rotation.y = yaw;
  vessel.scale.setScalar(scale);
  parent.add(vessel);

  const body = new THREE.Mesh(latheGeometry(profile, 32), material);
  body.name = `${name}.body`;
  vessel.add(body);

  const mouthRadius = profile.at(-1)[0];
  const mouthY = profile.at(-1)[1];
  const lip = torus(mouthRadius, Math.max(0.012, mouthRadius * 0.12), rimMaterial ?? material, 7, 32);
  lip.name = `${name}.rolled-lip`;
  lip.rotation.x = Math.PI * 0.5;
  lip.position.y = mouthY;
  vessel.add(lip);

  const cavity = new THREE.Mesh(
    new THREE.CircleGeometry(mouthRadius * 0.82, 24),
    new THREE.MeshStandardMaterial({
      color: 0x2b2019,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  cavity.name = `${name}.mouth-cavity`;
  cavity.rotation.x = -Math.PI * 0.5;
  cavity.position.y = mouthY + 0.003;
  vessel.add(cavity);

  if (handle) {
    const grip = torus(mouthRadius * 1.05, 0.025, rimMaterial ?? material, 7, 28, Math.PI * 1.15);
    grip.name = `${name}.handle`;
    grip.rotation.y = Math.PI * 0.5;
    grip.rotation.z = -Math.PI * 0.58;
    grip.position.set(mouthRadius * 0.82, mouthY * 0.55, 0);
    vessel.add(grip);
  }
  return vessel;
}

function addFrame(parent, materials) {
  const legs = [
    [-0.98, 0.04, -0.52, -0.78, 1.37, -0.42],
    [0.42, 0.04, -0.52, 0.25, 1.37, -0.42],
    [-0.98, 0.04, 0.52, -0.78, 1.37, 0.42],
    [0.42, 0.04, 0.52, 0.25, 1.37, 0.42],
  ];
  legs.forEach(([x0, y0, z0, x1, y1, z1], index) => {
    const leg = rectangularMemberBetween(
      new THREE.Vector3(x0, y0, z0),
      new THREE.Vector3(x1, y1, z1),
      0.2,
      0.18,
      materials.oak[index % materials.oak.length],
      0.045,
    );
    leg.name = 'potter.frame.splayed-leg';
    parent.add(leg);
  });

  for (const [y, z] of [[0.38, -0.44], [0.38, 0.44]]) {
    const rail = chamferedBox(1.58, 0.16, 0.14, materials.oakCross[z > 0 ? 1 : 2], 0.035);
    rail.name = 'potter.frame.lower-stretcher';
    rail.position.set(-0.3, y, z);
    parent.add(rail);
  }
  for (const x of [-0.86, 0.31]) {
    const cross = chamferedBox(0.16, 0.16, 1.02, materials.oak[x < 0 ? 0 : 3], 0.035);
    cross.name = 'potter.frame.cross-stretcher';
    cross.position.set(x, 0.4, 0);
    parent.add(cross);
  }
  for (const z of [-0.45, 0.45]) {
    const brace = rectangularMemberBetween(
      new THREE.Vector3(-0.88, 0.45, z),
      new THREE.Vector3(0.27, 1.24, z),
      0.1,
      0.09,
      materials.oakCross[z > 0 ? 0 : 3],
      0.025,
    );
    brace.name = 'potter.frame.diagonal-brace';
    parent.add(brace);
  }

  const top = chamferedBox(1.86, 0.19, 1.16, materials.oak[1], 0.055);
  top.name = 'potter.frame.worn-worktop';
  top.position.set(-0.28, 1.34, 0);
  parent.add(top);
  const apron = chamferedBox(1.7, 0.2, 0.12, materials.oakCross[2], 0.04);
  apron.name = 'potter.frame.front-apron';
  apron.position.set(-0.3, 1.2, 0.59);
  parent.add(apron);

  for (const [x, z] of [[-0.79, 0.6], [0.24, 0.6], [-0.79, -0.6], [0.24, -0.6]]) {
    const strap = chamferedBox(0.17, 0.28, 0.035, materials.iron, 0.02);
    strap.name = 'potter.frame.iron-corner-strap';
    strap.position.set(x, 1.24, z);
    parent.add(strap);
    for (const y of [1.17, 1.31]) {
      const rivet = bolt(0.018, 0.03, materials.ironEdge);
      rivet.name = 'potter.frame.strap-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x, y, z + Math.sign(z) * 0.025);
      parent.add(rivet);
    }
  }
}

function addDrive(parent, materials) {
  const flywheel = new THREE.Group();
  flywheel.name = 'potter.drive.flywheel';
  flywheel.position.set(-0.35, 0.72, 0.58);
  parent.add(flywheel);

  const tire = torus(0.62, 0.055, materials.iron, 8, 64);
  tire.name = 'potter.drive.flywheel.iron-tire';
  flywheel.add(tire);
  const woodenRim = torus(0.535, 0.075, materials.oak[2], 9, 56);
  woodenRim.name = 'potter.drive.flywheel.wooden-rim';
  flywheel.add(woodenRim);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const spoke = rectangularMemberBetween(
      new THREE.Vector3(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0),
      new THREE.Vector3(Math.cos(angle) * 0.48, Math.sin(angle) * 0.48, 0),
      0.065,
      0.05,
      materials.oakCross[index % materials.oakCross.length],
      0.014,
    );
    spoke.name = 'potter.drive.flywheel.spoke';
    flywheel.add(spoke);
  }
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.17, 0.34, 16, 2),
    materials.oak[0],
  );
  hub.name = 'potter.drive.flywheel.hub';
  hub.rotation.x = Math.PI * 0.5;
  flywheel.add(hub);
  for (const x of [-0.54, 0.54]) {
    for (const angle of [0.22, 1.35, 2.48, 3.6, 4.74, 5.86]) {
      const rivet = bolt(0.018, 0.035, materials.ironEdge);
      rivet.name = 'potter.drive.flywheel.radial-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(Math.cos(angle) * Math.abs(x), Math.sin(angle) * Math.abs(x), 0.065);
      flywheel.add(rivet);
    }
  }

  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 1.1, 14),
    materials.iron,
  );
  axle.name = 'potter.drive.axle';
  axle.rotation.x = Math.PI * 0.5;
  axle.position.set(-0.35, 0.72, 0.12);
  parent.add(axle);
  for (const z of [-0.46, 0.46]) {
    const bearing = chamferedBox(0.28, 0.3, 0.07, materials.iron, 0.03);
    bearing.name = 'potter.drive.bearing-plate';
    bearing.position.set(-0.35, 0.72, z);
    parent.add(bearing);
    for (const x of [-0.08, 0.08]) {
      const rivet = bolt(0.022, 0.045, materials.ironEdge);
      rivet.name = 'potter.drive.bearing-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(-0.35 + x, 0.72, z + Math.sign(z) * 0.045);
      parent.add(rivet);
    }
  }

  const spindle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.78, 14),
    materials.ironEdge,
  );
  spindle.name = 'potter.drive.vertical-spindle';
  spindle.position.set(-0.35, 1.13, 0);
  parent.add(spindle);
  const upperDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.48, 0.09, 48, 2),
    materials.oak[0],
  );
  upperDisk.name = 'potter.drive.throwing-wheel';
  upperDisk.position.set(-0.35, 1.49, 0);
  parent.add(upperDisk);
  for (const radius of [0.22, 0.38, 0.49]) {
    const ring = torus(radius, 0.012, materials.clayDry, 5, 54);
    ring.name = 'potter.drive.throwing-wheel.groove';
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(-0.35, 1.54, 0);
    parent.add(ring);
  }

  const treadlePivot = new THREE.Group();
  treadlePivot.name = 'potter.drive.treadle-pivot';
  treadlePivot.position.set(-0.06, 0.17, 0.75);
  treadlePivot.rotation.x = -0.05;
  parent.add(treadlePivot);
  const treadle = chamferedBox(0.84, 0.1, 0.38, materials.oak[3], 0.035);
  treadle.name = 'potter.drive.foot-treadle';
  treadle.position.x = 0.18;
  treadlePivot.add(treadle);
  const hingePin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.55, 10),
    materials.iron,
  );
  hingePin.name = 'potter.drive.treadle-hinge';
  hingePin.rotation.x = Math.PI * 0.5;
  treadlePivot.add(hingePin);

  const crank = tubeFromPoints([
    new THREE.Vector3(-0.35, 0.72, 0.78),
    new THREE.Vector3(-0.25, 0.57, 0.82),
    new THREE.Vector3(-0.06, 0.35, 0.8),
    new THREE.Vector3(0.1, 0.2, 0.76),
  ], 0.024, materials.ironEdge, {
    tubularSegments: 28,
    radialSegments: 7,
  });
  crank.name = 'potter.drive.crank-linkage';
  parent.add(crank);
}

function addWetClay(parent, materials) {
  addLathedVessel(parent, materials.wetClay, {
    name: 'potter.clay.wet-thrown-jug',
    x: -0.35,
    y: 1.54,
    z: 0,
    profile: [
      [0.08, 0],
      [0.19, 0.04],
      [0.24, 0.18],
      [0.22, 0.34],
      [0.14, 0.47],
      [0.115, 0.58],
      [0.14, 0.64],
    ],
    rimMaterial: materials.wetClayEdge,
  });
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const splash = new THREE.Mesh(
      new THREE.SphereGeometry(0.025 + (index % 3) * 0.006, 7, 5),
      materials.claySlip,
    );
    splash.name = 'potter.clay.splash';
    splash.scale.set(1.7, 0.25, 0.8);
    splash.position.set(
      -0.35 + Math.cos(angle) * (0.3 + (index % 4) * 0.035),
      1.55,
      Math.sin(angle) * (0.3 + (index % 4) * 0.035),
    );
    parent.add(splash);
  }
}

function addSideShelf(parent, materials) {
  const shelf = chamferedBox(1.45, 0.16, 0.95, materials.oak[1], 0.05);
  shelf.name = 'potter.shelf.side-platform';
  shelf.position.set(1.15, 1.18, 0.02);
  parent.add(shelf);
  for (const z of [-0.36, 0.36]) {
    const brace = rectangularMemberBetween(
      new THREE.Vector3(0.5, 0.58, z),
      new THREE.Vector3(1.53, 1.12, z),
      0.1,
      0.09,
      materials.oakCross[z > 0 ? 1 : 2],
      0.025,
    );
    brace.name = 'potter.shelf.diagonal-brace';
    parent.add(brace);
  }
}

function addShelfVessels(parent, materials) {
  const vessels = [
    { x: 0.72, z: -0.22, scale: 0.72, profile: [[0.12, 0], [0.18, 0.08], [0.17, 0.25], [0.11, 0.35], [0.13, 0.4]], handle: false },
    { x: 1.05, z: -0.25, scale: 0.95, profile: [[0.11, 0], [0.2, 0.09], [0.19, 0.28], [0.1, 0.42], [0.12, 0.47]], handle: true },
    { x: 1.42, z: -0.2, scale: 0.78, profile: [[0.1, 0], [0.17, 0.08], [0.16, 0.24], [0.09, 0.35], [0.11, 0.4]], handle: false },
    { x: 0.78, z: 0.24, scale: 0.62, profile: [[0.08, 0], [0.16, 0.06], [0.15, 0.19], [0.12, 0.25], [0.14, 0.29]], handle: false },
    { x: 1.15, z: 0.25, scale: 0.58, profile: [[0.07, 0], [0.14, 0.05], [0.13, 0.18], [0.1, 0.23], [0.12, 0.27]], handle: true },
    { x: 1.51, z: 0.22, scale: 0.66, profile: [[0.09, 0], [0.16, 0.06], [0.15, 0.2], [0.09, 0.28], [0.11, 0.32]], handle: false },
  ];
  vessels.forEach((vessel, index) => addLathedVessel(
    parent,
    materials.ceramic[index % materials.ceramic.length],
    {
      name: `potter.shelf.vessel-${index}`,
      x: vessel.x,
      y: 1.26,
      z: vessel.z,
      scale: vessel.scale,
      profile: vessel.profile,
      yaw: index * 0.37,
      rimMaterial: materials.ceramicEdge[index % materials.ceramicEdge.length],
      handle: vessel.handle,
    },
  ));
}

function addBucket(parent, materials) {
  const bucket = new THREE.Group();
  bucket.name = 'potter.tools.water-bucket';
  bucket.position.set(1.52, 0.05, 0.43);
  parent.add(bucket);
  const staveCount = 14;
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(
      taperedBoxGeometry(0.16, 0.09, 0.145, 0.082, 0.62),
      materials.oak[(index + 1) % materials.oak.length],
    );
    stave.name = 'potter.tools.bucket-stave';
    stave.position.set(Math.cos(angle) * 0.31, 0.31, Math.sin(angle) * 0.31);
    stave.rotation.y = -angle + Math.PI * 0.5;
    bucket.add(stave);
  }
  for (const y of [0.11, 0.56]) {
    const hoop = torus(0.32, 0.027, materials.iron, 7, 42);
    hoop.name = 'potter.tools.bucket-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    bucket.add(hoop);
  }
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 36),
    materials.water,
  );
  water.name = 'potter.tools.bucket-water';
  water.rotation.x = -Math.PI * 0.5;
  water.position.y = 0.58;
  bucket.add(water);
  const handle = torus(0.34, 0.02, materials.rope, 7, 40, Math.PI);
  handle.name = 'potter.tools.bucket-rope-handle';
  handle.rotation.z = Math.PI;
  handle.position.y = 0.56;
  bucket.add(handle);
}

function addStool(parent, materials) {
  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.31, 0.12, 24),
    materials.oak[2],
  );
  seat.name = 'potter.tools.stool-seat';
  seat.position.set(1.28, 0.62, 0.94);
  parent.add(seat);
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2;
    const leg = rectangularMemberBetween(
      new THREE.Vector3(
        1.28 + Math.cos(angle) * 0.23,
        0.57,
        0.94 + Math.sin(angle) * 0.23,
      ),
      new THREE.Vector3(
        1.28 + Math.cos(angle) * 0.35,
        0.04,
        0.94 + Math.sin(angle) * 0.35,
      ),
      0.105,
      0.1,
      materials.oakCross[index],
      0.022,
    );
    leg.name = 'potter.tools.stool-leg';
    parent.add(leg);
  }
}

function addSmallTools(parent, materials) {
  addLathedVessel(parent, materials.clayDry, {
    name: 'potter.tools.slip-bowl',
    x: -0.95,
    y: 1.44,
    z: 0.24,
    scale: 0.78,
    profile: [[0.11, 0], [0.28, 0.05], [0.3, 0.13], [0.27, 0.18]],
    rimMaterial: materials.claySlip,
  });
  const slip = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), materials.claySlip);
  slip.name = 'potter.tools.slip-bowl-liquid';
  slip.rotation.x = -Math.PI * 0.5;
  slip.position.set(-0.95, 1.58, 0.24);
  parent.add(slip);

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.28, 18),
    materials.clayDry,
  );
  cup.name = 'potter.tools.tool-cup';
  cup.position.set(0.25, 1.56, 0.22);
  parent.add(cup);
  for (let index = 0; index < 6; index += 1) {
    const angle = -0.45 + index * 0.17;
    const tool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.014, 0.4 + (index % 2) * 0.08, 7),
      index === 0 ? materials.ironEdge : materials.oakCross[index % 4],
    );
    tool.name = 'potter.tools.shaping-stick';
    tool.position.set(0.25 + (index - 2.5) * 0.025, 1.82, 0.22);
    tool.rotation.z = angle;
    parent.add(tool);
  }
  const wire = tubeFromPoints([
    new THREE.Vector3(-0.8, 1.48, 0.56),
    new THREE.Vector3(-0.7, 1.5, 0.58),
    new THREE.Vector3(-0.61, 1.47, 0.56),
  ], 0.008, materials.ironEdge, {
    tubularSegments: 14,
    radialSegments: 5,
  });
  wire.name = 'potter.tools.cutoff-wire';
  parent.add(wire);
  for (const x of [-0.82, -0.59]) {
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.025, 0.15, 8),
      materials.oak[0],
    );
    grip.name = 'potter.tools.cutoff-wire-grip';
    grip.rotation.z = Math.PI * 0.5;
    grip.position.set(x, 1.48, 0.56);
    parent.add(grip);
  }
  const sponge = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.115, 1),
    materials.sponge,
  );
  sponge.name = 'potter.tools.wet-sponge';
  sponge.scale.set(1.15, 0.48, 0.82);
  sponge.position.set(-0.67, 1.5, 0.23);
  sponge.rotation.y = 0.42;
  parent.add(sponge);
  addBucket(parent, materials);
  addStool(parent, materials);
}

export function createPottersKickWheelModel() {
  const root = makePropRoot('prop.potters-kick-wheel', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `potter-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.1], repeatScale: [0.76, 0.9] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08 + index * 0.04, 0.12],
    })),
    iron: surfaceMaterial('forged-iron', 0x292927, { name: 'potter-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5f5c56, { name: 'potter-worn-iron' }),
    wetClay: surfaceMaterial('clay', 0xa99178, {
      name: 'potter-wet-clay',
      roughness: 0.28,
      clearcoat: 0.35,
      clearcoatRoughness: 0.18,
    }),
    wetClayEdge: surfaceMaterial('clay', 0xc0aa91, {
      name: 'potter-wet-clay-highlight',
      roughness: 0.2,
      clearcoat: 0.48,
      clearcoatRoughness: 0.12,
    }),
    clayDry: surfaceMaterial('clay', 0x936143, { name: 'potter-dry-clay' }),
    claySlip: surfaceMaterial('clay', 0xb8a184, {
      name: 'potter-clay-slip',
      roughness: 0.22,
      clearcoat: 0.3,
      clearcoatRoughness: 0.15,
    }),
    ceramic: [
      surfaceMaterial('clay', 0x9b5539, { name: 'potter-terracotta-glaze' }),
      surfaceMaterial('clay', 0x315f5b, { name: 'potter-teal-glaze', roughness: 0.26, clearcoat: 0.42 }),
      surfaceMaterial('clay', 0xa47a35, { name: 'potter-ochre-glaze', roughness: 0.3, clearcoat: 0.36 }),
      surfaceMaterial('clay', 0x7c6b55, { name: 'potter-smoke-fired-clay' }),
    ],
    ceramicEdge: [
      surfaceMaterial('clay', 0xb96c4d, { name: 'potter-terracotta-rim', roughness: 0.32 }),
      surfaceMaterial('clay', 0x4c817a, { name: 'potter-teal-rim', roughness: 0.2, clearcoat: 0.5 }),
      surfaceMaterial('clay', 0xc29a4f, { name: 'potter-ochre-rim', roughness: 0.24, clearcoat: 0.45 }),
      surfaceMaterial('clay', 0x9b876f, { name: 'potter-smoke-fired-rim' }),
    ],
    rope: surfaceMaterial('rope', 0x8a6a3d, { name: 'potter-hemp-rope' }),
    water: surfaceMaterial('generic', 0x294b51, {
      name: 'potter-water',
      roughness: 0.12,
      clearcoat: 0.65,
      clearcoatRoughness: 0.06,
    }),
    sponge: surfaceMaterial('generic', 0xb79758, {
      name: 'potter-wet-natural-sponge',
      roughness: 0.86,
    }),
  };

  const frame = registerNode(root, 'potter.frame', new THREE.Group(), {
    collider: { type: 'box', size: [1.95, 1.52, 1.2], offset: [-0.25, 0.76, 0] },
    destructionGroup: 'frame',
  });
  root.add(frame);
  addFrame(frame, materials);

  const drive = registerNode(root, 'potter.drive', new THREE.Group(), {
    collider: { type: 'box', size: [1.45, 1.42, 0.9], offset: [-0.3, 0.78, 0.34] },
    destructionGroup: 'drive',
  });
  root.add(drive);
  addDrive(drive, materials);

  const clay = registerNode(root, 'potter.clay', new THREE.Group(), {
    destructionGroup: 'clay',
  });
  root.add(clay);
  addWetClay(clay, materials);

  const shelf = registerNode(root, 'potter.shelf', new THREE.Group(), {
    collider: { type: 'box', size: [1.55, 0.8, 1.0], offset: [1.15, 0.95, 0] },
    destructionGroup: 'shelf',
  });
  root.add(shelf);
  addSideShelf(shelf, materials);
  addShelfVessels(shelf, materials);

  const tools = registerNode(root, 'potter.tools', new THREE.Group(), {
    collider: { type: 'box', size: [1.3, 0.9, 1.2], offset: [1.05, 0.45, 0.68] },
    destructionGroup: 'tools',
  });
  root.add(tools);
  addSmallTools(tools, materials);

  addSocket(root, drive, 'socket.potter-flywheel-axle', new THREE.Vector3(-0.35, 0.72, 0.58));
  addSocket(root, drive, 'socket.potter-throwing-wheel', new THREE.Vector3(-0.35, 1.54, 0));
  addSocket(root, drive, 'socket.potter-treadle', new THREE.Vector3(-0.06, 0.17, 0.75));
  addSocket(root, shelf, 'socket.potter-vessel-shelf', new THREE.Vector3(1.15, 1.26, 0));

  root.userData.materialFamilies = [
    'aged-oak',
    'blackened-iron',
    'worn-iron',
    'wet-clay',
    'fired-terracotta',
    'glazed-ceramic',
    'hemp-rope',
    'water',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/potters_kick_wheel/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createPottersKickWheelModel;
