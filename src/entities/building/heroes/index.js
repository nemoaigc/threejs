/**
 * Hero buildings — real procedural 3D (not photo planes).
 * Silhouette matched to docs/references/heroes/<id>/ref_main.png
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
 * @returns {import('three').Group|null}
 */
export function createHeroBuilding(type) {
  const fn = HERO_BUILDERS[type];
  if (!fn) return null;
  const g = fn();
  if (g) {
    g.userData.heroMode = g.userData.heroMode || 'agent-gen';
    // Prefer factory stamps (img2threejs-*-v2 / gen-guild-v2); never force solid-v3 over them
    if (!g.userData.heroVersion) {
      g.userData.heroVersion =
        g.userData.gen ||
        (type === 'adventurersGuild' ? 'gen-guild-v2' : 'solid-v3');
    }
  }
  return g;
}

export {
  createAdventurersGuildHero,
  createTempleHero,
  createInnHero,
};
