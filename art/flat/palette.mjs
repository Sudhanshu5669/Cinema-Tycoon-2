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

/**
 * Tile palette. A separate namespace from the character one on purpose: `h` is
 * hair on a person and has no business meaning anything on a pavement, and the
 * two sets would otherwise fight over sixteen usable letters.
 *
 * Same discipline as the figures — no outlines, at most two tones for a
 * material, muted and slightly cool. The one place tones go three deep is where
 * a surface turns a corner in the 3/4 view (roof -> lip -> shadow -> wall),
 * because that turn is the only thing telling the player a building has a face
 * at all. Light still comes from the left, but a wall's shading belongs to the
 * BUILDING, not to the tile: a per-tile shaded edge would repeat every 16px and
 * read as stripes, so the shaded side is its own tile (`WALL_EDGE`).
 */
export const TILE_PALETTE = {
  // Road.
  a: '#34343e', // asphalt
  A: '#3c3c47', // asphalt, lighter fleck — worn patches, not noise
  z: '#2c2c35', // asphalt, darker fleck
  m: '#8a8678', // lane marking, worn. Never white; white reads as neon here

  // Kerb: the small vertical face where the pavement drops to the road, and
  // the first thing that sells the 3/4 view at ground level.
  c: '#6f6c7a', // kerb top, catching the light
  C: '#4b4956', // kerb face, turned away from it

  // Pavement.
  p: '#5e5b69', // slab
  P: '#666371', // slab, lighter
  q: '#514f5c', // slab seam

  // Planting.
  g: '#4c6552', // grass
  G: '#3f5545', // grass, shaded

  // Plaster wall — the default building face.
  w: '#7b7482',
  W: '#6a6470', // the shaded side of a building (see WALL_EDGE)
  n: '#585362', // the band of shadow a roof overhang throws on the wall

  // Brick, for facade variety. Muted: this is a rainy city, not a barn.
  b: '#6d4f4c',
  B: '#5b4240', // mortar course
  r: '#7a5b56', // the odd lighter brick
  y: '#573f3d', // brick on the shaded return (see BRICK_EDGE)
  Y: '#48332f', // its mortar

  // Roof and its lip. The roof faces up, so it is the lightest thing here.
  f: '#8d8593',
  F: '#7f7886', // roof, weathered patch
  l: '#9c94a2', // the lip of the parapet, brightest edge in the scene
  L: '#4f4a58', // the hard shadow immediately under it
  o: '#857e8c', // lip, on the shaded return
  N: '#443f4d', // the shadow band, on the shaded return

  // Windows.
  i: '#2e2e3a', // glass, dark
  I: '#3f4859', // glass, catching cold sky
  x: '#4c4653', // frame
  X: '#3b3743', // frame, shaded

  // Doors.
  d: '#5b4436',
  D: '#46362b',
  k: '#a98c52', // handle — one pixel of brass

  // Awning. Deliberately the same red as the character's accent: it is the
  // colour this world spends, and a cinema is where it should get spent.
  v: '#93403c',
  V: '#6f2f2d',
  s: '#cbc3ae',
  S: '#a89f8d',

  // Plinth: the course of stone where a wall meets the pavement. Without it
  // buildings look like they were pasted onto the ground.
  t: '#4a4552',
  T: '#3d3946',
  u: '#3e3a47', // plinth, on the shaded return
  U: '#332f3b',

  // Streetlamp. Warm cream glass, not the windows' cold blue -- it's the
  // shader's job to actually light it at night, this is just what the glass
  // looks like unlit, in daylight.
  h: '#4a4650', // pole, lit side
  H: '#38343d', // pole, shaded side
  e: '#d9c9a3', // bulb glass
  E: '#2f2b33', // cap and bracket, dark metal
};
