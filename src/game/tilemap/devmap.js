// The dev sandbox map -- data for the tile renderer to chew on.
//
// Hand-built here rather than loaded from a file because the city data schema
// and its loader are SYSTEMS #9; this is just enough of a street to prove the
// renderer: a flat road with a kerb, pavement wide enough for the camera to
// have room, a contiguous row of buildings with real oblique faces (the cinema
// has a door, a row of windows and an awning), one raised platform to exercise
// a second elevation, and one cell each on the object and overhead layers so
// those code paths are live.
//
// A map is:
//   w, h        size in tiles
//   height      optional number[h][w] base terrain elevation (0 = street)
//   layers      [{ role, data }]  role: 'ground' | 'flat' | 'object' | 'overhead'
//   platforms   [{ x, y, w, h, e, top, face }]                low raised steps
//   buildings   [{ x, y, w, h, storeys, roofDepth, face, base, top, facade[], awning }]
//               facade: [{ tile, fx, fy }]  fx tiles from the left, fy up from
//               the pavement. awning: { fx, fw, up }.

import { INTERNAL_W, INTERNAL_H, TILE } from '../../core/config.js';

export const MAP_W = Math.ceil((INTERNAL_W * 3) / TILE);   // 120
export const MAP_H = Math.ceil((INTERNAL_H * 3) / TILE);   // 68

const fillGrid = (v) => Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => v));

// --- ground: horizontal bands -------------------------------------------
// Behind the north buildings is dark asphalt -- a block interior nobody walks,
// there only so the rooftops have something to sit against.
const ground = fillGrid('road');
const band = (y0, y1, v) => {
  for (let y = y0; y <= y1; y++) for (let x = 0; x < MAP_W; x++) ground[y][x] = v;
};
band(18, 28, 'pave');   // north pavement, in front of the buildings
band(29, 29, 'kerb');   // the kerb tile is the whole pavement->road drop
band(30, 37, 'road');
band(38, 67, 'pave');   // south pavement -- open, with the platform on it

// a few cracked slabs so the pavement does not read as a clean repeat
for (const [x, y] of [[9, 21], [28, 25], [47, 20], [63, 27], [18, 44], [55, 41], [82, 50], [70, 60]]) {
  ground[y][x] = 'paveCrack';
}

// --- flat: road markings down the centre lane --------------------------
const flat = fillGrid(null);
for (let x = 0; x < MAP_W; x++) flat[33][x] = x % 2 === 0 ? 'roadLine' : 'road';

// --- object / overhead: one live cell each ----------------------------
const object = fillGrid(null);
object[46][26] = 'grass';   // a tuft on the south pavement, y-sorted vs the player

const overhead = fillGrid(null);
overhead[41][60] = 'awning';   // a standalone overhead cell, away from any building

export const DEV_MAP = {
  w: MAP_W,
  h: MAP_H,
  layers: [
    { role: 'ground', data: ground },
    { role: 'flat', data: flat },
    { role: 'object', data: object },
    { role: 'overhead', data: overhead },
  ],
  platforms: [
    { x: 30, y: 43, w: 12, h: 7, e: 2, top: 'grass', face: 'plinth' },
  ],
  buildings: [
    {
      // The cinema.
      x: 0, y: 13, w: 22, h: 5, storeys: 7, roofDepth: 3,
      face: 'wall', base: 'brick', top: 'roof',
      facade: [
        { tile: 'door', fx: 10, fy: 0 },
        { tile: 'window', fx: 2, fy: 1 }, { tile: 'window', fx: 5, fy: 1 },
        { tile: 'window', fx: 8, fy: 1 }, { tile: 'window', fx: 13, fy: 1 },
        { tile: 'window', fx: 16, fy: 1 }, { tile: 'window', fx: 19, fy: 1 },
        { tile: 'window', fx: 4, fy: 4 }, { tile: 'window', fx: 10, fy: 4 }, { tile: 'window', fx: 16, fy: 4 },
      ],
      awning: { fx: 6, fw: 10, up: 3 },
    },
    {
      x: 22, y: 13, w: 16, h: 5, storeys: 9, roofDepth: 3,
      face: 'wall', base: 'brick', top: 'roof',
      facade: [
        { tile: 'window', fx: 2, fy: 1 }, { tile: 'window', fx: 7, fy: 1 }, { tile: 'window', fx: 12, fy: 1 },
        { tile: 'window', fx: 2, fy: 4 }, { tile: 'window', fx: 7, fy: 4 }, { tile: 'window', fx: 12, fy: 4 },
        { tile: 'window', fx: 2, fy: 7 }, { tile: 'window', fx: 7, fy: 7 }, { tile: 'window', fx: 12, fy: 7 },
      ],
    },
    {
      x: 38, y: 13, w: 26, h: 5, storeys: 6, roofDepth: 4,
      face: 'brick', base: 'brick', top: 'roof',
      facade: [
        { tile: 'door', fx: 12, fy: 0 },
        { tile: 'window', fx: 3, fy: 1 }, { tile: 'window', fx: 21, fy: 1 },
        { tile: 'window', fx: 3, fy: 4 }, { tile: 'window', fx: 8, fy: 4 },
        { tile: 'window', fx: 16, fy: 4 }, { tile: 'window', fx: 21, fy: 4 },
      ],
    },
  ],
};
