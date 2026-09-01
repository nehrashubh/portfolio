import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './tooltip.css'

interface Props {
  /** Anchor rectangle in viewport coords (from getBoundingClientRect). */
  anchor: DOMRect
  children: ReactNode
}

// A Minecraft item tooltip: dark panel, purple double border. Positioned above
// the anchor by default, flipping below and clamping horizontally so it never
// leaves the viewport.
export default function Tooltip({ anchor, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const margin = 10
    let left = anchor.left + anchor.width / 2 - width / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
    let top = anchor.top - height - 12
    if (top < margin) top = anchor.bottom + 12 // flip below
    setPos({ left, top })
  }, [anchor])

  return (
    <div
      ref={ref}
      className="mc-tooltip"
      role="tooltip"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
    >
      {children}
    </div>
  )
}
