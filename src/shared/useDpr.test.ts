import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDpr } from './useDpr'

function mockPointer(coarse: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarse : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe('useDpr', () => {
  afterEach(() => vi.restoreAllMocks())

  it('allows 2x on a fine pointer', () => {
    mockPointer(false)
    const { result } = renderHook(() => useDpr())
    expect(result.current).toEqual([1, 2])
  })

  it('caps at 1.5x on a coarse pointer', () => {
    mockPointer(true)
    const { result } = renderHook(() => useDpr())
    expect(result.current).toEqual([1, 1.5])
  })

  it('never exceeds the caller cap', () => {
    mockPointer(false)
    const { result } = renderHook(() => useDpr(1.5))
    expect(result.current).toEqual([1, 1.5])
  })
})
