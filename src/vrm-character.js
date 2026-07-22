import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from './loadMixamoAnimation.js';

const TARGET_HEIGHT = 1.05;

// VRM rest is often a T-pose. These local eulers hang the arms naturally at the sides
// (VRM 0 / 1 normalized bones use roughly the same convention after retarget).
const ARM_HANG = {
  leftShoulder: new THREE.Euler(0, 0, 0.12),
  rightShoulder: new THREE.Euler(0, 0, -0.12),
  leftUpperArm: new THREE.Euler(0.08, 0.05, 1.15),
  rightUpperArm: new THREE.Euler(0.08, -0.05, -1.15),
  leftLowerArm: new THREE.Euler(0.15, 0, 0.08),
  rightLowerArm: new THREE.Euler(0.15, 0, -0.08),
  leftHand: new THREE.Euler(0.05, 0, 0.05),
  rightHand: new THREE.Euler(0.05, 0, -0.05),
};

const ARM_BONES = Object.keys(ARM_HANG);

function dampSpringBones(vrm) {
  const mgr = vrm.springBoneManager;
  if (!mgr?.joints) return;
  for (const joint of mgr.joints) {
    const s = joint.settings;
    if (!s) continue;
    // stiffer + more drag + less gravity → hair/cloth barely bounces
    s.stiffness = Math.max(s.stiffness ?? 1, 0) * 2.4 + 0.6;
    s.dragForce = Math.min(0.92, (s.dragForce ?? 0.4) * 1.35 + 0.25);
    s.gravityPower = (s.gravityPower ?? 0) * 0.25;
  }
  // settle into the new rest so the first frames aren't wild
  mgr.setInitState?.();
  mgr.reset?.();
}

function bone(vrm, name) {
  return vrm.humanoid?.getNormalizedBoneNode(name) ?? null;
}

export async function createVRMCharacter(url) {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm;
  if (!vrm) throw new Error('file is not a VRM');

  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);
  vrm.scene.traverse((o) => {
    o.frustumCulled = false;
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        if (m.color) m.color.offsetHSL(0, 0.01, 0.04);
        if ('roughness' in m) m.roughness = Math.min(m.roughness ?? 1, 0.75);
      }
    }
  });

  dampSpringBones(vrm);

  // normalize height, feet at group origin
  let box = new THREE.Box3().setFromObject(vrm.scene);
  vrm.scene.scale.setScalar(TARGET_HEIGHT / box.getSize(new THREE.Vector3()).y);
  box = new THREE.Box3().setFromObject(vrm.scene);
  vrm.scene.position.y -= box.min.y;

  const group = new THREE.Group();
  group.add(vrm.scene);

  // Mixamo walk — legs/spine only. Arms are posed in code (T-pose rest + bad arm clip).
  const clip = await loadMixamoAnimation(`${import.meta.env.BASE_URL}walking.fbx`, vrm);
  const armNodes = new Set(
    ARM_BONES.map((n) => bone(vrm, n)?.name).filter(Boolean),
  );
  clip.tracks = clip.tracks.filter((t) => {
    if (t.name.endsWith('.position')) return false;
    const node = t.name.split('.')[0];
    if (armNodes.has(node)) return false;
    if (/(arm|shoulder|hand|wrist)/i.test(node)) return false;
    return true;
  });

  const mixer = new THREE.AnimationMixer(vrm.scene);
  const walkAction = mixer.clipAction(clip);
  walkAction.setLoop(THREE.LoopRepeat, Infinity);
  walkAction.clampWhenFinished = false;
  walkAction.play();
  walkAction.setEffectiveWeight(0);

  // cache arm nodes + hang quaternions (built once in each bone's local space)
  const arms = {};
  const hangQ = {};
  const _e = new THREE.Euler();
  for (const name of ARM_BONES) {
    const n = bone(vrm, name);
    if (!n) continue;
    arms[name] = n;
    hangQ[name] = new THREE.Quaternion().setFromEuler(ARM_HANG[name]);
  }

  // apply hang immediately so the first rendered frame isn't a T-pose
  for (const name of ARM_BONES) {
    if (arms[name]) arms[name].quaternion.copy(hangQ[name]);
  }
  vrm.humanoid?.update();

  return {
    vrm,
    group,
    mixer,
    walkAction,
    arms,
    hangQ,
    height: TARGET_HEIGHT,
    isVRM: true,
    _w: 0,
    _q: new THREE.Quaternion(),
    _e,
  };
}

export function updateVRMCharacter(c, time, moving, dt) {
  // smooth walk weight
  c._w += ((moving ? 1 : 0) - c._w) * Math.min(1, dt * 7);
  c.walkAction.setEffectiveWeight(c._w);
  c.mixer.update(dt);

  // arms: always start from hang, add a small opposite-leg swing while walking
  // (never leave the T-pose rest, never accumulate euler)
  const swing = Math.sin(time * 8.5) * 0.32 * c._w;
  const idle = 1 - c._w;

  for (const name of ARM_BONES) {
    const node = c.arms[name];
    const hq = c.hangQ[name];
    if (!node || !hq) continue;
    node.quaternion.copy(hq);
  }

  // walk swing on upper arms only (local X), absolute from hang
  if (c.arms.leftUpperArm && c.hangQ.leftUpperArm) {
    c._e.set(0.08 + swing, 0.05, 1.15);
    c.arms.leftUpperArm.quaternion.setFromEuler(c._e);
  }
  if (c.arms.rightUpperArm && c.hangQ.rightUpperArm) {
    c._e.set(0.08 - swing, -0.05, -1.15);
    c.arms.rightUpperArm.quaternion.setFromEuler(c._e);
  }
  if (c.arms.leftLowerArm) {
    c._e.set(0.15 + Math.max(0, -swing) * 0.35, 0, 0.08);
    c.arms.leftLowerArm.quaternion.setFromEuler(c._e);
  }
  if (c.arms.rightLowerArm) {
    c._e.set(0.15 + Math.max(0, swing) * 0.35, 0, -0.08);
    c.arms.rightLowerArm.quaternion.setFromEuler(c._e);
  }

  // no idle spine rock — walk mixer already settles the torso; breath was stacking

  if (typeof c.vrm.update === 'function') c.vrm.update(dt);
  else {
    c.vrm.humanoid?.update();
    c.vrm.expressionManager?.update();
  }
}
