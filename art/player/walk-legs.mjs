// Leg blocks for the walk cycle, shared by every facing and every variant.
//
// A frame is `bob` plus `rows`:
//   bob 0 -> body sits at y=0, legs occupy rows 23..31  (9 rows)
//   bob 1 -> body shifts up 1px, legs occupy rows 22..31 (10 rows)
//
// The bob is what makes the walk read. Growing the leg block by a row on bobbed
// frames keeps the planted foot on the ground — without that the whole sprite
// hops instead of striding.
//
// Cycle order is neutral, step, neutral, other-step: the classic 4-frame
// contact/passing pattern, so the character always returns to a readable stance.

export const FB_NEUTRAL = [
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '...SSSS..SSSS...',
  '...SSSS..SSSS...',
  '...LLLL..LLLL...',
];

export const FB_STEP_L = [
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '...SSSS..PPP....',
  '...SSSS..SSSS...',
  '...LLLL..SSSS...',
  '.........LLLL...',
];

export const FB_STEP_R = [
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..SSSS...',
  '...SSSS..SSSS...',
  '...SSSS..LLLL...',
  '...LLLL.........',
];

export const SD_NEUTRAL = [
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPP......',
  '.....SSSSSS.....',
  '.....SSSSSS.....',
  '.....LLLLLL.....',
];

export const SD_STEP_A = [
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPPP.....',
  '....PPP.PPP.....',
  '....PPP.PPP.....',
  '....PPP.PPP.....',
  '...SSSSS.PPP....',
  '...SSSSS.SSSSS..',
  '...LLLLL.SSSSS..',
];

export const SD_STEP_B = [
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPP......',
  '.....PPPPPP.....',
  '....PPP.PPP.....',
  '....PPP.PPP.....',
  '....PPP.PPP.....',
  '....PPP.SSSSS...',
  '...SSSSS.SSSSS..',
  '...SSSSS.LLLLL..',
];

/** 4-frame walk cycle per facing. `side` is mirrored for `left` at build time. */
export const WALK = {
  down: [
    { bob: 0, rows: FB_NEUTRAL },
    { bob: 1, rows: FB_STEP_L },
    { bob: 0, rows: FB_NEUTRAL },
    { bob: 1, rows: FB_STEP_R },
  ],
  up: [
    { bob: 0, rows: FB_NEUTRAL },
    { bob: 1, rows: FB_STEP_R },
    { bob: 0, rows: FB_NEUTRAL },
    { bob: 1, rows: FB_STEP_L },
  ],
  side: [
    { bob: 0, rows: SD_NEUTRAL },
    { bob: 1, rows: SD_STEP_A },
    { bob: 0, rows: SD_NEUTRAL },
    { bob: 1, rows: SD_STEP_B },
  ],
};

/** Frame 0 of each cycle doubles as the idle pose. */
export const IDLE_FRAME = 0;
