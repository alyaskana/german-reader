import { useMemo, useState } from 'react'
import type { Feedback, GlossMode, SavedWord, Story } from '../lib/types'
import { parseParagraph, splitWords, storyWordCount } from '../lib/parse'
import { isSaved, learnedSet, setFeedback, toggleWord } from '../lib/storage'
import { nounDisplay, nounStudyForm } from '../lib/nouns'
import { coverSrc } from '../lib/cover'
import { GlossWord } from './GlossWord'
import { MiniPlayer } from './MiniPlayer'
import { Quiz } from './Quiz'
import { ReactionIcon } from './ReactionIcon'
import { useStoryAudio } from './useStoryAudio'
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
  /** display form shown in the popover (e.g. "die Kinder · das Kind") */
  word: string
  /** citation form saved to the dictionary / used for audio (e.g. "das Kind") */
  save: string
  gloss: string | null
  anchor: HTMLElement
}

const FEEDBACK_OPTIONS: { value: Feedback; label: string }[] = [
  { value: 'easy', label: 'Leicht' },
  { value: 'ok', label: 'Mittel' },
  { value: 'hard', label: 'Schwer' },
]

/** Meaning without the literal gloss: strips a trailing "(букв. …)" part. */
function idiomMeaning(gloss: string): string {
  return gloss.replace(/\s*\(\s*букв[^)]*\)\s*$/i, '').trim()
}

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
  const audio = useStoryAudio(story)

  function tapGloss(
    key: string,
    groupKey: string,
    unit: string,
    gloss: string,
    anchor: HTMLElement,
  ) {
    setActive((cur) =>
      cur?.key === key
        ? null
        : { key, groupKey, word: nounDisplay(story, unit), save: nounStudyForm(story, unit), gloss, anchor },
    )
  }

  function tapPlain(key: string, word: string, anchor: HTMLElement) {
    const gloss = story.dict?.[word.toLowerCase()] ?? null
    setActive((cur) =>
      cur?.key === key
        ? null
        : { key, groupKey: null, word: nounDisplay(story, word), save: nounStudyForm(story, word), gloss, anchor },
    )
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
        {audio.hasAudio && (
          <button
            type="button"
            className="listen-toggle"
            onClick={audio.toggle}
            title="Озвучить историю целиком"
          >
            {audio.isPlaying ? '⏸ Пауза' : '🔊 Слушать'}
          </button>
        )}
      </header>

      <h1>{story.title}</h1>
      <p className="subtitle">
        {story.titleRu} · {story.level} · {wordCount} слов
      </p>

      {story.wordOfDay && (
        <div className="word-of-day">
          <div className="wod-text">
            <span className="wod-term">{story.wordOfDay.term}</span>
            <span className="wod-gloss">{story.wordOfDay.gloss}</span>
          </div>
          <button
            type="button"
            className={`wod-save${isSaved(words, story.wordOfDay.term) ? ' is-saved' : ''}`}
            onClick={() =>
              onWordsChange(
                toggleWord(story.wordOfDay!.term, idiomMeaning(story.wordOfDay!.gloss), story.id),
              )
            }
          >
            {isSaved(words, story.wordOfDay.term) ? '✓ в словах' : '+ в словарь'}
          </button>
        </div>
      )}

      {story.cover && <img className="reader-cover" src={coverSrc(story.cover)} alt="" />}

      <div className="text">
        {paragraphs.map((tokens, pi) => (
          <div key={pi} className={`para${audio.current === pi ? ' speaking' : ''}`}>
            {audio.hasAudio && (
              <button
                type="button"
                className="para-play"
                onClick={() => audio.playParagraph(pi)}
                aria-label="Озвучить абзац"
              >
                {audio.current === pi && audio.isPlaying ? '⏸' : '▶'}
              </button>
            )}
            <p>
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
                  saved={isSaved(words, nounStudyForm(story, t.unit))}
                  continuation={t.continuation}
                  learned={learned.has(nounStudyForm(story, t.unit).toLowerCase())}
                  active={active?.groupKey === groupKey}
                  onTap={(anchor) => tapGloss(key, groupKey, t.unit, t.gloss, anchor)}
                />
              )
            })}
            </p>
          </div>
        ))}
      </div>

      {story.quiz && story.quiz.length > 0 && <Quiz questions={story.quiz} />}

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
          playText={active.save}
          gloss={active.gloss}
          anchor={active.anchor}
          saved={isSaved(words, active.save)}
          onToggleSave={() =>
            active.gloss !== null && onWordsChange(toggleWord(active.save, active.gloss, story.id))
          }
          onClose={() => setActive(null)}
        />
      )}

      <MiniPlayer audio={audio} />
    </article>
  )
}
