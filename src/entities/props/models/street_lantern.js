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
  surfaceMaterial,
  taperedBoxGeometry,
  torus,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-lantern-v2-pbr';

function addHexRing(group, y, radius, material, name) {
  const vertices = Array.from({ length: 6 }, (_, index) => {
    const angle = Math.PI / 6 + index * Math.PI / 3;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });
  for (let index = 0; index < 6; index += 1) {
    const edge = beamBetween(
      vertices[index],
      vertices[(index + 1) % vertices.length],
      0.022,
      material,
      6,
    );
    edge.name = `${name}.${index}`;
    group.add(edge);
  }
}

function buildPost(root, materials) {
  const post = registerNode(root, 'lantern.post', new THREE.Group(), {
    collider: {
      type: 'compound',
      shapes: [
        { type: 'cylinder', radius: 0.34, height: 0.22, offset: [-0.46, 0.11, 0] },
        { type: 'box', size: [0.24, 2.64, 0.24], offset: [-0.46, 1.48, 0] },
      ],
    },
    destructionGroup: 'post',
  });
  root.add(post);

  const stoneBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.23, 8),
    materials.stone,
  );
  stoneBase.name = 'post.stone-plinth';
  stoneBase.position.set(-0.46, 0.115, 0);
  post.add(stoneBase);

  const shoe = chamferedBox(0.48, 0.13, 0.48, materials.iron, 0.04);
  shoe.name = 'post.base-shoe';
  shoe.position.set(-0.46, 0.30, 0);
  post.add(shoe);
  for (const x of [-0.16, 0.16]) {
    for (const z of [-0.16, 0.16]) {
      const fastener = bolt(0.035, 0.055, materials.brass);
      fastener.name = 'post.base-bolt';
      fastener.position.set(-0.46 + x, 0.39, z);
      post.add(fastener);
    }
  }

  const lower = new THREE.Mesh(
    taperedBoxGeometry(0.28, 0.28, 0.15, 0.15, 1.08),
    materials.iron,
  );
  lower.name = 'post.lower-taper';
  lower.position.set(-0.46, 0.39, 0);
  post.add(lower);

  const collarLow = chamferedBox(0.31, 0.1, 0.31, materials.ironEdge, 0.035);
  collarLow.name = 'post.lower-collar';
  collarLow.position.set(-0.46, 1.46, 0);
  post.add(collarLow);

  const shaft = new THREE.Mesh(
    taperedBoxGeometry(0.16, 0.16, 0.12, 0.12, 1.2),
    materials.iron,
  );
  shaft.name = 'post.upper-shaft';
  shaft.position.set(-0.46, 1.51, 0);
  post.add(shaft);

  const collarHigh = chamferedBox(0.22, 0.16, 0.22, materials.ironEdge, 0.03);
  collarHigh.name = 'post.hook-collar';
  collarHigh.position.set(-0.46, 2.72, 0);
  post.add(collarHigh);
  for (const x of [-0.075, 0.075]) {
    const fastener = bolt(0.026, 0.045, materials.brass);
    fastener.name = 'post.collar-bolt';
    fastener.rotation.x = Math.PI * 0.5;
    fastener.position.set(-0.46 + x, 2.72, 0.13);
    post.add(fastener);
  }

  const hook = tubeFromPoints([
    new THREE.Vector3(-0.46, 2.74, 0),
    new THREE.Vector3(-0.45, 3.12, 0),
    new THREE.Vector3(-0.26, 3.38, 0),
    new THREE.Vector3(0.1, 3.43, 0),
    new THREE.Vector3(0.42, 3.27, 0),
    new THREE.Vector3(0.47, 3.01, 0),
    new THREE.Vector3(0.37, 2.9, 0),
  ], 0.065, materials.iron, {
    tubularSegments: 30,
    radialSegments: 8,
  });
  hook.name = 'post.shepherd-hook';
  post.add(hook);
  addSocket(root, post, 'socket.lantern-chain', new THREE.Vector3(0.37, 2.89, 0));
}

function buildChain(root, materials) {
  const chain = registerNode(root, 'lantern.chain', new THREE.Group(), {
    destructionGroup: 'lantern',
  });
  root.add(chain);
  const chainX = 0.37;
  const startY = 2.86;
  for (let index = 0; index < 4; index += 1) {
    const link = torus(0.075, 0.018, materials.ironEdge, 7, 14);
    link.name = `chain.link.${index}`;
    link.scale.y = 1.28;
    link.position.set(chainX, startY - index * 0.105, 0);
    if (index % 2) link.rotation.y = Math.PI * 0.5;
    chain.add(link);
  }
  addSocket(root, chain, 'socket.lantern-cage', new THREE.Vector3(chainX, 2.48, 0));
}

function buildCage(root, materials) {
  const cage = registerNode(root, 'lantern.cage', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.29, height: 0.95, offset: [0.37, 2.02, 0] },
    destructionGroup: 'lantern',
  });
  root.add(cage);
  cage.position.set(0.37, 0, 0);

  const radius = 0.24;
  const bottomY = 1.62;
  const topY = 2.3;
  const midY = 1.96;

  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + index * Math.PI / 3;
    const pane = chamferedBox(0.225, 0.58, 0.018, materials.glass, 0.012);
    pane.name = `cage.glass-pane.${index}`;
    pane.position.set(Math.cos(angle) * radius * 0.88, midY, Math.sin(angle) * radius * 0.88);
    pane.rotation.y = -angle + Math.PI * 0.5;
    cage.add(pane);

    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, topY - bottomY + 0.08, 7),
      materials.iron,
    );
    bar.name = `cage.vertical-bar.${index}`;
    bar.position.set(Math.cos(angle) * radius, midY, Math.sin(angle) * radius);
    cage.add(bar);

    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 7, 5),
      materials.brass,
    );
    rivet.name = `cage.mid-rivet.${index}`;
    rivet.position.set(Math.cos(angle) * (radius + 0.018), midY, Math.sin(angle) * (radius + 0.018));
    cage.add(rivet);
  }
  addHexRing(cage, bottomY, radius, materials.ironEdge, 'cage.bottom-ring');
  addHexRing(cage, midY, radius + 0.005, materials.ironEdge, 'cage.mid-ring');
  addHexRing(cage, topY, radius, materials.ironEdge, 'cage.top-ring');

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.32, 6),
    materials.iron,
  );
  cap.name = 'cage.vented-cap';
  cap.position.y = 2.47;
  cap.rotation.y = Math.PI / 6;
  cage.add(cap);
  const capBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.07, 6),
    materials.ironEdge,
  );
  capBrim.name = 'cage.cap-brim';
  capBrim.position.y = 2.31;
  capBrim.rotation.y = Math.PI / 6;
  cage.add(capBrim);

  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3;
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.012, 10),
      materials.void,
    );
    vent.name = `cage.vent.${index}`;
    vent.rotation.x = Math.PI * 0.5;
    vent.position.set(Math.cos(angle) * 0.17, 2.47, Math.sin(angle) * 0.17);
    cage.add(vent);
  }

  const topFinial = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    materials.ironEdge,
  );
  topFinial.name = 'cage.top-finial';
  topFinial.position.y = 2.69;
  cage.add(topFinial);

  const lowerCup = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.22, 6),
    materials.iron,
  );
  lowerCup.name = 'cage.lower-cup';
  lowerCup.rotation.x = Math.PI;
  lowerCup.rotation.y = Math.PI / 6;
  lowerCup.position.y = 1.5;
  cage.add(lowerCup);
  const lowerFinial = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 0),
    materials.ironEdge,
  );
  lowerFinial.name = 'cage.lower-finial';
  lowerFinial.position.y = 1.36;
  cage.add(lowerFinial);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    materials.core,
  );
  core.name = 'cage.amber-core';
  core.scale.set(0.72, 1.55, 0.72);
  core.position.y = 1.95;
  cage.add(core);
  const glow = new THREE.PointLight(0xffa93b, 5.2, 3.1, 2);
  glow.name = 'cage.amber-point-light';
  glow.position.y = 1.96;
  glow.castShadow = false;
  cage.add(glow);
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.085, 0.24, 12),
    materials.candle,
  );
  candle.name = 'cage.candle';
  candle.position.y = 1.76;
  cage.add(candle);

  addSocket(root, cage, 'socket.light-emitter', new THREE.Vector3(0, 1.98, 0));
}

export function createStreetLanternModel() {
  const root = makePropRoot('prop.street-lantern', VERSION);
  const materials = {
    stone: surfaceMaterial('stone', 0x92785b, { name: 'dressed-stone' }),
    iron: surfaceMaterial('forged-iron', 0x302f2d, {
      name: 'forged-iron',
      emissive: new THREE.Color(0x080807),
      emissiveIntensity: 0.04,
    }),
    ironEdge: surfaceMaterial('worn-iron', 0x4c4945, {
      name: 'worn-iron-edge',
      emissive: new THREE.Color(0x0b0a09),
      emissiveIntensity: 0.03,
    }),
    brass: surfaceMaterial('brass', PROP_PALETTE.brass, {
      name: 'aged-brass-fastener',
    }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'amber-glass',
      color: 0xf0a93f,
      emissive: 0x6d2f08,
      emissiveIntensity: 0.18,
      roughness: 0.12,
      metalness: 0,
      transparent: true,
      opacity: 0.52,
      transmission: 0.42,
      thickness: 0.12,
      attenuationColor: new THREE.Color(0xffa23a),
      attenuationDistance: 0.72,
      ior: 1.48,
      clearcoat: 0.75,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    core: new THREE.MeshStandardMaterial({
      name: 'amber-light-core',
      color: 0xffcc62,
      emissive: PROP_PALETTE.ember,
      emissiveIntensity: 3.4,
      roughness: 0.12,
      toneMapped: true,
    }),
    candle: surfaceMaterial('clay', 0x7d3d1c, {
      name: 'candle-cup',
      emissive: 0x3a1808,
      emissiveIntensity: 0.16,
    }),
    void: new THREE.MeshBasicMaterial({ name: 'vent-cavity', color: 0x100e0c }),
  };

  buildPost(root, materials);
  buildChain(root, materials);
  buildCage(root, materials);

  root.userData.materialFamilies = ['stone', 'forged-iron', 'aged-brass', 'amber-glass', 'emissive-core'];
  root.userData.referenceViews = {
    main: 'docs/references/props/street_lantern/ref_main.png',
    front: 'docs/references/props/street_lantern/ref_front.png',
    side: 'docs/references/props/street_lantern/ref_side.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createStreetLanternModel;
