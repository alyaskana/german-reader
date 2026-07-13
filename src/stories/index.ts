import type { Story } from '../lib/types'

// Auto-discover every story JSON in this folder — dropping a new file is enough,
// no manual import needed. Each file carries its own `collection` and `order`.
const modules = import.meta.glob<{ default: Story }>('./*.json', { eager: true })

export const stories: Story[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
