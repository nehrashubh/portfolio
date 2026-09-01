import { describe, it, expect } from 'vitest'
import { CATEGORIES, FISCHER_POSITION } from './fischerPosition'
import { ENTRANCE, ENTRANCE_DURATION_MS, REVEAL_ORDER, revealDelayMs } from './entrance'

describe('REVEAL_ORDER', () => {
  it('covers every piece exactly once', () => {
    expect(REVEAL_ORDER).toHaveLength(FISCHER_POSITION.length)
    expect(new Set(REVEAL_ORDER).size).toBe(FISCHER_POSITION.length)
  })

  it('groups by category in the order the columns read', () => {
    const categoryOf = new Map(FISCHER_POSITION.map((e) => [e.pieceName, e.category]))
    const seen = REVEAL_ORDER.map((name) => categoryOf.get(name))
    const firstAppearance = CATEGORIES.map((c) => seen.indexOf(c.key))
    expect(firstAppearance).toEqual([...firstAppearance].sort((a, b) => a - b))
    // and no category is interleaved with another
    const runs = seen.filter((c, i) => c !== seen[i - 1])
    expect(new Set(runs).size).toBe(runs.length)
  })
})

describe('revealDelayMs', () => {
  it('starts after the lead-in and steps evenly', () => {
    expect(revealDelayMs(REVEAL_ORDER[0])).toBe(ENTRANCE.leadInMs)
    expect(revealDelayMs(REVEAL_ORDER[1])).toBe(ENTRANCE.leadInMs + ENTRANCE.stepMs)
  })

  it('increases monotonically along the reveal order', () => {
    const delays = REVEAL_ORDER.map(revealDelayMs)
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
  })

  it('falls back to the lead-in for an unknown piece rather than throwing', () => {
    expect(revealDelayMs('piece_not_on_the_board')).toBe(ENTRANCE.leadInMs)
  })
})

describe('ENTRANCE_DURATION_MS', () => {
  it('outlasts the last piece finishing its settle', () => {
    const lastStart = Math.max(...REVEAL_ORDER.map(revealDelayMs))
    expect(ENTRANCE_DURATION_MS).toBeGreaterThanOrEqual(lastStart + ENTRANCE.settleMs)
  })
})

