import type { Feedback, Story } from '../lib/types'
import { storyWordCount } from '../lib/parse'

interface Props {
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpen: (id: string) => void
  onAdd: () => void
}

const FEEDBACK_EMOJI: Record<Feedback, string> = { easy: '😌', ok: '👍', hard: '😵' }

export function StoryList({ stories, feedback, onOpen, onAdd }: Props) {
  return (
    <div className="story-list">
      <ul>
        {stories.map((s) => {
          const fb = feedback[s.id]
          return (
            <li key={s.id}>
              <button type="button" className="story-card" onClick={() => onOpen(s.id)}>
                <span className="story-card-main">
                  <span className="story-title">
                    {s.title}
                    {s.custom && <span className="custom-badge">моя</span>}
                  </span>
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
          Сгенерируй историю в Claude по персональному промпту и добавь её сюда — без правки кода.
        </p>
        <button type="button" className="generate-btn" onClick={onAdd}>
          + Добавить историю
        </button>
      </div>
    </div>
  )
}
