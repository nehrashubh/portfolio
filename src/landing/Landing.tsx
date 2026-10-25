import { useEffect, useRef } from 'react'
import { progressAt, columnOffsetPx, damp } from '../lib/descent'
import { gust } from '../lib/wind'
import { useReducedMotion } from '../shared/useReducedMotion'
import { ScrollRail, type ScrollRailHandle } from '../shared/ScrollRail'
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

/** The glide when the visitor names a place outright: Tab to something off
 *  screen, or a drag of the scrollbar. The descent's own pace takes seconds
 *  to cross the page, which is a long time to look at a focus ring you
 *  cannot see, or to watch a thumb wait for the scene; this arrives in about
 *  half a second. */
const DIRECT_DAMPING = 6

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
  const railRef = useRef<ScrollRailHandle>(null)
  // Where a drag of the scrollbar goes depends on the track's measurements,
  // which live in whichever effect is running; each one sets this.
  const seekRef = useRef<(progress: number) => void>(() => {})

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
      railRef.current?.setVisibleFraction(window.innerHeight / track.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure)

    let pinned = false

    // Tab walks through the cards and the footer, all inside a frame that
    // cannot scroll: what is on screen is the descent's call, so the browser
    // has no way to bring a focused card into view. Move the page to it and
    // let the descent follow, quickly. Tab only: focus handed back by a
    // closing section, or left by a click, is on something already in view.
    let tabbing = false
    let hurry = false
    const onKeyDown = (e: KeyboardEvent) => {
      tabbing = e.key === 'Tab'
    }
    const onPointerDown = () => {
      tabbing = false
    }
    const onFocusIn = (e: FocusEvent) => {
      const panels = panelsRef.current
      const el = e.target
      if (!tabbing || !panels || !(el instanceof Element) || !panels.contains(el)) return
      if (document.documentElement.hasAttribute('data-section-active')) return
      const vh = window.innerHeight
      const rect = el.getBoundingClientRect()
      // Where it sits in the stack, and where the stack is headed: the
      // panels travel exactly as far as the page scrolls.
      const top = rect.top - panels.getBoundingClientRect().top
      const headed = top - (window.scrollY - trackTop)
      const margin = vh * 0.08
      if (headed >= margin && headed + rect.height <= vh - margin) return
      const to = Math.min(scrollable, Math.max(0, top - (vh - rect.height) / 2))
      hurry = true
      window.scrollTo(0, trackTop + to)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('focusin', onFocusIn)

    seekRef.current = (progress) => {
      hurry = true
      window.scrollTo(0, trackTop + progress * scrollable)
    }

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000) // cap after a background tab
      last = t
      const root = document.documentElement

      // A section is opening. Move the page to what is on screen, so the
      // scene has nowhere left to go: it stays exactly where the card was
      // pressed, the title flies home to the row it left, and closing
      // reveals the landing at rest. Once per open; the page cannot scroll
      // again until the section closes.
      if (root.hasAttribute('data-section-active')) {
        if (!pinned) {
          pinned = true
          window.scrollTo(0, trackTop + shown * scrollable)
        }
      } else {
        pinned = false
      }

      // A section owns the viewport; the landing is covered and has nothing
      // to show for the work. Keep the loop alive, skip the frame.
      if (root.hasAttribute('data-section-open')) {
        raf = requestAnimationFrame(tick)
        return
      }

      const target = progressAt(window.scrollY - trackTop, scrollable)
      shown = hurry
        ? damp(shown, target, DIRECT_DAMPING, dt)
        : damp(shown, target, DAMPING, dt, MAX_SPEED)
      if (shown === target) hurry = false
      const p = shown
      railRef.current?.setProgress(p)
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
    const track = trackRef.current
    const hero = heroRef.current
    const heading = headingRef.current
    const written = [panelsRef.current, columnRef.current, branchRef.current, hero]
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('focusin', onFocusIn)
      // Reduced motion can be switched on with the page open. Everything
      // the loop wrote inline would outrank the stylesheet's still layout
      // (the track's height, the panels' offset), so it is all taken back.
      if (track) track.style.height = ''
      for (const el of written) {
        if (el) el.style.transform = ''
      }
      if (hero) hero.style.opacity = ''
      heading?.querySelectorAll<HTMLElement>('.ground__letter').forEach((letter) => {
        letter.style.transform = ''
        letter.style.opacity = ''
      })
    }
  }, [reducedMotion])

  // Reduced motion: no descent and no loop. The page scrolls on its own, so
  // the scrollbar reads the page directly and moves it without a glide.
  useEffect(() => {
    if (!reducedMotion) return
    const root = document.documentElement
    const range = () => root.scrollHeight - window.innerHeight
    const update = () => {
      railRef.current?.setVisibleFraction(window.innerHeight / root.scrollHeight)
      railRef.current?.setProgress(range() > 0 ? window.scrollY / range() : 0)
    }
    seekRef.current = (progress) => window.scrollTo(0, progress * range())
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
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
      <ScrollRail ref={railRef} onSeek={(progress) => seekRef.current(progress)} />
    </>
  )
}
