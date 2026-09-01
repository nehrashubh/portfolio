import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'
import { LINKS, FOOTER } from '../theme'

describe('Footer', () => {
  it('renders the heading', () => {
    render(<Footer />)
    expect(screen.getByText(FOOTER.heading)).toBeInTheDocument()
  })

  it('renders every link as a real anchor', () => {
    render(<Footer />)
    for (const link of LINKS) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      )
    }
  })

  it('renders the location note', () => {
    render(<Footer />)
    expect(screen.getByText(FOOTER.note)).toBeInTheDocument()
  })

  it('is a contentinfo landmark', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
