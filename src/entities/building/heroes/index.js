/**
 * Hero / street buildings — Three.js factories (not photo planes).
 * Mushoku Buena/Roa slice: guild · temple · inn · shops · carriage.
 */
import { createAdventurersGuildHero } from './adventurers_guild.js';
import { createTempleHero } from './temple.js';
import { createInnHero } from './inn.js';
import { createMagicShopHero } from './magic_shop.js';
import { createSmithyHero } from './smithy.js';
import { createGeneralShopHero } from './general_shop.js';
import { createCarriageStopHero } from './carriage_stop.js';

export const HERO_BUILDERS = {
  adventurersGuild: createAdventurersGuildHero,
  temple: createTempleHero,
  inn: createInnHero,
  shopMagic: createMagicShopHero,
  shopSmithy: createSmithyHero,
  shopGeneral: createGeneralShopHero,
  carriageStop: createCarriageStopHero,
};

/**
 * @param {keyof typeof HERO_BUILDERS} type
 * @returns {import('three').Group|null}
 */
export function createHeroBuilding(type) {
  const fn = HERO_BUILDERS[type];
  if (!fn) return null;
  const g = fn();
  if (g) {
    g.userData.heroMode = g.userData.heroMode || 'agent-gen';
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
  createMagicShopHero,
  createSmithyHero,
  createGeneralShopHero,
  createCarriageStopHero,
};
