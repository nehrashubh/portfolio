// src/PathLine.tsx
import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { BufferGeometry, Line, LineBasicMaterial, LineDashedMaterial } from 'three'
import { curve } from './cameraPath'
import { computeTrailDrawCount } from './pathTrail'

const PATH_SEGMENTS = 400

// Fine, closely-spaced dashes read as a surveyor's dotted route. The earlier
// 0.15/0.1 pair drew chunky ticks that competed with the waypoint markers;
// at this size the line describes the path without shouting over the art.
const DASH_SIZE = 0.05
const GAP_SIZE = 0.05

// The route ahead is a faint hint; the route already travelled is drawn
// brighter on top of it, so progress reads as the line "inking in" rather
// than as two lines of equal weight sitting on each other.
const AHEAD_OPACITY = 0.22
const TRAVELLED_OPACITY = 0.8

export type PathLineHandle = {
  setProgress: (progress: number) => void
}

export const PathLine = forwardRef<PathLineHandle, object>(function PathLine(_props, ref) {
  const { dashedLine, solidLine, pointCount } = useMemo(() => {
    // Arc-length-spaced, not uniform-t: this keeps point index i lined up
    // with progress i / PATH_SEGMENTS the same way getCameraPose's
    // getPointAt(t) is arc-length parameterized, so the trail's leading
    // edge always matches the camera's actual position.
    const points = curve.getSpacedPoints(PATH_SEGMENTS)

    const dashedLine = new Line(
      new BufferGeometry().setFromPoints(points),
      new LineDashedMaterial({
        color: '#ffffff',
        dashSize: DASH_SIZE,
        gapSize: GAP_SIZE,
        toneMapped: false,
        transparent: true,
        opacity: AHEAD_OPACITY,
        // Without this the line punches through cloud it should be behind,
        // which breaks the sense that the route runs through the scene.
        depthWrite: false,
      }),
    )
    dashedLine.computeLineDistances()

    const solidGeometry = new BufferGeometry().setFromPoints(points)
    solidGeometry.setDrawRange(0, 0)
    const solidLine = new Line(
      solidGeometry,
      new LineBasicMaterial({
        color: '#ffffff',
        toneMapped: false,
        transparent: true,
        opacity: TRAVELLED_OPACITY,
        depthWrite: false,
      }),
    )

    return { dashedLine, solidLine, pointCount: points.length }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      setProgress(progress: number) {
        solidLine.geometry.setDrawRange(0, computeTrailDrawCount(progress, pointCount))
      },
    }),
    [solidLine, pointCount],
  )

  return (
    <>
      <primitive object={dashedLine} />
      <primitive object={solidLine} />
    </>
  )
})
