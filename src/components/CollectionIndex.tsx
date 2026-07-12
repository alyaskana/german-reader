import type { Collection, Feedback, Story } from '../lib/types'
import { collections, CUSTOM_COLLECTION } from '../lib/collections'

interface Props {
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpenCollection: (id: string) => void
  onAdd: () => void
}

export function CollectionIndex({ stories, feedback, onOpenCollection, onAdd }: Props) {
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
          return (
            <li key={collection.id}>
              <button
                type="button"
                className="folder-card"
                onClick={() => onOpenCollection(collection.id)}
              >
                <span className="folder-emoji">{collection.emoji}</span>
                <span className="folder-main">
                  <span className="folder-title">{collection.titleRu}</span>
                  <span className="folder-de">{collection.title}</span>
                  <span className="folder-sub">{collection.subtitle}</span>
                </span>
                <span className="folder-meta">
                  <span className="folder-count">{items.length}</span>
                  {read > 0 && <span className="folder-read">прочитано {read}</span>}
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
    </div>
  )
}
