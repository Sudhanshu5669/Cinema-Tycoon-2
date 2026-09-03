// Walk cycle and idle breath for the flat-direction player.
//
// A frame is `bob` plus a leg block:
//   bob 0 -> body sits at y=0, the leg block fills rows 26..47 (22 rows)
//   bob 1 -> body shifts up 1px, the leg block fills rows 25..47 (23 rows)
// Growing the block by a row on bobbed frames keeps the planted foot on the
// ground; without it the whole figure hops instead of walking.
//
// Which frames bob is not arbitrary. The hip is highest when the legs are
// together (passing) and lowest when they are apart (contact), so:
//   - front/back: the legs are only ever together, so the bob rides the frames
//     where one foot lifts.
//   - profile: the bob rides the passing frames, and the stride frames sit low.
//
// The profile's two stride frames would be identical if both legs were drawn in
// the same tone — the classic side-view walk problem. They are told apart by
// depth instead: the far leg is drawn entirely in the shade tone (P/B), the near
// leg in the base tone with its usual leading edge. Stride A puts the near leg
// forward, stride B puts the far leg forward. This is the same trick the static
// sprite already uses for the far arm.

// ----------------------------------------------------------- front and back
// Legs never separate left/right on these facings, so the cycle is the classic
// neutral / lift / neutral / other-lift.

export const FB_NEUTRAL = [
  '..ppppppppppP...', // 26
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..pppP...pppP...', // 29
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...', // 45
  '..bbbB...bbbB...', // 46
  '..bbbB...bbbB...', // 47
];

/**
 * Screen-left foot lifted three pixels clear of the ground and swung a pixel
 * toward the centre line, which is what a bent knee looks like at 4px wide. A
 * first pass lifted it two pixels with no shift and the step was invisible.
 */
export const FB_LIFT_L = [
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...pppP..pppP...',
  '...bbbB..pppP...',
  '...bbbB..pppP...',
  '.........pppP...',
  '.........bbbB...',
  '.........bbbB...',
];

/** Mirror of FB_LIFT_L. */
export const FB_LIFT_R = [
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..ppppppppppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP...pppP...',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..pppP....',
  '..pppP..bbbB....',
  '..pppP..bbbB....',
  '..pppP..........',
  '..bbbB..........',
  '..bbbB..........',
];

// ------------------------------------------------------------------ profile

export const SD_NEUTRAL = [
  '....ppppppP.....', // 26
  '....ppppppP.....',
  '....ppppppP.....',
  '.....pppP.......', // 29
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......',
  '.....pppP.......', // 45
  '.....bbbbB......', // 46
  '.....bbbbB......', // 47
];

/** Passing pose: same stance, one row taller to absorb the bob. */
export const SD_PASSING = ['....ppppppP.....', ...SD_NEUTRAL];

/** Contact, near leg forward. The far leg is drawn in the far-limb tones. */
export const SD_STRIDE_A = [
  '....ppppppP.....',
  '....ppppppP.....',
  '....ppppppP.....',
  '....qqpppP......',
  '....qqpppP......',
  '...qqq.pppP.....',
  '...qqq.pppP.....',
  '...qqq.pppP.....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '...qqq..pppP....',
  '..dddd..bbbB....',
  '..dddd..bbbB....',
];

/** Contact, far leg forward — same silhouette as A with the depth swapped. */
export const SD_STRIDE_B = [
  '....ppppppP.....',
  '....ppppppP.....',
  '....ppppppP.....',
  '....ppqqqq......',
  '....ppqqqq......',
  '...ppP.qqqq.....',
  '...ppP.qqqq.....',
  '...ppP.qqqq.....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '...ppP..qqqq....',
  '..bbbB..dddd....',
  '..bbbB..dddd....',
];

// -------------------------------------------------------------- arm patches
// Each patch replaces body rows by index. The profile's arm slides a pixel
// along x, which changes the silhouette rather than just recolouring inside it.

const SD_ARM_NEUTRAL = {};
const SD_ARM_FWD = {
  17: '...jjjjjjcccJ...', 18: '...jjjjjjcccJ...', 19: '...jjjjjjcccJ...',
  20: '...jjjjjjcccJ...', 21: '...jjjjjjcccJ...', 22: '...jjjjjjcccJ...',
  23: '...jjjjjjcccJ...', 24: '...jjjjjjkkkJ...', 25: '...jjjjjjkkkJ...',
};
const SD_ARM_BACK = {
  17: '...jjjjcccjJ....', 18: '...jjjjcccjJ....', 19: '...jjjjcccjJ....',
  20: '...jjjjcccjJ....', 21: '...jjjjcccjJ....', 22: '...jjjjcccjJ....',
  23: '...jjjjcccjJ....', 24: '...jjjjkkkjJ....', 25: '...jjjjkkkjJ....',
};

// Front and back: an arm swinging toward or away from the camera barely moves
// the outline, so the swing is only the hands sliding a pixel up the sleeve.
const FB_ARM_NEUTRAL = {};
const FB_ARM_A = {
  23: '.kkjjjjjjjjjJJ..', 24: '.kkjjjjjjjjjkK..', 25: '.ccjjjjjjjjjkK..',
};
const FB_ARM_B = {
  23: '.ccjjjjjjjjjkK..', 24: '.kkjjjjjjjjjkK..', 25: '.kkjjjjjjjjjJJ..',
};

// ------------------------------------------------------------------- cycles
// Arms swing contralaterally: the arm opposite the forward leg goes forward.

export const WALK = {
  down: [
    { bob: 0, legs: FB_NEUTRAL, arms: FB_ARM_NEUTRAL },
    { bob: 1, legs: FB_LIFT_L, arms: FB_ARM_A },
    { bob: 0, legs: FB_NEUTRAL, arms: FB_ARM_NEUTRAL },
    { bob: 1, legs: FB_LIFT_R, arms: FB_ARM_B },
  ],
  up: [
    { bob: 0, legs: FB_NEUTRAL, arms: FB_ARM_NEUTRAL },
    { bob: 1, legs: FB_LIFT_R, arms: FB_ARM_B },
    { bob: 0, legs: FB_NEUTRAL, arms: FB_ARM_NEUTRAL },
    { bob: 1, legs: FB_LIFT_L, arms: FB_ARM_A },
  ],
  side: [
    { bob: 0, legs: SD_STRIDE_A, arms: SD_ARM_BACK },
    { bob: 1, legs: SD_PASSING, arms: SD_ARM_NEUTRAL },
    { bob: 0, legs: SD_STRIDE_B, arms: SD_ARM_FWD },
    { bob: 1, legs: SD_PASSING, arms: SD_ARM_NEUTRAL },
  ],
};

/**
 * Idle breath. Two frames held for a long time: the same stance, the upper body
 * a pixel higher on the second. Reuses the bob rather than inventing a second
 * mechanism, so a standing character is never a completely dead sprite.
 */
export const IDLE = {
  down: [{ bob: 0, legs: FB_NEUTRAL, arms: {} }, { bob: 1, legs: [FB_NEUTRAL[0], ...FB_NEUTRAL], arms: {} }],
  up: [{ bob: 0, legs: FB_NEUTRAL, arms: {} }, { bob: 1, legs: [FB_NEUTRAL[0], ...FB_NEUTRAL], arms: {} }],
  side: [{ bob: 0, legs: SD_NEUTRAL, arms: {} }, { bob: 1, legs: SD_PASSING, arms: {} }],
};
