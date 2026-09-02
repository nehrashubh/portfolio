import { useEffect, useRef } from 'react'
import { progressAt, columnOffsetPx, damp } from '../lib/descent'
import { gust } from '../lib/wind'
import { useReducedMotion } from '../shared/useReducedMotion'
import { Hero } from './Hero'
import { About } from './About'
import { Ground } from './Ground'
import { Footer } from './Footer'
import { PetalField } from './PetalField'
import './landing.css'

/** How far the scene travels across the track. The panels travel 440vh, so
 *  the gap between the two is the parallax that gives the descent depth. */
const COLUMN_TRAVEL_VH = 220


/** How hard the scene resists the scroll. This is the lambda of an
 *  exponential decay, so 1/DAMPING is roughly the time in seconds to cover
 *  63% of the remaining distance. Lower is heavier. */
const DAMPING = 1.0

/** Ceiling on how fast the scene may travel, in progress units per second.
 *  This is what makes a flick of the wheel do almost nothing: the scroll is
 *  accepted in full, but the scene will not chase it faster than this. */
const MAX_SPEED = 0.3

/** Share of the heading's window spent handing off from letter to letter.
 *  The first letter starts highest and falls first; each one after it sets
 *  off a little later, so the word settles as a wave from left to right. */
const STAGGER = 0.6

/** The fall has weight of its own. The scroll only sets where the letters
 *  are headed; they get there on this time constant, so a flick of the wheel
 *  cannot drop the whole word in a quarter of a second. 1/FALL_DAMPING is
 *  roughly the seconds to cover 63% of the remaining distance. */
const FALL_DAMPING = 2.2

/** Rise per step of the staircase. Nine steps, so this multiplies up fast —
 *  0.92em put the first letter clean off the top of the screen and only the
 *  last few were ever visible. 0.62 is the most that still fits. */
const LINE_EM = 0.62

/** Gravity, then a landing: the letter gathers speed and settles without a
 *  bounce. The time damping above adds the long tail. */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/*
 * Everything on screen is driven by ONE damped value.
 *
 * Native scroll still owns the scrollbar, the keyboard and the accessibility
 * tree — the track is a real scrollable element. What is rendered, though, is
 * a damped follow of that scroll position, and both the scene and the content
 * panels read the same damped number. Smoothing one and not the other was
 * tried and read as drift.
 *
 * The panels' transform is written with fractional pixels on purpose. An
 * earlier version rounded it, and a slow settle then moved less than a pixel
 * per frame — which rounding collapsed into the same integer for a couple of
 * dozen frames before jumping: a stutter with no dropped frames behind it.
 * Only the scene column is rounded, where a half-pixel boundary between two
 * plates would draw a hairline.
 */

export function Landing() {
  const reducedMotion = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)
  const branchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) return

    let raf = 0
    let shown = 0 // the damped progress everything reads
    let fall = 0 // the heading's damped fall, 0 scattered → 1 level
    let last = performance.now()

    // offsetTop and offsetHeight force layout, so they are measured here and
    // on resize rather than every frame — reading them inside the loop is
    // layout thrashing.
    let trackTop = 0
    let scrollable = 0
    const measure = () => {
      const track = trackRef.current
      const panels = panelsRef.current
      if (!track || !panels) return
      // The track is exactly as tall as the stacked panels, so the panels'
      // total travel equals the scrollable distance and the footer — however
      // tall its content — ends flush with the bottom of the viewport.
      track.style.height = `${panels.offsetHeight}px`
      trackTop = track.offsetTop
      scrollable = track.offsetHeight - window.innerHeight
    }
    measure()
    window.addEventListener('resize', measure)

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000) // cap after a background tab
      last = t

      // A section owns the viewport; the landing is covered and has nothing
      // to show for the work. Keep the loop alive, skip the frame.
      if (document.documentElement.hasAttribute('data-section-open')) {
        raf = requestAnimationFrame(tick)
        return
      }

      const target = progressAt(window.scrollY - trackTop, scrollable)
      shown = damp(shown, target, DAMPING, dt, MAX_SPEED)
      const p = shown
      const vh = window.innerHeight

      const panels = panelsRef.current
      if (panels) {
        const y = -p * scrollable
        panels.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
      }

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
        // Sub-pixel, like the panels. Rounding this to whole pixels is what
        // made the scene stutter as it eased into the top or the bottom —
        // see columnOffsetPx for the measurement and for why the hairline it
        // used to guard against cannot happen any more.
        const px = columnOffsetPx(p, COLUMN_TRAVEL_VH, vh)
        col.style.transform = `translate3d(0, ${px.toFixed(2)}px, 0)`
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
      // fraction, so it holds on any viewport height. The rect reflects the
      // panels' damped transform, so the fall is as smooth as the descent.
      const heading = headingRef.current
      if (heading) {
        const rect = heading.getBoundingClientRect()
        // Where the fall is headed: 0 while the heading is still entering
        // from below the frame, 1 once it has risen into the upper quarter.
        // The letters chase that target on their own damping, so the word
        // falls at its own pace whatever the wheel does.
        const enterAt = vh * 1.0
        const settleAt = vh * 0.22
        const target = Math.min(1, Math.max(0, (enterAt - rect.top) / (enterAt - settleAt)))
        fall = damp(fall, target, FALL_DAMPING, dt)
        const letters = heading.querySelectorAll<HTMLElement>('.ground__letter')
        const lastIndex = letters.length - 1
        for (let i = 0; i < letters.length; i++) {
          const start = (i / lastIndex) * STAGGER
          const lt = Math.min(1, Math.max(0, (fall - start) / (1 - STAGGER)))
          const eased = easeInOutCubic(lt)
          const rise = lastIndex - i // lines above its resting place
          letters[i].style.transform =
            `translateY(${(-rise * (1 - eased) * LINE_EM).toFixed(3)}em)`
          letters[i].style.opacity = (1 - (rise / lastIndex) * (1 - eased) * 0.72).toFixed(3)
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

        {/* The content, riding the same damped progress as the scene. */}
        <div className="descent__panels" ref={panelsRef}>
          <section className="descent__panel descent__panel--hero">
            <Hero progressRef={heroRef} />
          </section>
          <section className="descent__panel descent__panel--about">
            <About />
          </section>
          <section className="descent__panel descent__panel--cards">
            <Ground reducedMotion={reducedMotion} headingRef={headingRef} />
          </section>
          {/* Inside the damped stack too. Left in normal flow it rode raw
              scroll, so it arrived while the damped panels were still a lag
              behind and appeared before the cards had settled. */}
          <div className="descent__panel descent__panel--footer">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}
