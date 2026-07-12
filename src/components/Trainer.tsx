import { useState } from 'react'
import type { Grade, SavedWord } from '../lib/types'
import { dueWords, isLearned } from '../lib/srs'
import { gradeWord } from '../lib/storage'

interface Props {
  words: SavedWord[]
  onWordsChange: (words: SavedWord[]) => void
  onBack: () => void
}

const GRADES: { value: Grade; label: string; hint: string }[] = [
  { value: 'again', label: 'Не помню', hint: 'повторим ещё раз' },
  { value: 'good', label: 'Помню', hint: 'вернётся позже' },
  { value: 'easy', label: 'Легко', hint: 'вернётся нескоро' },
]

export function Trainer({ words, onWordsChange, onBack }: Props) {
  // snapshot of the session queue; 'again' words come back to the end
  const [queue, setQueue] = useState<string[]>(() => dueWords(words).map((w) => w.word))
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  // 'again' keeps the card in the queue, so done + queue.length stays constant
  const total = done + queue.length

  const current = words.find((w) => w.word === queue[0])

  function grade(g: Grade) {
    if (!current) return
    const updated = gradeWord(current.word, g)
    onWordsChange(updated)
    setRevealed(false)
    setQueue((q) => {
      const rest = q.slice(1)
      return g === 'again' ? [...rest, current.word] : rest
    })
    if (g !== 'again') setDone((d) => d + 1)
  }

  if (!current) {
    const learned = words.filter(isLearned).length
    return (
      <div className="trainer">
        <div className="trainer-done">
          <p className="trainer-done-emoji">🎉</p>
          <h2>{done > 0 ? `Повторила ${done} ${plural(done)}!` : 'Пока нечего повторять'}</h2>
          <p className="trainer-done-note">
            {done > 0
              ? 'Слова вернутся, когда придёт время их повторить.'
              : 'Слова появляются здесь по расписанию повторений. Читай истории и сохраняй новые слова.'}
            {learned > 0 && ` Выучено слов: ${learned}.`}
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
          {done} / {total}
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
          {GRADES.map((g) => (
            <button
              key={g.value}
              type="button"
              className={`grade-btn grade-${g.value}`}
              onClick={() => grade(g.value)}
            >
              {g.label}
              <span className="grade-hint">{g.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="trainer-tip">Вспомни перевод, потом проверь себя.</p>
      )}
    </div>
  )
}

function plural(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'слово'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слова'
  return 'слов'
}
