import Phaser from 'phaser';
import { INTERNAL_W, INTERNAL_H } from './core/config.js';
import { DevScene } from './scenes/DevScene.js';

/**
 * GAME_SPEC locks presentation to an integer scale with nearest-neighbour
 * filtering. Phaser's FIT mode would scale to a fraction of a pixel and make the
 * art shimmer as the camera moves, so the zoom is computed by hand instead:
 * the largest whole number of screen pixels per game pixel that still fits.
 */
function integerZoom() {
  const fit = Math.min(window.innerWidth / INTERNAL_W, window.innerHeight / INTERNAL_H);
  return Math.max(1, Math.floor(fit));
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: INTERNAL_W,
  height: INTERNAL_H,
  parent: document.body,
  backgroundColor: '#0d0f13',
  pixelArt: true,   // nearest-neighbour, no antialiasing
  roundPixels: true, // draw sprites on whole pixels
  // SYSTEMS #8's lighting layer is one Phaser Light per window/marquee; the
  // default cap of 10 is well under a single building's own window count.
  // 64 comfortably covers the dev map today with room for more streets --
  // raise again if a future map's on-screen light count actually needs it.
  render: { maxLights: 16 },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: integerZoom(),
  },
  scene: [DevScene],
});

window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));
