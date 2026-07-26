/**
 * Shared cel kit for street-dressing props (not hero buildings).
 * sole@y=0, warm Mushoku countryside palette, cast/receive shadows.
 */
import * as THREE from 'three';
import { makeToon, makeGlow, finishProp } from '../building/toon.js';

export { makeToon, makeGlow, finishProp };

/** Warm countryside palette — matches hero timber/plaster language. */
export const P = {
  timber: 0x8b5e3c,
  timberDark: 0x5a3a22,
  timberLight: 0xa87848,
  plank: 0xc49a5c,
  plaster: 0xf2e8d5,
  stone: 0xa89880,
  stoneDark: 0x7a7064,
  stoneLight: 0xc8bca8,
  iron: 0x3a3836,
  ironLight: 0x5a5650,
  rope: 0xb89868,
  paper: 0xf0e8d0,
  paperOld: 0xe0d0a8,
  paperTan: 0xd4c4a0,
  clay: 0xb85a48,
  clayDark: 0x8a4030,
  hay: 0xd4b85a,
  hayDark: 0xb89840,
  sack: 0xc8b890,
  foliage: 0x4a9a48,
  foliageDark: 0x2f6a32,
  guildGreen: 0x3d5a40,
  water: 0x4a7a88,
  magicRing: 0x7ec8e8,
  lampGlass: 0xffe8a0,
  lampCore: 0xffc060,
  dirt: 0xb89868,
};

export function root(name, gen) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.gen = gen;
  g.userData.kind = 'prop';
  return g;
}

export function box(g, name, w, h, d, x, y, z, colorOrMat, rotY = 0) {
  const mat =
    colorOrMat && colorOrMat.isMaterial ? colorOrMat : makeToon(colorOrMat ?? P.timber);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.name = name;
  m.position.set(x, y, z);
  if (rotY) m.rotation.y = rotY;
  g.add(m);
  return m;
}

export function cyl(g, name, rTop, rBot, h, x, y, z, colorOrMat, segs = 10) {
  const mat =
    colorOrMat && colorOrMat.isMaterial ? colorOrMat : makeToon(colorOrMat ?? P.timber);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), mat);
  m.name = name;
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

export function sphere(g, name, r, x, y, z, colorOrMat, segs = 10) {
  const mat =
    colorOrMat && colorOrMat.isMaterial ? colorOrMat : makeToon(colorOrMat ?? P.timber);
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs - 2), mat);
  m.name = name;
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

export function torus(g, name, R, r, x, y, z, colorOrMat, { rx = Math.PI / 2, segs = 16 } = {}) {
  const mat =
    colorOrMat && colorOrMat.isMaterial ? colorOrMat : makeToon(colorOrMat ?? P.timber);
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 6, segs), mat);
  m.name = name;
  m.position.set(x, y, z);
  m.rotation.x = rx;
  g.add(m);
  return m;
}

export function done(g) {
  return finishProp(g);
}

/** Hash in [0,1) for deterministic prop variation. */
export function hash01(a, b = 0) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
