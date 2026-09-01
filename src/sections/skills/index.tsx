import { useCallback, useEffect, useRef, useState } from 'react'
import type { SectionProps } from '../SectionProps'
import { ChessScene, type ChessSceneHandle } from './ChessScene'
import { SkillsPanel, type EntrancePhase } from './SkillsPanel'
import { useMediaQuery } from '../../shared/useMediaQuery'
import { NARROW_LAYOUT, NARROW_QUERY, WIDE_LAYOUT } from './stageLayout'
import { ENTRANCE, ENTRANCE_DURATION_MS } from './entrance'
import './skills.css'

export default function SkillsSection({ reducedMotion, item }: SectionProps) {
  const sceneRef = useRef<ChessSceneHandle>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [entranceDone, setEntranceDone] = useState(false)
  const isNarrow = useMediaQuery(NARROW_QUERY)

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
    <div className="skills-section">
      <div className="page">
        <div className="page__stage">
          <ChessScene
            ref={sceneRef}
            layout={isNarrow ? NARROW_LAYOUT : WIDE_LAYOUT}
            onPieceSelect={setSelectedName}
            onReady={handleReady}
          />
        </div>
        <div className="page__panel">
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
