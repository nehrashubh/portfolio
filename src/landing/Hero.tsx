import { COPY, LINKS } from '../theme'
import './hero.css'

interface Props {
  /** 0 at the top of the descent, 1 at the ground. Drives the stretch. */
  progressRef?: React.RefObject<HTMLDivElement | null>
}

/** The two links a recruiter reaches for before scrolling anything. */
const CORNER = LINKS.filter((l) => l.label === 'Résumé' || l.label === 'GitHub')

export function Hero({ progressRef }: Props) {
  return (
    <>
      <div className="hero" ref={progressRef}>
        <h1 className="hero__name">{COPY.name}</h1>
        <p className="hero__hook">{COPY.hook}</p>
        <p className="hero__summary">{COPY.summary}</p>

        <div className="hero__scroll" aria-hidden="true">
          <span className="hero__scroll-label">Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </div>

      {/* Outside .hero, so the descent's stretch does not pull them with the
          copy. Top-right, where every section keeps its cross. */}
      <nav className="hero__links" aria-label="Résumé and GitHub">
        {CORNER.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </>
  )
}
