// Dev sandbox. A persistent scene for testing whatever system is being built,
// so no throwaway harness has to be rebuilt each time.
//
// The floor here is a placeholder drawn with Graphics, NOT the tile renderer —
// that is SYSTEMS #6 and has its own 3/4 perspective rules. There is no
// collision either (#7), so the player is only clamped to the room edges.

import Phaser from 'phaser';
import { INTERNAL_W, INTERNAL_H, TILE, SPRITE_W } from '../core/config.js';
import { Input, KeyboardSource, VirtualStickSource, isTouchDevice } from '../core/input/index.js';
import { Player, registerAnimations, TEXTURE } from '../game/player.js';

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

    this.player = new Player(this, INTERNAL_W / 2, INTERNAL_H / 2 + 40);

    this.hud = this.add.text(6, 4, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e0e0e0',
    }).setScrollFactor(0);

    this.exposeDevHooks();
    this.events.once('shutdown', () => this.input_.destroy());
  }

  /**
   * Test seam for tools/smoke.mjs. Stripped from production builds, and it only
   * ever reads state — the smoke test drives the game through real key events,
   * so what it verifies is the same path a player takes.
   */
  exposeDevHooks() {
    if (!import.meta.env.DEV) return;
    window.__dev = {
      ready: true,
      player: () => this.player,
      zoom: () => this.game.scale.zoom,
      state: () => ({
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        moving: this.player.moving,
        anim: this.player.sprite.anims.currentAnim?.key ?? null,
        frame: this.player.sprite.anims.currentFrame?.index ?? -1,
      }),
    };
  }

  drawPlaceholderFloor() {
    this.cameras.main.setBackgroundColor('#3b3a40');
    const g = this.add.graphics();
    g.fillStyle(0x46454c, 1);
    for (let ty = 0; ty * TILE < INTERNAL_H; ty++) {
      for (let tx = 0; tx * TILE < INTERNAL_W; tx++) {
        if ((tx + ty) % 2 === 0) g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
    // A marker every four tiles, so a walk of known length can be eyeballed.
    g.fillStyle(0x5a5964, 1);
    for (let ty = 0; ty * TILE < INTERNAL_H; ty += 4) {
      for (let tx = 0; tx * TILE < INTERNAL_W; tx += 4) g.fillRect(tx * TILE, ty * TILE, 2, 2);
    }
  }

  /**
   * @param {number} _time
   * @param {number} delta milliseconds
   */
  update(_time, delta) {
    const dt = delta / 1000;
    this.input_.update();
    this.player.update(dt, this.input_);

    // No collision system yet — keep the player inside the room so the sandbox
    // cannot lose them off-screen.
    const half = SPRITE_W / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x, half, INTERNAL_W - half);
    this.player.y = Phaser.Math.Clamp(this.player.y, 48, INTERNAL_H);

    const a = this.input_.axis;
    this.hud.setText([
      `axis  ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
      `face  ${this.player.facing}${this.player.moving ? ' (walking)' : ''}`,
      `feet  ${this.player.x.toFixed(1)} ${this.player.y.toFixed(1)}`,
      `touch ${isTouchDevice() ? 'yes' : 'no'}`,
    ].join('\n'));
  }
}
