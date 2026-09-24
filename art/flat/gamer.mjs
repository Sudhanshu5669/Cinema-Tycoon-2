// The Gamer Cafe -- CITY_PLAN phase 1c, shop 4.
//
// Composed like bento.mjs and antiques.mjs: indexed-colour grids against
// TILE_PALETTE (ROOM_PALETTE for the rooms), built with the shared `canvas`.
//
// The Bento Box is warm timber and the antiques shop is warm brass, so this is
// the one COLD shopfront on the street, and it is told apart the way they are:
// by material and by the colour of its own light. The material is flat black --
// no pilasters, no mouldings, a curtain wall of dark glass with diagonal glare
// on it -- and the light is a cold blue-white that comes from screens, from the
// LED bars at either end of the front and from the door.
//
// The rooms are what sells it. Nobody in a shop window faces the street, so the
// gamers are what you see from behind: silhouettes hunched in front of walls of
// glowing monitors, and two heads over a sofa back in front of a television.
//
// What emits: both rooms, the door, and the two LED bars. All one `led` light
// kind, so the whole front merges into a single shaded light.

import { canvas } from './canvas.mjs';

// --- the shopfront ----------------------------------------------------------

/**
 * 192 x 32 -- the black cladding behind the door and both windows: flat panels
 * with a hairline seam every 24px, a lit top rail, and a dim cyan under-light
 * running along the foot of it. No moulding anywhere. The absence is the style.
 */
export const GAMER_FRONT = (() => {
  const c = canvas(192, 32, '{');
  c.rect(0, 0, 192, 1, '|');              // top rail, catching the light
  c.rect(0, 1, 192, 1, 'K');
  for (let x = 0; x < 192; x += 24) {
    c.rect(x, 2, 1, 24, 'K');             // panel seam
    c.rect(x + 1, 2, 1, 24, '|');         // and the edge that catches the light
  }
  c.rect(0, 26, 192, 1, '|');             // the plinth line
  c.rect(0, 27, 192, 1, 'K');
  c.rect(0, 30, 192, 1, '6');             // the cyan under-light, dim
  return c.rows();
})();

/**
 * 64 x 32 -- one big pane of dark glass in a thin black frame: no mullion, no
 * transom, because a gaming cafe wants the room to be one picture. Two
 * diagonal streaks of reflected sky lie across the glass, opaque, so they are
 * drawn over the room and it looks like glass and not like a hole.
 *
 * Glass: x 3..60, y 3..23.
 */
export const WINDOW_GLASS = (() => {
  const c = canvas(64, 32, '{');
  c.rect(0, 0, 64, 1, '|');
  c.rect(3, 3, 58, 21, '.');
  c.rect(1, 1, 62, 2, 'K');
  c.rect(1, 1, 1, 26, '|');
  // Glare: two streaks, a pixel wide, running up and to the right. Any more and
  // they fight the room for the glass.
  for (const [x0, len] of [[12, 12], [44, 14]]) {
    for (let t = 0; t < len; t++) c.set(x0 + t, 22 - t, 'I');
  }
  c.rect(0, 24, 64, 1, '|');              // sill
  c.rect(0, 25, 64, 2, '{');
  c.rect(0, 27, 64, 1, '6');              // the under-light again, where the sill throws it
  return c.rows();
})();

/**
 * 32 x 48 -- the door: black frame, a pane of glass lit cold from inside
 * (`4` over `5`, the ship hull's greys -- the coldest neutrals in the set) with
 * a game pad in silhouette on it, a cyan LED down both jambs and a steel push
 * bar. The kick panel below is the same black as the front around it.
 */
export const GAMER_DOOR = (() => {
  const c = canvas(32, 48, '{');
  c.rect(1, 0, 30, 1, '|');
  c.rect(1, 1, 30, 3, 'K');
  c.rect(5, 4, 22, 34, '4');              // the glass
  c.rect(5, 21, 22, 17, '5');             // deepening toward the floor
  c.rect(4, 4, 1, 34, ')');               // LED down each jamb
  c.rect(27, 4, 1, 34, ')');
  // A game pad, in dark silhouette across the glass.
  c.paste(10, 10, [
    '..############..',
    '.##############.',
    '###.#.####.#.###',
    '##...#####..####',
    '###.#.####..####',
    '.##############.',
    '.###..####..###.',
    '..##..####..##..',
  ].map((r) => r.replace(/#/g, 'K').padEnd(16, '.').slice(0, 16)));
  c.rect(8, 26, 16, 1, 'Q');              // push bar
  c.rect(8, 25, 1, 3, 'Q'); c.rect(23, 25, 1, 3, 'Q');
  c.rect(5, 38, 22, 1, '|');
  c.rect(5, 39, 22, 7, '{');
  c.rect(1, 46, 30, 2, 'T');              // threshold
  return c.rows();
})();

/**
 * 16 x 32 -- an LED bar standing at each end of the front: a black housing with
 * a cyan tube in it. The two of them are the cafe's way of saying "lit" from
 * across the street, and the only emitters that are not a window or the door.
 */
export const LED_BAR = (() => {
  const c = canvas(16, 32, '.');
  c.rect(5, 1, 6, 30, '{');
  c.rect(5, 1, 1, 30, '|');
  c.rect(7, 3, 2, 26, ')');
  c.rect(6, 3, 1, 26, '6');
  c.rect(9, 3, 1, 26, '6');
  return c.rows();
})();

/**
 * 12 x 12 -- the mark at the left of the fascia: a game pad, in LED cyan on
 * the sign's own dark field, and the cafe's name is spelt out beside it.
 */
export const PAD_ICON = (() => {
  const c = canvas(12, 12, 'K');
  c.paste(0, 2, [
    'KK))))))))KK',
    'K))))))))))K',
    'K)))K)))K))K',
    'K))KKK)))K)K',
    'K)))K))))))K',
    'KK))KKKK))KK',
  ]);
  return c.rows();
})();

// --- rooms ------------------------------------------------------------------
//
// ROOM_PALETTE, 80 x 40 each, seen through WINDOW_GLASS's 58 x 21 opening, so
// what shows is the middle of the room: y 9..29. A cold room draws its own
// light in the way a warm one does -- the screens are the brightest thing in it
// -- against walls and desks that are a step off black.

/** A screen's face: a bright title bar over a deep body, with a few lines of
 *  lit "text" of differing lengths standing in for whatever is on it. Lines and
 *  not a scatter -- a scatter of pixels at this size is diagonal hatching.
 *  Deterministic, so two builds of the art never differ. */
function screen(c, x, y, w, h, seed = 0) {
  c.rect(x, y, w, h, 'U');
  c.rect(x, y, w, 2, 'u');
  for (let j = 3; j < h; j += 2) {
    const len = Math.max(2, w - 2 - ((j * 3 + seed * 5) % (w - 3)));
    c.rect(x + 1, y + j, len, 1, 'u');
  }
}

/** A person from behind: a head, and hunched shoulders, on a dark chair back.
 *  Drawn in the room's darkest tones, against the light of the screen. */
function gamer(c, cx, headY) {
  c.rect(cx - 5, headY + 5, 11, 9, 'N');      // shoulders and hoodie
  c.rect(cx - 4, headY + 4, 9, 2, 'N');
  c.rect(cx - 2, headY + 1, 5, 5, 'F');       // head
  c.rect(cx - 2, headY, 5, 2, 'F');
  c.set(cx - 3, headY + 3, 'F'); c.set(cx + 3, headY + 3, 'F');   // ears; headphones
}

/**
 * The floor: four monitors in a row on a desk against a slatted wall, a cyan
 * tube along the top of it, keyboards lit red-green-red along the front of the
 * desk, and three chairs -- an empty one, and two with somebody in them, seen
 * from behind and lit only from in front.
 */
export const ROOM_GAMER_PCS = (() => {
  const c = canvas(80, 40, 'F');
  for (let x = 4; x < 80; x += 8) c.rect(x, 0, 1, 31, 'G');   // wall slats
  c.rect(0, 10, 80, 1, 'u');                                   // the tube
  c.rect(0, 11, 80, 1, 'U');
  c.rect(0, 31, 80, 9, 'S');                                   // floor
  for (const [n, x] of [12, 26, 40, 54].entries()) {
    c.rect(x - 1, 13, 14, 10, 'N');                            // bezel
    screen(c, x, 14, 12, 8, n * 2);
    c.rect(x + 5, 23, 2, 2, 'N');                              // the stand
  }
  c.rect(0, 25, 80, 1, 'H');                                   // the desk, lit along its edge
  c.rect(0, 26, 80, 4, 'N');
  for (const x of [12, 26, 40, 54]) {
    for (let i = 0; i < 10; i++) c.set(x + i, 25, i % 2 ? 'V' : 'Y');   // the keyboards
  }
  c.rect(14, 26, 8, 8, 'N');                                   // an empty chair: back and headrest
  c.rect(16, 24, 4, 3, 'N');
  gamer(c, 33, 20);
  gamer(c, 61, 20);
  return c.rows();
})();

/**
 * The lounge: an arcade cabinet on the left with its own screen and a pink
 * joystick, a big television playing something bright over a low unit, and a
 * sofa with two heads above the back of it, close together -- two people, one
 * game -- and a beanbag at the end.
 */
export const ROOM_GAMER_LOUNGE = (() => {
  const c = canvas(80, 40, 'F');
  for (let x = 4; x < 80; x += 8) c.rect(x, 0, 1, 31, 'G');
  c.rect(0, 31, 80, 9, 'S');
  // The arcade cabinet.
  c.rect(13, 9, 14, 23, 'N');
  c.rect(13, 9, 14, 2, 'u');                                   // its marquee, lit
  screen(c, 15, 12, 10, 8, 3);
  c.rect(14, 21, 12, 3, 'H');                                  // the control deck
  c.set(17, 22, 'V'); c.set(21, 22, 'Y'); c.set(23, 22, 'V');
  c.rect(15, 25, 10, 7, 'F');
  c.set(20, 27, 'u');                                          // the coin slot
  // The television.
  c.rect(33, 11, 30, 18, 'N');
  c.rect(35, 13, 26, 14, 'U');
  c.rect(35, 13, 26, 3, 'u');
  c.rect(35, 23, 26, 4, 'H');                                  // the level's floor
  c.rect(41, 20, 3, 3, 'V');                                   // a player character
  c.rect(51, 19, 3, 4, 'Y');                                   // and something coming for it
  c.rect(45, 15, 6, 1, 'u');
  c.rect(37, 21, 4, 1, 'u');
  c.rect(31, 29, 34, 2, 'H');                                  // the unit under it
  // The sofa, seen from behind, and the two of them on it.
  c.rect(31, 26, 34, 7, 'N');
  c.rect(31, 26, 34, 1, 'H');
  for (const cx of [43, 51]) {
    c.rect(cx - 2, 19, 5, 6, 'F');
    c.rect(cx - 3, 22, 7, 3, 'F');
  }
  // A beanbag, at the end.
  c.rect(66, 26, 11, 6, 'N');
  c.rect(67, 24, 9, 3, 'N');
  c.rect(67, 24, 9, 1, 'H');
  return c.rows();
})();

/**
 * Everything this shop adds to the set: its art, and the colours that art is
 * drawn in -- scoped to it, as the other shops' are (see tiles.mjs's `styleOf`).
 */
export const GAMER = {
  name: 'the Gamer Cafe',
  tiles: {},
  features: {
    gamerFront: GAMER_FRONT, windowGlass: WINDOW_GLASS, gamerDoor: GAMER_DOOR,
    ledBar: LED_BAR, padIcon: PAD_ICON,
    roomGamerPcs: ROOM_GAMER_PCS, roomGamerLounge: ROOM_GAMER_LOUNGE,
  },

  // The cold one. A flat near-black with a slight blue in it, the catch-light
  // on its edges, and one bright cyan for the LED tubes -- the only saturated
  // thing on the front, and an emitter. Glass, hull-grey and the reader-board
  // navy (`i`, `4`, `5`, `K`, `6`) are already the cold family and are shared.
  palette: {
    '{': '#1c2028', // black cladding
    '|': '#3a4352', // its lit edge
    ')': '#a8dcff', // LED tube
  },
  // Panel seams are a groove, and the LED tube stands proud.
  height: { '|': 1, ')': 1 },
  // Everything is a step off black except what is lit.
  roomPalette: {
    F: '#1b2029', // wall
    G: '#293141', // wall slat
    H: '#3a4150', // desk edge, and the level a game is standing on
    N: '#2b303b', // furniture and silhouettes
    S: '#161920', // floor
    U: '#5b9fd0', // a screen, deep
    u: '#b4e0ff', // a screen, lit -- the brightest thing in these rooms
    V: '#c04fa0', // a pink LED, or a player
    Y: '#57d9b0', // a green one, or what is chasing them
  },
};
