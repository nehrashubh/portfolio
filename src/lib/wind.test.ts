import { describe, it, expect } from 'vitest'
import { gust } from './wind'

describe('gust', () => {
  it('stays within the -1..1 band across a long sweep', () => {
    for (let t = 0; t < 120_000; t += 250) {
      const v = gust(t)
      expect(v).toBeGreaterThanOrEqual(-1)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic for the same time', () => {
    expect(gust(4200)).toBe(gust(4200))
  })

  it('changes over time', () => {
    expect(gust(0)).not.toBeCloseTo(gust(7000), 5)
  })

  it('does not repeat on the short cycle of its slowest component', () => {
    // A single sine would return to the same value one period later.
    // Compounded frequencies must not.
    expect(gust(1000)).not.toBeCloseTo(gust(1000 + 13_000), 3)
  })

  it('moves gradually — no step between adjacent frames', () => {
    // Smoothness matters more than amplitude: a jump here reads as a glitch.
    for (let t = 0; t < 30_000; t += 16) {
      expect(Math.abs(gust(t + 16) - gust(t))).toBeLessThan(0.05)
    }
  })
})
