import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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
