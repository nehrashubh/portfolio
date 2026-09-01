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
  it('gives every section light ink on a dark veil, so opening a card always reads the same', () => {
    // A luminance proxy is enough here: every ink must be far brighter than
    // the card title it travels from (#14263a), in every section.
    const luma = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      return (
        0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
      )
    }
    const cardTitle = luma('#14263a')
    for (const s of SECTIONS) {
      expect(luma(s.ink) - cardTitle).toBeGreaterThan(120)
    }
  })
})

describe('section veil contrast', () => {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const lumaHex = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return (
      0.2126 * lin((n >> 16) & 255) +
      0.7152 * lin((n >> 8) & 255) +
      0.0722 * lin(n & 255)
    )
  }
  const lumaRgba = (s: string) => {
    const [r, g, b] = s.match(/\d+/g)!.slice(0, 3).map(Number)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }

  it('carries its ink at 4.5:1 or better, so section text stays legible', () => {
    for (const s of SECTIONS) {
      const a = lumaHex(s.ink)
      const b = lumaRgba(s.veil)
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      expect(ratio, `${s.title} ink on veil`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
