import { useRef } from 'react'
import type { Writeup } from '../types'
import './book.css'

/** How long a finger must rest on a book before it shows its card. */
const HOLD_MS = 350

interface Props {
  writeup: Writeup
  size?: number
  onOpen?: (w: Writeup) => void
  onHover?: (w: Writeup | null, rect: DOMRect | null) => void
}

// A dyed Minecraft book. The colour is composited exactly as the game does it:
// the vanilla base sits underneath, and the pack's grayscale overlay is
// multiplied by the category colour on top (C × overlay/255). Because the
// overlay is pure gray, CSS `multiply` reproduces the tint precisely rather
// than approximating it. See scripts/sync-writeups.mjs for the palette.
export default function Book({ writeup, size = 72, onOpen, onHover }: Props) {
  const base = writeup.sprite === 'writable_book' ? 'writable_book' : 'written_book'
  const overlay = `/books/${base}_overlay.png`
  const canOpen = writeup.openable

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // True once a hold has actually shown the card, so the tap that ends it
  // peeks rather than opens.
  const peeked = useRef(false)
  // A touch synthesises mouseenter a moment later; without this a plain tap
  // would raise the hover card on a phone as well as opening the reader.
  const touching = useRef(false)

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  const startHold = (rect: DOMRect) => {
    peeked.current = false
    cancelHold()
    holdTimer.current = setTimeout(() => {
      peeked.current = true
      onHover?.(writeup, rect)
    }, HOLD_MS)
  }

  const endHold = () => {
    cancelHold()
    // The peek lasts as long as the finger does.
    if (peeked.current) onHover?.(null, null)
    setTimeout(() => {
      touching.current = false
    }, 500)
  }

  return (
    <button
      type="button"
      className="book"
      data-open={canOpen || undefined}
      data-progress={writeup.status === 'in-progress' || undefined}
      style={{ '--size': `${size}px`, '--cat': writeup.color } as React.CSSProperties}
      aria-label={`${writeup.title} — ${writeup.categoryLabel}, ${writeup.difficulty}, ${writeup.status}${
        canOpen ? '' : ' (not yet written)'
      }`}
      onClick={() => {
        // A hold is a peek, not an open.
        if (peeked.current) {
          peeked.current = false
          return
        }
        if (canOpen) onOpen?.(writeup)
      }}
      onTouchStart={(e) => {
        touching.current = true
        startHold(e.currentTarget.getBoundingClientRect())
      }}
      onTouchMove={cancelHold}
      onTouchEnd={endHold}
      onTouchCancel={endHold}
      onContextMenu={(e) => {
        // Android raises its own menu on a long press; this one is ours.
        if (touching.current) e.preventDefault()
      }}
      onMouseEnter={(e) =>
        !touching.current && onHover?.(writeup, e.currentTarget.getBoundingClientRect())
      }
      onMouseMove={(e) =>
        !touching.current && onHover?.(writeup, e.currentTarget.getBoundingClientRect())
      }
      onMouseLeave={() => !touching.current && onHover?.(null, null)}
      onFocus={(e) => onHover?.(writeup, e.currentTarget.getBoundingClientRect())}
      onBlur={() => onHover?.(null, null)}
    >
      <span className="book__sprite" aria-hidden="true">
        <img className="book__base" src={`/books/${base}.png`} alt="" draggable={false} />
        <span className="book__tint">
          <span className="book__fill" style={{ maskImage: `url(${overlay})`, WebkitMaskImage: `url(${overlay})` }} />
          <span
            className="book__shade"
            style={{
              backgroundImage: `url(${overlay})`,
              maskImage: `url(${overlay})`,
              WebkitMaskImage: `url(${overlay})`,
            }}
          />
        </span>
      </span>
    </button>
  )
}
