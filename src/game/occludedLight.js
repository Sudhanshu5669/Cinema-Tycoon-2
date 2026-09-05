// Occlusion-aware 2D lighting -- a prototype, not yet wired into SYSTEMS #8.
//
// What the reference image (a doorway spilling a beam of light across a dark
// room) actually is: a light whose visible area is clipped by wall geometry,
// not a plain distance falloff. Phaser's Light2D (what #8 uses today) has no
// idea walls exist -- a streetlamp's light doesn't know a building is there to
// block it. This is the other, well-established half of 2D lighting: shadow
// casting via a *visibility polygon* -- exactly what Godot's Light2D +
// LightOccluder2D nodes do internally, and the technique behind the classic
// "Sight & Light" tutorial (https://ncase.me/sight-and-light/) and Red Blob
// Games' 2D Visibility article (https://www.redblobgames.com/articles/
// visibility/). No 3D anywhere: a wall is a line segment, a light is a point,
// and the light's shape is just "which angles around that point hit a wall
// before they hit the radius boundary".
//
// Baked once per (light, geometry) pair rather than every frame or every hour
// bucket -- for a light and its walls that never move, the visible area never
// changes, so this costs nothing at runtime at all. That baked-canvas
// philosophy is the same one atlas.js and shadows.js already use for exactly
// this reason (a 2D canvas bake is milliseconds; doing the equivalent
// per-frame would not be).

import Phaser from 'phaser';

let bakeSeq = 0;

/** @typedef {{x1:number, y1:number, x2:number, y2:number}} Segment */

/**
 * Distance along the ray `origin + t*(dx,dy)` (t >= 0, direction unit-ish,
 * any positive length works) to segment `s`, or null if the ray misses it or
 * would only hit it behind the origin. Standard ray/segment parametric
 * intersection -- two lines, solved as a 2x2 linear system.
 */
function raySegmentHit(ox, oy, dx, dy, s) {
  const ex = s.x2 - s.x1, ey = s.y2 - s.y1;
  const ax = s.x1 - ox, ay = s.y1 - oy;
  const det = ex * dy - ey * dx;
  if (Math.abs(det) < 1e-10) return null; // parallel
  const t1 = (ex * ay - ey * ax) / det; // distance along the ray
  const t2 = (dx * ay - dy * ax) / det; // position along the segment, 0..1
  if (t1 < 0 || t2 < 0 || t2 > 1) return null;
  return t1;
}

/**
 * The visible area around `origin`, clipped by `segments` and capped at
 * `radius` -- a polygon, in angle order, ready to fill.
 *
 * One ray per angle in `angles`: nearest segment hit, or the radius boundary
 * if nothing is in the way. `angles` is a coarse fixed sweep (how round the
 * *unoccluded* part of the boundary looks) unioned with the exact angle to
 * every segment endpoint plus a hair either side (the classic trick for
 * catching the corner of a wall cleanly -- without the +/- epsilon pair, a
 * ray aimed exactly at a corner can miss deciding which side of it the
 * visible region actually continues on).
 *
 * @param {{x:number, y:number}} origin
 * @param {Segment[]} segments occluders -- callers should already have
 *   filtered to roughly `radius` away; this does no spatial culling itself
 * @param {number} radius
 * @param {number} [raySteps=180] base angular resolution
 * @returns {{x:number, y:number}[]}
 */
export function visibilityPolygon(origin, segments, radius, raySteps = 180) {
  const EPS = 1e-4;
  const angles = new Set();
  for (let i = 0; i < raySteps; i++) angles.add((i / raySteps) * Math.PI * 2);
  for (const s of segments) {
    for (const [px, py] of [[s.x1, s.y1], [s.x2, s.y2]]) {
      const a = Math.atan2(py - origin.y, px - origin.x);
      angles.add(a); angles.add(a + EPS); angles.add(a - EPS);
    }
  }

  return [...angles].sort((a, b) => a - b).map((angle) => {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let nearest = radius;
    for (const s of segments) {
      const t = raySegmentHit(origin.x, origin.y, dx, dy, s);
      if (t !== null && t < nearest) nearest = t;
    }
    return { x: origin.x + dx * nearest, y: origin.y + dy * nearest };
  });
}

/**
 * Bakes one occlusion-aware light into a single ADD-blended Image, and
 * returns it. Two passes on an offscreen canvas:
 *   1. the visibility polygon, filled solid white -- a hard-edged mask;
 *   2. that mask blurred (canvas `filter: blur()`, cheap here since it only
 *      ever runs once) then used as an alpha template (`source-in`) for a
 *      radial gradient in the light's colour -- softens both the occlusion
 *      edge and the distance falloff in one pass, since the mask carries
 *      both the hard visibility cutoff and (via the gradient placed on top
 *      of it) the fade with distance.
 *
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {number} cfg.x @param {number} cfg.y world position
 * @param {number} cfg.radius
 * @param {number} cfg.color 0xRRGGBB
 * @param {Segment[]} cfg.segments occluders near this light
 * @param {number} [cfg.raySteps]
 * @param {number} [cfg.edgeBlur=3] px of blur softening the occlusion edge
 * @param {number} [cfg.intensity=0.85] peak alpha at the light's own centre --
 *   under 1 on purpose: this is drawn with ADD blending, so two overlapping
 *   full-alpha lights (or one light filling a small room) wash out to flat
 *   white fast. Turn it down before reaching for a smaller radius.
 * @param {number} [cfg.depth]
 * @returns {Phaser.GameObjects.Image}
 */
export function bakeOccludedLight(scene, cfg) {
  const { x, y, radius, color, segments, raySteps = 180, edgeBlur = 3, intensity = 0.85, depth = 0 } = cfg;
  const poly = visibilityPolygon({ x, y }, segments, radius, raySteps);

  const pad = Math.ceil(edgeBlur * 3); // room for the blur, so it doesn't clip at the canvas edge
  const half = Math.ceil(radius) + pad;
  const size = half * 2;
  const toLocal = (p) => ({ x: p.x - x + half, y: p.y - y + half });

  const maskKey = `occl-mask-${bakeSeq}`;
  const maskCanvas = scene.textures.createCanvas(maskKey, size, size);
  const mctx = maskCanvas.getContext();
  mctx.fillStyle = '#fff';
  mctx.beginPath();
  poly.forEach((p, i) => {
    const lp = toLocal(p);
    if (i === 0) mctx.moveTo(lp.x, lp.y); else mctx.lineTo(lp.x, lp.y);
  });
  mctx.closePath();
  mctx.fill();
  maskCanvas.refresh();

  const key = `occl-light-${bakeSeq++}`;
  const canvas = scene.textures.createCanvas(key, size, size);
  const ctx = canvas.getContext();
  ctx.filter = `blur(${edgeBlur}px)`;
  ctx.drawImage(maskCanvas.getSourceImage(), 0, 0);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-in';
  const grad = ctx.createRadialGradient(half, half, 0, half, half, radius);
  const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
  grad.addColorStop(0, `rgba(${r},${g},${b},${intensity})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  scene.textures.remove(maskKey);

  return scene.add.image(x - half, y - half, key)
    .setOrigin(0, 0)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);
}
