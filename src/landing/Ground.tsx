import { useCallback, useRef, useState, type Ref } from 'react'
import { SECTIONS, type HourKey } from '../theme'
import { SectionCard } from '../sections/SectionCard'
import { SectionOverlay } from '../sections/SectionOverlay'
import './ground.css'

interface Props {
  reducedMotion: boolean
  /** Driven per-frame by the descent, so it rights itself as you arrive. */
  headingRef?: Ref<HTMLHeadingElement>
}

export function Ground({ reducedMotion, headingRef }: Props) {
  const [openKey, setOpenKey] = useState<HourKey | null>(null)
  const [closing, setClosing] = useState(false)
  const titleRefs = useRef(new Map<HourKey, HTMLParagraphElement | null>())
  const originRef = useRef<HTMLElement | null>(null)

  const open = SECTIONS.find((s) => s.key === openKey) ?? null

  // Point the overlay at the title of whichever card is open, so its FLIP has
  // something to measure from. Assigned during render because the overlay's
  // layout effect reads it after this render commits.
  originRef.current = openKey ? (titleRefs.current.get(openKey) ?? null) : null

  // Closing is a two-step: ask, let the overlay play its exit, then unmount.
  const requestClose = useCallback(() => setClosing(true), [])
  const finishClose = useCallback(() => {
    setClosing(false)
    setOpenKey(null)
  }, [])

  return (
    <div className="ground">
      {/* Rests askew and is righted by the descent loop as the panel
          arrives, so it settles with you rather than already being level. */}
      {/* At rest the letters form a staircase — E on the top line, each
          following letter one line lower and one letter further right, with
          the final E already sitting where the whole word will end up. The
          descent loop drives --t from 0 to 1 and they fall to its level. */}
      <h2 className="ground__heading" ref={headingRef}>
        <span className="sr-only">Experience</span>
        {'Experience'.split('').map((ch, i, all) => (
          <span
            key={i}
            className="ground__letter"
            aria-hidden="true"
            /* How many lines above its final resting place this letter
               starts. The last letter is 0 — already where the word ends
               up — and every earlier letter is one line higher again. */
            style={
              {
                '--rise': all.length - 1 - i,
                '--i': i,
              } as React.CSSProperties
            }
          >
            {ch}
          </span>
        ))}
      </h2>

      <div className="ground__stack">
        {SECTIONS.map((s) => (
          <SectionCard
            key={s.key}
            section={s}
            sending={openKey === s.key}
            onOpen={() => {
              setClosing(false)
              setOpenKey(s.key)
            }}
            // Block body, not a concise arrow. React 19 treats a value
            // returned from a ref callback as a cleanup function, and
            // Map.set returns the Map.
            titleRef={(el) => {
              titleRefs.current.set(s.key, el)
            }}
          />
        ))}
      </div>

      <SectionOverlay
        section={open}
        originRef={originRef}
        closing={closing}
        onClose={requestClose}
        onClosed={finishClose}
        reducedMotion={reducedMotion}
      />
    </div>
  )
}
