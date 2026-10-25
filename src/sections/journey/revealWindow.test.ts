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

  it('holds full strength across the stretch a stop owns, not just at it', () => {
    // Peaking only at the stop left its text part-faded most of the time.
    for (const progress of [0.36, 0.42, 0.5, 0.58, 0.64]) {
      expect(computeRevealState(progress, waypointTs).opacities[1]).toBe(1)
    }
  })

  it('hands over at the midpoint: out, then in, never both', () => {
    expect(computeRevealState(0.3, waypointTs).opacities).toEqual([0, 0, 0])
    expect(computeRevealState(0.3, waypointTs).activeIndex).toBeNull()

    const before = computeRevealState(0.29, waypointTs).opacities
    expect(before[0]).toBeGreaterThan(0)
    expect(before[1]).toBe(0)

    const after = computeRevealState(0.31, waypointTs).opacities
    expect(after[0]).toBe(0)
    expect(after[1]).toBeGreaterThan(0)
  })

  it('shows at most one stop at any point in the flight', () => {
    for (let i = 0; i <= 200; i++) {
      const shown = computeRevealState(i / 200, waypointTs).opacities.filter((o) => o > 0)
      expect(shown.length).toBeLessThanOrEqual(1)
    }
  })

  it('holds the first stop from the start and the last through the end', () => {
    // The last stop used to be down to a quarter by the end of the flight.
    expect(computeRevealState(0, waypointTs).opacities[0]).toBe(1)
    expect(computeRevealState(1, waypointTs).opacities[2]).toBe(1)
    expect(computeRevealState(1, waypointTs).activeIndex).toBe(2)
  })

  it('fades smoothly through a handover', () => {
    const early = computeRevealState(0.27, waypointTs).opacities[0]
    const late = computeRevealState(0.29, waypointTs).opacities[0]
    expect(early).toBeGreaterThan(late)
    expect(early).toBeLessThanOrEqual(1)
  })
})
