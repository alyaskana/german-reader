import type { Feedback, SavedWord, Story } from './types'
import {
  getActivity,
  getCustomStories,
  getFeedback,
  getWords,
  replaceActivity,
  replaceCustomStories,
  replaceFeedback,
  replaceWords,
} from './storage'

/**
 * Cross-device sync through a secret GitHub Gist: the user pastes a personal
 * access token (classic, `gist` scope) once per device, and the app keeps a
 * single gist file with words, feedback and custom stories. Sync = pull,
 * merge (union; newer word entry wins, local wins other conflicts), push.
 * The Anthropic API key is deliberately NOT synced: secret gists are readable
 * by anyone who has their URL.
 */

const TOKEN_KEY = 'gr.gistToken'
const GIST_ID_KEY = 'gr.gistId'
const LAST_SYNC_KEY = 'gr.lastSync'
const FILE = 'lesezeit.json'
const API = 'https://api.github.com'
const DESCRIPTION = 'Lesezeit — синхронизация прогресса (слова, оценки, свои истории)'

export interface SyncData {
  words: SavedWord[]
  feedback: Record<string, Feedback>
  customStories: Story[]
  /** reading-streak days (YYYY-MM-DD), unioned across devices */
  activity: string[]
}

export type SyncResult = { data: SyncData; gistUrl: string } | { error: string }

export function getSyncToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setSyncToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token.trim())
}

export function disableSync() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(GIST_ID_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
}

export function getLastSync(): number | null {
  const raw = localStorage.getItem(LAST_SYNC_KEY)
  return raw ? Number(raw) : null
}

export function getGistUrl(): string {
  const id = localStorage.getItem(GIST_ID_KEY)
  return id ? `https://gist.github.com/${id}` : ''
}

function snapshot(): SyncData {
  return {
    words: getWords(),
    feedback: getFeedback(),
    customStories: getCustomStories(),
    activity: getActivity(),
  }
}

function applyToStorage(data: SyncData) {
  replaceWords(data.words)
  replaceFeedback(data.feedback)
  replaceCustomStories(data.customStories)
  replaceActivity(data.activity)
}

/** Union merge: no deletions propagate, which keeps the logic simple and safe. */
export function mergeData(local: SyncData, remote: SyncData): SyncData {
  const words = new Map<string, SavedWord>()
  for (const w of remote.words) words.set(w.word.toLowerCase(), w)
  for (const w of local.words) {
    const key = w.word.toLowerCase()
    const other = words.get(key)
    if (!other) {
      words.set(key, w)
      continue
    }
    // same word on both sides: the more recently changed entry wins
    const winner = (w.updatedAt ?? w.addedAt) >= (other.updatedAt ?? other.addedAt) ? w : other
    words.set(key, winner)
  }

  const stories = new Map<string, Story>()
  for (const s of remote.customStories) stories.set(s.id, s)
  for (const s of local.customStories) stories.set(s.id, s)

  return {
    words: [...words.values()].sort((a, b) => a.addedAt - b.addedAt),
    feedback: { ...remote.feedback, ...local.feedback },
    customStories: [...stories.values()],
    activity: [...new Set([...(remote.activity ?? []), ...(local.activity ?? [])])].sort(),
  }
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

interface GistInfo {
  id: string
  html_url: string
  files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>
}

async function findGist(token: string): Promise<GistInfo | null> {
  const res = await fetch(`${API}/gists?per_page=100`, { headers: headers(token) })
  if (!res.ok) throw new Error(`gists list: ${res.status}`)
  const gists = (await res.json()) as GistInfo[]
  return gists.find((g) => g.files && FILE in g.files) ?? null
}

async function createGist(token: string, data: SyncData): Promise<GistInfo> {
  const res = await fetch(`${API}/gists`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: DESCRIPTION,
      public: false,
      files: { [FILE]: { content: JSON.stringify(data, null, 2) } },
    }),
  })
  if (!res.ok) throw new Error(`gist create: ${res.status}`)
  return (await res.json()) as GistInfo
}

async function readGist(token: string, id: string): Promise<{ gist: GistInfo; data: SyncData | null } | 'gone'> {
  const res = await fetch(`${API}/gists/${id}`, { headers: headers(token) })
  if (res.status === 404) return 'gone'
  if (!res.ok) throw new Error(`gist read: ${res.status}`)
  const gist = (await res.json()) as GistInfo
  const file = gist.files[FILE]
  if (!file) return { gist, data: null }
  let content = file.content ?? ''
  if (file.truncated && file.raw_url) content = await (await fetch(file.raw_url)).text()
  try {
    const parsed = JSON.parse(content) as Partial<SyncData>
    return {
      gist,
      data: {
        words: Array.isArray(parsed.words) ? parsed.words : [],
        feedback: parsed.feedback && typeof parsed.feedback === 'object' ? parsed.feedback : {},
        customStories: Array.isArray(parsed.customStories) ? parsed.customStories : [],
        activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      },
    }
  } catch {
    return { gist, data: null }
  }
}

async function writeGist(token: string, id: string, data: SyncData): Promise<void> {
  const res = await fetch(`${API}/gists/${id}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(data, null, 2) } } }),
  })
  if (!res.ok) throw new Error(`gist write: ${res.status}`)
}

/* Manual transfer for people without a GitHub account: copy a JSON blob on
   one device, paste it on another; the pasted data merges the same way a
   gist pull does. */

export function exportData(): string {
  return JSON.stringify(snapshot())
}

export function importData(raw: string): { data: SyncData } | { error: string } {
  let parsed: Partial<SyncData>
  try {
    parsed = JSON.parse(raw.trim()) as Partial<SyncData>
  } catch {
    return { error: 'Не получилось разобрать данные. Вставь скопированный текст целиком.' }
  }
  if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.words))
    return { error: 'Это не похоже на данные Lesezeit.' }
  const merged = mergeData(snapshot(), {
    words: parsed.words,
    feedback: parsed.feedback && typeof parsed.feedback === 'object' ? parsed.feedback : {},
    customStories: Array.isArray(parsed.customStories) ? parsed.customStories : [],
    activity: Array.isArray(parsed.activity) ? parsed.activity : [],
  })
  applyToStorage(merged)
  return { data: merged }
}

let inFlight: Promise<SyncResult> | null = null

/** Pull remote state, merge with local, save locally and push back. */
export function syncNow(): Promise<SyncResult> {
  if (inFlight) return inFlight
  inFlight = doSync().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doSync(): Promise<SyncResult> {
  const token = getSyncToken()
  if (!token) return { error: 'Синхронизация не настроена.' }

  try {
    let id = localStorage.getItem(GIST_ID_KEY)
    if (id) {
      const found = await readGist(token, id)
      if (found === 'gone') {
        localStorage.removeItem(GIST_ID_KEY)
        id = null
      } else {
        const merged = found.data ? mergeData(snapshot(), found.data) : snapshot()
        applyToStorage(merged)
        await writeGist(token, id, merged)
        localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
        return { data: merged, gistUrl: found.gist.html_url }
      }
    }

    const existing = await findGist(token)
    const gist = existing ?? (await createGist(token, snapshot()))
    localStorage.setItem(GIST_ID_KEY, gist.id)
    if (existing) return doSync()
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
    return { data: snapshot(), gistUrl: gist.html_url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('401')) return { error: 'Токен не подошёл. Проверь его и сохрани заново.' }
    if (msg.includes('403')) return { error: 'GitHub отклонил запрос (нет права gist или лимит). Проверь, что у токена есть галочка «gist».' }
    return { error: 'Не получилось синхронизироваться. Проверь интернет и попробуй ещё раз.' }
  }
}
