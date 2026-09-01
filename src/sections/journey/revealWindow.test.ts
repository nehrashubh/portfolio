// src/revealWindow.test.ts
import { describe, it, expect } from 'vitest'
import { computeRevealState } from './revealWindow'

describe('computeRevealState', () => {
  const waypointTs = [0.1, 0.5, 0.9]

  it('is fully revealed exactly at a waypoint', () => {
    const { activeIndex, opacities } = computeRevealState(0.5, waypointTs)
    expect(activeIndex).toBe(1)
    expect(opacities[1]).toBeCloseTo(1, 5)
  })

  it('is not revealed outside every reveal window', () => {
    const { activeIndex, opacities } = computeRevealState(0.3, waypointTs)
    expect(activeIndex).toBeNull()
    expect(opacities.every((o) => o === 0)).toBe(true)
  })

  it('fades in smoothly approaching a waypoint', () => {
    const near = computeRevealState(0.47, waypointTs).opacities[1]
    const nearer = computeRevealState(0.49, waypointTs).opacities[1]
    expect(nearer).toBeGreaterThan(near)
    expect(nearer).toBeLessThanOrEqual(1)
  })

  it('only reveals the waypoint whose window contains progress', () => {
    const { opacities } = computeRevealState(0.1, waypointTs)
    expect(opacities[0]).toBeGreaterThan(0)
    expect(opacities[1]).toBe(0)
    expect(opacities[2]).toBe(0)
  })

  it('reveals across a wider dwell window than the original 0.06 half-width', () => {
    const { opacities } = computeRevealState(0.58, [0.5])
    expect(opacities[0]).toBeGreaterThan(0)
  })
})
