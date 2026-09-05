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
// No normal maps are bound, so every surface reads as flat-facing-the-camera
// (Phaser's own default __NORMAL texture) -- consistent with this project's
// no-shading-pass flat art; a light still falls off with distance and tints
// with colour, it just never carves fake bump detail into flat pixel art.
//
// Light *sources* -- which windows glow, where the marquee sits -- are data
// the tile renderer already has (facade window tiles, the awning) and derives
// once at build time; this module only owns turning that into live Phaser
// Light objects and keeping them in sync with the hour.

import Phaser from 'phaser';
import { ambientFor, glowFor } from './tilemap/sun.js';

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
const RADIUS = { window: 110, marquee: 170, streetlamp: 220 };

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
   * @param {{x: number, y: number, kind: string}[]} points world-space light
   *   sources, e.g. from TileMapRenderer's derived window/marquee anchors.
   */
  constructor(scene, points) {
    this.scene = scene;
    this.points = points;
    /** Light2D has no Canvas-renderer equivalent -- degrade to "no dynamic
     *  lighting" rather than throwing if WebGL was unavailable. */
    this.active = scene.renderer?.type === Phaser.WEBGL;
    this._bucket = null;
    this.lights = [];

    if (!this.active) return;
    scene.lights.enable();
    this.lights = points.map((p) =>
      scene.lights.addLight(p.x, p.y, RADIUS[p.kind] ?? RADIUS.window, 0xffffff, 0));

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
    this.points.forEach((p, i) => {
      const { color, intensity } = glowFor(hours, p.kind);
      this.lights[i].setColor(color).setIntensity(intensity);
    });
  }

  /**
   * The nearest lit point lights to (px, py), for casting the player's own
   * shadow away from them at night -- a point light, unlike the sun, has a
   * position, so which way the player's shadow falls depends on where they
   * happen to be standing relative to it, not one shared angle for the whole
   * scene. Only lights actually lit right now (intensity > 0, e.g. not a
   * window at noon) and close enough to matter (inside their own radius --
   * beyond it, a light isn't lighting the player, so it has no business
   * casting their shadow either) are candidates.
   * @param {number} px @param {number} py
   * @param {number} [maxCount=2] how many lights may shadow the player at
   *   once -- capped low since this runs every frame the player moves.
   * @returns {{x:number, y:number, intensity:number, radius:number, dist:number}[]}
   *   nearest first.
   */
  shadowSources(px, py, maxCount = 2) {
    if (!this.active) return [];
    return this.points
      .map((p, i) => {
        const light = this.lights[i];
        return { x: p.x, y: p.y, intensity: light.intensity, radius: light.radius,
          dist: Math.hypot(p.x - px, p.y - py) };
      })
      .filter((s) => s.intensity > 0.05 && s.dist < s.radius)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, maxCount);
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
