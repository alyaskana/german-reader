export interface Story {
  id: string
  title: string
  titleRu: string
  level: string
  paragraphs: string[]
  /** contextual translations for every word of the text (lowercased keys) */
  dict?: Record<string, string>
  /** cover illustration: inline SVG markup, rendered via <img> data URI */
  cover?: string
  /** id of the collection this story belongs to (see lib/collections) */
  collection?: string
  /** sort order within its collection (ascending) */
  order?: number
  /** true for stories added by the user via "Добавить историю" */
  custom?: boolean
}

export interface Collection {
  id: string
  title: string
  titleRu: string
  subtitle: string
  emoji: string
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

/**
 * A piece of a paragraph: plain text or a glossed word/phrase.
 * Parts of a split unit (separable verb, Perfekt) share a group id;
 * `unit` is the display form of the whole unit, e.g. "steht … auf".
 */
export type Token =
  | { type: 'text'; text: string }
  | {
      type: 'gloss'
      word: string
      gloss: string
      group: number
      continuation: boolean
      unit: string
    }
