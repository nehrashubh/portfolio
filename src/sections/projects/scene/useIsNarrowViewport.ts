import { useMediaQuery } from '../../../shared/useMediaQuery';

export const NARROW_BREAKPOINT = 900;

export function useIsNarrowViewport(breakpoint = NARROW_BREAKPOINT): boolean {
  return useMediaQuery(`(max-width: ${breakpoint}px)`);
}
