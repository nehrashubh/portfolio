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

/**
 * Eases a value toward a target by a fixed fraction each frame.
 *
 * Raw scroll arrives in discrete jumps — a mouse wheel moves in chunks of
 * ~100px — so driving the scene straight from scrollY makes it step. Chasing
 * the target instead makes the sky feel heavy and keeps it moving between
 * wheel events, which is what reads as gliding rather than stuttering.
 */
export function ease(current: number, target: number, factor: number): number {
  const next = current + (target - current) * factor
  // Stop chasing once the remaining distance is invisible, so the loop is not
  // writing a new transform forever on a stationary page.
  return Math.abs(target - next) < 0.001 ? target : next
}

/**
 * Frame-rate independent exponential damping.
 *
 * `lerp(current, target, 1 - e^(-lambda * dt))` is the closed form of
 * exponential decay sampled over `dt`, so the result after one 32ms frame is
 * identical to two 16ms frames. A plain `current += (target - current) * k`
 * is NOT: it runs twice as fast on a 120Hz display as on a 60Hz one, which is
 * why an earlier attempt at smoothing here felt different on different
 * machines and drifted on start and stop.
 *
 * `maxSpeed` caps how far the value may move per second regardless of how far
 * away the target is. That is what stops a flick of the wheel throwing the
 * scene: the input is accepted in full, but the scene refuses to chase it
 * faster than a walking pace.
 *
 * Both ideas are lifted from drei's ScrollControls, which is what clevir.li
 * uses — `damping` there is this lambda, `maxSpeed` this clamp.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dtSeconds: number,
  maxSpeed = Infinity,
): number {
  if (dtSeconds <= 0) return current
  const eased = current + (target - current) * (1 - Math.exp(-lambda * dtSeconds))
  const limit = maxSpeed * dtSeconds
  const delta = Math.min(limit, Math.max(-limit, eased - current))
  const next = current + delta
  // Settle exactly, so a stationary page stops writing new transforms.
  return Math.abs(target - next) < 1e-4 ? target : next
}
