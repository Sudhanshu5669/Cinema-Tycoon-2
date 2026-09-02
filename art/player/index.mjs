// Player sprite variants.
//
// Variants exist so a look can be kept and compared rather than edited in place.
// `APPROVED` names the one the game ships; the others stay for reference.

import * as a from './variant-a-mop.mjs';
import * as b from './variant-b-swept.mjs';
import * as c from './variant-c-wavy.mjs';

export const VARIANTS = [a, b, c];
export const BY_NAME = Object.fromEntries(VARIANTS.map((v) => [v.NAME, v]));

/**
 * LOCKED 2026-09-02: variant C (wavy hair, vertical eyes) is the main character.
 * It is the only variant with all three facings and a walk cycle; a and b are
 * front-only drafts kept for reference.
 */
export const APPROVED = c;
