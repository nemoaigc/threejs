/**
 * id → async factory(manifest) => Entity
 * Buildings that are still procedural are registered from world builders later.
 */

const factories = new Map();

/**
 * @param {string} id
 * @param {(manifest: object, ctx?: object) => Promise<import('../entities/types.js').Entity>} factory
 */
export function register(id, factory) {
  if (factories.has(id)) console.warn(`[registry] overwrite ${id}`);
  factories.set(id, factory);
}

export function has(id) {
  return factories.has(id);
}

export function listIds() {
  return [...factories.keys()];
}

/**
 * @param {string} id
 * @param {object} [manifest]
 * @param {object} [ctx]
 */
export async function createFromCatalog(id, manifest = {}, ctx = {}) {
  const factory = factories.get(id);
  if (!factory) {
    throw new Error(`[registry] unknown id "${id}". Register it or add to catalog.`);
  }
  const entity = await factory({ id, ...manifest }, ctx);
  if (!entity?.group || typeof entity.update !== 'function') {
    throw new Error(`[registry] factory for "${id}" must return { group, update }`);
  }
  entity.id = entity.id ?? id;
  return entity;
}
