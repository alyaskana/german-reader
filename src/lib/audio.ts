// Аудио историй — статические mp3, сгенерированные scripts/tts.mjs.
// manifest.json: { "<story-id>": <число озвученных абзацев> }.

const BASE = import.meta.env.BASE_URL

let manifestPromise: Promise<Record<string, number>> | null = null

/** Грузит манифест озвучек один раз и кэширует. Нет файла → пустой объект. */
export function loadAudioManifest(): Promise<Record<string, number>> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}audio/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, number>>) : {}))
      .catch(() => ({}))
  }
  return manifestPromise
}

/** URL mp3 конкретного абзаца истории. */
export function paragraphAudioUrl(storyId: string, index: number): string {
  return `${BASE}audio/${storyId}/p${index}.mp3`
}

// ── озвучка отдельных слов ──────────────────────────────────────────────────

let wordsPromise: Promise<Set<string>> | null = null

/** Множество slug'ов озвученных слов (public/audio/words/manifest.json). */
export function loadWordsManifest(): Promise<Set<string>> {
  if (!wordsPromise) {
    wordsPromise = fetch(`${BASE}audio/words/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
      .then((a) => new Set(a))
      .catch(() => new Set<string>())
  }
  return wordsPromise
}

/** Slug слова/фразы для имени файла — общий с генератором scripts/tts.mjs. */
export function wordSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function wordAudioUrl(slug: string): string {
  return `${BASE}audio/words/${slug}.mp3`
}
