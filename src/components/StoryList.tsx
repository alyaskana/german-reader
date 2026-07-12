import type { Collection, Feedback, Story } from '../lib/types'
import { storyWordCount } from '../lib/parse'
import { coverSrc } from '../lib/cover'
import { collections, CUSTOM_COLLECTION } from '../lib/collections'

interface Props {
  stories: Story[]
  feedback: Record<string, Feedback>
  onOpen: (id: string) => void
  onAdd: () => void
}

const FEEDBACK_EMOJI: Record<Feedback, string> = { easy: '😌', ok: '👍', hard: '😵' }

export function StoryList({ stories, feedback, onOpen, onAdd }: Props) {
  // build ordered groups: known collections first, then user stories
  const groups: { collection: Collection; items: Story[] }[] = []
  for (const c of collections) {
    const items = stories.filter((s) => s.collection === c.id)
    if (items.length) groups.push({ collection: c, items })
  }
  const custom = stories.filter((s) => !collections.some((c) => c.id === s.collection))
  if (custom.length) groups.push({ collection: CUSTOM_COLLECTION, items: custom })

  return (
    <div className="story-list">
      {groups.map(({ collection, items }) => {
        const read = items.filter((s) => feedback[s.id]).length
        return (
          <section key={collection.id} className="collection">
            <header className="collection-head">
              <h2>{collection.titleRu}</h2>
              <p className="collection-de">{collection.title}</p>
              <p className="collection-sub">{collection.subtitle}</p>
              <p className="collection-count">
                {items.length} историй{read > 0 ? ` · прочитано ${read}` : ''}
              </p>
            </header>

            <ul>
              {items.map((s) => {
                const fb = feedback[s.id]
                return (
                  <li key={s.id}>
                    <button type="button" className="story-card" onClick={() => onOpen(s.id)}>
                      {s.cover && <img className="story-thumb" src={coverSrc(s.cover)} alt="" />}
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
          </section>
        )
      })}

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
