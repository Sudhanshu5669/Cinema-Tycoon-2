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

/** Call in a scene's preload(). */
export function preloadTiles(scene) {
  scene.load.atlas(TILES_KEY, 'assets/tiles.png', 'assets/tiles.json');
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
 */
export function bake(scene, w, h, paint) {
  const key = `tilebake-${bakeSeq++}`;
  const canvas = scene.textures.createCanvas(key, Math.max(1, w), Math.max(1, h));
  const ctx = canvas.getContext();
  const src = scene.textures.get(TILES_KEY).getSourceImage();

  const draw = (name, dx, dy) => {
    const f = scene.textures.getFrame(TILES_KEY, name);
    ctx.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight,
      Math.round(dx), Math.round(dy), f.cutWidth, f.cutHeight);
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
  return key;
}

export { TILE };
