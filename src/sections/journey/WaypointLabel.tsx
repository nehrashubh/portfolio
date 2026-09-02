// src/WaypointLabel.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Waypoint } from './waypoints'
import type { LabelSide } from './labelPlacement'

/** Card width in CSS pixels. Callers pass this to `chooseLabelSide`. */
export const LABEL_WIDTH_PX = 250

export type WaypointLabelHandle = {
  setVisibility: (opacity: number) => void
  /** `offFrame` means the anchor was clamped and the card sits away from its marker. */
  setPlacement: (x: number, y: number, side: LabelSide, offFrame?: boolean) => void
  /** Card width in CSS pixels; narrower than LABEL_WIDTH_PX on small frames. */
  setWidth: (px: number) => void
}

type WaypointLabelProps = {
  waypoint: Waypoint
  isActive: boolean
}

/**
 * A card tied to a waypoint marker in the scene. The element sits AT the
 * marker's projected position; the card is offset from there in CSS, so the
 * per-frame transform only ever carries the marker's own screen coordinates.
 *
 * No leader line. The card is a pane of dark glass beside the ring, close
 * enough that the pairing is obvious, with a brass edge on the side that
 * faces the marker — the edge points, so nothing else has to.
 */
export const WaypointLabel = forwardRef<WaypointLabelHandle, WaypointLabelProps>(
  function WaypointLabel({ waypoint, isActive }, ref) {
    const elementRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      setVisibility(opacity: number) {
        const el = elementRef.current
        if (!el) return
        el.style.opacity = String(opacity)
      },
      setPlacement(x: number, y: number, side: LabelSide, offFrame = false) {
        const el = elementRef.current
        if (!el) return
        // translate3d, not left/top: it stays on the compositor and avoids a
        // layout pass every frame for every label.
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.dataset.side = side
        if (offFrame) el.dataset.offFrame = ''
        else delete el.dataset.offFrame
      },
      setWidth(px: number) {
        const el = elementRef.current
        if (!el) return
        el.style.setProperty('--label-w', `${px}px`)
      },
    }))

    return (
      <div
        ref={elementRef}
        className="waypoint-label"
        data-side="right"
        style={{ opacity: 0 }}
        aria-hidden={!isActive}
      >
        <div className="waypoint-label__card">
          <p className="waypoint-label__year">{waypoint.year}</p>
          <h3 className="waypoint-label__title">{waypoint.title}</h3>
          <p className="waypoint-label__role">{waypoint.role}</p>
          <p className="waypoint-label__description">{waypoint.description}</p>
        </div>
      </div>
    )
  },
)
