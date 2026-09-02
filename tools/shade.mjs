// Procedural sprite shader.
//
// Input is a MATERIAL grid — just the silhouette and which material each region
// is. No shading is authored by hand. The renderer:
//   1. builds a distance field inside each material region,
//   2. derives a surface normal from the gradient of that field,
//   3. lights it with a directional light from the upper-left,
//   4. bakes ambient occlusion where two regions meet and toward the ground,
//   5. forces silhouette-edge pixels to a dark, hue-shifted outline,
//   6. quantises the result to a small number of steps so it stays pixel art
//      rather than a smooth gradient.
//
// An optional OVERRIDE grid ('0'-'9') pins specific pixels to an exact lum
// step, for the handful of details the light model can't know about.

import { MATERIAL_FOR_CHAR, COOL_HUE, WARM_HUE } from '../art/materials.mjs';

// ------------------------------------------------------------------ colour
function hexToHsl(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let s = 0, hue = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  return { h: hue, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v, 255]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255), 255];
}

/** Rotate `from` toward `to` along the shorter arc by fraction `k`. */
function lerpHue(from, to, k) {
  let d = ((to - from + 540) % 360) - 180;
  return from + d * k;
}

/** t in 0..1, where 0.5 is the material's base colour. */
export function rampColor(mat, t) {
  const hsl = mat._hsl ?? (mat._hsl = hexToHsl(mat.base));
  if (mat.flat) return hslToRgb(hsl.h, hsl.s, hsl.l);
  const d = t - 0.5;
  let { h, s, l } = hsl;
  if (d < 0) {
    const k = Math.min(1, -d * 2);
    l -= k * mat.darkL;
    h = lerpHue(h, COOL_HUE, k * mat.coolShift);
    s += k * mat.satDark;
  } else {
    const k = Math.min(1, d * 2);
    l += k * mat.lightL;
    h = lerpHue(h, WARM_HUE, k * mat.warmShift);
    s -= k * mat.satLight;
  }
  return hslToRgb(h, s, l);
}

// ------------------------------------------------------------------ shading
// FLAT cel shading, Stardew-style. Exactly four stops per material:
//
//   outline   the silhouette ring
//   shadow    a band along the bottom and right boundary of each region,
//             plus a contact band under any region that sits on top of it
//   base      everything else
//   highlight a short rim along the top-left boundary
//
// No normals, no falloff. Hard edges are the whole point — a smooth gradient
// is what made the previous pass look like moulded plastic.

const T_OUTLINE = 0.04, T_SHADOW = 0.30, T_BASE = 0.52, T_HILITE = 0.80;

/** How many same-material pixels continue in a direction, capped at `max`. */
function run(at, grid, x, y, dx, dy, m, max) {
  let n = 0;
  while (n < max) {
    if (at(grid, x + dx * (n + 1), y + dy * (n + 1)) !== m) break;
    n++;
  }
  return n;
}

/**
 * @param {string[]} matGrid   rows of material characters, '.' = empty
 * @param {string[]} [ovrGrid] rows of '0'-'9' lum pins, '.' = procedural
 */
export function shadeSprite(matGrid, ovrGrid) {
  const h = matGrid.length, w = matGrid[0].length;
  const at = (g, x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : g[y][x]);

  const px = Array.from({ length: h }, () => new Array(w).fill(null));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mc = matGrid[y][x];
      if (mc === '.') continue;
      const mat = MATERIAL_FOR_CHAR[mc];
      if (!mat) throw new Error(`unknown material char "${mc}" at ${x},${y}`);

      const ov = ovrGrid ? at(ovrGrid, x, y) : '.';
      if (ov !== '.') { px[y][x] = rampColor(mat, Number(ov) / 9); continue; }
      if (mat.flat) { px[y][x] = rampColor(mat, 0.5); continue; }

      const outline =
        at(matGrid, x - 1, y) === '.' || at(matGrid, x + 1, y) === '.' ||
        at(matGrid, x, y - 1) === '.' || at(matGrid, x, y + 1) === '.';
      if (outline) { px[y][x] = rampColor(mat, T_OUTLINE); continue; }

      const sr = mat.shadowRun;
      const down  = run(at, matGrid, x, y,  0,  1, mc, sr + 1);
      const right = run(at, matGrid, x, y,  1,  0, mc, sr + 1);
      const up    = run(at, matGrid, x, y,  0, -1, mc, 2);
      const left  = run(at, matGrid, x, y, -1,  0, mc, 4);

      // Something structural sitting on top casts a contact shadow. Flat details
      // (eyes, mouth) must not — otherwise every pupil smears a blush down the cheek.
      const above = at(matGrid, x, y - 1);
      const aboveMat = MATERIAL_FOR_CHAR[above];
      const contact = above !== '.' && above !== mc && !!aboveMat && !aboveMat.flat;

      let t;
      if (down <= sr || right <= sr || contact) t = T_SHADOW;
      else if (up <= 1 && left <= 3) t = T_HILITE;
      else t = T_BASE;
      px[y][x] = rampColor(mat, t);
    }
  }
  return { w, h, px };
}

/** Validate a grid is rectangular and only uses known materials. */
export function validateGrid(name, grid, w, h) {
  const errs = [];
  if (grid.length !== h) errs.push(`${name}: ${grid.length} rows, expected ${h}`);
  grid.forEach((row, y) => {
    if (row.length !== w) errs.push(`${name} row ${y}: ${row.length} chars, expected ${w} -> "${row}"`);
    for (const ch of row) {
      if (ch !== '.' && !(ch in MATERIAL_FOR_CHAR)) errs.push(`${name} row ${y}: unknown material "${ch}"`);
    }
  });
  return errs;
}
