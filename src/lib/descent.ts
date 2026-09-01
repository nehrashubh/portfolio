/**
 * The descent is a camera moving *down* one continuous scene — sky, then the
 * cloud layer, then the ground. It is not a cross-fade and nothing ever fades:
 * the scene simply travels up past you as you scroll down.
 *
 * Depth comes from rate, not opacity. The content panels scroll at the page's
 * own speed (1×) while the scene behind them travels more slowly, so the
 * distant sky lags behind the text the way a real horizon does.
 */

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** How far through the descent track you are, 0 at the top, 1 at the ground. */
export function progressAt(scrollY: number, trackPx: number): number {
  if (trackPx <= 0) return 0
  return clamp01(scrollY / trackPx)
}

/**
 * Vertical offset of the scene column, in vh. Negative — the scene rises as
 * you descend into it. `travelVh` is how far the column moves across the whole
 * track, and is deliberately less than the panels' own travel: that difference
 * is the parallax.
 */
export function columnOffsetVh(progress: number, travelVh: number): number {
  const y = -clamp01(progress) * travelVh
  return y === 0 ? 0 : y
}

