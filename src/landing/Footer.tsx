import { LINKS, FOOTER } from '../theme'
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
    </footer>
  )
}
