/**
 * Framing for the 3D stage, in terms the camera math can consume directly.
 *
 * `anchorX`/`anchorY` are where a selected piece comes to rest, in normalized
 * device coords (-1..1, +y up). They are aimed at a corner and then clamped
 * against the piece's own on-screen size, so "as close to the skills card's
 * title as the piece will fit" holds at every viewport size instead of being
 * a world-space position tuned by eye against one layout.
 *
 * `anchorDepth` is that rest point's distance from the camera as a fraction of
 * the camera's own distance — under 1 brings the piece in front of the board,
 * so it reads as picked up rather than pushed aside. `anchorInset` is extra
 * breathing room past the piece's own footprint, in NDC.
 */
export type StageLayout = {
  fitMargin: number
  anchorX: number
  anchorY: number
  anchorDepth: number
  anchorInset: number
}

/**
 * Board beside the skills panel: the piece flies to the top right of the stage,
 * up against the gap, so it comes to rest alongside the card's title.
 */
export const WIDE_LAYOUT: StageLayout = {
  fitMargin: 1.1,
  anchorX: 1,
  anchorY: 1,
  anchorDepth: 0.66,
  anchorInset: 0.03,
}

/**
 * Board stacked above the skills panel: the card's title is directly below the
 * stage, so the piece rests low and right — as near the title as it can get
 * without dropping out of the canvas.
 */
export const NARROW_LAYOUT: StageLayout = {
  fitMargin: 1.06,
  anchorX: 1,
  anchorY: -0.5,
  anchorDepth: 0.56,
  anchorInset: 0.03,
}

/** Kept in step with the breakpoint in index.css. */
export const NARROW_QUERY = '(max-width: 900px)'
