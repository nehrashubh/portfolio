import { describe, it, expect } from 'vitest'
import { scrollProgress, smoothToward } from './scrollFlight'

describe('scrollProgress', () => {
  it('is 0 at the top and 1 at the bottom', () => {
    expect(scrollProgress(0, 9000, 1000)).toBe(0)
    expect(scrollProgress(8000, 9000, 1000)).toBe(1)
  })

  it('is linear in between', () => {
    expect(scrollProgress(4000, 9000, 1000)).toBeCloseTo(0.5)
  })

  it('clamps, and survives a container that cannot scroll', () => {
    expect(scrollProgress(-5, 9000, 1000)).toBe(0)
    expect(scrollProgress(99999, 9000, 1000)).toBe(1)
    expect(scrollProgress(10, 1000, 1000)).toBe(0)
  })
})

describe('smoothToward', () => {
  it('closes about 63% of the gap in one time constant', () => {
    expect(smoothToward(0, 1, 0.3, 0.3)).toBeCloseTo(1 - Math.exp(-1), 5)
  })

  it('does not overshoot on a huge step', () => {
    expect(smoothToward(0, 1, 100)).toBeCloseTo(1, 5)
  })

  it('snaps when within a hair, so the loop can settle', () => {
    expect(smoothToward(0.99995, 1, 0.016)).toBe(1)
  })
})
