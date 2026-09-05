// A single light source -- position, colour, radius/intensity, and (if it
// casts one) a ground anchor for shadow purposes.
//
// This is the one object every kind of light in this game is built from --
// a window, the marquee, a streetlamp, or anything added later (a torch, a
// lantern the player carries) -- by choosing its constructor options, not by
// adding a new special case somewhere in the renderer or the shadow code.
// Modelled on Godot's own Light2D: colour and an intensity ("energy" there)
// blended additively, plus a falloff radius -- see
// https://docs.godotengine.org/en/stable/classes/class_light2d.html.
//
// The shadow half is modelled on how real multiple light sources actually
// behave, not on picking "the nearest one": every light that reaches a point
// casts that point's shadow on its own, independently, its own strength set
// only by how strongly *that* light illuminates the point there -- never by
// which lights rank nearest to it. That is what keeps the result continuous
// as something moves. A ranked cutoff ("the 2 closest lights shadow you")
// has to reassign discretely the moment a third light overtakes the second,
// and every reassignment is a visible pop -- shadows jumping between
// directions in a couple of pixels of movement. Weighting by each light's
// own illumination instead means a light's contribution is already ~0 right
// where it would otherwise have to switch off, so there is no seam to see.

export class Light {
  /**
   * @param {number} x @param {number} y where the light actually is (a
   *   streetlamp's bulb, say) -- what its radius and falloff are centred on.
   * @param {number} [groundX] @param {number} [groundY] the light's ground
   *   contact point, for shadow direction -- a streetlamp's bulb sits well
   *   above its own base, and using its elevated (x, y) as if that were
   *   where it stood on the ground biases every shadow it casts toward
   *   wherever the fixture happens to be tall. Defaults to (x, y) for a
   *   light with no meaningful elevation (a window, at street level).
   * @param {number} [radius=100] world px; illumination and shadow strength
   *   both reach exactly 0 here, continuously -- see illuminationAt.
   * @param {number} [color=0xffffff] 0xRRGGBB
   * @param {number} [intensity=1] scales illuminationAt's peak (at the
   *   light's own centre); 0 turns the light fully off without removing it.
   * @param {string} [kind='point'] a label, not a special case -- callers
   *   may use it to look up their own per-kind defaults (radius, an
   *   hour-of-day colour/intensity curve, ...), this class never branches
   *   on it.
   * @param {boolean} [castsShadow=true] set false for a light that should
   *   illuminate but never throw anyone's shadow (rarely wanted, but a
   *   customization this object should support rather than silently deny).
   */
  constructor({
    x, y, groundX, groundY, radius = 100, color = 0xffffff, intensity = 1,
    kind = 'point', castsShadow = true,
  }) {
    this.x = x;
    this.y = y;
    this.groundX = groundX ?? x;
    this.groundY = groundY ?? y;
    this.radius = radius;
    this.color = color;
    this.intensity = intensity;
    this.kind = kind;
    this.castsShadow = castsShadow;
  }

  setColor(color) { this.color = color; return this; }
  setIntensity(intensity) { this.intensity = intensity; return this; }

  /**
   * How strongly this light illuminates world point (px, py): 0..(peak
   * `intensity`), continuous, reaching exactly 0 at `radius` and never
   * beyond it. The same falloff shape Phaser's own Light2D shader uses
   * (`1 - d²/r²`, see node_modules/phaser/src/renderer/webgl/shaders/src/
   * Light.frag) -- deliberately, so a shadow this light casts always tracks
   * what the eye actually sees glowing, not a second, separately-invented
   * curve that could disagree with it.
   */
  illuminationAt(px, py) {
    if (this.intensity <= 0) return 0;
    const d2 = (px - this.x) ** 2 + (py - this.y) ** 2;
    const r2 = this.radius * this.radius;
    if (d2 >= r2) return 0;
    return (1 - d2 / r2) * this.intensity;
  }

  /**
   * Unit direction from this light's ground anchor toward (px, py) -- i.e.
   * the way a shadow at that point falls, away from the light. Never
   * exactly (0, 0): a point sitting exactly on the anchor has no meaningful
   * shadow direction, so this returns an arbitrary but stable fallback
   * rather than a divide-by-zero.
   */
  directionFrom(px, py) {
    const dx = px - this.groundX, dy = py - this.groundY;
    const d = Math.hypot(dx, dy);
    if (d < 1e-3) return { x: 0, y: 1 };
    return { x: dx / d, y: dy / d };
  }
}
