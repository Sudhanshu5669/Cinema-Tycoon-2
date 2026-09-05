// The cast-shadow layer for the tile renderer.
//
// Two kinds of caster, because "swept footprint" only looks right for one
// kind of object:
//
// - Box casters (buildings, platforms): a ground footprint rect plus a
//   silhouette height. For a given hour, sun.js turns the height into a 2D
//   offset; the shadow is that footprint swept along the offset -- the convex
//   hull of the rect and its translated copy. This is a good model exactly
//   because these things really do fill their plan footprint at every height.
// - Sprite casters (streetlamps, and anything else too thin or irregular to
//   have a meaningful footprint rect -- a swept BOX for a one-pixel-wide pole
//   reads as a filled slab dragged sideways, wildly heavier than the object
//   casting it): the shadow instead follows the sprite's own alpha silhouette,
//   sheared and scaled by the same per-hour offset -- see _spriteShadow.
//
// Every shadow -- of either kind -- is painted solid black into one offscreen
// canvas and shown as a single Image whose alpha is the day's shadow opacity:
// baking a flat mask and fading it once is what stops overlapping shadows from
// stacking into double-dark seams where buildings meet.
//
// A shadow's hull is computed in ground coordinates -- the same footprint every
// caster shares -- so it paints straight onto the ground plane. But a roof cap
// or a raised platform's top is drawn shifted (and, for a foreshortened roof,
// squashed) relative to that same footprint, so a hull painted only on the
// ground can never visually land on one: the elevated surface's image, at a
// much higher depth, simply sits in front of it. Every such surface gets its
// own small baked layer: any *other* caster's hull is clipped to that surface's
// footprint, then carried through the same footprint -> screen transform its
// own top image uses, so a tall neighbour's shadow correctly darkens a shorter
// roof or a nearby raised platform. A surface excludes its own caster index --
// otherwise it would always contain its own unshifted footprint and paint
// itself solid black on every frame.
//
// The bake is throttled to ~0.05h steps, so even a fast day/night cycle only
// redraws the canvases a few times a second.
//
// The player is a third kind of caster, and deliberately not baked into the
// same canvas as the other two: it moves every frame, while buildings,
// platforms and streetlamps never do. Repainting the whole world-sized
// static canvas on every step the player takes would redo all of that
// unmoving work for nothing. Instead updatePlayer() owns one small canvas,
// just big enough for the longest shadow the player can throw, recentred on
// the player each time -- so redrawing it costs a couple of drawImage calls
// on a few hundred px of canvas, not the whole map. It draws two kinds of
// shadow, both reusing the same sprite-silhouette + shear technique as a
// streetlamp: one from the sun (shadowFor, the same shared angle everything
// else uses, live only while the sun actually casts one) and up to a
// couple more from whichever point lights (LightingLayer#shadowSources) are
// currently close enough to be lighting the player at all -- a light has its
// own position, so unlike the sun, the direction is different every time the
// player moves relative to it, and more than one nearby lamp can each throw
// their own shadow, exactly as real point-source light does.

import { DEPTH_SHADOW } from './projection.js';
import { shadowFor } from './sun.js';

/** Half-size of the player's own shadow canvas, world px. Comfortably past
 *  the longest shadow either the sun or a point light throws below (a sun
 *  shadow tops out around 2.6x the caster's height -- SPRITE_H is 48 -- and
 *  point-light shadows are capped well under that, see PLIGHT_MAX_LEN). */
const PLAYER_SHADOW_REACH = 130;
/** Point-light player shadows: length range (px) from a light's edge (dim,
 *  short) to standing right on top of it (bright, long) -- see updatePlayer. */
const PLIGHT_MIN_LEN = 14;
const PLIGHT_MAX_LEN = 70;
/** Minimum southward (toward-camera) component of a point-light shadow's own
 *  unit direction -- the same deliberate cheat sun.js's own header already
 *  explains for the sun ("kept low and behind the viewer all day: shadows
 *  always rake south... where they can be seen"). A point light doesn't get
 *  to cheat its position the way sun.js cheats the sun's, but the shadow it
 *  throws still has to read in this 3/4 view: without this floor, a light
 *  exactly level with the player (ordinary the moment a light has its own
 *  position instead of one shared angle -- walking any lit street puts you
 *  level with a lamp constantly) casts a shadow with no reach into the
 *  screen at all, a degenerate sliver rather than a believable shape. */
const PLIGHT_MIN_SOUTH = 0.35;

export class ShadowLayer {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ rect: {x:number,y:number,w:number,h:number}, heightPx:number }[]} casters
   *   Box casters -- buildings, platforms. Swept-hull shadows.
   * @param {{ x:number, y:number, textureKey:string, frameName:string, heightPx:number }[]} spriteCasters
   *   Sprite casters -- streetlamps and the like. `x, y` is the same ground
   *   anchor the sprite's own image uses (origin 0.5, 1 -- base, horizontally
   *   centred). Shadow follows that frame's alpha silhouette, not a synthetic
   *   footprint. Not clipped onto `surfaces` below -- a low ground prop's
   *   shadow reaching a neighbouring roof or platform top isn't a case this
   *   project has hit yet, so that catching logic stays box-caster-only.
   * @param {{ footprint: {x:number,y:number,w:number,h:number},
   *           screen: {x:number,y:number,w:number,h:number},
   *           depth: number, casterIndex: number }[]} surfaces
   *   Every roof cap and raised platform top a neighbouring *box* caster's
   *   shadow might land on. `footprint` is in the same ground space as a
   *   caster's `rect`; `screen` is where that surface is actually drawn -- a
   *   plain shift for a platform top, shifted-and-squashed for a
   *   foreshortened roof.
   * @param {number} worldW @param {number} worldH
   */
  constructor(scene, casters, spriteCasters, surfaces, worldW, worldH) {
    this.scene = scene;
    this.casters = casters;
    this.spriteCasters = spriteCasters;
    this.surfaces = surfaces;
    this.w = worldW;
    this.h = worldH;
    /** frameKey -> {canvas, w, h} solid-black-silhouette cache, built lazily
     *  and shared across every instance of the same sprite (every streetlamp
     *  reuses one 'tiles:lampPost' silhouette, not one each). */
    this._silhouettes = new Map();
    this.key = `shadowbake-${scene.sys.settings.key}`;
    if (scene.textures.exists(this.key)) scene.textures.remove(this.key);
    this.canvas = scene.textures.createCanvas(this.key, worldW, worldH);
    this.image = scene.add.image(0, 0, this.key).setOrigin(0, 0).setDepth(DEPTH_SHADOW);

    // One small baked canvas + image per elevated surface, held just above
    // that surface's own roof/top image (surface.depth is that depth plus a
    // fractional nudge, so it never ties with a whole-pixel structure depth).
    this.surfaceLayers = surfaces.map((surface, i) => {
      const key = `${this.key}-surf-${i}`;
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const w = Math.max(1, Math.round(surface.screen.w));
      const h = Math.max(1, Math.round(surface.screen.h));
      const canvas = scene.textures.createCanvas(key, w, h);
      const image = scene.add.image(surface.screen.x, surface.screen.y, key)
        .setOrigin(0, 0).setDepth(surface.depth);
      return { surface, key, canvas, image };
    });

    this._bucket = null;

    // The player's own shadow(s) -- see the header comment for why this is a
    // separate, small, frequently-redrawn canvas rather than folded into the
    // one above. Sized for the longest shadow either a sun or a point light
    // here ever throws (PLAYER_SHADOW_REACH), recentred on the player instead
    // of the world, so the canvas itself can stay tiny.
    this.playerKey = `${this.key}-player`;
    if (scene.textures.exists(this.playerKey)) scene.textures.remove(this.playerKey);
    const ps = PLAYER_SHADOW_REACH * 2;
    this.playerCanvas = scene.textures.createCanvas(this.playerKey, ps, ps);
    this.playerImage = scene.add.image(0, 0, this.playerKey).setOrigin(0, 0).setDepth(DEPTH_SHADOW + 1);
    this._playerBucket = null;
  }

  /** @param {number} hours */
  setHours(hours) {
    const bucket = Math.round(hours * 20);
    if (bucket === this._bucket) return;
    this._bucket = bucket;

    // Every box caster's hull, computed once and reused for the ground bake
    // and every elevated surface's clip below.
    let alpha = 0;
    const hulls = this.casters.map((c) => {
      const s = shadowFor(hours, c.heightPx);
      if (!s) return null;
      alpha = s.alpha;
      return sweptHull(c.rect, s.dx, s.dy);
    });

    const ctx = this.canvas.getContext();
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = '#000000';
    for (const hull of hulls) if (hull) paintPolygon(ctx, hull);
    for (const sc of this.spriteCasters) {
      const s = shadowFor(hours, sc.heightPx);
      if (!s) continue;
      alpha = s.alpha;
      this._paintSpriteShadow(ctx, sc, s);
    }
    this.canvas.refresh();
    this.image.setAlpha(alpha).setVisible(alpha > 0);

    for (const layer of this.surfaceLayers) {
      const { footprint, screen, casterIndex } = layer.surface;
      const sctx = layer.canvas.getContext();
      sctx.clearRect(0, 0, screen.w, screen.h);
      sctx.fillStyle = '#000000';

      const scaleY = screen.h / footprint.h;
      let hit = false;
      for (let i = 0; i < hulls.length; i++) {
        if (i === casterIndex || !hulls[i]) continue;
        const clipped = clipToRect(hulls[i], footprint);
        // A sliver along a shared edge between adjacent footprints clips to a
        // handful of collinear points -- real area, not just a point count,
        // is what tells an actual overlap from two buildings simply touching.
        if (clipped.length < 3 || polygonArea(clipped) < 1) continue;
        hit = true;
        paintPolygon(sctx, clipped.map((p) => ({
          x: p.x - footprint.x,
          y: (p.y - footprint.y) * scaleY,
        })));
      }
      layer.canvas.refresh();
      layer.image.setAlpha(alpha).setVisible(hit && alpha > 0);
    }
  }

  /**
   * A solid-black cutout of one atlas frame, cached per (textureKey,
   * frameName) so every instance of the same sprite (every streetlamp) reuses
   * one silhouette rather than re-deriving it per placement. A plain DOM
   * canvas, not a Phaser texture -- it only ever needs to be a drawImage
   * *source* for _paintSpriteShadow, never a game object of its own.
   */
  _silhouetteFor(textureKey, frameName) {
    const key = `${textureKey}:${frameName}`;
    let s = this._silhouettes.get(key);
    if (s) return s;

    const f = this.scene.textures.getFrame(textureKey, frameName);
    const w = f.cutWidth, h = f.cutHeight;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const octx = off.getContext('2d');
    octx.drawImage(this.scene.textures.get(textureKey).getSourceImage(),
      f.cutX, f.cutY, w, h, 0, 0, w, h);
    // Recolour every opaque pixel solid black without touching alpha:
    // 'source-in' keeps new pixels only where the existing (destination)
    // alpha is already opaque, so this fill takes exactly the sprite's shape.
    octx.globalCompositeOperation = 'source-in';
    octx.fillStyle = '#000000';
    octx.fillRect(0, 0, w, h);

    s = { canvas: off, w, h };
    this._silhouettes.set(key, s);
    return s;
  }

  /**
   * Projects a sprite caster's own alpha silhouette onto the ground plane,
   * in place of a swept footprint box -- the right model for anything too
   * thin or irregular to have a meaningful footprint rect (a lamp post's
   * shadow should taper like the pole, not fan out like a dragged slab).
   *
   * The sprite is treated as a flat vertical cutout standing at its own
   * ground anchor (x, y -- origin 0.5, 1, matching how the image itself is
   * placed). A pixel at local height `h` above that anchor (h=0 at the base,
   * h=heightPx at the top) casts to ground position
   * `(x, y) + (dx, dy) * (h / heightPx)` -- the same linear relationship
   * shadowFor already defines between a caster's full height and its total
   * offset, just applied per pixel row instead of only at the two extremes
   * of a footprint. That is exactly one affine shear + scale, so the whole
   * projection is a single canvas transform, not a per-pixel loop.
   */
  _paintSpriteShadow(ctx, caster, { dx, dy }, alpha = 1) {
    const { canvas, w, h } = this._silhouetteFor(caster.textureKey, caster.frameName);
    const H = caster.heightPx || h;
    // The transform's y-scale is -dy/H; at dy = 0 that's a singular matrix
    // (every row collapses onto one line) and the whole draw silently
    // vanishes. The sun's own dy is never 0 (see sun.js), so this never came
    // up before a *point* light could be exactly level with the caster --
    // entirely ordinary once the light has its own position instead of one
    // shared angle for the whole scene (a player walking along a row of
    // streetlamps is level with one every time they cross it). Nudging dy a
    // hair off zero keeps the transform invertible; at 1px it is not a
    // visible change to the shadow's own shape.
    const safeDy = Math.abs(dy) < 1 ? (dy < 0 ? -1 : 1) : dy;
    ctx.save();
    // Local space: x from the sprite's own centreline, y top-down (0 at the
    // sprite's top, h at its base) -- see the derivation above for why this
    // particular matrix sends the base to (x, y) untouched and the top to
    // (x, y) + (dx, dy).
    ctx.setTransform(1, 0, -dx / H, -safeDy / H, caster.x + dx, caster.y + safeDy);
    ctx.globalAlpha = alpha;
    ctx.drawImage(canvas, -w / 2, 0);
    ctx.restore();
  }

  /**
   * Redraws the player's own shadow(s) -- called every frame the player
   * might have moved, not throttled by the hour bucket the way the static
   * canvas above is. See the header comment for why this is a separate,
   * small, recentred canvas rather than folded into that one.
   *
   * @param {number} px @param {number} py world position, the same anchor
   *   the player's own sprite uses (origin 0.5, 1)
   * @param {string} frameName current animation frame, e.g. from
   *   `player.sprite.frame.name` -- the shadow follows the actual walk pose
   * @param {number} heightPx the player sprite's height (SPRITE_H)
   * @param {number} hours drives the sun shadow, same as the static canvas
   * @param {{x:number, y:number, intensity:number, radius:number, dist:number}[]} lightSources
   *   from LightingLayer#shadowSources -- nearest lit point lights, already
   *   filtered to ones actually close enough to be lighting the player
   */
  updatePlayer(px, py, frameName, heightPx, hours, lightSources) {
    // Bucketed to whole px (sub-pixel jitter is invisible anyway) plus the
    // hour bucket and every light source's rounded position/intensity, so an
    // idle player under an unchanging sky redraws only on its own idle-blink
    // frame change, not every single frame.
    const lightKey = lightSources.map((s) => `${s.x},${s.y},${s.intensity.toFixed(2)}`).join('|');
    const bucket = `${Math.round(px)},${Math.round(py)},${frameName},${Math.round(hours * 20)},${lightKey}`;
    if (bucket === this._playerBucket) return;
    this._playerBucket = bucket;

    const half = PLAYER_SHADOW_REACH;
    this.playerImage.setPosition(px - half, py - half);
    const caster = { x: half, y: half, textureKey: 'player', frameName, heightPx };

    const ctx = this.playerCanvas.getContext();
    ctx.clearRect(0, 0, half * 2, half * 2);

    const sun = shadowFor(hours, heightPx);
    if (sun) this._paintSpriteShadow(ctx, caster, sun, sun.alpha);

    for (const src of lightSources) {
      // Direction is away from the light's *ground* anchor (src.x, src.y --
      // LightingLayer already resolved that, not the glow position), so its
      // own magnitude is the right thing to normalize by -- src.dist is a
      // different distance (to the glow position, what decides how strongly
      // lit the player is) and must not be reused here, or the direction
      // vector silently stops being unit length.
      const ddx = px - src.x, ddy = py - src.y;
      const dirDist = Math.max(1, Math.hypot(ddx, ddy));
      let ux = ddx / dirDist, uy = ddy / dirDist;
      // Floor the southward component (see PLIGHT_MIN_SOUTH) and renormalize
      // so the vector stays unit length -- otherwise raising uy alone would
      // quietly make the shadow reach further than `len` is about to say it
      // does.
      if (uy < PLIGHT_MIN_SOUTH) {
        uy = PLIGHT_MIN_SOUTH;
        const mag = Math.hypot(ux, uy) || 1;
        ux /= mag; uy /= mag;
      }
      // 1 standing at the light, 0 at the edge of its own radius -- both how
      // far the shadow reaches and how dark it is fade out together, so a
      // light barely strong enough to reach the player doesn't throw a full
      // -strength shadow.
      const proximity = clamp01(1 - src.dist / src.radius);
      const len = PLIGHT_MIN_LEN + (PLIGHT_MAX_LEN - PLIGHT_MIN_LEN) * proximity;
      const dx = ux * len, dy = uy * len;
      const alpha = 0.2 + 0.45 * proximity * Math.min(1, src.intensity);
      this._paintSpriteShadow(ctx, caster, { dx, dy }, alpha);
    }

    this.playerCanvas.refresh();
  }

  destroy() {
    this.image.destroy();
    if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key);
    for (const layer of this.surfaceLayers) {
      layer.image.destroy();
      if (this.scene.textures.exists(layer.key)) this.scene.textures.remove(layer.key);
    }
    this.playerImage.destroy();
    if (this.scene.textures.exists(this.playerKey)) this.scene.textures.remove(this.playerKey);
    this._silhouettes.clear();
  }
}

function paintPolygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
}

/** Convex hull of an axis-aligned rect and the same rect translated by (dx,dy).
 *  Andrew's monotone chain over the eight corners. */
function sweptHull({ x, y, w, h }, dx, dy) {
  const pts = [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
    { x: x + dx, y: y + dy }, { x: x + w + dx, y: y + dy },
    { x: x + w + dx, y: y + h + dy }, { x: x + dx, y: y + h + dy },
  ];
  pts.sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (src) => {
    const out = [];
    for (const p of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return half(pts).concat(half([...pts].reverse()));
}

/** Sutherland-Hodgman clip of a convex polygon against an axis-aligned rect,
 *  one half-plane at a time. Safe with an empty or fully-outside polygon --
 *  every clip step degrades to an empty list rather than throwing. */
function clipToRect(poly, { x, y, w, h }) {
  let pts = poly;
  pts = clipHalfPlane(pts, (p) => p.x >= x, (a, b) => lerpAt(a, b, (x - a.x) / (b.x - a.x)));
  pts = clipHalfPlane(pts, (p) => p.x <= x + w, (a, b) => lerpAt(a, b, (x + w - a.x) / (b.x - a.x)));
  pts = clipHalfPlane(pts, (p) => p.y >= y, (a, b) => lerpAt(a, b, (y - a.y) / (b.y - a.y)));
  pts = clipHalfPlane(pts, (p) => p.y <= y + h, (a, b) => lerpAt(a, b, (y + h - a.y) / (b.y - a.y)));
  return pts;
}

function clipHalfPlane(pts, inside, intersect) {
  if (pts.length === 0) return pts;
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const curIn = inside(cur);
    if (curIn !== inside(prev)) out.push(intersect(prev, cur));
    if (curIn) out.push(cur);
  }
  return out;
}

function lerpAt(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

/** Shoelace formula. Used only to tell a real overlap apart from a zero-width
 *  sliver where two footprints merely touch along a shared edge. */
function polygonArea(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}
