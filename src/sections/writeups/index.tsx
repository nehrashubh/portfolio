import { useEffect, useMemo, useState } from 'react'
import type { SectionProps } from '../SectionProps'
import { index } from './data/writeups'
import type { Writeup } from './types'
import Shelf from './components/Shelf'
import Reader from './components/Reader'
import Tooltip from './components/Tooltip'
import './writeups.css'

const SOURCE_LABEL: Record<string, string> = { htb: 'Hack The Box', ctf: 'CTF', practice: 'Practice' }

export default function WriteupsSection({ item }: SectionProps) {
  const [open, setOpen] = useState<Writeup | null>(null)
  const [hover, setHover] = useState<{ w: Writeup; rect: DOMRect } | null>(null)

  const bySlug = useMemo(() => Object.fromEntries(index.writeups.map((w) => [w.slug, w])), [])
  const openWriteup = (slug: string) => {
    const w = bySlug[slug]
    if (w?.openable) setOpen(w)
  }

  // `#writeups/<slug>` lands straight in the reader.
  useEffect(() => {
    if (!item) return
    const w = bySlug[item]
    setOpen(w?.openable ? w : null)
  }, [item, bySlug])

  return (
    <div className="writeups">
      {/* No page header: the overlay's title is the title and the card already
          carried the descriptor. The shelf starts under the chrome. */}
      <div className="writeups__page">
        <Shelf
          categories={index.categories}
          writeups={index.writeups}
          onOpen={setOpen}
          onHover={(w, rect) => setHover(w && rect ? { w, rect } : null)}
        />
      </div>

      {hover && !open && (
        <Tooltip anchor={hover.rect}>
          <div className="mc-tooltip__title">{hover.w.title}</div>
          <div className="mc-tooltip__ench">{hover.w.categoryLabel}</div>
          <div className="mc-tooltip__ench">
            {hover.w.difficulty} · {SOURCE_LABEL[hover.w.source] ?? hover.w.source}
          </div>
          <div className="mc-tooltip__lore mc-tooltip__tags">
            {hover.w.tags.map((t) => `#${t}`).join('  ')}
          </div>
          <div className="mc-tooltip__lore">{hover.w.date}</div>
          {hover.w.status === 'in-progress' && (
            <div className="mc-tooltip__lore mc-tooltip__lore--soft">Still being written…</div>
          )}
          {!hover.w.openable && hover.w.status !== 'in-progress' && (
            <div className="mc-tooltip__lore mc-tooltip__lore--soft">Nothing to read yet</div>
          )}
        </Tooltip>
      )}

      {open && (
        <Reader
          writeup={open}
          glossary={index.glossary}
          onClose={() => setOpen(null)}
          onOpenWriteup={openWriteup}
        />
      )}
    </div>
  )
}
