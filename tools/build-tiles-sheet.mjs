// Packs the city tile art into a Phaser atlas the game loads at runtime.
//   node tools/build-tiles-sheet.mjs  ->  public/assets/tiles.png + tiles.json
//
// Same authoring model as the player sheet: the art lives as indexed-colour
// ASCII grids in art/flat/tiles.mjs, this step validates every grid against
// TILE_PALETTE and rasters it. Single 16x16 tiles and the taller multi-tile
// features (WINDOW 16x32, DOOR 16x48) are packed into one horizontal strip; the
// JSON is Phaser's atlas-hash format so a frame can be any size.

import fs from 'node:fs';
import path from 'node:path';
import { Bitmap } from './png.mjs';
import { raster, validateGrid } from './flat.mjs';
import { TILE_PALETTE } from '../art/flat/palette.mjs';
import { TILES, FEATURES, W as TW, H as TH } from '../art/flat/tiles.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/assets');

// --- validate + raster -----------------------------------------------------
const errs = [];
const frames = [];
for (const [name, grid] of Object.entries({ ...TILES, ...FEATURES })) {
  const h = grid.length;
  if (h % TH !== 0) errs.push(`${name}: ${h} rows, not a whole number of ${TH}px tiles`);
  errs.push(...validateGrid(name, grid, TW, h, TILE_PALETTE));
  frames.push({ name, bmp: raster(grid, TILE_PALETTE), w: TW, h });
}
if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }

// --- pack into one strip --------------------------------------------------
const GAP = 0;
const sheetH = Math.max(...frames.map((f) => f.h));
const sheetW = frames.reduce((x, f) => x + f.w + GAP, 0) - GAP;
const sheet = new Bitmap(sheetW, sheetH);
const atlas = { frames: {}, meta: { image: 'tiles.png', size: { w: sheetW, h: sheetH }, scale: 1 } };

let x = 0;
for (const f of frames) {
  sheet.blit(f.bmp, x, 0, 1);
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
fs.writeFileSync(path.join(OUT, 'tiles.json'), JSON.stringify(atlas, null, 2));
console.log(`wrote public/assets/tiles.png (${sheetW}x${sheetH}), ${frames.length} frames`);
