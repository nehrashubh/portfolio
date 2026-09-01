import { useEffect, useRef, useState } from 'react'

export type SwapPhase = 'idle' | 'out' | 'in'

/**
 * Defers a content change so the outgoing content can animate away first.
 *
 * `shown` lags `value` by `outMs`, which is what makes a crossfade possible at
 * all: without the delay the old content is gone before it can fade, and any
 * "transition" is really just the new content appearing. Phases are reported
 * so the caller can drive the two halves from CSS.
 *
 * Both durations at zero means no transition, for reduced motion.
 */
export function useContentSwap<T>(
  value: T,
  outMs: number,
  inMs: number,
): { shown: T; phase: SwapPhase } {
  const [shown, setShown] = useState(value)
  const [phase, setPhase] = useState<SwapPhase>('idle')
  const instant = outMs === 0 && inMs === 0
  // Read when the swap lands, so a selection changed mid-transition still
  // resolves to the newest value rather than the one that started it.
  const latest = useRef(value)
  latest.current = value

  useEffect(() => {
    if (instant) {
      if (!Object.is(shown, value)) setShown(value)
      if (phase !== 'idle') setPhase('idle')
      return
    }

    if (phase === 'out') {
      // Selecting the already-shown item again: nothing to swap to, so fade
      // back in rather than sitting invisible.
      if (Object.is(value, shown)) {
        setPhase('in')
        return
      }
      const timer = setTimeout(() => {
        setShown(latest.current)
        setPhase('in')
      }, outMs)
      return () => clearTimeout(timer)
    }

    if (phase === 'in') {
      if (!Object.is(value, shown)) {
        setPhase('out')
        return
      }
      const timer = setTimeout(() => setPhase('idle'), inMs)
      return () => clearTimeout(timer)
    }

    if (!Object.is(value, shown)) setPhase('out')
  }, [value, shown, phase, outMs, inMs, instant])

  return instant ? { shown: value, phase: 'idle' } : { shown, phase }
}
