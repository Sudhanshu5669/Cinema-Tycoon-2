// City tiles — flat direction, 16 x 16.
//
// Authored the same way as the figures: a grid of palette characters against
// TILE_PALETTE, no shading pass, no outlines. What is written is what is drawn.
//
// The 3/4 view is carried by three tiles and not by any clever rendering:
//   KERB    the pavement drops to the road across a 2px lit top and a 2px
//           shaded face. That tiny turn is what stops the ground reading as a
//           flat map seen from directly above.
//   CORNICE the roof lip, brightest edge in the scene, with a hard shadow
//           directly under it. This is what says a building has a FACE.
//   PLINTH  where the wall meets the pavement. Without it a building looks
//           pasted onto the ground rather than standing on it.
//
// Shading belongs to the building, not the tile: WALL is uniform, and the
// shaded right-hand return is WALL_EDGE, a separate tile. A shaded edge baked
// into every wall tile would repeat every 16px and read as stripes.

export const W = 16, H = 16;

// --- ground -----------------------------------------------------------------

export const ROAD = [
  'aaaaaaaaaaaaaaaa',
  'aaaaAaaaaaaaazaa',
  'aaaaaaaaaaaaaaaa',
  'aazaaaaaaaAaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaAaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'azaaaaaaaaaaaaAa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaAaaaaaazaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaazaaaaaaaaaa',
];

/** Laid end to end this gives a dashed centre line, gap included. */
export const ROAD_LINE = [
  'aaaaaaaaaaaaaaaa',
  'aaaaAaaaaaaaazaa',
  'aaaaaaaaaaaaaaaa',
  'aazaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aammmmmmmmmmmmaa',
  'aammmmmmmmmmmmaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaAaaaaaazaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
  'aaaaazaaaaaaaaaa',
];

/** 8px slabs. The seam is one pixel and one step darker — any more and the
 *  pavement reads as tiling, which is exactly what it must not do. */
export const PAVE = [
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'qppPppppqppppppp',
  'qpppppppqpppPppp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqppPpppp',
  'qpppppppqppppppp',
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'qpppPpppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqpppppPp',
  'qppppPppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
];

/** Cracked variant. One in six or so, otherwise the repeat starts showing. */
export const PAVE_CRACK = [
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'qppqppppqppppppp',
  'qpppqpppqppppppp',
  'qpppqpppqppppppp',
  'qppppqppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'qpppppppqppqpppp',
  'qpppppppqpppqppp',
  'qpppppppqpppqppp',
  'qpppppppqppppqpp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
];

/** An old stain -- oil, a spill, whatever a street collects -- sparingly
 *  scattered the same sparing way as the crack above. Same seam grid as
 *  PAVE underneath it; only the slab tone darkens, an irregular blob rather
 *  than a hard-edged shape so it doesn't read as a painted marking. */
export const PAVE_STAIN = [
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'qppPppppqppppppp',
  'qpppppppqpppPppp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqppPpppp',
  'qpppppppqppppppp',
  'qqqqqqqqqqqqqqqq',
  'qpppppppqqqqqppp',
  'qpppPpppqqqqqqpp',
  'qpppppppqqpqqqpp',
  'qpppppppqqqqpqPp',
  'qppppPppqqqqqqpp',
  'qpppppppqqqpqppp',
  'qpppppppqppppppp',
];

/** Pavement, then the kerb's lit top and shaded face, then road. */
export const KERB = [
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'qppPppppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqppPpppp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
  'qpppppppqppppppp',
  'qqqqqqqqqqqqqqqq',
  'qpppppppqppppppp',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'CCCCCCCCCCCCCCCC',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
];

export const GRASS = [
  'gggggggggggggggg',
  'ggggGgggggggggGg',
  'gggggggggggggggg',
  'gGgggggggggGgggg',
  'gggggggggggggggg',
  'ggggggggGggggggg',
  'ggggggggggggGggg',
  'gggGgggggggggggg',
  'gggggggggggggggg',
  'ggggggggggGggggg',
  'gGgggggggggggggg',
  'gggggggGgggggggg',
  'gggggggggggggggg',
  'ggggGgggggggggGg',
  'gggggggggggggggg',
  'ggggggggggggGggg',
];

// --- building ---------------------------------------------------------------

/** Plaster texture: a scatter of fleck pixels, dense and irregular enough to
 *  read as stucco grain rather than a repeating tile the moment several of
 *  these sit side by side. Only ever loose flecks, never a line or a band —
 *  see the header on why directional shading has no business here. */
export const WALL = [
  'wwwwwwwWwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwWwwwwwwnwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'nwwwwwwwWwwwwwww',
  'wwwwwwwwwwwWwwww',
  'wwwWwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwnwwwwwwwwww',
  'wwwwwwwwwwWwwwww',
  'wwWwwwwwwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwwwwwwnwww',
  'wwwwwwwwwwwwwwww',
  'wwwwWwwwwwwwwwww',
];

/** The building's shaded return, on its right-hand side. Column of the facade,
 *  not a property of every wall tile — see the header. */
export const WALL_EDGE = [
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
];

/** Brick, for facade variety. Courses are staggered so a wall of these does
 *  not grid up; the odd bricks — lighter (`r`, sun-bleached) and darker
 *  (`y`, borrowed from the shaded-return tone, sparingly, as a weathered
 *  brick rather than a shading cue) — are what keeps it from reading as
 *  fabric. Both in the same course would read as a pattern, so they never
 *  share a row. */
export const BRICK = [
  'BBBBBBBBBBBBBBBB',
  'Bbbbbbbrbbbbbbbb',
  'Bbbbbbbbbbbybbbb',
  'Bbbbbbbbbbbbbbbb',
  'Bbbbbbbbbbbbbbbb',
  'BBBBBBBBBBBBBBBB',
  'bbbbBbbbbbbbBbbb',
  'bbbbBbbbrbbbBbbb',
  'bbybBbbbbbbbBbbb',
  'bbbbBbbbbbbbBbbb',
  'BBBBBBBBBBBBBBBB',
  'Bbbbbbbbbbbbbbbb',
  'Bbbbbbbbbbbrbbbb',
  'Bbybbbbbbbbbbbbb',
  'Bbbbbbbbbbbbbbbb',
  'BBBBBBBBBBBBBBBB',
];

/** The shaded return again, in brick. Derived from BRICK by hand so the
 *  courses line up exactly with the tile beside it. */
export const BRICK_EDGE = [
  'BBBBBBBBBBBBYYYY',
  'Bbbbbbbrbbbbyyyy',
  'Bbbbbbbbbbbyyyyy',
  'Bbbbbbbbbbbbyyyy',
  'Bbbbbbbbbbbbyyyy',
  'BBBBBBBBBBBBYYYY',
  'bbbbBbbbbbbbYyyy',
  'bbbbBbbbrbbbYyyy',
  'bbybBbbbbbbbYyyy',
  'bbbbBbbbbbbbYyyy',
  'BBBBBBBBBBBBYYYY',
  'Bbbbbbbbbbbbyyyy',
  'Bbbbbbbbbbbryyyy',
  'Bbybbbbbbbbbyyyy',
  'Bbbbbbbbbbbbyyyy',
  'BBBBBBBBBBBBYYYY',
];

/** The return, where it crosses the cornice. The roof rows are left alone:
 *  the roof faces up, so the side of the building does not darken it. */
export const CORNICE_EDGE = [
  'ffffffffffffffff',
  'ffffffffffffffff',
  'lllllllllllloooo',
  'lllllllllllloooo',
  'LLLLLLLLLLLLLLLL',
  'nnnnnnnnnnnnNNNN',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
];

/** The return, where it meets the ground. */
export const PLINTH_EDGE = [
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'wwwwwwwwwwwwWWWW',
  'ttttttttttttuuuu',
  'ttttttttttttuuuu',
  'TTTTTTTTTTTTUUUU',
  'TTTTTTTTTTTTUUUU',
];

/** Tar-and-gravel roofing: a fine speckle across the whole tile (not just a
 *  few weathered patches) is what actually reads as texture from this steep
 *  a 3/4 angle -- a handful of isolated blobs on flat ground just looks like
 *  stains. Still only the two roof tones (f/F); the roof faces up, so it gets
 *  no shading of its own, only grain. (Generated once with a fixed random
 *  seed rather than hand-placed, then locked in as authored art -- see
 *  tools/build-tiles-sheet.mjs, this is not regenerated at build time.) */
export const ROOF = [
  'fFfFffFfFfFFffFf',
  'fffffFffFFffffff',
  'fFFfffffffffffff',
  'fffFffFfFfffffff',
  'ffffffFfffffffFf',
  'fFFfFfffFfffffff',
  'fffFffffffFfffff',
  'fffFffffffFfFFff',
  'fFFFFfFffFfffFff',
  'ffFFffffFffFfFff',
  'ffffffffffffffff',
  'fffFFfffffffffff',
  'ffffffffFfffffff',
  'ffffffffFFffFfff',
  'ffFFffffffffffff',
  'ffFffffffffffFff',
];

/** Roof lip and the shadow it throws. The single most important tile here:
 *  without the shadow the roof and the wall read as one flat plane. */
export const CORNICE = [
  'ffffffffffffffff',
  'ffffffffffffffff',
  'llllllllllllllll',
  'llllllllllllllll',
  'LLLLLLLLLLLLLLLL',
  'nnnnnnnnnnnnnnnn',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
];

/** Where the wall meets the ground. */
export const PLINTH = [
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'tttttttttttttttt',
  'tttttttttttttttt',
  'TTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTT',
];

/**
 * A belt course: a thin light/shadow ledge through the middle of an
 * otherwise plain wall row -- the cornice's own lip/shadow idea (`l`/`L`),
 * repeated in miniature partway up the facade instead of only at the roof.
 * **Follow-up from user review**, "not enough depth to the building tiles":
 * a tall run of identical WALL rows between the cornice and the base course
 * reads as one flat plane no matter how much grain the wall texture itself
 * carries, because grain has no direction -- only an actual light-catching
 * edge tells the eye a surface steps forward here. `faceRowPlan` in
 * renderer.js swaps one middle wall row for this on tall enough plaster
 * buildings, splitting the run into two visually distinct storeys. Plaster
 * only (`w` tone) -- a brick facade already breaks up its own flat run via
 * coursing and mortar, and a grey plaster ledge dropped into a brick-red
 * wall would read as a colour mismatch, not a floor division.
 */
export const BELT_COURSE = [
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'llllllllllllllll',
  'LLLLLLLLLLLLLLLL',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww',
];

// --- features ---------------------------------------------------------------
//
// Taller than one tile, because the thing they have to be in scale with is a
// 48px character rather than the grid. The tile renderer (#6) slices them into
// 16x16 cells; they are authored whole so the proportion is judged whole.

/**
 * 32 x 32 — two tiles wide, two tall. Glass catches cold sky in its upper
 * left, which is the only "light" in the whole set allowed to look like a
 * reflection. The sill in the last two rows reuses the cornice's own
 * lip/shadow tones (`l`/`L`) — it is the same idea in miniature, a
 * light-catching ledge with a hard shadow under it — rather than inventing a
 * second ledge language, and protrudes 1px past the frame on each side so it
 * reads as sitting proud of the wall instead of just being a darker row of
 * the frame itself.
 *
 * Widened twice on user review. First 12px -> 14px of a single 16px tile
 * ("too thin, doesn't look like a window") by shrinking the margin and
 * growing the actual glazed area, not just the frame -- a wider border alone
 * was tried and discarded for reading as a fatter frame around the same tiny
 * panes. Then, **second follow-up**, "at least 24px so they look wide enough
 * for players to pass through": the player sprite itself is 16px wide
 * (`SPRITE_W`), so a window/door opening narrower than that always reads as
 * a squeeze no matter how it's shaded. 24px isn't a multiple of the 16px
 * tile grid every other tile answers to, so the grid-aligned target is 32px
 * (two tiles) -- comfortably past the character's own width, not just
 * past it. Every run grew proportionally to reach it (a one-off generation
 * script, not hand-redrawn -- the same "generated once, then locked in as
 * authored art" approach ROOF's own speckle uses) except runs of 1-2px,
 * which stayed exactly their authored width: the mullion (`X`) is still a
 * single pixel, because a sash bar doesn't get thicker just because the
 * window did.
 */
export const WINDOW = [
  '.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xIIIIIIIIIIIIIIIXiiiiiiiiiiiix.',
  '.xXXXXXXXXXXXXXXXXXXXXXXXXXXXXx.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xiiiiiiiiiiiiiiiXiiiiiiiiiiiix.',
  '.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.',
];

/**
 * 32 x 32 — two tiles wide, two tall: a shopfront window, for a ground floor
 * that wants to look like it does business rather than just has a facade.
 * Originally added bigger than WINDOW; a later pass widened WINDOW itself to
 * the same 32px, so the two are now the same size and differ only in how
 * they're subdivided — three panes over two thin mullions here, vs WINDOW's
 * one, since a single pane this wide would either look like a wall of glass
 * with no structure or need a mullion thick enough to stop reading as a sash
 * bar. Kept as its own fixture for that variety (a real shopfront still
 * reads differently from a row of upstairs windows), not for size.
 */
export const WINDOW_WIDE = [
  '.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.xIIIIIIIIIXIIIIIIIIXIIIIIIIIIx.',
  '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiXiiiiiiiiXiiiiiiiiix.',
  '.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.',
];

/**
 * 32 x 48 — two tiles wide, three tall, exactly the character's height. The
 * height is the number that has to be right before anything else: a door
 * authored as a single 16px tile is a third of the player's height and
 * reads as a cat flap, and every other proportion in the facade is set by
 * how tall the way in is.
 *
 * Widened twice, the same two follow-ups as WINDOW's: 12px -> 14px of one
 * 16px tile first, then, on "at least 24px so they look wide enough for
 * players to pass through", the full jump to 32px (two tiles) -- 24px isn't
 * a multiple of this project's 16px tile grid, so 32 is the nearest
 * grid-aligned size past both 24px and the player's own 16px width. Every
 * flat run grew proportionally to fill it (the glass panes, the plain rail
 * rows, the raised panel's face) while every mark of 1-2px that actually
 * carries meaning -- the frame (`x`), the recessed reveal (`d`/`D`), the
 * handle (`k`), the corner accent's doubled `DD` -- stayed exactly the width
 * it was authored at, so the door reads as a genuinely bigger doorway, not a
 * stretched copy of the old one.
 */
export const DOOR = [
  '.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
  '.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdIIIIIIIIIIIIIIXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdiiiiiiiiiiiiiiXiiiiiiiiiiiDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xddddddddddddddddddddddddddkDx.',
  '.xddddddddddddddddddddddddddkDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdDDDDDDDDDDDDDDDDDDDDDDDDDDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDddddddddddddddddddddddddDDx.',
  '.xdDDDDDDDDDDDDDDDDDDDDDDDDDDDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.xdddddddddddddddddddddddddddDx.',
  '.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.',
  '.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.',
];

/** Shopfront awning. Same red as the character's accent — it is the colour
 *  this world spends, and a cinema is where it gets spent. */
export const AWNING = [
  '................',
  '................',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'vvvvssssvvvvssss',
  'VVVVSSSSVVVVSSSS',
  'VVVVSSSSVVVVSSSS',
  '................',
  '................',
];

/**
 * 16 x 48 — three tiles, a streetlamp standing at street height. Its glass is
 * baked warm-pale rather than the windows' cold blue: at runtime this is a
 * light *source* (SYSTEMS #8 registers a Light at its bulb), so the tile only
 * has to look right unlit, in daylight, when the shader adds nothing.
 * `LAMP_BULB_DY` is the bulb's centre, in px down from the top of this image
 * — the renderer's hook for placing that light without re-deriving it from
 * the art by eye.
 */
export const LAMP_BULB_DY = 6;
export const LAMP_POST = [
  '......EEEE......',
  '......EEEE......',
  '......EEEE......',
  '......eeee......',
  '......eeee......',
  '......eeee......',
  '......eeee......',
  '......eeee......',
  '......eeee......',
  '......eeee......',
  '.......EE.......',
  '.......EE.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
  '.......hH.......',
];

/** Draw order is the map's business, not the tile's — these are just names. */
export const TILES = {
  road: ROAD, roadLine: ROAD_LINE, pave: PAVE, paveCrack: PAVE_CRACK, paveStain: PAVE_STAIN,
  kerb: KERB, grass: GRASS,
  wall: WALL, wallEdge: WALL_EDGE, brick: BRICK, brickEdge: BRICK_EDGE,
  roof: ROOF, cornice: CORNICE, corniceEdge: CORNICE_EDGE,
  plinth: PLINTH, plinthEdge: PLINTH_EDGE, beltCourse: BELT_COURSE,
  awning: AWNING,
};

/** Multi-tile. Each is a whole number of tiles and slices cleanly. */
export const FEATURES = {
  window: WINDOW, windowWide: WINDOW_WIDE, door: DOOR, lampPost: LAMP_POST,
};
