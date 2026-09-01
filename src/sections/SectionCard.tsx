import type { Ref } from 'react'
import type { Section } from '../theme'
import './sections.css'

interface Props {
  section: Section
  onOpen: () => void
  /** Warm the section's chunk and model before the click lands. */
  onPrefetch?: () => void
  /** True while this card's section is open — hides the title for the flight. */
  sending?: boolean
  titleRef?: Ref<HTMLParagraphElement>
}

export function SectionCard({ section, onOpen, onPrefetch, sending, titleRef }: Props) {
  return (
    <button
      type="button"
      className={`card${sending ? ' card--sending' : ''}`}
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      // pointerdown fires before click on touch, so a tap still gets a head start.
      onPointerDown={onPrefetch}
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
