// src/WaypointLabel.tsx
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Waypoint } from './waypoints'
import type { LabelSide } from './labelPlacement'

/** Text column width in CSS pixels. Callers pass this to `chooseLabelSide`. */
export const LABEL_WIDTH_PX = 274

export type WaypointLabelHandle = {
  setVisibility: (opacity: number) => void
  /** `offFrame` means the anchor was clamped and the text sits away from its marker. */
  setPlacement: (x: number, y: number, side: LabelSide, offFrame?: boolean) => void
  /** Text width in CSS pixels; narrower than LABEL_WIDTH_PX on small frames. */
  setWidth: (px: number) => void
}

type WaypointLabelProps = {
  waypoint: Waypoint
  isActive: boolean
}

/**
 * A stop's text, tied to its marker in the scene. The element sits AT the
 * marker's projected position; the text is offset from there in CSS, so the
 * per-frame transform only ever carries the marker's own screen coordinates.
 *
 * No leader line and no panel. The type sits in the sky beside its ring,
 * close enough that the pairing is obvious, and a soft radial scrim behind
 * it — invisible over dark cloud, quietly darkening bright cloud — is what
 * keeps it legible without drawing a box around it.
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
