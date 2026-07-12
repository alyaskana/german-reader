import type { Feedback, GlossMode, Grade, SavedWord, Story } from './types'
import { applyGrade } from './srs'

const KEYS = {
  words: 'gr.words',
  feedback: 'gr.feedback',
  mode: 'gr.mode',
  customStories: 'gr.customStories',
} as const

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

/** Fill SRS fields for words saved before the trainer existed. */
function normalize(w: Partial<SavedWord> & Pick<SavedWord, 'word' | 'gloss' | 'storyId' | 'addedAt'>): SavedWord {
  return {
    ...w,
    reps: w.reps ?? 0,
    interval: w.interval ?? 0,
    due: w.due ?? w.addedAt ?? Date.now(),
  }
}

export function getWords(): SavedWord[] {
  return read<SavedWord[]>(KEYS.words, []).map(normalize)
}

export function toggleWord(word: string, gloss: string, storyId: string): SavedWord[] {
  const words = getWords()
  const i = words.findIndex((w) => w.word.toLowerCase() === word.toLowerCase())
  if (i >= 0) words.splice(i, 1)
  else {
    const now = Date.now()
    words.push({ word, gloss, storyId, addedAt: now, reps: 0, interval: 0, due: now })
  }
  write(KEYS.words, words)
  return words
}

export function removeWord(word: string): SavedWord[] {
  const words = getWords().filter((w) => w.word.toLowerCase() !== word.toLowerCase())
  write(KEYS.words, words)
  return words
}

export function gradeWord(word: string, grade: Grade): SavedWord[] {
  const words = getWords().map((w) =>
    w.word.toLowerCase() === word.toLowerCase() ? applyGrade(w, grade) : w,
  )
  write(KEYS.words, words)
  return words
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

export function removeCustomStory(id: string): Story[] {
  const next = getCustomStories().filter((s) => s.id !== id)
  write(KEYS.customStories, next)
  return next
}
