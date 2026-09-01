type Vec3 = [number, number, number]

export function arcPosition(home: Vec3, target: Vec3, progress: number, bumpHeight: number): Vec3 {
  const bump = Math.sin(progress * Math.PI) * bumpHeight
  return [
    home[0] + (target[0] - home[0]) * progress,
    home[1] + (target[1] - home[1]) * progress + bump,
    home[2] + (target[2] - home[2]) * progress,
  ]
}

export function inspectRotation(
  cursor: { x: number; y: number },
  progress: number,
  maxYaw: number,
  maxPitch: number,
): { yaw: number; pitch: number } {
  const clampedX = Math.max(-1, Math.min(1, cursor.x))
  const clampedY = Math.max(-1, Math.min(1, cursor.y))
  return {
    yaw: clampedX * maxYaw * progress,
    pitch: clampedY * maxPitch * progress,
  }
}
