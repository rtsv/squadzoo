/** @typedef {'higher' | 'lower' | 'correct'} GuessHint */

/**
 * @param {number} guess
 * @param {number} target
 * @returns {GuessHint}
 */
export function compareGuess(guess, target) {
  if (guess === target) return "correct";
  if (guess < target) return "higher";
  return "lower";
}

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
export function isValidSecret(n, min, max) {
  return Number.isInteger(n) && n >= min && n <= max;
}

/**
 * @param {number} guess
 * @param {{ value: number }[]} playerGuesses
 */
export function isDuplicateGuess(guess, playerGuesses) {
  return playerGuesses.some((g) => g.value === guess);
}

export function hintLabel(hint) {
  if (hint === "higher") return "Higher ⬆️";
  if (hint === "lower") return "Lower ⬇️";
  return "Correct ✅";
}
