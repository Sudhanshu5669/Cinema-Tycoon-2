// Tile renderer -- SYSTEMS #6.
//
// Consumes a data map -- SYSTEMS #9's mapLoader.js expands the hand-editable
// city JSON (public/assets/city.json) into exactly this shape -- and builds a
// set of static Phaser objects, each given a depth so the player sorts
// correctly against it. Nothing here runs per frame; only the player's depth
// changes as it moves, and the player owns that.
//
// The map has four ingredients:
//   height   an integer elevation per cell -- the solid terrain. 0 is street
//            level. Buildings and platforms stamp their footprint into it so
//            faces and collision (#7) agree on where the solid stuff is.
//   layers   ordered tile grids with a role: 'ground' and 'flat' are the street
//            surface (always behind everything, baked into one image); 'object'
//            is a y-sorted footprint prop; 'overhead' always draws over entities.
//   buildings / platforms
//            raised regions. A platform is a low step with a plain face. A
//            building is a tall step whose face is a composed storeyed wall
//            (cornice, wall, ground-floor material, plinth) with windows and a
//            door placed on it -- an oblique face rather than a flat facade.
//   streetlamps
//            point-placed props (SYSTEMS #8) -- see _buildStreetlamp.
//
// Faces project straight down the screen (south only) -- no horizontal skew --
// so the projection stays compatible with a four-facing character. Raising STEP
// in projection.js makes every building taller without touching a map.

import {
  TILE, STEP, DEPTH_GROUND, DEPTH_OVERHEAD, footY, surfaceY,
} from './projection.js';
import { preloadTiles, tilesReady, bake, frameSize, TILES_KEY } from './atlas.js';
import { ShadowLayer } from './shadows.js';
import { LightingLayer, wireLight } from '../lighting.js';

export class TileMapRenderer {
  static preload(scene) { preloadTiles(scene); }

  /** @param {Phaser.Scene} scene @param {object} map */
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.w = map.w;
    this.h = map.h;
    /** Effective terrain elevation: map.height with every footprint stamped in. */
    this.height = this._bakeHeight();
    /** Building footprints, for solidAt(). */
    this._solid = this._bakeSolid();
    /** @type {Phaser.GameObjects.GameObject[]} */
    this.objects = [];
    /** Structure screen rects + depths, for the smoke test and debug overlays. */
    this.structures = [];
    /** Ground footprint + silhouette height per shadow caster -- filled
     *  footprints (buildings/platforms), swept-box shadows. */
    this._casters = [];
    /** Thin/irregular props (streetlamps) -- shadow follows the sprite's own
     *  alpha silhouette instead of a synthetic footprint box. See
     *  _buildStreetlamp and shadows.js's spriteCasters. */
    this._spriteCasters = [];
    /** Elevated tops (roof caps, platform tops) a shadow can land on -- see
     *  shadows.js for why these need their own footprint -> screen mapping. */
    this._surfaces = [];
    /** @type {ShadowLayer | null} set by build(). */
    this.shadows = null;
    /** World-space light sources derived from facade data (window tiles,
     *  awnings) as buildings are built -- see _buildBuilding. */
    this._lights = [];
    /** @type {LightingLayer | null} set by build(). */
    this.lighting = null;
    /** Current hour driving the cast shadows and the lighting layer. */
    this.hours = 12;
  }

  // --- queries other systems lean on ---------------------------------------

  /** Terrain elevation at a world pixel. 0 outside the map. */
  heightAt(wx, wy) {
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 0;
    return this.height[ty][tx];
  }

  /** True where a building stands -- the player cannot be here. Collision (#7)
   *  turns this into actual blocking; the renderer only reports it. */
  solidAt(wx, wy) {
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return false;
    return this._solid[ty][tx];
  }

  get pixelWidth() { return this.w * TILE; }
  get pixelHeight() { return this.h * TILE; }

  // --- build -------------------------------------------------------------

  build() {
    if (!tilesReady(this.scene)) throw new Error('tile atlas not loaded -- call TileMapRenderer.preload in preload()');
    this._buildGround();
    for (const p of this.map.platforms ?? []) this._buildPlatform(p);
    for (const b of this.map.buildings ?? []) this._buildBuilding(b);
    for (const s of this.map.streetlamps ?? []) this._buildStreetlamp(s);
    this._buildLoose();
    this.shadows = new ShadowLayer(
      this.scene, this._casters, this._spriteCasters, this._surfaces, this.pixelWidth, this.pixelHeight,
    );
    this.shadows.setHours(this.hours);
    this.lighting = new LightingLayer(this.scene, this._lights);
    this.lighting.setHours(this.hours);
    return this;
  }

  /** Set the hour driving the cast shadows and the lighting layer (0..24). */
  setHours(hours) {
    this.hours = hours;
    this.shadows?.setHours(hours);
    this.lighting?.setHours(hours);
  }

  _place(key, x, y, depth) {
    const img = this.scene.add.image(x, y, key).setOrigin(0, 0);
    img.setDepth(depth);
    wireLight(img);
    this.objects.push(img);
    return img;
  }

  /** The street surface: every 'ground' and 'flat' layer baked into one image
   *  that sits under everything. */
  _buildGround() {
    const grids = (this.map.layers ?? [])
      .filter((l) => l.role === 'ground' || l.role === 'flat')
      .map((l) => l.data);
    const key = bake(this.scene, this.pixelWidth, this.pixelHeight, (p) => {
      for (const grid of grids) {
        for (let ty = 0; ty < grid.length; ty++) {
          for (let tx = 0; tx < grid[ty].length; tx++) {
            const name = grid[ty][tx];
            if (name) p.tile(name, tx * TILE, ty * TILE);
          }
        }
      }
    });
    this._place(key, 0, 0, DEPTH_GROUND);
  }

  /**
   * A raised step. `top` tiles its surface, shifted up e*STEP; `face` tiles the
   * oblique wall from that surface down to the ground along its front row. Both
   * get a depth from their contact row so the player passes in front when south
   * of the step and behind when north of it.
   */
  _buildPlatform(p) {
    const e = p.e ?? 1;
    const frontY = footY(p.y + p.h - 1);
    const faceTop = frontY - e * STEP;

    const faceKey = bake(this.scene, p.w * TILE, e * STEP, (g) =>
      g.fill(p.face ?? 'plinth', 0, 0, p.w * TILE, e * STEP));
    this._place(faceKey, p.x * TILE, faceTop, frontY);

    const casterIndex = this._casters.length;
    this._casters.push({ rect: worldRect(p), heightPx: e * STEP });

    const topDepth = footY(p.y);   // back edge
    const topKey = bake(this.scene, p.w * TILE, p.h * TILE, (g) =>
      g.fill(p.top ?? 'pave', 0, 0, p.w * TILE, p.h * TILE));
    this._place(topKey, p.x * TILE, surfaceY(p.y, e), topDepth);

    // The top is a plain shift of the footprint (no foreshortening), so a
    // shadow landing on it needs only a translation, not a squash.
    this._surfaces.push({
      footprint: worldRect(p),
      screen: { x: p.x * TILE, y: surfaceY(p.y, e), w: p.w * TILE, h: p.h * TILE },
      depth: topDepth + 0.5,
      casterIndex,
    });

    this.structures.push({ kind: 'platform', worldRect: worldRect(p), e,
      topDepth: footY(p.y), faceDepth: frontY });
  }

  /**
   * A building. Roof cap plus a composed storeyed face: cornice at the top,
   * wall, a course of the ground-floor material, plinth at the bottom, then the
   * windows and door placed on it in face space (fx tiles from the left, fy
   * tiles up from the pavement). The awning, if any, is an overhead strip.
   */
  _buildBuilding(b) {
    const storeys = b.storeys ?? 4;
    const faceH = storeys * STEP;
    const frontY = footY(b.y + b.h - 1);
    const faceTop = frontY - faceH;

    // Roof cap -- foreshortened to a few tiles and sat directly on the face, so
    // the wall dominates the way it does in a real 3/4 street rather than the
    // roof spreading into a flat slab. Depth is the front wall line: the player
    // is behind the whole building unless their feet are south of it.
    const roofH = Math.min(b.h, b.roofDepth ?? 3) * TILE;
    const roofY = faceTop - roofH;
    const roofKey = bake(this.scene, b.w * TILE, roofH, (g) =>
      g.fill(b.top ?? 'roof', 0, 0, b.w * TILE, roofH));
    this._place(roofKey, b.x * TILE, roofY, frontY);

    // Composed face. Every window facade entry doubles as a light source --
    // derived here, not authored twice, since this is already the one place
    // that turns a window's face-space (fx, fy) into a real position.
    const rows = faceRowPlan(storeys, b.face ?? 'wall', b.base ?? 'brick');
    const faceKey = bake(this.scene, b.w * TILE, faceH, (g) => {
      rows.forEach((frame, r) => g.fill(frame, 0, r * TILE, b.w * TILE, TILE));
      for (const d of b.facade ?? []) {
        const size = frameSize(this.scene, d.tile);
        const localY = faceH - (d.fy ?? 0) * TILE - size.h;
        g.tile(d.tile, d.fx * TILE, localY);
        if (d.tile === 'window') {
          this._lights.push({
            x: b.x * TILE + d.fx * TILE + size.w / 2,
            y: faceTop + localY + size.h / 2,
            kind: 'window',
          });
        }
      }
    });
    this._place(faceKey, b.x * TILE, faceTop, frontY);

    // Awning -- overhead, so the player walks under it. Doubles as the
    // marquee light: the one saturated colour accent on the street.
    if (b.awning) {
      const awKey = bake(this.scene, b.awning.fw * TILE, TILE, (g) =>
        g.fill('awning', 0, 0, b.awning.fw * TILE, TILE));
      const awY = frontY - (b.awning.up ?? 3) * TILE;
      this._place(awKey, (b.x + b.awning.fx) * TILE, awY, DEPTH_OVERHEAD);
      this._lights.push({
        x: (b.x + b.awning.fx) * TILE + (b.awning.fw * TILE) / 2,
        y: awY + TILE / 2,
        kind: 'marquee',
      });
    }

    // The building's silhouette height -- face plus the foreshortened roof --
    // drives how far its shadow reaches.
    const casterIndex = this._casters.length;
    this._casters.push({ rect: worldRect(b), heightPx: faceH + roofH });

    // The roof cap squashes the full footprint depth into `roofH` on screen
    // (the foreshortening that keeps the wall dominant); a shadow landing on
    // it is carried through that same squash, not just shifted.
    this._surfaces.push({
      footprint: worldRect(b),
      screen: { x: b.x * TILE, y: roofY, w: b.w * TILE, h: roofH },
      depth: frontY + 0.5,
      casterIndex,
    });

    this.structures.push({ kind: 'building', worldRect: worldRect(b), storeys,
      roofDepth: frontY, faceDepth: frontY, faceTop: faceTop - roofH });
  }

  /**
   * A streetlamp: `{ x, y }` tile coords of its base. Point-placed sugar like
   * a platform or building, not a per-cell layer tile, since its image is
   * taller than one tile and its ground contact is what depth-sorts it.
   * Registers a caster (so it throws a raking shadow like anything else
   * raised) and a `streetlamp` light point at the bulb -- SYSTEMS #8.
   */
  _buildStreetlamp(p) {
    const size = frameSize(this.scene, 'lampPost');
    const baseY = footY(p.y);
    const img = this.scene.add
      .image(p.x * TILE + TILE / 2, baseY, TILES_KEY, 'lampPost')
      .setOrigin(0.5, 1);
    img.setDepth(baseY);
    wireLight(img);
    this.objects.push(img);

    // A swept-box shadow (like a building's) is a filled footprint dragged
    // sideways -- correct for something that really fills its plan, wildly
    // too heavy for a pole one pixel wide. This casts along the sprite's own
    // alpha silhouette instead, anchored at the same ground point the image
    // itself uses.
    this._spriteCasters.push({
      x: p.x * TILE + TILE / 2, y: baseY,
      textureKey: TILES_KEY, frameName: 'lampPost',
      heightPx: size.h,
    });

    // Bulb centre within the feature image, top-down. Mirrors LAMP_BULB_DY in
    // art/flat/tiles.mjs -- not imported directly, since runtime code only
    // ever consults the baked atlas, never the raw ASCII art (see atlas.js).
    const LAMP_BULB_DY = 6;
    this._lights.push({
      x: p.x * TILE + TILE / 2,
      y: baseY - size.h + LAMP_BULB_DY,
      kind: 'streetlamp',
    });
  }

  /** 'object' and 'overhead' layers: one image per cell. */
  _buildLoose() {
    for (const layer of this.map.layers ?? []) {
      if (layer.role !== 'object' && layer.role !== 'overhead') continue;
      for (let ty = 0; ty < layer.data.length; ty++) {
        for (let tx = 0; tx < layer.data[ty].length; tx++) {
          const name = layer.data[ty][tx];
          if (!name) continue;
          const img = this.scene.add.image(tx * TILE, ty * TILE, TILES_KEY, name).setOrigin(0, 0);
          img.setDepth(layer.role === 'overhead' ? DEPTH_OVERHEAD : footY(ty));
          wireLight(img);
          this.objects.push(img);
        }
      }
    }
  }

  // --- baking ------------------------------------------------------------

  _bakeHeight() {
    const g = grid(this.w, this.h, 0);
    const src = this.map.height;
    if (src) for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g[y][x] = src[y]?.[x] ?? 0;
    for (const p of this.map.platforms ?? []) stamp(g, p, p.e ?? 1);
    for (const b of this.map.buildings ?? []) stamp(g, b, b.storeys ?? 4);
    return g;
  }

  _bakeSolid() {
    const g = grid(this.w, this.h, false);
    for (const b of this.map.buildings ?? []) stamp(g, b, true);
    return g;
  }

  destroy() {
    this.shadows?.destroy();
    this.shadows = null;
    this.lighting?.destroy();
    this.lighting = null;
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
  }
}

// --- helpers -------------------------------------------------------------

function grid(w, h, fill) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}

function worldRect(r) { return { x: r.x * TILE, y: r.y * TILE, w: r.w * TILE, h: r.h * TILE }; }

function stamp(g, r, value) {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (y >= 0 && x >= 0 && y < g.length && x < g[0].length) g[y][x] = value;
    }
  }
}

/**
 * Top-to-bottom list of 16px row frames for a storeys-tall face. Cornice owns
 * the top, plinth the bottom, the ground-floor material one course above the
 * plinth, wall the rest. Degrades cleanly for very short buildings.
 */
function faceRowPlan(storeys, wall, base) {
  if (storeys <= 1) return ['cornice'];
  if (storeys === 2) return ['cornice', 'plinth'];
  if (storeys === 3) return ['cornice', base, 'plinth'];
  const rows = ['cornice'];
  for (let i = 0; i < storeys - 3; i++) rows.push(wall);
  rows.push(base, 'plinth');
  return rows;
}
