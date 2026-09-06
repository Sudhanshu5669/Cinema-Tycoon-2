// Scene lighting -- SYSTEMS #8, the fourth Eastward discipline.
//
// This wires Phaser's own WebGL 'Light2D' pipeline -- a real per-fragment
// shader, ambient colour plus up to `render.maxLights` colour point lights
// with radial falloff (node_modules/phaser/src/renderer/webgl/shaders/src/
// Light.frag) -- to the same hour-of-day model the cast-shadow layer already
// uses (tilemap/sun.js). Nothing here hand-rolls GLSL; the point of using
// Phaser's own pipeline rather than a bespoke one is that lights are just
// data from here on -- add one, move one every frame, recolour one, and the
// shader side needs no changes. That is what makes this the base to actually
// grow the look later (more lights, flicker, a lantern that follows the
// player) rather than a one-off effect.
//
// Every light source in the scene is a `Light` (light.js) -- the same object
// whether it's a window, the marquee, a streetlamp, or anything added later.
// This module owns two things built on top of that: turning a `Light` into a
// live Phaser Light2D instance and keeping it in sync with the hour, and
// answering "which lights are actually touching this point right now" for
// the shadow layer -- see shadowSources.
//
// Normal maps *are* bound -- the tile atlas ships one derived from the same
// authored grids as the diffuse art (tools/normals.mjs), and atlas.js carries
// it through every bake -- so a light here shades real relief rather than only
// tinting flat colour. The relief is deliberately shallow and hard-edged: a
// mortar groove, a cornice lip, a marquee bulb. Anything that isn't a
// structural edge stays flat.
//
// Light *sources* -- which windows glow, where the marquee sits -- are data
// the tile renderer already has (facade window tiles, the awning) and derives
// once at build time; this module only owns turning that into live Phaser
// Light objects and keeping them in sync with the hour.

import Phaser from 'phaser';
import { ambientFor, glowFor, flickers, flickerAt } from './tilemap/sun.js';
import { Light } from './light.js';

const { LIGHT_PIPELINE } = Phaser.Renderer.WebGL.Pipelines;

/**
 * Falloff radius per light kind, in world px. Not hour-dependent, so it lives
 * here rather than in sun.js's time-of-day curves.
 *
 * Deliberately large relative to the bulb itself. Light2D's falloff --
 * `1 - d²/r²`, see Light.frag -- holds close to full brightness for most of
 * its radius and only drops away sharply right near the edge, so a *small*
 * radius (sized to "how far should this visibly reach") reads exactly like
 * what the user reported: a flat, crisply-bordered disc, because nearly the
 * whole visible falloff happens in a thin ring at that edge. A radius several
 * times the visible glow's real extent pushes that steep part of the curve
 * out past where the light is still bright enough to matter, so what's left
 * on screen is only the gentle, near-flat *start* of the curve -- a soft
 * taper instead of a rim. Center brightness is intensity-only (attenuation is
 * always 1 at d=0), so this costs nothing there; it only changes how the
 * edge feels. The overlap this creates between neighbouring lights (windows
 * a few tiles apart) is itself part of the fix -- a lit street should read as
 * a soft continuous wash along a facade, not a row of isolated dots.
 *
 * `streetlamp` is disproportionately larger than the other two for exactly
 * that reason in reverse: a lamp usually stands with no neighbour close
 * enough to overlap and blend its edge away, so it alone needs a big enough
 * radius to go soft on its own.
 */
const RADIUS = { window: 110, marquee: 190, streetlamp: 220, lobby: 150, tv: 120 };

/**
 * Opts one drawable into the lighting shader. Safe to call unconditionally --
 * a no-op under the Canvas renderer, which has no Light2D pipeline to bind.
 * @param {Phaser.GameObjects.GameObject} gameObject
 */
export function wireLight(gameObject) {
  if (gameObject.scene?.renderer?.type === Phaser.WEBGL) gameObject.setPipeline(LIGHT_PIPELINE);
  return gameObject;
}

export class LightingLayer {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x: number, y: number, gx?: number, gy?: number, kind: string}[]} points
   *   world-space light sources, e.g. from TileMapRenderer's derived
   *   window/marquee/streetlamp anchors. `gx, gy` is the ground anchor (see
   *   Light) -- omitted for a light at street level already.
   */
  constructor(scene, points) {
    this.scene = scene;
    /** @type {Light[]} the one object model every light in the scene is
     *  built from -- see light.js. */
    this.lights = points.map((p) => new Light({
      x: p.x, y: p.y, groundX: p.gx, groundY: p.gy,
      radius: RADIUS[p.kind] ?? RADIUS.window, kind: p.kind,
    }));
    /** Light2D has no Canvas-renderer equivalent -- degrade to "no dynamic
     *  lighting" rather than throwing if WebGL was unavailable. */
    this.active = scene.renderer?.type === Phaser.WEBGL;
    this._bucket = null;
    /** @type {Phaser.GameObjects.Light[]} the live Light2D instance backing
     *  each entry in `this.lights`, same index. Kept in sync in setHours. */
    this._phaserLights = [];

    if (!this.active) return;
    scene.lights.enable();
    this._phaserLights = this.lights.map((l) => scene.lights.addLight(l.x, l.y, l.radius, 0xffffff, 0));

    // Camera-wide post FX -- impacts everything the camera renders, so this
    // is the one place that needs to set it up, not every scene that builds a
    // TileMapRenderer. Bloom (the effect that actually feathers a light's
    // edge by blurring and re-adding bright pixels) was tried here and pulled
    // back out: even at its cheapest settings it measurably cut real-time
    // frame pacing enough to flake the walk-speed smoke checks, the same
    // shape of regression #8's maxLights lesson already burned once on --
    // and GAME_SPEC targets mobile, where that cost is even less affordable.
    // A single cheap Vignette stays (a steady darkening toward the screen
    // edges, day or night, purely for framing) since it did not cost the
    // same. The edge-softening job Bloom would have done is instead paid for
    // entirely by the wider RADIUS values above, which cost nothing extra.
    const cam = scene.cameras.main;
    cam.postFX.clear();
    cam.postFX.addVignette(0.5, 0.5, 0.82, 0.25);
  }

  /** @param {number} hours 0..24, wraps */
  setHours(hours) {
    if (!this.active) return;
    // Same ~0.05h bucket as ShadowLayer -- cheap once the hour settles, since
    // both the ambient colour and every light's colour/intensity are pure
    // functions of the hour, not accumulated state.
    const bucket = Math.round(hours * 20);
    if (bucket === this._bucket) return;
    this._bucket = bucket;

    this.scene.lights.setAmbientColor(ambientFor(hours));
    this.lights.forEach((light, i) => {
      const { color, intensity } = glowFor(hours, light.kind);
      light.setColor(color).setIntensity(intensity);
      this._phaserLights[i].setColor(color).setIntensity(intensity);
    });
    // Re-derived here because setHours has just overwritten every intensity
    // with its steady value -- see `_flickering`.
    this._flickering = this.lights
      .map((light, i) => ({ light, phaser: this._phaserLights[i], base: light.intensity, phase: (light.x * 0.013 + light.y * 0.029) % 10 }))
      .filter((e) => flickers(e.light.kind) && e.base > 0);
  }

  /**
   * Per-frame brightness for the lights that have any -- only the flickering
   * ones, which on this street is a couple of televisions. Everything else
   * stays a pure function of the hour and is not touched here, which is what
   * keeps setHours' bucket optimisation worth having.
   *
   * The `Light` object is updated alongside its live Phaser light, not just
   * the Phaser one, because `shadowSources` reads `illuminationAt` off the
   * former -- letting them drift would mean a shadow cast by a brightness the
   * screen is not currently showing.
   *
   * @param {number} timeMs
   */
  update(timeMs) {
    if (!this.active) return;
    for (const e of this._flickering ?? []) {
      const v = e.base * flickerAt(timeMs, e.phase);
      e.light.setIntensity(v);
      e.phaser.setIntensity(v);
    }
  }

  /**
   * Every light currently illuminating (px, py) at all, each carrying its
   * own continuous strength there (Light#illuminationAt) -- for casting the
   * player's own shadow away from them at night. Deliberately not a "nearest
   * N" ranking: real light doesn't pick a winner between sources, every one
   * that reaches a point casts that point's shadow on its own, weighted only
   * by its own strength there. A ranked cutoff has to reassign discretely
   * the moment a third light overtakes the second, and every reassignment is
   * a visible pop; weighting by illumination instead means a light's
   * contribution is already ~0 right where a rank-based cutoff would
   * otherwise have to switch it off, so nothing pops. In practice this is a
   * small list -- only lights whose radius actually reaches the point at
   * all qualify -- so no cap is needed for it to stay cheap.
   * @param {number} px @param {number} py
   * @returns {{light: Light, strength: number}[]}
   */
  shadowSources(px, py) {
    if (!this.active) return [];
    return this.lights
      .filter((l) => l.castsShadow)
      .map((light) => ({ light, strength: light.illuminationAt(px, py) }))
      .filter((s) => s.strength > 0.01)
      // Strongest first -- a convenience for callers that want "the
      // dominant one", not a cutoff: every entry above is still returned,
      // nothing is excluded by this ordering.
      .sort((a, b) => b.strength - a.strength);
  }

  /** Packed 0xRRGGBB, for the smoke test and debug readouts. */
  get ambientColor() {
    if (!this.active) return 0xffffff;
    const c = this.scene.lights.ambientColor;
    return (Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255);
  }

  destroy() {
    if (!this.active) return;
    this.scene.lights.disable();
    this.scene.cameras.main.postFX.clear();
  }
}
