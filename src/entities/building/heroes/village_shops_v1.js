/**
 * Mushoku countryside street shops — plain Three.js factories.
 * Worldview: early Buena/Roa village (wood + plaster + clay tile, cel-friendly).
 * Quality bar aligned with inn-v3 / guild-v2: solid roofs, proud facade props, identity signs.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const cache = new Map();
function rounded(size, r = 0.04, seg = 2) {
  const rr = Math.min(r, ...size.map((v) => v * 0.24));
  const key = [...size, rr, seg].map((v) => Number(v).toFixed(3)).join(':');
  if (!cache.has(key)) cache.set(key, new RoundedBoxGeometry(size[0], size[1], size[2], seg, rr));
  return cache.get(key);
}

function std(color, roughness = 0.75, metalness = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function mesh(geo, mat, name) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function box(parent, name, sx, sy, sz, x, y, z, mat, rot = [0, 0, 0], r = 0.035) {
  const m = mesh(rounded([sx, sy, sz], r), mat, name);
  m.position.set(x, y, z);
  m.rotation.set(...rot);
  parent.add(m);
  return m;
}

function cyl(parent, name, rt, rb, h, x, y, z, mat, segs = 12, rot = [0, 0, 0]) {
  const m = mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat, name);
  m.position.set(x, y, z);
  m.rotation.set(...rot);
  parent.add(m);
  return m;
}

function solidGable(parent, name, w, d, rise, y, mat) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, steps: 1 });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  const m = mesh(geo, mat, name);
  m.position.y = y;
  m.userData.structuralRoof = true;
  parent.add(m);
  return m;
}

function finishRoot(root, gen, displayName) {
  root.name = displayName;
  root.userData.gen = gen;
  root.userData.heroVersion = gen;
  root.userData.heroMode = 'agent-gen';
  root.userData.soleY = 0;
  root.userData.facadeNormal = '+Z';
  root.userData.usesPhotoBillboard = false;
  root.userData.sculptRuntime = { nodes: {}, meshes: {}, sockets: {} };
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      root.userData.sculptRuntime.meshes[o.name || o.uuid] = o;
    }
  });
  return root;
}

function hangingSign(parent, mats, x, y, z, faceColor, iconFn) {
  const rig = new THREE.Group();
  rig.name = 'sign_rig';
  rig.position.set(x, y, z);
  box(rig, 'sign.arm', 1.35, 0.08, 0.08, -0.55, 0.15, 0, mats.iron);
  box(rig, 'sign.plate', 0.95, 1.15, 0.1, -1.35, -0.35, 0, faceColor);
  box(rig, 'sign.border', 1.05, 1.25, 0.06, -1.35, -0.35, -0.02, mats.timberDark);
  if (iconFn) iconFn(rig, mats, -1.35, -0.35, 0.08);
  parent.add(rig);
  return rig;
}

function shutterWindow(parent, mats, name, w, h, x, y, z, glow = false) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  const glassMat = glow
    ? std(0xffc878, 0.3, 0, { emissive: 0xffa040, emissiveIntensity: 0.85 })
    : mats.glassDim;
  box(g, `${name}.frame`, w + 0.12, h + 0.12, 0.1, 0, 0, 0, mats.timber);
  box(g, `${name}.glass`, w, h, 0.05, 0, 0, 0.04, glassMat);
  box(g, `${name}.muntin_v`, 0.05, h * 0.9, 0.06, 0, 0, 0.06, mats.timberDark);
  box(g, `${name}.muntin_h`, w * 0.9, 0.05, 0.06, 0, 0, 0.06, mats.timberDark);
  // shutters
  box(g, `${name}.shutter_l`, w * 0.42, h * 1.05, 0.08, -w * 0.62, 0, 0.08, mats.plasterLight);
  box(g, `${name}.shutter_r`, w * 0.42, h * 1.05, 0.08, w * 0.62, 0, 0.08, mats.plasterLight);
  parent.add(g);
  return g;
}

function door(parent, mats, x, y, z, w = 1.1, h = 2.2) {
  const g = new THREE.Group();
  g.name = 'door';
  g.position.set(x, y, z);
  box(g, 'door.frame_l', 0.14, h + 0.15, 0.16, -w * 0.55, h * 0.5, 0, mats.timberDark);
  box(g, 'door.frame_r', 0.14, h + 0.15, 0.16, w * 0.55, h * 0.5, 0, mats.timberDark);
  box(g, 'door.lintel', w + 0.35, 0.16, 0.18, 0, h + 0.05, 0, mats.timber);
  box(g, 'door.leaf', w, h, 0.1, 0, h * 0.5, 0.02, mats.timber);
  box(g, 'door.band', w * 0.9, 0.08, 0.04, 0, h * 0.35, 0.08, mats.iron);
  box(g, 'door.band2', w * 0.9, 0.08, 0.04, 0, h * 0.7, 0.08, mats.iron);
  cyl(g, 'door.pull', 0.05, 0.05, 0.08, w * 0.32, h * 0.5, 0.1, mats.iron, 8, [Math.PI / 2, 0, 0]);
  parent.add(g);
  return g;
}

function sharedMats(overrides = {}) {
  return {
    plaster: std(0xf2e8d5, 0.9),
    plasterLight: std(0xf8f0e0, 0.88),
    plasterShade: std(0xe0d4c0, 0.92),
    timber: std(0x8b5e3c, 0.7),
    timberDark: std(0x4a2e18, 0.75),
    timberLight: std(0xb07a48, 0.65),
    roof: std(0xb85a48, 0.72),
    roofDark: std(0x8a3a30, 0.78),
    stone: std(0xa89888, 0.85),
    stoneDark: std(0x786858, 0.88),
    iron: std(0x3a3530, 0.35, 0.65),
    gold: std(0xd4a84a, 0.3, 0.55),
    glassDim: std(0xc8d8e8, 0.35, 0, { transparent: true, opacity: 0.85 }),
    purple: std(0x7a5aa8, 0.7),
    purpleDark: std(0x4a3070, 0.75),
    yellowWood: std(0xd4a84a, 0.65),
    forge: std(0xff6a20, 0.4, 0, { emissive: 0xff4400, emissiveIntensity: 1.2 }),
    crystal: std(0x88e0ff, 0.2, 0.1, { emissive: 0x44aacc, emissiveIntensity: 0.7 }),
    ...overrides,
  };
}

// ─── Magic shop ────────────────────────────────────────────────────────────

export function createMagicShopModel() {
  const mats = sharedMats();
  const root = new THREE.Group();
  const W = 5.2;
  const D = 4.8;
  const H = 4.4;
  const fz = D / 2 + 0.05;

  box(root, 'plinth', W + 0.35, 0.35, D + 0.35, 0, 0.175, 0, mats.stone);
  box(root, 'shell', W, H, D, 0, 0.35 + H / 2, 0, mats.plaster);
  // purple roof accent + gable
  solidGable(root, 'roof.gable', W * 1.12, D * 1.08, 1.9, 0.35 + H - 0.05, mats.purple);
  // pointed tip / spirelet
  cyl(root, 'roof.spire', 0.08, 0.28, 1.1, 0, 0.35 + H + 1.55, 0, mats.purpleDark, 8);
  box(root, 'roof.ridge', 0.18, 0.14, D * 0.9, 0, 0.35 + H + 1.85, 0, mats.gold);

  // half-timber front
  for (const x of [-W * 0.42, 0, W * 0.42]) {
    box(root, `post_${x}`, 0.16, H * 0.95, 0.14, x, 0.35 + H * 0.48, fz, mats.timber);
  }
  for (const y of [0.55, 0.35 + H * 0.48, 0.35 + H * 0.92]) {
    box(root, `rail_${y}`, W * 0.95, 0.14, 0.12, 0, y, fz, mats.timberDark);
  }

  shutterWindow(root, mats, 'win.display', 1.6, 1.35, 1.0, 1.55, fz + 0.08, true);
  door(root, mats, -1.15, 0.35, fz + 0.06);
  hangingSign(root, mats, -W * 0.55, 3.4, fz + 0.1, mats.purpleDark, (rig, m, x, y, z) => {
    const ball = mesh(new THREE.SphereGeometry(0.28, 14, 12), m.crystal, 'sign.crystal');
    ball.position.set(x, y + 0.05, z);
    rig.add(ball);
  });

  // side windows
  shutterWindow(root, mats, 'win.side', 0.9, 1.0, W / 2 + 0.06, 2.2, 0.4, true);
  // chimney small
  box(root, 'chimney', 0.55, 1.4, 0.55, W * 0.28, 0.35 + H + 0.9, -D * 0.15, mats.stoneDark);

  return finishRoot(root, 'img2threejs-magic_shop-v1', 'hero.shop.magic.v1');
}

// ─── Smithy ────────────────────────────────────────────────────────────────

export function createSmithyModel() {
  const mats = sharedMats();
  const root = new THREE.Group();
  const W = 5.8;
  const D = 5.2;
  const H = 3.9;
  const fz = D / 2 + 0.05;

  box(root, 'plinth', W + 0.4, 0.4, D + 0.4, 0, 0.2, 0, mats.stoneDark);
  box(root, 'shell', W, H, D, 0, 0.4 + H / 2, 0, mats.timberDark);
  // lighter upper band
  box(root, 'upper_band', W * 1.02, H * 0.35, D * 1.02, 0, 0.4 + H * 0.78, 0, mats.timber);
  solidGable(root, 'roof.gable', W * 1.15, D * 1.1, 1.7, 0.4 + H - 0.05, mats.roofDark);

  // open forge mouth (recess + glow)
  box(root, 'forge.recess', 1.8, 1.5, 0.35, 0.9, 1.35, fz - 0.05, mats.stoneDark);
  box(root, 'forge.glow', 1.5, 1.15, 0.2, 0.9, 1.3, fz + 0.12, mats.forge);
  cyl(root, 'chimney', 0.45, 0.55, 2.6, -1.5, 0.4 + H + 0.9, -0.6, mats.stoneDark, 10);
  box(root, 'chimney.cap', 1.0, 0.25, 1.0, -1.5, 0.4 + H + 2.25, -0.6, mats.stone);

  door(root, mats, -1.4, 0.4, fz + 0.05, 1.0, 2.1);
  // anvil
  box(root, 'anvil.base', 0.55, 0.35, 0.35, 1.9, 0.55, fz + 0.55, mats.iron);
  box(root, 'anvil.top', 0.85, 0.22, 0.32, 1.9, 0.85, fz + 0.55, mats.iron);

  hangingSign(root, mats, -W * 0.52, 3.2, fz + 0.08, mats.timber, (rig, m, x, y, z) => {
    box(rig, 'sign.hammer_head', 0.45, 0.22, 0.18, x, y + 0.15, z, m.iron);
    box(rig, 'sign.hammer_haft', 0.08, 0.55, 0.08, x, y - 0.15, z, m.timberDark);
  });

  // side timber posts
  for (const x of [-W * 0.45, W * 0.45]) {
    box(root, `corner_${x}`, 0.22, H, 0.22, x, 0.4 + H / 2, fz - 0.05, mats.timber);
  }

  return finishRoot(root, 'img2threejs-smithy-v1', 'hero.shop.smithy.v1');
}

// ─── General shop ──────────────────────────────────────────────────────────

export function createGeneralShopModel() {
  const mats = sharedMats();
  const root = new THREE.Group();
  const W = 5.0;
  const D = 4.4;
  const H = 4.0;
  const fz = D / 2 + 0.05;

  box(root, 'plinth', W + 0.3, 0.32, D + 0.3, 0, 0.16, 0, mats.stone);
  box(root, 'shell', W, H, D, 0, 0.32 + H / 2, 0, mats.plaster);
  solidGable(root, 'roof.gable', W * 1.14, D * 1.1, 1.65, 0.32 + H - 0.05, mats.roof);

  // porch awning
  box(root, 'awning', W * 0.95, 0.1, 1.1, 0, 2.55, fz + 0.45, mats.timberLight);
  for (const x of [-W * 0.38, W * 0.38]) {
    box(root, `awning_post_${x}`, 0.12, 2.2, 0.12, x, 1.25, fz + 0.85, mats.timber);
  }

  // facade timber
  for (const x of [-W * 0.4, W * 0.4]) {
    box(root, `post_${x}`, 0.15, H * 0.92, 0.12, x, 0.32 + H * 0.46, fz, mats.timber);
  }
  box(root, 'rail_mid', W * 0.92, 0.12, 0.1, 0, 0.32 + H * 0.5, fz, mats.timberDark);

  door(root, mats, -0.9, 0.32, fz + 0.05);
  shutterWindow(root, mats, 'win.shop', 1.4, 1.2, 1.05, 1.7, fz + 0.08, false);

  // crates + barrel
  box(root, 'crate1', 0.55, 0.45, 0.55, 1.7, 0.55, fz + 0.7, mats.yellowWood);
  box(root, 'crate2', 0.45, 0.35, 0.45, 2.15, 0.5, fz + 0.55, mats.timberLight);
  cyl(root, 'barrel', 0.28, 0.3, 0.55, -2.0, 0.6, fz + 0.65, mats.timberDark, 10);

  hangingSign(root, mats, -W * 0.52, 3.15, fz + 0.1, mats.yellowWood, (rig, m, x, y, z) => {
    box(rig, 'sign.bag', 0.35, 0.4, 0.12, x, y, z, m.timberDark);
  });

  return finishRoot(root, 'img2threejs-general_shop-v1', 'hero.shop.general.v1');
}

// ─── Carriage stop (open pavilion) ─────────────────────────────────────────

export function createCarriageStopModel() {
  const mats = sharedMats();
  const root = new THREE.Group();
  const W = 6.2;
  const D = 4.0;
  const postH = 3.2;
  const posts = [
    [-W * 0.4, -D * 0.4],
    [W * 0.4, -D * 0.4],
    [-W * 0.4, D * 0.4],
    [W * 0.4, D * 0.4],
  ];

  // ground pad
  box(root, 'pad', W + 0.8, 0.12, D + 0.8, 0, 0.06, 0, mats.stone, [0, 0, 0], 0.02);

  for (const [i, [x, z]] of posts.entries()) {
    box(root, `post_${i}`, 0.28, postH, 0.28, x, postH * 0.5, z, mats.timber);
    // base blocks
    box(root, `post_base_${i}`, 0.45, 0.25, 0.45, x, 0.2, z, mats.stoneDark);
  }

  // beams
  box(root, 'beam_ew_n', W * 0.85, 0.22, 0.22, 0, postH - 0.1, -D * 0.4, mats.timberDark);
  box(root, 'beam_ew_s', W * 0.85, 0.22, 0.22, 0, postH - 0.1, D * 0.4, mats.timberDark);
  box(root, 'beam_ns_w', 0.22, 0.22, D * 0.85, -W * 0.4, postH - 0.1, 0, mats.timberDark);
  box(root, 'beam_ns_e', 0.22, 0.22, D * 0.85, W * 0.4, postH - 0.1, 0, mats.timberDark);

  // roof — open gable / hip-ish prism
  solidGable(root, 'roof', W * 1.25, D * 1.2, 1.35, postH - 0.05, mats.roof);
  // ridge beam
  box(root, 'ridge', 0.16, 0.14, D * 1.05, 0, postH + 1.25, 0, mats.timberDark);

  // hitching rail
  box(root, 'hitch_rail', W * 0.7, 0.1, 0.1, 0, 1.0, D * 0.55 + 0.2, mats.timber);
  for (const x of [-W * 0.28, W * 0.28]) {
    box(root, `hitch_post_${x}`, 0.12, 1.0, 0.12, x, 0.55, D * 0.55 + 0.2, mats.timberDark);
  }

  // trough
  box(root, 'trough', 1.4, 0.35, 0.55, -1.8, 0.4, D * 0.55 + 0.55, mats.stone);
  box(root, 'water', 1.15, 0.08, 0.35, -1.8, 0.55, D * 0.55 + 0.55, std(0x4a90b8, 0.25));

  // lantern
  box(root, 'lantern_arm', 0.08, 0.08, 0.7, W * 0.4, postH - 0.5, D * 0.15, mats.iron);
  const lamp = mesh(new THREE.BoxGeometry(0.28, 0.35, 0.28), std(0xffd080, 0.4, 0, { emissive: 0xffaa40, emissiveIntensity: 0.9 }), 'lantern');
  lamp.position.set(W * 0.4, postH - 0.85, D * 0.15 + 0.35);
  root.add(lamp);

  return finishRoot(root, 'img2threejs-carriage_stop-v1', 'hero.carriage_stop.v1');
}

export default {
  createMagicShopModel,
  createSmithyModel,
  createGeneralShopModel,
  createCarriageStopModel,
};
