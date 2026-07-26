import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createHandcartModel,
  createStreetLanternModel,
  createVillageWellModel,
} from './entities/props/models/index.js';

const params = new URLSearchParams(location.search);
const assetId = params.get('asset') ?? 'well';
const view = params.get('view') ?? 'main';
const factories = {
  well: createVillageWellModel,
  lantern: createStreetLanternModel,
  handcart: createHandcartModel,
};
const factory = factories[assetId] ?? factories.well;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.setClearColor(0xd9d3ca, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd9d3ca, 24, 42);

const model = factory();
scene.add(model);
const bounds = new THREE.Box3().setFromObject(model);
const size = bounds.getSize(new THREE.Vector3());
const center = bounds.getCenter(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 100);
const distance = maxDim * (assetId === 'lantern' ? 2.08 : 2.15);
const cameraDirections = {
  main: new THREE.Vector3(1.15, 0.72, 1.45).normalize(),
  front: new THREE.Vector3(0, 0.22, 1).normalize(),
  side: new THREE.Vector3(1, 0.22, 0).normalize(),
  rear: new THREE.Vector3(-1.1, 0.5, -1.4).normalize(),
};
camera.position.copy(center).addScaledVector(cameraDirections[view] ?? cameraDirections.main, distance);
camera.lookAt(center);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(center);
controls.minDistance = maxDim * 1.1;
controls.maxDistance = maxDim * 5;

const key = new THREE.DirectionalLight(0xfff3df, 3.2);
key.position.set(7, 11, 9);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 3;
key.shadow.bias = -0.00035;
key.shadow.normalBias = 0.035;
Object.assign(key.shadow.camera, {
  left: -8,
  right: 8,
  top: 8,
  bottom: -8,
  near: 1,
  far: 28,
});
scene.add(key, key.target);

const fill = new THREE.DirectionalLight(0xbfd7e6, 0.82);
fill.position.set(-8, 6, 3);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffd5a2, 1.0);
rim.position.set(-4, 8, -8);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xe6f1f5, 0x7f7463, 1.05));

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(maxDim * 5, 72),
  new THREE.MeshStandardMaterial({ color: 0xcac4ba, roughness: 0.96, metalness: 0 }),
);
floor.name = 'preview.floor';
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = -0.015;
floor.receiveShadow = true;
scene.add(floor);

let meshCount = 0;
let triangleCount = 0;
model.traverse((object) => {
  if (!object.isMesh) return;
  meshCount += 1;
  if (object.geometry?.index) triangleCount += object.geometry.index.count / 3;
  else if (object.geometry?.attributes?.position) triangleCount += object.geometry.attributes.position.count / 3;
});

const labels = document.getElementById('labels');
if (labels) {
  labels.innerHTML = [
    `<b>${assetId}</b> · ${view}`,
    `<code>${model.userData.gen}</code>`,
    `${meshCount} meshes · ${Math.round(triangleCount).toLocaleString()} triangles`,
    `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} · sole@y=0`,
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
requestAnimationFrame(tick);

window.__propModel = model;
window.__propPreviewReady = true;
console.info('[prop-preview]', assetId, view, model.userData.gen);
