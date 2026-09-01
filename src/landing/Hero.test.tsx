import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Hero } from './Hero'
import { COPY } from '../theme'

describe('Hero', () => {
  it('renders the name as the page heading', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(COPY.name)
  })

  it('renders the hook', () => {
    render(<Hero />)
    expect(screen.getByText(COPY.hook)).toBeInTheDocument()
  })

  it('shows no facts — those belong to the About panel', () => {
    render(<Hero />)
    expect(screen.queryByText(/Blacksburg/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Class of 2028/)).not.toBeInTheDocument()
  })

  it('carries no scenery of its own — the sky lives in the descent column', () => {
    const { container } = render(<Hero />)
    expect(container.querySelectorAll('.petal')).toHaveLength(0)
    expect(container.querySelector('.descent__layer')).toBeNull()
  })
})
