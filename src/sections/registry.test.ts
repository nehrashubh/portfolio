import { describe, it, expect, vi } from 'vitest'
import { SECTIONS } from '../theme'
import { SECTION_REGISTRY, prefetchSection, retryOnce } from './registry'

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

describe('retryOnce', () => {
  it('passes a working loader straight through', async () => {
    const load = vi.fn().mockResolvedValue('ok')
    await expect(retryOnce(load)()).resolves.toBe('ok')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('retries once when the first attempt fails, so a dropped chunk is not permanent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const load = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue('ok')
    await expect(retryOnce(load, 0)()).resolves.toBe('ok')
    expect(load).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('gives up after the second failure, so the boundary can report it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const load = vi.fn().mockRejectedValue(new Error('gone'))
    await expect(retryOnce(load, 0)()).rejects.toThrow('gone')
    expect(load).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
