import { useEffect, useRef } from 'react';
import { wrapOffset } from '../carousel/carousel';
import type { useCarousel } from '../carousel/useCarousel';
import { PROJECTS } from '../data/projects';
import { useReducedMotion as usePrefersReducedMotion } from '../../../shared/useReducedMotion';
import { layoutForSlot } from './deckLayout';
import Pill from './Pill';
import './deck.css';

export default function Deck({
  carousel,
  narrow,
  openIndex,
  onOpenChange,
}: {
  carousel: ReturnType<typeof useCarousel>;
  narrow: boolean;
  openIndex: number | null;
  onOpenChange: (index: number | null) => void;
}) {
  const { stateRef, advance, focusOn } = carousel;
  const reduced = usePrefersReducedMotion();
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoveredRef = useRef(-1);
  // Read inside the frame loop, which never re-runs, so props would be stale.
  const narrowRef = useRef(narrow);
  narrowRef.current = narrow;
  const openRef = useRef(openIndex);
  openRef.current = openIndex;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      const open = openRef.current !== null;
      // The only caller of advance() in the app. HandsModel reads velocity but
      // must never step the deck, or it moves at double speed. While a card is
      // open the deck is frozen rather than merely uninteractive.
      const { position } = open ? stateRef.current : advance(dt);

      for (let index = 0; index < PROJECTS.length; index++) {
        const slot = slotRefs.current[index];
        if (!slot) continue;

        if (open) {
          const isOpen = index === openRef.current;
          if (isOpen) slot.style.transform = 'translate(0cqw, 0cqw) scale(1)';
          slot.style.opacity = isOpen ? '1' : '0';
          slot.style.zIndex = isOpen ? '60' : '1';
          // Hidden, not merely transparent. An opacity-0 pill still takes
          // clicks and still holds a tab stop: clicking beside the open card
          // would hit an invisible neighbour, which both swallowed the
          // click-outside-to-close — its target is inside a .pill — and quietly
          // set a travel target the deck then executed on close.
          slot.style.visibility = isOpen ? 'visible' : 'hidden';
          slot.classList.remove('is-hot');
          continue;
        }

        const d = wrapOffset(index, position, PROJECTS.length);
        const layout = layoutForSlot(d, narrowRef.current);

        slot.style.transform = `translate(${layout.x}cqw, ${layout.y}cqw) scale(${layout.scale})`;
        slot.style.opacity = String(layout.opacity);
        slot.style.zIndex = String(layout.zIndex);
        slot.style.visibility = layout.visible ? 'visible' : 'hidden';
        slot.classList.toggle('is-focused', layout.focused);
        slot.classList.toggle('is-hot', layout.focused && hoveredRef.current === index);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [advance, stateRef]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Consumed: the section overlay listens on window, which fires after
      // document, and must not close the whole section for this keypress.
      event.preventDefault();
      onOpenChange(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openIndex, onOpenChange]);

  return (
    <div
      className={`deck-host${reduced ? ' is-reduced' : ''}`}
      data-testid="deck-host"
      onClick={(event) => {
        if (openIndex === null) return;
        if (!(event.target as HTMLElement).closest('.pill')) onOpenChange(null);
      }}
    >
      {PROJECTS.map((project, index) => (
        <div
          key={project.title}
          className="pill-slot"
          ref={(node) => {
            slotRefs.current[index] = node;
          }}
          onPointerEnter={() => {
            hoveredRef.current = index;
          }}
          onPointerLeave={() => {
            if (hoveredRef.current === index) hoveredRef.current = -1;
          }}
        >
          <Pill
            project={project}
            open={openIndex === index}
            onActivate={() => {
              // Only Deck knows a pill's slot distance, so the branch lives here:
              // the focused pill opens, a neighbour is travelled to.
              const d = wrapOffset(index, stateRef.current.position, PROJECTS.length);
              if (Math.abs(d) < 0.5) onOpenChange(index);
              else focusOn(index);
            }}
            onClose={() => onOpenChange(null)}
          />
        </div>
      ))}
    </div>
  );
}
