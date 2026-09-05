// Tile-based collision — SYSTEMS #7.
//
// Resolves a proposed move against the tile renderer's solidAt(), one axis at
// a time, so walking diagonally into a wall slides the player along it
// instead of stopping the whole move dead. The footprint is a small box at
// the feet (COLLIDER_W x COLLIDER_H, config.js), not the full sprite — the
// shoulders of a three-tile-tall character should be free to overlap a wall
// visually while the feet still stop at it.
//
// Sampling only the box's four corners is enough to catch every solid tile it
// overlaps: with both dimensions under one tile (TILE = 16), the box can
// straddle at most a 2x2 group of cells, and each of those must contain at
// least one of the four corners.

import { COLLIDER_W, COLLIDER_H } from '../core/config.js';

/**
 * @param {(wx: number, wy: number) => boolean} solidAt
 * @param {number} x @param {number} y  the footprint's feet point — bottom
 *   centre of the collision box, matching the player's own origin
 * @returns {boolean} true if any corner of the feet box lands on solid ground
 */
export function blockedAt(solidAt, x, y) {
  const hw = COLLIDER_W / 2;
  return solidAt(x - hw, y - COLLIDER_H) || solidAt(x + hw, y - COLLIDER_H)
    || solidAt(x - hw, y) || solidAt(x + hw, y);
}

/**
 * Move from (x, y) toward (nx, ny). X and Y are resolved separately — trying
 * the full diagonal first would reject the whole step the instant either
 * component alone was blocked, which reads as snagging on a corner rather
 * than sliding past it.
 * @param {(wx: number, wy: number) => boolean} solidAt
 * @returns {{x: number, y: number}}
 */
export function resolveMove(solidAt, x, y, nx, ny) {
  const rx = blockedAt(solidAt, nx, y) ? x : nx;
  const ry = blockedAt(solidAt, rx, ny) ? y : ny;
  return { x: rx, y: ry };
}
