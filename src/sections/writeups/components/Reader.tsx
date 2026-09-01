import { useCallback, useEffect, useRef, useState } from 'react'
import type { Writeup, GlossaryEntry } from '../types'
import { bodyFor } from '../data/writeups'
import { readableOnDark } from '../lib/color'
import Markdown from './Markdown'
import Tooltip from './Tooltip'
import Book from './Book'
import './reader.css'

interface Props {
  writeup: Writeup
  glossary: Record<string, GlossaryEntry>
  onClose: () => void
  onOpenWriteup: (slug: string) => void
}

const SOURCE_LABEL: Record<string, string> = { htb: 'Hack The Box', ctf: 'CTF', practice: 'Practice' }

const EXIT_MS = 240

export default function Reader({ writeup, glossary, onClose, onOpenWriteup }: Props) {
  const [gloss, setGloss] = useState<{ slug: string; rect: DOMRect } | null>(null)
  const [closing, setClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Play the exit animation, then unmount. Reduced motion closes immediately.
  const requestClose = useCallback(() => {
    if (timer.current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onClose()
      return
    }
    setClosing(true)
    setGloss(null)
    timer.current = setTimeout(onClose, EXIT_MS)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Consumed here, so the section overlay (listening on window, which
      // fires after document) leaves the section itself open.
      e.preventDefault()
      requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [requestClose])

  const entry = gloss ? glossary[gloss.slug] : null
  const accent = readableOnDark(writeup.color)

  return (
    <div
      className="reader"
      data-closing={closing || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={writeup.title}
    >
      <div className="reader__scrim" onClick={requestClose} />
      <article
        className="reader__panel"
        style={{ '--cat': writeup.color, '--accent': accent } as React.CSSProperties}
      >
        <button type="button" className="reader__close" onClick={requestClose} aria-label="Close writeup">
          ×
        </button>

        <header className="reader__head">
          <div className="reader__spine" aria-hidden="true">
            <Book writeup={writeup} size={92} />
          </div>
          <div className="reader__meta">
            <div className="reader__eyebrow">
              <span className="reader__cat" style={{ color: accent }}>
                {writeup.categoryLabel}
              </span>
              <span className="reader__dot">·</span>
              <span>{writeup.difficulty}</span>
              <span className="reader__dot">·</span>
              <span>{SOURCE_LABEL[writeup.source] ?? writeup.source}</span>
            </div>
            <h2 className="reader__title">{writeup.title}</h2>
            <div className="reader__tags">
              <time>{writeup.date}</time>
              {writeup.tags.map((t) => (
                <span key={t} className="reader__tag">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="reader__body">
          <Markdown
            markdown={bodyFor(writeup.slug)}
            onGlossHover={(slug, rect) => setGloss(slug && rect ? { slug, rect } : null)}
            onOpenWriteup={onOpenWriteup}
          />
        </div>
      </article>

      {entry && gloss && (
        <Tooltip anchor={gloss.rect}>
          <div className="mc-tooltip__title">{entry.term}</div>
          {entry.category && <div className="mc-tooltip__ench">{entry.category}</div>}
          <div className="mc-tooltip__lore mc-tooltip__def">{entry.definition}</div>
        </Tooltip>
      )}
    </div>
  )
}
