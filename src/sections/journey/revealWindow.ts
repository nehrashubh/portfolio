/**
 * Which stop's text is showing, and how strongly, at a point in the flight.
 *
 * Each stop holds the stretch of the flight nearest to it: from the midpoint
 * with the stop before to the midpoint with the stop after, the first and the
 * last holding on to either end. Across that stretch its text is at full
 * strength, so it can be read for as long as you are there. It fades only in
 * a short band at each handover, out before the next stop's text fades in,
 * so two are never on screen at once.
 *
 * It used to peak at the exact stop and fade from there, so a stop's text was
 * part-faded most of the time it was up, and the last stop was down to a
 * quarter strength by the end of the flight.
 */
const HANDOVER = 0.035

export type RevealState = {
  activeIndex: number | null
  opacities: number[]
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

export function computeRevealState(progress: number, waypointTs: number[]): RevealState {
  let activeIndex: number | null = null
  let activeDistance = Infinity
  const last = waypointTs.length - 1

  const opacities = waypointTs.map((t, index) => {
    const from = index === 0 ? null : (waypointTs[index - 1] + t) / 2
    const to = index === last ? null : (t + waypointTs[index + 1]) / 2
    const fadeIn = from === null ? 1 : smoothstep(from, from + HANDOVER, progress)
    const fadeOut = to === null ? 1 : 1 - smoothstep(to - HANDOVER, to, progress)
    const opacity = Math.min(fadeIn, fadeOut)

    const distance = Math.abs(progress - t)
    if (opacity > 0 && distance < activeDistance) {
      activeDistance = distance
      activeIndex = index
    }

    return opacity
  })

  return { activeIndex, opacities }
}
