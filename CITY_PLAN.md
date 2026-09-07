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

## Streets are one-sided

The single fact that decides every layout in this game. Faces project straight
down the screen and nowhere else (`renderer.js`), so **a building can only ever
front the street to its south.** There is no way to author a shop that faces
north, and therefore no such thing as a two-sided street here.

So the parade "opposite" the cinema is not the far kerb of the cinema's street.
It is its own street, one block further down, and what the player sees across
Main St is the **back of that block — its roofs.** A block is authored with
`storeys + roofDepth === h`, which makes its stack exactly as deep as its own
footprint: the roof mass ends on the footprint's back row and never reaches
north over the street behind it. The smoke suite checks that on every build.

Roof depth is also a lighting number, not only an art one. A lit window sits
high on a south-facing wall, which in this projection puts it high on the
*screen* too, and its pool spills off the top of the facade onto whatever is
behind the building. The shop block carries 8–9 tiles of roof so that its
windows light Parade St and not Main St.

**So a roof is a facade now.** It is the elevation the street behind a block
actually looks at, and it has to be built like one: a parapet capping its back
edge (`roofBack`, not `cornice` flipped — the far parapet's shaded drop faces
away and is never in view), and furniture standing on the deck (`b.roof`,
placed in roof space the way `facade` is placed in face space). Undressed, a
nine-tile deck is a pale slab ending on a hard line against the pavement in
front of it, which is what the shop block looked like the moment it existed.

This was the open question phase 1a had to answer, and the alternative — a
north-facing face variant in the renderer — was not taken: it puts a shopfront
above its own roofline and fights the depth sort, to buy a street shape the
rest of the engine is not built for.

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

### 1a — Map frame  ✅ done
Grown to 120x74, two streets, both one-sided:

| rows | |
|---|---|
| 0–17 | back lot behind the north row |
| 18–32 | **Main St** — pavement, kerb, carriageway (24–31), far kerb |
| 33–38 | Main St's far pavement |
| 39–52 | **the shop block** — footprint, and exactly the rows its own roof and face cover |
| 53–67 | **Parade St** — the shop pavement, kerb, carriageway (59–66), far kerb |
| 68–73 | Parade St's far pavement |

The cross street at x62–65 runs the full height, north off the top edge between
the cinema and its neighbour and south through the gap in the block, so both
are exits; the carriageways run off east and west. Two service alleys (x32–35,
x90–93) cut the parade into three runs. Eight shop footprints, blockout only:
a door, an upper floor of windows, and a material each.

One new tile (`kerbSouth`) and one new schema primitive (`rects`, for a
crossing that was 48 hand-written cells). Otherwise existing art.

Then the roofs, once it was clear they were a facade and not scenery: a
parapet tile (`roofBack`), four pieces of furniture (`roofTank`, `roofVent`,
`roofHatch`, `roofDuct`, alongside the existing `acUnit`), a `roof` list on a
building, and 76 items placed across all thirteen decks. The loader checks a
piece's own **pixels** fit the deck, not just the cell it names — a tank is
wider and taller than a tile, so a legal `rx` can still hang it off the edge,
where the bake clips it and half a tank appears.

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

Roofs got their first pass in 1a, because the shop block's deck is what Main St
looks at and it could not wait. What they still want: **clustering** — plant
rooms and tank groups rather than an even scatter — and **cast shadows.**
Furniture is baked into the roof image, so none of it casts, while the
buildings around it do. Short shadows at noon hide it; a low sun will not.

### 1f — Light budget pass
Re-measure and re-tune. **Hard constraint:** on-screen shaded lights must stay
under `render.maxLights` (16) — see `lighting.js`'s `MERGE_DIST`.

**Measured in 1a, and this is the brief.** Sweeping a camera along each street
at 80px steps (the smoke suite now does this on every run, instead of sampling
the two ends and calling it measured):

- **Parade St: worst 11 of 16.** The new street has headroom.
- **Main St: worst 16 of 16, for most of its length.** No headroom at all —
  and it was 16/16 on the committed map before phase 1a too, so this is a debt
  the sweep uncovered rather than one the shop block added. The two positions
  the old check happened to ask about were the only two with room.

What is spending Main St's sixteen, at the worst position:

| | |
|---|---|
| 5 | the cinema's own signage — awning, two panels, the lobby. `marquee` and `lobby` never merge |
| 5 | streetlamps, which must never merge (a lamp's position decides shadow direction) |
| 6 | window and fixture clusters on the north row |

The levers, in the order they look most promising:

1. **`marquee` has `MERGE_DIST: 0` on a premise that is no longer true** — its
   comment says "there is only ever one of each per building", which the
   generic `panels` list ended. Merging a building's marquee lights with each
   other is exactly as safe as that comment intended, now that `group` bounds a
   cluster to one facade. Worth 2–3 slots. **Costs brightness** — three
   overlapping sources become one, and the entrance is tuned — so it is a
   look decision, not a free win.
2. **Wider lamp spacing on Main St.** 1a took it from 14 tiles to 24; at 32
   the pools stop overlapping and the street becomes pools of light rather
   than an even wash, which is arguably what it should be anyway.
3. **Fewer lit windows on the north row**, which is the least interesting
   answer and the one to reach for last.

Not a lever: raising the cap. `Light.frag` loops to `kMaxLights` per fragment
whether the lights exist or not, so 64 costs frame pacing whatever the count.

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
