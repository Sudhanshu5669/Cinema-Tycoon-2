// Flat palette for the "tall figure" art direction (Metkis-style reference).
//
// This style has no procedural shading and no outline ring: every pixel is an
// exact authored colour. So the palette is a plain char -> hex map and a sprite
// grid is literally an indexed-colour image written as ASCII. That is a
// deliberate step back from the previous pipeline's material/shader model —
// there is nothing left for a shader to decide.
//
// Two tones per garment at most. The figure stays low-saturation so it reads
// against a city that does not -- see TILE_PALETTE below for the world's own,
// deliberately warmer and higher-contrast register.

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
 * **Warm register, wide value range.** The city runs warm -- tan plaster, red
 * brick, warm stone paving -- against a near-black road and a cool window
 * glass that is the one deliberate cold family left. The point is contrast:
 * an earlier muted, uniformly cool version of this table put the whole street
 * within a few values of itself, so nothing could ever be the brightest thing
 * on screen and a lit cinema facade read as grey-mauve wash rather than as
 * light. Value spread is what makes a night street work, and it is spent
 * deliberately: the road is the floor, the marquee's bulb core (`*`) is the
 * ceiling, and everything else is placed between them on purpose.
 *
 * The one place tones go three deep is where a surface turns a corner in the
 * 3/4 view (roof -> lip -> shadow -> wall), because that turn is the only
 * thing telling the player a building has a face at all. Light still comes
 * from the left, but a wall's shading belongs to the BUILDING, not to the
 * tile: a per-tile shaded edge would repeat every 16px and read as stripes,
 * so the shaded side is its own tile (`WALL_EDGE`).
 */
export const TILE_PALETTE = {
  // Road. The darkest surface in the set, so one lit facade can dominate the
  // frame -- but tuned as *daylight asphalt*, not as what asphalt looks like
  // at midnight. A first pass set these to the value the night shot wanted
  // and the road went black at noon: the night is the ambient light's job
  // (sun.js multiplies every one of these by ~0.11 after dark, which takes
  // this straight down to near-black on its own), and baking the darkness
  // into the material instead just breaks every other hour of the day.
  a: '#3a3742', // asphalt
  A: '#454150', // asphalt, lighter fleck — worn patches, not noise
  z: '#302d38', // asphalt, darker fleck
  m: '#a89678', // lane marking, worn. Never white; white reads as neon
                 // here -- but the road around it is now near-black, and at
                 // the ambient a night runs at, the old value left a
                 // crosswalk you could not actually see was there.

  // Kerb: the small vertical face where the pavement drops to the road, and
  // the first thing that sells the 3/4 view at ground level.
  c: '#7d7263', // kerb top, catching the light
  C: '#4a4238', // kerb face, turned away from it

  // Pavement — warm stone, and a full step lighter than the road, so the
  // footpath reads as a separate surface and not just less-dark asphalt.
  p: '#6e675c', // slab
  P: '#7b7368', // slab, lighter
  q: '#5c564d', // slab seam

  // Planting.
  g: '#4f6247', // grass
  G: '#3d4d38', // grass, shaded

  // Plaster wall — the default building face. Warm tan.
  w: '#8a7d6d',
  W: '#6f6456', // the shaded side of a building (see WALL_EDGE)
  n: '#564c41', // the band of shadow a roof overhang throws on the wall

  // Brick. Warm red-brown and a wider light/dark spread than the plaster,
  // so a brick building reads as the warmer, older one on the street.
  b: '#7d5344',
  B: '#5e3c31', // mortar course
  r: '#8f6250', // the odd lighter brick
  y: '#5c3b30', // brick on the shaded return (see BRICK_EDGE)
  Y: '#452a22', // its mortar

  // Roof and its lip. The roof faces up, so it is the lightest thing here.
  f: '#8f8474',
  F: '#7f7566', // roof, weathered patch
  l: '#a89b87', // the lip of the parapet, brightest edge in the scene
  L: '#4a4136', // the hard shadow immediately under it
  o: '#8d8271', // lip, on the shaded return
  N: '#3e362d', // the shadow band, on the shaded return

  // Windows. The one cool family left in the set, on purpose: glass reflects
  // the sky, and against warm brick that contrast is what makes a window
  // read as glass rather than a painted panel.
  i: '#2a2b36', // glass, dark
  I: '#3d4757', // glass, catching cold sky
  x: '#584c40', // frame
  X: '#40372e', // frame, shaded

  // Doors.
  d: '#6b4a33',
  D: '#4f3624',
  k: '#c9a04e', // handle — one pixel of brass

  // Awning. Deliberately the same red as the character's accent: it is the
  // colour this world spends, and a cinema is where it should get spent.
  v: '#b03a34',
  V: '#7d2723',
  s: '#efe0c2',
  S: '#c9b998',

  // Plinth: the course of stone where a wall meets the pavement. Without it
  // buildings look like they were pasted onto the ground.
  t: '#574c40',
  T: '#453b31',
  u: '#463d33', // plinth, on the shaded return
  U: '#372f27',

  // Streetlamp. Warm cream glass, not the windows' cold blue -- it's the
  // shader's job to actually light it at night, this is just what the glass
  // looks like unlit, in daylight.
  h: '#544a3f', // pole, lit side
  H: '#3c342c', // pole, shaded side
  e: '#ffdfa0', // bulb glass
  E: '#332c25', // cap and bracket, dark metal

  // Poster paper -- sun-bleached.
  j: '#a3937a',
  J: '#7d7060', // fold shadow / the case's own cast shadow on the sheet

  // Street clutter (bin, vending box): muted city-grime metal, no new accent.
  Z: '#474b42',
  Q: '#5f665a', // lit rim/lid

  // Terrazzo: the dark inset a sidewalk star sits in.
  O: '#3d3730',

  // The cinema door's own glass -- warm amber, not the ordinary window's
  // cold blue-grey (`I`/`i`): per user reference, the entrance glows with
  // interior light spilling out, not a dark reflective pane.
  M: '#f0c274',
  R: '#b8863f',

  // --- cinema signage ------------------------------------------------------
  // The reference's marquee is built from four things this set had no colour
  // for: gold letters, a white-hot bulb, a deep red board field, and a cool
  // dark reader-board screen. Every one of them is spent inside the cinema's
  // own signage and nowhere else on the street -- the same containment the
  // marquee red already had, just with the palette it actually needs.
  '+': '#f2c451', // marquee gold — letters, pinstripes, the bulb's warm ring
  '*': '#fff2d2', // bulb core, the single brightest pixel value in the set
  '=': '#5a161c', // sign board field, deep red
  '%': '#3a0d12', // sign board back / the frame's own dark rebate
  'K': '#1d2740', // reader-board screen, cool and dark against all that gold

  // Lobby light spilling out of the entrance, and the runner it falls on.
  '@': '#ffca7d', // interior glow behind the doors
  '&': '#7a2420', // carpet
  '$': '#5c1a18', // carpet, in shadow
};

/**
 * Relative surface height per tile-palette character, in arbitrary units --
 * what `tools/normals.mjs` derives every tile's normal map from, for the
 * live Light2D pipeline (SYSTEMS #8) to actually shade with, instead of
 * every surface reading flat-facing-camera the way an unbound normal map
 * defaults to. This works *because* every character here already has one
 * fixed, intentional meaning (mortar is always recessed, a lip is always
 * raised) -- the usual hard problem with deriving a normal map is that a
 * finished image can't say what a colour's height was meant to be, and we
 * never have that problem, because we never start from a finished image.
 *
 * A character missing here defaults to 0 (flush with the wall) -- most of
 * the palette is deliberately absent: WALL's speckle, ROOF's gravel grain
 * and PAVE/ROAD/GRASS are stochastic texture, not a structural edge, and
 * giving every fleck its own bump reads as noisy grain under a moving light
 * rather than a real surface, so they stay flat for now (this table can
 * always grow later). Every value here is small and the transitions across it
 * are sharp (one or two pixels), not a smooth ramp. That is the whole trick:
 * a crisp, low-amplitude step reads as a real edge, while a gentle continuous
 * gradient over flat pixel art reads as moulded plastic. Height differences
 * here are structural facts (mortar is recessed, a lip is raised, a bulb is a
 * sphere) -- never shading.
 */
export const TILE_HEIGHT = {
  // Cornice / belt course: the lip juts out, the wall sets back sharply
  // right under it (the cast shadow already baked into `L`/`n` is a real
  // step back, not just a darker tone), then returns to flush. `o`/`N` are
  // the same shapes' shaded-return copies.
  l: 3, L: -2, n: -1, o: 3, N: -2,
  // Brick coursing: the mortar groove is recessed, every brick face flush.
  B: -1, Y: -1,
  // Window / door frame: proud of the wall; the reveal steps in and the
  // glass sits deepest, behind it.
  x: 1, X: -1, I: -2, i: -2, M: -2, R: -2,
  // Doors: the recess line grooves in, the handle is a real knob.
  D: -1, k: 2,
  // Plinth: the stone course steps out from the wall face above it.
  t: 1, T: 1, u: 1, U: 1,
  // Kerb: a raised top edge, then a real drop to road level.
  c: 1, C: -3,
  // Cinema marquee/sign: a real light bulb protrudes; its panel's own border
  // (`V`, the same recessed-reveal idea a window frame uses) steps in.
  e: 2, V: -1,
  // Poster case: the sheet's own fold/shadow sits a hair back from the paper.
  J: -1,
  // Cinema signage: a bulb is a real glass bubble standing off the board, its
  // gold surround a thin proud pinstripe, and both board fields are rebated
  // behind that frame -- the same proud-frame/recessed-field language the
  // window reveal already uses, which is why these read as boards bolted to a
  // wall rather than decals painted on it.
  '*': 3, '+': 1, '=': -1, '%': -2, K: -1,
  // The lobby glow sits deepest of all -- it is light coming from further
  // back inside the building than the door plane itself.
  '@': -3,
};
