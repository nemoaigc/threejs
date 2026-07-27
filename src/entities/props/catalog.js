/**
 * Prop catalog — batch-produced street dressing.
 * Layout `type` keys map here. Unknown types stay off the stage (empty > junk).
 */
import {
  createHayBale,
  createSackPile,
} from './batch_p0.js';
import {
  createAnvilWorkstationModel,
  createBarrelClusterModel,
  createCrateStackModel,
  createCrystalCrateModel,
  createFenceSectionModel,
  createFlowerPlanterModel,
  createHandcartModel,
  createHitchingPostModel,
  createQuestBoardModel,
  createSignpostModel,
  createStreetLanternModel,
  createVillageBenchModel,
  createVillageWellModel,
  createWaystoneModel,
  createWoodpileModel,
} from './models/index.js';

/** @type {Record<string, () => import('three').Group>} */
export const PROP_BUILDERS = {
  // plaza / street furniture
  streetLight: createStreetLanternModel,
  lanternPost: createStreetLanternModel,
  questBoard: createQuestBoardModel,
  well: createVillageWellModel,
  bench: createVillageBenchModel,
  signpost: createSignpostModel,
  waystone: createWaystoneModel,
  planter: createFlowerPlanterModel,

  // cargo / market
  crateStack: createCrateStackModel,
  barrelCluster: createBarrelClusterModel,
  sackPile: createSackPile,
  handcart: createHandcartModel,
  hayBale: createHayBale,

  // craft / structure
  woodpile: createWoodpileModel,
  fenceSection: createFenceSectionModel,
  hitchingPost: createHitchingPostModel,
  anvilProp: createAnvilWorkstationModel,
  crystalCrate: createCrystalCrateModel,
};

export function createProp(type) {
  const fn = PROP_BUILDERS[type];
  if (!fn) return null;
  return fn();
}

export function listPropTypes() {
  return Object.keys(PROP_BUILDERS);
}
