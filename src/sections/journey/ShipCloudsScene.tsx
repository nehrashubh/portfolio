// src/ShipCloudsScene.tsx
import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial } from 'three'
import { MODEL_OFFSET, MODEL_SCALE } from './sceneBounds'

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

export function ShipCloudsScene() {
  const { scene } = useGLTF(GLB_PATH, DRACO_PATH)
  const { gl } = useThree()

  useEffect(() => {
    // GLTFLoader-created textures default to anisotropy: 1 (no anisotropic
    // filtering). At the oblique viewing angles this establishing-shot
    // camera uses constantly, that reads as blurry, smeared textures even
    // though the source images themselves are crisp — this is the fix for
    // that, not a texture-quality problem in the asset.
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy()

    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      const material = object.material as MeshStandardMaterial
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
        material.needsUpdate = true
      }
    })
  }, [scene, gl])

  return <primitive object={scene} scale={MODEL_SCALE} position={MODEL_OFFSET} />
}

useGLTF.preload(GLB_PATH, DRACO_PATH)
