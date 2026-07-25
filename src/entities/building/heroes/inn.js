/**
 * Inn — solid 3D matching ref_main.png
 * timber + cream plaster, red clay roof, glowing tavern bay, mug sign,
 * barrel + flower box. Sole @ y=0, facade +Z.
 */
import * as THREE from 'three';
import { box, glowBox, barrel, finishProp, makeToon } from '../toon.js';

function roofSlabs(g, w, d, y, color, rise) {
  const mat = makeToon(color);
  const L = new THREE.Mesh(new THREE.BoxGeometry(w * 1.22, 0.2, d * 0.78), mat);
  L.position.set(0, y + rise * 0.4, -d * 0.2);
  L.rotation.x = 0.58;
  g.add(L);
  const R = new THREE.Mesh(new THREE.BoxGeometry(w * 1.22, 0.2, d * 0.78), mat);
  R.position.set(0, y + rise * 0.4, d * 0.2);
  R.rotation.x = -0.58;
  g.add(R);
  box(g, w * 1.24, 0.16, 0.22, 0, y + rise * 0.85, 0, color);
}

export function createInnHero() {
  const g = new THREE.Group();
  g.name = 'hero.inn';

  const WALL = 0xf4ebda;
  const WOOD = 0x8a5a34;
  const WOOD_D = 0x4a2e18;
  const ROOF = 0xc43c2c;
  const STONE = 0xa89888;
  const ACCENT = 0x7a1828;
  const GLOW = 0xffe8b0;

  const w = 6.8;
  const d = 5.6;
  const h = 7.2;
  const base = 0.45;

  box(g, w + 0.4, base, d + 0.4, 0, base / 2, 0, STONE);
  box(g, w, h, d, 0, base + h / 2, 0, WALL);

  // Half-timber
  const fz = d / 2 + 0.06;
  for (const x of [-w * 0.45, -w * 0.15, w * 0.15, w * 0.45]) {
    box(g, 0.3, h * 0.96, 0.16, x, base + h / 2, fz, WOOD);
  }
  for (const y of [0.08, 0.48, 0.92]) {
    box(g, w * 1.0, 0.24, 0.14, 0, base + h * y, fz, WOOD);
  }
  for (const side of [-1, 1]) {
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.18, h * 0.36, 0.12), makeToon(WOOD));
    diag.position.set(side * w * 0.28, base + h * 0.72, fz + 0.02);
    diag.rotation.z = side * 0.5;
    g.add(diag);
  }

  roofSlabs(g, w, d, base + h, ROOF, 2.0);
  // front gable
  box(g, w * 0.7, 1.6, 0.3, 0, base + h + 0.7, d * 0.4, WALL);
  box(g, 0.22, 1.5, 0.12, 0, base + h + 0.75, d * 0.42, WOOD);
  const gL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, 0.18, 0.35), makeToon(ROOF));
  gL.position.set(-w * 0.15, base + h + 1.4, d * 0.4);
  gL.rotation.z = 0.55;
  g.add(gL);
  const gR = gL.clone();
  gR.position.x = w * 0.15;
  gR.rotation.z = -0.55;
  g.add(gR);

  // Chimney
  box(g, 0.9, 2.6, 0.9, w * 0.28, base + h + 1.6, -d * 0.12, STONE);
  box(g, 0.55, 0.5, 0.55, w * 0.28, base + h + 3.1, -d * 0.12, 0x5a5048);

  // Tavern bay — strong warm light
  box(g, w * 0.58, h * 0.4, 0.65, w * 0.1, base + h * 0.3, d / 2 + 0.32, WOOD);
  glowBox(g, w * 0.5, h * 0.34, 0.14, w * 0.1, base + h * 0.3, d / 2 + 0.62, GLOW, 0xffa830, 1.15);
  box(g, 0.06, h * 0.32, 0.05, w * 0.1, base + h * 0.3, d / 2 + 0.7, WOOD_D);
  box(g, w * 0.45, 0.06, 0.05, w * 0.1, base + h * 0.3, d / 2 + 0.7, WOOD_D);
  box(g, w * 0.45, 0.06, 0.05, w * 0.1, base + h * 0.2, d / 2 + 0.7, WOOD_D);
  box(g, w * 0.45, 0.06, 0.05, w * 0.1, base + h * 0.4, d / 2 + 0.7, WOOD_D);
  box(g, w * 0.62, 0.22, 0.75, w * 0.1, base + h * 0.5, d / 2 + 0.35, WOOD);

  // Door
  box(g, 1.2, 2.6, 0.14, -w * 0.28, base + 1.4, d / 2 + 0.08, WOOD_D);
  box(g, 0.38, 0.55, 0.05, -w * 0.28, base + 1.95, d / 2 + 0.14, 0xa8c8d8);
  box(g, 1.7, 0.14, 0.75, -w * 0.28, 0.12, d / 2 + 0.55, STONE);

  // Upper windows
  for (const x of [-w * 0.28, 0.05, w * 0.32]) {
    box(g, 1.0, 1.1, 0.1, x, base + h * 0.72, fz + 0.04, WOOD);
    glowBox(g, 0.82, 0.9, 0.06, x, base + h * 0.72, fz + 0.1, 0xc8e0f0, 0xffe0a8, 0.6);
    box(g, 0.05, 0.8, 0.04, x, base + h * 0.72, fz + 0.12, WOOD_D);
    box(g, 0.75, 0.05, 0.04, x, base + h * 0.72, fz + 0.12, WOOD_D);
    box(g, 0.24, 0.95, 0.08, x - 0.55, base + h * 0.72, fz + 0.06, WOOD);
    box(g, 0.24, 0.95, 0.08, x + 0.55, base + h * 0.72, fz + 0.06, WOOD);
  }

  // Mug sign
  const signX = -w * 0.08;
  const signY = base + h * 0.7;
  const signZ = d / 2 + 1.4;
  box(g, 0.14, 0.14, 1.7, signX, signY + 0.95, signZ - 0.35, 0x2a2828);
  box(g, 0.12, 1.1, 0.12, signX, signY + 0.4, signZ + 0.55, 0x2a2828);
  box(g, 2.3, 1.8, 0.18, signX, signY, signZ + 0.7, WOOD_D);
  box(g, 2.05, 1.55, 0.14, signX, signY, signZ + 0.84, ACCENT);
  box(g, 0.75, 0.8, 0.1, signX - 0.12, signY, signZ + 0.96, 0x120c0c);
  box(g, 0.24, 0.45, 0.08, signX + 0.42, signY, signZ + 0.96, 0x120c0c);
  box(g, 0.8, 0.14, 0.08, signX - 0.12, signY + 0.38, signZ + 0.96, 0x120c0c);

  // Flower box + barrel
  box(g, 1.05, 0.3, 0.42, -0.05, base + 1.05, d / 2 + 0.55, WOOD);
  box(g, 0.95, 0.22, 0.32, -0.05, base + 1.3, d / 2 + 0.55, 0x3a9a55);
  box(g, 0.22, 0.28, 0.16, -0.2, base + 1.45, d / 2 + 0.55, 0xd94a3d);
  box(g, 0.2, 0.24, 0.14, 0.1, base + 1.45, d / 2 + 0.55, 0x8a5ab0);
  barrel(g, -w * 0.48, 0, d / 2 + 1.2, 1.05);

  // Side windows
  for (const z of [-d * 0.18, d * 0.12]) {
    box(g, 0.1, 0.95, 0.9, -w / 2 - 0.04, base + h * 0.7, z, WOOD);
    glowBox(g, 0.06, 0.8, 0.75, -w / 2 - 0.1, base + h * 0.7, z, GLOW, 0xffd080, 0.45);
  }

  return finishProp(g);
}
