import { describe, it, expect } from 'vitest'
import { MARKER_RENDER_ORDER, BASE_MARKER_OPACITY } from './WaypointTarget'

describe('marker draw order', () => {
  it('draws after the cloud billboards', () => {
    // Clouds use the default renderOrder of 0 and depthWrite: false, so they
    // blend over anything drawn earlier regardless of depth. Markers must be
    // strictly greater to land on top.
    expect(MARKER_RENDER_ORDER).toBeGreaterThan(0)
  })

  it('keeps inactive markers visible against bright cloud', () => {
    // At 0.25 they vanished into the lit half of the cloud field.
    expect(BASE_MARKER_OPACITY).toBeGreaterThanOrEqual(0.45)
  })
})
