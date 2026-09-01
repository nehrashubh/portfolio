import { useEffect, useMemo, useRef } from 'react'
import { makePetals } from '../lib/petals'
import { gust } from '../lib/wind'
import './petals.css'

interface Props {
  count: number
  reducedMotion: boolean
}

/**
 * Three silhouettes, drawn in a 0–20 box. A cherry petal is a rounded wedge
 * with a notched tip, not a lozenge — the notch is what makes it read as
 * blossom rather than confetti. The variants differ in how far they curl,
 * so a field of them does not look stamped from one die.
 */
const SHAPES = [
  'M10 0.6 C15.4 4 18.6 9 17.2 14.2 C16.2 18 13 19.8 10 17.6 C7 19.8 3.8 18 2.8 14.2 C1.4 9 4.6 4 10 0.6 Z',
  'M10 1 C16 4.6 19 10.4 16.4 15 C14.8 17.8 11.6 18.4 10 16.2 C8.2 18.6 5 18 3.4 15 C1 10.4 4.4 5 10 1 Z',
  'M10 0.8 C13.8 3.4 18.4 8.6 17.6 13.6 C17 17.4 13.4 20 10 17 C6.6 20 3 17.4 2.4 13.6 C1.6 8.6 6.2 3.4 10 0.8 Z',
]

/** Base → tip ramps. Real petals are deeper at the base and translucent at the tip. */
const RAMPS = [
  ['#e07fa2', '#fbdde8'],
  ['#d96f96', '#f7c8d8'],
  ['#e8a0ba', '#fdeaf1'],
]

export function PetalField({ count, reducedMotion }: Props) {
  const petals = useMemo(
    () => (reducedMotion ? [] : makePetals(count, Math.random)),
    [count, reducedMotion],
  )
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    const tick = (t: number) => {
      const el = fieldRef.current
      if (el) {
        // The whole field leans on the gust; each petal keeps its own drift.
        el.style.transform = `translate3d(${(gust(t) * 2.4).toFixed(2)}%, 0, 0)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  if (reducedMotion) return <div className="petals" aria-hidden="true" />

  return (
    <div className="petals" ref={fieldRef} aria-hidden="true">
      {/* Gradients are defined once and referenced by every petal. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          {RAMPS.map(([base, tip], i) => (
            <linearGradient key={i} id={`petal-ramp-${i}`} x1="0.5" y1="1" x2="0.4" y2="0">
              <stop offset="0%" stopColor={base} />
              <stop offset="100%" stopColor={tip} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {petals.map((p, i) => (
        <svg
          key={i}
          className="petal"
          viewBox="0 0 20 20"
          style={
            {
              width: `${p.width.toFixed(1)}px`,
              height: `${p.height.toFixed(1)}px`,
              left: `${p.left.toFixed(2)}%`,
              top: `${p.top.toFixed(2)}%`,
              opacity: p.opacity.toFixed(2),
              filter: p.blurPx ? `blur(${p.blurPx.toFixed(1)}px)` : undefined,
              animationDuration: `${p.durationS.toFixed(1)}s`,
              animationDelay: `${p.delayS.toFixed(1)}s`,
              '--dx': `${p.driftPx.toFixed(0)}px`,
              '--spin': `${p.spinDeg.toFixed(0)}deg`,
            } as React.CSSProperties
          }
        >
          <path d={SHAPES[p.shape]} fill={`url(#petal-ramp-${p.ramp})`} />
          {/* One faint vein down the middle, the detail that stops it
              reading as a flat cut-out shape. */}
          <path
            d="M10 3.5 C10.6 8 10.6 12.5 10 16.4"
            stroke="rgba(255,255,255,.5)"
            strokeWidth="0.7"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  )
}
