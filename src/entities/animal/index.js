/**
 * Animal entity stub — implement when first cat/bird pack lands.
 * Pipeline: docs/CONTENT_PIPELINE.zh.md §3.3
 *
 * @param {object} manifest
 * @returns {Promise<import('../types.js').Entity>}
 */
export async function createAnimalEntity(manifest = {}) {
  throw new Error(
    `[animal] not implemented yet. Add GLB + clips for "${manifest.id ?? '?'}" per CONTENT_PIPELINE §3.3`,
  );
}

export async function animalFactory(manifest) {
  return createAnimalEntity(manifest);
}
