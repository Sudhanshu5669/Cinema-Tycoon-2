// Player character — flat "tall figure" direction.
//
// 16 x 48. Proportions are measured off the supplied reference, not guessed.
// The reference figures are 13 x 50 native pixels and break down as:
//
//   head        10 rows   20% of height,  7px wide  = 54% of body width
//   torso       16 rows   32%,           13px wide
//   hips         4 rows    8%
//   legs+feet   20 rows   40%,            4px each, 3px gap
//
// The 54% head-to-body width is the number that matters. A first pass at 67%
// looked like a bobblehead next to the reference even though its vertical
// proportions were already right.
//
// Rules the reference dictates, all of which the old Stardew 16x32 sprite broke:
//   - No outline. Shapes sit flat against the background.
//   - Light comes from the left: the near arm and the leading edge of each leg
//     carry the only shading, one tone each. No ramps.
//   - The face carries eyes only — one dark pixel each. No nose, no mouth.
//   - There IS a neck, one pixel row of it.
//   - Legs are long and thin with a clear gap; feet are small and dark.

export const W = 16, H = 48;

/**
 * Rows 0..25 are the body (head, torso, arms, hands); rows 26..47 are the hips,
 * legs and feet. Animation composes a frame as (body + leg block), so the legs
 * are authored once per pose instead of once per pose per facing — see
 * art/flat/walk.mjs. The split sits at the waist rather than the knee because a
 * stride has to widen the hips, not just the shins.
 */
export const BODY_ROWS = 26;

export const DOWN = [
  '................', //  0
  '.....hhhhh......', //  1
  '....hhhhhhh.....', //  2
  '....hHHhhhh.....', //  3
  '....hHhhhhh.....', //  4
  '....hkkkkhh.....', //  5
  '....hkekekh.....', //  6  eyes: one pixel each, and that is the whole face
  '....hkkkkkh.....', //  7
  '....hkkkkkh.....', //  8
  '.....kkkkk......', //  9
  '......kkk.......', // 10  neck
  '..cjjjssssjjJ...', // 11  collar; shoulders slope in by 1px. c = lit arm,
  '.ccjjjsvvsjjJJ..', // 12  J = shaded arm — the reference never squares them off
  '.ccjjjsvvsjjJJ..', // 13
  '.ccjjjsvvsjjJJ..', // 14
  '.ccjjjsvvsjjJJ..', // 15
  '.ccjjjsvvsjjJJ..', // 16
  '.ccjjjsvvsjjJJ..', // 17
  '.ccjjjsvvsjjJJ..', // 18
  '.ccjjjjvvjjjJJ..', // 19
  '.ccjjjjjjjjjJJ..', // 20
  '.ccjjjjjjjjjJJ..', // 21
  '.ccjjjjjjjjjJJ..', // 22
  '.ccjjjjjjjjjJJ..', // 23
  '.kkjjjjjjjjjkK..', // 24  hands are the last two rows of the arms
  '.kkjjjjjjjjjkK..', // 25
  '..ppppppppppP...', // 26
  '..ppppppppppP...', // 27
  '..ppppppppppP...', // 28
  '..pppP...pppP...', // 29
  '..pppP...pppP...', // 30
  '..pppP...pppP...', // 31
  '..pppP...pppP...', // 32
  '..pppP...pppP...', // 33
  '..pppP...pppP...', // 34
  '..pppP...pppP...', // 35
  '..pppP...pppP...', // 36
  '..pppP...pppP...', // 37
  '..pppP...pppP...', // 38
  '..pppP...pppP...', // 39
  '..pppP...pppP...', // 40
  '..pppP...pppP...', // 41
  '..pppP...pppP...', // 42
  '..pppP...pppP...', // 43
  '..pppP...pppP...', // 44
  '..pppP...pppP...', // 45
  '..bbbB...bbbB...', // 46
  '..bbbB...bbbB...', // 47
];

export const UP = [
  '................', //  0
  '.....hhhhh......', //  1
  '....hhhhhhh.....', //  2
  '....hHHhhhh.....', //  3
  '....hhhhhhh.....', //  4
  '....hhhhhhh.....', //  5
  '....hhhhhhh.....', //  6
  '....hhhhhhh.....', //  7
  '....hhhhhhh.....', //  8
  '.....hhhhh......', //  9
  '......kkk.......', // 10
  '..cjjjjjjjjjJ...', // 11  shoulders slope in by 1px
  '.ccjjjjjjjjjJJ..', // 12
  '.ccjjjjjjjjjJJ..', // 13
  '.ccjjjjjjjjjJJ..', // 14
  '.ccjjjjjjjjjJJ..', // 15
  '.ccjjjjjjjjjJJ..', // 16
  '.ccjjjjjjjjjJJ..', // 17
  '.ccjjjjjjjjjJJ..', // 18
  '.ccjjjjjjjjjJJ..', // 19
  '.ccjjjjjjjjjJJ..', // 20
  '.ccjjjjjjjjjJJ..', // 21
  '.ccjjjjjjjjjJJ..', // 22
  '.ccjjjjjjjjjJJ..', // 23
  '.kkjjjjjjjjjkK..', // 24
  '.kkjjjjjjjjjkK..', // 25
  '..ppppppppppP...', // 26
  '..ppppppppppP...', // 27
  '..ppppppppppP...', // 28
  '..pppP...pppP...', // 29
  '..pppP...pppP...', // 30
  '..pppP...pppP...', // 31
  '..pppP...pppP...', // 32
  '..pppP...pppP...', // 33
  '..pppP...pppP...', // 34
  '..pppP...pppP...', // 35
  '..pppP...pppP...', // 36
  '..pppP...pppP...', // 37
  '..pppP...pppP...', // 38
  '..pppP...pppP...', // 39
  '..pppP...pppP...', // 40
  '..pppP...pppP...', // 41
  '..pppP...pppP...', // 42
  '..pppP...pppP...', // 43
  '..pppP...pppP...', // 44
  '..pppP...pppP...', // 45
  '..bbbB...bbbB...', // 46
  '..bbbB...bbbB...', // 47
];

// Faces screen-right. LEFT is this mirrored at build time.
export const SIDE = [
  '................', //  0
  '.....hhhhh......', //  1
  '....hhhhhhh.....', //  2
  '....hHHhhhh.....', //  3
  '....hhhhhhh.....', //  4
  '....hhhkkkk.....', //  5
  '....hhhkekk.....', //  6
  '....hhhkkkkk....', //  7  x11 is the nose, the one bump a profile gets
  '....hhkkkkk.....', //  8
  '.....kkkkk......', //  9
  '......kkk.......', // 10
  '...jjjjjsssJ....', // 11
  '...jjjjjjsvJ....', // 12
  '...jjjjjjsvJ....', // 13
  '...jjjjjjsvJ....', // 14
  '...jjjjjjsvJ....', // 15
  '...jjjjjjsvJ....', // 16
  '...jjjjjcccJ....', // 17  near arm, lit — no outline needed to separate it
  '...jjjjjcccJ....', // 18
  '...jjjjjcccJ....', // 19
  '...jjjjjcccJ....', // 20
  '...jjjjjcccJ....', // 21
  '...jjjjjcccJ....', // 22
  '...jjjjjcccJ....', // 23
  '...jjjjjkkkJ....', // 24
  '...jjjjjkkkJ....', // 25
  '....ppppppP.....', // 26
  '....ppppppP.....', // 27
  '....ppppppP.....', // 28
  '.....pppP.......', // 29
  '.....pppP.......', // 30
  '.....pppP.......', // 31
  '.....pppP.......', // 32
  '.....pppP.......', // 33
  '.....pppP.......', // 34
  '.....pppP.......', // 35
  '.....pppP.......', // 36
  '.....pppP.......', // 37
  '.....pppP.......', // 38
  '.....pppP.......', // 39
  '.....pppP.......', // 40
  '.....pppP.......', // 41
  '.....pppP.......', // 42
  '.....pppP.......', // 43
  '.....pppP.......', // 44
  '.....pppP.......', // 45
  '.....bbbbB......', // 46
  '.....bbbbB......', // 47
];

export const FACINGS = { down: DOWN, side: SIDE, up: UP };
