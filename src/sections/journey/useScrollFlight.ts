import { useEffect, useRef, type RefObject } from 'react'
import { scrollProgress } from './scrollFlight'

/**
 * Raw scroll progress of the section's own scroll container, in a ref. The
 * smoothing lives in the camera rig's frame loop, not here — a scroll event
 * only ever records where the wheel is.
 *
 * This replaced GSAP ScrollTrigger. The scene now lives inside a fixed
 * overlay with page scroll locked, so there is no document scroll to pin
 * against; the section scrolls itself instead.
 */
export function useScrollFlight(
  containerRef: RefObject<HTMLElement | null>,
  /** Told whenever the progress may have moved, so an on-demand canvas can
   *  ask for a frame. Pass a stable function: the listeners are rebound when
   *  it changes. */
  onUpdate?: () => void,
): RefObject<number> {
  const progressRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      progressRef.current = scrollProgress(el.scrollTop, el.scrollHeight, el.clientHeight)
      onUpdate?.()
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [containerRef, onUpdate])

  return progressRef
}
