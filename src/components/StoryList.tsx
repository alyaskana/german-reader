import { useState } from 'react'
import type { Feedback, Story } from '../lib/types'
import { storyWordCount } from '../lib/parse'
import { buildPrompt } from '../lib/prompt'

interface Props {
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpen: (id: string) => void
}

const FEEDBACK_EMOJI: Record<Feedback, string> = { easy: '😌', ok: '👍', hard: '😵' }

export function StoryList({ stories, feedback, onOpen }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    await navigator.clipboard.writeText(buildPrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="story-list">
      <ul>
        {stories.map((s) => {
          const fb = feedback[s.id]
          return (
            <li key={s.id}>
              <button type="button" className="story-card" onClick={() => onOpen(s.id)}>
                <span className="story-card-main">
                  <span className="story-title">{s.title}</span>
                  <span className="story-title-ru">{s.titleRu}</span>
                </span>
                <span className="story-card-meta">
                  <span className="story-words">{storyWordCount(s)} слов</span>
                  {fb ? (
                    <span className="story-status read">{FEEDBACK_EMOJI[fb]} прочитано</span>
                  ) : (
                    <span className="story-status">не прочитано</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="generate">
        <h2>Новая история под тебя</h2>
        <p>
          Скопируй промпт — в нём уже твои оценки сложности и твои слова. Вставь его в Claude,
          а полученный JSON добавь в <code>src/stories/</code>.
        </p>
        <button type="button" className="generate-btn" onClick={copyPrompt}>
          {copied ? '✓ Скопировано' : 'Скопировать промпт'}
        </button>
      </div>
    </div>
  )
}
