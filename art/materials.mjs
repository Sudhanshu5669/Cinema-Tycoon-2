// Material definitions — Stardew reference pass (16 x 32, actual Stardew scale).
//
// At this size every pixel is load-bearing, so the palette stays tiny: each
// material resolves to four stops only (outline / shadow / base / highlight).
// Ramps hue-shift — shadows cool, highlights warm — but only slightly.

export const COOL_HUE = 254;
export const WARM_HUE = 44;

const M = (base, o = {}) => ({
  base,
  darkL:      o.darkL      ?? 0.16,
  lightL:     o.lightL     ?? 0.11,
  coolShift:  o.coolShift  ?? 0.13,
  warmShift:  o.warmShift  ?? 0.14,
  satDark:    o.satDark    ?? 0.06,
  satLight:   o.satLight   ?? 0.08,
  flat:       o.flat       ?? false,
  outline:    o.outline    ?? 0.03,
  shadowRun:  o.shadowRun  ?? 0,   // 0 = a single-pixel shadow edge; right at this scale
});

export const MATERIALS = {
  R:  M('#4c3927', { darkL: 0.12, lightL: 0.14 }),   // messy dark hair — the silhouette's anchor
  K:  M('#ebb78f', { darkL: 0.13, coolShift: 0.06, satDark: 0.0 }), // skin
  W:  M('#f7f2e6', { flat: true }),                  // eye catchlight
  I:  M('#241d22', { flat: true }),                  // eyes, in the shadow of the fringe
  M_: M('#8c4f43', { flat: true }),                  // mouth
  J:  M('#5f4a35'),                                  // jacket body
  j:  M('#56422e'),                                  // jacket sleeve
  C:  M('#ece0c6', { darkL: 0.13 }),                 // shirt
  V:  M('#b8342c', { darkL: 0.15 }),                 // red scarf — the one saturated accent
  P:  M('#3a3644'),                                  // trousers
  S:  M('#e6ddc6', { darkL: 0.14 }),                 // pale shoes
  L:  M('#3a332a'),                                  // sole
};

export const MATERIAL_FOR_CHAR = { ...MATERIALS, M: MATERIALS.M_ };
delete MATERIAL_FOR_CHAR.M_;
