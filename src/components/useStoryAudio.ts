import { useEffect, useRef, useState } from 'react'
import type { Story } from '../lib/types'
import { loadAudioManifest, paragraphAudioUrl } from '../lib/audio'

type Playing = { mode: 'single' | 'all'; index: number } | null

/**
 * Управляет воспроизведением озвучки истории (по одному mp3 на абзац).
 * Возвращает состояние для подсветки и методы плей/стоп.
 */
export function useStoryAudio(story: Story) {
  const [count, setCount] = useState(0) // сколько абзацев озвучено; 0 → аудио нет
  const [playing, setPlaying] = useState<Playing>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // сколько абзацев доступно для этой истории
  useEffect(() => {
    let alive = true
    setPlaying(null)
    loadAudioManifest().then((m) => {
      if (alive) setCount(m[story.id] ?? 0)
    })
    return () => {
      alive = false
    }
  }, [story.id])

  // проигрывание текущего абзаца + переход к следующему в режиме "слушать всё"
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio()
    const a = audioRef.current
    if (!playing) {
      a.pause()
      return
    }
    a.src = paragraphAudioUrl(story.id, playing.index)
    a.play().catch(() => setPlaying(null))
    const onEnded = () =>
      setPlaying((p) => {
        if (!p) return null
        if (p.mode === 'all' && p.index + 1 < count) return { mode: 'all', index: p.index + 1 }
        return null
      })
    a.addEventListener('ended', onEnded)
    return () => a.removeEventListener('ended', onEnded)
  }, [playing, story.id, count])

  // остановить звук при уходе с истории
  useEffect(() => () => audioRef.current?.pause(), [])

  return {
    hasAudio: count > 0,
    current: playing?.index ?? null,
    isPlaying: playing !== null,
    /** тапнуть по абзацу: играть его / остановить, если уже играет */
    playParagraph: (i: number) =>
      setPlaying((p) => (p?.index === i ? null : { mode: 'single', index: i })),
    /** кнопка "слушать всю историю" / пауза */
    toggleAll: () => setPlaying((p) => (p ? null : { mode: 'all', index: 0 })),
  }
}
