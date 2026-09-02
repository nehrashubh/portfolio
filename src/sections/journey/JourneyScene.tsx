import { Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Matrix4, Vector3 } from 'three'
import { getCameraPose } from './cameraPath'
import { computeRevealState } from './revealWindow'
import { computeReachedStates } from './reachedState'
import { WAYPOINTS } from './waypoints'
import { ShipCloudsScene } from './ShipCloudsScene'
import { PathLine, type PathLineHandle } from './PathLine'
import { WaypointTarget, type WaypointTargetHandle } from './WaypointTarget'
import { WaypointLabel, type WaypointLabelHandle, LABEL_WIDTH_PX } from './WaypointLabel'
import { projectToScreen, chooseLabelSide, clampAnchor } from './labelPlacement'
import { useScrollFlight } from './useScrollFlight'
import { smoothToward } from './scrollFlight'
import { useDpr } from '../../shared/useDpr'

/**
 * Atmosphere, in the clouds' own dusk violet.
 *
 * `near` sits past the camera's orbit radius (3.3–3.85), so the ship itself
 * is never hazed — only the cloud beyond it. This is what dissolves the
 * shell's remaining hard silhouette into distance: smooth normals fix the
 * facets, fog fixes the outline, and between them the low-poly mass reads
 * as weather.
 */
const FOG_COLOUR = '#5b4f6b'
const FOG_NEAR = 4.2
const FOG_FAR = 14

const WAYPOINT_TS = WAYPOINTS.map((waypoint) => waypoint.t)
const WORLD_UP = new Vector3(0, 1, 0)
/** A label may take this much of a narrow frame, so it never runs off an edge. */
const LABEL_MAX_FRACTION = 0.6
/** The scroll cue leaves once the reader has clearly started travelling. */
const CUE_GONE_AT = 0.02

type CameraRigProps = {
  progressRef: RefObject<number>
  labelRefs: RefObject<(WaypointLabelHandle | null)[]>
  targetRefs: RefObject<(WaypointTargetHandle | null)[]>
  pathLineRef: RefObject<PathLineHandle | null>
  cueRef: RefObject<HTMLElement | null>
  onActiveIndexChange: (index: number | null) => void
}

function CameraRig({
  progressRef,
  labelRefs,
  targetRefs,
  pathLineRef,
  cueRef,
  onActiveIndexChange,
}: CameraRigProps) {
  const { camera } = useThree()
  const lastActiveIndex = useRef<number | null>(null)
  const lookMatrix = useRef(new Matrix4())
  const markerWorld = useRef(new Vector3())
  const shown = useRef(0)
  const cueShown = useRef(true)

  useFrame((state, delta) => {
    // Smoothed here, in the frame loop, with the same half-second catch-up
    // the old ScrollTrigger scrub gave. The raw ref only records the wheel.
    // delta is capped so a backgrounded tab does not jump on return.
    const progress = (shown.current = smoothToward(
      shown.current,
      progressRef.current,
      Math.min(delta, 0.1),
    ))
    const pose = getCameraPose(progress)
    camera.position.copy(pose.position)

    // Orientation follows position exactly, with no smoothing of its own. The
    // target is the ship, a fixed point, so the look direction is already a
    // smooth function of where the camera is, and the scroll itself is
    // smoothed above. Damping on top of that was pure lag: the orbit sweeps
    // 190 degrees, and a brisk scroll left the camera ~23 degrees behind.
    lookMatrix.current.lookAt(camera.position, pose.lookAt, WORLD_UP)
    camera.quaternion.setFromRotationMatrix(lookMatrix.current)
    camera.up.set(0, 1, 0)

    pathLineRef.current?.setProgress(progress)

    const { opacities, activeIndex } = computeRevealState(progress, WAYPOINT_TS)
    const reachedStates = computeReachedStates(progress, WAYPOINT_TS)
    const { width, height } = state.size
    const labelWidth = Math.min(LABEL_WIDTH_PX, width * LABEL_MAX_FRACTION)
    opacities.forEach((opacity, index) => {
      targetRefs.current[index]?.setEmphasis(opacity)
      targetRefs.current[index]?.setReached(reachedStates[index])

      const label = labelRefs.current[index]
      if (!label) return

      markerWorld.current.set(...WAYPOINTS[index].position)
      const point = projectToScreen(markerWorld.current, camera, width, height)
      // A waypoint behind the camera projects to a mirrored on-screen position;
      // hide it rather than drawing it somewhere plausible-looking but wrong.
      if (!point.visible) {
        label.setVisibility(0)
        return
      }
      // On a portrait phone the marker itself can sit outside the frame;
      // the label is pulled back in so it can still be read.
      const side = chooseLabelSide(point.x, labelWidth, width)
      const anchor = clampAnchor(point.x, point.y, side, labelWidth, width, height)
      label.setWidth(labelWidth)
      label.setPlacement(anchor.x, anchor.y, side, anchor.clamped)
      label.setVisibility(opacity)
    })

    const cueVisible = progress < CUE_GONE_AT
    if (cueVisible !== cueShown.current && cueRef.current) {
      cueShown.current = cueVisible
      cueRef.current.style.opacity = cueVisible ? '1' : '0'
    }

    if (activeIndex !== lastActiveIndex.current) {
      lastActiveIndex.current = activeIndex
      onActiveIndexChange(activeIndex)
    }
  })

  return null
}

/** drei's loading store works outside the canvas, which is where this sits. */
function LoadingLine() {
  const { active } = useProgress()
  return active ? <p className="journey__loading">Clearing the clouds…</p> : null
}

export function JourneyScene({ stopId }: { stopId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLParagraphElement>(null)
  const progressRef = useScrollFlight(containerRef)
  const labelRefs = useRef<(WaypointLabelHandle | null)[]>([])
  const targetRefs = useRef<(WaypointTargetHandle | null)[]>([])
  const pathLineRef = useRef<PathLineHandle>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  // Fill-rate bound even on desktop: mostly soft alpha-blended cloud that
  // gains nothing above 1.5x. Phones drop further via the shared hook.
  const dpr = useDpr(1.5)

  // `#work/<stop>` sets the scroller to that stop; the camera then flies
  // there from the start of the route, which is the arrival it deserves.
  useEffect(() => {
    const el = containerRef.current
    const stop = WAYPOINTS.find((w) => w.id === stopId)
    if (!el || !stop) return
    el.scrollTop = stop.t * (el.scrollHeight - el.clientHeight)
  }, [stopId])

  return (
    // The scene never moves. The stage is pinned to the section and a
    // transparent scroller sits over it whose only job is to be scrolled:
    // the wheel drives that element's scrollTop, and the camera reads it.
    // A sticky stage inside the scroller was tried first, and a fast wheel
    // showed the container's bare background above and below it for a
    // frame — sticky is repositioned after the scroll, not with it.
    <div className="journey">
      <div className="journey__stage">
        <Canvas
          dpr={dpr}
          gl={{ powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 0], fov: 60, near: 0.05, far: 100 }}
        >
          <color attach="background" args={['#05050a']} />
          <fog attach="fog" args={[FOG_COLOUR, FOG_NEAR, FOG_FAR]} />
          <CameraRig
            progressRef={progressRef}
            labelRefs={labelRefs}
            targetRefs={targetRefs}
            pathLineRef={pathLineRef}
            cueRef={cueRef}
            onActiveIndexChange={setActiveIndex}
          />
          <Suspense fallback={null}>
            <ShipCloudsScene />
          </Suspense>
          <PathLine ref={pathLineRef} />
          {WAYPOINTS.map((waypoint, index) => (
            <WaypointTarget
              key={waypoint.id}
              position={waypoint.position}
              ref={(handle) => {
                targetRefs.current[index] = handle
              }}
            />
          ))}
        </Canvas>
        <div className="journey-scene__overlay">
          {WAYPOINTS.map((waypoint, index) => (
            <WaypointLabel
              key={waypoint.id}
              waypoint={waypoint}
              isActive={index === activeIndex}
              ref={(handle) => {
                labelRefs.current[index] = handle
              }}
            />
          ))}
        </div>
        <LoadingLine />
        <p className="journey__cue" ref={cueRef} aria-hidden="true">
          Scroll
        </p>
      </div>
      <div
        ref={containerRef}
        className="journey__scroller"
        tabIndex={0}
        role="region"
        aria-label="Work and education. Scroll to travel."
      >
        <div className="journey__spacer" aria-hidden="true" />
      </div>
    </div>
  )
}
