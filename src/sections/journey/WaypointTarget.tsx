// src/WaypointTarget.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { CanvasTexture } from 'three'
import type { Sprite, SpriteMaterial } from 'three'

export type WaypointTargetHandle = {
  setReached: (reached: boolean) => void
  setEmphasis: (amount: number) => void
}

type WaypointTargetProps = {
  position: [number, number, number]
}

// Drawn at 4x the on-screen size it ever needs, so the ring's thin stroke
// stays clean rather than turning into a stair-stepped smear when the sprite
// is scaled up on approach.
const TEXTURE_SIZE = 256

/**
 * A thin ring, optionally with a filled centre once the waypoint is behind
 * you. This replaces an earlier heavy square-with-an-X: at the sizes this
 * scene uses, a boxed X read as a "broken image" placeholder and fought the
 * painterly artwork for attention. A hairline ring reads as a survey marker
 * and stays quiet against the clouds.
 */
function drawMarker(ctx: CanvasRenderingContext2D, reached: boolean) {
  const c = TEXTURE_SIZE / 2
  const radius = TEXTURE_SIZE * 0.3

  ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  // Soft outer halo so the marker separates from bright cloud without
  // needing a heavy stroke.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(c, c, radius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#f2dcc0'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(c, c, radius, 0, Math.PI * 2)
  ctx.stroke()

  if (reached) {
    ctx.fillStyle = '#f2dcc0'
    ctx.beginPath()
    ctx.arc(c, c, radius * 0.42, 0, Math.PI * 2)
    ctx.fill()
  }
}

function createTexture(reached: boolean): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (ctx) drawMarker(ctx, reached)
  return new CanvasTexture(canvas)
}

// Shared across every marker instance - same texture content, no reason to
// pay for N canvases/GPU uploads.
const RING_TEXTURE = createTexture(false)
const RING_FILLED_TEXTURE = createTexture(true)

// Markers sit ~1.9 units from the ship, viewed from a 3.3-3.85 unit orbit, so
// this is deliberately small: the previous 0.5 put a marker roughly the height
// of the ship itself in frame.
const BASE_SCALE = 0.16
const EMPHASIS_GAIN = 0.5

/**
 * Cloud billboards are depthWrite:false, so they never write to the depth
 * buffer and cannot occlude anything through it — they simply blend over
 * whatever was drawn before them. That is why the first waypoint's marker was
 * invisible: not occluded, just painted over. Drawing markers after the clouds
 * is the fix. They stay depth-TESTED, so the opaque ship, which does write
 * depth, still hides a marker genuinely behind it.
 */
export const MARKER_RENDER_ORDER = 10

/** Inactive markers were lost against lit cloud at 0.25. */
export const BASE_MARKER_OPACITY = 0.5

export const WaypointTarget = forwardRef<WaypointTargetHandle, WaypointTargetProps>(
  function WaypointTarget({ position }, ref) {
    const spriteRef = useRef<Sprite>(null)

    useImperativeHandle(ref, () => ({
      setReached(reached: boolean) {
        const sprite = spriteRef.current
        if (!sprite) return
        const material = sprite.material as SpriteMaterial
        const next = reached ? RING_FILLED_TEXTURE : RING_TEXTURE
        if (material.map === next) return
        material.map = next
        material.needsUpdate = true
      },
      setEmphasis(amount: number) {
        const sprite = spriteRef.current
        if (!sprite) return
        const clamped = Math.min(Math.max(amount, 0), 1)
        const scale = BASE_SCALE * (1 + clamped * EMPHASIS_GAIN)
        sprite.scale.set(scale, scale, scale)
        // Fade the marker with the label it belongs to, so inactive waypoints
        // recede instead of dotting the sky with equal-weight rings.
        const material = sprite.material as SpriteMaterial
        material.opacity = BASE_MARKER_OPACITY + clamped * (1 - BASE_MARKER_OPACITY)
      },
    }))

    return (
      <sprite
        ref={spriteRef}
        position={position}
        scale={[BASE_SCALE, BASE_SCALE, BASE_SCALE]}
        renderOrder={MARKER_RENDER_ORDER}
      >
        <spriteMaterial
          map={RING_TEXTURE}
          transparent
          depthWrite={false}
          toneMapped={false}
          opacity={BASE_MARKER_OPACITY}
        />
      </sprite>
    )
  },
)
