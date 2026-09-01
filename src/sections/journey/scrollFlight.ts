/** 0 at the top of a scroll container, 1 at the bottom. */
export function scrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const range = scrollHeight - clientHeight
  if (range <= 0) return 0
  return Math.min(1, Math.max(0, scrollTop / range))
}

const SNAP = 1e-4

/**
 * Exponential approach with time constant `tau` — the same feel as the old
 * ScrollTrigger scrub: 0.5, which was a half-second catch-up. Snaps inside
 * SNAP so a settled scene stops producing sub-pixel camera motion.
 */
export function smoothToward(shown: number, target: number, dtSeconds: number, tau = 0.5): number {
  const next = target + (shown - target) * Math.exp(-dtSeconds / tau)
  return Math.abs(next - target) < SNAP ? target : next
}
