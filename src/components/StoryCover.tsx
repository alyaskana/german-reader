import { useMemo } from 'react'
import type { Story } from '../lib/types'
import { fallbackCoverColors, sanitizeCover } from '../lib/cover'

interface Props {
  story: Story
  className?: string
}

export function StoryCover({ story, className }: Props) {
  const svg = useMemo(() => sanitizeCover(story.cover), [story.cover])
  const cls = `cover${className ? ` ${className}` : ''}`

  if (svg) return <div className={cls} aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />

  const { bg, shape } = fallbackCoverColors(story.id)
  const initial = story.title.trim().charAt(0).toUpperCase() || '?'
  return (
    <div className={cls} aria-hidden>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 120"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="200" height="120" fill={bg} />
        <circle cx="152" cy="96" r="52" fill={shape} opacity="0.35" />
        <circle cx="176" cy="20" r="26" fill={shape} opacity="0.5" />
        <text
          x="26"
          y="88"
          fontFamily="Literata, Georgia, serif"
          fontSize="56"
          fontWeight="600"
          fill={shape}
        >
          {initial}
        </text>
      </svg>
    </div>
  )
}
