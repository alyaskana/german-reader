interface Props {
  word: string
  gloss: string
  showInline: boolean
  saved: boolean
  /** later part of a split unit (separable verb etc.): no own inline gloss */
  continuation: boolean
  /** learned via the trainer: rendered as plain text, gloss only on tap */
  learned: boolean
  active: boolean
  onTap: (anchor: HTMLElement) => void
}

export function GlossWord({
  word,
  gloss,
  showInline,
  saved,
  continuation,
  learned,
  active,
  onTap,
}: Props) {
  return (
    <button
      type="button"
      className={`gloss-word${saved ? ' saved' : ''}${learned ? ' learned' : ''}${active ? ' active' : ''}`}
      onClick={(e) => onTap(e.currentTarget)}
    >
      <span className="gloss-de">{word}</span>
      {showInline && !learned && !continuation && <span className="gloss-inline">{gloss}</span>}
    </button>
  )
}
