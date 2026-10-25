import type { Project } from './types';

/**
 * From the software résumé, newest first. Faith CRM, DBWorkout and SpaceNet
 * have no public repository — the first is client work, the other two
 * research — so they deep-link to where the site tells their story instead.
 * OneVoice was a team hackathon build; Devpost has the demo and the writeup.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'onevoice',
    title: 'OneVoice',
    date: '2026',
    role: 'Team of 4, VTHacks',
    stack: ['Python', 'PyTorch', 'CUDA'],
    description:
      'Tap a face on camera and hear only that person, live, in your earbuds. I root-caused three GPU crashes to run the model at 212–223 ms a window.',
    url: 'https://devpost.com/software/onevoice-r50odl',
    linkLabel: 'See it on Devpost',
  },
  {
    slug: 'faith-crm',
    title: 'Faith CRM',
    date: '2026',
    role: 'Full-stack, solo',
    stack: ['Next.js 15', 'TypeScript', 'Supabase', 'PostgreSQL'],
    description:
      "Replaced a 20+ person sales team's spreadsheets: an average 5.5 hours a week back each, full adoption in 60 days, row-level security for three roles.",
    url: '#work/faith',
    linkLabel: 'On the journey',
  },
  {
    slug: 'cyber-apocalypse',
    title: 'Cyber Apocalypse',
    date: '2026',
    role: 'Team, HackTheBox CTF',
    stack: ['Web', 'Reversing', 'HackTheBox'],
    description:
      'My first CTF: 571st of 6,744 teams, top 9%. I solved two web challenges, a session hijack in Gatery and stored XSS past a CSP in Massagold.',
    url: '#writeups/massagold',
    linkLabel: 'Read the writeups',
  },
  {
    slug: 'spacenet',
    title: 'SpaceNet',
    date: '2026',
    role: 'Backend, research',
    stack: ['Python', 'Docker', 'Mininet', 'pytest'],
    description:
      'A testbed for 1,800+ moving low-Earth-orbit satellites. I brought it to Windows for the first time and stubbed its 18-hour run so tests take under 100 ms.',
    url: '#work/spacenet',
    linkLabel: 'On the journey',
  },
  {
    slug: 'dbworkout',
    title: 'DBWorkout',
    date: '2025',
    role: 'Backend, research',
    stack: ['Flask', 'PostgreSQL', 'RBAC', 'Hardening'],
    description:
      'A gamified SQL platform for 300+ students. As its only security developer I hardened 60+ endpoints and swapped hard-coded role checks for RBAC decorators.',
    url: '#work/dbworkout',
    linkLabel: 'On the journey',
  },
  {
    slug: 'cancerscan',
    title: 'CancerScan',
    date: '2025',
    role: 'Team, FusionHacks 2',
    stack: ['Python', 'TensorFlow', 'OpenCV', 'ResNet-50'],
    description:
      'A CNN for brain-MRI tumour detection: ResNet-50 transfer learning, tuned to 92% validation accuracy. A hospital in Greater Noida asked about deploying it.',
    url: 'https://github.com/nehrashubh/Cancer-Scan',
    linkLabel: 'View on GitHub',
  },
  {
    slug: 'this-site',
    title: 'This site',
    date: '2026',
    role: 'Solo build',
    stack: ['React', 'three.js', 'TypeScript', 'Vite'],
    description:
      'The page you are on: a damped descent through a sky, three WebGL scenes lazy-loaded behind glass cards, and writeups synced from an Obsidian vault.',
    url: 'https://github.com/nehrashubh',
    linkLabel: 'GitHub',
  },
];
