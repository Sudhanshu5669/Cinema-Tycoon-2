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
Hand-authored pixel art at **actual Stardew Valley sprite scale**, matching the
user's supplied Stardew character-mod reference.

History, so no rejected direction gets retried:
1. Eastward-styled 32x56 with distance-field lighting -> rejected, "glassy and
   weird". Cause: smooth normal-based falloff reads as moulded plastic.
2. Stardew-styled 32x48 with flat cel shading -> still rejected. Cause: roughly
   three times Stardew's real pixel count. The chunkiness IS the style; extra
   resolution works against it.
3. **Current: 16 x 32, actual Stardew scale.**

What the reference dictates:
- Hair is a big dark mass taking ~40% of the sprite height, and is the primary
  silhouette feature.
- **No neck.** The head sits directly on the shoulders.
- Squat body block with one saturated vertical accent (here a red tie).
- Stubby legs, small pale shoes.
- Flat cel shading only: outline ring, one-pixel shadow edge, base, highlight.
  No gradients anywhere.
- Eyes are small solid dark blocks. No whites, no catchlights.

Locked art constants:
- Internal render resolution: **640 x 360**
- Tile grid: **16 x 16 px**
- Character: **16 x 32 px** (exactly 2 tiles tall)
- Presentation: **integer scale x3 -> 1920 x 1080**, nearest-neighbour
- On-screen world: 40 x 22 tiles

Sprites are authored as a **material map** — silhouette plus which material each
region is (`art/player-front.mjs`); `tools/shade.mjs` applies the cel rule and
`art/materials.mjs` holds the palettes. Art edits stay small reviewable diffs.

A separate lighting pass (`tools/light.mjs`, later a Phaser shader) accumulates
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
