// Flat palette for the "tall figure" art direction (Metkis-style reference).
//
// This style has no procedural shading and no outline ring: every pixel is an
// exact authored colour. So the palette is a plain char -> hex map and a sprite
// grid is literally an indexed-colour image written as ASCII. That is a
// deliberate step back from the previous pipeline's material/shader model —
// there is nothing left for a shader to decide.
//
// Two tones per garment at most. The register is muted and slightly cool; the
// red is the only thing allowed to be saturated.

export const PALETTE = {
  h: '#2b2430', // hair
  H: '#3f3546', // hair, lit cap
  e: '#211c26', // eye — one pixel, no white, no catchlight

  k: '#cfa584', // skin
  K: '#a87f61', // skin, shaded (under the jaw, inside the arm)

  j: '#57483a', // jacket, torso
  c: '#6e5b47', // jacket, lit arm  — the three jacket tones have to be far
  J: '#3a2f26', // jacket, shaded arm   enough apart to separate arm from body
  //   at 1x, since there is no outline doing that job.

  s: '#cbc3ae', // shirt
  v: '#93403c', // the one saturated accent
  V: '#6f2f2d',

  p: '#3a3546', // trousers
  P: '#2c2836', // trousers, shaded edge
  q: '#242030', // trousers on the FAR leg — a full step below P, because the
  d: '#161219', //   profile's two stride frames are told apart by depth alone
  //   and P was too close to p to carry that on its own.

  b: '#2a2230', // shoe — the darkest thing on the figure, which is how the
  B: '#1d1720', // reference makes feet read. Pale shoes were a Stardew holdover
  //   and at this size they read as socks.
};
