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
  const overflowsRight = screenX + labelWidth > viewportWidth
  const fitsLeft = screenX - labelWidth >= 0
  return overflowsRight && fitsLeft ? 'left' : 'right'
}
