/**
 * Mushoku Tensei village-slice P0 — breathable countryside, not a jammed plaza.
 *
 * img2threejs heroes are large (temple ~14×28×23). Layout uses plant scale +
 * wide spacing so footprints never overlap. Empty meadow > clutter.
 */
export const MUSHOKU_SLICE_P0 = {
  meta: {
    name: 'mushoku-buena-roa-slice-p0',
    playableHalfExtent: 48,
    roadWidthMain: 4.6,
    plazaSize: 12,
  },

  roads: [
    // shorter cross — don't pave the whole meadow
    { id: 'road.ew', x0: -22, z0: 0, x1: 22, z1: 0, width: 4.6, step: 5 },
    { id: 'road.ns', x0: 0, z0: -36, x1: 0, z1: 18, width: 4.6, step: 5 },
  ],

  places: [
    {
      id: 'plaza.core',
      type: 'plaza',
      x: 0,
      z: 0,
      yaw: 0,
      footprintWxD: [12, 12],
      heightHint: 'S',
      zone: 'B',
      priority: 'P0',
    },

    // Three landmarks — spaced so AABB never kiss (after plant scale)
    // guild west · temple deep north · inn east-southeast
    {
      id: 'landmark.adventurers_guild',
      type: 'adventurersGuild',
      x: -22,
      z: -14,
      yaw: 0.15,
      scale: 0.82,
      footprintWxD: [11, 8],
      heightHint: 'L',
      zone: 'C',
      priority: 'P0',
    },
    {
      id: 'landmark.temple',
      type: 'temple',
      x: 0,
      z: -34,
      yaw: 0.04,
      // factory is cathedral-scale; village slice needs ~0.55
      scale: 0.55,
      footprintWxD: [8, 13],
      heightHint: 'L',
      zone: 'C',
      priority: 'P0',
    },
    {
      id: 'landmark.inn',
      type: 'inn',
      x: 22,
      z: -12,
      yaw: -0.12,
      scale: 0.88,
      footprintWxD: [9, 7],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },

    // Main-street shops (Buena/Roa slice) — spaced off heroes
    {
      id: 'shop.magic',
      type: 'shopMagic',
      x: 18,
      z: 10,
      yaw: Math.PI,
      scale: 0.95,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },
    {
      id: 'shop.smithy',
      type: 'shopSmithy',
      x: -18,
      z: 10,
      yaw: Math.PI,
      scale: 0.95,
      footprintWxD: [5.5, 5],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },
    {
      id: 'shop.general',
      type: 'shopGeneral',
      x: -16,
      z: -5,
      yaw: 0.05,
      scale: 0.92,
      footprintWxD: [5, 4.5],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },
    {
      id: 'prop.carriage',
      type: 'carriageStop',
      x: 12,
      z: 5,
      yaw: Math.PI,
      scale: 1.0,
      footprintWxD: [6, 4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },

    // Only two distant cottages — not a ring of houses
    {
      id: 'cottage.nw',
      type: 'cottageGlb',
      x: -34,
      z: 14,
      yaw: Math.PI * 0.85,
      scale: 1.05,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'D',
      priority: 'P1',
    },
    {
      id: 'cottage.se',
      type: 'cottageGlb',
      x: 34,
      z: -28,
      yaw: -0.55,
      scale: 1.0,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'D',
      priority: 'P1',
    },

    // Sparse trees — clear pads around heroes, no mid-street clutter
    { id: 'tree.plaza.w', type: 'tree', x: -9, z: 6, yaw: 0.3, scale: 0.95, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.plaza.e', type: 'tree', x: 9, z: 6, yaw: 1.1, scale: 0.9, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.guild.sw', type: 'tree', x: -28, z: -20, yaw: 0.2, scale: 1.05, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.inn.ne', type: 'tree', x: 28, z: -6, yaw: 1.4, scale: 1.0, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.temple.w', type: 'tree', x: -12, z: -38, yaw: 0.5, scale: 1.1, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.temple.e', type: 'tree', x: 12, z: -38, yaw: 2.2, scale: 1.05, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.far.n', type: 'tree', x: -6, z: -48, yaw: 0.8, scale: 1.15, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'D', priority: 'P1' },
    { id: 'tree.far.s', type: 'tree', x: 18, z: 16, yaw: 1.7, scale: 1.0, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'D', priority: 'P1' },
  ],
};
