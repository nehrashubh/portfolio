export type Vec3 = [number, number, number]

const WORLD_UP: Vec3 = [0, 1, 0]

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2])
  if (length === 0) throw new Error('cannot normalize a zero-length vector')
  return [v[0] / length, v[1] / length, v[2] / length]
}

/**
 * The camera's own axes for a camera sitting along `direction` and looking back
 * at the origin, matching three's lookAt convention: z points from the target
 * back toward the eye, x is right, y is up.
 */
export function cameraBasis(direction: Vec3): { x: Vec3; y: Vec3; z: Vec3 } {
  const z = normalize(direction)
  const x = normalize(cross(WORLD_UP, z))
  return { x, y: cross(z, x), z }
}

export function boxCorners(min: Vec3, max: Vec3): Vec3[] {
  const corners: Vec3[] = []
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) corners.push([x, y, z])
    }
  }
  return corners
}

/**
 * How far along `direction` the camera has to sit for every one of `points` to
 * land inside the frustum, with `margin` (1 = points touch the frame edge, 1.2
 * = 20% breathing room) applied as an effective narrowing of the field of view.
 *
 * For a camera at `direction * d` looking at the origin, a point p has view-space
 * depth (d - p·z) and offsets p·x / p·y — the d terms cancel because p·x and p·y
 * are measured on axes perpendicular to z. Staying inside the frustum then means
 * |p·x| <= (d - p·z) * tanH, which rearranges to the per-point lower bound on d
 * used below. Taking the max over every point fits them all.
 */
export function fitDistance(
  points: Vec3[],
  direction: Vec3,
  fovYRadians: number,
  aspect: number,
  margin = 1,
): number {
  if (points.length === 0) throw new Error('fitDistance needs at least one point')
  const { x, y, z } = cameraBasis(direction)
  const tanV = Math.tan(fovYRadians / 2) / margin
  const tanH = tanV * aspect

  let distance = 0
  for (const point of points) {
    const depthAlongZ = dot(point, z)
    distance = Math.max(
      distance,
      depthAlongZ + Math.abs(dot(point, x)) / tanH,
      depthAlongZ + Math.abs(dot(point, y)) / tanV,
    )
  }
  return distance
}

/**
 * The world-space point that appears at normalized device coords (`ndcX`/`ndcY`,
 * each -1..1 with +y up) at `depth` units in front of a camera positioned at
 * `direction * cameraDistance` and looking at the origin.
 *
 * Anchoring in NDC rather than world space is what keeps the flown piece framed
 * identically at every viewport size — a fixed world target drifts toward (and
 * eventually past) the canvas edge as the aspect ratio changes.
 */
export function screenPointToWorld(
  direction: Vec3,
  cameraDistance: number,
  fovYRadians: number,
  aspect: number,
  ndcX: number,
  ndcY: number,
  depth: number,
): Vec3 {
  const { x, y, z } = cameraBasis(direction)
  const tanV = Math.tan(fovYRadians / 2)
  const tanH = tanV * aspect
  const offsetX = ndcX * tanH * depth
  const offsetY = ndcY * tanV * depth

  // Camera sits at z * cameraDistance and looks down -z, so travelling `depth`
  // forward from it is a subtraction along z.
  return [
    z[0] * (cameraDistance - depth) + x[0] * offsetX + y[0] * offsetY,
    z[1] * (cameraDistance - depth) + x[1] * offsetX + y[1] * offsetY,
    z[2] * (cameraDistance - depth) + x[2] * offsetX + y[2] * offsetY,
  ]
}

/**
 * Pulls a screen anchor far enough inside the frame that a piece of the given
 * size resting there stays fully visible.
 *
 * The anchor names where the piece's *origin* goes, and a piece stands up from
 * its base, so aiming straight at a corner would hang its body over the edge —
 * which is exactly how a hand-tuned world-space target ends up clipped. Aiming
 * at the corner and clamping lets the caller say "as close to the card's title
 * as this piece will fit" once and have it hold at every viewport size.
 */
export function clampAnchor(
  ndcX: number,
  ndcY: number,
  radius: number,
  height: number,
  depth: number,
  fovYRadians: number,
  aspect: number,
  inset = 0,
): { x: number; y: number } {
  const tanV = Math.tan(fovYRadians / 2)
  const tanH = tanV * aspect
  const halfWidth = radius / (depth * tanH)
  const topReach = height / (depth * tanV)

  const limitX = Math.max(0, 1 - inset - halfWidth)
  const limitTop = Math.max(0, 1 - inset - topReach)
  const limitBottom = Math.max(0, 1 - inset)

  return {
    x: Math.min(limitX, Math.max(-limitX, ndcX)),
    y: Math.min(limitTop, Math.max(-limitBottom, ndcY)),
  }
}
