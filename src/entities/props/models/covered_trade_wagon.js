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

const VERSION = 'img2threejs-covered-trade-wagon-v1-pbr';

function createArchedCanvasGeometry({
  length = 2.7,
  width = 1.72,
  springY = 1.68,
  archHeight = 0.94,
  lengthSegments = 12,
  archSegments = 18,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let xIndex = 0; xIndex <= lengthSegments; xIndex += 1) {
    const tx = xIndex / lengthSegments;
    const x = -length * 0.5 + tx * length;
    for (let archIndex = 0; archIndex <= archSegments; archIndex += 1) {
      const t = archIndex / archSegments;
      const angle = t * Math.PI;
      const z = -width * 0.5 + t * width;
      const y = springY
        + Math.sin(angle) * archHeight
        + Math.sin(tx * Math.PI * 5 + t * 2.1) * 0.009
        + Math.sin(t * Math.PI * 7) * 0.006;
      positions.push(x, y, z);
      uvs.push(tx * 2.2, t * 1.35);
      if (xIndex < lengthSegments && archIndex < archSegments) {
        const row = archSegments + 1;
        const a = xIndex * row + archIndex;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
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

function createRolledCanvasGeometry(length = 1.46, radius = 0.105) {
  const geometry = new THREE.CylinderGeometry(radius, radius * 0.94, length, 18, 8);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    position.setXYZ(
      index,
      x * (1 + Math.sin(y * 11) * 0.028),
      y,
      z * (1 + Math.cos(y * 9) * 0.035),
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createSoftSackGeometry(width = 0.46, height = 0.56, depth = 0.35) {
  const rings = 10;
  const segments = 18;
  const profile = [0.56, 0.82, 0.98, 1.04, 1.06, 1.03, 0.96, 0.82, 0.58, 0.38, 0.24];
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 3 + t * 2.4) * 0.035;
      positions.push(
        Math.cos(angle) * width * 0.5 * profile[ring] * wobble + Math.sin(t * Math.PI) * 0.018,
        (t - 0.5) * height,
        Math.sin(angle) * depth * 0.5 * profile[ring] * wobble,
      );
      uvs.push(segment / segments, t);
      if (ring < rings) {
        const current = ring * segments + segment;
        const next = ring * segments + (segment + 1) % segments;
        const upper = (ring + 1) * segments + segment;
        const upperNext = (ring + 1) * segments + (segment + 1) % segments;
        indices.push(current, next, upper, next, upperNext, upper);
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

function addStoneChocks(parent, materials) {
  for (const [index, x, z, yaw] of [
    [0, -1.15, 0.82, 0.12],
    [1, 0.93, -0.72, -0.08],
  ]) {
    const chock = chamferedBox(0.42, 0.2, 0.32, materials.stone[index], 0.075);
    chock.name = 'covered-wagon.foundation.wheel-chock';
    chock.position.set(x, 0.1, z);
    chock.rotation.y = yaw;
    parent.add(chock);
  }
}

function addWheel(parent, materials, {
  id,
  x,
  z,
  radius,
  steering = false,
}) {
  const wheel = new THREE.Group();
  wheel.name = `covered-wagon.wheel.${id}`;
  wheel.position.set(x, radius + 0.055, z);
  if (steering) wheel.rotation.y = z > 0 ? -0.055 : 0.055;
  parent.add(wheel);

  const tire = torus(radius, 0.055, materials.iron, 8, 56);
  tire.name = `covered-wagon.wheel.${id}.iron-tire`;
  wheel.add(tire);

  const felloe = torus(radius - 0.085, 0.075, materials.wheelWood[1], 9, 48);
  felloe.name = `covered-wagon.wheel.${id}.wood-felloe`;
  wheel.add(felloe);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.19, 0.34, 14, 2),
    materials.wheelWood[2],
  );
  hub.name = `covered-wagon.wheel.${id}.hub`;
  hub.rotation.x = Math.PI * 0.5;
  wheel.add(hub);

  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const end = new THREE.Vector3(
      Math.cos(angle) * (radius - 0.145),
      Math.sin(angle) * (radius - 0.145),
      0,
    );
    const spoke = rectangularMemberBetween(
      new THREE.Vector3(Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, 0),
      end,
      0.052,
      0.046,
      materials.wheelWood[index % 3],
      0.012,
    );
    spoke.name = `covered-wagon.wheel.${id}.spoke`;
    wheel.add(spoke);
  }

  for (const side of [-1, 1]) {
    const collar = torus(0.18, 0.022, materials.ironEdge, 7, 28);
    collar.name = `covered-wagon.wheel.${id}.hub-collar`;
    collar.position.z = side * 0.175;
    wheel.add(collar);
    const pin = bolt(0.035, 0.075, materials.ironEdge);
    pin.name = `covered-wagon.wheel.${id}.linchpin`;
    pin.rotation.x = Math.PI * 0.5;
    pin.position.set(0, 0, side * 0.215);
    wheel.add(pin);
  }
}

function addUndercarriage(parent, materials) {
  for (const x of [-1.05, 0.78]) {
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.085, 2.34, 12),
      materials.iron,
    );
    axle.name = 'covered-wagon.undercarriage.axle';
    axle.rotation.x = Math.PI * 0.5;
    axle.position.set(x, 0.64, 0);
    parent.add(axle);
  }

  for (const z of [-0.55, 0.55]) {
    const beam = chamferedBox(2.55, 0.18, 0.17, materials.oak[1], 0.04);
    beam.name = 'covered-wagon.undercarriage.long-beam';
    beam.position.set(-0.12, 0.79, z);
    parent.add(beam);
  }
  for (const x of [-1.2, -0.15, 0.92]) {
    const cross = chamferedBox(0.18, 0.16, 1.35, materials.oakCross[2], 0.04);
    cross.name = 'covered-wagon.undercarriage.cross-member';
    cross.position.set(x, 0.83, 0);
    parent.add(cross);
  }

  const turntable = torus(0.43, 0.055, materials.ironEdge, 8, 36);
  turntable.name = 'covered-wagon.undercarriage.steering-turntable';
  turntable.rotation.x = Math.PI * 0.5;
  turntable.position.set(0.8, 0.91, 0);
  parent.add(turntable);

  const kingpin = bolt(0.07, 0.24, materials.brass);
  kingpin.name = 'covered-wagon.undercarriage.kingpin';
  kingpin.position.set(0.8, 0.92, 0);
  parent.add(kingpin);

  addWheel(parent, materials, {
    id: 'rear-left',
    x: -1.08,
    z: 0.83,
    radius: 0.79,
  });
  addWheel(parent, materials, {
    id: 'rear-right',
    x: -1.08,
    z: -0.83,
    radius: 0.79,
  });
  addWheel(parent, materials, {
    id: 'front-left',
    x: 0.84,
    z: 0.78,
    radius: 0.64,
    steering: true,
  });
  addWheel(parent, materials, {
    id: 'front-right',
    x: 0.84,
    z: -0.78,
    radius: 0.64,
    steering: true,
  });

  for (const [z, side] of [[0.64, 1], [-0.64, -1]]) {
    const spring = tubeFromPoints([
      new THREE.Vector3(-1.55, 0.74, z),
      new THREE.Vector3(-1.3, 0.68, z + side * 0.015),
      new THREE.Vector3(-1.05, 0.66, z),
      new THREE.Vector3(-0.78, 0.7, z - side * 0.012),
      new THREE.Vector3(-0.58, 0.78, z),
    ], 0.035, materials.iron, {
      tubularSegments: 28,
      radialSegments: 7,
    });
    spring.name = 'covered-wagon.undercarriage.leaf-spring';
    parent.add(spring);
  }
}

function addBody(parent, materials) {
  for (let index = 0; index < 9; index += 1) {
    const x = -1.22 + index * 0.31;
    const plank = chamferedBox(0.27, 0.095, 1.56, materials.oakCross[index % 4], 0.025);
    plank.name = 'covered-wagon.body.floor-plank';
    plank.position.set(x, 1.02, 0);
    plank.rotation.y = ((index % 3) - 1) * 0.005;
    parent.add(plank);
  }

  for (const side of [-1, 1]) {
    for (let row = 0; row < 3; row += 1) {
      const plank = chamferedBox(2.85, 0.25, 0.11, materials.oak[(row + (side > 0 ? 1 : 0)) % 4], 0.035);
      plank.name = 'covered-wagon.body.side-plank';
      plank.position.set(-0.08, 1.15 + row * 0.235, side * 0.79);
      plank.rotation.z = ((row + (side > 0 ? 1 : 0)) % 3 - 1) * 0.004;
      parent.add(plank);
    }
    const cap = chamferedBox(3.02, 0.13, 0.15, materials.oak[side > 0 ? 0 : 3], 0.035);
    cap.name = 'covered-wagon.body.side-cap';
    cap.position.set(-0.08, 1.84, side * 0.8);
    parent.add(cap);
    for (const x of [-1.42, -0.48, 0.48, 1.33]) {
      const post = chamferedBox(0.14, 0.82, 0.15, materials.oak[(Math.round(x * 10) + 16) % 4], 0.03);
      post.name = 'covered-wagon.body.side-post';
      post.position.set(x, 1.43, side * 0.8);
      parent.add(post);
      for (const y of [1.2, 1.66]) {
        const rivet = bolt(0.018, 0.045, materials.ironEdge);
        rivet.name = 'covered-wagon.body.post-rivet';
        rivet.rotation.x = Math.PI * 0.5;
        rivet.position.set(x, y, side * 0.885);
        parent.add(rivet);
      }
    }
  }

  for (const [x, name] of [[1.39, 'front'], [-1.55, 'rear']]) {
    const rowCount = x > 0 ? 1 : 3;
    for (let row = 0; row < rowCount; row += 1) {
      const panel = chamferedBox(0.12, 0.25, 1.48, materials.oakCross[(row + (x > 0 ? 1 : 2)) % 4], 0.03);
      panel.name = `covered-wagon.body.${name}-panel`;
      panel.position.set(x, 1.15 + row * 0.235, 0);
      parent.add(panel);
    }
    if (x > 0) {
      const tailgateCap = chamferedBox(0.16, 0.1, 1.56, materials.oakCross[0], 0.025);
      tailgateCap.name = 'covered-wagon.body.front-tailgate-cap';
      tailgateCap.position.set(x + 0.02, 1.3, 0);
      parent.add(tailgateCap);
    }
  }

  for (const x of [-1.55, 1.39]) {
    for (const z of [-0.71, 0.71]) {
      const bracket = chamferedBox(0.16, 0.74, 0.07, materials.iron, 0.025);
      bracket.name = 'covered-wagon.body.corner-bracket';
      bracket.position.set(x + (x > 0 ? 0.07 : -0.07), 1.45, z);
      parent.add(bracket);
      for (const y of [1.18, 1.68]) {
        const rivet = bolt(0.022, 0.05, materials.ironEdge);
        rivet.name = 'covered-wagon.body.corner-bracket-rivet';
        rivet.rotation.z = Math.PI * 0.5;
        rivet.position.set(x + (x > 0 ? 0.12 : -0.12), y, z);
        parent.add(rivet);
      }
    }
  }

  const step = chamferedBox(0.62, 0.12, 0.3, materials.oakCross[1], 0.04);
  step.name = 'covered-wagon.body.rear-step';
  step.position.set(-1.86, 0.74, 0);
  parent.add(step);
  for (const z of [-0.2, 0.2]) {
    const support = rectangularMemberBetween(
      new THREE.Vector3(-1.58, 0.97, z),
      new THREE.Vector3(-1.84, 0.78, z),
      0.04,
      0.045,
      materials.iron,
      0.012,
    );
    support.name = 'covered-wagon.body.rear-step-support';
    parent.add(support);
  }
}

function addCanopy(parent, materials) {
  const canvas = new THREE.Mesh(
    createArchedCanvasGeometry(),
    materials.canvas,
  );
  canvas.name = 'covered-wagon.canopy.waxed-canvas-shell';
  canvas.position.x = -0.08;
  parent.add(canvas);

  for (const x of [-1.43, -0.84, -0.18, 0.48, 1.22]) {
    const points = [];
    for (let index = 0; index <= 16; index += 1) {
      const t = index / 16;
      points.push(new THREE.Vector3(
        x,
        1.68 + Math.sin(t * Math.PI) * 0.94,
        -0.86 + t * 1.72,
      ));
    }
    const hoop = tubeFromPoints(points, 0.031, materials.hoopWood, {
      tubularSegments: 42,
      radialSegments: 7,
    });
    hoop.name = 'covered-wagon.canopy.bent-hoop';
    parent.add(hoop);

    const seam = tubeFromPoints(points.map((point) => point.clone().add(new THREE.Vector3(0.006, 0.012, 0))), 0.011, materials.canvasSeam, {
      tubularSegments: 42,
      radialSegments: 5,
    });
    seam.name = 'covered-wagon.canopy.raised-seam';
    parent.add(seam);
  }

  for (const z of [-0.86, 0.86]) {
    const hem = tubeFromPoints([
      new THREE.Vector3(-1.45, 1.69, z),
      new THREE.Vector3(-0.65, 1.675, z),
      new THREE.Vector3(0.25, 1.685, z),
      new THREE.Vector3(1.27, 1.67, z),
    ], 0.018, materials.canvasSeam, {
      tubularSegments: 28,
      radialSegments: 6,
    });
    hem.name = 'covered-wagon.canopy.side-hem';
    parent.add(hem);
    for (const x of [-1.26, -0.58, 0.1, 0.78, 1.2]) {
      const tie = tubeFromPoints([
        new THREE.Vector3(x, 1.7, z),
        new THREE.Vector3(x + 0.018, 1.59, z + Math.sign(z) * 0.02),
        new THREE.Vector3(x - 0.012, 1.51, z + Math.sign(z) * 0.025),
      ], 0.01, materials.rope, {
        tubularSegments: 10,
        radialSegments: 5,
      });
      tie.name = 'covered-wagon.canopy.side-lashing';
      parent.add(tie);
    }
  }

  const rearRoll = new THREE.Mesh(createRolledCanvasGeometry(), materials.canvasFold);
  rearRoll.name = 'covered-wagon.canopy.rolled-front-flap';
  rearRoll.rotation.z = Math.PI * 0.5;
  rearRoll.position.set(1.34, 2.17, 0);
  parent.add(rearRoll);
  for (const z of [-0.48, 0.48]) {
    const strap = torus(0.112, 0.018, materials.leather, 6, 24);
    strap.name = 'covered-wagon.canopy.front-roll-strap';
    strap.rotation.y = Math.PI * 0.5;
    strap.position.set(1.34, 2.17, z);
    parent.add(strap);
  }

  for (const [x, z, sx, sy] of [
    [-0.9, 0.87, 0.42, 0.25],
    [0.65, -0.87, 0.34, 0.2],
  ]) {
    const patch = chamferedBox(sx, sy, 0.015, materials.canvasPatch, 0.035);
    patch.name = 'covered-wagon.canopy.repair-patch';
    patch.position.set(x, 1.95, z);
    patch.rotation.z = x * 0.04;
    parent.add(patch);
    for (let index = 0; index < 9; index += 1) {
      const angle = (index / 9) * Math.PI * 2;
      const stitch = chamferedBox(0.03, 0.008, 0.012, materials.thread, 0.003);
      stitch.name = 'covered-wagon.canopy.patch-stitch';
      stitch.position.set(
        x + Math.cos(angle) * sx * 0.43,
        1.95 + Math.sin(angle) * sy * 0.4,
        z + Math.sign(z) * 0.012,
      );
      stitch.rotation.z = angle;
      parent.add(stitch);
    }
  }
}

function addCrate(parent, materials, {
  position,
  yaw = 0,
  scale = 1,
}) {
  const crate = new THREE.Group();
  crate.name = 'covered-wagon.cargo.slatted-crate';
  crate.position.copy(position);
  crate.rotation.y = yaw;
  crate.scale.setScalar(scale);
  parent.add(crate);
  for (const y of [0.05, 0.45]) {
    for (let index = 0; index < 4; index += 1) {
      const plank = chamferedBox(0.54, 0.09, 0.08, materials.crateWood[(index + (y > 0.1 ? 1 : 0)) % 3], 0.018);
      plank.name = 'covered-wagon.cargo.crate-side-slat';
      plank.position.set(0, y + index * 0.095, 0.26);
      crate.add(plank);
      const back = plank.clone();
      back.position.z = -0.26;
      crate.add(back);
    }
  }
  for (const x of [-0.24, 0.24]) {
    for (const z of [-0.24, 0.24]) {
      const corner = chamferedBox(0.08, 0.48, 0.08, materials.crateWood[2], 0.018);
      corner.name = 'covered-wagon.cargo.crate-corner';
      corner.position.set(x, 0.26, z);
      crate.add(corner);
    }
  }
  const diagonal = rectangularMemberBetween(
    new THREE.Vector3(-0.23, 0.08, 0.31),
    new THREE.Vector3(0.23, 0.47, 0.31),
    0.055,
    0.05,
    materials.crateWood[0],
    0.012,
  );
  diagonal.name = 'covered-wagon.cargo.crate-diagonal';
  crate.add(diagonal);
  for (const x of [-0.21, 0.21]) {
    for (const y of [0.1, 0.43]) {
      const nail = bolt(0.014, 0.03, materials.ironEdge);
      nail.name = 'covered-wagon.cargo.crate-nail';
      nail.rotation.x = Math.PI * 0.5;
      nail.position.set(x, y, 0.34);
      crate.add(nail);
    }
  }
}

function addLantern(parent, materials) {
  const lantern = new THREE.Group();
  lantern.name = 'covered-wagon.cargo.hanging-lantern';
  lantern.position.set(1.48, 1.48, 0.53);
  parent.add(lantern);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.17, 0.34, 8),
    materials.glass,
  );
  body.name = 'covered-wagon.cargo.lantern-glass';
  lantern.add(body);
  for (const y of [-0.19, 0.19]) {
    const rim = torus(y > 0 ? 0.13 : 0.17, 0.022, materials.iron, 6, 24);
    rim.name = 'covered-wagon.cargo.lantern-rim';
    rim.rotation.x = Math.PI * 0.5;
    rim.position.y = y;
    lantern.add(rim);
  }
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI * 0.5;
    const guard = rectangularMemberBetween(
      new THREE.Vector3(Math.cos(angle) * 0.145, -0.18, Math.sin(angle) * 0.145),
      new THREE.Vector3(Math.cos(angle) * 0.115, 0.2, Math.sin(angle) * 0.115),
      0.018,
      0.018,
      materials.iron,
      0.004,
    );
    guard.name = 'covered-wagon.cargo.lantern-guard';
    lantern.add(guard);
  }
  const handle = torus(0.18, 0.018, materials.ironEdge, 6, 28, Math.PI);
  handle.name = 'covered-wagon.cargo.lantern-handle';
  handle.position.y = 0.2;
  lantern.add(handle);
  const chain = tubeFromPoints([
    new THREE.Vector3(0, 0.36, 0),
    new THREE.Vector3(0.02, 0.48, 0),
    new THREE.Vector3(-0.02, 0.6, 0),
  ], 0.012, materials.ironEdge, {
    tubularSegments: 10,
    radialSegments: 5,
  });
  chain.name = 'covered-wagon.cargo.lantern-chain';
  lantern.add(chain);
}

function addCargo(parent, materials) {
  addCrate(parent, materials, {
    position: new THREE.Vector3(1.04, 1.3, 0.35),
    yaw: 0.05,
    scale: 0.88,
  });
  addCrate(parent, materials, {
    position: new THREE.Vector3(0.5, 1.3, 0.3),
    yaw: -0.06,
    scale: 0.76,
  });

  const sack = new THREE.Mesh(createSoftSackGeometry(), materials.burlap);
  sack.name = 'covered-wagon.cargo.tied-sack';
  sack.position.set(1.06, 1.35, -0.34);
  sack.rotation.z = -0.08;
  parent.add(sack);
  const neck = tubeFromPoints([
    new THREE.Vector3(1.0, 1.61, -0.34),
    new THREE.Vector3(1.08, 1.68, -0.34),
    new THREE.Vector3(1.12, 1.72, -0.33),
  ], 0.052, materials.burlap, {
    tubularSegments: 12,
    radialSegments: 8,
  });
  neck.name = 'covered-wagon.cargo.sack-neck';
  parent.add(neck);
  const tie = torus(0.07, 0.013, materials.rope, 6, 24);
  tie.name = 'covered-wagon.cargo.sack-tie';
  tie.rotation.x = Math.PI * 0.5;
  tie.position.set(1.07, 1.65, -0.34);
  parent.add(tie);

  const ropeCoil = torus(0.22, 0.032, materials.rope, 8, 40);
  ropeCoil.name = 'covered-wagon.cargo.rope-coil';
  ropeCoil.rotation.y = Math.PI * 0.5;
  ropeCoil.position.set(1.46, 1.24, -0.55);
  parent.add(ropeCoil);
  addLantern(parent, materials);
}

function addShaftsAndBrake(parent, materials) {
  for (const z of [-0.42, 0.42]) {
    const shaft = tubeFromPoints([
      new THREE.Vector3(0.72, 0.79, z),
      new THREE.Vector3(1.45, 0.74, z * 0.95),
      new THREE.Vector3(2.45, 0.57, z * 0.8),
      new THREE.Vector3(3.2, 0.44, z * 0.64),
    ], 0.065, materials.shaftWood, {
      tubularSegments: 38,
      radialSegments: 9,
    });
    shaft.name = 'covered-wagon.shafts.paired-shaft';
    parent.add(shaft);
    const tipBand = torus(0.07, 0.018, materials.ironEdge, 6, 24);
    tipBand.name = 'covered-wagon.shafts.tip-band';
    tipBand.rotation.y = Math.PI * 0.5;
    tipBand.position.set(3.17, 0.45, z * 0.64);
    parent.add(tipBand);
  }
  const crossbar = chamferedBox(0.15, 0.12, 0.95, materials.shaftWood, 0.03);
  crossbar.name = 'covered-wagon.shafts.front-crossbar';
  crossbar.position.set(2.32, 0.59, 0);
  parent.add(crossbar);

  const support = rectangularMemberBetween(
    new THREE.Vector3(2.3, 0.55, 0),
    new THREE.Vector3(2.45, 0.09, 0),
    0.055,
    0.06,
    materials.iron,
    0.015,
  );
  support.name = 'covered-wagon.shafts.ground-support';
  parent.add(support);
  const foot = chamferedBox(0.22, 0.07, 0.18, materials.ironEdge, 0.025);
  foot.name = 'covered-wagon.shafts.support-foot';
  foot.position.set(2.46, 0.035, 0);
  parent.add(foot);

  const brakeLever = rectangularMemberBetween(
    new THREE.Vector3(-1.28, 0.82, 0.72),
    new THREE.Vector3(-1.55, 1.66, 0.76),
    0.055,
    0.06,
    materials.iron,
    0.015,
  );
  brakeLever.name = 'covered-wagon.shafts.brake-lever';
  parent.add(brakeLever);
  const grip = chamferedBox(0.2, 0.09, 0.09, materials.leather, 0.03);
  grip.name = 'covered-wagon.shafts.brake-grip';
  grip.position.set(-1.58, 1.7, 0.76);
  grip.rotation.z = 0.31;
  parent.add(grip);
  const linkage = tubeFromPoints([
    new THREE.Vector3(-1.29, 0.86, 0.7),
    new THREE.Vector3(-1.15, 0.61, 0.73),
    new THREE.Vector3(-1.04, 0.56, 0.77),
  ], 0.026, materials.ironEdge, {
    tubularSegments: 14,
    radialSegments: 6,
  });
  linkage.name = 'covered-wagon.shafts.brake-linkage';
  parent.add(linkage);
}

export function createCoveredTradeWagonModel() {
  const root = makePropRoot('prop.covered-trade-wagon', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `covered-wagon-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.72, 0.9] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.06 + index * 0.03, 0.12],
    })),
    wheelWood: [0x4d2919, 0x5c321d, 0x392116].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `covered-wagon-wheel-oak-${index}` }),
      { offset: [index * 0.14, index * 0.08], repeatScale: [0.72, 0.82] },
    )),
    crateWood: [0x6f4829, 0x5e3b24, 0x805538].map((color, index) => transformMaterialMaps(
      surfaceMaterial('wood', color, { name: `covered-wagon-crate-wood-${index}` }),
      { offset: [index * 0.18, index * 0.09], repeatScale: [0.82, 0.92] },
    )),
    shaftWood: surfaceMaterial('wood', 0x56331f, { name: 'covered-wagon-shaft-wood' }),
    hoopWood: surfaceMaterial('wood', 0x6f4d2e, { name: 'covered-wagon-bent-canopy-hoops' }),
    iron: surfaceMaterial('forged-iron', 0x262624, { name: 'covered-wagon-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x595650, { name: 'covered-wagon-worn-iron-edge' }),
    brass: surfaceMaterial('brass', 0x8a6735, { name: 'covered-wagon-aged-brass' }),
    rope: surfaceMaterial('rope', 0x8f7040, { name: 'covered-wagon-hemp-rope' }),
    thread: surfaceMaterial('rope', 0x716044, { name: 'covered-wagon-heavy-thread' }),
    leather: surfaceMaterial('leather', 0x49291d, { name: 'covered-wagon-dark-leather' }),
    burlap: surfaceMaterial('burlap', 0x9d815b, { name: 'covered-wagon-cargo-burlap' }),
    canvas: surfaceMaterial('burlap', 0xc8b995, {
      name: 'covered-wagon-waxed-canvas',
      side: THREE.DoubleSide,
      roughness: 0.92,
    }),
    canvasFold: surfaceMaterial('burlap', 0xb5a27f, {
      name: 'covered-wagon-folded-canvas',
      roughness: 0.94,
    }),
    canvasSeam: surfaceMaterial('rope', 0x9f8e6f, { name: 'covered-wagon-canvas-seam' }),
    canvasPatch: surfaceMaterial('burlap', 0xa69270, { name: 'covered-wagon-canvas-patch' }),
    stone: [0x8d7b61, 0xa28e6d].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `covered-wagon-limestone-chock-${index}` }),
      { offset: [index * 0.2, index * 0.12], repeatScale: [0.8, 0.8] },
    )),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'covered-wagon-lantern-glass',
      color: 0xe4b35d,
      emissive: 0x6a3511,
      emissiveIntensity: 0.5,
      roughness: 0.18,
      metalness: 0,
      transmission: 0.12,
      transparent: true,
      opacity: 0.8,
      clearcoat: 0.8,
    }),
  };

  const foundation = registerNode(root, 'covered-wagon.foundation', new THREE.Group(), {
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addStoneChocks(foundation, materials);

  const undercarriage = registerNode(root, 'covered-wagon.undercarriage', new THREE.Group(), {
    collider: { type: 'box', size: [3.0, 1.75, 1.85], offset: [-0.1, 0.88, 0] },
    destructionGroup: 'undercarriage',
  });
  root.add(undercarriage);
  addUndercarriage(undercarriage, materials);

  const body = registerNode(root, 'covered-wagon.body', new THREE.Group(), {
    collider: { type: 'box', size: [3.2, 0.95, 1.82], offset: [-0.08, 1.43, 0] },
    destructionGroup: 'cargo-body',
  });
  root.add(body);
  addBody(body, materials);

  const canopy = registerNode(root, 'covered-wagon.canopy', new THREE.Group(), {
    collider: { type: 'box', size: [2.9, 1.0, 1.82], offset: [-0.08, 2.15, 0] },
    destructionGroup: 'canopy',
  });
  root.add(canopy);
  addCanopy(canopy, materials);

  const cargo = registerNode(root, 'covered-wagon.cargo', new THREE.Group(), {
    destructionGroup: 'cargo',
  });
  root.add(cargo);
  addCargo(cargo, materials);

  const shafts = registerNode(root, 'covered-wagon.shafts', new THREE.Group(), {
    collider: { type: 'box', size: [2.1, 0.72, 1.0], offset: [2.2, 0.45, 0] },
    destructionGroup: 'shafts',
  });
  root.add(shafts);
  addShaftsAndBrake(shafts, materials);

  addSocket(root, undercarriage, 'socket.covered-wagon.front-axle', new THREE.Vector3(0.84, 0.68, 0));
  addSocket(root, undercarriage, 'socket.covered-wagon.rear-axle', new THREE.Vector3(-1.08, 0.84, 0));
  addSocket(root, cargo, 'socket.covered-wagon.lantern', new THREE.Vector3(1.48, 2.09, 0.53));
  addSocket(root, shafts, 'socket.covered-wagon.hitch', new THREE.Vector3(3.2, 0.44, 0));

  root.userData.materialFamilies = [
    'aged-oak',
    'waxed-canvas',
    'woven-burlap',
    'blackened-iron',
    'worn-iron',
    'dark-leather',
    'hemp-rope',
    'aged-brass',
    'limestone',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/covered_trade_wagon/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createCoveredTradeWagonModel;
