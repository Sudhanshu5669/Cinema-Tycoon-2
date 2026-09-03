// Virtual-stick input source — the touch half of the input abstraction.
//
// Deliberately has no visuals. GAME_SPEC puts the on-screen joystick in its own
// system (#21) and requires it be mobile-only; this is the port that system
// writes into, so the abstraction is device-complete now and the overlay can be
// dropped in later without gameplay code changing. It is also what a gamepad
// stick will feed once there is one.

/** @typedef {import('./index.js').Button} Button */

/** Fraction of the stick radius below which input is ignored. */
const DEADZONE = 0.2;

/** @implements {import('./index.js').InputSource} */
export class VirtualStickSource {
  /** @param {number} [radius] drag distance, in screen px, that means full tilt */
  constructor(radius = 40) {
    this.axis = { x: 0, y: 0 };
    /** @type {Set<Button>} */
    this.buttons = new Set();
    this.radius = radius;
    this.active = false;
  }

  /**
   * Feed a drag offset from the stick's origin, in screen pixels. Magnitude is
   * clamped to the unit circle, so a hard drag is not faster than a soft one.
   * @param {number} dx
   * @param {number} dy
   */
  setFromDrag(dx, dy) {
    const len = Math.hypot(dx, dy) / this.radius;
    if (len < DEADZONE) { this.release(); return; }
    const k = Math.min(1, len) / (Math.hypot(dx, dy) || 1);
    this.axis.x = dx * k;
    this.axis.y = dy * k;
    this.active = true;
  }

  release() {
    this.axis.x = 0;
    this.axis.y = 0;
    this.active = false;
  }

  /** @param {Button} b @param {boolean} down */
  setButton(b, down) {
    if (down) this.buttons.add(b); else this.buttons.delete(b);
  }

  destroy() { this.release(); this.buttons.clear(); }
}

/**
 * Whether to show touch controls at all. GAME_SPEC: the touch overlay is
 * mobile-only and must not appear on desktop. Checked on a coarse pointer rather
 * than user-agent sniffing, and `maxTouchPoints` catches touch laptops.
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: coarse)').matches === true
    || navigator.maxTouchPoints > 0;
}
