import { describe, it, expect } from 'vitest'
import { readableOnDark } from './color'

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('readableOnDark', () => {
  it('lifts a near-black category into a legible accent', () => {
    const out = readableOnDark('#280D11') // Exploitation
    expect(luminance(out)).toBeGreaterThan(luminance('#280D11'))
    expect(luminance(out)).toBeGreaterThan(0.3)
  })

  it('leaves an already-light colour unchanged', () => {
    expect(readableOnDark('#E1E6E8')).toBe('#E1E6E8') // Misc
  })

  it('keeps hue recognisable — a violet stays violet-ish (blue-dominant)', () => {
    const out = readableOnDark('#854ABB')
    const n = parseInt(out.slice(1), 16)
    const [r, , b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    expect(b).toBeGreaterThan(r)
  })
})
