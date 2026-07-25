/**
 * Procedural canvas textures for flat village environment.
 * Style: soft stylized — light pastels, low contrast noise (not muddy dirt soup).
 */
import * as THREE from 'three';

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: false });
  return { c, ctx, size };
}

function toTexture(c, { repeat = 1, nearest = false } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  if (nearest) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
  } else {
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
  }
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Soft meadow grass — bright spring green, gentle patches only. */
export function makeGrassTexture(size = 512) {
  const { c, ctx } = canvas(size);
  // light base (was too dark #5fad4a)
  ctx.fillStyle = '#8ed46a';
  ctx.fillRect(0, 0, size, size);

  // large soft patches — pastel, low alpha
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

  // sparse light blade hints (not dense dark strokes)
  for (let i = 0; i < 500; i++) {
    const x = hash2(i, 10) * size;
    const y = hash2(i, 11) * size;
    const h = 2 + hash2(i, 12) * 5;
    ctx.strokeStyle = `rgba(220,250,180,${0.1 + hash2(i, 14) * 0.12})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (hash2(i, 16) - 0.5) * 2, y - h);
    ctx.stroke();
  }

  return toTexture(c, { repeat: 12 });
}

/** Soft dirt road — sandy beige, gentle ruts (not dark mud). */
export function makeDirtRoadTexture(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#d4c4a8';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 40; i++) {
    const x = hash2(i, 30) * size;
    const y = hash2(i, 31) * size;
    const r = 24 + hash2(i, 32) * 50;
    ctx.fillStyle = `rgba(${200 + hash2(i, 33) * 30},${180 + hash2(i, 34) * 25},${140 + hash2(i, 35) * 20},${0.08 + hash2(i, 36) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // soft dual ruts
  for (const cx of [size * 0.35, size * 0.65]) {
    const g1 = ctx.createLinearGradient(cx - size * 0.1, 0, cx + size * 0.1, 0);
    g1.addColorStop(0, 'rgba(160,140,100,0)');
    g1.addColorStop(0.4, 'rgba(160,140,100,0.14)');
    g1.addColorStop(0.6, 'rgba(160,140,100,0.14)');
    g1.addColorStop(1, 'rgba(160,140,100,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(cx - size * 0.12, 0, size * 0.24, size);
  }

  // light pebbles only
  for (let i = 0; i < 80; i++) {
    const x = hash2(i, 40) * size;
    const y = hash2(i, 41) * size;
    const r = 1 + hash2(i, 42) * 2;
    const v = 170 + Math.floor(hash2(i, 43) * 40);
    ctx.fillStyle = `rgba(${v},${v - 8},${v - 20},0.25)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(c, { repeat: 1 });
}

/** Light cobble plaza — pale warm stone, soft mortar. */
export function makeCobbleTexture(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#c8bca8';
  ctx.fillRect(0, 0, size, size);

  const cols = 10;
  const rows = 10;
  const cellW = size / cols;
  const cellH = size / rows;
  const gap = 2.5;

  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (cellW * 0.45);
    for (let col = 0; col < cols + 1; col++) {
      const x = col * cellW + xOff - cellW * 0.2;
      const y = row * cellH;
      const jx = (hash2(col, row) - 0.5) * 2;
      const jy = (hash2(row, col) - 0.5) * 1.5;
      const w = cellW - gap + (hash2(col + 3, row) - 0.5) * 3;
      const h = cellH - gap + (hash2(col, row + 5) - 0.5) * 2;
      const base = 200 + Math.floor(hash2(col * 2, row * 3) * 28);
      const r = base + 10;
      const g = base;
      const b = base - 18;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      roundRect(ctx, x + gap / 2 + jx, y + gap / 2 + jy, w, h, 3);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,250,${0.06 + hash2(col, row + 9) * 0.06})`;
      roundRect(ctx, x + gap / 2 + jx + 1, y + gap / 2 + jy + 1, w * 0.65, h * 0.3, 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(90,80,65,${0.08 + hash2(col, row + 11) * 0.08})`;
      ctx.lineWidth = 1;
      roundRect(ctx, x + gap / 2 + jx, y + gap / 2 + jy, w, h, 3);
      ctx.stroke();
    }
  }

  return toTexture(c, { repeat: 3 });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Soft shoulder strip — pale grass→sand. */
export function makeShoulderTexture(size = 256) {
  const { c, ctx } = canvas(size);
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0, '#8ed46a');
  g.addColorStop(0.4, '#b0c878');
  g.addColorStop(0.65, '#d0c098');
  g.addColorStop(1, '#d4c4a8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c, { repeat: 4 });
}

/** Building foot apron — light worn earth, soft alpha rim. */
export function makeWornEarthApronTexture(size = 256) {
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

  const tex = toTexture(c, { repeat: 1 });
  return tex;
}
