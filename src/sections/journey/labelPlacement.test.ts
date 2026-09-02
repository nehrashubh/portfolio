import { describe, it, expect } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { projectToScreen, chooseLabelSide, clampAnchor, CARD_GAP } from './labelPlacement'

function cameraAtOrigin() {
  const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100)
  camera.position.set(0, 0, 0)
  camera.lookAt(new Vector3(0, 0, -1))
  camera.updateMatrixWorld(true)
  camera.updateProjectionMatrix()
  return camera
}

describe('projectToScreen', () => {
  it('puts a point straight ahead at the centre of the viewport', () => {
    const p = projectToScreen(new Vector3(0, 0, -5), cameraAtOrigin(), 1000, 600)
    expect(p.visible).toBe(true)
    expect(p.x).toBeCloseTo(500, 0)
    expect(p.y).toBeCloseTo(300, 0)
  })

  it('maps a point above centre to a smaller y, since screen y grows downward', () => {
    const p = projectToScreen(new Vector3(0, 1, -5), cameraAtOrigin(), 1000, 600)
    expect(p.y).toBeLessThan(300)
  })

  it('maps a point right of centre to a larger x', () => {
    const p = projectToScreen(new Vector3(1, 0, -5), cameraAtOrigin(), 1000, 600)
    expect(p.x).toBeGreaterThan(500)
  })

  it('reports a point behind the camera as not visible', () => {
    // Without this check the projection mirrors it to a plausible-looking
    // on-screen position and the label appears for a waypoint that is
    // actually behind you.
    const p = projectToScreen(new Vector3(0, 0, 5), cameraAtOrigin(), 1000, 600)
    expect(p.visible).toBe(false)
  })
})

describe('chooseLabelSide', () => {
  it('defaults to the right of the marker', () => {
    expect(chooseLabelSide(500, 240, 1000)).toBe('right')
  })

  it('flips left when the label would overflow the right edge', () => {
    expect(chooseLabelSide(900, 240, 1000)).toBe('left')
  })

  it('stays right when flipping left would overflow the left edge', () => {
    // Narrow viewport: neither side fits. Prefer right so the text is never
    // clipped against x = 0, where it would be unreadable.
    expect(chooseLabelSide(100, 240, 300)).toBe('right')
  })

  it('flips left exactly at the overflow boundary, gap included', () => {
    // A right-side card starts CARD_GAP right of the anchor.
    expect(chooseLabelSide(1000 - CARD_GAP - 240, 240, 1000)).toBe('right')
    expect(chooseLabelSide(1000 - CARD_GAP - 240 + 1, 240, 1000)).toBe('left')
  })
})

describe('clampAnchor', () => {
  const W = 390
  const H = 800
  const LABEL = 234

  it('leaves an anchor alone when the whole card already fits', () => {
    expect(clampAnchor(100, 400, 'right', LABEL, W, H)).toEqual({ x: 100, y: 400, clamped: false })
  })

  it('pulls a right-side card back so its far edge is inside the frame', () => {
    const r = clampAnchor(460, 400, 'right', LABEL, W, H)
    expect(r.x + CARD_GAP + LABEL).toBeLessThanOrEqual(W - 16)
    expect(r.clamped).toBe(true)
  })

  it('pulls a left-side card forward so its near edge is inside the frame', () => {
    const r = clampAnchor(40, 400, 'left', LABEL, W, H)
    expect(r.x - CARD_GAP - LABEL).toBeGreaterThanOrEqual(16)
    expect(r.clamped).toBe(true)
  })

  it('keeps a card, centred on its anchor, inside the top and bottom edges', () => {
    expect(clampAnchor(200, 30, 'right', LABEL, W, H).y).toBeGreaterThanOrEqual(100)
    expect(clampAnchor(200, 900, 'right', LABEL, W, H).y).toBeLessThanOrEqual(H - 100)
  })
})
