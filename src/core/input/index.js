// The single input abstraction.
//
// GAME_SPEC: "All input routed through a single input abstraction from day one
// so no system ever reads a raw key event directly." That is the whole point of
// this file existing before any movement code — retrofitting it later means
// hunting raw listeners out of a dozen systems.
//
// A source is anything that can produce an axis and a set of held buttons: a
// keyboard, a virtual joystick, a gamepad later. `Input` merges them, so gameplay
// code asks `input.axis` and `input.justPressed('interact')` and never learns
// which device it came from, or whether there is more than one.

/**
 * @typedef {'interact'|'cancel'|'menu'} Button
 *
 * @typedef {object} InputSource
 * @property {{ x: number, y: number }} axis  each component -1..1, already deadzoned
 * @property {Set<Button>} buttons            buttons held right now
 * @property {() => void} [destroy]
 */

export class Input {
  constructor() {
    /** @type {InputSource[]} */
    this.sources = [];
    /**
     * Merged movement, clamped to the unit circle so a diagonal is not faster
     * than a straight line.
     * @type {{ x: number, y: number }}
     */
    this.axis = { x: 0, y: 0 };
    /** @type {Set<Button>} */
    this._held = new Set();
    /** @type {Set<Button>} */
    this._prev = new Set();
  }

  /** @param {InputSource} source */
  add(source) {
    this.sources.push(source);
    return source;
  }

  /** Call once per frame, before anything reads the input. */
  update() {
    let x = 0, y = 0;
    this._prev = this._held;
    const held = new Set();
    for (const s of this.sources) {
      x += s.axis.x;
      y += s.axis.y;
      for (const b of s.buttons) held.add(b);
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.axis.x = x;
    this.axis.y = y;
    this._held = held;
  }

  /** @param {Button} b */
  isDown(b) { return this._held.has(b); }

  /** @param {Button} b — true only on the frame the button went down. */
  justPressed(b) { return this._held.has(b) && !this._prev.has(b); }

  /** @param {Button} b */
  justReleased(b) { return !this._held.has(b) && this._prev.has(b); }

  /** True while the player is asking to move at all. */
  get moving() { return this.axis.x !== 0 || this.axis.y !== 0; }

  destroy() {
    for (const s of this.sources) s.destroy?.();
    this.sources.length = 0;
  }
}

export { KeyboardSource } from './keyboard.js';
export { VirtualStickSource, isTouchDevice } from './stick.js';
