import * as THREE from 'three';
import { Kind } from '../../content/kinds.js';
import { loadMixamoAnimation } from '../../loadMixamoAnimation.js';
import { loadVRM } from './load.js';
import { buildIdleArmPose, applyArmPose } from './pose.js';
import { findClothDrivers, pinCloth } from './cloth.js';
import { reorientHairDown, tuneSpringBones, applyHairPhysics } from './springs.js';
import { setupMixer, updateLocoWeights } from './locomotion.js';

const _tmp = new THREE.Vector3();

const DEFAULT_MANIFEST = {
  id: 'actors.hunter_f',
  kind: Kind.ACTOR,
  source: { model: 'character.vrm' },
  scale: { targetHeight: 1.05 },
  locomotion: {
    walk: 'walking.fbx',
    // Visible walk swing, but hang-biased so arms stay close to body.
    armSwingMix: 0.42,
  },
  idle: { preset: 'soft_hang' },
  springs: {
    profile: 'drape_idle',
    center: 'head',
    hairColliders: 'torso_only',
  },
};

function resolveUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL || './';
  const clean = String(path).replace(/^\.\//, '').replace(/^\//, '');
  return `${base}${clean}`;
}

/**
 * Factory: manifest → Entity (actor).
 * @param {object} manifest
 * @returns {Promise<import('../types.js').Entity>}
 */
export async function createActorEntity(manifest = {}) {
  const m = {
    ...DEFAULT_MANIFEST,
    ...manifest,
    source: { ...DEFAULT_MANIFEST.source, ...manifest.source },
    scale: { ...DEFAULT_MANIFEST.scale, ...manifest.scale },
    locomotion: { ...DEFAULT_MANIFEST.locomotion, ...manifest.locomotion },
    idle: { ...DEFAULT_MANIFEST.idle, ...manifest.idle },
    springs: { ...DEFAULT_MANIFEST.springs, ...manifest.springs },
  };

  const modelUrl = resolveUrl(m.source.model);
  const { vrm, group, height } = await loadVRM(modelUrl, {
    targetHeight: m.scale.targetHeight ?? 1.05,
  });

  const hangN = buildIdleArmPose(vrm, m.idle.preset ?? 'soft_hang');
  const clothDrivers = findClothDrivers(vrm);

  // 1) Arms hang  2) cloth pin  3) reorient hair roots down  4) bake spring rest
  applyArmPose(vrm, hangN, 0, 0);
  vrm.humanoid.update();
  pinCloth(clothDrivers);
  group.updateMatrixWorld(true);

  const nHair = reorientHairDown(vrm);
  // Bake the draped long-hair roots as spring rest (bangs untouched).
  const springBase = tuneSpringBones(vrm, m.springs);
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[actor] long-hair roots reoriented: ${nHair}`);
  }

  let walkClip = null;
  const walkUrl = resolveUrl(m.locomotion.walk);
  if (walkUrl) {
    try {
      walkClip = await loadMixamoAnimation(walkUrl, vrm);
    } catch (e) {
      console.warn('[actor] walk clip missing, idle-only:', e.message);
    }
  }

  const { mixer, idleAction, walkAction } = setupMixer(vrm, walkClip, hangN);
  // Keep arm swing modest so elbows don't shove long hair even if arm colliders leak.
  const armSwingMix = Math.min(m.locomotion.armSwingMix ?? 0.42, 0.42);

  /** @type {import('../types.js').Entity & Record<string, unknown>} */
  const entity = {
    id: m.id,
    kind: Kind.ACTOR,
    isVRM: true,
    group,
    vrm,
    height,
    hangN,
    clothDrivers,
    springBase,
    mixer,
    idleAction,
    walkAction,
    armSwingMix,
    _w: 0,
    _boot: 0,
    _prevPos: new THREE.Vector3(),
    _vel: new THREE.Vector3(),
    _windSmoothed: new THREE.Vector3(),
    _prevYaw: group.rotation.y,
    _yawRateSmoothed: 0,
    loco: 'idle',

    update(ctx) {
      const dt = ctx.dt ?? 0.016;
      const time = ctx.time ?? 0;
      entity._boot += dt;

      const moving = !!ctx.moving;
      entity.loco = ctx.loco ?? (moving ? 'walk' : 'idle');

      const w = updateLocoWeights(entity, moving, dt);
      applyArmPose(vrm, hangN, w, armSwingMix);

      vrm.humanoid.update();
      pinCloth(clothDrivers);
      vrm.nodeConstraintManager?.update?.();
      group.updateMatrixWorld(true);

      // --- Phase B drive signals: smoothed world velocity + yaw rate ---
      const pos = group.getWorldPosition(_tmp);
      if (entity._boot > 0.05) {
        entity._vel.copy(pos).sub(entity._prevPos).multiplyScalar(1 / Math.max(dt, 1e-4));
      } else {
        entity._vel.set(0, 0, 0);
      }
      entity._prevPos.copy(pos);

      let yawDelta = group.rotation.y - entity._prevYaw;
      yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
      const yawRate = yawDelta / Math.max(dt, 1e-4);
      entity._prevYaw = group.rotation.y;
      const yawAlpha = 1 - Math.exp(-dt * 8);
      entity._yawRateSmoothed += (yawRate - entity._yawRateSmoothed) * yawAlpha;

      if (entity.loco === 'idle') {
        // Decay wind to zero; rest silhouette is held by Phase A gravity only.
        entity._windSmoothed.lerp(_tmp.set(0, 0, 0), 1 - Math.exp(-dt * 6));
        entity._yawRateSmoothed *= Math.exp(-dt * 8);
      } else {
        // Opposite of velocity = trail lag; cap so we never shove hair into a shell.
        const orbit = THREE.MathUtils.clamp(ctx.orbitDelta ?? 0, -0.12, 0.12);
        _tmp.set(-entity._vel.x, 0, -entity._vel.z);
        const vLen = Math.hypot(_tmp.x, _tmp.z);
        if (vLen > 0.02) {
          const cap = 2.6;
          if (vLen > cap) _tmp.multiplyScalar(cap / vLen);
          // Trail scale: lively but small vs hang gravity in springs.js
          _tmp.multiplyScalar(0.22);
        } else {
          _tmp.set(0, 0, 0);
        }
        // Mild camera-orbit side bias + step cadence (not a constant side wind).
        const sideX = Math.sin(group.rotation.y + Math.PI * 0.5);
        const sideZ = Math.cos(group.rotation.y + Math.PI * 0.5);
        _tmp.x += sideX * orbit * 0.35;
        _tmp.z += sideZ * orbit * 0.35;
        _tmp.x += Math.sin(time * 7.8) * 0.035;
        _tmp.z += Math.cos(time * 6.6) * 0.028;
        entity._windSmoothed.lerp(_tmp, 1 - Math.exp(-dt * 6));
      }

      applyHairPhysics(springBase, {
        windXZ: entity._windSmoothed,
        yawRate: entity._yawRateSmoothed,
        loco: entity.loco,
        time,
      });

      vrm.springBoneManager?.update?.(dt);
      pinCloth(clothDrivers);

      vrm.expressionManager?.update?.();
      vrm.lookAt?.update?.(dt);
      if (vrm.materials) {
        for (const mat of vrm.materials) mat.update?.(dt);
      }
    },

    dispose() {
      mixer?.stopAllAction?.();
      vrm?.scene?.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const mat of mats) mat.dispose?.();
        }
      });
    },
  };

  group.getWorldPosition(entity._prevPos);
  return entity;
}

export async function actorFactory(manifest) {
  return createActorEntity(manifest);
}
