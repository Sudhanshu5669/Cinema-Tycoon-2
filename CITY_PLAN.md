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

### 1c-1 — Bento Box  ✅ first shop done
The building at x20 on Parade St, and the pattern the other seven follow. Built
as a `city.json` edit plus new art, not new code per shop:

- **Timber cladding** (`bentoFront`) where every neighbour is masonry — a
  shop is a wooden frame with holes in it. One new material, not a recoloured
  brick.
- **Noren door** (`norenDoor`): glazed and lit from behind, indigo cloth in four
  panels, the slits showing the light. **Two see-through display windows**
  (`windowShop`) onto their own rooms: shelves of packed boxes, and a cook at the
  pass. Neither is a copy of the other.
- **Fascia board** — a `panels` entry with `style: "board"`: painted timber, no
  bulbs, no light of its own. The same panel, laid out and validated by the same
  code as the cinema's marquee; only the frame width differs (`BOARD_INSET`).
- **Paper lanterns** (`lantern`) hung under it. A new light kind, `lantern`:
  on an hour before residents' windows and off with them at dawn, deeper and redder than a window.
  Everything that emits from the shop — lanterns, door, both rooms — is that one
  kind, so the whole front merges into a single shaded light.
- Taller than its neighbours (8 storeys, `roofDepth` 6 to keep `storeys +
  roofDepth === h`), which is what gave the fascia somewhere to hang.

**Shadows.** Every light touching the player throws its own shadow, and a shop
front is seven emitters, so the first build put seven spokes on the player. The
lanterns and both rooms now light and glow but do not cast (`NO_SHADOW` in
`renderer.js`); the door is the shop's caster. A shop with many emitters should
do the same.

### 1c-2 — Retro Antiques  ✅ second shop done
The building at x36 on Parade St, east of the service alley. Built the way the
Bento Box was — a `city.json` edit plus art in `art/flat/antiques.mjs` — and it
is the shop that says whether the kit idea holds, because it is the Bento Box's
opposite: told apart by **silhouette** first, and by the colour of its light
second.

- **Bay window** (`windowBay`, 96x48): a three-sided bay under its own lead roof
  and lip, a row of top lights over a transom, the middle pane twice the width
  of the two that turn away, a brass rail, a projecting cill and a panelled
  riser. One see-through opening onto `roomAntiquesBay` — a case clock, a gilt
  mirror over a chest of drawers, a round table and chairs, a globe, a rug, and a
  bare bulb hung in the middle of it. Too much furniture is the drawing.
- **Cabinet window** (`windowCabinet`) beside the door: the same construction at
  a fifth of the size, onto shelves of porcelain and a carriage clock.
- **Door** (`antiqueDoor`, 32x64): a fanlight of radial bars over a glazed leaf
  behind a net curtain, brass letterbox and pull, an OPEN card in the glass.
- **Joinery** (`antiqueFront`): fluted pilasters and a panelled stall riser in
  one new material — a green-black shopfront paint at ~10% saturation, where the
  Bento Box is timber. It is read as old paint and does not compete with the
  light.
- **Fascia**: the same `board` panel as the Bento Box's, and the first use of
  its new `frame`, `trim` and `field` colours — the kit part the second shop
  needed. Lettering colour is the panel's ordinary `color`.
- **A new light kind, `bulb`**: yellow (0xffd472), not the lanterns' orange,
  and lower in intensity. Emitters are the door, both rooms and two `bareBulb`s
  hung either side of it, all one kind so the front merges into a single shaded
  light; the bulbs and both rooms do not cast (`NO_SHADOW`), the door does.
- Taller than its neighbours (`storeys` 8, `roofDepth` 6), with the fascia at
  rows 4–6 so the 48-tall bay sits directly under it.

`canvas` moved out of `bento.mjs` into `art/flat/canvas.mjs`, since a second
shop is the second user. The placeholder awning from 1a's blockout, which sat on
the old door's tile, is gone.

Two things went wrong on the way and are worth keeping. The bulbs were first
round with a dark filament mark, and read as pocket watches — the wrong shop; a
bulb is a pear with a warm filament. And the door's dark glazing bar over the
net-curtain checker read as a zipper.

**Light budget:** Parade St's worst case went from 11 to **12 of 16**, one slot
for the whole shop. Smoke is 106/106.

### 1c-3 — Gamer Cafe  ✅ third shop done
The dark-faced building at x50, next door to the antiques shop, so the two
lights meet on the pavement: yellow to the west, cold blue-white to the east.
The one **cold** shopfront on the street, told apart by material and by light
like the other two — and this time the silhouette is the *absence* of one:
flat black cladding with hairline seams, no pilasters, no mouldings, no bay.

- **Curtain wall** (`windowGlass`, 64x32, twice): a single pane of dark glass in
  a thin frame with no mullion or transom, and two one-pixel glare streaks
  drawn opaque over the room so it reads as glass and not as a hole. There
  were three, two pixels wide, and they fought the room for the glass.
- **Rooms**, and this is what sells it: nobody in a shop window faces the
  street, so the gamers are seen **from behind**, silhouetted against walls of
  monitors (`roomGamerPcs`), and two heads over a sofa back in front of a
  television, an arcade cabinet and a beanbag beside them (`roomGamerLounge`).
  Screens are lines of "text", not a scatter of pixels — a scatter at this size
  is diagonal hatching.
- **Door** (`gamerDoor`): glass lit cold from inside with a game pad in
  silhouette, an LED tube down each jamb, a steel push bar.
- **LED bars** (`ledBar`) at either end of the front, and a `padIcon` on the
  fascia. The fascia is the same `board` panel in its own colours.
- **Light kind `led`**: blue-white (0xa6d2ff), steady, and on until dawn. It is
  the one shop light that does not flicker — `tv` does, and a screen you can see
  through a window is not the same thing as a television in a flat — and the
  one allowed to drift toward white. Both rooms and the bars do not cast; the
  door does.
- Storeys 7, roofDepth 7, with the fascia at rows 3–5 and upper windows at 5.

**The tile palette ran out of letters here, and that is fixed** — see "Shop
palettes" below. This shop took the last three free letters and only fit
because its glass, hull-grey and navy already existed.

**Light budget:** Parade St's worst case is now **13 of 16** — the antiques shop
took it to 12 and this one to 13. Three shops in, that is a slot each, and it is
the number to watch: five more shops at that rate does not fit, so the merge
distances are the first thing to look at (1f), before anything is cut.

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

## Shop palettes

A tile grid is characters against a palette, and the tile palette is one
character each — so it has a fixed number of colours, and the third shop spent
the last of them. Measured at that point: of 89 letters, **20 were held by
colours no other module's art used** (Bento 12, Antiques 5, Gamer 3), and 49
more belonged to the base set. The palette was full of private colours.

So a shop's own colours are scoped to it. Each shop module exports one value —
`{ name, tiles, features, palette, roomPalette, height }` — and `styleOf(name)`
in `tiles.mjs` lays the shop's colours over the shared palette for exactly its
own grids. Two shops may now each use `{` for a different colour. The shared
palette went from 89 letters to 69 and now only holds colours that are shared;
**20 tile letters and 65 room letters are free**, and a shop can spend as many
of its own as it needs.

Two rules, both enforced by the sheet build (`checkStyles`), not by discipline:

- **A local letter may not shadow a shared one.** A grid could then mean two
  things by one letter, and which won would be a fact about merge order. It
  fails the build instead, which also keeps a letter meaning one thing
  everywhere it is legal.
- **A shop's height table may only name its own colours.**

The change was verified the only way that counts: the built `tiles.png`,
`tiles-normal.png` and `tiles.json` are **byte-identical** before and after.
Nothing visible moved; only where the colours are defined did.

Not taken: a fourth global namespace (the same problem, later), and non-ASCII
letters (grids stop being readable, which is the reason they are ASCII).

**A colour goes in the shared palette when a second shop wants it**, not before.
The antiques rugs and the Bento Box's boxes already share `e`, `E` and `g` in
the room palette, which is why they are still there.

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
