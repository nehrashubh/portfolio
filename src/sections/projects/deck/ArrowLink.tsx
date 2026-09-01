import { useState } from 'react';
import { externalHref } from './externalHref';

/**
 * Bare text and an arrow, no button chrome.
 *
 * On hover the arrow *changes sides* — it leaves from the right of the label and
 * arrives on the left, tilting and crossfading in flight while the label shifts
 * across to make room. Two fixed slots whose widths animate: width carries the
 * layout shift, opacity carries visibility, so the component's overall width
 * never changes and the label appears to travel.
 *
 * Hover is a class rather than `:hover` because a CSS `:hover` keyframe cannot
 * reverse on mouse-out, and the rule under the label has to sweep back the way it
 * came. `null` is the third state — never yet hovered — without which the leave
 * animation would fire once on mount.
 */
export default function ArrowLink({ url, label }: { url: string; label: string }) {
  const [hot, setHot] = useState<boolean | null>(null);
  const href = externalHref(url);

  const inner = (
    <>
      <span className="arrow-slot is-left">
        <span aria-hidden="true">&rarr;</span>
      </span>
      <span className="arrow-label">{label}</span>
      <span className="arrow-slot is-right">
        <span aria-hidden="true">&rarr;</span>
      </span>
    </>
  );

  const className = `arrow-link${hot === true ? ' is-hot' : hot === false ? ' is-cold' : ''}`;

  if (!href) return <span className={className}>{inner}</span>;

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
    >
      {inner}
    </a>
  );
}
