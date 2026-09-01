import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { HourKey } from '../theme'
import type { SectionProps } from './SectionProps'

type SectionModule = { default: ComponentType<SectionProps> }
type Loader = () => Promise<SectionModule>

interface SectionEntry {
  load: Loader
  Component: LazyExoticComponent<ComponentType<SectionProps>>
}

function entry(load: Loader): SectionEntry {
  return { load, Component: lazy(load) }
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
