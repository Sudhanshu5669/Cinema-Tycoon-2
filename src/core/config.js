// Locked art and feel constants. Nothing else in the codebase should hardcode
// these numbers — GAME_SPEC calls them locked, so they live in exactly one file.

/** Internal render resolution. Everything is authored against this. */
export const INTERNAL_W = 640;
export const INTERNAL_H = 360;

/** Tile grid. */
export const TILE = 16;

/** Player sprite cell. 3 tiles tall — see GAME_SPEC's flat art direction. */
export const SPRITE_W = 16;
export const SPRITE_H = 48;

/** Spritesheet layout: [idle 0, idle 1, walk 0..3] x [down, left, right, up]. */
export const SHEET_COLS = 6;
export const FACING_ROWS = ['down', 'left', 'right', 'up'];

/**
 * Walk speed in pixels per second. 64 = four tiles a second, which puts one
 * full four-frame cycle at two tiles of ground covered — close enough to a
 * natural stride that the feet do not visibly skate.
 */
export const WALK_SPEED = 64;

/** Walk cycle plays at 8fps: 500ms per cycle against 32px of travel. */
export const WALK_FPS = 8;

/** The idle breath is deliberately slow — it should read as breathing, not idling. */
export const IDLE_FPS = 0.8;
