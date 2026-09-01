import type { Writeup } from '../types'
import './book.css'

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
      onClick={() => canOpen && onOpen?.(writeup)}
      onMouseEnter={(e) => onHover?.(writeup, e.currentTarget.getBoundingClientRect())}
      onMouseMove={(e) => onHover?.(writeup, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onHover?.(null, null)}
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
