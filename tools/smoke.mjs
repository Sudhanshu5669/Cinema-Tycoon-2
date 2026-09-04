// Browser smoke test for whatever system is currently being built.
//
// SYSTEMS.md requires every system be verified in a real browser before the next
// one starts, so this drives an actual Chromium against the dev server rather
// than asserting on a headless mock. It boots the dev scene, holds keys, and
// checks the state of every system built so far — position, facing, animation
// clip, and camera scroll — then saves screenshots.
//
//   npm run dev            (in another terminal)
//   node tools/smoke.mjs   [--url http://localhost:5173]

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'review/smoke');
const url = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:5173';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
};

/** Reach into the running scene. Exposed by DevScene for exactly this. */
const state = (page) => page.evaluate(() => window.__dev?.state());
const camera = (page) => page.evaluate(() => window.__dev?.camera());

/** Hold a key for `ms` of real time so the game's own delta clock advances. */
async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(120); // let the idle clip settle
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__dev?.ready === true, null, { timeout: 15000 });
fs.mkdirSync(OUT, { recursive: true });

const start = await state(page);
check('scene boots and exposes state', !!start, JSON.stringify(start));
check('starts idle, facing down', start.facing === 'down' && !start.moving);

// --- movement ---------------------------------------------------------------
await hold(page, 'ArrowRight', 500);
const right = await state(page);
check('walks right', right.x > start.x + 20, `x ${start.x.toFixed(1)} -> ${right.x.toFixed(1)}`);
check('faces right', right.facing === 'right');
check('returns to idle when keys released', !right.moving && right.anim === 'idle-right');

await hold(page, 'ArrowUp', 400);
const up = await state(page);
check('walks up (screen y decreases)', up.y < right.y - 15, `y ${right.y.toFixed(1)} -> ${up.y.toFixed(1)}`);
check('faces up', up.facing === 'up');

// --- speed is the configured 64 px/s ----------------------------------------
const before = await state(page);
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(1000);
const mid = await state(page);
await page.keyboard.up('ArrowLeft');
const travelled = before.x - mid.x;
check('travels ~64px in 1s', Math.abs(travelled - 64) < 12, `${travelled.toFixed(1)}px`);

// --- diagonals --------------------------------------------------------------
await page.keyboard.down('ArrowRight');
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(300);
const diagA = await state(page);
await page.waitForTimeout(300);
const diagB = await state(page);
await page.keyboard.up('ArrowRight');
await page.keyboard.up('ArrowDown');
check('facing does not strobe on a diagonal', diagA.facing === diagB.facing, diagA.facing);
const dx = Math.abs(diagB.x - diagA.x), dy = Math.abs(diagB.y - diagA.y);
const diagSpeed = Math.hypot(dx, dy) / 0.3;
check('diagonal is not faster than straight', Math.abs(diagSpeed - 64) < 14, `${diagSpeed.toFixed(1)}px/s`);

// --- opposite keys cancel ---------------------------------------------------
const pre = await state(page);
await page.keyboard.down('ArrowLeft');
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(300);
const both = await state(page);
await page.keyboard.up('ArrowLeft');
await page.keyboard.up('ArrowRight');
check('opposite keys cancel', Math.abs(both.x - pre.x) < 1.5, `drift ${(both.x - pre.x).toFixed(2)}px`);

// --- walk clip actually advances --------------------------------------------
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(80);
const fA = await state(page);
await page.waitForTimeout(260);
const fB = await state(page);
check('walk clip is playing', fA.anim === 'walk-down' && fB.anim === 'walk-down');
check('walk frame advances', fA.frame !== fB.frame, `${fA.frame} -> ${fB.frame}`);
await page.screenshot({ path: path.join(OUT, 'walking-down.png') });
await page.keyboard.up('ArrowDown');

// --- camera: follows, holds a deadzone, clamps, stays on whole pixels --------
// SYSTEMS #5. The world is 3 x 3 screens, so there is room to scroll and edges
// to stop at.
const world = await page.evaluate(() => window.__dev.world());

// Centred at rest. The camera aims at the middle of the body, not the feet, so
// the player draws a half-sprite below the centre line.
await page.evaluate(() => window.__dev.warp(window.__dev.world().w / 2, window.__dev.world().h / 2));
await page.waitForTimeout(120);
const centred = await camera(page);
check('camera centres the player at rest',
  Math.abs(centred.screenX - 320) <= 1 && Math.abs(centred.screenY - (180 + 24)) <= 1,
  `screen ${centred.screenX.toFixed(1)} ${centred.screenY.toFixed(1)}`);

// A step smaller than half the deadzone must not move the world at all.
const beforeDz = await camera(page);
await hold(page, 'ArrowRight', 300); // ~19px, deadzone half-width is 48
const afterDz = await camera(page);
check('deadzone: a small step does not scroll the world',
  afterDz.scrollX === beforeDz.scrollX && afterDz.scrollY === beforeDz.scrollY,
  `scroll ${beforeDz.scrollX},${beforeDz.scrollY} -> ${afterDz.scrollX},${afterDz.scrollY}`);
check('deadzone: the player did move inside it',
  Math.abs(afterDz.screenX - beforeDz.screenX) > 10,
  `screenX ${beforeDz.screenX.toFixed(1)} -> ${afterDz.screenX.toFixed(1)}`);

// Push past the deadzone and the camera must take over, and must land on whole
// pixels on every frame it does it — a fractional scroll is what makes static
// tile edges shimmer.
const beforeScroll = await camera(page);
await page.keyboard.down('ArrowRight');
const samples = [];
for (let i = 0; i < 25; i++) {
  samples.push(await camera(page));
  await page.waitForTimeout(40);
}
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(300);
const afterScroll = await camera(page);
check('camera follows past the deadzone', afterScroll.scrollX > beforeScroll.scrollX + 40,
  `scrollX ${beforeScroll.scrollX} -> ${afterScroll.scrollX}`);
check('scroll is a whole pixel on every sampled frame',
  samples.every((s) => Number.isInteger(s.scrollX) && Number.isInteger(s.scrollY)),
  `${samples.length} samples`);
const dz = afterScroll.deadzone;
check('player is held at the deadzone edge while scrolling',
  Math.abs(afterScroll.screenX - dz.right) <= 2,
  `screenX ${afterScroll.screenX.toFixed(1)} vs edge ${dz.right}`);
check('player never leaves the screen',
  samples.every((s) => s.screenX >= 0 && s.screenX <= 640 && s.screenY >= 0 && s.screenY <= 360));

// Vertical follow, on its own axis.
const beforeY = await camera(page);
await hold(page, 'ArrowDown', 900);
const afterY = await camera(page);
check('camera follows vertically', afterY.scrollY > beforeY.scrollY + 20,
  `scrollY ${beforeY.scrollY} -> ${afterY.scrollY}`);

// Bounds. Walking the ~960px to a corner would cost fifteen seconds, so warp
// next to it and walk the rest with real keys.
await page.evaluate(() => window.__dev.warp(60, 100));
await page.waitForTimeout(120);
await page.keyboard.down('ArrowLeft');
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(1200);
await page.keyboard.up('ArrowLeft');
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(300);
const topLeft = await camera(page);
check('camera stops at the world top-left', topLeft.scrollX === 0 && topLeft.scrollY === 0,
  `scroll ${topLeft.scrollX},${topLeft.scrollY}`);
check('player is off-centre at the world edge', topLeft.screenX < 320,
  `screenX ${topLeft.screenX.toFixed(1)}`);
await page.screenshot({ path: path.join(OUT, 'camera-world-edge.png') });

await page.evaluate(() => window.__dev.warp(window.__dev.world().w - 60, window.__dev.world().h - 40));
await page.waitForTimeout(120);
await page.keyboard.down('ArrowRight');
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(1200);
await page.keyboard.up('ArrowRight');
await page.keyboard.up('ArrowDown');
await page.waitForTimeout(300);
const bottomRight = await camera(page);
check('camera stops at the world bottom-right',
  bottomRight.scrollX === world.w - 640 && bottomRight.scrollY === world.h - 360,
  `scroll ${bottomRight.scrollX},${bottomRight.scrollY} vs max ${world.w - 640},${world.h - 360}`);

// Back to the middle for the remaining checks and the idle screenshot.
await page.evaluate(() => window.__dev.warp(window.__dev.world().w / 2, window.__dev.world().h / 2));
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(OUT, 'camera-centred.png') });

// --- pixel-snapped rendering ------------------------------------------------
const snapped = await page.evaluate(() => {
  const p = window.__dev.player();
  return Number.isInteger(p.sprite.x) && Number.isInteger(p.sprite.y);
});
check('sprite is drawn on whole pixels', snapped);

// --- integer presentation scale ---------------------------------------------
const zoom = await page.evaluate(() => window.__dev.zoom());
check('presentation scale is an integer', Number.isInteger(zoom), `x${zoom}`);

await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, 'idle.png') });

check('no console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`screenshots in review/smoke/`);
process.exit(failed.length ? 1 : 0);
