// Signboard geometry and text layout -- shared by the renderer that draws a
// board and the loader that validates one.
//
// This is deliberately a module of its own rather than more constants in
// `projection.js`. `mapLoader.js` has to answer "does this name fit its
// board?" *before* the renderer runs, and to do that honestly it has to
// measure exactly what the renderer will draw: the same lines, at the same
// scales, in the same faces, inside the same bulb frame. Putting that
// arithmetic in one pure module is the only way those two can't drift apart
// -- and it has to be pure, because the loader's "validation needs no
// browser" property depends on never reaching Phaser.

import { TILE } from './projection.js';
import { measureWidth, charHeight } from './font.js';

/** One `signBulb` atlas frame is 8x8, and a board's bulb frame steps them at
 *  exactly that pitch -- so this is both the tile size and the width of the
 *  border band a board loses to its own frame on every side. */
export const BULB = 8;

/** Vertical gap between the lines of a multi-line board. */
export const SIGN_LINE_GAP = 3;

/** Default face and size for board text. A marquee is the biggest lettering
 *  on the street, and the 3x5 utility face physically cannot carry that (see
 *  font.js's own note), so signage defaults to the display face. */
export const SIGN_FONT = 'display';
export const SIGN_SCALE = 2;

/** Signage colours. These mirror the signage entries in
 *  `art/flat/palette.mjs` (`+`, `=`, `%`) by hand rather than by import --
 *  `src/` never imports `art/`, which is Node-side authoring tooling; the
 *  baked atlas is the only thing that crosses that line. */
export const SIGN_GOLD = '#f2c451';
export const SIGN_FIELD_COLOR = '#5a161c';
export const SIGN_BACK_COLOR = '#3a0d12';

/** Breathing room kept clear at each end of a line, inside the bulb frame. */
export const SIGN_TEXT_MARGIN = 4;

/**
 * A panel's text as a normalised list of lines. `lines` is the general form
 * (each entry may carry its own `scale`, `color` and `font`, so one board can
 * set a small label over a big title the way a real reader board does);
 * `text` is the one-line shorthand. Defaults resolve here, once, so a board
 * only has to say in data what makes it different from an ordinary one -- and
 * so the loader and the renderer are looking at literally the same list.
 */
export function signLines(p) {
  const raw = p.lines ?? (p.text === undefined ? [] : [{ text: p.text }]);
  return raw.map((l) => ({
    text: l.text,
    scale: l.scale ?? p.scale ?? SIGN_SCALE,
    color: l.color ?? p.color ?? SIGN_GOLD,
    font: l.font ?? p.font ?? SIGN_FONT,
  }));
}

/** Pixel width actually available to text on a board `fw` tiles wide, once
 *  its bulb frame and end margins are taken out. */
export function signFieldWidth(fw) {
  return fw * TILE - BULB * 2 - SIGN_TEXT_MARGIN * 2;
}

/** Pixel height a normalised line list occupies as a block. */
export function signBlockHeight(lines) {
  if (!lines.length) return 0;
  return lines.reduce((a, l) => a + charHeight(l.font) * l.scale, 0)
    + SIGN_LINE_GAP * (lines.length - 1);
}

/** Pixel width of one normalised line. */
export function signLineWidth(line) {
  return measureWidth(line.text, line.scale, line.font);
}
