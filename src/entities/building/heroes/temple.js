/**
 * Hero: Temple — matches docs/references/heroes/temple/ref_main.png
 * Identity: white stone nave, tall dark slate steeple, rose window, gold sun emblem,
 * vertical stained-glass lancets, column portico. Sole @ y=0, facade +Z.
 */
import * as THREE from 'three';
import { box, glowBox, gableRoof, finishProp, makeToon, makeGlow } from '../toon.js';

export function createTempleHero() {
  const g = new THREE.Group();
  g.name = 'hero.temple';

  const STONE = 0xf4efe6;
  const STONE_WARM = 0xe6dcc8;
  const STONE_DARK = 0xa89888;
  const TRIM = 0xd4c8b0;
  const ROOF = 0x3a4550;
  const GOLD = 0xe0b040;
  const PLINTH = 0xc8bca8;
  const STAIN = [0xd45a6e, 0x3a78c8, 0xf0b840, 0x4ab87a, 0x9a52c8, 0xe87840];

  const mw = 13.5;
  const md = 8.0;
  const mh = 10.5;
  const plinthH = 0.55;
  const baseY = plinthH;

  // Base
  box(g, mw + 2.2, plinthH, md + 1.8, 0, plinthH / 2, 0, PLINTH);
  // wide steps
  box(g, 8.5, 0.22, 2.2, 0, 0.14, md / 2 + 1.5, PLINTH);
  box(g, 7.5, 0.18, 1.5, 0, 0.32, md / 2 + 0.95, PLINTH);
  box(g, 6.5, 0.16, 1.0, 0, 0.48, md / 2 + 0.55, PLINTH);

  // Nave
  box(g, mw, mh, md, 0, baseY + mh / 2, 0, STONE);
  // cornice
  box(g, mw * 1.05, 0.4, 0.28, 0, baseY + mh * 0.92, md / 2 + 0.08, TRIM);
  gableRoof(g, mw, md, baseY + mh, ROOF, 2.6);
  // front roof triangle face (gable wall)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-mw * 0.52, 0);
  gableShape.lineTo(mw * 0.52, 0);
  gableShape.lineTo(0, 3.2);
  gableShape.closePath();
  const gableMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gableShape, { depth: 0.35, bevelEnabled: false }),
    makeToon(STONE),
  );
  gableMesh.position.set(0, baseY + mh, md / 2 - 0.15);
  g.add(gableMesh);

  // Side aisle lower volumes
  for (const sx of [-1, 1]) {
    const aw = 3.2;
    const ah = mh * 0.58;
    const x = sx * (mw * 0.5 + aw * 0.35);
    box(g, aw, ah, md * 0.72, x, baseY + ah / 2, 0.15, STONE_WARM);
    gableRoof(g, aw, md * 0.72, baseY + ah, ROOF, 1.1);
  }

  // Stained glass lancets along side (+Z facade row + long side)
  const faceZ = md / 2 + 0.05;
  // Facade tall lancets flanking door
  for (const x of [-mw * 0.32, mw * 0.32]) {
    const col = STAIN[0];
    box(g, 1.05, 4.2, 0.1, x, baseY + 4.8, faceZ, TRIM);
    glowBox(g, 0.85, 3.9, 0.08, x, baseY + 4.8, faceZ + 0.06, col, col, 0.55);
  }
  // Long side lancets (−X visible from 3/4)
  for (let i = 0; i < 6; i++) {
    const z = ((i + 0.5) / 6 - 0.5) * md * 0.72;
    const col = STAIN[i % STAIN.length];
    box(g, 0.1, 3.8, 0.95, -mw / 2 - 0.04, baseY + 4.2, z, TRIM);
    glowBox(g, 0.08, 3.5, 0.78, -mw / 2 - 0.1, baseY + 4.2, z, col, col, 0.5);
  }

  // Rose window (identity)
  const rose = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 0.14, 28),
    makeGlow(0x6a90d0, 0x88b0f0, 0.45),
  );
  rose.rotation.x = Math.PI / 2;
  rose.position.set(0, baseY + mh * 0.72, faceZ + 0.08);
  g.add(rose);
  // rose mullions
  box(g, 0.12, 2.9, 0.08, 0, baseY + mh * 0.72, faceZ + 0.14, TRIM);
  box(g, 2.9, 0.12, 0.08, 0, baseY + mh * 0.72, faceZ + 0.14, TRIM);
  // colorful ring segments
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const col = STAIN[i % STAIN.length];
    glowBox(
      g, 0.35, 0.35, 0.06,
      Math.cos(a) * 1.05, baseY + mh * 0.72 + Math.sin(a) * 1.05, faceZ + 0.16,
      col, col, 0.4,
    );
  }

  // Gold sun emblem (NOT a cross) — oversized identity marker
  const sunY = baseY + mh * 0.48;
  const sun = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.16, 24),
    makeGlow(GOLD, 0xffd060, 0.75),
  );
  sun.rotation.x = Math.PI / 2;
  sun.position.set(0, sunY, faceZ + 0.14);
  g.add(sun);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(
      g, 0.22, 0.95, 0.1,
      Math.cos(a) * 1.75, sunY + Math.sin(a) * 1.75, faceZ + 0.14,
      GOLD,
    );
  }

  // Portico columns
  const pz = md / 2 + 2.1;
  box(g, 7.5, 0.35, 3.0, 0, baseY + 4.5, pz, TRIM);
  box(g, 7.8, 0.15, 3.2, 0, baseY + 4.75, pz, STONE_WARM);
  for (const x of [-2.6, -0.9, 0.9, 2.6]) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 4.2, 12),
      makeToon(STONE),
    );
    col.position.set(x, baseY + 2.1, pz + 0.95);
    g.add(col);
    box(g, 0.7, 0.2, 0.7, x, baseY + 0.15, pz + 0.95, TRIM);
    box(g, 0.75, 0.18, 0.75, x, baseY + 4.25, pz + 0.95, TRIM);
  }

  // Grand doors
  for (const x of [-0.85, 0.85]) {
    box(g, 1.4, 3.4, 0.14, x, baseY + 1.85, md / 2 + 0.08, 0x5a3a28);
    glowBox(g, 0.5, 0.9, 0.06, x, baseY + 2.5, md / 2 + 0.16, 0xc8d8f0, 0xe8f0ff, 0.2);
  }
  box(g, 3.2, 0.35, 0.2, 0, baseY + 3.7, md / 2 + 0.12, TRIM);

  // —— Bell steeple (dominant vertical) ——
  const sx = mw * 0.22;
  const steepleBase = baseY + mh;
  // tower body
  box(g, 3.6, 6.5, 3.6, sx, steepleBase + 3.25, md * 0.12, STONE);
  // belfry
  box(g, 3.0, 2.2, 3.0, sx, steepleBase + 7.5, md * 0.12, STONE);
  // open arches
  for (const [dx, dz] of [[0, 1.55], [0, -1.55], [1.55, 0], [-1.55, 0]]) {
    box(g, dx === 0 ? 1.4 : 0.12, 1.5, dz === 0 ? 1.4 : 0.12, sx + dx, steepleBase + 7.5, md * 0.12 + dz, 0x2a2830);
  }
  // bell
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), makeToon(GOLD));
  bell.position.set(sx, steepleBase + 7.2, md * 0.12);
  g.add(bell);
  // spire
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.85, 5.2, 8), makeToon(ROOF));
  spire.position.set(sx, steepleBase + 11.2, md * 0.12);
  g.add(spire);
  // gold finial
  box(g, 0.12, 1.2, 0.12, sx, steepleBase + 14.0, md * 0.12, GOLD);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), makeGlow(GOLD, 0xffe080, 0.4));
  finial.position.set(sx, steepleBase + 14.7, md * 0.12);
  g.add(finial);

  // Buttresses
  for (const bx of [-mw * 0.48, mw * 0.48]) {
    box(g, 0.85, mh * 0.88, 1.5, bx, baseY + mh * 0.44, md * 0.15, STONE_WARM);
  }

  // Courtyard props
  box(g, 0.9, 0.5, 0.9, mw * 0.4, 0.35, md / 2 + 2.8, STONE_DARK);
  // small planter
  box(g, 0.7, 0.4, 0.7, -mw * 0.4, 0.3, md / 2 + 2.6, 0x8b5e3c);
  box(g, 0.55, 0.25, 0.55, -mw * 0.4, 0.6, md / 2 + 2.6, 0x4ab86a);

  return finishProp(g);
}
