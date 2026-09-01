/**
 * The site's single wind value. Petals read it, and so does the branch — that
 * shared source is what makes it read as weather rather than as several
 * unrelated animations.
 *
 * Three sines at deliberately unrelated periods (13s / 7.3s / 3.1s) so the
 * result never returns to a previous value on a short cycle. A single sine
 * ticks like a metronome and the eye catches it within about a minute.
 *
 * Deliberately independent of scroll. Coupling gust strength to scroll speed
 * was tried and removed: it made the weather lurch whenever the descent moved,
 * which read as a glitch rather than as wind.
 */
const A = { period: 13_000, weight: 0.55 }
const B = { period: 7_300, weight: 0.3 }
const C = { period: 3_100, weight: 0.15 }

const TAU = Math.PI * 2

export function gust(timeMs: number): number {
  return (
    Math.sin((timeMs / A.period) * TAU) * A.weight +
    Math.sin((timeMs / B.period) * TAU) * B.weight +
    Math.sin((timeMs / C.period) * TAU) * C.weight
  )
}
