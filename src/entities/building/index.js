/**
 * External GLB building wrapper (optional).
 * Most P0 buildings stay as procedural builders in world.js and are
 * registered by type string in the layout table.
 *
 * Pipeline: docs/CONTENT_PIPELINE.zh.md §3.4
 */
export async function createBuildingEntity(/* manifest */) {
  throw new Error('[building] external GLB buildings not wired yet — use world builders + layout type');
}

export async function buildingFactory(manifest) {
  return createBuildingEntity(manifest);
}
