import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { HourKey } from '../theme'
import type { SectionProps } from './SectionProps'

type SectionModule = { default: ComponentType<SectionProps> }
type Loader = () => Promise<SectionModule>

interface SectionEntry {
  load: Loader
  Component: LazyExoticComponent<ComponentType<SectionProps>>
}

/** How long to wait before a second attempt at a chunk that did not arrive. */
const RETRY_DELAY_MS = 350

/**
 * Retries a failed dynamic import once.
 *
 * React caches a lazy component's promise, rejection included, so a single
 * dropped chunk — a flaky connection, a proxy, a dev server mid-restart —
 * is otherwise permanent for the life of the page. Retrying inside the same
 * promise means the lazy still resolves and nothing above it ever knows.
 *
 * A chunk that is genuinely gone (a redeploy changed its hash) fails both
 * times; that needs a reload, which is what the section's fallback offers.
 */
export function retryOnce<T>(load: () => Promise<T>, delayMs = RETRY_DELAY_MS): () => Promise<T> {
  return () =>
    load().catch((first: unknown) => {
      console.warn('[section] chunk failed, retrying once', first)
      return new Promise<T>((resolve, reject) => {
        setTimeout(() => load().then(resolve, reject), delayMs)
      })
    })
}

function entry(load: Loader): SectionEntry {
  const retrying = retryOnce(load)
  return { load: retrying, Component: lazy(retrying) }
}

/**
 * One dynamic import per card. Vite turns each into its own chunk, and the
 * three lazy chunks that import three.js get it split out into a shared chunk
 * of its own — so the landing bundle never carries a byte of WebGL.
 */
export const SECTION_REGISTRY: Record<HourKey, SectionEntry> = {
  skills: entry(() => import('./skills')),
  projects: entry(() => import('./projects')),
  writeups: entry(() => import('./writeups')),
  work: entry(() => import('./journey')),
}

/**
 * Warms a section before it is opened. import() is idempotent, so this is the
 * whole prefetch: the chunk downloads, its module-scope useGLTF.preload fires,
 * and the later open finds everything cached. Failure is swallowed — a
 * prefetch is a hint, and the real open will surface a real error.
 */
export function prefetchSection(key: HourKey): void {
  void SECTION_REGISTRY[key].load().catch(() => {})
}
