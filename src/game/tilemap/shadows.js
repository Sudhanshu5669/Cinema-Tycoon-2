// The cast-shadow layer for the tile renderer.
//
// Each caster is a ground footprint rect plus a silhouette height. For a given
// hour, sun.js turns the height into a 2D offset; the shadow is that footprint
// swept along the offset -- the convex hull of the rect and its translated
// copy. Every shadow is painted solid black into one offscreen canvas and shown
// as a single Image whose alpha is the day's shadow opacity: baking a flat mask
// and fading it once is what stops overlapping shadows from stacking into
// double-dark seams where buildings meet.
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

import { DEPTH_SHADOW } from './projection.js';
import { shadowFor } from './sun.js';

export class ShadowLayer {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ rect: {x:number,y:number,w:number,h:number}, heightPx:number }[]} casters
   * @param {{ footprint: {x:number,y:number,w:number,h:number},
   *           screen: {x:number,y:number,w:number,h:number},
   *           depth: number, casterIndex: number }[]} surfaces
   *   Every roof cap and raised platform top a neighbouring caster's shadow
   *   might land on. `footprint` is in the same ground space as a caster's
   *   `rect`; `screen` is where that surface is actually drawn -- a plain
   *   shift for a platform top, shifted-and-squashed for a foreshortened roof.
   * @param {number} worldW @param {number} worldH
   */
  constructor(scene, casters, surfaces, worldW, worldH) {
    this.scene = scene;
    this.casters = casters;
    this.surfaces = surfaces;
    this.w = worldW;
    this.h = worldH;
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
  }

  /** @param {number} hours */
  setHours(hours) {
    const bucket = Math.round(hours * 20);
    if (bucket === this._bucket) return;
    this._bucket = bucket;

    // Every caster's hull, computed once and reused for the ground bake and
    // every elevated surface's clip below.
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

  destroy() {
    this.image.destroy();
    if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key);
    for (const layer of this.surfaceLayers) {
      layer.image.destroy();
      if (this.scene.textures.exists(layer.key)) this.scene.textures.remove(layer.key);
    }
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
