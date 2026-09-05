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
import { measureWidth, CHAR_H } from './font.js';
import {
  BULB, SIGN_LINE_GAP, SIGN_GOLD, SIGN_FIELD_COLOR, SIGN_BACK_COLOR,
  signLines, signBlockHeight, signLineWidth,
} from './sign.js';
import { ShadowLayer } from './shadows.js';
import { LightingLayer, wireLight } from '../lighting.js';

/** Small plaque label on a booth/stand -- TICKET, CANDY. Not a per-cinema
 *  identity like the marquee name; universal fixture signage, so it's fixed
 *  here rather than authored per building. `y` is where that tile's own art
 *  leaves a dark board clear for it: the booth's is at the very top, the
 *  candy stand's sits below its striped hood, so a single shared offset
 *  would print one of them straight onto the stripes. */
const FACADE_LABELS = {
  boxOffice: { text: 'TICKET', y: 2 },
  candyStand: { text: 'CANDY', y: 8 },
};
const LABEL_SCALE = 1;
const PLAQUE_BG_COLOR = '#201c26';

/** The recessed alcove a theatre door bank sits in -- drawn behind the door
 *  tile, slightly larger on every side but the bottom (which meets the
 *  threshold), so the doorway reads as a real inset rather than glued flat to
 *  the wall. The bottom band of that recess is warm: a lit lobby is behind
 *  those doors, and the light it spills across the threshold is what makes an
 *  entrance read as open. */
const ALCOVE_COLOR = '#1b1218';
const ALCOVE_GLOW_COLOR = '#ffca7d';  // palette '@'
const ALCOVE_MARGIN = 4;

/** Facade tiles whose own art is lit from inside, and the kind of light each
 *  one therefore registers. The kiosks and the poster case are on this list
 *  because their art *is* lit: a glowing booth that throws no light on the
 *  pavement in front of it reads as a sticker, not as a lamp. The door bank
 *  gets its own `lobby` kind -- a doorway is a wide, warm, comparatively
 *  gentle wash, not a point source, and giving it a window's curve is what
 *  previously produced a blown-out blob at the entrance. */
const LIT_FACADE = {
  window: 'window', windowWide: 'window',
  boxOffice: 'window', candyStand: 'window', posterCase: 'window',
  cinemaDoors: 'lobby',
};

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
    /** Building/platform front walls the player's own shadow can climb --
     *  see shadows.js's wallFaces param and _paintOntoWalls. */
    this._wallFaces = [];
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

  /** True once the tile atlas's normal map actually loaded and attached --
   *  the regression guard for tools/normals.mjs's whole premise: a broken or
   *  missing load here doesn't error, it just silently degrades every tile
   *  back to flat-facing-camera lighting, exactly the "no relief" failure
   *  this system exists to fix. */
  get normalMapped() {
    return (this.scene.textures.get(TILES_KEY).dataSource?.length ?? 0) > 0;
  }

  /** Same guard, but for a *baked* composite (a building face, a roof, the
   *  ground) rather than the raw atlas -- a separate code path (atlas.js's
   *  bake() re-attaching the normal map via Texture#setDataSource once
   *  painting is done) that the check above can't see: the atlas load could
   *  succeed while a bake still drops it. True if any baked object's own
   *  texture carries a normal map. */
  get bakedNormalMapped() {
    return this.objects.some((o) => (
      typeof o.texture?.key === 'string' && o.texture.key.startsWith('tilebake-')
      && (o.texture.dataSource?.length ?? 0) > 0
    ));
  }

  // --- build -------------------------------------------------------------

  build() {
    if (!tilesReady(this.scene)) throw new Error('tile atlas not loaded -- call TileMapRenderer.preload in preload()');
    this._buildGround();
    for (const p of this.map.platforms ?? []) this._buildPlatform(p);
    for (const b of this.map.buildings ?? []) this._buildBuilding(b);
    for (const s of this.map.streetlamps ?? []) this._buildStreetlamp(s);
    this._buildLoose();
    this.shadows = new ShadowLayer(
      this.scene, this._casters, this._spriteCasters, this._surfaces, this._wallFaces,
      this.pixelWidth, this.pixelHeight,
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

  /**
   * The player's own shadow(s) -- from the sun, same as everything else, and
   * from whichever nearby point lights are actually lighting them right now.
   * Call every frame; both layers underneath throttle their own redraws.
   * @param {number} px @param {number} py world position (origin 0.5, 1)
   * @param {string} frameName current sprite frame, e.g. `sprite.frame.name`
   * @param {number} heightPx the player sprite's height
   */
  updatePlayer(px, py, frameName, heightPx) {
    const sources = this.lighting?.shadowSources(px, py) ?? [];
    this.shadows?.updatePlayer(px, py, frameName, heightPx, this.hours, sources);
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
    this._wallFaces.push({ x0: p.x * TILE, x1: (p.x + p.w) * TILE, faceTop, frontY });

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
    const rows = faceRowPlan(storeys, {
      wall: b.face ?? 'wall', base: b.base ?? 'brick',
      cornice: b.cornice ?? 'cornice', plinth: b.plinth ?? 'plinth',
    });
    const faceKey = bake(this.scene, b.w * TILE, faceH, (g) => {
      rows.forEach((frame, r) => g.fill(frame, 0, r * TILE, b.w * TILE, TILE));
      for (const d of b.facade ?? []) {
        const size = frameSize(this.scene, d.tile);
        const localY = faceH - (d.fy ?? 0) * TILE - size.h;
        const localX = d.fx * TILE;

        // A theatre door bank sits recessed, not glued flat to the wall: a
        // dark alcove drawn first, wider on every side but the bottom (which
        // meets the threshold, already its own plinth-matched tone), then the
        // doors on top of it. The bottom band of that recess is warm rather
        // than dark -- the lobby behind the doors is lit, and light crossing
        // the threshold is what makes an entrance read as open instead of
        // shuttered. Drawn art, not shader output: a point light alone gave a
        // blown-out blob with no shape to it.
        if (d.tile === 'cinemaDoors') {
          g.rect(ALCOVE_COLOR, localX - ALCOVE_MARGIN, localY - ALCOVE_MARGIN,
            size.w + ALCOVE_MARGIN * 2, size.h + ALCOVE_MARGIN);
          // Warm reveals down each side of the bank -- light escaping around
          // the door frame. This was a band across the *foot* of the alcove
          // first, which the doors' own threshold row covers everywhere
          // except the four pixels either side of them: what actually reached
          // the screen was one isolated bright dot at each corner, not a lit
          // threshold. Down the reveals it has somewhere to be seen.
          for (const rx of [localX - ALCOVE_MARGIN, localX + size.w]) {
            g.rect(ALCOVE_GLOW_COLOR, rx, localY, ALCOVE_MARGIN, size.h - 2);
          }
        }
        g.tile(d.tile, localX, localY);

        // Every lit opening doubles as a light source -- derived here, not
        // authored twice, since this is already the one place that turns a
        // facade entry's (fx, fy) into a real position. The kiosks are on
        // this list because their own art is lit from inside: a glowing
        // booth that casts no light on the pavement in front of it reads as
        // a sticker, not a lamp.
        if (LIT_FACADE[d.tile]) {
          this._lights.push({
            x: b.x * TILE + localX + size.w / 2,
            y: faceTop + localY + size.h / 2,
            // Ground anchor, for casting the player's shadow away from this
            // light -- straight down the wall to the pavement, not the
            // window's own (possibly upper-storey) position. Using the glow
            // position itself here would mean a light mounted high up reads
            // as standing further back than it really is on the ground, and
            // skews the shadow's direction to match -- see gy on the
            // streetlamp below for the same mistake, actually made once.
            gx: b.x * TILE + localX + size.w / 2, gy: frontY,
            kind: LIT_FACADE[d.tile],
          });
        }

        // Universal fixture signage (TICKET, CANDY) -- not the cinema's own
        // identity like the marquee name, so it's a fixed label per tile kind
        // rather than authored per building. A small dark plaque behind the
        // text, the same idea the reference's own booth/stand plates use.
        // **Bug caught against a screenshot**: a first pass floated this just
        // *above* the tile's own top edge, which for these two tiles is
        // exactly where the awning sits -- a separate object placed later at
        // a higher depth, so it silently painted over the plaque every time.
        // Drawn inside the tile's own art instead, on the dark board each one
        // leaves clear for it (FACADE_LABELS carries that per-tile offset),
        // it can't be hidden by anything placed above this facade canvas.
        const label = FACADE_LABELS[d.tile];
        if (label) {
          const tw = measureWidth(label.text, LABEL_SCALE);
          const th = CHAR_H * LABEL_SCALE;
          const plaqueH = th + 4;
          const plaqueY = localY + label.y;
          g.rect(PLAQUE_BG_COLOR, localX, plaqueY, size.w, plaqueH);
          g.text(label.text, localX + (size.w - tw) / 2, plaqueY + 2, LABEL_SCALE, SIGN_GOLD);
        }
      }
    });
    this._place(faceKey, b.x * TILE, faceTop, frontY);
    this._wallFaces.push({ x0: b.x * TILE, x1: (b.x + b.w) * TILE, faceTop, frontY });

    // Awning -- overhead, so the player walks under it. Doubles as the
    // marquee light: the one saturated colour accent on the street. `tile`
    // defaults to the generic striped canopy any shopfront can use; a
    // building that wants to read as a cinema specifically (its own
    // identity, not just "a shopfront") sets it to 'marquee' instead --
    // same footprint and light, a bulb-trimmed canopy tile in its place.
    // `h` (tiles, default 1) grows the canopy itself downward from the same
    // top edge. Plain, textless canopy -- per the user's reference image, the
    // cinema's own name is its own separate signboard (`b.panels`, below),
    // not fused onto the stripes; a first pass baked the name straight onto
    // this tile and it read as cluttered next to the reference.
    if (b.awning) {
      const awH = (b.awning.h ?? 1) * TILE;
      const awW = b.awning.fw * TILE;
      const awKey = bake(this.scene, awW, awH, (g) => g.fill(b.awning.tile ?? 'awning', 0, 0, awW, awH));
      const awY = frontY - (b.awning.up ?? 3) * TILE;
      this._place(awKey, (b.x + b.awning.fx) * TILE, awY, DEPTH_OVERHEAD);
      this._lights.push({
        x: (b.x + b.awning.fx) * TILE + awW / 2,
        y: awY + awH / 2,
        gx: (b.x + b.awning.fx) * TILE + awW / 2, gy: frontY,
        kind: 'marquee',
      });
    }

    // Bulb-framed signboards -- the cinema's own name, a reader board (what's
    // showing), or any future panel: one generic shape (`panels`, a list),
    // not a hardcoded field per sign. None of these are authored atlas tiles;
    // signage whose whole point is data-driven text has no business being
    // repeating tile art. What *is* atlas art is the bulb (`signBulb`), which
    // `_paintSign` steps around whatever size the data asks for -- a board's
    // width is a `city.json` field, so its bulb count cannot be baked in.
    //
    // A previous pass drew these as a plain bordered rectangle with a line of
    // small text floating in the middle, which is not a marquee and could not
    // become one by recolouring: a cinema's boards are *lit objects* -- a
    // frame of bulbs, a deep field, and display lettering big enough to read
    // across a street.
    for (const p of b.panels ?? []) {
      const pw = p.fw * TILE, ph = (p.h ?? 1) * STEP;
      const panelKey = bake(this.scene, pw, ph, (g) => this._paintSign(g, pw, ph, p));
      const pTop = frontY - (p.up ?? storeys) * TILE;
      this._place(panelKey, (b.x + p.fx) * TILE, pTop, DEPTH_OVERHEAD);
      this._lights.push({
        x: (b.x + p.fx) * TILE + pw / 2,
        y: pTop + ph / 2,
        gx: (b.x + p.fx) * TILE + pw / 2, gy: frontY,
        kind: 'marquee',
      });
    }

    // A vertical blade sign -- the cinema's own identity marker. `sign.h`
    // tiles of repeating tower under one capping tile.
    //
    // `up` mounts it on the *facade*, its foot that many tiles above the
    // pavement, the way a real cheap cinema hangs a blade off the wall beside
    // its marquee. Without `up` it stacks off the roofline instead, which is
    // what it used to do unconditionally -- and on any building tall enough
    // to want a blade sign, that put the whole thing above the top of the
    // frame: 32 rows of authored art the player could never see from the
    // street it faces. Roof-stacking is still available for a low building
    // where it genuinely reads; it just isn't the only option any more.
    //
    // Its own light is a second `marquee` point, independent of the canopy's
    // -- a tall sign glows along its own height, not just at the canopy line.
    if (b.sign) {
      const bodyH = (b.sign.h ?? 4) * STEP;
      const capH = TILE;
      const signX = (b.x + b.sign.fx) * TILE;
      const bottomY = b.sign.up !== undefined ? frontY - b.sign.up * TILE : roofY;
      const bodyY = bottomY - bodyH;
      const capY = bodyY - capH;
      const bodyKey = bake(this.scene, TILE, bodyH, (g) => g.fill('signTower', 0, 0, TILE, bodyH));
      this._place(bodyKey, signX, bodyY, DEPTH_OVERHEAD);
      const capKey = bake(this.scene, TILE, capH, (g) => g.fill('signCap', 0, 0, TILE, capH));
      this._place(capKey, signX, capY, DEPTH_OVERHEAD);
      this._lights.push({
        x: signX + TILE / 2,
        y: bodyY + bodyH / 2,
        gx: signX + TILE / 2, gy: frontY,
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
   * Paint one signboard into a bake: a dark rebate, a frame of bulbs stepped
   * around its whole perimeter, a gold pinstripe, the field, then the text.
   *
   * Text is a list of lines (`p.lines`), each with its own scale, colour and
   * face, so one board can set a small label over a big title the way a real
   * reader board does -- `p.text` is still accepted as the one-line shorthand.
   * The block is centred vertically in the field and each line centred
   * horizontally, so nothing has to be positioned by hand in the data.
   *
   * @param {object} g the bake painter (see atlas.js)
   * @param {number} w @param {number} h panel size in px
   * @param {object} p the panel's own `city.json` entry
   */
  _paintSign(g, w, h, p) {
    g.rect(SIGN_BACK_COLOR, 0, 0, w, h);
    g.rect(p.border ?? SIGN_GOLD, BULB - 1, BULB - 1, w - (BULB - 1) * 2, h - (BULB - 1) * 2);
    g.rect(p.bg ?? SIGN_FIELD_COLOR, BULB, BULB, w - BULB * 2, h - BULB * 2);

    // Bulbs around all four edges. The corners are covered by the horizontal
    // runs, so the vertical ones start and stop one bulb in.
    for (let x = 0; x + BULB <= w; x += BULB) {
      g.tile('signBulb', x, 0);
      g.tile('signBulb', x, h - BULB);
    }
    for (let y = BULB; y + BULB <= h - BULB; y += BULB) {
      g.tile('signBulb', 0, y);
      g.tile('signBulb', w - BULB, y);
    }

    const lines = signLines(p);
    if (!lines.length) return;
    let ty = Math.round((h - signBlockHeight(lines)) / 2);
    for (const l of lines) {
      g.text(l.text, Math.round((w - signLineWidth(l)) / 2), ty, l.scale, l.color, l.font);
      ty += (signBlockHeight([l])) + SIGN_LINE_GAP;
    }
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
      // Ground anchor: the pole's own base, not the elevated bulb above.
      // A bulb sitting up near the top of the post is still standing over
      // the same patch of ground the pole meets -- using its screen y (well
      // north of the base, being higher up the pole) as if that were where
      // the light stood would make the player's shadow point away from a
      // spot several tiles further back than the lamp really is, visibly
      // wrong the moment the player stands right next to the post itself.
      gx: p.x * TILE + TILE / 2, gy: baseY,
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
 *
 * **Follow-up from user review**, "not enough depth to the building tiles":
 * a plaster wall run four rows or taller gets one middle row swapped for
 * `beltCourse` -- the same light-lip/hard-shadow idea the cornice already
 * carries, repeated partway up the facade so a tall run of identical wall
 * rows reads as two storeys instead of one flat plane. Row count and total
 * height are untouched (this replaces a row's content, not its slot), and
 * it's plaster-only: a brick facade already breaks up its own flat run via
 * coursing, and this ledge is coloured for plaster, so it would read as a
 * mismatch dropped into a brick wall rather than a floor division.
 */
function faceRowPlan(storeys, { wall, base, cornice = 'cornice', plinth = 'plinth' }) {
  if (storeys <= 1) return [cornice];
  if (storeys === 2) return [cornice, plinth];
  if (storeys === 3) return [cornice, base, plinth];
  const wallRows = storeys - 3;
  const rows = [cornice];
  for (let i = 0; i < wallRows; i++) rows.push(wall);
  if (wall === 'wall' && wallRows >= 4) rows[1 + Math.floor(wallRows / 2)] = 'beltCourse';
  rows.push(base, plinth);
  return rows;
}
