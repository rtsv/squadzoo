/** @typedef {string[][]} LetterGrid */

export const GRID_SIZE = 9;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Pool used to build each puzzle (12–15 words picked per round) */
export const PUZZLE_WORD_BANK = [
  "CAT", "DOG", "SUN", "RUN", "FUN", "MAP", "RED", "GAME", "HUNT", "PLAY",
  "TREE", "BOOK", "STAR", "MOON", "TIME", "TEAM", "WORK", "BEST", "FREE", "KIND",
  "SAFE", "WARM", "COLD", "JUMP", "LOOK", "FIND", "HELP", "READ", "OPEN", "FAST",
  "FISH", "BIRD", "SHIP", "ROAD", "PARK", "RAIN", "WIND", "FIRE", "LIFE", "HOPE",
];

const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Pick `count` unique words for one puzzle (default 12) */
export function pickTargetWords(count = 12) {
  const shuffled = [...PUZZLE_WORD_BANK].sort(() => Math.random() - 0.5);
  const out = [];
  const seen = new Set();
  for (const w of shuffled) {
    if (w.length > GRID_SIZE) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= count) break;
  }
  while (out.length < Math.min(count, PUZZLE_WORD_BANK.length)) {
    const w = PUZZLE_WORD_BANK[out.length % PUZZLE_WORD_BANK.length];
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    } else break;
  }
  return out;
}

export function reverseString(s) {
  return s.split("").reverse().join("");
}

/**
 * Place exactly the given words on the grid (random direction; forward or backward along the line).
 * Returns canonical word list for gameplay: { text, foundBy: null }[]
 */
export function generateGridFromTargets(targetTexts, size = GRID_SIZE) {
  const words = targetTexts.map((t) => ({
    text: String(t).toUpperCase(),
    foundBy: null,
  }));

  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  for (const { text: canonical } of shuffled) {
    const forward = canonical;
    const placedLetters = Math.random() < 0.5 ? forward : reverseString(forward);

    for (let tries = 0; tries < 150; tries++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      const endR = r + (placedLetters.length - 1) * dr;
      const endC = c + (placedLetters.length - 1) * dc;
      if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

      let ok = true;
      for (let i = 0; i < placedLetters.length; i++) {
        const rr = r + i * dr;
        const cc = c + i * dc;
        const ch = grid[rr][cc];
        const wch = placedLetters[i];
        if (ch !== "" && ch !== wch) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      for (let i = 0; i < placedLetters.length; i++) {
        const rr = r + i * dr;
        const cc = c + i * dc;
        grid[rr][cc] = placedLetters[i];
      }
      break;
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      }
    }
  }

  return { grid, words };
}

/** Match selection to an unclaimed target (forward or backward spelling on grid) */
export function findMatchingWordIndex(words, grid, path) {
  if (!path?.length || !isValidStraightPath(path)) return -1;
  const s = pathToWord(grid, path).toUpperCase();
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.foundBy !== null && w.foundBy !== undefined) continue;
    const t = w.text.toUpperCase();
    if (path.length !== t.length) continue;
    if (s === t || s === reverseString(t)) return i;
  }
  return -1;
}

/** Ordered path [[r,c], ...] — straight line, unit steps, 8 directions */
export function isValidStraightPath(path) {
  if (!path || path.length < 2) return false;
  const seen = new Set();
  for (const [r, c] of path) {
    const k = `${r},${c}`;
    if (seen.has(k)) return false;
    seen.add(k);
  }
  const [r0, c0] = path[0];
  const [r1, c1] = path[1];
  const dr = r1 - r0;
  const dc = c1 - c0;
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (dr === 0 && dc === 0)) return false;
  for (let i = 2; i < path.length; i++) {
    const pr = path[i][0] - path[i - 1][0];
    const pc = path[i][1] - path[i - 1][1];
    if (pr !== dr || pc !== dc) return false;
  }
  return true;
}

export function pathToWord(grid, path) {
  if (!path?.length) return "";
  return path.map(([r, c]) => grid[r]?.[c] ?? "").join("");
}

/**
 * Extend selection to (r,c) along a straight line, filling skipped cells (fast drag).
 */
export function bridgePath(path, tr, tc, gridSize = GRID_SIZE) {
  if (path.length === 0) return [[tr, tc]];
  const last = path[path.length - 1];
  if (last[0] === tr && last[1] === tc) return path;
  const dr = tr - last[0];
  const dc = tc - last[1];
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (steps === 0) return path;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
    return tryAppendToPath(path, tr, tc, gridSize);
  }
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  if (path.length >= 2) {
    const pdr = path[path.length - 1][0] - path[path.length - 2][0];
    const pdc = path[path.length - 1][1] - path[path.length - 2][1];
    if (stepR !== pdr || stepC !== pdc) {
      return tryAppendToPath(path, tr, tc, gridSize);
    }
  }
  const next = [...path];
  let r = last[0];
  let c = last[1];
  while (r !== tr || c !== tc) {
    r += stepR;
    c += stepC;
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return null;
    const hit = next.findIndex(([pr, pc]) => pr === r && pc === c);
    if (hit >= 0) {
      if (next.length >= 2 && next[next.length - 2][0] === r && next[next.length - 2][1] === c) {
        next.pop();
        continue;
      }
      return next;
    }
    next.push([r, c]);
  }
  return next;
}

export function tryAppendToPath(path, r, c, gridSize = GRID_SIZE) {
  if (r < 0 || c < 0 || r >= gridSize || c >= gridSize) return null;
  if (path.some(([pr, pc]) => pr === r && pc === c)) {
    if (path.length >= 2) {
      const prev = path[path.length - 2];
      if (prev[0] === r && prev[1] === c) return path.slice(0, -1);
    }
    return null;
  }
  if (path.length === 0) return [[r, c]];
  const last = path[path.length - 1];
  if (path.length === 1) {
    const dr = r - last[0];
    const dc = c - last[1];
    if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0)) {
      return [...path, [r, c]];
    }
    return null;
  }
  const dr = path[1][0] - path[0][0];
  const dc = path[1][1] - path[0][1];
  if (r - last[0] === dr && c - last[1] === dc) return [...path, [r, c]];
  return null;
}
