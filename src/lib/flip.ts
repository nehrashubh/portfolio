export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Text scales by FONT SIZE, never by box width.
 *
 * A shrink-wrapped title (`width: fit-content`) and a full-width block <p>
 * have unrelated widths, so a width ratio produces a wildly wrong scale — the
 * bug that made the closing title fly back far too small.
 */
export function flipScale(fromFontPx: number, toFontPx: number): number {
  if (!toFontPx) return 1
  return fromFontPx / toFontPx
}

/** Positions `to` so it visually starts at `from`. Origin must be top-left. */
export function flipTransform(from: Box, to: Box, scale: number): string {
  const dx = from.left - to.left
  const dy = from.top - to.top
  return `translate(${dx}px, ${dy}px) scale(${scale})`
}
