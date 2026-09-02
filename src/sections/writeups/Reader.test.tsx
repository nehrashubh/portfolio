import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Book from './components/Book'
import Reader from './components/Reader'
import { index } from './data/writeups'

describe('Reader', () => {
  it('consumes Escape so the section overlay does not also close', () => {
    const onClose = vi.fn()
    const w = index.writeups.find((x) => x.openable)!
    render(
      <Reader writeup={w} glossary={index.glossary} onClose={onClose} onOpenWriteup={() => {}} />,
    )
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })
})

describe('Book', () => {
  const openable = index.writeups.find((w) => w.openable)!

  it('opens on a tap', async () => {
    const onOpen = vi.fn()
    render(<Book writeup={openable} onOpen={onOpen} onHover={() => {}} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith(openable)
  })

  it('shows the card on a hold, and that hold does not open the writeup', async () => {
    vi.useFakeTimers()
    const onOpen = vi.fn()
    const onHover = vi.fn()
    render(<Book writeup={openable} onOpen={onOpen} onHover={onHover} />)
    const button = screen.getByRole('button')

    fireEvent.touchStart(button, { touches: [{ clientX: 0, clientY: 0 }] })
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(onHover).toHaveBeenCalledWith(openable, expect.anything())

    fireEvent.touchEnd(button)
    fireEvent.click(button)
    expect(onOpen).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('does not raise the card when the finger moves away before the hold lands', () => {
    vi.useFakeTimers()
    const onHover = vi.fn()
    render(<Book writeup={openable} onOpen={() => {}} onHover={onHover} />)
    const button = screen.getByRole('button')
    fireEvent.touchStart(button, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchMove(button)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(onHover).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('Reader closing', () => {
  const openable = index.writeups.find((w) => w.openable)!

  it('completes its close even when the section re-renders during the exit', () => {
    // The regression: the exit timer used to be cleaned up by an effect keyed
    // on requestClose, which changes identity whenever the section re-renders
    // — as it does every time a book is hovered. A re-render inside the 240ms
    // exit cancelled the close, and the reader was left mounted but invisible
    // and unable to close or reopen.
    vi.useFakeTimers()
    const onClose = vi.fn()
    const Wrapper = ({ tick }: { tick: number }) => (
      <Reader
        writeup={openable}
        glossary={index.glossary}
        // A new function identity on every render, exactly as an inline
        // arrow in the section would be.
        onClose={() => onClose(tick)}
        onOpenWriteup={() => {}}
      />
    )
    const { rerender } = render(<Wrapper tick={0} />)
    fireEvent.click(screen.getByLabelText('Close writeup'))
    rerender(<Wrapper tick={1} />)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
