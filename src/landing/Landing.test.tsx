import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Landing } from './Landing'
import { COPY, SECTIONS } from '../theme'

const frame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))

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

  it('rides four content panels over the scene, footer included', () => {
    const { container } = render(<Landing />)
    expect(container.querySelectorAll('.descent__panel')).toHaveLength(4)
  })

  it('keeps the footer inside the damped stack, not in normal flow after it', () => {
    // Outside it, the footer rides raw scroll and arrives while the damped
    // panels are still a lag behind — it appeared before the cards settled.
    const { container } = render(<Landing />)
    const panels = container.querySelector('.descent__panels')!
    expect(panels.querySelector('.descent__panel--footer')).toBeInTheDocument()
    expect(panels.contains(screen.getByRole('contentinfo'))).toBe(true)
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

  it('pins the page to what is on screen when a section opens, once per open', async () => {
    // The scene trails the scrollbar. Without the pin, whatever distance it
    // still had to cover played out after the section closed, and the cards
    // shot up the screen a beat after you came back to them.
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<Landing />)
    await frame()
    expect(scrollTo).not.toHaveBeenCalled()

    const root = document.documentElement
    root.setAttribute('data-section-active', '')
    await frame()
    await frame()
    expect(scrollTo).toHaveBeenCalledTimes(1)

    root.removeAttribute('data-section-active')
    await frame()
    root.setAttribute('data-section-active', '')
    await frame()
    expect(scrollTo).toHaveBeenCalledTimes(2)

    root.removeAttribute('data-section-active')
    scrollTo.mockRestore()
  })

  it('moves the page to a card Tab lands on off screen, and only for Tab', () => {
    // The frame cannot scroll, so the browser has no way to show a focused
    // card itself. The page goes there instead, and the descent follows.
    const height = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.matches('.descent, .descent__panels') ? 4000 : 0
      })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<Landing />)
    const card = screen.getAllByRole('button')[2]
    // Far down the stack, with the page still at the top.
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      top: 2500, bottom: 2650, height: 150, left: 0, right: 800, width: 800, x: 0, y: 2500,
      toJSON: () => ({}),
    })
    const focus = (via: () => void) => {
      act(() => card.blur())
      via()
      act(() => card.focus())
    }

    // A click, or the key that closed a section, leaves the page alone.
    focus(() => fireEvent.pointerDown(document.body))
    focus(() => fireEvent.keyDown(window, { key: 'Escape' }))
    expect(scrollTo).not.toHaveBeenCalled()

    // Tab centres it: 2500 into a 4000px stack, in a 768px window.
    focus(() => fireEvent.keyDown(window, { key: 'Tab' }))
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith(0, 2500 - (768 - 150) / 2)

    scrollTo.mockRestore()
    height.mockRestore()
  })

  it('takes back what the descent wrote when reduced motion is switched on', async () => {
    // Left inline, the track's height and the panels' offset outrank the
    // stylesheet's still layout, and the page stays broken until a reload.
    const listeners: ((e: { matches: boolean }) => void)[] = []
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
            if (query.includes('reduced-motion')) listeners.push(fn)
          },
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )
    const { container } = render(<Landing />)
    await frame()
    const track = container.querySelector<HTMLElement>('.descent')!
    const panels = container.querySelector<HTMLElement>('.descent__panels')!
    expect(track.style.height).not.toBe('')
    expect(panels.style.transform).not.toBe('')

    act(() => listeners.forEach((fn) => fn({ matches: true })))
    expect(track.style.height).toBe('')
    expect(panels.style.transform).toBe('')

    matchMedia.mockRestore()
  })
})
