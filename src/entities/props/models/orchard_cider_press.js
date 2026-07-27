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

const VERSION = 'img2threejs-orchard-cider-press-v1-pbr';

function createHelixPoints({
  radius = 0.13,
  height = 0.92,
  turns = 9,
  segments = 160,
  y = 0,
} = {}) {
  const points = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const angle = t * Math.PI * 2 * turns;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      y + t * height,
      Math.sin(angle) * radius,
    ));
  }
  return points;
}

function createGearGeometry(radius = 0.34, teeth = 18, depth = 0.08) {
  const points = [];
  for (let index = 0; index < teeth * 4; index += 1) {
    const toothPhase = index % 4;
    const angle = (index / (teeth * 4)) * Math.PI * 2;
    const r = toothPhase === 1 || toothPhase === 2 ? radius : radius * 0.85;
    points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  return extrudedSilhouette(points, depth, null, { bevel: 0.012, bevelSegments: 1 }).geometry;
}

function createAppleGeometry(radius = 0.105, seed = 0) {
  const geometry = new THREE.SphereGeometry(radius, 16, 10);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const normalizedY = y / radius;
    const shoulder = 1 + (1 - Math.abs(normalizedY)) * 0.08 - Math.max(0, normalizedY) * 0.025;
    const dimple = normalizedY > 0.55 ? 1 - (normalizedY - 0.55) * 0.2 : 1;
    const irregularity = 1 + Math.sin(Math.atan2(z, x) * 4 + seed) * 0.012;
    position.setXYZ(index, x * shoulder * irregularity * dimple, y, z * shoulder * irregularity * dimple);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function addApple(parent, materials, {
  position,
  scale = 1,
  colorIndex = 0,
  yaw = 0,
  stem = true,
}) {
  const apple = new THREE.Group();
  apple.name = 'cider-press.apple';
  apple.position.copy(position);
  apple.rotation.y = yaw;
  apple.scale.setScalar(scale);
  parent.add(apple);

  const fruit = new THREE.Mesh(createAppleGeometry(0.105, yaw * 3.1), materials.apple[colorIndex % materials.apple.length]);
  fruit.name = 'cider-press.apple.fruit';
  apple.add(fruit);
  if (stem) {
    const appleStem = tubeFromPoints([
      new THREE.Vector3(0, 0.09, 0),
      new THREE.Vector3(0.012, 0.145, -0.008),
    ], 0.009, materials.stem, {
      tubularSegments: 6,
      radialSegments: 5,
    });
    appleStem.name = 'cider-press.apple.stem';
    apple.add(appleStem);
  }
}

function addFoundation(parent, materials) {
  for (const [index, x, z, yaw] of [
    [0, -0.86, -0.49, 0.05],
    [1, 0.86, -0.49, -0.04],
    [2, -0.86, 0.5, -0.025],
    [3, 0.86, 0.5, 0.04],
  ]) {
    const foot = chamferedBox(0.54, 0.26, 0.48, materials.stone[index % 3], 0.095);
    foot.name = 'cider-press.foundation.limestone-foot';
    foot.position.set(x, 0.13, z);
    foot.rotation.y = yaw;
    parent.add(foot);
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 6), materials.moss);
    moss.name = 'cider-press.foundation.moss';
    moss.scale.set(1.4, 0.18, 0.72);
    moss.position.set(x + (x > 0 ? -0.12 : 0.12), 0.27, z + (z > 0 ? -0.1 : 0.1));
    parent.add(moss);
  }
}

function addFrame(parent, materials) {
  for (const [index, x, z, topX] of [
    [0, -0.89, -0.48, -0.72],
    [1, 0.89, -0.48, 0.72],
    [2, -0.89, 0.48, -0.72],
    [3, 0.89, 0.48, 0.72],
  ]) {
    const post = rectangularMemberBetween(
      new THREE.Vector3(x, 0.3, z),
      new THREE.Vector3(topX, 2.72, z * 0.84),
      0.22,
      0.22,
      materials.oak[index % 4],
      0.045,
    );
    post.name = 'cider-press.frame.splayed-post';
    parent.add(post);

    const shoe = chamferedBox(0.29, 0.22, 0.3, materials.iron, 0.035);
    shoe.name = 'cider-press.frame.post-shoe';
    shoe.position.set(x, 0.36, z);
    shoe.rotation.y = z * 0.05;
    parent.add(shoe);
    for (const side of [-1, 1]) {
      const rivet = bolt(0.021, 0.04, materials.ironEdge);
      rivet.name = 'cider-press.frame.post-shoe-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x + side * 0.065, 0.39, z + Math.sign(z) * 0.16);
      parent.add(rivet);
    }
  }

  const crossbeam = chamferedBox(1.9, 0.34, 0.48, materials.oak[1], 0.07);
  crossbeam.name = 'cider-press.frame.heavy-crossbeam';
  crossbeam.position.set(0, 2.64, 0);
  parent.add(crossbeam);
  const lowerBeam = chamferedBox(2.0, 0.24, 0.42, materials.oakCross[2], 0.055);
  lowerBeam.name = 'cider-press.frame.lower-bed-beam';
  lowerBeam.position.set(0, 0.54, 0);
  parent.add(lowerBeam);
  for (const z of [-0.47, 0.47]) {
    const rail = chamferedBox(1.92, 0.17, 0.18, materials.oakCross[z > 0 ? 0 : 3], 0.035);
    rail.name = 'cider-press.frame.side-rail';
    rail.position.set(0, 1.13, z);
    parent.add(rail);
  }

  for (const [x, z, topX] of [
    [-0.78, -0.5, -0.24],
    [0.78, -0.5, 0.24],
    [-0.78, 0.5, -0.24],
    [0.78, 0.5, 0.24],
  ]) {
    const brace = rectangularMemberBetween(
      new THREE.Vector3(x, 0.6, z),
      new THREE.Vector3(topX, 1.25, z),
      0.105,
      0.095,
      materials.oak[(x > 0 ? 1 : 2) + (z > 0 ? 1 : 0)],
      0.026,
    );
    brace.name = 'cider-press.frame.diagonal-brace';
    parent.add(brace);
  }

  for (const x of [-0.66, 0.66]) {
    const strap = chamferedBox(0.11, 0.42, 0.51, materials.iron, 0.03);
    strap.name = 'cider-press.frame.crossbeam-strap';
    strap.position.set(x, 2.64, 0);
    parent.add(strap);
    for (const z of [-0.27, 0.27]) {
      const rivet = bolt(0.025, 0.055, materials.ironEdge);
      rivet.name = 'cider-press.frame.crossbeam-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x, 2.64, z);
      parent.add(rivet);
    }
  }
}

function addScrew(parent, materials) {
  const screw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.135, 1.12, 16, 4),
    materials.screwWood,
  );
  screw.name = 'cider-press.screw.carved-core';
  screw.position.set(0, 2.06, 0);
  parent.add(screw);
  const thread = tubeFromPoints(createHelixPoints({
    radius: 0.145,
    height: 1.0,
    turns: 8.5,
    segments: 190,
    y: 1.53,
  }), 0.027, materials.screwEdge, {
    tubularSegments: 190,
    radialSegments: 6,
  });
  thread.name = 'cider-press.screw.square-thread';
  parent.add(thread);

  for (const y of [1.52, 2.6]) {
    const collar = torus(0.16, 0.032, materials.iron, 7, 32);
    collar.name = 'cider-press.screw.iron-collar';
    collar.rotation.x = Math.PI * 0.5;
    collar.position.y = y;
    parent.add(collar);
  }
  const nut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.22, 8),
    materials.iron,
  );
  nut.name = 'cider-press.screw.octagonal-nut';
  nut.position.y = 2.7;
  parent.add(nut);

  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.62, 10),
    materials.ironEdge,
  );
  bar.name = 'cider-press.screw.turning-bar';
  bar.rotation.z = Math.PI * 0.5;
  bar.position.set(0.16, 2.77, 0);
  parent.add(bar);
  for (const x of [-0.65, 0.97]) {
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.085, 0.32, 12),
      materials.handle,
    );
    grip.name = 'cider-press.screw.bar-grip';
    grip.rotation.z = Math.PI * 0.5;
    grip.position.set(x, 2.77, 0);
    parent.add(grip);
    const ferrule = torus(0.08, 0.016, materials.iron, 6, 24);
    ferrule.name = 'cider-press.screw.grip-ferrule';
    ferrule.rotation.y = Math.PI * 0.5;
    ferrule.position.set(x + (x < 0 ? 0.12 : -0.12), 2.77, 0);
    parent.add(ferrule);
  }

  const pressPlate = new THREE.Group();
  pressPlate.name = 'cider-press.screw.press-plate';
  pressPlate.position.y = 1.45;
  parent.add(pressPlate);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const segment = chamferedBox(0.46, 0.14, 0.25, materials.oakCross[index % 4], 0.035);
    segment.name = 'cider-press.screw.press-plate-segment';
    segment.position.set(Math.cos(angle) * 0.29, 0, Math.sin(angle) * 0.29);
    segment.rotation.y = -angle;
    pressPlate.add(segment);
  }
  for (const radius of [0.22, 0.55]) {
    const hoop = torus(radius, 0.025, materials.iron, 7, 40);
    hoop.name = 'cider-press.screw.press-plate-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    pressPlate.add(hoop);
  }
}

function addPressBasket(parent, materials) {
  const tray = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.84, 0.14, 32),
    materials.trayWood,
  );
  tray.name = 'cider-press.basket.collection-tray';
  tray.position.y = 0.7;
  parent.add(tray);
  const trayRim = torus(0.82, 0.055, materials.trayWoodEdge, 9, 52);
  trayRim.name = 'cider-press.basket.tray-rim';
  trayRim.rotation.x = Math.PI * 0.5;
  trayRim.position.y = 0.78;
  parent.add(trayRim);

  const staveCount = 22;
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const radius = 0.62;
    const stave = new THREE.Mesh(
      taperedBoxGeometry(0.105, 0.1, 0.09, 0.085, 0.68),
      materials.basketWood[index % 4],
    );
    stave.name = 'cider-press.basket.vertical-stave';
    stave.position.set(Math.cos(angle) * radius, 0.78, Math.sin(angle) * radius);
    stave.rotation.y = -angle + Math.PI * 0.5;
    parent.add(stave);
  }
  for (const y of [0.88, 1.12, 1.39]) {
    const hoop = torus(0.67, 0.031, materials.iron, 7, 52);
    hoop.name = 'cider-press.basket.iron-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    parent.add(hoop);
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const rivet = bolt(0.018, 0.038, materials.ironEdge);
      rivet.name = 'cider-press.basket.hoop-rivet';
      rivet.rotation.z = Math.PI * 0.5;
      rivet.position.set(Math.cos(angle) * 0.68, y, Math.sin(angle) * 0.68);
      rivet.rotation.y = -angle;
      parent.add(rivet);
    }
  }

  const pulp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.58, 0.24, 28, 4),
    materials.pulp,
  );
  pulp.name = 'cider-press.basket.crushed-apple-pulp';
  pulp.position.y = 1.28;
  parent.add(pulp);
  for (let index = 0; index < 18; index += 1) {
    const angle = index * 2.39996;
    const radius = 0.08 + (index % 5) * 0.075;
    addApple(parent, materials, {
      position: new THREE.Vector3(
        Math.cos(angle) * radius,
        1.42 + (index % 3) * 0.018,
        Math.sin(angle) * radius,
      ),
      scale: 0.48 + (index % 4) * 0.04,
      colorIndex: index,
      yaw: angle,
      stem: index % 5 === 0,
    });
  }
}

function addSpoutAndJuice(parent, materials) {
  const spout = extrudedSilhouette([
    [-0.22, 0.07],
    [0.18, 0.07],
    [0.33, 0.02],
    [0.18, -0.08],
    [-0.22, -0.06],
  ], 0.22, materials.trayWood, {
    bevel: 0.028,
    bevelSegments: 2,
  });
  spout.name = 'cider-press.juice.wooden-spout';
  spout.rotation.y = Math.PI * 0.5;
  spout.position.set(0, 0.71, 0.94);
  parent.add(spout);

  const groove = chamferedBox(0.16, 0.025, 0.48, materials.wetWood, 0.015);
  groove.name = 'cider-press.juice.spout-groove';
  groove.position.set(0, 0.77, 1.0);
  parent.add(groove);

  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.012, 0.42, 10),
    materials.juice,
  );
  stream.name = 'cider-press.juice.stream';
  stream.position.set(0.01, 0.49, 1.21);
  stream.rotation.z = -0.035;
  parent.add(stream);

  for (let index = 0; index < 4; index += 1) {
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.018 + index * 0.002, 10, 7), materials.juice);
    drip.name = 'cider-press.juice.droplet';
    drip.scale.y = 1.5;
    drip.position.set(0.01 + index * 0.007, 0.25 + index * 0.09, 1.22);
    parent.add(drip);
  }
}

function addBucket(parent, materials) {
  const bucket = new THREE.Group();
  bucket.name = 'cider-press.juice.bucket';
  bucket.position.set(0, 0.02, 1.28);
  parent.add(bucket);
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const stave = new THREE.Mesh(
      taperedBoxGeometry(0.105, 0.075, 0.09, 0.065, 0.48),
      materials.bucketWood[index % 3],
    );
    stave.name = 'cider-press.juice.bucket-stave';
    stave.position.set(Math.cos(angle) * 0.24, 0.03, Math.sin(angle) * 0.24);
    stave.rotation.y = -angle + Math.PI * 0.5;
    bucket.add(stave);
  }
  for (const y of [0.16, 0.46]) {
    const hoop = torus(y > 0.3 ? 0.26 : 0.23, 0.018, materials.iron, 7, 34);
    hoop.name = 'cider-press.juice.bucket-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    bucket.add(hoop);
  }
  const liquid = new THREE.Mesh(
    new THREE.CircleGeometry(0.21, 28),
    materials.juice,
  );
  liquid.name = 'cider-press.juice.bucket-liquid';
  liquid.rotation.x = -Math.PI * 0.5;
  liquid.position.y = 0.43;
  bucket.add(liquid);
  const handle = torus(0.32, 0.018, materials.ironEdge, 7, 40, Math.PI);
  handle.name = 'cider-press.juice.bucket-handle';
  handle.position.y = 0.48;
  bucket.add(handle);
}

function addCrank(parent, materials) {
  const gearGeometry = createGearGeometry(0.34, 18, 0.08);
  const gear = new THREE.Mesh(gearGeometry, materials.iron);
  gear.name = 'cider-press.crank.ratchet-wheel';
  gear.rotation.y = Math.PI * 0.5;
  gear.position.set(0.96, 1.75, 0);
  parent.add(gear);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.18, 12),
    materials.ironEdge,
  );
  hub.name = 'cider-press.crank.ratchet-hub';
  hub.rotation.z = Math.PI * 0.5;
  hub.position.set(0.96, 1.75, 0);
  parent.add(hub);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const spoke = rectangularMemberBetween(
      new THREE.Vector3(0.97, 1.75, 0),
      new THREE.Vector3(0.97, 1.75 + Math.sin(angle) * 0.25, Math.cos(angle) * 0.25),
      0.035,
      0.035,
      materials.ironEdge,
      0.008,
    );
    spoke.name = 'cider-press.crank.ratchet-spoke';
    parent.add(spoke);
  }

  const arm = rectangularMemberBetween(
    new THREE.Vector3(1.02, 1.75, 0),
    new THREE.Vector3(1.08, 1.18, 0.08),
    0.065,
    0.07,
    materials.iron,
    0.018,
  );
  arm.name = 'cider-press.crank.handle-arm';
  parent.add(arm);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.3, 12),
    materials.handle,
  );
  grip.name = 'cider-press.crank.wood-grip';
  grip.rotation.x = Math.PI * 0.5;
  grip.position.set(1.08, 1.16, 0.2);
  parent.add(grip);
  for (const z of [0.06, 0.34]) {
    const ferrule = torus(0.072, 0.014, materials.ironEdge, 6, 22);
    ferrule.name = 'cider-press.crank.grip-ferrule';
    ferrule.position.set(1.08, 1.16, z);
    parent.add(ferrule);
  }

  const pawl = rectangularMemberBetween(
    new THREE.Vector3(0.93, 2.04, 0.06),
    new THREE.Vector3(0.86, 1.88, 0.05),
    0.055,
    0.05,
    materials.ironEdge,
    0.014,
  );
  pawl.name = 'cider-press.crank.ratchet-pawl';
  parent.add(pawl);
}

function addAppleCrate(parent, materials) {
  const crate = new THREE.Group();
  crate.name = 'cider-press.cargo.apple-crate';
  crate.position.set(-1.22, 0.08, 0.62);
  crate.rotation.y = -0.18;
  parent.add(crate);
  for (const y of [0.06, 0.25, 0.44]) {
    for (const z of [-0.32, 0.32]) {
      const slat = chamferedBox(0.7, 0.1, 0.065, materials.crateWood[(Math.round(y * 10) + (z > 0 ? 1 : 0)) % 3], 0.02);
      slat.name = 'cider-press.cargo.crate-slat';
      slat.position.set(0, y, z);
      crate.add(slat);
    }
  }
  for (const x of [-0.31, 0.31]) {
    for (const z of [-0.29, 0.29]) {
      const corner = chamferedBox(0.075, 0.48, 0.075, materials.crateWood[2], 0.018);
      corner.name = 'cider-press.cargo.crate-corner';
      corner.position.set(x, 0.25, z);
      crate.add(corner);
    }
  }
  for (let index = 0; index < 15; index += 1) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    addApple(crate, materials, {
      position: new THREE.Vector3(
        -0.25 + col * 0.125 + (row % 2) * 0.02,
        0.46 + row * 0.065,
        -0.18 + row * 0.17,
      ),
      scale: 0.78 + (index % 3) * 0.04,
      colorIndex: index,
      yaw: index * 0.7,
      stem: index % 3 === 0,
    });
  }
}

function addLooseCargo(parent, materials) {
  addAppleCrate(parent, materials);
  for (let index = 0; index < 9; index += 1) {
    const angle = index * 1.7;
    addApple(parent, materials, {
      position: new THREE.Vector3(
        -0.85 + Math.cos(angle) * (0.32 + (index % 3) * 0.08),
        0.11,
        0.95 + Math.sin(angle) * (0.24 + (index % 2) * 0.08),
      ),
      scale: 0.82 + (index % 4) * 0.035,
      colorIndex: index + 1,
      yaw: angle,
      stem: index % 4 === 0,
    });
  }

  const rope = torus(0.24, 0.03, materials.rope, 8, 40);
  rope.name = 'cider-press.cargo.rope-coil';
  rope.rotation.y = Math.PI * 0.5;
  rope.position.set(1.18, 0.28, -0.62);
  parent.add(rope);
  for (const x of [1.14, 1.22]) {
    const tie = torus(0.255, 0.012, materials.ropeDark, 5, 30);
    tie.name = 'cider-press.cargo.rope-coil-tie';
    tie.rotation.y = Math.PI * 0.5;
    tie.position.set(x, 0.28, -0.62);
    parent.add(tie);
  }

  const cloth = extrudedSilhouette([
    [-0.38, 0.22],
    [-0.2, 0.28],
    [0.1, 0.21],
    [0.39, 0.26],
    [0.42, -0.14],
    [0.08, -0.22],
    [-0.24, -0.18],
    [-0.4, -0.05],
  ], 0.025, materials.cloth, {
    bevel: 0.02,
    bevelSegments: 2,
  });
  cloth.name = 'cider-press.cargo.folded-stained-cloth';
  cloth.rotation.x = -Math.PI * 0.5;
  cloth.rotation.z = 0.18;
  cloth.position.set(0.82, 0.18, -0.85);
  parent.add(cloth);
  const stain = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 6), materials.clothStain);
  stain.name = 'cider-press.cargo.cloth-stain';
  stain.scale.set(1.5, 0.15, 0.72);
  stain.position.set(0.86, 0.2, -0.84);
  parent.add(stain);
}

export function createOrchardCiderPressModel() {
  const root = makePropRoot('prop.orchard-cider-press', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `cider-press-frame-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.72, 0.88] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.07 + index * 0.03, 0.12],
    })),
    screwWood: surfaceMaterial('wood', 0x5e381f, { name: 'cider-press-carved-screw' }),
    screwEdge: surfaceMaterial('wood', 0x7d5030, { name: 'cider-press-screw-thread-edge' }),
    trayWood: surfaceMaterial('wood', 0x543522, { name: 'cider-press-collection-tray' }),
    trayWoodEdge: surfaceMaterial('wood', 0x754b2e, { name: 'cider-press-tray-rim' }),
    wetWood: surfaceMaterial('wood', 0x34251b, {
      name: 'cider-press-juice-wet-wood',
      roughness: 0.48,
      clearcoat: 0.16,
      clearcoatRoughness: 0.62,
    }),
    basketWood: [0x865d37, 0x704827, 0x9a7045, 0x5e3c25].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `cider-press-basket-stave-${index}` }),
      { offset: [index * 0.16, index * 0.1], repeatScale: [0.76, 0.9] },
    )),
    bucketWood: [0x744929, 0x5e3b25, 0x885d39].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `cider-press-bucket-wood-${index}` }),
      { offset: [index * 0.17, index * 0.12], repeatScale: [0.8, 0.9] },
    )),
    crateWood: [0x8c623b, 0x714827, 0x5d3a22].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `cider-press-crate-wood-${index}` }),
      { offset: [index * 0.18, index * 0.08], repeatScale: [0.8, 0.9] },
    )),
    handle: surfaceMaterial('wood', 0x765037, { name: 'cider-press-handle-wood' }),
    iron: surfaceMaterial('forged-iron', 0x292826, { name: 'cider-press-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5c5750, { name: 'cider-press-worn-iron' }),
    rope: surfaceMaterial('rope', 0x9b7a45, { name: 'cider-press-hemp-rope' }),
    ropeDark: surfaceMaterial('rope', 0x6e5232, { name: 'cider-press-rope-ties' }),
    moss: surfaceMaterial('moss', 0x4a5e32, { name: 'cider-press-foundation-moss' }),
    stone: [0x998367, 0x806e57, 0xad9877].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `cider-press-limestone-${index}` }),
      { offset: [index * 0.18, index * 0.1], repeatScale: [0.8, 0.8] },
    )),
    pulp: surfaceMaterial('fruit', 0x8b5c2c, {
      name: 'cider-press-crushed-apple-pulp',
      roughness: 0.62,
    }),
    apple: [
      surfaceMaterial('fruit', 0x9c3f28, { name: 'cider-press-russet-red-apple' }),
      surfaceMaterial('fruit', 0xa66b2a, { name: 'cider-press-golden-russet-apple' }),
      surfaceMaterial('fruit', 0x78542a, { name: 'cider-press-brown-russet-apple' }),
      surfaceMaterial('fruit', 0x6f6b2f, { name: 'cider-press-green-russet-apple' }),
    ],
    stem: surfaceMaterial('bark', 0x46311f, { name: 'cider-press-apple-stem' }),
    cloth: surfaceMaterial('burlap', 0xa78a68, { name: 'cider-press-folded-cloth' }),
    clothStain: surfaceMaterial('burlap', 0x765032, { name: 'cider-press-cider-stain' }),
    juice: new THREE.MeshPhysicalMaterial({
      name: 'cider-press-amber-juice',
      color: 0xc27a25,
      roughness: 0.12,
      metalness: 0,
      transmission: 0.12,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.86,
      clearcoatRoughness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };

  const foundation = registerNode(root, 'cider-press.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [2.15, 0.3, 1.3], offset: [0, 0.15, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addFoundation(foundation, materials);

  const frame = registerNode(root, 'cider-press.frame', new THREE.Group(), {
    collider: { type: 'box', size: [2.1, 2.85, 1.2], offset: [0, 1.43, 0] },
    destructionGroup: 'frame',
  });
  root.add(frame);
  addFrame(frame, materials);

  const screw = registerNode(root, 'cider-press.screw', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.25, height: 1.45, offset: [0, 2.0, 0] },
    destructionGroup: 'screw',
  });
  root.add(screw);
  addScrew(screw, materials);

  const basket = registerNode(root, 'cider-press.basket', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.86, height: 0.85, offset: [0, 1.07, 0] },
    destructionGroup: 'press-basket',
  });
  root.add(basket);
  addPressBasket(basket, materials);

  const juice = registerNode(root, 'cider-press.juice', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.32, height: 0.54, offset: [0, 0.29, 1.28] },
    destructionGroup: 'juice-catch',
  });
  root.add(juice);
  addSpoutAndJuice(juice, materials);
  addBucket(juice, materials);

  const crank = registerNode(root, 'cider-press.crank', new THREE.Group(), {
    destructionGroup: 'crank',
  });
  root.add(crank);
  addCrank(crank, materials);

  const cargo = registerNode(root, 'cider-press.cargo', new THREE.Group(), {
    destructionGroup: 'cargo',
  });
  root.add(cargo);
  addLooseCargo(cargo, materials);

  addSocket(root, screw, 'socket.cider-press-turning-bar', new THREE.Vector3(0, 2.77, 0));
  addSocket(root, basket, 'socket.cider-press-basket', new THREE.Vector3(0, 1.45, 0));
  addSocket(root, juice, 'socket.cider-press-bucket', new THREE.Vector3(0, 0.55, 1.28));
  addSocket(root, cargo, 'socket.cider-press-apple-crate', new THREE.Vector3(-1.22, 0.64, 0.62));

  root.userData.materialFamilies = [
    'heavy-aged-oak',
    'slatted-press-basket',
    'blackened-iron',
    'worn-iron',
    'limestone',
    'russet-apples',
    'apple-pulp',
    'amber-cider',
    'hemp-rope',
    'stained-cloth',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/orchard_cider_press/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createOrchardCiderPressModel;
