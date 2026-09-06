// Marquee bulb chase -- the running lights around a signboard.
//
// A cinema front that does not move is a painting of a cinema front. Of
// everything on this facade the chase is the one animation worth having
// first, because it is the thing a real marquee does that nothing else on a
// street does: the bulbs are already the brightest pixels in the palette, and
// making them travel is what separates "a sign" from "a sign that is switched
// on".
//
// This does not re-bake anything. The bulbs are authored art
// (`art/flat/tiles.mjs`'s SIGN_BULB) already composited into each panel's own
// canvas by renderer.js's _paintSign, and repainting that canvas every frame
// to move a highlight would be the expensive, obvious mistake -- it is the
// same GPU-readback trap atlas.js's header warns about, just on a timer. The
// chase is instead an ADD-blended dot parked over each baked bulb, reusing
// glow.js's own gradient bake, whose alpha is the only thing that changes.
// So the whole effect is one alpha write per bulb per frame and no texture
// traffic at all.
//
// The travelling pattern runs in real time, not on the hour clock, but its
// *brightness* is scaled by the marquee's hour curve (sun.js's glowFor), so
// the bulbs are dark all day, come up with the rest of the signage at dusk,
// and the whole layer switches itself off -- invisible, therefore never
// batched -- for the two thirds of the day the sign is not lit.

import Phaser from 'phaser';
import { bakeGradient } from '../glow.js';
import { glowFor } from './sun.js';
import { DEPTH_OVERHEAD } from './projection.js';

/** Radius of one bulb's halo, world px. A shade over the 8px bulb itself, so
 *  a lit bulb blooms just past its own glass instead of ending on the hard
 *  edge of the authored art -- which is the tell that a bright pixel is paint
 *  rather than a light. Under the 8px bulb pitch on purpose: at or above it
 *  neighbouring halos merge and the frame becomes one continuous bar of
 *  light, which loses the individual bulbs the chase is travelling over. */
const BULB_GLOW_R = 6;

/** Bulbs lit per pulse, counted around the perimeter, and how many bulbs the
 *  pattern travels per second. Three-on is the pattern real chasers use; the
 *  speed is fast enough to read as movement from across the street and slow
 *  enough not to strobe at 60fps. */
const GROUP = 3;
const SPEED = 7.5;

/** Alpha of a bulb at the dim and bright ends of the chase, before the hour's
 *  own intensity scales both. The floor is deliberately well above zero: on a
 *  real marquee every bulb is lit and the chase is a brightness wave passing
 *  over them, not bulbs switching on and off, and a chase that goes to black
 *  reads as a fault rather than as an effect. */
const DIM = 0.16;
const BRIGHT = 0.72;

export class BulbChase {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x: number, y: number}[][]} rings one list of world-space bulb
   *   centres per board, each already in perimeter order (see renderer.js's
   *   _paintSign) -- a board is one ring, and each ring runs its own chase
   *   from its own bulb 0, so two boards on the same facade do not have to
   *   share a phase or a bulb count.
   */
  constructor(scene, rings) {
    this.scene = scene;
    this.active = scene.renderer?.type === Phaser.WEBGL;
    /** @type {{images: Phaser.GameObjects.Image[]}[]} */
    this.rings = [];
    this._lit = 0;
    if (!this.active) return;

    const key = bakeGradient(scene, 'glow-bulb', BULB_GLOW_R);
    for (const ring of rings) {
      const images = ring.map((b) => scene.add.image(b.x, b.y, key)
        .setBlendMode(Phaser.BlendModes.ADD)
        // Over the board it sits on. A board is already DEPTH_OVERHEAD, so
        // its own bulbs have to clear that; nothing else in the scene lives
        // above the overhead band.
        .setDepth(DEPTH_OVERHEAD + 1)
        .setVisible(false));
      this.rings.push({ images });
    }
  }

  /** @param {number} hours 0..24 -- gates the whole layer on the marquee's
   *   own switch-on curve, so this needs no separate day/night logic. */
  setHours(hours) {
    if (!this.active) return;
    const { color, intensity } = glowFor(hours, 'marquee');
    this._lit = intensity;
    const on = intensity > 0.004;
    for (const ring of this.rings) {
      for (const img of ring.images) {
        img.setVisible(on);
        if (on) img.setTint(color);
      }
    }
  }

  /**
   * @param {number} timeMs the scene clock. Real time rather than the hour
   *   model: the hour decides whether the sign is lit, this decides where the
   *   pulse currently is, and the two are independent -- scrubbing time of day
   *   should not make the chase run backwards.
   */
  update(timeMs) {
    if (!this.active || this._lit <= 0.004) return;
    const t = (timeMs / 1000) * SPEED;
    for (const ring of this.rings) {
      const n = ring.images.length;
      if (!n) continue;
      for (let i = 0; i < n; i++) {
        // Position of this bulb within the travelling pattern, in bulbs.
        // Modulo the group length, so the pattern repeats every GROUP bulbs
        // all the way around; modulo `n` first would make the wave restart at
        // the seam wherever the ring's bulb count is not a multiple of GROUP.
        const phase = (((i - t) % GROUP) + GROUP) % GROUP;
        // A raised cosine over the group: one pulse per GROUP bulbs,
        // continuous across the wrap. Note the ring shows exactly GROUP
        // distinct brightnesses at any one instant (bulb indices are whole
        // numbers), which is right -- that IS a three-bulb chase. The
        // continuity that matters is in *time*: each bulb ramps smoothly
        // between those levels rather than switching, so the pattern slides
        // along the frame instead of stepping around it.
        const wave = 0.5 + 0.5 * Math.cos((phase / GROUP) * Math.PI * 2);
        ring.images[i].setAlpha((DIM + (BRIGHT - DIM) * wave) * this._lit);
      }
    }
  }

  destroy() {
    for (const ring of this.rings) for (const img of ring.images) img.destroy();
    this.rings.length = 0;
  }
}
