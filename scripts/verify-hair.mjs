/**
 * Hair two-phase verify: idle drape metrics + walk gravity + screenshots.
 * Usage: node scripts/verify-hair.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.screenshots');
fs.mkdirSync(outDir, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ||
  path.join(
    process.env.HOME,
    'Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  );

const URL = process.env.HAIR_URL || 'http://localhost:5173/';

const browser = await chromium.launch({
  // Headless disables WebGL on this machine; headed is required for VRM.
  headless: false,
  executablePath: CHROME,
  args: [
    '--use-angle=metal',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--disable-gpu-sandbox',
  ],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('PAGE_ERR', msg.text());
});
page.on('pageerror', (e) => console.log('PAGE_THROW', e.message));

console.log('goto', URL);
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

await page.waitForFunction(() => !!window.__character?.vrm?.springBoneManager, null, {
  timeout: 90000,
});
await page.waitForTimeout(2000);

// Frame a tight portrait: inject camera if exposed, else move char + use canvas crop later.
await page.evaluate(() => {
  const c = window.__character;
  c.group.position.set(0, 0, 6);
  c.group.rotation.y = 0;
  // Expose framing helpers used by main — try to find OrbitControls via scene graph no-op.
  // Nudge via synthetic: store desired look-at on window for debug HUD.
  window.__hairFrame = { x: 0, y: 1.05, z: 6 };
});
// Best-effort camera framing through lil-gui free orbit isn't available; use CDP-free
// approach: scale character up slightly in shot space by moving toward default cam.
// Default cam ~ (2.5, 5.5, 16) looking at (2, 3, -6). Move char under cam target.
await page.evaluate(() => {
  const c = window.__character;
  // Place under typical controls target path so she fills more of frame.
  c.group.position.set(2, 0, -4);
  c.group.rotation.y = Math.PI; // face camera (cam is south of target looking north)
});
await page.waitForTimeout(800);

const collectMetrics = () =>
  page.evaluate(() => {
    const character = window.__character;
    const vrm = character?.vrm;
    if (!vrm) return { ok: false, reason: 'no vrm' };
    const mgr = vrm.springBoneManager;
    const joints = [...(mgr?.joints ?? mgr?.springBones ?? [])];
    const hair = joints.filter((j) => /hair/i.test(j.bone?.name || ''));

    const samples = [];

    const worldPos = (obj) => {
      obj.updateWorldMatrix(true, false);
      const e = obj.matrixWorld.elements;
      return { x: e[12], y: e[13], z: e[14] };
    };

    // Chain root = hair joint whose parent is not a hair spring bone.
    const hairBones = new Set(hair.map((j) => j.bone));
    const chainRoots = hair.filter((j) => {
      const p = j.bone?.parent;
      return !p || !hairBones.has(p);
    });

    const chains = [];
    for (const j of chainRoots) {
      const name = j.bone?.name || '';
      const m = name.match(/Hair(\d+)_(\d+)/i);
      if (!m) continue;
      const group = +m[2];
      if (group < 5 || group > 12) continue; // long hair only (skip bangs 01-04)

      let leaf = j.bone;
      let guard = 0;
      while (leaf.children?.length && guard++ < 16) {
        const next =
          leaf.children.find((c) => /hair/i.test(c.name || '')) || leaf.children[0];
        if (!next || !/hair/i.test(next.name || '')) break;
        leaf = next;
      }
      const tip = worldPos(leaf);
      const root = worldPos(j.bone);
      const gd = j.settings?.gravityDir;
      // Also sample mid-chain spring gy (use deepest joint settings)
      let deepJoint = j;
      for (const jj of hair) {
        if ((jj.bone?.name || '').includes(`_${String(group).padStart(2, '0')}`) ||
            (jj.bone?.name || '').match(new RegExp(`_${group}$`))) {
          const mm = (jj.bone.name || '').match(/Hair(\d+)_/i);
          const dm = (deepJoint.bone?.name || '').match(/Hair(\d+)_/i);
          if (mm && dm && +mm[1] > +dm[1]) deepJoint = jj;
        }
      }
      const gd2 = deepJoint.settings?.gravityDir || gd;
      chains.push({
        name,
        group,
        tipY: tip.y,
        rootY: root.y,
        tipX: tip.x,
        tipZ: tip.z,
        drop: root.y - tip.y,
        tipRelZ: tip.z - root.z,
        tipRelX: tip.x - root.x,
        gy: gd2?.y ?? null,
        gx: gd2?.x ?? null,
        gz: gd2?.z ?? null,
        stiff: deepJoint.settings?.stiffness,
        gpow: deepJoint.settings?.gravityPower,
      });
    }

    const front = chains.filter((s) => s.group >= 11);
    const back = chains.filter((s) => s.group >= 5 && s.group <= 10);
    const avg = (arr, k) =>
      arr.length ? arr.reduce((a, b) => a + b[k], 0) / arr.length : 0;
    const maxAbs = (arr, k) =>
      arr.length ? Math.max(...arr.map((s) => Math.abs(s[k]))) : 0;

    // Direction of first bone segment (root → child) for hang check
    const dirs = [];
    for (const j of chainRoots) {
      const name = j.bone?.name || '';
      const m = name.match(/Hair\d+_(\d+)/i);
      if (!m) continue;
      const group = +m[1];
      if (group < 5 || group > 12) continue;
      const bone = j.bone;
      const child =
        bone.children.find((c) => /hair/i.test(c.name || '')) || bone.children[0];
      if (!child) continue;
      const a = worldPos(bone);
      const b = worldPos(child);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dy, dz) || 1;
      dirs.push({ group, dx: dx / len, dy: dy / len, dz: dz / len });
    }

    return {
      ok: true,
      nHairJoints: hair.length,
      nChains: chains.length,
      avgDrop: avg(chains, 'drop'),
      minDrop: chains.length ? Math.min(...chains.map((s) => s.drop)) : 0,
      maxDrop: chains.length ? Math.max(...chains.map((s) => s.drop)) : 0,
      frontAvgRelZ: avg(front, 'tipRelZ'),
      backAvgRelZ: avg(back, 'tipRelZ'),
      maxAbsTipRelX: maxAbs(chains, 'tipRelX'),
      avgGy: avg(chains, 'gy'),
      minGy: chains.length ? Math.min(...chains.map((s) => s.gy ?? 0)) : 0,
      maxGy: chains.length ? Math.max(...chains.map((s) => s.gy ?? 0)) : 0,
      avgDirY: avg(dirs, 'dy'),
      dirs,
      chains,
      loco: character.loco,
      wind: character._windSmoothed
        ? { x: character._windSmoothed.x, z: character._windSmoothed.z }
        : null,
      yawRate: character._yawRateSmoothed ?? 0,
    };
  });

const idleMetrics = await collectMetrics();
console.log('IDLE_METRICS', JSON.stringify(idleMetrics, null, 2));

await page.screenshot({
  path: path.join(outDir, 'hair-final-idle.png'),
  type: 'png',
});

// Side view: yaw character 90°
await page.evaluate(() => {
  window.__character.group.rotation.y = Math.PI * 0.55;
});
await page.waitForTimeout(700);
await page.screenshot({
  path: path.join(outDir, 'hair-final-idle-side.png'),
  type: 'png',
});
await page.evaluate(() => {
  window.__character.group.rotation.y = 0;
});
await page.waitForTimeout(400);

// Force walk for ~1.1s via wrapper on entity.update
await page.evaluate(() => {
  window.__hairWalk = true;
  const c = window.__character;
  if (!c.__hairPatched) {
    const orig = c.update.bind(c);
    c.update = (ctx) => {
      const moving = !!window.__hairWalk;
      if (moving) {
        const speed = 3.4;
        const dt = ctx.dt ?? 0.016;
        // walk in local forward (−Z in default spawn facing)
        const yaw = c.group.rotation.y;
        c.group.position.x += Math.sin(yaw) * speed * dt;
        c.group.position.z += Math.cos(yaw) * speed * dt;
      }
      orig({
        ...ctx,
        moving,
        loco: moving ? 'walk' : 'idle',
      });
    };
    c.__hairPatched = true;
  }
});

await page.waitForTimeout(1200);
const walkMetrics = await collectMetrics();
console.log('WALK_METRICS', JSON.stringify(walkMetrics, null, 2));
await page.screenshot({
  path: path.join(outDir, 'hair-final-walk.png'),
  type: 'png',
});

await page.evaluate(() => {
  window.__hairWalk = false;
});
await page.waitForTimeout(600);

const checks = {
  idleDropOk: idleMetrics.avgDrop >= 0.12,
  idleMinDropOk: idleMetrics.minDrop >= 0.08,
  frontRelZ: idleMetrics.frontAvgRelZ,
  backRelZ: idleMetrics.backAvgRelZ,
  walkDropOk: walkMetrics.avgDrop >= 0.1,
  walkGyOk: walkMetrics.maxGy <= -0.75,
  maxAbsTipRelX: idleMetrics.maxAbsTipRelX,
};

console.log('CHECKS', JSON.stringify(checks, null, 2));
fs.writeFileSync(
  path.join(outDir, 'hair-final-metrics.json'),
  JSON.stringify({ idleMetrics, walkMetrics, checks }, null, 2),
);

await browser.close();

const fail = !checks.idleDropOk || !checks.walkDropOk || !checks.walkGyOk;
process.exit(fail ? 2 : 0);
