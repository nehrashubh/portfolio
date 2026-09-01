import { describe, it, expect } from 'vitest'
import {
  boxCorners,
  cameraBasis,
  clampAnchor,
  fitDistance,
  screenPointToWorld,
  type Vec3,
} from './cameraFit'

const DIRECTION: Vec3 = [0.47, 0.65, 0.47]
const FOV = (35 * Math.PI) / 180

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

describe('cameraBasis', () => {
  it('returns three mutually perpendicular unit vectors', () => {
    const { x, y, z } = cameraBasis(DIRECTION)
    for (const axis of [x, y, z]) expect(Math.hypot(...axis)).toBeCloseTo(1)
    expect(dot(x, y)).toBeCloseTo(0)
    expect(dot(y, z)).toBeCloseTo(0)
    expect(dot(z, x)).toBeCloseTo(0)
  })

  it('points z from the origin back toward the eye', () => {
    const { z } = cameraBasis(DIRECTION)
    expect(dot(z, DIRECTION)).toBeGreaterThan(0)
  })

  it('keeps the right vector level with the horizon', () => {
    expect(cameraBasis(DIRECTION).x[1]).toBeCloseTo(0)
  })
})

describe('boxCorners', () => {
  it('returns all eight corners of the box', () => {
    const corners = boxCorners([-1, -2, -3], [1, 2, 3])
    expect(corners).toHaveLength(8)
    expect(new Set(corners.map((c) => c.join(','))).size).toBe(8)
  })
})

describe('fitDistance', () => {
  const corners = boxCorners([-0.27662, 0.00004, -0.27662], [0.27662, 0.1124, 0.27662])

  it('places every corner inside the frustum at the returned distance', () => {
    const aspect = 1.4
    const distance = fitDistance(corners, DIRECTION, FOV, aspect)
    const { x, y, z } = cameraBasis(DIRECTION)
    const tanV = Math.tan(FOV / 2)
    const tanH = tanV * aspect

    for (const corner of corners) {
      const depth = distance - dot(corner, z)
      expect(depth).toBeGreaterThan(0)
      // Allow the touching corner to land exactly on the frame edge.
      expect(Math.abs(dot(corner, x))).toBeLessThanOrEqual(depth * tanH + 1e-9)
      expect(Math.abs(dot(corner, y))).toBeLessThanOrEqual(depth * tanV + 1e-9)
    }
  })

  it('pulls the camera further back as the viewport narrows', () => {
    const wide = fitDistance(corners, DIRECTION, FOV, 1.6)
    const narrow = fitDistance(corners, DIRECTION, FOV, 0.6)
    expect(narrow).toBeGreaterThan(wide)
  })

  it('pulls the camera further back for a larger margin', () => {
    const snug = fitDistance(corners, DIRECTION, FOV, 1.4, 1)
    const padded = fitDistance(corners, DIRECTION, FOV, 1.4, 1.2)
    expect(padded).toBeGreaterThan(snug)
  })

  it('rejects an empty point set', () => {
    expect(() => fitDistance([], DIRECTION, FOV, 1.4)).toThrow()
  })
})

describe('screenPointToWorld', () => {
  const distance = 1.4
  const aspect = 1.5

  it('puts the centre anchor straight ahead on the camera axis', () => {
    const point = screenPointToWorld(DIRECTION, distance, FOV, aspect, 0, 0, 0.9)
    const { z } = cameraBasis(DIRECTION)
    // distance - depth along z, with no lateral offset.
    expect(point[0]).toBeCloseTo(z[0] * 0.5)
    expect(point[1]).toBeCloseTo(z[1] * 0.5)
    expect(point[2]).toBeCloseTo(z[2] * 0.5)
  })

  it('re-projects back to the anchor it was built from', () => {
    const ndcX = 0.5
    const ndcY = -0.3
    const depth = 0.9
    const point = screenPointToWorld(DIRECTION, distance, FOV, aspect, ndcX, ndcY, depth)
    const { x, y, z } = cameraBasis(DIRECTION)
    const tanV = Math.tan(FOV / 2)
    const viewDepth = distance - dot(point, z)

    expect(viewDepth).toBeCloseTo(depth)
    expect(dot(point, y) / (viewDepth * tanV)).toBeCloseTo(ndcY)
    expect(dot(point, x) / (viewDepth * tanV * aspect)).toBeCloseTo(ndcX)
  })

  it('keeps the same anchor on screen when the aspect ratio changes', () => {
    const wide = screenPointToWorld(DIRECTION, distance, FOV, 2, 0.6, 0.4, 0.9)
    const narrow = screenPointToWorld(DIRECTION, distance, FOV, 0.7, 0.6, 0.4, 0.9)
    const { x, y, z } = cameraBasis(DIRECTION)
    const tanV = Math.tan(FOV / 2)

    for (const [point, aspectRatio] of [
      [wide, 2],
      [narrow, 0.7],
    ] as const) {
      const viewDepth = distance - dot(point, z)
      expect(dot(point, y) / (viewDepth * tanV)).toBeCloseTo(0.4)
      expect(dot(point, x) / (viewDepth * tanV * aspectRatio)).toBeCloseTo(0.6)
    }
  })
})

describe('clampAnchor', () => {
  const RADIUS = 0.03
  const HEIGHT = 0.095
  const DEPTH = 0.73
  const ASPECT = 1.03

  function extents(anchor: { x: number; y: number }) {
    const tanV = Math.tan(FOV / 2)
    const tanH = tanV * ASPECT
    return {
      right: anchor.x + RADIUS / (DEPTH * tanH),
      left: anchor.x - RADIUS / (DEPTH * tanH),
      top: anchor.y + HEIGHT / (DEPTH * tanV),
    }
  }

  it('keeps a corner-seeking anchor fully inside the frame', () => {
    const anchor = clampAnchor(1, 1, RADIUS, HEIGHT, DEPTH, FOV, ASPECT)
    const { right, top } = extents(anchor)
    expect(right).toBeLessThanOrEqual(1 + 1e-9)
    expect(top).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('honours an additional inset', () => {
    const anchor = clampAnchor(1, 1, RADIUS, HEIGHT, DEPTH, FOV, ASPECT, 0.05)
    const { right, top } = extents(anchor)
    expect(right).toBeLessThanOrEqual(0.95 + 1e-9)
    expect(top).toBeLessThanOrEqual(0.95 + 1e-9)
  })

  it('pushes the anchor further in as the piece grows on screen', () => {
    const near = clampAnchor(1, 1, RADIUS, HEIGHT, 0.4, FOV, ASPECT)
    const far = clampAnchor(1, 1, RADIUS, HEIGHT, 1.2, FOV, ASPECT)
    expect(near.x).toBeLessThan(far.x)
    expect(near.y).toBeLessThan(far.y)
  })

  it('leaves an anchor that already fits untouched', () => {
    const anchor = clampAnchor(0.1, -0.2, RADIUS, HEIGHT, DEPTH, FOV, ASPECT)
    expect(anchor.x).toBeCloseTo(0.1)
    expect(anchor.y).toBeCloseTo(-0.2)
  })

  it('clamps symmetrically toward the left edge', () => {
    const anchor = clampAnchor(-1, 0, RADIUS, HEIGHT, DEPTH, FOV, ASPECT)
    expect(extents(anchor).left).toBeGreaterThanOrEqual(-1 - 1e-9)
  })

  it('never returns an anchor outside the frame even for an oversized piece', () => {
    const anchor = clampAnchor(1, 1, 5, 5, DEPTH, FOV, ASPECT)
    expect(anchor.x).toBe(0)
    expect(anchor.y).toBe(0)
  })
})
