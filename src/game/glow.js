// Additive emission -- the half of lighting Light2D structurally cannot do.
//
// SYSTEMS #8's LightingLayer *shades* surfaces: it multiplies what is already
// drawn by an ambient colour and adds each light's contribution to the pixels
// that light reaches. That is the right model for "how lit is this brick",
// and it is the entire model Phaser's Light2D pipeline has. What it cannot
// express is emission -- light in the air between the source and the eye. A
// marquee bulb can be the brightest material in the palette (TILE_PALETTE's
// `*`, #fff2d2) and it will still never put a single photon outside its own
// eight pixels, because nothing in a shading model ever writes to a pixel a
// light does not land on. So a night street built only from shading reads as
// "correctly lit surfaces" and never as "things that are giving off light",
// which is the gap against the reference frame: there, every lamp drops a
// pool on the pavement, the marquee washes the brick around itself, and the
// doorway spills across the threshold.
//
// The obvious fix is Bloom, and it is the wrong one here: a camera-wide post
// pass re-blurs the entire frame every frame to recover information the
// renderer already had for free, and lighting.js records what that cost --
// measurably worse frame pacing, enough to flake the walk-speed smoke checks,
// on a project whose spec targets mobile.
//
// This is the cheap, static equivalent, and it exploits the thing a post pass
// cannot know: we already know exactly where every light is, because
// TileMapRenderer derived them (a window's face position, a lamp's bulb, the
// awning) at build time. So each one gets one pre-baked radial sprite drawn
// with ADD blending, and the whole layer costs one textured quad per light
// with no per-frame work beyond a tint when the hour bucket changes. The
// gradient texture is baked once *per kind*, not per light -- a street of
// seventeen streetlamps shares one 192px texture between them.
//
// Deliberately NOT on the Light2D pipeline (no wireLight call anywhere in
// this file). Emission is not a surface: a glow that got multiplied by the
// ambient would dim exactly when night made it matter.

import Phaser from 'phaser';
import { glowFor, flickers, flickerAt } from './tilemap/sun.js';
import { DEPTH_SHADOW } from './tilemap/projection.js';

/**
 * Visible extent of each kind's glow, in world px -- deliberately *not*
 * lighting.js's RADIUS values, and the difference is worth stating because
 * the two tables look like they should agree and must not.
 *
 * Those radii are oversized on purpose: Light2D's `1 - d²/r²` falloff holds
 * near full brightness for most of its radius and collapses in a thin ring at
 * the edge, so the fix for "this light has a visible rim" is to push that rim
 * far outside where the light is still bright enough to see. Here the falloff
 * is ours (see `bakeGradient`) and is already soft everywhere, so the radius
 * means what it says: how far the glow actually reaches. Feeding a shading
 * radius into an additive sprite would wash the whole street flat.
 */
const RADIUS = { window: 48, marquee: 118, streetlamp: 78, lobby: 80, tv: 54 };

/**
 * Peak alpha at the source, before the hour's own intensity scales it. Low,
 * and lower than it looks like it should be: these are ADD-blended, so
 * overlapping glows sum, and a street of lamps at the alpha one lamp wants in
 * isolation turns the pavement between them into flat cream. `lobby` is the
 * lowest of the four despite being the brightest thing on the street, because
 * the doorway's spill is already *drawn* -- renderer.js bakes a warm alcove
 * and lit reveals into the facade itself -- and an additive wash on top of
 * authored art that already says "lit" only erases the art. The marquee is
 * the one allowed to dominate, because that is what a lit marquee does.
 */
const PEAK = { window: 0.16, marquee: 0.24, streetlamp: 0.21, lobby: 0.13, tv: 0.19 };

/**
 * How far a light can sit above its own ground anchor before it stops
 * pooling on the pavement, in world px. Not a per-kind table on purpose: the
 * ground pool is a physical consequence of the light being near the ground,
 * and the renderer already records both numbers (`y` is the bulb, `gy` its
 * contact with the street), so this falls out of the data instead of being
 * asserted about each kind by hand. A streetlamp's bulb sits ~42px up and
 * pools strongly; a doorway at street level pools hardest of all; a marquee
 * four tiles up pools weakly; anything above the second storey pools not at
 * all, which is correct -- upper windows do not light the pavement.
 *
 * Six tiles, and the first value here was more than twice that, which the
 * smoke check ("only lights near the ground pool") caught doing exactly
 * nothing: at 150px even a seventh-storey window still cleared the cutoff, so
 * every light in the scene drew a ground pool and the rule this constant
 * exists to express was never actually deciding anything.
 */
const POOL_FADE = 96;

/** Vertical squash of a ground pool. The ground plane is seen at 3/4, so a
 *  circle of light lying flat on it is an ellipse on screen; drawing it round
 *  makes the light read as a ball floating at the lamp's foot. */
const POOL_SQUASH = 0.42;

/** Ground pools sit above the cast-shadow layer -- a lamp's own light falls
 *  *onto* the shadows around it -- but below every y-sorted structure and the
 *  player, both of which stand on the pavement the pool is painted on. */
const DEPTH_POOL = DEPTH_SHADOW + 2;

/**
 * Alpha profile of the baked sprite, 0..1 across the radius. A gaussian
 * shoulder rather than Light2D's `1 - d²/r²`: that curve is nearly flat for
 * most of its range and then falls off a cliff, which is exactly the shape
 * that reads as a disc with a rim. This one starts falling immediately and
 * approaches zero asymptotically, so there is no edge anywhere to see, and
 * the small pedestal it would otherwise leave at r=1 is subtracted off so the
 * sprite genuinely reaches zero at its own boundary rather than ending on a
 * faint visible square.
 */
function profile(t) {
  const k = 5.0;
  const tail = Math.exp(-k);
  return Math.max(0, (Math.exp(-k * t * t) - tail) / (1 - tail));
}

/**
 * One white radial-gradient texture for a kind, baked once and shared by
 * every light of that kind. White, not the light's colour: the per-light tint
 * carries colour, so an hour change is a tint write rather than a re-bake.
 *
 * Exported because the marquee bulb chase (tilemap/chase.js) wants exactly
 * this sprite at a much smaller radius, and a second copy of the falloff
 * would be a second falloff to keep in agreement with this one.
 */
export function bakeGradient(scene, key, radius) {
  if (scene.textures.exists(key)) return key;
  const size = Math.ceil(radius) * 2;
  const canvas = scene.textures.createCanvas(key, size, size);
  const ctx = canvas.getContext();
  const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  const STOPS = 24;
  for (let i = 0; i <= STOPS; i++) {
    const t = i / STOPS;
    grad.addColorStop(t, `rgba(255,255,255,${profile(t).toFixed(4)})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  return key;
}

export class GlowLayer {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x: number, y: number, gx?: number, gy?: number, kind: string}[]} points
   *   the same light-source list LightingLayer is built from -- passed to
   *   both rather than derived twice, so a light can never shade a wall
   *   without also glowing, or the reverse.
   */
  constructor(scene, points) {
    this.scene = scene;
    this.active = scene.renderer?.type === Phaser.WEBGL;
    this._bucket = null;
    /** Global multiplier on every glow's alpha. 1 is as authored; the dev
     *  menu drives it so the layer can be tuned against a live scene rather
     *  than by editing PEAK and reloading. */
    this.strength = 1;
    this.enabled = true;
    /** @type {{halo: Phaser.GameObjects.Image, pool: Phaser.GameObjects.Image|null, kind: string, peak: number}[]} */
    this.glows = [];
    if (!this.active) return;

    for (const p of points) {
      const kind = p.kind in RADIUS ? p.kind : 'window';
      const radius = RADIUS[kind];
      const key = bakeGradient(scene, `glow-${kind}`, radius);
      const gx = p.gx ?? p.x, gy = p.gy ?? p.y;

      // The halo sits just in front of whatever surface the light is mounted
      // on -- a facade light's ground row, a lamp's own base -- so it washes
      // over that surface but still sorts behind a player standing south of
      // it. Using DEPTH_OVERHEAD instead (the obvious choice for "draw the
      // glow last") puts a doorway's spill on top of the player standing in
      // the doorway.
      const halo = scene.add.image(p.x, p.y, key)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(gy + 0.6)
        .setVisible(false);

      // Elevation above the ground anchor decides the pool, not the kind --
      // see POOL_FADE.
      const lift = Math.max(0, gy - p.y);
      const poolStrength = Math.max(0, 1 - lift / POOL_FADE);
      let pool = null;
      if (poolStrength > 0.02) {
        pool = scene.add.image(gx, gy, key)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(DEPTH_POOL)
          .setVisible(false);
        pool.setDisplaySize(radius * 2, radius * 2 * POOL_SQUASH);
      }

      this.glows.push({
        halo, pool, kind, peak: PEAK[kind], poolStrength,
        // De-syncs one flickering light from the next. Derived from position
        // so it is stable across a reload rather than random -- a scene that
        // looks subtly different every time it boots is a scene nobody can
        // review against a screenshot.
        phase: (p.x * 0.013 + p.y * 0.029) % 10,
        base: 0,
      });
    }
  }

  /**
   * @param {number} hours 0..24, wraps. Same ~0.05h bucket as LightingLayer
   *   and ShadowLayer: colour and intensity are pure functions of the hour,
   *   so nothing needs recomputing until it moves.
   */
  setHours(hours) {
    if (!this.active) return;
    const bucket = Math.round(hours * 20);
    if (bucket === this._bucket) return;
    this._bucket = bucket;

    for (const g of this.glows) {
      const { color, intensity } = glowFor(hours, g.kind);
      const a = g.peak * intensity * this.strength;
      // Hidden rather than alpha-0 in full daylight: an invisible object is
      // skipped before it reaches the batch at all, so the whole layer costs
      // literally nothing for the two thirds of the day it is switched off.
      const on = this.enabled && a > 0.004;
      g.halo.setVisible(on);
      g.pool?.setVisible(on);
      if (!on) continue;
      g.halo.setTint(color).setAlpha(a);
      // A pool is light landing on stone at a glancing angle, not the source
      // itself -- it never gets to be as bright as the halo, however close to
      // the ground its source sits.
      g.pool?.setTint(color).setAlpha(a * g.poolStrength * 0.55);
      // Steady brightness for this hour, kept so `update` can modulate around
      // it without accumulating drift frame over frame.
      g.base = a;
    }
    this._flickering = this.glows.filter((g) => flickers(g.kind) && g.base > 0);
  }

  /**
   * Per-frame brightness for the flickering glows only -- everything else on
   * this layer is a pure function of the hour and is left alone, so a street
   * with no televisions on it does no per-frame work at all.
   * @param {number} timeMs
   */
  update(timeMs) {
    if (!this.active) return;
    for (const g of this._flickering ?? []) {
      const v = g.base * flickerAt(timeMs, g.phase);
      g.halo.setAlpha(v);
      g.pool?.setAlpha(v * g.poolStrength * 0.55);
    }
  }

  /** Re-apply at the current hour. `setHours` short-circuits on an unchanged
   *  hour bucket, so anything that changes what an hour *means* -- strength,
   *  enabled -- has to clear that memo or the change lands on the next hour
   *  the player happens to cross and not before. */
  refresh(hours) { this._bucket = null; this.setHours(hours); }

  destroy() {
    for (const g of this.glows) { g.halo.destroy(); g.pool?.destroy(); }
    this.glows.length = 0;
  }
}
