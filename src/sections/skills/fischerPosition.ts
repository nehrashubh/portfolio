export type CategoryKey = 'security' | 'systems' | 'languages'

/**
 * A piece of work backing a skill. An http(s) href opens in a new tab; a hash
 * such as "#writeups/massagold" travels within the site; no href is a plain
 * line, which is what a certification is.
 */
export type SkillLink = {
  label: string
  href?: string
  kind: 'project' | 'writeup' | 'work' | 'cert'
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
    skillName: 'Web Exploitation',
    shortName: 'Web Exploitation',
    description: 'Session hijacking, stored XSS and CSP bypasses — found, proven and written up.',
    whyPiece: 'The queen reaches furthest. Web is still where most of the way in is.',
    links: [
      { label: 'Massagold — stored XSS past a CSP', href: '#writeups/massagold', kind: 'writeup' },
      { label: 'Gatery — session hijacking', href: '#writeups/gatery', kind: 'writeup' },
      { label: 'Cyber Apocalypse 2026, top 9%', href: '#projects/cyber-apocalypse', kind: 'project' },
    ],
    related: ['piece_bishop_black_01', 'piece_knight_white_01'],
    category: 'security',
  },
  {
    pieceName: 'piece_bishop_black_01',
    square: 'b4',
    skillName: 'Penetration Testing',
    shortName: 'Penetration Testing',
    description: 'Hack The Box machines and practice targets, working toward the CPTS.',
    whyPiece: 'A bishop commits to one colour and covers it completely. Depth over breadth.',
    links: [
      { label: 'Boxes and practice writeups', href: '#writeups', kind: 'writeup' },
      { label: 'Cybersecurity learning journal', href: 'https://github.com/nehrashubh/Cybersecurity-Learning-Journal', kind: 'project' },
    ],
    related: ['piece_queen_white', 'piece_bishop_black_02'],
    category: 'security',
  },
  {
    pieceName: 'piece_bishop_black_02',
    square: 'b3',
    skillName: 'Reverse Engineering',
    shortName: 'Reverse Engineering',
    description: 'Ghidra and GDB, on CTF binaries and on code nobody documented.',
    whyPiece: 'The other bishop: the same reach, aimed at the squares the first one can never touch.',
    links: [
      { label: 'Cyber Apocalypse 2026 — reversing track', href: '#projects/cyber-apocalypse', kind: 'project' },
    ],
    related: ['piece_bishop_black_01', 'piece_king_white'],
    category: 'security',
  },
  {
    pieceName: 'piece_knight_white_01',
    square: 'e5',
    skillName: 'Access Control & RBAC',
    shortName: 'Access Control',
    description: 'Postgres row-level security across roles, and an RBAC refactor built to take new ones.',
    whyPiece: 'The knight moves through what blocks everything else. Access control decides which moves exist at all.',
    links: [
      { label: 'Faith CRM — row-level security across three roles', href: '#projects/faith-crm', kind: 'project' },
      { label: 'DBWorkout — RBAC refactor', href: '#work/dbworkout', kind: 'work' },
    ],
    related: ['piece_knight_black_01', 'piece_rook_black_01'],
    category: 'security',
  },
  {
    pieceName: 'piece_knight_black_01',
    square: 'c3',
    skillName: 'Backend Hardening',
    shortName: 'Backend Hardening',
    description: 'Defence in depth: global exception handling and sanitised error tracing, so no stack trace ever leaks.',
    whyPiece: 'The second knight, working the same way from the other side of the board.',
    links: [{ label: 'DBWorkout — secure authorization', href: '#work/dbworkout', kind: 'work' }],
    related: ['piece_knight_white_01', 'piece_king_black'],
    category: 'security',
  },
  {
    pieceName: 'piece_king_white',
    square: 'c1',
    skillName: 'Security Fundamentals',
    shortName: 'Fundamentals',
    description: 'ISC2 Certified in Cybersecurity and CompTIA A+ — the ground everything else stands on.',
    whyPiece: "The king isn't the strongest piece. It's the one every other piece exists to protect.",
    links: [
      { label: 'ISC2 Certified in Cybersecurity, 2025', kind: 'cert' },
      { label: 'CompTIA A+, 2025', kind: 'cert' },
    ],
    related: ['piece_king_black', 'piece_bishop_black_02'],
    category: 'security',
  },
  {
    pieceName: 'piece_king_black',
    square: 'g7',
    skillName: 'Network Analysis',
    shortName: 'Network Analysis',
    description: 'Wireshark and Active Directory: reading what the wire and the domain are actually doing.',
    whyPiece: 'The opposing king — the thing on the other side of every problem worth solving.',
    links: [],
    related: ['piece_king_white', 'piece_knight_black_01'],
    category: 'security',
  },
  {
    pieceName: 'piece_rook_black_01',
    square: 'c2',
    skillName: 'PostgreSQL & Supabase',
    shortName: 'PostgreSQL & Supabase',
    description: 'Schema design, row-level security policies, and a migration that kept every historical record.',
    whyPiece: 'The rook holds ranks and files. It controls the lines everything else has to travel along.',
    links: [
      { label: 'Faith CRM', href: '#projects/faith-crm', kind: 'project' },
      { label: 'Faith Innovations', href: '#work/faith', kind: 'work' },
    ],
    related: ['piece_pawn_black_05', 'piece_knight_white_01'],
    category: 'systems',
  },
  {
    pieceName: 'piece_pawn_black_01',
    square: 'b5',
    skillName: 'Docker & Virtualisation',
    shortName: 'Docker & VMs',
    description: 'Docker, VirtualBox and VMware, and deployments that behave the same on Windows and Linux.',
    whyPiece: 'A pawn. The whole game is built on them, and they decide the endgame.',
    links: [{ label: 'SpaceNet — environment-agnostic deployment', href: '#work/spacenet', kind: 'work' }],
    related: ['piece_pawn_black_04', 'piece_rook_black_01'],
    category: 'systems',
  },
  {
    pieceName: 'piece_pawn_black_04',
    square: 'g6',
    skillName: 'Linux & Tooling',
    shortName: 'Linux & Tooling',
    description: 'GDB, Git, and a shell I live in.',
    whyPiece: "A pawn — quiet until it's the one carrying everything forward.",
    links: [],
    related: ['piece_pawn_black_01', 'piece_pawn_black_02'],
    category: 'systems',
  },
  {
    pieceName: 'piece_pawn_white_01',
    square: 'g2',
    skillName: 'Python',
    shortName: 'Python',
    description: 'Flask backends, TensorFlow and OpenCV pipelines, and scripts for everything else.',
    whyPiece: 'A pawn: the first move you learn, and the one you keep making.',
    links: [
      { label: 'CancerScan — ResNet-50 on brain MRI', href: '#projects/cancerscan', kind: 'project' },
      { label: 'SpaceNet — Flask backend', href: '#work/spacenet', kind: 'work' },
    ],
    related: ['piece_pawn_white_02', 'piece_pawn_black_05'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_white_02',
    square: 'h4',
    skillName: 'TypeScript & Next.js',
    shortName: 'TypeScript & Next.js',
    description: 'Type-safe full-stack apps: Next.js 15 in production, React and three.js on this site.',
    whyPiece: 'A pawn on the wing, doing the work the front line depends on.',
    links: [
      { label: 'Faith CRM — Next.js 15', href: '#projects/faith-crm', kind: 'project' },
      { label: 'This site', href: '#projects/this-site', kind: 'project' },
    ],
    related: ['piece_pawn_white_01', 'piece_rook_black_01'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_black_02',
    square: 'c6',
    skillName: 'C, C++ & RISC-V Assembly',
    shortName: 'C / C++ / RISC-V',
    description: 'Systems work down to the instruction: C and C++, and RISC-V in Rars and Ripes.',
    whyPiece: 'A pawn holding the centre — unglamorous, and everything rests on it.',
    links: [],
    related: ['piece_pawn_black_03', 'piece_pawn_black_04'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_black_03',
    square: 'f7',
    skillName: 'Java',
    shortName: 'Java',
    description: 'Object-oriented design and data structures, the Virginia Tech way.',
    whyPiece: 'The f7 pawn: famously the weakest square, and the one you learn to defend first.',
    links: [],
    related: ['piece_pawn_black_02', 'piece_pawn_white_01'],
    category: 'languages',
  },
  {
    pieceName: 'piece_pawn_black_05',
    square: 'h5',
    skillName: 'SQL',
    shortName: 'SQL',
    description: 'Relational modelling and the queries behind two production backends.',
    whyPiece: 'A pawn that does the same small job over and over until it decides the position.',
    links: [{ label: 'Faith CRM — PostgreSQL', href: '#projects/faith-crm', kind: 'project' }],
    related: ['piece_rook_black_01', 'piece_pawn_white_01'],
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
