// Browser smoke test for whatever system is currently being built.
//
// SYSTEMS.md requires every system be verified in a real browser before the next
// one starts, so this drives an actual Chromium against the dev server rather
// than asserting on a headless mock. It boots the dev scene, holds keys, and
// checks the state of every system built so far — position, facing, animation
// clip, and camera scroll — then saves screenshots.
//
//   npm run dev            (in another terminal)
//   node tools/smoke.mjs   [--url http://localhost:3000]

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { shadowFor } from '../src/game/tilemap/sun.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'review/smoke');
const url = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:3000';

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

// --- tile renderer: elevation, oblique faces, depth sorting (SYSTEMS #6) -----
const tiles = await page.evaluate(() => window.__dev.tiles());
const world = await page.evaluate(() => window.__dev.world());
check('tile map covers the world', tiles.pixelW >= world.w && tiles.pixelH >= world.h,
  `map ${tiles.pixelW}x${tiles.pixelH} vs world ${world.w}x${world.h}`);
const cinema = tiles.structures.find((s) => s.kind === 'building');
const platform = tiles.structures.find((s) => s.kind === 'platform');
check('renderer built a building and a platform', !!cinema && !!platform);

// A building footprint reports its storey height and reads as solid; the open
// road reports elevation 0 and is not solid. This is the contract collision
// (#7) is going to build on.
const inside = await page.evaluate(([x, y]) => window.__dev.probe(x, y),
  [cinema.worldRect.x + 8, cinema.worldRect.y + 8]);
check('heightAt returns the storey count inside a building', inside.height === cinema.storeys,
  `${inside.height} vs ${cinema.storeys}`);
check('solidAt is true inside a building', inside.solid === true);
const road = await page.evaluate(() => window.__dev.probe(window.__dev.world().w / 2, window.__dev.world().h / 2));
check('open ground is elevation 0 and not solid', road.height === 0 && road.solid === false);

// Depth sort: north of the front wall the player is behind the face; south of
// it, in front. The renderer never moves, only the player's depth does.
await page.evaluate(([x, y]) => window.__dev.warp(x, y),
  [cinema.worldRect.x + cinema.worldRect.w / 2, cinema.worldRect.y + 4]);
await page.waitForTimeout(80);
const behind = await page.evaluate(() => window.__dev.tiles());
check('player sorts behind a building when north of its front wall',
  behind.playerDepth < cinema.faceDepth, `depth ${behind.playerDepth} vs face ${cinema.faceDepth}`);

await page.evaluate(([x, y]) => window.__dev.warp(x, y),
  [cinema.worldRect.x + cinema.worldRect.w / 2, cinema.faceDepth + 40]);
await page.waitForTimeout(80);
const front = await page.evaluate(() => window.__dev.tiles());
check('player sorts in front of a building when south of its front wall',
  front.playerDepth > cinema.faceDepth, `depth ${front.playerDepth} vs face ${cinema.faceDepth}`);
await page.screenshot({ path: path.join(OUT, 'tiles-depth-sort.png') });

// A raised platform lifts its top surface and shows an oblique face below it.
check('platform face sits below its raised top', platform.faceDepth > platform.topDepth,
  `face ${platform.faceDepth} top ${platform.topDepth}`);

// --- collision: solidAt blocks the player, sliding past a corner (SYSTEMS #7) -
// Walk straight into the cinema's front wall from open pavement: the player
// should stop short of it, never inside it, and stay put under continued
// pressure (no tunnelling through a stalled resolve).
const wallX = cinema.worldRect.x + cinema.worldRect.w / 2;
await page.evaluate(([x, y]) => window.__dev.warp(x, y), [wallX, cinema.faceDepth + 80]);
await hold(page, 'ArrowUp', 2500);
const stopped = await state(page);
check('walking into a building stops the player short of it',
  stopped.y > cinema.faceDepth && stopped.y < cinema.faceDepth + 20,
  `y ${stopped.y.toFixed(1)} vs face ${cinema.faceDepth}`);
const stoppedProbe = await page.evaluate(([x, y]) => window.__dev.probe(x, y), [wallX, stopped.y]);
check('the player never actually enters the solid footprint', stoppedProbe.solid === false);

// Held against the wall, a diagonal should slide along it (x keeps advancing)
// rather than the whole move rejecting because y alone is blocked.
await page.evaluate(([x, y]) => window.__dev.warp(x, y), [wallX, cinema.faceDepth + 80]);
await page.keyboard.down('ArrowUp');
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(4000);
await page.keyboard.up('ArrowUp');
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(120);
const slid = await state(page);
check('a diagonal into a wall slides along it instead of snagging',
  slid.x > wallX + 20 && slid.y < cinema.faceDepth + 20,
  `x ${wallX.toFixed(1)} -> ${slid.x.toFixed(1)}, y ${slid.y.toFixed(1)}`);
await page.screenshot({ path: path.join(OUT, 'collision-slide.png') });

// --- cast shadows: driven by height and hour (sun.js) -----------------------
// Pure model, no browser: a taller thing throws a longer shadow, noon is
// shorter than dusk, the horizontal swings west -> east across the day, and
// there is nothing at night.
const noon = shadowFor(12, 100), dusk = shadowFor(18, 100);
const noonTall = shadowFor(12, 200);
check('shadow is longer near dusk than at noon', Math.hypot(dusk.dx, dusk.dy) > Math.hypot(noon.dx, noon.dy) * 2,
  `noon ${Math.hypot(noon.dx, noon.dy).toFixed(0)} dusk ${Math.hypot(dusk.dx, dusk.dy).toFixed(0)}`);
check('a taller caster throws a proportionally longer shadow',
  Math.abs(Math.hypot(noonTall.dx, noonTall.dy) / Math.hypot(noon.dx, noon.dy) - 2) < 0.01);
check('shadow points west in the morning, east in the evening',
  shadowFor(8, 100).dx < 0 && shadowFor(16, 100).dx > 0);
check('no cast shadow at night', shadowFor(2, 100) === null && shadowFor(23, 100) === null);

// In the browser: setting the hour re-bakes the shadow layer, and its opacity
// tracks the sun -- firm at midday, faint at dusk, gone at night.
const alphaAt = async (h) => {
  await page.evaluate((hh) => window.__dev.setTime(hh), h);
  await page.waitForTimeout(120);
  return (await page.evaluate(() => window.__dev.tiles())).shadowAlpha;
};
const [aMidday, aDusk, aNight] = [await alphaAt(12), await alphaAt(18.4), await alphaAt(2)];
check('shadow layer is firmer at midday than at dusk', aMidday > aDusk && aDusk > 0,
  `midday ${aMidday.toFixed(3)} dusk ${aDusk.toFixed(3)}`);
check('shadow layer is off at night', aNight === 0);

// A tall building's long dawn/dusk shadow can bleed sideways into a shorter
// neighbour's roof footprint -- the roof/platform-top surfaces shadows.js
// renders on their own, shifted through the same footprint -> screen mapping
// the roof art itself uses. No such reach exists at noon, when shadows are
// short and fall straight down onto the pavement.
const roofHitAt = async (h) => {
  await page.evaluate((hh) => window.__dev.setTime(hh), h);
  await page.waitForTimeout(120);
  return (await page.evaluate(() => window.__dev.tiles())).roofShadowHit;
};
check('a neighbour\'s long dawn shadow reaches onto a shorter roof', await roofHitAt(6.05));
check('no roof shadow at noon, when shadows are short', !(await roofHitAt(12)));

await page.evaluate(() => window.__dev.setTime(15));
await page.waitForTimeout(150);
await page.evaluate(() => window.__dev.warp(430, 330));
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(OUT, 'tiles-shadows-afternoon.png') });

await page.evaluate(() => window.__dev.warp(176, 360));
await page.waitForTimeout(120);

// --- camera: follows, holds a deadzone, clamps, stays on whole pixels --------
// SYSTEMS #5. The world is 3 x 3 screens, so there is room to scroll and edges
// to stop at. `world` is read above, in the tile-renderer section.

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
// tile edges shimmer. The catch-up is an exponential smoothing, not a linear
// one, so it is slow for the first few hundred ms — 45 samples (1.8s) gives
// it enough real time to clear the threshold with margin instead of sitting
// right on it (was 25 samples / 1s, which the heavier tile+shadow render cost
// per frame made this session's real-clock pacing tip below +40px).
const beforeScroll = await camera(page);
await page.keyboard.down('ArrowRight');
const samples = [];
for (let i = 0; i < 45; i++) {
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
