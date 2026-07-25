import * as THREE from 'three';
import { IDLE_PRESETS } from '../../content/kinds.js';

export const ARM_NAMES = [
  'leftShoulder',
  'rightShoulder',
  'leftUpperArm',
  'rightUpperArm',
  'leftLowerArm',
  'rightLowerArm',
  'leftHand',
  'rightHand',
];

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();

export function norm(vrm, name) {
  return vrm.humanoid?.getNormalizedBoneNode(name) ?? null;
}

export function raw(vrm, name) {
  return vrm.humanoid?.getRawBoneNode(name) ?? null;
}

/**
 * Build idle arm quaternions from a named preset (manifest.idle.preset).
 * @returns {Record<string, THREE.Quaternion>}
 */
export function buildIdleArmPose(vrm, presetName = 'soft_hang') {
  const table = IDLE_PRESETS[presetName] ?? IDLE_PRESETS.soft_hang;
  const hangN = {};
  for (const name of ARM_NAMES) {
    const n = norm(vrm, name);
    if (!n) continue;
    const d = table[name] ?? [0, 0, 0];
    _e.set(d[0], d[1], d[2], 'XYZ');
    hangN[name] = n.quaternion.clone().multiply(_q.setFromEuler(_e));
  }
  return hangN;
}

/**
 * Idle: full hang pose.
 * Walk: keep a visible Mixamo swing, pulled toward hang so it doesn't whip back.
 *
 * armSwingMix = how much Mixamo arm motion remains (0.5 = half Mixamo / half hang).
 */
export function applyArmPose(vrm, hangN, walkWeight, armSwingMix = 0.48) {
  if (walkWeight < 0.06) {
    vrm.humanoid.resetNormalizedPose();
    for (const name of ARM_NAMES) {
      const n = norm(vrm, name);
      if (n && hangN[name]) n.quaternion.copy(hangN[name]);
    }
    return;
  }

  // hangPull: 0 → pure Mixamo, 1 → pure hang.
  // Keep hang-dominant so walk doesn't fan arms wide; still leave Mixamo swing.
  const hangPull = THREE.MathUtils.clamp(1 - armSwingMix * walkWeight * 0.85, 0.35, 0.9);
  for (const name of ARM_NAMES) {
    const n = norm(vrm, name);
    const h = hangN[name];
    if (!n || !h) continue;
    // mixer already wrote Mixamo into n.quaternion; pull toward hang.
    n.quaternion.slerp(h, hangPull);
  }
}
