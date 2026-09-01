import { describe, it, expect } from 'vitest'
import { SECTIONS } from '../theme'
import { SECTION_REGISTRY, prefetchSection } from './registry'

describe('section registry', () => {
  it('has an entry for every card', () => {
    for (const s of SECTIONS) expect(SECTION_REGISTRY[s.key]).toBeDefined()
  })

  it('resolves each loader to a component module', async () => {
    for (const s of SECTIONS) {
      const mod = await SECTION_REGISTRY[s.key].load()
      expect(typeof mod.default).toBe('function')
    }
  })

  it('prefetch never throws, even if a chunk fails', () => {
    expect(() => prefetchSection('skills')).not.toThrow()
  })
})
