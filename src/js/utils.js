/**
 * Returns a random integer in the inclusive range [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates a shuffled copy of an array using Fisher–Yates.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
export function shuffleArray(arr) {
  const pool = arr.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Parses and returns the playlist from localStorage, or an empty array on failure.
 * @returns {string[]}
 */
export function getPlayedIds() {
  try {
    const raw = localStorage.getItem('maintenance-played-ids');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Saves the list of played track IDs to localStorage.
 * @param {string[]} ids
 */
export function setPlayedIds(ids) {
  try {
    localStorage.setItem('maintenance-played-ids', JSON.stringify(ids));
  } catch {
    // ignore storage errors (private mode, quota exceeded)
  }
}
