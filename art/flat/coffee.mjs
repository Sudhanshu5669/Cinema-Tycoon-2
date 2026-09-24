// Retro Coffee -- CITY_PLAN phase 1c, shop 5.
//
// Composed like the other shops (see bento.mjs), and the first to be built on
// scoped palettes from the start: everything private to it is in `COFFEE`
// below, drawn from letters no other shop needs to know about.
//
// The Bento Box is timber, the antiques shop is green-black paint and the Gamer
// Cafe is flat black. This is the one with a SOFT front: a striped canvas
// awning with a scalloped valance over the windows, a cream tiled riser, a teal
// frame, and a pavement with bistro tables on it -- the only shop that puts
// something of its own in the street. The colour spent is the awning's and the
// teal, both muted; the light is a low, warm, slightly pink tungsten that stays
// on into the morning, because this is the shop that opens before the sun.
//
// What emits: both rooms and the door -- all one `cafe` light kind, so the
// front merges into a single shaded light. The awning and the sets emit
// nothing; a table on a pavement does not light a street.

import { canvas, disc } from './canvas.mjs';

// --- the shopfront ----------------------------------------------------------

/**
 * 224 x 32 -- the joinery behind the door and both windows: a teal frame with
 * board joints, and a cream tiled dado along the foot of it, which is what a
 * coffee shop's riser is. Where it shows is the margin, the piers between the
 * openings and the strip along the bottom.
 */
export const COFFEE_FRONT = (() => {
  const c = canvas(224, 32, '0');
  c.rect(0, 0, 224, 1, '3');              // top rail, catching the light
  c.rect(0, 1, 224, 1, '8');
  for (let x = 6; x < 224; x += 12) {     // vertical boarding
    c.rect(x, 2, 1, 16, '8');
    c.rect(x + 1, 2, 1, 16, '3');
  }
  c.rect(0, 18, 224, 1, '3');             // the dado rail
  c.rect(0, 19, 224, 1, '8');
  c.rect(0, 20, 224, 12, 's');            // cream tile, in courses of four
  for (let y = 23; y < 32; y += 4) c.rect(0, y, 224, 1, 'S');
  for (let r = 0; r < 3; r++) for (let x = (r % 2) * 4; x < 224; x += 8) c.rect(x, 20 + r * 4, 1, 4, 'S');
  return c.rows();
})();

/**
 * 64 x 32 -- a shop window in a teal frame: a row of small top lights over a
 * transom, then three panes, over a sill and a strip of the cream tile. The
 * glass is an OPENING onto a room; the transom and the two mullions stay opaque
 * and divide it. Nothing is painted on the glass: a steaming cup decal was
 * tried, and at this size it was a white blob that hid the room and whose steam
 * read as crossbones. The cup is on the fascia, where it has room.
 *
 * Glass: x 3..60, y 3..24.
 */
export const WINDOW_CAFE = (() => {
  const c = canvas(64, 32, '0');
  c.rect(0, 0, 64, 1, '3');
  c.rect(3, 3, 58, 22, '.');
  c.rect(1, 1, 1, 24, '3');               // the lit arris down the left
  c.rect(62, 1, 1, 24, '8');
  c.rect(3, 9, 58, 2, '0');               // the transom
  c.rect(3, 9, 58, 1, '3');
  c.rect(3, 10, 58, 1, '8');
  for (const mx of [21, 41]) {            // two mullions
    c.rect(mx, 3, 2, 22, '0');
    c.rect(mx, 3, 1, 22, '3');
    c.rect(mx + 1, 3, 1, 22, '8');
  }
  for (const gx of [12, 32, 52]) c.rect(gx, 3, 1, 6, '8');   // and a bar in each of the top lights
  c.rect(0, 25, 64, 1, '3');              // sill
  c.rect(0, 26, 64, 2, '0');
  c.rect(0, 28, 64, 1, '8');
  c.rect(0, 29, 64, 3, 's');              // and the top of the tiled riser
  c.rect(0, 31, 64, 1, 'S');
  return c.rows();
})();

// --- the door ---------------------------------------------------------------

/**
 * 32 x 48 -- the door: teal frame, a big glazed upper leaf lit warm from inside
 * (`>` over `?`) with an OPEN card hung in it and a bell on a spring above, a
 * chrome push plate and pull, and a tiled kick panel. It stands under the
 * awning's valance, which is why it has no transom.
 */
export const COFFEE_DOOR = (() => {
  const c = canvas(32, 48, '0');
  c.rect(1, 0, 30, 1, '3');
  c.rect(1, 1, 30, 2, '8');
  c.rect(3, 3, 1, 34, '3');
  c.rect(28, 3, 1, 34, '8');
  c.rect(4, 3, 24, 34, '>');              // the glass
  c.rect(4, 22, 24, 15, '?');             // deepening toward the floor
  c.rect(4, 3, 24, 1, '8');
  c.rect(15, 4, 2, 33, '0');              // one glazing bar down the middle
  c.rect(15, 4, 1, 33, '3');
  // The OPEN card, in the upper left pane, and the bell on its spring.
  c.rect(7, 8, 8, 5, 's');
  c.rect(7, 8, 8, 1, 'S');
  for (const x of [8, 10, 12, 14]) c.set(x, 11, ':');
  c.rect(23, 4, 1, 3, 'k');
  c.rect(22, 7, 3, 2, 'k');
  // Chrome furniture.
  c.rect(21, 22, 1, 10, '-');             // pull
  c.rect(20, 22, 3, 1, '_'); c.rect(20, 31, 3, 1, '_');
  c.rect(4, 37, 24, 1, '3');
  c.rect(4, 38, 24, 8, 's');              // tiled kick panel
  for (let y = 41; y < 46; y += 4) c.rect(4, y, 24, 1, 'S');
  c.rect(1, 46, 30, 2, 'T');
  return c.rows();
})();

// --- the awning -------------------------------------------------------------

/**
 * 224 x 16 -- a striped canvas awning across the whole front, teal and cream in
 * stripes eight pixels wide, a lit slope above and a shaded fold under it, and
 * a scalloped valance hanging from the fold, each scallop one stripe. The gaps
 * under the scallops are transparent, so the shop's own top lights show through
 * -- which is what stops it reading as a board.
 *
 * It hangs from the fascia's foot and is over the door and windows, in front
 * of the wall plane like anything else on the facade.
 */
export const COFFEE_AWNING = (() => {
  const c = canvas(224, 16, '.');
  const depth = [3, 4, 5, 5, 5, 5, 4, 3];  // how far each stripe's scallop hangs
  for (let x = 0; x < 224; x += 1) {
    const teal = Math.floor(x / 8) % 2 === 0;
    const lit = teal ? '3' : 's', mid = teal ? '0' : 's', dark = teal ? '8' : 'S';
    c.set(x, 0, '8');                       // the awning's own rail, against the fascia
    for (let y = 1; y <= 2; y++) c.set(x, y, lit);
    for (let y = 3; y <= 7; y++) c.set(x, y, mid);
    for (let y = 8; y <= 9; y++) c.set(x, y, dark);
    const hang = depth[x % 8];
    for (let y = 10; y < 10 + hang; y++) c.set(x, y, y === 9 + hang ? dark : mid);
  }
  c.rect(0, 0, 2, 10, '8');                 // the end caps
  c.rect(222, 0, 2, 10, '8');
  return c.rows();
})();

// --- the pavement set -------------------------------------------------------

/**
 * 32 x 24 -- a bistro set, a freestanding prop for the pavement: a round chrome
 * table with a cup on it and a teal chair each side, facing in. The one thing
 * this shop puts in the street, and what stops the pavement in front of it
 * reading as a corridor.
 */
export const CAFE_SET = (() => {
  const c = canvas(32, 24, '.');
  // Table: an ellipse of chrome top, a pedestal, a foot.
  c.rect(10, 10, 12, 1, '-');
  c.rect(8, 11, 16, 1, '-');
  c.rect(9, 12, 14, 1, '_');
  c.rect(15, 13, 2, 8, '_');
  c.rect(13, 20, 6, 1, '_');
  c.rect(11, 21, 10, 1, '_');
  c.rect(14, 7, 3, 3, 's');               // a cup, and its saucer
  c.rect(13, 10, 5, 1, 'S');
  c.set(17, 8, 's');
  // The two chairs, facing the table: a back on the far side, a seat, two legs.
  for (const [bx, sx0, sx1, dir] of [[2, 2, 8, 1], [29, 23, 29, -1]]) {
    c.rect(bx, 6, 1, 11, '0');            // back
    c.rect(bx + dir, 6, 1, 11, dir > 0 ? '3' : '8');
    c.rect(sx0, 16, sx1 - sx0 + 1, 2, '0'); // seat
    c.rect(sx0, 16, sx1 - sx0 + 1, 1, '3');
    c.rect(sx0 + 1, 18, 1, 4, '8');
    c.rect(sx1 - 1, 18, 1, 4, '8');
  }
  return c.rows();
})();

// --- the fascia's own mark --------------------------------------------------

/**
 * 12 x 12 -- a cup and saucer, steaming, on the sign's own dark teal field at
 * the left of the fascia board.
 */
export const CUP_ICON = (() => {
  const c = canvas(12, 12, '8');
  c.frame(0, 0, 12, 12, '0');
  c.paste(0, 0, [
    '............',
    '............',
    '...3..3.....',
    '....3..3....',
    '...3..3.....',
    '............',
    '..ssssss....',
    '..ssssss(s..',
    '..ssssss.s..',
    '..SSSSSSs...',
    '.----------.',
    '............',
  ]);
  return c.rows();
})();

// --- rooms ------------------------------------------------------------------
//
// ROOM_PALETTE, 80 x 40 each, seen through WINDOW_CAFE's 58 x 22 opening, so
// what shows is the middle of the room: y 9..30. Warm, low and full of cream
// tile, with the pendants as the brightest things in it.

/** Subway tile: cream courses with a grout line under each and the joints
 *  staggered from one course to the next, down to `floorY`. */
function tiledWall(c, w, floorY) {
  c.rect(0, 0, w, floorY, 'c');
  for (let y = 4, r = 0; y < floorY; y += 5, r++) {
    c.rect(0, y, w, 1, 'C');
    for (let x = (r % 2) * 4; x < w; x += 8) c.rect(x, y - 4, 1, 4, 'C');
  }
}

/** A black-and-cream chequered floor, in squares of four. */
function chequer(c, w, y0, h) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = 0; x < w; x++) c.set(x, y, ((x >> 2) + ((y - y0) >> 2)) % 2 ? 'z' : 'y');
  }
}

/** A pendant globe on its cord: the brightest thing in a room, and what makes
 *  it a cafe and not a shop. */
function globe(c, x, cordLen) {
  c.rect(x, 0, 1, cordLen, 'r');
  disc(c, x + 0.5, cordLen + 3, 3.2, 'l');
  c.rect(x - 1, cordLen - 1, 3, 2, 'L');
  c.set(x - 2, cordLen + 3, 'L'); c.set(x + 3, cordLen + 3, 'L');
}

/**
 * The bar: cups on two shelves against a tiled wall, a chrome espresso machine
 * with a barista behind it in a teal apron, a glass case of cakes to its right,
 * two pendants over all of it, and the wooden counter in front. Seen from the
 * front, which makes the barista the only person in these windows facing you.
 */
export const ROOM_COFFEE_BAR = (() => {
  const c = canvas(80, 40, 'c');
  tiledWall(c, 80, 30);
  // Shelves of cups.
  for (const [y, tone] of [[13, 'g'], [20, 'g']]) {
    c.rect(6, y, 68, 1, 'R');
    c.rect(6, y + 1, 68, 1, 'r');
    for (let x = 9; x < 72; x += 5) {
      c.rect(x, y - 3, 3, 3, tone);
      c.set(x + 3, y - 2, tone);
    }
  }
  // The pendants.
  globe(c, 24, 6);
  globe(c, 58, 6);
  // The espresso machine: a chrome block with two group heads and a boiler.
  c.rect(11, 17, 22, 9, 'j');
  c.rect(11, 17, 22, 1, 'g');
  c.rect(11, 25, 22, 1, 'J');
  c.rect(14, 20, 4, 5, 'J'); c.rect(23, 20, 4, 5, 'J');
  c.rect(19, 15, 4, 2, 'j');
  c.rect(16, 26, 2, 2, 'g'); c.rect(25, 26, 2, 2, 'g');   // cups under the heads
  // The barista, behind the counter, in a teal apron.
  c.rect(37, 14, 5, 5, 'h');                // face
  c.rect(36, 13, 7, 2, 'q');                // hair
  c.set(38, 16, 'q'); c.set(40, 16, 'q');   // eyes
  c.rect(34, 19, 11, 11, 'm');              // apron
  c.rect(34, 19, 2, 11, 'M'); c.rect(43, 19, 2, 11, 'M');
  c.rect(37, 19, 5, 2, 'g');                // the shirt at the collar
  // The cake case.
  c.rect(48, 19, 26, 9, 'J');
  c.rect(49, 20, 24, 7, 'C');
  for (let x = 51; x < 72; x += 5) {
    c.rect(x, 24, 4, 3, 'P');
    c.rect(x, 23, 4, 1, 'p');
  }
  c.rect(48, 19, 26, 1, 'j');
  // The counter.
  c.rect(0, 28, 80, 1, 'Q');
  c.rect(0, 29, 80, 6, 'q');
  for (let x = 6; x < 80; x += 14) c.rect(x, 30, 1, 4, 'r');
  chequer(c, 80, 35, 5);
  return c.rows();
})();

/**
 * The seating: a run of teal booths down the wall with a chrome rail over them,
 * two heads above the backs and a cup on each table steaming, small pendants
 * over the aisle and a framed print, on a chequered floor. Everything a cafe is,
 * and none of it the counter.
 */
export const ROOM_COFFEE_SEAT = (() => {
  const c = canvas(80, 40, 'c');
  tiledWall(c, 80, 30);
  c.rect(0, 18, 80, 1, 'j');                // the chrome rail over the booths
  c.rect(0, 19, 80, 11, 'm');               // the booth backs
  for (let x = 4; x < 80; x += 8) for (let y = 22; y < 30; y += 4) c.set(x, y, 'M');   // buttons
  c.rect(0, 29, 80, 1, 'M');
  c.rect(58, 5, 14, 10, 'f');               // a framed print on the wall
  c.rect(60, 7, 10, 6, 'a');
  c.rect(60, 7, 10, 2, 'A');
  globe(c, 20, 5);
  globe(c, 40, 8);
  globe(c, 62, 5);
  // Two people in the booths, from behind: hair over the back, and a shoulder.
  for (const x of [17, 49]) {
    c.rect(x, 15, 5, 4, 'q');               // hair
    c.rect(x + 1, 19, 3, 1, 'h');           // the nape
    c.rect(x - 1, 20, 7, 4, 'P');           // shoulders, and no more of them
  }
  // The tables, and a cup on each, steaming.
  for (const x of [8, 32, 64]) {
    c.rect(x, 27, 14, 2, 'Q');
    c.rect(x + 6, 29, 2, 2, 'q');
    c.rect(x + 4, 25, 3, 2, 'g');
    c.set(x + 5, 23, 'l'); c.set(x + 6, 22, 'l');
  }
  chequer(c, 80, 30, 10);
  return c.rows();
})();

/**
 * Everything this shop adds to the set: its art, and the colours that art is
 * drawn in -- scoped to it, as the other shops' are (see tiles.mjs's `styleOf`).
 */
export const COFFEE = {
  name: 'Retro Coffee',
  tiles: {},
  features: {
    coffeeFront: COFFEE_FRONT, windowCafe: WINDOW_CAFE, coffeeDoor: COFFEE_DOOR,
    coffeeAwning: COFFEE_AWNING, cafeSet: CAFE_SET, cupIcon: CUP_ICON,
    roomCoffeeBar: ROOM_COFFEE_BAR, roomCoffeeSeat: ROOM_COFFEE_SEAT,
  },

  // Teal and cream, and chrome: the muted spend of a shop whose signature is a
  // striped awning. Cream is the shared `s`/`S`, which the Bento Box's cream
  // and the awning already were; brass is the shared `k`.
  palette: {
    '0': '#4b8579', // teal paint and awning stripe
    '3': '#78b0a3', // teal, the lit arris and the slope of the canvas
    '8': '#2f544d', // teal, in shadow -- a groove, and the awning's fold
    '-': '#b9bec4', // chrome
    '_': '#6b7278', // chrome, turned away
    '>': '#d8a865', // door glass, lit warm from inside
    '?': '#a67c46', // the same, deepening toward the floor
    ':': '#242b28', // the OPEN card's lettering
    '(': '#c05a3c', // a cup handle, terracotta
  },
  // The canvas has a fold, the tiles a grout line, the chrome stands proud.
  height: { '3': 1, '8': -1, '-': 1, '_': -1, ':': -1 },
  roomPalette: {
    c: '#c9bda2', // cream tile
    C: '#a89c82', // its grout
    j: '#aeb4ba', // chrome
    J: '#6d747b', // chrome, in shadow
    m: '#3e6a62', // teal booth and apron
    M: '#2b4a45', // its shade, and the buttons
    p: '#d9a0a0', // pink icing
    P: '#7a4a32', // a cake, or a jacket
    q: '#4a2f22', // dark wood, and hair
    Q: '#6d4a36', // wood where the light catches its edge
    y: '#cfc4ac', // floor, light square
    z: '#4a3f38', // floor, dark square
    h: '#c89870', // skin
  },
};
