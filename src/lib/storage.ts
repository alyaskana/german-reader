import type { Feedback, GlossMode, SavedWord } from './types'

const KEYS = {
  words: 'gr.words',
  feedback: 'gr.feedback',
  mode: 'gr.mode',
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

export function getWords(): SavedWord[] {
  return read<SavedWord[]>(KEYS.words, [])
}

export function toggleWord(word: string, gloss: string, storyId: string): SavedWord[] {
  const words = getWords()
  const i = words.findIndex((w) => w.word.toLowerCase() === word.toLowerCase())
  if (i >= 0) words.splice(i, 1)
  else words.push({ word, gloss, storyId, addedAt: Date.now() })
  write(KEYS.words, words)
  return words
}

export function removeWord(word: string): SavedWord[] {
  const words = getWords().filter((w) => w.word.toLowerCase() !== word.toLowerCase())
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
