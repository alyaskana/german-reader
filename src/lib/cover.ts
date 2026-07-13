/**
 * Story covers are inline SVG strings that come either from bundled story
 * JSON or from JSON the user pastes on "Добавить историю". Before rendering
 * with dangerouslySetInnerHTML the markup is validated: only plain drawing
 * elements, no scripts, no event handlers, no external references.
 */

const BANNED_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'use',
  'image',
  'a',
  'animate',
  'animatemotion',
  'animatetransform',
  'set',
])

const MAX_COVER_LENGTH = 20000

export function sanitizeCover(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const svg = raw.trim()
  if (svg.length > MAX_COVER_LENGTH || !/^<svg[\s>]/i.test(svg)) return undefined

  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return undefined
  const root = doc.documentElement
  if (root.tagName.toLowerCase() !== 'svg') return undefined

  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    if (BANNED_TAGS.has(el.tagName.toLowerCase())) return undefined
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) return undefined
      if (name === 'href' || name === 'xlink:href') return undefined
      if (/url\s*\(|javascript:/i.test(attr.value)) return undefined
    }
  }
  return svg
}

/** Deterministic pastel background for stories without a cover. */
const FALLBACK_COLORS = [
  { bg: '#f3e2d6', shape: '#d9534f' },
  { bg: '#e9ecdd', shape: '#a8b894' },
  { bg: '#e3e9ec', shape: '#7d95a8' },
  { bg: '#f6ecd8', shape: '#e8c07d' },
]

export function fallbackCoverColors(id: string): { bg: string; shape: string } {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}
