interface Props {
  word: string
  gloss: string
  showInline: boolean
  saved: boolean
  active: boolean
  onTap: (anchor: HTMLElement) => void
}

export function GlossWord({ word, gloss, showInline, saved, active, onTap }: Props) {
  return (
    <button
      type="button"
      className={`gloss-word${saved ? ' saved' : ''}${active ? ' active' : ''}`}
      onClick={(e) => onTap(e.currentTarget)}
    >
      <span className="gloss-de">{word}</span>
      {showInline && <span className="gloss-inline">{gloss}</span>}
    </button>
  )
}
