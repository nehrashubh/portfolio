import { describe, it, expect } from 'vitest'
import { flipScale, flipTransform, type Box } from './flip'

const box = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  width,
  height,
})

describe('flipScale', () => {
  it('scales by the ratio of font sizes', () => {
    expect(flipScale(30, 76)).toBeCloseTo(30 / 76, 6)
  })

  it('is 1 when both ends are the same size', () => {
    expect(flipScale(30, 30)).toBe(1)
  })

  it('never divides by zero when a font size is unreadable', () => {
    expect(Number.isFinite(flipScale(30, 0))).toBe(true)
    expect(flipScale(30, 0)).toBe(1)
  })
})

describe('flipTransform', () => {
  it('translates by the difference of the top-left corners', () => {
    const t = flipTransform(box(100, 50, 200, 40), box(20, 10, 600, 90), 1)
    expect(t).toBe('translate(80px, 40px) scale(1)')
  })

  it('is an identity transform when nothing moved and nothing scaled', () => {
    const same = box(10, 10, 100, 20)
    expect(flipTransform(same, same, 1)).toBe('translate(0px, 0px) scale(1)')
  })

  it('carries the scale through', () => {
    const t = flipTransform(box(0, 0, 10, 10), box(0, 0, 100, 100), 0.25)
    expect(t).toContain('scale(0.25)')
  })

  it('ignores box width entirely — the trap that broke the return trip', () => {
    // Same corners and same font scale, wildly different widths.
    // A width-ratio implementation would produce different transforms here.
    const narrow = flipTransform(box(0, 0, 40, 20), box(0, 0, 900, 60), 0.5)
    const wide = flipTransform(box(0, 0, 800, 20), box(0, 0, 900, 60), 0.5)
    expect(narrow).toBe(wide)
  })
})
