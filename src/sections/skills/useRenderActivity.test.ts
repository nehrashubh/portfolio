import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecentChange, usePointerActivity } from './useRenderActivity'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useRecentChange', () => {
  it('starts true so the first frames are drawn', () => {
    const { result } = renderHook(() => useRecentChange('a', 500))
    expect(result.current).toBe(true)
  })

  it('falls to false once the window elapses', () => {
    const { result } = renderHook(() => useRecentChange('a', 500))
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBe(false)
  })

  it('goes false even while the same key is held, unlike a held-state flag', () => {
    const { result, rerender } = renderHook(({ k }) => useRecentChange(k, 500), {
      initialProps: { k: 'hovering-a-piece' },
    })
    rerender({ k: 'hovering-a-piece' })
    act(() => { vi.advanceTimersByTime(600) })
    expect(result.current).toBe(false)
  })

  it('reopens the window when the key changes', () => {
    const { result, rerender } = renderHook(({ k }) => useRecentChange(k, 500), {
      initialProps: { k: 'a' },
    })
    act(() => { vi.advanceTimersByTime(600) })
    expect(result.current).toBe(false)
    rerender({ k: 'b' })
    expect(result.current).toBe(true)
    act(() => { vi.advanceTimersByTime(400) })
    expect(result.current).toBe(true)
    act(() => { vi.advanceTimersByTime(150) })
    expect(result.current).toBe(false)
  })
})

describe('usePointerActivity', () => {
  function move() {
    act(() => { window.dispatchEvent(new Event('pointermove')) })
  }

  it('starts false', () => {
    const { result } = renderHook(() => usePointerActivity(400))
    expect(result.current).toBe(false)
  })

  it('is true while the pointer moves', () => {
    const { result } = renderHook(() => usePointerActivity(400))
    move()
    expect(result.current).toBe(true)
  })

  it('goes false after the pointer stops for idleMs', () => {
    const { result } = renderHook(() => usePointerActivity(400))
    move()
    act(() => { vi.advanceTimersByTime(400) })
    expect(result.current).toBe(false)
  })

  it('keeps extending while the pointer keeps moving', () => {
    const { result } = renderHook(() => usePointerActivity(400))
    move()
    act(() => { vi.advanceTimersByTime(300) })
    move()
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe(true)
    act(() => { vi.advanceTimersByTime(150) })
    expect(result.current).toBe(false)
  })

  it('stops listening once unmounted', () => {
    const { result, unmount } = renderHook(() => usePointerActivity(400))
    unmount()
    expect(() => move()).not.toThrow()
    expect(result.current).toBe(false)
  })
})
