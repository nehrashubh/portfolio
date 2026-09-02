/**
 * Where each pill sits, as a pure function of its signed distance from focus.
 *
 * Everything is in `cqw` — percent of the frame's *width* — including vertical
 * offsets, so that the axis angle below is a true angle rather than an angle in
 * whatever aspect ratio the viewport happens to be.
 */

export type PillLayout = {
  /** Horizontal offset in cqw. */
  x: number;
  /** Vertical offset in cqw. Negative is up. */
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  /** Only the focused pill may be opened or show the hover ring. */
  focused: boolean;
};

/**
 * The pill's width, only so the corridor constraint below can be checked.
 *
 * The pill *box* is sized in `deck.css`, which is the source of truth — this
 * duplicates one number of it rather than all four, and if the two ever disagree
 * the corridor test is measuring a deck that does not exist. Keep them in step.
 */
export const PILL_W = 34;

/**
 * Vertical step between slots. Fixed, because it decides how much of each pill
 * its neighbour covers (~31% at this pill height) — a legibility constraint, not
 * a stylistic one. The axis angle is therefore expressed as the *horizontal*
 * step derived from it, and not the other way round. The step was 7.4 against
 * an 11.8 pill (37% covered), which read as a crowded pile.
 */
export const STEP_Y = 10;

/** Axis angle from horizontal. The one number to change to re-lean the deck. */
export const AXIS_DEGREES = 65;

/**
 * How much of the frame's width the hands actually leave between them.
 *
 * Computed from the model's real bounds at the current `HAND_HEIGHT` and
 * `HAND_OVERHANG`, and pinned to them by a test in `scene/modelFraming.test.ts`
 * — change the hand size and that test fails until this is updated.
 *
 * A deck wider than this runs its outer pills under the fingers. At 65° the deck
 * is 52.7 and clears, but the margin is thin: the floor is about **64°**, so
 * there is barely a degree of room below the current axis. Enlarging the
 * hands, the pills or the vertical step would close it.
 */
export const HAND_CORRIDOR = 53.6;

/**
 * A phone shows the deck at 76cqw wide and 26cqw tall. At a 17 step each
 * pill covered 43% of its neighbour, which read as a heap rather than a
 * stack; 21 leaves about a fifth covered.
 */
export const STEP_Y_NARROW = 21;
/** Almost vertical: on a phone the hands are behind the deck, not beside it. */
export const AXIS_DEGREES_NARROW = 86;

const SCALE_PER_SLOT = 0.13;
/** Beyond this the pill is culled, just past the third slot. */
const CULL_DISTANCE = 2.55;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Horizontal step that puts the deck's axis at `degrees` from horizontal. */
export function stepXFor(degrees: number, stepY: number): number {
  return stepY / Math.tan((degrees * Math.PI) / 180);
}

/** How much of the frame's width a deck of ±2 visible slots occupies. */
export function deckSpan(pillWidth: number, stepX: number): number {
  return pillWidth + 4 * stepX;
}

export function layoutForSlot(d: number, narrow: boolean): PillLayout {
  const stepY = narrow ? STEP_Y_NARROW : STEP_Y;
  const stepX = stepXFor(narrow ? AXIS_DEGREES_NARROW : AXIS_DEGREES, stepY);
  const distance = Math.min(Math.abs(d), 2.6);

  // Piecewise, and the falloff is genuine translucency — not blur, not a
  // darkening. At the midpoint of a transition you see through the leaving pill
  // to the one behind it, which is what the reference does.
  const opacity =
    distance <= 1
      ? lerp(1, 0.62, distance)
      : distance <= 2
        ? lerp(0.62, 0.3, distance - 1)
        : lerp(0.3, 0, distance - 2);

  return {
    // Both signs negated together, which keeps the axis on exactly the same
    // diagonal and only reverses which way it travels. Advancing used to move
    // the pills DOWN the screen, so on a touchscreen the deck slid against
    // the finger: swipe up, content goes down. Now the next pill arrives from
    // below and the stack moves up, the way a list does.
    x: -d * stepX,
    y: d * stepY,
    scale: 1 - SCALE_PER_SLOT * distance,
    opacity,
    // The +1 breaks ties in favour of the pill that has already passed, so a
    // departing pill stays in front of the arriving one on its way out. The swap
    // as they cross is invisible because the departing pill is already
    // translucent by then.
    zIndex: 60 - Math.round(distance * 10) + (d < 0 ? 1 : 0),
    visible: distance < CULL_DISTANCE,
    focused: distance < 0.5,
  };
}
