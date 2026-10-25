export type HourKey = 'skills' | 'projects' | 'writeups' | 'work'

export interface Section {
  key: HourKey
  index: string
  title: string
  descriptor: string
  /** Internal only. Never rendered — see the spec's global constraints. */
  hour: string
  tintFrom: string
  tintTo: string
  veil: string
  ink: string
}

/**
 * Four sections, four hours of one day. Skills is morning, Work & Education is
 * twilight — three of these palettes already existed before anyone noticed they
 * were times of day. Order is chronological so the tints run as a day passing
 * down the screen.
 */
export const SECTIONS: readonly Section[] = [
  {
    key: 'skills',
    index: '01',
    title: 'Skills',
    descriptor: 'Tooling, languages, and what I actually reach for.',
    hour: 'morning',
    tintFrom: 'rgba(200,226,190,.9)',
    tintTo: 'rgba(150,192,142,.55)',
    // Morning is the meadow itself: a deep, fresh green, dark enough to carry
    // the same light ink as every other hour.
    veil: 'rgba(52, 92, 58, 0.9)',
    ink: '#eef5e8',
  },
  {
    key: 'projects',
    index: '02',
    title: 'Projects',
    descriptor: "Things I've built, and a few I've taken apart.",
    hour: 'late afternoon',
    tintFrom: 'rgba(124,172,176,.9)',
    tintTo: 'rgba(74,124,132,.6)',
    // Late afternoon in shade: a deep teal. Brown on brown on brown never
    // read as clean, and teal is the complement of the hands' painted skin,
    // so the drawing comes forward instead of sinking into the ground.
    veil: 'rgba(40, 76, 84, 0.9)',
    ink: '#eaf2f1',
  },
  {
    key: 'writeups',
    index: '03',
    title: 'Writeups',
    descriptor: 'CTFs, boxes, and notes from the way in.',
    hour: 'golden hour',
    tintFrom: 'rgba(214,150,120,.9)',
    tintTo: 'rgba(166,102,96,.58)',
    veil: 'rgba(150,86,75,.91)',
    ink: '#fbeadf',
  },
  {
    key: 'work',
    index: '04',
    title: 'Work & Education',
    descriptor: "Where I've been and what I was doing there.",
    hour: 'twilight',
    tintFrom: 'rgba(186,150,196,.9)',
    tintTo: 'rgba(126,142,196,.6)',
    veil: 'rgba(90,102,153,.91)',
    ink: '#f4eef8',
  },
] as const

/*
 * Every veil is dark enough to carry light ink, so opening any card is the
 * same gesture: the title always travels from navy to near-white, and each
 * section's own small text stays legible on its ground.
 */

/** The landing's own veil — every section grades out of and back into this. */
export const LANDING_VEIL = 'rgba(245,250,254,.86)'

export const COPY = {
  name: 'Shubhankar Nehra',
  hook: 'I find the way in — before someone worse does.',
  /** The facts a recruiter needs in the first twenty seconds, under the hook. */
  summary: 'Computer science at Virginia Tech, class of 2028 · minor in cybersecurity',
  // From the software résumé, the one the site follows while the major is the
  // whole of computer science. Switch this back toward security when the
  // security résumé takes over.
  about:
    'I study computer science at Virginia Tech, with a minor in cybersecurity. ' +
    'This summer I built a CRM for a sales team of 20+, and before that I did ' +
    'backend work on two research projects. Security runs through ' +
    "most of it, and I'm working toward my CPTS. I build things and I break " +
    'them, usually in that order.',
  bio: 'wannabe pentester. foodie. dog and cat person. jack of all trades.',
} as const

export const MOTION = {
  openMs: 900,
  closeMs: 820,
  crossMs: 620,
  veilGradeMs: 1050,
  ease: 'cubic-bezier(.22,1,.36,1)',
  /** Cascade offsets, ms after the title starts moving. */
  stagger: { placeholder: 340, cross: 420 },
} as const

export interface Link {
  label: string
  href: string
}

/** From the résumé. The résumé itself is served from public/. */
export const LINKS: readonly Link[] = [
  { label: 'Email', href: 'mailto:nehrashubh6@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/nehrashubh' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nehrashubh' },
  { label: 'Résumé', href: '/shubhankarnehra_resume.pdf' },
] as const

/** "Say hello." is the author's. The internship line follows from a 2028 graduation. */
export const FOOTER = {
  heading: 'Say hello.',
  note: 'Blacksburg, VA · open to summer 2027 internships',
} as const

/** The 3D models the site is drawn with. The hands and the ship are CC BY 4.0,
 *  which asks for credit where the work is shown, a link to the licence, and
 *  word that it was changed: both were compressed, and the ship re-shaded.
 *  The chess set is CC0 and needs nothing, so it is credited as a courtesy. */
export const CREDITS = [
  {
    title: 'Damaged hands',
    author: 'Coffeek',
    href: 'https://sketchfab.com/3d-models/damaged-hands-57df95d1c6e746fd9c414948f71de937',
    license: 'CC BY 4.0',
    licenseHref: 'https://creativecommons.org/licenses/by/4.0/',
    adapted: true,
  },
  {
    title: 'Ship in Clouds',
    author: 'Bastien Genbrugge',
    href: 'https://sketchfab.com/3d-models/ship-in-clouds-c475323dc7f24e26ba2009c08c8e1941',
    license: 'CC BY 4.0',
    licenseHref: 'https://creativecommons.org/licenses/by/4.0/',
    adapted: true,
  },
  {
    title: 'Chess Set',
    author: 'Riley Queen',
    href: 'https://polyhaven.com/a/chess_set',
    license: 'CC0',
    licenseHref: 'https://creativecommons.org/publicdomain/zero/1.0/',
    adapted: false,
  },
] as const
