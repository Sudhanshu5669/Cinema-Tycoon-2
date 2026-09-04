# Systems

Build order top to bottom, one at a time, each verified in a real browser
before the next starts. Reorder only on a real dependency; note why inline.

Status values: `pending` / `building` / `testing` / `done` / `blocked`.

| #  | System | Status | Test notes |
|----|--------|--------|------------|
| 0  | Art pipeline (ASCII grids -> PNG, palette ramps, validator) | done | `node tools/build-flat.mjs` validates all grids are 16x48 with known palette chars and emits `review/player-flat.png`. Rebuilt 2026-09-03 for the flat direction: `tools/flat.mjs` is a plain indexed-colour renderer, since flat art gives a shader nothing to decide. The Stardew-era `tools/shade.mjs` + `art/materials.mjs` cel/normal pipeline is superseded and unreferenced, still in the tree pending a decision to delete. |
| 1  | **Player character sprite** | done | **APPROVED 2026-09-03: flat "tall figure" direction**, 16x48, `art/flat/player.mjs` + `art/flat/palette.mjs`. All three facings; left is mirrored right. Supersedes the Stardew 16x32 variant C, whose side view never landed across four attempts — see GAME_SPEC for the full rejected-direction history. |
| 2  | Input abstraction (keyboard + touch behind one interface) | done | `src/core/input/`. `Input` merges any number of sources and exposes `axis` + `isDown`/`justPressed`/`justReleased`; `KeyboardSource` is the only file in the project allowed to touch a KeyboardEvent, and `VirtualStickSource` is the touch port that #21's on-screen joystick will write into — present on every platform so gameplay never branches on device. Bindings are by physical `code` so they survive a non-QWERTY layout, opposite keys cancel instead of fighting, and a window blur clears held keys (otherwise losing focus mid-key never delivers the keyup and the player walks forever). Merged diagonals are clamped to the unit circle. |
| 3  | Walking system (4-directional movement, speed, facing) | done | `src/game/player.js` + `src/scenes/DevScene.js`. **Movement is 8-directional, facing is 4-directional** — a deliberate read of this row: strict 4-way movement feels stiff turning a corner, and there are only 4 facings of art. `pickFacing` keeps the current facing while its component is still held, which is what stops a keyboard diagonal (both components exactly 1, so "largest wins" cannot break the tie) from strobing between two facings every frame. Sprite origin is at the feet — the ground contact point, which is what collision (#7) and depth sorting both want. Position is float, drawn rounded. Verified in real Chromium: `node tools/smoke.mjs`, 16/16 checks, covering travel per direction, measured speed (65px/s against a configured 64), diagonal speed parity, facing stability, opposite-key cancellation, walk-clip advance, whole-pixel draw, integer zoom and a clean console. No collision yet, so the dev scene clamps the player to the room. |
| 4  | Walk animation frames | done | 4 facings x 6 frames = 24, built by `node tools/build-walk.mjs` -> `public/assets/player.png` (96x192). Columns are [idle 0, idle 1, walk 0..3]; rows down/left/right/up. Poses live in `art/flat/walk.mjs` as leg blocks composed under body rows 0..25, so legs are authored once, not once per facing. Verified by rendering `review/player-anim-frames.png` and `review/player-anim.gif`, and by dumping the sheet's leg pixels per frame. Two things needed a second pass after review: the front/back foot lift was 2px with no sideways shift and was invisible, now 3px plus a 1px swing toward the centre line; and the two profile stride frames were near-identical, now told apart by drawing the far leg in dedicated darker tones (`q`/`d`). Not yet verified in-browser — that happens with system #3. Stale Stardew-era outputs `public/assets/player-walk.png` and `player-front.png` were deleted; they are regenerable from `tools/build-anim.mjs` if ever wanted. |
| 5  | Camera (follow, deadzone, pixel-snapped to avoid shimmer) | done | `src/game/camera.js`. **Phaser's own `startFollow` is deliberately not used.** With `roundPixels` on, Phaser floors the lerped scroll and feeds that back as next frame's scroll, so the fraction is lost every frame and a slow lerp can never close the last pixel — the camera stalls until the target is several pixels past the deadzone and keeps that error when the player stops. Here the float scroll is kept in `FollowCamera` and only a rounded copy reaches the camera, so the smoothing converges on exact numbers while the renderer only ever sees integers. (`startFollow` also silently resets `roundPixels` to false unless you pass it — a second reason to own this.) Smoothing is an exponential rate per second, not a per-frame lerp, so the feel does not change with frame rate; the camera aims at mid-body rather than the feet. The dev room grew to 3x3 screens (a camera has nothing to prove in a single-screen room) and the deadzone is outlined on screen in DEV builds. Verified in real Chromium: `node tools/smoke.mjs`, 27/27, adding centring at rest, deadzone hold, follow past the deadzone, integer scroll on every sampled frame, the player never leaving the screen, and the clamp at both world corners. `__dev.warp` was added so the bounds check does not have to walk 960px in real time. |
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
