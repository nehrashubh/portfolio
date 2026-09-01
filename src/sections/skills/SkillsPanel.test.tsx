import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SkillsPanel } from './SkillsPanel'
import { CATEGORIES, FISCHER_POSITION, pieceLetter } from './fischerPosition'

const noop = () => {}

function renderPanel(props: Partial<Parameters<typeof SkillsPanel>[0]> = {}) {
  return render(
    <SkillsPanel
      selectedName={null}
      entrance="done"
      onSelectSkill={noop}
      onClearSelection={noop}
      {...props}
    />,
  )
}

describe('SkillsPanel index', () => {
  it('shows every category and every skill at once, with no scrolling list', () => {
    renderPanel()
    for (const category of CATEGORIES) {
      expect(screen.getByText(category.label)).toBeTruthy()
    }
    for (const { shortName } of FISCHER_POSITION) {
      expect(screen.getAllByText(shortName).length).toBeGreaterThan(0)
    }
  })

  it('counts the pieces in each category', () => {
    renderPanel()
    for (const category of CATEGORIES) {
      const count = FISCHER_POSITION.filter((e) => e.category === category.key).length
      const heading = screen.getByText(category.label).closest('h3')!
      expect(heading.textContent).toContain(String(count))
    }
  })

  it('labels each chip with the piece letter that locates it on the board', () => {
    renderPanel()
    for (const entry of FISCHER_POSITION) {
      const chip = screen.getByText(entry.shortName).closest('button')!
      expect(chip.textContent).toContain(pieceLetter(entry.pieceName))
    }
  })

  it('keeps descriptions out of the index', () => {
    renderPanel()
    for (const { description } of FISCHER_POSITION) {
      expect(screen.queryByText(description)).toBeNull()
    }
  })

  it('calls onSelectSkill with the pieceName when a chip is clicked', () => {
    const onSelectSkill = vi.fn()
    renderPanel({ onSelectSkill })
    const first = FISCHER_POSITION[0]
    fireEvent.click(screen.getByText(first.shortName))
    expect(onSelectSkill).toHaveBeenCalledWith(first.pieceName)
  })

  it('holds the index hidden until the board is ready, then rests without replaying', () => {
    const { container, rerender } = renderPanel({ entrance: 'waiting' })
    expect(container.querySelector('.skills--waiting')).toBeTruthy()
    rerender(
      <SkillsPanel selectedName={null} entrance="playing" onSelectSkill={noop} onClearSelection={noop} />,
    )
    expect(container.querySelector('.skills--playing')).toBeTruthy()
    rerender(
      <SkillsPanel selectedName={null} entrance="done" onSelectSkill={noop} onClearSelection={noop} />,
    )
    expect(container.querySelector('.skills--done')).toBeTruthy()
  })

  it('staggers each chip by the same delay its piece uses on the board', async () => {
    const { revealDelayMs } = await import('./entrance')
    const { container } = renderPanel({ entrance: 'playing' })
    for (const entry of FISCHER_POSITION) {
      const item = screen.getByText(entry.shortName).closest('li')!
      expect(item.style.animationDelay).toBe(`${revealDelayMs(entry.pieceName)}ms`)
    }
    expect(container.querySelectorAll('.column__item')).toHaveLength(FISCHER_POSITION.length)
  })
})

describe('SkillsPanel detail', () => {
  const target = FISCHER_POSITION[0]
  const category = CATEGORIES.find((c) => c.key === target.category)!

  it('gives the whole card over to the selected skill', () => {
    renderPanel({ selectedName: target.pieceName })
    expect(screen.getByRole('heading', { name: target.skillName })).toBeTruthy()
    expect(screen.getByText(target.description)).toBeTruthy()
    expect(screen.getByText(target.whyPiece)).toBeTruthy()
    expect(
      screen.getByText(`${category.label} · ${pieceLetter(target.pieceName)}${target.square}`),
    ).toBeTruthy()
  })

  it('replaces the index, leaving unrelated skills off the card', () => {
    renderPanel({ selectedName: target.pieceName })
    const unrelated = FISCHER_POSITION.find(
      (e) => e.pieceName !== target.pieceName && !target.related.includes(e.pieceName),
    )!
    expect(screen.queryByText(unrelated.shortName)).toBeNull()
  })

  it('offers the related pieces as a way onward', () => {
    const onSelectSkill = vi.fn()
    renderPanel({ selectedName: target.pieceName, onSelectSkill })
    const related = FISCHER_POSITION.find((e) => e.pieceName === target.related[0])!
    fireEvent.click(screen.getByText(related.shortName))
    expect(onSelectSkill).toHaveBeenCalledWith(related.pieceName)
  })

  it('says so plainly when no work is linked yet', () => {
    renderPanel({ selectedName: target.pieceName })
    expect(target.links).toHaveLength(0)
    expect(screen.getByText('Nothing linked here yet.')).toBeTruthy()
  })

  it('returns to the index via the back control', () => {
    const onClearSelection = vi.fn()
    renderPanel({ selectedName: target.pieceName, onClearSelection })
    fireEvent.click(screen.getByRole('button', { name: 'All skills' }))
    expect(onClearSelection).toHaveBeenCalled()
  })
})

describe('SkillsPanel timings', () => {
  it('drives the CSS animation durations from the shared entrance constants', async () => {
    const { ENTRANCE } = await import('./entrance')
    const { container } = renderPanel({ entrance: 'playing' })
    const panel = container.querySelector('.skills') as HTMLElement
    expect(panel.style.getPropertyValue('--item-in')).toBe(`${ENTRANCE.settleMs}ms`)
    expect(panel.style.getPropertyValue('--card-fade')).toBe(`${ENTRANCE.cardFadeMs}ms`)
  })
})

describe('SkillsPanel card swap', () => {
  afterEach(() => vi.useRealTimers())

  function rerenderWith(rerender: (ui: React.ReactElement) => void, selectedName: string | null) {
    rerender(
      <SkillsPanel
        selectedName={selectedName}
        entrance="done"
        onSelectSkill={noop}
        onClearSelection={noop}
      />,
    )
  }

  it('holds the outgoing card while it fades, rather than cutting to the new one', () => {
    vi.useFakeTimers()
    const target = FISCHER_POSITION[0]
    const { container, rerender } = renderPanel()
    rerenderWith(rerender, target.pieceName)

    // Still the index, now animating out.
    expect(container.querySelector('.swap--out')).toBeTruthy()
    expect(screen.queryByText(target.description)).toBeNull()
    expect(screen.getByText(FISCHER_POSITION[1].shortName)).toBeTruthy()
  })

  it('brings the new card in once the outgoing half has finished', () => {
    vi.useFakeTimers()
    const target = FISCHER_POSITION[0]
    const { container, rerender } = renderPanel()
    rerenderWith(rerender, target.pieceName)
    act(() => { vi.advanceTimersByTime(200) })

    expect(container.querySelector('.swap--in')).toBeTruthy()
    expect(screen.getByText(target.description)).toBeTruthy()
  })

  it('settles with no animation class once the swap is done', () => {
    vi.useFakeTimers()
    const target = FISCHER_POSITION[0]
    const { container, rerender } = renderPanel()
    rerenderWith(rerender, target.pieceName)
    act(() => { vi.advanceTimersByTime(200) })
    act(() => { vi.advanceTimersByTime(400) })

    expect(container.querySelector('.swap--idle')).toBeTruthy()
    expect(screen.getByText(target.description)).toBeTruthy()
  })

  it('exposes the swap durations to CSS', () => {
    const { container } = renderPanel()
    const panel = container.querySelector('.skills') as HTMLElement
    expect(panel.style.getPropertyValue('--swap-out')).toMatch(/^\d+ms$/)
    expect(panel.style.getPropertyValue('--swap-in')).toMatch(/^\d+ms$/)
  })
})
