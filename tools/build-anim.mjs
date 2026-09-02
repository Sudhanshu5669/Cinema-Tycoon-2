// Composes the player walk cycle and emits:
//   public/assets/player-walk.png   4 facings x 4 frames spritesheet (64 x 128)
//   review/player-walk.gif          animated preview, all four facings in step
//   review/player-frames.png        static contact sheet of every frame
//
//   node tools/build-anim.mjs

import fs from 'node:fs';
import path from 'node:path';
import { Bitmap, hexToRGBA } from './png.mjs';
import { encodeGIF, quantise } from './gif.mjs';
import { drawText, textWidth } from './font.mjs';
import { shadeSprite, validateGrid } from './shade.mjs';
import * as C from '../art/player/variant-c-wavy.mjs';
import { WALK } from '../art/player/walk-legs.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const { W, H, BODY_ROWS } = C;

/**
 * A frame is the facing's body rows plus a leg block. On a bobbed frame the body
 * shifts up one pixel and the leg block is one row taller, so the planted foot
 * stays put.
 */
function composeGrid(facing, frame) {
  const detail = C.DETAILS[facing];
  const { bob, rows } = WALK[facing][frame];
  // Apply this frame's arm patch, where the facing has one.
  const armPatch = (C.ARMS[facing] || [])[frame] || {};
  const body = C.BODIES[facing].map((row, i) => armPatch[i] ?? row);
  const grid = new Array(H).fill('.'.repeat(W));
  const det = new Array(H).fill('.'.repeat(W));
  for (let r = 0; r < BODY_ROWS; r++) {
    const y = r - bob;
    if (y < 0) continue;                 // row 0 is padding, safe to drop
    grid[y] = body[r];
    det[y] = detail[r];
  }
  const legTop = BODY_ROWS - bob;        // 23 when flat, 22 when bobbed
  rows.forEach((row, i) => { grid[legTop + i] = row; });
  if (legTop + rows.length !== H) {
    throw new Error(`${facing} frame ${frame}: legs end at ${legTop + rows.length}, expected ${H}`);
  }
  return { grid, det };
}

function mirror(bmp) {
  const out = new Bitmap(bmp.w, bmp.h);
  for (let y = 0; y < bmp.h; y++)
    for (let x = 0; x < bmp.w; x++) out.set(bmp.w - 1 - x, y, bmp.get(x, y));
  return out;
}

function raster(facing, frame) {
  const { grid, det } = composeGrid(facing, frame);
  const errs = validateGrid(`${facing}:${frame}`, grid, W, H);
  if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }
  const { px } = shadeSprite(grid, det);
  const b = new Bitmap(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[y][x]) b.set(x, y, px[y][x]);
  return b;
}

const FACINGS = ['down', 'left', 'right', 'up'];
const FRAMES = 4;
const cells = {};
for (const f of FACINGS) {
  cells[f] = [];
  for (let i = 0; i < FRAMES; i++) {
    cells[f].push(f === 'left' ? mirror(raster('side', i)) : raster(f === 'right' ? 'side' : f, i));
  }
}
console.log(`composed ${FACINGS.length * FRAMES} frames, all 16x32 and validated`);

// ------------------------------------------------- spritesheet for the engine
const sheet = new Bitmap(W * FRAMES, H * FACINGS.length);
FACINGS.forEach((f, row) => cells[f].forEach((b, col) => sheet.blit(b, col * W, row * H, 1)));
fs.mkdirSync(path.join(ROOT, 'public/assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/assets/player-walk.png'), sheet.toPNG());
console.log(`wrote public/assets/player-walk.png (${sheet.w}x${sheet.h}) rows=${FACINGS.join(',')}`);

// --------------------------------------------------------- animated preview
const S = 5, GROUND = [138, 136, 141], PANEL = [22, 25, 32];
const CELLW = W * S + 40, GW = FACINGS.length * CELLW + 24, GH = H * S + 60;
const palette = [], lookup = new Map();
const gifFrames = [];
for (let i = 0; i < FRAMES; i++) {
  const f = new Bitmap(GW, GH);
  f.rect(0, 0, GW, GH, [...PANEL, 255]);
  f.rect(12, 12, GW - 24, GH - 44, [...GROUND, 255]);
  FACINGS.forEach((name, k) => {
    const b = cells[name][i];
    const x = 12 + k * CELLW + 20, y = 20;
    const cx = x + (W * S) / 2, cy = y + H * S - 2;
    for (let yy = -5; yy <= 5; yy++) for (let xx = -16; xx <= 16; xx++) {
      const d = (xx * xx) / 256 + (yy * yy) / 25;
      if (d <= 1) f.set(cx + xx, cy + yy, [12, 10, 18, Math.round(130 * (1 - d * 0.5))]);
    }
    f.blit(b, x, y, S);
    const l = name.toUpperCase();
    drawText(f, l, x + (W * S - textWidth(l, 2)) / 2, GH - 26, 2, [230, 226, 216, 255]);
  });
  gifFrames.push(quantise(f, palette, lookup));
}
fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/player-walk.gif'), encodeGIF(gifFrames, palette, 13));
console.log(`wrote review/player-walk.gif (${GW}x${GH}, ${palette.length} colours, 13cs/frame)`);

// ------------------------------------------------------- static contact sheet
const CS = 6, CELL = W * CS + 26, ROWH = H * CS + 30;
const cw = 120 + FRAMES * CELL, ch = 74 + FACINGS.length * ROWH;
const sh = new Bitmap(cw, ch);
sh.rect(0, 0, cw, ch, hexToRGBA('#14171e'));
drawText(sh, 'PLAYER WALK CYCLE  -  VARIANT C', 20, 16, 3, hexToRGBA('#ece7db'));
drawText(sh, '4 FACINGS X 4 FRAMES  -  FRAME 0 IS ALSO THE IDLE POSE', 20, 40, 2, hexToRGBA('#8e8d92'));
FACINGS.forEach((f, row) => {
  const y = 66 + row * ROWH;
  drawText(sh, f.toUpperCase(), 20, y + (ROWH - 10) / 2, 2, hexToRGBA('#e0954a'));
  cells[f].forEach((b, col) => {
    const x = 116 + col * CELL;
    sh.rect(x, y, W * CS + 14, H * CS + 14, hexToRGBA('#8d8b90'));
    sh.blit(b, x + 7, y + 7, CS);
    if (row === 0) drawText(sh, String(col), x + (W * CS + 14 - textWidth(String(col), 2)) / 2, y - 14, 2, hexToRGBA('#8e8d92'));
  });
});
fs.writeFileSync(path.join(ROOT, 'review/player-frames.png'), sh.toPNG());
console.log(`wrote review/player-frames.png (${cw}x${ch})`);
