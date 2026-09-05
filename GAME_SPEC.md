# Game Spec — Cinema Tycoon (working title)

_What the game is and what the code is built against. Kept short on purpose:
this file states the target, not the route to it. Decisions that are already
expressed in code belong in the code; a spec that also records every path not
taken turns into a list of things not to try, which is the opposite of useful._

## Core loop

You play a character who has just bought a derelict cinema in the middle of a
city. Moment to moment you walk around as that character in a top-down 3/4
pixel-art world — through city streets, into building interiors, talking to
NPCs via visual-novel dialogue. The cinema is the anchor: you walk into it,
survey its broken and filthy state, and spend money and time repairing,
upgrading and running it. Business decisions (what films to screen, ticket
pricing, concessions, staff, renovations) feed a simulation that changes the
city's footfall and your reputation, which loops back into more money and more
of the city opening up to you. The intended feel is vast and open-ended — a
city that keeps revealing more, not a fixed level list.

## Genre

Management/tycoon simulation with a walk-around top-down adventure layer and
visual-novel storytelling. Not a menu-driven tycoon — the player is embodied in
the world.

## Platform target

Desktop and mobile.

- Desktop: keyboard (WASD/arrows) + mouse.
- Mobile: on-screen virtual joystick + tap. The touch overlay is mobile-only
  and must not appear on desktop.
- All input routes through a single input abstraction (`src/core/input/`), so
  no system reads a raw key event directly.

## Art

Hand-authored pixel art, tall slim figures, no outlines on the characters.

Sprites and tiles are authored as **indexed-colour ASCII grids** against named
palettes (`art/flat/`), rastered and validated by `tools/`. That is the whole
pipeline: what is written in the grid is what is drawn. It exists so a typo is
a build error rather than a silent one-pixel bug, and so art is diffable.

The world runs **warm and high-contrast** — tan plaster, red brick, warm stone
paving against a near-black road — with cool glass as the one deliberate cold
family. Value spread is spent on purpose: the road is the floor, a marquee bulb
is the ceiling. The character palette stays lower-saturation so a figure reads
against the city rather than dissolving into it.

Art constants the code is authored against (`src/core/config.js`):

| | |
|---|---|
| Internal render resolution | 640 x 360 |
| Presentation | integer scale, nearest-neighbour |
| Tile grid | 16 x 16 |
| Character | 16 x 48 (3 tiles) |

`STEP` (screen px per elevation level, `tilemap/projection.js`) is a renderer
tuning knob, not a locked constant — raising it makes every building taller
without touching a map.

## Rendering

The tile renderer is **elevation-aware**: a map is a `height` grid plus named
layers (`ground`/`flat`/`object`/`overhead`), and raised terrain and buildings
are drawn with an **oblique face** projecting straight down the screen, rather
than a flat facade glued under a top-down roof. Flat maps still author flat.

Lighting is a real per-fragment shader (Phaser's `Light2D`), driven by an
hour-of-day model, with normal maps derived from the same authored grids the
diffuse art comes from. Lights are data: adding one is a map edit.

## Scope

Full game, built up in verified stages, one system at a time — see
`SYSTEMS.md` for the running list and status. Systems must be **data-driven
and extensible** rather than hardcoded: the city is a JSON file
(`public/assets/city.json`), and moving a building, adding a district or
swapping a shopfront is a data edit, not a code change.

## Setting details

- **Protagonist:** "film-nerd casual" — hoodie, cargo pants, beanie, headphones
  round the neck, camera bag. Cinephile energy, not businessperson energy.
- **Storytelling:** visual-novel dialogue with a nameplate + dialogue box.
  Opening scene: the character arrives in town, having finally bought the
  cinema they always wanted to run.
- **Cinema at start:** very broken and dirty, in the middle of the city.
- **Interiors:** buildings are enterable, with their own interior scenes.
- **NPCs:** present in the world and talkable-to.
- **System depth:** favour simulation and emergent behaviour over scripted
  one-offs.
