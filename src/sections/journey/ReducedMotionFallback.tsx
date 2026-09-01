import { WAYPOINTS } from './waypoints'


export function ReducedMotionFallback() {
  return (
    <div className="journey-static">
      <ol className="reduced-motion-list">
      {WAYPOINTS.map((waypoint) => (
        <li key={waypoint.id}>
          <p className="reduced-motion-list__year">{waypoint.year}</p>
          <h3 className="reduced-motion-list__title">{waypoint.title}</h3>
          <p className="reduced-motion-list__role">{waypoint.role}</p>
          <p className="reduced-motion-list__description">{waypoint.description}</p>
        </li>
      ))}
      </ol>
    </div>
  )
}
