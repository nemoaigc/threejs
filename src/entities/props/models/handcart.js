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
  standard,
  toon,
  torus,
} from './shared.js';

const VERSION = 'img2threejs-handcart-v1';

function buildCargoBed(root, materials) {
  const bed = registerNode(root, 'cart.cargo-bed', new THREE.Group(), {
    collider: { type: 'box', size: [1.48, 1.02, 1.7], offset: [0, 1.13, -0.03] },
    destructionGroup: 'cargo-bed',
  });
  root.add(bed);

  for (let index = 0; index < 6; index += 1) {
    const plank = chamferedBox(0.22, 0.09, 1.54, materials.oak[(index + 1) % 4], 0.028);
    plank.name = `bed.floor-plank.${index}`;
    plank.position.set(-0.58 + index * 0.232, 0.7, -0.02);
    bed.add(plank);
  }

  for (const side of [-1, 1]) {
    for (let row = 0; row < 3; row += 1) {
      const plank = chamferedBox(
        0.085,
        0.27,
        1.58,
        materials.oak[(row + (side > 0 ? 1 : 0)) % 4],
        0.028,
      );
      plank.name = `bed.side.${side < 0 ? 'left' : 'right'}.plank.${row}`;
      plank.position.set(side * (0.7 + row * 0.035), 0.84 + row * 0.25, -0.02);
      plank.rotation.z = side * -0.035;
      bed.add(plank);
    }
    const topRail = chamferedBox(0.115, 0.11, 1.67, materials.oak[2], 0.032);
    topRail.name = `bed.side.${side < 0 ? 'left' : 'right'}.top-rail`;
    topRail.position.set(side * 0.79, 1.56, -0.02);
    bed.add(topRail);
  }

  for (const [z, rows, label] of [
    [-0.8, 4, 'rear'],
    [0.78, 3, 'front'],
  ]) {
    for (let row = 0; row < rows; row += 1) {
      const plank = chamferedBox(
        1.43,
        0.235,
        0.085,
        materials.oak[(row + (z > 0 ? 2 : 0)) % 4],
        0.025,
      );
      plank.name = `bed.${label}.plank.${row}`;
      plank.position.set(0, 0.84 + row * 0.225, z);
      bed.add(plank);
    }
    const topRail = chamferedBox(1.52, 0.11, 0.115, materials.oak[2], 0.03);
    topRail.name = `bed.${label}.top-rail`;
    topRail.position.set(0, 0.84 + (rows - 1) * 0.225 + 0.17, z);
    bed.add(topRail);
  }

  const verticalStraps = [
    [-0.58, -0.842],
    [0, -0.842],
    [0.58, -0.842],
    [-0.58, 0.822],
    [0.58, 0.822],
  ];
  for (const [x, z] of verticalStraps) {
    const strapHeight = z < 0 ? 0.92 : 0.72;
    const strap = chamferedBox(0.085, strapHeight, 0.035, materials.iron, 0.016);
    strap.name = 'bed.iron-strap';
    strap.position.set(x, 1.08, z + (z < 0 ? -0.02 : 0.02));
    bed.add(strap);
    for (const y of [0.82, 1.1, 1.36]) {
      if (y > 0.72 + strapHeight) continue;
      const fastener = new THREE.Mesh(
        new THREE.SphereGeometry(0.027, 7, 5),
        materials.brass,
      );
      fastener.name = 'bed.strap-rivet';
      fastener.position.set(x, y, z + (z < 0 ? -0.045 : 0.045));
      bed.add(fastener);
    }
  }

  for (const side of [-1, 1]) {
    for (const z of [-0.77, 0.77]) {
      const bracket = chamferedBox(0.12, 0.3, 0.12, materials.ironEdge, 0.025);
      bracket.name = 'bed.corner-bracket';
      bracket.position.set(side * 0.75, 1.3, z);
      bed.add(bracket);
    }
    for (const z of [-0.48, 0.42]) {
      const sideStrap = chamferedBox(0.035, 0.78, 0.1, materials.iron, 0.014);
      sideStrap.name = `bed.side.${side < 0 ? 'left' : 'right'}.iron-strap`;
      sideStrap.position.set(side * 0.795, 1.16, z);
      sideStrap.rotation.y = Math.PI * 0.5;
      bed.add(sideStrap);
      for (const y of [0.9, 1.2, 1.48]) {
        const fastener = bolt(0.023, 0.04, materials.brass);
        fastener.name = 'bed.side.strap-rivet';
        fastener.rotation.z = Math.PI * 0.5;
        fastener.position.set(side * 0.825, y, z);
        bed.add(fastener);
      }
    }
  }
  addSocket(root, bed, 'socket.cargo', new THREE.Vector3(0, 0.76, -0.02));
}

function buildWheel(root, materials, side) {
  const sideName = side < 0 ? 'left' : 'right';
  const wheel = registerNode(root, `cart.wheel.${sideName}`, new THREE.Group(), {
    collider: {
      type: 'cylinder',
      radius: 0.67,
      height: 0.15,
      axis: 'x',
      offset: [side * 0.88, 0.67, -0.12],
    },
    destructionGroup: 'wheel-assembly',
  });
  root.add(wheel);
  wheel.position.set(side * 0.88, 0.67, -0.12);

  const tire = torus(0.61, 0.055, materials.iron, 8, 36);
  tire.name = `wheel.${sideName}.iron-tire`;
  tire.rotation.y = Math.PI * 0.5;
  wheel.add(tire);

  const rimOuter = torus(0.545, 0.075, materials.oak[1], 8, 36);
  rimOuter.name = `wheel.${sideName}.wood-rim`;
  rimOuter.rotation.y = Math.PI * 0.5;
  wheel.add(rimOuter);
  const rimInset = torus(0.545, 0.024, materials.ironEdge, 6, 36);
  rimInset.name = `wheel.${sideName}.iron-rim-band`;
  rimInset.rotation.y = Math.PI * 0.5;
  wheel.add(rimInset);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.24, 14),
    materials.oak[2],
  );
  hub.name = `wheel.${sideName}.hub`;
  hub.rotation.z = Math.PI * 0.5;
  wheel.add(hub);
  const axleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.28, 12),
    materials.ironEdge,
  );
  axleCap.name = `wheel.${sideName}.axle-cap`;
  axleCap.rotation.z = Math.PI * 0.5;
  axleCap.position.x = side * 0.02;
  wheel.add(axleCap);

  const spokeCount = 12;
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = index * Math.PI * 2 / spokeCount;
    const spoke = beamBetween(
      new THREE.Vector3(0, Math.cos(angle) * 0.11, Math.sin(angle) * 0.11),
      new THREE.Vector3(0, Math.cos(angle) * 0.49, Math.sin(angle) * 0.49),
      0.028,
      materials.oak[(index + 2) % 4],
      8,
    );
    spoke.name = `wheel.${sideName}.spoke.${index}`;
    wheel.add(spoke);

    const rimBolt = bolt(0.018, 0.04, materials.brass);
    rimBolt.name = `wheel.${sideName}.rim-bolt.${index}`;
    rimBolt.rotation.z = Math.PI * 0.5;
    rimBolt.position.set(
      side * 0.045,
      Math.cos(angle) * 0.545,
      Math.sin(angle) * 0.545,
    );
    wheel.add(rimBolt);
  }
  addSocket(root, wheel, `socket.wheel.${sideName}`, new THREE.Vector3(0, 0, 0));
}

function buildRunningGear(root, materials) {
  const gear = registerNode(root, 'cart.running-gear', new THREE.Group(), {
    destructionGroup: 'running-gear',
  });
  root.add(gear);

  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.88, 12),
    materials.iron,
  );
  axle.name = 'cart.axle';
  axle.rotation.z = Math.PI * 0.5;
  axle.position.set(0, 0.67, -0.12);
  gear.add(axle);

  for (const side of [-1, 1]) {
    const hanger = chamferedBox(0.12, 0.34, 0.2, materials.ironEdge, 0.025);
    hanger.name = `cart.axle-hanger.${side < 0 ? 'left' : 'right'}`;
    hanger.position.set(side * 0.65, 0.72, -0.12);
    gear.add(hanger);
  }

  const support = beamBetween(
    new THREE.Vector3(0.52, 0.72, -0.72),
    new THREE.Vector3(0.55, 0.08, -1.03),
    0.055,
    materials.oak[2],
    8,
  );
  support.name = 'cart.rear-support-leg';
  gear.add(support);
  const foot = chamferedBox(0.16, 0.06, 0.16, materials.iron, 0.02);
  foot.name = 'cart.support-foot';
  foot.position.set(0.55, 0.055, -1.03);
  foot.rotation.y = 0.35;
  gear.add(foot);
}

function buildHandles(root, materials) {
  const handles = registerNode(root, 'cart.handle-assembly', new THREE.Group(), {
    collider: { type: 'box', size: [1.08, 0.2, 1.72], offset: [0, 0.76, 1.53] },
    destructionGroup: 'handles',
  });
  root.add(handles);

  for (const side of [-1, 1]) {
    const rail = beamBetween(
      new THREE.Vector3(side * 0.52, 0.79, 0.64),
      new THREE.Vector3(side * 0.52, 0.69, 2.28),
      0.065,
      materials.oak[side < 0 ? 0 : 1],
      8,
    );
    rail.name = `handle.rail.${side < 0 ? 'left' : 'right'}`;
    handles.add(rail);

    for (const z of [0.78, 2.12]) {
      const band = torus(0.072, 0.018, materials.ironEdge, 7, 14);
      band.name = 'handle.iron-band';
      band.rotation.x = Math.PI * 0.5;
      band.position.set(side * 0.52, z > 1 ? 0.7 : 0.78, z);
      handles.add(band);
    }
  }

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 1.13, 12),
    materials.oak[3],
  );
  grip.name = 'handle.crossbar-grip';
  grip.rotation.z = Math.PI * 0.5;
  grip.position.set(0, 0.69, 2.28);
  handles.add(grip);

  for (const x of [-0.28, 0, 0.28]) {
    const ring = torus(0.078, 0.012, materials.oak[2], 6, 14);
    ring.name = 'handle.grip-ridge';
    ring.rotation.y = Math.PI * 0.5;
    ring.position.set(x, 0.69, 2.28);
    handles.add(ring);
  }
  addSocket(root, handles, 'socket.cart-grip', new THREE.Vector3(0, 0.69, 2.28));
}

export function createHandcartModel() {
  const root = makePropRoot('prop.handcart', VERSION);
  const materials = {
    oak: PROP_PALETTE.oak.map((color, index) => toon(color, { name: `cart-oak-${index}` })),
    iron: standard(PROP_PALETTE.iron, {
      name: 'cart-forged-iron',
      roughness: 0.4,
      metalness: 0.86,
    }),
    ironEdge: standard(PROP_PALETTE.ironEdge, {
      name: 'cart-worn-iron',
      roughness: 0.3,
      metalness: 0.9,
    }),
    brass: standard(PROP_PALETTE.brass, {
      name: 'cart-brass-pegs',
      roughness: 0.36,
      metalness: 0.72,
    }),
  };

  buildCargoBed(root, materials);
  buildRunningGear(root, materials);
  buildWheel(root, materials, -1);
  buildWheel(root, materials, 1);
  buildHandles(root, materials);

  root.userData.materialFamilies = ['aged-oak', 'forged-iron', 'aged-brass'];
  root.userData.referenceViews = {
    main: 'docs/references/props/handcart/ref_main.png',
    front: 'docs/references/props/handcart/ref_front.png',
    side: 'docs/references/props/handcart/ref_side.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createHandcartModel;
