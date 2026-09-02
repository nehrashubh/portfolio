// Renders the link-preview image from the hero itself, so it is always the
// site's own sky, branch and name. The preview server must be running:
//
//   npx vite build && npx vite preview --port 4173
//   node scripts/og.mjs        → public/og.jpg (1200×630)
//
// Then rebuild so dist/ carries the new image.
import { chromium } from 'playwright'
import sharp from 'sharp'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:4173/', { waitUntil: 'load' })
await page.addStyleTag({
  content: `
    .hero__scroll, .hero__links, .petals { display: none !important; }
    .hero { transform: none !important; }
    .hero__name { font-size: 84px !important; }
    .hero__hook { font-size: 26px !important; margin-top: 22px !important; }
    .hero__summary { font-size: 12px !important; margin-top: 24px !important; }
  `,
})
await page.waitForTimeout(900)
const png = await page.screenshot({ type: 'png' })
await browser.close()
await sharp(png).resize(1200, 630).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og.jpg')
const { size } = await import('node:fs').then((fs) => fs.statSync('public/og.jpg'))
console.log(`public/og.jpg 1200×630, ${(size / 1024).toFixed(0)} KB`)
