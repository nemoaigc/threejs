/**
 * Prop catalog — batch-produced street dressing.
 * Layout `type` keys map here. Unknown types stay off the stage (empty > junk).
 */
import {
  createAnvilWorkstationModel,
  createBarrelClusterModel,
  createCrateStackModel,
  createCrystalCrateModel,
  createFenceSectionModel,
  createFlowerPlanterModel,
  createGrainSackPileModel,
  createHandcartModel,
  createHayBaleStackModel,
  createHitchingPostModel,
  createHorseWaterTroughModel,
  createProduceMarketStallModel,
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
  sackPile: createGrainSackPileModel,
  handcart: createHandcartModel,
  hayBale: createHayBaleStackModel,
  marketStall: createProduceMarketStallModel,
  horseTrough: createHorseWaterTroughModel,

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
