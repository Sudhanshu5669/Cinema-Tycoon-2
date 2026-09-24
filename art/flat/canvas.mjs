// A mutable pixel canvas that comes out as an array of row strings -- the
// shared drawing helper for the composed shops (bento.mjs, antiques.mjs).
// What it produces is still a list of equal-width strings, so `validateGrid`
// treats it exactly like a hand-typed grid.

export function canvas(w, h, fill = '.') {
  const px = Array.from({ length: h }, () => new Array(w).fill(fill));
  const api = {
    set(x, y, ch) { if (x >= 0 && y >= 0 && x < w && y < h) px[y][x] = ch; return api; },
    get: (x, y) => px[y]?.[x],
    rect(x, y, rw, rh, ch) {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) api.set(i, j, ch);
      return api;
    },
    /** A hollow rectangle, one pixel wide. */
    frame(x, y, rw, rh, ch) {
      api.rect(x, y, rw, 1, ch).rect(x, y + rh - 1, rw, 1, ch);
      api.rect(x, y, 1, rh, ch).rect(x + rw - 1, y, 1, rh, ch);
      return api;
    },
    /** Row-by-row art pasted at (x, y); '.' in `rows` leaves what is there. */
    paste(x, y, rows) {
      rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') api.set(x + i, y + j, ch); }));
      return api;
    },
    rows: () => px.map((r) => r.join('')),
  };
  return api;
}
