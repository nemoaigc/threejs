import * as THREE from 'three';
import { LOCO_SPRING } from '../../content/kinds.js';
import { raw } from './pose.js';

/**
 * ============================================================================
 * TWO-PHASE HAIR MODEL
 * ----------------------------------------------------------------------------
 * Phase A — Rest / silhouette (once at load, then idle each frame):
 *   1. reorientHairDown()  → bone local rest ≈ world-down drape
 *   2. tuneSpringBones()   → colliders + spring params; setInitState + reset
 *      so spring rest = draped pose (not VRM bind T-hair / outward shell)
 *   Idle: gravity nearly straight down, moderate stiffness — HOLD the drape.
 *   Do NOT call reorient every frame (that fights springs and kills 飘逸).
 *
 * Phase B — Locomotion liveliness (separate from rest shape):
 *   applyHairPhysics() adds small lateral gravity bias from smoothed velocity
 *   + yaw rate + per-chain phase noise. gravity.y stays ≤ -0.8 so volume
 *   cannot inflate into a helmet while walking.
 * ============================================================================
 */

const _g = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);
const _childW = new THREE.Vector3();
const _parentW = new THREE.Vector3();
const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qParent = new THREE.Quaternion();
const _qWorld = new THREE.Quaternion();
const _invParent = new THREE.Quaternion();

/** Floor for gravityDir.y while moving — prevents lift / shell inflate. */
const LOCO_GY_FLOOR = -0.82;

function boneName(joint) {
  return joint.bone?.name || '';
}

function isHairJoint(joint) {
  return /hair/i.test(boneName(joint));
}

function isSleeveOrBust(joint) {
  const n = boneName(joint).toLowerCase();
  return /topsupperarm|sleeve|bust|breast/.test(n);
}

function isShorts(joint) {
  const n = boneName(joint).toLowerCase();
  return /topsupperleg|skirt|short/.test(n);
}

/**
 * VRoid on this avatar: J_Sec_Hair{seg}_{group}
 * 01–04 fringe / bangs
 * 05–10 back / nape layers
 * 11–12 front shoulder locks (披肩前束)
 */
function hairGroupId(name) {
  const m = String(name).match(/Hair\d+_(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function hairSegId(name) {
  const m = String(name).match(/Hair(\d+)_/i);
  return m ? parseInt(m[1], 10) : 0;
}

function isBangJoint(joint) {
  if (!isHairJoint(joint)) return false;
  const g = hairGroupId(boneName(joint));
  return g >= 1 && g <= 4;
}

/** Front shoulder-length strands that should rest ON the jacket, not through it. */
function isFrontShoulderHair(joint) {
  if (!isHairJoint(joint) || isBangJoint(joint)) return false;
  const g = hairGroupId(boneName(joint));
  return g >= 11 && g <= 12;
}

function isBackHair(joint) {
  if (!isHairJoint(joint) || isBangJoint(joint)) return false;
  const g = hairGroupId(boneName(joint));
  return g >= 5 && g <= 10;
}

function isHairChainRoot(joint, hairSet) {
  const parent = joint.bone?.parent;
  if (!parent) return true;
  for (const other of hairSet) {
    if (other.bone === parent) return false;
  }
  return true;
}

function groupName(g) {
  return String(g?.name || '').toLowerCase();
}

function isBodyColliderGroup(g) {
  return /spine|chest|neck|head|hip|leg|thigh|bust|torso|upperchest|upperleg/.test(
    groupName(g),
  );
}

function isArmColliderGroup(g) {
  return /hand|finger|arm|elbow|wrist|forearm/.test(groupName(g));
}

/**
 * Phase A — modest body colliders only.
 * Large scales + big forward offset create a helmet shell that explodes long hair.
 * Caps: chest/spine ≤1.1, head ≤1.0, forward offset ≤0.005.
 */
function tuneCollidersForShoulderHair(vrm) {
  const mgr = vrm.springBoneManager;
  if (!mgr) return;

  const colliders = mgr.colliders || [];
  for (const col of colliders) {
    const shape = col.shape;
    if (!shape || typeof shape.radius !== 'number') continue;

    const cName = col.parent?.name || col.pivot?.name || col.name || '';
    const label = cName.toLowerCase();

    let scale = 1.0;
    if (/hand|finger/.test(label)) scale = 0.72;
    else if (/arm|elbow|wrist|forearm/.test(label)) scale = 0.82;
    else if (/head/.test(label)) scale = 0.98; // ≤1.0 — avoid bang balloon
    else if (/neck/.test(label)) scale = 1.04;
    else if (/upperchest|chest/.test(label)) scale = 1.08; // ≤1.1
    else if (/spine/.test(label)) scale = 1.06;
    else if (/leg|thigh|hip/.test(label)) scale = 1.04;
    else scale = 1.0;

    shape.radius *= scale;

    // Tiny forward nudge — soft jacket contact, not a shell (≤0.005).
    if (shape.offset && /upperchest|chest|spine/.test(label)) {
      shape.offset.z += 0.004;
    }
  }
}

/**
 * Phase A — reorient long hair toward world-down once at load.
 * Tiny front/back residual only for groups 11–12 vs 05–10.
 * Bangs: mild forehead hang on chain roots only.
 * Callers must follow with setInitState + reset (tuneSpringBones does this).
 */
export function reorientHairDown(vrm) {
  const mgr = vrm.springBoneManager;
  const joints = mgr?.joints ?? mgr?.springBones;
  if (!joints) return 0;

  const hairJoints = [...joints].filter(isHairJoint);
  const hairSet = new Set(hairJoints);
  let rotated = 0;

  for (const joint of hairJoints) {
    if (isBangJoint(joint)) continue;

    const bone = joint.bone;
    if (!bone) continue;
    bone.matrixAutoUpdate = true;

    const child =
      bone.children.find((c) => /hair/i.test(c.name || '')) || bone.children[0];
    if (!child) continue;
    child.matrixAutoUpdate = true;

    bone.updateWorldMatrix(true, false);
    child.updateWorldMatrix(true, false);
    bone.getWorldPosition(_parentW);
    child.getWorldPosition(_childW);
    _from.copy(_childW).sub(_parentW);
    if (_from.lengthSq() < 1e-10) continue;
    _from.normalize();

    const front = isFrontShoulderHair(joint);
    const side =
      Math.abs(_from.x) > 0.02
        ? Math.sign(_from.x)
        : front
          ? Math.sign(_parentW.x || 1)
          : Math.sign(_parentW.x || 0) * 0.5;

    if (front) {
      // Front locks (11–12): mostly world-down, tiny forward residual only.
      _to.set(side * 0.08, -1, 0.08).normalize();
    } else {
      // Back layers (05–10): mostly world-down, tiny back residual.
      _to.set(side * 0.1, -1, -0.1).normalize();
    }

    // Already hanging — leave rest pose alone.
    if (_from.dot(_to) > 0.92) continue;

    _q.setFromUnitVectors(_from, _to);
    bone.getWorldQuaternion(_qWorld);
    _qWorld.premultiply(_q);
    if (bone.parent) {
      bone.parent.matrixAutoUpdate = true;
      bone.parent.updateWorldMatrix(true, false);
      bone.parent.getWorldQuaternion(_qParent);
      _invParent.copy(_qParent).invert();
      bone.quaternion.copy(_invParent).multiply(_qWorld);
    } else {
      bone.quaternion.copy(_qWorld);
    }
    bone.updateMatrix();
    bone.updateWorldMatrix(true, true);
    rotated += 1;
  }

  // Bangs: mild forehead hang only on chain roots (do not yank mid-chain).
  for (const joint of hairJoints) {
    if (!isBangJoint(joint)) continue;
    if (!isHairChainRoot(joint, hairSet)) continue;
    const bone = joint.bone;
    if (!bone) continue;
    bone.matrixAutoUpdate = true;
    const child =
      bone.children.find((c) => /hair/i.test(c.name || '')) || bone.children[0];
    if (!child) continue;
    child.matrixAutoUpdate = true;
    bone.updateWorldMatrix(true, false);
    child.updateWorldMatrix(true, false);
    bone.getWorldPosition(_parentW);
    child.getWorldPosition(_childW);
    _from.copy(_childW).sub(_parentW);
    if (_from.lengthSq() < 1e-10) continue;
    _from.normalize();
    _to.set(_from.x * 0.15, -0.96, Math.max(0.06, _from.z * 0.2)).normalize();
    if (_from.dot(_to) > 0.94) continue;
    _q.setFromUnitVectors(_from, _to);
    bone.getWorldQuaternion(_qWorld);
    _qWorld.premultiply(_q);
    if (bone.parent) {
      bone.parent.getWorldQuaternion(_qParent);
      _invParent.copy(_qParent).invert();
      bone.quaternion.copy(_invParent).multiply(_qWorld);
    } else {
      bone.quaternion.copy(_qWorld);
    }
    bone.updateMatrix();
    bone.updateWorldMatrix(true, true);
    rotated += 1;
  }

  vrm.scene.updateMatrixWorld(true);
  return rotated;
}

/**
 * Phase A — bake spring rest = draped silhouette after reorientHairDown.
 * Idle spring profile: hang-biased gravity, moderate stiffness (holds drape).
 */
export function tuneSpringBones(vrm) {
  const mgr = vrm.springBoneManager;
  const joints = mgr?.joints ?? mgr?.springBones;
  if (!joints) return new Map();

  const head = raw(vrm, 'head');
  const hips = raw(vrm, 'hips');
  // Head center keeps long hair from lagging oddly when torso yaws.
  const center = head || hips;

  tuneCollidersForShoulderHair(vrm);

  const base = new Map();

  for (const joint of joints) {
    if (center) joint.center = center;

    const s = joint.settings;
    if (!s) continue;

    const name = boneName(joint);
    const hair = isHairJoint(joint);
    const bang = hair && isBangJoint(joint);
    const front = hair && isFrontShoulderHair(joint);
    const back = hair && isBackHair(joint);
    const sleeve = isSleeveOrBust(joint);
    const shorts = isShorts(joint);
    const groupId = hairGroupId(name);
    const segId = hairSegId(name);
    // Stable per-chain phase so strands don't move as one sheet.
    const chainPhase = groupId * 0.73 + segId * 0.31;

    if (sleeve) {
      s.stiffness = 1;
      s.dragForce = 1;
      s.gravityPower = 0;
      s.hitRadius = 0;
      continue;
    }

    if (hair) {
      if (!s.gravityDir) s.gravityDir = new THREE.Vector3(0, -1, 0);
      else s.gravityDir.set(0, -1, 0);

      if (bang) {
        // Short fringe: stiff enough to hold shape; neck/head colliders only.
        s.stiffness = 0.88;
        s.dragForce = 0.78;
        s.gravityPower = 0.2;
        s.hitRadius = 0.004;
        s.gravityDir.set(0, -1, 0.06).normalize();
        if (Array.isArray(joint.colliderGroups)) {
          joint.colliderGroups = joint.colliderGroups.filter((g) =>
            /neck|head/.test(groupName(g)),
          );
        }
      } else if (front) {
        // Front shoulder locks: drape-first rest gravity (mostly down).
        // hitRadius stays modest — large radii push strands into a shell.
        s.stiffness = 0.3;
        s.dragForce = 0.45;
        s.gravityPower = 1.12;
        s.hitRadius = Math.min(Math.max(s.hitRadius || 0.014, 0.012), 0.017);
        s.gravityDir.set(0, -0.997, 0.06).normalize();
        if (Array.isArray(joint.colliderGroups)) {
          joint.colliderGroups = joint.colliderGroups.filter(
            (g) => isBodyColliderGroup(g) && !isArmColliderGroup(g),
          );
        }
      } else {
        // Back / nape: hang behind clothes; soft contact only.
        s.stiffness = 0.26;
        s.dragForce = 0.42;
        s.gravityPower = 1.18;
        s.hitRadius = Math.min(Math.max(s.hitRadius || 0.014, 0.012), 0.018);
        s.gravityDir.set(0, -0.997, -0.08).normalize();
        if (Array.isArray(joint.colliderGroups)) {
          joint.colliderGroups = joint.colliderGroups.filter(
            (g) => isBodyColliderGroup(g) && !isArmColliderGroup(g),
          );
        }
      }
    } else if (shorts) {
      s.stiffness = 0.4;
      s.dragForce = 0.55;
      s.gravityPower = 0.3;
      s.hitRadius = Math.max(s.hitRadius || 0.02, 0.028);
    }

    base.set(joint, {
      stiffness: s.stiffness,
      dragForce: s.dragForce,
      gravityPower: s.gravityPower,
      gravityDir: s.gravityDir ? s.gravityDir.clone() : _down.clone(),
      hair,
      bang,
      front,
      back,
      shorts,
      chainPhase,
      groupId,
    });
  }

  // Bake draped pose as spring rest — do this once after reorient, never in loop.
  try {
    mgr.setInitState?.();
    mgr.reset?.();
  } catch (e) {
    console.warn('[springs] init failed:', e.message);
  }

  return base;
}

/**
 * Phase B — per-frame liveliness from locomotion (does not change rest shape).
 * @param {Map} base from tuneSpringBones
 * @param {{ windXZ?: {x:number,z:number}, yawRate?: number, loco?: string, time?: number }} opts
 */
export function applyHairPhysics(base, { windXZ, yawRate = 0, loco = 'idle', time = 0 }) {
  if (!base?.size) return;
  const cfg = LOCO_SPRING[loco] ?? LOCO_SPRING.idle;
  const idle = loco === 'idle';
  // Cap trail wind so Phase B never dominates hang gravity (shell risk).
  const wx = idle
    ? 0
    : THREE.MathUtils.clamp(windXZ?.x ?? 0, -0.5, 0.5);
  const wz = idle
    ? 0
    : THREE.MathUtils.clamp(windXZ?.z ?? 0, -0.5, 0.5);
  // Yaw rate → small lateral bias (body-turn fling), capped.
  const yawBias = idle ? 0 : THREE.MathUtils.clamp(yawRate, -2.5, 2.5) * 0.04;

  for (const [joint, b] of base) {
    if (!b.hair && !b.shorts) continue;
    const s = joint.settings;
    if (!s) continue;

    if (b.bang) {
      // Bangs stay quiet — only tiny idle hang bias.
      if (!s.gravityDir) s.gravityDir = new THREE.Vector3(0, -1, 0);
      else s.gravityDir.copy(b.gravityDir || _down);
      s.gravityPower = b.gravityPower;
      s.stiffness = b.stiffness;
      s.dragForce = b.dragForce;
      continue;
    }

    // ---- Idle: pure Phase A rest gravity (hold drape, no wind) ----
    if (idle) {
      if (!s.gravityDir) s.gravityDir = new THREE.Vector3();
      s.gravityDir.copy(b.gravityDir || _down);
      s.gravityPower = b.gravityPower;
      s.stiffness = b.stiffness;
      s.dragForce = b.dragForce;
      continue;
    }

    // ---- Walk/run: Phase B lateral bias on top of rest dir ----
    const phase = b.chainPhase ?? 0;
    // Per-chain phase: strands lag differently (not a rigid sheet) → 灵动.
    const jx = Math.sin(time * 3.4 + phase) * cfg.noise * 0.055;
    const jz = Math.cos(time * 2.9 + phase * 1.17) * cfg.noise * 0.05;
    // Extra tip-lag pulse on deeper segments (higher chainPhase).
    const pulse = Math.sin(time * 5.2 + phase * 2.1) * cfg.sway * 0.03;
    const baseG = b.gravityDir || _down;

    // Trail wind + yaw fling stay small vs hang; y from rest stays dominant.
    _g.set(
      baseG.x + wx * 0.28 + yawBias + jx + pulse,
      baseG.y,
      baseG.z + wz * 0.28 + jz,
    );
    if (_g.lengthSq() < 1e-8) _g.copy(_down);
    else _g.normalize();

    // Hard floor: never allow gravity to tilt up enough to inflate volume.
    if (_g.y > LOCO_GY_FLOOR) {
      _g.y = LOCO_GY_FLOOR;
      _g.normalize();
    }

    if (!s.gravityDir) s.gravityDir = new THREE.Vector3();
    s.gravityDir.copy(_g);

    // Subtle trail energy; stiffness floor pulls strands back to drape.
    s.gravityPower = b.gravityPower * (1 + cfg.trail * 0.28);
    s.stiffness = Math.max(0.18, b.stiffness * (1 - cfg.sway * 0.14));
    s.dragForce = Math.max(0.3, b.dragForce - cfg.trail * 0.06);
  }
}
