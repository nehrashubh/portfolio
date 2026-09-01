import { describe, it, expect } from 'vitest'
import { parseRoute, formatRoute, sameRoute } from './route'

describe('parseRoute', () => {
  it('reads a bare section', () => {
    expect(parseRoute('#skills')).toEqual({ key: 'skills' })
  })

  it('reads a section with an item, lowercased', () => {
    expect(parseRoute('#Writeups/Massagold')).toEqual({ key: 'writeups', item: 'massagold' })
    expect(parseRoute('#skills/piece_queen_white')).toEqual({ key: 'skills', item: 'piece_queen_white' })
  })

  it('is null for an empty hash, an unknown section, or junk', () => {
    expect(parseRoute('')).toBeNull()
    expect(parseRoute('#')).toBeNull()
    expect(parseRoute('#about')).toBeNull()
    expect(parseRoute('#skills/../etc')).toBeNull()
  })
})

describe('formatRoute', () => {
  it('round-trips through parseRoute', () => {
    expect(parseRoute(formatRoute('work', 'dbworkout'))).toEqual({ key: 'work', item: 'dbworkout' })
    expect(parseRoute(formatRoute('projects'))).toEqual({ key: 'projects' })
  })
})

describe('sameRoute', () => {
  it('compares key and item, treating a missing item as empty', () => {
    expect(sameRoute({ key: 'skills' }, { key: 'skills' })).toBe(true)
    expect(sameRoute({ key: 'skills' }, { key: 'skills', item: 'x' })).toBe(false)
    expect(sameRoute(null, null)).toBe(true)
    expect(sameRoute(null, { key: 'skills' })).toBe(false)
  })
})
