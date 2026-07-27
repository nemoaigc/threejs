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

const VERSION = 'img2threejs-coopers-workbench-v1-pbr';

function createHorizontalStaveGeometry({
  length = 1.82,
  radius = 0.61,
  thickness = 0.075,
  angularWidth = Math.PI * 2 / 20 * 0.82,
  centerAngle = 0,
  bulge = 0.095,
  segments = 8,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const angle0 = centerAngle - angularWidth * 0.5;
  const angle1 = centerAngle + angularWidth * 0.5;

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = (t - 0.5) * length;
    const outerRadius = radius + Math.sin(t * Math.PI) * bulge;
    const innerRadius = outerRadius - thickness;
    for (const [r, angle, u] of [
      [outerRadius, angle0, 0],
      [outerRadius, angle1, 1],
      [innerRadius, angle0, 0],
      [innerRadius, angle1, 1],
    ]) {
      positions.push(x, Math.cos(angle) * r, Math.sin(angle) * r);
      uvs.push(t, u);
    }
  }

  for (let index = 0; index < segments; index += 1) {
    const a = index * 4;
    const n = a + 4;
    indices.push(
      a, n, a + 1,
      a + 1, n, n + 1,
      a + 2, a + 3, n + 2,
      a + 3, n + 3, n + 2,
      a, a + 2, n,
      a + 2, n + 2, n,
      a + 1, n + 1, a + 3,
      a + 3, n + 1, n + 3,
    );
  }
  indices.push(0, 1, 2, 1, 3, 2);
  const end = segments * 4;
  indices.push(end, end + 2, end + 1, end + 1, end + 2, end + 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addBench(parent, materials) {
  const top = chamferedBox(2.65, 0.24, 1.28, materials.agedOak[1], 0.065);
  top.name = 'cooper.bench.heavy-top';
  top.position.set(-0.35, 0.78, -0.12);
  parent.add(top);
  for (const [index, x, z] of [
    [0, -1.25, -0.48],
    [1, 0.55, -0.48],
    [2, -1.25, 0.3],
    [3, 0.55, 0.3],
  ]) {
    const leg = rectangularMemberBetween(
      new THREE.Vector3(x + (x < 0 ? -0.08 : 0.08), 0.02, z + (z < 0 ? -0.06 : 0.06)),
      new THREE.Vector3(x, 0.7, z),
      0.24,
      0.22,
      materials.agedOak[index],
      0.055,
    );
    leg.name = 'cooper.bench.splayed-leg';
    parent.add(leg);
  }
  for (const z of [-0.47, 0.3]) {
    const rail = chamferedBox(2.2, 0.16, 0.15, materials.agedOakCross[z > 0 ? 1 : 2], 0.04);
    rail.name = 'cooper.bench.long-stretcher';
    rail.position.set(-0.35, 0.29, z);
    parent.add(rail);
  }
  for (const x of [-1.18, 0.48]) {
    const rail = chamferedBox(0.16, 0.14, 0.88, materials.agedOak[x < 0 ? 3 : 0], 0.035);
    rail.name = 'cooper.bench.cross-stretcher';
    rail.position.set(x, 0.31, -0.08);
    parent.add(rail);
  }

  const drawer = chamferedBox(0.72, 0.25, 0.52, materials.agedOak[2], 0.035);
  drawer.name = 'cooper.bench.shaving-drawer';
  drawer.position.set(0.24, 0.61, 0.63);
  parent.add(drawer);
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 8),
    materials.agedOak[0],
  );
  knob.name = 'cooper.bench.drawer-knob';
  knob.position.set(0.24, 0.61, 0.92);
  parent.add(knob);

  for (const [x, z, index] of [
    [-1.22, 0.52, 0],
    [-0.42, 0.52, 1],
    [0.38, 0.52, 2],
  ]) {
    const plate = chamferedBox(0.22, 0.15, 0.035, materials.iron, 0.02);
    plate.name = 'cooper.bench.iron-repair-plate';
    plate.position.set(x, 0.84, z);
    parent.add(plate);
    for (const dx of [-0.06, 0.06]) {
      const rivet = bolt(0.017, 0.03, materials.ironEdge);
      rivet.name = 'cooper.bench.repair-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x + dx, 0.84, z + 0.025);
      parent.add(rivet);
    }
  }
}

function addCradle(parent, materials) {
  for (const x of [-1.02, 0.32]) {
    const base = chamferedBox(0.24, 0.58, 1.18, materials.agedOak[x < 0 ? 2 : 0], 0.055);
    base.name = 'cooper.bench.cradle-block';
    base.position.set(x, 1.05, -0.05);
    parent.add(base);
    for (const side of [-1, 1]) {
      const cheek = rectangularMemberBetween(
        new THREE.Vector3(x, 1.1, side * 0.42 - 0.05),
        new THREE.Vector3(x, 1.56, side * 0.68 - 0.05),
        0.18,
        0.16,
        materials.agedOakCross[side > 0 ? 1 : 3],
        0.04,
      );
      cheek.name = 'cooper.bench.cradle-cheek';
      parent.add(cheek);
    }
  }
  for (const z of [-0.57, 0.47]) {
    const runner = chamferedBox(1.82, 0.18, 0.18, materials.agedOakCross[z > 0 ? 0 : 2], 0.04);
    runner.name = 'cooper.bench.cradle-runner';
    runner.position.set(-0.35, 1.04, z);
    parent.add(runner);
  }
}

function addOpenBarrel(parent, materials) {
  const barrel = new THREE.Group();
  barrel.name = 'cooper.barrel.open-shell';
  barrel.position.set(-0.35, 1.62, -0.05);
  parent.add(barrel);

  const staveCount = 20;
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(
      createHorizontalStaveGeometry({
        centerAngle: angle,
        angularWidth: Math.PI * 2 / staveCount * 0.965,
        length: 1.82 + ((index % 3) - 1) * 0.025,
        radius: 0.61,
        thickness: 0.075,
        bulge: 0.09,
      }),
      materials.freshOak[index % materials.freshOak.length],
    );
    stave.name = 'cooper.barrel.curved-stave';
    stave.position.x = ((index % 4) - 1.5) * 0.006;
    barrel.add(stave);
  }
  const innerSleeveMaterial = materials.innerOak.clone();
  innerSleeveMaterial.name = 'cooper-dark-inner-stave-sleeve';
  innerSleeveMaterial.side = THREE.BackSide;
  const innerSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.535, 0.535, 1.68, 40, 1, true),
    innerSleeveMaterial,
  );
  innerSleeve.name = 'cooper.barrel.inner-stave-sleeve';
  innerSleeve.rotation.z = Math.PI * 0.5;
  barrel.add(innerSleeve);
  for (const x of [-0.65, -0.22, 0.24, 0.66]) {
    const hoop = torus(
      0.61 + Math.sin((x / 1.82 + 0.5) * Math.PI) * 0.09 + 0.02,
      0.032,
      materials.iron,
      7,
      64,
    );
    hoop.name = 'cooper.barrel.fitted-hoop';
    hoop.rotation.y = Math.PI * 0.5;
    hoop.position.x = x;
    barrel.add(hoop);
    for (const angle of [0.32, Math.PI + 0.32]) {
      const rivet = bolt(0.019, 0.035, materials.ironEdge);
      rivet.name = 'cooper.barrel.hoop-rivet';
      rivet.rotation.z = Math.PI * 0.5;
      rivet.position.set(
        x + 0.038,
        Math.cos(angle) * 0.67,
        Math.sin(angle) * 0.67,
      );
      barrel.add(rivet);
    }
  }
  const innerShade = new THREE.Mesh(
    new THREE.CircleGeometry(0.535, 48),
    materials.innerOak,
  );
  innerShade.name = 'cooper.barrel.deep-interior';
  innerShade.rotation.y = Math.PI * 0.5;
  innerShade.position.x = -0.84;
  barrel.add(innerShade);

  for (let index = 0; index < 4; index += 1) {
    const rope = torus(
      0.72 + index * 0.006,
      0.018,
      materials.rope,
      6,
      56,
    );
    rope.name = 'cooper.barrel.rope-clamp';
    rope.rotation.y = Math.PI * 0.5;
    rope.position.x = 0.04 + index * 0.025;
    barrel.add(rope);
  }
  const windlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.54, 12),
    materials.agedOak[0],
  );
  windlass.name = 'cooper.barrel.rope-windlass';
  windlass.position.set(0.05, -0.06, 0.73);
  windlass.rotation.x = Math.PI * 0.5;
  barrel.add(windlass);
  const handle = chamferedBox(0.12, 0.44, 0.1, materials.agedOak[3], 0.025);
  handle.name = 'cooper.barrel.windlass-handle';
  handle.position.set(0.05, -0.2, 0.79);
  handle.rotation.z = -0.08;
  barrel.add(handle);

  const ropeTail = tubeFromPoints([
    new THREE.Vector3(0.08, -0.03, 0.74),
    new THREE.Vector3(0.16, -0.3, 0.82),
    new THREE.Vector3(0.1, -0.53, 0.75),
    new THREE.Vector3(-0.02, -0.63, 0.68),
  ], 0.022, materials.rope, {
    tubularSegments: 28,
    radialSegments: 7,
  });
  ropeTail.name = 'cooper.barrel.rope-tail';
  barrel.add(ropeTail);
  for (let index = 0; index < 3; index += 1) {
    const knot = torus(0.075 - index * 0.012, 0.019, materials.rope, 7, 26);
    knot.name = 'cooper.barrel.rope-knot';
    knot.rotation.set(Math.PI * 0.5, index * 0.72, index * 0.48);
    knot.position.set(0.07, -0.27 - index * 0.025, 0.78);
    barrel.add(knot);
  }
}

function addStaveRack(parent, materials) {
  const x = 1.3;
  const z = -0.3;
  for (const [dx, dz, h] of [
    [-0.48, -0.3, 1.55],
    [0.48, -0.3, 1.62],
    [-0.48, 0.3, 1.45],
    [0.48, 0.3, 1.52],
  ]) {
    const post = chamferedBox(0.16, h, 0.16, materials.agedOak[(dx > 0 ? 1 : 0) + (dz > 0 ? 2 : 0)], 0.035);
    post.name = 'cooper.stock.rack-post';
    post.position.set(x + dx, h * 0.5, z + dz);
    parent.add(post);
  }
  for (const y of [0.25, 0.88]) {
    for (const dz of [-0.3, 0.3]) {
      const rail = chamferedBox(1.16, 0.14, 0.14, materials.agedOakCross[y > 0.5 ? 1 : 2], 0.03);
      rail.name = 'cooper.stock.rack-rail';
      rail.position.set(x, y, z + dz);
      parent.add(rail);
    }
  }
  for (let index = 0; index < 12; index += 1) {
    const staveHeight = 1.08 + (index % 4) * 0.09;
    const stave = chamferedBox(
      0.13 + (index % 3) * 0.014,
      staveHeight,
      0.075,
      materials.freshOak[index % materials.freshOak.length],
      0.025,
    );
    stave.name = 'cooper.stock.spare-stave';
    stave.position.set(
      x - 0.42 + (index % 6) * 0.17,
      0.45 + staveHeight * 0.5,
      z - 0.1 + Math.floor(index / 6) * 0.18,
    );
    stave.rotation.z = ((index % 5) - 2) * 0.025;
    parent.add(stave);
  }
}

function addFinishedCask(parent, materials) {
  const cask = new THREE.Group();
  cask.name = 'cooper.stock.completed-cask';
  cask.position.set(1.62, 0.08, 0.46);
  cask.scale.setScalar(0.84);
  parent.add(cask);
  const staveCount = 16;
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(
      taperedBoxGeometry(0.17, 0.09, 0.155, 0.082, 0.92),
      materials.agedOak[(index + 1) % materials.agedOak.length],
    );
    stave.name = 'cooper.stock.cask-stave';
    stave.position.set(
      Math.cos(angle) * 0.37,
      0.54,
      Math.sin(angle) * 0.37,
    );
    stave.rotation.y = -angle + Math.PI * 0.5;
    cask.add(stave);
  }
  for (const y of [0.22, 0.54, 0.89]) {
    const hoop = torus(0.38, 0.028, materials.iron, 7, 48);
    hoop.name = 'cooper.stock.cask-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    cask.add(hoop);
  }
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.075, 24),
    materials.agedOakCross[0],
  );
  lid.name = 'cooper.stock.cask-lid';
  lid.position.y = 1.045;
  cask.add(lid);
  const bung = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 0.12, 10),
    materials.agedOak[0],
  );
  bung.name = 'cooper.stock.cask-bung';
  bung.position.y = 1.1;
  cask.add(bung);

  const tap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.28, 10),
    materials.brass,
  );
  tap.name = 'cooper.stock.cask-tap';
  tap.rotation.x = Math.PI * 0.5;
  tap.position.set(0, 0.45, 0.47);
  cask.add(tap);
  const tapHandle = chamferedBox(0.24, 0.05, 0.07, materials.agedOak[2], 0.015);
  tapHandle.name = 'cooper.stock.cask-tap-handle';
  tapHandle.position.set(0, 0.5, 0.61);
  cask.add(tapHandle);
  for (const x of [-0.25, 0.25]) {
    const foot = chamferedBox(0.22, 0.14, 0.52, materials.agedOak[x > 0 ? 1 : 3], 0.035);
    foot.name = 'cooper.stock.cask-foot';
    foot.position.set(x, -0.01, 0);
    cask.add(foot);
  }
}

function addBrazier(parent, materials) {
  const brazier = new THREE.Group();
  brazier.name = 'cooper.fire.hoop-brazier';
  brazier.position.set(-1.72, 0.05, 0.7);
  parent.add(brazier);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.29, 0.5, 24, 2, true),
    materials.iron,
  );
  body.name = 'cooper.fire.brazier-body';
  body.position.y = 0.35;
  brazier.add(body);
  for (const y of [0.12, 0.56]) {
    const hoop = torus(y > 0.3 ? 0.36 : 0.3, 0.035, materials.ironEdge, 7, 42);
    hoop.name = 'cooper.fire.brazier-band';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    brazier.add(hoop);
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const coal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.075 + (index % 3) * 0.01, 0),
      index % 4 === 0 ? materials.ember : materials.charcoal,
    );
    coal.name = 'cooper.fire.brazier-coal';
    coal.position.set(Math.cos(angle) * 0.2, 0.59, Math.sin(angle) * 0.2);
    brazier.add(coal);
  }
  for (const angle of [0.45, 2.1, 3.75, 5.4]) {
    const leg = rectangularMemberBetween(
      new THREE.Vector3(Math.cos(angle) * 0.24, 0.14, Math.sin(angle) * 0.24),
      new THREE.Vector3(Math.cos(angle) * 0.31, 0, Math.sin(angle) * 0.31),
      0.055,
      0.045,
      materials.iron,
      0.012,
    );
    leg.name = 'cooper.fire.brazier-leg';
    brazier.add(leg);
  }
}

function addDrawknife(parent, materials) {
  const blade = extrudedSilhouette([
    [-0.42, -0.05],
    [0.42, -0.05],
    [0.34, 0.08],
    [-0.34, 0.08],
  ], 0.035, materials.ironEdge, { bevel: 0.012 });
  blade.name = 'cooper.tools.drawknife-blade';
  blade.position.set(-0.92, 0.1, 1.05);
  blade.rotation.x = -Math.PI * 0.5;
  parent.add(blade);
  for (const side of [-1, 1]) {
    const tang = tubeFromPoints([
      new THREE.Vector3(-0.92 + side * 0.36, 0.12, 1.05),
      new THREE.Vector3(-0.92 + side * 0.52, 0.12, 1.1),
    ], 0.022, materials.iron, {
      tubularSegments: 6,
      radialSegments: 6,
    });
    tang.name = 'cooper.tools.drawknife-tang';
    parent.add(tang);
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.34, 12),
      materials.handleWood,
    );
    handle.name = 'cooper.tools.drawknife-handle';
    handle.rotation.z = Math.PI * 0.5;
    handle.position.set(-0.92 + side * 0.69, 0.12, 1.14);
    parent.add(handle);
  }
}

function addMallet(parent, materials, {
  x,
  z,
  yaw,
  headMaterial = null,
  scale = 1,
}) {
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035 * scale, 0.045 * scale, 0.72 * scale, 10),
    materials.handleWood,
  );
  handle.name = 'cooper.tools.mallet-handle';
  handle.rotation.z = Math.PI * 0.5;
  handle.rotation.y = yaw;
  handle.position.set(x, 0.13, z);
  parent.add(handle);
  const dx = Math.cos(yaw) * 0.32 * scale;
  const dz = -Math.sin(yaw) * 0.32 * scale;
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * scale, 0.14 * scale, 0.32 * scale, 14),
    headMaterial ?? materials.agedOak[2],
  );
  head.name = 'cooper.tools.mallet-head';
  head.rotation.z = Math.PI * 0.5;
  head.rotation.y = yaw;
  head.position.set(x + dx, 0.13, z + dz);
  parent.add(head);
}

function addPlane(parent, materials) {
  const body = chamferedBox(0.72, 0.18, 0.22, materials.agedOak[1], 0.045);
  body.name = 'cooper.tools.croze-plane';
  body.position.set(-0.02, 0.12, 1.05);
  body.rotation.y = -0.22;
  parent.add(body);
  const blade = chamferedBox(0.08, 0.2, 0.24, materials.ironEdge, 0.018);
  blade.name = 'cooper.tools.plane-blade';
  blade.position.set(-0.02, 0.21, 1.05);
  blade.rotation.y = -0.22;
  blade.rotation.z = -0.16;
  parent.add(blade);
}

function addAuger(parent, materials) {
  const points = [];
  const turns = 7;
  for (let index = 0; index <= 90; index += 1) {
    const t = index / 90;
    const angle = t * Math.PI * 2 * turns;
    points.push(new THREE.Vector3(
      0.72 + t * 0.65,
      0.12 + Math.cos(angle) * 0.045,
      1.05 + Math.sin(angle) * 0.045,
    ));
  }
  const spiral = tubeFromPoints(points, 0.016, materials.ironEdge, {
    tubularSegments: 90,
    radialSegments: 5,
  });
  spiral.name = 'cooper.tools.auger-spiral';
  parent.add(spiral);
  const grip = chamferedBox(0.12, 0.12, 0.72, materials.handleWood, 0.035);
  grip.name = 'cooper.tools.auger-grip';
  grip.position.set(0.65, 0.12, 1.05);
  parent.add(grip);
}

function addLooseHoops(parent, materials) {
  for (let index = 0; index < 3; index += 1) {
    const hoop = torus(0.37 + index * 0.05, 0.026, materials.iron, 7, 52);
    hoop.name = 'cooper.stock.loose-hoop';
    hoop.rotation.x = -Math.PI * 0.5 + index * 0.03;
    hoop.rotation.z = 0.08 - index * 0.05;
    hoop.position.set(1.05 + index * 0.05, 0.04 + index * 0.018, 1.18 - index * 0.06);
    parent.add(hoop);
  }
}

function addShavings(parent, materials) {
  for (let index = 0; index < 34; index += 1) {
    const radius = 0.06 + (index % 5) * 0.012;
    const curl = torus(
      radius,
      0.007,
      materials.shaving[index % materials.shaving.length],
      5,
      16,
      Math.PI * (0.7 + (index % 4) * 0.2),
    );
    curl.name = 'cooper.debris.curled-shaving';
    curl.rotation.x = -Math.PI * 0.5 + ((index % 3) - 1) * 0.12;
    curl.rotation.z = index * 0.71;
    curl.position.set(
      -1.35 + (index % 11) * 0.25,
      0.025 + (index % 3) * 0.006,
      0.58 + Math.floor(index / 11) * 0.22,
    );
    parent.add(curl);
  }
}

export function createCoopersWorkbenchModel() {
  const root = makePropRoot('prop.coopers-workbench', VERSION);
  const agedOak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `cooper-aged-oak-${index}` }),
    { offset: [index * 0.16, index * 0.11], repeatScale: [0.74, 0.92] },
  ));
  const materials = {
    agedOak,
    agedOakCross: agedOak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.08 + index * 0.035, 0.14],
    })),
    freshOak: [0xc79a61, 0xd0ab73, 0xb88850, 0xddbd86].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `cooper-fresh-oak-${index}`, roughness: 0.72 }),
      { offset: [index * 0.18, index * 0.13], repeatScale: [0.68, 0.88] },
    )),
    innerOak: surfaceMaterial('wood', 0x6a4e32, {
      name: 'cooper-dark-barrel-interior',
      side: THREE.DoubleSide,
      roughness: 0.9,
    }),
    handleWood: surfaceMaterial('wood', 0x744b2b, { name: 'cooper-polished-tool-handles', roughness: 0.55 }),
    iron: surfaceMaterial('forged-iron', 0x282827, { name: 'cooper-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x66625c, { name: 'cooper-worn-tool-steel' }),
    brass: surfaceMaterial('brass', 0x8d6531, { name: 'cooper-aged-brass-tap' }),
    rope: surfaceMaterial('rope', 0x82623a, { name: 'cooper-rope-clamp' }),
    charcoal: surfaceMaterial('stone', 0x171615, { name: 'cooper-charcoal' }),
    ember: new THREE.MeshStandardMaterial({
      name: 'cooper-live-ember',
      color: 0x7b2d14,
      emissive: 0xff681c,
      emissiveIntensity: 1.25,
      roughness: 0.72,
      metalness: 0,
    }),
    shaving: [
      surfaceMaterial('split-wood', 0xc6a06b, { name: 'cooper-shaving-light' }),
      surfaceMaterial('split-wood', 0xaa7d49, { name: 'cooper-shaving-mid' }),
      surfaceMaterial('split-wood', 0xd2b27f, { name: 'cooper-shaving-pale' }),
    ],
  };

  const bench = registerNode(root, 'cooper.bench', new THREE.Group(), {
    collider: { type: 'box', size: [2.85, 1.15, 1.4], offset: [-0.35, 0.58, -0.05] },
    destructionGroup: 'bench',
  });
  root.add(bench);
  addBench(bench, materials);
  addCradle(bench, materials);

  const barrel = registerNode(root, 'cooper.barrel', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.74, height: 1.9, offset: [-0.35, 1.62, -0.05], axis: 'x' },
    destructionGroup: 'unfinished-barrel',
  });
  root.add(barrel);
  addOpenBarrel(barrel, materials);

  const stock = registerNode(root, 'cooper.stock', new THREE.Group(), {
    collider: { type: 'box', size: [1.85, 1.75, 1.35], offset: [1.36, 0.88, 0.12] },
    destructionGroup: 'stock',
  });
  root.add(stock);
  addStaveRack(stock, materials);
  addFinishedCask(stock, materials);
  addLooseHoops(stock, materials);

  const fire = registerNode(root, 'cooper.fire', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.4, height: 0.68, offset: [-1.72, 0.34, 0.7] },
    destructionGroup: 'brazier',
  });
  root.add(fire);
  addBrazier(fire, materials);

  const tools = registerNode(root, 'cooper.tools', new THREE.Group(), {
    collider: { type: 'box', size: [3.5, 0.35, 0.9], offset: [-0.05, 0.18, 0.98] },
    destructionGroup: 'tools',
  });
  root.add(tools);
  addDrawknife(tools, materials);
  addMallet(tools, materials, { x: 0.55, z: 0.87, yaw: 0.24 });
  addMallet(tools, materials, { x: -0.18, z: 0.82, yaw: -0.55, headMaterial: materials.ironEdge, scale: 0.78 });
  addPlane(tools, materials);
  addAuger(tools, materials);
  addShavings(tools, materials);

  addSocket(root, barrel, 'socket.cooper-barrel-open-end', new THREE.Vector3(0.56, 1.62, -0.05));
  addSocket(root, barrel, 'socket.cooper-rope-windlass', new THREE.Vector3(-0.3, 1.56, 0.68));
  addSocket(root, stock, 'socket.cooper-finished-cask-tap', new THREE.Vector3(1.62, 0.53, 1.09));
  addSocket(root, fire, 'socket.cooper-brazier', new THREE.Vector3(-1.72, 0.66, 0.7));

  root.userData.materialFamilies = [
    'aged-oak',
    'fresh-cut-oak',
    'end-grain',
    'blackened-iron',
    'worn-tool-steel',
    'hemp-rope',
    'brass',
    'charcoal-and-embers',
    'wood-shavings',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/coopers_workbench/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createCoopersWorkbenchModel;
