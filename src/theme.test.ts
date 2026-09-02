import { describe, it, expect } from 'vitest'
import { SECTIONS, LANDING_VEIL, COPY, MOTION } from './theme'

describe('SECTIONS', () => {
  it('lists the four sections in chronological hour order', () => {
    expect(SECTIONS.map((s) => s.key)).toEqual([
      'skills',
      'projects',
      'writeups',
      'work',
    ])
  })

  it('numbers them 01 through 04', () => {
    expect(SECTIONS.map((s) => s.index)).toEqual(['01', '02', '03', '04'])
  })

  it('gives every section a veil and an ink', () => {
    for (const s of SECTIONS) {
      expect(s.veil).toMatch(/^rgba\(/)
      expect(s.ink).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('COPY', () => {
  it('carries the hook verbatim', () => {
    expect(COPY.hook).toBe('I find the way in — before someone worse does.')
  })

  it('keeps the bio line lowercase, as written', () => {
    expect(COPY.bio).toBe(COPY.bio.toLowerCase())
  })
})

describe('MOTION', () => {
  it('opens slower than it closes', () => {
    expect(MOTION.openMs).toBe(900)
    expect(MOTION.closeMs).toBe(820)
    expect(MOTION.openMs).toBeGreaterThan(MOTION.closeMs)
  })
})

describe('LANDING_VEIL', () => {
  it('is the pale value every section grades back to', () => {
    expect(LANDING_VEIL).toBe('rgba(245,250,254,.86)')
  })
})

describe('section inks', () => {
  // A luminance proxy is enough here. Three sections carry light ink on a
  // dark veil; Skills carries dark ink on a gold one. What every section must
  // do is put its ink far from its own veil, and far from the card title it
  // travels out of, so the flight always reads as a change.
  const lumaHex = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  }
  const lumaRgba = (rgba: string) => {
    const [r, g, b] = rgba.match(/[\d.]+/g)!.map(Number)
    return 0.299 * r + 0.587 * g + 0.114 * b
  }

  it('puts every ink far from its own veil', () => {
    for (const s of SECTIONS) {
      expect(Math.abs(lumaHex(s.ink) - lumaRgba(s.veil))).toBeGreaterThan(110)
    }
  })

  it('moves every title a visible distance from the card ink it leaves', () => {
    const cardTitle = lumaHex('#14263a')
    for (const s of SECTIONS) {
      expect(Math.abs(lumaHex(s.ink) - cardTitle)).toBeGreaterThan(20)
    }
  })
})
