// Reproducible review shots of the cinema entrance.
//   npm run dev                  (in another terminal)
//   node tools/build-entrance.mjs   [--url http://localhost:3000]
//   -> review/cinema-entrance-day.png, review/cinema-entrance-night.png
//
// This exists because the versions of those two files that were in the tree
// before it had no generator at all. They were captured by hand, once, and
// then cited as evidence that a facade "matches the reference" -- a claim
// nobody, including the person making it, could re-check without redoing the
// capture by hand and hoping they picked the same spot and the same hour.
//
// A screenshot used as evidence has to be reproducible or it is not evidence.
// So: one fixed camera position, one fixed pair of hours, no player input, no
// HUD, driven from the same `__dev` seam the smoke test already uses. Run it
// before a facade change and after one and the two files are directly
// comparable, because the only thing that differed is the thing you changed.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'review');
const url = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:3000';

/**
 * Where to stand. The cinema is the building at tile x 38..62, its pavement
 * runs rows 18..22, and this is the middle of its own entrance -- the spot a
 * player actually walks to, which is the only viewpoint the facade has to
 * work from. Pinned as world pixels rather than "walk right for 3 seconds"
 * so the camera lands on the same pixel every run.
 */
const STAND = { x: 800, y: 348 };

/** 22:00 is the shot that matters -- everything on the frontage is lit and
 *  the street around it is not. 12:00 is the control: it shows the facade's
 *  own geometry and colour with the whole lighting layer switched off, which
 *  is where proportion mistakes hide. */
const HOURS = [['night', 22], ['day', 12]];

const browser = await chromium.launch();
// 1920x1080 is the x3 presentation scale of the 640x360 internal resolution,
// so what lands in the PNG is exactly what a player sees, at native pixels
// with no resampling to hide or invent detail.
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__dev?.ready === true, null, { timeout: 20000 });

// The dev HUD is debug furniture, not part of the art being reviewed -- it
// sits over the top-left of the facade, which is exactly where the blade sign
// and the upper windows are.
await page.evaluate(() => window.__dev.hud(false));
await page.evaluate(([x, y]) => window.__dev.warp(x, y), [STAND.x, STAND.y]);

fs.mkdirSync(OUT, { recursive: true });
for (const [name, hour] of HOURS) {
  await page.evaluate((h) => window.__dev.setTime(h), hour);
  // The lighting and shadow layers both bucket by hour and redraw on the next
  // frame; give them a few frames to settle before capturing.
  await page.waitForTimeout(500);
  const file = path.join(OUT, `cinema-entrance-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`wrote review/cinema-entrance-${name}.png  (${String(hour).padStart(2, '0')}:00)`);
}

await browser.close();

if (errors.length) {
  console.error(`\n${errors.length} page error(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
