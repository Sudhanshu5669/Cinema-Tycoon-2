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
import { shadowFor, ambientFor, glowFor } from '../src/game/tilemap/sun.js';
import { loadCityMap, CityMapError } from '../src/game/tilemap/mapLoader.js';

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

// A streetlamp is a sprite caster (SYSTEMS #9's follow-up): its shadow follows
// the pole's own thin silhouette, not a swept footprint box -- a box the size
// of the pole's 1-tile footprint dragged sideways would read as a wide slab,
// several tiles across at a low sun, not the thin line a real pole throws.
// The lamp at tile (20, 32) -> world (320, 512) is on open south pavement,
// far from any building's own reach, so this row is only ever this one shadow.
await page.evaluate(() => window.__dev.setTime(17.7));
await page.waitForTimeout(150);
const lampShadowXs = await page.evaluate(() => window.__dev.shadowRow(542, 340, 420));
const lampShadowSpan = lampShadowXs.length ? Math.max(...lampShadowXs) - Math.min(...lampShadowXs) : 0;
check('a streetlamp casts a shadow', lampShadowXs.length > 0);
check('a streetlamp\'s shadow is a thin line, not a dragged slab',
  lampShadowSpan > 0 && lampShadowSpan < 10, `span ${lampShadowSpan}px, ${lampShadowXs.length} lit px`);

// --- lighting: ambient colour + light cutouts track the hour (SYSTEMS #8) ---
// Pure model first, no browser: mirrors how shadowFor itself is tested above.
const luma = (rgb) => ((rgb >> 16 & 0xff) + (rgb >> 8 & 0xff) + (rgb & 0xff)) / 3;
check('ambient is brighter at noon than at midnight',
  luma(ambientFor(12)) > luma(ambientFor(0)),
  `noon ${luma(ambientFor(12)).toFixed(0)} midnight ${luma(ambientFor(0)).toFixed(0)}`);
check('windows are unlit at noon and lit at midnight',
  glowFor(12, 'window').intensity === 0 && glowFor(0, 'window').intensity > 0);
check('the marquee switches on before ordinary windows do',
  glowFor(16.5, 'marquee').intensity > 0 && glowFor(16.5, 'window').intensity === 0,
  `marquee ${glowFor(16.5, 'marquee').intensity.toFixed(2)} window ${glowFor(16.5, 'window').intensity.toFixed(2)}`);

// In the browser: the live Phaser Light2D pipeline (a real per-fragment
// shader, not a bespoke one -- see src/game/lighting.js) actually engaged,
// and its ambient/window/marquee state tracks the same hour as the shadows.
const lightAt = async (h) => {
  await page.evaluate((hh) => window.__dev.setTime(hh), h);
  await page.waitForTimeout(120);
  return page.evaluate(() => window.__dev.tiles());
};
const [litNoon, litNight] = [await lightAt(12), await lightAt(23)];
check('the Light2D pipeline is actually active, not silently degraded', litNoon.lightingActive === true);
// tools/normals.mjs derives the tile atlas's normal map from the same ASCII
// grids the diffuse art reads, and atlas.js's bake() re-attaches it to every
// baked composite (a building's face, its roof, the ground, a platform) via
// Texture#setDataSource -- both steps fail silently, not loudly, so this is
// the regression guard: a broken load or a bake that forgot to carry the
// normal map through degrades every tile back to flat-facing-camera
// lighting without ever erroring.
check('the tile atlas\'s normal map is actually bound, not silently missing', litNoon.normalMapped === true);
check('a baked building face also carries its normal map, not just the raw atlas',
  litNoon.bakedNormalMapped === true);
check('scene ambient colour is brighter at noon than at night',
  luma(litNoon.ambientColor) > luma(litNight.ambientColor),
  `noon ${litNoon.ambientColor.toString(16)} night ${litNight.ambientColor.toString(16)}`);
check('window glow is off at noon and on at night',
  litNoon.windowGlow === 0 && litNight.windowGlow > 0,
  `noon ${litNoon.windowGlow} night ${litNight.windowGlow}`);
check('marquee glow is off at noon and on at night',
  litNoon.marqueeGlow === 0 && litNight.marqueeGlow > 0,
  `noon ${litNoon.marqueeGlow} night ${litNight.marqueeGlow}`);

// --- the player casts a shadow too, from the sun and from nearby lights -----
// The player's own silhouette has real gaps in it (the legs are long, thin
// and clearly separated in the sprite art), and
// those gaps carry through into the shadow -- a single exact-pixel sample can
// land right in one and read as unlit even where the shadow is genuinely
// present. Sampling a small spread of distances along the same direction and
// taking the max is what a real screen reading would do (see the shape with
// your eyes, not one pixel of it) and is what these checks do too.
// A point-light shadow also has a floor on its southward component (see
// shadows.js's PLIGHT_MIN_SOUTH) -- a light exactly level with the player is
// ordinary, not an edge case, once a light has its own position instead of
// one shared sun angle, and a shadow with no reach into this 3/4 view reads
// as broken. That floor only ever rotates a direction *toward* south, never
// away, so `angles` (degrees, rotating toward +y) gives this the same
// tolerance against that deliberate bend that `lens` gives it against the
// silhouette's own gaps.
const maxShadowAlong = async (dx, dy, lens = [10, 16, 22, 30, 40], angles = [0]) => {
  const baseAngle = Math.atan2(dy, dx);
  const vals = await Promise.all(angles.flatMap((deg) => {
    const a = baseAngle + (deg * Math.PI) / 180;
    const ux = Math.cos(a), uy = Math.sin(a);
    return lens.map((len) =>
      page.evaluate((v) => window.__dev.playerShadowAt(v.x, v.y), { x: ux * len, y: uy * len }));
  }));
  return Math.max(...vals);
};

// Hour 15: well before any GLOW_CURVES onset (earliest is DUSK-2), so every
// point light is off regardless of proximity -- a clean sun-only reading.
await page.evaluate(() => window.__dev.setTime(15));
await page.waitForTimeout(150);
await page.evaluate(() => window.__dev.warp(700, 360));
await page.waitForTimeout(200);
const sun = shadowFor(15, 48);
const [withSun, oppositeSun] = await Promise.all([
  maxShadowAlong(sun.dx, sun.dy), maxShadowAlong(-sun.dx, -sun.dy),
]);
check('the player casts a shadow along the sun\'s own direction, not the opposite way',
  withSun > 0.05 && withSun > oppositeSun,
  `with-sun ${withSun.toFixed(2)} opposite ${oppositeSun.toFixed(2)}`);

// Night, standing next to a streetlamp (public/assets/city.json's first
// north lamp, tile (8,24) -> world (136,400) at the base -- the light itself
// sits up near the bulb, a renderer-internal offset, so the exact direction
// away from it is asked of LightingLayer rather than re-derived by hand).
// The shadow should fall away from the lamp, not toward it, regardless of any
// second light also reaching this far (hence a comparative check, not an
// exact on/off one). Offset a little south of the lamp's own row, not level
// with it -- level is a real, correctly-handled case (see shadows.js's
// dy = 0 guard) but its shadow is a near-horizontal sliver by nature, a
// needlessly fussy reading for what this check is actually after.
await page.evaluate(() => window.__dev.setTime(22));
await page.waitForTimeout(150);
await page.evaluate(() => window.__dev.warp(170, 430));
await page.waitForTimeout(200);
const nearestLamp = (await page.evaluate(() => window.__dev.shadowSourcesAt(170, 430)))[0];
const lampDir = { x: 170 - nearestLamp.x, y: 430 - nearestLamp.y };
const [awayFromLamp, towardLamp] = await Promise.all([
  maxShadowAlong(lampDir.x, lampDir.y), maxShadowAlong(-lampDir.x, -lampDir.y),
]);
check('the player casts a shadow away from a nearby streetlamp',
  awayFromLamp > 0.05 && awayFromLamp > towardLamp,
  `away ${awayFromLamp.toFixed(2)} toward ${towardLamp.toFixed(2)}`);

// And the reverse: standing north of the lamp, the shadow should point
// further north (away from it), not south -- exactly the direction a
// southward bias (tried and reverted, see shadows.js's own note) would have
// gotten backwards, so this is the regression check for that specifically.
await page.evaluate(() => window.__dev.warp(170, 370));
await page.waitForTimeout(200);
const lampFromNorth = (await page.evaluate(() => window.__dev.shadowSourcesAt(170, 370)))[0];
const northDir = { x: 170 - lampFromNorth.x, y: 370 - lampFromNorth.y };
const [awayNorth, towardNorth] = await Promise.all([
  maxShadowAlong(northDir.x, northDir.y), maxShadowAlong(-northDir.x, -northDir.y),
]);
check('...and away from a streetlamp that is south of the player, not toward it',
  awayNorth > 0.05 && awayNorth > towardNorth,
  `away ${awayNorth.toFixed(2)} toward ${towardNorth.toFixed(2)}`);

// No popping walking between two lights (SYSTEMS #8's rewrite around
// Light#illuminationAt, replacing a "nearest N" ranked cutoff): a ranking
// has to reassign discretely the moment a third light overtakes the second,
// visible as the shadow suddenly jumping. Weighting every light by its own
// continuous strength instead means the strongest light's own strength
// should change smoothly step to step, even as which lights qualify at all
// changes underneath it (2 lit -> 3 -> 2 again, crossing between the north
// pavement's evenly-spaced streetlamps).
const topStrengthAt = async (x, y) => {
  const sources = await page.evaluate(([px, py]) => window.__dev.shadowSourcesAt(px, py), [x, y]);
  return sources[0]?.strength ?? 0;
};
const walkStrengths = [];
for (let x = 136; x <= 352; x += 12) {
  await page.evaluate(([px, py]) => window.__dev.warp(px, py), [x, 380]);
  await page.waitForTimeout(30);
  walkStrengths.push(await topStrengthAt(x, 380));
}
const maxJump = Math.max(...walkStrengths.slice(1).map((v, i) => Math.abs(v - walkStrengths[i])));
check('walking between two streetlamps, the dominant light\'s strength changes smoothly (no pop)',
  maxJump < 0.1, `max step-to-step jump ${maxJump.toFixed(3)} across ${walkStrengths.length} steps`);

// A point-light player shadow can point at a building behind the player
// (the sun's own shadow never can -- shadowFor's dy is always southward), and
// that shadow needs to fall across the wall instead of vanishing under it the
// moment it crosses the wall's own base row -- see shadows.js's wallLayers /
// _paintOntoWalls. Standing close under the first building (x0-352, front
// wall at world y 288) with its own north lamp (tile 8,24 -> world 136,400,
// well within streetlamp radius 220) puts the lamp-cast shadow squarely into
// the wall behind the player.
await page.evaluate(() => { window.__dev.setTime(22); window.__dev.warp(136, 330); });
await page.waitForTimeout(150);
check('a nearby point light throws the player\'s shadow onto the wall behind them',
  (await page.evaluate(() => window.__dev.tiles())).wallShadowHit);
// Stepping back out of the lamp's reach (and the wall's), the shadow has
// nothing to climb -- this is the regression check for a wall layer left
// stuck visible from a previous frame's shadow.
await page.evaluate(() => window.__dev.warp(900, 500));
await page.waitForTimeout(150);
check('...and stops climbing it once the player walks away',
  !(await page.evaluate(() => window.__dev.tiles())).wallShadowHit);

await lightAt(21.5);
await page.evaluate(() => window.__dev.warp(176, 360));
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(OUT, 'tiles-lighting-night.png') });

// --- city data schema + loader (SYSTEMS #9) ---------------------------------
// Pure model first, no browser: a hand-editable JSON map (bands/stripes/cells
// sugar, same idea as public/assets/city.json) expands into the full-grid
// shape TileMapRenderer wants, and bad data fails loudly and specifically --
// the same discipline tools/flat.mjs's validateGrid holds sprite art to.
const tinyRaw = {
  w: 4, h: 3,
  ground: {
    default: 'road', bands: [{ y0: 1, y1: 1, tile: 'pave' }],
    vbands: [{ x0: 3, x1: 3, tile: 'road' }], cells: [{ x: 2, y: 2, tile: 'kerb' }],
  },
  flat: { stripes: [{ y: 0, tile: 'roadLine', step: 2 }] },
  buildings: [{ x: 0, y: 0, w: 2, h: 1, storeys: 3 }],
};
const tiny = loadCityMap(tinyRaw); // no scene -- tile names unchecked, structure still validated
const groundData = tiny.layers.find((l) => l.role === 'ground').data;
const flatData = tiny.layers.find((l) => l.role === 'flat').data;
check('loader expands a band across its full row range',
  // Excluding the last column, which the vband test below deliberately
  // overrides back to 'road' -- that override is itself the next check.
  groundData[1].slice(0, 3).every((t) => t === 'pave'), groundData[1].join(','));
check('loader applies a sparse cell on top of the band/default fill',
  groundData[2][2] === 'kerb' && groundData[0][0] === 'road');
// A cross street: vbands does to columns what bands does to rows, so a
// vband down the last column overrides the horizontal pave band that same
// column would otherwise have gotten from row 1 -- the same "a cross street
// cuts through the sidewalk band beneath it" shape city.json now uses.
check('loader expands a vband across its full column range, overriding bands under it',
  groundData[0][3] === 'road' && groundData[1][3] === 'road' && groundData[2][3] === 'road',
  `${groundData[0][3]},${groundData[1][3]},${groundData[2][3]}`);
check('loader expands a stripe at its step, leaving the gaps null',
  flatData[0][0] === 'roadLine' && flatData[0][1] === null && flatData[0][2] === 'roadLine');
check('loader passes buildings through', tiny.buildings.length === 1 && tiny.buildings[0].storeys === 3);

let badBoundsErr = null;
try { loadCityMap({ w: 4, h: 3, buildings: [{ x: 3, y: 0, w: 2, h: 1 }] }); }
catch (e) { badBoundsErr = e; }
check('an out-of-bounds building fails loudly, naming the entry',
  badBoundsErr instanceof CityMapError && /buildings\[0\]/.test(badBoundsErr.message),
  badBoundsErr?.message.split('\n')[1]);

// Per user request, "make sure name doesn't overflow the board": a marquee
// name too wide for its own awning band fails loudly at load time, the same
// as every other hand-edited field here -- never a silent clip or overrun
// once the renderer actually bakes it.
let badNameErr = null;
try {
  loadCityMap({ w: 4, h: 3, buildings: [{
    x: 0, y: 0, w: 4, h: 1, panels: [{ fx: 0, fw: 2, text: 'WAY TOO LONG A NAME FOR THIS' }],
  }] });
} catch (e) { badNameErr = e; }
check('a panel name that overflows its band fails loudly, naming the entry',
  badNameErr instanceof CityMapError && /buildings\[0\]\.panels\[0\]/.test(badNameErr.message),
  badNameErr?.message.split('\n')[1]);

// In the browser: an unknown tile name is only catchable against the atlas
// actually loaded, so this half needs a live scene.
const badTileErr = await page.evaluate(() => {
  try { window.__dev.loadCityMap({ w: 2, h: 2, ground: { default: 'not-a-real-tile' } }); return null; }
  catch (e) { return e.message; }
});
check('an unknown tile name fails loudly against the live atlas',
  badTileErr && /not-a-real-tile/.test(badTileErr), badTileErr?.split('\n')[1]);

// The live city itself: SYSTEMS #8's shader is deliberately given more total
// light sources (every window, the marquee, every streetlamp) than fit in one
// screen at once, to actually show its limit rather than assert it never gets
// hit. maxLights caps the shader's per-frame cost, not how large a city can
// be: LightsManager culls to the nearest `maxLights` lights to the *camera*
// every frame, so which lights are lit is a function of where you're
// standing, not a global count.
const cityLightsAt = async (x, y) => {
  await page.evaluate(([wx, wy]) => window.__dev.warp(wx, wy), [x, y]);
  await page.waitForTimeout(150);
  return page.evaluate(() => window.__dev.tiles());
};
const [westEnd, eastEnd] = [await cityLightsAt(80, 400), await cityLightsAt(1800, 400)];
check('the city defines far more lights than fit on one screen',
  westEnd.totalLights > 40, `totalLights ${westEnd.totalLights}`);
check('the shader still only lights the nearest maxLights of them',
  westEnd.activeLightKeys.length <= 16 && eastEnd.activeLightKeys.length <= 16,
  `west ${westEnd.activeLightKeys.length} east ${eastEnd.activeLightKeys.length}`);
check('which lights are active is a function of the camera, not a fixed list',
  westEnd.activeLightKeys.every((k) => !eastEnd.activeLightKeys.includes(k)),
  `${westEnd.activeLightKeys.length} lit at the west end share none of the ${eastEnd.activeLightKeys.length} lit 1720px away at the east end`);
await cityLightsAt(80, 400);
await page.screenshot({ path: path.join(OUT, 'city-lights-west.png') });
await cityLightsAt(1800, 400);
await page.screenshot({ path: path.join(OUT, 'city-lights-east.png') });

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
