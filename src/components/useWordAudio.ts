import { useEffect, useRef, useState } from 'react'
import { loadWordsManifest, wordAudioUrl, wordSlug } from '../lib/audio'

/** Проигрывание озвучки отдельных слов (public/audio/words/*.mp3). */
export function useWordAudio() {
  const [slugs, setSlugs] = useState<Set<string> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let alive = true
    loadWordsManifest().then((s) => {
      if (alive) setSlugs(s)
    })
    return () => {
      alive = false
      audioRef.current?.pause()
    }
  }, [])

  /** есть ли аудио для этой формы слова */
  const has = (text: string) => !!slugs && slugs.has(wordSlug(text))

  const play = (text: string) => {
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = wordAudioUrl(wordSlug(text))
    audioRef.current.play().catch(() => {})
  }

  return { has, play }
}
