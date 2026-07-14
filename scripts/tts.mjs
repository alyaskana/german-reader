#!/usr/bin/env node
// Озвучка историй через OpenAI TTS.
// Запуск (один раз, локально — ключ в приложение НЕ попадает):
//   OPENAI_API_KEY=sk-... node scripts/tts.mjs
//   OPENAI_API_KEY=sk-... TTS_VOICE=nova node scripts/tts.mjs   # другой голос
//   OPENAI_API_KEY=sk-... node scripts/tts.mjs --force          # перегенерить всё
//
// Пишет по одному mp3 на абзац в public/audio/<story-id>/p<N>.mp3
// и public/audio/manifest.json (какие истории озвучены и сколько абзацев).
// Уже готовые файлы пропускаются — можно докидывать новые истории дёшево.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const STORIES_DIR = join(ROOT, 'src', 'stories')
const OUT_DIR = join(ROOT, 'public', 'audio')

// ── настройки озвучки (можно переопределить через env) ──────────────────────
const VOICE = process.env.TTS_VOICE || 'sage' // marin cedar alloy echo fable onyx nova shimmer coral sage ash ballad
const MODEL = process.env.TTS_MODEL || 'gpt-4o-mini-tts' // или 'tts-1' / 'tts-1-hd'
const STYLE =
  process.env.TTS_STYLE ||
  'Lies wie ein warmherziger Märchen-Erzähler, der Kindern vorliest – lebendig, ' +
    'ausdrucksstark und liebevoll, aber deutlich und nicht zu schnell, damit ' +
    'Deutschlerner alles verstehen. Male Gefühle mit der Stimme aus: bei Wörtern ' +
    'und Momenten wie lächeln, sich freuen, staunen, seufzen, erschrecken oder sich ' +
    'entschuldigen wird die Stimme hörbar wärmer, weicher, fröhlicher oder ' +
    'überraschter – ganz nach Gefühl. Bei wörtlicher Rede schlüpfe voll in die Figur. ' +
    'Variiere Tonhöhe, Lautstärke und Tempo, mach kleine spannungsvolle Pausen an ' +
    'Kommas und Punkten. Klinge herzlich und ein bisschen verspielt, wie in einem ' +
    'Kinderhörbuch.'
// ────────────────────────────────────────────────────────────────────────────

const KEY = process.env.OPENAI_API_KEY
if (!KEY) {
  console.error('❌  Не задан OPENAI_API_KEY. Пример: OPENAI_API_KEY=sk-... node scripts/tts.mjs')
  process.exit(1)
}
const FORCE = process.argv.includes('--force')
// позиционные аргументы (не флаги) = фильтр по id истории, напр. `npm run tts -- im-cafe`
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'))

// {{Wort|перевод}} → Wort ; {{+Teil}} → Teil ; {{Wort}} → Wort
const MARKER = /\{\{(\+)?([^|{}]+?)(?:\|([^|{}]+))?\}\}/g
const plain = (s) => s.replace(MARKER, '$2').replace(/\s+/g, ' ').trim()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// стиль для отдельных слов — как учитель, показывающий произношение
const WORD_STYLE =
  process.env.TTS_WORD_STYLE ||
  'Sprich dieses einzelne deutsche Wort oder diese kurze Wendung langsam und deutlich aus, wie ein Lehrer, der die richtige Aussprache vormacht.'

async function tts(text, style = STYLE) {
  const body = { model: MODEL, voice: VOICE, input: text, response_format: 'mp3' }
  // instructions понимает только gpt-4o-*-tts, для tts-1 их не шлём
  if (MODEL.startsWith('gpt-4o')) body.instructions = style

  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    const msg = await res.text()
    // 429 / 5xx — временно, повторяем с backoff; остальное — фатально
    if ((res.status === 429 || res.status >= 500) && attempt <= 4) {
      const wait = 2 ** attempt * 1000
      console.warn(`  ⚠ ${res.status}, повтор через ${wait / 1000}с…`)
      await sleep(wait)
      continue
    }
    throw new Error(`OpenAI ${res.status}: ${msg}`)
  }
}

const files = (await readdir(STORIES_DIR)).filter((f) => f.endsWith('.json')).sort()
// начинаем с существующего манифеста, чтобы частичный прогон не терял озвученные истории
await mkdir(OUT_DIR, { recursive: true })
const MANIFEST = join(OUT_DIR, 'manifest.json')
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
let made = 0
let chars = 0

for (const f of files) {
  const story = JSON.parse(await readFile(join(STORIES_DIR, f), 'utf8'))
  if (ONLY.length && !ONLY.some((id) => story.id === id || story.id.includes(id))) continue
  const paras = (story.paragraphs || []).map(plain).filter(Boolean)
  if (!paras.length) continue
  manifest[story.id] = paras.length
  const dir = join(OUT_DIR, story.id)
  await mkdir(dir, { recursive: true })
  for (let i = 0; i < paras.length; i++) {
    const out = join(dir, `p${i}.mp3`)
    if (existsSync(out) && !FORCE) continue
    const buf = await tts(paras[i])
    await writeFile(out, buf)
    made++
    chars += paras[i].length
    console.log(`✓ ${story.id} · p${i} (${paras[i].length} симв.)`)
  }
}

await writeFile(MANIFEST, JSON.stringify(manifest))

// ── озвучка отдельных слов (для попапа) ─────────────────────────────────────
// slug должен совпадать с wordSlug() в src/lib/audio.ts
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
// форма для озвучки: у существительных — единственное число (до « · »)
const studyForm = (surface, citation) =>
  citation ? citation.split(' · ')[0].trim() : surface

const WORDS_DIR = join(OUT_DIR, 'words')
await mkdir(WORDS_DIR, { recursive: true })
const WORDS_MANIFEST = join(WORDS_DIR, 'manifest.json')
const wordsSet = new Set(existsSync(WORDS_MANIFEST) ? JSON.parse(await readFile(WORDS_MANIFEST, 'utf8')) : [])

// собрать уникальные слова: существительные (словарная форма) + остальной dict
const wordSpoken = new Map() // slug -> произносимый текст
for (const f of files) {
  const story = JSON.parse(await readFile(join(STORIES_DIR, f), 'utf8'))
  if (ONLY.length && !ONLY.some((id) => story.id === id || story.id.includes(id))) continue
  const nouns = story.nouns || {}
  for (const [surface, citation] of Object.entries(nouns)) {
    const spoken = studyForm(surface, citation)
    const slug = slugify(spoken)
    if (slug) wordSpoken.set(slug, spoken)
  }
  for (const w of Object.keys(story.dict || {})) {
    if (nouns[w]) continue // существительное озвучим словарной формой
    const slug = slugify(w)
    if (slug && !wordSpoken.has(slug)) wordSpoken.set(slug, w)
  }
}

let wmade = 0
let wchars = 0
for (const [slug, spoken] of wordSpoken) {
  const out = join(WORDS_DIR, `${slug}.mp3`)
  if (existsSync(out) && !FORCE) {
    wordsSet.add(slug)
    continue
  }
  const buf = await tts(spoken, WORD_STYLE)
  await writeFile(out, buf)
  wordsSet.add(slug)
  wmade++
  wchars += spoken.length
  if (wmade % 25 === 0) console.log(`♪ слов озвучено: ${wmade}…`)
}
await writeFile(WORDS_MANIFEST, JSON.stringify([...wordsSet].sort()))

const totalChars = chars + wchars
console.log(
  `\nГотово. Историй: ${Object.keys(manifest).length}, новых mp3 (абзацы): ${made}. ` +
    `Слов озвучено (новых): ${wmade} из ${wordSpoken.size}.`,
)
if (totalChars) {
  console.log(`Символов синтезировано: ${totalChars}. Грубая оценка: ~$${((totalChars / 1000) * 0.015).toFixed(2)}.`)
}
