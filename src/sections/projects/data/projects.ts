import type { Project } from './types';

/**
 * From the résumé, newest first. Faith CRM, DBWorkout and SpaceNet have no
 * public repository — the first is client work, the other two research — so
 * they deep-link to where the site tells their story instead.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'faith-crm',
    title: 'Faith CRM',
    date: '2026',
    role: 'Full-stack, solo',
    stack: ['Next.js 15', 'TypeScript', 'Supabase', 'PostgreSQL'],
    description:
      'A CRM for a medical-equipment sales team, replacing spreadsheets: row-level security across three roles, two pipelines, and a migration off Zoho Bigin.',
    url: '#work/faith',
    linkLabel: 'On the journey',
  },
  {
    slug: 'cyber-apocalypse-2026',
    title: 'Cyber Apocalypse 2026',
    date: '2026',
    role: 'Team, HackTheBox CTF',
    stack: ['Web', 'Reversing', 'HackTheBox'],
    description:
      '571st of 6,744 teams. Hijacked sessions through broken session management in Gatery; stored XSS past a CSP with a Google APIs JSONP bypass in Massagold.',
    url: '#writeups/massagold',
    linkLabel: 'Read the writeups',
  },
  {
    slug: 'spacenet',
    title: 'SpaceNet',
    date: '2026',
    role: 'Backend, research',
    stack: ['Flask', 'PostgreSQL', 'Next.js'],
    description:
      'Satellite-constellation simulation. Moved auth from a user-based model to direct resource access, and made deployment identical on Windows and Linux.',
    url: '#work/spacenet',
    linkLabel: 'On the journey',
  },
  {
    slug: 'dbworkout',
    title: 'DBWorkout',
    date: '2025',
    role: 'Backend, research',
    stack: ['RBAC', 'Hardening', 'Error tracing'],
    description:
      'Hardening a research backend: exception handling that never leaks a stack trace, sanitised error tracing keyed by UUID, and an RBAC refactor built to grow.',
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
      'A CNN for brain-MRI tumour detection: ResNet-50 transfer learning, tuned to 92% validation accuracy. A hospital in Greater Noida asked to deploy it.',
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
