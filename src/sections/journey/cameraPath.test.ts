import { describe, it, expect } from 'vitest'
import { MathUtils, Vector3 } from 'three'
import { getCameraPose, cameraCurve, contentCurve, orbitAngleDeg, ORBIT_RADIUS } from './cameraPath'
import { SHIP_CENTER } from './sceneBounds'
import { WAYPOINTS } from './waypoints'

/** Sample the whole journey densely — invariants must hold at every t. */
const SAMPLES = Array.from({ length: 201 }, (_, i) => i / 200)

describe('getCameraPose', () => {
  // The camera sits inside the cloud formation's bounding box the whole way,
  // which is fine: the formation is a layer with pockets, and the ship lives
  // in one. What matters is the angular range, surveyed by rendering the
  // scene all the way around — see the comment in cameraPath.ts. Around +90
  // a cloud mass swings in front of the ship, so the arc must not reach it.
  it('stays within the angular range surveyed to have line of sight', () => {
    for (const t of SAMPLES) {
      const angle = orbitAngleDeg(t)
      expect(angle).toBeGreaterThanOrEqual(-140)
      expect(angle).toBeLessThanOrEqual(50)
    }
  })

  it('keeps the ship at a workable viewing distance throughout', () => {
    const distances = SAMPLES.map((t) => getCameraPose(t).position.distanceTo(SHIP_CENTER))
    // Past ~5 units the camera drifts into cloud that washes the shot flat,
    // and closer than ~3 the ship starts overflowing the frame. The path
    // deliberately breathes within that band rather than holding one radius.
    expect(Math.min(...distances)).toBeGreaterThan(3)
    expect(Math.max(...distances)).toBeLessThan(4.2)
  })

  it('breathes rather than tracking a fixed circle', () => {
    const distances = SAMPLES.map((t) => getCameraPose(t).position.distanceTo(SHIP_CENTER))
    const spread = Math.max(...distances) - Math.min(...distances)
    // A constant-radius orbit reads as mechanical. The radius must actually
    // vary — this is the property that stops it looking like a fixed rail.
    expect(spread).toBeGreaterThan(0.3)
  })

  it('changes height more than once, so the flight is not a flat ring', () => {
    const heights = SAMPLES.map((t) => getCameraPose(t).position.y)
    let turns = 0
    for (let i = 2; i < heights.length; i++) {
      const before = heights[i - 1] - heights[i - 2]
      const after = heights[i] - heights[i - 1]
      if (before > 1e-6 && after < -1e-6) turns++
      if (before < -1e-6 && after > 1e-6) turns++
    }
    expect(turns).toBeGreaterThanOrEqual(2)
  })

  it('always looks at the ship, so the model is framed the whole way', () => {
    for (const t of SAMPLES) {
      expect(getCameraPose(t).lookAt.distanceTo(SHIP_CENTER)).toBeLessThan(0.01)
    }
  })

  it('sweeps around the ship rather than doubling back', () => {
    const angles = SAMPLES.map((t) => {
      const p = getCameraPose(t).position
      return Math.atan2(p.x - SHIP_CENTER.x, p.z - SHIP_CENTER.z)
    })
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]).toBeGreaterThan(angles[i - 1])
    }
  })

  it('covers equal distance per unit of scroll', () => {
    const steps = SAMPLES.slice(1).map((t, i) =>
      getCameraPose(t).position.distanceTo(getCameraPose(SAMPLES[i]).position),
    )
    const mean = steps.reduce((a, b) => a + b, 0) / steps.length
    // Arc-length parameterisation should make every step near-identical. A
    // step much bigger than the mean means the camera speeds up partway
    // through — the "changing gear" feel, which is a property of the sampling
    // rather than of the path's shape.
    expect(Math.max(...steps)).toBeLessThan(mean * 1.2)
    expect(Math.min(...steps)).toBeGreaterThan(mean * 0.8)
  })

  it('never changes direction sharply', () => {
    const points = SAMPLES.map((t) => getCameraPose(t).position)
    let worst = 0
    for (let i = 2; i < points.length; i++) {
      const a = points[i - 1].clone().sub(points[i - 2])
      const b = points[i].clone().sub(points[i - 1])
      if (a.length() < 1e-9 || b.length() < 1e-9) continue
      worst = Math.max(worst, a.angleTo(b))
    }
    // Between adjacent samples the heading must barely change. This is what
    // "fluid" means mechanically: a kink here would be a visible flick.
    expect(worst).toBeLessThan(MathUtils.degToRad(4))
  })

  it('clamps progress outside [0, 1]', () => {
    const below = getCameraPose(-0.5)
    const at0 = getCameraPose(0)
    expect(below.position.equals(at0.position)).toBe(true)
    expect(below.lookAt.equals(at0.lookAt)).toBe(true)

    const above = getCameraPose(1.5)
    const at1 = getCameraPose(1)
    expect(above.position.equals(at1.position)).toBe(true)
    expect(above.lookAt.equals(at1.lookAt)).toBe(true)
  })
})

describe('curves', () => {
  it('exposes a content spine distinct from the camera orbit', () => {
    const t = 0.5
    expect(cameraCurve.getPointAt(t).distanceTo(contentCurve.getPointAt(t))).toBeGreaterThan(1)
  })

  it('keeps the whole content spine inside the camera orbit, so markers stay in view', () => {
    for (const t of SAMPLES) {
      expect(contentCurve.getPointAt(t).distanceTo(SHIP_CENTER)).toBeLessThan(ORBIT_RADIUS)
    }
  })

  it('draws a route that rolls up and down, not a flat ring', () => {
    const heights = SAMPLES.map((t) => contentCurve.getPointAt(t).y)
    let turns = 0
    for (let i = 2; i < heights.length; i++) {
      const before = heights[i - 1] - heights[i - 2]
      const after = heights[i] - heights[i - 1]
      if (before > 1e-6 && after < -1e-6) turns++
      if (before < -1e-6 && after > 1e-6) turns++
    }
    // A constant-radius spine with a single height arc reads as a ring
    // hanging in space, however much the camera itself swoops. The drawn
    // line has to have shape of its own.
    expect(turns).toBeGreaterThanOrEqual(2)
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.5)
  })

  it('varies its distance from the ship rather than holding one radius', () => {
    const radii = SAMPLES.map((t) => {
      const p = contentCurve.getPointAt(t)
      return Math.hypot(p.x - SHIP_CENTER.x, p.z - SHIP_CENTER.z)
    })
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(0.15)
  })

  it('does not kink', () => {
    const points = SAMPLES.map((t) => contentCurve.getPointAt(t))
    let worst = 0
    for (let i = 2; i < points.length; i++) {
      const a = points[i - 1].clone().sub(points[i - 2])
      const b = points[i].clone().sub(points[i - 1])
      if (a.length() < 1e-9 || b.length() < 1e-9) continue
      worst = Math.max(worst, a.angleTo(b))
    }
    expect(worst).toBeLessThan(MathUtils.degToRad(5))
  })
})

describe('waypoint framing', () => {
  // The 60 degree FOV is VERTICAL. Markers are offset mostly horizontally, so
  // the limit that matters is the horizontal half-angle: ~42 degrees at 16:9
  // but only ~37.6 at 4:3. Budget against the narrower case, with margin.
  const MAX_OFF_CENTRE_DEG = 34

  it('keeps every waypoint marker inside the frame when its card is showing', () => {
    for (const waypoint of WAYPOINTS) {
      const { position, lookAt } = getCameraPose(waypoint.t)
      const toShip = lookAt.clone().sub(position)
      const toMarker = new Vector3(...waypoint.position).sub(position)
      const offCentre = MathUtils.radToDeg(toShip.angleTo(toMarker))
      expect(offCentre, `${waypoint.id} sits ${offCentre.toFixed(1)} deg off-centre`).toBeLessThan(
        MAX_OFF_CENTRE_DEG,
      )
    }
  })

  it('never puts a marker directly in front of the ship', () => {
    for (const waypoint of WAYPOINTS) {
      const { position, lookAt } = getCameraPose(waypoint.t)
      const toShip = lookAt.clone().sub(position)
      const toMarker = new Vector3(...waypoint.position).sub(position)
      const offCentre = MathUtils.radToDeg(toShip.angleTo(toMarker))
      // Too small an offset and the marker occludes the subject of the shot.
      expect(offCentre, `${waypoint.id} overlaps the ship`).toBeGreaterThan(12)
    }
  })
})
