import { useState } from 'react'
import type { SavedWord, Story } from '../lib/types'
import { editGloss, removeWord, setLearned } from '../lib/storage'
import { downloadCsv, wordsToTsv } from '../lib/exportWords'

interface Props {
  words: SavedWord[]
  allStories: Story[]
  onWordsChange: (words: SavedWord[]) => void
  onTrain: () => void
}

export function WordList({ words, allStories, onWordsChange, onTrain }: Props) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(w: SavedWord) {
    setEditing(w.word)
    setDraft(w.gloss)
  }
  function saveEdit(w: SavedWord) {
    const g = draft.trim()
    if (g && g !== w.gloss) onWordsChange(editGloss(w.word, g))
    setEditing(null)
  }

  async function copyTsv() {
    await navigator.clipboard.writeText(wordsToTsv(words))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

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
                {editing === w.word ? (
                  <input
                    className="word-edit-input"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(w)
                      if (e.key === 'Escape') setEditing(null)
                    }}
                  />
                ) : (
                  <span className="word-gloss">{w.gloss}</span>
                )}
                {story && <span className="word-source">из «{story.title}»</span>}
              </div>
              <div className="word-row-side">
                {editing === w.word ? (
                  <>
                    <button
                      type="button"
                      className="word-status"
                      onClick={() => saveEdit(w)}
                      aria-label="Сохранить перевод"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="word-remove"
                      onClick={() => setEditing(null)}
                      aria-label="Отменить"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="word-edit"
                      onClick={() => startEdit(w)}
                      aria-label={`Изменить перевод: ${w.word}`}
                    >
                      ✎
                    </button>
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
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="word-export">
        <p className="word-export-title">Забрать слова в свою колоду</p>
        <div className="word-export-actions">
          <button type="button" className="word-export-btn" onClick={() => downloadCsv(words)}>
            Скачать .csv
          </button>
          <button type="button" className="word-export-btn" onClick={copyTsv}>
            {copied ? '✓ Скопировано' : 'Скопировать для Quizlet'}
          </button>
        </div>
        <p className="word-export-note">
          CSV открывается в Anki и Excel; «скопировать» кладёт слова с табом между словом и
          переводом — вставь в поле импорта Quizlet.
        </p>
      </div>
    </div>
  )
}
