/** 0 at the top of a scroll container, 1 at the bottom. */
export function scrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const range = scrollHeight - clientHeight
  if (range <= 0) return 0
  return Math.min(1, Math.max(0, scrollTop / range))
}

const SNAP = 1e-4

/**
 * Exponential approach with time constant `tau`.
 *
 * The old ScrollTrigger scrub was 0.5s, and inherited as such. That is a long
 * way behind: the camera kept travelling for half a second after the wheel
 * stopped, so the marker lit and the label shown belonged to where you had
 * been rather than where the scrollbar now was. 0.3 still glides and stays
 * with you. Snaps inside SNAP so a settled scene stops moving at all.
 */
export function smoothToward(shown: number, target: number, dtSeconds: number, tau = 0.3): number {
  const next = target + (shown - target) * Math.exp(-dtSeconds / tau)
  return Math.abs(next - target) < SNAP ? target : next
}
