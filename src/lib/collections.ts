import type { Collection } from './types'

/** Collection shown for user-added stories (no built-in collection id). */
export const CUSTOM_COLLECTION: Collection = {
  id: 'meine',
  title: 'Meine Geschichten',
  titleRu: 'Мои истории',
  subtitle: 'то, что ты добавила сама',
}

export const collections: Collection[] = [
  {
    id: 'deutscher',
    title: 'Wie man Deutscher wird',
    titleRu: 'Как стать немцем',
    subtitle: 'истории о немецких привычках — сериал про Тома в Берлине',
  },
  {
    id: 'alltag',
    title: 'Alltag',
    titleRu: 'Повседневное',
    subtitle: 'короткие сценки из обычной жизни',
  },
]

const byId = new Map(collections.map((c) => [c.id, c]))

export function collectionById(id: string | undefined): Collection {
  return (id && byId.get(id)) || CUSTOM_COLLECTION
}
