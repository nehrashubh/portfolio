// Offline model optimisation. Run once, commit the output:
//
//   npm run optimize:models
//
// Draco compresses geometry (~6x on these meshes); WebP re-encodes textures
// at full resolution and quality 90. An earlier pass on the airship resized
// its atlases to 512px and was rejected for softness — resolution is not
// touched here, only encoding. KTX2 needs toktx/basisu, which this machine
// does not have.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, draco, textureCompress } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import { copyFile, stat } from 'node:fs/promises'

const JOBS = [
  {
    src: '../project-display/public/damaged_hands.glb',
    out: 'public/models/hands.glb',
    // The atlases are UV-padded; 14-bit texcoords keep quantisation error
    // well under a texel so island edges never sample their gutter.
    draco: { method: 'edgebreaker', quantizeTexcoord: 14 },
  },
  {
    src: '../journey-scene/public/ship_in_clouds.glb',
    out: 'public/models/ship.glb',
    draco: { method: 'edgebreaker', quantizeTexcoord: 14 },
  },
]

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
})

const kb = async (p) => `${((await stat(p)).size / 1024).toFixed(0)} KB`

for (const job of JOBS) {
  const document = await io.read(job.src)
  await document.transform(
    dedup(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90 }),
    draco(job.draco),
  )
  await io.write(job.out, document)
  console.log(`${job.out}: ${await kb(job.src)} → ${await kb(job.out)}`)
}

// Already draco + webp; only its name changes.
await copyFile('../chess-scene/public/chess_set_optimized.glb', 'public/models/chess.glb')
console.log(`public/models/chess.glb: ${await kb('public/models/chess.glb')}`)
