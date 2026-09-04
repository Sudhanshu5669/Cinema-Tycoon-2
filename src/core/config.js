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

/**
 * Camera deadzone: the box in the centre of the screen the player moves inside
 * before the world starts to scroll. Without it the camera answers every step
 * and the whole world jitters around a player who is nailed to the middle.
 * 6 x 4 tiles — wide enough to absorb a turn, small enough that the player is
 * never near the screen edge when the camera does pick them up.
 */
export const CAMERA_DEADZONE_W = 96;
export const CAMERA_DEADZONE_H = 64;

/**
 * Follow smoothing, as an exponential rate per second (not a per-frame lerp —
 * a per-frame factor makes the camera faster on a 144Hz screen than a 60Hz one).
 * 12 settles a scroll in about a quarter second: enough to take the edge off,
 * little enough that the camera never feels like it is on a rubber band.
 */
export const CAMERA_SMOOTHING = 12;

/**
 * The camera aims at the middle of the body, not the feet. Following the feet
 * puts the character low in the frame and wastes a third of the screen on
 * ground the player is walking away from.
 */
export const CAMERA_FOCUS_LIFT = SPRITE_H / 2;
