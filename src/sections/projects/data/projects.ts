import type { Project } from './types';

/**
 * Placeholder content. Replace these entries with real projects — nothing
 * outside this file knows anything about the content.
 *
 * The roles and stacks deliberately vary in length: a one-word role next to a
 * four-word one, a single chip next to four, so the card's layout is exercised
 * by the placeholders rather than only by the real content later.
 */
export const PROJECTS: readonly Project[] = [
  {
    title: 'Placeholder One',
    date: '2026',
    role: 'Solo build',
    stack: ['TypeScript', 'WebGL', 'React'],
    description:
      'A short stand-in description of roughly the length a real project blurb will run to on the card.',
    url: 'https://example.com/placeholder-one',
  },
  {
    title: 'Placeholder Two',
    date: '2026',
    role: 'Frontend, 3 of 5',
    stack: ['Rust', 'WebAssembly', 'Vite', 'Vitest'],
    description:
      'Second stand-in entry. Swap in a real title, blurb, date and repo link when the content is ready.',
    url: 'https://example.com/placeholder-two',
  },
  {
    title: 'Placeholder Three',
    date: '2025',
    role: 'Design and build',
    stack: ['Svelte', 'D3'],
    description:
      'Third stand-in entry, kept deliberately obvious so nothing here is mistaken for finished copy.',
    url: 'https://example.com/placeholder-three',
  },
  {
    title: 'Placeholder Four',
    date: '2025',
    role: 'Solo build',
    stack: ['Go'],
    description:
      'Fourth stand-in entry with a description long enough to wrap onto more than a single line.',
    url: 'https://example.com/placeholder-four',
  },
  {
    title: 'Placeholder Five',
    date: '2025',
    role: 'Backend, pair',
    stack: ['Postgres', 'Python', 'Redis'],
    description:
      'Fifth stand-in entry. Real descriptions should stay under about 140 characters to fit the panel.',
    url: 'https://example.com/placeholder-five',
  },
  {
    title: 'Placeholder Six',
    date: '2025',
    role: 'Lead, team of four',
    stack: ['Kotlin', 'GraphQL'],
    description:
      'Sixth stand-in entry, present mainly so the wrap-around loop has enough cards to be convincing.',
    url: 'https://example.com/placeholder-six',
  },
  {
    title: 'Placeholder Seven',
    date: '2024',
    role: 'Solo build',
    stack: ['Three.js', 'GLSL', 'Vite'],
    description:
      'Seventh stand-in entry. Titles are kept short so they never collide with the date on the top row.',
    url: 'https://example.com/placeholder-seven',
  },
  {
    title: 'Placeholder Eight',
    date: '2024',
    role: 'Contract',
    stack: ['Elixir', 'Phoenix'],
    description:
      'Eighth and final stand-in entry, closing the loop back around to the first card when scrolled.',
    url: 'https://example.com/placeholder-eight',
  },
];
