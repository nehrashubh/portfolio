import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type RefObject,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  useGLTF,
  useProgress,
  PerspectiveCamera,
  ContactShadows,
  Environment,
  Lightformer,
} from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Piece } from './Piece'
import { toggleSelect } from './selection'
import { useReducedMotion } from '../../shared/useReducedMotion'
import { useDpr } from '../../shared/useDpr'
import { usePointerNormalized, type NormalizedPointer } from './usePointerNormalized'
import { FISCHER_POSITION, squareToPosition } from './fischerPosition'
import {
  boxCorners,
  cameraBasis,
  clampAnchor,
  fitDistance,
  screenPointToWorld,
  type Vec3,
} from './cameraFit'
import { WIDE_LAYOUT, type StageLayout } from './stageLayout'
import { usePointerActivity, useRecentChange } from './useRenderActivity'
import { ENTRANCE_DURATION_MS, revealDelayMs } from './entrance'

export type ChessSceneHandle = {
  selectPiece: (name: string | null) => void
}

export type ChessSceneProps = {
  layout?: StageLayout
  /** Width in CSS px, at the right edge, that the DOM panel covers. The
   *  pieces are framed in what remains; the board runs on underneath. */
  reserveRight?: number
  onPieceSelect?: (name: string | null) => void
  /** Fires once the model is decoded and a frame has been drawn, which is the
   *  moment the opening sequence begins on the board. The panel listens so its
   *  own rows arrive on the same beat. */
  onReady?: () => void
}

const MODEL_URL = '/models/chess.glb'
// Self-hosted copy of three's own Draco decoder. The loader's default is a
// gstatic.com URL, which puts a third-party host on the critical path to the
// board's first pixel.
const DRACO_PATH = '/draco/'
// Roughly a second past the slowest spring (the flight, tension 170 /
// friction 30) so the render loop keeps running until pieces have actually
// come to rest, then idles.
const SETTLE_MS = 1400
// How long after the cursor stops to keep drawing, so a selected piece's
// pointer-driven turn finishes easing (ROTATION_SMOOTHING_RATE of 8 in Piece
// is ~95% converged within this).
const POINTER_IDLE_MS = 600
const FOV_DEGREES = 35
const FOV_RADIANS = (FOV_DEGREES * Math.PI) / 180
// The three-quarter view the set was framed for. Only the *direction* is fixed
// here — how far back the camera actually sits is solved per viewport in
// useSceneFraming, so the board is never cropped on a narrow or short canvas.
const CAMERA_DIRECTION: Vec3 = [0.47, 0.65, 0.47]
// What the camera actually has to keep on screen: the occupied squares, padded
// by a piece's radius and height. Fitting the board's own bounding box instead
// costs a lot of frame for nothing — on this three-quarter view the board
// projects as a diamond whose left and right tips push the camera far back
// while the corners of the frame stay empty. Fitting the pieces lets the bare
// board corners bleed off the edges, the way the set was framed originally,
// while still guaranteeing no piece is ever clipped at any viewport size.
const PIECE_RADIUS = 0.03
const PIECE_TOP = 0.1124
const PIECE_BASE_Y = 0.017392655834555626
// Where the hover label's tail points: just above the top of a standing piece.
const LABEL_ANCHOR_Y = PIECE_TOP + 0.012
const FRAMED_POINTS: Vec3[] = FISCHER_POSITION.flatMap(({ square }) => {
  const [x, baseY, z] = squareToPosition(square)
  return boxCorners(
    [x - PIECE_RADIUS, baseY, z - PIECE_RADIUS],
    [x + PIECE_RADIUS, PIECE_TOP, z + PIECE_RADIUS],
  )
})

type GLTFNodes = Record<string, THREE.Object3D>

/**
 * A glTF node with a single-primitive mesh loads as a THREE.Mesh with its own
 * geometry/material. A node whose mesh has multiple primitives (e.g. the
 * bishops, modeled as two separate primitive submeshes sharing one material)
 * loads as a THREE.Group whose children are the per-primitive Meshes instead
 * - it has no .geometry/.material of its own. Merge those children's
 * geometries into one so every piece can be treated uniformly as a single
 * {geometry, material} pair.
 */
function getGeometryAndMaterial(node: THREE.Object3D): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  const mesh = node as THREE.Mesh
  if (mesh.isMesh && mesh.geometry) {
    return { geometry: mesh.geometry, material: mesh.material as THREE.Material }
  }

  const childMeshes = node.children.filter((child): child is THREE.Mesh => (child as THREE.Mesh).isMesh)
  if (childMeshes.length === 0) return null

  const geometry = mergeGeometries(childMeshes.map((child) => child.geometry))
  return { geometry, material: childMeshes[0].material as THREE.Material }
}

/**
 * Solves camera distance and the selected-piece rest point from the live canvas
 * size, so both follow the viewport instead of being hand-tuned world constants.
 */
function useSceneFraming(layout: StageLayout, reserveRight: number) {
  const { width, height } = useThree((state) => state.size)
  // The frame the pieces are fitted to is the canvas minus the covered strip.
  // NDC ±1 in that frame is the strip's left edge, so a flight anchor of 1
  // lands beside the panel rather than under it.
  const aspect = Math.max(1, width - reserveRight) / Math.max(height, 1)

  return useMemo(() => {
    const distance = fitDistance(FRAMED_POINTS, CAMERA_DIRECTION, FOV_RADIANS, aspect, layout.fitMargin)
    const depth = distance * layout.anchorDepth
    const anchor = clampAnchor(
      layout.anchorX,
      layout.anchorY,
      PIECE_RADIUS,
      PIECE_TOP - PIECE_BASE_Y,
      depth,
      FOV_RADIANS,
      aspect,
      layout.anchorInset,
    )
    const target = screenPointToWorld(
      CAMERA_DIRECTION,
      distance,
      FOV_RADIANS,
      aspect,
      anchor.x,
      anchor.y,
      depth,
    )
    return { distance, target }
  }, [aspect, layout])
}

export type ScreenPoint = { x: number; y: number; flip: boolean }

/**
 * Projects the hovered piece's world position to canvas pixels so a DOM label
 * can sit over it. Runs only when the hover changes or the canvas resizes —
 * the piece doesn't move while hovered, so there is nothing to track per frame.
 */
function HoverAnchor({
  hoveredName,
  homePositions,
  onAnchorChange,
}: {
  hoveredName: string | null
  homePositions: Map<string, Vec3>
  onAnchorChange: (point: ScreenPoint | null) => void
}) {
  const camera = useThree((state) => state.camera)
  const { width, height } = useThree((state) => state.size)

  useEffect(() => {
    const home = hoveredName ? homePositions.get(hoveredName) : undefined
    if (!home) {
      onAnchorChange(null)
      return
    }
    camera.updateMatrixWorld()
    const point = new THREE.Vector3(home[0], LABEL_ANCHOR_Y, home[2]).project(camera)
    const x = (point.x * 0.5 + 0.5) * width
    // Near the right edge the label would run off the canvas, so it swaps to
    // the other side of its anchor.
    onAnchorChange({ x, y: (-point.y * 0.5 + 0.5) * height, flip: x > width * 0.66 })
  }, [hoveredName, homePositions, camera, width, height, onAnchorChange])

  return null
}

function FramedCamera({ distance, reserveRight }: { distance: number; reserveRight: number }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const { width, height } = useThree((state) => state.size)
  const unit = useMemo(() => cameraBasis(CAMERA_DIRECTION).z, [])

  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (!camera) return
    camera.position.set(unit[0] * distance, unit[1] * distance, unit[2] * distance)
    camera.lookAt(0, 0, 0)
    // The full frame is the uncovered width; the canvas shows that frame plus
    // the strip under the panel to its right. Scale stays uniform because the
    // aspect is the frame's, not the canvas's — which is why the camera is
    // `manual`: r3f would otherwise reset the aspect to the canvas on resize.
    const usable = Math.max(1, width - reserveRight)
    camera.aspect = usable / Math.max(height, 1)
    camera.setViewOffset(usable, height, 0, 0, width, height)
    camera.updateProjectionMatrix()
  }, [distance, unit, width, height, reserveRight])

  // near/far hug a scene that is barely two units deep, which keeps depth
  // precision (and so the shadow map) usable at this scale.
  return (
    <PerspectiveCamera ref={cameraRef} makeDefault manual fov={FOV_DEGREES} near={0.05} far={10} />
  )
}

function ChessBoard({
  selectedName,
  hoveredName,
  reducedMotion,
  revealed,
  pointerRef,
  targetPosition,
  onHoverChange,
  onSelect,
  onPiecesResolved,
}: {
  selectedName: string | null
  hoveredName: string | null
  reducedMotion: boolean
  revealed: boolean
  pointerRef: RefObject<NormalizedPointer>
  targetPosition: Vec3
  onHoverChange: (name: string | null) => void
  onSelect: (name: string) => void
  onPiecesResolved: (homePositions: Map<string, Vec3>) => void
}) {
  const { nodes } = useGLTF(MODEL_URL, DRACO_PATH) as unknown as { nodes: GLTFNodes }

  // Resolved once per loaded model, never per render. getGeometryAndMaterial
  // calls mergeGeometries for the multi-primitive nodes (the bishops), which
  // allocates a fresh BufferGeometry every time — doing that inline in the
  // render body handed three a brand new geometry to upload on every hover and
  // every selection and leaked the previous one, so GPU memory climbed for as
  // long as anyone kept clicking.
  const board = useMemo(() => getGeometryAndMaterial(nodes.board), [nodes])
  const pieces = useMemo(
    () =>
      FISCHER_POSITION.flatMap(({ pieceName, square }) => {
        const node = nodes[pieceName]
        const geometryAndMaterial = node ? getGeometryAndMaterial(node) : null
        if (!geometryAndMaterial) {
          console.warn(`ChessScene: no GLTF node found for "${pieceName}" (square ${square}) — skipping`)
          return []
        }
        return [{ pieceName, homePosition: squareToPosition(square), ...geometryAndMaterial }]
      }),
    [nodes],
  )

  useEffect(() => {
    onPiecesResolved(new Map(pieces.map((piece) => [piece.pieceName, piece.homePosition])))
  }, [pieces, onPiecesResolved])

  return (
    <>
      {board && <mesh geometry={board.geometry} material={board.material} receiveShadow />}
      {pieces.map(({ pieceName, geometry, material, homePosition }) => (
        <Piece
          key={pieceName}
          name={pieceName}
          geometry={geometry}
          material={material}
          homePosition={homePosition}
          targetPosition={targetPosition}
          isSelected={selectedName === pieceName}
          isHovered={hoveredName === pieceName}
          revealed={revealed}
          revealDelay={revealDelayMs(pieceName)}
          reducedMotion={reducedMotion}
          pointerRef={pointerRef}
          onHoverChange={onHoverChange}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

function Stage({
  layout,
  reserveRight,
  selectedName,
  hoveredName,
  reducedMotion,
  revealed,
  pointerRef,
  onHoverChange,
  onSelect,
  onAnchorChange,
}: {
  layout: StageLayout
  reserveRight: number
  selectedName: string | null
  hoveredName: string | null
  reducedMotion: boolean
  revealed: boolean
  pointerRef: RefObject<NormalizedPointer>
  onHoverChange: (name: string | null) => void
  onSelect: (name: string) => void
  onAnchorChange: (point: ScreenPoint | null) => void
}) {
  const { distance, target } = useSceneFraming(layout, reserveRight)
  const [homePositions, setHomePositions] = useState<Map<string, Vec3>>(() => new Map())

  return (
    <>
      <FramedCamera distance={distance} reserveRight={reserveRight} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[0.6, 1, 0.8]}
        intensity={1.15}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        // three's default shadow frustum is +/-5 units with far 500. The board
        // is barely half a unit across, so the default spends ~40x40 of the
        // 1024x1024 map on the subject and the rest on empty space. These
        // bounds wrap the board (half-diagonal ~0.39) plus piece height.
        shadow-camera-left={-0.45}
        shadow-camera-right={0.45}
        shadow-camera-top={0.45}
        shadow-camera-bottom={-0.45}
        shadow-camera-near={0.5}
        shadow-camera-far={2.5}
        shadow-normalBias={0.001}
      />
      <directionalLight position={[-0.8, 0.5, -0.4]} intensity={0.25} color="#dbe6ff" />
      <Suspense fallback={null}>
        <ChessBoard
          selectedName={selectedName}
          hoveredName={hoveredName}
          reducedMotion={reducedMotion}
          revealed={revealed}
          pointerRef={pointerRef}
          targetPosition={target}
          onHoverChange={onHoverChange}
          onSelect={onSelect}
          onPiecesResolved={setHomePositions}
        />
      </Suspense>
      <HoverAnchor
        hoveredName={selectedName === hoveredName ? null : hoveredName}
        homePositions={homePositions}
        onAnchorChange={onAnchorChange}
      />
      {/* Built from lightformers rather than a preset: drei's presets stream a
          1.5MB HDRI from raw.githack.com at runtime, and this is both free of
          that dependency and art-directed for a black-and-white marble set. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={3} color="#fff2de" position={[2, 3, 2.4]} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#d3dceb" position={[-3, 1.6, -2.6]} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={2} color="#fff8ee" position={[0, 4, 0.4]} scale={[1, 6, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#e3d6bd" position={[0, -2.5, 0]} scale={[8, 8, 1]} />
      </Environment>
      {/* far stops at the height of a piece's base so the contact shading stays
          a contact shadow — at the old 0.2 it also caught the piece in flight
          and smeared it across the middle of the board. */}
      <ContactShadows position={[0, -0.001, 0]} opacity={0.45} scale={0.62} blur={2.2} far={0.075} resolution={512} />
    </>
  )
}

export const ChessScene = forwardRef<ChessSceneHandle, ChessSceneProps>(function ChessScene(
  { layout = WIDE_LAYOUT, reserveRight = 0, onPieceSelect, onReady },
  ref,
) {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<ScreenPoint | null>(null)
  const [revealed, setRevealed] = useState(false)
  const reducedMotion = useReducedMotion()
  const dpr = useDpr()
  const pointerRef = usePointerNormalized()
  const { active: assetsLoading } = useProgress()

  // Hold the opening sequence until the model has resolved *and* a frame has
  // actually been drawn. The first render of each material is where three
  // compiles its shader, and starting the sequence before that puts the
  // compile stall inside the animation it is meant to introduce.
  useEffect(() => {
    if (assetsLoading || revealed) return
    let outer = 0
    const inner = { id: 0 }
    outer = requestAnimationFrame(() => {
      inner.id = requestAnimationFrame(() => {
        setRevealed(true)
        onReady?.()
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner.id)
    }
  }, [assetsLoading, revealed, onReady])

  useImperativeHandle(ref, () => ({
    selectPiece: (name: string | null) => {
      setSelectedName(name)
      onPieceSelect?.(name)
    },
  }))

  const handleSelect = (name: string) => {
    const next = toggleSelect(selectedName, name)
    setSelectedName(next)
    onPieceSelect?.(next)
  }

  const handleDeselect = () => {
    setSelectedName(null)
    onPieceSelect?.(null)
  }

  // Nothing on this board moves on its own, so the loop only needs to run
  // while a piece is animating or assets are still arriving. The rest of the
  // time 'demand' leaves the GPU alone instead of re-rendering a still image
  // (and re-rendering the contact-shadow target) sixty times a second.
  // Keyed on the transition, not on the state being held: a hovered piece
  // settles in a few hundred milliseconds, so parking the cursor over the
  // board must not keep the GPU drawing a still image forever. A *selected*
  // piece does turn with the cursor, so those frames are drawn for as long as
  // the cursor is actually moving.
  const hoverLabel = useMemo(
    () => (hoveredName ? FISCHER_POSITION.find((e) => e.pieceName === hoveredName) ?? null : null),
    [hoveredName],
  )

  const settling = useRecentChange(`${selectedName}|${hoveredName}`, SETTLE_MS)
  const arriving = useRecentChange(String(revealed), ENTRANCE_DURATION_MS + 120)
  const pointerMoving = usePointerActivity(POINTER_IDLE_MS)
  const busy =
    assetsLoading || settling || arriving || (selectedName !== null && pointerMoving)

  return (
    <div className="stage">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={dpr}
        frameloop={busy ? 'always' : 'demand'}
        gl={{ alpha: true, powerPreference: 'high-performance' }}
        onPointerMissed={handleDeselect}
      >
        <Stage
          layout={layout}
          reserveRight={reserveRight}
          selectedName={selectedName}
          hoveredName={hoveredName}
          reducedMotion={reducedMotion}
          revealed={revealed}
          pointerRef={pointerRef}
          onHoverChange={setHoveredName}
          onSelect={handleSelect}
          onAnchorChange={setAnchor}
        />
      </Canvas>
      {hoverLabel && anchor && (
        <p
          className={`stage__label${anchor.flip ? ' stage__label--flip' : ''}`}
          style={{ left: `${anchor.x}px`, top: `${anchor.y}px` }}
          aria-hidden="true"
        >
          <span className="stage__label-square">{hoverLabel.square}</span>
          {hoverLabel.shortName}
        </p>
      )}
      {assetsLoading && <p className="stage__loading">Setting up the board…</p>}
    </div>
  )
})

useGLTF.preload(MODEL_URL, DRACO_PATH)
