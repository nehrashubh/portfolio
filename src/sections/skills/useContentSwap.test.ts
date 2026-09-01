import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContentSwap } from './useContentSwap'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const OUT = 130
const IN = 280

describe('useContentSwap', () => {
  it('shows the initial value immediately, with no transition', () => {
    const { result } = renderHook(() => useContentSwap('a', OUT, IN))
    expect(result.current).toEqual({ shown: 'a', phase: 'idle' })
  })

  it('holds the old content while it animates out', () => {
    const { result, rerender } = renderHook(({ v }) => useContentSwap(v, OUT, IN), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    expect(result.current.phase).toBe('out')
    expect(result.current.shown).toBe('a')
  })

  it('swaps to the new content once the outgoing half finishes', () => {
    const { result, rerender } = renderHook(({ v }) => useContentSwap(v, OUT, IN), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    act(() => { vi.advanceTimersByTime(OUT) })
    expect(result.current).toEqual({ shown: 'b', phase: 'in' })
  })

  it('settles back to idle after the incoming half finishes', () => {
    const { result, rerender } = renderHook(({ v }) => useContentSwap(v, OUT, IN), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    act(() => { vi.advanceTimersByTime(OUT) })
    act(() => { vi.advanceTimersByTime(IN) })
    expect(result.current).toEqual({ shown: 'b', phase: 'idle' })
  })

  it('lands on the newest value when the selection changes mid-transition', () => {
    const { result, rerender } = renderHook(({ v }) => useContentSwap(v, OUT, IN), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    act(() => { vi.advanceTimersByTime(60) })
    rerender({ v: 'c' })
    act(() => { vi.advanceTimersByTime(OUT) })
    expect(result.current.shown).toBe('c')
  })

  it('returns to the original value without stranding a half-finished swap', () => {
    const { result, rerender } = renderHook(({ v }) => useContentSwap(v, OUT, IN), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    act(() => { vi.advanceTimersByTime(60) })
    rerender({ v: 'a' })
    act(() => { vi.advanceTimersByTime(OUT) })
    act(() => { vi.advanceTimersByTime(IN) })
    expect(result.current).toEqual({ shown: 'a', phase: 'idle' })
  })

  it('swaps instantly when both durations are zero, for reduced motion', () => {
    const { result, rerender } = renderHook(({ v }) => useContentSwap(v, 0, 0), {
      initialProps: { v: 'a' },
    })
    rerender({ v: 'b' })
    expect(result.current).toEqual({ shown: 'b', phase: 'idle' })
  })

  it('handles null as a value rather than treating it as absent', () => {
    const { result, rerender } = renderHook(
      ({ v }) => useContentSwap<string | null>(v, OUT, IN),
      { initialProps: { v: 'a' as string | null } },
    )
    rerender({ v: null })
    expect(result.current.shown).toBe('a')
    act(() => { vi.advanceTimersByTime(OUT) })
    expect(result.current.shown).toBeNull()
  })
})
