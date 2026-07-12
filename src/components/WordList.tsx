import type { SavedWord, Story } from '../lib/types'
import { removeWord } from '../lib/storage'
import { dueLabel, dueWords, isLearned } from '../lib/srs'

interface Props {
  words: SavedWord[]
  allStories: Story[]
  onWordsChange: (words: SavedWord[]) => void
  onTrain: () => void
}

export function WordList({ words, allStories, onWordsChange, onTrain }: Props) {
  if (words.length === 0) {
    return (
      <div className="word-list empty">
        <p>
          Пока пусто. Тапни на выделенное слово в истории и нажми «+ В мои слова» — оно появится
          здесь и будет повторяться в новых историях.
        </p>
      </div>
    )
  }

  const due = dueWords(words).length
  const learned = words.filter(isLearned).length
  const sorted = [...words].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <div className="word-list">
      <div className="train-banner">
        <div>
          <strong>{due > 0 ? `К повторению: ${due}` : 'Всё повторено 🎉'}</strong>
          <span className="train-banner-note">
            {learned > 0 ? `выучено: ${learned} из ${words.length}` : `всего слов: ${words.length}`}
          </span>
        </div>
        {due > 0 && (
          <button type="button" className="generate-btn" onClick={onTrain}>
            Тренировка
          </button>
        )}
      </div>

      <ul>
        {sorted.map((w) => {
          const story = allStories.find((s) => s.id === w.storyId)
          const learnedWord = isLearned(w)
          return (
            <li key={w.word} className="word-row">
              <div className="word-row-text">
                <strong>{w.word}</strong>
                <span className="word-gloss">{w.gloss}</span>
                {story && <span className="word-source">из «{story.title}»</span>}
              </div>
              <div className="word-row-side">
                <span className={`word-status${learnedWord ? ' learned' : ''}`}>
                  {learnedWord ? '✓ выучено' : dueLabel(w)}
                </span>
                <button
                  type="button"
                  className="word-remove"
                  onClick={() => onWordsChange(removeWord(w.word))}
                  aria-label={`Удалить ${w.word}`}
                >
                  ×
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
