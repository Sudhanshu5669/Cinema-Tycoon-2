// Fast iteration harness: render just the front pose at several scales.
import fs from 'node:fs';
import path from 'node:path';
import { Bitmap } from './png.mjs';
import { shadeSprite, validateGrid } from './shade.mjs';
import { APPROVED } from '../art/player/index.mjs';
const { FRONT, FRONT_DETAIL, W, H } = APPROVED;

const ROOT = path.resolve(import.meta.dirname, '..');
const errs = validateGrid('front', FRONT, W, H);
if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }

const { px } = shadeSprite(FRONT, FRONT_DETAIL);
const sprite = new Bitmap(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[y][x]) sprite.set(x, y, px[y][x]);

// Contact sheet: 8x on light ground, 8x on dark ground, plus 1x/2x/4x ladder.
const sheet = new Bitmap(760, 520);
sheet.rect(0, 0, 760, 520, [24, 22, 30, 255]);
sheet.rect(20, 20, 340, 480, [150, 148, 152, 255]);   // daylight ground
sheet.rect(376, 20, 340, 480, [38, 34, 48, 255]);     // night ground
sheet.blit(sprite, 20 + (340 - W * 13) / 2, 46, 13);
sheet.blit(sprite, 376 + (340 - W * 13) / 2, 46, 13);
fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/front.png'), sheet.toPNG());
console.log('wrote review/front.png');
