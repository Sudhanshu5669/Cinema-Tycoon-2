// The scene lighting pass — the fourth Eastward discipline from GAME_SPEC.
//
// Sprites and tiles are authored under neutral light. At runtime a separate
// pass accumulates coloured lights over the frame and multiplies the result in.
// This is what turns a flat tileset into the reference's warm/cool interiors,
// and it is the same maths the Phaser shader will run per frame.

/**
 * @param {Bitmap} bmp
 * @param {{x:number,y:number,w:number,h:number}} rect  region to light
 * @param {[number,number,number]} ambient              base multiplier (cool + dim)
 * @param {{x:number,y:number,radius:number,color:number[],intensity:number}[]} lights
 */
export function applyLighting(bmp, rect, ambient, lights) {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const px = bmp.get(x, y);
      if (px[3] === 0) continue;
      let m = [ambient[0], ambient[1], ambient[2]];
      for (const L of lights) {
        const d = Math.hypot(x - L.x, y - L.y) / L.radius;
        if (d >= 1) continue;
        const f = (1 - d * d) * (1 - d * d) * L.intensity;   // smooth quadratic falloff
        m[0] += L.color[0] * f; m[1] += L.color[1] * f; m[2] += L.color[2] * f;
      }
      bmp.set(x, y, [
        Math.min(255, Math.round(px[0] * m[0])),
        Math.min(255, Math.round(px[1] * m[1])),
        Math.min(255, Math.round(px[2] * m[2])),
        255,
      ]);
    }
  }
}

export const MOODS = {
  neutral: { label: 'AS AUTHORED', ground: [132, 130, 134], ambient: [1, 1, 1], lights: [] },
  day: {
    label: 'DAYTIME',
    ground: [118, 152, 92],
    ambient: [1.02, 1.00, 0.92],
    lights: [{ rx: 0.30, ry: 0.05, radius: 1.3, color: [0.22, 0.16, 0.05], intensity: 1.0 }],
  },
  evening: {
    label: 'EVENING',
    ground: [66, 70, 102],
    ambient: [0.52, 0.52, 0.84],
    lights: [{ rx: 0.82, ry: 0.34, radius: 0.9, color: [1.05, 0.70, 0.32], intensity: 1.0 }],
  },
};
