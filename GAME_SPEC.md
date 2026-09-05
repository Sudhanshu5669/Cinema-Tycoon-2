# Game Spec — Cinema Tycoon (working title)

## Core loop
You play a character who has just bought a derelict cinema in the middle of a
city. Moment to moment you walk around as that character in a top-down 3/4
pixel-art world — through city streets, into building interiors, talking to
NPCs via visual-novel dialogue. The cinema is the anchor: you walk into it,
survey its broken and filthy state, and spend money and time repairing,
upgrading and running it. Business decisions (what films to screen, ticket
pricing, concessions, staff, renovations) feed a simulation that changes the
city's footfall and your reputation, which loops back into more money and
more of the city opening up to you. The intended feel is vast and
open-ended — a city that keeps revealing more, not a fixed level list.

## Genre
Management/tycoon simulation with a walk-around top-down adventure layer and
visual-novel storytelling. Not a menu-driven tycoon — the player is embodied
in the world.

## Platform target
Both desktop and mobile.
- Desktop: keyboard (WASD/arrows) + mouse.
- Mobile: on-screen virtual joystick + tap. Touch overlay is mobile-only and
  must not appear on desktop.
- All input routed through a single input abstraction from day one so no
  system ever reads a raw key event directly.

## Art approach
Hand-authored **flat pixel art** in the style of the user's supplied Metkis
reference: tall, slim figures, no outlines, muted palette, minimal shading.

History, so no rejected direction gets retried:
1. Eastward-styled 32x56 with distance-field lighting -> rejected, "glassy and
   weird". Cause: smooth normal-based falloff reads as moulded plastic.
2. Stardew-styled 32x48 with flat cel shading -> rejected. Cause: roughly three
   times Stardew's real pixel count. The chunkiness IS the style.
3. Stardew-styled 16x32 (actual Stardew scale) -> approved for the front and
   back facings, then abandoned. The profile never landed: at 16px the face
   collapses into a 3px stripe, and hair and jacket rendered at identical
   luminance so the whole side view fused into one brown slab. Repeated attempts
   to fix it by reshaping the head did not help, because the problem was the
   style's dependence on a chunky face doing all the work.
4. **Current: flat "tall figure", 16 x 48.** Chosen because it is
   authorable — the profile reads from silhouette and proportion rather than
   from facial detail there is no room for.

What the reference dictates (measured, not guessed — the reference figures are
13 x 50 native pixels):
- **No outline anywhere.** Shapes sit flat against the background. This is the
  single biggest departure from every previous pass.
- Proportions: head 20% of height and **54% of body width**; torso 32%; hips
  8%; legs and feet 40%. The width ratio is the one that matters — a first pass
  at 67% read as a bobblehead with the vertical proportions already correct.
- Two tones per garment at most, and no ramps. Light comes from the left, so
  the near arm is lit and the far arm is shaded; that tonal split is the only
  thing separating arm from torso, since there is no outline to do it.
- The face carries **eyes only** — one dark pixel each. No nose, no mouth, no
  whites, no catchlights. The profile gets a single-pixel nose bump.
- There **is** a neck, one pixel row of it.
- Legs are long and thin with a clear gap between them; feet are small and are
  the darkest thing on the figure.
- Muted, slightly cool register. Exactly one saturated accent per character.

Locked art constants:
- Internal render resolution: **640 x 360**
- Tile grid: **16 x 16 px**
- Character: **16 x 48 px** (3 tiles tall)
- Presentation: **integer scale x3 -> 1920 x 1080**, nearest-neighbour
- On-screen world: 40 x 22 tiles

The tile renderer (SYSTEMS #6) is **elevation-aware**: a map is a `height` grid
plus named layers (`ground`/`flat`/`object`/`overhead`), and raised terrain and
buildings are drawn with an **oblique face** — a wall that projects straight
down the screen — rather than a flat facade glued under a top-down roof. The
face height per elevation level (`STEP`) is a renderer knob, not a locked
constant. This was a deliberate call ("versatile enough to have levels if
needed"); flat maps still author flat, the capability is just there. Tile art
started as the SYSTEMS #0 placeholder set and later got a surface detail/
variety pass (window sills, wall/roof texture, brick colour variety, a
pavement stain tile) — see SYSTEMS.md #6.

Sprites are authored as an **indexed-colour ASCII grid** (`art/flat/player.mjs`)
against a named palette (`art/flat/palette.mjs`); `tools/flat.mjs` maps
characters to exact colours and validates every grid. The *player sprite*
itself has no shading pass — every pixel is an authored exact colour, no
gradient, no normal-based falloff — which is a real, deliberate constraint on
that one piece of art specifically: an earlier attempt at normal-based
lighting on the character (rejected direction #1 above) read as "glassy and
moulded plastic". That is not a project-wide ban on shaders or normal maps —
the *tile* art now uses exactly that (see SYSTEMS.md #6's normal-map system:
`art/flat/palette.mjs`'s `TILE_HEIGHT` + `tools/normals.mjs`), deliberately
designed around the same failure mode rather than avoided because of it (small
height deltas, sharp transitions, not the smooth continuous falloff that read
as plastic). The Stardew-era material/normal/cel machinery
(`art/materials.mjs`, `tools/shade.mjs`) is superseded for a different reason —
it doesn't match this flat *style* — not because normal maps themselves are
off the table. Those files and the 16x32 sprites are still in the tree,
unreferenced by either pipeline, pending a decision to delete them.

The live scene runs on a real per-fragment shader (SYSTEMS #8, `src/game/
lighting.js` -- Phaser's own `Light2D` pipeline, not a bespoke one), a
deliberate choice over a cheaper baked overlay so future growth (more lights,
flicker, a lantern that follows the player) is a data change, not new GLSL.
`tools/light.mjs` remains the separate offline CPU pass that accumulates
coloured lights with quadratic falloff over an ambient tint for day/evening and
interiors.

## Scope
Full game, built up in verified stages. The user has explicitly asked for a
"vast game with endless possibilities", so systems must be built
data-driven and extensible rather than hardcoded — but delivered and
validated one system at a time.

## Genre-specific answers
- **Protagonist look:** "Film-nerd casual" — hoodie, cargo pants, beanie,
  headphones round the neck, camera bag. Cinephile energy, not
  businessperson energy.
- **Storytelling:** Visual-novel dialogue box with a **nameplate + dialogue
  box**. Opening scene: the character arrives in the middle of town and the
  dialogue establishes that they finally bought the cinema they always
  wanted to manage.
- **Cinema state at start:** very broken and dirty, located in the middle of
  the city.
- **City:** must be **dynamically constructed from data**. Changing the city
  map — moving a building, adding a district, swapping a shopfront — must be
  a data edit, not a code change.
- **Interiors:** enterable buildings with their own interior scenes.
- **NPCs:** present in the world and talkable-to.
- **System depth:** the user's phrasing is "deeply smart" — favour
  simulation and emergent behaviour over scripted one-offs.

## Validation protocol (user-imposed)
The user validates everything. In particular, for this first pass:
1. Main character sprite is drafted and **shown for approval first**.
2. **No animation work begins until the static sprite look is approved.**
3. Walking system comes after sprite approval.

## Explicit non-goals (this pass)
- No 3D.
- No multiplayer.
- No animation frames until the base sprite is signed off.
- No city content beyond what's needed to test the system currently being
  built.
