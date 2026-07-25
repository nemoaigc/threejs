/**
 * Shared cel materials + solid building primitives for hero assets.
 */
import * as THREE from 'three';

function makeGradientMap(steps = 5) {
  const data = new Uint8Array(steps);
  // Soft bright cel — shadow floor lifted (was ~72, read as muddy ink)
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    data[i] = Math.round(120 + t * 130);
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

/**
 * SOLID gable roof — one triangular prism, not two floating slabs.
 * Ridge runs along +X (left–right). Peak height = `rise` above base y.
 * Overhang slightly past wall w/d.
 */
export function solidGableRoof(g, w, d, y, color, rise = 2.0, overhang = 0.35) {
  const hw = w * 0.5 + overhang;
  const hd = d * 0.5 + overhang;
  // 6 verts: bottom 4 eave corners + 2 ridge ends
  // Bottom: (-hw,0,-hd) (hw,0,-hd) (hw,0,hd) (-hw,0,hd)
  // Ridge:  ( -hw,rise,0) (hw,rise,0)
  const v = [
    -hw, 0, -hd, // 0 back-left eave
    hw, 0, -hd, // 1 back-right eave
    hw, 0, hd, // 2 front-right eave
    -hw, 0, hd, // 3 front-left eave
    -hw, rise, 0, // 4 ridge left
    hw, rise, 0, // 5 ridge right
  ];
  const idx = [
    // back slope
    0, 1, 5, 0, 5, 4,
    // front slope
    3, 4, 5, 3, 5, 2,
    // left gable
    0, 4, 3,
    // right gable
    1, 2, 5,
    // underside (so no hole if seen from below)
    0, 3, 2, 0, 2, 1,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, makeToon(color));
  mesh.position.y = y;
  g.add(mesh);
  // ridge cap
  box(g, w + overhang * 2 + 0.1, 0.12, 0.18, 0, y + rise + 0.04, 0, color);
  return mesh;
}

/** Hip / four-slope simple roof (for small shops) — solid pyramid frustum-ish. */
export function solidHipRoof(g, w, d, y, color, rise = 1.4, overhang = 0.25) {
  const hw = w * 0.5 + overhang;
  const hd = d * 0.5 + overhang;
  const v = [
    -hw, 0, -hd,
    hw, 0, -hd,
    hw, 0, hd,
    -hw, 0, hd,
    0, rise, 0,
  ];
  const idx = [
    0, 1, 4,
    1, 2, 4,
    2, 3, 4,
    3, 0, 4,
    0, 3, 2, 0, 2, 1,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, makeToon(color));
  mesh.position.y = y;
  g.add(mesh);
  return mesh;
}

/** Cone spire for temples / towers. */
export function solidCone(g, radius, height, x, y, z, color, segments = 8) {
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, segments),
    makeToon(color),
  );
  mesh.position.set(x, y + height / 2, z);
  g.add(mesh);
  return mesh;
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

// Keep old name as alias → solid (world.js legacy may call gableRoof)
export const gableRoof = solidGableRoof;
export function frontGable(g, width, rise, depth, y, z, color) {
  // solid triangular wall, not a thin extrude flake
  const hw = width * 0.5;
  const v = [
    -hw, 0, 0,
    hw, 0, 0,
    0, rise, 0,
    -hw, 0, -depth,
    hw, 0, -depth,
    0, rise, -depth,
  ];
  const idx = [
    0, 1, 2,
    3, 5, 4,
    0, 2, 5, 0, 5, 3,
    1, 4, 5, 1, 5, 2,
    0, 3, 4, 0, 4, 1,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, makeToon(color));
  mesh.position.set(0, y, z);
  g.add(mesh);
  return mesh;
}
