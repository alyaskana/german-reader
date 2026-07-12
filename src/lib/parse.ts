import type { Story, Token } from './types'

// {{Wort oder Phrase|перевод}} opens a gloss unit; {{+Teil}} attaches a later
// part of the same unit (separable verb, Perfekt participle) to the most
// recently opened gloss in the paragraph.
const MARKER = /\{\{(\+)?([^|{}]+?)(?:\|([^|{}]+))?\}\}/g

/** Split a paragraph with gloss markers into tokens. */
export function parseParagraph(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  let group = -1
  for (const m of text.matchAll(MARKER)) {
    if (m.index! > last) tokens.push({ type: 'text', text: text.slice(last, m.index) })
    const isContinuation = m[1] === '+' && group >= 0
    if (isContinuation) {
      const head = tokens.find(
        (t): t is Extract<Token, { type: 'gloss' }> => t.type === 'gloss' && t.group === group,
      )!
      tokens.push({
        type: 'gloss',
        word: m[2].trim(),
        gloss: head.gloss,
        group,
        continuation: true,
        unit: '',
      })
    } else {
      group += 1
      tokens.push({
        type: 'gloss',
        word: m[2].trim(),
        gloss: (m[3] ?? '').trim(),
        group,
        continuation: false,
        unit: '',
      })
    }
    last = m.index! + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) })

  // display form of each unit: parts joined with " … "
  const parts = new Map<number, string[]>()
  for (const t of tokens) {
    if (t.type === 'gloss') {
      const list = parts.get(t.group) ?? []
      list.push(t.word)
      parts.set(t.group, list)
    }
  }
  for (const t of tokens) {
    if (t.type === 'gloss') t.unit = parts.get(t.group)!.join(' … ')
  }
  return tokens
}

/** All glossed units of a story, deduplicated by unit. */
export function storyGlosses(story: Story): { word: string; gloss: string }[] {
  const seen = new Map<string, { word: string; gloss: string }>()
  for (const p of story.paragraphs) {
    for (const t of parseParagraph(p)) {
      if (t.type === 'gloss' && !t.continuation && !seen.has(t.unit.toLowerCase()))
        seen.set(t.unit.toLowerCase(), { word: t.unit, gloss: t.gloss })
    }
  }
  return [...seen.values()]
}

/** Word count of the plain text (without markers). */
export function storyWordCount(story: Story): number {
  return story.paragraphs
    .join(' ')
    .replace(MARKER, '$2')
    .split(/\s+/)
    .filter(Boolean).length
}

// Latin letters incl. umlauts/accents, digits inside words (U3);
// hyphenated compounds (U-Bahn) stay one word.
const WORD = /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9]*(?:-[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9]*)*/

/** Split plain text into word and non-word segments for tap-to-translate. */
export function splitWords(text: string): { text: string; isWord: boolean }[] {
  return text
    .split(new RegExp(`(${WORD.source})`, 'g'))
    .filter(Boolean)
    .map((seg) => ({ text: seg, isWord: WORD.test(seg[0]) && !seg.startsWith('-') }))
}
