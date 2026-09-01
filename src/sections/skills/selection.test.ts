import { describe, it, expect } from 'vitest'
import { toggleSelect } from './selection'

describe('toggleSelect', () => {
  it('selects a piece when none is selected', () => {
    expect(toggleSelect(null, 'piece_king_white')).toBe('piece_king_white')
  })

  it('deselects when clicking the already-selected piece', () => {
    expect(toggleSelect('piece_king_white', 'piece_king_white')).toBeNull()
  })

  it('switches selection when clicking a different piece', () => {
    expect(toggleSelect('piece_king_white', 'piece_queen_white')).toBe('piece_queen_white')
  })
})
