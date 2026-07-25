/**
 * Temple — solid 3D matching ref_main.png
 * white nave, tall slate steeple, rose window, gold sun (not cross),
 * stained-glass lancets, column portico. Sole @ y=0, facade +Z.
 */
import * as THREE from 'three';
import { box, glowBox, finishProp, makeToon, makeGlow } from '../toon.js';

function roofSlabs(g, w, d, y, color, rise) {
  const mat = makeToon(color);
  const L = new THREE.Mesh(new THREE.BoxGeometry(w * 1.18, 0.2, d * 0.75), mat);
  L.position.set(0, y + rise * 0.4, -d * 0.18);
  L.rotation.x = 0.52;
  g.add(L);
  const R = new THREE.Mesh(new THREE.BoxGeometry(w * 1.18, 0.2, d * 0.75), mat);
  R.position.set(0, y + rise * 0.4, d * 0.18);
  R.rotation.x = -0.52;
  g.add(R);
  box(g, w * 1.2, 0.16, 0.2, 0, y + rise * 0.82, 0, color);
}

export function createTempleHero() {
  const g = new THREE.Group();
  g.name = 'hero.temple';

  const STONE = 0xf5f0e8;
  const STONE_W = 0xe6dcc8;
  const STONE_D = 0xb0a898;
  const TRIM = 0xd8ccb4;
  const ROOF = 0x343e48;
  const GOLD = 0xe8b840;
  const STAIN = [0xd45a6e, 0x3a78c8, 0xf0b840, 0x4ab87a, 0x9a52c8, 0xe87840];

  const mw = 14;
  const md = 8.5;
  const mh = 11;
  const base = 0.55;

  box(g, mw + 2.4, base, md + 2, 0, base / 2, 0, STONE_D);
  // steps
  box(g, 9.0, 0.22, 2.4, 0, 0.14, md / 2 + 1.6, STONE_D);
  box(g, 8.0, 0.18, 1.6, 0, 0.32, md / 2 + 1.0, STONE_D);
  box(g, 7.0, 0.16, 1.1, 0, 0.48, md / 2 + 0.55, STONE_D);

  // Nave
  box(g, mw, mh, md, 0, base + mh / 2, 0, STONE);
  box(g, mw * 1.04, 0.42, 0.3, 0, base + mh * 0.92, md / 2 + 0.08, TRIM);
  roofSlabs(g, mw, md, base + mh, ROOF, 2.8);
  // front gable wall
  box(g, mw * 0.95, 2.8, 0.4, 0, base + mh + 1.2, md / 2 - 0.1, STONE);
  const pL = new THREE.Mesh(new THREE.BoxGeometry(mw * 0.55, 0.2, 0.45), makeToon(ROOF));
  pL.position.set(-mw * 0.2, base + mh + 2.4, md / 2 - 0.05);
  pL.rotation.z = 0.5;
  g.add(pL);
  const pR = pL.clone();
  pR.position.x = mw * 0.2;
  pR.rotation.z = -0.5;
  g.add(pR);

  // Side aisles
  for (const sx of [-1, 1]) {
    const aw = 3.4;
    const ah = mh * 0.55;
    const x = sx * (mw * 0.5 + aw * 0.32);
    box(g, aw, ah, md * 0.7, x, base + ah / 2, 0.1, STONE_W);
    roofSlabs(g, aw, md * 0.7, base + ah, ROOF, 1.15);
  }

  const faceZ = md / 2 + 0.06;

  // Side lancets (−X for 3/4)
  for (let i = 0; i < 6; i++) {
    const z = ((i + 0.5) / 6 - 0.5) * md * 0.7;
    const col = STAIN[i % STAIN.length];
    box(g, 0.12, 4.0, 1.0, -mw / 2 - 0.05, base + 4.4, z, TRIM);
    glowBox(g, 0.08, 3.7, 0.82, -mw / 2 - 0.12, base + 4.4, z, col, col, 0.55);
  }
  // Facade lancets
  for (const x of [-mw * 0.3, mw * 0.3]) {
    const col = STAIN[1];
    box(g, 1.1, 4.4, 0.12, x, base + 5.0, faceZ, TRIM);
    glowBox(g, 0.9, 4.1, 0.08, x, base + 5.0, faceZ + 0.06, col, col, 0.55);
  }

  // Rose window
  const rose = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.16, 28),
    makeGlow(0x6a90d0, 0x90b8f8, 0.55),
  );
  rose.rotation.x = Math.PI / 2;
  rose.position.set(0, base + mh * 0.74, faceZ + 0.08);
  g.add(rose);
  box(g, 0.14, 3.1, 0.08, 0, base + mh * 0.74, faceZ + 0.14, TRIM);
  box(g, 3.1, 0.14, 0.08, 0, base + mh * 0.74, faceZ + 0.14, TRIM);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const col = STAIN[i % STAIN.length];
    glowBox(
      g, 0.4, 0.4, 0.06,
      Math.cos(a) * 1.15, base + mh * 0.74 + Math.sin(a) * 1.15, faceZ + 0.16,
      col, col, 0.45,
    );
  }

  // Gold sun emblem
  const sunY = base + mh * 0.46;
  const sun = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 0.18, 24),
    makeGlow(GOLD, 0xffd060, 0.8),
  );
  sun.rotation.x = Math.PI / 2;
  sun.position.set(0, sunY, faceZ + 0.14);
  g.add(sun);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(g, 0.24, 1.0, 0.1, Math.cos(a) * 1.85, sunY + Math.sin(a) * 1.85, faceZ + 0.14, GOLD);
  }

  // Portico columns
  const pz = md / 2 + 2.2;
  box(g, 8.0, 0.38, 3.2, 0, base + 4.6, pz, TRIM);
  box(g, 8.3, 0.16, 3.4, 0, base + 4.85, pz, STONE_W);
  for (const x of [-2.8, -0.95, 0.95, 2.8]) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.4, 4.3, 12),
      makeToon(STONE),
    );
    col.position.set(x, base + 2.15, pz + 1.0);
    g.add(col);
    box(g, 0.75, 0.22, 0.75, x, base + 0.15, pz + 1.0, TRIM);
    box(g, 0.8, 0.2, 0.8, x, base + 4.35, pz + 1.0, TRIM);
  }

  // Doors
  for (const x of [-0.9, 0.9]) {
    box(g, 1.5, 3.5, 0.16, x, base + 1.9, md / 2 + 0.08, 0x5a3a28);
    glowBox(g, 0.55, 0.95, 0.06, x, base + 2.6, md / 2 + 0.16, 0xc8d8f0, 0xe8f0ff, 0.25);
  }
  box(g, 3.4, 0.38, 0.22, 0, base + 3.8, md / 2 + 0.12, TRIM);

  // Bell steeple — dominant vertical
  const sx = mw * 0.2;
  const sb = base + mh;
  box(g, 3.8, 7.0, 3.8, sx, sb + 3.5, md * 0.1, STONE);
  box(g, 3.2, 2.4, 3.2, sx, sb + 8.0, md * 0.1, STONE);
  for (const [dx, dz] of [[0, 1.65], [0, -1.65], [1.65, 0], [-1.65, 0]]) {
    box(
      g,
      dx === 0 ? 1.5 : 0.14,
      1.6,
      dz === 0 ? 1.5 : 0.14,
      sx + dx, sb + 8.0, md * 0.1 + dz,
      0x222028,
    );
  }
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), makeToon(GOLD));
  bell.position.set(sx, sb + 7.7, md * 0.1);
  g.add(bell);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.0, 5.8, 8), makeToon(ROOF));
  spire.position.set(sx, sb + 12.0, md * 0.1);
  g.add(spire);
  box(g, 0.14, 1.4, 0.14, sx, sb + 15.2, md * 0.1, GOLD);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), makeGlow(GOLD, 0xffe080, 0.5));
  tip.position.set(sx, sb + 16.0, md * 0.1);
  g.add(tip);

  // Buttresses
  for (const bx of [-mw * 0.48, mw * 0.48]) {
    box(g, 0.9, mh * 0.9, 1.6, bx, base + mh * 0.45, md * 0.12, STONE_W);
  }

  return finishProp(g);
}
