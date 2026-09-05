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

/** Falloff radius per light kind, in world px. Not hour-dependent, so it
 *  lives here rather than in sun.js's time-of-day curves. */
const RADIUS = { window: 56, marquee: 100, streetlamp: 76 };

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

  /** Packed 0xRRGGBB, for the smoke test and debug readouts. */
  get ambientColor() {
    if (!this.active) return 0xffffff;
    const c = this.scene.lights.ambientColor;
    return (Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255);
  }

  destroy() {
    if (this.active) this.scene.lights.disable();
  }
}
