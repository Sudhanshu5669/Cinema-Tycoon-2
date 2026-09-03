// Browser smoke test for whatever system is currently being built.
//
// SYSTEMS.md requires every system be verified in a real browser before the next
// one starts, so this drives an actual Chromium against the dev server rather
// than asserting on a headless mock. It boots the dev scene, holds keys, and
// checks the walking system's own state — position, facing, and which animation
// clip is playing — then saves screenshots.
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
