import { describe, it, expect } from 'vitest'
import { arcPosition, inspectRotation } from './pieceMotion'

describe('arcPosition', () => {
  const home: [number, number, number] = [1, 0, 1]
  const target: [number, number, number] = [1.2, 0.3, 1.2]

  it('is exactly the home position at progress 0', () => {
    expect(arcPosition(home, target, 0, 0.1)).toEqual(home)
  })

  it('is exactly the target position at progress 1, with no residual bump', () => {
    const [x, y, z] = arcPosition(home, target, 1, 0.1)
    expect(x).toBeCloseTo(1.2)
    expect(y).toBeCloseTo(0.3)
    expect(z).toBeCloseTo(1.2)
  })

  it('reaches the same target regardless of the starting home position', () => {
    const otherHome: [number, number, number] = [-3, 0.02, 4]
    const [x, y, z] = arcPosition(otherHome, target, 1, 0.1)
    expect(x).toBeCloseTo(1.2)
    expect(y).toBeCloseTo(0.3)
    expect(z).toBeCloseTo(1.2)
  })

  it('adds the full bump height at the midpoint of the flight', () => {
    const [, y] = arcPosition(home, target, 0.5, 0.1)
    expect(y).toBeCloseTo(0 + 0.3 * 0.5 + 0.1)
  })

  it('interpolates x/z linearly with progress, independent of the bump', () => {
    const [x, , z] = arcPosition(home, target, 0.5, 0.1)
    expect(x).toBeCloseTo(1.1)
    expect(z).toBeCloseTo(1.1)
  })
})

describe('inspectRotation', () => {
  it('is zero when progress is 0, regardless of cursor position', () => {
    expect(inspectRotation({ x: 1, y: 1 }, 0, 0.3, 0.15)).toEqual({ yaw: 0, pitch: 0 })
  })

  it('scales cursor position by the max angles and progress', () => {
    const result = inspectRotation({ x: 0.5, y: -0.5 }, 1, 0.3, 0.15)
    expect(result.yaw).toBeCloseTo(0.15)
    expect(result.pitch).toBeCloseTo(-0.075)
  })

  it('clamps cursor values outside [-1, 1]', () => {
    const result = inspectRotation({ x: 5, y: -5 }, 1, 0.3, 0.15)
    expect(result.yaw).toBeCloseTo(0.3)
    expect(result.pitch).toBeCloseTo(-0.15)
  })

  it('keeps yaw and pitch independent of the other cursor axis', () => {
    const result = inspectRotation({ x: 1, y: 0 }, 1, 0.3, 0.15)
    expect(result.yaw).toBeCloseTo(0.3)
    expect(result.pitch).toBeCloseTo(0)
  })
})
