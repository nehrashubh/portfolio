import { useEffect, useState } from 'react'

/**
 * True for `windowMs` after `key` changes (and on first mount).
 *
 * This is deliberately keyed on *transitions* rather than on a state being
 * held. A piece that is hovered has a spring that settles in a few hundred
 * milliseconds; keeping the render loop awake for as long as the pointer
 * happens to rest on it burns GPU indefinitely on a still image.
 */
export function useRecentChange(key: string, windowMs: number): boolean {
  const [recent, setRecent] = useState(true)

  useEffect(() => {
    setRecent(true)
    const timer = setTimeout(() => setRecent(false), windowMs)
    return () => clearTimeout(timer)
  }, [key, windowMs])

  return recent
}

/**
 * True while the pointer is moving, going false `idleMs` after it stops.
 *
 * A selected piece turns to follow the cursor, so those frames have to keep
 * rendering — but only while the cursor is actually moving. Re-setting the
 * same value is a no-op in React, so a moving pointer does not re-render on
 * every event; only the two transitions do.
 */
export function usePointerActivity(idleMs: number): boolean {
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const handleMove = () => {
      setMoving(true)
      clearTimeout(timer)
      timer = setTimeout(() => setMoving(false), idleMs)
    }
    window.addEventListener('pointermove', handleMove)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      clearTimeout(timer)
    }
  }, [idleMs])

  return moving
}
