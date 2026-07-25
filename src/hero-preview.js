/**
 * Isolated hero model viewer — no town, no character, no post clutter.
 * Open: http://localhost:5173/hero-preview.html
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createAdventurersGuildHero,
  createTempleHero,
  createInnHero,
} from './entities/building/heroes/index.js';

const SKY = 0x8a9aaa;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(SKY, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(SKY, 40, 90);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200);
camera.position.set(18, 14, 28);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 5, 0);

const sun = new THREE.DirectionalLight(0xfff2dc, 2.2);
sun.position.set(12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xc8e0f0, 0x90a870, 0.9));

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 48),
  new THREE.MeshToonMaterial({ color: 0x6a7a6a }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(40, 20, 0x445544, 0x556655);
grid.position.y = 0.02;
scene.add(grid);

// Three heroes side by side — inspect roofs / massing without the town
const guild = createAdventurersGuildHero();
guild.position.set(-16, 0, 0);
const temple = createTempleHero();
temple.position.set(0, 0, 0);
const inn = createInnHero();
inn.position.set(14, 0, 0);

// Face camera (+Z toward +Z is default; rotate so we see 3/4)
for (const b of [guild, temple, inn]) {
  b.rotation.y = 0.35;
  scene.add(b);
}

const labels = document.getElementById('labels');
if (labels) {
  labels.innerHTML = [
    '<b>公会</b> adventurers_guild · solidGableRoof',
    '<b>神殿</b> temple · solidGableRoof + cone spire',
    '<b>旅馆</b> inn · solidGableRoof',
    '',
    '拖拽旋转 · 滚轮缩放 · 这不是 img2threejs 输出，是手写实心几何 solid-v3',
  ].join('<br/>');
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

console.info('[hero-preview] solid-v3 models only — no photo planes, no dual-slab roofs');
