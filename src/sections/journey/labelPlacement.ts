import { Vector3 } from 'three'
import type { Camera } from 'three'

export type ScreenPoint = { x: number; y: number; visible: boolean }
export type LabelSide = 'left' | 'right'

/** Reused across frames — projection runs once per label per frame. */
const scratch = new Vector3()

/**
 * Project a world position into CSS pixel coordinates.
 *
 * `visible` is false when the point is behind the camera. That check matters:
 * `Vector3.project` still returns finite coordinates for points behind the
 * viewer, mirrored back into frame, so without it a waypoint you have already
 * flown past pops its label back on screen at a plausible-looking position.
 */
export function projectToScreen(
  world: Vector3,
  camera: Camera,
  width: number,
  height: number,
): ScreenPoint {
  scratch.copy(world).project(camera)
  return {
    x: (scratch.x * 0.5 + 0.5) * width,
    // NDC y points up, CSS y points down.
    y: (-scratch.y * 0.5 + 0.5) * height,
    visible: scratch.z <= 1,
  }
}

/**
 * Which side of the marker the label body sits on.
 *
 * Right by default. Flips left only when the label would run off the right
 * edge AND there is room on the left — in a viewport too narrow for either,
 * right wins, because clipping against the right edge still leaves the start
 * of each line readable whereas clipping against x = 0 does not.
 */
export function chooseLabelSide(
  screenX: number,
  labelWidth: number,
  viewportWidth: number,
): LabelSide {
  const overflowsRight = screenX + CARD_GAP + labelWidth > viewportWidth
  const fitsLeft = screenX - CARD_GAP - labelWidth >= 0
  return overflowsRight && fitsLeft ? 'left' : 'right'
}

/** Inset from every frame edge, in CSS pixels. */
const EDGE_PAD = 16
/** Half the tallest card: the card is centred on its anchor vertically. */
const HALF_CARD = 140
/** Gap between the marker and the card's near edge; journey.css offsets the
 *  body by the same amount. Wide enough to clear a stamp at full size. */
export const CARD_GAP = 44

export type ClampedAnchor = { x: number; y: number; clamped: boolean }

/**
 * Keeps a label's body inside the frame even when its marker is not.
 *
 * On a portrait phone the 60° vertical field of view leaves only ~32° across,
 * so a marker held 25° off-centre — in frame on any landscape screen — sits
 * outside it. The label still has to be read, so its anchor is pulled back
 * to the nearest point that shows the whole body. `clamped` tells the caller
 * the leader no longer points at anything, so it can dim it.
 */
export function clampAnchor(
  x: number,
  y: number,
  side: LabelSide,
  labelWidth: number,
  viewportWidth: number,
  viewportHeight: number,
): ClampedAnchor {
  // Card geometry from journey.css: a right-side card starts CARD_GAP right
  // of the anchor; a left-side card ends CARD_GAP left of it.
  const minX = side === 'right' ? EDGE_PAD - CARD_GAP : EDGE_PAD + CARD_GAP + labelWidth
  const maxX =
    side === 'right' ? viewportWidth - EDGE_PAD - CARD_GAP - labelWidth : viewportWidth - EDGE_PAD + CARD_GAP
  const minY = EDGE_PAD + HALF_CARD
  const maxY = viewportHeight - EDGE_PAD - HALF_CARD

  const cx = Math.min(Math.max(x, minX), Math.max(minX, maxX))
  const cy = Math.min(Math.max(y, minY), Math.max(minY, maxY))
  return { x: cx, y: cy, clamped: cx !== x || cy !== y }
}
