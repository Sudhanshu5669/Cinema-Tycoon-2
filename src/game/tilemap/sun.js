// A cheated sun for the cast-shadow layer.
//
// The real day/night clock is SYSTEMS #16 and the coloured day/evening light
// overlay is #8; this module answers one narrow question: given the hour and
// how tall a thing is, what 2D offset and opacity is the shadow it drops on the
// street?
//
// The cheat: a sun placed where the real one would be spends the middle of the
// day roughly south of a northern-hemisphere street, so its shadows fall north
// -- away from the camera, behind the buildings, invisible. So the sun here is
// kept low and behind the viewer all day: shadows always rake south across the
// pavement where they can be seen, and only their direction (south-west in the
// morning, near-straight-down at noon, south-east in the evening) and their
// length (long at the ends of the day, short at noon) change with the hour.
// Evening -- sun in the west -- is also when the cast shadow agrees with the
// west-lit flat tiles; the morning half hour disagrees with them, which is a
// job for the #8 light pass, not this.

const DAWN = 6;
const DUSK = 18;

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
