// Loading and baking for the city tile atlas.
//
// The atlas is built from art/flat/tiles.mjs by tools/build-tiles-sheet.mjs.
// Everything the renderer draws is composited once into an offscreen canvas
// texture and shown as a single Image. A RenderTexture would be the obvious
// Phaser tool, but painting a ground plane cell by cell into one triggers a GPU
// readback per draw and stalls for seconds; a 2D canvas does the same work in
// milliseconds and the result is one static texture with no per-frame cost.

import { TILE } from './projection.js';

export const TILES_KEY = 'tiles';

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
 * Bake a w x h canvas texture. `paint` is called with a small painter:
 *   p.tile(name, dx, dy)              one frame at a pixel offset
 *   p.fill(name, x0, y0, w, h)        tile a frame across a rect (clipped)
 * Returns a unique texture key; add it with scene.add.image(x, y, key).
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
  });
  canvas.refresh();
  if (ncanvas) canvas.setDataSource(ncanvas);
  return key;
}

export { TILE };
