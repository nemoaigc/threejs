/**
 * Inn — solid meshes + solidGableRoof.
 * Ref: public/content/buildings/inn/ref_main.png
 */
import * as THREE from 'three';
import {
  box, glowBox, barrel, finishProp, makeToon, solidGableRoof,
} from '../toon.js';

export function createInnHero() {
  const g = new THREE.Group();
  g.name = 'hero.inn';

  const WALL = 0xf4ebda;
  const WOOD = 0x8a5a34;
  const WOOD_D = 0x4a2e18;
  const ROOF = 0xb83a2c;
  const STONE = 0xa89888;
  const ACCENT = 0x7a1828;
  const GLOW = 0xffe8b0;

  const w = 6.8;
  const d = 5.6;
  const h = 7.2;
  const base = 0.45;

  box(g, w + 0.4, base, d + 0.4, 0, base / 2, 0, STONE);
  box(g, w, h, d, 0, base + h / 2, 0, WALL);

  const fz = d / 2 + 0.05;
  for (const x of [-w * 0.45, -w * 0.15, w * 0.15, w * 0.45]) {
    box(g, 0.28, h * 0.96, 0.14, x, base + h / 2, fz, WOOD);
  }
  for (const t of [0.08, 0.48, 0.92]) {
    box(g, w * 1.0, 0.22, 0.12, 0, base + h * t, fz, WOOD);
  }
  for (const side of [-1, 1]) {
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.16, h * 0.34, 0.1), makeToon(WOOD));
    diag.position.set(side * w * 0.28, base + h * 0.72, fz + 0.02);
    diag.rotation.z = side * 0.5;
    g.add(diag);
  }

  solidGableRoof(g, w, d, base + h, ROOF, 2.2, 0.38);
  // front porch roof
  solidGableRoof(g, w * 0.55, 1.4, base + h * 0.48, ROOF, 0.9, 0.1);

  box(g, 0.9, 2.5, 0.9, w * 0.28, base + h + 1.55, -d * 0.12, STONE);
  box(g, 0.55, 0.45, 0.55, w * 0.28, base + h + 2.95, -d * 0.12, 0x5a5048);

  box(g, w * 0.55, h * 0.38, 0.6, w * 0.1, base + h * 0.3, d / 2 + 0.3, WOOD);
  glowBox(g, w * 0.48, h * 0.32, 0.12, w * 0.1, base + h * 0.3, d / 2 + 0.58, GLOW, 0xffa830, 1.1);
  box(g, 0.06, h * 0.3, 0.04, w * 0.1, base + h * 0.3, d / 2 + 0.66, WOOD_D);
  box(g, w * 0.42, 0.05, 0.04, w * 0.1, base + h * 0.3, d / 2 + 0.66, WOOD_D);

  box(g, 1.15, 2.55, 0.12, -w * 0.28, base + 1.35, d / 2 + 0.06, WOOD_D);
  box(g, 0.35, 0.5, 0.05, -w * 0.28, base + 1.9, d / 2 + 0.12, 0xa8c8d8);
  box(g, 1.6, 0.12, 0.7, -w * 0.28, 0.1, d / 2 + 0.5, STONE);

  for (const x of [-w * 0.28, 0.05, w * 0.32]) {
    box(g, 0.95, 1.05, 0.08, x, base + h * 0.72, fz + 0.04, WOOD);
    glowBox(g, 0.78, 0.85, 0.05, x, base + h * 0.72, fz + 0.1, 0xc8e0f0, 0xffe0a8, 0.55);
    box(g, 0.22, 0.9, 0.06, x - 0.52, base + h * 0.72, fz + 0.05, WOOD);
    box(g, 0.22, 0.9, 0.06, x + 0.52, base + h * 0.72, fz + 0.05, WOOD);
  }

  const signX = -w * 0.05;
  const signY = base + h * 0.68;
  const signZ = d / 2 + 1.35;
  box(g, 0.12, 0.12, 1.6, signX, signY + 0.9, signZ - 0.3, 0x2a2828);
  box(g, 0.1, 1.0, 0.1, signX, signY + 0.35, signZ + 0.5, 0x2a2828);
  box(g, 2.15, 1.65, 0.16, signX, signY, signZ + 0.65, WOOD_D);
  box(g, 1.9, 1.4, 0.12, signX, signY, signZ + 0.78, ACCENT);
  box(g, 0.7, 0.75, 0.08, signX - 0.1, signY, signZ + 0.9, 0x120c0c);
  box(g, 0.22, 0.4, 0.06, signX + 0.4, signY, signZ + 0.9, 0x120c0c);

  box(g, 1.0, 0.28, 0.4, -0.05, base + 1.0, d / 2 + 0.5, WOOD);
  box(g, 0.9, 0.2, 0.3, -0.05, base + 1.25, d / 2 + 0.5, 0x3a9a55);
  barrel(g, -w * 0.48, 0, d / 2 + 1.15, 1.0);

  return finishProp(g);
}
