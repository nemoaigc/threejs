/**
 * Hero: Adventurers Guild — matches docs/references/heroes/adventurers_guild/ref_main.png
 * Identity: stone base + half-timber upper, red tile multi-gable roof, huge green
 * crossed-swords sign, quest board, barrels. Sole @ y=0, facade +Z.
 */
import * as THREE from 'three';
import {
  box, glowBox, gableRoof, frontGable, barrel, crate, finishProp, makeToon,
} from '../toon.js';

export function createAdventurersGuildHero() {
  const g = new THREE.Group();
  g.name = 'hero.adventurers_guild';

  const WOOD = 0x7a4a28;
  const WOOD_DARK = 0x4a2e18;
  const PLASTER = 0xf4e8d4;
  const STONE = 0xb8b0a0;
  const STONE_DARK = 0x9a9288;
  const ROOF = 0xc24a38;
  const GREEN = 0x2a4a30;
  const GOLD = 0xd4b060;

  // Footprint ~10×8, height L (~11m) — reads as hall, not cottage
  const w = 10.2;
  const d = 7.6;
  const stoneH = 3.6;
  const timberH = 4.8;
  const baseY = 0.35;

  // Plinth
  box(g, w + 0.9, baseY, d + 0.7, 0, baseY / 2, 0, STONE_DARK);

  // —— Stone ground storey ——
  box(g, w, stoneH, d, 0, baseY + stoneH / 2, 0, STONE);
  // stone courses hint
  for (let i = 0; i < 3; i++) {
    box(g, w * 1.01, 0.08, 0.06, 0, baseY + 0.9 + i * 1.0, d / 2 + 0.02, STONE_DARK);
  }
  // corner buttresses
  for (const sx of [-w * 0.48, w * 0.48]) {
    for (const sz of [-d * 0.45, d * 0.45]) {
      box(g, 0.55, stoneH * 0.95, 0.55, sx, baseY + stoneH * 0.48, sz, STONE_DARK);
    }
  }

  // —— Timber / plaster upper ——
  const upY = baseY + stoneH;
  box(g, w * 0.98, timberH, d * 0.96, 0, upY + timberH / 2, 0, PLASTER);
  // half-timber X braces + posts (bold, outline-readable)
  const faceZ = d * 0.48 + 0.04;
  for (const sx of [-w * 0.42, -w * 0.14, w * 0.14, w * 0.42]) {
    box(g, 0.28, timberH * 0.95, 0.16, sx, upY + timberH / 2, faceZ, WOOD);
  }
  box(g, w * 0.98, 0.28, 0.16, 0, upY + 0.12, faceZ, WOOD);
  box(g, w * 0.98, 0.28, 0.16, 0, upY + timberH * 0.5, faceZ, WOOD);
  box(g, w * 0.98, 0.22, 0.14, 0, upY + timberH * 0.92, faceZ, WOOD);
  // X diagonals
  for (const side of [-1, 1]) {
    const cx = side * w * 0.28;
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.18, timberH * 0.42, 0.12), makeToon(WOOD));
    diag.position.set(cx, upY + timberH * 0.28, faceZ + 0.02);
    diag.rotation.z = side * 0.55;
    g.add(diag);
    const diag2 = diag.clone();
    diag2.rotation.z = -side * 0.55;
    diag2.position.y = upY + timberH * 0.72;
    g.add(diag2);
  }

  // Upper windows (cool glass)
  for (const x of [-w * 0.28, w * 0.28]) {
    box(g, 1.15, 1.35, 0.08, x, upY + timberH * 0.55, faceZ + 0.06, WOOD_DARK);
    glowBox(g, 0.95, 1.1, 0.06, x, upY + timberH * 0.55, faceZ + 0.1, 0xa8c8b0, 0xffe8c0, 0.28);
    box(g, 0.06, 1.0, 0.04, x, upY + timberH * 0.55, faceZ + 0.12, WOOD);
    box(g, 0.9, 0.06, 0.04, x, upY + timberH * 0.55, faceZ + 0.12, WOOD);
  }

  // Roof
  const roofY = upY + timberH;
  gableRoof(g, w, d, roofY, ROOF, 2.4);
  // Front gable peaks (ref has multiple gables)
  frontGable(g, w * 0.55, 2.2, 0.35, roofY + 0.05, d * 0.42, PLASTER);
  box(g, 0.22, 2.0, 0.12, 0, roofY + 1.0, d * 0.42 + 0.2, WOOD);
  // side dormer hint
  frontGable(g, w * 0.28, 1.2, 0.28, roofY + 0.15, -d * 0.1, PLASTER);

  // Chimney
  box(g, 0.9, 2.2, 0.9, -w * 0.25, roofY + 2.4, -d * 0.15, STONE);
  box(g, 1.05, 0.25, 1.05, -w * 0.25, roofY + 3.55, -d * 0.15, STONE_DARK);

  // —— Portico ——
  const pz = d / 2 + 1.55;
  box(g, 6.8, 0.32, 2.6, 0, baseY + 3.4, pz, WOOD);
  box(g, 7.0, 0.12, 2.8, 0, baseY + 3.6, pz, WOOD_DARK);
  for (const x of [-2.3, 0, 2.3]) {
    box(g, 0.38, 3.2, 0.38, x, baseY + 1.6, pz + 0.9, WOOD_DARK);
    box(g, 0.5, 0.18, 0.5, x, baseY + 0.12, pz + 0.9, WOOD_DARK);
  }

  // Steps + double door
  box(g, 5.4, 0.18, 1.4, 0, 0.12, d / 2 + 0.75, STONE);
  box(g, 4.8, 0.16, 0.95, 0, 0.28, d / 2 + 0.5, STONE);
  // doors
  for (const x of [-0.7, 0.7]) {
    box(g, 1.2, 2.85, 0.12, x, baseY + 1.5, d / 2 + 0.06, WOOD_DARK);
    glowBox(g, 0.45, 0.7, 0.05, x, baseY + 2.2, d / 2 + 0.14, 0x88a878, 0xffe0a0, 0.25);
  }
  // door arch beam
  box(g, 2.8, 0.28, 0.18, 0, baseY + 3.05, d / 2 + 0.1, WOOD);

  // —— HUGE hanging guild sign (identity #1) — oversized for distance read ——
  const signZ = d / 2 + 2.4;
  const signY = baseY + stoneH + timberH * 0.62;
  box(g, 0.2, 1.8, 0.2, 0, baseY + stoneH + 1.4, signZ - 0.2, WOOD_DARK);
  box(g, 0.22, 0.22, 2.6, 0, signY + 1.1, signZ - 0.5, WOOD);
  // board — larger than building windows so camera can't miss it
  box(g, 5.2, 2.8, 0.22, 0, signY, signZ + 0.4, WOOD_DARK);
  box(g, 4.7, 2.4, 0.18, 0, signY, signZ + 0.55, GREEN);
  // gold crossed swords
  const swordA = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 0.12), makeToon(GOLD));
  swordA.position.set(0, signY, signZ + 0.68);
  swordA.rotation.z = 0.7;
  g.add(swordA);
  const swordB = swordA.clone();
  swordB.rotation.z = -0.7;
  g.add(swordB);
  box(g, 0.7, 0.24, 0.12, -0.75, signY + 0.75, signZ + 0.68, GOLD);
  box(g, 0.7, 0.24, 0.12, 0.75, signY - 0.75, signZ + 0.68, GOLD);

  // —— Quest board (identity #2) ——
  const qbX = w * 0.38;
  const qbZ = d / 2 + 2.35;
  box(g, 0.12, 2.0, 0.12, qbX - 0.7, 1.1, qbZ, WOOD);
  box(g, 0.12, 2.0, 0.12, qbX + 0.7, 1.1, qbZ, WOOD);
  box(g, 1.7, 1.35, 0.1, qbX, 1.45, qbZ, WOOD_DARK);
  // papers
  box(g, 0.4, 0.45, 0.04, qbX - 0.4, 1.55, qbZ + 0.06, 0xf5ecd8);
  box(g, 0.38, 0.4, 0.04, qbX + 0.15, 1.35, qbZ + 0.06, 0xe8dcc0);
  box(g, 0.42, 0.35, 0.04, qbX + 0.35, 1.65, qbZ + 0.06, 0xf0e4c8);
  box(g, 0.35, 0.4, 0.04, qbX - 0.15, 1.2, qbZ + 0.06, 0xd8c8a8);

  // Yard clutter
  barrel(g, -w * 0.42, 0, d / 2 + 2.5, 1.15);
  barrel(g, -w * 0.28, 0, d / 2 + 2.7, 0.95);
  crate(g, w * 0.45, 0, d / 2 + 2.5, 0.65, 0.5, 0.55);
  crate(g, w * 0.55, 0, d / 2 + 2.2, 0.5, 0.4, 0.45);

  // Burgundy banners
  for (const sx of [-w * 0.38, w * 0.38]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 4.8, 6),
      makeToon(WOOD),
    );
    pole.position.set(sx, roofY + 2.2, d * 0.05);
    g.add(pole);
    box(g, 1.2, 1.6, 0.06, sx + 0.55, roofY + 3.4, d * 0.05, 0x6a2030);
  }

  return finishProp(g);
}
