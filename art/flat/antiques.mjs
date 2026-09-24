// Retro Antiques -- CITY_PLAN phase 1c, shop 2.
//
// Composed the same way bento.mjs is (see there for why): indexed-colour grids
// against TILE_PALETTE, and ROOM_PALETTE for the rooms behind the glass, built
// with the shared `canvas` and rastered and validated by tools/ like any
// hand-typed grid.
//
// The Bento Box is a low timber front with the light coming out of it. This is
// its opposite, and it is told apart by silhouette first: a bay window that
// stands proud of the wall under a little lead roof, three-sided, over a
// panelled stall riser, with a fanlight over the door. The paint is the muted
// green-black of an old shopfront, not a colour that competes with the light.
// The light is the second identifier -- a bare filament bulb, dim and yellow,
// through glass with too much furniture behind it.
//
// What emits: the room behind the bay, the room behind the cabinet window, the
// door's glass and the two bulbs hung either side of it. All of it is the one
// `bulb` light kind, so the whole front merges into a single shaded light.

import { canvas } from './canvas.mjs';

/** A filled disc, for the things in here that are round: a fanlight, a globe. */
function disc(c, cx, cy, r, ch) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (Math.hypot(x - cx, y - cy) <= r) c.set(x, y, ch);
    }
  }
  return c;
}

// --- the shopfront ----------------------------------------------------------

/**
 * 224 x 48 -- the joinery behind everything: fluted pilasters at the piers, a
 * capital and a plinth on each, and a panelled stall riser along the foot. The
 * bay, the door and the cabinet window stand over it; what shows is the piers
 * and the margins, which is where a shopfront's frame is.
 */
export const ANTIQUE_FRONT = (() => {
  const c = canvas(224, 48, '!');
  c.rect(0, 0, 224, 1, '[');              // top rail, catching the light
  c.rect(0, 1, 224, 2, ']');              // and the fascia's shadow under it
  for (const px of [0, 112, 160, 208]) {
    c.rect(px, 3, 16, 2, '[');            // capital
    c.rect(px, 5, 16, 1, ']');
    c.rect(px + 1, 6, 1, 30, '[');        // the lit edge of the shaft
    c.rect(px + 14, 6, 1, 30, ']');       // and the turned one
    for (const fx of [4, 8, 11]) {        // flutes: a dark groove, a lit lip beside it
      c.rect(px + fx, 6, 1, 30, ']');
      c.rect(px + fx + 1, 6, 1, 30, '[');
    }
    c.rect(px, 36, 16, 2, '[');           // plinth
    c.rect(px, 38, 16, 1, ']');
  }
  // The stall riser: raised panels, one to a bay of the front.
  for (let x = 0; x < 224; x += 32) {
    c.rect(x + 2, 40, 28, 1, '[');
    c.rect(x + 2, 41, 28, 5, '!');
    c.rect(x + 2, 41, 1, 5, '[');
    c.rect(x + 29, 41, 1, 5, ']');
    c.rect(x + 2, 46, 28, 1, ']');
  }
  c.rect(0, 47, 224, 1, ']');
  return c.rows();
})();

// --- the bay window ---------------------------------------------------------

/**
 * 96 x 48 -- a three-sided bay: a lead roof and its lip, a row of small top
 * lights over a transom, then three panes, the middle one twice the width of
 * the two that turn away, over a brass rail, a projecting cill and a panelled
 * riser. The glass is an OPENING, so `roomAntiquesBay` shows through it; the
 * posts, the transom and the two angled mullions stay opaque and divide the
 * room into real panes, the way WINDOW_SHOP's do.
 *
 * Glass: x 3..92, y 6..37. Posts x 0..2 and 93..95; mullions x 24..26, 69..71.
 */
export const WINDOW_BAY = (() => {
  const c = canvas(96, 48, '!');
  // The roof: a lead lip that catches the light, then its own shadow.
  c.rect(0, 0, 96, 1, 'l');
  c.rect(0, 1, 96, 1, 'f');
  c.rect(0, 2, 96, 1, 'F');
  c.rect(0, 3, 96, 1, 'L');
  c.rect(0, 4, 96, 1, '[');               // the head board under it
  c.rect(0, 5, 96, 1, ']');

  // Glass, then everything that is not glass restored over the hole.
  c.rect(3, 6, 90, 32, '.');
  c.rect(0, 6, 3, 32, '!');               // outer posts, lit and turned
  c.rect(1, 6, 1, 32, '[');
  c.rect(93, 6, 3, 32, '!');
  c.rect(94, 6, 2, 32, ']');
  for (const mx of [24, 69]) {            // the mullions where the bay turns
    c.rect(mx, 6, 3, 32, '!');
    c.rect(mx, 6, 1, 32, '[');
    c.rect(mx + 2, 6, 1, 32, ']');
  }
  c.rect(3, 13, 90, 2, '!');              // transom, over the main lights
  c.rect(3, 13, 90, 1, '[');
  c.rect(3, 14, 90, 1, ']');
  c.rect(3, 37, 90, 1, 'k');              // the brass rail along the foot of the glass

  // The cill, standing proud of the riser.
  c.rect(0, 38, 96, 1, '[');
  c.rect(0, 39, 96, 2, '!');
  c.rect(0, 41, 96, 1, ']');
  // The riser: a raised panel under each pane.
  for (const [x0, w] of [[4, 19], [28, 40], [73, 19]]) {
    c.rect(x0, 42, w, 1, '[');
    c.rect(x0, 42, 1, 5, '[');
    c.rect(x0 + w - 1, 42, 1, 5, ']');
    c.rect(x0, 46, w, 1, ']');
  }
  c.rect(0, 47, 96, 1, ']');
  return c.rows();
})();

/**
 * 32 x 48 -- the small display cabinet window beside the door: one tall sash in
 * a plain frame under its own lip of lead, a single glazing bar and a transom.
 * The same construction as the bay, at a fifth of the size, so the front reads
 * as one hand's work.
 *
 * Glass: x 3..28, y 5..36.
 */
export const WINDOW_CABINET = (() => {
  const c = canvas(32, 48, '!');
  c.rect(0, 0, 32, 1, 'l');
  c.rect(0, 1, 32, 1, 'f');
  c.rect(0, 2, 32, 1, 'L');
  c.rect(0, 3, 32, 1, '[');
  c.rect(0, 4, 32, 1, ']');
  c.rect(3, 5, 26, 32, '.');
  c.rect(1, 5, 2, 32, '[');
  c.rect(29, 5, 2, 32, ']');
  c.rect(15, 5, 2, 32, '!');              // the glazing bar
  c.rect(15, 5, 1, 32, '[');
  c.rect(16, 5, 1, 32, ']');
  c.rect(3, 14, 26, 2, '!');              // transom
  c.rect(3, 14, 26, 1, '[');
  c.rect(3, 15, 26, 1, ']');
  c.rect(3, 36, 26, 1, 'k');
  c.rect(0, 37, 32, 1, '[');
  c.rect(0, 38, 32, 2, '!');
  c.rect(0, 40, 32, 1, ']');
  c.rect(3, 41, 26, 1, '[');
  c.rect(3, 42, 26, 5, '!');
  c.rect(3, 41, 1, 6, '[');
  c.rect(28, 42, 1, 5, ']');
  c.rect(3, 46, 26, 1, ']');
  c.rect(0, 47, 32, 1, ']');
  return c.rows();
})();

// --- the door ---------------------------------------------------------------

/**
 * 32 x 64 -- an old shop door under its fanlight. The fanlight is a half-disc
 * of lit glass with radial bars; below the transom the leaf has a glazed upper
 * half behind a net curtain, brass letterbox and pull, and a small OPEN card
 * hung inside the glass. The glass is lit dim yellow from inside (`}` over
 * `,`) -- yellower and lower than the Bento Box's frosted amber, which is the
 * point of having a second colour of shop.
 */
export const ANTIQUE_DOOR = (() => {
  const c = canvas(32, 64, '!');
  // Fanlight: a half-disc centred on the transom line.
  const cx = 15.5, cy = 14;
  for (let y = 0; y <= 13; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 13.5 && d >= 12.5) c.set(x, y, '[');          // the arch, lit
      else if (d < 12.5) c.set(x, y, y < 8 ? '}' : ',');
    }
  }
  // Radial glazing bars from the hub.
  for (let a = 20; a < 180; a += 28) {
    const r = (a * Math.PI) / 180;
    for (let t = 1; t < 12.5; t += 0.5) {
      c.set(Math.round(cx + Math.cos(r) * t), Math.round(cy - Math.sin(r) * t), ']');
    }
  }
  c.rect(1, 14, 30, 1, '[');              // transom rail
  c.rect(1, 15, 30, 1, ']');
  // Jambs.
  c.rect(1, 16, 2, 46, '[');
  c.rect(29, 16, 2, 46, ']');
  // The leaf. Glass first, deepening toward the floor like a room does.
  c.rect(6, 19, 20, 24, '}');
  c.rect(6, 33, 20, 10, ',');
  c.rect(6, 27, 20, 1, '[');              // the one glazing bar, lit
  c.frame(5, 18, 22, 26, '[');
  // Net curtain over the lower panes: a checker, scalloped along its hem.
  for (let y = 28; y < 42; y++) for (let x = 6; x < 26; x++) if ((x + y) % 2 === 0) c.set(x, y, ',');
  for (let x = 6; x < 26; x += 2) c.set(x, 42, '!');
  // The OPEN card, hung inside the upper left pane.
  c.rect(8, 21, 8, 4, 'S');
  c.rect(8, 21, 8, 1, 's');
  for (const x of [9, 11, 13, 15]) c.set(x, 23, 'E');
  // Lower panels.
  for (const x0 of [6, 17]) {
    c.rect(x0, 47, 9, 1, '[');
    c.rect(x0, 47, 1, 13, '[');
    c.rect(x0 + 8, 48, 1, 12, ']');
    c.rect(x0, 59, 9, 1, ']');
  }
  // Ironmongery, in brass.
  c.rect(9, 44, 6, 2, 'k');               // letterbox
  c.rect(24, 40, 1, 7, 'k');              // pull
  c.rect(23, 39, 3, 1, 'k');
  c.rect(23, 47, 3, 1, 'k');
  // Threshold: the same stone as the plinth, as every other door does.
  c.rect(1, 62, 30, 2, 'T');
  return c.rows();
})();

// --- the bulb ---------------------------------------------------------------

/**
 * 16 x 20 -- a bare filament bulb on its flex, hung under the fascia. A brass
 * cap and a glass bulb (`e`, the streetlamp's own glass) and nothing else: no
 * shade, which is what makes it a shop's bulb and not a lamp's.
 */
export const BARE_BULB = (() => {
  const c = canvas(16, 20, '.');
  c.rect(7, 0, 2, 7, 'E');                // the flex
  c.rect(6, 6, 4, 3, 'k');                // brass cap
  c.rect(6, 8, 4, 1, 'E');
  // A pear, not a disc: a narrow neck widening to the belly. A round one with
  // a dark mark in it reads as a pocket watch, which is the wrong shop.
  c.rect(7, 9, 2, 1, 'e');
  c.rect(6, 10, 4, 1, 'e');
  disc(c, 7.5, 13.5, 4, 'e');
  c.rect(7, 12, 2, 3, 'k');               // the filament, a warm mark inside the glass
  return c.rows();
})();

// --- rooms ------------------------------------------------------------------
//
// ROOM_PALETTE. What shows through the bay is the middle 90 x 32 of a 112 x 48
// room, and the rest is parallax margin: floor is at y 36, so what you see is
// furniture standing on it. Drawn in the antiques palette's own warm, dim
// wallpaper -- dimmer than the Bento Box's rooms, because a dim bulb is the
// only thing in here that is bright.

/** The wallpaper, its dado and the floor: what every antiques room stands in. */
function shopRoom(w, h, floorY) {
  const c = canvas(w, h, 'y');
  for (let x = 2; x < w; x += 6) c.rect(x, 0, 1, floorY, 'z');       // wallpaper stripe
  c.rect(0, floorY - 8, w, 1, 'R');                                   // dado rail
  c.rect(0, floorY - 7, w, 7, 'd');                                   // dado panelling
  for (let x = 4; x < w; x += 12) c.rect(x, floorY - 5, 1, 4, 'D');
  c.rect(0, floorY, w, h - floorY, 'v');                              // floor
  c.rect(0, floorY, w, 1, 'r');                                       // skirting
  for (let x = 5; x < w; x += 9) c.rect(x, floorY + 1, 1, h - floorY - 1, 's');   // boards
  return c;
}

/**
 * The bay: a case clock, a gilt mirror over a chest of drawers with a vase, a
 * round table with a teapot and a stack of chairs behind it, a landscape in a
 * heavy frame, a globe -- and, hung in the middle of all of it, the bulb. Too
 * much furniture is the drawing: it has to read as a shop that has bought
 * everything and sold none of it.
 */
export const ROOM_ANTIQUES_BAY = (() => {
  const c = shopRoom(112, 48, 36);

  // The bulb, on its flex, in the middle of the room.
  c.rect(56, 0, 1, 10, 'r');
  c.rect(55, 10, 3, 2, 'j');
  c.rect(55, 12, 3, 3, 'l');
  c.rect(54, 13, 5, 1, 'L');
  c.rect(56, 15, 1, 1, 'L');

  // The case clock.
  c.rect(14, 10, 13, 7, 'q');             // hood
  c.rect(14, 10, 1, 7, 'Q');
  c.rect(17, 11, 7, 5, 'g');              // face
  c.set(20, 12, 's'); c.set(20, 13, 's'); c.set(21, 14, 's');
  c.rect(16, 17, 9, 18, 'q');             // trunk
  c.rect(16, 17, 1, 18, 'Q');
  c.rect(18, 19, 5, 11, 'C');             // its glass door
  c.rect(18, 19, 1, 11, 'c');
  disc(c, 20.5, 27, 1.6, 'j');            // the pendulum
  c.rect(15, 35, 11, 2, 'q');             // plinth
  c.rect(15, 35, 11, 1, 'Q');

  // The gilt mirror over the chest of drawers.
  c.rect(34, 11, 19, 17, 'f');
  c.rect(36, 13, 15, 13, 'c');
  c.rect(36, 13, 15, 1, 'C'); c.rect(36, 13, 1, 13, 'C');
  for (let i = 0; i < 5; i++) c.set(40 + i, 24 - i, 'm');   // glare across the glass
  c.rect(33, 28, 26, 9, 'q');             // the chest
  c.rect(33, 28, 26, 1, 'Q');
  c.rect(34, 33, 24, 1, 's');
  for (const x of [40, 46, 52]) { c.rect(x, 30, 2, 1, 'j'); c.rect(x, 34, 2, 1, 'j'); }
  c.rect(34, 37, 2, 1, 'q'); c.rect(56, 37, 2, 1, 'q');
  c.rect(37, 24, 4, 4, 'M');              // the vase on it
  c.rect(38, 22, 2, 2, 'm');
  c.rect(37, 24, 1, 4, 'm');
  c.rect(50, 24, 2, 4, 'j');              // a lamp base, unlit
  c.rect(49, 20, 5, 4, 'p');
  c.rect(49, 23, 5, 1, 'P');

  // A round table with a teapot, and chairs behind it.
  for (const x0 of [66, 74]) {
    c.rect(x0, 15, 1, 21, 'q');           // back posts, running down to the floor
    c.rect(x0 + 5, 15, 1, 21, 'q');
    c.rect(x0, 15, 6, 1, 'Q');
    c.rect(x0 + 1, 18, 4, 1, 'q');        // slats
    c.rect(x0 + 1, 21, 4, 1, 'q');
    c.rect(x0, 28, 6, 1, 'q');            // the seat
  }
  c.rect(64, 29, 19, 2, 'Q');             // table top
  c.rect(64, 31, 19, 1, 'q');
  c.rect(72, 32, 3, 4, 'q');
  c.rect(69, 36, 9, 1, 'q');
  c.rect(68, 26, 6, 3, 'm');              // teapot
  c.rect(68, 27, 6, 2, 'M');
  c.rect(74, 26, 2, 1, 'm');
  c.rect(70, 25, 2, 1, 'j');

  // The landscape in its heavy frame, and the globe beneath.
  c.rect(84, 9, 17, 14, 'f');
  c.rect(86, 11, 13, 10, 'c');
  c.rect(86, 16, 13, 5, 'a');
  for (let i = 0; i < 5; i++) c.rect(90 + i, 15 - (i < 3 ? i : 4 - i), 1, 2 + (i < 3 ? i : 4 - i), 'A');
  c.rect(97, 31, 1, 5, 'r');              // the stand
  c.rect(94, 36, 7, 1, 'r');
  disc(c, 97.5, 28, 4, 'M');
  c.rect(95, 26, 3, 2, 'A'); c.rect(98, 29, 2, 2, 'A');
  c.rect(93, 28, 9, 1, 'j');              // the meridian ring

  // The rug.
  c.rect(24, 37, 56, 3, 'e');
  c.rect(24, 37, 56, 1, 'E');
  return c.rows();
})();

/**
 * The cabinet window: two shelves of what a dealer keeps in the window --
 * blue-and-white porcelain, brass candlesticks, a carriage clock -- under a
 * second bulb of its own. Visible: the middle 26 x 32 of a 48 x 48 room.
 */
export const ROOM_ANTIQUES_CABINET = (() => {
  const c = shopRoom(48, 48, 40);
  c.rect(24, 0, 1, 12, 'r');              // the bulb
  c.rect(23, 12, 3, 2, 'j');
  c.rect(23, 14, 3, 3, 'l');
  c.rect(22, 15, 5, 1, 'L');
  // Upper shelf.
  c.rect(11, 23, 26, 1, 'R');
  c.rect(11, 24, 26, 1, 'r');
  for (const x0 of [12, 16, 20]) {        // plates on edge
    c.rect(x0, 17, 3, 6, 'm');
    c.rect(x0, 17, 3, 1, 'M');
    c.rect(x0 + 1, 19, 1, 2, 'M');
  }
  c.rect(26, 15, 5, 8, 'M');              // a lidded jar
  c.rect(26, 15, 5, 1, 'm');
  c.rect(27, 13, 3, 2, 'j');
  c.rect(33, 17, 2, 6, 'j');              // a candlestick
  c.rect(32, 22, 4, 1, 'J');
  // Lower shelf.
  c.rect(11, 34, 26, 1, 'R');
  c.rect(11, 35, 26, 1, 'r');
  c.rect(13, 27, 9, 7, 'j');              // the carriage clock
  c.rect(13, 27, 9, 1, 'J');
  c.rect(15, 28, 5, 5, 'g');
  c.set(17, 29, 's'); c.set(17, 30, 's'); c.set(18, 31, 's');
  c.rect(26, 26, 8, 8, 'm');              // a jug
  c.rect(26, 26, 8, 2, 'M');
  c.rect(34, 28, 2, 4, 'M');
  return c.rows();
})();

/**
 * Everything this shop adds to the set: its art, and the colours that art is
 * drawn in -- scoped to it, as the Bento Box's are (see tiles.mjs's `styleOf`).
 */
export const ANTIQUES = {
  name: 'Retro Antiques',
  tiles: {},
  features: {
    antiqueFront: ANTIQUE_FRONT, windowBay: WINDOW_BAY, windowCabinet: WINDOW_CABINET,
    antiqueDoor: ANTIQUE_DOOR, bareBulb: BARE_BULB,
    roomAntiquesBay: ROOM_ANTIQUES_BAY, roomAntiquesCabinet: ROOM_ANTIQUES_CABINET,
  },

  // Same rule as the Bento Box: one new material and one new light. The
  // material is the painted joinery of an old shopfront -- a green-black with
  // 10% saturation, close enough to the neutrals around it that it is read as
  // "old paint" and not as a colour. The light is the door's glass, a dim
  // yellow well short of the Bento Box's amber, since a bare bulb is not a
  // paper lantern.
  palette: {
    '!': '#2e3b35', // shopfront paint
    '[': '#4d5f55', // paint, the lit arris and the top of a rail
    ']': '#1e2823', // paint, in shadow -- a groove, and the underside of a rail
    '}': '#c2ac62', // door glass, lit from inside
    ',': '#8f7d44', // the same, deepening toward the floor -- and the net curtain
  },
  // Raised panels and fluting, lit above and shaded below.
  height: { '[': 1, ']': -1, ',': -1 },
  // Dim, warm wallpaper, and the things a dealer keeps.
  roomPalette: {
    y: '#7d6f5d', // wallpaper
    z: '#65594b', // wallpaper stripe, and the wall down toward the dado
    v: '#3f3730', // floorboards
    q: '#6a3a2c', // mahogany
    Q: '#8a5540', // mahogany where the light catches an edge
    j: '#b08c3e', // brass
    J: '#6b5424', // brass, in shadow
    c: '#8a97a3', // mirror and glass-fronted door
    C: '#56616c', // the same, in shadow
    m: '#c8d0da', // porcelain
    M: '#5f7396', // porcelain, blue
    p: '#cdbf9c', // a lampshade
    P: '#8f8264', // its shaded side
  },
};
