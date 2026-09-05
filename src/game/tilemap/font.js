// Bitmap fonts for baked, data-driven signage -- the runtime twin of
// `tools/font.mjs`.
//
// Not a shared import from that file on purpose: `tools/` is Node-only build
// tooling and `src/` is what actually ships, and this project has kept that
// boundary clean everywhere else (`src/` never imports `art/` or `tools/`,
// checked before adding this). The glyph tables are tiny and have no Node
// dependency either way, so duplicating the one this needs here -- rather
// than being the first file to cross that boundary -- is the smaller cost.
// This copy draws straight onto a live `CanvasRenderingContext2D`
// (`fillRect` per lit cell), since it exists to bake real text into a
// building's own baked texture at runtime (a cinema's name, what's showing).
//
// There are two faces, because one was being asked to do two incompatible
// jobs:
//
//   hud      3x5, one-pixel stems. A utility face -- small fixture plaques
//            (TICKET, CANDY), debug readouts, anything that has to fit in a
//            couple of tiles and only needs to be *legible*.
//   display  5x7, with real bowls, a proper crossbar height and diagonals
//            that actually travel. A signage face. A marquee name is the
//            largest lettering on the street and the thing a player reads
//            from across it, and the 3x5 face physically cannot carry that:
//            scaling a 1px stem up just makes a thin letter bigger, never a
//            bold one, so a cinema name set in it read as faint grey text
//            floating on a slab instead of as a sign.
//
// Both are drawn by the same code and measured by the same function; a caller
// picks a face by name and everything downstream (including `mapLoader.js`'s
// "does this name overflow its board" validation) follows automatically.

const F = (...rows) => rows.join('');

/** 3x5 utility face. */
const HUD = {
  A: F('###', '#.#', '###', '#.#', '#.#'),
  B: F('##.', '#.#', '##.', '#.#', '##.'),
  C: F('###', '#..', '#..', '#..', '###'),
  D: F('##.', '#.#', '#.#', '#.#', '##.'),
  E: F('###', '#..', '##.', '#..', '###'),
  F: F('###', '#..', '##.', '#..', '#..'),
  G: F('###', '#..', '#.#', '#.#', '###'),
  H: F('#.#', '#.#', '###', '#.#', '#.#'),
  I: F('###', '.#.', '.#.', '.#.', '###'),
  J: F('..#', '..#', '..#', '#.#', '###'),
  K: F('#.#', '#.#', '##.', '#.#', '#.#'),
  L: F('#..', '#..', '#..', '#..', '###'),
  M: F('#.#', '###', '###', '#.#', '#.#'),
  N: F('##.', '#.#', '#.#', '#.#', '#.#'),
  O: F('###', '#.#', '#.#', '#.#', '###'),
  P: F('###', '#.#', '###', '#..', '#..'),
  Q: F('###', '#.#', '#.#', '###', '..#'),
  R: F('###', '#.#', '##.', '#.#', '#.#'),
  S: F('###', '#..', '###', '..#', '###'),
  T: F('###', '.#.', '.#.', '.#.', '.#.'),
  U: F('#.#', '#.#', '#.#', '#.#', '###'),
  V: F('#.#', '#.#', '#.#', '#.#', '.#.'),
  W: F('#.#', '#.#', '###', '###', '#.#'),
  X: F('#.#', '#.#', '.#.', '#.#', '#.#'),
  Y: F('#.#', '#.#', '.#.', '.#.', '.#.'),
  Z: F('###', '..#', '.#.', '#..', '###'),
  0: F('###', '#.#', '#.#', '#.#', '###'),
  1: F('.#.', '##.', '.#.', '.#.', '###'),
  2: F('###', '..#', '###', '#..', '###'),
  3: F('###', '..#', '.##', '..#', '###'),
  4: F('#.#', '#.#', '###', '..#', '..#'),
  5: F('###', '#..', '###', '..#', '###'),
  6: F('###', '#..', '###', '#.#', '###'),
  7: F('###', '..#', '..#', '..#', '..#'),
  8: F('###', '#.#', '###', '#.#', '###'),
  9: F('###', '#.#', '###', '..#', '###'),
  ' ': F('...', '...', '...', '...', '...'),
  '-': F('...', '...', '###', '...', '...'),
  ':': F('...', '.#.', '...', '.#.', '...'),
  '.': F('...', '...', '...', '...', '.#.'),
  "'": F('.#.', '.#.', '...', '...', '...'),
  '!': F('.#.', '.#.', '.#.', '...', '.#.'),
};

/**
 * 5x7 signage face. Two extra rows over the utility face is what buys real
 * letterforms: a bowl that closes (B, P, R), a crossbar sitting at its own
 * height rather than at the vertical midpoint by necessity, and diagonals
 * (K, X, Z) with room to actually travel instead of collapsing into a
 * one-pixel kink. At the scale a marquee is drawn (x2 or x3), that is the
 * whole difference between lettering and a legibility fallback.
 */
const DISPLAY = {
  A: F('.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'),
  B: F('####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'),
  C: F('.####', '#....', '#....', '#....', '#....', '#....', '.####'),
  D: F('####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'),
  E: F('#####', '#....', '#....', '####.', '#....', '#....', '#####'),
  F: F('#####', '#....', '#....', '####.', '#....', '#....', '#....'),
  G: F('.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'),
  H: F('#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'),
  I: F('#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'),
  J: F('..###', '....#', '....#', '....#', '....#', '#...#', '.###.'),
  K: F('#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'),
  L: F('#....', '#....', '#....', '#....', '#....', '#....', '#####'),
  M: F('#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'),
  N: F('#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'),
  O: F('.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
  P: F('####.', '#...#', '#...#', '####.', '#....', '#....', '#....'),
  Q: F('.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'),
  R: F('####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'),
  S: F('.####', '#....', '#....', '.###.', '....#', '....#', '####.'),
  T: F('#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'),
  U: F('#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
  V: F('#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'),
  W: F('#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'),
  X: F('#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'),
  Y: F('#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'),
  Z: F('#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'),
  0: F('.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'),
  1: F('..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'),
  2: F('.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'),
  3: F('####.', '....#', '....#', '.###.', '....#', '....#', '####.'),
  4: F('#..#.', '#..#.', '#..#.', '#####', '...#.', '...#.', '...#.'),
  5: F('#####', '#....', '#....', '####.', '....#', '#...#', '.###.'),
  6: F('.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'),
  7: F('#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'),
  8: F('.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'),
  9: F('.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'),
  ' ': F('.....', '.....', '.....', '.....', '.....', '.....', '.....'),
  '-': F('.....', '.....', '.....', '#####', '.....', '.....', '.....'),
  ':': F('.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'),
  '.': F('.....', '.....', '.....', '.....', '.....', '.##..', '.##..'),
  "'": F('..#..', '..#..', '..#..', '.....', '.....', '.....', '.....'),
  '!': F('..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'),
};

/**
 * The faces, by name. Each carries its own cell size and the gap it advances
 * between characters -- the display face needs a wider gap because its
 * letters are wider and would otherwise crowd at signage scale.
 */
export const FONTS = {
  hud: { glyphs: HUD, w: 3, h: 5, gap: 1 },
  display: { glyphs: DISPLAY, w: 5, h: 7, gap: 1 },
};

/** Default face for callers that don't name one -- every pre-existing call
 *  site wanted the utility face, so this keeps them working unchanged. */
export const DEFAULT_FONT = 'hud';

for (const [name, face] of Object.entries(FONTS)) {
  const cells = face.w * face.h;
  for (const [ch, glyph] of Object.entries(face.glyphs)) {
    if (glyph.length !== cells) {
      throw new Error(`font "${name}" glyph "${ch}" is ${glyph.length} cells, expected ${cells}`);
    }
  }
}

/** The utility face's cell size, still exported under its original names --
 *  `renderer.js`'s fixture plaques measure their own height off these. */
export const CHAR_W = FONTS.hud.w, CHAR_H = FONTS.hud.h;

const faceOf = (font) => FONTS[font] ?? FONTS[DEFAULT_FONT];

/** Cell height of a named face, at scale 1. */
export function charHeight(font = DEFAULT_FONT) { return faceOf(font).h; }

/**
 * Pixel width of `text` rendered at `scale` in `font`, cheap enough to call
 * from validation as well as drawing (`mapLoader.js` measures before the
 * renderer ever bakes a pixel).
 */
export function measureWidth(text, scale, font = DEFAULT_FONT) {
  const s = String(text);
  if (!s.length) return 0;
  const face = faceOf(font);
  return (s.length * (face.w + face.gap) - face.gap) * scale;
}

/**
 * Draw `text` onto a live canvas context, top-left of the first glyph at
 * (x, y). Unknown characters fall back to a blank space rather than failing
 * here -- `measureWidth`/the caller's own data validation is where a bad
 * string is meant to be caught, loudly, before this ever runs.
 */
export function drawText(ctx, text, x, y, scale, color, font = DEFAULT_FONT) {
  const face = faceOf(font);
  const { glyphs, w, h, gap } = face;
  ctx.fillStyle = color;
  let cx = x;
  for (const raw of String(text).toUpperCase()) {
    const glyph = glyphs[raw] ?? glyphs[' '];
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (glyph[row * w + col] !== '#') continue;
        ctx.fillRect(Math.round(cx + col * scale), Math.round(y + row * scale), scale, scale);
      }
    }
    cx += (w + gap) * scale;
  }
}
