import type { Feedback, Story } from '../lib/types'
import { storyWordCount } from '../lib/parse'
import { coverSrc } from '../lib/cover'
import { collectionById, CUSTOM_COLLECTION } from '../lib/collections'

interface Props {
  collectionId: string
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpen: (id: string) => void
  onAdd: () => void
  onBack: () => void
}

const FEEDBACK_EMOJI: Record<Feedback, string> = { easy: '😌', ok: '👍', hard: '😵' }

export function CollectionView({
  collectionId,
  stories,
  feedback,
  onOpen,
  onAdd,
  onBack,
}: Props) {
  const collection = collectionById(collectionId)
  const isCustom = collectionId === CUSTOM_COLLECTION.id
  const items = isCustom
    ? stories.filter((s) => s.custom)
    : stories.filter((s) => s.collection === collectionId)

  return (
    <div className="collection-view">
      <header className="reader-header">
        <button type="button" className="back" onClick={onBack}>
          ← Сборники
        </button>
      </header>

      <div className="collection-head">
        <h2>
          <span className="collection-head-emoji">{collection.emoji}</span> {collection.title}
        </h2>
        <p className="collection-de">{collection.titleRu}</p>
        <p className="collection-sub">{collection.subtitle}</p>
      </div>

      <div className="story-list">
        <ul>
          {items.map((s) => {
            const fb = feedback[s.id]
            return (
              <li key={s.id}>
                <button type="button" className="story-card" onClick={() => onOpen(s.id)}>
                  <span className={`story-check${fb ? ' done' : ''}`} aria-hidden="true">
                    {fb && (
                      <svg viewBox="0 0 24 24" className="story-check-icon">
                        <path
                          d="M5 12.5 L10 17.5 L19 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {s.cover && <img className="story-thumb" src={coverSrc(s.cover)} alt="" />}
                  <span className="story-card-main">
                    <span className="story-title">{s.title}</span>
                    <span className="story-title-ru">{s.titleRu}</span>
                  </span>
                  <span className="story-card-meta">
                    <span className="story-words">{storyWordCount(s)} слов</span>
                    {fb && <span className="story-status read">{FEEDBACK_EMOJI[fb]}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {isCustom && (
        <button type="button" className="generate-btn collection-add-more" onClick={onAdd}>
          ＋ Добавить историю
        </button>
      )}
    </div>
  )
}
