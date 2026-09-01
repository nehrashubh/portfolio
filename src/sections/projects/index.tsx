import { useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import type { SectionProps } from '../SectionProps';
import { useCarousel } from './carousel/useCarousel';
import { hasWebGL } from '../../shared/hasWebGL';
import { PROJECTS } from './data/projects';
import Deck from './deck/Deck';
import Scene from './scene/Scene';
import { useIsNarrowViewport } from './scene/useIsNarrowViewport';
import './projects.css';

export default function ProjectsSection(_props: SectionProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const narrow = useIsNarrowViewport();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Owned here because three things need it: Scene reads velocity to lean the
  // hands, Deck drives the frame loop, and the hook's own listeners have to be
  // suspended while a card is open or the deck slides around underneath it.
  // Only Deck may call advance().
  const carousel = useCarousel(PROJECTS.length, openIndex === null, hostRef);
  const webgl = hasWebGL();
  const { active: loading } = useProgress();

  return (
    <div ref={hostRef} className="scene-host" role="region" aria-label="Projects">
      {webgl && (
        <Scene narrow={narrow} stateRef={carousel.stateRef} dimmed={openIndex !== null} />
      )}
      {webgl && loading && <p className="scene-loading">Painting the hands…</p>}
      <Deck
        carousel={carousel}
        narrow={narrow}
        openIndex={openIndex}
        onOpenChange={setOpenIndex}
      />
    </div>
  );
}
