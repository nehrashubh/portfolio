import { BufferAttribute, BufferGeometry } from 'three';

/**
 * Splits a geometry's triangles into two geometries by which side of a plane
 * each triangle's centroid falls on.
 *
 * damaged_hands.glb models both hands as a single merged mesh per material, so
 * the only way to place them independently is to cut the geometry. Centroid
 * classification means no triangle is ever split, so both halves stay watertight
 * where the original was and no new edges appear — which is why a cut at x = 0
 * lands cleanly between the two wrists.
 *
 * Expects positions already in the space the cut is measured in: bake the mesh's
 * world matrix into the geometry before calling.
 */
export function splitByCentroidX(
  geometry: BufferGeometry,
  cutX = 0,
): { left: BufferGeometry; right: BufferGeometry } {
  // Triangle soup, so a triangle is always three consecutive vertices and the
  // partition is a straight copy with no index remapping.
  const soup = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = soup.getAttribute('position');
  const triangles = position.count / 3;

  const keepLeft = new Uint8Array(triangles);
  let leftCount = 0;
  for (let t = 0; t < triangles; t++) {
    const centroidX =
      (position.getX(t * 3) + position.getX(t * 3 + 1) + position.getX(t * 3 + 2)) / 3;
    if (centroidX < cutX) {
      keepLeft[t] = 1;
      leftCount++;
    }
  }

  const build = (wanted: 1 | 0, count: number) => {
    const out = new BufferGeometry();
    for (const name of Object.keys(soup.attributes)) {
      const source = soup.getAttribute(name);
      const items = source.itemSize;
      const packed = new Float32Array(count * 3 * items);
      let write = 0;
      for (let t = 0; t < triangles; t++) {
        if (keepLeft[t] !== wanted) continue;
        for (let vertex = 0; vertex < 3; vertex++) {
          for (let component = 0; component < items; component++) {
            packed[write++] = source.array[(t * 3 + vertex) * items + component];
          }
        }
      }
      out.setAttribute(name, new BufferAttribute(packed, items));
    }
    return out;
  };

  return { left: build(1, leftCount), right: build(0, triangles - leftCount) };
}
