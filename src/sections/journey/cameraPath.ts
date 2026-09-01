import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { WAYPOINTS } from './waypoints'
import { SHIP_CENTER } from './sceneBounds'

// How to tune the camera's flight:
//
// The camera swings around the airship, always looking at it, so the ship
// stays framed for the entire scroll. An earlier version flew a spline
// straight through the cloud formation, which buried the camera in the opaque
// cloud shell — clouds filled the frame as a mess of hard white polygon edges,
// and the ship left frame entirely for the back half.
//
// THE ANGLE RANGE IS EMPIRICALLY VALIDATED, NOT ARBITRARY.
//
// The cloud formation is not a simple shell with a clean outside; it is a
// layer with pockets, so no bounding-box test tells you whether the ship is
// actually visible from a given spot. These values come from rendering the
// scene all the way around the ship and looking at every frame: every angle
// in [-140, +50] has clear line of sight, while around +90 a cloud mass
// swings in front of it, and past ~5 units out the camera drifts into cloud
// that washes the whole shot flat.
//
// So: if you widen the range or push the radius past ~4, re-run that survey
// rather than trusting these numbers to still hold.
const ORBIT_MIN_DEG = -140
const ORBIT_MAX_DEG = 50

/** Kept for the framing maths in waypoints.ts. */
export const ORBIT_RADIUS = 3.5

// The shape of the flight, as keyframes rather than a formula.
//
// This used to be a literal circle: constant radius, and the angle simply
// lerped from one end of the range to the other. That is what made the motion
// read as mechanical — a camera tracking round a fixed rail at a fixed rate
// has no shape to it, and no amount of smoothing hides that.
//
// These keys break the circle. The radius breathes in and out and the height
// rises and falls more than once, out of phase with each other, so the camera
// swoops through the scene instead of orbiting it. Keep the values inside the
// validated envelope above: radius roughly 3.2-3.9, height 0-0.9.
type OrbitKey = { deg: number; radius: number; height: number }

// Five keys, not seven. An earlier seven-key version oscillated the radius
// three times over the same span and put a 5-degree kink in the heading —
// enough to read as a flick mid-scroll. Fewer, broader swings give the same
// "not on rails" feel with the sharpest heading change down to ~3 degrees.
// cameraPath.test.ts asserts that ceiling, so a kink cannot creep back in.
const ORBIT_KEYS: OrbitKey[] = [
  { deg: ORBIT_MIN_DEG, radius: 3.85, height: 0.1 },
  { deg: -92, radius: 3.3, height: 0.62 },
  { deg: -40, radius: 3.7, height: 0.3 },
  { deg: 8, radius: 3.35, height: 0.72 },
  { deg: ORBIT_MAX_DEG, radius: 3.8, height: 0.18 },
]

function keyToPoint({ deg, radius, height }: OrbitKey): Vector3 {
  const angle = MathUtils.degToRad(deg)
  return new Vector3(
    SHIP_CENTER.x + radius * Math.sin(angle),
    SHIP_CENTER.y + height,
    SHIP_CENTER.z + radius * Math.cos(angle),
  )
}

// 'centripetal' rather than the default 'catmullrom': with control points
// spaced unevenly — which these deliberately are — a uniform Catmull-Rom
// overshoots and can loop back on itself near the tighter keys. Centripetal
// parameterisation is guaranteed not to cusp or self-intersect, which is
// precisely the property a camera path needs.
export const cameraCurve = new CatmullRomCurve3(
  ORBIT_KEYS.map(keyToPoint),
  false,
  'centripetal',
  0.5,
)

// The content spine: where the waypoint markers live and what's drawn as the
// visible path line (PathLine.tsx). It sits inside the camera's flight, near
// the ship, so markers stay in frame as the camera sweeps around.
export const contentCurve = new CatmullRomCurve3(
  WAYPOINTS.map(({ position }) => new Vector3(...position)),
  false,
  'catmullrom',
  0.5,
)

/** Exported as `curve` for the path-visualization line (PathLine.tsx). */
export const curve = contentCurve

export type CameraPose = {
  position: Vector3
  lookAt: Vector3
}

export function getCameraPose(progress: number): CameraPose {
  const t = Math.min(Math.max(progress, 0), 1)
  return {
    // getPointAt, not getPoint: arc-length parameterised, so the camera
    // covers equal DISTANCE per unit of scroll. Sampling the spline raw would
    // make it hurry through the tightly-spaced keys and crawl through the
    // loose ones — the scroll would feel like it kept changing gear even
    // though the path itself is smooth.
    position: cameraCurve.getPointAt(t),
    // Fixed on the ship: it is the subject of the shot, so it stays framed
    // for the entire scroll instead of drifting out of view.
    lookAt: SHIP_CENTER.clone(),
  }
}

/** Angle about the ship in the XZ plane, in degrees, at `t`. */
export function orbitAngleDeg(t: number): number {
  const p = getCameraPose(t).position
  return MathUtils.radToDeg(Math.atan2(p.x - SHIP_CENTER.x, p.z - SHIP_CENTER.z))
}
