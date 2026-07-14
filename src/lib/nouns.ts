import type { Story } from './types'

// story.nouns value = словарная форма «ед.ч. · мн.ч.», единообразно:
//   "die Decke · die Decken", "das Kind · die Kinder"
//   несчётные / pluralia tantum — одна форма: "das Wasser", "die Eltern"
// Ключи — все формы слова, что встречаются в тексте (ед. и мн.), в нижнем регистре.
function lookup(story: Story, word: string): string | null {
  const v = story.nouns?.[word.toLowerCase()]
  if (!v || !/^[A-ZÄÖÜ]/.test(word) || word.includes(' ')) return null
  return v
}

const BARE = new Set(['der', 'die', 'das'])

/** Что показывает попап на тапе (полная словарная форма). */
export function nounDisplay(story: Story, word: string): string {
  const v = lookup(story, word)
  if (!v) return word
  if (BARE.has(v)) return `${v} ${word}` // подстраховка: только артикль
  return v
}

/** Форма для словаря и озвучки — единственное число (первая часть до « · »). */
export function nounStudyForm(story: Story, word: string): string {
  const v = lookup(story, word)
  if (!v) return word
  if (BARE.has(v)) return `${v} ${word}`
  return v.split(' · ')[0].trim()
}
