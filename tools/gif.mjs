// Minimal animated GIF89a encoder (indexed colour, LZW, looping).
// Dependency-free, same as the PNG encoder — the art pipeline installs nothing.

function lzw(indices, minCodeSize) {
  const clear = 1 << minCodeSize, eoi = clear + 1;
  let dict, next, codeSize;
  const init = () => {
    dict = new Map();
    for (let i = 0; i < clear; i++) dict.set(String(i), i);
    next = eoi + 1;
    codeSize = minCodeSize + 1;
  };
  const bytes = [];
  let acc = 0, accBits = 0;
  const emit = (code, n) => {
    acc |= code << accBits;
    accBits += n;
    while (accBits >= 8) { bytes.push(acc & 0xff); acc >>>= 8; accBits -= 8; }
  };

  init();
  emit(clear, codeSize);
  let prefix = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const cand = prefix + ',' + k;
    if (dict.has(cand)) { prefix = cand; continue; }
    emit(dict.get(prefix), codeSize);
    dict.set(cand, next++);
    if (next > (1 << codeSize)) {
      if (codeSize < 12) codeSize++;
      else { emit(clear, codeSize); init(); }
    }
    prefix = String(k);
  }
  emit(dict.get(prefix), codeSize);
  emit(eoi, codeSize);
  if (accBits > 0) bytes.push(acc & 0xff);
  return bytes;
}

function subBlocks(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunk = bytes.slice(i, i + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0);
  return out;
}

/**
 * @param {{w:number,h:number,indices:Uint8Array}[]} frames  paletted frames
 * @param {number[][]} palette  up to 256 [r,g,b]
 * @param {number} delayCs      frame delay in hundredths of a second
 */
export function encodeGIF(frames, palette, delayCs) {
  const { w, h } = frames[0];
  let bits = 1;
  while ((1 << bits) < palette.length) bits++;
  bits = Math.max(1, Math.min(8, bits));
  const tableSize = 1 << bits;

  const out = [];
  const push = (...b) => out.push(...b);
  const u16 = (v) => push(v & 0xff, (v >> 8) & 0xff);

  push(...[...'GIF89a'].map((c) => c.charCodeAt(0)));
  u16(w); u16(h);
  push(0x80 | ((bits - 1) << 4) | (bits - 1), 0, 0);   // GCT present, sized
  for (let i = 0; i < tableSize; i++) {
    const c = palette[i] || [0, 0, 0];
    push(c[0], c[1], c[2]);
  }
  // Netscape extension: loop forever
  push(0x21, 0xff, 0x0b, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 0x03, 0x01, 0x00, 0x00, 0x00);

  for (const f of frames) {
    push(0x21, 0xf9, 0x04, 0x00); u16(delayCs); push(0x00, 0x00);   // no transparency
    push(0x2c); u16(0); u16(0); u16(w); u16(h); push(0x00);
    const min = Math.max(2, bits);
    push(min, ...subBlocks(lzw(Array.from(f.indices), min)));
  }
  push(0x3b);
  return Buffer.from(out);
}

/** Quantise an RGBA Bitmap to palette indices, building the palette as it goes. */
export function quantise(bmp, palette, lookup) {
  const idx = new Uint8Array(bmp.w * bmp.h);
  for (let y = 0; y < bmp.h; y++) {
    for (let x = 0; x < bmp.w; x++) {
      const [r, g, b] = bmp.get(x, y);
      const key = (r << 16) | (g << 8) | b;
      let i = lookup.get(key);
      if (i === undefined) {
        if (palette.length >= 256) throw new Error('GIF palette overflow (>256 colours)');
        i = palette.length;
        palette.push([r, g, b]);
        lookup.set(key, i);
      }
      idx[y * bmp.w + x] = i;
    }
  }
  return { w: bmp.w, h: bmp.h, indices: idx };
}
