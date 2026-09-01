export interface PetalSpec {
  /** 0 = far from camera, 1 = near. Drives every other value. */
  depth: number
  width: number
  height: number
  /** Percent of the field's width. */
  left: number
  /** Percent, always negative so petals enter from above. */
  top: number
  opacity: number
  blurPx: number
  durationS: number
  /** Negative, so the field looks mid-flight on first paint. */
  delayS: number
  driftPx: number
  spinDeg: number
  tint: string
  /** Which silhouette this petal uses — real blossom is not uniform. */
  shape: number
  /** Which of the pink ramps it is painted with. */
  ramp: number
}

const TINTS = ['#f7c6d4', '#f2aec5', '#fbdde6', '#eda5bd', '#f8d0dc']
export const SHAPE_COUNT = 3
export const RAMP_COUNT = 3

/** Above this depth a petal is close enough to the lens to go soft. */
const BLUR_THRESHOLD = 0.72

/**
 * Petals are seeded here and rendered as DOM elements, never baked into the
 * sky plates. Three image-generation batches proved a model cannot be directed
 * to render them — it bands them into a row, or renders them brown. Owning
 * them is also what lets them react to scroll.
 */
export function makePetals(count: number, rng: () => number): PetalSpec[] {
  const petals: PetalSpec[] = []
  for (let i = 0; i < count; i++) {
    const depth = rng()
    const width = 4 + depth * 17
    petals.push({
      depth,
      width,
      height: width * (0.62 + rng() * 0.22),
      left: rng() * 108 - 4,
      top: -14 - rng() * 46,
      opacity: 0.32 + depth * 0.54,
      blurPx: depth > BLUR_THRESHOLD ? (depth - BLUR_THRESHOLD) * 11 : 0,
      durationS: 17 - depth * 8.5,
      delayS: -rng() * 24,
      driftPx: 20 + rng() * 210,
      spinDeg: 300 + rng() * 1000,
      tint: TINTS[Math.floor(rng() * TINTS.length) % TINTS.length],
      shape: Math.floor(rng() * SHAPE_COUNT) % SHAPE_COUNT,
      ramp: Math.floor(rng() * RAMP_COUNT) % RAMP_COUNT,
    })
  }
  return petals
}
