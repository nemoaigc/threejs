/**
 * Register all known factories once at app start.
 * Adding a new actor = new manifest + register() line (or auto-scan later).
 */
import { register } from './registry.js';
import { actorFactory } from '../entities/character/index.js';
import { animalFactory } from '../entities/animal/index.js';
import { buildingFactory } from '../entities/building/index.js';
import hunterManifest from './manifests/hunter_f.js';

let done = false;

export function bootstrapContent() {
  if (done) return;
  done = true;

  register('actors.hunter_f', async (m) =>
    actorFactory({ ...hunterManifest, ...m, id: 'actors.hunter_f' }),
  );

  // Hero buildings (layout types still drive placement; catalog ids for direct spawn)
  register('buildings.adventurers_guild', (m) =>
    buildingFactory({ ...m, id: 'buildings.adventurers_guild', heroType: 'adventurersGuild' }),
  );
  register('buildings.temple', (m) =>
    buildingFactory({ ...m, id: 'buildings.temple', heroType: 'temple' }),
  );
  register('buildings.inn', (m) =>
    buildingFactory({ ...m, id: 'buildings.inn', heroType: 'inn' }),
  );

  // Placeholders so listIds() shows the pipeline surface area.
  register('animals._template', animalFactory);
  register('buildings._template', buildingFactory);
}

export { hunterManifest };
