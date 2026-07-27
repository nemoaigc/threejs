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

const VERSION = 'img2threejs-village-bake-oven-v1-pbr';

function createArchPoints(width, wallHeight, archHeight, segments = 12) {
  const points = [
    [-width * 0.5, 0],
    [width * 0.5, 0],
    [width * 0.5, wallHeight],
  ];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI;
    points.push([
      Math.cos(angle) * width * 0.5,
      wallHeight + Math.sin(angle) * archHeight,
    ]);
  }
  points.push([-width * 0.5, wallHeight]);
  return points;
}

function createBreadGeometry(radius = 0.24, seed = 0) {
  const geometry = new THREE.SphereGeometry(radius, 24, 14);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const angle = Math.atan2(z, x);
    const wobble = 1 + Math.sin(angle * 3 + seed) * 0.018 + Math.cos(y * 21 + seed) * 0.01;
    position.setXYZ(index, x * 1.22 * wobble, y * 0.63, z * 0.84 * wobble);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function addLoaf(parent, materials, {
  x,
  y,
  z,
  scale = 1,
  yaw = 0,
  seed = 0,
  raw = false,
}) {
  const loaf = new THREE.Group();
  loaf.name = raw ? 'oven.food.raw-dough' : 'oven.food.rustic-loaf';
  loaf.position.set(x, y, z);
  loaf.rotation.y = yaw;
  loaf.scale.setScalar(scale);
  parent.add(loaf);
  const body = new THREE.Mesh(
    createBreadGeometry(0.24, seed),
    raw ? materials.dough : materials.bread[seed % materials.bread.length],
  );
  body.name = raw ? 'oven.food.dough-body' : 'oven.food.bread-body';
  loaf.add(body);
  for (let index = 0; index < 3; index += 1) {
    const score = tubeFromPoints([
      new THREE.Vector3(-0.16 + index * 0.14, 0.13, -0.12),
      new THREE.Vector3(-0.13 + index * 0.14, 0.16, 0),
      new THREE.Vector3(-0.1 + index * 0.14, 0.13, 0.12),
    ], 0.012, raw ? materials.flour : materials.breadScore, {
      tubularSegments: 9,
      radialSegments: 5,
    });
    score.name = 'oven.food.scored-crust';
    loaf.add(score);
  }
}

function addFoundation(parent, materials) {
  const centerX = 0.72;
  for (let row = 0; row < 4; row += 1) {
    const y = 0.14 + row * 0.26;
    const count = row % 2 === 0 ? 8 : 7;
    for (let index = 0; index < count; index += 1) {
      const x = centerX - 0.98 + (index + (row % 2 ? 0.5 : 0)) * 0.28;
      const opening = row < 3 && Math.abs(x - centerX) < 0.42;
      if (opening) continue;
      const stone = chamferedBox(
        0.3 + ((index + row) % 3) * 0.025,
        0.24,
        0.82 + ((index + row) % 2) * 0.08,
        materials.stone[(index + row * 2) % materials.stone.length],
        0.075,
      );
      stone.name = 'oven.masonry.fieldstone-block';
      stone.position.set(x, y, -0.02 + ((index + row) % 2) * 0.025);
      stone.rotation.y = ((index % 3) - 1) * 0.02;
      parent.add(stone);
    }
  }
  for (const [x, z, index] of [
    [-0.35, -0.34, 0],
    [1.8, -0.34, 1],
    [-0.35, 0.36, 2],
    [1.8, 0.36, 3],
  ]) {
    const corner = chamferedBox(0.38, 1.05, 0.48, materials.stone[index], 0.085);
    corner.name = 'oven.masonry.corner-pier';
    corner.position.set(x, 0.52, z);
    parent.add(corner);
  }
  const ledge = chamferedBox(2.55, 0.22, 1.12, materials.stone[2], 0.075);
  ledge.name = 'oven.masonry.projected-hearth-ledge';
  ledge.position.set(centerX, 1.05, 0.1);
  parent.add(ledge);

  const firewoodArch = extrudedSilhouette(
    createArchPoints(0.82, 0.3, 0.34, 12),
    0.34,
    materials.cavity,
    { bevel: 0.025, bevelSegments: 2 },
  );
  firewoodArch.name = 'oven.masonry.lower-firewood-cavity';
  firewoodArch.position.set(centerX, 0.04, 0.45);
  parent.add(firewoodArch);
}

function addDome(parent, materials) {
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
    materials.plaster,
  );
  dome.name = 'oven.shell.plastered-dome';
  dome.scale.set(1.08, 0.95, 0.9);
  dome.position.set(0.62, 1.36, -0.28);
  parent.add(dome);
  for (const [index, x, y, z, scale] of [
    [0, -0.05, 1.56, 0.58, 0.16],
    [1, 0.16, 2.15, 0.38, 0.12],
    [2, 0.98, 2.25, 0.16, 0.15],
    [3, 1.49, 1.63, 0.45, 0.13],
    [4, 0.08, 1.22, 0.54, 0.1],
  ]) {
    const chip = new THREE.Mesh(
      new THREE.SphereGeometry(scale, 10, 6),
      materials.plasterChip[index % materials.plasterChip.length],
    );
    chip.name = 'oven.shell.plaster-patch';
    chip.scale.set(1.5, 0.32, 0.5);
    chip.position.set(x, y, z);
    chip.rotation.z = index * 0.47;
    parent.add(chip);
  }
}

function addMouth(parent, materials) {
  const centerX = 0.78;
  const baseY = 1.18;
  const radius = 0.62;

  const backPanel = extrudedSilhouette(
    createArchPoints(0.94, 0.42, 0.48, 16),
    0.05,
    materials.cavity,
    { bevel: 0.035, bevelSegments: 2 },
  );
  backPanel.name = 'oven.fire.deep-arched-cavity';
  // The back panel sits just ahead of the uncut dome shell. Embers and bread occupy
  // the gap between it and the front voussoirs, so the mouth reads as a real recess.
  backPanel.position.set(centerX, baseY, 0.66);
  parent.add(backPanel);
  for (const side of [-1, 1]) {
    const liner = chamferedBox(0.08, 0.77, 0.25, materials.cavity, 0.018);
    liner.name = 'oven.fire.cavity-side-liner';
    liner.position.set(centerX + side * 0.44, baseY + 0.38, 0.76);
    liner.rotation.y = side * 0.08;
    parent.add(liner);
  }

  const floor = chamferedBox(0.96, 0.08, 0.88, materials.hearthBrick[0], 0.025);
  floor.name = 'oven.fire.tiled-hearth-floor';
  floor.position.set(centerX, baseY + 0.02, 0.5);
  parent.add(floor);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const seam = chamferedBox(0.16, 0.012, 0.12, materials.hearthBrick[(row + column) % materials.hearthBrick.length], 0.01);
      seam.name = 'oven.fire.hearth-tile';
      seam.position.set(
        centerX - 0.34 + column * 0.17,
        baseY + 0.068,
        0.22 + row * 0.17,
      );
      parent.add(seam);
    }
  }

  for (let index = 0; index < 13; index += 1) {
    const angle = (index / 12) * Math.PI;
    const brick = chamferedBox(
      0.25,
      0.18,
      0.34,
      index > 2 && index < 10
        ? materials.sootBrick[index % materials.sootBrick.length]
        : materials.brick[index % materials.brick.length],
      0.035,
    );
    brick.name = 'oven.masonry.arch-voussoir';
    brick.position.set(
      centerX + Math.cos(angle) * radius,
      baseY + 0.43 + Math.sin(angle) * radius,
      0.68,
    );
    brick.rotation.z = angle - Math.PI * 0.5;
    brick.rotation.y = ((index % 3) - 1) * 0.018;
    parent.add(brick);
  }
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row += 1) {
      const brick = chamferedBox(
        0.28,
        0.23,
        0.34,
        materials.brick[(row + (side > 0 ? 1 : 2)) % materials.brick.length],
        0.04,
      );
      brick.name = 'oven.masonry.arch-jamb-brick';
      brick.position.set(
        centerX + side * radius,
        baseY + 0.11 + row * 0.23,
        0.68,
      );
      brick.rotation.y = side * 0.012;
      parent.add(brick);
    }
  }
  const threshold = chamferedBox(1.55, 0.18, 0.5, materials.brick[1], 0.055);
  threshold.name = 'oven.masonry.hearth-threshold';
  threshold.position.set(centerX, baseY - 0.02, 0.72);
  parent.add(threshold);

  const sootHalo = torus(0.55, 0.022, materials.soot, 6, 48, Math.PI);
  sootHalo.name = 'oven.fire.soot-halo';
  sootHalo.position.set(centerX, baseY + 0.43, 0.72);
  parent.add(sootHalo);
}

function addDoor(parent, materials) {
  const hinge = new THREE.Group();
  hinge.name = 'oven.hardware.door-hinge-pivot';
  hinge.position.set(1.42, 1.2, 0.88);
  hinge.rotation.y = -0.78;
  parent.add(hinge);

  const door = extrudedSilhouette(
    createArchPoints(0.96, 0.46, 0.46, 14),
    0.09,
    materials.iron,
    { bevel: 0.045, bevelSegments: 2 },
  );
  door.name = 'oven.hardware.arched-iron-door';
  door.position.set(0.49, 0, 0);
  hinge.add(door);

  const strap = chamferedBox(0.78, 0.1, 0.06, materials.ironEdge, 0.025);
  strap.name = 'oven.hardware.door-strap';
  strap.position.set(0.49, 0.34, 0.07);
  hinge.add(strap);
  for (let index = 0; index < 6; index += 1) {
    const rivet = bolt(0.025, 0.045, materials.ironEdge);
    rivet.name = 'oven.hardware.door-rivet';
    rivet.rotation.x = Math.PI * 0.5;
    rivet.position.set(0.18 + index * 0.125, 0.34, 0.12);
    hinge.add(rivet);
  }
  const latch = tubeFromPoints([
    new THREE.Vector3(0.86, 0.5, 0.13),
    new THREE.Vector3(1.02, 0.5, 0.14),
    new THREE.Vector3(1.07, 0.42, 0.14),
  ], 0.024, materials.ironEdge, {
    tubularSegments: 12,
    radialSegments: 7,
  });
  latch.name = 'oven.hardware.door-latch';
  hinge.add(latch);

  for (const y of [0.2, 0.78]) {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.25, 10),
      materials.ironEdge,
    );
    barrel.name = 'oven.hardware.hinge-barrel';
    barrel.position.set(0.02, y, 0.08);
    hinge.add(barrel);
  }
}

function addEmbersAndBread(parent, materials) {
  for (let index = 0; index < 18; index += 1) {
    const ember = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.045 + (index % 4) * 0.012, 0),
      index % 3 === 0 ? materials.ember : materials.charcoal,
    );
    ember.name = 'oven.fire.ember-coal';
    ember.position.set(
      0.45 + (index % 6) * 0.11,
      1.27 + (index % 2) * 0.025,
      0.79 - Math.floor(index / 6) * 0.045,
    );
    parent.add(ember);
  }
  for (const [x, z, yaw] of [
    [0.52, 0.76, 0.15],
    [0.96, 0.74, -0.22],
  ]) {
    addLoaf(parent, materials, {
      x,
      y: 1.38,
      z,
      scale: 0.78,
      yaw,
      seed: x > 0.7 ? 1 : 2,
    });
  }
}

function addRoofAndChimney(parent, materials) {
  const hoodBacking = chamferedBox(1.74, 0.07, 0.76, materials.tile[2], 0.028);
  hoodBacking.name = 'oven.roof.rain-hood-backing';
  hoodBacking.position.set(0.82, 2.24, 0.14);
  hoodBacking.rotation.x = -0.3;
  parent.add(hoodBacking);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const tile = chamferedBox(
        0.22,
        0.065,
        0.34,
        materials.tile[(row + column) % materials.tile.length],
        0.026,
      );
      tile.name = 'oven.roof.curved-rain-tile';
      tile.position.set(
        0.06 + column * 0.25,
        2.235 + row * 0.055,
        0.52 - row * 0.135,
      );
      tile.rotation.x = -0.3;
      tile.rotation.y = ((column % 3) - 1) * 0.012;
      parent.add(tile);
    }
  }
  for (const [x, z, index] of [
    [0.52, -0.32, 0],
    [0.94, -0.32, 1],
    [0.52, 0.08, 2],
    [0.94, 0.08, 3],
  ]) {
    const block = chamferedBox(0.34, 0.68, 0.34, materials.plasterChip[index], 0.055);
    block.name = 'oven.roof.chimney-block';
    block.position.set(x, 2.76, z);
    parent.add(block);
  }
  for (const [x, z] of [
    [0.72, -0.31],
    [0.72, 0.07],
  ]) {
    const vent = chamferedBox(0.19, 0.23, 0.38, materials.cavity, 0.025);
    vent.name = 'oven.roof.chimney-vent';
    vent.position.set(x, 2.84, z);
    parent.add(vent);
  }
  const frontVent = chamferedBox(0.34, 0.2, 0.045, materials.cavity, 0.025);
  frontVent.name = 'oven.roof.chimney-front-vent';
  frontVent.position.set(0.72, 2.86, 0.275);
  parent.add(frontVent);
  const capBase = chamferedBox(0.92, 0.09, 0.82, materials.tile[2], 0.04);
  capBase.name = 'oven.roof.chimney-cap-base';
  capBase.position.set(0.72, 3.1, -0.12);
  parent.add(capBase);
  for (let column = 0; column < 4; column += 1) {
    const capTile = chamferedBox(
      0.24,
      0.075,
      0.72,
      materials.tile[column % materials.tile.length],
      0.028,
    );
    capTile.name = 'oven.roof.chimney-cap-tile';
    capTile.position.set(0.39 + column * 0.22, 3.17, -0.12);
    capTile.rotation.x = -0.045;
    capTile.rotation.y = ((column % 2) - 0.5) * 0.025;
    parent.add(capTile);
  }
}

function addTable(parent, materials) {
  const top = chamferedBox(2.15, 0.2, 1.14, materials.oak[1], 0.06);
  top.name = 'oven.table.flour-worn-top';
  top.position.set(-1.16, 1.02, 0.22);
  parent.add(top);
  for (const [x, z, sx, sz, yaw] of [
    [-1.72, 0.08, 0.34, 0.2, -0.2],
    [-1.13, 0.4, 0.24, 0.15, 0.35],
    [-0.58, 0.02, 0.18, 0.12, -0.48],
  ]) {
    const flourDust = new THREE.Mesh(
      new THREE.CircleGeometry(1, 26),
      materials.flourDust,
    );
    flourDust.name = 'oven.table.flour-dust-patch';
    flourDust.rotation.x = -Math.PI * 0.5;
    flourDust.rotation.z = yaw;
    flourDust.scale.set(sx, sz, 1);
    flourDust.position.set(x, 1.126, z);
    parent.add(flourDust);
  }
  for (const [index, x, z] of [
    [0, -2.05, -0.2],
    [1, -0.35, -0.2],
    [2, -2.05, 0.62],
    [3, -0.35, 0.62],
  ]) {
    const leg = rectangularMemberBetween(
      new THREE.Vector3(x + (x < -1 ? -0.05 : 0.05), 0.02, z + (z > 0 ? 0.04 : -0.04)),
      new THREE.Vector3(x, 0.93, z),
      0.18,
      0.17,
      materials.oak[index],
      0.04,
    );
    leg.name = 'oven.table.splayed-leg';
    parent.add(leg);
  }
  for (const z of [-0.18, 0.6]) {
    const rail = chamferedBox(1.8, 0.14, 0.13, materials.oakCross[z > 0 ? 1 : 2], 0.035);
    rail.name = 'oven.table.long-stretcher';
    rail.position.set(-1.2, 0.36, z);
    parent.add(rail);
  }
  const lowerShelf = chamferedBox(1.72, 0.13, 0.72, materials.oak[2], 0.04);
  lowerShelf.name = 'oven.table.cooling-shelf';
  lowerShelf.position.set(-1.2, 0.45, 0.22);
  parent.add(lowerShelf);
  for (const x of [-1.92, -0.48]) {
    for (const z of [-0.16, 0.56]) {
      const peg = bolt(0.025, 0.045, materials.ironEdge);
      peg.name = 'oven.table.iron-peg';
      peg.rotation.x = Math.PI * 0.5;
      peg.position.set(x, 0.89, z + Math.sign(z) * 0.03);
      parent.add(peg);
    }
  }
}

function addProofingBasket(parent, materials) {
  const x = -1.42;
  const y = 1.17;
  const z = 0.02;
  for (let index = 0; index < 7; index += 1) {
    const ring = torus(
      0.34 - index * 0.025,
      0.012,
      materials.wicker[index % materials.wicker.length],
      5,
      40,
    );
    ring.name = 'oven.food.proofing-basket-weave';
    ring.scale.z = 0.72;
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(x, y + index * 0.023, z);
    parent.add(ring);
  }
  const flour = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 18, 10),
    materials.flour,
  );
  flour.name = 'oven.food.floured-proofing-dough';
  flour.scale.set(1.12, 0.42, 0.78);
  flour.position.set(x, y + 0.13, z);
  parent.add(flour);
}

function addFlourSack(parent, materials) {
  const sack = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 12),
    materials.linen,
  );
  sack.name = 'oven.food.flour-sack';
  sack.scale.set(0.72, 1.18, 0.72);
  sack.position.set(-0.56, 1.34, -0.05);
  sack.rotation.z = -0.08;
  parent.add(sack);
  const neck = torus(0.13, 0.018, materials.rope, 6, 30);
  neck.name = 'oven.food.flour-sack-tie';
  neck.rotation.x = Math.PI * 0.5;
  neck.position.set(-0.59, 1.65, -0.05);
  parent.add(neck);
  const flourTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.11, 24),
    materials.flour,
  );
  flourTop.name = 'oven.food.open-flour';
  flourTop.rotation.x = -Math.PI * 0.5;
  flourTop.position.set(-0.59, 1.66, -0.05);
  parent.add(flourTop);
}

function addJug(parent, materials) {
  const jug = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0.08, 0),
      new THREE.Vector2(0.17, 0.04),
      new THREE.Vector2(0.19, 0.25),
      new THREE.Vector2(0.11, 0.39),
      new THREE.Vector2(0.12, 0.46),
    ], 28),
    materials.earthenware,
  );
  jug.name = 'oven.food.water-jug';
  jug.position.set(-2.0, 1.12, 0.02);
  parent.add(jug);
  const rim = torus(0.12, 0.018, materials.earthenwareEdge, 6, 28);
  rim.name = 'oven.food.water-jug-rim';
  rim.rotation.x = Math.PI * 0.5;
  rim.position.set(-2.0, 1.58, 0.02);
  parent.add(rim);
  const handle = torus(0.16, 0.025, materials.earthenwareEdge, 7, 32, Math.PI * 1.15);
  handle.name = 'oven.food.water-jug-handle';
  handle.rotation.y = Math.PI * 0.5;
  handle.rotation.z = -Math.PI * 0.58;
  handle.position.set(-1.86, 1.38, 0.02);
  parent.add(handle);
}

function addPeelAndRoller(parent, materials) {
  const peelBlade = extrudedSilhouette([
    [-0.28, -0.22],
    [0.28, -0.22],
    [0.3, 0.08],
    [0.18, 0.28],
    [-0.18, 0.28],
    [-0.3, 0.08],
  ], 0.055, materials.oakCross[1], { bevel: 0.025 });
  peelBlade.name = 'oven.tools.peel-blade';
  peelBlade.position.set(-0.75, 1.16, 0.66);
  peelBlade.rotation.x = -Math.PI * 0.5;
  peelBlade.rotation.z = -0.38;
  parent.add(peelBlade);
  const peelHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 1.45, 10),
    materials.oak[2],
  );
  peelHandle.name = 'oven.tools.peel-handle';
  peelHandle.rotation.z = Math.PI * 0.5 - 0.38;
  peelHandle.position.set(-1.55, 1.16, 0.6);
  parent.add(peelHandle);

  const roller = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.08, 0.72, 14),
    materials.handleWood,
  );
  roller.name = 'oven.tools.rolling-pin';
  roller.rotation.z = Math.PI * 0.5;
  roller.position.set(-1.7, 1.17, 0.39);
  parent.add(roller);
  for (const x of [-2.13, -1.27]) {
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.22, 10),
      materials.handleWood,
    );
    grip.name = 'oven.tools.rolling-pin-grip';
    grip.rotation.z = Math.PI * 0.5;
    grip.position.set(x, 1.17, 0.39);
    parent.add(grip);
  }
}

function addCoolingRack(parent, materials) {
  for (let index = 0; index < 9; index += 1) {
    const bar = chamferedBox(1.35, 0.022, 0.025, materials.iron, 0.006);
    bar.name = 'oven.food.cooling-rack-bar';
    bar.position.set(-1.25, 0.57, -0.02 + index * 0.07);
    parent.add(bar);
  }
  for (const z of [-0.05, 0.57]) {
    const rail = chamferedBox(0.035, 0.035, 0.72, materials.ironEdge, 0.008);
    rail.name = 'oven.food.cooling-rack-rail';
    rail.position.set(-1.25 + (z > 0 ? 0.63 : -0.63), 0.57, 0.28);
    parent.add(rail);
  }
  for (const [index, x, z, scale, yaw] of [
    [0, -1.72, 0.14, 0.8, 0.08],
    [1, -1.22, 0.28, 0.9, -0.2],
    [2, -0.72, 0.12, 0.76, 0.18],
  ]) {
    addLoaf(parent, materials, { x, y: 0.69, z, scale, yaw, seed: index });
  }
}

function addFirewood(parent, materials) {
  for (let index = 0; index < 12; index += 1) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.09 + (index % 3) * 0.012,
        0.1 + (index % 3) * 0.012,
        0.5,
        9,
      ),
      materials.firewood[index % materials.firewood.length],
    );
    log.name = 'oven.fuel.split-log';
    log.rotation.z = Math.PI * 0.5;
    log.position.set(
      0.45 + (index % 4) * 0.19,
      0.19 + Math.floor(index / 4) * 0.18,
      0.5 + ((index % 2) - 0.5) * 0.12,
    );
    log.rotation.y = ((index % 3) - 1) * 0.07;
    parent.add(log);
    for (const side of [-1, 1]) {
      const end = new THREE.Mesh(
        new THREE.CircleGeometry(0.08 + (index % 3) * 0.01, 9),
        materials.endGrain,
      );
      end.name = 'oven.fuel.log-end-grain';
      end.rotation.y = side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      end.position.set(
        log.position.x + side * 0.25,
        log.position.y,
        log.position.z,
      );
      parent.add(end);
    }
  }
}

function addFireTools(parent, materials) {
  const rakeShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, 1.65, 9),
    materials.ironEdge,
  );
  rakeShaft.name = 'oven.tools.ash-rake-shaft';
  rakeShaft.position.set(1.93, 0.86, 0.73);
  rakeShaft.rotation.z = -0.12;
  parent.add(rakeShaft);
  const rakeHead = chamferedBox(0.48, 0.08, 0.055, materials.ironEdge, 0.018);
  rakeHead.name = 'oven.tools.ash-rake-head';
  rakeHead.position.set(2.03, 0.08, 0.73);
  rakeHead.rotation.z = -0.12;
  parent.add(rakeHead);
  for (let index = 0; index < 6; index += 1) {
    const tine = chamferedBox(0.035, 0.23, 0.035, materials.iron, 0.008);
    tine.name = 'oven.tools.ash-rake-tine';
    tine.position.set(1.83 + index * 0.08, 0.02, 0.73);
    tine.rotation.z = -0.12;
    parent.add(tine);
  }

  const poker = tubeFromPoints([
    new THREE.Vector3(1.78, 0.06, 0.58),
    new THREE.Vector3(1.7, 1.48, 0.58),
    new THREE.Vector3(1.65, 1.66, 0.58),
  ], 0.022, materials.ironEdge, {
    tubularSegments: 20,
    radialSegments: 7,
  });
  poker.name = 'oven.tools.fire-poker';
  parent.add(poker);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.28, 11),
    materials.handleWood,
  );
  grip.name = 'oven.tools.poker-grip';
  grip.position.set(1.64, 1.73, 0.58);
  grip.rotation.z = -0.12;
  parent.add(grip);
}

export function createVillageBakeOvenModel() {
  const root = makePropRoot('prop.village-bake-oven', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `oven-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.1], repeatScale: [0.78, 0.92] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08 + index * 0.04, 0.1],
    })),
    handleWood: surfaceMaterial('wood', 0x744a29, { name: 'oven-polished-tool-wood', roughness: 0.58 }),
    stone: [0x9a8d76, 0x7f7463, 0xaea086, 0x6e675b].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `oven-fieldstone-${index}` }),
      { offset: [index * 0.16, index * 0.12], repeatScale: [0.78, 0.78] },
    )),
    plaster: surfaceMaterial('stone', 0xc1b397, { name: 'oven-lime-plaster', roughness: 0.96 }),
    plasterChip: [0xa99d85, 0x8d8372, 0xcfc1a1, 0x786f62].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `oven-plaster-patch-${index}` }),
      { offset: [index * 0.2, index * 0.13], repeatScale: [0.7, 0.7] },
    )),
    brick: [0x88483b, 0x9f5948, 0x713b34, 0xaf6750].map((color, index) => transformMaterialMaps(
      surfaceMaterial('clay', color, { name: `oven-arch-brick-${index}` }),
      { offset: [index * 0.17, index * 0.12], repeatScale: [0.8, 0.8] },
    )),
    sootBrick: [0x49312c, 0x59372f, 0x3b2b28, 0x674039].map((color, index) => transformMaterialMaps(
      surfaceMaterial('clay', color, { name: `oven-soot-darkened-arch-brick-${index}`, roughness: 0.94 }),
      { offset: [index * 0.13, index * 0.09], repeatScale: [0.82, 0.82] },
    )),
    hearthBrick: [
      surfaceMaterial('clay', 0x7d473a, { name: 'oven-hearth-brick-1' }),
      surfaceMaterial('clay', 0x925441, { name: 'oven-hearth-brick-2' }),
      surfaceMaterial('clay', 0x663a33, { name: 'oven-hearth-brick-3' }),
    ],
    tile: [0x8c4235, 0xa2513d, 0x73352e, 0xb26148].map((color, index) => transformMaterialMaps(
      surfaceMaterial('clay', color, { name: `oven-roof-tile-${index}` }),
      { offset: [index * 0.18, index * 0.11], repeatScale: [0.8, 0.8] },
    )),
    cavity: surfaceMaterial('inner-stone', 0x211d19, {
      name: 'oven-deep-soot-cavity',
      side: THREE.DoubleSide,
      roughness: 0.98,
    }),
    soot: surfaceMaterial('soil', 0x292521, { name: 'oven-soot-bloom' }),
    iron: surfaceMaterial('forged-iron', 0x292827, { name: 'oven-heat-darkened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x67625c, { name: 'oven-worn-iron-edge' }),
    charcoal: surfaceMaterial('stone', 0x171513, { name: 'oven-charcoal' }),
    ember: new THREE.MeshStandardMaterial({
      name: 'oven-live-ember',
      color: 0x7f2c12,
      emissive: 0xff6518,
      emissiveIntensity: 1.45,
      roughness: 0.7,
      metalness: 0,
    }),
    bread: [
      surfaceMaterial('grain', 0xa9682b, { name: 'oven-bread-golden' }),
      surfaceMaterial('grain', 0x8c4e24, { name: 'oven-bread-dark' }),
      surfaceMaterial('grain', 0xbd7c38, { name: 'oven-bread-light' }),
    ],
    breadScore: surfaceMaterial('grain', 0xd7a76b, { name: 'oven-bread-score' }),
    dough: surfaceMaterial('grain', 0xd8c39d, { name: 'oven-raw-dough', roughness: 0.82 }),
    flour: surfaceMaterial('grain', 0xe2d5b7, { name: 'oven-flour' }),
    flourDust: new THREE.MeshStandardMaterial({
      name: 'oven-flour-dust',
      color: 0xe7dcc2,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    linen: surfaceMaterial('burlap', 0xb8a98e, { name: 'oven-flour-sack-linen' }),
    rope: surfaceMaterial('rope', 0x866538, { name: 'oven-hemp-tie' }),
    wicker: [
      surfaceMaterial('rope', 0x8c6537, { name: 'oven-proofing-wicker-dark' }),
      surfaceMaterial('rope', 0xa77b43, { name: 'oven-proofing-wicker-mid' }),
      surfaceMaterial('rope', 0xb78d55, { name: 'oven-proofing-wicker-light' }),
    ],
    earthenware: surfaceMaterial('clay', 0x8d5238, { name: 'oven-water-jug' }),
    earthenwareEdge: surfaceMaterial('clay', 0xaf7251, { name: 'oven-water-jug-rim' }),
    firewood: [
      surfaceMaterial('bark', 0x553a27, { name: 'oven-firewood-bark-1' }),
      surfaceMaterial('bark', 0x68462c, { name: 'oven-firewood-bark-2' }),
      surfaceMaterial('bark', 0x493224, { name: 'oven-firewood-bark-3' }),
    ],
    endGrain: surfaceMaterial('split-wood', 0xb48555, { name: 'oven-log-end-grain' }),
  };

  const masonry = registerNode(root, 'oven.masonry', new THREE.Group(), {
    collider: { type: 'box', size: [2.8, 2.65, 1.75], offset: [0.72, 1.33, -0.1] },
    destructionGroup: 'masonry',
  });
  root.add(masonry);
  addFoundation(masonry, materials);
  addDome(masonry, materials);
  addMouth(masonry, materials);

  const door = registerNode(root, 'oven.door', new THREE.Group(), {
    collider: { type: 'box', size: [1.15, 1.1, 0.14], offset: [1.78, 1.68, 1.1] },
    destructionGroup: 'door',
  });
  root.add(door);
  addDoor(door, materials);

  const fire = registerNode(root, 'oven.fire', new THREE.Group(), {
    destructionGroup: 'fire',
  });
  root.add(fire);
  addEmbersAndBread(fire, materials);

  const roof = registerNode(root, 'oven.roof', new THREE.Group(), {
    collider: { type: 'box', size: [2.1, 0.95, 1.1], offset: [0.72, 2.75, -0.05] },
    destructionGroup: 'roof-and-chimney',
  });
  root.add(roof);
  addRoofAndChimney(roof, materials);

  const table = registerNode(root, 'oven.table', new THREE.Group(), {
    collider: { type: 'box', size: [2.3, 1.12, 1.25], offset: [-1.17, 0.56, 0.2] },
    destructionGroup: 'table',
  });
  root.add(table);
  addTable(table, materials);

  const food = registerNode(root, 'oven.food', new THREE.Group(), {
    destructionGroup: 'food',
  });
  root.add(food);
  addProofingBasket(food, materials);
  addFlourSack(food, materials);
  addJug(food, materials);
  addLoaf(food, materials, {
    x: -0.95,
    y: 1.18,
    z: 0.37,
    scale: 0.94,
    yaw: -0.2,
    seed: 1,
    raw: true,
  });
  addCoolingRack(food, materials);

  const tools = registerNode(root, 'oven.tools', new THREE.Group(), {
    collider: { type: 'box', size: [4.2, 1.9, 1.1], offset: [-0.05, 0.95, 0.62] },
    destructionGroup: 'tools-and-fuel',
  });
  root.add(tools);
  addPeelAndRoller(tools, materials);
  addFirewood(tools, materials);
  addFireTools(tools, materials);

  addSocket(root, door, 'socket.oven-door-hinge', new THREE.Vector3(1.42, 1.6, 0.88));
  addSocket(root, fire, 'socket.oven-ember-bed', new THREE.Vector3(0.78, 1.3, 0.3));
  addSocket(root, table, 'socket.oven-prep-surface', new THREE.Vector3(-1.16, 1.14, 0.22));
  addSocket(root, roof, 'socket.oven-chimney', new THREE.Vector3(0.72, 3.18, -0.12));

  root.userData.materialFamilies = [
    'fieldstone',
    'lime-plaster',
    'terracotta-brick',
    'curved-roof-tile',
    'soot',
    'heat-darkened-iron',
    'aged-oak',
    'bread-and-dough',
    'flour-dusted-linen',
    'wicker',
    'earthenware',
    'charcoal-and-embers',
    'split-firewood',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/village_bake_oven/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createVillageBakeOvenModel;
