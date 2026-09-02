import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Ground } from './Ground'
import { SECTIONS } from '../theme'

describe('Ground', () => {
  it('renders all four cards', () => {
    render(<Ground reducedMotion={false} />)
    expect(screen.getAllByRole('button')).toHaveLength(SECTIONS.length)
  })

  it('renders them in chronological hour order', () => {
    render(<Ground reducedMotion={false} />)
    const labels = screen.getAllByRole('button').map((b) => b.textContent)
    expect(labels[0]).toContain('Skills')
    expect(labels[1]).toContain('Projects')
    expect(labels[2]).toContain('Writeups')
    expect(labels[3]).toContain('Work & Education')
  })

  it('shows no overlay until a card is opened', () => {
    render(<Ground reducedMotion={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the matching section on click', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion={false} />)
    await user.click(screen.getByRole('button', { name: /writeups/i }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Writeups')
  })

  it('plays an exit before it unmounts, rather than snapping shut', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion={false} />)
    await user.click(screen.getByRole('button', { name: /skills/i }))
    await user.click(screen.getByRole('button', { name: /close skills/i }))

    // Still mounted, now marked as closing, so the cascade can play out.
    expect(screen.getByRole('dialog')).toHaveClass('overlay--closing')

    await waitFor(
      () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      { timeout: 3000 },
    )
  })

  it('closes immediately under reduced motion, with no exit to wait through', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion />)
    await user.click(screen.getByRole('button', { name: /skills/i }))
    await user.click(screen.getByRole('button', { name: /close skills/i }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('hides the open card’s own title so nothing doubles up', async () => {
    const user = userEvent.setup()
    const { container } = render(<Ground reducedMotion={false} />)
    await user.click(screen.getByRole('button', { name: /projects/i }))
    const sending = container.querySelectorAll('.card--sending')
    expect(sending).toHaveLength(1)
    expect(sending[0].textContent).toContain('Projects')
  })
})

describe('Ground heading', () => {
  it('renders a heading above the cards', () => {
    render(<Ground reducedMotion={false} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /experience/i }),
    ).toBeInTheDocument()
  })

  it('exposes the heading through a ref, so the descent can right it', () => {
    const ref = { current: null as HTMLHeadingElement | null }
    render(<Ground reducedMotion={false} headingRef={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current!.textContent).toMatch(/experience/i)
  })
})

describe('Ground heading letters', () => {
  it('splits the word so each letter can travel on its own', () => {
    const { container } = render(<Ground reducedMotion={false} />)
    expect(container.querySelectorAll('.ground__letter')).toHaveLength(
      'Experience'.length,
    )
  })

  it('starts each letter one line higher than the next, last one in place', () => {
    const { container } = render(<Ground reducedMotion={false} />)
    const rises = Array.from(
      container.querySelectorAll<HTMLElement>('.ground__letter'),
    ).map((el) => Number(el.style.getPropertyValue('--rise')))
    // A staircase: 9, 8, 7 … 0, so the final E needs no travel at all.
    expect(rises[0]).toBe(rises.length - 1)
    expect(rises[rises.length - 1]).toBe(0)
    for (let i = 1; i < rises.length; i++) {
      expect(rises[i]).toBe(rises[i - 1] - 1)
    }
  })

  it('still reads as one word to a screen reader', () => {
    render(<Ground reducedMotion={false} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /^experience$/i }),
    ).toBeInTheDocument()
  })
})

describe('Ground routing', () => {
  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname)
  })

  it('opens the section named in the URL fragment on mount', async () => {
    window.location.hash = '#writeups/massagold'
    render(<Ground reducedMotion />)
    // The section is a dialog and so is the reader it opened on that slug.
    // Awaited: each mount now builds its own lazy component, so the chunk is
    // resolved per mount rather than once for the whole file.
    expect(screen.getByRole('dialog', { name: 'Writeups' })).toBeInTheDocument()
    expect(await screen.findByRole('dialog', { name: 'Massagold' })).toBeInTheDocument()
  })

  it('writes the fragment when a card is clicked', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion />)
    await user.click(screen.getByRole('button', { name: /projects/i }))
    expect(window.location.hash).toBe('#projects')
  })

  it('clears the fragment on close without adding history', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion />)
    await user.click(screen.getByRole('button', { name: /skills/i }))
    await user.click(screen.getByRole('button', { name: /close skills/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(window.location.hash).toBe('')
  })

  it('follows a fragment change to another section while one is open', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion />)
    await user.click(screen.getByRole('button', { name: /skills/i }))
    window.location.hash = '#work/dbworkout'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Work & Education'),
    )
  })

  it('closes when the fragment is emptied, as the back button does', async () => {
    const user = userEvent.setup()
    render(<Ground reducedMotion />)
    await user.click(screen.getByRole('button', { name: /skills/i }))
    window.history.replaceState(null, '', window.location.pathname)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
