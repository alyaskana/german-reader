import { useCallback, useEffect, useRef, useState } from 'react'
import type { Story } from '../lib/types'
import { loadAudioManifest, paragraphAudioUrl } from '../lib/audio'

// remember the last-played paragraph per story, to resume later
const POS_KEY = 'gr.audioPos'
function loadPos(id: string): number {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || '{}')[id] ?? 0
  } catch {
    return 0
  }
}
function savePos(id: string, i: number) {
  try {
    const m = JSON.parse(localStorage.getItem(POS_KEY) || '{}')
    m[id] = i
    localStorage.setItem(POS_KEY, JSON.stringify(m))
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Story narration player: one mp3 per paragraph, played back-to-back.
 * Real pause/resume (keeps position), prev/next, progress, speed, and
 * lock-screen controls via the MediaSession API.
 */
export function useStoryAudio(story: Story) {
  const [count, setCount] = useState(0) // voiced paragraphs; 0 = no audio
  const [index, setIndex] = useState(0) // currently loaded paragraph
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false) // has playback begun at all
  const [progress, setProgress] = useState(0) // 0..1 within current paragraph
  const [rate, setRateState] = useState(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const countRef = useRef(0)
  const indexRef = useRef(0)
  const rateRef = useRef(1)
  const storyIdRef = useRef(story.id)
  const loadAtRef = useRef<(i: number, autoplay: boolean) => void>(() => {})
  countRef.current = count
  indexRef.current = index
  rateRef.current = rate
  storyIdRef.current = story.id

  // lazily create the element and wire listeners once
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio()
      a.addEventListener('play', () => {
        setPlaying(true)
        setStarted(true)
      })
      a.addEventListener('pause', () => setPlaying(false))
      a.addEventListener('timeupdate', () =>
        setProgress(a.duration ? a.currentTime / a.duration : 0),
      )
      a.addEventListener('ended', () => {
        if (indexRef.current + 1 < countRef.current) loadAtRef.current(indexRef.current + 1, true)
        else {
          // finished the story — reset resume position to the start
          setPlaying(false)
          setProgress(0)
          indexRef.current = 0
          setIndex(0)
          savePos(storyIdRef.current, 0)
        }
      })
      audioRef.current = a
    }
    return audioRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAt = useCallback(
    (i: number, autoplay: boolean) => {
      const a = getAudio()
      const id = storyIdRef.current
      indexRef.current = i
      setIndex(i)
      setProgress(0)
      a.src = paragraphAudioUrl(id, i)
      a.playbackRate = rateRef.current
      savePos(id, i)
      if (autoplay) a.play().catch(() => {})
    },
    [getAudio],
  )
  loadAtRef.current = loadAt

  // load voiced-paragraph count; reset when the story changes
  useEffect(() => {
    let alive = true
    const a = audioRef.current
    if (a) {
      a.pause()
      a.removeAttribute('src')
    }
    const saved = loadPos(story.id)
    setPlaying(false)
    setStarted(false)
    setIndex(saved)
    setProgress(0)
    indexRef.current = saved
    loadAudioManifest().then((m) => {
      if (!alive) return
      const c = m[story.id] ?? 0
      setCount(c)
      // saved position out of range (story changed) → start over
      if (indexRef.current >= c) {
        indexRef.current = 0
        setIndex(0)
        savePos(story.id, 0)
      }
    })
    return () => {
      alive = false
      audioRef.current?.pause()
    }
  }, [story.id])

  const toggle = useCallback(() => {
    const a = getAudio()
    if (!a.src) return loadAt(indexRef.current, true) // resume from saved paragraph
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }, [getAudio, loadAt])

  const playParagraph = useCallback(
    (i: number) => {
      const a = getAudio()
      if (i === indexRef.current && a.src && !a.paused) a.pause()
      else loadAt(i, true)
    },
    [getAudio, loadAt],
  )

  const next = useCallback(() => {
    if (indexRef.current + 1 < countRef.current) loadAt(indexRef.current + 1, true)
  }, [loadAt])

  const prev = useCallback(() => {
    const a = getAudio()
    if (a.currentTime > 2 || indexRef.current === 0) a.currentTime = 0
    else loadAt(indexRef.current - 1, !a.paused)
  }, [getAudio, loadAt])

  const setRate = useCallback((r: number) => {
    setRateState(r)
    rateRef.current = r
    if (audioRef.current) audioRef.current.playbackRate = r
  }, [])

  /** jump across the whole story (0..1) to the matching paragraph */
  const seekStory = useCallback(
    (frac: number) => {
      if (!countRef.current) return
      const i = Math.min(countRef.current - 1, Math.max(0, Math.floor(frac * countRef.current)))
      loadAt(i, true)
    },
    [loadAt],
  )

  // lock-screen / hardware controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || count === 0) return
    const ms = navigator.mediaSession
    try {
      ms.metadata = new MediaMetadata({
        title: story.title,
        artist: 'Lesezeit',
        album: story.titleRu || 'Немецкие истории',
      })
    } catch {
      /* MediaMetadata may be unavailable */
    }
    ms.setActionHandler('play', () => toggle())
    ms.setActionHandler('pause', () => toggle())
    ms.setActionHandler('previoustrack', () => prev())
    ms.setActionHandler('nexttrack', () => next())
    return () => {
      ms.setActionHandler('play', null)
      ms.setActionHandler('pause', null)
      ms.setActionHandler('previoustrack', null)
      ms.setActionHandler('nexttrack', null)
    }
  }, [story.id, count, toggle, prev, next])

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  return {
    hasAudio: count > 0,
    count,
    index,
    isPlaying: playing,
    started,
    progress,
    /** progress across the whole story, 0..1 */
    storyProgress: count ? (index + progress) / count : 0,
    rate,
    /** paragraph to highlight in the text (null when not active) */
    current: started ? index : null,
    toggle,
    playParagraph,
    next,
    prev,
    setRate,
    seekStory,
  }
}
