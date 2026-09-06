// An arbitrary review shot: stand somewhere, set an hour, capture.
//   npm run dev                                  (in another terminal)
//   node tools/shot.mjs <name> <x> <y> <hour> [--hud]
//   -> review/<name>.png
//
// build-entrance.mjs is the *pinned* pair of shots -- one spot, two hours,
// never moved, so two runs of it are directly comparable. This is its
// counterpart for everything else: chasing a bug to a particular corner of
// the map at a particular time, where the whole point is that the spot is not
// fixed. Same `__dev` seam, same viewport, so what it writes is still exactly
// what a player sees at native pixels.
//
// It exists because the alternative is capturing by hand, and a screenshot
// captured by hand cannot be re-taken after a fix at the same spot and hour --
// which is precisely when you need it most.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'review');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const showHud = process.argv.includes('--hud');
const url = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:3000';

if (args.length < 4) {
  console.error('usage: node tools/shot.mjs <name> <x> <y> <hour> [--hud]');
  process.exit(1);
}
const [name, x, y, hour] = [args[0], Number(args[1]), Number(args[2]), Number(args[3])];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__dev?.ready === true, null, { timeout: 20000 });

await page.evaluate((on) => window.__dev.hud(on), showHud);
await page.evaluate(([wx, wy]) => window.__dev.warp(wx, wy), [x, y]);
await page.evaluate((h) => window.__dev.setTime(h), hour);
// Both the lighting and shadow layers bucket by hour and redraw on the next
// frame; give them a few frames to settle before capturing.
await page.waitForTimeout(500);

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `${name}.png`);
await page.screenshot({ path: file });
console.log(`wrote review/${name}.png  (${x},${y} at ${String(hour).padStart(2, '0')}:00)`);

await browser.close();
if (errors.length) {
  console.error(`\n${errors.length} page error(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
