import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PetalField } from './PetalField'

describe('PetalField', () => {
  it('renders one element per petal', () => {
    const { container } = render(<PetalField count={34} reducedMotion={false} />)
    expect(container.querySelectorAll('.petal')).toHaveLength(34)
  })

  it('is hidden from assistive technology', () => {
    const { container } = render(<PetalField count={4} reducedMotion={false} />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders nothing at all under reduced motion', () => {
    const { container } = render(<PetalField count={34} reducedMotion />)
    expect(container.querySelectorAll('.petal')).toHaveLength(0)
  })

  it('gives each petal its own duration and delay', () => {
    const { container } = render(<PetalField count={12} reducedMotion={false} />)
    const durations = new Set(
      Array.from(container.querySelectorAll<HTMLElement>('.petal')).map(
        (el) => el.style.animationDuration,
      ),
    )
    expect(durations.size).toBeGreaterThan(1)
  })
})
