import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SectionCard } from './SectionCard'
import { SECTIONS } from '../theme'

const skills = SECTIONS[0]

describe('SectionCard', () => {
  it('renders the title and descriptor', () => {
    render(<SectionCard section={skills} onOpen={() => {}} />)
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getByText(skills.descriptor)).toBeInTheDocument()
  })

  it('renders the ghost numeral', () => {
    const { container } = render(<SectionCard section={skills} onOpen={() => {}} />)
    expect(container.querySelector('.card__ghost')).toHaveTextContent('01')
  })

  it('never renders the internal hour name', () => {
    const { container } = render(<SectionCard section={skills} onOpen={() => {}} />)
    expect(container.textContent).not.toContain('morning')
  })

  it('is a button, so it is reachable by keyboard', () => {
    render(<SectionCard section={skills} onOpen={() => {}} />)
    expect(screen.getByRole('button', { name: /skills/i })).toBeInTheDocument()
  })

  it('calls onOpen when activated', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<SectionCard section={skills} onOpen={onOpen} />)
    await user.click(screen.getByRole('button', { name: /skills/i }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('applies the section hour tint', () => {
    const { container } = render(<SectionCard section={skills} onOpen={() => {}} />)
    const tint = container.querySelector<HTMLElement>('.card__tint')!
    expect(tint.style.background).toContain('linear-gradient')
  })

  it('hides its title while its section is open, so nothing doubles up', () => {
    const { container } = render(
      <SectionCard section={skills} onOpen={() => {}} sending />,
    )
    expect(container.querySelector('.card')).toHaveClass('card--sending')
  })
})

describe('SectionCard prefetch', () => {
  it('prefetches on hover, focus and pointerdown', () => {
    const onPrefetch = vi.fn()
    render(<SectionCard section={skills} onOpen={() => {}} onPrefetch={onPrefetch} />)
    const button = screen.getByRole('button')
    fireEvent.pointerEnter(button)
    fireEvent.focus(button)
    fireEvent.pointerDown(button)
    expect(onPrefetch).toHaveBeenCalledTimes(3)
  })
})
