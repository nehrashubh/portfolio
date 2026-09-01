import { useEffect, useRef } from 'react'

export type NormalizedPointer = { x: number; y: number }

/**
 * Tracks the cursor anywhere on the page (not just over the canvas) as
 * normalized -1..1 coordinates, in a ref rather than state so it doesn't
 * trigger a React re-render on every mouse move.
 */
export function usePointerNormalized() {
  const pointerRef = useRef<NormalizedPointer>({ x: 0, y: 0 })

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
      }
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  return pointerRef
}
