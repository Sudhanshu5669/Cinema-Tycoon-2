// Camera: follow with a deadzone, clamped to the world, snapped to whole pixels.
//
// Why this does not use Phaser's own `startFollow`:
//
// Phaser lerps the scroll toward the target and then, because `roundPixels` is
// on, floors the result and writes it back as the new scroll (Camera.js
// preRender). Floor-then-feed-back loses the fraction every frame, so a slow
// lerp can never close the last pixel: with lerp 0.15 the camera stalls until
// the target is ~7px past the deadzone, and it keeps that error when the player
// stops. Smoothing and pixel snapping fight each other the moment the rounded
// value is the one being smoothed.
//
// So the float scroll is kept here and only a rounded copy is handed to the
// camera. The smoothing sees exact numbers and converges; the renderer only
// ever sees integers, which is what stops static tile edges shimmering as the
// world moves. (`Camera.roundPixels` stays on regardless: with an integer
// scroll its floor is a no-op, and it is also what keeps sprite draws on whole
// pixels.)

import {
  INTERNAL_W, INTERNAL_H,
  CAMERA_DEADZONE_W, CAMERA_DEADZONE_H, CAMERA_SMOOTHING, CAMERA_FOCUS_LIFT,
} from '../core/config.js';

/** A frame this long or longer is a stall (tab restored, GC pause); smoothing
 *  it as real time would teleport the camera. Clamped instead. */
const MAX_STEP = 0.1;

export class FollowCamera {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x: number, y: number}} target followed by reference — the player's
   *   feet, in world coordinates
   * @param {number} worldW
   * @param {number} worldH
   */
  constructor(scene, target, worldW, worldH) {
    this.cam = scene.cameras.main;
    this.target = target;
    this.setWorldSize(worldW, worldH);

    this.cam.setRoundPixels(true);

    /** Float scroll. `cam.scrollX/Y` is the rounded presentation of this. */
    this.x = 0;
    this.y = 0;
    this.snap();
  }

  /** @param {number} worldW @param {number} worldH */
  setWorldSize(worldW, worldH) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.cam.setBounds(0, 0, worldW, worldH);
    // A world smaller than the viewport has no room to scroll at all, so the
    // range collapses to zero rather than going negative.
    this.maxX = Math.max(0, worldW - INTERNAL_W);
    this.maxY = Math.max(0, worldH - INTERNAL_H);
  }

  /** Where the camera is aiming: the middle of the body, in world space. */
  get focus() {
    return { x: this.target.x, y: this.target.y - CAMERA_FOCUS_LIFT };
  }

  /**
   * The deadzone in screen space. Constant — it is the camera that moves, not
   * the box. Exposed so the dev scene can draw it and the smoke test can assert
   * against it.
   */
  get deadzone() {
    const w = CAMERA_DEADZONE_W, h = CAMERA_DEADZONE_H;
    const x = Math.round((INTERNAL_W - w) / 2);
    const y = Math.round((INTERNAL_H - h) / 2);
    return { x, y, w, h, right: x + w, bottom: y + h };
  }

  /** Centre on the target immediately, with no smoothing. For scene start and
   *  for anything that teleports the player — a door, a scene transition. */
  snap() {
    const f = this.focus;
    this.x = this.clampX(f.x - INTERNAL_W / 2);
    this.y = this.clampY(f.y - INTERNAL_H / 2);
    this.apply();
  }

  /** @param {number} dt seconds */
  update(dt) {
    const step = Math.min(dt, MAX_STEP);
    const f = this.focus;
    const dz = this.deadzone;

    // Where the focus sits on screen against the *float* scroll, so the error
    // being smoothed is the true one and not a rounded approximation of it.
    const sx = f.x - this.x;
    const sy = f.y - this.y;

    let wantX = this.x;
    if (sx < dz.x) wantX += sx - dz.x;
    else if (sx > dz.right) wantX += sx - dz.right;

    let wantY = this.y;
    if (sy < dz.y) wantY += sy - dz.y;
    else if (sy > dz.bottom) wantY += sy - dz.bottom;

    // Framerate-independent exponential approach: the same fraction of the
    // remaining distance per second of real time, whatever the frame rate.
    const t = 1 - Math.exp(-CAMERA_SMOOTHING * step);
    this.x = this.clampX(this.x + (wantX - this.x) * t);
    this.y = this.clampY(this.y + (wantY - this.y) * t);

    this.apply();
  }

  /** @param {number} v */
  clampX(v) { return Math.min(Math.max(v, 0), this.maxX); }
  /** @param {number} v */
  clampY(v) { return Math.min(Math.max(v, 0), this.maxY); }

  apply() {
    this.cam.setScroll(Math.round(this.x), Math.round(this.y));
  }
}
