import { describe, it, expect } from 'vitest'
import { WAYPOINTS } from './waypoints'

describe('WAYPOINTS', () => {
  it('has five entries', () => {
    expect(WAYPOINTS).toHaveLength(5)
  })

  it('no longer includes BusinessNext', () => {
    expect(WAYPOINTS.some((w) => w.id === 'businessnext')).toBe(false)
  })

  it('gives every entry a year', () => {
    for (const w of WAYPOINTS) {
      expect(w.year, `${w.id} has no year`).toMatch(/^\d{4}$/)
    }
  })

  it('keeps every description short enough for an anchored label', () => {
    // An anchored label sits in a narrow column beside its marker. The old
    // 118-character copy forced 8pt type in the mockups.
    for (const w of WAYPOINTS) {
      expect(w.description.length, `${w.id}: "${w.description}"`).toBeLessThanOrEqual(80)
    }
  })

  it('gives every entry a role', () => {
    for (const w of WAYPOINTS) {
      expect(w.role.length).toBeGreaterThan(0)
    }
  })

  it('orders t ascending and within [0, 1]', () => {
    for (let i = 0; i < WAYPOINTS.length; i++) {
      expect(WAYPOINTS[i].t).toBeGreaterThanOrEqual(0)
      expect(WAYPOINTS[i].t).toBeLessThanOrEqual(1)
      if (i > 0) expect(WAYPOINTS[i].t).toBeGreaterThan(WAYPOINTS[i - 1].t)
    }
  })

  it('uses unique ids', () => {
    expect(new Set(WAYPOINTS.map((w) => w.id)).size).toBe(WAYPOINTS.length)
  })
})
