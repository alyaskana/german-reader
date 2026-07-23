import type { Feedback, GlossMode, SavedWord, Story } from './types'

const KEYS = {
  words: 'gr.words',
  feedback: 'gr.feedback',
  mode: 'gr.mode',
  customStories: 'gr.customStories',
  activity: 'gr.activity',
  lastStory: 'gr.lastStory',
} as const

/** Local calendar day as YYYY-MM-DD (used for the reading streak). */
export function localDay(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Also migrates words saved by the earlier SRS version (interval >= 21 meant learned). */
function normalize(w: Partial<SavedWord> & { interval?: number }): SavedWord {
  return {
    word: w.word ?? '',
    gloss: w.gloss ?? '',
    storyId: w.storyId ?? '',
    addedAt: w.addedAt ?? Date.now(),
    learned: w.learned ?? (w.interval ?? 0) >= 21,
  }
}

export function getWords(): SavedWord[] {
  return read<SavedWord[]>(KEYS.words, []).map(normalize)
}

export function toggleWord(word: string, gloss: string, storyId: string): SavedWord[] {
  const words = getWords()
  const i = words.findIndex((w) => w.word.toLowerCase() === word.toLowerCase())
  if (i >= 0) words.splice(i, 1)
  else words.push({ word, gloss, storyId, addedAt: Date.now(), learned: false })
  write(KEYS.words, words)
  return words
}

export function removeWord(word: string): SavedWord[] {
  const words = getWords().filter((w) => w.word.toLowerCase() !== word.toLowerCase())
  write(KEYS.words, words)
  return words
}

/** Edit only the translation of a saved word (the word itself is the match key). */
export function editGloss(word: string, gloss: string): SavedWord[] {
  const words = getWords().map((w) =>
    w.word.toLowerCase() === word.toLowerCase() ? { ...w, gloss, updatedAt: Date.now() } : w,
  )
  write(KEYS.words, words)
  return words
}

export function setLearned(word: string, learned: boolean): SavedWord[] {
  const words = getWords().map((w) =>
    w.word.toLowerCase() === word.toLowerCase() ? { ...w, learned, updatedAt: Date.now() } : w,
  )
  write(KEYS.words, words)
  return words
}

/** Lowercased set of learned words, for hiding glosses in stories. */
export function learnedSet(words: SavedWord[]): Set<string> {
  return new Set(words.filter((w) => w.learned).map((w) => w.word.toLowerCase()))
}

export function isSaved(words: SavedWord[], word: string): boolean {
  return words.some((w) => w.word.toLowerCase() === word.toLowerCase())
}

/** feedback doubles as "story was read" */
export function getFeedback(): Record<string, Feedback> {
  return read<Record<string, Feedback>>(KEYS.feedback, {})
}

export function setFeedback(storyId: string, value: Feedback): Record<string, Feedback> {
  const fb = getFeedback()
  fb[storyId] = value
  write(KEYS.feedback, fb)
  return fb
}

export function getMode(): GlossMode {
  return read<GlossMode>(KEYS.mode, 'tap')
}

export function setMode(mode: GlossMode) {
  write(KEYS.mode, mode)
}

export function getCustomStories(): Story[] {
  return read<Story[]>(KEYS.customStories, []).map((s) => ({ ...s, custom: true }))
}

export function addCustomStory(story: Story): Story[] {
  const list = getCustomStories()
  const next = [...list.filter((s) => s.id !== story.id), { ...story, custom: true }]
  write(KEYS.customStories, next)
  return next
}

/* Bulk setters used by cross-device sync (lib/sync.ts). */

export function replaceWords(words: SavedWord[]): SavedWord[] {
  write(KEYS.words, words)
  return words
}

export function replaceFeedback(fb: Record<string, Feedback>): Record<string, Feedback> {
  write(KEYS.feedback, fb)
  return fb
}

export function replaceCustomStories(list: Story[]): Story[] {
  const next = list.map((s) => ({ ...s, custom: true }))
  write(KEYS.customStories, next)
  return next
}

/* Reading streak: unique local days on which a story was opened. */

export function getActivity(): string[] {
  return read<string[]>(KEYS.activity, [])
}

export function recordActivity(): string[] {
  const today = localDay()
  const list = getActivity()
  if (!list.includes(today)) {
    list.push(today)
    write(KEYS.activity, list)
  }
  return list
}

export function replaceActivity(list: string[]): string[] {
  write(KEYS.activity, list)
  return list
}

/* Last opened story, to resume "continue reading" from its collection. */

export function getLastStoryId(): string {
  try {
    return localStorage.getItem(KEYS.lastStory) ?? ''
  } catch {
    return ''
  }
}

export function setLastStoryId(id: string) {
  try {
    localStorage.setItem(KEYS.lastStory, id)
  } catch {
    /* ignore */
  }
}

export function removeCustomStory(id: string): Story[] {
  const next = getCustomStories().filter((s) => s.id !== id)
  write(KEYS.customStories, next)
  return next
}
