import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { createFlatWorld } from './world.js';
import { createModelCharacter, updateModelCharacter } from './model-character.js';
import { createPostFX } from './postfx.js';
import { bootstrapContent } from './content/bootstrap.js';
import { createFromCatalog } from './content/registry.js';
import { PLAYER_ID } from './content/catalog.js';

// Flat authoring stage — fix character + town assets first, wrap to sphere later.
// Warm countryside afternoon — fog matches horizon grass haze, not pure sky blue
const SKY = 0x6eb6de;
const FOG = 0xb8d4c0;

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setClearColor(SKY, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Soft ground-colored haze — distance reads as meadow, not grey wash
scene.fog = new THREE.Fog(FOG, 48, 115);

// Hero shot (spec §3): stand south of plaza looking north toward temple axis.
const HERO_SPAWN = { x: 0, y: 0, z: 8 };
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 250);
// Behind the adventurer, looking north (−Z) at guild / temple / inn.
camera.position.set(0, 6.5, 22);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 60;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI * 0.48;
// Frame the three heroes: guild (−11,−10) · temple (2,−16) · inn (11,−9)
controls.target.set(0, 4.5, -10);

// Stronger key, softer fill — punchier cel bands (X consensus: lighting is half the look)
const sun = new THREE.DirectionalLight(0xfff2dc, 2.45);
sun.position.set(14, 22, 11);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.04;
sun.shadow.radius = 2.5;
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

scene.add(new THREE.HemisphereLight(0xc8e8ff, 0x9ec868, 0.85));
const fill = new THREE.DirectionalLight(0xb8d8ff, 0.38);
fill.position.set(-8, 6, -4);
scene.add(fill);
// Cool rim from behind — cheap Fresnel substitute for buildings/character
const rim = new THREE.DirectionalLight(0xa8d4ff, 0.35);
rim.position.set(-4, 8, -14);
scene.add(rim);

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
  thickness: 1.25,
  depthBias: 0.0015,
  normalBias: 0.48,
  sketch: 0.08,
  outlineColor: '#1e1824',
  levels: 9,
  dither: 0.08,
  saturation: 1.22,
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
  const gui = new GUI({ title: '无职转生 · 村庄切片' });
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
  fp.add(params, 'saturation', 0, 1.6, 0.02).onChange((v) => (postfx.posterize.uSaturation.value = v));
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

  if (typeof character.update === 'function') {
    character.update({
      time: t,
      dt,
      moving,
      loco: moving ? 'walk' : 'idle',
      orbitDelta,
    });
  } else {
    updateModelCharacter(character, t, moving, dt);
  }

  postfx.render();
  requestAnimationFrame(animate);
}

function hideBoot() {
  const el = document.getElementById('boot');
  if (!el) return;
  el.dataset.hide = '1';
  setTimeout(() => el.remove(), 400);
}

(async () => {
  const boot = document.getElementById('boot');
  try {
    bootstrapContent();
    if (boot) boot.textContent = '加载场景…';
    await createFlatWorld(scene, loader);

    // World first so the page is never a dead blank while VRM downloads.
    postfx = createPostFX(renderer, scene, camera);
    postfx.outline.uThickness.value = params.thickness;
    postfx.outline.uDepthBias.value = params.depthBias;
    postfx.outline.uNormalBias.value = params.normalBias;
    postfx.outline.uSketch.value = params.sketch;
    postfx.outline.uOutlineColor.value.set(params.outlineColor);
    postfx.posterize.uLevels.value = params.levels;
    postfx.posterize.uDither.value = params.dither;
    postfx.posterize.uSaturation.value = params.saturation;
    // Anti washed-out: low lift, higher contrast (matches GradeShader defaults)
    if (postfx.posterize.uLift) postfx.posterize.uLift.value = 0.02;
    if (postfx.posterize.uContrast) postfx.posterize.uContrast.value = 1.12;
    if (postfx.posterize.uWarm) postfx.posterize.uWarm.value = 0.04;
    if (postfx.posterize.uVignette) postfx.posterize.uVignette.value = 0.18;

    if (boot) boot.textContent = '加载角色…';
    try {
      character = await createFromCatalog(PLAYER_ID);
    } catch (e) {
      console.warn('[character] catalog actor failed, placeholder robot:', e);
      character = await createModelCharacter();
      character.update = (ctx) => updateModelCharacter(character, ctx.time, ctx.moving, ctx.dt);
    }
    character.group.position.set(HERO_SPAWN.x, HERO_SPAWN.y, HERO_SPAWN.z);
    character.group.rotation.y = 0;
    targetYaw = 0;
    character.group.scale.setScalar(1);
    scene.add(character.group);
    // Dev probes for hair/arm metrics + camera framing (Playwright / console).
    if (import.meta.env.DEV) {
      window.__character = character;
      window.__camera = camera;
      window.__controls = controls;
      window.__scene = scene;
      // Quick proof the new hero factories are live (console + optional HUD).
      console.info('[boot] heroes:', window.__heroes);
      console.info('[boot] heroes', window.__heroes);
      let badge = document.getElementById('hero-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'hero-badge';
        Object.assign(badge.style, {
          position: 'fixed',
          top: '12px',
          left: '12px',
          zIndex: '30',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(20,30,50,0.88)',
          color: '#c8e0ff',
          font: '12px/1.4 ui-monospace, monospace',
        });
        document.body.appendChild(badge);
      }
      badge.innerHTML = `公会 img2threejs<br/><a href="/hero-preview.html" style="color:#9fd0ff">单独预览 →</a>`;
    }

    buildGUI();
    hideBoot();
    animate();
  } catch (e) {
    console.error('[boot] failed:', e);
    if (boot) {
      boot.textContent = `加载失败：${e?.message || e}`;
      boot.style.whiteSpace = 'pre-wrap';
      boot.style.padding = '24px';
      boot.style.textAlign = 'center';
    }
  }
})();
