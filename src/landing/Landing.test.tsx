import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Landing } from './Landing'
import { COPY, SECTIONS } from '../theme'

describe('Landing', () => {
  it('renders all three panels plus the footer', () => {
    const { container } = render(<Landing />)
    expect(container.querySelector('.hero')).toBeInTheDocument()
    expect(container.querySelector('.about')).toBeInTheDocument()
    expect(container.querySelector('.ground')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('has exactly one h1, the name', () => {
    render(<Landing />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(COPY.name)
  })

  it('builds the scene as one continuous column in a sticky viewport', () => {
    const { container } = render(<Landing />)
    expect(container.querySelector('.descent')).toBeInTheDocument()
    expect(container.querySelector('.descent__viewport')).toBeInTheDocument()
    expect(container.querySelector('.descent__column')).toBeInTheDocument()
  })

  it('builds the scene from two plates, sky then ground', () => {
    // A second cloud plate overlapping the first always showed one of the
    // two edges; the sky plate already ends in cloud, so the mountain just
    // starts where that cloud finishes.
    const { container } = render(<Landing />)
    const column = container.querySelector('.descent__column')!
    expect(column.querySelectorAll('.descent__layer')).toHaveLength(2)
    expect(column.querySelector('.descent__layer--sky')).toBeInTheDocument()
    expect(column.querySelector('.descent__layer--ground')).toBeInTheDocument()
    expect(column.querySelector('.descent__layer--cloud')).toBeNull()
  })

  it('tells the visitor to scroll', () => {
    const { container } = render(<Landing />)
    expect(container.querySelector('.hero__scroll')).toBeInTheDocument()
  })

  it('gives the branch its own layer, so it can swing without the sky', () => {
    const { container } = render(<Landing />)
    const branch = container.querySelector('.descent__branch')!
    expect(branch).toBeInTheDocument()
    expect(branch).toHaveAttribute('aria-hidden', 'true')
  })

  it('gives each panel its own height class', () => {
    const { container } = render(<Landing />)
    for (const kind of ['hero', 'about', 'cards']) {
      expect(container.querySelector(`.descent__panel--${kind}`)).toBeInTheDocument()
    }
  })

  it('rides three content panels over the scene', () => {
    const { container } = render(<Landing />)
    expect(container.querySelectorAll('.descent__panel')).toHaveLength(3)
  })

  it('keeps the footer in normal flow after the track, not inside it', () => {
    // Inside it, the footer would need to ride the same JS-driven progress
    // as the scene instead of native scroll, for no benefit — nothing here
    // is damped, so there is no lag for it to fall out of sync with.
    const { container } = render(<Landing />)
    const descent = container.querySelector('.descent')!
    expect(descent.contains(screen.getByRole('contentinfo'))).toBe(false)
    expect(container.contains(screen.getByRole('contentinfo'))).toBe(true)
  })

  it('runs one weather system for the whole descent, not one per panel', () => {
    const { container } = render(<Landing />)
    expect(container.querySelectorAll('.petals')).toHaveLength(1)
    expect(
      container.querySelector('.descent__viewport')!.querySelector('.petals'),
    ).toBeInTheDocument()
  })

  it('renders the four section cards', () => {
    render(<Landing />)
    expect(screen.getAllByRole('button')).toHaveLength(SECTIONS.length)
  })

  it('never leaks an internal hour name into the DOM', () => {
    const { container } = render(<Landing />)
    for (const s of SECTIONS) {
      expect(container.textContent).not.toContain(s.hour)
    }
  })
})
