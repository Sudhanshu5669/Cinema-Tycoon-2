// Renders the flat-direction player for review.
//   node tools/build-flat.mjs  ->  review/player-flat.png
import fs from 'node:fs';
import path from 'node:path';
import { Bitmap, hexToRGBA } from './png.mjs';
import { drawText, textWidth } from './font.mjs';
import { raster, validateGrid } from './flat.mjs';
import { W, H, FACINGS } from '../art/flat/player.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

const cells = {};
for (const [name, grid] of Object.entries(FACINGS)) {
  const errs = validateGrid(name, grid, W, H);
  if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }
  cells[name] = raster(grid);
}
console.log(`composed ${Object.keys(cells).length} facings, all ${W}x${H} and validated`);

function mirror(b) {
  const o = new Bitmap(b.w, b.h);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) o.set(b.w - 1 - x, y, b.get(x, y));
  return o;
}

// The reference art presents on a flat mid grey. Judging outline-less shapes on
// anything else is misleading, so the review sheet uses the same ground.
const BG = hexToRGBA('#929292');
const shots = [
  ['DOWN', cells.down], ['LEFT', mirror(cells.side)],
  ['RIGHT', cells.side], ['UP', cells.up],
];

const S = 6, PAD = 34, CELL = W * S + PAD;
const w = 40 + shots.length * CELL, h = H * S + 190;
const sh = new Bitmap(w, h);
sh.rect(0, 0, w, h, hexToRGBA('#14171e'));
sh.rect(20, 44, w - 40, H * S + 40, BG);
drawText(sh, 'PLAYER  -  FLAT DIRECTION  -  16 X 48', 20, 16, 3, hexToRGBA('#ece7db'));
shots.forEach(([label, b], i) => {
  const x = 40 + i * CELL;
  sh.blit(b, x, 64, S);
  drawText(sh, label, x + (W * S - textWidth(label, 2)) / 2, 56 + H * S + 12, 2, hexToRGBA('#8e8d92'));
});

// The same sprites at 1:1, x2 and the x3 presentation scale — the only honest
// check that an outline-less figure still reads at play size.
const baseY = h - 40;
sh.rect(20, baseY - H * 3 - 14, w - 40, H * 3 + 22, BG);
let x = 40;
for (const z of [1, 2, 3]) {
  for (const [, b] of shots) { sh.blit(b, x, baseY - H * z, z); x += W * z + 5; }
  x += 18;
}
drawText(sh, 'X1   X2   X3 (PRESENTATION SCALE)', 20, baseY + 14, 2, hexToRGBA('#8e8d92'));

fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/player-flat.png'), sh.toPNG());
console.log(`wrote review/player-flat.png (${w}x${h})`);
