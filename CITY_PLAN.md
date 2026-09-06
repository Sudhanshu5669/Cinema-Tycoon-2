# City Build Plan

_How the city gets built, phase by phase. `SYSTEMS.md` tracks engine systems;
this tracks **places**. A phase is done when its area is walkable, lit, and
every building in it reads as a specific business rather than as filler._

## Reference

A Gemini-generated district map, used for **layout and shop ideas only** —
which businesses sit next to which, how blocks and crossings are arranged, what
a district is made of. Its own art direction is deliberately *not* copied: it is
a flat, brightly-lit, highly-saturated map illustration, and this game is a
night street built on neutral materials and coloured light (see
`art/flat/palette.mjs`). Taking its palette would undo the lighting model.

## How areas work

The city is a set of **areas**, each its own map file, joined by walking off an
edge — Stardew-style, not one continuous world. So every area needs its edges
*shaped* as exits from the start: a road running off-screen, an alley mouth, a
crossing that continues. The transition system itself is not built yet (it
shares machinery with `SYSTEMS #10`), so for now edges are authored to be
exits and simply stop.

---

## Phase 1 — The Cinema Block  ⏳ in progress

The cinema's own street, extended into a complete area: the parade of shops
opposite and the cinema's immediate neighbours.

| | Shop | Character |
|---|---|---|
| 1 | **Bento Box** | tight frontage, warm paper-lantern light, noren curtain over the door |
| 2 | **Retro Antiques** | bay window, clutter behind glass, dim yellow bulb |
| 3 | **Urban Garden** | open frontage, planting spilling onto the pavement, no fascia |
| 4 | **Gamer Cafe** | dark glass, cold blue-white light, the one cold shopfront on the street |
| 5 | **Retro Coffee** | awning, pavement seating, warm low light |
| 6 | **Pawn Shop** | shutter half down, barred window, hard white light |
| 7 | **Game Store** | big posters, saturated sign, flickering tube |
| 8 | **Burger Joint** | red-and-cream fascia, bright interior, the brightest shop after the cinema |

### 1a — Map frame
Grow `city.json`: road grid, pavements, a crossing, the two building rows, and
edges shaped as exits. Blockout only — existing tiles, no new art.

### 1b — Shopfront kit
The main art investment, and the thing that decides whether this scales. Rather
than eight bespoke buildings, build **parts that combine**: fascia bands, awning
profiles, window patterns (mullion / shutter / roller / bay), door types, stall
and sign furniture. Eight shops then differ by *composition*, and shop nine
costs an hour instead of a day.

### 1c — The shops
Compose each frontage from the kit, plus one bespoke detail each — the thing you
would actually describe it by (the noren, the shutter, the spilling planting).

### 1d — Signage and light colour
**Light colour is the strongest identifier at night** and the one that survives
a neutral palette. Each shop gets its own `glowFor` kind: the Gamer Cafe cold,
the pawnbroker hard white, the bento warm-amber, the burger joint near-white.
This is what makes a street of grey buildings read as eight different businesses
from across the road.

### 1e — Street dressing
Crossings, benches, bins, planters, A-boards, bollards, a bike rack. Small, and
what stops a pavement reading as a corridor.

### 1f — Light budget pass
Re-measure and re-tune. **Hard constraint:** on-screen shaded lights must stay
under `render.maxLights` (16) — see `lighting.js`'s `MERGE_DIST`. The smoke
suite guards it (`no light is culled by camera distance`), and it will fail
loudly when a new block outgrows it, which is the point.

### 1g — Doors
Every shop gets an `enter` marker in data, unused until `SYSTEMS #10`. Cheap to
author now, and it means the transition system arrives to a city already
wired for it.

---

## Later phases

Ordered by what the reference suggests and what the game needs, not by size.

- **Phase 2 — Civic quarter.** City hall, library, post office, department
  store. A different architectural register: stone, tall windows, columns.
- **Phase 3 — Housing.** Low-rise, gardens, fences. The register the reference
  puts furthest from the shops, and the one that most needs its own tile set.
- **Phase 4 — Station + workshop district.** Rail, platform, workshops, the
  fabrication hub. Industrial materials: corrugated metal, brick, roller doors.
- **Phase 5 — Park.** Trees, water, paths. Mostly ground and foliage work.

## Rules this build follows

1. **Neutral materials, coloured light.** Saturation is spent on things that
   emit. A shop is told apart by silhouette, signage, awning and the colour of
   its own light — not by painting its bricks a different colour.
2. **Parts before buildings.** Anything that will appear twice is a kit part.
3. **Data, not code.** A new shop is a `city.json` edit. If it is not, the kit
   is missing a part.
4. **The light budget is real.** See 1f.
5. **Every phase ends measured**, against the same sampling the palette work
   used — not against an impression.
