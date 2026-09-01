import { describe, it, expect } from 'vitest'
import { progressAt, columnOffsetVh } from './descent'

const TRACK = 3000
const TRAVEL = 160

describe('progressAt', () => {
  it('is 0 at the top and 1 at the ground', () => {
    expect(progressAt(0, TRACK)).toBe(0)
    expect(progressAt(TRACK, TRACK)).toBe(1)
  })

  it('is linear through the middle', () => {
    expect(progressAt(TRACK * 0.25, TRACK)).toBeCloseTo(0.25, 6)
    expect(progressAt(TRACK * 0.5, TRACK)).toBeCloseTo(0.5, 6)
  })

  it('clamps past either end rather than overshooting', () => {
    expect(progressAt(-800, TRACK)).toBe(0)
    expect(progressAt(TRACK + 800, TRACK)).toBe(1)
  })

  it('treats a zero-height track as the top rather than dividing by zero', () => {
    expect(progressAt(0, 0)).toBe(0)
    expect(Number.isFinite(progressAt(500, 0))).toBe(true)
  })
})

describe('columnOffsetVh', () => {
  it('starts flush and ends having travelled the full distance', () => {
    expect(columnOffsetVh(0, TRAVEL)).toBe(0)
    expect(columnOffsetVh(1, TRAVEL)).toBe(-TRAVEL)
  })

  it('moves the scene upward as you descend — never downward', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      expect(columnOffsetVh(p, TRAVEL)).toBeLessThanOrEqual(0)
    }
  })

  it('advances monotonically, so the scene never doubles back', () => {
    let prev = columnOffsetVh(0, TRAVEL)
    for (let p = 0.01; p <= 1; p += 0.01) {
      const now = columnOffsetVh(p, TRAVEL)
      expect(now).toBeLessThanOrEqual(prev)
      prev = now
    }
  })

  it('moves smoothly, with no step between adjacent frames', () => {
    let prev = columnOffsetVh(0, TRAVEL)
    for (let p = 0.002; p <= 1; p += 0.002) {
      const now = columnOffsetVh(p, TRAVEL)
      expect(Math.abs(now - prev)).toBeLessThan(1)
      prev = now
    }
  })

  it('travels less than the panels do, which is what creates the parallax', () => {
    // Panels move the full 200vh of a 300vh track past a 100vh viewport.
    const PANEL_TRAVEL = 200
    expect(TRAVEL).toBeLessThan(PANEL_TRAVEL)
    expect(Math.abs(columnOffsetVh(1, TRAVEL))).toBeLessThan(PANEL_TRAVEL)
  })
})
