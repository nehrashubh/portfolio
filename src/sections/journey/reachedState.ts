// src/reachedState.ts
// A waypoint is "reached" once scroll progress has advanced to (or past) its
// t value. Bidirectional: scrubbing back below t un-reaches it again, same
// as every other scroll-driven state in this app.
export function computeReachedStates(progress: number, waypointTs: number[]): boolean[] {
  return waypointTs.map((t) => progress >= t)
}
