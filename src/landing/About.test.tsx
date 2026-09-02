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

  it('carries no facts line — the hero states them now', () => {
    const { container } = render(<About />)
    expect(container.querySelector('.about__facts')).toBeNull()
    expect(container.textContent).not.toContain('Blacksburg')
  })

  it('holds the bio on a single line', () => {
    const { container } = render(<About />)
    expect(container.querySelector('.about__bio')!.textContent).not.toContain('\n')
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
