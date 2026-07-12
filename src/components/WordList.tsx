import type { SavedWord, Story } from '../lib/types'
import { removeWord, setLearned } from '../lib/storage'

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

  const learning = words.filter((w) => !w.learned).length
  const learned = words.length - learning
  const sorted = [...words].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <div className="word-list">
      <div className="train-banner">
        <div>
          <strong>{learning > 0 ? `Учу слов: ${learning}` : 'Все слова знакомы 🎉'}</strong>
          <span className="train-banner-note">
            {learned > 0 ? `уже знаю: ${learned} из ${words.length}` : 'потренируйся, когда захочешь'}
          </span>
        </div>
        {learning > 0 && (
          <button type="button" className="generate-btn" onClick={onTrain}>
            Тренировка
          </button>
        )}
      </div>

      <ul>
        {sorted.map((w) => {
          const story = allStories.find((s) => s.id === w.storyId)
          return (
            <li key={w.word} className="word-row">
              <div className="word-row-text">
                <strong>{w.word}</strong>
                <span className="word-gloss">{w.gloss}</span>
                {story && <span className="word-source">из «{story.title}»</span>}
              </div>
              <div className="word-row-side">
                <button
                  type="button"
                  className={`word-status${w.learned ? ' learned' : ''}`}
                  onClick={() => onWordsChange(setLearned(w.word, !w.learned))}
                  title={w.learned ? 'Вернуть в изучение' : 'Отметить знакомым'}
                >
                  {w.learned ? '✓ знаю' : 'учу'}
                </button>
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
