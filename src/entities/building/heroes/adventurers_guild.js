/**
 * Adventurers Guild — solid 3D matching ref_main.png
 * stone base, half-timber upper, red multi-gable roof, green crossed-swords sign,
 * quest board, barrels. Sole @ y=0, facade +Z.
 */
import * as THREE from 'three';
import { box, glowBox, barrel, crate, finishProp, makeToon } from '../toon.js';

function roofSlabs(g, w, d, y, color, rise) {
  const mat = makeToon(color);
  const L = new THREE.Mesh(new THREE.BoxGeometry(w * 1.2, 0.2, d * 0.78), mat);
  L.position.set(0, y + rise * 0.4, -d * 0.2);
  L.rotation.x = 0.58;
  g.add(L);
  const R = new THREE.Mesh(new THREE.BoxGeometry(w * 1.2, 0.2, d * 0.78), mat);
  R.position.set(0, y + rise * 0.4, d * 0.2);
  R.rotation.x = -0.58;
  g.add(R);
  box(g, w * 1.22, 0.16, 0.22, 0, y + rise * 0.85, 0, color);
}

export function createAdventurersGuildHero() {
  const g = new THREE.Group();
  g.name = 'hero.adventurers_guild';

  const WOOD = 0x6e4424;
  const WOOD_D = 0x3d2614;
  const PLASTER = 0xf3e6d0;
  const STONE = 0xb4aca0;
  const STONE_D = 0x8e8680;
  const ROOF = 0xc43c2c;
  const GREEN = 0x1e4a28;
  const GOLD = 0xe0b84a;

  const w = 11;
  const d = 8;
  const stoneH = 3.4;
  const upH = 4.6;
  const base = 0.4;

  box(g, w + 1, base, d + 0.8, 0, base / 2, 0, STONE_D);

  // Stone storey
  box(g, w, stoneH, d, 0, base + stoneH / 2, 0, STONE);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(g, 0.6, stoneH, 0.6, sx * w * 0.48, base + stoneH / 2, sz * d * 0.46, STONE_D);
    }
  }
  // courses
  for (let i = 0; i < 4; i++) {
    box(g, w * 1.01, 0.07, 0.05, 0, base + 0.7 + i * 0.75, d / 2 + 0.02, STONE_D);
  }

  // Upper half-timber
  const uy = base + stoneH;
  box(g, w * 0.98, upH, d * 0.96, 0, uy + upH / 2, 0, PLASTER);
  const fz = d * 0.48 + 0.05;
  for (const x of [-w * 0.4, -w * 0.13, w * 0.13, w * 0.4]) {
    box(g, 0.32, upH * 0.96, 0.18, x, uy + upH / 2, fz, WOOD);
  }
  for (const y of [0.15, 0.5, 0.92]) {
    box(g, w * 0.98, 0.26, 0.16, 0, uy + upH * y, fz, WOOD);
  }
  // X braces
  for (const side of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, upH * 0.4, 0.12), makeToon(WOOD));
    a.position.set(side * w * 0.26, uy + upH * 0.3, fz + 0.02);
    a.rotation.z = side * 0.55;
    g.add(a);
    const b = a.clone();
    b.rotation.z = -side * 0.55;
    b.position.y = uy + upH * 0.72;
    g.add(b);
  }

  // Upper windows
  for (const x of [-w * 0.26, w * 0.26]) {
    box(g, 1.2, 1.4, 0.1, x, uy + upH * 0.55, fz + 0.06, WOOD_D);
    glowBox(g, 1.0, 1.15, 0.06, x, uy + upH * 0.55, fz + 0.12, 0x9ec8a8, 0xffe8c0, 0.35);
    box(g, 0.06, 1.05, 0.04, x, uy + upH * 0.55, fz + 0.14, WOOD);
    box(g, 0.95, 0.06, 0.04, x, uy + upH * 0.55, fz + 0.14, WOOD);
  }

  // Roof + front gable peak
  const ry = uy + upH;
  roofSlabs(g, w, d, ry, ROOF, 2.5);
  // triangular front gable wall
  const gw = w * 0.55;
  const gh = 2.4;
  box(g, gw, gh * 0.5, 0.35, 0, ry + gh * 0.25, d * 0.38, PLASTER);
  // peak slabs
  const peakL = new THREE.Mesh(new THREE.BoxGeometry(gw * 0.62, 0.18, 0.4), makeToon(ROOF));
  peakL.position.set(-gw * 0.18, ry + gh * 0.55, d * 0.38);
  peakL.rotation.z = 0.55;
  g.add(peakL);
  const peakR = peakL.clone();
  peakR.position.x = gw * 0.18;
  peakR.rotation.z = -0.55;
  g.add(peakR);
  box(g, 0.24, gh * 0.9, 0.14, 0, ry + gh * 0.4, d * 0.4, WOOD);

  // Chimney
  box(g, 1.0, 2.4, 1.0, -w * 0.22, ry + 2.2, -d * 0.18, STONE);
  box(g, 1.15, 0.28, 1.15, -w * 0.22, ry + 3.5, -d * 0.18, STONE_D);

  // Portico
  const pz = d / 2 + 1.7;
  box(g, 7.0, 0.35, 2.8, 0, base + 3.35, pz, WOOD);
  box(g, 7.2, 0.14, 3.0, 0, base + 3.58, pz, WOOD_D);
  for (const x of [-2.4, 0, 2.4]) {
    box(g, 0.4, 3.15, 0.4, x, base + 1.55, pz + 1.0, WOOD_D);
    box(g, 0.55, 0.2, 0.55, x, base + 0.12, pz + 1.0, WOOD_D);
  }

  // Steps + doors
  box(g, 5.6, 0.18, 1.5, 0, 0.12, d / 2 + 0.8, STONE);
  box(g, 5.0, 0.16, 1.0, 0, 0.28, d / 2 + 0.5, STONE);
  for (const x of [-0.75, 0.75]) {
    box(g, 1.3, 2.9, 0.14, x, base + 1.55, d / 2 + 0.08, WOOD_D);
    glowBox(g, 0.5, 0.75, 0.05, x, base + 2.25, d / 2 + 0.16, 0x88a878, 0xffe0a0, 0.3);
  }
  box(g, 3.0, 0.3, 0.2, 0, base + 3.15, d / 2 + 0.12, WOOD);

  // Giant green sign + crossed swords
  const sz = d / 2 + 2.5;
  const sy = uy + upH * 0.55;
  box(g, 0.22, 0.22, 2.8, 0, sy + 1.2, sz - 0.6, WOOD);
  box(g, 5.4, 2.9, 0.24, 0, sy, sz + 0.35, WOOD_D);
  box(g, 4.9, 2.5, 0.2, 0, sy, sz + 0.5, GREEN);
  const sA = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.34, 0.12), makeToon(GOLD));
  sA.position.set(0, sy, sz + 0.62);
  sA.rotation.z = 0.72;
  g.add(sA);
  const sB = sA.clone();
  sB.rotation.z = -0.72;
  g.add(sB);
  box(g, 0.75, 0.28, 0.12, -0.85, sy + 0.85, sz + 0.62, GOLD);
  box(g, 0.75, 0.28, 0.12, 0.85, sy - 0.85, sz + 0.62, GOLD);

  // Quest board
  const qx = w * 0.4;
  const qz = d / 2 + 2.5;
  box(g, 0.12, 2.1, 0.12, qx - 0.75, 1.15, qz, WOOD);
  box(g, 0.12, 2.1, 0.12, qx + 0.75, 1.15, qz, WOOD);
  box(g, 1.8, 1.4, 0.1, qx, 1.5, qz, WOOD_D);
  box(g, 0.45, 0.5, 0.04, qx - 0.4, 1.6, qz + 0.06, 0xf5ecd8);
  box(g, 0.4, 0.45, 0.04, qx + 0.2, 1.35, qz + 0.06, 0xe8dcc0);
  box(g, 0.42, 0.38, 0.04, qx + 0.35, 1.7, qz + 0.06, 0xf0e4c8);

  barrel(g, -w * 0.42, 0, d / 2 + 2.6, 1.15);
  barrel(g, -w * 0.28, 0, d / 2 + 2.85, 0.95);
  crate(g, w * 0.48, 0, d / 2 + 2.5, 0.7, 0.55, 0.6);

  // Banners
  for (const sx of [-w * 0.4, w * 0.4]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 5.0, 8), makeToon(WOOD));
    pole.position.set(sx, ry + 2.4, d * 0.05);
    g.add(pole);
    box(g, 1.25, 1.7, 0.08, sx + 0.55, ry + 3.6, d * 0.05, 0x6a1828);
  }

  return finishProp(g);
}
