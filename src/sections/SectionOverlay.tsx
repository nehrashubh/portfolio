import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { MOTION, type Section } from '../theme'
import { flipScale, flipTransform } from '../lib/flip'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { SECTION_REGISTRY } from './registry'
import './overlay.css'

interface Props {
  section: Section | null
  /** The thing inside the section the URL asked for, if any. */
  item?: string
  /** Ask to close. The overlay then plays its exit and calls onClosed. */
  onClose: () => void
  /** True once the exit is running; the overlay stays mounted until it ends. */
  closing?: boolean
  /** Fired when the exit has finished and the overlay may unmount. */
  onClosed?: () => void
  reducedMotion: boolean
  /** The card title this overlay's title flies out of and back into. */
  originRef?: RefObject<HTMLElement | null>
}

/**
 * Height of the band the title and cross occupy, published to the section as
 * --overlay-chrome so it can pad its own top and keep clear of them.
 */
const CHROME = 'calc(3.4vh + 70px)'

function fontPx(el: Element): number {
  return parseFloat(getComputedStyle(el).fontSize) || 1
}

export function SectionOverlay({
  section,
  item,
  onClose,
  closing = false,
  onClosed,
  reducedMotion,
  originRef,
}: Props) {
  const titleRef = useRef<HTMLParagraphElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Entrance: the title travels out of the card it came from. Measured before
  // paint so there is no frame where it sits at its destination.
  useLayoutEffect(() => {
    if (!section || closing || reducedMotion) return
    const title = titleRef.current
    const origin = originRef?.current
    if (!title || !origin) return

    const from = origin.getBoundingClientRect()
    const to = title.getBoundingClientRect()
    const scale = flipScale(fontPx(origin), fontPx(title))

    title.style.transition = 'none'
    title.style.transformOrigin = 'top left'
    title.style.transform = flipTransform(from, to, scale)
    // Colour travels with the title. Without this it is the section's ink from
    // the first frame, so a dark section's title arrives already light.
    title.style.color = getComputedStyle(origin).color
    void title.getBoundingClientRect()

    const raf = requestAnimationFrame(() => {
      title.style.transition =
        `transform ${MOTION.openMs}ms ${MOTION.ease}, color ${MOTION.openMs}ms ease`
      title.style.transform = ''
      title.style.color = '' // back to the section's --ink
    })
    return () => cancelAnimationFrame(raf)
  }, [section, closing, reducedMotion, originRef])

  // Exit: everything fades out while the title travels back down into the row
  // it came from. The overlay stays mounted until that finishes.
  useLayoutEffect(() => {
    if (!closing || !section) return

    if (reducedMotion) {
      onClosed?.()
      return
    }

    const title = titleRef.current
    const origin = originRef?.current
    if (title && origin) {
      const to = origin.getBoundingClientRect()
      const now = title.getBoundingClientRect()
      const scale = flipScale(fontPx(origin), fontPx(title))
      title.style.transition =
        `transform ${MOTION.closeMs}ms ${MOTION.ease}, color ${MOTION.closeMs}ms ease`
      title.style.transformOrigin = 'top left'
      title.style.transform = flipTransform(to, now, scale)
      // …and back again, so it does not land on the card still wearing the
      // section's ink.
      title.style.color = getComputedStyle(origin).color
    }

    const timer = window.setTimeout(() => onClosed?.(), MOTION.closeMs)
    return () => window.clearTimeout(timer)
  }, [closing, section, reducedMotion, onClosed, originRef])

  // Keys, scroll lock and focus.
  //
  // Escape is heard on window. A section's own dialog (the writeup reader,
  // an open project card) listens on document and preventDefaults the Escape
  // it consumed — and document fires before window — so an inner dialog
  // always wins and one keypress never closes two things.
  useEffect(() => {
    if (!section) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose()
    }
    window.addEventListener('keydown', onKey)

    // The root only — never body. With html's overflow no longer visible,
    // overflow:hidden on body turns body into its own scroll container, and
    // the landing's sticky scene (panels and all) re-anchors to the top of
    // the document, thousands of pixels above the viewport. The page behind
    // the section then showed nothing but the body colour: a white flash on
    // open, and a white screen for the whole of the close.
    const root = document.documentElement
    const prevHtml = root.style.overflow
    root.style.overflow = 'hidden'

    // Focus lands on the cross, and goes back to the card the section came
    // from when it closes, so a keyboard user returns to where they left.
    const origin = originRef?.current?.closest('button') ?? null
    closeRef.current?.focus({ preventScroll: true })

    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = prevHtml
      origin?.focus({ preventScroll: true })
    }
  }, [section, onClose, originRef])

  // Once the cascade has fully covered the landing, tell it to stand down:
  // the descent loop and thirty petals have nothing to show for a viewport
  // the section owns. Cleared the moment closing starts, since the exit
  // reveals the cards underneath.
  useEffect(() => {
    if (!section || closing) return
    const t = window.setTimeout(
      () => document.documentElement.setAttribute('data-section-open', ''),
      reducedMotion ? 0 : MOTION.veilGradeMs,
    )
    return () => {
      window.clearTimeout(t)
      document.documentElement.removeAttribute('data-section-open')
    }
  }, [section, closing, reducedMotion])

  if (!section) return null

  const SectionBody = SECTION_REGISTRY[section.key].Component

  /**
   * Portalled to <body> deliberately. A modal belongs at the document root,
   * and this one is position:fixed inside a subtree where the descent column
   * already carries a transform — any transformed or filtered ancestor
   * captures position:fixed and would anchor it to that ancestor instead of
   * the viewport. Rendering at the root makes it immune to that.
   */
  return createPortal(
    <div
      className={`overlay${closing ? ' overlay--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={section.title}
      style={
        {
          '--veil': section.veil,
          '--ink': section.ink,
          '--open-ms': `${MOTION.openMs}ms`,
          '--close-ms': `${MOTION.closeMs}ms`,
          '--grade-ms': `${MOTION.veilGradeMs}ms`,
          '--cross-ms': `${MOTION.crossMs}ms`,
          '--ease': MOTION.ease,
          '--overlay-chrome': CHROME,
        } as CSSProperties
      }
    >
      <div className="overlay__ground" aria-hidden="true" />
      <div className="overlay__veil" aria-hidden="true" />

      {/* The section owns the whole viewport; the chrome floats over it. */}
      <div className="overlay__mount">
        <ErrorBoundary
          fallback={
            <p className="overlay__placeholder">
              {section.title} could not be opened. Reload the page to try again.
            </p>
          }
        >
          <Suspense fallback={<p className="overlay__placeholder">Opening…</p>}>
            <SectionBody reducedMotion={reducedMotion} item={item} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <p className="overlay__title" ref={titleRef}>
        {section.title}
      </p>

      <button
        ref={closeRef}
        type="button"
        className="overlay__close"
        aria-label={`Close ${section.title}`}
        onClick={onClose}
      />
    </div>,
    document.body,
  )
}
