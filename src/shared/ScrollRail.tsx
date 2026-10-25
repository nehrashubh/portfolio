import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import './scrollRail.css'

/**
 * The site's own scrollbar, in place of the browser's.
 *
 * The browser's bar shows where the PAGE is. Everywhere it matters here, what
 * you see trails the page on purpose (the landing glides, the flight eases),
 * so that bar ran ahead of the picture. This one shows what is on screen: its
 * owner feeds it the smoothed position, frame by frame.
 *
 * Drag the thumb, or press the track, and it asks the owner to go there. The
 * thumb follows the pointer while held, and once let go it waits where it was
 * dropped until the view arrives, rather than jumping back to where the view
 * still is and gliding forward again.
 *
 * Hidden from assistive tech: it duplicates the scrolling underneath, which
 * still answers to the wheel, touch and the keyboard exactly as it always did.
 */
export type ScrollRailHandle = {
  /** What is on screen, 0 at the start to 1 at the end. */
  setProgress: (progress: number) => void
  /** How much of the whole fits on screen at once. Sets the thumb's length;
   *  at 1 there is nothing to scroll and the rail hides. */
  setVisibleFraction: (fraction: number) => void
}

type Props = {
  /** Go to this point, 0 to 1: a drag of the thumb or a press on the track. */
  onSeek: (progress: number) => void
  className?: string
}

/** Short enough to never crowd the track, long enough to take hold of. */
const MIN_THUMB_PX = 32
/** After a drag, how close the view must come before the thumb follows it. */
const CAUGHT_UP = 0.004
/** ...or how long it waits, in case the view went somewhere else instead. */
const WAIT_MS = 1200

type RailState = {
  track: number
  fraction: number
  progress: number
  size: number
  scrolls: boolean | null
  held: boolean
  waitUntil: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function place(rail: HTMLElement | null, thumb: HTMLElement | null, s: RailState) {
  if (!rail || !thumb) return
  const scrolls = s.fraction < 1
  if (scrolls !== s.scrolls) {
    s.scrolls = scrolls
    rail.toggleAttribute('data-idle', !scrolls)
  }
  const size = Math.min(s.track, Math.max(MIN_THUMB_PX, s.track * s.fraction))
  if (size !== s.size) {
    s.size = size
    thumb.style.height = `${size}px`
  }
  thumb.style.transform = `translate3d(0, ${(s.progress * (s.track - size)).toFixed(1)}px, 0)`
}

export const ScrollRail = forwardRef<ScrollRailHandle, Props>(function ScrollRail(
  { onSeek, className },
  ref,
) {
  const railRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const state = useRef<RailState>({
    track: 0,
    fraction: 1,
    progress: 0,
    size: -1,
    scrolls: null,
    held: false,
    waitUntil: 0,
  })
  const seek = useRef(onSeek)
  useEffect(() => {
    seek.current = onSeek
  }, [onSeek])

  useImperativeHandle(ref, () => ({
    setProgress(progress) {
      const s = state.current
      const p = clamp01(progress)
      if (s.held) return
      if (s.waitUntil) {
        if (Math.abs(p - s.progress) > CAUGHT_UP && performance.now() < s.waitUntil) return
        s.waitUntil = 0
      }
      if (p === s.progress) return
      s.progress = p
      place(railRef.current, thumbRef.current, s)
    },
    setVisibleFraction(fraction) {
      const s = state.current
      const f = clamp01(fraction)
      if (f === s.fraction) return
      s.fraction = f
      place(railRef.current, thumbRef.current, s)
    },
  }))

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const observer = new ResizeObserver(([entry]) => {
      state.current.track = entry.contentRect.height
      place(rail, thumbRef.current, state.current)
    })
    observer.observe(rail)
    return () => observer.disconnect()
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    const s = state.current
    const travel = s.track - s.size
    if (!rail || e.button !== 0 || travel <= 0) return
    e.preventDefault()
    rail.setPointerCapture(e.pointerId)
    const top = rail.getBoundingClientRect().top
    // Taken by the thumb, it keeps the grip where it was taken. A press on
    // the track brings the thumb's middle to the pointer.
    const onThumb = e.target === thumbRef.current
    const grip = onThumb ? e.clientY - top - s.progress * travel : s.size / 2
    const moveTo = (y: number) => {
      s.progress = clamp01((y - top - grip) / travel)
      place(rail, thumbRef.current, s)
      seek.current(s.progress)
    }
    const onMove = (ev: PointerEvent) => moveTo(ev.clientY)
    const onUp = () => {
      s.held = false
      s.waitUntil = performance.now() + WAIT_MS
      rail.removeAttribute('data-held')
      rail.removeEventListener('pointermove', onMove)
      rail.removeEventListener('pointerup', onUp)
      rail.removeEventListener('pointercancel', onUp)
    }
    s.held = true
    rail.setAttribute('data-held', '')
    if (!onThumb) moveTo(e.clientY)
    rail.addEventListener('pointermove', onMove)
    rail.addEventListener('pointerup', onUp)
    rail.addEventListener('pointercancel', onUp)
  }

  return (
    <div
      ref={railRef}
      className={`scroll-rail${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-idle=""
      onPointerDown={onPointerDown}
    >
      <div ref={thumbRef} className="scroll-rail__thumb" />
    </div>
  )
})

/**
 * A rail for an element that scrolls on its own, with no glide: it reads the
 * element's scrollTop directly and lies over the element's right edge.
 *
 * The element is the scroller, so the rail cannot live inside it, where it
 * would scroll away with the text. It is a sibling instead, placed from the
 * element's layout box, which ignores whatever transform an entrance is
 * animating, so the two line up from the first frame to the last.
 */
export function ElementRail({ target }: { target: RefObject<HTMLElement | null> }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<ScrollRailHandle>(null)

  useEffect(() => {
    const el = target.current
    const box = boxRef.current
    if (!el || !box) return
    const range = () => el.scrollHeight - el.clientHeight
    const update = () => railRef.current?.setProgress(range() > 0 ? el.scrollTop / range() : 0)
    const layout = () => {
      box.style.top = `${el.offsetTop}px`
      box.style.left = `${el.offsetLeft}px`
      box.style.width = `${el.offsetWidth}px`
      box.style.height = `${el.offsetHeight}px`
      railRef.current?.setVisibleFraction(el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1)
      update()
    }
    // The element's own box, and its content, which can grow as images and
    // fonts arrive without the element itself changing size.
    const observer = new ResizeObserver(layout)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    el.addEventListener('scroll', update, { passive: true })
    layout()
    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', update)
    }
  }, [target])

  const seek = (progress: number) => {
    const el = target.current
    el?.scrollTo({ top: progress * (el.scrollHeight - el.clientHeight) })
  }

  return (
    <div ref={boxRef} className="element-rail">
      <ScrollRail ref={railRef} onSeek={seek} className="scroll-rail--inset" />
    </div>
  )
}
