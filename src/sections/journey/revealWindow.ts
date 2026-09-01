const HALF_WIDTH = 0.09

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

  const opacities = waypointTs.map((t, index) => {
    const distance = Math.abs(progress - t)
    const opacity = distance <= HALF_WIDTH ? 1 - smoothstep(0, HALF_WIDTH, distance) : 0

    if (opacity > 0 && distance < activeDistance) {
      activeDistance = distance
      activeIndex = index
    }

    return opacity
  })

  return { activeIndex, opacities }
}
