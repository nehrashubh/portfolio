import { SECTIONS, type HourKey } from '../theme'

/** Where the URL fragment points: a section, and optionally one thing in it. */
export interface Route {
  key: HourKey
  /** A writeup slug, a project slug, a journey stop id or a chess piece name. */
  item?: string
}

const KEYS = new Set<string>(SECTIONS.map((s) => s.key))
const PATTERN = /^#([a-z]+)(?:\/([a-z0-9_-]+))?$/i

/**
 * `#skills`, `#writeups/massagold`, `#work/dbworkout`. Anything else — an
 * empty hash, an unknown section, a stray in-page anchor — is no route at
 * all, and the landing stays as it is.
 */
export function parseRoute(hash: string): Route | null {
  const m = PATTERN.exec(hash.trim())
  if (!m) return null
  const key = m[1].toLowerCase()
  if (!KEYS.has(key)) return null
  const item = m[2]?.toLowerCase()
  return item ? { key: key as HourKey, item } : { key: key as HourKey }
}

export function formatRoute(key: HourKey, item?: string): string {
  return item ? `#${key}/${item}` : `#${key}`
}

export function sameRoute(a: Route | null, b: Route | null): boolean {
  if (a === null || b === null) return a === b
  return a.key === b.key && (a.item ?? '') === (b.item ?? '')
}
