// Screenshot harness. The preview server must already be running:
//
//   npx vite build && npx vite preview --port 4173
//   node scripts/shoot.mjs landing            # 1440x900
//   node scripts/shoot.mjs skills "iPhone 13" # any Playwright device name
//   node scripts/shoot.mjs all                # every section, desktop and phone
//
// Writes screenshots/<name>[-<device>].png and prints any page errors.
// Headless Chromium renders WebGL through SwiftShader, so a still is
// representative but frame rate is not.
import { mkdir } from 'node:fs/promises'
import { chromium, devices } from 'playwright'

const BASE = 'http://localhost:4173'
const SECTIONS = {
  skills: /^Skills/,
  projects: /^Projects/,
  writeups: /^Writeups/,
  work: /^Work/,
}
const ALL = ['landing', ...Object.keys(SECTIONS)]

const [, , what = 'landing', deviceName = ''] = process.argv
const targets = what === 'all' ? ALL : [what]
const contexts =
  what === 'all'
    ? [
        ['', { viewport: { width: 1440, height: 900 } }],
        ['iphone', devices['iPhone 13']],
      ]
    : [[deviceName ? deviceName.toLowerCase().replace(/\s+/g, '') : '', deviceName ? devices[deviceName] : { viewport: { width: 1440, height: 900 } }]]

if (deviceName && !devices[deviceName]) {
  console.error(`Unknown device "${deviceName}". Try: ${Object.keys(devices).filter((d) => /iPhone|Pixel|iPad/.test(d)).join(', ')}`)
  process.exit(1)
}

await mkdir('screenshots', { recursive: true })
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

for (const [suffix, options] of contexts) {
  for (const target of targets) {
    const context = await browser.newContext(options)
    const page = await context.newPage()
    const problems = []
    page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

    await page.goto(BASE, { waitUntil: 'load' })
    await page.waitForTimeout(800)
    const file = `screenshots/${target}${suffix ? `-${suffix}` : ''}.png`

    if (target === 'landing') {
      await page.screenshot({ path: file })
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(800)
      await page.getByRole('button', { name: SECTIONS[target] }).click()
      // Chunk, model, first frames. The airship is the slowest.
      await page.waitForTimeout(target === 'work' ? 9000 : 6000)
      await page.screenshot({ path: file })
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    console.log(`${file}${overflow ? '  HORIZONTAL OVERFLOW' : ''}${problems.length ? '\n  ' + problems.join('\n  ') : ''}`)
    await context.close()
  }
}
await browser.close()
