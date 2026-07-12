import type { Grade, SavedWord } from './types'

const DAY = 24 * 60 * 60 * 1000
const AGAIN_DELAY = 10 * 60 * 1000

/** A word with an interval this long (days) counts as learned. */
export const LEARNED_INTERVAL = 21

export function isDue(w: SavedWord, now = Date.now()): boolean {
  return w.due <= now
}

export function isLearned(w: SavedWord): boolean {
  return w.interval >= LEARNED_INTERVAL
}

/** Lowercased set of learned words, for hiding glosses in stories. */
export function learnedSet(words: SavedWord[]): Set<string> {
  return new Set(words.filter(isLearned).map((w) => w.word.toLowerCase()))
}

export function dueWords(words: SavedWord[], now = Date.now()): SavedWord[] {
  return words.filter((w) => isDue(w, now)).sort((a, b) => a.due - b.due)
}

/** Apply a review grade: forgot → start over soon, remembered → longer interval. */
export function applyGrade(w: SavedWord, grade: Grade, now = Date.now()): SavedWord {
  if (grade === 'again') {
    return { ...w, reps: 0, interval: 0, due: now + AGAIN_DELAY }
  }
  const interval =
    grade === 'easy'
      ? Math.max(4, Math.round(w.interval * 3.5))
      : w.interval < 1
        ? 1
        : Math.round(w.interval * 2.5)
  return { ...w, reps: w.reps + 1, interval, due: now + interval * DAY }
}

/** Human label for when the word comes back. */
export function dueLabel(w: SavedWord, now = Date.now()): string {
  if (isLearned(w)) return 'выучено'
  if (w.due <= now) return 'пора повторить'
  const days = Math.ceil((w.due - now) / DAY)
  if (days <= 1) return 'повтор завтра'
  return `повтор через ${days} дн.`
}
