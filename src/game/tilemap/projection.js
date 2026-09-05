// Grid <-> screen projection for the tile renderer, with elevation.
//
// The world view is top-down 3/4. The ground plane maps 1:1 to world pixels:
// world (wx, wy) is grid cell (wx/TILE, wy/TILE), and the camera, the player
// and collision all live in that same world-pixel space.
//
// Elevation is the one thing that breaks 1:1. A cell at elevation `e` has its
// TOP SURFACE drawn `e * STEP` pixels higher on screen than its footprint, and
// the vertical face between an elevation and the lower ground in front of it is
// drawn as an oblique wall `dropLevels * STEP` tall. Faces only ever project
// straight down (south) -- there is no horizontal skew -- which is what keeps
// the projection compatible with a character that has four flat facings and no
// rotation. Raising STEP makes buildings taller without touching their
// footprints or the ground.

import { TILE } from '../../core/config.js';

export { TILE };

/**
 * Screen pixels per elevation level. A tile, so a one-level step reads as one
 * tile of wall and a five-storey building is a 5-tile face. Not in config.js
 * with the locked art constants because it is a renderer tuning knob, not a
 * number the art is authored against.
 */
export const STEP = TILE;

/**
 * Shared between `mapLoader.js` (which measures a marquee/reader-board
 * string against these to fail loudly if it overflows its band -- per user
 * request, "make sure name doesn't overflow the board") and `renderer.js`
 * (which draws at the same scale/margin it was validated against). Lives
 * here, not in `renderer.js` itself, so the loader can import it without
 * pulling in `renderer.js`'s own Phaser-coupled dependencies (atlas.js,
 * lighting.js) and losing its "pure loader tests need no browser" property.
 */
export const MARQUEE_TEXT_SCALE = 2;
/** Total horizontal margin (both sides combined) kept clear of the text. */
export const MARQUEE_TEXT_MARGIN = 8;

/** Depth band constants. Everything static and always-behind sits at the floor;
 *  everything always-in-front (roof overhangs, awnings, tree canopy) sits at the
 *  ceiling; the player and the y-sorted world structures share the middle and
 *  are ordered by their ground-contact row. */
export const DEPTH_GROUND = -100000;
/** Cast shadows: on the ground image, under every structure and the player. */
export const DEPTH_SHADOW = DEPTH_GROUND + 5;
export const DEPTH_OVERHEAD = 100000;

/** World-pixel Y of a cell's footprint (its contact with the ground plane). */
export const footY = (ty) => (ty + 1) * TILE;

/** Screen Y of the top surface of a cell at row `ty`, elevation `e`, relative
 *  to the world origin (the camera applies the scroll). */
export const surfaceY = (ty, e) => ty * TILE - e * STEP;

/**
 * Depth for a y-sorted world object, from the world Y of its ground contact.
 * The player uses its feet Y through this same function, so a structure and the
 * player order purely by who is further down the screen.
 */
export const depthFor = (contactWorldY) => contactWorldY;
