export interface Story {
  id: string
  title: string
  titleRu: string
  level: string
  paragraphs: string[]
  /** true for stories added by the user via "Добавить историю" */
  custom?: boolean
}

export type Feedback = 'easy' | 'ok' | 'hard'

export interface SavedWord {
  word: string
  gloss: string
  storyId: string
  addedAt: number
  /** marked "уже знаю" in the trainer: rendered without gloss in stories */
  learned: boolean
}

export type GlossMode = 'always' | 'tap'

/** A piece of a paragraph: plain text or a glossed word. */
export type Token = { type: 'text'; text: string } | { type: 'gloss'; word: string; gloss: string }
