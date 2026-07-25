/**
 * Hero: Inn — matches docs/references/heroes/inn/ref_main.png
 * Identity: timber + cream plaster, red clay roof, glowing tavern bay windows,
 * hanging burgundy mug sign, barrel + flower box. Sole @ y=0, facade +Z.
 */
import * as THREE from 'three';
import { box, glowBox, gableRoof, frontGable, barrel, finishProp, makeToon, makeGlow } from '../toon.js';

export function createInnHero() {
  const g = new THREE.Group();
  g.name = 'hero.inn';

  const WALL = 0xf5ecda;
  const WOOD = 0x8b5e3c;
  const WOOD_DARK = 0x4a2e18;
  const ROOF = 0xc24a38;
  const STONE = 0xa89888;
  const ACCENT = 0x7a2030;
  const GLOW = 0xffe8b0;

  const w = 6.4;
  const d = 5.2;
  const h = 7.0;
  const baseY = 0.4;

  // Stone plinth
  box(g, w + 0.3, baseY, d + 0.3, 0, baseY / 2, 0, STONE);

  // Main body
  box(g, w, h, d, 0, baseY + h / 2, 0, WALL);

  // Timber frame (bold half-timber)
  const fz = d / 2 + 0.05;
  for (const sx of [-w * 0.45, -w * 0.15, w * 0.15, w * 0.45]) {
    box(g, 0.28, h * 0.95, 0.14, sx, baseY + h / 2, fz, WOOD);
  }
  box(g, w * 1.0, 0.24, 0.14, 0, baseY + h * 0.48, fz, WOOD);
  box(g, w * 1.0, 0.22, 0.14, 0, baseY + h * 0.08, fz, WOOD);
  box(g, w * 1.0, 0.2, 0.12, 0, baseY + h * 0.92, fz, WOOD);
  // diagonals upper
  for (const side of [-1, 1]) {
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.16, h * 0.35, 0.1), makeToon(WOOD));
    diag.position.set(side * w * 0.28, baseY + h * 0.72, fz + 0.02);
    diag.rotation.z = side * 0.5;
    g.add(diag);
  }

  // Roof
  gableRoof(g, w, d, baseY + h, ROOF, 1.9);
  frontGable(g, w * 0.72, 1.8, 0.32, baseY + h + 0.05, d * 0.42, WALL);
  box(g, 0.2, 1.6, 0.1, 0, baseY + h + 0.85, d * 0.42 + 0.18, WOOD);

  // Chimney (stone stack on right)
  box(g, 0.85, 2.4, 0.85, w * 0.28, baseY + h + 1.5, -d * 0.12, STONE);
  box(g, 0.55, 0.45, 0.55, w * 0.28, baseY + h + 2.9, -d * 0.12, 0x6a6058);

  // —— Ground tavern bay (identity: strong warm glow) ——
  box(g, w * 0.62, h * 0.42, 0.6, w * 0.08, baseY + h * 0.3, d / 2 + 0.3, WOOD);
  glowBox(g, w * 0.55, h * 0.36, 0.14, w * 0.08, baseY + h * 0.3, d / 2 + 0.6, GLOW, 0xffb040, 1.1);
  // diamond mullions
  box(g, 0.06, h * 0.3, 0.04, w * 0.12, baseY + h * 0.28, d / 2 + 0.62, WOOD_DARK);
  box(g, w * 0.42, 0.06, 0.04, w * 0.12, baseY + h * 0.28, d / 2 + 0.62, WOOD_DARK);
  box(g, w * 0.42, 0.06, 0.04, w * 0.12, baseY + h * 0.18, d / 2 + 0.62, WOOD_DARK);
  box(g, w * 0.42, 0.06, 0.04, w * 0.12, baseY + h * 0.38, d / 2 + 0.62, WOOD_DARK);
  // wood cornice over bay
  box(g, w * 0.58, 0.2, 0.7, w * 0.12, baseY + h * 0.48, d / 2 + 0.35, WOOD);

  // Door (left of bay)
  box(g, 1.15, 2.5, 0.12, -w * 0.28, baseY + 1.35, d / 2 + 0.06, WOOD_DARK);
  box(g, 0.35, 0.55, 0.05, -w * 0.28, baseY + 1.9, d / 2 + 0.12, 0xa8c8d8);
  // iron hinges hint
  box(g, 0.12, 0.12, 0.06, -w * 0.28 - 0.45, baseY + 1.8, d / 2 + 0.1, 0x3a3530);
  box(g, 0.12, 0.12, 0.06, -w * 0.28 - 0.45, baseY + 0.9, d / 2 + 0.1, 0x3a3530);

  // Upper guest windows (warm)
  for (const x of [-w * 0.28, 0.05, w * 0.32]) {
    box(g, 0.95, 1.05, 0.08, x, baseY + h * 0.72, fz + 0.04, WOOD);
    glowBox(g, 0.78, 0.85, 0.06, x, baseY + h * 0.72, fz + 0.1, 0xc8e0f0, 0xffe0a8, 0.55);
    box(g, 0.05, 0.75, 0.04, x, baseY + h * 0.72, fz + 0.12, WOOD_DARK);
    box(g, 0.7, 0.05, 0.04, x, baseY + h * 0.72, fz + 0.12, WOOD_DARK);
    // shutters
    box(g, 0.22, 0.9, 0.06, x - 0.52, baseY + h * 0.72, fz + 0.06, WOOD);
    box(g, 0.22, 0.9, 0.06, x + 0.52, baseY + h * 0.72, fz + 0.06, WOOD);
  }

  // —— Hanging mug sign (identity) — large enough to read from plaza ——
  const signZ = d / 2 + 1.35;
  const signX = -w * 0.05;
  const signY = baseY + h * 0.72;
  box(g, 0.14, 0.14, 1.6, signX, signY + 0.9, signZ - 0.3, 0x3a3530);
  box(g, 0.12, 1.0, 0.12, signX, signY + 0.4, signZ + 0.5, 0x3a3530);
  box(g, 2.2, 1.7, 0.16, signX, signY, signZ + 0.65, WOOD_DARK);
  box(g, 1.95, 1.45, 0.14, signX, signY, signZ + 0.78, ACCENT);
  // mug silhouette
  box(g, 0.7, 0.75, 0.1, signX - 0.1, signY, signZ + 0.9, 0x1a1010);
  box(g, 0.22, 0.42, 0.08, signX + 0.4, signY, signZ + 0.9, 0x1a1010);
  box(g, 0.75, 0.14, 0.08, signX - 0.1, signY + 0.35, signZ + 0.9, 0x1a1010);

  // Flower box
  box(g, 1.0, 0.28, 0.4, -w * 0.05, baseY + 1.0, d / 2 + 0.55, WOOD);
  box(g, 0.9, 0.2, 0.3, -w * 0.05, baseY + 1.25, d / 2 + 0.55, 0x4ab86a);
  box(g, 0.2, 0.25, 0.15, -w * 0.15, baseY + 1.35, d / 2 + 0.55, 0xd94a3d);
  box(g, 0.18, 0.22, 0.14, 0.05, baseY + 1.35, d / 2 + 0.55, 0x8a5ab0);

  // Barrel by door
  barrel(g, -w * 0.48, 0, d / 2 + 1.15, 1.0);

  // Steps
  box(g, 1.6, 0.14, 0.7, -w * 0.28, 0.1, d / 2 + 0.55, STONE);

  // Side wall windows (glow for 3/4 view)
  for (const z of [-d * 0.2, d * 0.15]) {
    box(g, 0.08, 0.9, 0.85, -w / 2 - 0.04, baseY + h * 0.7, z, WOOD);
    glowBox(g, 0.06, 0.75, 0.7, -w / 2 - 0.08, baseY + h * 0.7, z, GLOW, 0xffd080, 0.4);
  }

  return finishProp(g);
}
