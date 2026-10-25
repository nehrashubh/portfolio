export type Waypoint = {
  id: string
  /** Four-digit year, rendered as the label's lead line. */
  year: string
  title: string
  /** Position or credential. Was `dateLabel`, before `year` became its own field. */
  role: string
  /** One line, 80 characters or fewer — asserted in waypoints.test.ts. */
  description: string
  position: [number, number, number]
  /**
   * Hand-tuned scroll progress where this waypoint's label peaks.
   */
  t: number
}

// Path shape: a route that rolls up and down as it wraps around the ship.
//
// Each position sits on an arc about the ship, 30 degrees ahead of wherever the
// camera is at that waypoint's `t`. That angular offset puts the marker beside
// the ship in frame rather than directly between the camera and its subject,
// where it would sit on top of the ship and occlude it.
//
// These are DERIVED, not eyeballed. Each is the camera's own radius and height
// at that `t` (cameraPath.ts), remapped onto the spine's tighter bands —
// radius 3.30-3.85 to 1.72-2.05, height 0.10-0.72 to 0.30-1.25 — then dropped
// 0.55 below ship centre. That shared profile is what makes the drawn line
// echo the flight instead of hanging in space as a flat ring. The derivation
// is offline and its results are baked in here; cameraPath.ts does not import
// this file, and coupling them at runtime would buy nothing for values that
// never change.
//
// Three constraints bound this, all asserted in cameraPath.test.ts:
//   - every marker must stay inside the frame. Pushing the spine further out
//     swings it wider on screen, and past ~34 degrees off-centre it clips in a
//     4:3 window (the 60 degree FOV is vertical; the horizontal half-angle is
//     ~42 degrees at 16:9 but only ~38 at 4:3). These sit at 25.7-27.5.
//   - the whole spine must stay within ORBIT_RADIUS of the ship, or a waypoint
//     ends up behind the camera and its marker is never visible.
//   - the line must not kink. These keep the sharpest heading change to 4.6
//     degrees, against a 5 degree ceiling — the tightest of the three margins,
//     so widen the height swing and this is what trips first.
export const WAYPOINTS: Waypoint[] = [
  {
    id: 'pathways',
    year: '2024',
    title: 'Pathways School Noida',
    role: 'IB Diploma Programme',
    description: 'Graduated with 42 of 45 points.',
    position: [-1.96, 0.87, 1.35],
    t: 0.06,
  },
  {
    id: 'virginia-tech',
    year: '2024',
    title: 'Virginia Tech',
    role: 'B.S. Computer Science — Class of 2028',
    description: 'Minoring in Cybersecurity. GPA 3.63.',
    position: [-1.6, 1.45, 2.57],
    t: 0.27,
  },
  {
    id: 'dbworkout',
    year: '2025',
    title: 'DBWorkout',
    role: 'Undergraduate Research Assistant — Backend',
    description: 'Hardened 60+ API endpoints on a SQL learning platform for 300+ students.',
    position: [-0.6, 0.97, 3.57],
    t: 0.5,
  },
  {
    id: 'spacenet',
    year: '2026',
    title: 'SpaceNet',
    role: 'Undergraduate Research Assistant — Backend',
    description: 'Brought a 1,800-satellite network testbed to Windows for the first time.',
    position: [0.72, 1.57, 3.21],
    t: 0.73,
  },
  {
    id: 'faith',
    year: '2026',
    title: 'Faith Innovations',
    role: 'Full-Stack Developer',
    description: 'Built a CRM for the sales team of a 200-person medical-equipment company.',
    position: [1.62, 1.03, 2.31],
    t: 0.94,
  },
]
