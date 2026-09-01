import { describe, it, expect } from 'vitest'
import { computeTrailDrawCount } from './pathTrail'

describe('computeTrailDrawCount', () => {
  it('draws the full trail at progress 1', () => {
    expect(computeTrailDrawCount(1, 401)).toBe(401)
  })

  it('draws at least the first 2 points at progress 0', () => {
    expect(computeTrailDrawCount(0, 401)).toBe(2)
  })

  it('grows monotonically with progress', () => {
    const quarter = computeTrailDrawCount(0.25, 401)
    const half = computeTrailDrawCount(0.5, 401)
    expect(half).toBeGreaterThan(quarter)
  })

  it('clamps progress outside [0, 1]', () => {
    expect(computeTrailDrawCount(-1, 401)).toBe(computeTrailDrawCount(0, 401))
    expect(computeTrailDrawCount(2, 401)).toBe(computeTrailDrawCount(1, 401))
  })
})
