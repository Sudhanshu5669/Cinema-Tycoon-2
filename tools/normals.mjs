// Deriving normal maps for the flat tile art, from the same ASCII grids the
// diffuse art already uses -- not a second hand-painted image, and not the
// usual automated approach of inferring height from a finished raster (hard
// in general, and especially hard in pixel art: a flat image can't say what
// a given colour's height or slope was supposed to be, because the same
// colour often stands for several different depths across an image). We
// never have that problem here: every tile-palette character already has
// exactly one intentional meaning (mortar is always a recessed groove, a
// cornice lip is always a raised edge), so TILE_HEIGHT in palette.mjs just
// says what that meaning is, once, and every tile built from these
// characters gets a normal map for free.
//
// Phaser's Light2D pipeline is already bound to every tile image (see
// lighting.js's wireLight) -- this is the other half nothing has supplied
// until now: a normal map lets that *same* live, hour-and-lamp-driven light
// actually shade relief instead of only tinting flat colour uniformly.

import { Bitmap } from './png.mjs';

/** Height at (x, y), edge-clamped so a tile's own border doesn't fall off
 *  into an undefined neighbour -- the gradient at the very edge just repeats
 *  the last real slope instead of spuriously flattening to it. */
function heightAt(grid, heights, x, y) {
  const cy = Math.max(0, Math.min(grid.length - 1, y));
  const row = grid[cy];
  const cx = Math.max(0, Math.min(row.length - 1, x));
  return heights[row[cx]] ?? 0;
}

/**
 * A tangent-space normal map (OpenGL convention: Y+ is "up" the image, matching
 * how Phaser's own example normal maps are authored) derived from a heightfield
 * built out of `grid` + `heights`, via a central-difference slope estimate --
 * the same idea a Sobel filter uses, just directly on the authored heights
 * instead of guessed from colour.
 *
 * @param {string[]} grid same ASCII rows the diffuse raster reads
 * @param {Record<string, number>} heights TILE_HEIGHT
 * @param {number} strength how strongly one unit of height tilts the normal --
 *   tuned per tile (see build-tiles-sheet.mjs's RELIEF_STRENGTH) so a subtle
 *   ledge doesn't read as heavily as the main event even when they share the
 *   same underlying height values.
 * @returns {Bitmap}
 */
export function normalRaster(grid, heights, strength) {
  const h = grid.length, w = grid[0].length;
  const b = new Bitmap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dzdx = (heightAt(grid, heights, x + 1, y) - heightAt(grid, heights, x - 1, y)) / 2;
      const dzdy = (heightAt(grid, heights, x, y + 1) - heightAt(grid, heights, x, y - 1)) / 2;
      const nx = -dzdx * strength;
      const ny = -dzdy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const r = Math.round((nx / len * 0.5 + 0.5) * 255);
      const g = Math.round((ny / len * 0.5 + 0.5) * 255);
      const bl = Math.round((nz / len * 0.5 + 0.5) * 255);
      b.set(x, y, [r, g, bl, 255]);
    }
  }
  return b;
}
