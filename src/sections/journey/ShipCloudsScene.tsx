// src/ShipCloudsScene.tsx
import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { MODEL_OFFSET, MODEL_SCALE } from './sceneBounds'
import { smoothCloudShell } from './cloudShell'

// Draco geometry + WebP textures at the atlases' full 1024px resolution
// (scripts/optimize-models.mjs). An earlier pass resized the atlases to
// 512px and visibly softened the clouds; this one changes only the encoding.
// The source was run through the prototype's pad-glb-textures.mjs, which
// pads the UV islands so polygon edges stop sampling their white gutter.
const GLB_PATH = '/models/ship.glb'
/** Self-hosted copy of three's Draco decoder, shared with the other scenes. */
const DRACO_PATH = '/draco/'

// MODEL_SCALE / MODEL_OFFSET live in sceneBounds.ts alongside the measured
// ship and cloud bounds the camera path depends on, so the transform and the
// measurements taken under it can never drift apart.

/**
 * The same picture from a shader a fraction of the cost.
 *
 * Every material in the model is black with a white emissive and an emissive
 * map, and the scene has no lights, so a MeshStandardMaterial here outputs
 * exactly its emissive map: the whole PBR path runs per fragment and adds
 * nothing. That was the section's frame rate. The cloud billboards overlap
 * thousands deep, and on an integrated GPU at 1.5x they held it at 19 fps.
 *
 * Colour comes from the emissive map, as before. The clouds' alpha lives in
 * their base-colour map's alpha channel, which MeshBasicMaterial's alphaMap
 * cannot read (it samples green), so that one line of its shader is swapped
 * to read alpha instead.
 *
 * Measured on an Intel iGPU at 1622x900 and 1.56x: 19 fps before, 24 with
 * the unlit shader, 42 with the discard below. The two images match pixel for
 * pixel at the first stop.
 */
/**
 * A billboard is mostly transparent margin around its puff, and every pixel of
 * that margin was still read, blended and written, thousands of quads deep.
 * Below this alpha a fragment changes the image by a few levels at most
 * (measured: mean 0.06/255, max 10/255), so it is discarded instead of
 * blended, which is where most of the frame time went.
 */
const INVISIBLE_ALPHA = 0.03

function toUnlit(source: MeshStandardMaterial): MeshBasicMaterial {
  const unlit = new MeshBasicMaterial({
    name: source.name,
    map: source.emissiveMap,
    alphaMap: source.map,
    transparent: source.transparent,
    depthWrite: source.depthWrite,
    opacity: source.opacity,
    side: source.side,
    alphaTest: source.transparent ? INVISIBLE_ALPHA : 0,
  })
  if (source.map) {
    unlit.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <alphamap_fragment>',
        'diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).a;',
      )
    }
  }
  return unlit
}

export function ShipCloudsScene() {
  const { scene } = useGLTF(GLB_PATH, DRACO_PATH)
  const { gl, invalidate } = useThree()

  useEffect(() => {
    // GLTFLoader-created textures default to anisotropy: 1 (no anisotropic
    // filtering). At the oblique viewing angles this establishing-shot
    // camera uses constantly, that reads as blurry, smeared textures even
    // though the source images themselves are crisp — this is the fix for
    // that, not a texture-quality problem in the asset.
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy()

    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      // Already swapped: useGLTF caches the scene, so a second visit to the
      // section walks the same objects again.
      if (!(object.material instanceof MeshStandardMaterial)) return
      const material = object.material
      // The opaque low-poly shell: weld its split vertices and reshade it
      // smooth, so the mass rolls instead of showing every facet.
      if (material.name === 'Poly') smoothCloudShell(object)
      if (material.map) material.map.anisotropy = maxAnisotropy
      if (material.emissiveMap) material.emissiveMap.anisotropy = maxAnisotropy

      // Cloud_3 ships as alphaMode MASK (cutoff ~0.447), which GLTFLoader
      // turns into alphaTest. Alpha testing is binary per pixel, so each of
      // that mesh's 10k soft cloud billboards gets clipped to a hard,
      // aliased polygon silhouette instead of fading out. Blending it like
      // its Cloud_1/Cloud_2 siblings (which ship as alphaMode BLEND) is what
      // makes the cloud field read as soft painterly volume.
      if (material.alphaTest > 0) {
        material.alphaTest = 0
        material.transparent = true
        material.depthWrite = false
      }

      object.material = toUnlit(material)
      material.dispose()
    })
    // The canvas renders on demand, and nothing else will ask for the frame
    // that shows the swapped materials.
    invalidate()
  }, [scene, gl, invalidate])

  return <primitive object={scene} scale={MODEL_SCALE} position={MODEL_OFFSET} />
}

useGLTF.preload(GLB_PATH, DRACO_PATH)
