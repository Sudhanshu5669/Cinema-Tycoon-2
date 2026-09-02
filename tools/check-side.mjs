// Quick comparison harness: front vs side at the same scale, so relative
// widths can actually be judged rather than guessed at.
import fs from 'node:fs';
import { Bitmap, hexToRGBA } from './png.mjs';
import { drawText } from './font.mjs';
import { shadeSprite } from './shade.mjs';
import * as C from '../art/player/variant-c-wavy.mjs';
import { WALK } from '../art/player/walk-legs.mjs';

const blank = '.'.repeat(16);
function pose(facing) {
  const legs = WALK[facing][0].rows;
  const grid = C.BODIES[facing].concat(legs);
  const det = C.DETAILS[facing].concat(Array(legs.length).fill(blank));
  const { px } = shadeSprite(grid, det);
  const b = new Bitmap(16, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) if (px[y][x]) b.set(x, y, px[y][x]);
  return b;
}
const S = 9, sh = new Bitmap(560, 360);
sh.rect(0, 0, 560, 360, hexToRGBA('#14171e'));
sh.rect(16, 40, 528, 300, hexToRGBA('#8d8b90'));
[['DOWN', 'down'], ['SIDE', 'side'], ['UP', 'up']].forEach(([label, f], i) => {
  const b = pose(f);
  const x = 40 + i * 170;
  sh.blit(b, x, 56, S);
  drawText(sh, label, x + 40, 320, 2, hexToRGBA('#20242c'));
  // measure the widest opaque row of the torso, rows 13..22
  let w = 0;
  for (let y = 13; y <= 22; y++) {
    let lo = 99, hi = -1;
    for (let x2 = 0; x2 < 16; x2++) if (b.get(x2, y)[3] > 0) { lo = Math.min(lo, x2); hi = Math.max(hi, x2); }
    if (hi >= 0) w = Math.max(w, hi - lo + 1);
  }
  drawText(sh, `TORSO ${w}PX`, x + 20, 20, 2, hexToRGBA('#e0954a'));
});
fs.writeFileSync('review/side-check.png', sh.toPNG());
console.log('wrote review/side-check.png');
