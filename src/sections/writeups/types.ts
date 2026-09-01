// Mirrors the shape emitted by scripts/sync-writeups.mjs → content/writeups/index.json.

export type Sprite = 'book' | 'writable_book' | 'written_book'

export interface WriteupLink {
  type: 'glossary' | 'writeup'
  slug: string
  label: string
}

export interface Writeup {
  slug: string
  title: string
  path: string
  date: string
  source: 'htb' | 'ctf' | 'practice'
  category: string
  categorySlug: string
  categoryLabel: string
  color: string
  difficulty: string
  status: 'in-progress' | 'complete'
  tags: string[]
  sprite: Sprite
  openable: boolean
  wordCount: number
  sections: string[]
  links: WriteupLink[]
  excerpt: string | null
}

export interface Category {
  slug: string
  label: string
  color: string
  order: number
  count: number
}

export interface GlossaryEntry {
  term: string
  definition: string
  category: string | null
}

export interface WriteupsIndex {
  generated: string
  counts: { writeups: number; openable: number; inProgress: number; glossaryTerms: number }
  categories: Category[]
  writeups: Writeup[]
  glossary: Record<string, GlossaryEntry>
}
