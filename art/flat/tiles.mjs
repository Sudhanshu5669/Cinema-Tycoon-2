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
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvXXvvMMMMMMMMMMMMMMMMMMvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvXXvvRRRRRRRRRRRRRRRRRRvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvkkkkkkkkkkkkkkkkvvvXXvvvkkkkkkkkkkkkkkkkvvvXXvvvkkkkkkkkkkkkkkkkvvvXXvvvkkkkkkkkkkkkkkkkvvvx',
  'xvvvkkkkkkkkkkkkkkkkvvvXXvvvkkkkkkkkkkkkkkkkvvvXXvvvkkkkkkkkkkkkkkkkvvvXXvvvkkkkkkkkkkkkkkkkvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
  'xvVVVVVVVVVVVVVVVVVVVVvXXvVVVVVVVVVVVVVVVVVVVVvXXvVVVVVVVVVVVVVVVVVVVVvXXvVVVVVVVVVVVVVVVVVVVVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvXXvVvvvvvvvvvvvvvvvvvvVvx',
  'xvVVVVVVVVVVVVVVVVVVVVvXXvVVVVVVVVVVVVVVVVVVVVvXXvVVVVVVVVVVVVVVVVVVVVvXXvVVVVVVVVVVVVVVVVVVVVvx',
  'xvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvXXvvvvvvvvvvvvvvvvvvvvvvx',
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
export const POSTER_CASE = [
  'xxxxxxxxxxxxxxxxxxxxxxxx',
  'llllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLL',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%*%%%%%%%%%%%Xx',
  'xX%%*%%%%%%%%%%%%%%%*%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%VVVVVV%%%Xx',
  'xX%%%%%%*%%VVV++++VVV%Xx',
  'xX%%%%%%%%%V++++++++V%Xx',
  'xX%%%%%%%%VV++++++++VVXx',
  'xX%%%%%%%%V++++++++++VXx',
  'xX%%%%%%%%V++++++++++VXx',
  'xX%%%%%%%%V++++++++++VXx',
  'xX%%%%%%%%V++++++++++VXx',
  'xX%%%*%%%%VV++++++++VVXx',
  'xX%%%%%%%%%V++++++++V%Xx',
  'xX%%%%%%%%%VVV++++VVV%Xx',
  'xX%%%%**%%%%%VVVVVV%%%Xx',
  'xX%%%*****%%%%%%%%%%%%Xx',
  'xX%%**@@@***%%%%%%%%%%Xx',
  'xX%%%*****%%%%%%%%%%%%Xx',
  'xX%%%%**%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xXVVVVVVVVVVVVVVVVVVVVXx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%++++++++++++++++%%Xx',
  'xX%%++++++++++++++++%%Xx',
  'xX%%++++++++++++++++%%Xx',
  'xX%%++++++++++++++++%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xX%%%%%%%%%%%%%%%%%%%%Xx',
  'xXXXXXXXXXXXXXXXXXXXXXXx',
  'xjjjjjjjjjjsjjjjjjjjjjjx',
  'xJJJJJJJJJJJJJJJJJJJJJJx',
  '++++++++++++++++++++++++',
  'xxxxxxxxxxxxxxxxxxxxxxxx',
  'llllllllllllllllllllllll',
  'LLLLLLLLLLLLLLLLLLLLLLLL',
  'xdddddddddddddddddddddDx',
  'TTTTTTTTTTTTTTTTTTTTTTTT',
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
export const TILES = {
  road: ROAD, roadLine: ROAD_LINE, crosswalk: CROSSWALK, pave: PAVE, paveCrack: PAVE_CRACK, paveStain: PAVE_STAIN,
  kerb: KERB, grass: GRASS, trashCan: TRASH_CAN, newsBox: NEWS_BOX, sidewalkStar: SIDEWALK_STAR,
  lobbyCarpet: LOBBY_CARPET,
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
  boxOffice: BOX_OFFICE, posterCase: POSTER_CASE,
  cinemaDoors: CINEMA_DOORS, candyStand: CANDY_STAND,
  signBulb: SIGN_BULB,
};
