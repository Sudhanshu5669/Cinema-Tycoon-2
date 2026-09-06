// Dev mod menu -- a live control panel for the running scene.
//
// Everything here already existed as a constant somewhere. The point of this
// file is that a constant you can only change by editing a file and reloading
// is a constant you tune roughly twice and then stop tuning, because each
// attempt costs a rebuild and a walk back to the spot you were looking at.
// Dragging a slider while looking at the actual street is a different activity
// from guessing a number, and it is the one that finds the right value.
//
// **Plain DOM, deliberately not a Phaser UI.** A menu drawn inside the game
// would have to be built out of the game's own 16px art and its own input
// abstraction, which means the tool for tuning the look is made of the thing
// being tuned -- switch the glow off to see what it does and the panel goes
// with it. It would also land on SYSTEMS #20's real HUD as a pile of
// dev-only special cases. An HTML overlay shares nothing with the game, costs
// the renderer nothing, and disappears entirely from a production build with
// the `import.meta.env.DEV` guard at its one call site.
//
// Two kinds of control, and the difference matters:
//   LIVE      time, glow strength, chase speed, parallax, layer toggles --
//             written straight into the running objects, visible on the next
//             frame, nothing rebuilt.
//   REBUILD   the cinema's name and what is showing. These are baked into a
//             signboard texture at build time (renderer.js's _paintSign), so
//             changing one means patching the city JSON and building a new
//             TileMapRenderer over the top. That is a few milliseconds and it
//             is honest -- the alternative is a second, live, non-baked text
//             path that production would never use, which would make the menu
//             a liar about what the game actually renders.

const PANEL_ID = 'dev-menu';

const CSS = `
#${PANEL_ID} {
  position: fixed; top: 8px; right: 8px; z-index: 9999;
  width: 232px; max-height: calc(100vh - 16px); overflow-y: auto;
  font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #d8d2c4; background: #14131aee; border: 1px solid #33303c;
  border-radius: 6px; padding: 8px 10px 10px;
  backdrop-filter: blur(3px); user-select: none;
}
#${PANEL_ID}[hidden] { display: none !important; }
#${PANEL_ID} h2 {
  font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
  color: #8d8797; margin: 12px 0 5px; font-weight: 600;
  border-bottom: 1px solid #2b2833; padding-bottom: 3px;
}
#${PANEL_ID} h2:first-of-type { margin-top: 6px; }
#${PANEL_ID} .row { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
#${PANEL_ID} .row label { flex: 0 0 74px; color: #9d97a8; }
#${PANEL_ID} .row .val { flex: 0 0 34px; text-align: right; color: #f2c451; }
#${PANEL_ID} input[type=range] { flex: 1; min-width: 0; accent-color: #f2c451; height: 14px; }
#${PANEL_ID} input[type=text] {
  flex: 1; min-width: 0; background: #0e0d12; color: #d8d2c4;
  border: 1px solid #33303c; border-radius: 3px; padding: 3px 5px; font: inherit;
}
#${PANEL_ID} .btns { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
#${PANEL_ID} button {
  flex: 1 1 auto; background: #24212c; color: #d8d2c4; border: 1px solid #3a3646;
  border-radius: 3px; padding: 3px 6px; font: inherit; cursor: pointer;
}
#${PANEL_ID} button:hover { background: #322e3d; }
#${PANEL_ID} button.on { background: #f2c451; border-color: #f2c451; color: #14131a; }
#${PANEL_ID} .hint { color: #6c6678; margin-top: 8px; font-size: 10px; }
`;

/**
 * @param {object} api the scene's own control surface -- see DevScene's
 *   `devControls()`. Passed in rather than reached for, so this file knows
 *   nothing about Phaser and the scene knows nothing about the DOM.
 */
export function createDevMenu(api) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  document.body.appendChild(panel);

  // --- small builders ------------------------------------------------------
  const el = (tag, cls, parent) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    (parent ?? panel).appendChild(n);
    return n;
  };
  const section = (title) => { el('h2').textContent = title; };

  /** A labelled slider. `fmt` renders the readout; `onInput` gets the number. */
  const slider = (label, { min, max, step, value, fmt = (v) => v.toFixed(2) }, onInput) => {
    const row = el('div', 'row');
    el('label', null, row).textContent = label;
    const input = el('input', null, row);
    input.type = 'range';
    Object.assign(input, { min, max, step, value });
    const out = el('span', 'val', row);
    out.textContent = fmt(value);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      out.textContent = fmt(v);
      onInput(v);
    });
    return { set: (v) => { input.value = String(v); out.textContent = fmt(v); } };
  };

  /**
   * A text field. Commits on Enter or blur, never per keystroke -- each commit
   * rebuilds the map, and doing that once per typed character would make the
   * field unusable.
   *
   * `onCommit` returning false means the scene refused the value (a marquee
   * name wider than its own board, say -- the loader measures that and throws)
   * and has already put its own state back. The field has to follow, or it
   * would sit there showing a name the game is not displaying.
   */
  const field = (label, value, onCommit) => {
    const row = el('div', 'row');
    el('label', null, row).textContent = label;
    const input = el('input', null, row);
    input.type = 'text';
    input.value = value;
    let last = value;
    const commit = () => {
      const v = input.value.trim();
      if (!v || v === last) { input.value = last; return; }
      if (onCommit(v) === false) { input.value = last; return; }
      last = v;
    };
    input.addEventListener('change', commit);
    // The game reads keys off `window` in the bubble phase (core/input/
    // keyboard.js), so without this, typing "SAD" into a name box walks the
    // player left. Stopping propagation here is the whole fix and it keeps
    // that knowledge in the UI that creates the problem.
    for (const ev of ['keydown', 'keyup', 'keypress']) {
      input.addEventListener(ev, (e) => e.stopPropagation());
    }
    return { set: (v) => { input.value = v; last = v; } };
  };

  const toggle = (label, initial, onChange) => {
    const b = document.createElement('button');
    b.textContent = label;
    let on = initial;
    const paint = () => b.classList.toggle('on', on);
    paint();
    b.addEventListener('click', () => { on = !on; paint(); onChange(on); });
    return b;
  };

  const buttons = (...nodes) => {
    const wrap = el('div', 'btns');
    for (const n of nodes) wrap.appendChild(n);
  };

  // --- time ----------------------------------------------------------------
  section('Time of day');
  const timeSlider = slider('hour', { min: 0, max: 24, step: 0.25, value: api.getHours(), fmt: hhmm },
    (v) => api.setHours(v));
  const presets = [['dawn', 6], ['morning', 9], ['noon', 12], ['dusk', 18], ['night', 22]]
    .map(([name, h]) => {
      const b = document.createElement('button');
      b.textContent = name;
      b.addEventListener('click', () => { api.setHours(h); timeSlider.set(h); });
      return b;
    });
  buttons(...presets, toggle('auto', api.getAuto(), (on) => api.setAuto(on)));

  // --- the cinema ----------------------------------------------------------
  section('Cinema');
  const nameField = field('name', api.getCinemaName(), (v) => api.setCinemaName(v));
  const showField = field('showing', api.getNowShowing(), (v) => api.setNowShowing(v));

  // --- look ----------------------------------------------------------------
  section('Look');
  slider('glow', { min: 0, max: 2.5, step: 0.05, value: 1 }, (v) => api.setGlowStrength(v));
  slider('chase', { min: 0, max: 24, step: 0.5, value: api.getChaseSpeed(), fmt: (v) => v.toFixed(1) },
    (v) => api.setChaseSpeed(v));
  slider('parallax', { min: 0, max: 4, step: 0.1, value: 1 }, (v) => api.setParallax(v));

  section('Layers');
  buttons(
    toggle('shadows', true, (on) => api.setLayer('shadows', on)),
    toggle('glow', true, (on) => api.setLayer('glow', on)),
    toggle('bulbs', true, (on) => api.setLayer('chase', on)),
    toggle('rooms', true, (on) => api.setLayer('interiors', on)),
    toggle('hud', true, (on) => api.setHud(on)),
  );

  el('div', 'hint').textContent = '` toggles this panel';

  // --- visibility ----------------------------------------------------------
  // Starts hidden: the panel overlaps the top-right of the frame, which on
  // this map is a facade, and a review screenshot has to be of the game.
  panel.hidden = true;
  const onKey = (e) => {
    if (e.code !== 'Backquote' || e.target instanceof HTMLInputElement) return;
    e.preventDefault();
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      // Re-read anything the game itself may have moved while the panel was
      // away -- the hour advances on its own under `auto`.
      timeSlider.set(api.getHours());
      nameField.set(api.getCinemaName());
      showField.set(api.getNowShowing());
    }
  };
  window.addEventListener('keydown', onKey);

  return {
    /**
     * Called each frame so the readout never lies about the hour. Not gated
     * on `auto`: the hotkeys (1-6, brackets) and anything else in the scene
     * can move the clock too, and a panel showing 16:00 over a midnight
     * street is worse than no panel.
     */
    sync() { if (!panel.hidden) timeSlider.set(api.getHours()); },
    destroy() {
      window.removeEventListener('keydown', onKey);
      panel.remove();
      style.remove();
    },
  };
}

/** 14.75 -> "14:45". The slider's own readout, so a quarter hour is legible
 *  as a time rather than as a decimal nobody reads as one. */
function hhmm(h) {
  const w = ((h % 24) + 24) % 24;
  const hh = Math.floor(w);
  const mm = Math.round((w - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
