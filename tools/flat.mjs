// Renderer for the flat art direction.
//
// A sprite is a grid of palette characters, '.' meaning transparent. There is
// no shading pass — what is authored is what is drawn. `validateGrid` is the
// only safety net, and it is the important one: a typo'd character at 16x48 is
// otherwise a silent single-pixel bug.

import { Bitmap, hexToRGBA } from './png.mjs';
import { PALETTE } from '../art/flat/palette.mjs';

const RGBA = Object.fromEntries(
  Object.entries(PALETTE).map(([ch, hex]) => [ch, hexToRGBA(hex)]),
);

export function validateGrid(name, grid, w, h) {
  const errs = [];
  if (grid.length !== h) errs.push(`${name}: ${grid.length} rows, expected ${h}`);
  grid.forEach((row, y) => {
    if (row.length !== w) errs.push(`${name} row ${y}: ${row.length} chars, expected ${w} -> "${row}"`);
    for (const ch of row) {
      if (ch !== '.' && !(ch in RGBA)) errs.push(`${name} row ${y}: unknown palette char "${ch}"`);
    }
  });
  return errs;
}

/** @returns {Bitmap} */
export function raster(grid) {
  const h = grid.length, w = grid[0].length;
  const b = new Bitmap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = grid[y][x];
      if (ch !== '.') b.set(x, y, RGBA[ch]);
    }
  }
  return b;
}
