/**
 * Isolated hero viewer — start with guild only (gen-guild-v1).
 * http://localhost:5173/hero-preview.html
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAdventurersGuildHero } from './entities/building/heroes/adventurers_guild.js';

const SKY = 0x9aa8b4;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(SKY, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 120);
// Match product-render 3/4 view
camera.position.set(14, 11, 18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 5.5, 0);
controls.minDistance = 8;
controls.maxDistance = 45;

const sun = new THREE.DirectionalLight(0xfff5e8, 2.4);
sun.position.set(10, 20, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 2;
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
scene.add(sun);
scene.add(sun.target);
scene.add(new THREE.HemisphereLight(0xd0e4f0, 0x8a9078, 0.75));
const fill = new THREE.DirectionalLight(0xb0c8e0, 0.35);
fill.position.set(-8, 6, -4);
scene.add(fill);

// Neutral ground like product studio
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(28, 64),
  new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.95, metalness: 0 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const guild = createAdventurersGuildHero();
guild.rotation.y = 0.4; // 3/4 like ref
scene.add(guild);

// Soft ground shadow disk
const disc = new THREE.Mesh(
  new THREE.CircleGeometry(9, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 }),
);
disc.rotation.x = -Math.PI / 2;
disc.position.y = 0.02;
scene.add(disc);

const labels = document.getElementById('labels');
if (labels) {
  labels.innerHTML = [
    '<b>gen-guild-v1</b> · 冒险者公会',
    '参考：content/buildings/adventurers_guild/ref_main.png',
    '实心三角屋顶 · 半木构 · 绿牌交叉剑 · 委托板 · 酒桶',
    '',
    '拖拽旋转 · 滚轮缩放',
    '<span style="opacity:.75">Agent 按参考雕刻（非双板假屋顶）。后续可换 img2threejs 输出同接口。</span>',
  ].join('<br/>');
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// auto slow orbit for presentation
let t0 = performance.now();
function tick(now) {
  const t = (now - t0) * 0.00015;
  if (!controls.active) {
    // gentle presentation spin only if user idle — OrbitControls has no .active; skip
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

console.info('[hero-preview] gen-guild-v1', guild.userData);
window.__guild = guild;
