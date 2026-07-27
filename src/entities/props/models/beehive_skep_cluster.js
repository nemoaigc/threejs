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

const VERSION = 'img2threejs-beehive-skep-cluster-v1-pbr';

function skepRadiusAt(t) {
  const profile = [
    0.78, 0.9, 0.98, 1.02, 1.03, 1.0, 0.95, 0.87, 0.76, 0.63, 0.49, 0.35, 0.24,
  ];
  const scaled = Math.max(0, Math.min(profile.length - 1, t * (profile.length - 1)));
  const index = Math.floor(scaled);
  const next = Math.min(profile.length - 1, index + 1);
  return THREE.MathUtils.lerp(profile[index], profile[next], scaled - index);
}

function createSkepBodyGeometry({
  radius = 0.48,
  height = 1.05,
  seed = 0,
} = {}) {
  const points = [];
  for (let index = 0; index <= 18; index += 1) {
    const t = index / 18;
    const wobble = 1 + Math.sin(index * 1.7 + seed) * 0.012;
    points.push(new THREE.Vector2(
      radius * skepRadiusAt(t) * wobble,
      t * height,
    ));
  }
  points.push(new THREE.Vector2(0.025, height * 1.015));
  const geometry = new THREE.LatheGeometry(points, 40);
  geometry.computeVertexNormals();
  return geometry;
}

function createDrapedCapGeometry({
  radius = 0.5,
  height = 0.35,
  segments = 32,
} = {}) {
  const rings = 8;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    const ringRadius = THREE.MathUtils.lerp(radius * 0.18, radius, Math.pow(t, 0.78));
    const y = height * (1 - t) + Math.sin(t * Math.PI) * 0.03;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const drape = t > 0.75
        ? Math.pow((t - 0.75) / 0.25, 1.3) * (0.06 + 0.035 * Math.sin(angle * 4))
        : 0;
      positions.push(
        Math.cos(angle) * ringRadius,
        y - drape,
        Math.sin(angle) * ringRadius,
      );
      uvs.push(segment / segments, t);
      if (ring < rings) {
        const current = ring * segments + segment;
        const next = ring * segments + (segment + 1) % segments;
        const lower = (ring + 1) * segments + segment;
        const lowerNext = (ring + 1) * segments + (segment + 1) % segments;
        indices.push(current, lower, next, next, lower, lowerNext);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createHexCell(material, radius = 0.055) {
  const points = [];
  for (let index = 0; index <= 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0,
    ));
  }
  return tubeFromPoints(points, 0.007, material, {
    tubularSegments: 12,
    radialSegments: 4,
    closed: true,
  });
}

function addFoundation(parent, materials) {
  for (const [index, x, z, yaw] of [
    [0, -1.28, -0.33, 0.04],
    [1, 1.28, -0.33, -0.035],
    [2, -1.28, 0.33, -0.025],
    [3, 1.28, 0.33, 0.045],
  ]) {
    const foot = chamferedBox(0.5, 0.3, 0.52, materials.stone[index % 3], 0.1);
    foot.name = 'beehives.foundation.limestone-foot';
    foot.position.set(x, 0.15, z);
    foot.rotation.y = yaw;
    parent.add(foot);
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 5), materials.moss);
    moss.name = 'beehives.foundation.moss';
    moss.scale.set(1.45, 0.18, 0.72);
    moss.position.set(x + (x > 0 ? -0.13 : 0.13), 0.3, z + (z > 0 ? -0.1 : 0.1));
    parent.add(moss);
  }
}

function addBench(parent, materials) {
  for (const z of [-0.35, 0.35]) {
    const runner = chamferedBox(3.15, 0.22, 0.22, materials.oak[z > 0 ? 1 : 2], 0.05);
    runner.name = 'beehives.bench.long-runner';
    runner.position.set(0, 0.48, z);
    parent.add(runner);
  }
  for (let index = 0; index < 9; index += 1) {
    const x = -1.38 + index * 0.345;
    const plank = chamferedBox(0.29, 0.11, 0.92, materials.oakCross[index % 4], 0.03);
    plank.name = 'beehives.bench.top-plank';
    plank.position.set(x, 0.64, 0);
    plank.rotation.y = ((index % 3) - 1) * 0.006;
    parent.add(plank);
    for (const z of [-0.31, 0.31]) {
      const nail = bolt(0.018, 0.05, materials.ironEdge);
      nail.name = 'beehives.bench.plank-nail';
      nail.position.set(x, 0.71, z);
      parent.add(nail);
    }
  }
  for (const x of [-1.18, 1.18]) {
    const shelfSupport = chamferedBox(0.17, 0.2, 0.72, materials.oak[x > 0 ? 3 : 0], 0.035);
    shelfSupport.name = 'beehives.bench.lower-shelf-support';
    shelfSupport.position.set(x, 0.31, 0);
    parent.add(shelfSupport);
  }
  for (let index = 0; index < 7; index += 1) {
    const x = -1.2 + index * 0.4;
    const plank = chamferedBox(0.33, 0.08, 0.66, materials.oakCross[(index + 1) % 4], 0.025);
    plank.name = 'beehives.bench.lower-shelf-plank';
    plank.position.set(x, 0.27, 0);
    parent.add(plank);
  }
}

function addEntrance(parent, materials, {
  radius,
  y,
  z,
  symbolIndex,
}) {
  const dark = extrudedSilhouette([
    [-0.115, -0.08],
    [0.115, -0.08],
    [0.115, 0.06],
    [0.09, 0.14],
    [0.04, 0.19],
    [0, 0.205],
    [-0.04, 0.19],
    [-0.09, 0.14],
    [-0.115, 0.06],
  ], 0.025, materials.entrance, {
    bevel: 0.012,
    bevelSegments: 2,
  });
  dark.name = 'beehives.skep.arched-entrance';
  dark.position.set(0, y, z);
  parent.add(dark);

  const trimPoints = [
    new THREE.Vector3(-0.13, y - 0.08, z + 0.015),
    new THREE.Vector3(-0.13, y + 0.06, z + 0.015),
    new THREE.Vector3(-0.1, y + 0.15, z + 0.015),
    new THREE.Vector3(0, y + 0.22, z + 0.015),
    new THREE.Vector3(0.1, y + 0.15, z + 0.015),
    new THREE.Vector3(0.13, y + 0.06, z + 0.015),
    new THREE.Vector3(0.13, y - 0.08, z + 0.015),
  ];
  const trim = tubeFromPoints(trimPoints, 0.018, materials.strawDark, {
    tubularSegments: 26,
    radialSegments: 6,
  });
  trim.name = 'beehives.skep.entrance-rope-trim';
  parent.add(trim);

  const landing = chamferedBox(0.34, 0.055, 0.24, materials.oakCross[symbolIndex % 4], 0.035);
  landing.name = 'beehives.skep.landing-board';
  landing.position.set(0, y - 0.11, z + 0.1);
  parent.add(landing);
  for (const x of [-0.11, 0.11]) {
    const nail = bolt(0.012, 0.03, materials.ironEdge);
    nail.name = 'beehives.skep.landing-board-nail';
    nail.position.set(x, y - 0.075, z + 0.18);
    parent.add(nail);
  }

  const symbol = new THREE.Group();
  symbol.name = 'beehives.skep.carved-symbol';
  symbol.position.set(-radius * 0.45, y + 0.28, z + 0.02);
  parent.add(symbol);
  if (symbolIndex === 0) {
    const mark = torus(0.055, 0.009, materials.symbol, 5, 20);
    mark.name = 'beehives.skep.symbol-circle';
    symbol.add(mark);
  } else if (symbolIndex === 1) {
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2;
      const line = tubeFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * 0.075, Math.sin(angle) * 0.075, 0),
      ], 0.009, materials.symbol, {
        tubularSegments: 5,
        radialSegments: 4,
      });
      line.name = 'beehives.skep.symbol-ray';
      symbol.add(line);
    }
  } else {
    const wave = tubeFromPoints([
      new THREE.Vector3(-0.07, -0.025, 0),
      new THREE.Vector3(-0.03, 0.025, 0),
      new THREE.Vector3(0.02, -0.02, 0),
      new THREE.Vector3(0.07, 0.025, 0),
    ], 0.01, materials.symbol, {
      tubularSegments: 12,
      radialSegments: 4,
    });
    wave.name = 'beehives.skep.symbol-wave';
    symbol.add(wave);
  }
}

function addSkep(parent, materials, {
  id,
  position,
  radius,
  height,
  yaw = 0,
  materialIndex = 0,
  cap = false,
}) {
  const skep = new THREE.Group();
  skep.name = `beehives.skep.${id}`;
  skep.position.copy(position);
  skep.rotation.y = yaw;
  parent.add(skep);

  const body = new THREE.Mesh(
    createSkepBodyGeometry({ radius, height, seed: materialIndex }),
    materials.strawBody[materialIndex % materials.strawBody.length],
  );
  body.name = `beehives.skep.${id}.woven-body`;
  skep.add(body);

  const coilCount = 18;
  for (let index = 0; index < coilCount; index += 1) {
    const t = (index + 0.45) / coilCount;
    const ringRadius = radius * skepRadiusAt(t) * (1 + Math.sin(index * 1.93 + materialIndex) * 0.015);
    const coil = torus(
      ringRadius,
      0.022 + (index % 3) * 0.0025,
      materials.strawCoil[(materialIndex + index) % materials.strawCoil.length],
      7,
      48,
    );
    coil.name = `beehives.skep.${id}.spiral-coil`;
    coil.rotation.x = Math.PI * 0.5;
    coil.position.y = t * height;
    coil.rotation.z = index * 0.035;
    skep.add(coil);
  }

  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2 + materialIndex * 0.6;
    const startY = 0.11 + (index % 4) * 0.18;
    const braid = tubeFromPoints([
      new THREE.Vector3(
        Math.cos(angle) * radius * skepRadiusAt(startY / height) * 0.98,
        startY,
        Math.sin(angle) * radius * skepRadiusAt(startY / height) * 0.98,
      ),
      new THREE.Vector3(
        Math.cos(angle + 0.12) * radius * skepRadiusAt((startY + 0.28) / height) * 0.99,
        Math.min(height * 0.92, startY + 0.28),
        Math.sin(angle + 0.12) * radius * skepRadiusAt((startY + 0.28) / height) * 0.99,
      ),
    ], 0.008, materials.strawDark, {
      tubularSegments: 10,
      radialSegments: 4,
    });
    braid.name = `beehives.skep.${id}.binding-stitch`;
    skep.add(braid);
  }

  addEntrance(skep, materials, {
    radius,
    y: height * 0.22,
    z: radius * 0.88,
    symbolIndex: materialIndex,
  });

  if (cap) {
    const capMesh = new THREE.Mesh(
      createDrapedCapGeometry({ radius: radius * 1.08, height: height * 0.31 }),
      materials.cap,
    );
    capMesh.name = `beehives.skep.${id}.waxed-cloth-cap`;
    capMesh.position.y = height * 0.78;
    capMesh.rotation.y = -0.18;
    skep.add(capMesh);
    for (const side of [-1, 1]) {
      const tie = tubeFromPoints([
        new THREE.Vector3(side * radius * 0.78, height * 0.78, radius * 0.28),
        new THREE.Vector3(side * radius * 0.85, height * 0.62, radius * 0.32),
        new THREE.Vector3(side * radius * 0.75, height * 0.52, radius * 0.34),
      ], 0.012, materials.capTie, {
        tubularSegments: 10,
        radialSegments: 5,
      });
      tie.name = `beehives.skep.${id}.cap-tie`;
      skep.add(tie);
    }
  }
}

function addWaterDish(parent, materials) {
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.1, 28),
    materials.clay,
  );
  dish.name = 'beehives.tools.clay-water-dish';
  dish.position.set(-1.08, 0.36, 0);
  parent.add(dish);
  const rim = torus(0.29, 0.035, materials.clayEdge, 8, 36);
  rim.name = 'beehives.tools.water-dish-rim';
  rim.rotation.x = Math.PI * 0.5;
  rim.position.set(-1.08, 0.42, 0);
  parent.add(rim);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 28),
    materials.water,
  );
  water.name = 'beehives.tools.water-dish-water';
  water.rotation.x = -Math.PI * 0.5;
  water.position.set(-1.08, 0.415, 0);
  parent.add(water);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * 2.39996;
    const pebble = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + (index % 3) * 0.006, 9, 5),
      materials.pebble[index % materials.pebble.length],
    );
    pebble.name = 'beehives.tools.water-dish-pebble';
    pebble.scale.y = 0.5;
    pebble.position.set(
      -1.08 + Math.cos(angle) * (0.09 + (index % 3) * 0.045),
      0.43,
      Math.sin(angle) * (0.08 + (index % 2) * 0.06),
    );
    parent.add(pebble);
  }
}

function addSmoker(parent, materials) {
  const smoker = new THREE.Group();
  smoker.name = 'beehives.tools.smoker';
  smoker.position.set(-0.42, 0.3, 0.05);
  smoker.rotation.z = -0.09;
  parent.add(smoker);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.34, 14, 3),
    materials.iron,
  );
  body.name = 'beehives.tools.smoker-body';
  body.position.y = 0.17;
  smoker.add(body);
  for (const y of [0.03, 0.18, 0.32]) {
    const cage = torus(0.145, 0.014, materials.ironEdge, 6, 28);
    cage.name = 'beehives.tools.smoker-cage-ring';
    cage.rotation.x = Math.PI * 0.5;
    cage.position.y = y;
    smoker.add(cage);
  }
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const guard = rectangularMemberBetween(
      new THREE.Vector3(Math.cos(angle) * 0.145, 0.03, Math.sin(angle) * 0.145),
      new THREE.Vector3(Math.cos(angle) * 0.145, 0.33, Math.sin(angle) * 0.145),
      0.014,
      0.014,
      materials.ironEdge,
      0.004,
    );
    guard.name = 'beehives.tools.smoker-cage-rail';
    smoker.add(guard);
  }
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.28, 14),
    materials.iron,
  );
  cone.name = 'beehives.tools.smoker-cone';
  cone.position.y = 0.5;
  smoker.add(cone);
  const lip = torus(0.045, 0.012, materials.ironEdge, 6, 22);
  lip.name = 'beehives.tools.smoker-spout-lip';
  lip.rotation.x = Math.PI * 0.5;
  lip.position.y = 0.65;
  smoker.add(lip);
  for (let index = 0; index < 4; index += 1) {
    const smoke = torus(0.035 + index * 0.018, 0.007, materials.smoke, 5, 24);
    smoke.name = 'beehives.tools.smoke-wisp';
    smoke.rotation.x = Math.PI * 0.5;
    smoke.position.set(Math.sin(index * 1.7) * 0.025, 0.74 + index * 0.11, 0);
    smoker.add(smoke);
  }

  const bellows = extrudedSilhouette([
    [-0.16, 0.13],
    [0.13, 0.1],
    [0.21, 0],
    [0.12, -0.1],
    [-0.16, -0.13],
  ], 0.09, materials.leather, {
    bevel: 0.035,
    bevelSegments: 2,
  });
  bellows.name = 'beehives.tools.smoker-leather-bellows';
  bellows.rotation.z = Math.PI * 0.5;
  bellows.position.set(-0.22, 0.15, 0);
  smoker.add(bellows);
  const handle = chamferedBox(0.26, 0.055, 0.07, materials.oak[1], 0.025);
  handle.name = 'beehives.tools.smoker-bellows-handle';
  handle.position.set(-0.34, 0.15, 0);
  handle.rotation.z = 0.08;
  smoker.add(handle);
}

function addHoneycombFrame(parent, materials) {
  const frame = new THREE.Group();
  frame.name = 'beehives.tools.honeycomb-frame';
  frame.position.set(0.43, 0.29, 0);
  frame.rotation.y = -0.08;
  frame.rotation.z = 0.035;
  parent.add(frame);
  for (const [x, y, w, h] of [
    [0, 0.0, 0.74, 0.09],
    [0, 0.63, 0.74, 0.09],
    [-0.34, 0.315, 0.09, 0.7],
    [0.34, 0.315, 0.09, 0.7],
  ]) {
    const member = chamferedBox(w, h, 0.08, materials.frameWood, 0.025);
    member.name = 'beehives.tools.honey-frame-member';
    member.position.set(x, y, 0);
    frame.add(member);
  }
  const rows = 7;
  const columns = 8;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = -0.26 + column * 0.075 + (row % 2) * 0.037;
      const y = 0.095 + row * 0.075;
      if (x > 0.29) continue;
      const cell = createHexCell(
        (row + column) % 5 === 0 ? materials.honey : materials.wax,
        0.044,
      );
      cell.name = 'beehives.tools.honeycomb-cell';
      cell.position.set(x, y, 0.045);
      frame.add(cell);
    }
  }
  for (const [x, y, scale] of [
    [-0.11, 0.22, 1.0],
    [0.14, 0.37, 0.75],
    [0.02, 0.51, 0.85],
  ]) {
    const honeyBlob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), materials.honey);
    honeyBlob.name = 'beehives.tools.honey-drop';
    honeyBlob.scale.set(scale, scale * 1.2, 0.4);
    honeyBlob.position.set(x, y, 0.07);
    frame.add(honeyBlob);
  }
}

function addHoneyCrock(parent, materials) {
  const crock = new THREE.Group();
  crock.name = 'beehives.tools.honey-crock';
  crock.position.set(1.15, 0.29, 0);
  parent.add(crock);
  const body = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0.12, 0),
      new THREE.Vector2(0.19, 0.05),
      new THREE.Vector2(0.22, 0.22),
      new THREE.Vector2(0.2, 0.38),
      new THREE.Vector2(0.14, 0.45),
      new THREE.Vector2(0.12, 0.52),
    ], 22),
    materials.clay,
  );
  body.name = 'beehives.tools.honey-crock-body';
  crock.add(body);
  const rim = torus(0.13, 0.025, materials.clayEdge, 8, 30);
  rim.name = 'beehives.tools.honey-crock-rim';
  rim.rotation.x = Math.PI * 0.5;
  rim.position.y = 0.52;
  crock.add(rim);
  const honey = new THREE.Mesh(new THREE.CircleGeometry(0.105, 24), materials.honey);
  honey.name = 'beehives.tools.honey-crock-surface';
  honey.rotation.x = -Math.PI * 0.5;
  honey.position.y = 0.515;
  crock.add(honey);
  const cloth = extrudedSilhouette([
    [-0.17, 0.11],
    [0.14, 0.12],
    [0.19, 0.02],
    [0.13, -0.12],
    [-0.16, -0.11],
    [-0.2, 0],
  ], 0.018, materials.crockCloth, {
    bevel: 0.015,
  });
  cloth.name = 'beehives.tools.honey-crock-cover';
  cloth.rotation.x = -Math.PI * 0.5;
  cloth.position.y = 0.57;
  crock.add(cloth);
  const tie = torus(0.14, 0.012, materials.rope, 6, 26);
  tie.name = 'beehives.tools.honey-crock-tie';
  tie.rotation.x = Math.PI * 0.5;
  tie.position.y = 0.49;
  crock.add(tie);
}

function addBee(parent, materials, {
  position,
  yaw,
  scale = 1,
}) {
  const bee = new THREE.Group();
  bee.name = 'beehives.bees.worker';
  bee.position.copy(position);
  bee.rotation.y = yaw;
  bee.scale.setScalar(scale);
  parent.add(bee);
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.028, 9, 6), materials.beeDark);
  abdomen.name = 'beehives.bees.abdomen';
  abdomen.scale.set(1.4, 0.75, 0.8);
  bee.add(abdomen);
  for (const x of [-0.015, 0.008, 0.027]) {
    const stripe = torus(0.019, 0.006, materials.beeGold, 5, 14);
    stripe.name = 'beehives.bees.gold-stripe';
    stripe.rotation.y = Math.PI * 0.5;
    stripe.position.x = x;
    bee.add(stripe);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 5), materials.beeDark);
  head.name = 'beehives.bees.head';
  head.position.x = 0.045;
  bee.add(head);
  for (const side of [-1, 1]) {
    const wing = extrudedSilhouette([
      [0, 0.035],
      [0.045, 0.02],
      [0.06, -0.01],
      [0.02, -0.025],
      [-0.01, 0],
    ], 0.004, materials.wing, {
      bevel: 0.002,
    });
    wing.name = 'beehives.bees.wing';
    wing.position.set(0, 0.018, side * 0.018);
    wing.rotation.x = side * 0.75;
    wing.rotation.z = side * 0.2;
    bee.add(wing);
  }
}

function addBees(parent, materials) {
  const positions = [
    [-0.9, 1.2, 0.72, 0.4, 1],
    [-0.65, 1.55, 0.55, 1.2, 0.9],
    [-0.1, 1.12, 0.76, -0.2, 1.05],
    [0.35, 1.63, 0.6, 0.7, 0.95],
    [0.95, 1.08, 0.71, -0.7, 1],
    [1.2, 1.46, 0.52, 1.8, 0.88],
    [0.67, 1.86, 0.18, 0.1, 0.82],
    [-1.18, 1.72, 0.12, -1.2, 0.8],
  ];
  for (const [x, y, z, yaw, scale] of positions) {
    addBee(parent, materials, {
      position: new THREE.Vector3(x, y, z),
      yaw,
      scale,
    });
  }
}

export function createBeehiveSkepClusterModel() {
  const root = makePropRoot('prop.beehive-skep-cluster', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `beehives-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.74, 0.9] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.07 + index * 0.03, 0.12],
    })),
    frameWood: surfaceMaterial('wood', 0x684527, { name: 'beehives-honey-frame-wood' }),
    iron: surfaceMaterial('forged-iron', 0x292927, { name: 'beehives-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5a5853, { name: 'beehives-worn-iron' }),
    rope: surfaceMaterial('rope', 0x8b6b3c, { name: 'beehives-hemp-rope' }),
    strawBody: [
      surfaceMaterial('hay', 0xa87a32, { name: 'beehives-straw-body-gold' }),
      surfaceMaterial('hay', 0x95682a, { name: 'beehives-straw-body-russet' }),
      surfaceMaterial('hay', 0xb18848, { name: 'beehives-straw-body-light' }),
    ],
    strawCoil: [
      surfaceMaterial('rope', 0xc39a4c, { name: 'beehives-straw-coil-light' }),
      surfaceMaterial('rope', 0xa8752d, { name: 'beehives-straw-coil-gold' }),
      surfaceMaterial('rope', 0x8f6027, { name: 'beehives-straw-coil-shadow' }),
    ],
    strawDark: surfaceMaterial('rope', 0x775026, { name: 'beehives-dark-straw-binding' }),
    entrance: surfaceMaterial('burlap', 0x2e2419, { name: 'beehives-dark-entrance' }),
    symbol: surfaceMaterial('bark', 0x5f3d20, { name: 'beehives-carved-symbol' }),
    cap: surfaceMaterial('burlap', 0x8d3f31, {
      name: 'beehives-faded-red-waxed-cloth',
      roughness: 0.78,
      side: THREE.DoubleSide,
    }),
    capTie: surfaceMaterial('rope', 0x5f4228, { name: 'beehives-cap-tie' }),
    stone: [0x99856a, 0x806f59, 0xae9a7a].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `beehives-limestone-${index}` }),
      { offset: [index * 0.18, index * 0.1], repeatScale: [0.8, 0.8] },
    )),
    moss: surfaceMaterial('moss', 0x4c6035, { name: 'beehives-foundation-moss' }),
    clay: surfaceMaterial('clay', 0x87563d, { name: 'beehives-honey-crock-clay' }),
    clayEdge: surfaceMaterial('clay', 0xab7658, { name: 'beehives-clay-rim' }),
    cork: surfaceMaterial('cork', 0x8f6e48, { name: 'beehives-cork' }),
    leather: surfaceMaterial('leather', 0x604029, { name: 'beehives-smoker-bellows-leather' }),
    wax: surfaceMaterial('wax', 0xd7ad54, { name: 'beehives-honeycomb-wax' }),
    honey: surfaceMaterial('wax', 0xc37a21, {
      name: 'beehives-amber-honey',
      roughness: 0.24,
      clearcoat: 0.38,
      clearcoatRoughness: 0.18,
    }),
    crockCloth: surfaceMaterial('burlap', 0xb9a27d, { name: 'beehives-crock-cloth-cover' }),
    pebble: [
      surfaceMaterial('stone', 0x776c5d, { name: 'beehives-water-pebble-dark' }),
      surfaceMaterial('stone', 0x9c8c73, { name: 'beehives-water-pebble-light' }),
      surfaceMaterial('stone', 0x685f52, { name: 'beehives-water-pebble-grey' }),
    ],
    water: new THREE.MeshPhysicalMaterial({
      name: 'beehives-water-dish-water',
      color: 0x71969c,
      roughness: 0.15,
      metalness: 0,
      transmission: 0.08,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.75,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    smoke: new THREE.MeshPhysicalMaterial({
      name: 'beehives-smoke-wisp',
      color: 0xa8aaa5,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    beeDark: surfaceMaterial('bark', 0x2e261e, { name: 'beehives-bee-dark' }),
    beeGold: surfaceMaterial('wax', 0xd19a31, { name: 'beehives-bee-gold' }),
    wing: new THREE.MeshPhysicalMaterial({
      name: 'beehives-bee-wing',
      color: 0xd9e3db,
      roughness: 0.2,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
      transmission: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  };

  const foundation = registerNode(root, 'beehives.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [3.2, 0.32, 1.2], offset: [0, 0.16, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addFoundation(foundation, materials);

  const bench = registerNode(root, 'beehives.bench', new THREE.Group(), {
    collider: { type: 'box', size: [3.25, 0.72, 1.0], offset: [0, 0.36, 0] },
    destructionGroup: 'bench',
  });
  root.add(bench);
  addBench(bench, materials);

  const skeps = registerNode(root, 'beehives.skeps', new THREE.Group(), {
    collider: { type: 'box', size: [3.0, 1.35, 1.15], offset: [0, 1.36, 0] },
    destructionGroup: 'skeps',
  });
  root.add(skeps);
  addSkep(skeps, materials, {
    id: 'left',
    position: new THREE.Vector3(-0.95, 0.71, 0.02),
    radius: 0.47,
    height: 1.05,
    yaw: -0.05,
    materialIndex: 0,
  });
  addSkep(skeps, materials, {
    id: 'center',
    position: new THREE.Vector3(0.02, 0.71, -0.03),
    radius: 0.54,
    height: 1.18,
    yaw: 0.03,
    materialIndex: 1,
  });
  addSkep(skeps, materials, {
    id: 'right',
    position: new THREE.Vector3(1.04, 0.71, 0.04),
    radius: 0.43,
    height: 0.92,
    yaw: 0.06,
    materialIndex: 2,
    cap: true,
  });

  const tools = registerNode(root, 'beehives.tools', new THREE.Group(), {
    destructionGroup: 'tools',
  });
  tools.position.z = 0.58;
  root.add(tools);
  addWaterDish(tools, materials);
  addSmoker(tools, materials);
  addHoneycombFrame(tools, materials);
  addHoneyCrock(tools, materials);

  const bees = registerNode(root, 'beehives.bees', new THREE.Group(), {
    destructionGroup: 'bees',
  });
  root.add(bees);
  addBees(bees, materials);

  addSocket(root, skeps, 'socket.beehives.left-entrance', new THREE.Vector3(-0.95, 0.97, 0.45));
  addSocket(root, skeps, 'socket.beehives.center-entrance', new THREE.Vector3(0.02, 0.98, 0.5));
  addSocket(root, skeps, 'socket.beehives.right-entrance', new THREE.Vector3(1.04, 0.91, 0.43));
  addSocket(root, tools, 'socket.beehives.smoker', new THREE.Vector3(-0.42, 1.1, 0.05));

  root.userData.materialFamilies = [
    'woven-straw',
    'aged-oak',
    'limestone',
    'faded-waxed-cloth',
    'blackened-iron',
    'leather',
    'clay',
    'beeswax',
    'amber-honey',
    'clear-water',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/beehive_skep_cluster/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createBeehiveSkepClusterModel;
