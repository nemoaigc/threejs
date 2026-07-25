/**
 * Mushoku Tensei village-slice P0 — sparse stage, quality over clutter.
 *
 * Heroes: guild (img2threejs) · temple/inn (pipeline next)
 * Filler: real GLB trees + house-*.glb cottages only (no box junk)
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

    // Three landmarks
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

    // Mid-distance cottages — house-*.glb (toonified), not box silhouettes
    {
      id: 'cottage.nw',
      type: 'cottageGlb',
      x: -22,
      z: 12,
      yaw: Math.PI * 0.85,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'D',
      priority: 'P1',
    },
    {
      id: 'cottage.ne',
      type: 'cottageGlb',
      x: 22,
      z: 10,
      yaw: -Math.PI * 0.9,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'D',
      priority: 'P1',
    },
    {
      id: 'cottage.sw',
      type: 'cottageGlb',
      x: -20,
      z: -20,
      yaw: 0.4,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'D',
      priority: 'P1',
    },
    {
      id: 'cottage.se',
      type: 'cottageGlb',
      x: 20,
      z: -22,
      yaw: -0.5,
      footprintWxD: [5, 5],
      heightHint: 'S',
      zone: 'D',
      priority: 'P1',
    },

    // Trees — public/models/tree-*.glb via loadTownAssets
    { id: 'tree.n1', type: 'tree', x: -12, z: 5, yaw: 0.3, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.n2', type: 'tree', x: 12, z: 5, yaw: 1.1, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.s1', type: 'tree', x: -7, z: -5, yaw: 2.0, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.s2', type: 'tree', x: 7, z: -5, yaw: 0.7, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.guild1', type: 'tree', x: -16, z: -14, yaw: 0.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.guild2', type: 'tree', x: -8, z: -15, yaw: 1.6, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.inn1', type: 'tree', x: 16, z: -12, yaw: 1.4, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.inn2', type: 'tree', x: 14, z: -4, yaw: 0.9, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.temple1', type: 'tree', x: -4, z: -20, yaw: 0.5, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.temple2', type: 'tree', x: 10, z: -20, yaw: 2.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.far.nw', type: 'tree', x: -26, z: 8, yaw: 0.4, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'D', priority: 'P1' },
    { id: 'tree.far.ne', type: 'tree', x: 26, z: 6, yaw: 1.8, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'D', priority: 'P1' },
    { id: 'tree.far.sw', type: 'tree', x: -24, z: -16, yaw: 2.5, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'D', priority: 'P1' },
    { id: 'tree.far.se', type: 'tree', x: 24, z: -18, yaw: 0.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'D', priority: 'P1' },
  ],
};
