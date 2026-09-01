// Converts scroll progress into how many of the trail line's precomputed,
// arc-length-spaced points should be drawn. Kept pure/separate from PathLine
// so the index math is unit-testable without a WebGL context.
export function computeTrailDrawCount(progress: number, pointCount: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1)
  return Math.max(2, Math.round(clamped * (pointCount - 1)) + 1)
}
