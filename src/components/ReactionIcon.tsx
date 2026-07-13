import type { Feedback } from '../lib/types'

/**
 * Hand-drawn reaction faces for rating a story:
 * easy = happy (yellow), ok = content with blush (pink), hard = sad (blue).
 */

const BLOB = 'M50 6 C71 5 92 23 92 48 C93 73 73 95 49 93 C24 94 6 72 8 47 C9 24 29 7 50 6 Z'
const INK = '#2d2a24'

const COLORS: Record<Feedback, string> = {
  easy: '#f7d15a',
  ok: '#f4a7ac',
  hard: '#8aabc8',
}

export function ReactionIcon({ value }: { value: Feedback }) {
  return (
    <svg className="reaction" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d={BLOB} fill={COLORS[value]} />
      {value === 'easy' && (
        <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
          <path d="M33 45 Q38 40 43 45" />
          <path d="M57 45 Q62 40 67 45" />
          <path d="M35 58 Q50 73 65 58" />
        </g>
      )}
      {value === 'ok' && (
        <>
          <circle cx="39" cy="47" r="3.4" fill={INK} />
          <circle cx="61" cy="47" r="3.4" fill={INK} />
          <ellipse cx="31" cy="61" rx="6" ry="4" fill="#e8828a" opacity="0.65" />
          <ellipse cx="69" cy="61" rx="6" ry="4" fill="#e8828a" opacity="0.65" />
          <path
            d="M40 61 Q50 69 60 61"
            fill="none"
            stroke={INK}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </>
      )}
      {value === 'hard' && (
        <>
          <circle cx="39" cy="48" r="3.4" fill={INK} />
          <circle cx="61" cy="48" r="3.4" fill={INK} />
          <path
            d="M38 68 Q50 58 62 68"
            fill="none"
            stroke={INK}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
