/**
 * Hero buildings — reference-driven factories.
 * Refs: docs/references/heroes/{adventurers_guild,temple,inn}/ref_main.png
 *
 * Layout `type` → factory. Swap these for img2threejs output later without
 * changing mushoku-slice-p0.js coordinates.
 */
import { createAdventurersGuildHero } from './adventurers_guild.js';
import { createTempleHero } from './temple.js';
import { createInnHero } from './inn.js';

export const HERO_BUILDERS = {
  adventurersGuild: createAdventurersGuildHero,
  temple: createTempleHero,
  inn: createInnHero,
};

/**
 * @param {'adventurersGuild'|'temple'|'inn'} type
 * @returns {THREE.Group|null}
 */
export function createHeroBuilding(type) {
  const fn = HERO_BUILDERS[type];
  return fn ? fn() : null;
}

export { createAdventurersGuildHero, createTempleHero, createInnHero };
