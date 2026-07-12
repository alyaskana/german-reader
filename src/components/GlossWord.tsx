interface Props {
  word: string
  gloss: string
  showGloss: boolean
  saved: boolean
  active: boolean
  onTap: () => void
}

export function GlossWord({ word, gloss, showGloss, saved, active, onTap }: Props) {
  return (
    <button
      type="button"
      className={`gloss-word${saved ? ' saved' : ''}${active ? ' active' : ''}`}
      onClick={onTap}
    >
      <span className={`gloss-ru${showGloss ? '' : ' hidden'}`} aria-hidden={!showGloss}>
        {gloss}
      </span>
      <span className="gloss-de">{word}</span>
    </button>
  )
}
