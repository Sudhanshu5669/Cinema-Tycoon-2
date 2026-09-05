// Walking system: movement, facing and the animation state machine.
//
// Reads only the Input abstraction — never a key, never a pointer.
//
// Movement is eight-directional while facing stays four-directional, which is
// the standard for this genre and what SYSTEMS #3's "4-directional movement"
// is really after: strict four-way movement feels stiff the moment you try to
// walk around a corner. There are only four facings of art, so a diagonal picks
// one of them.

import {
  WALK_SPEED, WALK_FPS, IDLE_FPS, SHEET_COLS, FACING_ROWS, SPRITE_H,
} from '../core/config.js';
import { resolveMove } from './collision.js';
import { wireLight } from './lighting.js';

/** @typedef {'down'|'left'|'right'|'up'} Facing */

export const TEXTURE = 'player';

/**
 * Registers idle and walk clips for all four facings. Call once, after the
 * spritesheet is loaded.
 * @param {Phaser.Scene} scene
 */
export function registerAnimations(scene) {
  FACING_ROWS.forEach((facing, row) => {
    const base = row * SHEET_COLS;
    scene.anims.create({
      key: `idle-${facing}`,
      frames: scene.anims.generateFrameNumbers(TEXTURE, { start: base, end: base + 1 }),
      frameRate: IDLE_FPS,
      repeat: -1,
    });
    scene.anims.create({
      key: `walk-${facing}`,
      frames: scene.anims.generateFrameNumbers(TEXTURE, { start: base + 2, end: base + 5 }),
      frameRate: WALK_FPS,
      repeat: -1,
    });
  });
}

export class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x world x of the player's feet
   * @param {number} y world y of the player's feet
   * @param {(wx: number, wy: number) => boolean} [solidAt] world-pixel solidity
   *   query (SYSTEMS #6's tile renderer). Omitted, movement is unobstructed —
   *   what tools/smoke.mjs's pure walk checks want.
   */
  constructor(scene, x, y, solidAt = null) {
    /** Float position. The sprite is drawn at a rounded copy of it, so movement
     *  accumulates smoothly but never lands the art on a half pixel. */
    this.x = x;
    this.y = y;
    this.solidAt = solidAt;
    /** @type {Facing} */
    this.facing = 'down';
    this.moving = false;

    this.sprite = scene.add.sprite(x, y, TEXTURE);
    // Anchor at the feet: it is the contact point with the ground, which is what
    // collision and (later) depth sorting both want.
    this.sprite.setOrigin(0.5, 1);
    this.sprite.play('idle-down');
    // So the character sits in the same ambient/lit-window light as the
    // street around them (SYSTEMS #8), rather than reading as pasted on top.
    wireLight(this.sprite);
  }

  /**
   * @param {number} dt seconds since the last frame
   * @param {import('../core/input/index.js').Input} input
   */
  update(dt, input) {
    const { x: ax, y: ay } = input.axis;
    const moving = ax !== 0 || ay !== 0;

    if (moving) {
      const nx = this.x + ax * WALK_SPEED * dt;
      const ny = this.y + ay * WALK_SPEED * dt;
      if (this.solidAt) ({ x: this.x, y: this.y } = resolveMove(this.solidAt, this.x, this.y, nx, ny));
      else { this.x = nx; this.y = ny; }
      this.facing = pickFacing(this.facing, ax, ay);
    }

    if (moving !== this.moving || !this.sprite.anims.currentAnim?.key.endsWith(this.facing)) {
      this.sprite.play(`${moving ? 'walk' : 'idle'}-${this.facing}`, true);
      this.moving = moving;
    }

    this.sprite.setPosition(Math.round(this.x), Math.round(this.y));
    // Depth sorting against the tile renderer's structures (#6): everything in
    // the world is ordered by the world Y of its ground contact, and the feet
    // are the player's.
    this.sprite.setDepth(Math.round(this.y));
  }

  /** Feet position — the player's actual location in the world. */
  get feet() { return { x: this.x, y: this.y }; }

  /** Top of the sprite, for framing and debug readouts. */
  get top() { return this.y - SPRITE_H; }
}

/**
 * Which of the four art facings a movement vector should use.
 *
 * Keeping the current facing while its component is still held is what stops a
 * diagonal from strobing between two facings every frame — on a keyboard both
 * components are exactly 1, so "largest wins" has nothing to break the tie.
 *
 * @param {Facing} current
 * @param {number} ax
 * @param {number} ay
 * @returns {Facing}
 */
export function pickFacing(current, ax, ay) {
  const stillHeld =
    (current === 'left' && ax < 0) || (current === 'right' && ax > 0) ||
    (current === 'up' && ay < 0) || (current === 'down' && ay > 0);
  if (stillHeld) return current;
  if (Math.abs(ax) >= Math.abs(ay) && ax !== 0) return ax < 0 ? 'left' : 'right';
  if (ay !== 0) return ay < 0 ? 'up' : 'down';
  return current;
}
