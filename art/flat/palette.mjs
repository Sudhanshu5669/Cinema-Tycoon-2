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
 * **Neutral materials, coloured light.** Two illuminants light this city: a
 * cool ambient (sun.js's NIGHT) standing in for sky and moon, and warm point
 * lights at the lamps, windows and marquee. So the *paint* here is close to
 * neutral and the colour arrives from the lighting pass -- masonry sits at
 * 2-8% saturation, brick keeps ~24% because brick genuinely is the warm one,
 * and that is the whole spread.
 *
 * This matters mechanically, not just aesthetically: ambient light
 * MULTIPLIES. A material with no blue in it cannot be cooled by a blue
 * ambient -- `#7d5344` times a cool ambient is still orange, only darker --
 * so a warm-painted street can only ever have warm shadows, and a night
 * scene with warm shadows has no hue contrast anywhere for its lamps to sit
 * against. Keeping the paint neutral is what buys a cool shadow and a warm
 * pool of lamplight in the same frame.
 *
 * Saturation is therefore a budget, and it is spent almost entirely on
 * things that EMIT: the awning red (`v`), the marquee gold (`+`), the bulb
 * core (`*`), the lobby glow (`@`). Those stay fully saturated on purpose --
 * they are the only objects allowed to be colourful, which is exactly what
 * makes them read as the light sources in a neutral street.
 *
 * Value spread is still spent deliberately: the road is the floor, the bulb
 * core (`*`) is the ceiling, and everything else is placed between them.
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
  a: '#393742', // asphalt
  A: '#44414f', // asphalt, lighter fleck — worn patches, not noise
  z: '#2f2d37', // asphalt, darker fleck
  m: '#9f978d', // lane marking, worn. Never white; white reads as neon
                 // here -- but the road around it is now near-black, and at
                 // the ambient a night runs at, the old value left a
                 // crosswalk you could not actually see was there.

  // Kerb: the small vertical face where the pavement drops to the road, and
  // the first thing that sells the 3/4 view at ground level.
  c: '#767272', // kerb top, catching the light
  C: '#464241', // kerb face, turned away from it

  // Pavement — warm stone, and a full step lighter than the road, so the
  // footpath reads as a separate surface and not just less-dark asphalt.
  p: '#696769', // slab
  P: '#757376', // slab, lighter
  q: '#575658', // slab seam

  // Planting.
  g: '#51614e', // grass
  G: '#3f4c3d', // grass, shaded

  // Plaster wall — the default building face. Warm tan.
  w: '#837e7c',
  W: '#696462', // the shaded side of a building (see WALL_EDGE)
  n: '#514d4b', // the band of shadow a roof overhang throws on the wall

  // Brick. Still the warmest masonry in the set and still a wider light/dark
  // spread than the plaster, so a brick building reads as the older one on
  // the street -- but at 16% saturation, not the 46% it carried when the
  // paint was doing the lighting's job. A warm lamp raises this to roughly
  // the high thirties on screen, which is where the reference's brick
  // actually measures; painting it there to begin with meant it stayed there
  // in shadow too, and a brick wall the sun never reaches is not orange.
  b: '#685758',
  B: '#4d3f40', // mortar course
  r: '#786667', // the odd lighter brick
  y: '#4c3e3f', // brick on the shaded return (see BRICK_EDGE)
  Y: '#382d2d', // its mortar

  // Roof and its lip. The roof faces up, so it is the lightest thing here.
  f: '#888484',
  F: '#797575', // roof, weathered patch
  l: '#a09b9b', // the lip of the parapet, brightest edge in the scene
  L: '#454140', // the hard shadow immediately under it
  o: '#868281', // lip, on the shaded return
  N: '#3a3635', // the shadow band, on the shaded return

  // Windows. The one cool family left in the set, on purpose: glass reflects
  // the sky, and against warm brick that contrast is what makes a window
  // read as glass rather than a painted panel.
  i: '#2a2b36', // glass, dark
  I: '#3d4757', // glass, catching cold sky
  x: '#584c40', // frame
  X: '#40372e', // frame, shaded

  // Doors.
  d: '#5f4c43',
  D: '#463830',
  k: '#c9a04e', // handle — one pixel of brass

  // Awning. Deliberately the same red as the character's accent: it is the
  // colour this world spends, and a cinema is where it should get spent.
  v: '#b03a34',
  V: '#7d2723',
  s: '#efe0c2',
  S: '#c9b998',

  // Plinth: the course of stone where a wall meets the pavement. Without it
  // buildings look like they were pasted onto the ground.
  t: '#514d4b',
  T: '#403c3a',
  u: '#413d3c', // plinth, on the shaded return
  U: '#332f2e',

  // Streetlamp. Warm cream glass, not the windows' cold blue -- it's the
  // shader's job to actually light it at night, this is just what the glass
  // looks like unlit, in daylight.
  h: '#504a46', // pole, lit side
  H: '#393431', // pole, shaded side
  e: '#ffdfa0', // bulb glass
  E: '#312c29', // cap and bracket, dark metal

  // Poster paper -- sun-bleached.
  j: '#9b948c',
  J: '#77716d', // fold shadow / the case's own cast shadow on the sheet

  // Street clutter (bin, vending box): muted city-grime metal, no new accent.
  Z: '#474b47',
  Q: '#5f6561', // lit rim/lid

  // Terrazzo: the dark inset a sidewalk star sits in.
  O: '#3b3735',

  // A LIT window's glass, on the buildings whose interiors are painted rather
  // than seen through (WINDOW_LIT, WINDOW_WARM, WINDOW_STAIR -- the cheap
  // version, for background buildings where nobody can tell). These were the
  // cinema door's glass too, which is why they were authored near-white: the
  // entrance was supposed to glow. The doors are real joinery now and no
  // longer use them, so these are free to be what a lit room actually looks
  // like from across a street -- warm, but a long way from the brightest
  // thing in the frame. At the old values every painted lit window blew out
  // to a flat cream rectangle with nothing readable in it.
  M: '#b9a78c',
  R: '#8f7c5f',

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

  // --- the entrance doors --------------------------------------------------
  // A theatre door is a solid panelled leaf, not a pane. These used to be
  // drawn in `M`/`R` -- the cinema door's *glass* tones, near-white amber --
  // which made the whole four-leaf bank the brightest object in the frame by
  // a wide margin and gave the entrance no depth at all: a wall of light
  // where the reference has maroon joinery standing inside a dark recess.
  // Deep and desaturated on purpose, and darker than a maroon door "should"
  // be, because the canopy's shade is baked into the paint. It has to be: the
  // doors sit between the marquee above them and the pavement in front, so in
  // this projection there is no position or radius that can light the street
  // while leaving the doorway in shadow -- the two are the same direction from
  // the lamp. Occlusion would answer it properly (occludedLight.js is the
  // prototype) and until that is wired the honest substitute is the one a
  // painter would reach for anyway: paint the shaded thing shaded. These land
  // at L~75 under the marquee, which is where the reference's doors measure.
  '#': '#3c1e22', // door leaf
  '~': '#2a1418', // leaf panel, rebated -- and the bottom rail's own shadow
  '^': '#55292c', // top rail, the one edge the marquee above actually reaches
};

/**
 * Interior palette. A third namespace, for the same reason the tile palette is
 * a second one: a room is drawn on its own layer, behind the wall, and the
 * things it is made of (a dado rail, a stair tread, a picture frame) have
 * nothing to say about a pavement. The tile palette has no letters left --
 * every one of a-z and A-Z is spoken for -- so sharing it would mean spending
 * punctuation on a wainscot.
 *
 * **This exists because three tones could not describe a room.** Every lit
 * room in the set was drawn in `M`, `R` and `X`: two saturated ambers and the
 * window frame's own shadow tone borrowed as "dark". There was no wall colour
 * in that vocabulary at all, so a room could only ever be a glowing rectangle,
 * which is exactly how they read. The reference's rooms are a neutral cream
 * wall over a maroon dado, and no amount of re-toning gets there from two
 * ambers.
 *
 * **Light direction is authored in.** The world outside is lit by a shader;
 * a room is not -- it is a flat image hung behind a hole, and the Light2D
 * pass reaches it as one nearly-uniform wash. So the interior's own key comes
 * from the paint: upper-left, consistent across every room. The wall steps
 * down in three tones from the window head to the floor, tread nosings catch
 * it, balusters are lit down their left edge, and the underside of a stair
 * flight is the darkest thing in the set. Without that a room is a flat
 * cutout however good its silhouette is.
 */
export const ROOM_PALETTE = {
  w: '#b3a89b', // wall, at the window head where the light comes in
  W: '#948a7e', // wall, mid
  n: '#756d63', // wall, down at the floor -- the vertical falloff, in paint

  d: '#66353a', // dado / wainscot panelling below the rail
  D: '#4b262b', // dado, in shadow
  r: '#3a2d28', // rail, skirting, handrail -- dark stained timber
  R: '#54443c', // the same timber where the light catches its top edge

  t: '#a4988a', // stair tread nosing: the lit edge that makes a stair a stair
  T: '#786e64', // tread riser, turned away from the light
  s: '#241d1a', // the soffit under a flight -- the darkest tone in the set

  b: '#5a3035', // baluster
  B: '#3c2226', // baluster, its shaded right-hand side

  f: '#8a6a3c', // picture frame, gilt
  a: '#33553f', // picture, in its own colours
  A: '#4b7355', // picture, its lit half

  o: '#5c4a3e', // interior door / cupboard front
  O: '#41342b', // that door, in shadow

  l: '#e8cfa0', // a lamp's own glass -- the brightest thing in any room
  L: '#8a6f4e', // its shade and the bloom immediately around it

  x: '#191417', // an unlit doorway, or a room with nobody home
  X: '#241e22', // the same, a step off it, so a dark room still has shape
};

/**
 * Relief for ROOM_PALETTE, same idea as TILE_HEIGHT -- but shallower, because
 * everything in a room is seen through glass from across a street and a bold
 * normal on a dado rail buys nothing at that distance. What it does buy is
 * the stair reading as stepped rather than as a smooth ramp.
 */
export const ROOM_HEIGHT = {
  r: 1, R: 1,     // rail and skirting stand proud of the wall
  t: 1, T: -1,    // a tread's nosing juts, its riser sets back
  s: -2,          // the soffit is a real void behind the flight
  b: 1, B: 1,     // balusters are turnings, in front of the wall
  f: 1,           // a picture frame hangs off the wall
  a: -1, A: -1,   // its canvas sits back inside that frame
  d: -1, D: -1,   // panelling is rebated behind its own rail
  o: -1, O: -1,
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
  // Entrance doors: the leaf is the wall plane, its panels are rebated behind
  // it and the top rail stands proud -- the same proud-frame/recessed-field
  // language the window reveal already uses. Without these three the new
  // leaves bake flat and the bank lights like a painted board.
  '#': 0, '~': -1, '^': 1,
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
