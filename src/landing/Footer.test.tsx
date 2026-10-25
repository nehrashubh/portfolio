import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'
import { LINKS, FOOTER, CREDITS } from '../theme'

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

  it('credits every model, linking its source and its licence', () => {
    // CC BY 4.0 asks for credit where the work is shown, so it lives on the
    // site itself, not only in the README.
    render(<Footer />)
    for (const c of CREDITS) {
      expect(screen.getByRole('link', { name: c.title })).toHaveAttribute('href', c.href)
      expect(screen.getAllByRole('link', { name: c.license })[0]).toHaveAttribute('href', c.licenseHref)
      expect(screen.getByText(new RegExp(`by ${c.author}`))).toBeInTheDocument()
    }
  })

  it('is a contentinfo landmark', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
