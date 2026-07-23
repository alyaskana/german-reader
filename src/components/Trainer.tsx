import { useEffect, useState } from 'react'
import type { SavedWord } from '../lib/types'
import { setLearned } from '../lib/storage'
import { useWordAudio } from './useWordAudio'

const AUTOPLAY_KEY = 'gr.trainerAutoplay'

interface Props {
  words: SavedWord[]
  onWordsChange: (words: SavedWord[]) => void
  onBack: () => void
}

/** One relaxed pass over the words you're still learning — no schedule, train whenever. */
export function Trainer({ words, onWordsChange, onBack }: Props) {
  const [queue] = useState<string[]>(() =>
    words
      .filter((w) => !w.learned)
      .map((w) => w.word)
      .sort(() => Math.random() - 0.5),
  )
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [known, setKnown] = useState(0)
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem(AUTOPLAY_KEY) !== 'off')
  const audio = useWordAudio()

  const current = words.find((w) => w.word === queue[idx])
  const canPlay = current ? audio.has(current.word) : false

  function toggleAutoplay() {
    setAutoplay((a) => {
      localStorage.setItem(AUTOPLAY_KEY, a ? 'off' : 'on')
      return !a
    })
  }

  // auto-play the word when a new card appears (if enabled and audio exists)
  useEffect(() => {
    if (autoplay && current && audio.has(current.word)) audio.play(current.word)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, autoplay])

  function next(markKnown: boolean) {
    if (!current) return
    if (markKnown) {
      onWordsChange(setLearned(current.word, true))
      setKnown((k) => k + 1)
    }
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  if (!current) {
    return (
      <div className="trainer">
        <div className="trainer-done">
          <p className="trainer-done-emoji">🎉</p>
          <h2>{queue.length > 0 ? 'Все карточки пройдены!' : 'Нечего тренировать'}</h2>
          <p className="trainer-done-note">
            {queue.length > 0
              ? known > 0
                ? `Знакомых слов отмечено: ${known} из ${queue.length}. Они больше не подсвечиваются в историях.`
                : 'Все слова остались в изучении — они продолжат подсвечиваться в историях.'
              : 'Сохрани слова из историй, и они появятся здесь.'}
          </p>
          <button type="button" className="generate-btn" onClick={onBack}>
            ← К словам
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="trainer">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Мои слова
        </button>
        <div className="trainer-head-side">
          <button
            type="button"
            className={`autoplay-toggle${autoplay ? ' on' : ''}`}
            onClick={toggleAutoplay}
            title="Автопроигрывание слова при показе карточки"
          >
            {autoplay ? '🔊 авто' : '🔊 по тапу'}
          </button>
          <span className="trainer-progress">
            {idx + 1} / {queue.length}
          </span>
        </div>
      </header>

      <div className="flashcard-wrap">
        <button
          type="button"
          className={`flashcard${revealed ? ' revealed' : ''}`}
          onClick={() => setRevealed(true)}
        >
          <span className="flashcard-word">{current.word}</span>
          {revealed ? (
            <span className="flashcard-gloss">{current.gloss}</span>
          ) : (
            <span className="flashcard-hint">нажми, чтобы увидеть перевод</span>
          )}
        </button>
        {canPlay && (
          <button
            type="button"
            className="flashcard-play"
            onClick={() => audio.play(current.word)}
            aria-label="Прослушать слово"
          >
            🔊
          </button>
        )}
      </div>

      {revealed ? (
        <div className="trainer-grades">
          <button type="button" className="grade-btn grade-again" onClick={() => next(false)}>
            Ещё учу
            <span className="grade-hint">останется подсвеченным</span>
          </button>
          <button type="button" className="grade-btn grade-good" onClick={() => next(true)}>
            Уже знаю
            <span className="grade-hint">исчезнет из подсказок</span>
          </button>
        </div>
      ) : (
        <p className="trainer-tip">Вспомни перевод, потом проверь себя.</p>
      )}
    </div>
  )
}
