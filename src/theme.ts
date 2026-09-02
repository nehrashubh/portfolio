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
    tintFrom: 'rgba(247,232,196,.9)',
    tintTo: 'rgba(238,214,158,.55)',
    // Honey-gold: the meadow under early sun. Light enough to be a colour
    // rather than a shadow, so it carries dark ink — the one section whose
    // title darkens rather than lightens on the way in.
    veil: 'rgba(229, 184, 86, 0.9)',
    ink: '#5a3d12',
  },
  {
    key: 'projects',
    index: '02',
    title: 'Projects',
    descriptor: "Things I've built, and a few I've taken apart.",
    hour: 'late afternoon',
    tintFrom: 'rgba(196,140,88,.9)',
    tintTo: 'rgba(140,88,55,.6)',
    veil: 'rgba(96,60,38,.88)',
    ink: '#f7e6d5',
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
 * Three veils are dark enough to carry light ink; Skills is gold and carries
 * dark ink instead. Its title travels from navy to a deep brown rather than
 * to near-white — a smaller move, but mustard was the price of the larger
 * one and it was not worth paying.
 */

/** The landing's own veil — every section grades out of and back into this. */
export const LANDING_VEIL = 'rgba(245,250,254,.86)'

export const COPY = {
  name: 'Shubhankar Nehra',
  hook: 'I find the way in — before someone worse does.',
  /** The facts a recruiter needs in the first twenty seconds, under the hook. */
  summary: 'Computer science at Virginia Tech, class of 2028 · offensive security',
  about:
    'I study computer science at Virginia Tech, with a focus on security. ' +
    "Right now I'm working toward my CPTS and spending most of my time in " +
    'offensive security — red teaming is where I want to end up. I build ' +
    'things and I break them — usually in that order.',
  bio: 'wannabe pentester. foodie. dog and cat person. jack of all trades.',
  facts: [
    'Computer Science',
    'Cybersecurity minor',
    'Virginia Tech',
    'Class of 2028',
    'CompTIA A+',
    'ISC2 CC',
    'Blacksburg, VA',
  ],
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
  { label: 'Email', href: 'mailto:shubhankarnehra@vt.edu' },
  { label: 'GitHub', href: 'https://github.com/nehrashubh' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nehrashubh' },
  { label: 'Résumé', href: '/shubhankarnehra_resume.pdf' },
] as const

/** "Say hello." is the author's. The internship line follows from a 2028 graduation. */
export const FOOTER = {
  heading: 'Say hello.',
  note: 'Blacksburg, VA · open to summer 2027 internships',
} as const
