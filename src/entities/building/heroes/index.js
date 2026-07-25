/**
 * Hero buildings — photo-facade first (actual ref_main.png in scene).
 *
 * Refs: public/content/buildings/<id>/ref_main.png
 * (copied from docs/references/heroes/).
 *
 * Later: replace createPhotoFacadeHero with img2threejs factory output
 * under the same type keys — layout stays unchanged.
 */
import { createPhotoFacadeHero } from './photo_facade.js';

// Keep procedural modules available for A/B or fallback experiments
import { createAdventurersGuildHero } from './adventurers_guild.js';
import { createTempleHero } from './temple.js';
import { createInnHero } from './inn.js';

/** @type {'photo'|'procedural'} */
export const HERO_MODE = 'photo';

export const HERO_BUILDERS = {
  adventurersGuild: () =>
    HERO_MODE === 'photo'
      ? createPhotoFacadeHero('adventurersGuild')
      : createAdventurersGuildHero(),
  temple: () =>
    HERO_MODE === 'photo' ? createPhotoFacadeHero('temple') : createTempleHero(),
  inn: () =>
    HERO_MODE === 'photo' ? createPhotoFacadeHero('inn') : createInnHero(),
};

/**
 * @param {'adventurersGuild'|'temple'|'inn'} type
 * @returns {import('three').Group|null}
 */
export function createHeroBuilding(type) {
  const fn = HERO_BUILDERS[type];
  if (!fn) return null;
  const g = fn();
  if (g) {
    g.userData.heroMode = HERO_MODE;
    g.userData.heroVersion = 'photo-facade-v1';
  }
  return g;
}

export {
  createPhotoFacadeHero,
  createAdventurersGuildHero,
  createTempleHero,
  createInnHero,
};
