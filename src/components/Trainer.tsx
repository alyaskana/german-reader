import { useState } from 'react'
import type { SavedWord } from '../lib/types'
import { setLearned } from '../lib/storage'

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

  const current = words.find((w) => w.word === queue[idx])

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
                ? `Отметила знакомыми: ${known} из ${queue.length}. Эти слова больше не подсвечиваются в историях.`
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
        <span className="trainer-progress">
          {idx + 1} / {queue.length}
        </span>
      </header>

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
