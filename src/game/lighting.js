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
const RADIUS = { window: 110, marquee: 300, streetlamp: 220, lobby: 150, tv: 120, fixture: 110 };

/**
 * How close two lights of the same kind have to be before they are handed to
 * the shader as ONE light. 0 means never merge.
 *
 * This exists because of a hard limit in Phaser, not a preference of ours.
 * `LightsManager.getLights` culls to `render.maxLights` by sorting on distance
 * from the camera centre and slicing -- so a map with more on-screen lights
 * than the cap does not dim gracefully, it drops the far ones outright, and
 * *which* ones it drops changes as the camera moves. The dev map carries 44
 * lights against a cap of 16, which is why lights appeared to switch on as
 * the player walked up to them: 28 were off at any moment, and never the
 * same 28.
 *
 * Raising the cap alone does not fix it. Light.frag loops `0..kMaxLights` for
 * every fragment whether those lights exist or not, so the cost is the cap,
 * not the count -- 64 measurably cost frame pacing when it was tried. The
 * count has to come down.
 *
 * Merging is honest here because these lights were never individually
 * meaningful for SHADING: six lit windows along one facade wash the same
 * brick from the same direction, and at the radii above their pools overlap
 * almost entirely. What it would cost is per-window emission, and that is not
 * lost at all -- glow.js still draws one additive sprite per original light,
 * uncapped and cheap, so the street keeps a glow at every window while the
 * shader sees one light per facade. The two layers disagreeing about how many
 * lights exist is the point, not an inconsistency.
 *
 * `tv` is deliberately absent: two televisions merged into one would flicker
 * on a single phase, and the entire reason that kind exists is that it does
 * not hold still with its neighbours. `marquee` and `lobby` are absent
 * because there is only ever one of each per building.
 *
 * `streetlamp` is 0, and that one was tried and reverted. A lamp's position
 * is load-bearing in a way a window's is not: it decides which way the player
 * casts a shadow, and Light#illuminationAt is sampled continuously as they
 * walk so that the dominant source changes smoothly instead of popping. Merge
 * two lamps to their midpoint and both properties break -- the smoke suite
 * caught it immediately, as a 0.164 step in dominant-light strength and a
 * wall shadow thrown from a lamp that was no longer there. Lamp count is a
 * MAP problem, and the answer is to space them like a real street rather than
 * to average them together.
 */
const MERGE_DIST = { window: 400, fixture: 250, streetlamp: 0, marquee: 0, lobby: 0, tv: 0 };

/**
 * Ceiling on how far a merged light may grow its radius to cover its members.
 *
 * Uncapped, this over-reaches badly. Light2D's falloff holds near full
 * brightness across most of a light's radius, so a cluster spanning 200px
 * that grows its radius by the same 200px does not "cover the same ground" --
 * it floods a circle four times the area at nearly the same brightness. The
 * first attempt at merging did exactly that and lifted unlit pavement from
 * L=55 to L=117, washing out the whole warm/cool split the palette work was
 * for.
 *
 * So the ceiling is per kind, and the split is about what the cluster is
 * lighting rather than how big it is. A merged WINDOW cluster is the lit
 * windows of one facade and the surface it lights is that same facade -- it
 * is allowed to spread across the building, because that is exactly the wall
 * its members were lighting. A merged STREETLAMP cluster is not lighting one
 * object, it is standing in an open street, and every px of radius it gains
 * is spent flooding ground its members never reached; capped hard.
 *
 * Where a cluster stops, the ends of the run simply fall off, which is what
 * light does anyway, and the glow layer still marks every source individually
 * so nothing reads as unlit.
 */
const MERGE_RADIUS_BOOST_MAX = { window: 220, fixture: 90, streetlamp: 40, default: 48 };

/**
 * Greedy same-kind clustering. Order-dependent by nature -- a different input
 * order gives slightly different clusters -- which is fine, because the input
 * is a deterministic build-time derivation and not anything a player moves.
 *
 * A merged light sits at its members' centroid and grows its radius by how far
 * they spread, so the cluster still reaches everything its members reached.
 * @param {{x:number,y:number,gx?:number,gy?:number,kind:string}[]} points
 */
export function mergeForShading(points) {
  const clusters = [];
  for (const p of points) {
    const d = MERGE_DIST[p.kind] ?? 0;
    const near = d > 0 && clusters.find((c) => c.kind === p.kind
      && Math.hypot(c.members[0].x - p.x, c.members[0].y - p.y) <= d);
    if (near) near.members.push(p);
    else clusters.push({ kind: p.kind, members: [p] });
  }

  return clusters.map(({ kind, members }) => {
    if (members.length === 1) return { ...members[0], count: 1 };
    const n = members.length;
    const mean = (f) => members.reduce((a, m) => a + (m[f] ?? 0), 0) / n;
    const x = mean('x'), y = mean('y');
    const spread = Math.max(...members.map((m) => Math.hypot(m.x - x, m.y - y)));
    return {
      x, y, kind, count: n,
      gx: members[0].gx === undefined ? undefined : mean('gx'),
      gy: members[0].gy === undefined ? undefined : mean('gy'),
      radiusBoost: Math.min(spread, MERGE_RADIUS_BOOST_MAX[kind] ?? MERGE_RADIUS_BOOST_MAX.default),
    };
  });
}

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
    /**
     * Every derived source, unmerged. This is the SHADOW model, not the shader
     * input, and the distinction is load-bearing: `shadowSources` weights each
     * light by its own `illuminationAt` so the player's shadow turns smoothly
     * as they walk between two lamps, and that only works if the lights are
     * where the lamps actually are. Merging this list moved them, and the
     * smoke suite caught it twice over -- a 0.164 pop in dominant-light
     * strength, and a wall shadow thrown from a light that had drifted off
     * its lamp.
     * @type {Light[]}
     */
    this.lights = points.map((p) => new Light({
      x: p.x, y: p.y, groundX: p.gx, groundY: p.gy,
      radius: RADIUS[p.kind] ?? RADIUS.window, kind: p.kind,
    }));

    /** What the SHADER is given: same-kind neighbours collapsed together so the
     *  on-screen count stays under `render.maxLights` and Phaser never culls.
     *  Purely a budget for Light.frag -- nothing else reads it. */
    this._merged = mergeForShading(points);
    /** Light2D has no Canvas-renderer equivalent -- degrade to "no dynamic
     *  lighting" rather than throwing if WebGL was unavailable. */
    this.active = scene.renderer?.type === Phaser.WEBGL;
    this._bucket = null;
    /** @type {Phaser.GameObjects.Light[]} the live Light2D instance backing
     *  each entry in `this.lights`, same index. Kept in sync in setHours. */
    this._phaserLights = [];

    if (!this.active) return;
    scene.lights.enable();
    this._phaserLights = this._merged.map((m) => scene.lights.addLight(
      m.x, m.y, (RADIUS[m.kind] ?? RADIUS.window) + (m.radiusBoost ?? 0), 0xffffff, 0));

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
    cam.postFX.addVignette(0.5, 0.5, 0.9, 0.18);
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
    // The two lists are independent now, and both are pure functions of the
    // hour and the kind, so neither needs to know the other's indexing.
    for (const light of this.lights) {
      const { color, intensity } = glowFor(hours, light.kind);
      light.setColor(color).setIntensity(intensity);
    }
    this._merged.forEach((m, i) => {
      const { color, intensity } = glowFor(hours, m.kind);
      this._phaserLights[i].setColor(color).setIntensity(intensity);
    });
    // Re-derived here because setHours has just overwritten every intensity
    // with its steady value -- see `_flickering`.
    // Flickering kinds are never merged (see MERGE_DIST), so each one still
    // has exactly one shader light, findable by position.
    this._flickering = this.lights
      .filter((light) => flickers(light.kind) && light.intensity > 0)
      .map((light) => ({
        light,
        phaser: this._phaserLights[this._merged.findIndex(
          (m) => m.kind === light.kind && m.x === light.x && m.y === light.y)],
        base: light.intensity,
        phase: (light.x * 0.013 + light.y * 0.029) % 10,
      }))
      .filter((e) => e.phaser);
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

  /** How many lights were derived, and how many the shader actually sees
   *  after merging -- the second number is the one that must stay under
   *  `render.maxLights`. For the smoke test and the dev HUD. */
  get lightCounts() { return { derived: this.lights.length, shaded: this._merged.length }; }

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
