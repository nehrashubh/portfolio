import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ReducedMotionFallback } from './ReducedMotionFallback'
import { WAYPOINTS } from './waypoints'

describe('ReducedMotionFallback', () => {
  it('renders every waypoint title as a list item', () => {
    const { getByText, container } = render(<ReducedMotionFallback />)
    for (const waypoint of WAYPOINTS) {
      expect(getByText(waypoint.title)).toBeTruthy()
    }
    expect(container.querySelectorAll('li').length).toBe(WAYPOINTS.length)
  })

  it('renders the year and role for every waypoint', () => {
    const { container } = render(<ReducedMotionFallback />)

    const read = (className: string) =>
      [...container.querySelectorAll(className)].map((el) => el.textContent)

    // Neither years nor roles are unique — two entries are both 2026, and two
    // share "Undergraduate Researcher" — so compare the full ordered lists
    // rather than looking elements up by their text.
    expect(read('.reduced-motion-list__year')).toEqual(WAYPOINTS.map((w) => w.year))
    expect(read('.reduced-motion-list__role')).toEqual(WAYPOINTS.map((w) => w.role))
  })

  it('renders as an ordered list', () => {
    const { container } = render(<ReducedMotionFallback />)
    expect(container.querySelector('ol.reduced-motion-list')).toBeTruthy()
  })
})
