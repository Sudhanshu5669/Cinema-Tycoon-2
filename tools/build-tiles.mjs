// Renders the city tile set for review.
//   node tools/build-tiles.mjs  ->  review/tiles.png
//
// Swatches alone are not a validation: flat tiles only prove themselves
// assembled, at the scale they will be played at, next to the character whose
// height sets every proportion in the scene. So the sheet ends with a street
// built out of nothing but these tiles, at the x3 presentation scale.

import fs from 'node:fs';
import path from 'node:path';
import { Bitmap, hexToRGBA } from './png.mjs';
import { drawText, textWidth } from './font.mjs';
import { raster, validateGrid } from './flat.mjs';
import { TILE_PALETTE } from '../art/flat/palette.mjs';
import { TILES, FEATURES, W as TW, H as TH } from '../art/flat/tiles.mjs';
import { DOWN, W as PW, H as PH } from '../art/flat/player.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const INK = hexToRGBA('#ece7db');
const DIM = hexToRGBA('#8e8d92');
const BG = hexToRGBA('#14171e');

// --- validate and raster ----------------------------------------------------
const errs = [];
const art = {};
for (const [name, grid] of Object.entries({ ...TILES, ...FEATURES })) {
  const h = grid.length;
  if (h % TH !== 0) errs.push(`${name}: ${h} rows, not a whole number of ${TH}px tiles`);
  errs.push(...validateGrid(name, grid, TW, h, TILE_PALETTE));
  art[name] = raster(grid, TILE_PALETTE);
}
if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }
const player = raster(DOWN);
console.log(`composed ${Object.keys(TILES).length} tiles + ${Object.keys(FEATURES).length} features, validated`);

// --- the street -------------------------------------------------------------
// 20 x 14 tiles. A two-storey shopfront, the pavement in front of it, the kerb
// and the road: the smallest arrangement that exercises every tile and shows
// the three places the 3/4 view is actually carried.
const MAP_W = 20, MAP_H = 15;
const B0 = 3, B1 = 16;   // building occupies these columns
const GROUND = 9;        // first row of the ground floor

/** Cheap scatter for tile variants. A modulo of the coordinates lays the
 *  variants out in diagonal stripes you can read across the whole pavement,
 *  which is worse than no variation at all. */
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * @param {boolean} shadedReturn draw the building's right-hand column in its
 *   shaded variant. Costs four near-duplicate tiles (wall, brick, cornice,
 *   plinth) for one effect — the reason both versions are on the sheet.
 */
function scene(shadedReturn) {
  const b = new Bitmap(MAP_W * TW, MAP_H * TH);
  const put = (name, tx, ty) => b.blit(art[name], tx * TW, ty * TH, 1);
  const edge = (base) => (shadedReturn ? `${base}Edge` : base);

  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const inBuilding = tx >= B0 && tx <= B1 && ty >= 1 && ty <= 11;
      const isReturn = tx === B1;
      if (ty === 14) put(tx % 2 === 0 ? 'roadLine' : 'road', tx, ty);
      else if (ty === 13) put('kerb', tx, ty);
      else if (!inBuilding) put(hash(tx, ty) < 0.09 ? 'paveCrack' : 'pave', tx, ty);
      else if (ty <= 2) put('roof', tx, ty);
      else if (ty === 3) put(isReturn ? edge('cornice') : 'cornice', tx, ty);
      else if (ty === 11) put(isReturn ? edge('plinth') : 'plinth', tx, ty);
      // Brick to about the height of a person, plaster above it: the eye reads
      // the change of material as a storey line without needing a moulding.
      else if (ty >= GROUND) put(isReturn ? edge('brick') : 'brick', tx, ty);
      else put(isReturn ? edge('wall') : 'wall', tx, ty);
    }
  }

  // A planter, so the pavement is not an unbroken field of grey.
  for (const [gx, gy] of [[1, 10], [2, 10], [1, 11], [2, 11]]) put('grass', gx, gy);

  // Awning over the shopfront, then the openings. Features are transparent
  // outside their own frame, so they sit on plaster or brick unchanged.
  for (let tx = B0 + 1; tx < B1; tx++) put('awning', tx, 8);
  for (const tx of [5, 8, 11, 14]) b.blit(art.window, tx * TW, 5 * TH, 1);
  for (const tx of [5, 6, 12, 13]) b.blit(art.window, tx * TW, GROUND * TH, 1);
  b.blit(art.door, 9 * TW, GROUND * TH, 1);

  // The character, on the pavement in front of the door. Everything in the
  // facade is sized off this figure.
  b.blit(player, 9 * TW + (TW - PW) / 2, 13 * TH - PH, 1);
  return b;
}

const streetA = scene(true);
const streetB = scene(false);
const street = streetA;

// --- sheet ------------------------------------------------------------------
const SW = 1040;
const tileNames = Object.keys(TILES);
const S = 5, CELL = TW * S, GAP = 14, PER_ROW = 7;
const tileRows = Math.ceil(tileNames.length / PER_ROW);

const featTop = 62 + tileRows * (CELL + 22) + 24;
const featH = Math.max(...Object.values(FEATURES).map((g) => g.length)) * S;
const sceneTop = featTop + featH + 44;
const sceneGap = street.h * 3 + 40;
const SH = sceneTop + sceneGap * 2 + 20;

const sh = new Bitmap(SW, SH);
sh.rect(0, 0, SW, SH, BG);
drawText(sh, 'CITY TILES  -  FLAT DIRECTION  -  16 X 16', 24, 18, 3, INK);
drawText(sh, 'SYSTEMS 6  -  FOR APPROVAL BEFORE THE RENDERER IS BUILT', 24, 40, 2, DIM);

tileNames.forEach((name, i) => {
  const x = 24 + (i % PER_ROW) * (CELL + GAP);
  const y = 62 + Math.floor(i / PER_ROW) * (CELL + 22);
  sh.blit(art[name], x, y, S);
  const label = name.replace(/([A-Z])/g, '-$1').toUpperCase();
  drawText(sh, label, x + (CELL - textWidth(label, 2)) / 2, y + CELL + 6, 2, DIM);
});

let fx = 24;
for (const [name, grid] of Object.entries(FEATURES)) {
  sh.blit(art[name], fx, featTop, S);
  const label = `${name.toUpperCase()} 16X${grid.length}`;
  drawText(sh, label, fx, featTop + grid.length * S + 6, 2, DIM);
  fx += TW * S + 40;
}
// The scene at 1:1 beside the features, because a tile set that only works
// blown up is not a tile set.
sh.blit(street, SW - 24 - street.w, featTop, 1);
drawText(sh, 'THE SAME STREET AT 1:1', SW - 24 - street.w, featTop + street.h + 6, 2, DIM);

drawText(sh, 'A  -  X3 PRESENTATION SCALE  -  SHADED RIGHT-HAND RETURN', 24, sceneTop - 18, 2, DIM);
sh.blit(streetA, 24, sceneTop, 3);
drawText(sh, 'B  -  X3  -  FLAT FACADE, NO RETURN  -  4 FEWER TILES', 24, sceneTop + sceneGap - 18, 2, DIM);
sh.blit(streetB, 24, sceneTop + sceneGap, 3);

fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/tiles.png'), sh.toPNG());
console.log(`wrote review/tiles.png (${SW}x${SH})`);
