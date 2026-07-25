/**
 * Environment textures — stylized fantasy seamless tiles.
 * Prefer authored C-tier tiles when present; fall back to craft canvas
 * (soft patches / dual ruts / pale cobble / soft apron) — never noise soup.
 *
 * Layers: grass · dirt_road · shoulder · cobble_plaza · dirt_apron
 */
import * as THREE from 'three';

const BASE = import.meta.env?.BASE_URL ?? '/';
const loader = new THREE.TextureLoader();

// ─── helpers ───────────────────────────────────────────────────────────────

function hasCanvas() {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

function canvas(size) {
  if (!hasCanvas()) {
    throw new Error('CanvasTexture requires a document (browser). Call ensureEnvTextures() in app boot.');
  }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: false });
  return { c, ctx, size };
}

function configure(tex, { repeat = 1, colorSpace = THREE.SRGBColorSpace } = {}) {
  tex.colorSpace = colorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Deterministic 0–1 hash. */
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Value-noise sample on integer lattice with smooth hermite. */
function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 3-octave fbm, returns ~0–1. */
function fbm(x, y, octaves = 3) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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

// ─── grass (meadow) ────────────────────────────────────────────────────────
/**
 * Soft spring meadow — base spring green + large gentle patches + sparse dry freckles.
 * Designed for high tile repeat under cel/toon; no dark stems, no micro tuft noise.
 */
function makeGrassFallback(size = 512) {
  const { c, ctx } = canvas(size);
  // Base: bright spring green — distinct from road sand
  ctx.fillStyle = '#7ed45a';
  ctx.fillRect(0, 0, size, size);

  // Large soft color patches — higher alpha so meadow reads under cel
  const patchPalettes = [
    [155, 220, 100], // lime
    [90, 175, 85], // cooler
    [140, 210, 80], // chartreuse
    [85, 160, 80], // soft deep green
    [180, 230, 120], // sunlit
  ];
  for (let i = 0; i < 34; i++) {
    const x = hash2(i, 11) * size;
    const y = hash2(i, 17) * size;
    const r = size * (0.14 + hash2(i, 23) * 0.24);
    const pal = patchPalettes[i % patchPalettes.length];
    const a = 0.18 + hash2(i, 29) * 0.2;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${pal[0]},${pal[1]},${pal[2]},${a})`);
    grd.addColorStop(0.55, `rgba(${pal[0]},${pal[1]},${pal[2]},${a * 0.4})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Mid-frequency soft mottling via fbm-ish blob field (still readable, not grain)
  for (let i = 0; i < 48; i++) {
    const x = hash2(i + 50, 3) * size;
    const y = hash2(i + 50, 7) * size;
    const r = size * (0.03 + hash2(i, 13) * 0.06);
    const bright = hash2(i, 41) > 0.5;
    const a = 0.05 + hash2(i, 19) * 0.08;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (bright) {
      grd.addColorStop(0, `rgba(200,235,140,${a})`);
    } else {
      grd.addColorStop(0, `rgba(70,150,70,${a * 0.7})`);
    }
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Optional polish: sparse dry-grass freckles (meadow only, very few)
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 36; i++) {
    const x = hash2(i + 200, 5) * size;
    const y = hash2(i + 200, 9) * size;
    const w = 1.2 + hash2(i, 31) * 2.2;
    const h = 2.5 + hash2(i, 37) * 4;
    ctx.fillStyle = hash2(i, 43) > 0.5 ? '#c8d878' : '#e0d090';
    ctx.fillRect(x, y, w, h);
  }
  ctx.globalAlpha = 1;

  // Soft vignette-free edge blend (helps tiling): very faint wrap-aware soften at borders
  // Skip hard vignette — just a light seamless cross-fade strip using copy of opposite edge tone.
  // (Canvas tiles with RepeatWrapping; soft mid-tone already seamless enough.)

  return configure(new THREE.CanvasTexture(c), { repeat: 16 });
}

// ─── dirt road ─────────────────────────────────────────────────────────────
/**
 * Packed sandy dirt road tile.
 * UV contract: U = along road, V = across width.
 * Dual soft wagon ruts sit at V≈0.35 and V≈0.65, extend along U.
 * Sparse light pebbles only — empty > clutter.
 */
function makeDirtFallback(size = 512) {
  const { c, ctx } = canvas(size);

  // Base packed earth — warm sandy beige (bright, not mud)
  ctx.fillStyle = '#d8c8a8';
  ctx.fillRect(0, 0, size, size);

  // Soft large earth tone variation (packed vs slightly looser)
  for (let i = 0; i < 22; i++) {
    const x = hash2(i, 2) * size;
    const y = hash2(i, 5) * size;
    const r = size * (0.1 + hash2(i, 8) * 0.18);
    const warm = hash2(i, 11) > 0.45;
    const a = 0.07 + hash2(i, 14) * 0.1;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (warm) {
      grd.addColorStop(0, `rgba(200,175,130,${a})`);
    } else {
      grd.addColorStop(0, `rgba(160,145,115,${a * 0.85})`);
    }
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Dual wagon ruts — MUST read at a glance (previous alpha was too low to notice)
  // Bands constant along U (x), across V (y)
  const rutCenters = [0.34, 0.66];
  for (const vc of rutCenters) {
    const cy = vc * size;
    const half = size * 0.07;
    const g = ctx.createLinearGradient(0, cy - half * 2.0, 0, cy + half * 2.0);
    g.addColorStop(0, 'rgba(100,80,55,0)');
    g.addColorStop(0.28, 'rgba(120,95,65,0.28)');
    g.addColorStop(0.5, 'rgba(95,75,50,0.42)');
    g.addColorStop(0.72, 'rgba(120,95,65,0.28)');
    g.addColorStop(1, 'rgba(100,80,55,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, cy - half * 2.0, size, half * 4.0);

    // Inner dust ridge (lighter)
    const ridge = ctx.createLinearGradient(0, cy - half * 0.4, 0, cy + half * 0.4);
    ridge.addColorStop(0, 'rgba(230,210,165,0)');
    ridge.addColorStop(0.5, 'rgba(235,215,170,0.22)');
    ridge.addColorStop(1, 'rgba(230,210,165,0)');
    ctx.fillStyle = ridge;
    ctx.fillRect(0, cy - half * 0.4, size, half * 0.8);
  }

  // Centre crown between ruts (lighter packed strip)
  {
    const cy = size * 0.5;
    const half = size * 0.09;
    const g = ctx.createLinearGradient(0, cy - half, 0, cy + half);
    g.addColorStop(0, 'rgba(230,215,175,0)');
    g.addColorStop(0.5, 'rgba(235,220,180,0.2)');
    g.addColorStop(1, 'rgba(230,215,175,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, cy - half, size, half * 2);
  }

  // Soft edge wear toward road shoulders (darker dust at V extremes)
  for (const edge of [0, 1]) {
    const y0 = edge === 0 ? 0 : size * 0.88;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + size * 0.12);
    if (edge === 0) {
      g.addColorStop(0, 'rgba(170,155,120,0.14)');
      g.addColorStop(1, 'rgba(170,155,120,0)');
    } else {
      g.addColorStop(0, 'rgba(170,155,120,0)');
      g.addColorStop(1, 'rgba(170,155,120,0.14)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, size, size * 0.12);
  }

  // Light pebbles — sparse, soft, pale (not a rock forest)
  for (let i = 0; i < 28; i++) {
    const x = hash2(i + 80, 1) * size;
    const y = hash2(i + 80, 4) * size;
    // Keep most pebbles off the deepest rut centres
    const v = y / size;
    if (Math.abs(v - 0.34) < 0.03 || Math.abs(v - 0.66) < 0.03) continue;
    const rx = 1.2 + hash2(i, 6) * 2.4;
    const ry = 0.9 + hash2(i, 9) * 1.6;
    const shade = 185 + Math.floor(hash2(i, 12) * 40);
    ctx.fillStyle = `rgba(${shade},${shade - 12},${shade - 30},0.55)`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, hash2(i, 15) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Very soft micro grain (low alpha) so packing reads without pixel noise soup
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = (fbm(x * 0.04, y * 0.04, 2) - 0.5) * 10;
      for (let oy = 0; oy < 2; oy++) {
        for (let ox = 0; ox < 2; ox++) {
          const i = ((y + oy) * size + (x + ox)) * 4;
          d[i] = Math.max(0, Math.min(255, d[i] + n));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.9));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.75));
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // Road tile often stretched along length; default repeat 1 — caller sets U repeat.
  return configure(new THREE.CanvasTexture(c), { repeat: 1 });
}

// ─── shoulder (grass → dirt) ───────────────────────────────────────────────
/**
 * Soft transition strip. UV: U along road, V across width of shoulder box.
 * Symmetric: grass at both V edges → dirt toward centre (under road).
 * Visible only on the exposed sides of the wider shoulder mesh.
 */
function makeShoulderFallback(size = 256) {
  const { c, ctx } = canvas(size);

  // Paint per-row soft gradient across V with slight noise in hue
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    const v = y / (size - 1);
    // distance from nearest edge (0 at edge, 1 at centre)
    const fromEdge = Math.min(v, 1 - v) * 2; // 0..1
    // grass near edge, dirt toward centre — softstep
    const dirtMix = smoothstep(0.15, 0.72, fromEdge);
    for (let x = 0; x < size; x++) {
      const n = fbm(x * 0.03, y * 0.05, 2);
      // grass base
      let r = 140 + n * 25;
      let g = 210 + n * 20;
      let b = 100 + n * 15;
      // dirt
      const dr = 210 + n * 15;
      const dg = 190 + n * 12;
      const db = 150 + n * 10;
      r = lerp(r, dr, dirtMix);
      g = lerp(g, dg, dirtMix);
      b = lerp(b, db, dirtMix);
      // slight along-road variation
      const streak = (fbm(x * 0.08, y * 0.02, 1) - 0.5) * 8;
      r += streak;
      g += streak * 0.9;
      b += streak * 0.7;
      const i = (y * size + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  return configure(new THREE.CanvasTexture(c), { repeat: 4 });
}

// ─── cobble plaza ──────────────────────────────────────────────────────────
/**
 * Pale warm cobbles / stone slabs — soft mortar, light tonal variation.
 * Readable under toon; not photo rock, not grey parking lot.
 */
function makeCobbleFallback(size = 512) {
  const { c, ctx } = canvas(size);

  // Darker mortar so joints read clearly from hero camera
  ctx.fillStyle = '#9a8c78';
  ctx.fillRect(0, 0, size, size);

  const cols = 7;
  const rows = 7;
  const cellW = size / cols;
  const cellH = size / rows;
  const gap = 4.5;

  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (cellW * 0.45);
    for (let col = -1; col < cols + 1; col++) {
      const bx = col * cellW + xOff;
      const by = row * cellH;
      const insetL = gap * 0.45 + hash2(col, row) * 1.6;
      const insetT = gap * 0.45 + hash2(col + 3, row + 1) * 1.4;
      const insetR = gap * 0.45 + hash2(col + 5, row + 2) * 1.6;
      const insetB = gap * 0.45 + hash2(col + 7, row + 3) * 1.4;
      const x = bx + insetL;
      const y = by + insetT;
      const w = cellW - insetL - insetR;
      const h = cellH - insetT - insetB;
      if (w < 6 || h < 6) continue;

      const base = 210 + Math.floor(hash2(col * 3, row * 5) * 30);
      const warm = hash2(col, row + 20);
      let rr = base + 12;
      let gg = base;
      let bb = base - 22;
      if (warm > 0.7) {
        rr += 12;
        gg += 2;
        bb -= 10;
      } else if (warm < 0.25) {
        rr -= 4;
        gg += 4;
        bb += 8;
      }
      ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      roundRect(ctx, x, y, w, h, 3.5);
      ctx.fill();

      const hl = ctx.createLinearGradient(x, y, x + w * 0.55, y + h * 0.55);
      hl.addColorStop(0, 'rgba(255,252,245,0.35)');
      hl.addColorStop(0.55, 'rgba(255,252,245,0.06)');
      hl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hl;
      roundRect(ctx, x, y, w, h, 3.5);
      ctx.fill();

      const sh = ctx.createLinearGradient(x + w, y + h, x + w * 0.25, y + h * 0.25);
      sh.addColorStop(0, 'rgba(90,75,55,0.22)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sh;
      roundRect(ctx, x, y, w, h, 3.5);
      ctx.fill();

      // joint outline so cel posterize doesn't erase edges
      ctx.strokeStyle = 'rgba(70,60,48,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, w, h, 3.5);
      ctx.stroke();
    }
  }

  return configure(new THREE.CanvasTexture(c), { repeat: 2.5 });
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ─── dirt apron (under landmarks) ──────────────────────────────────────────
/**
 * Soft worn earth disc with alpha fade — no hard rim.
 * Map is white-tintable; alpha carries the falloff.
 */
function makeApronFallback(size = 256) {
  const { c, ctx } = canvas(size);
  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.48;

  ctx.clearRect(0, 0, size, size);

  // Soft radial worn earth (warm sand) — alpha only at rim
  const grd = ctx.createRadialGradient(cx, cy, r * 0.12, cx, cy, r);
  grd.addColorStop(0, 'rgba(214,196,158,0.58)');
  grd.addColorStop(0.35, 'rgba(205,186,148,0.42)');
  grd.addColorStop(0.62, 'rgba(198,180,142,0.22)');
  grd.addColorStop(0.82, 'rgba(190,175,138,0.08)');
  grd.addColorStop(1, 'rgba(180,168,130,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Sparse soft scuff mottles (very low contrast)
  for (let i = 0; i < 14; i++) {
    const ang = hash2(i, 1) * Math.PI * 2;
    const dist = hash2(i, 2) * r * 0.55;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    const pr = r * (0.06 + hash2(i, 3) * 0.1);
    const a = 0.04 + hash2(i, 4) * 0.06;
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, pr);
    g2.addColorStop(0, `rgba(160,140,100,${a})`);
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(x - pr, y - pr, pr * 2, pr * 2);
  }

  return configure(new THREE.CanvasTexture(c), { repeat: 1 });
}

// ─── cache + public API ────────────────────────────────────────────────────

/** @type {null | {
 *   grass: THREE.Texture,
 *   road: THREE.Texture,
 *   cobble: THREE.Texture,
 *   shoulder: THREE.Texture,
 *   apron: THREE.Texture,
 * }} */
let _cache = null;

/**
 * Build ground textures once at world boot.
 * Default: **procedural Three.js craft** for all five layers (what you actually see).
 * Set `window.__ENV_USE_AUTHORED_TILES = true` before boot to prefer public/content/env/*.png.
 */
export async function ensureEnvTextures() {
  if (_cache) return _cache;

  const procedural = {
    grass: safeMake(makeGrassFallback, 'grass'),
    road: safeMake(makeDirtFallback, 'road'),
    cobble: safeMake(makeCobbleFallback, 'cobble'),
    shoulder: safeMake(makeShoulderFallback, 'shoulder'),
    apron: safeMake(makeApronFallback, 'apron'),
  };

  if (typeof window === 'undefined' && !hasCanvas()) {
    _cache = procedural;
    return _cache;
  }

  const preferAuthored =
    typeof window !== 'undefined' && window.__ENV_USE_AUTHORED_TILES === true;

  if (!preferAuthored) {
    // Always use craft — authored grass/road PNGs were hiding all ground upgrades
    _cache = procedural;
    console.info('[env] ground textures: procedural craft (grass/road/cobble/shoulder/apron)');
    return _cache;
  }

  const [grass, road] = await Promise.all([
    loadUrl(`${BASE}content/env/grass.png`, { repeat: 16 }).catch(() => procedural.grass),
    loadUrl(`${BASE}content/env/road_dirt.png`, { repeat: 1 }).catch(() => procedural.road),
  ]);

  _cache = {
    grass,
    road,
    cobble: procedural.cobble,
    shoulder: procedural.shoulder,
    apron: procedural.apron,
  };
  console.info('[env] ground textures: authored grass/road + procedural cobble/shoulder/apron');
  return _cache;
}

function safeMake(fn, label) {
  try {
    return fn();
  } catch (err) {
    // Node without document: return a 1x1 DataTexture stub so API doesn't throw on import.
    console.warn(`[env textures] ${label} canvas unavailable:`, err?.message || err);
    const data = new Uint8Array([200, 200, 180, 255]);
    const tex = new THREE.DataTexture(data, 1, 1);
    tex.needsUpdate = true;
    return configure(tex, { repeat: 1 });
  }
}

/** Sync getters — call ensureEnvTextures() once at world boot first. */
export function makeGrassTexture() {
  return _cache?.grass ?? safeMake(makeGrassFallback, 'grass');
}
export function makeDirtRoadTexture() {
  return _cache?.road ?? safeMake(makeDirtFallback, 'road');
}
export function makeCobbleTexture() {
  return _cache?.cobble ?? safeMake(makeCobbleFallback, 'cobble');
}
export function makeShoulderTexture() {
  return _cache?.shoulder ?? safeMake(makeShoulderFallback, 'shoulder');
}
export function makeWornEarthApronTexture() {
  return _cache?.apron ?? safeMake(makeApronFallback, 'apron');
}

/** Test/debug: force rebuild procedural cache (ignores authored png). */
export function rebuildProceduralEnvTextures() {
  _cache = {
    grass: safeMake(makeGrassFallback, 'grass'),
    road: safeMake(makeDirtFallback, 'road'),
    cobble: safeMake(makeCobbleFallback, 'cobble'),
    shoulder: safeMake(makeShoulderFallback, 'shoulder'),
    apron: safeMake(makeApronFallback, 'apron'),
  };
  return _cache;
}
