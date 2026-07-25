/**
 * Photo-facade heroes — put the actual reference product renders into the scene.
 *
 * Until img2threejs (or hand mesh) replaces these, each landmark is:
 *   - a simple depth mass (casts shadow, readable under outline)
 *   - a large front plane textured with public/content/buildings/<id>/ref_main.png
 *
 * This is intentionally unmistakable vs old procedural boxes.
 */
import * as THREE from 'three';
import { finishProp, makeToon, box } from '../toon.js';

const BASE = import.meta.env.BASE_URL || '/';
const loader = new THREE.TextureLoader();

const SPECS = {
  adventurersGuild: {
    name: 'hero.adventurers_guild',
    url: `${BASE}content/buildings/adventurers_guild/ref_main.png`,
    // world size of the photo plane (width × height)
    planeW: 14,
    planeH: 14,
    // depth box behind photo
    depth: 6,
    bodyColor: 0x8b5e3c,
  },
  temple: {
    name: 'hero.temple',
    url: `${BASE}content/buildings/temple/ref_main.png`,
    planeW: 16,
    planeH: 18,
    depth: 8,
    bodyColor: 0xe8e0d0,
  },
  inn: {
    name: 'hero.inn',
    url: `${BASE}content/buildings/inn/ref_main.png`,
    planeW: 11,
    planeH: 11,
    depth: 5,
    bodyColor: 0xc4a070,
  },
};

const textureCache = new Map();

function loadTex(url) {
  if (textureCache.has(url)) return Promise.resolve(textureCache.get(url));
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        textureCache.set(url, tex);
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

/**
 * Sync skeleton (placeholder mass) — used if texture still loading.
 * Async texture swaps material map on the facade mesh.
 * @param {'adventurersGuild'|'temple'|'inn'} type
 * @returns {THREE.Group}
 */
export function createPhotoFacadeHero(type) {
  const spec = SPECS[type];
  if (!spec) return null;

  const g = new THREE.Group();
  g.name = spec.name;
  g.userData.heroPhoto = true;
  g.userData.heroType = type;

  const { planeW, planeH, depth, bodyColor } = spec;

  // Ground plinth
  box(g, planeW * 0.95, 0.35, depth + 0.8, 0, 0.175, 0, 0x9a9080);

  // Depth mass — sits behind the photo so outline has volume
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(planeW * 0.72, planeH * 0.78, depth),
    makeToon(bodyColor),
  );
  body.position.set(0, 0.35 + (planeH * 0.78) / 2, -depth * 0.35);
  g.add(body);

  // Photo facade — faces +Z (toward hero camera when yaw≈0)
  const facadeGeo = new THREE.PlaneGeometry(planeW, planeH);
  const facadeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
    toneMapped: false,
  });
  const facade = new THREE.Mesh(facadeGeo, facadeMat);
  facade.position.set(0, 0.35 + planeH / 2, depth * 0.15 + 0.05);
  facade.name = 'hero.photo_facade';
  // still cast a bit of presence for outline pass via a thin box frame
  g.add(facade);

  // Frame so outline always has hard edges around the photo
  const frameT = 0.18;
  const frameC = 0x2a2430;
  const zf = facade.position.z + 0.02;
  const fy = facade.position.y;
  box(g, planeW + frameT * 2, frameT, 0.2, 0, fy + planeH / 2 + frameT / 2, zf, frameC);
  box(g, planeW + frameT * 2, frameT, 0.2, 0, fy - planeH / 2 - frameT / 2, zf, frameC);
  box(g, frameT, planeH, 0.2, -planeW / 2 - frameT / 2, fy, zf, frameC);
  box(g, frameT, planeH, 0.2, planeW / 2 + frameT / 2, fy, zf, frameC);

  // Async texture
  loadTex(spec.url)
    .then((tex) => {
      facadeMat.map = tex;
      facadeMat.needsUpdate = true;
    })
    .catch((err) => {
      console.error(`[hero] failed to load photo facade ${spec.url}`, err);
      facadeMat.color.set(0xff00aa); // fail loud
    });

  // Small ground label plate (debug-readable even without texture)
  box(g, 3.2, 0.12, 0.8, 0, 0.4, depth * 0.5 + 1.2, 0x1a2430);

  return finishProp(g);
}

export function isPhotoHeroType(type) {
  return Boolean(SPECS[type]);
}
