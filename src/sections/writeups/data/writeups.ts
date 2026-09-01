// Loads the synced content at build time. index.json drives the shelf; the raw
// markdown bodies are pulled in eagerly (there are only a handful) and keyed by
// slug so the reader can render one on demand.

import indexJson from '../../../../content/writeups/index.json'
import type { WriteupsIndex } from '../types'

export const index = indexJson as WriteupsIndex

const rawBodies = import.meta.glob('../../../../content/writeups/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Map "…/gatery.md" → "gatery".
const bodyBySlug: Record<string, string> = {}
for (const [path, body] of Object.entries(rawBodies)) {
  const slug = path.split('/').pop()!.replace(/\.md$/, '')
  bodyBySlug[slug] = body
}

/** Raw markdown body for a writeup, frontmatter stripped. */
export function bodyFor(slug: string): string {
  const raw = bodyBySlug[slug] ?? ''
  return raw.replace(/^---\n[\s\S]*?\n---\n?/, '').trim()
}
