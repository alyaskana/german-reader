import type { Feedback, Story } from './types'
import { collections } from './collections'
import { localDay } from './storage'

function dayNumber(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

/**
 * Consecutive days of reading ending today (or yesterday, so the streak
 * doesn't look broken before you've read today).
 */
export function computeStreak(dates: string[], today = localDay()): number {
  if (!dates.length) return 0
  const nums = new Set(dates.map(dayNumber))
  const t = dayNumber(today)
  let cur = nums.has(t) ? t : nums.has(t - 1) ? t - 1 : null
  if (cur === null) return 0
  let streak = 0
  while (nums.has(cur)) {
    streak++
    cur--
  }
  return streak
}

/**
 * The story to resume: first unread story of the last-read collection,
 * then falling through the other built-in collections. Custom stories are
 * left out — "continue reading" is about the curated collections.
 */
export function nextStory(
  stories: Story[],
  feedback: Record<string, Feedback>,
  lastStoryId: string,
): Story | null {
  // "continue reading" is about the curated learning collections, not the daily feed
  const last = stories.find((s) => s.id === lastStoryId)
  const order: string[] = []
  if (last?.collection && last.collection !== 'daily') order.push(last.collection)
  for (const c of collections) if (c.id !== 'daily' && !order.includes(c.id)) order.push(c.id)

  for (const cid of order) {
    const next = stories
      .filter((s) => s.collection === cid && !s.custom)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .find((s) => !feedback[s.id])
    if (next) return next
  }
  return null
}

/** Today's daily story: exact match by date, else the most recent one. */
export function dailyStory(stories: Story[], today = localDay()): Story | null {
  const daily = stories.filter((s) => s.collection === 'daily')
  if (!daily.length) return null
  return (
    daily.find((s) => s.id === `daily-${today}`) ??
    daily.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))[0]
  )
}

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/** Human date for a daily story (from its `daily-YYYY-MM-DD` id): "сегодня", "13 июля", "13 июля 2025". */
export function dailyDate(id: string, today = localDay()): string | null {
  const m = /^daily-(\d{4})-(\d{2})-(\d{2})$/.exec(id)
  if (!m) return null
  const [, y, mo, d] = m
  if (`${y}-${mo}-${d}` === today) return 'сегодня'
  const label = `${Number(d)} ${MONTHS_RU[Number(mo) - 1]}`
  return y === today.slice(0, 4) ? label : `${label} ${y}`
}

/** Russian plural for "день". */
export function daysWord(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'день'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня'
  return 'дней'
}
