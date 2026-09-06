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

/**
 * A zebra-crossing stripe -- unlike ROAD_LINE's thin dash, this is meant to
 * fill most of the tile: a crosswalk's bars run parallel to traffic (so a
 * whole tile-width of a lane reads as one bar) and repeat across the
 * crossing, not along it, so several of these get placed a row apart rather
 * than end to end. Worn (`m`, never white -- see ROAD_LINE) with a scatter
 * of asphalt showing through, same idea as the pavement's own wear, so a
 * whole crossing doesn't read as one flat rectangle. Small margin top and
 * bottom keeps a hard edge from butting directly against a neighbouring
 * plain road row.
 */
export const CROSSWALK = [
  'aaaaaaaaaaaaaaaa',
  'aaaaAaaaaaaaazaa',
  'mmmmmmmmmmmmmmam',
  'mmmmmammmmmmmmmm',
  'mmmmammmmmmmmmAm',
  'mAmmmmmmmmmmmmam',
  'aammmmmmmmmmmmmm',
  'Ammmmmammmmmmmmm',
  'mmmmmmammmAmmmmm',
  'ammmmmmmmAmmmmmm',
  'mmmmmmmmmmmmmaAm',
  'mmmmmmmAAmmmmmmm',
  'ammAmmmmmmmmmmmm',
  'mmmAmmmmmmmmammm',
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

/**
 * A cheap street prop: a bin, seen top-down like GRASS, not a facade feature —
 * `'object'` layer sugar (SYSTEMS #6), one cell, no relief (see
 * `RELIEF_STRENGTH` in `build-tiles-sheet.mjs`: this stays exactly as flat as
 * GRASS, which is the same "top-down, stochastic, no structural edge" case).
 * Mostly transparent margin so the pavement underneath still reads through —
 * this is a thing standing *on* the street, not a tile replacing it.
 */
export const TRASH_CAN = [
  '................',
  '................',
  '................',
  '....QQQQQQQQ....',
  '...QZZZZZZZZQ...',
  '..ZZZZZZZZZZZZ..',
  '..ZZZZZZZZZZZZ..',
  '..ZZZZZZZZZZZZ..',
  '..ZZZZZZZZZZZZ..',
  '..ZZZZZZZZZZZZ..',
  '..ZZZZZZZZZZZZ..',
  '..ZZZZZZZZZZZZ..',
  '...ZZZZZZZZZZ...',
  '....ZZZZZZZZ....',
  '................',
  '................',
];

/**
 * A coin-op vending box -- the same "top-down street prop" case as
 * TRASH_CAN, deliberately in the kerb's own muted tones (`c`/`C`) rather than
 * a new colour: a street already has plenty of grey metal, and this is city
 * clutter, not a second thing competing for attention with the marquee's own
 * red. The dark strip through the middle (`i`, reused from window glass) is
 * its plastic display window, empty of any actual headline since there is no
 * letter tile to put one on.
 */
export const NEWS_BOX = [
  '................',
  '................',
  '................',
  '..cccccccccccc..',
  '..cCCCCCCCCCCc..',
  '..cCCCCCCCCCCc..',
  '..cCCiiiiiiCCc..',
  '..cCCiiiiiiCCc..',
  '..cCCiiiiiiCCc..',
  '..cCCiiiiiiCCc..',
  '..cCCCCCCCCCCc..',
  '..cCCCCCCCCCCc..',
  '..cCCCCCCCCCCc..',
  '..cccccccccccc..',
  '................',
  '................',
];

/**
 * A Hollywood Walk of Fame nod -- a brass-bordered terrazzo tile with a
 * five-point star pressed into it, one tile a `ground.cells` override can
 * drop in front of the cinema's own door the same way `paveCrack`/
 * `paveStain` already sit sparsely in the pavement. Single new dark ground
 * tone (`O`) plus the door handle's existing brass (`k`) -- two materials,
 * one tone each, the same discipline as every other tile here. The star
 * itself is a known chunky five-point silhouette (a filled point straight up
 * plus two swept-back legs), not a procedural cross/diamond -- a first pass
 * built from "arms + a diamond core" read as a compass rose, not a star, the
 * moment it was rendered at scale and checked against a real screenshot;
 * shape over cleverness. Left out of `RELIEF_STRENGTH` on purpose: it is
 * ground, and ground stays flat here (see PAVE/ROAD/GRASS).
 */
export const SIDEWALK_STAR = [
  'kkkkkkkkkkkkkkkk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOOkOOOOOOOk',
  'kOOOOOOkOOOOOOOk',
  'kOOOOOkkkOOOOOOk',
  'kOOkkkkkkkkkOOOk',
  'kOOOkkkkkkkOOOOk',
  'kOOOOkkkkkOOOOOk',
  'kOOOkkOOOkkOOOOk',
  'kOOkkOOOOOkkOOOk',
  'kOOOOOOOOOOOOOOk',
  'kOOOOOOOOOOOOOOk',
  'kkkkkkkkkkkkkkkk',
];

/**
 * The strip of carpet a cinema lays from its doors to the kerb. Ground-layer
 * sugar, placed like `paveCrack`/`sidewalkStar`. Deep red (`&`) with a
 * darker edge and a scatter of wear (`$`) so a runner several tiles long
 * doesn't read as one flat decal painted on the pavement. Flat, like all
 * ground here (see PAVE/ROAD/GRASS on why ground stays out of the normal
 * map): carpet has no relief worth a light picking out.
 */
export const LOBBY_CARPET = [
  '$$$$$$$$$$$$$$$$',
  '$&&$&&&&&&&&&&&$',
  '$&&&&&&&&&&$&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&$&&&&&&&&&&&$',
  '$&&&&&&&&&&$&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&$&&&&&&&&&&&$',
  '$&&&&&&&&&&$&&&$',
  '$&&&&&&&&&&&&&&$',
  '$&&&&&&&&&&&&&&$',
  '$$$$$$$$$$$$$$$$',
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
/**
 * Plaster, in the shaded tones -- a *background* building's face.
 *
 * Not to be confused with WALL_EDGE, which carries a hard 4px band down its
 * right-hand side because it exists to be the last column of a facade. Tiling
 * WALL_EDGE across a whole face instead -- which is exactly what "just use the
 * darker variant" tempts you into -- repeats that band every 16px and paints
 * vertical stripes up the entire building, the precise failure this file's own
 * header warns about. This tile is uniform, so it can be tiled anywhere.
 *
 * The point of having it: a street where every building is the same value has
 * no depth and nothing can be its focal point. Giving the neighbours a darker
 * material pushes them back and lets the cinema come forward, in data
 * (`face`/`base`/`cornice`/`plinth` in city.json), with no new geometry.
 */
export const WALL_DARK = [
  'WWWWWWWnWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWnWWWWWWNWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'NWWWWWWWnWWWWWWW',
  'WWWWWWWWWWWnWWWW',
  'WWWnWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWNWWWWWWWWWW',
  'WWWWWWWWWWnWWWWW',
  'WWnWWWWWWWWWWWWW',
  'WWWWWWWnWWWWWWWW',
  'WWWWWWWWWWWWNWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWnWWWWWWWWWWW',
];

/** Brick in the shaded tones, for a background building -- uniform, unlike
 *  BRICK_EDGE. See WALL_DARK on why that distinction matters. */
export const BRICK_DARK = [
  'YYYYYYYYYYYYYYYY',
  'Yyyyyyybyyyyyyyy',
  'Yyyyyyyyyyyyyyyy',
  'Yyyyyyyyyyyyyyyy',
  'Yyyyyyyyyyyyyyyy',
  'YYYYYYYYYYYYYYYY',
  'yyyyYyyyyyyyYyyy',
  'yyyyYyyybyyyYyyy',
  'yyyyYyyyyyyyYyyy',
  'yyyyYyyyyyyyYyyy',
  'YYYYYYYYYYYYYYYY',
  'Yyyyyyyyyyyyyyyy',
  'Yyyyyyyyyyybyyyy',
  'Yyyyyyyyyyyyyyyy',
  'Yyyyyyyyyyyyyyyy',
  'YYYYYYYYYYYYYYYY',
];

/** The roof lip, darkened to match WALL_DARK/BRICK_DARK. A receding building
 *  whose facade darkens but whose cornice stays bright reads as a dark wall
 *  wearing somebody else's roof. */
export const CORNICE_DARK = [
  'FFFFFFFFFFFFFFFF',
  'FFFFFFFFFFFFFFFF',
  'oooooooooooooooo',
  'oooooooooooooooo',
  'NNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNN',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
];

/** Where a background building's wall meets the pavement. Companion to
 *  WALL_DARK -- same reasoning as CORNICE_DARK, at the other end. */
export const PLINTH_DARK = [
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'uuuuuuuuuuuuuuuu',
  'uuuuuuuuuuuuuuuu',
  'UUUUUUUUUUUUUUUU',
  'UUUUUUUUUUUUUUUU',
];

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
 * 24 x 32 -- not a whole number of 16px tiles wide, which is fine: unlike
 * TILES, a FEATURE is placed once at an arbitrary pixel offset (atlas.js's
 * `tile()`, never the repeat-tiling `fill()`), so nothing requires its width
 * to divide TILE evenly -- see build-tiles-sheet.mjs's validation, which
 * only enforces that for TILES. Glass catches cold sky in its upper left,
 * which is the only "light" in the whole set allowed to look like a
 * reflection. The sill in the last two rows reuses the cornice's own
 * lip/shadow tones (`l`/`L`) — it is the same idea in miniature, a
 * light-catching ledge with a hard shadow under it — rather than inventing a
 * second ledge language, and protrudes 1px past the frame on each side so it
 * reads as sitting proud of the wall instead of just being a darker row of
 * the frame itself.
 *
 * Widened three times on user review. First 12px -> 14px of a single 16px
 * tile ("too thin, doesn't look like a window") by shrinking the margin and
 * growing the actual glazed area, not just the frame -- a wider border alone
 * was tried and discarded for reading as a fatter frame around the same tiny
 * panes. Then, on "at least 24px so they look wide enough for players to
 * pass through" (the player sprite is 16px wide, `SPRITE_W`, so anything
 * narrower always read as a squeeze), a first pass jumped straight to 32px,
 * reasoning 24 wasn't a multiple of the tile grid so the grid-aligned target
 * was two whole tiles -- overshooting what was actually asked for, and the
 * user caught it: "32 is too wide... I feel 24 was perfect." The tile-grid
 * reasoning was true but beside the point -- nothing about a FEATURE's own
 * width has to respect that grid, only where it's *placed* does (see the top
 * of this comment). 24px it is. Every run grew proportionally to reach
 * whichever width was current (a one-off generation script, not
 * hand-redrawn -- the same "generated once, then locked in as authored art"
 * approach ROOF's own speckle uses) except runs of 1-2px, which stayed
 * exactly their authored width: the mullion (`X`) is still a single pixel,
 * because a sash bar doesn't get thicker just because the window did.
 */
export const WINDOW = [
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xIIIIIIIIIIXiiiiiiiiix.',
  '.xXXXXXXXXXXXXXXXXXXXXx.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLL.',
];

/**
 * 24 x 32 -- WINDOW's exact frame with the glass lit from inside and somebody
 * at it: a warm field (`M`/`R`), a valance across the top sash, curtains down
 * one edge, and a dark head-and-shoulders silhouette in the lower sash.
 *
 * This is the single detail that does the most work in the reference image.
 * Its upper storeys are not decorated windows -- they are *occupied* ones,
 * with a staircase, a person and plants visible through the glass, and that
 * is what makes the building read as a place with people in it rather than a
 * facade with rectangles on it. The ordinary cold-glass WINDOW is still the
 * right tile for an unlit flat; this is for the ones that are home.
 */
export const WINDOW_LIT = [
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xRRRRRRRRRRXRRRRRRRRRx.',
  '.xRRRRRRRRRRXRRRRRRRRRx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xXXXXXXXXXXXXXXXXXXXXx.',
  '.xRRMMMMMMMMXMMMMMMMMMx.',
  '.xRRMMMMMMMMXMMMMMMMMMx.',
  '.xRRMMMMMMMMXMMMMMMMMMx.',
  '.xRRMMMMMMMMXMMMMMMMMMx.',
  '.xRRMMMMMMMMXMMMMMMMMMx.',
  '.xRRMMMMMMMMXMMMMMMMMMx.',
  '.xRRMMMMMMMMXMMMXXXXMMx.',
  '.xRRMMMMMMMMXMMXXXXXXMx.',
  '.xRRMMMMMMMMXMMXXXXXXMx.',
  '.xRRMMMMMMMMXMMMXXXXMMx.',
  '.xRRMMMMMMMMXMXXXXXXXXx.',
  '.xRRMMMMMMMMXMXXXXXXXXx.',
  '.xRRMMMMMMMMXMXXXXXXXXx.',
  '.xRRMMMMMMMMXMXXXXXXXXx.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLL.',
];

/** The same lit window without a figure -- a plant on the sill and one drawn
 *  curtain instead. Exists purely so a row of lit windows isn't eight copies
 *  of the same silhouette, which reads as wallpaper rather than as neighbours. */
export const WINDOW_WARM = [
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xRRRRRRRRRRXRRRRRRRRRx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xXXXXXXXXXXXXXXXXXXXXx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xMMMMMRRMMMXMMMMMMRRRx.',
  '.xMMMMRRRRMMXMMMMMMRRRx.',
  '.xMMMRRRRRRMXMMMMMMRRRx.',
  '.xMMMMRRRRMMXMMMMMMRRRx.',
  '.xMMMMMRRMMMXMMMMMMRRRx.',
  '.xMMMMMRRMMMXMMMMMMRRRx.',
  '.xMMMMRRRRMMXMMMMMMRRRx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xMMMMMMMMMMXMMMMMMRRRx.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLL.',
];

/**
 * 32 x 32 — two tiles wide, two tall: a shopfront window, for a ground floor
 * that wants to look like it does business rather than just has a facade.
 * Briefly the same size as plain WINDOW when a pass widened that one to 32px
 * too; WINDOW settled at 24px instead (see its own comment), so this is
 * genuinely bigger again, the way a shopfront window should read next to a
 * row of upstairs ones. Three panes over two thin mullions, since a single
 * pane this wide would either look like a wall of glass with no structure or
 * need a mullion thick enough to stop reading as a sash bar.
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
 * 24 x 48 — not a whole tile-multiple wide, same reasoning as WINDOW's own
 * comment: a FEATURE is placed once at a pixel offset, not repeat-tiled, so
 * only TILES answer to the 16px grid. 48px tall is three tiles, exactly the
 * character's height -- the number that has to be right before anything
 * else, since a door authored as a single 16px tile is a third of the
 * player's height and reads as a cat flap, and every other proportion in the
 * facade is set by how tall the way in is.
 *
 * Widened three times, the same follow-ups as WINDOW's: 12px -> 14px of one
 * 16px tile first, then a first attempt at "at least 24px so they look wide
 * enough for players to pass through" overshot to 32px (reasoning the tile
 * grid demanded it, which was true but irrelevant -- see WINDOW's comment),
 * and landed on the actually-requested 24px once corrected. Every flat run
 * grew proportionally to fill whichever width was current (the glass panes,
 * the plain rail rows, the raised panel's face) while every mark of 1-2px
 * that actually carries meaning -- the frame (`x`), the recessed reveal
 * (`d`/`D`), the handle (`k`), the corner accent's doubled `DD` -- stayed
 * exactly the width it was authored at, so the door reads as a genuinely
 * bigger doorway, not a stretched copy of the old one.
 */
export const DOOR = [
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xdddddddddddddddddddDx.',
  '.xdddddddddddddddddddDx.',
  '.xdddddddddddddddddddDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdIIIIIIIIIXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdiiiiiiiiiXiiiiiiiiDx.',
  '.xdddddddddddddddddddDx.',
  '.xdddddddddddddddddddDx.',
  '.xddddddddddddddddddkDx.',
  '.xddddddddddddddddddkDx.',
  '.xdddddddddddddddddddDx.',
  '.xdddddddddddddddddddDx.',
  '.xdDDDDDDDDDDDDDDDDDDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDddddddddddddddddDDx.',
  '.xdDDDDDDDDDDDDDDDDDDDx.',
  '.xdddddddddddddddddddDx.',
  '.xdddddddddddddddddddDx.',
  '.TTTTTTTTTTTTTTTTTTTTTT.',
  '.TTTTTTTTTTTTTTTTTTTTTT.',
];

/**
 * 96 x 48 -- the entrance itself: a bank of four red theatre doors, six tiles
 * wide, in one frame. **This is the single biggest thing the reference gets
 * right and a lone 24px door cannot**: a cinema's way in is a *wall* of doors,
 * because a full house has to leave through it in five minutes. One door
 * reads as a corner shop no matter how well it is drawn -- it was drawn well,
 * and it still read as a corner shop.
 *
 * Four 22px leaves separated by 2px mullions (`X`, the window frame's own
 * shaded reveal, reused) inside a 1px frame. Each leaf carries a tall glass
 * panel over a brass push bar over a recessed kick panel -- the real anatomy
 * of a theatre door, and the push bar in particular is what stops the bank
 * reading as four shopfront windows. The glass is warm (`M` over `R`, bright
 * at the top and deepening toward the floor) because it is lit from inside:
 * the lobby behind it is on, and that spill is what makes an entrance look
 * open rather than shuttered. `renderer.js` draws a lit alcove behind this
 * tile (see `ALCOVE_*` there) so the doorway sits inset in the wall with real
 * light in the recess, rather than glued flat to it.
 */
export const CINEMA_DOORS = [
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx',
  'x^^^^^^^^^^^^^^^^^^^^^^XX^^^^^^^^^^^^^^^^^^^^^^XX^^^^^^^^^^^^^^^^^^^^^^XX^^^^^^^^^^^^^^^^^^^^^^x',
  'x^^^^^^^^^^^^^^^^^^^^^^XX^^^^^^^^^^^^^^^^^^^^^^XX^^^^^^^^^^^^^^^^^^^^^^XX^^^^^^^^^^^^^^^^^^^^^^x',
  'x######################XX######################XX######################XX######################x',
  'x#~~~~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~~~~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~################kk~#XX#~kk################~#XX#~################kk~#XX#~kk################~#x',
  'x#~~~~~~~~~~~~~~~~~kk~#XX#~kk~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~kk~#XX#~kk~~~~~~~~~~~~~~~~~#x',
  'x##################kk##XX##kk##################XX##################kk##XX##kk##################x',
  'x##################kk##XX##kk##################XX##################kk##XX##kk##################x',
  'x#~~~~~~~~~~~~~~~~~kk~#XX#~kk~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~kk~#XX#~kk~~~~~~~~~~~~~~~~~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~##################~#XX#~##################~#XX#~##################~#XX#~##################~#x',
  'x#~~~~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~~~~#XX#~~~~~~~~~~~~~~~~~~~~#x',
  'x######################XX######################XX######################XX######################x',
  'x######################XX######################XX######################XX######################x',
  'x~~~~~~~~~~~~~~~~~~~~~~XX~~~~~~~~~~~~~~~~~~~~~~XX~~~~~~~~~~~~~~~~~~~~~~XX~~~~~~~~~~~~~~~~~~~~~~x',
  '&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
/**
 * 32 x 48 -- the walk-up ticket booth, two tiles wide and a full three tall,
 * so it stands the same height as the doors beside it instead of being a
 * half-height panel stuck on the wall. A walk-up box office is the single
 * most legible "buy your ticket here" cue available, and the reference makes
 * it a real projecting kiosk, not a window.
 *
 * Depth without a second facing: this view only ever draws south-facing
 * walls, so a kiosk cannot literally turn a corner. What sells it instead is
 * the *canopy* -- a bright lip (`l`) over a hard shadow (`L`) at the very
 * top, then the hood's own shadow (`n`) falling across the top rows of the
 * glass underneath it. Something has to be sticking out to throw that
 * shadow, and the eye supplies the rest. The same trick runs again at the
 * sill (rows 38-39) so the counter reads as projecting too.
 *
 * The glass is lit from inside (`@`, the lobby glow) rather than dark: an
 * unlit booth reads as closed, and the reference's is emphatically open. A
 * red placard band through the middle stands in for a prices board, and one
 * brass pixel (`k`) in the base is the ticket tray. The dark board across
 * the top (`%`) is where `renderer.js` prints the TICKET plaque.
 */
export const BOX_OFFICE = [
  'llllllllllllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '++++++++++++++++++++++++++++++++',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnx',
  'xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnx',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx',
  'xvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvx',
  'xVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVx',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@X@@@@@@@@@@@@@@@x',
  'xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx',
  'llllllllllllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  'xdddddddddddddkddddddddddddddddx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

/**
 * 24 x 48 -- a glass-fronted one-sheet case, grown from one tile wide to a
 * a real poster's proportions. At 16 x 32 the "poster" inside was 12 x 18px
 * and could only ever be a coloured rectangle; at 20 x 34 there is room for
 * an actual image, and an actual image is what a cinema frontage is *made*
 * of -- the reference hangs its whole left-hand side on one readable poster.
 *
 * What's on the sheet is a small sci-fi one-sheet: a gold planet disc, a few
 * stars, a ship crossing in silhouette with its engine glow (`@`), a dark
 * horizon and a gold title bar. Deliberately a *composition* and not a
 * texture -- it has a subject, a focal point and a place for a title, which
 * is what makes a 20px image read as a poster rather than as noise.
 *
 * Around it: a bright case lip over its shadow (the same projecting-canopy
 * trick BOX_OFFICE uses), a dark mat, a gold pinstripe, and one `s` pixel of
 * sun-bleached paper (`j`/`J`) standing in for a curled corner -- the
 * cheap-cinema detail, not a pristine display case.
 */
/**
 * 24 x 48 -- a poster case, with an actual poster in it.
 *
 * This used to be a red field with a vague gold oval on it, which from across
 * a street reads as "a lit rectangle" and nothing more. A poster case is one
 * of only three things on this frontage that tells you what kind of cinema
 * this is (the marquee and the reader board are the others), and the way it
 * does that is by having a *picture* on it, so this one has a rocket, a
 * creature and a title band.
 *
 * The field is `I`, the cool sky-glass tone, and that is the deliberate
 * choice here: every other lit thing on this facade is tungsten, so a cold
 * poster reads as a printed sheet behind glass rather than as another lamp.
 * It was the darker reader-board `K` first, which was the correct *hue* and
 * the wrong *value* -- at night, flanked by a blown-out doorway, a case that
 * dark stops reading as an illuminated case and starts reading as a hole in
 * the wall. A poster case has lamps inside it; the paper has to sit above
 * the brick around it, not below. Green is spent on the creature and nowhere else on
 * the street -- with the palette this warm, one small green shape is the most
 * legible thing that can happen inside a frame this size.
 */
export const POSTER_CASE = [
  'xxxxxxxxxxxxxxxxxxxxxxxx',
  'llllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLL',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xXIIIIIIIIIIIIIIIIIIIIXx',
  'xXIIII*IIIIIIIIIII*IIIXx',
  'xXIIIIIIIII*IIIIIIIIIIXx',
  'xXIIIIIIIII+IIIII*IIIIXx',
  'xXII*IIIIII+IIIIIIIIIIXx',
  'xXIIIIIIIII+IIIIIII*IIXx',
  'xXIIIIIIII+++IIIIIIIIIXx',
  'xXIIIIIIII+++IIII*IIIIXx',
  'xXIIIIIII++s++IIIIIIIIXx',
  'xXII*IIII++s++IIIIIIIIXx',
  'xXIIIIIII++s++IIIII*IIXx',
  'xXIIIIII+++++++IIIIIIIXx',
  'xXIIIIIV+++++++VIIIIIIXx',
  'xXIIIIVV+++++++VVIII*IXx',
  'xXIIIVVV+++++++VVVIIIIXx',
  'xXIIIIII+++++++IIIIIIIXx',
  'xXIIIIIII*+++*IIIIIIIIXx',
  'xXIIII*III*+*IIIIIIIIIXx',
  'xXIIIIIIIII*IIII*IIIIIXx',
  'xXIIIIIIIIIIIIIIIIIIIIXx',
  'xXIIgggggIIIIIIIIIIIIIXx',
  'xXIIgGgGgIIIIIIIII*IIIXx',
  'xXIgggggggIIIIIIIIIIIIXx',
  'xXIgGgggGgIIIII*IIIIIIXx',
  'xXIgggggggIIIIIIIIIIIIXx',
  'xXIIgggggIIIIIIIIIIIIIXx',
  'xXIIGgGgGIIIIIIIIIIIIIXx',
  'xXIIIIIIIIIIIIIIIIIIIIXx',
  'xXVVVVVVVVVVVVVVVVVVVVXx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%++++%%++++%%++++%%Xx',
  'xX%%++++%%++++%%++++%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xXVVVVVVVVVVVVVVVVVVVVXx',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xjjjjjjjjjjsjjjjjjjjjjjx',
  'xJJJJJJJJJJJJJJJJJJJJJJx',
  '++++++++++++++++++++++++',
  'xxxxxxxxxxxxxxxxxxxxxxxx',
  'llllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLL',
  'xdddddddddddddddddddddDx',
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'UUUUUUUUUUUUUUUUUUUUUUUU',
];

/**
 * 32 x 48 -- the concession counter, sized to match the box office across the
 * entrance. A candy-stripe hood under its own bright lip, a dark board for
 * the CANDY plaque `renderer.js` prints, then a lit counter (`@` again --
 * concessions are the brightest thing on a cinema frontage after the marquee
 * itself, which is the entire commercial point of them) with two striped
 * popcorn boxes standing on it. The boxes are the tell: a lit empty counter
 * is a cafe, and a lit counter with popcorn on it is a cinema.
 */
export const CANDY_STAND = [
  'llllllllllllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  'vvvvssssvvvvssssvvvvssssvvvvssss',
  'vvvvssssvvvvssssvvvvssssvvvvssss',
  'vvvvssssvvvvssssvvvvssssvvvvssss',
  'vvvvssssvvvvssssvvvvssssvvvvssss',
  'vvvvssssvvvvssssvvvvssssvvvvssss',
  'VVVVSSSSVVVVSSSSVVVVSSSSVVVVSSSS',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '++++++++++++++++++++++++++++++++',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnx',
  'xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnx',
  'xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnx',
  'x@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@x',
  'x@@@@@ssssss@@@@@@@@ssssss@@@@@x',
  'x@@@@svsvsvsv@@@@@@svsvsvsv@@@@x',
  'x@@@@svsvsvsv@@@@@@svsvsvsv@@@@x',
  'x@@@@svsvsvsv@@@@@@svsvsvsv@@@@x',
  'x@@@@svsvsvsv@@@@@@svsvsvsv@@@@x',
  'x@@@@svsvsvsv@@@@@@svsvsvsv@@@@x',
  'x@@@@svsvsvsv@@@@@@svsvsvsv@@@@x',
  'x@@@@@SSSSSS@@@@@@@@SSSSSS@@@@@x',
  'x@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@x',
  'x@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@x',
  'xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx',
  'llllllllllllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'xdddddddddddddddddddddddddddddDx',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

/** Shopfront awning -- a bright leading lip (`l`) over its own hard shadow
 *  (`L`), then the striped canopy falling away below it, so the thing reads
 *  as a surface tilted toward the sky rather than a flat painted band. Same
 *  red as the character's accent: it is the colour this world spends. */
export const AWNING = [
  'llllllllllllllll',
  'LLLLLLLLLLLLLLLL',
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
  'vvvvssssvvvvssss',
  'VVVVSSSSVVVVSSSS',
  'XXXXXXXXXXXXXXXX',
  '................',
];

/**
 * A cinema's own canopy, not the generic AWNING every shopfront can use: the
 * same striped body under the same bright lip, but ending in a real bulb
 * fringe -- a white-hot core (`*`) over its warm gold surround (`+`), set in
 * a dark rebate (`%`) so each bulb reads as a separate lamp with air around
 * it. A single row of alternating `e`/`E` pixels was tried first and at
 * night it read as a dotted line, because a bulb needs a bright centre AND a
 * darker socket to be a bulb; two tones cannot do both jobs at once. The
 * rhythm is every 4px, which divides the tile evenly, so a canopy tiled to
 * any width never shows a hitch in its spacing.
 */
export const MARQUEE = [
  'llllllllllllllll',
  'LLLLLLLLLLLLLLLL',
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
  '%%%%%%%%%%%%%%%%',
  '%*%%%*%%%*%%%*%%',
  '%+%%%+%%%+%%%+%%',
  '%%%%%%%%%%%%%%%%',
];

/**
 * A vertical blade sign, tileable: repeats via `fill()` to whatever height a
 * building's `sign.h` calls for, then capped with SIGN_CAP below. A blade
 * rising off a facade is the classic cinema silhouette -- it reads as a
 * cinema even blank, the way a striped pole reads as a barber's.
 *
 * Bulb columns down both edges (`*` core on `+` gold) frame a deep red field
 * (`=`). The bulb rhythm is every 2 rows, which divides this tile's own 16
 * evenly, so repeating it vertically never shows a seam in the spacing. It
 * was every 4 rows first and the blade read as a dull red pilaster at night:
 * a blade sign is mostly *bulbs*, and at half that density there weren't
 * enough of them for the thing to light up.
 *
 * **This is mounted on the facade, not stacked above the roof.** It used to
 * be stacked on the roofline, which on a building tall enough to want one
 * put the entire sign above the top of the frame -- 32 rows of authored art
 * that the player could not see from anywhere on the street it faces. See
 * `renderer.js`'s `sign.up`.
 */
export const SIGN_TOWER = [
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
];

/** The one-off finial on top of a SIGN_TOWER stack -- a stepped gold peak
 *  (transparent either side, so it actually tapers instead of just changing
 *  colour) with the bulb tones running up into it. Its own lower rows
 *  continue SIGN_TOWER's exact bulb/field pattern on the same 2-row phase,
 *  so the seam where they meet is invisible. */
export const SIGN_CAP = [
  '......++++......',
  '.....++**++.....',
  '....++****++....',
  '...++********...',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
  '*+============+*',
  '%+============+%',
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

/**
 * 8 x 8 -- one marquee bulb, on transparent. Not part of any board's own art:
 * `renderer.js` steps these around the perimeter of a signboard of whatever
 * size the data asks for (see its `_paintSignFrame`), which is the only way a
 * bulb frame can be data-driven -- a board's width is a `city.json` field, so
 * its bulb count cannot be baked into a fixed tile.
 *
 * A white-hot core (`*`) inside a gold ring (`+`) inside a dark rebate (`%`),
 * with a pixel of transparent margin all round so bulbs stepped at an 8px
 * pitch have visible air between them. `TILE_HEIGHT` gives `*` the tallest
 * value in the whole table, so the live light actually catches each bulb as a
 * bump rather than a flat dot.
 */
export const SIGN_BULB = [
  '........',
  '..%%%%..',
  '.%+**+%.',
  '.%****%.',
  '.%****%.',
  '.%+**+%.',
  '..%%%%..',
  '........',
];

/** Draw order is the map's business, not the tile's — these are just names. */
// --- street surface clutter --------------------------------------------------
//
// Ground-layer tiles, so they *replace* a slab rather than sit on it as an
// object: a manhole is not a thing standing on the pavement, it is what that
// square of pavement is. That also keeps them free -- they bake into the one
// ground image with everything else and cost nothing at runtime, where the
// same marks placed as objects would each be a separate y-sorted image.
//
// Density is the point of this whole group. A street with four objects on it
// reads as a diagram of a street however well each building is drawn, and the
// reference's pavement is covered: drains, patched slabs, blown litter, an
// iron cover. None of these is interesting on its own and none is meant to be
// -- they exist so the eye has somewhere to rest between the lit things.

export const MANHOLE = [
  'pppppppppppppppp',
  'ppppqqqqqqqqpppp',
  'ppqqZZZZZZZZqqpp',
  'pqZZQZZZZQZZZZqp',
  'pqZZZZQZZZZQZZqp',
  'qZZQZZZZQZZZZZZq',
  'qZZZZZZZZZZQZZZq',
  'qZZZZQZZZZZZZZZq',
  'qZZZZZZZQZZZZZZq',
  'qZZQZZZZZZZZQZZq',
  'qZZZZZZQZZZZZZZq',
  'pqZZZZZZZZQZZZqp',
  'pqZZQZZZZZZZZZqp',
  'ppqqZZZZZZZZqqpp',
  'ppppqqqqqqqqpppp',
  'pppppppppppppppp',
];

/** A storm drain. Meant for the row of kerb tiles specifically -- the dark
 *  slots are road colour, not a new one, because what you are looking into
 *  through a grating is the same darkness the road already is. */
export const DRAIN_GRATE = [
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'qZZZZZZZZZZZZZZq',
  'qZaaaaaaaaaaaaZq',
  'qZZZZZZZZZZZZZZq',
  'qZaaaaaaaaaaaaZq',
  'qZZZZZZZZZZZZZZq',
  'qZaaaaaaaaaaaaZq',
  'qZZZZZZZZZZZZZZq',
  'qZaaaaaaaaaaaaZq',
  'qZZZZZZZZZZZZZZq',
  'qZaaaaaaaaaaaaZq',
  'qZZZZZZZZZZZZZZq',
  'qqqqqqqqqqqqqqqq',
  'aaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaa',
];

/** One slab lifted and relaid in newer stone. The plinth tones are reused on
 *  purpose rather than a new pair: a patch is the same stone as the kerb and
 *  the building bases, which is exactly why it reads as a repair. */
export const PAVE_PATCH = [
  'pPpppqppppppqppp',
  'PppppppqppPppppp',
  'ppqTTTTTTTTTqppp',
  'pppTtttttttTpqpp',
  'pqpTtttttttTpppp',
  'pppTtttttttTppqp',
  'ppqTtttttttTpppp',
  'pppTtttttttTpppp',
  'pppTtttttttTpqpp',
  'pqpTtttttttTpppp',
  'pppTTTTTTTTTqppp',
  'ppppppqppppppppP',
  'pqppppppppqppppp',
  'ppppPpppppppppqp',
  'pppppppqpppppppp',
  'qppppppppppPpppp',
];

/** Blown paper. Poster stock (`j`/`J`), so the litter outside a cinema is
 *  last week's bill for last week's film -- one palette doing two jobs
 *  because they really are the same material. */
export const PAVE_LITTER = [
  'ppppppqpppppPppp',
  'pPppppppppqppppp',
  'ppppjjjppppppppp',
  'pppjJjjpppppqppp',
  'ppppjjppppjJppqp',
  'pqppppppppjjjppp',
  'pppppppppppJppPp',
  'ppqppppppppppppp',
  'ppppppPppqpppppp',
  'pppppppppppppqpp',
  'ppjjppppppppppPp',
  'pjJjjppqpppppppp',
  'ppjjppppppjjpppp',
  'pqppppppppjJjppq',
  'ppppPppppppjjppp',
  'pppppqpppppppppp',
];

// --- freestanding props ------------------------------------------------------
//
// Things that STAND ON the pavement rather than being painted onto a wall.
// That difference is the whole reason this group exists and is not more
// facade features: a facade feature is part of a building's baked oblique
// face, so it can never be walked behind, never occlude the player, and never
// throw a shadow of its own. The reference's ticket booth is none of those
// things -- it is a kiosk out on the footpath with its own footprint, its own
// roof, and its own shadow raking off it. See renderer.js's `_buildProp` and
// the `props` list in city.json.
//
// Bottom-anchored: a prop's last row is where it meets the ground, which is
// what its depth and its shadow are both derived from. So they may be any
// height; only their footprint has to agree with the tile grid.


// **Both stalls are authored as boxes that PROJECT, not as panels.** Three
// marks do that, and they are the same three the buildings already use, which
// is why a stall reads as belonging to this street rather than as a sprite
// parked on it:
//
//   the TOP     several rows of roof surface seen from above, foreshortened
//               the way a building's roof cap is -- you are looking down onto
//               the thing, so it has a top at all
//   the LIP     one bright row (`l`) with a hard shadow row (`L`) directly
//               under it, exactly CORNICE's trick. This is what says the top
//               and the front are two different planes meeting at an edge
//   the RETURN  the rightmost 3 columns in shaded tones all the way down
//               (`o`/`N`/`y`/`W`/`U`), which is WALL_EDGE's rule -- light
//               comes from the left, so the side of a box turned away from it
//               is the right one
//
// Without the return in particular a stall is a flat sticker however nicely
// its front is drawn, because nothing in the image says it has a side at all.

/**
 * 32 x 46 -- the cinema's ticket booth, projecting from the frontage.
 *
 * Built like a small building rather than like a sign, because that is what
 * it is: a lipped roof cap catching the light at the top, a dark fascia for
 * its TICKET plate, a big warm window with a seller behind it, a panelled
 * body, and a plinth where it meets the stone. The window is the point -- an
 * unlit booth is a shed, and the seller's silhouette is what says the cinema
 * is open tonight.
 */
export const TICKET_KIOSK = [
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFNNN',
  'fffFfffffffffffffFffffffffFffooo',
  'fffffffffffffffffffffffffffffooo',
  'ffffffffFffffffffffffFfffffffooo',
  'fffffffffffffffffffffffffffffooo',
  'lllllllllllllllllllllllllllllooo',
  'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLNNN',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  '=============================%%%',
  '=============================%%%',
  '=============================%%%',
  '=============================%%%',
  '=============================%%%',
  '=============================%%%',
  '=============================%%%',
  '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMXXXXXXMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMXXXXXXMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMXXXXXXMMMMXyXX',
  'XMMMMMMMMMMMXMMXXXXXXXXXXXMMXyXX',
  'XMMMMMMMMMMMXMMXXXXXXXXXXXMMXyXX',
  'XMMMMMMMMMMMXMMXXXXXXXXXXXMMXyXX',
  'XMMMMMMMMMMMXMMXXXXXXXXXXXMMXyXX',
  'XMMMMMMMMMMMXMXXXXXXXXXXXXXMXyXX',
  'XRRRRRRRRRRRXRRRRRRRRRRRRRRRXyXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXX',
  'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WwwwwwwwwwwwWwwwwwwwwwwwwwwwWyWW',
  'WwwwwwwwwwwwWwwwwwwwwwwwwwwwWyWW',
  'WwwwwwwwwwwwWwwwwwwwwwwwwwwwWyWW',
  'WwwwwwwwwwwwWwwwwwwwwwwwwwwwWyWW',
  'WwwwwwwwwwwwWwwwwwwwwwwwwwwwWyWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwWWW',
  'tttttttttttttttttttttttttttttuuu',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTUUU',
  'TtttttttttttttttttttttttttttTuUU',
  'TtttttttttttttttttttttttttttTuUU',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTUUU',
  'UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU',
];

/**
 * 32 x 40 -- the candy stall, projecting from the frontage beside the doors.
 *
 * A scalloped striped hood over a warm glass case, on legs. The stripes reuse
 * the awning's red and cream exactly, so the cart reads as belonging to the
 * cinema behind it rather than as a generic barrow that happens to be parked
 * there -- the same containment rule the marquee red already follows.
 */
export const CANDY_CART = [
  'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  'vvssvvssvvssvvssvvssvvssvvssvVVV',
  'vvssvvssvvssvvssvvssvvssvvssvVVV',
  'ssvvssvvssvvssvvssvvssvvssvvsVVV',
  'ssvvssvvssvvssvvssvvssvvssvvsVVV',
  'vvssvvssvvssvvssvvssvvssvvssvVVV',
  'vvssvvssvvssvvssvvssvvssvvssvVVV',
  'VvVvVvVvVvVvVvVvVvVvVvVvVvVvVVVV',
  'VV.VV.VV.VV.VV.VV.VV.VV.VV.VVVV.',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMMMMMMMMMMXMMMMMMMMMMMMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMssssssMMMXMMMMsssssssMMMMXyXX',
  'XMMSSSSSSMMMXMMMMSSSSSSSMMMMXyXX',
  'XRRRRRRRRRRRXRRRRRRRRRRRRRRRXyXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXX',
  'tttttttttttttttttttttttttttttuuu',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTUUU',
  'TtttttttttttttttttttttttttttTuUU',
  'TtttttttttttttttttttttttttttTuUU',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTUUU',
  'UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU',
  '.HH......................HH.....',
  '.HH......................HH.....',
  '.HH......................HH.....',
  '.HH......................HH.....',
  '.HH......................HH.....',
  '.EE......................EE.....',
  '.EE......................EE.....',
];

/** A fire hydrant. The one place on the street the awning red is spent
 *  outside the cinema, and it earns it: a hydrant is genuinely that colour,
 *  and a single small saturated mark on an otherwise stone pavement is how
 *  the eye finds scale down at ground level. */
export const HYDRANT = [
  '....vv....',
  '...VvvV...',
  '...vvvv...',
  '..VvvvvV..',
  '..vvvvvv..',
  '.QvvvvvvQ.',
  '.QvvvvvvQ.',
  '..vvvvvv..',
  '.vvvvvvvv.',
  '.vvVVVVvv.',
  '.vvvvvvvv.',
  '.vvvvvvvv.',
  '.VvvvvvvV.',
  '.VvvvvvvV.',
  '..VvvvvV..',
  '..VVVVVV..',
  '.VVVVVVVV.',
  '..EEEEEE..',
];

/** A kerbside bollard. Deliberately the streetlamp's own metal, not a new
 *  one: on a real street these are the same municipal ironwork, and reusing
 *  the palette is what makes them look like they were installed by the same
 *  council rather than drawn by a different hand. */
export const BOLLARD = [
  '.QQQQ.',
  '.QhhQ.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HhhH.',
  '.HHHH.',
  '.EEEE.',
  '..EE..',
];

/** A stone tub with a shrub in it. The only green above ground level on the
 *  street, and the reason it is here: an unbroken run of stone and brick has
 *  nothing organic in it at all, which is what makes a drawn city read as
 *  architecture rather than as somewhere people live. */
export const PLANTER = [
  '.......gGg..........',
  '.....gGgggGg........',
  '...gGgggggggGg......',
  '..gGggGgggggggG.....',
  '..gGgggggggggGg.....',
  '...gGgggGgggGg......',
  '.....ggGgggGg.......',
  '.......gGgGg........',
  '........ggg.........',
  '..tttttttttttttt....',
  '..tTTTTTTTTTTTTt....',
  '..tTttttttttttTt....',
  '..tTttttttttttTt....',
  '..tTttttttttttTt....',
  '..tTttttttttttTt....',
  '..tTTTTTTTTTTTTt....',
  '..TTTTTTTTTTTTTT....',
  '...UUUUUUUUUUUU.....',
];

/** A chalked A-board on the footpath. The gold marks are lettering read from
 *  across a street -- at this size actual glyphs would be mush, and a shape
 *  that reads as "writing" is more honest than four illegible letters. */
export const A_BOARD = [
  '..................',
  '...EEEEEEEEEEEE...',
  '..E============E..',
  '..E=++++++++++=E..',
  '..E============E..',
  '..E=+++++++++==E..',
  '..E============E..',
  '..E=++++++++++=E..',
  '..E============E..',
  '..E=++++++===+=E..',
  '..E============E..',
  '..EEEEEEEEEEEEEE..',
  '..EE..........EE..',
  '.EE............EE.',
  '.EE............EE.',
  'EE..............EE',
  'EE..............EE',
  'E................E',
  'E................E',
  'EE..............EE',
];

// --- facade features ---------------------------------------------------------

/**
 * 16 x 64 -- four storeys of fire escape, bolted to a facade.
 *
 * One 16-row storey module repeated four times, which is exactly how a real
 * one is built and also why it can be authored once and read as four. Its
 * value to the scene is less the ironwork than the shadow: it is the first
 * thing on this street with holes in it, so the cast-shadow layer gets a
 * silhouette with structure instead of another solid box.
 */
export const FIRE_ESCAPE = [
  '.QZZZZZZZZZZZZQ.',
  '.Q............Q.',
  '.Q.Q.Q.Q.Q.Q..Q.',
  '.QZZZZZZZZZZZZQ.',
  '.ZQZQZQZQZQZQZQ.',
  '..Z..........Z..',
  '.....QQQQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.QZZZZZZZZZZZZQ.',
  '.Q............Q.',
  '.Q.Q.Q.Q.Q.Q..Q.',
  '.QZZZZZZZZZZZZQ.',
  '.ZQZQZQZQZQZQZQ.',
  '..Z..........Z..',
  '.....QQQQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.QZZZZZZZZZZZZQ.',
  '.Q............Q.',
  '.Q.Q.Q.Q.Q.Q..Q.',
  '.QZZZZZZZZZZZZQ.',
  '.ZQZQZQZQZQZQZQ.',
  '..Z..........Z..',
  '.....QQQQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.QZZZZZZZZZZZZQ.',
  '.Q............Q.',
  '.Q.Q.Q.Q.Q.Q..Q.',
  '.QZZZZZZZZZZZZQ.',
  '.ZQZQZQZQZQZQZQ.',
  '..Z..........Z..',
  '.....QQQQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....Q..Q.......',
  '.....QHHQ.......',
  '.....QQQQ.......',
];

/** A window air-conditioning unit. Small, dull, and worth having: it is the
 *  cheapest possible mark that says a building is *occupied and maintained*
 *  rather than drawn, and a facade with three of them at different windows
 *  stops reading as a repeating pattern. */
export const AC_UNIT = [
  '..QQQQQQQQQQ..',
  '.QQQQQQQQQQQQ.',
  '.QZZZZZZZZZZQ.',
  '.QZaZaZaZaZZQ.',
  '.QZZZZZZZZZZQ.',
  '.QZaZaZaZaZZQ.',
  '.QZZZZZZZZZZQ.',
  '.QZZZZZZZZZZQ.',
  '.QQQQQQQQQQQQ.',
  '..ZZZZZZZZZZ..',
];

/**
 * 24 x 32 -- WINDOW's frame with a staircase behind the glass.
 *
 * The single most valuable window in the set, and the one the reference leans
 * on hardest: a lit rectangle says "a light is on", a lit rectangle with a
 * flight of stairs climbing across it says "there is a building behind this
 * wall". That is the entire difference between a facade and a place, and it
 * costs one tile. The treads step up left-to-right across both sashes so the
 * run reads as continuous through the transom rather than as two unrelated
 * halves.
 */
export const WINDOW_STAIR = [
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xRRRRRRRRRRXRRRRRRRRRx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMXXx.',
  '.xMMMMMMMMMMXMMMMMXXXXx.',
  '.xMMMMMMMMMMXMMMMXXXXRx.',
  '.xMMMMMMMMMMXMMMXXXXRRx.',
  '.xMMMMMMMMMMXMMXXXXRRRx.',
  '.xMMMMMMMMMMXMXXXXRRRRx.',
  '.xMMMMMMMMXXXXXXXRRRRRx.',
  '.xMMMMMMMXXXXXXRRRRRRRx.',
  '.xMMMMMMXXXXXRRRRRRRRRx.',
  '.xMMMMMXXXXXRRRRRRRRRRx.',
  '.xXXXXXXXXXXXXXXXXXXXXx.',
  '.xMMMXXXXXXMXMMMMMMMMMx.',
  '.xMMXXXXXXMMXMMMMMMMMMx.',
  '.xMXXXXXMMMMXMMMMMMMMMx.',
  '.xXXXXXMMMMMXMMMMMMMMMx.',
  '.xXXXXMMMMMMXMMMMMMMMMx.',
  '.xXXXMMMMMMMXMMMMMMMMMx.',
  '.xXXMMMMMMMMXMMMMMMMMMx.',
  '.xXMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xMMMMMMMMMMXMMMMMMMMMx.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLL.',
];

/**
 * 24 x 32 -- a television on in an otherwise dark room.
 *
 * The one window in the set whose glass is COLD (`K`, the reader-board blue)
 * while the room around it is dark. Everything else lit on this street is
 * some shade of tungsten, so a single blue-white flickering rectangle in a
 * row of amber ones is instantly legible as a different kind of light from a
 * different kind of evening -- and it is the one the flicker (glow.js's
 * per-light `flicker` flag) is worth spending on, because a television is the
 * only light source on the street that genuinely does not hold still.
 */
export const WINDOW_TV = [
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.xXXXXXXXXXXXXXXXXXXXXx.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xXXXXXXXXXXXXXXXXXXXXx.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiKKKKKKKKKKKKiiiiix.',
  '.xiiKKKKKKKKKKKKKKiiiix.',
  '.xiiKKIIIIIIIIIIKKiiiix.',
  '.xiiKKIIIIIIIIIIKKiiiix.',
  '.xiiKKIIIIIIIIIIKKiiiix.',
  '.xiiKKIIIIIIIIIIKKiiiix.',
  '.xiiKKKKKKKKKKKKKKiiiix.',
  '.xiiiKKKKKKKKKKKKiiiiix.',
  '.xiiiiXXiiiiiiXXiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xiiiiiiiiiiXiiiiiiiiix.',
  '.xxxxxxxxxxxxxxxxxxxxxx.',
  '.XXXXXXXXXXXXXXXXXXXXXX.',
  'llllllllllllllllllllllll',
  '.LLLLLLLLLLLLLLLLLLLLLL.',
];

/**
 * 24 x 32 -- a window that is actually a HOLE.
 *
 * Every other window in this set paints its glass. This one leaves it as `.`,
 * and the build tool notices: transparency that does not touch the frame's
 * outer edge can only be a gap the artist meant you to see through, so
 * `tools/build-tiles-sheet.mjs` derives an `opening` rect for it with nothing
 * declared anywhere. The renderer punches that rect out of the building's
 * baked face and draws a ROOM_* tile behind the wall, which is what you then
 * see through the glass.
 *
 * Note this tile carries NO transparent margin, unlike WINDOW and DOOR --
 * that is load-bearing, not tidiness. Their 1px `.` inset touches the edge,
 * which is exactly how the tool tells a margin apart from an opening; give
 * this one a margin and its "opening" would be the whole tile and the punch
 * would delete the wall around it.
 *
 * The mullion and transom are opaque and stay opaque: the punch takes the
 * bounding box and the tile is drawn back over it, so the bars survive on top
 * of the hole and divide the room behind into real panes.
 */
export const WINDOW_OPEN = [
  'xxxxxxxxxxxxxxxxxxxxxxxx',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xX.........XX.........Xx',
  'xxxxxxxxxxxxxxxxxxxxxxxx',
  'XXXXXXXXXXXXXXXXXXXXXXXX',
  'llllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLL',
];

// --- rooms -------------------------------------------------------------------
//
// 32 x 40 each, and drawn BEHIND the facade, visible only through a
// WINDOW_OPEN's punched glass. Bigger than the opening they sit behind (20 x
// 26) on purpose: the interior layer slides a few pixels against the wall as
// the camera passes (renderer.js's PARALLAX), and the overhang is the margin
// that lets it do that without an edge of the room swinging into view.
//
// These are lit by the same Light2D pass as everything else, through the same
// window light the facade entry already registers -- a room is a surface like
// any other, so a dark room at night is dark because the ambient says so, not
// because it was authored dark twice.

/**
 * A staircase climbing across the window, with a handrail over it.
 *
 * The single most valuable room in the set: a lit rectangle says a light is
 * on, a flight of stairs behind glass says there is a building back there
 * with floors in it.
 *
 * **Authored as real treads, not a diagonal.** The first version drew the
 * stair's soffit as one smooth diagonal band, on the reasoning that at 20px
 * across nobody would count the steps -- and through the window it read as a
 * lampshade, because a smooth triangle is not what a staircase looks like,
 * it is what a *shade* looks like. What actually carries it is the stepping
 * itself: eight 4px treads rising 3px each, every one with a lit nosing, and
 * the rail running parallel above them. Even at this size the eye reads
 * "repeated horizontal edges going up" as stairs and nothing else. */
export const ROOM_STAIR = [
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMRRRRMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMRMMMMMMRRRR',
  'MMMMMMMMMMMMMMMMMMMMMRMMMMMMXXXX',
  'MMMMMMMMMMMMMMMMRRRRMRMMMMMMXXXX',
  'MMMMMMMMMMMMMMMMMRMMMRMMRRRRXXXX',
  'MMMMMMMMMMMMMMMMMRMMMRMMXXXXXXXX',
  'MMMMMMMMMMMMRRRRMRMMMRMMXXXXXXXX',
  'MMMMMMMMMMMMMRMMMRMMRRRRXXXXXXXX',
  'MMMMMMMMMMMMMRMMMRMMXXXXXXXXXXXX',
  'MMMMMMMMRRRRMRMMMRMMXXXXXXXXXXXX',
  'MMMMMMMMMRMMMRMMRRRRXXXXXXXXXXXX',
  'MMMMMMMMMRMMMRMMXXXXXXXXXXXXXXXX',
  'MMMMRRRRMRMMMRMMXXXXXXXXXXXXXXXX',
  'MMMMMRMMMRMMRRRRXXXXXXXXXXXXXXXX',
  'MMMMMRMMMRMMXXXXXXXXXXXXXXXXXXXX',
  'RRRRMRMMMRMMXXXXXXXXXXXXXXXXXXXX',
  'MRMMMRMMRRRRXXXXXXXXXXXXXXXXXXXX',
  'MRMMMRMMXXXXXXXXXXXXXXXXXXXXXXXX',
  'MRMMMRMMXXXXXXXXXXXXXXXXXXXXXXXX',
  'MRMMRRRRXXXXXXXXXXXXXXXXXXXXXXXX',
  'MRMMXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'MRMMXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'RRRRXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
];

/** A desk under a picture, with someone sitting at it. The head and shoulders
 *  are the whole point -- one occupied room in a row of empty ones is what
 *  makes the others read as rooms rather than as texture. */
export const ROOM_LAMP = [
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMXXXXXXXXXXXXMMMMMMMMMMMMM',
  'MMMMMMMXMMMMMMMMMMXMMMMMMMMMMMMM',
  'MMMMMMMXMMMMMMMMMMXMMMMMMMMMMMMM',
  'MMMMMMMXMMMMMMMMMMXMMMMMMMMMMMMM',
  'MMMMMMMXMMMMMMMMMMXMMMMMMMMMMMMM',
  'MMMMMMMXXXXXXXXXXXXMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMXXXXMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMXXXXXXMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMXXXXXXMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMXXXXMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMXXXXXXXXMMMMMMMMMMMMM',
  'RRRRRRRRRRXXXXXXXXXXRRRRRRRRRRRR',
  'RRRRRRRRRXXXXXXXXXXXXRRRRRRRRRRR',
  'RRRRRRRRXXXXXXXXXXXXXXRRRRRRRRRR',
  'RRRRRRRRXXXXXXXXXXXXXXRRRRRRRRRR',
  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'XMMMMMMXXXXXXXXXXXXXXXXMMMMMMMMX',
  'XMMMMMMXRRRRRRRRRRRRRRXMMMMMMMMX',
  'XXXXXXXXRRRRRRRRRRRRRRXXXXXXXXXX',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
];

/**
 * Curtains, a pendant lamp, and a plant on the sill over a floor.
 *
 * The green is spent here, in the poster's creature, and nowhere else
 * indoors: against a palette this warm, one small cool-green shape is the
 * most legible thing that can happen inside a 20px opening.
 *
 * The lamp and the floor line matter as much as the plant. A first version
 * was a flat warm field with a plant in the middle of it, which through a
 * window reads as a lit blank -- a room needs a top and a bottom before
 * anything in it can look like it is standing somewhere. */
export const ROOM_PLANT = [
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'RRRRMMMMMMMMMMMXXMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMXXMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMXXMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMXXXXXXXXMMMMMMMMRRRR',
  'RRRRMMMMMMMXXXXXXXXXXMMMMMMMRRRR',
  'RRRRMMMMMMXXXXXXXXXXXXMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMMMMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMGGGGMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMGGGGGGMMMMMMMMMRRRR',
  'RRRRMMMMMMMMGGGGGGGGMMMMMMMMRRRR',
  'RRRRMMMMMMMMMGGGGGGMMMMMMMMMRRRR',
  'RRRRMMMMMMMMGGGGGGGGMMMMMMMMRRRR',
  'RRRRMMMMMMMMMGGGGGGMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMGGGGMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMMMGGMMMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMXXXXXXMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMXXXXXXMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMXXXXXXMMMMMMMMMRRRR',
  'RRRRMMMMMMMMMXXXXXXMMMMMMMMMRRRR',
  'RRRRXXXXXXXXXXXXXXXXXXXXXXXXRRRR',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
  'MMMMRRRRRRRRRRRRRRRRRRRRRRRRMMMM',
];

/** An unlit room -- furniture you can just make out and nothing else.
 *
 *  Worth having rather than leaving the window painted: an unlit see-through
 *  window still shows a real room, just an unoccupied one, so the dark
 *  windows on a facade are the same kind of object as the lit ones instead of
 *  a different tile pretending. It also means turning a light on in a flat is
 *  a data change (swap the room, add the light) rather than an art change. */
export const ROOM_DARK = [
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzziiiiiiiiiiiizzzzzzzzzzzz',
  'zzzzzzzziiiiiiiiiiiizzzzzzzzzzzz',
  'zzzzzzzziiiiiiiiiiiizzzzzzzzzzzz',
  'zzzzzzzziiiiiiiiiiiizzzzzzzzzzzz',
  'zzzzzzzziiiiiiiiiiiizzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzziiiiiiiizzzzzzzzzzzz',
  'zzzzzzzzzzziiiiiiiiiizzzzzzzzzzz',
  'zzzzzzzzzzziiiiiiiiiizzzzzzzzzzz',
  'zzzzzzzzzziiiiiiiiiiiizzzzzzzzzz',
  'zzzzzzzzzziiiiiiiiiiiizzzzzzzzzz',
  'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
  'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
];

export const TILES = {
  road: ROAD, roadLine: ROAD_LINE, crosswalk: CROSSWALK, pave: PAVE, paveCrack: PAVE_CRACK, paveStain: PAVE_STAIN,
  kerb: KERB, grass: GRASS, trashCan: TRASH_CAN, newsBox: NEWS_BOX, sidewalkStar: SIDEWALK_STAR,
  lobbyCarpet: LOBBY_CARPET,
  manhole: MANHOLE, drainGrate: DRAIN_GRATE, pavePatch: PAVE_PATCH, paveLitter: PAVE_LITTER,
  wall: WALL, wallEdge: WALL_EDGE, brick: BRICK, brickEdge: BRICK_EDGE,
  wallDark: WALL_DARK, brickDark: BRICK_DARK,
  corniceDark: CORNICE_DARK, plinthDark: PLINTH_DARK,
  roof: ROOF, cornice: CORNICE, corniceEdge: CORNICE_EDGE,
  plinth: PLINTH, plinthEdge: PLINTH_EDGE, beltCourse: BELT_COURSE,
  awning: AWNING, marquee: MARQUEE, signTower: SIGN_TOWER, signCap: SIGN_CAP,
};

/** Multi-tile. Each is a whole number of tiles and slices cleanly. */
export const FEATURES = {
  window: WINDOW, windowWide: WINDOW_WIDE, door: DOOR, lampPost: LAMP_POST,
  windowLit: WINDOW_LIT, windowWarm: WINDOW_WARM,
  windowStair: WINDOW_STAIR, windowTv: WINDOW_TV,
  windowOpen: WINDOW_OPEN,
  roomStair: ROOM_STAIR, roomLamp: ROOM_LAMP, roomPlant: ROOM_PLANT, roomDark: ROOM_DARK,
  fireEscape: FIRE_ESCAPE, acUnit: AC_UNIT,
  ticketKiosk: TICKET_KIOSK, candyCart: CANDY_CART, hydrant: HYDRANT,
  bollard: BOLLARD, planter: PLANTER, aBoard: A_BOARD,
  boxOffice: BOX_OFFICE, posterCase: POSTER_CASE,
  cinemaDoors: CINEMA_DOORS, candyStand: CANDY_STAND,
  signBulb: SIGN_BULB,
};
