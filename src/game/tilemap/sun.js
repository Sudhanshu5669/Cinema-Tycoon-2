// A cheated sun -- the shared hour-of-day model behind both the cast-shadow
// layer (SYSTEMS #6) and the scene lighting layer (SYSTEMS #8).
//
// The real day/night clock is SYSTEMS #16; this module answers two narrow
// questions instead: given the hour and how tall a thing is, what 2D offset
// and opacity is the shadow it drops on the street (shadowFor, #6); and given
// the hour, what colour is the ambient light and how lit is a window or the
// cinema marquee (ambientFor / glowFor, #8).
//
// The cheat: a sun placed where the real one would be spends the middle of the
// day roughly south of a northern-hemisphere street, so its shadows fall north
// -- away from the camera, behind the buildings, invisible. So the sun here is
// kept low and behind the viewer all day: shadows always rake south across the
// pavement where they can be seen, and only their direction (south-west in the
// morning, near-straight-down at noon, south-east in the evening) and their
// length (long at the ends of the day, short at noon) change with the hour.
// Evening -- sun in the west -- is also when the cast shadow agrees with the
// west-lit flat tiles; ambientFor's dawn ramp is what now resolves the
// morning half-hour mismatch #6 flagged as a job for this system.

export const DAWN = 6;
export const DUSK = 18;

/**
 * @param {number} hours  0..24, wraps
 * @param {number} heightPx  the caster's silhouette height
 * @returns {{ dx: number, dy: number, alpha: number } | null}
 *   null between dusk and dawn -- no cast shadow at night.
 */
export function shadowFor(hours, heightPx) {
  const h = ((hours % 24) + 24) % 24;
  if (h <= DAWN - 0.5 || h >= DUSK + 0.5) return null;

  // 0 at the horizons, 1 at noon.
  const day = Math.max(0, Math.sin((Math.PI * (h - DAWN)) / (DUSK - DAWN)));

  // Length: ~0.35x the height at noon, up to ~2.6x near dawn and dusk.
  const len = heightPx * (0.35 + 2.25 * (1 - day));

  // Direction: the horizontal part swings west -> 0 -> east across the day; the
  // vertical part is always toward the camera so the shadow lands on the street.
  const horiz = Math.sin((Math.PI * (h - 12)) / 12); // h6:-1  h12:0  h18:+1
  const mag = Math.hypot(horiz, 0.62) || 1;

  return {
    dx: (horiz / mag) * len,
    dy: (0.62 / mag) * len,
    // Faint at the edges of the day, firmer at noon, with a floor so a long
    // dawn shadow still reads.
    alpha: 0.12 + 0.2 * day,
  };
}

/** Hours as HH:MM, for the dev HUD. */
export function clockLabel(hours) {
  const h = ((hours % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// --- ambient light + light-cutout colour, for the SYSTEMS #8 lighting layer -

const wrapHour = (h) => ((h % 24) + 24) % 24;
const smooth = (t) => t * t * (3 - 2 * t); // smoothstep, so a hand-picked
                                            // keyframe list never shows a
                                            // visible kink at its own edges

/** RGB float triple (0..1 per channel, may run slightly over 1) -> a packed
 *  0xRRGGBB int, the form Phaser's Light/LightsManager setColor wants. */
function packRGB([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return (c(r) << 16) | (c(g) << 8) | c(b);
}

function lerpRGB([r1, g1, b1], [r2, g2, b2], t) {
  return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t];
}

// Anchor tones. NIGHT and DAY are reused at every occurrence rather than each
// getting its own shade -- one dark/cool tone, one bright/near-neutral tone,
// and the transitions between them are what actually reads as day/night.
const NIGHT = [0.11, 0.12, 0.19];   // dark and cool -- geometry still legible,
                                     // but genuinely dark. An earlier, lighter
                                     // night lifted the whole street to within
                                     // a few values of the lit shopfronts, so
                                     // nothing could read as *the* light source;
                                     // a warm glow only looks like a glow when
                                     // there is real darkness for it to sit in.
const DAY = [1.02, 1.00, 0.92];     // bright, faintly warm -- "as authored"
const EVENING = [0.62, 0.44, 0.36]; // warm dusk. Warmer than the night that
                                     // follows it, so the hour before the
                                     // lights come on reads as the sun going
                                     // rather than as the street going blue.

/** Ambient keyframes across a full day. Flat NIGHT/DAY stretches either side
 *  of a ramp through dawn and dusk; the two ends (0h, 24h) must agree since
 *  the interpolation below wraps between them. */
const AMBIENT_KEYS = [
  { h: 0, c: NIGHT },
  { h: DAWN - 1, c: NIGHT },
  { h: DAWN + 1.5, c: DAY },
  { h: DUSK - 2, c: DAY },
  { h: DUSK, c: EVENING },
  { h: DUSK + 2, c: NIGHT },
  { h: 24, c: NIGHT },
];

/**
 * The scene's ambient light colour at a given hour -- multiplies every pixel
 * before any point light is added, so it is the "how dark is the unlit
 * street" half of the lighting layer.
 * @param {number} hours 0..24, wraps
 * @returns {number} packed 0xRRGGBB
 */
export function ambientFor(hours) {
  const h = wrapHour(hours);
  for (let i = 0; i < AMBIENT_KEYS.length - 1; i++) {
    const a = AMBIENT_KEYS[i], b = AMBIENT_KEYS[i + 1];
    if (h >= a.h && h <= b.h) return packRGB(lerpRGB(a.c, b.c, smooth((h - a.h) / (b.h - a.h))));
  }
  return packRGB(NIGHT);
}

/**
 * A smooth 0..1 hump covering the hour span from `from` to `to`, wrapping
 * through midnight -- the shape a light-cutout's "how lit is it right now"
 * curve wants (off all day, ramps up approaching dusk, full through the
 * night, ramps back down after dawn), mirroring shadowFor's own day-hump.
 */
function hump(h, from, to) {
  const span = ((to - from) + 24) % 24 || 24;
  const d = ((h - from) + 24) % 24;
  return d <= span ? Math.sin((Math.PI * d) / span) : 0;
}

/**
 * Per-kind light-cutout tuning. Adding a new kind of glowing thing (a
 * streetlamp, a flickering torch) is one entry here plus one light-point
 * pushed by whatever places it -- nothing else in the lighting layer changes.
 */
const GLOW_CURVES = {
  // Ordinary windows: on a little before dusk, off a little after dawn.
  window: { from: DUSK - 0.5, to: DAWN + 0.5, color: 0xffb877, intensity: 1.0 },
  // The cinema marquee, on its own timer -- switched on earlier than
  // residents turn their lights on, brighter once lit.
  //
  // **Warm gold, not pink.** This was `0xff4d6d` at intensity 1.7, reasoning
  // that the marquee should carry the street's one saturated accent -- but a
  // light's colour is not a material's colour. Red paint under a warm lamp is
  // still red; a *rose-coloured lamp* tints everything it reaches, and with
  // this one's radius that meant the facade, the pavement, the player and the
  // neighbouring buildings all went mauve, and the doorway blew out to a
  // magenta blob. The red stays where it belongs -- the doors, the stripes,
  // the board fields, all authored art -- and the light that falls on it is
  // the colour theatre bulbs actually are.
  marquee: { from: DUSK - 2, to: DAWN, color: 0xffb44a, intensity: 1.5 },
  // The lobby behind the entrance doors: the warmest, palest source on the
  // street and the only one that is a doorway rather than a lamp. Its own
  // kind so it can be a gentle wide wash (see lighting.js's RADIUS) instead
  // of borrowing a point source's falloff, which is what turned the entrance
  // into a hotspot before.
  lobby: { from: DUSK - 2, to: DAWN + 0.5, color: 0xffca7d, intensity: 1.2 },
  // Streetlamps: on a photocell, not a resident's hand -- a sharper, earlier
  // on/off than windows and the palest colour of the lamp kinds.
  streetlamp: { from: DUSK - 1, to: DAWN + 0.25, color: 0xffd89a, intensity: 1.2 },
  // A television through a window. The only cold light source on the street,
  // and the only one that flickers (see `flickers` below) -- both facts are
  // the point of it. Every other lit window on this street is tungsten, so a
  // single blue-white one in a row of amber ones reads instantly as a
  // different kind of evening happening behind that particular pane. Off
  // earlier than the rest come on, because someone sitting down in front of
  // the television does it before the street lights up, and off well before
  // dawn because they fall asleep.
  tv: { from: DUSK - 1.5, to: DAWN - 1.5, color: 0x8fb4ff, intensity: 0.85 },
};

/**
 * Light kinds whose brightness is not a pure function of the hour -- i.e. the
 * ones something has to drive per frame. Exported rather than a string
 * comparison at each call site so "which lights move" is one fact in one
 * place; both the shading layer (lighting.js) and the emission layer
 * (glow.js) ask this the same question and must agree, or a window's glow
 * would flicker while the wall it lights held perfectly still.
 * @param {string} kind
 */
export function flickers(kind) { return kind === 'tv'; }

/**
 * Brightness multiplier for a flickering light at a moment in time, ~0.5..1.
 *
 * Three sine waves at deliberately incommensurate frequencies, so the sum
 * never repeats on any period an eye can catch -- a single sine reads as a
 * pulse and a random number per frame reads as broken hardware, while this
 * reads as a picture changing. `phase` de-syncs one light from another, so a
 * street with two televisions in it does not have them showing the same
 * programme.
 *
 * @param {number} timeMs @param {number} phase any per-light constant
 */
export function flickerAt(timeMs, phase) {
  const t = timeMs / 1000 + phase;
  const w = 0.6 * Math.sin(t * 11.3) + 0.3 * Math.sin(t * 19.7) + 0.1 * Math.sin(t * 31.1);
  return 0.76 + 0.24 * w;
}

/**
 * @param {number} hours 0..24, wraps
 * @param {string} kind key into GLOW_CURVES; unknown kinds read as a window.
 * @returns {{ color: number, intensity: number }} intensity is 0 in full day.
 */
export function glowFor(hours, kind) {
  const cfg = GLOW_CURVES[kind] ?? GLOW_CURVES.window;
  const t = hump(wrapHour(hours), cfg.from, cfg.to);
  return { color: cfg.color, intensity: cfg.intensity * t };
}
