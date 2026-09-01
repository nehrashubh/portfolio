/**
 * Pure carousel motion. No three.js, no React, no DOM — everything here is a
 * plain function of its arguments so it can be tested directly.
 *
 * The carousel's whole state is one unbounded float, `position`, measured in
 * cards, plus an optional `target` it is travelling to. Card `i` sits at slot
 * `wrapOffset(i, position, count)`, the signed distance from focus wrapped into
 * [-count/2, count/2). That wrap is what makes the loop endless in both
 * directions.
 *
 * Where each card then goes on screen is `deck/deckLayout.ts`'s business, not
 * this module's.
 */

export type CarouselState = {
  position: number;
  velocity: number;
  /**
   * A slot the deck is travelling to, or null when it is free-running.
   *
   * The distinction matters because the settle spring is otherwise gated on
   * velocity: a click from a standstill would never engage it and the deck would
   * sit still. With a target set the spring is always on.
   */
  target: number | null;
};

// --- Motion tuning --------------------------------------------------------
// Measured against a screen recording of the reference component: one notch per
// gesture, settling in ~430ms with a long decelerating tail. Do not retune.

/** Exponential coast decay, per second. */
const DAMPING = 6;
/** Below this speed the snap spring takes over. */
const SETTLE_VELOCITY = 1.2;
const SNAP_STIFFNESS = 90;
/** Critically damped: 2 * sqrt(stiffness). Settles in about 420ms. */
const SNAP_DAMPING = 2 * Math.sqrt(SNAP_STIFFNESS);
const REST_EPSILON = 1e-3;

/** Velocity that coasts almost exactly one card before snapping. */
export const NUDGE_VELOCITY = 6.6;
/** Pixels of pointer drag per card. */
export const DRAG_PX_PER_SLOT = 320;

const WHEEL_PX_TO_VELOCITY = NUDGE_VELOCITY / 100;
const LINE_HEIGHT_PX = 16;
const PAGE_HEIGHT_PX = 800;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** True when the list is long enough that wrapping can't show a card twice. */
const canWrap = (count: number) => count >= 3;

export function wrapOffset(index: number, position: number, count: number): number {
  if (count <= 0) return 0;
  if (!canWrap(count)) return index - position;
  const half = count / 2;
  return ((((index - position + half) % count) + count) % count) - half;
}

/**
 * The absolute position that focuses `index`, travelling whichever way round is
 * shorter — so clicking the pill above card 0 goes back one, not forward seven.
 *
 * Measured from any outstanding target rather than the live position, so two
 * clicks in a row compose instead of aiming at whatever fraction the deck
 * happened to be passing through.
 */
export function targetFor(state: CarouselState, index: number, count: number): number {
  if (count <= 0) return 0;
  const from = state.target ?? state.position;
  const half = count / 2;
  const delta =
    count >= 3 ? ((((index - from + half) % count) + count) % count) - half : index - from;
  return from + delta;
}

/** Adds velocity, and abandons any travel — a direct manipulation wins. */
export function applyImpulse(state: CarouselState, deltaVelocity: number): CarouselState {
  return { position: state.position, velocity: state.velocity + deltaVelocity, target: null };
}

export function nudge(state: CarouselState, direction: 1 | -1): CarouselState {
  return applyImpulse(state, direction * NUDGE_VELOCITY);
}

export function wheelToVelocity(deltaY: number, deltaMode: number): number {
  const px =
    deltaMode === 1 ? deltaY * LINE_HEIGHT_PX : deltaMode === 2 ? deltaY * PAGE_HEIGHT_PX : deltaY;
  return px * WHEEL_PX_TO_VELOCITY;
}

export function step(state: CarouselState, dt: number, count: number): CarouselState {
  if (count <= 0) return { position: 0, velocity: 0, target: null };
  if (dt <= 0) return state;

  let { position, velocity } = state;
  const { target } = state;

  velocity *= Math.exp(-DAMPING * dt);

  const goal = target ?? Math.round(position);
  if (target !== null || Math.abs(velocity) < SETTLE_VELOCITY) {
    velocity += ((goal - position) * SNAP_STIFFNESS - velocity * SNAP_DAMPING) * dt;
  }

  position += velocity * dt;

  if (target !== null) {
    if (Math.abs(goal - position) < REST_EPSILON && Math.abs(velocity) < REST_EPSILON * 10) {
      return { position: goal, velocity: 0, target: null };
    }
    // Deliberately not wrapped: folding position back into [0, count) while a
    // target is outstanding moves the goalposts and the deck lurches.
    return { position, velocity, target };
  }

  if (canWrap(count)) {
    // Keep position inside the list so long sessions can't accumulate float
    // error. wrapOffset is modular, so this is invisible on screen.
    position = ((position % count) + count) % count;
  } else {
    position = clamp(position, 0, count - 1);
    if (position === 0 || position === count - 1) velocity = 0;
  }

  const nearest = Math.round(position);
  if (Math.abs(velocity) < REST_EPSILON && Math.abs(position - nearest) < REST_EPSILON) {
    position = ((nearest % count) + count) % count;
    velocity = 0;
  }

  return { position, velocity, target: null };
}
