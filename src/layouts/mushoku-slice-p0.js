/**
 * Mushoku Tensei village-slice P0 — sparse hero stage only.
 *
 * Quality bar: do NOT plant box-junk props (wells, fake shops, keeps) until
 * they go through the same craft path as guild v2. Empty space > ugly clutter.
 */
export const MUSHOKU_SLICE_P0 = {
  meta: {
    name: 'mushoku-buena-roa-slice-p0',
    playableHalfExtent: 32,
    roadWidthMain: 5.2,
    plazaSize: 14,
  },

  roads: [
    { id: 'road.ew', x0: -28, z0: 0, x1: 28, z1: 0, width: 5.0, step: 5 },
    { id: 'road.ns', x0: 0, z0: -28, x1: 0, z1: 28, width: 5.0, step: 5 },
  ],

  places: [
    {
      id: 'plaza.core',
      type: 'plaza',
      x: 0,
      z: 0,
      yaw: 0,
      footprintWxD: [14, 14],
      heightHint: 'S',
      zone: 'B',
      priority: 'P0',
    },

    // Three landmarks only — guild is img2threejs v2; temple/inn still legacy but kept as heroes
    {
      id: 'landmark.adventurers_guild',
      type: 'adventurersGuild',
      x: -11,
      z: -10,
      yaw: 0.12,
      footprintWxD: [10, 8],
      heightHint: 'L',
      zone: 'C',
      priority: 'P0',
    },
    {
      id: 'landmark.temple',
      type: 'temple',
      x: 2,
      z: -16,
      yaw: 0.05,
      footprintWxD: [16, 10],
      heightHint: 'L',
      zone: 'C',
      priority: 'P0',
    },
    {
      id: 'landmark.inn',
      type: 'inn',
      x: 11,
      z: -9,
      yaw: -0.1,
      footprintWxD: [6, 5],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },

    // Sparse trees for scale — no lanterns / wells / shops / skyline junk
    { id: 'tree.n1', type: 'tree', x: -12, z: 5, yaw: 0.3, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.n2', type: 'tree', x: 12, z: 5, yaw: 1.1, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.guild1', type: 'tree', x: -16, z: -14, yaw: 0.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.inn1', type: 'tree', x: 16, z: -12, yaw: 1.4, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.temple1', type: 'tree', x: -4, z: -20, yaw: 0.5, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.temple2', type: 'tree', x: 10, z: -20, yaw: 2.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
  ],
};
