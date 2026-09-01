export type CategoryKey = 'security' | 'systems' | 'languages'

/** A piece of work backing a skill. Empty until the real ones land. */
export type SkillLink = {
  label: string
  href: string
  kind: 'project' | 'writeup' | 'talk'
}

export type FischerPositionEntry = {
  pieceName: string
  square: string
  /** Full title, used in the detail view. */
  skillName: string
  /** Trimmed title for the three-column index, where space is tight. */
  shortName: string
  description: string
  /** One line on why this skill is this piece. Carries the metaphor. */
  whyPiece: string
  links: SkillLink[]
  /** pieceNames of neighbouring skills, offered as cross-links. */
  related: string[]
  category: CategoryKey
}

export const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'security', label: 'Security & Offense' },
  { key: 'systems', label: 'Systems & Infrastructure' },
  { key: 'languages', label: 'Languages & Development' },
]

export const FISCHER_POSITION: FischerPositionEntry[] = [
  {
    pieceName: 'piece_queen_white',
    square: 'b8',
    skillName: 'Offensive Security / Penetration Testing',
    shortName: 'Penetration Testing',
    description: 'Simulating real-world attacks to find and fix vulnerabilities before attackers do.',
    whyPiece: 'The queen has the most range on the board — this is the discipline that touches every other one here.',
    links: [],
    related: ['piece_knight_white_01', 'piece_bishop_black_01'],
    category: 'security',
  },
  {
    pieceName: 'piece_bishop_black_01',
    square: 'b4',
    skillName: 'Web Application Security (OWASP)',
    shortName: 'Web App Security',
    description: 'Identifying and remediating vulnerabilities like injection, XSS, and broken auth.',
    whyPiece: 'A bishop commits to one colour and covers it completely. Depth over breadth.',
    links: [],
    related: ['piece_queen_white', 'piece_bishop_black_02'],
    category: 'security',
  },
  {
    pieceName: 'piece_bishop_black_02',
    square: 'b3',
    skillName: 'Security Architecture',
    shortName: 'Security Architecture',
    description: 'Designing systems with defense-in-depth and least-privilege from the ground up.',
    whyPiece: 'The other bishop: the same reach, aimed at the squares the first one can never touch.',
    links: [],
    related: ['piece_bishop_black_01', 'piece_king_white'],
    category: 'security',
  },
  {
    pieceName: 'piece_knight_white_01',
    square: 'e5',
    skillName: 'Exploit Development',
    shortName: 'Exploit Development',
    description: 'Writing proof-of-concept code that demonstrates real impact of a vulnerability.',
    whyPiece: 'The knight is the only piece that moves through others. It finds the path nothing else can.',
    links: [],
    related: ['piece_knight_black_01', 'piece_queen_white'],
    category: 'security',
  },
  {
    pieceName: 'piece_knight_black_01',
    square: 'c3',
    skillName: 'Vulnerability Research',
    shortName: 'Vulnerability Research',
    description: 'Digging into software and protocols to uncover unknown weaknesses.',
    whyPiece: 'The second knight, working the same way from the other side of the board.',
    links: [],
    related: ['piece_knight_white_01', 'piece_king_black'],
    category: 'security',
  },
  {
    pieceName: 'piece_king_white',
    square: 'c1',
    skillName: 'Security Mindset',
    shortName: 'Security Mindset',
    description: 'Thinking like an attacker to build better defenses.',
    whyPiece: 'The king isn\'t the strongest piece. It\'s the one every other piece exists to protect.',
    links: [],
    related: ['piece_king_black', 'piece_bishop_black_02'],
    category: 'security',
  },
  {
    pieceName: 'piece_king_black',
    square: 'g7',
    skillName: 'Problem Solving',
    shortName: 'Problem Solving',
    description: 'Breaking down hard, ambiguous problems into solvable pieces.',
    whyPiece: 'The opposing king — the thing on the other side of every problem worth solving.',
    links: [],
    related: ['piece_king_white', 'piece_knight_black_01'],
    category: 'security',
  },
  {
    pieceName: 'piece_rook_black_01',
    square: 'c2',
    skillName: 'Network Security',
    shortName: 'Network Security',
    description: 'Securing infrastructure against intrusion, from firewalls to segmentation.',
    whyPiece: 'The rook holds ranks and files. It controls the lines everything else has to travel along.',
    links: [],
    related: ['piece_pawn_black_01', 'piece_pawn_black_04'],
    category: 'systems',
  },
  {
    pieceName: 'piece_pawn_black_01',
    square: 'b5',
    skillName: 'Linux & Systems Administration',
    shortName: 'Linux & Sysadmin',
    description: 'Comfortable operating and hardening Linux environments.',
    whyPiece: 'A pawn. The whole game is built on them, and they decide the endgame.',
    links: [],
    related: ['piece_rook_black_01', 'piece_pawn_black_05'],
    category: 'systems',
  },
  {
    pieceName: 'piece_pawn_black_04',
    square: 'g6',
    skillName: 'Cloud & DevOps (CI/CD)',
    shortName: 'Cloud & DevOps',
    description: 'Automating build, test, and deployment pipelines.',
    whyPiece: 'A pawn — quiet until it\'s the one carrying everything forward.',
    links: [],
    related: ['piece_rook_black_01', 'piece_pawn_black_03'],
    category: 'systems',
  },
  {
    pieceName: 'piece_pawn_white_01',
    square: 'g2',
    skillName: 'Python',
    shortName: 'Python',
    description: 'Scripting, tooling, and backend development.',
    whyPiece: 'A pawn: the first move you learn, and the one you keep making.',
    links: [],
    related: ['piece_pawn_black_05', 'piece_pawn_white_02'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_white_02',
    square: 'h4',
    skillName: 'TypeScript / JavaScript',
    shortName: 'TypeScript / JS',
    description: 'Building interactive, type-safe web applications.',
    whyPiece: 'A pawn on the wing, doing the work the front line depends on.',
    links: [],
    related: ['piece_pawn_white_01', 'piece_pawn_black_02'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_black_02',
    square: 'c6',
    skillName: 'SQL & Databases',
    shortName: 'SQL & Databases',
    description: 'Designing and querying relational data stores.',
    whyPiece: 'A pawn holding the centre — unglamorous, and everything rests on it.',
    links: [],
    related: ['piece_pawn_white_01', 'piece_rook_black_01'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_black_03',
    square: 'f7',
    skillName: 'Git & Version Control',
    shortName: 'Git & Version Control',
    description: 'Managing code history and collaborating cleanly.',
    whyPiece: 'The f7 pawn: famously the weakest square, and the one you learn to defend first.',
    links: [],
    related: ['piece_pawn_black_04', 'piece_pawn_black_05'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_black_05',
    square: 'h5',
    skillName: 'Scripting & Automation',
    shortName: 'Scripting & Automation',
    description: 'Automating repetitive tasks with Bash/Python.',
    whyPiece: 'A pawn that does the same small job over and over until it decides the position.',
    links: [],
    related: ['piece_pawn_white_01', 'piece_pawn_black_01'],
    category: 'languages',
  },
]

export type PieceSide = 'white' | 'black'

const PIECE_LETTERS: Record<string, string> = {
  king: 'K',
  queen: 'Q',
  rook: 'R',
  bishop: 'B',
  knight: 'N',
  pawn: 'P',
}

/**
 * The piece's letter in figurine algebraic notation — the same K/Q/R/B/N/P a
 * score sheet uses. Paired with the square it gives each row an unambiguous
 * pointer to one physical piece on the board.
 */
export function pieceLetter(pieceName: string): string {
  const kind = pieceName.split('_')[1]
  const letter = PIECE_LETTERS[kind]
  if (!letter) throw new Error(`unrecognised piece kind in "${pieceName}"`)
  return letter
}

export function pieceSide(pieceName: string): PieceSide {
  if (pieceName.includes('_white')) return 'white'
  if (pieceName.includes('_black')) return 'black'
  throw new Error(`no side in piece name "${pieceName}"`)
}

const HALF_BOARD = 0.20260828733444214
const STEP = (HALF_BOARD * 2) / 7
const PIECE_Y = 0.017392655834555626

export function squareToPosition(square: string): [number, number, number] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square[1]) - 1
  const x = -HALF_BOARD + file * STEP
  const z = -HALF_BOARD + rank * STEP
  return [x, PIECE_Y, z]
}
