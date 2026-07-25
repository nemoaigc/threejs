/**
 * @deprecated Prefer `createFromCatalog` / `entities/character`.
 * Thin re-export so old imports keep working during the refactor.
 */
import { createActorEntity } from './entities/character/index.js';

export async function createVRMCharacter(url) {
  return createActorEntity({
    id: 'actors.hunter_f',
    source: { model: url ?? `${import.meta.env.BASE_URL}character.vrm` },
  });
}

export function updateVRMCharacter(c, time, moving, dt, opts = {}) {
  c.update({
    time,
    dt,
    moving,
    loco: opts.loco ?? (moving ? 'walk' : 'idle'),
    orbitDelta: opts.orbitDelta,
  });
}
