import { useState } from 'react'
import type { Story } from '../lib/types'
import { buildPrompt } from '../lib/prompt'
import { parseStoryJson } from '../lib/importStory'
import { addCustomStory, removeCustomStory } from '../lib/storage'

interface Props {
  customStories: Story[]
  onCustomStoriesChange: (stories: Story[]) => void
  onOpenStory: (id: string) => void
  onBack: () => void
}

export function AddStory({ customStories, onCustomStoriesChange, onOpenStory, onBack }: Props) {
  const [copied, setCopied] = useState(false)
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function copyPrompt() {
    await navigator.clipboard.writeText(buildPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function addStory() {
    const result = parseStoryJson(json)
    if ('error' in result) {
      setError(result.error)
      return
    }
    onCustomStoriesChange(addCustomStory(result.story))
    setJson('')
    setError(null)
    onOpenStory(result.story.id)
  }

  return (
    <div className="add-story">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Истории
        </button>
      </header>

      <h1>Новая история под тебя</h1>
      <ol className="add-steps">
        <li>
          Скопируй промпт — в нём уже твои оценки сложности, слова, которые ты учишь, и слова,
          которые ты уже выучила.
        </li>
        <li>
          Вставь его в{' '}
          <a href="https://claude.ai" target="_blank" rel="noreferrer">
            Claude
          </a>{' '}
          и получи в ответ JSON.
        </li>
        <li>Вставь ответ сюда — история сразу появится в списке.</li>
      </ol>

      <button type="button" className="generate-btn" onClick={copyPrompt}>
        {copied ? '✓ Скопировано' : 'Скопировать промпт'}
      </button>

      <textarea
        className="json-input"
        placeholder='{"id": "...", "title": "...", "paragraphs": [...]}'
        value={json}
        onChange={(e) => {
          setJson(e.target.value)
          setError(null)
        }}
        rows={7}
      />
      {error && <p className="add-error">{error}</p>}
      <button type="button" className="generate-btn" onClick={addStory} disabled={!json.trim()}>
        Добавить историю
      </button>

      {customStories.length > 0 && (
        <section className="custom-list">
          <h2>Мои истории</h2>
          <ul>
            {customStories.map((s) => (
              <li key={s.id} className="word-row">
                <button type="button" className="custom-open" onClick={() => onOpenStory(s.id)}>
                  <strong>{s.title}</strong>
                  {s.titleRu && <span className="word-source">{s.titleRu}</span>}
                </button>
                <button
                  type="button"
                  className="word-remove"
                  onClick={() => onCustomStoriesChange(removeCustomStory(s.id))}
                  aria-label={`Удалить ${s.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
