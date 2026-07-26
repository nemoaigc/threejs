/**
 * Batch P0 street-dressing props — Mushoku countryside micro-detail.
 *
 * Design: readable 3s identity from hero cam, multi-part volume (not single boxes),
 * sole@y=0. Sparse plant via layout — empty > junk.
 *
 * Batch production: one factory per identity. Add more by cloning a factory
 * pattern here or via Claude prompt (see props/README.md).
 */
import * as THREE from 'three';
import { P, root, box, cyl, sphere, torus, done, makeToon, makeGlow, hash01 } from './kit.js';

const GEN = 'props-batch-p0';

// ─── lantern post ──────────────────────────────────────────────────────────

/** Wood post + warm hanging lantern (street / plaza edge). */
export function createLanternPost() {
  const g = root('prop.lantern_post', GEN);
  // stepped base stone
  cyl(g, 'base.low', 0.22, 0.26, 0.12, 0, 0.06, 0, P.stoneDark, 8);
  cyl(g, 'base.top', 0.16, 0.18, 0.1, 0, 0.16, 0, P.stone, 8);
  // tapered post
  cyl(g, 'post', 0.055, 0.075, 2.55, 0, 1.45, 0, P.timberDark, 8);
  // iron arm
  box(g, 'arm', 0.7, 0.06, 0.06, 0.32, 2.55, 0, P.iron);
  box(g, 'arm.brace', 0.06, 0.28, 0.06, 0.12, 2.4, 0, P.ironLight);
  // chain + housing
  cyl(g, 'chain', 0.015, 0.015, 0.22, 0.58, 2.42, 0, P.iron, 5);
  box(g, 'housing', 0.32, 0.38, 0.32, 0.58, 2.15, 0, P.timber);
  box(g, 'housing.frame.t', 0.36, 0.05, 0.36, 0.58, 2.36, 0, P.timberDark);
  box(g, 'housing.frame.b', 0.36, 0.05, 0.36, 0.58, 1.96, 0, P.timberDark);
  // glass panes (flat, slightly inset)
  const glass = makeGlow(P.lampGlass, P.lampCore, 0.85);
  for (const [dx, dz] of [
    [0.17, 0],
    [-0.17, 0],
    [0, 0.17],
    [0, -0.17],
  ]) {
    box(g, 'glass', 0.02, 0.26, 0.22, 0.58 + dx, 2.15, dz, glass);
  }
  sphere(g, 'core', 0.09, 0.58, 2.15, 0, glass, 8);
  // roof cap
  box(g, 'cap', 0.4, 0.06, 0.4, 0.58, 2.42, 0, P.clay);
  return done(g);
}

// ─── quest board ───────────────────────────────────────────────────────────

/** Guild-style quest board — posts, dark board, pinned papers, header bar. */
export function createQuestBoard() {
  const g = root('prop.quest_board', GEN);
  // stone feet
  box(g, 'foot.L', 0.28, 0.14, 0.28, -0.55, 0.07, 0, P.stoneDark);
  box(g, 'foot.R', 0.28, 0.14, 0.28, 0.55, 0.07, 0, P.stoneDark);
  // posts
  box(g, 'post.L', 0.12, 2.2, 0.12, -0.55, 1.2, 0, P.timber);
  box(g, 'post.R', 0.12, 2.2, 0.12, 0.55, 1.2, 0, P.timber);
  // cross beams
  box(g, 'beam.top', 1.3, 0.1, 0.1, 0, 2.25, 0, P.timberDark);
  box(g, 'beam.bot', 1.3, 0.08, 0.1, 0, 0.95, 0, P.timberDark);
  // main board
  box(g, 'board', 1.2, 1.15, 0.08, 0, 1.6, 0.02, 0x4a3224);
  box(g, 'board.frame', 1.3, 1.25, 0.04, 0, 1.6, -0.02, P.timberDark);
  // header plaque
  box(g, 'header', 0.95, 0.22, 0.06, 0, 2.35, 0.06, P.guildGreen);
  box(g, 'header.bar', 0.7, 0.05, 0.04, 0, 2.35, 0.1, P.plank);
  // papers (proud of board)
  const papers = [
    [-0.28, 1.85, 0.4, 0.42, P.paper],
    [0.22, 1.75, 0.35, 0.38, P.paperOld],
    [-0.05, 1.35, 0.48, 0.28, P.paperTan],
    [0.32, 1.4, 0.28, 0.32, P.paper],
    [-0.35, 1.4, 0.3, 0.35, P.paperOld],
  ];
  papers.forEach(([x, y, w, h, c], i) => {
    box(g, `paper.${i}`, w, h, 0.03, x, y, 0.08, c, (hash01(i, 3) - 0.5) * 0.15);
    // pin
    sphere(g, `pin.${i}`, 0.025, x, y + h * 0.35, 0.11, P.iron, 5);
  });
  // side rail hooks
  box(g, 'hook.L', 0.04, 0.2, 0.04, -0.68, 1.7, 0.05, P.iron);
  box(g, 'hook.R', 0.04, 0.2, 0.04, 0.68, 1.7, 0.05, P.iron);
  return done(g);
}

// ─── village well ──────────────────────────────────────────────────────────

/** Stone well with timber winch roof + magic-ring plinth (plaza hero prop). */
export function createWell() {
  const g = root('prop.well', GEN);
  // plinth disc
  cyl(g, 'plinth', 1.35, 1.45, 0.14, 0, 0.07, 0, P.stoneDark, 16);
  // stacked stone courses (volume, not one cylinder)
  for (let i = 0; i < 4; i++) {
    const y = 0.22 + i * 0.22;
    const r = 1.05 - i * 0.02;
    cyl(g, `course.${i}`, r, r + 0.04, 0.2, 0, y, 0, i % 2 ? P.stone : P.stoneLight, 14);
  }
  // rim
  torus(g, 'rim', 0.95, 0.1, 0, 1.05, 0, P.stoneDark, { segs: 18 });
  // water surface (sunken)
  cyl(g, 'water', 0.72, 0.72, 0.06, 0, 0.55, 0, makeToon(P.water, { transparent: true, opacity: 0.85 }), 12);
  // posts + beam + clay roof
  for (const sx of [-0.72, 0.72]) {
    box(g, 'post', 0.12, 1.55, 0.12, sx, 1.75, 0, P.timber);
  }
  box(g, 'beam', 1.7, 0.1, 0.1, 0, 2.5, 0, P.timberDark);
  // simple gable-ish roof: two slabs
  const roofMat = makeToon(P.clay);
  const roofL = box(g, 'roof.L', 1.0, 0.08, 1.35, -0.35, 2.72, 0, roofMat);
  roofL.rotation.z = 0.35;
  const roofR = box(g, 'roof.R', 1.0, 0.08, 1.35, 0.35, 2.72, 0, roofMat);
  roofR.rotation.z = -0.35;
  box(g, 'ridge', 0.15, 0.1, 1.4, 0, 2.95, 0, P.clayDark);
  // crank + rope + bucket
  const axle = cyl(g, 'crank.axle', 0.04, 0.04, 1.5, 0, 2.35, 0, P.timberDark, 6);
  axle.rotation.z = Math.PI / 2;
  box(g, 'crank.handle', 0.08, 0.35, 0.08, 0.85, 2.2, 0.15, P.timber);
  cyl(g, 'rope', 0.02, 0.02, 0.7, 0.15, 1.85, 0.2, P.rope, 5);
  cyl(g, 'bucket', 0.16, 0.18, 0.28, 0.15, 1.45, 0.2, P.timber, 8);
  box(g, 'bucket.band', 0.38, 0.03, 0.38, 0.15, 1.38, 0.2, P.iron);
  // soft magic circle on ground
  const ringMat = makeGlow(P.magicRing, 0xa0e8ff, 0.35);
  torus(g, 'magic.ring', 1.55, 0.04, 0, 0.03, 0, ringMat, { segs: 28 });
  torus(g, 'magic.ring.inner', 1.15, 0.025, 0, 0.04, 0, ringMat, { segs: 20 });
  return done(g);
}

// ─── crates / barrels ──────────────────────────────────────────────────────

function addCrate(g, name, x, y, z, sx, sy, sz, yaw = 0) {
  box(g, `${name}.body`, sx, sy, sz, x, y + sy * 0.5, z, P.plank, yaw);
  box(g, `${name}.band.bot`, sx * 1.04, 0.04, sz * 1.04, x, y + 0.05, z, P.timberDark, yaw);
  box(g, `${name}.band.top`, sx * 1.04, 0.04, sz * 1.04, x, y + sy - 0.05, z, P.timberDark, yaw);
  box(g, `${name}.edge.x`, sx * 1.02, sy * 0.9, 0.03, x, y + sy * 0.5, z + sz * 0.5, P.timber, yaw);
}

function addBarrel(g, name, x, y, z, s = 1) {
  cyl(g, `${name}.body`, 0.28 * s, 0.32 * s, 0.55 * s, x, y + 0.28 * s, z, P.timber, 12);
  box(g, `${name}.band.lo`, 0.58 * s, 0.045 * s, 0.58 * s, x, y + 0.12 * s, z, P.iron);
  box(g, `${name}.band.mid`, 0.6 * s, 0.04 * s, 0.6 * s, x, y + 0.28 * s, z, P.ironLight);
  box(g, `${name}.band.hi`, 0.58 * s, 0.045 * s, 0.58 * s, x, y + 0.44 * s, z, P.iron);
  cyl(g, `${name}.lid`, 0.27 * s, 0.27 * s, 0.04 * s, x, y + 0.56 * s, z, P.timberDark, 10);
}

/** Stack of market crates. */
export function createCrateStack() {
  const g = root('prop.crate_stack', GEN);
  addCrate(g, 'c0', 0, 0, 0, 0.55, 0.42, 0.5, 0.05);
  addCrate(g, 'c1', 0.5, 0, 0.15, 0.48, 0.38, 0.45, -0.2);
  addCrate(g, 'c2', 0.15, 0.42, 0.05, 0.5, 0.36, 0.48, 0.12);
  // loose produce balls
  sphere(g, 'apple', 0.08, 0.15, 0.9, 0.1, 0xc84a3a, 6);
  sphere(g, 'apple2', 0.07, 0.28, 0.88, 0.0, 0xd06040, 6);
  return done(g);
}

/** One or two barrels + optional spill crate. */
export function createBarrelCluster() {
  const g = root('prop.barrel_cluster', GEN);
  addBarrel(g, 'b0', 0, 0, 0, 1);
  addBarrel(g, 'b1', 0.55, 0, 0.2, 0.9);
  addCrate(g, 'side', -0.55, 0, 0.1, 0.4, 0.32, 0.38, 0.3);
  return done(g);
}

// ─── woodpile (smithy / cottage) ────────────────────────────────────────────

export function createWoodpile() {
  const g = root('prop.woodpile', GEN);
  // ground plank
  box(g, 'base', 1.4, 0.08, 0.7, 0, 0.04, 0, P.timberDark);
  let n = 0;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5 - row; i++) {
      const x = (i - (4 - row) * 0.5) * 0.26;
      const y = 0.12 + row * 0.16;
      const yaw = (hash01(row, i) - 0.5) * 0.2;
      const log = cyl(g, `log.${n++}`, 0.07, 0.08, 0.65, x, y, 0, row % 2 ? P.timber : P.timberLight, 7);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = yaw;
    }
  }
  // upright end stakes
  box(g, 'stake.L', 0.06, 0.55, 0.06, -0.72, 0.28, 0, P.timberDark);
  box(g, 'stake.R', 0.06, 0.55, 0.06, 0.72, 0.28, 0, P.timberDark);
  return done(g);
}

// ─── handcart ──────────────────────────────────────────────────────────────

export function createHandcart() {
  const g = root('prop.handcart', GEN);
  // bed
  box(g, 'bed', 1.1, 0.08, 0.65, 0, 0.55, 0, P.plank);
  box(g, 'side.L', 1.1, 0.28, 0.05, 0, 0.7, 0.32, P.timber);
  box(g, 'side.R', 1.1, 0.28, 0.05, 0, 0.7, -0.32, P.timber);
  box(g, 'front', 0.05, 0.28, 0.65, 0.55, 0.7, 0, P.timberDark);
  // handles
  box(g, 'handle.L', 0.7, 0.05, 0.05, -0.75, 0.85, 0.22, P.timberDark);
  box(g, 'handle.R', 0.7, 0.05, 0.05, -0.75, 0.85, -0.22, P.timberDark);
  box(g, 'grip', 0.05, 0.05, 0.55, -1.08, 0.85, 0, P.timber);
  // axle + wheels
  cyl(g, 'axle', 0.03, 0.03, 0.8, 0.15, 0.32, 0, P.iron, 6).rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    const w = cyl(g, 'wheel', 0.28, 0.28, 0.08, 0.15, 0.32, side * 0.42, P.timberDark, 10);
    w.rotation.x = Math.PI / 2;
    // hub
    cyl(g, 'hub', 0.06, 0.06, 0.1, 0.15, 0.32, side * 0.42, P.iron, 6).rotation.x = Math.PI / 2;
  }
  // cargo crate
  addCrate(g, 'cargo', 0.05, 0.6, 0, 0.45, 0.32, 0.4, 0.1);
  return done(g);
}

// ─── bench ─────────────────────────────────────────────────────────────────

export function createBench() {
  const g = root('prop.bench', GEN);
  box(g, 'seat', 1.35, 0.08, 0.42, 0, 0.48, 0, P.plank);
  box(g, 'back', 1.35, 0.45, 0.06, 0, 0.78, -0.18, P.timber);
  for (const x of [-0.55, 0.55]) {
    box(g, 'leg.f', 0.08, 0.45, 0.08, x, 0.22, 0.12, P.timberDark);
    box(g, 'leg.b', 0.08, 0.45, 0.08, x, 0.22, -0.15, P.timberDark);
  }
  box(g, 'brace', 1.1, 0.05, 0.05, 0, 0.22, 0, P.timberDark);
  return done(g);
}

// ─── fence section ─────────────────────────────────────────────────────────

/** Short wooden fence run (~2.2m) — plant several for a line. */
export function createFenceSection() {
  const g = root('prop.fence_section', GEN);
  const posts = [-1.0, 0, 1.0];
  for (const x of posts) {
    box(g, 'post', 0.1, 1.05, 0.1, x, 0.52, 0, P.timberDark);
    // cap
    box(g, 'cap', 0.14, 0.06, 0.14, x, 1.08, 0, P.timber);
  }
  // rails
  box(g, 'rail.hi', 2.15, 0.08, 0.05, 0, 0.85, 0, P.timber);
  box(g, 'rail.lo', 2.15, 0.08, 0.05, 0, 0.4, 0, P.timber);
  // diagonal brace
  const brace = box(g, 'brace', 1.1, 0.05, 0.04, -0.35, 0.6, 0.02, P.timberLight);
  brace.rotation.z = 0.4;
  return done(g);
}

// ─── hitching post ─────────────────────────────────────────────────────────

export function createHitchingPost() {
  const g = root('prop.hitching_post', GEN);
  box(g, 'post', 0.12, 1.25, 0.12, 0, 0.62, 0, P.timberDark);
  box(g, 'base', 0.28, 0.12, 0.28, 0, 0.06, 0, P.stone);
  box(g, 'rail', 1.4, 0.08, 0.08, 0, 1.05, 0, P.timber);
  box(g, 'post.L', 0.1, 1.1, 0.1, -0.7, 0.55, 0, P.timber);
  box(g, 'post.R', 0.1, 1.1, 0.1, 0.7, 0.55, 0, P.timber);
  // iron rings
  torus(g, 'ring.L', 0.07, 0.015, -0.35, 1.05, 0.06, P.iron, { segs: 8 });
  torus(g, 'ring.R', 0.07, 0.015, 0.35, 1.05, 0.06, P.iron, { segs: 8 });
  return done(g);
}

// ─── waystone / road marker ────────────────────────────────────────────────

export function createWaystone() {
  const g = root('prop.waystone', GEN);
  // rough stacked stone
  box(g, 'base', 0.55, 0.25, 0.4, 0, 0.12, 0, P.stoneDark);
  box(g, 'mid', 0.42, 0.55, 0.32, 0, 0.5, 0, P.stone);
  box(g, 'top', 0.35, 0.4, 0.28, 0, 0.95, 0, P.stoneLight);
  // carved face plate
  box(g, 'glyph', 0.2, 0.28, 0.04, 0, 0.95, 0.16, makeGlow(P.magicRing, 0xa0e8ff, 0.25));
  // moss tufts
  sphere(g, 'moss', 0.08, 0.15, 1.2, 0.05, P.foliage, 5);
  sphere(g, 'moss2', 0.06, -0.12, 0.35, 0.12, P.foliageDark, 5);
  return done(g);
}

// ─── hay bale ──────────────────────────────────────────────────────────────

export function createHayBale() {
  const g = root('prop.hay_bale', GEN);
  const body = cyl(g, 'bale', 0.35, 0.35, 0.7, 0, 0.35, 0, P.hay, 10);
  body.rotation.z = Math.PI / 2;
  // twine bands
  for (const x of [-0.18, 0.18]) {
    const band = cyl(g, 'twine', 0.36, 0.36, 0.04, x, 0.35, 0, P.hayDark, 10);
    band.rotation.z = Math.PI / 2;
  }
  // second bale lean
  const b2 = cyl(g, 'bale2', 0.32, 0.32, 0.65, 0.15, 0.85, 0.1, P.hay, 10);
  b2.rotation.z = Math.PI / 2;
  b2.rotation.y = 0.4;
  const band2 = cyl(g, 'twine2', 0.33, 0.33, 0.035, 0.15, 0.85, 0.1, P.hayDark, 10);
  band2.rotation.z = Math.PI / 2;
  band2.rotation.y = 0.4;
  // ground plank under stack
  box(g, 'plank', 0.9, 0.05, 0.55, 0.05, 0.025, 0.05, P.timberDark);
  // loose straw tuft
  sphere(g, 'straw', 0.08, -0.25, 0.55, 0.2, P.hayDark, 5);
  return done(g);
}

// ─── sack pile ─────────────────────────────────────────────────────────────

export function createSackPile() {
  const g = root('prop.sack_pile', GEN);
  const places = [
    [0, 0.2, 0, 0.22, 0.4],
    [0.35, 0.18, 0.1, 0.2, 0.36],
    [-0.3, 0.18, 0.08, 0.2, 0.36],
    [0.1, 0.45, 0.05, 0.18, 0.32],
  ];
  places.forEach(([x, y, z, r, h], i) => {
    cyl(g, `sack.${i}`, r * 0.9, r, h, x, y, z, i % 2 ? P.sack : P.paperTan, 8);
    // tied top
    sphere(g, `tie.${i}`, r * 0.35, x, y + h * 0.5, z, P.rope, 5);
  });
  return done(g);
}

// ─── direction signpost ────────────────────────────────────────────────────

export function createSignpost() {
  const g = root('prop.signpost', GEN);
  cyl(g, 'post', 0.06, 0.08, 2.4, 0, 1.2, 0, P.timberDark, 7);
  box(g, 'base', 0.25, 0.12, 0.25, 0, 0.06, 0, P.stone);
  // finger boards
  const boards = [
    { y: 2.1, yaw: 0.2, label: P.guildGreen, len: 0.85 },
    { y: 1.85, yaw: -1.1, label: P.clay, len: 0.75 },
    { y: 1.6, yaw: 2.2, label: 0x5a6a90, len: 0.7 },
  ];
  boards.forEach((b, i) => {
    const board = box(g, `board.${i}`, b.len, 0.14, 0.05, b.len * 0.35, b.y, 0, P.plank);
    board.rotation.y = b.yaw;
    const tip = box(g, `tip.${i}`, 0.12, 0.14, 0.05, b.len * 0.7, b.y, 0, b.label);
    tip.rotation.y = b.yaw;
  });
  return done(g);
}

// ─── flower planter ────────────────────────────────────────────────────────

export function createPlanter() {
  const g = root('prop.planter', GEN);
  box(g, 'box', 0.7, 0.35, 0.45, 0, 0.2, 0, P.timber);
  box(g, 'rim', 0.74, 0.05, 0.49, 0, 0.38, 0, P.timberDark);
  box(g, 'soil', 0.62, 0.08, 0.38, 0, 0.36, 0, P.dirt);
  // foliage blobs
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const x = Math.cos(a) * 0.15;
    const z = Math.sin(a) * 0.1;
    sphere(g, `leaf.${i}`, 0.1 + hash01(i) * 0.04, x, 0.5, z, i % 2 ? P.foliage : P.foliageDark, 5);
  }
  sphere(g, 'flower', 0.06, 0.05, 0.58, 0.02, 0xe06080, 5);
  sphere(g, 'flower2', 0.05, -0.1, 0.55, -0.05, 0xf0c040, 5);
  return done(g);
}

// ─── anvil prop (smithy porch) ──────────────────────────────────────────────

export function createAnvilProp() {
  const g = root('prop.anvil', GEN);
  box(g, 'block', 0.55, 0.25, 0.35, 0, 0.45, 0, P.iron);
  box(g, 'horn', 0.35, 0.12, 0.12, 0.35, 0.52, 0, P.ironLight);
  box(g, 'heel', 0.15, 0.14, 0.2, -0.3, 0.5, 0, P.iron);
  box(g, 'stand', 0.35, 0.35, 0.28, 0, 0.18, 0, P.timberDark);
  // hammer on side
  box(g, 'hammer.head', 0.18, 0.1, 0.1, 0.4, 0.65, 0.2, P.iron);
  box(g, 'hammer.haft', 0.05, 0.35, 0.05, 0.4, 0.48, 0.2, P.timber);
  return done(g);
}

// ─── crystal crate (magic shop porch) ──────────────────────────────────────

export function createCrystalCrate() {
  const g = root('prop.crystal_crate', GEN);
  addCrate(g, 'box', 0, 0, 0, 0.5, 0.4, 0.48, 0);
  const crystal = makeGlow(0x88e0ff, 0x40c0ff, 0.7);
  sphere(g, 'orb', 0.12, 0, 0.55, 0, crystal, 10);
  // small bottles
  for (const [x, z, c] of [
    [-0.12, 0.1, 0xe040d0],
    [0.12, 0.08, 0x40e8a0],
    [0.0, -0.12, 0xf0a030],
  ]) {
    cyl(g, 'bottle', 0.04, 0.05, 0.14, x, 0.5, z, makeGlow(c, c, 0.5), 6);
  }
  return done(g);
}
