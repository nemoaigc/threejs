/**
 * Building entity surface.
 * - Hero landmarks: procedural factories matching docs/references/heroes/*
 * - External GLB: wire via createBuildingEntity when manifests exist
 * - Layout type string still resolved in world.buildByType
 */
import * as THREE from 'three';
import { Kind } from '../../content/kinds.js';
import { createHeroBuilding, HERO_BUILDERS } from './heroes/index.js';

/**
 * @param {object} manifest
 * @returns {Promise<import('../types.js').Entity>}
 */
export async function createBuildingEntity(manifest = {}) {
  const type = manifest.heroType || manifest.type;
  if (type && HERO_BUILDERS[type]) {
    const group = createHeroBuilding(type);
    return {
      id: manifest.id || `buildings.${type}`,
      kind: Kind.BUILDING,
      group,
      update() {},
      dispose() {
        group.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) m.dispose?.();
          }
        });
      },
    };
  }

  if (manifest.url) {
    throw new Error('[building] GLB buildings not wired yet — set heroType or use layout builders');
  }

  throw new Error('[building] need heroType (adventurersGuild|temple|inn) or url');
}

export async function buildingFactory(manifest) {
  return createBuildingEntity(manifest);
}

export { createHeroBuilding, HERO_BUILDERS };
