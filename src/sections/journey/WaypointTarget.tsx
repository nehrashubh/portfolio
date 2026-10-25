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

// Drawn at 4x the on-screen size it ever needs, so the strokes stay clean
// rather than turning into a stair-stepped smear when the sprite is scaled up
// on approach.
const TEXTURE_SIZE = 256

const INK = '#f4f7fb'
const STAMP_INK = '#1b2236'

/**
 * An anchor, in strokes, on the texture's own square: ring, shank, stock, and
 * the arms as the foot of a circle with a barbed fluke at each tip. Traced as
 * one path so the halo underneath and the ink on top are the same shape.
 */
function traceAnchor(ctx: CanvasRenderingContext2D) {
  const s = TEXTURE_SIZE
  const c = s / 2
  ctx.beginPath()
  ctx.moveTo(c + s * 0.06, s * 0.19)
  ctx.arc(c, s * 0.19, s * 0.06, 0, Math.PI * 2)
  ctx.moveTo(c, s * 0.25)
  ctx.lineTo(c, s * 0.8)
  ctx.moveTo(c - s * 0.16, s * 0.34)
  ctx.lineTo(c + s * 0.16, s * 0.34)

  const cy = s * 0.52
  const r = s * 0.28
  const ends = [Math.PI * 0.14, Math.PI * 0.86]
  ctx.moveTo(c + r * Math.cos(ends[0]), cy + r * Math.sin(ends[0]))
  ctx.arc(c, cy, r, ends[0], ends[1])
  for (const [a, way] of [[ends[0], 1], [ends[1], -1]]) {
    const tip = [c + r * Math.cos(a), cy + r * Math.sin(a)]
    // Back down the arm from its tip, splayed either side into a barb.
    const back = Math.atan2(way * Math.cos(a), -way * Math.sin(a))
    for (const splay of [-0.7, 0.7]) {
      ctx.moveTo(tip[0], tip[1])
      ctx.lineTo(tip[0] + Math.cos(back + splay) * s * 0.08, tip[1] + Math.sin(back + splay) * s * 0.08)
    }
  }
}

/**
 * An anchor, for the ship. Ahead of you it is drawn in outline; once you have
 * reached the stop it is stamped, set in ink on a pale disc, so the route
 * behind reads as a row of stamps. It replaced a hairline ring, which said
 * "survey marker" and nothing about the ship.
 */
function drawMarker(ctx: CanvasRenderingContext2D, reached: boolean) {
  const c = TEXTURE_SIZE / 2
  ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (reached) {
    // A soft dark edge so the disc separates from bright cloud.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
    ctx.beginPath()
    ctx.arc(c, c, TEXTURE_SIZE * 0.47, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(c, c, TEXTURE_SIZE * 0.44, 0, Math.PI * 2)
    ctx.fill()
    traceAnchor(ctx)
    ctx.strokeStyle = STAMP_INK
    ctx.lineWidth = 13
    ctx.stroke()
    return
  }

  // Soft halo so the outline separates from bright cloud without needing a
  // heavier stroke.
  traceAnchor(ctx)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.lineWidth = 22
  ctx.stroke()
  ctx.strokeStyle = INK
  ctx.lineWidth = 12
  ctx.stroke()
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
const ANCHOR_TEXTURE = createTexture(false)
const STAMPED_TEXTURE = createTexture(true)

// Markers sit ~1.9 units from the ship, viewed from a 3.3-3.85 unit orbit, so
// this is deliberately small: the previous 0.5 put a marker roughly the height
// of the ship itself in frame. The stamp is a mark beside the text, not the
// subject, so it stays smaller than the type it belongs to.
const BASE_SCALE = 0.11
const EMPHASIS_GAIN = 0.3

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
        const next = reached ? STAMPED_TEXTURE : ANCHOR_TEXTURE
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
        // recede instead of dotting the sky with equal-weight anchors.
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
          map={ANCHOR_TEXTURE}
          transparent
          depthWrite={false}
          toneMapped={false}
          opacity={BASE_MARKER_OPACITY}
        />
      </sprite>
    )
  },
)
