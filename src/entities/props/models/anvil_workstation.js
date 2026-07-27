import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  extrudedSilhouette,
  finishHeroProp,
  makePropRoot,
  registerNode,
  surfaceMaterial,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-anvil-workstation-v1-pbr';

function createHornGeometry(length = 0.6, baseRadius = 0.17) {
  const radialSegments = 12;
  const ringSegments = 7;
  const positions = [];
  const indices = [];
  for (let ring = 0; ring <= ringSegments; ring += 1) {
    const t = ring / ringSegments;
    const radius = Math.max(0.004, baseRadius * Math.pow(1 - t, 0.72));
    const x = length * t;
    const centerY = -0.018 * t + Math.sin(t * Math.PI) * 0.008;
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      positions.push(
        x,
        centerY + Math.cos(angle) * radius,
        Math.sin(angle) * radius * (0.82 - t * 0.06),
      );
    }
  }
  for (let ring = 0; ring < ringSegments; ring += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const next = (segment + 1) % radialSegments;
      const a = ring * radialSegments + segment;
      const b = ring * radialSegments + next;
      const c = (ring + 1) * radialSegments + next;
      const d = (ring + 1) * radialSegments + segment;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addStoneShims(parent, materials) {
  const places = [
    [-0.3, 0.02, 0.22, -0.08],
    [0.3, 0.02, 0.2, 0.06],
    [-0.27, 0.02, -0.23, 0.04],
    [0.28, 0.02, -0.22, -0.05],
  ];
  places.forEach(([x, y, z, yaw], index) => {
    const shim = chamferedBox(0.27, 0.12, 0.24, materials.stone[index % 3], 0.045);
    shim.name = `anvil.foundation.shim.${index}`;
    shim.position.set(x, y + 0.06, z);
    shim.rotation.y = yaw;
    parent.add(shim);
  });
}

function addStump(parent, materials) {
  const stump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.51, 0.58, 18, 3),
    materials.bark,
  );
  stump.name = 'anvil.stump.bark-body';
  stump.position.y = 0.4;
  parent.add(stump);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.035, 18),
    materials.splitWood,
  );
  top.name = 'anvil.stump.split-top';
  top.position.y = 0.708;
  parent.add(top);

  for (const y of [0.32]) {
    const hoop = torus(0.493, 0.027, materials.iron, 8, 48);
    hoop.name = 'anvil.stump.iron-hoop';
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    parent.add(hoop);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const rivet = bolt(0.022, 0.05, materials.ironEdge);
      rivet.name = 'anvil.stump.hoop-rivet';
      rivet.rotation.z = Math.PI * 0.5;
      rivet.rotation.y = -angle;
      rivet.position.set(Math.cos(angle) * 0.51, y, Math.sin(angle) * 0.51);
      parent.add(rivet);
    }
  }

  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2 + 0.08;
    const barkPlate = chamferedBox(
      0.11 + (index % 3) * 0.012,
      0.47 + (index % 4) * 0.018,
      0.025 + (index % 2) * 0.007,
      materials.barkRelief[index % materials.barkRelief.length],
      0.012,
    );
    barkPlate.name = 'anvil.stump.bark-relief';
    barkPlate.position.set(
      Math.cos(angle) * 0.495,
      0.42 + ((index % 3) - 1) * 0.012,
      Math.sin(angle) * 0.495,
    );
    barkPlate.rotation.y = -angle + Math.PI * 0.5;
    parent.add(barkPlate);
  }

  for (let index = 0; index < 9; index += 1) {
    const crack = chamferedBox(
      0.012,
      0.18 + (index % 3) * 0.06,
      0.012,
      materials.char,
      0.004,
    );
    crack.name = 'anvil.stump.vertical-split';
    const angle = (index / 9) * Math.PI * 2 + 0.18;
    crack.position.set(Math.cos(angle) * 0.486, 0.56 - (index % 2) * 0.08, Math.sin(angle) * 0.486);
    crack.rotation.y = -angle;
    parent.add(crack);
  }

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + 0.15;
    const fissure = chamferedBox(
      0.17 + (index % 3) * 0.035,
      0.009,
      0.012,
      materials.char,
      0.004,
    );
    fissure.name = 'anvil.stump.top-radial-fissure';
    fissure.position.set(Math.cos(angle) * 0.25, 0.731, Math.sin(angle) * 0.25);
    fissure.rotation.y = -angle;
    parent.add(fissure);
  }
}

function addAnvilBody(parent, materials) {
  const pedestal = extrudedSilhouette([
    [-0.3, 0],
    [0.28, 0],
    [0.2, 0.12],
    [0.14, 0.3],
    [-0.16, 0.3],
    [-0.22, 0.12],
  ], 0.3, materials.steel, { bevel: 0.035, bevelSegments: 2 });
  pedestal.name = 'anvil.steel.pedestal';
  pedestal.position.set(-0.04, 0.72, 0);
  parent.add(pedestal);

  const top = chamferedBox(0.9, 0.14, 0.36, materials.steelEdge, 0.055);
  top.name = 'anvil.steel.top-face';
  top.position.set(-0.08, 1.08, 0);
  parent.add(top);

  const heel = chamferedBox(0.28, 0.2, 0.32, materials.steel, 0.035);
  heel.name = 'anvil.steel.heel';
  heel.position.set(-0.55, 1.02, 0);
  parent.add(heel);

  const horn = new THREE.Mesh(createHornGeometry(), materials.steel);
  horn.name = 'anvil.steel.horn';
  horn.position.set(0.34, 1.04, 0);
  parent.add(horn);

  const hornCollar = chamferedBox(0.13, 0.25, 0.34, materials.steelEdge, 0.025);
  hornCollar.name = 'anvil.steel.horn-collar';
  hornCollar.position.set(0.36, 1.04, 0);
  parent.add(hornCollar);

  const hornShoulder = extrudedSilhouette([
    [0, 0],
    [0.3, 0.015],
    [0.42, 0.09],
    [0.27, 0.13],
    [0.04, 0.12],
  ], 0.29, materials.steel, { bevel: 0.022, bevelSegments: 2 });
  hornShoulder.name = 'anvil.steel.horn-shoulder';
  hornShoulder.position.set(0.11, 0.9, 0);
  parent.add(hornShoulder);

  const topWear = chamferedBox(0.73, 0.018, 0.325, materials.steelHighlight, 0.014);
  topWear.name = 'anvil.steel.polished-work-face';
  topWear.position.set(-0.12, 1.158, 0);
  parent.add(topWear);

  for (const [x, z] of [[-0.25, -0.13], [-0.25, 0.13], [0.18, -0.13], [0.18, 0.13]]) {
    const foot = chamferedBox(0.18, 0.08, 0.13, materials.steel, 0.025);
    foot.name = 'anvil.steel.foot';
    foot.position.set(x, 0.74, z);
    parent.add(foot);
    const spike = bolt(0.035, 0.11, materials.ironEdge);
    spike.name = 'anvil.steel.mount-spike';
    spike.position.set(x, 0.8, z);
    parent.add(spike);
  }

  const hardy = chamferedBox(0.09, 0.012, 0.09, materials.void, 0.008);
  hardy.name = 'anvil.top.hardy-hole';
  hardy.position.set(-0.33, 1.157, -0.06);
  parent.add(hardy);
  const pritchel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.014, 12),
    materials.void,
  );
  pritchel.name = 'anvil.top.pritchel-hole';
  pritchel.position.set(-0.2, 1.159, 0.085);
  parent.add(pritchel);
}

function addHammer(parent, materials) {
  const ring = torus(0.09, 0.018, materials.iron, 8, 26);
  ring.name = 'anvil.tools.hammer-loop';
  ring.position.set(-0.47, 0.57, 0.22);
  parent.add(ring);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.042, 0.46, 10),
    materials.handle,
  );
  handle.name = 'anvil.tools.hammer-handle';
  handle.position.set(-0.57, 0.4, 0.25);
  handle.rotation.z = -0.1;
  parent.add(handle);

  for (let index = 0; index < 7; index += 1) {
    const wrap = torus(0.044, 0.009, materials.leather, 6, 18);
    wrap.name = 'anvil.tools.hammer-wrap';
    wrap.rotation.x = Math.PI * 0.5;
    wrap.position.set(-0.57 + index * 0.003, 0.46 + index * 0.035, 0.25);
    parent.add(wrap);
  }

  const head = chamferedBox(0.28, 0.14, 0.14, materials.steelEdge, 0.04);
  head.name = 'anvil.tools.hammer-head';
  head.position.set(-0.6, 0.18, 0.25);
  head.rotation.z = -0.05;
  parent.add(head);
}

function addTongs(parent, materials) {
  const hanger = torus(0.075, 0.016, materials.iron, 8, 24);
  hanger.name = 'anvil.tools.tongs-hanger';
  hanger.position.set(0.45, 0.58, 0.22);
  parent.add(hanger);

  for (const side of [-1, 1]) {
    const arm = tubeFromPoints([
      new THREE.Vector3(0.45 + side * 0.025, 0.55, 0.25),
      new THREE.Vector3(0.48 + side * 0.055, 0.38, 0.25),
      new THREE.Vector3(0.49 + side * 0.09, 0.16, 0.25),
      new THREE.Vector3(0.47 + side * 0.12, 0.02, 0.25),
    ], 0.018, materials.steel, {
      tubularSegments: 26,
      radialSegments: 7,
    });
    arm.name = `anvil.tools.tongs-arm.${side}`;
    parent.add(arm);
  }
  const pivot = bolt(0.035, 0.08, materials.ironEdge);
  pivot.name = 'anvil.tools.tongs-pivot';
  pivot.rotation.x = Math.PI * 0.5;
  pivot.position.set(0.45, 0.48, 0.25);
  parent.add(pivot);
}

export function createAnvilWorkstationModel() {
  const root = makePropRoot('prop.anvil-workstation', VERSION);
  const materials = {
    steel: surfaceMaterial('forged-iron', 0x27292a, {
      name: 'anvil-forged-steel',
      metalness: 0.9,
      roughness: 0.58,
    }),
    steelEdge: surfaceMaterial('worn-iron', 0x55585a, {
      name: 'anvil-polished-edge-steel',
      metalness: 0.94,
      roughness: 0.32,
    }),
    steelHighlight: surfaceMaterial('worn-iron', 0x686865, {
      name: 'anvil-polished-work-face',
      metalness: 0.96,
      roughness: 0.25,
    }),
    iron: surfaceMaterial('forged-iron', 0x252321, { name: 'anvil-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5b5650, { name: 'anvil-worn-spikes' }),
    bark: surfaceMaterial('bark', 0x3c2416, { name: 'anvil-charred-stump-bark' }),
    barkRelief: [0x29180f, 0x422619, 0x342016].map((color, index) => transformMaterialMaps(
      surfaceMaterial('bark', color, { name: `anvil-stump-bark-relief-${index}` }),
      { offset: [index * 0.19, index * 0.13], repeatScale: [0.72, 1.15] },
    )),
    splitWood: surfaceMaterial('split-wood', 0x684321, { name: 'anvil-stump-top' }),
    char: surfaceMaterial('bark', 0x1a1512, { name: 'anvil-stump-char' }),
    handle: surfaceMaterial('wood', 0x6d4424, { name: 'anvil-hammer-handle' }),
    leather: surfaceMaterial('leather', 0x5c3020, { name: 'anvil-leather-wrap' }),
    stone: PROP_PALETTE.limestone.slice(0, 3).map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `anvil-shim-stone-${index}` }),
      { offset: [index * 0.17, index * 0.11], repeatScale: [0.8, 0.8] },
    )),
    void: new THREE.MeshStandardMaterial({
      name: 'anvil-recess-void',
      color: 0x08090a,
      roughness: 0.9,
      metalness: 0.2,
    }),
  };

  const foundations = registerNode(root, 'anvil.foundation', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.55, height: 0.16, offset: [0, 0.08, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundations);
  addStoneShims(foundations, materials);

  const stump = registerNode(root, 'anvil.stump', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.52, height: 0.62, offset: [0, 0.42, 0] },
    destructionGroup: 'stump',
  });
  root.add(stump);
  addStump(stump, materials);

  const anvil = registerNode(root, 'anvil.steel-body', new THREE.Group(), {
    collider: { type: 'box', size: [1.35, 0.48, 0.4], offset: [0.08, 0.98, 0] },
    destructionGroup: 'anvil',
  });
  root.add(anvil);
  addAnvilBody(anvil, materials);
  addSocket(root, anvil, 'socket.anvil-top', new THREE.Vector3(-0.08, 1.17, 0));

  const tools = registerNode(root, 'anvil.tools', new THREE.Group(), {
    destructionGroup: 'tools',
  });
  root.add(tools);
  addHammer(tools, materials);
  addTongs(tools, materials);
  addSocket(root, tools, 'socket.anvil-hammer', new THREE.Vector3(-0.56, 0.38, 0.25));
  addSocket(root, tools, 'socket.anvil-tongs', new THREE.Vector3(0.47, 0.35, 0.25));

  root.userData.materialFamilies = [
    'forged-steel',
    'worn-steel',
    'charred-aged-oak',
    'blackened-iron',
    'limestone',
    'leather',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/anvil_workstation/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createAnvilWorkstationModel;
