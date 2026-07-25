/**
 * Adventurers Guild — solid meshes, solidGableRoof (no dual-slab roofs).
 * Ref: public/content/buildings/adventurers_guild/ref_main.png
 */
import * as THREE from 'three';
import {
  box, glowBox, barrel, crate, finishProp, makeToon, solidGableRoof,
} from '../toon.js';

export function createAdventurersGuildHero() {
  const g = new THREE.Group();
  g.name = 'hero.adventurers_guild';

  const WOOD = 0x6e4424;
  const WOOD_D = 0x3d2614;
  const PLASTER = 0xf3e6d0;
  const STONE = 0xb4aca0;
  const STONE_D = 0x8e8680;
  const ROOF = 0xb83a2c;
  const GREEN = 0x1e4a28;
  const GOLD = 0xe0b84a;

  const w = 11;
  const d = 8;
  const stoneH = 3.4;
  const upH = 4.6;
  const base = 0.4;

  box(g, w + 1, base, d + 0.8, 0, base / 2, 0, STONE_D);
  box(g, w, stoneH, d, 0, base + stoneH / 2, 0, STONE);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(g, 0.55, stoneH, 0.55, sx * w * 0.47, base + stoneH / 2, sz * d * 0.45, STONE_D);
    }
  }

  const uy = base + stoneH;
  box(g, w * 0.98, upH, d * 0.96, 0, uy + upH / 2, 0, PLASTER);
  const fz = d * 0.48 + 0.04;
  for (const x of [-w * 0.4, -w * 0.13, w * 0.13, w * 0.4]) {
    box(g, 0.3, upH * 0.96, 0.16, x, uy + upH / 2, fz, WOOD);
  }
  for (const t of [0.12, 0.5, 0.9]) {
    box(g, w * 0.98, 0.24, 0.14, 0, uy + upH * t, fz, WOOD);
  }
  for (const side of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.18, upH * 0.38, 0.12), makeToon(WOOD));
    a.position.set(side * w * 0.26, uy + upH * 0.3, fz + 0.02);
    a.rotation.z = side * 0.55;
    g.add(a);
    const b = a.clone();
    b.rotation.z = -side * 0.55;
    b.position.y = uy + upH * 0.72;
    g.add(b);
  }

  for (const x of [-w * 0.26, w * 0.26]) {
    box(g, 1.15, 1.35, 0.08, x, uy + upH * 0.55, fz + 0.05, WOOD_D);
    glowBox(g, 0.95, 1.1, 0.05, x, uy + upH * 0.55, fz + 0.1, 0x9ec8a8, 0xffe8c0, 0.35);
  }

  const ry = uy + upH;
  solidGableRoof(g, w, d, ry, ROOF, 2.6, 0.4);
  // small dormer roof on front
  solidGableRoof(g, w * 0.4, d * 0.35, ry + 0.15, ROOF, 1.3, 0.15);
  box(g, w * 0.38, 1.1, 0.25, 0, ry + 0.55, d * 0.35, PLASTER);

  box(g, 0.95, 2.3, 0.95, -w * 0.22, ry + 2.1, -d * 0.15, STONE);
  box(g, 1.1, 0.25, 1.1, -w * 0.22, ry + 3.35, -d * 0.15, STONE_D);

  const pz = d / 2 + 1.65;
  box(g, 6.8, 0.32, 2.6, 0, base + 3.3, pz, WOOD);
  solidGableRoof(g, 6.6, 2.5, base + 3.5, ROOF, 1.0, 0.15);
  for (const x of [-2.3, 0, 2.3]) {
    box(g, 0.38, 3.1, 0.38, x, base + 1.5, pz + 0.95, WOOD_D);
  }

  box(g, 5.5, 0.16, 1.4, 0, 0.12, d / 2 + 0.75, STONE);
  box(g, 4.9, 0.14, 0.95, 0, 0.28, d / 2 + 0.48, STONE);
  for (const x of [-0.72, 0.72]) {
    box(g, 1.25, 2.85, 0.12, x, base + 1.5, d / 2 + 0.06, WOOD_D);
    glowBox(g, 0.48, 0.7, 0.05, x, base + 2.2, d / 2 + 0.14, 0x88a878, 0xffe0a0, 0.3);
  }

  // Sign
  const sz = d / 2 + 2.45;
  const sy = uy + upH * 0.52;
  box(g, 0.2, 0.2, 2.6, 0, sy + 1.15, sz - 0.5, WOOD);
  box(g, 5.2, 2.7, 0.2, 0, sy, sz + 0.3, WOOD_D);
  box(g, 4.7, 2.35, 0.16, 0, sy, sz + 0.42, GREEN);
  const sA = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 0.1), makeToon(GOLD));
  sA.position.set(0, sy, sz + 0.55);
  sA.rotation.z = 0.7;
  g.add(sA);
  const sB = sA.clone();
  sB.rotation.z = -0.7;
  g.add(sB);

  const qx = w * 0.38;
  const qz = d / 2 + 2.45;
  box(g, 0.12, 2.0, 0.12, qx - 0.7, 1.1, qz, WOOD);
  box(g, 0.12, 2.0, 0.12, qx + 0.7, 1.1, qz, WOOD);
  box(g, 1.7, 1.3, 0.1, qx, 1.45, qz, WOOD_D);
  box(g, 0.42, 0.48, 0.04, qx - 0.35, 1.55, qz + 0.06, 0xf5ecd8);
  box(g, 0.38, 0.42, 0.04, qx + 0.25, 1.3, qz + 0.06, 0xe8dcc0);

  barrel(g, -w * 0.4, 0, d / 2 + 2.5, 1.1);
  barrel(g, -w * 0.26, 0, d / 2 + 2.7, 0.9);
  crate(g, w * 0.45, 0, d / 2 + 2.45, 0.65, 0.5, 0.55);

  return finishProp(g);
}
