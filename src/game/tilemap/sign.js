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
 * A marquee's angled end returns -- the part that makes it a projecting box
 * rather than a board glued flat to the wall.
 *
 * A real marquee juts out over the pavement, so from the street you see its
 * front face *and* the two short sides running back to the building. Those
 * returns are what the reference reads as a marquee at a glance, before any
 * of the lettering is legible: the silhouette is a trapezoid, not a rectangle.
 * A panel opts in with `splay` (px taken off each end for the return), and
 * the return tapers toward its outer edge -- the further from the viewer, the
 * shallower it reads.
 *
 * Banded rather than flat, because a marquee's soffit and fascia are stacked
 * horizontal mouldings and the banding is what tells you the return is a
 * surface turning away rather than a flat block of colour beside the board.
 */
export const SIGN_SPLAY_TAPER = 0.16;   // of board height, lost at the outer edge
export const SIGN_SPLAY_BAND = 3;       // moulding pitch, px
export const SIGN_SPLAY_LIGHT = '#c9b795';
export const SIGN_SPLAY_DARK = '#6a2320';
export const SIGN_SPLAY_EDGE = '#f2c451';

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
 *  its bulb frame, end margins and any angled returns are taken out. The
 *  splay has to be in here and not only in the renderer: this is the number
 *  mapLoader validates a name against before anything is drawn, and a board
 *  that splays has genuinely less room for its text. */
export function signFieldWidth(fw, splay = 0) {
  return fw * TILE - splay * 2 - BULB * 2 - SIGN_TEXT_MARGIN * 2;
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
