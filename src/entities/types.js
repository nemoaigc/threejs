/**
 * @typedef {'actor'|'animal'|'building'|'prop'|'fx'} EntityKind
 * @typedef {'idle'|'walk'|'run'|'sprint'} Loco
 *
 * @typedef {object} UpdateCtx
 * @property {number} time
 * @property {number} dt
 * @property {boolean} moving
 * @property {Loco} [loco]
 * @property {number} [orbitDelta]
 *
 * @typedef {object} Entity
 * @property {string} id
 * @property {EntityKind} kind
 * @property {import('three').Object3D} group
 * @property {(ctx: UpdateCtx) => void} update
 * @property {() => void} [dispose]
 * @property {boolean} [isVRM]
 * @property {number} [height]
 */

export {};
