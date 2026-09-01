import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { WaypointLabel, type WaypointLabelHandle } from './WaypointLabel'
import type { Waypoint } from './waypoints'

const waypoint: Waypoint = {
  id: 'test',
  year: '2025',
  title: 'Test Title',
  role: 'Test Role',
  description: 'Test description.',
  position: [0, 0, 0],
  t: 0.5,
}

const labelOf = (container: HTMLElement) =>
  container.querySelector('.waypoint-label') as HTMLElement

describe('WaypointLabel', () => {
  it('renders year, title, role, and description', () => {
    const { getByText } = render(<WaypointLabel waypoint={waypoint} isActive />)
    expect(getByText('2025')).toBeTruthy()
    expect(getByText('Test Title')).toBeTruthy()
    expect(getByText('Test Role')).toBeTruthy()
    expect(getByText('Test description.')).toBeTruthy()
  })

  it('starts hidden', () => {
    const { container } = render(<WaypointLabel waypoint={waypoint} isActive={false} />)
    expect(labelOf(container).style.opacity).toBe('0')
  })

  it('updates opacity through the handle', () => {
    const ref = createRef<WaypointLabelHandle>()
    const { container } = render(<WaypointLabel ref={ref} waypoint={waypoint} isActive />)
    ref.current?.setVisibility(1)
    expect(labelOf(container).style.opacity).toBe('1')
  })

  it('writes placement to the transform rather than to React state', () => {
    const ref = createRef<WaypointLabelHandle>()
    const { container } = render(<WaypointLabel ref={ref} waypoint={waypoint} isActive />)
    ref.current?.setPlacement(120, 340, 'right')
    expect(labelOf(container).style.transform).toBe('translate3d(120px, 340px, 0)')
  })

  it('reflects the chosen side as a data attribute so CSS can mirror it', () => {
    const ref = createRef<WaypointLabelHandle>()
    const { container } = render(<WaypointLabel ref={ref} waypoint={waypoint} isActive />)
    ref.current?.setPlacement(120, 340, 'left')
    expect(labelOf(container).dataset.side).toBe('left')
  })

  it('hides itself from assistive tech when inactive', () => {
    const { container } = render(<WaypointLabel waypoint={waypoint} isActive={false} />)
    expect(labelOf(container).getAttribute('aria-hidden')).toBe('true')
  })

  it('exposes itself to assistive tech when active', () => {
    const { container } = render(<WaypointLabel waypoint={waypoint} isActive />)
    expect(labelOf(container).getAttribute('aria-hidden')).toBe('false')
  })
})
