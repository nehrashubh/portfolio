import { Box3, Mesh, type Object3D, Vector3 } from 'three';

/**
 * Visible extent at z = 0 for the fixed 45° camera at z = 6, at the nominal
 * desktop aspect.
 *
 * Only the height is aspect-independent: r3f fixes the *vertical* fov, so the
 * true visible width is `FRAME_HEIGHT × aspect` and drops to about 2.3 on a
 * phone. Anything placing geometry against the frame edge must read the live
 * viewport instead — these are the nominal figures the corridor constraint is
 * reasoned about in, and what the tests measure against.
 */
export const FRAME_WIDTH = 7.95;
export const FRAME_HEIGHT = 4.97;

/**
 * How tall the taller hand stands, in world units — about 85% of the frame.
 *
 * Both halves share the scale this implies. Measured bounds are 0.371 × 0.818
 * for the left half and 0.361 × 0.904 for the right, so at this height each hand
 * is roughly 1.7 units wide and the gap between them is ~62% of the frame —
 * clear of the deck's 51%. `modelFraming.test.ts` asserts that.
 */
export const HAND_HEIGHT = 4.8;
export const HAND_HEIGHT_NARROW = 3.5;

/** How far each hand runs off its side of the frame, and below the bottom. */
export const HAND_OVERHANG = 0.1;
export const HAND_DROP = 0.45;

/**
 * On a phone the frame is only ~2.3 units wide against two hands ~1.3 wide each,
 * so anchoring them to the edges is all it takes to overlap them behind the deck
 * near the centre. No overhang: any more and they leave the frame entirely.
 */
export const HAND_OVERHANG_NARROW = 0;
export const HAND_DROP_NARROW = 0.2;

/** The desktop framing at the nominal aspect. Tests measure against this. */
export const HAND_FRAMING = {
  frameWidth: FRAME_WIDTH,
  frameHeight: FRAME_HEIGHT,
  overhang: HAND_OVERHANG,
  drop: HAND_DROP,
} as const;

/** Uniform scale that makes a bounding-box size the requested height. */
export function fitToHeight(size: Vector3, targetHeight: number): number {
  if (!Number.isFinite(size.y) || size.y <= 0) return 1;
  return targetHeight / size.y;
}

/**
 * Bounding box of just the named nodes.
 *
 * cat.glb is a whole diorama: a 10.9-unit ground plane and a 2.5-unit moon
 * backdrop dwarf the actual subject, the ~1.2-unit cat on its pumpkin (`cat`
 * and `edge`). Framing off the full model's box therefore scales the composition
 * by the ground and pushes the subject out of frame entirely — so measure only
 * what the shot is actually of.
 */
export function subjectBounds(root: Object3D, names: readonly string[]): Box3 {
  const box = new Box3();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (!names.some((prefix) => object.name.startsWith(prefix))) return;
    box.expandByObject(object);
  });
  return box;
}

/**
 * Positions one hand half so its outer edge sits `overhang` beyond its side of
 * the frame and its wrist is cropped `drop` below the bottom edge.
 *
 * Takes the scale rather than a target height, and that is the point: the two
 * halves are different sizes — the cut at x = 0 leaves 13.7k triangles on one
 * side and 21.5k on the other, 0.82 tall against 0.90 — so fitting each one to
 * the same height would scale them differently and the pair would stop being
 * two halves of one drawing. Derive a single scale from the combined bounds and
 * pass it to both.
 *
 * Anchors off each half's own extreme coordinates rather than a shared offset,
 * because their widths differ too.
 */
export function placeHalf(
  bounds: Box3,
  side: 'left' | 'right',
  scale: number,
  options: { frameWidth: number; frameHeight: number; overhang: number; drop: number },
): [number, number, number] {
  const centre = bounds.getCenter(new Vector3());
  const outward = side === 'left' ? -1 : 1;
  // The half's outward-most coordinate is its own bound on that side.
  const outerLocal = side === 'left' ? bounds.min.x : bounds.max.x;

  return [
    outward * (options.frameWidth / 2 + options.overhang) - outerLocal * scale,
    -options.frameHeight / 2 - options.drop - bounds.min.y * scale,
    -centre.z * scale,
  ];
}
