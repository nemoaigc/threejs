import * as THREE from 'three';
import { createTempleModel } from './createTempleModel.js';

const stage = document.querySelector('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
stage.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7d8d6);

const camera = new THREE.PerspectiveCamera(
  34,
  window.innerWidth / window.innerHeight,
  0.1,
  180,
);

const view = new URLSearchParams(window.location.search).get('view') ?? 'main';
const viewConfig = {
  main: {
    position: [32, 21, 38],
    target: [0, 11.5, 0.8],
  },
  front: {
    position: [0, 13.5, 48],
    target: [0, 11.5, 0.7],
  },
  side: {
    position: [46, 13.5, 0],
    target: [0, 11.5, 0],
  },
  rear: {
    position: [-30, 18, -38],
    target: [0, 11.5, -1],
  },
}[view] ?? {
  position: [32, 21, 38],
  target: [0, 11.5, 0.8],
};

camera.position.set(...viewConfig.position);
camera.lookAt(...viewConfig.target);

const temple = createTempleModel();
scene.add(temple);

const hemisphere = new THREE.HemisphereLight(0xfff8e9, 0x697481, 1.35);
scene.add(hemisphere);

const key = new THREE.DirectionalLight(0xfff2d8, 3.1);
key.position.set(-18, 32, 24);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -22;
key.shadow.camera.right = 22;
key.shadow.camera.top = 34;
key.shadow.camera.bottom = -8;
key.shadow.camera.near = 1;
key.shadow.camera.far = 90;
key.shadow.bias = -0.00035;
scene.add(key);

const fill = new THREE.DirectionalLight(0xcad9ef, 0.85);
fill.position.set(20, 14, -18);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffdc9b, 0.65);
rim.position.set(-15, 18, -24);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0xc9cbc9, roughness: 1 }),
);
ground.name = 'preview.ground';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.015;
ground.receiveShadow = true;
scene.add(ground);

renderer.render(scene, camera);
window.__TEMPLE_PREVIEW__ = {
  ready: true,
  view,
  gen: temple.userData.gen,
  heroVersion: temple.userData.heroVersion,
  nodeCount: Object.keys(temple.userData.sculptRuntime.nodes).length,
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});
