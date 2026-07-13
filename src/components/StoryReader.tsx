import { useMemo, useState } from 'react'
import type { Feedback, GlossMode, SavedWord, Story } from '../lib/types'
import { parseParagraph, splitWords, storyWordCount } from '../lib/parse'
import { isSaved, learnedSet, setFeedback, toggleWord } from '../lib/storage'
import { coverSrc } from '../lib/cover'
import { GlossWord } from './GlossWord'
import { ReactionIcon } from './ReactionIcon'
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
  /** paragraph index + gloss group, to highlight both parts of a split unit */
  groupKey: string | null
  word: string
  gloss: string | null
  anchor: HTMLElement
}

const FEEDBACK_OPTIONS: { value: Feedback; label: string }[] = [
  { value: 'easy', label: 'Легко' },
  { value: 'ok', label: 'Норм' },
  { value: 'hard', label: 'Сложно' },
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

  function tapGloss(
    key: string,
    groupKey: string,
    unit: string,
    gloss: string,
    anchor: HTMLElement,
  ) {
    setActive((cur) => (cur?.key === key ? null : { key, groupKey, word: unit, gloss, anchor }))
  }

  function tapPlain(key: string, word: string, anchor: HTMLElement) {
    const gloss = story.dict?.[word.toLowerCase()] ?? null
    setActive((cur) => (cur?.key === key ? null : { key, groupKey: null, word, gloss, anchor }))
  }

  return (
    <article className="reader">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Назад
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

      {story.cover && <img className="reader-cover" src={coverSrc(story.cover)} alt="" />}

      <div className="text">
        {paragraphs.map((tokens, pi) => (
          <p key={pi}>
            {tokens.map((t, ti) => {
              const key = `${pi}:${ti}`
              if (t.type === 'text') {
                return splitWords(t.text).map((seg, si) =>
                  seg.isWord ? (
                    <button
                      key={`${ti}:${si}`}
                      type="button"
                      className={`plain-word${active?.key === `${key}:${si}` ? ' active' : ''}`}
                      onClick={(e) => tapPlain(`${key}:${si}`, seg.text, e.currentTarget)}
                    >
                      {seg.text}
                    </button>
                  ) : (
                    <span key={`${ti}:${si}`}>{seg.text}</span>
                  ),
                )
              }
              const groupKey = `${pi}:g${t.group}`
              return (
                <GlossWord
                  key={ti}
                  word={t.word}
                  gloss={t.gloss}
                  showInline={mode === 'always'}
                  saved={isSaved(words, t.unit)}
                  continuation={t.continuation}
                  learned={learned.has(t.unit.toLowerCase())}
                  active={active?.groupKey === groupKey}
                  onTap={(anchor) => tapGloss(key, groupKey, t.unit, t.gloss, anchor)}
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
              <span className="feedback-emoji">
                <ReactionIcon value={opt.value} />
              </span>{' '}
              {opt.label}
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
          onToggleSave={() =>
            active.gloss !== null &&
            onWordsChange(toggleWord(active.word, active.gloss, story.id))
          }
          onClose={() => setActive(null)}
        />
      )}
    </article>
  )
}
