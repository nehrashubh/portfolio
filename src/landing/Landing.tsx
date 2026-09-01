import { useEffect, useRef } from 'react'
import { progressAt, columnOffsetVh } from '../lib/descent'
import { gust } from '../lib/wind'
import { useReducedMotion } from '../shared/useReducedMotion'
import { Hero } from './Hero'
import { About } from './About'
import { Ground } from './Ground'
import { Footer } from './Footer'
import { PetalField } from './PetalField'
import './landing.css'

/** How far the scene travels across the track. The panels travel 340vh, so
 *  the gap between the two is the parallax that gives the descent depth. */
const COLUMN_TRAVEL_VH = 170

/** Share of the heading's window spent handing off from letter to letter.
 *  Zero: the whole staircase drops as one, so the full word is readable
 *  right up until it moves. */
const STAGGER = 0

/** Rise per step of the staircase. Nine steps, so this multiplies up fast —
 *  0.92em put the first letter clean off the top of the screen and only the
 *  last few were ever visible. 0.62 is the most that still fits. */
const LINE_EM = 0.62

/*
 * There is deliberately no smoothing here.
 *
 * A damped follow was tried — every frame chasing a lagged copy of the
 * scroll position instead of reading it straight — and it made two things
 * worse at once: ordinary scrolling felt delayed (anything driven by the
 * lagged value visibly trailed the real scroll position), and a fast settle
 * could move less than a pixel some frames, which a rounded transform
 * collapsed into the same integer for a couple dozen consecutive frames
 * before jumping — a stutter with no dropped frames behind it at all.
 *
 * The content panels are normal in-flow content, so they ride native scroll
 * directly — zero lag, and whatever smoothing the OS already applies to the
 * wheel. Only the background scene (the sky/ground column, the branch, the
 * hero copy's fade, the heading's fall) is computed from scroll position
 * each frame, straight, with no easing applied.
 */

export function Landing() {
  const reducedMotion = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const branchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) return

    let raf = 0

    // offsetTop and offsetHeight force layout, so they are measured here and
    // on resize rather than every frame — reading them inside the loop is
    // layout thrashing.
    let trackTop = 0
    let scrollable = 0
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      trackTop = track.offsetTop
      scrollable = track.offsetHeight - window.innerHeight
    }
    measure()
    window.addEventListener('resize', measure)

    const tick = (t: number) => {
      // A section owns the viewport; the landing is hidden under it and has
      // nothing to show for the work. Keep the loop alive, skip the frame.
      if (document.documentElement.hasAttribute('data-section-open')) {
        raf = requestAnimationFrame(tick)
        return
      }
      const p = progressAt(window.scrollY - trackTop, scrollable)

      // The branch swings on the same gust the petals read, anchored at the
      // corner it enters from so the tip travels and the base barely moves.
      const branch = branchRef.current
      if (branch) {
        const w = gust(t)
        branch.style.transform =
          `rotate(${(w * 0.85).toFixed(3)}deg) translate3d(${(w * 9).toFixed(2)}px, 0, 0)`
      }

      const col = columnRef.current
      if (col) {
        // Rounded to whole pixels on purpose. A fractional offset puts every
        // layer boundary on a half pixel, and the browser antialiases across
        // it — which draws a faint one-pixel line wherever two layers meet,
        // however exactly their colours are matched.
        const y = columnOffsetVh(p, COLUMN_TRAVEL_VH)
        const px = Math.round((y / 100) * window.innerHeight)
        col.style.transform = `translate3d(0, ${px}px, 0)`
      }

      // The hero copy is drawn upward out of frame as you fall past it.
      // Anchored at the top, so it lengthens from there rather than scaling
      // about its middle — it reads as being pulled away above you.
      const hero = heroRef.current
      if (hero) {
        const h = Math.min(1, p / 0.3) // spent by the time the cloud arrives
        hero.style.transform =
          `translate3d(0, ${(-h * 26).toFixed(2)}vh, 0) scaleY(${(1 + h * 0.85).toFixed(4)})`
        hero.style.opacity = (1 - h * 0.92).toFixed(3)
      }

      // The staircase falls to level as the heading rises into the frame.
      // Driven by the heading's own on-screen position rather than a scroll
      // fraction: a fixed fraction of the track was tuned against one screen
      // height and drifted on any other — on a tall viewport the cards panel
      // is a much smaller fraction of the scroll, so all four cards were
      // already on screen while the fraction-based window hadn't opened yet.
      // Reading getBoundingClientRect each frame costs one layout read,
      // which the rest of the loop already forces via window.scrollY's
      // neighbours — it does not add a second one.
      const heading = headingRef.current
      if (heading) {
        const vh = window.innerHeight
        const rect = heading.getBoundingClientRect()
        // 0 while the heading is still low enough to be entering from below
        // the frame, 1 once it has risen into the upper third — leaving room
        // under it, on any screen, for the cards to already be in view too.
        const enterAt = vh * 0.95
        const settleAt = vh * 0.32
        const k = Math.min(1, Math.max(0, (enterAt - rect.top) / (enterAt - settleAt)))
        const letters = heading.querySelectorAll<HTMLElement>('.ground__letter')
        const last = letters.length - 1
        for (let i = 0; i < letters.length; i++) {
          const start = (i / last) * STAGGER
          const lt = Math.min(1, Math.max(0, (k - start) / (1 - STAGGER)))
          const eased = 1 - Math.pow(1 - lt, 3)
          const rise = last - i // lines above its resting place
          letters[i].style.transform =
            `translateY(${(-rise * (1 - eased) * LINE_EM).toFixed(3)}em)`
          letters[i].style.opacity = (1 - (rise / last) * (1 - eased) * 0.72).toFixed(3)
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [reducedMotion])

  return (
    <>
      <div className="descent" ref={trackRef}>
        {/* The scene: one continuous place you travel down. */}
        <div className="descent__viewport">
          <div className="descent__column" ref={columnRef}>
            <div className="descent__layer descent__layer--sky" />
            <div className="descent__branch" ref={branchRef} aria-hidden="true" />
            <div className="descent__layer descent__layer--ground" />
          </div>
          {/* One weather system for the whole descent, not one per panel. */}
          <PetalField count={30} reducedMotion={reducedMotion} />
        </div>

        {/* Content rides over the scene, scrolling at the page's own rate. */}
        <div className="descent__panels">
          <section className="descent__panel descent__panel--hero">
            <Hero progressRef={heroRef} />
          </section>
          <section className="descent__panel descent__panel--about">
            <About />
          </section>
          <section className="descent__panel descent__panel--cards">
            <Ground reducedMotion={reducedMotion} headingRef={headingRef} />
          </section>
        </div>
      </div>

      {/* Below the track, in normal flow — the meadow scrolls away as the
          sticky viewport un-sticks, and the footer follows right behind it. */}
      <Footer />
    </>
  )
}
