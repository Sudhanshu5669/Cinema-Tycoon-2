// Dev sandbox. A persistent scene for testing whatever system is being built,
// so no throwaway harness has to be rebuilt each time.
//
// The floor is the real tile renderer (SYSTEMS #6) running the dev map, and
// the player resolves movement against its `solidAt` (SYSTEMS #7) — buildings
// block, everything else (open ground, a raised platform's top) does not. The
// world edges still get a plain clamp on top: solidAt reports false outside
// the map, so collision alone would let the player walk off it.
//
// The world is deliberately 3 x 3 screens: a camera that follows, holds a
// deadzone and stops at the world edge has nothing to prove in a room that
// fits on screen.

import Phaser from 'phaser';
import { INTERNAL_W, INTERNAL_H, SPRITE_W, SPRITE_H } from '../core/config.js';
import { Input, KeyboardSource, VirtualStickSource, isTouchDevice } from '../core/input/index.js';
import { Player, registerAnimations, TEXTURE } from '../game/player.js';
import { FollowCamera } from '../game/camera.js';
import { TileMapRenderer } from '../game/tilemap/renderer.js';
import { loadCityMap } from '../game/tilemap/mapLoader.js';
import { clockLabel } from '../game/tilemap/sun.js';
import { bakeOccludedLight } from '../game/occludedLight.js';

const WORLD_W = INTERNAL_W * 3;
const WORLD_H = INTERNAL_H * 3;
/** SYSTEMS #9: the city is a hand-editable JSON file, loaded like any other
 *  asset -- never a code change to add a building or move a streetlamp. */
const CITY_KEY = 'city';

/** Where the dev day starts: late afternoon, a long shadow to the east that
 *  agrees with the west-lit flat tiles. `__dev.setTime` / `__dev.autoTime`
 *  move it; a real day/night clock is SYSTEMS #16. */
const START_HOUR = 16;
/** Seconds of real time for a full 24h sweep when auto-advancing. */
const DAY_SECONDS = 120;

/**
 * Dev-only time-of-day hotkeys, so testing a system across the whole day
 * (shadows, #8's lighting) doesn't mean parking a console open. Digit row
 * keys, brackets and T -- nothing WASD/arrows already use for movement, so
 * this can read raw key codes directly without going anywhere near the
 * gameplay Input abstraction.
 */
const HOUR_PRESETS = {
  Digit1: 6, Digit2: 9, Digit3: 12, Digit4: 15, Digit5: 18, Digit6: 22,
};

export class DevScene extends Phaser.Scene {
  constructor() { super('dev'); }

  preload() {
    this.load.spritesheet(TEXTURE, 'assets/player.png', {
      frameWidth: SPRITE_W,
      frameHeight: 48,
    });
    TileMapRenderer.preload(this);
    this.load.json(CITY_KEY, 'assets/city.json');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1b1b22');
    // Bad data fails loudly here, at boot, naming the offending entry --
    // never silently three files deep inside the renderer.
    const cityMap = loadCityMap(this.cache.json.get(CITY_KEY), this);
    this.map = new TileMapRenderer(this, cityMap).build();
    this.hours = START_HOUR;
    this.autoTime = false;
    this.map.setHours(this.hours);
    registerAnimations(this);

    this.input_ = new Input();
    this.input_.add(new KeyboardSource());
    // Present on every platform so gameplay never branches on device; only the
    // overlay that drives it (SYSTEMS #21) is mobile-only.
    this.stick = this.input_.add(new VirtualStickSource());

    // On the pavement in front of the cinema, facing the street.
    this.player = new Player(this, 176, 360, (wx, wy) => this.map.solidAt(wx, wy));
    this.cam = new FollowCamera(this, this.player, WORLD_W, WORLD_H);
    this.drawDeadzone();

    // Depth sits above the renderer's overhead band so buildings never cover it.
    this.hud = this.add.text(6, 4, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e0e0e0',
    }).setScrollFactor(0).setDepth(1e6);

    this.buildLightingPrototype();
    this.exposeDevHooks();
    this.bindDevHotkeys();
    this.events.once('shutdown', () => {
      this.input_.destroy();
      this.map.destroy();
    });
  }

  /**
   * Test seam for tools/smoke.mjs. Stripped from production builds. It is
   * read-only apart from `warp`, which exists so the smoke test can reach a
   * world corner without walking fifteen seconds to get there; every assertion
   * after a warp still comes from real key events.
   */
  exposeDevHooks() {
    if (!import.meta.env.DEV) return;
    window.__dev = {
      ready: true,
      player: () => this.player,
      zoom: () => this.game.scale.zoom,
      world: () => ({ w: WORLD_W, h: WORLD_H }),
      state: () => ({
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        moving: this.player.moving,
        anim: this.player.sprite.anims.currentAnim?.key ?? null,
        frame: this.player.sprite.anims.currentFrame?.index ?? -1,
      }),
      camera: () => ({
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
        maxX: this.cam.maxX,
        maxY: this.cam.maxY,
        deadzone: this.cam.deadzone,
        // Where the player is drawn on screen, which is what the deadzone is
        // really a statement about.
        screenX: this.player.x - this.cameras.main.scrollX,
        screenY: this.player.y - this.cameras.main.scrollY,
      }),
      warp: (x, y) => {
        this.player.x = x;
        this.player.y = y;
        this.cam.snap();
      },
      // SYSTEMS #6. Screen rects and depths of the renderer's structures, so
      // the smoke test can warp the player behind and in front of a building
      // and assert the sort order without sampling pixels.
      tiles: () => ({
        pixelW: this.map.pixelWidth,
        pixelH: this.map.pixelHeight,
        playerDepth: this.player.sprite.depth,
        structures: this.map.structures,
        hours: this.hours,
        shadowAlpha: this.map.shadows?.image.alpha ?? 0,
        // Whether any roof cap or platform top is currently catching a
        // neighbour's cast shadow -- see shadows.js for the per-surface layers.
        roofShadowHit: this.map.shadows?.surfaceLayers.some((l) => l.image.visible) ?? false,
        // Whether the player's own shadow is currently climbing any wall --
        // see shadows.js's wallLayers / _paintOntoWalls.
        wallShadowHit: this.map.shadows?.wallLayers.some((l) => l.image.visible) ?? false,
        // SYSTEMS #8. `lightingActive` confirms Phaser's Light2D pipeline is
        // actually engaged (false would mean a silent Canvas-renderer
        // degrade, not a broken hour model) rather than reading window/
        // marquee intensity of 0 for the wrong reason.
        lightingActive: this.map.lighting?.active ?? false,
        // The tile atlas's normal map (tools/normals.mjs) actually bound,
        // not silently missing -- see TileMapRenderer#normalMapped.
        normalMapped: this.map.normalMapped,
        // Same, but for a baked composite (a building face, a roof) -- a
        // separate code path, see TileMapRenderer#bakedNormalMapped.
        bakedNormalMapped: this.map.bakedNormalMapped,
        ambientColor: this.map.lighting?.ambientColor ?? 0xffffff,
        windowGlow: this._lightIntensity('window'),
        marqueeGlow: this._lightIntensity('marquee'),
        streetlampGlow: this._lightIntensity('streetlamp'),
        // Total light points defined across the whole map vs. how many are
        // actually active in the shader for the current camera view --
        // SYSTEMS #8's maxLights cap culls to the nearest, so these two
        // numbers diverge the moment a map out-grows one screen of lights.
        totalLights: this.map.lighting?.lights.length ?? 0,
        // Identities (not just a count) of the lights the shader is actually
        // using this frame, so the smoke test can show the *set* changes with
        // the camera, not only how many are in it. getLights returns
        // { light, distance } wrappers, not the Light itself.
        activeLightKeys: this.map.lighting?.active
          ? this.lights.getLights(this.cameras.main).map((v) => `${v.light.x},${v.light.y}`).sort() : [],
      }),
      probe: (x, y) => ({
        height: this.map.heightAt(x, y),
        solid: this.map.solidAt(x, y),
      }),
      // Cast shadows are driven by this hour; a real day/night clock is #16.
      setTime: (h) => this._setHour(h),
      autoTime: (on) => { this.autoTime = on !== false; },
      // SYSTEMS #9. Validating a tile name needs the live atlas, so this half
      // of the loader's validation is only exercisable through a real scene.
      loadCityMap: (raw) => loadCityMap(raw, this),
      // The world-x's shadowed (opaque in the baked mask) in [x0, x1) along
      // one row -- how a sprite caster's shadow (SYSTEMS #8/#9's streetlamp)
      // is checked for actually being thin, without reading a screenshot.
      shadowRow: (y, x0, x1) => {
        const data = this.map.shadows.canvas.getContext().getImageData(x0, y, x1 - x0, 1).data;
        const xs = [];
        for (let i = 0; i < x1 - x0; i++) if (data[i * 4 + 3] > 0) xs.push(x0 + i);
        return xs;
      },
      // Alpha (0..1) of the player's own shadow canvas at a world-space
      // offset from the player's current position -- the player-shadow
      // canvas is recentred on the player every redraw, so this is always
      // "how dark is the ground `(dx, dy)` away from where I'm standing".
      playerShadowAt: (dx, dy) => {
        const c = this.map.shadows.playerCanvas;
        const half = c.width / 2;
        const x = Math.round(half + dx), y = Math.round(half + dy);
        if (x < 0 || y < 0 || x >= c.width || y >= c.height) return 0;
        return c.getContext().getImageData(x, y, 1, 1).data[3] / 255;
      },
      // Ground truth for the smoke test: a light's *bulb* position is a
      // renderer-internal offset from its map placement (near the top of a
      // streetlamp, not its base), so the test asks LightingLayer directly
      // rather than re-deriving that offset by hand. Flattened to plain
      // data (the light's ground anchor + its strength here), not the Light
      // instance itself -- the test wants a position and a number, not the
      // whole object.
      shadowSourcesAt: (px, py) => (this.map.lighting?.shadowSources(px, py) ?? [])
        .map(({ light, strength }) => ({ x: light.groundX, y: light.groundY, strength, kind: light.kind })),
    };
  }

  /** First live light of the given kind's current intensity, for the smoke
   *  test -- there being more than one (every building's windows) doesn't
   *  matter, they all share one hour-driven curve per kind. */
  _lightIntensity(kind) {
    const lighting = this.map.lighting;
    if (!lighting) return 0;
    return lighting.lights.find((l) => l.kind === kind)?.intensity ?? 0;
  }

  /** Jump straight to an hour -- shared by `__dev.setTime` and the hotkeys
   *  below, so there is exactly one place that wraps/clears autoTime. */
  _setHour(h) {
    this.autoTime = false;
    this.hours = ((h % 24) + 24) % 24;
    this.map.setHours(this.hours);
  }

  /**
   * Dev-only: 1-6 jump to a time-of-day preset (dawn/morning/noon/afternoon/
   * dusk/night), [ and ] step an hour at a time, T toggles auto-advancing.
   * Raw `keydown`, not the gameplay Input abstraction -- this is a developer
   * tool, not something a player action should ever read, the same reasoning
   * that already keeps the deadzone overlay and __dev behind
   * `import.meta.env.DEV`. Removed on shutdown like every other listener this
   * scene installs.
   */
  bindDevHotkeys() {
    if (!import.meta.env.DEV) return;
    const onKeyDown = (e) => {
      if (e.code in HOUR_PRESETS) this._setHour(HOUR_PRESETS[e.code]);
      else if (e.code === 'BracketLeft') this._setHour(this.hours - 1);
      else if (e.code === 'BracketRight') this._setHour(this.hours + 1);
      else if (e.code === 'KeyT') this.autoTime = !this.autoTime;
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onKeyDown));
  }

  /**
   * PROTOTYPE, not a real system yet -- src/game/occludedLight.js against a
   * tiny walled room with a doorway, to test occlusion-aware lighting
   * against the reference image the user asked about. Deliberately not
   * city.json data or a real TileMapRenderer structure: this is throwaway,
   * safe to delete entirely (this method + the import above) once a
   * direction is confirmed, without touching anything tested. No collision,
   * visual only -- it's here to answer "can the *look* be done", not to be a
   * walkable room.
   */
  buildLightingPrototype() {
    const ox = 1460, oy = 880; // open south pavement, clear of the platform, every streetlamp and the object layer's grass tuft
    const w = 180, h = 140, t = 8; // room interior size, wall thickness -- big enough that neither light floods it solid
    const doorX0 = 70, doorW = 28; // gap in the north wall -- the doorway

    const g = this.add.graphics().setDepth(oy + h);
    // Floor first, so the room reads as an enclosed space rather than just a
    // shape of light floating over open pavement.
    g.fillStyle(0x2a2530, 1);
    g.fillRect(ox, oy, w, h);
    g.fillStyle(0x54506a, 1); // walls: distinct from both the floor and the night sky behind them
    g.fillRect(ox, oy, doorX0, t); // north wall, left of the door
    g.fillRect(ox + doorX0 + doorW, oy, w - doorX0 - doorW, t); // north wall, right of the door
    g.fillRect(ox, oy + h - t, w, t); // south wall
    g.fillRect(ox, oy, t, h); // west wall
    g.fillRect(ox + w - t, oy, t, h); // east wall
    // A crate, to show *any* occluder works, not just the outer walls.
    const crate = { x: ox + w - 46, y: oy + h - 46, w: 20, h: 20 };
    g.fillStyle(0x3a2f28, 1);
    g.fillRect(crate.x, crate.y, crate.w, crate.h);

    const walls = [
      { x1: ox, y1: oy, x2: ox + doorX0, y2: oy },
      { x1: ox + doorX0 + doorW, y1: oy, x2: ox + w, y2: oy },
      { x1: ox, y1: oy + h, x2: ox + w, y2: oy + h },
      { x1: ox, y1: oy, x2: ox, y2: oy + h },
      { x1: ox + w, y1: oy, x2: ox + w, y2: oy + h },
      { x1: crate.x, y1: crate.y, x2: crate.x + crate.w, y2: crate.y },
      { x1: crate.x + crate.w, y1: crate.y, x2: crate.x + crate.w, y2: crate.y + crate.h },
      { x1: crate.x + crate.w, y1: crate.y + crate.h, x2: crate.x, y2: crate.y + crate.h },
      { x1: crate.x, y1: crate.y + crate.h, x2: crate.x, y2: crate.y },
    ];

    // The main light: at the doorway itself, as if spilling in from outside.
    bakeOccludedLight(this, {
      x: ox + doorX0 + doorW / 2, y: oy - 2,
      radius: 150, color: 0xffb060, segments: walls, intensity: 0.75, depth: oy + h + 1,
    });
    // A second, dimmer lantern inside the room -- shows the crate casting
    // its own shadow, and two occluded lights overlapping believably.
    bakeOccludedLight(this, {
      x: ox + 30, y: oy + h - 50,
      radius: 70, color: 0xffd8a0, segments: walls, intensity: 0.55, depth: oy + h + 1,
    });
  }

  /** Dev-only outline of the camera deadzone: the box the player moves inside
   *  before the world scrolls. Fixed to the screen, like the deadzone itself. */
  drawDeadzone() {
    if (!import.meta.env.DEV) return;
    const dz = this.cam.deadzone;
    this.add.graphics()
      .lineStyle(1, 0xffffff, 0.14)
      .strokeRect(dz.x + 0.5, dz.y + 0.5, dz.w - 1, dz.h - 1)
      .setScrollFactor(0)
      .setDepth(1e6 - 1);
  }

  /**
   * @param {number} _time
   * @param {number} delta milliseconds
   */
  update(_time, delta) {
    const dt = delta / 1000;
    this.input_.update();
    this.player.update(dt, this.input_);

    // Building collision is the player's own job now (SYSTEMS #7); this is
    // just the world edge, which solidAt has no opinion about.
    const half = SPRITE_W / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x, half, WORLD_W - half);
    this.player.y = Phaser.Math.Clamp(this.player.y, 48, WORLD_H);

    // After the player has moved, so the camera never trails a frame behind.
    this.cam.update(dt);

    if (this.autoTime) this.hours = (this.hours + dt * (24 / DAY_SECONDS)) % 24;
    // Cheap when the hour has not moved into a new bake bucket.
    this.map.setHours(this.hours);
    // The player's own shadow(s) -- from the sun and from nearby point
    // lights. Runs every frame; ShadowLayer.updatePlayer throttles its own
    // redraw, this doesn't need to.
    this.map.updatePlayer(this.player.x, this.player.y, this.player.sprite.frame.name, SPRITE_H);

    const a = this.input_.axis;
    const view = this.cameras.main;
    this.hud.setText([
      `axis   ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
      `face   ${this.player.facing}${this.player.moving ? ' (walking)' : ''}`,
      `feet   ${this.player.x.toFixed(1)} ${this.player.y.toFixed(1)}`,
      `scroll ${view.scrollX} ${view.scrollY}`,
      `time   ${clockLabel(this.hours)}${this.autoTime ? ' (auto)' : ''}`,
      `touch  ${isTouchDevice() ? 'yes' : 'no'}`,
      ...(import.meta.env.DEV ? ['1-6 time  [ ] step  T auto'] : []),
    ].join('\n'));
  }
}
