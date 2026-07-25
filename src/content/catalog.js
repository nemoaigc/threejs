/**
 * P0 enabled content ids for this slice.
 * Add a row here when a new actor/animal/building is ready — no main.js edits.
 */

export const PLAYER_ID = 'actors.hunter_f';

/** Runtime catalog: which packs the slice actually loads. */
export const CATALOG_P0 = Object.freeze({
  player: PLAYER_ID,
  // Future: companions: ['animals.cat_stray'],
  // buildings come from layouts → registry builders for now
});
