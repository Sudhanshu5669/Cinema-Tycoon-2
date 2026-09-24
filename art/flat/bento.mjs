// The Bento Box -- CITY_PLAN phase 1c, shop 1.
//
// Every grid here is still an indexed-colour picture against TILE_PALETTE (or
// ROOM_PALETTE for the two rooms), rastered and validated by tools/. The only
// difference from tiles.mjs is that these are *composed*: a 48px-wide window is
// a frame, three panes and a sill, so the repetition is written as a loop and
// the parts that carry the drawing -- the noren, the lantern, the chef -- are
// written out by hand. What comes out is still a list of equal-width strings,
// so `validateGrid` treats it exactly like a hand-typed one.
//
// What the shop is made of, and why it reads as a shop and not a house with a
// door: dark timber cladding where every neighbour has brick, an indigo noren
// curtain over the door, paper lanterns under a lettered fascia, and two
// windows that are lit rooms with someone in them. The lanterns and the rooms
// are the emitters; everything else is neutral.

/** A mutable pixel canvas that comes out as an array of row strings. */
function canvas(w, h, fill = '.') {
  const px = Array.from({ length: h }, () => new Array(w).fill(fill));
  const api = {
    set(x, y, ch) { if (x >= 0 && y >= 0 && x < w && y < h) px[y][x] = ch; return api; },
    get: (x, y) => px[y]?.[x],
    rect(x, y, rw, rh, ch) {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) api.set(i, j, ch);
      return api;
    },
    /** A hollow rectangle, one pixel wide. */
    frame(x, y, rw, rh, ch) {
      api.rect(x, y, rw, 1, ch).rect(x, y + rh - 1, rw, 1, ch);
      api.rect(x, y, 1, rh, ch).rect(x + rw - 1, y, 1, rh, ch);
      return api;
    },
    /** Row-by-row art pasted at (x, y); '.' in `rows` leaves what is there. */
    paste(x, y, rows) {
      rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') api.set(x + i, y + j, ch); }));
      return api;
    },
    rows: () => px.map((r) => r.join('')),
  };
  return api;
}

// --- the shopfront ----------------------------------------------------------

/**
 * 192 x 32 -- the timber cladding that fills the ground floor behind the door
 * and both windows, the way a real shopfront is a wooden frame with holes in
 * it. Vertical boarding with a lit top edge, and a moulded stall riser along
 * the foot. Drawn first; the windows punch through it and the door stands on it.
 */
export const BENTO_FRONT = (() => {
  const c = canvas(192, 32, '0');
  c.rect(0, 0, 192, 2, '3');      // top rail, catching the light
  c.rect(0, 2, 192, 1, '8');      // and its shadow
  for (let x = 4; x < 192; x += 8) c.rect(x, 3, 1, 23, '8');    // board joints
  for (let x = 6; x < 192; x += 8) c.rect(x, 3, 1, 23, '3');    // a lit arris beside each
  c.rect(0, 26, 192, 1, '3');     // stall-riser moulding
  c.rect(0, 27, 192, 1, '8');
  c.rect(0, 28, 192, 4, '0');
  for (let x = 4; x < 192; x += 8) c.rect(x, 28, 1, 4, '8');
  return c.rows();
})();

/**
 * 48 x 32 -- a shop window: three panes in a timber frame, over a sill. The
 * glass is an OPENING (transparent, not touching the edge), so `roomBento` /
 * `roomBentoKitchen` shows through it -- see renderer.js's interior layer.
 * Two 2px mullions stay opaque and divide the room behind into real panes.
 */
export const WINDOW_SHOP = (() => {
  const c = canvas(48, 32, 'x');
  c.rect(0, 0, 48, 1, 'x');
  c.rect(1, 1, 46, 1, 'X');
  // Glass: x 3..44, y 3..24. Left transparent.
  c.rect(3, 3, 42, 22, '.');
  // Mullions, restored on top of the hole by the renderer.
  c.rect(16, 3, 2, 22, 'X');
  c.rect(30, 3, 2, 22, 'X');
  c.rect(2, 2, 44, 1, 'X');                 // head reveal
  c.rect(2, 25, 44, 1, 'X');                // sill reveal
  c.rect(0, 26, 48, 2, 'x');                // sill
  c.rect(0, 28, 48, 1, 'l');                // sill lip, catching the light
  c.rect(0, 29, 48, 1, 'L');
  c.rect(0, 30, 48, 2, 'X');
  return c.rows();
})();

// --- the door and the noren --------------------------------------------------

/**
 * 32 x 48 -- the door, with its noren. A glazed timber door lit warm from
 * inside (`;` over `?`, the frosted glass of a place that is open), and over
 * the top of it the curtain: indigo cloth in four panels, split by slits that
 * show the lit glass behind, hung from a dark rod, with a cream mon across the
 * middle. The slits are the point -- a noren that is a solid slab is a banner,
 * and it is the light through the gaps that says somebody is in.
 *
 * The lower third is a timber kick panel, so it stands in the same cladding as
 * the front around it.
 */
export const NOREN_DOOR = (() => {
  const c = canvas(32, 48, '.');
  c.rect(1, 0, 30, 2, 'x');                 // head
  c.rect(1, 2, 30, 1, 'X');
  c.rect(1, 3, 2, 43, 'x');                 // jambs
  c.rect(29, 3, 2, 43, 'x');
  c.rect(3, 3, 1, 43, 'X');
  c.rect(28, 3, 1, 43, 'X');
  c.rect(4, 3, 24, 32, ';');                // the glass
  c.rect(4, 22, 24, 13, '?');               // deepening toward the floor
  c.rect(4, 3, 24, 1, 'x');                 // door-head rail
  // A mid rail across the glass, and a push plate.
  c.rect(4, 31, 24, 1, 'X');
  c.rect(26, 25, 1, 5, 'k');
  // Timber kick panel.
  c.rect(4, 35, 24, 1, '3');
  c.rect(4, 36, 24, 10, '0');
  for (let x = 6; x < 28; x += 6) c.rect(x, 36, 1, 10, '8');
  // Threshold: the same stone as the plinth it stands on, as DOOR does.
  c.rect(1, 46, 30, 2, 'T');

  // Noren. Rod first, then cloth over it.
  c.rect(2, 4, 28, 1, 'E');
  c.rect(1, 4, 1, 2, 'E');
  c.rect(30, 4, 1, 2, 'E');
  const panels = [[4, 5], [10, 5], [16, 6], [23, 5]];   // [x, width]; slits are the 1px gaps
  for (const [px, pw] of panels) {
    c.rect(px, 5, pw, 21, '-');
    c.rect(px + pw - 1, 5, 1, 21, '_');     // the fold on the shaded side of each panel
    c.rect(px, 25, pw, 1, '_');             // the hem
  }
  // The mon: a cream ring across the two middle panels, broken by the slit.
  const mx = 15.5, my = 14.5;
  for (let y = 9; y <= 20; y++) {
    for (let x = 9; x <= 22; x++) {
      const d = Math.hypot(x - mx, y - my);
      if (d <= 4.6 && d >= 2.6) c.set(x, y, '/');
    }
  }
  for (let y = 5; y < 26; y++) {           // slits over everything, ring included
    for (const sx of [9, 15, 22]) c.set(sx, y, y < 22 ? ';' : '?');
  }
  c.rect(2, 26, 26, 1, 'X');               // the cloth's own shadow on the glass
  return c.rows();
})();

// --- lantern ----------------------------------------------------------------

/**
 * 12 x 20 -- a paper chochin, hung by its cord. Dark caps top and bottom, red
 * paper in between with the bright core (`>`) down the middle where the flame
 * is, and three fine ribs. Unlit by day it is a red paper ball; at night the
 * glow layer puts the light around it, and the paper's own bright core is what
 * that light appears to come from.
 */
export const LANTERN = (() => {
  const c = canvas(12, 20, '.');
  c.rect(5, 0, 2, 2, ':');                  // cord
  c.rect(3, 2, 6, 2, ':');                  // top cap
  const half = [4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 5, 4];   // body, one row each, y 4..15
  half.forEach((hw, i) => {
    const y = 4 + i;
    c.rect(6 - hw, y, hw * 2, 1, '<');
    c.rect(6 - Math.min(hw, 3), y, Math.min(hw, 3) * 2, 1, '>');   // lit core
  });
  for (const ry of [6, 9, 12]) c.rect(6 - half[ry - 4], ry, half[ry - 4] * 2, 1, ':');   // ribs
  c.rect(3, 16, 6, 2, ':');                 // bottom cap
  c.rect(5, 18, 2, 2, '<');                 // tassel
  return c.rows();
})();

// --- the fascia's own mark ---------------------------------------------------

/**
 * 12 x 12 -- a bento box from above: a red lacquer lid-edge round four
 * compartments -- rice, greens, something orange, something dark. It sits at
 * the left of the fascia board and does the job the name cannot at a glance.
 */
export const BENTO_ICON = (() => {
  const c = canvas(12, 12, '(');
  c.frame(0, 0, 12, 12, ':');
  c.rect(2, 2, 4, 4, 's');                  // rice
  c.rect(6, 2, 4, 4, 'g');                  // greens
  c.rect(2, 6, 4, 4, 'k');                  // yolk-and-egg
  c.rect(6, 6, 4, 4, ':');                  // dark: seaweed, pickles
  c.rect(2, 2, 1, 1, 'S');
  c.set(7, 3, 'G'); c.set(8, 4, 'G'); c.set(9, 3, 'G');
  return c.rows();
})();

// --- rooms ------------------------------------------------------------------
//
// 64 x 40, drawn behind the wall and seen through WINDOW_SHOP's glass (42 x 22,
// so what shows is the middle of the room and the rest is parallax margin).
// ROOM_PALETTE -- see the note there for why a room has to light itself.

/** Bento boxes standing on a ledge: a lid-edge, a coloured top. */
function boxes(c, x0, y, count, gap = 7) {
  const tops = ['g', 'h', 'i', 'g', 'e'];
  for (let n = 0; n < count; n++) {
    const x = x0 + n * gap;
    c.rect(x, y, 6, 4, 'e');
    c.rect(x, y, 6, 1, 'E');
    c.rect(x + 1, y + 1, 4, 2, tops[n % tops.length]);
  }
}

/**
 * The display counter: shelves of packed bento under a paper-lantern pendant,
 * a warm timber wall behind, a counter with the day's boxes standing on it.
 * Reads as "you can buy dinner in here", which is the whole job.
 */
export const ROOM_BENTO = (() => {
  const c = canvas(64, 40, 'w');
  c.rect(0, 20, 64, 20, 'W');               // the wall darkens toward the floor
  c.rect(0, 30, 64, 10, 'n');
  // Upper shelf, a rail with boxes standing on it.
  c.rect(6, 15, 52, 1, 'R');
  c.rect(6, 16, 52, 1, 'r');
  boxes(c, 9, 11, 7);
  // Pendant lantern in the middle of the room.
  c.rect(31, 0, 1, 7, 'r');
  c.rect(28, 7, 8, 5, 'L');
  c.rect(29, 8, 6, 3, 'l');
  // Second shelf.
  c.rect(6, 23, 52, 1, 'R');
  c.rect(6, 24, 52, 1, 'r');
  boxes(c, 12, 19, 6, 8);
  // The counter.
  c.rect(0, 30, 64, 1, 'R');
  c.rect(0, 31, 64, 9, 'd');
  c.rect(0, 31, 64, 1, 'r');
  c.rect(0, 38, 64, 2, 'D');
  for (let x = 8; x < 64; x += 16) c.rect(x, 33, 1, 5, 'D');    // panelling
  boxes(c, 14, 26, 4, 9);                   // the day's boxes, on the counter
  return c.rows();
})();

/**
 * The kitchen through the pass: a cook in a paper hat at the range, pans on
 * hooks, a steamer -- and the same warm light, from further back. The one
 * figure in the shop, and the reason the second window is not a copy of the
 * first.
 */
export const ROOM_BENTO_KITCHEN = (() => {
  const c = canvas(64, 40, 'w');
  c.rect(0, 22, 64, 18, 'W');
  c.rect(0, 32, 64, 8, 'n');
  // Pans on a rail.
  c.rect(6, 10, 26, 1, 'r');
  for (const px of [9, 17, 25]) {
    c.rect(px, 11, 1, 3, 'r');
    c.rect(px - 2, 14, 5, 4, 's');          // pan face, dark against the wall
    c.rect(px - 1, 15, 3, 2, 's');
  }
  // Extractor hood over the range, on the right.
  c.rect(38, 8, 20, 3, 'o');
  c.rect(40, 11, 16, 3, 'O');
  // The cook: hat, face, apron, shoulders -- standing at the pass.
  c.rect(24, 12, 8, 3, 'l');                // paper hat, the brightest thing here
  c.rect(23, 15, 10, 1, 'L');
  c.rect(25, 16, 6, 5, 'k');                // face
  c.set(26, 18, 'r'); c.set(29, 18, 'r');   // eyes, and no more than that
  c.rect(20, 21, 16, 11, 'l');              // white jacket
  c.rect(20, 21, 2, 11, 'L');
  c.rect(34, 21, 2, 11, 'L');
  c.rect(27, 22, 2, 8, 'L');                // the double-breast seam
  // The pass: a timber shelf across the window, steel range behind.
  c.rect(0, 32, 64, 1, 'R');
  c.rect(0, 33, 64, 7, 'd');
  c.rect(0, 38, 64, 2, 'D');
  c.rect(42, 27, 12, 5, 'o');               // range
  c.rect(42, 27, 12, 1, 't');
  c.rect(44, 22, 4, 5, 'l');                // steamer, catching the light
  c.rect(44, 22, 4, 1, 'L');
  boxes(c, 6, 28, 3, 8);                    // boxes waiting to go out
  return c.rows();
})();

export const BENTO_TILES = {};
export const BENTO_FEATURES = {
  bentoFront: BENTO_FRONT, windowShop: WINDOW_SHOP, norenDoor: NOREN_DOOR,
  lantern: LANTERN, bentoIcon: BENTO_ICON,
  roomBento: ROOM_BENTO, roomBentoKitchen: ROOM_BENTO_KITCHEN,
};
