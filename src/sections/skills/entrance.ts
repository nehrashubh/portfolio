import { CATEGORIES, FISCHER_POSITION } from './fischerPosition'

/**
 * Timings for the opening sequence, shared by the board and the panel so a
 * piece and its row arrive on the same beat. That coupling is the point: it
 * shows which row belongs to which piece before anyone hovers anything.
 */
export const ENTRANCE = {
  /** The card's own fade, which runs while the first pieces are still landing. */
  cardFadeMs: 380,
  /** Quiet beat before the first piece arrives. */
  leadInMs: 220,
  /** Gap between one piece landing and the next. */
  stepMs: 55,
  /** How long a single piece takes to settle onto its square. */
  settleMs: 520,
}

/**
 * The order pieces arrive in: category by category, matching the order the
 * index columns read. Reading order and landing order are the same sequence.
 */
export const REVEAL_ORDER: string[] = CATEGORIES.flatMap((category) =>
  FISCHER_POSITION.filter((entry) => entry.category === category.key).map((entry) => entry.pieceName),
)

const DELAYS = new Map(
  REVEAL_ORDER.map((pieceName, index) => [pieceName, ENTRANCE.leadInMs + index * ENTRANCE.stepMs]),
)

/** Milliseconds from the start of the sequence until this piece begins landing. */
export function revealDelayMs(pieceName: string): number {
  return DELAYS.get(pieceName) ?? ENTRANCE.leadInMs
}

/** Total run time, used to know when the render loop can idle again. */
export const ENTRANCE_DURATION_MS =
  ENTRANCE.leadInMs + Math.max(0, REVEAL_ORDER.length - 1) * ENTRANCE.stepMs + ENTRANCE.settleMs
