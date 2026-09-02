// Side-by-side comparison of every player variant, so a look can be judged
// against the alternatives rather than in isolation.
import fs from 'node:fs';
import path from 'node:path';
import { Bitmap, hexToRGBA } from './png.mjs';
import { drawText, textWidth } from './font.mjs';
import { shadeSprite, validateGrid } from './shade.mjs';
import { VARIANTS, APPROVED } from '../art/player/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

function raster(v) {
  const errs = validateGrid(v.LABEL, v.FRONT, v.W, v.H);
  if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }
  const { px } = shadeSprite(v.FRONT, v.FRONT_DETAIL);
  const b = new Bitmap(v.W, v.H);
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) if (px[y][x]) b.set(x, y, px[y][x]);
  return b;
}

const sprites = VARIANTS.map(raster);
const { W, H } = VARIANTS[0];

const INK = hexToRGBA('#ece7db'), DIM = hexToRGBA('#8e8d92'), ACC = hexToRGBA('#e0954a');
const BG = hexToRGBA('#14171e'), EDGE = hexToRGBA('#0a0c10'), CARD = hexToRGBA('#8d8b90');

const S = 13, PW = W * S + 56, PH = H * S + 76, GAP = 18;
const CW = 40 + VARIANTS.length * (PW + GAP), CH = PH + 176;
const sh = new Bitmap(CW, CH);
sh.rect(0, 0, CW, CH, BG);

drawText(sh, 'PLAYER VARIANTS', 22, 18, 3, INK);
drawText(sh, '16 X 32 PX  -  PICK ONE, OR MIX FEATURES BETWEEN THEM', 22, 42, 2, DIM);

VARIANTS.forEach((v, i) => {
  const b = sprites[i];
  const X = 22 + i * (PW + GAP), Y = 64;
  const chosen = v.NAME === APPROVED.NAME;
  sh.rect(X, Y, PW, PH, chosen ? ACC : EDGE);
  sh.rect(X + 2, Y + 2, PW - 4, PH - 4, CARD);

  const sx = X + 28, sy = Y + 26;
  const cx = sx + (W * S) / 2, cy = sy + H * S - 6;
  for (let y = -11; y <= 11; y++) for (let x = -40; x <= 40; x++) {
    const d = (x * x) / (40 * 40) + (y * y) / (11 * 11);
    if (d <= 1) sh.set(cx + x, cy + y, [10, 8, 16, Math.round(150 * (1 - d * 0.5))]);
  }
  sh.blit(b, sx, sy, S);

  const tag = chosen ? v.LABEL + '  (SAVED)' : v.LABEL;
  drawText(sh, tag, X + (PW - textWidth(tag, 2)) / 2, Y + PH - 24, 2, hexToRGBA('#20242c'));

  // game-scale strip beneath: what it actually looks like in play
  const gy = Y + PH + 22;
  drawText(sh, 'AT GAME SCALE (3X)', X + 4, gy, 2, DIM);
  [3, 2, 1].forEach((s, k) => {
    sh.blit(b, X + 6 + k * 62, gy + 18, s);
  });
});

fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/player-variants.png'), sh.toPNG());

// Ship the approved variant as the game asset.
const ai = VARIANTS.findIndex((v) => v.NAME === APPROVED.NAME);
fs.mkdirSync(path.join(ROOT, 'public/assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/assets/player-front.png'), sprites[ai].toPNG());
console.log(`wrote review/player-variants.png (${VARIANTS.length} variants)`);
console.log(`approved variant "${APPROVED.LABEL}" -> public/assets/player-front.png`);
