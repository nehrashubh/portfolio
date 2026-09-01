import { describe, it, expect } from 'vitest'
import { FISCHER_POSITION, CATEGORIES, squareToPosition, pieceLetter, pieceSide } from './fischerPosition'

describe('squareToPosition', () => {
  it('matches the source asset position for d1 (queen)', () => {
    const [x, y, z] = squareToPosition('d1')
    expect(x).toBeCloseTo(-0.028944039717316628, 6)
    expect(y).toBeCloseTo(0.017392655834555626, 6)
    expect(z).toBeCloseTo(-0.20260828733444214, 6)
  })

  it('matches the source asset position for e1 (king)', () => {
    const [x, , z] = squareToPosition('e1')
    expect(x).toBeCloseTo(0.028944039717316628, 6)
    expect(z).toBeCloseTo(-0.20260828733444214, 6)
  })

  it('matches the source asset position for h1 (rook)', () => {
    const [x, , z] = squareToPosition('h1')
    expect(x).toBeCloseTo(0.20260828733444214, 6)
    expect(z).toBeCloseTo(-0.20260828733444214, 6)
  })

  it('matches the source asset position for h2 (pawn)', () => {
    const [x, , z] = squareToPosition('h2')
    expect(x).toBeCloseTo(0.20260828733444214, 6)
    expect(z).toBeCloseTo(-0.14472019672393800, 6)
  })
})

describe('FISCHER_POSITION', () => {
  it('has exactly 15 entries', () => {
    expect(FISCHER_POSITION).toHaveLength(15)
  })

  it('has unique piece names', () => {
    const names = FISCHER_POSITION.map((e) => e.pieceName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has unique squares', () => {
    const squares = FISCHER_POSITION.map((e) => e.square)
    expect(new Set(squares).size).toBe(squares.length)
  })

  it('every piece name follows the piece_<type>_<color>[_NN] convention', () => {
    const pattern = /^piece_(king|queen|rook|bishop|knight|pawn)_(white|black)(_\d{2})?$/
    for (const entry of FISCHER_POSITION) {
      expect(entry.pieceName).toMatch(pattern)
    }
  })
})

describe('CATEGORIES', () => {
  it('every FISCHER_POSITION entry has a category matching one of CATEGORIES', () => {
    const validKeys = new Set(CATEGORIES.map((c) => c.key))
    for (const entry of FISCHER_POSITION) {
      expect(validKeys.has(entry.category)).toBe(true)
    }
  })

  it('every category has at least one skill assigned to it', () => {
    for (const category of CATEGORIES) {
      const count = FISCHER_POSITION.filter((entry) => entry.category === category.key).length
      expect(count).toBeGreaterThan(0)
    }
  })

  it('has exactly 3 categories in security, systems, languages order', () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual(['security', 'systems', 'languages'])
  })
})

describe('pieceLetter', () => {
  it('maps each piece kind to its algebraic letter', () => {
    expect(pieceLetter('piece_king_white')).toBe('K')
    expect(pieceLetter('piece_queen_white')).toBe('Q')
    expect(pieceLetter('piece_rook_black_01')).toBe('R')
    expect(pieceLetter('piece_bishop_black_02')).toBe('B')
    expect(pieceLetter('piece_knight_white_01')).toBe('N')
    expect(pieceLetter('piece_pawn_black_05')).toBe('P')
  })

  it('resolves a letter for every piece actually on the board', () => {
    for (const entry of FISCHER_POSITION) {
      expect(pieceLetter(entry.pieceName)).toMatch(/^[KQRBNP]$/)
    }
  })

  it('rejects a name with no recognisable piece kind', () => {
    expect(() => pieceLetter('piece_dragon_white')).toThrow()
  })
})

describe('pieceSide', () => {
  it('reads the side out of the piece name', () => {
    expect(pieceSide('piece_king_white')).toBe('white')
    expect(pieceSide('piece_pawn_black_05')).toBe('black')
  })

  it('resolves a side for every piece actually on the board', () => {
    for (const entry of FISCHER_POSITION) {
      expect(['white', 'black']).toContain(pieceSide(entry.pieceName))
    }
  })

  it('rejects a name with no side', () => {
    expect(() => pieceSide('piece_king_green')).toThrow()
  })
})
