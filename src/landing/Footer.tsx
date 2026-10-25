import { LINKS, FOOTER, CREDITS } from '../theme'
import './footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__row">
        <p className="footer__heading">{FOOTER.heading}</p>
        <nav className="footer__links">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="footer__rule" />
      <p className="footer__note">{FOOTER.note}</p>
      <p className="footer__credits">
        3D models:{' '}
        {CREDITS.map((c, i) => (
          <span key={c.title}>
            <a href={c.href} target="_blank" rel="noreferrer noopener">
              {c.title}
            </a>{' '}
            by {c.author} (
            <a href={c.licenseHref} target="_blank" rel="noreferrer noopener">
              {c.license}
            </a>
            {c.adapted ? ', adapted' : ''}){i < CREDITS.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </footer>
  )
}
