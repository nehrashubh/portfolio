import { useId } from 'react';
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

  return (
    <div className={`pill${open ? ' is-open' : ''}`}>
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
      <span className="pill-head">
        <span className="pill-title" id={`${id}-title`}>
          {project.title}
        </span>
        <span className="pill-date" id={`${id}-date`}>
          {project.date}
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
    </div>
  );
}
