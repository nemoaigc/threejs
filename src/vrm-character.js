import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from './loadMixamoAnimation.js';

const TARGET_HEIGHT = 1.05;

const ARM_NAMES = [
  'leftShoulder',
  'rightShoulder',
  'leftUpperArm',
  'rightUpperArm',
  'leftLowerArm',
  'rightLowerArm',
  'leftHand',
  'rightHand',
];

/**
 * Little-girl cute idle: arms barely open (微张), hands near hip line.
 * Z fold ~0.38 rad (~22°) — tiny air gap, not wing / not glued.
 */
const CUTE_IDLE = {
  leftShoulder: [0.01, 0.015, 0.04],
  rightShoulder: [0.01, -0.015, -0.04],
  leftUpperArm: [0.08, 0.04, -0.38],
  rightUpperArm: [0.08, -0.04, 0.38],
  leftLowerArm: [0.18, 0.02, 0.04],
  rightLowerArm: [0.18, -0.02, -0.04],
  leftHand: [0.05, 0.02, 0.03],
  rightHand: [0.05, -0.02, -0.03],
};

// Walk: mostly hang, only a little Mixamo swing (avoids big back-whip).
const WALK_ARM_MIX = 0.28;

/** Locomotion → spring energy. Later: run/sprint just raise these. */
const LOCO = {
  idle: { sway: 0.15, trail: 0.0, noise: 0.04 },
  walk: { sway: 0.55, trail: 0.35, noise: 0.12 },
  run: { sway: 0.85, trail: 0.7, noise: 0.22 },
  sprint: { sway: 1.0, trail: 1.0, noise: 0.35 },
};

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _tmp = new THREE.Vector3();
const _g = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);

function norm(vrm, name) {
  return vrm.humanoid?.getNormalizedBoneNode(name) ?? null;
}

function raw(vrm, name) {
  return vrm.humanoid?.getRawBoneNode(name) ?? null;
}

function findClothDrivers(vrm) {
  const drivers = [];
  const scene = vrm.scene;

  for (const side of ['L', 'R']) {
    {
      let aimTops = null;
      let aimShoulder = null;
      let rollUpper = null;
      const upperRaw = raw(vrm, side === 'L' ? 'leftUpperArm' : 'rightUpperArm');
      const secNodes = [];
      scene.traverse((o) => {
        if (!o.name) return;
        if (o.name === `J_Aim_${side}_TopsUpperArm`) aimTops = o;
        if (o.name === `J_Aim_${side}_Shoulder`) aimShoulder = o;
        if (o.name === `J_Roll_${side}_UpperArm`) rollUpper = o;
        if (o.name.startsWith(`J_Sec_${side}_TopsUpperArm`)) secNodes.push(o);
      });
      if (upperRaw) {
        drivers.push({
          kind: 'sleeve',
          source: upperRaw,
          aims: [aimTops, aimShoulder].filter(Boolean),
          roll: rollUpper,
          rollRest: rollUpper ? rollUpper.quaternion.clone() : null,
          secRest: secNodes.map((n) => ({ node: n, q: n.quaternion.clone() })),
          freezeSec: true,
        });
      }
    }
    {
      let aimLeg = null;
      let rollLeg = null;
      const upperLeg = raw(vrm, side === 'L' ? 'leftUpperLeg' : 'rightUpperLeg');
      const secNodes = [];
      scene.traverse((o) => {
        if (!o.name) return;
        if (o.name === `J_Aim_${side}_UpperLeg`) aimLeg = o;
        if (o.name === `J_Roll_${side}_UpperLeg`) rollLeg = o;
        if (o.name.startsWith(`J_Sec_${side}_TopsUpperLeg`)) secNodes.push(o);
      });
      if (upperLeg && aimLeg) {
        drivers.push({
          kind: 'shorts',
          source: upperLeg,
          aims: [aimLeg],
          roll: rollLeg,
          rollRest: rollLeg ? rollLeg.quaternion.clone() : null,
          secRest: secNodes.map((n) => ({ node: n, q: n.quaternion.clone() })),
          freezeSec: false,
        });
      }
    }
  }
  return drivers;
}

function pinCloth(drivers) {
  for (const d of drivers) {
    const q = d.source.quaternion;
    for (const aim of d.aims) aim.quaternion.copy(q);
    if (d.roll && d.rollRest) d.roll.quaternion.copy(d.rollRest);
    if (d.freezeSec) {
      for (const s of d.secRest) s.node.quaternion.copy(s.q);
    }
  }
}

function isTorsoCollider(col) {
  const n = col.parent?.name ?? '';
  // Keep head/neck/chest/spine/hips for bounce. Drop arms/hands — they fan long hair out.
  if (/Arm|Hand|Finger/i.test(n)) return false;
  return /Head|Neck|Spine|Chest|Hips|UpperLeg/i.test(n);
}

/**
 * Light hair = low stiffness + medium drag + real gravity.
 * Physics (Verlet) + torso colliders = organic sway / bounce, not a looped clip.
 * center = head so root motion of hips doesn't shear hair every step.
 */
function tuneSpringBones(vrm) {
  const mgr = vrm.springBoneManager;
  if (!mgr?.joints) return [];

  const head = raw(vrm, 'head');
  const hips = raw(vrm, 'hips');
  const base = [];

  for (const joint of mgr.joints) {
    const s = joint.settings;
    if (!s) continue;
    const name = joint.bone?.name ?? '';

    const snap = {
      joint,
      name,
      stiffness: s.stiffness ?? 0.5,
      dragForce: s.dragForce ?? 0.4,
      gravityPower: s.gravityPower ?? 0,
      hitRadius: s.hitRadius ?? 0.02,
      kind: 'other',
    };

    if (/TopsUpperArm/i.test(name)) {
      s.stiffness = 1e4;
      s.dragForce = 1;
      s.gravityPower = 0;
      s.hitRadius = 0;
      try {
        joint.center = hips;
      } catch {
        /* */
      }
      snap.kind = 'sleeve';
    } else if (/TopsUpperLeg/i.test(name)) {
      // Shorts: follow thigh, soft bounce.
      try {
        joint.center = hips;
      } catch {
        /* */
      }
      s.stiffness = 0.5;
      s.dragForce = 0.42;
      s.gravityPower = 0.18;
      s.gravityDir.set(0, -1, 0);
      s.hitRadius = Math.max(snap.hitRadius, 0.02);
      snap.kind = 'shorts';
    } else if (/Bust/i.test(name)) {
      try {
        joint.center = hips;
      } catch {
        /* */
      }
      s.stiffness = 0.9;
      s.dragForce = 0.7;
      s.gravityPower = 0.04;
      s.gravityDir.set(0, -1, 0);
      snap.kind = 'bust';
    } else if (/Hair/i.test(name)) {
      try {
        joint.center = head ?? hips;
      } catch {
        /* */
      }

      // Only torso/head colliders → bounce off clothes/body, not shoved by arms.
      joint.colliderGroups = (joint.colliderGroups ?? [])
        .map((g) => ({
          ...g,
          colliders: (g.colliders ?? []).filter(isTorsoCollider),
        }))
        .filter((g) => (g.colliders?.length ?? 0) > 0);

      const m = name.match(/Hair(\d+)/i);
      const depth = m ? parseInt(m[1], 10) : 1;
      const tip = Math.min((depth - 1) / 5, 1);

      // LIGHT: soft root, softer tip. Gravity enough to hang, not fight.
      // Author rest aims somewhat outward — lower stiffness so gravity wins hang.
      s.stiffness = THREE.MathUtils.lerp(0.28, 0.12, tip);
      s.dragForce = THREE.MathUtils.lerp(0.38, 0.5, tip);
      s.gravityPower = THREE.MathUtils.lerp(0.55, 0.85, tip);
      s.gravityDir.set(0, -1, 0);
      s.hitRadius = Math.min(Math.max(snap.hitRadius, 0.012), 0.028);
      snap.kind = 'hair';
    } else {
      try {
        joint.center = hips;
      } catch {
        /* */
      }
      s.gravityDir.set(0, -1, 0);
    }

    snap.stiffness = s.stiffness;
    snap.dragForce = s.dragForce;
    snap.gravityPower = s.gravityPower;
    snap.hitRadius = s.hitRadius;
    base.push(snap);
  }

  // Slightly larger chest/thigh for cloth bounce.
  for (const joint of mgr.joints) {
    for (const g of joint.colliderGroups ?? []) {
      for (const col of g.colliders ?? []) {
        const n = col.parent?.name ?? '';
        if (!/Spine|Chest|Hips|UpperLeg/i.test(n)) continue;
        if (col.shape && typeof col.shape.radius === 'number') col.shape.radius *= 1.12;
      }
    }
  }

  return base;
}

function buildHangPose(vrm) {
  vrm.humanoid.resetNormalizedPose();
  vrm.humanoid.update();
  const hang = {};
  for (const name of ARM_NAMES) {
    const node = norm(vrm, name);
    if (!node) continue;
    const rest = node.quaternion.clone();
    const d = CUTE_IDLE[name];
    if (d) {
      _e.set(d[0], d[1], d[2], 'XYZ');
      hang[name] = rest.multiply(_q.setFromEuler(_e));
    } else {
      hang[name] = rest;
    }
  }
  return hang;
}

function createHangClip(vrm, hang) {
  const tracks = [];
  for (const name of ARM_NAMES) {
    const node = norm(vrm, name);
    const q = hang[name];
    if (!node || !q) continue;
    const arr = q.toArray();
    tracks.push(
      new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, [0, 1], [...arr, ...arr]),
    );
  }
  return new THREE.AnimationClip('idleHang', 1, tracks);
}

function blendArmsToHang(vrm, hang, walkAmt) {
  const towardHang = 1 - walkAmt * WALK_ARM_MIX;
  if (towardHang < 0.01) return;
  for (const name of ARM_NAMES) {
    const node = norm(vrm, name);
    const hq = hang[name];
    if (!node || !hq) continue;
    node.quaternion.slerp(hq, towardHang);
  }
}

/**
 * Apply loco-scaled, noisy wind as a small gravity lean.
 * Never horizontal rest — max ~12° off down even at sprint.
 * Randomness: per-strand phase noise so locks don't move in lockstep.
 */
function applyHairPhysics(springBase, { windXZ, loco, time }) {
  if (!springBase) return;
  const cfg = LOCO[loco] ?? LOCO.walk;

  const wx = THREE.MathUtils.clamp(windXZ.x, -1.2, 1.2);
  const wz = THREE.MathUtils.clamp(windXZ.z, -1.2, 1.2);
  const lat = Math.hypot(wx, wz);

  for (const snap of springBase) {
    if (snap.kind === 'sleeve') continue;
    const s = snap.joint.settings;
    const isHair = snap.kind === 'hair';
    const isShorts = snap.kind === 'shorts';

    // Per-strand hash for desync (stable from bone name).
    let h = 0;
    for (let i = 0; i < snap.name.length; i++) h = (h * 31 + snap.name.charCodeAt(i)) | 0;
    const phase = (h % 1000) / 1000;
    const noise =
      Math.sin(time * (1.7 + phase * 2.1) + phase * 6.28) * 0.5 +
      Math.sin(time * (3.3 + phase * 1.4) + phase * 12.5) * 0.5;
    const nAmt = cfg.noise * (isHair ? 1 : 0.4);

    _g.copy(_down);
    const leanMax = isHair ? 0.22 * cfg.sway : isShorts ? 0.12 * cfg.sway : 0.06;
    if (lat > 1e-4) {
      const lean = Math.min(lat, 1) * leanMax;
      _g.x += (wx / lat) * lean + noise * nAmt * 0.15;
      _g.z += (wz / lat) * lean + noise * nAmt * 0.15;
      _g.y = -1;
      _g.normalize();
    } else if (Math.abs(noise) > 0.01 && isHair) {
      // Idle micro-flutter — very light.
      _g.x += noise * nAmt * 0.08;
      _g.z += Math.cos(time * 1.1 + phase * 4) * nAmt * 0.06;
      _g.normalize();
    }
    s.gravityDir.copy(_g);

    // Power scales with loco so walk < run < sprint.
    const gScale = 1 + cfg.trail * (isHair ? 0.25 : 0.1);
    s.gravityPower = snap.gravityPower * gScale;

    if (isHair) {
      // Faster loco → slightly looser (more inertia visible), still light.
      s.stiffness = snap.stiffness * (1 - cfg.trail * 0.2);
      s.dragForce = THREE.MathUtils.clamp(snap.dragForce * (1 - cfg.trail * 0.08), 0.25, 0.75);
    }
  }
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _boneP = new THREE.Vector3();
const _childP = new THREE.Vector3();
const _headP = new THREE.Vector3();
const _parentQ = new THREE.Quaternion();
const _worldQ = new THREE.Quaternion();
const _invParent = new THREE.Quaternion();
const _deltaQ = new THREE.Quaternion();

/**
 * VRoid side-hair rest axes aim outward/up → "exploded" fan.
 * Spring joints use matrixAutoUpdate=false — write matrixWorld manually.
 * Do NOT use setFromRotationMatrix on scaled matrixWorld (character is scaled);
 * use getWorldQuaternion instead.
 */
function reorientHairDown(vrm, root = null) {
  const mgr = vrm.springBoneManager;
  if (!mgr?.joints) return false;

  const hairJoints = [...mgr.joints].filter((j) => /Hair/i.test(j.bone?.name ?? ''));
  if (!hairJoints.length) return false;
  hairJoints.sort((a, b) => {
    const da = parseInt((a.bone?.name.match(/Hair(\d+)/i) || ['', '0'])[1], 10);
    const db = parseInt((b.bone?.name.match(/Hair(\d+)/i) || ['', '0'])[1], 10);
    return da - db;
  });

  // Full world graph from optional group root (includes scene scale).
  if (root) root.updateMatrixWorld(true);
  else vrm.scene.updateMatrixWorld(true);

  const head = raw(vrm, 'head');
  if (head) head.getWorldPosition(_headP);
  else _headP.set(0, 1, 0);

  let changed = 0;
  for (const joint of hairJoints) {
    const bone = joint.bone;
    const child = joint.child;
    if (!bone || !child) continue;

    // Rebuild world mats from local quats (matrixAutoUpdate is false on springs).
    bone.updateMatrix();
    if (bone.parent) bone.matrixWorld.multiplyMatrices(bone.parent.matrixWorld, bone.matrix);
    else bone.matrixWorld.copy(bone.matrix);
    child.updateMatrix();
    if (child.parent) child.matrixWorld.multiplyMatrices(child.parent.matrixWorld, child.matrix);
    else child.matrixWorld.copy(child.matrix);

    _boneP.setFromMatrixPosition(bone.matrixWorld);
    _childP.setFromMatrixPosition(child.matrixWorld);
    _from.subVectors(_childP, _boneP);
    if (_from.lengthSq() < 1e-10) continue;
    _from.normalize();

    _to.subVectors(_boneP, _headP);
    _to.y = 0;
    if (_to.lengthSq() < 1e-8) _to.set(0, 0, -1);
    else _to.normalize();
    // Soft curtain: mostly down, little outward volume.
    _to.multiplyScalar(0.12).addScaledVector(_down, 0.97).normalize();

    if (_from.dot(_to) > 0.88) continue;

    _deltaQ.setFromUnitVectors(_from, _to);
    bone.getWorldQuaternion(_worldQ);
    _worldQ.premultiply(_deltaQ);

    if (bone.parent) {
      bone.parent.getWorldQuaternion(_parentQ);
      _invParent.copy(_parentQ).invert();
      bone.quaternion.copy(_invParent).multiply(_worldQ);
    } else {
      bone.quaternion.copy(_worldQ);
    }

    bone.updateMatrix();
    if (bone.parent) bone.matrixWorld.multiplyMatrices(bone.parent.matrixWorld, bone.matrix);
    else bone.matrixWorld.copy(bone.matrix);
    changed++;
  }

  // Caller bakes setInitState only after hairLooksHung() confirms success.
  return changed > 0;
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

  let box = new THREE.Box3().setFromObject(vrm.scene);
  vrm.scene.scale.setScalar(TARGET_HEIGHT / Math.max(box.getSize(new THREE.Vector3()).y, 1e-4));
  box = new THREE.Box3().setFromObject(vrm.scene);
  vrm.scene.position.y -= box.min.y;

  const group = new THREE.Group();
  group.add(vrm.scene);

  const hangN = buildHangPose(vrm);
  for (const name of ARM_NAMES) {
    const n = norm(vrm, name);
    if (n && hangN[name]) n.quaternion.copy(hangN[name]);
  }
  vrm.humanoid.update();

  const clothDrivers = findClothDrivers(vrm);
  pinCloth(clothDrivers);

  const springBase = tuneSpringBones(vrm);
  // Hair reorient runs on first frames after scene-parent (see updateVRMCharacter).
  // Do not bake here — world matrices are incomplete until group is in the scene.

  const walkClip = await loadMixamoAnimation(`${import.meta.env.BASE_URL}walking.fbx`, vrm);
  walkClip.tracks = walkClip.tracks.filter((t) => !t.name.endsWith('.position'));

  const hangClip = createHangClip(vrm, hangN);
  const mixer = new THREE.AnimationMixer(vrm.scene);

  const walkAction = mixer.clipAction(walkClip);
  walkAction.setLoop(THREE.LoopRepeat, Infinity);
  walkAction.play();
  walkAction.setEffectiveWeight(0);

  const idleAction = mixer.clipAction(hangClip);
  idleAction.setLoop(THREE.LoopRepeat, Infinity);
  idleAction.play();
  idleAction.setEffectiveWeight(1);

  return {
    vrm,
    group,
    mixer,
    walkAction,
    idleAction,
    hangN,
    clothDrivers,
    springBase,
    height: TARGET_HEIGHT,
    isVRM: true,
    /** @type {'idle'|'walk'|'run'|'sprint'} */
    loco: 'idle',
    _w: 0,
    _boot: 0,
    _prevPos: new THREE.Vector3(),
    _vel: new THREE.Vector3(),
    _windSmoothed: new THREE.Vector3(),
    _hairBaked: false,
  };
}

/**
 * @param opts.orbitDelta camera yaw delta (rad)
 * @param opts.loco optional override: 'idle'|'walk'|'run'|'sprint'
 */
/** True when a long side-strand points mostly down (not the fan rest). */
function hairLooksHung(vrm) {
  const mgr = vrm.springBoneManager;
  if (!mgr?.joints) return false;
  let checked = 0;
  let downish = 0;
  for (const j of mgr.joints) {
    if (!/Hair1_0[5-9]|Hair1_1[0-2]/i.test(j.bone?.name ?? '')) continue;
    if (!j.child) continue;
    j.bone.updateMatrix();
    if (j.bone.parent) {
      j.bone.matrixWorld.multiplyMatrices(j.bone.parent.matrixWorld, j.bone.matrix);
    }
    j.child.updateMatrix();
    if (j.child.parent) {
      j.child.matrixWorld.multiplyMatrices(j.child.parent.matrixWorld, j.child.matrix);
    }
    _boneP.setFromMatrixPosition(j.bone.matrixWorld);
    _childP.setFromMatrixPosition(j.child.matrixWorld);
    _from.subVectors(_childP, _boneP).normalize();
    checked++;
    if (_from.y < -0.55) downish++;
  }
  return checked > 0 && downish >= Math.ceil(checked * 0.5);
}

export function updateVRMCharacter(c, time, moving, dt, opts = {}) {
  c._boot += dt;

  c._w += ((moving ? 1 : 0) - c._w) * Math.min(1, dt * 7);
  const w = c._w;
  c.loco = opts.loco ?? (w > 0.2 ? 'walk' : 'idle');

  c.walkAction.setEffectiveWeight(w);
  c.walkAction.enabled = w > 0.001;
  c.idleAction.setEffectiveWeight(Math.max(1 - w, 0.001));
  c.idleAction.enabled = true;
  c.mixer.update(dt);

  if (w < 0.06) {
    c.vrm.humanoid.resetNormalizedPose();
    for (const name of ARM_NAMES) {
      const n = norm(c.vrm, name);
      if (n && c.hangN[name]) n.quaternion.copy(c.hangN[name]);
    }
  } else {
    blendArmsToHang(c.vrm, c.hangN, w);
  }

  c.vrm.humanoid.update();
  pinCloth(c.clothDrivers);
  c.group.updateMatrixWorld(true);

  // Until hair is draped, keep reorienting and do NOT run spring sim
  // (sim would lock the author fan as rest if we bake too early).
  if (!c._hairBaked) {
    reorientHairDown(c.vrm, c.group);
    if (hairLooksHung(c.vrm) || c._boot > 1.5) {
      c.vrm.springBoneManager?.setInitState?.();
      c.vrm.springBoneManager?.reset?.();
      c._hairBaked = true;
    }
    c.vrm.expressionManager?.update?.();
    c.vrm.lookAt?.update?.(dt);
    pinCloth(c.clothDrivers);
    c._prevPos.copy(c.group.getWorldPosition(_tmp));
    return;
  }

  // Body velocity → trail wind (physical inertia — not a looped clip).
  const pos = c.group.getWorldPosition(_tmp);
  if (c._boot > 0.05) {
    c._vel.copy(pos).sub(c._prevPos).multiplyScalar(1 / Math.max(dt, 1e-4));
  } else {
    c._vel.set(0, 0, 0);
  }
  c._prevPos.copy(pos);

  const cfg = LOCO[c.loco] ?? LOCO.walk;
  const orbit = THREE.MathUtils.clamp(opts.orbitDelta ?? 0, -0.12, 0.12);

  _tmp.set(-c._vel.x, 0, -c._vel.z);
  const vLen = Math.hypot(_tmp.x, _tmp.z);
  if (vLen > 0.01) {
    const cap = 1.5 + cfg.trail * 2;
    if (vLen > cap) _tmp.multiplyScalar(cap / vLen);
    _tmp.multiplyScalar(0.15 + cfg.trail * 0.25);
  } else {
    _tmp.set(0, 0, 0);
  }
  _tmp.x += Math.sin(c.group.rotation.y + Math.PI * 0.5) * orbit * (0.35 + cfg.sway * 0.4);
  _tmp.z += Math.cos(c.group.rotation.y + Math.PI * 0.5) * orbit * (0.35 + cfg.sway * 0.4);

  c._windSmoothed.lerp(_tmp, 1 - Math.exp(-dt * 4));
  if (c.loco === 'idle' && Math.abs(orbit) < 1e-4) {
    c._windSmoothed.multiplyScalar(Math.exp(-dt * 2.5));
  }

  applyHairPhysics(c.springBase, {
    windXZ: c._windSmoothed,
    loco: c.loco,
    time: time ?? c._boot,
  });

  c.vrm.expressionManager?.update?.();
  c.vrm.lookAt?.update?.(dt);
  c.vrm.springBoneManager?.update?.(dt);
  pinCloth(c.clothDrivers);
}
