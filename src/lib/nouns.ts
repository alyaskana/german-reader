import type { Story } from './types'

/**
 * Display form of a tapped word: prefix a noun with its definite article
 * ("Decke" → "die Decke") when the story knows its gender. Used both for the
 * popover label and for what gets saved to the dictionary.
 */
export function articleForm(story: Story, word: string): string {
  const article = story.nouns?.[word.toLowerCase()]
  // only real, single-word nouns (capitalized, no "…" split units)
  if (article && /^[A-ZÄÖÜ]/.test(word) && !word.includes(' ')) {
    return `${article} ${word}`
  }
  return word
}
