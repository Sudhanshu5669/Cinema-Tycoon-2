// Keyboard input source. The only file in the project allowed to touch a
// KeyboardEvent.

/** @typedef {import('./index.js').Button} Button */

/** Physical-key codes, so the bindings survive a non-QWERTY layout. */
const BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  interact: ['Space', 'KeyE', 'Enter'],
  cancel: ['Escape'],
  menu: ['Tab'],
};

/** code -> action, flattened once at module load. */
const ACTION_FOR_CODE = new Map();
for (const [action, codes] of Object.entries(BINDINGS)) {
  for (const code of codes) ACTION_FOR_CODE.set(code, action);
}

/** Keys the browser would otherwise scroll or tab away with. */
const SWALLOW = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab']);

/** @implements {import('./index.js').InputSource} */
export class KeyboardSource {
  /** @param {EventTarget} [target] */
  constructor(target = window) {
    this.axis = { x: 0, y: 0 };
    /** @type {Set<Button>} */
    this.buttons = new Set();
    /** @type {Set<string>} */
    this._down = new Set();
    this._target = target;

    this._onDown = (/** @type {KeyboardEvent} */ e) => {
      if (!ACTION_FOR_CODE.has(e.code)) return;
      if (SWALLOW.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this._down.add(e.code);
      this._recompute();
    };
    this._onUp = (/** @type {KeyboardEvent} */ e) => {
      if (!this._down.delete(e.code)) return;
      this._recompute();
    };
    // Losing focus mid-key never delivers the keyup, which would otherwise leave
    // the player walking into a wall forever.
    this._onBlur = () => { this._down.clear(); this._recompute(); };

    target.addEventListener('keydown', this._onDown);
    target.addEventListener('keyup', this._onUp);
    window.addEventListener('blur', this._onBlur);
  }

  _recompute() {
    let x = 0, y = 0;
    this.buttons.clear();
    for (const code of this._down) {
      switch (ACTION_FOR_CODE.get(code)) {
        case 'up': y -= 1; break;
        case 'down': y += 1; break;
        case 'left': x -= 1; break;
        case 'right': x += 1; break;
        default: this.buttons.add(/** @type {Button} */ (ACTION_FOR_CODE.get(code)));
      }
    }
    // Opposite keys held together cancel rather than fighting.
    this.axis.x = Math.sign(x);
    this.axis.y = Math.sign(y);
  }

  destroy() {
    this._target.removeEventListener('keydown', this._onDown);
    this._target.removeEventListener('keyup', this._onUp);
    window.removeEventListener('blur', this._onBlur);
    this._down.clear();
  }
}
