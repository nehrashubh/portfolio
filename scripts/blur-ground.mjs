// Writes public/plates/ground-blur.webp, the meadow every section opens over.
//
//   node scripts/blur-ground.mjs
//
// The section overlay used to blur the meadow live, with backdrop-filter over
// the whole viewport. The meadow under it never moves, so the blur is baked
// once here instead. CSS blur(18px) is a standard deviation of 18 CSS pixels;
// the plate is shown at about 2.5x this width on a laptop (cover, 1622px wide),
// so sigma 7 here lands near 18 on screen. A small source is the point: the
// upscale adds softness of its own and the file is a few KB.
import sharp from 'sharp'

const WIDTH = 640
const SIGMA = 7

await sharp('public/plates/ground.webp')
  .resize({ width: WIDTH })
  .blur(SIGMA)
  // The old filter was blur(18px) saturate(1.05).
  .modulate({ saturation: 1.05 })
  .webp({ quality: 82 })
  .toFile('public/plates/ground-blur.webp')

console.log('public/plates/ground-blur.webp')
