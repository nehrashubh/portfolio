import { Mesh } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The big cloud shell in the airship model is low-poly with flat-shaded
 * faces, so every facet catches its own light and the whole mass reads as
 * cut paper rather than vapour.
 *
 * The exporter split every vertex to get that flat shading, so the split
 * vertices are welded back together and the normals recomputed. Shading then
 * rolls across the surface and the facets disappear.
 *
 * The material is deliberately left OPAQUE. Fading it by view angle was
 * tried and softened the silhouette, but a transparent shell sorts after
 * everything opaque: the dashed route line ahead of the ship vanished behind
 * it, and the geometry showing through where the shell went thin was worse
 * than the facets. The remaining hard silhouette is handled by fog instead.
 */
export function smoothCloudShell(mesh: Mesh): void {
  if (mesh.userData.smoothed) return
  mesh.userData.smoothed = true
  const geometry = mesh.geometry
  geometry.deleteAttribute('normal')
  const merged = mergeVertices(geometry)
  merged.computeVertexNormals()
  mesh.geometry = merged
}
