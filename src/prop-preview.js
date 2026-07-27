import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createAnvilWorkstationModel,
  createApothecaryHerbRackModel,
  createBarrelClusterModel,
  createBeehiveSkepClusterModel,
  createCoveredTradeWagonModel,
  createCrateStackModel,
  createCrystalCrateModel,
  createFenceSectionModel,
  createFlowerPlanterModel,
  createGrainSackPileModel,
  createHandcartModel,
  createHayBaleStackModel,
  createHitchingPostModel,
  createHorseWaterTroughModel,
  createOrchardCiderPressModel,
  createProduceMarketStallModel,
  createQuestBoardModel,
  createSignpostModel,
  createStreetLanternModel,
  createVillageBenchModel,
  createVillageWellModel,
  createWaystoneModel,
  createWoodpileModel,
} from './entities/props/models/index.js';

const params = new URLSearchParams(location.search);
const assetId = params.get('asset') ?? 'well';
const view = params.get('view') ?? 'main';
const factories = {
  well: createVillageWellModel,
  lantern: createStreetLanternModel,
  handcart: createHandcartModel,
  questBoard: createQuestBoardModel,
  barrelCluster: createBarrelClusterModel,
  crateStack: createCrateStackModel,
  bench: createVillageBenchModel,
  fence: createFenceSectionModel,
  hitchingPost: createHitchingPostModel,
  signpost: createSignpostModel,
  waystone: createWaystoneModel,
  anvil: createAnvilWorkstationModel,
  crystalCrate: createCrystalCrateModel,
  planter: createFlowerPlanterModel,
  woodpile: createWoodpileModel,
  hayBale: createHayBaleStackModel,
  sackPile: createGrainSackPileModel,
  marketStall: createProduceMarketStallModel,
  horseTrough: createHorseWaterTroughModel,
  coveredWagon: createCoveredTradeWagonModel,
  ciderPress: createOrchardCiderPressModel,
  herbRack: createApothecaryHerbRackModel,
  beehiveCluster: createBeehiveSkepClusterModel,
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
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.94;
renderer.setClearColor(0xbeb9b0, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbeb9b0, 24, 42);
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.028).texture;
room.dispose();
pmrem.dispose();

const model = factory();
scene.add(model);
const bounds = new THREE.Box3().setFromObject(model);
const size = bounds.getSize(new THREE.Vector3());
const center = bounds.getCenter(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 100);
const distance = maxDim * (
  assetId === 'lantern'
    ? 2.08
    : assetId === 'coveredWagon'
      ? 1.2
    : assetId === 'ciderPress'
      ? 1.75
    : assetId === 'herbRack'
      ? 1.78
    : assetId === 'beehiveCluster'
      ? 1.72
    : assetId === 'fence'
      ? 1.86
      : 2.15
);
const cameraDirections = {
  main: new THREE.Vector3(1.15, 0.72, 1.45).normalize(),
  front: new THREE.Vector3(0, 0.22, 1).normalize(),
  side: new THREE.Vector3(1, 0.22, 0).normalize(),
  rear: new THREE.Vector3(-1.1, 0.5, -1.4).normalize(),
};
const assetMainDirections = {
  fence: new THREE.Vector3(0.3, 0.25, 1.4).normalize(),
  coveredWagon: new THREE.Vector3(1.15, 0.62, 1.25).normalize(),
  ciderPress: new THREE.Vector3(1.05, 0.62, 1.45).normalize(),
  herbRack: new THREE.Vector3(1.05, 0.5, 1.55).normalize(),
  beehiveCluster: new THREE.Vector3(1.0, 0.48, 1.55).normalize(),
};
const assetSideDirections = {
  coveredWagon: new THREE.Vector3(0.03, 0.3, 1).normalize(),
};
const cameraDirection = view === 'main'
  ? assetMainDirections[assetId] ?? cameraDirections.main
  : view === 'side'
    ? assetSideDirections[assetId] ?? cameraDirections.side
    : cameraDirections[view] ?? cameraDirections.main;
camera.position.copy(center).addScaledVector(cameraDirection, distance);
camera.lookAt(center);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(center);
controls.minDistance = maxDim * 1.1;
controls.maxDistance = maxDim * 5;

const key = new THREE.DirectionalLight(0xffe9cf, 3.0);
key.position.set(7, 10, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 5;
key.shadow.blurSamples = 18;
key.shadow.bias = -0.00035;
key.shadow.normalBias = 0.045;
Object.assign(key.shadow.camera, {
  left: -8,
  right: 8,
  top: 8,
  bottom: -8,
  near: 1,
  far: 28,
});
scene.add(key, key.target);

const fill = new THREE.DirectionalLight(0xb9d4e6, 0.48);
fill.position.set(-8, 5, 4);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffc98f, 1.15);
rim.position.set(-4, 8, -8);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xdce7ec, 0x655b50, 0.42));

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(maxDim * 5, 72),
  new THREE.MeshStandardMaterial({ color: 0xa9a49b, roughness: 0.86, metalness: 0 }),
);
floor.name = 'preview.floor';
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = -0.015;
floor.receiveShadow = true;
scene.add(floor);

const shadowResolution = 128;
const shadowBytes = new Uint8Array(shadowResolution * shadowResolution * 4);
for (let y = 0; y < shadowResolution; y += 1) {
  for (let x = 0; x < shadowResolution; x += 1) {
    const nx = x / (shadowResolution - 1) * 2 - 1;
    const ny = y / (shadowResolution - 1) * 2 - 1;
    const radius = Math.hypot(nx, ny);
    const alpha = Math.pow(Math.max(0, 1 - radius), 2.2);
    const index = (y * shadowResolution + x) * 4;
    shadowBytes[index] = 38;
    shadowBytes[index + 1] = 33;
    shadowBytes[index + 2] = 29;
    shadowBytes[index + 3] = Math.round(alpha * 255);
  }
}
const shadowTexture = new THREE.DataTexture(
  shadowBytes,
  shadowResolution,
  shadowResolution,
  THREE.RGBAFormat,
);
shadowTexture.needsUpdate = true;
const contactShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(Math.max(size.x, size.z) * 1.45, Math.max(size.x, size.z) * 1.05),
  new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    toneMapped: false,
  }),
);
contactShadow.name = 'preview.contact-shadow';
contactShadow.rotation.x = -Math.PI * 0.5;
contactShadow.position.set(center.x, -0.006, center.z);
scene.add(contactShadow);

let meshCount = 0;
let triangleCount = 0;
model.traverse((object) => {
  if (!object.isMesh) return;
  meshCount += 1;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) {
    if (!material) continue;
    for (const keyName of [
      'map',
      'roughnessMap',
      'metalnessMap',
      'normalMap',
      'aoMap',
      'emissiveMap',
    ]) {
      const texture = material[keyName];
      if (texture) texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    }
  }
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
