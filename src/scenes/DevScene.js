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
import { INTERNAL_W, INTERNAL_H, SPRITE_W } from '../core/config.js';
import { Input, KeyboardSource, VirtualStickSource, isTouchDevice } from '../core/input/index.js';
import { Player, registerAnimations, TEXTURE } from '../game/player.js';
import { FollowCamera } from '../game/camera.js';
import { TileMapRenderer } from '../game/tilemap/renderer.js';
import { loadCityMap } from '../game/tilemap/mapLoader.js';
import { clockLabel } from '../game/tilemap/sun.js';

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

    this.exposeDevHooks();
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
        // SYSTEMS #8. `lightingActive` confirms Phaser's Light2D pipeline is
        // actually engaged (false would mean a silent Canvas-renderer
        // degrade, not a broken hour model) rather than reading window/
        // marquee intensity of 0 for the wrong reason.
        lightingActive: this.map.lighting?.active ?? false,
        ambientColor: this.map.lighting?.ambientColor ?? 0xffffff,
        windowGlow: this._lightIntensity('window'),
        marqueeGlow: this._lightIntensity('marquee'),
        streetlampGlow: this._lightIntensity('streetlamp'),
        // Total light points defined across the whole map vs. how many are
        // actually active in the shader for the current camera view --
        // SYSTEMS #8's maxLights cap culls to the nearest, so these two
        // numbers diverge the moment a map out-grows one screen of lights.
        totalLights: this.map.lighting?.points.length ?? 0,
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
      setTime: (h) => {
        this.autoTime = false;
        this.hours = ((h % 24) + 24) % 24;
        this.map.setHours(this.hours);
      },
      autoTime: (on) => { this.autoTime = on !== false; },
      // SYSTEMS #9. Validating a tile name needs the live atlas, so this half
      // of the loader's validation is only exercisable through a real scene.
      loadCityMap: (raw) => loadCityMap(raw, this),
    };
  }

  /** First live light of the given kind's current intensity, for the smoke
   *  test -- there being more than one (every building's windows) doesn't
   *  matter, they all share one hour-driven curve per kind. */
  _lightIntensity(kind) {
    const lighting = this.map.lighting;
    if (!lighting) return 0;
    const i = lighting.points.findIndex((p) => p.kind === kind);
    return i === -1 ? 0 : lighting.lights[i].intensity;
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

    const a = this.input_.axis;
    const view = this.cameras.main;
    this.hud.setText([
      `axis   ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
      `face   ${this.player.facing}${this.player.moving ? ' (walking)' : ''}`,
      `feet   ${this.player.x.toFixed(1)} ${this.player.y.toFixed(1)}`,
      `scroll ${view.scrollX} ${view.scrollY}`,
      `time   ${clockLabel(this.hours)}${this.autoTime ? ' (auto)' : ''}`,
      `touch  ${isTouchDevice() ? 'yes' : 'no'}`,
    ].join('\n'));
  }
}
