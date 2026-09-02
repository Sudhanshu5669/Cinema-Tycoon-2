// Player variant: MOP CUT
//
// Approved 2026-09-02. Mop/bowl hair covering the ears, horizontal 2x1 eyes.
//
// 16 x 32 px — actual Stardew Valley sprite scale.
//
// The grid carries ONLY the silhouette and which material each region is;
// tools/shade.mjs applies flat cel shading over it. See art/materials.mjs.
//
//   R hair   K skin   I eye   M mouth
//   J jacket   j sleeve   C shirt   V red tie
//   P trousers   S shoe   L sole
//
// Vertical budget: 1 pad / 12 head / 10 torso / 6 legs / 3 shoes

export const NAME = 'a';
export const LABEL = 'MOP CUT';
export const W = 16, H = 32;

export const FRONT = [
  '................', //  0
  '....RRRRRRR.....', //  1
  '...RRRRRRRRRR...', //  2
  '..RRRRRRRRRRRR..', //  3
  '..RRRRRRRRRRRR..', //  4
  '..RRRRRRRRRRRR..', //  5
  '..RRRRRRRRRRRR..', //  6
  '..RRKKKKKKKKRR..', //  7
  '..RKIIKKKKIIKR..', //  8
  '..RRKKKKKKKKRR..', //  9
  '...RKKKKKKKKR...', // 10
  '....KKKMMKKK....', // 11
  '.....KKKKKK.....', // 12
  '...JJCCVVCCJJ...', // 13
  '..JJJCCVVCCJJJ..', // 14
  '.jjjJCCVVCCJjjj.', // 15
  '.jjjJCCVVCCJjjj.', // 16
  '.jjjJJCVVCJJjjj.', // 17
  '.jjjJJCCCCJJjjj.', // 18
  '.jjjJJJCCJJJjjj.', // 19
  '.KKjJJJJJJJJjKK.', // 20
  '.KKjJJJJJJJJjKK.', // 21
  '...JJJJJJJJJJ...', // 22
  '....PPPPPPPP....', // 23
  '....PPPPPPPP....', // 24
  '....PPP..PPP....', // 25
  '....PPP..PPP....', // 26
  '....PPP..PPP....', // 27
  '....PPP..PPP....', // 28
  '...SSSS..SSSS...', // 29
  '...SSSS..SSSS...', // 30
  '...LLLL..LLLL...', // 31
];

// No detail overrides needed at this scale - every pixel is already deliberate.
export const FRONT_DETAIL = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];
