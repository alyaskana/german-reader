import type { Collection, Feedback, Story } from '../lib/types'
import { collections, CUSTOM_COLLECTION } from '../lib/collections'

interface Props {
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpenCollection: (id: string) => void
  onAdd: () => void
  onSync: () => void
  syncEnabled: boolean
}

export function CollectionIndex({
  stories,
  feedback,
  onOpenCollection,
  onAdd,
  onSync,
  syncEnabled,
}: Props) {
  const groups: { collection: Collection; items: Story[] }[] = []
  for (const c of collections) {
    const items = stories.filter((s) => s.collection === c.id)
    if (items.length) groups.push({ collection: c, items })
  }
  const custom = stories.filter((s) => !collections.some((c) => c.id === s.collection))
  if (custom.length) groups.push({ collection: CUSTOM_COLLECTION, items: custom })

  return (
    <div className="collection-index">
      <ul>
        {groups.map(({ collection, items }) => {
          const read = items.filter((s) => feedback[s.id]).length
          const pct = Math.round((read / items.length) * 100)
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
                      : `${items.length} ${plural(items.length)}`}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <button type="button" className="folder-add" onClick={onAdd}>
        <span className="folder-add-plus">＋</span>
        <span>
          <strong>Своя история</strong>
          <span className="folder-add-sub">сгенерируй в Claude и добавь</span>
        </span>
      </button>

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
