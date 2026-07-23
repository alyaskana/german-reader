import { useEffect, useRef, useState } from 'react'
import { loadWordsManifest, wordAudioUrl, wordSlug } from '../lib/audio'

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** clean a saved word for the device synthesizer: drop "…"/"·" split markers */
function speakable(text: string): string {
  return text
    .replace(/[·…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function speak(text: string) {
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(speakable(text))
  u.lang = 'de-DE'
  const de = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('de'))
  if (de) u.voice = de
  u.rate = 0.95
  synth.speak(u)
}

/**
 * Play a single word: the pre-generated sage mp3 when it exists, otherwise fall
 * back to the device's built-in speech synthesis so every word is playable.
 */
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
      if (speechSupported) window.speechSynthesis.cancel()
    }
  }, [])

  /** a pre-generated sage mp3 exists for this word */
  const hasFile = (text: string) => !!slugs && slugs.has(wordSlug(text))

  /** any playback is possible (mp3 or device synth) */
  const has = (text: string) => hasFile(text) || speechSupported

  const play = (text: string) => {
    if (hasFile(text)) {
      if (speechSupported) window.speechSynthesis.cancel()
      if (!audioRef.current) audioRef.current = new Audio()
      audioRef.current.src = wordAudioUrl(wordSlug(text))
      audioRef.current.play().catch(() => {})
    } else if (speechSupported) {
      audioRef.current?.pause()
      speak(text)
    }
  }

  return { has, hasFile, play }
}
