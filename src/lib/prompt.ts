import { stories as builtinStories } from '../stories'
import { storyGlosses } from './parse'
import { getCustomStories, getFeedback, getWords } from './storage'
import type { Feedback } from './types'

const FEEDBACK_RU: Record<Feedback, string> = {
  easy: 'легко',
  ok: 'нормально',
  hard: 'сложно',
}

function calibration(values: Feedback[]): string {
  if (values.length === 0) return 'Оценок пока нет — держи стандартный уровень A1.'
  const recent = values.slice(-3)
  const hard = recent.filter((v) => v === 'hard').length
  const easy = recent.filter((v) => v === 'easy').length
  if (hard >= 2)
    return 'Последние истории были СЛОЖНЫМИ. Сделай текст заметно проще: короткие предложения (5–8 слов), только Präsens, самая базовая лексика, больше глосс (12–15).'
  if (hard >= 1)
    return 'Была сложная история. Держи уровень чуть проще стандартного A1: простые короткие предложения, только Präsens.'
  if (easy === recent.length)
    return 'Все последние истории были ЛЁГКИМИ. Сделай текст чуть сложнее: предложения длиннее, можно немного Perfekt и модальные глаголы, меньше глосс (6–8).'
  return 'Уровень подобран хорошо — держи такой же.'
}

export function buildPrompt(): string {
  const feedback = getFeedback()
  const words = getWords()
  const stories = [...builtinStories, ...getCustomStories()]

  const readStories = stories.filter((s) => feedback[s.id])
  const feedbackLines = readStories.map(
    (s) => `- «${s.title}» — ${FEEDBACK_RU[feedback[s.id]]}`,
  )

  const learnedWords = words.filter((w) => w.learned).map((w) => w.word)
  const learningWords = words.filter((w) => !w.learned).map((w) => `${w.word} (${w.gloss})`)

  const knownGlosses = new Set<string>()
  for (const s of readStories) {
    for (const g of storyGlosses(s)) {
      if (!words.some((w) => w.word.toLowerCase() === g.word.toLowerCase()))
        knownGlosses.add(g.word)
    }
  }

  const existingTitles = stories.map((s) => `«${s.title}»`).join(', ')

  return `Ты помогаешь мне учить немецкий (уровень A1, родной язык — русский). Напиши новую короткую историю для чтения.

Требования к истории:
- Уровень A1: простая лексика, простые предложения, в основном Präsens.
- Длина: 120–180 слов, 4–6 абзацев.
- Живой сюжет из повседневной жизни, с маленьким поворотом или юмором в конце.
- Не повторяй темы уже существующих историй: ${existingTitles}.
- Выдели 8–12 сложных для A1 слов или ВЫРАЖЕНИЙ маркером {{Wort|перевод}} — перевод на русский, коротко, в той же грамматической форме. Глоссируй осмысленные единицы целиком, как в книгах для изучающих: {{läuft dunkelrot an|багровеет}}, {{zu Hause vergessen|забыл дома}}. Каждую единицу глоссируй только при первом появлении.
- Если единица разорвана в предложении (отделяемая приставка, Perfekt), пометь позднюю часть маркером {{+...}}: «Er {{steht|встаёт (aufstehen)}} früh {{+auf}}.» — перевод пиши только у первой части и указывай в нём инфинитив.
- Добавь поле "dict": объект «слово → перевод» для ВСЕХ остальных слов текста (ключи в нижнем регистре, без имён собственных). Переводи по роли слова в этом тексте: «die Bank» в парке — «скамейка». Части составных форм объясняй с отсылкой к целому: для «hat … gekauft» → "hat": "вспомогательный глагол (hat gekauft = купила)", "gekauft": "купила (Perfekt от kaufen)".
- Добавь поле "cover": обложка-иллюстрация к сюжету — простой плоский SVG одной строкой, viewBox="0 0 640 360", крупные геометрические формы, 4–6 цветов из тёплой палитры (#faf7f2 фон, #d9534f акцент, #2c2825, приглушённые зелёный/голубой/жёлтый), без текста и без <script>. В атрибутах SVG используй одинарные кавычки.

Калибровка сложности по моим оценкам прочитанного:
${calibration(readStories.map((s) => feedback[s.id]))}
${feedbackLines.length ? `\nМои оценки историй:\n${feedbackLines.join('\n')}` : ''}
${
  learningWords.length
    ? `\nЭти слова я сейчас учу — постарайся естественно использовать 2–4 из них в тексте и глоссируй их:\n${learningWords.join(', ')}`
    : ''
}
${
  learnedWords.length
    ? `\nЭти слова я уже знаю твёрдо — смело используй их без глосс, они закрепляют выученное:\n${learnedWords.join(', ')}`
    : ''
}
${
  knownGlosses.size
    ? `\nЭти слова мне уже встречались и не показались сложными — можешь использовать их БЕЗ глосс:\n${[...knownGlosses].join(', ')}`
    : ''
}

Ответь ТОЛЬКО валидным JSON в этом формате (без markdown-обёртки):
{
  "id": "kebab-case-id",
  "title": "Заголовок на немецком",
  "titleRu": "Перевод заголовка",
  "level": "A1",
  "paragraphs": ["Абзац 1 с {{маркерами|глоссами}}...", "Абзац 2..."],
  "dict": {"слово": "перевод в контексте", "...": "..."},
  "cover": "<svg viewBox='0 0 640 360' xmlns='http://www.w3.org/2000/svg'>...</svg>"
}

Полученный JSON я вставлю в приложение на экране «Добавить историю».`
}
