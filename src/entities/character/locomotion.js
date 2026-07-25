import * as THREE from 'three';

/**
 * Create idle + walk actions. Idle is a static hang clip so crossfade is valid.
 */
export function createHangClip(vrm, hangN, name = 'idleHang') {
  const tracks = [];
  for (const [boneName, q] of Object.entries(hangN)) {
    const node = vrm.humanoid?.getNormalizedBoneNode(boneName);
    if (!node) continue;
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${node.name}.quaternion`,
        [0, 1],
        [q.x, q.y, q.z, q.w, q.x, q.y, q.z, q.w],
      ),
    );
  }
  return new THREE.AnimationClip(name, 1, tracks);
}

export function setupMixer(vrm, walkClip, hangN) {
  const mixer = new THREE.AnimationMixer(vrm.scene);
  const idleClip = createHangClip(vrm, hangN);
  const idleAction = mixer.clipAction(idleClip);
  idleAction.setEffectiveWeight(1);
  idleAction.play();

  let walkAction = null;
  if (walkClip) {
    // Drop root translation so feet stay planted under our own move system.
    const tracks = walkClip.tracks.filter((t) => !/\.position$/.test(t.name));
    const clip = tracks.length === walkClip.tracks.length
      ? walkClip
      : new THREE.AnimationClip(walkClip.name, walkClip.duration, tracks);
    walkAction = mixer.clipAction(clip);
    walkAction.setEffectiveWeight(0);
    walkAction.play();
  }

  return { mixer, idleAction, walkAction };
}

export function updateLocoWeights(state, moving, dt) {
  state._w += ((moving ? 1 : 0) - state._w) * Math.min(1, dt * 7);
  const w = state._w;
  if (state.walkAction) {
    state.walkAction.setEffectiveWeight(w);
    state.walkAction.enabled = w > 0.001;
  }
  state.idleAction.setEffectiveWeight(Math.max(1 - w, 0.001));
  state.idleAction.enabled = true;
  state.mixer.update(dt);
  return w;
}
