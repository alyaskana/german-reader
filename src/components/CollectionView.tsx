import type { Feedback, Story } from '../lib/types'
import { storyWordCount } from '../lib/parse'
import { coverSrc } from '../lib/cover'
import { collectionById, CUSTOM_COLLECTION } from '../lib/collections'
import { ReactionIcon } from './ReactionIcon'
import { dailyDate } from '../lib/progress'

interface Props {
  collectionId: string
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpen: (id: string) => void
  onAdd: () => void
  onBack: () => void
}

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
  // daily stories read newest-first; other collections keep their curated order
  if (collectionId === 'daily') items.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))

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
                  {s.cover && <img className="story-thumb" src={coverSrc(s.cover)} alt="" />}
                  <span className="story-card-main">
                    <span className="story-title">{s.title}</span>
                    <span className="story-title-ru">{s.titleRu}</span>
                  </span>
                  <span className="story-card-meta">
                    {dailyDate(s.id) && <span className="story-date">{dailyDate(s.id)}</span>}
                    {s.level && <span className="story-level">{s.level}</span>}
                    <span className="story-words">{storyWordCount(s)} слов</span>
                    {fb && (
                      <span className="story-status read">
                        <ReactionIcon value={fb} />
                      </span>
                    )}
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
