// Measured world-space geometry of the ship_in_clouds GLB.
//
// These are MEASURED, not derived. An earlier version of this file tried to
// compute them by multiplying the GLB's raw accessor min/max through the
// Sketchfab baked scale and MODEL_OFFSET by hand, and got the ship's Z wrong
// by 5.5 units — the exporter puts transforms on intermediate nodes as
// `matrix` entries (including an axis conversion), so composing them by hand
// from TRS alone silently produces the wrong answer.
//
// To re-measure after changing MODEL_SCALE / MODEL_OFFSET, or after swapping
// the asset, let three compose the matrices for you:
//
//   1. In ShipCloudsScene, on the <primitive>'s onUpdate, walk the root with
//      `new Box3().setFromObject(mesh)` per Mesh and log the results.
//   2. Load the page and read them off the console.
//
// Everything else in the scene keys off these numbers, so they are worth
// re-taking rather than guessing at.
import { Vector3 } from 'three'

export const MODEL_SCALE = 2.33
export const MODEL_OFFSET: [number, number, number] = [-0.34, 1.18, 7.2]

/**
 * The airship's VERTEX CENTROID — the camera's look target and the subject
 * of every shot.
 *
 * Deliberately not the bounding-box centre. The ship's box is 3.65 units
 * tall because thin rigging and an anchor line hang well below the hull, so
 * its centre (-0.33, -0.332, 1.539) lands on empty rope: aiming there frames
 * a bare vertical line with the actual ship out of shot above. The centroid
 * is weighted by where the geometry actually is, and sits 1.24 units higher.
 */
export const SHIP_CENTER = new Vector3(-0.127, 0.904, 1.678)

/** Bounding box of the ship including that low-hanging rigging. */
export const SHIP_BBOX_CENTER = new Vector3(-0.33, -0.332, 1.539)
export const SHIP_SIZE = new Vector3(1.79, 3.65, 1.7)

/** The ship's own vertical extent, y from about -2.16 to 1.49. */
export const SHIP_BOTTOM = SHIP_BBOX_CENTER.y - SHIP_SIZE.y / 2
export const SHIP_TOP = SHIP_BBOX_CENTER.y + SHIP_SIZE.y / 2

// "Cloud_Poly_Poly_0" — the big OPAQUE, hard-edged low-poly cloud shell.
// This is the mesh whose UV-island edges read as white streaks when viewed
// close up, and the one that occludes the ship. The soft Cloud_1/2/3
// billboards are alpha-blended, much larger, and look fine to fly among.
//
// Note how flat it is: only ~4.2 units tall (y from -0.98 to 3.22) but 15.7
// deep. It is a cloud *layer*, and the ship hangs beneath its underside —
// which is what makes a low camera work. Below y = -0.98 there is nothing
// between the camera and the ship.
const CLOUD_SHELL_CENTER = new Vector3(-0.279, 1.119, 0.809)
const CLOUD_SHELL_SIZE = new Vector3(9.34, 4.2, 15.68)

export const CLOUD_SHELL_MIN = CLOUD_SHELL_CENTER.clone().addScaledVector(CLOUD_SHELL_SIZE, -0.5)
export const CLOUD_SHELL_MAX = CLOUD_SHELL_CENTER.clone().addScaledVector(CLOUD_SHELL_SIZE, 0.5)

/**
 * True when `point` sits inside the opaque cloud shell.
 *
 * Flying inside it is what made the scene look broken: the camera stares at
 * the shell's interior faces at point-blank range, where its texels are
 * magnified enormously and the atlas's UV-island edges read as thick white
 * streaks across the whole frame.
 */
export function isInsideCloudShell(point: Vector3): boolean {
  return (
    point.x > CLOUD_SHELL_MIN.x &&
    point.x < CLOUD_SHELL_MAX.x &&
    point.y > CLOUD_SHELL_MIN.y &&
    point.y < CLOUD_SHELL_MAX.y &&
    point.z > CLOUD_SHELL_MIN.z &&
    point.z < CLOUD_SHELL_MAX.z
  )
}
