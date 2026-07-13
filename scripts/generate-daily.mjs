// Generates one "Geschichte des Tages" per run and writes it to src/stories/.
// Runs in GitHub Actions on a daily cron (see .github/workflows/daily-story.yml).
// The story is built around a German word or idiom of the day, biased by the
// season/holiday so the feed feels timely. No personalization — the daily story
// is shared by everyone (the reader's own words/feedback live in the browser).
//
// Usage: ANTHROPIC_API_KEY=... node scripts/generate-daily.mjs

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const STORIES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'stories')

function localDay(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** A light seasonal/holiday hint for the given date (German calendar). */
function calendarHint(date = new Date()) {
  const m = date.getMonth() + 1
  const d = date.getDate()
  if (m === 12 && d <= 24) return 'Adventszeit und Weihnachtsmarkt'
  if (m === 12) return 'zwischen den Jahren, kurz vor Silvester'
  if (m === 1) return 'Neujahr und tiefer Winter'
  if (m === 2) return 'Karneval / Fasching'
  if (m === 3) return 'Frühlingsanfang'
  if (m === 4) return 'Ostern und erste warme Tage'
  if (m === 5) return 'Spargelzeit und Ausflüge'
  if (m === 6) return 'Sommeranfang, lange Abende'
  if (m === 7) return 'Hochsommer, Freibad und Eis'
  if (m === 8) return 'Sommerferien und Urlaub'
  if (m === 9) return 'Spätsommer, Schulanfang'
  if (m === 10) return 'Herbst und Oktoberfest'
  if (m === 11) return 'grauer November, Laternen und Tee'
  return 'Alltag'
}

/** Words/idioms already used by previous daily stories, to avoid repeats. */
function recentTerms() {
  const terms = []
  for (const f of readdirSync(STORIES_DIR)) {
    if (!f.startsWith('daily-') || !f.endsWith('.json')) continue
    try {
      const s = JSON.parse(readFileSync(join(STORIES_DIR, f), 'utf8'))
      if (s.wordOfDay?.term) terms.push(s.wordOfDay.term)
    } catch {
      /* ignore malformed file */
    }
  }
  return terms
}

function buildPrompt(today, hint, avoid) {
  return `Ты помогаешь учить немецкий (уровень A1–A2, родной язык — русский). Составь «историю дня»: короткий рассказ, построенный вокруг одного полезного немецкого СЛОВА или ИДИОМЫ дня.

Сегодня: ${today}. Сезон/контекст: ${hint}. Мягко учти этот контекст в сюжете, но без мрачных тем.

Сначала выбери одно интересное, живое и практичное слово или идиому (идиомы особенно приветствуются). НЕ используй недавно использованные: ${avoid.length ? avoid.join(', ') : '—'}.

Требования к истории:
- Уровень A1–A2: простая лексика, короткие предложения, в основном Präsens.
- Длина: 120–180 слов, 3–5 абзацев, с маленьким тёплым поворотом в конце.
- Слово/идиома дня должно естественно встречаться в тексте (лучше 1–2 раза) и быть глоссировано.
- Выдели 6–10 сложных слов/выражений маркером {{Wort|перевод}} — перевод на русский, коротко, в той же форме. Разорванные единицы (отделяемая приставка, Perfekt): позднюю часть помечай {{+auf}}, перевод только у первой части с инфинитивом.
- Поле "dict": объект «слово → перевод» для ВСЕХ остальных слов текста (ключи в нижнем регистре, без имён собственных), по смыслу в контексте.
- Поле "wordOfDay": { "term": "слово или идиома", "gloss": "короткий перевод на русский" }.
- Поле "cover": обложка одной строкой — плоский inline SVG по сюжету, без текста и людей. viewBox='0 0 200 120', preserveAspectRatio='xMidYMid slice', атрибуты в ОДИНАРНЫХ кавычках, только rect/circle/ellipse/path, без script/image/use/градиентов/внешних ссылок. Палитра: фон #f6efe4, полоса #eaddc6, тёмный #2c2825, серый #8a827a, акцент #d9534f, охра #e8c07d, шалфей #a8b894, тёмный шалфей #7f9573, синий #7d95a8, белый #ffffff, тень #dccbae. Главный объект по центру (x 40–160).

Ответь ТОЛЬКО валидным JSON без markdown-обёртки:
{
  "title": "Заголовок на немецком",
  "titleRu": "Перевод заголовка",
  "level": "A1",
  "wordOfDay": { "term": "...", "gloss": "..." },
  "cover": "<svg ...>...</svg>",
  "paragraphs": ["Абзац 1 с {{маркерами|глоссами}}...", "..."],
  "dict": { "слово": "перевод" }
}`
}

function parseAndValidate(raw) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
  const s = JSON.parse(cleaned)
  if (typeof s.title !== 'string' || !s.title.trim()) throw new Error('no title')
  if (!Array.isArray(s.paragraphs) || !s.paragraphs.every((p) => typeof p === 'string' && p.trim()))
    throw new Error('bad paragraphs')
  if (!s.wordOfDay || typeof s.wordOfDay.term !== 'string') throw new Error('no wordOfDay')
  if (typeof s.cover !== 'string' || !s.cover.trim().startsWith('<svg'))
    throw new Error('bad cover')
  if (/<(script|image|use|foreignObject|iframe)\b/i.test(s.cover) || /\son\w+=|href=/i.test(s.cover))
    throw new Error('unsafe cover')
  if (s.cover.includes('"')) throw new Error('cover uses double quotes')
  return s
}

async function main() {
  const today = localDay()
  const path = join(STORIES_DIR, `daily-${today}.json`)
  if (existsSync(path)) {
    console.log(`daily-${today}.json already exists — nothing to do`)
    return
  }

  const client = new Anthropic() // reads ANTHROPIC_API_KEY from the environment
  const prompt = buildPrompt(today, calendarHint(), recentTerms())

  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const stream = client.messages.stream({
        model: 'claude-opus-4-8',
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: prompt }],
      })
      const message = await stream.finalMessage()
      if (message.stop_reason === 'refusal') throw new Error('model refused')
      const text = message.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
      const s = parseAndValidate(text)

      const story = {
        id: `daily-${today}`,
        title: s.title.trim(),
        titleRu: typeof s.titleRu === 'string' ? s.titleRu.trim() : '',
        level: typeof s.level === 'string' && s.level.trim() ? s.level.trim() : 'A1',
        collection: 'daily',
        order: Number(today.replace(/-/g, '')),
        wordOfDay: { term: s.wordOfDay.term, gloss: String(s.wordOfDay.gloss ?? '') },
        cover: s.cover.trim(),
        paragraphs: s.paragraphs,
        dict: s.dict && typeof s.dict === 'object' ? s.dict : {},
      }
      writeFileSync(path, JSON.stringify(story, null, 2) + '\n')
      console.log(`wrote daily-${today}.json — «${story.title}» (${story.wordOfDay.term})`)
      return
    } catch (e) {
      lastErr = e
      console.warn(`attempt ${attempt} failed: ${e.message}`)
    }
  }
  console.error(`could not generate today's story: ${lastErr?.message}`)
  process.exit(1)
}

main()
