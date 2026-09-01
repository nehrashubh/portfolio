// src/WaypointLabel.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Waypoint } from './waypoints'
import type { LabelSide } from './labelPlacement'

/** Body width in CSS pixels. Callers pass this to `chooseLabelSide`. */
export const LABEL_WIDTH_PX = 240

export type WaypointLabelHandle = {
  setVisibility: (opacity: number) => void
  setPlacement: (x: number, y: number, side: LabelSide) => void
  /** Body width in CSS pixels; narrower than LABEL_WIDTH_PX on small frames. */
  setWidth: (px: number) => void
}

type WaypointLabelProps = {
  waypoint: Waypoint
  isActive: boolean
}

/**
 * A label tied to a waypoint marker in the scene, rather than parked at a
 * fixed screen position. The element itself sits *at* the marker's projected
 * position; the body is offset from there in CSS, so the per-frame transform
 * only ever carries the marker's own screen coordinates.
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
      setPlacement(x: number, y: number, side: LabelSide) {
        const el = elementRef.current
        if (!el) return
        // translate3d, not left/top: it stays on the compositor and avoids a
        // layout pass every frame for every label.
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.dataset.side = side
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
        <span className="waypoint-label__leader" aria-hidden="true" />
        <div className="waypoint-label__body">
          <p className="waypoint-label__year">{waypoint.year}</p>
          <h3 className="waypoint-label__title">{waypoint.title}</h3>
          <span className="waypoint-label__rule" aria-hidden="true" />
          <p className="waypoint-label__role">{waypoint.role}</p>
          <p className="waypoint-label__description">{waypoint.description}</p>
        </div>
      </div>
    )
  },
)
