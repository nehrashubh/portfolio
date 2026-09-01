import { describe, it, expect } from 'vitest'
import { makePetals } from './petals'

/** Deterministic stand-in for Math.random, cycling a fixed ramp. */
function seeded(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('makePetals', () => {
  it('returns exactly the requested count', () => {
    expect(makePetals(34, Math.random)).toHaveLength(34)
    expect(makePetals(0, Math.random)).toHaveLength(0)
  })

  it('is deterministic for a given rng', () => {
    const a = makePetals(8, seeded([0.1, 0.4, 0.7, 0.2, 0.9, 0.5]))
    const b = makePetals(8, seeded([0.1, 0.4, 0.7, 0.2, 0.9, 0.5]))
    expect(a).toEqual(b)
  })

  it('keeps every generated value inside its documented range', () => {
    for (const p of makePetals(200, Math.random)) {
      expect(p.depth).toBeGreaterThanOrEqual(0)
      expect(p.depth).toBeLessThanOrEqual(1)
      expect(p.width).toBeGreaterThanOrEqual(4)
      expect(p.width).toBeLessThanOrEqual(21)
      expect(p.opacity).toBeGreaterThanOrEqual(0.32)
      expect(p.opacity).toBeLessThanOrEqual(0.86)
      expect(p.durationS).toBeGreaterThanOrEqual(8.5)
      expect(p.durationS).toBeLessThanOrEqual(17)
      expect(p.delayS).toBeLessThanOrEqual(0)
      expect(p.tint).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('starts every petal above the frame so none pops in mid-air', () => {
    for (const p of makePetals(60, Math.random)) {
      expect(p.top).toBeLessThan(0)
    }
  })

  it('makes near petals larger and faster than far ones', () => {
    const far = makePetals(1, seeded([0]))[0]
    const near = makePetals(1, seeded([1]))[0]
    expect(near.width).toBeGreaterThan(far.width)
    expect(near.durationS).toBeLessThan(far.durationS)
  })

  it('blurs only the nearest petals', () => {
    const far = makePetals(1, seeded([0]))[0]
    const near = makePetals(1, seeded([1]))[0]
    expect(far.blurPx).toBe(0)
    expect(near.blurPx).toBeGreaterThan(0)
  })
})

describe('petal variety', () => {
  it('assigns every petal a valid shape and colour ramp', () => {
    for (const p of makePetals(200, Math.random)) {
      expect(p.shape).toBeGreaterThanOrEqual(0)
      expect(p.shape).toBeLessThan(3)
      expect(p.ramp).toBeGreaterThanOrEqual(0)
      expect(p.ramp).toBeLessThan(3)
      expect(Number.isInteger(p.shape)).toBe(true)
      expect(Number.isInteger(p.ramp)).toBe(true)
    }
  })

  it('actually mixes shapes rather than emitting one over and over', () => {
    const shapes = new Set(makePetals(120, Math.random).map((p) => p.shape))
    expect(shapes.size).toBeGreaterThan(1)
  })
})
