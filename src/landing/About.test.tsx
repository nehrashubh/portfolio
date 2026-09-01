import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { About } from './About'
import { COPY } from '../theme'

describe('About', () => {
  it('renders the About paragraph', () => {
    render(<About />)
    expect(screen.getByText(COPY.about)).toBeInTheDocument()
  })

  it('renders the bio line exactly as written, lowercase', () => {
    render(<About />)
    expect(screen.getByText(COPY.bio)).toBeInTheDocument()
  })

  it('lists every fact', () => {
    const { container } = render(<About />)
    const facts = container.querySelector('.about__facts')!
    for (const fact of COPY.facts) {
      expect(facts.textContent).toContain(fact)
    }
  })

  it('keeps the facts in their own element, out of the prose', () => {
    const { container } = render(<About />)
    const facts = container.querySelector('.about__facts')!
    const prose = container.querySelector('.about__text')!
    expect(facts).not.toBe(prose)
    expect(prose.textContent).not.toContain('Blacksburg')
  })

  it('holds the facts and the bio each on a single line', () => {
    const { container } = render(<About />)
    for (const sel of ['.about__facts', '.about__bio']) {
      expect(container.querySelector(sel)!.textContent).not.toContain('\n')
    }
  })

  it('drops "cybersecurity enthusiast" from the bio', () => {
    render(<About />)
    expect(screen.queryByText(/cybersecurity enthusiast/i)).not.toBeInTheDocument()
  })

  it('carries no scenery of its own — the cloud lives in the descent column', () => {
    const { container } = render(<About />)
    expect(container.querySelectorAll('.petal')).toHaveLength(0)
  })
})
