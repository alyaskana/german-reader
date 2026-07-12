import { useLayoutEffect, useRef, useState } from 'react'

interface Props {
  word: string
  /** null → no translation available, offer an external translator link */
  gloss: string | null
  anchor: HTMLElement
  saved: boolean
  onToggleSave: () => void
  onClose: () => void
}

const MARGIN = 12
const GAP = 10

export function WordPopover({ word, gloss, anchor, saved, onToggleSave, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{ left: number; top: number; below: boolean; arrow: number }>()

  useLayoutEffect(() => {
    const place = () => {
      const pop = ref.current
      if (!pop) return
      const rect = anchor.getBoundingClientRect()
      const { width, height } = pop.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const left = Math.min(Math.max(cx - width / 2, MARGIN), window.innerWidth - width - MARGIN)
      const below = rect.top - height - GAP < MARGIN
      const top = below ? rect.bottom + GAP : rect.top - height - GAP
      const arrow = Math.min(Math.max(cx - left, 16), width - 16)
      setStyle({ left, top, below, arrow })
    }
    place()
    window.addEventListener('scroll', onClose, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', onClose)
      window.removeEventListener('resize', place)
    }
  }, [anchor, onClose])

  return (
    <>
      <div className="popover-backdrop" onClick={onClose} />
      <div
        ref={ref}
        className={`popover${style?.below ? ' below' : ''}`}
        role="dialog"
        style={
          style
            ? { left: style.left, top: style.top, ['--arrow-x' as string]: `${style.arrow}px` }
            : { visibility: 'hidden', left: 0, top: 0 }
        }
      >
        <div className="popover-text">
          <strong>{word}</strong>
          <span>{gloss !== null ? gloss : 'перевода нет в этой истории'}</span>
        </div>
        {gloss !== null ? (
          <button
            type="button"
            className={`popover-save${saved ? ' is-saved' : ''}`}
            onClick={onToggleSave}
          >
            {saved ? '✓ в моих словах' : '+ в мои слова'}
          </button>
        ) : (
          <a
            className="popover-save"
            href={`https://translate.google.com/?sl=de&tl=ru&text=${encodeURIComponent(word)}`}
            target="_blank"
            rel="noreferrer"
          >
            перевести ↗
          </a>
        )}
      </div>
    </>
  )
}
