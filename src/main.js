import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { createFlatWorld } from './world.js';
import { createModelCharacter, updateModelCharacter } from './model-character.js';
import { createVRMCharacter, updateVRMCharacter } from './vrm-character.js';
import { createPostFX } from './postfx.js';

// Flat authoring stage — fix character + town assets first, wrap to sphere later.
const SKY = 0x6eb6de;

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.setClearColor(SKY, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(SKY, 45, 110);

// Hero shot (spec §3): stand south of plaza looking north toward hospital axis.
const HERO_SPAWN = { x: 0, y: 0, z: 6 };
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 250);
// Behind the hunter, looking north (−Z) at association / hospital / cafe.
camera.position.set(2.5, 5.5, 16);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 48;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(2, 3.0, -6);

const sun = new THREE.DirectionalLight(0xfff6e8, 2.15);
sun.position.set(12, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.04;
sun.shadow.radius = 3;
Object.assign(sun.shadow.camera, {
  left: -48,
  right: 48,
  top: 48,
  bottom: -48,
  near: 1,
  far: 100,
});
scene.add(sun);
scene.add(sun.target);

scene.add(new THREE.HemisphereLight(0xd8f2ff, 0xb8d48a, 1.2));
const fill = new THREE.DirectionalLight(0xd0e8ff, 0.6);
fill.position.set(-8, 6, -4);
scene.add(fill);

const loader = new THREE.TextureLoader();

const keys = {};
const KEYMAP = {
  KeyW: 'f',
  ArrowUp: 'f',
  KeyS: 'b',
  ArrowDown: 'b',
  KeyA: 'l',
  ArrowLeft: 'l',
  KeyD: 'r',
  ArrowRight: 'r',
};
addEventListener('keydown', (e) => {
  if (KEYMAP[e.code]) {
    keys[KEYMAP[e.code]] = true;
    e.preventDefault();
  }
});
addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false;
});

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const camDir = new THREE.Vector3();
const right = new THREE.Vector3();
const moveDir = new THREE.Vector3();
const camTarget = new THREE.Vector3();

let character;
let postfx;
let targetYaw = 0;
const params = {
  walkSpeed: 3.4,
  thickness: 1.15,
  depthBias: 0.0018,
  normalBias: 0.55,
  sketch: 0.15,
  outlineColor: '#2a2430',
  levels: 10,
  dither: 0.06,
  saturation: 1.05,
};

function move(dt) {
  const fwd = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);
  const strafe = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  let moving = false;
  if (fwd || strafe) {
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, -1);
    else camDir.normalize();
    right.crossVectors(camDir, WORLD_UP).normalize();
    moveDir.set(0, 0, 0).addScaledVector(camDir, fwd).addScaledVector(right, strafe).normalize();
    const step = params.walkSpeed * dt;
    character.group.position.x += moveDir.x * step;
    character.group.position.z += moveDir.z * step;
    camera.position.x += moveDir.x * step;
    camera.position.z += moveDir.z * step;
    targetYaw = Math.atan2(moveDir.x, moveDir.z);
    moving = true;
  }
  character.group.position.y = 0;

  let d = targetYaw - character.group.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  character.group.rotation.y += d * Math.min(1, dt * 12);
  return moving;
}

function buildGUI() {
  const gui = new GUI({ title: 'Linkon slice' });
  gui.add(params, 'walkSpeed', 0.5, 8, 0.1).name('walk speed');
  const fo = gui.addFolder('outline');
  fo.add(params, 'thickness', 0, 3, 0.05).onChange((v) => (postfx.outline.uThickness.value = v));
  fo.add(params, 'sketch', 0, 2.5, 0.05)
    .name('ink wobble')
    .onChange((v) => (postfx.outline.uSketch.value = v));
  fo.add(params, 'depthBias', 0, 0.02, 0.0002)
    .name('depth sens')
    .onChange((v) => (postfx.outline.uDepthBias.value = v));
  fo.add(params, 'normalBias', 0, 1.5, 0.01)
    .name('normal sens')
    .onChange((v) => (postfx.outline.uNormalBias.value = v));
  fo.addColor(params, 'outlineColor').onChange((v) => postfx.outline.uOutlineColor.value.set(v));
  const fp = gui.addFolder('colour grade');
  fp.add(params, 'levels', 2, 16, 1).onChange((v) => (postfx.posterize.uLevels.value = v));
  fp.add(params, 'dither', 0, 1, 0.01).onChange((v) => (postfx.posterize.uDither.value = v));
  fp.add(params, 'saturation', 0, 1.4, 0.02).onChange((v) => (postfx.posterize.uSaturation.value = v));
}

addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (postfx) postfx.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let prevCamAzimuth = 0;
let camAzimuthInited = false;
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const moving = move(dt);

  const p = character.group.position;
  camTarget.set(p.x, p.y + 1.05, p.z);
  controls.target.lerp(camTarget, 1 - Math.exp(-dt * 10));
  sun.position.set(p.x + 12, 20, p.z + 10);
  sun.target.position.set(p.x, 0, p.z);
  sun.target.updateMatrixWorld();
  controls.update();

  // After controls settle: orbit yaw delta → hair wind.
  const az = controls.getAzimuthalAngle();
  let orbitDelta = 0;
  if (camAzimuthInited) {
    orbitDelta = az - prevCamAzimuth;
    orbitDelta = Math.atan2(Math.sin(orbitDelta), Math.cos(orbitDelta));
  } else {
    camAzimuthInited = true;
  }
  prevCamAzimuth = az;
  orbitDelta = THREE.MathUtils.clamp(orbitDelta, -0.35, 0.35);

  if (character.isVRM) {
    updateVRMCharacter(character, t, moving, dt, { orbitDelta });
  } else {
    updateModelCharacter(character, t, moving, dt);
  }

  postfx.render();
  requestAnimationFrame(animate);
}

(async () => {
  await createFlatWorld(scene, loader);

  try {
    character = await createVRMCharacter(`${import.meta.env.BASE_URL}character.vrm`);
  } catch (e) {
    console.warn('[character] no VRM found, using placeholder robot:', e.message);
    character = await createModelCharacter();
  }
  character.group.position.set(HERO_SPAWN.x, HERO_SPAWN.y, HERO_SPAWN.z);
  // Three.js default forward is −Z (toward hospital / north landmarks).
  character.group.rotation.y = 0;
  targetYaw = 0;
  character.group.scale.setScalar(1);
  scene.add(character.group);

  postfx = createPostFX(renderer, scene, camera);
  postfx.outline.uThickness.value = params.thickness;
  postfx.outline.uDepthBias.value = params.depthBias;
  postfx.outline.uNormalBias.value = params.normalBias;
  postfx.outline.uSketch.value = params.sketch;
  postfx.outline.uOutlineColor.value.set(params.outlineColor);
  postfx.posterize.uLevels.value = params.levels;
  postfx.posterize.uDither.value = params.dither;
  postfx.posterize.uSaturation.value = params.saturation;
  if (postfx.posterize.uLift) postfx.posterize.uLift.value = 0.06;
  if (postfx.posterize.uContrast) postfx.posterize.uContrast.value = 1.04;

  buildGUI();
  animate();
})();
