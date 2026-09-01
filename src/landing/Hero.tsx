import { COPY } from '../theme'
import './hero.css'

interface Props {
  /** 0 at the top of the descent, 1 at the ground. Drives the stretch. */
  progressRef?: React.RefObject<HTMLDivElement | null>
}

export function Hero({ progressRef }: Props) {
  return (
    <div className="hero" ref={progressRef}>
      <h1 className="hero__name">{COPY.name}</h1>
      <p className="hero__hook">{COPY.hook}</p>

      <div className="hero__scroll" aria-hidden="true">
        <span className="hero__scroll-label">Scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </div>
  )
}
