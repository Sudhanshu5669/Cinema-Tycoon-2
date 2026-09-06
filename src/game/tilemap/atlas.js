// Loading and baking for the city tile atlas.
//
// The atlas is built from art/flat/tiles.mjs by tools/build-tiles-sheet.mjs.
// Everything the renderer draws is composited once into an offscreen canvas
// texture and shown as a single Image. A RenderTexture would be the obvious
// Phaser tool, but painting a ground plane cell by cell into one triggers a GPU
// readback per draw and stalls for seconds; a 2D canvas does the same work in
// milliseconds and the result is one static texture with no per-frame cost.

import { TILE } from './projection.js';
import { drawText } from './font.js';

export const TILES_KEY = 'tiles';

/** The flat-facing-camera normal Phaser's own default `__NORMAL` texture is
 *  -- what "no relief" looks like to the Light2D shader. Used to seed a
 *  bake's normal canvas so a procedural fill/text draw (which paints only
 *  the diffuse layer, see `rect`/`text` below) reads as ordinary flat colour
 *  instead of the shader sampling whatever that canvas defaulted to. */
const FLAT_NORMAL = 'rgb(128,128,255)';

let bakeSeq = 0;

/** Call in a scene's preload(). The normal map lets the live Light2D
 *  pipeline (lighting.js's wireLight binds every tile image to it already)
 *  shade real relief -- see tools/normals.mjs -- instead of only tinting
 *  flat colour; it's the same size and frame layout as tiles.png, packed in
 *  lockstep by build-tiles-sheet.mjs, so tiles.json's frame rects apply to
 *  both without a normal map atlas of its own. */
export function preloadTiles(scene) {
  scene.load.atlas({
    key: TILES_KEY,
    textureURL: 'assets/tiles.png',
    normalMap: 'assets/tiles-normal.png',
    atlasURL: 'assets/tiles.json',
  });
}

/** True once the atlas is in the texture manager. */
export function tilesReady(scene) {
  return scene.textures.exists(TILES_KEY);
}

/** Pixel size of a named atlas frame. */
export function frameSize(scene, name) {
  const f = scene.textures.getFrame(TILES_KEY, name);
  return { w: f.cutWidth, h: f.cutHeight };
}

/**
 * The see-through opening in a named frame, in that frame's own pixel
 * coordinates, or null if the art is solid.
 *
 * Derived at build time from the authored grid, never declared here -- see
 * `openingOf` in tools/build-tiles-sheet.mjs for the rule (transparency that
 * does not touch the frame's edge). It rides into the runtime on the frame's
 * own atlas entry, which Phaser clones wholesale onto `Frame#customData`, so
 * there is no second file mapping tile names to holes and therefore no second
 * file to fall out of step with the art.
 */
export function frameOpening(scene, name) {
  return scene.textures.getFrame(TILES_KEY, name).customData?.opening ?? null;
}

/**
 * Bake a w x h canvas texture. `paint` is called with a small painter:
 *   p.tile(name, dx, dy)              one frame at a pixel offset
 *   p.fill(name, x0, y0, w, h)        tile a frame across a rect (clipped)
 *   p.rect(color, x0, y0, w, h)       a flat filled rect, no atlas frame
 *   p.cut(x0, y0, w, h)               erase a rect back to transparent
 *   p.text(str, x0, y0, scale, color, font) baked, data-driven signage (font.js)
 * Returns a unique texture key; add it with scene.add.image(x, y, key).
 *
 * `rect`/`text` are for signage that has no business being authored as a
 * repeating atlas tile -- a sign's solid backing panel, or a name nobody
 * drew in advance because it comes from data (a cinema's own marquee text,
 * SYSTEMS #6's sixth follow-up). They only ever paint the diffuse canvas;
 * see `FLAT_NORMAL` below for why that is safe rather than a second
 * "no normal map" bug like the one this whole function exists to fix.
 *
 * Compositing many tiles into one flat canvas is exactly what would normally
 * throw away every one of their normal maps: the result is a brand new
 * texture Phaser has never seen, so its Light2D pipeline would fall back to
 * a flat default normal for the whole baked image, no matter how much relief
 * tiles.png's own tiles carry. So every `draw` call here runs twice, once
 * against the diffuse atlas image (as before) and once, in lockstep, against
 * its normal map at the exact same source and destination rects -- into a
 * second plain canvas that gets attached as this bake's own data source
 * (`Texture#setDataSource`, the same mechanism a loaded atlas-with-normal-map
 * uses) once painting is done, rather than reimplementing this compositing a
 * second time at the call sites.
 */
export function bake(scene, w, h, paint) {
  const key = `tilebake-${bakeSeq++}`;
  const canvas = scene.textures.createCanvas(key, Math.max(1, w), Math.max(1, h));
  const ctx = canvas.getContext();
  const tex = scene.textures.get(TILES_KEY);
  const src = tex.getSourceImage();
  const nsrc = tex.dataSource?.[0]?.image;

  const ncanvas = nsrc && document.createElement('canvas');
  let nctx = null;
  if (ncanvas) {
    ncanvas.width = canvas.width;
    ncanvas.height = canvas.height;
    nctx = ncanvas.getContext('2d');
    // Seed flat before anything is painted: every *existing* caller fills its
    // whole rect via tile()/fill() in lockstep anyway, so this changes
    // nothing for them, but rect()/text() below only ever touch the diffuse
    // canvas -- without this, their opaque pixels would carry whatever this
    // canvas defaults to (transparent black) as their "normal", not flat.
    nctx.fillStyle = FLAT_NORMAL;
    nctx.fillRect(0, 0, ncanvas.width, ncanvas.height);
  }

  const draw = (name, dx, dy) => {
    const f = scene.textures.getFrame(TILES_KEY, name);
    ctx.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight,
      Math.round(dx), Math.round(dy), f.cutWidth, f.cutHeight);
    if (nctx) {
      nctx.drawImage(nsrc, f.cutX, f.cutY, f.cutWidth, f.cutHeight,
        Math.round(dx), Math.round(dy), f.cutWidth, f.cutHeight);
    }
  };
  paint({
    tile: draw,
    fill(name, x0, y0, rw, rh) {
      const f = scene.textures.getFrame(TILES_KEY, name);
      for (let y = 0; y < rh; y += f.cutHeight) {
        for (let x = 0; x < rw; x += f.cutWidth) draw(name, x0 + x, y0 + y);
      }
    },
    rect(color, x0, y0, rw, rh) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x0), Math.round(y0), Math.round(rw), Math.round(rh));
    },
    /**
     * Punch a hole. The one op here that *removes* rather than adds, and the
     * only way a baked composite can be seen through -- drawing a tile whose
     * own pixels are transparent does not erase the wall already painted
     * underneath it, it just leaves that wall showing.
     *
     * Clears the normal canvas in lockstep. Strictly that is invisible (a
     * fully transparent pixel is never shaded, so whatever normal sits behind
     * it cannot matter), but leaving a flat normal in a hole would be one
     * more place where the two canvases say different things about the same
     * pixel, and this file's whole discipline is that they never do.
     */
    cut(x0, y0, rw, rh) {
      ctx.clearRect(Math.round(x0), Math.round(y0), Math.round(rw), Math.round(rh));
      nctx?.clearRect(Math.round(x0), Math.round(y0), Math.round(rw), Math.round(rh));
    },
    text(str, x0, y0, scale, color, font) {
      drawText(ctx, str, x0, y0, scale, color, font);
    },
  });
  canvas.refresh();
  if (ncanvas) canvas.setDataSource(ncanvas);
  return key;
}

export { TILE };
