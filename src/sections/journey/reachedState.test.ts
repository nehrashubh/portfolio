import { describe, it, expect } from 'vitest'
import { computeReachedStates } from './reachedState'

describe('computeReachedStates', () => {
  const waypointTs = [0.1, 0.5, 0.9]

  it('marks a waypoint reached once progress reaches its t', () => {
    expect(computeReachedStates(0.1, waypointTs)).toEqual([true, false, false])
  })

  it('marks a waypoint reached while progress is past its t', () => {
    expect(computeReachedStates(0.6, waypointTs)).toEqual([true, true, false])
  })

  it('marks nothing reached before the first waypoint', () => {
    expect(computeReachedStates(0, waypointTs)).toEqual([false, false, false])
  })

  it('marks everything reached at the end', () => {
    expect(computeReachedStates(1, waypointTs)).toEqual([true, true, true])
  })

  it('un-reaches a waypoint when scrubbing back below its t', () => {
    const forward = computeReachedStates(0.55, waypointTs)
    const backward = computeReachedStates(0.3, waypointTs)
    expect(forward[1]).toBe(true)
    expect(backward[1]).toBe(false)
  })
})
