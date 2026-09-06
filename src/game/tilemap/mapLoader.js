// City map loader -- SYSTEMS #9.
//
// The tile renderer (#6) wants a fully-expanded map: a w x h grid per layer,
// buildings/platforms/streetlamps as plain lists (see renderer.js's own
// header comment for that shape -- this module produces exactly it). Hand-writing
// every one of a 120x68 map's ~8000 cells would make "the city is data, not
// code" a fiction; nobody actually edits that. This is the other half: a
// compact, hand-editable JSON schema --
//
//   { w, h,
//     ground|flat|object|overhead: { default?, bands?, vbands?, stripes?, cells? },
//     platforms: [...], buildings: [...], streetlamps: [...], props: [...] }
//
// A building may also name `cornice`/`plinth` tiles alongside `face`/`base`,
// which is how a background building is pushed back: swapping all four for
// their `*Edge` (shaded-return) variants darkens a whole facade in data,
// with no new art, so the street has a foreground and a background instead
// of every building competing at the same value.
//
// -- expanded into the renderer's full-grid shape. `bands` fills a row range
// with one tile (a pavement, a road); `vbands` is the same thing turned
// sideways, a column range across every row (a cross street cutting through
// the sidewalk/road bands beneath it) -- added alongside a small road system,
// the first time this schema needed anything but a single east-west street;
// `stripes` repeats a tile every `step` columns along one row (a dashed
// centre line); `cells` are one-off overrides (a cracked slab); later entries
// win where they overlap, in that order (bands, then vbands, then stripes,
// then cells). `platforms`/`buildings`/`streetlamps` are already close to
// hand-editable as structured lists, so they pass through with validation only.
//
// Validation matters here specifically because this file is meant to be
// hand-edited: a typo'd tile name or an out-of-bounds building should fail
// loudly, with the offending entry named, not silently misrender or throw
// three files deep inside the renderer -- the same discipline
// tools/flat.mjs's validateGrid already holds sprite art to. Every error
// found is collected before throwing, same as validateGrid, rather than
// stopping at the first one -- a hand-edited file is likely to have more
// than one mistake at a time and deserves to hear about all of them.

import { TILES_KEY, frameSize } from './atlas.js';
import { signLines, signFieldWidth, signLineWidth, signArtPad } from './sign.js';

const LAYER_ROLES = ['ground', 'flat', 'object', 'overhead'];

/** Light kinds a prop may declare. Mirrors sun.js's GLOW_CURVES keys by hand,
 *  the same way sign.js mirrors the signage palette: this module is pure by
 *  design (its "validation needs no browser" property depends on it), and
 *  sun.js is renderer-side. A kind missing here is a loud error rather than a
 *  silent fall back to `window`, because "my kiosk glows the wrong colour" is
 *  exactly the kind of typo that otherwise gets shipped. */
const LIGHT_KINDS = ['window', 'marquee', 'streetlamp', 'lobby', 'tv'];

export class CityMapError extends Error {
  constructor(errs) {
    super(`city map failed validation:\n  ${errs.join('\n  ')}`);
    this.errors = errs;
  }
}

/**
 * @param {object} raw parsed city JSON, e.g. public/assets/city.json
 * @param {Phaser.Scene} [scene] validates tile names against the atlas this
 *   scene actually has loaded -- the one real source of truth for "does this
 *   tile exist", rather than a second list duplicated at runtime. Omit for
 *   pure structural tests that don't need a live scene; tile names are then
 *   left unchecked.
 * @returns {object} `{ w, h, layers, platforms, buildings, streetlamps }` --
 *   the shape TileMapRenderer's constructor wants.
 */
export function loadCityMap(raw, scene) {
  const errs = [];
  const { w, h } = raw;
  if (!(Number.isInteger(w) && w > 0)) errs.push(`w must be a positive integer, got ${JSON.stringify(w)}`);
  if (!(Number.isInteger(h) && h > 0)) errs.push(`h must be a positive integer, got ${JSON.stringify(h)}`);
  if (errs.length) throw new CityMapError(errs);

  const tex = scene?.textures?.get(TILES_KEY);
  const validTile = (name) => !tex || tex.has(name);
  const inBounds = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w && y < h;
  const posInt = (n) => Number.isInteger(n) && n > 0;

  const layers = LAYER_ROLES.map((role) => {
    const spec = raw[role];
    const data = Array.from({ length: h }, () => new Array(w).fill(null));
    if (!spec) return { role, data };

    if (spec.default !== undefined) {
      if (!validTile(spec.default)) errs.push(`${role}.default: unknown tile "${spec.default}"`);
      else for (let y = 0; y < h; y++) data[y].fill(spec.default);
    }
    for (const [i, b] of (spec.bands ?? []).entries()) {
      const label = `${role}.bands[${i}]`;
      if (!(Number.isInteger(b.y0) && Number.isInteger(b.y1) && b.y0 <= b.y1 && b.y0 >= 0 && b.y1 < h)) {
        errs.push(`${label}: bad row range y0=${b.y0} y1=${b.y1} for a map ${h} tiles tall`); continue;
      }
      if (!validTile(b.tile)) { errs.push(`${label}: unknown tile "${b.tile}"`); continue; }
      for (let y = b.y0; y <= b.y1; y++) data[y].fill(b.tile);
    }
    for (const [i, vb] of (spec.vbands ?? []).entries()) {
      const label = `${role}.vbands[${i}]`;
      if (!(Number.isInteger(vb.x0) && Number.isInteger(vb.x1) && vb.x0 <= vb.x1 && vb.x0 >= 0 && vb.x1 < w)) {
        errs.push(`${label}: bad column range x0=${vb.x0} x1=${vb.x1} for a map ${w} tiles wide`); continue;
      }
      if (!validTile(vb.tile)) { errs.push(`${label}: unknown tile "${vb.tile}"`); continue; }
      for (let y = 0; y < h; y++) for (let x = vb.x0; x <= vb.x1; x++) data[y][x] = vb.tile;
    }
    for (const [i, s] of (spec.stripes ?? []).entries()) {
      const label = `${role}.stripes[${i}]`;
      const step = s.step ?? 2, offset = s.offset ?? 0;
      if (!(Number.isInteger(s.y) && s.y >= 0 && s.y < h)) { errs.push(`${label}: row y=${s.y} out of bounds`); continue; }
      if (!posInt(step)) { errs.push(`${label}: step must be a positive integer, got ${step}`); continue; }
      if (!validTile(s.tile)) { errs.push(`${label}: unknown tile "${s.tile}"`); continue; }
      for (let x = offset; x < w; x += step) data[s.y][x] = s.tile;
    }
    for (const [i, c] of (spec.cells ?? []).entries()) {
      const label = `${role}.cells[${i}]`;
      if (!inBounds(c.x, c.y)) { errs.push(`${label}: (${c.x},${c.y}) out of bounds`); continue; }
      if (!validTile(c.tile)) { errs.push(`${label}: unknown tile "${c.tile}" at (${c.x},${c.y})`); continue; }
      data[c.y][c.x] = c.tile;
    }
    return { role, data };
  });

  /** A building/platform footprint fits the map and every referenced tile
   *  name in `keys` exists. Returns nothing -- errors are pushed by side
   *  effect, same accumulate-everything style as the rest of this file. */
  const checkFootprint = (r, label, keys) => {
    if (!(Number.isInteger(r.x) && Number.isInteger(r.y) && posInt(r.w) && posInt(r.h))) {
      errs.push(`${label}: x/y must be integers and w/h positive integers`); return;
    }
    if (r.x < 0 || r.y < 0 || r.x + r.w > w || r.y + r.h > h) {
      errs.push(`${label}: footprint (${r.x},${r.y} ${r.w}x${r.h}) runs outside the ${w}x${h} map`);
    }
    for (const key of keys) if (r[key] !== undefined && !validTile(r[key])) errs.push(`${label}.${key}: unknown tile "${r[key]}"`);
  };

  /**
   * Every line of a signboard fits the pixel width its own board has to show
   * it in -- checked here, once, before the renderer ever bakes a pixel,
   * rather than silently clipping or overrunning the sign.
   *
   * This measures exactly what the renderer will draw: `sign.js` resolves the
   * same line list, with the same per-line scale and face defaults, against
   * the same field width (the board's tile width less its bulb frame and end
   * margins). The two cannot drift, because there is only one copy of that
   * arithmetic and neither file owns it.
   */
  const checkSignText = (label, panel, bandTiles) => {
    const lines = signLines(panel);
    // Without a scene there are no frames to measure, so a board validates as
    // though it carried no art -- see signArtPad.
    const sizeOf = scene ? (t) => frameSize(scene, t) : () => null;
    const avail = signFieldWidth(bandTiles, panel.splay ?? 0, signArtPad(panel, sizeOf));
    lines.forEach((line, i) => {
      const where = lines.length > 1 ? `${label}.lines[${i}]` : label;
      if (typeof line.text !== 'string' || !line.text.length) {
        errs.push(`${where}: must be a non-empty string, got ${JSON.stringify(line.text)}`);
        return;
      }
      if (!(Number.isInteger(line.scale) && line.scale > 0)) {
        errs.push(`${where}: scale must be a positive integer, got ${line.scale}`);
        return;
      }
      const need = signLineWidth(line);
      if (need > avail) {
        errs.push(`${where}: "${line.text}" is ${need}px wide at scale ${line.scale}, ${avail}px available inside a ${bandTiles}-tile board -- shorten it, widen the board, or drop a scale`);
      }
    });
  };

  (raw.platforms ?? []).forEach((p, i) => {
    const label = `platforms[${i}]`;
    checkFootprint(p, label, ['top', 'face']);
    if (p.e !== undefined && !posInt(p.e)) errs.push(`${label}.e must be a positive integer, got ${p.e}`);
  });

  (raw.buildings ?? []).forEach((b, i) => {
    const label = `buildings[${i}]`;
    checkFootprint(b, label, ['top', 'face', 'base', 'cornice', 'plinth']);
    if (b.storeys !== undefined && !posInt(b.storeys)) errs.push(`${label}.storeys must be a positive integer, got ${b.storeys}`);
    if (b.roofDepth !== undefined && !posInt(b.roofDepth)) errs.push(`${label}.roofDepth must be a positive integer, got ${b.roofDepth}`);
    (b.facade ?? []).forEach((d, j) => {
      const dlabel = `${label}.facade[${j}]`;
      if (!validTile(d.tile)) errs.push(`${dlabel}: unknown tile "${d.tile}"`);
      if (!(Number.isInteger(d.fx) && d.fx >= 0 && Number.isInteger(b.w) && d.fx < b.w)) {
        errs.push(`${dlabel}: fx=${d.fx} outside the building's own width ${b.w}`);
      }
      if (d.fy !== undefined && !(Number.isInteger(d.fy) && d.fy >= 0)) errs.push(`${dlabel}: fy must be a non-negative integer, got ${d.fy}`);
      // `room` is what shows through a see-through window (renderer.js's
      // interior layer). Only the tile name is checked here -- whether the
      // window it is behind actually has a hole in it is a fact the atlas
      // carries, so the renderer is the honest place for that, and an unused
      // `room` is inert rather than wrong.
      if (d.room !== undefined && !validTile(d.room)) errs.push(`${dlabel}.room: unknown tile "${d.room}"`);
    });
    if (b.awning) {
      const { fx, fw } = b.awning;
      if (!(Number.isInteger(fx) && Number.isInteger(fw) && fw > 0 && fx >= 0 && Number.isInteger(b.w) && fx + fw <= b.w)) {
        errs.push(`${label}.awning: fx=${fx} fw=${fw} runs past the building's own width ${b.w}`);
      }
      if (b.awning.tile !== undefined && !validTile(b.awning.tile)) {
        errs.push(`${label}.awning.tile: unknown tile "${b.awning.tile}"`);
      }
      if (b.awning.h !== undefined && !posInt(b.awning.h)) errs.push(`${label}.awning.h must be a positive integer, got ${b.awning.h}`);
    }
    if (b.sign) {
      const { fx, h, up } = b.sign;
      if (!(Number.isInteger(fx) && fx >= 0 && Number.isInteger(b.w) && fx < b.w)) {
        errs.push(`${label}.sign: fx=${fx} outside the building's own width ${b.w}`);
      }
      if (h !== undefined && !posInt(h)) errs.push(`${label}.sign.h must be a positive integer, got ${h}`);
      // `up` mounts the blade on the facade instead of stacking it off the
      // roofline -- see renderer.js. Absent is still "stack off the roof".
      if (up !== undefined && !posInt(up)) errs.push(`${label}.sign.up must be a positive integer, got ${up}`);
    }
    // Flat bordered signboards -- the cinema's own name, a reader board, or
    // any future panel: one generic list (see renderer.js's own `panels`
    // comment for why this replaced a first pass's separate `awning.name`
    // and single `readerBoard` field).
    (b.panels ?? []).forEach((p, j) => {
      const plabel = `${label}.panels[${j}]`;
      const { fx, fw, h, up } = p;
      if (!(Number.isInteger(fx) && Number.isInteger(fw) && fw > 0 && fx >= 0 && Number.isInteger(b.w) && fx + fw <= b.w)) {
        errs.push(`${plabel}: fx=${fx} fw=${fw} runs past the building's own width ${b.w}`);
      }
      if (h !== undefined && !posInt(h)) errs.push(`${plabel}.h must be a positive integer, got ${h}`);
      if (up !== undefined && !posInt(up)) errs.push(`${plabel}.up must be a positive integer, got ${up}`);
      checkSignText(plabel, p, fw);
    });
  });

  (raw.streetlamps ?? []).forEach((p, i) => {
    if (!inBounds(p.x, p.y)) errs.push(`streetlamps[${i}]: (${p.x},${p.y}) out of bounds`);
  });

  // Freestanding props (see renderer.js's _buildProp). `x, y` is the tile the
  // prop stands ON, so a footprint grows north from that row -- which is why
  // the bounds check below tests `y - d + 1` rather than `y + d`.
  (raw.props ?? []).forEach((p, i) => {
    const label = `props[${i}]`;
    if (!inBounds(p.x, p.y)) { errs.push(`${label}: (${p.x},${p.y}) out of bounds`); return; }
    if (!validTile(p.tile)) errs.push(`${label}: unknown tile "${p.tile}"`);
    if (p.w !== undefined && !posInt(p.w)) errs.push(`${label}.w must be a positive integer, got ${p.w}`);
    if (p.d !== undefined && !posInt(p.d)) errs.push(`${label}.d must be a positive integer, got ${p.d}`);
    const d = p.d ?? 1;
    if (p.y - d + 1 < 0) errs.push(`${label}: a ${d}-tile-deep footprint standing on row ${p.y} runs off the top of the map`);
    if (p.w !== undefined && p.x + p.w > w) {
      errs.push(`${label}: footprint (${p.x} ${p.w} wide) runs outside the ${w}-tile-wide map`);
    }
    if (p.light !== undefined && !LIGHT_KINDS.includes(p.light)) {
      errs.push(`${label}.light: unknown light kind "${p.light}" -- one of ${LIGHT_KINDS.join(', ')}`);
    }
  });

  if (errs.length) throw new CityMapError(errs);

  return {
    w, h, layers,
    platforms: raw.platforms ?? [],
    buildings: raw.buildings ?? [],
    streetlamps: raw.streetlamps ?? [],
    props: raw.props ?? [],
  };
}
