/**
 * Adventurers Guild — reference-driven reconstruction
 * Source: public/content/buildings/adventurers_guild/ref_main.png
 *
 * Pass notes (img2threejs-style, agent-executed):
 *  blockout  → stone plinth + mass + solid gable roof
 *  structure → arcade columns, upper floor, side gable wall
 *  form      → half-timber lattice, door, chimney, beam arm
 *  material  → wood/plaster/stone/green sign/gold swords
 *  surface   → quest board papers, barrels, crates, lantern
 *
 * Sole @ y=0. Facade +Z (hero camera). Ridge along +X.
 * Version: gen-guild-v1
 */
import * as THREE from 'three';
import {
  box, glowBox, barrel, crate, finishProp, makeToon, makeGlow, solidGableRoof,
} from '../toon.js';

const WOOD = 0x6b4428;
const WOOD_MID = 0x7a5232;
const WOOD_D = 0x3a2414;
const PLASTER = 0xefe2cc;
const STONE = 0xb8b0a4;
const STONE_D = 0x8a8278;
const STONE_L = 0xc8c0b4;
const ROOF = 0xb43a2a;
const ROOF_D = 0x8a2a1e;
const GREEN = 0x1a4a28;
const GREEN_L = 0x2a5a38;
const GOLD = 0xe0b84a;
const GOLD_D = 0xb89230;

function post(g, r, h, x, y, z, color = WOOD) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.92, r, h, 10),
    makeToon(color),
  );
  m.position.set(x, y + h / 2, z);
  g.add(m);
  return m;
}

function beam(g, len, thick, x, y, z, rotY = 0, color = WOOD) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(len, thick, thick * 0.9),
    makeToon(color),
  );
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  g.add(m);
  return m;
}

/** Individual ashlar-ish course on a wall face (+Z). */
function stoneCourses(g, w, h, x0, y0, z, cols, rows) {
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.35);
    for (let c = 0; c < cols; c++) {
      const jitter = ((c * 17 + r * 31) % 5) * 0.01;
      const col = (c + r) % 3 === 0 ? STONE_D : (c + r) % 3 === 1 ? STONE : STONE_L;
      box(
        g,
        cw * 0.92,
        ch * 0.88,
        0.14,
        x0 - w / 2 + cw * (c + 0.5) + off * 0.3,
        y0 + ch * (r + 0.5),
        z + jitter,
        col,
      );
    }
  }
}

/** Half-timber panel on a face: plaster + posts + rails + X braces. */
function halfTimberFace(g, w, h, x, y, z, posts = 4) {
  // plaster back
  box(g, w, h, 0.2, x, y, z - 0.02, PLASTER);
  const step = w / (posts - 1);
  for (let i = 0; i < posts; i++) {
    const px = x - w / 2 + step * i;
    box(g, 0.22, h * 0.98, 0.18, px, y, z + 0.04, WOOD);
  }
  // horizontal rails
  for (const t of [0.08, 0.5, 0.92]) {
    box(g, w * 0.98, 0.18, 0.16, x, y - h / 2 + h * t, z + 0.05, WOOD_MID);
  }
  // X braces in each bay
  for (let i = 0; i < posts - 1; i++) {
    const cx = x - w / 2 + step * (i + 0.5);
    for (const band of [0.28, 0.72]) {
      const by = y - h / 2 + h * band;
      const a = new THREE.Mesh(new THREE.BoxGeometry(step * 0.85, 0.12, 0.1), makeToon(WOOD_D));
      a.position.set(cx, by, z + 0.07);
      a.rotation.z = 0.55;
      g.add(a);
      const b = a.clone();
      b.rotation.z = -0.55;
      g.add(b);
    }
  }
}

export function createAdventurersGuildHero() {
  const g = new THREE.Group();
  g.name = 'hero.adventurers_guild';
  g.userData.gen = 'gen-guild-v1';
  g.userData.ref = 'content/buildings/adventurers_guild/ref_main.png';

  // —— proportions from ref (metres) ——
  const W = 12.0; // left–right
  const D = 7.2; // front–back
  const baseH = 0.35;
  const stoneH = 3.55; // ground storey
  const timberH = 4.4; // upper storey
  const baseY = baseH;

  // Plinth
  box(g, W + 0.9, baseH, D + 0.7, 0, baseH / 2, 0, STONE_D);

  // ========== GROUND: stone mass ==========
  // Core stone volume
  box(g, W, stoneH, D, 0, baseY + stoneH / 2, 0, STONE);
  // Front stone detail courses
  stoneCourses(g, W * 0.98, stoneH * 0.95, 0, baseY, D / 2 + 0.02, 10, 6);
  // Side stone (-X) courses along Z
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const col = (c + r) % 3 === 0 ? STONE_D : STONE;
      box(
        g,
        0.14,
        (stoneH / 6) * 0.88,
        (D / 7) * 0.9,
        -W / 2 - 0.05,
        baseY + (stoneH / 6) * (r + 0.5),
        -D / 2 + (D / 7) * (c + 0.5),
        col,
      );
    }
  }

  // ========== ARCADE (front open bays) ==========
  // Carve sense of depth: dark inner wall + columns
  box(g, W * 0.92, stoneH * 0.88, 0.35, 0, baseY + stoneH * 0.48, D / 2 - 1.35, WOOD_D);
  // floor under arcade
  box(g, W * 0.95, 0.12, 1.5, 0, baseY + 0.08, D / 2 - 0.55, STONE_D);

  // 4 heavy timber columns (ref) with carved capitals / bases
  const colXs = [-W * 0.38, -W * 0.14, W * 0.1, W * 0.34];
  for (const cx of colXs) {
    // base plinth
    box(g, 0.72, 0.35, 0.72, cx, baseY + 0.2, D / 2 - 0.15, STONE_D);
    // shaft
    post(g, 0.28, stoneH * 0.78, cx, baseY + 0.35, D / 2 - 0.12, WOOD);
    // capital block
    box(g, 0.7, 0.28, 0.7, cx, baseY + stoneH * 0.88, D / 2 - 0.12, WOOD_MID);
    // knee brace to beam
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.14), makeToon(WOOD_D));
    brace.position.set(cx + 0.25, baseY + stoneH * 0.72, D / 2 - 0.1);
    brace.rotation.z = -0.7;
    g.add(brace);
    const brace2 = brace.clone();
    brace2.position.x = cx - 0.25;
    brace2.rotation.z = 0.7;
    g.add(brace2);
  }

  // Arcade beam / frieze
  box(g, W * 0.98, 0.45, 0.55, 0, baseY + stoneH * 0.95, D / 2 - 0.05, WOOD_D);
  box(g, W * 0.98, 0.2, 0.6, 0, baseY + stoneH * 1.05, D / 2 + 0.05, WOOD_MID);
  // carved squares on frieze
  for (let i = 0; i < 8; i++) {
    const fx = -W * 0.4 + (i / 7) * W * 0.8;
    box(g, 0.35, 0.28, 0.12, fx, baseY + stoneH * 0.95, D / 2 + 0.22, WOOD);
  }

  // Double door (center-right of arcade)
  const doorX = W * 0.08;
  box(g, 2.1, 2.7, 0.15, doorX, baseY + 1.45, D / 2 - 1.15, WOOD_D);
  // split
  box(g, 0.95, 2.55, 0.12, doorX - 0.5, baseY + 1.4, D / 2 - 1.05, 0x2a1a10);
  box(g, 0.95, 2.55, 0.12, doorX + 0.5, baseY + 1.4, D / 2 - 1.05, 0x2a1a10);
  // dark void sense
  box(g, 1.7, 2.3, 0.4, doorX, baseY + 1.4, D / 2 - 1.4, 0x0a0806);
  // lintel carving
  box(g, 2.4, 0.35, 0.25, doorX, baseY + 2.9, D / 2 - 1.05, WOOD_MID);

  // ========== UPPER FLOOR ==========
  const uy = baseY + stoneH;
  box(g, W * 0.98, timberH, D * 0.96, 0, uy + timberH / 2, 0, PLASTER);

  // Front half-timber
  halfTimberFace(g, W * 0.96, timberH * 0.95, 0, uy + timberH / 2, D / 2 + 0.02, 5);

  // Left gable end half-timber (-X)
  // plaster already from core; timber grid on -X
  {
    const zFace = 0;
    const px = -W / 2 - 0.02;
    for (const t of [0.15, 0.5, 0.85]) {
      box(g, 0.18, timberH * 0.95, D * 0.9, px, uy + timberH / 2, 0, WOOD);
      box(g, 0.16, 0.18, D * 0.92, px + 0.02, uy + timberH * t, 0, WOOD_MID);
    }
    for (let i = 0; i < 4; i++) {
      const zz = -D * 0.35 + i * (D * 0.23);
      box(g, 0.16, timberH * 0.92, 0.2, px + 0.02, uy + timberH / 2, zz, WOOD);
    }
    // X braces on side
    for (const band of [0.3, 0.7]) {
      for (const side of [-1, 1]) {
        const br = new THREE.Mesh(new THREE.BoxGeometry(0.12, timberH * 0.35, D * 0.22), makeToon(WOOD_D));
        br.position.set(px + 0.04, uy + timberH * band, side * D * 0.18);
        br.rotation.x = side * 0.5;
        g.add(br);
      }
    }
  }

  // Upper windows (front, between timber)
  for (const x of [-W * 0.28, W * 0.28]) {
    box(g, 1.05, 1.25, 0.08, x, uy + timberH * 0.55, D / 2 + 0.12, WOOD_D);
    glowBox(g, 0.88, 1.05, 0.05, x, uy + timberH * 0.55, D / 2 + 0.16, 0xa8c8b0, 0xffe8c0, 0.25);
    box(g, 0.05, 0.95, 0.04, x, uy + timberH * 0.55, D / 2 + 0.18, WOOD);
    box(g, 0.8, 0.05, 0.04, x, uy + timberH * 0.55, D / 2 + 0.18, WOOD);
  }

  // Jetty ledge between floors (ref has projecting timber line)
  box(g, W * 1.02, 0.22, 0.45, 0, uy + 0.05, D / 2 + 0.12, WOOD_D);

  // ========== ROOF (solid prism + secondary gables + tiles) ==========
  const ry = uy + timberH;
  const rise = 3.1;
  solidGableRoof(g, W, D, ry, ROOF, rise, 0.55);

  // tile ribs on front slope (detail, still solid mass underneath)
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    // front slope approx: z goes from +hd to 0 as y goes 0 to rise
    const yy = ry + rise * t * 0.92;
    const zz = D * 0.42 * (1 - t);
    box(g, W * 1.05, 0.06, 0.14, 0, yy, zz + 0.15, ROOF_D);
  }

  // Left secondary gable dormer (ref has multiple peaks)
  solidGableRoof(g, W * 0.42, D * 0.45, ry + 0.2, ROOF, 1.7, 0.2);
  box(g, W * 0.38, 1.4, 0.25, -W * 0.15, ry + 0.7, D * 0.25, PLASTER);
  // timber on dormer face
  box(g, 0.14, 1.3, 0.12, -W * 0.15, ry + 0.7, D * 0.38, WOOD);
  box(g, W * 0.34, 0.12, 0.12, -W * 0.15, ry + 0.35, D * 0.38, WOOD);

  // Right small gable
  solidGableRoof(g, W * 0.32, D * 0.4, ry + 0.15, ROOF, 1.4, 0.15);

  // Chimney (left of center on ridge)
  box(g, 0.95, 2.6, 0.95, -W * 0.12, ry + rise * 0.55 + 1.1, -D * 0.05, STONE);
  box(g, 1.1, 0.35, 1.1, -W * 0.12, ry + rise * 0.55 + 2.5, -D * 0.05, STONE_D);
  // chimney cap holes
  box(g, 0.25, 0.35, 0.25, -W * 0.12 - 0.25, ry + rise * 0.55 + 2.75, -D * 0.05, 0x2a2420);
  box(g, 0.25, 0.35, 0.25, -W * 0.12 + 0.25, ry + rise * 0.55 + 2.75, -D * 0.05, 0x2a2420);

  // ========== HANGING SIGN (identity) ==========
  const signZ = D / 2 + 1.85;
  const signY = uy + timberH * 0.55;
  // timber arm from wall
  beam(g, 3.2, 0.28, W * 0.12, signY + 1.35, D / 2 + 0.9, 0, WOOD_MID);
  // outer upright
  box(g, 0.28, 0.28, 0.9, W * 0.12 + 1.4, signY + 1.35, signZ - 0.15, WOOD);
  // chains
  for (const sx of [-1.1, 1.1]) {
    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6),
      makeToon(0x4a4538),
    );
    chain.position.set(W * 0.05 + sx * 0.15, signY + 0.85, signZ);
    g.add(chain);
  }
  // board
  box(g, 4.6, 2.85, 0.22, W * 0.05, signY, signZ, WOOD_D);
  box(g, 4.2, 2.5, 0.18, W * 0.05, signY, signZ + 0.12, GREEN);
  // gold frame
  box(g, 4.25, 0.1, 0.08, W * 0.05, signY + 1.2, signZ + 0.2, GOLD);
  box(g, 4.25, 0.1, 0.08, W * 0.05, signY - 1.2, signZ + 0.2, GOLD);
  box(g, 0.1, 2.45, 0.08, W * 0.05 - 2.05, signY, signZ + 0.2, GOLD);
  box(g, 0.1, 2.45, 0.08, W * 0.05 + 2.05, signY, signZ + 0.2, GOLD);
  // crossed swords
  const sx0 = W * 0.05;
  const sA = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 0.1), makeToon(GOLD));
  sA.position.set(sx0, signY, signZ + 0.28);
  sA.rotation.z = 0.72;
  g.add(sA);
  const sB = sA.clone();
  sB.rotation.z = -0.72;
  g.add(sB);
  // hilts
  box(g, 0.65, 0.22, 0.1, sx0 - 0.75, signY + 0.85, signZ + 0.28, GOLD_D);
  box(g, 0.65, 0.22, 0.1, sx0 + 0.75, signY - 0.85, signZ + 0.28, GOLD_D);
  // pommels
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), makeToon(GOLD));
  pom.position.set(sx0 - 1.05, signY + 1.05, signZ + 0.28);
  g.add(pom);
  const pom2 = pom.clone();
  pom2.position.set(sx0 + 1.05, signY - 1.05, signZ + 0.28);
  g.add(pom2);

  // ========== PROPS ==========
  // Quest board (left of door)
  const qx = -W * 0.22;
  const qz = D / 2 + 0.85;
  post(g, 0.08, 1.9, qx - 0.85, 0, qz, WOOD);
  post(g, 0.08, 1.9, qx + 0.85, 0, qz, WOOD);
  box(g, 1.9, 1.35, 0.12, qx, 1.45, qz, WOOD_D);
  // cork / board face
  box(g, 1.7, 1.15, 0.06, qx, 1.45, qz + 0.08, 0xc4a882);
  // papers
  const papers = [
    [-0.45, 0.25, 0.4, 0.48, 0xf5ecd8],
    [0.15, 0.15, 0.38, 0.42, 0xe8dcc0],
    [0.5, -0.2, 0.35, 0.4, 0xf0e4c8],
    [-0.2, -0.25, 0.42, 0.35, 0xd8c8a8],
    [0.35, 0.35, 0.3, 0.32, 0xfff8e8],
  ];
  for (const [px, py, pw, ph, col] of papers) {
    box(g, pw, ph, 0.04, qx + px, 1.45 + py, qz + 0.12, col);
  }
  // crate + scrolls under board
  crate(g, qx + 0.35, 0, qz + 0.35, 0.45, 0.35, 0.4);
  box(g, 0.12, 0.45, 0.12, qx - 0.2, 0.35, qz + 0.4, 0xe8d8b0);
  box(g, 0.12, 0.5, 0.12, qx - 0.05, 0.38, qz + 0.35, 0xf0e0c0);

  // Barrels right
  barrel(g, W * 0.42, 0, D / 2 + 0.9, 1.15);
  barrel(g, W * 0.52, 0, D / 2 + 1.15, 0.95);
  barrel(g, W * 0.48, 0, D / 2 + 1.55, 0.85);
  // lantern
  post(g, 0.05, 1.1, W * 0.58, 0, D / 2 + 1.0, WOOD_D);
  glowBox(g, 0.22, 0.28, 0.22, W * 0.58, 1.25, D / 2 + 1.0, 0xffe8a0, 0xffc060, 0.7);

  // Side entrance props on -X
  box(g, 0.15, 1.2, 0.8, -W / 2 - 0.1, baseY + 1.8, D * 0.15, WOOD_D);

  return finishProp(g);
}
