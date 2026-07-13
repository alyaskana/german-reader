import type { Collection, Feedback, Story } from '../lib/types'
import { collectionById, collections, CUSTOM_COLLECTION } from '../lib/collections'
import { coverSrc } from '../lib/cover'
import { daysWord } from '../lib/progress'

interface Props {
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpenCollection: (id: string) => void
  onOpenStory: (id: string) => void
  onSync: () => void
  syncEnabled: boolean
  streak: number
  continueStory: Story | null
  dailyStory: Story | null
}

export function CollectionIndex({
  stories,
  feedback,
  onOpenCollection,
  onOpenStory,
  onSync,
  syncEnabled,
  streak,
  continueStory,
  dailyStory,
}: Props) {
  const groups: { collection: Collection; items: Story[] }[] = []
  for (const c of collections) {
    const items = stories.filter((s) => s.collection === c.id)
    if (items.length) groups.push({ collection: c, items })
  }
  // the custom folder is always there — it hosts the "add a story" flow
  const custom = stories.filter((s) => !collections.some((c) => c.id === s.collection))
  groups.push({ collection: CUSTOM_COLLECTION, items: custom })

  return (
    <div className="collection-index">
      {streak > 0 && (
        <div className="streak-chip">
          🔥 <strong>{streak}</strong> {daysWord(streak)} подряд
        </div>
      )}

      {dailyStory && (
        <button
          type="button"
          className="daily-card"
          onClick={() => onOpenStory(dailyStory.id)}
        >
          {dailyStory.cover && (
            <img className="daily-cover" src={coverSrc(dailyStory.cover)} alt="" />
          )}
          <span className="daily-main">
            <span className="daily-label">📅 История дня</span>
            <span className="daily-title">{dailyStory.title}</span>
            {dailyStory.wordOfDay && (
              <span className="daily-word">
                {dailyStory.wordOfDay.term} — {dailyStory.wordOfDay.gloss}
              </span>
            )}
          </span>
        </button>
      )}

      {continueStory && (
        <button
          type="button"
          className="continue-card"
          onClick={() => onOpenStory(continueStory.id)}
        >
          {continueStory.cover && (
            <img className="continue-cover" src={coverSrc(continueStory.cover)} alt="" />
          )}
          <span className="continue-main">
            <span className="continue-label">Продолжить чтение</span>
            <span className="continue-title">{continueStory.title}</span>
            <span className="continue-coll">
              {collectionById(continueStory.collection).title}
            </span>
          </span>
          <span className="continue-arrow" aria-hidden="true">
            →
          </span>
        </button>
      )}

      <ul>
        {groups.map(({ collection, items }) => {
          const read = items.filter((s) => feedback[s.id]).length
          const pct = items.length ? Math.round((read / items.length) * 100) : 0
          return (
            <li key={collection.id}>
              <button
                type="button"
                className="folder-card"
                onClick={() => onOpenCollection(collection.id)}
              >
                <span className="folder-emoji">{collection.emoji}</span>
                <span className="folder-main">
                  <span className="folder-title">{collection.title}</span>
                  <span className="folder-de">{collection.titleRu}</span>
                  <span className="folder-sub">{collection.subtitle}</span>
                  <span className="folder-progress" aria-hidden="true">
                    <span className="folder-progress-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="folder-progress-label">
                    {read > 0
                      ? `прочитано ${read} из ${items.length}`
                      : items.length > 0
                        ? `${items.length} ${plural(items.length)}`
                        : 'добавь первую →'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <button type="button" className="sync-link" onClick={onSync}>
        ⟳ Синхронизация между устройствами{syncEnabled ? ' · включена' : ''}
      </button>
    </div>
  )
}

function plural(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'история'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'истории'
  return 'историй'
}
