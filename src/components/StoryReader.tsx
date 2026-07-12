import { useMemo, useState } from 'react'
import type { Feedback, GlossMode, SavedWord, Story } from '../lib/types'
import { parseParagraph, storyWordCount } from '../lib/parse'
import { isSaved, setFeedback, toggleWord } from '../lib/storage'
import { GlossWord } from './GlossWord'

interface Props {
  story: Story
  mode: GlossMode
  onModeChange: (mode: GlossMode) => void
  words: SavedWord[]
  onWordsChange: (words: SavedWord[]) => void
  feedback: Feedback | undefined
  onFeedbackChange: (fb: Record<string, Feedback>) => void
  onBack: () => void
}

interface ActiveWord {
  key: string
  word: string
  gloss: string
}

const FEEDBACK_OPTIONS: { value: Feedback; label: string; emoji: string }[] = [
  { value: 'easy', label: 'Легко', emoji: '😌' },
  { value: 'ok', label: 'Норм', emoji: '👍' },
  { value: 'hard', label: 'Сложно', emoji: '😵' },
]

export function StoryReader({
  story,
  mode,
  onModeChange,
  words,
  onWordsChange,
  feedback,
  onFeedbackChange,
  onBack,
}: Props) {
  const [active, setActive] = useState<ActiveWord | null>(null)
  const paragraphs = useMemo(() => story.paragraphs.map(parseParagraph), [story])
  const wordCount = useMemo(() => storyWordCount(story), [story])

  function tapWord(key: string, word: string, gloss: string) {
    setActive((cur) => (cur?.key === key ? null : { key, word, gloss }))
  }

  function toggleSaveActive() {
    if (!active) return
    onWordsChange(toggleWord(active.word, active.gloss, story.id))
  }

  return (
    <article className="reader">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Истории
        </button>
        <button
          type="button"
          className="mode-toggle"
          onClick={() => onModeChange(mode === 'always' ? 'tap' : 'always')}
          title="Показывать переводы всегда или только по тапу"
        >
          {mode === 'always' ? 'Переводы: видны' : 'Переводы: по тапу'}
        </button>
      </header>

      <h1>{story.title}</h1>
      <p className="subtitle">
        {story.titleRu} · {story.level} · {wordCount} слов
      </p>

      <div className="text" onClick={(e) => e.target === e.currentTarget && setActive(null)}>
        {paragraphs.map((tokens, pi) => (
          <p key={pi}>
            {tokens.map((t, ti) => {
              if (t.type === 'text') return <span key={ti}>{t.text}</span>
              const key = `${pi}:${ti}`
              return (
                <GlossWord
                  key={ti}
                  word={t.word}
                  gloss={t.gloss}
                  showGloss={mode === 'always' || active?.key === key}
                  saved={isSaved(words, t.word)}
                  active={active?.key === key}
                  onTap={() => tapWord(key, t.word, t.gloss)}
                />
              )
            })}
          </p>
        ))}
      </div>

      <footer className="feedback">
        <p className="feedback-title">
          {feedback ? 'Твоя оценка — она учтётся при генерации новых историй:' : 'Как тебе история?'}
        </p>
        <div className="feedback-buttons">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`feedback-btn${feedback === opt.value ? ' chosen' : ''}`}
              onClick={() => onFeedbackChange(setFeedback(story.id, opt.value))}
            >
              <span className="feedback-emoji">{opt.emoji}</span> {opt.label}
            </button>
          ))}
        </div>
      </footer>

      {active && (
        <div className="word-card" role="dialog">
          <div className="word-card-text">
            <strong>{active.word}</strong>
            <span>{active.gloss}</span>
          </div>
          <button type="button" className="word-card-save" onClick={toggleSaveActive}>
            {isSaved(words, active.word) ? '✓ В моих словах' : '+ В мои слова'}
          </button>
          <button type="button" className="word-card-close" onClick={() => setActive(null)} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
    </article>
  )
}
