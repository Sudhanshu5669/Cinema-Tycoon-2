// Tiny 3x5 uppercase bitmap font -- the runtime twin of `tools/font.mjs`.
//
// Not a shared import from that file on purpose: `tools/` is Node-only build
// tooling and `src/` is what actually ships, and this project has kept that
// boundary clean everywhere else (`src/` never imports `art/` or `tools/`,
// checked before adding this). The glyph table itself is tiny and has no
// Node dependency either way, so duplicating it here -- rather than being the
// first file to cross that boundary -- is the smaller cost. This copy draws
// straight onto a live `CanvasRenderingContext2D` (`fillRect` per lit cell),
// since it exists to bake real, data-driven text into a building's own baked
// texture at runtime (a cinema's name, "NOW SHOWING") -- the tools/ version
// only ever draws onto an offline `Bitmap` for a static review-sheet label.
//
// Per user request ("let the player choose whatever name they want... make
// sure name doesn't overflow the board"): this module's `measureWidth` is
// what `mapLoader.js` calls to validate a marquee name fits its band *before*
// the renderer ever runs, the same "fail loudly, name the entry" discipline
// every other hand-edited field in `city.json` already gets.

const F = (...rows) => rows.join('');

const FONT = {
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

for (const [ch, glyph] of Object.entries(FONT)) {
  if (glyph.length !== 15) throw new Error(`font glyph "${ch}" is ${glyph.length} cells, expected 15`);
}

export const CHAR_W = 3, CHAR_H = 5;
/** Horizontal cells advanced per character at scale 1, glyph plus its gap. */
const ADVANCE = CHAR_W + 1;

/** Pixel width of `text` rendered at `scale`, cheap enough to call from
 *  validation as well as drawing (`mapLoader.js` measures before the
 *  renderer ever bakes a pixel). */
export function measureWidth(text, scale) {
  const s = String(text);
  if (!s.length) return 0;
  return (s.length * ADVANCE - 1) * scale;
}

/**
 * Draw `text` onto a live canvas context, top-left of the first glyph at
 * (x, y). Unknown characters fall back to a blank space rather than failing
 * here -- `measureWidth`/the caller's own data validation is where a bad
 * string is meant to be caught, loudly, before this ever runs.
 */
export function drawText(ctx, text, x, y, scale, color) {
  ctx.fillStyle = color;
  let cx = x;
  for (const raw of String(text).toUpperCase()) {
    const glyph = FONT[raw] ?? FONT[' '];
    for (let row = 0; row < CHAR_H; row++) {
      for (let col = 0; col < CHAR_W; col++) {
        if (glyph[row * CHAR_W + col] !== '#') continue;
        ctx.fillRect(Math.round(cx + col * scale), Math.round(y + row * scale), scale, scale);
      }
    }
    cx += ADVANCE * scale;
  }
}
