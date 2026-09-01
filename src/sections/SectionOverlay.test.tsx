import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SectionOverlay } from './SectionOverlay'
import { SECTIONS } from '../theme'

const projects = SECTIONS[1]

describe('SectionOverlay', () => {
  it('renders nothing when no section is open', () => {
    const { container } = render(
      <SectionOverlay section={null} onClose={() => {}} reducedMotion={false} />,
    )
    expect(container).toBeEmptyDOMElement()
    expect(document.body.querySelector('.overlay')).toBeNull()
  })

  it('renders the section title only — no descriptor, no numeral', () => {
    render(
      <SectionOverlay section={projects} onClose={() => {}} reducedMotion={false} />,
    )
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.queryByText(projects.descriptor)).not.toBeInTheDocument()
    expect(screen.queryByText('02')).not.toBeInTheDocument()
  })

  it('never renders the internal hour name', () => {
    render(
      <SectionOverlay section={projects} onClose={() => {}} reducedMotion={false} />,
    )
    expect(document.body.textContent).not.toContain('late afternoon')
  })

  it('gives the placeholder the whole viewport', () => {
    render(
      <SectionOverlay section={projects} onClose={() => {}} reducedMotion={false} />,
    )
    expect(document.querySelector('.overlay__mount')).toBeInTheDocument()
  })

  it('portals out of the React tree, into document.body', () => {
    const { container } = render(
      <SectionOverlay section={projects} onClose={() => {}} reducedMotion={false} />,
    )
    // Nothing in the local container…
    expect(container.querySelector('.overlay')).toBeNull()
    // …because it renders at the document root instead.
    expect(document.body.querySelector('.overlay')).toBeInTheDocument()
  })

  it('closes on the cross', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <SectionOverlay section={projects} onClose={onClose} reducedMotion={false} />,
    )
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <SectionOverlay section={projects} onClose={onClose} reducedMotion={false} />,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('applies the section veil and ink', () => {
    render(
      <SectionOverlay section={projects} onClose={() => {}} reducedMotion={false} />,
    )
    const root = document.body.querySelector<HTMLElement>('.overlay')!
    expect(root.style.getPropertyValue('--veil')).toBe(projects.veil)
    expect(root.style.getPropertyValue('--ink')).toBe(projects.ink)
  })

  it('is a modal dialog for assistive technology', () => {
    render(
      <SectionOverlay section={projects} onClose={() => {}} reducedMotion={false} />,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})
