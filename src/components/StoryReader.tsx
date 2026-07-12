import { useMemo, useState } from 'react'
import type { Feedback, GlossMode, SavedWord, Story } from '../lib/types'
import { parseParagraph, storyWordCount } from '../lib/parse'
import { isSaved, learnedSet, setFeedback, toggleWord } from '../lib/storage'
import { GlossWord } from './GlossWord'
import { WordPopover } from './WordPopover'

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
  anchor: HTMLElement
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
  const learned = useMemo(() => learnedSet(words), [words])

  function tapWord(key: string, word: string, gloss: string, anchor: HTMLElement) {
    setActive((cur) => (cur?.key === key ? null : { key, word, gloss, anchor }))
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
          title="Показывать переводы рядом со словами или только по тапу"
        >
          {mode === 'always' ? 'Переводы: видны' : 'Переводы: по тапу'}
        </button>
      </header>

      <h1>{story.title}</h1>
      <p className="subtitle">
        {story.titleRu} · {story.level} · {wordCount} слов
      </p>

      <div className="text">
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
                  showInline={mode === 'always'}
                  saved={isSaved(words, t.word)}
                  learned={learned.has(t.word.toLowerCase())}
                  active={active?.key === key}
                  onTap={(anchor) => tapWord(key, t.word, t.gloss, anchor)}
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
        <WordPopover
          word={active.word}
          gloss={active.gloss}
          anchor={active.anchor}
          saved={isSaved(words, active.word)}
          onToggleSave={() => onWordsChange(toggleWord(active.word, active.gloss, story.id))}
          onClose={() => setActive(null)}
        />
      )}
    </article>
  )
}
