/**
 * Mushoku Tensei village-slice P0 — Buena / Roa countryside feel (meters, sole@y=0).
 * Spec: docs/SCENE_SPEC_MUSHOKU.zh.md
 *
 * Rules baked in:
 * - plaza center stays clear of L/XL buildings
 * - landmarks spaced with breathing room (not stacked at 0,0)
 * - roads are segmented lines (plantRoadLine), not one giant slab
 */

export const MUSHOKU_SLICE_P0 = {
  meta: {
    name: 'mushoku-buena-roa-slice-p0',
    playableHalfExtent: 32,
    roadWidthMain: 5.2,
    plazaSize: 14,
  },

  roads: [
    { id: 'road.ew', x0: -32, z0: 0, x1: 32, z1: 0, width: 5.2, step: 5 },
    { id: 'road.ns', x0: 0, z0: -32, x1: 0, z1: 32, width: 5.2, step: 5 },
    { id: 'road.alley.n', x0: -24, z0: 18, x1: 24, z1: 18, width: 3.4, step: 5 },
    { id: 'road.alley.s', x0: -24, z0: -18, x1: 24, z1: -18, width: 3.4, step: 5 },
  ],

  places: [
    // B plaza — no tall building at origin
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
    {
      id: 'prop.plaza_well',
      type: 'well',
      x: -3.5,
      z: 2.0,
      yaw: 0.2,
      footprintWxD: [1.6, 1.6],
      heightHint: 'S',
      zone: 'B',
      priority: 'P0',
    },

    // C landmarks — north view cone from hero spawn (0, 6) looking −Z
    {
      id: 'landmark.adventurers_guild',
      type: 'adventurersGuild',
      x: -16,
      z: -12,
      yaw: 0.55, // face plaza / southeast
      footprintWxD: [10, 8],
      heightHint: 'L',
      zone: 'C',
      priority: 'P0',
    },
    {
      id: 'landmark.temple',
      type: 'temple',
      x: 6,
      z: -22,
      yaw: 0.15, // long facade readable from plaza
      footprintWxD: [16, 10],
      heightHint: 'L',
      zone: 'C',
      priority: 'P0',
    },
    {
      id: 'landmark.inn',
      type: 'inn',
      x: 14,
      z: -8,
      yaw: -0.4, // face plaza / southwest
      footprintWxD: [6, 5],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },

    // A main-street shops (set back from cross, do not wall the plaza)
    {
      id: 'shop.magic',
      type: 'shopMagic',
      x: 16,
      z: 5.5,
      yaw: Math.PI,
      footprintWxD: [4, 4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },
    {
      id: 'shop.smithy',
      type: 'shopSmithy',
      x: -16,
      z: 5.5,
      yaw: Math.PI,
      footprintWxD: [4.5, 4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },
    {
      id: 'shop.general',
      type: 'shopGeneral',
      x: -14,
      z: -5.5,
      yaw: 0,
      footprintWxD: [4, 4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },

    {
      id: 'prop.carriage_e',
      type: 'carriageStop',
      x: 9,
      z: 3.2,
      yaw: Math.PI,
      footprintWxD: [3, 1.2],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },
    {
      id: 'prop.carriage_w',
      type: 'carriageStop',
      x: -9,
      z: 3.2,
      yaw: Math.PI,
      footprintWxD: [3, 1.2],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    },

    {
      id: 'prop.quest_board',
      type: 'questBoard',
      x: -4.5,
      z: 4.5,
      yaw: 0.5,
      footprintWxD: [1.0, 0.4],
      heightHint: 'S',
      zone: 'B',
      priority: 'P0',
    },

    // D skyline ring — distant keep / castle silhouettes
    {
      id: 'skyline.keep_a',
      type: 'skylineKeep',
      x: -30,
      z: -26,
      yaw: 0.1,
      footprintWxD: [7, 7],
      heightHint: 'XL',
      zone: 'D',
      priority: 'P0',
      variant: 0,
    },
    {
      id: 'skyline.keep_b',
      type: 'skylineKeep',
      x: 32,
      z: -14,
      yaw: -0.2,
      footprintWxD: [6, 6],
      heightHint: 'XL',
      zone: 'D',
      priority: 'P0',
      variant: 1,
    },
    {
      id: 'skyline.keep_c',
      type: 'skylineKeep',
      x: 18,
      z: -34,
      yaw: 0,
      footprintWxD: [8, 6],
      heightHint: 'XL',
      zone: 'D',
      priority: 'P0',
      variant: 2,
    },

    // sparse D-zone cottage silhouettes
    {
      id: 'cottage.mid_nw',
      type: 'cottageSilhouette',
      x: -26,
      z: 18,
      yaw: Math.PI * 0.15,
      footprintWxD: [10, 7],
      heightHint: 'L',
      zone: 'D',
      priority: 'P1',
    },
    {
      id: 'cottage.mid_ne',
      type: 'cottageSilhouette',
      x: 26,
      z: 16,
      yaw: -0.4,
      footprintWxD: [9, 7],
      heightHint: 'L',
      zone: 'D',
      priority: 'P1',
    },

    // lantern posts along main axes
    ...lanternsAlongMain(),

    // trees with fixed positions
    { id: 'tree.n1', type: 'tree', x: -10, z: 4.2, yaw: 0.3, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.n2', type: 'tree', x: 10, z: 4.2, yaw: 1.1, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.s1', type: 'tree', x: -8, z: -4.5, yaw: 2.0, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.s2', type: 'tree', x: 8, z: -4.5, yaw: 0.7, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.guild1', type: 'tree', x: -12, z: -16, yaw: 0.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.inn1', type: 'tree', x: 18, z: -10, yaw: 1.4, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'A', priority: 'P0' },
    { id: 'tree.temple1', type: 'tree', x: 0, z: -18, yaw: 0.5, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
    { id: 'tree.temple2', type: 'tree', x: 14, z: -18, yaw: 2.2, footprintWxD: [1.5, 1.5], heightHint: 'S', zone: 'C', priority: 'P0' },
  ],
};

function lanternsAlongMain() {
  const lights = [];
  const xs = [-24, -16, -10, 10, 16, 24];
  for (const x of xs) {
    lights.push({
      id: `light.n.${x}`,
      type: 'streetLight',
      x,
      z: 2.6,
      yaw: 0,
      footprintWxD: [0.4, 0.4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    });
    lights.push({
      id: `light.s.${x}`,
      type: 'streetLight',
      x,
      z: -2.6,
      yaw: Math.PI,
      footprintWxD: [0.4, 0.4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    });
  }
  const zs = [-24, -16, -10, 10, 16, 24];
  for (const z of zs) {
    if (Math.abs(z) < 6) continue;
    lights.push({
      id: `light.e.${z}`,
      type: 'streetLight',
      x: 2.6,
      z,
      yaw: Math.PI / 2,
      footprintWxD: [0.4, 0.4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    });
    lights.push({
      id: `light.w.${z}`,
      type: 'streetLight',
      x: -2.6,
      z,
      yaw: -Math.PI / 2,
      footprintWxD: [0.4, 0.4],
      heightHint: 'S',
      zone: 'A',
      priority: 'P0',
    });
  }
  return lights;
}
