import type { Story } from './types'
import { sanitizeCover } from './cover'

/** Parse and validate pasted story JSON. Returns an error message (Russian) or the story. */
export function parseStoryJson(raw: string): { story: Story } | { error: string } {
  let data: unknown
  try {
    // tolerate a ```json ... ``` fence around the answer
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
    data = JSON.parse(cleaned)
  } catch {
    return { error: 'Не получилось разобрать JSON. Вставь ответ Claude целиком, без лишнего текста вокруг.' }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data))
    return { error: 'Ожидается JSON-объект истории.' }

  const s = data as Record<string, unknown>
  if (typeof s.title !== 'string' || !s.title.trim()) return { error: 'В JSON нет поля "title".' }
  if (
    !Array.isArray(s.paragraphs) ||
    s.paragraphs.length === 0 ||
    !s.paragraphs.every((p) => typeof p === 'string' && p.trim())
  )
    return { error: 'Поле "paragraphs" должно быть непустым массивом строк.' }

  let dict: Record<string, string> | undefined
  if (s.dict !== undefined) {
    if (
      typeof s.dict !== 'object' ||
      s.dict === null ||
      Array.isArray(s.dict) ||
      !Object.values(s.dict).every((v) => typeof v === 'string')
    )
      return { error: 'Поле "dict" должно быть объектом «слово → перевод».' }
    dict = Object.fromEntries(
      Object.entries(s.dict as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]),
    )
  }

  const id =
    typeof s.id === 'string' && s.id.trim()
      ? s.id.trim()
      : s.title
          .toLowerCase()
          .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] ?? c)
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

  return {
    story: {
      id,
      title: s.title.trim(),
      titleRu: typeof s.titleRu === 'string' ? s.titleRu.trim() : '',
      level: typeof s.level === 'string' && s.level.trim() ? s.level.trim() : 'A1',
      paragraphs: s.paragraphs as string[],
      dict,
      // a broken/unsafe cover shouldn't fail the import — the story just gets the fallback
      cover: sanitizeCover(s.cover),
      custom: true,
    },
  }
}
