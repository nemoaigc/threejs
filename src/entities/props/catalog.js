/**
 * Prop catalog — batch-produced street dressing.
 * Layout `type` keys map here. Unknown types stay off the stage (empty > junk).
 */
import {
  createQuestBoard,
  createCrateStack,
  createBarrelCluster,
  createWoodpile,
  createBench,
  createFenceSection,
  createHitchingPost,
  createWaystone,
  createHayBale,
  createSackPile,
  createSignpost,
  createPlanter,
  createAnvilProp,
  createCrystalCrate,
} from './batch_p0.js';
import {
  createHandcartModel,
  createStreetLanternModel,
  createVillageWellModel,
} from './models/index.js';

/** @type {Record<string, () => import('three').Group>} */
export const PROP_BUILDERS = {
  // plaza / street furniture
  streetLight: createStreetLanternModel,
  lanternPost: createStreetLanternModel,
  questBoard: createQuestBoard,
  well: createVillageWellModel,
  bench: createBench,
  signpost: createSignpost,
  waystone: createWaystone,
  planter: createPlanter,

  // cargo / market
  crateStack: createCrateStack,
  barrelCluster: createBarrelCluster,
  sackPile: createSackPile,
  handcart: createHandcartModel,
  hayBale: createHayBale,

  // craft / structure
  woodpile: createWoodpile,
  fenceSection: createFenceSection,
  hitchingPost: createHitchingPost,
  anvilProp: createAnvilProp,
  crystalCrate: createCrystalCrate,
};

export function createProp(type) {
  const fn = PROP_BUILDERS[type];
  if (!fn) return null;
  return fn();
}

export function listPropTypes() {
  return Object.keys(PROP_BUILDERS);
}
