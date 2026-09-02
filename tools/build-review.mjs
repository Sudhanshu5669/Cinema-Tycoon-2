// Renders the player-character review sheet.
import fs from 'node:fs';
import path from 'node:path';
import { Bitmap, hexToRGBA } from './png.mjs';
import { drawText, textWidth } from './font.mjs';
import { shadeSprite, validateGrid, rampColor } from './shade.mjs';
import { applyLighting, MOODS } from './light.mjs';
import { MATERIALS } from '../art/materials.mjs';
import { APPROVED } from '../art/player/index.mjs';
const { FRONT, FRONT_DETAIL, W, H } = APPROVED;

const ROOT = path.resolve(import.meta.dirname, '..');
for (const [n, g] of [['front', FRONT], ['front-detail', FRONT_DETAIL]]) {
  if (n.endsWith('detail')) continue;
  const e = validateGrid(n, g, W, H);
  if (e.length) { console.error('FAILED:\n  ' + e.join('\n  ')); process.exit(1); }
}

const { px } = shadeSprite(FRONT, FRONT_DETAIL);
const sprite = new Bitmap(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[y][x]) sprite.set(x, y, px[y][x]);
fs.mkdirSync(path.join(ROOT, 'public/assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/assets/player-front.png'), sprite.toPNG());

const INK = hexToRGBA('#ece7db'), DIM = hexToRGBA('#8e8d92'), ACC = hexToRGBA('#e0954a');
const BG = hexToRGBA('#14171e'), EDGE = hexToRGBA('#0a0c10');
const CW = 916, CH = 724;
const sh = new Bitmap(CW, CH);
sh.rect(0, 0, CW, CH, BG);

drawText(sh, 'CINEMA TYCOON  /  PLAYER CHARACTER', 22, 18, 3, INK);
drawText(sh, '16 X 32 PX  -  ACTUAL STARDEW SPRITE SCALE  -  NO ANIMATION YET', 22, 42, 2, DIM);

const S = 11, PW = 288, PH = 430, PY = 62;
['neutral', 'day', 'evening'].forEach((key, i) => {
  const mood = MOODS[key];
  const PX0 = 22 + i * (PW + 12);
  sh.rect(PX0, PY, PW, PH, EDGE);
  sh.rect(PX0 + 1, PY + 1, PW - 2, PH - 2, [...mood.ground, 255]);

  const sx = PX0 + Math.round((PW - W * S) / 2), sy = PY + 20;
  // baked contact shadow, drawn by the engine rather than into the sprite
  const cx = sx + (W * S) / 2, cy = sy + H * S - 8;
  for (let y = -12; y <= 12; y++) for (let x = -42; x <= 42; x++) {
    const d = (x * x) / (42 * 42) + (y * y) / (12 * 12);
    if (d <= 1) sh.set(cx + x, cy + y, [8, 6, 14, Math.round(160 * (1 - d * 0.5))]);
  }
  sh.blit(sprite, sx, sy, S);

  const rect = { x: PX0 + 1, y: PY + 1, w: PW - 2, h: PH - 2 };
  applyLighting(sh, rect, mood.ambient, mood.lights.map((L) => ({
    x: rect.x + L.rx * rect.w, y: rect.y + L.ry * rect.h,
    radius: L.radius * rect.h, color: L.color, intensity: L.intensity,
  })));
  drawText(sh, mood.label, PX0 + (PW - textWidth(mood.label, 2)) / 2, PY + PH - 18, 2, ACC);
});

// scale ladder + palette
const LY = PY + PH + 16;
const LH = CH - LY - 18;
sh.rect(22, LY, CW - 44, LH, EDGE);
sh.rect(23, LY + 1, CW - 46, LH - 2, hexToRGBA('#1e2330'));
drawText(sh, 'SCALE LADDER  -  GAME PRESENTS AT 3X ON A 16PX TILE GRID', 34, LY + 12, 2, DIM);
{
  const base = LY + LH - 26;
  let x = 40;
  for (const s of [1, 2, 3]) {
    sh.blit(sprite, x, base - H * s, s);
    const l = `${s}X`;
    drawText(sh, l, x + (W * s - textWidth(l, 2)) / 2, base + 6, 2, s === 3 ? ACC : DIM);
    x += W * s + 26;
  }
  drawText(sh, 'PALETTE - OUTLINE / SHADOW / BASE / HIGHLIGHT, HUE-SHIFTED', 260, LY + 40, 2, DIM);
  const names = [['HAIR','R'],['SKIN','K'],['JACKET','J'],['SHIRT','C'],['SCARF','V'],['TROUSER','P'],['SHOE','S'],['SOLE','L']];
  names.forEach(([n, ch], i) => {
    const col = i % 2, row = (i / 2) | 0;
    const bx = 260 + col * 320, by = LY + 66 + row * 28;
    drawText(sh, n, bx, by + 5, 2, INK);
    let cx2 = bx + 76;
    for (let k = 0; k < 5; k++) {
      const c = rampColor(MATERIALS[ch], k / 4);
      sh.rect(cx2, by, 24, 17, EDGE); sh.rect(cx2 + 1, by + 1, 22, 15, c);
      cx2 += 27;
    }
  });
}

fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/player-review.png'), sh.toPNG());
console.log('wrote review/player-review.png and public/assets/player-front.png');
