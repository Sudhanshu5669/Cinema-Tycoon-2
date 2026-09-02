# Systems

Build order top to bottom, one at a time, each verified in a real browser
before the next starts. Reorder only on a real dependency; note why inline.

Status values: `pending` / `building` / `testing` / `done` / `blocked`.

| #  | System | Status | Test notes |
|----|--------|--------|------------|
| 0  | Art pipeline (ASCII grids -> PNG, palette ramps, validator) | done | `node tools/build-sprites.mjs` validates all grids are 16x32 with known palette chars, emits `public/assets/player.png` (4 frames) + `review/player-review.png`. Verified by rendering and inspecting the review sheet. |
| 1  | **Player character sprite** | done | **LOCKED 2026-09-02: variant C (wavy hair, vertical eyes)** in `art/player/`. 16x32, actual Stardew scale. Four art directions were tried before this landed: Eastward 32x56 lit shading (rejected, "glassy"), Stardew 32x48 cel (rejected, ~3x too much resolution), 16x32 mop-cut (variant a, approved then superseded), swept (variant b). All three facings authored: down / up / side; left is mirrored right. |
| 2  | Input abstraction (keyboard + touch behind one interface) | pending | Must be built before movement so no system ever reads a raw key event. Desktop + mobile both declared in GAME_SPEC. |
| 3  | Walking system (4-directional movement, speed, facing) | pending | |
| 4  | Walk animation frames | done | 4 facings x 4 frames = 16, built by `node tools/build-anim.mjs` -> `public/assets/player-walk.png` (64x128). Cycle is neutral/step/neutral/other-step with a 1px body bob on step frames; the leg block grows a row on bobbed frames so the planted foot stays on the ground. Verified by rendering `review/player-frames.png` (all 16 frames) and `review/player-walk.gif` (animated, all facings in step). Side view revised twice after user review ("fat", then "weird"): torso slimmed 12->10px vs the front's 14, head recentred over the body (it hung 3px behind, reading as a hunch), nose restored, and arm swing added for the profile only. Confirmed against the Stardew wiki that frames are 16x32, 4 per direction, cycle order neutral/step/neutral/step, and left is a mirror of right — all of which this matches. Side view revised three times on user review ("fat", "weird", "legs animation is one big problem"). Root cause of the last one: the profile leg was a 4px column ending in a 7px shoe — a peg leg with a flipper — and the two legs never separated. Now the neutral leg is 5px under a 6px foot, and step frames scissor into two 3px legs with both feet built the same 3 rows so neither looks foreshortened. Also slimmed the profile head 11->10px and widened the torso 10->11px, since the head out-measuring the torso was reading top-heavy. Head shape itself kept (user picked it over three alternatives). Not yet verified in-browser — that happens with system #3. |
| 5  | Camera (follow, deadzone, pixel-snapped to avoid shimmer) | pending | |
| 6  | Tile renderer + 3/4 perspective wall faces | pending | |
| 7  | Collision (tile-based, per-tile solid flags) | pending | |
| 8  | Lighting layer (colored overlay + light cutouts) | pending | The 4th Eastward discipline from GAME_SPEC; makes or breaks the look. |
| 9  | City data schema + loader (data-driven, hand-editable map) | pending | User requirement: changing the city must be a data edit, never a code change. |
| 10 | Interior scenes + door/transition system | pending | |
| 11 | VN dialogue system (nameplate + dialogue box, typewriter) | pending | |
| 12 | Opening story scene (arrival in town, "I bought the cinema") | pending | |
| 13 | NPCs (spawn from data, idle behaviour, talk trigger) | pending | |
| 14 | NPC pathfinding/steering | pending | PathFinding.js on the tile grid. |
| 15 | Cinema interior (derelict state) + interaction points | pending | |
| 16 | Tycoon core: money, time/day cycle, cinema condition model | pending | |
| 17 | Repair/upgrade system | pending | |
| 18 | Film booking + screenings + ticket pricing | pending | |
| 19 | Customer simulation (footfall driven by reputation/city) | pending | |
| 20 | Management UI/HUD | pending | Must work at 640x360 internal and with touch targets. |
| 21 | Mobile touch controls (virtual joystick + tap) | pending | |
| 22 | Audio | pending | |
| 23 | Save/load | pending | |

Rows 16-19 are the tycoon layer and will almost certainly split further once
we get there — they're placeholders for scope, not final granularity.
