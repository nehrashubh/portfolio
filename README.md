# Shubhankar Nehra — portfolio

One Vite + React app. The landing is a scroll-driven descent through a sky
into a meadow; its four cards open four full-viewport sections, each built as
its own prototype and assembled here.

| Card | Section | Prototype it came from |
|------|---------|------------------------|
| 01 Skills | chess board and skills panel | `../chess-scene` |
| 02 Projects | painted hands and pill deck | `../project-display` |
| 03 Writeups | book shelf and reader, synced from the Obsidian vault | `../writeups` |
| 04 Work & Education | airship flight through cloud | `../journey-scene` |

The landing comes from `../hero`. Those five directories are archives now;
nothing here reads from them at runtime.

## Commands

    npm run dev              # dev server on http://localhost:5173
    npm run build            # tsc -b && vite build → dist/
    npm test                 # vitest, ~400 tests
    npm run lint             # oxlint
    npm run preview          # serve dist/ on http://localhost:4173

    npm run optimize:models  # rebuild public/models/*.glb from the prototypes
    npm run sync:writeups    # pull writeups from the Obsidian vault into content/
    npm run shoot -- all     # screenshots of every section, desktop + iPhone
                             # (preview server must be running)

## How it loads

- The landing bundle (~62 KB gzipped) contains no three.js. Nothing 3D is
  fetched until a card is opened.
- Each section is a lazy chunk. Hovering, focusing or pressing a card starts
  its download; opening it mounts it into the overlay's slot; closing
  unmounts it.
- three.js, fiber, drei and react-spring live in one shared chunk (~300 KB
  gzipped) that arrives with the first 3D section.
- Models are Draco-compressed with WebP textures at full resolution, built
  offline by `scripts/optimize-models.mjs` and committed:
  chess 548 KB, hands 258 KB, airship 2.1 MB.

There is deliberately no preloader.

## Layout

    src/
      landing/      Hero, About, Ground (the cards), Footer, PetalField, Landing
      lib/          pure maths: descent, flip, wind, petals
      sections/
        registry.ts       card key → lazy chunk; prefetchSection()
        SectionOverlay    the full-viewport frame every section mounts into
        SectionCard
        skills/ projects/ writeups/ journey/
      shared/       useReducedMotion, useMediaQuery, useDpr, hasWebGL, ErrorBoundary
      theme.ts      the four sections, their hours, copy, motion timings
    content/writeups/   synced markdown + index.json (never edited by hand)
    public/
      models/  draco/  fonts/  plates/  books/
    scripts/
      optimize-models.mjs  sync-writeups.mjs  shoot.mjs

## The section contract

A section is a default-exported component receiving `{ reducedMotion }`. It
fills the overlay's slot, pads its top by `--overlay-chrome` to stay clear of
the title and cross, never sets `position: fixed` on its root, never touches
`body`, and handles its own scrolling. An inner dialog that wants Escape
listens on `document` and calls `preventDefault()`; the overlay listens on
`window` and defers. Anything that loads a model calls `useGLTF.preload` at
module scope so the prefetch warms it. The full contract is in the assembly
spec, §3.

## Typography

Four faces, four jobs, all self-hosted woff2:

- **Gloock** — display titles everywhere
- **Cormorant Garamond 300** — long-form serif sentences
- **JetBrains Mono 400** — meta, labels, numerals, code
- **IBM Plex Sans** (variable) — small dense UI text inside the sections

## Still placeholder

These need the author before the site ships:

- `src/sections/projects/data/projects.ts` — all eight projects
- `src/sections/skills/fischerPosition.ts` — every skill's `links` list is empty
- `src/theme.ts` — `LINKS` for GitHub, LinkedIn and the résumé are `#`;
  the footer's "Say hello." and internship line were never confirmed
- `src/sections/journey/waypoints.ts` — the five stops, worth a read-through

## Attribution

Both Sketchfab models keep their credit embedded in the file (`asset.extras`),
and both require attribution wherever the site is published:

- `public/models/hands.glb` — "Damaged hands" by Coffeek
  (https://sketchfab.com/3d-models/damaged-hands-57df95d1c6e746fd9c414948f71de937),
  CC-BY-4.0.
- `public/models/ship.glb` — "Ship in Clouds" by Bastien Genbrugge
  (https://sketchfab.com/3d-models/ship-in-clouds-c475323dc7f24e26ba2009c08c8e1941),
  CC-BY-4.0.
- `public/models/chess.glb` — the chess-scene spec describes its source as a
  "Poly Haven-style" Blender export named `chess_set_2k.gltf`, which matches
  Poly Haven's CC0 chess set. Confirm before publishing.
- `public/draco/` — Google's Draco decoder, Apache-2.0.
- Fonts: Gloock, Cormorant Garamond, JetBrains Mono and IBM Plex Sans are all
  under the SIL Open Font License 1.1.
- The meadow plate began as a Minecraft screenshot; see the hero spec §9.
