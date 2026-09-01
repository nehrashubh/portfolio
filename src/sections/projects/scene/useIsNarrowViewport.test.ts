import { renderHook } from '@testing-library/react';
import { useIsNarrowViewport } from './useIsNarrowViewport';

const mockMatchMedia = (matches: boolean) => {
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
};

afterEach(() => vi.unstubAllGlobals());

describe('useIsNarrowViewport', () => {
  it('is true below the breakpoint', () => {
    mockMatchMedia(true);
    expect(renderHook(() => useIsNarrowViewport()).result.current).toBe(true);
  });

  it('is false above the breakpoint', () => {
    mockMatchMedia(false);
    expect(renderHook(() => useIsNarrowViewport()).result.current).toBe(false);
  });
});
