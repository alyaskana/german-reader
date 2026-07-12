import type { Story, Token } from './types'

const MARKER = /\{\{([^|{}]+)\|([^|{}]+)\}\}/g

/** Split a paragraph with {{Wort|перевод}} markers into tokens. */
export function parseParagraph(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const m of text.matchAll(MARKER)) {
    if (m.index! > last) tokens.push({ type: 'text', text: text.slice(last, m.index) })
    tokens.push({ type: 'gloss', word: m[1].trim(), gloss: m[2].trim() })
    last = m.index! + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) })
  return tokens
}

/** All glossed words of a story, deduplicated by word. */
export function storyGlosses(story: Story): { word: string; gloss: string }[] {
  const seen = new Map<string, { word: string; gloss: string }>()
  for (const p of story.paragraphs) {
    for (const t of parseParagraph(p)) {
      if (t.type === 'gloss' && !seen.has(t.word.toLowerCase()))
        seen.set(t.word.toLowerCase(), { word: t.word, gloss: t.gloss })
    }
  }
  return [...seen.values()]
}

/** Word count of the plain text (without markers). */
export function storyWordCount(story: Story): number {
  return story.paragraphs
    .join(' ')
    .replace(MARKER, '$1')
    .split(/\s+/)
    .filter(Boolean).length
}
