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
