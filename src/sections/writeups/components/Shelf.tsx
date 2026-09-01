import type { Writeup, Category } from '../types'
import Book from './Book'
import './shelf.css'

interface Props {
  categories: Category[]
  writeups: Writeup[]
  onOpen: (w: Writeup) => void
  onHover: (w: Writeup | null, rect: DOMRect | null) => void
}

// One section per category, in kill-chain order, each holding its books. Empty
// categories still show — the shelf is meant to fill in over time.
export default function Shelf({ categories, writeups, onOpen, onHover }: Props) {
  const cats = [...categories].sort((a, b) => a.order - b.order)
  return (
    <div className="shelf">
      {cats.map((cat) => {
        const books = writeups.filter((w) => w.categorySlug === cat.slug)
        return (
          <section className="shelf__cat" key={cat.slug} data-empty={books.length === 0 || undefined}>
            <div className="shelf__header">
              <span className="shelf__swatch" style={{ background: cat.color }} aria-hidden="true" />
              <h2 className="shelf__label">{cat.label}</h2>
              <span className="shelf__count">{books.length || '—'}</span>
              <span className="shelf__rule" />
            </div>
            {books.length > 0 ? (
              <ul className="shelf__books">
                {books.map((w) => (
                  <li key={w.slug} className="shelf__book">
                    <Book writeup={w} onOpen={onOpen} onHover={onHover} />
                    <span className="shelf__book-title">{w.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="shelf__empty">nothing here yet</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
