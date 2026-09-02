import { useCallback, useEffect, useRef, useState } from 'react'
import type { SectionProps } from '../SectionProps'
import { ChessScene, type ChessSceneHandle } from './ChessScene'
import { SkillsPanel, type EntrancePhase } from './SkillsPanel'
import { useMediaQuery } from '../../shared/useMediaQuery'
import { NARROW_LAYOUT, NARROW_QUERY, WIDE_LAYOUT } from './stageLayout'
import { ENTRANCE, ENTRANCE_DURATION_MS } from './entrance'
import './skills.css'

/** Matches --gap in skills.css: the panel's inset from the section's edges. */
const GAP_PX = 24

export default function SkillsSection({ reducedMotion, item }: SectionProps) {
  const sceneRef = useRef<ChessSceneHandle>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [entranceDone, setEntranceDone] = useState(false)
  const [reserve, setReserve] = useState(0)
  const isNarrow = useMediaQuery(NARROW_QUERY)

  // The board fills the whole section and the panel floats over its right
  // side, so the two read as one place rather than two columns. The camera
  // is told how much of the width the panel covers and frames the pieces in
  // what is left; the board's edge runs on behind the glass.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const update = () =>
      setReserve(isNarrow ? 0 : Math.ceil(panel.getBoundingClientRect().width + GAP_PX * 2))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(panel)
    return () => ro.disconnect()
  }, [isNarrow])

  const handleReady = useCallback(() => setReady(true), [])

  // Once the sequence has run, the index settles into its resting state so
  // returning from a skill doesn't replay the arrival.
  useEffect(() => {
    if (!ready || entranceDone) return
    const timer = setTimeout(
      () => setEntranceDone(true),
      ENTRANCE_DURATION_MS + ENTRANCE.cardFadeMs,
    )
    return () => clearTimeout(timer)
  }, [ready, entranceDone])

  // `#skills/<piece>` selects that piece once the board is up.
  useEffect(() => {
    if (ready && item) sceneRef.current?.selectPiece(item)
  }, [ready, item])

  const entrance: EntrancePhase =
    reducedMotion || entranceDone ? 'done' : ready ? 'playing' : 'waiting'

  return (
    <div className="skills-section" style={{ '--reserve': `${reserve}px` } as React.CSSProperties}>
      <div className="page">
        <div className="page__stage">
          <ChessScene
            ref={sceneRef}
            layout={isNarrow ? NARROW_LAYOUT : WIDE_LAYOUT}
            reserveRight={reserve}
            onPieceSelect={setSelectedName}
            onReady={handleReady}
          />
        </div>
        <div className="page__panel" ref={panelRef}>
          <SkillsPanel
            selectedName={selectedName}
            entrance={entrance}
            onSelectSkill={(pieceName) => sceneRef.current?.selectPiece(pieceName)}
            onClearSelection={() => sceneRef.current?.selectPiece(null)}
          />
        </div>
      </div>
    </div>
  )
}
