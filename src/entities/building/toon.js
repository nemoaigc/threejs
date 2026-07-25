/**
 * Shared cel materials for buildings (no dependency on world.js → no cycles).
 */
import * as THREE from 'three';

function makeGradientMap(steps = 5) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    data[i] = Math.round(72 + t * t * 40 + t * 138);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export const buildingGradientMap = makeGradientMap(5);

export function makeToon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: buildingGradientMap, ...opts });
}

export function makeGlow(color, emissive, intensity = 0.55) {
  return makeToon(color, {
    emissive: new THREE.Color(emissive),
    emissiveIntensity: intensity,
  });
}

export function finishProp(g) {
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

export function box(g, w, h, d, x, y, z, color, mat = null) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat || makeToon(color),
  );
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

export function glowBox(g, w, h, d, x, y, z, color, emissive, intensity = 0.65) {
  return box(g, w, h, d, x, y, z, color, makeGlow(color, emissive, intensity));
}

/** Front-facing triangular gable (iconic roof silhouette from hero camera). */
export function frontGable(g, width, rise, depth, y, z, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(width * 0.5, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  // Shape is XY; extrude +Z. Center depth.
  const mesh = new THREE.Mesh(geo, makeToon(color));
  mesh.position.set(0, y, z - depth * 0.5);
  g.add(mesh);
  return mesh;
}

/** Two-slope gable roof along X (ridge left–right). */
export function gableRoof(g, w, d, y, color, rise = 1.6) {
  const mat = makeToon(color);
  const slabL = new THREE.Mesh(new THREE.BoxGeometry(w * 1.18, 0.18, d * 0.72), mat);
  slabL.position.set(0, y + rise * 0.42, -d * 0.18);
  slabL.rotation.x = 0.55;
  g.add(slabL);
  const slabR = new THREE.Mesh(new THREE.BoxGeometry(w * 1.18, 0.18, d * 0.72), mat);
  slabR.position.set(0, y + rise * 0.42, d * 0.18);
  slabR.rotation.x = -0.55;
  g.add(slabR);
  box(g, w * 1.2, 0.14, 0.2, 0, y + rise * 0.82, 0, color);
  // dark eave lips
  box(g, w * 1.14, 0.1, 0.12, 0, y + 0.08, d * 0.48, 0x4a3028);
  box(g, w * 1.14, 0.1, 0.12, 0, y + 0.08, -d * 0.48, 0x4a3028);
}

export function barrel(g, x, y, z, s = 1) {
  const WOOD = 0x8b5e3c;
  const BAND = 0x4a4038;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * s, 0.32 * s, 0.55 * s, 12),
    makeToon(WOOD),
  );
  body.position.set(x, y + 0.28 * s, z);
  g.add(body);
  box(g, 0.58 * s, 0.05 * s, 0.58 * s, x, y + 0.12 * s, z, BAND);
  box(g, 0.58 * s, 0.05 * s, 0.58 * s, x, y + 0.42 * s, z, BAND);
}

export function crate(g, x, y, z, sx = 0.55, sy = 0.45, sz = 0.5) {
  box(g, sx, sy, sz, x, y + sy / 2, z, 0xa07848);
  box(g, sx * 1.02, 0.04, sz * 1.02, x, y + sy * 0.08, z, 0x6a5030);
  box(g, sx * 1.02, 0.04, sz * 1.02, x, y + sy * 0.92, z, 0x6a5030);
}
