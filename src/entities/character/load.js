import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

/**
 * Load VRM, sole@y=0, optional target height.
 * @returns {{ vrm: import('@pixiv/three-vrm').VRM, group: THREE.Group, height: number }}
 */
export async function loadVRM(url, { targetHeight = 1.05 } = {}) {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm;
  if (!vrm) throw new Error(`No VRM in ${url}`);

  VRMUtils.removeUnnecessaryVertices?.(vrm.scene);
  VRMUtils.removeUnnecessaryJoints?.(vrm.scene);
  VRMUtils.rotateVRM0?.(vrm);

  vrm.scene.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
    }
  });

  // Normalized pose must copy to raw bones before bounds / springs.
  if (vrm.humanoid) vrm.humanoid.autoUpdateHumanBones = true;
  vrm.humanoid?.resetNormalizedPose?.();
  vrm.humanoid?.update?.();
  vrm.scene.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(vrm.scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const height = Math.max(size.y, 0.01);
  const scale = targetHeight / height;
  vrm.scene.scale.setScalar(scale);
  vrm.scene.updateMatrixWorld(true);

  const box2 = new THREE.Box3().setFromObject(vrm.scene);
  vrm.scene.position.y -= box2.min.y;

  const group = new THREE.Group();
  group.name = 'actorRoot';
  group.add(vrm.scene);

  return { vrm, group, height: targetHeight };
}
