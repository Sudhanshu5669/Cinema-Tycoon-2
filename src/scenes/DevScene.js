// Dev sandbox. A persistent scene for testing whatever system is being built,
// so no throwaway harness has to be rebuilt each time.
//
// The floor here is a placeholder drawn with Graphics, NOT the tile renderer —
// that is SYSTEMS #6 and has its own 3/4 perspective rules. There is no
// collision either (#7), so the player is only clamped to the world edges.
//
// The room is deliberately 3 x 3 screens: a camera that follows, holds a
// deadzone and stops at the world edge has nothing to prove in a room that
// fits on screen.

import Phaser from 'phaser';
import { INTERNAL_W, INTERNAL_H, TILE, SPRITE_W } from '../core/config.js';
import { Input, KeyboardSource, VirtualStickSource, isTouchDevice } from '../core/input/index.js';
import { Player, registerAnimations, TEXTURE } from '../game/player.js';
import { FollowCamera } from '../game/camera.js';

const WORLD_W = INTERNAL_W * 3;
const WORLD_H = INTERNAL_H * 3;

export class DevScene extends Phaser.Scene {
  constructor() { super('dev'); }

  preload() {
    this.load.spritesheet(TEXTURE, 'assets/player.png', {
      frameWidth: SPRITE_W,
      frameHeight: 48,
    });
  }

  create() {
    this.drawPlaceholderFloor();
    registerAnimations(this);

    this.input_ = new Input();
    this.input_.add(new KeyboardSource());
    // Present on every platform so gameplay never branches on device; only the
    // overlay that drives it (SYSTEMS #21) is mobile-only.
    this.stick = this.input_.add(new VirtualStickSource());

    this.player = new Player(this, WORLD_W / 2, WORLD_H / 2);
    this.cam = new FollowCamera(this, this.player, WORLD_W, WORLD_H);
    this.drawDeadzone();

    this.hud = this.add.text(6, 4, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e0e0e0',
    }).setScrollFactor(0).setDepth(100);

    this.exposeDevHooks();
    this.events.once('shutdown', () => this.input_.destroy());
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
    };
  }

  drawPlaceholderFloor() {
    this.cameras.main.setBackgroundColor('#3b3a40');
    const g = this.add.graphics();
    g.fillStyle(0x46454c, 1);
    for (let ty = 0; ty * TILE < WORLD_H; ty++) {
      for (let tx = 0; tx * TILE < WORLD_W; tx++) {
        if ((tx + ty) % 2 === 0) g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
    // A marker every four tiles, so a walk of known length can be eyeballed.
    g.fillStyle(0x5a5964, 1);
    for (let ty = 0; ty * TILE < WORLD_H; ty += 4) {
      for (let tx = 0; tx * TILE < WORLD_W; tx += 4) g.fillRect(tx * TILE, ty * TILE, 2, 2);
    }
    // Screen-sized blocks, so scrolling is obvious and it is clear at a glance
    // which of the nine screens you are standing on.
    g.lineStyle(1, 0x6c6b78, 1);
    for (let y = 0; y < WORLD_H; y += INTERNAL_H) {
      for (let x = 0; x < WORLD_W; x += INTERNAL_W) g.strokeRect(x + 0.5, y + 0.5, INTERNAL_W - 1, INTERNAL_H - 1);
    }
    // World edge, so the camera clamp is something you can see happen.
    g.fillStyle(0x2a2930, 1);
    g.fillRect(0, 0, WORLD_W, TILE);
    g.fillRect(0, WORLD_H - TILE, WORLD_W, TILE);
    g.fillRect(0, 0, TILE, WORLD_H);
    g.fillRect(WORLD_W - TILE, 0, TILE, WORLD_H);
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
      .setDepth(99);
  }

  /**
   * @param {number} _time
   * @param {number} delta milliseconds
   */
  update(_time, delta) {
    const dt = delta / 1000;
    this.input_.update();
    this.player.update(dt, this.input_);

    // No collision system yet — keep the player inside the world so the sandbox
    // cannot lose them off the map.
    const half = SPRITE_W / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x, half, WORLD_W - half);
    this.player.y = Phaser.Math.Clamp(this.player.y, 48, WORLD_H);

    // After the player has moved, so the camera never trails a frame behind.
    this.cam.update(dt);

    const a = this.input_.axis;
    const view = this.cameras.main;
    this.hud.setText([
      `axis   ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
      `face   ${this.player.facing}${this.player.moving ? ' (walking)' : ''}`,
      `feet   ${this.player.x.toFixed(1)} ${this.player.y.toFixed(1)}`,
      `scroll ${view.scrollX} ${view.scrollY}`,
      `touch  ${isTouchDevice() ? 'yes' : 'no'}`,
    ].join('\n'));
  }
}
