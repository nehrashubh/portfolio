import { Suspense, useCallback, useEffect, useRef, useState, type RefObject } from 'react'
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
import { projectToScreen, chooseLabelSide, clampAnchor, type LabelSide } from './labelPlacement'
import { useScrollFlight } from './useScrollFlight'
import { smoothToward } from './scrollFlight'
import { useDpr } from '../../shared/useDpr'
import { ScrollRail, type ScrollRailHandle } from '../../shared/ScrollRail'

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
/** A stop's text belongs to its anchor, so it goes as the anchor leaves the
 *  frame: fully up while the anchor is this far inside an edge, gone at it. */
const EDGE_FADE_PX = 70
/** journey.css docks the text as a caption below this width; there it stays
 *  readable whatever the anchor does. */
const DOCKED_BELOW_PX = 700
/** The scroll cue leaves once the reader has clearly started travelling.
 *  At 0.02 it was gone before most people had finished reading it. */
const CUE_GONE_AT = 0.06

/*
 * The scene renders only while the camera is moving, and it gives up
 * resolution before it gives up smoothness.
 *
 * Every frame of this scene is thousands of blended cloud billboards, and
 * nothing in it moves unless the camera does. Rendering it continuously kept
 * an integrated GPU pinned the whole time someone was reading a stop.
 *
 * While it is moving, frame times are sampled. When they average below
 * MIN_FPS the pixel ratio steps down, toward DPR_FLOOR and never below it.
 * It never steps back up: a frame rate that flickers between two
 * resolutions is worse than either one.
 */
const MIN_FPS = 50
const DPR_STEP = 0.25
const DPR_FLOOR = 1
const SAMPLE_FRAMES = 24

/**
 * Multisampling only where the pixels are big enough to need it.
 *
 * With 4x MSAA every blended cloud fragment is written four times. On a 1.56x
 * laptop panel an Intel iGPU flew the route at 32-42 fps with it, even after
 * stepping down to 1x, and at 57-60 without it at the full 1.5x. At that
 * density the rigging's edges are already fine. A 1x screen has well under
 * half the pixels to blend, and visibly jagged rigging without it, so it
 * keeps MSAA.
 */
const MSAA_BELOW_DPR = 1.25

type CameraRigProps = {
  progressRef: RefObject<number>
  /** Filled in by the rig, so scroll events outside the canvas can ask for a frame. */
  invalidateRef: RefObject<(() => void) | null>
  /** Frames have been too slow for a whole sample: step the resolution down. */
  onSlow: () => void
  labelRefs: RefObject<(WaypointLabelHandle | null)[]>
  targetRefs: RefObject<(WaypointTargetHandle | null)[]>
  pathLineRef: RefObject<PathLineHandle | null>
  cueRef: RefObject<HTMLElement | null>
  /** Shows where the flight is, not where the scroller is. */
  railRef: RefObject<ScrollRailHandle | null>
  onActiveIndexChange: (index: number | null) => void
}

function CameraRig({
  progressRef,
  invalidateRef,
  onSlow,
  labelRefs,
  targetRefs,
  pathLineRef,
  cueRef,
  railRef,
  onActiveIndexChange,
}: CameraRigProps) {
  const { camera } = useThree()
  const invalidate = useThree((state) => state.invalidate)
  const lastActiveIndex = useRef<number | null>(null)
  const lookMatrix = useRef(new Matrix4())
  const markerWorld = useRef(new Vector3())
  const shown = useRef(0)
  const cueShown = useRef(true)
  // Which side of its marker each stop's text sits on, held for as long as
  // that stop is on screen. Recomputing it per frame made four of the five
  // jump the width of the text as their marker crossed the frame's middle.
  const heldSides = useRef<(LabelSide | null)[]>(WAYPOINTS.map(() => null))
  // True when the previous frame asked for this one, so `delta` is a real
  // frame interval rather than however long the scene sat still.
  const moving = useRef(false)
  const sample = useRef({ frames: 0, seconds: 0 })

  useEffect(() => {
    invalidateRef.current = invalidate
    // The scroller may have been set (a `#work/<stop>` link) before this ran.
    invalidate()
    return () => {
      invalidateRef.current = null
    }
  }, [invalidate, invalidateRef])

  useFrame((state, delta) => {
    if (moving.current) {
      const s = sample.current
      s.frames += 1
      s.seconds += delta
      if (s.frames >= SAMPLE_FRAMES) {
        if (s.seconds / s.frames > 1 / MIN_FPS) onSlow()
        s.frames = 0
        s.seconds = 0
      }
    }

    // Smoothed here, in the frame loop, with the same half-second catch-up
    // the old ScrollTrigger scrub gave. The raw ref only records the wheel.
    // delta is capped so a backgrounded tab does not jump on return.
    const progress = (shown.current = smoothToward(
      shown.current,
      progressRef.current,
      Math.min(delta, 0.1),
    ))
    // Keep asking for frames until the camera has caught up with the scroll.
    moving.current = progress !== progressRef.current
    if (moving.current) invalidate()
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
    railRef.current?.setProgress(progress)

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
      if (!point.visible || opacity <= 0) {
        label.setVisibility(0)
        // Out of sight, so the next appearance picks its side afresh.
        heldSides.current[index] = null
        return
      }
      // Chosen once, when the stop appears, and held until it fades. A
      // marker sweeps right across the frame as the camera orbits, so a
      // per-frame choice flipped the text from one side to the other
      // mid-read.
      const side = (heldSides.current[index] ??= chooseLabelSide(point.x, labelWidth, width))
      // On a portrait phone the marker itself can sit outside the frame;
      // the text is pulled back in so it can still be read.
      const anchor = clampAnchor(point.x, point.y, side, labelWidth, width, height)
      const inside = Math.min(point.x, width - point.x, point.y, height - point.y)
      const inFrame = width <= DOCKED_BELOW_PX ? 1 : Math.min(Math.max(inside / EDGE_FADE_PX, 0), 1)
      label.setWidth(labelWidth)
      label.setPlacement(anchor.x, anchor.y, side, anchor.clamped)
      label.setVisibility(opacity * inFrame)
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
  const invalidateRef = useRef<(() => void) | null>(null)
  const requestFrame = useCallback(() => invalidateRef.current?.(), [])
  const progressRef = useScrollFlight(containerRef, requestFrame)
  const labelRefs = useRef<(WaypointLabelHandle | null)[]>([])
  const targetRefs = useRef<(WaypointTargetHandle | null)[]>([])
  const pathLineRef = useRef<PathLineHandle>(null)
  const railRef = useRef<ScrollRailHandle>(null)
  // The flight is the scroller's scrollTop; a drag of the rail sets it, and
  // the camera eases there as it does for the wheel.
  const seek = useCallback((progress: number) => {
    const el = containerRef.current
    if (el) el.scrollTop = progress * (el.scrollHeight - el.clientHeight)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      railRef.current?.setVisibleFraction(el.clientHeight / el.scrollHeight)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  // Fill-rate bound even on desktop: mostly soft alpha-blended cloud that
  // gains nothing above 1.5x. Phones drop further via the shared hook.
  const [, dprCap] = useDpr(1.5)
  // Held here rather than set on the canvas from inside it: this component
  // re-renders whenever the active stop changes, and the canvas re-applies
  // its dpr prop when it does, which put back every step the rig had taken.
  const [dprSteps, setDprSteps] = useState(0)
  const startDpr = Math.min(window.devicePixelRatio || 1, dprCap)
  const dpr = Math.max(Math.min(startDpr, DPR_FLOOR), startDpr - dprSteps * DPR_STEP)
  const stepDown = useCallback(
    () => setDprSteps((steps) => (startDpr - steps * DPR_STEP > DPR_FLOOR ? steps + 1 : steps)),
    [startDpr],
  )

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
          frameloop="demand"
          gl={{ powerPreference: 'high-performance', antialias: startDpr < MSAA_BELOW_DPR }}
          camera={{ position: [0, 0, 0], fov: 60, near: 0.05, far: 100 }}
        >
          <color attach="background" args={['#05050a']} />
          <fog attach="fog" args={[FOG_COLOUR, FOG_NEAR, FOG_FAR]} />
          <CameraRig
            progressRef={progressRef}
            invalidateRef={invalidateRef}
            onSlow={stepDown}
            labelRefs={labelRefs}
            targetRefs={targetRefs}
            pathLineRef={pathLineRef}
            cueRef={cueRef}
            railRef={railRef}
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
      <ScrollRail ref={railRef} onSeek={seek} className="scroll-rail--inset" />
    </div>
  )
}
