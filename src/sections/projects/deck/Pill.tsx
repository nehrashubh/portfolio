import { useId, useLayoutEffect, useRef } from 'react';
import type { Project } from '../data/types';
import ArrowLink from './ArrowLink';
import CloseCross from './CloseCross';

/**
 * One pill — which is also the card.
 *
 * The head row is built once and never rebuilt: it is the pill's entire content
 * when closed and the card's masthead when open. Nothing reflows or crossfades
 * across the morph, only the box around it grows, and that is what makes it read
 * as the pill unfolding rather than a modal appearing over it.
 *
 * The body is always in the DOM for the same reason — a `max-height` transition
 * needs something to reveal — so it is hidden from assistive tech while closed
 * and its link is taken out of the tab order.
 */
export default function Pill({
  project,
  open,
  onActivate,
  onClose,
}: {
  project: Project;
  open: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const id = useId();
  const pillRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);

  // The open card is as tall as its content, measured, not guessed. The morph
  // needs a height to animate to, and every fixed one tried (34cqw, then 88cqw
  // on a phone) was right for one length of blurb on one shape of screen and
  // left the link sitting on the card's bottom edge on the rest. A hidden copy
  // of the open card, at the open width, is measured instead, and kept current
  // as the viewport changes.
  useLayoutEffect(() => {
    const pill = pillRef.current;
    const sizer = sizerRef.current;
    const body = sizer?.querySelector<HTMLElement>('.pill-body');
    if (!pill || !sizer || !body) return;
    const measure = () => {
      pill.style.setProperty('--open-h', `${Math.ceil(sizer.offsetHeight)}px`);
      pill.style.setProperty('--open-body-h', `${Math.ceil(body.offsetHeight)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sizer);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={pillRef} className={`pill${open ? ' is-open' : ''}`}>
        {open && <CloseCross onClose={onClose} />}
        {/*
          An overlay covering the whole pill, not a button wrapped around the text.
          Wrapping the head row made the hit area one line tall inside an 11.8cqw
          pill, so only the title and date were clickable while the hover ring
          promised the whole shape.

          It takes its accessible name from the title and date by reference rather
          than an aria-label, so there is no second copy of the text to drift.
        */}
        <button
          type="button"
          className="pill-hit"
          onClick={onActivate}
          aria-expanded={open}
          aria-labelledby={`${id}-title ${id}-date`}
        />
        <PillContent project={project} idBase={id} open={open} />
      </div>
      {/* The measuring copy. Never seen, never reached: aria-hidden and inert. */}
      <div ref={sizerRef} className="pill is-open pill--sizer" aria-hidden="true" inert>
        <PillContent project={project} open />
      </div>
    </>
  );
}

function PillContent({
  project,
  idBase,
  open,
}: {
  project: Project;
  /** Only the real pill carries ids; the measuring copy must not repeat them. */
  idBase?: string;
  open: boolean;
}) {
  return (
    <>
      {/* Date above the title, both centred: a long title has the whole pill
          to itself and the date sits in the same place on every pill. */}
      <span className="pill-head">
        <span className="pill-date" id={idBase && `${idBase}-date`}>
          {project.date}
        </span>
        <span className="pill-title" id={idBase && `${idBase}-title`}>
          {project.title}
        </span>
      </span>
      {/* inert as well as aria-hidden: aria-hidden keeps a closed pill's blurb
          from being announced, and inert keeps its link out of the tab order. */}
      <div className="pill-body" aria-hidden={!open} inert={!open}>
        <p className="pill-role">{project.role}</p>
        <p className="pill-blurb">{project.description}</p>
        <ul className="pill-chips">
          {project.stack.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>
        <ArrowLink url={project.url} label={project.linkLabel ?? 'View project'} />
      </div>
    </>
  );
}
