/**
 * Procedural canvas textures for flat village environment.
 * Style: clean stylized game-prop — readable, not photoreal noise soup.
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

/** Soft meadow grass — warm green with patch variation, no muddy olive. */
export function makeGrassTexture(size = 512) {
  const { c, ctx } = canvas(size);
  // base
  ctx.fillStyle = '#5fad4a';
  ctx.fillRect(0, 0, size, size);

  // large soft patches (meadow tone shifts)
  for (let i = 0; i < 48; i++) {
    const x = hash2(i, 1) * size;
    const y = hash2(i, 2) * size;
    const r = 40 + hash2(i, 3) * 90;
    const g = 140 + Math.floor(hash2(i, 4) * 50);
    const b = 60 + Math.floor(hash2(i, 5) * 30);
    const a = 0.12 + hash2(i, 6) * 0.18;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${g * 0.45},${g},${b},${a})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // fine blade streaks
  for (let i = 0; i < 1200; i++) {
    const x = hash2(i, 10) * size;
    const y = hash2(i, 11) * size;
    const h = 3 + hash2(i, 12) * 8;
    const bright = hash2(i, 13) > 0.55;
    ctx.strokeStyle = bright
      ? `rgba(180,220,120,${0.15 + hash2(i, 14) * 0.2})`
      : `rgba(40,90,30,${0.1 + hash2(i, 15) * 0.15})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (hash2(i, 16) - 0.5) * 3, y - h);
    ctx.stroke();
  }

  // occasional dry / dirt freckles (near paths later blend)
  for (let i = 0; i < 80; i++) {
    const x = hash2(i, 20) * size;
    const y = hash2(i, 21) * size;
    const r = 2 + hash2(i, 22) * 6;
    ctx.fillStyle = `rgba(150,120,70,${0.08 + hash2(i, 23) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(c, { repeat: 14 });
}

/** Packed dirt road — warm brown, dual ruts, small stones. */
export function makeDirtRoadTexture(size = 512) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#a89070';
  ctx.fillRect(0, 0, size, size);

  // macro mottling
  for (let i = 0; i < 60; i++) {
    const x = hash2(i, 30) * size;
    const y = hash2(i, 31) * size;
    const r = 20 + hash2(i, 32) * 60;
    ctx.fillStyle = `rgba(${120 + hash2(i, 33) * 40},${95 + hash2(i, 34) * 30},${55 + hash2(i, 35) * 25},${0.1 + hash2(i, 36) * 0.15})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // dual wagon ruts (along V / tile length → use horizontal in UV)
  // UV: U along road width, V along length — we paint width on X
  for (const cx of [size * 0.35, size * 0.65]) {
    ctx.fillStyle = 'rgba(90,70,45,0.28)';
    ctx.fillRect(cx - size * 0.06, 0, size * 0.12, size);
    // softer edges
    const g1 = ctx.createLinearGradient(cx - size * 0.1, 0, cx + size * 0.1, 0);
    g1.addColorStop(0, 'rgba(90,70,45,0)');
    g1.addColorStop(0.35, 'rgba(90,70,45,0.22)');
    g1.addColorStop(0.65, 'rgba(90,70,45,0.22)');
    g1.addColorStop(1, 'rgba(90,70,45,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(cx - size * 0.12, 0, size * 0.24, size);
  }

  // center ridge slightly lighter
  ctx.fillStyle = 'rgba(200,175,130,0.12)';
  ctx.fillRect(size * 0.42, 0, size * 0.16, size);

  // pebbles
  for (let i = 0; i < 200; i++) {
    const x = hash2(i, 40) * size;
    const y = hash2(i, 41) * size;
    const r = 1 + hash2(i, 42) * 3;
    const v = 90 + Math.floor(hash2(i, 43) * 50);
    ctx.fillStyle = `rgba(${v},${v - 10},${v - 25},0.45)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // edge darker (shoulder dirt)
  const edge = ctx.createLinearGradient(0, 0, size, 0);
  edge.addColorStop(0, 'rgba(70,55,35,0.35)');
  edge.addColorStop(0.12, 'rgba(70,55,35,0)');
  edge.addColorStop(0.88, 'rgba(70,55,35,0)');
  edge.addColorStop(1, 'rgba(70,55,35,0.35)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  return toTexture(c, { repeat: 1 });
}

/** Cobble / packed-stone plaza — readable blocks, warm mortar. */
export function makeCobbleTexture(size = 512) {
  const { c, ctx } = canvas(size);
  // mortar base
  ctx.fillStyle = '#8a7a68';
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
      const jx = (hash2(col, row) - 0.5) * 3;
      const jy = (hash2(row, col) - 0.5) * 2;
      const w = cellW - gap + (hash2(col + 3, row) - 0.5) * 4;
      const h = cellH - gap + (hash2(col, row + 5) - 0.5) * 3;
      const base = 160 + Math.floor(hash2(col * 2, row * 3) * 35);
      const r = base + 15;
      const g = base;
      const b = base - 25;
      // stone body
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      roundRect(ctx, x + gap / 2 + jx, y + gap / 2 + jy, w, h, 3);
      ctx.fill();
      // soft top highlight
      ctx.fillStyle = `rgba(255,255,240,${0.08 + hash2(col, row + 9) * 0.08})`;
      roundRect(ctx, x + gap / 2 + jx + 1, y + gap / 2 + jy + 1, w * 0.7, h * 0.35, 2);
      ctx.fill();
      // edge shade
      ctx.strokeStyle = `rgba(40,35,28,${0.15 + hash2(col, row + 11) * 0.12})`;
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

/** Soft shoulder strip — dirt bleeding into grass. */
export function makeShoulderTexture(size = 256) {
  const { c, ctx } = canvas(size);
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0, '#6aad52');
  g.addColorStop(0.35, '#8a9a58');
  g.addColorStop(0.55, '#a89068');
  g.addColorStop(1, '#9a8060');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(120,100,60,${hash2(i, 50) * 0.2})`;
    ctx.fillRect(hash2(i, 51) * size, hash2(i, 52) * size, 2, 2);
  }
  return toTexture(c, { repeat: 4 });
}

/**
 * Building foot apron — radial worn earth that fades to transparent at the rim.
 * Alpha is baked so grass peeks through the edge (no hard plastic circle).
 */
export function makeWornEarthApronTexture(size = 256) {
  const { c, ctx } = canvas(size);
  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.48;

  // transparent base
  ctx.clearRect(0, 0, size, size);

  // radial dirt body
  const grd = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  grd.addColorStop(0, 'rgba(155,130,90,0.95)');
  grd.addColorStop(0.45, 'rgba(140,115,75,0.88)');
  grd.addColorStop(0.72, 'rgba(125,105,70,0.55)');
  grd.addColorStop(0.9, 'rgba(110,95,60,0.2)');
  grd.addColorStop(1, 'rgba(100,90,55,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // mottled wear + small stones
  for (let i = 0; i < 90; i++) {
    const a = hash2(i, 60) * Math.PI * 2;
    const d = hash2(i, 61) * r * 0.85;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const pr = 2 + hash2(i, 62) * 8;
    const fall = 1 - d / r;
    ctx.fillStyle = `rgba(${100 + hash2(i, 63) * 40},${80 + hash2(i, 64) * 30},${50 + hash2(i, 65) * 20},${0.12 * fall})`;
    ctx.beginPath();
    ctx.arc(x, y, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    const a = hash2(i, 70) * Math.PI * 2;
    const d = hash2(i, 71) * r * 0.7;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const v = 95 + Math.floor(hash2(i, 72) * 40);
    ctx.fillStyle = `rgba(${v},${v - 8},${v - 20},${0.35 * (1 - d / r)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + hash2(i, 73) * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = toTexture(c, { repeat: 1 });
  return tex;
}
