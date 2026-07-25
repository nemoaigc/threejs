/**
 * Flat village environment — ground / roads / plaza / aprons.
 *
 * Surface stack (all five required):
 *   grass · dirt_road · shoulder · cobble_plaza · dirt_apron
 *
 * Craft bar: stylized fantasy game-prop (bright, soft, empty > clutter).
 * Geometry stays simple; textures sell the read. All ground: noOutline.
 *
 * Local road frame: +X along length, +Z across width, sole at y≈0.
 */
import * as THREE from 'three';
import { makeToon } from '../entities/building/toon.js';
import {
  ensureEnvTextures,
  makeGrassTexture,
  makeDirtRoadTexture,
  makeCobbleTexture,
  makeShoulderTexture,
  makeWornEarthApronTexture,
} from './textures.js';

export { ensureEnvTextures };

let _tex = null;
function textures() {
  if (_tex) return _tex;
  _tex = {
    grass: makeGrassTexture(),
    road: makeDirtRoadTexture(),
    cobble: makeCobbleTexture(),
    shoulder: makeShoulderTexture(),
    apron: makeWornEarthApronTexture(),
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

function groundMat(color, map, opts = {}) {
  const mat = makeToon(color, opts);
  if (map) mat.map = map;
  return mat;
}

/** Meadow ground — soft spring green plane, sole at y=0. */
export function createMeadowGround(size = 200) {
  const t = textures();
  // Slight warm tint multiplies map toward readable spring meadow under cel
  const mat = groundMat(0xa8e086, t.grass);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'meadow_ground';
  return noOutline(mesh);
}

/**
 * Dirt road segment — soft shoulder + packed path, dual ruts via texture.
 * Local +X = along road, +Z = across width. Sole at y≈0.
 * No heavy curbs.
 */
export function createDirtRoadTile(length, width) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'dirt_road_tile';

  // Shoulder: wider strip, grass→dirt texture (edges show as soft transition)
  const shoulderMap = t.shoulder.clone();
  shoulderMap.wrapS = shoulderMap.wrapT = THREE.RepeatWrapping;
  // U along length, V across full shoulder width
  shoulderMap.repeat.set(Math.max(1, length / Math.max(width, 1)), 1);
  shoulderMap.needsUpdate = true;

  const shoulderMat = groundMat(0xc8d498, shoulderMap);
  const shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.018, width * 1.3),
    shoulderMat,
  );
  shoulder.position.y = 0.009;
  shoulder.receiveShadow = true;
  shoulder.castShadow = false;
  shoulder.name = 'shoulder';
  g.add(shoulder);

  // Packed dirt bed — ruts run along U (length)
  const roadMap = t.road.clone();
  roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;
  // U along length (tile), V across width once
  roadMap.repeat.set(Math.max(1, length / Math.max(width, 1)), 1);
  roadMap.needsUpdate = true;

  const roadMat = groundMat(0xdccdb0, roadMap);
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.98, 0.028, width),
    roadMat,
  );
  road.position.y = 0.018;
  road.receiveShadow = true;
  road.castShadow = false;
  road.name = 'dirt_road';
  g.add(road);

  return noOutline(g);
}

/** Cobble plaza — pale warm pad + light rim (no dark base slab). */
export function createCobblePlaza(size = 14) {
  const t = textures();
  const g = new THREE.Group();
  g.name = 'cobble_plaza';

  const cobbleMap = t.cobble.clone();
  cobbleMap.wrapS = cobbleMap.wrapT = THREE.RepeatWrapping;
  const tiles = Math.max(2, Math.round(size / 4.5));
  cobbleMap.repeat.set(tiles, tiles);
  cobbleMap.needsUpdate = true;

  const cobbleMat = groundMat(0xe0d4c0, cobbleMap);
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.045, size),
    cobbleMat,
  );
  pad.position.y = 0.024;
  pad.receiveShadow = true;
  pad.castShadow = false;
  pad.name = 'cobble_pad';
  g.add(pad);

  // Soft pale rim — thin, light, not a plastic curb
  const rimMat = groundMat(0xd0c4b0);
  const rimT = 0.26;
  const rimH = 0.052;
  const rimY = 0.028;
  const half = size / 2;
  const outs = [
    [size + 0.28, rimT, 0, half + rimT * 0.32],
    [size + 0.28, rimT, 0, -half - rimT * 0.32],
    [rimT, size + 0.28, half + rimT * 0.32, 0],
    [rimT, size + 0.28, -half - rimT * 0.32, 0],
  ];
  for (const [w, d, x, z] of outs) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, rimH, d), rimMat);
    rim.position.set(x, rimY, z);
    rim.receiveShadow = true;
    rim.castShadow = false;
    g.add(rim);
  }

  return noOutline(g);
}

export function createRoadTile(length, width) {
  return createDirtRoadTile(length, width);
}

export function createPlazaPad(size = 14) {
  return createCobblePlaza(size);
}

/**
 * Soft worn earth under landmarks — alpha fade at rim (no hard disc).
 * Slightly above meadow so it composites cleanly.
 */
export function createBuildingDirtApron(radius = 8) {
  const t = textures();
  const mat = groundMat(0xffffff, t.apron, {
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  // Apron map already carries warm sand + alpha; keep color white so map owns tint
  mat.color.set(0xffffff);

  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.receiveShadow = true;
  m.castShadow = false;
  m.name = 'dirt_apron';
  m.renderOrder = 1;
  return noOutline(m);
}

/**
 * @deprecated micro grass tufts looked cheap — no-op kept for import stability.
 */
export function scatterGroundMicroDetail() {
  return null;
}
