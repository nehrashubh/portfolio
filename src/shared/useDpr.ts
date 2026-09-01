import { useMediaQuery } from './useMediaQuery'

/**
 * The dpr range to hand a <Canvas>. Phones get 1.5x at most: a 3x phone
 * rendering nine times the pixels of a 1x screen is the single biggest cost
 * any of these scenes has, and none of them gains anything visible above 1.5.
 * The caller cap is for scenes that are fill-rate bound even on desktop.
 */
export function useDpr(cap = 2): [number, number] {
  const coarse = useMediaQuery('(pointer: coarse)')
  return [1, Math.min(cap, coarse ? 1.5 : 2)]
}
