import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion'

function mockMatchMedia(matches: boolean) {
  const mqlMock = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mqlMock) as unknown as typeof window.matchMedia
  return mqlMock
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReducedMotion', () => {
  it('returns false when the user has no motion preference set', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion: reduce matches', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates hook value when OS preference changes at runtime', () => {
    const mql = mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    const addEventListenerCall = mql.addEventListener.mock.calls[0]
    expect(addEventListenerCall[0]).toBe('change')
    const handler = addEventListenerCall[1] as EventListener

    act(() => {
      ;(handler as (e: { matches: boolean }) => void)({ matches: true })
    })

    expect(result.current).toBe(true)
  })

  it('removes event listener on unmount', () => {
    const mql = mockMatchMedia(false)
    const { unmount } = renderHook(() => useReducedMotion())
    const addEventListenerCall = mql.addEventListener.mock.calls[0]
    const handler = addEventListenerCall[1]

    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', handler)
  })
})
