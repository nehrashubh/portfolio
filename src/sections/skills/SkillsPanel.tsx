import {
  CATEGORIES,
  FISCHER_POSITION,
  pieceLetter,
  pieceSide,
  type FischerPositionEntry,
} from './fischerPosition'
import { ENTRANCE, revealDelayMs } from './entrance'
import { useContentSwap } from './useContentSwap'
import { useReducedMotion } from '../../shared/useReducedMotion'
import type { CSSProperties } from 'react'

/**
 * 'waiting' holds the index hidden until the board is ready, 'playing' runs the
 * staggered arrival in step with the pieces landing, 'done' is the resting
 * state — so re-opening the index after reading a skill doesn't replay it.
 */
export type EntrancePhase = 'waiting' | 'playing' | 'done'

/**
 * The card leads the piece: it has settled by the time the piece finishes its
 * flight, so the reading matter is there before the motion stops.
 */
const SWAP = { outMs: 130, inMs: 280 }

export type SkillsPanelProps = {
  selectedName: string | null
  entrance: EntrancePhase
  onSelectSkill: (pieceName: string) => void
  onClearSelection: () => void
}

export function SkillsPanel({
  selectedName,
  entrance,
  onSelectSkill,
  onClearSelection,
}: SkillsPanelProps) {
  const reducedMotion = useReducedMotion()
  // `shown` lags `selectedName`, which is what lets the outgoing card fade
  // before its replacement arrives instead of cutting straight to it.
  const { shown, phase } = useContentSwap(
    selectedName,
    reducedMotion ? 0 : SWAP.outMs,
    reducedMotion ? 0 : SWAP.inMs,
  )
  const activeEntry = FISCHER_POSITION.find((entry) => entry.pieceName === shown) ?? null

  // The rows animate in CSS and the pieces animate in react-spring; feeding
  // both from ENTRANCE keeps a row and its piece to the same duration.
  const timings = {
    '--card-fade': `${ENTRANCE.cardFadeMs}ms`,
    '--item-in': `${ENTRANCE.settleMs}ms`,
    '--swap-out': `${SWAP.outMs}ms`,
    '--swap-in': `${SWAP.inMs}ms`,
  } as CSSProperties

  return (
    <section className={`skills skills--${entrance}`} style={timings} aria-label="Skills">
      {/* Keyed on the shown skill so the incoming half restarts each swap. */}
      <div className={`swap swap--${phase}`} key={shown ?? 'index'}>
        {activeEntry ? (
          <SkillDetail entry={activeEntry} onSelectSkill={onSelectSkill} onClear={onClearSelection} />
        ) : (
          <SkillIndex onSelectSkill={onSelectSkill} />
        )}
      </div>
    </section>
  )
}

function SkillIndex({ onSelectSkill }: { onSelectSkill: (pieceName: string) => void }) {
  return (
    <div className="index">
      <header className="index__head">
        <p className="eyebrow">{FISCHER_POSITION.length} pieces</p>
        {/* No title here: the overlay's own "Skills" is the heading. */}
        <p className="index__lede">
          Every piece on the board is one skill. Select one — here or on the set — to read it.
        </p>
      </header>
      <div className="index__columns">
        {CATEGORIES.map((category) => {
          const entries = FISCHER_POSITION.filter((entry) => entry.category === category.key)
          return (
            <div className="column" key={category.key}>
              <h3 className="column__label">
                {category.label}
                <span className="column__count">{entries.length}</span>
              </h3>
              <ul className="column__items">
                {entries.map((entry) => (
                  <li
                    key={entry.pieceName}
                    className="column__item"
                    style={{ animationDelay: `${revealDelayMs(entry.pieceName)}ms` }}
                  >
                    <SkillChip entry={entry} onSelect={() => onSelectSkill(entry.pieceName)} />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <p className="index__legend">
        Badges give the piece in algebraic notation — filled for white, outlined for black.
        Hover the set to find any of them.
      </p>
    </div>
  )
}

function SkillChip({ entry, onSelect }: { entry: FischerPositionEntry; onSelect: () => void }) {
  return (
    <button type="button" className="chip" onClick={onSelect}>
      <span className={`badge badge--${pieceSide(entry.pieceName)}`} aria-hidden="true">
        {pieceLetter(entry.pieceName)}
      </span>
      <span className="chip__name">{entry.shortName}</span>
    </button>
  )
}

function SkillDetail({
  entry,
  onSelectSkill,
  onClear,
}: {
  entry: FischerPositionEntry
  onSelectSkill: (pieceName: string) => void
  onClear: () => void
}) {
  const category = CATEGORIES.find((c) => c.key === entry.category)
  const related = entry.related
    .map((pieceName) => FISCHER_POSITION.find((e) => e.pieceName === pieceName))
    .filter((e): e is FischerPositionEntry => Boolean(e))

  return (
    <article className="detail">
      <button type="button" className="detail__back" onClick={onClear}>
        All skills
      </button>

      <p className="eyebrow">
        {category?.label} · {pieceLetter(entry.pieceName)}
        {entry.square}
      </p>
      <h2 className="detail__title">{entry.skillName}</h2>
      <p className="detail__desc">{entry.description}</p>
      <p className="detail__why">{entry.whyPiece}</p>

      <section className="detail__block">
        <h3 className="detail__label">Selected work</h3>
        {entry.links.length > 0 ? (
          <ul className="links">
            {entry.links.map((link) => (
              <li key={link.href}>
                <a className="link" href={link.href} target="_blank" rel="noreferrer noopener">
                  <span className="link__kind">{link.kind}</span>
                  <span className="link__label">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail__empty">Nothing linked here yet.</p>
        )}
      </section>

      {related.length > 0 && (
        <section className="detail__block">
          <h3 className="detail__label">Related pieces</h3>
          <ul className="related">
            {related.map((other) => (
              <li key={other.pieceName}>
                <SkillChip entry={other} onSelect={() => onSelectSkill(other.pieceName)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
