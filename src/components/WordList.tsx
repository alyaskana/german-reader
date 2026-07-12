import type { SavedWord } from '../lib/types'
import { stories } from '../stories'
import { removeWord } from '../lib/storage'

interface Props {
  words: SavedWord[]
  onWordsChange: (words: SavedWord[]) => void
}

export function WordList({ words, onWordsChange }: Props) {
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

  const sorted = [...words].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <div className="word-list">
      <ul>
        {sorted.map((w) => {
          const story = stories.find((s) => s.id === w.storyId)
          return (
            <li key={w.word} className="word-row">
              <div className="word-row-text">
                <strong>{w.word}</strong>
                <span className="word-gloss">{w.gloss}</span>
                {story && <span className="word-source">из «{story.title}»</span>}
              </div>
              <button
                type="button"
                className="word-remove"
                onClick={() => onWordsChange(removeWord(w.word))}
                aria-label={`Удалить ${w.word}`}
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
