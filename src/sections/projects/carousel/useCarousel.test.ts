import { act, renderHook } from '@testing-library/react';
import { useCarousel } from './useCarousel';

const advanceSeconds = (advance: (dt: number) => unknown, seconds: number) => {
  act(() => {
    for (let i = 0; i < seconds * 60; i++) advance(1 / 60);
  });
};

describe('useCarousel', () => {
  it('starts focused on the first card', () => {
    const { result } = renderHook(() => useCarousel(8));
    expect(result.current.stateRef.current.position).toBe(0);
  });

  it('advances a card when the wheel is scrolled down', () => {
    const { result } = renderHook(() => useCarousel(8));
    act(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, deltaMode: 0 }));
    });
    advanceSeconds(result.current.advance, 4);
    expect(result.current.stateRef.current.position).toBeCloseTo(1, 3);
  });

  it('goes back a card when the wheel is scrolled up, wrapping past the start', () => {
    const { result } = renderHook(() => useCarousel(8));
    act(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, deltaMode: 0 }));
    });
    advanceSeconds(result.current.advance, 4);
    expect(result.current.stateRef.current.position).toBeCloseTo(7, 3);
  });

  it('moves one card per arrow key', () => {
    const { result } = renderHook(() => useCarousel(8));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    advanceSeconds(result.current.advance, 4);
    expect(result.current.stateRef.current.position).toBeCloseTo(1, 3);
  });

  it('drags with the pointer, following the finger before release', () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    try {
      const { result } = renderHook(() => useCarousel(8));
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerdown', { clientY: 500, pointerId: 1 }));
        // A human drag of 160px takes time; without advancing the clock the
        // sample interval is ~0 and the release velocity is meaningless.
        vi.advanceTimersByTime(100);
        window.dispatchEvent(new PointerEvent('pointermove', { clientY: 340, pointerId: 1 }));
      });
      // Dragging up by half a card's worth of pixels moves half a card forward,
      // immediately, without waiting for the spring.
      expect(result.current.stateRef.current.position).toBeGreaterThan(0.3);
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup', { clientY: 340, pointerId: 1 }));
      });
      advanceSeconds(result.current.advance, 4);
      expect(result.current.stateRef.current.position).toBeCloseTo(1, 3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('caps the fling when pointer samples arrive back to back', () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    try {
      const { result } = renderHook(() => useCarousel(8));
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerdown', { clientY: 900, pointerId: 1 }));
        // No time advance at all: a real browser can deliver two moves under a
        // millisecond apart, and dividing by that interval must not fling the
        // carousel across the whole list.
        window.dispatchEvent(new PointerEvent('pointermove', { clientY: 100, pointerId: 1 }));
        window.dispatchEvent(new PointerEvent('pointerup', { clientY: 100, pointerId: 1 }));
      });
      advanceSeconds(result.current.advance, 6);
      const travelled = result.current.stateRef.current.position;
      // 800px of drag is 2.5 cards; the capped coast adds a few more, but it
      // must not lap the eight-card list.
      expect(travelled).toBeGreaterThan(2);
      expect(travelled).toBeLessThan(8);
      expect(Number.isInteger(Math.round(travelled * 1000) / 1000)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('travels to a card asked for by index', () => {
    const { result } = renderHook(() => useCarousel(8));
    act(() => result.current.focusOn(5));
    advanceSeconds(result.current.advance, 4);
    expect(result.current.stateRef.current.position).toBeCloseTo(5, 3);
  });

  it('does not teleport there — the deck is still short of the card one frame in', () => {
    const { result } = renderHook(() => useCarousel(8));
    // Card 2 is two forward; card 5 would be three *back*, which is the shorter
    // way round and would make the direction of this assertion ambiguous.
    act(() => result.current.focusOn(2));
    // The target is set, but nothing has moved yet.
    expect(result.current.stateRef.current.position).toBe(0);
    advanceSeconds(result.current.advance, 1 / 60);
    const afterOneFrame = result.current.stateRef.current.position;
    expect(afterOneFrame).toBeGreaterThan(0);
    expect(afterOneFrame).toBeLessThan(2);
  });

  it('lets a wheel event cancel travel and take over', () => {
    const { result } = renderHook(() => useCarousel(8));
    act(() => result.current.focusOn(5));
    act(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, deltaMode: 0 }));
    });
    expect(result.current.stateRef.current.target).toBeNull();
    advanceSeconds(result.current.advance, 4);
    // One notch forward from 0, not all the way to 5.
    expect(result.current.stateRef.current.position).toBeCloseTo(1, 3);
  });

  it('ignores a pointer release that never really moved, so clicks do not fling', () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    try {
      const { result } = renderHook(() => useCarousel(8));
      act(() => {
        window.dispatchEvent(new PointerEvent('pointerdown', { clientY: 400, pointerId: 1 }));
        vi.advanceTimersByTime(16);
        // Two pixels of jitter, as a real click on a pill produces.
        window.dispatchEvent(new PointerEvent('pointermove', { clientY: 398, pointerId: 1 }));
        window.dispatchEvent(new PointerEvent('pointerup', { clientY: 398, pointerId: 1 }));
      });
      advanceSeconds(result.current.advance, 4);
      expect(result.current.stateRef.current.position).toBeCloseTo(0, 3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('binds nothing at all when disabled, so an open card is undisturbed', () => {
    const { result } = renderHook(() => useCarousel(8, false));
    act(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, deltaMode: 0 }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(result.current.stateRef.current.velocity).toBe(0);
    advanceSeconds(result.current.advance, 4);
    expect(result.current.stateRef.current.position).toBeCloseTo(0, 3);
  });

  it('takes the short way round when focusing across the seam', () => {
    const { result } = renderHook(() => useCarousel(8));
    act(() => result.current.focusOn(7));
    advanceSeconds(result.current.advance, 4);
    // Card 7 is one step *back* from card 0, so it must not travel forwards
    // through 1..6 to get there.
    expect(result.current.stateRef.current.position).toBeCloseTo(7, 3);
  });

  it('detaches its listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useCarousel(8));
    unmount();
    act(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, deltaMode: 0 }));
    });
    expect(result.current.stateRef.current.velocity).toBe(0);
  });
});
