import type { MouseEvent } from 'react'
import type { useStoryAudio } from './useStoryAudio'

type Audio = ReturnType<typeof useStoryAudio>

const SPEEDS = [1, 0.85, 0.7]

/** Sticky narration player: appears once playback has started. */
export function MiniPlayer({ audio }: { audio: Audio }) {
  if (!audio.hasAudio || !audio.started) return null

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(audio.rate)
    audio.setRate(SPEEDS[(i + 1) % SPEEDS.length] ?? 1)
  }

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    audio.seekStory((e.clientX - r.left) / r.width)
  }

  return (
    <div className="mini-player">
      <div className="mp-bar" onClick={seek}>
        <div className="mp-bar-fill" style={{ width: `${audio.storyProgress * 100}%` }} />
      </div>
      <div className="mp-row">
        <button type="button" className="mp-btn" onClick={audio.prev} aria-label="Предыдущий абзац">
          ⏮
        </button>
        <button
          type="button"
          className="mp-play"
          onClick={audio.toggle}
          aria-label={audio.isPlaying ? 'Пауза' : 'Играть'}
        >
          {audio.isPlaying ? '⏸' : '▶'}
        </button>
        <button type="button" className="mp-btn" onClick={audio.next} aria-label="Следующий абзац">
          ⏭
        </button>
        <span className="mp-pos">
          {audio.index + 1} / {audio.count}
        </span>
        <button type="button" className="mp-speed" onClick={cycleSpeed} title="Скорость чтения">
          {audio.rate === 1 ? '1×' : `${audio.rate}×`}
        </button>
      </div>
    </div>
  )
}
