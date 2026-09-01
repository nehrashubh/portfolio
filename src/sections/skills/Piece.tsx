import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { useSpring } from '@react-spring/three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import { getShadowTexture } from './shadowTexture'
import { arcPosition, inspectRotation } from './pieceMotion'
import { ENTRANCE } from './entrance'
import type { NormalizedPointer } from './usePointerNormalized'

export type PieceProps = {
  name: string
  geometry: THREE.BufferGeometry
  material: THREE.Material
  homePosition: [number, number, number]
  targetPosition: [number, number, number]
  isSelected: boolean
  isHovered: boolean
  /** Whether the opening sequence has reached this piece's turn to arrive. */
  revealed: boolean
  /** Milliseconds into the sequence at which this piece begins landing. */
  revealDelay: number
  reducedMotion: boolean
  pointerRef: RefObject<NormalizedPointer>
  onHoverChange: (name: string | null) => void
  onSelect: (name: string) => void
}

const HOVER_LIFT = 0.008
const HOVER_TILT = 0.08
const ARC_BUMP_HEIGHT = 0.05
// How far above its square a piece starts the opening sequence. Roughly one
// piece height — enough to read as being set down, not dropped.
const DROP_HEIGHT = 0.09
// Settling has no overshoot: these are marble tournament pieces being placed,
// and a bounce would read as plastic.
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
// Half of a full turn: cursor sweeping the full screen width (clampedX -1..1
// in inspectRotation) spans a total 360° turn, not 360° in each direction.
const MAX_INSPECT_YAW = Math.PI
const MAX_INSPECT_PITCH = 0.15
// Exponential smoothing rate for easing rotation toward its per-frame target
// (see useFrame below) — higher is snappier, lower is laggier.
const ROTATION_SMOOTHING_RATE = 8

export function Piece({
  name,
  geometry,
  material,
  homePosition,
  targetPosition,
  isSelected,
  isHovered,
  revealed,
  revealDelay,
  reducedMotion,
  pointerRef,
  onHoverChange,
  onSelect,
}: PieceProps) {
  const shadowTexture = useMemo(() => getShadowTexture(), [])
  const meshRef = useRef<THREE.Mesh>(null)

  const hoverLift = reducedMotion ? 0 : isHovered && !isSelected ? HOVER_LIFT : 0
  const shadowOpacity = reducedMotion ? 0 : isSelected ? 0.55 : isHovered ? 0.18 : 0
  const shadowScale = isSelected ? 2.4 : 1

  const [spring] = useSpring(
    () => ({
      hoverLiftY: hoverLift,
      progress: reducedMotion ? 0 : isSelected ? 1 : 0,
      shadowOpacity,
      shadowScale,
      reveal: revealed ? 1 : 0,
      config: (key) => {
        if (key === 'reveal') return { duration: ENTRANCE.settleMs, easing: easeOutCubic }
        if (key === 'progress') return { tension: 170, friction: 30 }
        return { tension: 210, friction: 20 }
      },
      // Only the arrival is staggered; everything else responds immediately.
      delay: (key) => (key === 'reveal' && !reducedMotion ? revealDelay : 0),
      immediate: reducedMotion,
    }),
    [hoverLift, isSelected, shadowOpacity, shadowScale, revealed, revealDelay, reducedMotion],
  )

  // The shadow blob's mesh/material are driven imperatively via useFrame rather than
  // <animated.mesh>/<animated.meshBasicMaterial> — see the API-adaptation note in the
  // task report: mapping @react-spring/three's AnimatedProps over three's
  // MeshBasicMaterialParameters type (as installed: three 0.185.1 / @react-spring/three
  // 10.1.2) triggers `TS2589: Type instantiation is excessively deep and possibly
  // infinite`. Reading the same SpringValues every frame keeps this on the real spring
  // (no parallel animation state) while sidestepping the broken JSX typing.
  const shadowMeshRef = useRef<THREE.Mesh>(null)
  const shadowMaterialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((_state, delta) => {
    const scale = spring.shadowScale.get()
    shadowMeshRef.current?.scale.setScalar(scale)
    if (shadowMaterialRef.current) {
      shadowMaterialRef.current.opacity = spring.shadowOpacity.get()
    }

    if (!meshRef.current) return
    const progress = spring.progress.get()
    const reveal = spring.reveal.get()
    const [x, y, z] = arcPosition(homePosition, targetPosition, progress, ARC_BUMP_HEIGHT)
    // Scaling from zero rather than fading: the three materials are shared
    // across every piece of a colour, so opacity can't be driven per piece
    // without cloning them.
    meshRef.current.scale.setScalar(reveal)
    meshRef.current.position.set(x, y + spring.hoverLiftY.get() + (1 - reveal) * DROP_HEIGHT, z)

    if (reducedMotion) {
      meshRef.current.rotation.set(0, 0, 0)
      return
    }

    // Compute where rotation should end up this frame, then ease toward it
    // rather than snapping straight there — this keeps the now much wider
    // cursor-driven swing (see MAX_INSPECT_YAW) feeling smooth, and also
    // means the pose eases back to home on deselect instead of jumping.
    const target = isSelected
      ? inspectRotation(pointerRef.current, progress, MAX_INSPECT_YAW, MAX_INSPECT_PITCH)
      : { yaw: 0, pitch: isHovered ? -HOVER_TILT : 0 }
    const smoothing = 1 - Math.exp(-delta * ROTATION_SMOOTHING_RATE)
    meshRef.current.rotation.x += (target.pitch - meshRef.current.rotation.x) * smoothing
    meshRef.current.rotation.y += (target.yaw - meshRef.current.rotation.y) * smoothing
  })

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        position={homePosition}
        castShadow
        receiveShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onHoverChange(name)
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onHoverChange(null)
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onSelect(name)
        }}
      >
        {reducedMotion && (isSelected || isHovered) && (
          <Outlines thickness={isSelected ? 4 : 2} color="#4a3f2f" />
        )}
      </mesh>
      <mesh
        ref={shadowMeshRef}
        position={[homePosition[0], homePosition[1] + 0.001, homePosition[2]]}
        rotation-x={-Math.PI / 2}
      >
        <circleGeometry args={[0.045, 24]} />
        <meshBasicMaterial
          ref={shadowMaterialRef}
          map={shadowTexture}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
