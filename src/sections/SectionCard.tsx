import type { Ref } from 'react'
import type { Section } from '../theme'
import './sections.css'

interface Props {
  section: Section
  onOpen: () => void
  /** True while this card's section is open — hides the title for the flight. */
  sending?: boolean
  titleRef?: Ref<HTMLParagraphElement>
}

export function SectionCard({ section, onOpen, sending, titleRef }: Props) {
  return (
    <button
      type="button"
      className={`card${sending ? ' card--sending' : ''}`}
      onClick={onOpen}
    >
      <span
        className="card__tint"
        aria-hidden="true"
        style={{
          background: `linear-gradient(100deg, ${section.tintFrom}, ${section.tintTo})`,
        }}
      />
      <span className="card__ghost" aria-hidden="true">
        {section.index}
      </span>
      <span className="card__body">
        <p className="card__title" ref={titleRef}>
          {section.title}
        </p>
        <p className="card__desc">{section.descriptor}</p>
      </span>
    </button>
  )
}
