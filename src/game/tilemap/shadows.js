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
//
// A shadow painted only on the ground canvas has the same problem the ground
// bake solved for roofs and platform tops: any part of it that lands north of
// a building's or platform's front wall sits, in screen space, exactly where
// that wall's own image is drawn -- at a far higher depth -- so it simply
// vanishes under a building instead of falling across it the way a real
// shadow would. The sun can never cause this (shadowFor's dy is always
// southward, away from every wall it could climb), but a nearby point light
// can throw the player's shadow in any direction, including straight at a
// wall behind them.
//
// Climbing the wall needs a different *canvas* (held at a depth above the
// wall's own image instead of below it) but, less obviously, also a
// different *angle* -- carrying the ground shear's own (dx, dy) straight up
// the wall keeps it leaning at the same shallow diagonal it had on the
// pavement, which reads as wrong the moment it crosses the base line. A wall
// is a plane of constant world Y; a light ray's horizontal (X, Y) direction
// away from a caster doesn't depend on which height along the caster it
// started from, so *every* row of the caster's silhouette reaches that plane
// at the very same point -- only how high up it lands differs, by exactly as
// much of the shadow's own length as it had left to spend when it got there.
// In other words, the lean stops dead at the wall: what's left of the
// shadow's reach keeps going, but straight up, not sideways. _paintOntoWalls
// computes that crossing point and re-derives a second, purely-vertical
// transform for the part of the silhouette beyond it, rather than reusing
// the ground shear unchanged.

import { DEPTH_SHADOW } from './projection.js';
import { shadowFor } from './sun.js';

/** Half-size of the player's own shadow canvas, world px. Comfortably past
 *  the longest shadow either the sun or a point light throws below (a sun
 *  shadow tops out around 2.6x the caster's height -- SPRITE_H is 48 -- and
 *  point-light shadows are capped well under that, see PLIGHT_MAX_LEN). */
/**
 * What a shadow is actually made of.
 *
 * Pure black was the wrong answer for the same reason a warm-painted street
 * was: a shadow is not an absence of light, it is a surface lit by whatever
 * light still reaches it. Outdoors in the day that is the sky, which is blue,
 * so a shadow on sunlit paving goes COOL while the paving around it stays
 * warm -- and that warm/cool split across a single flat surface is most of
 * what makes daylight read as daylight rather than as grey. Black can only
 * ever darken; it cannot do that.
 *
 * The same holds at night, where a shadow thrown by a warm lamp is filled by
 * the cool ambient (sun.js's NIGHT) and by the other lamps on the street, so
 * it wants the same treatment.
 *
 * These images are composited straight over the lit scene -- deliberately not
 * on the Light2D pipeline -- so this colour is literal, not a material to be
 * shaded.
 *
 * It has to work across a wide alpha range, and that is what sets how far the
 * blue can go. A sun shadow at midday runs about 0.32; a point-light shadow
 * off a close streetlamp reaches PLIGHT_MAX_ALPHA, 0.65. A blue picked to
 * read clearly at 0.32 turns into an actual blue puddle at 0.65 -- which is
 * exactly what the player's own shadow became on lit pavement. Tuned at the
 * top of the range instead: cool enough to read as sky-fill in daylight,
 * still a shadow rather than a colour when a lamp is standing over it.
 */
const SHADOW_COLOR = '#12172b';

const PLAYER_SHADOW_REACH = 130;
/** Point-light player shadows: length range (px) from a light's edge (dim,
 *  short) to standing right on top of it (bright, long) -- see updatePlayer. */
const PLIGHT_MIN_LEN = 14;
const PLIGHT_MAX_LEN = 70;
/** Point-light player shadows: darkness range, same 0 (a light barely
 *  reaching at all) to 1 (standing right on it) strength driving both. */
const PLIGHT_MIN_ALPHA = 0.2;
const PLIGHT_MAX_ALPHA = 0.65;
/** Horizontal slack (px) when testing whether the player's shadow could reach
 *  a wall's width -- generous enough to cover the sprite's own width and the
 *  shear's sideways drift without needing the exact silhouette bounds. */
const WALL_HIT_MARGIN = 24;

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
   * @param {{ x0: number, x1: number, faceTop: number, frontY: number }[]} wallFaces
   *   Every building/platform front wall the *player's* shadow might climb --
   *   `x0, x1` its world-x span, `faceTop..frontY` the world-y range its own
   *   face image occupies (frontY is the ground-contact row, same value the
   *   face image's own depth uses). Player-only for now, same reasoning as
   *   spriteCasters above not being clipped onto `surfaces`: box casters'
   *   shadows only ever rake south, away from any wall behind them, so this
   *   case doesn't come up for anything but a point light throwing the
   *   player's shadow toward one.
   * @param {number} worldW @param {number} worldH
   */
  constructor(scene, casters, spriteCasters, surfaces, wallFaces, worldW, worldH) {
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

    // One small canvas + image per wall a player shadow might climb, held
    // just above that wall's own face image (frontY + 0.4, below the roof's
    // own +0.5 nudge though the two never actually overlap on screen) --
    // see the header comment and _paintOntoWalls. Starts hidden: most walls
    // never have a shadow climbing them on a given frame.
    this.wallLayers = wallFaces.map((wall, i) => {
      const key = `${this.key}-wall-${i}`;
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const w = Math.max(1, Math.round(wall.x1 - wall.x0));
      const h = Math.max(1, Math.round(wall.frontY - wall.faceTop));
      const canvas = scene.textures.createCanvas(key, w, h);
      const image = scene.add.image(wall.x0, wall.faceTop, key)
        .setOrigin(0, 0).setDepth(wall.frontY + 0.4).setVisible(false);
      return { wall, key, canvas, image, w, h };
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
    ctx.fillStyle = SHADOW_COLOR;
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
      sctx.fillStyle = SHADOW_COLOR;

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
    octx.fillStyle = SHADOW_COLOR;
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
   * @param {{light: import('../light.js').Light, strength: number}[]} lightSources
   *   from LightingLayer#shadowSources -- every point light actually
   *   touching the player right now, each with its own continuous strength
   *   there (0 at that light's radius, up to its own peak intensity at its
   *   centre). No ranking: every one casts its own shadow, independently.
   */
  updatePlayer(px, py, frameName, heightPx, hours, lightSources) {
    // Bucketed to whole px (sub-pixel jitter is invisible anyway) plus the
    // hour bucket and every light source's rounded strength there, so an
    // idle player under an unchanging sky redraws only on its own idle-blink
    // frame change, not every single frame. Strength alone (not the light's
    // identity) is deliberate: it is a continuous function of position, so
    // this key already changes exactly when the rendered result would.
    const lightKey = lightSources.map((s) => s.strength.toFixed(2)).join('|');
    const bucket = `${Math.round(px)},${Math.round(py)},${frameName},${Math.round(hours * 20)},${lightKey}`;
    if (bucket === this._playerBucket) return;
    this._playerBucket = bucket;

    const half = PLAYER_SHADOW_REACH;
    this.playerImage.setPosition(px - half, py - half);
    const caster = { x: half, y: half, textureKey: 'player', frameName, heightPx };

    const ctx = this.playerCanvas.getContext();
    ctx.clearRect(0, 0, half * 2, half * 2);

    // Every wall the shadow actually lands on this frame -- collected as we
    // go so a wall nobody's shadow reaches any more gets hidden again below,
    // instead of keeping last frame's mark on it.
    const touchedWalls = new Set();
    const cast = (offset, alpha) => {
      this._paintSpriteShadow(ctx, caster, offset, alpha);
      this._paintOntoWalls(px, py, offset, alpha, frameName, heightPx, touchedWalls);
    };

    const sun = shadowFor(hours, heightPx);
    if (sun) cast(sun, sun.alpha);

    // Every light touching the player casts its own shadow, independently,
    // scaled only by how strongly *that* light illuminates them (Light#
    // illuminationAt -- 1 at the light's own centre, 0 at its radius,
    // continuous). No ranking between lights and no directional bias: a
    // streetlamp really is standing wherever it's standing, so the only
    // physically honest thing to do is ask each light in turn which way its
    // own shadow falls and how strong it is, then let them overlap exactly
    // like real light would.
    for (const { light, strength } of lightSources) {
      const dir = light.directionFrom(px, py);
      const len = PLIGHT_MIN_LEN + (PLIGHT_MAX_LEN - PLIGHT_MIN_LEN) * strength;
      const alpha = PLIGHT_MIN_ALPHA + (PLIGHT_MAX_ALPHA - PLIGHT_MIN_ALPHA) * strength;
      cast({ dx: dir.x * len, dy: dir.y * len }, alpha);
    }

    this.playerCanvas.refresh();
    for (const wl of this.wallLayers) {
      if (touchedWalls.has(wl)) { wl.canvas.refresh(); wl.image.setVisible(true); }
      else if (wl.image.visible) wl.image.setVisible(false);
    }
  }

  /**
   * Carries one of the player's shadow casts (sun or a point light) onto any
   * wall it climbs, past the point where it crosses that wall's base row --
   * see the header comment for the derivation this follows: past that
   * crossing, every row of the silhouette shares the same X (a wall is a
   * plane of constant world Y, and the ray's XY direction away from the
   * caster doesn't depend on which height along the caster it started from),
   * so the lean stops there and whatever reach is left continues straight up.
   *
   * A shadow can only climb a wall by pointing at it, north (screen-up), so
   * this is a no-op for the sun (its dy is always south -- shadowFor -- so
   * the check below simply never passes) and for most point-light directions
   * too. `touchedWalls` is shared across every cast this frame: the first
   * cast to reach a given wall clears it, later casts (another light, say)
   * layer onto the same cleared canvas instead of re-clearing it.
   */
  _paintOntoWalls(px, py, { dx, dy }, alpha, frameName, heightPx, touchedWalls) {
    if (dy >= 0) return;
    const len = Math.hypot(dx, dy);
    for (const wl of this.wallLayers) {
      const { x0, x1, faceTop, frontY } = wl.wall;
      // The wall's own contact row has to sit between the caster and the
      // shadow's tip -- otherwise this shadow never reaches that far, or the
      // wall is somewhere else entirely (behind the caster, say). `t` is how
      // far along the (dx, dy) reach that crossing sits, 0 (right at the
      // caster's feet) to 1 (right at the shadow's untouched tip).
      if (frontY > py || frontY < py + dy) continue;
      const t = (frontY - py) / dy;
      const crossX = px + dx * t;
      if (crossX < x0 - WALL_HIT_MARGIN || crossX > x1 + WALL_HIT_MARGIN) continue;
      if (!touchedWalls.has(wl)) {
        wl.canvas.getContext().clearRect(0, 0, wl.w, wl.h);
        touchedWalls.add(wl);
      }
      // Past the crossing the shadow no longer leans -- every row shares
      // `crossX` -- so what's left of its length (len * (1 - t), the same
      // magnitude it would have kept spending on the lean) becomes pure
      // rise instead. climbTopY is where the caster's own topmost row (the
      // farthest-reaching point of its silhouette) ends up; rows between
      // there and the crossing interpolate linearly, same as the ground
      // shear does between the caster's base and its own top.
      const { canvas, w } = this._silhouetteFor('player', frameName);
      const climbTopY = frontY - len * (1 - t);
      const wctx = wl.canvas.getContext();
      wctx.save();
      wctx.setTransform(1, 0, 0, len / heightPx, crossX - x0, climbTopY - faceTop);
      wctx.globalAlpha = alpha;
      wctx.drawImage(canvas, -w / 2, 0);
      wctx.restore();
    }
  }

  destroy() {
    this.image.destroy();
    if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key);
    for (const layer of this.surfaceLayers) {
      layer.image.destroy();
      if (this.scene.textures.exists(layer.key)) this.scene.textures.remove(layer.key);
    }
    for (const wl of this.wallLayers) {
      wl.image.destroy();
      if (this.scene.textures.exists(wl.key)) this.scene.textures.remove(wl.key);
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
