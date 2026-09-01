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
export function useScrollFlight(containerRef: RefObject<HTMLElement | null>): RefObject<number> {
  const progressRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      progressRef.current = scrollProgress(el.scrollTop, el.scrollHeight, el.clientHeight)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [containerRef])

  return progressRef
}
