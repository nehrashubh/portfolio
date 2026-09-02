import { describe, it, expect } from 'vitest'
import { progressAt, columnOffsetVh, columnOffsetPx, ease, damp } from './descent'

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

describe('ease', () => {
  it('moves toward the target without overshooting it', () => {
    let v = 0
    for (let i = 0; i < 200; i++) {
      v = ease(v, 100, 0.1)
      expect(v).toBeLessThanOrEqual(100)
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('converges exactly, so a still page stops producing new values', () => {
    let v = 0
    for (let i = 0; i < 500; i++) v = ease(v, 100, 0.1)
    expect(v).toBe(100)
    expect(ease(v, 100, 0.1)).toBe(100)
  })

  it('works downward as well as upward', () => {
    let v = 100
    for (let i = 0; i < 500; i++) v = ease(v, -40, 0.1)
    expect(v).toBe(-40)
  })

  it('smooths a step change instead of jumping to it', () => {
    // One frame of a 100px wheel jump should move only a fraction of the way.
    expect(ease(0, 100, 0.12)).toBeCloseTo(12, 6)
  })
})

describe('damp', () => {
  it('is frame-rate independent — one big step equals two small ones', () => {
    const once = damp(0, 1, 4, 0.032)
    let twice = damp(0, 1, 4, 0.016)
    twice = damp(twice, 1, 4, 0.016)
    expect(twice).toBeCloseTo(once, 10)
  })

  it('never overshoots the target', () => {
    let v = 0
    for (let i = 0; i < 500; i++) {
      v = damp(v, 1, 6, 0.016)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('converges exactly, so a still page stops producing new values', () => {
    let v = 0
    for (let i = 0; i < 2000; i++) v = damp(v, 1, 6, 0.016)
    expect(v).toBe(1)
    expect(damp(v, 1, 6, 0.016)).toBe(1)
  })

  it('works downward as well as upward', () => {
    let v = 1
    for (let i = 0; i < 2000; i++) v = damp(v, -0.4, 6, 0.016)
    expect(v).toBe(-0.4)
  })

  it('refuses to move faster than maxSpeed, however far the target is', () => {
    // Target a mile away; one frame may still only move maxSpeed * dt.
    const dt = 0.016
    const moved = damp(0, 1000, 6, dt, 0.5)
    expect(moved).toBeCloseTo(0.5 * dt, 10)
  })

  it('leaves a slow approach untouched by the clamp', () => {
    // Well inside the speed limit, so damping alone decides.
    const dt = 0.016
    expect(damp(0, 0.001, 6, dt, 10)).toBeCloseTo(damp(0, 0.001, 6, dt), 12)
  })

  it('returns the current value for a zero or negative frame time', () => {
    expect(damp(0.3, 1, 6, 0)).toBe(0.3)
    expect(damp(0.3, 1, 6, -0.016)).toBe(0.3)
  })
})

describe('columnOffsetPx', () => {
  it('scales the vh offset by the viewport', () => {
    expect(columnOffsetPx(1, 200, 800)).toBeCloseTo(-1600, 6)
    expect(columnOffsetPx(0, 200, 800)).toBe(0)
  })

  it('keeps sub-pixel precision, which is what stops the settle stuttering', () => {
    // Two frames of a slow settle, a thousandth of the track apart. Rounded
    // to whole pixels these collapse to the same value and the scene freezes;
    // that was the stutter at the top and bottom of the page.
    const a = columnOffsetPx(0.0010, 220, 800)
    const b = columnOffsetPx(0.0015, 220, 800)
    expect(a).not.toBe(b)
    expect(Math.abs(b - a)).toBeLessThan(1)
  })

  it('never doubles back as progress advances', () => {
    let prev = columnOffsetPx(0, 220, 800)
    for (let p = 0.005; p <= 1; p += 0.005) {
      const now = columnOffsetPx(p, 220, 800)
      expect(now).toBeLessThanOrEqual(prev)
      prev = now
    }
  })
})
