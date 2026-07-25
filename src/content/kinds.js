/** Content kind enum — keep in sync with docs/CONTENT_PIPELINE.zh.md */

export const Kind = Object.freeze({
  ACTOR: 'actor',
  ANIMAL: 'animal',
  BUILDING: 'building',
  PROP: 'prop',
  FX: 'fx',
});

/**
 * Idle arm presets (local Euler XYZ deltas on rest).
 * |upperArm.z| larger → arms closer to body (hang down). Small |z| → T-pose open.
 */
export const IDLE_PRESETS = Object.freeze({
  /**
   * Hands down, close to body.
   * lowerArm.x > 0 bends elbow so forearm hangs along the torso (not stuck out).
   */
  soft_hang: {
    leftShoulder: [0.0, 0.005, 0.02],
    rightShoulder: [0.0, -0.005, -0.02],
    leftUpperArm: [0.06, 0.02, -1.28],
    rightUpperArm: [0.06, -0.02, 1.28],
    leftLowerArm: [0.55, 0.02, 0.06],
    rightLowerArm: [0.55, -0.02, -0.06],
    leftHand: [0.08, 0.02, 0.02],
    rightHand: [0.08, -0.02, -0.02],
  },
  little_girl_soft: {
    leftShoulder: [0.0, 0.005, 0.02],
    rightShoulder: [0.0, -0.005, -0.02],
    leftUpperArm: [0.06, 0.02, -1.28],
    rightUpperArm: [0.06, -0.02, 1.28],
    leftLowerArm: [0.55, 0.02, 0.06],
    rightLowerArm: [0.55, -0.02, -0.06],
    leftHand: [0.08, 0.02, 0.02],
    rightHand: [0.08, -0.02, -0.02],
  },
  neutral_hang: {
    leftShoulder: [0, 0, 0.05],
    rightShoulder: [0, 0, -0.05],
    leftUpperArm: [0.1, 0.04, -1.18],
    rightUpperArm: [0.1, -0.04, 1.18],
    leftLowerArm: [0.3, 0, 0.03],
    rightLowerArm: [0.3, 0, -0.03],
    leftHand: [0.06, 0, 0.02],
    rightHand: [0.06, 0, -0.02],
  },
  hero_ready: {
    leftShoulder: [0.02, 0.02, 0.05],
    rightShoulder: [0.02, -0.02, -0.05],
    leftUpperArm: [0.1, 0.05, -0.9],
    rightUpperArm: [0.1, -0.05, 0.9],
    leftLowerArm: [0.25, 0.02, 0.04],
    rightLowerArm: [0.25, -0.02, -0.04],
    leftHand: [0.06, 0.02, 0.02],
    rightHand: [0.06, -0.02, -0.02],
  },
});

/**
 * Phase B energy multipliers (see springs.js applyHairPhysics).
 * Idle is pure Phase A rest. Walk/run add subtle sway/trail/noise only —
 * stiffness floor in applyHairPhysics keeps hair returning to drape.
 */
export const LOCO_SPRING = Object.freeze({
  idle: { sway: 0.0, trail: 0.0, noise: 0.0 },
  walk: { sway: 0.62, trail: 0.7, noise: 0.22 },
  run: { sway: 0.82, trail: 0.9, noise: 0.28 },
  sprint: { sway: 0.95, trail: 1.0, noise: 0.32 },
});
