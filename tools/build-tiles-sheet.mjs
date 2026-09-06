// Packs the city tile art into a Phaser atlas the game loads at runtime.
//   node tools/build-tiles-sheet.mjs
//   -> public/assets/tiles.png + tiles.json + tiles-normal.png
//
// Same authoring model as the player sheet: the art lives as indexed-colour
// ASCII grids in art/flat/tiles.mjs, this step validates every grid against
// TILE_PALETTE and rasters it. Single 16x16 tiles, taller multi-tile features
// (WINDOW 16x32, DOOR 16x48) and wider ones (WINDOW_WIDE 32x32) are packed into
// one horizontal strip; the JSON is Phaser's atlas-hash format so a frame can be
// any size. A grid's own first row gives its width -- only height was ever
// read from the shared TW/TH before WINDOW_WIDE needed a width that wasn't 16.
//
// A second sheet, tiles-normal.png, is packed in lockstep -- same frame
// positions and sizes, reusing tiles.json rather than a JSON of its own --
// so the live scene's Light2D pipeline (already bound to every tile image,
// see lighting.js's wireLight) can shade real relief instead of only tinting
// flat colour. See tools/normals.mjs for how a normal map is derived from the
// same grid the diffuse raster reads, with no separate art to author.

import fs from 'node:fs';
import path from 'node:path';
import { Bitmap } from './png.mjs';
import { raster, validateGrid } from './flat.mjs';
import { normalRaster } from './normals.mjs';
import { TILE_PALETTE, TILE_HEIGHT } from '../art/flat/palette.mjs';
import { TILES, FEATURES, W as TW, H as TH } from '../art/flat/tiles.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/assets');

/**
 * How strongly TILE_HEIGHT's values tilt each tile's normal map -- tuned per
 * tile, not global, so a subtle ledge (a belt course) doesn't read as heavily
 * as the main event (the roof cornice) even though they share the same
 * underlying height values. Strength 0 -- everything not listed here -- is
 * exactly a flat (128,128,255) normal, i.e. no visual change from before this
 * pass: WALL's speckle, ROOF's gravel grain, PAVE/ROAD/GRASS and the awning
 * are stochastic texture, not a structural edge, and stay flat for now.
 */
const RELIEF_STRENGTH = {
  cornice: 1, corniceEdge: 1,
  beltCourse: 0.5,
  brick: 0.6, brickEdge: 0.6, brickDark: 0.6,
  corniceDark: 1, plinthDark: 0.5,
  plinth: 0.5, plinthEdge: 0.5,
  kerb: 0.7,
  window: 0.8, windowWide: 0.8, windowLit: 0.8, windowWarm: 0.8,
  windowStair: 0.8, windowTv: 0.8,
  door: 0.6,
  // Street furniture and the freestanding props. All of it is small, hard
  // ironwork or panelled joinery -- the kind of shallow, sharp relief this
  // pipeline is good at -- so it all takes the same middling strength rather
  // than each getting a number argued over separately.
  manhole: 0.7, drainGrate: 0.7, pavePatch: 0.4, paveLitter: 0.3,
  hydrant: 0.7, bollard: 0.7, planter: 0.5, aBoard: 0.5,
  ticketKiosk: 0.7, candyCart: 0.6, fireEscape: 0.8, acUnit: 0.7,
  marquee: 0.6, signTower: 0.6, signCap: 0.6,
  boxOffice: 0.7, posterCase: 0.6,
  cinemaDoors: 0.6, candyStand: 0.6,
  // The bulb is the one place this set genuinely wants relief: a marquee bulb
  // is a glass bubble standing off a flat board, and a light raking across a
  // row of them should catch each one. Strongest value in the table for that
  // reason -- everything else here is a ledge or a groove, this is a sphere.
  signBulb: 1.2,
};

// --- validate + raster -----------------------------------------------------
const errs = [];
const frames = [];
for (const [name, grid] of Object.entries({ ...TILES, ...FEATURES })) {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  // Whole-tile sizing is a real constraint for TILES -- they repeat-tile via
  // atlas.js's fill(), which walks a rect in TW/TH steps -- but not for
  // FEATURES: a window or door is placed once at an arbitrary pixel offset
  // (g.tile(), never fill()), so its own width/height only has to be
  // whatever the art calls for (WINDOW is 24px wide, not a multiple of 16).
  if (name in TILES) {
    if (h % TH !== 0) errs.push(`${name}: ${h} rows, not a whole number of ${TH}px tiles`);
    if (w % TW !== 0) errs.push(`${name}: ${w} cols, not a whole number of ${TW}px tiles`);
  }
  errs.push(...validateGrid(name, grid, w, h, TILE_PALETTE));
  frames.push({
    name, w, h,
    bmp: raster(grid, TILE_PALETTE),
    normal: normalRaster(grid, TILE_HEIGHT, RELIEF_STRENGTH[name] ?? 0),
  });
}
if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }

// --- pack into one strip --------------------------------------------------
const GAP = 0;
const sheetH = Math.max(...frames.map((f) => f.h));
const sheetW = frames.reduce((x, f) => x + f.w + GAP, 0) - GAP;
const sheet = new Bitmap(sheetW, sheetH);
const normalSheet = new Bitmap(sheetW, sheetH, [128, 128, 255, 255]);
const atlas = { frames: {}, meta: { image: 'tiles.png', size: { w: sheetW, h: sheetH }, scale: 1 } };

let x = 0;
for (const f of frames) {
  sheet.blit(f.bmp, x, 0, 1);
  normalSheet.blit(f.normal, x, 0, 1);
  atlas.frames[f.name] = {
    frame: { x, y: 0, w: f.w, h: f.h },
    sourceSize: { w: f.w, h: f.h },
    spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
    rotated: false, trimmed: false,
  };
  x += f.w + GAP;
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'tiles.png'), sheet.toPNG());
fs.writeFileSync(path.join(OUT, 'tiles-normal.png'), normalSheet.toPNG());
fs.writeFileSync(path.join(OUT, 'tiles.json'), JSON.stringify(atlas, null, 2));
console.log(`wrote public/assets/tiles.png + tiles-normal.png (${sheetW}x${sheetH}), ${frames.length} frames`);
