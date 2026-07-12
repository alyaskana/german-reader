export interface Story {
  id: string
  title: string
  titleRu: string
  level: string
  paragraphs: string[]
}

export type Feedback = 'easy' | 'ok' | 'hard'

export interface SavedWord {
  word: string
  gloss: string
  storyId: string
  addedAt: number
}

export type GlossMode = 'always' | 'tap'

/** A piece of a paragraph: plain text or a glossed word. */
export type Token = { type: 'text'; text: string } | { type: 'gloss'; word: string; gloss: string }
