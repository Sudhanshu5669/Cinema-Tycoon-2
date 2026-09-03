// Composes the flat-direction player animations and emits:
//   public/assets/player.png      4 facings x 6 frames spritesheet (96 x 192)
//   review/player-anim.gif        animated preview, all four facings walking
//   review/player-anim-frames.png static contact sheet of every frame
//
//   node tools/build-walk.mjs
//
// Sheet column order is [idle 0, idle 1, walk 0..3]; row order is
// down / left / right / up. Left is right mirrored.

import fs from 'node:fs';
import path from 'node:path';
import { Bitmap, hexToRGBA } from './png.mjs';
import { encodeGIF, quantise } from './gif.mjs';
import { drawText, textWidth } from './font.mjs';
import { raster, validateGrid } from './flat.mjs';
import { W, H, BODY_ROWS, FACINGS } from '../art/flat/player.mjs';
import { WALK, IDLE } from '../art/flat/walk.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BLANK = '.'.repeat(W);

/**
 * body rows (minus the bob) + leg block. Throws rather than silently emitting a
 * short sprite if a leg block is the wrong length for its bob — that is the one
 * mistake in this format that is invisible until it is on screen.
 */
function compose(facing, { bob, legs, arms }, label) {
  const body = FACINGS[facing];
  const grid = new Array(H).fill(BLANK);
  for (let r = 0; r < BODY_ROWS; r++) {
    const y = r - bob;
    if (y < 0) continue; // row 0 is padding, safe to drop
    grid[y] = arms[r] ?? body[r];
  }
  const legTop = BODY_ROWS - bob;
  if (legTop + legs.length !== H) {
    throw new Error(
      `${label}: leg block is ${legs.length} rows at bob ${bob}, ` +
      `so it ends at ${legTop + legs.length} instead of ${H}`,
    );
  }
  legs.forEach((row, i) => { grid[legTop + i] = row; });
  const errs = validateGrid(label, grid, W, H);
  if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }
  return raster(grid);
}

function mirror(b) {
  const o = new Bitmap(b.w, b.h);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) o.set(b.w - 1 - x, y, b.get(x, y));
  return o;
}

const SOURCE = { down: 'down', left: 'side', right: 'side', up: 'up' };
const FACING_ROWS = ['down', 'left', 'right', 'up'];
const COLS = 6; // idle x2, walk x4

const cells = {};
for (const name of FACING_ROWS) {
  const src = SOURCE[name];
  const frames = [...IDLE[src], ...WALK[src]]
    .map((f, i) => compose(src, f, `${name}:${i}`));
  cells[name] = name === 'left' ? frames.map(mirror) : frames;
}
console.log(`composed ${FACING_ROWS.length * COLS} frames, all ${W}x${H} and validated`);

// ------------------------------------------------- spritesheet for the engine
const sheet = new Bitmap(W * COLS, H * FACING_ROWS.length);
FACING_ROWS.forEach((f, row) => cells[f].forEach((b, col) => sheet.blit(b, col * W, row * H, 1)));
fs.mkdirSync(path.join(ROOT, 'public/assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/assets/player.png'), sheet.toPNG());
console.log(`wrote public/assets/player.png (${sheet.w}x${sheet.h}) rows=${FACING_ROWS.join(',')}`);

// --------------------------------------------------------- animated preview
// Judged on the reference art's grey, at the x3 presentation scale.
const S = 3, GROUND = hexToRGBA('#929292'), PANEL = hexToRGBA('#14171e');
const CELLW = W * S + 34, GW = FACING_ROWS.length * CELLW + 24, GH = H * S + 56;
const palette = [], lookup = new Map();
const gifFrames = [];
for (let i = 0; i < 4; i++) {
  const f = new Bitmap(GW, GH);
  f.rect(0, 0, GW, GH, PANEL);
  f.rect(10, 10, GW - 20, GH - 42, GROUND);
  FACING_ROWS.forEach((name, k) => {
    const b = cells[name][2 + i]; // walk frames start at column 2
    const x = 12 + k * CELLW + 16;
    f.blit(b, x, 14, S);
    drawText(f, name.toUpperCase(), x + (W * S - textWidth(name.toUpperCase(), 2)) / 2,
      GH - 24, 2, hexToRGBA('#ece7db'));
  });
  gifFrames.push(quantise(f, palette, lookup));
}
fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/player-anim.gif'), encodeGIF(gifFrames, palette, 12));
console.log(`wrote review/player-anim.gif (${GW}x${GH}, ${palette.length} colours, 12cs/frame)`);

// ------------------------------------------------------- static contact sheet
const CS = 4, CELL = W * CS + 20, ROWH = H * CS + 26;
const cw = 110 + COLS * CELL, ch = 78 + FACING_ROWS.length * ROWH;
const sh = new Bitmap(cw, ch);
sh.rect(0, 0, cw, ch, PANEL);
drawText(sh, 'PLAYER ANIMATION  -  FLAT DIRECTION  -  16 X 48', 20, 16, 3, hexToRGBA('#ece7db'));
drawText(sh, 'IDLE BREATH X2, THEN THE 4-FRAME WALK', 20, 40, 2, hexToRGBA('#8e8d92'));
const HEADS = ['IDLE 0', 'IDLE 1', 'WALK 0', 'WALK 1', 'WALK 2', 'WALK 3'];
FACING_ROWS.forEach((f, row) => {
  const y = 70 + row * ROWH;
  drawText(sh, f.toUpperCase(), 20, y + (ROWH - 10) / 2, 2, hexToRGBA('#e0954a'));
  cells[f].forEach((b, col) => {
    const x = 106 + col * CELL;
    sh.rect(x, y, W * CS + 12, H * CS + 12, GROUND);
    sh.blit(b, x + 6, y + 6, CS);
    if (row === 0) {
      drawText(sh, HEADS[col], x + (W * CS + 12 - textWidth(HEADS[col], 1)) / 2, y - 12, 1,
        hexToRGBA('#8e8d92'));
    }
  });
});
fs.writeFileSync(path.join(ROOT, 'review/player-anim-frames.png'), sh.toPNG());
console.log(`wrote review/player-anim-frames.png (${cw}x${ch})`);
