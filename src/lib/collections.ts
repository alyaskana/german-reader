import type { Collection } from './types'

/** Collection shown for user-added stories (no built-in collection id). */
export const CUSTOM_COLLECTION: Collection = {
  id: 'meine',
  title: 'Meine Geschichten',
  titleRu: 'Мои истории',
  subtitle: 'добавлено тобой',
  emoji: '✍️',
}

export const collections: Collection[] = [
  {
    id: 'daily',
    title: 'Geschichte des Tages',
    titleRu: 'История дня',
    subtitle: 'каждый день новое слово или идиома в маленьком сюжете',
    emoji: '📅',
  },
  {
    id: 'deutscher',
    title: 'Wie man Deutscher wird',
    titleRu: 'Как стать немцем',
    subtitle: 'истории о немецких привычках — сериал про Тома в Берлине',
    emoji: '🥨',
  },
  {
    id: 'alltag',
    title: 'Alltag',
    titleRu: 'Повседневное',
    subtitle: 'короткие сценки из обычной жизни',
    emoji: '☕',
  },
]

const byId = new Map(collections.map((c) => [c.id, c]))

export function collectionById(id: string | undefined): Collection {
  return (id && byId.get(id)) || CUSTOM_COLLECTION
}
