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
    npm test                 # vitest, ~430 tests
    npm run lint             # oxlint
    npm run preview          # serve dist/ on http://localhost:4173
    npm run preview:pages    # serve dist/ the way Cloudflare Pages will,
                             # with public/_headers and _redirects applied

    npm run deploy           # build and upload to Cloudflare Pages
    npm run og               # re-render public/og.jpg from the live hero
    npm run optimize:models  # rebuild public/models/*.glb from the prototypes
    npm run sync:writeups    # pull writeups from the Obsidian vault into content/
    npm run shoot -- all     # screenshots of every section, desktop + iPhone
                             # (preview server must be running)

## Deploying

The site is static and deploys to Cloudflare Pages, where the domain already
lives. `wrangler.toml` names the project `shubhankarnehra` and points at `dist/`.

First time only:

    npx wrangler login              # opens the browser, one click
    npm run deploy                  # creates the project and uploads

Then, in the Cloudflare dashboard: Workers & Pages → shubhankarnehra →
Custom domains → add `shubhankarnehra.com` (and `www`). DNS is on Cloudflare,
so it activates in a minute. Every later `npm run deploy` goes live at once.

`public/_headers` sets caching (hashed assets immutable, everything else a
day at the edge) and a Content-Security-Policy that the whole site runs
under — `wasm-unsafe-eval` for the Draco decoder, `blob:` for the textures
three.js unpacks from the models. `public/_redirects` gives `/resume`,
`/cv`, `/github` and `/linkedin` as short links.

## How it loads

- The landing bundle (~62 KB gzipped) contains no three.js. Nothing 3D is
  fetched until a card is opened.
- Scrolling the landing is damped: the scene and the panels follow the
  scrollbar at a walking pace (`src/landing/Landing.tsx`, DAMPING and
  MAX_SPEED), so a flick cannot throw the descent.
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

## Content

Everything on the site comes from the résumé at `public/shubhankarnehra_resume.pdf`:

- `src/sections/projects/data/projects.ts` — the six projects
- `src/sections/skills/fischerPosition.ts` — fifteen skills, each linked to the
  work that proves it
- `src/sections/journey/waypoints.ts` — the five stops
- `src/theme.ts` — facts, footer links, copy
- `content/writeups/` — synced from the Obsidian vault by `npm run sync:writeups`

Still to confirm: the footer's "open to summer 2027 internships" line, and a
public repository for this site once it has one (the "This site" card links
to the GitHub profile until then).

## URLs

The open section is the URL fragment, so every section and every thing in
one is a link:

    /#skills                   /#skills/piece_queen_white
    /#projects                 /#projects/faith-crm
    /#writeups                 /#writeups/massagold
    /#work                     /#work/dbworkout

The back button leaves a section; closing one clears the fragment without
adding history. Skills use these to point at projects, writeups and journey
stops. `src/sections/route.ts` parses them.

Short links: `/resume`, `/cv`, `/github`, `/linkedin`.

Link previews come from the meta tags in `index.html` and `public/og.jpg`,
which `npm run og` renders from the hero itself. The favicon is one petal.

## The airship scene

Two things make the low-poly cloud asset read as weather rather than cut
paper, both in code, neither touching the model:

- `src/sections/journey/cloudShell.ts` welds the shell's split vertices and
  recomputes normals, so shading rolls across the mass instead of catching
  each facet. The material stays **opaque** on purpose — fading it by view
  angle softens the silhouette but sorts after everything opaque, and the
  dashed route line vanishes behind it.
- Scene fog in the clouds' own dusk violet dissolves the remaining hard
  silhouette into distance. `FOG_NEAR` sits past the camera's orbit radius
  so the ship itself is never hazed.

Each stop is a glass card beside its ring, with a brass edge on the side
facing the marker instead of a leader line. Below 700px there is no room
beside a marker, so the card docks to the foot of the frame above the year
rail. The rail sits above the transparent scroll layer — below it, its
buttons are unclickable.

## Plates

`tools/cut_branch.py` keys the blossom branch off its green screen (source in
`../hero/assets/plates/`) and writes `public/plates/branch.webp`. The sky and
ground plates are carried over from the hero prototype as built there.

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
