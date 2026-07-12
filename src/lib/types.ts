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
  /** SRS: consecutive successful reviews */
  reps: number
  /** SRS: current interval in days (>= LEARNED_INTERVAL means learned) */
  interval: number
  /** SRS: timestamp when the word is due for review */
  due: number
}

export type Grade = 'again' | 'good' | 'easy'

export type GlossMode = 'always' | 'tap'

/** A piece of a paragraph: plain text or a glossed word. */
export type Token = { type: 'text'; text: string } | { type: 'gloss'; word: string; gloss: string }
