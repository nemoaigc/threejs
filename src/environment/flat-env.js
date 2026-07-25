/**
 * Flat village environment — ground / roads / plaza.
 * Keep it light and simple: texture + soft geometry. No noisy micro-props.
 */
import * as THREE from 'three';
import { makeToon } from '../entities/building/toon.js';
import {
  makeGrassTexture,
  makeDirtRoadTexture,
  makeCobbleTexture,
  makeShoulderTexture,
  makeWornEarthApronTexture,
} from './textures.js';

let _tex = null;
function textures() {
  if (_tex) return _tex;
  _tex = {
    grass: makeGrassTexture(512),
    road: makeDirtRoadTexture(512),
    cobble: makeCobbleTexture(512),
    shoulder: makeShoulderTexture(256),
    apron: makeWornEarthApronTexture(256),
  };
  return _tex;
}

function noOutline(o) {
  o.userData.noOutline = true;
  o.traverse?.((c) => {
    c.userData.noOutline = true;
  });
  return o;
}

/** Meadow ground — bright grass, minimal shader tint. */
export function createMeadowGround(size = 200) {
  const t = textures();
  const mat = makeToon(0x9edc78);
  mat.map = t.grass;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return noOutline(mesh);
}

/**
 * Dirt road segment — soft shoulder + packed path, no heavy curbs.
 * Local +X = along road, +Z = across width. Sole at y=0.
 */
export function createDirtRoadTile(length, width) {
  const t = textures();
  const g = new THREE.Group();

  const shoulderMat = makeToon(0xb8c888);
  shoulderMat.map = t.shoulder;
  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.02, width * 1.28),
    shoulderMat,
  );
  shoulder.position.y = 0.01;
  shoulder.receiveShadow = true;
  g.add(shoulder);

  const roadMat = makeToon(0xd4c4a8);
  const roadMap = t.road.clone();
  roadMap.repeat.set(1, Math.max(1, length / width));
  roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;
  roadMat.map = roadMap;

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.98, 0.03, width),
    roadMat,
  );
  road.position.y = 0.02;
  road.receiveShadow = true;
  g.add(road);

  noOutline(g);
  return g;
}

/** Cobble plaza — pale pad only (no dark base slab / heavy rim). */
export function createCobblePlaza(size = 14) {
  const t = textures();
  const g = new THREE.Group();

  const cobbleMat = makeToon(0xd8cbb8);
  cobbleMat.map = t.cobble;
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.05, size),
    cobbleMat,
  );
  pad.position.y = 0.028;
  pad.receiveShadow = true;
  g.add(pad);

  // soft pale rim
  const rimMat = makeToon(0xc8bca8);
  const rimT = 0.28;
  for (const [w, d, x, z] of [
    [size + 0.3, rimT, 0, size / 2 + rimT * 0.35],
    [size + 0.3, rimT, 0, -size / 2 - rimT * 0.35],
    [rimT, size + 0.3, size / 2 + rimT * 0.35, 0],
    [rimT, size + 0.3, -size / 2 - rimT * 0.35, 0],
  ]) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), rimMat);
    rim.position.set(x, 0.03, z);
    rim.receiveShadow = true;
    g.add(rim);
  }

  noOutline(g);
  return g;
}

export function createRoadTile(length, width) {
  return createDirtRoadTile(length, width);
}

export function createPlazaPad(size = 14) {
  return createCobblePlaza(size);
}

/** Soft light dirt under landmarks — low opacity, no hard disc. */
export function createBuildingDirtApron(radius = 8) {
  const t = textures();
  const mat = makeToon(0xffffff);
  mat.map = t.apron;
  mat.transparent = true;
  mat.opacity = 1;
  mat.depthWrite = false;
  mat.color.set(0xffffff);
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.015;
  m.receiveShadow = true;
  return noOutline(m);
}

/**
 * @deprecated micro grass tufts looked cheap — no-op kept for import stability.
 */
export function scatterGroundMicroDetail() {
  return null;
}
