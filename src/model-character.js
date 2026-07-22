import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import robotUrl from './assets/RobotExpressive.glb';
import { gradientMap } from './world.js';

const TARGET_HEIGHT = 1.45;

// A real rigged 3D character (placeholder model) with a walk cycle — this is how
// abeto actually does it: a 3D animated mesh, toon-shaded, with the outline pass
// wrapping it (so it stays 3D from every angle and the legs move). Swap the model
// later for an anime girl (VRoid/VRM) without touching the rest.
export async function createModelCharacter() {
  const gltf = await new GLTFLoader().loadAsync(robotUrl);
  const model = gltf.scene;

  // re-skin every mesh to MeshToonMaterial so it matches the cel world
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      const src = o.material;
      o.material = new THREE.MeshToonMaterial({
        color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
        map: src.map || null,
        gradientMap,
      });
    }
  });

  // normalize: height = TARGET_HEIGHT, feet at the group origin
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.scale.setScalar(TARGET_HEIGHT / size.y);
  box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;

  const group = new THREE.Group();
  group.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const action = (name) => {
    const clip = THREE.AnimationClip.findByName(gltf.animations, name);
    return clip ? mixer.clipAction(clip) : null;
  };
  const walk = action('Walking');
  const idle = action('Idle');
  idle?.play();
  if (walk) { walk.play(); walk.setEffectiveWeight(0); }

  return { group, model, mixer, walk, idle, height: TARGET_HEIGHT, _w: 0 };
}

export function updateModelCharacter(c, time, moving, dt) {
  c.mixer.update(dt);
  // crossfade idle <-> walk (main.js owns facing)
  c._w += ((moving ? 1 : 0) - c._w) * Math.min(1, dt * 8);
  c.walk?.setEffectiveWeight(c._w);
  c.idle?.setEffectiveWeight(1 - c._w);
}
