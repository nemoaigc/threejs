import * as THREE from 'three';
import { buildingGradientMap } from '../../building/toon.js';

export const PROP_PALETTE = {
  limestone: [0x9a794e, 0x7f6140, 0xb39262, 0x6f5238],
  limestoneDark: 0x45382c,
  oak: [0x452516, 0x57301b, 0x351e13, 0x64381f],
  oakDark: 0x2d1b13,
  terracotta: [0x8e382b, 0xa34432, 0x722d25, 0xb8533c],
  iron: 0x292826,
  ironEdge: 0x4b4a47,
  brass: 0x8a6431,
  rope: 0xa88b54,
  glass: 0xf3b94e,
  ember: 0xffb238,
};

export function toon(color, options = {}) {
  const material = new THREE.MeshToonMaterial({
    color,
    gradientMap: buildingGradientMap,
    ...options,
  });
  material.name = options.name ?? `toon-${new THREE.Color(color).getHexString()}`;
  return material;
}

export function standard(color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0,
    ...options,
  });
  material.name = options.name ?? `standard-${new THREE.Color(color).getHexString()}`;
  return material;
}

const SURFACE_TEXTURE_CACHE = new Map();
const REFERENCE_ALBEDO_CACHE = new Map();
const REFERENCE_TEXTURE_READY = new WeakSet();
const REFERENCE_ROTATION_ASSIGNMENTS = new WeakMap();
const SURFACE_RESOLUTION = 384;
const REFERENCE_ALBEDO_URLS = {
  stone: new URL('../../../assets/props/materials/limestone-albedo.png', import.meta.url).href,
  'inner-stone': new URL('../../../assets/props/materials/limestone-albedo.png', import.meta.url).href,
  wood: new URL('../../../assets/props/materials/aged-oak-albedo.png', import.meta.url).href,
  clay: new URL('../../../assets/props/materials/terracotta-albedo.png', import.meta.url).href,
  'forged-iron': new URL('../../../assets/props/materials/forged-iron-albedo.png', import.meta.url).href,
  'worn-iron': new URL('../../../assets/props/materials/forged-iron-albedo.png', import.meta.url).href,
};

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function hash2d(x, y, seed) {
  let value = Math.imul(x ^ seed, 0x27d4eb2d) ^ Math.imul(y + seed, 0x165667b1);
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b);
  value ^= value >>> 13;
  return (value >>> 0) / 4294967295;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);
  const a = hash2d(x0, y0, seed);
  const b = hash2d(x0 + 1, y0, seed);
  const c = hash2d(x0, y0 + 1, seed);
  const d = hash2d(x0 + 1, y0 + 1, seed);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, tx),
    THREE.MathUtils.lerp(c, d, tx),
    ty,
  );
}

function fbm(x, y, seed, octaves = 5) {
  let value = 0;
  let amplitude = 0.54;
  let frequency = 1;
  let weight = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    value += valueNoise(x * frequency, y * frequency, seed + octave * 97) * amplitude;
    weight += amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value / weight;
}

const SURFACE_RECIPES = {
  stone: { roughness: 0.88, metalness: 0, normalScale: 1.0, repeat: [2.5, 2.5] },
  'inner-stone': { roughness: 0.96, metalness: 0, normalScale: 0.82, repeat: [2.2, 2.2] },
  wood: { roughness: 0.76, metalness: 0, normalScale: 0.32, repeat: [1.35, 1.1] },
  clay: { roughness: 0.82, metalness: 0, normalScale: 0.66, repeat: [2.4, 2.4] },
  'forged-iron': { roughness: 0.52, metalness: 0.78, normalScale: 0.48, repeat: [3.2, 3.2] },
  'worn-iron': { roughness: 0.38, metalness: 0.84, normalScale: 0.42, repeat: [3.2, 3.2] },
  brass: { roughness: 0.34, metalness: 0.72, normalScale: 0.24, repeat: [3, 3] },
  rope: { roughness: 0.93, metalness: 0, normalScale: 0.86, repeat: [3.5, 2] },
  cork: { roughness: 0.96, metalness: 0, normalScale: 0.84, repeat: [3.2, 3.2] },
  parchment: { roughness: 0.91, metalness: 0, normalScale: 0.24, repeat: [2.2, 3.4] },
  burlap: { roughness: 0.98, metalness: 0, normalScale: 1.12, repeat: [5.2, 5.2] },
  moss: { roughness: 1, metalness: 0, normalScale: 1.18, repeat: [4.2, 4.2] },
  fruit: { roughness: 0.38, metalness: 0, normalScale: 0.16, repeat: [2.8, 2.8] },
  wax: { roughness: 0.46, metalness: 0, normalScale: 0.14, repeat: [3, 3] },
  generic: { roughness: 0.72, metalness: 0, normalScale: 0.35, repeat: [2, 2] },
};

function surfaceSignal(kind, u, v, channelSeed) {
  const macro = fbm(u * 2.2, v * 2.2, channelSeed, 4);
  const meso = fbm(u * 8.5, v * 8.5, channelSeed + 271, 4);
  const micro = fbm(u * 33, v * 33, channelSeed + 547, 3);
  const speck = hash2d(
    Math.floor(u * SURFACE_RESOLUTION),
    Math.floor(v * SURFACE_RESOLUTION),
    channelSeed + 811,
  );

  if (kind === 'wood') {
    const warp = (fbm(u * 1.7, v * 3.1, channelSeed + 31, 4) - 0.5) * 13;
    const grain = 0.5 + 0.5 * Math.sin(u * 42 + warp + Math.sin(v * 7) * 1.1);
    const fine = 0.5 + 0.5 * Math.sin(u * 156 + warp * 2.1);
    const knotDistance = Math.hypot(
      ((u * 3.1 + 0.17) % 1) - 0.5,
      ((v * 2.2 + 0.31) % 1) - 0.5,
    );
    const knot = Math.max(0, 1 - knotDistance * 8);
    return {
      albedo: clamp01(
        0.74
        + (grain - 0.5) * 0.16
        + (fine - 0.5) * 0.045
        - knot * 0.16,
      ),
      roughness: clamp01(0.65 + meso * 0.22 + (1 - grain) * 0.08),
      height: clamp01(0.43 + grain * 0.19 + fine * 0.055 + meso * 0.16 - knot * 0.1),
      ao: clamp01(0.72 + macro * 0.2 + grain * 0.07),
    };
  }

  if (kind === 'stone' || kind === 'inner-stone') {
    const pore = speck > 0.982 ? (speck - 0.982) * 38 : 0;
    const strata = 0.5 + 0.5 * Math.sin(v * 28 + macro * 5);
    return {
      albedo: clamp01(0.7 + macro * 0.18 + meso * 0.08 - pore * 0.16),
      roughness: clamp01(0.78 + meso * 0.18 + micro * 0.08),
      height: clamp01(0.38 + macro * 0.28 + meso * 0.23 + strata * 0.08 - pore * 0.34),
      ao: clamp01(0.66 + macro * 0.22 + meso * 0.11 - pore * 0.2),
    };
  }

  if (kind === 'clay') {
    const pit = speck > 0.988 ? 0.34 : 0;
    const pressed = 0.5 + 0.5 * Math.sin((u + v * 0.13) * 56 + macro * 3);
    return {
      albedo: clamp01(0.75 + macro * 0.16 + meso * 0.07 - pit * 0.25),
      roughness: clamp01(0.72 + meso * 0.18 + micro * 0.08),
      height: clamp01(0.46 + macro * 0.15 + pressed * 0.12 + micro * 0.09 - pit),
      ao: clamp01(0.74 + macro * 0.16 + meso * 0.08 - pit * 0.18),
    };
  }

  if (kind === 'forged-iron' || kind === 'worn-iron' || kind === 'brass') {
    const pit = speck > 0.975 ? (speck - 0.975) * 18 : 0;
    const scratch = Math.pow(
      Math.max(0, 1 - Math.abs(Math.sin((u + v * 0.23) * 210 + macro * 8)) * 11),
      2,
    );
    const isBrass = kind === 'brass';
    const isEdge = kind === 'worn-iron';
    return {
      albedo: clamp01(
        (isBrass ? 0.7 : isEdge ? 0.61 : 0.5)
        + macro * 0.18
        + scratch * (isEdge ? 0.16 : 0.07)
        - pit * 0.22,
      ),
      roughness: clamp01(
        (isBrass ? 0.28 : isEdge ? 0.31 : 0.43)
        + meso * 0.28
        + pit * 0.2
        - scratch * 0.12,
      ),
      height: clamp01(0.52 + meso * 0.15 + micro * 0.09 + scratch * 0.08 - pit * 0.36),
      ao: clamp01(0.72 + macro * 0.18 + meso * 0.08 - pit * 0.27),
    };
  }

  if (kind === 'rope') {
    const twist = 0.5 + 0.5 * Math.sin((u * 3.2 + v * 9.5) * Math.PI * 2);
    const fiber = 0.5 + 0.5 * Math.sin((u * 31 - v * 7) * Math.PI * 2);
    return {
      albedo: clamp01(0.7 + macro * 0.12 + twist * 0.13 + fiber * 0.05),
      roughness: clamp01(0.84 + meso * 0.1 + fiber * 0.06),
      height: clamp01(0.32 + twist * 0.43 + fiber * 0.18 + micro * 0.07),
      ao: clamp01(0.65 + twist * 0.23 + macro * 0.1),
    };
  }

  if (kind === 'parchment') {
    const fiber = 0.5 + 0.5 * Math.sin(v * 430 + macro * 15);
    const foxing = speck > 0.986 ? (speck - 0.986) * 28 : 0;
    return {
      albedo: clamp01(0.76 + macro * 0.16 + fiber * 0.035 - foxing * 0.14),
      roughness: clamp01(0.82 + meso * 0.12 + fiber * 0.06),
      height: clamp01(0.45 + fiber * 0.16 + meso * 0.1),
      ao: clamp01(0.78 + macro * 0.15 - foxing * 0.08),
    };
  }

  if (kind === 'burlap') {
    const warp = 0.5 + 0.5 * Math.sin(u * Math.PI * 170);
    const weft = 0.5 + 0.5 * Math.sin(v * Math.PI * 170);
    const weave = warp * 0.52 + weft * 0.48;
    return {
      albedo: clamp01(0.68 + macro * 0.12 + weave * 0.12),
      roughness: clamp01(0.88 + meso * 0.08 + weave * 0.04),
      height: clamp01(0.28 + weave * 0.58 + micro * 0.08),
      ao: clamp01(0.62 + weave * 0.28 + macro * 0.08),
    };
  }

  if (kind === 'cork') {
    const pit = speck > 0.96 ? (speck - 0.96) * 14 : 0;
    return {
      albedo: clamp01(0.62 + macro * 0.22 + meso * 0.11 - pit * 0.18),
      roughness: clamp01(0.88 + meso * 0.1),
      height: clamp01(0.36 + macro * 0.24 + meso * 0.22 - pit * 0.3),
      ao: clamp01(0.66 + macro * 0.2 + meso * 0.1 - pit * 0.18),
    };
  }

  if (kind === 'moss') {
    const tuft = Math.pow(meso, 1.55);
    return {
      albedo: clamp01(0.38 + macro * 0.28 + tuft * 0.22),
      roughness: clamp01(0.9 + micro * 0.1),
      height: clamp01(0.2 + tuft * 0.66 + micro * 0.12),
      ao: clamp01(0.5 + macro * 0.24 + tuft * 0.2),
    };
  }

  if (kind === 'fruit' || kind === 'wax') {
    const dimple = speck > 0.985 ? 0.24 : 0;
    return {
      albedo: clamp01(0.68 + macro * 0.18 + meso * 0.08 - dimple * 0.18),
      roughness: clamp01((kind === 'wax' ? 0.4 : 0.3) + meso * 0.25),
      height: clamp01(0.5 + meso * 0.12 + micro * 0.07 - dimple),
      ao: clamp01(0.75 + macro * 0.16 - dimple * 0.12),
    };
  }

  return {
    albedo: clamp01(0.72 + macro * 0.18 + micro * 0.08),
    roughness: clamp01(0.62 + meso * 0.26),
    height: clamp01(0.42 + meso * 0.35 + micro * 0.12),
    ao: clamp01(0.72 + macro * 0.2),
  };
}

function makeTexture(bytes, colorSpace, repeat, name) {
  const texture = new THREE.DataTexture(
    bytes,
    SURFACE_RESOLUTION,
    SURFACE_RESOLUTION,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = name;
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function buildSurfaceMaps(kind) {
  const recipe = SURFACE_RECIPES[kind] ?? SURFACE_RECIPES.generic;
  const pixelCount = SURFACE_RESOLUTION * SURFACE_RESOLUTION;
  const albedoBytes = new Uint8Array(pixelCount * 4);
  const roughnessBytes = new Uint8Array(pixelCount * 4);
  const aoBytes = new Uint8Array(pixelCount * 4);
  const height = new Float32Array(pixelCount);

  for (let y = 0; y < SURFACE_RESOLUTION; y += 1) {
    for (let x = 0; x < SURFACE_RESOLUTION; x += 1) {
      const index = y * SURFACE_RESOLUTION + x;
      const u = x / SURFACE_RESOLUTION;
      const v = y / SURFACE_RESOLUTION;
      const albedoSignal = surfaceSignal(kind, u, v, 17).albedo;
      const roughnessSignal = surfaceSignal(kind, u, v, 79).roughness;
      const heightSignal = surfaceSignal(kind, u, v, 149).height;
      const aoSignal = surfaceSignal(kind, u, v, 239).ao;
      height[index] = heightSignal;
      for (const [bytes, signal] of [
        [albedoBytes, albedoSignal],
        [roughnessBytes, roughnessSignal],
        [aoBytes, aoSignal],
      ]) {
        const value = Math.round(clamp01(signal) * 255);
        bytes[index * 4] = value;
        bytes[index * 4 + 1] = value;
        bytes[index * 4 + 2] = value;
        bytes[index * 4 + 3] = 255;
      }
    }
  }

  const normalBytes = new Uint8Array(pixelCount * 4);
  const sampleHeight = (x, y) => height[
    ((y + SURFACE_RESOLUTION) % SURFACE_RESOLUTION) * SURFACE_RESOLUTION
    + ((x + SURFACE_RESOLUTION) % SURFACE_RESOLUTION)
  ];
  for (let y = 0; y < SURFACE_RESOLUTION; y += 1) {
    for (let x = 0; x < SURFACE_RESOLUTION; x += 1) {
      const index = y * SURFACE_RESOLUTION + x;
      const dx = (sampleHeight(x + 1, y) - sampleHeight(x - 1, y)) * 3.2;
      const dy = (sampleHeight(x, y + 1) - sampleHeight(x, y - 1)) * 3.2;
      const normal = new THREE.Vector3(-dx, -dy, 1).normalize();
      normalBytes[index * 4] = Math.round((normal.x * 0.5 + 0.5) * 255);
      normalBytes[index * 4 + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
      normalBytes[index * 4 + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
      normalBytes[index * 4 + 3] = 255;
    }
  }

  const maps = {
    albedo: makeTexture(albedoBytes, THREE.SRGBColorSpace, recipe.repeat, `${kind}.albedo`),
    roughness: makeTexture(roughnessBytes, THREE.NoColorSpace, recipe.repeat, `${kind}.roughness`),
    normal: makeTexture(normalBytes, THREE.NoColorSpace, recipe.repeat, `${kind}.normal`),
    ao: makeTexture(aoBytes, THREE.NoColorSpace, recipe.repeat, `${kind}.ao`),
  };
  maps.ao.channel = 1;
  return maps;
}

function referenceAlbedo(kind, repeat) {
  const url = REFERENCE_ALBEDO_URLS[kind];
  if (!url || typeof document === 'undefined') return null;
  if (!REFERENCE_ALBEDO_CACHE.has(kind)) {
    const texture = new THREE.TextureLoader().load(url, (loaded) => {
      REFERENCE_TEXTURE_READY.add(loaded);
      for (const assignment of REFERENCE_ROTATION_ASSIGNMENTS.get(loaded) ?? []) {
        const rotated = loaded.clone();
        rotated.center.set(0.5, 0.5);
        rotated.rotation = assignment.rotation;
        rotated.offset.set(assignment.offset[0], assignment.offset[1]);
        rotated.repeat.multiply(new THREE.Vector2(
          assignment.repeatScale[0],
          assignment.repeatScale[1],
        ));
        rotated.needsUpdate = true;
        assignment.material[assignment.key] = rotated;
        assignment.material.needsUpdate = true;
      }
      REFERENCE_ROTATION_ASSIGNMENTS.delete(loaded);
    });
    texture.name = `${kind}.reference-albedo`;
    texture.userData.referenceSource = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    REFERENCE_ALBEDO_CACHE.set(kind, texture);
  }
  return REFERENCE_ALBEDO_CACHE.get(kind);
}

export function surfaceMaterial(kind, color, options = {}) {
  const recipe = SURFACE_RECIPES[kind] ?? SURFACE_RECIPES.generic;
  if (!SURFACE_TEXTURE_CACHE.has(kind)) {
    SURFACE_TEXTURE_CACHE.set(kind, buildSurfaceMaps(kind));
  }
  const maps = SURFACE_TEXTURE_CACHE.get(kind);
  const sourceAlbedo = referenceAlbedo(kind, recipe.repeat);
  const tint = new THREE.Color(color);
  if (sourceAlbedo) {
    const tintBlend = {
      stone: 0.08,
      'inner-stone': 0.04,
      wood: 0.63,
      clay: 0.16,
      'forged-iron': 0.56,
      'worn-iron': 0.63,
    }[kind] ?? 0.6;
    tint.lerp(new THREE.Color(0xffffff), tintBlend);
  }
  const material = new THREE.MeshPhysicalMaterial({
    color: tint,
    map: sourceAlbedo ?? maps.albedo,
    roughness: 1,
    roughnessMap: maps.roughness,
    metalness: recipe.metalness,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(recipe.normalScale, recipe.normalScale),
    aoMap: maps.ao,
    aoMapIntensity: 0.62,
    envMapIntensity: recipe.metalness > 0.5 ? 0.82 : 0.48,
    clearcoat: kind === 'clay' ? 0.08 : kind === 'brass' ? 0.18 : 0,
    clearcoatRoughness: kind === 'clay' ? 0.72 : 0.28,
    ...options,
  });
  material.name = options.name ?? `${kind}-${new THREE.Color(color).getHexString()}`;
  material.userData.surfaceKind = kind;
  material.userData.referenceAlbedo = Boolean(sourceAlbedo);
  return material;
}

export function transformMaterialMaps(material, {
  rotation = 0,
  offset = [0, 0],
  repeatScale = [1, 1],
} = {}) {
  const clone = material.clone();
  for (const key of ['map', 'roughnessMap', 'metalnessMap', 'normalMap', 'aoMap']) {
    const source = material[key];
    if (!source) continue;
    if (source.userData?.referenceSource && !REFERENCE_TEXTURE_READY.has(source)) {
      const assignments = REFERENCE_ROTATION_ASSIGNMENTS.get(source) ?? [];
      assignments.push({
        material: clone,
        key,
        rotation,
        offset,
        repeatScale,
      });
      REFERENCE_ROTATION_ASSIGNMENTS.set(source, assignments);
      clone[key] = source;
      continue;
    }
    const texture = source.clone();
    texture.center.set(0.5, 0.5);
    texture.rotation = rotation;
    texture.offset.set(offset[0], offset[1]);
    texture.repeat.multiply(new THREE.Vector2(repeatScale[0], repeatScale[1]));
    texture.needsUpdate = true;
    clone[key] = texture;
  }
  clone.name = `${material.name}.rotated-${rotation.toFixed(3)}`;
  return clone;
}

export function rotateMaterialMaps(material, rotation) {
  return transformMaterialMaps(material, { rotation });
}

export function makePropRoot(name, version) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.kind = 'prop';
  root.userData.gen = version;
  root.userData.heroVersion = version;
  root.userData.sculptRuntime = {
    nodes: {},
    sockets: {},
    colliders: [],
    destructionGroups: {},
  };
  return root;
}

export function registerNode(root, id, node, {
  collider = null,
  destructionGroup = 'body',
} = {}) {
  node.name = id;
  node.userData.sculptId = id;
  root.userData.sculptRuntime.nodes[id] = node;
  if (collider) {
    root.userData.sculptRuntime.colliders.push({ id, ...collider });
  }
  if (!root.userData.sculptRuntime.destructionGroups[destructionGroup]) {
    root.userData.sculptRuntime.destructionGroups[destructionGroup] = [];
  }
  root.userData.sculptRuntime.destructionGroups[destructionGroup].push(id);
  return node;
}

export function addSocket(root, parent, id, position) {
  const socket = new THREE.Object3D();
  socket.name = id;
  socket.position.copy(position);
  parent.add(socket);
  root.userData.sculptRuntime.sockets[id] = socket;
  return socket;
}

export function finishHeroProp(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    const uv = object.geometry?.getAttribute?.('uv');
    if (uv && !object.geometry.getAttribute('uv1')) {
      object.geometry.setAttribute('uv1', uv.clone());
    }
    if (uv && !object.geometry.getAttribute('uv2')) {
      object.geometry.setAttribute('uv2', uv.clone());
    }
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.material?.transparent) object.castShadow = false;
  });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (Number.isFinite(box.min.y) && Math.abs(box.min.y) > 1e-5) {
    root.position.y -= box.min.y;
  }
  root.updateMatrixWorld(true);
  return root;
}

export function chamferedBoxGeometry(width, height, depth, chamfer = 0.04) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const cut = Math.min(chamfer, halfW * 0.45, halfH * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-halfW + cut, -halfH);
  shape.lineTo(halfW - cut, -halfH);
  shape.lineTo(halfW, -halfH + cut);
  shape.lineTo(halfW, halfH - cut);
  shape.lineTo(halfW - cut, halfH);
  shape.lineTo(-halfW + cut, halfH);
  shape.lineTo(-halfW, halfH - cut);
  shape.lineTo(-halfW, -halfH + cut);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: Math.min(cut * 0.32, depth * 0.08),
    bevelSize: Math.min(cut * 0.22, depth * 0.06),
    bevelSegments: 1,
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

export function chamferedBox(width, height, depth, material, chamfer = 0.04) {
  return new THREE.Mesh(
    chamferedBoxGeometry(width, height, depth, chamfer),
    material,
  );
}

export function taperedBoxGeometry(bottomWidth, bottomDepth, topWidth, topDepth, height) {
  const bw = bottomWidth * 0.5;
  const bd = bottomDepth * 0.5;
  const tw = topWidth * 0.5;
  const td = topDepth * 0.5;
  const positions = [
    -bw, 0, -bd, bw, 0, -bd, bw, 0, bd, -bw, 0, bd,
    -tw, height, -td, tw, height, -td, tw, height, td, -tw, height, td,
  ];
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function beamBetween(start, end, radius, material, segments = 8) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.03, length, segments),
    material,
  );
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return mesh;
}

export function tubeFromPoints(points, radius, material, {
  tubularSegments = 24,
  radialSegments = 7,
  closed = false,
} = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed),
    material,
  );
}

export function torus(radius, tube, material, radialSegments = 8, tubularSegments = 24, arc = Math.PI * 2) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc),
    material,
  );
}

export function bolt(radius, depth, material) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 8),
    material,
  );
  return mesh;
}

export function gablePrismGeometry(width, depth, wallHeight, ridgeHeight) {
  const halfW = width * 0.5;
  const halfD = depth * 0.5;
  const positions = [
    -halfW, 0, -halfD,
    halfW, 0, -halfD,
    halfW, 0, halfD,
    -halfW, 0, halfD,
    0, ridgeHeight, -halfD,
    0, ridgeHeight, halfD,
    -halfW, wallHeight, -halfD,
    halfW, wallHeight, -halfD,
    halfW, wallHeight, halfD,
    -halfW, wallHeight, halfD,
  ];
  const indices = [
    0, 1, 2, 0, 2, 3,
    0, 6, 4, 0, 4, 1,
    3, 2, 5, 3, 5, 9,
    6, 7, 4, 9, 5, 8,
    6, 9, 8, 6, 8, 7,
    7, 8, 5, 7, 5, 4,
    0, 3, 9, 0, 9, 6,
    1, 4, 5, 1, 5, 2,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addWoodGrainRidges(parent, {
  width,
  height,
  depth,
  material,
  count = 4,
  axis = 'y',
} = {}) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 1) / (count + 1);
    const ridge = chamferedBox(
      axis === 'y' ? width * (0.55 + (i % 2) * 0.16) : 0.014,
      axis === 'y' ? 0.014 : height * (0.55 + (i % 2) * 0.16),
      depth + 0.006,
      material,
      0.006,
    );
    if (axis === 'y') {
      ridge.position.set((i % 2 ? -1 : 1) * width * 0.08, -height * 0.5 + t * height, depth * 0.5);
    } else {
      ridge.position.set(-width * 0.5 + t * width, (i % 2 ? -1 : 1) * height * 0.08, depth * 0.5);
    }
    parent.add(ridge);
  }
}
