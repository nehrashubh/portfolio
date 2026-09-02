import { COPY } from '../theme'
import './about.css'

export function About() {
  return (
    <div className="about">
      <p className="about__label">About</p>
      <p className="about__text">{COPY.about}</p>

      {/* Character, in his own words. The credentials sit under the hero now,
          so they are not repeated here. */}
      <p className="about__bio">{COPY.bio}</p>
    </div>
  )
}
