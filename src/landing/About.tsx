import { COPY } from '../theme'
import './about.css'

export function About() {
  return (
    <div className="about">
      <p className="about__label">About</p>
      <p className="about__text">{COPY.about}</p>

      {/* Character first, then a rule, then the credentials a recruiter scans. */}
      <p className="about__bio">{COPY.bio}</p>
      <div className="about__rule" />
      <p className="about__facts">{COPY.facts.join(' · ')}</p>
    </div>
  )
}
