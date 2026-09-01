const SWAY_PERIOD = 4;
const SWAY_ROT = 0.028;
const SWAY_LIFT = 0.035;

/** Radians of lean per card-per-second of deck velocity. */
const LEAN_PER_VELOCITY = 0.012;
/** Ceiling on the lean. A flung deck can reach dozens of cards per second. */
export const MAX_LEAN = 0.09;

/** Slow breathing so the hands never look frozen. */
export function idleSway(elapsed: number, reduced: boolean): { lift: number; rotZ: number } {
  if (reduced) return { lift: 0, rotZ: 0 };
  const phase = (elapsed / SWAY_PERIOD) * Math.PI * 2;
  return {
    lift: Math.sin(phase) * SWAY_LIFT,
    rotZ: Math.sin(phase * 0.5) * SWAY_ROT,
  };
}

/**
 * How far the hands tilt for a given deck velocity.
 *
 * Negative because the deck's positive direction moves pills *up* the screen,
 * and hands carrying something that is rising lean back, not forward.
 *
 * This motion was tried on the cat and reverted — a face that fidgets reads
 * badly. Hands holding something are a different subject, but if it still reads
 * as fidgeting, LEAN_PER_VELOCITY is the one number to take to zero.
 */
export function leanForVelocity(velocity: number, reduced: boolean): number {
  if (reduced) return 0;
  const lean = -velocity * LEAN_PER_VELOCITY;
  return Math.max(-MAX_LEAN, Math.min(MAX_LEAN, lean));
}

/** Frame-rate independent exponential approach. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}
