/**
 * Environment textures — prefer authored seamless tiles (A/C tier),
 * fall back to soft procedural canvas only if load fails.
 */
import * as THREE from 'three';

const BASE = import.meta.env.BASE_URL;
const loader = new THREE.TextureLoader();

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: false });
  return { c, ctx, size };
}

function configure(tex, { repeat = 1 } = {}) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function loadUrl(url, { repeat = 1 } = {}) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (tex) => resolve(configure(tex, { repeat })),
      undefined,
      reject,
    );
  });
}

/** Soft meadow fallback (canvas). */
function makeGrassFallback(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#8ed46a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 36; i++) {
    const x = hash2(i, 1) * size;
    const y = hash2(i, 2) * size;
    const r = 50 + hash2(i, 3) * 100;
    const g = 180 + Math.floor(hash2(i, 4) * 40);
    const a = 0.08 + hash2(i, 6) * 0.12;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${Math.floor(g * 0.55)},${g},${Math.floor(g * 0.4)},${a})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return configure(new THREE.CanvasTexture(c), { repeat: 12 });
}

function makeDirtFallback(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#d4c4a8';
  ctx.fillRect(0, 0, size, size);
  for (const cx of [size * 0.35, size * 0.65]) {
    const g1 = ctx.createLinearGradient(cx - size * 0.1, 0, cx + size * 0.1, 0);
    g1.addColorStop(0, 'rgba(160,140,100,0)');
    g1.addColorStop(0.4, 'rgba(160,140,100,0.14)');
    g1.addColorStop(0.6, 'rgba(160,140,100,0.14)');
    g1.addColorStop(1, 'rgba(160,140,100,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(cx - size * 0.12, 0, size * 0.24, size);
  }
  return configure(new THREE.CanvasTexture(c), { repeat: 1 });
}

function makeCobbleFallback(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#c8bca8';
  ctx.fillRect(0, 0, size, size);
  const cols = 10;
  const rows = 10;
  const cellW = size / cols;
  const cellH = size / rows;
  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (cellW * 0.45);
    for (let col = 0; col < cols + 1; col++) {
      const x = col * cellW + xOff - cellW * 0.2;
      const y = row * cellH;
      const base = 200 + Math.floor(hash2(col * 2, row * 3) * 28);
      ctx.fillStyle = `rgb(${base + 10},${base},${base - 18})`;
      ctx.fillRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3);
    }
  }
  return configure(new THREE.CanvasTexture(c), { repeat: 3 });
}

function makeShoulderFallback(size = 256) {
  const { c, ctx } = canvas(size);
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0, '#8ed46a');
  g.addColorStop(0.4, '#b0c878');
  g.addColorStop(0.65, '#d0c098');
  g.addColorStop(1, '#d4c4a8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return configure(new THREE.CanvasTexture(c), { repeat: 4 });
}

function makeApronFallback(size = 256) {
  const { c, ctx } = canvas(size);
  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.48;
  ctx.clearRect(0, 0, size, size);
  const grd = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grd.addColorStop(0, 'rgba(210,190,150,0.55)');
  grd.addColorStop(0.5, 'rgba(200,180,140,0.35)');
  grd.addColorStop(0.8, 'rgba(190,175,135,0.12)');
  grd.addColorStop(1, 'rgba(180,170,130,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  return configure(new THREE.CanvasTexture(c), { repeat: 1 });
}

// Sync API used by flat-env — cache populated by ensureEnvTextures()
let _cache = null;

export async function ensureEnvTextures() {
  if (_cache) return _cache;
  const [grass, road] = await Promise.all([
    loadUrl(`${BASE}content/env/grass.png`, { repeat: 18 }).catch(() => makeGrassFallback()),
    loadUrl(`${BASE}content/env/road_dirt.png`, { repeat: 1 }).catch(() => makeDirtFallback()),
  ]);
  _cache = {
    grass,
    road,
    cobble: makeCobbleFallback(),
    shoulder: makeShoulderFallback(),
    apron: makeApronFallback(),
  };
  return _cache;
}

/** Sync getters — call ensureEnvTextures() once at world boot first. */
export function makeGrassTexture() {
  return _cache?.grass ?? makeGrassFallback();
}
export function makeDirtRoadTexture() {
  return _cache?.road ?? makeDirtFallback();
}
export function makeCobbleTexture() {
  return _cache?.cobble ?? makeCobbleFallback();
}
export function makeShoulderTexture() {
  return _cache?.shoulder ?? makeShoulderFallback();
}
export function makeWornEarthApronTexture() {
  return _cache?.apron ?? makeApronFallback();
}
